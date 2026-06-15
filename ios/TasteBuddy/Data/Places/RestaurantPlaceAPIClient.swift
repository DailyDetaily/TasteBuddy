import Foundation

struct RestaurantPlaceAPIConfiguration: Equatable {
    let kakaoRestAPIKey: String?
    let googleMapsAPIKey: String?

    static func load(bundle: Bundle = .main) -> RestaurantPlaceAPIConfiguration {
        RestaurantPlaceAPIConfiguration(
            kakaoRestAPIKey: normalizedAPIKey(bundle.infoDictionary?["TBKakaoRestAPIKey"]),
            googleMapsAPIKey: normalizedAPIKey(bundle.infoDictionary?["TBGoogleMapsAPIKey"])
        )
    }

    private static func normalizedAPIKey(_ value: Any?) -> String? {
        guard let string = value as? String else { return nil }
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)

        if trimmed.isEmpty || trimmed.hasPrefix("__SET_") || trimmed.hasPrefix("$(") {
            return nil
        }

        return trimmed
    }
}

enum RestaurantPlaceAPIError: Error, Equatable {
    case invalidResponse
    case providerFailed(String)
}

struct KakaoRestaurantPlace: Identifiable, Equatable {
    let placeID: String?
    let name: String
    let address: String?
    let roadAddress: String?
    let category: String?
    let phone: String?
    let latitude: Double?
    let longitude: Double?
    let placeURL: URL?

    var id: String {
        placeID ?? [name, displayAddress].compactMap(\.self).joined(separator: "|")
    }

    var displayAddress: String? {
        roadAddress ?? address
    }
}

struct RestaurantPlaceAPIClient {
    var configuration = RestaurantPlaceAPIConfiguration.load()
    var session: URLSession = .shared

    func searchKakaoRestaurantPlaces(
        query: String,
        size: Int = 10
    ) async throws -> [KakaoRestaurantPlace] {
        guard configuration.kakaoRestAPIKey != nil else {
            return []
        }

        let documents = try await requestKakaoRestaurantDocuments(query: query, size: size)

        return documents.compactMap(\.restaurantPlace)
    }

    func hydratePlaceInfo(
        restaurantName: String,
        basePlaceInfo: RestaurantPlaceInfo
    ) async -> RestaurantPlaceInfo {
        let kakaoInfo = await lookupKakaoPlaceInfo(restaurantName: restaurantName)
        let base = kakaoInfo ?? basePlaceInfo
        let googleInfo = await lookupGooglePlaceEnrichment(
            restaurantName: restaurantName,
            basePlaceInfo: base
        )

        return base.merging(googleInfo)
    }

    private func lookupKakaoPlaceInfo(restaurantName: String) async -> RestaurantPlaceInfo? {
        guard configuration.kakaoRestAPIKey != nil else {
            return nil
        }

        do {
            let documents = try await requestKakaoRestaurantDocuments(query: restaurantName, size: 10)
            guard let document = KakaoLocalSearchResponse(documents: documents).bestRestaurantDocument else {
                return nil
            }

            return document.placeInfo
        } catch {
            return nil
        }
    }

    private func requestKakaoRestaurantDocuments(
        query: String,
        size: Int
    ) async throws -> [KakaoPlaceDocument] {
        guard let apiKey = configuration.kakaoRestAPIKey else {
            return []
        }

        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty else {
            return []
        }

        let boundedSize = min(max(size, 1), 15)
        var components = URLComponents(string: "https://dapi.kakao.com/v2/local/search/keyword.json")
        components?.queryItems = [
            URLQueryItem(name: "category_group_code", value: "FD6"),
            URLQueryItem(name: "page", value: "1"),
            URLQueryItem(name: "query", value: trimmedQuery),
            URLQueryItem(name: "size", value: String(boundedSize)),
            URLQueryItem(name: "sort", value: "accuracy")
        ]

        guard let url = components?.url else {
            throw RestaurantPlaceAPIError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.setValue("KakaoAK \(apiKey)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw RestaurantPlaceAPIError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw RestaurantPlaceAPIError.providerFailed("Kakao Local Search returned \(httpResponse.statusCode)")
        }

        let decoded = try JSONDecoder().decode(KakaoLocalSearchResponse.self, from: data)
        return decoded.documents
    }

    private func lookupGooglePlaceEnrichment(
        restaurantName: String,
        basePlaceInfo: RestaurantPlaceInfo
    ) async -> RestaurantPlaceInfo? {
        guard let apiKey = configuration.googleMapsAPIKey,
              let url = URL(string: "https://places.googleapis.com/v1/places:searchText") else {
            return nil
        }

        let textQuery = [restaurantName, basePlaceInfo.address]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        guard !textQuery.isEmpty else {
            return nil
        }

        var payload: [String: Any] = [
            "includedType": "restaurant",
            "languageCode": "ko",
            "maxResultCount": 5,
            "regionCode": "KR",
            "textQuery": textQuery
        ]

        if let lat = basePlaceInfo.lat, let lng = basePlaceInfo.lng {
            payload["locationBias"] = [
                "circle": [
                    "center": [
                        "latitude": lat,
                        "longitude": lng
                    ],
                    "radius": 500
                ]
            ]
        }

        do {
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue(apiKey, forHTTPHeaderField: "X-Goog-Api-Key")
            request.setValue(GooglePlaceTextSearchResponse.fieldMask, forHTTPHeaderField: "X-Goog-FieldMask")

            let (data, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200..<300).contains(httpResponse.statusCode) else {
                return nil
            }

            let decoded = try JSONDecoder().decode(GooglePlaceTextSearchResponse.self, from: data)
            guard let place = decoded.places.first else {
                return nil
            }

            var sourceByRow: [RestaurantInfoRowID: RestaurantInfoSource] = [:]
            let hours = place.regularOpeningHours?.weekdayDescriptions?.formattedOpeningHours
            if hours != nil {
                sourceByRow[.hours] = .google
            }

            if place.websiteURI != nil {
                sourceByRow[.website] = .google
            }

            let googlePhone = place.nationalPhoneNumber ?? place.internationalPhoneNumber
            if basePlaceInfo.phone == nil, googlePhone?.isEmpty == false {
                sourceByRow[.phone] = .google
            }

            return RestaurantPlaceInfo(
                address: "",
                googleMapsURL: place.googleMapsURI.flatMap(URL.init(string:)),
                lat: place.location?.latitude,
                lng: place.location?.longitude,
                mapURL: nil,
                phone: basePlaceInfo.phone == nil ? googlePhone?.nilIfEmpty : nil,
                website: place.websiteURI?.nilIfEmpty,
                hours: hours,
                sourceByRow: sourceByRow
            )
        } catch {
            return nil
        }
    }
}

private struct KakaoLocalSearchResponse: Decodable {
    let documents: [KakaoPlaceDocument]

