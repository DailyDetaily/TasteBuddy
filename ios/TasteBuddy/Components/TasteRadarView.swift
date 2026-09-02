import SwiftUI

struct RadarTasteEntry: Identifiable, Equatable {
    let axis: TasteAxis
    let score: Int
    let averageScore: Int

    var id: TasteAxis.ID { axis.id }

    init(axis: TasteAxis, score: Int, averageScore: Int? = nil) {
        self.axis = axis
        self.score = min(max(score, 0), 100)
        self.averageScore = min(
            max(averageScore ?? TasteRadarContract.averageScore(for: axis), 0),
            100
        )
    }
}

struct RadarMeasurementSnapshot: Identifiable, Equatable {
    let id: String
    let periodLabel: String
    let entries: [RadarTasteEntry]
    let totalSensitivityLabel: String

    init(
        id: String,
        periodLabel: String,
        entries: [RadarTasteEntry],
        totalSensitivityLabel: String
    ) {
        self.id = id
        self.periodLabel = periodLabel
        self.entries = TasteRadarContract.normalizedEntries(entries)
        self.totalSensitivityLabel = totalSensitivityLabel
    }

    init(profile: TasteProfile, periodLabel: String = "최근 측정") {
        self.init(
            id: profile.createdAt.ISO8601Format(),
            periodLabel: periodLabel,
            entries: TasteAxis.allCases.map {
                RadarTasteEntry(axis: $0, score: profile.score(for: $0))
            },
            totalSensitivityLabel: profile.totalSensitivityLabel
        )
    }
}

enum TasteRadarContract {
    static let canvasSize = CGSize(width: 320, height: 310)
    static let center = CGPoint(x: 160, y: 145)
    static let maximumRadius: CGFloat = 100
    static let gridLevels: [CGFloat] = [0.25, 0.5, 0.75, 1]
    static let nodeRadius: CGFloat = 8
    static let profileOutlineRadius: CGFloat = 9
    static let baseCornerRadius: CGFloat = 8
    static let maximumCornerRadius: CGFloat = 16
    static let centerMaskRadius: CGFloat = 18 * (25 / 27)

    static func averageScore(for axis: TasteAxis) -> Int {
        switch axis {
        case .sweet: 50
        case .sour: 44
        case .bitter: 55
        case .salty: 48
        case .umami: 52
        case .fat: 40
        }
    }

    static func normalizedEntries(_ entries: [RadarTasteEntry]) -> [RadarTasteEntry] {
        let entriesByAxis = Dictionary(uniqueKeysWithValues: entries.map { ($0.axis, $0) })
        return TasteAxis.allCases.map { axis in
            entriesByAxis[axis] ?? RadarTasteEntry(axis: axis, score: 50)
        }
    }

    static func basePoint(index: Int, value: CGFloat = 1) -> CGPoint {
        let angle = (CGFloat.pi / 3) * CGFloat(index) - CGFloat.pi / 2 - CGFloat.pi / 6
        return CGPoint(
            x: center.x + maximumRadius * value * cos(angle),
            y: center.y + maximumRadius * value * sin(angle)
        )
    }

    static func animationProgress(_ progress: CGFloat) -> CGFloat {
        let clampedProgress = min(max(progress, 0), 1)
        guard clampedProgress > 0, clampedProgress < 1 else {
            return clampedProgress
        }

        let x1: CGFloat = 0.3
        let y1: CGFloat = 0
        let x2: CGFloat = 0.1
        let y2: CGFloat = 1
        let cx = 3 * x1
        let bx = 3 * (x2 - x1) - cx
        let ax = 1 - cx - bx
        let cy = 3 * y1
        let by = 3 * (y2 - y1) - cy
        let ay = 1 - cy - by
        let sampleX: (CGFloat) -> CGFloat = { t in
            ((ax * t + bx) * t + cx) * t
        }
        let sampleY: (CGFloat) -> CGFloat = { t in
            ((ay * t + by) * t + cy) * t
        }
        let derivativeX: (CGFloat) -> CGFloat = { t in
            (3 * ax * t + 2 * bx) * t + cx
        }

        var time = clampedProgress
        for _ in 0..<5 {
            let currentX = sampleX(time) - clampedProgress
            let slope = derivativeX(time)
            guard abs(currentX) >= 0.0001, abs(slope) >= 0.000001 else {
                break
            }
            time -= currentX / slope
        }

        var lowerBound: CGFloat = 0
        var upperBound: CGFloat = 1
        time = min(max(time, 0), 1)
        for _ in 0..<8 {
            let currentX = sampleX(time)
            guard abs(currentX - clampedProgress) >= 0.00001 else {
                break
            }
            if currentX > clampedProgress {
                upperBound = time
            } else {
                lowerBound = time
            }
            time = (lowerBound + upperBound) / 2
        }

        return sampleY(time)
    }
}

