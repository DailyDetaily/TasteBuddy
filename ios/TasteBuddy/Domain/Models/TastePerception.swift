import Foundation

struct TastePerceptionPeriod: Equatable, Sendable {
    let evidenceIDs: [String]
    let experienceIDs: [UUID]
    let mealIDs: [UUID]
    let start: Date?
    let end: Date?
}

struct TastePerceptionPattern: Identifiable, Equatable, Sendable {
    let id: String
    let axis: TasteAxis
    let foodKey: String
    let foodName: String
    let restaurantName: String?
    let target: String
    let phase: String
    /// 0/1/2는 약함/중간/강함 범주의 순서다. 민감도 점수가 아니다.
    let currentLevel: Int?
    let previousLevel: Int?
    let counts: [Int]
    let conflictCount: Int
    let recent: TastePerceptionPeriod
    let previous: TastePerceptionPeriod
    let evidenceIDs: [String]
    let experienceIDs: [UUID]
    let mealIDs: [UUID]
    var hasChange: Bool { currentLevel != nil && previousLevel != nil && currentLevel != previousLevel }
    var conditionLabel: String {
        [restaurantName, foodName, TastePerceptionEngine.targetLabel(target), TastePerceptionEngine.phaseLabel(phase)].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
    }
}

struct TastePerceptionContrast: Identifiable, Equatable, Sendable {
    let first: TastePerceptionPattern
    let second: TastePerceptionPattern
    var id: String { first.id + second.id }
    var evidenceIDs: [String] { Array(Set(first.recent.evidenceIDs + second.recent.evidenceIDs)).sorted() }
    var mealIDs: [UUID] { Array(Set(first.recent.mealIDs + second.recent.mealIDs)).sorted { $0.uuidString < $1.uuidString } }
}

struct TastePerceptionSnapshot: Equatable, Sendable {
    let patterns: [TastePerceptionPattern]
    let contrasts: [TastePerceptionContrast]
    let evidenceCount: Int
    var changes: [TastePerceptionPattern] { patterns.filter(\.hasChange) }
    func current(for axis: TasteAxis) -> TastePerceptionPattern? {
        patterns.filter { $0.axis == axis }.sorted {
            if $0.recent.end != $1.recent.end { return ($0.recent.end ?? .distantPast) > ($1.recent.end ?? .distantPast) }
            return $0.id < $1.id
        }.first
    }
    static let empty = TastePerceptionSnapshot(patterns: [], contrasts: [], evidenceCount: 0)
}

enum TastePerceptionEngine {
    static let version = "taste-perception/1"
    static let minimumMeals = 3
    static let levels = ["weak", "medium", "strong"]
    static let levelLabels = ["약하게", "중간 정도로", "강하게"]
    static func targetLabel(_ value: String) -> String {
        ["whole_dish":"음식 전체", "sauce":"소스", "surface":"겉", "inside":"속", "broth":"국물", "noodles":"면", "meat":"고기", "coating":"튀김옷", "skin":"껍질", "filling":"소", "flesh":"속살", "cream":"크림"][value] ?? "부위 확인 중"
    }
    static func phaseLabel(_ value: String) -> String {
        ["first_bite":"첫입", "early_meal":"식사 초반", "during_meal":"먹는 동안", "late_meal":"식사 후반", "after_swallow":"삼킨 뒤", "after_meal":"식사 후"][value] ?? "시점 확인 중"
    }
    private static func key(_ values: [String]) -> String {
        String(data: try! JSONEncoder().encode(values), encoding: .utf8)!
    }
    private static func foodKey(_ row: SensoryObservation) -> String {
        key([row.restaurantID ?? row.restaurantName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "", row.menuItemID ?? "", row.foodName.trimmingCharacters(in: .whitespacesAndNewlines), key(Array(Set(row.dishKindIDs)).sorted())])
    }
    private static func contextKey(_ row: SensoryObservation) -> String {
        key([row.attribute ?? "", foodKey(row), row.target, row.phase])
    }
    private struct Unit {
        let first: SensoryObservation
        let date: Date
        let level: Int?
        let evidenceIDs: [String]
        let experienceIDs: [UUID]
    }
    private static func period(_ units: [Unit]) -> TastePerceptionPeriod {
        .init(evidenceIDs: Array(Set(units.flatMap(\.evidenceIDs))).sorted(),
              experienceIDs: Array(Set(units.flatMap(\.experienceIDs))).sorted { $0.uuidString < $1.uuidString },
              mealIDs: Array(Set(units.map { $0.first.independentMealID })).sorted { $0.uuidString < $1.uuidString },
              start: units.first?.date, end: units.last?.date)
    }
    private static func median(_ units: [Unit]) -> Int? {
        guard units.count >= minimumMeals, units.allSatisfy({ $0.level != nil }) else { return nil }
        return units.compactMap(\.level).sorted()[units.count / 2]
    }

