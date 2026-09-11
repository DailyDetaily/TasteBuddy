import SwiftUI

/// 온보딩 영상에서 재구성한 장식용 모션입니다. 사용자 취향 데이터와 연결하지 않습니다.
enum TasteMotionStyle: CaseIterable {
    case analysis, detailMatrix, insightRing, rotatingLayers, feedbackRings

    var duration: Double { self == .analysis ? 12 * TasteMotionGeometry.analysisTimeScale : self == .rotatingLayers ? 192 : self == .insightRing ? 251.0 / 5.0 : 8 }
}

enum TasteRotationDivisions: Int, CaseIterable {
    case three = 3, six = 6, twelve = 12
    var loopDuration: Double { self == .three ? 24 : self == .six ? 96 : 192 }
}

enum TasteRotationRayCount: Int, CaseIterable {
    case twelve = 12, twentyFour = 24, fortyEight = 48
    var lineDensity: Double { self == .twelve ? 0 : self == .twentyFour ? 0.5 : 1 }
}

enum TasteMotionGeometry {
    typealias AnalysisCircle = (center: CGPoint, radius: Double, lineDensity: Double)
    struct FeedbackRing: Equatable {
        var radius: Double
        var opacity: Double
    }
    static let analysisTimeScale = 1.7
    static let rotationTransitionDuration = 1.2
    static let feedbackTransitionDuration = 1.7
    static let feedbackEndDuration = 0.8
    static let analysisMoveStarts: [Double] = [0, 1.25, 3.1, 4.15, 5.75, 7.75, 8.9, 10.6, 12]
    private static let insightCloud: [CGPoint] = {
        var seed = 42
        func random() -> Double { seed = seed * 16807 % 2147483647; return Double(seed) / 2147483647 }
        var order = Array(0..<126)
        for index in stride(from: 125, through: 1, by: -1) {
            order.swapAt(index, Int(floor(random() * Double(index + 1))))
        }
        var points = [CGPoint?](repeating: nil, count: 126)
        for (n, index) in order.enumerated() {
            for _ in 0..<2000 {
                let angle = (n < 42 ? (Double(n / 2) + random()) / 21 : random()) * .pi * 2
                let low = Double(n < 42 ? (n % 2 == 0 ? 244 : 293) : 249)
                let high = Double(n < 42 ? (n % 2 == 0 ? 253 : 302) : 297)
                let point = polar(angle, sqrt(low * low + (high * high - low * low) * random()))
                let overlaps = points.enumerated().contains { otherIndex, other in
                    guard let other else { return false }
                    return hypot(point.x - other.x, point.y - other.y) < (otherIndex % 6 == index % 6 ? 54 : 22)
                }
                if !overlaps { points[index] = point; break }
            }
            precondition(points[index] != nil, "인사이트 링 점 배치 실패")
        }
        return points.map { $0! }
    }()
    private static let insightGroupedCloud: [(angle: Double, radius: Double)] = {
        var points = insightCloud.map { point -> (angle: Double, radius: Double) in
            let x = Double(point.x - 320), y = Double(point.y - 320)
            let angle = (atan2(y, x) + Double.pi * 2).truncatingRemainder(dividingBy: Double.pi * 2)
            return (angle: angle, radius: hypot(x, y))
        }.sorted { $0.angle < $1.angle }
        for start in stride(from: 0, to: points.count, by: 4) {
            let group = (start..<min(start + 4, points.count)).sorted { points[$0].radius < points[$1].radius }
            let inner = group[0], outer = group[group.count - 1]
            points[inner].radius = min(points[inner].radius, 250 + 3 * sin(points[inner].angle * 17))
            points[outer].radius = max(points[outer].radius, 295 + 3 * sin(points[outer].angle * 13))
        }
        return points
    }()
    private static let radarRadii: [Double] = [278, 130, 235, 178, 250, 155, 270, 200, 242, 162, 260, 190, 280, 205, 255, 170, 238, 275, 182, 240, 158, 265, 215, 190]
    private static let analysisStops: [(center: CGPoint, radius: Double)] = (0..<8).map { index in
        (polar(random(index * 3) * .pi * 2, 55 + 105 * sqrt(random(index * 3 + 1))), 316.0 / 4)
    }

    // 6층 상태 사이에 각 선을 다시 반으로 나누는 12층 분할·결합을 끼웁니다.
    private static let rotationAngles: [TasteRotationDivisions: [[Double]]] = {
        let base: [[Double]] = [
            [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 15, 15], [0, 0, 15, 15, 30, 30],
            [0, 0, 15, 15, 30, 37.5], [0, 0, 15, 22.5, 30, 37.5], [0, 7.5, 15, 22.5, 30, 37.5],
            [7.5, 7.5, 15, 22.5, 30, 37.5], [7.5, 7.5, 22.5, 22.5, 30, 37.5], [7.5, 7.5, 22.5, 22.5, 37.5, 37.5],
            [22.5, 22.5, 22.5, 22.5, 37.5, 37.5], [37.5, 37.5, 37.5, 37.5, 37.5, 37.5],
        ]
        var states = base.prefix(6).map { $0.flatMap { [$0, $0] } }
        for step in 1...6 {
            states.append(base[5].enumerated().flatMap { layer, angle in
                [angle, angle + (layer >= 6 - step ? 3.75 : 0)]
            })
        }
        for step in 1...6 {
            states.append(base[5].enumerated().flatMap { layer, angle in
                [angle + (layer < step ? 3.75 : 0), angle + 3.75]
            })
        }
        return [
            .three: [[0, 0, 0], [0, 0, 15], [0, 15, 30], [15, 15, 30], [30, 30, 30]],
            .six: base,
            .twelve: states + base.dropFirst(6).map { $0.flatMap { [$0 + 3.75, $0 + 3.75] } },
        ]
    }()

