import SwiftUI

/// Invert the existing R layout by adjusting virtual corner heights only.
/// Source coordinates remain fixed and the two strokes use one shared path.
enum TasteDetailLineAlignment {
    struct Layout {
        let controls: [CGPoint]
        let radius: CGFloat
    }
    static func layout(_ points: [CGPoint], radius: CGFloat = 12) -> Layout {
        guard points.allSatisfy({ $0.x.isFinite && $0.y.isFinite }) else { return .init(controls: [], radius: 0) }
        guard points.count >= 3, radius > 0,
              !points.enumerated().contains(where: { index, point in index > 0 && point.x <= points[index - 1].x }) else {
            return .init(controls: points, radius: 0)
        }
        var effectiveRadius = radius
        for _ in 0..<8 {
            var controls = points
            for _ in 0..<160 {
                let markers = TasteLineRounding.markers(controls, radius: effectiveRadius)
                let errors = markers.indices.map { points[$0].y - markers[$0].y }
                if errors.contains(where: { !$0.isFinite }) { break }
                if (errors.map { abs($0) }.max() ?? 0) < 1e-7 {
                    return .init(controls: controls, radius: effectiveRadius)
                }
                controls = controls.enumerated().map { index, point in
                    index == 0 || index == controls.count - 1 ? point
                        : CGPoint(x: point.x, y: point.y + errors[index] * 0.85)
                }
            }
            effectiveRadius /= 2
        }
        return .init(controls: points, radius: 0)
    }
}

/// Detail presentation of the existing account-scoped, validated aggregates only.
/// Callers retain their original unit, confirmed-meal/local-calendar period, denominator,
/// deduplication and future/unknown rules. Nil is not zero; no display values are persisted.
/// Detail axes are linear from zero, independently of the optical minimum used by mini charts.
enum TasteDetailChartScale {
    static func value(_ value: Double?) -> Double? {
        guard let value, value.isFinite, value >= 0 else { return nil }
        return value
    }
    static func ticks(maximum: Double, integer: Bool = true) -> [Double] {
        let maximum = value(maximum) ?? 0
        guard maximum > 0 else { return [0, 1] }
        let raw = maximum / 4
        let power = pow(10, floor(log10(raw)))
        let fraction = raw / power
        let nice = (fraction <= 1 ? 1.0 : fraction <= 2 ? 2.0 : fraction <= 5 ? 5.0 : 10.0) * power
        let step = integer ? max(1, nice) : nice
        let count = max(1, Int(ceil(maximum / step)))
        return (0...count).map { Double($0) * step }
    }
    static func area(_ values: [Double?]) -> Double {
        guard values.count > 1 else { return 0 }
        return (1..<values.count).reduce(0) { total, index in
            guard let left = value(values[index - 1]), let right = value(values[index]) else { return total }
            return total + (left + right) / 2
        }
    }
    static func label(_ value: Double) -> String {
        value == value.rounded() ? String(format: "%.0f", value) : String(format: "%.1f", value)
    }
}

struct TasteDetailChartSeries: Identifiable, Equatable {
    let id: String
    let label: String
    let values: [Double?]
    let color: Color
    var valueLabels: [String]? = nil
    var fillColor: Color? = nil
    var axis: TasteAxis? = nil
    var isComparison = false
    var highlightsEachValue = false
    var comparisonIndices: Set<Int> = []
}

/// Only emphasis animates; the measured point and shared line path stay fixed.
private struct TasteDetailLineNode: View, Animatable {
    let point: CGPoint
    let plot: CGRect
    let lineStart: Color
    let nodeStart: Color
    let endColor: Color
    var emphasis: Double

    var animatableData: Double {
        get { emphasis }
        set { emphasis = newValue }
    }

