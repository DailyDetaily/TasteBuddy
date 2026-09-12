import Foundation

#if canImport(Supabase)
import Supabase
#endif

/// 원문 Codable 데이터를 그대로 보관한다. 파생 분석 결과를 원본으로 재저장하지 않는다.
struct NativeAccountSnapshot: Codable, Equatable {
    var schemaVersion = 1
    var values: [String: Data] = [:]
    var hasSeenOnboarding = false
    var photoFilenames: [String] = []

    var isEmpty: Bool { values.isEmpty && !hasSeenOnboarding }
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

    private func checkAccount(_ userID: String) async throws {
        let session = try await client.auth.session
        guard !session.user.isAnonymous, session.user.id.uuidString.lowercased() == userID.lowercased() else {
            throw NativeAccountDataError.accountChanged
        }
    }

    func fetch(userID: String) async throws -> NativeAccountRemoteData? {
        try await checkAccount(userID)
        let rows: [NativeAccountRemoteData] = try await client.from("native_account_data")
            .select("payload,revision")
            .eq("user_id", value: userID)
            .limit(1)
            .execute().value
        guard (rows.first?.payload.schemaVersion ?? 1) == 1 else {
            throw NativeAccountDataError.unsupportedVersion
        }
        return rows.first
    }

    func save(_ snapshot: NativeAccountSnapshot, userID: String, expectedRevision: Int) async throws -> Int {
        try await checkAccount(userID)
        struct Parameters: Encodable {
            let p_user_id: String
            let p_payload: NativeAccountSnapshot
            let p_expected_revision: Int
        }
        // 기기 간 변경 충돌은 자동 병합하지 않는다. 비교 후 쓰기로 양쪽 원본을 보존한다.
        return try await client.rpc("save_native_account_data", params: Parameters(
            p_user_id: userID, p_payload: snapshot, p_expected_revision: expectedRevision
        )).execute().value
    }
}
#endif

enum NativeAccountDataRepositoryFactory {
    static func makeDefault(bundle: Bundle = .main) -> any NativeAccountDataRepository {
        #if canImport(Supabase)
        if let configuration = try? BackendConfiguration.load(bundle: bundle) {
            return SupabaseNativeAccountDataRepository(client: SupabaseClientProvider(configuration: configuration).makeClient())
        }
        #endif
        return UnavailableNativeAccountDataRepository()
    }
}
