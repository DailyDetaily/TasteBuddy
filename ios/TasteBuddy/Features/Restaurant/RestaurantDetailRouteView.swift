import SwiftUI
import UIKit

struct RestaurantDetailRouteView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var hydratedPlaceInfo: RestaurantPlaceInfo?
    @State private var showsBookmarkSheet = false
    @State private var showsInfoSuggestionSheet = false
    @State private var feedbackEntry: DiningEntry?

    let restaurantID: String
    var highlightedDishID: String?
    var navigate: (AppRoute) -> Void
    var onBack: () -> Void = {}
    var onOpenBookmarkSheet: ((RestaurantSummary) -> Void)? = nil
    var placeClient = RestaurantPlaceAPIClient()

    private var restaurant: RestaurantSummary {
        RestaurantCatalog.restaurant(id: restaurantID)
    }

    private var detail: RestaurantDetailModel {
        RestaurantDetailModel(summary: restaurant)
    }

    private var resolvedPlaceInfo: RestaurantPlaceInfo {
        detail.fallbackPlaceInfo.merging(hydratedPlaceInfo)
    }

    private var highlightedDishContext: (dish: RestaurantSummary.Dish, index: Int)? {
        guard let highlightedDishID,
              let index = detail.memorableDishes.firstIndex(where: { $0.id == highlightedDishID }) else {
            return nil
        }

        return (detail.memorableDishes[index], index)
    }

    var body: some View {
        Group {
            if let highlightedDishContext {
                RestaurantMenuDetailNativeView(
                    menu: detail.menuDetail(
                        for: highlightedDishContext.dish,
                        index: highlightedDishContext.index
                    ),
                    onRecordDishMemory: {
                        feedbackEntry = feedbackEntryForMenu(highlightedDishContext.dish.title)
                    },
                    onCompareLater: {
                        onBack()
                    }
                )
            } else {
                RestaurantDetailContentView(
                    detail: detail,
                    placeInfo: resolvedPlaceInfo,
                    isBookmarked: appModel.isRestaurantSaved(id: detail.id),
                    onBookmarkTap: presentBookmarkSheet,
                    onVisitedTap: detail.memorableDishes.isEmpty
                        ? nil
                        : { feedbackEntry = feedbackEntryForMenu(detail.memorableDishes.first?.title ?? detail.name) },
                    onSelectDish: { dish, _ in
                        navigate(.restaurantMenu(restaurantID: detail.id, menuID: dish.id))
                    },
                    onInfoSuggestionTap: { showsInfoSuggestionSheet = true }
                )
            }
        }
        .task(id: detail.id) {
            hydratedPlaceInfo = await placeClient.hydratePlaceInfo(
                restaurantName: detail.name,
                basePlaceInfo: detail.fallbackPlaceInfo
            )
        }
        .sheet(isPresented: $showsBookmarkSheet) {
            RestaurantBookmarkNativeSheet(restaurant: restaurant)
        }
        .sheet(isPresented: $showsInfoSuggestionSheet) {
            RestaurantInfoSuggestionNativeSheet(
                restaurantName: detail.name,
                infoRows: RestaurantDetailModel.infoRows(from: resolvedPlaceInfo)
            )
        }
        .fullScreenCover(item: $feedbackEntry) { entry in
            DiningFeedbackSheet(entry: entry) { savedEntry in
                appModel.addDiningEntry(savedEntry)
            }
        }
    }

    private func feedbackEntryForMenu(_ menuTitle: String) -> DiningEntry {
        DiningEntry(
            restaurant: detail.name,
            menu: menuTitle,
            rating: 5,
            note: "이 메뉴가 내 기준에서 어떻게 기억되는지 확인하기 위한 식후 피드백입니다."
        )
    }

    private func presentBookmarkSheet() {
        if let onOpenBookmarkSheet {
            onOpenBookmarkSheet(restaurant)
        } else {
            showsBookmarkSheet = true
        }
    }
}

private struct RestaurantDetailContentView: View {
    let detail: RestaurantDetailModel
    let placeInfo: RestaurantPlaceInfo
    let isBookmarked: Bool
    let onBookmarkTap: () -> Void
    let onVisitedTap: (() -> Void)?
    let onSelectDish: (RestaurantSummary.Dish, Int) -> Void
    let onInfoSuggestionTap: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                RestaurantHeroNativeDetailCard(
                    detail: detail,
                    placeInfo: placeInfo,
                    isBookmarked: isBookmarked,
                    onBookmarkTap: onBookmarkTap,
                    onVisitedTap: onVisitedTap
                )

