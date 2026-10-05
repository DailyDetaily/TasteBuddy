import Foundation

/// Optional, explicitly supplied provenance. Missing legacy provenance remains unknown.
/// Raw values preserve future source kinds without silently relabelling them.
struct DiningFoodSource: Codable, Equatable, Sendable {
    var kind: String = "unknown"
    var homeCookingID: String? = nil
    var restaurantNamespace: String? = nil
    var version: Int = 1
}
