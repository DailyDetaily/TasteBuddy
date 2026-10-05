import XCTest
@testable import TasteBuddy

final class NativeAccountSnapshotPolicyTests: XCTestCase {
    private typealias Key = NativeAccountStorageKey
    private let policy = NativeAccountSnapshotPolicy()

    func testNativeOwnedKeysKeepTheirExistingOrderAndExcludeForeignAndDeviceState() {
        XCTAssertEqual(Key.accountDataKeys, [
            "tastebuddy.ios.preference-intake-draft.v1", "tastebuddy.ios.preference-profile.v1",
            "tastebuddy.ios.profile.v1", "tastebuddy.ios.profile-history.v1",
            "tastebuddy.ios.profile-identity.v1", "tastebuddy.ios.profile-avatar-image-data.v1",
            "tastebuddy.ios.dining-entries.v1", "tastebuddy.ios.tba-evidence-events.v1",
            "tastebuddy.ios.tba-confidence-states.v1", "tastebuddy.ios.saved-restaurant-ids.v1",
            "tastebuddy.ios.restaurant-bookmark-lists.v1", "tastebuddy.ios.restaurant-bookmarks.v1",
            "tastebuddy.ios.restaurant-bookmark-pending-mutations.v1", "tastebuddy.ios.dish-feedback-comments.v1",
            "tastebuddy.ios.restaurant-remembered-menus.v1", "tastebuddy.ios.personal-taste-question-progress.v1",
            "tastebuddy.ios.chatgpt-export-receipt.v1"
        ])
        XCTAssertEqual(Set(Key.accountDataKeys).count, Key.accountDataKeys.count)
        for key in [Key.androidArchive, Key.activeAccount, Key.onboarding, Key.homeDiscoveryHistoryPrefix] {
            XCTAssertFalse(Key.accountDataKeys.contains(key))
        }
    }

    func testSupportedSchemaPropertyDoesNotChangeTheStoredEnvelope() throws {
        for version in [0, 1, 2, 3, 99] {
            var snapshot = NativeAccountSnapshot()
            snapshot.schemaVersion = version
            XCTAssertEqual(snapshot.hasSupportedSchema, version == 1 || version == 2)
            let data = try JSONEncoder().encode(snapshot)
            let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
            XCTAssertEqual(Set(object.keys), ["schemaVersion", "values", "hasSeenOnboarding", "photoFilenames"])
            XCTAssertEqual(try JSONDecoder().decode(NativeAccountSnapshot.self, from: data), snapshot)
        }
    }