                if !detail.memorableDishes.isEmpty {
                    RestaurantMemorableDishNativeCard(
                        dishes: detail.memorableDishes,
                        onSelectDish: onSelectDish
                    )
                }

                TBPageSection(title: "위치 및 정보", titleSize: .medium) {
                    VStack(spacing: 8) {
                        RestaurantInfoNativeCard(infoRows: RestaurantDetailModel.infoRows(from: placeInfo))

                        Button(action: onInfoSuggestionTap) {
                            HStack(spacing: 6) {
                                LucideIcon(
                                    .pencil,
                                    size: TBIcon.Size.small,
                                    strokeWidth: TBIcon.Stroke.regular
                                )
                                Text("수정 제안하기")
                            }
                            .font(TBFont.semibold(12))
                            .foregroundStyle(detail.axis.mainColor)
                            .padding(.vertical, 4)
                        }
                        .buttonStyle(.plain)
                    }
                }

                Spacer(minLength: 24)
            }
            .padding(TBSpacing.page)
        }
        .scrollIndicators(.hidden)
        .tbPageBackground()
    }
}

private struct RestaurantHeroNativeDetailCard: View {
    let detail: RestaurantDetailModel
    let placeInfo: RestaurantPlaceInfo
    let isBookmarked: Bool
    let onBookmarkTap: () -> Void
    let onVisitedTap: (() -> Void)?
    @State private var isQuickHoursExpanded = false

    private var quickInfoItems: [RestaurantQuickInfoItem] {
        var items = [
            RestaurantQuickInfoItem(id: .address, value: placeInfo.address, icon: .mapPin, allValues: nil)
        ]

        if let hours = placeInfo.hours {
            let display = RestaurantHoursDisplay(value: hours)
            items.append(
                RestaurantQuickInfoItem(
                    id: .hours,
                    value: display?.today ?? hours,
                    icon: .clock,
                    allValues: display?.all
                )
            )
        }

        if let phone = placeInfo.phone {
            items.append(RestaurantQuickInfoItem(id: .phone, value: phone, icon: .phone, allValues: nil))
        }

        return items.filter { !$0.value.isEmpty }
    }

    private var tasteTags: [RestaurantTagModel] {
        detail.tags.filter { $0.tone == .taste && $0.tasteAxis != nil }
    }

