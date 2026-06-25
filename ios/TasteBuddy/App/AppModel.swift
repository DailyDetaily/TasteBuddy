import Combine
import Foundation

enum RestaurantBookmarkConstants {
    static let defaultListID = "default-saved"
}

enum BookmarkCoverIconID: String, CaseIterable, Codable, Identifiable {
    case beef
    case cakeSlice = "cake-slice"
    case coffee
    case cookingPot = "cooking-pot"
    case croissant
    case cupSoda = "cup-soda"
    case dessert
    case eggFried = "egg-fried"
    case fish
    case salad
    case sandwich
    case soup
    case utensils
    case wine

    // Keep legacy values decodable for lists created before the Lucide food set shipped.
    case chefHat
    case sparkles
    case store

    static let allCases: [BookmarkCoverIconID] = [
        .beef,
        .cakeSlice,
        .coffee,
        .cookingPot,
        .croissant,
        .cupSoda,
        .dessert,
        .eggFried,
        .fish,
        .salad,
        .sandwich,
        .soup,
        .utensils,
        .wine
    ]

    var id: String { rawValue }

    var icon: LucideIconName {
        switch self {
        case .beef: .beef
        case .cakeSlice: .cakeSlice
        case .coffee: .coffee
        case .cookingPot: .cookingPot
        case .croissant: .croissant
        case .cupSoda: .cupSoda
        case .dessert: .dessert
        case .eggFried: .eggFried
        case .fish: .fish
        case .salad: .salad
        case .sandwich: .sandwich
        case .soup: .soup
        case .utensils: .utensils
        case .wine: .wine
        case .chefHat: .chefHat
        case .sparkles: .sparkles
        case .store: .store
        }
    }
}

struct RestaurantBookmarkList: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var description: String
    var isPrivate: Bool
    var coverIconID: BookmarkCoverIconID
    var coverTasteID: TasteAxis

    var visibilityLabel: String {
        isPrivate ? "비밀 리스트" : "공개 리스트"
    }
}

struct RestaurantBookmarkRecord: Identifiable, Codable, Equatable {
    var id: String { restaurantID }
    let chefName: String
    var listID: String
    let restaurantID: String
    let restaurantName: String
    let savedAt: Date
}

enum RestaurantBookmarkMutationKind: String, Codable, Equatable {
    case createList
    case saveBookmark
    case removeBookmark
}

struct RestaurantBookmarkPendingMutation: Identifiable, Codable, Equatable {
    let id: String
    let kind: RestaurantBookmarkMutationKind
    let restaurantID: String?
    let listID: String?
    let createdAt: Date

    init(
        id: String = UUID().uuidString,
        kind: RestaurantBookmarkMutationKind,
        restaurantID: String? = nil,
        listID: String? = nil,
        createdAt: Date = .now
    ) {
        self.id = id
        self.kind = kind
        self.restaurantID = restaurantID
        self.listID = listID
        self.createdAt = createdAt
    }
}

struct RestaurantBookmarkState: Codable, Equatable {
    let lists: [RestaurantBookmarkList]
    let bookmarks: [RestaurantBookmarkRecord]
}

struct RestaurantBookmarkConflictResolution: Equatable {
    let state: RestaurantBookmarkState
    let conflictCount: Int
    let suppressedRemoteBookmarkCount: Int

    var hasRemoteConflict: Bool {
        conflictCount > 0 || suppressedRemoteBookmarkCount > 0
    }
}

enum RestaurantBookmarkSyncStatus: Equatable {
    case idle
    case pending(Int)
    case syncing(Int)
    case synced(Date)
    case conflictResolved(Date, Int)
    case failed(String, Int)

    var isVisible: Bool {
        switch self {
        case .idle, .synced:
            return false
        case .pending, .syncing, .conflictResolved, .failed:
            return true
        }
    }

    var title: String {
        switch self {
        case .idle:
            return "북마크 동기화"
        case .pending:
            return "동기화 대기"
        case .syncing:
            return "동기화 중"
        case .synced:
            return "동기화 완료"
        case .conflictResolved:
            return "동기화 정리됨"
        case .failed:
            return "동기화 보류"
        }
    }

