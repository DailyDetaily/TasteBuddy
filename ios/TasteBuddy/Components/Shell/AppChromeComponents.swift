import SwiftUI

enum AppChromeMetrics {
    static let actionButtonSize: CGFloat = 40
    static let actionGap: CGFloat = 8
    static let avatarSize: CGFloat = 32
    static let iconSize: CGFloat = TBIcon.Size.large
    static let tabHorizontalPadding: CGFloat = 16
    static let tabLabelTracking: CGFloat = 0.14
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
    var showBack = false
    var showSearchAction = false
    var profile: TasteProfile? = nil
    var hasUnreadNotifications = false
    var rightActions: [TopAppBarAction] = []
    var onBack: (() -> Void)? = nil
    var onStartMeasurement: (() -> Void)? = nil
    var onOpenSearch: (() -> Void)? = nil
    var onOpenNotifications: (() -> Void)? = nil
    var onOpenMenu: (() -> Void)? = nil
    var onOpenProfile: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 0) {
            leadingControl

            Spacer(minLength: 0)

            if rightActions.isEmpty {
                defaultActions
            } else {
                HStack(spacing: AppChromeMetrics.actionGap) {
                    ForEach(rightActions) { action in
                        TopAppBarIconButton(
                            symbol: action.symbol,
                            accessibilityLabel: action.accessibilityLabel,
                            action: action.action
                        )
                    }
                }
            }
        }
        .overlay {
            if let title {
                Text(title)
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineLimit(1)
                    .frame(maxWidth: 240)
                    .allowsHitTesting(false)
            }
        }
        .frame(height: TBSize.topAppBarHeight)
        .padding(.horizontal, TBSpacing.page)
        .background(background)
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
            TopAppBarIconButton(
                symbol: "line.3.horizontal",
                accessibilityLabel: "메뉴 열기",
                action: { onOpenMenu?() }
            )
        }
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
                .foregroundStyle(TBColor.textSecondary)
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

struct BottomTabBar: View {
    @Binding var activeTab: MainTab

    var body: some View {
        HStack(spacing: 0) {
            ForEach(MainTab.allCases) { tab in
                Button {
                    withAnimation(.easeInOut(duration: 0.18)) {
                        activeTab = tab
                    }
                } label: {
                    VStack(spacing: 2) {
                        BottomTabIcon(tab: tab, isActive: activeTab == tab)
                            .frame(
                                width: AppChromeMetrics.iconSize,
                                height: AppChromeMetrics.iconSize
                            )

                        Text(tab.title)
                            .font(activeTab == tab ? TBFont.semibold(10) : TBFont.medium(10))
                            .tracking(AppChromeMetrics.tabLabelTracking)
                    }
                    .foregroundStyle(activeTab == tab ? TBColor.textPrimary : TBColor.textDisabled)
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, AppChromeMetrics.tabHorizontalPadding)
                    .padding(.vertical, 6)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title)
                .accessibilityAddTraits(activeTab == tab ? .isSelected : [])
            }
        }
        .frame(minHeight: TBSize.bottomTabBarHeight)
        .padding(.horizontal, 8)
        .background(
            TBColor.page.opacity(0.85)
                .background(.ultraThinMaterial)
        )
        .overlay(alignment: .top) {
            Rectangle()
                .fill(TBColor.border)
                .frame(height: 1)
        }
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
