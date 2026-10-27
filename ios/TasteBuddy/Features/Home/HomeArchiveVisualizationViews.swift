import SwiftUI

struct HomeArchiveChartView: View {
    @Environment(\.colorScheme) private var colorScheme
    let chart: HomeArchiveChart
    let axis: TasteAxis
    var compact = true
    var plotHeight: CGFloat = 180
    var showsPeriod = true
    var onSelect: ((String) -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if chart.hasData && chart.kind == .composition && compact {
                composition
            } else if chart.hasData && compact {
                TBMiniChart(values: chart.segments.map { Double($0.count) }, axis: axis,
                            onSelect: onSelect.map { select in { index in select(chart.segments[index].id) } },
                            highlightsEachValue: chart.kind == .distribution)
            } else if chart.hasData && !compact && chart.kind == .composition {
                TasteDetailCompositionChart(items: chart.segments.map { segment in
                    let taste: TasteAxis = segment.id == "once" ? .umami : .sweet
                    return .init(id: segment.id, label: segment.label, value: Double(segment.count),
                                 color: TBMiniChartColor.color(taste, tint: 40, mode: TBColorMode(colorScheme)), axis: taste)
                }, style: .bubbles, unit: chart.unit, onSelect: onSelect)
            } else if chart.hasData && !compact {
                TasteDetailCartesianChart(
                    labels: chart.segments.map(\.label),
                    series: [.init(id: "archive", label: "", values: chart.segments.map { Double($0.count) }, color: axis.mainColor,
                                   axis: axis, highlightsEachValue: chart.kind == .distribution)],
                    unit: chart.unit, height: max(232, plotHeight),
                    onSelect: onSelect.map { select in { index in select(chart.segments[index].id) } }
                )
            } else if chart.hasData {
                bars
            }
            if !compact && chart.hasData && showsPeriod {
                Text(chart.period).font(TBFont.regular(10)).foregroundStyle(TBColor.textHint)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(chart.summary)
    }

    private var composition: some View {
        TBMiniBubbleChart(items: chart.segments.map {
            .init(value: Double($0.count), axis: $0.id == "once" ? .umami : .sweet)
        })
    }

    private var bars: some View {
        let maximum = chart.segments.map(\.count).max() ?? 0
        return VStack(spacing: 4) {
            // 모든 열의 0 기준을 같은 높이에 둔다. 긴 범주 문구는 축 아래에 분리한다.
            HStack(alignment: .bottom, spacing: compact ? 3 : 8) {
                ForEach(chart.segments) { segment in
                    VStack(spacing: 4) {
                        if !compact { Text("\(segment.count)").font(TBFont.medium(11)).fixedSize() }
                        GeometryReader { geometry in
                            TasteChartBarMark(
                                axis: axis,
                                showsEndpoint: chart.kind == .distribution || segment.id == chart.segments.last?.id
                            )
                            .frame(
                                width: min(geometry.size.width, compact ? TasteLineChartMetrics.trackLineWidth : TasteRadarContract.nodeRadius * 2),
                                height: geometry.size.height * HomeArchiveChart.heightFraction(segment.count, maximum: maximum)
                            )
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                        }.frame(height: compact ? 32 : plotHeight)
                    }.frame(maxWidth: .infinity).contentShape(Rectangle())
                        .onTapGesture { onSelect?(segment.id) }
                }
            }
            .tasteBloomChartReveal(from: .bottom)
            if !compact {
                HStack(alignment: .top, spacing: 8) {
                    ForEach(chart.segments) { segment in
                        Text(segment.label).font(TBFont.regular(10))
                            .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity)
                    }
                }
            }
        }
    }

}

