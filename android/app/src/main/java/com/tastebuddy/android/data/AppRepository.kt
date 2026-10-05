package com.tastebuddy.android.data

import android.util.AtomicFile
import com.tastebuddy.android.domain.*
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*

@kotlinx.serialization.Serializable
data class AndroidAccountArchive(
    val owner: String,
    val state: AppState,
    val remoteRevision: Long = 0,
    val dirty: Boolean = true,
    val hasLocalChanges: Boolean = false,
    val remoteSnapshot: JsonObject? = null,
)

data class UnreadableAccountSource(val owner: String, val bytes: ByteArray)

/** Every identity has an atomic file. A failed read never becomes an empty writable account. */
class AppRepository(private val directory: File, private val initialState: AppState = AppState()) {
    private val mutex = Mutex()
    private val sourceJson = Json(AppJson) { ignoreUnknownKeys = false }
    private var archive = AndroidAccountArchive(GUEST, initialState)
    private val mutableState = MutableStateFlow(initialState)
    val state = mutableState.asStateFlow()
    private val mutableOwner = MutableStateFlow(GUEST)
    val owner = mutableOwner.asStateFlow()
    private val mutableReady = MutableStateFlow(false)
    val ready = mutableReady.asStateFlow()
    private val mutableError = MutableStateFlow<String?>(null)
    val error = mutableError.asStateFlow()

    private fun file(owner: String) = AtomicFile(File(directory,
        if (owner == GUEST) "taste-buddy-state.json"
        else "taste-buddy-account-${digest(owner, 32)}.json"))

    suspend fun load(owner: String = mutableOwner.value) = withContext(Dispatchers.IO) {
        mutex.withLock {
            mutableReady.value = false
            mutableState.value = initialState // Do not expose a previous owner's data while loading.
            mutableOwner.value = owner
            try {
                directory.mkdirs()
                val source = file(owner)
                archive = if (source.baseFile.exists() || File(source.baseFile.path + ".bak").exists()) {
                    val raw = AppJson.parseToJsonElement(source.openRead().bufferedReader().use { it.readText() }).jsonObject
                    if (raw["state"] != null) {
                        val decodedState = decodeState(raw.getValue("state").jsonObject)
                        val restored = AppJson.decodeFromJsonElement<AndroidAccountArchive>(JsonObject(raw +
                            ("state" to AppJson.encodeToJsonElement(decodedState))))
                        require(restored.owner == owner) { "저장된 기록의 계정이 달라 불러오기를 멈췄어요." }
                        restored
                    } else {
                        // Pre-isolation files remain in the guest archive. They are never assigned to a login implicitly.
                        require(owner == GUEST)
                        AndroidAccountArchive(owner, decodeState(raw))
                    }
                } else AndroidAccountArchive(owner, initialState)
                mutableState.value = archive.state
                mutableError.value = null
                mutableReady.value = true
            } catch (error: Exception) {
                mutableError.value = error.message?.takeIf { it.any { c -> c in '가'..'힣' } }
                    ?: "저장된 기록을 읽지 못했어요. 원래 기록은 보존되어 있어요."
            }
        }
    }

    suspend fun update(expectedOwner: String = owner.value, transform: (AppState) -> AppState): AppState =
        withContext(Dispatchers.IO) {
            mutex.withLock {
                checkReady(expectedOwner)
                val next = transform(archive.state)
                if (next != archive.state) {
                    val changedSource = !AndroidBackupContract.sameSource(next, archive.state)
                    commit(archive.copy(state = next, dirty = archive.dirty || changedSource,
                        hasLocalChanges = archive.hasLocalChanges || changedSource))
                }
                next
            }
        }

    suspend fun account(expectedOwner: String): AndroidAccountArchive = mutex.withLock {
        checkReady(expectedOwner)
        archive
    }

