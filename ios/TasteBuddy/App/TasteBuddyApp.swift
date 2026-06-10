import SwiftUI

@main
struct TasteBuddyApp: App {
    @StateObject private var appModel = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appModel)
                .tint(TBColor.textPrimary)
        }
    }
}

private struct RootView: View {
    @EnvironmentObject private var appModel: AppModel
    @StateObject private var shellPreviewModel = AppModel.preview(
        onboardingComplete: true,
        profile: .sample,
        diningEntries: [.sample],
        savedRestaurantIDs: Set(RestaurantCatalog.savedDefaults)
    )
    @State private var hasCompletedSplash = false

    private let showsStatusRowPreview = ProcessInfo.processInfo.arguments.contains(
        "--status-row-preview"
    )
    private let showsDesignSystemPreview = ProcessInfo.processInfo.arguments.contains(
        "--design-system-preview"
    )
    private let showsSplashPreview = ProcessInfo.processInfo.arguments.contains(
        "--splash-preview"
    )
    private let showsAuthEntryPreview = ProcessInfo.processInfo.arguments.contains(
        "--auth-entry-preview"
    )
    private let showsOnboardingPreview = ProcessInfo.processInfo.arguments.contains(
        "--onboarding-preview"
    )
    private let showsCalibrationPreview = ProcessInfo.processInfo.arguments.contains(
        "--calibration-preview"
    )
    private let showsDiningFeedbackPreview = ProcessInfo.processInfo.arguments.contains(
        "--dining-feedback-preview"
    )
    private let showsIntakePreview = ProcessInfo.processInfo.arguments.contains(
        "--intake-preview"
    )
    private let showsSearchPreview = ProcessInfo.processInfo.arguments.contains(
        "--search-preview"
    )
    private let showsSearchResultsPreview = ProcessInfo.processInfo.arguments.contains(
        "--search-results-preview"
    )
    private let showsSearchEmptyPreview = ProcessInfo.processInfo.arguments.contains(
        "--search-empty-preview"
    )
    private let showsRecommendationLoadingPreview = ProcessInfo.processInfo.arguments.contains(
        "--recommendation-loading-preview"
    )
    private let showsRecommendationFallbackPreview = ProcessInfo.processInfo.arguments.contains(
        "--recommendation-fallback-preview"
    )
    private let showsCommentsPreview = ProcessInfo.processInfo.arguments.contains(
        "--comments-preview"
    )
    private let showsDishFeedbackDetailPreview = ProcessInfo.processInfo.arguments.contains(
        "--dish-feedback-detail-preview"
    )
    private let showsConnectionListPreview = ProcessInfo.processInfo.arguments.contains(
        "--connection-list-preview"
    )
    private let showsPublicProfilePreview = ProcessInfo.processInfo.arguments.contains(
        "--public-profile-preview"
    )
    private let showsTasteChangePreview = ProcessInfo.processInfo.arguments.contains(
        "--taste-change-preview"
    )
    private let showsRestaurantDetailPreview = ProcessInfo.processInfo.arguments.contains(
        "--restaurant-detail-preview"
    )
    private let showsSavedListPreview = ProcessInfo.processInfo.arguments.contains(
        "--saved-list-preview"
    )
    private let showsShellPreview = ProcessInfo.processInfo.arguments.contains(
        "--shell-preview"
    )
    private let showsDiningPreview = ProcessInfo.processInfo.arguments.contains(
        "--dining-preview"
    )
    private let skipsSplash = ProcessInfo.processInfo.arguments.contains(
        "--skip-splash"
    )
    private let resetsAppState = ProcessInfo.processInfo.arguments.contains(
        "--reset-app-state"
    )
    @State private var hasAppliedLaunchReset = false

