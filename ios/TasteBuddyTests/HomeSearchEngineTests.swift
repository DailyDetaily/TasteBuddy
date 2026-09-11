import XCTest
@testable import TasteBuddy

final class HomeSearchEngineTests: XCTestCase {
    func testRecentSearchesDedupeAndLimitToFive() {
        var searches: [String] = []

        for value in ["온지음", "정식당", "감칠맛", "김민아", "산미", "온지음"] {
            searches = HomeSearchEngine.updatedRecentSearches(
                afterSelecting: value,
                current: searches
            )
        }

        XCTAssertEqual(searches, ["온지음", "산미", "김민아", "감칠맛", "정식당"])
        XCTAssertEqual(searches.count, HomeSearchEngine.maxRecentSearches)
    }

    func testSearchFiltersAcrossRestaurantChefMenuAndBuddyGroups() {
        let sections = HomeSearchEngine.sections(matching: "온지음")
        let sectionIDs = sections.map(\.id)

        XCTAssertTrue(sectionIDs.contains("restaurants"))
        XCTAssertTrue(sectionIDs.contains("chefs"))
        XCTAssertTrue(sectionIDs.contains("menus"))
        XCTAssertFalse(sectionIDs.contains("friends"))
    }

    func testSearchMatchesCompactEnglishAliasesInSearchText() {
        let results = HomeSearchEngine.filteredItems(
            FixtureHomeSearchRepository.kakaoRestaurantFixtures,
            matching: "kwonsooksoo"
        )

        XCTAssertEqual(results.first?.title, "권숙수")
    }

    func testSearchSupportsHangulInitialConsonantInput() {
        let sections = HomeSearchEngine.sections(matching: "ㅈㅅㄷ")
        let restaurantItems = sections.first { $0.id == "restaurants" }?.items ?? []

        XCTAssertEqual(restaurantItems.first?.title, "정식당")
    }

    func testSearchRanksDirectTitleMatchesBeforeContextMatches() {
        let items = [
            HomeSearchResultItem(
                id: "context-match",
                kind: .restaurant,
                title: "컨텍스트 후보",
                subtitle: "정식당과 비교할 수 있는 코스",
                detail: "Taste fit 80%",
                symbol: "fork.knife",
                axis: .umami,
                searchText: "정식당 비교 후보"
            ),
            HomeSearchResultItem(
                id: "title-match",
                kind: .restaurant,
                title: "정식당",
                subtitle: "밝은 산미가 코스 리듬을 만듭니다",
                detail: "Taste fit 88%",
                symbol: "fork.knife",
                axis: .sour,
                searchText: "정식당 임정식 모던 한식 산미 코스 강남"
            )
        ]

        XCTAssertEqual(HomeSearchEngine.filteredItems(items, matching: "정식당").first?.id, "title-match")
    }

    func testEmptyQueryReturnsSuggestedStateInsteadOfAllResults() {
        XCTAssertTrue(HomeSearchEngine.sections(matching: "").isEmpty)
        XCTAssertFalse(HomeSearchEngine.suggestedQueries.isEmpty)
    }

    func testRecentSearchPersistenceUsesAStoredArray() {
        let suiteName = "tastebuddy.home-search.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        HomeSearchEngine.saveRecentSearches(["온지음", "정식당"], defaults: defaults)

        XCTAssertEqual(
            HomeSearchEngine.loadRecentSearches(defaults: defaults),
            ["온지음", "정식당"]
        )
    }

    func testSearchResultsExposeReactActionTargets() {
        let actionableSections = HomeSearchEngine.allSections.filter { $0.id != "friends" }
        let actionableItems = actionableSections.flatMap(\.items)

        XCTAssertTrue(actionableItems.allSatisfy(\.supportsDiningRecordAction))
        XCTAssertTrue(actionableItems.allSatisfy(\.supportsBookmarkAction))
        XCTAssertTrue(actionableItems.allSatisfy { $0.restaurantID != nil })

        let friendItems = HomeSearchEngine.allSections
            .first { $0.id == "friends" }?
            .items ?? []

        XCTAssertTrue(friendItems.allSatisfy { $0.kind == .friend })
        XCTAssertTrue(friendItems.allSatisfy { !$0.supportsDiningRecordAction })
        XCTAssertTrue(friendItems.allSatisfy { !$0.supportsBookmarkAction })
    }

    func testKakaoRepositoryAddsRemoteRestaurantWhenLocalResultsAreMissing() async throws {
        let repository = FixtureHomeSearchRepository()
        let query = "밍글스"
        let localSections = HomeSearchEngine.sections(matching: query)

        XCTAssertTrue(HomeSearchEngine.shouldSearchKakao(query: query, localSections: localSections))

        let remoteResults = try await repository.kakaoRestaurantResults(matching: query)
        let sections = HomeSearchEngine.mergedSections(
            matching: query,
            localSections: localSections,
            kakaoResults: remoteResults,
            friendResults: []
        )
        let restaurantItems = sections.first { $0.id == "restaurants" }?.items ?? []

        XCTAssertEqual(restaurantItems.first?.title, "밍글스")
        XCTAssertEqual(restaurantItems.first?.source, .kakaoPlace)
        XCTAssertEqual(restaurantItems.first?.restaurantID, "mingles")
        XCTAssertTrue(restaurantItems.first?.supportsBookmarkAction ?? false)
    }

