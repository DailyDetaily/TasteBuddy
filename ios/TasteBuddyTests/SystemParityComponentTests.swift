import XCTest
import SwiftUI
import UIKit
@testable import TasteBuddy

final class SystemParityComponentTests: XCTestCase {
    func testTasteRotationAlignsBeforeMorphingIntoFeedbackRings() {
        for rayCount in TasteRotationRayCount.allCases {
            for divisions in TasteRotationDivisions.allCases {
                for requestedAt in [0.0, 0.4, 1.1, 1.99, 2, 2.8] {
                    let alignedAt = TasteMotionGeometry.rotationAlignedTime(requestedAt)
                    let entry = TasteMotionGeometry.feedbackEntry(rotationTime: requestedAt, time: alignedAt - requestedAt, divisions: divisions, rayCount: rayCount)
                    XCTAssertTrue((0..<2).contains(entry.delay))
                    XCTAssertEqual(entry.time, 0)
                    let rotating = TasteMotionGeometry.points(style: .rotatingLayers, time: alignedAt, divisions: divisions, rayCount: rayCount)
                    let paths = TasteMotionGeometry.feedbackPaths(time: 0, rayCount: rayCount, angle: entry.angle)
                    let count = rayCount.rawValue
                    for layer in 0..<3 {
                        for ray in 0..<count {
                            let path = paths[layer * count + ray]
                            let start = rotating[(layer * divisions.rawValue / 3 * count + ray) * 2]
                            let end = rotating[(((layer + 1) * divisions.rawValue / 3 - 1) * count + ray) * 2 + 1]
                            XCTAssertEqual(hypot(path[0].x - start.x, path[0].y - start.y), 0, accuracy: 1e-9)
                            XCTAssertEqual(hypot(path[24].x - end.x, path[24].y - end.y), 0, accuracy: 1e-9)
                        }
                    }
                }
            }
            let paths = TasteMotionGeometry.feedbackPaths(time: TasteMotionGeometry.feedbackTransitionDuration, rayCount: rayCount)
            for layer in 0..<3 {
                for ray in 0..<rayCount.rawValue {
                    let path = paths[layer * rayCount.rawValue + ray]
                    let next = paths[layer * rayCount.rawValue + (ray + 1) % rayCount.rawValue]
                    XCTAssertEqual(hypot(path[0].x - next[24].x, path[0].y - next[24].y), 0, accuracy: 1e-9)
                }
            }
        }
        for frame in 0...51 {
            let time = Double(frame) / 30
            let morph = TasteMotionGeometry.feedbackMorph(time: time)
            XCTAssertTrue((-.pi / 2...0).contains(morph.rotation))
            for path in TasteMotionGeometry.feedbackPaths(time: time) {
                for point in path { XCTAssertTrue((0...640).contains(point.x) && (0...640).contains(point.y)) }
            }
        }
    }

    func testTasteFeedbackLoopsWithoutOverlapAndContractsOnlyAtCompletion() {
        let initial = TasteMotionGeometry.feedbackRings(time: TasteMotionGeometry.feedbackTransitionDuration)
        for (index, ring) in initial.enumerated() {
            XCTAssertEqual(ring.radius, [118.5, 197.5, 276.5][index], accuracy: 1e-9)
            XCTAssertEqual(ring.opacity, 1)
        }
        for frame in 0..<360 {
            let time = 4.51 + Double(frame) / 30
            let rings = TasteMotionGeometry.feedbackRings(time: time)
            let loop = TasteMotionGeometry.feedbackRings(time: time + 3)
            for (ring, next) in zip(rings, loop) {
                XCTAssertTrue((79...316).contains(ring.radius) && (0...1).contains(ring.opacity))
                XCTAssertEqual(ring.radius, next.radius, accuracy: 1e-9)
                XCTAssertEqual(ring.opacity, next.opacity, accuracy: 1e-9)
            }
            let ordered = rings.sorted { $0.radius < $1.radius }
            XCTAssertEqual(ordered[1].radius - ordered[0].radius, 79, accuracy: 1e-9)
            XCTAssertEqual(ordered[2].radius - ordered[1].radius, 79, accuracy: 1e-9)
        }
        for requestedAt in [0.0, 0.2, 1.7, 4.3, 9.1] {
            let end = max(TasteMotionGeometry.feedbackTransitionDuration, requestedAt)
            let before = TasteMotionGeometry.feedbackRings(time: end).sorted { $0.radius < $1.radius }
            XCTAssertEqual(TasteMotionGeometry.feedbackRings(time: end, endingAt: requestedAt), before)
            var previous = before
            for frame in 1...42 {
                let rings = TasteMotionGeometry.feedbackRings(time: end + Double(frame) / 30, endingAt: requestedAt)
                for (ring, old) in zip(rings, previous) { XCTAssertLessThanOrEqual(ring.radius, old.radius + 1e-9) }
                let visible = rings.filter { $0.opacity > 0.001 }
                for (a, b) in zip(visible, visible.dropFirst()) { XCTAssertGreaterThan(b.radius - a.radius, 4) }
                previous = rings
            }
            for ring in TasteMotionGeometry.feedbackRings(time: end + TasteMotionGeometry.feedbackEndDuration + 0.01, endingAt: requestedAt) {
                XCTAssertEqual(ring.radius, 0)
                XCTAssertEqual(ring.opacity, 0)
            }
        }
    }

    func testTasteAnalysisCentersBeforeRotationWithoutJump() {
        for rayCount in TasteRotationRayCount.allCases {
            let from = TasteMotionGeometry.analysisCircle(time: 4)
            let circle = TasteMotionGeometry.centeredAnalysisCircle(from: from, time: TasteMotionGeometry.rotationTransitionDuration, rayCount: rayCount)
            let before = TasteMotionGeometry.analysisPoints(circle: circle, collapseFromDensity: from.lineDensity)
            let visible = (0..<48).filter { TasteMotionGeometry.analysisLineOpacity(index: $0, density: circle.lineDensity) > 0 }
            XCTAssertEqual(visible.count, rayCount.rawValue)
            for divisions in TasteRotationDivisions.allCases {
                let after = TasteMotionGeometry.points(style: .rotatingLayers, time: 0, divisions: divisions, rayCount: rayCount)
                XCTAssertEqual(after.count, divisions.rawValue * rayCount.rawValue * 2)
                for index in 0..<rayCount.rawValue {
                    let inner = before[index * 48 / rayCount.rawValue * 2], outer = before[index * 48 / rayCount.rawValue * 2 + 1]
                    let start = after[index * 2], end = after[((divisions.rawValue - 1) * rayCount.rawValue + index) * 2 + 1]
                    XCTAssertEqual(hypot(inner.x - start.x, inner.y - start.y), 0, accuracy: 1e-9)
                    XCTAssertEqual(hypot(outer.x - end.x, outer.y - end.y), 0, accuracy: 1e-9)
                }
                let loop = divisions.loopDuration * Double(rayCount.rawValue) / 12
                XCTAssertEqual(after, TasteMotionGeometry.points(style: .rotatingLayers, time: loop, divisions: divisions, rayCount: rayCount))
                let tail = TasteMotionGeometry.points(style: .rotatingLayers, time: loop - 1.0 / 300, divisions: divisions, rayCount: rayCount)
                for (a, b) in zip(after, tail) { XCTAssertLessThan(hypot(a.x - b.x, a.y - b.y), 8) }
                for frame in 0...60 {
                    let points = TasteMotionGeometry.points(style: .rotatingLayers, time: Double(frame) / 30, divisions: divisions, rayCount: rayCount)
                    for layer in 0..<(divisions.rawValue - 1) {
                        let a = points[layer * rayCount.rawValue * 2], b = points[(layer + 1) * rayCount.rawValue * 2]
                        let difference = atan2(b.y - 320, b.x - 320) - atan2(a.y - 320, a.x - 320)
                        let gap = abs(atan2(sin(difference), cos(difference)))
                        XCTAssertLessThanOrEqual(gap, .pi / Double(rayCount.rawValue) + 1e-9, "이웃 색상 선으로 넘어가지 않아야 한다")
                    }
                }
                for time in [0.5, 1, 1.5, 2] {
                    let points = TasteMotionGeometry.points(style: .rotatingLayers, time: time, divisions: divisions, rayCount: rayCount)
                    for index in stride(from: 0, to: points.count, by: 2) {
                        let a = points[index], b = points[index + 1]
                        XCTAssertEqual(hypot(b.x - a.x, b.y - a.y), 237 / Double(divisions.rawValue), accuracy: 1e-9)
                    }
                }
            }
        }
        for time in [0.0, 0.5, 3, 4.1] {
            let from = TasteMotionGeometry.analysisCircle(time: time)
            let first = TasteMotionGeometry.centeredAnalysisCircle(from: from, time: 0)
            XCTAssertEqual(first.center, from.center)
            XCTAssertEqual(first.radius, from.radius)
            XCTAssertEqual(first.lineDensity, from.lineDensity)
            var previousDistance = hypot(from.center.x - 320, from.center.y - 320)
            var previousLengths = (0..<48).map { TasteMotionGeometry.analysisLineOpacity(index: $0, density: from.lineDensity) > 0 ? 1.0 : 0.0 }
            for frame in 1...Int(TasteMotionGeometry.rotationTransitionDuration * 30) {
                let circle = TasteMotionGeometry.centeredAnalysisCircle(from: from, time: Double(frame) / 30)
                let distance = hypot(circle.center.x - 320, circle.center.y - 320)
                XCTAssertLessThanOrEqual(distance, previousDistance + 1e-9)
                XCTAssertLessThan(distance + circle.radius, 316)
                let full = TasteMotionGeometry.analysisPoints(circle: circle)
                let shrinking = TasteMotionGeometry.analysisPoints(circle: circle, collapseFromDensity: from.lineDensity)
                for index in 0..<48 {
                    let inner = shrinking[index * 2], end = shrinking[index * 2 + 1], outer = full[index * 2 + 1]
                    let length = hypot(end.x - inner.x, end.y - inner.y) / hypot(outer.x - inner.x, outer.y - inner.y)
                    XCTAssertEqual(inner, full[index * 2])
                    XCTAssertLessThanOrEqual(length, previousLengths[index] + 1e-9)
                    if index % 4 == 0 { XCTAssertEqual(length, 1, accuracy: 1e-9) }
                    previousLengths[index] = length
                }
                previousDistance = distance
            }
            let centered = TasteMotionGeometry.centeredAnalysisCircle(from: from, time: TasteMotionGeometry.rotationTransitionDuration)
            XCTAssertEqual(centered.center, CGPoint(x: 320, y: 320))
            XCTAssertEqual(centered.radius, 79)
            XCTAssertEqual(centered.lineDensity, 0)
            let before = TasteMotionGeometry.analysisPoints(circle: centered, collapseFromDensity: from.lineDensity)
            for index in 0..<48 where index % 4 != 0 {
                XCTAssertEqual(before[index * 2], before[index * 2 + 1])
            }
            let after = TasteMotionGeometry.points(style: .rotatingLayers, time: 0)
            for index in 0..<12 {
                XCTAssertEqual(hypot(before[index * 8].x - after[index * 2].x, before[index * 8].y - after[index * 2].y), 0, accuracy: 1e-9)
                XCTAssertEqual(hypot(before[index * 8 + 1].x - after[265 + index * 2].x, before[index * 8 + 1].y - after[265 + index * 2].y), 0, accuracy: 1e-9)
            }
        }
    }

    func testTasteRotatingLayersSubdivideAndRejoinClockwise() {
        func angle(_ point: CGPoint) -> Double { atan2(point.y - 320, point.x - 320) }
        let modes: [(TasteRotationDivisions, Double, Double, Double)] = [(.three, 30, 103, 59), (.six, 37.5, 235, 125), (.twelve, 41.25, 499, 257)]
        for (mode, advance, cycleLength, splitAt) in modes {
            let start = TasteMotionGeometry.points(style: .rotatingLayers, time: 0, divisions: mode)
            XCTAssertEqual(start.count, mode.rawValue * 24)
            XCTAssertEqual(start, TasteMotionGeometry.points(style: .rotatingLayers, time: mode.loopDuration, divisions: mode))
            let split = TasteMotionGeometry.points(style: .rotatingLayers, time: splitAt / cycleLength * 2, divisions: mode)
            let splitAngles = (0..<mode.rawValue).map { Int((angle(split[$0 * 24]) * 1_000_000).rounded()) }
            XCTAssertEqual(Set(splitAngles).count, mode.rawValue)
            for frame in 0...60 {
                let points = TasteMotionGeometry.points(style: .rotatingLayers, time: Double(frame) / 30, divisions: mode)
                for index in stride(from: 0, to: points.count, by: 2) {
                    let a = points[index], b = points[index + 1]
                    XCTAssertEqual(hypot(b.x - a.x, b.y - a.y), 237 / Double(mode.rawValue), accuracy: 1e-9)
                }
            }
            let joined = TasteMotionGeometry.points(style: .rotatingLayers, time: 2, divisions: mode)
            for layer in 0..<mode.rawValue {
                XCTAssertEqual(angle(joined[layer * 24]), advance * .pi / 180, accuracy: 1e-9)
            }
        }
        var previous = TasteMotionGeometry.points(style: .rotatingLayers, time: 0)
        for frame in 1...Int(TasteMotionStyle.rotatingLayers.duration * 30) {
            let points = TasteMotionGeometry.points(style: .rotatingLayers, time: Double(frame) / 30)
            XCTAssertEqual(points.count, 288)
            for index in 0..<144 {
                let start = points[index * 2], end = points[index * 2 + 1]
                let layer = index / 12
                XCTAssertEqual(hypot(start.x - 320, start.y - 320), 79 + 19.75 * Double(layer), accuracy: 1e-9)
                XCTAssertEqual(hypot(end.x - start.x, end.y - start.y), 19.75, accuracy: 1e-9)
                let difference = angle(start) - angle(previous[index * 2])
                let delta = atan2(sin(difference), cos(difference))
                XCTAssertGreaterThanOrEqual(delta, -1e-9)
                XCTAssertLessThanOrEqual(delta, .pi / 12 + 1e-9)
            }
            previous = points
        }
        let settling = [0.3, 0.5, 0.7, 0.9].map { t in
            angle(TasteMotionGeometry.points(style: .rotatingLayers, time: (23 + 14 * t) / 499 * 2)[264])
        }
        XCTAssertGreaterThan(settling[1] - settling[0], settling[2] - settling[1])
        XCTAssertGreaterThan(settling[2] - settling[1], settling[3] - settling[2])
        func pairs(_ values: [Double]) -> [Double] { values.flatMap { [$0, $0] } }
        let milestones: [(Double, [Double])] = [
            (0, Array(repeating: 0, count: 12)), (59, pairs([0, 0, 15, 15, 30, 30])),
            (125, pairs([0, 7.5, 15, 22.5, 30, 37.5])),
            (147, [0, 0, 7.5, 7.5, 15, 15, 22.5, 22.5, 30, 30, 37.5, 41.25]),
            (169, [0, 0, 7.5, 7.5, 15, 15, 22.5, 22.5, 30, 33.75, 37.5, 41.25]),
            (257, (0..<12).map { Double($0) * 3.75 }),
            (389, pairs([3.75, 11.25, 18.75, 26.25, 33.75, 41.25])),
            (455, pairs([11.25, 11.25, 26.25, 26.25, 41.25, 41.25])),
            (499, Array(repeating: 41.25, count: 12)),
        ]
        for (frame, angles) in milestones {
            let time = frame / 499 * 2
            let points = TasteMotionGeometry.points(style: .rotatingLayers, time: time)
            for layer in 0..<12 {
                XCTAssertEqual(angle(points[layer * 24]), angles[layer] * .pi / 180, accuracy: 1e-9)
                if layer < 11 && angles[layer] == angles[layer + 1] {
                    let end = points[layer * 24 + 1], next = points[(layer + 1) * 24]
                    XCTAssertEqual(hypot(end.x - next.x, end.y - next.y), 0, accuracy: 1e-9)
                }
            }
            let hold = (frame.truncatingRemainder(dividingBy: 499) == 0 ? 23.0 : 8.0) / 499 * 2
            XCTAssertEqual(TasteMotionGeometry.points(style: .rotatingLayers, time: time + hold * 0.2), TasteMotionGeometry.points(style: .rotatingLayers, time: time + hold * 0.8))
            XCTAssertNotEqual(TasteMotionGeometry.points(style: .rotatingLayers, time: time + hold * 0.2), TasteMotionGeometry.points(style: .rotatingLayers, time: time + hold + 0.03))
        }
    }

