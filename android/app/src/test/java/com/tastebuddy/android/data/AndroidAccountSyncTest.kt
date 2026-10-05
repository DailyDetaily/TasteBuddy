package com.tastebuddy.android.data

import com.tastebuddy.android.domain.*
import java.io.File
import java.nio.file.Files
import java.util.Base64
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class AndroidAccountSyncTest {
    private val roots = mutableListOf<File>()
    private fun directory() = Files.createTempDirectory("tb-account-test").toFile().also(roots::add)
    private suspend fun repo(owner: String = "owner"): AppRepository = AppRepository(directory()).also { it.load(owner) }
    @After fun cleanup() { roots.forEach { it.deleteRecursively() } }

    private class Photos : AccountPhotoStorage {
        val originals = mutableMapOf<String, ByteArray>()
        override suspend fun readOriginal(filename: String) = originals[filename]
        override suspend fun restoreOriginal(filename: String, bytes: ByteArray) {
            val previous = originals[filename]
            check(previous == null || previous.contentEquals(bytes))
            originals[filename] = bytes
        }
    }
    private class Transport(var remote: NativeRemoteArchive? = null) : NativeAccountTransport {
        var ownerActive = true
        var fetchHook: (suspend () -> Unit)? = null
        var saveHook: (suspend () -> Unit)? = null
        var saves = 0
        var uploads = 0
        var failPhoto = false
        var fetches = 0
        var conflictOnSave = false
        var loseSaveResponse = false
        val photos = mutableMapOf<String, ByteArray>()
        override fun checkOwner() { check(ownerActive) }
        override suspend fun fetch(): NativeRemoteArchive? { fetches++; fetchHook?.invoke(); return remote }
        override suspend fun downloadPhoto(filename: String): ByteArray {
            if (failPhoto) error("photo unavailable")
            return photos.getValue(filename)
        }
        override suspend fun uploadPhoto(filename: String, bytes: ByteArray) { uploads++; photos[filename] = bytes }
        override suspend fun save(snapshot: JsonObject, expectedRevision: Long): Long {
            saves++
            if (conflictOnSave || expectedRevision != (remote?.revision ?: 0L)) throw AccountBackupConflict()
            saveHook?.invoke()
            remote = NativeRemoteArchive(snapshot, expectedRevision + 1)
            if (loseSaveResponse) error("response lost after successful save")
            return expectedRevision + 1
        }
    }
    private fun snapshot(state: AppState) = AndroidBackupContract.replacingAndroid(null, state)
    private fun withEntry(menu: String = "기록", photo: String? = null) = AppState(
        authEntryComplete = true,
        entries = listOf(DiningEntry(id = "entry", menu = menu, reflectionPhotoFilename = photo, feedbackStatus = "completed", note = "짭짤해요")),
    )

    @Test fun accountsAndGuestSurviveSwitchingWithoutMixing() = runBlocking {
        val dir = directory()
        val repo = AppRepository(dir)
        repo.load()
        repo.update { withEntry("guest") }
        repo.load("a")
        assertTrue(repo.state.value.entries.isEmpty())
        repo.update { withEntry("a") }
        repo.load("b")
        repo.update { withEntry("b") }
        assertTrue(runCatching { repo.update("a") { withEntry("stale") } }.isFailure)
        repo.load("a")
        assertEquals("a", repo.state.value.entries.single().menu)
        repo.load()
        assertEquals("a", repo.state.value.entries.single().menu)
        repo.load(AppRepository.GUEST)
        assertEquals("guest", repo.state.value.entries.single().menu)
        val restored = AppRepository(dir)
        restored.load("b")
        assertEquals("b", restored.state.value.entries.single().menu)
    }

    @Test fun legacyStateStaysGuestAndCorruptAccountCannotOverwriteIt() = runBlocking {
        val dir = directory()
        File(dir, "taste-buddy-state.json").writeText("""{"schemaVersion":1,"entries":[{"id":"legacy","menu":"guest legacy"}]}""")
        val repo = AppRepository(dir)
        repo.load("signed-in")
        assertTrue(repo.state.value.entries.isEmpty())
        repo.load(AppRepository.GUEST)
        assertEquals("legacy", repo.state.value.entries.single().id)
        File(dir, "taste-buddy-account-${digest("bad", 32)}.json").writeText("broken")
        repo.load("bad")
        assertFalse(repo.ready.value)
        assertTrue(repo.state.value.entries.isEmpty())
        assertTrue(runCatching { repo.update { withEntry() } }.isFailure)
        assertEquals("broken", File(dir, "taste-buddy-account-${digest("bad", 32)}.json").readText())
    }

    @Test fun backupThenFreshDeviceRestoresFullStateAndPhotos() = runBlocking {
        val first = repo()
        val state = withEntry(photo = "photo_original.jpg").copy(avatarFilename = "avatar.jpg", draft = DiningDraft(DiningEntry(id = "draft", note = "unfinished")), rememberedMenus = mapOf("restaurant" to listOf("menu")))
        first.update { state }
        val photos = Photos().also { it.originals["photo_original.jpg"] = byteArrayOf(1,2,3,4); it.originals["avatar.jpg"] = byteArrayOf(5,6,7,8) }
        val transport = Transport()
        AndroidAccountSync(first, photos).synchronize("owner", transport)
        assertEquals(2, transport.uploads)
        assertEquals(1, transport.saves)
        assertFalse(first.account("owner").dirty)
        val second = repo()
        val restoredPhotos = Photos()
        AndroidAccountSync(second, restoredPhotos).synchronize("owner", transport)
        assertEquals(state, second.state.value)
        assertArrayEquals(photos.originals["photo_original.jpg"], restoredPhotos.originals["photo_original.jpg"])
        assertEquals(1, transport.saves)
    }

    @Test fun nativeAndUnknownKeysArePreservedByteForByteWhenAndroidFirstBacksUp() = runBlocking {
        val repo = repo()
        repo.update { withEntry() }
        val native = JsonPrimitive(Base64.getEncoder().encodeToString("[{\"id\":\"ios-record\"}]".toByteArray()))
        val base = buildJsonObject {
            put("schemaVersion", 2); put("hasSeenOnboarding", true)
            put("values", buildJsonObject { put("tastebuddy.ios.dining-entries.v1", native); put("future-extension", native) })
            put("photoFilenames", JsonArray(listOf(JsonPrimitive("native_photo.jpg"))))
            put("futureMetadata", buildJsonObject { put("retain", "exact") })
        }
        val transport = Transport(NativeRemoteArchive(base, 7))
        AndroidAccountSync(repo, Photos()).synchronize("owner", transport)
        val saved = transport.remote!!.snapshot
        assertEquals(native, saved.obj("values")["tastebuddy.ios.dining-entries.v1"])
        assertEquals(native, saved.obj("values")["future-extension"])
        assertEquals(base["futureMetadata"], saved["futureMetadata"])
        assertEquals(8L, transport.remote!!.revision)
    }

    @Test fun conflictingDevicesKeepBothSourcesUntilExplicitResolution() = runBlocking {
        val repo = repo()
        val local = withEntry("local")
        repo.update { local }
        val remote = snapshot(withEntry("remote"))
        val transport = Transport(NativeRemoteArchive(remote, 4))
        assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport) }.exceptionOrNull() is AccountBackupConflict)
        assertEquals(local, repo.state.value)
        assertEquals(remote, transport.remote!!.snapshot)
        assertEquals(0, transport.saves)
    }

    @Test fun explicitRestorePreservesLocalRecoveryAndDoesNotSaveRemote() = runBlocking {
        val dir = directory()
        val repo = AppRepository(dir).also { it.load("owner"); it.update { withEntry("local") } }
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote")), 2))
        AndroidAccountSync(repo, Photos()).synchronize("owner", transport, BackupResolution.ACCOUNT_BACKUP)
        assertEquals("remote", repo.state.value.entries.single().menu)
        assertTrue(dir.listFiles()!!.any { it.name.startsWith("taste-buddy-recovery-") && it.readText().contains("local") })
        assertEquals(0, transport.saves)
    }

    @Test fun explicitOverwritePreservesRemoteRecovery() = runBlocking {
        val dir = directory()
        val repo = AppRepository(dir).also { it.load("owner"); it.update { withEntry("local") } }
        val remote = snapshot(withEntry("remote"))
        val transport = Transport(NativeRemoteArchive(remote, 2))
        AndroidAccountSync(repo, Photos()).synchronize("owner", transport, BackupResolution.THIS_DEVICE)
        assertTrue(dir.listFiles()!!.any { it.name.startsWith("taste-buddy-recovery-") && it.readText().contains(remote.obj("values").getValue(AndroidBackupContract.KEY).jsonPrimitive.content) })
        assertEquals("local", AndroidBackupContract.decode(transport.remote!!.snapshot, repo)!!.entries.single().menu)
    }

    @Test fun editDuringUploadRemainsDirtyAndIsNotOverwrittenByAcknowledgement() = runBlocking {
        val repo = repo()
        repo.update { withEntry("first") }
        val transport = Transport().also { it.saveHook = { repo.update { withEntry("edited during upload") } } }
        AndroidAccountSync(repo, Photos()).synchronize("owner", transport)
        assertEquals("edited during upload", repo.state.value.entries.single().menu)
        assertTrue(repo.account("owner").dirty)
        assertEquals("first", AndroidBackupContract.decode(transport.remote!!.snapshot, repo)!!.entries.single().menu)
    }

    @Test fun localEditDuringDownloadPreventsRestoreCommit() = runBlocking {
        val repo = repo()
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote")), 2)).also { it.fetchHook = { repo.update { withEntry("new local") } } }
        assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport) }.isFailure)
        assertEquals("new local", repo.state.value.entries.single().menu)
        assertEquals(0, transport.saves)
    }

    @Test fun missingPhotoAndUnsupportedSnapshotNeverReplaceLocalSource() = runBlocking {
        val repo = repo()
        val before = repo.state.value
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry(photo = "missing.jpg")), 2)).also { it.failPhoto = true }
        assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport) }.isFailure)
        assertEquals(before, repo.state.value)
        transport.remote = NativeRemoteArchive(JsonObject(snapshot(withEntry()) + ("schemaVersion" to JsonPrimitive(99))), 2)
        assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport) }.isFailure)
        assertEquals(0, transport.saves)
    }

    @Test fun switchedAccountResponseCannotReadOrWriteCurrentAccount() = runBlocking {
        val repo = repo()
        repo.update { withEntry("owner") }
        val transport = Transport().also { it.fetchHook = { repo.load("other"); it.ownerActive = false } }
        assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport) }.isFailure)
        assertTrue(repo.state.value.entries.isEmpty())
        assertEquals(0, transport.saves)
        repo.load("owner")
        assertEquals("owner", repo.state.value.entries.single().menu)
    }

    @Test fun casConflictDoesNotAcknowledgeDirtySource() = runBlocking {
        val repo = repo()
        repo.update { withEntry() }
        val transport = Transport().also { it.conflictOnSave = true }
        assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport) }.exceptionOrNull() is AccountBackupConflict)
        assertTrue(repo.account("owner").dirty)
        assertEquals(0L, repo.account("owner").remoteRevision)
    }
    @Test fun deletingLastLocalRecordStillConflictsWithOtherDevice() = runBlocking {
        val repo = repo()
        repo.update { withEntry("old") }
        val transport = Transport()
        val sync = AndroidAccountSync(repo, Photos())
        sync.synchronize("owner", transport)
        repo.update { AppState(authEntryComplete = true) }
        transport.remote = NativeRemoteArchive(snapshot(withEntry("other device")), 2)
        assertTrue(runCatching { sync.synchronize("owner", transport) }.exceptionOrNull() is AccountBackupConflict)
        assertTrue(repo.state.value.entries.isEmpty())
        assertEquals(1, transport.saves)
    }

    @Test fun deletingUnsyncedRecordStillCountsAsAnIntentionalLocalChange() = runBlocking {
        val repo = repo()
        repo.update { withEntry("created then deleted") }
        repo.update { AppState(authEntryComplete = true) }
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote")), 2))
        assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport) }.exceptionOrNull() is AccountBackupConflict)
        assertTrue(repo.state.value.entries.isEmpty())
        assertEquals(0, transport.saves)
    }

    @Test fun malformedEnvelopeTypesAndBase64AreRejectedWithoutChangingLocal() = runBlocking {
        val repo = repo()
        val base = snapshot(withEntry())
        val invalid = listOf(
            JsonObject(base + ("schemaVersion" to JsonPrimitive("2"))),
            JsonObject(base + ("hasSeenOnboarding" to JsonPrimitive("true"))),
            JsonObject(base + ("values" to JsonObject(base.obj("values") + ("opaque" to JsonPrimitive("W10")))))
        )
        for (payload in invalid) {
            val transport = Transport(NativeRemoteArchive(payload, 1))
            assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport) }.isFailure)
            assertEquals(0, transport.saves)
            assertTrue(repo.state.value.entries.isEmpty())
        }
    }

    @Test fun futureSelectionFieldsRemainRawThroughReloadAndBackup() = runBlocking {
        val dir = directory()
        val selection = AppJson.parseToJsonElement("""{"id":"known","type":"bubble","catalogVersion":"dining-sensory-selection/2","labelSnapshot":"감각","phaseHistory":["start","finish"]}""")
        val evaluation = AppJson.parseToJsonElement("""{"responseValue":"liked","questionID":"overall_liking","questionVersion":"dining-overall-liking/1","questionLabelSnapshot":"평가","responseLabelSnapshot":"좋음","target":"whole_dish","phase":"unspecified","futureField":{"meaning":"retain"}}""")
        File(dir, "taste-buddy-state.json").writeText("""{"schemaVersion":1,"entries":[{"id":"future","sensorySelections":[$selection],"overallEvaluation":$evaluation}]}""")
        val repo = AppRepository(dir)
        repo.load()
        assertTrue(repo.ready.value)
        repo.update { it.copy(selectedTab = "analysis") }
        repo.load()
        val record = repo.state.value.entries.single()
        assertEquals(selection, record.sensorySelections!!.single().unparsedPayload)
        assertEquals(evaluation, record.overallEvaluation!!.unparsedPayload)
        val decoded = AndroidBackupContract.decode(snapshot(repo.state.value), repo)!!
        assertEquals(selection, decoded.entries.single().sensorySelections!!.single().unparsedPayload)
    }

    @Test fun overwritingRemoteFirstPreservesItsPhotoOriginalsLocally() = runBlocking {
        val repo = repo()
        repo.update { withEntry("local") }
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote", "remote.jpg")), 1))
        transport.photos["remote.jpg"] = byteArrayOf(9,8,7,6)
        val photos = Photos()
        AndroidAccountSync(repo, photos).synchronize("owner", transport, BackupResolution.THIS_DEVICE)
        assertArrayEquals(byteArrayOf(9,8,7,6), photos.originals["remote.jpg"])
        assertEquals(1, transport.saves)
    }

    @Test fun lostSaveResponseReconcilesWithoutDuplicateUploadOrConflict() = runBlocking {
        val repo = repo()
        repo.update { withEntry("sent") }
        val transport = Transport().also { it.loseSaveResponse = true }
        val sync = AndroidAccountSync(repo, Photos())
        assertTrue(runCatching { sync.synchronize("owner", transport) }.isFailure)
        assertTrue(repo.account("owner").dirty)
        repo.update { it.copy(selectedTab = "analysis") }
        sync.synchronize("owner", transport)
        assertFalse(repo.account("owner").dirty)
        assertEquals("analysis", repo.state.value.selectedTab)
        assertEquals(1, transport.saves)
    }

    @Test fun lostResponseWithNewerLocalEditKeepsEditDirtyAndBothSources() = runBlocking {
        val repo = repo()
        repo.update { withEntry("sent") }
        val transport = Transport().also {
            it.loseSaveResponse = true
            it.saveHook = { repo.update { withEntry("newer local") } }
        }
        val sync = AndroidAccountSync(repo, Photos())
        assertTrue(runCatching { sync.synchronize("owner", transport) }.isFailure)
        assertTrue(runCatching { sync.synchronize("owner", transport) }.exceptionOrNull() is AccountBackupConflict)
        assertTrue(repo.account("owner").dirty)
        assertEquals("newer local", repo.state.value.entries.single().menu)
        assertEquals("sent", AndroidBackupContract.decode(transport.remote!!.snapshot, repo)!!.entries.single().menu)
        assertEquals(1, transport.saves)
    }

    @Test fun navigationDoesNotDirtyAnAcknowledgedSource() = runBlocking {
        val repo = repo()
        repo.update { withEntry() }
        AndroidAccountSync(repo, Photos()).synchronize("owner", Transport())
        repo.update { it.copy(selectedTab = "analysis", authEntryComplete = false) }
        assertFalse(repo.account("owner").dirty)
    }

    @Test fun photoCollisionCannotReplaceTheCurrentSourceOrOriginal() = runBlocking {
        val repo = repo()
        val photos = Photos().also { it.originals["same.jpg"] = byteArrayOf(1,2,3,4) }
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote", "same.jpg")), 1)).also {
            it.photos["same.jpg"] = byteArrayOf(9,8,7,6)
        }
        assertTrue(runCatching { AndroidAccountSync(repo, photos).synchronize("owner", transport) }.isFailure)
        assertTrue(repo.state.value.entries.isEmpty())
        assertArrayEquals(byteArrayOf(1,2,3,4), photos.originals["same.jpg"])
        assertEquals(0, transport.saves)
    }

    @Test fun explicitBackupRecoveryPreservesExactCorruptLocalBytes() = runBlocking {
        val dir = directory()
        val source = File(dir, "taste-buddy-account-${digest("owner", 32)}.json")
        val bytes = """{ "owner":"owner", "state":{"schemaVersion":1,"entries":"damaged"}, "unknown":{"keep":"spacing and raw bytes"} }""".toByteArray()
        source.writeBytes(bytes)
        val repo = AppRepository(dir).also { it.load("owner") }
        assertFalse(repo.ready.value)
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote", "remote.jpg")), 7)).also {
            it.photos["remote.jpg"] = byteArrayOf(1,2,3,4)
        }
        val sync = AndroidAccountSync(repo, Photos())
        assertTrue(runCatching { sync.synchronize("owner", transport) }.isFailure)
        assertEquals(0, transport.fetches)
        sync.synchronize("owner", transport, BackupResolution.ACCOUNT_BACKUP)
        assertTrue(repo.ready.value)
        assertNull(repo.error.value)
        assertEquals("remote", repo.state.value.entries.single().menu)
        assertEquals(7L, repo.account("owner").remoteRevision)
        assertFalse(repo.account("owner").dirty)
        assertArrayEquals(bytes, dir.listFiles()!!.single { it.name.startsWith("taste-buddy-unreadable-") }.readBytes())
        assertEquals(0, transport.saves)
        val reload = AppRepository(dir).also { it.load("owner") }
        assertEquals(repo.state.value, reload.state.value)
    }

    @Test fun recoveryDownloadFailureLeavesCorruptSourceUntouched() = runBlocking {
        val dir = directory()
        val source = File(dir, "taste-buddy-account-${digest("owner", 32)}.json")
        val bytes = byteArrayOf(0xff.toByte(), 0xfe.toByte(), 0x7b, 0x00)
        source.writeBytes(bytes)
        val repo = AppRepository(dir).also { it.load("owner") }
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote", "missing.jpg")), 1)).also { it.failPhoto = true }
        assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport, BackupResolution.ACCOUNT_BACKUP) }.isFailure)
        assertFalse(repo.ready.value)
        assertArrayEquals(bytes, source.readBytes())
        assertFalse(dir.listFiles()!!.any { it.name.startsWith("taste-buddy-unreadable-") })
        assertEquals(0, transport.saves)
    }

    @Test fun recoveryReadFailureAndChangedSourceNeverReplaceLocalFile() = runBlocking {
        val dir = directory()
        val source = File(dir, "taste-buddy-account-${digest("owner", 32)}.json")
        source.mkdir() // A directory at the archive path cannot be read as a source file.
        val repo = AppRepository(dir).also { it.load("owner") }
        val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote")), 1))
        val sync = AndroidAccountSync(repo, Photos())
        assertTrue(runCatching { sync.synchronize("owner", transport, BackupResolution.ACCOUNT_BACKUP) }.isFailure)
        assertTrue(source.isDirectory)
        assertEquals(0, transport.fetches)
        source.delete()
        source.writeText("{corrupt before fetch")
        repo.load("owner")
        transport.fetchHook = { source.writeText("{different source after fetch") }
        assertTrue(runCatching { sync.synchronize("owner", transport, BackupResolution.ACCOUNT_BACKUP) }.isFailure)
        assertEquals("{different source after fetch", source.readText())
        assertFalse(repo.ready.value)
        assertEquals(0, transport.saves)
    }

    @Test fun explicitRecoveryNeverDowngradesDeclaredFutureLocalSchema() = runBlocking {
        for (raw in listOf(
            """{"owner":"owner","state":{"schemaVersion":9,"entries":[]}}""",
            """{"owner":"owner","state":{"schemaVersion":9,"entries":""",
            """{"owner":"other","state":{"schemaVersion":1,"entries":"broken"}}""",
        )) {
            val dir = directory()
            val source = File(dir, "taste-buddy-account-${digest("owner", 32)}.json").also { it.writeText(raw) }
            val repo = AppRepository(dir).also { it.load("owner") }
            val transport = Transport(NativeRemoteArchive(snapshot(withEntry("remote")), 1))
            assertTrue(runCatching { AndroidAccountSync(repo, Photos()).synchronize("owner", transport, BackupResolution.ACCOUNT_BACKUP) }.isFailure)
            assertEquals(raw, source.readText())
            assertFalse(repo.ready.value)
            assertEquals(0, transport.fetches)
            assertEquals(0, transport.saves)
        }
    }

    @Test fun lateAccountDeletionCannotResetAnotherOwnersCurrentArchive() = runBlocking {
        val repo = repo("owner-a")
        repo.update { withEntry("A remains until its own reset") }
        repo.load("owner-b")
        repo.update { withEntry("B private record") }
        assertTrue(runCatching { repo.reset("owner-a") }.isFailure)
        assertEquals("B private record", repo.state.value.entries.single().menu)
        repo.load("owner-b")
        assertEquals("B private record", repo.state.value.entries.single().menu)
        repo.load("owner-a")
        assertEquals("A remains until its own reset", repo.state.value.entries.single().menu)
    }

}
