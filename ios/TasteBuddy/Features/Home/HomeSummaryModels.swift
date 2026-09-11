import Foundation

/// 홈 카드의 표시 자료. 원본 기록과 TBA 근거 ID를 함께 보존한다.
struct HomeArchiveCard: Identifiable, Equatable {
    enum Kind: String, CaseIterable {
        case record = "기록", repeated = "반복", experience = "경험"
        case liking = "호감", sensation = "감각", fit = "알맞음"
        case condition = "조건", difference = "차이", change = "변화"
    }

    let kind: Kind
    let value: String
    let detail: String
    let explanation: String
    let entryIDs: Set<UUID>
    let evidenceIDs: Set<String>
    var id: String { kind.rawValue }
    var isEmpty: Bool { entryIDs.isEmpty }

    static func empty(_ kind: Kind) -> Self {
        let value: String
        let detail: String
        switch kind {
        case .record: (value, detail) = ("기록 없음", "첫 기록을 남겨요")
        case .repeated: (value, detail) = ("반복 없음", "메뉴·식당 기록")
        case .experience: (value, detail) = ("경험 없음", "메뉴 기록을 남겨요")
        case .liking: (value, detail) = ("호감 기록 없음", "음식 전체 평가")
        case .sensation: (value, detail) = ("감각 기록 없음", "감각별 평가")
        case .fit: (value, detail) = ("응답 없음", "알맞음 응답")
        case .condition: (value, detail) = ("데이터 대기 중", "조건별 평가")
        case .difference: (value, detail) = ("데이터 대기 중", "전체·감각 비교")
        case .change: (value, detail) = ("데이터 대기 중", "기간별 기록 비교")
        }
        return .init(kind: kind, value: value, detail: detail, explanation: "", entryIDs: [], evidenceIDs: [])
    }
}

/// 관련 식사에서 확인된 미각의 구성. 강도·호감 점수가 아니며 식사/축마다 한 번 센다.
struct HomeInsightTasteDistribution: Equatable {
    let counts: [Int] // TasteAxis.allCases 순서
    var total: Int { counts.reduce(0, +) }
    static let empty = Self(counts: Array(repeating: 0, count: 6))

    static func make(card: HomeArchiveCard, entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot,
                     referenceDate: Date = .now) -> Self {
        let eligible = entries.filter {
            card.entryIDs.contains($0.id) && $0.hasCompletedTasteFeedback && $0.observedAt <= referenceDate
        }
        let meals = Dictionary(eligible.map { ($0.id, $0.mealID) }, uniquingKeysWith: { first, _ in first })
        let excluded = Set(snapshot.personalModel?.excludedEvidence.map(\.id) ?? [])
        let attributes = ["taste.sweet", "taste.sour", "taste.bitter", "taste.salty", "taste.umami", "mouthfeel.fatty"]
        var axisMeals = Array(repeating: Set<UUID>(), count: attributes.count)
        for observation in snapshot.observations {
            guard let meal = meals[observation.experienceID], !excluded.contains(observation.id),
                  observation.kind == "sensory_presence", observation.value == .flag(true),
                  let attribute = observation.attribute, let axis = attributes.firstIndex(of: attribute) else { continue }
            axisMeals[axis].insert(meal)
        }
        return Self(counts: axisMeals.map(\.count))
    }

    /// 최대 나머지 방식으로 126개 점에 배분한다. 관찰이 없는 축에는 점을 만들지 않는다.
    var dotColorIndices: [Int] {
        guard total > 0 else { return Array(repeating: 0, count: 126) }
        let quotas = counts.map { Double($0) / Double(total) * 126 }
        var allocated = quotas.map { Int($0.rounded(.down)) }
        let order = counts.indices.sorted {
            let left = quotas[$0] - Double(allocated[$0]), right = quotas[$1] - Double(allocated[$1])
            return left == right ? $0 < $1 : left > right
        }
        for axis in order.prefix(126 - allocated.reduce(0, +)) { allocated[axis] += 1 }
        let sortedColors = allocated.enumerated().flatMap { Array(repeating: $0.offset, count: $0.element) }
        // 눌렀을 때의 각도 순서에 맞춰 색을 배정하여 비율대로 모이게 한다.
        return (0..<126).map { sortedColors[($0 % 6) * 21 + $0 / 6] }
    }

    var accessibilitySummary: String {
        guard total > 0 else { return "확인된 미각 근거 없음" }
        let values = TasteAxis.allCases.indices.filter { counts[$0] > 0 }.map {
            "\(TasteAxis.allCases[$0].label) \(counts[$0])회"
        }.joined(separator: ", ")
        return "관련 식사의 미각 관찰 구성, \(values). 같은 식사의 같은 미각은 한 번씩 집계"
    }
}

enum HomeArchiveSummaryEngine {
    static func cards(
        entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot,
        referenceDate: Date = .now, calendar: Calendar = .current
    ) -> [HomeArchiveCard] {
        var seen = Set<UUID>()
        let entries = entries.filter { $0.observedAt <= referenceDate && seen.insert($0.id).inserted }
            .sorted { $0.observedAt == $1.observedAt ? $0.id.uuidString < $1.id.uuidString : $0.observedAt > $1.observedAt }
        let completedIDs = Set(entries.filter(\.hasCompletedTasteFeedback).map(\.id))
        let excludedIDs = Set(snapshot.personalModel?.excludedEvidence.map(\.id) ?? [])
        let observations = snapshot.observations.filter { completedIDs.contains($0.experienceID) && !excludedIDs.contains($0.id) }
        let evidenceByID = Dictionary(observations.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })

        func card(
            _ kind: HomeArchiveCard.Kind, _ value: String, _ detail: String,
            records: [DiningEntry] = [], evidence: [SensoryObservation] = [], explanation: String = ""
        ) -> HomeArchiveCard {
            .init(kind: kind, value: value, detail: detail, explanation: explanation,
                  entryIDs: Set(records.map(\.id)).union(evidence.map(\.experienceID)),
                  evidenceIDs: Set(evidence.map(\.id)))
        }

