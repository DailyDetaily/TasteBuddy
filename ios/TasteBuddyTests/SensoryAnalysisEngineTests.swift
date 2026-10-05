import XCTest
@testable import TasteBuddy

final class SensoryAnalysisEngineTests: XCTestCase {
    func testLossEvaluationDoesNotBecomeDislikeThroughNativeAnalysis() throws {
        let contract = try contract()
        for text in ["처음엔 좋았는데 소스를 묻히니 바삭함이 죽어서 아쉬웠다.", "바삭함이 사라져서 아쉬웠어요.", "바삭함이 줄었고 아쉬웠어요.", "소스를 찍으니 바삭함이 좋았어요."] {
            let result = try SensoryAnalysisEngine.analyze(entries: (0..<3).map { _ in entry(text) }, contract: contract)
            XCTAssertTrue(result.observations.isEmpty, text)
            XCTAssertTrue(result.personalModel?.units.isEmpty == true, text)
            XCTAssertTrue(result.unresolved.contains { $0.reason == "unresolved_sensory_change_or_condition" }, text)
        }
        let independent = try SensoryAnalysisEngine.analyze(entries: [entry("바삭함이 줄어서 아쉬웠어요. 소스의 단맛은 좋았어요.")], contract: contract)
        XCTAssertFalse(independent.observations.contains { $0.attribute == "texture.crisp" })
        XCTAssertTrue(independent.observations.contains { $0.attribute == "taste.sweet" && $0.kind == "attribute_liking" && $0.value == .text("positive") })
    }
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

    // Regression coverage for the native evidence boundary (tba-native-sensory/4).
    private func boundaryChoices() throws -> [DiningSensorySelection] {
        let definitions = try contract().selectionCatalog.entries.filter {
            $0.type == "bubble" && $0.attribute == "taste.sweet" && $0.intrinsicIntensity == nil
                && $0.intrinsicTarget == nil && $0.intrinsicPhase == nil
        }.sorted { $0.id < $1.id }
        XCTAssertGreaterThanOrEqual(definitions.count, 2)
        return definitions.prefix(2).map {
            .init(id: $0.id, type: .bubble, labelSnapshot: $0.label, target: .wholeDish)
        }
    }

    private func boundaryEntry(_ selections: [DiningSensorySelection], mealID: UUID = UUID(), note: String = "") -> DiningEntry {
        .init(mealID: mealID, restaurant: "경계 검증 식당", menu: "경계 검증 요리", rating: 5,
              note: note, sensorySelections: selections)
    }

