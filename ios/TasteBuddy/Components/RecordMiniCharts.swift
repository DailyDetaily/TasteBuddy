import SwiftUI

/// Uses chart roles shared with web/Figma, separate from UI surface tints.
enum TBMiniChartColor {
    static func areaColor(_ axis: TasteAxis, tint: Int, mode: TBColorMode) -> Color {
        tint == 80 ? axis.chartTrackColor(in: mode) : axis.chartColor(tint: tint, in: mode)
    }
    static func color(_ axis: TasteAxis, tint: Int, mode: TBColorMode) -> Color {
        axis.chartColor(tint: tint, in: mode)
    }
}

struct TBMiniHeatmap: View {
    let values: [Int?]
    var startDay = 0
    var axis: TasteAxis = .umami
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        let cells = TBMiniHeatmapGeometry.cells(values: values, startDay: startDay)
        let mode = TBColorMode(scheme)
        Canvas { context, _ in
            for cell in cells {
                let rect = CGRect(x: cell.x, y: cell.y, width: cell.width, height: cell.height)
                let path = Path(roundedRect: rect, cornerRadius: min(2, min(cell.width / 2, cell.height / 2)))
                if cell.padding { context.fill(path, with: .color(TBColor.heatmapNeutral)) }
                else if let level = cell.level {
                    context.fill(path, with: .color(axis.heatmapColor(level: level, in: mode)))
                } else { context.fill(path, with: .color(TBColor.heatmapNeutral)) }
            }
        }
        .frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height)
        .accessibilityLabel("\(values.count)일 요리 기록 히트맵, 총 \(values.compactMap { $0 }.reduce(0, +))개. 가로 월요일부터 일요일, 세로 주차")
    }
}

struct TBMiniStackedBarChart: View {
    struct Series { let axis: TasteAxis; let values: [Double] }
    let series: [Series]
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        let count = series.map { $0.values.count }.max() ?? 0
        let totals = (0..<count).map { index -> Double in
            guard series.allSatisfy({ $0.values.indices.contains(index) && $0.values[index].isFinite && $0.values[index] >= 0 }) else { return .nan }
            return series.reduce(0) { $0 + $1.values[index] }
        }
        let maximum = totals.filter(\.isFinite).max() ?? 0
        let gap = TBMiniChartMetrics.spacing(count: count, fitWeek: false), width = TBMiniChartMetrics.barWidth(count: count, fitWeek: false)
        let cell = count > 0 ? (TBMiniChartMetrics.width - gap * CGFloat(count - 1)) / CGFloat(count) : 0
        Canvas { context, _ in
            for index in 0..<count where totals[index].isFinite {
                let x = CGFloat(index) * (cell + gap) + (cell - width) / 2
                if totals[index] == 0 {
                    let h = width / 2
                    context.fill(Path(roundedRect: CGRect(x: x, y: TBMiniChartMetrics.height - h, width: width, height: h), cornerRadius: h / 2), with: .color(TBColor.border))
                } else if maximum > 0 {
                    var cumulative = 0.0
                    var layers: [(Double, TasteAxis)] = []
                    for item in series where item.values[index] > 0 {
                        cumulative += item.values[index]; layers.append((cumulative, item.axis))
                    }
                    for (value, axis) in layers.reversed() {
                        let h = CGFloat(value / maximum) * TBMiniChartMetrics.height
                        context.fill(Path(roundedRect: CGRect(x: x, y: TBMiniChartMetrics.height - h, width: width, height: h), cornerRadius: min(width, h) / 2),
                                     with: .color(axis.miniChartTint20Color(in: TBColorMode(scheme))))
                    }
                }
            }
        }.frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height).accessibilityHidden(true)
    }
}

