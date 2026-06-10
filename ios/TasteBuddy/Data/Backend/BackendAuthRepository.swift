import Foundation

#if canImport(Supabase)
import Supabase
#endif

enum BackendAuthEmailIntent: String, Equatable {
    case startWithEmail = "start-with-email"
    case linkCurrentProfile = "link-current-profile"

    var requestSuccessMessage: String {
        switch self {
        case .startWithEmail:
            return "이메일로 인증 코드를 보냈습니다."
        case .linkCurrentProfile:
            return "현재 프로필을 연결할 인증 코드를 보냈습니다."
        }
    }

    var verificationSuccessMessage: String {
        switch self {
        case .startWithEmail:
            return "이메일 인증이 완료되었습니다."
        case .linkCurrentProfile:
            return "현재 프로필이 이메일에 연결되었습니다."
        }
    }

    var otpTypeIdentifier: String {
        switch self {
        case .startWithEmail:
            return "email"
        case .linkCurrentProfile:
            return "email_change"
        }
    }

    #if canImport(Supabase)
    var emailOTPType: EmailOTPType {
        switch self {
        case .startWithEmail:
            return .email
        case .linkCurrentProfile:
            return .emailChange
        }
    }
    #endif
}

struct BackendAuthUserSummary: Equatable {
    let id: String
    let email: String?
    let isAnonymous: Bool
}

struct BackendAuthResult: Equatable {
    let ok: Bool
    let message: String
    let user: BackendAuthUserSummary?

    static func success(
        _ message: String,
        user: BackendAuthUserSummary? = nil
    ) -> BackendAuthResult {
        BackendAuthResult(ok: true, message: message, user: user)
    }

    static func failure(_ message: String) -> BackendAuthResult {
        BackendAuthResult(ok: false, message: message, user: nil)
    }
}

protocol BackendAuthRepository {
    func ensureAnonymousSession() async -> BackendAuthResult
    func sendEmailOTP(
        email: String,
        intent: BackendAuthEmailIntent,
        shouldCreateUser: Bool,
        redirectTo: URL?
    ) async -> BackendAuthResult
    func verifyEmailOTP(
        email: String,
        token: String,
        intent: BackendAuthEmailIntent,
        redirectTo: URL?
    ) async -> BackendAuthResult
    func linkCurrentProfileEmail(email: String, redirectTo: URL?) async -> BackendAuthResult
    func signOutLocal() async -> BackendAuthResult
    func deleteCurrentAccount() async -> BackendAuthResult
}

struct FixtureBackendAuthRepository: BackendAuthRepository {
    var result: BackendAuthResult

    init(result: BackendAuthResult = .success("fixture auth ok")) {
        self.result = result
    }

    func ensureAnonymousSession() async -> BackendAuthResult {
        result
    }

    func sendEmailOTP(
        email: String,
        intent: BackendAuthEmailIntent,
        shouldCreateUser: Bool,
        redirectTo: URL?
    ) async -> BackendAuthResult {
        .success(intent.requestSuccessMessage, user: result.user)
    }

    func verifyEmailOTP(
        email: String,
        token: String,
        intent: BackendAuthEmailIntent,
        redirectTo: URL?
    ) async -> BackendAuthResult {
        .success(intent.verificationSuccessMessage, user: result.user)
    }

    func linkCurrentProfileEmail(email: String, redirectTo: URL?) async -> BackendAuthResult {
        .success("확인 메일을 보냈습니다. 링크를 열면 현재 미각 프로필이 이메일에 연결됩니다.", user: result.user)
    }

    func signOutLocal() async -> BackendAuthResult {
        .success("로그아웃되었습니다.")
    }

    func deleteCurrentAccount() async -> BackendAuthResult {
        .success("계정이 삭제되었습니다.")
    }
}

struct MissingConfigurationAuthRepository: BackendAuthRepository {
    let reason: String

    private var result: BackendAuthResult {
        .failure(reason)
    }

    func ensureAnonymousSession() async -> BackendAuthResult {
        result
    }

    func sendEmailOTP(
        email: String,
        intent: BackendAuthEmailIntent,
        shouldCreateUser: Bool,
        redirectTo: URL?
    ) async -> BackendAuthResult {
        result
    }

    func verifyEmailOTP(
        email: String,
        token: String,
        intent: BackendAuthEmailIntent,
        redirectTo: URL?
    ) async -> BackendAuthResult {
        result
    }

    func linkCurrentProfileEmail(email: String, redirectTo: URL?) async -> BackendAuthResult {
        result
    }

    func signOutLocal() async -> BackendAuthResult {
        result
    }

    func deleteCurrentAccount() async -> BackendAuthResult {
        result
    }
}

#if canImport(Supabase)
struct SupabaseAuthRepository: BackendAuthRepository {
    let client: SupabaseClient

