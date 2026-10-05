import XCTest
@testable import TasteBuddy

@MainActor
final class NativeAccountDataTests: XCTestCase {
    private let accountA = BackendAuthUserSummary(id: "11111111-1111-4111-8111-111111111111", email: "a@example.com", isAnonymous: false)
    private let accountB = BackendAuthUserSummary(id: "22222222-2222-4222-8222-222222222222", email: "b@example.com", isAnonymous: false)
    private func defaults() -> UserDefaults {
        let suite = "tastebuddy.account.tests.\(UUID().uuidString)"
        addTeardownBlock { UserDefaults.standard.removePersistentDomain(forName: suite) }
        return UserDefaults(suiteName: suite)!
    }

    private func model(
        defaults: UserDefaults? = nil,
        repository: MemoryNativeAccountRepository = .init(),
        photos: RecordingNativeAccountPhotos = .init(),
        restoredUser: BackendAuthUserSummary? = nil,
        sessionRepository: (any BackendSessionRepository)? = nil
    ) -> AppModel {
        AppModel(
            defaults: defaults ?? self.defaults(),
            authRepository: FixtureBackendAuthRepository(result: .success("ok", user: restoredUser)),
            sessionRepository: sessionRepository ?? FixtureBackendSessionRepository(status: restoredUser == nil ? .signedOut : .authenticated),
            publicProfileRepository: FixtureBackendPublicProfileRepository(identities: []),
            accountDataRepository: repository,
            accountPhotoRepository: photos
        )
    }

    func testLogoutPreservesOfflineSourceAndAccountSwitchNeverShowsOtherAccount() async {
        let store = defaults()
        let repository = MemoryNativeAccountRepository()
        repository.failure = NativeAccountDataError.unavailable
        let app = model(defaults: store, repository: repository)
        app.completeVerifiedEmailAuthEntry(user: accountA)
        app.completeOnboarding()
        app.saveProfile(.sample)
        app.addDiningEntry(.sample)
        let saved = app.diningEntries
        await app.syncAccountData()
        XCTAssertNotNil(app.accountDataSyncError)

        let logout = await app.logout()
        XCTAssertTrue(logout.ok)
        XCTAssertTrue(app.diningEntries.isEmpty)
        XCTAssertNil(app.profile)
        app.completeVerifiedEmailAuthEntry(user: accountB)
        XCTAssertTrue(app.diningEntries.isEmpty)
        app.completeVerifiedEmailAuthEntry(user: accountA)
        XCTAssertEqual(app.diningEntries, saved)
        XCTAssertNotNil(app.profile)
        XCTAssertTrue(app.hasSeenOnboarding)

        let relaunched = model(defaults: store, repository: repository, restoredUser: accountA)
        await relaunched.restoreBackendSessionIfNeeded()
        XCTAssertEqual(relaunched.diningEntries, saved)
    }

    func testGuestDataMovesOnlyOnExplicitProfileLink() async {
        let app = model()
        app.completeAuthEntry()
        app.addDiningEntry(.sample)
        let guestEntries = app.diningEntries
        app.completeVerifiedEmailAuthEntry(user: accountA)
        XCTAssertTrue(app.diningEntries.isEmpty)
        _ = await app.logout()
        app.completeAuthEntry()
        XCTAssertEqual(app.diningEntries, guestEntries)
        app.completeVerifiedEmailAuthEntry(user: accountB, importingGuest: true)
        XCTAssertEqual(app.diningEntries, guestEntries)
        _ = await app.logout()
        app.completeAuthEntry()
        XCTAssertTrue(app.diningEntries.isEmpty, "계정에 귀속한 게스트 기록을 공용 게스트 공간에 남기지 않는다.")
    }

