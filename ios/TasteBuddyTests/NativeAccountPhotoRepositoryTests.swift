import XCTest
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
@testable import TasteBuddy

#if canImport(Supabase)
import Supabase
#endif

final class NativeAccountPhotoRepositoryTests: XCTestCase {
    override func setUp() {
        super.setUp()
        DiningReflectionPhotoStore.activateAccountScope("guest")
    }

    private func jpeg(red: CGFloat = 1) throws -> Data {
        let context = try XCTUnwrap(CGContext(data: nil, width: 16, height: 16, bitsPerComponent: 8,
            bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue))
        context.setFillColor(red: red, green: 0.3, blue: 0.5, alpha: 1)
        context.fill(CGRect(x: 0, y: 0, width: 16, height: 16))
        let image = try XCTUnwrap(context.makeImage()), data = NSMutableData()
        let destination = try XCTUnwrap(CGImageDestinationCreateWithData(data, UTType.jpeg.identifier as CFString, 1, nil))
        CGImageDestinationAddImage(destination, image, nil)
        XCTAssertTrue(CGImageDestinationFinalize(destination))
        return data as Data
    }

    func testRestoreValidatesFilenameAndImageWithoutReplacingExistingOriginalOrCache() async throws {
        let original = try jpeg(), replacement = try jpeg(red: 0)
        let filename = "\(UUID().uuidString.lowercased()).jpg"
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        for unsafe in ["", "../photo.jpg", "folder/photo.jpg", "folder\\photo.jpg", ".jpg", "photo.png", "photo.jpg\n", "%2fphoto.jpg", "photo..jpg"] {
            XCTAssertFalse(DiningReflectionPhotoStore.isValidFilename(unsafe), unsafe)
            XCTAssertThrowsError(try DiningReflectionPhotoStore.restore(original, filename: unsafe))
            XCTAssertNil(DiningReflectionPhotoStore.data(for: unsafe))
        }
        try DiningReflectionPhotoStore.restore(original, filename: filename)
        let firstThumbnail = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 16)
        let first = try XCTUnwrap(firstThumbnail)
        try DiningReflectionPhotoStore.restore(original, filename: filename)
        for invalid in [Data("invalid image".utf8), Data(original.prefix(30)), Data(count: DiningReflectionPhotoStore.maximumOriginalByteCount + 1)] {
            XCTAssertThrowsError(try DiningReflectionPhotoStore.restore(invalid, filename: filename))
            XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: filename), original)
        }
        XCTAssertThrowsError(try DiningReflectionPhotoStore.restore(replacement, filename: filename)) { error in
            XCTAssertEqual(error as? DiningReflectionPhotoStore.PhotoError, .conflictingOriginal)
        }
        let preservedThumbnail = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 16)
        let preserved = try XCTUnwrap(preservedThumbnail)
        XCTAssertTrue(first === preserved)
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: filename), original)
    }

    @MainActor
    func testRecordDeletionPreservesPhotosUsedByOtherRecordsAndRecoveryArchives() throws {
        let suite = "tastebuddy.photo.references.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let original = try jpeg(), filename = try DiningReflectionPhotoStore.save(original, entryID: UUID())
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        let app = AppModel(defaults: defaults,
            authRepository: FixtureBackendAuthRepository(),
            sessionRepository: FixtureBackendSessionRepository(status: .signedOut),
            publicProfileRepository: FixtureBackendPublicProfileRepository(identities: []),
            accountDataRepository: UnavailableNativeAccountDataRepository(),
            accountPhotoRepository: UnavailableNativeAccountPhotoRepository())
        let first = DiningEntry(restaurant: "first", menu: "menu", rating: 4, note: "", reflectionPhotoFilename: filename)
        let second = DiningEntry(restaurant: "second", menu: "menu", rating: 4, note: "", reflectionPhotoFilename: filename)
        app.addDiningEntry(first)
        app.addDiningEntry(second)
        XCTAssertTrue(app.deleteDiningEntry(id: first.id))
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: filename), original)
        let recovery = NativeAccountArchive(snapshot: .init(
            values: ["tastebuddy.ios.dining-entries.v1": try JSONEncoder().encode([first])], photoFilenames: [filename]))
        defaults.set(try JSONEncoder().encode(recovery), forKey: "tastebuddy.ios.account-archive.v1.guest.conflict.saved")
        let updated = DiningEntry(id: second.id, restaurant: second.restaurant, menu: second.menu,
            rating: second.rating, note: second.note, reflectionPhotoFilename: nil)
        XCTAssertTrue(app.updateDiningEntry(updated, expected: app.diningEntry(id: second.id)))
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: filename), original)
    }

    func testSamePhotoFilenameIsIsolatedByOwnerIncludingThumbnailCache() async throws {
        let first = UUID().uuidString.lowercased(), second = UUID().uuidString.lowercased()
        let filename = "\(UUID().uuidString.lowercased()).jpg"
        let firstBytes = try jpeg(red: 1), secondBytes = try jpeg(red: 0)
        defer {
            DiningReflectionPhotoStore.remove(filename: filename, ownerScope: first)
            DiningReflectionPhotoStore.remove(filename: filename, ownerScope: second)
            DiningReflectionPhotoStore.activateAccountScope("guest")
        }
        try DiningReflectionPhotoStore.restore(firstBytes, filename: filename, ownerScope: first)
        try DiningReflectionPhotoStore.restore(secondBytes, filename: filename, ownerScope: second)
        DiningReflectionPhotoStore.activateAccountScope(first)
        XCTAssertEqual(DiningReflectionPhotoStore.data(for: filename), firstBytes)
        let firstThumbnail = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 16)
        DiningReflectionPhotoStore.activateAccountScope(second)
        XCTAssertEqual(DiningReflectionPhotoStore.data(for: filename), secondBytes)
        let secondThumbnail = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 16)
        XCTAssertNotNil(firstThumbnail)
        XCTAssertNotNil(secondThumbnail)
        XCTAssertFalse(firstThumbnail === secondThumbnail)
        DiningReflectionPhotoStore.remove(filename: filename, ownerScope: first)
        XCTAssertEqual(DiningReflectionPhotoStore.data(for: filename, ownerScope: second), secondBytes)
    }

    func testLegacyMigrationPreservesOriginalAndNeverAssignsItToTwoOwners() throws {
        let first = UUID().uuidString.lowercased(), second = UUID().uuidString.lowercased()
        let filename = "\(UUID().uuidString.lowercased()).jpg", bytes = try jpeg()
        let root = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            .appendingPathComponent("TasteBuddy/DiningFeedbackPhotos", isDirectory: true)
        let legacy = root.appendingPathComponent(filename)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        try bytes.write(to: legacy)
        defer {
            try? FileManager.default.removeItem(at: legacy)
            DiningReflectionPhotoStore.remove(filename: filename, ownerScope: first)
            DiningReflectionPhotoStore.remove(filename: filename, ownerScope: second)
        }
        try DiningReflectionPhotoStore.migrateLegacyPhotos(filenames: [filename], ownerScope: first)
        try DiningReflectionPhotoStore.migrateLegacyPhotos(filenames: [filename], ownerScope: second)
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: filename, ownerScope: first), bytes)
        XCTAssertNil(try DiningReflectionPhotoStore.originalData(for: filename, ownerScope: second))
        XCTAssertEqual(try Data(contentsOf: legacy), bytes)
    }

    @MainActor
    func testRecordDeletionRemovesPhotoWhenNoSourceStillReferencesIt() throws {
        let suite = "tastebuddy.photo.unreferenced.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let filename = try DiningReflectionPhotoStore.save(jpeg(), entryID: UUID())
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        let app = AppModel(defaults: defaults,
            authRepository: FixtureBackendAuthRepository(),
            sessionRepository: FixtureBackendSessionRepository(status: .signedOut),
            publicProfileRepository: FixtureBackendPublicProfileRepository(identities: []),
            accountDataRepository: UnavailableNativeAccountDataRepository(),
            accountPhotoRepository: UnavailableNativeAccountPhotoRepository())
        let entry = DiningEntry(restaurant: "only", menu: "menu", rating: 4, note: "", reflectionPhotoFilename: filename)
        app.addDiningEntry(entry)
        XCTAssertTrue(app.deleteDiningEntry(id: entry.id))
        XCTAssertNil(try DiningReflectionPhotoStore.originalData(for: filename))
    }

    @MainActor
    func testExplicitGuestLinkCopiesOriginalIntoAccountPhotoScope() throws {
        let suite = "tastebuddy.photo.guest-link.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let app = AppModel(defaults: defaults,
            authRepository: FixtureBackendAuthRepository(),
            sessionRepository: FixtureBackendSessionRepository(status: .signedOut),
            publicProfileRepository: FixtureBackendPublicProfileRepository(identities: []),
            accountDataRepository: UnavailableNativeAccountDataRepository(),
            accountPhotoRepository: UnavailableNativeAccountPhotoRepository())
        let owner = UUID().uuidString.lowercased(), bytes = try jpeg()
        let filename = try DiningReflectionPhotoStore.save(bytes, entryID: UUID())
        defer {
            DiningReflectionPhotoStore.remove(filename: filename, ownerScope: "guest")
            DiningReflectionPhotoStore.remove(filename: filename, ownerScope: owner)
            DiningReflectionPhotoStore.activateAccountScope("guest")
        }
        app.addDiningEntry(.init(restaurant: "guest", menu: "menu", rating: 4, note: "", reflectionPhotoFilename: filename))
        app.completeVerifiedEmailAuthEntry(user: .init(id: owner, email: "guest-link@example.com", isAnonymous: false), importingGuest: true)
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: filename, ownerScope: owner), bytes)
        XCTAssertEqual(app.diningEntries.count, 1)
        app.completeAuthEntry()
        XCTAssertTrue(app.diningEntries.isEmpty)
    }

    #if canImport(Supabase)
    func testCancelledOperationsKeepCancellationBeforeAccountMismatch() async throws {
        let fixture = try PhotoRepositoryFixture { _, _ in
            XCTFail("취소된 작업은 요청을 보내면 안 됩니다.")
            return (500, Data())
        }
        let otherUserID = UUID().uuidString
        for operation in 0..<5 {
            let task = Task<Void, Error> {
                // Cancel this exact task before entering the repository; no scheduling race.
                withUnsafeCurrentTask { $0?.cancel() }
                switch operation {
                case 0:
                    _ = try await fixture.dataRepository.fetch(userID: otherUserID)
                case 1:
                    _ = try await fixture.dataRepository.save(.init(), userID: otherUserID, expectedRevision: 0)
                case 2:
                    try await fixture.repository.backup(filenames: ["photo.jpg"], userID: otherUserID)
                case 3:
                    try await fixture.repository.restore(filenames: ["photo.jpg"], userID: otherUserID)
                default:
                    try await fixture.repository.remove(filenames: ["photo.jpg"], userID: otherUserID)
                }
            }
            do {
                try await task.value
                XCTFail("취소된 작업이 성공했습니다: \(operation)")
            } catch {
                XCTAssertTrue(error is CancellationError, "\(operation): \(error)")
            }
        }
        XCTAssertTrue(fixture.log.requests.isEmpty)
    }

    func testEmptyPhotoBatchesStillBypassAccountValidation() async throws {
        let fixture = try PhotoRepositoryFixture { _, _ in
            XCTFail("빈 사진 작업은 요청을 보내면 안 됩니다.")
            return (500, Data())
        }
        try await fixture.repository.backup(filenames: [], userID: "not-a-user")
        try await fixture.repository.restore(filenames: [], userID: "not-a-user")
        try await fixture.repository.remove(filenames: [], userID: "not-a-user")
        XCTAssertTrue(fixture.log.requests.isEmpty)
    }

    func testPhotoRemovalRejectsLateAccountSwitch() async throws {
        let fixture = try PhotoRepositoryFixture { request, storage in
            XCTAssertEqual(request.httpMethod, "DELETE")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer photo-session-\(storage.originalUserID!.uuidString)")
            try storage.setUser(UUID())
            return (200, Data("[]".utf8))
        }
        do {
            try await fixture.repository.remove(filenames: ["photo.jpg"], userID: fixture.userID.uuidString)
            XCTFail("계정 변경 뒤 완료된 삭제 응답을 정상 결과로 받으면 안 됩니다.")
        } catch {
            XCTAssertEqual(error as? NativeAccountDataError, .accountChanged)
        }
        XCTAssertEqual(fixture.log.requests.count, 1)
    }

    func testAccountSwitchAfterLeaseCreationStillFinishesWithOwnerToken() async throws {
        let lease = UUID()
        let fixture = try PhotoRepositoryFixture { request, storage in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer photo-session-\(storage.originalUserID!.uuidString)")
            if request.httpMethod == "HEAD" { return (404, Data()) }
            if request.url!.path.hasSuffix("begin_account_media_upload") {
                try storage.setUser(UUID())
                return (200, Data("\"\(lease.uuidString)\"".utf8))
            }
            if request.url!.path.hasSuffix("finish_account_media_upload") {
                let body = try JSONDecoder().decode([String: String].self, from: request.photoBody)
                XCTAssertEqual(body["upload_id"]?.lowercased(), lease.uuidString.lowercased())
                return (204, Data())
            }
            XCTFail("계정 변경 후 사진 업로드를 진행하면 안 됩니다.")
            return (500, Data())
        }
        let owner = fixture.userID.uuidString.lowercased()
        let filename = "\(UUID().uuidString.lowercased()).jpg"
        try DiningReflectionPhotoStore.restore(jpeg(), filename: filename, ownerScope: owner)
        defer { DiningReflectionPhotoStore.remove(filename: filename, ownerScope: owner) }
        do {
            try await fixture.repository.backup(filenames: [filename], userID: owner)
            XCTFail("계정 변경 후 백업이 성공하면 안 됩니다.")
        } catch {
            XCTAssertEqual(error as? NativeAccountDataError, .accountChanged)
        }
        let requests = fixture.log.requests
        XCTAssertEqual(requests.count, 3)
        XCTAssertTrue(requests.last?.url?.path.hasSuffix("finish_account_media_upload") == true)
    }

    func testRestoreDoesNotReuseAnotherAccountsSameFilename() async throws {
        let otherOwner = UUID().uuidString.lowercased(), filename = "\(UUID().uuidString.lowercased()).jpg"
        let remoteBytes = try jpeg(red: 1), otherBytes = try jpeg(red: 0)
        try DiningReflectionPhotoStore.restore(otherBytes, filename: filename, ownerScope: otherOwner)
        let fixture = try PhotoRepositoryFixture { _, _ in (200, remoteBytes) }
        let owner = fixture.userID.uuidString.lowercased()
        defer {
            DiningReflectionPhotoStore.remove(filename: filename, ownerScope: owner)
            DiningReflectionPhotoStore.remove(filename: filename, ownerScope: otherOwner)
        }
        try await fixture.repository.restore(filenames: [filename], userID: owner)
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: filename, ownerScope: owner), remoteBytes)
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: filename, ownerScope: otherOwner), otherBytes)
        XCTAssertEqual(fixture.log.requests.count, 1)
    }

    func testAccountSourceRequestsUseOwnerTokenAndRejectLateResponseAfterAccountSwitch() async throws {
        let fixture = try PhotoRepositoryFixture { request, storage in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer photo-session-\(storage.originalUserID!.uuidString)")
            try storage.setUser(UUID())
            return (200, Data("[]".utf8))
        }
        do {
            _ = try await fixture.dataRepository.fetch(userID: fixture.userID.uuidString)
            XCTFail("계정 변경 뒤 완료된 원문 응답을 사용하면 안 됩니다.")
        } catch { XCTAssertEqual(error as? NativeAccountDataError, .accountChanged) }
        XCTAssertEqual(fixture.log.requests.count, 1)
    }

    func testAccountSourceSaveRejectsWrongAccountWithoutSendingAndUsesExpectedRevision() async throws {
        let fixture = try PhotoRepositoryFixture { request, storage in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer photo-session-\(storage.originalUserID!.uuidString)")
            let body = try JSONSerialization.jsonObject(with: request.photoBody) as! [String: Any]
            XCTAssertEqual(body["p_expected_revision"] as? Int, 4)
            try storage.setUser(UUID())
            return (200, Data("5".utf8))
        }
        do {
            _ = try await fixture.dataRepository.save(.init(), userID: UUID().uuidString, expectedRevision: 4)
            XCTFail("다른 계정으로 쓰기 요청을 보내면 안 됩니다.")
        } catch { XCTAssertEqual(error as? NativeAccountDataError, .accountChanged) }
        XCTAssertTrue(fixture.log.requests.isEmpty)
        do {
            _ = try await fixture.dataRepository.save(.init(), userID: fixture.userID.uuidString, expectedRevision: 4)
            XCTFail("계정 변경 뒤 완료된 쓰기 응답을 현재 계정에 적용하면 안 됩니다.")
        } catch { XCTAssertEqual(error as? NativeAccountDataError, .accountChanged) }
        XCTAssertEqual(fixture.log.requests.count, 1)
    }

    func testBackupUploadsExactOriginalOnceAndFinishesUploadLease() async throws {
        let original = try jpeg(), filename = try DiningReflectionPhotoStore.save(original, entryID: UUID())
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        let lease = UUID()
        let fixture = try PhotoRepositoryFixture { request, _ in
            if request.httpMethod == "HEAD" { return (404, Data()) }
            if request.url!.path.hasSuffix("begin_account_media_upload") { return (200, Data("\"\(lease.uuidString)\"".utf8)) }
            if request.url!.path.hasSuffix("finish_account_media_upload") {
                XCTAssertEqual(try JSONDecoder().decode([String: String].self, from: request.photoBody)["upload_id"]?.lowercased(), lease.uuidString.lowercased())
                return (204, Data())
            }
            XCTAssertNotNil(request.photoBody.range(of: original))
            XCTAssertEqual(request.value(forHTTPHeaderField: "x-upsert"), "false")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Cache-Control"), "max-age=0")
            return (200, Data(#"{"Id":"photo-id","Key":"native-dining-photos/photo.jpg"}"#.utf8))
        }
        try DiningReflectionPhotoStore.copyPhotos(filenames: [filename], from: "guest", to: fixture.userID.uuidString.lowercased())
        defer { DiningReflectionPhotoStore.remove(filename: filename, ownerScope: fixture.userID.uuidString.lowercased()) }
        try await fixture.repository.backup(filenames: [filename, filename], userID: fixture.userID.uuidString)
        let requests = fixture.log.requests
        XCTAssertEqual(requests.count, 4)
        XCTAssertTrue(requests[1].url!.path.hasSuffix("begin_account_media_upload"))
        XCTAssertTrue(requests[3].url!.path.hasSuffix("finish_account_media_upload"))
        XCTAssertEqual(requests[2].url!.path, "/storage/v1/object/native-dining-photos/\(fixture.userID.uuidString.lowercased())/\(filename)")
        XCTAssertTrue(requests.allSatisfy { $0.value(forHTTPHeaderField: "Authorization") == "Bearer photo-session-\(fixture.userID.uuidString)" })
    }

    func testBackupAcceptsExistingRemoteOriginalAndRejectsMissingOriginal() async throws {
        let existing = "\(UUID().uuidString.lowercased()).jpg", missing = "\(UUID().uuidString.lowercased()).jpg"
        let fixture = try PhotoRepositoryFixture { request, _ in
            XCTAssertEqual(request.httpMethod, "HEAD")
            return (request.url!.lastPathComponent == existing ? 200 : 404, Data())
        }
        try await fixture.repository.backup(filenames: [existing], userID: fixture.userID.uuidString)
        do {
            try await fixture.repository.backup(filenames: [missing], userID: fixture.userID.uuidString)
            XCTFail("원본이 없는 사진의 백업을 성공으로 처리하면 안 됩니다.")
        } catch {
            XCTAssertEqual(error as? DiningReflectionPhotoStore.PhotoError, .missingOriginal)
        }
        XCTAssertEqual(fixture.log.requests.count, 2)
    }

    func testUploadFailureStillFinishesLeaseAndThrows() async throws {
        let filename = try DiningReflectionPhotoStore.save(jpeg(), entryID: UUID())
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        let fixture = try PhotoRepositoryFixture { request, _ in
            if request.httpMethod == "HEAD" { return (404, Data()) }
            if request.url!.path.hasSuffix("begin_account_media_upload") { return (200, Data("\"\(UUID().uuidString)\"".utf8)) }
            if request.url!.path.hasSuffix("finish_account_media_upload") { return (204, Data()) }
            return (500, Data())
        }
        try DiningReflectionPhotoStore.copyPhotos(filenames: [filename], from: "guest", to: fixture.userID.uuidString.lowercased())
        defer { DiningReflectionPhotoStore.remove(filename: filename, ownerScope: fixture.userID.uuidString.lowercased()) }
        do {
            try await fixture.repository.backup(filenames: [filename], userID: fixture.userID.uuidString)
            XCTFail("업로드 실패를 성공으로 처리하면 안 됩니다.")
        } catch { }
        XCTAssertTrue(fixture.log.requests.last?.url?.path.hasSuffix("finish_account_media_upload") == true)
        XCTAssertEqual(fixture.log.requests.count, 4)
        XCTAssertNotNil(DiningReflectionPhotoStore.data(for: filename))
    }

    func testRestoreChecksDownloadedImageAndSessionBeforeWriting() async throws {
        let original = try jpeg(), restored = "\(UUID().uuidString.lowercased()).jpg"
        let invalid = "\(UUID().uuidString.lowercased()).jpg", switched = "\(UUID().uuidString.lowercased()).jpg"
        defer { [restored, invalid, switched].forEach { DiningReflectionPhotoStore.remove(filename: $0) } }
        let fixture = try PhotoRepositoryFixture { request, storage in
            XCTAssertEqual(request.httpMethod, "GET")
            if request.url!.lastPathComponent == invalid { return (200, Data("not a photo".utf8)) }
            if request.url!.lastPathComponent == switched { try storage.setUser(UUID()) }
            return (200, original)
        }
        let scope = fixture.userID.uuidString.lowercased()
        defer { [restored, invalid, switched].forEach { DiningReflectionPhotoStore.remove(filename: $0, ownerScope: scope) } }
        try await fixture.repository.restore(filenames: [restored], userID: fixture.userID.uuidString)
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: restored, ownerScope: scope), original)
        // 이미 유효한 로컬 원본은 다시 다운로드하지 않는다.
        try await fixture.repository.restore(filenames: [restored], userID: fixture.userID.uuidString)
        XCTAssertEqual(fixture.log.requests.count, 1)
        do {
            try await fixture.repository.restore(filenames: [invalid], userID: fixture.userID.uuidString)
            XCTFail("잘못된 이미지를 복원하면 안 됩니다.")
        } catch { XCTAssertEqual(error as? DiningReflectionPhotoStore.PhotoError, .invalidImage) }
        do {
            try await fixture.repository.restore(filenames: [switched], userID: fixture.userID.uuidString)
            XCTFail("계정이 바뀐 뒤 다운로드를 복원하면 안 됩니다.")
        } catch { guard case NativeAccountDataError.accountChanged = error else { return XCTFail("예상하지 못한 오류: \(error)") } }
        XCTAssertNil(DiningReflectionPhotoStore.data(for: invalid, ownerScope: scope))
        XCTAssertNil(DiningReflectionPhotoStore.data(for: switched, ownerScope: scope))
    }

    func testInvalidFilenameAndOtherAccountNeverReachTheNetwork() async throws {
        let fixture = try PhotoRepositoryFixture { _, _ in
            XCTFail("잘못된 경로나 다른 계정으로 요청하면 안 됩니다.")
            return (500, Data())
        }
        do {
            try await fixture.repository.backup(filenames: ["../photo.jpg"], userID: fixture.userID.uuidString)
            XCTFail("잘못된 파일명 허용")
        } catch { XCTAssertEqual(error as? DiningReflectionPhotoStore.PhotoError, .invalidFilename) }
        for userID in [UUID().uuidString, "not-a-user"] {
            do {
                try await fixture.repository.restore(filenames: ["photo.jpg"], userID: userID)
                XCTFail("다른 계정 허용")
            } catch { guard case NativeAccountDataError.accountChanged = error else { return XCTFail("예상하지 못한 오류: \(error)") } }
        }
        XCTAssertTrue(fixture.log.requests.isEmpty)
    }

    func testRemoveOnlyDeletesOwnedRemotePathsAndPreservesLocalOriginal() async throws {
        let original = try jpeg(), filename = try DiningReflectionPhotoStore.save(original, entryID: UUID())
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        let fixture = try PhotoRepositoryFixture { request, _ in
            XCTAssertEqual(request.httpMethod, "DELETE")
            return (200, Data("[]".utf8))
        }
        try await fixture.repository.remove(filenames: [filename, filename], userID: fixture.userID.uuidString)
        let request = try XCTUnwrap(fixture.log.requests.first)
        let body = try JSONDecoder().decode([String: [String]].self, from: request.photoBody)
        XCTAssertEqual(body["prefixes"], ["\(fixture.userID.uuidString.lowercased())/\(filename)"])
        XCTAssertEqual(fixture.log.requests.count, 1)
        XCTAssertEqual(DiningReflectionPhotoStore.data(for: filename), original)
    }
    #endif
}

