import PhotosUI
import SwiftUI
import UIKit

private enum ActiveStagedSheet: Identifiable {
    case app(AppSheet)
    case bookmark(RestaurantSummary)
    case dishOptions(DiningDishFeedbackItem)
    case infoSuggestion(restaurantName: String, infoRows: [RestaurantInfoRowModel])
    case menuSuggestion(restaurantName: String)

    var id: String {
        switch self {
        case .app(let sheet):
            sheet.id
        case .bookmark(let restaurant):
            "bookmark-\(restaurant.id)"
        case .dishOptions(let item):
            "dish-options-\(item.id)"
        case .infoSuggestion(let restaurantName, _):
            "info-suggestion-\(restaurantName)"
        case .menuSuggestion(let restaurantName):
            "menu-suggestion-\(restaurantName)"
        }
    }
}

struct DiningFeedbackTasteBloomTransitionOverlay: View {
    var launchOrigin: CGPoint? = nil

    var body: some View {
        TasteBloomTransition(origin: launchOrigin)
    }
}

struct TasteBloomTransition: View {
    var origin: CGPoint? = nil

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var startedAt = Date()

    var body: some View {
        GeometryReader { proxy in
            TimelineView(.animation(minimumInterval: 1.0 / 60.0, paused: reduceMotion)) { timeline in
                let elapsed = reduceMotion
                    ? TasteBloomTransitionMetrics.duration
                    : timeline.date.timeIntervalSince(startedAt)
                let progress = TasteBloomTransitionMetrics.normalizedProgress(elapsed)
                let expansionProgress = TasteBloomTransitionMetrics.expansionProgress(progress)
                let animation = animationState(elapsed: elapsed)
                let size = proxy.size
                let origin = TasteBloomTransitionMetrics.bloomOrigin(
                    in: size,
                    safeAreaBottom: proxy.safeAreaInsets.bottom,
                    measuredOrigin: self.origin
                )
                let radius = TasteBloomTransitionMetrics.expansionRadius(
                    size: size,
                    origin: origin,
                    progress: expansionProgress
                )
                let cameraRevealRadius = TasteBloomTransitionMetrics.cameraRevealRadius(
                    size: size,
                    radius: radius,
                    expansionProgress: expansionProgress
                )

                ZStack {
                    Rectangle()
                        .fill(.ultraThinMaterial)
                        .overlay(
                            Color.white.opacity(
                                TasteBloomTransitionMetrics.whiteScrimOpacity(progress)
                            )
                        )
                        .ignoresSafeArea()

                    Canvas(opaque: false, colorMode: .nonLinear, rendersAsynchronously: true) {
                        context,
                        canvasSize in
                        drawBloom(
                            in: &context,
                            size: canvasSize,
                            animation: animation,
                            origin: origin,
                            expansionProgress: expansionProgress
                        )
                    }
                    .mask {
                        TasteBloomRadialMask(
                            origin: origin,
                            radius: radius,
                            phase: animation.phase,
                            expansionProgress: expansionProgress
                        )
                        .blur(
                            radius: TasteBloomTransitionMetrics.maskFeatherRadius(
                                expansionProgress: expansionProgress
                            )
                        )
                    }
                    .compositingGroup()

                    TasteBloomCameraRevealMask(
                        origin: origin,
                        radius: cameraRevealRadius,
                        phase: animation.phase - .pi / 7,
                        expansionProgress: expansionProgress
                    )
                    .blur(
                        radius: TasteBloomTransitionMetrics.cameraRevealFeatherRadius(
                            expansionProgress: expansionProgress
                        )
                    )
                    .blendMode(.destinationOut)
                    .allowsHitTesting(false)

                    Canvas(opaque: false, colorMode: .nonLinear, rendersAsynchronously: true) {
                        context,
                        canvasSize in
                        drawExpansionEdge(
                            in: &context,
                            size: canvasSize,
                            origin: origin,
                            radius: radius,
                            animation: animation,
                            expansionProgress: expansionProgress
                        )
                    }
                    .opacity(TasteBloomTransitionMetrics.edgeGlowOpacity(progress))
                    .blur(
                        radius: TasteBloomTransitionMetrics.edgeBlurRadius(
                            expansionProgress: expansionProgress
                        )
                    )
                    .compositingGroup()
                    .allowsHitTesting(false)
                }
                .frame(width: size.width, height: size.height)
                .opacity(TasteBloomTransitionMetrics.overlayOpacity(progress))
                .compositingGroup()
            }
        }
        .ignoresSafeArea()
        .contentShape(Rectangle())
        .onAppear {
            startedAt = Date()
        }
    }

    private func drawExpansionEdge(
        in context: inout GraphicsContext,
        size: CGSize,
        origin: CGPoint,
        radius: CGFloat,
        animation: TasteBloomAnimationState,
        expansionProgress: Double
    ) {
        let firstColor = animation.firstColor.filtered(
            hueRotation: animation.hueRotation,
            brightness: TasteBloomTransitionMetrics.bloomBrightness(
                expansionProgress: expansionProgress
            ),
            saturation: TasteBloomTransitionMetrics.bloomSaturation(
                expansionProgress: expansionProgress
            ),
            contrast: TasteBloomTransitionMetrics.bloomContrast(
                expansionProgress: expansionProgress
            )
        )
        .limitingLuminance(
            to: TasteBloomTransitionMetrics.bloomMaxLuminance(
                expansionProgress: expansionProgress
            )
        )
        .color
        let secondColor = animation.secondColor.filtered(
            hueRotation: animation.hueRotation,
            brightness: TasteBloomTransitionMetrics.bloomBrightness(
                expansionProgress: expansionProgress
            ),
            saturation: TasteBloomTransitionMetrics.bloomSaturation(
                expansionProgress: expansionProgress
            ),
            contrast: TasteBloomTransitionMetrics.bloomContrast(
                expansionProgress: expansionProgress
            )
        )
        .limitingLuminance(
            to: TasteBloomTransitionMetrics.bloomMaxLuminance(
                expansionProgress: expansionProgress
            )
        )
        .color
        let edgePath = TasteBloomTransitionMetrics.radialBlobPath(
            size: size,
            origin: origin,
            radius: radius,
            phase: animation.phase,
            expansionProgress: expansionProgress
        )

        context.stroke(
            edgePath,
            with: .radialGradient(
                Gradient(stops: [
                    .init(color: firstColor.opacity(0.46), location: 0),
                    .init(color: secondColor.opacity(0.38), location: 0.58),
                    .init(color: Color.white.opacity(0.16), location: 1)
                ]),
                center: origin,
                startRadius: max(radius - 120, 0),
                endRadius: radius + 120
            ),
            lineWidth: TasteBloomTransitionMetrics.edgeGlowWidth(
                size: size,
                expansionProgress: expansionProgress
            )
        )

        context.stroke(
            edgePath,
            with: .linearGradient(
                Gradient(stops: [
                    .init(color: firstColor.opacity(0.92), location: 0),
                    .init(color: secondColor.opacity(0.82), location: 0.52),
                    .init(color: firstColor.opacity(0.92), location: 1)
                ]),
                startPoint: CGPoint(x: origin.x - radius, y: origin.y + radius),
                endPoint: CGPoint(x: origin.x + radius, y: origin.y - radius)
            ),
            lineWidth: TasteBloomTransitionMetrics.edgeRimWidth
        )
    }

    private func drawBloom(
        in context: inout GraphicsContext,
        size: CGSize,
        animation: TasteBloomAnimationState,
        origin: CGPoint,
        expansionProgress: Double
    ) {
        let metrics = TasteBloomTransitionMetrics.self
        let firstColor = animation.firstColor.filtered(
            hueRotation: animation.hueRotation,
            brightness: metrics.bloomBrightness(expansionProgress: expansionProgress),
            saturation: metrics.bloomSaturation(expansionProgress: expansionProgress),
            contrast: metrics.bloomContrast(expansionProgress: expansionProgress)
        )
        .limitingLuminance(to: metrics.bloomMaxLuminance(expansionProgress: expansionProgress))
        .color
        let secondColor = animation.secondColor.filtered(
            hueRotation: animation.hueRotation,
            brightness: metrics.bloomBrightness(expansionProgress: expansionProgress),
            saturation: metrics.bloomSaturation(expansionProgress: expansionProgress),
            contrast: metrics.bloomContrast(expansionProgress: expansionProgress)
        )
        .limitingLuminance(to: metrics.bloomMaxLuminance(expansionProgress: expansionProgress))
        .color
        let rect = CGRect(origin: .zero, size: size)

        context.fill(
            Path(rect),
            with: .linearGradient(
                Gradient(stops: [
                    .init(color: firstColor.opacity(0.96), location: 0),
                    .init(color: secondColor.opacity(0.90), location: 0.42),
                    .init(color: firstColor.opacity(0.98), location: 1)
                ]),
                startPoint: CGPoint(x: size.width * 0.16, y: size.height),
                endPoint: CGPoint(x: size.width * 0.92, y: 0)
            )
        )

        let sourceRadius = max(size.width, size.height)
            * CGFloat(0.12 + 0.24 * expansionProgress)
        let sourcePath = metrics.radialBlobPath(
            size: size,
            origin: origin,
            radius: sourceRadius,
            phase: animation.phase + .pi / 9,
            expansionProgress: max(expansionProgress, 0.22)
        )
        context.fill(
            sourcePath,
            with: .radialGradient(
                Gradient(stops: [
                    .init(
                        color: Color.white.opacity(
                            metrics.sourceWhiteOpacity(expansionProgress: expansionProgress)
                        ),
                        location: 0
                    ),
                    .init(
                        color: firstColor.opacity(
                            metrics.sourceFirstOpacity(expansionProgress: expansionProgress)
                        ),
                        location: 0.24
                    ),
                    .init(
                        color: secondColor.opacity(
                            metrics.sourceSecondOpacity(expansionProgress: expansionProgress)
                        ),
                        location: 0.58
                    ),
                    .init(color: Color.white.opacity(0), location: 1)
                ]),
                center: origin,
                startRadius: 0,
                endRadius: sourceRadius
            )
        )

        let specs = TasteBloomTransitionMetrics.blobSpecs
        let waveHeight = CGFloat(0.90 + ((1 - cos(animation.phase + .pi / 3)) / 2) * 0.24)

        for index in specs.indices.reversed() {
            let spec = specs[index]
            let color = spec.color == .first ? firstColor : secondColor
            let motion = motionGroup(
                phase: animation.phase,
                offset: spec.offset,
                size: size
            )
            let center = CGPoint(
                x: size.width * spec.x + motion.x * spec.xSign,
                y: size.height * spec.y + motion.y * spec.ySign
            )
            let radiusX = size.width * spec.radiusX * motion.widthScale
            let radiusY = size.height * spec.radiusY * motion.heightScale
                * (spec.usesWaveHeight ? waveHeight : 1)

            drawBlob(
                context: context,
                center: center,
                radiusX: radiusX,
                radiusY: radiusY,
                color: color.opacity(spec.opacity)
            )
        }

    }

    private func motionGroup(
        phase: Double,
        offset: Double,
        size: CGSize
    ) -> TasteBloomMotionGroup {
        TasteBloomMotionGroup(
            widthScale: CGFloat(0.86 + ((1 - cos(phase + offset)) / 2) * 0.30),
            heightScale: CGFloat(0.88 + ((1 - cos(phase + offset + .pi)) / 2) * 0.24),
            x: size.width * 0.045 * CGFloat(sin(phase + offset)),
            y: size.height * 0.030 * CGFloat(sin(phase + offset + .pi / 2))
        )
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
        blobContext.fill(
            unitCircle,
            with: .radialGradient(
                Gradient(stops: [
                    .init(color: color, location: 0),
                    .init(color: color.opacity(0.30), location: 0.52),
                    .init(color: color.opacity(0), location: 0.86),
                    .init(color: color.opacity(0), location: 1)
                ]),
                center: .zero,
                startRadius: 0,
                endRadius: 1
            )
        )
    }

    private func animationState(elapsed: TimeInterval) -> TasteBloomAnimationState {
        guard !reduceMotion else {
            let pair = TasteBloomPalette.pair(cycle: 0)
            return TasteBloomAnimationState(
                phase: 0,
                firstColor: pair.first,
                secondColor: pair.second,
                hueRotation: 0
            )
        }

        let safeElapsed = max(0, elapsed)
        let cycle = Int(floor(safeElapsed / TasteBloomTransitionMetrics.motionDuration))
        let progress = safeElapsed
            .truncatingRemainder(dividingBy: TasteBloomTransitionMetrics.motionDuration)
            / TasteBloomTransitionMetrics.motionDuration
        let launchProgress = TasteBloomTransitionMetrics.normalizedProgress(safeElapsed)
        let easedProgress = TasteBloomTransitionMetrics.smoothStep(progress)
        let currentPair = TasteBloomPalette.pair(cycle: cycle)
        let nextPair = TasteBloomPalette.pair(cycle: cycle + 1)
        let phase = progress * .pi * 2
        let launchHueRotation = sin(launchProgress * .pi * 2.35)
            * TasteBloomTransitionMetrics.launchHueRotationAmplitude

        return TasteBloomAnimationState(
            phase: phase,
            firstColor: currentPair.first.mixed(with: nextPair.first, amount: easedProgress),
            secondColor: currentPair.second.mixed(with: nextPair.second, amount: easedProgress),
            hueRotation: sin(phase + .pi / 6)
                * TasteBloomTransitionMetrics.hueRotationAmplitude
                + launchHueRotation
        )
    }
}

/// Reuses the entrance bloom geometry in reverse so the presented dining flow
/// contracts back into the bottom-tab center button.
struct DiningFeedbackTasteBloomCollapseMask: View, Animatable {
    let origin: CGPoint?
    var progress: Double

    var animatableData: Double {
        get { progress }
        set { progress = newValue }
    }

