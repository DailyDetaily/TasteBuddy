import XCTest
@testable import TasteBuddy

final class TasteBuddyAgentFullEngineTests: XCTestCase {
    func testNativeKnowledgeBundleContainsCompleteReactSources() throws {
        let fixture = try decodeFixture()

        XCTAssertEqual(TasteBuddyAgent.coreTasteLexicon.count, fixture.knowledgeCounts.coreLexicon)
        XCTAssertEqual(TasteBuddyAgent.signalTaxonomy.count, fixture.knowledgeCounts.signalTaxonomy)
        XCTAssertEqual(TasteBuddyAgent.foodOnBridgeEntries.count, fixture.knowledgeCounts.foodOnBridge)
        XCTAssertEqual(
            TasteBuddyAgent.foodKnowledgeRuntimeEntries.count,
            fixture.knowledgeCounts.foodKnowledgeRuntime
        )
        XCTAssertEqual(TasteBuddyAgent.foodKnowledgeSourceCount, fixture.knowledgeCounts.foodKnowledgeSource)
        XCTAssertEqual(TasteBuddyAgent.foodKnowledgeFullEntries.count, 6_800)
        XCTAssertEqual(TasteBuddyAgent.foodOnReferenceLicense, "CC BY 4.0")
    }

    func testTasteIdentityPublicProfileAndReviewMatchReactGolden() throws {
        let fixture = try decodeFixture()
        let viewer = makeViewer(generatedAt: fixture.generatedAt)

        XCTAssertEqual(viewer, fixture.viewer)
        XCTAssertEqual(
            TasteBuddyAgent.publishTasteProfile(
                fixture.reviewer.snapshot,
                averageRating: 4.8,
                displayName: "리뷰어",
                nickname: "palate-note",
                reviewCount: 12,
                visibility: .public
            ),
            fixture.reviewer
        )
        XCTAssertEqual(makeReview(), fixture.review)
    }

