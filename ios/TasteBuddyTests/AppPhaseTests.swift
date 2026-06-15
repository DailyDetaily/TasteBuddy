import XCTest
@testable import TasteBuddy

final class AppPhaseTests: XCTestCase {
    func testFreshInstallStartsWithSplash() {
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: false,
                hasCompletedAuthEntry: false,
                backendSessionStatus: .signedOut,
                hasSeenOnboarding: false,
                hasPreferenceProfile: false,
                hasTasteProfile: false
            ),
            .splash
        )
    }

    func testSplashCompletionMovesToAuthEntryWhenNoEmailSessionExists() {
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: false,
                backendSessionStatus: .signedOut,
                hasSeenOnboarding: false,
                hasPreferenceProfile: false,
                hasTasteProfile: false
            ),
            .authEntry
        )
    }

    func testRestoredEmailSessionSkipsAuthEntry() {
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: false,
                backendSessionStatus: .authenticated,
                hasSeenOnboarding: false,
                hasPreferenceProfile: false,
                hasTasteProfile: false
            ),
            .onboarding
        )
    }

    func testLaunchFlowTemporarilySkipsPreferenceIntake() {
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: true,
                backendSessionStatus: .signedOut,
                hasSeenOnboarding: false,
                hasPreferenceProfile: false,
                hasTasteProfile: false
            ),
            .onboarding
        )
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: true,
                backendSessionStatus: .signedOut,
                hasSeenOnboarding: true,
                hasPreferenceProfile: false,
                hasTasteProfile: false
            ),
            .calibration
        )
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: true,
                backendSessionStatus: .signedOut,
                hasSeenOnboarding: true,
                hasPreferenceProfile: true,
                hasTasteProfile: false
            ),
            .calibration
        )
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: true,
                backendSessionStatus: .signedOut,
                hasSeenOnboarding: true,
                hasPreferenceProfile: true,
                hasTasteProfile: true
            ),
            .main
        )
    }

    func testPreferenceIntakeCanBeRestoredWithFeatureFlag() {
        XCTAssertEqual(
            AppPhase.resolve(
                hasCompletedSplash: true,
                hasCompletedAuthEntry: true,
                backendSessionStatus: .signedOut,
                hasSeenOnboarding: true,
                hasPreferenceProfile: false,
                hasTasteProfile: false,
                isPreferenceIntakeEnabled: true
            ),
            .preferenceIntake
        )
    }
}
