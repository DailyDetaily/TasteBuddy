import Foundation

/// Optional, explicitly supplied provenance. Missing legacy provenance remains unknown.
/// Raw values preserve future source kinds without silently relabelling them.
struct DiningFoodSource: Codable, Equatable, Sendable {
    var kind: String = "unknown"
    var homeCookingID: String? = nil
    var restaurantNamespace: String? = nil
    var restaurantPlace: DiningRestaurantPlaceReference? = nil
    var version: Int = 1
}

/// Place identity selected/confirmed with the record. Ratings and hours stay live provider data.
struct DiningRestaurantPlaceReference: Codable, Equatable, Hashable, Sendable {
    var name: String
    var address: String
    var kakaoPlaceID: String? = nil
    var googlePlaceID: String? = nil
    var latitude: Double? = nil
    var longitude: Double? = nil
    var phone: String? = nil
}
