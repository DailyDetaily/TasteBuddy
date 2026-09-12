import Foundation

#if canImport(Supabase)
import Supabase
#endif

protocol NativeAccountPhotoRepository {
    func backup(filenames: [String], userID: String) async throws
    func restore(filenames: [String], userID: String) async throws
    func remove(filenames: [String], userID: String) async throws
}

struct UnavailableNativeAccountPhotoRepository: NativeAccountPhotoRepository {
    func backup(filenames: [String], userID: String) async throws {
        if !filenames.isEmpty { throw NativeAccountDataError.unavailable }
    }
    func restore(filenames: [String], userID: String) async throws {
        if !filenames.isEmpty { throw NativeAccountDataError.unavailable }
    }
    func remove(filenames: [String], userID: String) async throws {
        if !filenames.isEmpty { throw NativeAccountDataError.unavailable }
    }
}

#if canImport(Supabase)
struct SupabaseNativeAccountPhotoRepository: NativeAccountPhotoRepository {
    let client: SupabaseClient
    let configuration: BackendConfiguration
    var httpSession: URLSession = .shared
    private static let bucket = "native-dining-photos"

    private func validatedFilenames(_ filenames: [String]) throws -> [String] {
        guard filenames.allSatisfy(DiningReflectionPhotoStore.isValidFilename) else {
            throw DiningReflectionPhotoStore.PhotoError.invalidFilename
        }
        return Array(Set(filenames)).sorted()
    }

    private func canonicalUserID(_ userID: String) throws -> String {
        guard let id = UUID(uuidString: userID) else { throw NativeAccountDataError.accountChanged }
        return id.uuidString.lowercased()
    }

    private func checkAccount(_ userID: String) throws {
        try Task.checkCancellation()
        guard let session = client.auth.currentSession, !session.user.isAnonymous,
              session.user.id == UUID(uuidString: userID) else { throw NativeAccountDataError.accountChanged }
    }

    private func requestClient(userID: String) async throws -> SupabaseClient {
        try checkAccount(userID)
        let session = try await client.auth.session
        try checkAccount(userID)
        guard !session.user.isAnonymous, session.user.id == UUID(uuidString: userID) else {
            throw NativeAccountDataError.accountChanged
        }
        // SDK가 전송 직전에 새 계정 토큰으로 교체하지 않도록 작업 소유자의 토큰을 고정한다.
        return SupabaseClient(supabaseURL: configuration.supabaseURL, supabaseKey: configuration.supabasePublishableKey,
            options: .init(auth: .init(autoRefreshToken: false, accessToken: { session.accessToken }),
                           global: .init(session: httpSession)))
    }

    private func finishUpload(_ uploadID: UUID, client: SupabaseClient) async throws {
        struct Parameters: Encodable { let upload_id: UUID }
        // 원래 작업이 취소되거나 계정이 바뀌어도 원래 소유자의 업로드 임대는 해제한다.
        try await Task.detached {
            _ = try await client.rpc("finish_account_media_upload", params: Parameters(upload_id: uploadID)).execute()
        }.value
    }

    func backup(filenames: [String], userID: String) async throws {
        let filenames = try validatedFilenames(filenames)
        guard !filenames.isEmpty else { return }
        let userID = try canonicalUserID(userID)
        let requests = try await requestClient(userID: userID)
        let bucket = requests.storage.from(Self.bucket)
        for filename in filenames {
            try checkAccount(userID)
            let path = "\(userID.lowercased())/\(filename)"
            let exists = try await bucket.exists(path: path)
            try checkAccount(userID)
            if exists { continue }
            guard let data = try DiningReflectionPhotoStore.originalData(for: filename) else {
                throw DiningReflectionPhotoStore.PhotoError.missingOriginal
            }
            try checkAccount(userID)
            let uploadID: UUID = try await requests.rpc("begin_account_media_upload").execute().value
            do {
                try checkAccount(userID)
                try await bucket.upload(path, data: data, options: .init(cacheControl: "0", contentType: "image/jpeg", upsert: false))
                try checkAccount(userID)
            } catch {
                try? await finishUpload(uploadID, client: requests)
                throw error
            }
            try await finishUpload(uploadID, client: requests)
            try checkAccount(userID)
        }
    }

    func restore(filenames: [String], userID: String) async throws {
        let filenames = try validatedFilenames(filenames)
        guard !filenames.isEmpty else { return }
        let userID = try canonicalUserID(userID)
        let requests = try await requestClient(userID: userID)
        let bucket = requests.storage.from(Self.bucket)
        for filename in filenames {
            try checkAccount(userID)
            if try DiningReflectionPhotoStore.originalData(for: filename) != nil { continue }
            let data = try await bucket.download(path: "\(userID.lowercased())/\(filename)")
            try checkAccount(userID)
            try DiningReflectionPhotoStore.restore(data, filename: filename)
        }
    }

    func remove(filenames: [String], userID: String) async throws {
        let filenames = try validatedFilenames(filenames)
        guard !filenames.isEmpty else { return }
        let userID = try canonicalUserID(userID)
        let requests = try await requestClient(userID: userID)
        try checkAccount(userID)
        _ = try await requests.storage.from(Self.bucket).remove(paths: filenames.map { "\(userID.lowercased())/\($0)" })
        try checkAccount(userID)
    }
}
#endif

enum NativeAccountPhotoRepositoryFactory {
    static func makeDefault(bundle: Bundle = .main) -> any NativeAccountPhotoRepository {
        #if canImport(Supabase)
        if let configuration = try? BackendConfiguration.load(bundle: bundle) {
            return SupabaseNativeAccountPhotoRepository(
                client: SupabaseClientProvider(configuration: configuration).makeClient(), configuration: configuration)
        }
        #endif
        return UnavailableNativeAccountPhotoRepository()
    }
}
