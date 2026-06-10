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
    var onOpenRoute: ((AppRoute) -> Void)? = nil

    @State private var recommendationMode: RecommendationMode = .buddy
    @State private var isRecommendationEditorOpen = false
    @State private var showsSearch = false

    init(
        recommendationContentState: HomeRecommendationContentState = .populated,
        onOpenRoute: ((AppRoute) -> Void)? = nil
    ) {
        self.recommendationContentState = recommendationContentState
        self.onOpenRoute = onOpenRoute
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    HomeSearchCard {
                        showsSearch = true
                    }

                    if appModel.profile != nil {
                        HomeRecommendationSection(
                            isEditorOpen: $isRecommendationEditorOpen,
                            mode: $recommendationMode,
                            contentState: recommendationContentState
                        )

                        TBPageSection(title: "팔로잉 디시 카드") {
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
                                                onOpenRoute?(.dishFeedback(id: item.id))
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
                .padding(TBSpacing.page)
            }
            .navigationTitle("홈")
            .tbInlineNavigationTitle()
            .tbPageBackground()
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showsSearch) {
                HomeSearchSheet(onOpenRoute: onOpenRoute)
            }
        }
    }
}

private struct HomeSearchCard: View {
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
    @State private var query: String
    @State private var recentSearches: [String]
    @State private var recordedResultIDs: Set<String> = []
    @State private var bookmarkTarget: RestaurantSummary?
    @State private var selectedResult: HomeSearchResultItem?
    @State private var kakaoResults: [HomeSearchResultItem] = []
    @State private var friendResults: [HomeSearchResultItem] = []
    @State private var kakaoPhase: HomeSearchAsyncPhase = .idle
    @State private var friendPhase: HomeSearchAsyncPhase = .idle
    private let repository: any HomeSearchRepository
    var onOpenRoute: ((AppRoute) -> Void)? = nil

    init(
        initialQuery: String = "",
        repository: any HomeSearchRepository = FixtureHomeSearchRepository(),
        onOpenRoute: ((AppRoute) -> Void)? = nil
    ) {
        _query = State(initialValue: initialQuery)
        _recentSearches = State(initialValue: HomeSearchEngine.loadRecentSearches())
        self.repository = repository
        self.onOpenRoute = onOpenRoute
    }