    func testSourceRoundTripsThroughServerToANewDevice() async {
        let repository = MemoryNativeAccountRepository()
        let source = model(repository: repository)
        source.completeVerifiedEmailAuthEntry(user: accountA)
        source.completeOnboarding()
        source.saveProfile(.sample)
        source.saveProfileAvatarImageData(Data([1, 2, 3]))
        source.addDiningEntry(.sample)
        source.saveRestaurant(id: "restaurant-1")
        await source.syncAccountData()
        XCTAssertNil(source.accountDataSyncError)
        XCTAssertEqual(repository.rows[accountA.id]?.revision, 1)

        let destination = model(repository: repository, restoredUser: accountA)
        await destination.restoreBackendSessionIfNeeded()
        XCTAssertEqual(destination.diningEntries, source.diningEntries)
        XCTAssertEqual(destination.profile, source.profile)
        XCTAssertEqual(destination.profileAvatarImageData, Data([1, 2, 3]))
        XCTAssertEqual(destination.savedRestaurantIDs, ["restaurant-1"])
        XCTAssertTrue(destination.hasSeenOnboarding)
        let sourceSnapshot = try? SensoryAnalysisEngine.analyze(entries: source.diningEntries)
        let destinationSnapshot = try? SensoryAnalysisEngine.analyze(entries: destination.diningEntries)
        XCTAssertEqual(
            sourceSnapshot.map { HomeArchiveMetricsEngine.sections(entries: source.diningEntries, snapshot: $0) },
            destinationSnapshot.map { HomeArchiveMetricsEngine.sections(entries: destination.diningEntries, snapshot: $0) },
            "계정 백업을 복원해도 아카이브의 분모와 분포가 달라지지 않아야 한다."
        )
    }

    func testConcurrentDeviceConflictKeepsBothSourceVersions() async {
        let repository = MemoryNativeAccountRepository()
        let first = model(repository: repository)
        first.completeVerifiedEmailAuthEntry(user: accountA)
        first.addDiningEntry(.sample)
        await first.syncAccountData()
        let second = model(repository: repository, restoredUser: accountA)
        await second.restoreBackendSessionIfNeeded()

        first.saveRestaurant(id: "first-device")
        await first.syncAccountData()
        let remoteBefore = repository.rows[accountA.id]
        second.saveRestaurant(id: "second-device")
        await second.syncAccountData()
        XCTAssertEqual(repository.rows[accountA.id], remoteBefore)
        XCTAssertEqual(second.savedRestaurantIDs, ["second-device"])
        XCTAssertEqual(second.accountDataSyncError, NativeAccountDataError.conflict.localizedDescription)
    }

    func testEditDuringFetchIsSavedAndLateResponseCannotCrossAccounts() async {
        let repository = MemoryNativeAccountRepository()
        let app = model(repository: repository)
        app.completeVerifiedEmailAuthEntry(user: accountA)
        repository.onFetch = { app.addDiningEntry(.sample) }
        await app.syncAccountData()
        let stored = repository.rows[accountA.id]?.payload.values["tastebuddy.ios.dining-entries.v1"]
        XCTAssertEqual(stored.flatMap { try? JSONDecoder().decode([DiningEntry].self, from: $0) }, app.diningEntries)

        repository.onFetch = { app.completeVerifiedEmailAuthEntry(user: self.accountB) }
        await app.syncAccountData()
        XCTAssertTrue(app.diningEntries.isEmpty)
        XCTAssertNil(repository.rows[accountB.id])
    }

    func testPhotoFailureDoesNotPublishBrokenSnapshotOrReplaceLocalSource() async throws {
        let repository = MemoryNativeAccountRepository()
        let photos = RecordingNativeAccountPhotos()
        photos.backupFails = true
        let app = model(repository: repository, photos: photos)
        app.completeVerifiedEmailAuthEntry(user: accountA)
        app.addDiningEntry(.sample)
        let saved = app.diningEntries
        await app.syncAccountData()
        XCTAssertNil(repository.rows[accountA.id])
        XCTAssertEqual(app.diningEntries, saved)
        photos.backupFails = false
        await app.syncAccountData()

        let failingDownload = RecordingNativeAccountPhotos()
        failingDownload.restoreFails = true
        let store = defaults()
        let destination = model(defaults: store, repository: repository, photos: failingDownload, restoredUser: accountA)
        await destination.restoreBackendSessionIfNeeded()
        XCTAssertTrue(destination.diningEntries.isEmpty)
        XCTAssertNotNil(destination.accountDataSyncError)
        let pendingKey = "tastebuddy.ios.account-archive.v1.\(accountA.id).restore-pending"
        let pending = try JSONDecoder().decode(NativeAccountRemoteData.self, from: XCTUnwrap(store.data(forKey: pendingKey)))
        XCTAssertEqual(pending, repository.rows[accountA.id])
        failingDownload.restoreFails = false
        await destination.syncAccountData()
        XCTAssertEqual(destination.diningEntries, saved)
        XCTAssertNil(destination.accountDataSyncError)
        XCTAssertNil(store.data(forKey: pendingKey))

        app.addDiningEntry(.init(restaurant: "new remote", menu: "new", rating: 4, note: ""))
        await app.syncAccountData()
        failingDownload.restoreFails = true
        await destination.syncAccountData()
        XCTAssertEqual(destination.diningEntries, saved, "사진 복원이 실패하면 읽을 수 있는 이전 원문을 유지한다.")
        XCTAssertNotNil(store.data(forKey: pendingKey))
    }

