import XCTest
@testable import TasteBuddy

final class AppModelPersistenceTests: XCTestCase {
    @MainActor
    func testPreferenceIntakeDraftAndCompletedProfileRestoreSeparately() {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let draft = PreferenceIntakeResponsesContract(
            allergies: ["allergies-none"],
            avoidedSignals: [],
            dietaryRestrictions: [],
            explorationStyle: nil,
            flavorIntensityPreference: nil,
            preferredCuisineTypes: ["korean-course"],
            sharePreferenceWithRestaurant: nil
        )

        let firstModel = AppModel(defaults: defaults)
        firstModel.savePreferenceIntakeDraft(draft)

        let restoredDraftModel = AppModel(defaults: defaults)
        XCTAssertEqual(restoredDraftModel.preferenceIntakeDraft, draft)
        XCTAssertNil(restoredDraftModel.preferenceProfile)

        restoredDraftModel.completePreferenceIntake(draft)

        let restoredProfileModel = AppModel(defaults: defaults)
        XCTAssertNil(restoredProfileModel.preferenceIntakeDraft)
        XCTAssertEqual(restoredProfileModel.preferenceProfile, draft)
    }

    @MainActor
    func testSavedRestaurantIDsRestoreAndToggle() {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let firstModel = AppModel(defaults: defaults)
        firstModel.saveRestaurant(id: "onjium")
        firstModel.saveRestaurant(id: "jungsik")

        let restoredModel = AppModel(defaults: defaults)
        XCTAssertEqual(restoredModel.savedRestaurantIDs, Set(["onjium", "jungsik"]))

        restoredModel.toggleSavedRestaurant(id: "onjium")

        let toggledModel = AppModel(defaults: defaults)
        XCTAssertEqual(toggledModel.savedRestaurantIDs, Set(["jungsik"]))
    }

    @MainActor
    func testRestaurantBookmarkListsRecordsRestoreMoveAndRemove() {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let restaurant = RestaurantCatalog.restaurant(id: "onjium")
        let firstModel = AppModel(defaults: defaults)
        let list = firstModel.createBookmarkList(
            name: "기념일 후보",
            description: "차분하게 오래 기억될 식사를 고를 때",
            isPrivate: true,
            coverIconID: .sparkles,
            coverTasteID: .sweet
        )
        firstModel.saveRestaurantBookmark(
            restaurant: restaurant,
            listID: list.id,
            savedAt: Date(timeIntervalSince1970: 10)
        )

        let restoredModel = AppModel(defaults: defaults)
        XCTAssertEqual(restoredModel.bookmarkLists, [list])
        XCTAssertEqual(restoredModel.bookmarkRecord(for: restaurant.id)?.listID, list.id)
        XCTAssertTrue(restoredModel.isRestaurantSaved(id: restaurant.id))

        restoredModel.saveRestaurantBookmark(
            restaurant: restaurant,
            listID: RestaurantBookmarkConstants.defaultListID,
            savedAt: Date(timeIntervalSince1970: 20)
        )

        let movedModel = AppModel(defaults: defaults)
        XCTAssertEqual(
            movedModel.bookmarkRecord(for: restaurant.id)?.listID,
            RestaurantBookmarkConstants.defaultListID
        )

        movedModel.removeRestaurantBookmark(restaurantID: restaurant.id)

        let removedModel = AppModel(defaults: defaults)
        XCTAssertNil(removedModel.bookmarkRecord(for: restaurant.id))
        XCTAssertFalse(removedModel.isRestaurantSaved(id: restaurant.id))
        XCTAssertEqual(removedModel.bookmarkLists, [list])
    }

