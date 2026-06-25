import PhotosUI
import SwiftUI
import UIKit

private enum ActiveStagedSheet: Identifiable {
    case app(AppSheet)
    case bookmark(RestaurantSummary)
    case dishOptions(DiningDishFeedbackItem)
    case infoSuggestion(restaurantName: String, infoRows: [RestaurantInfoRowModel])
    case menuSuggestion(restaurantName: String)

    var id: String {
        switch self {
        case .app(let sheet):
            sheet.id
        case .bookmark(let restaurant):
            "bookmark-\(restaurant.id)"
        case .dishOptions(let item):
            "dish-options-\(item.id)"
        case .infoSuggestion(let restaurantName, _):
            "info-suggestion-\(restaurantName)"
        case .menuSuggestion(let restaurantName):
            "menu-suggestion-\(restaurantName)"
        }
    }
}

struct AppShellView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var activeTab: MainTab
    @State private var routeStack: [AppRoute] = []
    @State private var routeSwipeTranslation: CGFloat = 0
    @State private var topAppBarBloomToken = 0
    @State private var activeSheet: AppSheet?
    @State private var activeBookmarkSheetRestaurant: RestaurantSummary?
    @State private var hasUnreadNotifications = true
    @State private var stagedSheetDragTranslation: CGFloat = 0
    @State private var isDraggingStagedSheet = false
    @State private var stagedSheetDragBaseline: CGFloat = 0
    @State private var stagedSheetDragWaitedForScroll = false
    @StateObject private var stagedSheetScrollCoordinator = BottomSheetScrollCoordinator()
    @State private var holdsStagedTopAppBarChrome = false
    @State private var bookmarkCoverIconID: BookmarkCoverIconID = .utensils
    @State private var bookmarkCoverTasteID: TasteAxis = .sweet
    @State private var isBookmarkCoverEditorOpen = false
    @State private var showsProfileEditDeleteConfirmation = false
    @State private var activeDishOptionsItem: DiningDishFeedbackItem?
    @State private var showsNewDiningFeedback = false
    @State private var newDiningFeedbackStartMode: DiningFeedbackStartMode = .cameraCapture
    @State private var activeDiningFeedbackEditEntry: DiningEntry?
    @State private var activeInfoSuggestionSheet: (restaurantName: String, infoRows: [RestaurantInfoRowModel])?
    @State private var activeMenuSuggestionSheetRestaurantName: String?
    private let onStagedSheetPresentationChange: ((Bool) -> Void)?
    private let diningContentState: DiningDishFeedbackContentState

    init(
        initialTab: MainTab = .home,
        initialRoute: AppRoute? = nil,
        onStagedSheetPresentationChange: ((Bool) -> Void)? = nil,
        diningContentState: DiningDishFeedbackContentState = .populated
    ) {
        _activeTab = State(initialValue: initialTab)
        _routeStack = State(initialValue: initialRoute.map { [$0] } ?? [])
        self.onStagedSheetPresentationChange = onStagedSheetPresentationChange
        self.diningContentState = diningContentState
    }

    var body: some View {
        GeometryReader { proxy in
            let screenBounds = UIScreen.main.bounds

            ZStack {
                ZStack {
                    TBColor.page
                    Color.black.opacity(stagedSheetProgress)
                }
                .ignoresSafeArea()
                .animation(
                    isDraggingStagedSheet ? nil : StagedBottomSheetBackgroundMetrics.animation,
                    value: stagedSheetProgress
                )

                shellContent
                    .modifier(
                        StagedBottomSheetBackground(
                            progress: stagedSheetProgress,
                            dimOpacity: BottomSheetShellMetrics.overlayOpacity * stagedSheetProgress,
                            animates: !isDraggingStagedSheet
                        )
                    )
                    .allowsHitTesting(activeStagedSheet == nil)

                if !currentRouteShowsContentUnderBottomSafeArea {
                    bottomSafeAreaBackground(safeAreaBottom: proxy.safeAreaInsets.bottom)
                        .zIndex(0.5)
                }

                statusBarBackground(safeAreaTop: proxy.safeAreaInsets.top)
                    .zIndex(2)

                if let activeStagedSheet {
                    stagedSheetView(for: activeStagedSheet)
                        .environment(\.bottomSheetScrollCoordinator, stagedSheetScrollCoordinator)
                        .frame(
                            width: proxy.size.width,
                            height: stagedSheetHeight,
                            alignment: .bottom
                        )
                        .position(
                            x: proxy.size.width / 2,
                            y: proxy.size.height
                                - stagedSheetHeight / 2
                                + proxy.safeAreaInsets.bottom
                                + stagedSheetDragTranslation
                        )
                        .simultaneousGesture(stagedSheetDragGesture)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .zIndex(1)
                }

                if activeStagedSheet != nil {
                    stagedSheetOutsideTapLayer(
                        sheetTop: proxy.size.height
                            - stagedSheetHeight
                            + proxy.safeAreaInsets.bottom
                            + stagedSheetDragTranslation
                    )
                    .zIndex(1.5)
                }

                if isBookmarkCoverEditorOpen {
                    BookmarkCoverEditorOverlay(
                        selectedCoverIconID: $bookmarkCoverIconID,
                        selectedCoverTasteID: $bookmarkCoverTasteID,
                        onDismiss: {
                            isBookmarkCoverEditorOpen = false
                        },
                        backdropOpacity: 0
                    )
                    .frame(width: screenBounds.width, height: screenBounds.height)
                    .position(
                        x: screenBounds.midX,
                        y: screenBounds.midY
                    )
                    .ignoresSafeArea()
                    .transition(.opacity)
                    .zIndex(10)
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
        .ignoresSafeArea(edges: .horizontal)
        .ignoresSafeArea(.container, edges: currentRouteShowsContentUnderBottomSafeArea ? .bottom : [])
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .overlay {
            if showsProfileEditDeleteConfirmation {
                profileEditDeleteConfirmationLayer
                    .ignoresSafeArea()
                    .transition(.opacity)
                    .zIndex(20)
            }
        }
        .animation(StagedBottomSheetBackgroundMetrics.animation, value: activeStagedSheet?.id)
        .animation(StagedBottomSheetBackgroundMetrics.animation, value: showsProfileEditDeleteConfirmation)
        .onChange(of: activeStagedSheet != nil) { _, isPresented in
            onStagedSheetPresentationChange?(isPresented)
        }
        .onChange(of: activeStagedSheet?.id) { _, _ in
            stagedSheetScrollCoordinator.reset()
            resetStagedSheetDragHandoff()
        }
        .onChange(of: routeStack) { _, _ in
            triggerTopAppBarBloom()
        }
        .onDisappear {
            onStagedSheetPresentationChange?(false)
        }
        .sheet(item: systemSheetBinding) { sheet in
            switch sheet {
            case .profileSummary:
                ProfileSummarySheet(
                    onDismissRequest: dismissActiveSheet,
                    openProfileEdit: {
                        activeSheet = .profileEdit
                    },
                    openAuthEntry: { intent in
                        activeSheet = .authEntry(intent)
                    }
                )
            case .profileEdit:
                EmptyView()
            case .globalSearch:
                EmptyView()
            case .notifications:
                EmptyView()
            case .quickRefinement:
                EmptyView()
            case .menu:
                AppMenuSheet(
                    onDismissRequest: dismissActiveSheet,
                    openProfile: { activeSheet = .profileSummary },
                    openNotifications: {
                        hasUnreadNotifications = false
                        activeSheet = .notifications
                    },
                    startQuickRefinement: { activeSheet = .quickRefinement },
                    openSavedList: { navigate(.savedRestaurants) }
                )
            case .bookmark(_):
                EmptyView()
            case .authEntry:
                EmptyView()
            }
        }
        .fullScreenCover(item: $activeDiningFeedbackEditEntry) { entry in
            DiningFeedbackSheet(entry: entry) { updatedEntry in
                appModel.updateDiningEntry(updatedEntry)
            }
        }
        .fullScreenCover(isPresented: $showsNewDiningFeedback) {
            DiningFeedbackSheet(startMode: newDiningFeedbackStartMode) { entry in
                appModel.addDiningEntry(entry)
            }
        }
    }

    private func statusBarBackground(safeAreaTop: CGFloat) -> some View {
        VStack(spacing: 0) {
            ZStack {
                currentTopChromeBackground
                Color.black.opacity(stagedSheetProgress)
            }
            .frame(height: safeAreaTop)
            Spacer(minLength: 0)
        }
        .ignoresSafeArea(edges: .top)
        .allowsHitTesting(false)
    }

    private func bottomSafeAreaBackground(safeAreaBottom: CGFloat) -> some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            ZStack {
                currentBottomChromeBackground
                Color.black.opacity(stagedSheetProgress)
            }
            .frame(height: safeAreaBottom)
        }
        .ignoresSafeArea(edges: .bottom)
        .allowsHitTesting(false)
    }

    private var currentTopChromeBackground: Color {
        if isGlobalSearchActive {
            return TBColor.page
        }

        if currentRouteUsesCommentFocus {
            return TBColor.focus
        }

        return TBColor.page
    }

    private var currentBottomChromeBackground: Color {
        if currentRouteUsesCommentFocus {
            return TBColor.focus
        }

        return TBColor.page
    }

    private var currentRouteShowsContentUnderBottomSafeArea: Bool {
        guard let activeRoute = routeStack.last else {
            return false
        }

        if case .restaurant = activeRoute {
            return true
        }

        if case .restaurantSummary = activeRoute {
            return true
        }

        return false
    }

    private var currentRouteUsesCommentFocus: Bool {
        guard let activeRoute = routeStack.last else {
            return false
        }

        switch activeRoute {
        case .dishFeedback, .comments:
            return true
        default:
            return false
        }
    }

    private var canSwipeBack: Bool {
        !routeStack.isEmpty
            && activeSheet == nil
            && activeBookmarkSheetRestaurant == nil
            && activeDishOptionsItem == nil
            && activeInfoSuggestionSheet == nil
            && activeMenuSuggestionSheetRestaurantName == nil
            && !isBookmarkCoverEditorOpen
            && !showsProfileEditDeleteConfirmation
    }

    @ViewBuilder
    private var shellContent: some View {
        if let activeRoute = routeStack.last {
            ZStack {
                if routeSwipeTranslation > 0 {
                    previousRouteLayer
                        .offset(x: previousRouteOffset)
                        .blur(radius: previousRouteBlurRadius)
                        .overlay {
                            Color.black
                                .opacity(previousRouteDimOpacity)
                                .allowsHitTesting(false)
                        }
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }

                routeLayer(
                    for: activeRoute,
                    includesSearch: true,
                    contentOffset: routeSwipeTranslation
                )
                    .id(activeRoute)
                    .edgeSwipeBack(
                        isEnabled: canSwipeBack,
                        movesContent: false,
                        onTranslationChange: { routeSwipeTranslation = $0 },
                        action: popRoute
                    )
                    .zIndex(1)
            }
            .clipped()
        } else {
            mainShellLayer
        }
    }

    @ViewBuilder
    private var previousRouteLayer: some View {
        if routeStack.count > 1 {
            routeLayer(for: routeStack[routeStack.count - 2], includesSearch: false)
        } else {
            mainShellLayer
        }
    }

    private func routeLayer(
        for route: AppRoute,
        includesSearch: Bool,
        contentOffset: CGFloat = 0
    ) -> some View {
        ZStack {
            AppRouteFocusContainer(
                route: route,
                contentOffset: contentOffset,
                topAppBarBloomToken: topAppBarBloomToken,
                onBack: popRoute,
                navigate: navigateImmediately,
                onOpenSearch: { activeSheet = .globalSearch },
                onOpenMenu: { activeSheet = .menu },
                onOpenBookmarkSheet: presentBookmarkSheet,
                onOpenInfoSuggestionSheet: presentInfoSuggestionSheet,
                onOpenMenuSuggestionSheet: presentMenuSuggestionSheet
            )
            .environmentObject(appModel)

            if includesSearch, isGlobalSearchActive {
                HomeSearchSheet(
                    placeholder: route.usesBuddySearchHeader ? "버디 검색" : "레스토랑, 메뉴, 셰프, 버디 검색",
                    scope: route.usesBuddySearchHeader ? .friendsOnly : .all,
                    onCloseRequest: dismissActiveSheet,
                    onOpenRoute: navigate,
                    onOpenBookmarkSheet: presentBookmarkSheet,
                    onStartDiningFeedback: startDiningFeedbackFromSearch
                )
                .transition(.opacity)
                .zIndex(1)
            }
        }
    }

    private var mainShellLayer: some View {
        VStack(spacing: 0) {
            TopAppBar(
                appearance: usesStagedTopAppBarChrome ? .solid : .default,
                solidBackground: .page,
                showSearchAction: activeTab != .home,
                profile: appModel.profile,
                hasUnreadNotifications: hasUnreadNotifications,
                bloomToken: topAppBarBloomToken,
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

            currentTabStack
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(TBColor.page)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            BottomTabBar(activeTab: $activeTab) {
                activeSheet = nil
                newDiningFeedbackStartMode = .cameraCapture
                showsNewDiningFeedback = true
            }
        }
    }

    private var routeSwipeProgress: CGFloat {
        EdgeSwipeBackMetrics.progress(
            translation: routeSwipeTranslation,
            containerWidth: UIScreen.main.bounds.width
        )
    }

    private var previousRouteOffset: CGFloat {
        -UIScreen.main.bounds.width
            * EdgeSwipeBackMetrics.previousScreenParallax
            * (1 - routeSwipeProgress)
    }

    private var previousRouteDimOpacity: CGFloat {
        EdgeSwipeBackMetrics.previousScreenDimOpacity * (1 - routeSwipeProgress)
    }

    private var previousRouteBlurRadius: CGFloat {
        EdgeSwipeBackMetrics.previousScreenBlurRadius * (1 - routeSwipeProgress)
    }

    @ViewBuilder
    private var currentTabStack: some View {
        ZStack {
            VStack(spacing: 0) {
                if activeTab == .home {
                    HomeSearchHeader {
                        activeSheet = .globalSearch
                    }
                }

                currentTabView
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            if isGlobalSearchActive {
                HomeSearchSheet(
                    onCloseRequest: dismissActiveSheet,
                    onOpenRoute: navigate,
                    onOpenBookmarkSheet: presentBookmarkSheet,
                    onStartDiningFeedback: startDiningFeedbackFromSearch
                )
                .transition(.opacity)
                .zIndex(1)
            }
        }
    }

    private var activeStagedSheet: ActiveStagedSheet? {
        if let activeInfoSuggestionSheet {
            return .infoSuggestion(
                restaurantName: activeInfoSuggestionSheet.restaurantName,
                infoRows: activeInfoSuggestionSheet.infoRows
            )
        }

        if let activeMenuSuggestionSheetRestaurantName {
            return .menuSuggestion(restaurantName: activeMenuSuggestionSheetRestaurantName)
        }

        if let activeBookmarkSheetRestaurant {
            return .bookmark(activeBookmarkSheetRestaurant)
        }

        if let activeDishOptionsItem {
            return .dishOptions(activeDishOptionsItem)
        }

        guard let activeSheet else {
            return nil
        }

        switch activeSheet {
        case .profileSummary, .profileEdit, .notifications, .quickRefinement, .menu, .authEntry:
            return .app(activeSheet)
        case .bookmark(let restaurant):
            return .bookmark(restaurant)
        case .globalSearch:
            return nil
        }
    }

    private var usesStagedTopAppBarChrome: Bool {
        activeStagedSheet != nil || holdsStagedTopAppBarChrome
    }

    private var isGlobalSearchActive: Bool {
        guard case .globalSearch? = activeSheet else {
            return false
        }

        return true
    }

    private var stagedSheetProgress: CGFloat {
        guard activeStagedSheet != nil else {
            return 0
        }

        return 1 - stagedSheetDragPercentage
    }

    private var stagedSheetDragPercentage: CGFloat {
        guard stagedSheetHeight > 0 else {
            return 0
        }

        return min(max(stagedSheetDragTranslation / stagedSheetHeight, 0), 1)
    }

    private var stagedSheetHeight: CGFloat {
        BottomSheetShellMetrics.stageHeight(
            screenHeight: UIScreen.main.bounds.height,
            safeAreaTop: keyWindowSafeAreaInsets.top
        )
    }

    private func stagedSheetOutsideTapLayer(sheetTop: CGFloat) -> some View {
        VStack(spacing: 0) {
            Color.clear
                .background(Color.black.opacity(0.001))
                .contentShape(Rectangle())
                .frame(height: max(sheetTop, 0))
                .onTapGesture(perform: dismissActiveSheet)

            Spacer(minLength: 0)
                .allowsHitTesting(false)
        }
        .ignoresSafeArea()
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    private var stagedSheetDragGesture: some Gesture {
        DragGesture(minimumDistance: StagedBottomSheetDragMetrics.minimumDistance)
            .onChanged { value in
                let verticalMovement = value.translation.height
                let horizontalMovement = abs(value.translation.width)
                guard verticalMovement > 0, verticalMovement >= horizontalMovement else {
                    return
                }

                guard stagedSheetScrollCoordinator.allowsSheetDrag else {
                    stagedSheetDragWaitedForScroll = true
                    return
                }

                if !isDraggingStagedSheet {
                    stagedSheetDragBaseline = stagedSheetDragWaitedForScroll ? verticalMovement : 0
                    isDraggingStagedSheet = true
                    stagedSheetScrollCoordinator.isSheetDragging = true
                }

                stagedSheetDragTranslation = max(verticalMovement - stagedSheetDragBaseline, 0)
            }
            .onEnded { value in
                guard isDraggingStagedSheet else {
                    resetStagedSheetDragHandoff()
                    return
                }

                let predictedTranslation = max(
                    value.translation.height - stagedSheetDragBaseline,
                    value.predictedEndTranslation.height - stagedSheetDragBaseline
                )
                let shouldDismiss = predictedTranslation >= stagedSheetHeight
                    * StagedBottomSheetDragMetrics.dismissProgressThreshold

                if shouldDismiss {
                    dismissStagedSheetFromDrag()
                } else {
                    withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
                        stagedSheetDragTranslation = 0
                        isDraggingStagedSheet = false
                        stagedSheetScrollCoordinator.isSheetDragging = false
                    }
                    resetStagedSheetDragHandoff()
                }
            }
    }

    private func resetStagedSheetDragHandoff() {
        stagedSheetDragBaseline = 0
        stagedSheetDragWaitedForScroll = false
        stagedSheetScrollCoordinator.isSheetDragging = false
    }

    private var keyWindowSafeAreaInsets: UIEdgeInsets {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets ?? .zero
    }

    private var systemSheetBinding: Binding<AppSheet?> {
        Binding(
            get: {
                activeStagedSheet == nil && !isGlobalSearchActive ? activeSheet : nil
            },
            set: { nextSheet in
                activeSheet = nextSheet
            }
        )
    }

    private var profileEditDeleteConfirmationLayer: some View {
        ZStack {
            Color.black
                .opacity(BottomSheetShellMetrics.overlayOpacity)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture {
                    showsProfileEditDeleteConfirmation = false
                }

            VStack(spacing: 16) {
                Text("계속 하시겠습니까? 이 사용자의 모든 데이터가 완전히 삭제됩니다.")
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)

                HStack(spacing: 8) {
                    Button {
                        showsProfileEditDeleteConfirmation = false
                    } label: {
                        Text("아니오")
                            .font(TBFont.semibold(13))
                            .foregroundStyle(TBColor.textTertiary)
                            .frame(maxWidth: .infinity)
                            .frame(height: ActionOverlayCardMetrics.actionHeight)
                            .background(Color.clear)
                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                                    .stroke(TBColor.borderStrong, lineWidth: 1)
                            }
                    }
                    .buttonStyle(.plain)

                    Button {
                        appModel.resetAll()
                        showsProfileEditDeleteConfirmation = false
                        dismissActiveSheet()
                    } label: {
                        Text("예")
                            .font(TBFont.semibold(13))
                            .foregroundStyle(TBColor.textInverse)
                            .frame(maxWidth: .infinity)
                            .frame(height: ActionOverlayCardMetrics.actionHeight)
                            .background(TBColor.destructive)
                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(ActionOverlayCardMetrics.stackPadding)
            .frame(maxWidth: ActionOverlayCardMetrics.cardMaxWidth)
            .background(TBColor.focus)
            .clipShape(RoundedRectangle(cornerRadius: ActionOverlayCardMetrics.cardRadius, style: .continuous))
            .shadow(color: Color.black.opacity(0.24), radius: 30, x: 0, y: 20)
            .padding(.horizontal, ActionOverlayCardMetrics.horizontalPadding)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private func stagedSheetView(for sheet: ActiveStagedSheet) -> some View {
        switch sheet {
        case .app(let appSheet):
            switch appSheet {
            case .profileSummary:
                ProfileSummarySheet(
                    onDismissRequest: dismissActiveSheet,
                    openProfileEdit: {
                        activeSheet = .profileEdit
                    },
                    openAuthEntry: { intent in
                        activeSheet = .authEntry(intent)
                    }
                )
            case .profileEdit:
                ProfileEditSheet(
                    showsDeleteConfirmation: $showsProfileEditDeleteConfirmation,
                    onBackToProfile: {
                        activeSheet = .profileSummary
                    },
                    onDismissRequest: dismissActiveSheet
                )
            case .menu:
                AppMenuSheet(
                    onDismissRequest: dismissActiveSheet,
                    openProfile: { activeSheet = .profileSummary },
                    openNotifications: {
                        hasUnreadNotifications = false
                        activeSheet = .notifications
                    },
                    startQuickRefinement: { activeSheet = .quickRefinement },
                    openSavedList: { navigate(.savedRestaurants) }
                )
            case .notifications:
                NotificationsSheet(
                    onDismissRequest: dismissActiveSheet,
                    usesNativeSheetChrome: false
                )
            case .quickRefinement:
                QuickRefinementSheet(
                    onDismissRequest: dismissActiveSheet,
                    usesNativeSheetChrome: false
                )
            case .authEntry(let intent):
                AuthEntrySheet(
                    intent: intent,
                    usesNativeSheetChrome: false,
                    onDismissRequest: dismissActiveSheet,
                    onLinkedCurrentProfile: {
                        activeSheet = .profileSummary
                    }
                )
            case .bookmark(let restaurant):
                RestaurantBookmarkNativeSheet(
                    restaurant: restaurant,
                    onDismissRequest: dismissBookmarkSheet,
                    usesNativeSheetChrome: false,
                    selectedCoverIconID: $bookmarkCoverIconID,
                    selectedCoverTasteID: $bookmarkCoverTasteID,
                    isCoverEditorOpen: $isBookmarkCoverEditorOpen,
                    hostsCoverEditorOverlay: false
                )
            case .globalSearch:
                EmptyView()
            }
        case .bookmark(let restaurant):
            RestaurantBookmarkNativeSheet(
                restaurant: restaurant,
                onDismissRequest: dismissBookmarkSheet,
                usesNativeSheetChrome: false,
                selectedCoverIconID: $bookmarkCoverIconID,
                selectedCoverTasteID: $bookmarkCoverTasteID,
                isCoverEditorOpen: $isBookmarkCoverEditorOpen,
                hostsCoverEditorOverlay: false
            )
        case .dishOptions(let item):
            DishActionSheet(
                item: item,
                editableEntry: diningEntry(for: item),
                onClose: dismissDishOptionsSheet,
                onShowDetail: {
                    openDishCommentsFromOptions(item)
                },
                onEdit: { entry in
                    openDiningFeedbackEditorFromOptions(entry)
                },
                onDelete: { entryId in
                    appModel.removeDiningEntry(id: entryId)
                    dismissDishOptionsSheet()
                }
            )
        case .infoSuggestion(let restaurantName, let infoRows):
            RestaurantInfoSuggestionNativeSheet(
                restaurantName: restaurantName,
                infoRows: infoRows,
                onDismissRequest: dismissInfoSuggestionSheet,
                usesNativeSheetChrome: false
            )
        case .menuSuggestion(let restaurantName):
            RestaurantMenuSuggestionNativeSheet(
                restaurantName: restaurantName,
                onDismissRequest: dismissMenuSuggestionSheet,
                usesNativeSheetChrome: false
            )
        }
    }

    private func dismissActiveSheet() {
        holdStagedTopAppBarChromeDuringDismissal()

        withAnimation(.easeInOut(duration: 0.2)) {
            activeSheet = nil
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            isBookmarkCoverEditorOpen = false
            showsProfileEditDeleteConfirmation = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func dismissBookmarkSheet() {
        holdStagedTopAppBarChromeDuringDismissal()

        withAnimation(.easeInOut(duration: 0.2)) {
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            isBookmarkCoverEditorOpen = false
            showsProfileEditDeleteConfirmation = false
            if case .some(.bookmark(_)) = activeSheet {
                activeSheet = nil
            }
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func dismissStagedSheetFromDrag() {
        holdStagedTopAppBarChromeDuringDismissal()

        withAnimation(.easeInOut(duration: 0.2)) {
            stagedSheetDragTranslation = stagedSheetHeight
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            isBookmarkCoverEditorOpen = false
            showsProfileEditDeleteConfirmation = false
            if case .some(.bookmark(_)) = activeSheet {
                activeSheet = nil
            } else if activeStagedSheet != nil {
                activeSheet = nil
            }
            isDraggingStagedSheet = false
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
            guard activeStagedSheet == nil else {
                return
            }

            stagedSheetDragTranslation = 0
        }
    }

    private func navigate(_ route: AppRoute) {
        let isDismissingSheet = activeSheet != nil
            || activeBookmarkSheetRestaurant != nil
            || activeDishOptionsItem != nil
            || activeInfoSuggestionSheet != nil
            || activeMenuSuggestionSheetRestaurantName != nil
        if isDismissingSheet {
            holdStagedTopAppBarChromeDuringDismissal()
        }
        activeSheet = nil
        activeBookmarkSheetRestaurant = nil
        activeDishOptionsItem = nil
        activeInfoSuggestionSheet = nil
        activeMenuSuggestionSheetRestaurantName = nil
        isBookmarkCoverEditorOpen = false
        stagedSheetDragTranslation = 0
        isDraggingStagedSheet = false

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
        var transaction = Transaction(animation: nil)
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            routeSwipeTranslation = 0
            _ = routeStack.popLast()
        }
    }

    private func presentBookmarkSheet(_ restaurant: RestaurantSummary) {
        withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
            activeBookmarkSheetRestaurant = restaurant
            activeDishOptionsItem = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            bookmarkCoverIconID = .utensils
            bookmarkCoverTasteID = .sweet
            isBookmarkCoverEditorOpen = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func startDiningFeedbackFromSearch(_: HomeSearchResultItem) {
        activeSheet = nil
        activeBookmarkSheetRestaurant = nil
        activeDishOptionsItem = nil
        activeInfoSuggestionSheet = nil
        activeMenuSuggestionSheetRestaurantName = nil
        isBookmarkCoverEditorOpen = false
        stagedSheetDragTranslation = 0
        isDraggingStagedSheet = false
        newDiningFeedbackStartMode = .menu
        showsNewDiningFeedback = true
    }

    private func presentDishOptionsSheet(_ item: DiningDishFeedbackItem) {
        withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
            activeDishOptionsItem = item
            activeBookmarkSheetRestaurant = nil
            activeInfoSuggestionSheet = nil
            activeMenuSuggestionSheetRestaurantName = nil
            activeSheet = nil
            isBookmarkCoverEditorOpen = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func presentInfoSuggestionSheet(restaurantName: String, infoRows: [RestaurantInfoRowModel]) {
        withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
            activeInfoSuggestionSheet = (restaurantName: restaurantName, infoRows: infoRows)
            activeMenuSuggestionSheetRestaurantName = nil
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeSheet = nil
            isBookmarkCoverEditorOpen = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func dismissDishOptionsSheet() {
        holdStagedTopAppBarChromeDuringDismissal()

        withAnimation(.easeInOut(duration: 0.2)) {
            activeDishOptionsItem = nil
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func presentMenuSuggestionSheet(restaurantName: String) {
        withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
            activeMenuSuggestionSheetRestaurantName = restaurantName
            activeInfoSuggestionSheet = nil
            activeBookmarkSheetRestaurant = nil
            activeDishOptionsItem = nil
            activeSheet = nil
            isBookmarkCoverEditorOpen = false
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func openDishCommentsFromOptions(_ item: DiningDishFeedbackItem) {
        dismissDishOptionsSheet()

        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(250))
            navigateImmediately(.comments(id: item.id))
        }
    }

    private func openDiningFeedbackEditorFromOptions(_ entry: DiningEntry) {
        dismissDishOptionsSheet()

        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(250))
            activeDiningFeedbackEditEntry = entry
        }
    }

    private func diningEntry(for item: DiningDishFeedbackItem) -> DiningEntry? {
        guard let id = UUID(uuidString: item.id) else {
            return nil
        }

        return appModel.diningEntries.first { $0.id == id }
    }

    private func dismissInfoSuggestionSheet() {
        holdStagedTopAppBarChromeDuringDismissal()

        withAnimation(.easeInOut(duration: 0.2)) {
            activeInfoSuggestionSheet = nil
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func dismissMenuSuggestionSheet() {
        holdStagedTopAppBarChromeDuringDismissal()

        withAnimation(.easeInOut(duration: 0.2)) {
            activeMenuSuggestionSheetRestaurantName = nil
            stagedSheetDragTranslation = 0
            isDraggingStagedSheet = false
        }
    }

    private func holdStagedTopAppBarChromeDuringDismissal() {
        guard activeStagedSheet != nil else {
            return
        }

        holdsStagedTopAppBarChrome = true

        DispatchQueue.main.asyncAfter(
            deadline: .now() + StagedBottomSheetBackgroundMetrics.animationDuration
        ) {
            guard activeStagedSheet == nil else {
                return
            }

            holdsStagedTopAppBarChrome = false
        }
    }

    private func triggerTopAppBarBloom() {
        topAppBarBloomToken += 1
    }

    @ViewBuilder
    private var currentTabView: some View {
        switch activeTab {
        case .home:
            HomeView(
                showsSearchTrigger: false,
                onOpenSearch: { activeSheet = .globalSearch },
                onOpenRoute: navigate,
                onOpenBookmarkSheet: presentBookmarkSheet,
                onStartDiningFeedback: startDiningFeedbackFromSearch
            )
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
            DiningView(
                contentState: diningContentState,
                onOpenDishOptions: presentDishOptionsSheet
            )
        case .profile:
            ProfileView(
                onOpenConnection: { kind in navigateImmediately(.connectionList(kind)) },
                onFindBuddy: { activeSheet = .globalSearch },
                onOpenProfileSettings: { activeSheet = .profileSummary },
                onOpenSavedList: { navigateImmediately(.savedRestaurants) }
            )
        }
    }
}

enum HomeSearchHeaderMetrics {
    static let horizontalPadding: CGFloat = TBSpacing.page
    static let topPadding: CGFloat = TBSpacing.pageTop
    static let bottomPadding: CGFloat = TBSpacing.x8
}

private struct HomeSearchHeader: View {
    var placeholder = "레스토랑, 메뉴, 셰프, 버디 검색"
    var accessibilityLabel = "레스토랑, 메뉴, 셰프, 버디 검색"
    let action: () -> Void

    var body: some View {
        HomeSearchCard(
            placeholder: placeholder,
            accessibilityLabel: accessibilityLabel,
            action: action
        )
            .padding(.horizontal, HomeSearchHeaderMetrics.horizontalPadding)
            .padding(.top, HomeSearchHeaderMetrics.topPadding)
            .padding(.bottom, HomeSearchHeaderMetrics.bottomPadding)
            .background(TBColor.page)
    }
}

private struct AppRouteFocusContainer: View {
    let route: AppRoute
    var contentOffset: CGFloat = 0
    var topAppBarBloomToken = 0
    let onBack: () -> Void
    let navigate: (AppRoute) -> Void
    let onOpenSearch: () -> Void
    let onOpenMenu: () -> Void
    let onOpenBookmarkSheet: (RestaurantSummary) -> Void
    let onOpenInfoSuggestionSheet: (String, [RestaurantInfoRowModel]) -> Void
    let onOpenMenuSuggestionSheet: (String) -> Void

    var body: some View {
        VStack(spacing: 0) {
            TopAppBar(
                appearance: .solid,
                solidBackground: topAppBarBackground,
                title: topAppBarTitle,
                centerContentOffset: contentOffset,
                showBack: true,
                showsDefaultActions: showsDefaultActions,
                bloomToken: topAppBarBloomToken,
                rightActions: routeActions,
                onBack: onBack
            )

            VStack(spacing: 0) {
                if route.usesBuddySearchHeader {
                    HomeSearchHeader(
                        placeholder: "버디 검색",
                        accessibilityLabel: "버디 검색",
                        action: onOpenSearch
                    )
                }

                AppRouteDestinationView(
                    route: route,
                    navigate: navigate,
                    onBack: onBack,
                    onOpenBookmarkSheet: onOpenBookmarkSheet,
                    onOpenInfoSuggestionSheet: onOpenInfoSuggestionSheet,
                    onOpenMenuSuggestionSheet: onOpenMenuSuggestionSheet
                )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .background(routeBackground)
            .offset(x: contentOffset)
        }
        .ignoresSafeArea(.container, edges: showsContentUnderBottomSafeArea ? .bottom : [])
    }

    private var topAppBarTitle: String? {
        isCommentsRoute ? nil : route.title
    }

    private var topAppBarBackground: TopAppBarSolidBackground {
        isCommentsRoute ? .focus : .page
    }

    private var routeBackground: Color {
        isCommentsRoute ? TBColor.focus : TBColor.page
    }

    private var showsContentUnderBottomSafeArea: Bool {
        if case .restaurant = route {
            return true
        }

        if case .restaurantSummary = route {
            return true
        }

        return false
    }

    private var showsDefaultActions: Bool {
        route.showsTopAppBarDefaultActions
    }

    private var isCommentsRoute: Bool {
        switch route {
        case .dishFeedback, .comments:
            return true
        default:
            return false
        }
    }

    private var routeActions: [TopAppBarAction] {
        switch route {
        case .restaurant, .restaurantSummary:
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
        case .publicProfile:
            return [
                TopAppBarAction(
                    id: "menu",
                    symbol: "line.3.horizontal",
                    accessibilityLabel: "메뉴 열기",
                    action: onOpenMenu
                )
            ]
        default:
            return []
        }
    }
}

private extension AppRoute {
    var showsTopAppBarDefaultActions: Bool {
        switch self {
        case .dishFeedback, .comments, .savedRestaurants, .connectionList, .publicProfile:
            return false
        default:
            return true
        }
    }

    var usesBuddySearchHeader: Bool {
        if case .connectionList = self {
            return true
        }

        return false
    }
}

private struct ProfileSummarySheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let onDismissRequest: (() -> Void)?
    let openProfileEdit: () -> Void
    let openAuthEntry: (BackendAuthEmailIntent) -> Void

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: close)),
            headerCenter: AnyView(
                Text("프로필")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let profile = appModel.profile {
                        Button(action: openProfileEdit) {
                            SectionCard(showsBorder: false) {
                                VStack(alignment: .leading, spacing: 20) {
                                    HStack(spacing: 14) {
                                        ProfileAvatarDisplay(
                                            imageData: appModel.profileAvatarImageData,
                                            size: 64,
                                            tasteProfile: profile,
                                            shapeSeed: "current-user"
                                        )
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(appModel.profileIdentity.displayName)
                                                .font(TBFont.bold(18))
                                                .foregroundStyle(TBColor.textPrimary)
                                            Text(appModel.profileIdentity.displayNickname)
                                                .font(TBFont.semibold(13))
                                                .foregroundStyle(TBColor.textHint)
                                        }
                                    }

                                    HStack {
                                        Text(profileSummaryLabel(identity: appModel.profileIdentity))
                                            .font(TBFont.semibold(12))
                                            .foregroundStyle(profile.strongestAxis.darkColor)
                                        Spacer()
                                        LucideIcon(
                                            .chevronRight,
                                            size: TBIcon.Size.small,
                                            strokeWidth: TBIcon.Stroke.regular
                                        )
                                            .foregroundStyle(profile.strongestAxis.darkColor)
                                    }
                                    .padding(12)
                                    .background(profile.strongestAxis.tintColor)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("프로필 편집")

                        SectionCard(showsBorder: false) {
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
                                    .foregroundStyle(profile.strongestAxis.darkColor)
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
                .padding(.bottom, 24)
            }
        }
    }

    private func profileSummaryLabel(identity: UserProfileIdentity) -> String {
        let hasContext = identity.birthDate != nil
            || identity.sexContext != nil
            || identity.smokingStatus != nil
        let infoLabel = hasContext ? "기준 정보 입력" : "기준 정보 미입력"
        let dietaryLabel = identity.dietaryRestrictions.isEmpty
            ? "식이제한 없음"
            : "식이제한 \(identity.dietaryRestrictions.count)개"
        return "\(infoLabel) · \(dietaryLabel)"
    }

    private func close() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private struct ProfileAvatarDisplay: View {
    let imageData: Data?
    let size: CGFloat
    let tasteProfile: TasteProfile
    let shapeSeed: String

    var body: some View {
        Group {
            if let imageData,
               let image = UIImage(data: imageData) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: size, height: size)
                    .clipShape(Circle())
                    .overlay {
                        Circle().stroke(TBColor.borderAvatarSoft, lineWidth: 1)
                    }
            } else {
                PalateBloomAvatar(
                    size: size,
                    tasteProfile: tasteProfile,
                    shapeSeed: shapeSeed
                )
            }
        }
    }
}

private struct ProfileEditSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @Binding var showsDeleteConfirmation: Bool
    let onBackToProfile: () -> Void
    let onDismissRequest: (() -> Void)?

    @State private var draftIdentity = UserProfileIdentity.default
    @State private var draftAvatarImageData: Data?
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var activePicker: ProfileEditPicker?
    @State private var birthDateSelection = Date()
    @State private var isPreparingAvatar = false
    @State private var statusMessage: String?

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(
                BottomSheetIconButton(
                    ariaLabel: "프로필로 돌아가기",
                    icon: .chevronLeft,
                    action: onBackToProfile
                )
            ),
            headerCenter: AnyView(
                Text("프로필 편집")
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            headerEnd: AnyView(BottomSheetCloseButton(action: close)),
            footer: AnyView(footer),
            floatingLayer: floatingLayer,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                if let profile = appModel.profile {
                    VStack(alignment: .leading, spacing: 20) {
                        avatarSection(profile: profile)
                        informationSection
                    }
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.top, 8)
                    .padding(.bottom, 12)
                } else {
                    VStack(spacing: 10) {
                        Text("편집할 미각 프로필이 아직 없어요")
                            .font(TBFont.bold(15))
                            .foregroundStyle(TBColor.textPrimary)
                        Text("먼저 미각 기준을 만들면 프로필 정보를 함께 다듬을 수 있어요.")
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textMuted)
                            .multilineTextAlignment(.center)
                            .lineSpacing(3)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(TBSpacing.page)
                }
            }
        }
        .onAppear(perform: resetDrafts)
        .onChange(of: selectedPhotoItem) { _, item in
            Task {
                await loadSelectedPhoto(item)
            }
        }
    }

    private func avatarSection(profile: TasteProfile) -> some View {
        VStack(alignment: .center, spacing: 12) {
            ProfileAvatarDisplay(
                imageData: draftAvatarImageData,
                size: 96,
                tasteProfile: profile,
                shapeSeed: "current-user"
            )

            HStack(spacing: 12) {
                PhotosPicker(
                    selection: $selectedPhotoItem,
                    matching: .images
                ) {
                    HStack(spacing: 8) {
                        LucideIcon(
                            .camera,
                            size: TBIcon.Size.small,
                            strokeWidth: TBIcon.Stroke.medium
                        )
                        Text(isPreparingAvatar ? "사진 준비 중" : "사진 편집")
                            .font(TBFont.semibold(12))
                    }
                    .foregroundStyle(isPreparingAvatar ? TBColor.textDisabled : profile.strongestAxis.darkColor)
                    .padding(.horizontal, 12)
                    .frame(height: 40)
                    .background(isPreparingAvatar ? TBColor.disabledSurface : profile.strongestAxis.tintColor)
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(isPreparingAvatar)

                if draftAvatarImageData != nil {
                    Button("삭제") {
                        draftAvatarImageData = nil
                        statusMessage = "프로필 사진을 삭제하려면 저장을 눌러 주세요."
                    }
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textFaint)
                    .buttonStyle(.plain)
                }
            }

            Button {
                draftAvatarImageData = nil
                statusMessage = "저장을 누르면 현재 미각 기준 아바타로 변경됩니다."
            } label: {
                Text("현재 미각 기준으로 아바타 변경")
                    .font(TBFont.semibold(12))
                    .foregroundStyle(appModel.profile == nil || isPreparingAvatar ? TBColor.textDisabled : TBColor.textFaint)
            }
            .buttonStyle(.plain)
            .disabled(appModel.profile == nil || isPreparingAvatar)

            if let statusMessage {
                Text(statusMessage)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textMuted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var informationSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            ProfileEditTextField(
                label: "이름",
                placeholder: "이름을 입력해 주세요",
                text: $draftIdentity.displayName
            )

            ProfileEditTextField(
                label: "버디네임",
                placeholder: "Taste Buddy에서 사용할 이름",
                helperText: "친구가 나를 찾는 고유 버디네임입니다.",
                text: $draftIdentity.nickname
            )

            ProfileEditSelectField(
                label: "생년월일",
                value: ProfileEditCopy.birthDateLabel(draftIdentity.birthDate)
            ) {
                birthDateSelection = ProfileEditCopy.date(from: draftIdentity.birthDate)
                activePicker = .birthDate
            }

            ProfileEditSelectField(
                label: "성별",
                value: ProfileEditCopy.optionLabel(
                    draftIdentity.sexContext,
                    options: ProfileEditCopy.sexOptions
                )
            ) {
                activePicker = .sexContext
            }

            ProfileEditSelectField(
                label: "흡연유무",
                value: ProfileEditCopy.optionLabel(
                    draftIdentity.smokingStatus,
                    options: ProfileEditCopy.smokingOptions
                )
            ) {
                activePicker = .smokingStatus
            }

            ProfileEditSelectField(
                label: "식이제한",
                value: ProfileEditCopy.dietarySummary(draftIdentity.dietaryRestrictions)
            ) {
                activePicker = .dietaryRestrictions
            }
        }
    }

    private var footer: some View {
        VStack(spacing: 8) {
            ProfileEditFooterButton(
                title: "내 계정 삭제하기",
                tone: .destructive,
                isEnabled: !isPreparingAvatar
            ) {
                showsDeleteConfirmation = true
            }

            ProfileEditFooterButton(
                title: isPreparingAvatar ? "사진 준비 중" : "저장",
                tone: .primary,
                isEnabled: !isPreparingAvatar
            ) {
                saveProfileEdit()
            }
        }
    }

    private var floatingLayer: AnyView? {
        if let activePicker {
            return AnyView(
                ProfileEditPickerOverlay(
                    activePicker: activePicker,
                    identity: $draftIdentity,
                    birthDateSelection: $birthDateSelection,
                    onClose: {
                        self.activePicker = nil
                    }
                )
            )
        }

        return nil
    }

    private func resetDrafts() {
        draftIdentity = appModel.profileIdentity
        draftAvatarImageData = appModel.profileAvatarImageData
        birthDateSelection = ProfileEditCopy.date(from: appModel.profileIdentity.birthDate)
        statusMessage = nil
        selectedPhotoItem = nil
        activePicker = nil
        showsDeleteConfirmation = false
    }

    private func saveProfileEdit() {
        appModel.saveProfileIdentity(draftIdentity)
        appModel.saveProfileAvatarImageData(draftAvatarImageData)
        statusMessage = nil
        onBackToProfile()
    }

    private func loadSelectedPhoto(_ item: PhotosPickerItem?) async {
        guard let item else {
            return
        }

        isPreparingAvatar = true
        defer {
            isPreparingAvatar = false
            selectedPhotoItem = nil
        }

        do {
            guard let data = try await item.loadTransferable(type: Data.self),
                  UIImage(data: data) != nil else {
                statusMessage = "프로필 사진을 준비하지 못했습니다. 다른 이미지를 선택해 주세요."
                return
            }

            draftAvatarImageData = data
            statusMessage = "저장을 누르면 새 프로필 사진이 적용됩니다."
        } catch {
            statusMessage = "프로필 사진을 준비하지 못했습니다. 다른 이미지를 선택해 주세요."
        }
    }

    private func close() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private enum ProfileEditPicker {
    case birthDate
    case sexContext
    case smokingStatus
    case dietaryRestrictions

    var title: String {
        switch self {
        case .birthDate:
            "생년월일"
        case .sexContext:
            "성별"
        case .smokingStatus:
            "흡연유무"
        case .dietaryRestrictions:
            "식이제한"
        }
    }
}

private struct ProfileEditOption: Identifiable, Equatable {
    let id: String
    let label: String
}

private enum ProfileEditCopy {
    static let sexOptions: [ProfileEditOption] = [
        ProfileEditOption(id: "female", label: "여성"),
        ProfileEditOption(id: "male", label: "남성"),
        ProfileEditOption(id: "other_or_not_listed", label: "기타 / 직접 응답하지 않음"),
        ProfileEditOption(id: "prefer_not_to_say", label: "답변하지 않음")
    ]

    static let smokingOptions: [ProfileEditOption] = [
        ProfileEditOption(id: "never", label: "비흡연"),
        ProfileEditOption(id: "former", label: "과거 흡연"),
        ProfileEditOption(id: "current", label: "현재 흡연"),
        ProfileEditOption(id: "prefer_not_to_say", label: "답변하지 않음")
    ]

    static let dietaryNoneOptionID = "dietary-restrictions-none"
    static let dietaryOptions: [ProfileEditOption] = [
        ProfileEditOption(id: dietaryNoneOptionID, label: "없어요"),
        ProfileEditOption(id: "vegetarian-forward", label: "채식 위주"),
        ProfileEditOption(id: "vegan", label: "비건"),
        ProfileEditOption(id: "pescatarian", label: "페스코"),
        ProfileEditOption(id: "no-pork", label: "돼지고기 제외"),
        ProfileEditOption(id: "no-beef", label: "소고기 제외"),
        ProfileEditOption(id: "gluten-conscious", label: "글루텐 프리 지향"),
        ProfileEditOption(id: "halal-oriented", label: "할랄 지향")
    ]

    static func optionLabel(_ value: String?, options: [ProfileEditOption]) -> String {
        guard let value else {
            return "선택해 주세요"
        }

        return options.first { $0.id == value }?.label ?? "선택해 주세요"
    }

    static func dietarySummary(_ values: [String]) -> String {
        guard !values.isEmpty else {
            return "식이제한 없음"
        }

        let labels = values.compactMap { value in
            dietaryOptions.first { $0.id == value }?.label
        }

        guard !labels.isEmpty else {
            return "식이제한 없음"
        }

        if labels.count == 1 {
            return labels[0]
        }

        return "\(labels[0]) 외 \(labels.count - 1)"
    }

    static func birthDateLabel(_ value: String?) -> String {
        guard let value,
              let components = dateComponents(from: value) else {
            return "선택해 주세요"
        }

        return "\(components.year)년 \(components.month)월 \(components.day)일"
    }

    static func date(from value: String?) -> Date {
        guard let value,
              let components = dateComponents(from: value),
              let date = Calendar.current.date(
                from: DateComponents(
                    year: components.year,
                    month: components.month,
                    day: components.day
                )
              ) else {
            return Calendar.current.date(
                from: DateComponents(year: 1995, month: 1, day: 1)
            ) ?? Date()
        }

        return date
    }

    static func birthDateString(from date: Date) -> String {
        let components = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(
            format: "%04d-%02d-%02d",
            components.year ?? 1995,
            components.month ?? 1,
            components.day ?? 1
        )
    }

    private static func dateComponents(from value: String) -> (year: Int, month: Int, day: Int)? {
        let parts = value.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else {
            return nil
        }

        return (parts[0], parts[1], parts[2])
    }
}

private struct ProfileEditTextField: View {
    let label: String
    let placeholder: String
    var helperText: String?
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textMuted)

            TextField(placeholder, text: $text)
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textPrimary)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .frame(height: 48)
                .padding(.horizontal, 12)
                .background(TBColor.surface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                        .stroke(TBColor.border, lineWidth: 1)
                }

            if let helperText {
                Text(helperText)
                    .font(TBFont.regular(11))
                    .foregroundStyle(TBColor.textFaint)
                    .lineSpacing(3)
            }
        }
    }
}

private struct ProfileEditSelectField: View {
    let label: String
    let value: String
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textMuted)

            Button(action: action) {
                HStack(spacing: 12) {
                    Text(value)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(
                            value == "선택해 주세요" ? TBColor.textHint : TBColor.textPrimary
                        )
                        .lineLimit(1)

                    Spacer()

                    LucideIcon(
                        .chevronDown,
                        size: TBIcon.Size.small,
                        strokeWidth: TBIcon.Stroke.strong
                    )
                    .foregroundStyle(TBColor.iconPrimary)
                }
                .frame(height: 48)
                .padding(.horizontal, 12)
                .background(TBColor.surface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                        .stroke(TBColor.border, lineWidth: 1)
                }
            }
            .buttonStyle(.plain)
        }
    }
}

private enum ProfileEditFooterButtonTone {
    case primary
    case destructive
}

private struct ProfileEditFooterButton: View {
    let title: String
    let tone: ProfileEditFooterButtonTone
    var isEnabled = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.bold(14))
                .foregroundStyle(foreground)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(background)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
    }

    private var foreground: Color {
        guard isEnabled else {
            return TBColor.textDisabled
        }

        switch tone {
        case .primary:
            return TBColor.textInverse
        case .destructive:
            return TBColor.textInverse
        }
    }

    private var background: Color {
        guard isEnabled else {
            return TBColor.disabledSurface
        }

        switch tone {
        case .primary:
            return TBColor.textPrimary
        case .destructive:
            return TBColor.destructive
        }
    }
}