    var body: some View {
        Canvas { context, _ in
            let progress = min(1, max(0, emphasis))
            let diameter = TasteLineChartMetrics.historyNodeDiameter
                + (TasteLineChartMetrics.currentNodeDiameter - TasteLineChartMetrics.historyNodeDiameter) * CGFloat(progress)
            let node = Path(ellipseIn: CGRect(x: point.x - diameter / 2, y: point.y - diameter / 2, width: diameter, height: diameter))
            let start = CGPoint(x: plot.minX, y: 0), end = CGPoint(x: plot.maxX, y: 0)
            let base = GraphicsContext.Shading.linearGradient(Gradient(colors: [lineStart, endColor]), startPoint: start, endPoint: end)
            let selected = GraphicsContext.Shading.linearGradient(Gradient(colors: [nodeStart, endColor]), startPoint: start, endPoint: end)
            context.fill(node, with: base)
            context.opacity = progress
            context.fill(node, with: selected)
            let ringDiameter = 10 + 8 * CGFloat(progress)
            context.stroke(Path(ellipseIn: CGRect(x: point.x - ringDiameter / 2, y: point.y - ringDiameter / 2, width: ringDiameter, height: ringDiameter)),
                           with: selected, lineWidth: 1)
        }
    }
}

struct TasteDetailCartesianChart: View {
    enum Style { case bar, grouped, stacked, line, area, layeredArea }
    let labels: [String]
    let series: [TasteDetailChartSeries]
    var style: Style = .bar
    var unit = "개"
    var height: CGFloat = 232
    var fixedMaximum: Double? = nil
    var integerTicks = true
    var onSelect: ((Int) -> Void)? = nil
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var selectedIndex: Int?

