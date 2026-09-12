import XCTest
@testable import TasteBuddy

final class SensoryAnalysisEngineTests: XCTestCase {
    private func contract() throws -> SensoryNativeContract {
        let source = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        return try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: source))
    }
    private func entry(_ note: String, menu: String = "기록한 음식", status: DiningEntryFeedbackStatus = .completed, id: UUID = UUID()) -> DiningEntry {
        DiningEntry(id: id, restaurant: "기록한 식당", menu: menu, rating: 5, note: note, feedbackStatus: status)
    }

    func testNativeParserMatchesEveryGeneratedJavaScriptFixture() throws {
        let contract = try contract()
        XCTAssertGreaterThanOrEqual(contract.fixtures.count, 132)
        for fixture in contract.fixtures {
            var actual = SensoryRuleResult()
            switch fixture.answer.value {
            case .text(let text): actual = SensoryAnalysisEngine.parse(text, contract: contract, target: fixture.answer.target, phase: fixture.answer.phase)
            case .choices(let choices):
                for choice in choices {
                    let parsed = SensoryAnalysisEngine.parseChoice(id: choice.id, label: choice.label, contract: contract, target: fixture.answer.target, phase: fixture.answer.phase)
                    actual.observations += parsed.observations
                    actual.unresolved += parsed.unresolved
                    actual.needsAI = actual.needsAI || parsed.needsAI
                }
            }
            XCTAssertEqual(actual, fixture.expected, fixture.id)
        }
    }

    func testMainWingAndCandidateCountsMatchGeneratedJavaScriptProfileFixtures() throws {
        let contract = try contract()
        XCTAssertEqual(contract.profileFixtures.count, 15)
        for fixture in contract.profileFixtures {
            let actual = try SensoryAnalysisEngine.analyze(entries: fixture.notes.map { entry($0) }, contract: contract).mainWing
            XCTAssertEqual(actual.status, fixture.expected.status, fixture.id)
            XCTAssertEqual(actual.main?.id, fixture.expected.mainID, fixture.id)
            XCTAssertEqual(actual.wing?.id, fixture.expected.wingID, fixture.id)
            for expected in fixture.expected.candidates {
                let candidate = actual.candidates.first { $0.id == expected.id }
                XCTAssertEqual(candidate?.status, expected.status, fixture.id + expected.id)
                XCTAssertEqual(candidate?.supportExperienceCount, expected.supportExperienceCount, fixture.id + expected.id)
                XCTAssertEqual(candidate?.counterExperienceCount, expected.counterExperienceCount, fixture.id + expected.id)
                XCTAssertEqual(candidate?.eligible, expected.eligible, fixture.id + expected.id)
            }
        }
    }

    func testCapturedFeedbackMenuAndRatingDoNotCreateTasteEvidence() throws {
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [entry("단맛이 좋았습니다.", status: .captured), entry("", menu: "달콤한 버터 케이크")], contract: contract())
        XCTAssertTrue(snapshot.observations.isEmpty)
        XCTAssertTrue(snapshot.insights.isEmpty)
        XCTAssertNil(snapshot.mainWing.main)
        XCTAssertEqual(snapshot.completedExperienceCount, 1)
        XCTAssertEqual(snapshot.sourceExperienceCount, 0)
        XCTAssertEqual(snapshot.actualApiCalls, 0)
    }

    func testOneRealMealIsOneSignalAndDuplicateOutputsDoNotInflateIt() throws {
        let meal = entry("단맛이 좋았습니다. 단맛이 좋았습니다.")
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [meal, meal], contract: contract())
        XCTAssertEqual(snapshot.sourceExperienceCount, 1)
        XCTAssertEqual(snapshot.completedExperienceCount, 1)
        XCTAssertNil(snapshot.mainWing.main)
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "romantic" }?.supportExperienceCount, 1)
        XCTAssertEqual(snapshot.insights.first?.experienceCount, 1)
    }

    func testDistinctRepeatedLikingCanChooseMainAndIndependentWing() throws {
        let notes = ["단맛이 좋았습니다. 바삭함이 좋았습니다.", "단맛이 좋았습니다. 바삭함이 좋았습니다.", "단맛이 좋았습니다."]
        let snapshot = try SensoryAnalysisEngine.analyze(entries: notes.map { entry($0) }, contract: contract())
        XCTAssertEqual(snapshot.mainWing.main?.id, "romantic")
        XCTAssertEqual(snapshot.mainWing.wing?.id, "texturalist")
        XCTAssertEqual(snapshot.mainWing.main?.supportExperienceCount, 3)
        XCTAssertEqual(snapshot.mainWing.wing?.supportExperienceCount, 2)
    }

    func testTiedMainAndOverlappingWingAreNotForced() throws {
        let tied = try SensoryAnalysisEngine.analyze(entries: (0..<2).map { _ in entry("단맛이 좋았습니다. 바삭함이 좋았습니다.") }, contract: contract())
        XCTAssertNil(tied.mainWing.main)
        XCTAssertEqual(tied.mainWing.status, "ambiguous_main")
        let shared = try SensoryAnalysisEngine.analyze(entries: (0..<3).map { _ in entry("단맛이 강해서 좋았습니다.") } + [entry("단맛이 좋았습니다.")], contract: contract())
        XCTAssertEqual(shared.mainWing.main?.id, "romantic")
        XCTAssertNil(shared.mainWing.wing)
    }

    func testUnknownDetailAndNegatedPresenceDoNotBecomeGeneralPreference() throws {
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [entry("향이 종이처럼 납작해서 좋았습니다."), entry("단맛이 없어서 좋았습니다.")], contract: contract())
        XCTAssertTrue(snapshot.observations.contains(where: \.isUnclassifiedDetail))
        XCTAssertTrue(snapshot.needsMeaningReview)
        XCTAssertEqual(snapshot.sourceExperienceCount, 1)
        XCTAssertEqual(snapshot.unresolvedExperienceCount, 1)
        XCTAssertEqual(snapshot.insights.map(\.kind), ["qualified_preference"])
        XCTAssertNil(snapshot.mainWing.main)
        XCTAssertTrue(snapshot.mainWing.candidates.allSatisfy { $0.supportExperienceCount == 0 })
        XCTAssertTrue(snapshot.unresolved.contains { $0.reason == "explicit_evaluation_scope_unresolved" })
    }

    func testNegatedIntensityPreservesDetailWithoutInventingAbsenceOrOppositeIntensity() throws {
        let contract = try contract()
        for text in ["단맛이 강하지 않았어요.", "단맛이 강하지는 않았어요.", "단맛이 강하진 않았어요.", "단맛이 약하지 않았어요.", "감칠맛이 진하지 않았어요.", "단맛이 안 강했어요.", "단맛이 세지 않았어요.", "단맛이 강하게 느껴지지 않았어요.", "단맛이 강하지 않아서 좋았어요."] {
            let result = SensoryAnalysisEngine.parse(text, contract: contract)
            XCTAssertEqual(result.observations.map(\.kind), ["sensory_detail"], text)
            XCTAssertEqual(result.observations.map(\.value), [.text(text)], text)
            XCTAssertEqual(result.unresolved.map(\.reason), ["unresolved_intensity_negation"], text)
            XCTAssertTrue(result.needsAI, text)
        }
        for text in ["바삭하지 않았어요.", "차갑지는 않았어요.", "짠맛은 안 느껴졌어요."] {
            let result = SensoryAnalysisEngine.parse(text, contract: contract)
            XCTAssertEqual(result.observations.map(\.kind), ["sensory_presence"], text)
            XCTAssertEqual(result.observations.map(\.value), [.flag(false)], text)
        }
        for text in ["단맛과 쓴맛이 강하지 않았어요.", "단맛이 강하지 않은 건 아니에요.", "단맛이 좋지 않았어요."] {
            let result = SensoryAnalysisEngine.parse(text, contract: contract)
            XCTAssertTrue(result.observations.isEmpty, text)
            XCTAssertFalse(result.unresolved.isEmpty, text)
        }
        let meal = entry("🍽️ 단맛이 강하지 않았어요. 단맛이 좋았어요.")
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [meal], contract: contract)
        XCTAssertEqual(snapshot.personalModel?.units.map(\.liking), ["positive"])
        XCTAssertNil(snapshot.personalModel?.units.first?.intensity)
        XCTAssertFalse(snapshot.personalModel?.excludedEvidence.contains { $0.reason == "absence_qualified" } ?? true)
        for observation in snapshot.observations {
            for span in observation.sourceSpans {
                XCTAssertEqual((meal.note as NSString).substring(with: NSRange(location: span.start, length: span.end - span.start)), span.quote)
            }
        }
    }

    func testContextDifferenceRetainsExactQuotesAndSourceOffsets() throws {
        let first = entry("🍽️ 소스는 단맛이 좋았습니다.", menu: "첫 음식"), second = entry("속은 단맛이 아쉬웠습니다.", menu: "두 번째 음식")
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [first, second], contract: contract())
        XCTAssertEqual(snapshot.insights.first?.kind, "contextual_preference")
        XCTAssertEqual(snapshot.insights.first?.experienceCount, 2)
        for observation in snapshot.observations {
            let original = observation.experienceID == first.id ? first.note : second.note
            for span in observation.sourceSpans {
                XCTAssertEqual((original as NSString).substring(with: NSRange(location: span.start, length: span.end - span.start)), span.quote)
            }
            XCTAssertEqual(observation.sourceField, "note")
        }
        let replay = try SensoryAnalysisEngine.analyze(entries: [first, second], contract: contract())
        XCTAssertEqual(snapshot, replay)
    }

    func testIntensityAndScopedDifferencesKeepTheirExactEvidence() throws {
        let strong = entry("단맛이 강했어요. 단맛이 좋았어요.")
        let temporal = entry("첫입에는 단맛이 좋았습니다. 삼킨뒤 단맛이 아쉬웠습니다.")
        let targets = entry("겉은 단맛이 좋았습니다. 속은 단맛이 아쉬웠습니다.")
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [strong, temporal, targets], contract: contract())
        for (kind, original) in [("intensity_and_liking", strong), ("within_meal_difference", temporal), ("target_preference_difference", targets)] {
            let insight = try XCTUnwrap(snapshot.insights.first { $0.kind == kind })
            XCTAssertEqual(insight.experienceIDs, [original.id])
            XCTAssertGreaterThanOrEqual(insight.evidenceIDs.count, 2)
            for id in insight.evidenceIDs {
                let evidence = try XCTUnwrap(snapshot.observations.first { $0.id == id })
                XCTAssertEqual(evidence.experienceID, original.id)
                XCTAssertTrue(original.note.contains(evidence.phrase))
            }
        }
        let ambiguous = try SensoryAnalysisEngine.analyze(entries: [entry("단맛이 강했어요. 단맛이 약했어요. 단맛이 좋았어요.")], contract: contract())
        XCTAssertFalse(ambiguous.insights.contains { $0.kind == "intensity_and_liking" })
    }

    func testMissingContractThrowsInsteadOfReturningEmptySuccess() {
        XCTAssertThrowsError(try SensoryAnalysisEngine.analyze(entries: [], contract: nil))
    }

    func testUnknownStoredChoiceIDIsPreservedWithoutParsingTheIdentifier() throws {
        let meal = DiningEntry(restaurant: "식당", menu: "음식", rating: 5, note: "", tasteExperienceIDs: ["missing-sweet-choice"])
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [meal], contract: contract())
        XCTAssertTrue(snapshot.observations.isEmpty)
        XCTAssertEqual(snapshot.unresolved.first?.phrase, "missing-sweet-choice")
        XCTAssertEqual(snapshot.unresolved.first?.reason, "unknown_selection_id")
    }
}