    var body: some View {
        GeometryReader { proxy in
            let dismissalProgress = min(max(progress, 0), 1)
            let visualElapsed = TasteBloomTransitionMetrics.duration
                * (1 - dismissalProgress)
            let visualProgress = TasteBloomTransitionMetrics.normalizedProgress(
                visualElapsed
            )
            let expansionProgress = TasteBloomTransitionMetrics.expansionProgress(
                visualProgress
            )
            let motionProgress = visualElapsed
                .truncatingRemainder(
                    dividingBy: TasteBloomTransitionMetrics.motionDuration
                )
                / TasteBloomTransitionMetrics.motionDuration
            let phase = motionProgress * .pi * 2
            let size = proxy.size
            let resolvedOrigin = TasteBloomTransitionMetrics.bloomOrigin(
                in: size,
                safeAreaBottom: proxy.safeAreaInsets.bottom,
                measuredOrigin: origin
            )
            let radius = TasteBloomTransitionMetrics.expansionRadius(
                size: size,
                origin: resolvedOrigin,
                progress: expansionProgress
            )

            TasteBloomRadialMask(
                origin: resolvedOrigin,
                radius: radius,
                phase: phase,
                expansionProgress: expansionProgress
            )
            .blur(
                radius: TasteBloomTransitionMetrics.maskFeatherRadius(
                    expansionProgress: expansionProgress
                )
            )
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }
}

private struct TasteBloomRadialMask: View {
    let origin: CGPoint
    let radius: CGFloat
    let phase: Double
    let expansionProgress: Double

    var body: some View {
        Canvas(opaque: false, colorMode: .linear, rendersAsynchronously: true) {
            context,
            size in
            let path = TasteBloomTransitionMetrics.radialBlobPath(
                size: size,
                origin: origin,
                radius: radius,
                phase: phase,
                expansionProgress: expansionProgress
            )

            context.fill(path, with: .color(.white))
        }
    }
}

private struct TasteBloomCameraRevealMask: View {
    let origin: CGPoint
    let radius: CGFloat
    let phase: Double
    let expansionProgress: Double

    var body: some View {
        Canvas(opaque: false, colorMode: .linear, rendersAsynchronously: true) {
            context,
            size in
            guard radius > 0 else {
                return
            }

            var path = TasteBloomTransitionMetrics.radialBlobPath(
                size: size,
                origin: origin,
                radius: radius,
                phase: phase,
                expansionProgress: expansionProgress
            )
            let protectedRadius = TasteBloomTransitionMetrics
                .cameraRevealProtectedRadius(
                    revealRadius: radius,
                    expansionProgress: expansionProgress
                )
            if protectedRadius > 0.5 {
                path.addEllipse(
                    in: CGRect(
                        x: origin.x - protectedRadius,
                        y: origin.y - protectedRadius,
                        width: protectedRadius * 2,
                        height: protectedRadius * 2
                    )
                )
            }

            context.fill(path, with: .color(.white), style: FillStyle(eoFill: true))
        }
    }
}

private enum TasteBloomTransitionMetrics {
    static let duration = TasteBloomMotion.duration(.bloom, reduceMotion: false)
    static let motionDuration: TimeInterval = 3.6
    static let hueRotationAmplitude = 17.0
    static let launchHueRotationAmplitude = 42.0
    static let sourceButtonRadius: CGFloat = 24
    static let edgeRimWidth: CGFloat = 2.2
    static let cameraRevealStartProgress = 0.70
    static let endpointRoundnessProgress = 0.12
    static let endpointMinimumAmplitudeScale = 0.08

    static let blobSpecs: [TasteBloomBlobSpec] = [
        .init(color: .first, radiusX: 0.42, radiusY: 0.18, x: 0.18, y: 0.10, offset: 0, xSign: 1, ySign: 1, opacity: 0.84, usesWaveHeight: true),
        .init(color: .first, radiusX: 0.36, radiusY: 0.22, x: 0.45, y: 0.02, offset: .pi * 2 / 3, xSign: 1, ySign: 1, opacity: 0.72),
        .init(color: .first, radiusX: 0.28, radiusY: 0.46, x: 0.02, y: 0.48, offset: .pi * 4 / 3, xSign: 1, ySign: 1, opacity: 0.78, usesWaveHeight: true),
        .init(color: .first, radiusX: 0.32, radiusY: 0.24, x: 0.32, y: 0.96, offset: .pi * 2 / 3, xSign: -1, ySign: -1, opacity: 0.80),
        .init(color: .second, radiusX: 0.74, radiusY: 0.16, x: 0.78, y: 0.02, offset: 0, xSign: -1, ySign: 1, opacity: 0.80),
        .init(color: .second, radiusX: 0.42, radiusY: 0.18, x: 1.02, y: 0.42, offset: .pi * 4 / 3, xSign: -1, ySign: 1, opacity: 0.74, usesWaveHeight: true),
        .init(color: .second, radiusX: 0.48, radiusY: 0.20, x: 0.80, y: 0.88, offset: 0, xSign: -1, ySign: -1, opacity: 0.86, usesWaveHeight: true),
        .init(color: .second, radiusX: 0.28, radiusY: 0.28, x: 0.52, y: 1.04, offset: .pi * 2 / 3, xSign: -1, ySign: -1, opacity: 0.82)
    ]

    static func normalizedProgress(_ elapsed: TimeInterval) -> Double {
        min(max(elapsed / duration, 0), 1)
    }

    static func smoothStep(_ value: Double) -> Double {
        let t = min(max(value, 0), 1)
        return t * t * (3 - 2 * t)
    }

    static func expansionProgress(_ progress: Double) -> Double {
        TasteBloomMotion.progress(progress)
    }

    static func overlayOpacity(_ progress: Double) -> Double {
        1
    }

    static func whiteScrimOpacity(_ progress: Double) -> Double {
        0.34 + 0.48 * smoothStep(progress / 0.18)
    }

    static func edgeGlowOpacity(_ progress: Double) -> Double {
        let appear = smoothStep(progress / 0.10)
        let disappear = 1 - smoothStep((progress - 0.92) / 0.08)
        return min(max(appear * disappear, 0), 1)
    }

    static func maskFeatherRadius(expansionProgress: Double) -> CGFloat {
        let arrival = min(max(expansionProgress / 0.24, 0), 1)
        let finishSoftening = 1 - min(max((expansionProgress - 0.90) / 0.10, 0), 1) * 0.20
        return CGFloat(5.5 + 10.5 * arrival) * CGFloat(finishSoftening)
    }

    static func edgeBlurRadius(expansionProgress: Double) -> CGFloat {
        let arrival = min(max(expansionProgress / 0.22, 0), 1)
        let finishSoftening = 1 - min(max((expansionProgress - 0.88) / 0.12, 0), 1) * 0.18
        return CGFloat(7.0 + 13.0 * arrival) * CGFloat(finishSoftening)
    }

    static func cameraRevealRadius(
        size: CGSize,
        radius: CGFloat,
        expansionProgress: Double
    ) -> CGFloat {
        let progress = cameraRevealProgress(expansionProgress: expansionProgress)
        let haloWidth = colorHaloWidth(size: size, expansionProgress: expansionProgress)
        return max(0, radius - haloWidth) * CGFloat(progress)
    }

    static func cameraRevealFeatherRadius(expansionProgress: Double) -> CGFloat {
        let progress = cameraRevealProgress(expansionProgress: expansionProgress)
        return CGFloat(8 + 14 * progress)
    }

    static func cameraRevealProgress(expansionProgress: Double) -> Double {
        let span = max(1 - cameraRevealStartProgress, 0.001)
        return smoothStep((expansionProgress - cameraRevealStartProgress) / span)
    }

    static func colorHaloWidth(size: CGSize, expansionProgress: Double) -> CGFloat {
        let progress = cameraRevealProgress(expansionProgress: expansionProgress)
        let base = max(min(size.width, size.height) * 0.28, 104)
        let lateCompression = 1 - progress * 0.30
        return base * CGFloat(lateCompression)
    }

    static func cameraRevealProtectedRadius(
        revealRadius: CGFloat,
        expansionProgress: Double
    ) -> CGFloat {
        let reveal = cameraRevealProgress(expansionProgress: expansionProgress)
        let protectedRadius = CGFloat(74 - 12 * reveal)
        let featherRadius = cameraRevealFeatherRadius(expansionProgress: expansionProgress)
        let releaseStart = protectedRadius + featherRadius * 1.35
        let releaseDistance = max(protectedRadius * 0.82, 52)
        let release = smoothStep(
            Double((revealRadius - releaseStart) / releaseDistance)
        )

        return protectedRadius * CGFloat(1 - release)
    }

    static func bloomBrightness(expansionProgress: Double) -> Double {
        let p = smoothStep(expansionProgress)
        return 1.02 + 0.34 * p
    }

    static func bloomSaturation(expansionProgress: Double) -> Double {
        let p = smoothStep(expansionProgress)
        return 1.78 - 0.10 * p
    }

    static func bloomContrast(expansionProgress: Double) -> Double {
        let p = smoothStep(expansionProgress)
        return 1.22 - 0.08 * p
    }

    static func bloomMaxLuminance(expansionProgress: Double) -> Double {
        let p = smoothStep(expansionProgress)
        return 0.50 + 0.40 * p
    }

    static func sourceWhiteOpacity(expansionProgress: Double) -> Double {
        let p = smoothStep(expansionProgress)
        return 0.08 + 0.20 * p
    }

    static func sourceFirstOpacity(expansionProgress: Double) -> Double {
        let p = smoothStep(expansionProgress)
        return 0.78 - 0.10 * p
    }

    static func sourceSecondOpacity(expansionProgress: Double) -> Double {
        let p = smoothStep(expansionProgress)
        return 0.56 - 0.08 * p
    }

    static func bloomOrigin(
        in size: CGSize,
        safeAreaBottom: CGFloat,
        measuredOrigin: CGPoint? = nil
    ) -> CGPoint {
        let fallbackOrigin = CGPoint(
            x: size.width * 0.5,
            y: size.height - safeAreaBottom - TBSize.bottomTabBarHeight / 2
        )

        guard let measuredOrigin,
              measuredOrigin.x.isFinite,
              measuredOrigin.y.isFinite else {
            return fallbackOrigin
        }

        return CGPoint(
            x: min(max(measuredOrigin.x, 0), size.width),
            y: min(max(measuredOrigin.y, 0), size.height)
        )
    }

    static func expansionRadius(
        size: CGSize,
        origin: CGPoint,
        progress: Double
    ) -> CGFloat {
        let targetRadius = maximumExpansionRadius(size: size, origin: origin)
        return sourceButtonRadius + (targetRadius - sourceButtonRadius) * CGFloat(progress)
    }

    static func edgeGlowWidth(size: CGSize, expansionProgress: Double) -> CGFloat {
        let base = max(min(size.width, size.height) * 0.09, 34)
        let arrival = min(max(expansionProgress / 0.28, 0), 1)
        let settle = 1 - min(max((expansionProgress - 0.88) / 0.12, 0), 1) * 0.42
        return base * CGFloat(0.58 + 0.42 * arrival) * CGFloat(settle)
    }

    static func radialBlobPath(
        size: CGSize,
        origin: CGPoint,
        radius: CGFloat,
        phase: Double,
        expansionProgress: Double
    ) -> Path {
        let sampleCount = 128
        let amplitude = radialBlobAmplitude(
            size: size,
            radius: radius,
            expansionProgress: expansionProgress
        )
        var path = Path()

        for index in 0 ... sampleCount {
            let xProgress = CGFloat(index) / CGFloat(sampleCount)
            let angle = Double(xProgress) * .pi * 2
            let wideWave = sin(angle * 3.0 + phase * 1.18)
            let midWave = sin(angle * 6.0 - phase * 0.74)
            let slowWave = cos(angle * 2.0 + phase * 0.46)
            let fineWave = sin(angle * 10.0 + phase * 1.72)
            let notchWave = cos(angle * 13.0 - phase * 1.08)
            let directionalLift = sin(angle - .pi / 2)
            let wave = wideWave * 0.52
                + midWave * 0.24
                + slowWave * 0.14
                + fineWave * 0.12
                + notchWave * 0.09
                + directionalLift * 0.10
            let localRadius = max(sourceButtonRadius * 0.72, radius + amplitude * CGFloat(wave))
            let point = CGPoint(
                x: origin.x + CGFloat(cos(angle)) * localRadius,
                y: origin.y + CGFloat(sin(angle)) * localRadius
            )

            if index == 0 {
                path.move(to: point)
            } else {
                path.addLine(to: point)
            }
        }

        path.closeSubpath()
        return path
    }

    private static func maximumExpansionRadius(size: CGSize, origin: CGPoint) -> CGFloat {
        let topLeft = distance(from: origin, to: CGPoint(x: 0, y: 0))
        let topRight = distance(from: origin, to: CGPoint(x: size.width, y: 0))
        let bottomLeft = distance(from: origin, to: CGPoint(x: 0, y: size.height))
        let bottomRight = distance(from: origin, to: CGPoint(x: size.width, y: size.height))
        let farthestCorner = max(max(topLeft, topRight), max(bottomLeft, bottomRight))
        return farthestCorner + max(size.width, size.height) * 0.16
    }

    private static func distance(from origin: CGPoint, to point: CGPoint) -> CGFloat {
        let dx = point.x - origin.x
        let dy = point.y - origin.y
        return sqrt(dx * dx + dy * dy)
    }

    private static func radialBlobAmplitude(
        size: CGSize,
        radius: CGFloat,
        expansionProgress: Double
    ) -> CGFloat {
        let base = max(min(size.width, size.height) * 0.072, 26)
        let growth = min(max(expansionProgress / 0.30, 0), 1)
        let roundnessSpan = max(endpointRoundnessProgress, 0.001)
        let endpointTransition = smoothStep(expansionProgress / roundnessSpan)
        let endpointAmplitudeScale = endpointMinimumAmplitudeScale
            + (1 - endpointMinimumAmplitudeScale) * endpointTransition
        let settle = 1 - min(max((expansionProgress - 0.90) / 0.10, 0), 1) * 0.54
        let radiusClamp = min(radius / 180, 1)
        return base
            * CGFloat(0.72 + 0.34 * growth)
            * CGFloat(endpointAmplitudeScale)
            * CGFloat(settle)
            * CGFloat(0.76 + 0.24 * radiusClamp)
    }
}

private enum TasteBloomBlobColor {
    case first
    case second
}

private struct TasteBloomBlobSpec {
    let color: TasteBloomBlobColor
    let radiusX: CGFloat
    let radiusY: CGFloat
    let x: CGFloat
    let y: CGFloat
    let offset: Double
    let xSign: CGFloat
    let ySign: CGFloat
    let opacity: Double
    var usesWaveHeight = false
}

private struct TasteBloomMotionGroup {
    let widthScale: CGFloat
    let heightScale: CGFloat
    let x: CGFloat
    let y: CGFloat
}

private struct TasteBloomAnimationState {
    let phase: Double
    let firstColor: TasteBloomColor
    let secondColor: TasteBloomColor
    let hueRotation: Double
}

private struct TasteBloomColor {
    let red: Double
    let green: Double
    let blue: Double

