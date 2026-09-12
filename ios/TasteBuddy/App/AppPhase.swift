enum AppPhase: Equatable {
    case splash
    case authEntry
    case onboarding
    case preferenceIntake
    case calibration
    case main

    static func resolve(
        hasCompletedSplash: Bool,
        hasCompletedAuthEntry: Bool,
        backendSessionStatus: BackendSessionStatus,
        hasSeenOnboarding: Bool,
        hasPreferenceProfile: Bool,
        hasTasteProfile: Bool,
        isPreferenceIntakeEnabled: Bool = AppFlowFeatures.isPreferenceIntakeEnabled
    ) -> AppPhase {
        guard hasCompletedSplash else {
            return .splash
        }

        if !hasCompletedAuthEntry, backendSessionStatus != .authenticated {
            return .authEntry
        }

        guard hasSeenOnboarding else {
            return .onboarding
        }

        if hasTasteProfile { return .main }

        guard !isPreferenceIntakeEnabled || hasPreferenceProfile else {
            return .preferenceIntake
        }

        guard hasTasteProfile else {
            return .calibration
        }

        return .main
    }
}

enum AppFlowFeatures {
    static let isPreferenceIntakeEnabled = true
}
