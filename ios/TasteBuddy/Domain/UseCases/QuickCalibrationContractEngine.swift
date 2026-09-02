import Foundation

enum QuickCalibrationContractEngine {
    private static let relativeMinimum = -3
    private static let relativeMaximum = 3

    static func makeResult(
        responses: [TasteAxis: Int],
        measuredAt: String
    ) -> QuickCalibrationContractResult {
        let relativeValues = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                (axis, clampedResponse(responses[axis] ?? 0))
            }
        )
        let absoluteValues = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                (axis, absoluteScore(for: relativeValues[axis] ?? 0))
            }
        )
        let measurementValues = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                (axis, measurementValue(for: absoluteValues[axis] ?? 0))
            }
        )
        let guidance = makeGuidance(axisValues: measurementValues)

        return QuickCalibrationContractResult(
            absoluteScores: TasteAxisIntVector(values: absoluteValues),
            relativeScores: TasteAxisIntVector(values: relativeValues),
            snapshot: TasteMeasurementSnapshotContract(
                measuredAt: measuredAt,
                results: TasteAxisDoubleVector(values: measurementValues),
                source: .broadStarter
            ),
            starterGuidance: guidance
        )
    }

    private static func clampedResponse(_ value: Int) -> Int {
        min(relativeMaximum, max(relativeMinimum, value))
    }

    private static func absoluteScore(for value: Int) -> Int {
        Int((Double(value - relativeMinimum) / Double(relativeMaximum - relativeMinimum) * 100).rounded())
    }

    private static func measurementValue(for score: Int) -> Double {
        (Double(score) / 10 * 10).rounded() / 10
    }

    private static func makeGuidance(
        axisValues: [TasteAxis: Double]
    ) -> RestaurantReadyGuidanceContract {
        let sortedEntries = TasteAxis.allCases
            .map { axis in (axis: axis, value: axisValues[axis] ?? 0) }
            .sorted { left, right in
                if left.value == right.value {
                    return axisIndex(left.axis) < axisIndex(right.axis)
                }
                return left.value > right.value
            }
        let topEntries = Array(sortedEntries.prefix(2))
        let topAxes = topEntries.map(\.axis)
        let topLabels = topAxes.map(\.label)
        let cautionAxis = sortedEntries.last?.axis ?? .fat
        let cautionValue = axisValues[cautionAxis] ?? 0
        let allValues = TasteAxis.allCases.map { axisValues[$0] ?? 0 }
        let spread = (sortedEntries.first?.value ?? 0) - (sortedEntries.last?.value ?? 0)
        let goalPhrase = profileBalancePhrase(values: allValues)
        let cautionClause = cautionClause(axisLabel: cautionAxis.label, value: cautionValue)
        let summaryLine: String

        if spread < 1.2 {
            summaryLine = "전반적으로 기준점에 가까운 균형형 스타터 프로필이에요. \(cautionClause) 첫 추천은 \(goalPhrase) 쪽으로 시작하면 잘 맞을 가능성이 높아요."
        } else {
            let topLabelText = topLabels.joined(separator: "과 ")
            let descriptor = axisGroupDescriptor(values: topEntries.map(\.value))
            summaryLine = "지금은 \(topLabelText) 축이 \(descriptor) 살아나요. \(cautionClause) 첫 추천은 \(goalPhrase) 쪽으로 시작하면 잘 맞을 가능성이 높아요."
        }

        return RestaurantReadyGuidanceContract(
            cautionAxis: cautionAxis,
            cautionLabel: cautionAxis.label,
            confidence: .starter,
            context: StarterDiningContextContract(
                baselineReference: "popular-k-fnb",
                calibrationMode: "digital-anchoring"
            ),
            evidence: evidence(
                axisValues: axisValues,
                sortedEntries: sortedEntries,
                cautionLabel: cautionAxis.label
            ),
            goalPhrase: goalPhrase,
            summaryLine: summaryLine,
            surfaceLabel: "빠른 스타터 가이드",
            topAxes: topAxes,
            topLabels: topLabels
        )
    }

    private static func axisIndex(_ axis: TasteAxis) -> Int {
        TasteAxis.allCases.firstIndex(of: axis) ?? 0
    }

    private static func average(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / Double(values.count)
    }

    private static func axisGroupDescriptor(values: [Double]) -> String {
        let value = average(values)

        if value >= 7.6 { return "기준점보다 훨씬 또렷하게" }
        if value >= 5.9 { return "기준점보다 조금 더 또렷하게" }
        if value <= 2.4 { return "강하게 밀기보다 많이 덜어냈을 때" }
        if value <= 4.1 { return "한 톤 덜어냈을 때" }
        return "기준점에 가깝게"
    }

    private static func profileBalancePhrase(values: [Double]) -> String {
        let value = average(values)

        if value >= 6.7 { return "맛의 결이 분명한 메뉴" }
        if value <= 3.3 { return "강도를 한 톤 정리한 메뉴" }
        return "기준점 근처에서 밸런스가 좋은 메뉴"
    }

    private static func cautionClause(axisLabel: String, value: Double) -> String {
        if value <= 2.4 {
            return "\(axisLabel)은 한 번에 세게 밀기보다 여백을 두는 편이 안정적이에요."
        }
        if value <= 4.1 {
            return "\(axisLabel)은 과하게 밀지 않는 편이 더 편안해요."
        }
        if value >= 7.6 {
            return "\(axisLabel)은 반응이 빠른 편이라 과해지면 전체 인상이 쉽게 무거워질 수 있어요."
        }
        return "\(axisLabel)은 다른 축과의 균형을 보며 조절하면 좋아요."
    }

    private static func evidence(
        axisValues: [TasteAxis: Double],
        sortedEntries: [(axis: TasteAxis, value: Double)],
        cautionLabel: String
    ) -> [String] {
        let first = sortedEntries.first ?? (.sweet, 5)
        let second = sortedEntries.dropFirst().first ?? (.sour, 5)
        let allValues = TasteAxis.allCases.map { axisValues[$0] ?? 0 }

        return [
            "\(first.axis.label)은 \(preferenceLabel(value: first.value)) 편이에요.",
            "\(second.axis.label)도 \(preferenceLabel(value: second.value)) 축으로 읽혀요.",
            "조심할 축은 \(cautionLabel)이고, 강도를 과하게 밀지 않는 편이 좋아요.",
            "전체적인 시작점은 \(profileBalancePhrase(values: allValues))에 가까워요.",
        ]
    }

    private static func preferenceLabel(value: Double) -> String {
        if value <= 2.4 { return "강하게 밀기보다 훨씬 덜어냈을 때 편안한" }
        if value <= 4.1 { return "조금 덜어냈을 때 안정적인" }
        if value >= 7.6 { return "기준보다 훨씬 선명해야 반응하는" }
        if value >= 5.9 { return "기준보다 조금 선명할 때 살아나는" }
        return "기준점에 가깝게 편안한"
    }
}
