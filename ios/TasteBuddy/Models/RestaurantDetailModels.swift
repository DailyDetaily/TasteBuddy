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

    var label: String { id.label }
}

struct RestaurantPlaceInfo: Equatable {
    var address: String
    var googleMapsURL: URL?
    var lat: Double?
    var lng: Double?
    var mapURL: URL?
    var phone: String?
    var website: String?
    var hours: String?
    var sourceByRow: [RestaurantInfoRowID: RestaurantInfoSource]

    func merging(_ enrichment: RestaurantPlaceInfo?) -> RestaurantPlaceInfo {
        guard let enrichment else { return self }

        var merged = self
        merged.address = enrichment.address.isEmpty ? address : enrichment.address
        merged.googleMapsURL = enrichment.googleMapsURL ?? googleMapsURL
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
    let personalMatchRate: Int
    let palateFriendsAverageScore: Int
    let overallScore: Double
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
        self.init(
            id: restaurant.id,
            name: restaurant.name,
            category: restaurant.category,
            chefName: restaurant.chefName.replacingOccurrences(of: #"\s*셰프$"#, with: "", options: .regularExpression),
            chefDisplayLabel: nil,
            chefImageName: restaurant.imageName,
            heroImageName: restaurant.imageName,
            axis: restaurant.axis,
            locationLabel: restaurant.locationLabel,
            summaryLine: restaurant.summary,
            fitSummary: RestaurantDetailModel.fitSummary(for: restaurant),
            mainRisk: RestaurantDetailModel.mainRisk(for: restaurant),
            decisionReason: RestaurantDetailModel.decisionReason(for: restaurant),
            confidenceLabel: RestaurantDetailModel.confidenceLabel(from: restaurant.matchRate),
            scores: RestaurantScoreModel(
                personalMatchRate: restaurant.matchRate,
                palateFriendsAverageScore: restaurant.id == "mingles" ? 78 : 82,
                overallScore: restaurant.id == "mingles" ? 4.6 : 4.5
            ),
            tags: RestaurantDetailModel.tags(for: restaurant),
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
        let primaryTasteTag = tasteTags.first { $0.tasteAxis != nil }
        let secondaryTag = tasteTags.first { $0.id != primaryTasteTag?.id }
        let fitBand: String

        if scores.personalMatchRate >= 82 {
            fitBand = "내 기준 Fit 높음"
        } else if scores.personalMatchRate >= 72 {
            fitBand = "내 기준 Fit 안정적"
        } else {
            fitBand = "내 기준 Fit 확인 중"
        }

        let lowConfidenceHint = confidenceLabel == "더 확인 필요"
            ? "아직 메뉴 단위 근거가 충분하지 않아요. 먹어본 메뉴로 남기면 다음 판단에서 감각 흐름을 더 분명하게 비교할 수 있어요."
            : nil
        let expectedTasteFlow: String

        if let primaryTasteTag, let secondaryTag {
            expectedTasteFlow = "\(primaryTasteTag.label)이 먼저 잡히고 \(secondaryTag.label)이 식사 후 기억의 길이를 정리할 가능성이 있어요."
        } else {
            expectedTasteFlow = "\(dish.title)의 중심 인상이 현재 프로필에서 어떻게 남는지 차분히 확인해볼 만해요."
        }

        return RestaurantMenuDetailModel(
            id: "\(id)-\(dish.id)",
            title: dish.title,
            restaurantName: name,
            chefName: chefName,
            courseLabel: index == 0 ? "첫 번째로 비교할 메뉴" : "기억 후보 \(index + 1)",
            imageName: nil,
            imageURL: nil,
            summaryLine: dish.summary,
            fitBand: fitBand,
            confidenceLabel: confidenceLabel,
            expectedTasteFlow: expectedTasteFlow,
            mainRisk: secondaryTag == nil
                ? mainRisk
                : "\(secondaryTag?.label ?? "마무리")이 예상보다 강하거나 짧게 남으면 전체 기억이 다르게 정리될 수 있어요.",
            chefIntent: "\(chefName) 셰프는 \(dish.title)에서 \(primaryTasteTag?.label ?? dish.tags.first ?? "중심 풍미")을 차분히 전달하고, 코스 안에서 자연스럽게 이어지는 경험을 의도한 것으로 읽혀요.",
            similarPalateSignal: primaryTasteTag == nil || secondaryTag == nil
                ? "비슷한 미각 기준에서는 메뉴의 첫 인상보다 식사 후 어떻게 기억되는지가 더 중요한 단서였어요."
                : "비슷한 미각 기준에서는 \(primaryTasteTag?.label ?? "중심 풍미")과 \(secondaryTag?.label ?? "마무리")이 함께 있을 때 만족도가 안정적으로 읽혔어요.",
            pastExperienceComparison: index == 0
                ? "지난번 좋았던 메인 후보보다 첫 인상은 더 조용하고, 피니시는 더 짧게 정리될 수 있어요."
                : "앞선 메뉴 후보보다 중심 풍미는 조금 더 농도 있게, 마무리는 더 오래 남을 수 있어요.",
            lowConfidenceHint: lowConfidenceHint,
            tasteTags: tasteTags
        )
    }

    static func confidenceLabel(from matchRate: Int) -> String {
        if matchRate >= 82 {
            return "근거 충분"
        }

        if matchRate >= 72 {
            return "근거 보통"
        }

        return "더 확인 필요"
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

    static func infoRows(from info: RestaurantPlaceInfo) -> [RestaurantInfoRowModel] {
        [
            row(id: .address, value: info.address, source: info.sourceByRow[.address] ?? .manual, url: info.mapURL ?? mapSearchURL(for: info.address)),
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

    private static func tags(for restaurant: RestaurantSummary) -> [RestaurantTagModel] {
        let contextTags = [restaurant.category, restaurant.locationLabel]
        let allTags = restaurant.tags + contextTags
        var seen = Set<String>()

        return allTags.compactMap { label in
            guard !seen.contains(label) else { return nil }
            seen.insert(label)
            let axis = tasteAxis(from: label)

            return RestaurantTagModel(
                id: label
                    .lowercased()
                    .replacingOccurrences(of: "\\s+", with: "-", options: .regularExpression),
                label: label,
                tasteAxis: axis,
                tone: axis == nil ? .neutral : .taste
            )
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

    private static func fitSummary(for restaurant: RestaurantSummary) -> String {
        switch restaurant.id {
        case "mingles":
            return "장 발효의 감칠맛과 한우 메인의 깊이가 현재 프로필에서 기억될 중심 풍미와 자연스럽게 이어질 가능성이 있어요."
        case "onjium":
            return "맑은 감칠맛과 편안한 여운이 후반부 무게를 낮추는 방향으로 이어질 가능성이 있어요."
        default:
            return restaurant.summary
        }
    }

    private static func mainRisk(for restaurant: RestaurantSummary) -> String {
        switch restaurant.id {
        case "mingles":
            return "코스 후반의 감칠맛 밀도와 지방감이 길어지면 전체 인상이 조금 무겁게 남을 수 있어요."
        default:
            return "대표 메뉴 외 코스 전체의 산미, 지방감, 피니시 흐름은 방문 전 한 번 더 확인하면 좋아요."
        }
    }

    private static func decisionReason(for restaurant: RestaurantSummary) -> String {
        switch restaurant.id {
        case "mingles":
            return "비슷한 미각 기준에서는 장 발효의 깊이, 한우 메인, 페어링 흐름이 함께 있을 때 만족도가 안정적으로 읽혔어요."
        default:
            return "이 레스토랑은 현재 프로필의 중심 풍미와 실제 식사 기억을 비교하기 좋은 후보예요."
        }
    }
}
