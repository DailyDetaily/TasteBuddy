import XCTest
@testable import TasteBuddy

final class GooglePlaceEnrichmentTests: XCTestCase {
    private func client(response: @escaping (URLRequest) throws -> (Int, Data)) -> RestaurantPlaceAPIClient {
        let host = "places-\(UUID().uuidString.lowercased()).invalid"
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [GooglePlacesHTTPProtocol.self]
        let session = URLSession(configuration: config)
        GooglePlacesHTTPProtocol.register(host: host, response: response)
        addTeardownBlock { GooglePlacesHTTPProtocol.unregister(host: host); session.invalidateAndCancel() }
        let backend = BackendConfiguration(environment: .local, supabaseURL: URL(string: "https://\(host)")!,
            supabasePublishableKey: "sb_publishable_test", publicMediaBaseURL: nil, authRedirectURL: URL(string: "tastebuddy://auth/callback")!)
        return RestaurantPlaceAPIClient(configuration: .init(kakaoRestAPIKey: nil, backend: backend),
                                        session: session, googleAccessToken: { "existing-user-session" })
    }

    private var base: RestaurantPlaceInfo {
        .init(address: "서울 강남구 선릉로158길 11", kakaoPlaceID: "existing-kakao", lat: 37.5257, lng: 127.0413,
              phone: "02-existing-phone", sourceByRow: [.address: .kakao, .phone: .kakao])
    }

    private func payload(name: String = "검증 식당", lat: Double = 37.5257, lng: Double = 127.0413) throws -> Data {
        try JSONSerialization.data(withJSONObject: ["place": [
            "name": name, "address": "대한민국 서울특별시 강남구 선릉로158길 11", "placeId": "google-place-test",
            "lat": lat, "lng": lng, "hours": "월 12:00~22:00", "phone": "02-google-phone",
            "googleMapsUrl": "https://maps.google.com/?cid=123", "website": "https://restaurant.example/",
            "rating": 4.5, "userRatingCount": 37, "priceLevel": "PRICE_LEVEL_EXPENSIVE",
            "photo": ["url": "https://images.example/photo.jpg", "attributions": [["displayName": "검증 제공자"]]]
        ]])
    }

    func testConfirmedGoogleIDResolvesTranslatedNameButRejectsDifferentIdentity() async throws {
        var known = base
        known.googlePlaceID = "google-place-test"
        let data = try payload(name: "Test Kitchen")
        let client = client { request in
            let body = try XCTUnwrap(JSONSerialization.jsonObject(with: request.placesBody) as? [String: Any])
            XCTAssertEqual(body["placeId"] as? String, "google-place-test")
            return (200, data)
        }
        let loaded = await client.loadPlaceInfo(restaurantName: "검증 식당", basePlaceInfo: known)
        XCTAssertEqual(loaded.googleState, .available)
        XCTAssertEqual(loaded.info.googleRating, 4.5)
        known.googlePlaceID = "a-different-confirmed-place"
        let mismatchClient = self.client { _ in (200, data) }
        let wrong = await mismatchClient.loadPlaceInfo(restaurantName: "검증 식당", basePlaceInfo: known)
        XCTAssertEqual(wrong.googleState, .unmatched)
        XCTAssertNil(wrong.info.googleRating)
    }

