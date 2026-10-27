import SwiftUI

struct HomeJournalEmptyState: View {
    var body: some View {
        EmptyState(
            title: "첫 미식 기록을 기다리고 있어요",
            description: "아래 가운데 기록 버튼으로 오늘의 메뉴와 기억에 남은 미각을 남겨보세요.",
            icon: .squarePen
        )
    }
}

// MARK: - Period insights

/// A compact period summary that keeps the home journal's existing card
/// chrome while making the interpretation (rather than a raw entry) the
/// focus of the card.
struct HomePeriodInsightCard: View {
    let data: HomePeriodInsightCardData
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    var onTap: (() -> Void)? = nil
    var labelOverride: String? = nil
    var detailLineLimit: Int? = 2
    var controls: AnyView? = nil
    var headerActionLabel: String? = "자세히보기"
    var balancedFooter: AnyView? = nil
    var legend: [TBSummaryCardLegendItem]? = nil
    var visualization: AnyView? = nil
    var indicatorColors: [Color]? = nil
    var showsIndicatorIcon = true
    /// Item counts describe available detail scopes, not the measured value.
    var summaryItemCount: String? = nil
    var usesReadableInsightLayout = false
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        TasteInsightSummaryCardLayout(
            indicatorColors: indicatorColors ?? graphIndicatorColors,
            indicatorCategory: showsIndicatorIcon ? data.insightCategory : nil,
            sectionLabel: labelOverride ?? data.kind.label,
            actionLabel: onTap == nil || dynamicTypeSize.isAccessibilitySize || summaryItemCount != nil ? nil : headerActionLabel,
            title: data.title,
            titleContentSpacing: TBSpacing.x4,
            showsTitle: false,
            combinesAccessibilityChildren: controls == nil,
            sectionLabelLineLimit: dynamicTypeSize.isAccessibilitySize || usesReadableInsightLayout ? nil : 1,
            accessibilityLabel: accessibilityLabel,
            accessibilityHint: onTap == nil ? nil : "기간별 미식 기록 자세히 보기",
            onTap: controls == nil ? onTap : nil,
            balancedFooter: balancedFooter,
            legend: legend ?? chartLegend
        ) {
            VStack(alignment: .leading, spacing: TBSpacing.x12) {
                if let controls { controls }
                if controls != nil, let onTap {
                    Button(action: onTap) { insightDetails.frame(minHeight: 44) }
                        .buttonStyle(.plain)
                        .accessibilityLabel(accessibilityLabel)
                        .accessibilityHint("집계 기준과 원본을 엽니다")
                } else { insightDetails }
                if let summaryItemCount {
                    let actionLayout = dynamicTypeSize.isAccessibilitySize
                        ? AnyLayout(VStackLayout(alignment: .leading, spacing: TBSpacing.x8))
                        : AnyLayout(HStackLayout(alignment: .firstTextBaseline, spacing: TBSpacing.x8))
                    actionLayout {
                        Text(summaryItemCount)
                            .font(TBFont.regular(TBTypography.FontSize.x12))
                            .foregroundStyle(TBColor.textHint)
                            .fixedSize(horizontal: false, vertical: true)
                        if !dynamicTypeSize.isAccessibilitySize { Spacer(minLength: TBSpacing.x8) }
                        if onTap != nil, let headerActionLabel {
                            CardDetailLabel(label: headerActionLabel)
                        }
                    }
                }
            }
        }
    }

    private var insightDetails: some View {
        let layout = dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: TBSpacing.x12))
            : usesReadableInsightLayout
                ? AnyLayout(InsightSummaryReadableBodyLayout())
                : AnyLayout(TBSummaryCardBodyLayout())
        return layout {
            VStack(alignment: .leading, spacing: TBSpacing.x4) {
                if !data.title.isEmpty {
                    Text(renderedTitle)
                        .font(TBFont.bold(16))
                        .foregroundStyle(TBColor.textPrimary)
                        .fixedSize(horizontal: false, vertical: usesReadableInsightLayout)
                        .frame(minHeight: 23, alignment: .leading)
                }

                Text(data.detail)
                    .font(TBFont.regular(TBTypography.FontSize.x12))
                    .foregroundStyle(TBColor.textHint)
                    .lineSpacing(4)
                    .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : detailLineLimit)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .topLeading)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .layoutPriority(1)

            if let visualization {
                visualization.frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height)
            } else if let chart = data.archiveChart, chart.hasData {
                HomeArchiveChartView(chart: chart, axis: indicatorAxis)
                    .frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height)
            } else if !data.chartValues.isEmpty {
                TBMiniChart(
                    values: data.chartValues,
                    axis: indicatorAxis
                )
            } else if data.archiveChart != nil {
                Color.clear.frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height)
            }
        }
    }

    /// Keep the measured unit and its value together without changing the data or
    /// accessibility copy. Korean line breaking otherwise permits “31 / 회”.
    private var renderedTitle: String {
        guard usesReadableInsightLayout else { return data.title }
        return data.title.replacingOccurrences(of: #"식사 ([0-9][0-9,]*)회"#,
            with: "식사\u{00A0}$1\u{2060}회", options: .regularExpression)
    }

    private var graphIndicatorColors: [Color] {
        if visualization != nil || !data.chartValues.isEmpty || data.archiveChart?.hasData == true {
            return [indicatorAxis.mainColor]
        }
        return []
    }

    private var indicatorAxis: TasteAxis {
        if let chart = data.archiveChart, chart.kind == .composition,
           let primary = chart.segments.filter({ $0.count > 0 }).max(by: { $0.count < $1.count }) {
            return primary.id == "once" ? .umami : .sweet
        }
        return data.accentAxis ?? data.kind.cardAxis
    }

    /// Labels describe the exact rendered archive chart; no fixture or inferred unit.
    private var chartLegend: [TBSummaryCardLegendItem] {
        guard balancedFooter == nil, data.state == .populated else { return [] }
        if let chart = data.archiveChart, chart.hasData {
            if chart.kind == .composition {
                return chart.segments.map { segment in
                    .init(id: segment.id, label: "\(segment.label) \(segment.count)\(chart.unit)",
                          color: TBMiniChartColor.color(segment.id == "once" ? .umami : .sweet,
                                                        tint: 40, mode: TBColorMode(colorScheme)))
                }
            }
            if chart.kind == .distribution {
                if chart.responseScale == DiningOverallEvaluation.starScale {
                    return [.init(id: "scale", label: "별점 0.5~5점 · 단위 개")]
                        + chart.segments.filter { $0.count > 0 }.map {
                            .init(id: $0.id, label: "\($0.label) \($0.count)개")
                        }
                }
                let unit = usesReadableInsightLayout
                    ? ["번 식사": "회", "개 요리": "개"][chart.unit] ?? chart.unit
                    : chart.unit
                return chart.segments.map { segment in
                    .init(id: segment.id, label: "\(segment.label) \(segment.count)\(unit)")
                }
            }
            let label = "기간별 기록"
            return [.init(id: "archive", label: "\(label) · 단위 \(chart.unit)", color: indicatorAxis.mainColor)]
        }
        return data.chartValues.isEmpty ? [] : [.init(id: "records", label: "기록 추이", color: indicatorAxis.mainColor)]
    }

    private var accessibilityLabel: String {
        return [
            labelOverride ?? data.kind.label,
            data.title,
            data.detail,
            data.supportingText ?? "",
            data.archiveChart?.summary ?? "",
            (legend ?? chartLegend).map(\.label).joined(separator: " · "),
        ]
        .filter { !$0.isEmpty }
        .joined(separator: ", ")
    }
}

