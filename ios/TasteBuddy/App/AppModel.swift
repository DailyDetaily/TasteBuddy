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

enum PersonalTasteQuestionProgressStatus: String, Codable, Equatable {
    case active
    case dismissed
    case resolved
}

struct PersonalTasteQuestionProgress: Codable, Equatable {
    let questionID: String
    let firstExposedAt: Date
    var status: PersonalTasteQuestionProgressStatus
    var statusChangedAt: Date?
}

struct PersonalTasteQuestionResponseContext: Identifiable, Equatable {
    let selection: PersonalTasteNextSelection
    let userID: String
    let sourceEntryID: UUID?
    let sourceTarget: String
    let sourcePhase: String
    let sourceReference: String?
    let entryIDsAtStart: Set<UUID>
    let mealIDsAtStart: Set<UUID>
    var sourceSelectionEvidence: SensorySelectionEvidence? = nil

    var id: String { selection.id }
}

enum PersonalTasteQuestionSaveResult: Equatable {
    case updated(resolved: Bool)
    case added(resolved: Bool)
    case sourceUnavailable
}

@MainActor
final class AppModel: ObservableObject {
    @Published private(set) var hasCompletedAuthEntry = false
    @Published private(set) var hasSeenOnboarding = false
    @Published private(set) var preferenceIntakeDraft: PreferenceIntakeResponsesContract?
    @Published private(set) var preferenceProfile: PreferenceIntakeProfileContract?
    @Published private(set) var profile: TasteProfile?
    @Published private(set) var profileHistory: [TasteProfile] = []
    @Published private(set) var profileIdentity: UserProfileIdentity = .default
    @Published private(set) var profileAvatarImageData: Data?
    @Published private(set) var diningEntries: [DiningEntry] = []
    @Published private(set) var sensoryAnalysis: SensoryAnalysisSnapshot = .empty
    @Published private(set) var sensoryAnalysisIsUpdating = false
    @Published private(set) var sensoryAnalysisError: String?
    struct PersonalTasteAnswerUndo: Identifiable {
        let id = UUID()
        let before: DiningEntry
        let after: DiningEntry
        let context: PersonalTasteQuestionResponseContext
    }
    @Published var personalTasteAnswerUndo: PersonalTasteAnswerUndo?

    @Published private(set) var personalTasteQuestionProgressByUser: [String: [String: PersonalTasteQuestionProgress]] = [:]
    @Published private(set) var savedRestaurantIDs: Set<String> = []
    @Published private(set) var bookmarkLists: [RestaurantBookmarkList] = []
    @Published private(set) var restaurantBookmarks: [RestaurantBookmarkRecord] = []
    @Published private(set) var pendingBookmarkMutations: [RestaurantBookmarkPendingMutation] = []
    @Published private(set) var bookmarkSyncStatus: RestaurantBookmarkSyncStatus = .idle
    @Published private(set) var dishFeedbackComments: [String: [DishFeedbackComment]] = [:]
    @Published private(set) var rememberedRestaurantMenus: [String: [String]] = [:]
    @Published private(set) var backendSessionStatus: BackendSessionStatus = .restoring
    @Published private(set) var accountDataSyncError: String?
    @Published private(set) var accountDataHasConflict = false

    private let defaults: UserDefaults
    private let authRepository: any BackendAuthRepository
    private let sessionRepository: any BackendSessionRepository
    private let publicProfileRepository: any BackendPublicProfileRepository
    private let accountDataRepository: any NativeAccountDataRepository
    private let accountPhotoRepository: any NativeAccountPhotoRepository
    private var activeAccountScope: String
    private var accountSyncTask: Task<Void, Never>?
    private var accountSyncID: UUID?
    private var needsAccountSync = false
    private var invalidAccountDataKeys: Set<String> = []
    private let now: () -> Date
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private var hasRestoredBackendSession = false
    private var authenticationRevision = 0
    private var sensoryAnalysisTask: Task<Void, Never>?
    private var sensoryAnalysisRevision = 0

    private enum Key {
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
        static let activeAccount = "tastebuddy.ios.active-account.v1"
        static let accountArchivePrefix = "tastebuddy.ios.account-archive.v1."
        static let accountDataKeys = [preferenceIntakeDraft, preferenceProfile, profile, profileHistory,
            profileIdentity, profileAvatarImageData, diningEntries, tbaEvidenceEvents, tbaConfidenceStates,
            savedRestaurantIDs, bookmarkLists, restaurantBookmarks, pendingBookmarkMutations,
            dishFeedbackComments, rememberedRestaurantMenus, personalTasteQuestionProgress]
    }

    init(
        defaults: UserDefaults = .standard,
        authRepository: any BackendAuthRepository = BackendAuthRepositoryFactory.makeDefault(),
        sessionRepository: any BackendSessionRepository = BackendSessionRepositoryFactory.makeDefault(),
        publicProfileRepository: any BackendPublicProfileRepository = BackendPublicProfileRepositoryFactory.makeDefault(),
        accountDataRepository: any NativeAccountDataRepository = NativeAccountDataRepositoryFactory.makeDefault(),
        accountPhotoRepository: any NativeAccountPhotoRepository = NativeAccountPhotoRepositoryFactory.makeDefault(),
        now: @escaping () -> Date = { .now }
    ) {
        self.defaults = defaults
        self.authRepository = authRepository
        self.sessionRepository = sessionRepository
        self.publicProfileRepository = publicProfileRepository
        self.accountDataRepository = accountDataRepository
        self.accountPhotoRepository = accountPhotoRepository
        self.activeAccountScope = defaults.string(forKey: Key.activeAccount)
            ?? authRepository.currentUser.flatMap { $0.isAnonymous ? nil : $0.id.lowercased() }
            ?? "guest"
        self.now = now
        defaults.set(activeAccountScope, forKey: Key.activeAccount)
        reloadPersistedAccountData()
        persistAccountArchive(scheduleSync: false)
    }

