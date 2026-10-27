import Foundation
#if canImport(Supabase)
import Supabase
#endif

struct RestaurantPlaceAPIConfiguration: Equatable {
    let kakaoRestAPIKey: String?
    let backend: BackendConfiguration?

    static func load(bundle: Bundle = .main) -> RestaurantPlaceAPIConfiguration {
        from(infoDictionary: bundle.infoDictionary ?? [:])
    }

    static func from(infoDictionary: [String: Any]) -> RestaurantPlaceAPIConfiguration {
        RestaurantPlaceAPIConfiguration(
            kakaoRestAPIKey: normalizedAPIKey(infoDictionary["TBKakaoRestAPIKey"]),
            backend: try? BackendConfiguration.from(infoDictionary: infoDictionary)
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
    case googleBackendNotConfigured
    case googleAuthenticationRequired
    case googleProviderDisabled
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

    var displayAddress: String? { roadAddress ?? address }

    var recordReference: DiningRestaurantPlaceReference {
        .init(name: name, address: displayAddress ?? "", kakaoPlaceID: placeID,
              latitude: latitude, longitude: longitude, phone: phone)
    }
}

struct RestaurantPlaceAPIClient {
    var configuration = RestaurantPlaceAPIConfiguration.load()
    var session: URLSession = .shared
    /// Test injection uses a scoped token; production reads the existing Supabase session.
    var googleAccessToken: (() async throws -> String)? = nil


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

    func searchNearbyKakaoRestaurantPlaces(
        latitude: Double,
        longitude: Double,
        radiusMeters: Int = 300,
        size: Int = 10
    ) async throws -> [KakaoRestaurantPlace] {
        guard configuration.kakaoRestAPIKey != nil else {
            return []
        }

        let documents = try await requestKakaoRestaurantDocuments(
            latitude: latitude,
            longitude: longitude,
            radiusMeters: radiusMeters,
            size: size
        )

        return documents.compactMap(\.restaurantPlace)
    }

    func searchNearbyKakaoRestaurantPlaces(
        query: String,
        latitude: Double,
        longitude: Double,
        radiusMeters: Int = 300,
        size: Int = 10
    ) async throws -> [KakaoRestaurantPlace] {
        guard configuration.kakaoRestAPIKey != nil else {
            return []
        }

        let documents = try await requestKakaoRestaurantDocuments(
            query: query,
            size: size,
            latitude: latitude,
            longitude: longitude,
            radiusMeters: radiusMeters,
            sort: "distance"
        )

        return documents.compactMap(\.restaurantPlace)
    }

    func hydratePlaceInfo(restaurantName: String, basePlaceInfo: RestaurantPlaceInfo) async -> RestaurantPlaceInfo {
        await loadPlaceInfo(restaurantName: restaurantName, basePlaceInfo: basePlaceInfo).info
    }

    func loadPlaceInfo(restaurantName: String, basePlaceInfo: RestaurantPlaceInfo) async -> RestaurantPlaceLoadResult {
        var base = basePlaceInfo
        var identityReadFailed = false
        if base.googlePlaceID == nil, configuration.kakaoRestAPIKey != nil {
            do {
                let documents = try await requestKakaoRestaurantDocuments(query: restaurantName, size: 15)
                let candidate: KakaoPlaceDocument?
                if let expectedID = base.kakaoPlaceID {
                    candidate = documents.first { $0.id == expectedID }
                } else {
                    candidate = documents.first { document in
                        guard RestaurantPlaceIdentity.namesMatch(restaurantName, document.placeName ?? "") else { return false }
                        return base.address.isEmpty || RestaurantPlaceIdentity.sameLocation(base: base, latitude: document.latitude, longitude: document.longitude, address: document.roadAddressName ?? document.addressName)
                    }
                }
                if let candidate { base = base.merging(candidate.placeInfo) }
            } catch { identityReadFailed = true }
        }
        guard !Task.isCancelled else { return .init(info: base, googleState: .failed) }
        guard base.googlePlaceID != nil || !base.address.isEmpty || (base.lat != nil && base.lng != nil) else {
            return .init(info: base, googleState: identityReadFailed ? .failed : .unmatched)
        }
        do {
            guard let google = try await lookupGooglePlaceEnrichment(restaurantName: restaurantName, basePlaceInfo: base) else {
                return .init(info: base, googleState: .unmatched)
            }
            return .init(info: base.merging(google), googleState: .available)
        } catch {
            return .init(info: base, googleState: .failed)
        }
    }

    private func requestKakaoRestaurantDocuments(
        query: String,
        size: Int,
        latitude: Double? = nil,
        longitude: Double? = nil,
        radiusMeters: Int? = nil,
        sort: String = "accuracy"
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
        var queryItems = [
            URLQueryItem(name: "category_group_code", value: "FD6"),
            URLQueryItem(name: "page", value: "1"),
            URLQueryItem(name: "query", value: trimmedQuery),
            URLQueryItem(name: "size", value: String(boundedSize)),
            URLQueryItem(name: "sort", value: sort)
        ]
        if let latitude, let longitude {
            queryItems.append(URLQueryItem(name: "x", value: String(longitude)))
            queryItems.append(URLQueryItem(name: "y", value: String(latitude)))
        }
        if let radiusMeters {
            queryItems.append(
                URLQueryItem(name: "radius", value: String(min(max(radiusMeters, 1), 20_000)))
            )
        }
        components?.queryItems = queryItems

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

    private func requestKakaoRestaurantDocuments(
        latitude: Double,
        longitude: Double,
        radiusMeters: Int,
        size: Int
    ) async throws -> [KakaoPlaceDocument] {
        guard let apiKey = configuration.kakaoRestAPIKey else {
            return []
        }

        let boundedRadius = min(max(radiusMeters, 1), 20_000)
        let boundedSize = min(max(size, 1), 15)
        var components = URLComponents(string: "https://dapi.kakao.com/v2/local/search/category.json")
        components?.queryItems = [
            URLQueryItem(name: "category_group_code", value: "FD6"),
            URLQueryItem(name: "page", value: "1"),
            URLQueryItem(name: "radius", value: String(boundedRadius)),
            URLQueryItem(name: "size", value: String(boundedSize)),
            URLQueryItem(name: "sort", value: "distance"),
            URLQueryItem(name: "x", value: String(longitude)),
            URLQueryItem(name: "y", value: String(latitude))
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
            throw RestaurantPlaceAPIError.providerFailed("Kakao Local Category Search returned \(httpResponse.statusCode)")
        }

        let decoded = try JSONDecoder().decode(KakaoLocalSearchResponse.self, from: data)
        return decoded.documents
    }

    /// Google credentials stay in the existing server function. No Google key is shipped in the app.
    func lookupGooglePlaceEnrichment(
        restaurantName: String,
        basePlaceInfo: RestaurantPlaceInfo
    ) async throws -> RestaurantPlaceInfo? {
        guard let backend = configuration.backend else {
            throw RestaurantPlaceAPIError.googleBackendNotConfigured
        }
        let query = restaurantName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return nil }
        try Task.checkCancellation()
        let token: String
        if let googleAccessToken {
            token = try await googleAccessToken()
        } else {
            #if canImport(Supabase)
            let client = SupabaseClientProvider(configuration: backend).makeClient()
            token = try await client.auth.session.accessToken
            #else
            throw RestaurantPlaceAPIError.googleAuthenticationRequired
            #endif
        }
        guard !token.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw RestaurantPlaceAPIError.googleAuthenticationRequired
        }
        try Task.checkCancellation()
        let url = backend.supabaseURL.appendingPathComponent("functions/v1/google-place-enrich")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(backend.supabasePublishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(GooglePlaceEnrichmentRequest(
            query: query, placeId: basePlaceInfo.googlePlaceID, address: basePlaceInfo.address.nilIfEmpty,
            lat: basePlaceInfo.lat, lng: basePlaceInfo.lng, phone: basePlaceInfo.phone))

        let (data, response) = try await session.data(for: request)
        try Task.checkCancellation()
        guard let http = response as? HTTPURLResponse else { throw RestaurantPlaceAPIError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            throw RestaurantPlaceAPIError.providerFailed("Google place enrichment returned \(http.statusCode)")
        }
        let result = try JSONDecoder().decode(GooglePlaceEnrichmentResponse.self, from: data)
        guard result.disabled != true else { throw RestaurantPlaceAPIError.googleProviderDisabled }
        guard let place = result.place, place.matches(restaurantName: query, base: basePlaceInfo),
              let placeID = place.placeId?.nilIfEmpty else { return nil }
        var sourceByRow: [RestaurantInfoRowID: RestaurantInfoSource] = [:]
        let hours = place.hours?.nilIfEmpty
        let website = place.website?.nilIfEmpty
        let phone = basePlaceInfo.phone?.nilIfEmpty == nil ? place.phone?.nilIfEmpty : nil
        if hours != nil { sourceByRow[.hours] = .google }
        if website != nil { sourceByRow[.website] = .google }
        if phone != nil { sourceByRow[.phone] = .google }
        let authors = (place.photo?.attributions ?? []).compactMap { $0.displayName?.nilIfEmpty }.prefix(2)
        return RestaurantPlaceInfo(
            address: "", googlePhotoAttribution: authors.isEmpty ? nil : authors.joined(separator: ", "),
            googlePhotoURL: place.photo?.url.flatMap(URL.init(string:)), googlePlaceID: placeID,
            googleMapsURL: place.googleMapsUrl.flatMap(URL.init(string:)),
            googlePriceLevel: place.priceLevel, googleRating: place.rating,
            googleUserRatingCount: place.userRatingCount, lat: place.lat, lng: place.lng,
            phone: phone, website: website, hours: hours, sourceByRow: sourceByRow
        )
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
            category: categoryName?.nilIfEmpty,
            googleMapsURL: nil,
            kakaoPlaceID: id?.nilIfEmpty,
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

private struct GooglePlaceEnrichmentRequest: Encodable {
    let query: String
    let placeId: String?
    let address: String?
    let lat: Double?
    let lng: Double?
    let phone: String?
}

private struct GooglePlaceEnrichmentResponse: Decodable {
    let disabled: Bool?
    let place: GoogleEnrichedPlace?
}

private struct GoogleEnrichedPlace: Decodable {
    struct Photo: Decodable {
        struct Attribution: Decodable { let displayName: String? }
        let attributions: [Attribution]?
        let url: String?
    }
    let name: String?
    let address: String?
    let googleMapsUrl: String?
    let hours: String?
    let lat: Double?
    let lng: Double?
    let phone: String?
    let photo: Photo?
    let placeId: String?
    let priceLevel: String?
    let rating: Double?
    let userRatingCount: Int?
    let website: String?

    func matches(restaurantName: String, base: RestaurantPlaceInfo) -> Bool {
        if let expectedID = base.googlePlaceID { return expectedID == placeId }
        let sameName = RestaurantPlaceIdentity.namesMatch(restaurantName, name ?? "")
        let samePhone = RestaurantPlaceIdentity.phonesMatch(base.phone, phone)
        guard sameName || samePhone else { return false }
        return RestaurantPlaceIdentity.sameLocation(base: base, latitude: lat, longitude: lng,
                                                    address: address, maxDistance: sameName ? 500 : 100)
    }

}

private extension String {
    var nilIfEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

enum RestaurantPlaceLookupState: Equatable {
    case loading, available, unmatched, failed
    var missingHoursLabel: String {
        switch self {
        case .loading: "영업시간 확인 중"
        case .available: "Google에서 영업시간을 제공하지 않아요"
        case .unmatched: "영업시간 미확인"
        case .failed: "영업시간을 불러오지 못했어요"
        }
    }
}

struct RestaurantPlaceLoadResult: Equatable {
    var info: RestaurantPlaceInfo
    var googleState: RestaurantPlaceLookupState
}

enum RestaurantPlaceIdentity {
    static func normalized(_ value: String) -> String {
        String(String.UnicodeScalarView(value.precomposedStringWithCanonicalMapping.lowercased().unicodeScalars
            .filter { CharacterSet.alphanumerics.contains($0) }))
    }
    static func namesMatch(_ lhs: String, _ rhs: String) -> Bool {
        let a = normalized(lhs), b = normalized(rhs)
        return !a.isEmpty && !b.isEmpty && (a == b || (a.count >= 2 && b.count >= 2 && (a.contains(b) || b.contains(a))))
    }
    static func phonesMatch(_ lhs: String?, _ rhs: String?) -> Bool {
        func phone(_ value: String?) -> String {
            let digits = (value ?? "").filter(\.isNumber)
            return digits.hasPrefix("82") ? "0" + digits.dropFirst(2) : digits
        }
        let a = phone(lhs), b = phone(rhs)
        return a.count >= 8 && a == b
    }
    static func sameLocation(base: RestaurantPlaceInfo, latitude: Double?, longitude: Double?, address: String?, maxDistance: Double = 500) -> Bool {
        if let baseLat = base.lat, let baseLng = base.lng, let latitude, let longitude {
            guard [baseLat, baseLng, latitude, longitude].allSatisfy(\.isFinite) else { return false }
            return hypot((latitude - baseLat) * 111_320,
                         (longitude - baseLng) * 111_320 * cos(baseLat * .pi / 180)) <= maxDistance
        }
        let street = base.address.split(separator: " ").suffix(2).joined()
        return !street.isEmpty && normalized(address ?? "").contains(normalized(street))
    }
}
