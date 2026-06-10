import SwiftUI

struct AppShellView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var activeTab: MainTab
    @State private var routeStack: [AppRoute] = []
    @State private var activeSheet: AppSheet?
    @State private var hasUnreadNotifications = true

    init(initialTab: MainTab = .home, initialRoute: AppRoute? = nil) {
        _activeTab = State(initialValue: initialTab)
        _routeStack = State(initialValue: initialRoute.map { [$0] } ?? [])
    }

    var body: some View {
        ZStack {
            TBColor.page.ignoresSafeArea()

            if let activeRoute = routeStack.last {
                AppRouteFocusContainer(
                    route: activeRoute,
                    onBack: popRoute,
                    navigate: navigateImmediately
                )
                .environmentObject(appModel)
            } else {
                VStack(spacing: 0) {
                    TopAppBar(
                        showSearchAction: activeTab != .home,
                        profile: appModel.profile,
                        hasUnreadNotifications: hasUnreadNotifications,
                        onStartMeasurement: {
                            activeSheet = .quickRefinement
                        },
                        onOpenSearch: {
                            activeSheet = .globalSearch
                        },
                        onOpenNotifications: {
                            hasUnreadNotifications = false
                            activeSheet = .notifications
                        },
                        onOpenMenu: { activeSheet = .menu },
                        onOpenProfile: { activeSheet = .profileSummary }
                    )

                    currentTabView
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                    BottomTabBar(activeTab: $activeTab)
                }
            }
        }
        .sheet(item: $activeSheet) { sheet in
            switch sheet {
            case .profileSummary:
                ProfileSummarySheet(
                    openAuthEntry: { intent in
                        activeSheet = .authEntry(intent)
                    }
                )
            case .globalSearch:
                HomeSearchSheet(onOpenRoute: navigate)
            case .notifications:
                NotificationsSheet()
            case .quickRefinement:
                QuickRefinementSheet()
            case .menu:
                AppMenuSheet(
                    openProfile: { activeSheet = .profileSummary },
                    openNotifications: {
                        hasUnreadNotifications = false
                        activeSheet = .notifications
                    },
                    startQuickRefinement: { activeSheet = .quickRefinement },
                    openSavedList: { navigate(.savedRestaurants) }
                )
            case .authEntry(let intent):
                AuthEntrySheet(
                    intent: intent,
                    onLinkedCurrentProfile: {
                        activeSheet = .profileSummary
                    }
                )
            }
        }
    }

    private func navigate(_ route: AppRoute) {
        let isDismissingSheet = activeSheet != nil
        activeSheet = nil

        guard isDismissingSheet else {
            routeStack.append(route)
            return
        }

        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 250_000_000)
            routeStack.append(route)
        }
    }

    private func navigateImmediately(_ route: AppRoute) {
        routeStack.append(route)
    }

    private func popRoute() {
        _ = routeStack.popLast()
    }

    @ViewBuilder
    private var currentTabView: some View {
        switch activeTab {
        case .home:
            HomeView(onOpenRoute: navigate)
        case .analysis:
            AnalysisView(
                onStartMeasurement: {
                    activeSheet = .quickRefinement
                },
                onOpenTasteChange: {
                    navigateImmediately(.tasteChange)
                }
            )
        case .dining:
            DiningView()
        case .profile:
            ProfileView(
                onOpenConnection: { kind in navigateImmediately(.connectionList(kind)) },
                onFindBuddy: { activeSheet = .globalSearch },
                onOpenSavedList: { navigateImmediately(.savedRestaurants) }
            )
        }
    }
}

private struct AppRouteFocusContainer: View {
    let route: AppRoute
    let onBack: () -> Void
    let navigate: (AppRoute) -> Void

