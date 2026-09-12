import XCTest
@testable import TasteBuddy

/// 실제 원문 응답과 질문 완료 상태를 분리하는 독립 회귀 검사.
/// AM-15/18/20/27/28/29/30의 기존 기대를 유지한다.
final class PersonalTasteQuestionResolutionTests: XCTestCase {
    @MainActor
    func testHomeBatchLimitsMenusAndDoesNotRefillAfterAnswering() async throws {
        let fixture = try await makeFixture()
        defer { fixture.defaults.removePersistentDomain(forName: fixture.suite) }
        for (index, target) in DiningSensorySelection.Target.allCases.filter({ $0 != .unspecified }).prefix(4).enumerated() {
            fixture.model.addDiningEntry(.init(
                restaurant: "검증 식당", menu: "메뉴 \(index)", date: Date.now, rating: 4, note: "",
                sensorySelections: [selection(target: target, phase: .unspecified)], feedbackStatus: .completed
            ))
        }
        try await waitForAnalysis(fixture.model)
        let questions = try XCTUnwrap(fixture.model.sensoryAnalysis.personalModel?.availableSelections)
        let observations = fixture.model.sensoryAnalysis.observations
        let entries = fixture.model.diningEntries
        let groups = PersonalTasteQuestionList.groups(questions: questions, observations: observations, entries: entries)
        XCTAssertGreaterThanOrEqual(groups.count, 4)
        XCTAssertTrue(groups.contains { $0.questions.count > 1 })
        XCTAssertEqual(groups.flatMap(\.questions).count, questions.count)
        let ids = PersonalTasteQuestionList.homeIDs(questions: questions, observations: observations, entries: entries)
        XCTAssertEqual(ids.count, 3)
        XCTAssertEqual(ids, Array(groups.prefix(3).compactMap { $0.questions.first?.id }))
        let afterFirstAnswer = questions.filter { $0.id != ids.first }
        XCTAssertEqual(PersonalTasteQuestionList.remaining(ids: ids, questions: afterFirstAnswer).map(\.id), Array(ids.dropFirst()))
        XCTAssertTrue(PersonalTasteQuestionList.remaining(ids: ids, questions: questions.filter { !ids.contains($0.id) }).isEmpty)
    }

    @MainActor
    func testQuestionMediaUsesOnlyItsSourceMealAndNeverAFutureMeal() async throws {
        let fixture = try await makeFixture()
        defer { fixture.defaults.removePersistentDomain(forName: fixture.suite) }
        let source = PersonalTasteInlineAnswer.sourceEntry(
            for: fixture.context.selection, observations: fixture.model.sensoryAnalysis.observations,
            entries: [.sample, fixture.source]
        )
        XCTAssertEqual(source, fixture.source)
        XCTAssertNil(PersonalTasteInlineAnswer.sourceEntry(
            for: fixture.context.selection, observations: fixture.model.sensoryAnalysis.observations, entries: [.sample]
        ))
        let future = try await makeFixture(exploration: true)
        defer { future.defaults.removePersistentDomain(forName: future.suite) }
        XCTAssertNil(PersonalTasteInlineAnswer.sourceEntry(
            for: future.context.selection, observations: future.model.sensoryAnalysis.observations, entries: future.model.diningEntries
        ))
    }