private struct ProfileEditPickerOverlay: View {
    let activePicker: ProfileEditPicker
    @Binding var identity: UserProfileIdentity
    @Binding var birthDateSelection: Date
    let onClose: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black
                .opacity(0.45)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture(perform: onClose)

            VStack(spacing: 0) {
                HStack {
                    Spacer()
                    Text(activePicker.title)
                        .font(TBFont.bold(16))
                        .foregroundStyle(TBColor.textPrimary)
                    Spacer()
                    Button(action: onClose) {
                        LucideIcon(
                            .x,
                            size: TBIcon.Size.medium,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        .frame(width: 36, height: 36)
                        .foregroundStyle(TBColor.iconPrimary)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.bottom, 12)

                pickerContent
            }
            .padding(20)
            .background(TBColor.focus)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: Color.black.opacity(0.20), radius: 28, x: 0, y: 16)
            .padding(.horizontal, TBSpacing.page)
            .padding(.bottom, TBSpacing.page)
        }
    }

    @ViewBuilder
    private var pickerContent: some View {
        switch activePicker {
        case .birthDate:
            VStack(spacing: 16) {
                DatePicker(
                    "생년월일",
                    selection: $birthDateSelection,
                    in: dateRange,
                    displayedComponents: .date
                )
                .datePickerStyle(.wheel)
                .labelsHidden()

                PrimaryButton(title: "적용") {
                    identity.birthDate = ProfileEditCopy.birthDateString(from: birthDateSelection)
                    onClose()
                }
            }

        case .sexContext:
            radioOptions(
                options: ProfileEditCopy.sexOptions,
                selectedValue: identity.sexContext,
                onSelect: { selectedValue in
                    identity.sexContext = selectedValue
                }
            )

        case .smokingStatus:
            radioOptions(
                options: ProfileEditCopy.smokingOptions,
                selectedValue: identity.smokingStatus,
                onSelect: { selectedValue in
                    identity.smokingStatus = selectedValue
                }
            )

        case .dietaryRestrictions:
            VStack(spacing: 12) {
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(ProfileEditCopy.dietaryOptions) { option in
                            let isNoneOption = option.id == ProfileEditCopy.dietaryNoneOptionID
                            let isSelected = isNoneOption
                                ? identity.dietaryRestrictions.isEmpty
                                : identity.dietaryRestrictions.contains(option.id)

                            TBSelectionCard(
                                title: option.label,
                                indicator: .checkbox,
                                isSelected: isSelected,
                                singleLine: true
                            ) {
                                toggleDietaryOption(option.id)
                            }
                        }
                    }
                }
                .frame(maxHeight: 320)

                PrimaryButton(title: "선택 완료") {
                    onClose()
                }
            }
        }
    }

    private var dateRange: ClosedRange<Date> {
        let calendar = Calendar.current
        let start = calendar.date(from: DateComponents(year: 1940, month: 1, day: 1)) ?? Date()
        let end = calendar.date(byAdding: .year, value: -12, to: Date()) ?? Date()
        return start...end
    }

    private func radioOptions(
        options: [ProfileEditOption],
        selectedValue: String?,
        onSelect: @escaping (String?) -> Void
    ) -> some View {
        VStack(spacing: 8) {
            ForEach(options) { option in
                let isSelected = selectedValue == option.id
                TBSelectionCard(
                    title: option.label,
                    indicator: .radio,
                    isSelected: isSelected,
                    singleLine: true
                ) {
                    onSelect(isSelected ? nil : option.id)
                }
            }
        }
    }

    private func toggleDietaryOption(_ optionID: String) {
        if optionID == ProfileEditCopy.dietaryNoneOptionID {
            identity.dietaryRestrictions = []
            return
        }

        if identity.dietaryRestrictions.contains(optionID) {
            identity.dietaryRestrictions.removeAll { $0 == optionID }
        } else {
            identity.dietaryRestrictions.append(optionID)
        }
    }
}