    var color: Color {
        Color(red: red, green: green, blue: blue)
    }

    func mixed(with other: TasteBloomColor, amount: Double) -> TasteBloomColor {
        TasteBloomColor(
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
    ) -> TasteBloomColor {
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

        return TasteBloomColor(
            red: clamp(((luminance + (brightRed - luminance) * saturation) - 0.5) * contrast + 0.5),
            green: clamp(((luminance + (brightGreen - luminance) * saturation) - 0.5) * contrast + 0.5),
            blue: clamp(((luminance + (brightBlue - luminance) * saturation) - 0.5) * contrast + 0.5)
        )
    }

    func limitingLuminance(to maxLuminance: Double) -> TasteBloomColor {
        let luminance = red * 0.213 + green * 0.715 + blue * 0.072
        guard luminance > maxLuminance, luminance > 0 else {
            return self
        }

        let scale = maxLuminance / luminance
        return TasteBloomColor(
            red: clamp(red * scale),
            green: clamp(green * scale),
            blue: clamp(blue * scale)
        )
    }

    private func clamp(_ value: Double) -> Double {
        min(max(value, 0), 1)
    }
}

private struct TasteBloomColorPair {
    let firstIndex: Int
    let secondIndex: Int
}

private enum TasteBloomPalette {
    static let colors = [
        TasteBloomColor(red: 1, green: 0.6, blue: 0),
        TasteBloomColor(red: 251 / 255, green: 192 / 255, blue: 45 / 255),
        TasteBloomColor(red: 149 / 255, green: 201 / 255, blue: 0),
        TasteBloomColor(red: 114 / 255, green: 153 / 255, blue: 1),
        TasteBloomColor(red: 179 / 255, green: 114 / 255, blue: 180 / 255),
        TasteBloomColor(red: 149 / 255, green: 134 / 255, blue: 122 / 255)
    ]

    private static let sequence = [
        TasteBloomColorPair(firstIndex: 0, secondIndex: 3),
        TasteBloomColorPair(firstIndex: 1, secondIndex: 4),
        TasteBloomColorPair(firstIndex: 2, secondIndex: 5),
        TasteBloomColorPair(firstIndex: 3, secondIndex: 0),
        TasteBloomColorPair(firstIndex: 4, secondIndex: 1),
        TasteBloomColorPair(firstIndex: 5, secondIndex: 2)
    ]

    static func pair(cycle: Int) -> (first: TasteBloomColor, second: TasteBloomColor) {
        let pair = sequence[cycle % sequence.count]
        return (colors[pair.firstIndex], colors[pair.secondIndex])
    }
}

struct AppShellView: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var activeTab: MainTab
    @State private var routeStack: [AppRoute] = []
    @State private var homeInsightTints: [String: Double] = [:]
    @State private var routeSwipeTranslation: CGFloat = 0
    @State private var topAppBarBloomToken = 0
    @State private var activeSheet: AppSheet?
    @State private var activeBookmarkSheetRestaurant: RestaurantSummary?
    @State private var hasUnreadNotifications = true
    @State private var stagedSheetDragTranslation: CGFloat = 0
    @State private var isDraggingStagedSheet = false
    @State private var stagedSheetDragBaseline: CGFloat = 0
    @State private var stagedSheetDragWaitedForScroll = false
    @StateObject private var stagedSheetScrollCoordinator = BottomSheetScrollCoordinator()
    @State private var bookmarkCoverIconID: BookmarkCoverIconID = .utensils
    @State private var bookmarkCoverTasteID: TasteAxis = .sweet
    @State private var isBookmarkCoverEditorOpen = false
    @State private var showsProfileEditDeleteConfirmation = false
    @State private var isDeletingProfileAccount = false
    @State private var profileDeletionErrorMessage: String?
    @State private var profileLinkErrorMessage: String?
    @State private var activeDishOptionsItem: DiningDishFeedbackItem?
    @State private var showsNewDiningFeedback = false
    @State private var showsDiningFeedbackTasteBloomTransition = false
    @State private var newDiningFeedbackStartMode: DiningFeedbackStartMode = .cameraCapture
    @State private var bottomTabCenterButtonFrame: CGRect = .null
    @State private var diningFeedbackLaunchOrigin: CGPoint?
    @State private var activeDiningFeedbackEditEntry: DiningEntry?
    @State private var activeInfoSuggestionSheet: (restaurantName: String, infoRows: [RestaurantInfoRowModel])?
    @State private var activeMenuSuggestionSheetRestaurantName: String?
    private let onStagedSheetPresentationChange: ((Bool) -> Void)?
    private let diningContentState: DiningDishFeedbackContentState

    init(
        initialTab: MainTab = .home,
        initialRoute: AppRoute? = nil,
        onStagedSheetPresentationChange: ((Bool) -> Void)? = nil,
        diningContentState: DiningDishFeedbackContentState = .populated
    ) {
        _activeTab = State(initialValue: initialTab)
        _routeStack = State(initialValue: initialRoute.map { [$0] } ?? [])
        self.onStagedSheetPresentationChange = onStagedSheetPresentationChange
        self.diningContentState = diningContentState
    }

    var body: some View {
        GeometryReader { proxy in
            let screenBounds = UIScreen.main.bounds
            let safeAreaTop = max(proxy.safeAreaInsets.top, hardwareStatusBarHeight)
            let usesInternalStatusBarSpace = routeStack.isEmpty && !isGlobalSearchActive

            ZStack {
                ZStack {
                    TBColor.page
                    Color.black.opacity(stagedSheetProgress)
                }
                .ignoresSafeArea()
                .animation(
                    isDraggingStagedSheet ? nil : TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion),
                    value: stagedSheetProgress
                )

                StagedSheetScreen(
                    progress: stagedSheetProgress,
                    dimOpacity: BottomSheetShellMetrics.overlayOpacity * stagedSheetProgress,
                    animates: !isDraggingStagedSheet,
                    openOffsetY: safeAreaTop + StagedBottomSheetBackgroundMetrics.openOffsetY
                ) {
                    VStack(spacing: 0) {
                        Color.clear
                            .frame(height: usesInternalStatusBarSpace ? 0 : safeAreaTop)
                        shellContent
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .background(currentTopChromeBackground)
                    .environment(\.colorScheme, .light)
                    .environment(\.mainTabStatusBarHeight, usesInternalStatusBarSpace ? safeAreaTop : 0)
                    .environment(\.tbTopChromeInset, usesInternalStatusBarSpace ? nil : safeAreaTop)
                    .onPreferenceChange(HomeInsightTintPreferenceKey.self) { value in
                        homeInsightTints = value
                    }
                }
                .frame(width: proxy.size.width, height: proxy.size.height)
                .allowsHitTesting(activeStagedSheet == nil)
                .zIndex(1)

                if !currentRouteShowsContentUnderBottomSafeArea {
                    bottomSafeAreaBackground(safeAreaBottom: proxy.safeAreaInsets.bottom)
                        .zIndex(0.5)
                }

                statusBarBackground(safeAreaTop: safeAreaTop)
                    .zIndex(2)

                if let activeStagedSheet {
                    stagedSheetView(for: activeStagedSheet)
                        .environment(\.colorScheme, .light)
                        .environment(\.bottomSheetScrollCoordinator, stagedSheetScrollCoordinator)
                        .frame(
                            width: proxy.size.width,
                            height: stagedSheetHeight,
                            alignment: .bottom
                        )
                        .position(
                            x: proxy.size.width / 2,
                            y: proxy.size.height
                                - stagedSheetHeight / 2
                                + proxy.safeAreaInsets.bottom
                                + stagedSheetDragTranslation
                        )
                        .simultaneousGesture(stagedSheetDragGesture)
                        .transition(TasteBloomMotion.sheetTransition(reduceMotion: reduceMotion))
                        // 제거 전환 중에도 배경 카드·안전영역보다 앞에서 내려간다.
                        .zIndex(3)
                }

                if activeStagedSheet != nil {
                    stagedSheetOutsideTapLayer(
                        sheetTop: proxy.size.height
                            - stagedSheetHeight
                            + proxy.safeAreaInsets.bottom
                            + stagedSheetDragTranslation
                    )
                    .zIndex(1.5)
                }

                if isBookmarkCoverEditorOpen {
                    BookmarkCoverEditorOverlay(
                        selectedCoverIconID: $bookmarkCoverIconID,
                        selectedCoverTasteID: $bookmarkCoverTasteID,
                        onDismiss: {
                            isBookmarkCoverEditorOpen = false
                        },
                        backdropOpacity: 0
                    )
                    .frame(width: screenBounds.width, height: screenBounds.height)
                    .position(
                        x: screenBounds.midX,
                        y: screenBounds.midY
                    )
                    .ignoresSafeArea()
                    .transition(.opacity)
                    .zIndex(10)
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
        .ignoresSafeArea(edges: [.horizontal, .top])
        .ignoresSafeArea(.container, edges: currentRouteShowsContentUnderBottomSafeArea ? .bottom : [])
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .overlay {
            if showsProfileEditDeleteConfirmation {
                profileEditDeleteConfirmationLayer
                    .ignoresSafeArea()
                    .transition(.opacity)
                    .zIndex(20)
            }
        }
        .animation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion), value: activeStagedSheet?.id)
        .animation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion), value: showsProfileEditDeleteConfirmation)
        .onChange(of: showsProfileEditDeleteConfirmation) { _, isPresented in
            if isPresented {
                profileDeletionErrorMessage = nil
            }
        }
        .alert(
            "프로필 연결을 마무리하지 못했어요.",
            isPresented: Binding(
                get: { profileLinkErrorMessage != nil },
                set: { if !$0 { profileLinkErrorMessage = nil } }
            )
        ) {
            Button("다시 시도", action: completeLinkedCurrentProfile)
            Button("닫기", role: .cancel) {}
        } message: {
            Text(profileLinkErrorMessage ?? "잠시 후 다시 시도해 주세요.")
        }
        .onChange(of: activeStagedSheet != nil) { _, isPresented in
            onStagedSheetPresentationChange?(isPresented)
        }
        .onChange(of: activeStagedSheet?.id) { _, _ in
            stagedSheetScrollCoordinator.reset()
            resetStagedSheetDragHandoff()
        }
        .onChange(of: routeStack) { _, _ in
            triggerTopAppBarBloom()
        }
        .onDisappear {
            onStagedSheetPresentationChange?(false)
        }
        .sheet(item: systemSheetBinding) { sheet in
            switch sheet {
            case .profileSummary:
                ProfileSummarySheet(
                    onDismissRequest: dismissActiveSheet,
                    openProfileEdit: {
                        activeSheet = .profileEdit
                    },
                    openAuthEntry: { intent in
                        activeSheet = .authEntry(intent)
                    }
                )
            case .profileEdit:
                EmptyView()
            case .globalSearch:
                EmptyView()
            case .notifications:
                EmptyView()
            case .quickRefinement:
                EmptyView()
            case .menu:
                AppMenuSheet(
                    onDismissRequest: dismissActiveSheet,
                    openProfile: { activeSheet = .profileSummary },
                    openNotifications: {
                        hasUnreadNotifications = false
                        activeSheet = .notifications
                    },
                    startQuickRefinement: { activeSheet = .quickRefinement },
                    openSavedList: { navigate(.savedRestaurants) }
                )
            case .publicProfileActions(let profileID):
                PublicProfileActionsSheet(
                    profileID: profileID,
                    onDismissRequest: dismissActiveSheet
                )
            case .bookmark(_):
                EmptyView()
            case .authEntry:
                EmptyView()
            }
        }
        .fullScreenCover(item: $activeDiningFeedbackEditEntry) { entry in
            DiningFeedbackSheet(entry: entry) { updatedEntry in
                appModel.updateDiningEntry(updatedEntry)
            }
        }
        .fullScreenCover(isPresented: $showsNewDiningFeedback) {
            DiningFeedbackSheet(
                startMode: newDiningFeedbackStartMode,
                showsLaunchTransition: showsDiningFeedbackTasteBloomTransition,
                launchOrigin: diningFeedbackLaunchOrigin,
                onClose: showsDiningFeedbackTasteBloomTransition
                    ? dismissNewDiningFeedbackAfterTransition
                    : nil
            ) { entry in
                appModel.addDiningEntry(entry)
            }
        }
        .onChange(of: showsNewDiningFeedback) { _, isPresented in
            guard !isPresented else {
                return
            }

            showsDiningFeedbackTasteBloomTransition = false
            diningFeedbackLaunchOrigin = nil
        }
    }