    var detail: String {
        switch self {
        case .idle:
            return "로컬 상태"
        case .pending(let count):
            return "\(count)개 변경 대기"
        case .syncing(let count):
            return "\(count)개 전송 중"
        case .synced:
            return "최신 상태"
        case .conflictResolved(_, let count):
            return "\(count)개 충돌 반영"
        case .failed(let message, let count):
            return "\(message) · \(count)개 대기"
        }
    }
}

enum RestaurantBookmarkSyncEngine {
    static func resolve(
        local: RestaurantBookmarkState,
        remote: RestaurantBookmarkState,
        pendingMutations: [RestaurantBookmarkPendingMutation]
    ) -> RestaurantBookmarkConflictResolution {
        let locallyRemovedRestaurantIDs = Set(
            pendingMutations
                .filter { $0.kind == .removeBookmark }
                .compactMap(\.restaurantID)
        )

        let resolvedLists = dedupedLists(local.lists + remote.lists)
        let remoteBookmarks = remote.bookmarks.filter {
            !locallyRemovedRestaurantIDs.contains($0.restaurantID)
        }
        let suppressedRemoteCount = remote.bookmarks.count - remoteBookmarks.count
        let bookmarkResolution = dedupedBookmarks(local.bookmarks + remoteBookmarks)

        return RestaurantBookmarkConflictResolution(
            state: RestaurantBookmarkState(
                lists: resolvedLists,
                bookmarks: bookmarkResolution.bookmarks.sorted { $0.savedAt > $1.savedAt }
            ),
            conflictCount: bookmarkResolution.conflictCount,
            suppressedRemoteBookmarkCount: suppressedRemoteCount
        )
    }

    private static func dedupedLists(
        _ lists: [RestaurantBookmarkList]
    ) -> [RestaurantBookmarkList] {
        var seenIDs: Set<String> = []
        var nextLists: [RestaurantBookmarkList] = []

        for list in lists where !seenIDs.contains(list.id) {
            seenIDs.insert(list.id)
            nextLists.append(list)
        }

        return nextLists
    }

    private static func dedupedBookmarks(
        _ bookmarks: [RestaurantBookmarkRecord]
    ) -> (bookmarks: [RestaurantBookmarkRecord], conflictCount: Int) {
        var bookmarkByRestaurantID: [String: RestaurantBookmarkRecord] = [:]
        var conflictCount = 0

        for bookmark in bookmarks {
            guard let existing = bookmarkByRestaurantID[bookmark.restaurantID] else {
                bookmarkByRestaurantID[bookmark.restaurantID] = bookmark
                continue
            }

            if existing != bookmark {
                conflictCount += 1
            }

            if bookmark.savedAt > existing.savedAt {
                bookmarkByRestaurantID[bookmark.restaurantID] = bookmark
            }
        }

        return (Array(bookmarkByRestaurantID.values), conflictCount)
    }
}

struct UserProfileIdentity: Codable, Equatable {
    var displayName: String
    var nickname: String
    var birthDate: String?
    var sexContext: String?
    var smokingStatus: String?
    var dietaryRestrictions: [String]

    static let `default` = UserProfileIdentity(
        displayName: "신준호",
        nickname: "머리아깨무봄발",
        birthDate: nil,
        sexContext: nil,
        smokingStatus: nil,
        dietaryRestrictions: []
    )

    var normalizedNickname: String {
        nickname
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "@"))
    }

    var displayNickname: String {
        let normalized = normalizedNickname
        return normalized.isEmpty ? "@tastebuddy" : "@\(normalized)"
    }

    var sanitized: UserProfileIdentity {
        let trimmedDisplayName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedNickname = normalizedNickname
        return UserProfileIdentity(
            displayName: trimmedDisplayName.isEmpty ? UserProfileIdentity.default.displayName : trimmedDisplayName,
            nickname: trimmedNickname.isEmpty ? UserProfileIdentity.default.nickname : trimmedNickname,
            birthDate: birthDate,
            sexContext: sexContext,
            smokingStatus: smokingStatus,
            dietaryRestrictions: dietaryRestrictions
        )
    }
}