    var body: some View {
        VStack(spacing: 0) {
            TopAppBar(
                appearance: .solid,
                solidBackground: .page,
                title: route.title,
                showBack: true,
                rightActions: restaurantActions,
                onBack: onBack
            )

            AppRouteDestinationView(route: route, navigate: navigate)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(TBColor.page.ignoresSafeArea())
    }

    private var restaurantActions: [TopAppBarAction] {
        guard case .restaurant = route else { return [] }
        return [
            TopAppBarAction(
                id: "share",
                symbol: "square.and.arrow.up",
                accessibilityLabel: "공유",
                action: {}
            ),
            TopAppBarAction(
                id: "more",
                symbol: "ellipsis",
                accessibilityLabel: "더보기",
                action: {}
            )
        ]
    }
}

private struct ProfileSummarySheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let openAuthEntry: (BackendAuthEmailIntent) -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let profile = appModel.profile {
                        SectionCard {
                            VStack(alignment: .leading, spacing: 20) {
                                HStack(spacing: 14) {
                                    PalateBloomAvatar(
                                        size: 64,
                                        tasteProfile: profile,
                                        shapeSeed: "current-user"
                                    )
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("신준호")
                                            .font(TBFont.bold(18))
                                            .foregroundStyle(TBColor.textPrimary)
                                        Text("@머리아깨무봄발")
                                            .font(TBFont.semibold(13))
                                            .foregroundStyle(TBColor.textHint)
                                    }
                                }

                                HStack {
                                    Text("기준 정보 입력 · 식이제한 없음")
                                        .font(TBFont.semibold(12))
                                        .foregroundStyle(profile.strongestAxis.tintTextColor)
                                    Spacer()
                                    LucideIcon(
                                        .chevronRight,
                                        size: TBIcon.Size.small,
                                        strokeWidth: TBIcon.Stroke.regular
                                    )
                                        .foregroundStyle(profile.strongestAxis.tintTextColor)
                                }
                                .padding(12)
                                .background(profile.strongestAxis.tintColor)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            }
                        }

                        SectionCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("계정 연결")
                                    .font(TBFont.bold(14))
                                    .foregroundStyle(TBColor.textPrimary)
                                Text("지금 만든 미각 프로필을 이메일에 연결하면 다음 기기에서도 이어서 사용할 수 있어요.")
                                    .font(TBFont.regular(12))
                                    .foregroundStyle(TBColor.textSubtle)
                                    .lineSpacing(4)

                                Button {
                                    openAuthEntry(.linkCurrentProfile)
                                } label: {
                                    HStack {
                                        Text("현재 프로필을 이메일에 연결")
                                            .font(TBFont.semibold(12))
                                        Spacer()
                                        LucideIcon(
                                            .chevronRight,
                                            size: TBIcon.Size.small,
                                            strokeWidth: TBIcon.Stroke.regular
                                        )
                                    }
                                    .foregroundStyle(profile.strongestAxis.tintTextColor)
                                    .padding(.horizontal, 12)
                                    .frame(height: 44)
                                    .background(profile.strongestAxis.tintColor)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(TBSpacing.page)
            }
            .navigationTitle("프로필")
            .tbInlineNavigationTitle()
            .tbPageBackground()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
    }
}

private struct NotificationsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appModel: AppModel
    @State private var showsDiningFeedback = false
    @State private var hasUnread = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 8) {
                    HStack {
                        HStack(spacing: 7) {
                            Text("알림")
                                .font(TBFont.bold(16))
                            if hasUnread {
                                Text("2")
                                    .font(TBFont.bold(10))
                                    .foregroundStyle(TBColor.textInverse)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(TBColor.textPrimary)
                                    .clipShape(Capsule())
                            }
                        }
                        Spacer()
                        if hasUnread {
                            Button("모두 읽기") {
                                hasUnread = false
                            }
                            .font(TBFont.semibold(12))
                            .foregroundStyle(TBColor.textMuted)
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.bottom, 4)

                    Button {
                        hasUnread = false
                        showsDiningFeedback = true
                    } label: {
                        NotificationCompactRow(
                            symbol: "fork.knife",
                            title: "식후 피드백을 남길 시간이에요",
                            detail: "방금의 감각을 남기면 다음 식사가 더 잘 맞아집니다.",
                            time: "방금",
                            tone: .sweet,
                            showsUnread: hasUnread
                        )
                    }
                    .buttonStyle(.plain)

                    Button {
                        hasUnread = false
                    } label: {
                        NotificationCompactRow(
                            symbol: "sparkles",
                            title: "미각 프로필이 업데이트됐어요",
                            detail: "최근 피드백을 반영해 다음 다이닝 기준을 다듬었습니다.",
                            time: "1일 전",
                            tone: .umami,
                            showsUnread: hasUnread
                        )
                    }
                    .buttonStyle(.plain)
                }
                .padding(8)
            }
            .navigationTitle("")
            .tbPageBackground()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
            .fullScreenCover(isPresented: $showsDiningFeedback) {
                DiningFeedbackSheet { entry in
                    appModel.addDiningEntry(entry)
                }
            }
        }
    }
}

