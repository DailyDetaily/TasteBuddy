import ProgressiveBlurHeader
import SwiftUI
import UIKit
import VariableBlur

enum AppChromeMetrics {
    static let actionButtonSize: CGFloat = TBIcon.Container.large
    static let actionGap: CGFloat = 8
    static let avatarSize: CGFloat = 32
    static let topPadding: CGFloat = TBSpacing.x8
    static let bottomPadding: CGFloat = TBSpacing.x8
    static let backgroundOverlap: CGFloat = 1
    static let iconSize: CGFloat = TBIcon.Size.large
    static let tabHorizontalPadding: CGFloat = 16
    static let tabLabelTracking: CGFloat = 0.14
}

enum EdgeSwipeBackMetrics {
    static let activationWidth: CGFloat = 28
    static let minimumDistance: CGFloat = 10
    static let horizontalDominance: CGFloat = 1.2
    static let completionProgress: CGFloat = 0.32
    static let completionDuration = TasteBloomMotion.Role.feedback.duration
    static let cancellationDuration = TasteBloomMotion.Role.feedback.duration
    static let previousScreenParallax: CGFloat = 0.22
    static let previousScreenDimOpacity: CGFloat = 0.08
    static let previousScreenBlurRadius: CGFloat = 10

    static func interactiveTranslation(
        startLocation: CGPoint,
        translation: CGSize,
        containerWidth: CGFloat
    ) -> CGFloat {
        guard startLocation.x <= activationWidth,
              translation.width > 0,
              translation.width >= abs(translation.height),
              containerWidth > 0
        else {
            return 0
        }

        return min(translation.width, containerWidth)
    }

    static func progress(translation: CGFloat, containerWidth: CGFloat) -> CGFloat {
        guard containerWidth > 0 else {
            return 0
        }

        return min(max(translation / containerWidth, 0), 1)
    }

    static func shouldNavigateBack(
        startLocation: CGPoint,
        translation: CGSize,
        predictedEndTranslation: CGSize,
        containerWidth: CGFloat
    ) -> Bool {
        guard startLocation.x <= activationWidth, containerWidth > 0 else {
            return false
        }

        let horizontalTravel = max(translation.width, predictedEndTranslation.width)
        let verticalTravel = max(
            abs(translation.height),
            abs(predictedEndTranslation.height)
        )
        let completionDistance = containerWidth * completionProgress

        return horizontalTravel >= completionDistance
            && horizontalTravel >= verticalTravel * horizontalDominance
    }
}

enum TopAppBarBloomMetrics {
    static let rightActionStagger = TasteBloomMotion.stagger
    static let unfurlDuration = TasteBloomMotion.Role.content.duration
    static let openingDuration = TasteBloomMotion.Role.feedback.duration
    static let settlingDuration = TasteBloomMotion.Role.feedback.duration
    static let reducedMotionDuration: TimeInterval = 0
    static let initialScale: CGFloat = 0.72
    static let unfurlScale: CGFloat = 0.99
    static let openingScale = TasteBloomMotion.Scale.budPeak
    static let settledScale: CGFloat = 1
    static let initialOpacity: CGFloat = 0.52
    static let unfurlOpacity: CGFloat = 0.9
    static let reducedMotionInitialOpacity: CGFloat = 0.76
}

