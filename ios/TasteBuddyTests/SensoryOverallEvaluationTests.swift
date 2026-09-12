import XCTest
@testable import TasteBuddy

/// 전체 평가 생산 구현을 읽기 전에 동결한 OE-01...08 개발 검사.
/// overall-evaluation-review/1: 03078481ee94bce496d0e9c9d42861420b94c4511d238b0ab4d3453456e80c67
final class SensoryOverallEvaluationTests: XCTestCase {
    private let sour = DiningSensorySelection(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .disliked)
    private func meal(_ overall: DiningOverallEvaluation?, selections: [DiningSensorySelection] = [], id: UUID = UUID()) -> DiningEntry {
        .init(id: id, restaurant: "기록한 식당", menu: "기록한 음식", date: Date(timeIntervalSince1970: 1_700_000_000), rating: 5, note: "", sensorySelections: selections, overallEvaluation: overall)
    }
    private func analyze(_ entries: [DiningEntry]) throws -> SensoryAnalysisSnapshot {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
        let result = try SensoryAnalysisEngine.analyze(entries: entries, contract: contract)
        XCTAssertEqual(result.actualApiCalls, 0)
        return result
    }
    func testOE01DifferentOverallEvaluationCannotAmplifyIdenticalSourDislike() throws {
        let id = UUID()
        let first = try analyze([meal(.init(response: .liked), selections: [sour], id: id)])
        let second = try analyze([meal(.init(response: .veryDisliked), selections: [sour], id: id)])
        XCTAssertEqual(first.observations.filter { $0.kind != "overall_liking" }, second.observations.filter { $0.kind != "overall_liking" })
        XCTAssertEqual(first.observations.first { $0.kind == "overall_liking" }?.value, .text("positive"))
        XCTAssertEqual(second.observations.first { $0.kind == "overall_liking" }?.value, .text("very_negative"))
        XCTAssertEqual(first.insights.filter { $0.attribute == "taste.sour" }, second.insights.filter { $0.attribute == "taste.sour" })
        XCTAssertEqual(first.mainWing, second.mainWing)
        XCTAssertEqual(first.sourceExperienceCount, 1)
        XCTAssertEqual(second.sourceExperienceCount, 1)
    }
    func testOE02FiveOverallValuesRemainDistinctAndCannotCreateAttributePreferenceOrMainWing() throws {
        let cases: [(DiningOverallEvaluation.Response, String)] = [(.veryLiked,"very_positive"),(.liked,"positive"),(.neutral,"neutral"),(.disliked,"negative"),(.veryDisliked,"very_negative")]
        for (response, expected) in cases {
            let result = try analyze([meal(.init(response: response))])
            let atom = try XCTUnwrap(result.observations.first)
            XCTAssertEqual(result.observations.count, 1)
            XCTAssertEqual(atom.kind, "overall_liking")
            XCTAssertEqual(atom.value, .text(expected))
            XCTAssertEqual(atom.scale, "overall-five-category-v1")
            XCTAssertNil(atom.attribute)
            XCTAssertNil(result.mainWing.main)
            XCTAssertNil(result.mainWing.wing)
            XCTAssertTrue(result.mainWing.candidates.allSatisfy { $0.supportExperienceCount == 0 })
        }
    }
    func testOE03MissingAndExplicitNeutralStayDifferent() throws {
        XCTAssertTrue(try analyze([meal(nil)]).observations.isEmpty)
        let explicit = try analyze([meal(.init(response: .neutral))])
        XCTAssertEqual(explicit.observations.first?.value, .text("neutral"))
        XCTAssertEqual(explicit.sourceExperienceCount, 1)
    }
    func testOE04LegacyRatingDoesNotBecomeOverallEvidence() throws {
        let legacy = DiningEntry(restaurant: "기록한 식당", menu: "기록한 음식", rating: 5, note: "")
        XCTAssertNil(legacy.overallEvaluation)
        XCTAssertFalse(try analyze([legacy]).observations.contains { $0.kind == "overall_liking" })
    }
    func testOE05CorrectionReplacesOnlyOverallEvaluationWithoutIncreasingMealEvidence() throws {
        let id = UUID()
        let before = try analyze([meal(.init(response: .liked), selections: [sour], id: id)])
        let after = try analyze([meal(.init(response: .veryDisliked), selections: [sour], id: id)])
        XCTAssertEqual(after.observations.filter { $0.kind == "overall_liking" }.count, 1)
        XCTAssertEqual(before.observations.filter { $0.selectionEvidence?.type != "overallEvaluation" }, after.observations.filter { $0.selectionEvidence?.type != "overallEvaluation" })
        XCTAssertEqual(after.sourceExperienceCount, 1)
    }
    func testOE06ClearingOnlyOverallKeepsSensoryEvaluation() throws {
        let id = UUID()
        let before = try analyze([meal(.init(response: .liked), selections: [sour], id: id)])
        let cleared = try analyze([meal(nil, selections: [sour], id: id)])
        XCTAssertEqual(before.observations.filter { $0.kind != "overall_liking" }, cleared.observations)
        XCTAssertTrue(cleared.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sour" && $0.value == .text("negative") })
    }
    func testOE07QuestionAndResponseMetadataAndActualResponseSpanSurviveCoding() throws {
        let evaluation = DiningOverallEvaluation(response: .veryDisliked)
        let original = meal(evaluation, selections: [sour])
        let restored = try JSONDecoder().decode(DiningEntry.self, from: JSONEncoder().encode(original))
        XCTAssertEqual(original, restored)
        let result = try analyze([restored])
        let atom = try XCTUnwrap(result.observations.first { $0.kind == "overall_liking" })
        let evidence = try XCTUnwrap(atom.selectionEvidence)
        XCTAssertEqual(evidence.selectionID, "overall_liking")
        XCTAssertEqual(evidence.type, "overallEvaluation")
        XCTAssertEqual(evidence.catalogVersion, "dining-overall-liking/1")
        XCTAssertEqual(evidence.labelSnapshot, "이 음식은 전체적으로 어땠나요?")
        XCTAssertEqual(evidence.labelValue, "많이 아쉬웠어요")
        XCTAssertEqual(evidence.responseValue, "veryDisliked")
        XCTAssertEqual(evidence.facet, "liking")
        XCTAssertEqual(atom.sourceField, "overallEvaluation:liking")
        XCTAssertEqual(atom.phrase, "많이 아쉬웠어요")
        XCTAssertEqual(atom.sourceSpans, [.init(start: 0, end: "많이 아쉬웠어요".utf16.count, quote: "많이 아쉬웠어요")])
        XCTAssertEqual(atom.target, "whole_dish")
        XCTAssertEqual(atom.phase, "unspecified")
    }
    func testOE08UnknownVersionAndMismatchedResponseRemainRawAndUnresolved() throws {
        for evaluation in [DiningOverallEvaluation(response: .liked, questionVersion: "future/9"), DiningOverallEvaluation(response: .liked, responseLabelSnapshot: "많이 아쉬웠어요")] {
            let original = meal(evaluation)
            let restored = try JSONDecoder().decode(DiningEntry.self, from: JSONEncoder().encode(original))
            XCTAssertEqual(restored.overallEvaluation, evaluation)
            let result = try analyze([restored])
            XCTAssertTrue(result.observations.isEmpty)
            XCTAssertFalse(result.unresolved.isEmpty)
            XCTAssertEqual(result.unresolved.first?.selectionEvidence?.labelValue, evaluation.responseLabelSnapshot)
        }
    }

    @MainActor
    func testOverallAndSensoryPersistOnReopenAndOverallCorrectionLeavesSensoryUnchanged() async throws {
        let suite = "tastebuddy.overall.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let id = UUID()
        let savedAt = Date(timeIntervalSince1970: 1_800_000_000)
        let updatedAt = savedAt.addingTimeInterval(60)
        var clock = savedAt
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository(), now: { clock })
        let original = meal(.init(response: .liked), selections: [sour], id: id)
        model.addDiningEntry(original)
        try await waitForAnalysis(model)
        let savedOriginal = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(savedOriginal.savedAt, savedAt)
        XCTAssertNil(savedOriginal.updatedAt)
        try assertDiningSourceUnchangedByStorage(savedOriginal, original: original)
        let beforeSensory = model.sensoryAnalysis.observations.filter { $0.kind != "overall_liking" }
        let corrected = meal(.init(response: .veryDisliked), selections: [sour], id: id)
        clock = updatedAt
        model.updateDiningEntry(corrected)
        try await waitForAnalysis(model)
        let expectedSensory = beforeSensory.map { observation in
            var revised = observation
            revised.knownAt = updatedAt
            return revised
        }
        XCTAssertEqual(model.sensoryAnalysis.observations.filter { $0.kind != "overall_liking" }, expectedSensory)
        let savedCorrected = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(savedCorrected.savedAt, savedAt)
        XCTAssertEqual(savedCorrected.updatedAt, updatedAt)
        try assertDiningSourceUnchangedByStorage(savedCorrected, original: corrected)
        XCTAssertEqual(model.sensoryAnalysis.sourceExperienceCount, 1)
        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForAnalysis(reopened)
        XCTAssertEqual(reopened.diningEntries, [savedCorrected])
        XCTAssertEqual(reopened.sensoryAnalysis, model.sensoryAnalysis)
        XCTAssertEqual(reopened.sensoryAnalysis.observations.first { $0.kind == "overall_liking" }?.value, .text("very_negative"))
    }

