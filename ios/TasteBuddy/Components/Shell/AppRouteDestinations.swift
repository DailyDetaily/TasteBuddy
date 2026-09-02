import SwiftUI

struct AppRouteDestinationView: View {
    let route: AppRoute
    let navigate: (AppRoute) -> Void
    let onBack: () -> Void
    var onOpenBookmarkSheet: ((RestaurantSummary) -> Void)? = nil
    var onOpenInfoSuggestionSheet: ((String, [RestaurantInfoRowModel]) -> Void)? = nil
    var onOpenMenuSuggestionSheet: ((String) -> Void)? = nil
    var collapsingTopChrome: AnyView? = nil
    var contentOffset: CGFloat = 0

    var body: some View {
        switch route {
        case .restaurant(let id):
            RestaurantDetailRouteView(
                restaurantID: id,
                navigate: navigate,
                onBack: onBack,
                onOpenBookmarkSheet: onOpenBookmarkSheet,
                onOpenInfoSuggestionSheet: onOpenInfoSuggestionSheet,
                onOpenMenuSuggestionSheet: onOpenMenuSuggestionSheet
            )
        case .restaurantSummary(let restaurant):
            RestaurantDetailRouteView(
                restaurantID: restaurant.id,
                restaurantOverride: restaurant,
                navigate: navigate,
                onBack: onBack,
                onOpenBookmarkSheet: onOpenBookmarkSheet,
                onOpenInfoSuggestionSheet: onOpenInfoSuggestionSheet,
                onOpenMenuSuggestionSheet: onOpenMenuSuggestionSheet
            )
        case .restaurantMenu(let restaurantID, let menuID):
            RestaurantDetailRouteView(
                restaurantID: restaurantID,
                highlightedDishID: menuID,
                navigate: navigate,
                onBack: onBack,
                onOpenBookmarkSheet: onOpenBookmarkSheet,
                onOpenInfoSuggestionSheet: onOpenInfoSuggestionSheet,
                onOpenMenuSuggestionSheet: onOpenMenuSuggestionSheet
            )
        case .dishFeedback(let id):
            DishFeedbackCommentFocusView(feedbackID: id)
        case .comments(let id):
            DishFeedbackCommentFocusView(feedbackID: id)
        case .tasteChange:
            TasteChangeFocusView(
                topChrome: collapsingTopChrome,
                contentOffset: contentOffset
            )
        case .savedRestaurants:
            SavedRestaurantListView { restaurantID in
                navigate(.restaurant(id: restaurantID))
            }
        case .connectionList(let kind):
            ConnectionListView(kind: kind) { profileID in
                navigate(.publicProfile(id: profileID))
            }
        case .publicProfile(let id):
            PublicProfileView(profileID: id)
        }
    }
}

private struct RestaurantDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var showsBookmarkSheet = false

    let restaurantID: String
    var highlightedDishID: String? = nil

    private var restaurant: RestaurantSummary {
        RestaurantCatalog.restaurant(id: restaurantID)
    }

    private var highlightedDish: RestaurantSummary.Dish? {
        guard let highlightedDishID else { return nil }
        return restaurant.memorableDishes.first { $0.id == highlightedDishID }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                RestaurantHeroNativeCard(
                    restaurant: restaurant,
                    isSaved: appModel.isRestaurantSaved(id: restaurant.id),
                    onBookmarkTap: { showsBookmarkSheet = true }
                )

                if let highlightedDish {
                    TBPageSection(
                        title: "선택한 메뉴",
                        subtitle: "검색에서 들어온 메뉴를 먼저 보여주고, 나머지 메뉴는 아래에서 이어서 확인합니다."
                    ) {
                        RestaurantDishCard(dish: highlightedDish)
                    }
                }

                TBPageSection(
                    title: "기억할 만한 디시",
                    subtitle: "맛 단서를 한 접시 단위로 기록하면 다음 추천과 chef-ready guidance가 더 정교해집니다."
                ) {
                    VStack(spacing: 10) {
                        ForEach(restaurant.memorableDishes) { dish in
                            RestaurantDishCard(dish: dish)
                        }
                    }
                }

                TBPageSection(title: "위치 및 정보") {
                    VStack(spacing: 10) {
                        ForEach(restaurant.infoRows) { row in
                            StatusRow(
                                icon: row.symbol,
                                title: row.label,
                                detail: row.value,
                                tone: .neutral
                            )
                        }
                    }
                }
            }
            .tbPageContentPadding()
        }
        .navigationTitle(restaurant.name)
        .tbInlineNavigationTitle()
        .tbPageBackground()
        .sheet(isPresented: $showsBookmarkSheet) {
            RestaurantBookmarkNativeSheet(restaurant: restaurant)
        }
    }
}

private struct RestaurantHeroNativeCard: View {
    let restaurant: RestaurantSummary
    let isSaved: Bool
    let onBookmarkTap: () -> Void

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 14) {
                if let imageName = restaurant.imageName {
                    BundledPNG(name: imageName)
                        .frame(maxWidth: .infinity)
                        .frame(height: 172)
                        .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
                        .clipped()
                }

                HStack(alignment: .top, spacing: 12) {
                    if let imageName = restaurant.imageName {
                        BundledPNG(name: imageName)
                            .frame(width: 48, height: 48)
                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))
                            .clipped()
                    } else {
                        LucideIcon(
                            systemName: restaurant.axis.symbol,
                            size: TBIcon.Size.medium,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                            .frame(width: 48, height: 48)
                            .foregroundStyle(restaurant.axis.mainColor)
                            .background(restaurant.axis.tintColor)
                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))
                    }

                    VStack(alignment: .leading, spacing: 5) {
                        Text(restaurant.name)
                            .font(TBFont.bold(18))
                            .foregroundStyle(TBColor.textPrimary)
                        Text(restaurant.chefName)
                            .font(TBFont.medium(12))
                            .foregroundStyle(TBColor.textBody)
                    }

                    Spacer()

                    LucideIcon(
                        .plus,
                        size: TBIcon.Size.base,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                        .frame(width: 30, height: 30)
                        .foregroundStyle(TBColor.textPrimary)
                        .overlay {
                            Circle().stroke(TBColor.textSecondary, lineWidth: 1.5)
                        }

                    Button(action: onBookmarkTap) {
                        LucideIcon(
                            .bookmark,
                            size: TBIcon.Size.control,
                            strokeWidth: TBIcon.Stroke.regular,
                            filled: isSaved
                        )
                            .frame(width: 30, height: 30)
                            .foregroundStyle(isSaved ? restaurant.axis.mainColor : restaurant.axis.tintTextColor)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(isSaved ? "북마크 편집" : "북마크 저장")
                }

                Text(restaurant.summary)
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textBody)
                    .lineSpacing(4)

                VStack(alignment: .leading, spacing: 7) {
                    RestaurantHeroInfoRow(
                        value: restaurant.locationLabel,
                        icon: .mapPin
                    )
                    ForEach(restaurant.infoRows.prefix(2)) { row in
                        RestaurantHeroInfoRow(
                            value: row.value,
                            icon: LucideIconName(systemName: row.symbol)
                        )
                    }
                }
                .font(TBFont.regular(11))
                .foregroundStyle(TBColor.textBody)

                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 92), spacing: 6, alignment: .leading)],
                    alignment: .leading,
                    spacing: 6
                ) {
                    ForEach(restaurant.tags, id: \.self) { tag in
                        NeutralChip(title: tag)
                    }
                }

                Divider()
                    .overlay(TBColor.borderSubtle)

                HStack(spacing: 0) {
                    RestaurantMetric(value: "\(restaurant.matchRate)%", label: "나와의 매칭률")
                    RestaurantMetric(value: restaurant.id == "mingles" ? "78점" : "82점", label: "비슷한 미각 기준")
                    RestaurantMetric(value: restaurant.id == "mingles" ? "4.6 / 5" : "4.5 / 5", label: "전체 평판")
                }
            }
        }
    }
}