private struct EdgeSwipeBackModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var horizontalTranslation: CGFloat = 0
    @State private var isTrackingGesture = false
    @State private var rejectedGesture = false
    @State private var isSettling = false

    let isEnabled: Bool
    let movesContent: Bool
    let onTranslationChange: (CGFloat) -> Void
    let action: () -> Void

    func body(content: Content) -> some View {
        content
            .offset(x: movesContent && !reduceMotion ? horizontalTranslation : 0)
            .scrollDisabled(isTrackingGesture || isSettling)
            .simultaneousGesture(edgeSwipeGesture)
            .onDisappear(perform: resetImmediately)
    }

    private var edgeSwipeGesture: some Gesture {
        DragGesture(
            minimumDistance: EdgeSwipeBackMetrics.minimumDistance,
            coordinateSpace: .global
        )
        .onChanged(handleDragChanged)
        .onEnded(handleDragEnded)
    }

    private func handleDragChanged(_ value: DragGesture.Value) {
        guard isEnabled, !isSettling, !rejectedGesture else {
            return
        }

        if !isTrackingGesture {
            let initialTranslation = EdgeSwipeBackMetrics.interactiveTranslation(
                startLocation: value.startLocation,
                translation: value.translation,
                containerWidth: containerWidth
            )

            guard initialTranslation > 0 else {
                rejectedGesture = true
                return
            }

            isTrackingGesture = true
        }

        guard !reduceMotion else {
            return
        }

        updateTranslation(min(value.translation.width, containerWidth))
    }

    private func handleDragEnded(_ value: DragGesture.Value) {
        guard isEnabled, isTrackingGesture, !rejectedGesture else {
            cancelGesture()
            return
        }

        let shouldComplete = EdgeSwipeBackMetrics.shouldNavigateBack(
            startLocation: value.startLocation,
            translation: value.translation,
            predictedEndTranslation: value.predictedEndTranslation,
            containerWidth: containerWidth
        )

        guard shouldComplete else {
            cancelGesture()
            return
        }

        guard !reduceMotion else {
            action()
            resetImmediately()
            return
        }

        isSettling = true
        withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion)) {
            updateTranslation(containerWidth)
        }

        DispatchQueue.main.asyncAfter(
            deadline: .now() + EdgeSwipeBackMetrics.completionDuration
        ) {
            action()
            resetImmediately()
        }
    }

    private func cancelGesture() {
        guard horizontalTranslation > 0 else {
            resetImmediately()
            return
        }

        isSettling = true
        withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion)) {
            updateTranslation(0)
        }

        DispatchQueue.main.asyncAfter(
            deadline: .now() + EdgeSwipeBackMetrics.cancellationDuration
        ) {
            isTrackingGesture = false
            rejectedGesture = false
            isSettling = false
        }
    }

    private func updateTranslation(_ translation: CGFloat) {
        horizontalTranslation = max(translation, 0)
        onTranslationChange(horizontalTranslation)
    }

    private func resetImmediately() {
        var transaction = Transaction(animation: nil)
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            horizontalTranslation = 0
            onTranslationChange(0)
            isTrackingGesture = false
            rejectedGesture = false
            isSettling = false
        }
    }

    private var containerWidth: CGFloat {
        UIScreen.main.bounds.width
    }
}

enum TBTopChromeBlurMetrics {
    static let maxBlurRadius: CGFloat = 8
    static let fadeExtension: CGFloat = AppChromeMetrics.bottomPadding
    static let tintOpacityTop = 0.0
    static let tintOpacityMiddle = 0.0
}

// Keep the main-tab contract while sharing the effect with routed screens and flows.
typealias MainTabProgressiveBlurMetrics = TBTopChromeBlurMetrics

enum TBTopChromeDissolveRole {
    case title
    case controls

    var scrollRange: ClosedRange<CGFloat> {
        switch self {
        case .title: 0.06...0.82
        case .controls: 0.18...1
        }
    }
}

enum TBTopChromeCollapseMetrics {
    static let initialHeaderHeight = TBSize.topAppBarHeight
        + AppChromeMetrics.topPadding + AppChromeMetrics.bottomPadding
    static let minimumElementScale: CGFloat = 0.96
    static let maximumElementBlur: CGFloat = 12
    static let maximumElementLift: CGFloat = 6

    static func travel(scrollOffset: CGFloat, headerHeight: CGFloat) -> CGFloat {
        min(max(scrollOffset, 0), max(headerHeight, 0))
    }

    static func progress(travel: CGFloat, headerHeight: CGFloat) -> CGFloat {
        guard headerHeight > 0 else { return 0 }
        return min(max(travel / headerHeight, 0), 1)
    }

    static func dissolveProgress(_ progress: CGFloat, role: TBTopChromeDissolveRole) -> CGFloat {
        let range = role.scrollRange
        return min(max((progress - range.lowerBound) / (range.upperBound - range.lowerBound), 0), 1)
    }

    static func ease(_ progress: CGFloat) -> CGFloat {
        progress * progress * (3 - 2 * progress)
    }
}

private struct TBTopChromeCollapseProgressKey: EnvironmentKey {
    static let defaultValue: CGFloat = 0
}

private struct TBTopChromeInsetKey: EnvironmentKey {
    static let defaultValue: CGFloat? = nil
}

extension EnvironmentValues {
    var tbTopChromeCollapseProgress: CGFloat {
        get { self[TBTopChromeCollapseProgressKey.self] }
        set { self[TBTopChromeCollapseProgressKey.self] = newValue }
    }

    var tbTopChromeInset: CGFloat? {
        get { self[TBTopChromeInsetKey.self] }
        set { self[TBTopChromeInsetKey.self] = newValue }
    }
}

private struct TBTopChromeDissolveModifier: ViewModifier {
    @Environment(\.tbTopChromeCollapseProgress) private var collapseProgress
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let role: TBTopChromeDissolveRole

