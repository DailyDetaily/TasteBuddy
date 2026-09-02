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
    var onTap: (() -> Void)? = nil

    var body: some View {
        TasteInsightSummaryCardLayout(
            indicatorColors: [indicatorAxis.mainColor],
            indicatorIcon: data.kind.cardIcon,
            sectionLabel: data.kind.label,
            actionLabel: onTap == nil ? nil : "자세히보기",
            title: data.title,
            titleContentSpacing: TBSpacing.x4,
            showsTitle: false,
            accessibilityLabel: accessibilityLabel,
            accessibilityHint: onTap == nil ? nil : "기간별 미식 기록 자세히 보기",
            onTap: onTap
        ) {
            insightDetails
        }
    }

    private var insightDetails: some View {
        HStack(alignment: .center, spacing: TBSpacing.x16) {
            VStack(alignment: .leading, spacing: TBSpacing.x4) {
                Text(data.title)
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineSpacing(2)

                Text(data.detail)
                    .font(TBFont.regular(TBTypography.FontSize.x12))
                    .foregroundStyle(TBColor.textHint)
                    .lineSpacing(3)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .layoutPriority(1)

            if !data.chartValues.isEmpty {
                HomePeriodInsightSparkBars(
                    values: data.chartValues,
                    axis: indicatorAxis
                )
                .frame(width: 132)
            }
        }
    }

    private var indicatorAxis: TasteAxis {
        data.accentAxis ?? data.kind.cardAxis
    }

    private var accessibilityLabel: String {
        return [
            data.kind.label,
            data.title,
            data.detail,
        ]
        .filter { !$0.isEmpty }
        .joined(separator: ", ")
    }
}

private struct HomePeriodInsightSparkBars: View {
    let values: [Double]
    let axis: TasteAxis

    private var minimum: Double {
        values.min() ?? 0
    }

    private var maximum: Double {
        values.max() ?? 1
    }

    private var range: Double {
        max(maximum - minimum, 1)
    }

    var body: some View {
        GeometryReader { proxy in
            HStack(alignment: .bottom, spacing: TBSpacing.x4) {
                ForEach(Array(values.enumerated()), id: \.offset) { index, value in
                    GeometryReader { barProxy in
                        let thickness = barProxy.size.width

                        ZStack(alignment: .top) {
                            Capsule()
                                .fill(axis.tintSoftBorderColor)
                                .frame(
                                    width: thickness,
                                    height: barHeight(
                                        for: value,
                                        in: proxy.size.height,
                                        thickness: thickness
                                    )
                                )

                            if index == values.indices.last {
                                Circle()
                                    .fill(axis.mainColor)
                                    .frame(width: thickness, height: thickness)
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, TBSpacing.x2)
        }
        .frame(height: 32)
        .accessibilityHidden(true)
    }

    private func normalizedValue(_ value: Double) -> CGFloat {
        CGFloat((value - minimum) / range)
    }

    private func barHeight(
        for value: Double,
        in height: CGFloat,
        thickness: CGFloat
    ) -> CGFloat {
        let maximumHeight = max(height, thickness)
        return thickness
            + normalizedValue(value) * (maximumHeight - thickness)
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

private extension HomePeriodInsightKind {
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
        case .recordFlow: .calendarCheck
        case .newExperiences: .sparkles
        case .repeatPatterns: .refreshCw
        case .tasteClue: .waves
        case .experienceBreadth: .globe
        case .tasteChange: .arrowUpRight
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
