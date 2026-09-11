import XCTest
@testable import TasteBuddy

final class PersonalTasteInsightTests: XCTestCase {
    private func records(_ id: String) throws -> [PersonalTasteModelRecord] {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("TasteBuddy/Resources/TBA/personal-taste-model-contract.json")
        let contract = try JSONDecoder().decode(PersonalTasteModelContract.self, from: Data(contentsOf: url))
        return try XCTUnwrap(contract.fixtures.first { $0.id == id }).records
    }
    private func model(_ records: [PersonalTasteModelRecord]) -> PersonalTasteModelSnapshot {
        PersonalTasteModelBuilder.buildRecords(records: records, userID: "fixture-user")
    }

    func testFitPatternsKeepIntensityConditionsWithoutCreatingLiking() throws {
        let result = model(try records("v2-fit-conditional"))
        XCTAssertTrue(result.units.isEmpty)
        let baseline = try XCTUnwrap(result.fitPatterns.first { $0.conditions.isEmpty })
        XCTAssertEqual(baseline.distribution, .init(belowPreferred: 0, justRight: 3, abovePreferred: 3, mixed: 0, mealCount: 6))
        for (level, value) in [("medium", "just_right"), ("strong", "above_preferred")] {
            let pattern = try XCTUnwrap(result.fitPatterns.first { $0.conditions == [.init(dimension: "intensity", value: level)] })
            XCTAssertEqual(pattern.repeatedValue, value)
            XCTAssertEqual(pattern.mealIDs.count, 3)
            XCTAssertEqual(pattern.evidenceIDs.count, 6)
        }
        XCTAssertTrue(result.fitPatterns.allSatisfy { $0.conditions.count <= 2 })
    }

    func testSameMealMixedFitRetainsBothSourcesAndOneVote() throws {
        let rows = try records("v2-fit-same-meal-mixed")
        let result = model(rows + [rows[0]])
        let baseline = try XCTUnwrap(result.fitPatterns.first { $0.conditions.isEmpty })
        XCTAssertEqual(baseline.distribution.mixed, 1)
        XCTAssertEqual(baseline.distribution.mealCount, 1)
        XCTAssertEqual(baseline.evidenceIDs, ["fit-a", "fit-b"])
        XCTAssertNil(baseline.repeatedValue)
    }

    func testCrossEvaluationPreservesAllFifteenCategoryPairs() throws {
        let result = model(try records("v2-overall-all-categories"))
        let baseline = try XCTUnwrap(result.overallPatterns.first { $0.conditions.isEmpty })
        XCTAssertEqual(baseline.cells.count, 15)
        XCTAssertEqual(baseline.mealIDs.count, 15)
        XCTAssertEqual(baseline.cells.filter { $0.overallValue == "neutral" }.count, 3)
        XCTAssertEqual(baseline.cells.filter { $0.attributeValue == "neutral" }.count, 5)
        XCTAssertTrue(baseline.cells.allSatisfy { $0.mealIDs.count == 1 })
        XCTAssertNil(baseline.causalClaim)
    }

    func testDifferentPairsWithinOneMealRemainMixedWithoutCrossingDishBoundaries() throws {
        let rows = try records("v2-overall-different-dishes")
        let result = model(rows)
        let baseline = try XCTUnwrap(result.overallPatterns.first { $0.conditions.isEmpty })
        XCTAssertTrue(baseline.cells.isEmpty)
        XCTAssertEqual(baseline.mixedMealIDs, ["one"])
        XCTAssertEqual(baseline.evidenceIDs.count, 4)
        XCTAssertTrue(model([rows[0], rows[3]]).overallPatterns.isEmpty)
    }

    func testQuestionChoosesInterpretationImpactAndRetainsActualResponseSource() throws {
        let rows = try records("v2-question-impact"), original = rows
        let result = model(rows), question = try XCTUnwrap(result.nextSelection)
        XCTAssertEqual(question.facet, "intensity")
        XCTAssertEqual(question.attribute, "taste.sour")
        XCTAssertEqual(question.responseSourceID, "question-source")
        XCTAssertEqual(question.impact?.alternativeCount, 3)
        XCTAssertGreaterThan(question.impact?.changedInterpretationCount ?? 0, 0)
        XCTAssertEqual(question.impact?.basis, "answer_can_change_interpretation")
        XCTAssertFalse(String(data: try JSONEncoder().encode(result), encoding: .utf8)!.contains("__question_"))
        XCTAssertEqual(rows, original)
        XCTAssertEqual(result.units.count, 7)
        XCTAssertEqual(model(Array(rows.reversed())), result)
    }

