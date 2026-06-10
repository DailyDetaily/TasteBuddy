import Foundation

struct HomeSearchSuggestion: Identifiable, Equatable {
    let id: String
    let label: String
}

enum HomeSearchAsyncPhase: Equatable {
    case idle
    case loading(String)
    case failed(String)

    var isLoading: Bool {
        if case .loading = self {
            return true
        }

        return false
    }

    var message: String? {
        switch self {
        case .idle:
            return nil
        case .loading(let message), .failed(let message):
            return message
        }
    }
}

struct HomeSearchResultSection: Identifiable, Equatable {
    let id: String
    let title: String
    let subtitle: String
    let items: [HomeSearchResultItem]
}

enum HomeSearchResultKind: String, Equatable {
    case restaurant
    case chef
    case menu
    case friend
}

enum HomeSearchResultSource: String, Equatable {
    case local
    case kakaoPlace
    case profileSearch

    var label: String {
        switch self {
        case .local:
            return "Taste Buddy"
        case .kakaoPlace:
            return "Kakao 장소"
        case .profileSearch:
            return "버디 검색"
        }
    }
}

struct HomeSearchResultItem: Identifiable, Equatable {
    let id: String
    let kind: HomeSearchResultKind
    let title: String
    let subtitle: String
    let detail: String
    let symbol: String
    let axis: TasteAxis
    let restaurantID: String?
    let route: AppRoute?
    let searchText: String
    let source: HomeSearchResultSource
    let statusLabel: String?

    init(
        id: String,
        kind: HomeSearchResultKind,
        title: String,
        subtitle: String,
        detail: String,
        symbol: String,
        axis: TasteAxis,
        restaurantID: String? = nil,
        route: AppRoute? = nil,
        searchText: String? = nil,
        source: HomeSearchResultSource = .local,
        statusLabel: String? = nil
    ) {
        self.id = id
        self.kind = kind
        self.title = title
        self.subtitle = subtitle
        self.detail = detail
        self.symbol = symbol
        self.axis = axis
        self.restaurantID = restaurantID
        self.route = route
        self.searchText = searchText ?? [title, subtitle, detail].joined(separator: " ")
        self.source = source
        self.statusLabel = statusLabel
    }

    var supportsDiningRecordAction: Bool {
        kind == .restaurant || kind == .chef || kind == .menu
    }

    var supportsBookmarkAction: Bool {
        restaurantID != nil
    }

    var focusActionLabel: String {
        route == nil ? "결과 확인" : "자세히 보기"
    }
}

protocol HomeSearchRepository {
    func kakaoRestaurantResults(matching query: String) async throws -> [HomeSearchResultItem]
    func friendResults(matching query: String) async throws -> [HomeSearchResultItem]
}

struct FixtureHomeSearchRepository: HomeSearchRepository {
    func kakaoRestaurantResults(matching query: String) async throws -> [HomeSearchResultItem] {
        let localSections = HomeSearchEngine.sections(matching: query)
        guard HomeSearchEngine.shouldSearchKakao(
            query: query,
            localSections: localSections
        ) else {
            return []
        }

        return Array(
            HomeSearchEngine
                .filteredItems(Self.kakaoRestaurantFixtures, matching: query)
                .prefix(HomeSearchEngine.maxGroupResults)
        )
    }

    func friendResults(matching query: String) async throws -> [HomeSearchResultItem] {
        guard HomeSearchEngine.isSearchableProfileIdentityQuery(query) else {
            return []
        }

        return Array(
            HomeSearchEngine
                .filteredItems(Self.friendFixtures, matching: query)
                .prefix(HomeSearchEngine.maxGroupResults)
        )
    }

    static let kakaoRestaurantFixtures: [HomeSearchResultItem] = [
        HomeSearchResultItem(
            id: "kakao-restaurant-mingles",
            kind: .restaurant,
            title: "밍글스",
            subtitle: "서울 강남구 도산대로67길 19",
            detail: "주소 확인됨",
            symbol: "store",
            axis: .umami,
            restaurantID: "mingles",
            route: .restaurant(id: "mingles"),
            searchText: "밍글스 Mingles 강민구 서울 강남 청담 모던 한식 카카오 장소",
            source: .kakaoPlace,
            statusLabel: "주소 확인됨"
        ),
        HomeSearchResultItem(
            id: "kakao-restaurant-layeon",
            kind: .restaurant,
            title: "라연",
            subtitle: "서울 중구 동호로",
            detail: "외부 장소 후보",
            symbol: "store",
            axis: .sweet,
            searchText: "라연 la yeon 신라호텔 서울 한식 파인다이닝 카카오 장소",
            source: .kakaoPlace,
            statusLabel: "외부 장소 후보"
        ),
        HomeSearchResultItem(
            id: "kakao-restaurant-kwonsooksoo",
            kind: .restaurant,
            title: "권숙수",
            subtitle: "서울 강남구 압구정로80길",
            detail: "외부 장소 후보",
            symbol: "store",
            axis: .salty,
            searchText: "권숙수 kwon sook soo 서울 강남 한식 코스 카카오 장소",
            source: .kakaoPlace,
            statusLabel: "외부 장소 후보"
        )
    ]

