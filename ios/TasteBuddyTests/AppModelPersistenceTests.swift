import XCTest
@testable import TasteBuddy

final class AppModelPersistenceTests: XCTestCase {
    @MainActor
    func testPreferenceSourcesRestoreAndKeepEditingHistorySeparateFromDining() async throws {
        let suiteName = "tastebuddy.preference.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let fixture = try PreferenceIntakeCatalogLoader.load()
        var responses = fixture.referenceResponses
        let first = try PreferenceIntakeContractEngine.completeProfile(questions: fixture.questions, responses: responses,
            previous: nil, id: "first", recordedAt: Date(timeIntervalSince1970: 1_788_220_800))
        let model = AppModel(defaults: defaults)
        XCTAssertTrue(model.completePreferenceIntake(first))
        XCTAssertEqual(PreferenceIntakeContractEngine.responsesFromProfile(first).allergies, responses.allergies)
        responses.flavorIntensityPreference = "rich"
        model.savePreferenceIntakeDraft(responses)
        XCTAssertEqual(AppModel(defaults: defaults).preferenceIntakeDraft?.flavorIntensityPreference, "rich")
        let edited = try PreferenceIntakeContractEngine.completeProfile(questions: fixture.questions, responses: responses,
            previous: first, id: "edited", recordedAt: Date(timeIntervalSince1970: 1_788_307_200))
        XCTAssertTrue(model.completePreferenceIntake(edited))
        let restored = AppModel(defaults: defaults)
        XCTAssertEqual(restored.preferenceProfile, edited)
        XCTAssertNil(restored.preferenceIntakeDraft)
        XCTAssertEqual(restored.preferenceProfile?.submissions?.map(\.id), ["first", "edited"])
        for _ in 0..<200 where restored.sensoryAnalysisIsUpdating { try await Task.sleep(nanoseconds: 10_000_000) }
        XCTAssertNil(restored.sensoryAnalysisError)
        XCTAssertFalse(restored.sensoryAnalysisIsUpdating)
        XCTAssertEqual(restored.sensoryAnalysis.statedPreferences.submissionID, "edited")
        XCTAssertEqual(restored.sensoryAnalysis.statedPreferences.answeredQuestionCount, 7)
        XCTAssertTrue(restored.diningEntries.isEmpty)
        XCTAssertTrue(restored.sensoryAnalysis.observations.isEmpty)
        XCTAssertEqual(restored.sensoryAnalysis.completedExperienceCount, 0)
        let unanswered = try PreferenceIntakeContractEngine.completeProfile(questions: fixture.questions, responses: .init(),
            previous: edited, id: "withdrawn", recordedAt: Date(timeIntervalSince1970: 1_788_393_600))
        var stale = edited
        stale.submissions = unanswered.submissions
        XCTAssertNil(PreferenceIntakeContractEngine.responsesFromProfile(stale).flavorIntensityPreference)
        let anotherOwner = try PreferenceIntakeContractEngine.completeProfile(questions: fixture.questions, responses: responses,
            previous: nil, userID: "someone-else")
        XCTAssertNil(PreferenceIntakeContractEngine.responsesFromProfile(anotherOwner).flavorIntensityPreference)
    }

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

        let savedAt = Date(timeIntervalSince1970: 1_800_000_000)
        let firstModel = AppModel(defaults: defaults, now: { savedAt })
        firstModel.addDiningEntry(entry)

        let savedEntry = try XCTUnwrap(firstModel.diningEntries.first)
        XCTAssertEqual(savedEntry.savedAt, savedAt)
        XCTAssertNil(savedEntry.updatedAt)
        try assertDiningSourceUnchangedByStorage(savedEntry, original: entry)
        let restoredModel = AppModel(defaults: defaults)
        XCTAssertEqual(restoredModel.diningEntries, [savedEntry])