    suspend fun acknowledge(expectedOwner: String, sent: AppState, snapshot: JsonObject, revision: Long) =
        withContext(Dispatchers.IO) { mutex.withLock {
            checkReady(expectedOwner)
            commit(archive.copy(remoteRevision = revision, remoteSnapshot = snapshot,
                dirty = !AndroidBackupContract.sameSource(archive.state, sent),
                hasLocalChanges = !AndroidBackupContract.sameSource(archive.state, sent)))
        } }

    suspend fun restoreAccount(expectedOwner: String, expectedState: AppState, restored: AppState,
        snapshot: JsonObject, revision: Long) = withContext(Dispatchers.IO) { mutex.withLock {
        checkReady(expectedOwner)
        check(archive.state == expectedState) { "복원 중 기록이 변경되어 멈췄어요. 현재 기록은 보존되어 있어요." }
        preserveRecovery()
        commit(archive.copy(state = restored, remoteRevision = revision, remoteSnapshot = snapshot, dirty = false, hasLocalChanges = false))
    } }

    /** Explicit recovery only: unreadable bytes are never treated as an empty account. */
    suspend fun unreadableSource(expectedOwner: String): UnreadableAccountSource = withContext(Dispatchers.IO) {
        mutex.withLock {
            checkUnreadable(expectedOwner)
            val bytes = file(expectedOwner).openRead().use { it.readBytes() }
            validateRecoveryVersionAndOwner(bytes, expectedOwner)
            UnreadableAccountSource(expectedOwner, bytes)
        }
    }

    suspend fun restoreUnreadable(source: UnreadableAccountSource, restored: AppState,
        snapshot: JsonObject, revision: Long) = withContext(Dispatchers.IO) { mutex.withLock {
        checkUnreadable(source.owner)
        val currentBytes = file(source.owner).openRead().use { it.readBytes() }
        check(currentBytes.contentEquals(source.bytes)) { "복원 중 기기 원문이 바뀌어 멈췄어요. 원문은 보존되어 있어요." }
        validateRecoveryVersionAndOwner(currentBytes, source.owner)
        // Preserve exact bytes, including invalid UTF-8/JSON and fields this version cannot decode.
        writeBytes(AtomicFile(File(directory, "taste-buddy-unreadable-${digest(source.owner, 32)}-${java.util.UUID.randomUUID()}.bin")), currentBytes)
        commit(AndroidAccountArchive(source.owner, restored, remoteRevision = revision, remoteSnapshot = snapshot,
            dirty = false, hasLocalChanges = false))
        mutableError.value = null
        mutableReady.value = true
    } }

    private fun checkUnreadable(expectedOwner: String) {
        check(expectedOwner != GUEST && owner.value == expectedOwner) { "계정이 바뀌어 복원을 멈췄어요." }
        check(!mutableReady.value && mutableError.value != null) { "현재 기기 원문 상태가 바뀌었어요. 다시 불러온 뒤 확인해 주세요." }
    }

    private fun validateRecoveryVersionAndOwner(bytes: ByteArray, expectedOwner: String) {
        val text = bytes.toString(Charsets.UTF_8)
        val raw = runCatching { AppJson.parseToJsonElement(text) as? JsonObject }.getOrNull()
        if (raw != null) {
            raw["owner"]?.let { require(it is JsonPrimitive && it.isString && it.content == expectedOwner) { "기기 원문의 계정이 달라 복원하지 않았어요." } }
            val state = (raw["state"] as? JsonObject) ?: raw
            state["schemaVersion"]?.let {
                require(it is JsonPrimitive && !it.isString && it.intOrNull == 1) { "새 버전에서 저장한 기록입니다. 앱을 업데이트해 주세요." }
            }
        } else {
            // A truncated future document still must not be downgraded. Ordinary damaged JSON can be replaced only after its exact bytes are archived.
            val declaredVersion = Regex("\"schemaVersion\"\\s*:\\s*\"?(-?[0-9]+)").find(text)?.groupValues?.get(1)
            require(declaredVersion == null || declaredVersion.toLongOrNull() == 1L) { "새 버전에서 저장한 기록입니다. 앱을 업데이트해 주세요." }
        }
    }