    func testMissingHoursAndFailedLookupHaveDifferentPresentationStates() async throws {
        let empty = client { _ in (200, Data(#"{"place":null}"#.utf8)) }
        let failed = client { _ in (502, Data("{}".utf8)) }
        let noMatch = await empty.loadPlaceInfo(restaurantName: "검증 식당", basePlaceInfo: base)
        let unavailable = await failed.loadPlaceInfo(restaurantName: "검증 식당", basePlaceInfo: base)
        XCTAssertEqual(noMatch.googleState, .unmatched)
        XCTAssertEqual(unavailable.googleState, .failed)
        XCTAssertEqual(noMatch.info.address, base.address)
        XCTAssertEqual(unavailable.info.kakaoPlaceID, base.kakaoPlaceID)
        XCTAssertNotEqual(noMatch.googleState.missingHoursLabel, unavailable.googleState.missingHoursLabel)
        XCTAssertNotEqual(RestaurantPlaceLookupState.available.missingHoursLabel, noMatch.googleState.missingHoursLabel)
    }

    func testRecordDestinationUsesItsIdentityAndExcludesHomeCooking() throws {
        let original = DiningEntry.sample
        var context = DiningRecordContext(restaurant: "기존 기록 상호", restaurantID: "google-confirmed-id",
            foodSource: .init(kind: "restaurant", restaurantPlace: .init(name: "Verified English Name",
                address: "확인한 주소", googlePlaceID: "confirmed-id", latitude: 37.5, longitude: 127)))
        let entry = context.applying(to: original)
        let restored = try JSONDecoder().decode(DiningEntry.self, from: JSONEncoder().encode(entry))
        let target = try XCTUnwrap(restored.linkedRestaurantSummary)
        XCTAssertEqual(target.id, "google-confirmed-id")
        XCTAssertEqual(target.name, "기존 기록 상호")
        XCTAssertEqual(RestaurantDetailModel(summary: target).fallbackPlaceInfo.googlePlaceID, "confirmed-id")
        XCTAssertEqual(restored.note, original.note)
        XCTAssertEqual(restored.sensorySelections, original.sensorySelections)
        XCTAssertEqual(restored.allReflectionPhotoFilenames, original.allReflectionPhotoFilenames)
        context.foodSource = .init(kind: "homeCooked", homeCookingID: "home")
        XCTAssertNil(context.applying(to: original).linkedRestaurantSummary)
        context.foodSource = nil; context.restaurantID = nil
        XCTAssertNil(context.applying(to: original).linkedRestaurantSummary)
    }

    func testConfigurationUsesBackendAndIgnoresObsoleteGoogleKey() throws {
        let config = RestaurantPlaceAPIConfiguration.from(infoDictionary: [
            "TBGoogleMapsAPIKey": "obsolete-invalid-local-value", "TBKakaoRestAPIKey": "kakao-test",
            "TBSupabaseURL": "https://places.example", "TBSupabasePublishableKey": "sb_publishable_test"
        ])
        XCTAssertEqual(config.backend?.supabaseURL.host, "places.example")
        XCTAssertEqual(config.kakaoRestAPIKey, "kakao-test")
        XCTAssertNil(RestaurantPlaceAPIConfiguration.from(infoDictionary: ["TBGoogleMapsAPIKey": "obsolete"]).backend)
    }

    func testAuthenticatedProxyRequestMapsSourceFieldsAndKeepsKakaoIdentity() async throws {
        let data = try payload()
        let client = client { request in
            XCTAssertEqual(request.url?.path, "/functions/v1/google-place-enrich")
            XCTAssertNil(request.url?.query)
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "apikey"), "sb_publishable_test")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer existing-user-session")
            XCTAssertNil(request.value(forHTTPHeaderField: "X-Goog-Api-Key"))
            let body = try XCTUnwrap(JSONSerialization.jsonObject(with: request.placesBody) as? [String: Any])
            XCTAssertEqual(body["query"] as? String, "검증 식당")
            XCTAssertEqual(body["address"] as? String, "서울 강남구 선릉로158길 11")
            XCTAssertEqual(body["lat"] as? Double, 37.5257)
            return (200, data)
        }
        let result = await client.hydratePlaceInfo(restaurantName: "검증 식당", basePlaceInfo: base)
        XCTAssertEqual(result.kakaoPlaceID, base.kakaoPlaceID)
        XCTAssertEqual(result.address, base.address)
        XCTAssertEqual(result.phone, base.phone)
        XCTAssertEqual(result.sourceByRow[.phone], .kakao)
        XCTAssertEqual(result.googlePlaceID, "google-place-test")
        XCTAssertEqual(result.googleRating, 4.5)
        XCTAssertEqual(result.googleUserRatingCount, 37)
        XCTAssertEqual(result.sourceByRow[.hours], .google)
        XCTAssertEqual(result.sourceByRow[.website], .google)
        XCTAssertEqual(result.googlePhotoAttribution, "검증 제공자")
        XCTAssertEqual(result.googlePhotoURL?.host, "images.example")
    }

    func testWrongRestaurantAndDifferentBranchCannotSupplyGoogleMetadata() async throws {
        for data in [try payload(name: "다른 식당"), try payload(lat: 37.6, lng: 127.1)] {
            let client = client { _ in (200, data) }
            let result = await client.hydratePlaceInfo(restaurantName: "검증 식당", basePlaceInfo: base)
            XCTAssertEqual(result, base)
        }
    }

    func testProxyErrorsStayErrorsAndRetainKnownPlaceOnHydration() async throws {
        for status in [401, 502] {
            let client = client { _ in (status, Data("{}".utf8)) }
            do {
                _ = try await client.lookupGooglePlaceEnrichment(restaurantName: "검증 식당", basePlaceInfo: base)
                XCTFail("A failed read must not become an empty success")
            } catch {
                XCTAssertEqual(error as? RestaurantPlaceAPIError, .providerFailed("Google place enrichment returned \(status)"))
            }
            let result = await client.hydratePlaceInfo(restaurantName: "검증 식당", basePlaceInfo: base)
            XCTAssertEqual(result, base)
        }
    }

    func testDisabledProviderAndKnownEmptyResultRemainDifferent() async throws {
        let disabled = client { _ in (200, Data(#"{"disabled":true,"place":null}"#.utf8)) }
        do {
            _ = try await disabled.lookupGooglePlaceEnrichment(restaurantName: "검증 식당", basePlaceInfo: base)
            XCTFail("Missing server setup must be distinguishable from no matching place")
        } catch { XCTAssertEqual(error as? RestaurantPlaceAPIError, .googleProviderDisabled) }
        let empty = client { _ in (200, Data(#"{"place":null}"#.utf8)) }
        let result = try await empty.lookupGooglePlaceEnrichment(restaurantName: "검증 식당", basePlaceInfo: base)
        XCTAssertNil(result)
    }

    func testMissingSessionDoesNotSendARequest() async throws {
        var client = client { _ in XCTFail("No request may be sent without a session"); return (401, Data()) }
        client.googleAccessToken = { "" }
        do {
            _ = try await client.lookupGooglePlaceEnrichment(restaurantName: "검증 식당", basePlaceInfo: base)
            XCTFail("Expected authentication failure")
        } catch { XCTAssertEqual(error as? RestaurantPlaceAPIError, .googleAuthenticationRequired) }
    }
}

private final class GooglePlacesHTTPProtocol: URLProtocol {
    private static let lock = NSLock()
    private static var responses: [String: (URLRequest) throws -> (Int, Data)] = [:]
    static func register(host: String, response: @escaping (URLRequest) throws -> (Int, Data)) {
        lock.lock(); defer { lock.unlock() }; responses[host] = response
    }
    static func unregister(host: String) { lock.lock(); defer { lock.unlock() }; responses.removeValue(forKey: host) }
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        Self.lock.lock(); let response = Self.responses[request.url?.host ?? ""]; Self.lock.unlock()
        do {
            guard let response else { throw URLError(.unsupportedURL) }
            let (status, data) = try response(request)
            let http = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: http, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
    override func stopLoading() {}
}

private extension URLRequest {
    var placesBody: Data {
        if let httpBody { return httpBody }
        guard let stream = httpBodyStream else { return Data() }
        stream.open(); defer { stream.close() }
        var result = Data(), bytes = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let count = stream.read(&bytes, maxLength: bytes.count)
            guard count > 0 else { break }
            result.append(contentsOf: bytes.prefix(count))
        }
        return result
    }
}

final class BackendIntegrationTests: XCTestCase {
    func testBackendConfigurationDecodesStagingPublishableValues() throws {
        let configuration = try BackendConfiguration.from(infoDictionary: [
            "TBBackendEnvironment": "staging",
            "TBSupabaseURL": "https://taste-buddy-staging.supabase.co",
            "TBSupabasePublishableKey": "sb_publishable_taste_buddy_staging",
            "TBPublicMediaBaseURL": "https://media-staging.tastebuddy.example",
            "TBAuthRedirectURL": "tastebuddy://auth/callback"
        ])

        XCTAssertEqual(configuration.environment, .staging)
        XCTAssertEqual(configuration.supabaseURL.absoluteString, "https://taste-buddy-staging.supabase.co")
        XCTAssertEqual(configuration.supabasePublishableKey, "sb_publishable_taste_buddy_staging")
        XCTAssertEqual(configuration.publicMediaBaseURL?.host, "media-staging.tastebuddy.example")
        XCTAssertEqual(configuration.authRedirectURL.absoluteString, "tastebuddy://auth/callback")
    }

    func testBackendConfigurationRejectsPlaceholderAndSecretValues() {
        XCTAssertThrowsError(try BackendConfiguration.from(infoDictionary: [
            "TBBackendEnvironment": "staging",
            "TBSupabaseURL": "__SET_STAGING_SUPABASE_URL__",
            "TBSupabasePublishableKey": "sb_publishable_taste_buddy_staging"
        ])) { error in
            XCTAssertEqual(error as? BackendConfigurationError, .missingValue("TBSupabaseURL"))
        }

        XCTAssertThrowsError(try BackendConfiguration.from(infoDictionary: [
            "TBBackendEnvironment": "staging",
            "TBSupabaseURL": "https://taste-buddy-staging.supabase.co",
            "TBSupabasePublishableKey": "service_role_should_not_be_in_app"
        ])) { error in
            XCTAssertEqual(
                error as? BackendConfigurationError,
                .disallowedSecret("TBSupabasePublishableKey")
            )
        }
    }

    func testBackendAuthEmailIntentMirrorsReactOtpContract() {
        XCTAssertEqual(BackendAuthEmailIntent.startWithEmail.rawValue, "start-with-email")
        XCTAssertEqual(BackendAuthEmailIntent.linkCurrentProfile.rawValue, "link-current-profile")
        XCTAssertEqual(BackendAuthEmailIntent.startWithEmail.otpTypeIdentifier, "email")
        XCTAssertEqual(BackendAuthEmailIntent.linkCurrentProfile.otpTypeIdentifier, "email_change")
        XCTAssertEqual(
            BackendAuthEmailIntent.startWithEmail.requestSuccessMessage,
            "이메일로 인증 코드를 보냈습니다."
        )
        XCTAssertEqual(
            BackendAuthEmailIntent.linkCurrentProfile.verificationSuccessMessage,
            "현재 프로필이 이메일에 연결되었습니다."
        )
    }

    func testFixtureBackendAuthRepositoryReturnsReactStyleResults() async {
        let user = BackendAuthUserSummary(
            id: "user-fixture",
            email: "taste@example.com",
            isAnonymous: false
        )
        let repository = FixtureBackendAuthRepository(
            result: .success("fixture", user: user)
        )

        let sendResult = await repository.sendEmailOTP(
            email: "taste@example.com",
            intent: .linkCurrentProfile,
            shouldCreateUser: true,
            redirectTo: nil
        )
        let verifyResult = await repository.verifyEmailOTP(
            email: "taste@example.com",
            token: "123456",
            intent: .startWithEmail,
            redirectTo: nil
        )
        let googleResult = await repository.continueWithGoogle(redirectTo: nil)
        let deleteResult = await repository.deleteCurrentAccount()

        XCTAssertTrue(sendResult.ok)
        XCTAssertEqual(sendResult.message, "현재 프로필을 연결할 인증 코드를 보냈습니다.")
        XCTAssertEqual(verifyResult.user, user)
        XCTAssertEqual(verifyResult.message, "이메일 인증이 완료되었습니다.")
        XCTAssertEqual(googleResult.user, user)
        XCTAssertEqual(googleResult.message, "Google 로그인이 완료되었습니다.")
        XCTAssertEqual(deleteResult.message, "계정이 삭제되었습니다.")
    }

    func testBackendSessionRestoreSkipsRefreshWhenNoCurrentSessionExists() async {
        var refreshCallCount = 0

        let status = await BackendSessionRestoreResolver.resolve(
            currentSessionIsExpired: nil
        ) {
            refreshCallCount += 1
        }

        XCTAssertEqual(status, .signedOut)
        XCTAssertEqual(refreshCallCount, 0)
    }

    func testBackendSessionRestoreRefreshesOnlyExpiredCurrentSession() async {
        var refreshCallCount = 0

        let activeStatus = await BackendSessionRestoreResolver.resolve(
            currentSessionIsExpired: false
        ) {
            refreshCallCount += 1
        }
        let expiredStatus = await BackendSessionRestoreResolver.resolve(
            currentSessionIsExpired: true
        ) {
            refreshCallCount += 1
        }

        XCTAssertEqual(activeStatus, .authenticated)
        XCTAssertEqual(expiredStatus, .authenticated)
        XCTAssertEqual(refreshCallCount, 1)
    }

    @MainActor
    func testAuthEntryModelMirrorsReactValidationMessages() async {
        let repository = RecordingBackendAuthRepository()
        let model = AuthEntryModel(
            intent: .startWithEmail,
            repository: repository,
            isConfigured: true
        )

        await model.submitEmail("")

        XCTAssertEqual(model.status, .error)
        XCTAssertEqual(model.message, "친구들과 리뷰를 이어갈 이메일을 입력해 주세요.")

        model.email = "taste@example.com"
        await model.submitEmail()

        XCTAssertEqual(model.step, .code)
        XCTAssertEqual(model.pendingEmail, "taste@example.com")

        model.code = "12345"
        await model.submitCode()

        XCTAssertEqual(model.status, .error)
        XCTAssertEqual(model.message, "이메일로 받은 6자리 코드를 입력해 주세요.")
    }

    @MainActor
    func testAuthEntryModelRequestsLoginOrSignupCode() async {
        let repository = RecordingBackendAuthRepository()
        let model = AuthEntryModel(
            intent: .startWithEmail,
            repository: repository,
            isConfigured: true,
            isAnonymousUser: true
        )

        model.email = "taste@example.com"
        await model.submitEmail()

        XCTAssertEqual(repository.sendCalls.map(\.intent), [.startWithEmail])
        XCTAssertEqual(repository.sendCalls.map(\.shouldCreateUser), [true])
        XCTAssertEqual(model.intent, .startWithEmail)
        XCTAssertEqual(model.step, .code)
        XCTAssertEqual(model.message, "이메일로 인증 코드를 보냈습니다.")

        model.code = "123456"
        let completion = await model.submitCode()

        XCTAssertEqual(repository.verifyCalls.map(\.intent), [.startWithEmail])
        XCTAssertEqual(
            completion,
            .verifiedEmailLogin(.success("이메일 인증이 완료되었습니다."))
        )
    }

    @MainActor
    func testAuthEntryModelCompletesGoogleLoginFromEmailStep() async {
        let user = BackendAuthUserSummary(
            id: "google-user",
            email: "taste@gmail.com",
            isAnonymous: false
        )
        let repository = RecordingBackendAuthRepository(
            googleResult: .success("Google 로그인이 완료되었습니다.", user: user)
        )
        let redirectURL = URL(string: "tastebuddy://auth/callback")!
        let model = AuthEntryModel(
            intent: .startWithEmail,
            repository: repository,
            isConfigured: true,
            isAnonymousUser: true,
            redirectURL: redirectURL
        )

        let completion = await model.continueWithGoogle()

        XCTAssertEqual(repository.googleRedirects.count, 1)
        XCTAssertEqual(repository.googleRedirects.first!, redirectURL)
        XCTAssertEqual(
            completion,
            .verifiedEmailLogin(.success("Google 로그인이 완료되었습니다.", user: user))
        )
        XCTAssertEqual(model.step, .email)
        XCTAssertNil(model.message)
    }

    @MainActor
    func testAuthEntryDevBypassMirrorsReactDevelopmentFlow() {
        let startModel = AuthEntryModel(
            intent: .startWithEmail,
            repository: RecordingBackendAuthRepository(),
            isConfigured: true
        )

        XCTAssertEqual(startModel.devBypass(), .continueAsGuest)
        XCTAssertEqual(startModel.step, .email)
        XCTAssertNil(startModel.pendingEmail)
        XCTAssertNil(startModel.message)

        let linkModel = AuthEntryModel(
            intent: .linkCurrentProfile,
            repository: RecordingBackendAuthRepository(),
            isConfigured: true
        )

        XCTAssertNil(linkModel.devBypass())
        XCTAssertEqual(linkModel.pendingEmail, "dev@tastebuddy.local")
        XCTAssertEqual(linkModel.step, .code)
        XCTAssertEqual(linkModel.status, .success)
        XCTAssertEqual(linkModel.message, "개발용으로 인증 코드 입력 단계로 이동했습니다.")

        XCTAssertEqual(linkModel.devBypass(), .linkedCurrentProfile)
        XCTAssertEqual(linkModel.step, .email)
        XCTAssertNil(linkModel.pendingEmail)
        XCTAssertNil(linkModel.message)
    }

    @MainActor
    func testAppModelRestoresInjectedBackendSessionStatusOnce() async {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let model = AppModel(
            defaults: defaults,
            sessionRepository: FixtureBackendSessionRepository(status: .authenticated)
        )

        XCTAssertEqual(model.backendSessionStatus, .restoring)

        await model.restoreBackendSessionIfNeeded()
        await model.restoreBackendSessionIfNeeded()

        XCTAssertEqual(model.backendSessionStatus, .authenticated)
    }

    @MainActor
    func testAppModelHydratesPublicProfileIdentityAfterAuthenticatedRestore() async {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let repository = RecordingBackendPublicProfileRepository(
            currentIdentity: BackendPublicProfileIdentity(
                id: "remote-user",
                displayName: "공개 이름",
                nickname: "공개버디"
            )
        )
        let model = AppModel(
            defaults: defaults,
            sessionRepository: FixtureBackendSessionRepository(status: .authenticated),
            publicProfileRepository: repository
        )
        model.saveProfileIdentity(
            UserProfileIdentity(
                displayName: "로컬 이름",
                nickname: "로컬버디",
                birthDate: "1990-01-01",
                sexContext: "응답하지 않음",
                smokingStatus: "비흡연",
                dietaryRestrictions: ["견과류"]
            )
        )

        await model.restoreBackendSessionIfNeeded()

        XCTAssertEqual(model.profileIdentity.displayName, "공개 이름")
        XCTAssertEqual(model.profileIdentity.nickname, "공개버디")
        XCTAssertEqual(model.profileIdentity.birthDate, "1990-01-01")
        XCTAssertEqual(repository.currentIdentityCallCount, 1)
    }

    @MainActor
    func testAppModelPublishesCurrentProfileIdentityWhenAuthenticated() async {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let repository = RecordingBackendPublicProfileRepository()
        let model = AppModel(
            defaults: defaults,
            sessionRepository: FixtureBackendSessionRepository(status: .signedOut),
            publicProfileRepository: repository
        )
        model.completeVerifiedEmailAuthEntry()
        model.saveProfileIdentity(
            UserProfileIdentity(
                displayName: "새 이름",
                nickname: "@새버디",
                birthDate: nil,
                sexContext: nil,
                smokingStatus: nil,
                dietaryRestrictions: []
            )
        )

        let result = await model.publishCurrentProfileIdentity()

        XCTAssertTrue(result.ok)
        XCTAssertEqual(repository.updateCalls.map(\.displayName), ["새 이름"])
        XCTAssertEqual(repository.updateCalls.map(\.nickname), ["새버디"])
    }

    @MainActor
    func testAppModelLogoutSignsOutBackendBeforeReturningToAuthEntry() async {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let authRepository = RecordingBackendAuthRepository()
        let model = AppModel(
            defaults: defaults,
            authRepository: authRepository,
            sessionRepository: FixtureBackendSessionRepository(status: .authenticated)
        )
        model.completeVerifiedEmailAuthEntry()
        model.completeOnboarding()

        let result = await model.logout()

        XCTAssertTrue(result.ok)
        XCTAssertEqual(authRepository.signOutCallCount, 1)
        XCTAssertFalse(model.hasCompletedAuthEntry)
        XCTAssertFalse(model.hasSeenOnboarding)
        XCTAssertEqual(model.backendSessionStatus, .signedOut)
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: model.hasCompletedAuthEntry,
                backendSessionStatus: model.backendSessionStatus,
                hasSeenOnboarding: model.hasSeenOnboarding,
                hasPreferenceProfile: model.preferenceProfile != nil,
                hasTasteProfile: model.profile != nil
            ),
            .authEntry
        )

        let nextLaunch = AppModel(
            defaults: defaults,
            authRepository: authRepository,
            sessionRepository: FixtureBackendSessionRepository(status: .signedOut)
        )
        await nextLaunch.restoreBackendSessionIfNeeded()

        XCTAssertEqual(nextLaunch.backendSessionStatus, .signedOut)
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: nextLaunch.hasCompletedAuthEntry,
                backendSessionStatus: nextLaunch.backendSessionStatus,
                hasSeenOnboarding: nextLaunch.hasSeenOnboarding,
                hasPreferenceProfile: nextLaunch.preferenceProfile != nil,
                hasTasteProfile: nextLaunch.profile != nil
            ),
            .authEntry
        )
    }

    @MainActor
    func testAppModelLogoutFailurePreservesAuthenticatedState() async {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let authRepository = RecordingBackendAuthRepository(
            signOutResult: .failure("로그아웃에 실패했습니다.")
        )
        let model = AppModel(
            defaults: defaults,
            authRepository: authRepository,
            sessionRepository: FixtureBackendSessionRepository(status: .authenticated)
        )
        model.completeVerifiedEmailAuthEntry()
        model.completeOnboarding()

        let result = await model.logout()

        XCTAssertFalse(result.ok)
        XCTAssertEqual(authRepository.signOutCallCount, 1)
        XCTAssertTrue(model.hasCompletedAuthEntry)
        XCTAssertTrue(model.hasSeenOnboarding)
        XCTAssertEqual(model.backendSessionStatus, .authenticated)
    }

    @MainActor
    func testAccountDeletionPreservesLocalDataOnFailureAndClearsItAfterRetry() async throws {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let repository = RecordingBackendAuthRepository(deleteResults: [
            .failure("계정 삭제에 실패했습니다."),
            .success("계정이 삭제되었습니다.")
        ])
        let savedAt = Date(timeIntervalSince1970: 1_800_000_000)
        let model = AppModel(defaults: defaults, authRepository: repository, now: { savedAt })
        model.completeVerifiedEmailAuthEntry()
        model.completeOnboarding()
        model.saveProfile(.sample)
        let original = DiningEntry.sample
        model.addDiningEntry(original)
        let savedEntry = try XCTUnwrap(model.diningEntries.first)
        XCTAssertEqual(savedEntry.savedAt, savedAt)
        XCTAssertNil(savedEntry.updatedAt)
        try assertDiningSourceUnchangedByStorage(savedEntry, original: original)

        let failure = await model.deleteCurrentAccount()

        XCTAssertFalse(failure.ok)
        XCTAssertNotNil(model.profile)
        XCTAssertEqual(model.diningEntries, [savedEntry])
        XCTAssertEqual(AppModel(defaults: defaults).diningEntries, [savedEntry])
        XCTAssertTrue(model.hasSeenOnboarding)
        XCTAssertEqual(model.backendSessionStatus, .authenticated)
        XCTAssertNotNil(AppModel(defaults: defaults).profile)

        let success = await model.deleteCurrentAccount()

        XCTAssertTrue(success.ok)
        XCTAssertEqual(repository.deleteCallCount, 2)
        XCTAssertNil(model.profile)
        XCTAssertTrue(model.diningEntries.isEmpty)
        XCTAssertFalse(model.hasCompletedAuthEntry)
        XCTAssertEqual(model.backendSessionStatus, .signedOut)
        XCTAssertNil(AppModel(defaults: defaults).profile)
        await model.restoreBackendSessionIfNeeded()
        XCTAssertEqual(model.backendSessionStatus, .signedOut)
    }

    @MainActor
    func testGuestDeletionOnlySkipsBackendWhenNoSessionExists() async {
        for hasSession in [false, true] {
            let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
            let defaults = UserDefaults(suiteName: suiteName)!
            defer { defaults.removePersistentDomain(forName: suiteName) }
            let repository = RecordingBackendAuthRepository(hasCurrentSession: hasSession)
            let model = AppModel(
                defaults: defaults,
                authRepository: repository,
                sessionRepository: FixtureBackendSessionRepository(status: .signedOut)
            )
            await model.restoreBackendSessionIfNeeded()
            model.completeAuthEntry()
            model.saveProfile(.sample)

            let result = await model.deleteCurrentAccount()

            XCTAssertTrue(result.ok)
            XCTAssertEqual(repository.deleteCallCount, hasSession ? 1 : 0)
            XCTAssertNil(model.profile)
            XCTAssertEqual(model.backendSessionStatus, .signedOut)
        }
    }

    @MainActor
    func testAccountDeletionRequiresBackendConfirmationForAuthenticatedState() async {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let repository = RecordingBackendAuthRepository(
            hasCurrentSession: false,
            deleteResults: [.failure("다시 로그인해 주세요.")]
        )
        let model = AppModel(defaults: defaults, authRepository: repository)
        model.completeVerifiedEmailAuthEntry()
        model.saveProfile(.sample)

        let result = await model.deleteCurrentAccount()

        XCTAssertFalse(result.ok)
        XCTAssertEqual(repository.deleteCallCount, 1)
        XCTAssertNotNil(model.profile)
    }

    @MainActor
    func testEmailLinkUpdatesAuthenticationAndRetriesPublishingCurrentIdentity() async {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let repository = RecordingBackendPublicProfileRepository(
            mutationResult: .failure("프로필 저장을 다시 시도해 주세요.")
        )
        let model = AppModel(defaults: defaults, publicProfileRepository: repository)
        model.completeAuthEntry()
        var identity = UserProfileIdentity.default
        identity.displayName = "연결할 프로필"
        identity.nickname = "@linked-profile"
        model.saveProfileIdentity(identity)

        let failure = await model.completeLinkedCurrentProfileAuthEntry()

        XCTAssertFalse(failure.ok)
        XCTAssertEqual(model.backendSessionStatus, .authenticated)
        XCTAssertTrue(model.hasCompletedAuthEntry)
        XCTAssertEqual(repository.updateCalls, [identity.sanitized])
        XCTAssertEqual(model.profileIdentity, identity.sanitized)

        repository.mutationResult = .success("프로필 정보가 저장되었습니다.")
        let success = await model.completeLinkedCurrentProfileAuthEntry()

        XCTAssertTrue(success.ok)
        XCTAssertEqual(repository.updateCalls, [identity.sanitized, identity.sanitized])
        XCTAssertEqual(repository.currentIdentityCallCount, 0)
    }

    @MainActor
    func testGuestAuthEntryCompletionDoesNotPersistAcrossLaunches() {
        let suiteName = "tastebuddy.backend.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let firstLaunch = AppModel(
            defaults: defaults,
            sessionRepository: FixtureBackendSessionRepository(status: .signedOut)
        )

        firstLaunch.completeAuthEntry()
        XCTAssertTrue(firstLaunch.hasCompletedAuthEntry)

        let nextLaunch = AppModel(
            defaults: defaults,
            sessionRepository: FixtureBackendSessionRepository(status: .signedOut)
        )

        XCTAssertFalse(nextLaunch.hasCompletedAuthEntry)
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: nextLaunch.hasCompletedAuthEntry,
                backendSessionStatus: .signedOut,
                hasSeenOnboarding: true,
                hasPreferenceProfile: true,
                hasTasteProfile: true
            ),
            .authEntry
        )
    }
}