    private func reloadPersistedAccountData() {
        invalidAccountDataKeys = unreadableKeys(in: currentAccountSnapshot())
        if !invalidAccountDataKeys.isEmpty { accountDataSyncError = NativeAccountDataError.invalidSource.localizedDescription }
        preferenceIntakeDraft = nil
        preferenceProfile = nil
        profile = nil
        profileIdentity = .default
        personalTasteQuestionProgressByUser = [:]
        personalTasteAnswerUndo = nil
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

        if let profileHistoryData = defaults.data(forKey: Key.profileHistory),
           let decodedHistory = try? decoder.decode([TasteProfile].self, from: profileHistoryData) {
            profileHistory = Array(
                decodedHistory
                    .sorted { $0.createdAt < $1.createdAt }
                    .suffix(TasteProfileHistoryContract.maximumStoredProfiles)
            )
        } else {
            profileHistory = []
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
            diningEntries = decodedEntries.sorted { $0.observedAt > $1.observedAt }
        } else {
            diningEntries = []
        }
        // 이전 분석 캐시는 원문 기록과 분리해 보존하되 현재 해석에는 사용하지 않는다.

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

        if let rememberedMenuData = defaults.data(forKey: Key.rememberedRestaurantMenus),
           let decodedMenus = try? decoder.decode(
            [String: [String]].self,
            from: rememberedMenuData
           ) {
            rememberedRestaurantMenus = Self.sanitizedRememberedRestaurantMenus(decodedMenus)
        } else {
            rememberedRestaurantMenus = [:]
        }
        if let progressData = defaults.data(forKey: Key.personalTasteQuestionProgress),
           let decodedProgress = try? decoder.decode(
            [String: [String: PersonalTasteQuestionProgress]].self,
            from: progressData
           ) {
            personalTasteQuestionProgressByUser = decodedProgress
        }
        refreshSensoryAnalysis()
    }

    private func accountArchive(for scope: String) -> NativeAccountArchive? {
        guard let data = defaults.data(forKey: Key.accountArchivePrefix + scope) else { return nil }
        do { return try decoder.decode(NativeAccountArchive.self, from: data) }
        catch {
            // 읽지 못한 보관본도 버리지 않는다. 원본 바이트를 따로 보존하고 서버 복원을 시도한다.
            defaults.set(data, forKey: Key.accountArchivePrefix + scope + ".unreadable")
            accountDataSyncError = "이 기기의 보관본을 읽지 못했습니다. 원본을 보존하고 계정 복원을 다시 시도합니다."
            return nil
        }
    }

    private func storeAccountArchive(_ archive: NativeAccountArchive, scope: String) {
        guard let data = try? encoder.encode(archive) else { return }
        defaults.set(data, forKey: Key.accountArchivePrefix + scope)
    }

    private func currentAccountSnapshot() -> NativeAccountSnapshot {
        var snapshot = NativeAccountSnapshot(values: Dictionary(uniqueKeysWithValues: Key.accountDataKeys.compactMap { key in
            defaults.data(forKey: key).map { (key, $0) }
        }), hasSeenOnboarding: defaults.bool(forKey: Key.onboarding))
        snapshot.photoFilenames = photoFilenames(in: snapshot)
        return snapshot
    }

    private func setPersistedAccountValue(_ value: Any?, forKey key: String) {
        guard !invalidAccountDataKeys.contains(key) else {
            accountDataSyncError = NativeAccountDataError.invalidSource.localizedDescription
            return
        }
        defaults.set(value, forKey: key)
        persistAccountArchive()
    }

    private func removePersistedAccountValue(forKey key: String) {
        guard !invalidAccountDataKeys.contains(key) else {
            accountDataSyncError = NativeAccountDataError.invalidSource.localizedDescription
            return
        }
        defaults.removeObject(forKey: key)
        persistAccountArchive()
    }

    private func persistAccountArchive(scheduleSync: Bool = true) {
        let snapshot = currentAccountSnapshot()
        var archive = accountArchive(for: activeAccountScope) ?? NativeAccountArchive(snapshot: snapshot)
        archive.isDirty = archive.isDirty || archive.snapshot != snapshot || (archive.remoteRevision == 0 && !snapshot.isEmpty)
        archive.snapshot = snapshot
        storeAccountArchive(archive, scope: activeAccountScope)
        if scheduleSync { scheduleAccountDataSync() }
    }

    private func applyAccountSnapshot(_ snapshot: NativeAccountSnapshot) {
        for key in Key.accountDataKeys {
            if let data = snapshot.values[key] { defaults.set(data, forKey: key) }
            else { defaults.removeObject(forKey: key) }
        }
        defaults.set(snapshot.hasSeenOnboarding, forKey: Key.onboarding)
        reloadPersistedAccountData()
    }

