import XCTest
@testable import TasteBuddy

final class AppModelAdvancedModelTests: XCTestCase {
    private func entry(id: UUID = UUID(), mealID: UUID? = nil, selections: [DiningSensorySelection] = [], legacyIDs: [String] = ["sour-fresh"], status: DiningEntryFeedbackStatus = .completed) -> DiningEntry {
        .init(id: id, mealID: mealID, restaurant: "기록한 식당", menu: "기록한 음식", date: Date(timeIntervalSince1970: 1_700_000_000), savedAt: Date(timeIntervalSince1970: 1_700_000_100), updatedAt: Date(timeIntervalSince1970: 1_700_000_100), rating: 5, note: "", tasteExperienceIDs: legacyIDs, detailTagIDs: selections.filter { $0.type == .detailTag }.map(\.id), sensorySelections: selections, feedbackStatus: status)
    }
    private var liked: DiningSensorySelection { .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .liked) }
    @MainActor
    private func waitForAnalysis(_ model: AppModel) async throws {
        let clock = ContinuousClock(), deadline = clock.now.advanced(by: .seconds(10))
        while model.sensoryAnalysisIsUpdating && clock.now < deadline { try await Task.sleep(for: .milliseconds(10)) }
        XCTAssertFalse(model.sensoryAnalysisIsUpdating)
        XCTAssertNil(model.sensoryAnalysisError)
        XCTAssertEqual(model.sensoryAnalysis.actualApiCalls, 0)
    }
    @MainActor
    func testAM18IncompleteEntriesCannotEnterAdvancedPreferenceModel() async throws {
        let suite = "tastebuddy.advanced.incomplete.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        for _ in 0..<4 { model.addDiningEntry(entry(selections: [liked], status: .captured)) }
        try await waitForAnalysis(model)
        XCTAssertEqual(model.diningEntries.count, 4)
        XCTAssertTrue(model.sensoryAnalysis.observations.isEmpty)
        let personal = try XCTUnwrap(model.sensoryAnalysis.personalModel)
        XCTAssertTrue(personal.candidates.isEmpty)
        XCTAssertNil(personal.nextSelection)
    }
    @MainActor
    func testAM22ExplicitEmptySelectionCannotReviveLegacyIDsAfterReopen() async throws {
        let suite = "tastebuddy.advanced.clear.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let id = UUID()
        model.addDiningEntry(entry(id: id, selections: [liked]))
        try await waitForAnalysis(model)
        XCTAssertFalse(try XCTUnwrap(model.sensoryAnalysis.personalModel).candidates.isEmpty)
        model.updateDiningEntry(entry(id: id, selections: []))
        try await waitForAnalysis(model)
        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForAnalysis(reopened)
        XCTAssertEqual(reopened.diningEntries.first?.sensorySelections, [])
        XCTAssertEqual(reopened.diningEntries.first?.tasteExperienceIDs, ["sour-fresh"])
        XCTAssertTrue(reopened.sensoryAnalysis.observations.isEmpty)
        let cleared = try XCTUnwrap(reopened.sensoryAnalysis.personalModel)
        XCTAssertTrue(cleared.candidates.isEmpty)
        XCTAssertNil(cleared.nextSelection)
    }
    @MainActor
    func testAM11And23SharedMealIsOneEvidenceUnitAndDeletionRetractsQuestionsAndCandidates() async throws {
        let suite = "tastebuddy.advanced.meal.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let roasted: [DiningSensorySelection] = [
            .init(id: "bitter-roasted", type: .bubble, labelSnapshot: "구운 향", liking: .liked),
            .init(id: "aroma-roasted", type: .detailTag, labelSnapshot: "구운 향", liking: .liked, relatedBubbleID: "bitter-roasted"),
        ]
        let mealID = UUID(), entries = (0..<4).map { _ in entry(mealID: mealID, selections: roasted, legacyIDs: ["bitter-roasted"]) }
        entries.forEach(model.addDiningEntry)
        try await waitForAnalysis(model)
        let personal = try XCTUnwrap(model.sensoryAnalysis.personalModel)
        XCTAssertFalse(personal.candidates.isEmpty)
        let roastedAtoms = model.sensoryAnalysis.observations.filter { $0.attribute == "aroma.roasted" && $0.kind == "attribute_liking" }
        XCTAssertEqual(Set(roastedAtoms.compactMap { $0.selectionEvidence?.selectionID }), ["bitter-roasted", "aroma-roasted"])
        XCTAssertTrue(roastedAtoms.allSatisfy { $0.selectionEvidence?.labelSnapshot == "구운 향" })
        XCTAssertTrue(roastedAtoms.filter { $0.selectionEvidence?.selectionID == "aroma-roasted" }.allSatisfy { $0.selectionEvidence?.relatedBubbleID == "bitter-roasted" })
        XCTAssertTrue(model.diningEntries.allSatisfy { $0.sensorySelections == roasted })
        XCTAssertTrue(personal.candidates.allSatisfy { $0.distribution.mealCount == 1 && $0.status != "repeated_direction" })
        for e in entries { model.removeDiningEntry(id: e.id) }
        try await waitForAnalysis(model)
        let deleted = try XCTUnwrap(model.sensoryAnalysis.personalModel)
        XCTAssertTrue(deleted.candidates.isEmpty)
        XCTAssertNil(deleted.nextSelection)
        XCTAssertTrue(deleted.units.isEmpty)
    }
    @MainActor
    func testAM27QuestionExposureDismissalAndResolutionPersistWithoutCreatingEvidence() async throws {
        let suite = "tastebuddy.advanced.question.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        model.addDiningEntry(entry(selections: [
            .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미"),
            .init(id: "sweet-soft", type: .bubble, labelSnapshot: "부드러운 단맛", liking: .liked),
        ]))
        try await waitForAnalysis(model)
        let personal = try XCTUnwrap(model.sensoryAnalysis.personalModel)
        let question = try XCTUnwrap(personal.nextSelection)
        let original = model.sensoryAnalysis
        XCTAssertFalse(question.createsEvidence)
        XCTAssertTrue(model.shouldPresentPersonalTasteQuestion(id: question.id, userID: personal.userID))
        model.recordPersonalTasteQuestionExposure(id: question.id, userID: personal.userID)
        let firstExposure = model.personalTasteQuestionProgressByUser[personal.userID]?[question.id]?.firstExposedAt
        model.recordPersonalTasteQuestionExposure(id: question.id, userID: personal.userID)
        XCTAssertEqual(model.personalTasteQuestionProgressByUser[personal.userID]?.count, 1)
        XCTAssertEqual(model.personalTasteQuestionProgressByUser[personal.userID]?[question.id]?.firstExposedAt, firstExposure)
        model.dismissPersonalTasteQuestion(id: question.id, userID: personal.userID)
        XCTAssertFalse(model.shouldPresentPersonalTasteQuestion(id: question.id, userID: personal.userID))
        XCTAssertTrue(model.shouldPresentPersonalTasteQuestion(id: question.id, userID: "another-user"))
        XCTAssertEqual(model.sensoryAnalysis.observations, original.observations)
        XCTAssertEqual(model.sensoryAnalysis.unresolved, original.unresolved)
        XCTAssertEqual(model.sensoryAnalysis.personalModel?.units, original.personalModel?.units)
        XCTAssertEqual(model.sensoryAnalysis.personalModel?.candidates, original.personalModel?.candidates)
        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForAnalysis(reopened)
        XCTAssertFalse(reopened.shouldPresentPersonalTasteQuestion(id: question.id, userID: personal.userID))
        let nextQuestion = try XCTUnwrap(reopened.sensoryAnalysis.personalModel?.nextSelection)
        XCTAssertNotEqual(nextQuestion.id, question.id)
        XCTAssertEqual(reopened.sensoryAnalysis.observations, original.observations)
        XCTAssertEqual(reopened.sensoryAnalysis.personalModel?.units, original.personalModel?.units)
        XCTAssertEqual(reopened.sensoryAnalysis.personalModel?.candidates, original.personalModel?.candidates)
        reopened.resolvePersonalTasteQuestion(id: question.id, userID: personal.userID)
        XCTAssertEqual(reopened.personalTasteQuestionProgressByUser[personal.userID]?[question.id]?.status, .resolved)
        XCTAssertFalse(reopened.shouldPresentPersonalTasteQuestion(id: question.id, userID: personal.userID))
        XCTAssertEqual(reopened.sensoryAnalysis.observations, original.observations)
    }
}