    static let friendFixtures: [HomeSearchResultItem] = [
        HomeSearchResultItem(
            id: "profile-friend-mina",
            kind: .friend,
            title: "Mina",
            subtitle: "@clear_umami",
            detail: "취향 적합도 92%",
            symbol: "person.crop.circle",
            axis: .umami,
            route: .publicProfile(id: "mina"),
            searchText: "Mina clear_umami @clear_umami 감칠맛 버디 후기 팔로잉",
            source: .profileSearch,
            statusLabel: "팔로잉"
        ),
        HomeSearchResultItem(
            id: "profile-friend-jae",
            kind: .friend,
            title: "Jae",
            subtitle: "@bright_course",
            detail: "취향 적합도 88%",
            symbol: "person.crop.circle",
            axis: .sour,
            route: .publicProfile(id: "jae"),
            searchText: "Jae bright_course @bright_course 산미 버디 후기",
            source: .profileSearch,
            statusLabel: "검색 결과"
        ),
        HomeSearchResultItem(
            id: "profile-friend-hyeon",
            kind: .friend,
            title: "Hyeon",
            subtitle: "@quiet_finish",
            detail: "취향 적합도 84%",
            symbol: "person.crop.circle",
            axis: .bitter,
            route: .publicProfile(id: "hyeon"),
            searchText: "Hyeon quiet_finish @quiet_finish 여운 쓴맛 버디 후기",
            source: .profileSearch,
            statusLabel: "검색 결과"
        )
    ]
}

enum HomeSearchEngine {
    static let maxRecentSearches = 5
    static let maxGroupResults = 6
    private static let recentSearchesKey = "tastebuddy.ios.home-recent-searches.v1"