    func testAccountDeletionRemovesOnlyDeletedAccountsLocalArchive() async {
        let app = model()
        app.completeVerifiedEmailAuthEntry(user: accountA)
        app.addDiningEntry(.sample)
        let accountAEntries = app.diningEntries
        app.completeVerifiedEmailAuthEntry(user: accountB)
        app.saveRestaurant(id: "b-only")
        let deletion = await app.deleteCurrentAccount()
        XCTAssertTrue(deletion.ok)
        app.completeVerifiedEmailAuthEntry(user: accountB)
        XCTAssertTrue(app.savedRestaurantIDs.isEmpty)
        app.completeVerifiedEmailAuthEntry(user: accountA)
        XCTAssertEqual(app.diningEntries, accountAEntries)
    }

    func testMalformedSourceCannotBeReplacedByAnEmptyDecodedHistory() async {
        let store = defaults()
        let diningKey = "tastebuddy.ios.dining-entries.v1"
        let malformed = Data("{unreadable-original".utf8)
        store.set(malformed, forKey: diningKey)
        let repository = MemoryNativeAccountRepository()
        let app = model(defaults: store, repository: repository, restoredUser: accountA)
        await app.restoreBackendSessionIfNeeded()
        app.addDiningEntry(.sample)
        await app.syncAccountData()
        XCTAssertEqual(store.data(forKey: diningKey), malformed)
        XCTAssertTrue(app.diningEntries.isEmpty)
        XCTAssertNil(repository.rows[accountA.id])
        XCTAssertEqual(app.accountDataSyncError, NativeAccountDataError.invalidSource.localizedDescription)

        repository.rows[accountA.id] = .init(payload: .init(values: [diningKey: malformed]), revision: 1)
        let freshDevice = model(repository: repository, restoredUser: accountA)
        await freshDevice.restoreBackendSessionIfNeeded()
        XCTAssertTrue(freshDevice.diningEntries.isEmpty)
        XCTAssertEqual(freshDevice.accountDataSyncError, NativeAccountDataError.invalidSource.localizedDescription)
    }

    func testConflictChoicePreservesBothSourcesAndAccountDeletionClearsRecoveryCopies() async {
        let store = defaults()
        let repository = MemoryNativeAccountRepository()
        let first = model(repository: repository)
        first.completeVerifiedEmailAuthEntry(user: accountA)
        first.addDiningEntry(.sample)
        await first.syncAccountData()
        let second = model(defaults: store, repository: repository, restoredUser: accountA)
        await second.restoreBackendSessionIfNeeded()
        first.saveRestaurant(id: "remote-choice")
        await first.syncAccountData()
        second.saveRestaurant(id: "local-choice")
        await second.syncAccountData()
        XCTAssertTrue(second.accountDataHasConflict)
        await second.resolveAccountDataConflict(using: .accountBackup)
        XCTAssertFalse(second.accountDataHasConflict)
        XCTAssertEqual(second.savedRestaurantIDs, ["remote-choice"])
        let prefix = "tastebuddy.ios.account-archive.v1.\(accountA.id)"
        XCTAssertEqual(store.dictionaryRepresentation().keys.filter { $0.hasPrefix(prefix + ".conflict.") }.count, 2)
        store.set(Data("unreadable".utf8), forKey: prefix + ".unreadable")
        _ = await second.deleteCurrentAccount()
        XCTAssertTrue(store.dictionaryRepresentation().keys.filter { $0.hasPrefix(prefix) }.isEmpty)
    }