    // 고정 시드로 Remotion 프리뷰와 같은 불규칙한 경로를 만듭니다.
    private static func random(_ index: Int) -> Double {
        var value = 42
        for _ in 0..<(index + 3) { value = value * 16807 % 2147483647 }
        return Double(value) / 2147483647
    }

    private static func smooth(_ value: Double) -> Double {
        let t = min(1, max(0, value))
        return t * t * t * (t * (t * 6 - 15) + 10)
    }

    static func analysisTravelDuration(step: Int) -> Double {
        (0.4 + 0.18 * random(24 + step)) / 0.75
    }

    static func analysisCircle(time: Double) -> AnalysisCircle {
        let t = max(0, time).truncatingRemainder(dividingBy: TasteMotionStyle.analysis.duration) / analysisTimeScale
        var step = 0
        while step < analysisStops.count - 1 && t >= analysisMoveStarts[step + 1] { step += 1 }
        let local = (t - analysisMoveStarts[step]) / analysisTravelDuration(step: step)
        let from = analysisStops[step]
        let to = analysisStops[(step + 1) % analysisStops.count]
        let travel = smooth(local)
        let expanded = from.radius + (max(from.radius, to.radius) + 48 - from.radius) * smooth(local / 0.3)
        // 이동 후반의 62~92% 구간에서 수축하고 도착 전에 작은 크기에 도달합니다.
        let radius = expanded + (to.radius - expanded) * smooth((local - 0.62) / 0.3)
        let beat = t / 0.75 * .pi * 2
        return (
            CGPoint(x: from.center.x + (to.center.x - from.center.x) * travel, y: from.center.y + (to.center.y - from.center.y) * travel),
            radius + 2.6 * sin(beat) + 1.2 * sin(beat * 2),
            1 - smooth(local / 0.3) * (1 - smooth((local - 0.62) / 0.3))
        )
    }

    static func centeredAnalysisCircle(from: AnalysisCircle, time: Double, rayCount: TasteRotationRayCount = .twelve) -> AnalysisCircle {
        let progress = smooth(time / rotationTransitionDuration)
        return (
            CGPoint(x: from.center.x + (320 - from.center.x) * progress, y: from.center.y + (320 - from.center.y) * progress),
            from.radius + (316.0 / 4 - from.radius) * progress,
            from.lineDensity + (rayCount.lineDensity - from.lineDensity) * progress
        )
    }

    static func analysisPoints(circle: AnalysisCircle, collapseFromDensity: Double? = nil) -> [CGPoint] {
        (0..<48).flatMap { index -> [CGPoint] in
            let angle = Double(index) / 48 * .pi * 2
            let inner = CGPoint(x: circle.center.x + circle.radius * cos(angle), y: circle.center.y + circle.radius * sin(angle))
            let outer = polar(angle, 316)
            guard let collapseFromDensity else { return [inner, outer] }
            let initial = analysisLineOpacity(index: index, density: collapseFromDensity)
            let length = initial > 0 ? min(1, analysisLineOpacity(index: index, density: circle.lineDensity) / initial) : analysisLineOpacity(index: index, density: circle.lineDensity)
            return [inner, CGPoint(x: inner.x + (outer.x - inner.x) * length, y: inner.y + (outer.y - inner.y) * length)]
        }
    }

    // 기존 선 사이를 동시에 나눠 12 → 24 → 48개로 늘리고, 확대 시 역순으로 줄입니다.
    static func analysisLineOpacity(index: Int, density: Double) -> Double {
        index % 4 == 0 ? 1 : smooth(density * 2 - (index % 2 == 0 ? 0 : 1))
    }

    static func analysisLineColorIndex(index: Int, density: Double) -> Int {
        index / (density <= 0 ? 4 : density <= 0.5 ? 2 : 1) % 6
    }

    static func polar(_ angle: Double, _ radius: Double) -> CGPoint {
        CGPoint(x: 320 + cos(angle) * radius, y: 320 + sin(angle) * radius)
    }

    private static func feedbackEase(_ value: Double) -> Double {
        let t = min(1, max(0, value))
        return t * t * (3 - 2 * t)
    }

    static func feedbackMorph(time: Double) -> (rotation: Double, bend: Double, gradientBlend: Double) {
        let progress = feedbackEase(time / feedbackTransitionDuration)
        let bend = feedbackEase((progress - 0.72) / 0.28)
        return (-.pi / 2 * feedbackEase(progress / 0.72), bend, feedbackEase((bend - 0.55) / 0.45))
    }

