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
    var hasCurrentSession: Bool { get }
    var currentUser: BackendAuthUserSummary? { get }
    func ensureAnonymousSession() async -> BackendAuthResult
    func continueWithGoogle(redirectTo: URL?) async -> BackendAuthResult
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

extension BackendAuthRepository {
    var currentUser: BackendAuthUserSummary? { nil }
}

struct FixtureBackendAuthRepository: BackendAuthRepository {
    var result: BackendAuthResult
    var hasCurrentSession: Bool { result.user != nil }
    var currentUser: BackendAuthUserSummary? { result.user }

    init(result: BackendAuthResult = .success("fixture auth ok")) {
        self.result = result
    }

    func ensureAnonymousSession() async -> BackendAuthResult {
        result
    }

    func continueWithGoogle(redirectTo: URL?) async -> BackendAuthResult {
        .success("Google 로그인이 완료되었습니다.", user: result.user)
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
    var hasCurrentSession: Bool { false }

    private var result: BackendAuthResult {
        .failure(reason)
    }

    func ensureAnonymousSession() async -> BackendAuthResult {
        result
    }

    func continueWithGoogle(redirectTo: URL?) async -> BackendAuthResult {
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
    var hasCurrentSession: Bool { client.auth.currentSession != nil }
    var currentUser: BackendAuthUserSummary? { client.auth.currentSession.map { BackendAuthUserSummary($0.user) } }

    func ensureAnonymousSession() async -> BackendAuthResult {
        do {
            if let currentSession = client.auth.currentSession {
                let validSession = currentSession.isExpired
                    ? try await client.auth.session
                    : currentSession
                return .success(
                    "세션이 준비되었습니다.",
                    user: BackendAuthUserSummary(validSession.user)
                )
            }

            let session = try await client.auth.signInAnonymously()
            return .success("게스트 세션이 준비되었습니다.", user: BackendAuthUserSummary(session.user))
        } catch {
            return .failure(authErrorMessage(error))
        }
    }

    func continueWithGoogle(redirectTo: URL? = nil) async -> BackendAuthResult {
        do {
            let session = try await client.auth.signInWithOAuth(
                provider: .google,
                redirectTo: redirectTo
            )
            return .success(
                "Google 로그인이 완료되었습니다.",
                user: BackendAuthUserSummary(session.user)
            )
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
        await BackendSessionRestoreResolver.resolve(
            currentSessionIsExpired: client.auth.currentSession?.isExpired
        ) {
            _ = try await client.auth.session
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
    static func authRedirectURL(bundle: Bundle = .main) -> URL? {
        do {
            return try BackendConfiguration.load(bundle: bundle).authRedirectURL
        } catch {
            return nil
        }
    }

    static func handleRedirectURL(_ url: URL, bundle: Bundle = .main) {
        do {
            let configuration = try BackendConfiguration.load(bundle: bundle)
            let provider = SupabaseClientProvider(configuration: configuration)

            #if canImport(Supabase)
            provider.makeClient().auth.handle(url)
            #else
            _ = provider
            #endif
        } catch {
            return
        }
    }

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

struct BackendPublicProfileIdentity: Codable, Equatable, Identifiable {
    let id: String
    let displayName: String?
    let nickname: String?
    let avatarPath: String?
    let isFriend: Bool

    init(
        id: String,
        displayName: String?,
        nickname: String?,
        avatarPath: String? = nil,
        isFriend: Bool = false
    ) {
        self.id = id
        self.displayName = Self.trimmed(displayName)
        self.nickname = Self.normalizedNickname(nickname)
        self.avatarPath = Self.trimmed(avatarPath)
        self.isFriend = isFriend
    }

    var title: String {
        displayName ?? nickname ?? "공개 프로필"
    }

    var displayNickname: String {
        guard let nickname, !nickname.isEmpty else {
            return "@tastebuddy"
        }

        return "@\(nickname)"
    }

    func merged(with localIdentity: UserProfileIdentity) -> UserProfileIdentity {
        UserProfileIdentity(
            displayName: displayName ?? localIdentity.displayName,
            nickname: nickname ?? localIdentity.nickname,
            birthDate: localIdentity.birthDate,
            sexContext: localIdentity.sexContext,
            smokingStatus: localIdentity.smokingStatus,
            dietaryRestrictions: localIdentity.dietaryRestrictions
        )
        .sanitized
    }

    private static func trimmed(_ value: String?) -> String? {
        guard let value else {
            return nil
        }

        let trimmedValue = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedValue.isEmpty ? nil : trimmedValue
    }

    private static func normalizedNickname(_ value: String?) -> String? {
        let normalizedValue = value?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "@"))
        return trimmed(normalizedValue)
    }
}

struct BackendProfileIdentityMutationResult: Equatable {
    let ok: Bool
    let message: String

    static func success(_ message: String) -> BackendProfileIdentityMutationResult {
        BackendProfileIdentityMutationResult(ok: true, message: message)
    }

    static func failure(_ message: String) -> BackendProfileIdentityMutationResult {
        BackendProfileIdentityMutationResult(ok: false, message: message)
    }
}

protocol BackendPublicProfileRepository {
    func updateCurrentProfileIdentity(_ identity: UserProfileIdentity) async -> BackendProfileIdentityMutationResult
    func currentProfileIdentity() async -> BackendPublicProfileIdentity?
    func searchProfileIdentities(matching query: String) async throws -> [BackendPublicProfileIdentity]
}

struct FixtureBackendPublicProfileRepository: BackendPublicProfileRepository {
    var identities: [BackendPublicProfileIdentity] = [
        BackendPublicProfileIdentity(
            id: "mina",
            displayName: "김민아",
            nickname: "맑은끝민아",
            isFriend: true
        ),
        BackendPublicProfileIdentity(
            id: "jae",
            displayName: "정서윤",
            nickname: "산미탐험서윤"
        ),
        BackendPublicProfileIdentity(
            id: "hyeon",
            displayName: "최도윤",
            nickname: "불향도윤"
        )
    ]

    func updateCurrentProfileIdentity(_ identity: UserProfileIdentity) async -> BackendProfileIdentityMutationResult {
        .success("프로필 정보가 저장되었습니다.")
    }

    func currentProfileIdentity() async -> BackendPublicProfileIdentity? {
        identities.first
    }

    func searchProfileIdentities(matching query: String) async throws -> [BackendPublicProfileIdentity] {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty else {
            return []
        }

        let normalizedQuery = trimmedQuery
            .trimmingCharacters(in: CharacterSet(charactersIn: "@"))
            .lowercased()

        return identities.filter { identity in
            [
                identity.displayName,
                identity.nickname,
                identity.displayNickname
            ]
            .compactMap(\.self)
            .contains { value in
                value.lowercased().contains(normalizedQuery)
            }
        }
    }
}

struct MissingConfigurationPublicProfileRepository: BackendPublicProfileRepository {
    let reason: String

    func updateCurrentProfileIdentity(_ identity: UserProfileIdentity) async -> BackendProfileIdentityMutationResult {
        .failure(reason)
    }

    func currentProfileIdentity() async -> BackendPublicProfileIdentity? {
        nil
    }

    func searchProfileIdentities(matching query: String) async throws -> [BackendPublicProfileIdentity] {
        []
    }
}

actor PublicProfileSnapshotStore {
    static let shared = PublicProfileSnapshotStore()

    private var identitiesByID: [String: BackendPublicProfileIdentity] = [:]

    func store(_ identities: [BackendPublicProfileIdentity]) {
        for identity in identities {
            identitiesByID[identity.id] = identity
        }
    }

    func profile(id: String) -> BackendPublicProfileIdentity? {
        identitiesByID[id]
    }
}

#if canImport(Supabase)
struct SupabasePublicProfileRepository: BackendPublicProfileRepository {
    let client: SupabaseClient

    func updateCurrentProfileIdentity(_ identity: UserProfileIdentity) async -> BackendProfileIdentityMutationResult {
        do {
            let session = try await client.auth.session
            let userID = session.user.id.uuidString
            let sanitizedIdentity = identity.sanitized
            let displayName = sanitizedIdentity.displayName.trimmingCharacters(in: .whitespacesAndNewlines)
            let nickname = sanitizedIdentity.normalizedNickname
            let profileValues = SupabaseProfileIdentityUpsert(
                id: userID,
                display_name: displayName.isEmpty ? nickname : displayName,
                nickname: nickname.isEmpty ? nil : nickname
            )

            try await client
                .from("profiles")
                .upsert(profileValues, onConflict: "id", returning: .minimal)
                .execute()

            _ = try await client.auth.update(
                user: UserAttributes(
                    data: [
                        "display_name": .string(displayName),
                        "nickname": .string(nickname)
                    ]
                )
            )

            await PublicProfileSnapshotStore.shared.store([
                BackendPublicProfileIdentity(
                    id: userID,
                    displayName: displayName,
                    nickname: nickname
                )
            ])

            return .success("프로필 정보가 저장되었습니다.")
        } catch {
            return .failure(profileIdentityErrorMessage(error))
        }
    }

    func currentProfileIdentity() async -> BackendPublicProfileIdentity? {
        do {
            let session = try await client.auth.session
            let response: PostgrestResponse<[SupabaseProfileIdentityRow]> = try await client
                .from("profiles")
                .select("id,display_name,nickname,avatar_path")
                .eq("id", value: session.user.id.uuidString)
                .limit(1)
                .execute()

            guard let row = response.value.first else {
                return nil
            }

            let identity = BackendPublicProfileIdentity(row: row)
            await PublicProfileSnapshotStore.shared.store([identity])
            return identity
        } catch {
            return nil
        }
    }

    func searchProfileIdentities(matching query: String) async throws -> [BackendPublicProfileIdentity] {
        let normalizedQuery = query
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "@"))

        guard !normalizedQuery.isEmpty else {
            return []
        }

        let rows = try await searchRows(
            functionName: "search_profiles_by_identity",
            query: normalizedQuery
        )
        let identities = rows.map(BackendPublicProfileIdentity.init(row:))
        await PublicProfileSnapshotStore.shared.store(identities)
        return identities
    }

    private func searchRows(
        functionName: String,
        query: String
    ) async throws -> [SupabaseProfileIdentityRow] {
        do {
            let response: PostgrestResponse<[SupabaseProfileIdentityRow]> = try await client
                .rpc(
                    functionName,
                    params: SupabaseProfileSearchParams(search_query: query)
                )
                .execute()
            return response.value
        } catch {
            guard functionName == "search_profiles_by_identity",
                  isMissingProfileSearchRPCError(error) else {
                throw error
            }

            let response: PostgrestResponse<[SupabaseProfileIdentityRow]> = try await client
                .rpc(
                    "search_profiles_by_nickname",
                    params: SupabaseProfileSearchParams(search_query: query)
                )
                .execute()
            return response.value
        }
    }

    private func profileIdentityErrorMessage(_ error: Error) -> String {
        let errorText = String(describing: error)
        let lowercasedErrorText = errorText.lowercased()

        if lowercasedErrorText.contains("23505")
            || lowercasedErrorText.contains("profiles_nickname_unique_idx")
            || lowercasedErrorText.contains("duplicate") {
            return "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해 주세요."
        }

        let message = error.localizedDescription
        return message.isEmpty ? "공개 프로필 저장에 실패했습니다." : message
    }

    private func isMissingProfileSearchRPCError(_ error: Error) -> Bool {
        let errorText = String(describing: error).lowercased()
        return errorText.contains("pgrst202")
            || errorText.contains("could not find")
            || errorText.contains("search_profiles_by_identity")
    }
}

private struct SupabaseProfileIdentityUpsert: Encodable {
    let id: String
    let display_name: String?
    let nickname: String?
}

private struct SupabaseProfileSearchParams: Encodable {
    let search_query: String
}

private struct SupabaseProfileIdentityRow: Decodable {
    let id: UUID
    let display_name: String?
    let nickname: String?
    let avatar_path: String?
    let is_friend: Bool?
}

private extension BackendPublicProfileIdentity {
    init(row: SupabaseProfileIdentityRow) {
        self.init(
            id: row.id.uuidString,
            displayName: row.display_name,
            nickname: row.nickname,
            avatarPath: row.avatar_path,
            isFriend: row.is_friend ?? false
        )
    }
}
#endif

enum BackendPublicProfileRepositoryFactory {
    static func makeDefault(bundle: Bundle = .main) -> any BackendPublicProfileRepository {
        do {
            let configuration = try BackendConfiguration.load(bundle: bundle)
            let provider = SupabaseClientProvider(configuration: configuration)

            #if canImport(Supabase)
            return SupabasePublicProfileRepository(client: provider.makeClient())
            #else
            return MissingConfigurationPublicProfileRepository(reason: "Supabase Swift package is not linked.")
            #endif
        } catch {
            return MissingConfigurationPublicProfileRepository(reason: error.localizedDescription)
        }
    }
}