struct TBMiniAreaChart: View {
    enum Variant { case single, layered, comparison }
    struct Layer { let id: String; let axis: TasteAxis; let values: [Double?] }
    var values: [Double] = []
    var axis: TasteAxis = .umami
    var variant: Variant = .single
    var layers: [Layer] = []
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        if variant == .single { singleBody } else { layeredBody }
    }
    private var layeredBody: some View {
        let valid = variant != .comparison || (layers.count == 2 && layers[0].axis == layers[1].axis)
        let geometry = valid ? TBMiniAreaGeometry.layers(layers.map(\.values), comparison: variant == .comparison) : []
        return Canvas { context, _ in
            for layer in geometry {
                for run in layer.runs {
                    let points = run.map { CGPoint(x: $0.x, y: $0.y) }
                    let vertices = points + [CGPoint(x: points.last!.x, y: TBMiniChartMetrics.height), CGPoint(x: points[0].x, y: TBMiniChartMetrics.height)]
                    context.fill(Self.roundedPolygon(vertices, radius: 6),
                                 with: .color(TBMiniChartColor.areaColor(layers[layer.index].axis, tint: layer.tint, mode: TBColorMode(scheme))))
                }
            }
        }.frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height).accessibilityHidden(true)
    }
    private var singleBody: some View {
        let runs = TBMiniAreaGeometry.single(values.map { Optional($0) })
        return Canvas { context, _ in
            for run in runs {
                let points = run.map { CGPoint(x: $0.x, y: $0.y) }
                let vertices = points + [CGPoint(x: points.last!.x, y: TBMiniChartMetrics.height), CGPoint(x: points.first!.x, y: TBMiniChartMetrics.height)]
                context.fill(Self.roundedPolygon(vertices, radius: 6), with: .color(TBMiniChartColor.color(axis, tint: 60, mode: TBColorMode(scheme))))
            }
        }.frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height).accessibilityHidden(true)
    }
    static func roundedPolygon(_ input: [CGPoint], radius: CGFloat) -> Path {
        let points = input.enumerated().filter { $0.offset == 0 || $0.element != input[$0.offset - 1] }.map(\.element)
        guard points.count >= 3 else { return Path() }
        let minX = points.map(\.x).min()!, maxX = points.map(\.x).max()!
        var result = Path()
        for (index, p) in points.enumerated() {
            let before = points[(index + points.count - 1) % points.count], after = points[(index + 1) % points.count]
            let a = hypot(before.x - p.x, before.y - p.y), b = hypot(after.x - p.x, after.y - p.y)
            guard a > 0, b > 0 else { continue }
            let u = CGPoint(x: (before.x - p.x) / a, y: (before.y - p.y) / a), v = CGPoint(x: (after.x - p.x) / b, y: (after.y - p.y) / b)
            let angle = acos(max(-1, min(1, u.x * v.x + u.y * v.y))), tangent = tan(angle / 2)
            if tangent < 1e-6 || abs(.pi - angle) < 1e-6 {
                if index == 0 { result.move(to: p) } else { result.addLine(to: p) }; continue
            }
            // Match the web/Remotion optical rounding on interior top corners.
            // Each separated data run keeps its own outer edges at the original R6.
            let interior = p.x > minX && p.x < maxX
            let reach = interior ? max(radius / tangent, radius) : radius / tangent
            let d = min(reach, min(a / 2, b / 2)), actualRadius = d * tangent
            let start = CGPoint(x: p.x + u.x * d, y: p.y + u.y * d), end = CGPoint(x: p.x + v.x * d, y: p.y + v.y * d)
            let handle = 4 / 3 * tan((.pi - angle) / 4) * actualRadius
            if index == 0 { result.move(to: start) } else { result.addLine(to: start) }
            result.addCurve(to: end, control1: CGPoint(x: start.x - u.x * handle, y: start.y - u.y * handle), control2: CGPoint(x: end.x - v.x * handle, y: end.y - v.y * handle))
        }
        result.closeSubpath(); return result
    }
}

