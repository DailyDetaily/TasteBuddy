import Foundation

#if canImport(Supabase)
import Supabase
#endif

/// 원문 Codable 데이터를 그대로 보관한다. 파생 분석 결과를 원본으로 재저장하지 않는다.
struct NativeAccountSnapshot: Codable, Equatable {
    // v1 앱은 v2를 읽지 않아 새 시간·교정 필드를 재인코딩하며 지우지 않는다.
    var schemaVersion = 2
    var values: [String: Data] = [:]
    var hasSeenOnboarding = false
    var photoFilenames: [String] = []

    var isEmpty: Bool { values.isEmpty && !hasSeenOnboarding }
    var hasSupportedSchema: Bool { [1, 2].contains(schemaVersion) }
}

struct NativeAccountArchive: Codable, Equatable {
    var snapshot: NativeAccountSnapshot
    var remoteRevision = 0
    var isDirty = false
    var pendingPhotoDeletions: [String] = []
}

struct NativeAccountRemoteData: Codable, Equatable {
    let payload: NativeAccountSnapshot
    let revision: Int
}

enum NativeAccountConflictResolution {
    case thisDevice, accountBackup
}

enum NativeAccountDataError: LocalizedError, Equatable {
    case unavailable, accountChanged, conflict, unsupportedVersion, invalidSource

    var errorDescription: String? {
        switch self {
        case .unavailable: "기록은 이 기기에 보관되어 있습니다. 계정 백업 연결을 다시 확인해 주세요."
        case .accountChanged: "로그인 계정이 바뀌어 백업을 멈췄습니다. 기록은 이 기기에 보관되어 있습니다."
        case .conflict: "다른 기기의 기록이 변경되었습니다. 이 기기의 기록을 보존했으며 자동 덮어쓰기를 멈췄습니다."
        case .unsupportedVersion: "더 새로운 버전에서 저장한 기록입니다. 앱을 업데이트해 주세요."
        case .invalidSource: "보관된 원문 기록을 읽지 못해 변경을 저장하지 않았습니다. 기존 원문은 그대로 보존되어 있습니다."
        }
    }
}

/// Diagnostic codes only: never log source records, account IDs, tokens or server messages.
enum NativeAccountDataDiagnostics {
    static func code(for error: Error) -> String {
        #if canImport(Supabase)
        if let error = error as? PostgrestError { return "postgrest:\(error.code ?? "unknown")" }
        if let error = error as? StorageError { return "storage:\(error.statusCode ?? "unknown")" }
        #endif
        if let error = error as? URLError { return "url:\(error.code.rawValue)" }
        if error is DecodingError { return "decoding" }
        return String(describing: type(of: error))
    }
}

protocol NativeAccountDataRepository {
    func fetch(userID: String) async throws -> NativeAccountRemoteData?
    func save(_ snapshot: NativeAccountSnapshot, userID: String, expectedRevision: Int) async throws -> Int
}

struct UnavailableNativeAccountDataRepository: NativeAccountDataRepository {
    func fetch(userID: String) async throws -> NativeAccountRemoteData? { throw NativeAccountDataError.unavailable }
    func save(_ snapshot: NativeAccountSnapshot, userID: String, expectedRevision: Int) async throws -> Int {
        throw NativeAccountDataError.unavailable
    }
}

#if canImport(Supabase)
struct SupabaseNativeAccountDataRepository: NativeAccountDataRepository {
    let client: SupabaseClient
    let configuration: BackendConfiguration
    var httpSession: URLSession = .shared

    private var accountRequestContext: NativeAccountRequestContext {
        NativeAccountRequestContext(
            client: client, configuration: configuration, httpSession: httpSession)
    }

    private func checkAccount(_ userID: String) throws {
        try accountRequestContext.checkAccount(userID)
    }

    private func requestClient(userID: String) async throws -> SupabaseClient {
        try await accountRequestContext.requestClient(userID: userID)
    }

    func fetch(userID: String) async throws -> NativeAccountRemoteData? {
        let requests = try await requestClient(userID: userID)
        let rows: [NativeAccountRemoteData] = try await requests.from("native_account_data")
            .select("payload,revision")
            .eq("user_id", value: userID)
            .limit(1)
            .execute().value
        try checkAccount(userID)
        guard rows.first?.payload.hasSupportedSchema ?? true else {
            throw NativeAccountDataError.unsupportedVersion
        }
        return rows.first
    }

    func save(_ snapshot: NativeAccountSnapshot, userID: String, expectedRevision: Int) async throws -> Int {
        let requests = try await requestClient(userID: userID)
        struct Parameters: Encodable {
            let p_user_id: String
            let p_payload: NativeAccountSnapshot
            let p_expected_revision: Int
        }
        // 기기 간 변경 충돌은 자동 병합하지 않는다. 비교 후 쓰기로 양쪽 원본을 보존한다.
        let revision: Int = try await requests.rpc("save_native_account_data", params: Parameters(
            p_user_id: userID, p_payload: snapshot, p_expected_revision: expectedRevision
        )).execute().value
        try checkAccount(userID)
        return revision
    }
}
#endif

enum NativeAccountDataRepositoryFactory {
    static func makeDefault(bundle: Bundle = .main) -> any NativeAccountDataRepository {
        #if canImport(Supabase)
        if let configuration = try? BackendConfiguration.load(bundle: bundle) {
            return SupabaseNativeAccountDataRepository(
                client: SupabaseClientProvider(configuration: configuration).makeClient(), configuration: configuration)
        }
        #endif
        return UnavailableNativeAccountDataRepository()
    }
}