/// SwiftUI-native counterpart of the React `HexRadarChart.tsx` component.
struct HexRadarChart: View {
    private let entries: [RadarTasteEntry]
    var shouldAnimate = true

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animationStart = Date.distantPast
    @State private var isAnimating = false

    init(myTasteData: [RadarTasteEntry], shouldAnimate: Bool = true) {
        self.entries = TasteRadarContract.normalizedEntries(myTasteData)
        self.shouldAnimate = shouldAnimate
    }

    init(entries: [RadarTasteEntry], shouldAnimate: Bool = true) {
        self.init(myTasteData: entries, shouldAnimate: shouldAnimate)
    }

    init(profile: TasteProfile, shouldAnimate: Bool = true) {
        self.init(
            myTasteData: TasteAxis.allCases.map {
                RadarTasteEntry(axis: $0, score: profile.score(for: $0))
            },
            shouldAnimate: shouldAnimate
        )
    }

    var body: some View {
        TimelineView(
            .animation(minimumInterval: 1 / 60, paused: !isAnimating)
        ) { timeline in
            Canvas(opaque: false, colorMode: .nonLinear, rendersAsynchronously: false) {
                context,
                size in
                drawChart(
                    context: &context,
                    size: size,
                    profileProgress: animationProgress(at: timeline.date)
                )
            }
        }
        .aspectRatio(
            TasteRadarContract.canvasSize.width / TasteRadarContract.canvasSize.height,
            contentMode: .fit
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("여섯 가지 미각 축을 보여주는 미각 반응 차트")
        .accessibilityValue(accessibilitySummary)
        .onAppear(perform: restartAnimation)
        .onChange(of: entries) {
            restartAnimation()
        }
    }

    private var accessibilitySummary: String {
        entries
            .map { "\($0.axis.label) \($0.score)점, 기준 \($0.averageScore)점" }
            .joined(separator: ", ")
    }

    private func restartAnimation() {
        guard shouldAnimate, !reduceMotion else {
            isAnimating = false
            return
        }

        animationStart = .now
        isAnimating = true
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(1))
            isAnimating = false
        }
    }

    private func animationProgress(at date: Date) -> CGFloat {
        guard shouldAnimate, !reduceMotion else { return 1 }
        guard isAnimating else { return 1 }
        let rawProgress = min(max(date.timeIntervalSince(animationStart), 0), 1)
        return TasteRadarContract.animationProgress(CGFloat(rawProgress))
    }

    private func drawChart(
        context: inout GraphicsContext,
        size: CGSize,
        profileProgress: CGFloat
    ) {
        let geometry = RadarGeometry(size: size)
        let gridColor = Color(hex: 0xF3F3F3)
        let outerPoints = entries.indices.map {
            geometry.point(index: $0, value: 1)
        }

        for level in TasteRadarContract.gridLevels {
            context.stroke(
                RadarGeometry.closedPolygon(
                    entries.indices.map { geometry.point(index: $0, value: level) }
                ),
                with: .color(gridColor),
                lineWidth: geometry.scaled(1)
            )
        }

        for (first, second) in [(0, 3), (1, 4), (2, 5)] {
            var diagonal = Path()
            diagonal.move(to: outerPoints[first])
            diagonal.addLine(to: outerPoints[second])
            context.stroke(
                diagonal,
                with: .color(gridColor),
                lineWidth: geometry.scaled(1)
            )
        }

        let averagePoints = entries.enumerated().map { index, entry in
            geometry.point(index: index, value: CGFloat(entry.averageScore) / 100)
        }
        context.stroke(
            RadarGeometry.roundedClosedPath(
                points: averagePoints,
                cornerRadius: geometry.scaled(8)
            ),
            with: .color(Color(hex: 0xD0D0D0)),
            lineWidth: geometry.scaled(1.5)
        )

        let profilePoints = entries.enumerated().map { index, entry in
            geometry.point(
                index: index,
                value: CGFloat(entry.score) / 100 * profileProgress
            )
        }
        let adaptiveRadii = RadarGeometry.adaptiveCornerRadii(
            points: profilePoints,
            baseRadius: geometry.scaled(TasteRadarContract.baseCornerRadius),
            maximumRadius: geometry.scaled(TasteRadarContract.maximumCornerRadius)
        )
        let profileCorners = RadarGeometry.roundedCorners(
            points: profilePoints,
            cornerRadii: adaptiveRadii
        )
        let nodePoints = profilePoints.enumerated().map { index, point -> CGPoint in
            guard let corner = profileCorners[safe: index] else {
                return RadarGeometry.moveTowardCenter(
                    point,
                    center: geometry.center,
                    offset: geometry.scaled(TasteRadarContract.nodeRadius)
                )
            }

            let bezierMidpoint = CGPoint(
                x: 0.25 * corner.entry.x + 0.5 * corner.control.x + 0.25 * corner.exit.x,
                y: 0.25 * corner.entry.y + 0.5 * corner.control.y + 0.25 * corner.exit.y
            )
            return RadarGeometry.moveTowardCenter(
                bezierMidpoint,
                center: geometry.center,
                offset: geometry.scaled(TasteRadarContract.nodeRadius)
            )
        }

        for (index, nodePoint) in nodePoints.enumerated() {
            var spoke = Path()
            spoke.move(to: geometry.center)
            spoke.addLine(to: nodePoint)
            context.stroke(
                spoke,
                with: .color(entries[index].axis.radarSpokeColor),
                style: StrokeStyle(
                    lineWidth: geometry.scaled(16),
                    lineCap: .round
                )
            )
        }

        context.fill(
            RadarGeometry.hexagramPath(
                center: geometry.center,
                outerRadius: geometry.scaled(TasteRadarContract.centerMaskRadius)
            ),
            with: .color(.white)
        )

        let segments = RadarGeometry.profileSegments(
            centers: nodePoints,
            radius: geometry.scaled(TasteRadarContract.profileOutlineRadius),
            fallbackPoints: outerPoints,
            center: geometry.center
        )
        for (index, segment) in segments.enumerated() {
            let nextIndex = (index + 1) % entries.count
            context.stroke(
                segment.path,
                with: .linearGradient(
                    Gradient(colors: [
                        entries[index].axis.radarOutlineColor,
                        entries[nextIndex].axis.radarOutlineColor
                    ]),
                    startPoint: segment.gradientStart,
                    endPoint: segment.gradientEnd
                ),
                style: StrokeStyle(
                    lineWidth: geometry.scaled(2),
                    lineCap: .round,
                    lineJoin: .round
                )
            )
        }

        for (index, point) in nodePoints.enumerated() {
            let radius = geometry.scaled(TasteRadarContract.nodeRadius)
            context.fill(
                Path(
                    ellipseIn: CGRect(
                        x: point.x - radius,
                        y: point.y - radius,
                        width: radius * 2,
                        height: radius * 2
                    )
                ),
                with: .color(entries[index].axis.mainColor)
            )
        }

        for (index, entry) in entries.enumerated() {
            let labelPoint = geometry.point(
                index: index,
                radius: TasteRadarContract.maximumRadius + 10
            )
            let label = context.resolve(
                Text(entry.axis.label)
                    .font(TBFont.medium(10))
                    .foregroundStyle(TBColor.textHint)
            )
            context.draw(label, at: labelPoint, anchor: labelAnchor(index: index))
        }
    }

    private func labelAnchor(index: Int) -> UnitPoint {
        switch index {
        case 0, 1: .bottom
        case 2: .leading
        case 3, 4: .top
        case 5: .trailing
        default: .center
        }
    }
}

