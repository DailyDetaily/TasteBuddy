import Foundation

enum TasteSurveyScoringEngine {
    private static let constructWeights: [TasteSurveyConstructContract: Double] = [
        .overload: 0.42,
        .salience: 0.58,
    ]
    private static let anchorConfidenceFactors: [TasteSurveyAnchorStabilityContract: Double] = [
        .high: 1,
        .medium: 0.88,
        .low: 0.72,
    ]
    private static let exploratoryConfidenceFactors: [TasteAxis: Double] = [
        .fat: 0.82,
        .umami: 0.82,
    ]
    private static let defaultMeasurementValues: [TasteAxis: Double] = [
        .sweet: 8.5,
        .sour: 7.4,
        .bitter: 4,
        .salty: 6,
        .umami: 3,
        .fat: 5.5,
    ]

    static func score(
        items: [TasteSurveyItemContract],
        responses: [TasteSurveyResponseContract],
        measuredAt: String
    ) -> TasteSurveyScoringOutputContract {
        let responsesByItem = Dictionary(
            uniqueKeysWithValues: responses.map { ($0.itemId, $0) }
        )
        let scores = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                (
                    axis,
                    scoreAxis(
                        axis,
                        items: items,
                        responsesByItem: responsesByItem
                    )
                )
            }
        )
        let measurementValues = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                let score = scores[axis]?.baseVectorScore.map {
                    roundedToOneDecimal(clamp($0) * 10)
                }
                return (axis, score)
            }
        )

        return TasteSurveyScoringOutputContract(
            snapshot: TasteSurveyMeasurementSnapshotContract(
                measuredAt: measuredAt,
                results: TasteAxisOptionalDoubleVector(values: measurementValues),
                source: .broadStarter
            ),
            tasteScores: scores
        )
    }

    static func makeCompatibleResult(
        items: [TasteSurveyItemContract],
        responses: [TasteSurveyResponseContract],
        measuredAt: String
    ) -> TasteSurveyCompatibleResultContract {
        let output = score(items: items, responses: responses, measuredAt: measuredAt)
        return TasteSurveyCompatibleResultContract(
            snapshot: output.snapshot,
            starterGuidance: makeGuidance(
                snapshot: output.snapshot,
                tasteScores: output.tasteScores
            )
        )
    }

    static func makeProfile(from result: TasteSurveyCompatibleResultContract) -> TasteProfile {
        let scores = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                let value = result.snapshot.results[axis]
                    ?? defaultMeasurementValues[axis]
                    ?? 5
                return (axis.rawValue, Int((value * 10).rounded()))
            }
        )
        let date = ISO8601DateFormatter().date(from: result.snapshot.measuredAt) ?? .now

        return TasteProfile(
            createdAt: date,
            scores: scores,
            confidence: result.starterGuidance.confidence.rawValue,
            summary: result.starterGuidance.summaryLine,
            topAxes: result.starterGuidance.topAxes,
            cautionAxis: result.starterGuidance.cautionAxis
        )
    }

    private static func scoreAxis(
        _ axis: TasteAxis,
        items: [TasteSurveyItemContract],
        responsesByItem: [String: TasteSurveyResponseContract]
    ) -> TasteSurveyTasteScoreContract {
        let axisItems = items.filter { $0.tasteId == axis }
        let entries = axisItems.map { item -> ScoredEntry in
            let response = responsesByItem[item.id]
            return ScoredEntry(
                confidence: itemConfidence(item: item, response: response),
                construct: item.construct,
                score: validScore(response),
                weight: constructWeights[item.construct] ?? 0
            )
        }
        let validEntries = entries.filter { $0.score != nil }
        var constructScores: [TasteSurveyConstructContract: Double] = [:]
        var constructConfidence: [TasteSurveyConstructContract: Double] = [:]

        for construct in TasteSurveyConstructContract.allCases {
            let validConstructEntries = validEntries.filter { $0.construct == construct }
            if let score = weightedAverage(validConstructEntries) {
                constructScores[construct] = score
            }

            let constructEntries = entries.filter { $0.construct == construct }
            if !constructEntries.isEmpty {
                constructConfidence[construct] = clamp(
                    constructEntries.map(\.confidence).reduce(0, +)
                        / Double(constructEntries.count)
                )
            }
        }

        let confidence = axisItems.isEmpty
            ? 0
            : clamp(entries.map(\.confidence).reduce(0, +) / Double(axisItems.count))

        return TasteSurveyTasteScoreContract(
            baseVectorScore: weightedAverage(validEntries),
            confidence: confidence,
            constructConfidence: constructConfidence,
            constructScores: constructScores,
            excludedItemCount: entries.count - validEntries.count,
            respondedItemCount: validEntries.count,
            tasteId: axis,
            totalItemCount: axisItems.count
        )
    }

    private static func validScore(_ response: TasteSurveyResponseContract?) -> Double? {
        guard
            let response,
            !response.uncertain,
            let value = response.selectedValue,
            (1...7).contains(value)
        else {
            return nil
        }

        return Double(value - 1) / 6
    }

    private static func itemConfidence(
        item: TasteSurveyItemContract,
        response: TasteSurveyResponseContract?
    ) -> Double {
        guard validScore(response) != nil else {
            return 0
        }

        let stability = anchorConfidenceFactors[item.anchor.stability] ?? 0
        let exploratory = exploratoryConfidenceFactors[item.tasteId] ?? 1
        return clamp(stability * exploratory)
    }

    private static func weightedAverage(_ entries: [ScoredEntry]) -> Double? {
        let totalWeight = entries.reduce(0) {
            $0 + $1.weight * $1.confidence
        }
        guard totalWeight > 0 else {
            return nil
        }

        let weightedSum = entries.reduce(0) {
            $0 + ($1.score ?? 0) * $1.weight * $1.confidence
        }
        return clamp(weightedSum / totalWeight)
    }

    private static func makeGuidance(
        snapshot: TasteSurveyMeasurementSnapshotContract,
        tasteScores: [TasteAxis: TasteSurveyTasteScoreContract]
    ) -> RestaurantReadyGuidanceContract {
        let resolvedValues = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                (axis, snapshot.results[axis] ?? defaultMeasurementValues[axis] ?? 0)
            }
        )
        let sorted = TasteAxis.allCases
            .map { (axis: $0, value: resolvedValues[$0] ?? 0) }
            .sorted { left, right in
                if left.value == right.value {
                    return axisIndex(left.axis) < axisIndex(right.axis)
                }
                return left.value > right.value
            }
        let topAxes = sorted.prefix(2).map(\.axis)
        let cautionAxis = sorted.last?.axis ?? .fat
        let confidence = confidenceBand(tasteScores)
        let context = StarterDiningContextContract(
            baselineReference: "popular-k-fnb",
            calibrationMode: "digital-anchoring"
        )
        let baseGuidance = RestaurantReadyGuidanceContract(
            cautionAxis: cautionAxis,
            cautionLabel: cautionAxis.label,
            confidence: confidence,
            context: context,
            evidence: [],
            goalPhrase: profileBalancePhrase(
                TasteAxis.allCases.map { resolvedValues[$0] ?? 0 }
            ),
            summaryLine: "",
            surfaceLabel: "설문 기반 스타터 가이드",
            topAxes: topAxes,
            topLabels: topAxes.map(\.label)
        )
        let cautionConfidence = tasteScores[cautionAxis]?.confidence ?? 0
        let exploratoryCaution = cautionAxis == .umami || cautionAxis == .fat
        let cautionPhrase = cautionConfidence < 0.5 || exploratoryCaution
            ? "\(cautionAxis.label)은 아직 확정하기보다 다음 식사에서 더 확인할 포인트예요."
            : "\(cautionAxis.label)은 강도가 빠르게 쌓이는지 조심스럽게 볼 포인트예요."
        let topLabelText = baseGuidance.topLabels.joined(separator: "과 ")
        let summary = topLabelText.isEmpty
            ? "최근 응답으로 만든 시작 프로필이에요. \(cautionPhrase) 이 해석은 예약 개인화의 출발점으로 쓰이고, 식후 피드백이 쌓이면 더 정교해집니다."
            : "최근 응답에서는 \(topLabelText) 쪽의 차이가 먼저 읽히는 시작 프로필로 보여요. \(cautionPhrase) 이 해석은 예약 개인화의 출발점으로 쓰이고, 식후 피드백이 쌓이면 더 정교해집니다."

        return RestaurantReadyGuidanceContract(
            cautionAxis: baseGuidance.cautionAxis,
            cautionLabel: baseGuidance.cautionLabel,
            confidence: baseGuidance.confidence,
            context: baseGuidance.context,
            evidence: surveyEvidence(
                guidance: baseGuidance,
                tasteScores: tasteScores
            ),
            goalPhrase: baseGuidance.goalPhrase,
            summaryLine: summary,
            surfaceLabel: baseGuidance.surfaceLabel,
            topAxes: baseGuidance.topAxes,
            topLabels: baseGuidance.topLabels
        )
    }

    private static func confidenceBand(
        _ tasteScores: [TasteAxis: TasteSurveyTasteScoreContract]
    ) -> TasteProfileConfidenceContract {
        let average = TasteAxis.allCases.reduce(0) {
            $0 + (tasteScores[$1]?.confidence ?? 0)
        } / Double(TasteAxis.allCases.count)
        return average >= 0.82 ? .building : .starter
    }

    private static func surveyEvidence(
        guidance: RestaurantReadyGuidanceContract,
        tasteScores: [TasteAxis: TasteSurveyTasteScoreContract]
    ) -> [String] {
        let topEvidence = guidance.topAxes.map { axis in
            let confidence = tasteScores[axis]?.confidence ?? 0
            let note = confidence < 0.5 ? "아직 더 확인할 축으로" : "먼저 읽히는 축으로"
            return "\(axis.label)은 최근 응답에서 \(note) 나타났어요."
        }
        let exploratoryEvidence: [String] = [TasteAxis.umami, .fat].compactMap { axis in
            guard (tasteScores[axis]?.respondedItemCount ?? 0) > 0 else {
                return nil
            }
            return "\(axis.label)은 탐색 축이라 다음 식사 피드백과 함께 조심스럽게 다듬어요."
        }

        return topEvidence
            + ["조심할 축은 \(guidance.cautionLabel)이고, 강도가 빠르게 쌓이는지 이어서 확인합니다."]
            + exploratoryEvidence
    }

    private static func profileBalancePhrase(_ values: [Double]) -> String {
        let average = values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)
        if average >= 6.7 {
            return "맛의 결이 분명한 메뉴"
        }
        if average <= 3.3 {
            return "강도를 한 톤 정리한 메뉴"
        }
        return "기준점 근처에서 밸런스가 좋은 메뉴"
    }

    private static func axisIndex(_ axis: TasteAxis) -> Int {
        TasteAxis.allCases.firstIndex(of: axis) ?? 0
    }

    private static func clamp(_ value: Double, min: Double = 0, max: Double = 1) -> Double {
        Swift.min(Swift.max(value, min), max)
    }

    private static func roundedToOneDecimal(_ value: Double) -> Double {
        (value * 10).rounded() / 10
    }

    private struct ScoredEntry {
        let confidence: Double
        let construct: TasteSurveyConstructContract
        let score: Double?
        let weight: Double
    }
}