    func body(content: Content) -> some View {
        let progress = TBTopChromeCollapseMetrics.dissolveProgress(collapseProgress, role: role)
        let easedProgress = TBTopChromeCollapseMetrics.ease(progress)
        // Fade trails the initial blur, so the spreading edge remains visible.
        let fadeProgress = min(max((progress - 0.12) / 0.88, 0), 1)

        content
            .scaleEffect(reduceMotion ? 1 : 1 - (1 - TBTopChromeCollapseMetrics.minimumElementScale) * easedProgress)
            .offset(y: reduceMotion ? 0 : -TBTopChromeCollapseMetrics.maximumElementLift * easedProgress)
            .blur(radius: reduceMotion ? 0 : TBTopChromeCollapseMetrics.maximumElementBlur * progress * progress)
            .opacity(1 - Double(TBTopChromeCollapseMetrics.ease(fadeProgress)))
            .allowsHitTesting(progress < 0.85)
            .accessibilityHidden(progress >= 0.85)
    }
}

private struct TBScreenTopChromeModifier: ViewModifier {
    @Environment(\.tbTopChromeInset) private var inheritedTopInset
    var isEnabled: Bool

    @ViewBuilder
    func body(content: Content) -> some View {
        if isEnabled {
            GeometryReader { geometry in
                let topInset = max(geometry.safeAreaInsets.top, inheritedTopInset ?? 0)
                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .environment(\.tbTopChromeInset, topInset)
                    .scrollClipDisabled()
                    .clipShape(TopOverflowRoundedRectangle(
                        cornerRadius: 0,
                        topOverflowInset: topInset,
                        bottomOverflowInset: geometry.safeAreaInsets.bottom
                    ))
            }
        } else {
            content
                .environment(\.tbTopChromeInset, nil)
        }
    }
}

/// Background-only effect. Header elevation belongs to the foreground container, not this view.
private struct TBTopChromeBackdrop: View {
    @Environment(\.tbTopChromeInset) private var topInset
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Environment(\.colorScheme) private var colorScheme

    let fallback: Color