    private var isLine: Bool { style == .line || style == .area || style == .layeredArea }
    private var selection: Int? {
        if let selectedIndex, labels.indices.contains(selectedIndex) { return selectedIndex }
        return labels.indices.last { index in series.contains { value($0, at: index) != nil } } ?? labels.indices.first
    }
    private func value(_ item: TasteDetailChartSeries, at index: Int) -> Double? {
        item.values.indices.contains(index) ? TasteDetailChartScale.value(item.values[index]) : nil
    }
    private func valueLabel(_ item: TasteDetailChartSeries, at index: Int) -> String {
        guard let value = value(item, at: index) else { return "미확인" }
        if let labels = item.valueLabels, labels.indices.contains(index) { return labels[index] }
        return TasteDetailChartScale.label(value) + unit
    }
    private var ticks: [Double] {
        if fixedMaximum == 100 { return [0, 25, 50, 75, 100] }
        let maximum: Double
        if let fixedMaximum { maximum = fixedMaximum }
        else if style == .stacked {
            maximum = labels.indices.compactMap { index -> Double? in
                let values = series.compactMap { value($0, at: index) }
                return values.count == series.count ? values.reduce(0, +) : nil
            }.max() ?? 0
        } else { maximum = series.flatMap(\.values).compactMap(TasteDetailChartScale.value).max() ?? 0 }
        return TasteDetailChartScale.ticks(maximum: maximum, integer: integerTicks)
    }
    private func plot(_ size: CGSize) -> CGRect {
        CGRect(x: 10, y: 16, width: max(1, size.width - 50), height: max(1, size.height - 24))
    }
    private func x(_ index: Int, in plot: CGRect) -> CGFloat {
        if isLine { return plot.minX + plot.width * (labels.count > 1 ? CGFloat(index) / CGFloat(labels.count - 1) : 0.5) }
        return plot.minX + plot.width * (CGFloat(index) + 0.5) / CGFloat(max(1, labels.count))
    }
    private func select(_ index: Int) { selectedIndex = index; onSelect?(index) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let index = selection {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(labels[index]).font(TBFont.medium(12)).foregroundStyle(TBColor.textSecondary)
                        if series.count == 1, let first = series.first {
                            Text(valueLabel(first, at: index)).font(TBFont.bold(28)).foregroundStyle(TBColor.textPrimary)
                                .monospacedDigit().fixedSize(horizontal: false, vertical: true)
                        } else if style == .line && series.count == 2 {
                            HStack(alignment: .top, spacing: 20) {
                                ForEach(series) { item in
                                    VStack(alignment: .leading, spacing: 6) {
                                        HStack(spacing: 6) {
                                            Circle().fill(item.color).frame(width: 7, height: 7)
                                            Text(item.label).font(TBFont.medium(12)).foregroundStyle(TBColor.textSecondary)
                                        }
                                        Text(valueLabel(item, at: index)).font(TBFont.bold(28)).foregroundStyle(TBColor.textPrimary)
                                            .monospacedDigit().fixedSize(horizontal: false, vertical: true)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }.padding(.top, 6)
                        } else {
                            ForEach(series) { item in
                                HStack(spacing: 6) {
                                    Circle().fill(item.color).frame(width: 7, height: 7)
                                    Text(item.label + "  " + valueLabel(item, at: index))
                                        .font(TBFont.medium(13)).foregroundStyle(TBColor.textPrimary)
                                }
                            }
                        }
                    }
                    Spacer(minLength: 0)
                    Picker("그래프 항목 선택", selection: Binding(get: { index }, set: select)) {
                        ForEach(labels.indices, id: \.self) { Text(labels[$0]).tag($0) }
                    }.pickerStyle(.menu).labelsHidden().tint(TBColor.textSecondary)
                        .frame(minWidth: 44, minHeight: 44).accessibilityIdentifier("detail-chart-selection")
                }
            }
            GeometryReader { geometry in
                let frame = plot(geometry.size)
                Canvas { context, _ in draw(in: &context, plot: frame) }
                    .overlay { if style == .line { lineNodes(in: frame).allowsHitTesting(false) } }
                    .contentShape(Rectangle())
                    .gesture(SpatialTapGesture().onEnded { event in
                        guard !labels.isEmpty else { return }
                        let index = labels.indices.min { abs(x($0, in: frame) - event.location.x) < abs(x($1, in: frame) - event.location.x) }!
                        select(index)
                    })
            }.frame(height: height)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(unit.isEmpty ? "상세 그래프" : "\(unit) 기준 그래프")
                .accessibilityValue(selection.map { index in labels[index] + ", " + series.map { $0.label + " " + valueLabel($0, at: index) }.joined(separator: ", ") } ?? "기록 없음")
                .accessibilityAdjustableAction { direction in
                    guard let index = selection else { return }
                    switch direction {
                    case .increment: select(min(labels.count - 1, index + 1))
                    case .decrement: select(max(0, index - 1))
                    @unknown default: break
                    }
                }
            GeometryReader { geometry in
                let frame = plot(CGSize(width: geometry.size.width, height: height))
                let stride = max(1, Int(ceil(Double(labels.count) / 7)))
                ForEach(labels.indices.filter { $0 % stride == 0 || $0 == labels.count - 1 }, id: \.self) { index in
                    Text(axisLabel(labels[index])).font(TBFont.regular(10)).foregroundStyle(TBColor.textSecondary)
                        .multilineTextAlignment(.center).lineLimit(3)
                        .frame(width: max(30, min(80, frame.width / CGFloat(min(7, max(1, labels.count))) - 4)))
                        .position(x: x(index, in: frame), y: 19)
                }
            }.frame(height: 40).accessibilityHidden(true)
        }
        .onChange(of: series) { _, _ in selectedIndex = nil }
        .onChange(of: labels) { _, _ in selectedIndex = nil }
        .accessibilityIdentifier("taste-detail-cartesian-chart")
    }

    private func axisLabel(_ label: String) -> String {
        let parts = label.split(separator: "-")
        return parts.count == 3 && parts[0].count == 4 ? String(parts[1]) + "." + String(parts[2]) : label
    }

    private func draw(in context: inout GraphicsContext, plot: CGRect) {
        let maximum = ticks.last ?? 1
        func y(_ value: Double) -> CGFloat { plot.maxY - plot.height * CGFloat(min(maximum, value) / maximum) }
        for tick in ticks {
            var path = Path(); path.move(to: CGPoint(x: plot.minX, y: y(tick))); path.addLine(to: CGPoint(x: plot.maxX, y: y(tick)))
            context.stroke(path, with: .color(TBColor.borderSubtle), style: StrokeStyle(lineWidth: tick == 0 ? 1 : 0.5))
            context.draw(Text(TasteDetailChartScale.label(tick)).font(TBFont.medium(10)).foregroundColor(TBColor.textHint),
                         at: CGPoint(x: plot.maxX + 14, y: y(tick)), anchor: .leading)
        }
        if let selected = selection {
            var guide = Path(); guide.move(to: CGPoint(x: x(selected, in: plot), y: plot.minY)); guide.addLine(to: CGPoint(x: x(selected, in: plot), y: plot.maxY))
            context.stroke(guide, with: .color(TBColor.textHint.opacity(0.4)), style: StrokeStyle(lineWidth: 1, dash: [3, 4]))
        }
        if isLine {
            drawLines(in: &context, plot: plot, y: y)
        } else {
            drawBars(in: &context, plot: plot, y: y)
        }
    }

    private func lineNodes(in plot: CGRect) -> some View {
        let maximum = ticks.last ?? 1
        return ZStack {
            ForEach(series) { item in
                ForEach(labels.indices, id: \.self) { index in
                    if let value = value(item, at: index) {
                        let endColor = item.axis?.lineChartEndColor ?? item.color
                        let startColor = item.axis?.lineChartStartColor ?? item.color
                        TasteDetailLineNode(
                            point: CGPoint(x: x(index, in: plot), y: plot.maxY - plot.height * CGFloat(min(maximum, value) / maximum)),
                            plot: plot, lineStart: startColor, nodeStart: colorScheme == .dark ? endColor : startColor,
                            endColor: endColor, emphasis: selection == index ? 1 : 0)
                            .animation(reduceMotion ? nil : .timingCurve(0.2, 0.8, 0.2, 1, duration: 0.22), value: selection)
                    }
                }
            }
        }
    }

    /// Preserve the mini's shared R path; invert its virtual corners to align measured dots.
    private func drawLines(in context: inout GraphicsContext, plot: CGRect, y: (Double) -> CGFloat) {
        let ordered = style == .layeredArea ? series.sorted { TasteDetailChartScale.area($0.values) > TasteDetailChartScale.area($1.values) } : series
        for item in ordered {
            var runs: [[CGPoint]] = [], run: [CGPoint] = []
            for index in labels.indices {
                if let value = value(item, at: index) { run.append(.init(x: x(index, in: plot), y: y(value))) }
                else if !run.isEmpty { runs.append(run); run = [] }
            }
            if !run.isEmpty { runs.append(run) }
            let shading = GraphicsContext.Shading.linearGradient(
                Gradient(colors: [item.axis?.lineChartStartColor ?? item.color, item.axis?.lineChartEndColor ?? item.color]),
                startPoint: CGPoint(x: plot.minX, y: 0), endPoint: CGPoint(x: plot.maxX, y: 0))
            for points in runs {
                if style == .line {
                    let layout = TasteDetailLineAlignment.layout(points, radius: TasteLineChartMetrics.cornerRadius)
                    let path = TasteLineRounding.path(layout.controls, radius: layout.radius)
                    if points.count > 1 {
                        context.stroke(path, with: .color(item.axis?.lineChartTrackColor ?? TBColor.chartComparisonTrack),
                                       style: StrokeStyle(lineWidth: TasteLineChartMetrics.trackLineWidth, lineCap: .round, lineJoin: .round))
                        context.stroke(path, with: shading,
                                       style: StrokeStyle(lineWidth: TasteLineChartMetrics.coreLineWidth, lineCap: .round, lineJoin: .round))
                    }
                } else if let first = points.first, let last = points.last, points.count > 1 {
                    let vertices = points + [CGPoint(x: last.x, y: plot.maxY), CGPoint(x: first.x, y: plot.maxY)]
                    context.fill(TBMiniAreaChart.roundedPolygon(vertices, radius: 6), with: .color(item.fillColor ?? item.color))
                }
            }
        }
    }

    private func drawBars(in context: inout GraphicsContext, plot: CGRect, y: (Double) -> CGFloat) {
        let slot = plot.width / CGFloat(max(1, labels.count))
        let width = min(TBMiniChartMetrics.maximumBarWidth, max(3, slot * (style == .grouped ? 0.25 : 0.42)))
        for index in labels.indices {
            if style == .stacked {
                guard series.allSatisfy({ value($0, at: index) != nil }) else { continue }
                var cumulative = 0.0
                var layers: [(Double, Color)] = []
                for item in series {
                    guard let amount = value(item, at: index), amount > 0 else { continue }
                    cumulative += amount
                    layers.append((cumulative, item.color))
                }
                // Match the mini stack: larger baseline capsules behind the smaller ones.
                for (amount, color) in layers.reversed() {
                    let h = max(0, plot.maxY - y(amount))
                    let rect = CGRect(x: x(index, in: plot) - width / 2, y: y(amount), width: width, height: h)
                    context.fill(Path(roundedRect: rect, cornerRadius: min(width, h) / 2), with: .color(color))
                }
                if cumulative == 0 { drawZero(in: &context, x: x(index, in: plot), baseline: plot.maxY, width: width, color: TBColor.border) }
                continue
            }
            for (seriesIndex, item) in series.enumerated() {
                guard let amount = value(item, at: index) else { continue }
                let center = x(index, in: plot) + (style == .grouped ? (CGFloat(seriesIndex) - CGFloat(series.count - 1) / 2) * (width + TBMiniChartMetrics.intraGroupGap) : 0)
                let comparison = item.isComparison || item.comparisonIndices.contains(index)
                let track = comparison ? TBColor.chartComparisonTrack : item.axis?.chartTrackColor ?? TBColor.chartComparisonTrack
                if amount == 0 {
                    drawZero(in: &context, x: center, baseline: plot.maxY, width: width, color: track)
                    continue
                }
                let h = max(0, plot.maxY - y(amount)), diameter = min(width, h)
                let rect = CGRect(x: center - width / 2, y: y(amount), width: width, height: h)
                context.fill(Path(roundedRect: rect, cornerRadius: diameter / 2), with: .color(track))
                let lastKnown = labels.indices.last { value(item, at: $0) != nil }
                if item.highlightsEachValue || index == lastKnown {
                    let endpoint = comparison ? TBColor.textBody : item.axis?.mainColor ?? item.color
                    context.fill(Path(ellipseIn: CGRect(x: center - diameter / 2, y: y(amount), width: diameter, height: diameter)), with: .color(endpoint))
                }
            }
        }
    }

    private func drawZero(in context: inout GraphicsContext, x: CGFloat, baseline: CGFloat, width: CGFloat, color: Color) {
        let height = width * TBMiniChartMetrics.zeroHeightRatio
        context.fill(Path(roundedRect: CGRect(x: x - width / 2, y: baseline - height / 2, width: width, height: height), cornerRadius: height / 2), with: .color(color))

    }
}

