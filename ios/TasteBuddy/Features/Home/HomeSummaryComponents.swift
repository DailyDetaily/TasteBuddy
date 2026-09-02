import SwiftUI

struct HomeSummaryCard: View {
    let label: String
    let value: String
    let detail: String
    let axis: TasteAxis
    let symbol: String
    var onTap: (() -> Void)? = nil

    var body: some View {
        RecommendationMiniCardLayout(
            axis: axis,
            title: label,
            subtitle: detail,
            detail: value,
            detailFont: TBFont.regular(14),
            onTap: onTap
        ) {
            LucideIcon(
                systemName: symbol,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.medium
            )
            .frame(
                width: RecommendationMiniCardMetrics.avatarSize,
                height: RecommendationMiniCardMetrics.avatarSize
            )
            .foregroundStyle(axis.mainColor)
            .background(TBColor.surface)
            .clipShape(Circle())
        }
    }
}

struct HomeSummaryRail: View {
    let metrics: [HomeSummaryMetric]
    var onSelect: ((HomeSummaryMetricKind) -> Void)? = nil

    var body: some View {
        TBPageSection(title: "미식 요약", titleSize: .medium) {
            CardScrollList(spacing: TBSpacing.x12) {
                ForEach(metrics) { metric in
                    HomeSummaryCard(
                        label: metric.cardLabel,
                        value: metric.cardValue,
                        detail: metric.cardDetail,
                        axis: metric.kind.cardAxis,
                        symbol: metric.kind.cardSymbol,
                        onTap: onSelect.map { handler in
                            { handler(metric.kind) }
                        }
                    )
                }
            }
        }
    }
}

private extension HomeSummaryMetricKind {
    var cardAxis: TasteAxis {
        switch self {
        case .record: .umami
        case .frequentMenu: .sweet
        case .regularRestaurant: .salty
        case .tasteDiscovery: .sour
        case .breadth: .fat
        case .tasteChange: .bitter
        }
    }

    var cardSymbol: String {
        switch self {
        case .record: "calendar.badge.checkmark"
        case .frequentMenu: "fork.knife"
        case .regularRestaurant: "storefront"
        case .tasteDiscovery: "sparkles"
        case .breadth: "globe"
        case .tasteChange: "arrow.up.right"
        }
    }
}

private extension HomeSummaryMetric {
    var cardLabel: String {
        if detail == "처음 기록한 메뉴" {
            return "최근 기록 메뉴"
        }

        if detail == "처음 기록한 식당" {
            return "방문한 식당"
        }

        if kind == .tasteDiscovery, detail == "1회 등장" {
            return "기록한 미각 단서"
        }

        return title
    }

    var cardValue: String {
        if state == .empty {
            return kind == .record ? "0번의 식사" : "기록 대기"
        }

        if kind == .record {
            return "\(value)번의 식사"
        }

        return value
    }

    var cardDetail: String {
        switch state {
        case .populated:
            return detail
                .replacingOccurrences(of: "식당 ", with: "")
        case .empty:
            return switch kind {
            case .record: "첫 기록을 남겨보세요"
            case .frequentMenu: "메뉴 기록 후 표시"
            case .regularRestaurant: "식당 기록 후 표시"
            case .tasteDiscovery: "미각 단서를 모으는 중"
            case .breadth: "경험을 모으는 중"
            case .tasteChange: "반응을 모으는 중"
            }
        case .building, .insufficient:
            return "반응 데이터가 더 필요해요"
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview {
        HomeSummaryRail(
            metrics: HomeSummaryEngine.metrics(for: [.sample])
        )
        .padding(TBSpacing.page)
        .background(TBColor.page)
    }
#endif