struct TasteRadarView: View {
    private let chart: HexRadarChart

    init(entries: [RadarTasteEntry], shouldAnimate: Bool = true) {
        chart = HexRadarChart(entries: entries, shouldAnimate: shouldAnimate)
    }

    init(profile: TasteProfile, shouldAnimate: Bool = true) {
        chart = HexRadarChart(profile: profile, shouldAnimate: shouldAnimate)
    }

    var body: some View {
        chart
    }
}

private struct RadarRoundedCorner {
    let control: CGPoint
    let entry: CGPoint
    let exit: CGPoint
}

private struct RadarProfileSegment {
    let path: Path
    let gradientStart: CGPoint
    let gradientEnd: CGPoint
}

private struct RadarGeometry {
    let scale: CGFloat
    let origin: CGPoint

    init(size: CGSize) {
        scale = min(
            size.width / TasteRadarContract.canvasSize.width,
            size.height / TasteRadarContract.canvasSize.height
        )
        origin = CGPoint(
            x: (size.width - TasteRadarContract.canvasSize.width * scale) / 2,
            y: (size.height - TasteRadarContract.canvasSize.height * scale) / 2
        )
    }

    var center: CGPoint {
        convert(TasteRadarContract.center)
    }

    func scaled(_ value: CGFloat) -> CGFloat {
        value * scale
    }

