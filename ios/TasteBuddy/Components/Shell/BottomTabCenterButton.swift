import SwiftUI

struct BottomTabCenterButton: View {
    var accessibilityLabel = "디시 기록 추가"
    let action: () -> Void
    var onPressingChange: (Bool) -> Void = { _ in }

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animationStart = Date.now
    @State private var colorSequence = TasteBeamPalette.randomSequence()
    @State private var isBeamVisible = false
    @GestureState private var isPressing = false

    var body: some View {
        Button(action: action) {
            TimelineView(
                .animation(minimumInterval: 1 / 60, paused: reduceMotion)
            ) { timeline in
                buttonSurface(at: timeline.date, isPressed: isPressing)
            }
            .frame(width: Metrics.buttonSize, height: Metrics.buttonSize)
            .contentShape(Circle())
        }
        .buttonStyle(TBTokenButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .updating($isPressing) { _, state, _ in
                    state = true
                }
        )
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .accessibilityLabel(accessibilityLabel)
        .onChange(of: isPressing) { _, isPressing in
            onPressingChange(isPressing)
        }
        .onAppear {
            animationStart = .now
            colorSequence = TasteBeamPalette.randomSequence()

            if reduceMotion {
                isBeamVisible = true
            } else {
                withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                    isBeamVisible = true
                }
            }
        }
        .onDisappear {
            isBeamVisible = false
        }
    }

    private func buttonSurface(at date: Date, isPressed: Bool) -> some View {
        let animation = animationState(at: date)

        return ZStack {
            ZStack {
                legacyButtonBackground

                liquidBeamWash(animation, isPressed: isPressed)
                liquidBeamCore(animation, isPressed: isPressed)

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

                liquidPressedEdgeConcentration(animation, isPressed: isPressed)
                    .allowsHitTesting(false)

                legacyCenterShield
                    .allowsHitTesting(false)

                liquidGlassSurface(isPressed: isPressed)
                    .allowsHitTesting(false)

                liquidIconBeamShadow(animation, isPressed: isPressed)
                    .allowsHitTesting(false)

                LucideIcon(
                    .plus,
                    size: AppChromeMetrics.iconSize,
                    strokeWidth: TBIcon.Stroke.strong
                )
                .foregroundStyle(TBColor.textInverse)
            }
            .frame(width: Metrics.buttonSize, height: Metrics.buttonSize)
            .clipShape(Circle())
        }
        .frame(width: Metrics.buttonSize, height: Metrics.buttonSize)
        .animation(
            TasteBloomMotion.animation(.press, reduceMotion: reduceMotion),
            value: isPressed
        )
    }

    @ViewBuilder
    private func liquidIconBeamShadow(
        _ animation: TasteBeamAnimationState,
        isPressed: Bool
    ) -> some View {
        if #available(iOS 26.0, *) {
            let firstColor = animation.firstColor.filtered(
                hueRotation: animation.hueRotation,
                brightness: Metrics.iconBeamShadowBrightness,
                saturation: Metrics.iconBeamShadowSaturation,
                contrast: Metrics.iconBeamShadowContrast
            )
            .limitingLuminance(to: Metrics.iconBeamShadowMaxLuminance)
            .color
            let secondColor = animation.secondColor.filtered(
                hueRotation: animation.hueRotation,
                brightness: Metrics.iconBeamShadowBrightness,
                saturation: Metrics.iconBeamShadowSaturation,
                contrast: Metrics.iconBeamShadowContrast
            )
            .limitingLuminance(to: Metrics.iconBeamShadowMaxLuminance)
            .color

            LucideIcon(
                .plus,
                size: AppChromeMetrics.iconSize,
                strokeWidth: TBIcon.Stroke.emphasis
            )
            .foregroundStyle(
                AngularGradient(
                    stops: [
                        .init(color: firstColor.opacity(0.46), location: 0.0),
                        .init(color: secondColor.opacity(0.38), location: 0.46),
                        .init(color: firstColor.opacity(0.46), location: 1.0),
                    ],
                    center: .center,
                    angle: .radians(animation.phase + .pi / 3)
                )
            )
            .scaleEffect(Metrics.iconBeamShadowScale)
            .offset(y: Metrics.iconBeamShadowYOffset)
            .blur(radius: Metrics.iconBeamShadowBlur)
            .opacity(
                isBeamVisible
                    ? Metrics.iconBeamShadowOpacity
                        * (isPressed ? Metrics.pressedIconShadowOpacityMultiplier : 1)
                    : 0
            )
        } else {
            EmptyView()
        }
    }

    @ViewBuilder
    private func liquidBeamWash(
        _ animation: TasteBeamAnimationState,
        isPressed: Bool
    ) -> some View {
        if #available(iOS 26.0, *) {
            let firstColor = animation.firstColor.filtered(
                hueRotation: animation.hueRotation,
                brightness: Metrics.liquidWashBrightness,
                saturation: Metrics.liquidWashSaturation,
                contrast: Metrics.liquidWashContrast
            )
            .limitingLuminance(to: Metrics.liquidWashMaxLuminance)
            .lifted(amount: Metrics.liquidWashLift)
            .color
            let secondColor = animation.secondColor.filtered(
                hueRotation: animation.hueRotation,
                brightness: Metrics.liquidWashBrightness,
                saturation: Metrics.liquidWashSaturation,
                contrast: Metrics.liquidWashContrast
            )
            .limitingLuminance(to: Metrics.liquidWashMaxLuminance)
            .lifted(amount: Metrics.liquidWashLift)
            .color

            Circle()
                .fill(
                    AngularGradient(
                        stops: [
                            .init(color: firstColor.opacity(0.95), location: 0.0),
                            .init(color: firstColor.opacity(0.18), location: 0.21),
                            .init(color: secondColor.opacity(0.92), location: 0.44),
                            .init(color: secondColor.opacity(0.24), location: 0.62),
                            .init(color: firstColor.opacity(0.88), location: 0.78),
                            .init(color: firstColor.opacity(0.95), location: 1.0),
                        ],
                        center: .center,
                        angle: .radians(animation.phase)
                    )
                )
                .opacity(
                    isBeamVisible
                        ? Metrics.liquidWashOpacity
                            * (isPressed ? Metrics.pressedWashOpacityMultiplier : 1)
                        : 0
                )
        } else {
            EmptyView()
        }
    }

    @ViewBuilder
    private func liquidBeamCore(
        _ animation: TasteBeamAnimationState,
        isPressed: Bool
    ) -> some View {
        if #available(iOS 26.0, *) {
            TasteBeamBlobTrack(
                phase: animation.phase,
                firstColor: animation.firstColor.filtered(
                    hueRotation: animation.hueRotation,
                    brightness: Metrics.liquidCoreBrightness,
                    saturation: Metrics.liquidCoreSaturation,
                    contrast: Metrics.liquidCoreContrast
                )
                .lifted(amount: Metrics.liquidCoreLift)
                .limitingLuminance(to: Metrics.liquidCoreMaxLuminance)
                .color,
                secondColor: animation.secondColor.filtered(
                    hueRotation: animation.hueRotation,
                    brightness: Metrics.liquidCoreBrightness,
                    saturation: Metrics.liquidCoreSaturation,
                    contrast: Metrics.liquidCoreContrast
                )
                .lifted(amount: Metrics.liquidCoreLift)
                .limitingLuminance(to: Metrics.liquidCoreMaxLuminance)
                .color
            )
            .scaleEffect(
                Metrics.liquidCoreScale
                    * (isPressed ? Metrics.pressedCoreScaleMultiplier : 1)
            )
            .blur(radius: Metrics.liquidCoreBlur)
            .opacity(
                isBeamVisible
                    ? Metrics.liquidCoreOpacity
                        * (isPressed ? Metrics.pressedCoreOpacityMultiplier : 1)
                    : 0
            )
        } else {
            EmptyView()
        }
    }

    @ViewBuilder
    private func liquidPressedEdgeConcentration(
        _ animation: TasteBeamAnimationState,
        isPressed: Bool
    ) -> some View {
        if #available(iOS 26.0, *) {
            let firstColor = animation.firstColor.filtered(
                hueRotation: animation.hueRotation,
                brightness: Metrics.pressedEdgeBrightness,
                saturation: Metrics.pressedEdgeSaturation,
                contrast: Metrics.pressedEdgeContrast
            )
            .limitingLuminance(to: Metrics.pressedEdgeMaxLuminance)
            .lifted(amount: Metrics.pressedEdgeLift)
            .color
            let secondColor = animation.secondColor.filtered(
                hueRotation: animation.hueRotation,
                brightness: Metrics.pressedEdgeBrightness,
                saturation: Metrics.pressedEdgeSaturation,
                contrast: Metrics.pressedEdgeContrast
            )
            .limitingLuminance(to: Metrics.pressedEdgeMaxLuminance)
            .lifted(amount: Metrics.pressedEdgeLift)
            .color

            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            stops: [
                                .init(color: Color.white.opacity(0), location: 0.0),
                                .init(color: firstColor.opacity(0.04), location: 0.48),
                                .init(color: secondColor.opacity(0.30), location: 0.70),
                                .init(color: firstColor.opacity(0.72), location: 0.91),
                                .init(color: secondColor.opacity(0.54), location: 1.0),
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: Metrics.buttonSize / 2
                        )
                    )

                Circle()
                    .strokeBorder(
                        AngularGradient(
                            stops: [
                                .init(color: firstColor.opacity(0.98), location: 0.0),
                                .init(color: secondColor.opacity(0.68), location: 0.28),
                                .init(color: firstColor.opacity(0.20), location: 0.48),
                                .init(color: secondColor.opacity(0.86), location: 0.72),
                                .init(color: firstColor.opacity(0.98), location: 1.0),
                            ],
                            center: .center,
                            angle: .radians(animation.phase * 1.22)
                        ),
                        lineWidth: Metrics.pressedEdgeBandWidth
                    )

                Circle()
                    .strokeBorder(
                        AngularGradient(
                            stops: [
                                .init(color: secondColor.opacity(0.84), location: 0.0),
                                .init(color: firstColor.opacity(0.24), location: 0.36),
                                .init(color: secondColor.opacity(0.74), location: 0.64),
                                .init(color: firstColor.opacity(0.84), location: 1.0),
                            ],
                            center: .center,
                            angle: .radians(-animation.phase * 0.84 + .pi / 5)
                        ),
                        lineWidth: Metrics.pressedEdgeFineBandWidth
                    )
                    .padding(Metrics.pressedEdgeFineInset)
            }
            .opacity(isBeamVisible && isPressed ? Metrics.pressedEdgeOpacity : 0)
            .blendMode(.plusLighter)
            .compositingGroup()
        } else {
            EmptyView()
        }
    }

    @ViewBuilder
    private var legacyButtonBackground: some View {
        if #available(iOS 26.0, *) {
            EmptyView()
        } else {
            Circle()
                .fill(Color(hex: 0x1F1F1F))
        }
    }

    @ViewBuilder
    private var legacyCenterShield: some View {
        if #available(iOS 26.0, *) {
            EmptyView()
        } else {
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
        }
    }

    @ViewBuilder
    private func liquidGlassSurface(isPressed: Bool) -> some View {
        if #available(iOS 26.0, *) {
            ZStack {
                Circle()
                    .fill(.clear)
                    .glassEffect(.regular.interactive(), in: Circle())
                    .opacity(
                        Metrics.glassCenterEffectOpacity
                            * (isPressed ? Metrics.pressedGlassCenterOpacityMultiplier : 1)
                    )

                Circle()
                    .strokeBorder(Color.white.opacity(0.001), lineWidth: Metrics.glassEdgeEffectWidth)
                    .glassEffect(.regular.interactive(), in: Circle())
                    .opacity(
                        Metrics.glassEdgeEffectOpacity
                            * (isPressed ? Metrics.pressedGlassEdgeOpacityMultiplier : 1)
                    )

	                Circle()
	                    .strokeBorder(
		                        AngularGradient(
		                            stops: [
		                                .init(color: Color.white.opacity(0.84), location: 0.0),
		                                .init(color: Color.white.opacity(0.18), location: 0.18),
		                                .init(color: Color.black.opacity(0.10), location: 0.33),
		                                .init(color: Color.white.opacity(0.28), location: 0.49),
		                                .init(color: Color.white.opacity(0.56), location: 0.72),
		                                .init(color: Color.white.opacity(0.84), location: 1.0),
		                            ],
                            center: .center,
                            angle: .degrees(-28)
                        ),
                        lineWidth: Metrics.glassRimWidth
	                    )
	                    .opacity(Metrics.glassRimOpacity)

	                Circle()
	                    .strokeBorder(Color.white.opacity(Metrics.glassCausticOpacity), lineWidth: 1)
	                    .blur(radius: Metrics.glassCausticBlur)
                    .padding(Metrics.glassCausticInset)
            }
        } else {
            EmptyView()
        }
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
            hueRotation: sin(phase + .pi / 6) * Metrics.hueRotationAmplitude
        )
    }
}