    private var contextTags: [RestaurantTagModel] {
        detail.tags.filter { $0.tone == .neutral || $0.tasteAxis == nil }
    }

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 16) {
                ImageBox(
                    alt: "\(detail.name) 대표 이미지",
                    kind: .restaurant,
                    fallback: .restaurant,
                    imageName: detail.heroImageName,
                    size: nil,
                    variant: .neutral
                )
                .frame(maxWidth: .infinity)
                .frame(height: 172)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .clipped()

                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .center, spacing: 12) {
                        ImageBox(
                            alt: "\(detail.name) 이미지",
                            kind: .chef,
                            fallback: .person,
                            imageName: detail.chefImageName,
                            size: .large,
                            variant: .neutral
                        )

                        VStack(alignment: .leading, spacing: 4) {
                            Text(detail.name)
                                .font(TBFont.bold(18))
                                .foregroundStyle(TBColor.textPrimary)
                                .lineLimit(1)
                            Text(detail.chefDisplayLabel ?? "\(detail.chefName) 셰프")
                                .font(TBFont.medium(13))
                                .foregroundStyle(TBColor.textSubtle)
                                .lineLimit(1)
                        }

                        Spacer(minLength: 8)

                        HStack(spacing: CompactCardMetrics.actionGap) {
                            if let onVisitedTap {
                                Button(action: onVisitedTap) {
                                    LucideIcon(
                                        .circlePlus,
                                        size: TBIcon.Size.large,
                                        strokeWidth: TBIcon.Stroke.regular
                                    )
                                    .frame(width: 32, height: 32)
                                    .foregroundStyle(TBColor.textSecondary)
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("먹어본 식당 피드백 남기기")
                            }

                            Button(action: onBookmarkTap) {
                                LucideIcon(
                                    .bookmark,
                                    size: TBIcon.Size.large,
                                    strokeWidth: TBIcon.Stroke.regular,
                                    filled: isBookmarked
                                )
                                .frame(width: 32, height: 32)
                                .foregroundStyle(isBookmarked ? TBColor.textPrimary : TBColor.textSecondary)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(isBookmarked ? "북마크 편집" : "북마크")
                        }
                    }

                    Text("• \(detail.summaryLine)")
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineSpacing(4)

                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(quickInfoItems) { item in
                            RestaurantQuickInfoRow(
                                item: item,
                                isExpanded: item.id == .hours && isQuickHoursExpanded,
                                onCopy: item.id == .address
                                    ? { UIPasteboard.general.string = item.value }
                                    : nil,
                                onToggleHours: item.id == .hours && item.allValues != nil
                                    ? { isQuickHoursExpanded.toggle() }
                                    : nil
                            )
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        TBFlowLayout(spacing: 8) {
                            ForEach(tasteTags) { tag in
                                if let axis = tag.tasteAxis {
                                    TasteChip(axis: axis, value: tag.label)
                                }
                            }
                        }

                        TBFlowLayout(spacing: 8) {
                            ForEach(contextTags) { tag in
                                NeutralChip(title: tag.label, size: .extraSmall)
                            }
                        }
                    }
                }
                .padding(.bottom, 16)
                .overlay(alignment: .bottom) {
                    Rectangle()
                        .fill(TBColor.borderSubtle)
                        .frame(height: 1)
                }

                HStack(spacing: 0) {
                    RestaurantMetric(value: "\(detail.scores.personalMatchRate)%", label: "나와의 매칭률")
                    RestaurantMetric(value: "\(detail.scores.palateFriendsAverageScore)점", label: "비슷한 미각 기준")
                    RestaurantMetric(value: String(format: "%.1f / 5", detail.scores.overallScore), label: "전체 평판")
                }
            }
        }
    }
}

private enum RestaurantQuickInfoID: String {
    case address
    case hours
    case phone
}

private struct RestaurantQuickInfoItem: Identifiable {
    let id: RestaurantQuickInfoID
    let value: String
    let icon: LucideIconName
    let allValues: [String]?
}

private struct RestaurantQuickInfoRow: View {
    let item: RestaurantQuickInfoItem
    let isExpanded: Bool
    let onCopy: (() -> Void)?
    let onToggleHours: (() -> Void)?

    var body: some View {
        HStack(alignment: isExpanded ? .top : .center, spacing: 6) {
            LucideIcon(
                item.icon,
                size: TBIcon.Size.xSmall,
                strokeWidth: TBIcon.Stroke.regular
            )
            .foregroundStyle(TBColor.iconMuted)
            .padding(.top, isExpanded ? 2 : 0)

            Group {
                if isExpanded, let allValues = item.allValues {
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(allValues, id: \.self) { value in
                            Text(value)
                        }
                    }
                } else {
                    Text(item.value)
                }
            }
            .font(TBFont.medium(11))
            .foregroundStyle(TBColor.textMuted)
            .lineLimit(isExpanded ? nil : 2)
            .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 4)

            if let onCopy {
                Button("복사", action: onCopy)
                    .font(TBFont.semibold(11))
                    .foregroundStyle(TBColor.textSecondary)
                    .buttonStyle(.plain)
            }

            if let onToggleHours {
                Button(action: onToggleHours) {
                    LucideIcon(
                        isExpanded ? .chevronUp : .chevronDown,
                        size: TBIcon.Size.small,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: 24, height: 24)
                    .foregroundStyle(TBColor.iconMuted)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isExpanded ? "전체 영업시간 접기" : "전체 영업시간 펼치기")
            }
        }
    }
}

private struct RestaurantHoursDisplay {
    let all: [String]
    let today: String

    init?(value: String) {
        let all = value
            .components(separatedBy: "/")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let weekdayLines = all.filter { RestaurantHoursDisplay.weekday(for: $0) != nil }

        guard weekdayLines.count >= 2 else {
            return nil
        }

        let currentIndex = Calendar(identifier: .gregorian).component(.weekday, from: Date()) - 1
        let todayLabel = RestaurantHoursDisplay.weekdayLabels[max(0, min(currentIndex, 6))]
        self.all = all
        self.today = all.first { RestaurantHoursDisplay.weekday(for: $0) == todayLabel } ?? weekdayLines[0]
    }