private final class RecordingBackendAuthRepository: BackendAuthRepository {
    struct SendCall: Equatable {
        let email: String
        let intent: BackendAuthEmailIntent
        let shouldCreateUser: Bool
    }

    struct VerifyCall: Equatable {
        let email: String
        let token: String
        let intent: BackendAuthEmailIntent
    }

    private var sendResults: [BackendAuthResult]
    private var verifyResults: [BackendAuthResult]
    private var googleResult: BackendAuthResult
    private var signOutResult: BackendAuthResult
    private var deleteResults: [BackendAuthResult]
    let hasCurrentSession: Bool
    private(set) var sendCalls: [SendCall] = []
    private(set) var verifyCalls: [VerifyCall] = []
    private(set) var googleRedirects: [URL?] = []
    private(set) var signOutCallCount = 0
    private(set) var deleteCallCount = 0

    init(
        sendResults: [BackendAuthResult] = [
            .success("이메일로 인증 코드를 보냈습니다.")
        ],
        verifyResults: [BackendAuthResult] = [
            .success("이메일 인증이 완료되었습니다.")
        ],
        googleResult: BackendAuthResult = .success("Google 로그인이 완료되었습니다."),
        signOutResult: BackendAuthResult = .success("로그아웃되었습니다."),
        hasCurrentSession: Bool = true,
        deleteResults: [BackendAuthResult] = [.success("계정이 삭제되었습니다.")]
    ) {
        self.sendResults = sendResults
        self.verifyResults = verifyResults
        self.googleResult = googleResult
        self.signOutResult = signOutResult
        self.hasCurrentSession = hasCurrentSession
        self.deleteResults = deleteResults
    }

