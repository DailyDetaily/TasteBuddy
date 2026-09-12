import Foundation

enum PreferenceIntakeContractEngine {
    static let evidenceVersion = "tba-preference-intake/1"
    static let meanings = [
        "allergies": ("self_reported_food_restriction", "피해야 할 재료"),
        "dietaryRestrictions": ("dietary_practice", "식사 원칙"),
        "preferredCuisineTypes": ("cuisine_preference", "편안하게 즐기는 요리"),
        "avoidedSignals": ("stated_avoidance", "자주 피하는 요소"),
        "flavorIntensityPreference": ("preferred_flavor_intensity", "편안한 풍미 강도"),
        "explorationStyle": ("exploration_preference", "새로운 음식에 대한 선호"),
        "sharePreferenceWithRestaurant": ("sharing_preference", "정보 공유에 대한 선호")
    ]
    static let catalog = (try? PreferenceIntakeCatalogLoader.load())?.questions ?? []

    private static func validSelection(_ ids: [String], question: PreferenceIntakeQuestionContract) -> Bool {
        ids.allSatisfy { id in question.options.contains { $0.id == id } }
            && Set(ids).count == ids.count
            && (question.selectionMode != .single || ids.count <= 1)
            && ids.count <= (question.maxSelections ?? question.options.count)
            && (question.noneOptionId.map { !ids.contains($0) || ids.count == 1 } ?? true)
    }

    static func isValid(_ submission: PreferenceIntakeSubmission, questions: [PreferenceIntakeQuestionContract] = catalog) -> Bool {
        func nonempty(_ value: String) -> Bool { !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && value.utf16.count <= 2000 }
        guard submission.schemaVersion == evidenceVersion, submission.instrumentVersion == "1.0.0",
              nonempty(submission.id), nonempty(submission.userID),
              let recordedAt = PersonalTasteModelBuilder.date(submission.recordedAt),
              let knownAt = PersonalTasteModelBuilder.date(submission.knownAt), knownAt >= recordedAt,
              PersonalTasteModelBuilder.timestamp(recordedAt) == submission.recordedAt, PersonalTasteModelBuilder.timestamp(knownAt) == submission.knownAt,
              submission.source.kind == "preference_intake", ["web", "ios", "android"].contains(submission.source.platform),
              questions.count == meanings.count, submission.responses.count == questions.count,
              Set(submission.responses.map(\.questionID)).count == questions.count else { return false }
        return submission.responses.allSatisfy { response in
            guard let question = questions.first(where: { $0.id == response.questionID }) else { return false }
            return response.questionText == question.title && response.questionDescription == question.description
                && response.selectedOptions.allSatisfy { question.options.contains($0) }
                && validSelection(response.selectedOptions.map(\.id), question: question)
                && response.state == (response.selectedOptions.isEmpty ? "unanswered" : "answered")
        }
    }

    static func completeProfile(questions: [PreferenceIntakeQuestionContract], responses: PreferenceIntakeResponsesContract,
                                previous: PreferenceIntakeProfileContract?, userID: String = "local-owner",
                                id: String = UUID().uuidString.lowercased(), recordedAt: Date = Date()) throws -> PreferenceIntakeProfileContract {
        let rows = try questions.map { question -> PreferenceIntakeSubmission.Response in
            let ids: [String]
            switch responses.value(for: question.id) { case .multiple(let values): ids = values; case .single(let value): ids = value.map { [$0] } ?? [] }
            guard validSelection(ids, question: question) else { throw CocoaError(.coderInvalidValue) }
            return .init(questionID: question.id, questionText: question.title, questionDescription: question.description,
                         state: ids.isEmpty ? "unanswered" : "answered",
                         selectedOptions: ids.compactMap { id in question.options.first { $0.id == id } })
        }
        let time = PersonalTasteModelBuilder.timestamp(recordedAt)
        let submission = PreferenceIntakeSubmission(schemaVersion: evidenceVersion, instrumentVersion: "1.0.0", id: id,
            userID: userID, recordedAt: time, knownAt: time, source: .init(kind: "preference_intake", platform: "ios"), responses: rows)
        guard isValid(submission, questions: questions) else { throw CocoaError(.coderInvalidValue) }
        var profile = buildProfile(questions: questions, responses: responses)
        profile.submissions = (previous?.submissions ?? []) + [submission]
        return profile
    }