private struct RestaurantHeroInfoRow: View {
    let value: String
    let icon: LucideIconName

    var body: some View {
        HStack(spacing: 6) {
            LucideIcon(
                icon,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.regular
            )
            Text(value)
        }
    }
}

private struct RestaurantMetric: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 5) {
            Text(value)
                .font(TBFont.bold(18))
                .foregroundStyle(TBColor.textPrimary)
            Text(label)
                .font(TBFont.regular(10))
                .foregroundStyle(TBColor.textHint)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct RestaurantDishCard: View {
    let dish: RestaurantSummary.Dish

    var body: some View {
        SectionCard {
            HStack(alignment: .top, spacing: 12) {
                LucideIcon(
                    systemName: dish.axis.symbol,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .frame(width: 34, height: 34)
                    .foregroundStyle(dish.axis.mainColor)
                    .background(dish.axis.tintColor)
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))

                VStack(alignment: .leading, spacing: 7) {
                    Text(dish.title)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(TBColor.textPrimary)
                    Text(dish.summary)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(3)
                    TasteBubbleRow(axes: [dish.axis])
                }
            }
        }
    }
}

private enum BookmarkSheetMode {
    case select
    case create
}

struct RestaurantBookmarkNativeSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @StateObject private var keyboard = BottomComposerKeyboardObserver()
    @State private var mode: BookmarkSheetMode = .select
    @State private var customListName = ""
    @State private var selectedListID = RestaurantBookmarkConstants.defaultListID
    @State private var pendingListID: String?
    @State private var toastList: RestaurantBookmarkList?
    @State private var internalSelectedCoverIconID: BookmarkCoverIconID = .utensils
    @State private var internalSelectedCoverTasteID: TasteAxis = .sweet
    @State private var internalIsCoverEditorOpen = false
    @State private var isSecretList = false

    let restaurant: RestaurantSummary
    let onDismissRequest: (() -> Void)?
    let usesNativeSheetChrome: Bool
    private let externalSelectedCoverIconID: Binding<BookmarkCoverIconID>?
    private let externalSelectedCoverTasteID: Binding<TasteAxis>?
    private let externalIsCoverEditorOpen: Binding<Bool>?
    private let hostsCoverEditorOverlay: Bool

    init(
        restaurant: RestaurantSummary,
        onDismissRequest: (() -> Void)? = nil,
        usesNativeSheetChrome: Bool = true,
        selectedCoverIconID: Binding<BookmarkCoverIconID>? = nil,
        selectedCoverTasteID: Binding<TasteAxis>? = nil,
        isCoverEditorOpen: Binding<Bool>? = nil,
        hostsCoverEditorOverlay: Bool = true
    ) {
        self.restaurant = restaurant
        self.onDismissRequest = onDismissRequest
        self.usesNativeSheetChrome = usesNativeSheetChrome
        self.externalSelectedCoverIconID = selectedCoverIconID
        self.externalSelectedCoverTasteID = selectedCoverTasteID
        self.externalIsCoverEditorOpen = isCoverEditorOpen
        self.hostsCoverEditorOverlay = hostsCoverEditorOverlay
    }

    private var selectedCoverIconID: Binding<BookmarkCoverIconID> {
        externalSelectedCoverIconID ?? $internalSelectedCoverIconID
    }

    private var selectedCoverTasteID: Binding<TasteAxis> {
        externalSelectedCoverTasteID ?? $internalSelectedCoverTasteID
    }

    private var isCoverEditorOpen: Binding<Bool> {
        externalIsCoverEditorOpen ?? $internalIsCoverEditorOpen
    }

    private var isSaved: Bool {
        appModel.isRestaurantSaved(id: restaurant.id)
    }

    private var isCreating: Bool {
        mode == .create || appModel.bookmarkLists.isEmpty
    }

    private var canSave: Bool {
        !customListName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var selectedList: RestaurantBookmarkList? {
        appModel.bookmarkList(id: selectedListID)
    }

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(
                BottomSheetCloseButton(action: closeSheet)
            ),
            headerCenter: AnyView(
                Text("북마크")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: createFooter,
            footerTopPadding: TBSpacing.x12,
            footerBottomPaddingOverride: keyboard.visibleHeight > 0 ? TBSpacing.x12 : nil,
            footerBackground: TBColor.surface,
            footerKeyboardOffset: keyboard.visibleHeight,
            floatingLayer: hostsCoverEditorOverlay ? coverEditorLayer : nil,
            stageMode: .fixed,
            usesNativeSheetChrome: usesNativeSheetChrome
        ) {
            ZStack(alignment: .bottom) {
                BottomSheetScrollView {
                    VStack(spacing: 0) {
                        if isCreating {
                            createPreview
                            Divider()
                                .padding(.horizontal, TBSpacing.page)
                            createBody
                        } else {
                            currentSavedSection
                            Divider()
                                .padding(.horizontal, TBSpacing.page)
                            listSelectionBody
                        }
                    }
                }

                if let toastList {
                    ToastSurface(
                        title: "\(toastList.name)에 저장됨",
                        message: "다음 비교 기준으로 다시 볼 수 있어요.",
                        icon: .circleCheck,
                        tone: .success
                    )
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.bottom, 12)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
        .presentationDragIndicator(.hidden)
        .presentationBackground(Color.clear)
        .presentationCornerRadius(0)
        .prefersUISheetGrabberVisible(false)
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .overlay {
            if !hostsCoverEditorOverlay && isCoverEditorOpen.wrappedValue {
                Color.black
                    .opacity(ActionOverlayCardMetrics.overlayOpacity)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
            }
        }
        .onAppear(perform: prepareSheet)
    }

    private var createPreview: some View {
        HStack(spacing: 12) {
            BookmarkListThumbnail(
                list: newListPreview,
                size: 52,
                iconSize: TBIcon.Size.large
            )

            VStack(alignment: .leading, spacing: 4) {
                Text(customListName.isEmpty ? "새 리스트" : customListName)
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineLimit(1)
                Text(isSecretList ? "비밀 리스트" : "공개 리스트")
                    .font(TBFont.medium(13))
                    .foregroundStyle(TBColor.textMuted)
            }

            Spacer()

            Button("변경") {
                isCoverEditorOpen.wrappedValue = true
            }
            .font(TBFont.bold(12))
            .foregroundStyle(selectedCoverTasteID.wrappedValue.mainColor)
        }
        .padding(.horizontal, TBSpacing.page)
        .padding(.vertical, 12)
        .background(TBColor.surface)
    }

    private var currentSavedSection: some View {
        Button {
            appModel.removeRestaurantBookmark(restaurantID: restaurant.id)
            closeSheet()
        } label: {
            HStack(spacing: 12) {
                bookmarkImage

                VStack(alignment: .leading, spacing: 4) {
                    Text("저장됨")
                        .font(TBFont.bold(15))
                        .foregroundStyle(TBColor.textPrimary)
                    Text(selectedList?.visibilityLabel ?? "공개 리스트")
                        .font(TBFont.medium(13))
                        .foregroundStyle(TBColor.textMuted)
                }

                Spacer()

                LucideIcon(
                    .bookmark,
                    size: TBIcon.Size.large,
                    strokeWidth: 0,
                    filled: true
                )
                .foregroundStyle(TBColor.textPrimary)
                .frame(width: 40, height: 40)
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.vertical, 12)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("현재 저장 상태")
    }

    private var listSelectionBody: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                Text("리스트")
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)
                Spacer()
                Button("새 리스트") {
                    mode = .create
                    customListName = ""
                    isCoverEditorOpen.wrappedValue = false
                }
                .font(TBFont.bold(11))
                .foregroundStyle(restaurant.axis.mainColor)
            }

            VStack(spacing: 20) {
                ForEach(appModel.bookmarkLists) { list in
                    BookmarkListSelectionRow(
                        list: list,
                        isSelected: selectedListID == list.id,
                        isPending: pendingListID == list.id,
                        onSelect: {
                            moveToList(list)
                        },
                        onToggle: {
                            if selectedListID == list.id {
                                appModel.saveRestaurantBookmark(restaurant: restaurant)
                                selectedListID = RestaurantBookmarkConstants.defaultListID
                            } else {
                                moveToList(list)
                            }
                        }
                    )
                }
            }
        }
        .padding(TBSpacing.page)
        .frame(maxWidth: .infinity, minHeight: 252, alignment: .topLeading)
        .background(TBColor.focus)
    }

    private var createBody: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("리스트 이름")
                    .font(TBFont.semibold(16))
                    .foregroundStyle(TBColor.textPrimary)
                Text("직접 입력")
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textTertiary)
                TextField("예: 부모님과 가볼 곳", text: $customListName)
                    .font(TBFont.medium(13))
                    .foregroundStyle(TBColor.textPrimary)
                    .padding(.horizontal, 16)
                    .frame(height: SearchOverlayShellMetrics.fieldHeight)
                    .background(TBColor.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                            .stroke(TBColor.border)
                    }
                    .submitLabel(.done)
                    .onSubmit(saveCreatedList)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("추천 리스트")
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textTertiary)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(listSuggestions) { suggestion in
                            Button {
                                customListName = customListName == suggestion.name
                                    ? ""
                                    : suggestion.name
                            } label: {
                                NeutralChip(title: suggestion.name)
                                    .overlay {
                                        if customListName == suggestion.name {
                                            Capsule()
                                                .stroke(selectedCoverTasteID.wrappedValue.mainColor, lineWidth: 1)
                                        }
                                    }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, TBSpacing.page)
                }
                .padding(.horizontal, -TBSpacing.page)
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("리스트 커버")
                    .font(TBFont.semibold(16))
                    .foregroundStyle(TBColor.textPrimary)
                Button {
                    isCoverEditorOpen.wrappedValue = true
                } label: {
                    BookmarkListThumbnail(
                        list: newListPreview,
                        iconOverride: .plus,
                        size: 104,
                        iconSize: TBIcon.Size.large
                    )
                }
                .buttonStyle(.plain)
                .accessibilityLabel("리스트 커버 변경")
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("공개여부")
                    .font(TBFont.semibold(16))
                    .foregroundStyle(TBColor.textPrimary)
                Toggle(isOn: $isSecretList) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("비밀 리스트로 설정하기")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)
                        Text("회원님만 이 리스트를 볼 수 있습니다.")
                            .font(TBFont.medium(13))
                            .foregroundStyle(TBColor.textMuted)
                    }
                }
                .tint(selectedCoverTasteID.wrappedValue.mainColor)
            }
        }
        .padding(TBSpacing.page)
        .background(TBColor.surface)
    }

    private var createFooter: AnyView? {
        guard isCreating else { return nil }

        return AnyView(
            HStack(spacing: 8) {
                Button {
                    cancelCreate()
                } label: {
                    Text("취소")
                        .font(TBFont.bold(14))
                        .foregroundStyle(TBColor.textSecondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(TBColor.surface)
                        .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                                .stroke(TBColor.border)
                        }
                }
                .buttonStyle(.plain)

                Button {
                    saveCreatedList()
                } label: {
                    Text("저장")
                        .font(TBFont.bold(14))
                        .foregroundStyle(canSave ? TBColor.textInverse : TBColor.textDisabled)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(canSave ? TBColor.textPrimary : TBColor.disabledSurface)
                        .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                }
                .buttonStyle(TBTokenButtonStyle())
                .disabled(!canSave)
            }
        )
    }

    private var coverEditorLayer: AnyView? {
        guard isCreating && isCoverEditorOpen.wrappedValue else { return nil }

        return AnyView(
            BookmarkCoverEditorOverlay(
                selectedCoverIconID: selectedCoverIconID,
                selectedCoverTasteID: selectedCoverTasteID,
                onDismiss: {
                    isCoverEditorOpen.wrappedValue = false
                }
            )
        )
    }

    private var newListPreview: RestaurantBookmarkList {
        RestaurantBookmarkList(
            id: "new-list-preview",
            name: customListName.isEmpty ? "새 리스트" : customListName,
            description: "새 테이스트 리스트 커버",
            isPrivate: isSecretList,
            coverIconID: selectedCoverIconID.wrappedValue,
            coverTasteID: selectedCoverTasteID.wrappedValue
        )
    }

    private var bookmarkImage: some View {
        Group {
            if let imageName = restaurant.imageName {
                BundledPNG(name: imageName)
            } else {
                LucideIcon(
                    .utensils,
                    size: TBIcon.Size.hero,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .foregroundStyle(restaurant.axis.mainColor)
                    .background(restaurant.axis.tintColor)
            }
        }
        .frame(width: 52, height: 52)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .clipped()
    }

    private var listSuggestions: [BookmarkListSuggestion] {
        [
            BookmarkListSuggestion(
                id: "want-to-visit",
                name: "가보고 싶은 다이닝",
                description: "예약 전 다시 판단해볼 후보"
            ),
            BookmarkListSuggestion(
                id: "compare-later",
                name: "나중에 비교할 곳",
                description: "메뉴와 내 미각 기준을 더 살펴본 뒤 고를 곳"
            ),
            BookmarkListSuggestion(
                id: "reference-point",
                name: "기준점이 될 수 있는 곳",
                description: "내 취향의 기준을 잡을 때 다시 볼 후보"
            ),
            BookmarkListSuggestion(
                id: "anniversary",
                name: "기념일 후보",
                description: "차분하게 오래 기억될 식사를 고를 때"
            ),
            BookmarkListSuggestion(
                id: "chef-interest",
                name: "셰프 관심 리스트",
                description: "셰프의 코스와 감각 흐름을 이어서 보고 싶은 곳"
            )
        ]
    }

    private func prepareSheet() {
        appModel.ensureRestaurantBookmark(restaurant: restaurant)
        selectedListID = appModel.bookmarkRecord(for: restaurant.id)?.listID
            ?? RestaurantBookmarkConstants.defaultListID
        mode = appModel.bookmarkLists.isEmpty ? .create : .select
        pendingListID = nil
        toastList = nil
        customListName = ""
        selectedCoverIconID.wrappedValue = .utensils
        selectedCoverTasteID.wrappedValue = .sweet
        isCoverEditorOpen.wrappedValue = false
        isSecretList = false
    }

    private func cancelCreate() {
        customListName = ""
        isCoverEditorOpen.wrappedValue = false
        isSecretList = false

        if appModel.bookmarkLists.isEmpty {
            closeSheet()
        } else {
            mode = .select
        }
    }

    private func saveCreatedList() {
        guard canSave else { return }
        let name = customListName.trimmingCharacters(in: .whitespacesAndNewlines)
        let suggestion = listSuggestions.first { $0.name == name }
        let list = appModel.createBookmarkList(
            name: name,
            description: suggestion?.description ?? "내 기준으로 다시 살펴볼 레스토랑 리스트",
            isPrivate: isSecretList,
            coverIconID: selectedCoverIconID.wrappedValue,
            coverTasteID: selectedCoverTasteID.wrappedValue
        )

        appModel.saveRestaurantBookmark(restaurant: restaurant, listID: list.id)
        selectedListID = list.id
        showToastAndDismiss(list)
    }

    private func moveToList(_ list: RestaurantBookmarkList) {
        guard pendingListID == nil, selectedListID != list.id else { return }
        pendingListID = list.id
        appModel.saveRestaurantBookmark(restaurant: restaurant, listID: list.id)
        selectedListID = list.id
        showToastAndDismiss(list)
    }

    private func showToastAndDismiss(_ list: RestaurantBookmarkList) {
        withAnimation(.easeOut(duration: 0.18)) {
            toastList = list
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
            closeSheet()
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

struct BookmarkCoverEditorOverlay: View {
    @Binding var selectedCoverIconID: BookmarkCoverIconID
    @Binding var selectedCoverTasteID: TasteAxis
    let onDismiss: () -> Void
    var backdropOpacity = ActionOverlayCardMetrics.overlayOpacity

    var body: some View {
        ActionOverlayCard(
            title: "커버 편집",
            headerStart: AnyView(
                BottomSheetCloseButton(
                    ariaLabel: "커버 편집 닫기",
                    action: onDismiss
                )
            ),
            headerEnd: AnyView(
                Button("완료", action: onDismiss)
                    .font(TBFont.bold(13))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            onBackdropTap: onDismiss,
            backdropOpacity: backdropOpacity
        ) {
            VStack(spacing: 20) {
                BookmarkListThumbnail(
                    list: previewList,
                    size: 104,
                    iconSize: TBIcon.Size.extraLarge
                )

                HStack(spacing: 8) {
                    ForEach(TasteAxis.allCases) { axis in
                        Button {
                            selectedCoverTasteID = axis
                        } label: {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(axis.tintColor)
                                .frame(width: 32, height: 32)
                                .overlay {
                                    if selectedCoverTasteID == axis {
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .stroke(TBColor.focus, lineWidth: 4)
                                            .padding(-3)

                                        RoundedRectangle(cornerRadius: 13, style: .continuous)
                                            .stroke(axis.mainColor, lineWidth: 2)
                                            .padding(-4)
                                    }
                                }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(axis.rawValue) 배경 선택")
                    }
                }

                LazyVGrid(
                    columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 5),
                    spacing: 8
                ) {
                    ForEach(BookmarkCoverIconID.allCases) { iconID in
                        Button {
                            selectedCoverIconID = iconID
                        } label: {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(
                                    selectedCoverIconID == iconID
                                        ? selectedCoverTasteID.tintColor
                                        : TBColor.mutedSurface
                                )
                                .aspectRatio(1, contentMode: .fit)
                                .overlay {
                                    LucideIcon(
                                        iconID.icon,
                                        size: TBIcon.Size.large,
                                        strokeWidth: TBIcon.Stroke.regular
                                    )
                                    .foregroundStyle(
                                        selectedCoverIconID == iconID
                                            ? selectedCoverTasteID.mainColor
                                            : TBColor.iconPrimary
                                    )
                                }
                                .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(iconID.rawValue) 아이콘 선택")
                    }
                }
            }
        }
    }

    private var previewList: RestaurantBookmarkList {
        RestaurantBookmarkList(
            id: "cover-editor-preview",
            name: "새 리스트",
            description: "새 테이스트 리스트 커버",
            isPrivate: false,
            coverIconID: selectedCoverIconID,
            coverTasteID: selectedCoverTasteID
        )
    }
}

private struct BookmarkListSuggestion: Identifiable {
    let id: String
    let name: String
    let description: String
}

private struct BookmarkListThumbnail: View {
    let list: RestaurantBookmarkList
    var iconOverride: LucideIconName?
    var size: CGFloat = 52
    var iconSize: CGFloat = TBIcon.Size.large

    var body: some View {
        LucideIcon(
            iconOverride ?? list.coverIconID.icon,
            size: iconSize,
            strokeWidth: TBIcon.Stroke.regular
        )
        .frame(width: size, height: size)
        .foregroundStyle(list.coverTasteID.mainColor)
        .background(list.coverTasteID.tintColor)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private struct BookmarkListSelectionRow: View {
    let list: RestaurantBookmarkList
    let isSelected: Bool
    let isPending: Bool
    let onSelect: () -> Void
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onSelect) {
                HStack(spacing: 12) {
                    BookmarkListThumbnail(list: list)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(list.name)
                            .font(TBFont.bold(15))
                            .foregroundStyle(TBColor.textPrimary)
                            .lineLimit(1)
                        Text(list.visibilityLabel)
                            .font(TBFont.medium(13))
                            .foregroundStyle(TBColor.textMuted)
                            .lineLimit(1)
                    }
                }
            }
            .buttonStyle(.plain)
            .disabled(isSelected || isPending)
            .frame(maxWidth: .infinity, alignment: .leading)

            Button(action: onToggle) {
                LucideIcon(
                    isSelected || isPending ? .circleCheck : .circlePlus,
                    size: TBIcon.Size.large,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(width: 40, height: 40)
                .foregroundStyle(isSelected || isPending ? TBColor.textSecondary : TBColor.textHint)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(isSelected ? "\(list.name)에서 제거" : "\(list.name)에 추가")
        }
    }
}

private struct SavedRestaurantListView: View {
    @EnvironmentObject private var appModel: AppModel
    let onOpenRestaurant: (String) -> Void
    @State private var selectedCategory = "전체"

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 24) {
                ForEach(["전체", "파인다이닝", "한식", "디저트"], id: \.self) { category in
                    Button {
                        selectedCategory = category
                    } label: {
                        HStack(spacing: 4) {
                            Text(category)
                            Text("1")
                        }
                        .font(TBFont.semibold(12))
                        .foregroundStyle(
                            selectedCategory == category
                                ? Color(hex: 0x86A51E)
                                : TBColor.textSecondary
                        )
                        .padding(.horizontal, selectedCategory == category ? 12 : 0)
                        .padding(.vertical, 7)
                        .background(
                            selectedCategory == category
                                ? Color(hex: 0xF1F7C8)
                                : Color.clear
                        )
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TBColor.page)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(TBColor.borderSubtle)
                    .frame(height: 1)
            }

            ScrollView {
                Button {
                    let restaurantID = appModel.savedRestaurantIDs.first ?? "mingles"
                    onOpenRestaurant(restaurantID)
                } label: {
                    SectionCard {
                        HStack(spacing: 12) {
                            LucideIcon(
                                .archive,
                                size: TBIcon.Size.medium,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                                .frame(width: 38, height: 38)
                                .foregroundStyle(Color(hex: 0x86A51E))
                                .background(Color(hex: 0xF1F7C8))
                                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))

                            VStack(alignment: .leading, spacing: 4) {
                                Text(appModel.profileIdentity.displayName)
                                    .font(TBFont.bold(15))
                                    .foregroundStyle(TBColor.textPrimary)
                                Text("공개 리스트 · 1")
                                    .font(TBFont.regular(11))
                                    .foregroundStyle(TBColor.textHint)
                            }

                            Spacer()

                            LucideIcon(
                                .chevronRight,
                                size: TBIcon.Size.small,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                                .foregroundStyle(TBColor.textHint)
                        }
                    }
                }
                .buttonStyle(.plain)
                .tbPageContentPadding()
            }
        }
        .background(TBColor.page.ignoresSafeArea())
    }
}

private struct SavedRestaurantRow: View {
    let restaurant: RestaurantSummary

    var body: some View {
        SectionCard {
            HStack(spacing: 12) {
                LucideIcon(
                    .utensils,
                    size: TBIcon.Size.base,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .frame(width: 44, height: 44)
                    .foregroundStyle(restaurant.axis.mainColor)
                    .background(restaurant.axis.tintColor)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    Text(restaurant.name)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(TBColor.textPrimary)
                    Text(restaurant.locationLabel)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textBody)
                    Text("Taste fit \(restaurant.matchRate)%")
                        .font(TBFont.semibold(11))
                        .foregroundStyle(restaurant.axis.mainColor)
                }

                Spacer()

                LucideIcon(
                    .chevronRight,
                    size: TBIcon.Size.xSmall,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .foregroundStyle(TBColor.textHint)
            }
        }
    }
}

private struct ConnectionListView: View {
    let kind: ProfileConnectionKind
    let onOpenProfile: (String) -> Void
    @State private var followedProfileIDs: Set<String> = ["mina"]

    private var profiles: [BuddyProfile] {
        BuddyProfile.samples
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(profiles) { profile in
                    BuddyProfileRow(
                        profile: profile,
                        isFollowing: followedProfileIDs.contains(profile.id),
                        onOpen: { onOpenProfile(profile.id) },
                        onToggleFollow: {
                            if followedProfileIDs.contains(profile.id) {
                                followedProfileIDs.remove(profile.id)
                            } else {
                                followedProfileIDs.insert(profile.id)
                            }
                        }
                    )
                }

                if profiles.isEmpty {
                    SectionCard {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("\(kind.title) 목록이 비어 있어요")
                                .font(TBFont.bold(14))
                                .foregroundStyle(TBColor.textPrimary)
                            Text(
                                kind == .followers
                                    ? "아직 나를 팔로우한 다이닝 친구가 없습니다."
                                    : "아직 내가 팔로우한 다이닝 친구가 없습니다."
                            )
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textSubtle)
                            .lineSpacing(3)
                        }
                    }
                }
            }
            .tbPageContentPadding()
            .padding(.bottom, 60)
        }
        .tbPageBackground()
    }
}