    var body: some View {
        Group {
            if let topInset {
                GeometryReader { geometry in
                    let headerHeight = geometry.size.height + topInset
                    let totalHeight = headerHeight + TBTopChromeBlurMetrics.fadeExtension
                    let tint: Color = colorScheme == .dark ? .black : .white

                    Group {
                        if reduceTransparency {
                            fallback
                                .frame(height: headerHeight)
                        } else {
                            VariableBlurView(
                                maxBlurRadius: TBTopChromeBlurMetrics.maxBlurRadius,
                                direction: .blurredTopClearBottom
                            )
                            .overlay {
                                LinearGradient(stops: [
                                    .init(color: tint.opacity(TBTopChromeBlurMetrics.tintOpacityTop), location: 0),
                                    .init(color: tint.opacity(TBTopChromeBlurMetrics.tintOpacityMiddle), location: 0.5),
                                    .init(color: .clear, location: 1)
                                ], startPoint: .top, endPoint: .bottom)
                            }
                            .frame(height: totalHeight)
                        }
                    }
                    .frame(width: geometry.size.width)
                    .offset(y: -topInset)
                }
            } else {
                fallback
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

private struct TBTopChromeBackgroundModifier: ViewModifier {
    let fallback: Color

    func body(content: Content) -> some View {
        content
            .background(alignment: .top) {
                TBTopChromeBackdrop(fallback: fallback)
            }
            // Elevate the complete header for existing fixed-header screens.
            .zIndex(20)
    }
}

extension View {
    /// Enable once at a full-screen container, not on each scroll view or flow step.
    func tbScreenTopChrome(isEnabled: Bool = true) -> some View {
        modifier(TBScreenTopChromeModifier(isEnabled: isEnabled))
    }

    func tbTopChromeBackground(fallback: Color) -> some View {
        modifier(TBTopChromeBackgroundModifier(fallback: fallback))
    }

    fileprivate func tbTopChromeDissolve(_ role: TBTopChromeDissolveRole) -> some View {
        modifier(TBTopChromeDissolveModifier(role: role))
    }
}

/// A single fixed viewport: the primary header collapses, then the accessory pins.
/// Use inside `tbScreenTopChrome()`; both headers share its progressive backdrop.
struct TBCollapsingTopChromeScrollView<PinnedHeader: View, Content: View>: View {
    let topChrome: AnyView?
    // The route already translates the destination; keep its primary chrome stationary horizontally.
    let contentOffset: CGFloat
    private let pinnedHeader: () -> PinnedHeader
    private let content: () -> Content

    @State private var coordinateSpaceID = UUID()
    @State private var headerHeight: CGFloat
    @State private var pinnedHeaderHeight: CGFloat = 0
    @State private var collapsedHeight: CGFloat = 0

    init(
        topChrome: AnyView?,
        contentOffset: CGFloat = 0,
        @ViewBuilder pinnedHeader: @escaping () -> PinnedHeader,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.topChrome = topChrome
        self.contentOffset = contentOffset
        self.pinnedHeader = pinnedHeader
        self.content = content
        _headerHeight = State(initialValue: topChrome == nil ? 0 : TBTopChromeCollapseMetrics.initialHeaderHeight)
    }

    var body: some View {
        GeometryReader { geometry in
            let travel = TBTopChromeCollapseMetrics.travel(scrollOffset: collapsedHeight, headerHeight: headerHeight)
            let progress = TBTopChromeCollapseMetrics.progress(travel: travel, headerHeight: headerHeight)
            let expandedChromeHeight = headerHeight + pinnedHeaderHeight
            let visibleChromeHeight = expandedChromeHeight - travel

            ZStack(alignment: .top) {
                ScrollView {
                    VStack(spacing: 0) {
                        // This inset never shrinks while scrolling: changing it would feed back into the offset.
                        Color.clear
                            .frame(height: expandedChromeHeight)
                            .accessibilityHidden(true)

                        content()
                            .frame(maxWidth: .infinity, alignment: .topLeading)
                    }
                    .frame(maxWidth: .infinity, alignment: .topLeading)
                    .frame(minHeight: geometry.size.height + headerHeight, alignment: .top)
                    .onGeometryChange(for: CGFloat.self) { proxy in
                        TBTopChromeCollapseMetrics.travel(
                            scrollOffset: -proxy.frame(in: .named(coordinateSpaceID)).minY,
                            headerHeight: headerHeight
                        )
                    } action: { nextTravel in
                        // Position drives every effect; no timed animation can lag behind the finger.
                        withTransaction(Transaction(animation: nil)) {
                            collapsedHeight = nextTravel
                        }
                    }
                }
                .coordinateSpace(name: coordinateSpaceID)
                .scrollIndicators(.hidden)
                .scrollClipDisabled()
                .zIndex(0)

                // Keep the backdrop between the scroll body and all foreground controls.
                // A full-header modifier here would also bring its elevated z-index.
                TBTopChromeBackdrop(fallback: TBColor.page)
                    .opacity(TBTopChromeCollapseMetrics.progress(travel: travel, headerHeight: TBSpacing.x8))
                    .frame(height: visibleChromeHeight)
                    .offset(x: -contentOffset)
                    .zIndex(1)

                ZStack(alignment: .top) {
                    if let topChrome {
                        topChrome
                            .environment(\.tbTopChromeCollapseProgress, progress)
                            .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { headerHeight = $0 }
                            .offset(x: -contentOffset, y: -travel)
                            .allowsHitTesting(progress < 1)
                            .accessibilityHidden(progress >= 1)
                            .zIndex(1)
                    }

                    pinnedHeader()
                        .environment(\.tbTopChromeCollapseProgress, 0)
                        .frame(maxWidth: .infinity)
                        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { pinnedHeaderHeight = $0 }
                        .offset(y: headerHeight - travel)
                        .zIndex(2)
                }
                .frame(height: visibleChromeHeight, alignment: .top)
                .zIndex(2)
            }
        }
    }
}

#Preview("Shared Progressive Top Chrome") {
    VStack(spacing: 0) {
        TBFlowTopBar(title: "식후 피드백", showsDivider: false, leadingAction: {})

        ScrollView {
            LazyVStack(spacing: TBSpacing.x8) {
                ForEach(1..<16) { index in
                    HStack {
                        Text("메뉴 \(index)")
                            .font(TBFont.bold(15))
                        Spacer()
                        Text("오늘의 다이닝")
                            .font(TBFont.regular(13))
                            .foregroundStyle(TBColor.textSecondary)
                    }
                    .padding(TBSpacing.page)
                    .background(TBColor.page, in: RoundedRectangle(cornerRadius: 16))
                }
            }
            .padding(TBSpacing.page)
        }
    }
    .tbScreenTopChrome()
    .background(TBColor.focus.ignoresSafeArea())
}

private struct MainTabStatusBarHeightKey: EnvironmentKey {
    static let defaultValue: CGFloat = 0
}

extension EnvironmentValues {
    var mainTabStatusBarHeight: CGFloat {
        get { self[MainTabStatusBarHeightKey.self] }
        set { self[MainTabStatusBarHeightKey.self] = newValue }
    }
}

struct MainTabChromeScrollView<Content: View>: View {
    @Environment(\.mainTabStatusBarHeight) private var statusBarHeight

    let topChrome: AnyView?
    private let content: () -> Content

    init(
        topChrome: AnyView?,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.topChrome = topChrome
        self.content = content
    }

    @ViewBuilder
    var body: some View {
        if let topChrome {
            // 시트 전환 중에도 같은 헤더·블러·스크롤을 유지한다.
            StickyBlurHeader(
                maxBlurRadius: TBTopChromeBlurMetrics.maxBlurRadius,
                fadeExtension: TBTopChromeBlurMetrics.fadeExtension,
                tintOpacityTop: TBTopChromeBlurMetrics.tintOpacityTop,
                tintOpacityMiddle: TBTopChromeBlurMetrics.tintOpacityMiddle
            ) {
                VStack(spacing: 0) {
                    Color.clear.frame(height: statusBarHeight)
                    topChrome
                }
            } content: {
                content()
                    .frame(maxWidth: .infinity, alignment: .topLeading)
            }
            .environment(\.colorScheme, .light)
            .scrollClipDisabled()
            .ignoresSafeArea(.container, edges: .top)
        } else {
            ScrollView {
                content()
            }
        }
    }
}

extension View {
    func edgeSwipeBack(
        isEnabled: Bool = true,
        movesContent: Bool = true,
        onTranslationChange: @escaping (CGFloat) -> Void = { _ in },
        action: @escaping () -> Void
    ) -> some View {
        modifier(EdgeSwipeBackModifier(
            isEnabled: isEnabled,
            movesContent: movesContent,
            onTranslationChange: onTranslationChange,
            action: action
        ))
    }
}

enum TopAppBarPrimaryAction {
    case measurement
    case search

    var symbol: String {
        switch self {
        case .measurement: "plus.circle"
        case .search: "magnifyingglass"
        }
    }

    var accessibilityLabel: String {
        switch self {
        case .measurement: "미각 측정 시작"
        case .search: "통합 검색 열기"
        }
    }
}

enum TopAppBarAppearance {
    case `default`
    case solid
    case transparent
}

enum TopAppBarSolidBackground {
    case focus
    case page
    case surface

    var color: Color {
        switch self {
        case .focus: TBColor.focus
        case .page: TBColor.page
        case .surface: TBColor.surface
        }
    }
}

struct TopAppBarAction: Identifiable {
    let id: String
    let symbol: String
    let accessibilityLabel: String
    let action: () -> Void

    init(
        id: String,
        symbol: String,
        accessibilityLabel: String,
        action: @escaping () -> Void
    ) {
        self.id = id
        self.symbol = symbol
        self.accessibilityLabel = accessibilityLabel
        self.action = action
    }
}

struct TopAppBar: View {
    @Environment(\.tbTopChromeInset) private var topChromeInset

    var appearance: TopAppBarAppearance = .default
    var solidBackground: TopAppBarSolidBackground = .page
    var title: String? = nil
    var centerContentOffset: CGFloat = 0
    var showBack = false
    var showSearchAction = false
    var showsDefaultActions = true
    var profile: TasteProfile? = nil
    var avatarImageData: Data? = nil
    var hasUnreadNotifications = false
    var bloomToken = 0
    var rightActions: [TopAppBarAction] = []
    var onBack: (() -> Void)? = nil
    var onStartMeasurement: (() -> Void)? = nil
    var onOpenSearch: (() -> Void)? = nil
    var onOpenNotifications: (() -> Void)? = nil
    var onOpenMenu: (() -> Void)? = nil
    var onOpenProfile: (() -> Void)? = nil

    var body: some View {
        ZStack {
            if let title {
                Text(title)
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineLimit(1)
                    .frame(maxWidth: 240)
                    .offset(x: centerContentOffset)
                    .tbTopChromeDissolve(.title)
                    .allowsHitTesting(false)
            }

            HStack(spacing: 0) {
                leadingControl
                    .topAppBarBloom(token: bloomToken)
                    .tbTopChromeDissolve(.controls)

                Spacer(minLength: 0)

                if rightActions.isEmpty, showsDefaultActions {
                    defaultActions
                        .tbTopChromeDissolve(.controls)
                } else if !rightActions.isEmpty {
                    HStack(spacing: AppChromeMetrics.actionGap) {
                        ForEach(rightActions.indices, id: \.self) { index in
                            let action = rightActions[index]

                            TopAppBarIconButton(
                                symbol: action.symbol,
                                accessibilityLabel: action.accessibilityLabel,
                                action: action.action
                            )
                            .topAppBarBloom(
                                token: bloomToken,
                                delay: rightActionBloomDelay(index: index, count: rightActions.count)
                            )
                        }
                    }
                    .tbTopChromeDissolve(.controls)
                }
            }
            .padding(.horizontal, TBSpacing.page)
        }
        .frame(maxWidth: .infinity)
        .frame(height: TBSize.topAppBarHeight)
        .padding(.top, AppChromeMetrics.topPadding)
        .padding(.bottom, AppChromeMetrics.bottomPadding)
        .background {
            if topChromeInset != nil, appearance != .transparent {
                Color.clear
                    .tbTopChromeBackground(fallback: solidBackground.color)
            } else {
                background
                    .ignoresSafeArea(edges: .top)
                    .overlay(alignment: .bottom) {
                        background
                            .frame(height: AppChromeMetrics.backgroundOverlap)
                            .offset(y: AppChromeMetrics.backgroundOverlap)
                    }
                    .transaction { transaction in
                        transaction.animation = nil
                    }
            }
        }
        .zIndex(20)
    }

    @ViewBuilder
    private var leadingControl: some View {
        if showBack {
            TopAppBarIconButton(
                symbol: "chevron.left",
                accessibilityLabel: "뒤로",
                action: { onBack?() }
            )
        } else {
            Button {
                onOpenProfile?()
            } label: {
                let image = avatarImageData.flatMap(UIImage.init(data:))
                if let profile {
                    PalateBloomAvatar(
                        size: AppChromeMetrics.avatarSize,
                        tasteProfile: profile,
                        shapeSeed: "current-user",
                        image: image
                    )
                } else {
                    PalateBloomAvatar(
                        size: AppChromeMetrics.avatarSize,
                        seed: "current-user",
                        image: image
                    )
                }
            }
            .buttonStyle(.plain)
            .frame(
                width: AppChromeMetrics.avatarSize,
                height: AppChromeMetrics.avatarSize
            )
            .contentShape(Circle())
            .accessibilityLabel("프로필 확인 및 편집")
        }
    }

    private var defaultActions: some View {
        let primaryAction: TopAppBarPrimaryAction = showSearchAction ? .search : .measurement

        return HStack(spacing: AppChromeMetrics.actionGap) {
            TopAppBarIconButton(
                symbol: "bell",
                accessibilityLabel: "알림",
                showsDot: hasUnreadNotifications,
                action: { onOpenNotifications?() }
            )
            .topAppBarBloom(token: bloomToken, delay: rightActionBloomDelay(index: 0, count: 3))

            TopAppBarIconButton(
                symbol: primaryAction.symbol,
                accessibilityLabel: primaryAction.accessibilityLabel,
                action: {
                    if showSearchAction {
                        onOpenSearch?()
                    } else {
                        onStartMeasurement?()
                    }
                }
            )
            .topAppBarBloom(token: bloomToken, delay: rightActionBloomDelay(index: 1, count: 3))

            TopAppBarIconButton(
                symbol: "line.3.horizontal",
                accessibilityLabel: "메뉴 열기",
                action: { onOpenMenu?() }
            )
            .topAppBarBloom(token: bloomToken, delay: rightActionBloomDelay(index: 2, count: 3))
        }
    }

    private func rightActionBloomDelay(index: Int, count: Int) -> TimeInterval {
        guard count > 1 else {
            return 0
        }

        return TimeInterval(count - 1 - index) * TopAppBarBloomMetrics.rightActionStagger
    }

    @ViewBuilder
    private var background: some View {
        switch appearance {
        case .default:
            TBColor.page.opacity(0.85)
                .background(.ultraThinMaterial)
        case .solid:
            solidBackground.color
        case .transparent:
            Color.clear
        }
    }
}

private struct TopAppBarIconButton: View {
    let symbol: String
    let accessibilityLabel: String
    var showsDot = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            LucideIcon(
                systemName: symbol,
                size: AppChromeMetrics.iconSize,
                strokeWidth: TBIcon.Stroke.regular
            )
                .foregroundStyle(TBColor.iconPrimary)
                .frame(
                    width: AppChromeMetrics.actionButtonSize,
                    height: AppChromeMetrics.actionButtonSize
                )
                .overlay(alignment: .topTrailing) {
                    if showsDot {
                        Circle()
                            .fill(TasteAxis.sweet.mainColor)
                            .frame(width: 6, height: 6)
                            .offset(x: -2, y: 2)
                    }
                }
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabel)
    }
}

private enum TopAppBarBloomPhase {
    case seeded
    case unfurling
    case opening
    case settled
}

private struct TopAppBarBloomModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var phase: TopAppBarBloomPhase = .settled
    @State private var runningToken = 0

