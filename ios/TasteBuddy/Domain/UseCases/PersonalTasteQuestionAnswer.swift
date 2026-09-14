import Foundation

struct TasteQuestionChoice: Identifiable, Equatable {
    let id: String
    let title: String
}

enum PersonalTasteInlineAnswer {
    /// 가상 영향 계산도 실제 저장 가능한 선택지만 사용한다. 자유 원문은 편집 경로다.
    static func safeSemanticAnswers(record: PersonalTasteModelRecord, facet: String, entry: DiningEntry) -> [String] {
        guard record.selectionEvidence != nil else { return [] }
        let selection = PersonalTasteNextSelection(id: "validation-only", attribute: record.attribute ?? "", label: record.attributeLabel ?? "",
            facet: facet, question: "", reason: "", evidenceIDs: [record.observationId], mealIDs: [record.mealId], createsEvidence: false,
            intent: "clarification", proposedCondition: nil, unobserved: false)
        let context = PersonalTasteQuestionResponseContext(selection: selection, userID: record.userId, sourceEntryID: entry.id,
            sourceTarget: record.target, sourcePhase: record.phase, sourceReference: record.reference,
            entryIDsAtStart: [entry.id], mealIDsAtStart: [entry.mealID], sourceSelectionEvidence: record.selectionEvidence)
        return choices(for: facet).compactMap { choice in
            guard applying(choice.id, to: entry, context: context) != nil else { return nil }
            return ["liked": "positive", "disliked": "negative", "light": "weak"][choice.id] ?? choice.id
        }
    }
    static func sourceEntry(for selection: PersonalTasteNextSelection, observations: [SensoryObservation], entries: [DiningEntry]) -> DiningEntry? {
        if selection.intent == "source_review", let id = selection.sourceExperienceID.flatMap(UUID.init(uuidString:)) {
            return entries.first { $0.id == id }
        }
        guard selection.intent == "clarification",
              let sourceID = selection.responseSourceID,
              let source = observations.first(where: {
                  $0.id == sourceID && $0.attribute == selection.attribute && selection.evidenceIDs.contains($0.id)
              }) else { return nil }
        return entries.first { $0.id == source.experienceID }
    }

    static func choices(for facet: String) -> [TasteQuestionChoice] {
        switch facet {
        case "liking": DiningSensorySelection.Liking.allCases.map { .init(id: $0.rawValue, title: $0.label) }
        case "intensity": DiningSensorySelection.Intensity.allCases.map { .init(id: $0.rawValue, title: $0.label) }
        case "target": DiningSensorySelection.Target.allCases.filter { $0 != .unspecified }.map { .init(id: $0.rawValue, title: $0.label) }
        case "phase": DiningSensorySelection.Phase.allCases.filter { $0 != .unspecified }.map { .init(id: $0.rawValue, title: $0.label) }
        default: []
        }
    }

    struct Availability {
        let choices: [TasteQuestionChoice]
        let reason: String
    }