    @MainActor
    func testQueuedQuestionKeepsRankingAndCanBeAnsweredIndependently() async throws {
        let fixture = try await makeFixture()
        defer { fixture.defaults.removePersistentDomain(forName: fixture.suite) }
        fixture.model.addDiningEntry(entry(selections: [selection(target: .unspecified, phase: .unspecified)]))
        try await waitForAnalysis(fixture.model)
        let snapshot = try XCTUnwrap(fixture.model.sensoryAnalysis.personalModel)
        XCTAssertEqual(snapshot.availableSelections.first, snapshot.nextSelection)
        XCTAssertEqual(Set(snapshot.availableSelections.map(\.id)).count, snapshot.availableSelections.count)
        let queued = try XCTUnwrap(snapshot.availableSelections.dropFirst().first { $0.intent == "clarification" })
        let context = try XCTUnwrap(fixture.model.personalTasteQuestionResponseContext(for: queued))
        let sourceID = try XCTUnwrap(context.sourceEntryID)
        let source = try XCTUnwrap(fixture.model.diningEntry(id: sourceID))
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.choices(for: queued.facet).first)
        let updated = try XCTUnwrap(PersonalTasteInlineAnswer.applying(answer.id, to: source, context: context))
        assertSaved(fixture.model.savePersonalTasteQuestionResponse(updated, context: context), resolved: true)
        XCTAssertNil(fixture.model.personalTasteQuestionResponseContext(for: queued))
        try await waitForAnalysis(fixture.model)
        XCTAssertFalse(fixture.model.sensoryAnalysis.personalModel?.availableSelections.contains { $0.id == queued.id } ?? true)
    }

    @MainActor
    func testImmediateAnswerUndoRestoresQuestionAndRejectsChangedRecord() async throws {
        let fixture = try await makeFixture()
        defer { fixture.defaults.removePersistentDomain(forName: fixture.suite) }
        let updated = try XCTUnwrap(PersonalTasteInlineAnswer.applying("medium", to: fixture.source, context: fixture.context))
        assertSaved(fixture.model.savePersonalTasteQuestionResponse(updated, context: fixture.context), resolved: true)
        fixture.model.preparePersonalTasteAnswerUndo(before: fixture.source, context: fixture.context)
        XCTAssertTrue(fixture.model.undoPersonalTasteAnswer())
        XCTAssertEqual(fixture.model.diningEntry(id: fixture.source.id)?.sensorySelections, fixture.source.sensorySelections)
        XCTAssertEqual(fixture.model.personalTasteQuestionProgressByUser[fixture.userID]?[fixture.context.id]?.status, .active)
        XCTAssertNil(fixture.model.personalTasteAnswerUndo)
        try await waitForAnalysis(fixture.model)

        assertSaved(fixture.model.savePersonalTasteQuestionResponse(updated, context: fixture.context), resolved: true)
        fixture.model.preparePersonalTasteAnswerUndo(before: fixture.source, context: fixture.context)
        fixture.model.removeDiningEntry(id: fixture.source.id)
        XCTAssertFalse(fixture.model.undoPersonalTasteAnswer())
        XCTAssertNil(fixture.model.diningEntry(id: fixture.source.id))
    }

    @MainActor
    func testInlineAnswerUpdatesOnlyMissingFacetAndResolvesThroughExistingSave() async throws {
        let fixture = try await makeFixture()
        defer { fixture.defaults.removePersistentDomain(forName: fixture.suite) }
        let updated = try XCTUnwrap(PersonalTasteInlineAnswer.applying(
            "medium", to: fixture.source, context: fixture.context
        ))
        XCTAssertEqual(updated.sensorySelections?.first?.intensity, .medium)
        XCTAssertEqual(updated.sensorySelections?.first?.liking, fixture.source.sensorySelections?.first?.liking)
        XCTAssertEqual(updated.sensorySelections?.first?.target, .sauce)
        XCTAssertEqual(updated.sensorySelections?.first?.phase, .afterSwallow)
        let encoder = JSONEncoder()
        var before = try XCTUnwrap(JSONSerialization.jsonObject(with: encoder.encode(fixture.source)) as? [String: Any])
        var after = try XCTUnwrap(JSONSerialization.jsonObject(with: encoder.encode(updated)) as? [String: Any])
        before.removeValue(forKey: "sensorySelections")
        after.removeValue(forKey: "sensorySelections")
        XCTAssertEqual(before as NSDictionary, after as NSDictionary)
        assertSaved(fixture.model.savePersonalTasteQuestionResponse(updated, context: fixture.context), resolved: true)
        try await waitForAnalysis(fixture.model)
        XCTAssertEqual(fixture.model.diningEntries.count, 1)
        XCTAssertEqual(fixture.model.personalTasteQuestionProgressByUser[fixture.userID]?[fixture.context.id]?.status, .resolved)
    }

    @MainActor
    func testInlineAnswerRejectsInvalidValuesAndDoesNotOverwriteExistingAnswer() async throws {
        let fixture = try await makeFixture()
        defer { fixture.defaults.removePersistentDomain(forName: fixture.suite) }
        XCTAssertNil(PersonalTasteInlineAnswer.applying("unknown", to: fixture.source, context: fixture.context))
        let answered = try XCTUnwrap(PersonalTasteInlineAnswer.applying("medium", to: fixture.source, context: fixture.context))
        XCTAssertNil(PersonalTasteInlineAnswer.applying("strong", to: answered, context: fixture.context))
        XCTAssertNil(PersonalTasteInlineAnswer.applying("medium", to: .sample, context: fixture.context))
    }

    @MainActor
    func testInlineAnswerCannotConvertFutureExplorationIntoAnOldMealResponse() async throws {
        let fixture = try await makeFixture(exploration: true)
        defer { fixture.defaults.removePersistentDomain(forName: fixture.suite) }
        XCTAssertNil(PersonalTasteInlineAnswer.applying("light", to: fixture.source, context: fixture.context))
        assertUnresolved(fixture)
    }

    private struct Fixture {
        let suite: String
        let defaults: UserDefaults
        let model: AppModel
        let context: PersonalTasteQuestionResponseContext
        let source: DiningEntry
        let userID: String
    }
    private func selection(intensity: DiningSensorySelection.Intensity? = nil, target: DiningSensorySelection.Target = .sauce, phase: DiningSensorySelection.Phase = .afterSwallow) -> DiningSensorySelection {
        .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: .liked, intensity: intensity, target: target, phase: phase)
    }
    private func entry(id: UUID = UUID(), mealID: UUID? = nil, selections: [DiningSensorySelection], status: DiningEntryFeedbackStatus = .completed) -> DiningEntry {
        .init(id: id, mealID: mealID, restaurant: "기록한 식당", menu: "기록한 음식", date: Date(timeIntervalSince1970: 1_700_000_000), rating: 4, note: "", tasteExperienceIDs: selections.filter { $0.type == .bubble }.map(\.id), sensorySelections: selections, feedbackStatus: status)
    }
    @MainActor
    private func makeFixture(exploration: Bool = false) async throws -> Fixture {
        let suite = "tastebuddy.question-resolution.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        for _ in 0..<(exploration ? 3 : 1) {
            model.addDiningEntry(entry(selections: [selection(intensity: exploration ? .strong : nil)]))
        }
        try await waitForAnalysis(model)
        let personal = try XCTUnwrap(model.sensoryAnalysis.personalModel)
        let question = try XCTUnwrap(personal.nextSelection)
        XCTAssertEqual(question.attribute, "taste.sour")
        XCTAssertEqual(question.facet, "intensity")
        XCTAssertEqual(question.intent, exploration ? "exploration" : "clarification")
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        let source = try XCTUnwrap(model.diningEntries.first { context.sourceEntryID == nil || $0.id == context.sourceEntryID })
        if exploration {
            XCTAssertNil(context.sourceEntryID)
            XCTAssertEqual(question.proposedCondition?.dimension, "intensity")
            XCTAssertEqual(question.proposedCondition?.value, "weak")
        } else {
            XCTAssertEqual(context.sourceEntryID, source.id)
            XCTAssertEqual(context.sourceTarget, "sauce")
            XCTAssertEqual(context.sourcePhase, "after_swallow")
        }
        return .init(suite: suite, defaults: defaults, model: model, context: context, source: source, userID: personal.userID)
    }
    @MainActor
    private func assertUnresolved(_ f: Fixture, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertNotEqual(f.model.personalTasteQuestionProgressByUser[f.userID]?[f.context.selection.id]?.status, .resolved, file: file, line: line)
        XCTAssertTrue(f.model.shouldPresentPersonalTasteQuestion(id: f.context.selection.id, userID: f.userID), file: file, line: line)
    }
    private func assertSaved(_ result: PersonalTasteQuestionSaveResult, added: Bool = false, resolved: Bool, file: StaticString = #filePath, line: UInt = #line) {
        switch result {
        case .updated(let actual): XCTAssertFalse(added, file: file, line: line); XCTAssertEqual(actual, resolved, file: file, line: line)
        case .added(let actual): XCTAssertTrue(added, file: file, line: line); XCTAssertEqual(actual, resolved, file: file, line: line)
        case .sourceUnavailable: XCTFail("원출처가 존재하는 요청은 저장 결과를 반환해야 한다", file: file, line: line)
        }
    }
    @MainActor
    private func waitForAnalysis(_ model: AppModel) async throws {
        let clock = ContinuousClock(), deadline = clock.now.advanced(by: .seconds(10))
        while model.sensoryAnalysisIsUpdating && clock.now < deadline { try await Task.sleep(for: .milliseconds(10)) }
        XCTAssertFalse(model.sensoryAnalysisIsUpdating)
        XCTAssertNil(model.sensoryAnalysisError)
        XCTAssertEqual(model.sensoryAnalysis.actualApiCalls, 0)
    }

    @MainActor
    func testClarificationUnrelatedSweetnessSaveCannotResolveMissingSourIntensity() async throws {
        let f = try await makeFixture()
        defer { f.defaults.removePersistentDomain(forName: f.suite) }
        let sweet = DiningSensorySelection(id: "sweet-dense", type: .bubble, labelSnapshot: "밀도 있는 단맛", liking: .liked, intensity: .strong)
        let response = entry(id: f.source.id, mealID: f.source.mealID, selections: [selection(), sweet])
        assertSaved(f.model.savePersonalTasteQuestionResponse(response, context: f.context), resolved: false)
        try await waitForAnalysis(f.model)
        assertUnresolved(f)
        XCTAssertEqual(f.model.diningEntries.count, 1)
        XCTAssertEqual(f.model.diningEntries.first?.sensorySelections, response.sensorySelections)
    }

    @MainActor
    func testCapturedSaveCannotResolveEvenWhenRawSelectionContainsIntensity() async throws {
        let f = try await makeFixture()
        defer { f.defaults.removePersistentDomain(forName: f.suite) }
        let response = entry(id: f.source.id, mealID: f.source.mealID, selections: [selection(intensity: .medium)], status: .captured)
        assertSaved(f.model.savePersonalTasteQuestionResponse(response, context: f.context), resolved: false)
        try await waitForAnalysis(f.model)
        assertUnresolved(f)
    }

    @MainActor
    func testValidOriginalSourceCompletionUpdatesSameEntryAndResolvesWithActualEvidence() async throws {
        let f = try await makeFixture()
        defer { f.defaults.removePersistentDomain(forName: f.suite) }
        let chosen = selection(intensity: .medium)
        let response = entry(id: f.source.id, mealID: f.source.mealID, selections: [chosen])
        assertSaved(f.model.savePersonalTasteQuestionResponse(response, context: f.context), resolved: true)
        try await waitForAnalysis(f.model)
        XCTAssertEqual(f.model.diningEntries.count, 1)
        XCTAssertEqual(f.model.diningEntries.first?.id, f.source.id)
        XCTAssertEqual(f.model.diningEntries.first?.sensorySelections, [chosen])
        XCTAssertEqual(f.model.personalTasteQuestionProgressByUser[f.userID]?[f.context.selection.id]?.status, .resolved)
        XCTAssertTrue(f.model.sensoryAnalysis.observations.contains { $0.experienceID == f.source.id && $0.attribute == "taste.sour" && $0.kind == "sensory_intensity" && $0.value == .text("medium") && $0.target == "sauce" && $0.phase == "after_swallow" })
        let reopened = AppModel(defaults: f.defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForAnalysis(reopened)
        XCTAssertEqual(reopened.diningEntries.first?.sensorySelections, [chosen])
        XCTAssertFalse(reopened.shouldPresentPersonalTasteQuestion(id: f.context.selection.id, userID: f.userID))
    }

    @MainActor
    func testUnknownSelectionVersionValueAndLabelCannotResolveQuestion() async throws {
        var unknownID = selection(intensity: .medium); unknownID.id = "future-sour"
        var unknownValue = selection(intensity: .medium); unknownValue.intensity = .init(rawValue: "future-intensity")
        var unknownVersion = selection(intensity: .medium); unknownVersion.catalogVersion = "future-catalog/9"
        var wrongLabel = selection(intensity: .medium); wrongLabel.labelSnapshot = "다른 표현"
        for chosen in [unknownID, unknownValue, unknownVersion, wrongLabel] {
            let f = try await makeFixture()
            defer { f.defaults.removePersistentDomain(forName: f.suite) }
            let response = entry(id: f.source.id, mealID: f.source.mealID, selections: [chosen])
            assertSaved(f.model.savePersonalTasteQuestionResponse(response, context: f.context), resolved: false)
            try await waitForAnalysis(f.model)
            assertUnresolved(f)
            XCTAssertEqual(f.model.diningEntries.first?.sensorySelections, [chosen])
        }
    }

    @MainActor
    func testDifferentKnownTargetOrPhaseDoesNotAnswerOriginalScopedQuestion() async throws {
        for chosen in [selection(intensity: .medium, target: .wholeDish), selection(intensity: .medium, phase: .firstBite)] {
            let f = try await makeFixture()
            defer { f.defaults.removePersistentDomain(forName: f.suite) }
            let response = entry(id: f.source.id, mealID: f.source.mealID, selections: [chosen])
            assertSaved(f.model.savePersonalTasteQuestionResponse(response, context: f.context), resolved: false)
            try await waitForAnalysis(f.model)
            assertUnresolved(f)
        }
    }

    @MainActor
    func testDeletedOrDifferentOriginalEntryCannotBeResurrectedThroughQuestionSave() async throws {
        let f = try await makeFixture()
        defer { f.defaults.removePersistentDomain(forName: f.suite) }
        let other = entry(selections: [selection(intensity: .medium)])
        if case .sourceUnavailable = f.model.savePersonalTasteQuestionResponse(other, context: f.context) {} else { XCTFail("다른 레코드를 원질문 보완으로 저장하면 안 된다") }
        XCTAssertEqual(f.model.diningEntries, [f.source])
        f.model.removeDiningEntry(id: f.source.id)
        try await waitForAnalysis(f.model)
        let stale = entry(id: f.source.id, mealID: f.source.mealID, selections: [selection(intensity: .medium)])
        if case .sourceUnavailable = f.model.savePersonalTasteQuestionResponse(stale, context: f.context) {} else { XCTFail("삭제한 원기록을 되살리면 안 된다") }
        XCTAssertTrue(f.model.diningEntries.isEmpty)
        assertUnresolved(f)
    }

    @MainActor
    func testSameAttributeOnAnotherSelectionDoesNotResolveTheChosenSource() async throws {
        let f = try await makeFixture()
        defer { f.defaults.removePersistentDomain(forName: f.suite) }
        let observation = try XCTUnwrap(f.model.sensoryAnalysis.observations.first { $0.id == f.context.selection.responseSourceID })
        XCTAssertEqual(observation.experienceID, f.context.sourceEntryID)
        XCTAssertEqual(f.context.sourceSelectionEvidence?.selectionID, "sour-fresh")
        let other = DiningSensorySelection(id: "sour-soft-citrus", type: .bubble, labelSnapshot: "부드러운 과일 산미", liking: .liked, intensity: .strong, target: .sauce, phase: .afterSwallow)
        let wrong = entry(id: f.source.id, mealID: f.source.mealID, selections: [selection(), other])
        assertSaved(f.model.savePersonalTasteQuestionResponse(wrong, context: f.context), resolved: false)
        try await waitForAnalysis(f.model)
        assertUnresolved(f)
        let actual = entry(id: f.source.id, mealID: f.source.mealID, selections: [selection(intensity: .medium), other])
        assertSaved(f.model.savePersonalTasteQuestionResponse(actual, context: f.context), resolved: true)
    }

    @MainActor
    func testTextClarificationRequiresATextResponseForItsOriginalEvidence() async throws {
        let suite = "tastebuddy.text-question.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let source = DiningEntry(restaurant: "메모 식당", menu: "기록한 음식", rating: 4, note: "산미가 좋았어요.")
        model.addDiningEntry(source)
        try await waitForAnalysis(model)
        let question = try XCTUnwrap(model.sensoryAnalysis.personalModel?.nextSelection)
        XCTAssertEqual(question.facet, "intensity")
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        XCTAssertNil(context.sourceSelectionEvidence)
        let separate = DiningEntry(id: source.id, mealID: source.mealID, restaurant: source.restaurant, menu: source.menu, rating: 4, note: source.note,
            sensorySelections: [selection(intensity: .strong, target: .unspecified, phase: .unspecified)])
        assertSaved(model.savePersonalTasteQuestionResponse(separate, context: context), resolved: false)
        try await waitForAnalysis(model)
        let actual = DiningEntry(id: source.id, mealID: source.mealID, restaurant: source.restaurant, menu: source.menu, rating: 4,
            note: "산미가 강했어요. 산미가 좋았어요.", sensorySelections: [])
        assertSaved(model.savePersonalTasteQuestionResponse(actual, context: context), resolved: true)
    }

    @MainActor
    func testExplorationNeedsActualProposedIntensityInNewMealAndPreservesOriginalMeals() async throws {
        let f = try await makeFixture(exploration: true)
        defer { f.defaults.removePersistentDomain(forName: f.suite) }
        let originals = f.model.diningEntries
        let unrelated = entry(selections: [selection(intensity: .strong)])
        assertSaved(f.model.savePersonalTasteQuestionResponse(unrelated, context: f.context), added: true, resolved: false)
        try await waitForAnalysis(f.model)
        assertUnresolved(f)
        let actual = entry(selections: [selection(intensity: .light)])
        assertSaved(f.model.savePersonalTasteQuestionResponse(actual, context: f.context), added: true, resolved: true)
        try await waitForAnalysis(f.model)
        XCTAssertEqual(f.model.diningEntries.count, originals.count + 2)
        for original in originals { XCTAssertEqual(f.model.diningEntry(id: original.id), original) }
        XCTAssertEqual(f.model.personalTasteQuestionProgressByUser[f.userID]?[f.context.selection.id]?.status, .resolved)
        XCTAssertTrue(f.model.sensoryAnalysis.observations.contains { $0.experienceID == actual.id && $0.kind == "sensory_intensity" && $0.attribute == "taste.sour" && $0.value == .text("weak") })
    }

    @MainActor
    func testExplorationIntensityWithoutScopedLikingStaysOpenAndNewRecordCanBeClarified() async throws {
        let f = try await makeFixture(exploration: true)
        defer { f.defaults.removePersistentDomain(forName: f.suite) }
        let originals = f.model.diningEntries
        var intensityOnly = selection(intensity: .light)
        intensityOnly.liking = nil
        let otherScope = DiningSensorySelection(
            id: "sour-soft-citrus", type: .bubble, labelSnapshot: "부드러운 과일 산미",
            liking: .neutral, target: .wholeDish, phase: .firstBite
        )
        let incomplete = entry(selections: [intensityOnly, otherScope])
        assertSaved(f.model.savePersonalTasteQuestionResponse(incomplete, context: f.context), added: true, resolved: false)
        try await waitForAnalysis(f.model)
        assertUnresolved(f)
        XCTAssertEqual(f.model.diningEntry(id: incomplete.id)?.sensorySelections, [intensityOnly, otherScope])
        XCTAssertEqual(f.model.diningEntries.count, originals.count + 1)

        // 다른 대상·시점의 중립 응답을 약한 산미의 호감으로 합치지 않는다.
        XCTAssertFalse(f.model.sensoryAnalysis.personalModel?.units.contains {
            $0.experienceIDs.contains(incomplete.id.uuidString.lowercased())
                && $0.intensity == "weak" && $0.target == "sauce"
                && $0.phase == "after_swallow" && $0.liking == "neutral"
        } ?? false)
        let clarification = try XCTUnwrap(f.model.sensoryAnalysis.personalModel?.nextSelection)
        XCTAssertEqual(clarification.intent, "clarification")
        XCTAssertEqual(clarification.facet, "liking")
        let context = try XCTUnwrap(f.model.personalTasteQuestionResponseContext(for: clarification))
        XCTAssertEqual(context.sourceEntryID, incomplete.id)
        var answered = intensityOnly
        answered.liking = .neutral
        let saved = try XCTUnwrap(f.model.diningEntry(id: incomplete.id))
        let completion = entry(id: saved.id, mealID: saved.mealID, selections: [answered, otherScope])
        assertSaved(f.model.savePersonalTasteQuestionResponse(completion, context: context), resolved: true)
        try await waitForAnalysis(f.model)
        XCTAssertEqual(f.model.diningEntries.count, originals.count + 1)
        XCTAssertEqual(f.model.diningEntry(id: saved.id)?.sensorySelections, [answered, otherScope])
        XCTAssertTrue(f.model.sensoryAnalysis.personalModel?.units.contains {
            $0.experienceIDs.contains(saved.id.uuidString.lowercased())
                && $0.intensity == "weak" && $0.target == "sauce"
                && $0.phase == "after_swallow" && $0.liking == "neutral"
        } ?? false)
        for original in originals { XCTAssertEqual(f.model.diningEntry(id: original.id), original) }
    }

    @MainActor
    func testExplorationCannotOverwriteExistingSourceEntryAsThoughItWereANewMeal() async throws {
        let f = try await makeFixture(exploration: true)
        defer { f.defaults.removePersistentDomain(forName: f.suite) }
        let originals = f.model.diningEntries
        let overwrite = entry(id: f.source.id, mealID: f.source.mealID, selections: [selection(intensity: .light)])
        _ = f.model.savePersonalTasteQuestionResponse(overwrite, context: f.context)
        try await waitForAnalysis(f.model)
        XCTAssertEqual(f.model.diningEntries, originals)
        assertUnresolved(f)
    }
}
