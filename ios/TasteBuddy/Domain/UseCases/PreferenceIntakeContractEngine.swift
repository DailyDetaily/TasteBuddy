import Foundation

enum PreferenceIntakeContractEngine {
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
                && !(value ?? "").isEmpty
        case .multiple(let values):
            return question.selectionMode == .multiple
                && values.count >= (question.minSelections ?? 1)
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

