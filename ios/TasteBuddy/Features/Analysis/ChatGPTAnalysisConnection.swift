import Foundation
#if canImport(Supabase)
import Supabase
#endif

struct ChatGPTAnalysisConfiguration: Equatable {
    let entryURL: URL

    static func load(bundle: Bundle = .main) -> Self? {
        // v2 수신기·DB를 배포한 운영자가 명시적으로 연결을 켠다.
        guard bundle.object(forInfoDictionaryKey: "TBChatGPTExportVersion") as? String == "2" else { return nil }
        return from(value: bundle.object(forInfoDictionaryKey: "TBChatGPTEntryURL") as? String)
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
        var mealID: UUID?
        var sourceRevision: Int?
        var observedAt: String?
        var knownAt: String?
        var selectionEvidence: SensorySelectionEvidence?
    }
    struct Unresolved: Encodable {
        let experienceID: UUID
        let foodName: String
        let recordedAt: String
        let sourceField: String
        let phrase: String
        let reason: String
    }
    struct Experience: Encodable {
        struct Time: Encodable {
            let source: String
            let start: String?
            let end: String?
            let confirmedAt: String?
        }
        let experienceID: UUID
        let mealID: UUID
        let sourceRevision: Int
        let storedDate: String
        let savedAt: String?
        let updatedAt: String?
        let mealTime: Time?
        let latestCorrectionAt: String?
    }
    let schemaVersion: Int
    let engineVersion: String
    let generatedAt: String
    let totalExperienceCount: Int
    let includedExperienceCount: Int
    let observations: [Observation]
    let unresolved: [Unresolved]
    let limits: [String]
    let sourceFingerprint: String?
    let totalLocalExperienceCount: Int?
    let excludedCapturedCount: Int?
    let excludedWithoutInterpretedSourceCount: Int?
    let excludedByLimitCount: Int?
    let experiences: [Experience]?