/// Keeps the existing 132pt chart beside concise copy. Longer scopes use the full
/// text width instead of truncation, compressed type, or a very narrow text column.
private struct InsightSummaryReadableBodyLayout: Layout {
    private let spacing = TBSpacing.x16

    private func textWidth(_ width: CGFloat) -> CGFloat {
        max(0, min((width - spacing) / 2, width - TBMiniChartMetrics.width - spacing))
    }

    private func stacks(_ width: CGFloat, subviews: Subviews) -> Bool {
        guard subviews.count == 2 else { return false }
        let columnWidth = textWidth(width)
        let text = subviews[0].sizeThatFits(.init(width: columnWidth, height: nil))
        return columnWidth < TBMiniChartMetrics.width || text.height > TBMiniChartMetrics.height * 2
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 328
        guard subviews.count == 2 else {
            return subviews.first?.sizeThatFits(.init(width: width, height: nil)) ?? .zero
        }
        let stacked = stacks(width, subviews: subviews)
        let text = subviews[0].sizeThatFits(.init(width: stacked ? width : textWidth(width), height: nil))
        let chart = subviews[1].sizeThatFits(.init(width: TBMiniChartMetrics.width, height: nil))
        return CGSize(width: width, height: stacked ? text.height + TBSpacing.x12 + chart.height : max(text.height, chart.height))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count == 2 else {
            subviews.first?.place(at: bounds.origin, anchor: .topLeading,
                                  proposal: .init(width: bounds.width, height: nil))
            return
        }
        if stacks(bounds.width, subviews: subviews) {
            let text = subviews[0].sizeThatFits(.init(width: bounds.width, height: nil))
            subviews[0].place(at: bounds.origin, anchor: .topLeading,
                              proposal: .init(width: bounds.width, height: nil))
            subviews[1].place(at: CGPoint(x: bounds.maxX, y: bounds.minY + text.height + TBSpacing.x12), anchor: .topTrailing,
                              proposal: .init(width: TBMiniChartMetrics.width, height: nil))
        } else {
            subviews[0].place(at: CGPoint(x: bounds.minX, y: bounds.midY), anchor: .leading,
                              proposal: .init(width: textWidth(bounds.width), height: nil))
            subviews[1].place(at: CGPoint(x: bounds.maxX, y: bounds.midY), anchor: .trailing,
                              proposal: .init(width: TBMiniChartMetrics.width, height: nil))
        }
    }
}

