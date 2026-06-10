import Foundation

enum BackendEnvironment: String, Equatable {
    case local
    case staging
    case production

    init(rawBuildValue: String?) {
        switch rawBuildValue?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "staging":
            self = .staging
        case "production":
            self = .production
        default:
            self = .local
        }
    }
}

struct BackendConfiguration: Equatable {
    let environment: BackendEnvironment
    let supabaseURL: URL
    let supabasePublishableKey: String
    let publicMediaBaseURL: URL?

    static func load(bundle: Bundle = .main) throws -> BackendConfiguration {
        try from(infoDictionary: bundle.infoDictionary ?? [:])
    }

    static func from(infoDictionary: [String: Any]) throws -> BackendConfiguration {
        let environment = BackendEnvironment(
            rawBuildValue: normalizedString(infoDictionary["TBBackendEnvironment"])
        )
        let supabaseURLString = normalizedString(infoDictionary["TBSupabaseURL"])
        let supabasePublishableKey = normalizedString(infoDictionary["TBSupabasePublishableKey"])
        let publicMediaURLString = normalizedString(infoDictionary["TBPublicMediaBaseURL"])

        guard let supabaseURLString, !isPlaceholder(supabaseURLString) else {
            throw BackendConfigurationError.missingValue("TBSupabaseURL")
        }

        guard let supabaseURL = URL(string: supabaseURLString),
              let scheme = supabaseURL.scheme,
              ["http", "https"].contains(scheme),
              supabaseURL.host != nil else {
            throw BackendConfigurationError.invalidURL("TBSupabaseURL")
        }

        guard let supabasePublishableKey,
              !isPlaceholder(supabasePublishableKey) else {
            throw BackendConfigurationError.missingValue("TBSupabasePublishableKey")
        }

        guard !containsDisallowedSecretMarker(supabasePublishableKey) else {
            throw BackendConfigurationError.disallowedSecret("TBSupabasePublishableKey")
        }

        let publicMediaBaseURL: URL?
        if let publicMediaURLString, !isPlaceholder(publicMediaURLString) {
            publicMediaBaseURL = URL(string: publicMediaURLString)
        } else {
            publicMediaBaseURL = nil
        }

        return BackendConfiguration(
            environment: environment,
            supabaseURL: supabaseURL,
            supabasePublishableKey: supabasePublishableKey,
            publicMediaBaseURL: publicMediaBaseURL
        )
    }

    private static func normalizedString(_ value: Any?) -> String? {
        guard let string = value as? String else {
            return nil
        }

        let trimmedString = string.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedString.isEmpty ? nil : trimmedString
    }

    private static func isPlaceholder(_ value: String) -> Bool {
        value.hasPrefix("__SET_") || value.hasPrefix("$(")
    }

    private static func containsDisallowedSecretMarker(_ value: String) -> Bool {
        let lowercasedValue = value.lowercased()
        return lowercasedValue.contains("service_role")
            || lowercasedValue.contains("service-role")
            || lowercasedValue.contains("secret")
    }
}

enum BackendConfigurationError: LocalizedError, Equatable {
    case missingValue(String)
    case invalidURL(String)
    case disallowedSecret(String)

    var errorDescription: String? {
        switch self {
        case .missingValue(let key):
            return "\(key)이 설정되지 않았습니다."
        case .invalidURL(let key):
            return "\(key)이 올바른 URL이 아닙니다."
        case .disallowedSecret(let key):
            return "\(key)에 앱에 넣으면 안 되는 secret 값이 들어 있습니다."
        }
    }
}
