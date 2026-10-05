package com.tastebuddy.android.data

import com.tastebuddy.android.domain.*
import java.util.Base64
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.*

data class NativeRemoteArchive(val snapshot: JsonObject, val revision: Long)
interface NativeAccountTransport {
    suspend fun fetch(): NativeRemoteArchive?
    suspend fun uploadPhoto(filename: String, bytes: ByteArray)
    suspend fun downloadPhoto(filename: String): ByteArray
    suspend fun save(snapshot: JsonObject, expectedRevision: Long): Long
    fun checkOwner()
}
interface AccountPhotoStorage {
    suspend fun readOriginal(filename: String): ByteArray?
    suspend fun restoreOriginal(filename: String, bytes: ByteArray)
}
class AccountBackupConflict : IllegalStateException("다른 Android 기기의 기록이 변경됐어요. 양쪽 기록을 보존하고 자동 덮어쓰기를 멈췄어요.")
enum class BackupResolution { THIS_DEVICE, ACCOUNT_BACKUP }

/** Android's complete source is an opaque extension. Native/iOS records are never converted or replaced. */
object AndroidBackupContract {
    const val KEY = "tastebuddy.android.archive.v1"
    val photoPattern = Regex("[A-Za-z0-9_-]{1,251}\\.jpg")
    fun photos(state: AppState): List<String> = (state.entries.mapNotNull { it.reflectionPhotoFilename } +
        listOfNotNull(state.draft?.entry?.reflectionPhotoFilename, state.avatarFilename)).distinct().sorted().also {
        require(it.all(photoPattern::matches)) { "백업할 사진 이름을 확인하지 못했어요. 원본은 기기에 보존되어 있어요." }
    }
    fun encode(state: AppState): JsonPrimitive = JsonPrimitive(Base64.getEncoder().encodeToString(
        buildJsonObject {
            put("schemaVersion", 1)
            put("state", AppJson.encodeToJsonElement(AppState.serializer(), state))
            put("photoFilenames", JsonArray(photos(state).map(::JsonPrimitive)))
        }.toString().toByteArray(Charsets.UTF_8)))

    fun validate(snapshot: JsonObject) {
        require(snapshot["schemaVersion"]?.jsonPrimitive?.let { !it.isString && it.intOrNull in listOf(1, 2) } == true) { "새 버전에서 저장한 기록입니다. 앱을 업데이트해 주세요." }
        val values = snapshot["values"] as? JsonObject ?: error("계정 백업의 원문을 확인하지 못했어요.")
        require(values.values.all { it is JsonPrimitive && it.isString && it.content.length % 4 == 0 &&
            it.content.matches(Regex("[A-Za-z0-9+/]*={0,2}")) && runCatching { Base64.getDecoder().decode(it.content) }.isSuccess }) {
            "계정 백업의 원문을 확인하지 못했어요."
        }
        require(snapshot["hasSeenOnboarding"]?.jsonPrimitive?.let { !it.isString && it.booleanOrNull != null } == true) { "계정 백업 형식을 확인하지 못했어요." }
        val names = snapshot["photoFilenames"] as? JsonArray ?: error("계정 사진 목록을 확인하지 못했어요.")
        require(names.all { it is JsonPrimitive && it.isString && photoPattern.matches(it.content) }) { "계정 사진 목록을 확인하지 못했어요." }
    }
    fun decode(snapshot: JsonObject, repo: AppRepository): AppState? {
        validate(snapshot)
        val encoded = snapshot.obj("values")[KEY] ?: return null
        val envelope = AppJson.parseToJsonElement(String(Base64.getDecoder().decode(encoded.jsonPrimitive.content), Charsets.UTF_8)).jsonObject
        require(envelope["schemaVersion"]?.jsonPrimitive?.let { !it.isString && it.intOrNull == 1 } == true) { "새 Android 버전의 백업입니다. 앱을 업데이트해 주세요." }
        require(envelope.keys == setOf("schemaVersion", "state", "photoFilenames")) { "지원하지 않는 Android 백업 필드가 있어 원문을 보존했어요." }
        val rawState = envelope.getValue("state").jsonObject
        require(rawState["schemaVersion"]?.jsonPrimitive?.let { !it.isString && it.intOrNull == 1 } == true && rawState["entries"] is JsonArray) {
            "Android 원문 기록 형식을 확인하지 못했어요."
        }
        require(rawState.array("entries").all { it is JsonObject && it.string("id").isNotBlank() }) { "기록 번호가 누락되어 복원을 멈췄어요." }
        val rawDraft = rawState["draft"]
        if (rawDraft != null && rawDraft != JsonNull) require(rawDraft.jsonObject.obj("entry").string("id").isNotBlank()) { "작성 중인 기록 번호를 확인하지 못했어요." }
        val state = repo.decodeState(rawState)
        val manifest = envelope["photoFilenames"] as? JsonArray ?: error("Android 사진 목록을 확인하지 못했어요.")
        require(manifest.all { it is JsonPrimitive && it.isString })
        val names = manifest.map { it.jsonPrimitive.content }
        require(names.distinct().size == names.size && names.sorted() == photos(state) &&
            snapshot.array("photoFilenames").map { it.jsonPrimitive.content }.containsAll(names)) {
            "Android 사진 목록과 원문이 달라 복원을 멈췄어요."
        }
        require(state.entries.map { it.id }.let { ids -> ids.all(String::isNotBlank) && ids.distinct().size == ids.size }) {
            "중복되거나 누락된 기록 번호가 있어 복원을 멈췄어요."
        }
        return state
    }
    fun replacingAndroid(base: JsonObject?, state: AppState): JsonObject {
        val snapshot = base ?: buildJsonObject {
            put("schemaVersion", 2); put("values", buildJsonObject {}); put("hasSeenOnboarding", false); put("photoFilenames", JsonArray(emptyList()))
        }
        validate(snapshot)
        // Keep previous manifest names as well: other clients may reference them. Remote GC is intentionally separate.
        return JsonObject(snapshot + mapOf(
            "values" to JsonObject(snapshot.obj("values") + (KEY to encode(state))),
            "photoFilenames" to JsonArray((snapshot.array("photoFilenames").map { it.jsonPrimitive.content } + photos(state)).distinct().sorted().map(::JsonPrimitive))
        ))
    }
    fun sameSource(first: AppState, second: AppState) = first.copy(authEntryComplete = false, selectedTab = "home") ==
        second.copy(authEntryComplete = false, selectedTab = "home")
    fun hasContent(state: AppState) = !sameSource(state, AppState())
}

