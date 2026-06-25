import SwiftUI
import UIKit

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
    static let completionDuration: TimeInterval = 0.22
    static let cancellationDuration: TimeInterval = 0.22
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
    static let rightActionStagger: TimeInterval = 0.08
    static let unfurlDuration: TimeInterval = 0.26
    static let openingDuration: TimeInterval = 0.16
    static let settlingDuration: TimeInterval = 0.22
    static let reducedMotionDuration: TimeInterval = 0.24
    static let initialScale: CGFloat = 0.72
    static let unfurlScale: CGFloat = 0.99
    static let openingScale: CGFloat = 1.045
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
        withAnimation(.easeOut(duration: EdgeSwipeBackMetrics.completionDuration)) {
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
        withAnimation(.easeOut(duration: EdgeSwipeBackMetrics.cancellationDuration)) {
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
    var appearance: TopAppBarAppearance = .default
    var solidBackground: TopAppBarSolidBackground = .page
    var title: String? = nil
    var centerContentOffset: CGFloat = 0
    var showBack = false
    var showSearchAction = false
    var showsDefaultActions = true
    var profile: TasteProfile? = nil
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
                    .allowsHitTesting(false)
            }

            HStack(spacing: 0) {
                leadingControl
                    .topAppBarBloom(token: bloomToken)

                Spacer(minLength: 0)

                if rightActions.isEmpty, showsDefaultActions {
                    defaultActions
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
                }
            }
            .padding(.horizontal, TBSpacing.page)
        }
        .frame(maxWidth: .infinity)
        .frame(height: TBSize.topAppBarHeight)
        .padding(.top, AppChromeMetrics.topPadding)
        .padding(.bottom, AppChromeMetrics.bottomPadding)
        .background {
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
                if let profile {
                    PalateBloomAvatar(
                        size: AppChromeMetrics.avatarSize,
                        tasteProfile: profile,
                        shapeSeed: "current-user"
                    )
                } else {
                    PalateBloomAvatar(size: AppChromeMetrics.avatarSize, seed: "current-user")
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

            withAnimation(.smooth(duration: unfurlDuration)) {
                phase = reduceMotion ? .opening : .unfurling
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + startDelay + unfurlDuration) {
            guard runningToken == newToken, !reduceMotion else {
                return
            }

            withAnimation(.smooth(duration: TopAppBarBloomMetrics.openingDuration)) {
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

            withAnimation(.smooth(duration: TopAppBarBloomMetrics.settlingDuration)) {
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
    @Binding var activeTab: MainTab
    var onCreateDishMemory: () -> Void = {}

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

            BottomTabCenterButton(action: onCreateDishMemory)

            ForEach(trailingTabs) { tab in
                BottomTabButton(tab: tab, activeTab: $activeTab)
            }
        }
        .frame(minHeight: TBSize.bottomTabBarHeight)
        .padding(.horizontal, 8)
        .background {
            TBColor.page.opacity(0.85)
                .background(.ultraThinMaterial)
        }
        .overlay(alignment: .top) {
            Rectangle()
                .fill(TBColor.border)
                .frame(height: 1)
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
        .buttonStyle(.plain)
        .accessibilityLabel(tab.title)
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
