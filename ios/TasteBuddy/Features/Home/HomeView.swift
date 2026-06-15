import SwiftUI

enum HomeRecommendationContentState: Equatable {
    case populated
    case loading
    case fallbackBuddy
    case empty
    case failed(String)
}

struct HomeView: View {
    @EnvironmentObject private var appModel: AppModel
    let recommendationContentState: HomeRecommendationContentState
    let showsSearchTrigger: Bool
    var onOpenSearch: (() -> Void)? = nil
    var onOpenRoute: ((AppRoute) -> Void)? = nil
    var onOpenBookmarkSheet: ((RestaurantSummary) -> Void)? = nil

    @State private var recommendationMode: RecommendationMode = .buddy
    @State private var isRecommendationEditorOpen = false
    @State private var showsSearch = false

    init(
        recommendationContentState: HomeRecommendationContentState = .populated,
        showsSearchTrigger: Bool = true,
        onOpenSearch: (() -> Void)? = nil,
        onOpenRoute: ((AppRoute) -> Void)? = nil,
        onOpenBookmarkSheet: ((RestaurantSummary) -> Void)? = nil
    ) {
        self.recommendationContentState = recommendationContentState
        self.showsSearchTrigger = showsSearchTrigger
        self.onOpenSearch = onOpenSearch
        self.onOpenRoute = onOpenRoute
        self.onOpenBookmarkSheet = onOpenBookmarkSheet
    }

