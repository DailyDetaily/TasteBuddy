import XCTest
@testable import TasteBuddy

final class GastronomyIntegrationTests: XCTestCase {
    @MainActor private func waitForArchive(_ model: AppModel) async throws {
        for _ in 0..<600 {
            if !model.sensoryAnalysisIsUpdating, model.homeArchivePresentation != nil { return }
            try await Task.sleep(for: .milliseconds(50))
        }
        XCTFail("The live AppModel did not publish a current archive")
    }
    @MainActor func testLiveSourceCorrectionAndDeletionRefreshTheSharedReadModel() async throws {
        let now = Date()
        let entry = DiningEntry(restaurant: "검증 식당", restaurantID: "qa-restaurant", menu: "검증 메뉴", menuItemID: "qa-menu",
                                observedAt: now, savedAt: now, rating: 0, note: "검증 원문", sensorySelections: [],
                                mealTime: .init(source: .confirmed, start: now, confirmedAt: now), foodSource: .init(kind: "restaurant"))
        let model = AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: [entry],
                                     authRepository: FixtureBackendAuthRepository(), now: { now })
        try await waitForArchive(model)
        XCTAssertEqual(model.homeArchivePresentation?.gastronomyState.records.count, 1)
        let beforeGeneration = model.memoryGeneration
        var edited = try XCTUnwrap(model.diningEntry(id: entry.id))
        let expected = edited
        edited.foodSource = .init(kind: "homeCooked", homeCookingID: "confirmed-home-recipe")
        XCTAssertTrue(model.updateDiningEntry(edited, expected: expected))
        XCTAssertNotEqual(model.memoryGeneration, beforeGeneration)
        XCTAssertNil(model.homeArchivePresentation, "Old derived values must be withdrawn while their originals change")
        try await waitForArchive(model)
        let current = try XCTUnwrap(model.homeArchivePresentation?.gastronomyState)
        XCTAssertEqual(current.records.first?.source, .homeCooked)
        XCTAssertNil(current.records.first?.restaurant)
        XCTAssertEqual(model.diningEntry(id: entry.id)?.foodSource?.homeCookingID, "confirmed-home-recipe")
        XCTAssertTrue(model.deleteDiningEntry(id: entry.id))
        try await waitForArchive(model)
        XCTAssertTrue(try XCTUnwrap(model.homeArchivePresentation?.gastronomyState.records).isEmpty)
    }
    @MainActor func testCategoryReadRequiresCurrentAccountGenerationAndSourceRevision() async throws {
        let now = Date(), meal = UUID()
        let entry = DiningEntry(mealID: meal, restaurant: "검증 식당", restaurantID: "qa", menu: "검증 음식", rating: 0, note: "",
                                mealTime: .init(source: .confirmed, start: now, confirmedAt: now))
        let model = AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: [entry],
                                     authRepository: FixtureBackendAuthRepository(), now: { now })
        try await waitForArchive(model)
        var candidate = HomeDiscoveryCard(id: "candidate", revisionKey: "revision", kind: .sensoryCooccurrence, subjectID: "sense-pair",
                                          title: "합성 발견", detail: "합성 근거", explanation: "", entryIDs: [entry.id], evidenceIDs: [],
                                          sourceRevisions: [entry.id: 0], photoFilename: nil, sortDate: now, meaningKey: "meaning",
                                          accountGeneration: UUID())
        model.markGastronomyDiscoveryRead(candidate)
        XCTAssertNil(model.homeDiscoveryHiddenUntil["read:meaning"])
        candidate.accountGeneration = model.memoryAccountGeneration
        model.markGastronomyDiscoveryRead(candidate)
        XCTAssertNotNil(model.homeDiscoveryHiddenUntil["read:meaning"])
        model.suppressGastronomyDiscovery(candidate)
        XCTAssertEqual(model.homeDiscoveryHiddenUntil["snooze:candidate"], now.addingTimeInterval(7 * 86400))
    }
}
