import SwiftUI

#if DEBUG || targetEnvironment(simulator)
/// Isolated synthetic experience records; the catalog still uses the source-backed bundled menus.
struct HomeSearchRecommendationRuntimePreview: View {
    @StateObject private var model: AppModel
    @StateObject private var transport = HomeSearchRecommendationPreviewRepository()
    private static let referenceDate = Date(timeIntervalSince1970: 1_791_116_000)

    init() {
        let entries: [DiningEntry] = ProcessInfo.processInfo.arguments.contains("--search-recommendation-empty")
            ? [] : (0..<3).map { index in
                let time = Self.referenceDate.addingTimeInterval(-Double(index + 1) * 86_400)
                return DiningEntry(
                    restaurant: "추천 검증용 가상 식당", menu: "검증용 완탕",
                    observedAt: time, savedAt: time.addingTimeInterval(60), rating: 0,
                    note: "소스의 매운맛이 좋았다.", sensorySelections: [],
                    overallEvaluation: .init(response: .liked), dishKindIDs: ["dumpling"]
                )
            }
        _model = StateObject(wrappedValue: AppModel.preview(
            authEntryComplete: true, onboardingComplete: true, diningEntries: entries,
            authRepository: FixtureBackendAuthRepository()
        ))
    }

    var body: some View {
        VStack(spacing: 0) {
            if ProcessInfo.processInfo.arguments.contains("--search-recommendation-controls") {
                VStack(spacing: 0) {
                    HStack {
                        Text("합성 기록 · 추천 경로 검증").font(TBFont.medium(11))
                        Spacer()
                        Button("근거 하나 삭제") {
                            if let entry = model.diningEntries.first { model.removeDiningEntry(id: entry.id) }
                        }
                        .font(TBFont.medium(12))
                        .accessibilityIdentifier("search-recommendation-delete-evidence")
                    }
                    .frame(height: 44)
                    Text("외부 검색 호출 \(transport.queries.count)")
                        .font(TBFont.regular(10))
                        .accessibilityIdentifier("search-recommendation-transport-count")
                }.padding(.horizontal, 20)
            }
            HomeSearchSheet(
                repository: transport,
                recommendationNow: { Self.referenceDate }
            )
        }
        .environmentObject(model)
    }
}

private final class HomeSearchRecommendationPreviewRepository: ObservableObject, HomeSearchRepository {
    @Published private(set) var queries: [String] = []
    func kakaoRestaurantResults(matching query: String) async throws -> [HomeSearchResultItem] {
        await MainActor.run { queries.append(query) }
        return []
    }
    func friendResults(matching query: String) async throws -> [HomeSearchResultItem] {
        await MainActor.run { queries.append(query) }
        return []
    }
}
#endif
