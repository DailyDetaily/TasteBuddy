import XCTest
@testable import TasteBuddy

final class DiningOverallEvaluationFlowTests: XCTestCase {
    func testStarTapsPrioritizeLoweringThenToggleTheLastHalfStar() {
        var value = 4.0
        for (star, expected) in [(3, 3.0), (3, 2.5), (3, 3.0), (5, 4.5), (5, 5.0), (5, 4.5)] {
            value = StarRatingInteraction.value(afterTapping: star, current: value)
            XCTAssertEqual(value, expected)
        }
        XCTAssertEqual(StarRatingInteraction.value(afterTapping: 4, current: 4), 3.5)
        XCTAssertEqual(StarRatingInteraction.value(afterTapping: 1, current: 0), 0.5)
        XCTAssertEqual(StarRatingInteraction.value(afterTapping: 1, current: 0.5), 1)
    }

    func testHalfStarScoresRoundTripExactlyWithoutInventingFiveCategoryWords() throws {
        for score in stride(from: 0.5, through: 5.0, by: 0.5) {
            let evaluation = try XCTUnwrap(DiningOverallEvaluation(starRating: score))
            let decoded = try JSONDecoder().decode(DiningOverallEvaluation.self, from: JSONEncoder().encode(evaluation))
            XCTAssertEqual(decoded, evaluation)
            XCTAssertEqual(decoded.starRating, score)
            XCTAssertTrue(DiningSensoryRecommendationPolicy.isSupported(decoded))
            let atom = try XCTUnwrap(decoded.parse().observations.first)
            XCTAssertEqual(atom.scale, DiningOverallEvaluation.starScale)
            XCTAssertEqual(atom.value, .text(DiningOverallEvaluation.starText(score)))
            XCTAssertEqual(atom.phrase, "\(DiningOverallEvaluation.starText(score))점")
        }
        for invalid in [0, -1, 5.5, 3.25, Double.nan, Double.infinity] {
            XCTAssertNil(DiningOverallEvaluation(starRating: invalid))
        }
        var malformed = try XCTUnwrap(DiningOverallEvaluation(starRating: 3.5))
        malformed.responseValue = .init(rawValue: "3.25")
        malformed.responseLabelSnapshot = "3.25점"
        XCTAssertNil(malformed.starRating)
        XCTAssertEqual(malformed.parse().unresolved.count, 1)
        XCTAssertEqual(DiningOverallEvaluation(response: .liked).starRating, 4)
    }

