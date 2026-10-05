import Foundation

// Adapted from feat/gastronomy-data-five-categories-20260915 @ 7f16530.
// One active measurement path; updated for the implementation specification v2.
enum TDCategory: String, CaseIterable, Identifiable, Sendable {
    case experience = "경험", sensation = "감각", preference = "취향", context = "맥락", change = "변화"
    var id: String { rawValue }
    var subtitle: String {
        switch self {
        case .experience: return "식사·메뉴·식당·음식 종류"
        case .sensation: return "느낀 맛·향·식감과 강도"
        case .preference: return "음식 전체·감각 호감·알맞음"
        case .context: return "조건에 따라 남긴 반응"
        case .change: return "기간별 경험·감각·평가"
        }
    }
}
enum TDDimension: String, CaseIterable, Identifiable, Sendable {
    case menu = "메뉴", restaurant = "식당", foodKind = "음식 종류"
    var id: String { rawValue }
    var unit: String { self == .restaurant ? "곳" : self == .foodKind ? "가지" : "개" }
}
struct TDIdentity: Equatable, Hashable, Sendable {
    let id: String
    let label: String
}
struct TDRecord: Equatable, Sendable {
    let id: String
    let mealID: String
    let date: Date?
    let menu: TDIdentity?
    let restaurant: TDIdentity?
    let foodKinds: [TDIdentity]
    var source: TDSourceFilter = .unknown
    var revision: Int = 0
    var fingerprint: String = ""
    var classificationUnresolved = false
    func identities(_ dimension: TDDimension) -> [TDIdentity] {
        switch dimension {
        case .menu: return menu.map { [$0] } ?? []
        case .restaurant: return restaurant.map { [$0] } ?? []
        case .foodKind: return foodKinds
        }
    }
}
enum TDFacet: String, CaseIterable, Sendable {
    case presence, intensity, liking, fit, overall
    var title: String {
        switch self {
        case .presence: return "감각 기록"
        case .intensity: return "느낀 강도"
        case .liking: return "감각별 호감"
        case .fit: return "강도의 알맞음"
        case .overall: return "음식 전체 평가"
        }
    }
    var values: [String] {
        switch self {
        case .presence: return ["present"]
        case .intensity: return ["weak", "medium", "strong"]
        case .liking: return ["negative", "neutral", "positive"]
        case .fit: return ["below_preferred", "just_right", "above_preferred"]
        case .overall: return ["very_negative", "negative", "neutral", "positive", "very_positive"]
        }
    }
    func label(_ value: String) -> String {
        if value == "mixed" { return self == .intensity ? "여러 강도" : "응답 나뉨" }
        if value == "missing" { return "미응답" }
        let labels = ["present":"기록함", "weak":"약함", "medium":"중간", "strong":"강함",
                      "negative":"아쉬움", "neutral":"보통", "positive":"좋음",
                      "below_preferred":"부족", "just_right":"알맞음", "above_preferred":"과함",
                      "very_negative":"많이 아쉬움", "very_positive":"매우 좋음"]
        return labels[value] ?? "해석 미확인"
    }
}
struct TDObservation: Equatable, Sendable {
    let id: String
    let entryID: String
    let facet: TDFacet
    let attribute: String
    let label: String
    let value: String
    let target: String
    let phase: String
    // A parent link is populated only after its current direct selection has been validated.
    let selection: String
    var reference: String? = nil
    var scale: String = ""
    var sourceRevision: Int = 0
    var catalogVersion: String = ""
    var parentSelection: String? = nil
    var senseKey: String { TDDataEngine.key([attribute, reference ?? ""]) }
    var linkageKey: String? {
        guard !selection.isEmpty else { return nil }
        return TDDataEngine.key([entryID, senseKey, target, phase, selection])
    }
    var parentLinkageKey: String? {
        guard let parentSelection, !parentSelection.isEmpty else { return nil }
        return TDDataEngine.key([entryID, senseKey, target, phase, parentSelection])
    }
    var domain: String {
        if attribute.hasPrefix("taste.") { return "맛" }
        if attribute.hasPrefix("aroma.") { return "향" }
        if attribute.hasPrefix("texture.") || attribute.hasPrefix("mouthfeel.") { return "식감" }
    return "기타"
}
}
struct TDWindow: Equatable, Sendable {
    let label: String
    let start: Date?
    let end: Date? // half-open [start, end)
    static let all = Self(label: "전체 기간", start: nil, end: nil)
    var isAll: Bool { start == nil && end == nil }
    func contains(_ date: Date?) -> Bool {
        guard let date else { return isAll }
        return (start == nil || date >= start!) && (end == nil || date < end!)
    }
    static func recent(_ days: Int, now: Date, calendar: Calendar) -> Self {
        let day = calendar.startOfDay(for: now)
        return .init(label: "최근 \(days)일", start: calendar.date(byAdding: .day, value: 1-days, to: day),
                     end: calendar.date(byAdding: .day, value: 1, to: day))
    }
    func previous(calendar: Calendar) -> Self {
        guard let start, let end else { return self }
        let days = calendar.dateComponents([.day], from: start, to: end).day ?? 0
        return .init(label: "직전 \(days)일", start: calendar.date(byAdding: .day, value: -days, to: start), end: start)
    }
    func range(calendar: Calendar) -> String {
        guard let start, let end else { return label }
        let formatter = DateFormatter()
        formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
        formatter.locale = Locale(identifier: "ko_KR"); formatter.dateFormat = "yyyy.M.d"
        let last = calendar.date(byAdding: .day, value: -1, to: end) ?? end
        return formatter.string(from: start) + "–" + formatter.string(from: last)
    }
}
struct TDSegment: Equatable, Sendable {
    let key: String
    let label: String
    let count: Int
    var evidence: TDEvidenceIDs = .empty
}
struct TDRow: Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    var value: String
    var detail: String = ""
    var amount: Double? = nil
    var segments: [TDSegment] = []
    var entryIDs: Set<String> = []
    var evidence: TDEvidenceBundle = .init()
    var state: TDCardState = .ready
    var count: Int? = nil
    var denominator: Int? = nil
    var comparison: TDComparison? = nil
    var observationIDs: Set<String> { evidence.all.observationIDs }
}
struct TDCard: Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let meaning: String
    var rows: [TDRow]
    var note: String = ""
    var isDiscovery = false
    var state: TDCardState = .ready
    var evidence: TDEvidenceBundle = .init()
    var entryIDs: Set<String> { Set(rows.flatMap(\.entryIDs)) }
}
struct TDEvent: Equatable, Sendable {
    let identity: TDIdentity
    let entryIDs: Set<String>
    let periodEntries: Set<String>
    let meals: Int
    let firstDate: Date?
    let isFirst: Bool
    let repeats: Int
    let uncertain: Bool
}
struct TDState: Equatable, Sendable {
    let records: [TDRecord]
    let observations: [TDObservation]
    let selected: [TDRecord]
    let window: TDWindow
    let now: Date
    let unknownDateIDs: Set<String>
    let futureIDs: Set<String>
    let conflictingIDs: Set<String>
    var issues: [TDEvidenceIssue] = []
    var sourceFilter: TDSourceFilter = .all
    var originalCount: Int = 0
    var timeZoneIdentifier: String = ""
    var recordMap: [String: TDRecord] { Dictionary(uniqueKeysWithValues: records.map { ($0.id, $0) }) }
    func records(in window: TDWindow) -> [TDRecord] { records.filter { window.contains($0.date) && (sourceFilter == .all || $0.source == sourceFilter) } }
}
struct TDResult: Equatable, Sendable {
    let hero: [TDRow]
    let cards: [TDCard]
    let discoveries: [TDCard]
}