    var body: some View {
        Group {
            if showsDesignSystemPreview {
                DesignSystemPreviewView()
            } else if showsShellPreview {
                AppShellView()
                    .environmentObject(shellPreviewModel)
            } else if showsDiningPreview {
                AppShellView(initialTab: .dining)
                    .environmentObject(shellPreviewModel)
            } else if showsSplashPreview {
                SplashView(autoplays: false, onComplete: {})
            } else if showsAuthEntryPreview {
                AuthEntryPreviewHost()
            } else if showsOnboardingPreview {
                OnboardingView(onComplete: {})
            } else if showsStatusRowPreview {
                StatusRowPreviewGallery()
            } else if showsIntakePreview {
                PreferenceIntakeFlowView(onBack: {})
            } else if showsSearchPreview {
                HomeSearchSheet()
            } else if showsSearchResultsPreview {
                HomeSearchSheet(initialQuery: "온지음")
            } else if showsSearchEmptyPreview {
                HomeSearchSheet(initialQuery: "없는 키워드")
            } else if showsRecommendationLoadingPreview {
                HomeView(recommendationContentState: .loading)
                    .environmentObject(shellPreviewModel)
            } else if showsRecommendationFallbackPreview {
                HomeView(recommendationContentState: .fallbackBuddy)
                    .environmentObject(shellPreviewModel)
            } else if showsCommentsPreview {
                AppShellView(initialRoute: .comments(id: "following-mina-broth"))
                    .environmentObject(shellPreviewModel)
            } else if showsDishFeedbackDetailPreview {
                AppShellView(initialRoute: .dishFeedback(id: "following-mina-broth"))
                    .environmentObject(shellPreviewModel)
            } else if showsConnectionListPreview {
                AppShellView(initialRoute: .connectionList(.followers))
                    .environmentObject(shellPreviewModel)
            } else if showsPublicProfilePreview {
                AppShellView(initialRoute: .publicProfile(id: "mina"))
                    .environmentObject(shellPreviewModel)
            } else if showsTasteChangePreview {
                AppShellView(initialRoute: .tasteChange)
                    .environmentObject(shellPreviewModel)
            } else if showsRestaurantDetailPreview {
                AppShellView(initialRoute: .restaurant(id: "mingles"))
                    .environmentObject(shellPreviewModel)
            } else if showsSavedListPreview {
                AppShellView(initialRoute: .savedRestaurants)
                    .environmentObject(shellPreviewModel)
            } else if showsDiningFeedbackPreview {
                DiningFeedbackSheet(onSave: { _ in })
            } else if showsCalibrationPreview {
                CalibrationFlowView()
            } else {
                phaseView
            }
        }
        .preferredColorScheme(.light)
        .onAppear(perform: applyLaunchResetIfNeeded)
        .task {
            await appModel.restoreBackendSessionIfNeeded()
        }
    }

    @ViewBuilder
    private var phaseView: some View {
        switch currentPhase {
        case .splash:
            SplashView {
                withAnimation(.easeInOut(duration: 0.28)) {
                    hasCompletedSplash = true
                }
            }
        case .authEntry:
            AuthEntryGateView(
                onContinueAsGuest: completeAuthEntry,
                onVerifiedEmailLogin: { _ in completeVerifiedEmailAuthEntry() },
                onLinkedCurrentProfile: completeVerifiedEmailAuthEntry
            )
        case .onboarding:
            OnboardingView {
                withAnimation(.easeInOut(duration: 0.3)) {
                    appModel.completeOnboarding()
                }
            }
        case .preferenceIntake:
            PreferenceIntakeFlowView {
                withAnimation(.easeInOut(duration: 0.3)) {
                    appModel.returnToOnboarding()
                }
            }
        case .calibration:
            CalibrationFlowView(onExit: appModel.returnToPreferenceIntake)
        case .main:
            MainTabView()
        }
    }

    private var currentPhase: AppPhase {
        AppPhase.resolve(
            hasCompletedSplash: hasCompletedSplash || skipsSplash,
            hasCompletedAuthEntry: appModel.hasCompletedAuthEntry,
            backendSessionStatus: appModel.backendSessionStatus,
            hasSeenOnboarding: appModel.hasSeenOnboarding,
            hasPreferenceProfile: appModel.preferenceProfile != nil,
            hasTasteProfile: appModel.profile != nil
        )
    }

