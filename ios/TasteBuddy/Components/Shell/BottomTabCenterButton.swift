import SwiftUI

struct BottomTabCenterButton: View {
    var accessibilityLabel = "디시 기록 추가"
    let action: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animationStart = Date.now
    @State private var colorSequence = TasteBeamPalette.randomSequence()
    @State private var isBeamVisible = false

    var body: some View {
        Button(action: action) {
            TimelineView(
                .animation(minimumInterval: 1 / 60, paused: reduceMotion)
            ) { timeline in
                buttonSurface(at: timeline.date)
            }
            .frame(width: Metrics.buttonSize, height: Metrics.buttonSize)
            .contentShape(Circle())
        }
        .buttonStyle(BottomTabCenterButtonStyle())
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .accessibilityLabel(accessibilityLabel)
        .onAppear {
            animationStart = .now
            colorSequence = TasteBeamPalette.randomSequence()

            if reduceMotion {
                isBeamVisible = true
            } else {
                withAnimation(.easeOut(duration: Metrics.fadeInDuration)) {
                    isBeamVisible = true
                }
            }
        }
        .onDisappear {
            isBeamVisible = false
        }
    }

    private func buttonSurface(at date: Date) -> some View {
        let animation = animationState(at: date)

        return ZStack {
            Circle()
                .fill(Color(hex: 0x1F1F1F))

            TasteBeamBlobTrack(
                phase: animation.phase,
                firstColor: animation.firstColor.filtered(
                    hueRotation: animation.hueRotation,
                    brightness: Metrics.innerBrightness,
                    saturation: Metrics.innerSaturation
                ).color,
                secondColor: animation.secondColor.filtered(
                    hueRotation: animation.hueRotation,
                    brightness: Metrics.innerBrightness,
                    saturation: Metrics.innerSaturation
                ).color
            )
            .mask {
                TasteBeamInnerMask()
            }
            .opacity(isBeamVisible ? Metrics.innerOpacity : 0)

            TasteBeamBlobTrack(
                phase: animation.phase,
                firstColor: animation.firstColor.filtered(
                    hueRotation: animation.hueRotation * Metrics.strokeHueMultiplier,
                    brightness: Metrics.strokeBrightness,
                    saturation: Metrics.strokeSaturation,
                    contrast: Metrics.strokeContrast
                ).color,
                secondColor: animation.secondColor.filtered(
                    hueRotation: animation.hueRotation * Metrics.strokeHueMultiplier,
                    brightness: Metrics.strokeBrightness,
                    saturation: Metrics.strokeSaturation,
                    contrast: Metrics.strokeContrast
                ).color
            )
            .mask {
                Circle()
                    .stroke(Color.white, lineWidth: Metrics.strokeWidth)
            }
            .opacity(isBeamVisible ? Metrics.strokeOpacity : 0)

            TasteBeamBlobTrack(
                phase: animation.phase,
                firstColor: animation.firstColor.filtered(
                    hueRotation: animation.hueRotation,
                    brightness: Metrics.bloomBrightness,
                    saturation: Metrics.bloomSaturation
                ).color,
                secondColor: animation.secondColor.filtered(
                    hueRotation: animation.hueRotation,
                    brightness: Metrics.bloomBrightness,
                    saturation: Metrics.bloomSaturation
                ).color
            )
            .mask {
                Circle()
                    .stroke(Color.white, lineWidth: Metrics.strokeWidth)
            }
            .blur(radius: Metrics.bloomBlur)
            .opacity(isBeamVisible ? Metrics.bloomOpacity : 0)

            Circle()
                .fill(
                    RadialGradient(
                        stops: [
                            .init(color: Color(hex: 0x1F1F1F, alpha: 0.96), location: 0),
                            .init(color: Color(hex: 0x1F1F1F, alpha: 0.82), location: 0.42),
                            .init(color: Color(hex: 0x1F1F1F, alpha: 0), location: 0.72),
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: Metrics.centerShieldSize / 2
                    )
                )
                .frame(width: Metrics.centerShieldSize, height: Metrics.centerShieldSize)
                .blur(radius: Metrics.centerShieldBlur)
                .allowsHitTesting(false)

            LucideIcon(
                .plus,
                size: AppChromeMetrics.iconSize,
                strokeWidth: TBIcon.Stroke.regular
            )
            .foregroundStyle(TBColor.textInverse)
        }
        .clipShape(Circle())
    }

    private func animationState(at date: Date) -> TasteBeamAnimationState {
        guard !reduceMotion else {
            let pair = TasteBeamPalette.pair(cycle: 0, sequence: colorSequence)
            return TasteBeamAnimationState(
                phase: 0,
                firstColor: pair.first,
                secondColor: pair.second,
                hueRotation: 0
            )
        }

        let elapsed = max(0, date.timeIntervalSince(animationStart))
        let cycle = Int(floor(elapsed / Metrics.motionDuration))
        let progress = (elapsed.truncatingRemainder(dividingBy: Metrics.motionDuration))
            / Metrics.motionDuration
        let easedProgress = progress * progress * (3 - 2 * progress)
        let currentPair = TasteBeamPalette.pair(cycle: cycle, sequence: colorSequence)
        let nextPair = TasteBeamPalette.pair(cycle: cycle + 1, sequence: colorSequence)
        let phase = progress * .pi * 2

        return TasteBeamAnimationState(
            phase: phase,
            firstColor: currentPair.first.mixed(with: nextPair.first, amount: easedProgress),
            secondColor: currentPair.second.mixed(with: nextPair.second, amount: easedProgress),
            hueRotation: sin(phase + .pi / 6) * 18
        )
    }
}

private enum Metrics {
    static let buttonSize: CGFloat = 44
    static let centerShieldSize: CGFloat = 34
    static let centerShieldBlur: CGFloat = 6
    static let strokeWidth: CGFloat = 1.5
    static let innerMaskDepth: CGFloat = 18
    static let innerOpacity = 0.8
    static let strokeOpacity = 1.0
    static let bloomBlur: CGFloat = 3
    static let bloomOpacity = 1.0
    static let strokeBrightness = 1.28
    static let strokeSaturation = 1.46
    static let strokeHueMultiplier = 26.0 / 18.0
    static let strokeContrast = 1.08
    static let innerBrightness = 1.0
    static let innerSaturation = 1.0
    static let bloomBrightness = 1.04
    static let bloomSaturation = 1.0
    static let motionDuration: TimeInterval = 4.6
    static let fadeInDuration: TimeInterval = 0.6
    static let travelDistance: CGFloat = 5.2
}

private struct TasteBeamAnimationState {
    let phase: Double
    let firstColor: TasteBeamColor
    let secondColor: TasteBeamColor
    let hueRotation: Double
}

private struct TasteBeamColor {
    let red: Double
    let green: Double
    let blue: Double