    @MainActor
    func testHalfStarEditAndClearPersistWithoutChangingTheFoodOrSensoryRecord() throws {
        let suite = "tastebuddy.star-rating.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let original = DiningEntry(restaurant: "저저", menu: "버터 파스타", rating: 0, note: "그대로 보존할 미식 노트",
                                   sensorySelections: [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .disliked)],
                                   overallEvaluation: .init(response: .liked))
        XCTAssertTrue(model.insertDiningEntry(original))
        let saved = try XCTUnwrap(model.diningEntry(id: original.id))
        var updated = saved
        updated.overallEvaluation = try XCTUnwrap(DiningOverallEvaluation(starRating: 3.5))
        XCTAssertTrue(model.updateDiningEntry(updated, expected: saved))
        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let restored = try XCTUnwrap(reopened.diningEntry(id: original.id))
        XCTAssertEqual(restored.overallEvaluation?.starRating, 3.5)
        XCTAssertEqual(restored.memoryRevisionNumber, 1)
        XCTAssertEqual(restored.memoryCorrections?.last?.fields, ["overallEvaluation"])
        XCTAssertEqual(restored.note, original.note)
        XCTAssertEqual(restored.sensorySelections, original.sensorySelections)
        XCTAssertEqual(restored.rating, original.rating)
        XCTAssertFalse(model.updateDiningEntry(saved, expected: saved), "A stale edit must not overwrite the saved half star.")
        var cleared = restored
        cleared.overallEvaluation = nil
        XCTAssertTrue(reopened.updateDiningEntry(cleared, expected: restored))
        let reopenedAgain = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let afterClear = try XCTUnwrap(reopenedAgain.diningEntry(id: original.id))
        XCTAssertNil(afterClear.overallEvaluation)
        XCTAssertEqual(afterClear.sensorySelections, original.sensorySelections)
        XCTAssertEqual(afterClear.note, original.note)
        XCTAssertEqual(afterClear.memoryRevisionNumber, 2)
    }

    func testOverallEvaluationOffersFiveResponsesInDisplayOrder() {
        let responses = DiningOverallEvaluation.Response.allCases
        XCTAssertEqual(
            responses.map(\.label),
            ["정말 좋았어요", "좋았어요", "보통이었어요", "아쉬웠어요", "많이 아쉬웠어요"]
        )
    }

    func testPositiveOverallEvaluationOnlyReordersExistingExplicitlyPositiveDetailLabels() throws {
        let base = ["aroma-fermented", "balance-well-balanced", "flow-long-lasting"]
        let ordered = DiningSensoryRecommendationPolicy.orderedDetailTagIDs(
            baseIDs: base,
            overallEvaluation: .init(response: .liked)
        )

        XCTAssertLessThan(
            try XCTUnwrap(ordered.firstIndex(of: "balance-well-balanced")),
            try XCTUnwrap(ordered.firstIndex(of: "aroma-fermented"))
        )
        XCTAssertEqual(ordered.count, base.count)
        XCTAssertEqual(Set(ordered), Set(base))
        XCTAssertEqual(ordered.filter { $0 == "aroma-fermented" }.count, 1)
    }

    func testNegativeOverallEvaluationDoesNotAssignMeaningToNeutralSensoryTags() {
        let base = ["aroma-fermented", "flow-long-lasting", "texture-dry"]
        let ordered = DiningSensoryRecommendationPolicy.orderedDetailTagIDs(
            baseIDs: base,
            overallEvaluation: .init(response: .veryDisliked)
        )
        XCTAssertEqual(ordered, base)
    }

    func testPositiveRecommendationOrderIsVisibleWhileUnrecommendedTagsStayStable() {
        let tags = [
            DiningFeedbackTagContract(id: "aroma-fermented", label: "발효 향"),
            DiningFeedbackTagContract(id: "balance-well-balanced", label: "균형이 좋음"),
            DiningFeedbackTagContract(id: "texture-dry", label: "건조함"),
        ]
        let recommended = DiningSensoryRecommendationPolicy.orderedDetailTagIDs(
            baseIDs: ["aroma-fermented", "balance-well-balanced"],
            overallEvaluation: .init(response: .veryLiked)
        )
        let visible = DiningSensoryRecommendationPolicy.orderedTags(
            tags,
            recommendedIDs: recommended
        )

        XCTAssertEqual(visible.map(\.id), [
            "balance-well-balanced",
            "aroma-fermented",
            "texture-dry",
        ])
    }

    func testDishKindFocusPreservesExistingBubbleBeforeRecommendation() {
        let experiences = [
            experience(id: "sweet-first", axis: .sweet),
            experience(id: "umami-first", axis: .umami),
        ]
        XCTAssertEqual(
            DiningSensoryRecommendationPolicy.firstBubbleID(
                experiences: experiences,
                dishKindIDs: ["broth"],
                preserving: []
            ),
            "umami-first"
        )
        XCTAssertEqual(
            DiningSensoryRecommendationPolicy.firstBubbleID(
                experiences: experiences,
                dishKindIDs: ["broth"],
                preserving: ["sweet-first"]
            ),
            "sweet-first"
        )
    }

    func testUnsupportedRestoredEvaluationCannotAdvanceAsACurrentChoice() {
        let current = DiningOverallEvaluation(response: .liked)
        let unknown = DiningOverallEvaluation(
            response: .init(rawValue: "future-response"),
            questionVersion: "future-version",
            responseLabelSnapshot: "새 응답"
        )
        XCTAssertTrue(DiningSensoryRecommendationPolicy.isSupported(current))
        XCTAssertFalse(DiningSensoryRecommendationPolicy.isSupported(unknown))

        var invalidScope = current
        invalidScope.target = "sauce"
        XCTAssertFalse(DiningSensoryRecommendationPolicy.isSupported(invalidScope))
    }

    private func experience(id: String, axis: TasteAxis) -> TasteExperience {
        TasteExperience(
            id: id,
            axis: axis,
            intensity: 2,
            key: id,
            label: id,
            description: id,
            angleOffset: 0,
            radiusOffset: nil
        )
    }
}
