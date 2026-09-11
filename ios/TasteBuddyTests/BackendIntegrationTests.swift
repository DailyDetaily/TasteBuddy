import XCTest
@testable import TasteBuddy

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