        // 전체 아카이브는 미완료 기록도 포함한다. 취향 해석은 완료된 직접 관찰만 사용한다.
        var cards = [card(.record, "\(entries.count)개 기록", "\(Set(entries.map(\.mealID)).count)번의 식사", records: entries)]
        let menus = Dictionary(grouping: entries.filter { !normalized($0.menu).isEmpty }, by: menuKey)
        let restaurants = Dictionary(grouping: entries.filter { !normalized($0.restaurant).isEmpty }, by: restaurantKey)
        let repeats = menus.map { (key: "menu:" + $0.key, name: $0.value[0].menu, entries: $0.value) }
            + restaurants.map { (key: "restaurant:" + $0.key, name: $0.value[0].restaurant, entries: $0.value) }
        if let repeated = repeats.filter({ Set($0.entries.map(\.mealID)).count > 1 }).sorted(by: {
            let left = Set($0.entries.map(\.mealID)).count, right = Set($1.entries.map(\.mealID)).count
            return left == right ? $0.key < $1.key : left > right
        }).first {
            cards.append(card(.repeated, repeated.name, "\(Set(repeated.entries.map(\.mealID)).count)회 기록",
                              records: repeated.entries, explanation: "전체 기록에서 다시 등장했어요."))
        }
        if !menus.isEmpty {
            cards.append(card(.experience, "\(menus.count)개 메뉴", "\(restaurants.count)곳의 식당", records: entries))
        }

        let overalls = Dictionary(grouping: observations.filter {
            $0.kind == "overall_liking" && $0.scale == "overall-five-category-v1"
        }, by: \.experienceID)
        if let liked = entries.first(where: { entry in
            guard let ratings = overalls[entry.id], !ratings.isEmpty else { return false }
            return ratings.allSatisfy { ["positive", "very_positive"].contains($0.value.text) }
        }) {
            cards.append(card(.liking, liked.menu, "전체 평가 · 호감", evidence: overalls[liked.id] ?? [],
                              explanation: "좋았다고 남긴 가장 최근 음식이에요."))
        }

        if let model = snapshot.personalModel {
            // 기존 모델의 판단을 표시한다. 화면에서 호감 방향이나 알맞음을 새로 추론하지 않는다.
            let candidates = model.candidates.filter { !$0.evidenceIDs.isEmpty && $0.evidenceIDs.allSatisfy { evidenceByID[$0] != nil } }
                .sorted {
                    if ($0.direction != nil) != ($1.direction != nil) { return $0.direction != nil }
                    return $0.distribution.mealCount == $1.distribution.mealCount
                        ? $0.id < $1.id : $0.distribution.mealCount > $1.distribution.mealCount
                }
            if let candidate = candidates.first(where: { $0.conditions.isEmpty }) {
                let assessment = candidate.direction.map(likingLabel)
                    ?? (candidate.status == "mixed" ? "평가가 나뉘어요" : "첫 단서")
                cards.append(card(.sensation, candidate.label, assessment,
                                  evidence: candidate.evidenceIDs.compactMap { evidenceByID[$0] },
                                  explanation: "\(candidate.distribution.mealCount)번의 식사\n\(candidate.body)"))
            }
            let fits = model.fitPatterns.filter {
                $0.conditions.isEmpty && !$0.evidenceIDs.isEmpty && $0.evidenceIDs.allSatisfy { evidenceByID[$0] != nil }
            }.sorted {
                if ($0.repeatedValue != nil) != ($1.repeatedValue != nil) { return $0.repeatedValue != nil }
                return $0.mealIDs.count == $1.mealIDs.count ? $0.id < $1.id : $0.mealIDs.count > $1.mealIDs.count
            }
            if let fit = fits.first {
                cards.append(card(.fit, fit.label, fit.repeatedValue.map(PersonalTasteInsightPresentation.fitLabel)
                                  ?? (fit.status == "mixed_fit" ? "응답이 나뉘어요" : "첫 단서"),
                                  evidence: fit.evidenceIDs.compactMap { evidenceByID[$0] },
                                  explanation: PersonalTasteInsightPresentation.fitSummary(fit)))
            }
            if let candidate = candidates.first(where: { !$0.conditions.isEmpty && $0.direction != nil }),
               let direction = candidate.direction,
               let assessment = ["positive": "호감", "neutral": "중립", "negative": "아쉬움"][direction] {
                let conditions = PersonalTasteInsightPresentation.conditionText(candidate.conditions)
                cards.append(card(.condition, "\(candidate.label) · \(assessment)", conditions,
                                  evidence: candidate.evidenceIDs.compactMap { evidenceByID[$0] },
                                  explanation: "\(conditions) · \(likingLabel(direction))\n\(candidate.body)"))
            }
            let differences = model.overallPatterns.filter { $0.conditions.isEmpty }.flatMap { pattern in
                pattern.cells.filter { cell in
                    let positiveOverall = ["positive", "very_positive"].contains(cell.overallValue)
                    let negativeOverall = ["negative", "very_negative"].contains(cell.overallValue)
                    return ((positiveOverall && cell.attributeValue == "negative") || (negativeOverall && cell.attributeValue == "positive"))
                        && !cell.evidenceIDs.isEmpty && cell.evidenceIDs.allSatisfy { evidenceByID[$0] != nil }
                }.map { (pattern: pattern, cell: $0) }
            }.sorted {
                if $0.cell.mealIDs.count != $1.cell.mealIDs.count { return $0.cell.mealIDs.count > $1.cell.mealIDs.count }
                return $0.pattern.id + $0.cell.overallValue < $1.pattern.id + $1.cell.overallValue
            }
            if let difference = differences.first {
                let overall = PersonalTasteInsightPresentation.overallLabel(difference.cell.overallValue)
                let attribute = likingLabel(difference.cell.attributeValue)
                let overallMood = ["positive", "very_positive"].contains(difference.cell.overallValue) ? "호감" : "아쉬움"
                let attributeMood = difference.cell.attributeValue == "positive" ? "호감" : "아쉬움"
                cards.append(card(.difference, "음식 · \(overallMood)", "\(difference.pattern.label) · \(attributeMood)",
                                  evidence: difference.cell.evidenceIDs.compactMap { evidenceByID[$0] },
                                  explanation: "음식 전체 · \(overall)\n\(difference.pattern.label) · \(attribute)\n\(difference.cell.mealIDs.count)번의 식사에서 함께 남겼어요."))
            }
        }

