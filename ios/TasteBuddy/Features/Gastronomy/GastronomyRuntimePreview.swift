#if DEBUG || targetEnvironment(simulator)
import SwiftUI

/// Deterministic synthetic records for native route/UI verification. Never a production fallback.
struct GastronomyRuntimePreview: View {
    @StateObject private var model: AppModel
    private let route: AppRoute?
    init() {
        let arguments = ProcessInfo.processInfo.arguments
        let category = arguments.first { $0.hasPrefix("--gastronomy-category=") }
            .flatMap { TDCategory(rawValue: String($0.dropFirst("--gastronomy-category=".count))) }
        route = category.map { .homeInsight($0.routeKind) }
        let entries: [DiningEntry]
        if arguments.contains("--gastronomy-empty") { entries = [] }
        else if arguments.contains("--gastronomy-copy-missing") { entries = Self.responseStateEntries(unresolved: false) }
        else if arguments.contains("--gastronomy-copy-unresolved") { entries = Self.responseStateEntries(unresolved: true) }
        else if arguments.contains("--gastronomy-copy-unclassified") { entries = Self.responseStateEntries(unresolved: true, unclassified: true) }
        else if arguments.contains("--gastronomy-copy-partial") {
            entries = Self.responseStateEntries(unresolved: false)
                + Self.responseStateEntries(unresolved: true)
                + Self.responseStateEntries(unresolved: false, answered: true)
        }
        else {
            entries = Self.entries(discoveryExamples: arguments.contains("--gastronomy-discovery-examples") || arguments.contains("--gastronomy-copy-comprehensive"),
                                   comprehensiveCopyExamples: arguments.contains("--gastronomy-copy-comprehensive"),
                                   longLabels: arguments.contains("--gastronomy-copy-long-labels"))
        }
        _model = StateObject(wrappedValue: AppModel.preview(authEntryComplete: true, onboardingComplete: true,
                                                          diningEntries: entries, authRepository: FixtureBackendAuthRepository()))
    }
    var body: some View {
        AppShellView(initialTab: .home, initialRoute: route).environmentObject(model)
    }
    static func entries(now: Date = .now, calendar: Calendar = .current, discoveryExamples: Bool = false,
                        comprehensiveCopyExamples: Bool = false, longLabels: Bool = false) -> [DiningEntry] {
        func name(_ value: String) -> String { longLabels ? value + " · 계절 재료와 직접 만든 소스를 곁들인 특별 메뉴" : value }
        let restaurantA = longLabels ? "온담면옥 · 성수동 서울숲 정문 앞 두 번째 골목점" : discoveryExamples ? "온담면옥" : "검증 식당 가"
        let noodleKinds = ["grain_noodle"].filter { TDNativeAdapter.kindLabels[$0] != nil }
        let dumplingKinds = ["dumpling_batter"].filter { TDNativeAdapter.kindLabels[$0] != nil }
        var rows: [DiningEntry] = []
        for (index, days) in [120, 114, 106, 102, 100, 9, 8, 7, 6, 1].enumerated() {
            let date = calendar.date(byAdding: .day, value: -days, to: now)!
            let meal = UUID()
            let selection = DiningSensorySelection(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                                                   liking: index < 5 ? .disliked : .liked, intensity: .strong,
                                                   preferenceFit: index < 5 ? .tooStrong : .justRight, target: .broth, phase: .duringMeal)
            rows.append(.init(mealID: meal, restaurant: restaurantA, restaurantID: "gastronomy-qa-A", menu: name(discoveryExamples ? "평양냉면" : "검증 냉면"), menuItemID: "qa-noodles",
                              observedAt: date, savedAt: date, rating: 0, note: "검증용 원문: 산미를 국물에서 강하게 느꼈어요.", sensorySelections: [selection],
                              overallEvaluation: .init(response: index < 5 ? .disliked : .liked), dishKindIDs: noodleKinds,
                              mealTime: .init(source: .confirmed, start: date, confirmedAt: now), foodSource: .init(kind: "restaurant")))
            if index >= 7 {
                rows.append(.init(mealID: meal, restaurant: restaurantA, restaurantID: "gastronomy-qa-A", menu: name(discoveryExamples ? "메밀만두" : "검증 만두"), menuItemID: "qa-dumpling",
                                  observedAt: date, savedAt: date, rating: 0, note: "검증용 원문: 냉면과 함께 먹은 만두.", sensorySelections: [],
                                  overallEvaluation: .init(response: .liked), dishKindIDs: dumplingKinds,
                                  mealTime: .init(source: .confirmed, start: date, confirmedAt: now), foodSource: .init(kind: "restaurant")))
            }
        }
        let today = calendar.startOfDay(for: now)
        rows.append(.init(restaurant: "직접 만든 요리", menu: name(discoveryExamples ? "토마토 파스타" : "검증 토마토 파스타"), observedAt: today, savedAt: now, rating: 0,
                          note: "검증용 직접 만든 요리 원문", sensorySelections: [], dishKindIDs: noodleKinds, mealTime: .init(source: .confirmed, start: today, confirmedAt: now),
                          foodSource: .init(kind: "homeCooked", homeCookingID: "qa-home-pasta")))
        if discoveryExamples {
            // Real engine inputs: three independent meals with co-occurring senses and repeated fit.
            for days in [12, 5, 2] {
                let date = calendar.date(byAdding: .day, value: -days, to: now)!
                let selections = [
                    DiningSensorySelection(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                                           liking: .liked, intensity: .medium, preferenceFit: .justRight, target: .sauce, phase: .duringMeal),
                    DiningSensorySelection(id: "sweet-soft", type: .bubble, labelSnapshot: "부드러운 단맛",
                                           liking: .liked, intensity: .light, preferenceFit: .justRight, target: .sauce, phase: .duringMeal)
                ]
                rows.append(.init(restaurant: "초록식탁", restaurantID: "gastronomy-example-B", menu: name("유자 샐러드"), menuItemID: "example-salad",
                                  observedAt: date, savedAt: date, rating: 0, note: "예시 기록: 유자 드레싱의 산미와 단맛을 함께 느꼈어요.",
                                  sensorySelections: selections, overallEvaluation: .init(response: .liked), feedbackStatus: .completed,
                                  mealTime: .init(source: .confirmed, start: date, confirmedAt: now), foodSource: .init(kind: "restaurant")))
            }
        }
        if comprehensiveCopyExamples {
            rows += comprehensiveEntries(now: now, calendar: calendar, longLabels: longLabels)
        }
        return rows
    }

