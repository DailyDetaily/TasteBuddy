import XCTest
@testable import TasteBuddy

final class AppModelStructuredSelectionPersistenceTests: XCTestCase {
    @MainActor
    func testEmptyMemoPreservesAllSelectionFieldsAndRebuildsInsightsOnReopen() async throws {
        let suite = "tastebuddy.structured-selection.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let selections: [DiningSensorySelection] = [
            .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .liked),
            .init(id: "aroma-roasted", type: .detailTag, labelSnapshot: "구운 향", liking: .liked, intensity: .strong, preferenceFit: .justRight, target: .sauce, phase: .afterSwallow, relatedBubbleID: "sour-fresh"),
        ]
        let meal = DiningEntry(restaurant: "기록한 식당", menu: "기록한 음식", date: Date(timeIntervalSince1970: 1_700_000_000), rating: 3, note: "", tasteExperienceIDs: ["sour-fresh"], detailTagIDs: ["aroma-roasted"], sensorySelections: selections)
        let savedAt = Date(timeIntervalSince1970: 1_800_000_000)
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository(), now: { savedAt })
        model.addDiningEntry(meal)
        try await waitForAnalysis(model)
        XCTAssertFalse(model.sensoryAnalysis.insights.isEmpty)
        XCTAssertEqual(model.diningEntries.first?.note, "")
        XCTAssertEqual(model.diningEntries.first?.sensorySelections, selections)
        XCTAssertTrue(model.sensoryAnalysis.observations.allSatisfy { $0.sourceField.hasPrefix("sensorySelections:") })
        XCTAssertTrue(model.sensoryAnalysis.observations.contains { $0.sourceField == "sensorySelections:detailTag:aroma-roasted:liking" })
        let data = try XCTUnwrap(defaults.data(forKey: "tastebuddy.ios.dining-entries.v1"))
        let diskMeals = try JSONDecoder().decode([DiningEntry].self, from: data)
        let savedMeal = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(savedMeal.savedAt, savedAt)
        XCTAssertNil(savedMeal.updatedAt)
        try assertDiningSourceUnchangedByStorage(savedMeal, original: meal)
        XCTAssertEqual(diskMeals, [savedMeal])
        XCTAssertEqual(diskMeals.first?.sensorySelections?.last?.relatedBubbleID, "sour-fresh")
        XCTAssertEqual(diskMeals.first?.sensorySelections?.last?.catalogVersion, DiningSensorySelection.catalogVersion)

        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForAnalysis(reopened)
        XCTAssertEqual(reopened.diningEntries, [savedMeal])
        XCTAssertEqual(reopened.sensoryAnalysis, model.sensoryAnalysis)
        XCTAssertEqual(reopened.sensoryAnalysis.actualApiCalls, 0)
        XCTAssertEqual(defaults.data(forKey: "tastebuddy.ios.dining-entries.v1"), data)
    }

    @MainActor
    func testCorrectedLikingAndExplicitClearSurviveReopenWithoutLegacyResurrection() async throws {
        let suite = "tastebuddy.structured-selection.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let id = UUID()
        func meal(_ selections: [DiningSensorySelection]) -> DiningEntry {
            DiningEntry(id: id, restaurant: "기록한 식당", menu: "기록한 음식", date: Date(timeIntervalSince1970: 1_700_000_000), rating: 5, note: "", tasteExperienceIDs: ["sour-fresh"], detailTagIDs: ["aroma-roasted"], sensorySelections: selections)
        }
        let liked = DiningSensorySelection(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .liked)
        let disliked = DiningSensorySelection(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .disliked)
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        model.addDiningEntry(meal([liked]))
        try await waitForAnalysis(model)
        XCTAssertTrue(model.sensoryAnalysis.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sour" && $0.value == .text("positive") })
        model.updateDiningEntry(meal([disliked]))
        XCTAssertTrue(model.sensoryAnalysis.observations.isEmpty)
        try await waitForAnalysis(model)
        XCTAssertTrue(model.sensoryAnalysis.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sour" && $0.value == .text("negative") })
        XCTAssertFalse(model.sensoryAnalysis.observations.contains { $0.kind == "attribute_liking" && $0.value == .text("positive") })
        XCTAssertEqual(model.sensoryAnalysis.sourceExperienceCount, 1)

        model.updateDiningEntry(meal([]))
        try await waitForAnalysis(model)
        XCTAssertEqual(model.diningEntries.first?.sensorySelections, [])
        XCTAssertTrue(model.sensoryAnalysis.observations.isEmpty)
        XCTAssertTrue(model.sensoryAnalysis.insights.isEmpty)
        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForAnalysis(reopened)
        XCTAssertEqual(reopened.diningEntries.first?.sensorySelections, [])
        XCTAssertEqual(reopened.diningEntries.first?.tasteExperienceIDs, ["sour-fresh"])
        XCTAssertTrue(reopened.sensoryAnalysis.observations.isEmpty)
        XCTAssertTrue(reopened.sensoryAnalysis.insights.isEmpty)
        XCTAssertEqual(reopened.sensoryAnalysis.actualApiCalls, 0)
    }

    @MainActor
    private func waitForAnalysis(_ model: AppModel) async throws {
        let clock = ContinuousClock()
        let deadline = clock.now.advanced(by: .seconds(10))
        while model.sensoryAnalysisIsUpdating && clock.now < deadline {
            try await Task.sleep(for: .milliseconds(10))
        }
        XCTAssertFalse(model.sensoryAnalysisIsUpdating, "실제 선택 기록의 분석이 제한 시간 안에 끝나야 한다")
        XCTAssertNil(model.sensoryAnalysisError)
    }
}
