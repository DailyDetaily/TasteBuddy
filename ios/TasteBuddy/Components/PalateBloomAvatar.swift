import SwiftUI
import UIKit

struct PalateBloomProfile: Equatable {
    private(set) var values: [TasteAxis: Double]

    init(values: [TasteAxis: Double]) {
        self.values = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                (axis, Self.clamp(values[axis] ?? 0))
            }
        )
    }

    init(profile: TasteProfile) {
        self.init(
            values: Dictionary(
                uniqueKeysWithValues: TasteAxis.allCases.map { axis in
                    (axis, Double(profile.score(for: axis)))
                }
            )
        )
    }

    subscript(axis: TasteAxis) -> Double {
        values[axis] ?? 0
    }

    static func fallback(seed: String? = nil) -> PalateBloomProfile {
        let normalizedSeed = seed?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedSeed = normalizedSeed?.isEmpty == false
            ? normalizedSeed!
            : "taste-buddy-palate-bloom-fallback"
        let valueBands = [84.0, 73.0, 63.0, 52.0, 42.0, 31.0]
        let tasteOrder = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.enumerated().map { ($0.element, $0.offset) }
        )
        let rankedAxes = TasteAxis.allCases.sorted { left, right in
            let leftHash = PalateBloomHash.fnv1a(
                "\(resolvedSeed)|fallbackRank|\(left.rawValue)"
            )
            let rightHash = PalateBloomHash.fnv1a(
                "\(resolvedSeed)|fallbackRank|\(right.rawValue)"
            )

            if leftHash == rightHash {
                return (tasteOrder[left] ?? 0) < (tasteOrder[right] ?? 0)
            }
            return leftHash > rightHash
        }

        var values: [TasteAxis: Double] = [:]
        for (index, axis) in rankedAxes.enumerated() {
            let jitterHash = PalateBloomHash.fnv1a(
                "\(resolvedSeed)|fallbackValue|\(axis.rawValue)"
            )
            let jitter = Double(Int(jitterHash % 11) - 5)
            values[axis] = clamp(valueBands[index] + jitter)
        }
        return PalateBloomProfile(values: values)
    }

    static let sampleA = PalateBloomProfile(values: [
        .sweet: 82, .umami: 75, .salty: 67, .fat: 43, .sour: 31, .bitter: 24
    ])
    static let sampleB = PalateBloomProfile(values: [
        .umami: 79, .sour: 61, .bitter: 56, .fat: 48, .salty: 34, .sweet: 29
    ])
    static let sampleC = PalateBloomProfile(values: [
        .salty: 84, .fat: 63, .umami: 58, .sour: 42, .sweet: 38, .bitter: 21
    ])

    fileprivate var seedValue: String {
        TasteAxis.allCases.map { axis in
            "\(axis.rawValue):\(Int((self[axis] * 10).rounded()))"
        }
        .joined(separator: "|")
    }

    private static func clamp(_ value: Double) -> Double {
        min(100, max(0, value.isFinite ? value : 0))
    }
}

enum PalateBloomHash {
    static func fnv1a(_ value: String) -> UInt32 {
        var hash: UInt32 = 2_166_136_261
        for codeUnit in value.utf16 {
            hash ^= UInt32(codeUnit)
            hash = hash &* 16_777_619
        }
        return hash
    }
}

enum PalateBloomPetalShape: String, CaseIterable {
    case roundPetal
    case capsulePetal
    case softDiamondPetal
    case serratedTipPetal
}

enum PalateBloomStarShape: String, CaseIterable {
    case thinStar
    case roundedSpokeStar
    case dottedRayStar
}

enum PalateBloomCoreShape: String, CaseIterable {
    case solidCore
    case diamondCore
    case seedCluster
}

struct PalateBloomShapeVariant: Equatable {
    let coreShape: PalateBloomCoreShape
    let petalShape: PalateBloomPetalShape
    let starShape: PalateBloomStarShape
}