    @MainActor
    func testOverallClearSurvivesReopenAndDoesNotEraseSensorySelections() async throws {
        let suite = "tastebuddy.overall.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let id = UUID()
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        model.addDiningEntry(meal(.init(response: .neutral), selections: [sour], id: id))
        try await waitForAnalysis(model)
        model.updateDiningEntry(meal(nil, selections: [sour], id: id))
        try await waitForAnalysis(model)
        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForAnalysis(reopened)
        XCTAssertNil(reopened.diningEntries.first?.overallEvaluation)
        XCTAssertEqual(reopened.diningEntries.first?.sensorySelections, [sour])
        XCTAssertFalse(reopened.sensoryAnalysis.observations.contains { $0.kind == "overall_liking" })
        XCTAssertTrue(reopened.sensoryAnalysis.observations.contains { $0.kind == "attribute_liking" && $0.value == .text("negative") })
    }

    @MainActor
    private func waitForAnalysis(_ model: AppModel) async throws {
        let clock = ContinuousClock()
        let deadline = clock.now.advanced(by: .seconds(10))
        while model.sensoryAnalysisIsUpdating && clock.now < deadline { try await Task.sleep(for: .milliseconds(10)) }
        XCTAssertFalse(model.sensoryAnalysisIsUpdating)
        XCTAssertNil(model.sensoryAnalysisError)
        XCTAssertEqual(model.sensoryAnalysis.actualApiCalls, 0)
    }
}
