import SwiftUI
import UIKit

struct RestaurantDetailRouteView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var hydratedPlaceInfo: RestaurantPlaceInfo?
    @State private var showsBookmarkSheet = false
    @State private var showsInfoSuggestionSheet = false
    @State private var showsMenuSuggestionSheet = false
    @State private var feedbackEntry: DiningEntry?

    let restaurantID: String
    var restaurantOverride: RestaurantSummary? = nil
    var highlightedDishID: String?
    var navigate: (AppRoute) -> Void
    var onBack: () -> Void = {}
    var onOpenBookmarkSheet: ((RestaurantSummary) -> Void)? = nil
    var onOpenInfoSuggestionSheet: ((String, [RestaurantInfoRowModel]) -> Void)? = nil
    var onOpenMenuSuggestionSheet: ((String) -> Void)? = nil
    var placeClient = RestaurantPlaceAPIClient()

    private var restaurant: RestaurantSummary {
        restaurantOverride ?? RestaurantCatalog.restaurant(id: restaurantID)
    }

    private var detail: RestaurantDetailModel {
        RestaurantDetailModel(summary: restaurant)
    }

    private var resolvedPlaceInfo: RestaurantPlaceInfo {
        detail.fallbackPlaceInfo.merging(hydratedPlaceInfo)
    }

    private var isExternalPlaceDetail: Bool {
        guard let restaurantOverride else {
            return false
        }

        return !RestaurantCatalog.restaurants.contains { $0.id == restaurantOverride.id }
    }

    private var userTasteAccentAxis: TasteAxis {
        appModel.profile?.strongestAxis ?? TasteAxis.sweet
    }

    private var userTasteAccentMainColor: Color {
        userTasteAccentAxis.mainColor
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
                        feedbackEntry = feedbackEntryForMenu(
                            highlightedDishContext.dish.title,
                            menuItemID: highlightedDishContext.dish.id
                        )
                    },
                    onCompareLater: {
                        onBack()
                    }
                )
            } else {
                RestaurantDetailContentView(
                    detail: detail,
                    placeInfo: resolvedPlaceInfo,
                    isExternalPlaceDetail: isExternalPlaceDetail,
                    isBookmarked: appModel.isRestaurantSaved(id: detail.id),
                    userTasteAccentAxis: userTasteAccentAxis,
                    userTasteAccentMainColor: userTasteAccentMainColor,
                    onBookmarkTap: presentBookmarkSheet,
                    onVisitedTap: detail.memorableDishes.isEmpty && !isExternalPlaceDetail
                        ? nil
                        : {
                            let dish = detail.memorableDishes.first
                            feedbackEntry = feedbackEntryForMenu(
                                dish?.title ?? detail.name,
                                menuItemID: dish?.id
                            )
                        },
                    onSelectDish: { dish, _ in
                        navigate(.restaurantMenu(restaurantID: detail.id, menuID: dish.id))
                    },
                    onMenuAddTap: presentMenuSuggestionSheet,
                    onInfoSuggestionTap: presentInfoSuggestionSheet
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
        .sheet(isPresented: $showsMenuSuggestionSheet) {
            RestaurantMenuSuggestionNativeSheet(restaurantName: detail.name)
        }
        .fullScreenCover(item: $feedbackEntry) { entry in
            DiningFeedbackSheet(entry: entry) { savedEntry in
                appModel.addDiningEntry(savedEntry)
            }
        }
    }

    private func feedbackEntryForMenu(
        _ menuTitle: String,
        menuItemID: String?
    ) -> DiningEntry {
        DiningEntry(
            restaurant: detail.name,
            restaurantID: detail.id,
            menu: menuTitle,
            menuItemID: menuItemID,
            rating: 0,
            note: "",
            sensorySelections: [],
            feedbackStatus: .captured
        )
    }

    private func presentBookmarkSheet() {
        if let onOpenBookmarkSheet {
            onOpenBookmarkSheet(restaurant)
        } else {
            showsBookmarkSheet = true
        }
    }

    private func presentInfoSuggestionSheet() {
        let infoRows = RestaurantDetailModel.infoRows(from: resolvedPlaceInfo)

        if let onOpenInfoSuggestionSheet {
            onOpenInfoSuggestionSheet(detail.name, infoRows)
        } else {
            showsInfoSuggestionSheet = true
        }
    }

    private func presentMenuSuggestionSheet() {
        if let onOpenMenuSuggestionSheet {
            onOpenMenuSuggestionSheet(detail.name)
        } else {
            showsMenuSuggestionSheet = true
        }
    }
}