private struct PublicProfileView: View {
    let profileID: String
    @State private var isFollowing = true
    @State private var publicIdentity: BackendPublicProfileIdentity?

    private var sampleProfile: BuddyProfile? {
        BuddyProfile.samples.first { $0.id == profileID }
    }

    private var displayName: String {
        publicIdentity?.title ?? sampleProfile?.name ?? "공개 프로필"
    }

    private var displayHandle: String {
        publicIdentity?.displayNickname ?? sampleProfile?.handle ?? "@tastebuddy"
    }

    private var displayAxis: TasteAxis {
        sampleProfile?.axis ?? .umami
    }

    private var avatarSeed: String {
        publicIdentity?.id ?? sampleProfile?.id ?? profileID
    }

    private var activityMetrics: [ProfileActivityMetric] {
        sampleProfile?.activityMetrics ?? BuddyProfile.placeholderActivityMetrics
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                ProfileHeroCard(
                    title: displayName,
                    handle: displayHandle,
                    followerCount: sampleProfile?.followerCount ?? 0,
                    followingCount: sampleProfile?.followingCount ?? 0
                ) {
                    PalateBloomAvatar(size: 64, seed: avatarSeed)
                } headerAction: {
                    EmptyView()
                } footerAction: {
                    Button {
                        isFollowing.toggle()
                    } label: {
                        Text(isFollowing ? "팔로잉" : "팔로우")
                            .font(TBFont.semibold(12))
                            .foregroundStyle(
                                isFollowing ? TBColor.textPrimary : displayAxis.tintTextColor
                            )
                            .padding(.horizontal, 14)
                            .frame(height: 36)
                            .background(
                                isFollowing ? TBColor.surface : displayAxis.tintColor
                            )
                            .clipShape(Capsule())
                            .overlay {
                                if isFollowing {
                                    Capsule().stroke(TBColor.border, lineWidth: 1)
                                }
                            }
                    }
                    .buttonStyle(.plain)
                }

                TBPageSection(title: "활동 요약") {
                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: 12),
                            GridItem(.flexible(), spacing: 12)
                        ],
                        spacing: 12
                    ) {
                        ForEach(activityMetrics) { metric in
                            SummaryMetricCard(metric: metric)
                        }
                    }
                }
            }
            .tbPageContentPadding()
            .padding(.bottom, 60)
        }
        .tbPageBackground()
        .task(id: profileID) {
            publicIdentity = await PublicProfileSnapshotStore.shared.profile(id: profileID)
            if let publicIdentity {
                isFollowing = publicIdentity.isFriend
            }
        }
    }
}