    func testFailedPhotoCleanupRetriesAfterTheSourceCommit() async {
        let repository = MemoryNativeAccountRepository()
        let photos = RecordingNativeAccountPhotos()
        let app = model(repository: repository, photos: photos)
        app.completeVerifiedEmailAuthEntry(user: accountA)
        let entry = DiningEntry(restaurant: "사진 식당", menu: "사진 메뉴", rating: 4, note: "기록", reflectionPhotoFilename: "old-photo.jpg")
        app.addDiningEntry(entry)
        await app.syncAccountData()
        let updated = DiningEntry(id: entry.id, restaurant: entry.restaurant, menu: entry.menu,
                                  rating: entry.rating, note: entry.note, reflectionPhotoFilename: "new-photo.jpg")
        app.updateDiningEntry(updated)
        photos.removeFails = true
        await app.syncAccountData()
        XCTAssertEqual(repository.rows[accountA.id]?.revision, 2)
        XCTAssertEqual(repository.rows[accountA.id]?.payload.photoFilenames, ["new-photo.jpg"])
        XCTAssertEqual(photos.removals, [["old-photo.jpg"]])
        XCTAssertTrue(app.accountDataSyncError?.contains("백업은 완료") == true)
        photos.removeFails = false
        await app.syncAccountData()
        XCTAssertNil(app.accountDataSyncError)
        XCTAssertEqual(photos.removals, [["old-photo.jpg"], ["old-photo.jpg"]])
    }

    func testLateSessionRestoreCannotUndoANewLogin() async {
        let sessions = CallbackSessionRepository()
        let app = model(sessionRepository: sessions)
        sessions.onRestore = {
            app.completeVerifiedEmailAuthEntry(user: self.accountB)
            app.addDiningEntry(.sample)
        }
        await app.restoreBackendSessionIfNeeded()
        XCTAssertEqual(app.backendSessionStatus, .authenticated)
        XCTAssertEqual(app.diningEntries.count, 1)
    }
    func testMetadataFromAnotherClientSurvivesNativeEditsWithoutCrossingAccounts() async {
        let repository = MemoryNativeAccountRepository()
        let metadataKey = "tastebuddy.web.bookmark-imports.v1"
        let bytes = Data("[{\"owner\":\"A\",\"original\":{\"keep\":true}}]".utf8)
        var remote = NativeAccountSnapshot()
        remote.values[metadataKey] = bytes
        repository.rows[accountA.id] = .init(payload: remote, revision: 1)
        let store = defaults()
        let app = model(defaults: store, repository: repository)
        app.completeVerifiedEmailAuthEntry(user: accountA)
        await app.syncAccountData()
        app.completeOnboarding()
        app.saveRestaurant(id: "qa-saved")
        let keyA = "tastebuddy.ios.account-archive.v1.\(accountA.id)"
        let localA = try? JSONDecoder().decode(NativeAccountArchive.self, from: store.data(forKey: keyA)!)
        XCTAssertEqual(localA?.snapshot.values[metadataKey], bytes)
        await app.syncAccountData()
        XCTAssertEqual(repository.rows[accountA.id]?.payload.values[metadataKey], bytes)
        _ = await app.logout()
        app.completeVerifiedEmailAuthEntry(user: accountB)
        app.completeOnboarding()
        let keyB = "tastebuddy.ios.account-archive.v1.\(accountB.id)"
        let localB = try? JSONDecoder().decode(NativeAccountArchive.self, from: store.data(forKey: keyB)!)
        XCTAssertNil(localB?.snapshot.values[metadataKey])
        await app.syncAccountData()
        XCTAssertNil(repository.rows[accountB.id]?.payload.values[metadataKey])
    }