        // 취향 변화가 아닌, 현재 보존된 감각 기록의 기간별 비중만 비교한다.
        let day = calendar.startOfDay(for: referenceDate)
        if let recentStart = calendar.date(byAdding: .day, value: -89, to: day),
           let previousStart = calendar.date(byAdding: .day, value: -179, to: day) {
            let presence = observations.filter {
                $0.kind == "sensory_presence" && $0.value == .flag(true) && $0.attribute != nil
                    && $0.attribute?.hasSuffix(".unspecified") != true && $0.recordedAt >= previousStart
            }
            let recent = presence.filter { $0.recordedAt >= recentStart }
            let previous = presence.filter { $0.recordedAt < recentStart }
            let recentCount = Set(recent.map(\.independentMealID)).count
            let previousCount = Set(previous.map(\.independentMealID)).count
            let minimum = snapshot.personalModel?.policy.minMeals ?? 3
            if recentCount >= minimum && previousCount >= minimum {
                let changes = Dictionary(grouping: presence) { [$0.attribute ?? "", $0.reference ?? ""].joined(separator: "|") }
                    .map { key, rows in
                        let before = Set(rows.filter { $0.recordedAt < recentStart }.map(\.independentMealID)).count
                        let after = Set(rows.filter { $0.recordedAt >= recentStart }.map(\.independentMealID)).count
                        let from = Int((Double(before) / Double(previousCount) * 100).rounded())
                        let to = Int((Double(after) / Double(recentCount) * 100).rounded())
                        return (key: key, rows: rows, before: before, after: after, from: from, to: to)
                    }.filter { $0.from != $0.to }.sorted {
                        let left = abs($0.to - $0.from), right = abs($1.to - $1.from)
                        return left == right ? $0.key < $1.key : left > right
                    }
                if let change = changes.first {
                    let periodEntryIDs = Set(presence.map(\.experienceID))
                    cards.append(card(.change, change.rows[0].attributeLabel, "기록 \(change.from)% → \(change.to)%",
                                      records: entries.filter { periodEntryIDs.contains($0.id) }, evidence: change.rows,
                                      explanation: "직전 90일 · \(change.before)/\(previousCount)번의 식사\n최근 90일 · \(change.after)/\(recentCount)번의 식사\n현재 남아 있는 감각 기록의 비중이에요."))
                }
            }
        }
        return HomeArchiveCard.Kind.allCases.map { kind in
            cards.first { $0.kind == kind && !$0.isEmpty } ?? .empty(kind)
        }
    }

    private static func likingLabel(_ value: String) -> String {
        PersonalTasteInsightPresentation.likingLabel(value)
    }

    private static func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines).folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))
    }

    private static func menuKey(_ entry: DiningEntry) -> String {
        entry.menuItemID.map { "id:" + $0 } ?? "name:" + normalized(entry.menu)
    }

    private static func restaurantKey(_ entry: DiningEntry) -> String {
        entry.restaurantID.map { "id:" + $0 } ?? "name:" + normalized(entry.restaurant)
    }
}

/// The small set of summary cards that can be rendered on the home screen.
enum HomeSummaryMetricKind: String, CaseIterable, Equatable, Identifiable {
    case record
    case frequentMenu
    case regularRestaurant
    case tasteDiscovery
    case breadth
    case tasteChange

    var id: String { rawValue }

    var title: String {
        switch self {
        case .record:
            "기록"
        case .frequentMenu:
            "최다 기록 메뉴"
        case .regularRestaurant:
            "최다 방문 식당"
        case .tasteDiscovery:
            "최다 미각 단서"
        case .breadth:
            "경험의 폭"
        case .tasteChange:
            "입맛 변화"
        }
    }
}

/// A metric can be absent without the home screen having to invent a value.
/// `insufficient` is used for the current taste-change card because a
/// `DiningEntry` does not yet contain enough repeated response data to infer a
/// change over time.
enum HomeSummaryMetricState: String, Equatable {
    case populated
    case empty
    case building
    case insufficient

    var isEmpty: Bool { self == .empty }

    var isBuilding: Bool {
        self == .building || self == .insufficient
    }
}

struct HomeSummaryMetric: Identifiable, Equatable {
    typealias Kind = HomeSummaryMetricKind
    typealias State = HomeSummaryMetricState

    let id: String
    let kind: HomeSummaryMetricKind
    let title: String
    let value: String
    let detail: String
    let state: HomeSummaryMetricState

    init(
        kind: HomeSummaryMetricKind,
        value: String,
        detail: String,
        state: HomeSummaryMetricState
    ) {
        self.id = kind.rawValue
        self.kind = kind
        self.title = kind.title
        self.value = value
        self.detail = detail
        self.state = state
    }

    /// A label alias keeps the metric convenient for existing card primitives.
    var label: String { title }

    /// A subtitle alias keeps the model easy to pass to compact summary cards.
    var subtitle: String { detail }
}

enum HomeSummaryEngine {
    private struct RankedValue {
        let key: String
        var label: String
        var count: Int
        var latestDate: Date
    }

    private struct TasteSelection {
        let label: String
        let count: Int
    }

    /// Returns the home cards in their stable product order.
    ///
    /// The engine intentionally does not inspect `DiningEntry.rating`. That
    /// value is derived from the selected taste intensity, so it cannot safely
    /// stand in for a favourite, a like, or a repeat preference.
    static func metrics(for entries: [DiningEntry]) -> [HomeSummaryMetric] {
        let record = recordMetric(entries: entries)
        let frequentMenu = frequentMenuMetric(entries: entries)
        let regularRestaurant = regularRestaurantMetric(entries: entries)
        let tasteDiscovery = tasteDiscoveryMetric(entries: entries)
        let breadth = breadthMetric(entries: entries)
        let tasteChange = tasteChangeMetric(entries: entries)

        return [
            record,
            frequentMenu,
            regularRestaurant,
            tasteDiscovery,
            breadth,
            tasteChange,
        ]
    }

    private static func recordMetric(entries: [DiningEntry]) -> HomeSummaryMetric {
        let restaurantCount = uniqueCount(entries.map(\.restaurant))
        let menuCount = uniqueCount(entries.map(\.menu))
        let state: HomeSummaryMetricState = entries.isEmpty ? .empty : .populated

        return HomeSummaryMetric(
            kind: .record,
            value: "\(entries.count)",
            detail: "식당 \(restaurantCount)곳 · 메뉴 \(menuCount)개",
            state: state
        )
    }

    private static func frequentMenuMetric(entries: [DiningEntry]) -> HomeSummaryMetric {
        guard let selected = rankedValue(in: entries, value: \.menu) else {
            return HomeSummaryMetric(
                kind: .frequentMenu,
                value: "아직 기록 없음",
                detail: "메뉴 기록이 쌓이면 가장 많이 기록한 메뉴를 보여드려요.",
                state: .empty
            )
        }

        if selected.count == 1 {
            return HomeSummaryMetric(
                kind: .frequentMenu,
                value: selected.label,
                detail: "처음 기록한 메뉴",
                state: .populated
            )
        }

        return HomeSummaryMetric(
            kind: .frequentMenu,
            value: selected.label,
            detail: "\(selected.count)회 기록",
            state: .populated
        )
    }