    var bestRestaurantDocument: KakaoPlaceDocument? {
        documents.first { $0.categoryGroupCode == "FD6" } ?? documents.first
    }
}

private struct KakaoPlaceDocument: Decodable {
    let addressName: String?
    let categoryGroupCode: String?
    let categoryName: String?
    let id: String?
    let phone: String?
    let placeName: String?
    let placeURL: String?
    let roadAddressName: String?
    let x: String?
    let y: String?

    var latitude: Double? {
        y.flatMap(Double.init)
    }

    var longitude: Double? {
        x.flatMap(Double.init)
    }

    var restaurantPlace: KakaoRestaurantPlace? {
        guard let name = placeName?.nilIfEmpty else {
            return nil
        }

        return KakaoRestaurantPlace(
            placeID: id?.nilIfEmpty,
            name: name,
            address: addressName?.nilIfEmpty,
            roadAddress: roadAddressName?.nilIfEmpty,
            category: categoryName?.nilIfEmpty,
            phone: phone?.nilIfEmpty,
            latitude: latitude,
            longitude: longitude,
            placeURL: placeURL?.nilIfEmpty.flatMap(URL.init(string:))
        )
    }

    var placeInfo: RestaurantPlaceInfo? {
        let address = roadAddressName?.nilIfEmpty ?? addressName?.nilIfEmpty
        guard let address else {
            return nil
        }

        var sourceByRow: [RestaurantInfoRowID: RestaurantInfoSource] = [.address: .kakao]
        if phone?.nilIfEmpty != nil {
            sourceByRow[.phone] = .kakao
        }

        return RestaurantPlaceInfo(
            address: address,
            googleMapsURL: nil,
            lat: latitude,
            lng: longitude,
            mapURL: placeURL?.nilIfEmpty.flatMap(URL.init(string:)),
            phone: phone?.nilIfEmpty,
            website: nil,
            hours: nil,
            sourceByRow: sourceByRow
        )
    }

    enum CodingKeys: String, CodingKey {
        case addressName = "address_name"
        case categoryGroupCode = "category_group_code"
        case categoryName = "category_name"
        case id
        case phone
        case placeName = "place_name"
        case placeURL = "place_url"
        case roadAddressName = "road_address_name"
        case x
        case y
    }
}

private struct GooglePlaceTextSearchResponse: Decodable {
    static let fieldMask = [
        "places.displayName",
        "places.formattedAddress",
        "places.googleMapsUri",
        "places.id",
        "places.internationalPhoneNumber",
        "places.location",
        "places.nationalPhoneNumber",
        "places.regularOpeningHours",
        "places.websiteUri"
    ].joined(separator: ",")

    let places: [GooglePlace]
}

private struct GooglePlace: Decodable {
    struct DisplayName: Decodable {
        let text: String?
    }

    struct Location: Decodable {
        let latitude: Double?
        let longitude: Double?
    }

    struct OpeningHours: Decodable {
        let weekdayDescriptions: [String]?
    }

    let displayName: DisplayName?
    let formattedAddress: String?
    let googleMapsURI: String?
    let id: String?
    let internationalPhoneNumber: String?
    let location: Location?
    let nationalPhoneNumber: String?
    let regularOpeningHours: OpeningHours?
    let websiteURI: String?

    enum CodingKeys: String, CodingKey {
        case displayName
        case formattedAddress
        case googleMapsURI = "googleMapsUri"
        case id
        case internationalPhoneNumber
        case location
        case nationalPhoneNumber
        case regularOpeningHours
        case websiteURI = "websiteUri"
    }
}

private extension Array where Element == String {
    var formattedOpeningHours: String? {
        let lines = map {
            $0
                .replacingOccurrences(of: "요일", with: "")
                .replacingOccurrences(of: ":\\s*", with: " ", options: .regularExpression)
        }
        .filter { !$0.isEmpty }

        return lines.isEmpty ? nil : lines.joined(separator: " / ")
    }
}

private extension String {
    var nilIfEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