    @ViewBuilder
    private func statusBarBackground(safeAreaTop: CGFloat) -> some View {
        if !routeUsesProgressiveTopChrome {
            VStack(spacing: 0) {
                currentTopChromeBackground
                    .frame(height: safeAreaTop)
                Spacer(minLength: 0)
            }
            .ignoresSafeArea(edges: .top)
            .allowsHitTesting(false)
            .opacity(1 - stagedSheetProgress)
            .animation(
                isDraggingStagedSheet ? nil : TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion),
                value: stagedSheetProgress
            )
        }
    }

    private func bottomSafeAreaBackground(safeAreaBottom: CGFloat) -> some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            ZStack {
                currentBottomChromeBackground
                Color.black.opacity(stagedSheetProgress)
            }
            .frame(height: safeAreaBottom)
        }
        .ignoresSafeArea(edges: .bottom)
        .allowsHitTesting(false)
    }

    private var currentTopChromeBackground: Color {
        if isGlobalSearchActive {
            return TBColor.page
        }

        if currentRouteUsesCommentFocus {
            return TBColor.focus
        }

        if let kind = currentHomeInsight {
            return kind.backgroundColor(tintProgress: homeInsightTints[kind.rawValue] ?? 0)
        }
        return TBColor.page
    }

    private var currentHomeInsight: HomeArchiveCard.Kind? {
        guard !isGlobalSearchActive, let route = routeStack.last,
              case .homeInsight(let kind) = route else { return nil }
        return kind
    }

    private var routeUsesProgressiveTopChrome: Bool {
        if isGlobalSearchActive {
            return false
        }
        if currentRouteUsesCommentFocus {
            return false
        }
        return true
    }

    private var currentBottomChromeBackground: Color {
        if currentRouteUsesCommentFocus {
            return TBColor.focus
        }

        return TBColor.page
    }

    private var measuredBottomTabCenterButtonOrigin: CGPoint? {
        guard !bottomTabCenterButtonFrame.isNull,
              !bottomTabCenterButtonFrame.isEmpty,
              bottomTabCenterButtonFrame.midX.isFinite,
              bottomTabCenterButtonFrame.midY.isFinite else {
            return nil
        }

        return CGPoint(
            x: bottomTabCenterButtonFrame.midX,
            y: bottomTabCenterButtonFrame.midY
        )
    }

    private var currentRouteShowsContentUnderBottomSafeArea: Bool {
        routeStack.last?.showsContentUnderBottomSafeArea ?? false
    }

    private var currentRouteUsesCommentFocus: Bool {
        guard let activeRoute = routeStack.last else {
            return false
        }

        switch activeRoute {
        case .dishFeedback, .comments:
            return true
        default:
            return false
        }
    }

    private var canSwipeBack: Bool {
        !routeStack.isEmpty
            && activeSheet == nil
            && activeBookmarkSheetRestaurant == nil
            && activeDishOptionsItem == nil
            && activeInfoSuggestionSheet == nil
            && activeMenuSuggestionSheetRestaurantName == nil
            && !isBookmarkCoverEditorOpen
            && !showsProfileEditDeleteConfirmation
    }

    @ViewBuilder
    private var shellContent: some View {
        if let activeRoute = routeStack.last {
            ZStack {
                if routeSwipeTranslation > 0 {
                    previousRouteLayer
                        .offset(x: previousRouteOffset)
                        .blur(radius: previousRouteBlurRadius)
                        .overlay {
                            Color.black
                                .opacity(previousRouteDimOpacity)
                                .allowsHitTesting(false)
                        }
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }

                routeLayer(
                    for: activeRoute,
                    includesSearch: true,
                    contentOffset: routeSwipeTranslation
                )
                    .id(activeRoute)
                    .edgeSwipeBack(
                        isEnabled: canSwipeBack,
                        movesContent: false,
                        onTranslationChange: { routeSwipeTranslation = $0 },
                        action: popRoute
                    )
                    .zIndex(1)
            }
            .clipShape(TopOverflowRoundedRectangle(
                cornerRadius: 0,
                topOverflowInset: keyWindowSafeAreaInsets.top
            ))
        } else {
            mainShellLayer
        }
    }

    @ViewBuilder
    private var previousRouteLayer: some View {
        if routeStack.count > 1 {
            routeLayer(for: routeStack[routeStack.count - 2], includesSearch: false)
        } else {
            mainShellLayer
        }
    }

    private func routeLayer(
        for route: AppRoute,
        includesSearch: Bool,
        contentOffset: CGFloat = 0
    ) -> some View {
        ZStack {
            AppRouteFocusContainer(
                route: route,
                insightTintProgress: homeInsightTints[route.title] ?? 0,
                contentOffset: contentOffset,
                bottomContentInset: keyWindowSafeAreaInsets.bottom,
                topAppBarBloomToken: topAppBarBloomToken,
                onBack: popRoute,
                navigate: navigateImmediately,
                onOpenSearch: {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        activeSheet = .globalSearch
                    }
                },
                onOpenPublicProfileActions: { profileID in
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        activeSheet = .publicProfileActions(profileID: profileID)
                    }
                },
                onOpenBookmarkSheet: presentBookmarkSheet,
                onOpenInfoSuggestionSheet: presentInfoSuggestionSheet,
                onOpenMenuSuggestionSheet: presentMenuSuggestionSheet
            )
            .environmentObject(appModel)

            if includesSearch, isGlobalSearchActive {
                HomeSearchSheet(
                    placeholder: route.usesBuddySearchHeader ? "버디 검색" : "레스토랑, 메뉴, 셰프, 버디 검색",
                    scope: route.usesBuddySearchHeader ? .friendsOnly : .all,
                    onCloseRequest: dismissActiveSheet,
                    onOpenRoute: navigate,
                    onOpenBookmarkSheet: presentBookmarkSheet,
                    onStartDiningFeedback: startDiningFeedbackFromSearch
                )
                .transition(.opacity)
                .zIndex(1)
            }
        }
    }

    private var mainShellLayer: some View {
        currentTabStack
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(TBColor.page)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                BottomTabBar(activeTab: $activeTab) {
                    startDiningFeedbackFromCenterButton()
                }
            }
            .onPreferenceChange(BottomTabCenterButtonFramePreferenceKey.self) { frame in
                bottomTabCenterButtonFrame = frame
            }
    }

    private var systemMainTabTopChrome: some View {
        VStack(spacing: 0) {
            mainTopAppBar(appearance: .transparent)

            if activeTab == .home {
                HomeSearchHeader(showsBackground: false) {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        activeSheet = .globalSearch
                    }
                }
            }
        }
    }

    private var currentSystemMainTabTopChrome: AnyView? {
        guard routeStack.isEmpty && !isGlobalSearchActive else {
            return nil
        }

        return AnyView(systemMainTabTopChrome)
    }

    private func mainTopAppBar(appearance: TopAppBarAppearance) -> some View {
        TopAppBar(
            appearance: appearance,
            solidBackground: .page,
            showSearchAction: activeTab != .home,
            profile: appModel.profile,
            avatarImageData: appModel.profileAvatarImageData,
            hasUnreadNotifications: hasUnreadNotifications,
            bloomToken: topAppBarBloomToken,
            onStartMeasurement: {
                withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                    activeSheet = .quickRefinement
                }
            },
            onOpenSearch: {
                withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                    activeSheet = .globalSearch
                }
            },
            onOpenNotifications: {
                withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                    hasUnreadNotifications = false
                    activeSheet = .notifications
                }
            },
            onOpenMenu: {
                withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                    activeSheet = .menu
                }
            },
            onOpenProfile: {
                withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                    activeSheet = .profileSummary
                }
            }
        )
    }

    private var routeSwipeProgress: CGFloat {
        EdgeSwipeBackMetrics.progress(
            translation: routeSwipeTranslation,
            containerWidth: UIScreen.main.bounds.width
        )
    }

    private var previousRouteOffset: CGFloat {
        -UIScreen.main.bounds.width
            * EdgeSwipeBackMetrics.previousScreenParallax
            * (1 - routeSwipeProgress)
    }

    private var previousRouteDimOpacity: CGFloat {
        EdgeSwipeBackMetrics.previousScreenDimOpacity * (1 - routeSwipeProgress)
    }

    private var previousRouteBlurRadius: CGFloat {
        EdgeSwipeBackMetrics.previousScreenBlurRadius * (1 - routeSwipeProgress)
    }

    @ViewBuilder
    private var currentTabStack: some View {
        ZStack {
            currentTabView
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            if isGlobalSearchActive {
                HomeSearchSheet(
                    onCloseRequest: dismissActiveSheet,
                    onOpenRoute: navigate,
                    onOpenBookmarkSheet: presentBookmarkSheet,
                    onStartDiningFeedback: startDiningFeedbackFromSearch
                )
                .transition(.opacity)
                .zIndex(1)
            }
        }
    }

    private var activeStagedSheet: ActiveStagedSheet? {
        if let activeInfoSuggestionSheet {
            return .infoSuggestion(
                restaurantName: activeInfoSuggestionSheet.restaurantName,
                infoRows: activeInfoSuggestionSheet.infoRows
            )
        }

        if let activeMenuSuggestionSheetRestaurantName {
            return .menuSuggestion(restaurantName: activeMenuSuggestionSheetRestaurantName)
        }

        if let activeBookmarkSheetRestaurant {
            return .bookmark(activeBookmarkSheetRestaurant)
        }

        if let activeDishOptionsItem {
            return .dishOptions(activeDishOptionsItem)
        }

        guard let activeSheet else {
            return nil
        }

        switch activeSheet {
        case .profileSummary, .profileEdit, .notifications, .quickRefinement, .menu, .publicProfileActions, .authEntry:
            return .app(activeSheet)
        case .bookmark(let restaurant):
            return .bookmark(restaurant)
        case .globalSearch:
            return nil
        }
    }

    private var isGlobalSearchActive: Bool {
        guard case .globalSearch? = activeSheet else {
            return false
        }

        return true
    }

    private var stagedSheetProgress: CGFloat {
        guard activeStagedSheet != nil else {
            return 0
        }

        return 1 - stagedSheetDragPercentage
    }

    private var stagedSheetDragPercentage: CGFloat {
        guard stagedSheetHeight > 0 else {
            return 0
        }

        return min(max(stagedSheetDragTranslation / stagedSheetHeight, 0), 1)
    }

    private var stagedSheetHeight: CGFloat {
        BottomSheetShellMetrics.stageHeight(
            screenHeight: UIScreen.main.bounds.height,
            safeAreaTop: keyWindowSafeAreaInsets.top
        )
    }

    private func stagedSheetOutsideTapLayer(sheetTop: CGFloat) -> some View {
        VStack(spacing: 0) {
            Color.clear
                .background(Color.black.opacity(0.001))
                .contentShape(Rectangle())
                .frame(height: max(sheetTop, 0))
                .onTapGesture(perform: dismissActiveSheet)

            Spacer(minLength: 0)
                .allowsHitTesting(false)
        }
        .ignoresSafeArea()
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    private var stagedSheetDragGesture: some Gesture {
        DragGesture(minimumDistance: StagedBottomSheetDragMetrics.minimumDistance)
            .onChanged { value in
                let verticalMovement = value.translation.height
                let horizontalMovement = abs(value.translation.width)
                guard verticalMovement > 0, verticalMovement >= horizontalMovement else {
                    return
                }

                guard stagedSheetScrollCoordinator.allowsSheetDrag else {
                    stagedSheetDragWaitedForScroll = true
                    return
                }

                if !isDraggingStagedSheet {
                    stagedSheetDragBaseline = stagedSheetDragWaitedForScroll ? verticalMovement : 0
                    isDraggingStagedSheet = true
                    stagedSheetScrollCoordinator.isSheetDragging = true
                }

                stagedSheetDragTranslation = max(verticalMovement - stagedSheetDragBaseline, 0)
            }
            .onEnded { value in
                guard isDraggingStagedSheet else {
                    resetStagedSheetDragHandoff()
                    return
                }

                let predictedTranslation = max(
                    value.translation.height - stagedSheetDragBaseline,
                    value.predictedEndTranslation.height - stagedSheetDragBaseline
                )
                let shouldDismiss = predictedTranslation >= stagedSheetHeight
                    * StagedBottomSheetDragMetrics.dismissProgressThreshold

                if shouldDismiss {
                    dismissStagedSheetFromDrag()
                } else {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        stagedSheetDragTranslation = 0
                        isDraggingStagedSheet = false
                        stagedSheetScrollCoordinator.isSheetDragging = false
                    }
                    resetStagedSheetDragHandoff()
                }
            }
    }

    private func resetStagedSheetDragHandoff() {
        stagedSheetDragBaseline = 0
        stagedSheetDragWaitedForScroll = false
        stagedSheetScrollCoordinator.isSheetDragging = false
    }

    private var keyWindowSafeAreaInsets: UIEdgeInsets {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let windows = scenes.flatMap(\.windows)
        if let insets = windows.first(where: { $0.isKeyWindow })?.safeAreaInsets, insets.top > 0 {
            return insets
        }
        if let insets = windows.first?.safeAreaInsets, insets.top > 0 {
            return insets
        }
        return UIEdgeInsets(top: 59, left: 0, bottom: 34, right: 0)
    }

    private var hardwareStatusBarHeight: CGFloat {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let height = scenes.compactMap({ $0.statusBarManager?.statusBarFrame.height }).first(where: { $0 > 0 }) {
            return height
        }
        let windows = scenes.flatMap(\.windows)
        if let top = windows.compactMap({ $0.safeAreaInsets.top }).first(where: { $0 > 0 }) {
            return top
        }
        return 59
    }

    private var systemSheetBinding: Binding<AppSheet?> {
        Binding(
            get: {
                activeStagedSheet == nil && !isGlobalSearchActive ? activeSheet : nil
            },
            set: { nextSheet in
                activeSheet = nextSheet
            }
        )
    }

    private var profileEditDeleteConfirmationLayer: some View {
        ZStack {
            Color.black
                .opacity(BottomSheetShellMetrics.overlayOpacity)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture {
                    guard !isDeletingProfileAccount else { return }
                    showsProfileEditDeleteConfirmation = false
                }

            VStack(spacing: 16) {
                Text("계속 하시겠습니까? 이 사용자의 모든 데이터가 완전히 삭제됩니다.")
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)

                if let profileDeletionErrorMessage {
                    Text(profileDeletionErrorMessage)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.destructive)
                        .multilineTextAlignment(.center)
                }

                HStack(spacing: 8) {
                    Button {
                        showsProfileEditDeleteConfirmation = false
                    } label: {
                        Text("아니오")
                            .font(TBFont.semibold(13))
                            .foregroundStyle(TBColor.textTertiary)
                            .frame(maxWidth: .infinity)
                            .frame(height: ActionOverlayCardMetrics.actionHeight)
                            .background(Color.clear)
                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                                    .stroke(TBColor.borderStrong, lineWidth: 1)
                            }
                    }
                    .buttonStyle(.plain)
                    .disabled(isDeletingProfileAccount)

                    Button(action: deleteProfileAccount) {
                        Text(isDeletingProfileAccount ? "삭제 중" : profileDeletionErrorMessage == nil ? "예" : "다시 시도")
                            .font(TBFont.semibold(13))
                            .foregroundStyle(TBColor.textInverse)
                            .frame(maxWidth: .infinity)
                            .frame(height: ActionOverlayCardMetrics.actionHeight)
                            .background(TBColor.destructive)
                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(isDeletingProfileAccount)
                }
            }
            .padding(ActionOverlayCardMetrics.stackPadding)
            .frame(maxWidth: ActionOverlayCardMetrics.cardMaxWidth)
            .background(TBColor.focus)
            .clipShape(RoundedRectangle(cornerRadius: ActionOverlayCardMetrics.cardRadius, style: .continuous))
            .shadow(color: Color.black.opacity(0.24), radius: 30, x: 0, y: 20)
            .padding(.horizontal, ActionOverlayCardMetrics.horizontalPadding)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func deleteProfileAccount() {
        guard !isDeletingProfileAccount else { return }
        isDeletingProfileAccount = true
        profileDeletionErrorMessage = nil

        Task {
            let result = await appModel.deleteCurrentAccount()
            isDeletingProfileAccount = false
            guard result.ok else {
                profileDeletionErrorMessage = result.message
                return
            }

            showsProfileEditDeleteConfirmation = false
            dismissActiveSheet()
        }
    }

    private func completeLinkedCurrentProfile() {
        activeSheet = .profileSummary
        profileLinkErrorMessage = nil
        Task {
            let result = await appModel.completeLinkedCurrentProfileAuthEntry()
            if !result.ok {
                profileLinkErrorMessage = result.message
            }
        }
    }

    @ViewBuilder
    private func stagedSheetView(for sheet: ActiveStagedSheet) -> some View {
        switch sheet {
        case .app(let appSheet):
            switch appSheet {
            case .profileSummary:
                ProfileSummarySheet(
                    onDismissRequest: dismissActiveSheet,
                    openProfileEdit: {
                        activeSheet = .profileEdit
                    },
                    openAuthEntry: { intent in
                        activeSheet = .authEntry(intent)
                    }
                )
            case .profileEdit:
                ProfileEditSheet(
                    showsDeleteConfirmation: $showsProfileEditDeleteConfirmation,
                    onBackToProfile: {
                        activeSheet = .profileSummary
                    },
                    onDismissRequest: dismissActiveSheet
                )
            case .menu:
                AppMenuSheet(
                    onDismissRequest: dismissActiveSheet,
                    openProfile: { activeSheet = .profileSummary },
                    openNotifications: {
                        hasUnreadNotifications = false
                        activeSheet = .notifications
                    },
                    startQuickRefinement: { activeSheet = .quickRefinement },
                    openSavedList: { navigate(.savedRestaurants) }
                )
            case .publicProfileActions(let profileID):
                PublicProfileActionsSheet(
                    profileID: profileID,
                    onDismissRequest: dismissActiveSheet,
                    usesNativeSheetChrome: false
                )
            case .notifications:
                NotificationsSheet(
                    onDismissRequest: dismissActiveSheet,
                    usesNativeSheetChrome: false
                )
            case .quickRefinement:
                QuickRefinementSheet(
                    onDismissRequest: dismissActiveSheet,
                    usesNativeSheetChrome: false,
                    onStartDining: startDiningFeedbackFromCenterButton
                )
            case .authEntry(let intent):
                AuthEntrySheet(
                    intent: intent,
                    usesNativeSheetChrome: false,
                    onDismissRequest: dismissActiveSheet,
                    onLinkedCurrentProfile: completeLinkedCurrentProfile
                )
            case .bookmark(let restaurant):
                RestaurantBookmarkNativeSheet(
                    restaurant: restaurant,
                    onDismissRequest: dismissBookmarkSheet,
                    usesNativeSheetChrome: false,
                    selectedCoverIconID: $bookmarkCoverIconID,
                    selectedCoverTasteID: $bookmarkCoverTasteID,
                    isCoverEditorOpen: $isBookmarkCoverEditorOpen,
                    hostsCoverEditorOverlay: false
                )
            case .globalSearch:
                EmptyView()
            }
        case .bookmark(let restaurant):
            RestaurantBookmarkNativeSheet(
                restaurant: restaurant,
                onDismissRequest: dismissBookmarkSheet,
                usesNativeSheetChrome: false,
                selectedCoverIconID: $bookmarkCoverIconID,
                selectedCoverTasteID: $bookmarkCoverTasteID,
                isCoverEditorOpen: $isBookmarkCoverEditorOpen,
                hostsCoverEditorOverlay: false
            )
        case .dishOptions(let item):
            DishActionSheet(
                item: item,
                editableEntry: diningEntry(for: item),
                onClose: dismissDishOptionsSheet,
                onShowDetail: {
                    openDishCommentsFromOptions(item)
                },
                onEdit: { entry in
                    openDiningFeedbackEditorFromOptions(entry)
                },
                onDelete: { entryId in
                    appModel.removeDiningEntry(id: entryId)
                    dismissDishOptionsSheet()
                }
            )
        case .infoSuggestion(let restaurantName, let infoRows):
            RestaurantInfoSuggestionNativeSheet(
                restaurantName: restaurantName,
                infoRows: infoRows,
                onDismissRequest: dismissInfoSuggestionSheet,
                usesNativeSheetChrome: false
            )
        case .menuSuggestion(let restaurantName):
            RestaurantMenuSuggestionNativeSheet(
                restaurantName: restaurantName,
                onDismissRequest: dismissMenuSuggestionSheet,
                usesNativeSheetChrome: false
            )
        }
    }

    private func dismissActiveSheet() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeSheet = nil
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            isBookmarkCoverEditorOpen = false
            showsProfileEditDeleteConfirmation = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func dismissBookmarkSheet() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            isBookmarkCoverEditorOpen = false
            showsProfileEditDeleteConfirmation = false
            if case .some(.bookmark(_)) = activeSheet {
                activeSheet = nil
            }
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func dismissStagedSheetFromDrag() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            stagedSheetDragTranslation = stagedSheetHeight
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            isBookmarkCoverEditorOpen = false
            showsProfileEditDeleteConfirmation = false
            if case .some(.bookmark(_)) = activeSheet {
                activeSheet = nil
            } else if activeStagedSheet != nil {
                activeSheet = nil
            }
            isDraggingStagedSheet = false
        }

        DispatchQueue.main.asyncAfter(
            deadline: .now() + TasteBloomMotion.duration(.sheet, reduceMotion: reduceMotion)
        ) {
            guard activeStagedSheet == nil else {
                return
            }

            stagedSheetDragTranslation = 0
        }
    }

    private func navigate(_ route: AppRoute) {
        let isDismissingSheet = activeSheet != nil
            || activeBookmarkSheetRestaurant != nil
            || activeDishOptionsItem != nil
            || activeInfoSuggestionSheet != nil
            || activeMenuSuggestionSheetRestaurantName != nil
        activeSheet = nil
        activeBookmarkSheetRestaurant = nil
        activeDishOptionsItem = nil
        activeInfoSuggestionSheet = nil
        activeMenuSuggestionSheetRestaurantName = nil
        isBookmarkCoverEditorOpen = false
        stagedSheetDragTranslation = 0
        isDraggingStagedSheet = false

        guard isDismissingSheet else {
            routeStack.append(route)
            return
        }

        Task { @MainActor in
            try? await Task.sleep(for: .seconds(TasteBloomMotion.duration(.sheet, reduceMotion: reduceMotion)))
            routeStack.append(route)
        }
    }

    private func navigateImmediately(_ route: AppRoute) {
        routeStack.append(route)
    }

    private func popRoute() {
        var transaction = Transaction(animation: nil)
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            routeSwipeTranslation = 0
            _ = routeStack.popLast()
        }
    }

    private func presentBookmarkSheet(_ restaurant: RestaurantSummary) {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeBookmarkSheetRestaurant = restaurant
            activeDishOptionsItem = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            bookmarkCoverIconID = .utensils
            bookmarkCoverTasteID = .sweet
            isBookmarkCoverEditorOpen = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func startDiningFeedbackFromSearch(_: HomeSearchResultItem) {
        activeSheet = nil
        activeBookmarkSheetRestaurant = nil
        activeDishOptionsItem = nil
        activeInfoSuggestionSheet = nil
        activeMenuSuggestionSheetRestaurantName = nil
        isBookmarkCoverEditorOpen = false
        stagedSheetDragTranslation = 0
        isDraggingStagedSheet = false
        newDiningFeedbackStartMode = .menu
        showsDiningFeedbackTasteBloomTransition = false
        showsNewDiningFeedback = true
    }

    private func startDiningFeedbackFromCenterButton() {
        guard !showsNewDiningFeedback else {
            return
        }

        triggerDiningFeedbackLaunchHaptic()
        activeSheet = nil
        newDiningFeedbackStartMode = .cameraCapture
        diningFeedbackLaunchOrigin = measuredBottomTabCenterButtonOrigin
        showsDiningFeedbackTasteBloomTransition = true
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            showsNewDiningFeedback = true
        }
    }

    private func dismissNewDiningFeedbackAfterTransition() {
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            showsNewDiningFeedback = false
        }
    }

    private func triggerDiningFeedbackLaunchHaptic() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.prepare()
        generator.impactOccurred(intensity: 0.76)
    }

    private func presentDishOptionsSheet(_ item: DiningDishFeedbackItem) {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeDishOptionsItem = item
            activeBookmarkSheetRestaurant = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            activeSheet = nil
            isBookmarkCoverEditorOpen = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func presentInfoSuggestionSheet(restaurantName: String, infoRows: [RestaurantInfoRowModel]) {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeInfoSuggestionSheet = (restaurantName: restaurantName, infoRows: infoRows)
            activeMenuSuggestionSheetRestaurantName = nil
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeSheet = nil
            isBookmarkCoverEditorOpen = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func dismissDishOptionsSheet() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeDishOptionsItem = nil
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func presentMenuSuggestionSheet(restaurantName: String) {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeMenuSuggestionSheetRestaurantName = restaurantName
            activeInfoSuggestionSheet = nil
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeSheet = nil
            isBookmarkCoverEditorOpen = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func openDishCommentsFromOptions(_ item: DiningDishFeedbackItem) {
        dismissDishOptionsSheet()

        Task { @MainActor in
            try? await Task.sleep(for: .seconds(TasteBloomMotion.duration(.sheet, reduceMotion: reduceMotion)))
            navigateImmediately(.comments(id: item.id))
        }
    }

    private func openDiningFeedbackEditorFromOptions(_ entry: DiningEntry) {
        dismissDishOptionsSheet()

        Task { @MainActor in
            try? await Task.sleep(for: .seconds(TasteBloomMotion.duration(.sheet, reduceMotion: reduceMotion)))
            activeDiningFeedbackEditEntry = entry
        }
    }

    private func diningEntry(for item: DiningDishFeedbackItem) -> DiningEntry? {
        guard let id = UUID(uuidString: item.id) else {
            return nil
        }

        return appModel.diningEntries.first { $0.id == id }
    }

    private func dismissInfoSuggestionSheet() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeInfoSuggestionSheet = nil
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func dismissMenuSuggestionSheet() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            activeMenuSuggestionSheetRestaurantName = nil
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func triggerTopAppBarBloom() {
        topAppBarBloomToken += 1
    }

    @ViewBuilder
    private var currentTabView: some View {
        switch activeTab {
        case .home:
            HomeView(
                showsSearchTrigger: false,
                systemTopChrome: currentSystemMainTabTopChrome,
                onOpenSearch: {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        activeSheet = .globalSearch
                    }
                },
                onOpenRoute: navigate,
                onOpenBookmarkSheet: presentBookmarkSheet,
                onStartDiningFeedback: startDiningFeedbackFromSearch,
                onOpenJournal: { activeTab = .dining },
                onOpenTasteAnalysis: { activeTab = .analysis }
            )
        case .analysis:
            AnalysisView(
                systemTopChrome: currentSystemMainTabTopChrome,
                onStartMeasurement: {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        activeSheet = .quickRefinement
                    }
                },
                onOpenTasteChange: {
                    navigateImmediately(.tasteChange)
                }
            )
        case .dining:
            DiningView(
                contentState: diningContentState,
                systemTopChrome: currentSystemMainTabTopChrome,
                onOpenDishOptions: presentDishOptionsSheet
            )
        case .profile:
            ProfileView(
                systemTopChrome: currentSystemMainTabTopChrome,
                onOpenConnection: { kind in navigateImmediately(.connectionList(kind)) },
                onFindBuddy: {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        activeSheet = .globalSearch
                    }
                },
                onOpenProfileSettings: {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        activeSheet = .profileSummary
                    }
                },
                onOpenSavedList: { navigateImmediately(.savedRestaurants) }
            )
        }
    }
}

