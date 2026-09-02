import Foundation

enum TasteBuddyAgentProfileStage: String, Codable, CaseIterable {
    case starter = "Starter"
    case learning = "Learning"
    case patterned = "Patterned"
    case refined = "Refined"
}

enum TasteBuddyAgentVisibility: String, Codable {
    case `private`
    case followers
    case `public`
}

enum TasteBuddyAgentMatchCategory: String, Codable {
    case strongMatch = "Strong Match"
    case worthExploring = "Worth Exploring"
    case tasteContrast = "Taste Contrast"
}

enum TasteBuddyAgentSocialRelation: String, Codable {
    case tasteTwin = "Taste Twin"
    case similarPalate = "Similar Palate"
    case contrastingPalate = "Contrasting Palate"
}

enum TasteBuddyAgentPerceptualAxis: String, Codable, CaseIterable {
    case brightness
    case heaviness
    case cleanFinish
    case linger
    case smoke
    case aromaIntensity
    case textureRichness
    case thermalImpact

    var label: String {
        switch self {
        case .brightness: "밝은 산뜻함"
        case .heaviness: "무게감"
        case .cleanFinish: "깔끔한 마무리"
        case .linger: "긴 여운"
        case .smoke: "스모키함"
        case .aromaIntensity: "향의 선명도"
        case .textureRichness: "질감의 밀도"
        case .thermalImpact: "온도감"
        }
    }
}

struct TasteBuddyAgentIdentitySignal: Codable, Equatable, Identifiable {
    let confidence: Double
    let id: String
    let label: String
    let summary: String
    let tasteId: String?
}

struct TasteBuddyAgentTasteProfileSnapshot: Codable, Equatable {
    let confidenceByAxis: [String: Double]
    let generatedAt: String
    let perceptualVector: [String: Double]
    let preferenceVector: [String: Double]
    let sensitivityVector: [String: Double]
    let stablePatterns: [TasteBuddyAgentIdentitySignal]
    let stage: TasteBuddyAgentProfileStage
    let tasteSignature: String
    let tasteVector: [String: Double]
    let userId: String
    let watchPoints: [TasteBuddyAgentIdentitySignal]
}

struct TasteBuddyAgentPublicStats: Codable, Equatable {
    let averageRating: Double?
    let reviewCount: Int
}

struct TasteBuddyAgentPublicProfile: Codable, Equatable, Identifiable {
    var id: String { userId }

    let avatarPath: String?
    let displayName: String
    let nickname: String
    let publicStats: TasteBuddyAgentPublicStats
    let snapshot: TasteBuddyAgentTasteProfileSnapshot
    let stage: TasteBuddyAgentProfileStage
    let tasteSignature: String
    let userId: String
    let visibility: TasteBuddyAgentVisibility
}

struct TasteBuddyAgentDiningReview: Codable, Equatable, Identifiable {
    let createdAt: String
    let dishId: String?
    let dishKindTags: [String]
    let dishTitle: String?
    let experienceTags: [String]
    let id: String
    let ingredients: [String]
    let rating: Int
    let restaurantId: String
    let restaurantName: String
    let reviewSnippet: String
    let reviewerId: String
    let tasteSignals: [String: Double]
    let tasteTags: [String]
    let techniques: [String]
    let visibility: TasteBuddyAgentVisibility
}

struct TasteBuddyAgentSimilarityEdge: Codable, Equatable {
    let computedAt: String
    let differenceSignals: [TasteBuddyAgentIdentitySignal]
    let sharedSignals: [TasteBuddyAgentIdentitySignal]
    let similarityScore: Int
    let sourceUserId: String
    let targetUserId: String
}

struct TasteBuddyAgentMatchFeedItem: Codable, Equatable, Identifiable {
    let category: TasteBuddyAgentMatchCategory
    let dishId: String?
    let dishKindTags: [String]
    let dishTitle: String?
    let experienceTags: [String]
    let id: String
    let ingredients: [String]
    let itemType: String
    let learnedConfidenceScore: Double
    let learnedConfidenceSignals: [String]
    let matchScore: Int
    let reason: String
    let relationLabel: TasteBuddyAgentSocialRelation
    let restaurantId: String
    let restaurantName: String
    let reviewCreatedAt: String?
    let reviewSnippet: String
    let reviewer: TasteBuddyAgentPublicProfile
    let reviewerId: String
    let sharedSignals: [TasteBuddyAgentIdentitySignal]
    let supportingSignals: [String]
    let tasteTags: [String]
    let techniques: [String]
}

enum TasteBuddyAgentEvidenceEventType: String, Codable {
    case created
    case updated
    case deleted
    case tasteTagsChanged = "taste_tags_changed"
    case detailTagsChanged = "detail_tags_changed"
    case dishKindTagsChanged = "dish_kind_tags_changed"
    case diningNoteRegenerated = "dining_note_regenerated"
}

