import XCTest
@testable import TasteBuddy

/// 독립적인 합성 경험. 단위의 정답은 제품 계약에서 정하며 실제 사용자 자료가 아니다.
final class HomeTasteQuestionsIntegrationTests: XCTestCase {
    private func source(meal: UUID? = nil, restaurant: String = "합성 식당", liking: DiningSensorySelection.Liking? = nil) -> DiningEntry {
        .init(mealID: meal, restaurant: restaurant, menu: "레몬 파스타",
              observedAt: Date(timeIntervalSince1970: 1_700_000_000), savedAt: Date(timeIntervalSince1970: 1_700_000_100),
              rating: 5, note: "", sensorySelections: [
                .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: liking, target: .sauce, phase: .afterSwallow)
              ], feedbackStatus: .completed)
    }

    private func replacing<T: Encodable>(_ entry: DiningEntry, _ key: String, with value: T) throws -> DiningEntry {
        let encoder = JSONEncoder()
        var fields = try JSONSerialization.jsonObject(with: encoder.encode(entry)) as! [String: Any]
        fields[key] = try JSONSerialization.jsonObject(with: encoder.encode(value), options: .fragmentsAllowed)
        return try JSONDecoder().decode(DiningEntry.self, from: JSONSerialization.data(withJSONObject: fields))
    }

    @MainActor private func wait(_ model: AppModel) async throws {
        for _ in 0..<600 {
            if !model.sensoryAnalysisIsUpdating { XCTAssertNil(model.sensoryAnalysisError); return }
            try await Task.sleep(for: .milliseconds(50))
        }
        XCTFail("분석 완료 시간 초과")
    }

    @MainActor private func app(_ entries: [DiningEntry], now: @escaping () -> Date = { .now }) async throws -> (AppModel, UserDefaults) {
        let suite = "home-question-lifecycle.\(UUID())", defaults = UserDefaults(suiteName: suite)!
        addTeardownBlock { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository(), now: now)
        for entry in entries { model.addDiningEntry(entry) }
        try await wait(model)
        return (model, defaults)
    }

    @MainActor func testQ4LegacyCanAnswerInlineAndUndoWithoutRevivingExplicitEmptySelections() async throws {
        var legacy = try replacing(source(), "sensorySelections", with: Optional<[DiningSensorySelection]>.none)
        legacy = try replacing(legacy, "tasteExperienceIDs", with: ["sour-fresh"])
        let (model, _) = try await app([legacy])
        let question = try XCTUnwrap(model.sensoryAnalysis.personalModel?.availableSelections.first { $0.facet == "liking" })
        let observation = model.sensoryAnalysis.observations.first { $0.id == question.responseSourceID }
        let availability = PersonalTasteInlineAnswer.availability(selection: question, observation: observation, entry: model.diningEntry(id: legacy.id))
        XCTAssertEqual(availability.choices.map(\.id), ["liked", "neutral", "disliked"])
        XCTAssertNil(model.diningEntry(id: legacy.id)?.sensorySelections)
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: legacy, context: context))
        XCTAssertEqual(answer.sensorySelections?.first?.liking, .liked)
        XCTAssertEqual(answer.tasteExperienceIDs, legacy.tasteExperienceIDs)
        XCTAssertEqual(answer.note, legacy.note)
        XCTAssertEqual(answer.mealID, legacy.mealID)
        XCTAssertEqual(model.savePersonalTasteQuestionResponse(answer, context: context), .updated(resolved: true))
        model.preparePersonalTasteAnswerUndo(before: legacy, context: context)
        try await wait(model)
        XCTAssertFalse(model.sensoryAnalysis.personalModel!.availableSelections.contains { $0.id == question.id })
        XCTAssertTrue(model.undoPersonalTasteAnswer())
        XCTAssertNil(model.diningEntry(id: legacy.id)?.sensorySelections)
        try await wait(model)
        XCTAssertTrue(model.sensoryAnalysis.personalModel!.availableSelections.contains { $0.id == question.id })
        legacy = try replacing(legacy, "sensorySelections", with: [DiningSensorySelection]())
        XCTAssertTrue(try SensoryAnalysisEngine.analyze(entries: [legacy]).observations.isEmpty)
        XCTAssertTrue(PersonalTasteInlineAnswer.availability(selection: question, observation: observation, entry: legacy).choices.isEmpty)
    }

    @MainActor func testQ5InheritedTargetAndPhaseApplyOnlyToOriginalTagFacet() async throws {
        var original = source()
        original = try replacing(original, "sensorySelections", with: original.sensorySelections! + [.init(id: "balance-acid-cleans", type: .detailTag, labelSnapshot: "산미가 정리함", relatedBubbleID: "sour-fresh")])
        let (model, _) = try await app([original])
        let observations = model.sensoryAnalysis.observations
        let question = try XCTUnwrap(model.sensoryAnalysis.personalModel?.availableSelections.first { q in
            q.facet == "liking" && observations.first { $0.id == q.responseSourceID }?.selectionEvidence?.type == "detailTag"
        })
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        XCTAssertEqual(context.sourceTarget, "sauce"); XCTAssertEqual(context.sourcePhase, "after_swallow")
        let before = try XCTUnwrap(model.diningEntry(id: original.id))
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: before, context: context))
        XCTAssertEqual(answer.sensorySelections?.first, before.sensorySelections?.first)
        XCTAssertEqual(answer.sensorySelections?.last?.target, .unspecified)
        XCTAssertEqual(answer.sensorySelections?.last?.phase, .unspecified)
        XCTAssertEqual(answer.sensorySelections?.last?.liking, .liked)
        XCTAssertEqual(model.savePersonalTasteQuestionResponse(answer, context: context), .updated(resolved: true))
        var changedSelections = before.sensorySelections!; changedSelections[0].target = .broth
        let parentChanged = try replacing(before, "sensorySelections", with: changedSelections)
        XCTAssertNil(PersonalTasteInlineAnswer.applying("liked", to: parentChanged, context: context))
    }

    func testQ6IntrinsicStrengthIsNotMissingAndQ7ConflictRequiresEditing() throws {
        let catalog = try XCTUnwrap(SensoryAnalysisEngine.contract?.selectionCatalog)
        let intrinsic = try XCTUnwrap(catalog.entries.first { $0.intrinsicIntensity != nil && !$0.attribute.hasSuffix(".unspecified") })
        var original = source()
        original = try replacing(original, "sensorySelections", with: [DiningSensorySelection(id: intrinsic.id, type: .init(rawValue: intrinsic.type), labelSnapshot: intrinsic.label, liking: .liked)])
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [original])
        XCTAssertFalse(snapshot.personalModel!.availableSelections.contains { $0.facet == "intensity" && $0.intent == "clarification" })
        var weak = source().sensorySelections![0], strong = weak
        weak.intensity = .light; strong.intensity = .strong
        original = try replacing(original, "sensorySelections", with: [weak, strong])
        let conflict = try SensoryAnalysisEngine.analyze(entries: [original])
        XCTAssertFalse(conflict.unresolved.isEmpty)
        XCTAssertFalse(conflict.personalModel!.availableSelections.contains { $0.facet == "intensity" })
        let matrix = TasteIntensityLikingMatrix.build(observations: conflict.observations, attribute: "taste.sour", reference: nil,
            unresolved: conflict.unresolved, catalog: catalog)
        XCTAssertEqual(matrix.conflictEntryIDs, [original.id])
        XCTAssertTrue(matrix.cells.allSatisfy { $0.entryIDs.isEmpty })
    }

    @MainActor func testQ9NonEvaluationResponsesAndQ10ExposureDoNotCreateEvidence() async throws {
        var clock = Date.now
        let (model, store) = try await app([source()], now: { clock })
        let original = model.diningEntries, snapshot = model.sensoryAnalysis
        let question = try XCTUnwrap(snapshot.personalModel?.nextSelection), user = snapshot.personalModel!.userID
        model.recordPersonalTasteQuestionExposure(id: question.id, userID: user)
        XCTAssertEqual(model.diningEntries, original); XCTAssertEqual(model.sensoryAnalysis, snapshot)
        model.deferPersonalTasteQuestion(id: question.id, userID: user, cannotRecall: true)
        XCTAssertFalse(model.shouldPresentPersonalTasteQuestion(id: question.id, userID: user))
        XCTAssertEqual(model.diningEntries, original); XCTAssertEqual(model.sensoryAnalysis, snapshot)
        let reopened = AppModel(defaults: store, authRepository: FixtureBackendAuthRepository(), now: { clock })
        XCTAssertFalse(reopened.shouldPresentPersonalTasteQuestion(id: question.id, userID: user))
        clock = clock.addingTimeInterval(model.questionPresentationPolicy.cannotRecallInterval + 1)
        XCTAssertTrue(model.shouldPresentPersonalTasteQuestion(id: question.id, userID: user))
        model.deferPersonalTasteQuestion(id: question.id, userID: user)
        XCTAssertFalse(model.shouldPresentPersonalTasteQuestion(id: question.id, userID: user))
        model.dismissPersonalTasteQuestion(id: question.id, userID: user)
        clock = clock.addingTimeInterval(365 * 86400)
        XCTAssertFalse(model.shouldPresentPersonalTasteQuestion(id: question.id, userID: user))
    }

    @MainActor func testQ11AccountGenerationAndQ12FailedPersistenceCannotResolve() async throws {
        let (model, _) = try await app([source()])
        let question = try XCTUnwrap(model.sensoryAnalysis.personalModel?.nextSelection)
        var context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        let before = try XCTUnwrap(model.diningEntry(id: context.sourceEntryID!))
        var answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: before, context: context))
        answer.observedAt = Date(timeIntervalSinceReferenceDate: .nan)
        XCTAssertEqual(model.savePersonalTasteQuestionResponse(answer, context: context), .sourceUnavailable)
        XCTAssertEqual(model.diningEntry(id: before.id), before)
        XCTAssertNotEqual(model.personalTasteQuestionProgressByUser[context.userID]?[question.id]?.status, .resolved)
        context.accountGeneration = UUID()
        XCTAssertEqual(model.savePersonalTasteQuestionResponse(before, context: context), .sourceUnavailable)
        XCTAssertEqual(model.diningEntry(id: before.id), before)
    }

    @MainActor func testQ12RestartAfterSourceSaveRecoversWithoutCompletionHistory() async throws {
        let (model, store) = try await app([source()])
        let question = try XCTUnwrap(model.sensoryAnalysis.personalModel?.nextSelection)
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        let original = try XCTUnwrap(model.diningEntry(id: context.sourceEntryID!))
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: original, context: context))
        // 원본 저장 이후 질문 이력을 쓰기 전에 중단된 상태를 만든다.
        XCTAssertTrue(model.updateDiningEntry(answer, expected: original))
        XCTAssertNotEqual(model.personalTasteQuestionProgressByUser[context.userID]?[question.id]?.status, .resolved)
        let reopened = AppModel(defaults: store, authRepository: FixtureBackendAuthRepository())
        try await wait(reopened)
        XCTAssertEqual(reopened.diningEntry(id: original.id)?.sensorySelections?.first?.liking, .liked)
        XCTAssertFalse(reopened.sensoryAnalysis.personalModel!.availableSelections.contains { $0.id == question.id })
        XCTAssertTrue(reopened.sensoryAnalysis.observations.contains { $0.experienceID == original.id && $0.kind == "attribute_liking" && $0.value == .text("positive") })
    }

    @MainActor func testQ13UndoRejectsLaterEditsAndQ18OnlyAnsweredFacetDisappears() async throws {
        let (model, _) = try await app([source()])
        let question = try XCTUnwrap(model.sensoryAnalysis.personalModel?.nextSelection)
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        let before = try XCTUnwrap(model.diningEntry(id: context.sourceEntryID!))
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: before, context: context))
        XCTAssertEqual(model.savePersonalTasteQuestionResponse(answer, context: context), .updated(resolved: true))
        model.preparePersonalTasteAnswerUndo(before: before, context: context)
        try await wait(model)
        let next = try XCTUnwrap(model.sensoryAnalysis.personalModel?.availableSelections.first)
        XCTAssertEqual(next.facet, "intensity"); XCTAssertNotEqual(next.id, question.id)
        XCTAssertEqual(next.sourceExperienceID, question.sourceExperienceID)
        var changed = try XCTUnwrap(model.diningEntry(id: before.id)); changed.note = "새 회고 보존"
        model.updateDiningEntry(changed)
        XCTAssertFalse(model.undoPersonalTasteAnswer())
        XCTAssertEqual(model.diningEntry(id: before.id)?.note, "새 회고 보존")
    }

    @MainActor func testQ17LegacyFamilyHistoryDefersOldSourcesButNotNewExperience() async throws {
        let (model, store) = try await app([source()])
        let q = try XCTUnwrap(model.sensoryAnalysis.personalModel?.nextSelection), user = model.sensoryAnalysis.personalModel!.userID
        let family = try XCTUnwrap(q.familyID)
        model.dismissPersonalTasteQuestion(id: family, userID: user)
        let reopened = AppModel(defaults: store, authRepository: FixtureBackendAuthRepository())
        try await wait(reopened)
        XCTAssertNotNil(reopened.sensoryAnalysis.personalModel?.availableSelections.first { $0.id == q.id })
        XCTAssertFalse(reopened.shouldPresentPersonalTasteQuestion(id: q.id, userID: user))
        let fresh = try replacing(source(), "savedAt", with: Date.now.addingTimeInterval(10))
        reopened.addDiningEntry(fresh); try await wait(reopened)
        let candidate = try XCTUnwrap(reopened.sensoryAnalysis.personalModel?.availableSelections.first { $0.sourceExperienceID == fresh.id.uuidString.lowercased() })
        XCTAssertTrue(reopened.shouldPresentPersonalTasteQuestion(id: candidate.id, userID: user))
    }

    @MainActor func testQ17UnknownLegacyDatePreservesTemporarySuppressionWithoutInventingResolution() async throws {
        let legacy = try replacing(source(), "savedAt", with: Optional<Date>.none)
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [legacy])
        let question = try XCTUnwrap(snapshot.personalModel?.nextSelection)
        let family = try XCTUnwrap(question.familyID), user = snapshot.personalModel!.userID
        let suite = "legacy-question-unknown-date.\(UUID())", store = UserDefaults(suiteName: suite)!
        defer { store.removePersistentDomain(forName: suite) }
        store.set(try JSONEncoder().encode([legacy]), forKey: "tastebuddy.ios.dining-entries.v1")
        let history = PersonalTasteQuestionProgress(questionID: family, firstExposedAt: .now, status: .dismissed, statusChangedAt: .now)
        store.set(try JSONEncoder().encode([user: [family: history]]), forKey: "tastebuddy.ios.personal-taste-question-progress.v1")
        let model = AppModel(defaults: store, authRepository: FixtureBackendAuthRepository())
        try await wait(model)
        XCTAssertEqual(model.diningEntry(id: legacy.id), legacy)
        XCTAssertEqual(model.personalTasteQuestionProgressByUser[user]?[question.id]?.status, .deferred)
        XCTAssertFalse(model.shouldPresentPersonalTasteQuestion(id: question.id, userID: user))
        XCTAssertTrue(model.sensoryAnalysis.personalModel!.availableSelections.contains { $0.id == question.id })
    }

    func testZeroEqualCountsUnknownDatesAndCompositionDenominators() throws {
        XCTAssertEqual(HomeArchiveChart.heightFraction(0, maximum: 0), 0)
        XCTAssertEqual(HomeArchiveChart.heightFraction(0, maximum: 3), 0)
        XCTAssertEqual(HomeArchiveChart.heightFraction(3, maximum: 3), 1)
        var a = source(); let b = source(restaurant: "다른 식당")
        a.mealTime = .init(source: .confirmed, start: a.observedAt, confirmedAt: a.savedAt)
        let cards = HomeArchiveMetricsEngine.sections(entries: [a, b], snapshot: .empty).flatMap(\.cards)
        let timeline = try XCTUnwrap(cards.first { $0.id == "meals" }?.data.archiveChart)
        XCTAssertEqual(timeline.total, 1); XCTAssertEqual(timeline.supplements.first?.entryIDs, [b.id])
        for key in ["menus", "restaurants"] {
            let chart = try XCTUnwrap(cards.first { $0.id == key }?.data.archiveChart)
            XCTAssertEqual(chart.total, 2)
            XCTAssertEqual(Set(chart.segments.flatMap(\.entryIDs)), [a.id, b.id])
        }
    }

    func testMatrixPairsOnlySameSelectionAndScopeWithoutFillingMissingValues() throws {
        var a = source(liking: .liked), b = source(liking: .disliked), missing = source()
        var aSelections = a.sensorySelections!, bSelections = b.sensorySelections!
        aSelections[0].intensity = .strong; bSelections[0].intensity = .strong
        a = try replacing(a, "sensorySelections", with: aSelections); b = try replacing(b, "sensorySelections", with: bSelections)
        missing = try replacing(missing, "overallEvaluation", with: DiningOverallEvaluation(response: .liked))
        var missingSelections = missing.sensorySelections!; missingSelections[0].intensity = .medium
        missing = try replacing(missing, "sensorySelections", with: missingSelections)
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [a, b, missing])
        let matrix = TasteIntensityLikingMatrix.build(observations: snapshot.observations, attribute: "taste.sour", reference: nil)
        XCTAssertEqual(matrix.cells.first { $0.id == "strong:positive" }?.entryIDs, [a.id])
        XCTAssertEqual(matrix.cells.first { $0.id == "strong:negative" }?.entryIDs, [b.id])
        XCTAssertEqual(matrix.unknownEntryIDs, [missing.id])
        XCTAssertTrue(matrix.conflictEntryIDs.isEmpty)
        XCTAssertEqual(matrix.cells.first { $0.id == "medium:positive" }?.entryIDs, [])
    }

    func testM1ThroughM9AndC1KeepOriginalMeaningAndCorrectionScope() throws {
        let notes = ["맛있었다.", "", "전체적으로 맛있었지만 산미는 강해서 아쉬웠다.",
            "산미가 강해서 좋았다. 전체적으로도 맛있었다.",
            "작년에 먹은 사진을 보고 적는다. 맛있었던 것 같지만 날짜와 이유는 기억나지 않는다.", "",
            "산미가 또렷했다. 전체적으로 별로였다.",
            "오늘 저녁 코스 마지막에 먹었다. 이미 배가 불렀고, 소스가 오래 남아 부담스러웠다.",
            "오늘은 배고픈 점심이었다. 소스가 오래 남았지만 고소해서 좋았다."]
        var entries = notes.enumerated().map { index, note in
            DiningEntry(restaurant: "합성 식당", menu: index == 6 ? "세비체" : index >= 7 ? "크림 파스타" : "레몬 파스타",
                date: Date(timeIntervalSince1970: 1_700_000_000 + Double(index) * 86400), rating: 5, note: note,
                sensorySelections: index == 1 ? [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미")] : [], feedbackStatus: .completed)
        }
        var generated = try JSONSerialization.jsonObject(with: JSONEncoder().encode(entries[5])) as! [String: Any]
        generated["tbaAnalysisSnapshot"] = ["summary": "깔끔한 마무리가 좋았어요", "confidence": 0.5,
            "detailTags": [], "foodKnowledgeMatchIds": [], "foodOnMatchIds": [], "generatedAt": "2026-06-20T12:00:00Z",
            "lexiconCandidateIds": [], "source": "synthetic-generated-interpretation", "subject": "레몬 파스타",
            "tasteBubbles": [], "tbaSignalIds": [], "version": "synthetic-test"] as [String: Any]
        entries[5] = try JSONDecoder().decode(DiningEntry.self, from: JSONSerialization.data(withJSONObject: generated))
        let before = try SensoryAnalysisEngine.analyze(entries: entries)
        func has(_ snapshot: SensoryAnalysisSnapshot, _ index: Int, _ kind: String, _ attribute: String?, _ value: String) -> Bool {
            snapshot.observations.contains { $0.experienceID == entries[index].id && $0.kind == kind && $0.attribute == attribute && $0.value.text == value }
        }
        XCTAssertTrue(has(before, 0, "overall_liking", nil, "positive"))
        XCTAssertFalse(has(before, 0, "attribute_liking", "taste.sour", "positive"))
        XCTAssertFalse(before.observations.contains { $0.experienceID == entries[1].id && $0.kind == "attribute_liking" })
        XCTAssertTrue(has(before, 2, "attribute_liking", "taste.sour", "negative"))
        XCTAssertTrue(has(before, 3, "attribute_liking", "taste.sour", "positive"))
        XCTAssertFalse(has(before, 6, "attribute_liking", "taste.sour", "negative"))
        XCTAssertFalse(before.observations.contains { $0.experienceID == entries[5].id && $0.kind.contains("liking") })
        XCTAssertFalse(before.observations.contains { $0.phrase.contains("깔끔한 마무리가 좋았어요") })
        let chart = HomeArchiveMetricsEngine.sections(entries: entries, snapshot: before).flatMap(\.cards).first { $0.id == "overall" }!.data.archiveChart!
        XCTAssertEqual(chart.total, 0, "원문의 3단계를 직접 5단계 응답으로 승격하지 않는다")
        XCTAssertEqual(HomeArchiveVisualizationEngine.timeline(entries: entries, calendar: .current).total, 0)
        let oldDate = entries[6].date
        entries[6].note = "산미는 좋았다. 싫었던 것은 생선 비린 향이었다. 앞의 별로였다는 말은 전체 평가다."
        let after = try SensoryAnalysisEngine.analyze(entries: entries)
        XCTAssertEqual(entries[6].date, oldDate)
        XCTAssertTrue(has(after, 6, "attribute_liking", "taste.sour", "positive"))
        XCTAssertFalse(has(after, 6, "attribute_liking", "taste.sour", "negative"))
        XCTAssertTrue(has(after, 2, "attribute_liking", "taste.sour", "negative"))
    }

    func testConflictingDuplicateExperienceCannotDependOnInputOrder() throws {
        let a = source(liking: .liked)
        var selections = a.sensorySelections!; selections[0].liking = .disliked
        let conflict = try replacing(a, "sensorySelections", with: selections)
        let forward = try SensoryAnalysisEngine.analyze(entries: [a, conflict])
        let reverse = try SensoryAnalysisEngine.analyze(entries: [conflict, a])
        XCTAssertEqual(forward, reverse); XCTAssertTrue(forward.observations.isEmpty)
        XCTAssertEqual(try SensoryAnalysisEngine.analyze(entries: [a, a]), try SensoryAnalysisEngine.analyze(entries: [a]))
        XCTAssertEqual(HomeArchiveIdentity.entries([a, conflict], asOf: .now), [])
    }

    func testQ16EveryAnswerableQuestionRemainsAvailableWithoutAMenuBatchLimit() throws {
        let entries = (0..<5).map { source(restaurant: "서로 다른 식당 \($0)") }
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        let queue = PersonalTasteInlineAnswer.answerableQuestions(
            snapshot.personalModel!.availableSelections, observations: snapshot.observations, entries: entries
        )
        XCTAssertEqual(queue.count, 5)
        XCTAssertEqual(Set(queue.compactMap(\.sourceExperienceID)), Set(entries.map { $0.id.uuidString.lowercased() }))
        XCTAssertEqual(PersonalTasteQuestionList.groups(
            questions: queue, observations: snapshot.observations, entries: entries
        ).flatMap(\.questions).map(\.id), queue.map(\.id))
    }

    func testSafeSimulationOptionsRequireTheActualLegacySelectionAndMatchInlineStorage() throws {
        let entry = source()
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [entry])
        let observation = try XCTUnwrap(snapshot.observations.first { $0.kind == "sensory_presence" })
        let record = PersonalTasteModelRecord(observationId: observation.id, userId: "owner", experienceId: entry.id.uuidString,
            kind: observation.kind, attribute: observation.attribute, value: observation.value, target: observation.target,
            phase: observation.phase, selectionEvidence: observation.selectionEvidence)
        XCTAssertEqual(PersonalTasteInlineAnswer.safeSemanticAnswers(record: record, facet: "liking", entry: entry), ["positive", "neutral", "negative"])
        let legacy = try replacing(entry, "sensorySelections", with: Optional<[DiningSensorySelection]>.none)
        XCTAssertTrue(PersonalTasteInlineAnswer.safeSemanticAnswers(record: record, facet: "liking", entry: legacy).isEmpty)
        let restored = try replacing(legacy, "tasteExperienceIDs", with: ["sour-fresh"])
        let restoredSnapshot = try SensoryAnalysisEngine.analyze(entries: [restored])
        let restoredObservation = try XCTUnwrap(restoredSnapshot.observations.first { $0.kind == "sensory_presence" })
        let restoredRecord = PersonalTasteModelRecord(observationId: restoredObservation.id, userId: "owner", experienceId: restored.id.uuidString,
            kind: restoredObservation.kind, attribute: restoredObservation.attribute, value: restoredObservation.value,
            target: restoredObservation.target, phase: restoredObservation.phase, selectionEvidence: restoredObservation.selectionEvidence)
        XCTAssertEqual(PersonalTasteInlineAnswer.safeSemanticAnswers(record: restoredRecord, facet: "liking", entry: restored), ["positive", "neutral", "negative"])
    }

    func testAnswerCardsExcludeReviewRawAndExplorationWithoutDeletingTheirEvidence() throws {
        let direct = source()
        let raw = DiningEntry(restaurant: "원문 식당", menu: "원문 국물", date: .now, rating: 0,
            note: "산미가 강했다.", sensorySelections: [], feedbackStatus: .completed)
        var conflicting = direct.sensorySelections![0]
        conflicting.liking = .liked
        var opposite = conflicting; opposite.liking = .disliked
        let conflict = try replacing(source(restaurant: "충돌 식당"), "sensorySelections", with: [conflicting, opposite])
        let entries = [raw, conflict, direct]
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        var questions = snapshot.personalModel!.availableSelections
        XCTAssertTrue(questions.contains { $0.intent == "source_review" })
        XCTAssertTrue(questions.contains { $0.sourceExperienceID == raw.id.uuidString.lowercased() })
        questions.append(.init(id: "future-exploration", attribute: "taste.sour", label: "산미", facet: "intensity", question: "다음 식사", reason: "",
            evidenceIDs: [], mealIDs: [], createsEvidence: false, intent: "exploration", proposedCondition: nil, unobserved: true))
        let answerable = PersonalTasteInlineAnswer.answerableQuestions(questions, observations: snapshot.observations, entries: entries)
        XCTAssertFalse(answerable.isEmpty)
        XCTAssertTrue(answerable.allSatisfy { $0.sourceExperienceID == direct.id.uuidString.lowercased() })
        XCTAssertFalse(snapshot.unresolved.isEmpty)
        XCTAssertEqual(PersonalTasteInlineAnswer.answerableQuestions(questions, observations: snapshot.observations, entries: [raw, conflict]), [])
        XCTAssertFalse(try SensoryAnalysisEngine.analyze(entries: [raw]).observations.isEmpty)
    }

    func testLegacyAnswerPreservesOtherSelectionsUnknownIDsAndOriginalFields() throws {
        var legacy = try replacing(source(), "sensorySelections", with: Optional<[DiningSensorySelection]>.none)
        legacy = try replacing(legacy, "tasteExperienceIDs", with: ["sour-fresh", "unknown-legacy-bubble"])
        legacy = try replacing(legacy, "detailTagIDs", with: ["unknown-legacy-tag"])
        legacy.note = "원래 기록 메모"
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [legacy])
        let question = try XCTUnwrap(snapshot.personalModel!.availableSelections.first { $0.attribute == "taste.sour" && $0.facet == "liking" })
        let observation = try XCTUnwrap(snapshot.observations.first { $0.id == question.responseSourceID })
        let context = PersonalTasteQuestionResponseContext(selection: question, userID: "local-owner", sourceEntryID: legacy.id,
            sourceTarget: observation.target, sourcePhase: observation.phase, sourceReference: observation.reference,
            entryIDsAtStart: [legacy.id], mealIDsAtStart: [legacy.mealID], sourceSelectionEvidence: observation.selectionEvidence)
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("neutral", to: legacy, context: context))
        let effective = SensoryAnalysisEngine.effectiveSelections(for: legacy, catalog: SensoryAnalysisEngine.contract?.selectionCatalog)
        XCTAssertEqual(Array(answer.sensorySelections!.dropFirst()), Array(effective.dropFirst()))
        let encoder = JSONEncoder()
        var before = try JSONSerialization.jsonObject(with: encoder.encode(legacy)) as! [String: Any]
        var after = try JSONSerialization.jsonObject(with: encoder.encode(answer)) as! [String: Any]
        before.removeValue(forKey: "sensorySelections"); after.removeValue(forKey: "sensorySelections")
        XCTAssertEqual(before as NSDictionary, after as NSDictionary)
        let reparsed = try SensoryAnalysisEngine.analyze(entries: [answer])
        XCTAssertEqual(reparsed.unresolved, snapshot.unresolved)
        XCTAssertEqual(reparsed.observations.filter { $0.kind != "attribute_liking" }, snapshot.observations)
        XCTAssertEqual(reparsed.observations.filter { $0.kind == "attribute_liking" }.map(\.value), [.text("neutral")])
        let duplicate = try replacing(legacy, "tasteExperienceIDs", with: ["sour-fresh", "sour-fresh"])
        XCTAssertNil(PersonalTasteInlineAnswer.applying("liked", to: duplicate, context: context))
    }

    func testLegacyInlineAnswerDatesOnlyTheNewResponseAndPreservesCorrectionHistory() throws {
        var legacy = try replacing(source(), "sensorySelections", with: Optional<[DiningSensorySelection]>.none)
        legacy = try replacing(legacy, "tasteExperienceIDs", with: ["sour-fresh"])
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [legacy])
        let question = try XCTUnwrap(snapshot.personalModel!.availableSelections.first { $0.facet == "liking" })
        let observation = try XCTUnwrap(snapshot.observations.first { $0.id == question.responseSourceID })
        let context = PersonalTasteQuestionResponseContext(selection: question, userID: "local-owner", sourceEntryID: legacy.id,
            sourceTarget: observation.target, sourcePhase: observation.phase, sourceReference: observation.reference,
            entryIDsAtStart: [legacy.id], mealIDsAtStart: [legacy.mealID], sourceSelectionEvidence: observation.selectionEvidence)
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: legacy, context: context))
        let answeredAt = legacy.savedAt!.addingTimeInterval(86400)
        let saved = try answer.preparedForUpdate(previous: legacy, at: answeredAt)
        let after = try SensoryAnalysisEngine.analyze(entries: [saved])
        XCTAssertEqual(after.observations.first { $0.kind == "sensory_presence" }?.knownAt, observation.knownAt)
        XCTAssertEqual(after.observations.first { $0.kind == "attribute_liking" }?.knownAt, answeredAt)
        XCTAssertEqual(saved.memoryCorrections?.last?.before["sensorySelections"], .null)
        // 뒤에 레거시 ID만 수정해도 앞선 변환 당시의 출처로 시간을 비교한다.
        let later = try replacing(saved, "tasteExperienceIDs", with: ["different-legacy-id"])
            .preparedForUpdate(previous: saved, at: answeredAt.addingTimeInterval(3600))
        XCTAssertEqual(later.knownAt(sourceField: observation.sourceField), observation.knownAt)
        let undone = try legacy.preparedForUpdate(previous: saved, at: answeredAt.addingTimeInterval(7200))
        XCTAssertNil(undone.sensorySelections)
        XCTAssertEqual(undone.knownAt(sourceField: observation.sourceField), observation.knownAt)
        XCTAssertEqual(undone.memoryCorrections?.first?.before["sensorySelections"], .null)
        let cleared = try replacing(saved, "sensorySelections", with: [DiningSensorySelection]())
            .preparedForUpdate(previous: saved, at: answeredAt.addingTimeInterval(7200))
        XCTAssertTrue(cleared.memoryCorrections!.allSatisfy { $0.before["sensorySelections"] == nil })
        XCTAssertTrue(try SensoryAnalysisEngine.analyze(entries: [cleared]).observations.isEmpty)
    }

    @MainActor func testCachedHomePresentationInvalidatesOnRevisionAndKeepsRawMemoryReadable() async throws {
        let original = try replacing(source(), "overallEvaluation", with: DiningOverallEvaluation(response: .liked))
        let (model, _) = try await app([original])
        let chart = try XCTUnwrap(model.homeArchivePresentation?.sections.flatMap(\.cards).first { $0.id == "overall" }?.data.archiveChart)
        XCTAssertEqual(chart.segments.first { $0.id == "liked" }?.count, 1)
        let changed = try replacing(model.diningEntry(id: original.id)!, "overallEvaluation", with: DiningOverallEvaluation(response: .disliked))
        model.updateDiningEntry(changed)
        XCTAssertNil(model.homeArchivePresentation)
        XCTAssertEqual(model.diningEntry(id: original.id)?.overallEvaluation?.responseValue, .disliked)
        try await wait(model)
        let revised = try XCTUnwrap(model.homeArchivePresentation?.sections.flatMap(\.cards).first { $0.id == "overall" }?.data.archiveChart)
        XCTAssertEqual(revised.segments.first { $0.id == "liked" }?.count, 0)
        XCTAssertEqual(revised.segments.first { $0.id == "disliked" }?.count, 1)
        model.removeDiningEntry(id: original.id)
        XCTAssertNil(model.homeArchivePresentation)
        try await wait(model)
        XCTAssertTrue(model.homeArchivePresentation!.sections.flatMap(\.cards).allSatisfy { $0.entryIDs.isEmpty })
    }

    @MainActor func testRelaunchRebuildsTheSameArchiveMetricsFromPersistedOriginals() async throws {
        let evaluated = try replacing(source(), "overallEvaluation", with: DiningOverallEvaluation(response: .veryLiked))
        let (model, defaults) = try await app([evaluated, source(restaurant: "다른 식당")])
        let before = try XCTUnwrap(model.homeArchivePresentation?.sections)
        let relaunched = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await wait(relaunched)
        XCTAssertEqual(relaunched.homeArchivePresentation?.sections, before)
    }

    @MainActor func testQ8DifferentReferencesWithinOneExperienceKeepSeparateAnswerTargets() async throws {
        let catalog = try XCTUnwrap(SensoryAnalysisEngine.contract?.selectionCatalog)
        let references = Dictionary(grouping: catalog.entries.filter { $0.reference == true }, by: \.attribute)
        let pair = try XCTUnwrap(references.values.first { $0.count >= 2 }).prefix(2)
        let selections = pair.map { DiningSensorySelection(id: $0.id, type: .init(rawValue: $0.type), labelSnapshot: $0.label, target: .wholeDish, phase: .duringMeal) }
        let original = try replacing(source(), "sensorySelections", with: selections)
        let (model, _) = try await app([original])
        let questions = model.sensoryAnalysis.personalModel!.availableSelections.filter { $0.facet == "liking" }
        XCTAssertEqual(questions.count, 2)
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: questions[0]))
        let current = model.diningEntry(id: original.id)!
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: current, context: context))
        XCTAssertEqual(answer.sensorySelections?.filter { $0.liking == .liked }.count, 1)
        XCTAssertEqual(model.savePersonalTasteQuestionResponse(answer, context: context), .updated(resolved: true))
        try await wait(model)
        XCTAssertEqual(model.sensoryAnalysis.personalModel?.availableSelections.filter { $0.facet == "liking" }.map(\.id), [questions[1].id])
    }

    func testSyntheticArchiveAndQuestionReanalysisCost() throws {
        for size in [50, 500] {
            let entries = (0..<size).map { source(restaurant: "합성 식당 \($0 % 20)") }
            let begin = Date()
            let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
            let analyzed = Date()
            let cards = HomeArchiveMetricsEngine.sections(entries: entries, snapshot: snapshot).flatMap(\.cards)
            let charted = Date()
            let ids = cards.first { $0.id == "menus" }!.data.archiveChart!.segments[0].entryIDs
            _ = entries.filter { ids.contains($0.id) }
            _ = HomeArchiveSummaryEngine.cards(entries: entries, snapshot: snapshot)
            print("HOME_QUESTION_PERF synthetic=\(size) analysis_ms=\(analyzed.timeIntervalSince(begin)*1000) chart_ms=\(charted.timeIntervalSince(analyzed)*1000) filter_summary_ms=\(Date().timeIntervalSince(charted)*1000)")
            XCTAssertEqual(snapshot.personalModel?.availableSelections.filter { $0.facet == "liking" }.count, size)
            XCTAssertEqual(cards.first { $0.id == "meals" }?.entryIDs.count, size)
        }
        let archiveEntries = (0..<5_000).map { source(restaurant: "합성 식당 \($0 % 200)") }
        let archiveBegin = Date()
        let archiveCards = HomeArchiveMetricsEngine.sections(entries: archiveEntries, snapshot: .empty).flatMap(\.cards)
        let archiveMilliseconds = Date().timeIntervalSince(archiveBegin) * 1_000
        print("HOME_ARCHIVE_PERF synthetic=5000 aggregate_ms=\(archiveMilliseconds)")
        XCTAssertEqual(archiveCards.first { $0.id == "meals" }?.entryIDs.count, archiveEntries.count)
        XCTAssertEqual(archiveCards.first { $0.id == "restaurants" }?.data.archiveChart?.total, 200)
    }

    func testFutureQuestionStateRoundTripsWithoutRevivingOrChangingAnAnswer() throws {
        let original = PersonalTasteQuestionProgress(questionID: "unknown-instance", firstExposedAt: .distantPast,
            status: .init(rawValue: "future-state-v9"), statusChangedAt: nil, suppressedUntil: nil, sourceEntryID: UUID())
        let restored = try JSONDecoder().decode(PersonalTasteQuestionProgress.self, from: JSONEncoder().encode(original))
        XCTAssertEqual(restored, original)
    }

    func testQ1AndQ8EachExperienceHasItsOwnQuestionEvenInOneMeal() throws {
        let meal = UUID(), a = source(meal: nil), b = source(meal: meal), c = source(meal: meal)
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [a, b, c])
        let questions = snapshot.personalModel!.availableSelections.filter { $0.facet == "liking" }
        XCTAssertEqual(questions.count, 3)
        XCTAssertEqual(Set(questions.map(\.id)).count, 3)
        XCTAssertEqual(Set(questions.compactMap { q in snapshot.observations.first { $0.id == q.responseSourceID }?.experienceID }), Set([a.id, b.id, c.id]))
    }

    @MainActor func testQ2AndQ3AnswerDoesNotBlockOtherOrNewMealsAndClearingReevaluates() async throws {
        let suite = "home-question-regression.\(UUID())", defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let a = source(), b = source()
        model.addDiningEntry(a); model.addDiningEntry(b); try await wait(model)
        let question = try XCTUnwrap(model.sensoryAnalysis.personalModel?.availableSelections.first { $0.facet == "liking" })
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        let original = try XCTUnwrap(model.diningEntry(id: context.sourceEntryID!))
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: original, context: context))
        XCTAssertEqual(model.savePersonalTasteQuestionResponse(answer, context: context), .updated(resolved: true))
        try await wait(model)
        XCTAssertEqual(model.sensoryAnalysis.personalModel?.availableSelections.filter { $0.facet == "liking" }.count, 1)
        model.addDiningEntry(source()); try await wait(model)
        XCTAssertEqual(model.sensoryAnalysis.personalModel?.availableSelections.filter { $0.facet == "liking" }.count, 2)
        model.updateDiningEntry(original); try await wait(model)
        XCTAssertEqual(model.sensoryAnalysis.personalModel?.availableSelections.filter { $0.facet == "liking" }.count, 3)
    }

    @MainActor func testQ11StaleEditorCannotOverwriteNewNote() async throws {
        let suite = "home-question-stale.\(UUID())", defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        model.addDiningEntry(source()); try await wait(model)
        let question = try XCTUnwrap(model.sensoryAnalysis.personalModel?.nextSelection)
        let context = try XCTUnwrap(model.personalTasteQuestionResponseContext(for: question))
        let original = try XCTUnwrap(model.diningEntry(id: context.sourceEntryID!))
        let answer = try XCTUnwrap(PersonalTasteInlineAnswer.applying("liked", to: original, context: context))
        var edited = original; edited.note = "사용자가 나중에 고친 원문"
        model.updateDiningEntry(edited)
        XCTAssertEqual(model.savePersonalTasteQuestionResponse(answer, context: context), .sourceUnavailable)
        XCTAssertEqual(model.diningEntry(id: original.id)?.note, edited.note)
        XCTAssertNotEqual(model.personalTasteQuestionProgressByUser[context.userID]?[question.id]?.status, .resolved)
    }

    func testDifferentDishesHaveSeparateOverallRatingsAndRestaurantScopedMenus() throws {
        let meal = UUID()
        var a = source(meal: meal), b = source(meal: meal, restaurant: "다른 합성 식당")
        a = try replacing(a, "overallEvaluation", with: DiningOverallEvaluation(response: .liked))
        b = try replacing(b, "overallEvaluation", with: DiningOverallEvaluation(response: .disliked))
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [a, b])
        let metrics = HomeArchiveMetricsEngine.sections(entries: [a, b], snapshot: snapshot).flatMap(\.cards)
        XCTAssertEqual(metrics.first { $0.id == "meals" }?.data.title, "1번의 식사")
        XCTAssertEqual(metrics.first { $0.id == "menus" }?.data.title, "2가지")
        XCTAssertEqual(metrics.first { $0.id == "overall" }?.data.title, "2개의 음식 평가")
        XCTAssertFalse(metrics.first { $0.id == "overall" }!.data.detail.contains("충돌 1"))
        var identified = try replacing(a, "restaurant", with: "")
        identified = try replacing(identified, "menu", with: "")
        identified = try replacing(identified, "restaurantID", with: "known-restaurant")
        identified = try replacing(identified, "menuItemID", with: "known-menu")
        var unidentified = try replacing(b, "restaurant", with: "  ")
        unidentified = try replacing(unidentified, "menu", with: "  ")
        unidentified = try replacing(unidentified, "restaurantID", with: "  ")
        let records = [identified, unidentified]
        let current = try SensoryAnalysisEngine.analyze(entries: records)
        let counts = HomeArchiveMetricsEngine.sections(entries: records, snapshot: current).flatMap(\.cards)
        XCTAssertEqual(counts.first { $0.id == "restaurants" }?.data.title, "1곳")
        XCTAssertEqual(counts.first { $0.id == "menus" }?.data.title, "1가지")
        let summary = HomeArchiveSummaryEngine.cards(entries: records, snapshot: current).first { $0.kind == .experience }
        XCTAssertEqual(summary?.value, "1개 메뉴")
        XCTAssertEqual(summary?.detail, "1곳의 식당")
    }
}