    private static func regularRestaurantMetric(entries: [DiningEntry]) -> HomeSummaryMetric {
        guard let selected = rankedValue(in: entries, value: \.restaurant) else {
            return HomeSummaryMetric(
                kind: .regularRestaurant,
                value: "아직 기록 없음",
                detail: "식당 기록이 쌓이면 가장 많이 방문한 곳을 보여드려요.",
                state: .empty
            )
        }

        if selected.count == 1 {
            return HomeSummaryMetric(
                kind: .regularRestaurant,
                value: selected.label,
                detail: "처음 기록한 식당",
                state: .populated
            )
        }

        return HomeSummaryMetric(
            kind: .regularRestaurant,
            value: selected.label,
            detail: "\(selected.count)회 기록",
            state: .populated
        )
    }

    private static func tasteDiscoveryMetric(entries: [DiningEntry]) -> HomeSummaryMetric {
        guard let selected = tasteSelection(in: entries) else {
            return HomeSummaryMetric(
                kind: .tasteDiscovery,
                value: "아직 기록 없음",
                detail: "미각 단서가 쌓이면 가장 많이 기록한 단서를 보여드려요.",
                state: .empty
            )
        }

        return HomeSummaryMetric(
            kind: .tasteDiscovery,
            value: selected.label,
            detail: "\(selected.count)회 등장",
            state: .populated
        )
    }

    private static func breadthMetric(entries: [DiningEntry]) -> HomeSummaryMetric {
        let menuCount = uniqueCount(entries.map(\.menu))
        let restaurantCount = uniqueCount(entries.map(\.restaurant))
        let dishKindCount = uniqueCount(entries.flatMap(\.dishKindIDs))
        let state: HomeSummaryMetricState = entries.isEmpty ? .empty : .populated

        return HomeSummaryMetric(
            kind: .breadth,
            value: "\(menuCount)개 메뉴",
            detail: "식당 \(restaurantCount)곳 · 음식 종류 \(dishKindCount)개",
            state: state
        )
    }

    private static func tasteChangeMetric(entries: [DiningEntry]) -> HomeSummaryMetric {
        let detail = entries.isEmpty
            ? "아직 기록이 없어 변화 추이를 만들고 있어요."
            : "충분한 반복 반응 데이터가 쌓이면 변화 추이를 보여드려요."

        return HomeSummaryMetric(
            kind: .tasteChange,
            value: "분석을 쌓는 중",
            detail: detail,
            state: .insufficient
        )
    }

    private static func uniqueCount(_ values: [String]) -> Int {
        Set(values.map(identityKey).filter { !$0.isEmpty }).count
    }

    private static func rankedValue(
        in entries: [DiningEntry],
        value: (DiningEntry) -> String
    ) -> RankedValue? {
        var values: [String: RankedValue] = [:]

        for entry in entries {
            let label = normalized(value(entry))
            let key = identityKey(label)
            guard !key.isEmpty else { continue }

            if var aggregate = values[key] {
                aggregate.count += 1
                if isNewer(
                    date: entry.date,
                    label: label,
                    than: aggregate
                ) {
                    aggregate.label = label
                    aggregate.latestDate = entry.date
                }
                values[key] = aggregate
            } else {
                values[key] = RankedValue(
                    key: key,
                    label: label,
                    count: 1,
                    latestDate: entry.date
                )
            }
        }

        return values.values.sorted(by: isHigherPriority).first
    }

    private static func tasteSelection(in entries: [DiningEntry]) -> TasteSelection? {
        var values: [String: RankedValue] = [:]

        for entry in entries {
            for rawID in entry.tasteExperienceIDs {
                let id = normalized(rawID)
                let key = identityKey(id)
                guard !key.isEmpty else { continue }

                if var aggregate = values[key] {
                    aggregate.count += 1
                    if isNewer(
                        date: entry.date,
                        label: id,
                        than: aggregate
                    ) {
                        aggregate.label = id
                        aggregate.latestDate = entry.date
                    }
                    values[key] = aggregate
                } else {
                    values[key] = RankedValue(
                        key: key,
                        label: id,
                        count: 1,
                        latestDate: entry.date
                    )
                }
            }
        }

        // An ID without a catalog entry is not a user-facing label. Ignore it
        // rather than exposing an internal identifier as if it were an insight.
        return values.values
            .filter { TasteExperienceCatalog.experienceByID[$0.label] != nil }
            .sorted(by: isHigherPriority)
            .first
            .flatMap { aggregate in
                guard let experience = TasteExperienceCatalog.experienceByID[aggregate.label]
                else { return nil }

                return TasteSelection(
                    label: experience.label,
                    count: aggregate.count
                )
            }
    }

    private static func isNewer(
        date: Date,
        label: String,
        than aggregate: RankedValue
    ) -> Bool {
        if date != aggregate.latestDate {
            return date > aggregate.latestDate
        }

        return stableStringLess(label, aggregate.label)
    }

    private static func isHigherPriority(_ lhs: RankedValue, _ rhs: RankedValue) -> Bool {
        if lhs.count != rhs.count {
            return lhs.count > rhs.count
        }

        if lhs.latestDate != rhs.latestDate {
            return lhs.latestDate > rhs.latestDate
        }

        if lhs.key != rhs.key {
            return stableStringLess(lhs.key, rhs.key)
        }

        return stableStringLess(lhs.label, rhs.label)
    }

    private static func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func identityKey(_ value: String) -> String {
        normalized(value)
            .folding(
                options: [.caseInsensitive, .diacriticInsensitive],
                locale: Locale(identifier: "en_US_POSIX")
            )
            .lowercased()
    }

    private static func stableStringLess(_ lhs: String, _ rhs: String) -> Bool {
        let left = lhs.folding(
            options: [.caseInsensitive, .diacriticInsensitive],
            locale: Locale(identifier: "en_US_POSIX")
        )
        let right = rhs.folding(
            options: [.caseInsensitive, .diacriticInsensitive],
            locale: Locale(identifier: "en_US_POSIX")
        )

        if left != right {
            return left < right
        }

        return lhs < rhs
    }
}

// MARK: - Period insights

/// The rolling time windows shown in the home journal insight area.
enum HomeInsightPeriod: String, CaseIterable, Identifiable, Equatable {
    case lastSevenDays
    case lastThirtyDays
    case lastTwelveMonths

    var id: String { rawValue }

    var title: String {
        switch self {
        case .lastSevenDays: "지난 7일"
        case .lastThirtyDays: "지난 30일"
        case .lastTwelveMonths: "지난 12개월"
        }
    }
}