    static func feedbackRings(time: Double, endingAt: Double? = nil) -> [FeedbackRing] {
        if let endingAt, time >= max(feedbackTransitionDuration, endingAt) {
            let end = max(feedbackTransitionDuration, endingAt)
            return feedbackRings(time: end).sorted { $0.radius < $1.radius }.enumerated().map { index, ring in
                let remaining = 1 - feedbackEase((time - end) * 1.4 / feedbackEndDuration - Double(index) * 0.2)
                return FeedbackRing(radius: ring.radius * remaining, opacity: ring.opacity * remaining)
            }
        }
        let flowTime = max(0, time - feedbackTransitionDuration)
        let ramp = min(1, flowTime / 0.3)
        let travel = flowTime < 0.3 ? 0.3 * (pow(ramp, 3) - pow(ramp, 4) / 2) : flowTime - 0.15
        func fade(_ phase: Double) -> Double {
            feedbackEase(phase / 0.12) * (1 - feedbackEase((phase - 0.75) / 0.25))
        }
        return (0..<3).map { layer in
            let initial = 1.0 / 6 + Double(layer) / 3
            let unwrapped = initial + travel / 3
            let phase = unwrapped.truncatingRemainder(dividingBy: 1)
            return FeedbackRing(radius: 79 + 237 * phase, opacity: unwrapped < 1 ? min(1, fade(phase) / fade(initial)) : fade(phase))
        }
    }

    static func feedbackPaths(time: Double, rayCount: TasteRotationRayCount = .twentyFour, angle: Double = 0) -> [[CGPoint]] {
        let morph = feedbackMorph(time: time)
        let rings = feedbackRings(time: time)
        let count = rayCount.rawValue
        let halfSector = Double.pi / Double(count)
        return (0..<(3 * count)).map { index in
            let radius = rings[index / count].radius
            let direction = Double(index % count) / Double(count) * .pi * 2 + angle
            let center = polar(direction, radius)
            let fittingHalf = radius * sin(halfSector) / (abs(sin(morph.rotation)) * cos(halfSector) + abs(cos(morph.rotation)) * sin(halfSector))
            let halfLength = min(39.5, fittingHalf)
            return (0...24).map { sample in
                let u = Double(sample) / 12 - 1
                let straight = CGPoint(x: center.x + cos(direction + morph.rotation) * halfLength * u, y: center.y + sin(direction + morph.rotation) * halfLength * u)
                let arc = polar(direction - u * halfSector, radius)
                return CGPoint(x: straight.x + (arc.x - straight.x) * morph.bend, y: straight.y + (arc.y - straight.y) * morph.bend)
            }
        }
    }

    static func rotationAlignedTime(_ time: Double) -> Double {
        max(0, ceil(max(0, time) / 2 - 1e-9) * 2)
    }

    static func feedbackEntry(rotationTime: Double, time: Double, divisions: TasteRotationDivisions = .twelve, rayCount: TasteRotationRayCount = .twelve) -> (delay: Double, time: Double, angle: Double) {
        let alignedTime = rotationAlignedTime(rotationTime)
        let delay = alignedTime - rotationTime
        let point = points(style: .rotatingLayers, time: alignedTime, divisions: divisions, rayCount: rayCount)[0]
        return (delay, max(0, time - delay), atan2(point.y - 320, point.x - 320))
    }

    // brand-launch/src/taste-motion.ts와 같은 좌표 및 수식입니다.
    static func points(style: TasteMotionStyle, time: Double, divisions: TasteRotationDivisions = .twelve, rayCount: TasteRotationRayCount = .twelve) -> [CGPoint] {
        let phase = time.truncatingRemainder(dividingBy: style.duration) / style.duration * .pi * 2
        switch style {
        case .feedbackRings:
            return feedbackPaths(time: time, rayCount: rayCount).flatMap { $0 }
        case .rotatingLayers:
            // 분할부터 결합까지 60프레임(2초). 정지를 줄여 각 회전의 감쇠 구간을 확보합니다.
            let angles = rotationAngles[divisions]!
            let stageCount = angles.count - 1
            let cycleLength = 15 + stageCount * 22
            let advance = angles[stageCount][0]
            let elapsed = time.truncatingRemainder(dividingBy: divisions.loopDuration * Double(rayCount.rawValue) / 12) * 30
            let cycle = Int(floor(elapsed / 60))
            let cycleFrame = (elapsed - Double(cycle * 60)) * Double(cycleLength) / 60
            let starts = [0.0] + (0..<stageCount).map { Double(37 + $0 * 22) }
            var stage = 0
            while stage < stageCount - 1 && cycleFrame >= starts[stage + 1] { stage += 1 }
            let t = min(1, max(0, (cycleFrame - starts[stage + 1] + 14) / 14))
            // 임계 감쇠: 역회전 없이 목표 각도에 부드럽게 안착합니다.
            let progress = (1 - (1 + 6 * t) * exp(-6 * t)) / (1 - 7 * exp(-6.0))
            // 선 간격에 비례해 회전각을 줄여 다른 색의 옆 선과 결합하지 않게 합니다.

            return (0..<(divisions.rawValue * rayCount.rawValue)).flatMap { index -> [CGPoint] in
                let layer = index / rayCount.rawValue
                let from = angles[stage][layer], to = angles[stage + 1][layer]
                let turn = Double(cycle) * advance + from + (to - from) * progress
                let angle = Double(index % rayCount.rawValue) / Double(rayCount.rawValue) * .pi * 2 + turn * 12 / Double(rayCount.rawValue) * .pi / 180
                return [polar(angle, 79 + 237 / Double(divisions.rawValue) * Double(layer)), polar(angle, 79 + 237 / Double(divisions.rawValue) * Double(layer + 1))]
            }
        case .analysis:
            return analysisPoints(circle: analysisCircle(time: time))
        case .detailMatrix:
            return radarRadii.enumerated().map { index, radius in
                polar(Double(index) / 24 * .pi * 2, radius + 26 * sin(phase + Double(index) * 1.7))
            }
        case .insightRing:
            return insightCloud.enumerated().map { index, point in
                let baseAngle = atan2(point.y - 320, point.x - 320)
                let wavePhase = phase * 3
                let angle = baseAngle + phase + 0.02 * sin(wavePhase + Double(index) * 1.618)
                let radius = hypot(point.x - 320, point.y - 320) + 3 * sin(wavePhase + baseAngle * 3) + 2 * sin(wavePhase * 2 + Double(index) * 2.414)
                return polar(angle, radius)
            }
        }
    }

