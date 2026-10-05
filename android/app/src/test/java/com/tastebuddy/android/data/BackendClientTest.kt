package com.tastebuddy.android.data

import com.tastebuddy.android.domain.*
import java.time.Instant
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class BackendClientTest {
    private class MemoryStorage : SessionStorage {
        var value: String? = null

        override fun read() = value

        override fun write(value: String?) {
            this.value = value
        }
    }

    private lateinit var server: MockWebServer
    private lateinit var session: MemoryStorage
    private lateinit var oauth: MemoryStorage
    private lateinit var backend: BackendClient

    @Before
    fun setup() {
        server = MockWebServer()
        server.start()
        session = MemoryStorage()
        oauth = MemoryStorage()
        backend =
            BackendClient(
                BackendConfig(
                    server.url("/").toString(),
                    "sb_publishable_test",
                    "https://chatgpt.com/plugins/taste-buddy",
                    allowLoopback = true,
                ),
                session,
                oauth,
            )
    }

    @After
    fun close() {
        server.shutdown()
    }

    private fun response(body: String, code: Int = 200) =
        MockResponse()
            .setResponseCode(code)
            .setHeader("Content-Type", "application/json")
            .setBody(body)

    private fun authBody(
        id: String = "test-user",
        expires: Long = Instant.now().epochSecond + 3600,
    ) =
        """{"access_token":"test-access","refresh_token":"test-refresh","expires_at":$expires,"user":{"id":"$id","email":"sample@example.com","is_anonymous":false,"email_confirmed_at":"2026-01-01T00:00:00Z"}}"""

    private fun request() = server.takeRequest(2, TimeUnit.SECONDS) ?: error("요청이 없습니다")

    @Test
    fun otpUsesEmailContractAndDoesNotCreateSessionBeforeVerification() = runBlocking {
        server.enqueue(response("{}"))
        backend.sendOTP(" sample@example.com ")
        val send = request()
        assertEquals("/auth/v1/otp", send.path)
        assertEquals("sb_publishable_test", send.getHeader("apikey"))
        assertEquals(
            "sample@example.com",
            AppJson.parseToJsonElement(send.body.readUtf8()).jsonObject.string("email"),
        )
        assertNull(session.value)
        server.enqueue(response(authBody()))
        backend.verifyOTP("sample@example.com", "123456")
        val verify = request()
        assertEquals(
            "email",
            AppJson.parseToJsonElement(verify.body.readUtf8()).jsonObject.string("type"),
        )
        assertEquals("test-user", backend.sessionState.value?.user?.id)
        assertNotNull(session.value)
    }

    @Test
    fun rejectedOTPLeavesExistingSessionUnchanged() = runBlocking {
        server.enqueue(response("""{"error_code":"otp_expired"}""", 403))
        assertTrue(
            runCatching { backend.verifyOTP("sample@example.com", "123456") }.exceptionOrNull()
                is ApiException
        )
        assertNull(session.value)
    }

    @Test
    fun concurrentExpiredSessionRequestsRefreshOnce() = runBlocking {
        session.value =
            AppJson.encodeToString(AuthSession("old", "refresh", 1, AuthUser("test-user")))
        server.enqueue(response(authBody()))
        backend.restore()
        val a = async { backend.session() }
        val b = async { backend.session() }
        assertEquals(a.await(), b.await())
        assertEquals("/auth/v1/token?grant_type=refresh_token", request().path)
        assertEquals(1, server.requestCount)
    }

    @Test
    fun oauthUsesPkceAndRejectsAnUninitiatedCallback() = runBlocking {
        assertTrue(
            runCatching { backend.handleCallback("tastebuddy://auth/callback?code=untrusted") }
                .isFailure
        )
        val url = backend.googleSignInURL().toHttpUrl()
        assertEquals(BackendClient.AUTH_REDIRECT, url.queryParameter("redirect_to"))
        assertEquals("s256", url.queryParameter("code_challenge_method"))
        assertFalse(url.queryParameter("code_challenge").isNullOrBlank())
        assertNotNull(oauth.value)
        server.enqueue(response(authBody()))
        backend.handleCallback("tastebuddy://auth/callback?code=test-code")
        val body = AppJson.parseToJsonElement(request().body.readUtf8()).jsonObject
        assertEquals("test-code", body.string("auth_code"))
        assertTrue(body.string("code_verifier").length >= 43)
        assertNull(oauth.value)
        assertTrue(
            runCatching { backend.handleCallback("tastebuddy://auth/callback?code=test-code") }
                .isFailure
        )
    }

    @Test
    fun expiredOauthIsNotExchanged() = runBlocking {
        oauth.value =
            AppJson.encodeToString(PendingOAuth("verifier", Instant.now().epochSecond - 601))
        assertTrue(
            runCatching { backend.handleCallback("tastebuddy://auth/callback?code=code") }.isFailure
        )
        assertEquals(0, server.requestCount)
    }

    @Test
    fun linkedEmailVerificationMustPreserveUser() = runBlocking {
        session.value =
            AppJson.encodeToString(
                AuthSession(
                    "old",
                    "refresh",
                    Instant.now().epochSecond + 3600,
                    AuthUser("owner", isAnonymous = true),
                )
            )
        backend.restore()
        server.enqueue(response(authBody("other")))
        assertTrue(
            runCatching { backend.verifyOTP("sample@example.com", "123456", true) }.isFailure
        )
        assertEquals("owner", backend.sessionState.value?.user?.id)
    }

    @Test
    fun peopleSearchFallsBackOnlyForMissingRpc() = runBlocking {
        server.enqueue(response("""{"code":"PGRST202"}""", 404))
        server.enqueue(response("""[{"id":"p1","display_name":"버디","nickname":"buddy"}]"""))
        val people = backend.searchPeople("@buddy")
        assertEquals("버디", people.single().title)
        assertEquals("/rest/v1/rpc/search_profiles_by_identity", request().path)
        assertEquals("/rest/v1/rpc/search_profiles_by_nickname", request().path)
    }

    @Test
    fun failedAccountDeletionRetainsSession() = runBlocking {
        session.value =
            AppJson.encodeToString(
                AuthSession(
                    "access",
                    "refresh",
                    Instant.now().epochSecond + 3600,
                    AuthUser("owner"),
                )
            )
        backend.restore()
        server.enqueue(response("{}", 500))
        assertTrue(runCatching { backend.deleteAccount() }.isFailure)
        assertNotNull(session.value)
        assertNotNull(backend.sessionState.value)
    }

    @Test
    fun exportRequiresSameAccountBeforeSending() = runBlocking {
        session.value =
            AppJson.encodeToString(
                AuthSession(
                    "access",
                    "refresh",
                    Instant.now().epochSecond + 3600,
                    AuthUser("owner", "sample@example.com"),
                )
            )
        backend.restore()
        assertTrue(
            runCatching { backend.publishAnalysis(SensorySnapshot(), "someone-else") }.isFailure
        )
        assertEquals(0, server.requestCount)
    }

    @Test
    fun confidentialKeysAndUntrustedChatGPTUrlsAreRejected() {
        assertTrue(
            runCatching { BackendConfig("https://example.supabase.co", "sb_secret_no").validate() }
                .isFailure
        )
        listOf(
                "http://chatgpt.com/plugins/test",
                "https://chatgpt.com.evil.example/plugins/test",
                "https://chatgpt.com/plugins/test?q=secret",
                "https://user@chatgpt.com/plugins/test",
                "https://chatgpt.com/plugins/",
            )
            .forEach { assertNull(BackendConfig(chatGPTEntryURL = it).validChatGPTURL()) }
        assertNotNull(
            BackendConfig(chatGPTEntryURL = "https://chatgpt.com/plugins/test").validChatGPTURL()
        )
    }
    private suspend fun restoreOwner(id: String = "owner", anonymous: Boolean = false) {
        session.value = AppJson.encodeToString(AuthSession("pinned-access", "refresh", Instant.now().epochSecond + 3600,
            AuthUser(id, "owner@example.com", anonymous)))
        backend.restore()
    }

    @Test fun nativeBackupUsesPinnedOwnerAndCasRevision() = runBlocking {
        restoreOwner()
        val transport = backend.accountTransport("owner")
        val payload = AndroidBackupContract.replacingAndroid(null, AppState())
        server.enqueue(response("""[{"user_id":"owner","payload":$payload,"revision":3}]"""))
        assertEquals(3L, transport.fetch()!!.revision)
        val fetch = request()
        assertTrue(fetch.path!!.contains("user_id=eq.owner"))
        assertEquals("Bearer pinned-access", fetch.getHeader("Authorization"))
        server.enqueue(response("4"))
        assertEquals(4L, transport.save(payload, 3))
        val save = request()
        val body = AppJson.parseToJsonElement(save.body.readUtf8()).jsonObject
        assertEquals("owner", body.string("p_user_id"))
        assertEquals(3L, body.getValue("p_expected_revision").jsonPrimitive.long)
        assertEquals("Bearer pinned-access", save.getHeader("Authorization"))
    }

    @Test fun nativeBackupRejectsWrongAccountAndAnonymousBeforeNetwork() = runBlocking {
        restoreOwner()
        assertTrue(runCatching { backend.accountTransport("other") }.isFailure)
        restoreOwner(anonymous = true)
        assertTrue(runCatching { backend.accountTransport("owner") }.isFailure)
        assertEquals(0, server.requestCount)
    }

    @Test fun nativeBackupRejectsAccountChangedWhileFetchIsInFlight() = runBlocking {
        restoreOwner()
        val transport = backend.accountTransport("owner")
        val payload = AndroidBackupContract.replacingAndroid(null, AppState())
        val accountSwitched = java.util.concurrent.CountDownLatch(1)
        server.dispatcher = object : okhttp3.mockwebserver.Dispatcher() {
            override fun dispatch(request: okhttp3.mockwebserver.RecordedRequest): MockResponse {
                if (request.path!!.startsWith("/rest/v1/native_account_data")) {
                    check(accountSwitched.await(10, TimeUnit.SECONDS))
                    return response("""[{"user_id":"owner","payload":$payload,"revision":1}]""")
                }
                return response(authBody("other"))
            }
        }
        val pending = async { runCatching { transport.fetch() } }
        kotlinx.coroutines.yield()
        request()
        backend.verifyOTP("other@example.com", "123456")
        request()
        accountSwitched.countDown()
        assertTrue(pending.await().isFailure)
        assertEquals("other", backend.sessionState.value!!.user.id)
    }

    @Test fun nativePhotoUploadCompletesLeaseAndNeverOverwritesObject() = runBlocking {
        restoreOwner()
        val transport = backend.accountTransport("owner")
        server.enqueue(response("\"lease-id\""))
        server.enqueue(response("{}"))
        server.enqueue(response("{}"))
        transport.uploadPhoto("photo_sample.jpg", byteArrayOf(0xff.toByte(), 0xd8.toByte(), 0xff.toByte(), 0xd9.toByte()))
        assertEquals("/rest/v1/rpc/begin_account_media_upload", request().path)
        val upload = request()
        assertEquals("/storage/v1/object/native-dining-photos/owner/photo_sample.jpg", upload.path)
        assertEquals("false", upload.getHeader("x-upsert"))
        assertEquals("Bearer pinned-access", upload.getHeader("Authorization"))
        val finish = request()
        assertEquals("/rest/v1/rpc/finish_account_media_upload", finish.path)
        assertEquals("lease-id", AppJson.parseToJsonElement(finish.body.readUtf8()).jsonObject.string("upload_id"))
    }

    @Test fun nativeCasConflictIsSurfacedWithoutRetryingOverwrite() = runBlocking {
        restoreOwner()
        val transport = backend.accountTransport("owner")
        server.enqueue(response("""{"code":"40001"}""", 409))
        assertTrue(runCatching { transport.save(AndroidBackupContract.replacingAndroid(null, AppState()), 3) }.exceptionOrNull() is AccountBackupConflict)
        assertEquals(1, server.requestCount)
    }

    @Test fun lateTokenRefreshCannotRestoreSessionAfterLogout() = runBlocking {
        session.value = AppJson.encodeToString(AuthSession("expired", "refresh", 1, AuthUser("owner")))
        val logoutFinished = java.util.concurrent.CountDownLatch(1)
        server.dispatcher = object : okhttp3.mockwebserver.Dispatcher() {
            override fun dispatch(request: okhttp3.mockwebserver.RecordedRequest): MockResponse {
                if (request.path!!.contains("grant_type=refresh_token")) {
                    check(logoutFinished.await(10, TimeUnit.SECONDS))
                    return response(authBody("owner"))
                }
                return response("{}")
            }
        }
        val pending = async { runCatching { backend.restore() } }
        kotlinx.coroutines.yield()
        request()
        backend.signOut()
        request()
        logoutFinished.countDown()
        assertTrue(pending.await().isFailure)
        assertNull(backend.sessionState.value)
        assertNull(session.value)
    }

    @Test fun tokenRefreshCannotChangeAccountIdentity() = runBlocking {
        session.value = AppJson.encodeToString(AuthSession("expired", "refresh", 1, AuthUser("owner")))
        server.enqueue(response(authBody("other")))
        assertTrue(runCatching { backend.restore() }.isFailure)
        assertEquals("owner", backend.sessionState.value!!.user.id)
        assertEquals("expired", AppJson.decodeFromString<AuthSession>(session.value!!).accessToken)
    }

    @Test fun delayedDeletionAndLogoutPreserveNewAccountAndSameAccountRelogin() = runBlocking {
        for (deleting in listOf(true, false)) for (replacementID in listOf("other", "owner")) {
            val expires = Instant.now().epochSecond + 3600
            session.value = AppJson.encodeToString(AuthSession("test-access", "test-refresh", expires,
                AuthUser("owner", "sample@example.com", false, "2026-01-01T00:00:00Z")))
            backend.restore()
            val original = backend.sessionState.value
            val reauthenticated = java.util.concurrent.CountDownLatch(1)
            server.dispatcher = object : okhttp3.mockwebserver.Dispatcher() {
                override fun dispatch(request: okhttp3.mockwebserver.RecordedRequest): MockResponse {
                    if (request.path!!.contains("delete-account") || request.path!!.startsWith("/auth/v1/logout")) {
                        check(reauthenticated.await(10, TimeUnit.SECONDS))
                        return response("{}")
                    }
                    return response(authBody(replacementID, expires))
                }
            }
            val pending = async { runCatching { if (deleting) backend.deleteAccount("owner") else backend.signOut() } }
            kotlinx.coroutines.yield()
            request()
            backend.verifyOTP("sample@example.com", "123456")
            request()
            if (replacementID == "owner") assertEquals(original, backend.sessionState.value)
            reauthenticated.countDown()
            assertTrue("deleting=$deleting replacement=$replacementID", pending.await().isFailure)
            assertEquals(replacementID, backend.sessionState.value!!.user.id)
            assertEquals(replacementID, AppJson.decodeFromString<AuthSession>(session.value!!).user.id)
        }
    }

    @Test fun accountDeletionChecksExpectedOwnerBeforeSendingRequest() = runBlocking {
        restoreOwner()
        assertTrue(runCatching { backend.deleteAccount("other") }.isFailure)
        assertEquals(0, server.requestCount)
        assertEquals("owner", backend.sessionState.value!!.user.id)
    }

}
