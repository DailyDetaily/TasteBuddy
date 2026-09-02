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
    func testDiningEntriesRestoreTasteExperienceSelectionAndDecodeLegacyPayload() throws {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let entry = DiningEntry(
            restaurant: "정식당",
            menu: "유자 코지 굴 타르트",
            rating: 4,
            note: "산뜻한 산미가 입맛을 열어준 기록입니다.",
            tasteExperienceIDs: [
                "sour-fresh",
                "salty-sea-clean",
                "umami-clear",
            ],
            detailTagIDs: [
                "balance-acid-cleans",
                "flow-clean-finish",
            ],
            reflectionPhotoFilename: "fixture-reflection.jpg"
        )

        let firstModel = AppModel(defaults: defaults)
        firstModel.addDiningEntry(entry)

        let restoredModel = AppModel(defaults: defaults)
        XCTAssertEqual(restoredModel.diningEntries, [entry])

        let encodedEntry = try JSONEncoder().encode(entry)
        var legacyObject = try XCTUnwrap(
            JSONSerialization.jsonObject(with: encodedEntry) as? [String: Any]
        )
        legacyObject.removeValue(forKey: "tasteExperienceIDs")
        legacyObject.removeValue(forKey: "detailTagIDs")
        legacyObject.removeValue(forKey: "dishKindIDs")
        legacyObject.removeValue(forKey: "reflectionPhotoFilename")
        legacyObject.removeValue(forKey: "tbaAnalysisSnapshot")
        let legacyData = try JSONSerialization.data(withJSONObject: legacyObject)
        let legacyEntry = try JSONDecoder().decode(DiningEntry.self, from: legacyData)

        XCTAssertTrue(legacyEntry.tasteExperienceIDs.isEmpty)
        XCTAssertTrue(legacyEntry.detailTagIDs.isEmpty)
        XCTAssertTrue(legacyEntry.dishKindIDs.isEmpty)
        XCTAssertNil(legacyEntry.reflectionPhotoFilename)
        XCTAssertNil(legacyEntry.tbaAnalysisSnapshot)
        XCTAssertEqual(legacyEntry.note, entry.note)
    }

    @MainActor
    func testTbaSnapshotEvidenceRestoresAndLogoutClearsItBeforeNextProfile() async {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let snapshot = TasteBuddyAgent.buildDiningAnalysisSnapshot(
            TasteBuddyAgentDiningAnalysisInput(
                detailTags: ["flow-clean-finish"],
                dishKindTags: ["grilled_smoked"],
                id: "persisted-tba-entry",
                ingredients: ["표고버섯"],
                restaurantName: "테스트 다이닝",
                subject: "표고버섯 숯불 구이",
                tasteTags: ["savory"],
                techniques: ["charcoal broiling"]
            ),
            generatedAt: "2026-06-05T00:00:00.000Z"
        )
        let entry = DiningEntry(
            restaurant: "테스트 다이닝",
            menu: "표고버섯 숯불 구이",
            rating: 5,
            note: "버섯의 깊이와 숯불 향이 깨끗하게 이어졌어요.",
            tasteExperienceIDs: ["umami-clear"],
            detailTagIDs: ["flow-clean-finish"],
            dishKindIDs: ["grilled_smoked"],
            tbaAnalysisSnapshot: snapshot
        )

        let firstModel = AppModel(
            defaults: defaults,
            authRepository: FixtureBackendAuthRepository()
        )
        firstModel.addDiningEntry(entry)

        XCTAssertEqual(firstModel.tbaEvidenceEvents.count, 1)
        XCTAssertFalse(firstModel.tbaConfidenceStates.isEmpty)

        let restoredModel = AppModel(defaults: defaults)
        XCTAssertEqual(restoredModel.diningEntries, [entry])
        XCTAssertEqual(restoredModel.tbaEvidenceEvents, firstModel.tbaEvidenceEvents)
        XCTAssertEqual(restoredModel.tbaConfidenceStates, firstModel.tbaConfidenceStates)

        let previousEventIDs = Set(firstModel.tbaEvidenceEvents.map(\.id))
        let logoutResult = await firstModel.logout()

        XCTAssertTrue(logoutResult.ok)
        XCTAssertTrue(firstModel.tbaEvidenceEvents.isEmpty)
        XCTAssertTrue(firstModel.tbaConfidenceStates.isEmpty)
        XCTAssertTrue(AppModel(defaults: defaults).tbaEvidenceEvents.isEmpty)

        firstModel.addDiningEntry(entry)
        XCTAssertEqual(firstModel.tbaEvidenceEvents.count, 1)
        XCTAssertTrue(previousEventIDs.isDisjoint(with: firstModel.tbaEvidenceEvents.map(\.id)))
        let nextProfileModel = AppModel(defaults: defaults)
        XCTAssertEqual(nextProfileModel.tbaEvidenceEvents, firstModel.tbaEvidenceEvents)
        XCTAssertEqual(nextProfileModel.tbaConfidenceStates, firstModel.tbaConfidenceStates)
    }

    @MainActor
    func testResetRemovesDiningPhotosAlongWithLocalRecords() throws {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let filename = try DiningReflectionPhotoStore.save(Data("photo".utf8), entryID: UUID())
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        let model = AppModel(defaults: defaults)
        model.addDiningEntry(DiningEntry(
            restaurant: "테스트 다이닝",
            menu: "로컬 사진",
            rating: 4,
            note: "",
            reflectionPhotoFilename: filename
        ))

        model.resetAll()

        XCTAssertTrue(model.diningEntries.isEmpty)
        XCTAssertNil(DiningReflectionPhotoStore.data(for: filename))
    }

    func testDiningReflectionPhotoStoreWritesAndRemovesLocalMedia() throws {
        let entryID = UUID()
        let data = Data("taste-buddy-photo".utf8)
        let filename = try DiningReflectionPhotoStore.save(data, entryID: entryID)
        defer {
            DiningReflectionPhotoStore.remove(filename: filename)
        }

        XCTAssertEqual(DiningReflectionPhotoStore.data(for: filename), data)

        DiningReflectionPhotoStore.remove(filename: filename)
        XCTAssertNil(DiningReflectionPhotoStore.data(for: filename))
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

    @MainActor
    func testRememberedRestaurantMenusRestoreUpdateAndRemove() {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let firstModel = AppModel(defaults: defaults)
        firstModel.rememberRestaurantMenu(
            "  고등어 파스타  ",
            for: "몽중식",
            restaurantKey: "kakao-123"
        )
        firstModel.rememberRestaurantMenu(
            "고등어파스타",
            for: "몽중식",
            restaurantKey: "kakao-123"
        )

        let restoredModel = AppModel(defaults: defaults)
        XCTAssertEqual(
            restoredModel.rememberedMenus(
                for: "몽중식",
                restaurantKey: "kakao-123"
            ),
            ["고등어 파스타"]
        )
        XCTAssertEqual(
            restoredModel.rememberedMenus(for: "몽중식"),
            ["고등어 파스타"]
        )

        restoredModel.updateRememberedRestaurantMenu(
            "고등어 파스타",
            to: "문어 라구 파스타",
            for: "몽중식",
            restaurantKey: "kakao-123"
        )

        let updatedModel = AppModel(defaults: defaults)
        XCTAssertEqual(
            updatedModel.rememberedMenus(
                for: "몽중식",
                restaurantKey: "kakao-123"
            ),
            ["문어 라구 파스타"]
        )

        updatedModel.removeRememberedRestaurantMenu(
            "문어 라구 파스타",
            for: "몽중식",
            restaurantKey: "kakao-123"
        )

        let removedModel = AppModel(defaults: defaults)
        XCTAssertTrue(
            removedModel.rememberedMenus(
                for: "몽중식",
                restaurantKey: "kakao-123"
            ).isEmpty
        )
    }

    @MainActor
    func testTasteProfileHistoryPersistsOnlyTheLatestSixPastMeasurements() {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let profiles = (0..<8).map { index in
            TasteProfile(
                createdAt: Date(timeIntervalSince1970: Double(index)),
                scores: [TasteAxis.sour.rawValue: 40 + index],
                confidence: "형성 중",
                summary: "fixture",
                topAxes: [.sour],
                cautionAxis: .bitter
            )
        }
        let model = AppModel(defaults: defaults)

        profiles.forEach(model.saveProfile)

        XCTAssertEqual(model.profile, profiles.last)
        XCTAssertEqual(model.profileHistory.map(\.createdAt), profiles[1...6].map(\.createdAt))

        let restoredModel = AppModel(defaults: defaults)
        XCTAssertEqual(restoredModel.profile, profiles.last)
        XCTAssertEqual(
            restoredModel.profileHistory.map(\.createdAt),
            profiles[1...6].map(\.createdAt)
        )

        restoredModel.restartCalibration()
        XCTAssertNil(restoredModel.profile)
        XCTAssertEqual(
            restoredModel.profileHistory.map(\.createdAt),
            profiles[2...7].map(\.createdAt)
        )
    }
}