    let token: Int
    let delay: TimeInterval

    func body(content: Content) -> some View {
        content
            .scaleEffect(scale, anchor: .center)
            .opacity(opacity)
            .onChange(of: token) { _, newToken in
                runBloom(for: newToken)
            }
    }

    private var scale: CGFloat {
        guard !reduceMotion else {
            return 1
        }

        switch phase {
        case .seeded:
            return TopAppBarBloomMetrics.initialScale
        case .unfurling:
            return TopAppBarBloomMetrics.unfurlScale
        case .opening:
            return TopAppBarBloomMetrics.openingScale
        case .settled:
            return TopAppBarBloomMetrics.settledScale
        }
    }

    private var opacity: CGFloat {
        switch phase {
        case .seeded:
            return reduceMotion
                ? TopAppBarBloomMetrics.reducedMotionInitialOpacity
                : TopAppBarBloomMetrics.initialOpacity
        case .unfurling:
            return TopAppBarBloomMetrics.unfurlOpacity
        case .opening, .settled:
            return 1
        }
    }

    private func runBloom(for newToken: Int) {
        guard newToken > 0 else {
            return
        }

        runningToken = newToken
        guard !reduceMotion else {
            phase = .settled
            return
        }

        var seedTransaction = Transaction(animation: nil)
        seedTransaction.disablesAnimations = true
        withTransaction(seedTransaction) {
            phase = .seeded
        }

        let startDelay = reduceMotion ? 0 : delay
        let unfurlDuration = reduceMotion
            ? TopAppBarBloomMetrics.reducedMotionDuration
            : TopAppBarBloomMetrics.unfurlDuration

        DispatchQueue.main.asyncAfter(deadline: .now() + startDelay) {
            guard runningToken == newToken else {
                return
            }

            withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
                phase = reduceMotion ? .opening : .unfurling
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + startDelay + unfurlDuration) {
            guard runningToken == newToken, !reduceMotion else {
                return
            }

            withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion)) {
                phase = .opening
            }
        }

        DispatchQueue.main.asyncAfter(
            deadline: .now()
                + startDelay
                + unfurlDuration
                + TopAppBarBloomMetrics.openingDuration
        ) {
            guard runningToken == newToken, !reduceMotion else {
                return
            }

            withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion)) {
                phase = .settled
            }
        }
    }
}

