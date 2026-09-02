import Foundation

extension TasteBuddyAgent {
    static var capabilities: [TasteBuddyAgentKnowledgeBundle.Capability] {
        TasteBuddyAgentKnowledgeRuntime.bundle.agent.capabilities
    }

    static var coreTasteLexicon: [TasteBuddyAgentCoreLexiconEntry] {
        TasteBuddyAgentKnowledgeRuntime.coreTasteLexicon
    }

    static var signalTaxonomy: [TasteBuddyAgentSignalDefinition] {
        TasteBuddyAgentKnowledgeRuntime.signalTaxonomy
    }

    static var foodOnBridgeEntries: [TasteBuddyAgentFoodOnEntry] {
        TasteBuddyAgentKnowledgeRuntime.foodOnBridgeEntries
    }

    static var foodKnowledgeRuntimeEntries: [TasteBuddyAgentFoodKnowledgeEntry] {
        TasteBuddyAgentKnowledgeRuntime.runtimeFoodKnowledgeEntries
    }

    static var foodKnowledgeFullEntries: [TasteBuddyAgentFoodKnowledgeEntry] {
        TasteBuddyAgentKnowledgeRuntime.fullFoodKnowledgeEntries
    }

    static var foodKnowledgeSourceCount: Int {
        TasteBuddyAgentKnowledgeRuntime.bundle.foodKnowledgeRuntime.sourceCount
    }

    static var foodOnReferenceLicense: String {
        TasteBuddyAgentKnowledgeRuntime.bundle.foodOnBridge.referenceLicense
    }