    struct InsightDot {
        var point: CGPoint
        var radius: Double
        var opacity: Double
        var colorIndex: Int
        var progress: Double
    }
    struct InsightBridge {
        var points: [CGPoint]
        var colorIndex: Int
        var parent: Int
        var child: Int
    }
    struct InsightInteraction {
        private var from = 0.0
        var target = 0.0
        private var startedAt = Date.distantPast
        private var anchorAt: Date?

        func anchorElapsed(at date: Date) -> Double {
            anchorAt.map { max(0, date.timeIntervalSince($0)) } ?? 0
        }

        func value(at date: Date) -> Double {
            from + (target - from) * TasteMotionGeometry.smooth(date.timeIntervalSince(startedAt) / 0.5)
        }

        mutating func setPressed(_ pressed: Bool, at date: Date = .now, immediate: Bool = false) {
            from = value(at: date)
            if from == 0 || from == 1 { anchorAt = date }
            target = pressed ? 1 : 0
            startedAt = immediate ? date.addingTimeInterval(-0.5) : date
        }
    }

    static func insightDragDelta(from: CGPoint, to: CGPoint) -> Double {
        guard hypot(from.x, from.y) >= 40, hypot(to.x, to.y) >= 40 else { return 0 }
        return atan2(from.x * to.y - from.y * to.x, from.x * to.x + from.y * to.y)
    }

    static func insightInertia(velocity: Double, elapsed: Double) -> Double {
        let duration = min(1.8, 0.35 + abs(velocity) * 0.15)
        let progress = min(1, max(0, elapsed / duration))
        return velocity * duration / 3 * (1 - pow(1 - progress, 3))
    }

    struct InsightRotation {
        var angle = 0.0
        var size = CGSize.zero
        private var previous: CGPoint?
        private var previousAt: Date?
        private var velocity = 0.0
        private var releasedAt: Date?

        func value(at date: Date) -> Double {
            angle + (releasedAt.map { TasteMotionGeometry.insightInertia(velocity: velocity, elapsed: date.timeIntervalSince($0)) } ?? 0)
        }

        mutating func drag(to location: CGPoint, at date: Date = .now) {
            let side = min(size.width, size.height)
            guard side > 0 else { return }
            let point = CGPoint(x: (location.x - size.width / 2) * 640 / side, y: (location.y - size.height / 2) * 640 / side)
            if let previous, let previousAt {
                let delta = TasteMotionGeometry.insightDragDelta(from: previous, to: point)
                let elapsed = max(1.0 / 240, date.timeIntervalSince(previousAt))
                velocity = max(-8, min(8, velocity * 0.4 + delta / elapsed * 0.6))
                angle += delta
            } else {
                angle = value(at: date)
                velocity = 0
            }
            releasedAt = nil
            previous = point
            previousAt = date
        }

        mutating func end(at date: Date = .now, immediate: Bool = false) {
            guard let previousAt else { return }
            if immediate || date.timeIntervalSince(previousAt) > 0.12 { velocity = 0 }
            releasedAt = date
            previous = nil
            self.previousAt = nil
        }

        mutating func rotate(by delta: Double, at date: Date = .now) {
            angle = value(at: date) + delta
            velocity = 0
            releasedAt = nil
            previous = nil
            previousAt = nil
        }
    }

    struct InsightFrame {
        var dots: [InsightDot]
        var bridges: [InsightBridge]
        var expansion: Double
    }
    static let insightFillEnd = 0.1 + 20 * 0.025
    static let insightIntroDuration = insightFillEnd + 0.2 + 1.1
    private static let insightPackedDots: [(point: CGPoint, parent: Int, startsAt: Double, duration: Double)] = {
        var dots: [(point: CGPoint, parent: Int, startsAt: Double, duration: Double)] = []
        for layer in 1...6 {
            let middle = Double(layer - 1) / 2
            let slots = (0..<layer).sorted { left, right in
                let leftDistance = abs(Double(left) - middle)
                let rightDistance = abs(Double(right) - middle)
                return leftDistance == rightDistance ? left < right : leftDistance < rightDistance
            }
            let duration = layer == 1 ? 0 : Double(layer) * 0.025 / ceil(Double(layer) / 2)
            for slot in slots {
                let startsAt = layer == 1 ? 0 : 0.1 + Double(layer * (layer - 1) / 2 - 1) * 0.025 + floor(abs(Double(slot) - middle)) * duration
                for sector in 0..<6 {
                    let angle = -2 * .pi / 3 + Double(sector) * .pi / 3 + Double(slot) / Double(layer) * .pi / 3
                    let point = polar(angle, (79 - 4.8) * Double(layer) / 6)
                    var parent = 0, closest = Double.infinity
                    for index in dots.indices where index % 6 == sector && dots[index].startsAt + dots[index].duration <= startsAt + 1e-8 {
                        let distance = hypot(point.x - dots[index].point.x, point.y - dots[index].point.y)
                        if distance < closest { parent = index; closest = distance }
                    }
                    dots.append((point, parent, startsAt, duration))
                }
            }
        }
        return dots
    }()