private struct BuddyProfile: Identifiable {
    let id: String
    let name: String
    let handle: String
    let summary: String
    let axis: TasteAxis
    let feedItem: DiningDishFeedbackItem
    let followerCount: Int
    let followingCount: Int

    var initial: String { String(name.prefix(1)).uppercased() }
    var axes: [TasteAxis] { [axis, .umami, .sour] }
    var activityMetrics: [ProfileActivityMetric] {
        [
            ProfileActivityMetric(
                id: "measurements",
                label: "미각 기록",
                value: "3회",
                symbol: "trophy",
                color: TasteAxis.sweet.mainColor
            ),
            ProfileActivityMetric(
                id: "feedback",
                label: "다이닝 리뷰",
                value: "8건",
                symbol: "checkmark.circle",
                color: TasteAxis.umami.mainColor
            ),
            ProfileActivityMetric(
                id: "saved",
                label: "테이스트 리스트",
                value: "2개",
                symbol: "bookmark",
                color: TasteAxis.salty.mainColor
            ),
            ProfileActivityMetric(
                id: "rating",
                label: "평균 만족도",
                value: "4.6",
                symbol: "star",
                color: TasteAxis.sour.mainColor
            ),
        ]
    }

    static let placeholderActivityMetrics: [ProfileActivityMetric] = [
        ProfileActivityMetric(
            id: "measurements",
            label: "미각 기록",
            value: "-",
            symbol: "trophy",
            color: TasteAxis.sweet.mainColor
        ),
        ProfileActivityMetric(
            id: "feedback",
            label: "다이닝 리뷰",
            value: "-",
            symbol: "checkmark.circle",
            color: TasteAxis.umami.mainColor
        ),
        ProfileActivityMetric(
            id: "saved",
            label: "테이스트 리스트",
            value: "-",
            symbol: "bookmark",
            color: TasteAxis.salty.mainColor
        ),
        ProfileActivityMetric(
            id: "rating",
            label: "평균 만족도",
            value: "-",
            symbol: "star",
            color: TasteAxis.sour.mainColor
        ),
    ]

