import Foundation

enum RestaurantInfoRowID: String, CaseIterable, Codable, Hashable {
    case address
    case hours
    case website
    case instagram
    case email
    case phone

    var label: String {
        switch self {
        case .address: "주소"
        case .hours: "영업시간"
        case .website: "웹사이트"
        case .instagram: "인스타그램"
        case .email: "이메일"
        case .phone: "전화번호"
        }
    }

    var suggestionLabel: String {
        switch self {
        case .address: "위치"
        case .phone: "전화"
        default: label
        }
    }

    var symbol: String {
        switch self {
        case .address: "mappin"
        case .hours: "clock"
        case .website: "globe"
        case .instagram: "camera"
        case .email: "envelope"
        case .phone: "phone"
        }
    }
}

enum RestaurantInfoSource: String, Codable, Hashable {
    case kakao
    case google
    case partner
    case manual
}

struct RestaurantInfoRowModel: Identifiable, Equatable {
    let id: RestaurantInfoRowID
    let value: String
    let source: RestaurantInfoSource
    let url: URL?
    var isPlaceholder = false

    var label: String { id.label }
}

struct RestaurantPlaceInfo: Equatable {
    var address: String
    var category: String? = nil
    var googlePhotoAttribution: String? = nil
    var googlePhotoURL: URL? = nil
    var googlePlaceID: String? = nil
    var googleMapsURL: URL? = nil
    var googlePriceLevel: String? = nil
    var googleRating: Double? = nil
    var googleUserRatingCount: Int? = nil
    var kakaoPlaceID: String? = nil
    var lat: Double? = nil
    var lng: Double? = nil
    var mapURL: URL? = nil
    var phone: String? = nil
    var website: String? = nil
    var hours: String? = nil
    var sourceByRow: [RestaurantInfoRowID: RestaurantInfoSource]

    func merging(_ enrichment: RestaurantPlaceInfo?) -> RestaurantPlaceInfo {
        guard let enrichment else { return self }

        var merged = self
        merged.address = enrichment.address.isEmpty ? address : enrichment.address
        merged.category = enrichment.category ?? category
        merged.googlePhotoAttribution = enrichment.googlePhotoAttribution ?? googlePhotoAttribution
        merged.googlePhotoURL = enrichment.googlePhotoURL ?? googlePhotoURL
        merged.googlePlaceID = enrichment.googlePlaceID ?? googlePlaceID
        merged.googleMapsURL = enrichment.googleMapsURL ?? googleMapsURL
        merged.googlePriceLevel = enrichment.googlePriceLevel ?? googlePriceLevel
        merged.googleRating = enrichment.googleRating ?? googleRating
        merged.googleUserRatingCount = enrichment.googleUserRatingCount ?? googleUserRatingCount
        merged.kakaoPlaceID = enrichment.kakaoPlaceID ?? kakaoPlaceID
        merged.lat = enrichment.lat ?? lat
        merged.lng = enrichment.lng ?? lng
        merged.mapURL = enrichment.mapURL ?? mapURL
        merged.phone = enrichment.phone ?? phone
        merged.website = enrichment.website ?? website
        merged.hours = enrichment.hours ?? hours
        merged.sourceByRow.merge(enrichment.sourceByRow) { _, new in new }
        return merged
    }
}

struct RestaurantScoreModel: Equatable {
    let personalMatchRate: Int?
    let palateFriendsAverageScore: Int?
    let overallScore: Double?
}

struct RestaurantTagModel: Identifiable, Equatable {
    enum Tone {
        case taste
        case neutral
    }

    let id: String
    let label: String
    let tasteAxis: TasteAxis?
    let tone: Tone
}

struct RestaurantMenuTasteTagModel: Identifiable, Equatable {
    enum Tone {
        case taste
        case neutral
    }

    let id: String
    let label: String
    let tasteAxis: TasteAxis?
    let tone: Tone
}

struct RestaurantMenuDetailModel: Identifiable, Equatable {
    let id: String
    let title: String
    let restaurantName: String
    let chefName: String
    let courseLabel: String
    let imageName: String?
    let imageURL: URL?
    let summaryLine: String
    let fitBand: String
    let confidenceLabel: String
    let expectedTasteFlow: String
    let mainRisk: String
    let chefIntent: String
    let similarPalateSignal: String
    let pastExperienceComparison: String?
    let lowConfidenceHint: String?
    let tasteTags: [RestaurantMenuTasteTagModel]
}