    static func buildTasteIdentity(
        measurement: [String: Double?],
        source: TasteMeasurementSourceContract = .measured,
        feedbackCount: Int = 0,
        reviewCount: Int = 0,
        userId: String = "local-user",
        generatedAt: String = ISO8601DateFormatter().string(from: Date())
    ) -> TasteBuddyAgentTasteProfileSnapshot {
        let tasteVector = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                let value = measurement[axis.rawValue] ?? nil
                return (axis.rawValue, normalizeMeasurement(value))
            }
        )
        let perceptualVector = inferPerceptualVector(tasteVector)
        let sensitivityVector = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                let value = tasteVector[axis.rawValue] ?? 0.5
                let distance = abs(value - 0.5)
                return (
                    axis.rawValue,
                    rounded(clamp(0.32 + distance * 0.95 + max(0, value - 0.72) * 0.25))
                )
            }
        )
        let preferenceVector = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                let value = tasteVector[axis.rawValue] ?? 0.5
                return (
                    axis.rawValue,
                    rounded(clamp(0.26 + value * 0.68 - (sensitivityVector[axis.rawValue] ?? 0) * 0.08))
                )
            }
        )
        let evidenceLift = clamp(Double(feedbackCount + reviewCount) / 10, maximum: 0.22)
        let confidenceByAxis = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                let hasValue = measurement[axis.rawValue] != nil
                    && measurement[axis.rawValue]! != nil
                let value = tasteVector[axis.rawValue] ?? 0.5
                return (
                    axis.rawValue,
                    rounded(clamp(
                        (hasValue ? 0.44 : 0.18)
                            + (source == .measured ? 0.18 : 0)
                            + evidenceLift
                            + abs(value - 0.5) * 0.12
                    ))
                )
            }
        )
        let confidence = average(TasteAxis.allCases.map {
            confidenceByAxis[$0.rawValue] ?? 0
        })
        let evidenceCount = feedbackCount + reviewCount
        let stage: TasteBuddyAgentProfileStage = if confidence >= 0.78 && evidenceCount >= 10 {
            .refined
        } else if confidence >= 0.66 && evidenceCount >= 5 {
            .patterned
        } else if confidence >= 0.5 && evidenceCount >= 1 {
            .learning
        } else {
            .starter
        }
        let topTasteAxes = sortedTasteAxes(tasteVector, count: 2)
        let topPerceptualAxes = sortedPerceptualAxes(perceptualVector, count: 2)
        let stableTasteSignals = topTasteAxes.map { axis in
            TasteBuddyAgentIdentitySignal(
                confidence: confidenceByAxis[axis.rawValue] ?? 0,
                id: "taste:\(axis.rawValue)",
                label: axis.label,
                summary: "\(axis.label) 축이 먼저 읽히는 프로필이에요.",
                tasteId: axis.rawValue
            )
        }
        let stablePerceptualSignals = topPerceptualAxes.map { axis in
            TasteBuddyAgentIdentitySignal(
                confidence: rounded((perceptualVector[axis.rawValue] ?? 0) * 0.72),
                id: "perceptual:\(axis.rawValue)",
                label: axis.label,
                summary: "\(axis.label)을 선호 신호로 함께 봅니다.",
                tasteId: nil
            )
        }
        let sensitivityPoint = TasteAxis.allCases.max {
            (sensitivityVector[$0.rawValue] ?? 0) < (sensitivityVector[$1.rawValue] ?? 0)
        }
        let confidencePoint = TasteAxis.allCases.min {
            (confidenceByAxis[$0.rawValue] ?? 0) < (confidenceByAxis[$1.rawValue] ?? 0)
        }
        var watchAxes: [TasteAxis] = []
        [sensitivityPoint, confidencePoint].compactMap { $0 }.forEach {
            if !watchAxes.contains($0) { watchAxes.append($0) }
        }
        let watchPoints = watchAxes.map { axis in
            let sensitive = (sensitivityVector[axis.rawValue] ?? 0) > 0.58
            return TasteBuddyAgentIdentitySignal(
                confidence: confidenceByAxis[axis.rawValue] ?? 0,
                id: "watch:\(axis.rawValue)",
                label: axis.label,
                summary: sensitive
                    ? "\(axis.label)은 강도가 쌓이면 피로도가 올라갈 수 있어요."
                    : "\(axis.label)은 아직 더 많은 리뷰로 확인할 축이에요.",
                tasteId: axis.rawValue
            )
        }
        let signatureTaste = topTasteAxes.map(\.label).joined(separator: " · ")
        let signaturePerceptual = topPerceptualAxes.first?.label
            ?? TasteBuddyAgentPerceptualAxis.cleanFinish.label

        return TasteBuddyAgentTasteProfileSnapshot(
            confidenceByAxis: confidenceByAxis,
            generatedAt: generatedAt,
            perceptualVector: perceptualVector,
            preferenceVector: preferenceVector,
            sensitivityVector: sensitivityVector,
            stablePatterns: Array((stableTasteSignals + stablePerceptualSignals).prefix(4)),
            stage: stage,
            tasteSignature: "\(signatureTaste) 중심, \(signaturePerceptual)을 함께 보는 입맛",
            tasteVector: tasteVector,
            userId: userId,
            watchPoints: watchPoints
        )
    }

    static func buildTasteIdentity(
        profile: TasteProfile,
        feedbackCount: Int = 0,
        reviewCount: Int = 0,
        userId: String = "local-user",
        generatedAt: String? = nil
    ) -> TasteBuddyAgentTasteProfileSnapshot {
        buildTasteIdentity(
            measurement: Dictionary(
                uniqueKeysWithValues: TasteAxis.allCases.map {
                    ($0.rawValue, Double(profile.score(for: $0)) / 10)
                }
            ),
            source: profile.confidence == "Starter" ? .broadStarter : .measured,
            feedbackCount: feedbackCount,
            reviewCount: reviewCount,
            userId: userId,
            generatedAt: generatedAt
                ?? ISO8601DateFormatter().string(from: profile.createdAt)
        )
    }

    static func publishTasteProfile(
        _ snapshot: TasteBuddyAgentTasteProfileSnapshot,
        avatarPath: String? = nil,
        averageRating: Double? = nil,
        displayName: String? = nil,
        nickname: String? = nil,
        reviewCount: Int = 0,
        visibility: TasteBuddyAgentVisibility = .private
    ) -> TasteBuddyAgentPublicProfile {
        TasteBuddyAgentPublicProfile(
            avatarPath: avatarPath,
            displayName: nonEmpty(displayName) ?? "Taste Buddy Guest",
            nickname: nonEmpty(nickname) ?? "taste-buddy",
            publicStats: .init(averageRating: averageRating, reviewCount: reviewCount),
            snapshot: snapshot,
            stage: snapshot.stage,
            tasteSignature: snapshot.tasteSignature,
            userId: snapshot.userId,
            visibility: visibility
        )
    }

    static func ingestDiningReview(
        id: String? = nil,
        createdAt: String = ISO8601DateFormatter().string(from: Date()),
        dishId: String? = nil,
        dishKindTags: [String]? = nil,
        dishTitle: String? = nil,
        experienceTags: [String] = [],
        ingredients: [String] = [],
        rating: Int,
        restaurantId: String,
        restaurantName: String,
        reviewText: String? = nil,
        reviewerId: String,
        tasteTags: [String] = [],
        techniques: [String] = [],
        visibility: TasteBuddyAgentVisibility = .private
    ) -> TasteBuddyAgentDiningReview {
        let normalizedTaste = normalizeTags(tasteTags)
        let normalizedExperience = normalizeTags(experienceTags)
        let resolvedKinds = dishKindTags ?? inferDishKindIds(
            title: dishTitle ?? restaurantName,
            flavorNotes: normalizedTaste + normalizedExperience
        )
        let signals = buildTasteSignals(normalizedTaste + normalizedExperience)
        return TasteBuddyAgentDiningReview(
            createdAt: createdAt,
            dishId: dishId,
            dishKindTags: resolvedKinds,
            dishTitle: dishTitle,
            experienceTags: normalizedExperience,
            id: id ?? "\(reviewerId):\(restaurantId):\(Int(Date().timeIntervalSince1970 * 1000))",
            ingredients: ingredients,
            rating: min(5, max(1, rating)),
            restaurantId: restaurantId,
            restaurantName: restaurantName,
            reviewSnippet: nonEmpty(reviewText)
                ?? "이 다이닝은 다음 선택에 참고할 만한 미각 신호를 남겼어요.",
            reviewerId: reviewerId,
            tasteSignals: signals,
            tasteTags: normalizedTaste,
            techniques: techniques,
            visibility: visibility
        )
    }

    static func computeTasteSimilarity(
        source: TasteBuddyAgentTasteProfileSnapshot,
        target: TasteBuddyAgentTasteProfileSnapshot,
        reviewBehaviorOverlap: Double = 0.62,
        computedAt: String = ISO8601DateFormatter().string(from: Date())
    ) -> TasteBuddyAgentSimilarityEdge {
        let tasteSimilarity = vectorSimilarity(
            keys: TasteAxis.allCases.map(\.rawValue),
            left: source.tasteVector,
            right: target.tasteVector,
            confidence: source.confidenceByAxis
        )
        let perceptualSimilarity = vectorSimilarity(
            keys: TasteBuddyAgentPerceptualAxis.allCases.map(\.rawValue),
            left: source.perceptualVector,
            right: target.perceptualVector
        )
        let preferenceSimilarity = vectorSimilarity(
            keys: TasteAxis.allCases.map(\.rawValue),
            left: source.preferenceVector,
            right: target.preferenceVector,
            confidence: source.confidenceByAxis
        )
        let tasteContribution = tasteSimilarity * 0.4
        let perceptualContribution = perceptualSimilarity * 0.3
        let preferenceContribution = preferenceSimilarity * 0.2
        let reviewContribution = clamp(reviewBehaviorOverlap) * 0.1
        let similarityTotal = tasteContribution
            + perceptualContribution
            + preferenceContribution
            + reviewContribution
        let score = Int((similarityTotal * 100).rounded())
        let shared = TasteAxis.allCases.sorted {
            sharedDistance($0, source, target) > sharedDistance($1, source, target)
        }.prefix(2)
        let different = TasteAxis.allCases.sorted {
            tasteDifference($0, source, target) > tasteDifference($1, source, target)
        }.prefix(2)

        return TasteBuddyAgentSimilarityEdge(
            computedAt: computedAt,
            differenceSignals: different.map { axis in
                TasteBuddyAgentIdentitySignal(
                    confidence: rounded(tasteDifference(axis, source, target)),
                    id: "different:\(axis.rawValue)",
                    label: axis.label,
                    summary: "\(axis.label)을 다르게 받아들일 수 있어요.",
                    tasteId: axis.rawValue
                )
            },
            sharedSignals: shared.map { axis in
                TasteBuddyAgentIdentitySignal(
                    confidence: rounded(sharedDistance(axis, source, target)),
                    id: "shared:\(axis.rawValue)",
                    label: axis.label,
                    summary: "\(axis.label)을 비슷한 강도로 읽습니다.",
                    tasteId: axis.rawValue
                )
            },
            similarityScore: score,
            sourceUserId: source.userId,
            targetUserId: target.userId
        )
    }

    static func calculateFeedbackEvidenceConfidenceEffect(
        eventType: TasteBuddyAgentEvidenceEventType,
        previous: TasteBuddyAgentFeedbackEvidenceState?,
        next: TasteBuddyAgentFeedbackEvidenceState?
    ) -> TasteBuddyAgentFeedbackEvidenceConfidenceEffect {
        let previousConfidence = evidenceConfidence(previous)
        let nextBase = evidenceConfidence(next)
        if eventType == .deleted {
            return .init(
                action: .remove,
                changedDimensions: [.snapshot],
                confidenceDelta: rounded(-previousConfidence),
                confidenceLift: 0,
                nextEffectiveConfidence: 0,
                previousEffectiveConfidence: rounded(previousConfidence),
                reasons: ["삭제된 피드백은 선호 하락이 아니라 해당 evidence를 confidence 계산에서 제외하는 신호로 처리합니다."]
            )
        }
        var changed: [TasteBuddyAgentEvidenceDimension] = []
        if differentIds(previous?.tasteTagIds, next?.tasteTagIds) { changed.append(.taste) }
        if differentIds(previous?.detailTagIds, next?.detailTagIds) { changed.append(.detail) }
        if differentIds(previous?.dishKindIds, next?.dishKindIds) { changed.append(.dishKind) }
        if differentIds(previous?.signalIds, next?.signalIds) { changed.append(.signal) }
        if snapshotFingerprint(previous?.snapshot) != snapshotFingerprint(next?.snapshot) {
            changed.append(.snapshot)
        }
        let lift = clamp(
            (changed.contains(.taste) ? 0.08 : 0)
                + (changed.contains(.detail) ? 0.06 : 0)
                + (changed.contains(.dishKind) ? 0.04 : 0),
            maximum: 0.16
        )
        let nextConfidence = clamp(nextBase + lift)
        let action: TasteBuddyAgentEvidenceAction = eventType == .created
            ? .include
            : changed.isEmpty && lift == 0 ? .ignore : .adjust
        var reasons = [
            eventType == .created
                ? "새 피드백은 TBA confidence 계산에 포함할 수 있는 evidence로 기록합니다."
                : changed.isEmpty
                    ? "해석 근거가 바뀌지 않아 confidence 재계산은 보류할 수 있습니다."
                    : "사용자가 수정한 태그와 메뉴 종류는 TBA 자동 해석보다 강한 보정 신호로 기록합니다.",
        ]
        if lift > 0 {
            reasons.append("사용자 수정 신호가 있어 해당 evidence의 유효 confidence를 소폭 올려 기록합니다.")
        }
        return .init(
            action: action,
            changedDimensions: changed,
            confidenceDelta: rounded(nextConfidence - previousConfidence),
            confidenceLift: rounded(lift),
            nextEffectiveConfidence: rounded(nextConfidence),
            previousEffectiveConfidence: rounded(previousConfidence),
            reasons: reasons
        )
    }

    static func aggregateFeedbackEvidenceEvents(
        _ events: [TasteBuddyAgentFeedbackEvidenceEvent]
    ) -> [TasteBuddyAgentUserConfidenceState] {
        struct MutableState {
            var adjustCount = 0
            var effectiveConfidenceSum = 0.0
            var evidenceCount = 0
            var label: String?
            var lastEvidenceAt: String?
            var lastEventId: String?
            var removeCount = 0
            let signalId: String
            let signalType: TasteBuddyAgentConfidenceSignalType
            var supportCount = 0
        }

        var states: [String: MutableState] = [:]
        func key(_ target: ConfidenceTarget) -> String {
            "\(target.type.rawValue):\(target.id)"
        }
        func apply(
            target: ConfidenceTarget,
            event: TasteBuddyAgentFeedbackEvidenceEvent,
            confidence: Double,
            mode: EvidenceMode
        ) {
            let targetKey = key(target)
            var state = states[targetKey] ?? MutableState(
                label: target.label,
                signalId: target.id,
                signalType: target.type
            )
            if state.label == nil { state.label = target.label }
            switch mode {
            case .remove:
                state.removeCount += 1
            case .adjust:
                state.adjustCount += 1
                state.evidenceCount += 1
                state.effectiveConfidenceSum += confidence
            case .support:
                state.supportCount += 1
                state.evidenceCount += 1
                state.effectiveConfidenceSum += confidence
            }
            state.lastEventId = event.id
            state.lastEvidenceAt = event.createdAt ?? state.lastEvidenceAt
            states[targetKey] = state
        }

        for event in events.sorted(by: { ($0.createdAt ?? "") < ($1.createdAt ?? "") }) {
            let effective = clamp(
                event.confidenceEffect?.nextEffectiveConfidence
                    ?? event.confidenceDelta
                    ?? event.nextSnapshot?.confidence
                    ?? event.previousSnapshot?.confidence
                    ?? 0.5
            )
            if event.evidenceAction == .remove || event.eventType == .deleted {
                confidenceTargets(event, side: .previous).forEach {
                    apply(target: $0, event: event, confidence: effective, mode: .remove)
                }
                continue
            }
            let nextTargets = confidenceTargets(event, side: .next)
            let previousTargets = confidenceTargets(event, side: .previous)
            let nextKeys = Set(nextTargets.map(key))
            let previousKeys = Set(previousTargets.map(key))
            if event.evidenceAction == .adjust {
                previousTargets.filter { !nextKeys.contains(key($0)) }.forEach {
                    apply(target: $0, event: event, confidence: effective, mode: .remove)
                }
            }
            nextTargets.forEach {
                apply(
                    target: $0,
                    event: event,
                    confidence: effective,
                    mode: event.evidenceAction == .adjust && !previousKeys.isEmpty
                        ? .adjust
                        : .support
                )
            }
        }

        return states.values.map { state in
            let positive = state.supportCount + state.adjustCount
            let averageConfidence = positive > 0
                ? state.effectiveConfidenceSum / Double(positive)
                : 0
            let confidence = clamp(
                0.42
                    + Double(state.supportCount) * 0.07
                    + Double(state.adjustCount) * 0.05
                    - Double(state.removeCount) * 0.1
                    + averageConfidence * 0.25,
                minimum: 0.05,
                maximum: 0.98
            )
            return TasteBuddyAgentUserConfidenceState(
                adjustCount: state.adjustCount,
                confidence: rounded(confidence),
                evidenceCount: state.evidenceCount,
                label: state.label,
                lastEvidenceAt: state.lastEvidenceAt,
                lastEventId: state.lastEventId,
                averageEffectiveConfidence: rounded(averageConfidence),
                removeCount: state.removeCount,
                signalId: state.signalId,
                signalType: state.signalType,
                supportCount: state.supportCount
            )
        }.sorted {
            $0.confidence != $1.confidence
                ? $0.confidence > $1.confidence
                : $0.evidenceCount != $1.evidenceCount
                    ? $0.evidenceCount > $1.evidenceCount
                    : $0.signalId < $1.signalId
        }
    }

    static func generateTasteMatchFeed(
        viewerProfile: TasteBuddyAgentTasteProfileSnapshot,
        candidateProfiles: [TasteBuddyAgentPublicProfile],
        reviews: [TasteBuddyAgentDiningReview],
        userConfidenceStates: [TasteBuddyAgentUserConfidenceState] = [],
        limit: Int = 6,
        now: Date = Date()
    ) -> [TasteBuddyAgentMatchFeedItem] {
        let profiles = Dictionary(
            uniqueKeysWithValues: candidateProfiles
                .filter { [.public, .followers].contains($0.visibility) }
                .map { ($0.userId, $0) }
        )
        let confidenceMap = Dictionary(
            uniqueKeysWithValues: userConfidenceStates.map { ($0.id, $0) }
        )
        var seenRestaurants: Set<String> = []
        var result: [TasteBuddyAgentMatchFeedItem] = []

        for review in reviews where review.visibility == .public {
            guard let reviewer = profiles[review.reviewerId] else { continue }
            let edge = computeTasteSimilarity(
                source: viewerProfile,
                target: reviewer.snapshot,
                reviewBehaviorOverlap: review.rating >= 4 ? 0.72 : 0.48
            )
            let fit = itemFit(viewer: viewerProfile, review: review)
            let reviewerConfidence = stageConfidence(reviewer.stage)
            let freshness = freshness(review.createdAt, now: now)
            let diversity = seenRestaurants.contains(review.restaurantId) ? 0.9 : 1
            seenRestaurants.insert(review.restaurantId)
            let learned = learnedConfidence(review: review, stateMap: confidenceMap)
            let similarityContribution = Double(edge.similarityScore) / 100 * 0.42
            let fitContribution = fit * 0.26
            let reviewerContribution = reviewerConfidence * 0.15
            let freshnessContribution = freshness * 0.09
            let learnedContribution = learned.score * 0.08
            let feedTotal = similarityContribution
                + fitContribution
                + reviewerContribution
                + freshnessContribution
                + learnedContribution
            let score = Int((feedTotal * 100 * diversity).rounded())
            let category: TasteBuddyAgentMatchCategory = score >= 82
                && edge.similarityScore >= 72
                ? .strongMatch
                : score >= 64 ? .worthExploring : .tasteContrast
            let relation: TasteBuddyAgentSocialRelation = edge.similarityScore >= 82
                ? .tasteTwin
                : edge.similarityScore >= 58 ? .similarPalate : .contrastingPalate
            let reason = explainRecommendation(
                viewer: viewerProfile,
                reviewer: reviewer,
                review: review,
                edge: edge,
                learnedSignals: learned.labels
            )
            result.append(
                TasteBuddyAgentMatchFeedItem(
                    category: category,
                    dishId: review.dishId,
                    dishKindTags: review.dishKindTags,
                    dishTitle: review.dishTitle,
                    experienceTags: review.experienceTags,
                    id: "feed:\(review.id)",
                    ingredients: review.ingredients,
                    itemType: review.dishTitle == nil ? "restaurant" : "dish",
                    learnedConfidenceScore: learned.score,
                    learnedConfidenceSignals: learned.labels,
                    matchScore: score,
                    reason: reason,
                    relationLabel: relation,
                    restaurantId: review.restaurantId,
                    restaurantName: review.restaurantName,
                    reviewCreatedAt: review.createdAt,
                    reviewSnippet: review.reviewSnippet,
                    reviewer: reviewer,
                    reviewerId: reviewer.userId,
                    sharedSignals: edge.sharedSignals,
                    supportingSignals: edge.sharedSignals.map(\.label),
                    tasteTags: review.tasteTags,
                    techniques: review.techniques
                )
            )
        }

        return result.sorted {
            $0.matchScore != $1.matchScore
                ? $0.matchScore > $1.matchScore
                : $0.restaurantName.localizedCompare($1.restaurantName) == .orderedAscending
        }.prefix(limit).map(\.self)
    }

    static func findSignalDefinitions(
        text: String,
        domains: Set<String> = [],
        limit: Int = 8,
        minScore: Double = 0.5
    ) -> [TasteBuddyAgentSignalMatch] {
        TasteBuddyAgentKnowledgeRuntime.findSignals(
            text: text,
            domains: domains,
            limit: limit,
            minScore: minScore
        )
    }

    static func mapFeedbackInputToSignals(
        detailTags: [String] = [],
        dishKindTags: [String] = [],
        lexiconIds: [String] = [],
        tasteTags: [String] = []
    ) -> TasteBuddyAgentSignalMappingResult {
        TasteBuddyAgentKnowledgeRuntime.mapFeedbackInputToSignals(
            detailTags: detailTags,
            dishKindTags: dishKindTags,
            lexiconIds: lexiconIds,
            tasteTags: tasteTags
        )
    }

    static func findFoodOnBridgeEntries(
        text: String,
        limit: Int = 8
    ) -> [TasteBuddyAgentFoodOnMatch] {
        TasteBuddyAgentKnowledgeRuntime.findFoodOnEntries(text: text, limit: limit)
    }

    static func mapFoodOnBridgeInput(
        dishKindTags: [String] = [],
        ingredients: [String] = [],
        menuText: String = "",
        techniques: [String] = []
    ) -> TasteBuddyAgentFoodOnMappingResult {
        TasteBuddyAgentKnowledgeRuntime.mapFoodOnInput(
            dishKindTags: dishKindTags,
            ingredients: ingredients,
            menuText: menuText,
            techniques: techniques
        )
    }

    static func inferMenuContext(
        _ menuName: String,
        useFullCatalog: Bool = false
    ) -> TasteBuddyAgentMenuContext {
        TasteBuddyAgentKnowledgeRuntime.inferMenuContext(
            menuName: menuName,
            useFullCatalog: useFullCatalog
        )
    }

    static func rankFoodKnowledge(
        query: String,
        useFullCatalog: Bool = false,
        surface: TasteBuddyAgentKnowledgeSurface = .diningNote,
        limit: Int = 10
    ) -> [TasteBuddyAgentFoodKnowledgeMatch] {
        TasteBuddyAgentKnowledgeRuntime.rankFoodKnowledge(
            query: query,
            entries: useFullCatalog ? foodKnowledgeFullEntries : foodKnowledgeRuntimeEntries,
            surface: surface,
            limit: limit
        )
    }

    private enum EvidenceSide {
        case next
        case previous
    }

    private enum EvidenceMode {
        case adjust
        case remove
        case support
    }

    private struct ConfidenceTarget {
        let id: String
        let label: String?
        let type: TasteBuddyAgentConfidenceSignalType
    }

    private static func confidenceTargets(
        _ event: TasteBuddyAgentFeedbackEvidenceEvent,
        side: EvidenceSide
    ) -> [ConfidenceTarget] {
        let snapshot = side == .next ? event.nextSnapshot : event.previousSnapshot
        let eventSignals = side == .next ? event.nextSignalIds : event.previousSignalIds
        let dishKinds = side == .next ? event.nextDishKindIds : event.previousDishKindIds
        let signals = eventSignals.isEmpty ? snapshot?.tbaSignalIds ?? [] : eventSignals
        var targets = signals.map {
            ConfidenceTarget(id: $0, label: confidenceSignalLabel(.tbaSignal, $0), type: .tbaSignal)
        }
        targets += (snapshot?.lexiconCandidateIds ?? []).map {
            ConfidenceTarget(id: $0, label: confidenceSignalLabel(.lexicon, $0), type: .lexicon)
        }
        targets += (snapshot?.foodOnMatchIds ?? []).map {
            ConfidenceTarget(id: $0, label: confidenceSignalLabel(.foodOn, $0), type: .foodOn)
        }
        targets += (snapshot?.foodKnowledgeMatchIds ?? []).map {
            ConfidenceTarget(
                id: $0,
                label: confidenceSignalLabel(.foodKnowledge, $0),
                type: .foodKnowledge
            )
        }
        targets += dishKinds.map {
            ConfidenceTarget(id: $0, label: confidenceSignalLabel(.dishKind, $0), type: .dishKind)
        }
        var seen: Set<String> = []
        return targets.filter {
            let key = "\($0.type.rawValue):\($0.id)"
            guard !$0.id.isEmpty, !seen.contains(key) else { return false }
            seen.insert(key)
            return true
        }
    }

    private static func confidenceSignalLabel(
        _ type: TasteBuddyAgentConfidenceSignalType,
        _ id: String
    ) -> String {
        switch type {
        case .dishKind:
            return TasteBuddyAgentKnowledgeRuntime.signal(byId: "dish-kind:\(id)")?.label ?? id
        case .tbaSignal:
            return TasteBuddyAgentKnowledgeRuntime.signal(byId: id)?.label ?? id
        case .lexicon:
            return coreTasteLexicon.first { $0.id == id }?.label ?? id
        case .foodKnowledge:
            return TasteBuddyAgentKnowledgeRuntime.foodKnowledgeEntry(byId: id)?.koName ?? id
        case .foodOn:
            return TasteBuddyAgentKnowledgeRuntime.foodOnEntry(byId: id)?.koName ?? id
        }
    }

    private static func explainRecommendation(
        viewer: TasteBuddyAgentTasteProfileSnapshot,
        reviewer: TasteBuddyAgentPublicProfile,
        review: TasteBuddyAgentDiningReview,
        edge: TasteBuddyAgentSimilarityEdge,
        learnedSignals: [String]
    ) -> String {
        let shared = edge.sharedSignals.map(\.label).joined(separator: "과 ")
        let topTaste = sortedTasteAxes(viewer.preferenceVector, count: 1).first?.label
            ?? "현재 미각"
        let learned = learnedSignals.isEmpty
            ? ""
            : " 최근 내 기록에서도 \(learnedSignals.prefix(2).joined(separator: " · ")) 신호가 반복돼 우선순위를 조금 높였어요."
        if edge.similarityScore >= 72 {
            return "\(reviewer.nickname)님과 \(shared) 흐름이 가까워서, \(review.restaurantName)의 기록을 먼저 참고할 만해요.\(learned)"
        }
        return "\(topTaste)을 기준으로 보면 \(review.restaurantName)은 익숙한 취향에서 살짝 넓혀볼 수 있는 경험이에요.\(learned)"
    }

    private static func learnedConfidence(
        review: TasteBuddyAgentDiningReview,
        stateMap: [String: TasteBuddyAgentUserConfidenceState]
    ) -> (labels: [String], score: Double) {
        let mapping = mapFeedbackInputToSignals(
            detailTags: review.experienceTags,
            dishKindTags: review.dishKindTags,
            tasteTags: review.tasteTags
        )
        let ids = review.dishKindTags.map {
            "\(TasteBuddyAgentConfidenceSignalType.dishKind.rawValue):\($0)"
        } + mapping.mappedSignals.map {
            "\(TasteBuddyAgentConfidenceSignalType.tbaSignal.rawValue):\($0.definition.id)"
        }
        let states = ids.compactMap { stateMap[$0] }
            .filter { $0.confidence >= 0.58 }
            .enumerated()
            .sorted {
                $0.element.confidence != $1.element.confidence
                    ? $0.element.confidence > $1.element.confidence
                    : $0.element.evidenceCount != $1.element.evidenceCount
                        ? $0.element.evidenceCount > $1.element.evidenceCount
                        : $0.offset < $1.offset
            }
            .prefix(4)
            .map(\.element)
        guard !states.isEmpty else { return ([], 0) }
        var labels: [String] = []
        states.forEach {
            let label = $0.label ?? confidenceSignalLabel($0.signalType, $0.signalId)
            if !labels.contains(label) { labels.append(label) }
        }
        return (labels, rounded(average(states.map(\.confidence))))
    }

    private static func itemFit(
        viewer: TasteBuddyAgentTasteProfileSnapshot,
        review: TasteBuddyAgentDiningReview
    ) -> Double {
        let active = TasteAxis.allCases.filter { review.tasteSignals[$0.rawValue] != nil }
        guard !active.isEmpty else { return 0.5 }
        return clamp(average(active.map { axis in
            let signal = clamp((review.tasteSignals[axis.rawValue] ?? 0) / 2 + 0.5)
            return 1 - abs((viewer.preferenceVector[axis.rawValue] ?? 0.5) - signal)
        }))
    }

    private static func freshness(_ value: String, now: Date) -> Double {
        let fractionalFormatter = ISO8601DateFormatter()
        fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = fractionalFormatter.date(from: value)
            ?? ISO8601DateFormatter().date(from: value) else {
            return 0.55
        }
        let days = max(0, now.timeIntervalSince(date) / 86_400)
        return clamp(pow(0.5, days / 90), minimum: 0.35)
    }

    private static func stageConfidence(_ stage: TasteBuddyAgentProfileStage) -> Double {
        switch stage {
        case .refined: 1
        case .patterned: 0.82
        case .learning: 0.66
        case .starter: 0.48
        }
    }

    private static func evidenceConfidence(
        _ state: TasteBuddyAgentFeedbackEvidenceState?
    ) -> Double {
        clamp(state?.tbaConfidence ?? state?.snapshot?.confidence ?? 0)
    }

    private static func differentIds(_ left: [String]?, _ right: [String]?) -> Bool {
        Set(left ?? []) != Set(right ?? [])
    }

    private static func snapshotFingerprint(
        _ snapshot: TasteBuddyAgentDiningAnalysisSnapshot?
    ) -> String {
        guard let snapshot else { return "" }
        return [
            snapshot.detailTags.map(\.id).joined(separator: ","),
            snapshot.foodKnowledgeMatchIds.joined(separator: ","),
            snapshot.foodOnMatchIds.joined(separator: ","),
            snapshot.lexiconCandidateIds.joined(separator: ","),
            snapshot.summary,
            snapshot.tasteBubbles.map(\.id).joined(separator: ","),
            snapshot.tbaSignalIds.joined(separator: ","),
            snapshot.version,
        ].joined(separator: "|")
    }

    private static func buildTasteSignals(_ tags: [String]) -> [String: Double] {
        var vector = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { ($0.rawValue, 0.0) }
        )
        for tag in tags {
            for (axis, weight) in tagTasteHints[tag] ?? [:] {
                vector[axis] = rounded((vector[axis] ?? 0) + weight)
            }
        }
        for axis in TasteAxis.allCases where vector[axis.rawValue] != nil {
            vector[axis.rawValue] = rounded(clamp(
                vector[axis.rawValue] ?? 0,
                minimum: -1,
                maximum: 1
            ))
        }
        return vector
    }

    private static let tagTasteHints: [String: [String: Double]] = [
        "crisp": ["sour": 0.58, "bitter": 0.16],
        "delicate": ["sour": 0.22, "bitter": 0.16, "fat": -0.2],
        "deep": ["umami": 0.62, "fat": 0.28],
        "dessert": ["sweet": 0.58, "fat": 0.22],
        "fermented": ["umami": 0.52, "sour": 0.24],
        "fresh": ["sour": 0.5, "bitter": 0.18],
        "gentle": ["sweet": 0.2, "fat": -0.1, "salty": -0.1],
        "grilled": ["bitter": 0.22, "umami": 0.46, "fat": 0.2],
        "rich": ["fat": 0.58, "umami": 0.22],
        "savory": ["umami": 0.6, "salty": 0.2],
        "seafood": ["umami": 0.48, "salty": 0.22, "sour": 0.14],
        "smoky": ["bitter": 0.28, "umami": 0.36],
        "spicy": ["bitter": 0.18, "sour": 0.2],
        "sweet": ["sweet": 0.62],
    ]

    private static func inferPerceptualVector(
        _ vector: [String: Double]
    ) -> [String: Double] {
        let sweet = vector["sweet"] ?? 0.5
        let sour = vector["sour"] ?? 0.5
        let bitter = vector["bitter"] ?? 0.5
        let salty = vector["salty"] ?? 0.5
        let umami = vector["umami"] ?? 0.5
        let fat = vector["fat"] ?? 0.5
        return [
            "brightness": rounded(clamp(sour * 0.55 + bitter * 0.15 + (1 - fat) * 0.18)),
            "heaviness": rounded(clamp(fat * 0.58 + umami * 0.28 + salty * 0.08)),
            "cleanFinish": rounded(clamp((1 - fat) * 0.42 + sour * 0.28 + (1 - umami) * 0.12)),
            "linger": rounded(clamp(umami * 0.36 + bitter * 0.24 + fat * 0.2)),
            "smoke": rounded(clamp(bitter * 0.34 + umami * 0.2 + fat * 0.12)),
            "aromaIntensity": rounded(clamp(sour * 0.25 + bitter * 0.22 + umami * 0.18 + sweet * 0.12)),
            "textureRichness": rounded(clamp(fat * 0.5 + umami * 0.2 + sweet * 0.12)),
            "thermalImpact": rounded(clamp(bitter * 0.18 + sour * 0.16 + salty * 0.14 + umami * 0.12)),
        ]
    }

    private static func vectorSimilarity(
        keys: [String],
        left: [String: Double],
        right: [String: Double],
        confidence: [String: Double] = [:]
    ) -> Double {
        var total = 0.0
        var distance = 0.0
        for key in keys {
            let weight = clamp(confidence[key] ?? 1, minimum: 0.25)
            total += weight
            distance += abs((left[key] ?? 0) - (right[key] ?? 0)) * weight
        }
        return total > 0 ? clamp(1 - distance / total) : 0
    }

    private static func sharedDistance(
        _ axis: TasteAxis,
        _ source: TasteBuddyAgentTasteProfileSnapshot,
        _ target: TasteBuddyAgentTasteProfileSnapshot
    ) -> Double {
        1 - tasteDifference(axis, source, target)
    }

    private static func tasteDifference(
        _ axis: TasteAxis,
        _ source: TasteBuddyAgentTasteProfileSnapshot,
        _ target: TasteBuddyAgentTasteProfileSnapshot
    ) -> Double {
        abs((source.tasteVector[axis.rawValue] ?? 0) - (target.tasteVector[axis.rawValue] ?? 0))
    }

    private static func sortedTasteAxes(
        _ vector: [String: Double],
        count: Int
    ) -> [TasteAxis] {
        TasteAxis.allCases.sorted {
            (vector[$0.rawValue] ?? 0) > (vector[$1.rawValue] ?? 0)
        }.prefix(count).map(\.self)
    }

    private static func sortedPerceptualAxes(
        _ vector: [String: Double],
        count: Int
    ) -> [TasteBuddyAgentPerceptualAxis] {
        TasteBuddyAgentPerceptualAxis.allCases.sorted {
            (vector[$0.rawValue] ?? 0) > (vector[$1.rawValue] ?? 0)
        }.prefix(count).map(\.self)
    }

    private static func normalizeTags(_ tags: [String]) -> [String] {
        tags.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
            .filter { !$0.isEmpty }
            .prefix(6)
            .map(\.self)
    }

    private static func normalizeMeasurement(_ value: Double?) -> Double {
        guard let value, value.isFinite else { return 0.5 }
        return clamp(value / 10)
    }

    private static func nonEmpty(_ value: String?) -> String? {
        let resolved = value?.trimmingCharacters(in: .whitespacesAndNewlines)
        return resolved?.isEmpty == false ? resolved : nil
    }

    private static func average(_ values: [Double]) -> Double {
        values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)
    }

    private static func clamp(
        _ value: Double,
        minimum: Double = 0,
        maximum: Double = 1
    ) -> Double {
        min(maximum, max(minimum, value))
    }

    private static func rounded(_ value: Double) -> Double {
        Double(String(format: "%.3f", value)) ?? value
    }
}