private struct QuickRefinementSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: { dismiss() })),
            headerCenter: AnyView(
                Text("프로필 정교화")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(
                PrimaryButton(title: "빠른 미각 보정 다시 하기") {
                    appModel.restartCalibration()
                    dismiss()
                }
            ),
            usesNativeSheetChrome: true
        ) {
            ScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    TBFlowHeaderBlock(
                        title: "현재 입맛으로 프로필을 다시 맞춰볼까요?",
                        description: "짧은 질문으로 지금의 반응을 확인하고, 다음 다이닝에 쓰는 해석을 최신 상태로 다듬습니다.",
                        topLeft: "미각 관리",
                        topRightSlot: AnyView(
                            StatusChip(
                                title: appModel.profile?.confidence ?? "Starter",
                                backgroundColor: TBColor.successSoft,
                                foregroundColor: TBColor.success
                            )
                        )
                    )

                    SectionCard {
                        VStack(alignment: .leading, spacing: 12) {
                            MenuActionRowContent(
                                icon: "slider.horizontal.3",
                                title: "12문항 빠른 보정",
                                detail: "기기 없이 현재 미각 반응 확인"
                            )
                            Divider()
                            Text("기존 식사 기록은 유지되고, 프로필 좌표와 해석만 새 응답으로 업데이트됩니다.")
                                .font(TBFont.regular(12))
                                .foregroundStyle(TBColor.textSubtle)
                                .lineSpacing(4)
                        }
                    }
                }
                .padding(TBSpacing.page)
                .padding(.bottom, 24)
            }
        }
        .presentationDragIndicator(.hidden)
        .presentationBackground(Color.clear)
        .presentationCornerRadius(0)
        .prefersUISheetGrabberVisible(false)
    }
}

private struct AppMenuSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let openProfile: () -> Void
    let openNotifications: () -> Void
    let startQuickRefinement: () -> Void
    let openSavedList: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        Button(action: openProfile) {
                            HStack(spacing: 12) {
                                PalateBloomAvatar(
                                    size: 40,
                                    bloomProfile: appModel.profile.map {
                                        PalateBloomProfile(profile: $0)
                                    } ?? .fallback(seed: "current-user"),
                                    shapeSeed: "current-user"
                                )
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("신준호")
                                        .font(TBFont.semibold(14))
                                        .foregroundStyle(TBColor.textPrimary)
                                    Text("프로필 보관 전")
                                        .font(TBFont.regular(11))
                                        .foregroundStyle(TBColor.textMuted)
                                }
                                Spacer()
                                LucideIcon(
                                    .mail,
                                    size: TBIcon.Size.base,
                                    strokeWidth: TBIcon.Stroke.regular
                                )
                                    .foregroundStyle(TBColor.textHint)
                            }
                            .padding(12)
                            .background(TBColor.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .buttonStyle(.plain)

                        MenuSection(
                            title: "미각 관리",
                            rows: [
                                MenuRowModel(
                                    symbol: "arrow.clockwise",
                                    title: "미각 재측정",
                                    detail: "현재 미각 반응 다시 측정",
                                    action: startQuickRefinement
                                ),
                                MenuRowModel(
                                    symbol: "shield.checkered",
                                    title: "프로필 정확도 향상",
                                    detail: "더 정밀한 캘리브레이션",
                                    action: startQuickRefinement
                                ),
                                MenuRowModel(
                                    symbol: "bell",
                                    title: "보정 알림 설정",
                                    detail: "다이닝 전 미각 측정 알림",
                                    action: openNotifications
                                ),
                            ]
                        )

                        MenuSection(
                            title: "앱 정보",
                            rows: [
                                MenuRowModel(
                                    symbol: "bookmark",
                                    title: "테이스트 리스트",
                                    detail: "저장한 레스토랑 후보",
                                    action: openSavedList
                                ),
                                MenuRowModel(
                                    symbol: "questionmark.circle",
                                    title: "도움말",
                                    detail: "Taste Buddy 사용 가이드",
                                    action: {}
                                ),
                                MenuRowModel(
                                    symbol: "info.circle",
                                    title: "앱 정보",
                                    detail: "Taste Buddy v1.0.0",
                                    action: {}
                                ),
                            ]
                        )
                    }
                    .padding(TBSpacing.page)
                }

                Button(role: .destructive) {
                    appModel.resetAll()
                    dismiss()
                } label: {
                    HStack(spacing: 12) {
                        LucideIcon(
                            .logOut,
                            size: TBIcon.Size.base,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        Text("로그아웃")
                            .font(TBFont.medium(13))
                    }
                    .foregroundStyle(TBColor.textHint)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, TBSpacing.page)
                    .frame(height: 56)
                }
                .buttonStyle(.plain)
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(TBColor.border)
                        .frame(height: 1)
                }
            }
            .navigationTitle("메뉴")
            .tbInlineNavigationTitle()
            .tbPageBackground()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
    }
}