    init(snapshot: SensoryAnalysisSnapshot, entries: [DiningEntry]? = nil, now: Date = Date()) {
        let formatter = ISO8601DateFormatter()
        schemaVersion = entries == nil ? 1 : 2
        let byID = Dictionary((entries ?? []).map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
        let datedIDs = snapshot.observations.map { ($0.experienceID, $0.recordedAt) }
            + snapshot.unresolved.map { ($0.experienceID, $0.recordedAt) }
        var ids: [UUID] = []
        for (id, _) in datedIDs.sorted(by: { lhs, rhs in
            lhs.1 == rhs.1 ? lhs.0.uuidString < rhs.0.uuidString : lhs.1 > rhs.1
        }) where !ids.contains(id) {
            if ids.count == 20 { break }
            ids.append(id)
        }
        let selected = Set(ids.filter { entries == nil || byID[$0]?.hasCompletedTasteFeedback == true })
        engineVersion = snapshot.engineVersion
        generatedAt = formatter.string(from: now)
        totalExperienceCount = snapshot.completedExperienceCount
        includedExperienceCount = selected.count
        observations = snapshot.observations.filter { selected.contains($0.experienceID) }.map {
            Observation(id: $0.id, experienceID: $0.experienceID, foodName: $0.foodName,
                recordedAt: formatter.string(from: $0.recordedAt), kind: $0.kind,
                attribute: $0.attribute ?? $0.attributeLabel, value: $0.value.text, scale: $0.scale,
                target: $0.target, phase: $0.phase, sourceField: $0.sourceField, phrase: $0.phrase,
                sourceSpans: $0.sourceSpans, reference: $0.reference, combinationComponents: $0.combinationComponents,
                mealID: entries == nil ? nil : $0.independentMealID, sourceRevision: entries == nil ? nil : $0.sourceRevision,
                observedAt: entries == nil ? nil : byID[$0.experienceID]?.confirmedMealDate.map(formatter.string),
                knownAt: entries == nil ? nil : $0.knownAt.map(formatter.string), selectionEvidence: entries == nil ? nil : $0.selectionEvidence)
        }
        unresolved = snapshot.unresolved.filter { selected.contains($0.experienceID) }.map {
            Unresolved(experienceID: $0.experienceID, foodName: $0.foodName,
                recordedAt: formatter.string(from: $0.recordedAt), sourceField: $0.sourceField,
                phrase: $0.phrase, reason: $0.reason)
        }
        if entries != nil {
            sourceFingerprint = DiningEntry.memoryFingerprint(Array(byID.values))
            totalLocalExperienceCount = byID.count
            excludedCapturedCount = byID.values.filter { !$0.hasCompletedTasteFeedback }.count
            let eligible = Set(datedIDs.map(\.0)).intersection(Set(byID.values.filter(\.hasCompletedTasteFeedback).map(\.id)))
            excludedWithoutInterpretedSourceCount = byID.values.filter(\.hasCompletedTasteFeedback).count - eligible.count
            excludedByLimitCount = eligible.count - selected.count
            experiences = selected.sorted { $0.uuidString < $1.uuidString }.compactMap { id in
                guard let entry = byID[id] else { return nil }
                return .init(experienceID: id, mealID: entry.mealID, sourceRevision: entry.memoryRevisionNumber,
                             storedDate: formatter.string(from: entry.date), savedAt: entry.savedAt.map(formatter.string), updatedAt: entry.updatedAt.map(formatter.string),
                             mealTime: entry.mealTime.map { .init(source: $0.source.rawValue, start: $0.start.map(formatter.string), end: $0.end.map(formatter.string), confirmedAt: $0.confirmedAt.map(formatter.string)) },
                             latestCorrectionAt: entry.memoryCorrections?.last.map { formatter.string(from: $0.changedAt) })
            }
        } else {
            sourceFingerprint = nil; totalLocalExperienceCount = nil; excludedCapturedCount = nil
            excludedWithoutInterpretedSourceCount = nil; excludedByLimitCount = nil; experiences = nil
        }
        limits = snapshot.limits + [
            "최근 최대 20개 기록 중 감각 평가와 원문 근거가 있는 자료입니다. 전체 식생활을 대표하지 않습니다.",
            "같은 experienceID의 관찰은 하나의 기록에서 나온 근거입니다. 강도와 호감은 다릅니다.",
            "앱에서 공유한 시점의 자료입니다. 원문 변경 시 이전 서버 자료를 제거하며 오프라인이면 제거가 대기합니다. 이전 외부 대화는 자동 수정되지 않습니다.",
            "같은 mealID의 여러 경험은 같은 식사입니다. storedDate는 출처가 확인된 식사일이 아닐 수 있습니다.",
            "현재 원본 revision의 제한된 snapshot입니다. 교정일은 새 식사일이 아니며 과거 전체 상태 복원이 아닙니다.",
            "part_liking은 명시된 부위의 평가이며 음식 전체 호감이나 특정 감각 선호로 확장할 수 없습니다.",
        ]
    }
}

struct ChatGPTAnalysisAccount: Codable, Equatable {
    let id: UUID
    let email: String
}

struct ChatGPTExportReceipt: Codable, Equatable {
    let account: ChatGPTAnalysisAccount
    let sourceFingerprint: String
    let createdAt: Date
    var engineVersion: String?
    var state: String // publishing, current, removal_pending, removed
    var label: String {
        switch state {
        case "current": Date().timeIntervalSince(createdAt) >= 86_400 ? "공유 자료 만료 · 새로 준비해 주세요" : "공유한 시점의 자료 · 최대 24시간 조회 가능"
        case "removed": "서버 분석 자료 제거 완료 · 이전 ChatGPT 대화는 별도"
        case "publishing": "공유 자료 저장 확인 중"
        default: "원문 변경됨 · 이전 서버 분석 자료 제거 대기 · 현재 자료로 사용하지 마세요"
        }
    }
}

protocol ChatGPTExportRepository {
    func account() async throws -> ChatGPTAnalysisAccount
    func publish(_ payload: ChatGPTAnalysisExport, account: ChatGPTAnalysisAccount) async throws
    func removeExport(account: ChatGPTAnalysisAccount, sourceFingerprint: String?) async throws
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

struct ChatGPTAnalysisRepository: ChatGPTExportRepository {
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

    func removeExport(account expected: ChatGPTAnalysisAccount, sourceFingerprint: String? = nil) async throws {
        guard try await account() == expected else { throw ChatGPTAnalysisConnectionError.accountChanged }
        #if canImport(Supabase)
        let request = try client().from("chatgpt_analysis_exports").delete().eq("user_id", value: expected.id.uuidString)
        if let sourceFingerprint {
            try await request.eq("payload->>sourceFingerprint", value: sourceFingerprint).execute()
        } else { try await request.execute() }
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
