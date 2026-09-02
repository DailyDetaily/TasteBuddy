import Foundation

struct TasteBuddyAgentDiningAnalysisInput: Codable, Equatable {
    let detailTags: [String]
    let dishKindTags: [String]
    let id: String
    let ingredients: [String]
    let restaurantName: String
    let reviewSnippet: String?
    let reviewerProfile: TasteBuddyAgentTasteProfileSnapshot?
    let subject: String
    let tasteTags: [String]
    let techniques: [String]

    init(
        detailTags: [String],
        dishKindTags: [String] = [],
        id: String,
        ingredients: [String] = [],
        restaurantName: String,
        reviewSnippet: String? = nil,
        reviewerProfile: TasteBuddyAgentTasteProfileSnapshot? = nil,
        subject: String,
        tasteTags: [String],
        techniques: [String] = []
    ) {
        self.detailTags = detailTags
        self.dishKindTags = dishKindTags
        self.id = id
        self.ingredients = ingredients
        self.restaurantName = restaurantName
        self.reviewSnippet = reviewSnippet
        self.reviewerProfile = reviewerProfile
        self.subject = subject
        self.tasteTags = tasteTags
        self.techniques = techniques
    }
}

struct TasteBuddyAgentDiningAnalysisTagSnapshot: Codable, Equatable, Identifiable {
    let colorTaste: String?
    let id: String
    let label: String
    let score: Double?
    let title: String?

    init(
        colorTaste: String? = nil,
        id: String,
        label: String,
        score: Double? = nil,
        title: String? = nil
    ) {
        self.colorTaste = colorTaste
        self.id = id
        self.label = label
        self.score = score
        self.title = title
    }
}

struct TasteBuddyAgentDiningNote: Codable, Equatable {
    let detailTags: [TasteBuddyAgentDiningAnalysisTagSnapshot]
    let summary: String
    let tasteBubbles: [TasteBuddyAgentDiningAnalysisTagSnapshot]
}

struct TasteBuddyAgentDiningAnalysisSnapshot: Codable, Equatable {
    let confidence: Double
    let detailTags: [TasteBuddyAgentDiningAnalysisTagSnapshot]
    let foodKnowledgeMatchIds: [String]
    let foodOnMatchIds: [String]
    let generatedAt: String
    let lexiconCandidateIds: [String]
    let source: String
    let subject: String
    let summary: String
    let tasteBubbles: [TasteBuddyAgentDiningAnalysisTagSnapshot]
    let tbaSignalIds: [String]
    let version: String
}
