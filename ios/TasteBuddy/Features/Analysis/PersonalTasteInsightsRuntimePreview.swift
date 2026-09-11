import SwiftUI

#if DEBUG || targetEnvironment(simulator)
/// 저장소와 분리된 명시적 검증 진입점. 실제 사용자의 기록을 바꾸지 않는다.
struct PersonalTasteInsightsRuntimePreview: View {
    var detailKind: PersonalTasteInsightGroup.Kind? = nil
    var initialTab: MainTab = .analysis
    @StateObject private var model = AppModel.preview(
        authEntryComplete: true, onboardingComplete: true, diningEntries: Self.entries
    )

    var body: some View {
        Group {
            if let detailKind {
                if let group = PersonalTasteInsightPresentation.groups(model.sensoryAnalysis.personalModel)
                    .first(where: { $0.kind == detailKind }) {
                    PersonalTasteInsightDetailSheet(group: group, observations: model.sensoryAnalysis.observations, entries: model.diningEntries)
                } else { ProgressView() }
            } else {
                let archiveKind = ProcessInfo.processInfo.arguments.first { $0.hasPrefix("--home-insight=") }
                    .flatMap { HomeArchiveCard.Kind(rawValue: String($0.dropFirst("--home-insight=".count))) }
                AppShellView(initialTab: initialTab, initialRoute: archiveKind.map(AppRoute.homeInsight))
            }
        }
        .environmentObject(model)
    }

    private static var entries: [DiningEntry] {
        let original = (0..<7).map { index in
            let id = UUID(uuidString: String(format: "C0000000-0000-0000-0000-%012d", index + 1))!
            let observed = Date(timeIntervalSince1970: 1_788_480_000 + Double(index * 86_400))
            return DiningEntry(
                id: id, mealID: id, restaurant: "국물의 산미 기록", menu: index < 3 ? "중간 산미의 국물" : "진한 산미의 국물",
                observedAt: observed, savedAt: observed.addingTimeInterval(600), rating: 0, note: "",
                tasteExperienceIDs: ["sour-fresh"],
                sensorySelections: [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                    liking: index < 3 ? .liked : .disliked, intensity: index == 6 ? nil : index < 3 ? .medium : .strong,
                    preferenceFit: index < 3 ? .justRight : .tooStrong, target: .broth, phase: .duringMeal)],
                overallEvaluation: .init(response: .veryLiked), dishKindIDs: ["broth"]
            )
        }
        guard ProcessInfo.processInfo.arguments.contains("--question-batch-qa") else { return original }
        let extra = DiningSensorySelection.Target.allCases.filter { $0 != .unspecified }.prefix(4).enumerated().map { index, target in
            DiningEntry(restaurant: "검증 식당", menu: "검증 메뉴 \(index + 1)",
                date: Date.now.addingTimeInterval(-Double(index + 1) * 3600), rating: 4, note: "",
                sensorySelections: [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .liked, target: target, phase: .unspecified)],
                overallEvaluation: .init(response: .veryLiked))
        }
        return original + extra
    }
}

#Preview("새 해석과 원응답") {
    PersonalTasteInsightsRuntimePreview(detailKind: .overall)
}
#endif