    var body: some View {
        NavigationStack {
            ZStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: TBSpacing.section) {
                        if showsSearchTrigger {
                            HomeSearchCard {
                                if let onOpenSearch {
                                    onOpenSearch()
                                } else {
                                    showsSearch = true
                                }
                            }
                        }

                        if appModel.profile != nil {
                            HomeRecommendationSection(
                                isEditorOpen: $isRecommendationEditorOpen,
                                mode: $recommendationMode,
                                contentState: recommendationContentState,
                                viewerProfile: appModel.profile ?? .sample,
                                onOpenRoute: onOpenRoute
                            )

                            TBPageSection(title: "팔로잉 디시 카드", titleSize: .medium) {
                                VStack(spacing: 12) {
                                    switch recommendationContentState {
                                    case .loading:
                                        ForEach(0..<2, id: \.self) { _ in
                                            FollowingDishFeedbackSkeletonCard()
                                        }
                                    case .empty:
                                        EmptyState(
                                            title: "아직 팔로잉 디시 카드가 없어요",
                                            description: "버디를 팔로우하거나 다이닝 피드백을 남기면 같은 구조의 디시 카드가 이곳에 쌓입니다.",
                                            icon: .messageCircle
                                        )
                                    case .failed(let message):
                                        EmptyState(
                                            title: "디시 카드를 불러오지 못했어요",
                                            description: message,
                                            actionLabel: "다시 시도",
                                            icon: .sparkles
                                        )
                                    case .populated, .fallbackBuddy:
                                        ForEach(TasteBuddyNativeContent.followingDishFeedbackItems) { item in
                                            let displayItem = appModel
                                                .dishFeedbackItemWithCurrentComments(item)
                                            NativeDishFeedbackCard(
                                                item: displayItem,
                                                absoluteDateLabel: "2026년 6월 5일",
                                                relativeDateLabel: "오늘",
                                                showsOptions: false,
                                                onDetailTap: {
                                                    onOpenRoute?(.comments(id: item.id))
                                                },
                                                onCommentsTap: {
                                                    onOpenRoute?(.comments(id: item.id))
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.top, showsSearchTrigger ? TBSpacing.page : 0)
                    .padding(.bottom, TBSpacing.page)
                }

                if showsSearch {
                    HomeSearchSheet(
                        onCloseRequest: { showsSearch = false },
                        onOpenRoute: { route in
                            showsSearch = false
                            onOpenRoute?(route)
                        },
                        onOpenBookmarkSheet: onOpenBookmarkSheet
                    )
                    .transition(.opacity)
                    .zIndex(1)
                }
            }
            .animation(.easeInOut(duration: 0.18), value: showsSearch)
            .navigationTitle("홈")
            .tbInlineNavigationTitle()
            .tbPageBackground()
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}

struct HomeSearchCard: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                HStack {
                    Text("레스토랑, 메뉴, 셰프, 버디 검색")
                        .font(TBFont.medium(13))
                        .foregroundStyle(TBColor.textHint)
                        .lineLimit(1)
                    Spacer()
                }
                .frame(height: 44)
                .padding(.horizontal, 16)
                .background(TBColor.mutedSurface)
                .clipShape(Capsule())
                .overlay {
                    Capsule().stroke(TBColor.border)
                }

                LucideIcon(
                    .search,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .frame(width: 44, height: 44)
                    .foregroundStyle(TBColor.textSecondary)
                    .background(TBColor.mutedSurface)
                    .clipShape(Circle())
                    .overlay {
                        Circle().stroke(TBColor.border)
                    }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("레스토랑, 메뉴, 셰프, 버디 검색")
    }
}

struct HomeSearchSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @State private var query: String
    @State private var recentSearches: [String]
    @State private var recordedResultIDs: Set<String> = []
    @State private var bookmarkTarget: RestaurantSummary?
    @State private var kakaoResults: [HomeSearchResultItem] = []
    @State private var friendResults: [HomeSearchResultItem] = []
    @State private var kakaoPhase: HomeSearchAsyncPhase = .idle
    @State private var friendPhase: HomeSearchAsyncPhase = .idle
    private let repository: any HomeSearchRepository
    private let onCloseRequest: (() -> Void)?
    var onOpenRoute: ((AppRoute) -> Void)? = nil
    var onOpenBookmarkSheet: ((RestaurantSummary) -> Void)? = nil

    init(
        initialQuery: String = "",
        repository: any HomeSearchRepository = LiveHomeSearchRepository(),
        onCloseRequest: (() -> Void)? = nil,
        onOpenRoute: ((AppRoute) -> Void)? = nil,
        onOpenBookmarkSheet: ((RestaurantSummary) -> Void)? = nil
    ) {
        _query = State(initialValue: initialQuery)
        _recentSearches = State(initialValue: HomeSearchEngine.loadRecentSearches())
        self.repository = repository
        self.onCloseRequest = onCloseRequest
        self.onOpenRoute = onOpenRoute
        self.onOpenBookmarkSheet = onOpenBookmarkSheet
    }

    var body: some View {
        SearchOverlayShell(
            placeholder: "레스토랑, 메뉴, 셰프, 버디 검색",
            query: $query,
            onSubmit: submitSearch,
            onClose: closeSearch
        ) {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                if trimmedQuery.isEmpty {
                    searchSuggestions
                } else if filteredSections.isEmpty {
                    if hasRemotePhaseMessage {
                        remoteStatusRows
                    } else {
                        EmptyState(
                            title: "아직 맞는 결과를 찾지 못했어요",
                            description: "레스토랑 이름, 셰프 이름, 코스명, 버디 이름이나 버디네임으로 다시 시도해보세요. 추천 탐색 키워드로 시작해도 좋아요.",
                            icon: .search
                        )
                    }
                } else {
                    HStack {
                        Text("총 \(resultCount)개 결과")
                            .font(TBFont.semibold(13))
                            .foregroundStyle(TBColor.textPrimary)
                        Spacer()
                        Text("레스토랑 · 버디 함께 정렬")
                            .font(TBFont.medium(11))
                            .foregroundStyle(TBColor.textHint)
                    }

                    ForEach(filteredSections) { section in
                        TBPageSection(title: section.title, subtitle: section.subtitle) {
                            VStack(spacing: 10) {
                                ForEach(section.items) { item in
                                    SearchResultRow(
                                        item: item,
                                        isRecorded: recordedResultIDs.contains(item.id),
                                        isBookmarked: item.bookmarkRestaurantID.map {
                                            appModel.isRestaurantSaved(id: $0)
                                        } ?? false,
                                        onSelectResult: openResult,
                                        onRecordResult: recordResult,
                                        onBookmarkResult: toggleBookmark
                                    )
                                }
                            }
                        }
                    }

                    remoteStatusRows
                }
            }
        }
        .sheet(item: $bookmarkTarget) { restaurant in
            RestaurantBookmarkNativeSheet(restaurant: restaurant)
        }
        .task(id: trimmedQuery) {
            await refreshRemoteSearch(for: trimmedQuery)
        }
    }

    private var trimmedQuery: String {
        query.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var filteredSections: [HomeSearchResultSection] {
        HomeSearchEngine.mergedSections(
            matching: query,
            localSections: localSections,
            kakaoResults: kakaoResults,
            friendResults: friendResults
        )
    }

    private var localSections: [HomeSearchResultSection] {
        HomeSearchEngine.sections(matching: query)
    }

    private var resultCount: Int {
        filteredSections.map(\.items.count).reduce(0, +)
    }

    private var visibleItems: [HomeSearchResultItem] {
        filteredSections.flatMap(\.items)
    }

    private var hasRemotePhaseMessage: Bool {
        friendPhase.message != nil
    }

    @ViewBuilder
    private var searchSuggestions: some View {
        VStack(alignment: .leading, spacing: SearchSuggestionMetrics.sectionStackGap) {
            if !recentSearches.isEmpty {
                SearchSuggestionSection {
                    HStack {
                        SearchSuggestionTitle("최근 검색")
                        Spacer()
                        Button("모두 지우기") {
                            recentSearches = []
                            HomeSearchEngine.saveRecentSearches([])
                        }
                        .font(TBFont.medium(11))
                        .foregroundStyle(TBColor.textFaint)
                    }
                } chips: {
                    ForEach(recentSearches, id: \.self) { term in
                        Button {
                            selectSuggestion(term)
                        } label: {
                            SearchSuggestionChip(label: term, tone: .recent)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            SearchSuggestionSection {
                VStack(alignment: .leading, spacing: SearchSuggestionMetrics.titleDescriptionGap) {
                    SearchSuggestionTitle("추천 탐색")
                    Text("레스토랑을 먼저, 셰프와 메뉴, 다이닝 친구까지 함께 찾을 수 있어요.")
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textSubtle)
                        .lineSpacing(3)
                }
            } chips: {
                ForEach(HomeSearchEngine.suggestedQueries) { suggestion in
                    Button {
                        selectSuggestion(suggestion.label)
                    } label: {
                        SearchSuggestionChip(label: suggestion.label)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func selectSuggestion(_ value: String) {
        query = value
        commitRecentSearch(value)
    }

    private func submitSearch() {
        guard !trimmedQuery.isEmpty else {
            return
        }

        if let firstResult = visibleItems.first {
            openResult(firstResult)
            return
        }

        commitRecentSearch(trimmedQuery)
    }

    private func openResult(_ item: HomeSearchResultItem) {
        commitRecentSearch(HomeSearchEngine.recentSearchValue(for: item, query: trimmedQuery))

        if let route = item.route {
            closeSearch()
            onOpenRoute?(route)
            return
        }

        if let externalURL = item.externalURL {
            closeSearch()
            openURL(externalURL)
        }
    }

    private func closeSearch() {
        if let onCloseRequest {
            onCloseRequest()
        } else {
            dismiss()
        }
    }

    private func recordResult(_ item: HomeSearchResultItem) {
        commitRecentSearch(HomeSearchEngine.recentSearchValue(for: item, query: trimmedQuery))
        if recordedResultIDs.contains(item.id) {
            recordedResultIDs.remove(item.id)
        } else {
            recordedResultIDs.insert(item.id)
        }
    }

    private func toggleBookmark(_ item: HomeSearchResultItem) {
        guard let restaurant = item.bookmarkRestaurant ?? item.restaurantID.map(RestaurantCatalog.restaurant) else {
            return
        }

        commitRecentSearch(HomeSearchEngine.recentSearchValue(for: item, query: trimmedQuery))
        if let onOpenBookmarkSheet {
            onOpenBookmarkSheet(restaurant)
        } else {
            bookmarkTarget = restaurant
        }
    }

    @MainActor
    private func refreshRemoteSearch(for rawQuery: String) async {
        let searchQuery = rawQuery.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !searchQuery.isEmpty else {
            resetRemoteSearch()
            return
        }

        let localSections = HomeSearchEngine.sections(matching: searchQuery)
        let shouldSearchKakao = HomeSearchEngine.shouldSearchKakao(
            query: searchQuery,
            localSections: localSections
        )
        let shouldSearchFriends = HomeSearchEngine.isSearchableProfileIdentityQuery(searchQuery)

        kakaoResults = []
        friendResults = []
        kakaoPhase = shouldSearchKakao ? .loading("외부 장소 검색 중") : .idle
        friendPhase = shouldSearchFriends ? .loading("버디 프로필 검색 중") : .idle

        guard shouldSearchKakao || shouldSearchFriends else {
            return
        }

        try? await Task.sleep(nanoseconds: 80_000_000)
        guard !Task.isCancelled else {
            return
        }

        if shouldSearchKakao {
            do {
                let results = try await repository.kakaoRestaurantResults(matching: searchQuery)
                guard !Task.isCancelled, searchQuery == trimmedQuery else {
                    return
                }

                kakaoResults = results
                kakaoPhase = .idle
            } catch {
                guard !Task.isCancelled, searchQuery == trimmedQuery else {
                    return
                }

                kakaoResults = []
                kakaoPhase = .failed("장소 검색을 다시 시도해 주세요")
            }
        }

        if shouldSearchFriends {
            do {
                let results = try await repository.friendResults(matching: searchQuery)
                guard !Task.isCancelled, searchQuery == trimmedQuery else {
                    return
                }

                friendResults = results
                friendPhase = .idle
            } catch {
                guard !Task.isCancelled, searchQuery == trimmedQuery else {
                    return
                }

                friendResults = []
                friendPhase = .failed("버디 검색을 다시 시도해 주세요")
            }
        }
    }

    private func resetRemoteSearch() {
        kakaoResults = []
        friendResults = []
        kakaoPhase = .idle
        friendPhase = .idle
    }

    @ViewBuilder
    private var remoteStatusRows: some View {
        if hasRemotePhaseMessage {
            VStack(spacing: 8) {
                phaseStatusRow(
                    phase: friendPhase,
                    icon: "person.2",
                    title: "버디 검색"
                )
            }
        }
    }

    @ViewBuilder
    private func phaseStatusRow(
        phase: HomeSearchAsyncPhase,
        icon: String,
        title: String
    ) -> some View {
        if let message = phase.message {
            StatusRow(
                icon: icon,
                title: title,
                detail: message,
                tone: phase.isLoading ? .neutral : .warning
            )
        }
    }

    private func commitRecentSearch(_ value: String) {
        let nextSearches = HomeSearchEngine.updatedRecentSearches(
            afterSelecting: value,
            current: recentSearches
        )
        recentSearches = nextSearches
        HomeSearchEngine.saveRecentSearches(nextSearches)
    }
}

private struct SearchResultMedia: View {
    let item: HomeSearchResultItem
    var size: TokenBoxSize? = .medium

    var body: some View {
        switch item.kind {
        case .chef:
            ChefAvatar(
                alt: item.title,
                size: size,
                taste: item.axis,
                variant: .taste
            )
        case .friend:
            PalateBloomAvatar(
                size: size?.sideLength ?? CompactCardMetrics.mediaSize,
                seed: item.id
            )
        case .menu:
            ImageBox(
                alt: item.title,
                kind: .menu,
                size: size,
                taste: item.axis,
                variant: .taste
            )
        case .restaurant:
            ImageBox(
                alt: item.title,
                kind: .restaurant,
                size: size,
                taste: item.axis,
                variant: .taste
            )
        }
    }
}

private struct SearchResultRow: View {
    let item: HomeSearchResultItem
    let isRecorded: Bool
    let isBookmarked: Bool
    let onSelectResult: (HomeSearchResultItem) -> Void
    let onRecordResult: (HomeSearchResultItem) -> Void
    let onBookmarkResult: (HomeSearchResultItem) -> Void

    var body: some View {
        CompactCard(
            heading: item.title,
            metadata: item.subtitle,
            isSelected: false,
            action: { onSelectResult(item) }
        ) {
            SearchResultMedia(item: item)
        } actions: {
            HStack(spacing: CompactCardMetrics.actionGap) {
                if item.supportsDiningRecordAction {
                    CompactCardIconActionButton(
                        symbol: isRecorded ? .circleCheck : .circlePlus,
                        isActive: isRecorded,
                        accessibilityLabel: isRecorded ? "내 기록에 추가됨" : "내 기록에 추가",
                        action: { onRecordResult(item) }
                    )
                }

                if item.supportsBookmarkAction {
                    CompactCardIconActionButton(
                        symbol: .bookmark,
                        isActive: isBookmarked,
                        filled: isBookmarked,
                        accessibilityLabel: isBookmarked
                            ? "나중에 갈 레스토랑에서 제거"
                            : "나중에 갈 레스토랑에 추가",
                        action: { onBookmarkResult(item) }
                    )
                }
            }
        }
        .accessibilityHint(item.detail)
    }
}

enum SearchSuggestionMetrics {
    static let sectionStackGap: CGFloat = TBSpacing.section
    static let cardStackGap: CGFloat = TBSpacing.card
    static let titleDescriptionGap: CGFloat = TBSpacing.x4
    static let chipGap: CGFloat = TBSpacing.x8
}

enum SearchSuggestionChipTone {
    case recommended
    case recent

    var symbol: String {
        switch self {
        case .recommended: "sparkles"
        case .recent: "clock"
        }
    }

    var background: Color {
        switch self {
        case .recommended: TBColor.mutedSurface
        case .recent: TBColor.surface
        }
    }

    var foreground: Color {
        switch self {
        case .recommended: TBColor.textBody
        case .recent: TBColor.textPrimary
        }
    }
}

private struct SearchSuggestionSection<Header: View, Chips: View>: View {
    private let header: Header
    private let chips: Chips

    init(
        @ViewBuilder header: () -> Header,
        @ViewBuilder chips: () -> Chips
    ) {
        self.header = header()
        self.chips = chips()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: SearchSuggestionMetrics.cardStackGap) {
            header
            SearchSuggestionWrap {
                chips
            }
        }
    }
}

private struct SearchSuggestionTitle: View {
    let title: String

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title)
            .font(TBFont.semibold(13))
            .foregroundStyle(TBColor.textPrimary)
    }
}

private struct SearchSuggestionChip: View {
    let label: String
    var tone: SearchSuggestionChipTone = .recommended

    var body: some View {
        HStack(spacing: ChipSize.medium.gap) {
            LucideIcon(
                systemName: tone.symbol,
                size: ChipSize.medium.iconSize,
                strokeWidth: TBIcon.Stroke.regular
            )

            Text(label)
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
        }
        .font(ChipSize.medium.font)
        .foregroundStyle(tone.foreground)
        .padding(.horizontal, ChipSize.medium.horizontalPadding)
        .padding(.vertical, ChipSize.medium.verticalPadding)
        .background(tone.background)
        .clipShape(Capsule())
        .overlay {
            Capsule().stroke(TBColor.border, lineWidth: 1)
        }
        .fixedSize(horizontal: true, vertical: false)
        .accessibilityElement(children: .combine)
    }
}

private struct SearchSuggestionWrap<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        SearchSuggestionFlexLayout(spacing: SearchSuggestionMetrics.chipGap) {
            content
        }
    }
}

private struct SearchSuggestionFlexLayout: Layout {
    let spacing: CGFloat

    func sizeThatFits(
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) -> CGSize {
        let availableWidth = proposal.width ?? .greatestFiniteMagnitude
        let result = layoutRows(in: availableWidth, subviews: subviews)

        return CGSize(
            width: proposal.width ?? result.width,
            height: result.height
        )
    }

    func placeSubviews(
        in bounds: CGRect,
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            let shouldWrap = x > bounds.minX
                && x + size.width > bounds.maxX

            if shouldWrap {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }

            subview.place(
                at: CGPoint(x: x, y: y),
                proposal: ProposedViewSize(size)
            )
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }

    private func layoutRows(in availableWidth: CGFloat, subviews: Subviews) -> CGSize {
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxRowWidth: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            let shouldWrap = x > 0 && x + size.width > availableWidth

            if shouldWrap {
                maxRowWidth = max(maxRowWidth, x - spacing)
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }

            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }

        if x > 0 {
            maxRowWidth = max(maxRowWidth, x - spacing)
        }

        return CGSize(width: maxRowWidth, height: y + rowHeight)
    }
}

enum RecommendationMode: String, CaseIterable, Identifiable {
    case buddy
    case restaurant
    case chef

    var id: String { rawValue }

    var label: String {
        switch self {
        case .buddy: "버디 추천"
        case .restaurant: "레스토랑 추천"
        case .chef: "셰프 추천"
        }
    }
}

enum TasteMatchRecommendationCardMetrics {
    static let width: CGFloat = 132
    static let height: CGFloat = 132
    static let radius: CGFloat = TBRadius.card
    static let padding: CGFloat = 12
    static let contentWidth: CGFloat = width - padding * 2
    static let contentHeight: CGFloat = height - padding * 2
    static let gap: CGFloat = 12
    static let avatarSize: CGFloat = 42
    static let imageBoxSize = TokenBoxSize.large
    static let imageFallbackIconSize = TBIcon.Size.extraLarge
    static let borderOpacity = 0.18
}

struct HomeRecommendationCandidate: Identifiable, Equatable {
    let item: TasteMatchFeedItem
    let sourceAxis: TasteAxis
    let axisScore: Double

    var id: String {
        "\(sourceAxis.rawValue):\(item.id)"
    }
}

enum HomeRecommendationEngine {
    private struct RankedAxis {
        let axis: TasteAxis
        let value: Double
    }

    private static let tagTasteHints: [String: [TasteAxis: Double]] = [
        "crisp": [.sour: 0.58, .bitter: 0.16],
        "deep": [.umami: 0.62, .fat: 0.28],
        "delicate": [.sour: 0.22, .bitter: 0.16, .fat: 0.20],
        "dessert": [.sweet: 0.58, .fat: 0.22],
        "fermented": [.umami: 0.52, .sour: 0.24],
        "fresh": [.sour: 0.50, .bitter: 0.18],
        "gentle": [.sweet: 0.20, .fat: 0.10, .salty: 0.10],
        "grilled": [.bitter: 0.22, .umami: 0.46, .fat: 0.20],
        "rich": [.fat: 0.58, .umami: 0.22],
        "savory": [.umami: 0.60, .salty: 0.20],
        "seafood": [.umami: 0.48, .salty: 0.22, .sour: 0.14],
        "smoky": [.bitter: 0.28, .umami: 0.36],
        "spicy": [.bitter: 0.18, .sour: 0.20],
        "sweet": [.sweet: 0.62],
        "단맛": [.sweet: 0.62],
        "신맛": [.sour: 0.58],
        "산미": [.sour: 0.58],
        "쓴맛": [.bitter: 0.58],
        "짠맛": [.salty: 0.58],
        "감칠맛": [.umami: 0.62],
        "지방맛": [.fat: 0.58],
    ]

    static func recommendations(
        items: [TasteMatchFeedItem],
        viewerProfile: TasteProfile?,
        mode: RecommendationMode
    ) -> [HomeRecommendationCandidate] {
        let visibleItems = Array(items.prefix(12))
        let entityKey: (TasteMatchFeedItem) -> String = {
            switch mode {
            case .buddy:
                $0.reviewerID
            case .restaurant:
                $0.restaurantID
            case .chef:
                chefName(for: $0.restaurantName)
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                    .lowercased()
            }
        }

        guard let viewerProfile else {
            return bestUniqueRecommendations(items: visibleItems, entityKey: entityKey)
        }

        let rankedAxes = TasteAxis.allCases
            .map { axis in
                RankedAxis(axis: axis, value: viewerAxisValue(viewerProfile, axis: axis))
            }
            .sorted { $0.value > $1.value }
        var selectedItems: [HomeRecommendationCandidate] = []
        var consumedEntityKeys = Set<String>()

        for rankedAxis in rankedAxes {
            let allCandidates = visibleItems
                .map {
                    makeCandidate(
                        item: $0,
                        sourceAxis: rankedAxis.axis,
                        axisValue: rankedAxis.value
                    )
                }
            let matchedCandidates = allCandidates
                .filter { itemAxisPresence($0.item, axis: rankedAxis.axis) >= 0.12 }
            let candidates = (matchedCandidates.isEmpty ? allCandidates : matchedCandidates)
                .sorted {
                    if $0.axisScore != $1.axisScore {
                        return $0.axisScore > $1.axisScore
                    }
                    return $0.item.matchRate > $1.item.matchRate
                }

            guard let selected = candidates.first(where: {
                !consumedEntityKeys.contains(entityKey($0.item))
            }) else {
                continue
            }

            consumedEntityKeys.insert(entityKey(selected.item))
            selectedItems.append(selected)
        }

        let remainingItems = bestUniqueRecommendations(
            items: visibleItems,
            entityKey: entityKey
        )
        .filter { !consumedEntityKeys.contains(entityKey($0.item)) }

        return selectedItems + remainingItems
    }

    static func primaryAxis(for item: TasteMatchFeedItem) -> TasteAxis {
        if let sharedAxis = item.sharedSignals.first?.axis {
            return sharedAxis
        }

        return TasteAxis.allCases.max {
            itemAxisPresence(item, axis: $0) < itemAxisPresence(item, axis: $1)
        } ?? .umami
    }

    static func primaryAxis(scores: [String: Int]) -> TasteAxis {
        TasteAxis.allCases.max {
            normalizedScore(scores[$0.rawValue]) < normalizedScore(scores[$1.rawValue])
        } ?? .umami
    }

    static func profileMatchScore(
        reviewerTasteScores: [String: Int],
        viewerProfile: TasteProfile?
    ) -> Int {
        guard let viewerProfile else {
            return 80
        }

        let sharedFit = TasteAxis.allCases.reduce(0.0) { total, axis in
            let viewerValue = normalizedScore(viewerProfile.score(for: axis))
            let profileValue = normalizedScore(reviewerTasteScores[axis.rawValue])
            return total + (1 - abs(viewerValue - profileValue))
        } / Double(TasteAxis.allCases.count)

        return Int((clamp(sharedFit, minimum: 0.5, maximum: 0.95) * 100).rounded())
    }

    static func chefName(for restaurantName: String) -> String {
        let normalizedRestaurantName = restaurantName.replacingOccurrences(
            of: #"\s|\(|\)|Lysée|Lysee"#,
            with: "",
            options: .regularExpression
        )
        let chefNameByRestaurant = [
            "밍글스": "강민구",
            "숍리제": "이은지",
            "정식당": "임정식",
        ]

        return chefNameByRestaurant[normalizedRestaurantName] ?? "\(restaurantName) 셰프"
    }

    private static func bestUniqueRecommendations(
        items: [TasteMatchFeedItem],
        entityKey: (TasteMatchFeedItem) -> String
    ) -> [HomeRecommendationCandidate] {
        var bestByEntity: [String: TasteMatchFeedItem] = [:]

        for item in items {
            let key = entityKey(item)
            if let existing = bestByEntity[key], existing.matchRate >= item.matchRate {
                continue
            }
            bestByEntity[key] = item
        }

        return bestByEntity.values
            .sorted { $0.matchRate > $1.matchRate }
            .map {
                makeCandidate(
                    item: $0,
                    sourceAxis: primaryAxis(for: $0)
                )
            }
    }

    private static func makeCandidate(
        item: TasteMatchFeedItem,
        sourceAxis: TasteAxis,
        axisValue: Double = 0.5
    ) -> HomeRecommendationCandidate {
        let axisPresence = itemAxisPresence(item, axis: sourceAxis)
        let matchScore = clamp(Double(item.matchRate) / 100)
        let learnedConfidence = clamp(item.learnedConfidenceScore)
        let axisScore = clamp(
            matchScore * 0.68
                + axisPresence * 0.18
                + axisValue * 0.07
                + learnedConfidence * 0.07
        )

        return HomeRecommendationCandidate(
            item: item,
            sourceAxis: sourceAxis,
            axisScore: axisScore
        )
    }

    private static func viewerAxisValue(
        _ profile: TasteProfile,
        axis: TasteAxis
    ) -> Double {
        let preference = normalizedScore(profile.score(for: axis))
        let taste = normalizedScore(profile.score(for: axis))
        let confidence: Double = switch profile.confidence {
        case "Refined":
            0.90
        case "Building":
            0.75
        default:
            0.55
        }

        return clamp(preference * 0.55 + taste * 0.30 + confidence * 0.15)
    }

    private static func itemAxisPresence(
        _ item: TasteMatchFeedItem,
        axis: TasteAxis
    ) -> Double {
        let tags = item.tasteTags + item.experienceTags
        let tagPresence = clamp(
            tags.reduce(0.0) {
                $0 + max(0, tagTasteHints[$1]?[axis] ?? 0)
            } / 1.1
        )
        let sharedPresence: Double
        if let sharedSignal = item.sharedSignals.first(where: { $0.axis == axis }) {
            sharedPresence = clamp(0.55 + sharedSignal.confidence * 0.45)
        } else {
            sharedPresence = 0
        }
        let reviewerPresence = normalizedScore(item.reviewerTasteScores[axis.rawValue])

        return clamp(
            tagPresence * 0.48
                + sharedPresence * 0.32
                + reviewerPresence * 0.20
        )
    }

    private static func normalizedScore(_ score: Int?) -> Double {
        clamp(Double(score ?? 50) / 100)
    }

    private static func clamp(
        _ value: Double,
        minimum: Double = 0,
        maximum: Double = 1
    ) -> Double {
        min(maximum, max(minimum, value))
    }
}

private struct HomeRecommendationSection: View {
    @Binding var isEditorOpen: Bool
    @Binding var mode: RecommendationMode
    let contentState: HomeRecommendationContentState
    let viewerProfile: TasteProfile
    var onOpenRoute: ((AppRoute) -> Void)? = nil

    private var recommendationItems: [HomeRecommendationCandidate] {
        HomeRecommendationEngine.recommendations(
            items: TasteBuddyNativeContent.tasteMatchFeed,
            viewerProfile: viewerProfile,
            mode: mode
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(mode.label)
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)

                Spacer()

                Button {
                    isEditorOpen.toggle()
                } label: {
                    Text("편집")
                        .font(TBFont.semibold(11))
                        .foregroundStyle((TasteBuddyNativeContent.tasteMatchFeed.first?.axis ?? .umami).mainColor)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                }
                .buttonStyle(.plain)
            }

            if isEditorOpen {
                HStack(spacing: 8) {
                    ForEach(RecommendationMode.allCases) { option in
                        Button {
                            mode = option
                            isEditorOpen = false
                        } label: {
                            Text(option.label)
                                .font(TBFont.semibold(12))
                                .foregroundStyle(option == mode ? Color.white : TBColor.textHint)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .background(option == mode ? TBColor.textPrimary : TBColor.surface)
                                .clipShape(Capsule())
                                .overlay {
                                    Capsule().stroke(option == mode ? TBColor.textPrimary : TBColor.border)
                                }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            CardScrollList {
                Group {
                    switch contentState {
                    case .loading:
                        ForEach(0..<3, id: \.self) { _ in
                            RecommendationSkeletonCard()
                        }
                    case .empty:
                        RecommendationEmptyMiniCard(
                            mode: mode,
                            message: "아직 추천 피드가 준비되지 않았어요."
                        )
                    case .failed(let message):
                        RecommendationEmptyMiniCard(mode: mode, message: message)
                    case .fallbackBuddy where mode == .buddy:
                        ForEach(FallbackBuddyRecommendation.samples) { buddy in
                            GhostBuddyRecommendationCard(
                                buddy: buddy,
                                viewerProfile: viewerProfile,
                                onTap: {
                                    onOpenRoute?(.publicProfile(id: buddy.profileID))
                                }
                            )
                        }
                    case .fallbackBuddy:
                        RecommendationEmptyMiniCard(mode: mode)
                    case .populated:
                        ForEach(recommendationItems) { recommendation in
                            switch mode {
                            case .buddy:
                                BuddyRecommendationCard(
                                    recommendation: recommendation,
                                    onOpenProfile: {
                                        onOpenRoute?(
                                            .publicProfile(id: recommendation.item.reviewerID)
                                        )
                                    }
                                )
                            case .restaurant:
                                RestaurantRecommendationCard(recommendation: recommendation)
                            case .chef:
                                ChefRecommendationCard(recommendation: recommendation)
                            }
                        }
                    }
                }
            }
        }
    }
}

private struct FallbackBuddyRecommendation: Identifiable {
    let id: String
    let profileID: String
    let name: String
    let handle: String
    let reviewerTasteScores: [String: Int]

    static let samples = [
        FallbackBuddyRecommendation(
            id: "fallback-mina",
            profileID: "mina",
            name: "김민아",
            handle: "@맑은끝민아",
            reviewerTasteScores: [
                "sweet": 52, "sour": 70, "bitter": 42,
                "salty": 48, "umami": 86, "fat": 44,
            ]
        ),
        FallbackBuddyRecommendation(
            id: "fallback-jae",
            profileID: "jae",
            name: "정서윤",
            handle: "@산미탐험서윤",
            reviewerTasteScores: [
                "sweet": 66, "sour": 88, "bitter": 46,
                "salty": 42, "umami": 58, "fat": 38,
            ]
        ),
        FallbackBuddyRecommendation(
            id: "fallback-hyeon",
            profileID: "hyeon",
            name: "최도윤",
            handle: "@불향도윤",
            reviewerTasteScores: [
                "sweet": 38, "sour": 44, "bitter": 84,
                "salty": 54, "umami": 72, "fat": 76,
            ]
        )
    ]
}

private struct BuddyRecommendationCard: View {
    let recommendation: HomeRecommendationCandidate
    var onOpenProfile: (() -> Void)? = nil

    @ViewBuilder
    var body: some View {
        if let onOpenProfile {
            Button(action: onOpenProfile) {
                cardContent
            }
            .buttonStyle(.plain)
        } else {
            cardContent
        }
    }

    private var cardContent: some View {
        VStack(alignment: .leading, spacing: TasteMatchRecommendationCardMetrics.gap) {
            PalateBloomAvatar(
                size: TasteMatchRecommendationCardMetrics.avatarSize,
                seed: "\(item.reviewerID)|native"
            )

            RecommendationCardTextLayout(
                title: item.reviewerName,
                subtitle: item.reviewerHandle,
                fitLabel: "취향 적합도 \(item.matchRate)%",
                axis: sourceAxis
            )
        }
        .frame(
            width: TasteMatchRecommendationCardMetrics.contentWidth,
            height: TasteMatchRecommendationCardMetrics.contentHeight,
            alignment: .topLeading
        )
        .padding(TasteMatchRecommendationCardMetrics.padding)
        .background(sourceAxis.tintColor)
        .clipShape(
            RoundedRectangle(
                cornerRadius: TasteMatchRecommendationCardMetrics.radius,
                style: .continuous
            )
        )
        .overlay {
            RoundedRectangle(
                cornerRadius: TasteMatchRecommendationCardMetrics.radius,
                style: .continuous
            )
            .stroke(sourceAxis.mainColor.opacity(TasteMatchRecommendationCardMetrics.borderOpacity))
        }
        .accessibilityLabel(
            "\(item.reviewerName), \(item.reviewerHandle), 취향 적합도 \(item.matchRate)%"
        )
    }

    private var item: TasteMatchFeedItem {
        recommendation.item
    }

    private var sourceAxis: TasteAxis {
        recommendation.sourceAxis
    }
}

private struct RestaurantRecommendationCard: View {
    let recommendation: HomeRecommendationCandidate

    var body: some View {
        VStack(alignment: .leading, spacing: TasteMatchRecommendationCardMetrics.gap) {
            ImageBox(
                alt: "\(item.restaurantName) 레스토랑",
                kind: .restaurant,
                fallbackIconSize: TasteMatchRecommendationCardMetrics.imageFallbackIconSize,
                fallbackIconColor: sourceAxis.tintTextColor,
                size: TasteMatchRecommendationCardMetrics.imageBoxSize,
                taste: sourceAxis,
                variant: .taste
            )

            RecommendationCardTextLayout(
                title: item.restaurantName,
                subtitle: dishLabel,
                fitLabel: "적합도 \(item.matchRate)%",
                axis: sourceAxis
            )
        }
        .frame(
            width: TasteMatchRecommendationCardMetrics.contentWidth,
            height: TasteMatchRecommendationCardMetrics.contentHeight,
            alignment: .topLeading
        )
        .padding(TasteMatchRecommendationCardMetrics.padding)
        .background(sourceAxis.tintColor)
        .clipShape(
            RoundedRectangle(
                cornerRadius: TasteMatchRecommendationCardMetrics.radius,
                style: .continuous
            )
        )
        .overlay {
            RoundedRectangle(
                cornerRadius: TasteMatchRecommendationCardMetrics.radius,
                style: .continuous
            )
            .stroke(sourceAxis.mainColor.opacity(TasteMatchRecommendationCardMetrics.borderOpacity))
        }
        .accessibilityLabel(
            "\(item.restaurantName), \(dishLabel), 적합도 \(item.matchRate)%"
        )
    }

    private var item: TasteMatchFeedItem {
        recommendation.item
    }

    private var sourceAxis: TasteAxis {
        recommendation.sourceAxis
    }

    private var dishLabel: String {
        item.dishTitle.isEmpty ? "추천 다이닝" : item.dishTitle
    }
}

private struct ChefRecommendationCard: View {
    let recommendation: HomeRecommendationCandidate

    var body: some View {
        VStack(alignment: .leading, spacing: TasteMatchRecommendationCardMetrics.gap) {
            ImageBox(
                alt: chefName,
                kind: .chef,
                fallbackIconSize: TasteMatchRecommendationCardMetrics.imageFallbackIconSize,
                fallbackIconColor: sourceAxis.tintTextColor,
                imageName: chefImageName,
                size: TasteMatchRecommendationCardMetrics.imageBoxSize,
                taste: sourceAxis,
                variant: .taste
            )

            RecommendationCardTextLayout(
                title: chefName,
                subtitle: item.restaurantName,
                fitLabel: "적합도 \(item.matchRate)%",
                axis: sourceAxis
            )
        }
        .frame(
            width: TasteMatchRecommendationCardMetrics.contentWidth,
            height: TasteMatchRecommendationCardMetrics.contentHeight,
            alignment: .topLeading
        )
        .padding(TasteMatchRecommendationCardMetrics.padding)
        .background(sourceAxis.tintColor)
        .clipShape(
            RoundedRectangle(
                cornerRadius: TasteMatchRecommendationCardMetrics.radius,
                style: .continuous
            )
        )
        .overlay {
            RoundedRectangle(
                cornerRadius: TasteMatchRecommendationCardMetrics.radius,
                style: .continuous
            )
            .stroke(sourceAxis.mainColor.opacity(TasteMatchRecommendationCardMetrics.borderOpacity))
        }
        .accessibilityLabel(
            "\(chefName), \(item.restaurantName), 적합도 \(item.matchRate)%"
        )
    }

    private var item: TasteMatchFeedItem {
        recommendation.item
    }

    private var sourceAxis: TasteAxis {
        recommendation.sourceAxis
    }

    private var chefName: String {
        HomeRecommendationEngine.chefName(for: item.restaurantName)
    }

    private var chefImageName: String? {
        ChefImageResolver.bundledImageName(for: chefName)
    }
}

private struct RecommendationCardTextLayout: View {
    let title: String
    let subtitle: String
    let fitLabel: String
    let axis: TasteAxis

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(TBFont.bold(14))
                    .foregroundStyle(axis.tintTextColor)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Text(subtitle)
                    .font(TBFont.regular(10))
                    .foregroundStyle(axis.tintSubTextColor)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Spacer(minLength: 0)

            Text(fitLabel)
                .font(TBFont.semibold(10))
                .foregroundStyle(axis.tintTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

private struct GhostBuddyRecommendationCard: View {
    let buddy: FallbackBuddyRecommendation
    let viewerProfile: TasteProfile
    var onTap: (() -> Void)? = nil

    @ViewBuilder
    var body: some View {
        if let onTap {
            Button(action: onTap) {
                cardContent
            }
            .buttonStyle(.plain)
        } else {
            cardContent
        }
    }

    private var cardContent: some View {
        VStack(alignment: .leading, spacing: TasteMatchRecommendationCardMetrics.gap) {
            PalateBloomAvatar(
                size: TasteMatchRecommendationCardMetrics.avatarSize,
                seed: buddy.id
            )

            RecommendationCardTextLayout(
                title: buddy.name,
                subtitle: buddy.handle,
                fitLabel: "취향 적합도 \(matchRate)%",
                axis: axis
            )
        }
        .frame(
            width: TasteMatchRecommendationCardMetrics.contentWidth,
            height: TasteMatchRecommendationCardMetrics.contentHeight,
            alignment: .topLeading
        )
        .padding(TasteMatchRecommendationCardMetrics.padding)
        .background(axis.tintColor)
        .clipShape(RoundedRectangle(cornerRadius: TasteMatchRecommendationCardMetrics.radius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TasteMatchRecommendationCardMetrics.radius, style: .continuous)
                .stroke(axis.mainColor.opacity(TasteMatchRecommendationCardMetrics.borderOpacity))
        }
        .accessibilityLabel("\(buddy.name), \(buddy.handle), 취향 적합도 \(matchRate)%")
    }

    private var axis: TasteAxis {
        HomeRecommendationEngine.primaryAxis(scores: buddy.reviewerTasteScores)
    }

    private var matchRate: Int {
        HomeRecommendationEngine.profileMatchScore(
            reviewerTasteScores: buddy.reviewerTasteScores,
            viewerProfile: viewerProfile
        )
    }
}

private struct RecommendationSkeletonCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: TasteMatchRecommendationCardMetrics.gap) {
            Circle()
                .fill(TBColor.disabledSurface)
                .frame(
                    width: TasteMatchRecommendationCardMetrics.avatarSize,
                    height: TasteMatchRecommendationCardMetrics.avatarSize
                )

            VStack(alignment: .leading, spacing: 6) {
                RoundedRectangle(cornerRadius: 5, style: .continuous)
                    .fill(TBColor.disabledSurface)
                    .frame(width: 74, height: 14)
                RoundedRectangle(cornerRadius: 5, style: .continuous)
                    .fill(TBColor.disabledSurface)
                    .frame(width: 58, height: 10)
            }

            Spacer(minLength: 0)

            RoundedRectangle(cornerRadius: 5, style: .continuous)
                .fill(TBColor.disabledSurface)
                .frame(width: 82, height: 10)
        }
        .frame(
            width: TasteMatchRecommendationCardMetrics.contentWidth,
            height: TasteMatchRecommendationCardMetrics.contentHeight,
            alignment: .topLeading
        )
        .padding(TasteMatchRecommendationCardMetrics.padding)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TasteMatchRecommendationCardMetrics.radius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TasteMatchRecommendationCardMetrics.radius, style: .continuous)
                .stroke(TBColor.border)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("추천 카드를 불러오는 중")
    }
}

private struct RecommendationEmptyMiniCard: View {
    let mode: RecommendationMode
    var message = "피드가 준비되면 같은 규칙으로 추천을 정렬합니다."

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            LucideIcon(
                .sparkles,
                size: TBIcon.Size.medium,
                strokeWidth: TBIcon.Stroke.regular
            )
                .frame(width: 38, height: 38)
                .foregroundStyle(TBColor.textSecondary)
                .background(TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            Text(mode.label)
                .font(TBFont.bold(13))
                .foregroundStyle(TBColor.textPrimary)

            Text(message)
                .font(TBFont.regular(11))
                .foregroundStyle(TBColor.textBody)
                .lineSpacing(2)
        }
        .frame(
            width: TasteMatchRecommendationCardMetrics.contentWidth,
            height: TasteMatchRecommendationCardMetrics.contentHeight,
            alignment: .topLeading
        )
        .padding(TasteMatchRecommendationCardMetrics.padding)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TasteMatchRecommendationCardMetrics.radius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TasteMatchRecommendationCardMetrics.radius, style: .continuous)
                .stroke(TBColor.border)
        }
    }
}

private struct HomeProfileContextCard: View {
    let profile: TasteProfile
    let diningCount: Int

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    PalateBloomAvatar(
                        size: 44,
                        tasteProfile: profile,
                        shapeSeed: "current-user"
                    )

                    VStack(alignment: .leading, spacing: 5) {
                        Text("나의 Taste Match 기준")
                            .font(TBFont.bold(15))
                        Text("\(profile.confidence) · \(diningCount)개의 경험 반영")
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textHint)
                    }

                    Spacer()
                    OutlineBadge(title: "Profile based")
                }

                Text(profile.summary)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textBody)
                    .lineSpacing(3)

