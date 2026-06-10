import XCTest
@testable import TasteBuddy

final class TasteContractGoldenTests: XCTestCase {
    func testTasteAxisRawValuesMatchReactContract() {
        XCTAssertEqual(
            TasteAxis.allCases.map(\.rawValue),
            ["sweet", "sour", "bitter", "salty", "umami", "fat"]
        )
    }

    func testQuickCalibrationMatchesGeneratedReactGoldenFixture() throws {
        let fixture: QuickCalibrationGoldenFixture = try decodeFixture(
            named: "quick-calibration-golden"
        )

        XCTAssertEqual(fixture.schemaVersion, 1)
        XCTAssertFalse(fixture.sourceFiles.isEmpty)

        for testCase in fixture.cases {
            let responses = Dictionary(
                uniqueKeysWithValues: testCase.responses.compactMap { key, value in
                    TasteAxis(rawValue: key).map { ($0, value) }
                }
            )
            let result = QuickCalibrationContractEngine.makeResult(
                responses: responses,
                measuredAt: testCase.expected.snapshot.measuredAt
            )

            XCTAssertEqual(result, testCase.expected, "Fixture case: \(testCase.id)")
        }
    }

    func testTasteSurveyMatchesGeneratedReactGoldenFixture() throws {
        let fixture: TasteSurveyGoldenFixture = try decodeFixture(
            named: "taste-survey-golden"
        )

        XCTAssertEqual(fixture.schemaVersion, 1)
        XCTAssertEqual(fixture.items.count, 12)
        XCTAssertEqual(fixture.contextSteps.count, 3)

        for testCase in fixture.cases {
            let result = TasteSurveyScoringEngine.makeCompatibleResult(
                items: fixture.items,
                responses: testCase.responses,
                measuredAt: testCase.expected.snapshot.measuredAt
            )

            XCTAssertEqual(result, testCase.expected, "Fixture case: \(testCase.id)")
        }
    }

    func testDiningFeedbackScenarioDecodesCompleteGuidedFlowContract() throws {
        let fixture: DiningFeedbackFixtureContract = try decodeFixture(
            named: "dining-feedback-scenario"
        )

        XCTAssertEqual(fixture.schemaVersion, 1)
        XCTAssertEqual(fixture.scenario.restaurant, "정식당")
        XCTAssertEqual(fixture.scenario.dishes.count, 4)
        XCTAssertEqual(fixture.scenario.dishes.first?.feedbackChoices.count, 3)
        XCTAssertEqual(fixture.detailTagCategories.count, 5)
        XCTAssertEqual(fixture.dishKindOptions.count, 10)
        XCTAssertTrue(
            fixture.scenario.dishes.allSatisfy {
                !$0.chefIntent.isEmpty && !$0.feedbackChoices.isEmpty
            }
        )
    }

    func testTbaDiningAnalysisMatchesReactGoldenFixture() throws {
        let fixture: TbaDiningAnalysisGoldenFixture = try decodeFixture(
            named: "tba-dining-analysis-golden"
        )

        XCTAssertEqual(fixture.schemaVersion, 1)
        XCTAssertTrue(fixture.sourceFiles.contains("src/lib/tasteBuddyAgent.ts"))

        for testCase in fixture.cases {
            XCTAssertEqual(
                TasteBuddyAgent.buildDiningNote(testCase.input),
                testCase.expected.note,
                "Fixture case: \(testCase.id)"
            )
            XCTAssertEqual(
                TasteBuddyAgent.buildDiningAnalysisSnapshot(
                    testCase.input,
                    generatedAt: fixture.generatedAt
                ),
                testCase.expected.snapshot,
                "Fixture case: \(testCase.id)"
            )
        }
    }

    func testPreferenceIntakeSelectionRulesMatchReactGoldenFixture() throws {
        let fixture: PreferenceIntakeFixtureContract = try decodeFixture(
            named: "preference-intake"
        )
        let questionsById = Dictionary(
            uniqueKeysWithValues: fixture.questions.map { ($0.id, $0) }
        )

        XCTAssertEqual(fixture.schemaVersion, 1)
        XCTAssertEqual(fixture.questions.count, 7)

        for selectionCase in fixture.selectionCases {
            let question = try XCTUnwrap(questionsById[selectionCase.questionId])
            XCTAssertEqual(
                PreferenceIntakeContractEngine.nextMultipleSelection(
                    question: question,
                    currentValue: selectionCase.currentValue,
                    optionId: selectionCase.optionId
                ),
                selectionCase.expected,
                "Fixture case: \(selectionCase.id)"
            )
        }

        for question in fixture.questions {
            XCTAssertEqual(
                PreferenceIntakeContractEngine.isAnswered(
                    question: question,
                    responses: fixture.referenceResponses
                ),
                fixture.answeredByQuestion[question.id],
                "Question: \(question.id)"
            )
        }

        XCTAssertEqual(
            PreferenceIntakeContractEngine.buildProfile(
                questions: fixture.questions,
                responses: fixture.referenceResponses
            ),
            fixture.expectedProfile
        )
    }

    private func decodeFixture<Fixture: Decodable>(named name: String) throws -> Fixture {
        let testBundle = Bundle(for: Self.self)
        let url = try XCTUnwrap(
            Bundle.main.url(forResource: name, withExtension: "json", subdirectory: "Fixtures")
                ?? Bundle.main.url(forResource: name, withExtension: "json")
                ?? testBundle.url(forResource: name, withExtension: "json", subdirectory: "Fixtures")
                ?? testBundle.url(forResource: name, withExtension: "json")
        )
        return try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: url))
    }
}

private struct QuickCalibrationGoldenFixture: Decodable {
    let schemaVersion: Int
    let sourceFiles: [String]
    let cases: [FixtureCase]

    struct FixtureCase: Decodable {
        let id: String
        let responses: [String: Int]
        let expected: QuickCalibrationContractResult
    }
}

private struct TasteSurveyGoldenFixture: Decodable {
    let schemaVersion: Int
    let contextSteps: [TasteSurveyContextStepContract]
    let items: [TasteSurveyItemContract]
    let cases: [FixtureCase]

    struct FixtureCase: Decodable {
        let id: String
        let responses: [TasteSurveyResponseContract]
        let expected: TasteSurveyCompatibleResultContract
    }
}

private struct TbaDiningAnalysisGoldenFixture: Decodable {
    let schemaVersion: Int
    let sourceFiles: [String]
    let generatedAt: String
    let cases: [FixtureCase]

    struct FixtureCase: Decodable {
        let id: String
        let input: TasteBuddyAgentDiningAnalysisInput
        let expected: Expected
    }

    struct Expected: Decodable {
        let note: TasteBuddyAgentDiningNote
        let snapshot: TasteBuddyAgentDiningAnalysisSnapshot
    }
}