enum HomeSearchHeaderMetrics {
    static let horizontalPadding: CGFloat = TBSpacing.page
    static let topPadding: CGFloat = TBSpacing.pageTop
    static let bottomPadding: CGFloat = TBSpacing.x8
}

private struct HomeSearchHeader: View {
    var placeholder = "레스토랑, 메뉴, 셰프, 버디 검색"
    var accessibilityLabel = "레스토랑, 메뉴, 셰프, 버디 검색"
    var showsBackground = true
    let action: () -> Void

    var body: some View {
        HomeSearchCard(
            placeholder: placeholder,
            accessibilityLabel: accessibilityLabel,
            action: action
        )
            .padding(.horizontal, HomeSearchHeaderMetrics.horizontalPadding)
            .padding(.top, HomeSearchHeaderMetrics.topPadding)
            .padding(.bottom, HomeSearchHeaderMetrics.bottomPadding)
            .background {
                if showsBackground {
                    TBColor.page
                }
            }
    }
}

private struct AppRouteFocusContainer: View {
    @Environment(\.mainTabStatusBarHeight) private var statusBarHeight
    let route: AppRoute
    var insightTintProgress = 0.0
    var contentOffset: CGFloat = 0
    var bottomContentInset: CGFloat = 0
    var topAppBarBloomToken = 0
    let onBack: () -> Void
    let navigate: (AppRoute) -> Void
    let onOpenSearch: () -> Void
    let onOpenPublicProfileActions: (String) -> Void
    let onOpenBookmarkSheet: (RestaurantSummary) -> Void
    let onOpenInfoSuggestionSheet: (String, [RestaurantInfoRowModel]) -> Void
    let onOpenMenuSuggestionSheet: (String) -> Void

    var body: some View {
        Group {
            if route.usesCollapsingTopChrome {
                destination
            } else {
                VStack(spacing: 0) {
                    topChrome
                        .tbTopChromeBackground(fallback: routeBackground)

                    destination
                }
            }
        }
        .background {
            if case .homeInsight = route { routeBackground.ignoresSafeArea() }
        }
        .tbScreenTopChrome()
        .ignoresSafeArea(.container, edges: route.showsContentUnderBottomSafeArea ? .bottom : [])
        .accessibilityAction(.escape, onBack)
    }

