import Foundation

/// Existing persistence keys. Keep raw values stable across app versions and clients.
enum NativeAccountStorageKey {
    static let authEntry = "tastebuddy.ios.auth-entry.v1"
    static let onboarding = "tastebuddy.ios.onboarding.v1"
    static let preferenceIntakeDraft = "tastebuddy.ios.preference-intake-draft.v1"
    static let preferenceProfile = "tastebuddy.ios.preference-profile.v1"
    static let profile = "tastebuddy.ios.profile.v1"
    static let profileHistory = "tastebuddy.ios.profile-history.v1"
    static let profileIdentity = "tastebuddy.ios.profile-identity.v1"
    static let profileAvatarImageData = "tastebuddy.ios.profile-avatar-image-data.v1"
    static let diningEntries = "tastebuddy.ios.dining-entries.v1"
    static let tbaEvidenceEvents = "tastebuddy.ios.tba-evidence-events.v1"
    static let tbaConfidenceStates = "tastebuddy.ios.tba-confidence-states.v1"
    static let savedRestaurantIDs = "tastebuddy.ios.saved-restaurant-ids.v1"
    static let bookmarkLists = "tastebuddy.ios.restaurant-bookmark-lists.v1"
    static let restaurantBookmarks = "tastebuddy.ios.restaurant-bookmarks.v1"
    static let pendingBookmarkMutations = "tastebuddy.ios.restaurant-bookmark-pending-mutations.v1"
    static let dishFeedbackComments = "tastebuddy.ios.dish-feedback-comments.v1"
    static let rememberedRestaurantMenus = "tastebuddy.ios.restaurant-remembered-menus.v1"
    static let personalTasteQuestionProgress = "tastebuddy.ios.personal-taste-question-progress.v1"
    // 열람 상태는 이 기기/계정에만 저장한다. 원본 백업이나 취향 증거에 섞지 않는다.
    static let homeDiscoveryHistoryPrefix = "tastebuddy.ios.home-discovery-history.v1."
    static let chatGPTExportReceipt = "tastebuddy.ios.chatgpt-export-receipt.v1"
    static let androidArchive = "tastebuddy.android.archive.v1"
    static let activeAccount = "tastebuddy.ios.active-account.v1"
    static let accountArchivePrefix = "tastebuddy.ios.account-archive.v1."
    static let accountDataKeys = [preferenceIntakeDraft, preferenceProfile, profile, profileHistory,
        profileIdentity, profileAvatarImageData, diningEntries, tbaEvidenceEvents, tbaConfidenceStates,
        savedRestaurantIDs, bookmarkLists, restaurantBookmarks, pendingBookmarkMutations,
        dishFeedbackComments, rememberedRestaurantMenus, personalTasteQuestionProgress, chatGPTExportReceipt]
}

/// Value-only boundary for account backup data. No defaults, file writes, network, or UI state.
/// Unknown client-owned values remain opaque; validation never re-encodes the source.
struct NativeAccountSnapshotPolicy {
    private typealias Key = NativeAccountStorageKey
    let decoder: JSONDecoder

    init(decoder: JSONDecoder = JSONDecoder()) {
        self.decoder = decoder
    }

    /// Replace only native-owned values, retaining foreign metadata and unclaimed photo references.
    func makeSnapshot(
        archived: NativeAccountSnapshot?,
        nativeValues: [String: Data],
        hasSeenOnboarding: Bool
    ) -> NativeAccountSnapshot {
        // An older app must never relabel or partially re-encode a newer source format.
        if let archived, !archived.hasSupportedSchema { return archived }
        var values = archived?.values ?? [:]
        for key in Key.accountDataKeys {
            if let data = nativeValues[key] { values[key] = data }
            else { values.removeValue(forKey: key) }
        }
        var snapshot = NativeAccountSnapshot(values: values, hasSeenOnboarding: hasSeenOnboarding)
        let retainedPhotos = archived.map { Set($0.photoFilenames).subtracting(photoFilenames(in: $0)) } ?? []
        snapshot.photoFilenames = Array(retainedPhotos.union(photoFilenames(in: snapshot))).sorted()
        return snapshot
    }