struct TBMiniPieChart: View {
    struct Segment { let value: Double; let axis: TasteAxis }
    let segments: [Segment]
    var absolute = false
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        let valid = segments.allSatisfy { $0.value.isFinite && $0.value >= 0 }
        let total = segments.reduce(0) { $0 + $1.value }
        let values = valid && (!absolute || total <= 100 + 1e-10)
            ? segments.map(\.value) + (absolute ? [max(0, 100 - total)] : []) : []
        let denominator = values.reduce(0, +), separated = values.filter { $0 > 0 }.count > 1
        HStack(spacing: 0) {
            Spacer(minLength: 0)
            Canvas { context, _ in
                var angle = 0.0
                guard denominator > 0 else {
                    context.stroke(Path(ellipseIn: CGRect(x: 0.5, y: 0.5, width: TBMiniChartMetrics.height - 1, height: TBMiniChartMetrics.height - 1)), with: .color(TBColor.border), lineWidth: 1); return
                }
                for (index, value) in values.enumerated() where value > 0 {
                    let end = angle + value / denominator * 2 * .pi
                    let color = index == segments.count ? TBColorMode(scheme).chartRemainder
                        : TBMiniChartColor.color(segments[index].axis, tint: 40, mode: TBColorMode(scheme))
                    context.fill(Self.sector(start: angle, end: end, separated: separated), with: .color(color)); angle = end
                }
            }.frame(width: TBMiniChartMetrics.height, height: TBMiniChartMetrics.height)
        }.frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height).accessibilityHidden(true)
    }

    /// Scaled port of symbolDonutGeometry.ts: identical straight sides and rounded corners.
    static func sector(start: Double, end: Double, separated: Bool) -> Path {
        if !separated { return Path(ellipseIn: CGRect(x: 0, y: 0, width: TBMiniChartMetrics.height, height: TBMiniChartMetrics.height)) }
        let size = TBMiniChartDimensions.height, scale = size / 32
        let outer = size / 2, halfGap = 0.5 * scale, span = end - start, sine = sin((end - start) / 2)
        let radius = min(size * 10 / 86, (outer * sine - halfGap) / (1 + sine) * 0.98)
        // The fixed gap consumes very narrow sectors, as in the web small-sector fallback.
        guard radius > 0, sine > 0 else { return Path() }
        let along = sqrt(max(0, pow(outer - radius, 2) - pow(halfGap + radius, 2)))
        let turn = abs(Double.pi - span), cotangent = cos(span / 2) / sine
        let arcRadius = turn > 1e-6 ? (.pi / 2 * 3 * scale) / turn : 0
        let spaceRadius = abs(cotangent) > 1e-6 ? max(0, along - halfGap * cotangent) / abs(cotangent) * 0.98 : Double.infinity
        let setbackRadius = 1 - sine > 1e-6 ? 1.4 * scale * sine / (1 - sine) : Double.infinity
        let tipRadius = min(arcRadius, min(spaceRadius, setbackRadius)), reflex = span > .pi
        let middle = (start + end) / 2, distance = (halfGap + (reflex ? -tipRadius : tipRadius)) / sine
        let tipCenter = CGPoint(x: distance * sin(middle), y: -distance * cos(middle))
        func side(_ angle: Double, _ isStart: Bool) -> (center: CGPoint, side: CGPoint, ring: CGPoint, tip: CGPoint) {
            let sign = isStart ? 1.0 : -1.0, dx = sin(angle), dy = -cos(angle), nx = sign * cos(angle), ny = sign * sin(angle)
            let center = CGPoint(x: along * dx + (halfGap + radius) * nx, y: along * dy + (halfGap + radius) * ny)
            return (center, CGPoint(x: along * dx + halfGap * nx, y: along * dy + halfGap * ny),
                    CGPoint(x: center.x * outer / (outer - radius), y: center.y * outer / (outer - radius)),
                    CGPoint(x: tipCenter.x + (reflex ? tipRadius : -tipRadius) * nx, y: tipCenter.y + (reflex ? tipRadius : -tipRadius) * ny))
        }
        let a = side(start, true), b = side(end, false)
        func translated(_ p: CGPoint) -> CGPoint { CGPoint(x: p.x + outer, y: p.y + outer) }
        var path = Path(); path.move(to: translated(a.ring))
        func arc(_ center: CGPoint, _ r: Double, _ from: CGPoint, _ to: CGPoint, ccw: Bool = false) {
            let beginning = atan2(from.y - center.y, from.x - center.x)
            var delta = atan2(to.y - center.y, to.x - center.x) - beginning
            if abs(delta) < 1e-10 { return }
            if ccw { while delta > 0 { delta -= 2 * .pi }; delta = max(-2 * .pi, delta) }
            else { while delta < 0 { delta += 2 * .pi }; delta = min(2 * .pi, delta) }
            let steps = Int(ceil(abs(delta) / (.pi / 2)))
            for index in 0..<steps {
                let x = beginning + delta * Double(index) / Double(steps), y = beginning + delta * Double(index + 1) / Double(steps)
                let k = 4 / 3 * tan((y - x) / 4)
                path.addCurve(to: translated(CGPoint(x: center.x + r * cos(y), y: center.y + r * sin(y))),
                              control1: translated(CGPoint(x: center.x + r * (cos(x) - k * sin(x)), y: center.y + r * (sin(x) + k * cos(x)))),
                              control2: translated(CGPoint(x: center.x + r * (cos(y) + k * sin(y)), y: center.y + r * (sin(y) - k * cos(y)))))
            }
        }
        arc(.zero, outer, a.ring, b.ring); arc(b.center, radius, b.ring, b.side)
        path.addLine(to: translated(b.tip)); arc(tipCenter, tipRadius, b.tip, a.tip, ccw: reflex)
        path.addLine(to: translated(a.side)); arc(a.center, radius, a.side, a.ring); path.closeSubpath()
        return path
    }
}