enum HomePeriodInsightKind: String, Identifiable, Equatable {
    case recordFlow
    case newExperiences
    case repeatPatterns
    case tasteClue
    case experienceBreadth
    case tasteChange

    var id: String { rawValue }

    var label: String {
        switch self {
        case .recordFlow: "기록 흐름"
        case .newExperiences: "새로운 경험"
        case .repeatPatterns: "반복 기록"
        case .tasteClue: "미각 단서"
        case .experienceBreadth: "경험의 폭"
        case .tasteChange: "미각 기록 변화"
        }
    }
}

struct HomeInsightStat: Identifiable, Equatable {
    let label: String
    let value: String

    var id: String { label }
}

struct HomePeriodInsightCardData: Identifiable, Equatable {
    let kind: HomePeriodInsightKind
    let title: String
    let detail: String
    let supportingText: String?
    let stats: [HomeInsightStat]
    let chartValues: [Double]
    let accentAxis: TasteAxis?
    let state: HomeSummaryMetricState

    var id: String { kind.rawValue }
}

struct HomePeriodInsightSectionData: Identifiable, Equatable {
    let period: HomeInsightPeriod
    let cards: [HomePeriodInsightCardData]

    var id: String { period.rawValue }
}

/// Evidence-based rolling summaries for the home screen. This engine only
/// reads journal entries; it intentionally never uses the derived rating.
enum HomePeriodInsightEngine {
    private struct RankedValue {
        let key: String
        let label: String
        let count: Int
    }

    private struct TasteRank {
        let experience: TasteExperience
        let count: Int
    }

    private struct TasteChangeCandidate {
        let experience: TasteExperience
        let recentCount: Int
        let previousCount: Int
        let absoluteDelta: Double
    }

    static func sections(
        for entries: [DiningEntry],
        referenceDate: Date = .now,
        calendar: Calendar = .current
    ) -> [HomePeriodInsightSectionData] {
        let referenceDay = calendar.startOfDay(for: referenceDate)
        let datedEntries = entries.filter { calendar.startOfDay(for: $0.date) <= referenceDay }
        let lastSevenDays = Self.entries(inLastDays: 7, from: datedEntries, referenceDay: referenceDay, calendar: calendar)
        let lastThirtyDays = Self.entries(inLastDays: 30, from: datedEntries, referenceDay: referenceDay, calendar: calendar)
        let lastTwelveMonths = entriesInLastTwelveMonths(from: datedEntries, referenceDay: referenceDay, calendar: calendar)

        return [
            HomePeriodInsightSectionData(
                period: .lastSevenDays,
                cards: [
                    recordFlowCard(entries: lastSevenDays, referenceDay: referenceDay, calendar: calendar),
                    newExperiencesCard(entries: lastSevenDays, allEntries: datedEntries, referenceDay: referenceDay, calendar: calendar),
                ]
            ),
            HomePeriodInsightSectionData(
                period: .lastThirtyDays,
                cards: [
                    repeatPatternsCard(entries: lastThirtyDays),
                    tasteClueCard(entries: lastThirtyDays),
                ]
            ),
            HomePeriodInsightSectionData(
                period: .lastTwelveMonths,
                cards: [
                    experienceBreadthCard(entries: lastTwelveMonths, referenceDay: referenceDay, calendar: calendar),
                    tasteChangeCard(entries: datedEntries, lastTwelveMonths: lastTwelveMonths, referenceDay: referenceDay, calendar: calendar),
                ]
            ),
        ]
    }

    private static func recordFlowCard(
        entries: [DiningEntry],
        referenceDay: Date,
        calendar: Calendar
    ) -> HomePeriodInsightCardData {
        let restaurants = rankedValues(entries: entries, value: \.restaurant)
        let menus = rankedValues(entries: entries, value: \.menu)
        let detail = compactLines([
            namedSummary(restaurants, unit: "곳"),
            namedSummary(menus, unit: "개"),
        ], fallback: "기록 없음")

        return card(
            .recordFlow,
            title: "\(entries.count)번 기록",
            detail: detail,
            stats: [
                HomeInsightStat(label: "식당", value: "\(uniqueCount(entries.map(\.restaurant)))곳"),
                HomeInsightStat(label: "메뉴", value: "\(uniqueCount(entries.map(\.menu)))개"),
            ],
            chartValues: dailyCounts(entries: entries, referenceDay: referenceDay, calendar: calendar),
            state: entries.isEmpty ? .empty : .populated
        )
    }

    private static func newExperiencesCard(
        entries: [DiningEntry],
        allEntries: [DiningEntry],
        referenceDay: Date,
        calendar: Calendar
    ) -> HomePeriodInsightCardData {
        let currentStart = calendar.date(byAdding: .day, value: -6, to: referenceDay)!
        let earlier = allEntries.filter { calendar.startOfDay(for: $0.date) < currentStart }
        let priorMenus = Set(earlier.map(\.menu).map(identityKey).filter { !$0.isEmpty })
        let priorRestaurants = Set(earlier.map(\.restaurant).map(identityKey).filter { !$0.isEmpty })
        let newMenuRanks = rankedValues(
            entries: entries.filter {
                let key = identityKey($0.menu)
                return !key.isEmpty && !priorMenus.contains(key)
            },
            value: \.menu
        )
        let newRestaurantRanks = rankedValues(
            entries: entries.filter {
                let key = identityKey($0.restaurant)
                return !key.isEmpty && !priorRestaurants.contains(key)
            },
            value: \.restaurant
        )
        let newMenus = newMenuRanks.count
        let newRestaurants = newRestaurantRanks.count
        let detail = compactLines([
            namedSummary(newMenuRanks, unit: "개").map { "새 메뉴 · \($0)" },
            namedSummary(newRestaurantRanks, unit: "곳").map { "새 식당 · \($0)" },
        ], fallback: entries.isEmpty ? "기록 없음" : "새로운 메뉴·식당 없음")

        return card(
            .newExperiences,
            title: entries.isEmpty ? "새로운 경험 대기" : "새로운 경험 \(newMenus + newRestaurants)개",
            detail: detail,
            stats: [
                HomeInsightStat(label: "새 메뉴", value: "\(newMenus)개"),
                HomeInsightStat(label: "새 식당", value: "\(newRestaurants)곳"),
            ],
            state: entries.isEmpty ? .empty : .populated
        )
    }