    static let samples: [BuddyProfile] = [
        BuddyProfile(
            id: "mina",
            name: "김민아",
            handle: "@맑은끝민아",
            summary: "맑은 감칠맛과 가벼운 피니시를 자주 기록하는 버디입니다.",
            axis: .umami,
            feedItem: TasteBuddyNativeContent.followingDishFeedbackItems[0],
            followerCount: 18,
            followingCount: 12
        ),
        BuddyProfile(
            id: "jae",
            name: "정서윤",
            handle: "@산미탐험서윤",
            summary: "밝은 산미와 절제된 단맛의 균형을 세밀하게 남깁니다.",
            axis: .sour,
            feedItem: TasteBuddyNativeContent.followingDishFeedbackItems[1],
            followerCount: 11,
            followingCount: 8
        ),
        BuddyProfile(
            id: "hyeon",
            name: "최도윤",
            handle: "@불향도윤",
            summary: "쌉싸름한 여운과 불향의 깊이를 편안하게 기록하는 버디입니다.",
            axis: .bitter,
            feedItem: DiningDishFeedbackItem.fromTasteMatchFeedItem(
                TasteBuddyNativeContent.tasteMatchFeed[2],
                commentCount: 0,
                liked: false
            ),
            followerCount: 10,
            followingCount: 7
        )
    ]
}

