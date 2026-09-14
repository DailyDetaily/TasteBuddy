import SwiftUI

struct HomeArchiveChartView: View {
    let chart: HomeArchiveChart
    let axis: TasteAxis
    var compact = true
    var onSelect: ((String) -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if chart.segments.isEmpty {
                Text("—").font(TBFont.medium(16)).foregroundStyle(TBColor.textHint)
            } else if chart.kind == .composition {
                composition
            } else if !compact && chart.segments.count > 12 {
                ScrollView(.horizontal) {
                    bars.frame(width: CGFloat(chart.segments.count) * 44)
                }
            } else {
                bars
            }
            if !compact {
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
                ForEach(Array(chart.segments.enumerated()), id: \.element.id) { index, segment in
                    Rectangle().fill(compositionColor(index))
                        .frame(width: geometry.size.width * HomeArchiveChart.heightFraction(segment.count, maximum: chart.total))
                        .overlay(alignment: .leading) {
                            if index > 0 && segment.count > 0 && chart.segments.prefix(index).contains(where: { $0.count > 0 }) {
                                Rectangle().fill(TBColor.surface).frame(width: 1)
                            }
                        }
                        .onTapGesture { onSelect?(segment.id) }
                }
            }.clipShape(Capsule())
        }
        .frame(height: TasteLineChartMetrics.trackLineWidth)
        .tasteBloomChartReveal()
    }

    private func compositionColor(_ index: Int) -> Color {
        index == 0 ? axis.tintSoftBorderColor : axis.mainColor
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
                        }.frame(height: compact ? 32 : 72)
                    }.frame(maxWidth: .infinity).contentShape(Rectangle())
                        .onTapGesture { onSelect?(segment.id) }
                }
            }.overlay(alignment: .bottom) { Rectangle().fill(TBColor.borderSubtle).frame(height: 1) }
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
    @Environment(\.dismiss) private var dismiss
    let metricID: String
    @State private var segmentID: String?
    @State private var entryID: UUID?
    private var metric: HomeArchiveMetric? {
        appModel.homeArchivePresentation?.sections.flatMap(\.cards).first { $0.id == metricID }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if let metric, let chart = metric.data.archiveChart {
                    let selected = (chart.segments + chart.supplements).first { $0.id == segmentID }
                    let ids = selected?.entryIDs ?? metric.entryIDs
                    let entries = appModel.diningEntries.filter { ids.contains($0.id) }
                    LazyVStack(alignment: .leading, spacing: TBSpacing.x16) {
                        Text(metric.data.title).font(TBFont.bold(20))
                        Text(metric.data.detail).font(TBFont.regular(13))
                        if appModel.sensoryAnalysisIsUpdating && metricID == "overall" {
                            ProgressView("현재 평가를 갱신하고 있어요")
                        } else {
                            HomeArchiveChartView(chart: chart, axis: metric.data.accentAxis ?? metric.data.kind.cardAxis, compact: false) { segmentID = $0 }
                            ForEach(chart.segments + chart.supplements) { segment in
                                Button { segmentID = segment.id } label: {
                                    HStack {
                                        Text(segment.label)
                                        Spacer()
                                        Text("\(segment.count)\(chart.unit)")
                                        if segmentID == segment.id { Image(systemName: "checkmark") }
                                    }.font(TBFont.regular(13)).frame(minHeight: 44).contentShape(Rectangle())
                                }.buttonStyle(.plain).accessibilityIdentifier("archive-segment-\(segment.id)")
                            }
                        }
                        HStack {
                            Text(selected.map { "필터: \($0.label)" } ?? "필터: 전체 기간의 관련 기록")
                            Spacer()
                            if segmentID != nil { Button("필터 해제") { segmentID = nil } }
                        }.font(TBFont.medium(12))
                        Text("디시 기록 \(entries.count)개 · 독립 식사 \(Set(entries.map(\.mealID)).count)회")
                            .font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                        ForEach(entries) { entry in
                            Button { entryID = entry.id } label: {
                                SectionCard {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(entry.menu).font(TBFont.semibold(16))
                                        Text(entry.restaurant).font(TBFont.medium(12))
                                        Text(entry.memoryDateDescription).font(TBFont.regular(12))
                                        if !entry.note.isEmpty { Text(entry.note).font(TBFont.regular(13)).lineLimit(4) }
                                        if let response = entry.overallEvaluation { Text(response.responseLabelSnapshot).font(TBFont.medium(12)) }
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }.buttonStyle(.plain)
                        }
                        if entries.isEmpty { Text("이 범주에 해당하는 현재 기록이 없어요.").font(TBFont.regular(13)) }
                    }.padding(TBSpacing.page)
                } else if appModel.sensoryAnalysisIsUpdating { ProgressView("현재 기록을 갱신하고 있어요").padding() }
            }.background(TBColor.page)
                .navigationTitle(metric?.label ?? "관련 기록").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } } }
        }
        .sheet(isPresented: Binding(get: { entryID != nil }, set: { if !$0 { entryID = nil } })) {
            if let entryID { FoodMemoryDetailView(entryID: entryID) }
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }
}