    func unreadableKeys(in snapshot: NativeAccountSnapshot) -> Set<String> {
        Set(snapshot.values.compactMap { key, data in
            if [Key.preferenceIntakeDraft, Key.preferenceProfile, Key.profile].contains(key), data == Data("null".utf8) {
                return nil
            }
            do {
                switch key {
                case Key.preferenceIntakeDraft: _ = try decoder.decode(PreferenceIntakeResponsesContract.self, from: data)
                case Key.preferenceProfile: _ = try decoder.decode(PreferenceIntakeProfileContract.self, from: data)
                case Key.profile: _ = try decoder.decode(TasteProfile.self, from: data)
                case Key.profileHistory: _ = try decoder.decode([TasteProfile].self, from: data)
                case Key.profileIdentity: _ = try decoder.decode(UserProfileIdentity.self, from: data)
                case Key.diningEntries:
                    let entries = try decoder.decode([DiningEntry].self, from: data)
                    guard Set(entries.map(\.id)).count == entries.count,
                          entries.flatMap(\.allReflectionPhotoFilenames).allSatisfy(DiningReflectionPhotoStore.isValidFilename) else {
                        throw NativeAccountDataError.invalidSource
                    }
                case Key.savedRestaurantIDs: _ = try decoder.decode([String].self, from: data)
                case Key.bookmarkLists: _ = try decoder.decode([RestaurantBookmarkList].self, from: data)
                case Key.restaurantBookmarks: _ = try decoder.decode([RestaurantBookmarkRecord].self, from: data)
                case Key.pendingBookmarkMutations: _ = try decoder.decode([RestaurantBookmarkPendingMutation].self, from: data)
                case Key.dishFeedbackComments: _ = try decoder.decode([String: [DishFeedbackComment]].self, from: data)
                case Key.rememberedRestaurantMenus: _ = try decoder.decode([String: [String]].self, from: data)
                case Key.personalTasteQuestionProgress: _ = try decoder.decode([String: [String: PersonalTasteQuestionProgress]].self, from: data)
                case Key.androidArchive: _ = try androidPhotoFilenames(in: data)
                default: break // 사진 바이트와 사용하지 않는 이전 분석 캐시는 원형 그대로 보존한다.
                }
                return nil
            } catch { return key }
        })
    }

    func validate(_ snapshot: NativeAccountSnapshot) throws {
        guard snapshot.hasSupportedSchema else { throw NativeAccountDataError.unsupportedVersion }
        guard unreadableKeys(in: snapshot).isEmpty else { throw NativeAccountDataError.invalidSource }
        guard Set(snapshot.photoFilenames).count == snapshot.photoFilenames.count,
              snapshot.photoFilenames.allSatisfy(DiningReflectionPhotoStore.isValidFilename),
              Set(photoFilenames(in: snapshot)).isSubset(of: Set(snapshot.photoFilenames)) else {
            throw NativeAccountDataError.invalidSource
        }
    }

    /// Best-effort reference discovery is intentionally separate from strict validation above.
    func photoFilenames(in snapshot: NativeAccountSnapshot) -> [String] {
        let entries = snapshot.values[Key.diningEntries].flatMap { try? decoder.decode([DiningEntry].self, from: $0) } ?? []
        let android = snapshot.values[Key.androidArchive].flatMap { try? androidPhotoFilenames(in: $0) } ?? []
        return Array(Set(entries.flatMap(\.allReflectionPhotoFilenames)).union(android)).sorted()
    }

    private func androidPhotoFilenames(in data: Data) throws -> [String] {
        guard let archive = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              archive["schemaVersion"] as? Int == 1,
              let state = archive["state"] as? [String: Any], state["schemaVersion"] as? Int == 1,
              let entries = state["entries"] as? [[String: Any]],
              let manifest = archive["photoFilenames"] as? [String],
              Set(manifest).count == manifest.count,
              manifest.allSatisfy({ $0.range(of: #"\A[A-Za-z0-9_-]{1,251}\.jpg\z"#, options: .regularExpression) != nil }) else {
            throw NativeAccountDataError.invalidSource
        }
        func filename(_ value: Any?) throws -> String? {
            guard let value, !(value is NSNull) else { return nil }
            guard let value = value as? String else { throw NativeAccountDataError.invalidSource }
            return value
        }
        var references = try entries.compactMap { try filename($0["reflectionPhotoFilename"]) }
        if let draftValue = state["draft"], !(draftValue is NSNull) {
            guard let draft = draftValue as? [String: Any], let entry = draft["entry"] as? [String: Any] else {
                throw NativeAccountDataError.invalidSource
            }
            if let photo = try filename(entry["reflectionPhotoFilename"]) { references.append(photo) }
        }
        if let avatar = try filename(state["avatarFilename"]) { references.append(avatar) }
        guard Set(references) == Set(manifest) else { throw NativeAccountDataError.invalidSource }
        return manifest
    }
}