private struct NotificationCompactRow: View {
    let symbol: String
    let title: String
    let detail: String
    let time: String
    let tone: TasteAxis
    let showsUnread: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            LucideIcon(
                systemName: symbol,
                size: TBIcon.Size.medium,
                strokeWidth: TBIcon.Stroke.regular
            )
                .frame(width: 40, height: 40)
                .foregroundStyle(tone.mainColor)
                .background(tone.tintColor)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(TBFont.semibold(13))
                    .foregroundStyle(TBColor.textPrimary)
                Text(detail)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textMuted)
                    .lineSpacing(3)
                Text(time)
                    .font(TBFont.medium(11))
                    .foregroundStyle(TBColor.textFaint)
            }

            Spacer(minLength: 4)

            if showsUnread {
                Circle()
                    .fill(TasteAxis.sweet.mainColor)
                    .frame(width: 6, height: 6)
                    .padding(.top, 6)
            }
        }
        .padding(12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct MenuRowModel {
    let symbol: String
    let title: String
    let detail: String
    let action: () -> Void
}

private struct MenuSection: View {
    let title: String
    let rows: [MenuRowModel]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(TBFont.semibold(11))
                .tracking(0.14)
                .foregroundStyle(TBColor.textFaint)

            VStack(spacing: 4) {
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    Button(action: row.action) {
                        HStack(spacing: 12) {
                            LucideIcon(
                                systemName: row.symbol,
                                size: TBIcon.Size.base,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                                .frame(width: 22)
                                .foregroundStyle(TBColor.textSecondary)

                            VStack(alignment: .leading, spacing: 3) {
                                Text(row.title)
                                    .font(TBFont.semibold(13))
                                    .foregroundStyle(TBColor.textPrimary)
                                Text(row.detail)
                                    .font(TBFont.regular(11))
                                    .foregroundStyle(TBColor.textMuted)
                                    .lineLimit(1)
                            }

                            Spacer()

                            LucideIcon(
                                .chevronRight,
                                size: TBIcon.Size.xSmall,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                                .foregroundStyle(TBColor.textHint)
                        }
                        .padding(.horizontal, 12)
                        .frame(minHeight: 58)
                        .background(TBColor.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct MenuActionRow: View {
    let icon: String
    let title: String
    let detail: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            MenuActionRowContent(icon: icon, title: title, detail: detail)
        }
        .buttonStyle(.plain)
    }
}

private struct MenuActionRowContent: View {
    let icon: String
    let title: String
    let detail: String
    var destructive = false

    var body: some View {
        HStack(spacing: 12) {
            LucideIcon(
                systemName: icon,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.regular
            )
                .frame(width: 34, height: 34)
                .foregroundStyle(destructive ? TBColor.warning : TBColor.textSecondary)
                .background(destructive ? TBColor.warningSoft : TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(TBFont.semibold(14))
                    .foregroundStyle(destructive ? TBColor.warning : TBColor.textPrimary)
                Text(detail)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textBody)
            }

            Spacer()
            LucideIcon(
                .chevronRight,
                size: TBIcon.Size.xSmall,
                strokeWidth: TBIcon.Stroke.regular
            )
                .foregroundStyle(TBColor.textHint)
        }
        .padding(12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#if canImport(PreviewsMacros)
    #Preview("App Shell") {
        AppShellView()
            .environmentObject(AppModel.preview(
                onboardingComplete: true,
                profile: .sample,
                diningEntries: [.sample],
                savedRestaurantIDs: Set(RestaurantCatalog.savedDefaults)
            ))
    }
#endif
