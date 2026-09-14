import SwiftUI

struct HomeArchiveChartView: View {
    let chart: HomeArchiveChart
    let axis: TasteAxis
    var compact = true
    var onSelect: ((String) -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if chart.hasData && chart.kind == .composition {
                composition
            } else if chart.hasData && !compact && chart.segments.count > 12 {
                ScrollView(.horizontal) {
                    bars.frame(width: CGFloat(chart.segments.count) * 44)
                }
            } else if chart.hasData {
                bars
            }
            if !compact && chart.hasData {
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
                        }.frame(height: compact ? 32 : 72)
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
    @Environment(\.dismiss) private var dismiss
    let metricID: String
    @State private var segmentID: String?
    @State private var entryID: UUID?
    private var metric: HomeArchiveMetric? {
        appModel.homeArchivePresentation?.sections.flatMap(\.cards).first { $0.id == metricID }
    }

    private struct RecordGroup: Identifiable {
        let id: String
        let title: String
        let detail: String
        let entries: [DiningEntry]
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if let metric, let chart = metric.data.archiveChart {
                    let selected = (chart.segments + chart.supplements).first { $0.id == segmentID }
                    let ids = selected?.entryIDs ?? metric.entryIDs
                    let entries = appModel.diningEntries.filter { ids.contains($0.id) }
                        .sorted { $0.observedAt > $1.observedAt }
                    LazyVStack(alignment: .leading, spacing: TBSpacing.x16) {
                        Text(detailTitle(metric: metric, selected: selected))
                            .font(TBFont.bold(20))
                            .accessibilityIdentifier("archive-detail-title")
                        Text(metric.data.detail).font(TBFont.regular(13))
                        if appModel.sensoryAnalysisIsUpdating && metricID == "overall" {
                            ProgressView("현재 평가를 갱신하고 있어요")
                        } else {
                            if chart.hasData {
                                HomeArchiveChartView(chart: chart, axis: metric.data.accentAxis ?? metric.data.kind.cardAxis, compact: false) { segmentID = $0 }
                            } else {
                                Text(emptyChartMessage)
                                    .font(TBFont.regular(13)).foregroundStyle(TBColor.textHint)
                            }
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
                        ForEach(recordGroups(entries)) { group in recordGroup(group) }
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

    private var emptyChartMessage: String {
        metricID == "overall" ? "아직 직접 남긴 5단계 평가가 없어요." : "그래프로 표시할 확인된 기록이 아직 없어요."
    }

    private func detailTitle(metric: HomeArchiveMetric, selected: HomeArchiveChart.Segment?) -> String {
        guard let selected else { return metric.data.title }
        switch metricID {
        case "meals": return "\(selected.label) · \(selected.count)번의 식사"
        case "menus":
            return selected.id == "repeated" ? "반복해서 기록한 메뉴 \(selected.count)가지" : "\(selected.label)한 메뉴 \(selected.count)가지"
        case "restaurants":
            return selected.id == "repeated" ? "재방문한 식당 \(selected.count)곳" : "\(selected.label)한 식당 \(selected.count)곳"
        case "overall": return "\(selected.label)로 평가한 음식 기록"
        default: return selected.label
        }
    }

    private func recordGroups(_ entries: [DiningEntry]) -> [RecordGroup] {
        switch metricID {
        case "meals":
            return Dictionary(grouping: entries, by: \.mealID).map { mealID, rows in
                let sorted = rows.sorted { $0.observedAt > $1.observedAt }
                let date = Set(rows.compactMap(\.confirmedMealDate)).count == 1
                    ? rows.compactMap(\.confirmedMealDate).first?.formatted(date: .abbreviated, time: .omitted)
                    : nil
                return .init(id: mealID.uuidString, title: date ?? "식사 시점 미확인",
                             detail: "\(rows.count)개 메뉴 · \(Set(rows.map(HomeArchiveIdentity.restaurant)).count)곳", entries: sorted)
            }.sorted { ($0.entries.first?.observedAt ?? .distantPast) > ($1.entries.first?.observedAt ?? .distantPast) }
        case "menus":
            return Dictionary(grouping: entries, by: HomeArchiveIdentity.menu).map { identity, rows in
                let sorted = rows.sorted { $0.observedAt > $1.observedAt }, first = sorted[0]
                return .init(id: identity, title: first.menu,
                             detail: "\(first.restaurant) · \(Set(rows.map(\.mealID)).count)번의 식사에서 기록", entries: sorted)
            }.sorted { ($0.entries.first?.observedAt ?? .distantPast) > ($1.entries.first?.observedAt ?? .distantPast) }
        case "restaurants":
            return Dictionary(grouping: entries, by: HomeArchiveIdentity.restaurant).map { identity, rows in
                let sorted = rows.sorted { $0.observedAt > $1.observedAt }, first = sorted[0]
                return .init(id: identity, title: first.restaurant,
                             detail: "\(Set(rows.map(\.mealID)).count)번의 식사 · \(Set(rows.map(HomeArchiveIdentity.menu)).count)가지 메뉴", entries: sorted)
            }.sorted { ($0.entries.first?.observedAt ?? .distantPast) > ($1.entries.first?.observedAt ?? .distantPast) }
        default:
            return entries.map { entry in
                .init(id: entry.id.uuidString, title: entry.menu,
                      detail: [entry.overallEvaluation?.responseLabelSnapshot, entry.restaurant, entry.memoryDateDescription]
                        .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "), entries: [entry])
            }
        }
    }

    private func recordGroup(_ group: RecordGroup) -> some View {
        SectionCard {
            VStack(alignment: .leading, spacing: TBSpacing.x8) {
                Text(group.title).font(TBFont.semibold(16))
                Text(group.detail).font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                ForEach(group.entries) { entry in
                    Button { entryID = entry.id } label: {
                        HStack(alignment: .firstTextBaseline, spacing: TBSpacing.x8) {
                            VStack(alignment: .leading, spacing: 3) {
                                if metricID != "menus" && metricID != "overall" {
                                    Text(entry.menu).font(TBFont.medium(13))
                                }
                                Text(entry.memoryDateDescription).font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.caption).foregroundStyle(TBColor.textHint)
                        }
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(entry.menu), \(entry.restaurant), \(entry.memoryDateDescription)")
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
