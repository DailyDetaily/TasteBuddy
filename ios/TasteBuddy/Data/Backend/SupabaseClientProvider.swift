import Foundation

#if canImport(Supabase)
import Supabase

struct SupabaseClientProvider {
    let configuration: BackendConfiguration

    func makeClient() -> SupabaseClient {
        SupabaseClient(
            supabaseURL: configuration.supabaseURL,
            supabaseKey: configuration.supabasePublishableKey
        )
    }
}
#else
struct SupabaseClientProvider {
    let configuration: BackendConfiguration
}
#endif