struct PalateBloomLayout {
    let layers: [Layer]
    let shapeCount: Int
    let shapeVariant: PalateBloomShapeVariant
    let innerLayerScale: Double
    let largePetalDistance: Double
    let largePetalRadius: Double
    let smallPetalDistance: Double
    let smallPetalRadius: Double
    let largeStarOuterRadius: Double
    let largeStarInnerRadius: Double
    let smallStarOuterRadius: Double
    let smallStarInnerRadius: Double
    let coreRadius: Double

    struct Layer {
        let axis: TasteAxis
        let value: Double
        let ratio: Double
        let visualWeight: Double
    }

    static func make(
        profile: PalateBloomProfile,
        shapeSeed: String? = nil,
        shapeCountOverride: Int? = nil
    ) -> PalateBloomLayout {
        let bloomSeed = makeSeed(profile: profile, shapeSeed: shapeSeed)
        let shapeCount = shapeCountOverride.map { min(8, max(4, $0)) }
            ?? (4 + Int(PalateBloomHash.fnv1a("\(bloomSeed)|sharedShapeCount") % 5))
        let variant = PalateBloomShapeVariant(
            coreShape: seededOption(
                PalateBloomCoreShape.allCases,
                seed: bloomSeed,
                salt: "coreShape"
            ),
            petalShape: seededOption(
                PalateBloomPetalShape.allCases,
                seed: bloomSeed,
                salt: "petalShape"
            ),
            starShape: seededOption(
                PalateBloomStarShape.allCases,
                seed: bloomSeed,
                salt: "starShape"
            )
        )
        let layers = buildLayers(profile: profile)
        let uniformRatio = 1.0 / Double(TasteAxis.allCases.count)
        let spread = clamp01(
            layers.reduce(0) { $0 + abs($1.ratio - uniformRatio) }
                / (2 * (1 - uniformRatio))
        )
        let rankGapWeights = [1.0, 0.88, 0.76, 0.64, 0.52]
        let rankGapPressureTotal = layers.dropFirst().enumerated().reduce(0.0) {
            total, pair in
            let index = pair.offset
            let layer = pair.element
            let previous = layers[index]
            let gap = clamp01(
                (previous.ratio - layer.ratio) / max(previous.ratio, uniformRatio)
            )
            return total + pow(gap, 0.62) * rankGapWeights[index]
        }
        let rankGapPressure = rankGapPressureTotal / rankGapWeights.reduce(0, +)
        let dominanceGap = clamp01(
            (layers[0].ratio - layers[1].ratio)
                / max(layers[0].ratio, uniformRatio)
        )
        let dominanceStrength = clamp01(
            pow(dominanceGap, 0.62) * 0.42
                + pow(spread, 0.74) * 0.34
                + rankGapPressure * 0.18
                + pow(layers[0].value / 100, 0.8) * 0.06
        )
        let innerLayerScale = mapRange(
            dominanceStrength,
            inMin: 0,
            inMax: 1,
            outMin: 1.03,
            outMax: 0.72
        )
        let largePetalDistance = mapRange(
            layers[1].visualWeight,
            inMin: 0,
            inMax: 1,
            outMin: 16.5,
            outMax: 20.5
        ) * innerLayerScale
        let largePetalRadius = mapRange(
            layers[1].visualWeight,
            inMin: 0,
            inMax: 1,
            outMin: 11.5,
            outMax: 15.5
        ) * innerLayerScale
        let smallPetalDistance = mapRange(
            layers[2].visualWeight,
            inMin: 0,
            inMax: 1,
            outMin: 8.5,
            outMax: 11.5
        ) * innerLayerScale
        let smallPetalRadius = mapRange(
            layers[2].visualWeight,
            inMin: 0,
            inMax: 1,
            outMin: 4.5,
            outMax: 6.8
        ) * innerLayerScale
        let largeStarOuterRadius = (largePetalDistance + largePetalRadius) * mapRange(
            layers[3].visualWeight,
            inMin: 0,
            inMax: 1,
            outMin: 0.66,
            outMax: 0.78
        )
        let largeStarInnerRadius = min(
            largeStarOuterRadius * mapRange(
                layers[3].visualWeight,
                inMin: 0,
                inMax: 1,
                outMin: 0.06,
                outMax: 0.11
            ),
            smallPetalRadius * 0.6
        )
        let smallStarOuterRadius = min(
            (smallPetalDistance + smallPetalRadius) * mapRange(
                layers[4].visualWeight,
                inMin: 0,
                inMax: 1,
                outMin: 0.78,
                outMax: 0.9
            ),
            largeStarOuterRadius - 2.8
        )
        let smallStarInnerRadius = min(
            smallStarOuterRadius * mapRange(
                layers[4].visualWeight,
                inMin: 0,
                inMax: 1,
                outMin: 0.14,
                outMax: 0.22
            ),
            smallPetalRadius * 0.92
        )
        let coreRadius = mapRange(
            layers[5].visualWeight,
            inMin: 0,
            inMax: 1,
            outMin: 3.2,
            outMax: 5.8
        ) * sqrt(innerLayerScale)

        return PalateBloomLayout(
            layers: layers,
            shapeCount: shapeCount,
            shapeVariant: variant,
            innerLayerScale: innerLayerScale,
            largePetalDistance: largePetalDistance,
            largePetalRadius: largePetalRadius,
            smallPetalDistance: smallPetalDistance,
            smallPetalRadius: smallPetalRadius,
            largeStarOuterRadius: largeStarOuterRadius,
            largeStarInnerRadius: largeStarInnerRadius,
            smallStarOuterRadius: smallStarOuterRadius,
            smallStarInnerRadius: smallStarInnerRadius,
            coreRadius: coreRadius
        )
    }

