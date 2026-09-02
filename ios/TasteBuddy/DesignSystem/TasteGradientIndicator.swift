import SwiftUI

struct TasteGradientIndicatorSegment {
    let color: Color
    let weight: Double

    init(color: Color, weight: Double = 1) {
        self.color = color
        self.weight = weight
    }
}

enum TasteGradientIndicatorStyle {
    case circle
    case verticalCapsule
}

enum TasteGradientIndicatorMetrics {
    static let circleSize: CGFloat = 16
    static let verticalCapsuleWidth: CGFloat = 8
    static let transitionHalfWidth = 0.16

    static func normalizedWeights(_ weights: [Double], count: Int) -> [Double] {
        guard count > 0 else { return [] }
        let resolved = (0..<count).map { index in
            index < weights.count ? max(abs(weights[index]), 0) : 0
        }
        let total = resolved.reduce(0, +)
        guard total > 0 else {
            return Array(repeating: 1 / Double(count), count: count)
        }
        return resolved.map { $0 / total }
    }
}

/// A semantic taste signal shared by compact summary headers and interpretation cards.
/// Segment weights control each taste color's visible area; adjacent colors use one
/// consistent soft transition instead of a hard boundary.
struct TasteGradientIndicator: View {
    let segments: [TasteGradientIndicatorSegment]
    var style: TasteGradientIndicatorStyle = .circle

    var body: some View {
        Group {
            switch style {
            case .circle:
                Circle()
                    .fill(fill)
                    .frame(
                        width: TasteGradientIndicatorMetrics.circleSize,
                        height: TasteGradientIndicatorMetrics.circleSize
                    )
            case .verticalCapsule:
                Capsule()
                    .fill(fill)
                    .frame(width: TasteGradientIndicatorMetrics.verticalCapsuleWidth)
            }
        }
        .accessibilityHidden(true)
    }

    private var fill: LinearGradient {
        LinearGradient(
            gradient: weightedGradient,
            startPoint: .top,
            endPoint: .bottom
        )
    }

    private var weightedGradient: Gradient {
        let resolvedSegments = segments.isEmpty
            ? [TasteGradientIndicatorSegment(color: TBColor.textDisabled)]
            : segments
        let colors = resolvedSegments.map(\.color)

        guard colors.count > 1 else {
            return Gradient(colors: colors)
        }

        let normalizedWeights = TasteGradientIndicatorMetrics.normalizedWeights(
            resolvedSegments.map(\.weight),
            count: colors.count
        )
        var stops = [Gradient.Stop(color: colors[0], location: 0)]
        var cumulativeWeight = 0.0

        for index in 0..<(colors.count - 1) {
            cumulativeWeight += normalizedWeights[index]
            let transitionHalfWidth = min(
                TasteGradientIndicatorMetrics.transitionHalfWidth,
                normalizedWeights[index] / 2,
                normalizedWeights[index + 1] / 2
            )
            stops.append(
                Gradient.Stop(
                    color: colors[index],
                    location: CGFloat(max(cumulativeWeight - transitionHalfWidth, 0))
                )
            )
            stops.append(
                Gradient.Stop(
                    color: colors[index + 1],
                    location: CGFloat(min(cumulativeWeight + transitionHalfWidth, 1))
                )
            )
        }

        stops.append(Gradient.Stop(color: colors[colors.count - 1], location: 1))
        return Gradient(stops: stops)
    }
}

#Preview("Taste gradient indicators") {
    HStack(spacing: TBSpacing.x16) {
        TasteGradientIndicator(
            segments: [
                TasteGradientIndicatorSegment(color: TasteAxis.sour.mainColor, weight: 3),
                TasteGradientIndicatorSegment(color: TasteAxis.umami.mainColor, weight: 1),
            ]
        )

        TasteGradientIndicator(
            segments: [
                TasteGradientIndicatorSegment(color: TasteAxis.sour.mainColor, weight: 3),
                TasteGradientIndicatorSegment(color: TasteAxis.umami.mainColor, weight: 1),
            ],
            style: .verticalCapsule
        )
        .frame(height: 48)
    }
    .padding(TBSpacing.page)
    .background(TBColor.page)
}