    private static func repeatPatternsCard(entries: [DiningEntry]) -> HomePeriodInsightCardData {
        guard !entries.isEmpty else {
            return card(
                .repeatPatterns,
                title: "반복 기록 대기",
                detail: "기록 없음",
                state: .empty
            )
        }

        let menus = rankedValues(entries: entries, value: \.menu)
        let restaurants = rankedValues(entries: entries, value: \.restaurant)
        let topMenus = topRanks(in: menus)
        let topRestaurants = topRanks(in: restaurants)
        let menuRepeated = (topMenus.first?.count ?? 0) >= 2
        let restaurantRepeated = (topRestaurants.first?.count ?? 0) >= 2

        if menuRepeated || restaurantRepeated {
            let lines = [
                menuRepeated ? repeatedSummary(topMenus, unit: "개") : nil,
                restaurantRepeated ? repeatedSummary(topRestaurants, unit: "곳") : nil,
            ].compactMap { $0 }
            return card(
                .repeatPatterns,
                title: "반복된 선택",
                detail: compactLines(lines.map(Optional.some), fallback: "반복 없음"),
                stats: [
                    HomeInsightStat(label: "메뉴", value: menuRepeated ? "\(topMenus[0].count)회" : "반복 없음"),
                    HomeInsightStat(label: "식당", value: restaurantRepeated ? "\(topRestaurants[0].count)회" : "반복 없음"),
                ],
                state: .populated
            )
        }

        return card(
            .repeatPatterns,
            title: "새로운 선택 \(menus.count + restaurants.count)개",
            detail: compactLines([
                namedSummary(menus, unit: "개"),
                namedSummary(restaurants, unit: "곳"),
            ], fallback: "기록 없음"),
            stats: [
                HomeInsightStat(label: "메뉴", value: "\(menus.count)개"),
                HomeInsightStat(label: "식당", value: "\(restaurants.count)곳"),
            ],
            state: .populated
        )
    }

    private static func tasteClueCard(entries: [DiningEntry]) -> HomePeriodInsightCardData {
        let ranks = tasteRanks(in: entries)
        guard let first = ranks.first else {
            return card(
                .tasteClue,
                title: "미각 단서 대기",
                detail: entries.isEmpty ? "기록 없음" : "미각 단서 없음",
                state: entries.isEmpty ? .empty : .building
            )
        }
        let leaders = ranks.filter { $0.count == first.count }
        let title = summarizedLabels(leaders.map { $0.experience.label })
        let percentage = percent(first.count, of: entries.count)
        return card(
            .tasteClue,
            title: leaders.count == 1 ? title : "\(title) 공동 기록",
            detail: "\(first.count)회 등장\n기록 비중 \(percentage)%",
            stats: [
                HomeInsightStat(label: "등장", value: "\(first.count)회"),
                HomeInsightStat(label: "전체 기록", value: "\(percentage)%"),
            ],
            accentAxis: first.experience.axis,
            state: .populated
        )
    }

    private static func experienceBreadthCard(
        entries: [DiningEntry],
        referenceDay: Date,
        calendar: Calendar
    ) -> HomePeriodInsightCardData {
        let menuCount = uniqueCount(entries.map(\.menu))
        let restaurantCount = uniqueCount(entries.map(\.restaurant))
        let dishKindCount = uniqueCount(entries.flatMap(\.dishKindIDs))
        return card(
            .experienceBreadth,
            title: entries.isEmpty ? "경험의 폭 대기" : "메뉴 \(menuCount)개",
            detail: entries.isEmpty ? "기록 없음" : "레스토랑 \(restaurantCount)곳\n음식 종류 \(dishKindCount)개",
            stats: [
                HomeInsightStat(label: "메뉴", value: "\(menuCount)개"),
                HomeInsightStat(label: "식당", value: "\(restaurantCount)곳"),
                HomeInsightStat(label: "음식 종류", value: "\(dishKindCount)개"),
            ],
            chartValues: monthlyCounts(entries: entries, referenceDay: referenceDay, calendar: calendar),
            state: entries.isEmpty ? .empty : .populated
        )
    }

    private static func tasteChangeCard(
        entries: [DiningEntry],
        lastTwelveMonths: [DiningEntry],
        referenceDay: Date,
        calendar: Calendar
    ) -> HomePeriodInsightCardData {
        let recent = Self.entries(inDayRange: 0...89, from: entries, referenceDay: referenceDay, calendar: calendar)
        let previous = Self.entries(inDayRange: 90...179, from: entries, referenceDay: referenceDay, calendar: calendar)
        let recentTagged = taggedEntries(in: recent)
        let previousTagged = taggedEntries(in: previous)

        guard recentTagged.count >= 3, previousTagged.count >= 3 else {
            return card(
                .tasteChange,
                title: "미각 기록 변화 대기",
                detail: "직전 90일 · \(previousTagged.count)/3\n최근 90일 · \(recentTagged.count)/3",
                stats: [
                    HomeInsightStat(label: "최근 90일", value: "\(recentTagged.count)/3"),
                    HomeInsightStat(label: "직전 90일", value: "\(previousTagged.count)/3"),
                ],
                state: .insufficient
            )
        }

        let candidateIDs = Set(recentTagged.flatMap { catalogTasteIDs(in: $0) })
            .union(previousTagged.flatMap { catalogTasteIDs(in: $0) })
        var candidates: [TasteChangeCandidate] = []
        for id in candidateIDs {
            guard let experience = catalogExperience(for: id) else { continue }
            let recentCount = recentTagged.count { catalogTasteIDs(in: $0).contains(id) }
            let previousCount = previousTagged.count { catalogTasteIDs(in: $0).contains(id) }
            let delta = abs(
                Double(recentCount) / Double(recentTagged.count)
                    - Double(previousCount) / Double(previousTagged.count)
            )
            candidates.append(
                TasteChangeCandidate(
                    experience: experience,
                    recentCount: recentCount,
                    previousCount: previousCount,
                    absoluteDelta: delta
                )
            )
        }
        candidates.sort {
            if $0.absoluteDelta != $1.absoluteDelta { return $0.absoluteDelta > $1.absoluteDelta }
            return stableStringLess($0.experience.id, $1.experience.id)
        }

        guard let selected = candidates.first else {
            return card(.tasteChange, title: "미각 기록 변화 대기", detail: "비교할 미각 단서 없음", state: .insufficient)
        }

        let before = percent(selected.previousCount, of: previousTagged.count)
        let after = percent(selected.recentCount, of: recentTagged.count)
        return card(
            .tasteChange,
            title: "\(selected.experience.label) 기록 비중 \(before)% → \(after)%",
            detail: "직전 90일 · \(before)%\n최근 90일 · \(after)%",
            stats: [
                HomeInsightStat(label: "최근 90일", value: "\(after)%"),
                HomeInsightStat(label: "직전 90일", value: "\(before)%"),
            ],
            chartValues: monthlyTasteShares(for: selected.experience.id, entries: lastTwelveMonths, referenceDay: referenceDay, calendar: calendar),
            accentAxis: selected.experience.axis,
            state: .populated
        )
    }

