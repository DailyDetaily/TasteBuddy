import Foundation
#if canImport(Supabase)
import Supabase
#endif

struct ChatGPTAnalysisConfiguration: Equatable {
    let entryURL: URL

    static func load(bundle: Bundle = .main) -> Self? {
        from(value: bundle.object(forInfoDictionaryKey: "TBChatGPTEntryURL") as? String)
    }

    static func from(value: String?) -> Self? {
        guard let value, let url = URL(string: value), url.scheme == "https",
              url.host == "chatgpt.com", url.user == nil, url.password == nil,
              url.query == nil, url.fragment == nil,
              url.path.hasPrefix("/plugins/"), url.path.count > "/plugins/".count else { return nil }
        return Self(entryURL: url)
    }
}

struct ChatGPTAnalysisExport: Encodable {
    struct Observation: Encodable {
        let id: String
        let experienceID: UUID
        let foodName: String
        let recordedAt: String
        let kind: String
        let attribute: String
        let value: String
        let scale: String
        let target: String
        let phase: String
        let sourceField: String
        let phrase: String
        let sourceSpans: [SensorySourceSpan]
        let reference: String?
        let combinationComponents: [SensoryCombinationComponent]
    }
    struct Unresolved: Encodable {
        let experienceID: UUID
        let foodName: String
        let recordedAt: String
        let sourceField: String
        let phrase: String
        let reason: String
    }
    let schemaVersion = 1
    let engineVersion: String
    let generatedAt: String
    let totalExperienceCount: Int
    let includedExperienceCount: Int
    let observations: [Observation]
    let unresolved: [Unresolved]
    let limits: [String]

    init(snapshot: SensoryAnalysisSnapshot, now: Date = Date()) {
        let formatter = ISO8601DateFormatter()
        let datedIDs = snapshot.observations.map { ($0.experienceID, $0.recordedAt) }
            + snapshot.unresolved.map { ($0.experienceID, $0.recordedAt) }
        var ids: [UUID] = []
        for (id, _) in datedIDs.sorted(by: { lhs, rhs in
            lhs.1 == rhs.1 ? lhs.0.uuidString < rhs.0.uuidString : lhs.1 > rhs.1
        }) where !ids.contains(id) {
            if ids.count == 20 { break }
            ids.append(id)
        }
        let selected = Set(ids)
        engineVersion = snapshot.engineVersion
        generatedAt = formatter.string(from: now)
        totalExperienceCount = snapshot.completedExperienceCount
        includedExperienceCount = ids.count
        observations = snapshot.observations.filter { selected.contains($0.experienceID) }.map {
            Observation(id: $0.id, experienceID: $0.experienceID, foodName: $0.foodName,
                recordedAt: formatter.string(from: $0.recordedAt), kind: $0.kind,
                attribute: $0.attribute ?? $0.attributeLabel, value: $0.value.text, scale: $0.scale,
                target: $0.target, phase: $0.phase, sourceField: $0.sourceField, phrase: $0.phrase,
                sourceSpans: $0.sourceSpans, reference: $0.reference, combinationComponents: $0.combinationComponents)
        }
        unresolved = snapshot.unresolved.filter { selected.contains($0.experienceID) }.map {
            Unresolved(experienceID: $0.experienceID, foodName: $0.foodName,
                recordedAt: formatter.string(from: $0.recordedAt), sourceField: $0.sourceField,
                phrase: $0.phrase, reason: $0.reason)
        }
        limits = snapshot.limits + [
            "최근 최대 20개 기록 중 감각 평가와 원문 근거가 있는 자료입니다. 전체 식생활을 대표하지 않습니다.",
            "같은 experienceID의 관찰은 하나의 기록에서 나온 근거입니다. 강도와 호감은 다릅니다.",
            "앱에서 분석을 요청한 시점의 자료입니다. 이후 수정·삭제는 다시 분석을 요청해야 반영됩니다.",
        ]
    }
}

struct ChatGPTAnalysisAccount: Equatable {
    let id: UUID
    let email: String
}

enum ChatGPTAnalysisConnectionError: LocalizedError {
    case signInRequired, accountChanged, noEvidence, tooLarge, unavailable
    var errorDescription: String? {
        switch self {
        case .signInRequired: "Taste Buddy 계정에 이메일을 연결한 뒤 다시 시도해 주세요."
        case .accountChanged: "로그인 계정이 바뀌었습니다. 화면을 다시 열어 계정을 확인해 주세요."
        case .noEvidence: "식사 기록의 감각 평가를 남긴 뒤 분석을 요청해 주세요."
        case .tooLarge: "분석 자료가 너무 큽니다. 기록을 확인한 뒤 다시 시도해 주세요."
        case .unavailable: "계정 연결을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요."
        }
    }
}

struct ChatGPTAnalysisRepository {
    func account() async throws -> ChatGPTAnalysisAccount {
        #if canImport(Supabase)
        let session = try await client().auth.session
        guard !session.user.isAnonymous, let email = session.user.email, !email.isEmpty else {
            throw ChatGPTAnalysisConnectionError.signInRequired
        }
        return .init(id: session.user.id, email: email)
        #else
        throw ChatGPTAnalysisConnectionError.unavailable
        #endif
    }

    func publish(_ payload: ChatGPTAnalysisExport, account expected: ChatGPTAnalysisAccount) async throws {
        guard payload.includedExperienceCount > 0 else { throw ChatGPTAnalysisConnectionError.noEvidence }
        guard try JSONEncoder().encode(payload).count < 480_000 else { throw ChatGPTAnalysisConnectionError.tooLarge }
        guard try await account() == expected else { throw ChatGPTAnalysisConnectionError.accountChanged }
        #if canImport(Supabase)
        struct Row: Encodable { let user_id: UUID; let payload: ChatGPTAnalysisExport }
        try await client().from("chatgpt_analysis_exports")
            .upsert(Row(user_id: expected.id, payload: payload), onConflict: "user_id")
            .execute()
        #else
        throw ChatGPTAnalysisConnectionError.unavailable
        #endif
    }

    func removeExport(account expected: ChatGPTAnalysisAccount) async throws {
        guard try await account() == expected else { throw ChatGPTAnalysisConnectionError.accountChanged }
        #if canImport(Supabase)
        try await client().from("chatgpt_analysis_exports").delete()
            .eq("user_id", value: expected.id.uuidString).execute()
        #else
        throw ChatGPTAnalysisConnectionError.unavailable
        #endif
    }

    #if canImport(Supabase)
    private func client() throws -> SupabaseClient {
        SupabaseClientProvider(configuration: try BackendConfiguration.load()).makeClient()
    }
    #endif
}