/// 현재 원본 revision의 캐시에서 범주를 읽는다. 선택한 범주의 원문 수정/삭제가 즉시 반영된다.
struct HomeArchiveMetricDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    let metricID: String
    @State private var selectedPeriod: TasteDetailPeriod = .all

    private var referenceDate: Date {
        appModel.homeArchivePresentation?.gastronomyState.now ?? .now
    }
    private var periodEntries: [DiningEntry] {
        let source = appModel.homeArchivePresentation?.sourceEntries ?? appModel.diningEntries
        return HomeArchiveIdentity.entries(source, asOf: referenceDate).filter { entry in
            if selectedPeriod == .all { return true }
            guard let mealDate = entry.confirmedMealDate else { return false }
            return selectedPeriod.contains(mealDate, referenceDate: referenceDate, calendar: .current)
        }
    }
    private var metric: HomeArchiveMetric? {
        guard let archive = appModel.homeArchivePresentation else { return nil }
        // Filter after validation so an unknown sibling cannot become a confirmed meal
        // merely because the period picker removed that sibling from the raw array.
        let records = archive.gastronomyState.records.filter { record in
            selectedPeriod == .all || record.date.map {
                selectedPeriod.contains($0, referenceDate: referenceDate, calendar: .current)
            } == true
        }
        let state = TDDataEngine.prepare(records: records, observations: archive.gastronomyState.observations,
                                         window: .all, now: referenceDate, calendar: .current,
                                         issues: archive.gastronomyState.issues)
        let sources = HomeArchiveSources(validated: archive.gastronomyInput, state: state)
        return HomeArchiveVisualizationEngine.sections(sources: sources, referenceDate: referenceDate)
            .flatMap(\.cards).first { $0.id == metricID }
    }

    var body: some View {
        if let kind = HomeArchiveMenuMetricKind(rawValue: metricID) {
            HomeArchiveMenuMetricDetailView(kind: kind)
        } else {
            legacyDetail
        }
    }

    private var legacyDetail: some View {
        TasteDetailPage(title: metric?.label ?? "기록") {
            TasteDetailPeriodPicker(
                selection: $selectedPeriod,
                axis: metric.map { $0.data.accentAxis ?? $0.data.kind.cardAxis }
            )
        } content: {
            let currentMetric = metric
            let chart = currentMetric?.data.archiveChart
            VStack(alignment: .leading, spacing: TBSpacing.x20) {
                if appModel.sensoryAnalysisIsUpdating || appModel.backendSessionStatus == .restoring {
                    ProgressView("현재 계정의 기록을 불러오고 있어요").frame(maxWidth: .infinity, minHeight: 232)
                } else if let error = appModel.sensoryAnalysisError {
                    VStack(alignment: .leading, spacing: TBSpacing.x12) {
                        SensoryAnalysisStatusCard(state: .failed(error))
                        Button("다시 시도") { Task { await appModel.syncAccountData(); appModel.refreshSensoryAnalysis() } }.frame(minHeight: 44)
                    }.padding(.horizontal, TBSpacing.page)
                } else if let metric = currentMetric, let chart {
                    let displayChart = HomeArchiveChart(kind: chart.kind, unit: chart.unit, period: selectedPeriod.title,
                                                        segments: chart.segments, supplements: chart.supplements,
                                                        responseScale: chart.responseScale)
                    TasteDetailChartPanel {
                        TasteDetailScope(text: selectedPeriod.title + " · " + displayChart.unit).frame(maxWidth: .infinity)
                        Text(metric.data.title)
                            .font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                            .accessibilityIdentifier("archive-detail-title")
                        if appModel.sensoryAnalysisIsUpdating && metricID == "overall" {
                            ProgressView("불러오는 중").frame(maxWidth: .infinity, minHeight: 180)
                        } else if displayChart.hasData {
                            HomeArchiveChartView(chart: displayChart, axis: metric.data.accentAxis ?? metric.data.kind.cardAxis,
                                                 compact: false, plotHeight: 200, showsPeriod: false)
                        } else {
                            Text("—").font(TBFont.bold(18)).foregroundStyle(TBColor.textHint)
                                .frame(maxWidth: .infinity, minHeight: 180)
                        }
                    }
                } else if appModel.sensoryAnalysisIsUpdating {
                    ProgressView("불러오는 중").frame(maxWidth: .infinity, minHeight: 180)
                } else {
                    Text("현재 기록이 없어요").tbTextStyle(.body).padding(TBSpacing.page)
                }

                VStack(alignment: .leading, spacing: TBSpacing.x20) {
                    AccountDataSyncNotice()
                    if metricID == "meals" {
                        RecordChartsPanel(
                            data: appModel.homeArchivePresentation.map { TBRecordChartData.make(state: $0.gastronomyState) },
                            loading: appModel.sensoryAnalysisIsUpdating || appModel.backendSessionStatus == .restoring,
                            error: appModel.sensoryAnalysisError,
                            onRetry: { Task { await appModel.syncAccountData(); appModel.refreshSensoryAnalysis() } }
                        )
                    }
                    if let chart, !chart.segments.isEmpty || !chart.supplements.isEmpty {
                        TasteDetailGroup {
                            ForEach(Array((chart.segments + chart.supplements).enumerated()), id: \.element.id) { index, segment in
                                TasteDetailValueRow(title: segment.label, value: "\(segment.count)\(chart.unit)",
                                                    showsDivider: index > 0)
                                    .accessibilityIdentifier("archive-segment-\(segment.id)")
                            }
                        }
                    }
                }.padding(.horizontal, TBSpacing.page)
            }.padding(.bottom, TBSpacing.page)
        }

    }

}