struct TBMiniBubbleChart: View {
    enum Content { case value, icon }
    struct Item { let value: Double; let axis: TasteAxis; var dishKindID: String? = nil }
    struct Bubble: Identifiable { let id: Int; let item: Item; let center: CGFloat; let diameter: CGFloat }
    let items: [Item]
    var content: Content = .value
    @Environment(\.colorScheme) private var scheme
    private var bubbles: [Bubble] {
        let positive = items.filter { $0.value.isFinite && $0.value > 0 }
        guard let maximum = positive.map(\.value).max() else { return [] }
        let gap = min(4, TBMiniChartDimensions.width / Double(positive.count * 2))
        let diameters = positive.map { TBMiniChartDimensions.height * sqrt($0.value / maximum) }
        let total = diameters.reduce(0, +), gaps = gap * Double(positive.count - 1)
        let scale = min(1, (TBMiniChartDimensions.width - gaps) / total)
        var cursor = TBMiniChartDimensions.width - total * scale - gaps
        return positive.enumerated().map { index, item in
            let diameter = diameters[index] * scale
            let bubble = Bubble(id: index, item: item, center: cursor + diameter / 2, diameter: diameter)
            cursor += diameter + gap; return bubble
        }
    }
    var body: some View {
        ZStack(alignment: .topLeading) {
            ForEach(bubbles) { bubble in
                Circle().fill(TBMiniChartColor.color(bubble.item.axis, tint: 40, mode: TBColorMode(scheme)))
                    .frame(width: bubble.diameter, height: bubble.diameter).position(x: bubble.center, y: TBMiniChartMetrics.height / 2)
                glyph(bubble).position(x: bubble.center, y: TBMiniChartMetrics.height / 2)
            }
        }.frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height).accessibilityHidden(true)
    }
    @ViewBuilder private func glyph(_ bubble: Bubble) -> some View {
        if content == .icon {
            let size = min(16, bubble.diameter * 0.6)
            if let id = bubble.item.dishKindID, UIImage(named: "DishKind-" + id) != nil {
                Image("DishKind-" + id).renderingMode(.template).resizable().scaledToFit()
                    .frame(width: size, height: size).foregroundStyle(TBColor.chartOnBrightFill)
            } else { LucideIcon(systemName: "circle.dot", size: size).foregroundStyle(TBColor.chartOnBrightFill) }
        } else {
            let label = bubble.item.value.rounded() == bubble.item.value ? String(Int(bubble.item.value)) : String(bubble.item.value)
            let fontSize = max(0, min(10, min(bubble.diameter * 0.72, (bubble.diameter - 2) / (Double(label.count) * 0.62))))
            if fontSize > 0 { Text(label).font(TBFont.medium(fontSize)).foregroundStyle(TBColor.chartOnBrightFill) }
        }
    }
}
