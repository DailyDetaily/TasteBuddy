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
        hasTasteProfile: Bool
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

        guard hasPreferenceProfile else {
            return .preferenceIntake
        }

        guard hasTasteProfile else {
            return .calibration
        }

        return .main
    }
}