    private static let rankWeights = [1.0, 0.82, 0.66, 0.5, 0.36, 0.24]

    private static func buildLayers(profile: PalateBloomProfile) -> [Layer] {
        let tasteOrder = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.enumerated().map { ($0.element, $0.offset) }
        )
        let sortedAxes = TasteAxis.allCases.sorted { left, right in
            let leftValue = profile[left]
            let rightValue = profile[right]
            if leftValue == rightValue {
                return (tasteOrder[left] ?? 0) < (tasteOrder[right] ?? 0)
            }
            return leftValue > rightValue
        }
        let total = sortedAxes.reduce(0) { $0 + profile[$1] }
        let fallbackRatio = 1.0 / Double(TasteAxis.allCases.count)
        let ratios = sortedAxes.map {
            total > 0 ? profile[$0] / total : fallbackRatio
        }
        let maxRatio = max(ratios.max() ?? fallbackRatio, fallbackRatio)
        let minRatio = min(ratios.min() ?? fallbackRatio, fallbackRatio)

        return sortedAxes.enumerated().map { index, axis in
            let ratio = ratios[index]
            let relationshipWeight: Double
            if maxRatio == minRatio {
                relationshipWeight = 0.5
            } else {
                let spreadPosition = (ratio - minRatio) / (maxRatio - minRatio)
                let leaderPosition = maxRatio > 0 ? ratio / maxRatio : 0.5
                relationshipWeight = clamp01(
                    pow(spreadPosition, 0.72) * 0.62
                        + pow(leaderPosition, 0.7) * 0.38
                )
            }
            let visualWeight = clamp01(
                (profile[axis] / 100) * 0.12
                    + rankWeights[index] * 0.36
                    + relationshipWeight * 0.52
            )
            return Layer(
                axis: axis,
                value: profile[axis],
                ratio: ratio,
                visualWeight: visualWeight
            )
        }
    }

    private static func makeSeed(
        profile: PalateBloomProfile,
        shapeSeed: String?
    ) -> String {
        let normalizedSeed = shapeSeed?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard let normalizedSeed, !normalizedSeed.isEmpty else {
            return profile.seedValue
        }
        return "\(normalizedSeed)|\(profile.seedValue)"
    }

    private static func seededOption<Option>(
        _ options: [Option],
        seed: String,
        salt: String
    ) -> Option {
        let index = Int(PalateBloomHash.fnv1a("\(seed)|\(salt)") % UInt32(options.count))
        return options[index]
    }

    private static func clamp01(_ value: Double) -> Double {
        min(1, max(0, value))
    }

    private static func mapRange(
        _ value: Double,
        inMin: Double,
        inMax: Double,
        outMin: Double,
        outMax: Double
    ) -> Double {
        guard inMin != inMax else { return outMin }
        return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
    }
}

