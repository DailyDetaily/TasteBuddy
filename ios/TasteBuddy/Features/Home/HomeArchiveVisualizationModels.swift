import Foundation

/// 계정/원본 revision에 맞춰 분석 작업에서 한 번 만들고 홈 렌더에서는 읽기만 한다.
struct HomeArchivePresentation {
    let menuInsights: HomeArchiveMenuInsights
    let summaries: [HomeArchiveCard]
    let sections: [HomeArchiveMetricSection]
    let discoveries: [HomeDiscoveryCard]
    let referenceDay: Date
    let gastronomyInput: TDNativeInput
    let gastronomyState: TDState
    let sourceEntries: [DiningEntry]
    let sourceSnapshot: SensoryAnalysisSnapshot
    let sourceTimeZone: String

    /// The recent card uses the same validated daily dish counts as record charts.
    /// Undated records remain in the cumulative archive, never in this seven-day series.
    func recentRecordSummary(calendar: Calendar = .current) -> HomePeriodInsightCardData {
        let data = TBRecordChartData.make(state: gastronomyState, calendar: calendar)
        let firstDay = calendar.date(byAdding: .day, value: -6, to: calendar.startOfDay(for: gastronomyState.now))!
        let records = gastronomyState.records.filter { record in
            record.date.map { $0 >= firstDay && $0 <= gastronomyState.now } ?? false
        }
        let ids = Set(records.map(\.id))
        let completed = Set(sourceEntries.filter { ids.contains($0.id.uuidString) && $0.hasCompletedTasteFeedback }.map(\.id)).count
        return .init(kind: .recordFlow, title: "요리 기록 \(data.current.reduce(0, +))개",
                     detail: "피드백 완료 \(completed)개\n최근 7일", supportingText: nil, stats: [],
                     chartValues: data.current.map(Double.init), accentAxis: .umami, state: .populated)
    }
    static func make(entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot, referenceDate: Date) -> Self {
        let input = TDNativeAdapter.inputs(entries: entries, snapshot: snapshot, now: referenceDate)
        let state = TDDataEngine.prepare(records: input.records, observations: input.observations, window: .all,
                                         now: referenceDate, calendar: .current, issues: input.issues)
        let sources = HomeArchiveSources(validated: input, state: state)
        return .init(
            menuInsights: .make(input: input, state: state),
            summaries: HomeArchiveSummaryEngine.cards(entries: sources.entries, snapshot: snapshot, referenceDate: referenceDate),
            sections: HomeArchiveVisualizationEngine.sections(sources: sources, referenceDate: referenceDate),
            discoveries: HomeDiscoveryEngine.gastronomyCards(input: input, state: state, calendar: .current),
            referenceDay: Calendar.current.startOfDay(for: referenceDate), gastronomyInput: input, gastronomyState: state,
            sourceEntries: entries, sourceSnapshot: snapshot, sourceTimeZone: Calendar.current.timeZone.identifier
        )
    }
}

/// 원문을 여는 범주가 곧 차트의 분자다. 표시에서 평가 방향을 다시 추론하지 않는다.
struct HomeArchiveChart: Equatable {
    enum Kind: Equatable { case timeSeries, composition, distribution }
    struct Segment: Identifiable, Equatable {
        let id: String
        let label: String
        let count: Int
        let entryIDs: Set<UUID>
        var evidenceIDs: Set<String> = []
    }
    let kind: Kind
    let unit: String
    let period: String
    let segments: [Segment]
    var supplements: [Segment] = []
    var responseScale: String? = nil
    var total: Int { segments.reduce(0) { $0 + $1.count } }
    var hasData: Bool { total > 0 }
    var summary: String {
        ([period] + segments.map { "\($0.label) \($0.count)\(unit)" }
            + supplements.filter { $0.count > 0 }.map { "\($0.label) \($0.count)\(unit)" })
            .joined(separator: " · ")
    }
    static func heightFraction(_ count: Int, maximum: Int) -> Double {
        maximum > 0 ? Double(max(0, count)) / Double(maximum) : 0
    }
}