struct TasteDetailCompositionItem: Identifiable, Equatable {
    let id: String
    let label: String
    let value: Double?
    let color: Color
    var iconName: String? = nil
    var axis: TasteAxis? = nil
}

struct TasteDetailCompositionChart: View {
    enum Style { case bubbles, donut, ranking }
    let items: [TasteDetailCompositionItem]
    var style: Style = .donut
    var unit = "개"
    var centerValue: String? = nil
    var centerLabel = "전체"
    var onSelect: ((String) -> Void)? = nil
    @State private var selectedID: String?
    private var valid: Bool { items.allSatisfy { TasteDetailChartScale.value($0.value) != nil } }
    private var total: Double { valid ? items.compactMap(\.value).reduce(0, +) : 0 }
    private func label(_ item: TasteDetailCompositionItem) -> String {
        TasteDetailChartScale.value(item.value).map { TasteDetailChartScale.label($0) + unit } ?? "미확인"
    }
    private func select(_ id: String) { selectedID = id; onSelect?(id) }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if style == .ranking { ranking }
            else if style == .bubbles { bubbles }
            else { donut }
            if style != .ranking {
                ForEach(items) { item in
                    Button { select(item.id) } label: {
                        HStack(spacing: 8) {
                            Circle().fill(item.color).frame(width: 8, height: 8)
                            Text(item.label).font(TBFont.regular(13))
                            Spacer(minLength: 8)
                            Text(label(item)).font(TBFont.semibold(15)).monospacedDigit()
                        }.foregroundStyle(TBColor.textPrimary).padding(.vertical, 8)
                            .frame(minHeight: 44).contentShape(Rectangle())
                    }.buttonStyle(.plain).accessibilityAddTraits(selectedID == item.id ? .isSelected : [])
                }
            }
        }
        .onChange(of: items) { _, _ in selectedID = nil }
        .accessibilityIdentifier("taste-detail-composition-chart")
    }

    private var bubbles: some View {
        GeometryReader { geometry in
            let positive = items.filter { (TasteDetailChartScale.value($0.value) ?? 0) > 0 }
            let maximum = positive.compactMap(\.value).max() ?? 1
            let gap: CGFloat = 12
            let diameters: [CGFloat] = positive.map { CGFloat(176 * sqrt(($0.value ?? 0) / maximum)) }
            let gaps = gap * CGFloat(max(0, positive.count - 1))
            let scale = min(1, max(0, geometry.size.width - gaps) / max(1, diameters.reduce(0, +)))
            HStack(spacing: gap) {
                ForEach(Array(positive.enumerated()), id: \.element.id) { index, item in
                    let diameter = diameters[index] * scale
                    Button { select(item.id) } label: {
                        ZStack {
                            Circle().fill(item.color).frame(width: diameter, height: diameter)
                            if selectedID == item.id { Circle().stroke(TBColor.textPrimary, lineWidth: 1).frame(width: diameter + 8, height: diameter + 8) }
                            if let name = item.iconName, diameter >= 28 {
                                Image(name).renderingMode(.template).resizable().scaledToFit().frame(width: min(32, diameter * 0.4), height: min(32, diameter * 0.4)).foregroundStyle(TBColor.chartOnBrightFill)
                            } else if diameter >= 26 {
                                Text(TasteDetailChartScale.label(item.value ?? 0)).font(TBFont.bold(min(28, diameter * 0.3))).foregroundStyle(TBColor.chartOnBrightFill)
                            }
                        }.frame(width: diameter, height: 200).contentShape(Rectangle())
                    }.buttonStyle(.plain).accessibilityLabel(item.label + ", " + label(item))
                }
            }.frame(width: geometry.size.width, height: 200)
            if positive.isEmpty {
                Text(valid ? "기록 없음" : "확인 필요").font(TBFont.regular(13)).foregroundStyle(TBColor.textHint)
                    .frame(width: geometry.size.width, height: 200)
            }
        }.frame(height: 200)
    }

    /// The existing mini pie is a solid rounded-sector symbol, not a hollow ring.
    private var donut: some View {
        VStack(alignment: .leading, spacing: 12) {
            let selected = items.first { $0.id == selectedID }
            VStack(alignment: .leading, spacing: 5) {
                Text(selected.map(label) ?? (total > 0 ? centerValue ?? TasteDetailChartScale.label(total) + unit : "—"))
                    .font(TBFont.bold(30)).foregroundStyle(TBColor.textPrimary).monospacedDigit()
                Text(selected?.label ?? (!valid ? "확인 필요" : total > 0 ? centerLabel : "계산할 기록 없음"))
                    .font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
            }
            Canvas { context, size in
                let side = min(208, min(size.width, size.height))
                let scale = side / TBMiniChartMetrics.height
                let origin = CGPoint(x: (size.width - side) / 2, y: (size.height - side) / 2)
                guard total > 0 else {
                    context.stroke(Path(ellipseIn: CGRect(x: origin.x, y: origin.y, width: side, height: side)), with: .color(TBColor.border), lineWidth: 1)
                    return
                }
                let separated = items.filter { ($0.value ?? 0) > 0 }.count > 1
                var angle = 0.0
                for item in items {
                    let value = item.value ?? 0
                    guard value > 0 else { continue }
                    let end = angle + value / total * 2 * .pi
                    let path = TBMiniPieChart.sector(start: angle, end: end, separated: separated)
                        .applying(CGAffineTransform(scaleX: scale, y: scale))
                        .applying(CGAffineTransform(translationX: origin.x, y: origin.y))
                    context.fill(path, with: .color(item.color))
                    if selectedID == item.id { context.stroke(path, with: .color(TBColor.textPrimary), lineWidth: 1) }
                    angle = end
                }
            }.frame(height: 232).accessibilityElement(children: .ignore)
                .accessibilityLabel(items.map { $0.label + " " + label($0) }.joined(separator: ", "))
        }
    }

    private var ranking: some View {
        let maximum = max(1, items.compactMap { TasteDetailChartScale.value($0.value) }.max() ?? 1)
        return VStack(alignment: .leading, spacing: 20) {
            ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                Button { select(item.id) } label: {
                    VStack(alignment: .leading, spacing: 9) {
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text(String(index + 1)).font(TBFont.medium(12)).foregroundStyle(TBColor.textHint)
                            Text(item.label).font(TBFont.medium(13)).foregroundStyle(TBColor.textPrimary).fixedSize(horizontal: false, vertical: true)
                            Spacer(minLength: 4)
                            Text(label(item)).font(TBFont.bold(17)).foregroundStyle(TBColor.textPrimary).fixedSize()
                        }
                        GeometryReader { geometry in
                            let fraction = (TasteDetailChartScale.value(item.value) ?? 0) / maximum
                            Capsule().fill(TBColor.borderSubtle).frame(height: 1).frame(maxHeight: .infinity)
                            if fraction > 0 {
                                let width = geometry.size.width * fraction
                                let diameter = min(12, width)
                                ZStack(alignment: .trailing) {
                                    Capsule().fill(item.axis?.chartTrackColor ?? TBColor.chartComparisonTrack)
                                    Circle().fill(item.axis?.mainColor ?? item.color).frame(width: diameter, height: diameter)
                                }.frame(width: width, height: 12)
                                if selectedID == item.id {
                                    Circle().stroke(TBColor.textPrimary, lineWidth: 1).frame(width: 18, height: 18)
                                        .position(x: width - diameter / 2, y: 6)
                                }
                            }
                        }.frame(height: 12)
                    }.padding(.vertical, 4).contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityLabel(item.label + ", " + label(item))
                    .accessibilityAddTraits(selectedID == item.id ? .isSelected : [])
            }
            HStack { Text("0"); Spacer(); Text(TasteDetailChartScale.label(maximum) + unit) }
                .font(TBFont.regular(10)).foregroundStyle(TBColor.textHint).accessibilityHidden(true)
        }.padding(.vertical, 12)
    }
}