    static func evidence(submissions: [PreferenceIntakeSubmission], userID: String = "local-owner", asOf: Date? = nil,
                         questions: [PreferenceIntakeQuestionContract] = catalog) -> PreferenceIntakeEvidenceSnapshot {
        var result = PreferenceIntakeEvidenceSnapshot()
        guard !userID.isEmpty else { return result }
        var valid: [PreferenceIntakeSubmission] = []
        let groups = Dictionary(grouping: submissions, by: \.id)
        for id in groups.keys.sorted() {
            let copies = groups[id]!, submission = copies[0]
            let reason: String?
            if copies.contains(where: { $0 != submission }) { reason = "conflicting_submission_identity" }
            else if !isValid(submission, questions: questions) { reason = "invalid_submission" }
            else if submission.userID != userID { reason = "different_user" }
            else if let asOf, PersonalTasteModelBuilder.date(submission.recordedAt)! > asOf || PersonalTasteModelBuilder.date(submission.knownAt)! > asOf { reason = "after_cutoff" }
            else { reason = nil }
            if let reason { result.excludedSubmissions.append(.init(id: id, reason: reason)) }
            else { valid.append(submission) }
        }
        valid.sort { a, b in
            let at = PersonalTasteModelBuilder.date(a.recordedAt)!, bt = PersonalTasteModelBuilder.date(b.recordedAt)!
            if at != bt { return at < bt }
            let ak = PersonalTasteModelBuilder.date(a.knownAt)!, bk = PersonalTasteModelBuilder.date(b.knownAt)!
            return ak == bk ? a.id < b.id : ak < bk
        }
        guard let latest = valid.last else { return result }
        result.submissionID = latest.id; result.recordedAt = latest.recordedAt
        result.records = questions.compactMap { question in
            guard let response = latest.responses.first(where: { $0.questionID == question.id }), let (kind, label) = meanings[question.id] else { return nil }
            let state = response.state == "unanswered" ? "unanswered"
                : response.selectedOptions.contains(where: { $0.id == question.noneOptionId }) ? "declared_none" : "answered"
            return .init(id: "\(latest.id):\(question.id)", sourceSubmissionID: latest.id, kind: kind, label: label, state: state,
                         recordedAt: latest.recordedAt, knownAt: latest.knownAt, response: response)
        }
        result.answeredQuestionCount = result.records.filter { $0.state != "unanswered" }.count
        return result
    }

    static func responsesFromProfile(_ profile: PreferenceIntakeProfileContract) -> PreferenceIntakeResponsesContract {
        let source = evidence(submissions: profile.submissions ?? [])
        guard !(profile.submissions ?? []).isEmpty else { return profile }
        var responses = PreferenceIntakeResponsesContract(submissions: profile.submissions)
        // Legacy sanitized empty arrays do not imply that 'none' was selected.
        for row in source.records {
            let ids = row.response.selectedOptions.map(\.id)
            if let question = catalog.first(where: { $0.id == row.response.questionID }), question.selectionMode == .multiple {
                responses.setMultiple(ids, for: question.id)
            } else if let id = ids.first { responses.setSingle(id, for: row.response.questionID) }
        }
        return responses
    }

    static func nextMultipleSelection(
        question: PreferenceIntakeQuestionContract,
        currentValue: [String],
        optionId: String
    ) -> [String] {
        let maximum = question.maxSelections ?? .max
        let hasSelection = currentValue.contains(optionId)

        if hasSelection {
            return currentValue.filter { $0 != optionId }
        }

        if let noneOptionId = question.noneOptionId, optionId == noneOptionId {
            return [noneOptionId]
        }

        let baseSelections = question.noneOptionId.map { noneOptionId in
            currentValue.filter { $0 != noneOptionId }
        } ?? currentValue

        guard baseSelections.count < maximum else {
            return baseSelections
        }

        return baseSelections + [optionId]
    }

    static func isAnswered(
        question: PreferenceIntakeQuestionContract,
        responses: PreferenceIntakeResponsesContract
    ) -> Bool {
        switch responses.value(for: question.id) {
        case .single(let value):
            return question.selectionMode == .single
                && value.map { validSelection([$0], question: question) } == true
        case .multiple(let values):
            return question.selectionMode == .multiple
                && values.count >= (question.minSelections ?? 1)
                && validSelection(values, question: question)
        }
    }

    static func buildProfile(
        questions: [PreferenceIntakeQuestionContract],
        responses: PreferenceIntakeResponsesContract
    ) -> PreferenceIntakeProfileContract {
        var profile = responses
        let questionsById = Dictionary(
            uniqueKeysWithValues: questions.map { ($0.id, $0) }
        )

        profile.allergies = sanitized(
            profile.allergies,
            question: questionsById["allergies"]
        )
        profile.avoidedSignals = sanitized(
            profile.avoidedSignals,
            question: questionsById["avoidedSignals"]
        )
        profile.dietaryRestrictions = sanitized(
            profile.dietaryRestrictions,
            question: questionsById["dietaryRestrictions"]
        )
        return profile
    }

    private static func sanitized(
        _ values: [String],
        question: PreferenceIntakeQuestionContract?
    ) -> [String] {
        guard let noneOptionId = question?.noneOptionId else {
            return values
        }
        return values.filter { $0 != noneOptionId }
    }
}