    var color: Color {
        Color(red: red, green: green, blue: blue)
    }

    func mixed(with other: TasteBeamColor, amount: Double) -> TasteBeamColor {
        TasteBeamColor(
            red: red + (other.red - red) * amount,
            green: green + (other.green - green) * amount,
            blue: blue + (other.blue - blue) * amount
        )
    }

    func filtered(
        hueRotation: Double,
        brightness: Double,
        saturation: Double,
        contrast: Double = 1
    ) -> TasteBeamColor {
        let radians = hueRotation * .pi / 180
        let cosine = cos(radians)
        let sine = sin(radians)
        let hueRed =
            (0.213 + cosine * 0.787 - sine * 0.213) * red
            + (0.715 - cosine * 0.715 - sine * 0.715) * green
            + (0.072 - cosine * 0.072 + sine * 0.928) * blue
        let hueGreen =
            (0.213 - cosine * 0.213 + sine * 0.143) * red
            + (0.715 + cosine * 0.285 + sine * 0.140) * green
            + (0.072 - cosine * 0.072 - sine * 0.283) * blue
        let hueBlue =
            (0.213 - cosine * 0.213 - sine * 0.787) * red
            + (0.715 - cosine * 0.715 + sine * 0.715) * green
            + (0.072 + cosine * 0.928 + sine * 0.072) * blue
        let brightRed = hueRed * brightness
        let brightGreen = hueGreen * brightness
        let brightBlue = hueBlue * brightness
        let luminance = brightRed * 0.213 + brightGreen * 0.715 + brightBlue * 0.072

        return TasteBeamColor(
            red: clamp(((luminance + (brightRed - luminance) * saturation) - 0.5) * contrast + 0.5),
            green: clamp(((luminance + (brightGreen - luminance) * saturation) - 0.5) * contrast + 0.5),
            blue: clamp(((luminance + (brightBlue - luminance) * saturation) - 0.5) * contrast + 0.5)
        )
    }

