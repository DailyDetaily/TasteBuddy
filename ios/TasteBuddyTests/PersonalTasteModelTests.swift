import XCTest
@testable import TasteBuddy

final class PersonalTasteModelTests: XCTestCase {
    // Synthetic policy regressions. These expectations are semantic constraints, not JS-generated expected models.
    func testPolicyRejectedOwnerDoesNotChangeTemporalDiagnostics() {
        let own = PersonalTasteModelRecord(observationId: "own", userId: "owner", experienceId: "own", attribute: "taste.sour", value: .text("positive"), knownAt: "2026-10-01T04:00:00.000Z")
        let foreign = PersonalTasteModelRecord(observationId: "foreign", userId: "other", experienceId: "foreign", attribute: "taste.sour", value: .text("positive"))
        let result = PersonalTasteModelBuilder.buildRecords(records: [own, foreign], userID: "owner", assessQuestions: false)
        XCTAssertEqual(result.temporalValidity.missingKnownAtCount, 0)
        XCTAssertEqual(result.units.count, 1)
    }

    func testPolicyOverallAssociationRequiresSameMealAndValidValue() {
        let r = PersonalTasteModelRecord(observationId: "rating", userId: "owner", experienceId: "dish", mealId: "meal", attribute: "taste.sour", value: .text("positive"))
        let valid = PersonalTasteModelRecord(observationId: "whole", userId: "owner", experienceId: "dish", mealId: "meal", kind: "overall_liking", value: .text("very_positive"), scale: "overall-five-category-v1")
        XCTAssertEqual(PersonalTasteModelBuilder.buildRecords(records: [r, valid], userID: "owner", assessQuestions: false).overallAssociations.count, 1)
        var crossMeal = valid; crossMeal.mealId = "other"
        var invalid = valid; invalid.value = .text("unsupported")
        for whole in [crossMeal, invalid] {
            let result = PersonalTasteModelBuilder.buildRecords(records: [r, whole], userID: "owner", assessQuestions: false)
            XCTAssertTrue(result.overallAssociations.isEmpty)
            XCTAssertTrue(result.overallPatterns.isEmpty)
            XCTAssertEqual(result.units.first?.liking, "positive")
        }
    }

    func testPolicyValidatedIntensityReachesOverallAndFitQuestions() {
        func evidence(_ id: String) -> SensorySelectionEvidence {
            .init(selectionID: id, type: "bubble", catalogVersion: "policy-test/1", labelSnapshot: "산미", facet: "liking", labelValue: "좋았어요", responseValue: "liked", relatedBubbleID: nil, relatedBubbleLabel: nil, resolution: "resolved", selectionInstanceID: id)
        }
        let r = PersonalTasteModelRecord(observationId: "r", userId: "owner", experienceId: "dish", mealId: "meal", attribute: "taste.sour", value: .text("positive"), target: "whole_dish", phase: "during_meal", selectionEvidence: evidence("child"))
        var i = r; i.observationId = "i"; i.kind = "sensory_intensity"; i.scale = "expression-strength-v1"; i.value = .text("strong"); i.selectionEvidence = evidence("parent")
        var f = r; f.observationId = "f"; f.kind = "preference_fit"; f.scale = "preference-fit-v1"; f.value = .text("above_preferred")
        let whole = PersonalTasteModelRecord(observationId: "whole", userId: "owner", experienceId: "dish", mealId: "meal", kind: "overall_liking", value: .text("positive"), scale: "overall-five-category-v1")
        let links: [String: Set<String>] = ["r": ["i"], "f": ["i"]]
        let linked = PersonalTasteModelBuilder.buildRecords(records: [r, i, whole], userID: "owner", assessQuestions: false, validatedIntensityLinks: links)
        XCTAssertTrue(linked.overallPatterns.contains { $0.conditions.contains { $0.dimension == "intensity" && $0.value == "strong" } && $0.evidenceIDs.contains("i") })
        let fit = PersonalTasteModelBuilder.buildRecords(records: [f, i], userID: "owner", individualQuestions: true, validatedIntensityLinks: links)
        XCTAssertTrue(fit.fitPatterns.contains { $0.conditions.contains { $0.dimension == "intensity" } })
        XCTAssertFalse(fit.availableSelections.contains { $0.intent == "clarification" && $0.facet == "intensity" })
        let unlinked = PersonalTasteModelBuilder.buildRecords(records: [f, i], userID: "owner", individualQuestions: true)
        XCTAssertTrue(unlinked.availableSelections.contains { $0.facet == "intensity" })
    }

