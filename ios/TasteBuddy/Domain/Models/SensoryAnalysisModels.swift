import Foundation

/// Native rules mirror the versioned data contract. No model/API output is created here.
enum SensoryValue: Codable, Equatable, Hashable, Sendable {
    case text(String)
    case flag(Bool)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let flag = try? container.decode(Bool.self) { self = .flag(flag) }
        else { self = .text(try container.decode(String.self)) }
    }
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self { case .text(let text): try container.encode(text); case .flag(let flag): try container.encode(flag) }
    }
    var text: String { switch self { case .text(let text): return text; case .flag(let flag): return flag ? "있음" : "없음" } }
}

struct SensorySourceSpan: Codable, Equatable, Hashable, Sendable {
    let start: Int
    let end: Int
    let quote: String
}

/// 설문 문구와 응답을 각각 보존한다. 조합한 표시 문장은 사용자 원문으로 저장하지 않는다.
struct SensorySelectionEvidence: Codable, Equatable, Sendable {
    let selectionID: String
    let type: String
    let catalogVersion: String
    let labelSnapshot: String
    let facet: String
    let labelValue: String
    let responseValue: String?
    let relatedBubbleID: String?
    let relatedBubbleLabel: String?
    let resolution: String
}

struct SensoryObservation: Identifiable, Equatable, Sendable {
    let id: String
    let experienceID: UUID
    let foodName: String
    let recordedAt: Date
    let sourceField: String
    let kind: String
    let attribute: String?
    let attributeLabel: String
    let value: SensoryValue
    let scale: String
    let target: String
    let phase: String
    let phrase: String
    let sourceSpans: [SensorySourceSpan]
    let reference: String?
    let combinationComponents: [SensoryCombinationComponent]
    var selectionEvidence: SensorySelectionEvidence? = nil
    var mealID: UUID? = nil
    var observedAt: Date? = nil
    var knownAt: Date? = nil
    var dishKindIDs: [String] = []
    var restaurantID: String? = nil
    var menuItemID: String? = nil
    var restaurantName: String? = nil
    var independentMealID: UUID { mealID ?? experienceID }
    /// *.unspecified details preserve a mention; they do not confirm a sensation or liking.
    var isUnclassifiedDetail: Bool { kind == "sensory_detail" && attribute?.hasSuffix(".unspecified") == true }
    var domain: String? { attribute?.split(separator: ".").first.map(String.init) }
}

struct SensoryCombinationComponent: Codable, Equatable, Sendable {
    let attribute: String
    let target: String
    let reference: String?
}

struct SensoryUnresolved: Identifiable, Equatable, Sendable {
    let id: String
    let experienceID: UUID
    let foodName: String
    let recordedAt: Date
    let sourceField: String
    let phrase: String
    let reason: String
    let sourceSpans: [SensorySourceSpan]
    let needsMeaningReview: Bool
    var selectionEvidence: SensorySelectionEvidence? = nil
    var observedAt: Date? = nil
    var knownAt: Date? = nil
}

struct SensoryInsight: Identifiable, Equatable, Sendable {
    let id: String
    let kind: String
    let attribute: String?
    let title: String
    let body: String
    let evidenceIDs: [String]
    let experienceIDs: [UUID]
    var experienceCount: Int { experienceIDs.count }
}

struct SensoryStyleCandidate: Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    let label: String
    /// unknown / first_signal / scoped_dislike / mixed / repeated_support
    let status: String
    let supportEvidenceIDs: [String]
    let counterEvidenceIDs: [String]
    let supportExperienceCount: Int
    let counterExperienceCount: Int
    let eligible: Bool
}

struct SensoryMainWing: Equatable, Sendable {
    /// learning / ambiguous_main / provisional_profile. No forced main or wing.
    let status: String
    let main: SensoryStyleCandidate?
    let wing: SensoryStyleCandidate?
    let candidates: [SensoryStyleCandidate]
    let label: String
    static let empty = SensoryMainWing(status: "learning", main: nil, wing: nil, candidates: [], label: "입맛을 알아가는 중이에요")
}