#if canImport(Supabase)
private final class PhotoAuthStorage: AuthLocalStorage, @unchecked Sendable {
    private let lock = NSLock()
    private var values: [String: Data] = [:]
    static let key = "native-photo-test-session"
    private(set) var originalUserID: UUID?

    func store(key: String, value: Data) throws { lock.lock(); defer { lock.unlock() }; values[key] = value }
    func retrieve(key: String) throws -> Data? { lock.lock(); defer { lock.unlock() }; return values[key] }
    func remove(key: String) throws { lock.lock(); defer { lock.unlock() }; values.removeValue(forKey: key) }
    func setUser(_ userID: UUID) throws {
        if originalUserID == nil { originalUserID = userID }
        let session = Session(accessToken: "photo-session-\(userID.uuidString)", tokenType: "bearer", expiresIn: 3_600,
            expiresAt: Date.now.timeIntervalSince1970 + 3_600, refreshToken: "photo-refresh",
            user: User(id: userID, appMetadata: [:], userMetadata: [:], aud: "authenticated", createdAt: .now, updatedAt: .now))
        try store(key: Self.key, value: JSONEncoder().encode(session))
    }
}

private final class PhotoRequestLog: @unchecked Sendable {
    private let lock = NSLock()
    private var values: [URLRequest] = []
    var requests: [URLRequest] { lock.lock(); defer { lock.unlock() }; return values }
    func append(_ request: URLRequest) { lock.lock(); defer { lock.unlock() }; values.append(request) }
}

