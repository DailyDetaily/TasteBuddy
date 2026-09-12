import XCTest
@testable import TasteBuddy

final class DiningSensorySelectionEditingTests: XCTestCase {
    func testNewSelectionKeepsEveryOptionalEvaluationUnanswered() {
        let selection = DiningSensorySelection(
            id: "umami-deep",
            type: .bubble,
            labelSnapshot: "깊은 감칠맛"
        )

        XCTAssertNil(selection.liking)
        XCTAssertNil(selection.intensity)
        XCTAssertNil(selection.preferenceFit)
        XCTAssertEqual(selection.target, .unspecified)
        XCTAssertEqual(selection.phase, .unspecified)
    }

    func testTappingTheSameOptionalChoiceAgainReturnsToUnanswered() {
        let selected: DiningSensorySelection.Liking? =
            DiningSensorySelectionEditing.toggled(nil, candidate: .liked)
        let cleared = DiningSensorySelectionEditing.toggled(selected, candidate: .liked)

        XCTAssertEqual(selected, .liked)
        XCTAssertNil(cleared)
    }

    func testEditingASelectionReplacesItsRowWithoutChangingStableIdentity() {
        let original = DiningSensorySelection(
            id: "flow-clean-finish",
            type: .detailTag,
            labelSnapshot: "깔끔한 끝맛",
            relatedBubbleID: "umami-deep"
        )
        var edited = original
        edited.liking = .liked
        edited.phase = .afterSwallow

        let result = DiningSensorySelectionEditing.upsert(edited, in: [original])

        XCTAssertEqual(result.count, 1)
        XCTAssertEqual(result[0].id, original.id)
        XCTAssertEqual(result[0].catalogVersion, original.catalogVersion)
        XCTAssertEqual(result[0].labelSnapshot, original.labelSnapshot)
        XCTAssertEqual(result[0].relatedBubbleID, "umami-deep")
        XCTAssertEqual(result[0].liking, .liked)
        XCTAssertEqual(result[0].phase, .afterSwallow)
    }

    func testDetailTagDoesNotInheritItsRelatedBubbleLiking() {
        let bubble = DiningSensorySelection(
            id: "umami-deep",
            type: .bubble,
            labelSnapshot: "깊은 감칠맛",
            liking: .liked
        )
        let detail = DiningSensorySelection(
            id: "aroma-roasted",
            type: .detailTag,
            labelSnapshot: "구운 향",
            relatedBubbleID: bubble.id
        )

        XCTAssertEqual(bubble.liking, .liked)
        XCTAssertNil(detail.liking)
    }
}
