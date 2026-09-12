import XCTest
@testable import TasteBuddy

final class DiningAdvancedStorageTests: XCTestCase {
    func testLegacyEntryUsesDeterministicMealAndObservedAtWithoutInventingStorageDates() throws {
        let id = UUID(uuidString: "B7A837C0-E487-4E5A-B11D-4F6B5E3A43E5")!
        let date = Date(timeIntervalSince1970: 1_700_000_000)
        let current = DiningEntry(
            id: id,
            restaurant: "기록한 식당",
            menu: "기록한 음식",
            date: date,
            rating: 4,
            note: "산미가 좋았어요."
        )
        var object = try XCTUnwrap(
            JSONSerialization.jsonObject(with: JSONEncoder().encode(current)) as? [String: Any]
        )
        for key in [
            "mealID", "observedAt", "savedAt", "updatedAt", "restaurantID", "menuItemID",
        ] {
            object.removeValue(forKey: key)
        }

        let legacy = try JSONDecoder().decode(
            DiningEntry.self,
            from: JSONSerialization.data(withJSONObject: object)
        )

        XCTAssertEqual(legacy.mealID, id)
        XCTAssertEqual(legacy.observedAt, date)
        XCTAssertEqual(legacy.date, date)
        XCTAssertNil(legacy.savedAt)
        XCTAssertNil(legacy.updatedAt)
        XCTAssertNil(legacy.restaurantID)
        XCTAssertNil(legacy.menuItemID)
    }

    @MainActor
    func testInsertAndUpdatePreserveMealAndFirstSaveWhileTrackingLastEdit() throws {
        let suiteName = "tastebuddy.advanced-storage.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let firstSave = Date(timeIntervalSince1970: 1_700_000_100)
        let editTime = Date(timeIntervalSince1970: 1_700_000_200)
        var clock = firstSave
        let model = AppModel(defaults: defaults, now: { clock })
        let originalMealID = UUID()
        let entry = DiningEntry(
            mealID: originalMealID,
            restaurant: "정식당",
            restaurantID: "restaurant-jungsik",
            menu: "굴 타르트",
            menuItemID: "dish-oyster-tart",
            observedAt: Date(timeIntervalSince1970: 1_699_999_000),
            rating: 0,
            note: "",
            feedbackStatus: .captured
        )

        model.addDiningEntry(entry)
        let inserted = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(inserted.mealID, originalMealID)
        XCTAssertEqual(inserted.savedAt, firstSave)
        XCTAssertNil(inserted.updatedAt)

        clock = editTime
        let attemptedReplacementMealID = UUID()
        let edit = DiningEntry(
            id: entry.id,
            mealID: attemptedReplacementMealID,
            restaurant: entry.restaurant,
            restaurantID: entry.restaurantID,
            menu: entry.menu,
            menuItemID: entry.menuItemID,
            observedAt: entry.observedAt,
            savedAt: Date(timeIntervalSince1970: 10),
            rating: 0,
            note: "산미가 좋았어요.",
            feedbackStatus: .completed
        )
        model.updateDiningEntry(edit)

        let updated = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(updated.mealID, originalMealID)
        XCTAssertEqual(updated.savedAt, firstSave)
        XCTAssertEqual(updated.updatedAt, editTime)
        XCTAssertEqual(updated.note, "산미가 좋았어요.")

        let reopened = AppModel(defaults: defaults)
        XCTAssertEqual(reopened.diningEntries.first?.mealID, originalMealID)
        XCTAssertEqual(reopened.diningEntries.first?.savedAt, firstSave)
        XCTAssertEqual(reopened.diningEntries.first?.updatedAt, editTime)
    }

    @MainActor
    func testEditingLegacyEntryKeepsUnknownFirstSaveDate() throws {
        let suiteName = "tastebuddy.advanced-storage.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let editTime = Date(timeIntervalSince1970: 1_700_001_000)
        let legacy = DiningEntry(
            restaurant: "옛 식당",
            menu: "옛 메뉴",
            savedAt: nil,
            updatedAt: nil,
            rating: 4,
            note: "원래 기록"
        )
        defaults.set(
            try JSONEncoder().encode([legacy]),
            forKey: "tastebuddy.ios.dining-entries.v1"
        )
        let model = AppModel(defaults: defaults, now: { editTime })
        let edit = DiningEntry(
            id: legacy.id,
            mealID: legacy.mealID,
            restaurant: legacy.restaurant,
            menu: legacy.menu,
            observedAt: legacy.observedAt,
            rating: legacy.rating,
            note: "수정한 기록"
        )

        model.updateDiningEntry(edit)

        XCTAssertNil(model.diningEntries.first?.savedAt)
        XCTAssertEqual(model.diningEntries.first?.updatedAt, editTime)
    }