private enum Metrics {
    static let buttonSize: CGFloat = 48
    static let centerShieldSize: CGFloat = 37
    static let centerShieldBlur: CGFloat = 6.5
    static let strokeWidth: CGFloat = 1.65
    static let innerMaskDepth: CGFloat = 20
    static let innerOpacity = 0.8
    static let strokeOpacity = 1.0
    static let bloomBlur: CGFloat = 3.25
    static let bloomOpacity = 1.0
    static let iconBeamShadowBrightness = 0.9
    static let iconBeamShadowSaturation = 1.74
    static let iconBeamShadowContrast = 1.18
    static let iconBeamShadowMaxLuminance = 0.46
    static let iconBeamShadowOpacity = 0.30
    static let iconBeamShadowBlur: CGFloat = 3.4
    static let iconBeamShadowScale = 1.42
    static let iconBeamShadowYOffset: CGFloat = 1.2
    static let pressedIconShadowOpacityMultiplier = 1.18
    static let pressedWashOpacityMultiplier = 0.46
    static let pressedCoreOpacityMultiplier = 0.36
    static let pressedCoreScaleMultiplier = 0.94
    static let pressedEdgeBrightness = 1.16
    static let pressedEdgeSaturation = 1.82
    static let pressedEdgeContrast = 1.10
    static let pressedEdgeMaxLuminance = 0.70
    static let pressedEdgeLift = 0.03
    static let pressedEdgeOpacity = 0.96
    static let pressedEdgeBandWidth: CGFloat = 8.5
    static let pressedEdgeFineBandWidth: CGFloat = 4.5
    static let pressedEdgeFineInset: CGFloat = 4
    static let pressedSpillBrightness = 1.12
    static let pressedSpillSaturation = 1.72
    static let pressedSpillContrast = 1.06
    static let pressedSpillMaxLuminance = 0.72
    static let pressedSpillLift = 0.04
    static let pressedSpillOpacity = 0.86
    static let pressedSpillSoftOpacity = 0.28
    static let pressedSpillFineOpacity = 0.18
    static let pressedSpillFrameSize: CGFloat = 224
    static let pressedSpillFineFrameSize: CGFloat = 196
    static let pressedSpillScale = 1.04
    static let pressedSpillIdleScale = 0.76
    static let pressedSpillYOffset: CGFloat = 4
    static let pressedSpillOriginYRatio: CGFloat = 0.5
    static let pressedPulseOpacity = 1.0
    static let pressedPulseFrameSize: CGFloat = 228
    static let pressedPulseRingDiameter: CGFloat = 42
    static let pressedPulsePrimaryArcDiameter: CGFloat = 43
    static let pressedPulseSecondaryArcDiameter: CGFloat = 38
    static let pressedPulseInnerDiameter: CGFloat = 36
    static let pressedPulseOuterDiameter: CGFloat = 62
    static let pressedPulseAuraDiameter: CGFloat = 136
    static let pressedPulseOuterAuraDiameter: CGFloat = 174
    static let pressedPulseRingWidth: CGFloat = 6.8
    static let pressedPulseInnerWidth: CGFloat = 8
    static let pressedPulseOuterWidth: CGFloat = 12
    static let pressedGlassCenterOpacityMultiplier = 0.72
    static let pressedGlassEdgeOpacityMultiplier = 1.18
    static let strokeBrightness = 1.28
    static let strokeSaturation = 1.46
    static let strokeHueMultiplier = 26.0 / 18.0
    static let strokeContrast = 1.08
    static let innerBrightness = 1.0
    static let innerSaturation = 1.0
    static let bloomBrightness = 1.04
    static let bloomSaturation = 1.0
    static let liquidWashBrightness = 1.04
    static let liquidWashSaturation = 1.46
    static let liquidWashContrast = 1.10
    static let liquidWashLift = 0.0
    static let liquidWashMaxLuminance = 0.58
    static let liquidWashOpacity = 0.82
    static let liquidCoreBrightness = 1.10
    static let liquidCoreSaturation = 1.58
    static let liquidCoreContrast = 1.12
    static let liquidCoreLift = 0.0
    static let liquidCoreMaxLuminance = 0.62
    static let liquidCoreOpacity = 1.0
    static let liquidCoreBlur: CGFloat = 0.15
    static let liquidCoreScale = 1.06
    static let glassCenterEffectOpacity = 0.24
    static let glassEdgeEffectOpacity = 0.78
    static let glassEdgeEffectWidth: CGFloat = 10
    static let glassRimOpacity = 0.82
    static let glassRimWidth: CGFloat = 1.25
    static let glassCausticOpacity = 0.32
    static let glassCausticBlur: CGFloat = 0.8
    static let glassCausticInset: CGFloat = 1.5
    static let motionDuration: TimeInterval = 3.6
    static let hueRotationAmplitude = 12.0
    static let travelDistance: CGFloat = 5.7
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