    func testDifferentChoicesDoNotJoinIntensityAndLikingOrCreateMaximalistSupport() throws {
        var choices = try boundaryChoices()
        guard choices.count == 2 else { return }
        choices[0].intensity = .strong
        choices[1].liking = .liked
        let records = (0..<2).map { _ in boundaryEntry(choices) }
        let snapshot = try SensoryAnalysisEngine.analyze(entries: records, contract: contract())
        XCTAssertFalse(snapshot.insights.contains { $0.kind == "intensity_and_liking" })
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "maximalist" }?.supportExperienceCount, 0)
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "romantic" }?.supportExperienceCount, 2)
        XCTAssertEqual(snapshot.mainWing.main?.id, "romantic")
        let model = try XCTUnwrap(snapshot.personalModel)
        XCTAssertEqual(model.units.count, 2)
        XCTAssertTrue(model.units.allSatisfy { $0.intensity == nil })
    }

    func testSameChoiceStillJoinsIntensityAndLikingForInsightsAndProfile() throws {
        var choice = try XCTUnwrap(boundaryChoices().first)
        choice.intensity = .strong; choice.liking = .liked
        let records = (0..<2).map { _ in boundaryEntry([choice]) }
        let snapshot = try SensoryAnalysisEngine.analyze(entries: records, contract: contract())
        let insights = snapshot.insights.filter { $0.kind == "intensity_and_liking" }
        XCTAssertEqual(insights.count, 2)
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "maximalist" }?.supportExperienceCount, 2)
        for insight in insights {
            let sources = snapshot.observations.filter { insight.evidenceIDs.contains($0.id) }
            XCTAssertEqual(Set(sources.compactMap { $0.selectionEvidence?.selectionID }), [choice.id])
            XCTAssertEqual(Set(sources.map(\.kind)), ["attribute_liking", "sensory_intensity"])
        }
    }

    func testTwoChoicesKeepTheirOwnIntensityPairsInsteadOfBecomingAnIntensityConflict() throws {
        var choices = try boundaryChoices()
        guard choices.count == 2 else { return }
        choices[0].intensity = .strong; choices[0].liking = .liked
        choices[1].intensity = .light; choices[1].liking = .liked
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [boundaryEntry(choices)], contract: contract())
        let insights = snapshot.insights.filter { $0.kind == "intensity_and_liking" }
        XCTAssertEqual(insights.count, 2)
        for insight in insights {
            let sources = snapshot.observations.filter { insight.evidenceIDs.contains($0.id) }
            XCTAssertEqual(Set(sources.compactMap { $0.selectionEvidence?.selectionID }).count, 1)
        }
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "maximalist" }?.supportExperienceCount, 1)
    }

    func testNoteIntensityDoesNotFillAnUnansweredChoiceIntensity() throws {
        var choice = try XCTUnwrap(boundaryChoices().first)
        choice.liking = .liked
        let snapshot = try SensoryAnalysisEngine.analyze(
            entries: [boundaryEntry([choice], note: "단맛이 강했어요.")], contract: contract())
        XCTAssertTrue(snapshot.observations.contains { $0.sourceField == "note" && $0.kind == "sensory_intensity" })
        XCTAssertFalse(snapshot.insights.contains { $0.kind == "intensity_and_liking" })
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "maximalist" }?.supportExperienceCount, 0)
    }

    func testNoteAbsenceDoesNotEraseLikingFromAnotherExplicitChoice() throws {
        var choice = try XCTUnwrap(boundaryChoices().first)
        choice.liking = .liked
        let snapshot = try SensoryAnalysisEngine.analyze(
            entries: [boundaryEntry([choice], note: "단맛이 없어서 좋았습니다.")], contract: contract())
        let direct = try XCTUnwrap(snapshot.observations.first {
            $0.kind == "attribute_liking" && $0.selectionEvidence?.selectionID == choice.id
        })
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "romantic" }?.supportExperienceCount, 1)
        XCTAssertTrue(snapshot.insights.contains { $0.kind == "scoped_preference" && $0.evidenceIDs.contains(direct.id) })
        let qualified = try XCTUnwrap(snapshot.insights.first { $0.kind == "qualified_preference" })
        XCTAssertFalse(qualified.evidenceIDs.contains(direct.id))
        XCTAssertTrue(snapshot.observations.filter { qualified.evidenceIDs.contains($0.id) }.allSatisfy { $0.sourceField == "note" })
    }

    func testTwoDishesInOneMealRemainScopedAndPreserveBothOriginals() throws {
        let meal = UUID()
        let records = (0..<2).map { _ in boundaryEntry([], mealID: meal, note: "단맛이 좋았습니다.") }
        let snapshot = try SensoryAnalysisEngine.analyze(entries: records, contract: contract())
        XCTAssertFalse(snapshot.insights.contains { $0.kind == "repeated_preference" })
        let insight = try XCTUnwrap(snapshot.insights.first { $0.kind == "scoped_preference" })
        XCTAssertEqual(Set(insight.experienceIDs), Set(records.map(\.id)))
        XCTAssertEqual(insight.experienceCount, 2)
        XCTAssertTrue(insight.body.contains("1번의 식사에 남긴 2개 기록"))
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "romantic" }?.supportExperienceCount, 1)
        XCTAssertNil(snapshot.mainWing.main)
        let replay = try SensoryAnalysisEngine.analyze(entries: records.reversed() + [records[0]], contract: contract())
        XCTAssertEqual(snapshot, replay)
    }

    func testTwoIndependentMealsStillProduceRepeatedPreference() throws {
        let records = (0..<2).map { _ in boundaryEntry([], note: "단맛이 좋았습니다.") }
        let snapshot = try SensoryAnalysisEngine.analyze(entries: records, contract: contract())
        let insight = try XCTUnwrap(snapshot.insights.first { $0.kind == "repeated_preference" })
        XCTAssertEqual(Set(insight.experienceIDs), Set(records.map(\.id)))
        XCTAssertTrue(insight.body.contains("2번의 식사에 남긴 2개 기록"))
        XCTAssertEqual(snapshot.mainWing.candidates.first { $0.id == "romantic" }?.supportExperienceCount, 2)
    }

    func testMixedResponsesWithinOneMealDoNotBecomeRepeatedPreference() throws {
        let meal = UUID()
        let records = [boundaryEntry([], mealID: meal, note: "단맛이 좋았습니다."),
                       boundaryEntry([], mealID: meal, note: "단맛이 아쉬웠습니다.")]
        let snapshot = try SensoryAnalysisEngine.analyze(entries: records, contract: contract())
        XCTAssertFalse(snapshot.insights.contains { $0.kind == "repeated_preference" })
        XCTAssertNil(snapshot.mainWing.main)
        XCTAssertTrue(snapshot.personalModel?.candidates.contains { $0.distribution.mealCount == 1 && $0.distribution.mixed == 1 } ?? false)
    }

    func testSharedSelectionIdentitySeparatesTypesVersionsParentsAndMissingIdentities() {
        func evidence(id: String = "choice", type: String = "bubble", version: String = "catalog/1",
                      parent: String? = nil, facet: String = "liking") -> SensorySelectionEvidence {
            .init(selectionID: id, type: type, catalogVersion: version, labelSnapshot: "검증 선택", facet: facet,
                  labelValue: "검증 응답", responseValue: nil, relatedBubbleID: parent, relatedBubbleLabel: nil, resolution: "resolved")
        }
        let original = evidence()
        XCTAssertTrue(SensoryEvidenceLinkage.sameSelection(original, evidence(facet: "intensity")))
        for other in [evidence(id: "other"), evidence(type: "detailTag"), evidence(version: "catalog/2"), evidence(parent: "parent")] {
            XCTAssertFalse(SensoryEvidenceLinkage.sameSelection(original, other))
        }
        for invalid in [evidence(id: ""), evidence(type: ""), evidence(version: "")] {
            XCTAssertFalse(SensoryEvidenceLinkage.sameSelection(invalid, invalid))
        }
        XCTAssertTrue(SensoryEvidenceLinkage.sameSelection(nil, nil))
        XCTAssertFalse(SensoryEvidenceLinkage.sameSelection(original, nil))
        XCTAssertFalse(SensoryEvidenceLinkage.sameSelection(nil, original))
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