@MainActor
final class AppModel: ObservableObject {
    @Published private(set) var hasCompletedAuthEntry: Bool
    @Published private(set) var hasSeenOnboarding: Bool
    @Published private(set) var preferenceIntakeDraft: PreferenceIntakeResponsesContract?
    @Published private(set) var preferenceProfile: PreferenceIntakeProfileContract?
    @Published private(set) var profile: TasteProfile?
    @Published private(set) var profileIdentity: UserProfileIdentity = .default
    @Published private(set) var profileAvatarImageData: Data?
    @Published private(set) var diningEntries: [DiningEntry]
    @Published private(set) var savedRestaurantIDs: Set<String>
    @Published private(set) var bookmarkLists: [RestaurantBookmarkList]
    @Published private(set) var restaurantBookmarks: [RestaurantBookmarkRecord]
    @Published private(set) var pendingBookmarkMutations: [RestaurantBookmarkPendingMutation]
    @Published private(set) var bookmarkSyncStatus: RestaurantBookmarkSyncStatus
    @Published private(set) var dishFeedbackComments: [String: [DishFeedbackComment]]
    @Published private(set) var backendSessionStatus: BackendSessionStatus

    private let defaults: UserDefaults
    private let sessionRepository: any BackendSessionRepository
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private var hasRestoredBackendSession = false

    private enum Key {
        static let authEntry = "tastebuddy.ios.auth-entry.v1"
        static let onboarding = "tastebuddy.ios.onboarding.v1"
        static let preferenceIntakeDraft = "tastebuddy.ios.preference-intake-draft.v1"
        static let preferenceProfile = "tastebuddy.ios.preference-profile.v1"
        static let profile = "tastebuddy.ios.profile.v1"
        static let profileIdentity = "tastebuddy.ios.profile-identity.v1"
        static let profileAvatarImageData = "tastebuddy.ios.profile-avatar-image-data.v1"
        static let diningEntries = "tastebuddy.ios.dining-entries.v1"
        static let savedRestaurantIDs = "tastebuddy.ios.saved-restaurant-ids.v1"
        static let bookmarkLists = "tastebuddy.ios.restaurant-bookmark-lists.v1"
        static let restaurantBookmarks = "tastebuddy.ios.restaurant-bookmarks.v1"
        static let pendingBookmarkMutations = "tastebuddy.ios.restaurant-bookmark-pending-mutations.v1"
        static let dishFeedbackComments = "tastebuddy.ios.dish-feedback-comments.v1"
    }

    init(
        defaults: UserDefaults = .standard,
        sessionRepository: any BackendSessionRepository = BackendSessionRepositoryFactory.makeDefault()
    ) {
        self.defaults = defaults
        self.sessionRepository = sessionRepository
        backendSessionStatus = .restoring
        hasCompletedAuthEntry = false
        hasSeenOnboarding = defaults.bool(forKey: Key.onboarding)

        if let draftData = defaults.data(forKey: Key.preferenceIntakeDraft) {
            preferenceIntakeDraft = try? decoder.decode(
                PreferenceIntakeResponsesContract.self,
                from: draftData
            )
        }

        if let preferenceData = defaults.data(forKey: Key.preferenceProfile) {
            preferenceProfile = try? decoder.decode(
                PreferenceIntakeProfileContract.self,
                from: preferenceData
            )
        }

        if let profileData = defaults.data(forKey: Key.profile) {
            profile = try? decoder.decode(TasteProfile.self, from: profileData)
        }

        if let profileIdentityData = defaults.data(forKey: Key.profileIdentity),
           let decodedProfileIdentity = try? decoder.decode(
            UserProfileIdentity.self,
            from: profileIdentityData
           ) {
            profileIdentity = decodedProfileIdentity.sanitized
        }

        profileAvatarImageData = defaults.data(forKey: Key.profileAvatarImageData)

        if let diningData = defaults.data(forKey: Key.diningEntries),
           let decodedEntries = try? decoder.decode([DiningEntry].self, from: diningData) {
            diningEntries = decodedEntries.sorted { $0.date > $1.date }
        } else {
            diningEntries = []
        }

        let decodedSavedRestaurantIDs: Set<String>
        if let savedRestaurantData = defaults.data(forKey: Key.savedRestaurantIDs),
           let decodedIDs = try? decoder.decode([String].self, from: savedRestaurantData) {
            decodedSavedRestaurantIDs = Set(decodedIDs)
        } else {
            decodedSavedRestaurantIDs = []
        }

        if let bookmarkListData = defaults.data(forKey: Key.bookmarkLists),
           let decodedLists = try? decoder.decode(
            [RestaurantBookmarkList].self,
            from: bookmarkListData
           ) {
            bookmarkLists = decodedLists
        } else {
            bookmarkLists = []
        }

        let decodedRestaurantBookmarks: [RestaurantBookmarkRecord]
        if let bookmarkData = defaults.data(forKey: Key.restaurantBookmarks),
           let decodedBookmarks = try? decoder.decode(
            [RestaurantBookmarkRecord].self,
            from: bookmarkData
           ) {
            decodedRestaurantBookmarks = decodedBookmarks.sorted { $0.savedAt > $1.savedAt }
        } else {
            decodedRestaurantBookmarks = AppModel.bookmarkRecords(from: decodedSavedRestaurantIDs)
        }
        restaurantBookmarks = decodedRestaurantBookmarks
        savedRestaurantIDs = decodedSavedRestaurantIDs.union(decodedRestaurantBookmarks.map(\.restaurantID))

        let decodedPendingBookmarkMutations: [RestaurantBookmarkPendingMutation]
        if let pendingBookmarkMutationData = defaults.data(forKey: Key.pendingBookmarkMutations),
           let decodedPendingMutations = try? decoder.decode(
            [RestaurantBookmarkPendingMutation].self,
            from: pendingBookmarkMutationData
           ) {
            decodedPendingBookmarkMutations = decodedPendingMutations
        } else {
            decodedPendingBookmarkMutations = []
        }
        pendingBookmarkMutations = decodedPendingBookmarkMutations
        bookmarkSyncStatus = decodedPendingBookmarkMutations.isEmpty
            ? .idle
            : .pending(decodedPendingBookmarkMutations.count)

        if let commentData = defaults.data(forKey: Key.dishFeedbackComments),
           let decodedComments = try? decoder.decode(
            [String: [DishFeedbackComment]].self,
            from: commentData
           ) {
            dishFeedbackComments = decodedComments
        } else {
            dishFeedbackComments = TasteBuddyNativeContent.seededDishFeedbackComments
        }
    }