private struct BuddyProfileRow: View {
    let profile: BuddyProfile
    let isFollowing: Bool
    let onOpen: () -> Void
    let onToggleFollow: () -> Void

    var body: some View {
        ZStack {
            Button(action: onOpen) {
                Color.clear
                    .contentShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
            }
            .buttonStyle(.plain)

            HStack(spacing: 12) {
                PalateBloomAvatar(size: 40, seed: profile.id)
                VStack(alignment: .leading, spacing: 4) {
                    Text(profile.name)
                        .font(TBFont.bold(14))
                        .foregroundStyle(TBColor.textPrimary)
                    Text(profile.handle)
                        .font(TBFont.semibold(12))
                        .foregroundStyle(TBColor.textHint)
                }
                Spacer()

                Button(action: onToggleFollow) {
                    Text(isFollowing ? "팔로잉" : "팔로우")
                        .font(TBFont.semibold(11))
                        .foregroundStyle(
                            isFollowing ? TBColor.textPrimary : profile.axis.tintTextColor
                        )
                        .padding(.horizontal, 12)
                        .frame(height: 36)
                        .background(
                            isFollowing ? TBColor.surface : profile.axis.tintColor
                        )
                        .clipShape(Capsule())
                        .overlay {
                            if isFollowing {
                                Capsule().stroke(TBColor.border, lineWidth: 1)
                            }
                        }
                }
                .buttonStyle(.plain)
            }
            .padding(12)
        }
        .frame(height: 64)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
    }
}

private struct DishFeedbackFocusView: View {
    let feedbackID: String

    var body: some View {
        ScrollView {
            NativeDishFeedbackCard(
                item: item,
                absoluteDateLabel: "최근",
                relativeDateLabel: "최근",
                showsOptions: false,
                framed: false
            )
            .padding(.horizontal, TBSpacing.page)
            .padding(.bottom, 24)
        }
        .background(TBColor.focus)
    }