class AndroidAccountSync(private val repo: AppRepository, private val photos: AccountPhotoStorage) {
    private val mutex = Mutex()
    suspend fun synchronize(owner: String, transport: NativeAccountTransport, resolution: BackupResolution? = null): String = mutex.withLock {
        require(owner != AppRepository.GUEST)
        if (!repo.ready.value && resolution == BackupResolution.ACCOUNT_BACKUP) {
            val source = repo.unreadableSource(owner)
            transport.checkOwner()
            val remote = transport.fetch() ?: error("복원할 Android 계정 백업이 없어요.")
            transport.checkOwner()
            val restored = AndroidBackupContract.decode(remote.snapshot, repo) ?: error("복원할 Android 계정 백업이 없어요.")
            for (filename in AndroidBackupContract.photos(restored)) {
                val bytes = transport.downloadPhoto(filename)
                transport.checkOwner()
                photos.restoreOriginal(filename, bytes)
            }
            transport.checkOwner()
            repo.restoreUnreadable(source, restored.copy(authEntryComplete = true), remote.snapshot, remote.revision)
            return@withLock "기기 원문을 복구본으로 보관하고 Android 계정 기록과 사진을 복원했어요."
        }
        val local = repo.account(owner)
        transport.checkOwner()
        val remote = transport.fetch()
        transport.checkOwner()
        val restored = remote?.let { AndroidBackupContract.decode(it.snapshot, repo) }
        val previousAndroid = local.remoteSnapshot?.obj("values")?.get(AndroidBackupContract.KEY)
        val remoteAndroid = remote?.snapshot?.obj("values")?.get(AndroidBackupContract.KEY)
        val localChanged = local.dirty && (local.hasLocalChanges || local.remoteRevision > 0 || AndroidBackupContract.hasContent(local.state))
        val remoteChanged = remoteAndroid != previousAndroid
        if (remote == null && local.remoteRevision > 0) throw AccountBackupConflict()
        // A successful save can lose its HTTP response. Confirm the complete source before acknowledging; newer local edits still conflict.
        if (remoteChanged && restored != null && AndroidBackupContract.sameSource(restored, local.state)) {
            for (filename in AndroidBackupContract.photos(restored)) {
                val bytes = transport.downloadPhoto(filename)
                transport.checkOwner()
                repo.account(owner)
                photos.restoreOriginal(filename, bytes)
            }
            transport.checkOwner()
            repo.acknowledge(owner, local.state, remote!!.snapshot, remote.revision)
            return@withLock "Android 계정 백업이 최신 상태예요."
        }
        if (remoteChanged && localChanged && resolution == null) throw AccountBackupConflict()
        if (resolution == BackupResolution.ACCOUNT_BACKUP && restored == null) error("복원할 Android 계정 백업이 없어요.")
        if (restored != null && (resolution == BackupResolution.ACCOUNT_BACKUP || (!localChanged && remoteChanged))) {
            for (filename in AndroidBackupContract.photos(restored)) {
                val bytes = transport.downloadPhoto(filename)
                transport.checkOwner()
                repo.account(owner)
                photos.restoreOriginal(filename, bytes)
            }
            transport.checkOwner()
            repo.restoreAccount(owner, local.state, restored.copy(authEntryComplete = true), remote!!.snapshot, remote.revision)
            return@withLock "Android 계정 기록과 사진을 복원했어요."
        }
        if (!local.dirty && !remoteChanged && remote != null) return@withLock "Android 계정 백업이 최신 상태예요."
        val snapshot = AndroidBackupContract.replacingAndroid(remote?.snapshot, local.state)
        require(snapshot.toString().toByteArray(Charsets.UTF_8).size < 15_500_000) { "계정 백업 용량이 가득 찼어요. 기기 원본은 보존되어 있어요." }
        for (filename in AndroidBackupContract.photos(local.state)) {
            val bytes = photos.readOriginal(filename) ?: error("사진 원본을 찾지 못해 백업을 멈췄어요. 기록은 보존되어 있어요.")
            transport.checkOwner()
            transport.uploadPhoto(filename, bytes)
        }
        transport.checkOwner()
        repo.account(owner)
        if (resolution == BackupResolution.THIS_DEVICE && remote != null) {
            // The displaced backup must be recoverable even if another platform later removes its unreferenced photos.
            if (restored != null) for (filename in AndroidBackupContract.photos(restored)) {
                val bytes = transport.downloadPhoto(filename)
                transport.checkOwner()
                repo.account(owner)
                photos.restoreOriginal(filename, bytes)
            }
            repo.preserveRemoteRecovery(owner, remote)
        }
        val revision = transport.save(snapshot, remote?.revision ?: 0)
        transport.checkOwner()
        repo.acknowledge(owner, local.state, snapshot, revision)
        "Android 기록과 사진을 계정에 백업했어요."
    }
}