private extension View {
    func topAppBarBloom(token: Int, delay: TimeInterval = 0) -> some View {
        modifier(TopAppBarBloomModifier(token: token, delay: delay))
    }
}

struct BottomTabBar: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Binding var activeTab: MainTab
    var onCreateDishMemory: () -> Void = {}
    @State private var isCenterButtonPressing = false

    private var leadingTabs: [MainTab] {
        Array(MainTab.allCases.prefix(2))
    }

    private var trailingTabs: [MainTab] {
        Array(MainTab.allCases.dropFirst(2))
    }

    var body: some View {
        HStack(spacing: 0) {
            ForEach(leadingTabs) { tab in
                BottomTabButton(tab: tab, activeTab: $activeTab)
            }

            BottomTabCenterButton(
                action: onCreateDishMemory,
                onPressingChange: { isPressing in
                    isCenterButtonPressing = isPressing
                }
            )
                .background {
                    GeometryReader { proxy in
                        Color.clear.preference(
                            key: BottomTabCenterButtonFramePreferenceKey.self,
                            value: proxy.frame(in: .global)
                        )
                    }
                }

            ForEach(trailingTabs) { tab in
                BottomTabButton(tab: tab, activeTab: $activeTab)
            }
        }
        .frame(minHeight: TBSize.bottomTabBarHeight)
        .padding(.horizontal, 8)
        .background(TBColor.page)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(TBColor.border)
                .frame(height: 1)
                .opacity(isCenterButtonPressing ? 0 : 1)
                .animation(TasteBloomMotion.animation(.press, reduceMotion: reduceMotion), value: isCenterButtonPressing)
        }
    }
}

