import XCTest
@testable import TasteBuddy

final class HomeSearchRecommendationTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_791_118_800) // 2026-10-04 13:00 UTC
    private let account = UUID()
    private let generation = UUID()
    private var context: HomeSearchRecommendationContext {
        .init(accountGeneration: account, evidenceGeneration: generation, profileUserID: "test-owner", analysisReady: true)
    }

    private func catalog() throws -> HomeSearchRecommendationCatalog {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("TasteBuddy/Resources/TBA/search-recommendation-catalog.json")
        return try JSONDecoder().decode(HomeSearchRecommendationCatalog.self, from: Data(contentsOf: url))
    }

    private func records(count: Int = 3, kind: String = "attribute_liking", direction: String = "positive",
                         target: String = "sauce", phase: String = "unspecified", dish: String = "dumpling",
                         intensity: String? = nil, sameMeal: Bool = false) -> [PersonalTasteModelRecord] {
        (0..<count).flatMap { index -> [PersonalTasteModelRecord] in
            let selection = SensorySelectionEvidence(
                selectionID: "test-spicy", type: "detailTag", catalogVersion: "test-catalog/1",
                labelSnapshot: "매운 소스", facet: "liking", labelValue: "좋았어요",
                responseValue: "liked", relatedBubbleID: nil, relatedBubbleLabel: nil,
                resolution: "resolved", selectionInstanceID: "choice-\(index)", definitionVersion: "test/1"
            )
            let row = PersonalTasteModelRecord(
                observationId: "like-\(index)", userId: "test-owner", experienceId: "experience-\(index)",
                mealId: sameMeal ? "same-meal" : "meal-\(index)", kind: kind,
                attribute: "trigeminal.spicy", value: kind == "sensory_presence" ? .flag(true) : .text(direction),
                scale: kind == "sensory_presence" ? "presence-v1" : "attribute-three-category-v1",
                target: target, phase: phase, dishKindIDs: [dish], selectionEvidence: selection
            )
            guard let intensity else { return [row] }
            var strength = row
            strength.observationId = "strength-\(index)"; strength.kind = "sensory_intensity"
            strength.value = .text(intensity); strength.scale = "expression-strength-v1"
            return [row, strength]
        }
    }

    private func profile(_ records: [PersonalTasteModelRecord]) -> PersonalTasteModelSnapshot {
        PersonalTasteModelBuilder.buildRecords(records: records, userID: "test-owner", assessQuestions: false)
    }

    private func recommend(_ rows: [PersonalTasteModelRecord], catalog: HomeSearchRecommendationCatalog? = nil) throws -> [HomeSearchRecommendationIntent] {
        HomeSearchRecommendationEngine.suggestions(catalog: try catalog ?? self.catalog(), profile: profile(rows), context: context, now: now)
    }

    func testBundledCatalogHasSpecificMenuSourcesWithoutInventedStrengthOrAvailability() throws {
        let catalog = try catalog()
        XCTAssertEqual(catalog.schemaVersion, HomeSearchRecommendationCatalog.schema)
        XCTAssertEqual(catalog.availableMenus(at: now).count, 2)
        XCTAssertTrue(catalog.menus.allSatisfy { $0.availability == "unconfirmed" })
        XCTAssertTrue(catalog.menus.flatMap(\.features).allSatisfy { $0.intensity == nil && $0.target == "sauce" })
        XCTAssertTrue(catalog.menus.allSatisfy { $0.source.link?.host == "www.dintaifung.co.kr" })
        XCTAssertFalse(HomeSearchRecommendationCatalog.load().menus.isEmpty, "The resource must also be included in the app bundle.")
    }

    func testSelectedMenusUseExistingSearchSectionsAndOnlyResolveTheirRestaurantNames() throws {
        let catalog = try catalog()
        let intent = try XCTUnwrap(recommend(records(), catalog: catalog).first)
        let execution = HomeSearchRecommendationEngine.execute(
            intent, catalog: catalog, context: context, now: now
        )
        let sections = execution.searchSections
        let items = sections.flatMap(\.items)
        XCTAssertEqual(sections.map(\.id), ["menus"])
        XCTAssertEqual(Set(items.map(\.title)), Set(catalog.menus.map(\.title)))
        XCTAssertTrue(items.allSatisfy { $0.kind == .menu && $0.subtitle == "딘타이펑" })
        XCTAssertTrue(items.allSatisfy { execution.restaurantQuery(forResultID: $0.id) == "딘타이펑" })
        XCTAssertNil(execution.restaurantQuery(forResultID: "unrelated-menu"))
    }

    func testSavedPlacesUseExistingSearchSectionsAndStaleSelectionsCannotNavigate() throws {
        let places = [HomeSearchRecommendationSavedPlace(id: "saved-place", name: "저장한 가게")]
        let execution = HomeSearchRecommendationExecution(status: .ready, menus: [], savedPlaces: places)
        let item = try XCTUnwrap(execution.searchSections.first?.items.first)
        XCTAssertEqual(execution.searchSections.first?.id, "restaurants")
        XCTAssertEqual(item.kind, .restaurant)
        XCTAssertEqual(execution.restaurantQuery(forResultID: item.id), "저장한 가게")
        for status in [HomeSearchRecommendationExecution.Status.empty, .stale] {
            let unavailable = HomeSearchRecommendationExecution(status: status, menus: [], savedPlaces: places)
            XCTAssertTrue(unavailable.searchSections.isEmpty)
            XCTAssertNil(unavailable.restaurantQuery(forResultID: item.id))
        }
    }

    func testColdStartShowsFoodExplorationAndNoPersonalEvidence() throws {
        let intents = try recommend([])
        XCTAssertEqual(intents.map(\.label), ["완탕 둘러보기"])
        XCTAssertEqual(intents.map(\.basis), [.general])
        XCTAssertTrue(intents.allSatisfy { $0.evidenceIDs.isEmpty && $0.selectionInstanceIDs.isEmpty })
    }

    func testThreeDirectMealsReuseTBAAndExecuteExactMenuSet() throws {
        let intents = try recommend(records())
        let intent = try XCTUnwrap(intents.first)
        XCTAssertEqual(intents.count, 1, "The same result set must not also appear as a generic chip.")
        XCTAssertEqual(intent.label, "매운 완탕")
        XCTAssertEqual(intent.basis, .taste)
        XCTAssertEqual(Set(intent.evidenceIDs), Set(["like-0", "like-1", "like-2"]))
        XCTAssertEqual(Set(intent.selectionInstanceIDs), Set(["choice-0", "choice-1", "choice-2"]))
        let result = HomeSearchRecommendationEngine.execute(intent, catalog: try catalog(), context: context, now: now)
        XCTAssertEqual(result.status, .ready)
        XCTAssertEqual(Set(result.menus.map(\.title)), Set(["매운새우완탕", "매운야채완탕"]))
        XCTAssertTrue(result.menus.allSatisfy { $0.restaurantQuery == "딘타이펑" })
    }

    func testTwoMealsPresenceOnlyAndSameMealDuplicatesDoNotBecomeSupported() throws {
        for rows in [records(count: 2), records(kind: "sensory_presence"), records(count: 5, sameMeal: true)] {
            XCTAssertFalse(try recommend(rows).contains { $0.basis == .taste })
        }
    }

    func testOpposingFeedbackKeepsExistingTBAAbstention() throws {
        var contrary = try XCTUnwrap(records(count: 1, direction: "negative").first)
        contrary.observationId = "counter"; contrary.experienceId = "other-experience"; contrary.mealId = "other-meal"
        XCTAssertFalse(try recommend(records() + [contrary]).contains { $0.basis == .taste })
        XCTAssertTrue(try recommend(records(direction: "negative")).isEmpty)
    }

    func testMissingMenuConditionsDoNotBroadenKnownPersonalConditions() throws {
        for rows in [records(intensity: "strong"), records(phase: "after_swallow"),
                     records(target: "inside"), records(dish: "broth")] {
            XCTAssertFalse(try recommend(rows).contains { $0.basis == .taste })
        }
    }

    func testAdditionalKnownFoodKindsAreNotLostWhenConnectingMenus() throws {
        let seafoodRows = records().map { row -> PersonalTasteModelRecord in
            var next = row; next.dishKindIDs = ["dumpling", "seafood"]; return next
        }
        let intent = try XCTUnwrap(recommend(seafoodRows).first { $0.basis == .taste })
        XCTAssertEqual(intent.resultIDs, ["dintaifung-spicy-shrimp-wonton"])
        XCTAssertEqual(intent.label, "매운새우완탕")
    }

    func testAnotherSelectionCannotSupplyIntensityForTheLikedSelection() throws {
        var rows = records()
        for index in 0..<3 {
            var other = rows[index]
            other.observationId = "unrelated-strength-\(index)"; other.kind = "sensory_intensity"
            other.scale = "expression-strength-v1"; other.value = .text("strong")
            other.selectionEvidence?.selectionInstanceID = "another-choice-\(index)"
            rows.append(other)
        }
        let intent = try XCTUnwrap(recommend(rows).first { $0.basis == .taste })
        XCTAssertFalse(intent.evidenceIDs.contains { $0.hasPrefix("unrelated") })
        XCTAssertFalse(intent.selectionInstanceIDs.contains { $0.hasPrefix("another") })
    }

    func testSourceRemovalAndExpiryNeverRelaxTheSelectedPredicate() throws {
        let original = try catalog()
        let intent = try XCTUnwrap(recommend(records()).first)
        let removed = HomeSearchRecommendationCatalog(schemaVersion: original.schemaVersion, revision: "next", topics: original.topics, menus: Array(original.menus.prefix(1)))
        XCTAssertEqual(HomeSearchRecommendationEngine.execute(intent, catalog: removed, context: context, now: now).status, .reduced)
        let first = try XCTUnwrap(original.menus.first)
        let withoutClaim = HomeSearchRecommendationMenu(id: first.id, revision: "changed", title: first.title,
            restaurantName: first.restaurantName, restaurantQuery: first.restaurantQuery,
            dishKindIDs: first.dishKindIDs, availability: first.availability, source: first.source, features: [])
        let changed = HomeSearchRecommendationCatalog(schemaVersion: original.schemaVersion, revision: "next", topics: original.topics, menus: [withoutClaim])
        XCTAssertEqual(HomeSearchRecommendationEngine.execute(intent, catalog: changed, context: context, now: now).status, .empty)
        XCTAssertTrue(original.availableMenus(at: now.addingTimeInterval(31 * 86_400)).isEmpty)
    }

    func testChangedMenuVersionDoesNotReuseTheOldPersonalReason() throws {
        let original = try catalog()
        let intent = try XCTUnwrap(recommend(records()).first)
        let changedMenus = original.menus.map { menu in
            HomeSearchRecommendationMenu(id: menu.id, revision: "new-recipe", title: menu.title,
                restaurantName: menu.restaurantName, restaurantQuery: menu.restaurantQuery,
                dishKindIDs: menu.dishKindIDs, availability: menu.availability, source: menu.source, features: menu.features)
        }
        let changed = HomeSearchRecommendationCatalog(schemaVersion: original.schemaVersion,
            revision: "new-menu-versions", topics: original.topics, menus: changedMenus)
        XCTAssertEqual(HomeSearchRecommendationEngine.execute(intent, catalog: changed, context: context, now: now).status, .empty)
    }

    func testAccountChangesEvidenceChangesPendingAnalysisAndTTLInvalidateOldIntent() throws {
        let intent = try XCTUnwrap(recommend(records()).first)
        let catalog = try catalog()
        let changedContexts = [
            HomeSearchRecommendationContext(accountGeneration: UUID(), evidenceGeneration: generation, profileUserID: "test-owner", analysisReady: true),
            .init(accountGeneration: account, evidenceGeneration: UUID(), profileUserID: "test-owner", analysisReady: true),
            .init(accountGeneration: account, evidenceGeneration: generation, profileUserID: "test-owner", analysisReady: false)
        ]
        for changed in changedContexts {
            XCTAssertEqual(HomeSearchRecommendationEngine.execute(intent, catalog: catalog, context: changed, now: now).status, .stale)
        }
        XCTAssertEqual(HomeSearchRecommendationEngine.execute(intent, catalog: catalog, context: context, now: now.addingTimeInterval(300)).status, .stale)
        XCTAssertFalse(try recommend(Array(records().prefix(2))).contains { $0.basis == .taste })
    }

    func testMismatchedOwnerCannotPersonalize() throws {
        let other = HomeSearchRecommendationContext(accountGeneration: account, evidenceGeneration: generation, profileUserID: "someone-else", analysisReady: true)
        let result = HomeSearchRecommendationEngine.suggestions(catalog: try catalog(), profile: profile(records()), context: other, now: now)
        XCTAssertFalse(result.contains { $0.basis == .taste })
    }

    func testDuplicateMenuIdentityAndUnattributedFeatureFailClosed() throws {
        let original = try catalog()
        let repeated = HomeSearchRecommendationCatalog(schemaVersion: original.schemaVersion, revision: "duplicates", topics: original.topics, menus: original.menus + original.menus)
        XCTAssertTrue(try recommend(records(), catalog: repeated).isEmpty)
        let menu = try XCTUnwrap(original.menus.first)
        let unsupported = HomeSearchRecommendationFeature(attribute: "trigeminal.spicy", reference: nil, target: "sauce", phase: "unspecified", intensity: nil, sourceExcerpt: "출처에 없는 추정")
        let changedMenu = HomeSearchRecommendationMenu(id: menu.id, revision: menu.revision, title: menu.title,
            restaurantName: menu.restaurantName, restaurantQuery: menu.restaurantQuery, dishKindIDs: menu.dishKindIDs,
            availability: menu.availability, source: menu.source, features: [unsupported])
        let changed = HomeSearchRecommendationCatalog(schemaVersion: original.schemaVersion, revision: "unsupported", topics: original.topics, menus: [changedMenu])
        XCTAssertFalse(try recommend(records(), catalog: changed).contains { $0.basis == .taste })
    }

    func testSavedPlacesAreInterestAndUnsaveRemovesTheirResults() throws {
        let saved = [HomeSearchRecommendationSavedPlace(id: "place-1", name: "저장한 식당")]
        let intents = HomeSearchRecommendationEngine.suggestions(catalog: try catalog(), profile: nil, context: context, savedPlaces: saved, now: now)
        let intent = try XCTUnwrap(intents.first { $0.basis == .saved })
        XCTAssertTrue(intent.evidenceIDs.isEmpty)
        XCTAssertEqual(HomeSearchRecommendationEngine.execute(intent, catalog: try catalog(), context: context, savedPlaces: [], now: now).status, .empty)
    }

    func testCandidateOrderIsStableAndNeverExceedsFour() throws {
        let original = try catalog()
        let reverse = HomeSearchRecommendationCatalog(schemaVersion: original.schemaVersion, revision: original.revision,
            topics: Array(original.topics.reversed()), menus: Array(original.menus.reversed()))
        XCTAssertEqual(try recommend(records(), catalog: original), try recommend(Array(records().reversed()), catalog: reverse))
        XCTAssertLessThanOrEqual(try recommend(records()).count, 4)
    }

    func testActualNativeNotesProduceSupportedChipAndDeletionRetractsIt() throws {
        let entries = (0..<3).map { index in
            let time = now.addingTimeInterval(-Double(index + 1) * 86_400)
            return DiningEntry(restaurant: "가상 식당", menu: "완탕", observedAt: time,
                savedAt: time.addingTimeInterval(60), rating: 0, note: "소스의 매운맛이 좋았다.",
                sensorySelections: [], overallEvaluation: .init(response: .liked), dishKindIDs: ["dumpling"])
        }
        let before = try SensoryAnalysisEngine.analyze(entries: entries, userID: "test-owner")
        let after = try SensoryAnalysisEngine.analyze(entries: Array(entries.prefix(2)), userID: "test-owner")
        let first = HomeSearchRecommendationEngine.suggestions(catalog: try catalog(), profile: before.personalModel, context: context, now: now)
        let second = HomeSearchRecommendationEngine.suggestions(catalog: try catalog(), profile: after.personalModel, context: context, now: now)
        XCTAssertTrue(first.contains { $0.basis == .taste })
        XCTAssertFalse(second.contains { $0.basis == .taste })
    }
}