struct HomePeriodInsightSection: View {
    let section: HomePeriodInsightSectionData
    var onSelect: ((HomePeriodInsightKind) -> Void)? = nil

    var body: some View {
        TBPageSection(title: section.period.title) {
            VStack(spacing: TBSpacing.x12) {
                ForEach(section.cards) { card in
                    HomePeriodInsightCard(
                        data: card,
                        onTap: onSelect.map { handler in
                            { handler(card.kind) }
                        }
                    )
                }
            }
        }
    }
}

extension HomePeriodInsightKind {
    /// Keep the fallback palette stable so a card does not change identity
    /// when its content changes. An explicit mapping also follows the
    /// existing home-summary axis language.
    var cardAxis: TasteAxis {
        switch self {
        case .recordFlow: .umami
        case .newExperiences: .sweet
        case .repeatPatterns: .salty
        case .tasteClue: .sour
        case .experienceBreadth: .fat
        case .tasteChange: .bitter
        }
    }

    var cardIcon: LucideIconName {
        switch self {
        case .recordFlow, .newExperiences, .repeatPatterns, .experienceBreadth: TDCategory.experience.icon
        case .tasteClue: TDCategory.sensation.icon
        case .tasteChange: TDCategory.change.icon
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview {
        HomePeriodInsightSection(
            section: HomePeriodInsightSectionData(
                period: .lastSevenDays,
                cards: [
                    HomePeriodInsightCardData(
                        kind: .recordFlow,
                        title: "4번 기록",
                        detail: "이전 7일보다 2번 더 기록했어요.",
                        supportingText: "새로운 맛의 흐름이 차곡차곡 쌓이고 있어요.",
                        stats: [
                            HomeInsightStat(label: "식당", value: "3곳"),
                            HomeInsightStat(label: "메뉴", value: "4개"),
                        ],
                        chartValues: [0, 1, 0, 1, 0, 1, 1],
                        accentAxis: nil,
                        state: .populated
                    ),
                    HomePeriodInsightCardData(
                        kind: .newExperiences,
                        title: "새로운 경험을 기다리는 중",
                        detail: "기록이 쌓이면 이전 경험과 비교해 보여드려요.",
                        supportingText: nil,
                        stats: [],
                        chartValues: [],
                        accentAxis: nil,
                        state: .empty
                    ),
                ]
            ),
            onSelect: { _ in }
        )
            .padding(TBSpacing.page)
            .background(TBColor.page)
            .tbCardBordersVisible(false)
    }
#endif

/// 기존 기간 카드의 레이아웃을 그대로 사용하는 누적 지표 영역.
struct HomeArchiveMetricsSection: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.colorScheme) private var colorScheme
    @State private var selectedDetail: TasteCardDetailRoute?

    var body: some View {
        Group {
            if appModel.sensoryAnalysisIsUpdating || appModel.backendSessionStatus == .restoring {
                SensoryAnalysisStatusCard(state: .processing)
            } else if let error = appModel.sensoryAnalysisError {
                SensoryAnalysisStatusCard(state: .failed(error))
                Button("다시 시도") {
                    Task { await appModel.syncAccountData(); appModel.refreshSensoryAnalysis() }
                }.frame(minHeight: 44)
            } else {
                AccountDataSyncNotice()
                if let archive = appModel.homeArchivePresentation {
                    TBPageSection(title: "아카이브") {
                        VStack(spacing: TBSpacing.x12) {
                            Text("전체 식사 \(archive.menuInsights.mealCount)번 · 연결된 메뉴 \(archive.menuInsights.menuCount)가지 · 식당 \(archive.menuInsights.restaurantCount)곳")
                                .font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .accessibilityIdentifier("home-archive-totals")
                            ForEach(HomeArchiveMenuMetricKind.allCases) { kind in
                                HomeArchiveMenuMetricCard(kind: kind, insights: archive.menuInsights,
                                    onTap: { selectedDetail = .archiveMetric(id: kind.rawValue, title: kind.title) })
                            }
                            recordHeatmapCard(archive.gastronomyState)
                        }
                    }
                    .platingLayoutFrame("home-section")
                }
            }
        }
        .tasteDetail($selectedDetail)
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in selectedDetail = nil }
    }

    private func recordHeatmapCard(_ state: TDState) -> some View {
        let data = TBRecordChartData.make(state: state)
        let days = data.month.filter { ($0.count ?? 0) > 0 }.count
        var items = (0..<5).map { level in
            TBSummaryCardLegendItem(id: String(level), label: level == 4 ? "4개 이상" : "\(level)개",
                                   color: TasteAxis.umami.heatmapColor(level: level, in: TBColorMode(colorScheme)))
        }
        if data.unknownDateCount > 0 {
            items.append(.init(id: "undated", label: "식사일 미확인 \(data.unknownDateCount)개 제외"))
        }
        return HomePeriodInsightCard(
            data: .init(kind: .recordFlow, title: "기록한 날 \(days)일",
                        detail: "요리 기록 \(data.total)개\n\(data.monthLabel)", supportingText: nil,
                        stats: [], chartValues: [], accentAxis: .umami, state: .populated),
            onTap: { selectedDetail = .archiveMetric(id: "meals", title: "기록한 식사") },
            labelOverride: "날짜별 기록 빈도",
            legend: items,
            visualization: AnyView(TBMiniHeatmap(values: data.month.map(\.count), startDay: data.startDay))
        )
        .accessibilityIdentifier("home-archive-record-frequency")
    }
}