        let encodedEntry = try JSONEncoder().encode(entry)
        var legacyObject = try XCTUnwrap(
            JSONSerialization.jsonObject(with: encodedEntry) as? [String: Any]
        )
        legacyObject.removeValue(forKey: "savedAt")
        legacyObject.removeValue(forKey: "updatedAt")
        legacyObject.removeValue(forKey: "tasteExperienceIDs")
        legacyObject.removeValue(forKey: "detailTagIDs")
        legacyObject.removeValue(forKey: "dishKindIDs")
        legacyObject.removeValue(forKey: "reflectionPhotoFilename")
        legacyObject.removeValue(forKey: "tbaAnalysisSnapshot")
        legacyObject.removeValue(forKey: "feedbackStatus")
        legacyObject.removeValue(forKey: "photoPalette")
        let legacyData = try JSONSerialization.data(withJSONObject: legacyObject)
        let legacyEntry = try JSONDecoder().decode(DiningEntry.self, from: legacyData)

        XCTAssertNil(legacyEntry.savedAt)
        XCTAssertNil(legacyEntry.updatedAt)
        XCTAssertTrue(legacyEntry.tasteExperienceIDs.isEmpty)
        XCTAssertTrue(legacyEntry.detailTagIDs.isEmpty)
        XCTAssertTrue(legacyEntry.dishKindIDs.isEmpty)
        XCTAssertNil(legacyEntry.reflectionPhotoFilename)
        XCTAssertNil(legacyEntry.tbaAnalysisSnapshot)
        XCTAssertEqual(legacyEntry.feedbackStatus, .completed)
        XCTAssertTrue(legacyEntry.hasCompletedTasteFeedback)
        XCTAssertNil(legacyEntry.photoPalette)
        XCTAssertEqual(legacyEntry.note, entry.note)
    }

    @MainActor
    func testDiningEntryCapturedStatusPersistsAndAddUpsertsByID() throws {
        let suiteName = "tastebuddy.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let entryID = UUID()
        let capturedEntry = DiningEntry(
            id: entryID,
            restaurant: "온지음",
            menu: "",
            rating: 0,
            note: "",
            reflectionPhotoFilename: "captured.jpg",
            feedbackStatus: .captured,
            photoPalette: .neutralFallback
        )
        let completedEntry = DiningEntry(
            id: entryID,
            restaurant: "온지음",
            menu: "저녁 코스",
            rating: 5,
            note: "맑은 감칠맛과 산뜻한 마무리가 오래 남았어요.",
            tasteExperienceIDs: ["umami-clear", "sour-fresh"],
            reflectionPhotoFilename: "captured.jpg",
            feedbackStatus: .completed,
            photoPalette: .neutralFallback
        )
        let savedAt = Date(timeIntervalSince1970: 1_800_000_000)
        let updatedAt = savedAt.addingTimeInterval(60)
        var clock = savedAt
        let model = AppModel(defaults: defaults, now: { clock })

        model.addDiningEntry(capturedEntry)

        let savedCapturedEntry = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(savedCapturedEntry.savedAt, savedAt)
        XCTAssertNil(savedCapturedEntry.updatedAt)
        try assertDiningSourceUnchangedByStorage(savedCapturedEntry, original: capturedEntry)
        XCTAssertFalse(model.diningEntries[0].hasCompletedTasteFeedback)
        XCTAssertEqual(model.diningEntries[0].photoPalette, .neutralFallback)

        clock = updatedAt
        model.addDiningEntry(completedEntry)

        let savedCompletedEntry = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(savedCompletedEntry.savedAt, savedAt)
        XCTAssertEqual(savedCompletedEntry.updatedAt, updatedAt)
        try assertDiningSourceUnchangedByStorage(savedCompletedEntry, original: completedEntry)
        XCTAssertTrue(model.diningEntries[0].hasCompletedTasteFeedback)
        XCTAssertEqual(model.diningEntries[0].photoPalette, .neutralFallback)
        XCTAssertEqual(AppModel(defaults: defaults).diningEntries, [savedCompletedEntry])
    }

    @MainActor
    func testCapturedDiningEntryDoesNotBecomeSensoryEvidence() async throws {
        let suiteName = "tastebuddy.sensory-persistence.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let completed = DiningEntry(restaurant: "식당", menu: "완료한 음식", rating: 5, note: "단맛이 좋았습니다.")
        let captured = DiningEntry(restaurant: "식당", menu: "미완료 음식", rating: 5, note: "바삭함이 좋았습니다.", feedbackStatus: .captured)
        model.addDiningEntry(completed)
        try await waitForSensoryAnalysis(model)
        let before = model.sensoryAnalysis
        XCTAssertFalse(before.observations.isEmpty)
        model.addDiningEntry(captured)
        try await waitForSensoryAnalysis(model)
        XCTAssertEqual(model.sensoryAnalysis.observations, before.observations)
        XCTAssertEqual(model.sensoryAnalysis.insights, before.insights)
        XCTAssertEqual(model.sensoryAnalysis.completedExperienceCount, 1)
        XCTAssertEqual(model.sensoryAnalysis.sourceExperienceCount, 1)
        XCTAssertFalse(model.sensoryAnalysis.observations.contains { $0.experienceID == captured.id })
        XCTAssertEqual(model.diningEntries.count, 2)
    }

    @MainActor
    func testSensoryAnalysisRebuildsFromPreservedSourceWhenReopened() async throws {
        let suiteName = "tastebuddy.sensory-persistence.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let legacyEvents = Data("preserved-legacy-events".utf8)
        let legacyConfidence = Data("preserved-legacy-confidence".utf8)
        defaults.set(legacyEvents, forKey: "tastebuddy.ios.tba-evidence-events.v1")
        defaults.set(legacyConfidence, forKey: "tastebuddy.ios.tba-confidence-states.v1")
        let legacy = TasteBuddyAgentDiningAnalysisSnapshot(confidence: 0.99, detailTags: [], foodKnowledgeMatchIds: [], foodOnMatchIds: [], generatedAt: "old", lexiconCandidateIds: [], source: "old", subject: "old", summary: "과거 엔진의 재사용 금지 결과", tasteBubbles: [], tbaSignalIds: ["unused-old-signal"], version: "tba-dining-analysis-v1")
        let meal = DiningEntry(restaurant: "기록한 식당", menu: "기록한 음식", rating: 5, note: "단맛이 좋았습니다.", dishKindIDs: ["broth"], reflectionPhotoFilename: "preserved-source-photo.jpg", tbaAnalysisSnapshot: legacy)
        let savedAt = Date(timeIntervalSince1970: 1_800_000_000)
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository(), now: { savedAt })
        model.addDiningEntry(meal)
        try await waitForSensoryAnalysis(model)
        XCTAssertTrue(model.sensoryAnalysis.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sweet" && $0.value == .text("positive") })
        let savedMeal = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(savedMeal.savedAt, savedAt)
        XCTAssertNil(savedMeal.updatedAt)
        try assertDiningSourceUnchangedByStorage(savedMeal, original: meal)
        let stored = try XCTUnwrap(defaults.data(forKey: "tastebuddy.ios.dining-entries.v1"))
        XCTAssertEqual(try JSONDecoder().decode([DiningEntry].self, from: stored), [savedMeal])

        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForSensoryAnalysis(reopened)
        XCTAssertEqual(reopened.diningEntries, [savedMeal])
        XCTAssertEqual(reopened.sensoryAnalysis, model.sensoryAnalysis)
        XCTAssertEqual(defaults.data(forKey: "tastebuddy.ios.dining-entries.v1"), stored)
        XCTAssertEqual(defaults.data(forKey: "tastebuddy.ios.tba-evidence-events.v1"), legacyEvents)
        XCTAssertEqual(defaults.data(forKey: "tastebuddy.ios.tba-confidence-states.v1"), legacyConfidence)
        XCTAssertFalse(reopened.sensoryAnalysis.insights.contains { $0.body.contains(legacy.summary) })
        XCTAssertEqual(reopened.sensoryAnalysis.actualApiCalls, 0)
    }

    @MainActor
    func testEditingAndDeletingReplaceSensoryResultsWithoutStaleEvidence() async throws {
        let suiteName = "tastebuddy.sensory-persistence.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let original = DiningEntry(restaurant: "식당", menu: "음식", rating: 5, note: "단맛이 좋았습니다.")
        model.addDiningEntry(original)
        try await waitForSensoryAnalysis(model)
        let originalIDs = Set(model.sensoryAnalysis.observations.map(\.id))
        XCTAssertFalse(originalIDs.isEmpty)
        let edited = DiningEntry(id: original.id, restaurant: original.restaurant, menu: original.menu, date: original.date, rating: original.rating, note: "쓴맛이 싫었습니다.")
        model.updateDiningEntry(edited)
        XCTAssertTrue(model.sensoryAnalysis.observations.isEmpty, "수정 직후 과거 결과를 화면에서 제거한다")
        try await waitForSensoryAnalysis(model)
        XCTAssertTrue(model.sensoryAnalysis.observations.contains { $0.attribute == "taste.bitter" && $0.kind == "attribute_liking" && $0.value == .text("negative") })
        XCTAssertTrue(originalIDs.isDisjoint(with: model.sensoryAnalysis.observations.map(\.id)))
        XCTAssertFalse(model.sensoryAnalysis.observations.contains { $0.attribute == "taste.sweet" })
        model.updateDiningEntry(original)
        model.removeDiningEntry(id: original.id)
        XCTAssertTrue(model.sensoryAnalysis.observations.isEmpty)
        try await waitForSensoryAnalysis(model)
        XCTAssertTrue(model.diningEntries.isEmpty)
        XCTAssertTrue(model.sensoryAnalysis.observations.isEmpty)
        XCTAssertTrue(model.sensoryAnalysis.insights.isEmpty)
        XCTAssertEqual(model.sensoryAnalysis.sourceExperienceCount, 0)
        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForSensoryAnalysis(reopened)
        XCTAssertTrue(reopened.sensoryAnalysis.observations.isEmpty)
    }

    @MainActor
    func testResetClearsSensoryResultsAndCancelsPendingRefresh() async throws {
        let suiteName = "tastebuddy.sensory-persistence.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        model.addDiningEntry(DiningEntry(restaurant: "식당", menu: "음식", rating: 5, note: "단맛이 좋았습니다."))
        try await waitForSensoryAnalysis(model)
        XCTAssertFalse(model.sensoryAnalysis.observations.isEmpty)
        model.refreshSensoryAnalysis()
        model.resetAll()
        XCTAssertEqual(model.sensoryAnalysis, .empty)
        XCTAssertFalse(model.sensoryAnalysisIsUpdating)
        XCTAssertNil(model.sensoryAnalysisError)
        XCTAssertTrue(model.diningEntries.isEmpty)
        XCTAssertNil(defaults.data(forKey: "tastebuddy.ios.dining-entries.v1"))
        let reopened = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        try await waitForSensoryAnalysis(reopened)
        XCTAssertTrue(reopened.sensoryAnalysis.observations.isEmpty)
        XCTAssertEqual(model.sensoryAnalysis, .empty, "취소한 새로고침이 reset 이후 결과를 되살리지 않는다")
    }

    @MainActor
    private func waitForSensoryAnalysis(_ model: AppModel) async throws {
        let clock = ContinuousClock()
        let deadline = clock.now.advanced(by: .seconds(10))
        while model.sensoryAnalysisIsUpdating && clock.now < deadline {
            try await Task.sleep(for: .milliseconds(10))
        }
        XCTAssertFalse(model.sensoryAnalysisIsUpdating, "감각 분석 새로고침 시간 초과")
        XCTAssertNil(model.sensoryAnalysisError)
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

/// 저장 시각 두 필드 외에는 원래 기록의 모든 직렬화 필드가 그대로인지 확인한다.
func assertDiningSourceUnchangedByStorage(_ saved: DiningEntry, original: DiningEntry, file: StaticString = #filePath, line: UInt = #line) throws {
    func source(_ entry: DiningEntry) throws -> NSDictionary {
        let data = try JSONEncoder().encode(entry)
        var fields = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any], file: file, line: line)
        fields.removeValue(forKey: "savedAt")
        fields.removeValue(forKey: "updatedAt")
        return fields as NSDictionary
    }
    XCTAssertEqual(try source(saved), try source(original), file: file, line: line)
}