    @MainActor
    func testAdditionalMenuDraftSharesOnlyExplicitMealContextAndDeleteRemovesOneRecord() throws {
        let suiteName = "tastebuddy.advanced-storage.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let mealID = UUID()
        let observedAt = Date(timeIntervalSince1970: 1_700_010_000)
        let original = DiningEntry(
            mealID: mealID,
            restaurant: "밍글스",
            restaurantID: "mingles",
            menu: "첫 접시",
            menuItemID: "dish-first",
            observedAt: observedAt,
            rating: 4,
            note: "좋았어요."
        )
        let model = AppModel(defaults: defaults)
        model.addDiningEntry(original)
        let storedOriginal = try XCTUnwrap(model.diningEntry(id: original.id))
        let secondID = UUID()
        let draft = try XCTUnwrap(model.additionalMenuDraft(for: original.id, id: secondID))

        XCTAssertEqual(draft.id, secondID)
        XCTAssertEqual(draft.mealID, mealID)
        XCTAssertEqual(draft.observedAt, observedAt)
        XCTAssertEqual(draft.restaurantID, "mingles")
        XCTAssertEqual(draft.restaurant, "밍글스")
        XCTAssertEqual(draft.menu, "")
        XCTAssertNil(draft.menuItemID)
        XCTAssertNil(draft.savedAt)
        XCTAssertNil(draft.updatedAt)
        XCTAssertEqual(draft.feedbackStatus, .captured)

        model.addDiningEntry(draft)
        XCTAssertEqual(model.diningEntries(mealID: mealID).count, 2)
        model.removeDiningEntry(id: secondID)
        XCTAssertEqual(model.diningEntries(mealID: mealID), [storedOriginal])
    }

    @MainActor
    func testQuestionExposureIsRecordedOnceAndDismissalRestoresPerUser() throws {
        let suiteName = "tastebuddy.advanced-question.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let exposedAt = Date(timeIntervalSince1970: 1_700_020_000)
        let dismissedAt = Date(timeIntervalSince1970: 1_700_020_100)
        var clock = exposedAt
        let model = AppModel(defaults: defaults, now: { clock })

        XCTAssertTrue(model.shouldPresentPersonalTasteQuestion(id: "question-sour-sauce", userID: "owner-a"))
        model.recordPersonalTasteQuestionExposure(id: "question-sour-sauce", userID: "owner-a")
        clock = dismissedAt
        model.recordPersonalTasteQuestionExposure(id: "question-sour-sauce", userID: "owner-a")
        let exposed = try XCTUnwrap(
            model.personalTasteQuestionProgressByUser["owner-a"]?["question-sour-sauce"]
        )
        XCTAssertEqual(exposed.firstExposedAt, exposedAt)
        XCTAssertEqual(exposed.status, .active)
        XCTAssertTrue(model.shouldPresentPersonalTasteQuestion(id: "question-sour-sauce", userID: "owner-a"))

        model.dismissPersonalTasteQuestion(id: "question-sour-sauce", userID: "owner-a")
        XCTAssertFalse(model.shouldPresentPersonalTasteQuestion(id: "question-sour-sauce", userID: "owner-a"))
        XCTAssertTrue(model.shouldPresentPersonalTasteQuestion(id: "question-sour-sauce", userID: "owner-b"))

        let reopened = AppModel(defaults: defaults)
        XCTAssertFalse(reopened.shouldPresentPersonalTasteQuestion(id: "question-sour-sauce", userID: "owner-a"))
        XCTAssertTrue(reopened.shouldPresentPersonalTasteQuestion(id: "question-sour-sauce", userID: "owner-b"))
        XCTAssertEqual(
            reopened.personalTasteQuestionProgressByUser["owner-a"]?["question-sour-sauce"]?.statusChangedAt,
            dismissedAt
        )
    }
}