    func restoreBackendSessionIfNeeded() async {
        guard !hasRestoredBackendSession else {
            return
        }

        hasRestoredBackendSession = true
        backendSessionStatus = .restoring
        backendSessionStatus = await sessionRepository.restoreSession()
    }

    func completeOnboarding() {
        hasSeenOnboarding = true
        defaults.set(true, forKey: Key.onboarding)
    }

    func completeAuthEntry() {
        hasCompletedAuthEntry = true
    }

    func completeVerifiedEmailAuthEntry() {
        completeAuthEntry()
        backendSessionStatus = .authenticated
    }

    func returnToOnboarding() {
        hasSeenOnboarding = false
        defaults.set(false, forKey: Key.onboarding)
    }

    func savePreferenceIntakeDraft(_ responses: PreferenceIntakeResponsesContract) {
        preferenceIntakeDraft = responses
        defaults.set(
            try? encoder.encode(responses),
            forKey: Key.preferenceIntakeDraft
        )
    }

    func completePreferenceIntake(_ profile: PreferenceIntakeProfileContract) {
        preferenceProfile = profile
        preferenceIntakeDraft = nil
        defaults.set(
            try? encoder.encode(profile),
            forKey: Key.preferenceProfile
        )
        defaults.removeObject(forKey: Key.preferenceIntakeDraft)
    }

    func returnToPreferenceIntake() {
        preferenceIntakeDraft = preferenceProfile
        preferenceProfile = nil

        if let preferenceIntakeDraft {
            defaults.set(
                try? encoder.encode(preferenceIntakeDraft),
                forKey: Key.preferenceIntakeDraft
            )
        }
        defaults.removeObject(forKey: Key.preferenceProfile)
    }

    func saveProfile(_ profile: TasteProfile) {
        self.profile = profile
        defaults.set(try? encoder.encode(profile), forKey: Key.profile)
    }

    func saveProfileIdentity(_ identity: UserProfileIdentity) {
        let sanitizedIdentity = identity.sanitized
        profileIdentity = sanitizedIdentity
        defaults.set(
            try? encoder.encode(sanitizedIdentity),
            forKey: Key.profileIdentity
        )
    }

    func saveProfileAvatarImageData(_ data: Data?) {
        profileAvatarImageData = data

        if let data {
            defaults.set(data, forKey: Key.profileAvatarImageData)
        } else {
            defaults.removeObject(forKey: Key.profileAvatarImageData)
        }
    }

    func addDiningEntry(_ entry: DiningEntry) {
        diningEntries.insert(entry, at: 0)
        saveDiningEntries()
    }