enum HomeArchiveIdentity {
    static func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))
    }
    static func hasRestaurant(_ entry: DiningEntry) -> Bool {
        !normalized(entry.restaurantID ?? "").isEmpty || !normalized(entry.restaurant).isEmpty
    }
    static func hasMenu(_ entry: DiningEntry) -> Bool {
        !normalized(entry.menuItemID ?? "").isEmpty || !normalized(entry.menu).isEmpty
    }
    static func restaurant(_ entry: DiningEntry) -> String {
        if let id = entry.restaurantID, !normalized(id).isEmpty { return "id:" + normalized(id) }
        let name = normalized(entry.restaurant)
        return name.isEmpty ? "unknown:" + entry.id.uuidString : "name:" + name
    }
    static func menu(_ entry: DiningEntry) -> String {
        let identity = entry.menuItemID.flatMap { normalized($0).isEmpty ? nil : "id:" + normalized($0) }
            ?? "name:" + normalized(entry.menu)
        return PersonalTasteModelBuilder.json([restaurant(entry), identity])
    }
    static func entries(_ entries: [DiningEntry], asOf: Date) -> [DiningEntry] {
        // 같은 ID의 다른 원본은 임의 선택하지 않는다.
        Dictionary(grouping: entries, by: \.id).values.compactMap { rows in
            guard let first = rows.first, rows.allSatisfy({ $0 == first }), first.observedAt <= asOf else { return nil }
            return first
        }.sorted { $0.observedAt == $1.observedAt ? $0.id.uuidString < $1.id.uuidString : $0.observedAt > $1.observedAt }
    }
}

/// 아카이브와 발견 후보가 같은 현재 원본/직접 응답을 한 번 정규화해 사용한다.
struct HomeArchiveSources {
    let entries: [DiningEntry]
    let observations: [SensoryObservation]
    let menus: [String: [DiningEntry]]
    let restaurants: [String: [DiningEntry]]
    let menuKeyByEntry: [UUID: String]
    var strictMealDates = false
    var validatedIntensityLinks: [String: Set<String>] = [:]

    init(entries source: [DiningEntry], snapshot: SensoryAnalysisSnapshot, referenceDate: Date) {
        let entries = HomeArchiveIdentity.entries(source, asOf: referenceDate)
        let ids = Set(entries.filter(\.hasCompletedTasteFeedback).map(\.id))
        let revisions = Dictionary(entries.map { ($0.id, $0.memoryRevisionNumber) }, uniquingKeysWith: { first, _ in first })
        let excluded = Set(snapshot.personalModel?.excludedEvidence.map(\.id) ?? [])
        let duplicateConflicts = Set(Dictionary(grouping: snapshot.observations, by: \.id)
            .filter { _, rows in rows.contains { $0 != rows[0] } }.keys)
        var seen = Set<String>()
        self.observations = snapshot.observations.filter {
            ids.contains($0.experienceID) && revisions[$0.experienceID] == $0.sourceRevision && !excluded.contains($0.id) && !duplicateConflicts.contains($0.id)
                && ($0.observedAt ?? $0.recordedAt) <= referenceDate
                && ($0.knownAt ?? $0.recordedAt) <= referenceDate && seen.insert($0.id).inserted
        }
        self.entries = entries
        menus = Dictionary(grouping: entries.filter(HomeArchiveIdentity.hasMenu), by: HomeArchiveIdentity.menu)
        restaurants = Dictionary(grouping: entries.filter(HomeArchiveIdentity.hasRestaurant), by: HomeArchiveIdentity.restaurant)
        menuKeyByEntry = Dictionary(uniqueKeysWithValues: entries.filter(HomeArchiveIdentity.hasMenu).map { ($0.id, HomeArchiveIdentity.menu($0)) })
    }

    /// The gastronomy adapter has already checked complete original records, dates and direct atoms.
    init(validated input: TDNativeInput, state: TDState, selectedOnly: Bool = false) {
        let rows = selectedOnly ? state.selected : state.records
        let recordMap = Dictionary(uniqueKeysWithValues: rows.map { ($0.id, $0) })
        entries = input.entries.filter { recordMap[$0.id.uuidString] != nil }.sorted {
            $0.observedAt == $1.observedAt ? $0.id.uuidString < $1.id.uuidString : $0.observedAt > $1.observedAt
        }
        let allRecordMap = state.recordMap
        let starIDs = Set(input.overallStarObservations.map(\.id))
        let issuesByMeal = Dictionary(grouping: state.issues.filter { !starIDs.contains($0.id) }) { allRecordMap[$0.entryID]?.mealID ?? "" }
        let observationIDs = Set(state.observations.filter { observation in
            let meal = allRecordMap[observation.entryID]?.mealID ?? ""
            return !(issuesByMeal[meal] ?? []).contains { issue in
                (issue.facet == nil || issue.facet == observation.facet) && (issue.senseKey == nil || issue.senseKey == observation.senseKey)
            }
        }.map(\.id))
        observations = (input.nativeObservations + input.overallStarObservations).filter {
            recordMap[$0.experienceID.uuidString] != nil && (observationIDs.contains($0.id) || starIDs.contains($0.id))
        }
        menus = Dictionary(grouping: entries.filter { recordMap[$0.id.uuidString]?.menu != nil }) { recordMap[$0.id.uuidString]!.menu!.id }
        restaurants = Dictionary(grouping: entries.filter { recordMap[$0.id.uuidString]?.restaurant != nil }) { recordMap[$0.id.uuidString]!.restaurant!.id }
        menuKeyByEntry = Dictionary(uniqueKeysWithValues: entries.compactMap { entry in recordMap[entry.id.uuidString]?.menu.map { (entry.id, $0.id) } })
        let intensityIndex = TDDataEngine.intensityIndex(state.observations)
        for row in state.observations where row.facet == .liking || row.facet == .fit {
            validatedIntensityLinks[row.id] = Set(TDDataEngine.linkedIntensity(row, index: intensityIndex, issues: state.issues).map(\.id))
        }
        strictMealDates = true
    }
}