struct RestaurantDetailModel: Identifiable, Equatable {
    let id: String
    let name: String
    let category: String
    let chefName: String
    let chefDisplayLabel: String?
    let chefImageName: String?
    let heroImageName: String?
    let axis: TasteAxis
    let locationLabel: String
    let summaryLine: String
    let fitSummary: String
    let mainRisk: String
    let decisionReason: String
    let confidenceLabel: String
    let scores: RestaurantScoreModel
    let tags: [RestaurantTagModel]
    let memorableDishes: [RestaurantSummary.Dish]
    let fallbackPlaceInfo: RestaurantPlaceInfo
}

extension RestaurantDetailModel {
    init(summary restaurant: RestaurantSummary) {
        let placeInfo = RestaurantDetailModel.fallbackPlaceInfo(for: restaurant)
        let contextProfile = RestaurantDetailModel.contextProfile(for: restaurant)
        self.init(
            id: restaurant.id,
            name: restaurant.name,
            category: contextProfile.category,
            chefName: restaurant.chefName.replacingOccurrences(of: #"\s*셰프$"#, with: "", options: .regularExpression),
            chefDisplayLabel: nil,
            chefImageName: restaurant.imageName,
            heroImageName: restaurant.imageName,
            axis: restaurant.axis,
            locationLabel: contextProfile.locationLabel,
            summaryLine: restaurant.summary,
            fitSummary: "개인 적합도는 아직 계산하지 않았어요.",
            mainRisk: "개인 취향과 연결한 주의점은 아직 확인하지 않았어요.",
            decisionReason: "식당과 메뉴 정보를 확인하고 직접 남긴 경험으로 비교할 수 있어요.",
            confidenceLabel: "미계산",
            scores: RestaurantScoreModel(
                personalMatchRate: nil,
                palateFriendsAverageScore: nil,
                overallScore: nil
            ),
            tags: contextProfile.tags,
            memorableDishes: restaurant.memorableDishes,
            fallbackPlaceInfo: placeInfo
        )
    }

    func menuDetail(for dish: RestaurantSummary.Dish, index: Int) -> RestaurantMenuDetailModel {
        let tasteTags = dish.tags.map { tag in
            let axis = RestaurantDetailModel.tasteAxis(from: tag)
            return RestaurantMenuTasteTagModel(
                id: "\(dish.id)-\(tag)",
                label: tag,
                tasteAxis: axis,
                tone: axis == nil ? .neutral : .taste
            )
        }
        return RestaurantMenuDetailModel(
            id: "\(id)-\(dish.id)",
            title: dish.title,
            restaurantName: name,
            chefName: chefName,
            courseLabel: "메뉴 정보",
            imageName: nil,
            imageURL: nil,
            summaryLine: dish.summary,
            fitBand: "미계산",
            confidenceLabel: confidenceLabel,
            expectedTasteFlow: dish.tags.isEmpty ? "기록된 감각 정보가 없어요." : dish.tags.joined(separator: " · "),
            mainRisk: "개인 취향과 연결한 주의점은 아직 확인하지 않았어요.",
            chefIntent: "셰프의 직접 설명이 아직 연결되지 않았어요.",
            similarPalateSignal: "비슷한 입맛 그룹의 평가를 아직 계산하지 않았어요.",
            pastExperienceComparison: nil,
            lowConfidenceHint: "이 메뉴와 직접 연결된 이전 경험을 아직 비교하지 않았어요.",
            tasteTags: tasteTags
        )
    }

    static func confidenceLabel(from _: Int) -> String {
        "미계산"
    }

    static func tasteAxis(from label: String) -> TasteAxis? {
        if let exact = TasteAxis.allCases.first(where: { $0.label == label || $0.rawValue == label.lowercased() }) {
            return exact
        }

        if label.contains("감칠") || label.contains("장 발효") {
            return .umami
        }

        if label.contains("산미") || label.contains("신맛") {
            return .sour
        }

        if label.contains("짠맛") || label.contains("염도") {
            return .salty
        }

        if label.contains("단맛") {
            return .sweet
        }

        if label.contains("쓴맛") || label.lowercased().contains("비터") {
            return .bitter
        }

        if label.contains("지방") {
            return .fat
        }

        return nil
    }

    static func infoRows(
        from info: RestaurantPlaceInfo,
        includingFallbacks: Bool = false
    ) -> [RestaurantInfoRowModel] {
        if includingFallbacks {
            return [
                rowOrFallback(
                    id: .address,
                    value: info.address,
                    fallback: "주소를 알려주세요",
                    source: info.sourceByRow[.address] ?? .manual,
                    url: nil
                ),
                rowOrFallback(
                    id: .hours,
                    value: info.hours,
                    fallback: "영업시간을 알려주세요",
                    source: info.sourceByRow[.hours] ?? .manual
                ),
                rowOrFallback(
                    id: .phone,
                    value: info.phone,
                    fallback: "전화번호를 알려주세요",
                    source: info.sourceByRow[.phone] ?? .manual,
                    url: phoneURL(for: info.phone)
                )
            ]
        }

        return [
            row(
                id: .address,
                value: info.address,
                source: info.sourceByRow[.address] ?? .manual,
                url: info.sourceByRow[.address] == .kakao ? nil : mapSearchURL(for: info.address)
            ),
            row(id: .hours, value: info.hours, source: info.sourceByRow[.hours] ?? .manual),
            row(id: .website, value: info.website, source: info.sourceByRow[.website] ?? .manual, url: websiteURL(for: info.website)),
            row(id: .phone, value: info.phone, source: info.sourceByRow[.phone] ?? .manual, url: phoneURL(for: info.phone))
        ].compactMap { $0 }
    }

    private static func row(
        id: RestaurantInfoRowID,
        value: String?,
        source: RestaurantInfoSource,
        url: URL? = nil
    ) -> RestaurantInfoRowModel? {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty else {
            return nil
        }

        return RestaurantInfoRowModel(id: id, value: value, source: source, url: url)
    }

    private static func rowOrFallback(
        id: RestaurantInfoRowID,
        value: String?,
        fallback: String,
        source: RestaurantInfoSource,
        url: URL? = nil
    ) -> RestaurantInfoRowModel {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty else {
            return RestaurantInfoRowModel(
                id: id,
                value: fallback,
                source: source,
                url: nil,
                isPlaceholder: true
            )
        }

        return RestaurantInfoRowModel(id: id, value: value, source: source, url: url)
    }

    private static func mapSearchURL(for address: String) -> URL? {
        guard let encodedAddress = address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
            return nil
        }

        return URL(string: "https://www.google.com/maps/search/?api=1&query=\(encodedAddress)")
    }