    func lifted(amount: Double) -> TasteBeamColor {
        TasteBeamColor(
            red: clamp(red + (1 - red) * amount),
            green: clamp(green + (1 - green) * amount),
            blue: clamp(blue + (1 - blue) * amount)
        )
    }

    func limitingLuminance(to maxLuminance: Double) -> TasteBeamColor {
        let luminance = red * 0.213 + green * 0.715 + blue * 0.072
        guard luminance > maxLuminance, luminance > 0 else {
            return self
        }

        let scale = maxLuminance / luminance
        return TasteBeamColor(
            red: clamp(red * scale),
            green: clamp(green * scale),
            blue: clamp(blue * scale)
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

struct BottomTabCenterButtonPressBeamOverlay: View {
    let origin: CGPoint

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animationStart = Date.now
    @State private var colorSequence = TasteBeamPalette.randomSequence()

    var body: some View {
        TimelineView(
            .animation(minimumInterval: 1 / 60, paused: reduceMotion)
        ) { timeline in
            let animation = animationState(at: timeline.date)
            let firstColor = animation.firstColor.filtered(
                hueRotation: animation.hueRotation,
                brightness: Metrics.pressedSpillBrightness,
                saturation: Metrics.pressedSpillSaturation,
                contrast: Metrics.pressedSpillContrast
            )
            .limitingLuminance(to: Metrics.pressedSpillMaxLuminance)
            .lifted(amount: Metrics.pressedSpillLift)
            .color
            let secondColor = animation.secondColor.filtered(
                hueRotation: animation.hueRotation,
                brightness: Metrics.pressedSpillBrightness,
                saturation: Metrics.pressedSpillSaturation,
                contrast: Metrics.pressedSpillContrast
            )
            .limitingLuminance(to: Metrics.pressedSpillMaxLuminance)
            .lifted(amount: Metrics.pressedSpillLift)
            .color

            ZStack {
                TasteBeamPressedSpill(
                    phase: animation.phase,
                    firstColor: firstColor,
                    secondColor: secondColor,
                    opacityScale: 1
                )
                .frame(
                    width: Metrics.pressedSpillFrameSize,
                    height: Metrics.pressedSpillFrameSize
                )
                .opacity(Metrics.pressedSpillSoftOpacity)

                TasteBeamPressedSpill(
                    phase: -animation.phase * 0.76 + .pi / 5,
                    firstColor: secondColor,
                    secondColor: firstColor,
                    opacityScale: 0.72
                )
                .frame(
                    width: Metrics.pressedSpillFineFrameSize,
                    height: Metrics.pressedSpillFineFrameSize
                )
                .opacity(Metrics.pressedSpillFineOpacity)

                TasteBeamPressedBorderPulse(
                    phase: animation.phase,
                    firstColor: firstColor,
                    secondColor: secondColor,
                    opacityScale: 1
                )
                .frame(
                    width: Metrics.pressedPulseFrameSize,
                    height: Metrics.pressedPulseFrameSize
                )
                .opacity(Metrics.pressedPulseOpacity)
            }
            .frame(
                width: Metrics.pressedPulseFrameSize,
                height: Metrics.pressedPulseFrameSize
            )
            .scaleEffect(Metrics.pressedSpillScale)
            .offset(y: Metrics.pressedSpillYOffset)
            .position(origin)
            .opacity(Metrics.pressedSpillOpacity)
            .blendMode(.plusLighter)
            .compositingGroup()
        }
        .onAppear {
            animationStart = .now
            colorSequence = TasteBeamPalette.randomSequence()
        }
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
            hueRotation: sin(phase + .pi / 6) * Metrics.hueRotationAmplitude
        )
    }
}

private struct TasteBeamPressedBorderPulse: View {
    let phase: Double
    let firstColor: Color
    let secondColor: Color
    let opacityScale: Double

    var body: some View {
        ZStack {
            outerAura
            ringGlow
            edgePulse
            movingPulseArc(
                start: normalizedProgress(phase / (.pi * 2)),
                length: 0.24,
                color: firstColor,
                lineWidth: Metrics.pressedPulseRingWidth,
                opacity: 0.82,
                diameter: Metrics.pressedPulsePrimaryArcDiameter
            )
            movingPulseArc(
                start: normalizedProgress(phase / (.pi * 2) + 0.48),
                length: 0.18,
                color: secondColor,
                lineWidth: Metrics.pressedPulseRingWidth * 0.84,
                opacity: 0.68,
                diameter: Metrics.pressedPulseSecondaryArcDiameter
            )
        }
        .rotationEffect(.radians(phase * 0.08))
        .compositingGroup()
    }

    private var outerAura: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        stops: [
                            .init(color: firstColor.opacity(0), location: 0),
                            .init(color: firstColor.opacity(0.34 * opacityScale), location: 0.22),
                            .init(color: secondColor.opacity(0.26 * opacityScale), location: 0.44),
                            .init(color: firstColor.opacity(0.12 * opacityScale), location: 0.72),
                            .init(color: firstColor.opacity(0), location: 1),
                        ],
                        center: .center,
                        startRadius: Metrics.buttonSize / 2,
                        endRadius: Metrics.pressedPulseAuraDiameter / 2
                    )
                )
                .frame(
                    width: Metrics.pressedPulseAuraDiameter,
                    height: Metrics.pressedPulseAuraDiameter
                )