    func convert(_ point: CGPoint) -> CGPoint {
        CGPoint(
            x: origin.x + point.x * scale,
            y: origin.y + point.y * scale
        )
    }

    func point(index: Int, value: CGFloat = 1) -> CGPoint {
        convert(TasteRadarContract.basePoint(index: index, value: value))
    }

    func point(index: Int, radius: CGFloat) -> CGPoint {
        point(
            index: index,
            value: radius / TasteRadarContract.maximumRadius
        )
    }

    static func closedPolygon(_ points: [CGPoint]) -> Path {
        Path { path in
            guard let first = points.first else { return }
            path.move(to: first)
            points.dropFirst().forEach { path.addLine(to: $0) }
            path.closeSubpath()
        }
    }

    static func roundedClosedPath(points: [CGPoint], cornerRadius: CGFloat) -> Path {
        buildClosedPath(
            corners: roundedCorners(
                points: points,
                cornerRadii: points.map { _ in cornerRadius }
            )
        )
    }

    static func roundedCorners(
        points: [CGPoint],
        cornerRadii: [CGFloat]
    ) -> [RadarRoundedCorner] {
        guard points.count >= 3 else { return [] }

        return points.enumerated().map { index, point in
            let previous = points[(index - 1 + points.count) % points.count]
            let next = points[(index + 1) % points.count]
            return roundedCorner(
                point: point,
                previous: previous,
                next: next,
                radius: cornerRadii[safe: index] ?? 8
            )
        }
    }

    static func adaptiveCornerRadii(
        points: [CGPoint],
        baseRadius: CGFloat,
        maximumRadius: CGFloat
    ) -> [CGFloat] {
        guard points.count >= 3 else {
            return points.map { _ in baseRadius }
        }

        let thresholdAngle = CGFloat(140) / 180 * .pi
        return points.enumerated().map { index, point in
            let previous = points[(index - 1 + points.count) % points.count]
            let next = points[(index + 1) % points.count]
            let first = CGVector(dx: previous.x - point.x, dy: previous.y - point.y)
            let second = CGVector(dx: next.x - point.x, dy: next.y - point.y)
            let firstLength = hypot(first.dx, first.dy)
            let secondLength = hypot(second.dx, second.dy)

            guard firstLength >= 1, secondLength >= 1 else {
                return baseRadius
            }

            let cosine = min(
                max(
                    (first.dx * second.dx + first.dy * second.dy)
                        / (firstLength * secondLength),
                    -1
                ),
                1
            )
            let angle = acos(cosine)
            guard angle < thresholdAngle else { return baseRadius }
            let sharpness = 1 - angle / thresholdAngle
            return baseRadius + (maximumRadius - baseRadius) * sharpness
        }
    }

