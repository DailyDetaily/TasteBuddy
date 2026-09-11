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
    let externalURL: URL?
    let bookmarkRestaurant: RestaurantSummary?

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
        statusLabel: String? = nil,
        externalURL: URL? = nil,
        bookmarkRestaurant: RestaurantSummary? = nil
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
        self.externalURL = externalURL
        self.bookmarkRestaurant = bookmarkRestaurant
    }

    var supportsDiningRecordAction: Bool {
        kind == .restaurant || kind == .chef || kind == .menu
    }

    var supportsBookmarkAction: Bool {
        bookmarkRestaurantID != nil
    }

    var bookmarkRestaurantID: String? {
        bookmarkRestaurant?.id ?? restaurantID
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
        guard HomeSearchEngine.isSearchableFriendQuery(query) else {
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
            title: "김민아",
            subtitle: "@맑은끝민아",
            detail: "검증용 예시 프로필 · 취향 비교 미계산",
            symbol: "person.crop.circle",
            axis: .umami,
            route: .publicProfile(id: "mina"),
            searchText: "김민아 맑은끝민아 @맑은끝민아 taste-dev-mina 감칠맛 버디 후기 팔로잉",
            source: .profileSearch,
            statusLabel: "팔로잉"
        ),
        HomeSearchResultItem(
            id: "profile-friend-jae",
            kind: .friend,
            title: "정서윤",
            subtitle: "@산미탐험서윤",
            detail: "검증용 예시 프로필 · 취향 비교 미계산",
            symbol: "person.crop.circle",
            axis: .sour,
            route: .publicProfile(id: "jae"),
            searchText: "정서윤 산미탐험서윤 @산미탐험서윤 taste-dev-seoyoon 산미 버디 후기",
            source: .profileSearch,
            statusLabel: "검색 결과"
        ),
        HomeSearchResultItem(
            id: "profile-friend-hyeon",
            kind: .friend,
            title: "최도윤",
            subtitle: "@불향도윤",
            detail: "검증용 예시 프로필 · 취향 비교 미계산",
            symbol: "person.crop.circle",
            axis: .bitter,
            route: .publicProfile(id: "hyeon"),
            searchText: "최도윤 불향도윤 @불향도윤 taste-dev-doyun 여운 쓴맛 불향 버디 후기",
            source: .profileSearch,
            statusLabel: "검색 결과"
        )
    ]
}

struct LiveHomeSearchRepository: HomeSearchRepository {
    var placeClient = RestaurantPlaceAPIClient()
    var publicProfileRepository: any BackendPublicProfileRepository = BackendPublicProfileRepositoryFactory.makeDefault()

    func kakaoRestaurantResults(matching query: String) async throws -> [HomeSearchResultItem] {
        let localSections = HomeSearchEngine.sections(matching: query)
        guard HomeSearchEngine.shouldSearchKakao(
            query: query,
            localSections: localSections
        ) else {
            return []
        }

        let places = try await placeClient.searchKakaoRestaurantPlaces(
            query: query,
            size: HomeSearchEngine.maxGroupResults
        )

        return places.compactMap { place in
            Self.searchResult(from: place)
        }
    }

    func friendResults(matching query: String) async throws -> [HomeSearchResultItem] {
        guard HomeSearchEngine.isSearchableFriendQuery(query) else {
            return []
        }

        let identities = try await publicProfileRepository.searchProfileIdentities(matching: query)
        await PublicProfileSnapshotStore.shared.store(identities)
        return Array(
            identities
                .map(Self.searchResult(from:))
                .prefix(HomeSearchEngine.maxGroupResults)
        )
    }

