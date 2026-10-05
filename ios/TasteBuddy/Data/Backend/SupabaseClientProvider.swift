import Foundation

#if canImport(Supabase)
import Supabase

struct SupabaseClientProvider {
    let configuration: BackendConfiguration

    func makeClient() -> SupabaseClient {
        SupabaseClient(
            supabaseURL: configuration.supabaseURL,
            supabaseKey: configuration.supabasePublishableKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    redirectToURL: configuration.authRedirectURL,
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }
}

/// Checks live authentication while request clients retain the operation owner's token.
struct NativeAccountRequestContext {
    let client: SupabaseClient
    let configuration: BackendConfiguration
    let httpSession: URLSession

    func checkAccount(_ userID: String) throws {
        try Task.checkCancellation()
        guard let session = client.auth.currentSession, !session.user.isAnonymous,
              session.user.id == UUID(uuidString: userID) else { throw NativeAccountDataError.accountChanged }
    }

    func requestClient(userID: String) async throws -> SupabaseClient {
        try checkAccount(userID)
        let session = try await client.auth.session
        try checkAccount(userID)
        guard !session.user.isAnonymous, session.user.id == UUID(uuidString: userID) else {
            throw NativeAccountDataError.accountChanged
        }
        // Keep the operation owner's token even if another account logs in before transmission.
        return SupabaseClient(supabaseURL: configuration.supabaseURL, supabaseKey: configuration.supabasePublishableKey,
            options: .init(auth: .init(autoRefreshToken: false, accessToken: { session.accessToken }),
                           global: .init(session: httpSession)))
    }
}
#else
struct SupabaseClientProvider {
    let configuration: BackendConfiguration
}
#endif
