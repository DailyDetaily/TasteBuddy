package com.tastebuddy.android.data

import com.tastebuddy.android.BuildConfig
import com.tastebuddy.android.domain.*
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.Base64
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

data class BackendConfig(
    val url: String = BuildConfig.TB_SUPABASE_URL,
    val publishableKey: String = BuildConfig.TB_SUPABASE_PUBLISHABLE_KEY,
    val chatGPTEntryURL: String = BuildConfig.TB_CHATGPT_ENTRY_URL,
    val allowLoopback: Boolean = false,
) {
    val configured
        get() = url.isNotBlank() && publishableKey.isNotBlank() && !url.startsWith("__SET_")

    fun validate() {
        check(configured) { "계정 연결 설정을 준비 중이에요. 게스트로 기록을 시작할 수 있어요." }
        val parsed = url.toHttpUrlOrNull()
        require(
            parsed != null &&
                (parsed.isHttps || allowLoopback && parsed.host in listOf("localhost", "127.0.0.1"))
        ) {
            "계정 연결 주소가 올바르지 않아요."
        }
        val role = runCatching {
            AppJson.parseToJsonElement(
                    String(Base64.getUrlDecoder().decode(publishableKey.split('.')[1]))
                )
                .jsonObject
                .string("role")
        }
            .getOrNull()
        require(!publishableKey.startsWith("sb_secret_") && role != "service_role") {
            "앱 전용 공개 키가 필요합니다."
        }
    }

    fun validChatGPTURL(): String? {
        val parsed = chatGPTEntryURL.toHttpUrlOrNull() ?: return null
        return chatGPTEntryURL.takeIf {
            parsed.isHttps &&
                parsed.host == "chatgpt.com" &&
                parsed.username.isEmpty() &&
                parsed.password.isEmpty() &&
                parsed.query == null &&
                parsed.fragment == null &&
                parsed.encodedPath.startsWith("/plugins/") &&
                parsed.encodedPath.length > 9
        }
    }
}

@Serializable
data class AuthUser(
    val id: String,
    val email: String? = null,
    val isAnonymous: Boolean = false,
    val emailConfirmedAt: String? = null,
)

@Serializable
data class AuthSession(
    val accessToken: String,
    val refreshToken: String,
    val expiresAt: Long,
    val user: AuthUser,
)

@Serializable data class PendingOAuth(val verifier: String, val createdAt: Long)

@Serializable
data class PublicProfile(
    val id: String,
    val displayName: String? = null,
    val nickname: String? = null,
    val avatarPath: String? = null,
    val isFriend: Boolean = false,
) {
    val title
        get() =
            displayName?.takeIf { it.isNotBlank() }
                ?: nickname?.takeIf { it.isNotBlank() }
                ?: "공개 프로필"

    val handle
        get() = "@${nickname?.trim()?.trim('@')?.takeIf { it.isNotEmpty() } ?: "tastebuddy"}"
}