    private func unreadableKeys(in snapshot: NativeAccountSnapshot) -> Set<String> {
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
                case Key.diningEntries: _ = try decoder.decode([DiningEntry].self, from: data)
                case Key.savedRestaurantIDs: _ = try decoder.decode([String].self, from: data)
                case Key.bookmarkLists: _ = try decoder.decode([RestaurantBookmarkList].self, from: data)
                case Key.restaurantBookmarks: _ = try decoder.decode([RestaurantBookmarkRecord].self, from: data)
                case Key.pendingBookmarkMutations: _ = try decoder.decode([RestaurantBookmarkPendingMutation].self, from: data)
                case Key.dishFeedbackComments: _ = try decoder.decode([String: [DishFeedbackComment]].self, from: data)
                case Key.rememberedRestaurantMenus: _ = try decoder.decode([String: [String]].self, from: data)
                case Key.personalTasteQuestionProgress: _ = try decoder.decode([String: [String: PersonalTasteQuestionProgress]].self, from: data)
                default: break // 사진 바이트와 사용하지 않는 이전 분석 캐시는 원형 그대로 보존한다.
                }
                return nil
            } catch { return key }
        })
    }

    private func validateAccountSnapshot(_ snapshot: NativeAccountSnapshot) throws {
        guard snapshot.schemaVersion == 1 else { throw NativeAccountDataError.unsupportedVersion }
        guard unreadableKeys(in: snapshot).isEmpty else { throw NativeAccountDataError.invalidSource }
        guard Set(snapshot.photoFilenames) == Set(photoFilenames(in: snapshot)) else { throw NativeAccountDataError.invalidSource }
    }

    private func activateAccountScope(_ scope: String, importingGuest: Bool = false) {
        guard scope != activeAccountScope else { return }
        persistAccountArchive(scheduleSync: false)
        accountSyncTask?.cancel()
        accountSyncID = nil
        needsAccountSync = false
        let guestArchive = importingGuest && activeAccountScope == "guest" ? accountArchive(for: "guest") : nil
        let existing = accountArchive(for: scope)
        let archive = existing ?? guestArchive ?? NativeAccountArchive(snapshot: .init())
        activeAccountScope = scope
        defaults.set(scope, forKey: Key.activeAccount)
        storeAccountArchive(archive, scope: scope)
        applyAccountSnapshot(archive.snapshot)
        if guestArchive != nil && existing == nil { defaults.removeObject(forKey: Key.accountArchivePrefix + "guest") }
        accountDataSyncError = invalidAccountDataKeys.isEmpty ? nil : NativeAccountDataError.invalidSource.localizedDescription
        accountDataHasConflict = false
    }

    private func scheduleAccountDataSync() {
        guard backendSessionStatus == .authenticated, UUID(uuidString: activeAccountScope) != nil else { return }
        needsAccountSync = true
        guard accountSyncID == nil else { return }
        accountSyncTask?.cancel()
        accountSyncTask = Task { [weak self] in
            do { try await Task.sleep(nanoseconds: 700_000_000) } catch { return }
            self?.accountSyncTask = nil
            await self?.syncAccountData()
        }
    }

    private func photoFilenames(in snapshot: NativeAccountSnapshot) -> [String] {
        guard let data = snapshot.values[Key.diningEntries],
              let entries = try? decoder.decode([DiningEntry].self, from: data) else { return [] }
        return Array(Set(entries.compactMap(\.reflectionPhotoFilename))).sorted()
    }

    /// 로컬 저장이 항상 먼저다. 충돌 시 양쪽 원문을 보존하고 덮어쓰지 않는다.
    func syncAccountData() async {
        guard backendSessionStatus == .authenticated,
              UUID(uuidString: activeAccountScope) != nil, accountSyncID == nil else { return }
        accountSyncTask?.cancel()
        accountSyncTask = nil
        let scope = activeAccountScope
        let operationID = UUID()
        accountSyncID = operationID
        needsAccountSync = false
        defer {
            if accountSyncID == operationID {
                accountSyncID = nil
                if needsAccountSync { scheduleAccountDataSync() }
            }
        }
        do {
            let remote = try await accountDataRepository.fetch(userID: scope)
            guard activeAccountScope == scope, accountSyncID == operationID else { return }
            if let remote { try validateAccountSnapshot(remote.payload) }
            var archive = accountArchive(for: scope) ?? NativeAccountArchive(snapshot: .init())
            try validateAccountSnapshot(archive.snapshot)
            if archive.isDirty, let remote, remote.payload == archive.snapshot {
                // 이전 응답만 유실된 경우에도 같은 원문을 중복 전송하지 않는다.
                archive.remoteRevision = remote.revision
                archive.isDirty = false
                storeAccountArchive(archive, scope: scope)
            }
            if archive.isDirty {
                guard (remote?.revision ?? 0) == archive.remoteRevision else { throw NativeAccountDataError.conflict }
                let uploadedSnapshot = archive.snapshot
                let filenames = photoFilenames(in: uploadedSnapshot)
                try await accountPhotoRepository.backup(filenames: filenames, userID: scope)
                guard activeAccountScope == scope, accountSyncID == operationID else { return }
                let removedPhotos = Set(photoFilenames(in: remote?.payload ?? .init())).subtracting(filenames)
                if var pending = accountArchive(for: scope) {
                    pending.pendingPhotoDeletions = Array(Set(pending.pendingPhotoDeletions).union(removedPhotos)).sorted()
                    storeAccountArchive(pending, scope: scope)
                }
                let revision = try await accountDataRepository.save(uploadedSnapshot, userID: scope, expectedRevision: archive.remoteRevision)
                // 저장을 기다리는 동안 추가된 로컬 변경은 다음 전송 대상으로 보존한다.
                guard var latest = accountArchive(for: scope) else { return }
                latest.remoteRevision = revision
                latest.isDirty = latest.snapshot != uploadedSnapshot
                latest.pendingPhotoDeletions = Array(Set(latest.pendingPhotoDeletions).union(removedPhotos)).sorted()
                storeAccountArchive(latest, scope: scope)
                guard activeAccountScope == scope, accountSyncID == operationID else { return }
                if latest.isDirty { scheduleAccountDataSync() }
            } else if let remote {
                guard remote.payload.schemaVersion == 1 else { throw NativeAccountDataError.unsupportedVersion }
                archive.snapshot = remote.payload
                archive.remoteRevision = remote.revision
                storeAccountArchive(archive, scope: scope)
                applyAccountSnapshot(remote.payload)
                // 사진 가져오기에 실패해도 복원된 원문 기록은 보존한다.
                try await accountPhotoRepository.restore(filenames: photoFilenames(in: remote.payload), userID: scope)
            }
            guard activeAccountScope == scope, accountSyncID == operationID else { return }
            if let pending = accountArchive(for: scope), !pending.pendingPhotoDeletions.isEmpty {
                do {
                    let deletions = Set(pending.pendingPhotoDeletions).subtracting(photoFilenames(in: pending.snapshot))
                    try await accountPhotoRepository.remove(filenames: Array(deletions).sorted(), userID: scope)
                    guard var latest = accountArchive(for: scope) else { return }
                    latest.pendingPhotoDeletions.removeAll { pending.pendingPhotoDeletions.contains($0) }
                    storeAccountArchive(latest, scope: scope)
                } catch {
                    guard activeAccountScope == scope, accountSyncID == operationID else { return }
                    accountDataSyncError = "기록 백업은 완료되었습니다. 이전 사진 정리는 다음 연결 때 다시 시도합니다."
                    return
                }
            }
            accountDataSyncError = nil
            accountDataHasConflict = false
        } catch {
            guard activeAccountScope == scope, accountSyncID == operationID else { return }
            accountDataHasConflict = (error as? NativeAccountDataError) == .conflict
                || String(describing: error).contains("native account revision conflict")
            accountDataSyncError = accountDataHasConflict ? NativeAccountDataError.conflict.localizedDescription
                : (error as? NativeAccountDataError)?.localizedDescription
                ?? "기록은 이 기기에 보관되어 있습니다. 계정 백업을 완료하지 못해 다음 연결 때 다시 시도합니다."
        }
    }

    /// 사용자가 선택하기 전 양쪽 원본을 별도 로컬 보관본으로 남긴다.
    func resolveAccountDataConflict(using resolution: NativeAccountConflictResolution) async {
        guard backendSessionStatus == .authenticated, accountDataHasConflict,
              UUID(uuidString: activeAccountScope) != nil, accountSyncID == nil else { return }
        let scope = activeAccountScope
        let operationID = UUID()
        accountSyncID = operationID
        defer { if accountSyncID == operationID { accountSyncID = nil } }
        do {
            let remote = try await accountDataRepository.fetch(userID: scope)
            guard activeAccountScope == scope, accountSyncID == operationID,
                  var archive = accountArchive(for: scope) else { return }
            if let remote { try validateAccountSnapshot(remote.payload) }
            try validateAccountSnapshot(archive.snapshot)
            if let remote {
                // 원격 원문을 선택하지 않더라도 충돌 보관본이 참조하는 사진까지 이 기기에 남긴다.
                try await accountPhotoRepository.restore(filenames: photoFilenames(in: remote.payload), userID: scope)
                guard activeAccountScope == scope, accountSyncID == operationID else { return }
            }
            guard let latest = accountArchive(for: scope) else { return }
            archive = latest
            try validateAccountSnapshot(archive.snapshot)
            let recoveryScope = scope + ".conflict.\(UUID().uuidString)"
            let recoveryKey = Key.accountArchivePrefix + recoveryScope
            storeAccountArchive(archive, scope: recoveryScope)
            if let remote, let data = try? encoder.encode(remote) { defaults.set(data, forKey: recoveryKey + ".remote") }
            switch resolution {
            case .thisDevice:
                archive.remoteRevision = remote?.revision ?? 0
                archive.isDirty = true
            case .accountBackup:
                guard let remote else { throw NativeAccountDataError.unavailable }
                archive.snapshot = remote.payload
                archive.remoteRevision = remote.revision
                archive.isDirty = false
                applyAccountSnapshot(remote.payload)
            }
            storeAccountArchive(archive, scope: scope)
            accountDataHasConflict = false
            accountSyncID = nil
            await syncAccountData()
        } catch {
            guard activeAccountScope == scope, accountSyncID == operationID else { return }
            accountDataSyncError = (error as? NativeAccountDataError)?.localizedDescription
                ?? "양쪽 기록을 보존했습니다. 연결을 확인한 뒤 다시 선택해 주세요."
        }
    }

    func restoreBackendSessionIfNeeded() async {
        guard !hasRestoredBackendSession else {
            return
        }

        hasRestoredBackendSession = true
        backendSessionStatus = .restoring
        let revision = authenticationRevision
        let restoredStatus = await sessionRepository.restoreSession()
        guard authenticationRevision == revision else { return }
        backendSessionStatus = restoredStatus

        if backendSessionStatus == .authenticated {
            if let user = authRepository.currentUser {
                activateAccountScope(user.isAnonymous ? "guest" : user.id.lowercased())
                if !user.isAnonymous { await syncAccountData() }
            } else if UUID(uuidString: activeAccountScope) != nil {
                activateAccountScope("signed-out")
                backendSessionStatus = .signedOut
                return
            }
            _ = await hydratePublicProfileIdentity()
        } else if activeAccountScope != "guest" && activeAccountScope != "signed-out" {
            activateAccountScope("signed-out")
        }
    }

    func completeOnboarding() {
        hasSeenOnboarding = true
        setPersistedAccountValue(true, forKey: Key.onboarding)
    }

    func completeAuthEntry() {
        authenticationRevision += 1
        if activeAccountScope != "guest" { activateAccountScope("guest") }
        if backendSessionStatus == .restoring { backendSessionStatus = .signedOut }
        hasCompletedAuthEntry = true
    }

    func completeVerifiedEmailAuthEntry(user: BackendAuthUserSummary? = nil, importingGuest: Bool = false) {
        authenticationRevision += 1
        if let user = user ?? authRepository.currentUser, !user.isAnonymous {
            activateAccountScope(user.id.lowercased(), importingGuest: importingGuest)
        }
        hasCompletedAuthEntry = true
        backendSessionStatus = .authenticated
        scheduleAccountDataSync()
    }

    @discardableResult
    func completeLinkedCurrentProfileAuthEntry() async -> BackendProfileIdentityMutationResult {
        completeVerifiedEmailAuthEntry(importingGuest: true)
        await syncAccountData()
        return await publishCurrentProfileIdentity()
    }

    @discardableResult
    func deleteCurrentAccount() async -> BackendAuthResult {
        let deletingScope = activeAccountScope
        let requiresBackendDeletion: Bool
        switch backendSessionStatus {
        case .authenticated, .failed:
            requiresBackendDeletion = true
        case .notConfigured, .signedOut:
            // A guest may have prepared an anonymous session while linking an email.
            requiresBackendDeletion = authRepository.hasCurrentSession
        case .restoring:
            return .failure("로그인 상태를 확인하고 있습니다. 잠시 후 다시 시도해 주세요.")
        }
        let result = requiresBackendDeletion
            ? await authRepository.deleteCurrentAccount()
            : .success("이 기기의 프로필이 삭제되었습니다.")
        guard result.ok else {
            return result
        }
        guard activeAccountScope == deletingScope else {
            removeLocalAccountArchive(scope: deletingScope)
            return result
        }

        authenticationRevision += 1
        resetAll()
        activeAccountScope = "signed-out"
        defaults.set(activeAccountScope, forKey: Key.activeAccount)
        backendSessionStatus = .signedOut
        hasRestoredBackendSession = true
        return result
    }

    @discardableResult
    func logout() async -> BackendAuthResult {
        persistAccountArchive(scheduleSync: false)
        authenticationRevision += 1
        let revision = authenticationRevision
        let result = await authRepository.signOutLocal()

        guard result.ok else {
            return result
        }
        guard authenticationRevision == revision else { return result }

        activateAccountScope("signed-out")
        hasCompletedAuthEntry = false
        backendSessionStatus = .signedOut
        hasRestoredBackendSession = true
        return result
    }

    func returnToOnboarding() {
        hasSeenOnboarding = false
        setPersistedAccountValue(false, forKey: Key.onboarding)
    }

    func savePreferenceIntakeDraft(_ responses: PreferenceIntakeResponsesContract) {
        preferenceIntakeDraft = responses
        setPersistedAccountValue(
            try? encoder.encode(responses),
            forKey: Key.preferenceIntakeDraft
        )
    }

    @discardableResult
    func completePreferenceIntake(_ profile: PreferenceIntakeProfileContract) -> Bool {
        guard let data = try? encoder.encode(profile) else { return false }
        setPersistedAccountValue(data, forKey: Key.preferenceProfile)
        preferenceProfile = profile
        preferenceIntakeDraft = nil
        removePersistedAccountValue(forKey: Key.preferenceIntakeDraft)
        refreshSensoryAnalysis()
        return true
    }

    func returnToPreferenceIntake() {
        preferenceIntakeDraft = preferenceProfile
        preferenceProfile = nil

        if let preferenceIntakeDraft {
            setPersistedAccountValue(
                try? encoder.encode(preferenceIntakeDraft),
                forKey: Key.preferenceIntakeDraft
            )
        }
        removePersistedAccountValue(forKey: Key.preferenceProfile)
        refreshSensoryAnalysis()
    }

    func saveProfile(_ profile: TasteProfile) {
        if let currentProfile = self.profile,
           currentProfile.createdAt != profile.createdAt {
            archiveProfile(currentProfile)
        }
        self.profile = profile
        setPersistedAccountValue(try? encoder.encode(profile), forKey: Key.profile)
    }

    func saveProfileIdentity(_ identity: UserProfileIdentity) {
        let sanitizedIdentity = identity.sanitized
        profileIdentity = sanitizedIdentity
        setPersistedAccountValue(
            try? encoder.encode(sanitizedIdentity),
            forKey: Key.profileIdentity
        )
    }

    @discardableResult
    func hydratePublicProfileIdentity() async -> Bool {
        let scope = activeAccountScope
        guard backendSessionStatus == .authenticated,
              let remoteIdentity = await publicProfileRepository.currentProfileIdentity() else {
            return false
        }
        guard activeAccountScope == scope, backendSessionStatus == .authenticated else { return false }

        saveProfileIdentity(remoteIdentity.merged(with: profileIdentity))
        return true
    }

    @discardableResult
    func publishCurrentProfileIdentity() async -> BackendProfileIdentityMutationResult {
        guard backendSessionStatus == .authenticated else {
            return .failure("로그인 후 공개 프로필에 반영할 수 있습니다.")
        }

        return await publicProfileRepository.updateCurrentProfileIdentity(profileIdentity)
    }

    func saveProfileAvatarImageData(_ data: Data?) {
        profileAvatarImageData = data

        if let data {
            setPersistedAccountValue(data, forKey: Key.profileAvatarImageData)
        } else {
            removePersistedAccountValue(forKey: Key.profileAvatarImageData)
        }
    }

    func addDiningEntry(_ entry: DiningEntry) {
        guard !invalidAccountDataKeys.contains(Key.diningEntries) else { return }
        if diningEntries.contains(where: { $0.id == entry.id }) {
            updateDiningEntry(entry)
            return
        }

        diningEntries.insert(entry.preparedForInitialSave(at: now()), at: 0)
        diningEntries.sort { $0.observedAt > $1.observedAt }
        saveDiningEntries()
    }

    func updateDiningEntry(_ entry: DiningEntry) {
        guard !invalidAccountDataKeys.contains(Key.diningEntries) else { return }
        if let index = diningEntries.firstIndex(where: { $0.id == entry.id }) {
            let previousEntry = diningEntries[index]
            let previousPhotoFilename = previousEntry.reflectionPhotoFilename
            diningEntries[index] = entry.preparedForUpdate(previous: previousEntry, at: now())
            if previousPhotoFilename != entry.reflectionPhotoFilename {
                DiningReflectionPhotoStore.remove(filename: previousPhotoFilename)
            }
        } else {
            diningEntries.insert(entry.preparedForInitialSave(at: now()), at: 0)
        }

        diningEntries.sort { $0.observedAt > $1.observedAt }
        saveDiningEntries()
    }

    func removeDiningEntry(id: UUID) {
        guard !invalidAccountDataKeys.contains(Key.diningEntries) else { return }
        let removedEntry = diningEntries.first { $0.id == id }
        let photoFilename = removedEntry?.reflectionPhotoFilename
        diningEntries.removeAll { $0.id == id }
        DiningReflectionPhotoStore.remove(filename: photoFilename)
        saveDiningEntries()
    }

    func diningEntry(id: UUID) -> DiningEntry? {
        diningEntries.first { $0.id == id }
    }

    func diningEntries(mealID: UUID) -> [DiningEntry] {
        diningEntries.filter { $0.mealID == mealID }
    }

    func additionalMenuDraft(for entryID: UUID, id: UUID = UUID()) -> DiningEntry? {
        diningEntry(id: entryID)?.additionalMenuDraft(id: id)
    }

    func shouldPresentPersonalTasteQuestion(id questionID: String, userID: String) -> Bool {
        guard let progress = personalTasteQuestionProgressByUser[userID]?[questionID] else {
            return true
        }
        return progress.status == .active
    }

    func recordPersonalTasteQuestionExposure(id questionID: String, userID: String) {
        guard personalTasteQuestionProgressByUser[userID]?[questionID] == nil else {
            return
        }
        personalTasteQuestionProgressByUser[userID, default: [:]][questionID] = .init(
            questionID: questionID,
            firstExposedAt: now(),
            status: .active,
            statusChangedAt: nil
        )
        persistPersonalTasteQuestionProgress()
    }

    func dismissPersonalTasteQuestion(id questionID: String, userID: String) {
        setPersonalTasteQuestionStatus(.dismissed, questionID: questionID, userID: userID)
    }

    func resolvePersonalTasteQuestion(id questionID: String, userID: String) {
        setPersonalTasteQuestionStatus(.resolved, questionID: questionID, userID: userID)
    }

    func personalTasteQuestionResponseContext(
        for selection: PersonalTasteNextSelection
    ) -> PersonalTasteQuestionResponseContext? {
        guard let model = sensoryAnalysis.personalModel,
              model.availableSelections.contains(selection),
              shouldPresentPersonalTasteQuestion(id: selection.id, userID: model.userID) else {
            refreshSensoryAnalysis()
            return nil
        }

        let userID = model.userID
        let entryIDsAtStart = Set(diningEntries.map(\.id))
        let mealIDsAtStart = Set(diningEntries.map(\.mealID))
        let evidenceIDs = Set(selection.evidenceIDs)
        let evidenceObservations = sensoryAnalysis.observations
            .filter { evidenceIDs.contains($0.id) && $0.attribute == selection.attribute }
            .sorted {
                if $0.recordedAt != $1.recordedAt { return $0.recordedAt > $1.recordedAt }
                return $0.id < $1.id
            }
        if selection.intent == "exploration" {
            return .init(
                selection: selection,
                userID: userID,
                sourceEntryID: nil,
                sourceTarget: "unspecified",
                sourcePhase: "unspecified",
                sourceReference: evidenceObservations.first?.reference,
                entryIDsAtStart: entryIDsAtStart,
                mealIDsAtStart: mealIDsAtStart
            )
        }

        guard selection.intent == "clarification" else {
            refreshSensoryAnalysis()
            return nil
        }
        let source = evidenceObservations
            .filter {
                diningEntry(id: $0.experienceID) != nil
                    && (selection.responseSourceID == nil || $0.id == selection.responseSourceID)
            }
            .first
        guard let source else {
            refreshSensoryAnalysis()
            return nil
        }
        return .init(
            selection: selection,
            userID: userID,
            sourceEntryID: source.experienceID,
            sourceTarget: source.target,
            sourcePhase: source.phase,
            sourceReference: source.reference,
            entryIDsAtStart: entryIDsAtStart,
            mealIDsAtStart: mealIDsAtStart,
            sourceSelectionEvidence: source.selectionEvidence
        )
    }

    @discardableResult
    func savePersonalTasteQuestionResponse(
        _ entry: DiningEntry,
        context: PersonalTasteQuestionResponseContext
    ) -> PersonalTasteQuestionSaveResult {
        switch context.selection.intent {
        case "clarification":
            guard let sourceEntryID = context.sourceEntryID,
                  sourceEntryID == entry.id,
                  diningEntry(id: sourceEntryID) != nil else {
                refreshSensoryAnalysis()
                return .sourceUnavailable
            }
            let resolved = personalTasteQuestionIsAnswered(by: entry, context: context)
            if resolved {
                resolvePersonalTasteQuestion(
                    id: context.selection.id,
                    userID: context.userID
                )
            }
            updateDiningEntry(entry)
            return .updated(resolved: resolved)

        case "exploration":
            let collidesWithOriginalEntry = context.entryIDsAtStart.contains(entry.id)
            let collidesWithOriginalMeal = context.mealIDsAtStart.contains(entry.mealID)
            let collidesWithCurrentEntry = diningEntry(id: entry.id) != nil
            let collidesWithAnotherMealRecord = diningEntries.contains {
                $0.mealID == entry.mealID && $0.id != entry.id
            }
            guard !collidesWithOriginalEntry,
                  !collidesWithOriginalMeal,
                  !collidesWithCurrentEntry,
                  !collidesWithAnotherMealRecord else {
                return .sourceUnavailable
            }
            let resolved = personalTasteQuestionIsAnswered(by: entry, context: context)
            if resolved {
                resolvePersonalTasteQuestion(
                    id: context.selection.id,
                    userID: context.userID
                )
            }
            addDiningEntry(entry)
            return .added(resolved: resolved)

        default:
            refreshSensoryAnalysis()
            return .sourceUnavailable
        }
    }

    func preparePersonalTasteAnswerUndo(before: DiningEntry, context: PersonalTasteQuestionResponseContext) {
        guard let after = diningEntry(id: before.id) else { return }
        personalTasteAnswerUndo = .init(before: before, after: after, context: context)
    }

    @discardableResult
    func undoPersonalTasteAnswer() -> Bool {
        guard let undo = personalTasteAnswerUndo else { return false }
        personalTasteAnswerUndo = nil
        // 저장 이후 수정되거나 삭제된 기록은 이전 값으로 덮어쓰지 않는다.
        guard diningEntry(id: undo.after.id) == undo.after else { return false }
        setPersonalTasteQuestionStatus(.active, questionID: undo.context.id, userID: undo.context.userID)
        updateDiningEntry(undo.before)
        return true
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

    func rememberedMenus(
        for restaurantName: String,
        restaurantKey: String? = nil
    ) -> [String] {
        Self.restaurantMenuStorageKeys(
            restaurantName: restaurantName,
            restaurantKey: restaurantKey
        )
        .flatMap { rememberedRestaurantMenus[$0] ?? [] }
        .uniqueByNormalizedMenuTitle()
    }

    func rememberRestaurantMenu(
        _ menuTitle: String,
        for restaurantName: String,
        restaurantKey: String? = nil
    ) {
        let title = menuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }

        let keys = Self.restaurantMenuStorageKeys(
            restaurantName: restaurantName,
            restaurantKey: restaurantKey
        )
        guard !keys.isEmpty else { return }

        for key in keys {
            var menus = rememberedRestaurantMenus[key] ?? []
            if !menus.containsNormalizedMenuTitle(title) {
                menus.append(title)
            }
            rememberedRestaurantMenus[key] = menus
        }
        persistRememberedRestaurantMenus()
    }

    func updateRememberedRestaurantMenu(
        _ previousMenuTitle: String,
        to nextMenuTitle: String,
        for restaurantName: String,
        restaurantKey: String? = nil
    ) {
        let nextTitle = nextMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !nextTitle.isEmpty else { return }

        let keys = Self.restaurantMenuStorageKeys(
            restaurantName: restaurantName,
            restaurantKey: restaurantKey
        )
        guard !keys.isEmpty else { return }

        for key in keys {
            var menus = rememberedRestaurantMenus[key] ?? []
            menus.removeNormalizedMenuTitle(previousMenuTitle)
            menus.removeNormalizedMenuTitle(nextTitle)
            menus.append(nextTitle)
            rememberedRestaurantMenus[key] = menus
        }
        persistRememberedRestaurantMenus()
    }

    func removeRememberedRestaurantMenu(
        _ menuTitle: String,
        for restaurantName: String,
        restaurantKey: String? = nil
    ) {
        let keys = Self.restaurantMenuStorageKeys(
            restaurantName: restaurantName,
            restaurantKey: restaurantKey
        )
        guard !keys.isEmpty else { return }

        for key in keys {
            guard var menus = rememberedRestaurantMenus[key] else { continue }
            menus.removeNormalizedMenuTitle(menuTitle)
            if menus.isEmpty {
                rememberedRestaurantMenus.removeValue(forKey: key)
            } else {
                rememberedRestaurantMenus[key] = menus
            }
        }
        persistRememberedRestaurantMenus()
    }

    func restartCalibration() {
        if let profile {
            archiveProfile(profile)
        }
        profile = nil
        removePersistedAccountValue(forKey: Key.profile)
    }

    private func removeLocalAccountArchive(scope: String) {
        let archiveKey = Key.accountArchivePrefix + scope
        var removedPhotos = scope == activeAccountScope ? Set(diningEntries.compactMap(\.reflectionPhotoFilename)) : []
        for key in defaults.dictionaryRepresentation().keys where key == archiveKey || key.hasPrefix(archiveKey + ".") {
            if let data = defaults.data(forKey: key) {
                let snapshot = (try? decoder.decode(NativeAccountArchive.self, from: data))?.snapshot
                    ?? (try? decoder.decode(NativeAccountRemoteData.self, from: data))?.payload
                if let snapshot { removedPhotos.formUnion(photoFilenames(in: snapshot)) }
            }
            defaults.removeObject(forKey: key)
        }
        for key in defaults.dictionaryRepresentation().keys where key.hasPrefix(Key.accountArchivePrefix) {
            guard let data = defaults.data(forKey: key) else { continue }
            let snapshot = (try? decoder.decode(NativeAccountArchive.self, from: data))?.snapshot
                ?? (try? decoder.decode(NativeAccountRemoteData.self, from: data))?.payload
            if let snapshot { removedPhotos.subtract(photoFilenames(in: snapshot)) }
        }
        for filename in removedPhotos { DiningReflectionPhotoStore.remove(filename: filename) }
    }

    func resetAll() {
        accountSyncTask?.cancel()
        accountSyncID = nil
        needsAccountSync = false
        removeLocalAccountArchive(scope: activeAccountScope)
        invalidAccountDataKeys = []
        sensoryAnalysisRevision += 1
        sensoryAnalysisTask?.cancel()
        sensoryAnalysisTask = nil
        sensoryAnalysis = .empty
        sensoryAnalysisIsUpdating = false
        sensoryAnalysisError = nil
        personalTasteQuestionProgressByUser = [:]
        personalTasteAnswerUndo = nil
        hasCompletedAuthEntry = false
        hasSeenOnboarding = false
        preferenceIntakeDraft = nil
        preferenceProfile = nil
        profile = nil
        profileHistory = []
        profileIdentity = .default
        profileAvatarImageData = nil
        diningEntries = []
        savedRestaurantIDs = []
        bookmarkLists = []
        restaurantBookmarks = []
        pendingBookmarkMutations = []
        bookmarkSyncStatus = .idle
        dishFeedbackComments = TasteBuddyNativeContent.seededDishFeedbackComments
        rememberedRestaurantMenus = [:]
        backendSessionStatus = .restoring
        hasRestoredBackendSession = false
        defaults.removeObject(forKey: Key.authEntry)
        defaults.removeObject(forKey: Key.onboarding)
        defaults.removeObject(forKey: Key.preferenceIntakeDraft)
        defaults.removeObject(forKey: Key.preferenceProfile)
        defaults.removeObject(forKey: Key.profile)
        defaults.removeObject(forKey: Key.profileHistory)
        defaults.removeObject(forKey: Key.profileIdentity)
        defaults.removeObject(forKey: Key.profileAvatarImageData)
        defaults.removeObject(forKey: Key.diningEntries)
        defaults.removeObject(forKey: Key.tbaEvidenceEvents)
        defaults.removeObject(forKey: Key.tbaConfidenceStates)
        defaults.removeObject(forKey: Key.savedRestaurantIDs)
        defaults.removeObject(forKey: Key.bookmarkLists)
        defaults.removeObject(forKey: Key.restaurantBookmarks)
        defaults.removeObject(forKey: Key.pendingBookmarkMutations)
        defaults.removeObject(forKey: Key.dishFeedbackComments)
        defaults.removeObject(forKey: Key.rememberedRestaurantMenus)
        defaults.removeObject(forKey: Key.personalTasteQuestionProgress)
        accountDataSyncError = nil
        accountDataHasConflict = false
    }

    private func saveDiningEntries() {
        setPersistedAccountValue(try? encoder.encode(diningEntries), forKey: Key.diningEntries)
        refreshSensoryAnalysis()
    }

    private func setPersonalTasteQuestionStatus(
        _ status: PersonalTasteQuestionProgressStatus,
        questionID: String,
        userID: String
    ) {
        let existing = personalTasteQuestionProgressByUser[userID]?[questionID]
        personalTasteQuestionProgressByUser[userID, default: [:]][questionID] = .init(
            questionID: questionID,
            firstExposedAt: existing?.firstExposedAt ?? now(),
            status: status,
            statusChangedAt: now()
        )
        persistPersonalTasteQuestionProgress()
    }

    private func persistPersonalTasteQuestionProgress() {
        setPersistedAccountValue(
            try? encoder.encode(personalTasteQuestionProgressByUser),
            forKey: Key.personalTasteQuestionProgress
        )
    }

    private func personalTasteQuestionIsAnswered(
        by entry: DiningEntry,
        context: PersonalTasteQuestionResponseContext
    ) -> Bool {
        guard entry.hasCompletedTasteFeedback,
              let parsed = try? SensoryAnalysisEngine.analyze(
                entries: [entry],
                userID: context.userID
              ) else {
            return false
        }

        if context.selection.intent == "exploration" {
            guard let proposed = context.selection.proposedCondition else { return false }
            return parsed.personalModel?.units.contains { unit in
                guard unit.attribute == context.selection.attribute,
                      unit.reference == context.sourceReference,
                      ["positive", "neutral", "negative"].contains(unit.liking) else {
                    return false
                }
                switch proposed.dimension {
                case "intensity":
                    return unit.intensity == proposed.value
                case "target":
                    return unit.target == proposed.value
                case "phase":
                    return unit.phase == proposed.value
                case "dishKind":
                    return unit.dishKindIDs.contains(proposed.value)
                default:
                    return false
                }
            } ?? false
        }

        return parsed.observations.contains { observation in
            guard observation.attribute == context.selection.attribute,
                  observation.reference == context.sourceReference else {
                return false
            }

            if let source = context.sourceSelectionEvidence {
                guard let response = observation.selectionEvidence,
                      response.selectionID == source.selectionID,
                      response.type == source.type,
                      response.catalogVersion == source.catalogVersion,
                      response.relatedBubbleID == source.relatedBubbleID else { return false }
            } else if observation.selectionEvidence != nil {
                // 메모의 빈 응답을 별개의 버블·태그 평가로 채웠다고 처리하지 않는다.
                return false
            }

            let matchesKnownTarget = context.selection.facet == "target"
                || context.sourceTarget == "unspecified"
                || observation.target == context.sourceTarget
            let matchesKnownPhase = context.selection.facet == "phase"
                || context.sourcePhase == "unspecified"
                || observation.phase == context.sourcePhase
            guard matchesKnownTarget, matchesKnownPhase else { return false }

            switch context.selection.facet {
            case "liking":
                return observation.kind == "attribute_liking"
            case "intensity":
                return observation.kind == "sensory_intensity"
            case "target":
                return observation.target != "unspecified"
            case "phase":
                return observation.phase != "unspecified"
            default:
                return false
            }
        }
    }

    /// 원문이 바뀔 때만 계산한다. 수정·삭제 이전 결과는 화면에 남기지 않는다.
    func refreshSensoryAnalysis() {
        sensoryAnalysisRevision += 1
        let revision = sensoryAnalysisRevision
        let entries = diningEntries
        let userID = "local-owner"
        let preferenceSubmissions = preferenceProfile?.submissions ?? []
        let suppressedQuestionIDs = personalTasteQuestionProgressByUser[userID, default: [:]].values.compactMap { progress in
            progress.status == .active ? nil : progress.questionID
        }
        sensoryAnalysisTask?.cancel()
        sensoryAnalysis = .empty
        sensoryAnalysisError = nil
        sensoryAnalysisIsUpdating = true
        sensoryAnalysisTask = Task { [weak self] in
            do {
                let result = try await Task.detached(priority: .userInitiated) {
                    try SensoryAnalysisEngine.analyze(
                        entries: entries,
                        userID: userID,
                        suppressedQuestionIDs: suppressedQuestionIDs,
                        preferenceSubmissions: preferenceSubmissions
                    )
                }.value
                guard !Task.isCancelled, let self,
                      self.sensoryAnalysisRevision == revision else { return }
                self.sensoryAnalysis = result
                self.sensoryAnalysisIsUpdating = false
                self.sensoryAnalysisTask = nil
            } catch {
                guard !Task.isCancelled, let self,
                      self.sensoryAnalysisRevision == revision else { return }
                self.sensoryAnalysis = .empty
                self.sensoryAnalysisError = "기록의 감각을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
                self.sensoryAnalysisIsUpdating = false
                self.sensoryAnalysisTask = nil
            }
        }
    }

    private func archiveProfile(_ profile: TasteProfile) {
        var history = profileHistory.filter { $0.createdAt != profile.createdAt }
        history.append(profile)
        profileHistory = Array(
            history
                .sorted { $0.createdAt < $1.createdAt }
                .suffix(TasteProfileHistoryContract.maximumStoredProfiles)
        )
        setPersistedAccountValue(try? encoder.encode(profileHistory), forKey: Key.profileHistory)
    }

    private func persistSavedRestaurantIDs() {
        setPersistedAccountValue(
            try? encoder.encode(savedRestaurantIDs.sorted()),
            forKey: Key.savedRestaurantIDs
        )
    }

    private func persistBookmarkLists() {
        setPersistedAccountValue(try? encoder.encode(bookmarkLists), forKey: Key.bookmarkLists)
    }

    private func persistRestaurantBookmarks() {
        setPersistedAccountValue(
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
        setPersistedAccountValue(
            try? encoder.encode(pendingBookmarkMutations),
            forKey: Key.pendingBookmarkMutations
        )
    }

    private func persistDishFeedbackComments() {
        setPersistedAccountValue(
            try? encoder.encode(dishFeedbackComments),
            forKey: Key.dishFeedbackComments
        )
    }

    private func persistRememberedRestaurantMenus() {
        rememberedRestaurantMenus = Self.sanitizedRememberedRestaurantMenus(
            rememberedRestaurantMenus
        )
        setPersistedAccountValue(
            try? encoder.encode(rememberedRestaurantMenus),
            forKey: Key.rememberedRestaurantMenus
        )
    }

    private static func restaurantMenuStorageKeys(
        restaurantName: String,
        restaurantKey: String?
    ) -> [String] {
        var keys: [String] = []
        let trimmedKey = restaurantKey?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !trimmedKey.isEmpty {
            keys.append("id:\(trimmedKey.lowercased())")
        }

        let normalizedName = normalizedRestaurantMenuKey(restaurantName)
        if !normalizedName.isEmpty {
            keys.append("name:\(normalizedName)")
        }

        return keys.reduce(into: []) { result, key in
            if !result.contains(key) {
                result.append(key)
            }
        }
    }

    private static func normalizedRestaurantMenuKey(_ value: String) -> String {
        value
            .lowercased()
            .filter { character in
                character.isLetter || character.isNumber
            }
    }

    private static func sanitizedRememberedRestaurantMenus(
        _ menusByRestaurant: [String: [String]]
    ) -> [String: [String]] {
        menusByRestaurant.reduce(into: [:]) { result, pair in
            let key = pair.key.trimmingCharacters(in: .whitespacesAndNewlines)
            let menus = pair.value
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
                .uniqueByNormalizedMenuTitle()
            if !key.isEmpty, !menus.isEmpty {
                result[key] = menus
            }
        }
    }

    static func preview(
        authEntryComplete: Bool = false,
        onboardingComplete: Bool = false,
        preferenceProfile: PreferenceIntakeProfileContract? = nil,
        profile: TasteProfile? = nil,
        profileHistory: [TasteProfile] = [],
        diningEntries: [DiningEntry] = [],
        savedRestaurantIDs: Set<String> = [],
        bookmarkLists: [RestaurantBookmarkList] = [],
        restaurantBookmarks: [RestaurantBookmarkRecord] = [],
        pendingBookmarkMutations: [RestaurantBookmarkPendingMutation] = [],
        dishFeedbackComments: [String: [DishFeedbackComment]] =
            TasteBuddyNativeContent.seededDishFeedbackComments,
        rememberedRestaurantMenus: [String: [String]] = [:],
        sessionRepository: any BackendSessionRepository = FixtureBackendSessionRepository(status: .signedOut),
        authRepository: any BackendAuthRepository = BackendAuthRepositoryFactory.makeDefault(),
        publicProfileRepository: any BackendPublicProfileRepository = BackendPublicProfileRepositoryFactory.makeDefault(),
        now: @escaping () -> Date = { .now }
    ) -> AppModel {
        let suiteName = "tastebuddy.preview.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.set(onboardingComplete, forKey: Key.onboarding)
        defaults.set(try? JSONEncoder().encode(preferenceProfile), forKey: Key.preferenceProfile)
        defaults.set(try? JSONEncoder().encode(profile), forKey: Key.profile)
        defaults.set(try? JSONEncoder().encode(profileHistory), forKey: Key.profileHistory)
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
        defaults.set(
            try? JSONEncoder().encode(rememberedRestaurantMenus),
            forKey: Key.rememberedRestaurantMenus
        )
        let model = AppModel(
            defaults: defaults,
            authRepository: authRepository,
            sessionRepository: sessionRepository,
            publicProfileRepository: publicProfileRepository,
            now: now
        )
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

private extension Array where Element == String {
    func containsNormalizedMenuTitle(_ title: String) -> Bool {
        let normalizedTitle = title.normalizedRememberedMenuTitle
        guard !normalizedTitle.isEmpty else { return false }
        return contains { $0.normalizedRememberedMenuTitle == normalizedTitle }
    }

    mutating func removeNormalizedMenuTitle(_ title: String) {
        let normalizedTitle = title.normalizedRememberedMenuTitle
        guard !normalizedTitle.isEmpty else { return }
        removeAll { $0.normalizedRememberedMenuTitle == normalizedTitle }
    }

    func uniqueByNormalizedMenuTitle() -> [String] {
        reduce(into: (seen: Set<String>(), values: [String]())) { result, value in
            let normalizedValue = value.normalizedRememberedMenuTitle
            guard !normalizedValue.isEmpty,
                  result.seen.insert(normalizedValue).inserted else {
                return
            }
            result.values.append(value)
        }.values
    }
}

private extension String {
    var normalizedRememberedMenuTitle: String {
        lowercased()
            .filter { character in
                character.isLetter || character.isNumber
            }
    }
}