enum HomeArchiveVisualizationEngine {
    static func sections(entries source: [DiningEntry], snapshot: SensoryAnalysisSnapshot,
                         referenceDate: Date = .now, calendar: Calendar = .current) -> [HomeArchiveMetricSection] {
        sections(sources: HomeArchiveSources(entries: source, snapshot: snapshot, referenceDate: referenceDate),
                 referenceDate: referenceDate, calendar: calendar)
    }

    static func sections(sources: HomeArchiveSources, referenceDate: Date = .now,
                         calendar: Calendar = .current) -> [HomeArchiveMetricSection] {
        let entries = sources.entries, observations = sources.observations
        let menus = sources.menus, restaurants = sources.restaurants
        func composition(_ groups: [String: [DiningEntry]], unit: String,
                         onceLabel: String, repeatedLabel: String) -> HomeArchiveChart {
            let once = groups.values.filter { Set($0.map(\.mealID)).count == 1 }
            let repeated = groups.values.filter { Set($0.map(\.mealID)).count > 1 }
            return .init(kind: .composition, unit: unit, period: "전체 기간", segments: [
                .init(id: "once", label: onceLabel, count: once.count, entryIDs: Set(once.flatMap { $0.map(\.id) })),
                .init(id: "repeated", label: repeatedLabel, count: repeated.count, entryIDs: Set(repeated.flatMap { $0.map(\.id) }))
            ])
        }
        let menuChart = composition(menus, unit: "가지", onceLabel: "한 번 기록", repeatedLabel: "반복 기록")
        let restaurantChart = composition(restaurants, unit: "곳", onceLabel: "한 번 기록", repeatedLabel: "반복 기록")
        let knownMenuIDs = Set(menus.values.flatMap { $0.map(\.id) })
        let knownRestaurantIDs = Set(restaurants.values.flatMap { $0.map(\.id) })
        let unknownMenus = entries.filter { !knownMenuIDs.contains($0.id) }.count
        let unknownRestaurants = entries.filter { !knownRestaurantIDs.contains($0.id) && $0.foodSource?.kind != "homeCooked" }.count
        let mealChart = timeline(entries: entries, referenceDate: referenceDate, calendar: calendar)
        let overallChart = overall(entries: entries, observations: observations)
        func metric(_ id: String, label: String, title: String, detail: String, chart: HomeArchiveChart,
                    kind: HomePeriodInsightKind, records: [DiningEntry],
                    defaultEntryIDs: Set<UUID>? = nil, isPopulated: Bool? = nil,
                    unknownCount: Int = 0) -> HomeArchiveMetric {
            .init(id: id, label: label,
                  data: .init(kind: kind, title: title, detail: detail, supportingText: nil, stats: [], chartValues: [],
                              accentAxis: nil,
                              state: (isPopulated ?? !records.isEmpty) ? .populated : unknownCount > 0 ? .insufficient : .empty,
                              archiveChart: chart, category: id == "overall" ? .preference : .experience),
                  entryIDs: defaultEntryIDs ?? Set(records.map(\.id)),
                  evidenceIDs: Set((chart.segments + chart.supplements).flatMap(\.evidenceIDs)))
        }
        let mealCount = Set(entries.map(\.mealID)).count
        let unknownMealCount = mealChart.supplements.first { $0.id == "unknown" }?.count ?? 0
        let mealDetail: String
        if entries.isEmpty {
            mealDetail = "첫 기록을 남겨보세요"
        } else if mealChart.hasData {
            mealDetail = "요리 기록 \(entries.count)개\n" + (unknownMealCount > 0 ? "식사일 미확인 \(unknownMealCount)번" : "전체 기간")
        } else {
            mealDetail = "요리 기록 \(entries.count)개\n식사일 미확인"
        }
        func compositionDetail(_ chart: HomeArchiveChart, empty: String) -> String {
            guard chart.total > 0 else { return empty }
            return "한 번 \(chart.segments[0].count)\(chart.unit) · 반복 \(chart.segments[1].count)\(chart.unit)\n\(chart.period)"
        }
        let overallEntryIDs = Set(overallChart.segments.flatMap(\.entryIDs))
        let overallDetail: String
        if overallChart.total == 0 {
            overallDetail = "직접 응답 없음\n전체 기간"
        } else if overallChart.responseScale == DiningOverallEvaluation.starScale {
            let previousCount = overallChart.supplements.filter { $0.id.hasPrefix("category:") }.reduce(0) { $0 + $1.count }
            overallDetail = "0.5~5점 · 0.5점 단위\n" + (previousCount > 0 ? "이전 5단계 응답 \(previousCount)개 별도" : "전체 기간")
        } else {
            overallDetail = "직접 남긴 5단계 응답\n전체 기간"
        }
        return [.init(id: "archive", title: "아카이브", cards: [
            metric("meals", label: "기록한 식사", title: mealCount == 0 ? "0번" : "\(mealCount)번의 식사",
                   detail: mealDetail,
                   chart: mealChart, kind: .recordFlow, records: entries),
            metric("menus", label: "경험한 메뉴", title: menus.isEmpty && unknownMenus > 0 ? "연결 확인 필요" : "\(menus.count)가지",
                   detail: unknownMenus > 0 ? "미연결 요리 \(unknownMenus)개\n식당별 메뉴 기준" : compositionDetail(menuChart, empty: "첫 기록을 남겨보세요\n식당별 메뉴 기준"),
                   chart: menuChart, kind: .experienceBreadth, records: menus.values.flatMap { $0 }, unknownCount: unknownMenus),
            metric("restaurants", label: "기록한 식당", title: restaurants.isEmpty && unknownRestaurants > 0 ? "연결 확인 필요" : "\(restaurants.count)곳",
                   detail: unknownRestaurants > 0 ? "미연결 요리 \(unknownRestaurants)개\n전체 기간" : compositionDetail(restaurantChart, empty: "첫 기록을 남겨보세요\n전체 기간"),
                   chart: restaurantChart, kind: .experienceBreadth, records: restaurants.values.flatMap { $0 }, unknownCount: unknownRestaurants),
            metric("overall", label: "음식 전체 평가", title: overallChart.total == 0 ? "아직 평가 없음" : "\(overallChart.responseScale == DiningOverallEvaluation.starScale ? "별점" : "음식 평가") \(overallChart.total)개",
                   detail: overallDetail, chart: overallChart, kind: .tasteClue,
                   records: entries, defaultEntryIDs: overallEntryIDs, isPopulated: overallChart.hasData)
        ])]
    }