enum TasteBuddyAgentEvidenceAction: String, Codable {
    case include
    case adjust
    case remove
    case ignore
}

enum TasteBuddyAgentEvidenceDimension: String, Codable {
    case taste
    case detail
    case dishKind = "dish-kind"
    case signal
    case snapshot
}

struct TasteBuddyAgentFeedbackEvidenceState: Codable, Equatable {
    var detailTagIds: [String] = []
    var dishKindIds: [String] = []
    var signalIds: [String] = []
    var snapshot: TasteBuddyAgentDiningAnalysisSnapshot?
    var tasteTagIds: [String] = []
    var tbaConfidence: Double?
}

struct TasteBuddyAgentFeedbackEvidenceConfidenceEffect: Codable, Equatable {
    let action: TasteBuddyAgentEvidenceAction
    let changedDimensions: [TasteBuddyAgentEvidenceDimension]
    let confidenceDelta: Double
    let confidenceLift: Double
    let nextEffectiveConfidence: Double
    let previousEffectiveConfidence: Double
    let reasons: [String]
}

enum TasteBuddyAgentConfidenceSignalType: String, Codable {
    case tbaSignal = "tba-signal"
    case lexicon
    case dishKind = "dish-kind"
    case foodOn = "foodon"
    case foodKnowledge = "food-knowledge"
}

struct TasteBuddyAgentFeedbackEvidenceEvent: Codable, Equatable, Identifiable {
    var id: String
    let confidenceDelta: Double?
    let confidenceEffect: TasteBuddyAgentFeedbackEvidenceConfidenceEffect?
    let createdAt: String?
    let eventType: TasteBuddyAgentEvidenceEventType
    let evidenceAction: TasteBuddyAgentEvidenceAction
    let nextDishKindIds: [String]
    let nextSignalIds: [String]
    let nextSnapshot: TasteBuddyAgentDiningAnalysisSnapshot?
    let previousDishKindIds: [String]
    let previousSignalIds: [String]
    let previousSnapshot: TasteBuddyAgentDiningAnalysisSnapshot?

    init(
        id: String = UUID().uuidString,
        confidenceDelta: Double? = nil,
        confidenceEffect: TasteBuddyAgentFeedbackEvidenceConfidenceEffect? = nil,
        createdAt: String? = nil,
        eventType: TasteBuddyAgentEvidenceEventType,
        evidenceAction: TasteBuddyAgentEvidenceAction,
        nextDishKindIds: [String] = [],
        nextSignalIds: [String] = [],
        nextSnapshot: TasteBuddyAgentDiningAnalysisSnapshot? = nil,
        previousDishKindIds: [String] = [],
        previousSignalIds: [String] = [],
        previousSnapshot: TasteBuddyAgentDiningAnalysisSnapshot? = nil
    ) {
        self.id = id
        self.confidenceDelta = confidenceDelta
        self.confidenceEffect = confidenceEffect
        self.createdAt = createdAt
        self.eventType = eventType
        self.evidenceAction = evidenceAction
        self.nextDishKindIds = nextDishKindIds
        self.nextSignalIds = nextSignalIds
        self.nextSnapshot = nextSnapshot
        self.previousDishKindIds = previousDishKindIds
        self.previousSignalIds = previousSignalIds
        self.previousSnapshot = previousSnapshot
    }
}

struct TasteBuddyAgentUserConfidenceState: Codable, Equatable, Identifiable {
    var id: String { "\(signalType.rawValue):\(signalId)" }

    let adjustCount: Int
    let confidence: Double
    let evidenceCount: Int
    let label: String?
    let lastEvidenceAt: String?
    let lastEventId: String?
    let averageEffectiveConfidence: Double
    let removeCount: Int
    let signalId: String
    let signalType: TasteBuddyAgentConfidenceSignalType
    let supportCount: Int
}

enum TasteBuddyAgentKnowledgeSurface: String, Codable {
    case tasteBubble = "taste-bubble"
    case detailTag = "detail-tag"
    case diningNote = "dining-note"
    case recommendation
    case chefGuide = "chef-guide"
    case tcs
}

struct TasteBuddyAgentCoreLexiconEntry: Codable, Equatable, Identifiable {
    let aliases: [String]
    let category: String
    let dishKindAffinity: [String: Double]
    let foodOnHints: [String]?
    let id: String
    let initialConfidence: Double
    let label: String
    let minRecommendationConfidence: Double
    let perceptualVector: [String: Double]
    let polarity: String
    let recipeNlgTechniqueHints: [String]?
    let sourceNotes: [String]
    let status: String
    let summary: String
    let surfaces: [String]
    let tasteVector: [String: Double]
    let version: String
}