private final class PhotoRepositoryFixture {
    let userID = UUID()
    let repository: SupabaseNativeAccountPhotoRepository
    let dataRepository: SupabaseNativeAccountDataRepository
    let log = PhotoRequestLog()
    private let host = "photos-\(UUID().uuidString.lowercased()).invalid"
    private let session: URLSession

    init(response: @escaping @Sendable (URLRequest, PhotoAuthStorage) throws -> (Int, Data)) throws {
        let storage = PhotoAuthStorage()
        try storage.setUser(userID)
        let sessionConfiguration = URLSessionConfiguration.ephemeral
        sessionConfiguration.protocolClasses = [PhotoHTTPProtocol.self]
        session = URLSession(configuration: sessionConfiguration)
        let configuration = BackendConfiguration(environment: .local, supabaseURL: URL(string: "https://\(host)")!,
            supabasePublishableKey: "photo-test-publishable", publicMediaBaseURL: nil, authRedirectURL: URL(string: "tastebuddy://auth/callback")!)
        let client = SupabaseClient(supabaseURL: configuration.supabaseURL, supabaseKey: configuration.supabasePublishableKey,
            options: .init(auth: .init(storage: storage, storageKey: PhotoAuthStorage.key, autoRefreshToken: false, emitLocalSessionAsInitialSession: true),
                           global: .init(session: session)))
        repository = SupabaseNativeAccountPhotoRepository(client: client, configuration: configuration, httpSession: session)
        dataRepository = SupabaseNativeAccountDataRepository(client: client, configuration: configuration, httpSession: session)
        PhotoHTTPProtocol.register(host: host) { [log] request in
            log.append(request)
            return try response(request, storage)
        }
    }
    deinit { PhotoHTTPProtocol.unregister(host: host); session.invalidateAndCancel() }
}