    func testSnapshotReplacementTouchesOnlyNativeOwnedValues() throws {
        let foreignKey = "tastebuddy.web.bookmark-imports.v1"
        let opaque = Data([0, 255, 128, 10])
        var archived = NativeAccountSnapshot(values: [
            Key.savedRestaurantIDs: Data(#"["old"]"#.utf8),
            Key.profile: Data("null".utf8),
            foreignKey: opaque
        ])
        archived.schemaVersion = 1
        let replacement = Data(#"["new"]"#.utf8)
        let result = policy.makeSnapshot(
            archived: archived,
            nativeValues: [Key.savedRestaurantIDs: replacement, foreignKey: Data("not-owned".utf8)],
            hasSeenOnboarding: true
        )
        XCTAssertEqual(result.values, [Key.savedRestaurantIDs: replacement, foreignKey: opaque])
        XCTAssertEqual(result.schemaVersion, 2)
        XCTAssertTrue(result.hasSeenOnboarding)
        XCTAssertEqual(archived.values[Key.profile], Data("null".utf8))
        XCTAssertNoThrow(try policy.validate(result))
    }

    func testFutureSnapshotIsReturnedWithoutReplacingAnySourceOrPhoto() {
        var archived = NativeAccountSnapshot(
            values: [Key.diningEntries: Data("future representation".utf8)],
            photoFilenames: ["future-original.jpg"]
        )
        archived.schemaVersion = 99
        let result = policy.makeSnapshot(
            archived: archived,
            nativeValues: [Key.diningEntries: Data("[]".utf8)],
            hasSeenOnboarding: true
        )
        XCTAssertEqual(result, archived)
    }

    func testSnapshotPhotosRetainForeignReferencesWhileReplacingNativeReferences() throws {
        let android = Data(#"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[{"reflectionPhotoFilename":"android_entry.jpg"}],"draft":{"entry":{"reflectionPhotoFilename":"android_draft.jpg"}},"avatarFilename":"android_avatar.jpg"},"photoFilenames":["android_entry.jpg","android_draft.jpg","android_avatar.jpg"]}"#.utf8)
        let old = try entryData(photo: "old.jpg")
        let current = try entryData(photo: "new.jpg")
        let archived = NativeAccountSnapshot(
            values: [Key.diningEntries: old, Key.androidArchive: android],
            photoFilenames: ["old.jpg", "foreign.jpg", "android_entry.jpg", "android_draft.jpg", "android_avatar.jpg"]
        )
        let result = policy.makeSnapshot(
            archived: archived, nativeValues: [Key.diningEntries: current], hasSeenOnboarding: false
        )
        XCTAssertEqual(result.values[Key.androidArchive], android)
        XCTAssertEqual(result.photoFilenames, ["android_avatar.jpg", "android_draft.jpg", "android_entry.jpg", "foreign.jpg", "new.jpg"])
        XCTAssertEqual(policy.photoFilenames(in: result), ["android_avatar.jpg", "android_draft.jpg", "android_entry.jpg", "new.jpg"])
        XCTAssertNoThrow(try policy.validate(result))
    }

    func testMissingNativeRecordsRemoveOnlyTheirPreviouslyClaimedPhotos() throws {
        let archived = NativeAccountSnapshot(
            values: [Key.diningEntries: try entryData(photo: "removed.jpg")],
            photoFilenames: ["foreign.jpg", "removed.jpg"]
        )
        let result = policy.makeSnapshot(archived: archived, nativeValues: [:], hasSeenOnboarding: false)
        XCTAssertNil(result.values[Key.diningEntries])
        XCTAssertEqual(result.photoFilenames, ["foreign.jpg"])
        XCTAssertNoThrow(try policy.validate(result))
    }

    func testLegacyNullValuesRemainValidOnlyForTheirExistingNullableKeys() throws {
        let null = Data("null".utf8)
        let snapshot = NativeAccountSnapshot(values: [
            Key.preferenceIntakeDraft: null, Key.preferenceProfile: null, Key.profile: null
        ])
        XCTAssertTrue(policy.unreadableKeys(in: snapshot).isEmpty)
        XCTAssertNoThrow(try policy.validate(snapshot))
        XCTAssertEqual(snapshot.values[Key.profile], null)
        XCTAssertEqual(policy.unreadableKeys(in: .init(values: [Key.profileHistory: null])), [Key.profileHistory])
    }

    func testOpaqueBytesAndLegacyAnalysisCachesAreNotDecodedOrRewritten() throws {
        let bytes = Data([0, 255, 128])
        let snapshot = NativeAccountSnapshot(values: [
            Key.profileAvatarImageData: bytes, Key.tbaEvidenceEvents: bytes,
            Key.tbaConfidenceStates: bytes, "future-client.key": bytes
        ])
        let original = snapshot
        XCTAssertTrue(policy.unreadableKeys(in: snapshot).isEmpty)
        XCTAssertNoThrow(try policy.validate(snapshot))
        XCTAssertEqual(snapshot, original)
    }

    func testDuplicateNativeIDsAndUnsafePhotoNamesAreRejected() throws {
        let entry = DiningEntry.sample
        let duplicate = NativeAccountSnapshot(values: [Key.diningEntries: try JSONEncoder().encode([entry, entry])])
        let unsafe = NativeAccountSnapshot(values: [Key.diningEntries: try entryData(photo: "../other.jpg")])
        for snapshot in [duplicate, unsafe] {
            XCTAssertEqual(policy.unreadableKeys(in: snapshot), [Key.diningEntries])
            XCTAssertThrowsError(try policy.validate(snapshot)) {
                XCTAssertEqual($0 as? NativeAccountDataError, .invalidSource)
            }
        }
    }

    func testPhotoManifestAllowsRetainedExtrasButRejectsDuplicatesUnsafeAndMissingNames() throws {
        let values = [Key.diningEntries: try entryData(photo: "current.jpg")]
        XCTAssertNoThrow(try policy.validate(.init(values: values, photoFilenames: ["retained.jpg", "current.jpg"])))
        for filenames in [["current.jpg", "current.jpg"], ["current.jpg", "../other.jpg"], [], ["missing.jpg"]] {
            XCTAssertThrowsError(try policy.validate(.init(values: values, photoFilenames: filenames))) {
                XCTAssertEqual($0 as? NativeAccountDataError, .invalidSource)
            }
        }
    }

    func testAndroidReferenceValidationKeepsDraftAvatarAndManifestRules() throws {
        let valid = Data(#"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[{"reflectionPhotoFilename":"shared.jpg"},{"reflectionPhotoFilename":"shared.jpg"}],"draft":null,"avatarFilename":null},"photoFilenames":["shared.jpg"]}"#.utf8)
        XCTAssertNoThrow(try policy.validate(.init(values: [Key.androidArchive: valid], photoFilenames: ["shared.jpg"])))
        let invalid = [
            #"{"schemaVersion":2,"state":{"schemaVersion":1,"entries":[]},"photoFilenames":[]}"#,
            #"{"schemaVersion":1,"state":{"schemaVersion":2,"entries":[]},"photoFilenames":[]}"#,
            #"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[{"reflectionPhotoFilename":"kept.jpg"}]},"photoFilenames":[]}"#,
            #"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[],"draft":{"entry":{}}},"photoFilenames":["unreferenced.jpg"]}"#,
            #"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[],"draft":false},"photoFilenames":[]}"#,
            #"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[],"avatarFilename":42},"photoFilenames":[]}"#,
            #"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[{"reflectionPhotoFilename":"../other.jpg"}]},"photoFilenames":["../other.jpg"]}"#,
            #"{"schemaVersion":1,"state":{"schemaVersion":1,"entries":[{"reflectionPhotoFilename":"same.jpg"}]},"photoFilenames":["same.jpg","same.jpg"]}"#
        ]
        for source in invalid {
            let snapshot = NativeAccountSnapshot(values: [Key.androidArchive: Data(source.utf8)])
            XCTAssertEqual(policy.unreadableKeys(in: snapshot), [Key.androidArchive], source)
            XCTAssertThrowsError(try policy.validate(snapshot), source) {
                XCTAssertEqual($0 as? NativeAccountDataError, .invalidSource)
            }
        }
    }

    func testBestEffortPhotoDiscoveryDoesNotTurnUnreadableOrFutureSnapshotsIntoValidBackups() {
        var snapshot = NativeAccountSnapshot(values: [
            Key.diningEntries: Data("broken".utf8), Key.androidArchive: Data("broken".utf8)
        ], photoFilenames: ["preserved.jpg"])
        XCTAssertEqual(policy.photoFilenames(in: snapshot), [])
        XCTAssertEqual(policy.unreadableKeys(in: snapshot), [Key.diningEntries, Key.androidArchive])
        XCTAssertThrowsError(try policy.validate(snapshot)) {
            XCTAssertEqual($0 as? NativeAccountDataError, .invalidSource)
        }
        snapshot.schemaVersion = 99
        XCTAssertThrowsError(try policy.validate(snapshot)) {
            XCTAssertEqual($0 as? NativeAccountDataError, .unsupportedVersion)
        }
    }

    private func entryData(photo: String) throws -> Data {
        try JSONEncoder().encode([
            DiningEntry(restaurant: "fixture", menu: "fixture", rating: 4, note: "", reflectionPhotoFilename: photo)
        ])
    }
}

extension NativeAccountSnapshotPolicyTests {
    func testEveryGalleryPhotoMustBeIncludedInTheBackupManifest() throws {
        let entry = DiningEntry(restaurant: "", menu: "기록", rating: 0, note: "", reflectionPhotoFilename: "cover.jpg", additionalPhotoFilenames: ["second.jpg", "third.jpg"])
        let values = [Key.diningEntries: try JSONEncoder().encode([entry])]
        XCTAssertNoThrow(try policy.validate(.init(values: values, photoFilenames: entry.allReflectionPhotoFilenames)))
        XCTAssertThrowsError(try policy.validate(.init(values: values, photoFilenames: ["cover.jpg", "second.jpg"])))
        let invalid = DiningEntry(restaurant: "", menu: "기록", rating: 0, note: "", additionalPhotoFilenames: ["../private.jpg"])
        XCTAssertEqual(policy.unreadableKeys(in: .init(values: [Key.diningEntries: try JSONEncoder().encode([invalid])])), [Key.diningEntries])
    }

    func testRemovingOneGalleryPhotoRemovesOnlyItsOwnedBackupReference() throws {
        let entry = DiningEntry(restaurant: "", menu: "기록", rating: 0, note: "", reflectionPhotoFilename: "cover.jpg", additionalPhotoFilenames: ["second.jpg", "third.jpg"])
        let archived = NativeAccountSnapshot(values: [Key.diningEntries: try JSONEncoder().encode([entry])], photoFilenames: ["cover.jpg", "second.jpg", "third.jpg", "foreign.jpg"])
        let updated = try FoodMemoryDetailPresentation.settingPhotos(in: entry, filenames: ["second.jpg", "third.jpg"], palette: nil)
        let next = policy.makeSnapshot(archived: archived, nativeValues: [Key.diningEntries: try JSONEncoder().encode([updated])], hasSeenOnboarding: true)
        XCTAssertEqual(Set(next.photoFilenames), ["second.jpg", "third.jpg", "foreign.jpg"])
        XCTAssertNoThrow(try policy.validate(next))
    }
}
