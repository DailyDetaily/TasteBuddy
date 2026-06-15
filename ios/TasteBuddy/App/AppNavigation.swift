import SwiftUI

enum MainTab: String, CaseIterable, Identifiable {
    case home
    case analysis
    case dining
    case profile

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home:
            "홈"
        case .analysis:
            "나의 입맛"
        case .dining:
            "다이닝"
        case .profile:
            "프로필"
        }
    }

    var symbol: String {
        switch self {
        case .home:
            "house"
        case .analysis:
            "chart.bar"
        case .dining:
            "calendar.badge.checkmark"
        case .profile:
            "person"
        }
    }
}

enum ProfileConnectionKind: String, CaseIterable, Hashable, Identifiable {
    case followers
    case following

    var id: String { rawValue }

    var title: String {
        switch self {
        case .followers:
            "팔로워"
        case .following:
            "팔로잉"
        }
    }
}

enum AppRoute: Hashable {
    case restaurant(id: String)
    case restaurantMenu(restaurantID: String, menuID: String)
    case dishFeedback(id: String)
    case comments(id: String)
    case tasteChange
    case savedRestaurants
    case connectionList(ProfileConnectionKind)
    case publicProfile(id: String)

    var hidesMainShell: Bool { true }

    var title: String {
        switch self {
        case .restaurant(let id):
            RestaurantCatalog.restaurant(id: id).name
        case .restaurantMenu(let restaurantID, let menuID):
            RestaurantCatalog.restaurant(id: restaurantID)
                .memorableDishes
                .first { $0.id == menuID }?
                .title ?? RestaurantCatalog.restaurant(id: restaurantID).name
        case .dishFeedback:
            "디시 기록"
        case .comments:
            "댓글"
        case .tasteChange:
            "미각 변화"
        case .savedRestaurants:
            "테이스트 리스트"
        case .connectionList(let kind):
            kind.title
        case .publicProfile(let id):
            switch id {
            case "jae":
                "정서윤"
            case "hyeon":
                "최도윤"
            default:
                "김민아"
            }
        }
    }
}

enum AppSheet: Identifiable {
    case profileSummary
    case globalSearch
    case notifications
    case quickRefinement
    case menu
    case bookmark(RestaurantSummary)
    case authEntry(BackendAuthEmailIntent)

    var id: String {
        switch self {
        case .profileSummary:
            "profile-summary"
        case .globalSearch:
            "global-search"
        case .notifications:
            "notifications"
        case .quickRefinement:
            "quick-refinement"
        case .menu:
            "menu"
        case .bookmark(let restaurant):
            "bookmark-\(restaurant.id)"
        case .authEntry(let intent):
            "auth-entry-\(intent.rawValue)"
        }
    }
}
