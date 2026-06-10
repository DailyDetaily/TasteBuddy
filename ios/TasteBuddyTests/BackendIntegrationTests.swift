import XCTest
@testable import TasteBuddy

final class BackendIntegrationTests: XCTestCase {
    func testBackendConfigurationDecodesStagingPublishableValues() throws {
        let configuration = try BackendConfiguration.from(infoDictionary: [
            "TBBackendEnvironment": "staging",
            "TBSupabaseURL": "https://taste-buddy-staging.supabase.co",
            "TBSupabasePublishableKey": "sb_publishable_taste_buddy_staging",
            "TBPublicMediaBaseURL": "https://media-staging.tastebuddy.example"
        ])

        XCTAssertEqual(configuration.environment, .staging)
        XCTAssertEqual(configuration.supabaseURL.absoluteString, "https://taste-buddy-staging.supabase.co")
        XCTAssertEqual(configuration.supabasePublishableKey, "sb_publishable_taste_buddy_staging")
        XCTAssertEqual(configuration.publicMediaBaseURL?.host, "media-staging.tastebuddy.example")
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
        let deleteResult = await repository.deleteCurrentAccount()

        XCTAssertTrue(sendResult.ok)
        XCTAssertEqual(sendResult.message, "현재 프로필을 연결할 인증 코드를 보냈습니다.")
        XCTAssertEqual(verifyResult.user, user)
        XCTAssertEqual(verifyResult.message, "이메일 인증이 완료되었습니다.")
        XCTAssertEqual(deleteResult.message, "계정이 삭제되었습니다.")
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
    func testAuthEntryModelAutoSwitchesAnonymousStartToLinkCurrentProfile() async {
        let repository = RecordingBackendAuthRepository(
            sendResults: [
                .failure("Signups not allowed for this project."),
                .success("현재 프로필을 연결할 인증 코드를 보냈습니다.")
            ],
            verifyResults: [
                .success("현재 프로필이 이메일에 연결되었습니다.")
            ]
        )
        let model = AuthEntryModel(
            intent: .startWithEmail,
            repository: repository,
            isConfigured: true,
            isAnonymousUser: true
        )

        model.email = "taste@example.com"
        await model.submitEmail()

        XCTAssertEqual(repository.sendCalls.map(\.intent), [.startWithEmail, .linkCurrentProfile])
        XCTAssertEqual(repository.sendCalls.map(\.shouldCreateUser), [false, true])
        XCTAssertEqual(model.intent, .linkCurrentProfile)
        XCTAssertEqual(model.step, .code)
        XCTAssertEqual(model.message, "현재 프로필을 연결할 인증 코드를 보냈습니다.")

        model.code = "123456"
        let completion = await model.submitCode()

        XCTAssertEqual(repository.verifyCalls.map(\.intent), [.linkCurrentProfile])
        XCTAssertEqual(completion, .linkedCurrentProfile)
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
    private(set) var sendCalls: [SendCall] = []
    private(set) var verifyCalls: [VerifyCall] = []

    init(
        sendResults: [BackendAuthResult] = [
            .success("이메일로 인증 코드를 보냈습니다.")
        ],
        verifyResults: [BackendAuthResult] = [
            .success("이메일 인증이 완료되었습니다.")
        ]
    ) {
        self.sendResults = sendResults
        self.verifyResults = verifyResults
    }

    func ensureAnonymousSession() async -> BackendAuthResult {
        .success("게스트 세션이 준비되었습니다.")
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
        .success("로그아웃되었습니다.")
    }

    func deleteCurrentAccount() async -> BackendAuthResult {
        .success("계정이 삭제되었습니다.")
    }
}