class BackendClient(
    val config: BackendConfig,
    private val storage: SessionStorage,
    private val oauthStorage: SessionStorage,
    private val http: OkHttpClient =
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(25, TimeUnit.SECONDS)
            .build(),
) {
    private val mutableSession = MutableStateFlow<AuthSession?>(null)
    val sessionState = mutableSession.asStateFlow()
    private val refreshMutex = Mutex()
    private val sessionMutationMutex = Mutex()
    private var sessionGeneration = 0L // Accessed only while holding sessionMutationMutex.
    private val oauthMutex = Mutex()

    suspend fun restore(): AuthSession? =
        withContext(Dispatchers.IO) {
            val restoredGeneration = sessionMutationMutex.withLock {
                storage.read()?.let { raw ->
                    val restored = AppJson.decodeFromString<AuthSession>(raw)
                    if (mutableSession.value != restored) {
                        sessionGeneration++
                        mutableSession.value = restored
                    }
                }
                sessionGeneration
            }
            if (mutableSession.value == null || !config.configured)
                return@withContext mutableSession.value
            try {
                session()
            } catch (error: ApiException) {
                if (error.status == 400 || error.status == 401) {
                    sessionMutationMutex.withLock {
                        if (sessionGeneration == restoredGeneration) {
                            storage.write(null)
                            sessionGeneration++
                            mutableSession.value = null
                        }
                        mutableSession.value
                    }
                } else throw error
            }
        }

    private fun request(
        path: String,
        method: String = "GET",
        body: JsonElement? = null,
        token: String? = null,
        headers: Map<String, String> = emptyMap(),
    ): Request {
        config.validate()
        val builder =
            Request.Builder()
                .url(config.url.trimEnd('/') + path)
                .header("apikey", config.publishableKey)
        if (token != null) builder.header("Authorization", "Bearer $token")
        headers.forEach { (k, v) -> builder.header(k, v) }
        return builder.method(method, body?.requestBody()).build()
    }

    private suspend fun accept(raw: JsonElement, expectedSession: AuthSession? = null): AuthSession =
        withContext(Dispatchers.IO) { sessionMutationMutex.withLock {
            val root = raw.jsonObject
            val user = root.obj("user")
            val session =
                AuthSession(
                    root.string("access_token"),
                    root.string("refresh_token"),
                    root["expires_at"]?.jsonPrimitive?.longOrNull
                        ?: (Instant.now().epochSecond +
                            (root["expires_in"]?.jsonPrimitive?.longOrNull ?: 3600)),
                    AuthUser(
                        user.string("id"),
                        user["email"]?.jsonPrimitive?.contentOrNull,
                        user["is_anonymous"]?.jsonPrimitive?.booleanOrNull ?: false,
                        user["email_confirmed_at"]?.jsonPrimitive?.contentOrNull,
                    ),
                )
            require(
                session.accessToken.isNotBlank() &&
                    session.refreshToken.isNotBlank() &&
                    session.user.id.isNotBlank()
            ) {
                "계정 응답을 확인하지 못했어요."
            }
            if (expectedSession != null) check(mutableSession.value == expectedSession) { "로그인 계정이 바뀌어 세션 갱신을 멈췄어요." }
            storage.write(AppJson.encodeToString(session))
            sessionGeneration++
            mutableSession.value = session
            session
        } }

    suspend fun session(): AuthSession = refreshMutex.withLock {
        val current = mutableSession.value ?: error("Taste Buddy 계정에 로그인해 주세요.")
        if (current.expiresAt > Instant.now().epochSecond + 60) current
        else {
            val refreshed = http.json(request(
                "/auth/v1/token?grant_type=refresh_token", "POST",
                buildJsonObject { put("refresh_token", current.refreshToken) },
            ))
            check(mutableSession.value == current) { "로그인 계정이 바뀌어 세션 갱신을 멈췄어요." }
            require(refreshed.jsonObject.obj("user").string("id") == current.user.id) { "세션 갱신 응답의 계정이 달라 저장하지 않았어요." }
            accept(refreshed, expectedSession = current)
        }
    }

    suspend fun ensureAnonymousSession(): AuthSession {
        if (mutableSession.value != null) return session()
        return accept(
            http.json(
                request(
                    "/auth/v1/signup",
                    "POST",
                    buildJsonObject { put("data", buildJsonObject {}) },
                )
            )
        )
    }

    suspend fun sendOTP(email: String, linkCurrentProfile: Boolean = false) {
        val clean = email.trim()
        require(clean.matches(Regex("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))) { "올바른 이메일을 입력해 주세요." }
        if (linkCurrentProfile) {
            val current = ensureAnonymousSession()
            http.json(
                request(
                    "/auth/v1/user",
                    "PUT",
                    buildJsonObject { put("email", clean) },
                    current.accessToken,
                )
            )
        } else
            http.json(
                request(
                    "/auth/v1/otp",
                    "POST",
                    buildJsonObject {
                        put("email", clean)
                        put("create_user", true)
                    },
                )
            )
    }

    suspend fun verifyOTP(
        email: String,
        token: String,
        linkCurrentProfile: Boolean = false,
    ): AuthSession {
        require(token.trim().matches(Regex("[0-9]{6,10}"))) { "이메일로 받은 인증 코드를 확인해 주세요." }
        val oldUser = if (linkCurrentProfile) session().user.id else null
        val raw =
            http.json(
                request(
                    "/auth/v1/verify",
                    "POST",
                    buildJsonObject {
                        put("email", email.trim())
                        put("token", token.trim())
                        put("type", if (linkCurrentProfile) "email_change" else "email")
                    },
                )
            )
        if (oldUser != null)
            require(raw.jsonObject.obj("user").string("id") == oldUser) {
                "로그인 계정이 바뀌었어요. 계정을 확인한 뒤 다시 시도해 주세요."
            }
        return accept(raw)
    }

    suspend fun googleSignInURL(): String =
        withContext(Dispatchers.IO) {
            config.validate()
            val verifier =
                Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(ByteArray(48).also { SecureRandom().nextBytes(it) })
            val challenge =
                Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(
                        MessageDigest.getInstance("SHA-256")
                            .digest(verifier.toByteArray(Charsets.US_ASCII))
                    )
            oauthStorage.write(
                AppJson.encodeToString(PendingOAuth(verifier, Instant.now().epochSecond))
            )
            (config.url.trimEnd('/') + "/auth/v1/authorize")
                .toHttpUrl()
                .newBuilder()
                .addQueryParameter("provider", "google")
                .addQueryParameter("redirect_to", AUTH_REDIRECT)
                .addQueryParameter("code_challenge", challenge)
                .addQueryParameter("code_challenge_method", "s256")
                .build()
                .toString()
        }

    suspend fun handleCallback(url: String): AuthSession = oauthMutex.withLock {
        val uri = java.net.URI(url)
        require(uri.scheme == "tastebuddy" && uri.host == "auth" && uri.path == "/callback") {
            "로그인 주소가 올바르지 않아요."
        }
        val query = ("https://callback.invalid/?" + uri.rawQuery.orEmpty()).toHttpUrl()
        require(query.queryParameter("error") == null) { "로그인을 완료하지 못했어요. 다시 시도해 주세요." }
        val code =
            query.queryParameter("code")?.takeIf { it.isNotBlank() } ?: error("인증 코드를 확인하지 못했어요.")
        val pending =
            withContext(Dispatchers.IO) {
                oauthStorage.read()?.let { AppJson.decodeFromString<PendingOAuth>(it) }
            } ?: error("앱에서 로그인을 다시 시작해 주세요.")
        require(Instant.now().epochSecond - pending.createdAt in 0..600) {
            "로그인 시간이 지났어요. 다시 시작해 주세요."
        }
        val result =
            accept(
                http.json(
                    request(
                        "/auth/v1/token?grant_type=pkce",
                        "POST",
                        buildJsonObject {
                            put("auth_code", code)
                            put("code_verifier", pending.verifier)
                        },
                    )
                )
            )
        withContext(Dispatchers.IO) { oauthStorage.write(null) }
        result
    }

    suspend fun signOut() {
        val (current, expectedGeneration) = sessionMutationMutex.withLock { mutableSession.value to sessionGeneration }
        if (current != null && config.configured)
            runCatching {
                http.json(
                    request(
                        "/auth/v1/logout?scope=local",
                        "POST",
                        buildJsonObject {},
                        current.accessToken,
                    )
                )
            }
        clearSession(expectedGeneration)
    }

    suspend fun deleteAccount(expectedOwner: String? = null) {
        val current = session()
        val expectedGeneration = sessionMutationMutex.withLock {
            check(mutableSession.value == current && (expectedOwner == null || current.user.id.equals(expectedOwner, ignoreCase = true))) {
                "로그인 계정이 바뀌어 계정 삭제를 멈췄어요."
            }
            sessionGeneration
        }
        http.json(
            request("/functions/v1/delete-account", "POST", buildJsonObject {}, current.accessToken)
        )
        clearSession(expectedGeneration)
    }

    private suspend fun clearSession(expectedGeneration: Long) = withContext(Dispatchers.IO) {
        sessionMutationMutex.withLock {
            check(sessionGeneration == expectedGeneration) { "로그인 세션이 바뀌어 현재 계정의 기기 기록은 변경하지 않았어요." }
            storage.write(null)
            oauthStorage.write(null)
            sessionGeneration++
            mutableSession.value = null
        }
    }

    suspend fun updateIdentity(identity: ProfileIdentity) {
        val current = session()
        val name = identity.name.trim()
        val nickname = identity.nickname.trim().trim('@')
        require(name.isNotBlank() && nickname.isNotBlank()) { "이름과 닉네임을 입력해 주세요." }
        val values = buildJsonObject {
            put("display_name", name)
            put("nickname", nickname)
        }
        http.json(
            request(
                "/rest/v1/profiles?on_conflict=id",
                "POST",
                JsonObject(values + ("id" to JsonPrimitive(current.user.id))),
                current.accessToken,
                mapOf("Prefer" to "resolution=merge-duplicates,return=minimal"),
            )
        )
        http.json(
            request(
                "/auth/v1/user",
                "PUT",
                buildJsonObject { put("data", values) },
                current.accessToken,
            )
        )
    }

    suspend fun currentIdentity(): PublicProfile? {
        val current = session()
        val url =
            "/rest/v1/profiles?select=id,display_name,nickname,avatar_path&id=eq.${current.user.id}&limit=1"
        return http
            .json(request(url, token = current.accessToken))
            .jsonArray
            .firstOrNull()
            ?.jsonObject
            ?.let(::profile)
    }

    suspend fun searchPeople(query: String): List<PublicProfile> {
        if (!config.configured || query.trim().trim('@').isBlank()) return emptyList()
        val token = mutableSession.value?.let { session().accessToken }
        val payload = buildJsonObject { put("search_query", query.trim().trim('@')) }
        val raw =
            try {
                http.json(
                    request("/rest/v1/rpc/search_profiles_by_identity", "POST", payload, token)
                )
            } catch (error: ApiException) {
                if (error.code != "PGRST202") throw error
                http.json(
                    request("/rest/v1/rpc/search_profiles_by_nickname", "POST", payload, token)
                )
            }
        return raw.jsonArray.map { profile(it.jsonObject) }
    }

    private fun profile(raw: JsonObject) =
        PublicProfile(
            raw.string("id"),
            raw["display_name"]?.jsonPrimitive?.contentOrNull,
            raw["nickname"]?.jsonPrimitive?.contentOrNull,
            raw["avatar_path"]?.jsonPrimitive?.contentOrNull,
            raw["is_friend"]?.jsonPrimitive?.booleanOrNull ?: false,
        )

    suspend fun publishAnalysis(snapshot: SensorySnapshot, expectedUserID: String): String {
        val current = session()
        require(current.user.id == expectedUserID) { "로그인 계정이 바뀌었어요. 화면을 다시 열어 주세요." }
        require(!current.user.isAnonymous && !current.user.email.isNullOrBlank()) {
            "Taste Buddy 계정에 이메일을 연결한 뒤 다시 시도해 주세요."
        }
        val entryURL = config.validChatGPTURL() ?: error("ChatGPT 연결을 준비 중이에요.")
        val payload = analysisExport(snapshot)
        require(payload.getValue("includedExperienceCount").jsonPrimitive.int > 0) {
            "식사 기록의 감각 평가를 남긴 뒤 분석을 요청해 주세요."
        }
        require(payload.toString().toByteArray(Charsets.UTF_8).size < 480_000) {
            "분석 자료가 너무 큽니다. 기록을 확인한 뒤 다시 시도해 주세요."
        }
        require(mutableSession.value?.user?.id == expectedUserID) { "로그인 계정이 바뀌었어요." }
        http.json(
            request(
                "/rest/v1/chatgpt_analysis_exports?on_conflict=user_id",
                "POST",
                buildJsonObject {
                    put("user_id", expectedUserID)
                    put("payload", payload)
                },
                current.accessToken,
                mapOf("Prefer" to "resolution=merge-duplicates,return=minimal"),
            )
        )
        return entryURL
    }

    suspend fun removeAnalysisExport(expectedUserID: String) {
        val current = session()
        require(current.user.id == expectedUserID) { "로그인 계정이 바뀌었어요." }
        http.json(
            request(
                "/rest/v1/chatgpt_analysis_exports?user_id=eq.$expectedUserID",
                "DELETE",
                token = current.accessToken,
            )
        )
    }

    suspend fun accountTransport(expectedOwner: String): NativeAccountTransport {
        val pinned = session()
        require(pinned.user.id.lowercase() == expectedOwner && !pinned.user.isAnonymous) {
            "로그인한 계정에서 Android 기록 백업을 사용할 수 있어요."
        }
        return object : NativeAccountTransport {
            override fun checkOwner() {
                check(mutableSession.value?.user?.id?.lowercase() == expectedOwner && mutableSession.value?.user?.isAnonymous == false) {
                    "계정이 바뀌어 백업을 멈췄어요. 원래 계정의 기록은 보관되어 있어요."
                }
            }
            private fun admitted(path: String, method: String = "GET", body: JsonElement? = null): Request {
                checkOwner()
                return request(path, method, body, pinned.accessToken)
            }
            override suspend fun fetch(): NativeRemoteArchive? {
                val rows = http.json(admitted("/rest/v1/native_account_data?select=user_id,payload,revision&user_id=eq.$expectedOwner&limit=1")).jsonArray
                checkOwner()
                val row = rows.firstOrNull()?.jsonObject ?: return null
                require(row.string("user_id").lowercase() == expectedOwner) { "다른 계정의 응답이어서 복원을 멈췄어요." }
                val revision = row.getValue("revision").jsonPrimitive.long
                require(revision > 0)
                return NativeRemoteArchive(row.getValue("payload").jsonObject, revision)
            }
            override suspend fun downloadPhoto(filename: String): ByteArray = withContext(Dispatchers.IO) {
                require(AndroidBackupContract.photoPattern.matches(filename))
                http.newCall(admitted("/storage/v1/object/authenticated/native-dining-photos/$expectedOwner/$filename")).execute().use { response ->
                    check(response.isSuccessful) { "사진 원본을 불러오지 못했어요. 기기 기록은 보존되어 있어요." }
                    require((response.body?.contentLength() ?: 0) <= 6_291_456) { "사진 원본의 용량을 확인하지 못했어요." }
                    val source = response.body?.byteStream() ?: error("사진 원본을 읽지 못했어요.")
                    val output = java.io.ByteArrayOutputStream()
                    val buffer = ByteArray(16_384)
                    while (true) {
                        val count = source.read(buffer)
                        if (count < 0) break
                        require(output.size() + count <= 6_291_456) { "사진 원본의 용량을 확인하지 못했어요." }
                        output.write(buffer, 0, count)
                    }
                    val bytes = output.toByteArray()
                    require(bytes.size in 4..6_291_456)
                    checkOwner()
                    bytes
                }
            }
            override suspend fun uploadPhoto(filename: String, bytes: ByteArray) {
                require(AndroidBackupContract.photoPattern.matches(filename) && bytes.size in 4..6_291_456)
                val lease = http.json(admitted("/rest/v1/rpc/begin_account_media_upload", "POST", buildJsonObject {})).jsonPrimitive.content
                try {
                    val upload = admitted("/storage/v1/object/native-dining-photos/$expectedOwner/$filename")
                        .newBuilder().post(bytes.toRequestBody("image/jpeg".toMediaType())).header("x-upsert", "false").build()
                    try { http.json(upload) }
                    catch (error: ApiException) {
                        if (error.status !in listOf(400, 409)) throw error
                        val existing = downloadPhoto(filename)
                        require(existing.contentEquals(bytes)) { "같은 이름의 다른 사진이 있어 백업을 멈췄어요." }
                    }
                } finally {
                    // Finish using the pinned credential, even after UI sign-out. No token is taken from a new owner.
                    http.json(request("/rest/v1/rpc/finish_account_media_upload", "POST", buildJsonObject { put("upload_id", lease) }, pinned.accessToken))
                }
                checkOwner()
            }
            override suspend fun save(snapshot: JsonObject, expectedRevision: Long): Long {
                val response = try {
                    http.json(admitted("/rest/v1/rpc/save_native_account_data", "POST", buildJsonObject {
                        put("p_user_id", expectedOwner); put("p_payload", snapshot); put("p_expected_revision", expectedRevision)
                    }))
                } catch (error: ApiException) {
                    if (error.code == "40001") throw AccountBackupConflict()
                    throw error
                }
                checkOwner()
                val revision = response.jsonPrimitive.long
                require(revision == expectedRevision + 1) { "백업 저장 결과를 확인하지 못했어요. 원본은 기기에 보존되어 있어요." }
                return revision
            }
        }
    }

    companion object {
        const val AUTH_REDIRECT = "tastebuddy://auth/callback"

        fun analysisExport(snapshot: SensorySnapshot, now: Instant = Instant.now()): JsonObject {
            val selected =
                (snapshot.observations.map { it.experienceID to it.recordedAt } +
                        snapshot.unresolved.map { it.experienceID to it.recordedAt })
                    .sortedWith(
                        compareByDescending<Pair<String, String>> {
                                parseInstant(it.second) ?: Instant.MIN
                            }
                            .thenBy { it.first }
                    )
                    .map { it.first }
                    .distinct()
                    .take(20)
                    .toSet()
            return buildJsonObject {
                put("schemaVersion", 1)
                put("engineVersion", snapshot.engineVersion)
                put("generatedAt", now.toString())
                put("totalExperienceCount", snapshot.completedExperienceCount)
                put("includedExperienceCount", selected.size)
                put(
                    "observations",
                    JsonArray(
                        snapshot.observations
                            .filter { it.experienceID in selected }
                            .map { o ->
                                buildJsonObject {
                                    put("id", o.id)
                                    put("experienceID", o.experienceID)
                                    put("foodName", o.foodName)
                                    put("recordedAt", o.recordedAt)
                                    put("kind", o.kind)
                                    put("attribute", o.attribute ?: o.attributeLabel)
                                    put("value", o.value.sensoryText)
                                    put("scale", o.scale)
                                    put("target", o.target)
                                    put("phase", o.phase)
                                    put("sourceField", o.sourceField)
                                    put("phrase", o.phrase)
                                    put("sourceSpans", AppJson.encodeToJsonElement(o.sourceSpans))
                                    o.reference?.let { put("reference", it) }
                                    put(
                                        "combinationComponents",
                                        AppJson.encodeToJsonElement(o.combinationComponents),
                                    )
                                }
                            }
                    ),
                )
                put(
                    "unresolved",
                    JsonArray(
                        snapshot.unresolved
                            .filter { it.experienceID in selected }
                            .map { o ->
                                buildJsonObject {
                                    put("experienceID", o.experienceID)
                                    put("foodName", o.foodName)
                                    put("recordedAt", o.recordedAt)
                                    put("sourceField", o.sourceField)
                                    put("phrase", o.phrase)
                                    put("reason", o.reason)
                                }
                            }
                    ),
                )
                put(
                    "limits",
                    AppJson.encodeToJsonElement(
                        snapshot.limits +
                            listOf(
                                "최근 최대 20개 기록 중 감각 평가와 원문 근거가 있는 자료입니다. 전체 식생활을 대표하지 않습니다.",
                                "같은 experienceID의 관찰은 하나의 기록에서 나온 근거입니다. 강도와 호감은 다릅니다.",
                                "앱에서 분석을 요청한 시점의 자료입니다. 이후 수정·삭제는 다시 분석을 요청해야 반영됩니다.",
                            )
                    ),
                )
            }
        }
    }
}