    func ensureAnonymousSession() async -> BackendAuthResult {
        .success("게스트 세션이 준비되었습니다.")
    }

    func continueWithGoogle(redirectTo: URL?) async -> BackendAuthResult {
        googleRedirects.append(redirectTo)
        return googleResult
    }

    func sendEmailOTP(
        email: String,
        intent: BackendAuthEmailIntent,
        shouldCreateUser: Bool,
        redirectTo: URL?
    ) async -> BackendAuthResult {
        sendCalls.append(
            SendCall(
                email: email,
                intent: intent,
                shouldCreateUser: shouldCreateUser
            )
        )
        guard !sendResults.isEmpty else {
            return .success(intent.requestSuccessMessage)
        }

        return sendResults.removeFirst()
    }

    func verifyEmailOTP(
        email: String,
        token: String,
        intent: BackendAuthEmailIntent,
        redirectTo: URL?
    ) async -> BackendAuthResult {
        verifyCalls.append(VerifyCall(email: email, token: token, intent: intent))
        guard !verifyResults.isEmpty else {
            return .success(intent.verificationSuccessMessage)
        }

        return verifyResults.removeFirst()
    }

    func linkCurrentProfileEmail(email: String, redirectTo: URL?) async -> BackendAuthResult {
        .success("확인 메일을 보냈습니다. 링크를 열면 현재 미각 프로필이 이메일에 연결됩니다.")
    }