struct BottomTabCenterButtonFramePreferenceKey: PreferenceKey {
    static var defaultValue: CGRect = .null

    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        let nextFrame = nextValue()
        if !nextFrame.isNull {
            value = nextFrame
        }
    }
}

private struct BottomTabButton: View {
    let tab: MainTab
    @Binding var activeTab: MainTab

    private var isActive: Bool {
        activeTab == tab
    }

    var body: some View {
        Button {
            activeTab = tab
        } label: {
            VStack(spacing: 2) {
                BottomTabIcon(tab: tab, isActive: isActive)
                    .frame(
                        width: AppChromeMetrics.iconSize,
                        height: AppChromeMetrics.iconSize
                    )

                Text(tab.title)
                    .font(isActive ? TBFont.semibold(10) : TBFont.medium(10))
                    .tracking(AppChromeMetrics.tabLabelTracking)
            }
            .foregroundStyle(isActive ? TBColor.textPrimary : TBColor.textDisabled)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, AppChromeMetrics.tabHorizontalPadding)
            .padding(.vertical, 6)
            .contentShape(Rectangle())
        }
        .buttonStyle(TBTokenButtonStyle())
        .accessibilityLabel(tab.title)
        .tasteBloomMotion(.feedback, value: isActive)
        .accessibilityAddTraits(isActive ? .isSelected : [])
    }
}

private struct BottomTabIcon: View {
    let tab: MainTab
    let isActive: Bool

    private var lineWidth: CGFloat {
        isActive ? 2 : 1.7
    }