    private var topChrome: some View {
        VStack(spacing: 0) {
            if statusBarHeight > 0 {
                Color.clear.frame(height: statusBarHeight)
            }

            TopAppBar(
                appearance: .transparent,
                title: topAppBarTitle,
                centerContentOffset: contentOffset,
                showBack: true,
                showsDefaultActions: showsDefaultActions,
                bloomToken: topAppBarBloomToken,
                rightActions: routeActions,
                onBack: onBack
            )

            if route.usesBuddySearchHeader {
                HomeSearchHeader(
                    placeholder: "버디 검색",
                    accessibilityLabel: "버디 검색",
                    showsBackground: false,
                    action: onOpenSearch
                )
                .offset(x: contentOffset)
            }
        }
    }

    private var destination: some View {
        AppRouteDestinationView(
            route: route,
            navigate: navigate,
            onBack: onBack,
            onOpenBookmarkSheet: onOpenBookmarkSheet,
            onOpenInfoSuggestionSheet: onOpenInfoSuggestionSheet,
            onOpenMenuSuggestionSheet: onOpenMenuSuggestionSheet,
            collapsingTopChrome: route.usesCollapsingTopChrome ? AnyView(topChrome) : nil,
            contentOffset: contentOffset,
            bottomContentInset: bottomContentInset
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(routeBackground)
        .offset(x: contentOffset)
    }

    private var topAppBarTitle: String? {
        isCommentsRoute ? nil : route.title
    }

    private var routeBackground: Color {
        if case .homeInsight(let kind) = route {
            return kind.backgroundColor(tintProgress: insightTintProgress)
        }
        return isCommentsRoute ? TBColor.focus : TBColor.page
    }

    private var showsDefaultActions: Bool {
        route.showsTopAppBarDefaultActions
    }

    private var isCommentsRoute: Bool {
        switch route {
        case .dishFeedback, .comments:
            return true
        default:
            return false
        }
    }

    private var routeActions: [TopAppBarAction] {
        switch route {
        case .restaurant, .restaurantSummary:
            return [
                TopAppBarAction(
                    id: "share",
                    symbol: "square.and.arrow.up",
                    accessibilityLabel: "공유",
                    action: {}
                ),
                TopAppBarAction(
                    id: "more",
                    symbol: "ellipsis",
                    accessibilityLabel: "더보기",
                    action: {}
                )
            ]
        case .publicProfile(let profileID):
            return [
                TopAppBarAction(
                    id: "more",
                    symbol: "ellipsis",
                    accessibilityLabel: "프로필 옵션 열기",
                    action: { onOpenPublicProfileActions(profileID) }
                )
            ]
        default:
            return []
        }
    }
}

private extension AppRoute {
    var usesCollapsingTopChrome: Bool {
        switch self {
        case .tasteChange, .savedRestaurants: true
        default: false
        }
    }

    var showsTopAppBarDefaultActions: Bool {
        switch self {
        case .dishFeedback, .comments, .savedRestaurants, .connectionList, .publicProfile, .homeInsight:
            return false
        default:
            return true
        }
    }

    var usesBuddySearchHeader: Bool {
        if case .connectionList = self {
            return true
        }

        return false
    }
}

private struct ProfileSummarySheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let onDismissRequest: (() -> Void)?
    let openProfileEdit: () -> Void
    let openAuthEntry: (BackendAuthEmailIntent) -> Void

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: close)),
            headerCenter: AnyView(
                Text("프로필")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Button(action: openProfileEdit) {
                        SectionCard(showsBorder: false) {
                            VStack(alignment: .leading, spacing: 20) {
                                HStack(spacing: 14) {
                                    ProfileAvatarDisplay(
                                        imageData: appModel.profileAvatarImageData,
                                        size: 64,
                                        shapeSeed: "current-user",
                                        profile: appModel.profile
                                    )
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(appModel.profileIdentity.displayName)
                                            .font(TBFont.bold(18))
                                            .foregroundStyle(TBColor.textPrimary)
                                        Text(appModel.profileIdentity.displayNickname)
                                            .font(TBFont.semibold(13))
                                            .foregroundStyle(TBColor.textHint)
                                    }
                                }

                                HStack {
                                    Text(profileSummaryLabel(identity: appModel.profileIdentity))
                                        .font(TBFont.semibold(12))
                                        .foregroundStyle(TBColor.textSecondary)
                                    Spacer()
                                    LucideIcon(
                                        .chevronRight,
                                        size: TBIcon.Size.small,
                                        strokeWidth: TBIcon.Stroke.regular
                                    )
                                    .foregroundStyle(TBColor.textSecondary)
                                }
                                .padding(12)
                                .background(TBColor.mutedSurface)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("프로필 편집")

                    SectionCard(showsBorder: false) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("계정 연결")
                                .font(TBFont.bold(14))
                                .foregroundStyle(TBColor.textPrimary)
                            Text("현재 계정을 이메일에 연결하면 식사 기록과 입맛 해석을 다음 기기에서도 이어서 볼 수 있어요.")
                                .font(TBFont.regular(12))
                                .foregroundStyle(TBColor.textSubtle)
                                .lineSpacing(4)

                            Button {
                                openAuthEntry(.linkCurrentProfile)
                            } label: {
                                HStack {
                                    Text("현재 계정을 이메일에 연결")
                                        .font(TBFont.semibold(12))
                                    Spacer()
                                    LucideIcon(
                                        .chevronRight,
                                        size: TBIcon.Size.small,
                                        strokeWidth: TBIcon.Stroke.regular
                                    )
                                }
                                .foregroundStyle(TBColor.textPrimary)
                                .padding(.horizontal, 12)
                                .frame(height: 44)
                                .background(TBColor.mutedSurface)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(TBSpacing.page)
                .padding(.bottom, 24)
            }
        }
    }

    private func profileSummaryLabel(identity: UserProfileIdentity) -> String {
        let hasContext = identity.birthDate != nil
            || identity.sexContext != nil
            || identity.smokingStatus != nil
        let infoLabel = hasContext ? "기준 정보 입력" : "기준 정보 미입력"
        let dietaryLabel = identity.dietaryRestrictions.isEmpty
            ? "식이제한 없음"
            : "식이제한 \(identity.dietaryRestrictions.count)개"
        return "\(infoLabel) · \(dietaryLabel)"
    }

    private func close() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private struct ProfileAvatarDisplay: View {
    let imageData: Data?
    let size: CGFloat
    let shapeSeed: String
    var profile: TasteProfile? = nil

    var body: some View {
        let image = imageData.flatMap(UIImage.init(data:))
        PalateBloomAvatar(
            size: size,
            tasteProfile: profile,
            shapeSeed: shapeSeed,
            image: image
        )
    }
}

private struct ProfileEditSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @Binding var showsDeleteConfirmation: Bool
    let onBackToProfile: () -> Void
    let onDismissRequest: (() -> Void)?

    @State private var draftIdentity = UserProfileIdentity.default
    @State private var draftAvatarImageData: Data?
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var activePicker: ProfileEditPicker?
    @State private var birthDateSelection = Date()
    @State private var isPreparingAvatar = false
    @State private var isSavingProfile = false
    @State private var statusMessage: String?

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(
                BottomSheetIconButton(
                    ariaLabel: "프로필로 돌아가기",
                    icon: .chevronLeft,
                    action: onBackToProfile
                )
            ),
            headerCenter: AnyView(
                Text("프로필 편집")
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            headerEnd: AnyView(BottomSheetCloseButton(action: close)),
            footer: AnyView(footer),
            floatingLayer: floatingLayer,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    avatarSection
                    informationSection
                }
                .padding(.horizontal, TBSpacing.page)
                .padding(.top, 8)
                .padding(.bottom, 12)
            }
        }
        .onAppear(perform: resetDrafts)
        .onChange(of: selectedPhotoItem) { _, item in
            Task {
                await loadSelectedPhoto(item)
            }
        }
    }

    private var avatarSection: some View {
        VStack(alignment: .center, spacing: 12) {
            ProfileAvatarDisplay(
                imageData: draftAvatarImageData,
                size: 96,
                shapeSeed: "current-user",
                profile: appModel.profile
            )

            HStack(spacing: 12) {
                PhotosPicker(
                    selection: $selectedPhotoItem,
                    matching: .images
                ) {
                    HStack(spacing: 8) {
                        LucideIcon(
                            .camera,
                            size: TBIcon.Size.small,
                            strokeWidth: TBIcon.Stroke.medium
                        )
                        Text(isPreparingAvatar ? "사진 준비 중" : "사진 편집")
                            .font(TBFont.semibold(12))
                    }
                    .foregroundStyle(isPreparingAvatar ? TBColor.textDisabled : TBColor.textPrimary)
                    .padding(.horizontal, 12)
                    .frame(height: 40)
                    .background(isPreparingAvatar ? TBColor.disabledSurface : TBColor.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(isPreparingAvatar)

                if draftAvatarImageData != nil {
                    Button("삭제") {
                        draftAvatarImageData = nil
                        statusMessage = "프로필 사진을 삭제하려면 저장을 눌러 주세요."
                    }
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textFaint)
                    .buttonStyle(.plain)
                }
            }

            Button {
                draftAvatarImageData = nil
                statusMessage = "저장을 누르면 기본 아바타로 변경됩니다."
            } label: {
                Text("기본 아바타로 변경")
                    .font(TBFont.semibold(12))
                    .foregroundStyle(isPreparingAvatar ? TBColor.textDisabled : TBColor.textFaint)
            }
            .buttonStyle(.plain)
            .disabled(isPreparingAvatar)

            if let statusMessage {
                Text(statusMessage)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textMuted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var informationSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            ProfileEditTextField(
                label: "이름",
                placeholder: "이름을 입력해 주세요",
                text: $draftIdentity.displayName
            )

            ProfileEditTextField(
                label: "버디네임",
                placeholder: "Taste Buddy에서 사용할 이름",
                helperText: "친구가 나를 찾는 고유 버디네임입니다.",
                text: $draftIdentity.nickname
            )

            ProfileEditSelectField(
                label: "생년월일",
                value: ProfileEditCopy.birthDateLabel(draftIdentity.birthDate)
            ) {
                birthDateSelection = ProfileEditCopy.date(from: draftIdentity.birthDate)
                activePicker = .birthDate
            }

            ProfileEditSelectField(
                label: "성별",
                value: ProfileEditCopy.optionLabel(
                    draftIdentity.sexContext,
                    options: ProfileEditCopy.sexOptions
                )
            ) {
                activePicker = .sexContext
            }

            ProfileEditSelectField(
                label: "흡연유무",
                value: ProfileEditCopy.optionLabel(
                    draftIdentity.smokingStatus,
                    options: ProfileEditCopy.smokingOptions
                )
            ) {
                activePicker = .smokingStatus
            }

            ProfileEditSelectField(
                label: "식이제한",
                value: ProfileEditCopy.dietarySummary(draftIdentity.dietaryRestrictions)
            ) {
                activePicker = .dietaryRestrictions
            }
        }
    }

    private var footer: some View {
        VStack(spacing: 8) {
            ProfileEditFooterButton(
                title: "내 계정 삭제하기",
                tone: .destructive,
                isEnabled: !isPreparingAvatar && !isSavingProfile
            ) {
                showsDeleteConfirmation = true
            }

            ProfileEditFooterButton(
                title: profileSaveButtonTitle,
                tone: .primary,
                isEnabled: !isPreparingAvatar && !isSavingProfile
            ) {
                saveProfileEdit()
            }
        }
    }

    private var profileSaveButtonTitle: String {
        if isPreparingAvatar {
            return "사진 준비 중"
        }

        if isSavingProfile {
            return "공개 프로필 저장 중"
        }

        return "저장"
    }

    private var floatingLayer: AnyView? {
        if let activePicker {
            return AnyView(
                ProfileEditPickerOverlay(
                    activePicker: activePicker,
                    identity: $draftIdentity,
                    birthDateSelection: $birthDateSelection,
                    onClose: {
                        self.activePicker = nil
                    }
                )
            )
        }

        return nil
    }

    private func resetDrafts() {
        draftIdentity = appModel.profileIdentity
        draftAvatarImageData = appModel.profileAvatarImageData
        birthDateSelection = ProfileEditCopy.date(from: appModel.profileIdentity.birthDate)
        statusMessage = nil
        selectedPhotoItem = nil
        activePicker = nil
        showsDeleteConfirmation = false
        isSavingProfile = false
    }

    private func saveProfileEdit() {
        guard !isSavingProfile else {
            return
        }

        appModel.saveProfileIdentity(draftIdentity)
        appModel.saveProfileAvatarImageData(draftAvatarImageData)

        guard appModel.backendSessionStatus == .authenticated else {
            statusMessage = nil
            onBackToProfile()
            return
        }

        isSavingProfile = true
        statusMessage = "공개 프로필에 반영하고 있어요."

        Task { @MainActor in
            let result = await appModel.publishCurrentProfileIdentity()
            isSavingProfile = false

            guard result.ok else {
                statusMessage = result.message
                return
            }

            statusMessage = nil
            onBackToProfile()
        }
    }

    private func loadSelectedPhoto(_ item: PhotosPickerItem?) async {
        guard let item else {
            return
        }

        isPreparingAvatar = true
        defer {
            isPreparingAvatar = false
            selectedPhotoItem = nil
        }

        do {
            guard let data = try await item.loadTransferable(type: Data.self),
                  UIImage(data: data) != nil else {
                statusMessage = "프로필 사진을 준비하지 못했습니다. 다른 이미지를 선택해 주세요."
                return
            }

            draftAvatarImageData = data
            statusMessage = "저장을 누르면 새 프로필 사진이 적용됩니다."
        } catch {
            statusMessage = "프로필 사진을 준비하지 못했습니다. 다른 이미지를 선택해 주세요."
        }
    }

    private func close() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private enum ProfileEditPicker {
    case birthDate
    case sexContext
    case smokingStatus
    case dietaryRestrictions

    var title: String {
        switch self {
        case .birthDate:
            "생년월일"
        case .sexContext:
            "성별"
        case .smokingStatus:
            "흡연유무"
        case .dietaryRestrictions:
            "식이제한"
        }
    }
}

private struct ProfileEditOption: Identifiable, Equatable {
    let id: String
    let label: String
}

private enum ProfileEditCopy {
    static let sexOptions: [ProfileEditOption] = [
        ProfileEditOption(id: "female", label: "여성"),
        ProfileEditOption(id: "male", label: "남성"),
        ProfileEditOption(id: "other_or_not_listed", label: "기타 / 직접 응답하지 않음"),
        ProfileEditOption(id: "prefer_not_to_say", label: "답변하지 않음")
    ]

    static let smokingOptions: [ProfileEditOption] = [
        ProfileEditOption(id: "never", label: "비흡연"),
        ProfileEditOption(id: "former", label: "과거 흡연"),
        ProfileEditOption(id: "current", label: "현재 흡연"),
        ProfileEditOption(id: "prefer_not_to_say", label: "답변하지 않음")
    ]

    static let dietaryNoneOptionID = "dietary-restrictions-none"
    static let dietaryOptions: [ProfileEditOption] = [
        ProfileEditOption(id: dietaryNoneOptionID, label: "없어요"),
        ProfileEditOption(id: "vegetarian-forward", label: "채식 위주"),
        ProfileEditOption(id: "vegan", label: "비건"),
        ProfileEditOption(id: "pescatarian", label: "페스코"),
        ProfileEditOption(id: "no-pork", label: "돼지고기 제외"),
        ProfileEditOption(id: "no-beef", label: "소고기 제외"),
        ProfileEditOption(id: "gluten-conscious", label: "글루텐 프리 지향"),
        ProfileEditOption(id: "halal-oriented", label: "할랄 지향")
    ]

    static func optionLabel(_ value: String?, options: [ProfileEditOption]) -> String {
        guard let value else {
            return "선택해 주세요"
        }

        return options.first { $0.id == value }?.label ?? "선택해 주세요"
    }

    static func dietarySummary(_ values: [String]) -> String {
        guard !values.isEmpty else {
            return "식이제한 없음"
        }

        let labels = values.compactMap { value in
            dietaryOptions.first { $0.id == value }?.label
        }

        guard !labels.isEmpty else {
            return "식이제한 없음"
        }

        if labels.count == 1 {
            return labels[0]
        }

        return "\(labels[0]) 외 \(labels.count - 1)"
    }

    static func birthDateLabel(_ value: String?) -> String {
        guard let value,
              let components = dateComponents(from: value) else {
            return "선택해 주세요"
        }

        return "\(components.year)년 \(components.month)월 \(components.day)일"
    }

    static func date(from value: String?) -> Date {
        guard let value,
              let components = dateComponents(from: value),
              let date = Calendar.current.date(
                from: DateComponents(
                    year: components.year,
                    month: components.month,
                    day: components.day
                )
              ) else {
            return Calendar.current.date(
                from: DateComponents(year: 1995, month: 1, day: 1)
            ) ?? Date()
        }

        return date
    }

    static func birthDateString(from date: Date) -> String {
        let components = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(
            format: "%04d-%02d-%02d",
            components.year ?? 1995,
            components.month ?? 1,
            components.day ?? 1
        )
    }

    private static func dateComponents(from value: String) -> (year: Int, month: Int, day: Int)? {
        let parts = value.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else {
            return nil
        }

        return (parts[0], parts[1], parts[2])
    }
}

private struct ProfileEditTextField: View {
    let label: String
    let placeholder: String
    var helperText: String?
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textMuted)

            TextField(placeholder, text: $text)
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textPrimary)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .frame(height: 48)
                .padding(.horizontal, 12)
                .background(TBColor.surface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                        .stroke(TBColor.border, lineWidth: 1)
                }

            if let helperText {
                Text(helperText)
                    .font(TBFont.regular(11))
                    .foregroundStyle(TBColor.textFaint)
                    .lineSpacing(3)
            }
        }
    }
}