private struct NotificationsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appModel: AppModel
    @State private var showsDiningFeedback = false
    @State private var hasUnread = true
    var onDismissRequest: (() -> Void)? = nil
    var usesNativeSheetChrome = true

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: closeSheet)),
            headerCenter: AnyView(
                HStack(spacing: 7) {
                    Text("알림")
                        .font(TBFont.bold(15))
                        .foregroundStyle(TBColor.textPrimary)
                    if hasUnread {
                        Text("2")
                            .font(TBFont.bold(10))
                            .foregroundStyle(TBColor.textInverse)
                            .frame(minWidth: 16, minHeight: 16)
                            .background(TBColor.textPrimary)
                            .clipShape(Capsule())
                    }
                }
            ),
            headerEnd: AnyView(
                Group {
                    if hasUnread {
                        Button {
                            hasUnread = false
                        } label: {
                            Text("모두 읽기")
                                .font(TBFont.semibold(11))
                                .lineLimit(1)
                                .fixedSize(horizontal: true, vertical: false)
                        }
                        .foregroundStyle(TBColor.textMuted)
                    }
                }
            ),
            usesNativeSheetChrome: usesNativeSheetChrome,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(spacing: 8) {
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
                .padding(.horizontal, TBSpacing.page)
                .padding(.top, TBSpacing.pageTop)
                .padding(.bottom, TBSpacing.page + 24)
            }
        }
        .presentationDragIndicator(.hidden)
        .presentationBackground(Color.clear)
        .presentationCornerRadius(0)
        .prefersUISheetGrabberVisible(false)
        .fullScreenCover(isPresented: $showsDiningFeedback) {
            DiningFeedbackSheet { entry in
                appModel.addDiningEntry(entry)
            }
        }
    }

    private func closeSheet() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private struct QuickRefinementSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    var onDismissRequest: (() -> Void)? = nil
    var usesNativeSheetChrome = true

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: closeSheet)),
            headerCenter: AnyView(
                Text("프로필 정교화")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(
                PrimaryButton(title: "빠른 미각 보정 다시 하기") {
                    appModel.restartCalibration()
                    closeSheet()
                }
            ),
            usesNativeSheetChrome: usesNativeSheetChrome
        ) {
            BottomSheetScrollView {
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

    private func closeSheet() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private let appMenuSheetCardCornerRadius: CGFloat = 20

private struct AppMenuSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let onDismissRequest: (() -> Void)?
    let openProfile: () -> Void
    let openNotifications: () -> Void
    let startQuickRefinement: () -> Void
    let openSavedList: () -> Void

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: close)),
            headerCenter: AnyView(
                Text("메뉴")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(logoutFooter),
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
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
                        .background(TBColor.surface)
                        .clipShape(
                            RoundedRectangle(
                                cornerRadius: appMenuSheetCardCornerRadius,
                                style: .continuous
                            )
                        )
                    }
                    .buttonStyle(.plain)

                    MenuSection(
                        title: "내 다이닝",
                        rows: [
                            MenuRowModel(
                                symbol: "bookmark",
                                title: "테이스트 리스트",
                                detail: "저장한 레스토랑 후보",
                                action: openSavedList
                            ),
                        ]
                    )

                    MenuSection(
                        title: "미각 관리",
                        rows: [
                            MenuRowModel(
                                symbol: "refresh-cw",
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
                                symbol: "circle-help",
                                title: "도움말",
                                detail: "Taste Buddy 사용 가이드",
                                action: {}
                            ),
                            MenuRowModel(
                                symbol: "info",
                                title: "앱 정보",
                                detail: "Taste Buddy v1.0.0",
                                action: {}
                            ),
                        ]
                    )
                }
                .padding(.horizontal, TBSpacing.page)
                .padding(.bottom, TBSpacing.page + 24)
            }
        }
    }

    private var logoutFooter: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(TBColor.border)
                .frame(height: 1)
                .accessibilityHidden(true)

            logoutButton
        }
    }

    private var logoutButton: some View {
        Button(role: .destructive) {
            appModel.resetAll()
            close()
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
            .frame(height: 56)
        }
        .buttonStyle(.plain)
    }

    private func close() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
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

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(detail)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineLimit(1)

                    Text(time)
                        .font(TBFont.medium(11))
                        .foregroundStyle(TBColor.textFaint)
                        .lineLimit(1)
                        .fixedSize(horizontal: true, vertical: false)
                }
            }

            Spacer(minLength: 4)

            if showsUnread {
                Circle()
                    .fill(TasteAxis.sweet.mainColor)
                    .frame(width: 6, height: 6)
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
                        HStack(spacing: CompactCardMetrics.gap) {
                            TokenBox(
                                size: .medium,
                                background: TBColor.surface,
                                foreground: TBColor.iconPrimary
                            ) {
                                LucideIcon(
                                    systemName: row.symbol,
                                    size: TBIcon.Size.medium,
                                    strokeWidth: TBIcon.Stroke.regular
                                )
                            }

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
                                size: TBIcon.Size.medium,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                                .foregroundStyle(TBColor.textHint)
                        }
                        .padding(CompactCardMetrics.padding)
                        .background(TBColor.surface)
                        .clipShape(
                            RoundedRectangle(
                                cornerRadius: CompactCardMetrics.radius,
                                style: .continuous
                            )
                        )
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
                .foregroundStyle(destructive ? TBColor.destructive : TBColor.textSecondary)
                .background(destructive ? TBColor.destructive.opacity(0.08) : TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(TBFont.semibold(14))
                    .foregroundStyle(destructive ? TBColor.destructive : TBColor.textPrimary)
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