    /// 즉시 답변 카드에는 실제 원출처에 저장 가능한 질문만 표시한다.
    /// 원문 확인과 새 식사 제안은 분석 대기열에 보존하되 답변 카드로 표시하지 않는다.
    static func answerableQuestions(_ questions: [PersonalTasteNextSelection], observations: [SensoryObservation], entries: [DiningEntry]) -> [PersonalTasteNextSelection] {
        let sources = Dictionary(observations.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
        let originals = Dictionary(entries.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
        return questions.filter { question in
            guard question.intent == "clarification", let id = question.responseSourceID, let source = sources[id] else { return false }
            return !availability(selection: question, observation: source, entry: originals[source.experienceID]).choices.isEmpty
        }
    }

    static func availability(selection: PersonalTasteNextSelection, observation: SensoryObservation?, entry: DiningEntry?) -> Availability {
        guard selection.intent == "clarification", let entry, let observation,
              observation.experienceID == entry.id, observation.id == selection.responseSourceID,
              observation.attribute == selection.attribute, selection.evidenceIDs.contains(observation.id) else {
            return .init(choices: [], reason: "원출처를 확인할 수 없어 기록을 다시 열어야 해요.")
        }
        guard observation.selectionEvidence != nil else { return .init(choices: [], reason: "원문에서 나온 질문이에요. 당시 표현을 확인하고 보완해 주세요.") }
        let context = PersonalTasteQuestionResponseContext(selection: selection, userID: "", sourceEntryID: entry.id,
            sourceTarget: observation.target, sourcePhase: observation.phase, sourceReference: observation.reference,
            entryIDsAtStart: [entry.id], mealIDsAtStart: [entry.mealID], sourceSelectionEvidence: observation.selectionEvidence)
        let options = choices(for: selection.facet).filter { applying($0.id, to: entry, context: context) != nil }
        return .init(choices: options, reason: options.isEmpty ? "현재 응답이나 선택 조건을 확인해야 해요. 원래 기록에서 수정할 수 있어요." : "이 경험에 아직 남기지 않은 응답을 보완해요.")
    }

    /// 원래 선택에서 비어 있는 항목만 보완하며 새로운 식사나 출처를 만들지 않는다.
    static func applying(_ answerID: String, to entry: DiningEntry, context: PersonalTasteQuestionResponseContext) -> DiningEntry? {
        guard context.selection.intent == "clarification",
              entry.id == context.sourceEntryID,
              entry.hasCompletedTasteFeedback,
              let source = context.sourceSelectionEvidence,
              choices(for: context.selection.facet).contains(where: { $0.id == answerID }),
              let catalog = SensoryAnalysisEngine.contract?.selectionCatalog else { return nil }
        var selections = SensoryAnalysisEngine.effectiveSelections(for: entry, catalog: catalog)
        let matches = selections.indices.filter {
            let item = selections[$0]
            return item.id == source.selectionID && item.type.rawValue == source.type
                && item.catalogVersion == source.catalogVersion && item.labelSnapshot == source.labelSnapshot
                && item.relatedBubbleID == source.relatedBubbleID && item.unparsedPayload == nil
        }
        guard matches.count == 1, let index = matches.first else { return nil }
        func related(_ evidence: SensorySelectionEvidence?) -> Bool {
            evidence?.selectionID == source.selectionID && evidence?.type == source.type
                && evidence?.catalogVersion == source.catalogVersion && evidence?.relatedBubbleID == source.relatedBubbleID
        }
        let parsed = DiningSensorySelectionParser.parse(selections, catalog: catalog)
        guard !parsed.unresolved.contains(where: { related($0.selectionEvidence) }),
              let effective = parsed.observations.first(where: {
                  related($0.selectionEvidence) && $0.attribute == context.selection.attribute && $0.reference == context.sourceReference
              }), effective.target == context.sourceTarget, effective.phase == context.sourcePhase else { return nil }
        let facetKind = context.selection.facet == "liking" ? "attribute_liking" : context.selection.facet == "intensity" ? "sensory_intensity" : ""
        if !facetKind.isEmpty && parsed.observations.contains(where: { related($0.selectionEvidence) && $0.kind == facetKind && $0.attribute == context.selection.attribute }) { return nil }
        if context.selection.facet == "target" && effective.target != "unspecified" { return nil }
        if context.selection.facet == "phase" && effective.phase != "unspecified" { return nil }
        switch context.selection.facet {
        case "liking":
            guard selections[index].liking == nil else { return nil }
            selections[index].liking = .init(rawValue: answerID)
        case "intensity":
            guard selections[index].intensity == nil else { return nil }
            selections[index].intensity = .init(rawValue: answerID)
        case "target":
            guard selections[index].target == .unspecified else { return nil }
            selections[index].target = .init(rawValue: answerID)
        case "phase":
            guard selections[index].phase == .unspecified else { return nil }
            selections[index].phase = .init(rawValue: answerID)
        default: return nil
        }
        let after = DiningSensorySelectionParser.parse(selections, catalog: catalog)
        guard !after.unresolved.contains(where: { related($0.selectionEvidence) }) else { return nil }
        return DiningEntry(
            id: entry.id, mealID: entry.mealID, restaurant: entry.restaurant,
            restaurantID: entry.restaurantID, menu: entry.menu, menuItemID: entry.menuItemID,
            observedAt: entry.observedAt, savedAt: entry.savedAt, updatedAt: entry.updatedAt,
            rating: entry.rating, note: entry.note, tasteExperienceIDs: entry.tasteExperienceIDs,
            detailTagIDs: entry.detailTagIDs, sensorySelections: selections,
            overallEvaluation: entry.overallEvaluation, dishKindIDs: entry.dishKindIDs,
            reflectionPhotoFilename: entry.reflectionPhotoFilename,
            tbaAnalysisSnapshot: entry.tbaAnalysisSnapshot, feedbackStatus: entry.feedbackStatus,
            photoPalette: entry.photoPalette, mealTime: entry.mealTime,
            memoryRevision: entry.memoryRevision, memoryCorrections: entry.memoryCorrections
        )
    }
}