    func testSimilarityDiningAnalysisAndKnowledgeMappingMatchReactGolden() throws {
        let fixture = try decodeFixture()
        let viewer = makeViewer(generatedAt: fixture.generatedAt)
        let edge = TasteBuddyAgent.computeTasteSimilarity(
            source: viewer,
            target: fixture.reviewer.snapshot,
            computedAt: fixture.generatedAt
        )
        XCTAssertEqual(edge.similarityScore, fixture.similarity.similarityScore)
        XCTAssertEqual(edge.sharedSignals.map(\.id), fixture.similarity.sharedSignalIds)
        XCTAssertEqual(edge.differenceSignals.map(\.id), fixture.similarity.differenceSignalIds)

        let review = makeReview()
        let snapshot = makeSnapshot(review: review, reviewer: fixture.reviewer)
        let mapping = TasteBuddyAgentKnowledgeRuntime.mapDiningNote(
            TasteBuddyAgentDiningAnalysisInput(
                detailTags: review.experienceTags,
                dishKindTags: review.dishKindTags,
                id: review.id,
                ingredients: review.ingredients,
                restaurantName: review.restaurantName,
                reviewerProfile: fixture.reviewer.snapshot,
                subject: review.dishTitle ?? review.restaurantName,
                tasteTags: review.tasteTags,
                techniques: review.techniques
            )
        )
        let candidates = mapping.candidates.map(LexiconCandidateProjection.init)
        XCTAssertEqual(candidates.map(\.id), fixture.lexiconCandidates.map(\.id))
        for (candidate, expected) in zip(candidates, fixture.lexiconCandidates) {
            XCTAssertEqual(candidate.confidence, expected.confidence, accuracy: 0.000_000_1)
            XCTAssertEqual(candidate.dishKindScore, expected.dishKindScore, accuracy: 0.000_000_1)
            XCTAssertEqual(candidate.foodKnowledgeScore, expected.foodKnowledgeScore, accuracy: 0.000_000_1)
            XCTAssertEqual(candidate.foodOnScore, expected.foodOnScore, accuracy: 0.000_000_1)
            XCTAssertEqual(candidate.profileScore, expected.profileScore, accuracy: 0.000_000_1)
            XCTAssertEqual(candidate.score, expected.score, accuracy: 0.000_000_1)
            XCTAssertEqual(candidate.textScore, expected.textScore, accuracy: 0.000_000_1)
        }
        XCTAssertEqual(snapshot.confidence, fixture.snapshot.confidence, accuracy: 0.0001)
        XCTAssertEqual(snapshot.foodKnowledgeMatchIds, fixture.snapshot.foodKnowledgeMatchIds)
        XCTAssertEqual(snapshot.foodOnMatchIds, fixture.snapshot.foodOnMatchIds)
        XCTAssertEqual(snapshot.lexiconCandidateIds, fixture.snapshot.lexiconCandidateIds)
        XCTAssertEqual(snapshot.tbaSignalIds, fixture.snapshot.tbaSignalIds)

        let foodOn = TasteBuddyAgent.mapFoodOnBridgeInput(
            ingredients: ["표고버섯"],
            menuText: "표고버섯 숯불 구이",
            techniques: ["charcoal broiling"]
        )
        XCTAssertEqual(foodOn.matches.map(\.entry.id), fixture.foodOn.matchIds)
        XCTAssertEqual(foodOn.tbaSignalIds, fixture.foodOn.tbaSignalIds)

        let signalMapping = TasteBuddyAgent.mapFeedbackInputToSignals(
            detailTags: ["흰살생선", "숯불", "발효"],
            dishKindTags: ["seafood"],
            tasteTags: ["fresh acidity"]
        )
        XCTAssertEqual(
            signalMapping.mappedSignals.map { $0.definition.id },
            fixture.signalMapping.mappedIds
        )
        XCTAssertEqual(
            signalMapping.unmappedTags.map {
                UnmappedTagProjection(source: $0.source, value: $0.value)
            },
            fixture.signalMapping.unmappedTags
        )
    }

    func testEvidenceLearningAndTasteMatchFeedMatchReactGolden() throws {
        let fixture = try decodeFixture()
        let review = makeReview()
        let snapshot = makeSnapshot(review: review, reviewer: fixture.reviewer)
        let previous = TasteBuddyAgentFeedbackEvidenceState(
            detailTagIds: review.experienceTags,
            dishKindIds: review.dishKindTags,
            signalIds: snapshot.tbaSignalIds,
            snapshot: snapshot,
            tasteTagIds: review.tasteTags
        )
        var adjusted = previous
        adjusted.detailTagIds.append("flow-long-lasting")
        let createdEffect = TasteBuddyAgent.calculateFeedbackEvidenceConfidenceEffect(
            eventType: .created,
            previous: nil,
            next: previous
        )
        let adjustedEffect = TasteBuddyAgent.calculateFeedbackEvidenceConfidenceEffect(
            eventType: .updated,
            previous: previous,
            next: adjusted
        )
        XCTAssertEqual(createdEffect, fixture.createdEffect)
        XCTAssertEqual(adjustedEffect, fixture.adjustedEffect)

        let events = [
            TasteBuddyAgentFeedbackEvidenceEvent(
                id: "event-created",
                confidenceEffect: createdEffect,
                createdAt: "2026-06-05T00:00:00.000Z",
                eventType: .created,
                evidenceAction: createdEffect.action,
                nextDishKindIds: review.dishKindTags,
                nextSignalIds: snapshot.tbaSignalIds,
                nextSnapshot: snapshot
            ),
            TasteBuddyAgentFeedbackEvidenceEvent(
                id: "event-adjusted",
                confidenceEffect: adjustedEffect,
                createdAt: "2026-06-06T00:00:00.000Z",
                eventType: .updated,
                evidenceAction: adjustedEffect.action,
                nextDishKindIds: review.dishKindTags,
                nextSignalIds: snapshot.tbaSignalIds,
                nextSnapshot: snapshot,
                previousDishKindIds: review.dishKindTags,
                previousSignalIds: snapshot.tbaSignalIds,
                previousSnapshot: snapshot
            ),
        ]
        let states = TasteBuddyAgent.aggregateFeedbackEvidenceEvents(events)
        XCTAssertEqual(states.map(ConfidenceStateProjection.init), fixture.confidenceStates)

        let feed = TasteBuddyAgent.generateTasteMatchFeed(
            viewerProfile: fixture.viewer,
            candidateProfiles: [fixture.reviewer],
            reviews: [review],
            userConfidenceStates: states,
            now: Date(timeIntervalSince1970: 0)
        )
        XCTAssertEqual(feed.map(FeedProjection.init), fixture.feed)
    }

