import SwiftUI

@main
struct TasteBuddyApp: App {
    @StateObject private var appModel = BrandVideoCaptureRuntime.makeAppModel()

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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var shellPreviewModel = BrandVideoCaptureRuntime.isEnabled
        ? BrandVideoCaptureRuntime.makeAppModel()
        : AppModel.preview(
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

    private var sensoryRuntimePreview: AnyView? {
        #if DEBUG || targetEnvironment(simulator)
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("--taste-perception-qa") {
            return AnyView(TastePerceptionRuntimePreview())
        }
        if arguments.contains("--sensory-insights-qa") {
            return AnyView(PersonalTasteInsightsRuntimePreview())
        }
        if arguments.contains("--sensory-insights-home-qa") {
            return AnyView(PersonalTasteInsightsRuntimePreview(initialTab: .home))
        }
        if arguments.contains("--sensory-fit-detail-qa") {
            return AnyView(PersonalTasteInsightsRuntimePreview(detailKind: .fit))
        }
        if arguments.contains("--sensory-overall-detail-qa") {
            return AnyView(PersonalTasteInsightsRuntimePreview(detailKind: .overall))
        }
        if arguments.contains("--sensory-collection-qa") {
            return AnyView(SensoryCollectionRuntimePreview(startMode: .details))
        }
        if arguments.contains("--sensory-overall-qa") {
            return AnyView(SensoryCollectionRuntimePreview(startMode: .overallEvaluation))
        }
        if arguments.contains("--sensory-map-qa") {
            return AnyView(SensoryCollectionRuntimePreview(startMode: .tasteMap))
        }
        if arguments.contains("--sensory-advanced-qa") {
            return AnyView(SensoryAdvancedRuntimePreview())
        }
        if arguments.contains("--sensory-advanced-home-qa") {
            return AnyView(SensoryAdvancedRuntimePreview(initialTab: .home))
        }
        if arguments.contains("--sensory-advanced-detail-qa") {
            return AnyView(SensoryAdvancedDetailRuntimePreview())
        }
        guard arguments.contains("--sensory-home-qa") || arguments.contains("--sensory-analysis-qa") else { return nil }
        return AnyView(SensoryRuntimePreview())
        #else
        return nil
        #endif
    }

    var body: some View {
        Group {
            if BrandVideoCaptureRuntime.isEnabled {
                BrandVideoRuntimePreview()
                    .environmentObject(appModel)
            } else if let sensoryRuntimePreview {
                sensoryRuntimePreview
            } else if showsNativeDesignStatesPreview {
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
            guard !BrandVideoCaptureRuntime.isEnabled else { return }
            BackendAuthRepositoryFactory.handleRedirectURL(url)
        }
        .task {
            guard !BrandVideoCaptureRuntime.isEnabled else { return }
            await appModel.restoreBackendSessionIfNeeded()
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active, !BrandVideoCaptureRuntime.isEnabled else { return }
            Task { await appModel.syncAccountData() }
        }
    }

    @ViewBuilder
    private var phaseView: some View {
        switch currentPhase {
        case .splash:
            SplashView {
                withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
                    hasCompletedSplash = true
                }
            }
        case .authEntry:
            AuthEntryGateView(
                onContinueAsGuest: completeAuthEntry,
                onVerifiedEmailLogin: { result in completeVerifiedEmailAuthEntry(publishCurrentProfile: false, user: result.user) },
                onLinkedCurrentProfile: { completeVerifiedEmailAuthEntry(publishCurrentProfile: true) },
                onSheetPresentationChange: setAuthEntrySheetPresentation
            )
        case .onboarding:
            OnboardingView {
                withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
                    appModel.completeOnboarding()
                }
            }
        case .preferenceIntake:
            PreferenceIntakeFlowView {
                withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
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
        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
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

    private func completeVerifiedEmailAuthEntry(publishCurrentProfile: Bool, user: BackendAuthUserSummary? = nil) {
        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            appModel.completeVerifiedEmailAuthEntry(user: user, importingGuest: publishCurrentProfile)
        }

        Task {
            await appModel.syncAccountData()
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
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
                    isDraggingSheet ? nil : TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion),
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
                    .transition(TasteBloomMotion.sheetTransition(reduceMotion: reduceMotion))
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
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
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

        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            sheetDragTranslation = 0
            isDraggingSheet = false
            isSheetPresented = true
            onSheetPresentationChange(true)
        }
    }

    private func dismissAuthSheet() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            isSheetPresented = false
            sheetDragTranslation = 0
            isDraggingSheet = false
            onSheetPresentationChange(false)
        }
    }

    private func dismissAuthSheetFromDrag() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            sheetDragTranslation = sheetHeight
            isSheetPresented = false
            isDraggingSheet = false
            onSheetPresentationChange(false)
        }

        DispatchQueue.main.asyncAfter(
            deadline: .now() + TasteBloomMotion.duration(.sheet, reduceMotion: reduceMotion)
        ) {
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
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
                        withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion)) {
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

#if DEBUG || targetEnvironment(simulator)
private enum SensorySelectionRuntimeFixtures {
    static let entries: [DiningEntry] = [
        DiningEntry(
            restaurant: "가상 기록", menu: "첫 디저트", rating: 0, note: "",
            tasteExperienceIDs: ["sweet-soft"], detailTagIDs: ["texture-crisp"],
            sensorySelections: [
                .init(id: "sweet-soft", type: .bubble, labelSnapshot: "부드러운 단맛", liking: .liked, intensity: .medium, preferenceFit: .justRight),
                .init(id: "texture-crisp", type: .detailTag, labelSnapshot: "바삭함", liking: .liked, target: .surface, relatedBubbleID: "sweet-soft"),
            ],
            overallEvaluation: .init(response: .veryLiked)
        ),
        DiningEntry(
            restaurant: "가상 기록", menu: "두 번째 디저트", rating: 0, note: "",
            tasteExperienceIDs: ["sweet-round"], detailTagIDs: ["texture-crisp"],
            sensorySelections: [
                .init(id: "sweet-round", type: .bubble, labelSnapshot: "둥근 단맛", liking: .liked),
                .init(id: "texture-crisp", type: .detailTag, labelSnapshot: "바삭함", liking: .liked, target: .surface, relatedBubbleID: "sweet-round"),
            ],
            overallEvaluation: .init(response: .liked)
        ),
        DiningEntry(
            restaurant: "가상 기록", menu: "세 번째 디저트", rating: 0, note: "",
            tasteExperienceIDs: ["sweet-front"],
            sensorySelections: [
                .init(id: "sweet-front", type: .bubble, labelSnapshot: "먼저 올라온 단맛", liking: .liked),
            ],
            overallEvaluation: .init(response: .neutral)
        ),
        DiningEntry(
            restaurant: "가상 기록", menu: "소스 요리", rating: 0, note: "",
            tasteExperienceIDs: ["sweet-dense"],
            sensorySelections: [
                .init(id: "sweet-dense", type: .bubble, labelSnapshot: "밀도 있는 단맛", liking: .disliked, intensity: .strong, preferenceFit: .tooStrong, target: .sauce),
            ],
            overallEvaluation: .init(response: .disliked)
        ),
        DiningEntry(
            restaurant: "가상 기록", menu: "구운 채소", rating: 0, note: "",
            tasteExperienceIDs: ["bitter-roasted"],
            sensorySelections: [
                .init(id: "bitter-roasted", type: .bubble, labelSnapshot: "구운 향"),
            ],
            overallEvaluation: .init(response: .veryDisliked)
        ),
    ]
}

private enum SensoryAdvancedRuntimeFixtures {
    private static let sameMealID = UUID(uuidString: "A0000000-0000-0000-0000-000000000001")!
    private static let baseDate = Date(timeIntervalSince1970: 1_782_300_000)

    static let entries: [DiningEntry] = [
        entry(
            record: "B0000000-0000-0000-0000-000000000001",
            mealID: sameMealID,
            dayOffset: 0,
            menu: "강한 산미 소스",
            liking: .disliked,
            intensity: .strong,
            overall: .disliked
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000002",
            mealID: sameMealID,
            dayOffset: 0,
            menu: "산미 드레싱",
            liking: .disliked,
            intensity: .strong,
            overall: .neutral
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000003",
            dayOffset: -4,
            menu: "라임 소스 생선",
            liking: .disliked,
            intensity: .strong,
            overall: .disliked
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000004",
            dayOffset: -8,
            menu: "초절임 소스",
            liking: .disliked,
            intensity: .strong,
            overall: .veryDisliked
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000005",
            dayOffset: -12,
            menu: "은은한 유자 소스",
            liking: .liked,
            intensity: .light,
            overall: .veryLiked
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000006",
            dayOffset: -16,
            menu: "가벼운 레몬 소스",
            liking: .liked,
            intensity: .light,
            overall: .liked
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000007",
            dayOffset: -20,
            menu: "매실 소스",
            liking: .liked,
            intensity: .light,
            overall: .liked
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000008",
            dayOffset: -24,
            menu: "산뜻한 식초 소스",
            liking: .disliked,
            intensity: .light,
            overall: .neutral
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000009",
            dayOffset: -28,
            menu: "중간 산미 소스",
            liking: .neutral,
            intensity: .medium,
            overall: .neutral
        ),
        entry(
            record: "B0000000-0000-0000-0000-000000000010",
            dayOffset: -32,
            menu: "산미가 느껴진 한 접시",
            liking: nil,
            intensity: nil,
            overall: .liked
        ),
    ]

    private static func entry(
        record: String,
        mealID: UUID? = nil,
        dayOffset: Int,
        menu: String,
        liking: DiningSensorySelection.Liking?,
        intensity: DiningSensorySelection.Intensity?,
        overall: DiningOverallEvaluation.Response
    ) -> DiningEntry {
        let recordID = UUID(uuidString: record)!
        let observedAt = Calendar(identifier: .gregorian).date(
            byAdding: .day,
            value: dayOffset,
            to: baseDate
        )!
        return DiningEntry(
            id: recordID,
            mealID: mealID ?? recordID,
            restaurant: "고도화 검증 식당",
            restaurantID: "qa-advanced-restaurant",
            menu: menu,
            menuItemID: "qa-\(record)",
            observedAt: observedAt,
            savedAt: observedAt.addingTimeInterval(900),
            rating: 0,
            note: "",
            tasteExperienceIDs: ["sour-fresh"],
            sensorySelections: [
                .init(
                    id: "sour-fresh",
                    type: .bubble,
                    labelSnapshot: "산뜻한 산미",
                    liking: liking,
                    intensity: intensity,
                    target: .sauce,
                    phase: .lateMeal
                ),
            ],
            overallEvaluation: .init(response: overall),
            dishKindIDs: ["sauce_glaze"]
        )
    }
}

/// 시뮬레이터 검증 전용. 별도 UserDefaults를 사용하며 실제 계정 기록에는 저장하지 않는다.
private struct SensoryRuntimePreview: View {
    @StateObject private var model = AppModel.preview(
        authEntryComplete: true,
        onboardingComplete: true,
        diningEntries: SensorySelectionRuntimeFixtures.entries
    )

    var body: some View {
        AppShellView(initialTab: ProcessInfo.processInfo.arguments.contains("--sensory-analysis-qa") ? .analysis : .home)
            .environmentObject(model)
            .overlay(alignment: .top) {
                Text("검증용 선택 입력 · 메모 없음")
                    .font(TBFont.semibold(10))
                    .foregroundStyle(TBColor.textHint)
                    .allowsHitTesting(false)
            }
    }
}

private struct SensoryAdvancedRuntimePreview: View {
    var initialTab: MainTab = .analysis
    @StateObject private var model = AppModel.preview(
        authEntryComplete: true,
        onboardingComplete: true,
        diningEntries: SensoryAdvancedRuntimeFixtures.entries
    )

    var body: some View {
        AppShellView(initialTab: initialTab)
            .environmentObject(model)
            .overlay(alignment: .top) {
                Text("검증용 · 실제 식사 묶음과 조건 반전")
                    .font(TBFont.semibold(10))
                    .foregroundStyle(TBColor.textHint)
                    .allowsHitTesting(false)
            }
    }
}

private struct SensoryAdvancedDetailRuntimePreview: View {
    @StateObject private var model = AppModel.preview(
        authEntryComplete: true,
        onboardingComplete: true,
        diningEntries: SensoryAdvancedRuntimeFixtures.entries
    )

    var body: some View {
        Group {
            if let personalModel = model.sensoryAnalysis.personalModel,
               let group = PersonalTasteCandidatePresentation.groups(personalModel.candidates).first {
                PersonalTasteCandidateDetailSheet(
                    group: group,
                    observations: model.sensoryAnalysis.observations,
                    entries: model.diningEntries,
                    limits: personalModel.limits + model.sensoryAnalysis.limits
                )
            } else {
                ProgressView()
            }
        }
        .environmentObject(model)
    }
}

private struct SensoryCollectionRuntimePreview: View {
    let startMode: DiningFeedbackStartMode
    @StateObject private var model = AppModel.preview(
        authEntryComplete: true,
        onboardingComplete: true,
        diningEntries: SensorySelectionRuntimeFixtures.entries
    )

    var body: some View {
        DiningFeedbackSheet(entry: SensorySelectionRuntimeFixtures.entries[0], startMode: startMode) {
            model.updateDiningEntry($0)
        }
        .environmentObject(model)
        .overlay(alignment: .top) {
            Text("검증용 선택 입력 · 메모 없음")
                .font(TBFont.semibold(10))
                .foregroundStyle(TBColor.textHint)
                .allowsHitTesting(false)
        }
    }
}
#endif
