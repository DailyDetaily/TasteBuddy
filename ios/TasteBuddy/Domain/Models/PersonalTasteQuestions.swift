import Foundation

extension PersonalTasteModelBuilder {
    // 단일 속성의 모형에서 반복 근거가 있는 해석 상태만 비교한다.
    private static func decisionStates(policy: PersonalTastePolicy, candidates: [PersonalTasteCandidate], fitPatterns: [PersonalTasteFitPattern], overallPatterns: [PersonalTasteOverallPattern]) -> [String: String] {
        var states: [String: String] = [:]
        for candidate in candidates {
            let minimum = candidate.conditions.isEmpty ? policy.minMeals : policy.minConditionMeals
            if candidate.distribution.mealCount >= minimum {
                states["liking:" + canonical(candidate.conditions)] = candidate.direction ?? candidate.status
            }
        }
        for pattern in fitPatterns {
            let minimum = pattern.conditions.isEmpty ? policy.minMeals : policy.minConditionMeals
            if pattern.distribution.mealCount >= minimum {
                states["fit:" + canonical(pattern.conditions)] = pattern.repeatedValue ?? pattern.status
            }
        }
        for pattern in overallPatterns {
            let minimum = pattern.conditions.isEmpty ? policy.minMeals : policy.minConditionMeals
            let repeated = pattern.cells.filter { $0.mealIDs.count >= minimum }.map { [$0.overallValue, $0.attributeValue] }
            if !repeated.isEmpty { states["overall:" + canonical(pattern.conditions)] = json(repeated) }
        }
        return states
    }

    private static func hypotheticalRecords(_ records: [PersonalTasteModelRecord], question: Question, source: PersonalTasteModelRecord?, answer: String) -> [PersonalTasteModelRecord]? {
        if question.intent == "exploration" {
            guard var seed = records.first(where: { $0.attribute == question.attribute && $0.reference == question.reference }), let proposed = question.proposedCondition else { return nil }
            seed.observationId = "__question_liking__"; seed.experienceId = "__question_experience__"; seed.mealId = "__question_meal__"
            seed.kind = "attribute_liking"; seed.scale = "attribute-three-category-v1"; seed.value = .text(answer)
            seed.target = "unspecified"; seed.phase = "unspecified"; seed.dishKindIDs = []; seed.selectionEvidence = nil
            seed.sourceSpans = []; seed.conditionSources = []; seed.phrase = ""; seed.confirmationStatus = "explicit_user_choice"
            var intensity = seed; intensity.observationId = "__question_intensity__"
            intensity.kind = "sensory_intensity"; intensity.scale = "expression-strength-v1"; intensity.value = .text(proposed.value)
            return records + [seed, intensity]
        }
        guard let source else { return nil }
        func belongs(_ row: PersonalTasteModelRecord) -> Bool {
            row.experienceId == source.experienceId && insightAttributeKey(row) == insightAttributeKey(source)
                && row.target == source.target && row.phase == source.phase && sameSelection(row, source)
        }
        if question.facet == "target" || question.facet == "phase" {
            return records.map { row in
                guard belongs(row) else { return row }; var copy = row
                if question.facet == "target" { copy.target = answer } else { copy.phase = answer }; return copy
            }
        }
        let kind = question.facet == "liking" ? "attribute_liking" : "sensory_intensity"
        // 충돌한 기존 평가를 빈 응답처럼 덮어쓰지 않는다.
        guard !records.contains(where: { belongs($0) && $0.kind == kind }) else { return nil }
        var copy = source; copy.observationId = "__question_answer__"; copy.kind = kind
        copy.scale = question.facet == "liking" ? "attribute-three-category-v1" : "expression-strength-v1"
        copy.value = .text(answer); copy.phrase = ""; copy.sourceSpans = []; copy.conditionSources = []
        if let selection = source.selectionEvidence {
            copy.selectionEvidence = .init(selectionID: selection.selectionID, type: selection.type, catalogVersion: selection.catalogVersion, labelSnapshot: selection.labelSnapshot, facet: question.facet, labelValue: "", responseValue: answer, relatedBubbleID: selection.relatedBubbleID, relatedBubbleLabel: selection.relatedBubbleLabel, resolution: selection.resolution)
        }
        return records + [copy]
    }

    static func assessQuestionGroups(_ questions: [String: Question], included: [PersonalTasteModelRecord], userID: String, policy: PersonalTastePolicy, candidates: [PersonalTasteCandidate], fitPatterns: [PersonalTasteFitPattern], overallPatterns: [PersonalTasteOverallPattern]) -> [String: Question] {
        struct Baseline { let records: [PersonalTasteModelRecord]; let states: [String: String] }
        var baselines: [String: Baseline] = [:], result: [String: Question] = [:]
        for key in questions.keys.sorted() {
            var question = questions[key]!
            let attributeKey = json([question.attribute, nullable(question.reference)])
            if baselines[attributeKey] == nil {
                let attributeRecords = included.filter { insightAttributeKey($0) == attributeKey }
                let experiences = Set(attributeRecords.map(\.experienceId))
                let records = attributeRecords + included.filter { $0.kind == "overall_liking" && experiences.contains($0.experienceId) }
                baselines[attributeKey] = .init(records: records, states: decisionStates(
                    policy: policy,
                    candidates: candidates.filter { $0.attribute == question.attribute && $0.reference == question.reference },
                    fitPatterns: fitPatterns.filter { $0.attribute == question.attribute && $0.reference == question.reference },
                    overallPatterns: overallPatterns.filter { $0.attribute == question.attribute && $0.reference == question.reference }
                ))
            }
            let baseline = baselines[attributeKey]!
            let relevant = baseline.records.filter { insightAttributeKey($0) == attributeKey }
            let source = question.intent == "exploration" ? nil : relevant.first {
                question.evidenceIDs.contains($0.observationId) && $0.target == question.target && $0.phase == question.phase
                    && (question.facet != "liking" || $0.kind == "sensory_presence")
            }
            let answers: [String]
            if question.intent == "exploration" || question.facet == "liking" { answers = likingValues }
            else if question.facet == "intensity" { answers = ["weak", "medium", "strong"] }
            else { answers = unique(relevant.map { question.facet == "target" ? $0.target : $0.phase }.filter { $0 != "unspecified" }) }
            var states = [baseline.states], alternativeCount = 0
            let relevantRatingMeals = Set(relevant.filter { ["attribute_liking", "preference_fit"].contains($0.kind) }.map(\.mealId)).count
            if relevantRatingMeals + 1 >= min(policy.minMeals, policy.minConditionMeals) {
                for answer in answers {
                    guard let hypothetical = hypotheticalRecords(baseline.records, question: question, source: source, answer: answer) else { continue }
                    let model = buildRecords(records: hypothetical, userID: userID, policy: policy, assessQuestions: false, includeEvidence: false)
                    states.append(decisionStates(policy: model.policy, candidates: model.candidates, fitPatterns: model.fitPatterns, overallPatterns: model.overallPatterns))
                    alternativeCount += 1
                }
            }
            let stateKeys = Set(states.flatMap { $0.keys })
            let changed = stateKeys.filter { key in Set(states.map { $0[key] ?? "not_supported" }).count > 1 }.count
            question.responseSourceID = source?.observationId
            question.impact = .init(changedInterpretationCount: changed, alternativeCount: alternativeCount, comparedMealCount: Set(relevant.map(\.mealId)).count, basis: changed > 0 ? "answer_can_change_interpretation" : "fills_missing_information")
            result[key] = question
        }
        return result
    }
}