    static func timeline(entries: [DiningEntry], referenceDate: Date = .now,
                         calendar: Calendar) -> HomeArchiveChart {
        let meals = Dictionary(grouping: entries, by: \.mealID)
        var dated: [(date: Date, rows: [DiningEntry])] = []
        var unknown: [[DiningEntry]] = [], future: [[DiningEntry]] = []
        for rows in meals.values {
            let dates = Set(rows.compactMap(\.confirmedMealDate).map { calendar.startOfDay(for: $0) })
            if dates.count == 1, rows.allSatisfy({ $0.confirmedMealDate != nil }), let date = dates.first, date <= referenceDate {
                dated.append((date, rows))
            } else if dates.count == 1, rows.allSatisfy({ $0.confirmedMealDate != nil }) {
                future.append(rows)
            }
            else { unknown.append(rows) }
        }
        var supplements = [
            HomeArchiveChart.Segment(id: "unknown", label: "식사 시점 미확인", count: unknown.count,
                                     entryIDs: Set(unknown.flatMap { $0.map(\.id) }))
        ]
        if !future.isEmpty {
            supplements.append(.init(id: "future", label: "현재 이후 식사일", count: future.count,
                                     entryIDs: Set(future.flatMap { $0.map(\.id) })))
        }
        guard let first = dated.map(\.date).min(), let last = dated.map(\.date).max() else {
            return .init(kind: .timeSeries, unit: "번", period: "확인된 식사일 없음", segments: [], supplements: supplements)
        }
        let days = calendar.dateComponents([.day], from: first, to: last).day ?? 0
        let component: Calendar.Component = days < 84 ? .weekOfYear : days < 730 ? .month : .year
        let unit = component == .weekOfYear ? "주별" : component == .month ? "월별" : "연도별"
        var start = calendar.dateInterval(of: component, for: first)!.start
        let end = calendar.dateInterval(of: component, for: last)!.end
        var segments: [HomeArchiveChart.Segment] = []
        let formatter = DateFormatter(); formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = component == .year ? "yyyy년" : component == .month ? "yy.MM" : "M.d"
        while start < end {
            guard let next = calendar.date(byAdding: component, value: 1, to: start), next > start else { break }
            let selected = dated.filter { $0.date >= start && $0.date < next }
            segments.append(.init(id: start.ISO8601Format(), label: formatter.string(from: start), count: selected.count,
                                  entryIDs: Set(selected.flatMap { $0.rows.map(\.id) })))
            start = next
        }
        formatter.dateFormat = "yyyy.M.d"
        return .init(kind: .timeSeries, unit: "번", period: "\(unit) · \(formatter.string(from: first))–\(formatter.string(from: last))",
                     segments: segments, supplements: supplements)
    }