    static func moveTowardCenter(
        _ point: CGPoint,
        center: CGPoint,
        offset: CGFloat
    ) -> CGPoint {
        let dx = center.x - point.x
        let dy = center.y - point.y
        let distance = hypot(dx, dy)
        let safeOffset = min(offset, distance)
        guard distance > 0, safeOffset > 0 else { return point }
        return CGPoint(
            x: point.x + dx / distance * safeOffset,
            y: point.y + dy / distance * safeOffset
        )
    }

    static func hexagramPath(center: CGPoint, outerRadius: CGFloat) -> Path {
        let innerRadius = outerRadius / sqrt(3)
        let points = (0..<12).map { index -> CGPoint in
            let radius = index.isMultiple(of: 2) ? outerRadius : innerRadius
            let angle = (-90 + CGFloat(30 * index)) * .pi / 180
            return CGPoint(
                x: center.x + radius * cos(angle),
                y: center.y + radius * sin(angle)
            )
        }
        return closedPolygon(points)
    }

    static func profileSegments(
        centers: [CGPoint],
        radius: CGFloat,
        fallbackPoints: [CGPoint],
        center: CGPoint
    ) -> [RadarProfileSegment] {
        guard centers.count >= 3, radius > 0 else { return [] }

        let currentArea = signedArea(centers)
        let fallbackArea = signedArea(fallbackPoints)
        let isClockwise = abs(currentArea) >= 0.001 ? currentArea > 0 : fallbackArea >= 0
        let snapPoints = centers.map {
            snapToOuterEdge(center: center, point: $0, radius: radius)
        }
        let shouldSnap = centers.indices.map {
            shouldSnapNode(
                centers: centers,
                index: $0,
                center: center,
                radius: radius
            )
        }
        let tangentSegments = centers.enumerated().map { index, node -> (CGPoint, CGPoint) in
            let next = centers[(index + 1) % centers.count]
            let unit = edgeUnitVector(
                points: centers,
                fallbackPoints: fallbackPoints,
                index: index
            )
            let normal = isClockwise
                ? CGVector(dx: unit.dy, dy: -unit.dx)
                : CGVector(dx: -unit.dy, dy: unit.dx)
            return (
                CGPoint(x: node.x + normal.dx * radius, y: node.y + normal.dy * radius),
                CGPoint(x: next.x + normal.dx * radius, y: next.y + normal.dy * radius)
            )
        }

        return tangentSegments.enumerated().map { index, segment in
            let nextIndex = (index + 1) % centers.count
            let nextSegment = tangentSegments[nextIndex]
            let start = shouldSnap[index] ? snapPoints[index] : segment.0
            let end = shouldSnap[nextIndex] ? snapPoints[nextIndex] : segment.1
            var path = Path()
            path.move(to: start)
            path.addLine(to: end)

            var gradientEnd = end
            if !shouldSnap[nextIndex] {
                let arcCenter = centers[nextIndex]
                path.addArc(
                    center: arcCenter,
                    radius: radius,
                    startAngle: .radians(
                        atan2(end.y - arcCenter.y, end.x - arcCenter.x)
                    ),
                    endAngle: .radians(
                        atan2(
                            nextSegment.0.y - arcCenter.y,
                            nextSegment.0.x - arcCenter.x
                        )
                    ),
                    clockwise: !isClockwise
                )
                gradientEnd = nextSegment.0
            }

            return RadarProfileSegment(
                path: path,
                gradientStart: start,
                gradientEnd: gradientEnd
            )
        }
    }

    private static func roundedCorner(
        point: CGPoint,
        previous: CGPoint,
        next: CGPoint,
        radius: CGFloat
    ) -> RadarRoundedCorner {
        let incoming = CGVector(dx: previous.x - point.x, dy: previous.y - point.y)
        let outgoing = CGVector(dx: next.x - point.x, dy: next.y - point.y)
        let incomingDistance = max(hypot(incoming.dx, incoming.dy), 1)
        let outgoingDistance = max(hypot(outgoing.dx, outgoing.dy), 1)
        let safeRadius = min(radius, incomingDistance / 2, outgoingDistance / 2)

        return RadarRoundedCorner(
            control: point,
            entry: CGPoint(
                x: point.x + incoming.dx / incomingDistance * safeRadius,
                y: point.y + incoming.dy / incomingDistance * safeRadius
            ),
            exit: CGPoint(
                x: point.x + outgoing.dx / outgoingDistance * safeRadius,
                y: point.y + outgoing.dy / outgoingDistance * safeRadius
            )
        )
    }