    func testOnboardingInnerCircleRemainsRoundInsideOuterCircle() {
        XCTAssertEqual(TasteMotionGeometry.analysisCircle(time: 0).radius, 316.0 / 4)
        var radii: [CGFloat] = []
        var centers: [CGPoint] = []
        for frame in 0...Int(TasteMotionStyle.analysis.duration * 30) {
            let points = TasteMotionGeometry.points(style: .analysis, time: Double(frame) / 30)
            let density = TasteMotionGeometry.analysisCircle(time: Double(frame) / 30).lineDensity
            var colors = Set<Int>()
            var visibleCount = 0
            for index in 0..<(points.count / 2) {
                let opacity = TasteMotionGeometry.analysisLineOpacity(index: index, density: density)
                let color = TasteMotionGeometry.analysisLineColorIndex(index: index, density: density)
                XCTAssertTrue((0...1).contains(opacity))
                XCTAssertEqual(opacity, TasteMotionGeometry.analysisLineOpacity(index: (index + 24) % 48, density: density))
                XCTAssertEqual(color, TasteMotionGeometry.analysisLineColorIndex(index: (index + 24) % 48, density: density))
                if opacity > 0 {
                    XCTAssertEqual(color, visibleCount % 6)
                    visibleCount += 1
                    colors.insert(color)
                }
            }
            XCTAssertEqual(colors.count, 6)
            let inner = stride(from: 0, to: points.count, by: 2).map { points[$0] }
            let center = inner.reduce(CGPoint.zero) { CGPoint(x: $0.x + $1.x / CGFloat(inner.count), y: $0.y + $1.y / CGFloat(inner.count)) }
            let radius = hypot(inner[0].x - center.x, inner[0].y - center.y)
            for point in inner {
                XCTAssertEqual(hypot(point.x - center.x, point.y - center.y), radius, accuracy: 1e-9)
            }
            XCTAssertLessThan(hypot(center.x - 320, center.y - 320) + radius, 316)
            for index in stride(from: 1, to: points.count, by: 2) {
                XCTAssertEqual(hypot(points[index].x - 320, points[index].y - 320), 316, accuracy: 1e-9)
            }
            radii.append(radius)
            centers.append(center)
        }
        XCTAssertGreaterThan((radii.max() ?? 0) - (radii.min() ?? 0), 24)
        XCTAssertTrue(centers.contains { hypot($0.x - centers[0].x, $0.y - centers[0].y) > 120 })
    }

    func testOnboardingCircleContractsBeforeArrivalAndKeepsBeating() {
        var destinations: [CGPoint] = []
        var intervals: [Double] = []
        var travels: [Double] = []
        for step in 0..<8 {
            let t = TasteMotionGeometry.analysisMoveStarts[step]
            let travel = TasteMotionGeometry.analysisTravelDuration(step: step)
            let scale = TasteMotionGeometry.analysisTimeScale
            intervals.append(TasteMotionGeometry.analysisMoveStarts[step + 1] - t)
            travels.append(travel)
            let start = TasteMotionGeometry.analysisCircle(time: t * scale)
            let expanded = TasteMotionGeometry.analysisCircle(time: (t + travel * 0.5) * scale)
            let contracted = TasteMotionGeometry.analysisCircle(time: (t + travel * 0.94) * scale)
            let arrived = TasteMotionGeometry.analysisCircle(time: (t + travel) * scale)
            let lineCount: (Double) -> Int = { density in
                (0..<48).filter { TasteMotionGeometry.analysisLineOpacity(index: $0, density: density) > 0 }.count
            }
            XCTAssertEqual(lineCount(start.lineDensity), 48)
            XCTAssertEqual(lineCount(expanded.lineDensity), 12)
            XCTAssertEqual(lineCount(contracted.lineDensity), 48)
            let transition = TasteMotionGeometry.analysisCircle(time: (t + travel * 0.2) * scale)
            XCTAssertTrue((13..<48).contains(lineCount(transition.lineDensity)))
            XCTAssertTrue((0..<48).contains { index in
                let opacity = TasteMotionGeometry.analysisLineOpacity(index: index, density: transition.lineDensity)
                return opacity > 0 && opacity < 1
            })
            XCTAssertGreaterThan(expanded.radius, start.radius + 10)
            XCTAssertLessThan(contracted.radius, expanded.radius - 15)
            XCTAssertGreaterThan(hypot(contracted.center.x - arrived.center.x, contracted.center.y - arrived.center.y), 0.001)
            XCTAssertLessThan(abs(contracted.radius - arrived.radius), 5)
            let holdStep = min(0.045, (TasteMotionGeometry.analysisMoveStarts[step + 1] - t - travel - 0.04) / 8)
            let hold = (0..<9).map { index in
                TasteMotionGeometry.analysisCircle(time: (t + travel + 0.02 + Double(index) * holdStep) * scale)
            }
            for circle in hold {
                XCTAssertEqual(circle.center.x, arrived.center.x, accuracy: 1e-9)
                XCTAssertEqual(circle.center.y, arrived.center.y, accuracy: 1e-9)
            }
            let pulseRange = (hold.map(\.radius).max() ?? 0) - (hold.map(\.radius).min() ?? 0)
            XCTAssertGreaterThan(pulseRange, 1)
            XCTAssertLessThan(pulseRange, 8)
            XCTAssertTrue((0.9...1.35).contains(travel * scale))
            XCTAssertFalse(destinations.contains(arrived.center))
            destinations.append(arrived.center)
        }
        XCTAssertGreaterThan(Set(intervals.map { Int(($0 * 1000).rounded()) }).count, 4)
        XCTAssertGreaterThan(Set(travels.map { Int(($0 * 1000).rounded()) }).count, 4)
    }

    func testOnboardingMotionStaysInBoundsAndLoops() {
        for (density, spacing) in [(0.0, 4), (0.5, 2), (1.0, 1)] {
            let visible = (0..<48).filter { TasteMotionGeometry.analysisLineOpacity(index: $0, density: density) == 1 }
            XCTAssertEqual(visible, Array(stride(from: 0, to: 48, by: spacing)))
        }
        for density in [0.25, 0.75] {
            let fading = (0..<48).filter {
                let opacity = TasteMotionGeometry.analysisLineOpacity(index: $0, density: density)
                return opacity > 0 && opacity < 1
            }
            XCTAssertEqual(fading.count, density < 0.5 ? 12 : 24)
            for index in fading {
                XCTAssertEqual(TasteMotionGeometry.analysisLineOpacity(index: index, density: density), 0.5)
            }
        }
        for style in TasteMotionStyle.allCases where style != .feedbackRings {
            let first = TasteMotionGeometry.points(style: style, time: 0)
            XCTAssertEqual(first, TasteMotionGeometry.points(style: style, time: style.duration))
            XCTAssertNotEqual(first, TasteMotionGeometry.points(style: style, time: style.duration / 4))
            for sample in 0...16 {
                let points = TasteMotionGeometry.points(style: style, time: style.duration * Double(sample) / 16)
                for point in points {
                    XCTAssertTrue(point.x.isFinite && point.y.isFinite)
                    XCTAssertTrue((0...640).contains(point.x) && (0...640).contains(point.y))
                }
            }
            let last = TasteMotionGeometry.points(style: style, time: style.duration - 1.0 / (style == .rotatingLayers ? 300 : 30))
            for (a, b) in zip(first, last) {
                XCTAssertLessThan(hypot(a.x - b.x, a.y - b.y), 8)
            }
        }
        for index in 0..<126 {
            let opacity = TasteMotionGeometry.dotOpacity(index: index, time: 0)
            XCTAssertTrue((0...1).contains(opacity))
            XCTAssertEqual(opacity, TasteMotionGeometry.dotOpacity(index: index, time: TasteMotionStyle.insightRing.duration))
        }
    }

    func testChipContractKeepsReactVariantMatrix() {
        XCTAssertEqual(ChipSize.allCases.count, 3)
        XCTAssertEqual(ChipTone.allCases.count, 4)
        XCTAssertEqual(ChipVariant.allCases.count, 4)

        XCTAssertEqual(ChipSize.extraSmall.horizontalPadding, 8)
        XCTAssertEqual(ChipSize.small.horizontalPadding, 10)
        XCTAssertEqual(ChipSize.medium.horizontalPadding, 12)
        XCTAssertEqual(ChipSize.extraSmall.verticalPadding, 4)
        XCTAssertEqual(ChipSize.small.verticalPadding, 6)
        XCTAssertEqual(ChipSize.medium.verticalPadding, 8)
    }

    func testSearchOverlayShellMirrorsReactSearchChromeMetrics() {
        XCTAssertEqual(SearchOverlayShellMetrics.fieldHeight, 44)
        XCTAssertEqual(SearchOverlayShellMetrics.iconButtonSize, 44)
        XCTAssertEqual(SearchOverlayShellMetrics.headerHorizontalPadding, 20)
        XCTAssertEqual(SearchOverlayShellMetrics.headerTopPadding, 8)
        XCTAssertEqual(SearchOverlayShellMetrics.headerBottomPadding, 8)
        XCTAssertEqual(SearchOverlayShellMetrics.headerGap, 8)
        XCTAssertEqual(SearchOverlayShellMetrics.bodyTopPadding, 8)
        XCTAssertEqual(SearchOverlayShellMetrics.bodyBottomPadding, 32)
        XCTAssertEqual(HomeSearchHeaderMetrics.horizontalPadding, 20)
        XCTAssertEqual(HomeSearchHeaderMetrics.topPadding, 8)
        XCTAssertEqual(HomeSearchHeaderMetrics.bottomPadding, 8)
        XCTAssertEqual(SearchSuggestionMetrics.sectionStackGap, 20)
        XCTAssertEqual(SearchSuggestionMetrics.cardStackGap, 12)
        XCTAssertEqual(SearchSuggestionMetrics.titleDescriptionGap, 4)
        XCTAssertEqual(SearchSuggestionMetrics.chipGap, 8)
        XCTAssertEqual(SearchSuggestionChipTone.recommended.symbol, "sparkles")
        XCTAssertEqual(SearchSuggestionChipTone.recent.symbol, "clock")
    }

    func testCompactCardMirrorsReactSlotMetrics() {
        XCTAssertEqual(CompactCardMetrics.padding, 12)
        XCTAssertEqual(CompactCardMetrics.gap, 12)
        XCTAssertEqual(CompactCardMetrics.radius, 20)
        XCTAssertEqual(CompactCardMetrics.mediaSize, 40)
        XCTAssertEqual(CompactCardMetrics.actionButtonSize, 24)
        XCTAssertEqual(CompactCardMetrics.actionIconSize, 18)
        XCTAssertEqual(SearchResultCompactCardMetrics.actionButtonSize, 32)
        XCTAssertEqual(SearchResultCompactCardMetrics.actionIconSize, 24)
    }

    func testFlowSelectionAndStepComponentsMirrorReactMetrics() {
        XCTAssertEqual(FlowBottomCtaMetrics.horizontalPadding, 20)
        XCTAssertEqual(FlowBottomCtaMetrics.bottomPadding, 12)
        XCTAssertEqual(FlowBottomCtaMetrics.minHeight, 140)
        XCTAssertEqual(FlowBottomCtaMetrics.secondaryButtonGap, 8)
        XCTAssertEqual(FlowBottomCtaMetrics.stepIndicatorBottomMargin, 32)
        XCTAssertEqual(FlowBottomCtaMetrics.indicatorToHelperGap, 6)
        XCTAssertEqual(FlowBottomCtaMetrics.helperBottomMargin, 8)

        XCTAssertEqual(StepIndicatorMetrics.gap, 6)
        XCTAssertEqual(StepIndicatorMetrics.activeWidth, 16)
        XCTAssertEqual(StepIndicatorMetrics.inactiveWidth, 6)
        XCTAssertEqual(StepIndicatorMetrics.height, 6)

        XCTAssertEqual(SelectionCardMetrics.gap, 12)
        XCTAssertEqual(SelectionCardMetrics.padding, 16)
        XCTAssertEqual(SelectionCardMetrics.indicatorSize, 18)
        XCTAssertEqual(SelectionCardMetrics.indicatorTopPadding, 2)
        XCTAssertEqual(SelectionCardMetrics.radioDotSize, 8)
        XCTAssertEqual(SelectionCardMetrics.checkboxRadius, 6)
        XCTAssertEqual(SelectionCardMetrics.cardRadius, 20)
    }

    func testFlowAndSelectionComponentsExposeRemainingReactSlots() {
        XCTAssertEqual(PrimaryButtonSize.default.height, 48)
        XCTAssertEqual(PrimaryButtonSize.default.fontSize, 14)
        XCTAssertEqual(PrimaryButtonSize.compact.height, 40)
        XCTAssertEqual(PrimaryButtonSize.compact.fontSize, 12)

        let bottomCta = TBFlowBottomCTA(
            actionLabel: "계속",
            actionVisualDisabled: true,
            actionFullWidth: false,
            actionSize: .compact,
            secondaryButtonVisualDisabled: true,
            secondaryActionView: AnyView(Text("나중에 하기")),
            topSlot: AnyView(TBStepIndicator(currentIndex: 0, total: 3)),
            action: {}
        )
        XCTAssertTrue(bottomCta.actionVisualDisabled)
        XCTAssertFalse(bottomCta.actionFullWidth)
        XCTAssertEqual(bottomCta.actionSize, PrimaryButtonSize.compact)
        XCTAssertTrue(bottomCta.secondaryButtonVisualDisabled)
        XCTAssertNotNil(bottomCta.secondaryActionView)
        XCTAssertNotNil(bottomCta.topSlot)

        let stepCta = TBFlowStepCTA(
            actionLabel: "다음",
            currentIndex: 1,
            total: 4,
            actionVisualDisabled: true,
            stepLabel: "2 / 4",
            secondaryButtonVisualDisabled: true,
            action: {}
        )
        XCTAssertTrue(stepCta.actionVisualDisabled)
        XCTAssertEqual(stepCta.stepLabel, "2 / 4")
        XCTAssertTrue(stepCta.secondaryButtonVisualDisabled)

        let selectionCard = TBSelectionCard(
            title: "가벼운 시작이 좋아요",
            trailing: AnyView(StatusChip(title: "선택됨")),
            action: {}
        )
        XCTAssertNotNil(selectionCard.trailing)

        let header = TBFlowHeaderBlock(
            title: "식사 취향은 어떤 흐름에 가까운가요?",
            topLeftSlot: AnyView(OutlineBadge(title: "사전 조사")),
            topRightSlot: AnyView(StatusChip(title: "1 / 7"))
        )
        XCTAssertNotNil(header.topLeftSlot)
        XCTAssertNotNil(header.topRightSlot)
    }