    private static let weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"]

    private static func weekday(for line: String) -> String? {
        let normalized = line.replacingOccurrences(of: #"^요일\s*"#, with: "", options: .regularExpression)
        return weekdayLabels.first { label in
            normalized.hasPrefix("\(label) ")
                || normalized.hasPrefix("\(label)요일")
                || normalized.hasPrefix("\(label):")
        }
    }
}

private struct RestaurantMetric: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 5) {
            Text(value)
                .font(TBFont.bold(18))
                .foregroundStyle(TBColor.textPrimary)
            Text(label)
                .font(TBFont.semibold(10))
                .foregroundStyle(TBColor.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 2)
    }
}

private struct RestaurantMemorableDishNativeCard: View {
    let dishes: [RestaurantSummary.Dish]
    let onSelectDish: (RestaurantSummary.Dish, Int) -> Void
    @State private var isExpanded = false

    private var canExpand: Bool {
        dishes.count > 2
    }

    private var visibleDishes: ArraySlice<RestaurantSummary.Dish> {
        canExpand && !isExpanded ? dishes.prefix(2) : dishes[...]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.card) {
            HStack {
                Text("메뉴")
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)

                Spacer()

                if canExpand {
                    Button {
                        isExpanded.toggle()
                    } label: {
                        CardDetailLabel(
                            label: isExpanded ? "메뉴 접기" : "전체 메뉴 보기",
                            direction: isExpanded ? .up : .down
                        )
                    }
                    .buttonStyle(.plain)
                }
            }

            SectionCard {
                VStack(spacing: 12) {
                    ForEach(Array(visibleDishes.enumerated()), id: \.element.id) { index, dish in
                        RestaurantMemorableDishRow(dish: dish) {
                            onSelectDish(dish, index)
                        }

                        if index < visibleDishes.count - 1 {
                            Rectangle()
                                .fill(TBColor.borderSubtle)
                                .frame(height: 1)
                        }
                    }

                    if canExpand {
                        Button {
                            isExpanded.toggle()
                        } label: {
                            LucideIcon(
                                .ellipsis,
                                size: TBIcon.Size.medium,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                            .frame(maxWidth: .infinity)
                            .frame(height: 12)
                            .foregroundStyle(TBColor.iconMuted)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(isExpanded ? "메뉴 접기" : "전체 메뉴 보기")
                    }
                }
            }
        }
    }
}

private struct RestaurantMemorableDishRow: View {
    let dish: RestaurantSummary.Dish
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack(alignment: .center, spacing: 12) {
                ImageBox(
                    alt: "\(dish.title) 이미지",
                    kind: .menu,
                    fallback: .menu,
                    size: .large,
                    variant: .neutral
                )

                VStack(alignment: .leading, spacing: 4) {
                    Text(dish.title)
                        .font(TBFont.bold(14))
                        .foregroundStyle(TBColor.textPrimary)
                        .lineLimit(1)
                    Text(briefDishSummary(dish.summary))
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineSpacing(3)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 4)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(dish.title) 메뉴 상세 보기")
    }

    private func briefDishSummary(_ summary: String) -> String {
        summary
            .replacingOccurrences(
                of: #"^현재\s+(미각\s+기준|프로필\s+기준|프로필|기준)(에서|과)?\s*"#,
                with: "",
                options: .regularExpression
            )
            .replacingOccurrences(
                of: #"^나의\s+미각\s+기준에서\s*"#,
                with: "",
                options: .regularExpression
            )
    }
}

private struct RestaurantInfoNativeCard: View {
    let infoRows: [RestaurantInfoRowModel]

    var body: some View {
        SectionCard {
            VStack(spacing: 12) {
                ForEach(Array(infoRows.enumerated()), id: \.element.id) { index, row in
                    RestaurantInfoNativeRow(row: row, showsChevron: false)

                    if index < infoRows.count - 1 {
                        Rectangle()
                            .fill(TBColor.borderSubtle)
                            .frame(height: 1)
                    }
                }
            }
        }
    }
}