    private static func buildClosedPath(corners: [RadarRoundedCorner]) -> Path {
        Path { path in
            guard let first = corners.first else { return }
            path.move(to: first.exit)
            for corner in corners.dropFirst() {
                path.addLine(to: corner.entry)
                path.addQuadCurve(to: corner.exit, control: corner.control)
            }
            path.addLine(to: first.entry)
            path.addQuadCurve(to: first.exit, control: first.control)
            path.closeSubpath()
        }
    }

    private static func signedArea(_ points: [CGPoint]) -> CGFloat {
        points.enumerated().reduce(0) { area, element in
            let next = points[(element.offset + 1) % points.count]
            return area + element.element.x * next.y - element.element.y * next.x
        }
    }

    private static func snapToOuterEdge(
        center: CGPoint,
        point: CGPoint,
        radius: CGFloat
    ) -> CGPoint {
        let dx = point.x - center.x
        let dy = point.y - center.y
        let distance = hypot(dx, dy)
        guard distance >= 0.001, radius > 0 else { return point }
        return CGPoint(
            x: point.x + dx / distance * radius,
            y: point.y + dy / distance * radius
        )
    }

    private static func shouldSnapNode(
        centers: [CGPoint],
        index: Int,
        center: CGPoint,
        radius: CGFloat
    ) -> Bool {
        let currentDistance = distance(center, centers[index])
        let previousDistance = distance(
            center,
            centers[(index - 1 + centers.count) % centers.count]
        )
        let nextDistance = distance(center, centers[(index + 1) % centers.count])
        return min(previousDistance, nextDistance) - currentDistance >= radius * 0.5
    }

    private static func edgeUnitVector(
        points: [CGPoint],
        fallbackPoints: [CGPoint],
        index: Int
    ) -> CGVector {
        let nextIndex = (index + 1) % points.count
        let vector = CGVector(
            dx: points[nextIndex].x - points[index].x,
            dy: points[nextIndex].y - points[index].y
        )
        if hypot(vector.dx, vector.dy) >= 0.001 {
            return normalized(vector)
        }

        return normalized(
            CGVector(
                dx: fallbackPoints[nextIndex].x - fallbackPoints[index].x,
                dy: fallbackPoints[nextIndex].y - fallbackPoints[index].y
            )
        )
    }

    private static func normalized(_ vector: CGVector) -> CGVector {
        let length = hypot(vector.dx, vector.dy)
        guard length >= 0.001 else { return CGVector(dx: 1, dy: 0) }
        return CGVector(dx: vector.dx / length, dy: vector.dy / length)
    }

    private static func distance(_ first: CGPoint, _ second: CGPoint) -> CGFloat {
        hypot(first.x - second.x, first.y - second.y)
    }
}

private extension TasteAxis {
    var radarSpokeColor: Color {
        switch self {
        case .sweet: Color(hex: 0xFFE1B3)
        case .sour: Color(hex: 0xFEEABD)
        case .bitter: Color(hex: 0xE1F0B7)
        case .salty: Color(hex: 0xD7E2FF)
        case .umami: Color(hex: 0xE8D7E9)
        case .fat: Color(hex: 0xE0DBD8)
        }
    }

    var radarOutlineColor: Color {
        switch self {
        case .sweet: Color(hex: 0xFFCC80)
        case .sour: Color(hex: 0xFDE096)
        case .bitter: Color(hex: 0xCAE480)
        case .salty: Color(hex: 0xB9CCFF)
        case .umami: Color(hex: 0xD9B9DA)
        case .fat: Color(hex: 0xCAC2BD)
        }
    }
}

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

#if canImport(PreviewsMacros)
    #Preview {
        HexRadarChart(profile: .sample, shouldAnimate: false)
            .padding(20)
            .frame(width: 360)
            .background(Color.white)
    }
#endif