    func testFutureLocalArchiveIsNeverDowngradedOrOverwritten() async throws {
        let store = defaults(), repository = MemoryNativeAccountRepository()
        let archiveKey = "tastebuddy.ios.account-archive.v1.\(accountA.id)"
        let diningKey = "tastebuddy.ios.dining-entries.v1"
        var snapshot = NativeAccountSnapshot(values: [diningKey: try JSONEncoder().encode([DiningEntry.sample])])
        snapshot.schemaVersion = 99
        let original = try JSONEncoder().encode(NativeAccountArchive(snapshot: snapshot, remoteRevision: 9, isDirty: true))
        store.set(accountA.id, forKey: "tastebuddy.ios.active-account.v1")
        store.set(original, forKey: archiveKey)
        store.set(snapshot.values[diningKey], forKey: diningKey)
        let app = model(defaults: store, repository: repository, restoredUser: accountA)
        await app.restoreBackendSessionIfNeeded()
        XCTAssertFalse(app.insertDiningEntry(.init(restaurant: "new", menu: "new", rating: 1, note: "new")))
        app.completeOnboarding()
        XCTAssertEqual(store.data(forKey: archiveKey), original)
        XCTAssertEqual(store.data(forKey: diningKey), snapshot.values[diningKey])
        XCTAssertEqual(app.accountDataSyncError, NativeAccountDataError.unsupportedVersion.localizedDescription)
        XCTAssertNil(repository.rows[accountA.id])
        let olderReadableBackup = NativeAccountRemoteData(payload: .init(), revision: 10)
        repository.rows[accountA.id] = olderReadableBackup
        await app.syncAccountData()
        await app.resolveAccountDataConflict(using: .accountBackup)
        XCTAssertFalse(app.accountDataHasConflict)
        XCTAssertEqual(store.data(forKey: archiveKey), original)
        XCTAssertEqual(repository.rows[accountA.id], olderReadableBackup)
        app.completeVerifiedEmailAuthEntry(user: accountB)
        XCTAssertEqual(store.data(forKey: archiveKey), original)
        XCTAssertTrue(app.insertDiningEntry(.sample), "보호된 A 계정 때문에 B 계정까지 저장을 막지 않는다.")
        app.completeVerifiedEmailAuthEntry(user: accountA)
        XCTAssertEqual(store.data(forKey: archiveKey), original)
    }

    func testLateSaveAfterSwitchingAwayAndBackCannotRegressAccountRevision() async throws {
        let store = defaults(), repository = MemoryNativeAccountRepository()
        let app = model(defaults: store, repository: repository)
        app.completeVerifiedEmailAuthEntry(user: accountA)
        app.addDiningEntry(.sample)
        repository.onSave = {
            app.completeVerifiedEmailAuthEntry(user: self.accountB)
            app.completeVerifiedEmailAuthEntry(user: self.accountA)
            await app.syncAccountData()
            app.saveRestaurant(id: "latest")
            await app.syncAccountData()
        }
        await app.syncAccountData()
        let archiveKey = "tastebuddy.ios.account-archive.v1.\(accountA.id)"
        let archive = try JSONDecoder().decode(NativeAccountArchive.self, from: XCTUnwrap(store.data(forKey: archiveKey)))
        XCTAssertEqual(repository.rows[accountA.id]?.revision, 2)
        XCTAssertEqual(archive.remoteRevision, 2)
        XCTAssertFalse(archive.isDirty)
        XCTAssertEqual(app.savedRestaurantIDs, ["latest"])
        XCTAssertFalse(app.accountDataHasConflict)
    }

    func testConflictRestoreCannotReplaceEditsMadeWhilePhotosDownload() async throws {
        let repository = MemoryNativeAccountRepository(), photos = RecordingNativeAccountPhotos()
        let first = model(repository: repository)
        first.completeVerifiedEmailAuthEntry(user: accountA)
        first.addDiningEntry(.sample)
        await first.syncAccountData()
        let second = model(repository: repository, photos: photos, restoredUser: accountA)
        await second.restoreBackendSessionIfNeeded()
        first.saveRestaurant(id: "remote")
        await first.syncAccountData()
        second.saveRestaurant(id: "local")
        await second.syncAccountData()
        XCTAssertTrue(second.accountDataHasConflict)
        photos.onRestore = { second.saveRestaurant(id: "entered-during-download") }
        await second.resolveAccountDataConflict(using: .accountBackup)
        XCTAssertTrue(second.accountDataHasConflict)
        XCTAssertEqual(second.savedRestaurantIDs, ["local", "entered-during-download"])
        XCTAssertEqual(second.accountDataSyncError, NativeAccountDataError.conflict.localizedDescription)
    }

    func testBackgroundRestoreDoesNotReplaceLocalEditsMadeDuringPhotoDownload() async {
        let repository = MemoryNativeAccountRepository(), photos = RecordingNativeAccountPhotos()
        let first = model(repository: repository)
        first.completeVerifiedEmailAuthEntry(user: accountA)
        first.addDiningEntry(.sample)
        await first.syncAccountData()
        let second = model(repository: repository, photos: photos, restoredUser: accountA)
        await second.restoreBackendSessionIfNeeded()
        first.saveRestaurant(id: "remote")
        await first.syncAccountData()
        photos.onRestore = { second.saveRestaurant(id: "entered-during-restore") }
        await second.syncAccountData()
        XCTAssertTrue(second.accountDataHasConflict)
        XCTAssertEqual(second.savedRestaurantIDs, ["entered-during-restore"])
        XCTAssertEqual(repository.rows[accountA.id]?.revision, 2)
    }