private struct RestaurantDetailContentView: View {
    private static let bottomSafeAreaPadding: CGFloat = 34

    let detail: RestaurantDetailModel
    let placeInfo: RestaurantPlaceInfo
    let isExternalPlaceDetail: Bool
    let isBookmarked: Bool
    let userTasteAccentAxis: TasteAxis
    let userTasteAccentMainColor: Color
    let onBookmarkTap: () -> Void
    let onVisitedTap: (() -> Void)?
    let onSelectDish: (RestaurantSummary.Dish, Int) -> Void
    let onMenuAddTap: () -> Void
    let onInfoSuggestionTap: () -> Void

    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    RestaurantHeroNativeDetailCard(
                        detail: detail,
                        placeInfo: placeInfo,
                        isExternalPlaceDetail: isExternalPlaceDetail,
                        isBookmarked: isBookmarked,
                        userTasteAccentMainColor: userTasteAccentMainColor,
                        onBookmarkTap: onBookmarkTap,
                        onVisitedTap: onVisitedTap
                    )

                    if isExternalPlaceDetail {
                        TBPageSection(title: "메뉴", titleSize: .medium) {
                            RestaurantMenuContributionNativeCard(
                                accentAxis: userTasteAccentAxis,
                                onAddMenuTap: onMenuAddTap
                            )
                        }
                    } else if RestaurantExternalPlaceSignalNativeCard.hasSignals(in: placeInfo) {
                        TBPageSection(title: "방문 전 참고 정보", titleSize: .medium) {
                            RestaurantExternalPlaceSignalNativeCard(placeInfo: placeInfo)
                        }
                    }

                    if !detail.memorableDishes.isEmpty {
                        RestaurantMemorableDishNativeCard(
                            dishes: detail.memorableDishes,
                            onSelectDish: onSelectDish
                        )
                    }

                    TBPageSection(title: "위치 및 정보", titleSize: .medium) {
                        VStack(spacing: 8) {
                            RestaurantInfoNativeCard(
                                infoRows: RestaurantDetailModel.infoRows(
                                    from: placeInfo,
                                    includingFallbacks: isExternalPlaceDetail
                                )
                            )

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
                                .foregroundStyle(userTasteAccentMainColor)
                                .padding(.vertical, 4)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, TBSpacing.page)
                .padding(.top, TBSpacing.pageTop)
                .padding(.bottom, max(proxy.safeAreaInsets.bottom, Self.bottomSafeAreaPadding))
            }
            .scrollIndicators(.hidden)
            .contentMargins(.bottom, 0, for: .scrollContent)
        }
        .tbPageBackground()
        .ignoresSafeArea(.container, edges: .bottom)
    }
}

private struct RestaurantHeroNativeDetailCard: View {
    let detail: RestaurantDetailModel
    let placeInfo: RestaurantPlaceInfo
    let isExternalPlaceDetail: Bool
    let isBookmarked: Bool
    let userTasteAccentMainColor: Color
    let onBookmarkTap: () -> Void
    let onVisitedTap: (() -> Void)?
    @State private var isQuickHoursExpanded = false

