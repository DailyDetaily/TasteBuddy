import SwiftUI

@main
struct TasteBuddyApp: App {
    @StateObject private var appModel = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .ignoresSafeArea(.keyboard, edges: .bottom)
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
        profileHistory: TasteProfile.shellPreviewHistory,
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
    private let showsNativeDesignStatesPreview = ProcessInfo.processInfo.arguments.contains(
        "--native-design-states-preview"
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
    private let showsDiningLoadingPreview = ProcessInfo.processInfo.arguments.contains(
        "--dining-loading-preview"
    )
    private let skipsSplash = ProcessInfo.processInfo.arguments.contains(
        "--skip-splash"
    )
    private let resetsAppState = ProcessInfo.processInfo.arguments.contains(
        "--reset-app-state"
    )
    @State private var hasAppliedLaunchReset = false
    @State private var usesAuthEntryDarkStatusBar = false
    @State private var usesStagedSheetDarkStatusBar = false

    var body: some View {
        Group {
            if showsNativeDesignStatesPreview {
                NativeDesignStatesPreview()
            } else if showsDesignSystemPreview {
                DesignSystemPreviewView()
            } else if showsShellPreview {
                AppShellView(
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsDiningPreview {
                AppShellView(
                    initialTab: .dining,
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsDiningLoadingPreview {
                AppShellView(
                    initialTab: .dining,
                    onStagedSheetPresentationChange: setStagedSheetPresentation,
                    diningContentState: .loading
                )
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
                HomeSearchPreviewHost()
                    .environmentObject(shellPreviewModel)
            } else if showsSearchResultsPreview {
                HomeSearchPreviewHost(initialQuery: "온지음")
                    .environmentObject(shellPreviewModel)
            } else if showsSearchEmptyPreview {
                HomeSearchPreviewHost(initialQuery: "없는 키워드")
                    .environmentObject(shellPreviewModel)
            } else if showsRecommendationLoadingPreview {
                HomeView(
                    recommendationContentState: .loading,
                    presentationMode: .socialArchive
                )
                    .environmentObject(shellPreviewModel)
            } else if showsRecommendationFallbackPreview {
                HomeView(
                    recommendationContentState: .fallbackBuddy,
                    presentationMode: .socialArchive
                )
                    .environmentObject(shellPreviewModel)
            } else if showsCommentsPreview {
                AppShellView(
                    initialRoute: .comments(id: "following-mina-broth"),
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsDishFeedbackDetailPreview {
                AppShellView(
                    initialRoute: .dishFeedback(id: "following-mina-broth"),
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsConnectionListPreview {
                AppShellView(
                    initialRoute: .connectionList(.followers),
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsPublicProfilePreview {
                AppShellView(
                    initialRoute: .publicProfile(id: "mina"),
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsTasteChangePreview {
                AppShellView(
                    initialRoute: .tasteChange,
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsRestaurantDetailPreview {
                AppShellView(
                    initialRoute: .restaurant(id: "mingles"),
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsSavedListPreview {
                AppShellView(
                    initialRoute: .savedRestaurants,
                    onStagedSheetPresentationChange: setStagedSheetPresentation
                )
                    .environmentObject(shellPreviewModel)
            } else if showsDiningFeedbackPreview {
                DiningFeedbackPreviewHost()
            } else if showsCalibrationPreview {
                CalibrationFlowView()
            } else {
                phaseView
            }
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .scrollBounceBehavior(.basedOnSize)
        .preferredColorScheme(usesDarkStatusBar ? .dark : .light)
        .onAppear(perform: applyLaunchResetIfNeeded)
        .onOpenURL { url in
            BackendAuthRepositoryFactory.handleRedirectURL(url)
        }
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
                onVerifiedEmailLogin: { _ in completeVerifiedEmailAuthEntry(publishCurrentProfile: false) },
                onLinkedCurrentProfile: { completeVerifiedEmailAuthEntry(publishCurrentProfile: true) },
                onSheetPresentationChange: setAuthEntrySheetPresentation
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
            CalibrationFlowView(onExit: exitCalibration)
        case .main:
            MainTabView(onStagedSheetPresentationChange: setStagedSheetPresentation)
        }
    }

    private var usesDarkStatusBar: Bool {
        usesAuthEntryDarkStatusBar || usesStagedSheetDarkStatusBar
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

    private func exitCalibration() {
        if AppFlowFeatures.isPreferenceIntakeEnabled {
            appModel.returnToPreferenceIntake()
        } else {
            appModel.returnToOnboarding()
        }
    }

    private func completeVerifiedEmailAuthEntry(publishCurrentProfile: Bool) {
        withAnimation(.easeInOut(duration: 0.3)) {
            appModel.completeVerifiedEmailAuthEntry()
        }

        Task {
            if publishCurrentProfile {
                _ = await appModel.publishCurrentProfileIdentity()
            } else {
                _ = await appModel.hydratePublicProfileIdentity()
            }
        }
    }

    private func setAuthEntrySheetPresentation(_ isPresented: Bool) {
        usesAuthEntryDarkStatusBar = isPresented
    }

    private func setStagedSheetPresentation(_ isPresented: Bool) {
        usesStagedSheetDarkStatusBar = isPresented
    }
}

private struct AuthEntryGateView: View {
    @State private var isSheetPresented = false
    @State private var sheetDragTranslation: CGFloat = 0
    @State private var isDraggingSheet = false
    @State private var didComplete = false
    let onContinueAsGuest: () -> Void
    let onVerifiedEmailLogin: (BackendAuthResult) -> Void
    let onLinkedCurrentProfile: () -> Void
    let onSheetPresentationChange: (Bool) -> Void

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                ZStack {
                    TBColor.page
                    Color.black.opacity(sheetProgress)
                }
                .ignoresSafeArea()
                .animation(
                    isDraggingSheet ? nil : StagedBottomSheetBackgroundMetrics.animation,
                    value: sheetProgress
                )

                AuthLandingView(onStart: presentAuthSheet)
                .modifier(
                    StagedBottomSheetBackground(
                        progress: sheetProgress,
                        dimOpacity: BottomSheetShellMetrics.overlayOpacity * sheetProgress,
                        animates: !isDraggingSheet
                    )
                )

                if isSheetPresented {
                    AuthEntrySheet(
                        intent: .startWithEmail,
                        prefersFullHeight: true,
                        onDismissRequest: dismissAuthSheet,
                        onContinueAsGuest: completeAsGuest,
                        onVerifiedEmailLogin: completeVerifiedEmailLogin,
                        onLinkedCurrentProfile: completeLinkedCurrentProfile
                    )
                    .frame(width: proxy.size.width, height: sheetHeight)
                    .position(
                        x: proxy.size.width / 2,
                        y: proxy.size.height - sheetHeight / 2 + sheetDragTranslation
                    )
                    .simultaneousGesture(sheetDragGesture)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
        .ignoresSafeArea(edges: [.horizontal, .bottom])
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .onDisappear {
            onSheetPresentationChange(false)
        }
    }

    private var sheetProgress: CGFloat {
        guard isSheetPresented else {
            return 0
        }

        return 1 - sheetDragPercentage
    }

    private var sheetDragPercentage: CGFloat {
        guard sheetHeight > 0 else {
            return 0
        }

        return min(max(sheetDragTranslation / sheetHeight, 0), 1)
    }

    private var sheetHeight: CGFloat {
        BottomSheetShellMetrics.stageHeight(
            screenHeight: UIScreen.main.bounds.height,
            safeAreaTop: keyWindowSafeAreaInsets.top
        )
    }

    private var sheetDragGesture: some Gesture {
        DragGesture(minimumDistance: StagedBottomSheetDragMetrics.minimumDistance)
            .onChanged { value in
                let verticalMovement = value.translation.height
                let horizontalMovement = abs(value.translation.width)
                guard verticalMovement > 0, verticalMovement >= horizontalMovement else {
                    return
                }

                isDraggingSheet = true
                sheetDragTranslation = verticalMovement
            }
            .onEnded { value in
                let predictedTranslation = max(
                    value.translation.height,
                    value.predictedEndTranslation.height
                )
                let shouldDismiss = predictedTranslation >= sheetHeight
                    * StagedBottomSheetDragMetrics.dismissProgressThreshold

                if shouldDismiss {
                    dismissAuthSheetFromDrag()
                } else {
                    withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
                        sheetDragTranslation = 0
                        isDraggingSheet = false
                    }
                }
            }
    }

    private var keyWindowSafeAreaInsets: UIEdgeInsets {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets ?? .zero
    }

    private func presentAuthSheet() {
        guard !didComplete else {
            return
        }

        withAnimation(.easeOut(duration: 0.24)) {
            sheetDragTranslation = 0
            isDraggingSheet = false
            isSheetPresented = true
            onSheetPresentationChange(true)
        }
    }

    private func dismissAuthSheet() {
        withAnimation(.easeInOut(duration: 0.2)) {
            isSheetPresented = false
            sheetDragTranslation = 0
            isDraggingSheet = false
            onSheetPresentationChange(false)
        }
    }

    private func dismissAuthSheetFromDrag() {
        withAnimation(.easeInOut(duration: 0.2)) {
            sheetDragTranslation = sheetHeight
            isSheetPresented = false
            isDraggingSheet = false
            onSheetPresentationChange(false)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
            guard !isSheetPresented else {
                return
            }

            sheetDragTranslation = 0
        }
    }

    private func completeAsGuest() {
        guard !didComplete else {
            return
        }

        didComplete = true
        onSheetPresentationChange(false)
        onContinueAsGuest()
    }

    private func completeVerifiedEmailLogin(_ result: BackendAuthResult) {
        guard !didComplete else {
            return
        }

        didComplete = true
        onSheetPresentationChange(false)
        onVerifiedEmailLogin(result)
    }

    private func completeLinkedCurrentProfile() {
        guard !didComplete else {
            return
        }

        didComplete = true
        onSheetPresentationChange(false)
        onLinkedCurrentProfile()
    }
}

private struct DiningFeedbackPreviewHost: View {
    @State private var isPresented = true

    var body: some View {
        if isPresented {
            DiningFeedbackSheet(
                onClose: { isPresented = false },
                onSave: { _ in isPresented = false }
            )
        } else {
            AppShellView(initialTab: .dining)
                .environmentObject(
                    AppModel.preview(
                        onboardingComplete: true,
                        profile: .sample,
                        diningEntries: [.sample],
                        savedRestaurantIDs: Set(RestaurantCatalog.savedDefaults)
                    )
                )
        }
    }
}

private struct HomeSearchPreviewHost: View {
    @State private var showsSearch = true
    let initialQuery: String

    init(initialQuery: String = "") {
        self.initialQuery = initialQuery
    }

    var body: some View {
        ZStack {
            AppShellView(initialTab: .home)

            if showsSearch {
                HomeSearchSheet(
                    initialQuery: initialQuery,
                    onCloseRequest: {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            showsSearch = false
                        }
                    }
                )
                .transition(.opacity)
                .zIndex(1)
            }
        }
    }
}

private struct AuthLandingView: View {
    var onStart: () -> Void

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
        PrimaryButton(title: "시작하기", action: onStart)
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

private extension TasteProfile {
    static var shellPreviewHistory: [TasteProfile] {
        let sweetAdjustments = [-7, -3, 1, -2, 3, 0]
        let sourAdjustments = [-6, -2, 3, 0, 5, 2]
        let bitterAdjustments = [4, 1, -2, 2, -1, 0]

        return sweetAdjustments.indices.map { index in
            var historicalScores = sample.scores
            historicalScores[TasteAxis.sweet.rawValue] = min(
                max(sample.score(for: .sweet) + sweetAdjustments[index], 0),
                100
            )
            historicalScores[TasteAxis.sour.rawValue] = min(
                max(sample.score(for: .sour) + sourAdjustments[index], 0),
                100
            )
            historicalScores[TasteAxis.bitter.rawValue] = min(
                max(sample.score(for: .bitter) + bitterAdjustments[index], 0),
                100
            )

            return TasteProfile(
                createdAt: .now.addingTimeInterval(
                    -Double(sweetAdjustments.count - index) * 30 * 24 * 60 * 60
                ),
                scores: historicalScores,
                confidence: sample.confidence,
                summary: sample.summary,
                topAxes: sample.topAxes,
                cautionAxis: sample.cautionAxis
            )
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview("Fresh start") {
        RootView()
            .environmentObject(AppModel.preview())
    }
#endif