    static func insightExpansion(time: Double) -> Double {
        if time <= insightFillEnd + 0.2 { return 0 }
        if time >= insightIntroDuration { return 1 }
        return smooth((time - (insightFillEnd + 0.2)) / 1.1)
    }

    static func insightFrame(time: Double, settled: Bool = false, alignment: Double = 0, freeMotionTime: Double? = nil, alignmentElapsed: Double = 0, rotation: Double = 0, colorIndices: [Int]? = nil) -> InsightFrame {
        let expansion = settled ? 1 : insightExpansion(time: time)
        let freeTime = settled ? 0 : (freeMotionTime ?? max(0, time - insightIntroDuration))
        let free = points(style: .insightRing, time: freeTime)
        let anchorTime = max(0, freeTime - alignmentElapsed)
        let anchor = alignment > 0 ? points(style: .insightRing, time: anchorTime) : free
        let dots = insightPackedDots.enumerated().map { index, entry in
            let target = entry.point
            let step = index / 6, sector = index % 6
            let progress = step == 0 || settled || time >= insightFillEnd ? 1 : min(1, smooth((time - entry.startsAt) / entry.duration))
            let parent = insightPackedDots[entry.parent].point
            let packed = step == 0 ? target : CGPoint(x: parent.x + (target.x - parent.x) * progress, y: parent.y + (target.y - parent.y) * progress)
            let mixed = free[index]
            let freeAngle = atan2(mixed.y - 320, mixed.x - 320)
            let anchorAngle = atan2(anchor[index].y - 320, anchor[index].x - 320)
            let turn = Double.pi * 2
            let angle = freeAngle + turn * ((anchorAngle + turn * (freeTime - anchorTime) / TasteMotionStyle.insightRing.duration - freeAngle) / turn).rounded()
            let sorted = insightGroupedCloud[sector * 21 + step]
            let wavePhase = freeTime.truncatingRemainder(dividingBy: TasteMotionStyle.insightRing.duration) / TasteMotionStyle.insightRing.duration * turn * 3
            let sortedAngle = min(insightGroupedCloud[sector * 21 + 20].angle, max(insightGroupedCloud[sector * 21].angle, sorted.angle + 0.012 * sin(wavePhase + Double(index) * 1.618)))
            let delta = anchorAngle + atan2(sin(sorted.angle - anchorAngle), cos(sorted.angle - anchorAngle)) + sortedAngle - sorted.angle - angle
            let mixedRadius = hypot(mixed.x - 320, mixed.y - 320), sortedRadius = sorted.radius + 3 * sin(wavePhase + Double(index) * 2.414)
            let destination = polar(angle + delta * alignment - 2 * .pi / 3 + rotation, mixedRadius + (sortedRadius - mixedRadius) * alignment)
            let packedOpacity = min(1, max(0.35, 1 - 0.65 * (hypot(target.x - 320, target.y - 320) / (79 - 4.8) * 6 - 1) / 5))
            return InsightDot(
                point: CGPoint(x: packed.x + (destination.x - packed.x) * expansion, y: packed.y + (destination.y - packed.y) * expansion),
                radius: (4.8 + (9.5 - 4.8) * expansion) * progress,
                opacity: progress * (packedOpacity + (dotOpacity(index: index, time: freeTime) - packedOpacity) * expansion),
                colorIndex: colorIndices?.count == insightPackedDots.count ? colorIndices![index] : sector, progress: progress
            )
        }
        var bridges: [InsightBridge] = []
        if expansion == 0 {
            for (index, dot) in dots.enumerated() where index >= 6 && dot.progress > 0 && dot.progress < 0.95 {
                let parentIndex = insightPackedDots[index].parent
                let parent = dots[parentIndex]
                guard parent.colorIndex == dot.colorIndex else { continue }
                let dx = dot.point.x - parent.point.x, dy = dot.point.y - parent.point.y
                let distance = hypot(dx, dy)
                let r1 = parent.radius, r2 = dot.radius
                guard distance > abs(r1 - r2) else { continue }
                // 원의 교점과 접선으로 연결합니다. Paper.js / SATO Hiroyuki의 메타볼 기하 모델.
                func clampedAcos(_ value: Double) -> Double { acos(min(1, max(-1, value))) }
                let u1 = distance < r1 + r2 ? clampedAcos((r1 * r1 + distance * distance - r2 * r2) / (2 * r1 * distance)) : 0
                let u2 = distance < r1 + r2 ? clampedAcos((r2 * r2 + distance * distance - r1 * r1) / (2 * r2 * distance)) : 0
                let direction = atan2(dy, dx), tangent = clampedAcos((r1 - r2) / distance)
                let blend = 0.5 * (1 - smooth((dot.progress - 0.55) / 0.4))
                let a1 = direction + u1 + (tangent - u1) * blend, b1 = 2 * direction - a1
                let a2 = direction + .pi - u2 - (.pi - u2 - tangent) * blend, b2 = 2 * direction - a2
                func at(_ center: CGPoint, _ angle: Double, _ radius: Double) -> CGPoint {
                    CGPoint(x: center.x + cos(angle) * radius, y: center.y + sin(angle) * radius)
                }
                let p1 = at(parent.point, a1, r1), p2 = at(dot.point, a2, r2)
                let p3 = at(dot.point, b2, r2), p4 = at(parent.point, b1, r1)
                let handle = min(blend * 2.4, hypot(p1.x - p2.x, p1.y - p2.y) / (r1 + r2)) * min(1, distance * 2 / (r1 + r2))
                bridges.append(InsightBridge(
                    points: [p1, at(p1, a1 - .pi / 2, r1 * handle), at(p2, a2 + .pi / 2, r2 * handle), p2,
                             p3, at(p3, b2 - .pi / 2, r2 * handle), at(p4, b1 + .pi / 2, r1 * handle), p4],
                    colorIndex: dot.colorIndex, parent: parentIndex, child: index
                ))
            }
        }
        return InsightFrame(dots: dots, bridges: bridges, expansion: expansion)
    }