    func testCorruptedPreferenceSourceDoesNotReportSaveOrChangeAnalysisInputs() async {
        let store = defaults(), key = "tastebuddy.ios.preference-profile.v1"
        let original = Data("unreadable source".utf8)
        store.set(original, forKey: key)
        let app = model(defaults: store)
        XCTAssertFalse(app.completePreferenceIntake(.init()))
        XCTAssertNil(app.preferenceProfile)
        XCTAssertEqual(store.data(forKey: key), original)
        XCTAssertEqual(app.accountDataSyncError, NativeAccountDataError.invalidSource.localizedDescription)
        XCTAssertEqual(app.sensoryAnalysisError, NativeAccountDataError.invalidSource.localizedDescription)
        XCTAssertFalse(app.sensoryAnalysisIsUpdating)
    }

    func testDuplicateRecordIDsArePreservedWithoutDoubleCountingAnalysisOrRepublishing() async throws {
        let store = defaults(), repository = MemoryNativeAccountRepository()
        let key = "tastebuddy.ios.dining-entries.v1", entry = DiningEntry.sample
        let original = try JSONEncoder().encode([entry, entry])
        store.set(original, forKey: key)
        let app = model(defaults: store, repository: repository, restoredUser: accountA)
        await app.restoreBackendSessionIfNeeded()
        XCTAssertTrue(app.diningEntries.isEmpty)
        XCTAssertFalse(app.insertDiningEntry(.sample))
        XCTAssertEqual(store.data(forKey: key), original)
        XCTAssertNil(repository.rows[accountA.id])
        XCTAssertEqual(app.accountDataSyncError, NativeAccountDataError.invalidSource.localizedDescription)
        XCTAssertEqual(app.sensoryAnalysisError, NativeAccountDataError.invalidSource.localizedDescription)
        XCTAssertFalse(app.sensoryAnalysisIsUpdating)
    }

    func testExplicitAccountBackupRecoversCorruptLocalSourceWhileKeepingExactOriginalBytes() async throws {
        let store = defaults(), repository = MemoryNativeAccountRepository(), photos = RecordingNativeAccountPhotos()
        let key = "tastebuddy.ios.dining-entries.v1", original = Data("{unreadable-local-original".utf8)
        let remoteEntries = [DiningEntry.sample]
        let remote = NativeAccountRemoteData(payload: .init(values: [key: try JSONEncoder().encode(remoteEntries)]), revision: 4)
        store.set(original, forKey: key)
        repository.rows[accountA.id] = remote
        let app = model(defaults: store, repository: repository, photos: photos, restoredUser: accountA)
        await app.restoreBackendSessionIfNeeded()
        XCTAssertTrue(app.accountDataHasConflict)
        XCTAssertEqual(store.data(forKey: key), original, "자동 동기화는 읽지 못한 원문을 교체하지 않는다.")
        await app.resolveAccountDataConflict(using: .thisDevice)
        XCTAssertEqual(repository.rows[accountA.id], remote)
        XCTAssertEqual(store.data(forKey: key), original)
        XCTAssertTrue(app.accountDataHasConflict)
        photos.restoreFails = true
        await app.resolveAccountDataConflict(using: .accountBackup)
        XCTAssertEqual(store.data(forKey: key), original)
        XCTAssertTrue(app.diningEntries.isEmpty)
        photos.restoreFails = false
        await app.resolveAccountDataConflict(using: .accountBackup)
        XCTAssertEqual(app.diningEntries, remoteEntries)
        XCTAssertFalse(app.accountDataHasConflict)
        XCTAssertNil(app.accountDataSyncError)
        let prefix = "tastebuddy.ios.account-archive.v1.\(accountA.id).conflict."
        let originals = store.dictionaryRepresentation().keys.filter { $0.hasPrefix(prefix) }.compactMap {
            store.data(forKey: $0).flatMap { try? JSONDecoder().decode(NativeAccountArchive.self, from: $0) }
        }
        XCTAssertTrue(originals.contains { $0.snapshot.values[key] == original })
    }