    /// Source fixtures for copy review; all candidates still pass through the production parser,
    /// repository adapter and discovery engine. They never replace production missing states.
    private static func comprehensiveEntries(now: Date, calendar: Calendar, longLabels: Bool) -> [DiningEntry] {
        var rows: [DiningEntry] = []
        let kinds = ["grain_noodle"].filter { TDNativeAdapter.kindLabels[$0] != nil }
        func sense(_ liking: DiningSensorySelection.Liking, target: DiningSensorySelection.Target,
                   phase: DiningSensorySelection.Phase = .duringMeal) -> DiningSensorySelection {
            .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: liking,
                  intensity: .medium, preferenceFit: .justRight, target: target, phase: phase)
        }
        func append(_ menu: String, _ identity: String, days: Int,
                    restaurant: String = "검증 식탁", restaurantID: String = "copy-restaurant",
                    selections: [DiningSensorySelection] = [], overall: DiningOverallEvaluation.Response? = nil) {
            guard let date = calendar.date(byAdding: .day, value: -days, to: now) else { return }
            rows.append(.init(restaurant: restaurant, restaurantID: restaurantID,
                              menu: longLabels ? menu + " · 계절 재료와 직접 만든 소스를 곁들인 특별 메뉴" : menu,
                              menuItemID: identity, observedAt: date, savedAt: date, rating: 0,
                              note: "합성 문구 검증용 기록", sensorySelections: selections,
                              overallEvaluation: overall.map { .init(response: $0) }, dishKindIDs: kinds,
                              feedbackStatus: .completed,
                              mealTime: .init(source: .confirmed, start: date, confirmedAt: now),
                              foodSource: .init(kind: "restaurant")))
        }
        // Separate scopes avoid manufacturing a combined preference from unrelated conditions.
        for day in [20, 18, 16, 14] {
            append("산미를 좋아한 메뉴", "copy-positive", days: day, selections: [sense(.liked, target: .wholeDish)], overall: .liked)
            append("산미가 아쉬웠던 메뉴", "copy-negative", days: day - 1, selections: [sense(.disliked, target: .wholeDish)])
            append("전체와 감각 평가가 다른 메뉴", "copy-overall-contrast", days: day,
                   selections: [sense(.disliked, target: .inside)], overall: .liked)
            append("앞선 평가 메뉴", "copy-exception", days: day,
                   selections: [sense(.liked, target: .broth, phase: .firstBite)])
        }
        append("앞선 평가 메뉴", "copy-exception", days: 1, selections: [sense(.disliked, target: .broth, phase: .firstBite)])
        for (index, day) in [15, 12, 10].enumerated() {
            append("익숙한 산미 메뉴 \(index + 1)", "copy-familiar-\(index)", days: day,
                   selections: [sense(.liked, target: .surface)], overall: .liked)
        }
        append("처음 기록한 산미 메뉴", "copy-familiar-new", days: 1,
               selections: [sense(.liked, target: .surface)], overall: .liked)
        // No overall answers on the gap pair: it must remain a record-gap finding.
        append("오랜 기록 간격 메뉴", "copy-gap", days: 120)
        append("오랜 기록 간격 메뉴", "copy-gap", days: 1)
        append("두 평가 비교 메뉴", "copy-revisit", days: 7, overall: .liked)
        append("두 평가 비교 메뉴", "copy-revisit", days: 1, overall: .disliked)
        if let anniversary = calendar.date(byAdding: .year, value: -1, to: now),
           let days = calendar.dateComponents([.day], from: anniversary, to: now).day {
            append("지난해 기록 메뉴", "copy-last-year", days: days)
        }
        for index in 0..<3 {
            append("식당별 국수 \(index + 1)", "copy-breadth-\(index)", days: 4 + index,
                   restaurant: "검증 국수집 \(index + 1)", restaurantID: "copy-breadth-restaurant-\(index)")
        }
        // A change finding uses all sensory-observed meals as its denominator. Give sweetness
        // independent source meals rather than inflating the same dish with duplicate choices.
        let sweet = DiningSensorySelection(id: "sweet-soft", type: .bubble, labelSnapshot: "부드러운 단맛",
                                          target: .wholeDish, phase: .duringMeal)
        for day in 3...12 {
            append("단맛 기록 메뉴", "copy-sweet-share", days: day, selections: [sweet])
        }
        return rows
    }

    static func responseStateEntries(now: Date = .now, unresolved: Bool, answered: Bool = false, unclassified: Bool = false) -> [DiningEntry] {
        let selection = DiningSensorySelection(id: unclassified ? "unrecognized-copy-selection" : "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                                               liking: unresolved ? .init(rawValue: "unrecognized-copy-fixture") : answered ? .liked : nil,
                                               target: .broth, phase: .duringMeal)
        return [.init(restaurant: "합성 상태 확인 식당", restaurantID: "copy-state-restaurant", menu: "응답 상태 확인 메뉴",
                      menuItemID: "copy-state-menu", observedAt: now, savedAt: now, rating: 0,
                      note: "합성 상태 검증용 기록", sensorySelections: [selection], feedbackStatus: .completed,
                      mealTime: .init(source: .confirmed, start: now, confirmedAt: now), foodSource: .init(kind: "restaurant"))]
    }
}
#endif