    func testMenuContextUsesNativeAndFullFoodKnowledge() throws {
        let fixture = try decodeFixture()

        XCTAssertEqual(TasteBuddyAgent.inferMenuContext("가례불고기"), fixture.menuContext)
        XCTAssertTrue(
            TasteBuddyAgent.rankFoodKnowledge(
                query: "가례불고기",
                useFullCatalog: true,
                limit: 5
            ).contains { $0.entry.id == "tba-food:native:91511" }
        )
    }

    private func makeViewer(generatedAt: String) -> TasteBuddyAgentTasteProfileSnapshot {
        TasteBuddyAgent.buildTasteIdentity(
            measurement: [
                "bitter": 4.5,
                "fat": 5.1,
                "salty": 4.8,
                "sour": 7.6,
                "sweet": 4.4,
                "umami": 7.1,
            ],
            feedbackCount: 4,
            reviewCount: 4,
            userId: "viewer",
            generatedAt: generatedAt
        )
    }

    private func makeReview() -> TasteBuddyAgentDiningReview {
        TasteBuddyAgent.ingestDiningReview(
            id: "review-full-engine",
            createdAt: "2099-01-01T00:00:00.000Z",
            dishTitle: "표고버섯 숯불 구이",
            experienceTags: ["clean finish", "숯불"],
            ingredients: ["표고버섯"],
            rating: 5,
            restaurantId: "restaurant-full-engine",
            restaurantName: "테스트 다이닝",
            reviewText: "버섯의 깊이와 숯불 향이 깨끗하게 이어졌어요.",
            reviewerId: "reviewer",
            tasteTags: ["savory", "fresh acidity"],
            techniques: ["charcoal broiling"],
            visibility: .public
        )
    }

    private func makeSnapshot(
        review: TasteBuddyAgentDiningReview,
        reviewer: TasteBuddyAgentPublicProfile
    ) -> TasteBuddyAgentDiningAnalysisSnapshot {
        TasteBuddyAgent.buildDiningAnalysisSnapshot(
            TasteBuddyAgentDiningAnalysisInput(
                detailTags: review.experienceTags,
                dishKindTags: review.dishKindTags,
                id: review.id,
                ingredients: review.ingredients,
                restaurantName: review.restaurantName,
                reviewerProfile: reviewer.snapshot,
                subject: review.dishTitle ?? review.restaurantName,
                tasteTags: review.tasteTags,
                techniques: review.techniques
            ),
            generatedAt: "2026-06-05T00:00:00.000Z"
        )
    }

    private func decodeFixture() throws -> FullEngineFixture {
        let bundle = Bundle(for: Self.self)
        let url = try XCTUnwrap(
            Bundle.main.url(
                forResource: "tba-full-engine-golden",
                withExtension: "json",
                subdirectory: "Fixtures"
            )
                ?? Bundle.main.url(forResource: "tba-full-engine-golden", withExtension: "json")
                ?? bundle.url(forResource: "tba-full-engine-golden", withExtension: "json")
        )
        return try JSONDecoder().decode(FullEngineFixture.self, from: Data(contentsOf: url))
    }
}