    static let allSections: [HomeSearchResultSection] = [
        HomeSearchResultSection(
            id: "restaurants",
            title: "레스토랑",
            subtitle: "내 프로필과 자연스럽게 이어지는 다이닝 후보입니다.",
            items: [
                HomeSearchResultItem(
                    id: "restaurant-onjium",
                    kind: .restaurant,
                    title: "온지음",
                    subtitle: "맑은 감칠맛과 편안한 여운",
                    detail: "Taste fit 92%",
                    symbol: "fork.knife",
                    axis: .umami,
                    restaurantID: "onjium",
                    route: .restaurant(id: "onjium"),
                    searchText: "온지음 한식 파인다이닝 맑은 감칠맛 편안한 여운 종로"
                ),
                HomeSearchResultItem(
                    id: "restaurant-jungsik",
                    kind: .restaurant,
                    title: "정식당",
                    subtitle: "밝은 산미가 코스 리듬을 만듭니다",
                    detail: "Taste fit 88%",
                    symbol: "fork.knife",
                    axis: .sour,
                    restaurantID: "jungsik",
                    route: .restaurant(id: "jungsik"),
                    searchText: "정식당 임정식 모던 한식 산미 코스 강남"
                ),
                HomeSearchResultItem(
                    id: "restaurant-mosu",
                    kind: .restaurant,
                    title: "모수",
                    subtitle: "쌉싸름한 여운과 지방맛 균형",
                    detail: "Taste fit 84%",
                    symbol: "fork.knife",
                    axis: .bitter,
                    restaurantID: "mosu",
                    route: .restaurant(id: "mosu"),
                    searchText: "모수 컨템포러리 여운 쓴맛 지방맛"
                )
            ]
        ),
        HomeSearchResultSection(
            id: "chefs",
            title: "셰프",
            subtitle: "요청이 아니라 chef-ready context로 전달할 수 있는 연결입니다.",
            items: [
                HomeSearchResultItem(
                    id: "chef-onjium",
                    kind: .chef,
                    title: "온지음 셰프",
                    subtitle: "맑은 육수와 간의 정돈감",
                    detail: "조절점 보기",
                    symbol: "person.text.rectangle",
                    axis: .salty,
                    restaurantID: "onjium",
                    route: .restaurant(id: "onjium"),
                    searchText: "온지음 셰프 맑은 육수 간 정돈감 감칠맛"
                ),
                HomeSearchResultItem(
                    id: "chef-jungsik",
                    kind: .chef,
                    title: "임정식 셰프",
                    subtitle: "산미와 단맛의 모던한 균형",
                    detail: "조절점 보기",
                    symbol: "person.text.rectangle",
                    axis: .sour,
                    restaurantID: "jungsik",
                    route: .restaurant(id: "jungsik"),
                    searchText: "임정식 셰프 정식당 산미 단맛 모던 한식"
                )
            ]
        ),
        HomeSearchResultSection(
            id: "friends",
            title: "버디",
            subtitle: "비슷한 미각 기준을 가진 후기 흐름입니다.",
            items: [
                HomeSearchResultItem(
                    id: "friend-mina",
                    kind: .friend,
                    title: "Mina",
                    subtitle: "@clear_umami",
                    detail: "취향 적합도 92%",
                    symbol: "person.crop.circle",
                    axis: .umami,
                    route: .publicProfile(id: "mina"),
                    searchText: "Mina clear_umami 감칠맛 버디 후기"
                ),
                HomeSearchResultItem(
                    id: "friend-jae",
                    kind: .friend,
                    title: "Jae",
                    subtitle: "@bright_course",
                    detail: "취향 적합도 88%",
                    symbol: "person.crop.circle",
                    axis: .sour,
                    route: .publicProfile(id: "jae"),
                    searchText: "Jae bright_course 산미 버디 후기"
                )
            ]
        ),
        HomeSearchResultSection(
            id: "menus",
            title: "메뉴",
            subtitle: "한 접시 단위의 감각 단서를 먼저 보여줍니다.",
            items: [
                HomeSearchResultItem(
                    id: "menu-clear-broth",
                    kind: .menu,
                    title: "맑은 육수 코스",
                    subtitle: "감칠맛은 살리고 후반 무게는 가볍게",
                    detail: "나의 반응과 비교",
                    symbol: "sparkles",
                    axis: .umami,
                    restaurantID: "onjium",
                    route: .restaurantMenu(restaurantID: "onjium", menuID: "clear-broth-course"),
                    searchText: "맑은 육수 코스 온지음 감칠맛 후반 무게"
                ),
                HomeSearchResultItem(
                    id: "menu-citrus-fish",
                    kind: .menu,
                    title: "시트러스 소스 생선 요리",
                    subtitle: "초반 산미 리듬을 확인하기 좋은 메뉴",
                    detail: "디시 기록 보기",
                    symbol: "sparkles",
                    axis: .sour,
                    restaurantID: "jungsik",
                    route: .restaurantMenu(restaurantID: "jungsik", menuID: "citrus-fish"),
                    searchText: "시트러스 소스 생선 요리 정식당 산미 리듬"
                )
            ]
        )
    ]

    static var suggestedQueries: [HomeSearchSuggestion] {
        let candidates = allSections
            .filter { $0.id != "friends" }
            .flatMap(\.items)
            .prefix(6)

        return candidates.map { item in
            HomeSearchSuggestion(id: item.id, label: item.title)
        }
    }

    static func sections(matching query: String) -> [HomeSearchResultSection] {
        let normalizedQuery = normalize(query)

        guard !normalizedQuery.isEmpty else {
            return []
        }

        let terms = normalizedQuery
            .split(separator: " ")
            .map(String.init)

        return allSections.compactMap { section in
            let items = section.items
                .filter { item in matches(item, terms: terms, normalizedQuery: normalizedQuery) }
                .prefix(maxGroupResults)

            guard !items.isEmpty else {
                return nil
            }

            return HomeSearchResultSection(
                id: section.id,
                title: section.title,
                subtitle: section.subtitle,
                items: Array(items)
            )
        }
    }