    func ensureAnonymousSession() async -> BackendAuthResult {
        if let currentSession = client.auth.currentSession {
            return .success("세션이 준비되었습니다.", user: BackendAuthUserSummary(currentSession.user))
        }

        do {
            let session = try await client.auth.signInAnonymously()
            return .success("게스트 세션이 준비되었습니다.", user: BackendAuthUserSummary(session.user))
        } catch {
            return .failure(authErrorMessage(error))
        }
    }

    func sendEmailOTP(
        email: String,
        intent: BackendAuthEmailIntent = .startWithEmail,
        shouldCreateUser: Bool = true,
        redirectTo: URL? = nil
    ) async -> BackendAuthResult {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedEmail.isEmpty else {
            return .failure("이메일을 입력해주세요.")
        }

        do {
            switch intent {
            case .startWithEmail:
                try await client.auth.signInWithOTP(
                    email: trimmedEmail,
                    redirectTo: redirectTo,
                    shouldCreateUser: shouldCreateUser
                )
            case .linkCurrentProfile:
                try await client.auth.update(
                    user: UserAttributes(email: trimmedEmail),
                    redirectTo: redirectTo
                )
            }

            return .success(intent.requestSuccessMessage)
        } catch {
            return .failure(authErrorMessage(error))
        }
    }

    func verifyEmailOTP(
        email: String,
        token: String,
        intent: BackendAuthEmailIntent = .startWithEmail,
        redirectTo: URL? = nil
    ) async -> BackendAuthResult {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedToken = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedEmail.isEmpty, !trimmedToken.isEmpty else {
            return .failure("이메일과 인증 코드를 확인해주세요.")
        }

        do {
            let response = try await client.auth.verifyOTP(
                email: trimmedEmail,
                token: trimmedToken,
                type: intent.emailOTPType,
                redirectTo: redirectTo
            )
            return .success(
                intent.verificationSuccessMessage,
                user: BackendAuthUserSummary(response.user)
            )
        } catch {
            return .failure(authErrorMessage(error))
        }
    }

    func linkCurrentProfileEmail(email: String, redirectTo: URL? = nil) async -> BackendAuthResult {
        let sessionResult = await ensureAnonymousSession()
        guard sessionResult.ok else {
            return .failure("로그인 세션을 만들 수 없습니다.")
        }

        return await sendEmailOTP(
            email: email,
            intent: .linkCurrentProfile,
            shouldCreateUser: true,
            redirectTo: redirectTo
        )
    }

    func signOutLocal() async -> BackendAuthResult {
        do {
            try await client.auth.signOut(scope: .local)
            return .success("로그아웃되었습니다.")
        } catch {
            return .failure(authErrorMessage(error))
        }
    }

    func deleteCurrentAccount() async -> BackendAuthResult {
        do {
            try await client.functions.invoke(
                "delete-account",
                options: FunctionInvokeOptions(method: .post)
            )
            _ = await signOutLocal()
            return .success("계정이 삭제되었습니다.")
        } catch {
            return .failure(authErrorMessage(error))
        }
    }

    private func authErrorMessage(_ error: Error) -> String {
        let message = error.localizedDescription
        return message.isEmpty ? "Supabase 인증 요청에 실패했습니다." : message
    }
}

extension SupabaseAuthRepository: BackendSessionRepository {
    func restoreSession() async -> BackendSessionStatus {
        do {
            _ = try await client.auth.session
            return .authenticated
        } catch {
            let errorText = String(describing: error)
            if errorText.localizedCaseInsensitiveContains("missing")
                || errorText.localizedCaseInsensitiveContains("not found")
                || errorText.localizedCaseInsensitiveContains("session") {
                return .signedOut
            }

            return .failed("Supabase session restore failed")
        }
    }
}

private extension BackendAuthUserSummary {
    init(_ user: User) {
        self.init(id: user.id.uuidString, email: user.email, isAnonymous: user.isAnonymous)
    }
}
#endif

enum BackendAuthRepositoryFactory {
    static func isConfigured(bundle: Bundle = .main) -> Bool {
        do {
            _ = try BackendConfiguration.load(bundle: bundle)

            #if canImport(Supabase)
            return true
            #else
            return false
            #endif
        } catch {
            return false
        }
    }

    static func makeDefault(bundle: Bundle = .main) -> any BackendAuthRepository {
        do {
            let configuration = try BackendConfiguration.load(bundle: bundle)
            let provider = SupabaseClientProvider(configuration: configuration)

            #if canImport(Supabase)
            return SupabaseAuthRepository(client: provider.makeClient())
            #else
            return MissingConfigurationAuthRepository(reason: "Supabase Swift package is not linked.")
            #endif
        } catch {
            return MissingConfigurationAuthRepository(reason: error.localizedDescription)
        }
    }
}