struct TasteDetailCalendarChart: View {
    let days: [TBRecordChartData.Day]
    let startDay: Int
    var axis: TasteAxis = .umami
    @Environment(\.colorScheme) private var scheme
    @State private var selectedID: String?
    private var selection: TBRecordChartData.Day? { days.first { $0.id == selectedID } ?? days.last { $0.count != nil } }
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let day = selection {
                VStack(alignment: .leading, spacing: 5) {
                    Text(day.id).font(TBFont.medium(12)).foregroundStyle(TBColor.textSecondary)
                    Text(day.count.map { "\($0)개" } ?? "미래 날짜").font(TBFont.bold(28)).foregroundStyle(TBColor.textPrimary)
                }
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 5), count: 7), spacing: 5) {
                ForEach(Array(["월", "화", "수", "목", "금", "토", "일"].enumerated()), id: \.offset) { _, weekday in
                    Text(weekday).font(TBFont.regular(11)).foregroundStyle(TBColor.textHint).frame(height: 24)
                }
                ForEach(0..<max(0, min(6, startDay)), id: \.self) { _ in
                    RoundedRectangle(cornerRadius: 8).fill(TBColor.heatmapNeutral).frame(height: 44).accessibilityHidden(true)
                }
                ForEach(days) { day in
                    Button { selectedID = day.id } label: {
                        VStack(spacing: 2) {
                            Text(String(day.id.suffix(2))).font(TBFont.medium(10))
                            Text(day.count.map(String.init) ?? "—").font(TBFont.semibold(12))
                        }.frame(maxWidth: .infinity, minHeight: 44)
                            .foregroundStyle(day.count == nil ? TBColor.textPrimary
                                : scheme == .dark && (day.count ?? 0) < 3 ? TBColor.textPrimary : TBColor.chartOnBrightFill)
                            .background(day.count.map { axis.heatmapColor(level: min(4, max(0, $0)), in: TBColorMode(scheme)) } ?? TBColor.heatmapNeutral,
                                        in: RoundedRectangle(cornerRadius: 8))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(selection?.id == day.id ? axis.mainColor : .clear, lineWidth: 2))
                    }.buttonStyle(.plain)
                        .accessibilityLabel(day.id + ", " + (day.count.map { "요리 기록 \($0)개" } ?? "미래 날짜"))
                        .accessibilityAddTraits(selection?.id == day.id ? .isSelected : [])
                }
            }
        }
        .onChange(of: days.map { $0.id + ":" + ($0.count.map(String.init) ?? "unknown") }) { _, _ in selectedID = nil }
        .accessibilityIdentifier("taste-detail-calendar-chart")
    }
}