    private func clamp(_ value: Double) -> Double {
        min(max(value, 0), 1)
    }
}

private struct TasteBeamColorPair {
    let firstIndex: Int
    let secondIndex: Int
}

private enum TasteBeamPalette {
    static let colors = [
        TasteBeamColor(red: 1, green: 0.6, blue: 0),
        TasteBeamColor(red: 251 / 255, green: 192 / 255, blue: 45 / 255),
        TasteBeamColor(red: 149 / 255, green: 201 / 255, blue: 0),
        TasteBeamColor(red: 114 / 255, green: 153 / 255, blue: 1),
        TasteBeamColor(red: 179 / 255, green: 114 / 255, blue: 180 / 255),
        TasteBeamColor(red: 149 / 255, green: 134 / 255, blue: 122 / 255),
    ]

    static func randomSequence(count: Int = 512) -> [TasteBeamColorPair] {
        var sequence: [TasteBeamColorPair] = []
        var previousPair: TasteBeamColorPair?

        for _ in 0 ..< count {
            var nextPair: TasteBeamColorPair

            repeat {
                let firstIndex = Int.random(in: colors.indices)
                var secondIndex = Int.random(in: colors.indices)

                if secondIndex == firstIndex {
                    secondIndex = (secondIndex + 1) % colors.count
                }

                nextPair = TasteBeamColorPair(
                    firstIndex: firstIndex,
                    secondIndex: secondIndex
                )
            } while previousPair?.firstIndex == nextPair.firstIndex
                && previousPair?.secondIndex == nextPair.secondIndex

            sequence.append(nextPair)
            previousPair = nextPair
        }

        return sequence
    }

    static func pair(
        cycle: Int,
        sequence: [TasteBeamColorPair]
    ) -> (first: TasteBeamColor, second: TasteBeamColor) {
        let safeSequence = sequence.isEmpty ? randomSequence(count: 1) : sequence
        let pair = safeSequence[cycle % safeSequence.count]
        return (colors[pair.firstIndex], colors[pair.secondIndex])
    }
}

private struct TasteBeamBlobTrack: View {
    let phase: Double
    let firstColor: Color
    let secondColor: Color

    private let blobSpecs: [TasteBeamBlobSpec] = [
        .init(color: .first, radiusX: 42, radiusY: 24, x: 0.18, y: 0.08, motionGroup: 1, xSign: 1, ySign: 1, usesGlowHeight: true),
        .init(color: .first, radiusX: 36, radiusY: 21, x: 0.42, y: 0, motionGroup: 2, xSign: 1, ySign: 1),
        .init(color: .first, radiusX: 24, radiusY: 42, x: 0, y: 0.42, motionGroup: 3, xSign: 1, ySign: 1, usesGlowHeight: true),
        .init(color: .first, radiusX: 18, radiusY: 24, x: 0.29, y: 1, motionGroup: 2, xSign: -1, ySign: -1),
        .init(color: .second, radiusX: 108, radiusY: 19, x: 0.74, y: 0, motionGroup: 1, xSign: -1, ySign: 1),
        .init(color: .second, radiusX: 51, radiusY: 16, x: 1, y: 0.38, motionGroup: 3, xSign: -1, ySign: 1, usesGlowHeight: true),
        .init(color: .second, radiusX: 44, radiusY: 19, x: 0.78, y: 0.94, motionGroup: 1, xSign: -1, ySign: -1, usesGlowHeight: true),
        .init(color: .second, radiusX: 16, radiusY: 25, x: 0.52, y: 1, motionGroup: 2, xSign: -1, ySign: -1),
    ]