    func testFitAndOverallRecomputeAfterReplacementAndDeletion() throws {
        let rows = try records("v2-fit-conditional")
        let shortened = model(rows.filter { !$0.observationId.hasPrefix("fit-medium-3") })
        let medium = try XCTUnwrap(shortened.fitPatterns.first { $0.conditions == [.init(dimension: "intensity", value: "medium")] })
        XCTAssertNil(medium.repeatedValue)
        XCTAssertEqual(medium.distribution.justRight, 2)
        XCTAssertFalse(shortened.fitPatterns.flatMap(\.evidenceIDs).contains("fit-medium-3"))
        var pairs = try records("v2-overall-different-dishes")
        pairs[3].value = .text("very_positive")
        pairs[2].value = .text("negative")
        let overall = try XCTUnwrap(model(pairs).overallPatterns.first { $0.conditions.isEmpty })
        XCTAssertTrue(overall.mixedMealIDs.isEmpty)
        XCTAssertEqual(overall.cells.count, 1)
        XCTAssertEqual(overall.cells[0].mealIDs, ["one"])
    }

    func testNativeStructuredResponsesReachFitAndOverallInsights() throws {
        let entries = (0..<6).map { index in
            DiningEntry(
                restaurant: "검증 식당", menu: "기록한 국물", rating: 0, note: "",
                sensorySelections: [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                    liking: index < 3 ? .liked : .disliked, intensity: index < 3 ? .medium : .strong,
                    preferenceFit: index < 3 ? .justRight : .tooStrong, target: .broth, phase: .duringMeal)],
                overallEvaluation: .init(response: .veryLiked)
            )
        }
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        let result = try XCTUnwrap(snapshot.personalModel)
        XCTAssertEqual(result.fitPatterns.first { $0.conditions.isEmpty }?.distribution.mealCount, 6)
        let cells = try XCTUnwrap(result.overallPatterns.first { $0.conditions.isEmpty }).cells
        XCTAssertEqual(cells.map(\.overallValue), ["very_positive", "very_positive"])
        XCTAssertEqual(cells.map { $0.mealIDs.count }, [3, 3])
        let groups = PersonalTasteInsightPresentation.groups(result)
        XCTAssertEqual(groups.filter { $0.kind == .fit }.count, 1)
        XCTAssertEqual(groups.filter { $0.kind == .overall }.count, 1)
        XCTAssertTrue(groups[0].body.contains("알맞았어요"))
        XCTAssertTrue(groups[0].body.contains("조금 과했어요"))
        XCTAssertFalse(groups.flatMap(\.evidenceIDs).contains { $0.hasPrefix("__question_") })
    }

    func testPresentationDoesNotUpgradeASinglePairToRepeatedDirection() throws {
        let result = model(try records("v2-overall-all-categories"))
        let group = try XCTUnwrap(PersonalTasteInsightPresentation.groups(result).first { $0.kind == .overall })
        XCTAssertTrue(group.body.contains("반복 경향은 더 살펴봐요"))
        XCTAssertTrue(group.rows.flatMap(\.counts).contains { $0.contains("보통이었어요") && $0.contains("보통이에요") })
        XCTAssertEqual(group.mealIDs.count, 15)
    }

    func testFitOnlyMissingIntensityCanChangeARepeatedFitInterpretation() {
        var rows: [PersonalTasteModelRecord] = []
        for index in 0..<4 {
            let row = PersonalTasteModelRecord(observationId: "fit-\(index)", userId: "fixture-user", experienceId: "e-\(index)", kind: "preference_fit", attribute: "taste.sour", value: .text(index < 3 ? "just_right" : "above_preferred"), scale: "preference-fit-v1", target: "broth", phase: "during_meal")
            rows.append(row)
            if index < 3 {
                var intensity = row; intensity.observationId += "-intensity"; intensity.kind = "sensory_intensity"
                intensity.value = .text("medium"); intensity.scale = "expression-strength-v1"; rows.append(intensity)
            }
        }
        let question = model(rows).nextSelection
        XCTAssertEqual(question?.facet, "intensity")
        XCTAssertEqual(question?.responseSourceID, "fit-3")
        XCTAssertGreaterThan(question?.impact?.changedInterpretationCount ?? 0, 0)
    }

    func testQuestionProjectionRetainsEveryDecisionAndDistribution() throws {
        let omitted: Set<String> = ["evidence", "evidenceIDs", "overallAssociations", "nextSelection"]
        func prune(_ value: Any) -> Any {
            if let object = value as? [String: Any] { return object.filter { !omitted.contains($0.key) }.mapValues(prune) }
            if let array = value as? [Any] { return array.map(prune) }
            return value
        }
        func shape(_ model: PersonalTasteModelSnapshot) throws -> Data {
            let json = try JSONSerialization.jsonObject(with: JSONEncoder().encode(model))
            return try JSONSerialization.data(withJSONObject: prune(json), options: [.sortedKeys])
        }
        for id in ["v2-fit-conditional", "v2-fit-same-meal-mixed", "v2-overall-all-categories", "v2-overall-different-dishes", "v2-question-impact"] {
            let rows = try records(id)
            let decision = PersonalTasteModelBuilder.buildRecords(records: rows, userID: "fixture-user", assessQuestions: false, includeEvidence: false)
            XCTAssertEqual(try shape(decision), try shape(model(rows)), id)
        }
    }
}
