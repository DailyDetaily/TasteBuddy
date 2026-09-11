import XCTest
@testable import TasteBuddy

final class TasteSurveyEvidenceTests: XCTestCase {
    private func result() throws -> TasteSurveyCompatibleResultContract {
        let catalog = try TasteSurveyCatalogLoader.load()
        let sweet = try XCTUnwrap(catalog.items.first { $0.tasteId == .sweet })
        let fat = try XCTUnwrap(catalog.items.first { $0.tasteId == .fat })
        return TasteSurveyScoringEngine.makeCompatibleResult(
            items: catalog.items,
            responses: [
                .init(itemId: sweet.id, selectedValue: 0, uncertain: false),
                .init(itemId: fat.id, selectedValue: nil, uncertain: true, uncertaintyReason: .cannotIsolateTaste)
            ],
            measuredAt: "2026-09-07T00:00:00.000Z",
            respondentContext: .init(birthDate: "1996-07-10", sexContext: "prefer_not_to_say", smokingStatus: "never"),
            instrument: catalog.instrument, scale: catalog.likertScale
        )
    }

    func testZeroMissingAndUncertaintyRemainDistinctAfterCodableRoundTrip() throws {
        let original = try result()
        let restored = try JSONDecoder().decode(TasteSurveyCompatibleResultContract.self, from: JSONEncoder().encode(original))
        XCTAssertEqual(original, restored)
        XCTAssertEqual(restored.snapshot.source, .recalledIntensity)
        XCTAssertEqual(restored.snapshot.results[.sweet], 0)
        XCTAssertNil(restored.snapshot.results[.salty])
        XCTAssertNil(restored.snapshot.results[.fat])
        let submission = try XCTUnwrap(restored.snapshot.surveySubmission)
        XCTAssertEqual(submission.answeredCount, 1)
        XCTAssertEqual(submission.instrument.version, "2.0.0")
        XCTAssertEqual(submission.responses.last?.uncertaintyReason, .cannotIsolateTaste)
        XCTAssertEqual(submission.respondentContext.birthDate, "1996-07-10")
        XCTAssertTrue(restored.starterGuidance.topAxes.isEmpty)
        let profile = TasteSurveyScoringEngine.makeProfile(from: restored)
        XCTAssertEqual(ISO8601DateFormatter().string(from: profile.createdAt), "2026-09-07T00:00:00Z")
        XCTAssertEqual(profile.scores["sweet"], 0)
        XCTAssertNil(profile.scores["salty"])
        XCTAssertNil(profile.scores["fat"])
    }

    @MainActor
    func testSavedProfileRestoresRawEvidenceWithoutCreatingDiningObservations() throws {
        let suite = "tastebuddy.tests.survey.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let profile = TasteSurveyScoringEngine.makeProfile(from: try result())
        let first = AppModel(defaults: defaults)
        first.saveProfile(profile)
        let restored = AppModel(defaults: defaults)
        XCTAssertEqual(restored.profile?.surveySubmission, profile.surveySubmission)
        XCTAssertTrue(restored.profileHistory.isEmpty)
        restored.saveProfile(.sample)
        let restoredHistory = AppModel(defaults: defaults)
        XCTAssertEqual(restoredHistory.profileHistory.first?.surveySubmission, profile.surveySubmission)
        XCTAssertTrue(restored.diningEntries.isEmpty)
        XCTAssertTrue(restored.sensoryAnalysis.observations.isEmpty)
    }

    func testOldProfileStillDecodesWithoutSurveyEvidence() throws {
        let profile = TasteProfile.sample
        let encoded = try JSONEncoder().encode(profile)
        var object = try XCTUnwrap(JSONSerialization.jsonObject(with: encoded) as? [String: Any])
        object.removeValue(forKey: "surveySubmission")
        let restored = try JSONDecoder().decode(TasteProfile.self, from: JSONSerialization.data(withJSONObject: object))
        XCTAssertNil(restored.surveySubmission)
        XCTAssertEqual(restored.scores, profile.scores)
    }
}