    var body: some View {
        Canvas(opaque: false, colorMode: .nonLinear, rendersAsynchronously: true) {
            context,
            size in
            let motionGroups = [
                motionGroup(offset: 0),
                motionGroup(offset: .pi * 2 / 3),
                motionGroup(offset: .pi * 4 / 3),
            ]
            let glowHeight = CGFloat(0.9 + wave(offset: .pi / 3) * 0.2)

            for spec in blobSpecs.reversed() {
                let motion = motionGroups[spec.motionGroup - 1]
                let color = spec.color == .first ? firstColor : secondColor
                let center = CGPoint(
                    x: size.width * spec.x + motion.x * spec.xSign,
                    y: size.height * spec.y + motion.y * spec.ySign
                )
                let radiusX = spec.radiusX * motion.widthScale
                let radiusY = spec.radiusY
                    * motion.heightScale
                    * (spec.usesGlowHeight ? glowHeight : 1)

                drawBlob(
                    context: context,
                    center: center,
                    radiusX: radiusX,
                    radiusY: radiusY,
                    color: color
                )
            }
        }
        .frame(width: Metrics.buttonSize, height: Metrics.buttonSize)
    }

    private func motionGroup(offset: Double) -> TasteBeamMotionGroup {
        TasteBeamMotionGroup(
            widthScale: CGFloat(0.86 + wave(offset: offset) * 0.3),
            heightScale: CGFloat(0.88 + wave(offset: offset + .pi) * 0.24),
            x: Metrics.travelDistance * CGFloat(sin(phase + offset)),
            y: Metrics.travelDistance * CGFloat(sin(phase + offset + .pi / 2))
        )
    }

    private func wave(offset: Double) -> Double {
        (1 - cos(phase + offset)) / 2
    }

    private func drawBlob(
        context: GraphicsContext,
        center: CGPoint,
        radiusX: CGFloat,
        radiusY: CGFloat,
        color: Color
    ) {
        var blobContext = context
        blobContext.translateBy(x: center.x, y: center.y)
        blobContext.scaleBy(x: radiusX, y: radiusY)
        let unitCircle = Path(ellipseIn: CGRect(x: -1, y: -1, width: 2, height: 2))
        let gradient = Gradient(stops: [
            .init(color: color, location: 0),
            .init(color: color.opacity(0), location: 0.78),
            .init(color: color.opacity(0), location: 1),
        ])

        blobContext.fill(
            unitCircle,
            with: .radialGradient(
                gradient,
                center: .zero,
                startRadius: 0,
                endRadius: 1
            )
        )
    }
}

private enum TasteBeamBlobColor: Equatable {
    case first
    case second
}

private struct TasteBeamBlobSpec {
    let color: TasteBeamBlobColor
    let radiusX: CGFloat
    let radiusY: CGFloat
    let x: CGFloat
    let y: CGFloat
    let motionGroup: Int
    let xSign: CGFloat
    let ySign: CGFloat
    var usesGlowHeight = false
}

private struct TasteBeamMotionGroup {
    let widthScale: CGFloat
    let heightScale: CGFloat
    let x: CGFloat
    let y: CGFloat
}

private struct TasteBeamInnerMask: View {
    private var stops: [Gradient.Stop] {
        let depth = Metrics.innerMaskDepth / Metrics.buttonSize
        return [
            .init(color: .white, location: 0),
            .init(color: .clear, location: depth),
            .init(color: .clear, location: 1 - depth),
            .init(color: .white, location: 1),
        ]
    }

    var body: some View {
        ZStack {
            LinearGradient(stops: stops, startPoint: .top, endPoint: .bottom)
            LinearGradient(stops: stops, startPoint: .leading, endPoint: .trailing)
        }
    }
}

private struct BottomTabCenterButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(.easeOut(duration: 0.18), value: configuration.isPressed)
    }
}

#if canImport(PreviewsMacros)
    #Preview {
        BottomTabCenterButton(action: {})
            .frame(width: 80, height: 80)
            .background(TBColor.page)
    }
#endif