    suspend fun preserveRemoteRecovery(expectedOwner: String, remote: NativeRemoteArchive) = withContext(Dispatchers.IO) {
        mutex.withLock {
            checkReady(expectedOwner)
            write(AtomicFile(File(directory, "taste-buddy-recovery-${digest(expectedOwner, 32)}-${java.util.UUID.randomUUID()}.json")),
                archive.copy(state = AndroidBackupContract.decode(remote.snapshot, this@AppRepository) ?: archive.state,
                    remoteSnapshot = remote.snapshot, remoteRevision = remote.revision))
        }
    }

    /** Explicit account deletion/test reset only. Logout must use load(GUEST). */
    suspend fun reset(expectedOwner: String = owner.value) = withContext(Dispatchers.IO) { mutex.withLock {
        check(owner.value == expectedOwner) { "계정이 바뀌어 기기 기록 초기화를 멈췄어요." }
        commit(AndroidAccountArchive(expectedOwner, initialState))
        mutableReady.value = true
        mutableError.value = null
    } }

    private fun checkReady(expectedOwner: String) {
        check(mutableReady.value && mutableError.value == null) { "기록을 불러온 뒤 다시 시도해 주세요." }
        check(owner.value == expectedOwner) { "계정이 바뀌어 저장을 멈췄어요. 원래 기록은 보관되어 있어요." }
    }

    private fun preserveRecovery() {
        write(AtomicFile(File(directory, "taste-buddy-recovery-${digest(owner.value, 32)}-${java.util.UUID.randomUUID()}.json")), archive)
    }

    private fun commit(value: AndroidAccountArchive) {
        write(file(value.owner), value)
        archive = value
        mutableState.value = value.state
    }

    private fun write(target: AtomicFile, value: AndroidAccountArchive) =
        writeBytes(target, AppJson.encodeToString(value).toByteArray(Charsets.UTF_8))

    private fun writeBytes(target: AtomicFile, bytes: ByteArray) {
        directory.mkdirs()
        val stream = target.startWrite()
        try {
            stream.write(bytes)
            target.finishWrite(stream)
        } catch (error: Exception) { target.failWrite(stream); throw error }
    }

    internal fun decodeState(raw: JsonObject): AppState {
        val version = raw["schemaVersion"]?.jsonPrimitive?.intOrNull ?: 1
        require(version == 1) { "새 버전에서 저장한 기록입니다. 앱을 업데이트해 주세요." }
        return sourceJson.decodeFromJsonElement(normalizeSelections(raw))
    }

    companion object { const val GUEST = "guest" }

    internal fun normalizeSelections(raw: JsonObject): JsonObject {
        fun entry(element: JsonElement): JsonElement {
            val item = element as? JsonObject ?: return element
            val result = item.toMutableMap()
            (item["sensorySelections"] as? JsonArray)?.let {
                result["sensorySelections"] =
                    JsonArray(
                        it.map { selected ->
                            AppJson.encodeToJsonElement(SensorySelection.fromRaw(selected))
                        }
                    )
            }
            item["overallEvaluation"]
                ?.takeIf { it != JsonNull }
                ?.let {
                    result["overallEvaluation"] =
                        AppJson.encodeToJsonElement(OverallEvaluation.fromRaw(it))
                }
            return JsonObject(result)
        }
        val result = raw.toMutableMap()
        (raw["entries"] as? JsonArray)?.let { result["entries"] = JsonArray(it.map(::entry)) }
        (raw["draft"] as? JsonObject)?.let { draft ->
            draft["entry"]?.let { e ->
                result["draft"] = JsonObject(draft.toMutableMap().apply { put("entry", entry(e)) })
            }
        }
        return JsonObject(result)
    }
}
