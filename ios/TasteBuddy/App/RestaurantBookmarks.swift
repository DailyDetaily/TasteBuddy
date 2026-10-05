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
