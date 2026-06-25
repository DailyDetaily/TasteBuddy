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
#else
struct SupabaseClientProvider {
    let configuration: BackendConfiguration
}
#endif