    func updateDiningEntry(_ entry: DiningEntry) {
        if let index = diningEntries.firstIndex(where: { $0.id == entry.id }) {
            let previousPhotoFilename = diningEntries[index].reflectionPhotoFilename
            diningEntries[index] = entry
            if previousPhotoFilename != entry.reflectionPhotoFilename {
                DiningReflectionPhotoStore.remove(filename: previousPhotoFilename)
            }
        } else {
            diningEntries.insert(entry, at: 0)
        }

        diningEntries.sort { $0.date > $1.date }
        saveDiningEntries()
    }

    func removeDiningEntry(id: UUID) {
        let photoFilename = diningEntries.first { $0.id == id }?.reflectionPhotoFilename
        diningEntries.removeAll { $0.id == id }
        DiningReflectionPhotoStore.remove(filename: photoFilename)
        saveDiningEntries()
    }

    func isRestaurantSaved(id: String) -> Bool {
        savedRestaurantIDs.contains(id) || restaurantBookmarks.contains { $0.restaurantID == id }
    }

    func saveRestaurant(id: String) {
        savedRestaurantIDs.insert(id)
        persistSavedRestaurantIDs()
    }

    func removeSavedRestaurant(id: String) {
        savedRestaurantIDs.remove(id)
        restaurantBookmarks.removeAll { $0.restaurantID == id }
        persistSavedRestaurantIDs()
        persistRestaurantBookmarks()
    }

    func toggleSavedRestaurant(id: String) {
        if savedRestaurantIDs.contains(id) {
            removeSavedRestaurant(id: id)
        } else {
            saveRestaurant(id: id)
        }
    }

    func bookmarkRecord(for restaurantID: String) -> RestaurantBookmarkRecord? {
        restaurantBookmarks.first { $0.restaurantID == restaurantID }
    }

    func bookmarkList(id: String?) -> RestaurantBookmarkList? {
        guard let id else { return nil }
        return bookmarkLists.first { $0.id == id }
    }

    func createBookmarkList(
        name: String,
        description: String = "내 기준으로 다시 살펴볼 레스토랑 리스트",
        isPrivate: Bool,
        coverIconID: BookmarkCoverIconID,
        coverTasteID: TasteAxis,
        queueSyncMutation: Bool = true
    ) -> RestaurantBookmarkList {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let slug = trimmedName
            .lowercased()
            .replacingOccurrences(of: "\\s+", with: "-", options: .regularExpression)
        let list = RestaurantBookmarkList(
            id: "list-\(slug)-\(Int(Date().timeIntervalSince1970 * 1000))",
            name: trimmedName,
            description: description,
            isPrivate: isPrivate,
            coverIconID: coverIconID,
            coverTasteID: coverTasteID
        )

        bookmarkLists.insert(list, at: 0)
        persistBookmarkLists()

        if queueSyncMutation {
            enqueueBookmarkMutation(
                kind: .createList,
                restaurantID: nil,
                listID: list.id
            )
        }

        return list
    }

    func saveRestaurantBookmark(
        restaurant: RestaurantSummary,
        listID: String = RestaurantBookmarkConstants.defaultListID,
        savedAt: Date = Date(),
        queueSyncMutation: Bool = true
    ) {
        restaurantBookmarks.removeAll { $0.restaurantID == restaurant.id }
        restaurantBookmarks.insert(
            RestaurantBookmarkRecord(
                chefName: restaurant.chefName,
                listID: listID,
                restaurantID: restaurant.id,
                restaurantName: restaurant.name,
                savedAt: savedAt
            ),
            at: 0
        )

        savedRestaurantIDs.insert(restaurant.id)
        persistSavedRestaurantIDs()
        persistRestaurantBookmarks()

        if queueSyncMutation {
            enqueueBookmarkMutation(
                kind: .saveBookmark,
                restaurantID: restaurant.id,
                listID: listID
            )
        }
    }

    func ensureRestaurantBookmark(restaurant: RestaurantSummary) {
        guard bookmarkRecord(for: restaurant.id) == nil else { return }
        saveRestaurantBookmark(restaurant: restaurant)
    }