    var body: some View {
        SearchOverlayShell(
            placeholder: "레스토랑, 메뉴, 셰프, 버디 검색",
            query: $query,
            onSubmit: submitSearch,
            onClose: { dismiss() }
        ) {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                if trimmedQuery.isEmpty {
                    searchSuggestions

                    TBPageSection(
                        title: "추천 탐색",
                        subtitle: "레스토랑을 먼저, 셰프와 메뉴, 다이닝 친구까지 함께 찾을 수 있어요."
                    ) {
                        SearchSuggestionWrap {
                            ForEach(HomeSearchEngine.suggestedQueries) { suggestion in
                                Button {
                                    selectSuggestion(suggestion.label)
                                } label: {
                                    NeutralChip(title: suggestion.label)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
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
                    if let selectedItem = selectedVisibleResult {
                        SearchFocusCard(
                            item: selectedItem,
                            isRecorded: recordedResultIDs.contains(selectedItem.id),
                            isBookmarked: selectedItem.restaurantID.map {
                                appModel.isRestaurantSaved(id: $0)
                            } ?? false,
                            onOpenResult: openResult,
                            onRecordResult: recordResult,
                            onBookmarkResult: toggleBookmark
                        )
                    }

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
                                        isSelected: selectedVisibleResult?.id == item.id,
                                        isRecorded: recordedResultIDs.contains(item.id),
                                        isBookmarked: item.restaurantID.map {
                                            appModel.isRestaurantSaved(id: $0)
                                        } ?? false,
                                        onSelectResult: selectResult,
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

    private var selectedVisibleResult: HomeSearchResultItem? {
        guard let selectedResult else {
            return nil
        }

        return visibleItems.first { $0.id == selectedResult.id }
    }

    private var hasRemotePhaseMessage: Bool {
        kakaoPhase.message != nil || friendPhase.message != nil
    }

    @ViewBuilder
    private var searchSuggestions: some View {
        if !recentSearches.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("최근 검색")
                        .font(TBFont.semibold(12))
                        .foregroundStyle(TBColor.textSecondary)
                    Spacer()
                    Button("모두 지우기") {
                        recentSearches = []
                        HomeSearchEngine.saveRecentSearches([])
                    }
                    .font(TBFont.semibold(11))
                    .foregroundStyle(TBColor.textHint)
                }

                SearchSuggestionWrap {
                    ForEach(recentSearches, id: \.self) { term in
                        Button {
                            selectSuggestion(term)
                        } label: {
                            NeutralChip(title: term, symbol: "clock")
                        }
                        .buttonStyle(.plain)
                    }
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

        if let selectedVisibleResult {
            openResult(selectedVisibleResult)
            return
        }

        if let firstResult = visibleItems.first {
            selectResult(firstResult)
            commitRecentSearch(HomeSearchEngine.recentSearchValue(for: firstResult, query: trimmedQuery))
            return
        }

        commitRecentSearch(trimmedQuery)
    }

    private func selectResult(_ item: HomeSearchResultItem) {
        selectedResult = item
        commitRecentSearch(HomeSearchEngine.recentSearchValue(for: item, query: trimmedQuery))
    }

    private func openResult(_ item: HomeSearchResultItem) {
        selectedResult = item
        commitRecentSearch(HomeSearchEngine.recentSearchValue(for: item, query: trimmedQuery))

        guard let route = item.route else {
            return
        }

        dismiss()
        onOpenRoute?(route)
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
        guard let restaurantID = item.restaurantID else {
            return
        }

        commitRecentSearch(HomeSearchEngine.recentSearchValue(for: item, query: trimmedQuery))
        bookmarkTarget = RestaurantCatalog.restaurant(id: restaurantID)
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
        reconcileSelectedResult()

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

        reconcileSelectedResult()
    }

    private func resetRemoteSearch() {
        selectedResult = nil
        kakaoResults = []
        friendResults = []
        kakaoPhase = .idle
        friendPhase = .idle
    }

    private func reconcileSelectedResult() {
        guard let selectedResult,
              !visibleItems.contains(where: { $0.id == selectedResult.id }) else {
            return
        }

        self.selectedResult = nil
    }

    @ViewBuilder
    private var remoteStatusRows: some View {
        if hasRemotePhaseMessage {
            VStack(spacing: 8) {
                phaseStatusRow(
                    phase: kakaoPhase,
                    icon: "store",
                    title: "외부 장소"
                )
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

private struct SearchFocusCard: View {
    let item: HomeSearchResultItem
    let isRecorded: Bool
    let isBookmarked: Bool
    let onOpenResult: (HomeSearchResultItem) -> Void
    let onRecordResult: (HomeSearchResultItem) -> Void
    let onBookmarkResult: (HomeSearchResultItem) -> Void

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .top, spacing: 12) {
                    SearchResultMedia(item: item, size: .large)

                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 6) {
                            StatusChip(
                                title: item.statusLabel ?? item.source.label,
                                backgroundColor: item.axis.tintColor,
                                foregroundColor: item.axis.tintTextColor
                            )

                            if item.source != .local {
                                StatusChip(title: item.source.label)
                            }
                        }

                        Text(item.title)
                            .font(TBFont.bold(16))
                            .foregroundStyle(TBColor.textPrimary)
                            .lineLimit(1)

                        Text(item.subtitle)
                            .font(TBFont.regular(13))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(3)

                        Text(item.detail)
                            .font(TBFont.semibold(11))
                            .foregroundStyle(item.axis.mainColor)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                HStack(spacing: 8) {
                    if item.route != nil {
                        Button {
                            onOpenResult(item)
                        } label: {
                            Text(item.focusActionLabel)
                                .font(TBFont.semibold(12))
                                .foregroundStyle(TBColor.textInverse)
                                .frame(maxWidth: .infinity)
                                .frame(height: 40)
                                .background(TBColor.textPrimary)
                                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }

                    if item.supportsDiningRecordAction {
                        Button {
                            onRecordResult(item)
                        } label: {
                            Text(isRecorded ? "내 기록에 추가됨" : "내 기록에 추가")
                                .font(TBFont.semibold(12))
                                .foregroundStyle(TBColor.textPrimary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 40)
                                .background(TBColor.mutedSurface)
                                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }

                    if item.supportsBookmarkAction {
                        Button {
                            onBookmarkResult(item)
                        } label: {
                            LucideIcon(
                                .bookmark,
                                size: TBIcon.Size.base,
                                strokeWidth: TBIcon.Stroke.regular,
                                filled: isBookmarked
                            )
                            .frame(width: 40, height: 40)
                            .foregroundStyle(isBookmarked ? item.axis.mainColor : TBColor.textSecondary)
                            .background(TBColor.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(isBookmarked ? "북마크됨" : "북마크")
                    }
                }
            }
        }
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
    let isSelected: Bool
    let isRecorded: Bool
    let isBookmarked: Bool
    let onSelectResult: (HomeSearchResultItem) -> Void
    let onRecordResult: (HomeSearchResultItem) -> Void
    let onBookmarkResult: (HomeSearchResultItem) -> Void

    var body: some View {
        CompactCard(
            heading: item.title,
            metadata: item.subtitle,
            isSelected: isSelected,
            action: { onSelectResult(item) }
        ) {
            SearchResultMedia(item: item)
        } actions: {
            HStack(spacing: 0) {
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

private struct SearchSuggestionWrap<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        TBFlowLayout(spacing: 8) {
            content
        }
    }
}

private enum RecommendationMode: String, CaseIterable, Identifiable {
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
    static let gap: CGFloat = 12
    static let avatarSize: CGFloat = 42
    static let imageBoxSize = TokenBoxSize.large
    static let imageFallbackIconSize = TBIcon.Size.extraLarge
    static let borderOpacity = 0.18
}

private struct HomeRecommendationSection: View {
    @Binding var isEditorOpen: Bool
    @Binding var mode: RecommendationMode
    let contentState: HomeRecommendationContentState

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

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
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
                            GhostBuddyRecommendationCard(buddy: buddy)
                        }
                    case .fallbackBuddy:
                        RecommendationEmptyMiniCard(mode: mode)
                    case .populated:
                        ForEach(TasteBuddyNativeContent.tasteMatchFeed) { item in
                            RecommendationMiniCard(item: item, mode: mode)
                        }
                    }
                }
                .padding(.trailing, TBSpacing.page)
            }
        }
    }
}

private struct FallbackBuddyRecommendation: Identifiable {
    let id: String
    let name: String
    let handle: String
    let matchRate: Int
    let axis: TasteAxis

    static let samples = [
        FallbackBuddyRecommendation(
            id: "fallback-mina",
            name: "Mina",
            handle: "@clear_umami",
            matchRate: 89,
            axis: .umami
        ),
        FallbackBuddyRecommendation(
            id: "fallback-jae",
            name: "Jae",
            handle: "@bright_course",
            matchRate: 86,
            axis: .sour
        ),
        FallbackBuddyRecommendation(
            id: "fallback-hyeon",
            name: "Hyeon",
            handle: "@quiet_finish",
            matchRate: 82,
            axis: .bitter
        )
    ]
}

private struct RecommendationMiniCard: View {
    let item: TasteMatchFeedItem
    let mode: RecommendationMode

    var body: some View {
        VStack(alignment: .leading, spacing: TasteMatchRecommendationCardMetrics.gap) {
            media

            VStack(alignment: .leading, spacing: 2) {
                Text(primaryText)
                    .font(TBFont.bold(14))
                    .foregroundStyle(item.axis.tintTextColor)
                    .lineLimit(1)

                Text(secondaryText)
                    .font(TBFont.regular(10))
                    .foregroundStyle(item.axis.tintTextColor.opacity(0.72))
                    .lineLimit(1)
            }

            Spacer(minLength: 0)

            Text(fitLabel)
                .font(TBFont.semibold(10))
                .foregroundStyle(item.axis.tintTextColor)
        }
        .frame(
            width: TasteMatchRecommendationCardMetrics.width,
            height: TasteMatchRecommendationCardMetrics.height,
            alignment: .topLeading
        )
        .padding(TasteMatchRecommendationCardMetrics.padding)
        .background(item.axis.tintColor)
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
            .stroke(item.axis.mainColor.opacity(TasteMatchRecommendationCardMetrics.borderOpacity))
        }
        .accessibilityLabel("\(primaryText), \(secondaryText), \(fitLabel)")
    }

    @ViewBuilder
    private var media: some View {
        switch mode {
        case .buddy:
            PalateBloomAvatar(
                size: TasteMatchRecommendationCardMetrics.avatarSize,
                seed: item.reviewerHandle
            )
        case .restaurant:
            ImageBox(
                alt: "\(item.restaurantName) 레스토랑",
                kind: .restaurant,
                fallbackIconSize: TasteMatchRecommendationCardMetrics.imageFallbackIconSize,
                size: TasteMatchRecommendationCardMetrics.imageBoxSize,
                taste: item.axis,
                variant: .taste
            )
        case .chef:
            ChefAvatar(
                alt: chefName,
                iconSize: TasteMatchRecommendationCardMetrics.imageFallbackIconSize,
                size: TasteMatchRecommendationCardMetrics.imageBoxSize,
                taste: item.axis,
                variant: .taste
            )
        }
    }

    private var primaryText: String {
        switch mode {
        case .buddy: item.reviewerName
        case .restaurant: item.restaurantName
        case .chef: chefName
        }
    }

    private var secondaryText: String {
        switch mode {
        case .buddy: item.reviewerHandle
        case .restaurant: item.dishTitle
        case .chef: item.restaurantName
        }
    }

    private var fitLabel: String {
        mode == .buddy ? "취향 적합도 \(item.matchRate)%" : "적합도 \(item.matchRate)%"
    }

    private var chefName: String {
        switch item.restaurantName {
        case "정식당": "임정식 셰프"
        case "온지음": "온지음 셰프"
        case "모수": "모수 셰프"
        default: "\(item.restaurantName) 셰프"
        }
    }
}

private struct GhostBuddyRecommendationCard: View {
    let buddy: FallbackBuddyRecommendation

    var body: some View {
        VStack(alignment: .leading, spacing: TasteMatchRecommendationCardMetrics.gap) {
            PalateBloomAvatar(
                size: TasteMatchRecommendationCardMetrics.avatarSize,
                seed: buddy.id
            )

            VStack(alignment: .leading, spacing: 2) {
                Text(buddy.name)
                    .font(TBFont.bold(14))
                    .foregroundStyle(buddy.axis.tintTextColor)
                    .lineLimit(1)

                Text(buddy.handle)
                    .font(TBFont.regular(10))
                    .foregroundStyle(buddy.axis.tintTextColor.opacity(0.72))
                    .lineLimit(1)
            }

            Spacer(minLength: 0)

            Text("취향 적합도 \(buddy.matchRate)%")
                .font(TBFont.semibold(10))
                .foregroundStyle(buddy.axis.tintTextColor)
        }
        .frame(
            width: TasteMatchRecommendationCardMetrics.width,
            height: TasteMatchRecommendationCardMetrics.height,
            alignment: .topLeading
        )
        .padding(TasteMatchRecommendationCardMetrics.padding)
        .background(buddy.axis.tintColor)
        .clipShape(RoundedRectangle(cornerRadius: TasteMatchRecommendationCardMetrics.radius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TasteMatchRecommendationCardMetrics.radius, style: .continuous)
                .stroke(buddy.axis.mainColor.opacity(TasteMatchRecommendationCardMetrics.borderOpacity))
        }
        .accessibilityLabel("\(buddy.name), \(buddy.handle), 취향 적합도 \(buddy.matchRate)%")
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
            width: TasteMatchRecommendationCardMetrics.width,
            height: TasteMatchRecommendationCardMetrics.height,
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
            width: TasteMatchRecommendationCardMetrics.width,
            height: TasteMatchRecommendationCardMetrics.height,
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
                    Label("댓글 보기", systemImage: "text.bubble")
                    Spacer()
                    Label("레스토랑 열기", systemImage: "chevron.right")
                }
                .font(TBFont.semibold(11))
                .foregroundStyle(TBColor.textHint)
            }
        }
    }

}