private struct ProfileEditSelectField: View {
    let label: String
    let value: String
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textMuted)

            Button(action: action) {
                HStack(spacing: 12) {
                    Text(value)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(
                            value == "선택해 주세요" ? TBColor.textHint : TBColor.textPrimary
                        )
                        .lineLimit(1)

                    Spacer()

                    LucideIcon(
                        .chevronDown,
                        size: TBIcon.Size.small,
                        strokeWidth: TBIcon.Stroke.strong
                    )
                    .foregroundStyle(TBColor.iconPrimary)
                }
                .frame(height: 48)
                .padding(.horizontal, 12)
                .background(TBColor.surface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                        .stroke(TBColor.border, lineWidth: 1)
                }
            }
            .buttonStyle(.plain)
        }
    }
}

private enum ProfileEditFooterButtonTone {
    case primary
    case destructive
}

private struct ProfileEditFooterButton: View {
    let title: String
    let tone: ProfileEditFooterButtonTone
    var isEnabled = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.bold(14))
                .foregroundStyle(foreground)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(background)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
        }
        .buttonStyle(TBTokenButtonStyle())
        .disabled(!isEnabled)
    }

    private var foreground: Color {
        guard isEnabled else {
            return TBColor.textDisabled
        }

        switch tone {
        case .primary:
            return TBColor.textInverse
        case .destructive:
            return TBColor.textInverse
        }
    }

    private var background: Color {
        guard isEnabled else {
            return TBColor.disabledSurface
        }

        switch tone {
        case .primary:
            return TBColor.textPrimary
        case .destructive:
            return TBColor.destructive
        }
    }
}

private struct ProfileEditPickerOverlay: View {
    let activePicker: ProfileEditPicker
    @Binding var identity: UserProfileIdentity
    @Binding var birthDateSelection: Date
    let onClose: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black
                .opacity(0.45)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture(perform: onClose)

            VStack(spacing: 0) {
                HStack {
                    Spacer()
                    Text(activePicker.title)
                        .font(TBFont.bold(16))
                        .foregroundStyle(TBColor.textPrimary)
                    Spacer()
                    Button(action: onClose) {
                        LucideIcon(
                            .x,
                            size: TBIcon.Size.medium,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        .frame(width: 36, height: 36)
                        .foregroundStyle(TBColor.iconPrimary)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.bottom, 12)

                pickerContent
            }
            .padding(20)
            .background(TBColor.focus)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: Color.black.opacity(0.20), radius: 28, x: 0, y: 16)
            .padding(.horizontal, TBSpacing.page)
            .padding(.bottom, TBSpacing.page)
        }
    }

    @ViewBuilder
    private var pickerContent: some View {
        switch activePicker {
        case .birthDate:
            VStack(spacing: 16) {
                DatePicker(
                    "생년월일",
                    selection: $birthDateSelection,
                    in: dateRange,
                    displayedComponents: .date
                )
                .datePickerStyle(.wheel)
                .labelsHidden()

                PrimaryButton(title: "적용") {
                    identity.birthDate = ProfileEditCopy.birthDateString(from: birthDateSelection)
                    onClose()
                }
            }

        case .sexContext:
            radioOptions(
                options: ProfileEditCopy.sexOptions,
                selectedValue: identity.sexContext,
                onSelect: { selectedValue in
                    identity.sexContext = selectedValue
                }
            )

        case .smokingStatus:
            radioOptions(
                options: ProfileEditCopy.smokingOptions,
                selectedValue: identity.smokingStatus,
                onSelect: { selectedValue in
                    identity.smokingStatus = selectedValue
                }
            )

        case .dietaryRestrictions:
            VStack(spacing: 12) {
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(ProfileEditCopy.dietaryOptions) { option in
                            let isNoneOption = option.id == ProfileEditCopy.dietaryNoneOptionID
                            let isSelected = isNoneOption
                                ? identity.dietaryRestrictions.isEmpty
                                : identity.dietaryRestrictions.contains(option.id)

                            TBSelectionCard(
                                title: option.label,
                                indicator: .checkbox,
                                isSelected: isSelected,
                                singleLine: true
                            ) {
                                toggleDietaryOption(option.id)
                            }
                        }
                    }
                }
                .frame(maxHeight: 320)

                PrimaryButton(title: "선택 완료") {
                    onClose()
                }
            }
        }
    }

    private var dateRange: ClosedRange<Date> {
        let calendar = Calendar.current
        let start = calendar.date(from: DateComponents(year: 1940, month: 1, day: 1)) ?? Date()
        let end = calendar.date(byAdding: .year, value: -12, to: Date()) ?? Date()
        return start...end
    }

    private func radioOptions(
        options: [ProfileEditOption],
        selectedValue: String?,
        onSelect: @escaping (String?) -> Void
    ) -> some View {
        VStack(spacing: 8) {
            ForEach(options) { option in
                let isSelected = selectedValue == option.id
                TBSelectionCard(
                    title: option.label,
                    indicator: .radio,
                    isSelected: isSelected,
                    singleLine: true
                ) {
                    onSelect(isSelected ? nil : option.id)
                }
            }
        }
    }

    private func toggleDietaryOption(_ optionID: String) {
        if optionID == ProfileEditCopy.dietaryNoneOptionID {
            identity.dietaryRestrictions = []
            return
        }

        if identity.dietaryRestrictions.contains(optionID) {
            identity.dietaryRestrictions.removeAll { $0 == optionID }
        } else {
            identity.dietaryRestrictions.append(optionID)
        }
    }
}

private struct NotificationsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appModel: AppModel
    @State private var showsDiningFeedback = false
    @State private var hasUnread = true
    var onDismissRequest: (() -> Void)? = nil
    var usesNativeSheetChrome = true

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: closeSheet)),
            headerCenter: AnyView(
                HStack(spacing: 7) {
                    Text("알림")
                        .font(TBFont.bold(15))
                        .foregroundStyle(TBColor.textPrimary)
                    if hasUnread {
                        Text("2")
                            .font(TBFont.bold(10))
                            .foregroundStyle(TBColor.textInverse)
                            .frame(minWidth: 16, minHeight: 16)
                            .background(TBColor.textPrimary)
                            .clipShape(Capsule())
                    }
                }
            ),
            headerEnd: AnyView(
                Group {
                    if hasUnread {
                        Button {
                            hasUnread = false
                        } label: {
                            Text("모두 읽기")
                                .font(TBFont.semibold(11))
                                .lineLimit(1)
                                .fixedSize(horizontal: true, vertical: false)
                        }
                        .foregroundStyle(TBColor.textMuted)
                    }
                }
            ),
            usesNativeSheetChrome: usesNativeSheetChrome,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(spacing: 8) {
                    Button {
                        hasUnread = false
                        showsDiningFeedback = true
                    } label: {
                        NotificationCompactRow(
                            symbol: "fork.knife",
                            title: "식후 피드백을 남길 시간이에요",
                            detail: "방금의 감각을 남기면 다음 식사가 더 잘 맞아집니다.",
                            time: "방금",
                            tone: .sweet,
                            showsUnread: hasUnread
                        )
                    }
                    .buttonStyle(.plain)

                    Button {
                        hasUnread = false
                    } label: {
                        NotificationCompactRow(
                            symbol: "sparkles",
                            title: "입맛 기록을 다시 정리했어요",
                            detail: appModel.sensoryAnalysis.sourceExperienceCount > 0
                                ? "분명한 근거 기록 \(appModel.sensoryAnalysis.sourceExperienceCount)개의 감각과 직접 평가를 반영했어요."
                                : "완료한 식사 피드백부터 현재 해석에 반영해요.",
                            time: "현재",
                            tone: .umami,
                            showsUnread: hasUnread
                        )
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, TBSpacing.page)
                .padding(.top, TBSpacing.pageTop)
                .padding(.bottom, TBSpacing.page + 24)
            }
        }
        .presentationDragIndicator(.hidden)
        .presentationBackground(Color.clear)
        .presentationCornerRadius(0)
        .prefersUISheetGrabberVisible(false)
        .fullScreenCover(isPresented: $showsDiningFeedback) {
            DiningFeedbackSheet { entry in
                appModel.addDiningEntry(entry)
            }
        }
    }

    private func closeSheet() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private struct QuickRefinementSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    var onDismissRequest: (() -> Void)? = nil
    var usesNativeSheetChrome = true
    let onStartDining: () -> Void

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: closeSheet)),
            headerCenter: AnyView(
                Text("입맛 해석")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(
                PrimaryButton(title: "새 식사 기록하기", action: onStartDining)
            ),
            usesNativeSheetChrome: usesNativeSheetChrome
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    TBFlowHeaderBlock(
                        title: refinementTitle,
                        description: refinementDescription,
                        topLeft: "현재 기록",
                        topRightSlot: AnyView(
                            StatusChip(
                                title: refinementStatus,
                                backgroundColor: TBColor.mutedSurface,
                                foregroundColor: TBColor.textSecondary
                            )
                        )
                    )

                    SectionCard {
                        VStack(alignment: .leading, spacing: TBSpacing.x12) {
                            MenuActionRowContent(
                                icon: "fork.knife",
                                title: "분명한 근거 기록",
                                detail: "감각이나 직접 평가가 있는 기록 \(appModel.sensoryAnalysis.sourceExperienceCount)개"
                            )
                            Divider()
                            MenuActionRowContent(
                                icon: "sparkles",
                                title: "현재 인사이트",
                                detail: "직접 평가에서 확인한 해석 \(appModel.sensoryAnalysis.insights.count)개"
                            )
                            if !appModel.sensoryAnalysis.unresolved.isEmpty {
                                Divider()
                                MenuActionRowContent(
                                    icon: "circle-help",
                                    title: "뜻을 확인 중인 기록",
                                    detail: "기록 \(appModel.sensoryAnalysis.unresolvedExperienceCount)개 · 원문 표현 \(appModel.sensoryAnalysis.unresolved.count)개"
                                )
                            }
                            Divider()
                            Text("새 식사 피드백을 완료하면 기존 원문은 유지한 채 현재 해석을 다시 계산해요.")
                                .font(TBFont.regular(12))
                                .foregroundStyle(TBColor.textSubtle)
                                .lineSpacing(4)
                        }
                    }
                }
                .padding(TBSpacing.page)
                .padding(.bottom, 24)
            }
        }
        .presentationDragIndicator(.hidden)
        .presentationBackground(Color.clear)
        .presentationCornerRadius(0)
        .prefersUISheetGrabberVisible(false)
    }

    private var refinementTitle: String {
        if appModel.sensoryAnalysisIsUpdating { return "식사 기록을 다시 읽고 있어요" }
        if appModel.sensoryAnalysisError != nil { return "현재 해석을 불러오지 못했어요" }
        return appModel.sensoryAnalysis.mainWing.label
    }

    private var refinementDescription: String {
        if let error=appModel.sensoryAnalysisError { return error }
        if appModel.sensoryAnalysis.sourceExperienceCount == 0 {
            return "완료한 식사 피드백부터 감각과 직접 평가를 차근차근 모아요."
        }
        return "완료한 식사의 감각과 직접 평가만 사용하며, 미확정 표현은 원문으로 남겨둬요."
    }

    private var refinementStatus: String {
        if appModel.sensoryAnalysisIsUpdating { return "분석 중" }
        if appModel.sensoryAnalysisError != nil { return "불러오기 보류" }
        return "기록 \(appModel.sensoryAnalysis.sourceExperienceCount)개"
    }

    private func closeSheet() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private let appMenuSheetCardCornerRadius: CGFloat = 20