struct SensoryAnalysisSnapshot: Equatable, Sendable {
    let engineVersion: String
    let observations: [SensoryObservation]
    let unresolved: [SensoryUnresolved]
    let insights: [SensoryInsight]
    let mainWing: SensoryMainWing
    /// 완료된 실제 기록 수. 반복 취향의 독립 단위는 별도의 mealID로 집계한다.
    let completedExperienceCount: Int
    /// 의미가 분명한 관찰을 하나 이상 가진 기록 수. 원문 보존 detail만 있는 기록은 제외한다.
    let sourceExperienceCount: Int
    var unresolvedExperienceCount: Int { Set(unresolved.map(\.experienceID)).count }
    let actualApiCalls: Int
    let needsMeaningReview: Bool
    let limits: [String]
    var personalModel: PersonalTasteModelSnapshot? = nil
    var perception: TastePerceptionSnapshot = .empty
    var statedPreferences: PreferenceIntakeEvidenceSnapshot = .empty
    static let empty = SensoryAnalysisSnapshot(engineVersion: "tba-native-sensory/2", observations: [], unresolved: [], insights: [], mainWing: .empty, completedExperienceCount: 0, sourceExperienceCount: 0, actualApiCalls: 0, needsMeaningReview: false, limits: ["기록한 감각과 직접 평가만 해석해요."])
}

// Codable contract types are internal so the tests can compare the native parser to generated JS expectations.
struct SensoryRuleAtom: Codable, Equatable, Sendable {
    let kind: String
    let attribute: String?
    let value: SensoryValue
    let scale: String
    var target: String?
    var phase: String?
    var phrase: String?
    var sourceSpans: [SensorySourceSpan]?
    var reference: String?
    var combinationComponents: [SensoryCombinationComponent]?
    var selectionEvidence: SensorySelectionEvidence?
}
struct SensoryRuleUnresolved: Codable, Equatable, Sendable {
    let phrase: String
    let reason: String
    let sourceSpans: [SensorySourceSpan]
    var selectionEvidence: SensorySelectionEvidence?
}
struct SensoryRuleResult: Codable, Equatable, Sendable {
    var observations: [SensoryRuleAtom] = []
    var unresolved: [SensoryRuleUnresolved] = []
    var needsAI = false
}
struct SensoryNativeContract: Decodable, Sendable {
    struct Sense: Decodable, Sendable { let attribute: String; let pattern: String }
    struct Scope: Decodable, Sendable { let value: String; let pattern: String }
    struct Language: Decodable, Sendable { let senses: [Sense]; let targets: [Scope]; let phases: [Scope] }
    struct LexiconEntry: Decodable, Sendable {
        let id: String
        let label: String
        let resolution: String
        let reason: String
        let semanticAtoms: [SensoryRuleAtom]
    }
    struct Semantic: Decodable, Sendable {
        struct Attribute: Decodable, Sendable { let id: String; let meaning: String; let label: String? }
        struct Kind: Decodable, Sendable { let scale: String }
        let attributes: [Attribute]
        let kinds: [String: Kind]
    }
    struct Style: Decodable, Sendable { let id: String; let name: String; let label: String; let attributes: [String] }
    struct Fixture: Decodable, Sendable {
        struct Answer: Decodable, Sendable {
            enum Value: Decodable, Sendable {
                case text(String)
                case choices([Choice])
                struct Choice: Decodable, Sendable { let id: String; let label: String }
                init(from decoder: Decoder) throws {
                    let c = try decoder.singleValueContainer()
                    if let text = try? c.decode(String.self) { self = .text(text) }
                    else { self = .choices(try c.decode([Choice].self)) }
                }
            }
            let question: String
            let value: Value
            let target: String?
            let phase: String?
        }
        let id: String
        let answer: Answer
        let expected: SensoryRuleResult
    }
    let ruleVersion: String
    let lexiconVersion: String
    let semantic: Semantic
    let language: Language
    let patterns: [String: String]
    let lexicon: [LexiconEntry]
    let styles: [Style]
    struct ProfileFixture: Decodable, Sendable {
        struct Expected: Decodable, Sendable {
            struct Candidate: Decodable, Sendable {
                let id: String
                let status: String
                let supportExperienceCount: Int
                let counterExperienceCount: Int
                let eligible: Bool
            }
            let status: String
            let mainID: String?
            let wingID: String?
            let candidates: [Candidate]
        }
        let id: String
        let notes: [String]
        let expected: Expected
    }
    let fixtures: [Fixture]
    let profileFixtures: [ProfileFixture]
    let selectionCatalog: DiningSensoryCatalogContract
    let overallEvaluationContract: DiningOverallEvaluationContract
}