struct PalateBloomAvatar: View {
    let size: CGFloat
    let bloomProfile: PalateBloomProfile
    let shapeSeed: String?
    let image: UIImage?
    let showFrame: Bool
    let shapeCountOverride: Int?
    let petalShapeOverride: PalateBloomPetalShape?
    let starShapeOverride: PalateBloomStarShape?
    let coreShapeOverride: PalateBloomCoreShape?

    init(
        size: CGFloat = 40,
        bloomProfile: PalateBloomProfile,
        shapeSeed: String? = nil,
        image: UIImage? = nil,
        showFrame: Bool = true,
        shapeCountOverride: Int? = nil,
        petalShape: PalateBloomPetalShape? = nil,
        starShape: PalateBloomStarShape? = nil,
        coreShape: PalateBloomCoreShape? = nil
    ) {
        self.size = size
        self.bloomProfile = bloomProfile
        self.shapeSeed = shapeSeed
        self.image = image
        self.showFrame = showFrame
        self.shapeCountOverride = shapeCountOverride
        self.petalShapeOverride = petalShape
        self.starShapeOverride = starShape
        self.coreShapeOverride = coreShape
    }

    init(
        size: CGFloat = 40,
        tasteProfile: TasteProfile?,
        shapeSeed: String? = nil,
        image: UIImage? = nil,
        showFrame: Bool = true
    ) {
        if let tasteProfile {
            self.init(
                size: size,
                bloomProfile: PalateBloomProfile(profile: tasteProfile),
                shapeSeed: shapeSeed,
                image: image,
                showFrame: showFrame
            )
        } else {
            self.init(
                size: size,
                bloomProfile: .fallback(seed: shapeSeed),
                shapeSeed: shapeSeed,
                image: image,
                showFrame: showFrame
            )
        }
    }

    init(
        size: CGFloat = 40,
        seed: String? = nil,
        image: UIImage? = nil,
        showFrame: Bool = true
    ) {
        self.init(
            size: size,
            bloomProfile: .fallback(seed: seed),
            shapeSeed: seed,
            image: image,
            showFrame: showFrame
        )
    }

