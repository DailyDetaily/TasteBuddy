import XCTest
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
@testable import TasteBuddy

#if canImport(Supabase)
import Supabase
#endif

final class NativeAccountPhotoRepositoryTests: XCTestCase {
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

    #if canImport(Supabase)
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
        try await fixture.repository.restore(filenames: [restored], userID: fixture.userID.uuidString)
        XCTAssertEqual(try DiningReflectionPhotoStore.originalData(for: restored), original)
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
        XCTAssertNil(DiningReflectionPhotoStore.data(for: invalid))
        XCTAssertNil(DiningReflectionPhotoStore.data(for: switched))
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

    func store(key: String, value: Data) throws { lock.lock(); defer { lock.unlock() }; values[key] = value }
    func retrieve(key: String) throws -> Data? { lock.lock(); defer { lock.unlock() }; return values[key] }
    func remove(key: String) throws { lock.lock(); defer { lock.unlock() }; values.removeValue(forKey: key) }
    func setUser(_ userID: UUID) throws {
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