    func testAndroidArchiveAndItsPhotosSurviveNativeRecordEdits() async throws {
        let repository = MemoryNativeAccountRepository(), photos = RecordingNativeAccountPhotos()
        let key = "tastebuddy.android.archive.v1"
        let extensionBytes = Data(#"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[{"reflectionPhotoFilename":"android_entry.jpg"}],"draft":{"entry":{"reflectionPhotoFilename":"android_draft.jpg"}},"avatarFilename":"android_avatar.jpg"},"photoFilenames":["android_avatar.jpg","android_draft.jpg","android_entry.jpg"]}"#.utf8)
        let names = ["android_avatar.jpg", "android_draft.jpg", "android_entry.jpg", "retained_original.jpg"]
        let snapshot = NativeAccountSnapshot(values: [key: extensionBytes], photoFilenames: names)
        repository.rows[accountA.id] = .init(payload: snapshot, revision: 1)
        let app = model(repository: repository, photos: photos, restoredUser: accountA)
        await app.restoreBackendSessionIfNeeded()
        XCTAssertNil(app.accountDataSyncError)
        app.addDiningEntry(.sample)
        await app.syncAccountData()
        XCTAssertEqual(repository.rows[accountA.id]?.payload.values[key], extensionBytes)
        XCTAssertEqual(repository.rows[accountA.id]?.payload.photoFilenames, names)
        XCTAssertTrue(photos.removals.flatMap { $0 }.isEmpty)
    }

    func testMalformedAndroidPhotoManifestCannotBeImportedOrRepublished() async throws {
        let repository = MemoryNativeAccountRepository()
        let key = "tastebuddy.android.archive.v1"
        let original = Data(#"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[{"reflectionPhotoFilename":"protected.jpg"}]},"photoFilenames":[]}"#.utf8)
        repository.rows[accountA.id] = .init(payload: .init(values: [key: original]), revision: 1)
        let app = model(repository: repository, restoredUser: accountA)
        await app.restoreBackendSessionIfNeeded()
        XCTAssertEqual(app.accountDataSyncError, NativeAccountDataError.invalidSource.localizedDescription)
        XCTAssertTrue(app.diningEntries.isEmpty)
        XCTAssertEqual(repository.rows[accountA.id]?.revision, 1)
        XCTAssertEqual(repository.rows[accountA.id]?.payload.values[key], original)
    }
}

private final class CallbackSessionRepository: BackendSessionRepository {
    var onRestore: (@MainActor () -> Void)?
    func restoreSession() async -> BackendSessionStatus {
        let action = onRestore
        onRestore = nil
        await action?()
        return .signedOut
    }
}

private final class MemoryNativeAccountRepository: NativeAccountDataRepository {
    var rows: [String: NativeAccountRemoteData] = [:]
    var failure: Error?
    var onFetch: (() -> Void)?
    var onSave: (@MainActor () async -> Void)?

    func fetch(userID: String) async throws -> NativeAccountRemoteData? {
        if let failure { throw failure }
        let result = rows[userID]
        let action = onFetch
        onFetch = nil
        await MainActor.run { action?() }
        return result
    }

    func save(_ snapshot: NativeAccountSnapshot, userID: String, expectedRevision: Int) async throws -> Int {
        if let failure { throw failure }
        guard (rows[userID]?.revision ?? 0) == expectedRevision else { throw NativeAccountDataError.conflict }
        let revision = expectedRevision + 1
        rows[userID] = .init(payload: snapshot, revision: revision)
        let action = onSave
        onSave = nil
        await action?()
        return revision
    }
}

private final class RecordingNativeAccountPhotos: NativeAccountPhotoRepository {
    var backupFails = false
    var restoreFails = false
    var removeFails = false
    var removals: [[String]] = []
    var onRestore: (@MainActor () -> Void)?
    func backup(filenames: [String], userID: String) async throws {
        if backupFails { throw NativeAccountDataError.unavailable }
    }
    func restore(filenames: [String], userID: String) async throws {
        if restoreFails { throw NativeAccountDataError.unavailable }
        let action = onRestore
        onRestore = nil
        await action?()
    }
    func remove(filenames: [String], userID: String) async throws {
        removals.append(filenames)
        if removeFails { throw NativeAccountDataError.unavailable }
    }
}