    func testImageAvatarStatusAndEmptyStateMirrorReactSystemTokens() {
        XCTAssertEqual(TokenBoxMetrics.radius, 8)
        XCTAssertEqual(TokenBoxMetrics.smallSize, 32)
        XCTAssertEqual(TokenBoxMetrics.mediumSize, 40)
        XCTAssertEqual(TokenBoxMetrics.largeSize, 48)

        XCTAssertEqual(ImageBoxMetrics.radius, 8)
        XCTAssertEqual(ImageBoxMetrics.smallSize, 32)
        XCTAssertEqual(ImageBoxMetrics.mediumSize, 40)
        XCTAssertEqual(ImageBoxMetrics.largeSize, 48)
        XCTAssertEqual(ImageBoxMetrics.fallbackIconSmall, TBIcon.Size.small)
        XCTAssertEqual(ImageBoxMetrics.fallbackIconMedium, TBIcon.Size.medium)
        XCTAssertEqual(ImageBoxMetrics.fallbackIconLarge, TBIcon.Size.large)
        XCTAssertEqual(ChefImageResolver.bundledImageName(for: "강민구 셰프"), "KangMingoo")
        XCTAssertEqual(ChefImageResolver.bundledImageName(for: "온지음 셰프"), "OnjiumChefs")

        XCTAssertEqual(StatusChipMetrics.radius, 6)
        XCTAssertEqual(StatusChipMetrics.horizontalPadding, 6)
        XCTAssertEqual(StatusChipMetrics.verticalPadding, 2)
        XCTAssertEqual(StatusChipMetrics.fontSize, 10)

        XCTAssertEqual(EmptyStateMetrics.verticalPadding, 48)
        XCTAssertEqual(EmptyStateMetrics.horizontalPadding, 24)
        XCTAssertEqual(EmptyStateMetrics.gap, 16)
        XCTAssertEqual(EmptyStateMetrics.iconContainerSize, 32)
        XCTAssertEqual(EmptyStateMetrics.iconRadius, 14)
        XCTAssertEqual(EmptyStateMetrics.titleSize, 16)
        XCTAssertEqual(EmptyStateMetrics.descriptionSize, 13)

        XCTAssertEqual(TasteMatchRecommendationCardMetrics.width, 132)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.height, 132)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.radius, 20)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.padding, 12)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.gap, 12)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.avatarSize, 42)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.imageBoxSize.sideLength, 48)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.imageFallbackIconSize, 28)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.borderOpacity, 0.18)
    }

    func testHomeRecommendationEngineMirrorsReactAxisRanking() {
        let sourFirstProfile = TasteProfile(
            createdAt: .now,
            scores: [
                "sweet": 58,
                "sour": 95,
                "bitter": 42,
                "salty": 46,
                "umami": 76,
                "fat": 40,
            ],
            confidence: "Starter",
            summary: "fixture",
            topAxes: [.sour, .umami],
            cautionAxis: .fat
        )

        let recommendations = HomeRecommendationEngine.recommendations(
            items: TasteBuddyNativeContent.tasteMatchFeed,
            viewerProfile: sourFirstProfile,
            mode: .buddy
        )

        XCTAssertEqual(recommendations.map(\.item.reviewerID), ["mina", "hyeon", "jae"])
        XCTAssertEqual(recommendations.first?.sourceAxis, .sour)
        XCTAssertEqual(Set(recommendations.map(\.item.reviewerID)).count, recommendations.count)
    }

    func testHomeRecommendationEngineKeepsHighestMatchPerEntityWithoutViewerProfile() {
        let original = TasteBuddyNativeContent.tasteMatchFeed[0]
        let lowerMatchDuplicate = TasteMatchFeedItem(
            id: "duplicate-mina",
            reviewerID: original.reviewerID,
            reviewerName: original.reviewerName,
            reviewerHandle: original.reviewerHandle,
            reviewerTasteScores: original.reviewerTasteScores,
            reviewerConfidenceScores: original.reviewerConfidenceScores,
            relationLabel: original.relationLabel,
            restaurantID: "duplicate-restaurant",
            restaurantName: "중복 레스토랑",
            dishTitle: "중복 메뉴",
            reason: original.reason,
            supportingSignals: original.supportingSignals,
            tasteTags: original.tasteTags,
            experienceTags: original.experienceTags,
            sharedSignals: original.sharedSignals,
            learnedConfidenceScore: original.learnedConfidenceScore,
            matchRate: original.matchRate - 10,
            axis: original.axis
        )

        let recommendations = HomeRecommendationEngine.recommendations(
            items: [lowerMatchDuplicate, original],
            viewerProfile: nil,
            mode: .buddy
        )

        XCTAssertEqual(recommendations.count, 1)
        XCTAssertEqual(recommendations.first?.item.id, original.id)
    }

    func testFallbackBuddyMatchScoreUsesReactClampRange() {
        let score = HomeRecommendationEngine.profileMatchScore(
            reviewerTasteScores: Dictionary(
                uniqueKeysWithValues: TasteAxis.allCases.map { ($0.rawValue, 100) }
            ),
            viewerProfile: CalibrationEngine.makeProfile(
                responses: Dictionary(
                    uniqueKeysWithValues: TasteAxis.allCases.map { ($0, -3) }
                )
            )
        )

        XCTAssertEqual(score, 50)
    }

    func testRestaurantAndChefRecommendationCardsMirrorReactLocalLogic() {
        XCTAssertEqual(HomeRecommendationEngine.chefName(for: "밍글스"), "강민구")
        XCTAssertEqual(HomeRecommendationEngine.chefName(for: "숍리제 (Lysée)"), "이은지")
        XCTAssertEqual(HomeRecommendationEngine.chefName(for: "숍리제 (Lysee)"), "이은지")
        XCTAssertEqual(HomeRecommendationEngine.chefName(for: "정식당"), "임정식")
        XCTAssertEqual(HomeRecommendationEngine.chefName(for: "온지음"), "온지음 셰프")

        XCTAssertEqual(ChefImageResolver.bundledImageName(for: "강민구"), "KangMingoo")
        XCTAssertEqual(ChefImageResolver.bundledImageName(for: "이은지"), "LeeEunji")
        XCTAssertEqual(ChefImageResolver.bundledImageName(for: "임정식"), "LimJeongsik")
    }

    func testOverlayAndBottomSheetShellMirrorReactChromeMetrics() {
        XCTAssertEqual(ActionOverlayCardMetrics.overlayOpacity, 0.35)
        XCTAssertEqual(ActionOverlayCardMetrics.horizontalPadding, 20)
        XCTAssertEqual(ActionOverlayCardMetrics.cardMaxWidth, 320)
        XCTAssertEqual(ActionOverlayCardMetrics.cardRadius, 20)
        XCTAssertEqual(ActionOverlayCardMetrics.stackPadding, 16)
        XCTAssertEqual(ActionOverlayCardMetrics.customContentHorizontalPadding, 20)
        XCTAssertEqual(ActionOverlayCardMetrics.customContentVerticalPadding, 16)
        XCTAssertEqual(ActionOverlayCardMetrics.actionHeight, 44)

        XCTAssertEqual(BottomSheetShellMetrics.overlayOpacity, 0.60)
        XCTAssertEqual(BottomSheetShellMetrics.stageHeightRatio, 0.98)
        XCTAssertEqual(BottomSheetShellMetrics.authEntryEmailMaxHeightRatio, 0.72)
        XCTAssertEqual(BottomSheetShellMetrics.stageTopInset, 12)
        XCTAssertEqual(BottomSheetShellMetrics.maxWidth, 1440)
        XCTAssertEqual(
            BottomSheetShellMetrics.stageHeight(screenHeight: 800, safeAreaTop: 47),
            725
        )
        XCTAssertEqual(StagedBottomSheetBackgroundMetrics.animationDuration, TasteBloomMotion.duration(.sheet, reduceMotion: false))
        XCTAssertEqual(BottomSheetShellMetrics.topRadius, 32)
        XCTAssertTrue(BottomSheetShellMetrics.clipsOnlyTopCorners)
        XCTAssertTrue(BottomSheetShellMetrics.usesCustomGrabber)
        XCTAssertEqual(BottomSheetShellMetrics.grabberTopMargin, 5)
        XCTAssertEqual(BottomSheetShellMetrics.grabberHeight, 5)
        XCTAssertEqual(BottomSheetShellMetrics.grabberToHeaderSpacing, 0)
        XCTAssertEqual(BottomSheetShellMetrics.grabberWidth, 36)
        XCTAssertEqual(BottomSheetShellMetrics.topAreaHeightIncludingGrabber, 10)
        XCTAssertEqual(BottomSheetShellMetrics.headerHorizontalPadding, 20)
        XCTAssertEqual(BottomSheetShellMetrics.headerTopPadding, 20)
        XCTAssertEqual(BottomSheetShellMetrics.headerBottomPadding, 12)
        XCTAssertEqual(BottomSheetShellMetrics.headerSlotSize, 32)
        XCTAssertEqual(BottomSheetShellMetrics.footerHorizontalPadding, 20)
        XCTAssertEqual(BottomSheetShellMetrics.footerTopPadding, 16)
        XCTAssertEqual(BottomSheetShellMetrics.footerBottomPadding, 12)
        XCTAssertEqual(BottomSheetShellMetrics.footerBottomPadding(safeAreaBottom: 0), 12)
        XCTAssertEqual(BottomSheetShellMetrics.footerBottomPadding(safeAreaBottom: 34), 34)
        XCTAssertEqual(BottomSheetShellMetrics.footerSafeAreaAccessoryTopGap, 12)
        XCTAssertEqual(BottomSheetShellMetrics.footerSafeAreaAccessoryHeight, 28)
        XCTAssertEqual(
            BottomSheetShellMetrics.footerSafeAreaHeight(
                safeAreaBottom: 0,
                accessoryHeight: nil
            ),
            12
        )
        XCTAssertEqual(
            BottomSheetShellMetrics.footerSafeAreaHeight(
                safeAreaBottom: 34,
                accessoryHeight: 28
            ),
            52
        )
        XCTAssertEqual(
            BottomSheetShellMetrics.footerSafeAreaHeight(
                safeAreaBottom: 34,
                accessoryHeight: 68
            ),
            92
        )
        XCTAssertEqual(BottomSheetShellMetrics.iconButtonSize, 32)
        XCTAssertEqual(BottomSheetShellMetrics.iconSize, TBIcon.Size.large)
    }

    func testBottomSheetScrollGeometryHandsDownwardDragToSheetAtBoundary() {
        let fittingContent = BottomSheetScrollGeometry(
            contentHeight: 400,
            viewportHeight: 500,
            contentMinY: 0
        )
        XCTAssertFalse(fittingContent.isScrollable)
        XCTAssertTrue(fittingContent.allowsSheetDrag)

        let longContentAtTop = BottomSheetScrollGeometry(
            contentHeight: 800,
            viewportHeight: 500,
            contentMinY: 0
        )
        XCTAssertTrue(longContentAtTop.isScrollable)
        XCTAssertTrue(longContentAtTop.isAtTop)
        XCTAssertTrue(longContentAtTop.allowsSheetDrag)

        let longContentScrolled = BottomSheetScrollGeometry(
            contentHeight: 800,
            viewportHeight: 500,
            contentMinY: -120
        )
        XCTAssertTrue(longContentScrolled.isScrollable)
        XCTAssertFalse(longContentScrolled.isAtTop)
        XCTAssertFalse(longContentScrolled.allowsSheetDrag)
    }

    func testNativeDesignSystemInventoryMirrorsReactDesignSystemPage() {
        XCTAssertEqual(NativeDesignSystemInventory.architectureGroups.count, 7)
        XCTAssertEqual(NativeDesignSystemInventory.totalArchitectureComponentCount, 59)
        XCTAssertEqual(NativeDesignSystemInventory.currentlyUsedComponentCount, 32)
        XCTAssertEqual(NativeDesignSystemInventory.unusedPrimitiveCount, 20)
        XCTAssertEqual(NativeDesignSystemInventory.componentStyleSpecCount, 30)
        XCTAssertEqual(NativeDesignSystemInventory.filePreviewEntries.count, 52)
        XCTAssertTrue(
            NativeDesignSystemInventory.filePreviewEntries.contains("src/components/system/TCSHintCard.tsx")
        )
        XCTAssertTrue(
            NativeDesignSystemInventory.filePreviewEntries.contains("src/pages/ReservationConfirmationScreen.tsx")
        )
    }

    func testNativeThemeMirrorsFullReactDesignTokenLayer() {
        XCTAssertEqual(TBTypography.FontSize.x10, 10)
        XCTAssertEqual(TBTypography.FontSize.x18, 18)
        XCTAssertEqual(TBTypography.FontSize.x28, 18)
        XCTAssertEqual(TBTypography.Weight.regular, 400)
        XCTAssertEqual(TBTypography.Weight.medium, 500)
        XCTAssertEqual(TBTypography.Weight.semibold, 600)
        XCTAssertEqual(TBTypography.Weight.bold, 700)
        XCTAssertEqual(TBTypography.LineHeight.tight, 1.2)
        XCTAssertEqual(TBTypography.LineHeight.snug, 1.35)
        XCTAssertEqual(TBTypography.LineHeight.normal, 1.4)
        XCTAssertEqual(TBTypography.LineHeight.relaxed, 1.5)
        XCTAssertEqual(TBTypography.LetterSpacing.tight, -0.24)
        XCTAssertEqual(TBTypography.LetterSpacing.micro, 0.14)

        XCTAssertEqual(TBSize.screenMaxWidth, 1440)
        XCTAssertEqual(TBSize.tasteLoopSize, 320)
        XCTAssertEqual(TBSize.tasteLoopGuideDotDiameter, 1)
        XCTAssertEqual(TBSize.tasteLoopGuideDotGap, 3)
        XCTAssertEqual(TBSize.tasteLoopGuideRadius, 138)
        XCTAssertEqual(TBSize.tasteLoopNodeRadius, 12)
        XCTAssertEqual(TBSize.tasteLoopOuterRingThickness, 24)
        XCTAssertEqual(TBSize.tasteLoopStepCount, 10)

        XCTAssertEqual(TBMotion.Duration.fast, 0.18)
        XCTAssertEqual(TBMotion.Duration.normal, 0.30)
        XCTAssertEqual(TBMotion.Duration.medium, 0.50)
        XCTAssertEqual(TBMotion.Duration.splash, 2.50)
        XCTAssertEqual(TBMotion.Scale.press, 0.98)
        XCTAssertEqual(TBMotion.Distance.onboardingSwipe, 100)

        XCTAssertEqual(TBDataViz.Progress.barHeight, 8)
        XCTAssertEqual(TBDataViz.Radar.size, 320)
        XCTAssertEqual(TBDataViz.Radar.labelSize, 10)
        XCTAssertEqual(TBDataViz.Radar.nodeSize, 3)
        XCTAssertEqual(TBDataViz.Trend.lineStrokeWidth, 1)
        XCTAssertEqual(TBDataViz.Trend.dotSize, 4)
        XCTAssertEqual(TBDataViz.Trend.activeDotSize, 5)
        XCTAssertEqual(TBDataViz.Ring.outerSize, 320)
        XCTAssertEqual(TBDataViz.Ring.stepCount, 10)
    }

    func testDesignColorTokenMirrorExposesCompleteReactColorLayer() {
        XCTAssertEqual(TBDesignColorTokens.ColorTokens.all.count, 34)
        XCTAssertEqual(TBDesignColorTokens.ShadowTokens.all.count, 5)
        XCTAssertEqual(TBDesignColorTokens.DataVizTokens.all.count, 7)
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.all.count, 150)
        XCTAssertEqual(TBDesignColorTokens.NeutralTasteTokens.all.count, 2)
        XCTAssertEqual(TBDesignColorTokens.designTokensAll.count, 193)
        XCTAssertEqual(TBDesignColorTokens.designTokensColorLikeAll.count, 198)

        XCTAssertEqual(TBDesignColorTokens.CSSVariables.Color.all.count, 34)
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.Shadow.all.count, 6)
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.DataViz.all.count, 7)
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.Taste.all.count, 78)
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.NeutralTaste.all.count, 2)
        XCTAssertEqual(TBDesignColorTokens.cssVariableAll.count, 127)
        XCTAssertEqual(Set(TBDesignColorTokens.cssVariableAll.compactMap(\.cssVariable)).count, 127)

        XCTAssertEqual(TBDesignColorTokens.ColorTokens.Background.page.rawValue, "#F3F3F3")
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.Color.bgPage.rawValue, "#f3f3f3")
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.Sweet.paletteTokens.count, 10)
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.Sweet.nodeColors.count, 10)
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.all(for: .sweet).count, 25)
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.paletteMain(for: .umami).rawValue, "#B372B4")
        XCTAssertEqual(
            TBDesignColorTokens.TasteTokens.Sweet.gradient.rawValue,
            "linear-gradient(135deg, #FF9900, #FFB84D)"
        )
        XCTAssertEqual(
            TBDesignColorTokens.TasteTokens.Sweet.ringBaseColorSoft.value,
            .hexRGBA(0xFFEBCC1A)
        )
        XCTAssertEqual(
            TBDesignColorTokens.CSSVariables.Taste.Sweet.ringBase.value,
            .alias(cssVariable: "--tb-taste-sweet-tint-surface")
        )
        XCTAssertEqual(
            TBDesignColorTokens.CSSVariables.byVariable["--tb-taste-fat-ring-base"]?.rawValue,
            "var(--tb-taste-fat-tint-surface)"
        )
    }

    func testDesignFoundationTokenMirrorExposesCompleteReactTokenLayer() {
        XCTAssertEqual(TBDesignFoundationTokens.SpacingTokens.all.count, 10)
        XCTAssertEqual(TBDesignFoundationTokens.RadiusTokens.all.count, 8)
        XCTAssertEqual(TBDesignFoundationTokens.TypographyTokens.all.count, 24)
        XCTAssertEqual(TBDesignFoundationTokens.ShadowTokens.all.count, 5)
        XCTAssertEqual(TBDesignFoundationTokens.MotionTokens.all.count, 22)
        XCTAssertEqual(TBDesignFoundationTokens.IconTokens.all.count, 18)
        XCTAssertEqual(TBDesignFoundationTokens.BoxTokens.all.count, 3)
        XCTAssertEqual(TBDesignFoundationTokens.DataVizTokens.all.count, 21)
        XCTAssertEqual(TBDesignFoundationTokens.LayoutTokens.all.count, 20)
        XCTAssertEqual(TBDesignFoundationTokens.foundationAll.count, 131)

        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Card.all.count, 4)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Button.all.count, 6)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Badge.all.count, 3)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Chip.Size.all.count, 15)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Chip.Tone.all.count, 48)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Chip.all.count, 64)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Pill.all.count, 1)
        XCTAssertEqual(TBDesignFoundationTokens.componentAll.count, 78)
        XCTAssertEqual(TBDesignFoundationTokens.designTokensAll.count, 209)

        XCTAssertEqual(TBDesignFoundationTokens.CSSVariables.nonColorAll.count, 121)
        XCTAssertEqual(
            Set(TBDesignFoundationTokens.CSSVariables.nonColorAll.compactMap(\.cssVariable)).count,
            121
        )

        XCTAssertEqual(TBDesignFoundationTokens.SpacingTokens.x20.rawValue, "20px")
        XCTAssertEqual(TBDesignFoundationTokens.RadiusTokens.full.value, .pixels(9999))
        XCTAssertEqual(TBDesignFoundationTokens.TypographyTokens.FontSize.x28.rawValue, "18px")
        XCTAssertEqual(TBDesignFoundationTokens.MotionTokens.DurationMs.splash.value, .milliseconds(2500))
        XCTAssertEqual(TBDesignFoundationTokens.IconTokens.Size.base.cssVariable, nil)
        XCTAssertEqual(TBDesignFoundationTokens.LayoutTokens.sectionGap.rawValue, "SPACING_TOKENS[20]")
        XCTAssertEqual(TBDesignFoundationTokens.LayoutTokens.sectionGap.value, .alias("SPACING_TOKENS.20"))

        let cssSectionGap = TBDesignFoundationTokens.CSSVariables.nonColorAll.first {
            $0.cssVariable == "--tb-layout-section-gap"
        }
        XCTAssertEqual(cssSectionGap?.rawValue, "20px")

        let cssChipRadius = TBDesignFoundationTokens.CSSVariables.nonColorAll.first {
            $0.cssVariable == "--tb-chip-radius"
        }
        XCTAssertEqual(cssChipRadius?.rawValue, "var(--tb-radius-full)")
        XCTAssertEqual(cssChipRadius?.value, .alias("--tb-radius-full"))
    }

    func testProfileConfidenceStageCopyMatchesReactContract() {
        XCTAssertEqual(
            ProfileConfidenceStage.allCases.map(\.rawValue),
            ["Starter", "Building", "Refined"]
        )
        XCTAssertEqual(ProfileConfidenceStage.starter.caption, "첫 측정 기준")
        XCTAssertEqual(ProfileConfidenceStage.building.caption, "반복 학습 중")
        XCTAssertEqual(ProfileConfidenceStage.refined.caption, "충분히 안정화")
        XCTAssertTrue(ProfileConfidenceStage.building.title.contains("Building"))
        XCTAssertTrue(ProfileConfidenceStage.refined.nextStep.contains("예약"))
    }

    func testFreshProfileUsesTodayMeasurementAgeLabel() {
        let profile = TasteProfile(
            createdAt: .now,
            scores: Dictionary(
                uniqueKeysWithValues: TasteAxis.allCases.map { ($0.rawValue, 50) }
            ),
            confidence: "Starter",
            summary: "fixture",
            topAxes: [.sweet, .sour],
            cautionAxis: .fat
        )

        XCTAssertEqual(profile.measurementAgeLabel, "오늘")
    }

    func testAppChromeMatchesReactShellContract() {
        XCTAssertEqual(TBSize.topAppBarHeight, 32)
        XCTAssertEqual(TBSize.bottomTabBarHeight, 60)
        XCTAssertEqual(AppChromeMetrics.actionButtonSize, 32)
        XCTAssertEqual(AppChromeMetrics.iconSize, TBIcon.Size.large)
        XCTAssertEqual(AppChromeMetrics.actionGap, 8)
        XCTAssertEqual(AppChromeMetrics.avatarSize, 32)
        XCTAssertEqual(AppChromeMetrics.topPadding, 8)
        XCTAssertEqual(AppChromeMetrics.bottomPadding, 8)
        XCTAssertEqual(MainTabProgressiveBlurMetrics.maxBlurRadius, 8)
        XCTAssertEqual(
            MainTabProgressiveBlurMetrics.fadeExtension,
            AppChromeMetrics.bottomPadding
        )
        XCTAssertEqual(MainTabProgressiveBlurMetrics.tintOpacityTop, 0.0)
        XCTAssertEqual(MainTabProgressiveBlurMetrics.tintOpacityMiddle, 0.0)
        XCTAssertEqual(AppChromeMetrics.backgroundOverlap, 1)
        XCTAssertEqual(AppChromeMetrics.tabHorizontalPadding, 16)
        XCTAssertEqual(AppChromeMetrics.tabLabelTracking, 0.14)
        XCTAssertEqual(
            MainTab.allCases.map(\.rawValue),
            ["home", "analysis", "dining", "profile"]
        )
        XCTAssertEqual(
            MainTab.allCases.map(\.title),
            ["홈", "나의 입맛", "다이닝", "프로필"]
        )
        XCTAssertEqual(
            TopAppBarPrimaryAction.measurement.accessibilityLabel,
            "미각 측정 시작"
        )
        XCTAssertEqual(
            TopAppBarPrimaryAction.search.accessibilityLabel,
            "통합 검색 열기"
        )
    }

    @MainActor
    func testInsightAndMenuBottomContentRemainsVisible() async throws {
        let viewport = CGRect(x: 0, y: 0, width: 402, height: 874)
        let meals = (0..<8).map { index in
            DiningEntry(restaurant: "검증 식당", menu: "기록 \(index + 1)",
                        date: .now.addingTimeInterval(-Double(index + 1) * 86_400),
                        rating: 0, note: "마지막 기록까지 확인합니다.")
        }
        let model = AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: meals)
        let screens: [(String, AnyView)] = [
            ("인사이트", AnyView(AppShellView(initialRoute: .homeInsight(.record)).environmentObject(model).environment(\.scenePhase, .active))),
            ("인사이트 기록 1개", AnyView(AppShellView(initialRoute: .homeInsight(.record))
                .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: [meals[0]]))
                .environment(\.scenePhase, .active))),
            ("인사이트 빈 상태", AnyView(AppShellView(initialRoute: .homeInsight(.record))
                .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: []))
                .environment(\.scenePhase, .active))),
            ("메뉴 선택", AnyView(DiningFeedbackSheet(entry: .sample, startMode: .menu) { _ in }.environmentObject(model))),
        ]
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let previousWindow = scene.windows.first { $0.isKeyWindow }
        let window = UIWindow(windowScene: scene)
        window.frame = viewport
        defer {
            window.isHidden = true
            window.rootViewController = nil
            previousWindow?.makeKey()
        }
        func descendants(_ view: UIView) -> [UIView] { [view] + view.subviews.flatMap(descendants) }

        for (name, screen) in screens {
            let isInsight = name.hasPrefix("인사이트")
            let host = UIHostingController(rootView: screen)
            window.rootViewController = host
            window.makeKeyAndVisible()
            try await Task.sleep(for: .milliseconds(300))
            if name == "인사이트" { try await Task.sleep(for: .seconds(5)) }
            window.layoutIfNeeded()
            host.view.layoutIfNeeded()
            let scroll = try XCTUnwrap(descendants(host.view).compactMap { $0 as? UIScrollView }
                .filter { $0.window === window }
                .max { $0.bounds.height < $1.bounds.height }, name)
            XCTAssertLessThanOrEqual(scroll.contentSize.width, scroll.bounds.width + 1,
                                     "점 링과 기록 행이 화면 가로폭을 벗어나지 않아야 한다.")
            if isInsight {
                XCTAssertEqual(scroll.convert(scroll.bounds, to: window).maxY, window.bounds.maxY, accuracy: 1,
                               "인사이트 스크롤은 하단 안전영역 위에서 잘리지 않아야 한다.")
            }
            let end = max(-scroll.adjustedContentInset.top,
                          scroll.contentSize.height + scroll.adjustedContentInset.bottom - scroll.bounds.height)
            XCTAssertGreaterThan(end, -scroll.adjustedContentInset.top, "마지막 항목까지 스크롤할 수 있는 기록으로 검사한다.")
            let start = -scroll.adjustedContentInset.top
            if isInsight {
                XCTAssertGreaterThanOrEqual(end - start, 348 - 1, "기록이 적거나 없어도 링을 완전히 접고 틴트 전환을 끝낼 수 있어야 한다.")
            }
            // 402pt 화면의 링은 340pt 높이, 위 여백은 8pt다. 중간 두 위치의 혼합색도 검사한다.
            let positions = isInsight
                ? [("처음", start, 0.0), ("링 일부 가림", start + 80, 0), ("전환 직전", start + 232, 0),
                   ("40퍼센트 혼합", start + 280, 0.4), ("약 75퍼센트 혼합", start + 320, 0.75),
                   ("링 완전히 가림", min(start + 400, end), 1), ("끝", end, 1), ("다시 처음", start, 0)]
                : [("처음", start, 0.0), ("끝", end, 0)]
            for (position, offset, tintFraction) in positions {
                scroll.setContentOffset(CGPoint(x: 0, y: offset), animated: false)
                try await Task.sleep(for: .milliseconds(400))
                host.view.layoutIfNeeded()
                XCTAssertEqual(scroll.contentOffset.y, offset, accuracy: 1)
                let image = UIGraphicsImageRenderer(bounds: window.bounds).image { _ in
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                if isInsight {
                    var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
                    UIColor(TBColor.page).getRed(&red, green: &green, blue: &blue, alpha: &alpha)
                    var tintRed: CGFloat = 0, tintGreen: CGFloat = 0, tintBlue: CGFloat = 0
                    UIColor(TasteAxis.umami.tintSurfaceColor).getRed(&tintRed, green: &tintGreen, blue: &tintBlue, alpha: &alpha)
                    let expectedChannels = zip([red, green, blue], [tintRed, tintGreen, tintBlue])
                        .map { base, tint in base * (1 - tintFraction) + tint * tintFraction }
                    for point in [CGPoint(x: 4, y: 8), CGPoint(x: 4, y: window.bounds.height - 8)] {
                        let crop = try XCTUnwrap(image.cgImage?.cropping(to: CGRect(x: point.x * image.scale, y: point.y * image.scale, width: 1, height: 1)))
                        var pixel = [UInt8](repeating: 0, count: 4)
                        try pixel.withUnsafeMutableBytes { buffer in
                            let context = try XCTUnwrap(CGContext(data: buffer.baseAddress, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4,
                                                                space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
                            context.draw(crop, in: CGRect(x: 0, y: 0, width: 1, height: 1))
                        }
                        // 상태바는 투명 블러로 인접한 콘텐츠 색이 조금 섞인다.
                        let tolerance = point.y < 10 ? 6.0 / 255 : 2.0 / 255
                        for (actual, expected) in zip(pixel.prefix(3), expectedChannels) {
                            XCTAssertEqual(Double(actual) / 255, Double(expected), accuracy: tolerance,
                                           "\(position): 상태바와 화면 배경이 링의 가림 여부에 따라 배경색을 따라야 한다.")
                        }
                    }
                }
                let attachment = XCTAttachment(image: image)
                attachment.name = "\(name) 하단 · \(position)"
                attachment.lifetime = .keepAlways
                add(attachment)
            }
        }

        let clip = TopOverflowRoundedRectangle(cornerRadius: 0, topOverflowInset: 59, bottomOverflowInset: 34)
            .path(in: viewport)
        XCTAssertTrue(clip.contains(CGPoint(x: viewport.midX, y: viewport.maxY + 33)),
                      "메뉴 선택의 하단 버튼 배경이 안전영역까지 이어져야 한다.")
        XCTAssertFalse(clip.contains(CGPoint(x: -1, y: viewport.midY)), "가로 잘림 경계는 유지한다.")
    }

    func testInsightRingFillsFromSixSeedsThenExpands() {
        XCTAssertEqual(TasteMotionGeometry.insightFrame(time: 0).dots.filter { $0.opacity > 0 }.count, 6)
        let orange = TasteMotionGeometry.insightFrame(time: 0).dots[0]
        XCTAssertEqual(orange.colorIndex, 0)
        XCTAssertLessThan(orange.point.x, 320)
        XCTAssertLessThan(orange.point.y, 320)
        let full = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightFillEnd)
        for layer in 2...6 {
            let offset = layer * (layer - 1) / 2 * 6
            let start = 0.1 + Double(offset / 6 - 1) * 0.025
            let interval = Double(layer) * 0.025 / ceil(Double(layer) / 2)
            let order = (0..<layer).map { offset + $0 * 6 }.sorted {
                atan2(full.dots[$0].point.y - 320, full.dots[$0].point.x - 320) < atan2(full.dots[$1].point.y - 320, full.dots[$1].point.x - 320)
            }
            for group in 0..<Int(ceil(Double(layer) / 2)) {
                let frame = TasteMotionGeometry.insightFrame(time: start + (Double(group) + 0.5) * interval)
                XCTAssertEqual(frame.bridges.count, layer % 2 == 1 && group == 0 ? 6 : 12)
                for index in 0..<layer {
                    XCTAssertEqual(frame.dots[order[index]].progress, frame.dots[order[layer - 1 - index]].progress)
                }
                for index in 1...(layer / 2) {
                    XCTAssertGreaterThanOrEqual(frame.dots[order[index]].progress, frame.dots[order[index - 1]].progress)
                }
                for bridge in frame.bridges {
                    XCTAssertLessThan(bridge.parent, bridge.child)
                    XCTAssertEqual(frame.dots[bridge.parent].progress, 1)
                    XCTAssertEqual(bridge.colorIndex, bridge.parent % 6)
                    XCTAssertTrue(bridge.points.allSatisfy { $0.x.isFinite && $0.y.isFinite })
                }
            }
            let complete = TasteMotionGeometry.insightFrame(time: start + Double(layer) * 0.025)
            XCTAssertEqual(complete.dots.filter { $0.progress > 1e-8 }.count, layer * (layer + 1) / 2 * 6)
            for dot in complete.dots {
                XCTAssertLessThanOrEqual(hypot(dot.point.x - 320, dot.point.y - 320) + dot.radius, 79 + 1e-8)
            }
        }
        XCTAssertEqual(TasteMotionGeometry.insightFillEnd, 0.6)
        XCTAssertTrue(full.dots.allSatisfy { $0.progress == 1 })
        let held = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightFillEnd + 0.19)
        XCTAssertEqual(full.dots.map(\.point), held.dots.map(\.point))
        var offset = 0
        for ring in 1...6 {
            let count = ring * 6
            let points = full.dots[offset..<(offset + count)].map(\.point).sorted {
                atan2($0.y - 320, $0.x - 320) < atan2($1.y - 320, $1.x - 320)
            }
            let expected = 2 * (79 - 4.8) * Double(ring) / 6 * sin(.pi / Double(count))
            for index in 0..<count {
                let next = points[(index + 1) % count]
                let distance = hypot(points[index].x - next.x, points[index].y - next.y)
                XCTAssertEqual(distance, expected, accuracy: 1e-8)
                XCTAssertTrue((12.36...12.94).contains(distance))
            }
            offset += count
        }
        let expanded = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightIntroDuration)
        XCTAssertEqual(expanded.expansion, 1)
        XCTAssertTrue(expanded.bridges.isEmpty)
        XCTAssertEqual(expanded.dots.map(\.point), TasteMotionGeometry.insightFrame(time: 0, settled: true).dots.map(\.point))
        XCTAssertNotEqual(expanded.dots.map(\.point), TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightIntroDuration + 1).dots.map(\.point))
        for sample in 0...100 {
            let state = TasteMotionGeometry.insightFrame(time: Double(sample) / 10)
            for dot in state.dots {
                XCTAssertTrue(dot.point.x.isFinite && dot.point.y.isFinite)
                XCTAssertTrue((0...9.5).contains(dot.radius))
                XCTAssertTrue((0...1).contains(dot.opacity))
                XCTAssertTrue((dot.radius...(640 - dot.radius)).contains(dot.point.x))
                XCTAssertTrue((dot.radius...(640 - dot.radius)).contains(dot.point.y))
            }
            for bridge in state.bridges {
                for (endpoint, control, index) in [(0, 1, bridge.parent), (7, 6, bridge.parent), (3, 2, bridge.child), (4, 5, bridge.child)] {
                    let point = bridge.points[endpoint], handle = bridge.points[control], circle = state.dots[index]
                    let rx = point.x - circle.point.x, ry = point.y - circle.point.y
                    XCTAssertEqual(hypot(rx, ry), circle.radius, accuracy: 1e-8)
                    XCTAssertEqual(rx * (handle.x - point.x) + ry * (handle.y - point.y), 0, accuracy: 1e-8)
                }
            }
        }
    }

    func testInsightRingColorDepthAndPressAlignment() {
        let packed = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightFillEnd).dots
        var offset = 0, previousOpacity = 1.01
        for ring in 1...6 {
            let dots = packed[offset..<(offset + ring * 6)]
            let opacity = dots.first!.opacity
            XCTAssertLessThan(opacity, previousOpacity)
            for dot in dots { XCTAssertEqual(dot.opacity, opacity, accuracy: 1e-8) }
            previousOpacity = opacity
            offset += ring * 6
        }
        let mixed = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightIntroDuration)
        let grouped = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightIntroDuration, alignment: 1)
        func colorChanges(_ dots: ArraySlice<TasteMotionGeometry.InsightDot>) -> Int {
            let sorted = dots.sorted { atan2($0.point.y - 320, $0.point.x - 320) < atan2($1.point.y - 320, $1.point.x - 320) }
            return sorted.indices.filter { sorted[$0].colorIndex != sorted[($0 + 1) % sorted.count].colorIndex }.count
        }
        XCTAssertGreaterThanOrEqual(colorChanges(mixed.dots[...]), 90)
        XCTAssertEqual(colorChanges(grouped.dots[...]), 6)
        for sector in 0..<6 {
            let radialBands = Set(grouped.dots.filter { $0.colorIndex == sector }.map { Int((hypot($0.point.x - 320, $0.point.y - 320) / 5).rounded()) })
            XCTAssertGreaterThanOrEqual(radialBands.count, 8)
        }
        let movedGroup = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightIntroDuration + 1, alignment: 1).dots
        let groupedMovement = grouped.dots.indices.map { index in
            hypot(grouped.dots[index].point.x - movedGroup[index].point.x, grouped.dots[index].point.y - movedGroup[index].point.y)
        }.max() ?? 0
        XCTAssertGreaterThan(groupedMovement, 0.3)
        XCTAssertLessThan(groupedMovement, 3)
        var interaction = TasteMotionGeometry.InsightInteraction()
        let start = Date(timeIntervalSinceReferenceDate: 0)
        interaction.setPressed(true, at: start)
        XCTAssertEqual(interaction.value(at: start), 0)
        XCTAssertEqual(interaction.value(at: start.addingTimeInterval(0.5)), 1)
        interaction.setPressed(false, at: start.addingTimeInterval(0.5))
        XCTAssertEqual(interaction.value(at: start.addingTimeInterval(1)), 0)
        interaction.setPressed(true, at: start, immediate: true)
        XCTAssertEqual(interaction.value(at: start), 1)
        for sample in 0...12 {
            for (from, to) in [(0.0, 1.0), (1.0, 0.0)] {
                let time = TasteMotionGeometry.insightIntroDuration + TasteMotionStyle.insightRing.duration * Double(sample) / 12
                var transition = TasteMotionGeometry.InsightInteraction()
                transition.setPressed(from == 1, at: start, immediate: true)
                transition.setPressed(to == 1, at: start)
                var previous = TasteMotionGeometry.insightFrame(time: time, alignment: from).dots
                for frame in 1...30 {
                    let elapsed = Double(frame) / 60
                    let date = start.addingTimeInterval(elapsed)
                    let dots = TasteMotionGeometry.insightFrame(time: time + elapsed, alignment: transition.value(at: date), alignmentElapsed: transition.anchorElapsed(at: date)).dots
                    for index in dots.indices {
                        XCTAssertLessThan(hypot(dots[index].point.x - previous[index].point.x, dots[index].point.y - previous[index].point.y), 80)
                    }
                    previous = dots
                }
            }
        }
        XCTAssertEqual(TasteMotionStyle.insightRing.duration, 50.2)
        for sample in 0...60 {
            let held = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightIntroDuration + TasteMotionStyle.insightRing.duration * Double(sample) / 60, alignment: 1)
            XCTAssertEqual(colorChanges(held.dots[...]), 6)
            for sector in 0..<72 {
                let angle = Double(sector) / 72 * .pi * 2
                let radii = held.dots.filter {
                    let delta = atan2($0.point.y - 320, $0.point.x - 320) - angle
                    return abs(atan2(sin(delta), cos(delta))) < .pi / 18
                }.map { hypot($0.point.x - 320, $0.point.y - 320) }
                XCTAssertLessThanOrEqual(radii.min() ?? .infinity, 256)
                XCTAssertGreaterThanOrEqual(radii.max() ?? 0, 288)
            }
            let points = TasteMotionGeometry.points(style: .insightRing, time: TasteMotionStyle.insightRing.duration * Double(sample) / 60)
            let next = TasteMotionGeometry.points(style: .insightRing, time: TasteMotionStyle.insightRing.duration * Double(sample + 1) / 60)
            let advances = points.indices.map { index in
                let angle = atan2(next[index].y - 320, next[index].x - 320) - atan2(points[index].y - 320, points[index].x - 320)
                return atan2(sin(angle), cos(angle))
            }
            let expected = Double.pi * 2 / 60
            XCTAssertTrue(advances.allSatisfy { $0 > expected * 0.93 && $0 < expected * 1.07 })
            XCTAssertGreaterThan((advances.max() ?? 0) - (advances.min() ?? 0), expected * 0.1)
            for index in points.indices {
                for other in stride(from: index + 6, to: points.count, by: 6) {
                    XCTAssertGreaterThanOrEqual(hypot(points[index].x - points[other].x, points[index].y - points[other].y), 42)
                }
            }
            for sector in 0..<42 {
                let angle = Double(sector) / 42 * .pi * 2
                let radii = points.filter {
                    let delta = atan2($0.y - 320, $0.x - 320) - angle
                    return abs(atan2(sin(delta), cos(delta))) < .pi * 2 / 21
                }.map { hypot($0.x - 320, $0.y - 320) }
                XCTAssertLessThanOrEqual(radii.min() ?? .infinity, 259)
                XCTAssertGreaterThanOrEqual(radii.max() ?? 0, 287)
            }
        }
    }

    func testInsightRingDragRotation() {
        let start = Date(timeIntervalSinceReferenceDate: 0)
        var rotation = TasteMotionGeometry.InsightRotation()
        rotation.size = CGSize(width: 640, height: 640)
        rotation.drag(to: CGPoint(x: 620, y: 320), at: start)
        rotation.drag(to: CGPoint(x: 320, y: 620), at: start.addingTimeInterval(0.25))
        XCTAssertEqual(rotation.value(at: start.addingTimeInterval(0.25)), .pi / 2, accuracy: 1e-8)
        rotation.end(at: start.addingTimeInterval(0.25))
        XCTAssertGreaterThan(rotation.value(at: start.addingTimeInterval(0.35)), .pi / 2)
        XCTAssertEqual(rotation.value(at: start.addingTimeInterval(3)), rotation.value(at: start.addingTimeInterval(4)))
        let caught = rotation.value(at: start.addingTimeInterval(0.5))
        rotation.drag(to: CGPoint(x: 620, y: 320), at: start.addingTimeInterval(0.5))
        XCTAssertEqual(rotation.value(at: start.addingTimeInterval(0.5)), caught)
        rotation.end(at: start.addingTimeInterval(0.8))
        XCTAssertEqual(rotation.value(at: start.addingTimeInterval(3)), caught)
        rotation.drag(to: CGPoint(x: 620, y: 320), at: start.addingTimeInterval(4))
        rotation.drag(to: CGPoint(x: 320, y: 620), at: start.addingTimeInterval(4.25))
        rotation.end(at: start.addingTimeInterval(4.25), immediate: true)
        XCTAssertEqual(rotation.value(at: start.addingTimeInterval(4.25)), rotation.value(at: start.addingTimeInterval(6)))
        XCTAssertEqual(TasteMotionGeometry.insightDragDelta(from: .zero, to: CGPoint(x: 300, y: 0)), 0)
        func point(_ degrees: Double) -> CGPoint { CGPoint(x: 300 * cos(degrees * .pi / 180), y: 300 * sin(degrees * .pi / 180)) }
        XCTAssertEqual(TasteMotionGeometry.insightDragDelta(from: point(179), to: point(-179)), .pi / 90, accuracy: 1e-8)
        XCTAssertGreaterThan(TasteMotionGeometry.insightInertia(velocity: 4, elapsed: 3), TasteMotionGeometry.insightInertia(velocity: 1, elapsed: 3))
        for alignment in [0.0, 1.0] {
            let base = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightIntroDuration + 3, alignment: alignment).dots
            let turned = TasteMotionGeometry.insightFrame(time: TasteMotionGeometry.insightIntroDuration + 3, alignment: alignment, rotation: .pi / 2).dots
            for index in turned.indices {
                XCTAssertEqual(turned[index].point.x, 640 - base[index].point.y, accuracy: 1e-8)
                XCTAssertEqual(turned[index].point.y, base[index].point.x, accuracy: 1e-8)
            }
        }
    }

    @MainActor
    func testInsightMetaballAppliesColorOnce() throws {
        let frame = TasteMotionGeometry.insightFrame(time: 0.475)
        let renderer = ImageRenderer(content: Canvas { context, _ in
            TasteMotionView.drawInsight(context: &context, frame: frame, palette: Array(repeating: .black, count: 6))
        }.frame(width: 640, height: 640).background(.white))
        renderer.scale = 1
        let image = try XCTUnwrap(renderer.cgImage)
        XCTAssertFalse(frame.bridges.isEmpty)
        for bridge in frame.bridges {
            let parent = frame.dots[bridge.parent], child = frame.dots[bridge.child]
            let x = floor((parent.point.x + child.point.x) / 2)
            let y = floor((parent.point.y + child.point.y) / 2)
            let crop = try XCTUnwrap(image.cropping(to: CGRect(x: x, y: y, width: 1, height: 1)))
            var pixel = [UInt8](repeating: 0, count: 4)
            try pixel.withUnsafeMutableBytes { buffer in
                let context = try XCTUnwrap(CGContext(data: buffer.baseAddress, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4,
                                                    space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
                context.draw(crop, in: CGRect(x: 0, y: 0, width: 1, height: 1))
            }
            let radius = hypot(x + 0.5 - 320, y + 0.5 - 320)
            let opacity = 1 - 0.65 * min(1, max(0, (radius - 74.2 / 6) / (74.2 - 74.2 / 6)))
            for channel in pixel.prefix(3) {
                XCTAssertEqual(Double(channel), 255 * (1 - opacity), accuracy: 6, "점과 메타볼이 겹쳐도 농도는 한 번만 적용한다.")
            }
        }
    }

    @MainActor
    func testInsightRingMovesAndRespectsReduceMotion() async throws {
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let previousWindow = scene.windows.first { $0.isKeyWindow }
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        defer { window.isHidden = true; window.rootViewController = nil; previousWindow?.makeKey() }

        for reduceMotion in [false, true] {
            let host = UIHostingController(rootView: HomeInsightDotRing(kind: .record, mealCount: 1, reduceMotion: reduceMotion,
                                                                                       tasteDistribution: .init(counts: [1, 2, 0, 0, 7, 0]))
                .frame(width: 340, height: 340)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .background(TBColor.page)
                .environment(\.scenePhase, .active))
            window.rootViewController = host
            window.makeKeyAndVisible()
            try await Task.sleep(for: .milliseconds(300))
            window.layoutIfNeeded()
            func ringImage() -> UIImage {
                // 상단 링 영역만 비교해 다른 화면 상태나 시계 변화의 영향을 피한다.
                UIGraphicsImageRenderer(size: CGSize(width: 360, height: 350)).image { context in
                    context.cgContext.translateBy(x: -20, y: -window.safeAreaInsets.top)
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
            }
            let before = ringImage()
            try await Task.sleep(for: .milliseconds(500))
            let after = ringImage()
            if reduceMotion {
                XCTAssertEqual(before.pngData(), after.pngData(), "동작 줄이기에서는 점 링이 정지해야 한다.")
            } else {
                XCTAssertNotEqual(before.pngData(), after.pngData(), "기록이 있으면 점 링이 움직여야 한다.")
            }
            let attachment = XCTAttachment(image: after)
            attachment.name = reduceMotion ? "인사이트 점 링 · 동작 줄이기" : "인사이트 점 링 · 애니메이션"
            attachment.lifetime = .keepAlways
            add(attachment)
        }
    }

    @MainActor
    func testCollapsingHeaderKeepsStatusBarInsetAndDissolvesDuringScroll() throws {
        var observedInset: CGFloat?
        var observedProgress: CGFloat = -1
        let controller = StagedSheetScreenController(rootView: AnyView(
            VStack(spacing: 0) {
                Color.clear.frame(height: 59)
                TBCollapsingTopChromeScrollView(topChrome: AnyView(
                    TopAppBar(appearance: .transparent, title: "미각 변화", showBack: true)
                        .overlay {
                            TopChromeEnvironmentProbe { inset, progress in
                                observedInset = inset
                                observedProgress = progress
                            }
                        }
                )) {
                    TBCapsuleTabs(options: [1, 3, 6, 12, 0], selection: .constant(0)) {
                        $0 == 0 ? "전부" : $0 == 12 ? "1년" : "\($0)개월"
                    }
                } content: {
                    Color.white.frame(height: 2_000)
                }
                .tbScreenTopChrome()
            }
            .background(TBColor.page)
            .environment(\.tbTopChromeInset, 59)
        ))
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 402, height: 874))
        window.rootViewController = controller
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        func settle() {
            controller.view.layoutIfNeeded()
            RunLoop.main.run(until: Date().addingTimeInterval(0.15))
            controller.view.layoutIfNeeded()
        }
        func descendants(_ view: UIView) -> [UIView] { [view] + view.subviews.flatMap(descendants) }
        settle()
        XCTAssertEqual(observedInset, 59, "안전영역을 비운 UIKit 호스트에서도 실제 상태바 높이를 유지해야 한다.")
        XCTAssertEqual(observedProgress, 0, accuracy: 0.01)
        let scroll = try XCTUnwrap(descendants(controller.view).compactMap { $0 as? UIScrollView }.first)
        for offset in [CGFloat(28), 80, 0] {
            scroll.setContentOffset(CGPoint(x: 0, y: offset), animated: false)
            settle()
            if offset == 28 {
                XCTAssertGreaterThan(observedProgress, 0)
                XCTAssertLessThan(observedProgress, 1)
            } else {
                XCTAssertEqual(observedProgress, offset == 0 ? 0 : 1, accuracy: 0.01)
            }
            let image = UIGraphicsImageRenderer(bounds: controller.view.bounds).image { _ in
                controller.view.drawHierarchy(in: controller.view.bounds, afterScreenUpdates: true)
            }
            let attachment = XCTAttachment(image: image)
            attachment.name = "미각 변화 헤더 스크롤 \(Int(offset))pt"
            attachment.lifetime = .keepAlways
            add(attachment)
        }
    }

    @MainActor
    func testStagedScreenMovesHeaderWithCardAndPreservesScrollPosition() throws {
        func screen() -> AnyView {
            AnyView(
                NavigationStack {
                    MainTabChromeScrollView(
                        topChrome: AnyView(StagedHeaderMarker().frame(height: 52))
                    ) {
                        // 홈 데이터의 양과 무관하게 실제 공통 헤더·스크롤 구조를 검증한다.
                        Color.clear.frame(height: 2_000)
                    }
                    .toolbar(.hidden, for: .navigationBar)
                }
                .ignoresSafeArea(.container, edges: .top)
                .environment(\.mainTabStatusBarHeight, 54)
            )
        }
        let controller = StagedSheetScreenController(rootView: screen())
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 402, height: 874))
        window.rootViewController = controller
        window.makeKeyAndVisible()
        defer { window.isHidden = true }

        func settle() {
            controller.view.setNeedsLayout()
            controller.view.layoutIfNeeded()
            RunLoop.main.run(until: Date().addingTimeInterval(0.1))
            controller.view.layoutIfNeeded()
        }
        func descendants(_ view: UIView) -> [UIView] {
            [view] + view.subviews.flatMap(descendants)
        }
        controller.updatePresentation(progress: 0, dimOpacity: 0, openOffsetY: 64, animates: false)
        settle()
        let header = try XCTUnwrap(descendants(controller.view).first { $0.accessibilityIdentifier == "staged-header-marker" })
        let scroll = try XCTUnwrap(descendants(controller.view).compactMap { $0 as? UIScrollView }.first {
            $0.contentSize.height > $0.bounds.height
        })
        scroll.setContentOffset(CGPoint(x: 0, y: 180), animated: false)
        settle()
        let originalHeader = header.convert(header.bounds, to: controller.view)
        let originalOffset = scroll.contentOffset
        let originalBounds = scroll.bounds.size
        let originalInset = scroll.adjustedContentInset
        let originalContentSize = scroll.contentSize

        // 열기·드래그·닫기 전 과정에서 내부 배치와 스크롤 위치를 유지한다.
        for progress in [CGFloat(0.2), 0.6, 1, 0.8, 0.4, 0] {
            controller.hostingController.rootView = screen()
            controller.updatePresentation(progress: progress, dimOpacity: 0.6 * progress, openOffsetY: 64, animates: false)
            settle()
            let currentHeader = header.convert(header.bounds, to: controller.view)
            let scale = 1 - (1 - StagedBottomSheetBackgroundMetrics.openScale) * progress
            XCTAssertEqual(currentHeader.minY, originalHeader.minY * scale + 64 * progress, accuracy: 0.5)
            XCTAssertEqual(currentHeader.height, originalHeader.height * scale, accuracy: 0.5)
            XCTAssertTrue(descendants(controller.view).contains { $0 === scroll })
            XCTAssertEqual(scroll.contentOffset.y, originalOffset.y, accuracy: 0.5)
            XCTAssertEqual(scroll.bounds.size, originalBounds)
            XCTAssertEqual(scroll.adjustedContentInset, originalInset)
            XCTAssertEqual(scroll.contentSize, originalContentSize)
        }
    }

    @MainActor
    func testAnalysisMainScrollDoesNotOverflowHorizontally() async throws {
        let viewport = CGRect(x: 0, y: 0, width: 390, height: 844)
        let notes = ["단맛이 좋았습니다.", "바삭함이 좋았습니다.", "감칠맛이 좋았습니다.", "신맛이 싫었습니다."]
        let meals = notes.enumerated().map { index, note in
            DiningEntry(restaurant: "기록한 식당", menu: "음식 \(index + 1)", rating: 3, note: note, feedbackStatus: .completed)
        }
        let model = AppModel.preview(profile: .sample, diningEntries: meals)
        let clock = ContinuousClock()
        let deadline = clock.now.advanced(by: .seconds(10))
        while model.sensoryAnalysisIsUpdating && clock.now < deadline {
            try await Task.sleep(for: .milliseconds(10))
        }
        XCTAssertFalse(model.sensoryAnalysisIsUpdating, "실제 식사 기록의 분석이 제한 시간 내에 완료되어야 한다")
        XCTAssertNil(model.sensoryAnalysisError)
        XCTAssertGreaterThanOrEqual(model.sensoryAnalysis.insights.count, 4, "스크롤 검사는 실제 기록에서 생성한 인사이트가 충분한 상태로 수행한다")
        let view = AnalysisView(
            systemTopChrome: AnyView(Color.clear.frame(height: 104))
        )
        .environmentObject(model)
        .environment(\.mainTabStatusBarHeight, 59)
        let host = UIHostingController(rootView: view)
        let container = UIViewController()
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        let previousKeyWindow = scene?.windows.first { $0.isKeyWindow }
        let window = scene.map { UIWindow(windowScene: $0) } ?? UIWindow(frame: viewport)
        window.frame = viewport
        window.rootViewController = container
        container.loadViewIfNeeded()
        container.view.frame = viewport
        container.addChild(host)
        host.loadViewIfNeeded()
        host.view.translatesAutoresizingMaskIntoConstraints = false
        container.view.addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.topAnchor.constraint(equalTo: container.view.topAnchor),
            host.view.leadingAnchor.constraint(equalTo: container.view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: container.view.trailingAnchor),
            host.view.bottomAnchor.constraint(equalTo: container.view.bottomAnchor),
        ])
        host.didMove(toParent: container)
        window.makeKeyAndVisible()
        defer {
            host.willMove(toParent: nil)
            host.view.removeFromSuperview()
            host.removeFromParent()
            window.isHidden = true
            window.rootViewController = nil
            previousKeyWindow?.makeKey()
        }

        func descendants(_ view: UIView) -> [UIView] {
            [view] + view.subviews.flatMap(descendants)
        }
        func controllerViews(_ controller: UIViewController) -> [UIView] {
            (controller.viewIfLoaded.map { [$0] } ?? [])
                + controller.children.flatMap(controllerViews)
                + (controller.presentedViewController.map(controllerViews) ?? [])
        }
        func rawScrollViews() -> [UIScrollView] {
            var seen = Set<ObjectIdentifier>()
            return ([window] + controllerViews(container)).flatMap(descendants)
                .compactMap { $0 as? UIScrollView }
                .filter { seen.insert(ObjectIdentifier($0)).inserted }
        }
        func displayedScrollViews() -> [UIScrollView] {
            rawScrollViews().filter { scroll in
                guard scroll.window === window else { return false }
                var current: UIView? = scroll
                while let item = current {
                    if item.isHidden || item.alpha == 0 { return false }
                    current = item.superview
                }
                return true
            }
        }
        // 헤더는 contentSize가 아니라 adjustedContentInset에 포함된다.
        // 실제 진단값 756.333 + 163 + 4 - 844 = 79.333pt는 세로 이동이 가능하다.
        func verticalTravel(_ scroll: UIScrollView) -> CGFloat {
            scroll.contentSize.height + scroll.adjustedContentInset.top
                + scroll.adjustedContentInset.bottom - scroll.bounds.height
        }
        func path(of view: UIView) -> String {
            var names: [String] = []
            var current: UIView? = view
            while let item = current {
                names.append(String(describing: type(of: item)))
                current = item.superview
            }
            return names.reversed().joined(separator: "/")
        }
        func diagnostic() -> String {
            let raw = rawScrollViews()
            let header = "window=\(window.frame), container=\(container.view.frame), host=\(host.view.frame), hostAttached=\(host.view.window === window), rawScrollCount=\(raw.count), displayedScrollCount=\(displayedScrollViews().count), insights=\(model.sensoryAnalysis.insights.count)"
            let rows = raw.map { scroll in
                "\(path(of: scroll)) frame=\(scroll.frame) bounds=\(scroll.bounds) contentSize=\(scroll.contentSize) windowFrame=\(scroll.convert(scroll.bounds, to: window)) insets=\(scroll.adjustedContentInset) clips=\(scroll.clipsToBounds) attached=\(scroll.window === window) hidden=\(scroll.isHidden)"
            }
            let tree = raw.isEmpty ? descendants(window).prefix(80).map { "\(path(of: $0)) frame=\($0.frame)" } : []
            return ([header] + rows + tree).joined(separator: "\n")
        }

        // 실제 앱처럼 UIKit 컨테이너에 포함한 호스트를 제약으로 고정한다.
        // 탐색 단계는 contentSize > bounds 조건을 적용하지 않아, 없는 뷰와
        // 아직 크기가 계산되지 않은 뷰를 별도의 실패 정보로 구분한다.
        let renderingDeadline = clock.now.advanced(by: .seconds(10))
        repeat {
            try await Task.sleep(for: .milliseconds(20))
            window.setNeedsLayout()
            window.layoutIfNeeded()
            container.view.layoutIfNeeded()
            host.view.setNeedsLayout()
            host.view.layoutIfNeeded()
            if displayedScrollViews().contains(where: {
                $0.bounds.height > 0 && verticalTravel($0) > 0
            }) {
                break
            }
        } while clock.now < renderingDeadline

        let details = diagnostic()
        XCTAssertTrue(host.view.window === window, "호스트는 표시 창에 연결되어야 한다.\n\(details)")
        XCTAssertGreaterThan(host.view.bounds.height, 0, details)
        XCTAssertGreaterThan(host.view.bounds.width, 0, details)
        let displayed = displayedScrollViews()
        XCTAssertFalse(displayed.isEmpty, "실제 표시 계층에서 UIScrollView를 찾아야 한다.\n\(details)")
        let verticalScrollViews = displayed.filter { verticalTravel($0) > 0 }
        XCTAssertFalse(verticalScrollViews.isEmpty, "충분한 실제 인사이트 카드가 세로로 스크롤되어야 한다.\n\(details)")
        let mainScrollView = displayed
            .filter { scrollView in
                let frame = scrollView.convert(scrollView.bounds, to: host.view)
                return frame.minY <= 1 && frame.width >= host.view.bounds.width - 1
                    && frame.height >= host.view.bounds.height / 2
            }
            .max { $0.bounds.width * $0.bounds.height < $1.bounds.width * $1.bounds.height }
        XCTAssertNotNil(
            mainScrollView,
            "The main scroll view must extend behind the status bar.\n\(details)"
        )
        if let mainScrollView {
            let travel = verticalTravel(mainScrollView)
            XCTAssertGreaterThan(travel, 0, "헤더 inset을 포함한 주 스크롤의 실제 세로 이동 범위가 있어야 한다.\n\(details)")
            if travel > 0 {
                let originalOffset = mainScrollView.contentOffset
                let startY = -mainScrollView.adjustedContentInset.top
                let targetY = startY + min(20, travel / 2)
                mainScrollView.setContentOffset(CGPoint(x: originalOffset.x, y: startY), animated: false)
                mainScrollView.setContentOffset(CGPoint(x: originalOffset.x, y: targetY), animated: false)
                try await Task.sleep(for: .milliseconds(20))
                XCTAssertGreaterThan(mainScrollView.contentOffset.y, startY, "실제 스크롤을 이동하면 offset이 변해야 한다.\n\(details)")
                XCTAssertEqual(mainScrollView.contentOffset.y, targetY, accuracy: 1, "계산한 이동 범위 안에서 실제 콘텐츠가 이동해야 한다.\n\(details)")
                mainScrollView.setContentOffset(originalOffset, animated: false)
            }
        }
        XCTAssertEqual(
            mainScrollView?.clipsToBounds,
            false,
            "The main scroll content must remain visible behind the status bar.\n\(details)"
        )
        for scrollView in verticalScrollViews {
            XCTAssertLessThanOrEqual(
                scrollView.contentSize.width,
                scrollView.bounds.width + 1,
                "Vertical scroll content width must stay inside its viewport.\n\(details)"
            )
        }
    }

    func testLucideIconTokensMirrorReactIconTokens() {
        XCTAssertEqual(TBIcon.Size.extraSmall, 12)
        XCTAssertEqual(TBIcon.Size.small, 14)
        XCTAssertEqual(TBIcon.Size.base, 16)
        XCTAssertEqual(TBIcon.Size.medium, 18)
        XCTAssertEqual(TBIcon.Size.control, 20)
        XCTAssertEqual(TBIcon.Size.large, 24)
        XCTAssertEqual(TBIcon.Size.extraLarge, 28)
        XCTAssertEqual(TBIcon.Size.touch, 24)
        XCTAssertEqual(TBIcon.Size.hero, 24)

        XCTAssertEqual(TBIcon.Stroke.thin, 1.5)
        XCTAssertEqual(TBIcon.Stroke.regular, 1.8)
        XCTAssertEqual(TBIcon.Stroke.medium, 2)
        XCTAssertEqual(TBIcon.Stroke.strong, 2.2)
        XCTAssertEqual(TBIcon.Stroke.emphasis, 3)

        XCTAssertEqual(TBIcon.Container.small, 18)
        XCTAssertEqual(TBIcon.Container.medium, 24)
        XCTAssertEqual(TBIcon.Container.large, 32)
        XCTAssertEqual(TBIcon.Container.extraLarge, 32)
    }

    func testLucideIconNameMapsLegacySystemSymbolsToReactLucideNames() {
        XCTAssertEqual(LucideIconName(systemName: "magnifyingglass"), .search)
        XCTAssertEqual(LucideIconName(systemName: "mappin.circle"), .mapPin)
        XCTAssertEqual(LucideIconName(systemName: "bell"), .bell)
        XCTAssertEqual(LucideIconName(systemName: "plus.circle"), .circlePlus)
        XCTAssertEqual(LucideIconName(systemName: "line.3.horizontal"), .menu)
        XCTAssertEqual(LucideIconName(systemName: "calendar.badge.checkmark"), .calendarCheck)
        XCTAssertEqual(LucideIconName(systemName: "person"), .user)
        XCTAssertEqual(LucideIconName(systemName: "phone"), .phone)
        XCTAssertEqual(LucideIconName(systemName: "heart.fill"), .heart)
        XCTAssertEqual(LucideIconName(systemName: "bookmark.fill"), .bookmark)
        XCTAssertEqual(LucideIconName(systemName: "text.bubble"), .messageCircle)
        XCTAssertEqual(LucideIconName(systemName: "paperplane"), .send)
        XCTAssertEqual(LucideIconName(systemName: "arrow.clockwise"), .refreshCw)
        XCTAssertEqual(LucideIconName(systemName: "refresh-cw"), .refreshCw)
        XCTAssertEqual(LucideIconName(systemName: "questionmark.circle"), .circleHelp)
        XCTAssertEqual(LucideIconName(systemName: "circle-help"), .circleHelp)
        XCTAssertEqual(LucideIconName(systemName: "info.circle"), .info)
        XCTAssertEqual(LucideIconName(systemName: "info"), .info)
        XCTAssertEqual(LucideIconName(systemName: "doc.text.magnifyingglass"), .eye)
        XCTAssertEqual(LucideIconName(systemName: "eye"), .eye)
        XCTAssertEqual(LucideIconName(systemName: "square.and.pencil"), .squarePen)
        XCTAssertEqual(LucideIconName(systemName: "square-pen"), .squarePen)
    }

    func testDishFeedbackFixturesKeepReactImageRailContract() {
        let followingItems = TasteBuddyNativeContent.followingDishFeedbackItems
        let firstFollowingImage = followingItems[0].images.first

        XCTAssertEqual(firstFollowingImage?.alt, "맑은 육수와 산뜻한 여운 메뉴 사진")
        XCTAssertFalse(firstFollowingImage?.isUserFeedbackMedia ?? true)
        XCTAssertTrue(
            followingItems[1].images.allSatisfy { !$0.isUserFeedbackMedia },
            "React DishFeedbackImageRail renders only feedback images with imageSrc."
        )

        let diningItems = TasteBuddyNativeContent.fallbackDishFeedbackItems
        XCTAssertFalse(diningItems[0].images.first?.isUserFeedbackMedia ?? true)
        XCTAssertTrue(diningItems[1].images.allSatisfy { !$0.isUserFeedbackMedia })

        let feedbackImages = (followingItems + diningItems).flatMap(\.images)
        XCTAssertFalse(
            feedbackImages.contains { ["OnjiumChefs", "KangMingoo"].contains($0.imageName) },
            "Dish feedback media must be user-uploaded reflection photos, not chef portraits."
        )
    }

    func testDishFeedbackTasteBubblesKeepExplicitMetadataWithoutInferringFixtureEvidence() throws {
        let explicitBubble = DishFeedbackTasteBubble(
            id: "explicit-umami", label: "직접 선택한 감칠맛", title: "선택한 감각",
            colorTaste: "감칠맛", axis: .umami
        )
        XCTAssertEqual(explicitBubble.id, "explicit-umami")
        XCTAssertEqual(explicitBubble.label, "직접 선택한 감칠맛")
        XCTAssertEqual(explicitBubble.title, "선택한 감각")
        XCTAssertEqual(explicitBubble.colorTaste, "감칠맛")
        XCTAssertEqual(explicitBubble.resolvedAxis, .umami)
        let example = try XCTUnwrap(TasteBuddyNativeContent.followingDishFeedbackItems.first)
        XCTAssertEqual(example.reactionLabel, "예시 기록")
        XCTAssertNil(example.tbaAnalysisSnapshot)
        XCTAssertTrue(example.tasteBubbles.isEmpty, "예시의 메뉴 이름이나 구 TBA 추론으로 감각을 생성하지 않는다")
        let noMeals = try SensoryAnalysisEngine.analyze(entries: [])
        XCTAssertTrue(noMeals.observations.isEmpty)
        XCTAssertTrue(noMeals.insights.isEmpty)
        XCTAssertNil(noMeals.mainWing.main)
    }

    func testDishFeedbackDetailTagsPreserveCurrentSensorySourceAndExperience() throws {
        let meal = DiningEntry(restaurant: "기록한 식당", menu: "기록한 음식", rating: 5, note: "단맛이 좋았습니다.")
        let other = DiningEntry(restaurant: "다른 식당", menu: "다른 음식", rating: 1, note: "바삭함이 싫었습니다.")
        let analysis = try SensoryAnalysisEngine.analyze(entries: [meal, other])
        let card = DiningDishFeedbackItem.fromDiningEntry(meal, analysis: analysis)
        let tag = try XCTUnwrap(card.detailTags.first)
        let observation = try XCTUnwrap(analysis.observations.first { $0.id == tag.id })
        XCTAssertEqual(observation.experienceID, meal.id)
        XCTAssertEqual(tag.label, meal.note)
        XCTAssertEqual(tag.title, meal.note)
        XCTAssertEqual(observation.phrase, meal.note)
        let span = try XCTUnwrap(observation.sourceSpans.first)
        XCTAssertEqual(span.start, 0)
        XCTAssertEqual(span.end, meal.note.utf16.count)
        XCTAssertEqual(span.quote, meal.note)
        XCTAssertEqual((meal.note as NSString).substring(with: NSRange(location: span.start, length: span.end - span.start)), span.quote)
        XCTAssertEqual(card.detailTags.count, 1, "하나의 원문에서 나온 여러 원자를 중복 태그로 부풀리지 않는다")
        XCTAssertFalse(card.detailTags.contains { $0.label == other.note })
        XCTAssertNil(card.tbaAnalysisSnapshot)
        XCTAssertEqual(analysis.actualApiCalls, 0)
    }

    func testSocialDishFeedbackCardWrapperKeepsExampleIdentityWithoutNativeTBAInference() throws {
        let feedItem = try XCTUnwrap(TasteBuddyNativeContent.tasteMatchFeed.first)
        let sourceReason = feedItem.reason
        let sourceTags = feedItem.tasteTags
        let card = DiningDishFeedbackItem.fromTasteMatchFeedItem(
            feedItem,
            commentCount: 3,
            liked: true
        )
        XCTAssertEqual(card.id, feedItem.id)
        XCTAssertEqual(card.authorName, feedItem.reviewerName)
        XCTAssertEqual(card.restaurantName, feedItem.restaurantName)
        XCTAssertEqual(card.dishTitle, feedItem.dishTitle)
        XCTAssertEqual(card.commentCount, 3)
        XCTAssertTrue(card.liked, "명시된 카드 좋아요 상태는 입맛 추론과 별도로 보존한다")
        XCTAssertNil(card.tbaAnalysisSnapshot)
        XCTAssertEqual(card.reactionLabel, "예시 기록")
        XCTAssertTrue(card.summary.contains("개인 입맛 해석에는 사용하지 않아요"))
        XCTAssertTrue(card.tasteBubbles.isEmpty)
        XCTAssertTrue(card.detailTags.isEmpty)
        XCTAssertFalse(sourceReason.isEmpty)
        XCTAssertFalse(sourceTags.isEmpty)
        XCTAssertEqual(TasteBuddyNativeContent.tasteMatchFeed.first?.reason, sourceReason)
        XCTAssertEqual(TasteBuddyNativeContent.tasteMatchFeed.first?.tasteTags, sourceTags)
        let image = try XCTUnwrap(card.images.first)
        XCTAssertEqual(image.alt, "\(feedItem.dishTitle) 메뉴 사진")
        XCTAssertFalse(image.isUserFeedbackMedia, "예시 이미지 설명을 사용자 업로드 사진으로 표시하지 않는다")
    }

    func testFixtureDishFeedbackFeedHydratesExamplesWithoutPersonalSensoryEvidence() async throws {
        let phase = try await FixtureDishFeedbackFeedRepository().followingFeed()
        guard case .populated(let items) = phase else {
            return XCTFail("예시 저장소는 표시 가능한 소셜 카드 목록을 반환해야 한다")
        }
        let sources = TasteBuddyNativeContent.tasteMatchFeed
        XCTAssertEqual(items.count, sources.count)
        XCTAssertEqual(items.map(\.id), sources.map(\.id))
        XCTAssertEqual(items.map(\.authorName), sources.map(\.reviewerName))
        XCTAssertEqual(items.map(\.dishTitle), sources.map(\.dishTitle))
        for item in items {
            XCTAssertNil(item.tbaAnalysisSnapshot)
            XCTAssertEqual(item.reactionLabel, "예시 기록")
            XCTAssertTrue(item.tasteBubbles.isEmpty)
            XCTAssertTrue(item.detailTags.isEmpty)
            XCTAssertFalse(item.images.first?.isUserFeedbackMedia ?? true)
        }
        let analysis = try SensoryAnalysisEngine.analyze(entries: [])
        XCTAssertEqual(analysis.sourceExperienceCount, 0)
        XCTAssertTrue(analysis.observations.isEmpty)
        XCTAssertTrue(analysis.insights.isEmpty)
        XCTAssertEqual(analysis.actualApiCalls, 0)
    }

    func testNativeDishFeedbackCardMetricsMirrorReactDishFeedbackCard() {
        XCTAssertEqual(DishFeedbackCardMetrics.padding, 12)
        XCTAssertEqual(DishFeedbackCardMetrics.contentGap, 12)
        XCTAssertEqual(DishFeedbackCardMetrics.radius, 20)
        XCTAssertEqual(DishFeedbackCardMetrics.headerGap, 8)
        XCTAssertEqual(DishFeedbackCardMetrics.avatarSize, 32)
        XCTAssertEqual(DishFeedbackCardMetrics.chipStackGap, 6)
        XCTAssertEqual(DishFeedbackCardMetrics.actionDividerOpacity, 0.08, accuracy: 0.001)
        XCTAssertEqual(DishFeedbackCardMetrics.actionGap, 8)
        XCTAssertEqual(DishFeedbackCardMetrics.actionCountGap, 2)
        XCTAssertEqual(DishFeedbackCardMetrics.actionIconSize, 18)
        XCTAssertEqual(DishFeedbackCardMetrics.heartActionIconSize, 18)
        XCTAssertEqual(DishFeedbackCardMetrics.commentActionIconSize, 18)
        XCTAssertEqual(DishFeedbackCardMetrics.shareActionIconSize, 17)
        XCTAssertEqual(DishFeedbackCardMetrics.actionIconFrameWidth, 18)
        XCTAssertEqual(DishFeedbackCardMetrics.actionButtonSize, 32)
        XCTAssertEqual(DishFeedbackCardMetrics.notePadding, 12)
        XCTAssertEqual(DishFeedbackCardMetrics.noteRadius, 12)
    }

    func testDishFeedbackAuthorLineTruncationMatchesReactPriority() {
        XCTAssertEqual(DishFeedbackAuthorLineTruncator.truncationMark, "..")
        XCTAssertEqual(DishFeedbackAuthorLineTruncator.minimumAuthorNameLength, 2)
        XCTAssertEqual(DishFeedbackAuthorLineTruncator.minimumSubjectLength, 3)
        XCTAssertEqual(
            DishFeedbackAuthorLineTruncator.minimumText("불향도윤", minLength: 2),
            "불향.."
        )
        XCTAssertEqual(
            DishFeedbackAuthorLineTruncator.minimumText("abcdefgh", minLength: 3),
            "abc.."
        )

        let full = DishFeedbackAuthorLineTruncator.visibleText(
            authorName: "김민아",
            subject: "맑은 육수",
            availableWidth: 1_000
        )
        XCTAssertEqual(full.authorName, "김민아")
        XCTAssertEqual(full.subject, "맑은 육수")

        let narrow = DishFeedbackAuthorLineTruncator.visibleText(
            authorName: "불향도윤처럼긴닉네임",
            subject: "맑은육수와산뜻한여운",
            availableWidth: 80
        )
        XCTAssertEqual(narrow.authorName, "불향..")
        XCTAssertTrue(narrow.subject.hasSuffix(".."))
        XCTAssertGreaterThanOrEqual(narrow.subject.count, 5)
    }

    func testFeedbackReflectionMediaLifecyclePolicyMatchesPrivateR2Plan() {
        let objectKey = FeedbackReflectionMediaPolicy.privateObjectKey(
            userID: "user-123",
            date: Date(timeIntervalSince1970: 1_720_000_000),
            assetID: "asset-456"
        )

        XCTAssertTrue(objectKey.hasPrefix("feedback-reflections/user-123/"))
        XCTAssertTrue(objectKey.hasSuffix("/asset-456.jpg"))
        XCTAssertEqual(FeedbackReflectionMediaPolicy.maxUploadBytes, 6 * 1024 * 1024)
        XCTAssertEqual(FeedbackReflectionMediaPolicy.recommendedMaxPixelLength, 1600)
        XCTAssertTrue(FeedbackReflectionMediaPolicy.supportedContentTypes.contains("image/webp"))
        XCTAssertEqual(
            FeedbackReflectionMediaLifecycleAction.allCases,
            [.upload, .read, .replace, .delete, .accountCleanup]
        )
    }

    func testRadarContractMatchesReactAxisAndReferenceValues() {
        XCTAssertEqual(TasteRadarContract.canvasSize, CGSize(width: 320, height: 310))
        XCTAssertEqual(TasteRadarContract.center, CGPoint(x: 160, y: 145))
        XCTAssertEqual(TasteRadarContract.maximumRadius, 100)
        XCTAssertEqual(TasteRadarContract.gridLevels, [0.25, 0.5, 0.75, 1])
        XCTAssertEqual(
            TasteAxis.allCases.map(TasteRadarContract.averageScore(for:)),
            [50, 44, 55, 48, 52, 40]
        )
    }

    func testRadarHexagonUsesReactStartingAngle() {
        let first = TasteRadarContract.basePoint(index: 0)
        let second = TasteRadarContract.basePoint(index: 1)
        let right = TasteRadarContract.basePoint(index: 2)
        let left = TasteRadarContract.basePoint(index: 5)

        XCTAssertEqual(first.x, 110, accuracy: 0.001)
        XCTAssertEqual(first.y, 58.397, accuracy: 0.001)
        XCTAssertEqual(second.x, 210, accuracy: 0.001)
        XCTAssertEqual(second.y, 58.397, accuracy: 0.001)
        XCTAssertEqual(right.x, 260, accuracy: 0.001)
        XCTAssertEqual(right.y, 145, accuracy: 0.001)
        XCTAssertEqual(left.x, 60, accuracy: 0.001)
        XCTAssertEqual(left.y, 145, accuracy: 0.001)
    }

    func testRadarMeasurementNormalizesInputAndClampsScores() {
        let snapshot = RadarMeasurementSnapshot(
            id: "fixture",
            periodLabel: "최근 측정",
            entries: [
                RadarTasteEntry(axis: .sour, score: 140, averageScore: -20),
                RadarTasteEntry(axis: .sweet, score: 85)
            ],
            totalSensitivityLabel: "민감"
        )

        XCTAssertEqual(snapshot.entries.map(\.axis), TasteAxis.allCases)
        XCTAssertEqual(snapshot.entries[0].score, 85)
        XCTAssertEqual(snapshot.entries[1].score, 100)
        XCTAssertEqual(snapshot.entries[1].averageScore, 0)
        XCTAssertEqual(snapshot.entries[2].score, 50)
    }

    func testRadarAnimationKeepsRecordedValuesWithinBounds() {
        XCTAssertEqual(TasteRadarContract.animationProgress(-1), 0)
        XCTAssertEqual(TasteRadarContract.animationProgress(0), 0)
        XCTAssertEqual(TasteRadarContract.animationProgress(1), 1)
        XCTAssertEqual(TasteRadarContract.animationProgress(2), 1)
        XCTAssertGreaterThan(TasteRadarContract.animationProgress(0.5), 0.5)
    }

    func testPalateSignatureRulesMatchReactPriorityOrder() {
        let harmonist = PalateSignatureEngine.derive(
            entries: TasteAxis.allCases.map {
                RadarTasteEntry(
                    axis: $0,
                    score: TasteRadarContract.averageScore(for: $0)
                )
            }
        )
        XCTAssertEqual(harmonist.id, .harmonist)
        XCTAssertEqual(harmonist.label, "Harmonist")

        let epicure = PalateSignatureEngine.derive(
            entries: TasteAxis.allCases.map { axis in
                let score = switch axis {
                case .umami: 72
                case .fat: 50
                case .sour: 34
                default: TasteRadarContract.averageScore(for: axis)
                }
                return RadarTasteEntry(axis: axis, score: score)
            }
        )
        XCTAssertEqual(epicure.id, .epicure)
        XCTAssertEqual(epicure.accentAxes.first, .umami)
    }

    func testMeasurementMiniCtaKeepsReactVariantMatrix() {
        XCTAssertEqual(TasteMeasurementMiniCtaTone.allCases.count, 2)
        XCTAssertEqual(TasteMeasurementMiniCtaPadding.allCases.count, 2)
        XCTAssertEqual(TasteMeasurementMiniCtaActionPlacement.allCases.count, 2)
        XCTAssertEqual(TasteMeasurementMiniCtaPadding.compact.value, 12)
        XCTAssertEqual(TasteMeasurementMiniCtaPadding.default.value, 16)
    }

    func testTasteInsightSummarySelectsIncreaseAndDecreaseSignals() {
        let data = TasteInsightSummaryCardData(
            actionLabel: "현재 기준",
            details: [
                TasteInsightSummaryDetail(
                    axis: .sweet,
                    changeValue: 12,
                    history: [],
                    trend: .increase
                ),
                TasteInsightSummaryDetail(
                    axis: .sour,
                    changeValue: 28,
                    history: [],
                    trend: .increase
                ),
                TasteInsightSummaryDetail(
                    axis: .bitter,
                    changeValue: -22,
                    history: [],
                    trend: .decrease
                )
            ],
            keywords: ["신맛 반응", "쓴맛 대비"],
            sectionLabel: "미각변화",
            title: "fixture"
        )

        XCTAssertEqual(data.details.count, 3)
        XCTAssertFalse(data.hasHistory)
        XCTAssertTrue(data.details.allSatisfy { $0.currentScore == nil })
        XCTAssertEqual(data.details[1].changeLabel, "+28%")
        XCTAssertEqual(data.details[2].changeLabel, "-22%")
        XCTAssertEqual(TastePointTrend.allCases, [.increase, .decrease, .neutral])
    }

    func testTasteInsightFirstRecordKeepsCurrentScoresInBothSummaryFactories() {
        let current = makeInsightProfile(createdAt: 20)
        let cards = [
            TasteInsightSummaryCardData.tasteProfile(current),
            TasteInsightSummaryCardData.specialNote(current)
        ]

        for card in cards {
            XCTAssertFalse(card.hasHistory, card.sectionLabel)
            XCTAssertFalse(card.details.isEmpty, card.sectionLabel)
            for detail in card.details {
                XCTAssertTrue(detail.history.isEmpty, card.sectionLabel)
                XCTAssertEqual(detail.currentScore, current.score(for: detail.axis))
            }
            XCTAssertEqual(card.details.first { $0.axis == .sweet }?.currentScore, 76)
            XCTAssertEqual(card.details.first { $0.axis == .bitter }?.currentScore, 29)
        }
    }

    func testTasteInsightCurrentProfileAloneDoesNotCountAsHistory() {
        let current = makeInsightProfile(createdAt: 20)
        let cards = [
            TasteInsightSummaryCardData.tasteProfile(current, history: [current]),
            TasteInsightSummaryCardData.specialNote(current, history: [current])
        ]

        for card in cards {
            XCTAssertFalse(card.hasHistory, card.sectionLabel)
            XCTAssertTrue(card.details.allSatisfy { $0.history.isEmpty }, card.sectionLabel)
        }
    }

    func testTasteInsightOlderProfileEnablesHistoryInBothSummaryFactories() {
        let current = makeInsightProfile(createdAt: 20)
        let older = makeInsightProfile(createdAt: 10, sweetScore: 66, bitterScore: 35)
        let cards = [
            TasteInsightSummaryCardData.tasteProfile(current, history: [current, older]),
            TasteInsightSummaryCardData.specialNote(current, history: [current, older])
        ]

        for card in cards {
            XCTAssertTrue(card.hasHistory, card.sectionLabel)
            for detail in card.details {
                XCTAssertEqual(detail.history, [
                    Double(older.score(for: detail.axis) - TasteRadarContract.averageScore(for: detail.axis))
                ])
                XCTAssertEqual(detail.currentScore, current.score(for: detail.axis))
            }
        }
    }

    func testTasteInsightHistoryRequiresOnlyOnePopulatedDetail() {
        let card = TasteInsightSummaryCardData(
            actionLabel: nil,
            details: [
                TasteInsightSummaryDetail(axis: .sweet, changeValue: 26, history: [], trend: .increase),
                TasteInsightSummaryDetail(axis: .bitter, changeValue: -26, history: [-20], trend: .decrease)
            ],
            keywords: [],
            sectionLabel: "특이사항",
            title: "fixture"
        )

        XCTAssertTrue(card.hasHistory)
    }

    private func makeInsightProfile(
        createdAt: TimeInterval,
        sweetScore: Int = 76,
        bitterScore: Int = 29
    ) -> TasteProfile {
        TasteProfile(
            createdAt: Date(timeIntervalSince1970: createdAt),
            scores: [
                TasteAxis.sweet.rawValue: sweetScore,
                TasteAxis.sour.rawValue: 38,
                TasteAxis.bitter.rawValue: bitterScore,
                TasteAxis.salty.rawValue: 48,
                TasteAxis.umami.rawValue: 62,
                TasteAxis.fat.rawValue: 40
            ],
            confidence: "형성 중",
            summary: "fixture",
            topAxes: [.sweet],
            cautionAxis: .bitter
        )
    }

    func testTasteInsightSummaryUsesAtMostSixHistoricalProfiles() throws {
        let profiles = (0..<8).map { index in
            TasteProfile(
                createdAt: Date(timeIntervalSince1970: Double(index)),
                scores: [TasteAxis.sweet.rawValue: 40 + index],
                confidence: "형성 중",
                summary: "fixture",
                topAxes: [.sweet],
                cautionAxis: .bitter
            )
        }
        let current = TasteProfile(
            createdAt: Date(timeIntervalSince1970: 20),
            scores: [TasteAxis.sweet.rawValue: 55],
            confidence: "형성 중",
            summary: "fixture",
            topAxes: [.sweet],
            cautionAxis: .bitter
        )

        let data = TasteInsightSummaryCardData.tasteProfile(
            current,
            history: profiles
        )
        let sweet = try XCTUnwrap(data.details.first { $0.axis == .sweet })

        XCTAssertEqual(TasteLineChartMetrics.maximumHistoryCount, 6)
        XCTAssertEqual(TasteLineChartMetrics.maximumPointCount, 7)
        XCTAssertEqual(TasteLineChartMetrics.trackLineWidth, 12)
        XCTAssertEqual(TasteLineChartMetrics.coreLineWidth, 2)
        XCTAssertEqual(TasteLineChartMetrics.currentNodeDiameter, 12)
        XCTAssertTrue(data.hasHistory)
        XCTAssertEqual(sweet.history, [-8, -7, -6, -5, -4, -3])
        let specialNote = TasteInsightSummaryCardData.specialNote(current, history: profiles)
        XCTAssertTrue(specialNote.hasHistory)
        for detail in specialNote.details {
            XCTAssertEqual(detail.history.count, 6)
            XCTAssertEqual(detail.history, profiles.suffix(6).map {
                Double($0.score(for: detail.axis) - TasteRadarContract.averageScore(for: detail.axis))
            })
        }
        XCTAssertEqual(
            TasteLineChartMetrics.visibleValues(Array(0...9).map(Double.init)),
            Array(3...9).map(Double.init)
        )
    }

    func testTasteGradientIndicatorUsesMagnitudeAcrossSharedShapeVariants() {
        let weighted = TasteGradientIndicatorMetrics.normalizedWeights(
            [30, 10],
            count: 2
        )
        let neutral = TasteGradientIndicatorMetrics.normalizedWeights(
            [0, 0],
            count: 2
        )

        XCTAssertEqual(TasteGradientIndicatorMetrics.circleSize, 16)
        XCTAssertEqual(TasteGradientIndicatorMetrics.verticalCapsuleWidth, 8)
        XCTAssertEqual(TasteGradientIndicatorMetrics.transitionHalfWidth, 0.16)
        XCTAssertEqual(weighted[0], 0.75, accuracy: 0.0001)
        XCTAssertEqual(weighted[1], 0.25, accuracy: 0.0001)
        XCTAssertEqual(neutral[0], 0.5, accuracy: 0.0001)
        XCTAssertEqual(neutral[1], 0.5, accuracy: 0.0001)
    }

    func testEdgeSwipeBackRequiresAnIntentionalRightwardEdgeGesture() {
        let containerWidth: CGFloat = 390

        XCTAssertTrue(EdgeSwipeBackMetrics.shouldNavigateBack(
            startLocation: CGPoint(x: 20, y: 300),
            translation: CGSize(width: 140, height: 8),
            predictedEndTranslation: CGSize(width: 160, height: 10),
            containerWidth: containerWidth
        ))
        XCTAssertTrue(EdgeSwipeBackMetrics.shouldNavigateBack(
            startLocation: CGPoint(x: 12, y: 300),
            translation: CGSize(width: 30, height: 2),
            predictedEndTranslation: CGSize(width: 170, height: 4),
            containerWidth: containerWidth
        ))
        XCTAssertFalse(EdgeSwipeBackMetrics.shouldNavigateBack(
            startLocation: CGPoint(x: 12, y: 300),
            translation: CGSize(width: 80, height: 3),
            predictedEndTranslation: CGSize(width: 100, height: 4),
            containerWidth: containerWidth
        ))

        XCTAssertFalse(EdgeSwipeBackMetrics.shouldNavigateBack(
            startLocation: CGPoint(x: 40, y: 300),
            translation: CGSize(width: 140, height: 4),
            predictedEndTranslation: CGSize(width: 170, height: 4),
            containerWidth: containerWidth
        ))
        XCTAssertFalse(EdgeSwipeBackMetrics.shouldNavigateBack(
            startLocation: CGPoint(x: 16, y: 300),
            translation: CGSize(width: 140, height: 150),
            predictedEndTranslation: CGSize(width: 170, height: 210),
            containerWidth: containerWidth
        ))
        XCTAssertFalse(EdgeSwipeBackMetrics.shouldNavigateBack(
            startLocation: CGPoint(x: 16, y: 300),
            translation: CGSize(width: -90, height: 2),
            predictedEndTranslation: CGSize(width: -110, height: 3),
            containerWidth: containerWidth
        ))

        XCTAssertEqual(
            EdgeSwipeBackMetrics.interactiveTranslation(
                startLocation: CGPoint(x: 12, y: 300),
                translation: CGSize(width: 195, height: 8),
                containerWidth: containerWidth
            ),
            195
        )
        XCTAssertEqual(
            EdgeSwipeBackMetrics.progress(
                translation: 195,
                containerWidth: containerWidth
            ),
            0.5
        )
    }
}

private struct StagedHeaderMarker: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.accessibilityIdentifier = "staged-header-marker"
        return view
    }
    func updateUIView(_ view: UIView, context: Context) {}
}

private struct TopChromeEnvironmentProbe: UIViewRepresentable {
    @Environment(\.tbTopChromeInset) private var inset
    @Environment(\.tbTopChromeCollapseProgress) private var progress
    let observe: (CGFloat?, CGFloat) -> Void
    func makeUIView(context: Context) -> UIView { UIView() }
    func updateUIView(_ view: UIView, context: Context) { observe(inset, progress) }
}
