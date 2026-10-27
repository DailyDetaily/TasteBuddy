import SwiftUI

struct RecordChartsPanel: View {
    let data: TBRecordChartData?
    var loading = false
    var error: String? = nil
    var onRetry: (() -> Void)? = nil
    @State private var mode: Mode = .heatmap
    @Environment(\.colorScheme) private var scheme
    init(data: TBRecordChartData?, loading: Bool = false, error: String? = nil,
         onRetry: (() -> Void)? = nil, initialMode: Mode = .heatmap) {
        self.data = data; self.loading = loading; self.error = error; self.onRetry = onRetry
        _mode = State(initialValue: initialMode)
    }
    enum Mode: String, CaseIterable, Identifiable {
        case heatmap = "달력", bar = "일별 기록", grouped = "이전 7일 비교", line = "최근 4일 흐름", area = "최근 4일 영역"
        case linePair = "두 미각 흐름 비교"
        case areaLayered = "미각 기록 겹침", areaComparison = "같은 미각 기록 비교"
        case stacked = "최근 7일 출처", pie = "이번 달 출처 구성", bubble = "이번 달 출처 규모", bubbleIcon = "이번 달 음식 종류", absolute = "이번 달 출처 확인 비율"
        var id: String { rawValue }
    }
    private func axis(_ id: String) -> TasteAxis { id == "homeCooked" ? .umami : id == "restaurant" ? .sweet : .fat }
    private var sensoryMode: Bool { mode == .areaLayered || mode == .areaComparison || mode == .linePair }
    private func sensoryLayers(_ data: TBRecordChartData) -> [TBMiniAreaChart.Layer] {
        if mode == .areaComparison {
            guard let first = data.sensorySeries.first else { return [] }
            let taste = TasteAxis(rawValue: first.id) ?? .umami
            return [.init(id: "previous", axis: taste, values: first.comparisonValues), .init(id: "current", axis: taste, values: first.values)]
        }
        return (mode == .linePair ? Array(data.sensorySeries.prefix(2)) : data.sensorySeries)
            .map { .init(id: $0.id, axis: TasteAxis(rawValue: $0.id) ?? .umami, values: $0.values) }
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("기록량").font(TBFont.semibold(14)); Spacer()
                Picker("기록 그래프 보기", selection: $mode) {
                    ForEach(Mode.allCases) { item in Text(item.rawValue).tag(item) }
                }.pickerStyle(.menu).tint(TBColor.textSecondary).accessibilityIdentifier("record-chart-mode")
            }
            if loading { ProgressView("기록을 불러오고 있어요") }
            else if let error {
                Text("기록을 모두 확인하지 못했어요. " + error).font(TBFont.regular(12))
                if let onRetry { Button("다시 시도", action: onRetry).frame(minHeight: 44) }
            } else if let data {
                VStack(alignment: .leading, spacing: 4) {
                    Text(period(data)).font(TBFont.medium(13))
                    Text(sensoryMode ? "미각을 기록한 식사 수" : "요리 기록 \(visibleTotal(data))개")
                        .font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                }
                chart(data)
                legend(data)
                Text("확인된 식사일 기준 · 식사 한 번에 요리 기록이 여러 개일 수 있어요."
                     + (data.unknownDateCount > 0 ? " 식사일 미확인 \(data.unknownDateCount)개 제외." : "")
                     + (data.futureCount > 0 ? " 미래 식사일 \(data.futureCount)개 제외." : ""))
                    .font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
                if mode == .heatmap { Text("회색은 아직 오지 않은 날짜와 달 바깥 칸이에요. 0개는 확인된 날짜의 기록 없음이에요.").font(TBFont.regular(11)).foregroundStyle(TBColor.textHint) }
            } else { Text("기록을 불러오고 있어요").font(TBFont.regular(12)) }
        }
        .padding(16).background(TBColor.surface, in: RoundedRectangle(cornerRadius: 20))
        .accessibilityIdentifier("record-charts-panel")
    }
    private func visibleTotal(_ data: TBRecordChartData) -> Int {
        switch mode {
        case .grouped, .stacked: data.current.reduce(0, +)
        case .line, .area: Int(data.lineValues.reduce(0, +))
        default: data.total
        }
    }
    private func period(_ data: TBRecordChartData) -> String {
        switch mode {
        case .grouped, .stacked: "최근 7일 · 오늘 포함"
        case .line, .area: "최근 4일 · 오늘 포함"
        case .areaLayered, .linePair: "최근 4일 · 미각별 식사 기록"
        case .areaComparison: "최근 4일 · 직전 4일 비교"
        default: data.monthLabel
        }
    }
    private func chartSummary(_ data: TBRecordChartData) -> String {
        switch mode {
        case .heatmap, .bar: data.monthLabel + " 일별 요리 기록 " + data.month.map { $0.count.map(String.init) ?? "미래 날짜" }.joined(separator: ", ")
        case .grouped: "최근 7일 \(data.current.map(String.init).joined(separator: ", ")), 직전 7일 \(data.previous.map(String.init).joined(separator: ", "))"
        case .line, .area: "최근 4일 요리 기록 \(data.lineValues.map { String(Int($0)) }.joined(separator: ", "))"
        case .areaLayered, .areaComparison, .linePair: sensoryLayers(data).map { "\($0.axis.label) \(mode == .areaComparison && $0.id == "previous" ? "직전 4일" : "최근 4일") 미각을 기록한 식사 \($0.values.map { $0.map { String(Int($0)) + "회" } ?? "미확인" }.joined(separator: ", "))" }.joined(separator: ". ")
        case .stacked: data.series.map { "\($0.label) \($0.values.reduce(0, +))개" }.joined(separator: ", ")
        case .bubbleIcon: data.foodKinds.map { "\($0.label) \($0.value)개" }.joined(separator: ", ")
        case .pie, .absolute, .bubble: data.series.map { "\($0.label) \($0.value)개" }.joined(separator: ", ")
        }
    }
    private func detailLayers(_ data: TBRecordChartData) -> [TasteDetailChartSeries] {
        let layers = sensoryLayers(data)
        let modeColor = TBColorMode(scheme)
        let largest = layers.indices.max { TasteDetailChartScale.area(layers[$0].values) < TasteDetailChartScale.area(layers[$1].values) }
        return layers.enumerated().map { index, layer in
            let tint = mode == .areaComparison && index == largest ? 80 : 20
            return .init(id: layer.id,
                         label: layer.axis.label + (mode == .areaComparison ? (layer.id == "previous" ? " 직전 4일" : " 최근 4일") : ""),
                         values: layer.values, color: layer.axis.mainColor,
                         fillColor: TBMiniChartColor.areaColor(layer.axis, tint: tint, mode: modeColor), axis: layer.axis)
        }
    }
    private func sourceItems(_ data: TBRecordChartData, absolute: Bool = false) -> [TasteDetailCompositionItem] {
        data.series.map { item in
            .init(id: item.id, label: item.label, value: Double(item.value),
                  color: absolute && item.id == "unknown" ? TBColorMode(scheme).chartRemainder
                    : TBMiniChartColor.color(axis(item.id), tint: 40, mode: TBColorMode(scheme)))
        }
    }
    @ViewBuilder private func chart(_ data: TBRecordChartData) -> some View {
        switch mode {
        case .heatmap:
            TasteDetailCalendarChart(days: data.month, startDay: data.startDay)
        case .bar:
            TasteDetailCartesianChart(labels: data.month.map(\.id),
                series: [.init(id: "records", label: "요리 기록", values: data.month.map { $0.count.map(Double.init) }, color: TasteAxis.umami.mainColor, axis: .umami)])
        case .grouped:
            TasteDetailCartesianChart(labels: data.currentDays,
                series: [.init(id: "previous", label: "직전 7일", values: data.previous.map { Double($0) }, color: TBColor.chartComparisonTrack, axis: .umami, isComparison: true),
                         .init(id: "current", label: "최근 7일", values: data.current.map { Double($0) }, color: TasteAxis.umami.mainColor, axis: .umami)], style: .grouped)
        case .line, .area:
            TasteDetailCartesianChart(labels: Array(data.currentDays.suffix(4)),
                series: [.init(id: "records", label: "요리 기록", values: data.lineValues.map { $0 }, color: TasteAxis.umami.mainColor,
                               fillColor: TBMiniChartColor.color(.umami, tint: 60, mode: TBColorMode(scheme)), axis: .umami)],
                style: mode == .line ? .line : .area)
        case .linePair:
            if data.sensorySeries.isEmpty {
                Text("확인된 미각 기록이 없어요").font(TBFont.regular(12)).frame(maxWidth: .infinity, minHeight: 232)
            } else {
                TasteDetailCartesianChart(labels: data.areaDays, series: detailLayers(data), style: .line, unit: "회")
                if data.sensorySeries.count < 2 {
                    Text("현재 확인된 미각은 한 가지예요. 두 번째 미각 기록이 모이면 함께 비교할 수 있어요.")
                        .font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
                }
            }
        case .stacked:
            TasteDetailCartesianChart(labels: data.currentDays,
                series: data.series.map { .init(id: $0.id, label: $0.label, values: $0.values.map { Double($0) },
                                                color: axis($0.id).miniChartTint20Color(in: TBColorMode(scheme)), axis: axis($0.id)) }, style: .stacked)
        case .areaLayered, .areaComparison:
            if data.sensorySeries.isEmpty { Text("확인된 미각 기록이 없어요").font(TBFont.regular(12)).frame(maxWidth: .infinity, minHeight: 232) }
            else { TasteDetailCartesianChart(labels: data.areaDays, series: detailLayers(data), style: .layeredArea, unit: "회") }
        case .bubbleIcon:
            if !data.foodKinds.isEmpty {
                TasteDetailCompositionChart(items: data.foodKinds.map { .init(id: $0.id, label: $0.label, value: Double($0.value),
                    color: TBMiniChartColor.color(.umami, tint: 40, mode: TBColorMode(scheme)), iconName: "DishKind-" + $0.id) }, style: .bubbles)
            } else { Text("등록된 음식 종류가 없어요").font(TBFont.regular(12)).frame(maxWidth: .infinity, minHeight: 200) }
        case .bubble:
            TasteDetailCompositionChart(items: sourceItems(data), style: .bubbles)
        case .pie:
            TasteDetailCompositionChart(items: sourceItems(data), centerLabel: "이번 달 요리 기록")
        case .absolute:
            TasteDetailCompositionChart(items: sourceItems(data, absolute: true),
                centerValue: data.total > 0 ? String(format: "%.0f%%", data.absoluteValues.reduce(0, +)) : nil,
                centerLabel: "출처 확인 비율")
        }
    }
    @ViewBuilder private func legend(_ data: TBRecordChartData) -> some View {
        if mode == .heatmap {
            HStack(spacing: 8) {
                ForEach(0..<5) { level in
                    HStack(spacing: 3) {
                        RoundedRectangle(cornerRadius: 1).fill(TasteAxis.umami.heatmapColor(level: level, in: TBColorMode(scheme))).frame(width: 8, height: 8)
                        Text(level == 4 ? "4개 이상" : "\(level)개")
                    }
                }
            }.font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
        } else if sensoryMode {
            let layers = sensoryLayers(data)
            let detailSeries = detailLayers(data)
            VStack(alignment: .leading, spacing: 4) {
                ForEach(Array(layers.enumerated()), id: \.element.id) { index, layer in
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 1).fill(mode == .linePair ? detailSeries[index].color : detailSeries[index].fillColor ?? detailSeries[index].color).frame(width: 8, height: 8)
                        Text("\(layer.axis.label)\(mode == .areaComparison ? (layer.id == "current" ? " 최근" : " 직전") : "") \(Int(layer.values.compactMap { $0 }.reduce(0, +)))회")
                    }
                }
                Text("최근 8일 기록 상위 \(mode == .linePair ? "2개 " : "")미각 · 같은 식사의 같은 미각은 한 번만 포함해요. 강도·호감 점수가 아닌 기록 횟수예요. 유효한 감각 기록이 없는 식사 \(data.sensoryUnobservedMeals)회.")
                Text("\(data.areaDays.first ?? "")–\(data.areaDays.last ?? "")" + (mode == .areaComparison ? " / 비교 \(data.areaComparisonDays.first ?? "")–\(data.areaComparisonDays.last ?? "")" : "") + ". 미확인 구간은 비워 두며, 겹친 \(mode == .linePair ? "계열" : "영역")을 더하지 않아요.")
            }.font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
        } else if mode == .bubbleIcon {
            VStack(alignment: .leading, spacing: 4) {
                Text(data.foodKinds.map { "\($0.label) \($0.value)개" }.joined(separator: " · "))
                Text("상위 3개 종류 · 여러 종류로 분류한 기록은 각 종류에 한 번씩 포함돼요. 미분류 \(data.unclassifiedFoodCount)개.")
            }.font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
        } else if mode == .grouped { Text("회색: 직전 7일 · 미각색: 최근 7일").font(TBFont.regular(11)).foregroundStyle(TBColor.textHint) }
        else if [.stacked, .pie, .absolute, .bubble].contains(mode) {
            VStack(alignment: .leading, spacing: 4) {
                ForEach(data.series) { item in
                    HStack(spacing: 4) {
                        let color = mode == .stacked ? axis(item.id).miniChartTint20Color(in: TBColorMode(scheme))
                            : mode == .absolute && item.id == "unknown" ? TBColorMode(scheme).chartRemainder
                            : TBMiniChartColor.color(axis(item.id), tint: 40, mode: TBColorMode(scheme))
                        RoundedRectangle(cornerRadius: 1).fill(color).frame(width: 8, height: 8)
                        Text("\(item.label) \(mode == .stacked ? item.values.reduce(0, +) : item.value)개")
                    }
                }
            }.font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
        }
    }
}