    @ViewBuilder
    var body: some View {
        switch tab {
        case .home:
            HomeTabIconShape()
                .stroke(
                    isActive ? TBColor.textPrimary : TBColor.textDisabled,
                    style: StrokeStyle(
                        lineWidth: lineWidth,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )
        case .analysis:
            AnalysisTabIconShape()
                .stroke(
                    isActive ? TBColor.textPrimary : TBColor.textDisabled,
                    style: StrokeStyle(
                        lineWidth: lineWidth,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )
        case .dining:
            LucideIcon(
                .calendarCheck,
                size: AppChromeMetrics.iconSize,
                strokeWidth: isActive ? TBIcon.Stroke.medium : TBIcon.Stroke.regular
            )
        case .profile:
            LucideIcon(
                .user,
                size: AppChromeMetrics.iconSize,
                strokeWidth: isActive ? TBIcon.Stroke.medium : TBIcon.Stroke.regular
            )
        }
    }
}

private struct HomeTabIconShape: Shape {
    func path(in rect: CGRect) -> Path {
        let sx = rect.width / 24
        let sy = rect.height / 24
        var path = Path()
        path.move(to: CGPoint(x: 3.19 * sx, y: 9.16 * sy))
        path.addCurve(
            to: CGPoint(x: 3 * sx, y: 10 * sy),
            control1: CGPoint(x: 3.06 * sx, y: 9.42 * sy),
            control2: CGPoint(x: 3 * sx, y: 9.71 * sy)
        )
        path.addLine(to: CGPoint(x: 3 * sx, y: 19 * sy))
        path.addCurve(
            to: CGPoint(x: 5 * sx, y: 21 * sy),
            control1: CGPoint(x: 3 * sx, y: 20.1 * sy),
            control2: CGPoint(x: 3.9 * sx, y: 21 * sy)
        )
        path.addLine(to: CGPoint(x: 8 * sx, y: 21 * sy))
        path.addCurve(
            to: CGPoint(x: 9 * sx, y: 20 * sy),
            control1: CGPoint(x: 8.55 * sx, y: 21 * sy),
            control2: CGPoint(x: 9 * sx, y: 20.55 * sy)
        )
        path.addLine(to: CGPoint(x: 9 * sx, y: 13 * sy))
        path.addCurve(
            to: CGPoint(x: 10 * sx, y: 12 * sy),
            control1: CGPoint(x: 9 * sx, y: 12.45 * sy),
            control2: CGPoint(x: 9.45 * sx, y: 12 * sy)
        )
        path.addLine(to: CGPoint(x: 14 * sx, y: 12 * sy))
        path.addCurve(
            to: CGPoint(x: 15 * sx, y: 13 * sy),
            control1: CGPoint(x: 14.55 * sx, y: 12 * sy),
            control2: CGPoint(x: 15 * sx, y: 12.45 * sy)
        )
        path.addLine(to: CGPoint(x: 15 * sx, y: 20 * sy))
        path.addCurve(
            to: CGPoint(x: 16 * sx, y: 21 * sy),
            control1: CGPoint(x: 15 * sx, y: 20.55 * sy),
            control2: CGPoint(x: 15.45 * sx, y: 21 * sy)
        )
        path.addLine(to: CGPoint(x: 19 * sx, y: 21 * sy))
        path.addCurve(
            to: CGPoint(x: 21 * sx, y: 19 * sy),
            control1: CGPoint(x: 20.1 * sx, y: 21 * sy),
            control2: CGPoint(x: 21 * sx, y: 20.1 * sy)
        )
        path.addLine(to: CGPoint(x: 21 * sx, y: 10 * sy))
        path.addCurve(
            to: CGPoint(x: 20.29 * sx, y: 8.47 * sy),
            control1: CGPoint(x: 21 * sx, y: 9.42 * sy),
            control2: CGPoint(x: 20.74 * sx, y: 8.86 * sy)
        )
        path.addLine(to: CGPoint(x: 13.29 * sx, y: 2.47 * sy))
        path.addCurve(
            to: CGPoint(x: 10.71 * sx, y: 2.47 * sy),
            control1: CGPoint(x: 12.55 * sx, y: 1.84 * sy),
            control2: CGPoint(x: 11.45 * sx, y: 1.84 * sy)
        )
        path.addLine(to: CGPoint(x: 3.71 * sx, y: 8.47 * sy))
        path.addCurve(
            to: CGPoint(x: 3.19 * sx, y: 9.16 * sy),
            control1: CGPoint(x: 3.49 * sx, y: 8.66 * sy),
            control2: CGPoint(x: 3.31 * sx, y: 8.89 * sy)
        )
        return path
    }
}

private struct AnalysisTabIconShape: Shape {
    func path(in rect: CGRect) -> Path {
        let sx = rect.width / 24
        let sy = rect.height / 24
        var path = Path()
        path.addRoundedRect(
            in: CGRect(x: 14 * sx, y: 8 * sy, width: 4 * sx, height: 9 * sy),
            cornerSize: CGSize(width: sx, height: sy)
        )
        path.addRoundedRect(
            in: CGRect(x: 6 * sx, y: 5 * sy, width: 4 * sx, height: 12 * sy),
            cornerSize: CGSize(width: sx, height: sy)
        )
        path.move(to: CGPoint(x: 2 * sx, y: 21 * sy))
        path.addLine(to: CGPoint(x: 22 * sx, y: 21 * sy))
        return path
    }
}