enum TDDiscoveryScope: Equatable, Sendable {
    case wholeArchive
    case selectedPeriod(TDWindow)
    case comparison(TDWindow, TDWindow)
    var key: String {
        func windowKey(_ period: TDWindow) -> String {
            // A rolling window's meaning does not become new merely because midnight passed.
            if period.label.hasPrefix("최근 ") || period.label.hasPrefix("직전 ") { return period.label }
            if period.label.hasPrefix("이번 달") { return TDDataEngine.key([period.label, period.start?.ISO8601Format() ?? ""]) }
            return TDDataEngine.key([period.start?.ISO8601Format() ?? "", period.end?.ISO8601Format() ?? ""])
        }
        switch self {
        case .wholeArchive: return "wholeArchive"
        case .selectedPeriod(let period): return TDDataEngine.key(["period", windowKey(period)])
        case .comparison(_, let after): return TDDataEngine.key(["comparison", windowKey(after)])
        }
    }
    func label(calendar: Calendar) -> String {
        switch self {
        case .wholeArchive: return "전체 기록에서 발견"
        case .selectedPeriod(let period): return period.range(calendar: calendar)
        case .comparison(let before, let after): return before.range(calendar: calendar) + " ↔ " + after.range(calendar: calendar)
        }
    }
}

enum TDSourceFilter: String, CaseIterable, Identifiable, Sendable {
    case all = "전체", restaurant = "식당 음식", homeCooked = "직접 만든 요리", unknown = "출처 미확인"
    var id: String { rawValue }
}

