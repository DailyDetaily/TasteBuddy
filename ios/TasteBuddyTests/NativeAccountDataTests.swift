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
        XCTAssertEqual(repository.rows[accountA.id]?.payload.values["tastebuddy.ios.dining-entries.v1"],
                       try? JSONEncoder().encode(app.diningEntries))

        repository.onFetch = { app.completeVerifiedEmailAuthEntry(user: self.accountB) }
        await app.syncAccountData()
        XCTAssertTrue(app.diningEntries.isEmpty)
        XCTAssertNil(repository.rows[accountB.id])
    }

    func testPhotoFailureDoesNotPublishBrokenSnapshotAndRestoreKeepsRecords() async {
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
        let destination = model(repository: repository, photos: failingDownload, restoredUser: accountA)
        await destination.restoreBackendSessionIfNeeded()
        XCTAssertEqual(destination.diningEntries, saved)
        XCTAssertNotNil(destination.accountDataSyncError)
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
        return revision
    }
}

private final class RecordingNativeAccountPhotos: NativeAccountPhotoRepository {
    var backupFails = false
    var restoreFails = false
    var removeFails = false
    var removals: [[String]] = []
    func backup(filenames: [String], userID: String) async throws {
        if backupFails { throw NativeAccountDataError.unavailable }
    }
    func restore(filenames: [String], userID: String) async throws {
        if restoreFails { throw NativeAccountDataError.unavailable }
    }
    func remove(filenames: [String], userID: String) async throws {
        removals.append(filenames)
        if removeFails { throw NativeAccountDataError.unavailable }
    }
}