    static func dotOpacity(index: Int, time: Double) -> Double {
        let duration = TasteMotionStyle.insightRing.duration
        let phase = time.truncatingRemainder(dividingBy: duration) / duration * .pi * 6
        return 0.45 + 0.5 * (0.5 + 0.5 * sin(phase + Double(index) * 1.7))
    }
}

struct TasteMotionView: View {
    let style: TasteMotionStyle
    var divisions: TasteRotationDivisions = .six
    var rayCount: TasteRotationRayCount = .twelve
    var isActive = true
    var feedbackComplete = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var startedAt = Date.now
    @State private var isVisible = false
    @State private var transitionFrom: TasteMotionGeometry.AnalysisCircle?
    @State private var feedbackRotationTime: Double?
    @State private var feedbackDelay = 0.0
    @State private var feedbackAngle = 0.0
    @State private var feedbackEndedAt: Double?
    @State private var feedbackFinished = false
    @State private var insightInteraction = TasteMotionGeometry.InsightInteraction()
    @State private var insightRotation = TasteMotionGeometry.InsightRotation()
    @GestureState private var insightPressed = false

    private var motionCanvas: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: !isActive || !isVisible || reduceMotion || feedbackFinished || scenePhase != .active)) { timeline in
            let time = reduceMotion ? (style == .feedbackRings ? TasteMotionGeometry.feedbackTransitionDuration + (feedbackComplete ? TasteMotionGeometry.feedbackEndDuration : 0) : 0) : timeline.date.timeIntervalSince(startedAt)
            let finished = style == .feedbackRings && feedbackComplete && (reduceMotion || feedbackMotionTime(time) >= (feedbackEndedAt ?? .infinity) + TasteMotionGeometry.feedbackEndDuration)
            Canvas { context, size in
                let side = min(size.width, size.height)
                context.translateBy(x: (size.width - side) / 2, y: (size.height - side) / 2)
                context.scaleBy(x: side / 640, y: side / 640)
                draw(context: &context, time: time)
            }
            .onChange(of: finished) { feedbackFinished = finished }
        }
        .aspectRatio(1, contentMode: .fit)
        .contentShape(Rectangle())
        .onGeometryChange(for: CGSize.self) { $0.size } action: { insightRotation.size = $0 }
        .highPriorityGesture(DragGesture(minimumDistance: 0)
            .updating($insightPressed) { _, pressed, _ in pressed = true }
            .onChanged { value in
                if reduceMotion || Date.now.timeIntervalSince(startedAt) >= TasteMotionGeometry.insightIntroDuration { insightRotation.drag(to: value.location) }
            }
            .onEnded { _ in insightRotation.end(immediate: reduceMotion) }, including: style == .insightRing ? .all : .none)
        .onChange(of: insightPressed) {
            insightInteraction.setPressed(insightPressed, immediate: reduceMotion)
            if !insightPressed { insightRotation.end(immediate: reduceMotion) }
        }
        .accessibilityHidden(style != .insightRing)
        .accessibilityLabel("인사이트 링")
        .accessibilityAddTraits(.isButton)
        .accessibilityHint("누르면 미각별로 모이고, 드래그하면 회전합니다. 이중 탭으로 정렬을 전환하고 위아래로 쓸어 회전할 수 있습니다.")
        .accessibilityAction { insightInteraction.setPressed(insightInteraction.target == 0, immediate: reduceMotion) }
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: insightRotation.rotate(by: .pi / 12)
            case .decrement: insightRotation.rotate(by: -.pi / 12)
            @unknown default: break
            }
        }
    }

    var body: some View {
        motionCanvas
        .onAppear { resetMotion(); isVisible = true }
        .onDisappear { isVisible = false }
        .onChange(of: rayCount) { resetMotion() }
        .onChange(of: divisions) { resetMotion() }
        .onChange(of: isActive) { if isActive { resetMotion() } }
        .onChange(of: feedbackComplete) {
            feedbackEndedAt = feedbackComplete ? max(TasteMotionGeometry.feedbackTransitionDuration, feedbackMotionTime(Date.now.timeIntervalSince(startedAt))) : nil
            feedbackFinished = false
        }
        .onChange(of: style) { oldStyle, newStyle in
            let now = Date.now
            let elapsed = now.timeIntervalSince(startedAt)
            let previousCenter = transitionFrom
            let wasCentering = previousCenter != nil && elapsed < TasteMotionGeometry.rotationTransitionDuration
            let rotationTime = max(0, elapsed - (previousCenter == nil ? 0 : TasteMotionGeometry.rotationTransitionDuration))
            resetMotion()
            if !reduceMotion && oldStyle == .analysis && newStyle == .rotatingLayers {
                transitionFrom = TasteMotionGeometry.analysisCircle(time: elapsed)
            } else if !reduceMotion && oldStyle == .rotatingLayers && newStyle == .feedbackRings {
                if wasCentering, let previousCenter {
                    transitionFrom = TasteMotionGeometry.centeredAnalysisCircle(from: previousCenter, time: elapsed, rayCount: rayCount)
                }
                feedbackRotationTime = rotationTime
                let entry = TasteMotionGeometry.feedbackEntry(rotationTime: rotationTime, time: 0, divisions: divisions, rayCount: rayCount)
                feedbackDelay = entry.delay
                feedbackAngle = entry.angle
            }
            startedAt = now
        }
    }

    private func resetMotion() {
        startedAt = .now
        transitionFrom = nil
        feedbackRotationTime = nil
        feedbackDelay = 0
        feedbackAngle = 0
        feedbackEndedAt = feedbackComplete ? TasteMotionGeometry.feedbackTransitionDuration : nil
        feedbackFinished = false
    }

    private func feedbackMotionTime(_ time: Double) -> Double {
        max(0, time - (transitionFrom == nil ? 0 : TasteMotionGeometry.rotationTransitionDuration) - feedbackDelay)
    }

    private func draw(context: inout GraphicsContext, time: Double) {
        let centering = transitionFrom != nil && !reduceMotion && time < TasteMotionGeometry.rotationTransitionDuration
        let baseTime = transitionFrom == nil ? time : max(0, time - TasteMotionGeometry.rotationTransitionDuration)
        let settling = style == .feedbackRings && baseTime < feedbackDelay
        let activeStyle: TasteMotionStyle = centering ? .analysis : settling ? .rotatingLayers : style
        let motionTime = settling ? (feedbackRotationTime ?? 0) + baseTime : style == .feedbackRings ? feedbackMotionTime(time) : baseTime
        let circle = centering
            ? TasteMotionGeometry.centeredAnalysisCircle(from: transitionFrom!, time: time, rayCount: rayCount)
            : TasteMotionGeometry.analysisCircle(time: time)
        let collapseFromDensity = centering ? transitionFrom?.lineDensity : nil
        let points = activeStyle == .analysis ? TasteMotionGeometry.analysisPoints(circle: circle, collapseFromDensity: collapseFromDensity) : activeStyle == .feedbackRings ? [] : TasteMotionGeometry.points(style: activeStyle, time: motionTime, divisions: divisions, rayCount: rayCount)
        let palette = TasteAxis.allCases.map { $0.palette.main }
        switch activeStyle {
        case .feedbackRings:
            drawFeedback(context: &context, time: motionTime, palette: palette)
        case .rotatingLayers:
            for index in 0..<(points.count / 2) {
                var line = Path()
                line.move(to: points[index * 2])
                line.addLine(to: points[index * 2 + 1])
                context.stroke(line, with: .color(palette[index % 6]), lineWidth: 4)
            }
        case .analysis:
            let density = circle.lineDensity
            for index in 0..<(points.count / 2) {
                var line = Path()
                line.move(to: points[index * 2])
                line.addLine(to: points[index * 2 + 1])
                let opacity = max(TasteMotionGeometry.analysisLineOpacity(index: index, density: collapseFromDensity ?? density), TasteMotionGeometry.analysisLineOpacity(index: index, density: density))
                context.stroke(line, with: .color(palette[TasteMotionGeometry.analysisLineColorIndex(index: index, density: density)].opacity(opacity)), lineWidth: 4)
            }
        case .detailMatrix:
            for index in 0..<32 {
                let start = Double(index) / 32 * .pi * 2 + 0.016
                let end = Double(index + 1) / 32 * .pi * 2 - 0.016
                var wedge = Path()
                wedge.move(to: CGPoint(x: 320, y: 320))
                wedge.addLine(to: TasteMotionGeometry.polar(start, 316))
                wedge.addArc(center: CGPoint(x: 320, y: 320), radius: 316, startAngle: .radians(start), endAngle: .radians(end), clockwise: false)
                wedge.closeSubpath()
                context.fill(wedge, with: .color(TBColor.borderCard))
            }
            var polygon = Path()
            polygon.addLines(points)
            polygon.closeSubpath()
            context.fill(polygon, with: .color(palette[0].opacity(0.24)))
            context.stroke(polygon, with: .color(palette[0]), style: StrokeStyle(lineWidth: 3, lineJoin: .round))
            for point in points {
                var line = Path()
                line.move(to: CGPoint(x: 320, y: 320))
                line.addLine(to: point)
                context.stroke(line, with: .color(palette[0].opacity(0.65)), lineWidth: 1.3)
                context.fill(Path(ellipseIn: CGRect(x: point.x - 7, y: point.y - 7, width: 14, height: 14)), with: .color(palette[0]))
            }
        case .insightRing:
            Self.drawInsight(context: &context, frame: TasteMotionGeometry.insightFrame(time: time, settled: reduceMotion, alignment: insightInteraction.value(at: .now), alignmentElapsed: insightInteraction.anchorElapsed(at: .now), rotation: insightRotation.value(at: .now)), palette: palette)
        }
    }

    static func drawInsight(context: inout GraphicsContext, frame: TasteMotionGeometry.InsightFrame, palette: [Color]) {
        if frame.expansion == 0 {
            for colorIndex in 0..<6 {
                var colorContext = context
                colorContext.clipToLayer { mask in
                    for bridge in frame.bridges where bridge.colorIndex == colorIndex {
                        let p = bridge.points
                        var path = Path()
                        path.move(to: p[0])
                        path.addCurve(to: p[3], control1: p[1], control2: p[2])
                        path.addLine(to: p[4])
                        path.addCurve(to: p[7], control1: p[5], control2: p[6])
                        path.closeSubpath()
                        mask.fill(path, with: .color(.white))
                    }
                    for dot in frame.dots where dot.colorIndex == colorIndex && dot.radius > 0 {
                        let rect = CGRect(x: dot.point.x - dot.radius, y: dot.point.y - dot.radius, width: dot.radius * 2, height: dot.radius * 2)
                        mask.fill(Path(ellipseIn: rect), with: .color(.white))
                    }
                }
                let gradient = Gradient(colors: [palette[colorIndex], palette[colorIndex].opacity(0.35)])
                colorContext.fill(Path(CGRect(x: 0, y: 0, width: 640, height: 640)), with: .radialGradient(gradient, center: CGPoint(x: 320, y: 320), startRadius: 74.2 / 6, endRadius: 74.2))
            }
            return
        }
        for dot in frame.dots where dot.radius > 0 {
            let rect = CGRect(x: dot.point.x - dot.radius, y: dot.point.y - dot.radius, width: dot.radius * 2, height: dot.radius * 2)
            context.fill(Path(ellipseIn: rect), with: .color(palette[dot.colorIndex].opacity(dot.opacity)))
        }
    }

    private func drawFeedback(context: inout GraphicsContext, time: Double, palette: [Color]) {
        let morph = TasteMotionGeometry.feedbackMorph(time: time)
        let count = rayCount.rawValue
        let stops = (0...count).map { Gradient.Stop(color: palette[$0 % 6], location: Double($0) / Double(count)) }
        let gradient = GraphicsContext.Shading.conicGradient(Gradient(stops: stops), center: CGPoint(x: 320, y: 320), angle: .radians(feedbackAngle))
        if morph.bend == 1 {
            let endingAt = reduceMotion && feedbackComplete ? TasteMotionGeometry.feedbackTransitionDuration : feedbackEndedAt
            for ring in TasteMotionGeometry.feedbackRings(time: time, endingAt: endingAt) {
                var ringContext = context
                ringContext.opacity = ring.opacity
                ringContext.stroke(Path(ellipseIn: CGRect(x: 320 - ring.radius, y: 320 - ring.radius, width: ring.radius * 2, height: ring.radius * 2)), with: gradient, lineWidth: 4)
            }
        } else {
            let paths = TasteMotionGeometry.feedbackPaths(time: time, rayCount: rayCount, angle: feedbackAngle)
            for (index, points) in paths.enumerated() {
                var path = Path()
                path.addLines(points)
                context.stroke(path, with: .color(palette[index % count % 6]), lineWidth: 4)
                if morph.gradientBlend > 0 {
                    var blended = context
                    blended.opacity = morph.gradientBlend
                    blended.stroke(path, with: gradient, lineWidth: 4)
                }
            }
        }
    }
}

