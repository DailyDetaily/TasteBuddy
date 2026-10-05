import XCTest
@testable import TasteBuddy

final class PersonalTasteModelTests: XCTestCase {
    func testRepeatedDirectionReportsSupportingMealsInsteadOfIncludingNeutralMeals() throws {
        for direction in ["positive", "negative"] {
            let records = (0..<4).map { i in
                PersonalTasteModelRecord(observationId: "o\(i)", userId: "audit", experienceId: "e\(i)", attribute: "taste.sour", value: .text(i < 3 ? direction : "neutral"))
            }
            let candidate = try XCTUnwrap(PersonalTasteModelBuilder.buildRecords(records: records, userID: "audit").candidates.first { $0.conditions.isEmpty })
            XCTAssertEqual(candidate.direction, direction)
            XCTAssertEqual(candidate.supportMealIDs.count, 3)
            XCTAssertEqual(candidate.distribution.mealCount, 4)
            XCTAssertTrue(candidate.body.contains("4번의 식사 중 3번에서"))
        }
    }

    func testV2HypotheticalAnswerMatchesActualConditionChange() throws {
        var records: [PersonalTasteModelRecord] = []
        for i in 0..<3 {
            let evidence = SensorySelectionEvidence(selectionID: "v2.bubble.sour.basic", type: "bubble", catalogVersion: "dining-sensory-selection/2", labelSnapshot: "부드러운 산미", facet: "liking", labelValue: "좋았어요", responseValue: "liked", relatedBubbleID: nil, relatedBubbleLabel: nil, resolution: "resolved", selectionInstanceID: "instance-\(i)", definitionVersion: "audit-definition", bindingMode: "independent")
            let rating = PersonalTasteModelRecord(observationId: "rating-\(i)", userId: "audit", experienceId: "e\(i)", attribute: "taste.sour", value: .text("positive"), target: "whole_dish", phase: "during_meal", selectionEvidence: evidence)
            records.append(rating)
            if i < 2 {
                var intensity = rating; intensity.observationId = "intensity-\(i)"; intensity.kind = "sensory_intensity"; intensity.scale = "expression-strength-v1"; intensity.value = .text("weak")
                records.append(intensity)
            }
        }
        let before = PersonalTasteModelBuilder.buildRecords(records: records, userID: "audit", individualQuestions: true, nativeAnswerOptions: { _, facet in facet == "intensity" ? ["weak", "medium", "strong"] : [] })
        let question = try XCTUnwrap(before.availableSelections.first { $0.facet == "intensity" })
        XCTAssertGreaterThan(question.impact?.changedInterpretationCount ?? 0, 0)
        var answer = try XCTUnwrap(records.first { $0.observationId == "rating-2" })
        answer.observationId = "actual-answer"; answer.kind = "sensory_intensity"; answer.scale = "expression-strength-v1"; answer.value = .text("weak")
        let after = PersonalTasteModelBuilder.buildRecords(records: records + [answer], userID: "audit", assessQuestions: false)
        let condition = [PersonalTasteCondition(dimension: "intensity", value: "weak")]
        XCTAssertNil(before.candidates.first { $0.conditions == condition }?.direction)
        XCTAssertEqual(after.candidates.first { $0.conditions == condition }?.direction, "positive")
        XCTAssertEqual(records.count, 5, "가상 응답은 원기록에 추가하지 않는다")
    }
    func testSharedConditionalModelAndPredictionFixtures() throws {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("TasteBuddy/Resources/TBA/personal-taste-model-contract.json")
        let contract = try JSONDecoder().decode(PersonalTasteModelContract.self, from: Data(contentsOf: url))
        XCTAssertGreaterThanOrEqual(contract.fixtures.count, 16)
        for fixture in contract.fixtures {
            let model = PersonalTasteModelBuilder.buildRecords(records: fixture.records, userID: fixture.userID, asOf: PersonalTasteModelBuilder.date(fixture.asOf))
            // 화면용 대기열을 제외한 공유 저장/전달 계약을 비교한다.
            XCTAssertEqual(PersonalTasteModelBuilder.canonical(model), PersonalTasteModelBuilder.canonical(fixture.expected), fixture.id)
            for prediction in fixture.predictions { XCTAssertEqual(PersonalTasteModelBuilder.predict(model, query: prediction.query.query), prediction.expected, fixture.id) }
        }
    }
    func testActualNativeEntryMetadataAndHistoricalCutoff() throws {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
        let observed = Date(timeIntervalSince1970: 1_700_000_000), known = observed.addingTimeInterval(100)
        let meal = UUID()
        let entry = DiningEntry(mealID: meal, restaurant: "식당", restaurantID: "restaurant-id", menu: "음식", menuItemID: "menu-id", observedAt: observed, savedAt: known, rating: 3, note: "", sensorySelections: [.init(id:"sour-fresh",type:.bubble,labelSnapshot:"산뜻한 산미",liking:.liked,intensity:.strong,target:.sauce,phase:.duringMeal)], dishKindIDs:["seafood"])
        let current = try SensoryAnalysisEngine.analyze(entries:[entry],contract:contract,userID:"owner")
        XCTAssertEqual(current.personalModel?.userID,"owner")
        XCTAssertEqual(current.personalModel?.units.first?.mealID,meal.uuidString.lowercased())
        XCTAssertEqual(current.personalModel?.units.first?.intensity,"strong")
        XCTAssertTrue(current.personalModel?.units.first?.evidence.contains(where: { $0.conditionSources.contains(where: { $0.dimension == "target" && $0.labelSnapshot == "소스" }) }) == true)
        XCTAssertEqual(current.observations.first?.restaurantID,"restaurant-id")
        XCTAssertEqual(current.observations.first?.menuItemID,"menu-id")
        let prior = try SensoryAnalysisEngine.analyze(entries:[entry],contract:contract,userID:"owner",asOf:observed.addingTimeInterval(50))
        XCTAssertEqual(prior.completedExperienceCount,0)
        XCTAssertTrue(prior.observations.isEmpty)
        XCTAssertTrue(prior.personalModel?.units.isEmpty == true)
    }
}