    private static func card(
        _ kind: HomePeriodInsightKind,
        title: String,
        detail: String,
        supportingText: String? = nil,
        stats: [HomeInsightStat] = [],
        chartValues: [Double] = [],
        accentAxis: TasteAxis? = nil,
        state: HomeSummaryMetricState
    ) -> HomePeriodInsightCardData {
        HomePeriodInsightCardData(kind: kind, title: title, detail: detail, supportingText: supportingText, stats: stats, chartValues: chartValues, accentAxis: accentAxis, state: state)
    }

    private static func entries(inLastDays count: Int, from entries: [DiningEntry], referenceDay: Date, calendar: Calendar) -> [DiningEntry] {
        Self.entries(inDayRange: 0...(count - 1), from: entries, referenceDay: referenceDay, calendar: calendar)
    }

    private static func entriesInLastTwelveMonths(from entries: [DiningEntry], referenceDay: Date, calendar: Calendar) -> [DiningEntry] {
        let start = calendar.date(byAdding: .year, value: -1, to: referenceDay)!
        return entries.filter { calendar.startOfDay(for: $0.date) >= start && calendar.startOfDay(for: $0.date) <= referenceDay }
    }

    private static func entries(inDayRange range: ClosedRange<Int>, from entries: [DiningEntry], referenceDay: Date, calendar: Calendar) -> [DiningEntry] {
        entries.filter { entry in
            let entryDay = calendar.startOfDay(for: entry.date)
            guard entryDay <= referenceDay,
                  let daysAgo = calendar.dateComponents([.day], from: entryDay, to: referenceDay).day
            else { return false }
            return range.contains(daysAgo)
        }
    }

    private static func dailyCounts(entries: [DiningEntry], referenceDay: Date, calendar: Calendar) -> [Double] {
        (0...6).reversed().map { daysAgo in
            Double(Self.entries(inDayRange: daysAgo...daysAgo, from: entries, referenceDay: referenceDay, calendar: calendar).count)
        }
    }

    /// Twelve contiguous calendar-month intervals ending at the reference day.
    /// This preserves the inclusive one-year window even when month lengths vary.
    private static func monthlyCounts(entries: [DiningEntry], referenceDay: Date, calendar: Calendar) -> [Double] {
        monthlyWindows(referenceDay: referenceDay, calendar: calendar).map { window in
            Double(entries.filter { calendar.startOfDay(for: $0.date) >= window.start && calendar.startOfDay(for: $0.date) < window.end }.count)
        }
    }

    private static func monthlyTasteShares(for id: String, entries: [DiningEntry], referenceDay: Date, calendar: Calendar) -> [Double] {
        monthlyWindows(referenceDay: referenceDay, calendar: calendar).map { window in
            let monthEntries = entries.filter { calendar.startOfDay(for: $0.date) >= window.start && calendar.startOfDay(for: $0.date) < window.end }
            guard !monthEntries.isEmpty else { return 0 }
            return Double(monthEntries.count { catalogTasteIDs(in: $0).contains(id) }) / Double(monthEntries.count)
        }
    }

    private static func monthlyWindows(referenceDay: Date, calendar: Calendar) -> [(start: Date, end: Date)] {
        (0..<12).compactMap { index in
            let start = calendar.date(byAdding: .month, value: index - 12, to: referenceDay)
            let end = index == 11
                ? calendar.date(byAdding: .day, value: 1, to: referenceDay)
                : calendar.date(byAdding: .month, value: index - 11, to: referenceDay)
            return start.flatMap { start in end.map { (start, $0) } }
        }
    }

    private static func rankedValues(entries: [DiningEntry], value: (DiningEntry) -> String) -> [RankedValue] {
        var counts: [String: (label: String, count: Int)] = [:]
        for entry in entries {
            let label = normalized(value(entry))
            let key = identityKey(label)
            guard !key.isEmpty else { continue }
            counts[key] = (counts[key]?.label ?? label, (counts[key]?.count ?? 0) + 1)
        }
        return counts.map { RankedValue(key: $0.key, label: $0.value.label, count: $0.value.count) }
            .sorted { $0.count == $1.count ? stableStringLess($0.key, $1.key) : $0.count > $1.count }
    }

    private static func topRanks(in ranks: [RankedValue]) -> [RankedValue] {
        guard let count = ranks.first?.count else { return [] }
        return ranks.filter { $0.count == count }
    }

    private static func repeatedSummary(_ values: [RankedValue], unit: String) -> String? {
        guard let first = values.first else { return nil }
        guard let names = namedSummary(values, unit: unit) else { return nil }
        return "\(names) · \(first.count)회"
    }

    private static func namedSummary(_ values: [RankedValue], unit: String) -> String? {
        guard let first = values.first else { return nil }
        let remainingCount = values.count - 1
        return remainingCount == 0
            ? first.label
            : "\(first.label) 외 \(remainingCount)\(unit)"
    }

    private static func compactLines(_ lines: [String?], fallback: String) -> String {
        let visibleLines = lines
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .prefix(2)
        return visibleLines.isEmpty ? fallback : visibleLines.joined(separator: "\n")
    }

    private static func summarizedLabels(_ labels: [String], limit: Int = 2) -> String {
        let visibleLabels = labels.prefix(limit).joined(separator: " · ")
        let hiddenCount = max(labels.count - limit, 0)
        return hiddenCount == 0 ? visibleLabels : "\(visibleLabels) 외 \(hiddenCount)개"
    }

    private static func tasteRanks(in entries: [DiningEntry]) -> [TasteRank] {
        var counts: [String: Int] = [:]
        for entry in entries {
            for id in catalogTasteIDs(in: entry) { counts[id, default: 0] += 1 }
        }
        return counts.compactMap { id, count in catalogExperience(for: id).map { TasteRank(experience: $0, count: count) } }
            .sorted { $0.count == $1.count ? stableStringLess($0.experience.id, $1.experience.id) : $0.count > $1.count }
    }

    private static func taggedEntries(in entries: [DiningEntry]) -> [DiningEntry] {
        entries.filter { !catalogTasteIDs(in: $0).isEmpty }
    }