    private static func searchResult(from place: KakaoRestaurantPlace) -> HomeSearchResultItem? {
        let name = place.name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else {
            return nil
        }

        let address = place.displayAddress ?? "주소 확인 중"
        let matchedRestaurant = RestaurantCatalog.restaurants.first { restaurant in
            let normalizedRestaurantName = HomeSearchEngine.normalize(restaurant.name)
            let normalizedPlaceName = HomeSearchEngine.normalize(name)

            return normalizedRestaurantName == normalizedPlaceName
                || normalizedPlaceName.contains(normalizedRestaurantName)
                || normalizedRestaurantName.contains(normalizedPlaceName)
        }

        let detailParts = [
            place.category,
            place.phone.map { "전화 \($0)" }
        ].compactMap { value in
            value?.trimmingCharacters(in: .whitespacesAndNewlines)
        }.filter { !$0.isEmpty }

        let restaurantID = matchedRestaurant?.id
        let bookmarkRestaurant = matchedRestaurant ?? externalRestaurantSummary(
            for: place,
            id: externalRestaurantID(for: place),
            address: address,
            detailParts: detailParts
        )

        return HomeSearchResultItem(
            id: "kakao-restaurant-\(place.id)",
            kind: .restaurant,
            title: name,
            subtitle: address,
            detail: detailParts.first ?? "카카오에서 확인한 장소",
            symbol: "store",
            axis: matchedRestaurant?.axis ?? .umami,
            restaurantID: restaurantID,
            route: matchedRestaurant.map { .restaurant(id: $0.id) } ?? .restaurantSummary(bookmarkRestaurant),
            searchText: [
                name,
                address,
                place.category,
                place.phone
            ].compactMap(\.self).joined(separator: " "),
            source: .kakaoPlace,
            statusLabel: "카카오 장소",
            externalURL: nil,
            bookmarkRestaurant: bookmarkRestaurant
        )
    }

    private static func searchResult(from identity: BackendPublicProfileIdentity) -> HomeSearchResultItem {
        let title = identity.title
        let subtitle = identity.displayNickname

        return HomeSearchResultItem(
            id: "profile-\(identity.id)",
            kind: .friend,
            title: title,
            subtitle: subtitle,
            detail: "공개 프로필",
            symbol: "person.crop.circle",
            axis: .umami,
            route: .publicProfile(id: identity.id),
            searchText: [
                title,
                subtitle,
                identity.nickname,
                identity.isFriend ? "팔로잉" : "버디 검색"
            ]
            .compactMap(\.self)
            .joined(separator: " "),
            source: .profileSearch,
            statusLabel: identity.isFriend ? "팔로잉" : "검색 결과"
        )
    }

    private static func externalRestaurantID(for place: KakaoRestaurantPlace) -> String {
        let base = place.placeID ?? [place.name, place.displayAddress]
            .compactMap(\.self)
            .joined(separator: "-")
        let slug = HomeSearchEngine
            .normalize(base)
            .replacingOccurrences(
                of: "[^0-9a-z가-힣]+",
                with: "-",
                options: .regularExpression
            )
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))

        return "kakao-\(slug.isEmpty ? "restaurant" : slug)"
    }

    private static func externalRestaurantSummary(
        for place: KakaoRestaurantPlace,
        id: String,
        address: String,
        detailParts: [String]
    ) -> RestaurantSummary {
        RestaurantSummary(
            id: id,
            name: place.name,
            chefName: "Taste Buddy 분석 준비 중",
            category: place.category ?? "Kakao 장소",
            locationLabel: address,
            imageName: nil,
            axis: .umami,
            matchRate: 0,
            summary: "카카오에서 확인한 장소입니다. 메뉴별 미각 분석은 Taste Buddy 데이터가 준비되면 이어서 볼 수 있어요.",
            tags: Array(detailParts.prefix(3)),
            memorableDishes: [],
            infoRows: [
                RestaurantSummary.InfoRow(
                    id: "address",
                    label: "주소",
                    value: address,
                    symbol: "mappin.circle"
                )
            ] + (place.phone.map {
                [
                    RestaurantSummary.InfoRow(
                        id: "phone",
                        label: "전화",
                        value: $0,
                        symbol: "phone"
                    )
                ]
            } ?? [])
        )
    }
}

