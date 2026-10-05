import SwiftUI

struct HomeArchiveChartView: View {
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
            } else if chart.hasData && !compact && chart.segments.count > 12 {
                ScrollView(.horizontal) {
                    bars.frame(width: CGFloat(chart.segments.count) * 44)
                }
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
        GeometryReader { geometry in
            HStack(spacing: 0) {
                ForEach(chart.segments) { segment in
                    TasteChartTrackMark(axis: axis)
                        .opacity(segment.id == "once" ? 0.42 : 1)
                        .frame(width: geometry.size.width * HomeArchiveChart.heightFraction(segment.count, maximum: chart.total))
                        .onTapGesture { onSelect?(segment.id) }
                }
            }
        }
        .frame(height: TasteLineChartMetrics.trackLineWidth)
        .tasteBloomChartReveal()
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
        HomeArchiveVisualizationEngine.sections(entries: periodEntries, snapshot: appModel.sensoryAnalysis,
                                                referenceDate: referenceDate, calendar: .current)
            .flatMap(\.cards).first { $0.id == metricID }
    }

    var body: some View {
        TasteDetailPage(title: metric?.label ?? "기록") {
            TasteDetailPeriodPicker(
                selection: $selectedPeriod,
                axis: metric.map { $0.data.accentAxis ?? $0.data.kind.cardAxis }
            )
        } content: {
            if let metric, let chart = metric.data.archiveChart {
                let displayChart = HomeArchiveChart(kind: chart.kind, unit: chart.unit, period: selectedPeriod.title,
                                                    segments: chart.segments, supplements: chart.supplements)
                VStack(alignment: .leading, spacing: TBSpacing.x20) {
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
                    if !displayChart.segments.isEmpty || !displayChart.supplements.isEmpty {
                        TasteDetailGroup {
                            ForEach(Array((displayChart.segments + displayChart.supplements).enumerated()), id: \.element.id) { index, segment in
                                TasteDetailValueRow(title: segment.label, value: "\(segment.count)\(displayChart.unit)",
                                                    showsDivider: index > 0)
                                    .accessibilityIdentifier("archive-segment-\(segment.id)")
                            }
                        }.padding(.horizontal, TBSpacing.page)
                    }
                }.padding(.bottom, TBSpacing.page)
            } else if appModel.sensoryAnalysisIsUpdating {
                ProgressView("불러오는 중").frame(maxWidth: .infinity, minHeight: 180)
            } else {
                Text("현재 기록이 없어요").tbTextStyle(.body).padding(TBSpacing.page)
            }
        }

    }

}