    private func applyLaunchResetIfNeeded() {
        guard resetsAppState, !hasAppliedLaunchReset else {
            return
        }

        hasAppliedLaunchReset = true
        hasCompletedSplash = false
        appModel.resetAll()
    }

    private func completeAuthEntry() {
        withAnimation(.easeInOut(duration: 0.3)) {
            appModel.completeAuthEntry()
        }
    }

    private func completeVerifiedEmailAuthEntry() {
        withAnimation(.easeInOut(duration: 0.3)) {
            appModel.completeVerifiedEmailAuthEntry()
        }
    }
}

private struct AuthEntryGateView: View {
    @State private var isSheetPresented = false
    @State private var didComplete = false
    let onContinueAsGuest: () -> Void
    let onVerifiedEmailLogin: (BackendAuthResult) -> Void
    let onLinkedCurrentProfile: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            AuthLandingView(
                onSignUp: presentAuthSheet,
                onLogin: presentAuthSheet
            )

            if isSheetPresented {
                Color.black
                    .opacity(BottomSheetShellMetrics.overlayOpacity)
                    .ignoresSafeArea()
                    .transition(.opacity)

                AuthEntrySheet(
                    intent: .startWithEmail,
                    onDismissRequest: dismissAuthSheet,
                    onContinueAsGuest: completeAsGuest,
                    onVerifiedEmailLogin: completeVerifiedEmailLogin,
                    onLinkedCurrentProfile: completeLinkedCurrentProfile
                )
                .frame(maxWidth: .infinity, alignment: .bottom)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .ignoresSafeArea(edges: [.horizontal, .bottom])
    }

    private func presentAuthSheet() {
        guard !didComplete else {
            return
        }

        withAnimation(.easeOut(duration: 0.24)) {
            isSheetPresented = true
        }
    }

    private func dismissAuthSheet() {
        withAnimation(.easeInOut(duration: 0.2)) {
            isSheetPresented = false
        }
    }

    private func completeAsGuest() {
        guard !didComplete else {
            return
        }

        didComplete = true
        onContinueAsGuest()
    }

    private func completeVerifiedEmailLogin(_ result: BackendAuthResult) {
        guard !didComplete else {
            return
        }

        didComplete = true
        onVerifiedEmailLogin(result)
    }

    private func completeLinkedCurrentProfile() {
        guard !didComplete else {
            return
        }

        didComplete = true
        onLinkedCurrentProfile()
    }
}

private struct AuthLandingView: View {
    var onSignUp: () -> Void
    var onLogin: () -> Void

    var body: some View {
        ZStack {
            TBColor.page.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                TasteBuddyStaticLogo()

                Spacer()

                authActions
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.bottom, max(12, bottomSafeAreaInset))
        }
    }

    private var authActions: some View {
        VStack(spacing: 12) {
            PrimaryButton(title: "회원가입", action: onSignUp)

            Button(action: onLogin) {
                Text("로그인")
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textFaint)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .frame(height: 28)
            }
            .buttonStyle(.plain)
        }
    }

    private var bottomSafeAreaInset: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets
            .bottom ?? 0
    }
}

private struct TasteBuddyStaticLogo: View {
    private let logoSize = CGSize(width: 200, height: 81)
    private let symbolFrame = CGRect(x: 0, y: 0, width: 64, height: 72)
    private let wordmarkFrame = CGRect(x: 80, y: 0, width: 120, height: 81)

    var body: some View {
        ZStack(alignment: .topLeading) {
            Image("SplashSymbol")
                .resizable()
                .scaledToFit()
                .frame(width: symbolFrame.width, height: symbolFrame.height)

            Image("SplashWordmark")
                .resizable()
                .scaledToFit()
                .frame(width: wordmarkFrame.width, height: wordmarkFrame.height)
                .offset(x: wordmarkFrame.minX, y: wordmarkFrame.minY)
        }
        .frame(width: logoSize.width, height: logoSize.height, alignment: .topLeading)
        .accessibilityHidden(true)
    }
}

#if canImport(PreviewsMacros)
    #Preview("Fresh start") {
        RootView()
            .environmentObject(AppModel.preview())
    }
#endif