    static func mergedSections(
        matching query: String,
        localSections: [HomeSearchResultSection],
        kakaoResults: [HomeSearchResultItem],
        friendResults: [HomeSearchResultItem]
    ) -> [HomeSearchResultSection] {
        guard !normalize(query).isEmpty else {
            return []
        }

        return allSections.compactMap { template in
            let localItems = localSections.first { $0.id == template.id }?.items ?? []
            let remoteItems: [HomeSearchResultItem] = switch template.id {
            case "restaurants":
                kakaoResults
            case "friends":
                friendResults
            default:
                []
            }
            let mergedItems = deduped(localItems + remoteItems)
                .prefix(maxGroupResults)

            guard !mergedItems.isEmpty else {
                return nil
            }

            return HomeSearchResultSection(
                id: template.id,
                title: template.title,
                subtitle: template.subtitle,
                items: Array(mergedItems)
            )
        }
    }

    static func shouldSearchKakao(
        query: String,
        localSections: [HomeSearchResultSection]
    ) -> Bool {
        let normalizedQuery = normalize(query)

        guard hasSearchableCompleteCharacter(normalizedQuery),
              !isSearchableProfileIdentityQuery(normalizedQuery) else {
            return false
        }

        let localRestaurantCount = localSections
            .first { $0.id == "restaurants" }?
            .items
            .count ?? 0

        return localRestaurantCount == 0
    }

    static func isSearchableProfileIdentityQuery(_ query: String) -> Bool {
        let normalizedQuery = normalize(query)

        guard hasSearchableCompleteCharacter(normalizedQuery) else {
            return false
        }

        return normalizedQuery.hasPrefix("@")
            || normalizedQuery.contains("버디")
            || normalizedQuery.contains("buddy")
            || normalizedQuery.contains("mina")
            || normalizedQuery.contains("jae")
            || normalizedQuery.contains("hyeon")
            || normalizedQuery.contains("clear_")
            || normalizedQuery.contains("bright_")
            || normalizedQuery.contains("quiet_")
    }

    static func filteredItems(
        _ items: [HomeSearchResultItem],
        matching query: String
    ) -> [HomeSearchResultItem] {
        let normalizedQuery = normalize(query)

        guard !normalizedQuery.isEmpty else {
            return []
        }

        let terms = normalizedQuery
            .split(separator: " ")
            .map(String.init)

        return items.filter {
            matches($0, terms: terms, normalizedQuery: normalizedQuery)
        }
    }

    static func updatedRecentSearches(
        afterSelecting value: String,
        current: [String]
    ) -> [String] {
        let nextValue = value.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !nextValue.isEmpty else {
            return current
        }

        return ([nextValue] + current.filter { $0 != nextValue })
            .prefix(maxRecentSearches)
            .map(\.self)
    }

    static func loadRecentSearches(defaults: UserDefaults = .standard) -> [String] {
        guard let data = defaults.data(forKey: recentSearchesKey),
              let decoded = try? JSONDecoder().decode([String].self, from: data) else {
            return []
        }

        return Array(decoded.prefix(maxRecentSearches))
    }

    static func saveRecentSearches(_ searches: [String], defaults: UserDefaults = .standard) {
        defaults.set(
            try? JSONEncoder().encode(Array(searches.prefix(maxRecentSearches))),
            forKey: recentSearchesKey
        )
    }

    static func recentSearchValue(for item: HomeSearchResultItem, query: String) -> String {
        query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? item.title
            : item.title
    }

    private static func matches(
        _ item: HomeSearchResultItem,
        terms: [String],
        normalizedQuery: String
    ) -> Bool {
        let haystack = normalize(item.searchText)

        guard !haystack.contains(normalizedQuery) else {
            return true
        }

        return terms.allSatisfy { haystack.contains($0) }
    }

    static func normalize(_ value: String) -> String {
        value
            .folding(options: [.diacriticInsensitive, .widthInsensitive, .caseInsensitive], locale: .current)
            .lowercased()
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func hasSearchableCompleteCharacter(_ value: String) -> Bool {
        guard value.count >= 2 else {
            return false
        }

        return value.unicodeScalars.contains { scalar in
            CharacterSet.alphanumerics.contains(scalar)
                || (0xAC00...0xD7A3).contains(Int(scalar.value))
        }
    }

    private static func deduped(_ items: [HomeSearchResultItem]) -> [HomeSearchResultItem] {
        var seenKeys: Set<String> = []
        var nextItems: [HomeSearchResultItem] = []

        for item in items {
            let identityKey = [
                item.kind.rawValue,
                normalize(item.title),
                normalize(item.subtitle)
            ].joined(separator: "|")

            guard !seenKeys.contains(identityKey) else {
                continue
            }

            seenKeys.insert(identityKey)
            nextItems.append(item)
        }

        return nextItems
    }
}