    func removeRestaurantBookmark(
        restaurantID: String,
        queueSyncMutation: Bool = true
    ) {
        savedRestaurantIDs.remove(restaurantID)
        restaurantBookmarks.removeAll { $0.restaurantID == restaurantID }
        persistSavedRestaurantIDs()
        persistRestaurantBookmarks()

        if queueSyncMutation {
            enqueueBookmarkMutation(
                kind: .removeBookmark,
                restaurantID: restaurantID,
                listID: nil
            )
        }
    }

    func exportRestaurantBookmarkState() -> RestaurantBookmarkState {
        RestaurantBookmarkState(
            lists: bookmarkLists,
            bookmarks: restaurantBookmarks.sorted { $0.savedAt > $1.savedAt }
        )
    }

    @discardableResult
    func applyRemoteRestaurantBookmarkState(
        _ remoteState: RestaurantBookmarkState,
        resolvedAt: Date = .now
    ) -> RestaurantBookmarkConflictResolution {
        let resolution = RestaurantBookmarkSyncEngine.resolve(
            local: exportRestaurantBookmarkState(),
            remote: remoteState,
            pendingMutations: pendingBookmarkMutations
        )

        bookmarkLists = resolution.state.lists
        restaurantBookmarks = resolution.state.bookmarks
        savedRestaurantIDs = savedRestaurantIDs.union(restaurantBookmarks.map(\.restaurantID))
        pendingBookmarkMutations = []
        bookmarkSyncStatus = resolution.hasRemoteConflict
            ? .conflictResolved(resolvedAt, resolution.conflictCount + resolution.suppressedRemoteBookmarkCount)
            : .synced(resolvedAt)

        persistBookmarkLists()
        persistSavedRestaurantIDs()
        persistRestaurantBookmarks()
        persistPendingBookmarkMutations()

        return resolution
    }

    func markRestaurantBookmarkSyncing() {
        bookmarkSyncStatus = .syncing(pendingBookmarkMutations.count)
    }

    func markRestaurantBookmarkSyncFailed(_ message: String) {
        bookmarkSyncStatus = .failed(message, pendingBookmarkMutations.count)
    }

    func markRestaurantBookmarkSynced(at date: Date = .now) {
        pendingBookmarkMutations = []
        bookmarkSyncStatus = .synced(date)
        persistPendingBookmarkMutations()
    }

    func comments(for feedbackID: String) -> [DishFeedbackComment] {
        dishFeedbackComments[feedbackID] ?? []
    }

    func dishFeedbackItemWithCurrentComments(
        _ item: DiningDishFeedbackItem
    ) -> DiningDishFeedbackItem {
        var updatedItem = item
        updatedItem.commentCount = comments(for: item.id).count
        return updatedItem
    }

    func addDishFeedbackComment(
        feedbackID: String,
        message: String,
        authorName: String = "신준호",
        axis: TasteAxis = .umami
    ) {
        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedMessage.isEmpty else { return }

        var comments = dishFeedbackComments[feedbackID] ?? []
        comments.append(
            DishFeedbackComment(
                authorName: authorName,
                message: trimmedMessage,
                axis: axis
            )
        )
        dishFeedbackComments[feedbackID] = comments
        persistDishFeedbackComments()
    }

    func restartCalibration() {
        profile = nil
        defaults.removeObject(forKey: Key.profile)
    }

    func resetAll() {
        hasCompletedAuthEntry = false
        hasSeenOnboarding = false
        preferenceIntakeDraft = nil
        preferenceProfile = nil
        profile = nil
        profileIdentity = .default
        profileAvatarImageData = nil
        diningEntries = []
        savedRestaurantIDs = []
        bookmarkLists = []
        restaurantBookmarks = []
        pendingBookmarkMutations = []
        bookmarkSyncStatus = .idle
        dishFeedbackComments = TasteBuddyNativeContent.seededDishFeedbackComments
        backendSessionStatus = .restoring
        hasRestoredBackendSession = false
        defaults.removeObject(forKey: Key.authEntry)
        defaults.removeObject(forKey: Key.onboarding)
        defaults.removeObject(forKey: Key.preferenceIntakeDraft)
        defaults.removeObject(forKey: Key.preferenceProfile)
        defaults.removeObject(forKey: Key.profile)
        defaults.removeObject(forKey: Key.profileIdentity)
        defaults.removeObject(forKey: Key.profileAvatarImageData)
        defaults.removeObject(forKey: Key.diningEntries)
        defaults.removeObject(forKey: Key.savedRestaurantIDs)
        defaults.removeObject(forKey: Key.bookmarkLists)
        defaults.removeObject(forKey: Key.restaurantBookmarks)
        defaults.removeObject(forKey: Key.pendingBookmarkMutations)
        defaults.removeObject(forKey: Key.dishFeedbackComments)
    }