private struct FullEngineFixture: Decodable {
    struct KnowledgeCounts: Decodable {
        let coreLexicon: Int
        let foodKnowledgeRuntime: Int
        let foodKnowledgeSource: Int
        let foodOnBridge: Int
        let signalTaxonomy: Int
    }

    struct Similarity: Decodable {
        let differenceSignalIds: [String]
        let sharedSignalIds: [String]
        let similarityScore: Int
    }

    struct Snapshot: Decodable {
        let confidence: Double
        let foodKnowledgeMatchIds: [String]
        let foodOnMatchIds: [String]
        let lexiconCandidateIds: [String]
        let tbaSignalIds: [String]
    }

    struct FoodOn: Decodable {
        let matchIds: [String]
        let tbaSignalIds: [String]
    }

    struct SignalMapping: Decodable {
        let mappedIds: [String]
        let unmappedTags: [UnmappedTagProjection]
    }

    let adjustedEffect: TasteBuddyAgentFeedbackEvidenceConfidenceEffect
    let confidenceStates: [ConfidenceStateProjection]
    let createdEffect: TasteBuddyAgentFeedbackEvidenceConfidenceEffect
    let feed: [FeedProjection]
    let foodOn: FoodOn
    let generatedAt: String
    let knowledgeCounts: KnowledgeCounts
    let lexiconCandidates: [LexiconCandidateProjection]
    let menuContext: TasteBuddyAgentMenuContext
    let review: TasteBuddyAgentDiningReview
    let reviewer: TasteBuddyAgentPublicProfile
    let signalMapping: SignalMapping
    let similarity: Similarity
    let snapshot: Snapshot
    let viewer: TasteBuddyAgentTasteProfileSnapshot
}

private struct LexiconCandidateProjection: Codable, Equatable {
    let confidence: Double
    let dishKindScore: Double
    let foodKnowledgeScore: Double
    let foodOnScore: Double
    let id: String
    let profileScore: Double
    let score: Double
    let textScore: Double

    init(_ candidate: TasteBuddyAgentKnowledgeRuntime.DiningCandidate) {
        confidence = candidate.confidence
        dishKindScore = candidate.dishKindScore
        foodKnowledgeScore = candidate.foodKnowledgeScore
        foodOnScore = candidate.foodOnScore
        id = candidate.entry.id
        profileScore = candidate.profileScore
        score = candidate.score
        textScore = candidate.textScore
    }
}

private struct UnmappedTagProjection: Codable, Equatable {
    let source: String
    let value: String
}

private struct ConfidenceStateProjection: Codable, Equatable {
    let adjustCount: Int
    let confidence: Double
    let evidenceCount: Int
    let label: String?
    let removeCount: Int
    let signalId: String
    let signalType: TasteBuddyAgentConfidenceSignalType
    let supportCount: Int

    init(_ state: TasteBuddyAgentUserConfidenceState) {
        adjustCount = state.adjustCount
        confidence = state.confidence
        evidenceCount = state.evidenceCount
        label = state.label
        removeCount = state.removeCount
        signalId = state.signalId
        signalType = state.signalType
        supportCount = state.supportCount
    }
}

private struct FeedProjection: Codable, Equatable {
    let category: TasteBuddyAgentMatchCategory
    let learnedConfidenceScore: Double
    let learnedConfidenceSignals: [String]
    let matchScore: Int
    let relationLabel: TasteBuddyAgentSocialRelation
    let restaurantId: String
    let reviewerId: String
    let sharedSignalIds: [String]

    init(_ item: TasteBuddyAgentMatchFeedItem) {
        category = item.category
        learnedConfidenceScore = item.learnedConfidenceScore
        learnedConfidenceSignals = item.learnedConfidenceSignals
        matchScore = item.matchScore
        relationLabel = item.relationLabel
        restaurantId = item.restaurantId
        reviewerId = item.reviewerId
        sharedSignalIds = item.sharedSignals.map(\.id)
    }
}
