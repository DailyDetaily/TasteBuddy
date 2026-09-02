import Foundation

#if canImport(Supabase)
import Supabase
#endif

enum BackendSessionStatus: Equatable {
    case notConfigured(String)
    case restoring
    case signedOut
    case authenticated
    case failed(String)

    var label: String {
        switch self {
        case .notConfigured:
            return "설정 필요"
        case .restoring:
            return "세션 복원 중"
        case .signedOut:
            return "로그인 필요"
        case .authenticated:
            return "연결됨"
        case .failed:
            return "복원 실패"
        }
    }
}

protocol BackendSessionRepository {
    func restoreSession() async -> BackendSessionStatus
}

struct FixtureBackendSessionRepository: BackendSessionRepository {
    let status: BackendSessionStatus

    init(status: BackendSessionStatus = .signedOut) {
        self.status = status
    }

    func restoreSession() async -> BackendSessionStatus {
        status
    }
}

struct MissingConfigurationSessionRepository: BackendSessionRepository {
    let reason: String

    func restoreSession() async -> BackendSessionStatus {
        .notConfigured(reason)
    }
}

enum BackendSessionRestoreResolver {
    static func resolve(
        currentSessionIsExpired: Bool?,
        refreshSession: () async throws -> Void
    ) async -> BackendSessionStatus {
        guard let currentSessionIsExpired else {
            return .signedOut
        }

        guard currentSessionIsExpired else {
            return .authenticated
        }

        do {
            try await refreshSession()
            return .authenticated
        } catch {
            return status(for: error)
        }
    }

    static func status(for error: Error) -> BackendSessionStatus {
        let errorText = String(describing: error)
        if errorText.localizedCaseInsensitiveContains("missing")
            || errorText.localizedCaseInsensitiveContains("not found")
            || errorText.localizedCaseInsensitiveContains("session") {
            return .signedOut
        }

        return .failed("Supabase session restore failed")
    }
}

#if canImport(Supabase)
struct SupabaseSessionRepository: BackendSessionRepository {
    let client: SupabaseClient

    func restoreSession() async -> BackendSessionStatus {
        await BackendSessionRestoreResolver.resolve(
            currentSessionIsExpired: client.auth.currentSession?.isExpired
        ) {
            _ = try await client.auth.session
        }
    }
}
#endif

enum BackendSessionRepositoryFactory {
    static func makeDefault(bundle: Bundle = .main) -> any BackendSessionRepository {
        do {
            let configuration = try BackendConfiguration.load(bundle: bundle)
            let provider = SupabaseClientProvider(configuration: configuration)

            #if canImport(Supabase)
            return SupabaseSessionRepository(client: provider.makeClient())
            #else
            return MissingConfigurationSessionRepository(reason: "Supabase Swift package is not linked.")
            #endif
        } catch {
            return MissingConfigurationSessionRepository(
                reason: error.localizedDescription
            )
        }
    }
}