private struct RestaurantInfoNativeRow: View {
    let row: RestaurantInfoRowModel
    var showsChevron = false
    var onTap: (() -> Void)? = nil

    var body: some View {
        Group {
            if let onTap {
                Button(action: onTap) {
                    rowContent
                }
                .buttonStyle(.plain)
            } else if let url = row.url {
                Link(destination: url) {
                    rowContent
                }
                .buttonStyle(.plain)
            } else {
                rowContent
            }
        }
    }

    private var rowContent: some View {
        HStack(alignment: .center, spacing: 12) {
            LucideIcon(
                systemName: row.id.symbol,
                size: TBIcon.Size.medium,
                strokeWidth: TBIcon.Stroke.regular
            )
            .frame(width: 22)
            .foregroundStyle(TBColor.iconPrimary)

            Text(displayValue)
                .font(TBFont.regular(13))
                .foregroundStyle(TBColor.textPrimary)
                .lineSpacing(3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .multilineTextAlignment(.leading)

            if showsChevron {
                LucideIcon(
                    .chevronRight,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .foregroundStyle(TBColor.iconMuted)
            }
        }
        .contentShape(Rectangle())
    }

    private var displayValue: String {
        guard row.id == .website,
              let url = row.url,
              let host = url.host else {
            return row.value
        }

        return host.replacingOccurrences(of: #"^www\."#, with: "", options: .regularExpression)
    }
}

private struct RestaurantMenuDetailNativeView: View {
    let menu: RestaurantMenuDetailModel
    let onRecordDishMemory: () -> Void
    let onCompareLater: () -> Void

    private var highlightedTasteTags: [RestaurantMenuTasteTagModel] {
        Array(menu.tasteTags.filter { $0.tasteAxis != nil }.prefix(4))
    }

    private var neutralTags: [RestaurantMenuTasteTagModel] {
        Array(menu.tasteTags.filter { $0.tasteAxis == nil }.prefix(4))
    }

    private var summaryItems: [(String, String)] {
        [
            ("내 기준 Fit", menu.fitBand),
            ("근거 신뢰도", menu.confidenceLabel),
            ("예상되는 감각 흐름", menu.expectedTasteFlow),
            ("주의해서 볼 지점", menu.mainRisk)
        ]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                SectionCard {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack(alignment: .top, spacing: 14) {
                            ImageBox(
                                alt: "\(menu.title) 이미지",
                                kind: .menu,
                                fallback: .menu,
                                imageName: menu.imageName,
                                imageURL: menu.imageURL,
                                size: nil,
                                variant: .neutral
                            )
                            .frame(width: 72, height: 72)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                            VStack(alignment: .leading, spacing: 10) {
                                HStack(spacing: 6) {
                                    NeutralChip(title: menu.courseLabel, size: .extraSmall)
                                    StatusChip(title: menu.confidenceLabel)
                                }

                                Text(menu.title)
                                    .font(TBFont.bold(18))
                                    .foregroundStyle(TBColor.textPrimary)
                                    .lineLimit(2)

                                Text("\(menu.restaurantName) · \(menu.chefName) 셰프")
                                    .font(TBFont.regular(12))
                                    .foregroundStyle(TBColor.textTertiary)
                            }
                        }

                        Text(menu.summaryLine)
                            .font(TBFont.regular(14))
                            .foregroundStyle(TBColor.textPrimary)
                            .lineSpacing(4)
                    }
                }

                TBPageSection(title: "메뉴 Fit 요약", titleSize: .medium) {
                    LazyVGrid(
                        columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                        spacing: 12
                    ) {
                        ForEach(summaryItems, id: \.0) { label, body in
                            SectionCard {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(label)
                                        .font(TBFont.semibold(11))
                                        .foregroundStyle(TBColor.textTertiary)
                                    Text(body)
                                        .font(TBFont.regular(14))
                                        .foregroundStyle(TBColor.textPrimary)
                                        .lineSpacing(3)
                                }
                            }
                        }
                    }
                }

                TBPageSection(title: "관련 미각 축", titleSize: .medium) {
                    SectionCard {
                        VStack(alignment: .leading, spacing: 14) {
                            TBFlowLayout(spacing: 8) {
                                ForEach(highlightedTasteTags) { tag in
                                    if let axis = tag.tasteAxis {
                                        TasteChip(axis: axis, value: tag.label)
                                    }
                                }

                                ForEach(neutralTags) { tag in
                                    NeutralChip(title: tag.label)
                                }
                            }

                            Text("이 축들은 점수표가 아니라, 메뉴가 내 기준에서 어떤 방식으로 기억될지 읽기 위한 단서예요.")
                                .font(TBFont.regular(13))
                                .foregroundStyle(TBColor.textMuted)
                                .lineSpacing(4)
                        }
                    }
                }

                RestaurantMenuTextSection(title: "비슷한 미각 신호", text: menu.similarPalateSignal)
                RestaurantMenuTextSection(
                    title: "과거 경험과 비교",
                    text: menu.lowConfidenceHint
                        ?? menu.pastExperienceComparison
                        ?? "아직 비교 기준이 충분하지 않아요. 먹어본 메뉴로 기록하면 다음 판단이 더 선명해집니다."
                )
                RestaurantMenuTextSection(title: "셰프 의도", text: menu.chefIntent)

                SectionCard {
                    VStack(spacing: 12) {
                        PrimaryButton(title: "먹어본 메뉴로 기록하기", action: onRecordDishMemory)

                        Button(action: onCompareLater) {
                            Text("나중에 비교하기")
                                .font(TBFont.semibold(13))
                                .foregroundStyle(TBColor.textPrimary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                                .background(TBColor.surface)
                                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                                .overlay {
                                    RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                                        .stroke(TBColor.border)
                                }
                        }
                        .buttonStyle(.plain)
                    }
                }

                Spacer(minLength: 24)
            }
            .padding(TBSpacing.page)
        }
        .scrollIndicators(.hidden)
        .tbPageBackground()
    }
}