    private var quickInfoItems: [RestaurantQuickInfoItem] {
        if isExternalPlaceDetail {
            let address = placeInfo.address.trimmingCharacters(in: .whitespacesAndNewlines)
            let hours = placeInfo.hours?.trimmingCharacters(in: .whitespacesAndNewlines)
            let phone = placeInfo.phone?.trimmingCharacters(in: .whitespacesAndNewlines)
            let display = hours.nilIfBlank.flatMap { RestaurantHoursDisplay(value: $0) }

            return [
                RestaurantQuickInfoItem(
                    id: .address,
                    value: address.isEmpty ? "주소를 알려주세요" : address,
                    icon: .mapPin,
                    allValues: nil,
                    isFallback: address.isEmpty
                ),
                RestaurantQuickInfoItem(
                    id: .hours,
                    value: (display?.today ?? hours).nilIfBlank ?? "영업시간을 알려주세요",
                    icon: .clock,
                    allValues: display?.all,
                    isFallback: hours?.isEmpty ?? true
                ),
                RestaurantQuickInfoItem(
                    id: .phone,
                    value: phone.nilIfBlank ?? "전화번호를 알려주세요",
                    icon: .phone,
                    allValues: nil,
                    isFallback: phone?.isEmpty ?? true
                )
            ]
        }

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

    private var tasteBubbleSuggestions: [RestaurantTasteBubbleSuggestion] {
        if isExternalPlaceDetail {
            return RestaurantTasteBubbleSuggestion.externalSuggestions(
                category: placeInfo.category ?? detail.category,
                name: detail.name
            )
        }

        return detail.tags
            .filter { $0.tone == .taste && $0.tasteAxis != nil }
            .prefix(3)
            .compactMap { tag in
                guard let axis = tag.tasteAxis else { return nil }
                return RestaurantTasteBubbleSuggestion(label: tag.label, axis: axis)
            }
    }

    private var contextTags: [RestaurantTagModel] {
        detail.tags.filter { $0.tone == .neutral || $0.tasteAxis == nil }
    }

    private var contextChipTitles: [String] {
        if isExternalPlaceDetail {
            return RestaurantTasteBubbleSuggestion.externalReferenceChips(
                category: placeInfo.category ?? detail.category,
                fallbackCategory: detail.category
            )
        }

        var seen = Set<String>()
        return ([detail.category, detail.locationLabel] + contextTags.map(\.label))
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { title in
                !title.isEmpty && seen.insert(title).inserted
            }
    }

    private var subtitleText: String {
        if isExternalPlaceDetail {
            let category = placeInfo.category ?? detail.category
            if let categorySubtitle = Self.compactCategorySubtitle(category) {
                return categorySubtitle
            }
        }

        return detail.chefDisplayLabel ?? "\(detail.chefName) 셰프"
    }

    private var heroImageURL: URL? {
        detail.heroImageName == nil ? placeInfo.googlePhotoURL : nil
    }

    private var googlePhotoAttribution: String? {
        guard heroImageURL != nil else {
            return nil
        }

        return placeInfo.googlePhotoAttribution
    }

    private static func compactCategorySubtitle(_ category: String?) -> String? {
        guard let category else {
            return nil
        }

        let parts = category
            .components(separatedBy: ">")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty && $0 != "음식점" }
            .suffix(2)

        guard !parts.isEmpty else {
            return nil
        }

        return parts.joined(separator: " · ")
    }

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    ImageBox(
                        alt: "\(detail.name) 대표 이미지",
                        kind: .restaurant,
                        fallback: .restaurant,
                        imageName: detail.heroImageName,
                        imageURL: heroImageURL,
                        size: nil,
                        variant: .neutral
                    )
                    .frame(maxWidth: .infinity)
                    .frame(height: 172)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .clipped()

