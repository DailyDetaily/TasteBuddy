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
        XCTAssertEqual(fixture.dishKindOptions.count, 19)
        XCTAssertTrue(
            fixture.dishKindOptions.map(\.id).contains("stir_fried_wok")
        )
        XCTAssertTrue(
            fixture.dishKindOptions.map(\.id).contains("dairy_cheese")
        )
        XCTAssertTrue(
            fixture.scenario.dishes.allSatisfy {
                !$0.chefIntent.isEmpty && !$0.feedbackChoices.isEmpty
            }
        )
        XCTAssertTrue(
            fixture.sourceFiles.contains("src/components/reservation/DiningFeedbackFlow.tsx")
        )
        XCTAssertEqual(fixture.tasteExperienceAxes.count, 6)
        XCTAssertTrue(fixture.tasteExperienceAxes.allSatisfy { $0.words.count == 12 })
        XCTAssertEqual(fixture.tasteExperiences.count, 72)
        XCTAssertEqual(Set(fixture.tasteExperiences.map(\.id)).count, 72)
        XCTAssertTrue(fixture.detailTagCategories.allSatisfy { $0.tags.count == 12 })
    }

    func testDiningFeedbackDishKindAutoSelectionUsesMenuNameBeforeFallbackDefaults() {
        XCTAssertEqual(
            DiningFeedbackDishKindAutoSelection.inferredKindIDs(
                menuTitle: "오미자와 배 디저트"
            ),
            ["dessert"]
        )
        XCTAssertEqual(
            DiningFeedbackDishKindAutoSelection.inferredKindIDs(menuTitle: "백립"),
            ["meat"]
        )
        XCTAssertEqual(
            DiningFeedbackDishKindAutoSelection.inferredKindIDs(
                menuTitle: "맑은 육수 코스"
            ),
            ["broth"]
        )
        let mapoTofuKinds = DiningFeedbackDishKindAutoSelection.inferredKindIDs(
            menuTitle: "마파두부"
        )
        XCTAssertTrue(mapoTofuKinds.contains("legume_tofu"))
        XCTAssertTrue(mapoTofuKinds.contains("spice_heat"))

        let fixtureDish = DiningFeedbackDishContract(
            chefIntent: "메뉴명과 조리 단서를 함께 기록합니다.",
            courseLabel: "테스트",
            feedbackChoices: [],
            flavorNotes: ["스모키", "불맛"],
            id: "auto-kind-smoked-beef",
            ingredients: ["한우"],
            subtitle: "숯불에 구운 한우",
            techniques: ["숯불"],
            title: "오늘의 코스"
        )
        let inferredKinds = DiningFeedbackDishKindAutoSelection.inferredKindIDs(
            for: fixtureDish
        )

        XCTAssertTrue(inferredKinds.contains("meat"))
        XCTAssertTrue(inferredKinds.contains("grilled_smoked"))

        let wokKinds = DiningFeedbackDishKindAutoSelection.inferredKindIDs(
            menuTitle: "토마토 달걀 볶음"
        )
        XCTAssertTrue(wokKinds.contains("stir_fried_wok"))
        XCTAssertTrue(wokKinds.contains("vegetable_herb"))
    }

    func testDiningDetailTagRecommendationsAndCustomMetadataMatchReactRules() {
        let experiences = [
            TasteExperienceCatalog.experienceByID["sour-fresh"],
            TasteExperienceCatalog.experienceByID["umami-clear"],
        ].compactMap { $0 }
        let recommendations = DiningDetailTagCatalog.recommendedIDs(
            experiences: experiences,
            dishKindIDs: ["seafood"]
        )

        XCTAssertEqual(
            Array(recommendations.prefix(4)),
            [
                "balance-acid-cleans",
                "flow-clean-finish",
                "flow-opens-next",
                "composition-acid-structure",
            ]
        )
        XCTAssertEqual(recommendations.filter { $0 == "flow-clean-finish" }.count, 1)
        XCTAssertTrue(recommendations.contains("aroma-seafood"))

        let custom = DiningDetailTagCatalog.metadata(
            for: "custom:aroma:은은한 생강 향"
        )
        XCTAssertEqual(custom?.categoryLabel, "향과 재료 인상")
        XCTAssertEqual(custom?.label, "은은한 생강 향")
    }

    func testTasteExperienceMapLayoutAndSelectionMatchReactRules() throws {
        let fixture: DiningFeedbackFixtureContract = try decodeFixture(
            named: "dining-feedback-scenario"
        )
        let positions = TasteExperienceMapEngine.basePositions(
            axes: fixture.tasteExperienceAxes
        )

        XCTAssertEqual(positions.count, 72)
        XCTAssertEqual(Set(positions.map(\.id)).count, 72)
        XCTAssertFalse(
            positions.contains {
                $0.x == TasteExperienceMapEngine.mapCenter
                    && $0.y == TasteExperienceMapEngine.mapCenter
            }
        )

        let selectedIDs = [
            "sour-fresh",
            "salty-balanced",
            "umami-subtle-depth",
        ]
        let rendered = TasteExperienceMapEngine.renderPositions(
            basePositions: positions,
            enlargedExperienceIDs: selectedIDs
        )
        XCTAssertEqual(rendered.count, positions.count)
        XCTAssertTrue(
            rendered
                .filter { selectedIDs.contains($0.id) }
                .allSatisfy { $0.size == TasteExperienceMapEngine.selectedBubbleSize }
        )

        var maximumOverlap: CGFloat = 0
        for leftIndex in rendered.indices {
            for rightIndex in rendered.indices where rightIndex > leftIndex {
                let left = rendered[leftIndex]
                let right = rendered[rightIndex]
                let distance = hypot(left.x - right.x, left.y - right.y)
                let minimumDistance = (left.size + right.size) / 2
                    + (TasteExperienceMapEngine.gridSpacing - TasteExperienceMapEngine.bubbleSize)
                maximumOverlap = max(maximumOverlap, minimumDistance - distance)
            }
        }
        XCTAssertLessThanOrEqual(maximumOverlap, 4)

        var selection: [String] = []
        selection = TasteExperienceMapEngine.toggleSelection("sour-fresh", in: selection)
        selection = TasteExperienceMapEngine.toggleSelection("salty-balanced", in: selection)
        selection = TasteExperienceMapEngine.toggleSelection("umami-subtle-depth", in: selection)
        selection = TasteExperienceMapEngine.toggleSelection("sweet-soft", in: selection)
        XCTAssertEqual(selection, selectedIDs)

        selection = TasteExperienceMapEngine.toggleSelection("salty-balanced", in: selection)
        XCTAssertEqual(selection, ["sour-fresh", "umami-subtle-depth"])
        XCTAssertNotNil(
            TasteExperienceMapEngine.nextUnselectedExperienceID(
                from: "sour-fresh",
                selectedExperienceIDs: selection,
                positions: rendered
            )
        )
    }

    func testTasteExperienceIntroTimingKeepsPrimaryThenOuterSequence() throws {
        let fixture: DiningFeedbackFixtureContract = try decodeFixture(
            named: "dining-feedback-scenario"
        )
        let positions = TasteExperienceMapEngine.basePositions(
            axes: fixture.tasteExperienceAxes
        )
        let delays = TasteExperienceMapEngine.introDelays(
            axes: fixture.tasteExperienceAxes,
            positions: positions
        )
        let primaryIDs = fixture.tasteExperienceAxes.compactMap { axis in
            axis.words.first.map { "\(axis.id.rawValue)-\($0.key)" }
        }

        XCTAssertEqual(delays.count, 72)
        XCTAssertEqual(delays[primaryIDs[0]] ?? -1, 0.44, accuracy: 0.0001)
        XCTAssertEqual(delays[primaryIDs[1]] ?? -1, 0.516, accuracy: 0.0001)
        XCTAssertTrue(
            positions
                .filter { !primaryIDs.contains($0.id) }
                .allSatisfy { (delays[$0.id] ?? 0) >= 0.9 }
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