    private static func catalogTasteIDs(in entry: DiningEntry) -> Set<String> {
        Set(entry.tasteExperienceIDs.compactMap { rawID in
            let key = identityKey(rawID)
            return catalogExperience(for: key).map { identityKey($0.id) }
        })
    }

    private static func catalogExperience(for id: String) -> TasteExperience? {
        let key = identityKey(id)
        return TasteExperienceCatalog.experiences.first { identityKey($0.id) == key }
    }

    private static func uniqueCount(_ values: [String]) -> Int {
        Set(values.map(identityKey).filter { !$0.isEmpty }).count
    }

    private static func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func identityKey(_ value: String) -> String {
        normalized(value)
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))
            .lowercased()
    }

    private static func stableStringLess(_ lhs: String, _ rhs: String) -> Bool {
        let left = lhs.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))
        let right = rhs.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))
        return left == right ? lhs < rhs : left < right
    }

    private static func percent(_ numerator: Int, of denominator: Int) -> Int {
        guard denominator > 0 else { return 0 }
        return Int((Double(numerator) / Double(denominator) * 100).rounded())
    }
}

// MARK: - Cumulative archive metrics

struct HomeArchiveMetric: Identifiable, Equatable {
    let id: String
    let label: String
    let data: HomePeriodInsightCardData
    let entryIDs: Set<UUID>
    let evidenceIDs: Set<String>
}

struct HomeArchiveMetricSection: Identifiable, Equatable {
    let id: String
    let title: String
    let cards: [HomeArchiveMetric]
}

/// 하단은 관찰 분포를 표시하고, 취향 방향에 대한 해석은 상단 TBA에 맡긴다.
enum HomeArchiveMetricsEngine {
    static func sections(
        entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot,
        referenceDate: Date = .now
    ) -> [HomeArchiveMetricSection] {
        var seen = Set<UUID>()
        let entries = entries.filter { $0.observedAt <= referenceDate && seen.insert($0.id).inserted }
            .sorted {
                $0.observedAt == $1.observedAt ? $0.id.uuidString < $1.id.uuidString : $0.observedAt > $1.observedAt
            }
        let completed = entries.filter(\.hasCompletedTasteFeedback)
        let completedIDs = Set(completed.map(\.id))
        let excludedIDs = Set(snapshot.personalModel?.excludedEvidence.map(\.id) ?? [])
        var seenEvidence = Set<String>()
        let observations = snapshot.observations.filter {
            completedIDs.contains($0.experienceID) && !excludedIDs.contains($0.id)
                && ($0.observedAt ?? $0.recordedAt) <= referenceDate
                && ($0.knownAt ?? $0.recordedAt) <= referenceDate
                && seenEvidence.insert($0.id).inserted
        }
        let meals = Dictionary(entries.map { ($0.id, $0.mealID) }, uniquingKeysWith: { first, _ in first })
        let menus = Dictionary(grouping: entries.filter { !normalized($0.menu).isEmpty }, by: {
            $0.menuItemID.map { "id:" + $0 } ?? "name:" + normalized($0.menu)
        })
        let restaurants = Dictionary(grouping: entries.filter { !normalized($0.restaurant).isEmpty }, by: {
            $0.restaurantID.map { "id:" + $0 } ?? "name:" + normalized($0.restaurant)
        })

        func metric(_ id: String, _ label: String, _ title: String, _ detail: String,
                    kind: HomePeriodInsightKind = .recordFlow, axis: TasteAxis? = nil,
                    records: [DiningEntry] = [], evidence: [SensoryObservation] = []) -> HomeArchiveMetric {
            .init(id: id, label: label,
                  data: .init(kind: kind, title: title, detail: detail, supportingText: nil,
                              stats: [], chartValues: [], accentAxis: axis,
                              state: records.isEmpty && evidence.isEmpty ? .empty : .populated),
                  entryIDs: Set(records.map(\.id)).union(evidence.map(\.experienceID)),
                  evidenceIDs: Set(evidence.map(\.id)))
        }

        let repeatedMenuCount = menus.values.count { Set($0.map(\.mealID)).count >= 2 }
        let revisitedRestaurantCount = restaurants.values.count { Set($0.map(\.mealID)).count >= 2 }
        let recordCards = [
            metric("meals", "식사", "\(Set(entries.map(\.mealID)).count)회",
                   "전체 기록 · 피드백을 남긴 식사 \(Set(completed.map(\.mealID)).count)회", records: entries),
            metric("menus", "메뉴", "\(menus.count)가지",
                   "다시 먹은 메뉴 \(repeatedMenuCount)가지 · 전체 기간",
                   kind: .experienceBreadth, records: entries),
            metric("restaurants", "식당", "\(restaurants.count)곳",
                   "다시 방문한 식당 \(revisitedRestaurantCount)곳 · 전체 기간", kind: .experienceBreadth, records: entries),
        ]

        // 같은 식사의 서로 다른 응답은 하나를 임의 선택하지 않고 '평가 나뉨'으로 보존한다.
        func distribution(_ rows: [SensoryObservation], values: [(String, String)]) -> String {
            guard !rows.isEmpty else { return "응답 없음" }
            let byMeal = Dictionary(grouping: rows, by: { meals[$0.experienceID] ?? $0.independentMealID })
            let votes = byMeal.values.map { Set($0.map { $0.value.text }) }
            var parts = values.map { value, label in
                "\(label) \(votes.count { $0 == Set([value]) })"
            }
            let mixed = votes.count { $0.count > 1 }
            if mixed > 0 { parts.append("평가 나뉨 \(mixed)") }
            return parts.joined(separator: " · ") + " / \(byMeal.count)회"
        }

        let overallValues = [("very_positive", "매우 좋음"), ("positive", "좋음"), ("neutral", "보통"),
                             ("negative", "별로"), ("very_negative", "매우 별로")]
        let overall = observations.filter { row in
            row.kind == "overall_liking" && row.scale == "overall-five-category-v1"
                && overallValues.contains { $0.0 == row.value.text }
        }
        let overallCard = metric("overall", "전체 만족도",
                                 overall.isEmpty ? "응답 없음" : "\(Set(overall.map { meals[$0.experienceID] ?? $0.independentMealID }).count)회의 평가",
                                 overall.isEmpty ? "음식 전체에 남긴 평가" : distribution(overall, values: overallValues),
                                 kind: .tasteClue, evidence: overall)
        return [
            .init(id: "archive", title: "아카이브", cards: recordCards + [overallCard]),
        ]
    }

    private static func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))
    }
}