#if canImport(PreviewsMacros)
#Preview("분석 → 조정 → 피드백") {
    @Previewable @State var style: TasteMotionStyle = .analysis
    @Previewable @State var feedbackComplete = false
    @Previewable @State var divisions: TasteRotationDivisions = .six
    @Previewable @State var rayCount: TasteRotationRayCount = .twelve
    VStack {
        Picker("분할 모드", selection: $divisions) {
            ForEach(TasteRotationDivisions.allCases, id: \.self) { mode in
                Text("\(mode.rawValue)분할").tag(mode)
            }
        }
        .pickerStyle(.segmented)
        Picker("선 개수", selection: $rayCount) {
            ForEach(TasteRotationRayCount.allCases, id: \.self) { count in
                Text("\(count.rawValue)개").tag(count)
            }
        }
        .pickerStyle(.segmented)
        TasteMotionView(style: style, divisions: divisions, rayCount: rayCount, feedbackComplete: feedbackComplete)
        HStack {
            Button("처음부터") { feedbackComplete = false; style = .analysis }
            Button(style == .analysis ? "미각 조정" : style == .rotatingLayers ? "미각 피드백" : "피드백 종료") {
                if style == .analysis { style = .rotatingLayers }
                else if style == .rotatingLayers { style = .feedbackRings }
                else { feedbackComplete = true }
            }
            .disabled(feedbackComplete)
        }
    }
    .padding()
    .background(TBColor.focus)
}

#Preview("온보딩 코드 모션") {
    VStack {
        TasteMotionView(style: .analysis)
        TasteMotionView(style: .rotatingLayers)
        TasteMotionView(style: .feedbackRings, rayCount: .twentyFour)
    }
    .padding()
    .background(TBColor.focus)
}
#endif