struct TasteBuddyAgentSignalDefinition: Codable, Equatable, Identifiable {
    let aliases: [String]
    let canonicalDishKindId: String?
    let confidence: Double
    let description: String
    let domain: String
    let id: String
    let intensityValue: Double?
    let label: String
    let lexiconCategory: String?
    let lexiconIds: [String]?
    let parentIds: [String]?
    let perceptualAxis: String?
    let sentimentValue: Int?
    let status: String
    let tasteAxis: String?
}

struct TasteBuddyAgentSignalMatch: Equatable {
    let definition: TasteBuddyAgentSignalDefinition
    let matchedAlias: String?
    let score: Double
}

struct TasteBuddyAgentMappedSignal: Equatable {
    let definition: TasteBuddyAgentSignalDefinition
    let matchedAlias: String?
    let score: Double
    let source: String
    let sourceLabel: String
}

struct TasteBuddyAgentSignalMappingResult: Equatable {
    let byDomain: [String: [TasteBuddyAgentMappedSignal]]
    let mappedSignals: [TasteBuddyAgentMappedSignal]
    let unmappedTags: [TasteBuddyAgentUnmappedTag]
}

struct TasteBuddyAgentUnmappedTag: Equatable {
    let source: String
    let value: String
}

struct TasteBuddyAgentFoodOnEntry: Codable, Equatable, Identifiable {
    let aliases: [String]
    let canonicalName: String
    let description: String
    let dishKindIds: [String]
    let familyId: String?
    let foodOnIri: String?
    let id: String
    let kind: String
    let koName: String
    let parentIds: [String]?
    let source: String
    let sourceFacet: String
    let tbaSignalIds: [String]
}

struct TasteBuddyAgentFoodOnMatch: Equatable {
    let entry: TasteBuddyAgentFoodOnEntry
    let matchedAlias: String?
    let score: Double
}

struct TasteBuddyAgentFoodOnMappingResult: Equatable {
    let matches: [TasteBuddyAgentFoodOnMatch]
    let tbaSignalIds: [String]
    let unmappedTerms: [String]
}

struct TasteBuddyAgentFoodKnowledgeSourceRef: Codable, Equatable {
    let id: String?
    let source: String
    let version: String?
}

struct TasteBuddyAgentFoodKnowledgeEntry: Codable, Equatable, Identifiable {
    let aliases: [String]
    let canonicalName: String
    let confidence: Double
    let dishKindIds: [String]
    let foodGroup: String
    let foodOnIds: [String]
    let id: String
    let ingredientSignalIds: [String]
    let kind: String
    let koName: String
    let lexiconIds: [String]
    let nativeFoodIds: [String]
    let processSignalIds: [String]
    let sourceRefs: [TasteBuddyAgentFoodKnowledgeSourceRef]
    let status: String
    let surfaces: [String: Bool]
}

struct TasteBuddyAgentFoodKnowledgeMatch: Equatable {
    let entry: TasteBuddyAgentFoodKnowledgeEntry
    let score: Double
    let textScore: Double
    let usable: Bool
}

struct TasteBuddyAgentMenuContext: Codable, Equatable {
    let confidence: Double
    let dishKindIds: [String]
    let foodKnowledgeMatchIds: [String]
    let ingredients: [String]
    let techniques: [String]
}

struct TasteBuddyAgentKnowledgeBundle: Codable {
    struct Capability: Codable, Equatable, Identifiable {
        let description: String
        let id: String
        let label: String
    }

    struct Agent: Codable {
        let alias: String
        let capabilities: [Capability]
        let displayName: String
    }

    struct CoreTasteLexicon: Codable {
        let entries: [TasteBuddyAgentCoreLexiconEntry]
        let minActiveConfidence: Double
        let version: String
    }

    struct FoodKnowledgeRuntime: Codable {
        let entries: [TasteBuddyAgentFoodKnowledgeEntry]
        let sourceCount: Int
        let sourcePath: String
        let version: String
    }

    struct FoodOnBridge: Codable {
        let entries: [TasteBuddyAgentFoodOnEntry]
        let referenceLicense: String
        let referencePath: String
        let version: String
    }

    let agent: Agent
    let coreTasteLexicon: CoreTasteLexicon
    let foodKnowledgeRuntime: FoodKnowledgeRuntime
    let foodOnBridge: FoodOnBridge
    let schemaVersion: Int
    let signalTaxonomy: [TasteBuddyAgentSignalDefinition]
}

struct TasteBuddyAgentFullFoodKnowledgeBundle: Codable {
    let version: String
    let count: Int
    let items: [TasteBuddyAgentFoodKnowledgeEntry]
}