enum TDCardState: String, Sendable {
    case emptyArchive, ready, zeroOccurrences, missingResponse, unresolvedIdentity
    case insufficientComparison, invalidEvidence, updating, failed
}

enum TDSampleUnit: String, Sendable {
    case meal = "식사", dish = "요리 기록", menu = "메뉴", restaurant = "식당", foodKind = "음식 종류"
}

enum TDEvidenceRole: String, CaseIterable, Identifiable, Sendable {
    case numerator = "해당 항목의 근거", denominator = "전체 기준 표본"
    case supporting = "좋음·알맞음 근거", counter = "반대·예외 근거", neutral = "중립 응답"
    case mixed = "서로 다른 응답", missing = "미응답", unresolved = "확인·해석 보류"
    case contextOnly = "순서 확인용 참고 기록"
    case beforeNumerator = "이전 기간 해당 근거", beforeDenominator = "이전 기간 기준 표본"
    var id: String { rawValue }
}

struct TDEvidenceIDs: Equatable, Sendable {
    var entryIDs: Set<String> = []
    var mealIDs: Set<String> = []
    var observationIDs: Set<String> = []
    static let empty = Self()
    func union(_ other: Self) -> Self {
        .init(entryIDs: entryIDs.union(other.entryIDs), mealIDs: mealIDs.union(other.mealIDs),
              observationIDs: observationIDs.union(other.observationIDs))
    }
}

struct TDEvidenceBundle: Equatable, Sendable {
    var roles: [TDEvidenceRole: TDEvidenceIDs] = [:]
    var unit: TDSampleUnit = .meal
    var period: TDWindow = .all
    var comparisonPeriod: TDWindow? = nil
    var timeZone: String = ""
    var sourceFilter: TDSourceFilter = .all
    var groups: [String: TDEvidenceIDs] = [:]
    var attribute: String? = nil
    var reference: String? = nil
    var scale: String? = nil
    var conditions: [String: String] = [:]
    var sourceRevisions: [String: Int] = [:]
    var overlappingMealIDs: Set<String> = []
    var all: TDEvidenceIDs {
        let primary = roles.values.reduce(TDEvidenceIDs.empty) { $0.union($1) }
        let comparisons = groups.values.reduce(TDEvidenceIDs.empty) { $0.union($1) }
        return primary.union(comparisons)
    }
    mutating func add(_ role: TDEvidenceRole, _ ids: TDEvidenceIDs) {
        roles[role] = (roles[role] ?? .empty).union(ids)
    }
    mutating func merge(_ other: Self) {
        for (role, ids) in other.roles { add(role, ids) }
        sourceRevisions.merge(other.sourceRevisions) { _, latest in latest }
        overlappingMealIDs.formUnion(other.overlappingMealIDs)
        for (key, value) in other.groups { groups[key] = (groups[key] ?? .empty).union(value) }
    }
}

struct TDEvidenceIssue: Equatable, Sendable {
    let id: String
    let entryID: String
    let facet: TDFacet?
    let attribute: String?
    let reference: String?
    let reason: String
    var selection: String = ""
    var senseKey: String? { attribute.map { TDDataEngine.key([$0, reference ?? ""]) } }
    var domain: String? {
        guard let attribute else { return nil }
        if attribute.hasPrefix("taste.") { return "맛" }
        if attribute.hasPrefix("aroma.") { return "향" }
        if attribute.hasPrefix("texture.") || attribute.hasPrefix("mouthfeel.") { return "식감" }
        return "기타"
    }
}

struct TDComparison: Equatable, Sendable {
    var before: Int?
    var after: Int?
    var beforeDenominator: Int? = nil
    var afterDenominator: Int? = nil
    var beforeState: TDCardState = .ready
    var afterState: TDCardState = .ready
    var percentagePointDifference: Double? {
        guard let before, let after, let b = beforeDenominator, let a = afterDenominator, b > 0, a > 0 else { return nil }
        return (Double(after) / Double(a) - Double(before) / Double(b)) * 100
    }
}

extension TDFacet {
    var kind: String {
        switch self {
        case .presence: return "sensory_presence"
        case .intensity: return "sensory_intensity"
        case .liking: return "attribute_liking"
        case .fit: return "preference_fit"
        case .overall: return "overall_liking"
        }
    }
    var scale: String {
        switch self {
        case .presence: return "presence-v1"
        case .intensity: return "expression-strength-v1"
        case .liking: return "attribute-three-category-v1"
        case .fit: return "preference-fit-v1"
        case .overall: return "overall-five-category-v1"
        }
    }
}
