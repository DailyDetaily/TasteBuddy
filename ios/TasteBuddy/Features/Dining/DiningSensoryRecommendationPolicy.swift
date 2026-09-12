import Foundation

enum DiningSensoryRecommendationPolicy {
    static func isSupported(_ evaluation: DiningOverallEvaluation?) -> Bool {
        guard let evaluation else { return false }
        return evaluation.questionID == "overall_liking"
            && evaluation.questionVersion == DiningOverallEvaluation.version
            && evaluation.questionLabelSnapshot == DiningOverallEvaluation.question
            && DiningOverallEvaluation.Response.allCases.contains(evaluation.responseValue)
            && evaluation.responseLabelSnapshot == evaluation.responseValue.label
            && evaluation.target == "whole_dish"
            && evaluation.phase == "unspecified"
            && evaluation.unparsedPayload == nil
    }

    static func firstBubbleID(
        experiences: [TasteExperience],
        dishKindIDs: Set<String>,
        preserving selectedIDs: [String]
    ) -> String? {
        if let selected = selectedIDs.first,
           experiences.contains(where: { $0.id == selected }) {
            return selected
        }

        let preferredAxes = dishKindIDs
            .sorted()
            .flatMap(preferredAxes(for:))
        for axis in preferredAxes {
            if let match = experiences.first(where: { $0.axis == axis }) {
                return match.id
            }
        }
        return experiences.first?.id
    }

    static func orderedDetailTagIDs(
        baseIDs: [String],
        overallEvaluation: DiningOverallEvaluation?
    ) -> [String] {
        guard overallEvaluation?.responseValue == .veryLiked
                || overallEvaluation?.responseValue == .liked else {
            return baseIDs
        }

        let explicitlyPositiveIDs = [
            "balance-well-balanced",
            "texture-temperature-right",
            "composition-cook-point",
            "composition-contrast-good",
            "composition-connected",
            "composition-course-fit",
            "composition-garnish-works",
            "composition-portion-right",
            "composition-transition-good",
        ]
        let positiveSet = Set(explicitlyPositiveIDs)
        return baseIDs.enumerated().sorted { left, right in
            let leftIsPositive = positiveSet.contains(left.element)
            let rightIsPositive = positiveSet.contains(right.element)
            if leftIsPositive != rightIsPositive { return leftIsPositive }
            return left.offset < right.offset
        }.map(\.element)
    }

    static func orderedTags(
        _ tags: [DiningFeedbackTagContract],
        recommendedIDs: [String]
    ) -> [DiningFeedbackTagContract] {
        let rank = Dictionary(
            uniqueKeysWithValues: recommendedIDs.enumerated().map { ($0.element, $0.offset) }
        )
        return tags.enumerated().sorted { left, right in
            let leftRank = rank[left.element.id]
            let rightRank = rank[right.element.id]
            switch (leftRank, rightRank) {
            case let (.some(lhs), .some(rhs)) where lhs != rhs:
                return lhs < rhs
            case (.some, .none):
                return true
            case (.none, .some):
                return false
            default:
                return left.offset < right.offset
            }
        }.map(\.element)
    }

    static func detailPrompt(for _: DiningOverallEvaluation?) -> String {
        "전체 평가와 달라도 괜찮아요. 실제로 느낀 점을 자유롭게 골라주세요."
    }

    private static func preferredAxes(for dishKindID: String) -> [TasteAxis] {
        switch dishKindID {
        case "broth", "fermented_jang": return [.umami, .salty]
        case "dessert": return [.sweet, .fat]
        case "dairy_cheese": return [.fat, .salty]
        case "fried_crispy": return [.fat, .salty]
        case "grilled_smoked", "stir_fried_wok": return [.umami, .bitter]
        case "meat": return [.umami, .fat]
        case "raw_cured", "seafood": return [.sour, .umami]
        case "sauce_glaze": return [.salty, .sweet]
        case "spice_heat": return [.bitter, .salty]
        case "vegetable_herb", "cold": return [.sour, .bitter]
        case "grain_noodle", "dumpling_batter": return [.umami, .fat]
        default: return []
        }
    }

}
