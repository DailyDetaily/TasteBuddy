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

    func testFriendRepositoryMergesIdentityResultsWithoutDuplicateLocalBuddy() async throws {
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
        XCTAssertEqual(friendItems.first { $0.title == "김민아" }?.source, .local)
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

    func testRemoteSearchPhaseCarriesReactLoadingAndFailureMessages() {
        let loading = HomeSearchAsyncPhase.loading("외부 장소 검색 중")
        let failed = HomeSearchAsyncPhase.failed("장소 검색을 다시 시도해 주세요")

        XCTAssertTrue(loading.isLoading)
        XCTAssertEqual(loading.message, "외부 장소 검색 중")
        XCTAssertFalse(failed.isLoading)
        XCTAssertEqual(failed.message, "장소 검색을 다시 시도해 주세요")
    }
}