                    if let googlePhotoAttribution {
                        Text("사진 \(googlePhotoAttribution)")
                            .font(TBFont.medium(10))
                            .foregroundStyle(TBColor.textHint)
                    }
                }

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
                            Text(subtitleText)
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
                                .buttonStyle(TBTokenButtonStyle())
                                .accessibilityLabel("먹어본 식당 피드백 남기기")
                            }

                            Button(action: onBookmarkTap) {
                                LucideIcon(
                                    .bookmark,
                                    size: TBIcon.Size.large,
                                    strokeWidth: TBIcon.Stroke.regular,
                                    filled: isBookmarked
                                )
                                .tasteBloomReplace(value: isBookmarked)
                                .frame(width: 32, height: 32)
                                .foregroundStyle(isBookmarked ? TBColor.textPrimary : TBColor.textSecondary)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(TBTokenButtonStyle())
                            .tasteBloomMotion(.feedback, value: isBookmarked)
                            .accessibilityLabel(isBookmarked ? "북마크 편집" : "북마크")
                        }
                    }

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
                                    : nil,
                                accentColor: userTasteAccentMainColor
                            )
                        }
                    }

                    VStack(alignment: .leading, spacing: DishFeedbackCardMetrics.chipStackGap) {
                        ScrollView(.horizontal) {
                            HStack(spacing: DishFeedbackCardMetrics.chipStackGap) {
                                ForEach(tasteBubbleSuggestions) { suggestion in
                                    TasteChip(
                                        title: suggestion.label,
                                        tone: .taste,
                                        colorAxis: suggestion.axis,
                                        size: .sm
                                    )
                                    .fixedSize()
                                }
                            }
                            .padding(.horizontal, 1)
                            .padding(.vertical, 1)
                        }
                        .scrollIndicators(.hidden)

                        ScrollView(.horizontal) {
                            HStack(spacing: DishFeedbackCardMetrics.chipStackGap) {
                                ForEach(contextChipTitles, id: \.self) { title in
                                    NeutralChip(title: title)
                                        .fixedSize()
                                }
                            }
                            .padding(.horizontal, 1)
                            .padding(.vertical, 1)
                        }
                        .scrollIndicators(.hidden)
                    }
                }
                .padding(.bottom, 16)
                .overlay(alignment: .bottom) {
                    Rectangle()
                        .fill(TBColor.borderSubtle)
                        .frame(height: 1)
                }

                HStack(spacing: 0) {
                    RestaurantMetric(value: detail.scores.personalMatchRate.map { "\($0)%" } ?? "미계산", label: "나와의 매칭률")
                    RestaurantMetric(value: detail.scores.palateFriendsAverageScore.map { "\($0)점" } ?? "미계산", label: "비슷한 미각 기준")
                    RestaurantMetric(value: detail.scores.overallScore.map { String(format: "%.1f / 5", $0) } ?? "정보 없음", label: "전체 평판")
                }
            }
        }
    }
}

private struct RestaurantExternalPlaceSignalNativeCard: View {
    let placeInfo: RestaurantPlaceInfo

    private struct SignalItem: Identifiable {
        let id: String
        let label: String
        let value: String
    }

    private var signals: [SignalItem] {
        Self.signals(in: placeInfo)
    }

    static func hasSignals(in placeInfo: RestaurantPlaceInfo) -> Bool {
        !signals(in: placeInfo).isEmpty
    }