    private static func websiteURL(for value: String?) -> URL? {
        guard let value, !value.isEmpty else { return nil }

        if value.lowercased().hasPrefix("http://") || value.lowercased().hasPrefix("https://") {
            return URL(string: value)
        }

        return URL(string: "https://\(value)")
    }

    private static func phoneURL(for value: String?) -> URL? {
        guard let value else { return nil }
        let normalized = value.filter { $0.isNumber || $0 == "+" }
        return normalized.isEmpty ? nil : URL(string: "tel:\(normalized)")
    }

    private struct RestaurantContextProfile {
        let category: String
        let locationLabel: String
        let tags: [RestaurantTagModel]
    }

    private static func contextProfile(for restaurant: RestaurantSummary) -> RestaurantContextProfile {
        switch restaurant.id {
        case "mingles":
            return RestaurantContextProfile(
                category: "모던 한식 코스",
                locationLabel: "서울 청담",
                tags: dedupedTags([
                    primaryTasteTag(for: restaurant.axis),
                    tag(id: "jang-depth", label: "장 발효의 깊이", tone: .taste, tasteAxis: .umami),
                    tag(id: "hanwoo-flow", label: "한우 메인"),
                    tag(id: "modern-hansik", label: "현대 한식"),
                    tag(id: "pairing-ready", label: "페어링 추천")
                ])
            )
        default:
            return RestaurantContextProfile(
                category: restaurant.category,
                locationLabel: restaurant.locationLabel,
                tags: dedupedTags(restaurant.tags.map { label in
                    let axis = tasteAxis(from: label)
                    return tag(
                        id: label
                            .lowercased()
                            .replacingOccurrences(of: "\\s+", with: "-", options: .regularExpression),
                        label: label,
                        tone: axis == nil ? .neutral : .taste,
                        tasteAxis: axis
                    )
                })
            )
        }
    }