            Circle()
                .stroke(
                    AngularGradient(
                        stops: pulseStops(
                            strongOpacity: 0.34,
                            softOpacity: 0.06
                        ),
                        center: .center,
                        angle: .radians(phase)
                    ),
                    style: StrokeStyle(
                        lineWidth: Metrics.pressedPulseOuterWidth,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )
                .frame(
                    width: Metrics.pressedPulseOuterAuraDiameter,
                    height: Metrics.pressedPulseOuterAuraDiameter
                )
                .opacity(0.58)
        }
    }

    private var ringGlow: some View {
        ZStack {
            Circle()
                .stroke(
                    AngularGradient(
                        stops: pulseStops(
                            strongOpacity: 0.88,
                            softOpacity: 0.14
                        ),
                        center: .center,
                        angle: .radians(phase * 1.15)
                    ),
                    style: StrokeStyle(
                        lineWidth: Metrics.pressedPulseOuterWidth,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )
                .frame(
                    width: Metrics.pressedPulseOuterDiameter,
                    height: Metrics.pressedPulseOuterDiameter
                )
                .opacity(0.56)

            Circle()
                .stroke(
                    AngularGradient(
                        stops: pulseStops(
                            strongOpacity: 0.92,
                            softOpacity: 0.16
                        ),
                        center: .center,
                        angle: .radians(-phase * 0.72 + .pi / 3)
                    ),
                    style: StrokeStyle(
                        lineWidth: Metrics.pressedPulseRingWidth,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )
                .frame(
                    width: Metrics.pressedPulseRingDiameter,
                    height: Metrics.pressedPulseRingDiameter
                )
                .opacity(0.9)
        }
    }

    private var edgePulse: some View {
        Circle()
            .stroke(
                AngularGradient(
                    stops: pulseStops(
                        strongOpacity: 0.82,
                        softOpacity: 0.08
                    ),
                    center: .center,
                    angle: .radians(phase * 1.42 + .pi / 7)
                ),
                style: StrokeStyle(
                    lineWidth: Metrics.pressedPulseInnerWidth,
                    lineCap: .round,
                    lineJoin: .round
                )
            )
            .frame(
                width: Metrics.pressedPulseInnerDiameter,
                height: Metrics.pressedPulseInnerDiameter
            )
            .opacity(0.82)
    }

    @ViewBuilder
    private func movingPulseArc(
        start: Double,
        length: Double,
        color: Color,
        lineWidth: CGFloat,
        opacity: Double,
        diameter: CGFloat
    ) -> some View {
        let end = start + length

        if end <= 1 {
            arcStroke(
                from: start,
                to: end,
                color: color,
                lineWidth: lineWidth,
                opacity: opacity,
                diameter: diameter
            )
        } else {
            arcStroke(
                from: start,
                to: 1,
                color: color,
                lineWidth: lineWidth,
                opacity: opacity,
                diameter: diameter
            )
            arcStroke(
                from: 0,
                to: end - 1,
                color: color,
                lineWidth: lineWidth,
                opacity: opacity,
                diameter: diameter
            )
        }
    }

    private func arcStroke(
        from start: Double,
        to end: Double,
        color: Color,
        lineWidth: CGFloat,
        opacity: Double,
        diameter: CGFloat
    ) -> some View {
        Circle()
            .trim(from: start, to: end)
            .stroke(
                color.opacity(opacity * opacityScale),
                style: StrokeStyle(
                    lineWidth: lineWidth,
                    lineCap: .round,
                    lineJoin: .round
                )
            )
            .frame(width: diameter, height: diameter)
            .rotationEffect(.degrees(-90))
    }

    private func pulseStops(
        strongOpacity: Double,
        softOpacity: Double
    ) -> [Gradient.Stop] {
        [
            .init(color: firstColor.opacity(strongOpacity * opacityScale), location: 0),
            .init(color: firstColor.opacity(softOpacity * opacityScale), location: 0.16),
            .init(color: secondColor.opacity((strongOpacity * 0.88) * opacityScale), location: 0.32),
            .init(color: secondColor.opacity(softOpacity * opacityScale), location: 0.52),
            .init(color: firstColor.opacity((strongOpacity * 0.76) * opacityScale), location: 0.70),
            .init(color: secondColor.opacity((softOpacity * 1.3) * opacityScale), location: 0.86),
            .init(color: firstColor.opacity(strongOpacity * opacityScale), location: 1),
        ]
    }

    private func normalizedProgress(_ progress: Double) -> Double {
        let normalized = progress.truncatingRemainder(dividingBy: 1)
        return normalized >= 0 ? normalized : normalized + 1
    }
}

private struct TasteBeamPressedSpill: View {
    let phase: Double
    let firstColor: Color
    let secondColor: Color
    let opacityScale: Double

    private let plumeSpecs: [TasteBeamSpillPlumeSpec] = [
        .init(color: .first, angle: -.pi, distance: 12, travel: 28, radiusX: 34, radiusY: 30, opacity: 0.44, speed: 1.12, offset: 0.2, lift: 15, lineWidth: 2.6),
        .init(color: .second, angle: -2.52, distance: 16, travel: 32, radiusX: 40, radiusY: 33, opacity: 0.46, speed: 1.44, offset: 0.9, lift: 18, lineWidth: 2.3),
        .init(color: .first, angle: -1.92, distance: 18, travel: 34, radiusX: 36, radiusY: 38, opacity: 0.48, speed: 1.26, offset: 1.6, lift: 22, lineWidth: 2.5),
        .init(color: .second, angle: -1.34, distance: 17, travel: 36, radiusX: 42, radiusY: 35, opacity: 0.46, speed: 1.58, offset: 2.4, lift: 21, lineWidth: 2.2),
        .init(color: .first, angle: -0.66, distance: 14, travel: 30, radiusX: 36, radiusY: 32, opacity: 0.44, speed: 1.20, offset: 3.0, lift: 17, lineWidth: 2.4),
        .init(color: .second, angle: 0.0, distance: 12, travel: 28, radiusX: 34, radiusY: 30, opacity: 0.42, speed: 1.36, offset: 3.7, lift: 15, lineWidth: 2.4),
        .init(color: .first, angle: 0.66, distance: 14, travel: 31, radiusX: 37, radiusY: 33, opacity: 0.44, speed: 1.18, offset: 4.4, lift: 17, lineWidth: 2.3),
        .init(color: .second, angle: 1.30, distance: 16, travel: 35, radiusX: 42, radiusY: 35, opacity: 0.46, speed: 1.54, offset: 5.1, lift: 21, lineWidth: 2.2),
        .init(color: .first, angle: 1.92, distance: 18, travel: 34, radiusX: 36, radiusY: 38, opacity: 0.48, speed: 1.30, offset: 5.8, lift: 22, lineWidth: 2.5),
        .init(color: .second, angle: 2.52, distance: 15, travel: 31, radiusX: 39, radiusY: 33, opacity: 0.44, speed: 1.46, offset: 6.5, lift: 18, lineWidth: 2.3),
    ]

    var body: some View {
        Canvas(opaque: false, colorMode: .nonLinear, rendersAsynchronously: true) { context, size in
            let origin = CGPoint(
                x: size.width * 0.5,
                y: size.height * Metrics.pressedSpillOriginYRatio
            )
            let buttonRadius = Metrics.buttonSize / 2

            drawSourceBloom(
                context: context,
                origin: origin,
                buttonRadius: buttonRadius
            )
            drawCohesiveWash(
                context: context,
                origin: origin,
                buttonRadius: buttonRadius
            )

            for spec in plumeSpecs {
                drawPlume(
                    context: context,
                    origin: origin,
                    buttonRadius: buttonRadius,
                    spec: spec
                )
            }

            for spec in plumeSpecs {
                drawWisp(
                    context: context,
                    origin: origin,
                    buttonRadius: buttonRadius,
                    spec: spec
                )
            }
        }
    }

    private func drawPlume(
        context: GraphicsContext,
        origin: CGPoint,
        buttonRadius: CGFloat,
        spec: TasteBeamSpillPlumeSpec
    ) {
        let drift = wave(speed: spec.speed, offset: spec.offset)
        let counterDrift = wave(speed: spec.speed * 0.64, offset: spec.offset + .pi / 2)
        let direction = CGPoint(
            x: CGFloat(cos(spec.angle)),
            y: CGFloat(sin(spec.angle))
        )
        let perpendicular = CGPoint(x: -direction.y, y: direction.x)
        let distance = buttonRadius
            + spec.distance
            + (spec.travel + spec.lift) * CGFloat(drift)
        let color = spec.color == .first ? firstColor : secondColor
        let center = CGPoint(
            x: origin.x
                + direction.x * distance
                + perpendicular.x * CGFloat(counterDrift - 0.5) * 13,
            y: origin.y
                + direction.y * distance
                + perpendicular.y * CGFloat(counterDrift - 0.5) * 13
        )
        let radiusX = spec.radiusX * CGFloat(0.94 + counterDrift * 0.24)
        let radiusY = spec.radiusY * CGFloat(1.02 + drift * 0.36)

        drawBlob(
            context: context,
            center: center,
            radiusX: radiusX,
            radiusY: radiusY,
            color: color,
            opacity: spec.opacity * opacityScale
        )
    }

    private func drawWisp(
        context: GraphicsContext,
        origin: CGPoint,
        buttonRadius: CGFloat,
        spec: TasteBeamSpillPlumeSpec
    ) {
        let drift = wave(speed: spec.speed * 1.18, offset: spec.offset + .pi / 5)
        let direction = CGPoint(
            x: CGFloat(cos(spec.angle)),
            y: CGFloat(sin(spec.angle))
        )
        let perpendicular = CGPoint(x: -direction.y, y: direction.x)
        let startDistance = buttonRadius + 1
        let endDistance = buttonRadius + spec.distance + spec.travel + spec.lift + 24
        let start = CGPoint(
            x: origin.x + direction.x * startDistance,
            y: origin.y + direction.y * startDistance
        )
        let end = CGPoint(
            x: origin.x
                + direction.x * endDistance
                + perpendicular.x * CGFloat(drift - 0.5) * 20,
            y: origin.y
                + direction.y * endDistance
                + perpendicular.y * CGFloat(drift - 0.5) * 20
        )
        let controlA = CGPoint(
            x: origin.x
                + direction.x * (buttonRadius + spec.distance * 0.55)
                + perpendicular.x * CGFloat(drift - 0.5) * 18,
            y: origin.y
                + direction.y * (buttonRadius + spec.distance * 0.55)
                + perpendicular.y * CGFloat(drift - 0.5) * 18
        )
        let controlB = CGPoint(
            x: origin.x
                + direction.x * (endDistance - 8)
                - perpendicular.x * CGFloat(drift - 0.5) * 12,
            y: origin.y
                + direction.y * (endDistance - 8)
                - perpendicular.y * CGFloat(drift - 0.5) * 12
        )
        let color = spec.color == .first ? firstColor : secondColor
        var path = Path()
        path.move(to: start)
        path.addCurve(to: end, control1: controlA, control2: controlB)

        let wispContext = context
        wispContext.stroke(
            path,
            with: .color(color.opacity((0.20 + drift * 0.16) * opacityScale)),
            style: StrokeStyle(
                lineWidth: spec.lineWidth * CGFloat(0.76 + drift * 0.34),
                lineCap: .round,
                lineJoin: .round
            )
        )
    }

    private func drawSourceBloom(
        context: GraphicsContext,
        origin: CGPoint,
        buttonRadius: CGFloat
    ) {
        let pulse = wave(speed: 1.42, offset: .pi / 7)
        let radius = buttonRadius + 36 + CGFloat(pulse) * 7
        let rect = CGRect(
            x: origin.x - radius,
            y: origin.y - radius,
            width: radius * 2,
            height: radius * 2
        )

        let bloomContext = context
        bloomContext.fill(
            Path(ellipseIn: rect),
            with: .radialGradient(
                Gradient(stops: [
                    .init(color: firstColor.opacity(0), location: 0),
                    .init(color: firstColor.opacity(0.72 * opacityScale), location: 0.36),
                    .init(color: secondColor.opacity(0.60 * opacityScale), location: 0.50),
                    .init(color: firstColor.opacity(0.24 * opacityScale), location: 0.72),
                    .init(color: firstColor.opacity(0), location: 1),
                ]),
                center: origin,
                startRadius: 0,
                endRadius: radius
            )
        )
    }

    private func drawCohesiveWash(
        context: GraphicsContext,
        origin: CGPoint,
        buttonRadius: CGFloat
    ) {
        let pulse = wave(speed: 0.86, offset: .pi / 4)
        let radiusX = buttonRadius + 82 + CGFloat(pulse) * 16
        let radiusY = buttonRadius + 64 + CGFloat(1 - pulse) * 13

        var washContext = context
        washContext.translateBy(x: origin.x, y: origin.y + 2)
        washContext.scaleBy(x: radiusX, y: radiusY)
        washContext.fill(
            Path(ellipseIn: CGRect(x: -1, y: -1, width: 2, height: 2)),
            with: .radialGradient(
                Gradient(stops: [
                    .init(color: firstColor.opacity(0.38 * opacityScale), location: 0),
                    .init(color: secondColor.opacity(0.30 * opacityScale), location: 0.46),
                    .init(color: firstColor.opacity(0.16 * opacityScale), location: 0.72),
                    .init(color: firstColor.opacity(0), location: 1),
                ]),
                center: .zero,
                startRadius: 0,
                endRadius: 1
            )
        )
    }

    private func drawBlob(
        context: GraphicsContext,
        center: CGPoint,
        radiusX: CGFloat,
        radiusY: CGFloat,
        color: Color,
        opacity: Double
    ) {
        var blobContext = context
        blobContext.translateBy(x: center.x, y: center.y)
        blobContext.scaleBy(x: radiusX, y: radiusY)

        blobContext.fill(
            Path(ellipseIn: CGRect(x: -1, y: -1, width: 2, height: 2)),
            with: .radialGradient(
                Gradient(stops: [
                    .init(color: color.opacity(opacity), location: 0),
                    .init(color: color.opacity(opacity * 0.38), location: 0.46),
                    .init(color: color.opacity(0), location: 1),
                ]),
                center: .zero,
                startRadius: 0,
                endRadius: 1
            )
        )
    }

    private func wave(speed: Double, offset: Double) -> Double {
        (1 - cos(phase * speed + offset)) / 2
    }
}

private enum TasteBeamBlobColor: Equatable {
    case first
    case second
}

private struct TasteBeamSpillPlumeSpec {
    let color: TasteBeamBlobColor
    let angle: Double
    let distance: CGFloat
    let travel: CGFloat
    let radiusX: CGFloat
    let radiusY: CGFloat
    let opacity: Double
    let speed: Double
    let offset: Double
    let lift: CGFloat
    let lineWidth: CGFloat
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

#if canImport(PreviewsMacros)
    #Preview {
        BottomTabCenterButton(action: {})
            .frame(width: 80, height: 80)
            .background(TBColor.page)
    }
#endif