private struct RestaurantMenuTextSection: View {
    let title: String
    let text: String

    var bodyView: some View {
        TBPageSection(title: title, titleSize: .medium) {
            SectionCard {
                Text(text)
                    .font(TBFont.regular(14))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineSpacing(4)
            }
        }
    }

    var body: some View {
        bodyView
    }
}

private struct RestaurantInfoSuggestionNativeSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var step: Step = .select
    @State private var selectedRowIDs: Set<RestaurantInfoRowID> = []
    @State private var suggestedValues: [RestaurantInfoRowID: String] = [:]

    let restaurantName: String
    let infoRows: [RestaurantInfoRowModel]

    private enum Step {
        case select
        case edit
        case done
    }

    private var activeRows: [RestaurantInfoRowModel] {
        infoRows.filter { selectedRowIDs.contains($0.id) }
    }

    private var canSubmit: Bool {
        activeRows.contains { row in
            let suggestion = suggestedValues[row.id]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return !suggestion.isEmpty && suggestion != row.value.trimmingCharacters(in: .whitespacesAndNewlines)
        }
    }

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(headerStart),
            headerCenter: AnyView(
                Text(step == .edit ? "정보 수정" : "정보 제안")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(footer),
            usesNativeSheetChrome: true
        ) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    switch step {
                    case .select:
                        selectContent
                    case .edit:
                        editContent
                    case .done:
                        doneContent
                    }
                }
                .padding(TBSpacing.page)
            }
        }
        .presentationDragIndicator(.hidden)
        .presentationBackground(Color.clear)
        .presentationCornerRadius(0)
        .prefersUISheetGrabberVisible(false)
    }

    private var headerStart: some View {
        Group {
            if step == .edit {
                BottomSheetIconButton(ariaLabel: "수정할 정보 선택으로 돌아가기", icon: .chevronLeft) {
                    step = .select
                }
            } else {
                BottomSheetCloseButton {
                    dismiss()
                }
            }
        }
    }

    private var footer: some View {
        Group {
            switch step {
            case .done:
                PrimaryButton(title: "완료") {
                    dismiss()
                }
            case .edit:
                HStack(spacing: 8) {
                    secondaryFooterButton("취소") {
                        dismiss()
                    }
                    PrimaryButton(title: "제출", isEnabled: canSubmit) {
                        step = .done
                    }
                }
            case .select:
                secondaryFooterButton("취소") {
                    dismiss()
                }
            }
        }
    }

    private var selectContent: some View {
        VStack(alignment: .leading, spacing: 20) {
            sheetIntro(
                title: "어떤 정보를 고칠까요?",
                description: "위치 및 정보 카드에서 수정이 필요한 행을 선택해주세요."
            )

            VStack(spacing: 12) {
                ForEach(infoRows) { row in
                    RestaurantInfoNativeRow(row: row, showsChevron: true) {
                        selectedRowIDs = [row.id]
                        suggestedValues = [row.id: row.value]
                        step = .edit
                    }
                }
            }
        }
    }

    private var editContent: some View {
        VStack(alignment: .leading, spacing: 20) {
            sheetIntro(
                title: "수정할 정보를 선택해주세요",
                description: "여러 항목을 함께 선택하면 한 번에 수정 제안을 남길 수 있어요."
            )

            TBFlowLayout(spacing: 8) {
                ForEach(infoRows) { row in
                    Button {
                        toggle(row)
                    } label: {
                        Text(row.id.suggestionLabel)
                            .font(TBFont.semibold(12))
                            .foregroundStyle(selectedRowIDs.contains(row.id) ? TBColor.textInverse : TBColor.textMuted)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(selectedRowIDs.contains(row.id) ? TBColor.textPrimary : TBColor.surface)
                            .clipShape(Capsule())
                            .overlay {
                                Capsule()
                                    .stroke(
                                        selectedRowIDs.contains(row.id)
                                            ? TBColor.textPrimary
                                            : TBColor.borderSubtle
                                    )
                            }
                    }
                    .buttonStyle(.plain)
                }
            }

            VStack(alignment: .leading, spacing: 16) {
                ForEach(activeRows) { row in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(row.id.suggestionLabel)
                            .font(TBFont.semibold(12))
                            .foregroundStyle(TBColor.textSubtle)

                        TextEditor(
                            text: Binding(
                                get: { suggestedValues[row.id] ?? row.value },
                                set: { suggestedValues[row.id] = $0 }
                            )
                        )
                        .font(TBFont.regular(14))
                        .foregroundStyle(TBColor.textPrimary)
                        .frame(minHeight: 112)
                        .padding(10)
                        .scrollContentBackground(.hidden)
                        .background(TBColor.surface)
                        .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous)
                                .stroke(TBColor.border)
                        }
                    }
                }
            }
        }
    }

    private var doneContent: some View {
        VStack(alignment: .center, spacing: 18) {
            LucideIcon(
                .circleCheck,
                size: TBIcon.Size.extraLarge,
                strokeWidth: TBIcon.Stroke.regular
            )
            .frame(width: 48, height: 48)
            .foregroundStyle(TBColor.textPrimary)
            .background(TBColor.mutedSurface)
            .clipShape(Circle())

            VStack(spacing: 8) {
                Text("수정 제안을 받았어요")
                    .font(TBFont.bold(18))
                    .foregroundStyle(TBColor.textPrimary)
                Text("제안된 정보는 확인 후 \(restaurantName)의 장소 정보 판단에 반영할게요.")
                    .font(TBFont.regular(14))
                    .foregroundStyle(TBColor.textMuted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }

    private func sheetIntro(title: String, description: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            LucideIcon(
                .pencil,
                size: TBIcon.Size.large,
                strokeWidth: TBIcon.Stroke.regular
            )
            .frame(width: 40, height: 40)
            .foregroundStyle(TBColor.textSecondary)
            .background(TBColor.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))

            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(TBFont.bold(18))
                    .foregroundStyle(TBColor.textPrimary)
                Text(description)
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textMuted)
                    .lineSpacing(4)
            }
        }
    }

    private func secondaryFooterButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textSecondary)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func toggle(_ row: RestaurantInfoRowModel) {
        if selectedRowIDs.contains(row.id) {
            guard selectedRowIDs.count > 1 else { return }
            selectedRowIDs.remove(row.id)
        } else {
            selectedRowIDs.insert(row.id)
            suggestedValues[row.id] = suggestedValues[row.id] ?? row.value
        }
    }
}

#Preview("Restaurant Detail") {
    NavigationStack {
        RestaurantDetailRouteView(restaurantID: "mingles", navigate: { _ in })
            .environmentObject(
                AppModel.preview(
                    diningEntries: [.sample],
                    savedRestaurantIDs: Set(RestaurantCatalog.savedDefaults)
                )
            )
    }
}
