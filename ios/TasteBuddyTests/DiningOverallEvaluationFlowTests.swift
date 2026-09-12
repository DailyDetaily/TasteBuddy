import XCTest
@testable import TasteBuddy

final class DiningOverallEvaluationFlowTests: XCTestCase {
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