enum HomeSearchEngine {
    static let maxRecentSearches = 5
    static let maxGroupResults = 6
    private static let recentSearchesKey = "tastebuddy.ios.home-recent-searches.v1"
    private static let hangulBaseScalar = 0xAC00
    private static let hangulLastScalar = 0xD7A3
    private static let hangulInitialUnit = 588
    private static let hangulInitialScalars = [
        "ㄱ",
        "ㄲ",
        "ㄴ",
        "ㄷ",
        "ㄸ",
        "ㄹ",
        "ㅁ",
        "ㅂ",
        "ㅃ",
        "ㅅ",
        "ㅆ",
        "ㅇ",
        "ㅈ",
        "ㅉ",
        "ㅊ",
        "ㅋ",
        "ㅌ",
        "ㅍ",
        "ㅎ"
    ]

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
            subtitle: "검색한 공개 프로필입니다.",
            items: []
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

    static var friendSuggestedQueries: [HomeSearchSuggestion] {
        let candidates = allSections
            .first { $0.id == "friends" }?
            .items ?? []

        return candidates.map { item in
            HomeSearchSuggestion(id: item.id, label: item.title)
        }
    }

    static func sections(matching query: String) -> [HomeSearchResultSection] {
        guard let searchQuery = makeSearchQuery(from: query) else {
            return []
        }

        return allSections.compactMap { section in
            let items = section.items
                .scoredAndSorted(matching: searchQuery)
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
        let localChefOrMenuCount = localSections
            .filter { $0.id == "chefs" || $0.id == "menus" }
            .flatMap(\.items)
            .count

        return localRestaurantCount == 0 && localChefOrMenuCount == 0
    }

    static func isSearchableFriendQuery(_ query: String) -> Bool {
        hasSearchableCompleteCharacter(normalize(query))
    }

    static func isSearchableProfileIdentityQuery(_ query: String) -> Bool {
        let normalizedQuery = normalize(query)

        guard hasSearchableCompleteCharacter(normalizedQuery) else {
            return false
        }

        return normalizedQuery.hasPrefix("@")
            || normalizedQuery.contains("버디")
            || normalizedQuery.contains("buddy")
            || normalizedQuery.contains("김민아")
            || normalizedQuery.contains("맑은끝민아")
            || normalizedQuery.contains("정서윤")
            || normalizedQuery.contains("산미탐험서윤")
            || normalizedQuery.contains("최도윤")
            || normalizedQuery.contains("불향도윤")
            || normalizedQuery.contains("taste-dev-")
    }

    static func filteredItems(
        _ items: [HomeSearchResultItem],
        matching query: String
    ) -> [HomeSearchResultItem] {
        guard let searchQuery = makeSearchQuery(from: query) else {
            return []
        }

        return items.scoredAndSorted(matching: searchQuery)
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
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)

        if item.source == .kakaoPlace, !trimmedQuery.isEmpty {
            return trimmedQuery
        }

        return item.title
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
                || (0x3131...0x314E).contains(Int(scalar.value))
        }
    }

    private struct WeightedSearchField {
        let value: String
        let weight: Int
    }

    fileprivate struct SearchQuery {
        let terms: [String]
        let variants: [String]
    }

    private static func makeSearchQuery(from value: String) -> SearchQuery? {
        let normalizedValue = normalizeForSearch(value)

        guard !normalizedValue.isEmpty else {
            return nil
        }

        return SearchQuery(
            terms: normalizedValue
                .split(separator: " ")
                .map(String.init),
            variants: queryVariants(for: value)
        )
    }

    private static func normalizeForSearch(_ value: String) -> String {
        normalize(value)
            .replacingOccurrences(
                of: #"[\(\)'"\.,\/-]+"#,
                with: " ",
                options: .regularExpression
            )
            .replacingOccurrences(
                of: #"\s+"#,
                with: " ",
                options: .regularExpression
            )
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func compactSearchValue(_ value: String) -> String {
        normalizeForSearch(value).replacingOccurrences(of: " ", with: "")
    }

    private static func hangulInitialSearchValue(_ value: String) -> String {
        let characters = normalizeForSearch(value).unicodeScalars.map { scalar in
            let scalarValue = Int(scalar.value)

            guard (hangulBaseScalar...hangulLastScalar).contains(scalarValue) else {
                return String(scalar)
            }

            return hangulInitialScalars[
                (scalarValue - hangulBaseScalar) / hangulInitialUnit
            ]
        }

        return characters
            .joined()
            .replacingOccurrences(
                of: #"\s+"#,
                with: " ",
                options: .regularExpression
            )
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func uniqueSearchValues(_ values: [String]) -> [String] {
        var seenValues: Set<String> = []
        var nextValues: [String] = []

        for value in values {
            let trimmedValue = value.trimmingCharacters(in: .whitespacesAndNewlines)

            guard !trimmedValue.isEmpty, !seenValues.contains(trimmedValue) else {
                continue
            }

            seenValues.insert(trimmedValue)
            nextValues.append(trimmedValue)
        }

        return nextValues
    }

    private static func searchVariants(for value: String) -> [String] {
        let normalizedValue = normalizeForSearch(value)
        let compactValue = compactSearchValue(value)
        let initialValue = hangulInitialSearchValue(value)
        let compactInitialValue = initialValue.replacingOccurrences(of: " ", with: "")

        return uniqueSearchValues([
            normalizedValue,
            compactValue,
            initialValue,
            compactInitialValue
        ])
    }

    private static func queryVariants(for value: String) -> [String] {
        let normalizedValue = normalizeForSearch(value)
        let compactValue = compactSearchValue(value)
        let hasInitialConsonantInput = normalizedValue.unicodeScalars.contains { scalar in
            (0x3131...0x314E).contains(Int(scalar.value))
        }

        return uniqueSearchValues([
            normalizedValue,
            compactValue
        ] + (hasInitialConsonantInput ? searchVariants(for: value) : []))
    }

    private static func weightedSearchFields(for item: HomeSearchResultItem) -> [WeightedSearchField] {
        [
            WeightedSearchField(value: item.title, weight: 150),
            WeightedSearchField(value: item.subtitle, weight: 62),
            WeightedSearchField(value: item.detail, weight: 44),
            WeightedSearchField(value: item.searchText, weight: 36)
        ]
    }

    private static func fieldMatchScore(
        fieldValue: String,
        queryVariants: [String],
        queryTerms: [String],
        weight: Int
    ) -> Int? {
        let fieldVariants = searchVariants(for: fieldValue)
        let compactTerms = queryTerms
            .map { $0.replacingOccurrences(of: " ", with: "") }
            .filter { !$0.isEmpty }
        var bestScore: Int?

        for fieldVariant in fieldVariants {
            for queryVariant in queryVariants {
                let nextScore: Int?

                if fieldVariant == queryVariant {
                    nextScore = weight + 70
                } else if fieldVariant.hasPrefix(queryVariant) {
                    nextScore = weight + 45
                } else if fieldVariant.contains(queryVariant) {
                    nextScore = weight + 24
                } else {
                    nextScore = nil
                }

                if let nextScore {
                    bestScore = max(bestScore ?? nextScore, nextScore)
                }
            }

            if queryTerms.count > 1,
               queryTerms.enumerated().allSatisfy({ index, term in
                   fieldVariant.contains(term)
                       || (compactTerms.indices.contains(index) && fieldVariant.contains(compactTerms[index]))
               }) {
                let termScore = weight + 16 + queryTerms.count * 6
                bestScore = max(bestScore ?? termScore, termScore)
            }
        }

        return bestScore
    }

    fileprivate static func matchScore(
        for item: HomeSearchResultItem,
        query: SearchQuery
    ) -> Int? {
        weightedSearchFields(for: item).reduce(nil) { bestScore, field in
            guard let fieldScore = fieldMatchScore(
                fieldValue: field.value,
                queryVariants: query.variants,
                queryTerms: query.terms,
                weight: field.weight
            ) else {
                return bestScore
            }

            return max(bestScore ?? fieldScore, fieldScore)
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

private extension Array where Element == HomeSearchResultItem {
    func scoredAndSorted(matching query: HomeSearchEngine.SearchQuery) -> [HomeSearchResultItem] {
        compactMap { item -> (item: HomeSearchResultItem, score: Int)? in
            guard let score = HomeSearchEngine.matchScore(for: item, query: query) else {
                return nil
            }

            return (item, score)
        }
        .sorted { left, right in
            if left.score != right.score {
                return left.score > right.score
            }

            return left.item.title.localizedCompare(right.item.title) == .orderedAscending
        }
        .map(\.item)
    }
}