    private static func primaryTasteTag(for axis: TasteAxis) -> RestaurantTagModel {
        switch axis {
        case .sweet:
            return tag(id: "primary-sweet", label: "은은한 단맛", tone: .taste, tasteAxis: .sweet)
        case .sour:
            return tag(id: "primary-sour", label: "절제된 산미", tone: .taste, tasteAxis: .sour)
        case .bitter:
            return tag(id: "primary-bitter", label: "은근한 쓴맛", tone: .taste, tasteAxis: .bitter)
        case .salty:
            return tag(id: "primary-salty", label: "절제된 염도", tone: .taste, tasteAxis: .salty)
        case .umami:
            return tag(id: "primary-umami", label: "깊은 감칠맛", tone: .taste, tasteAxis: .umami)
        case .fat:
            return tag(id: "primary-fat", label: "부드러운 지방감", tone: .taste, tasteAxis: .fat)
        }
    }

    private static func tag(
        id: String,
        label: String,
        tone: RestaurantTagModel.Tone = .neutral,
        tasteAxis: TasteAxis? = nil
    ) -> RestaurantTagModel {
        RestaurantTagModel(
            id: id,
            label: label,
            tasteAxis: tasteAxis,
            tone: tone
        )
    }

    private static func dedupedTags(_ tags: [RestaurantTagModel]) -> [RestaurantTagModel] {
        var seen = Set<String>()

        return tags.filter { tag in
            let key = tag.label.trimmingCharacters(in: .whitespacesAndNewlines)
            return !key.isEmpty && seen.insert(key).inserted
        }
    }

    private static func fallbackPlaceInfo(for restaurant: RestaurantSummary) -> RestaurantPlaceInfo {
        switch restaurant.id {
        case "mingles":
            return RestaurantPlaceInfo(
                address: "서울 강남구 도산대로67길 19, 2층",
                googleMapsURL: nil,
                lat: nil,
                lng: nil,
                mapURL: nil,
                phone: "02-515-7306",
                website: "restaurant-mingles.com",
                hours: "화-토 런치 12:00-15:00, 디너 18:00-22:00 / 일·월 휴무",
                sourceByRow: [.address: .manual, .hours: .manual, .phone: .manual, .website: .manual]
            )
        case "onjium":
            return RestaurantPlaceInfo(
                address: "서울 종로구 효자로 49, 4층",
                googleMapsURL: nil,
                lat: nil,
                lng: nil,
                mapURL: nil,
                phone: "02-6952-0024",
                website: nil,
                hours: "화-금 런치 12:00-15:00, 디너 18:00-22:00 / 토-월 휴무",
                sourceByRow: [.address: .manual, .hours: .manual, .phone: .manual]
            )
        case "jungsik":
            return RestaurantPlaceInfo(
                address: "서울 강남구 선릉로158길 11",
                googleMapsURL: nil,
                lat: nil,
                lng: nil,
                mapURL: nil,
                phone: "02-517-4654",
                website: "jungsik.kr",
                hours: "매일 런치 12:00-15:00, 디너 17:30-22:00",
                sourceByRow: [.address: .manual, .hours: .manual, .phone: .manual, .website: .manual]
            )
        case "mosu":
            return RestaurantPlaceInfo(
                address: "서울 용산구 이태원로55가길 45",
                googleMapsURL: nil,
                lat: nil,
                lng: nil,
                mapURL: nil,
                phone: "02-793-5995",
                website: "mosuseoul.com",
                hours: "화-토 런치 12:00-15:00, 디너 18:00-22:00 / 일·월 휴무",
                sourceByRow: [.address: .manual, .hours: .manual, .phone: .manual, .website: .manual]
            )
        default:
            return RestaurantPlaceInfo(
                address: restaurant.locationLabel,
                googleMapsURL: nil,
                lat: nil,
                lng: nil,
                mapURL: nil,
                phone: restaurant.infoRows.first(where: { $0.id == "phone" })?.value,
                website: nil,
                hours: restaurant.infoRows.first(where: { $0.id == "hours" })?.value,
                sourceByRow: [.address: .manual, .hours: .manual, .phone: .manual]
            )
        }
    }

}