    func signOutLocal() async -> BackendAuthResult {
        signOutCallCount += 1
        return signOutResult
    }

    func deleteCurrentAccount() async -> BackendAuthResult {
        deleteCallCount += 1
        return deleteResults.isEmpty ? .success("계정이 삭제되었습니다.") : deleteResults.removeFirst()
    }
}

private final class RecordingBackendPublicProfileRepository: BackendPublicProfileRepository {
    var currentIdentity: BackendPublicProfileIdentity?
    var mutationResult: BackendProfileIdentityMutationResult
    private(set) var updateCalls: [UserProfileIdentity] = []
    private(set) var currentIdentityCallCount = 0

    init(
        currentIdentity: BackendPublicProfileIdentity? = nil,
        mutationResult: BackendProfileIdentityMutationResult = .success("프로필 정보가 저장되었습니다.")
    ) {
        self.currentIdentity = currentIdentity
        self.mutationResult = mutationResult
    }

    func updateCurrentProfileIdentity(_ identity: UserProfileIdentity) async -> BackendProfileIdentityMutationResult {
        updateCalls.append(identity.sanitized)
        return mutationResult
    }

    func currentProfileIdentity() async -> BackendPublicProfileIdentity? {
        currentIdentityCallCount += 1
        return currentIdentity
    }

    func searchProfileIdentities(matching query: String) async throws -> [BackendPublicProfileIdentity] {
        []
    }
}