    func testFriendRepositoryMergesRemoteIdentityWithoutInjectingLocalSamples() async throws {
        let repository = FixtureHomeSearchRepository()
        let query = "김민아"
        let localSections = HomeSearchEngine.sections(matching: query)
        let remoteResults = try await repository.friendResults(matching: query)
        let sections = HomeSearchEngine.mergedSections(
            matching: query,
            localSections: localSections,
            kakaoResults: [],
            friendResults: remoteResults
        )
        let friendItems = sections.first { $0.id == "friends" }?.items ?? []

        XCTAssertEqual(friendItems.filter { $0.title == "김민아" }.count, 1)
        XCTAssertEqual(friendItems.first { $0.title == "김민아" }?.source, .profileSearch)
        XCTAssertTrue(localSections.allSatisfy { $0.id != "friends" })
    }

    func testFriendRepositoryFindsRemoteOnlyBuddyIdentityQuery() async throws {
        let repository = FixtureHomeSearchRepository()
        let query = "@불향도윤"
        let localSections = HomeSearchEngine.sections(matching: query)
        let remoteResults = try await repository.friendResults(matching: query)
        let sections = HomeSearchEngine.mergedSections(
            matching: query,
            localSections: localSections,
            kakaoResults: [],
            friendResults: remoteResults
        )

        XCTAssertEqual(sections.first { $0.id == "friends" }?.items.first?.title, "최도윤")
        XCTAssertEqual(
            sections.first { $0.id == "friends" }?.items.first?.source,
            .profileSearch
        )
    }

    func testLiveFriendRepositoryMapsPublicProfileSearchResults() async throws {
        let repository = LiveHomeSearchRepository(
            publicProfileRepository: FixtureBackendPublicProfileRepository(
                identities: [
                    BackendPublicProfileIdentity(
                        id: "public-user-1",
                        displayName: "박혜린",
                        nickname: "섬세한끝혜린",
                        isFriend: false
                    )
                ]
            )
        )

        let results = try await repository.friendResults(matching: "혜린")
        let storedIdentity = await PublicProfileSnapshotStore.shared.profile(id: "public-user-1")

        XCTAssertEqual(results.first?.id, "profile-public-user-1")
        XCTAssertEqual(results.first?.title, "박혜린")
        XCTAssertEqual(results.first?.subtitle, "@섬세한끝혜린")
        XCTAssertEqual(results.first?.route, .publicProfile(id: "public-user-1"))
        XCTAssertEqual(results.first?.statusLabel, "검색 결과")
        XCTAssertEqual(storedIdentity?.displayName, "박혜린")
    }

    func testLiveFriendFailurePropagatesWithoutSampleBuddyResults() async {
        let repository = LiveHomeSearchRepository(publicProfileRepository: FailingPublicProfileSearchRepository())
        do {
            _ = try await repository.friendResults(matching: "김민아")
            XCTFail("실패한 실제 검색을 샘플 친구 결과로 바꾸면 안 됩니다.")
        } catch {
            XCTAssertEqual((error as? URLError)?.code, .notConnectedToInternet)
        }
    }

    func testRestaurantDestinationDoesNotTreatCatalogMatchRateAsMeasuredEvidence() {
        for restaurant in RestaurantCatalog.restaurants {
            let detail = RestaurantDetailModel(summary: restaurant)
            XCTAssertNil(detail.scores.personalMatchRate)
            XCTAssertNil(detail.scores.palateFriendsAverageScore)
            XCTAssertNil(detail.scores.overallScore)
            XCTAssertEqual(detail.confidenceLabel, "미계산")
            XCTAssertEqual(detail.name, restaurant.name)
            XCTAssertEqual(detail.memorableDishes, restaurant.memorableDishes)
        }
        XCTAssertEqual(RestaurantDetailModel.confidenceLabel(from: 100), "미계산")
    }

    func testMenuDestinationPreservesFoodInformationWithoutInventingPersonalHistory() throws {
        let restaurant = try XCTUnwrap(RestaurantCatalog.restaurants.first)
        let detail = RestaurantDetailModel(summary: restaurant)
        for (index, dish) in restaurant.memorableDishes.enumerated() {
            let menu = detail.menuDetail(for: dish, index: index)
            XCTAssertEqual(menu.title, dish.title)
            XCTAssertEqual(menu.summaryLine, dish.summary)
            XCTAssertEqual(menu.tasteTags.map(\.label), dish.tags)
            XCTAssertEqual(menu.fitBand, "미계산")
            XCTAssertEqual(menu.confidenceLabel, "미계산")
            XCTAssertNil(menu.pastExperienceComparison)
            XCTAssertEqual(menu.similarPalateSignal, "비슷한 입맛 그룹의 평가를 아직 계산하지 않았어요.")
            XCTAssertEqual(menu.chefIntent, "셰프의 직접 설명이 아직 연결되지 않았어요.")
            XCTAssertEqual(menu.expectedTasteFlow, dish.tags.joined(separator: " · "))
        }
    }

    func testRemoteSearchPhaseCarriesReactLoadingAndFailureMessages() {
        let loading = HomeSearchAsyncPhase.loading("외부 장소 검색 중")
        let failed = HomeSearchAsyncPhase.failed("장소 검색을 다시 시도해 주세요")

        XCTAssertTrue(loading.isLoading)
        XCTAssertEqual(loading.message, "외부 장소 검색 중")
        XCTAssertFalse(failed.isLoading)
        XCTAssertEqual(failed.message, "장소 검색을 다시 시도해 주세요")
    }
}

private struct FailingPublicProfileSearchRepository: BackendPublicProfileRepository {
    func updateCurrentProfileIdentity(_ identity: UserProfileIdentity) async -> BackendProfileIdentityMutationResult { .failure("검증용 실패") }
    func currentProfileIdentity() async -> BackendPublicProfileIdentity? { nil }
    func searchProfileIdentities(matching query: String) async throws -> [BackendPublicProfileIdentity] { throw URLError(.notConnectedToInternet) }
}