    private func policyTimeContract() throws -> SensoryNativeContract {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        return try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
    }
    private func policyTimeEntry(source: DiningMealTime.Source, mealDate: Date, rawDate: Date? = nil, saved: Date) -> DiningEntry {
        DiningEntry(restaurant: "합성 식당", menu: "합성 음식", observedAt: rawDate ?? mealDate, savedAt: saved, rating: 3, note: "", sensorySelections: [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .liked)], mealTime: .init(source: source, start: mealDate, confirmedAt: saved))
    }
    func testPolicyUnconfirmedDateRetainsCurrentLikingButNotHistoricalEvidence() throws {
        let meal = try XCTUnwrap(PersonalTasteModelBuilder.date("2026-10-01T03:00:00Z")), saved = meal.addingTimeInterval(3600), now = meal.addingTimeInterval(12 * 86400)
        let contract = try policyTimeContract()
        for source in [DiningMealTime.Source.recordedOnly, .unknown, .photoCandidate, .approximate] {
            let entry = policyTimeEntry(source: source, mealDate: meal, saved: saved)
            let current = try SensoryAnalysisEngine.analyze(entries: [entry], contract: contract, referenceDate: now)
            XCTAssertEqual(current.personalModel?.units.count, 1)
            XCTAssertTrue(current.observations.allSatisfy { $0.observedAt == nil })
            let past = try SensoryAnalysisEngine.analyze(entries: [entry], contract: contract, asOf: now.addingTimeInterval(-86400), referenceDate: now)
            XCTAssertTrue(past.observations.isEmpty)
            XCTAssertTrue(past.personalModel?.units.isEmpty == true)
            XCTAssertEqual(past.completedExperienceCount, 0)
        }
    }
    func testPolicyConfirmedDateOverridesRawDateAndFutureCannotCreateAnyInterpretation() throws {
        let meal = try XCTUnwrap(PersonalTasteModelBuilder.date("2026-10-01T03:00:00Z")), saved = meal.addingTimeInterval(3600), now = meal.addingTimeInterval(12 * 86400)
        let contract = try policyTimeContract()
        let entry = policyTimeEntry(source: .confirmed, mealDate: meal, rawDate: now, saved: saved)
        let prior = try SensoryAnalysisEngine.analyze(entries: [entry], contract: contract, asOf: meal.addingTimeInterval(86400), referenceDate: now)
        XCTAssertEqual(prior.personalModel?.units.count, 1)
        XCTAssertEqual(prior.observations.first?.observedAt, meal)
        let future = policyTimeEntry(source: .confirmed, mealDate: now.addingTimeInterval(86400), rawDate: meal, saved: saved)
        let result = try SensoryAnalysisEngine.analyze(entries: [future], contract: contract, referenceDate: now)
        XCTAssertTrue(result.observations.isEmpty)
        XCTAssertTrue(result.unresolved.isEmpty)
        XCTAssertTrue(result.insights.isEmpty)
        XCTAssertTrue(result.personalModel?.units.isEmpty == true)
        XCTAssertTrue(result.personalModel?.availableSelections.isEmpty == true)
        XCTAssertEqual(result.completedExperienceCount, 0)
    }
    func testPolicyFutureKnownResponseIsNotCurrentEvidenceAndOriginalRoundTripIsUnchanged() throws {
        let meal = try XCTUnwrap(PersonalTasteModelBuilder.date("2026-10-01T03:00:00Z")), now = meal.addingTimeInterval(12 * 86400)
        let entry = policyTimeEntry(source: .confirmed, mealDate: meal, saved: now.addingTimeInterval(86400))
        let original = try JSONEncoder().encode(entry)
        let restored = try JSONDecoder().decode(DiningEntry.self, from: original)
        XCTAssertEqual(restored, entry)
        let result = try SensoryAnalysisEngine.analyze(entries: [restored], contract: policyTimeContract(), referenceDate: now)
        XCTAssertTrue(result.observations.isEmpty)
        XCTAssertTrue(result.personalModel?.units.isEmpty == true)
        XCTAssertEqual(restored, entry)
    }

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