                HStack(spacing: 8) {
                    ForEach(profile.topAxes) { axis in
                        TasteChip(axis: axis, value: "주요 축")
                    }
                }
            }
        }
    }
}

private struct FollowingDishFeedbackSkeletonCard: View {
    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Circle()
                        .fill(TBColor.disabledSurface)
                        .frame(width: 38, height: 38)
                    VStack(alignment: .leading, spacing: 6) {
                        RoundedRectangle(cornerRadius: 5, style: .continuous)
                            .fill(TBColor.disabledSurface)
                            .frame(width: 96, height: 12)
                        RoundedRectangle(cornerRadius: 5, style: .continuous)
                            .fill(TBColor.disabledSurface)
                            .frame(width: 72, height: 10)
                    }
                    Spacer()
                }

                RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                    .fill(TBColor.disabledSurface)
                    .frame(width: 144, height: 144)

                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(TBColor.disabledSurface)
                    .frame(height: 14)
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(TBColor.disabledSurface)
                    .frame(width: 220, height: 14)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("팔로잉 디시 카드를 불러오는 중")
    }
}

private struct TasteMatchFeedCard: View {
    let item: TasteMatchFeedItem

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 10) {
                    PalateBloomAvatar(size: 40, seed: item.reviewerHandle)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.reviewerName)
                            .font(TBFont.bold(13))
                        Text(item.reviewerHandle)
                            .font(TBFont.regular(11))
                            .foregroundStyle(TBColor.textHint)
                    }

                    Spacer()

                    Text("\(item.matchRate)%")
                        .font(TBFont.bold(14))
                        .foregroundStyle(item.axis.mainColor)
                }

                VStack(alignment: .leading, spacing: 5) {
                    Text(item.dishTitle)
                        .font(TBFont.bold(15))
                        .foregroundStyle(TBColor.textPrimary)
                    Text(item.restaurantName)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textHint)
                }

                Text(item.reason)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textBody)
                    .lineSpacing(3)

                TBFlowLayout(spacing: 8) {
                    ForEach(item.supportingSignals, id: \.self) { signal in
                        NeutralChip(title: signal)
                    }
                    ForEach(item.tasteTags, id: \.self) { tag in
                        NeutralChip(title: tag, symbol: "sparkles")
                    }
                }

                HStack {
                    HStack(spacing: 4) {
                        LucideIcon(
                            .messageCircle,
                            size: TBIcon.Size.small,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        Text("댓글 보기")
                    }
                    Spacer()
                    HStack(spacing: 4) {
                        Text("레스토랑 열기")
                        LucideIcon(
                            .chevronRight,
                            size: TBIcon.Size.small,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                    }
                }
                .font(TBFont.semibold(11))
                .foregroundStyle(TBColor.textHint)
            }
        }
    }

}