    private func saveDiningEntries() {
        defaults.set(try? encoder.encode(diningEntries), forKey: Key.diningEntries)
    }

    private func persistSavedRestaurantIDs() {
        defaults.set(
            try? encoder.encode(savedRestaurantIDs.sorted()),
            forKey: Key.savedRestaurantIDs
        )
    }

    private func persistBookmarkLists() {
        defaults.set(try? encoder.encode(bookmarkLists), forKey: Key.bookmarkLists)
    }

    private func persistRestaurantBookmarks() {
        defaults.set(
            try? encoder.encode(restaurantBookmarks.sorted { $0.savedAt > $1.savedAt }),
            forKey: Key.restaurantBookmarks
        )
    }

    private func enqueueBookmarkMutation(
        kind: RestaurantBookmarkMutationKind,
        restaurantID: String?,
        listID: String?
    ) {
        pendingBookmarkMutations.append(
            RestaurantBookmarkPendingMutation(
                kind: kind,
                restaurantID: restaurantID,
                listID: listID
            )
        )
        bookmarkSyncStatus = .pending(pendingBookmarkMutations.count)
        persistPendingBookmarkMutations()
    }

    private func persistPendingBookmarkMutations() {
        defaults.set(
            try? encoder.encode(pendingBookmarkMutations),
            forKey: Key.pendingBookmarkMutations
        )
    }

    private func persistDishFeedbackComments() {
        defaults.set(
            try? encoder.encode(dishFeedbackComments),
            forKey: Key.dishFeedbackComments
        )
    }

    static func preview(
        authEntryComplete: Bool = false,
        onboardingComplete: Bool = false,
        preferenceProfile: PreferenceIntakeProfileContract? = nil,
        profile: TasteProfile? = nil,
        diningEntries: [DiningEntry] = [],
        savedRestaurantIDs: Set<String> = [],
        bookmarkLists: [RestaurantBookmarkList] = [],
        restaurantBookmarks: [RestaurantBookmarkRecord] = [],
        pendingBookmarkMutations: [RestaurantBookmarkPendingMutation] = [],
        dishFeedbackComments: [String: [DishFeedbackComment]] =
            TasteBuddyNativeContent.seededDishFeedbackComments,
        sessionRepository: any BackendSessionRepository = FixtureBackendSessionRepository(status: .signedOut)
    ) -> AppModel {
        let suiteName = "tastebuddy.preview.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.set(onboardingComplete, forKey: Key.onboarding)
        defaults.set(try? JSONEncoder().encode(preferenceProfile), forKey: Key.preferenceProfile)
        defaults.set(try? JSONEncoder().encode(profile), forKey: Key.profile)
        defaults.set(try? JSONEncoder().encode(diningEntries), forKey: Key.diningEntries)
        defaults.set(
            try? JSONEncoder().encode(savedRestaurantIDs.sorted()),
            forKey: Key.savedRestaurantIDs
        )
        defaults.set(try? JSONEncoder().encode(bookmarkLists), forKey: Key.bookmarkLists)
        defaults.set(
            try? JSONEncoder().encode(restaurantBookmarks),
            forKey: Key.restaurantBookmarks
        )
        defaults.set(
            try? JSONEncoder().encode(pendingBookmarkMutations),
            forKey: Key.pendingBookmarkMutations
        )
        defaults.set(
            try? JSONEncoder().encode(dishFeedbackComments),
            forKey: Key.dishFeedbackComments
        )
        let model = AppModel(defaults: defaults, sessionRepository: sessionRepository)
        if authEntryComplete {
            model.completeAuthEntry()
        }
        return model
    }

    private static func bookmarkRecords(from ids: Set<String>) -> [RestaurantBookmarkRecord] {
        ids.sorted().map { id in
            let restaurant = RestaurantCatalog.restaurant(id: id)
            return RestaurantBookmarkRecord(
                chefName: restaurant.chefName,
                listID: RestaurantBookmarkConstants.defaultListID,
                restaurantID: restaurant.id,
                restaurantName: restaurant.name,
                savedAt: Date(timeIntervalSince1970: 0)
            )
        }
    }
}