    private var item: DiningDishFeedbackItem {
        (
            TasteBuddyNativeContent.followingDishFeedbackItems
                + TasteBuddyNativeContent.fallbackDishFeedbackItems
        ).first { $0.id == feedbackID }
            ?? TasteBuddyNativeContent.fallbackDishFeedbackItems[0]
    }
}

struct DishFeedbackCommentFocusView: View {
    @EnvironmentObject private var appModel: AppModel
    @StateObject private var keyboard = BottomComposerKeyboardObserver()
    @FocusState private var isComposerFocused: Bool
    @State private var commentDraft = ""
    private let feedbackID: String
    private let sourceItem: DiningDishFeedbackItem?

    init(feedbackID: String) {
        self.feedbackID = feedbackID
        sourceItem = nil
    }

    init(item: DiningDishFeedbackItem) {
        feedbackID = item.id
        sourceItem = item
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    NativeDishFeedbackCard(
                        item: item,
                        absoluteDateLabel: "최근",
                        relativeDateLabel: "최근",
                        showsOptions: false,
                        framed: false,
                        onCommentsTap: {
                            isComposerFocused = true
                        }
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        Text("댓글")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)

                        ForEach(comments) { comment in
                            DishFeedbackCommentRow(
                                author: comment.authorName,
                                message: comment.message,
                                axis: comment.axis
                            )
                        }

                        if comments.isEmpty {
                            Text("아직 댓글이 없어요. 이 디시에 남긴 감상을 짧게 이어갈 수 있어요.")
                                .font(TBFont.regular(12))
                                .foregroundStyle(TBColor.textMuted)
                                .lineSpacing(3)
                        }
                    }
                }
                .padding(.horizontal, TBSpacing.page)
                .padding(.bottom, 24)
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            commentComposer
        }
        .navigationTitle("")
        .toolbar(.hidden, for: .navigationBar)
        .background(TBColor.focus.ignoresSafeArea())
        .ignoresSafeArea(.keyboard, edges: .bottom)
    }

    private var commentComposer: some View {
        HStack(spacing: 12) {
            PalateBloomAvatar(size: 40, seed: "current-user")

            TextField("댓글을 남겨보세요", text: $commentDraft)
                .font(TBFont.medium(13))
                .padding(.horizontal, 16)
                .frame(height: 44)
                .background(TBColor.mutedSurface)
                .clipShape(Capsule())
                .overlay {
                    Capsule().stroke(TBColor.border, lineWidth: 1)
                }
                .focused($isComposerFocused)

            Button("등록", action: submitComment)
                .font(TBFont.semibold(13))
                .foregroundStyle(
                    commentDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                        ? TBColor.textDisabled
                        : TBColor.textBody
                )
                .disabled(commentDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(.horizontal, TBSpacing.page)
        .padding(.top, 12)
        .padding(.bottom, composerKeyboardBackgroundExtension)
        .background(TBColor.focus.ignoresSafeArea(edges: .bottom))
        .offset(y: -composerKeyboardOffset)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(TBColor.borderSubtle)
                .frame(height: 1)
        }
    }

    private var composerKeyboardOffset: CGFloat {
        guard keyboard.visibleHeight > 0 else { return 0 }

        return max(
            0,
            keyboard.visibleHeight - keyWindowSafeAreaBottom
        )
    }

    private var composerKeyboardBackgroundExtension: CGFloat {
        keyboard.visibleHeight > 0 ? TBSpacing.x12 : 0
    }

    private var keyWindowSafeAreaBottom: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets.bottom ?? 0
    }

    private var item: DiningDishFeedbackItem {
        let baseItem = sourceItem
            ?? (
                TasteBuddyNativeContent.followingDishFeedbackItems
                    + TasteBuddyNativeContent.fallbackDishFeedbackItems
            ).first { $0.id == feedbackID }
            ?? TasteBuddyNativeContent.followingDishFeedbackItems[0]
        return appModel.dishFeedbackItemWithCurrentComments(baseItem)
    }

    private var comments: [DishFeedbackComment] {
        appModel.comments(for: feedbackID)
    }

    private func submitComment() {
        let nextComment = commentDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !nextComment.isEmpty else { return }
        appModel.addDishFeedbackComment(feedbackID: feedbackID, message: nextComment)
        commentDraft = ""
    }
}

private struct DishFeedbackCommentRow: View {
    let author: String
    let message: String
    let axis: TasteAxis

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            PalateBloomAvatar(size: 32, seed: author)
            VStack(alignment: .leading, spacing: 2) {
                Text(author)
                    .font(TBFont.semibold(13))
                    .foregroundStyle(TBColor.textPrimary)
                Text(message)
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textSubtle)
                    .lineSpacing(4)
            }
        }
    }
}

private struct TasteChangeFocusView: View {
    let topChrome: AnyView?
    let contentOffset: CGFloat

    @State private var selectedRange = "3개월"
    @State private var selectedTasteIndex = 2

    private let ranges = ["1개월", "3개월", "6개월", "1년"]
    private let tastes = TasteAxis.allCases

    private var selectedTaste: TasteAxis {
        tastes[selectedTasteIndex]
    }

    private var previousTaste: TasteAxis {
        tastes[(selectedTasteIndex - 1 + tastes.count) % tastes.count]
    }

    private var nextTaste: TasteAxis {
        tastes[(selectedTasteIndex + 1) % tastes.count]
    }