    var body: some View {
        SectionCard {
            LazyVGrid(
                columns: [
                    GridItem(.flexible(), spacing: 12),
                    GridItem(.flexible(), spacing: 12)
                ],
                alignment: .leading,
                spacing: 12
            ) {
                ForEach(signals) { signal in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(signal.label)
                            .font(TBFont.semibold(11))
                            .foregroundStyle(TBColor.textTertiary)
                        Text(signal.value)
                            .font(TBFont.semibold(13))
                            .foregroundStyle(TBColor.textPrimary)
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private static func signals(in placeInfo: RestaurantPlaceInfo) -> [SignalItem] {
        var items: [SignalItem] = []

        if let category = compactCategory(placeInfo.category) {
            items.append(SignalItem(id: "category", label: "Kakao 분류", value: category))
        }

        if let rating = placeInfo.googleRating {
            items.append(
                SignalItem(
                    id: "rating",
                    label: "Google 평점",
                    value: String(format: "%.1f / 5", rating)
                )
            )
        }

        if let reviewCount = placeInfo.googleUserRatingCount, reviewCount > 0 {
            items.append(
                SignalItem(
                    id: "reviews",
                    label: "Google 리뷰",
                    value: "\(reviewCount.formatted())개"
                )
            )
        }

        if let priceLabel = priceLevelLabel(placeInfo.googlePriceLevel) {
            items.append(SignalItem(id: "price", label: "Google 가격대", value: priceLabel))
        }

        return items
    }

    private static func compactCategory(_ category: String?) -> String? {
        guard let category else {
            return nil
        }

        let parts = category
            .components(separatedBy: ">")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .suffix(2)

        guard !parts.isEmpty else {
            return nil
        }

        return parts.joined(separator: " · ")
    }

    private static func priceLevelLabel(_ priceLevel: String?) -> String? {
        guard let priceLevel else {
            return nil
        }

        switch priceLevel {
        case "PRICE_LEVEL_FREE":
            return "무료"
        case "PRICE_LEVEL_INEXPENSIVE":
            return "가벼운 가격대"
        case "PRICE_LEVEL_MODERATE":
            return "중간 가격대"
        case "PRICE_LEVEL_EXPENSIVE":
            return "높은 가격대"
        case "PRICE_LEVEL_VERY_EXPENSIVE":
            return "프리미엄 가격대"
        default:
            return priceLevel.replacingOccurrences(of: "PRICE_LEVEL_", with: "")
        }
    }
}

private struct RestaurantMenuContributionNativeCard: View {
    let accentAxis: TasteAxis
    let onAddMenuTap: () -> Void

    var body: some View {
        SectionCard {
            Button(action: onAddMenuTap) {
                HStack(alignment: .center, spacing: 12) {
                    LucideIcon(
                        .utensilsCrossed,
                        size: TBIcon.Size.large,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: 40, height: 40)
                    .foregroundStyle(TBColor.iconMuted)
                    .background(TBColor.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    VStack(alignment: .leading, spacing: 5) {
                        Text("메뉴 추가")
                            .font(TBFont.bold(14))
                            .foregroundStyle(TBColor.textPrimary)

                        HStack(spacing: 0) {
                            Text("메뉴를 알고 계시면 알려주세요. ")
                                .foregroundStyle(TBColor.textMuted)

                            Text("최대 2점")
                                .font(TBFont.semibold(12))
                                .foregroundStyle(accentAxis.tintSubTextColor)
                        }
                            .font(TBFont.regular(12))
                            .lineSpacing(3)
                            .multilineTextAlignment(.leading)
                    }

                    Spacer(minLength: 4)

                    LucideIcon(
                        .plus,
                        size: TBIcon.Size.medium,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .foregroundStyle(TBColor.iconMuted)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("메뉴 추가. 메뉴를 알고 계시면 알려주세요. 최대 2점")
        }
    }
}

private struct RestaurantTasteBubbleSuggestion: Identifiable {
    let id: String
    let label: String
    let axis: TasteAxis

    init(label: String, axis: TasteAxis) {
        self.id = "\(axis.rawValue)-\(label)"
        self.label = label
        self.axis = axis
    }

    static func externalSuggestions(category: String, name: String) -> [RestaurantTasteBubbleSuggestion] {
        let source = "\(category) \(name)"

        if source.contains("국수")
            || source.contains("면")
            || source.lowercased().contains("noodle")
            || source.contains("라멘")
            || source.contains("냉면") {
            return [
                RestaurantTasteBubbleSuggestion(label: "맑은 감칠맛", axis: .umami),
                RestaurantTasteBubbleSuggestion(label: "편안한 염도", axis: .salty),
                RestaurantTasteBubbleSuggestion(label: "가벼운 피니시", axis: .sour)
            ]
        }

        if source.contains("고기") || source.contains("구이") || source.contains("스테이크") {
            return [
                RestaurantTasteBubbleSuggestion(label: "부드러운 지방감", axis: .fat),
                RestaurantTasteBubbleSuggestion(label: "진한 감칠맛", axis: .umami),
                RestaurantTasteBubbleSuggestion(label: "또렷한 간", axis: .salty)
            ]
        }

        if source.contains("중식") || source.contains("중국") {
            return [
                RestaurantTasteBubbleSuggestion(label: "진한 감칠맛", axis: .umami),
                RestaurantTasteBubbleSuggestion(label: "기름진 질감", axis: .fat),
                RestaurantTasteBubbleSuggestion(label: "향신 여운", axis: .bitter)
            ]
        }

        if source.contains("일식") || source.contains("스시") || source.contains("오마카세") {
            return [
                RestaurantTasteBubbleSuggestion(label: "맑은 감칠맛", axis: .umami),
                RestaurantTasteBubbleSuggestion(label: "절제된 염도", axis: .salty),
                RestaurantTasteBubbleSuggestion(label: "깨끗한 마무리", axis: .sour)
            ]
        }

        return [
            RestaurantTasteBubbleSuggestion(label: "깊은 감칠맛", axis: .umami),
            RestaurantTasteBubbleSuggestion(label: "절제된 염도", axis: .salty),
            RestaurantTasteBubbleSuggestion(label: "편안한 여운", axis: .fat)
        ]
    }

    static func externalReferenceChips(category: String, fallbackCategory: String) -> [String] {
        var seen = Set<String>()
        let parts = (category.isEmpty ? fallbackCategory : category)
            .components(separatedBy: ">")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty && $0 != "음식점" }

        return parts.filter { seen.insert($0).inserted }.prefix(5).map(\.self)
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
    var isFallback = false
}

private struct RestaurantQuickInfoRow: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let item: RestaurantQuickInfoItem
    let isExpanded: Bool
    let onCopy: (() -> Void)?
    let onToggleHours: (() -> Void)?
    let accentColor: Color

    var body: some View {
        HStack(alignment: isExpanded ? .top : .center, spacing: 6) {
            LucideIcon(
                item.icon,
                size: TBIcon.Size.xSmall,
                strokeWidth: TBIcon.Stroke.regular
            )
            .foregroundStyle(TBColor.iconMuted)
            .padding(.top, isExpanded ? 2 : 0)

            ZStack(alignment: .topLeading) {
                if isExpanded, let allValues = item.allValues {
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(allValues, id: \.self) { value in
                            Text(value)
                        }
                    }
                    .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
                } else {
                    Text(item.value)
                        .transition(.opacity)
                }
            }
            .font(TBFont.medium(11))
            .foregroundStyle(item.isFallback ? TBColor.textDisabled : TBColor.textMuted)
            .lineLimit(isExpanded ? nil : 2)
            .fixedSize(horizontal: false, vertical: true)

            if let onCopy, !item.isFallback {
                Button("복사", action: onCopy)
                    .font(TBFont.semibold(11))
                    .foregroundStyle(accentColor)
                    .buttonStyle(TBTokenButtonStyle())
            }

            if let onToggleHours {
                Button(action: onToggleHours) {
                    LucideIcon(
                        .chevronDown,
                        size: TBIcon.Size.small,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .rotationEffect(.degrees(isExpanded ? 180 : 0))
                    .tasteBloomMotion(.feedback, value: isExpanded)
                    .frame(width: 24, height: 24)
                    .foregroundStyle(TBColor.iconMuted)
                }
                .buttonStyle(TBTokenButtonStyle())
                .accessibilityLabel(isExpanded ? "전체 영업시간 접기" : "전체 영업시간 펼치기")
            }
        }
        .tasteBloomMotion(.content, value: isExpanded)
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

private extension Optional where Wrapped == String {
    var nilIfBlank: String? {
        guard let value = self?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty else {
            return nil
        }

        return value
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
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
                    .buttonStyle(TBTokenButtonStyle())
                }
            }

            SectionCard {
                VStack(spacing: 12) {
                    ForEach(Array(visibleDishes.enumerated()), id: \.element.id) { index, dish in
                        RestaurantMemorableDishRow(dish: dish) {
                            onSelectDish(dish, index)
                        }
                        .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))

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
                        .buttonStyle(TBTokenButtonStyle())
                        .accessibilityLabel(isExpanded ? "메뉴 접기" : "전체 메뉴 보기")
                    }
                }
            }
        }
        .tasteBloomMotion(.content, value: isExpanded)
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
            } else if let url = row.url, !row.isPlaceholder {
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
                rowIcon,
                size: TBIcon.Size.medium,
                strokeWidth: TBIcon.Stroke.regular
            )
            .frame(width: 22)
            .foregroundStyle(TBColor.iconPrimary)

            Text(displayValue)
                .font(TBFont.regular(13))
                .foregroundStyle(row.isPlaceholder ? TBColor.textDisabled : TBColor.textPrimary)
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

    private var rowIcon: LucideIconName {
        row.id == .address ? .mapPin : LucideIconName(systemName: row.id.symbol)
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
            ("메뉴에 기록된 감각", menu.expectedTasteFlow),
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

                TBPageSection(title: "메뉴 정보와 비교 상태", titleSize: .medium) {
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

                TBPageSection(title: "메뉴에 기록된 감각", titleSize: .medium) {
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

                            Text("메뉴 정보에 포함된 표현이에요. 나의 감각 경험이나 호감으로 해석하지 않아요.")
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
            .tbPageContentPadding()
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

struct RestaurantMenuSuggestionNativeSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var menuName = ""
    @State private var menuNote = ""
    @State private var isSubmitted = false

    let restaurantName: String
    var onDismissRequest: (() -> Void)? = nil
    var usesNativeSheetChrome = true

    private var canSubmit: Bool {
        !menuName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(
                BottomSheetCloseButton {
                    closeSheet()
                }
            ),
            headerCenter: AnyView(
                Text(isSubmitted ? "메뉴 제안 완료" : "메뉴 추가")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(footer),
            usesNativeSheetChrome: usesNativeSheetChrome
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if isSubmitted {
                        submittedContent
                    } else {
                        formContent
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

    private var formContent: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("\(restaurantName)의 메뉴 정보를 알고 계시면 알려주세요.")
                .font(TBFont.regular(13))
                .foregroundStyle(TBColor.textMuted)
                .lineSpacing(4)

            SectionCard {
                VStack(alignment: .leading, spacing: 12) {
                    Text("메뉴명")
                        .font(TBFont.semibold(11))
                        .foregroundStyle(TBColor.textTertiary)

                    TextField("예: 평양냉면, 들기름 막국수", text: $menuName)
                        .font(TBFont.regular(14))
                        .foregroundStyle(TBColor.textPrimary)
                        .textInputAutocapitalization(.never)

                    Rectangle()
                        .fill(TBColor.borderSubtle)
                        .frame(height: 1)

                    Text("알고 있는 설명")
                        .font(TBFont.semibold(11))
                        .foregroundStyle(TBColor.textTertiary)

                    TextEditor(text: $menuNote)
                        .font(TBFont.regular(14))
                        .foregroundStyle(TBColor.textPrimary)
                        .frame(minHeight: 88)
                        .scrollContentBackground(.hidden)
                        .background(TBColor.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }

            HStack(spacing: 8) {
                LucideIcon(
                    .circlePlus,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .foregroundStyle(TasteAxis.umami.mainColor)

                Text("확인 가능한 메뉴 정보를 제공하면 최대 2점을 받을 수 있어요.")
                    .font(TBFont.medium(12))
                    .foregroundStyle(TBColor.textMuted)
            }
        }
    }

    private var submittedContent: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                NeutralChip(title: "최대 2점", size: .extraSmall)

                Text("메뉴 제안이 접수됐어요.")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)

                Text("제공한 메뉴 정보는 확인 후 Taste Buddy 상세 화면과 메뉴별 미각 해석을 준비하는 데 반영됩니다.")
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textMuted)
                    .lineSpacing(4)
            }
        }
    }

    private var footer: some View {
        Group {
            if isSubmitted {
                PrimaryButton(title: "완료") {
                    closeSheet()
                }
            } else {
                PrimaryButton(title: "메뉴 제안하기", isEnabled: canSubmit) {
                    isSubmitted = true
                }
            }
        }
    }

    private func closeSheet() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

struct RestaurantInfoSuggestionNativeSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var step: Step = .select
    @State private var selectedRowIDs: Set<RestaurantInfoRowID> = []
    @State private var suggestedValues: [RestaurantInfoRowID: String] = [:]

    let restaurantName: String
    let infoRows: [RestaurantInfoRowModel]
    var onDismissRequest: (() -> Void)? = nil
    var usesNativeSheetChrome = true

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
            usesNativeSheetChrome: usesNativeSheetChrome
        ) {
            BottomSheetScrollView {
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
                    closeSheet()
                }
            }
        }
    }

    private var footer: some View {
        Group {
            switch step {
            case .done:
                PrimaryButton(title: "완료") {
                    closeSheet()
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
                    TBSelectableChip(
                        title: row.id.suggestionLabel,
                        isSelected: selectedRowIDs.contains(row.id),
                        variant: .correction
                    ) {
                        toggle(row)
                    }
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

    private func closeSheet() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
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