private struct PublicProfileActionsSheet: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dismiss) private var dismiss
    @StateObject private var copyToast = TBToastPresenter()
    let profileID: String
    var onDismissRequest: (() -> Void)? = nil
    var usesNativeSheetChrome = true

    private var profileName: String {
        AppRoute.publicProfile(id: profileID).title
    }

    private var profileURLString: String {
        let encodedID = profileID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? profileID
        return "https://tastebuddy.app/profile/\(encodedID)"
    }

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: close)),
            headerCenter: AnyView(
                Text("프로필 옵션")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(closeFooter),
            usesNativeSheetChrome: usesNativeSheetChrome,
            surfaceBackground: TBColor.page
        ) {
            ZStack(alignment: .bottom) {
                BottomSheetScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        profileContextCard

                        PublicProfileActionSection(title: "안전 관리") {
                            Button(action: {}) {
                                MenuActionRowContent(
                                    icon: "shield.checkered",
                                    title: "신고",
                                    detail: "부적절한 소개나 활동을 안전 팀에 알립니다.",
                                    destructive: true,
                                    showsChevron: false
                                )
                            }
                            .buttonStyle(.plain)

                            Button(action: {}) {
                                MenuActionRowContent(
                                    icon: "eye-off",
                                    title: "제한",
                                    detail: "추천과 피드에서 이 프로필 노출을 줄입니다.",
                                    showsChevron: false
                                )
                            }
                            .buttonStyle(.plain)

                            Button(action: {}) {
                                MenuActionRowContent(
                                    icon: "user-lock",
                                    title: "차단",
                                    detail: "서로의 프로필과 활동 노출을 숨깁니다.",
                                    showsChevron: false
                                )
                            }
                            .buttonStyle(.plain)
                        }

                        PublicProfileActionSection(title: "공유") {
                            Button(action: copyProfileURL) {
                                MenuActionRowContent(
                                    icon: "link",
                                    title: "프로필 URL 복사",
                                    detail: "공개 프로필 링크를 클립보드에 복사합니다.",
                                    showsChevron: false
                                )
                            }
                            .buttonStyle(.plain)

                            ShareLink(item: profileURLString) {
                                MenuActionRowContent(
                                    icon: "square.and.arrow.up",
                                    title: "이 프로필 공유하기",
                                    detail: "친구에게 Taste Buddy 프로필을 보냅니다.",
                                    showsChevron: false
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.bottom, TBSpacing.page + 24)
                }

                if copyToast.isPresented {
                    ToastSurface(
                        title: "프로필 URL을 복사했어요",
                        message: "원하는 곳에 붙여넣어 공유할 수 있어요.",
                        icon: .copy,
                        tone: .success
                    )
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.bottom, 12)
                    .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
                    .zIndex(1)
                }
            }
        }
        .onDisappear { copyToast.cancel() }
        .animation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion), value: copyToast.isPresented)
        .presentationDragIndicator(.hidden)
        .presentationBackground(Color.clear)
        .presentationCornerRadius(0)
        .prefersUISheetGrabberVisible(false)
    }

    private var profileContextCard: some View {
        SectionCard(showsBorder: false) {
            HStack(spacing: 12) {
                TokenBox(
                    size: .medium,
                    background: TBColor.mutedSurface,
                    foreground: TBColor.iconPrimary
                ) {
                    LucideIcon(
                        .user,
                        size: TBIcon.Size.medium,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(profileName)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(TBColor.textPrimary)
                    Text("이 프로필의 노출, 안전 조치, 공유 링크를 관리합니다.")
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineSpacing(3)
                }

                Spacer(minLength: 0)
            }
        }
    }

    private var closeFooter: some View {
        PrimaryButton(title: "닫기") {
            close()
        }
    }

    private func copyProfileURL() {
        UIPasteboard.general.string = profileURLString

        withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion)) {
            copyToast.present(policy: .copyConfirmation)
        }
    }

    private func close() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private struct PublicProfileActionSection<Content: View>: View {
    let title: String
    let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(TBFont.semibold(11))
                .tracking(0.14)
                .foregroundStyle(TBColor.textFaint)

            VStack(spacing: 4) {
                content
            }
        }
    }
}

private struct AppMenuSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var isLoggingOut = false
    @State private var isSyncingAccountData = false
    @State private var showsAccountConflictResolution = false
    @State private var logoutErrorMessage: String?
    let onDismissRequest: (() -> Void)?
    let openProfile: () -> Void
    let openNotifications: () -> Void
    let startQuickRefinement: () -> Void
    let openSavedList: () -> Void

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: close)),
            headerCenter: AnyView(
                Text("메뉴")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(logoutFooter),
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Button(action: openProfile) {
                        HStack(spacing: 12) {
                            PalateBloomAvatar(
                                size: 40,
                                tasteProfile: appModel.profile,
                                shapeSeed: "current-user",
                                image: appModel.profileAvatarImageData.flatMap(UIImage.init(data:))
                            )
                            VStack(alignment: .leading, spacing: 3) {
                                Text(appModel.profileIdentity.displayName)
                                    .font(TBFont.semibold(14))
                                    .foregroundStyle(TBColor.textPrimary)
                                Text("프로필 보관 전")
                                    .font(TBFont.regular(11))
                                    .foregroundStyle(TBColor.textMuted)
                            }
                            Spacer()
                            LucideIcon(
                                .mail,
                                size: TBIcon.Size.base,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                                .foregroundStyle(TBColor.textHint)
                        }
                        .padding(12)
                        .background(TBColor.surface)
                        .clipShape(
                            RoundedRectangle(
                                cornerRadius: appMenuSheetCardCornerRadius,
                                style: .continuous
                            )
                        )
                    }
                    .buttonStyle(.plain)

                    MenuSection(
                        title: "내 다이닝",
                        rows: [
                            MenuRowModel(
                                symbol: "bookmark",
                                title: "테이스트 리스트",
                                detail: "저장한 레스토랑 후보",
                                action: openSavedList
                            ),
                        ]
                    )

                    MenuSection(
                        title: "미각 관리",
                        rows: [
                            MenuRowModel(
                                symbol: "sparkles",
                                title: "입맛 기록 현황",
                                detail: "완료한 식사 근거와 현재 해석",
                                action: startQuickRefinement
                            ),
                            MenuRowModel(
                                symbol: "bell",
                                title: "식후 기록 알림",
                                detail: "식사 후 감각 기록 알림",
                                action: openNotifications
                            ),
                        ]
                    )

                    if let message = appModel.accountDataSyncError {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(message)
                                .font(TBFont.regular(12))
                                .foregroundStyle(TBColor.textSecondary)
                                .fixedSize(horizontal: false, vertical: true)
                            if appModel.accountDataHasConflict {
                                Button("사용할 기록 선택") { showsAccountConflictResolution = true }
                                    .font(TBFont.semibold(13))
                                    .foregroundStyle(TBColor.textPrimary)
                                    .frame(minHeight: 44)
                                    .disabled(isSyncingAccountData || isLoggingOut)
                                    .confirmationDialog("어떤 기록을 사용할까요?", isPresented: $showsAccountConflictResolution, titleVisibility: .visible) {
                                        Button("이 기기의 기록 사용") { resolveAccountConflict(.thisDevice) }
                                        Button("계정에 보관한 기록 사용") { resolveAccountConflict(.accountBackup) }
                                        Button("취소", role: .cancel) {}
                                    } message: {
                                        Text("선택한 기록으로 이 기기와 계정 백업을 맞춥니다. 두 원본은 이 기기에 별도로 보관합니다.")
                                    }
                            } else {
                                Button(isSyncingAccountData ? "기록 확인 중" : "기록 다시 동기화") {
                                    isSyncingAccountData = true
                                    Task {
                                        await appModel.syncAccountData()
                                        isSyncingAccountData = false
                                    }
                                }
                                .font(TBFont.semibold(13))
                                .foregroundStyle(TBColor.textPrimary)
                                .frame(minHeight: 44)
                                .disabled(isSyncingAccountData || isLoggingOut)
                            }
                        }
                    }

                    MenuSection(
                        title: "앱 정보",
                        rows: [
                            MenuRowModel(
                                symbol: "circle-help",
                                title: "도움말",
                                detail: "Taste Buddy 사용 가이드",
                                action: {}
                            ),
                            MenuRowModel(
                                symbol: "info",
                                title: "앱 정보",
                                detail: "Taste Buddy v1.0.0",
                                action: {}
                            ),
                        ]
                    )
                }
                .padding(.horizontal, TBSpacing.page)
                .padding(.bottom, TBSpacing.page + 24)
            }
        }
    }

    private func resolveAccountConflict(_ resolution: NativeAccountConflictResolution) {
        isSyncingAccountData = true
        Task {
            await appModel.resolveAccountDataConflict(using: resolution)
            isSyncingAccountData = false
        }
    }

    private var logoutFooter: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(TBColor.border)
                .frame(height: 1)
                .accessibilityHidden(true)

            if let logoutErrorMessage {
                Text(logoutErrorMessage)
                    .font(TBFont.regular(11))
                    .foregroundStyle(TBColor.destructive)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.top, 10)
            }

            logoutButton
        }
    }

    private var logoutButton: some View {
        Button(role: .destructive) {
            guard !isLoggingOut else {
                return
            }

            isLoggingOut = true
            logoutErrorMessage = nil

            Task {
                let result = await appModel.logout()

                guard result.ok else {
                    logoutErrorMessage = result.message
                    isLoggingOut = false
                    return
                }

                close()
            }
        } label: {
            HStack(spacing: 12) {
                if isLoggingOut {
                    ProgressView()
                        .controlSize(.small)
                        .tint(TBColor.textHint)
                } else {
                    LucideIcon(
                        .logOut,
                        size: TBIcon.Size.base,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                }
                Text(isLoggingOut ? "로그아웃 중" : "로그아웃")
                    .font(TBFont.medium(13))
            }
            .foregroundStyle(TBColor.textHint)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(height: 56)
        }
        .buttonStyle(.plain)
        .disabled(isLoggingOut)
    }

    private func close() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private struct NotificationCompactRow: View {
    let symbol: String
    let title: String
    let detail: String
    let time: String
    let tone: TasteAxis
    let showsUnread: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            LucideIcon(
                systemName: symbol,
                size: TBIcon.Size.medium,
                strokeWidth: TBIcon.Stroke.regular
            )
                .frame(width: 40, height: 40)
                .foregroundStyle(tone.mainColor)
                .background(tone.tintColor)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(TBFont.semibold(13))
                    .foregroundStyle(TBColor.textPrimary)

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(detail)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineLimit(1)

                    Text(time)
                        .font(TBFont.medium(11))
                        .foregroundStyle(TBColor.textFaint)
                        .lineLimit(1)
                        .fixedSize(horizontal: true, vertical: false)
                }
            }

            Spacer(minLength: 4)

            if showsUnread {
                Circle()
                    .fill(TasteAxis.sweet.mainColor)
                    .frame(width: 6, height: 6)
            }
        }
        .padding(12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct MenuRowModel {
    let symbol: String
    let title: String
    let detail: String
    let action: () -> Void
}

private struct MenuSection: View {
    let title: String
    let rows: [MenuRowModel]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(TBFont.semibold(11))
                .tracking(0.14)
                .foregroundStyle(TBColor.textFaint)

            VStack(spacing: 4) {
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    Button(action: row.action) {
                        HStack(spacing: CompactCardMetrics.gap) {
                            TokenBox(
                                size: .medium,
                                background: TBColor.surface,
                                foreground: TBColor.iconPrimary
                            ) {
                                LucideIcon(
                                    systemName: row.symbol,
                                    size: TBIcon.Size.medium,
                                    strokeWidth: TBIcon.Stroke.regular
                                )
                            }

                            VStack(alignment: .leading, spacing: 3) {
                                Text(row.title)
                                    .font(TBFont.semibold(13))
                                    .foregroundStyle(TBColor.textPrimary)
                                Text(row.detail)
                                    .font(TBFont.regular(11))
                                    .foregroundStyle(TBColor.textMuted)
                                    .lineLimit(1)
                            }

                            Spacer()

                            LucideIcon(
                                .chevronRight,
                                size: TBIcon.Size.medium,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                                .foregroundStyle(TBColor.textHint)
                        }
                        .padding(CompactCardMetrics.padding)
                        .background(TBColor.surface)
                        .clipShape(
                            RoundedRectangle(
                                cornerRadius: CompactCardMetrics.radius,
                                style: .continuous
                            )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct MenuActionRow: View {
    let icon: String
    let title: String
    let detail: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            MenuActionRowContent(icon: icon, title: title, detail: detail)
        }
        .buttonStyle(.plain)
    }
}

private struct MenuActionRowContent: View {
    let icon: String
    let title: String
    let detail: String
    var destructive = false
    var showsChevron = true

    var body: some View {
        HStack(spacing: 12) {
            LucideIcon(
                systemName: icon,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.regular
            )
                .frame(width: 34, height: 34)
                .foregroundStyle(destructive ? TBColor.destructive : TBColor.textSecondary)
                .background(destructive ? TBColor.destructive.opacity(0.08) : TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(TBFont.semibold(14))
                    .foregroundStyle(destructive ? TBColor.destructive : TBColor.textPrimary)
                Text(detail)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textBody)
            }

            Spacer()
            if showsChevron {
                LucideIcon(
                    .chevronRight,
                    size: TBIcon.Size.xSmall,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .foregroundStyle(TBColor.textHint)
            }
        }
        .padding(12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#if canImport(PreviewsMacros)
    #Preview("App Shell") {
        AppShellView()
            .environmentObject(AppModel.preview(
                onboardingComplete: true,
                profile: .sample,
                diningEntries: [.sample],
                savedRestaurantIDs: Set(RestaurantCatalog.savedDefaults)
            ))
    }
#endif