    @MainActor
    func testRestaurantBookmarkPendingMutationsRestoreForOfflineSync() {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let restaurant = RestaurantCatalog.restaurant(id: "jungsik")
        let firstModel = AppModel(defaults: defaults)
        let list = firstModel.createBookmarkList(
            name: "나중에 비교할 곳",
            isPrivate: false,
            coverIconID: .utensils,
            coverTasteID: .sour
        )
        firstModel.saveRestaurantBookmark(restaurant: restaurant, listID: list.id)

        let restoredModel = AppModel(defaults: defaults)

        XCTAssertEqual(restoredModel.pendingBookmarkMutations.count, 2)
        XCTAssertEqual(restoredModel.bookmarkSyncStatus, .pending(2))
    }

    @MainActor
    func testRestaurantBookmarkRemoteConflictResolutionPreservesLocalPendingIntent() {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let onjium = RestaurantCatalog.restaurant(id: "onjium")
        let jungsik = RestaurantCatalog.restaurant(id: "jungsik")
        let model = AppModel(defaults: defaults)
        let localList = model.createBookmarkList(
            name: "기념일 후보",
            isPrivate: true,
            coverIconID: .sparkles,
            coverTasteID: .sweet
        )
        model.saveRestaurantBookmark(
            restaurant: onjium,
            listID: localList.id,
            savedAt: Date(timeIntervalSince1970: 20)
        )
        model.removeRestaurantBookmark(restaurantID: jungsik.id)

        let remoteList = RestaurantBookmarkList(
            id: "remote-list",
            name: "원격 리스트",
            description: "다른 기기에서 만든 리스트",
            isPrivate: false,
            coverIconID: .utensils,
            coverTasteID: .umami
        )
        let remoteState = RestaurantBookmarkState(
            lists: [remoteList],
            bookmarks: [
                RestaurantBookmarkRecord(
                    chefName: onjium.chefName,
                    listID: remoteList.id,
                    restaurantID: onjium.id,
                    restaurantName: onjium.name,
                    savedAt: Date(timeIntervalSince1970: 10)
                ),
                RestaurantBookmarkRecord(
                    chefName: jungsik.chefName,
                    listID: remoteList.id,
                    restaurantID: jungsik.id,
                    restaurantName: jungsik.name,
                    savedAt: Date(timeIntervalSince1970: 30)
                )
            ]
        )

        let resolution = model.applyRemoteRestaurantBookmarkState(
            remoteState,
            resolvedAt: Date(timeIntervalSince1970: 40)
        )

        XCTAssertEqual(resolution.conflictCount, 1)
        XCTAssertEqual(resolution.suppressedRemoteBookmarkCount, 1)
        XCTAssertEqual(model.bookmarkRecord(for: onjium.id)?.listID, localList.id)
        XCTAssertNil(model.bookmarkRecord(for: jungsik.id))
        XCTAssertTrue(model.bookmarkLists.contains(localList))
        XCTAssertTrue(model.bookmarkLists.contains(remoteList))
        XCTAssertTrue(model.pendingBookmarkMutations.isEmpty)
        XCTAssertEqual(model.bookmarkSyncStatus, .conflictResolved(Date(timeIntervalSince1970: 40), 2))
    }

    @MainActor
    func testDishFeedbackCommentsRestoreAndUpdateCardCount() {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let feedbackID = "following-mina-broth"
        let firstModel = AppModel(defaults: defaults)
        XCTAssertEqual(firstModel.comments(for: feedbackID).count, 2)

        firstModel.addDishFeedbackComment(
            feedbackID: feedbackID,
            message: " 다음에는 산미가 더 먼저 오는 코스와 비교해볼게요. "
        )
        firstModel.addDishFeedbackComment(feedbackID: feedbackID, message: "   ")

        let restoredModel = AppModel(defaults: defaults)
        let item = TasteBuddyNativeContent.followingDishFeedbackItems[0]
        XCTAssertEqual(restoredModel.comments(for: feedbackID).count, 3)
        XCTAssertEqual(
            restoredModel.dishFeedbackItemWithCurrentComments(item).commentCount,
            3
        )
    }
}