    static func overall(entries: [DiningEntry], observations: [SensoryObservation]) -> HomeArchiveChart {
        let ratings = observations.filter {
            $0.kind == "overall_liking" && ["overall-five-category-v1", DiningOverallEvaluation.starScale].contains($0.scale)
                && $0.selectionEvidence?.type == "overallEvaluation"
        }
        let grouped = Dictionary(grouping: ratings, by: \.experienceID)
        let conflicting = grouped.filter { Set($0.value.map { $0.scale + ":" + $0.value.text }).count > 1 }
        let conflicts = Set(conflicting.keys)
        let stars = ratings.filter { !conflicts.contains($0.experienceID) && $0.scale == DiningOverallEvaluation.starScale }
        let categories = ratings.filter { !conflicts.contains($0.experienceID) && $0.scale == "overall-five-category-v1" }
        let categorySegments = DiningOverallEvaluation.Response.allCases.map { response -> HomeArchiveChart.Segment in
            let rows = categories.filter { $0.value.text == response.semanticValue }
            return .init(id: response.rawValue, label: response.label, count: Set(rows.map(\.experienceID)).count,
                         entryIDs: Set(rows.map(\.experienceID)), evidenceIDs: Set(rows.map(\.id)))
        }
        let segments: [HomeArchiveChart.Segment] = stars.isEmpty ? categorySegments : (1...10).map { step in
            let value = DiningOverallEvaluation.starText(Double(step) / 2)
            let rows = stars.filter { $0.value.text == value }
            return .init(id: "stars:" + value, label: value + "점", count: Set(rows.map(\.experienceID)).count,
                         entryIDs: Set(rows.map(\.experienceID)), evidenceIDs: Set(rows.map(\.id)))
        }
        let counted = Set(ratings.map(\.experienceID))
        let notes = observations.filter { $0.kind == "overall_liking" && $0.selectionEvidence == nil && ["overall-three-category-v1", "overall-five-category-v1"].contains($0.scale) }
        let previousScale = stars.isEmpty ? [] : categorySegments.filter { $0.count > 0 }.map {
            HomeArchiveChart.Segment(id: "category:" + $0.id, label: "이전 5단계 · " + $0.label,
                                     count: $0.count, entryIDs: $0.entryIDs, evidenceIDs: $0.evidenceIDs)
        }
        return .init(kind: .distribution, unit: "개",
                     period: stars.isEmpty ? "전체 기간 · 음식 경험별 직접 응답 5단계" : "전체 기간 · 직접 별점 0.5~5점 · 0.5점 단위",
                     segments: segments, supplements: previousScale + [
            .init(id: "unanswered", label: "전체 평가 미응답", count: entries.filter { !counted.contains($0.id) }.count,
                  entryIDs: Set(entries.filter { !counted.contains($0.id) }.map(\.id))),
            .init(id: "conflict", label: "현재 응답 충돌", count: conflicts.count, entryIDs: conflicts,
                  evidenceIDs: Set(conflicting.values.flatMap { $0.map(\.id) })),
            .init(id: "note", label: "원문 전체 평가", count: Set(notes.map(\.experienceID)).count,
                  entryIDs: Set(notes.map(\.experienceID)), evidenceIDs: Set(notes.map(\.id)))
        ], responseScale: stars.isEmpty ? "overall-five-category-v1" : DiningOverallEvaluation.starScale)
    }
}