    var body: some View {
        TBCollapsingTopChromeScrollView(
            topChrome: topChrome,
            contentOffset: contentOffset
        ) {
            periodTabs
        } content: {
            VStack(spacing: 16) {
                HStack {
                    CircleNavigationButton(
                        symbol: "chevron.left",
                        isEnabled: false,
                        action: {}
                    )

                    Spacer()

                    Text("2026. 3. 5 - 2026. 6. 5")
                        .font(TBFont.semibold(15))
                        .foregroundStyle(TBColor.textPrimary)

                    Spacer()

                    CircleNavigationButton(
                        symbol: "chevron.right",
                        isEnabled: true,
                        action: {}
                    )
                }

                HStack {
                    TasteSelectorButton(axis: previousTaste, isMuted: true) {
                        moveTaste(-1)
                    }

                    Spacer()

                    HStack(spacing: 8) {
                        LucideIcon(
                            systemName: selectedTaste.symbol,
                            size: TBIcon.Size.base,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                            .foregroundStyle(selectedTaste.mainColor)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(selectedTaste.label)
                                .font(TBFont.semibold(14))
                                .foregroundStyle(TBColor.textPrimary)
                            Text("\(TasteProfile.sample.score(for: selectedTaste))점")
                                .font(TBFont.medium(11))
                                .foregroundStyle(TBColor.textSecondary)
                        }
                    }
                    .padding(12)
                    .background(TBColor.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(TBColor.border, lineWidth: 1)
                    }

                    Spacer()

                    TasteSelectorButton(axis: nextTaste, isMuted: true) {
                        moveTaste(1)
                    }
                }

                TasteTrendChart(axis: selectedTaste)
                    .frame(height: 280)
                    .padding(.horizontal, -12)

                HStack(spacing: 8) {
                    TrendMetric(label: "첫 기록", value: "62점")
                    TrendMetric(label: "현재", value: "\(TasteProfile.sample.score(for: selectedTaste))점")
                    TrendMetric(
                        label: "변화",
                        value: "+8",
                        accent: selectedTaste.mainColor,
                        labelColor: selectedTaste.mainColor,
                        background: selectedTaste.tintColor
                    )
                }

                VStack(spacing: 8) {
                    TrendMeaningRow(
                        title: "지금 읽히는 변화",
                        detail: "\(selectedTaste.label) 반응이 이전보다 조금 더 또렷하게 읽히고 있습니다."
                    )
                    TrendMeaningRow(
                        title: "다이닝에서의 의미",
                        detail: "재료의 강도보다 코스 안에서 언제 나타나는지 함께 보면 더 정확한 기준이 됩니다."
                    )
                    TrendMeaningRow(
                        title: "다음 반영 방식",
                        detail: "다음 식후 피드백에서 같은 축의 편안함과 여운을 다시 확인합니다."
                    )
                }
            }
            .tbPageContentPadding()
            .background(TBColor.surface)
        }
        .tbPageBackground()
    }

    private var periodTabs: some View {
        HStack(spacing: 8) {
            ForEach(ranges, id: \.self) { range in
                Button {
                    selectedRange = range
                } label: {
                    Text(range)
                        .font(TBFont.semibold(13))
                        .foregroundStyle(
                            selectedRange == range
                                ? selectedTaste.mainColor
                                : TBColor.textTertiary
                        )
                        .padding(.horizontal, 14)
                        .frame(height: 32)
                        .background(
                            selectedRange == range
                                ? selectedTaste.tintColor
                                : Color.clear
                        )
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selectedRange == range ? .isSelected : [])
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, TBSpacing.page)
        .padding(.bottom, 16)
    }

    private func moveTaste(_ direction: Int) {
        selectedTasteIndex = (selectedTasteIndex + direction + tastes.count) % tastes.count
    }
}

#Preview("Taste Change Collapsing Header") {
    TasteChangeFocusView(
        topChrome: AnyView(
            TopAppBar(
                appearance: .transparent,
                title: "미각 변화",
                showBack: true,
                showsDefaultActions: false,
                onBack: {}
            )
        ),
        contentOffset: 0
    )
    .tbScreenTopChrome()
}

private struct CircleNavigationButton: View {
    let symbol: String
    let isEnabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            LucideIcon(
                systemName: symbol,
                size: TBIcon.Size.xSmall,
                strokeWidth: TBIcon.Stroke.regular
            )
                .frame(width: 40, height: 40)
                .foregroundStyle(isEnabled ? TBColor.textPrimary : TBColor.textDisabled)
                .background(isEnabled ? TBColor.surface : TBColor.disabledSurface)
                .clipShape(Circle())
                .overlay {
                    Circle()
                        .stroke(
                            isEnabled ? TBColor.border : TBColor.borderDisabled,
                            lineWidth: 1
                        )
                }
        }
        .buttonStyle(TBTokenButtonStyle())
        .disabled(!isEnabled)
    }
}

private struct TasteSelectorButton: View {
    let axis: TasteAxis
    let isMuted: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 7) {
                LucideIcon(
                    systemName: axis.symbol,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .foregroundStyle(axis.mainColor)
                Text(axis.label)
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textSecondary)
            }
            .padding(.horizontal, 9)
            .frame(minHeight: 42)
            .background(TBColor.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .opacity(isMuted ? 0.5 : 1)
        }
        .buttonStyle(.plain)
    }
}

private struct TasteTrendChart: View {
    let axis: TasteAxis

    private let values: [CGFloat] = [0.34, 0.42, 0.39, 0.55, 0.61, 0.68]

    var body: some View {
        GeometryReader { proxy in
            let plot = CGRect(
                x: 24,
                y: 20,
                width: max(1, proxy.size.width - 48),
                height: max(1, proxy.size.height - 54)
            )

            Canvas { context, _ in
                for index in 0..<5 {
                    let y = plot.minY + plot.height * CGFloat(index) / 4
                    var grid = Path()
                    grid.move(to: CGPoint(x: plot.minX, y: y))
                    grid.addLine(to: CGPoint(x: plot.maxX, y: y))
                    context.stroke(
                        grid,
                        with: .color(TBColor.borderSubtle),
                        style: StrokeStyle(lineWidth: 1, dash: [3, 4])
                    )
                }

                var line = Path()
                for (index, value) in values.enumerated() {
                    let x = plot.minX + plot.width * CGFloat(index) / CGFloat(values.count - 1)
                    let y = plot.maxY - plot.height * value
                    let point = CGPoint(x: x, y: y)

                    if index == 0 {
                        line.move(to: point)
                    } else {
                        line.addLine(to: point)
                    }
                }

                context.stroke(
                    line,
                    with: .color(axis.mainColor),
                    style: StrokeStyle(lineWidth: 2.2, lineCap: .round, lineJoin: .round)
                )

                for (index, value) in values.enumerated() {
                    let x = plot.minX + plot.width * CGFloat(index) / CGFloat(values.count - 1)
                    let y = plot.maxY - plot.height * value
                    let point = CGPoint(x: x, y: y)
                    context.fill(
                        Path(ellipseIn: CGRect(x: point.x - 4, y: point.y - 4, width: 8, height: 8)),
                        with: .color(axis.mainColor)
                    )
                }
            }
        }
        .accessibilityLabel("\(axis.label) 미각 변화 그래프")
    }
}

private struct TrendMetric: View {
    let label: String
    let value: String
    var accent = TBColor.textPrimary
    var labelColor: Color? = nil
    var background = TBColor.mutedSurface

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(TBFont.semibold(11))
                .foregroundStyle(labelColor ?? TBColor.textHint)
            Text(value)
                .font(TBFont.bold(14))
                .foregroundStyle(accent)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(background)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private struct TrendMeaningRow: View {
    let title: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textPrimary)
            Text(detail)
                .font(TBFont.regular(12))
                .foregroundStyle(TBColor.textSubtle)
                .lineSpacing(3)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(TBColor.borderSubtle, lineWidth: 1)
        }
    }
}