    /// 호출한 SensoryAnalysisEngine이 완료된 실제 기록과 출처를 검증한다.
    static func build(observations: [SensoryObservation], asOf: Date? = nil) -> TastePerceptionSnapshot {
        let byID = Dictionary(grouping: observations, by: \.id)
        let conflictingIDs = Set(byID.filter { _, rows in rows.contains { $0 != rows[0] } }.keys)
        let absent = Set(observations.filter { row in
            guard row.kind == "sensory_presence", row.value == .flag(false), let observed = row.observedAt, let known = row.knownAt else { return false }
            return asOf.map { observed <= $0 && known <= $0 } ?? true
        }
            .map { key([$0.independentMealID.uuidString, contextKey($0)]) })
        let valid = observations.filter { row in
            guard !conflictingIDs.contains(row.id), row.kind == "sensory_intensity", row.scale == "expression-strength-v1", row.reference == nil,
                  row.attribute?.hasPrefix("taste.") == true,
                  TasteAxis(rawValue: String(row.attribute!.dropFirst(6))) != nil,
                  levels.contains(row.value.text), let observed = row.observedAt, let known = row.knownAt else { return false }
            return asOf.map { observed <= $0 && known <= $0 } ?? true
        }
        let units = Dictionary(grouping: valid) { key([$0.independentMealID.uuidString, contextKey($0)]) }.map { id, rows in
            let first = rows[0], values = Set(rows.map(\.value))
            return Unit(first: first, date: rows.compactMap(\.observedAt).max()!,
                        level: values.count == 1 && !absent.contains(id) ? levels.firstIndex(of: first.value.text) : nil,
                        evidenceIDs: Array(Set(rows.map(\.id))).sorted(),
                        experienceIDs: Array(Set(rows.map(\.experienceID))).sorted { $0.uuidString < $1.uuidString })
        }
        let patterns = Dictionary(grouping: units) { contextKey($0.first) }.map { id, values -> TastePerceptionPattern in
            let rows = values.sorted { $0.date != $1.date ? $0.date < $1.date : $0.first.independentMealID.uuidString < $1.first.independentMealID.uuidString }
            let first = rows[0].first, recent = Array(rows.suffix(minimumMeals))
            let previous = Array(rows.dropLast(min(minimumMeals, rows.count)).suffix(minimumMeals))
            let comparable = !first.foodName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                && [first.restaurantID, first.restaurantName, first.menuItemID].contains { !($0 ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
                && targetLabel(first.target) != "부위 확인 중" && phaseLabel(first.phase) != "시점 확인 중"
            let oldLevel = comparable && previous.count == minimumMeals && previous.last!.date < recent.first!.date ? median(previous) : nil
            let all = period(rows)
            return .init(id: id, axis: TasteAxis(rawValue: String(first.attribute!.dropFirst(6)))!, foodKey: foodKey(first),
                         foodName: first.foodName.trimmingCharacters(in: .whitespacesAndNewlines), restaurantName: first.restaurantName, target: first.target, phase: first.phase,
                         currentLevel: comparable ? median(recent) : nil, previousLevel: oldLevel,
                         counts: levels.indices.map { level in recent.filter { $0.level == level }.count },
                         conflictCount: recent.filter { $0.level == nil }.count, recent: period(recent), previous: period(previous),
                         evidenceIDs: all.evidenceIDs, experienceIDs: all.experienceIDs, mealIDs: all.mealIDs)
        }.sorted { $0.id < $1.id }
        var contrasts: [TastePerceptionContrast] = []
        // ponytail: 조건 쌍의 제곱 비교. 조건 수가 커지면 음식별 인덱스로 나눈다.
        for i in patterns.indices { for j in patterns.indices where j > i {
            let a = patterns[i], b = patterns[j]
            guard a.axis == b.axis, a.foodKey == b.foodKey, a.currentLevel != nil, b.currentLevel != nil,
                  a.currentLevel != b.currentLevel,
                  (a.target != b.target ? 1 : 0) + (a.phase != b.phase ? 1 : 0) == 1,
                  max(a.recent.start!, b.recent.start!) <= min(a.recent.end!, b.recent.end!) else { continue }
            contrasts.append(.init(first: a, second: b))
        } }
        return .init(patterns: patterns, contrasts: contrasts, evidenceCount: Set(units.map { $0.first.independentMealID }).count)
    }
}

struct SurveyPerceptionPoint: Identifiable {
    let axis: TasteAxis
    let item: TasteSurveyItemContract?
    let submission: TasteSurveySubmissionContract?
    let value: Int?
    let previousSubmission: TasteSurveySubmissionContract?
    let previousValue: Int?
    var id: String { axis.rawValue }
    var hasChange: Bool { value != nil && previousValue != nil && value != previousValue }
}

enum SurveyPerception {
    static func points(submissions: [TasteSurveySubmissionContract]) -> [SurveyPerceptionPoint] {
        let history = submissions.filter { $0.schemaVersion == 2 && $0.source == "reference-food-recall" && PersonalTasteModelBuilder.date($0.recordedAt) != nil }
            .sorted { PersonalTasteModelBuilder.date($0.recordedAt)! > PersonalTasteModelBuilder.date($1.recordedAt)! }
        let current = history.first
        return TasteAxis.allCases.map { axis in
            let item = current?.items.first { $0.tasteId == axis }
            let previous = history.dropFirst().first { candidate in
                guard let current, let item, PersonalTasteModelBuilder.date(candidate.recordedAt) != PersonalTasteModelBuilder.date(current.recordedAt) else { return false }
                return candidate.instrument == current.instrument && candidate.scale == current.scale
                    && candidate.recallWindow == current.recallWindow && candidate.items.contains(item)
            }
            func value(_ submission: TasteSurveySubmissionContract?) -> Int? {
                guard let item, let response = submission?.response(for: item.id), !response.uncertain else { return nil }
                return response.selectedValue
            }
            return .init(axis: axis, item: item, submission: current, value: value(current), previousSubmission: previous, previousValue: value(previous))
        }
    }
}

/// 기존 미각변화 화면에 전달하는 동일 조건의 이전·최근 강도. 원래 근거를 재사용한다.
struct TasteChangeSeries: Identifiable {
    struct Point: Identifiable {
        let id: String
        let date: Date
        let start: Date
        let value: Int
        let label: String
        let evidenceIDs: [String]
        let experienceIDs: [UUID]
        let count: Int
    }
    let id: String
    let axis: TasteAxis
    let source: String
    let condition: String
    let maximum: Int
    let points: [Point]
    let details: [String]

    static func build(perception: TastePerceptionSnapshot, survey: [SurveyPerceptionPoint]) -> [Self] {
        let meals = perception.patterns.map { pattern in
            let points = [("이전", pattern.previousLevel, pattern.previous), ("최근", pattern.currentLevel, pattern.recent)].compactMap { name, level, period -> Point? in
                guard let level, let date = period.end, let start = period.start else { return nil }
                return .init(id: name, date: date, start: start, value: level,
                             label: TastePerceptionEngine.levelLabels[level], evidenceIDs: period.evidenceIDs,
                             experienceIDs: period.experienceIDs, count: period.mealIDs.count)
            }
            return Self(id: pattern.id, axis: pattern.axis, source: "식사 기록", condition: pattern.conditionLabel,
                        maximum: 2, points: points,
                        details: ["같은 음식·부위·시점의 이전 3번과 최근 3번 식사를 비교해요.", "기록하지 않은 조리 상태·온도나 변화의 원인은 알 수 없어요."])
        }
        let recalled = survey.compactMap { point -> Self? in
            guard let item = point.item else { return nil }
            let points = [("이전", point.previousValue, point.previousSubmission), ("최근", point.value, point.submission)].compactMap { name, value, submission -> Point? in
                guard let value, let submission, let date = PersonalTasteModelBuilder.date(submission.recordedAt) else { return nil }
                return .init(id: name, date: date, start: date, value: value, label: submission.responseLabel(for: item.id),
                             evidenceIDs: [], experienceIDs: [], count: 1)
            }
            return Self(id: "survey:" + point.id, axis: point.axis, source: "기준 음식 회상", condition: item.anchor.label,
                        maximum: 4, points: points, details: [item.prompt] + item.anchor.conditions + ["회상 응답은 실제 식사 횟수에 포함하지 않아요."])
        }
        return (meals + recalled).filter { !$0.points.isEmpty }
    }

    static func changeLabel(_ points: [Point]) -> String {
        guard let previous = points.first(where: { $0.id == "이전" }), let recent = points.first(where: { $0.id == "최근" }) else { return "비교 부족" }
        return recent.value == previous.value ? "같은 강도" : recent.value > previous.value ? "더 강하게" : "더 약하게"
    }
}
