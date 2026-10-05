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
        let entries = arguments.contains("--gastronomy-empty") ? [] : Self.entries(discoveryExamples: arguments.contains("--gastronomy-discovery-examples"))
        _model = StateObject(wrappedValue: AppModel.preview(authEntryComplete: true, onboardingComplete: true,
                                                          diningEntries: entries, authRepository: FixtureBackendAuthRepository()))
    }
    var body: some View {
        AppShellView(initialTab: .home, initialRoute: route).environmentObject(model)
    }
    static func entries(now: Date = .now, calendar: Calendar = .current, discoveryExamples: Bool = false) -> [DiningEntry] {
        let noodleKinds = ["grain_noodle"].filter { TDNativeAdapter.kindLabels[$0] != nil }
        let dumplingKinds = ["dumpling_batter"].filter { TDNativeAdapter.kindLabels[$0] != nil }
        var rows: [DiningEntry] = []
        for (index, days) in [120, 114, 106, 102, 100, 9, 8, 7, 6, 1].enumerated() {
            let date = calendar.date(byAdding: .day, value: -days, to: now)!
            let meal = UUID()
            let selection = DiningSensorySelection(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                                                   liking: index < 5 ? .disliked : .liked, intensity: .strong,
                                                   preferenceFit: index < 5 ? .tooStrong : .justRight, target: .broth, phase: .duringMeal)
            rows.append(.init(mealID: meal, restaurant: discoveryExamples ? "온담면옥" : "검증 식당 가", restaurantID: "gastronomy-qa-A", menu: discoveryExamples ? "평양냉면" : "검증 냉면", menuItemID: "qa-noodles",
                              observedAt: date, savedAt: date, rating: 0, note: "검증용 원문: 산미를 국물에서 강하게 느꼈어요.", sensorySelections: [selection],
                              overallEvaluation: .init(response: index < 5 ? .disliked : .liked), dishKindIDs: noodleKinds,
                              mealTime: .init(source: .confirmed, start: date, confirmedAt: now), foodSource: .init(kind: "restaurant")))
            if index >= 7 {
                rows.append(.init(mealID: meal, restaurant: discoveryExamples ? "온담면옥" : "검증 식당 가", restaurantID: "gastronomy-qa-A", menu: discoveryExamples ? "메밀만두" : "검증 만두", menuItemID: "qa-dumpling",
                                  observedAt: date, savedAt: date, rating: 0, note: "검증용 원문: 냉면과 함께 먹은 만두.", sensorySelections: [],
                                  overallEvaluation: .init(response: .liked), dishKindIDs: dumplingKinds,
                                  mealTime: .init(source: .confirmed, start: date, confirmedAt: now), foodSource: .init(kind: "restaurant")))
            }
        }
        let today = calendar.startOfDay(for: now)
        rows.append(.init(restaurant: "직접 만든 요리", menu: discoveryExamples ? "토마토 파스타" : "검증 토마토 파스타", observedAt: today, savedAt: now, rating: 0,
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
                rows.append(.init(restaurant: "초록식탁", restaurantID: "gastronomy-example-B", menu: "유자 샐러드", menuItemID: "example-salad",
                                  observedAt: date, savedAt: date, rating: 0, note: "예시 기록: 유자 드레싱의 산미와 단맛을 함께 느꼈어요.",
                                  sensorySelections: selections, overallEvaluation: .init(response: .liked), feedbackStatus: .completed,
                                  mealTime: .init(source: .confirmed, start: date, confirmedAt: now), foodSource: .init(kind: "restaurant")))
            }
        }
        return rows
    }
}
#endif