    var body: some View {
        ZStack {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .clipShape(Circle())
            } else {
                bloomCanvas
            }
        }
        .frame(width: size, height: size)
        .overlay {
            if showFrame {
                Circle()
                    .stroke(Color.white.opacity(0.5), lineWidth: 1)
                Circle()
                    .stroke(Color.black.opacity(0.08), lineWidth: 1)
                    .padding(1)
            }
        }
        .accessibilityHidden(true)
    }

    private var bloomCanvas: some View {
        let layout = PalateBloomLayout.make(
            profile: bloomProfile,
            shapeSeed: shapeSeed,
            shapeCountOverride: shapeCountOverride
        )
        let petalShape = petalShapeOverride ?? layout.shapeVariant.petalShape
        let starShape = starShapeOverride ?? layout.shapeVariant.starShape
        let coreShape = coreShapeOverride ?? layout.shapeVariant.coreShape

        return Canvas(opaque: false, colorMode: .nonLinear, rendersAsynchronously: false) {
            context,
            canvasSize in
            let scale = min(canvasSize.width, canvasSize.height) / 100
            context.translateBy(
                x: (canvasSize.width - 100 * scale) / 2,
                y: (canvasSize.height - 100 * scale) / 2
            )
            context.scaleBy(x: scale, y: scale)
            context.clip(to: Path(ellipseIn: CGRect(x: 1, y: 1, width: 98, height: 98)))

            context.fill(
                Path(ellipseIn: CGRect(x: 1.5, y: 1.5, width: 97, height: 97)),
                with: .color(layout.layers[0].axis.bloomColor)
            )
            drawPetals(
                in: &context,
                color: layout.layers[1].axis.bloomColor,
                count: layout.shapeCount,
                centerDistance: layout.largePetalDistance,
                radius: layout.largePetalRadius,
                rotationOffset: 180 / Double(layout.shapeCount),
                shape: petalShape
            )
            drawPetals(
                in: &context,
                color: layout.layers[2].axis.bloomColor,
                count: layout.shapeCount,
                centerDistance: layout.smallPetalDistance,
                radius: layout.smallPetalRadius,
                rotationOffset: 180 / Double(layout.shapeCount),
                shape: petalShape
            )
            drawStar(
                in: &context,
                color: layout.layers[3].axis.bloomColor,
                count: layout.shapeCount,
                outerRadius: layout.largeStarOuterRadius,
                innerRadius: layout.largeStarInnerRadius,
                rotation: 0,
                shape: starShape
            )
            drawStar(
                in: &context,
                color: layout.layers[4].axis.bloomColor,
                count: layout.shapeCount,
                outerRadius: layout.smallStarOuterRadius,
                innerRadius: layout.smallStarInnerRadius,
                rotation: 180 / Double(layout.shapeCount),
                shape: starShape
            )
            drawCore(
                in: &context,
                color: layout.layers[5].axis.bloomColor,
                radius: layout.coreRadius,
                seedCount: layout.shapeCount,
                shape: coreShape
            )
        }
    }

    private func drawPetals(
        in context: inout GraphicsContext,
        color: Color,
        count: Int,
        centerDistance: Double,
        radius: Double,
        rotationOffset: Double,
        shape: PalateBloomPetalShape
    ) {
        for index in 0..<count {
            let angle = rotationOffset + (360 / Double(count)) * Double(index)
            let radians = (angle - 90) * .pi / 180
            let center = CGPoint(
                x: 50 + cos(radians) * centerDistance,
                y: 50 + sin(radians) * centerDistance
            )
            let path: Path

            switch shape {
            case .roundPetal:
                path = Path(
                    ellipseIn: CGRect(
                        x: center.x - radius,
                        y: center.y - radius,
                        width: radius * 2,
                        height: radius * 2
                    )
                )
            case .capsulePetal:
                let width = radius * 1.36
                let height = radius * 2.2
                path = rotated(
                    Path(
                        roundedRect: CGRect(
                            x: center.x - width / 2,
                            y: center.y - height / 2,
                            width: width,
                            height: height
                        ),
                        cornerRadius: width / 2
                    ),
                    degrees: angle,
                    around: center
                )
            case .softDiamondPetal:
                let majorRadius = radius * 1.28
                let minorRadius = radius * 0.82
                var diamond = Path()
                diamond.move(to: CGPoint(x: center.x, y: center.y - majorRadius))
                diamond.addQuadCurve(
                    to: CGPoint(x: center.x + minorRadius, y: center.y),
                    control: CGPoint(
                        x: center.x + minorRadius,
                        y: center.y - majorRadius * 0.52
                    )
                )
                diamond.addQuadCurve(
                    to: CGPoint(x: center.x, y: center.y + majorRadius),
                    control: CGPoint(
                        x: center.x + minorRadius,
                        y: center.y + majorRadius * 0.52
                    )
                )
                diamond.addQuadCurve(
                    to: CGPoint(x: center.x - minorRadius, y: center.y),
                    control: CGPoint(
                        x: center.x - minorRadius,
                        y: center.y + majorRadius * 0.52
                    )
                )
                diamond.addQuadCurve(
                    to: CGPoint(x: center.x, y: center.y - majorRadius),
                    control: CGPoint(
                        x: center.x - minorRadius,
                        y: center.y - majorRadius * 0.52
                    )
                )
                diamond.closeSubpath()
                path = rotated(diamond, degrees: angle, around: center)
            case .serratedTipPetal:
                let length = radius * 2.2
                let width = radius * 1.28
                let halfWidth = width / 2
                let innerY = center.y + length / 2
                let outerY = center.y - length / 2
                let triangleHeight = (width / 2 * sqrt(3)) / 2
                let points = [
                    CGPoint(x: center.x - halfWidth, y: innerY),
                    CGPoint(x: center.x + halfWidth, y: innerY),
                    CGPoint(x: center.x + halfWidth, y: outerY),
                    CGPoint(x: center.x + halfWidth * 0.5, y: outerY + triangleHeight),
                    CGPoint(x: center.x, y: outerY),
                    CGPoint(x: center.x - halfWidth * 0.5, y: outerY + triangleHeight),
                    CGPoint(x: center.x - halfWidth, y: outerY)
                ]
                var serrated = Path()
                serrated.move(to: points[0])
                points.dropFirst().forEach { serrated.addLine(to: $0) }
                serrated.closeSubpath()
                path = rotated(serrated, degrees: angle, around: center)
            }

            context.fill(path, with: .color(color))
        }
    }

    private func drawStar(
        in context: inout GraphicsContext,
        color: Color,
        count: Int,
        outerRadius: Double,
        innerRadius: Double,
        rotation: Double,
        shape: PalateBloomStarShape
    ) {
        switch shape {
        case .thinStar:
            var star = Path()
            for index in 0..<(count * 2) {
                let radius = index.isMultiple(of: 2) ? outerRadius : innerRadius
                let radians = (rotation - 90 + Double(index) * (180 / Double(count)))
                    * .pi / 180
                let point = CGPoint(
                    x: 50 + cos(radians) * radius,
                    y: 50 + sin(radians) * radius
                )
                index == 0 ? star.move(to: point) : star.addLine(to: point)
            }
            star.closeSubpath()
            context.fill(star, with: .color(color))
        case .roundedSpokeStar:
            let spoke = roundedSpokePath(outerRadius: outerRadius)
            for index in 0..<count {
                let angle = rotation + (360 / Double(count)) * Double(index)
                context.fill(
                    rotated(spoke, degrees: angle, around: CGPoint(x: 50, y: 50)),
                    with: .color(color)
                )
            }
        case .dottedRayStar:
            let rayStartRadius = max(innerRadius * 0.75, outerRadius * 0.08)
            let dotRadius = max(0.85, outerRadius * 0.07)
            let rayEndRadius = outerRadius - dotRadius * 0.78
            let strokeWidth = max(0.55, outerRadius * 0.032)

            for index in 0..<count {
                let angle = rotation + (360 / Double(count)) * Double(index) - 90
                let radians = angle * .pi / 180
                let start = CGPoint(
                    x: 50 + cos(radians) * rayStartRadius,
                    y: 50 + sin(radians) * rayStartRadius
                )
                let end = CGPoint(
                    x: 50 + cos(radians) * rayEndRadius,
                    y: 50 + sin(radians) * rayEndRadius
                )
                let dot = CGPoint(
                    x: 50 + cos(radians) * outerRadius,
                    y: 50 + sin(radians) * outerRadius
                )
                var ray = Path()
                ray.move(to: start)
                ray.addLine(to: end)
                context.stroke(
                    ray,
                    with: .color(color),
                    style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round)
                )
                context.fill(
                    Path(
                        ellipseIn: CGRect(
                            x: dot.x - dotRadius,
                            y: dot.y - dotRadius,
                            width: dotRadius * 2,
                            height: dotRadius * 2
                        )
                    ),
                    with: .color(color)
                )
            }
        }
    }

    private func drawCore(
        in context: inout GraphicsContext,
        color: Color,
        radius: Double,
        seedCount: Int,
        shape: PalateBloomCoreShape
    ) {
        switch shape {
        case .solidCore:
            context.fill(
                Path(
                    ellipseIn: CGRect(
                        x: 50 - radius,
                        y: 50 - radius,
                        width: radius * 2,
                        height: radius * 2
                    )
                ),
                with: .color(color)
            )
        case .diamondCore:
            let side = radius * 1.55
            let square = Path(
                CGRect(
                    x: 50 - side / 2,
                    y: 50 - side / 2,
                    width: side,
                    height: side
                )
            )
            context.fill(
                rotated(square, degrees: 45, around: CGPoint(x: 50, y: 50)),
                with: .color(color)
            )
        case .seedCluster:
            let outerSeedCount = min(6, max(4, seedCount))
            let seedRadius = max(1.1, radius * 0.34)
            let seedDistance = radius * 0.78

            for index in 0..<outerSeedCount {
                let radians = ((360 / Double(outerSeedCount)) * Double(index) - 90)
                    * .pi / 180
                let center = CGPoint(
                    x: 50 + cos(radians) * seedDistance,
                    y: 50 + sin(radians) * seedDistance
                )
                context.fill(
                    Path(
                        ellipseIn: CGRect(
                            x: center.x - seedRadius,
                            y: center.y - seedRadius,
                            width: seedRadius * 2,
                            height: seedRadius * 2
                        )
                    ),
                    with: .color(color)
                )
            }
            let centerRadius = seedRadius * 1.06
            context.fill(
                Path(
                    ellipseIn: CGRect(
                        x: 50 - centerRadius,
                        y: 50 - centerRadius,
                        width: centerRadius * 2,
                        height: centerRadius * 2
                    )
                ),
                with: .color(color)
            )
        }
    }

    private func roundedSpokePath(outerRadius: Double) -> Path {
        let baseRadius = max(0.9, outerRadius * 0.05)
        let baseHalfWidth = max(0.24, outerRadius * 0.014)
        let neckHalfWidth = max(0.42, outerRadius * 0.026)
        let capHalfWidth = max(0.45, outerRadius * 0.043)
        let capShoulderRadius = outerRadius - capHalfWidth * 0.72
        var path = Path()
        path.move(to: CGPoint(x: 50 - baseHalfWidth, y: 50 - baseRadius))
        path.addCurve(
            to: CGPoint(x: 50 - capHalfWidth, y: 50 - capShoulderRadius),
            control1: CGPoint(x: 50 - neckHalfWidth, y: 50 - outerRadius * 0.38),
            control2: CGPoint(x: 50 - capHalfWidth, y: 50 - outerRadius * 0.66)
        )
        path.addQuadCurve(
            to: CGPoint(x: 50, y: 50 - outerRadius),
            control: CGPoint(x: 50 - capHalfWidth, y: 50 - outerRadius)
        )
        path.addQuadCurve(
            to: CGPoint(x: 50 + capHalfWidth, y: 50 - capShoulderRadius),
            control: CGPoint(x: 50 + capHalfWidth, y: 50 - outerRadius)
        )
        path.addCurve(
            to: CGPoint(x: 50 + baseHalfWidth, y: 50 - baseRadius),
            control1: CGPoint(x: 50 + capHalfWidth, y: 50 - outerRadius * 0.66),
            control2: CGPoint(x: 50 + neckHalfWidth, y: 50 - outerRadius * 0.38)
        )
        path.addQuadCurve(
            to: CGPoint(x: 50 - baseHalfWidth, y: 50 - baseRadius),
            control: CGPoint(x: 50, y: 50 + baseRadius * 0.28)
        )
        path.closeSubpath()
        return path
    }

    private func rotated(_ path: Path, degrees: Double, around point: CGPoint) -> Path {
        var transform = CGAffineTransform(
            translationX: point.x,
            y: point.y
        )
        transform = transform.rotated(by: degrees * .pi / 180)
        transform = transform.translatedBy(x: -point.x, y: -point.y)
        return path.applying(transform)
    }
}

private extension TasteAxis {
    var bloomColor: Color {
        switch self {
        case .sweet: Color(hex: 0xFFA826)
        case .sour: Color(hex: 0xFCC94D)
        case .bitter: Color(hex: 0xA5D126)
        case .salty: Color(hex: 0x87A8FF)
        case .umami: Color(hex: 0xBE87BF)
        case .fat: Color(hex: 0xA5988E)
        }
    }
}
