import Foundation

struct DiningFeedbackFixtureContract: Codable, Equatable {
    let schemaVersion: Int
    let sourceFiles: [String]
    let scenario: DiningFeedbackScenarioContract
    let detailTagCategories: [DiningFeedbackTagCategoryContract]
    let dishKindOptions: [DiningFeedbackDishKindContract]
}

struct DiningFeedbackScenarioContract: Codable, Equatable {
    let completedAt: String
    let courseName: String
    let postDiningPrompt: String
    let reservationId: Int
    let restaurant: String
    let dishes: [DiningFeedbackDishContract]
}

struct DiningFeedbackDishContract: Codable, Equatable, Identifiable {
    let chefIntent: String
    let courseLabel: String
    let feedbackChoices: [DiningFeedbackChoiceContract]
    let flavorNotes: [String]
    let id: String
    let ingredients: [String]
    let subtitle: String
    let techniques: [String]
    let title: String
}

struct DiningFeedbackChoiceContract: Codable, Equatable, Identifiable {
    let affectedTastes: [String]
    let id: String
    let ingredientPairing: String
    let label: String
    let recommendation: String
    let reason: String
}

struct DiningFeedbackTagCategoryContract: Codable, Equatable, Identifiable {
    let id: String
    let label: String
    let tags: [DiningFeedbackTagContract]
}

struct DiningFeedbackTagContract: Codable, Equatable, Identifiable {
    let id: String
    let label: String
}

struct DiningFeedbackDishKindContract: Codable, Equatable, Identifiable {
    let id: String
    let label: String
    let keywords: [String]
}

enum DiningFeedbackFixtureLoader {
    static func load(bundle: Bundle = .main) throws -> DiningFeedbackFixtureContract {
        guard let url =
            bundle.url(
                forResource: "dining-feedback-scenario",
                withExtension: "json",
                subdirectory: "Fixtures"
            )
            ?? bundle.url(forResource: "dining-feedback-scenario", withExtension: "json")
        else {
            throw CocoaError(.fileNoSuchFile)
        }

        return try JSONDecoder().decode(
            DiningFeedbackFixtureContract.self,
            from: Data(contentsOf: url)
        )
    }
}