private final class PhotoHTTPProtocol: URLProtocol {
    private static let lock = NSLock()
    private static var handlers: [String: @Sendable (URLRequest) throws -> (Int, Data)] = [:]
    static func register(host: String, handler: @escaping @Sendable (URLRequest) throws -> (Int, Data)) {
        lock.lock(); defer { lock.unlock() }; handlers[host] = handler
    }
    static func unregister(host: String) { lock.lock(); defer { lock.unlock() }; handlers.removeValue(forKey: host) }
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        Self.lock.lock()
        let handler = Self.handlers[request.url?.host ?? ""]
        Self.lock.unlock()
        do {
            guard let handler else { throw URLError(.unsupportedURL) }
            // URLSession이 body를 stream으로 바꿔도 테스트가 원본 전송 바이트를 확인한다.
            var captured = request
            captured.httpBody = request.photoBody
            let (status, data) = try handler(captured)
            let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
    override func stopLoading() { }
}

private extension URLRequest {
    var photoBody: Data {
        if let httpBody { return httpBody }
        guard let stream = httpBodyStream else { return Data() }
        stream.open()
        defer { stream.close() }
        var data = Data(), buffer = [UInt8](repeating: 0, count: 4_096)
        while stream.hasBytesAvailable {
            let count = stream.read(&buffer, maxLength: buffer.count)
            guard count > 0 else { break }
            data.append(buffer, count: count)
        }
        return data
    }
}
#endif
