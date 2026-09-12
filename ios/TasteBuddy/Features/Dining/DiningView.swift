import SwiftUI
import UIKit
import AVFoundation
import CoreLocation
import ImageIO
import MapKit
import Photos
import PhotosUI
import Vision

enum DiningDishFeedbackContentState: Equatable {
    case populated
    case loading
}

private enum DiningDishFeedbackSkeletonMetrics {
    static let cardSlotHeight: CGFloat = 500
    static let viewportOffset: CGFloat = 120
    static let minCount = 2
    static let maxCount = 6
}

struct DiningView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var presentation: DiningPresentation?
    let contentState: DiningDishFeedbackContentState
    let systemTopChrome: AnyView?
    var onOpenDishOptions: ((DiningDishFeedbackItem) -> Void)? = nil

    init(
        contentState: DiningDishFeedbackContentState = .populated,
        systemTopChrome: AnyView? = nil,
        onOpenDishOptions: ((DiningDishFeedbackItem) -> Void)? = nil
    ) {
        self.contentState = contentState
        self.systemTopChrome = systemTopChrome
        self.onOpenDishOptions = onOpenDishOptions
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("다이닝")
                .tbInlineNavigationTitle()
                .toolbar(.hidden, for: .navigationBar)
                .tbPageBackground()
                .fullScreenCover(item: $presentation) { presentation in
                    switch presentation {
                    case .newFeedback:
                        DiningFeedbackSheet { entry in
                            appModel.addDiningEntry(entry)
                        }
                    case .edit(let entry):
                        DiningFeedbackSheet(entry: entry) { updatedEntry in
                            appModel.updateDiningEntry(updatedEntry)
                        }
                    case .addToMeal(let draft):
                        DiningFeedbackSheet(entry: draft) { addedEntry in
                            appModel.addDiningEntry(addedEntry)
                        }
                    case .comments(let item):
                        DiningCommentsFocusSheet(item: item)
                    }
                }
        }
        .ignoresSafeArea(.container, edges: systemTopChrome == nil ? [] : .top)
    }

    private var content: some View {
        MainTabChromeScrollView(topChrome: systemTopChrome) {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                TBPageSection(title: "나의 디시") {
                    LazyVStack(spacing: 12) {
                        switch contentState {
                        case .loading:
                            ForEach(0..<dishFeedbackSkeletonCardCount, id: \.self) { _ in
                                NativeDishFeedbackCardSkeleton()
                            }
                        case .populated:
                            if appModel.diningEntries.isEmpty {
                                ForEach(TasteBuddyNativeContent.fallbackDishFeedbackItems) { item in
                                    dishFeedbackCard(item)
                                }
                            } else {
                                ForEach(appModel.diningEntries) { entry in
                                    dishFeedbackCard(dishFeedItem(for: entry), entry: entry)
                                }
                            }
                        }
                    }
                }
            }
            .tbPageContentPadding(bottom: TBSpacing.mainTabContentBottom)
        }
    }

    private var dishFeedbackSkeletonCardCount: Int {
        let availableHeight = max(
            DiningDishFeedbackSkeletonMetrics.cardSlotHeight,
            UIScreen.main.bounds.height - DiningDishFeedbackSkeletonMetrics.viewportOffset
        )
        let estimatedCount = Int(ceil(availableHeight / DiningDishFeedbackSkeletonMetrics.cardSlotHeight))
        return min(
            DiningDishFeedbackSkeletonMetrics.maxCount,
            max(DiningDishFeedbackSkeletonMetrics.minCount, estimatedCount)
        )
    }

    private func dishFeedbackCard(
        _ item: DiningDishFeedbackItem,
        entry: DiningEntry? = nil
    ) -> some View {
        let displayItem = appModel.dishFeedbackItemWithCurrentComments(item)
        let mealRecordCount = entry.map { appModel.diningEntries(mealID: $0.mealID).count } ?? 0
        return VStack(spacing: TBSpacing.x8) {
            NativeDishFeedbackCard(
                item: displayItem,
                relativeDateLabel: mealRecordCount > 1 ? "같은 식사 · \(mealRecordCount)개 메뉴" : "최근",
                avatarProfile: appModel.profile,
                avatarImageData: appModel.profileAvatarImageData,
                avatarShapeSeed: "current-user",
                onOptionsTap: onOpenDishOptions.map { handler in
                    { handler(displayItem) }
                },
                onDetailTap: {
                    if let entry, !entry.hasCompletedTasteFeedback {
                        presentation = .edit(entry)
                    } else {
                        presentation = .comments(displayItem)
                    }
                },
                onCommentsTap: { presentation = .comments(displayItem) }
            )

            if let entry, entry.hasCompletedTasteFeedback {
                Button {
                    if let draft = appModel.additionalMenuDraft(for: entry.id) {
                        presentation = .addToMeal(draft)
                    }
                } label: {
                    HStack(spacing: TBSpacing.x6) {
                        LucideIcon(
                            .plus,
                            size: TBIcon.Size.xSmall,
                            strokeWidth: TBIcon.Stroke.medium
                        )
                        Text("이 식사에 메뉴 추가")
                            .font(TBFont.semibold(12))
                    }
                    .foregroundStyle(TBColor.textSecondary)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 38)
                    .background(TBColor.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                }
                .buttonStyle(TBTokenButtonStyle())
                .accessibilityHint("같은 식사로 묶이는 새 메뉴 기록을 시작합니다")
            }
        }
    }

    private func dishFeedItem(for entry: DiningEntry) -> DiningDishFeedbackItem {
        DiningDishFeedbackItem.fromDiningEntry(
            entry,
            analysis: appModel.sensoryAnalysisIsUpdating || appModel.sensoryAnalysisError != nil
                ? nil : appModel.sensoryAnalysis
        )
    }

    private func diningEntry(for item: DiningDishFeedbackItem) -> DiningEntry? {
        guard let id = UUID(uuidString: item.id) else { return nil }
        return appModel.diningEntries.first { $0.id == id }
    }
}

private enum DiningPresentation: Identifiable {
    case newFeedback
    case edit(DiningEntry)
    case addToMeal(DiningEntry)
    case comments(DiningDishFeedbackItem)

    var id: String {
        switch self {
        case .newFeedback:
            "new-feedback"
        case .edit(let entry):
            "edit-\(entry.id.uuidString)"
        case .addToMeal(let draft):
            "add-to-meal-\(draft.id.uuidString)"
        case .comments(let item):
            "comments-\(item.id)"
        }
    }
}

private struct DiningCommentsFocusSheet: View {
    @Environment(\.dismiss) private var dismiss
    let item: DiningDishFeedbackItem

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TopAppBar(
                    appearance: .solid,
                    solidBackground: .focus,
                    showBack: true,
                    showsDefaultActions: false,
                    onBack: { dismiss() }
                )

                DishFeedbackCommentFocusView(item: item)
            }
            .tbScreenTopChrome()
            .toolbar(.hidden, for: .navigationBar)
            .tbPageBackground(TBColor.focus)
        }
        .edgeSwipeBack { dismiss() }
    }
}

private struct EmptyDiningState: View {
    var body: some View {
        SectionCard {
            VStack(spacing: 14) {
                LucideIcon(
                    .utensils,
                    size: TBIcon.Size.hero,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .foregroundStyle(TBColor.textHint)
                Text("아직 기록된 식사가 없어요")
                    .font(TBFont.bold(15))
                Text("첫 경험을 남기면 프로필과 실제 식사의 차이를 읽어 다음 해석을 더 정교하게 만들 수 있어요.")
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textBody)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 24)
        }
    }
}

private struct DiningEntryCard: View {
    let entry: DiningEntry

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(entry.restaurant)
                            .font(TBFont.bold(14))
                        Text(entry.menu)
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textHint)
                    }
                    Spacer()
                    Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                        .font(TBFont.regular(10))
                        .foregroundStyle(TBColor.textHint)
                }

                HStack(spacing: 3) {
                    ForEach(1...5, id: \.self) { rating in
                        LucideIcon(
                            .star,
                            size: TBIcon.Size.xSmall,
                            strokeWidth: TBIcon.Stroke.regular,
                            filled: rating <= entry.rating
                        )
                            .foregroundStyle(TasteAxis.sour.mainColor)
                    }
                }

                if !entry.note.isEmpty {
                    Text(entry.note)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(3)
                }
            }
        }
    }
}

private struct DishFeedbackFeedCard: View {
    let item: DiningDishFeedbackItem

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 10) {
                    PalateBloomAvatar(size: 40, seed: item.id)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.authorName)
                            .font(TBFont.bold(13))
                        Text("\(item.restaurantName) · \(item.dishTitle)")
                            .font(TBFont.regular(11))
                            .foregroundStyle(TBColor.textHint)
                            .lineLimit(1)
                    }

                    Spacer()

                    LucideIcon(
                        .ellipsis,
                        size: TBIcon.Size.small,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                        .foregroundStyle(TBColor.textHint)
                }

                HStack(alignment: .center, spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(item.primaryTasteAxis.tintColor)
                            .overlay {
                                Circle().stroke(item.primaryTasteAxis.mainColor.opacity(0.24), lineWidth: 1)
                            }
                        VStack(spacing: 4) {
                            Text("메인 미각")
                                .font(TBFont.semibold(10))
                                .foregroundStyle(item.primaryTasteAxis.tintTextColor.opacity(0.7))
                            Text(item.reactionLabel)
                                .font(TBFont.bold(14))
                                .foregroundStyle(item.primaryTasteAxis.tintTextColor)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                        }
                        .padding(12)
                    }
                    .frame(width: 118, height: 118)

                    VStack(alignment: .leading, spacing: 9) {
                        Text("짧은 미식 기록")
                            .font(TBFont.bold(13))
                        Text(item.summary)
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(3)
                            .lineLimit(5)
                        TasteBubbleRow(bubbles: item.tasteBubbles)
                    }
                }

                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 92), spacing: 8, alignment: .leading)],
                    alignment: .leading,
                    spacing: 8
                ) {
                    ForEach(item.detailTags) { tag in
                        NeutralChip(title: tag.label)
                            .accessibilityLabel(tag.title ?? tag.label)
                    }
                }

                HStack(spacing: 18) {
                    HStack(spacing: 4) {
                        LucideIcon(
                            .heart,
                            size: TBIcon.Size.small,
                            strokeWidth: TBIcon.Stroke.regular,
                            filled: item.liked
                        )
                        Text("좋아요")
                    }
                    HStack(spacing: 4) {
                        LucideIcon(
                            .messageCircle,
                            size: TBIcon.Size.small,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        Text("\(item.commentCount)")
                    }
                    HStack(spacing: 4) {
                        LucideIcon(
                            .send,
                            size: TBIcon.Size.small,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        Text("공유")
                    }
                    Spacer()
                    Text("자세히")
                }
                .font(TBFont.semibold(11))
                .foregroundStyle(TBColor.textHint)
            }
        }
    }
}

struct DishFeedbackDetailSheet: View {
    let item: DiningDishFeedbackItem
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    SectionCard(background: primaryAxis.tintColor.opacity(0.8)) {
                        VStack(alignment: .leading, spacing: 14) {
                            HStack(alignment: .top, spacing: 14) {
                                ZStack {
                                    Circle()
                                        .fill(TBColor.surface)
                                    Circle()
                                        .stroke(primaryAxis.mainColor.opacity(0.24), lineWidth: 1)
                                    VStack(spacing: 5) {
                                        LucideIcon(
                                            systemName: primaryAxis.symbol,
                                            size: TBIcon.Size.large,
                                            strokeWidth: TBIcon.Stroke.regular
                                        )
                                        Text(primaryAxis.label)
                                            .font(TBFont.bold(13))
                                    }
                                    .foregroundStyle(primaryAxis.tintTextColor)
                                }
                                .frame(width: 92, height: 92)

                                VStack(alignment: .leading, spacing: 6) {
                                    Text(item.dishTitle)
                                        .font(TBFont.bold(18))
                                        .foregroundStyle(primaryAxis.tintTextColor)
                                    Text(item.restaurantName)
                                        .font(TBFont.semibold(12))
                                        .foregroundStyle(primaryAxis.tintTextColor.opacity(0.72))
                                    Text(item.reactionLabel)
                                        .font(TBFont.semibold(12))
                                        .foregroundStyle(primaryAxis.mainColor)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(TBColor.surface)
                                        .clipShape(Capsule())
                                }

                                Spacer()
                            }

                            Text(item.summary)
                                .font(TBFont.regular(13))
                                .foregroundStyle(primaryAxis.tintTextColor.opacity(0.82))
                                .lineSpacing(4)
                        }
                    }

                    TBPageSection(
                        title: "짧은 기록",
                        subtitle: "한 접시에서 남은 감각 단서를 다음 추천과 chef-ready guidance에 연결합니다."
                    ) {
                        VStack(spacing: 10) {
                            StatusRow(
                                icon: "sparkles",
                                title: "메인 반응",
                                detail: item.reactionLabel,
                                tone: .success
                            )
                            StatusRow(
                                icon: "text.bubble",
                                title: "댓글",
                                detail: "\(item.commentCount)개",
                                tone: .neutral
                            )
                        }
                    }

                    TBPageSection(title: "세부 태그") {
                        LazyVGrid(
                            columns: [GridItem(.adaptive(minimum: 92), spacing: 8, alignment: .leading)],
                            alignment: .leading,
                            spacing: 8
                        ) {
                            ForEach(item.detailTags) { tag in
                                NeutralChip(title: tag.label)
                                    .accessibilityLabel(tag.title ?? tag.label)
                            }
                        }
                    }

                    TBPageSection(title: "Taste bubbles") {
                        SectionCard {
                            HStack {
                                TasteBubbleRow(bubbles: item.tasteBubbles)
                                Spacer()
                                Text(item.tasteBubbles.map(\.label).joined(separator: " · "))
                                    .font(TBFont.regular(12))
                                    .foregroundStyle(TBColor.textHint)
                            }
                        }
                    }
                }
                .tbPageContentPadding()
            }
            .navigationTitle("디시 상세")
            .tbInlineNavigationTitle()
            .tbPageBackground()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
    }

    private var primaryAxis: TasteAxis {
        item.primaryTasteAxis
    }
}

struct DishActionSheet: View {
    let item: DiningDishFeedbackItem
    let editableEntry: DiningEntry?
    let onClose: () -> Void
    let onShowDetail: () -> Void
    let onEdit: (DiningEntry) -> Void
    let onDelete: (UUID) -> Void
    @State private var showsDeleteAlert = false

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: onClose)),
            headerCenter: AnyView(
                Text("디시 옵션")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                actionList
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.top, 8)
                    .padding(.bottom, TBSpacing.page + 24)
            }
        }
        .alert("이 디시 기록을 삭제할까요?", isPresented: $showsDeleteAlert) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) {
                if let id = editableEntry?.id {
                    onDelete(id)
                }
            }
        } message: {
            Text("삭제한 기록은 이 기기의 프로필 정교화 기준에서 제외됩니다.")
        }
    }

    private var actionList: some View {
        VStack(spacing: 10) {
            ActionSheetRow(
                icon: "eye",
                title: editableEntry?.hasCompletedTasteFeedback == false
                    ? "식사 기록 보기"
                    : "디시 상세 보기",
                detail: editableEntry?.hasCompletedTasteFeedback == false
                    ? "먼저 담아둔 사진과 식당을 확인합니다"
                    : "메인 미각, 짧은 기록, 태그를 확인합니다"
            ) {
                onShowDetail()
            }

            ActionSheetRow(
                icon: "square-pen",
                title: editableEntry?.hasCompletedTasteFeedback == false
                    ? "취향 덧붙이기"
                    : "후기 수정",
                detail: editableEntry == nil
                    ? "샘플 카드는 수정할 수 없습니다"
                    : editableEntry?.hasCompletedTasteFeedback == false
                        ? "메뉴를 고르고 미각 인상을 이어서 남깁니다"
                        : "레스토랑, 메뉴, 만족도, 노트를 다시 정리합니다",
                isDisabled: editableEntry == nil
            ) {
                guard let editableEntry else { return }
                onEdit(editableEntry)
            }

            ShareLink(item: shareText) {
                ActionSheetRowContent(
                    icon: "square.and.arrow.up",
                    title: "공유",
                    detail: "이 디시 기록의 요약을 공유합니다"
                )
            }
            .buttonStyle(.plain)

            ActionSheetRow(
                icon: "trash",
                title: "삭제",
                detail: editableEntry == nil ? "샘플 카드는 삭제할 수 없습니다" : "이 기기에서 기록을 삭제합니다",
                isDestructive: true,
                isDisabled: editableEntry == nil
            ) {
                showsDeleteAlert = true
            }
        }
    }

    private var shareText: String {
        "\(item.restaurantName) \(item.dishTitle): \(item.summary)"
    }
}

private struct ActionSheetRow: View {
    let icon: String
    let title: String
    let detail: String
    var isDestructive = false
    var isDisabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ActionSheetRowContent(
                icon: icon,
                title: title,
                detail: detail,
                isDestructive: isDestructive,
                isDisabled: isDisabled
            )
        }
        .buttonStyle(TBTokenButtonStyle())
        .disabled(isDisabled)
    }
}

private struct ActionSheetRowContent: View {
    let icon: String
    let title: String
    let detail: String
    var isDestructive = false
    var isDisabled = false

    var body: some View {
        SectionCard(background: isDisabled ? TBColor.disabledSurface : TBColor.surface, showsBorder: false) {
            HStack(spacing: 12) {
                LucideIcon(
                    systemName: icon,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .frame(width: 36, height: 36)
                    .foregroundStyle(iconColor)
                    .background(iconBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(titleColor)
                    Text(detail)
                        .font(TBFont.regular(11))
                        .foregroundStyle(isDisabled ? TBColor.textDisabled : TBColor.textHint)
                        .lineLimit(2)
                }

                Spacer()
                LucideIcon(
                    .chevronRight,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .foregroundStyle(isDisabled ? TBColor.textDisabled : TBColor.textHint)
            }
        }
    }

    private var iconColor: Color {
        guard !isDisabled else {
            return TBColor.textDisabled
        }

        return isDestructive ? TBColor.destructive : TBColor.textSecondary
    }

    private var iconBackground: Color {
        guard !isDisabled else {
            return TBColor.disabledSurface
        }

        return isDestructive ? TBColor.destructive.opacity(0.08) : TBColor.mutedSurface
    }

    private var titleColor: Color {
        guard !isDisabled else {
            return TBColor.textDisabled
        }

        return isDestructive ? TBColor.destructive : TBColor.textPrimary
    }
}

enum DiningFeedbackStartMode {
    case menu
    case cameraCapture
    case overallEvaluation
    case tasteMap
    case details
}

private enum DiningFeedbackResultKind {
    case quickCapture
    case tasteFeedback
}

enum DiningFeedbackDishKindAutoSelection {
    static let defaultLimit = 4

    static func inferredKindIDs(
        for dish: DiningFeedbackDishContract,
        limit: Int = defaultLimit
    ) -> [String] {
        inferredKindIDs(
            menuTitle: dish.title,
            subtitle: dish.subtitle,
            ingredients: dish.ingredients,
            techniques: dish.techniques,
            flavorNotes: dish.flavorNotes,
            limit: limit
        )
    }

    static func inferredKindIDs(
        menuTitle: String,
        subtitle: String? = nil,
        ingredients: [String] = [],
        techniques: [String] = [],
        flavorNotes: [String] = [],
        limit: Int = defaultLimit
    ) -> [String] {
        let trimmedTitle = menuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else { return [] }

        let menuContext = TasteBuddyAgent.inferMenuContext(trimmedTitle)
        let keywordKinds = TasteBuddyAgent.inferDishKindIds(
            title: trimmedTitle,
            subtitle: subtitle,
            ingredients: ingredients + menuContext.ingredients,
            techniques: techniques + menuContext.techniques,
            flavorNotes: flavorNotes,
            limit: limit
        )

        return uniqueIDs(menuContext.dishKindIds + keywordKinds, limit: limit)
    }

    private static func uniqueIDs(_ ids: [String], limit: Int) -> [String] {
        var seen = Set<String>()
        var unique: [String] = []

        for id in ids {
            let trimmedID = id.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmedID.isEmpty, !seen.contains(trimmedID) else { continue }

            seen.insert(trimmedID)
            unique.append(trimmedID)

            if unique.count >= limit {
                break
            }
        }

        return unique
    }
}

private struct DirectMenuInputFramePreferenceKey: PreferenceKey {
    static var defaultValue: CGRect = .null

    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        value = nextValue()
    }
}

private struct DirectMenuOptionCardsFramePreferenceKey: PreferenceKey {
    static var defaultValue: CGRect = .null

    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        value = nextValue()
    }
}

private struct PendingDeletedCustomMenu: Identifiable, Equatable {
    let id = UUID()
    let customIndex: Int?
    let dish: DiningFeedbackDishContract
    let restaurantKey: String?
    let restaurantName: String
    let selectedDishID: String?
}

enum DiningFeedbackTasteBloomTransitionMetrics {
    static let duration = TasteBloomMotion.duration(.bloom, reduceMotion: false)
    static let dismissalDuration = TasteBloomMotion.duration(.sheet, reduceMotion: false)
    static let dismissalFadeStartProgress = 1 - TasteBloomMotion.duration(.press, reduceMotion: false) / dismissalDuration
    static let reducedMotionDuration: TimeInterval = 0
    static let fadeOutDuration = TasteBloomMotion.duration(.feedback, reduceMotion: false)
    static let reducedMotionFadeOutDuration: TimeInterval = 0
}

private struct DiningFeedbackTasteBloomDismissalModifier: ViewModifier {
    let isActive: Bool
    let origin: CGPoint?
    let progress: Double

    @ViewBuilder
    func body(content: Content) -> some View {
        if isActive {
            content
                .compositingGroup()
                .mask {
                    DiningFeedbackTasteBloomCollapseMask(
                        origin: origin,
                        progress: progress
                    )
                }
        } else {
            content
        }
    }
}

private struct TasteMapChromeGlass<ChromeShape: Shape>: ViewModifier {
    let shape: ChromeShape
    var isInteractive = false

    @ViewBuilder
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.glassEffect(.clear.interactive(isInteractive), in: shape)
        } else {
            content.background(.ultraThinMaterial, in: shape)
        }
    }
}

struct DiningFeedbackSheet: View {
    private enum Phase: Equatable {
        case menu
        case restaurantSelection
        case overallEvaluation
        case tasteWords
        case detailTags
        case cameraCapture
        case reflection
        case result
    }

    private static let menuSelectionCoordinateSpace = "DiningFeedbackMenuSelection"
    private static let directMenuInputScrollID = "DiningFeedbackDirectMenuInput"
    private static let directRestaurantInputScrollID = "DiningFeedbackDirectRestaurantInput"
    private static let outsideTapTranslationTolerance: CGFloat = 8
    private enum ResultShareOption: CaseIterable, Identifiable {
        case instagramStory
        case copy
        case saveImage
        case copyLink

        var id: Self { self }

        var title: String {
            switch self {
            case .instagramStory:
                "Instagram"
            case .copy:
                "이미지 복사"
            case .saveImage:
                "사진 저장"
            case .copyLink:
                "링크 복사"
            }
        }

        var detail: String {
            switch self {
            case .instagramStory:
                "스토리 편집 화면으로 결과 카드를 보냅니다"
            case .copy:
                "전체 공유 화면을 이미지로 복사합니다"
            case .saveImage:
                "결과 카드를 사진 보관함에 저장합니다"
            case .copyLink:
                "이 기록을 다시 열 수 있는 링크를 복사합니다"
            }
        }

        var icon: LucideIconName {
            switch self {
            case .instagramStory:
                .camera
            case .copy:
                .copy
            case .saveImage:
                .circleArrowDown
            case .copyLink:
                .link
            }
        }
    }

    private let entry: DiningEntry?
    private let fixture: DiningFeedbackFixtureContract?
    private let tasteExperienceAxes: [TasteExperienceAxisContract]
    private let tasteExperiences: [TasteExperience]
    private let detailTagCategories: [DiningFeedbackTagCategoryContract]
    private let baseTasteExperiencePositions: [TasteExperienceBubblePosition]
    private let tasteExperienceIntroDelays: [String: TimeInterval]
    private let startsWithLaunchTransition: Bool
    private let launchOrigin: CGPoint?
    let onClose: (() -> Void)?
    let onSave: (DiningEntry) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appModel: AppModel
    @State private var phase: Phase
    @State private var selectedDishIndex: Int?
    @State private var selectedRestaurantCandidateID: String?
    @State private var usesRestaurantDirectInput = false
    @State private var directRestaurantName: String
    @FocusState private var isDirectRestaurantInputFocused: Bool
    @State private var confirmedRestaurantName: String?
    @State private var usesDirectInput = false
    @State private var directMenuTitle = ""
    @FocusState private var isDirectMenuInputFocused: Bool
    @StateObject private var menuKeyboard = BottomComposerKeyboardObserver()
    @State private var customDishes: [DiningFeedbackDishContract] = []
    @State private var editingCustomDishID: String?
    @State private var editingCustomDishOriginalTitle: String?
    @State private var directMenuOptionCardsFrame: CGRect = .null
    @State private var directMenuInputFrame: CGRect = .null
    @State private var isTrackingDirectMenuOutsideTap = false
    @State private var directMenuOutsideTapStartedOpen = false
    @State private var pendingDeletedMenu: PendingDeletedCustomMenu?
    @StateObject private var deletionToast = TBToastPresenter()
    @State private var selectedKindIDs: Set<String> = []
    @State private var selectedExperienceIDs: [String]
    @State private var focusedExperienceID: String?
    @State private var focusRequest: TasteExperienceMapFocusRequest?
    @State private var isTasteMapInteracting = false
    @State private var isTasteSearchPresented = false
    @State private var tasteMapVeilOpacity = 1.0
    @State private var selectedDetailTagIDs: [String]
    @State private var sensorySelections: [DiningSensorySelection]
    @State private var overallEvaluation: DiningOverallEvaluation?
    @State private var activeDetailExperienceIndex = 0
    @State private var reflectionNote: String
    @State private var reflectionPhotoData: Data?
    @State private var reflectionPhotoFilename: String?
    @State private var photoPickerItem: PhotosPickerItem?
    @State private var photoLoadTask: Task<Void, Never>?
    @State private var photoLoadRequestID = UUID()
    @State private var cameraSessionID = UUID()
    @State private var restaurantResolutionTask: Task<Void, Never>?
    @State private var photoLoadError: String?
    @State private var pendingCaptureLocation: CLLocation?
    @State private var cameraClosePhase: Phase?
    @State private var customTagCategoryID: String?
    @State private var customTagLabel = ""
    @State private var isResultChromeVisible = false
    @State private var isResultShareSheetPresented = false
    @State private var resultShareSheetDragTranslation: CGFloat = 0
    @State private var isDraggingResultShareSheet = false
    @State private var canDragResultShareSheet = false
    @State private var resultSharePreviewImage: UIImage?
    @State private var resultShareStatusMessage: String?
    @State private var resultKind: DiningFeedbackResultKind
    @State private var capturedPhotoPalette: DiningPhotoPalette?
    @State private var quickSavedEntryID: UUID?
    @State private var workingEntryDate: Date
    @State private var didRestoreEntryMenuSelection = false
    @State private var showsLaunchTransitionOverlay: Bool
    @State private var isRunningTasteBloomDismissal = false
    @State private var tasteBloomDismissalProgress = 0.0
    @State private var terminalDismissalOpacity = 1.0
    @StateObject private var cameraModel = DiningFeedbackCameraModel()
    @StateObject private var restaurantResolver = DiningFeedbackRestaurantResolver()

    init(
        entry: DiningEntry? = nil,
        startMode: DiningFeedbackStartMode = .menu,
        showsLaunchTransition: Bool = false,
        launchOrigin: CGPoint? = nil,
        onClose: (() -> Void)? = nil,
        onSave: @escaping (DiningEntry) -> Void
    ) {
        let loadedFixture = try? DiningFeedbackFixtureLoader.load()
        let axes = loadedFixture?.tasteExperienceAxes ?? []
        let experiences = loadedFixture?.tasteExperiences ?? []
        let positions = TasteExperienceMapEngine.basePositions(axes: axes)
        let validExperienceIDs = Set(experiences.map(\.id))
        let legacyExperienceIDs = (entry?.tasteExperienceIDs ?? [])
            .filter { validExperienceIDs.contains($0) }
            .prefix(3)
        let restoredSelections: [DiningSensorySelection]
        if let storedSelections = entry?.sensorySelections {
            restoredSelections = storedSelections
        } else {
            let bubbleSelections = legacyExperienceIDs.compactMap { id in
                experiences.first(where: { $0.id == id }).map {
                    DiningSensorySelection(
                        id: id,
                        type: .bubble,
                        labelSnapshot: $0.label
                    )
                }
            }
            let detailSelections = (entry?.detailTagIDs ?? []).map { id in
                DiningSensorySelection(
                    id: id,
                    type: .detailTag,
                    labelSnapshot: DiningDetailTagCatalog.metadata(for: id)?.label ?? id
                )
            }
            restoredSelections = bubbleSelections + detailSelections
        }
        let restoredExperienceIDs = restoredSelections
            .filter { $0.type == .bubble && validExperienceIDs.contains($0.id) }
            .map(\.id)
            .prefix(3)
        let restoredDetailTagIDs = restoredSelections
            .filter { $0.type == .detailTag }
            .map(\.id)

        self.entry = entry
        fixture = loadedFixture
        tasteExperienceAxes = axes
        tasteExperiences = experiences
        detailTagCategories = loadedFixture?.detailTagCategories ?? []
        baseTasteExperiencePositions = positions
        tasteExperienceIntroDelays = TasteExperienceMapEngine.introDelays(
            axes: axes,
            positions: positions
        )
        startsWithLaunchTransition = showsLaunchTransition && startMode == .cameraCapture
        self.launchOrigin = launchOrigin
        self.onClose = onClose
        self.onSave = onSave
        let initialPhase: Phase
        switch startMode {
        case .cameraCapture:
            initialPhase = .cameraCapture
        case .details where !restoredExperienceIDs.isEmpty:
            initialPhase = .detailTags
        case .tasteMap where DiningSensoryRecommendationPolicy.isSupported(
            entry?.overallEvaluation
        ):
            initialPhase = .tasteWords
        case .overallEvaluation, .tasteMap:
            initialPhase = .overallEvaluation
        case .menu, .details:
            initialPhase = .menu
        }
        _phase = State(initialValue: initialPhase)
        _directRestaurantName = State(initialValue: entry?.restaurant ?? "")
        _confirmedRestaurantName = State(initialValue: entry?.restaurant)
        _directMenuTitle = State(initialValue: entry?.menu ?? "")
        _selectedKindIDs = State(
            initialValue: Set(
                entry?.dishKindIDs.isEmpty == false
                    ? entry?.dishKindIDs ?? []
                    : []
            )
        )
        _selectedExperienceIDs = State(initialValue: Array(restoredExperienceIDs))
        _focusedExperienceID = State(initialValue: restoredExperienceIDs.first)
        _selectedDetailTagIDs = State(initialValue: restoredDetailTagIDs)
        _sensorySelections = State(initialValue: restoredSelections)
        _overallEvaluation = State(initialValue: entry?.overallEvaluation)
        _reflectionNote = State(initialValue: entry?.note ?? "")
        _reflectionPhotoFilename = State(initialValue: entry?.reflectionPhotoFilename)
        _reflectionPhotoData = State(
            initialValue: DiningReflectionPhotoStore.data(
                for: entry?.reflectionPhotoFilename
            )
        )
        _resultKind = State(
            initialValue: entry?.feedbackStatus == .captured
                ? .quickCapture
                : .tasteFeedback
        )
        _capturedPhotoPalette = State(initialValue: entry?.photoPalette)
        _quickSavedEntryID = State(
            initialValue: entry?.feedbackStatus == .captured ? entry?.id : nil
        )
        _workingEntryDate = State(initialValue: entry?.date ?? .now)
        _showsLaunchTransitionOverlay = State(
            initialValue: showsLaunchTransition && startMode == .cameraCapture
        )
    }

    var body: some View {
        ZStack {
            phaseView
                .transition(.opacity)

            if showsLaunchTransitionOverlay {
                DiningFeedbackTasteBloomTransitionOverlay(launchOrigin: launchOrigin)
                    .transition(.opacity)
                    .zIndex(20)
            }
        }
        .tasteBloomMotion(.content, value: phase)
        .modifier(
            DiningFeedbackTasteBloomDismissalModifier(
                isActive: isRunningTasteBloomDismissal && !reduceMotion,
                origin: launchOrigin,
                progress: tasteBloomDismissalProgress
            )
        )
        .opacity(terminalDismissalOpacity)
        .allowsHitTesting(!isRunningTasteBloomDismissal)
        .tbScreenTopChrome(
            isEnabled: phase != .tasteWords && phase != .cameraCapture && phase != .result
        )
        .background {
            if phase == .menu || phase == .restaurantSelection {
                TBColor.page.ignoresSafeArea()
            }
        }
        .preferredColorScheme(.light)
        .presentationBackground(.clear)
        .edgeSwipeBack(
            isEnabled: !isTasteSearchPresented
                && !isResultShareSheetPresented
                && !isTasteMapInteracting,
            action: handleEdgeSwipeBack
        )
        .task(id: showsLaunchTransitionOverlay) {
            await dismissLaunchTransitionAfterDelay()
        }
        .task(id: isRunningTasteBloomDismissal) {
            await finishTasteBloomDismissalAfterDelay()
        }
        // Keep one picker consumer alive across the detail/reflection phase transition.
        .onChange(of: photoPickerItem) { _, item in
            guard let item, photoPickerItem == item else { return }
            startLoadingReflectionPhoto(from: item)
        }
        .onChange(of: phase) { previousPhase, nextPhase in
            if previousPhase == .cameraCapture, nextPhase != .cameraCapture {
                cancelPhotoLoading()
            }
        }
        .onDisappear {
            cancelPhotoLoading()
            restaurantResolutionTask?.cancel()
            restaurantResolutionTask = nil
        }
    }

    @ViewBuilder
    private var phaseView: some View {
        switch phase {
        case .menu:
            menuSelectionView
        case .restaurantSelection:
            restaurantSelectionView
        case .overallEvaluation:
            DiningOverallEvaluationStepView(
                evaluation: $overallEvaluation,
                onBack: { phase = .menu },
                onContinue: {
                    prepareTasteMapFocus()
                    phase = .tasteWords
                }
            )
        case .tasteWords:
            tasteWordsView
        case .detailTags:
            detailTagsView
        case .cameraCapture:
            cameraCaptureView
        case .reflection:
            reflectionView
        case .result:
            resultView
        }
    }

    private func dismissLaunchTransitionAfterDelay() async {
        guard startsWithLaunchTransition, showsLaunchTransitionOverlay else {
            return
        }

        let delay = reduceMotion
            ? DiningFeedbackTasteBloomTransitionMetrics.reducedMotionDuration
            : DiningFeedbackTasteBloomTransitionMetrics.duration
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        guard !Task.isCancelled else {
            return
        }

        withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion)) {
            showsLaunchTransitionOverlay = false
        }
    }

    private var restaurantSelectionView: some View {
        ScrollViewReader { scrollProxy in
            restaurantSelectionContent
                .onChange(of: menuKeyboard.visibleHeight) { previousHeight, currentHeight in
                    guard previousHeight <= 0, currentHeight > 0 else { return }
                    revealDirectRestaurantInput(using: scrollProxy)
                }
        }
    }

    private var isEditingDirectRestaurantWithKeyboard: Bool {
        usesRestaurantDirectInput && isDirectRestaurantInputFocused && menuKeyboard.visibleHeight > 0
    }

    private func revealDirectRestaurantInput(using scrollProxy: ScrollViewProxy) {
        guard isEditingDirectRestaurantWithKeyboard else { return }

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            scrollProxy.scrollTo(Self.directRestaurantInputScrollID, anchor: .bottom)
        }
    }

    private var restaurantSelectionContent: some View {
        ZStack(alignment: .bottom) {
            TBColor.page
                .ignoresSafeArea()
                .allowsHitTesting(false)

            VStack(spacing: 0) {
                TBFlowTopBar(
                    title: "식후 피드백",
                    showsDivider: false,
                    backgroundColor: TBColor.page,
                    leadingIconSize: TBIcon.Size.large,
                    leadingIconStrokeWidth: TBIcon.Stroke.medium,
                    leadingAction: closeFeedback
                )

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        DiningFeedbackIntroHeader(
                            title: "어느 식당에서 남긴 기록인가요?",
                            subtitle: "사진 위치를 기준으로 가까운 식당 후보를 먼저 정리했어요. 맞는 식당을 고르거나, 보이지 않으면 직접 입력해 주세요.",
                            contextText: restaurantResolver.statusText
                        )

                        VStack(spacing: 12) {
                            if restaurantResolver.isLoading {
                                SectionCard {
                                    HStack(spacing: 12) {
                                        ProgressView()
                                            .tint(TBColor.textSecondary)
                                        Text("사진 위치 주변의 식당 후보를 찾고 있어요.")
                                            .font(TBFont.regular(12))
                                            .foregroundStyle(TBColor.textSubtle)
                                    }
                                }
                            }

                            ForEach(restaurantResolver.candidates) { candidate in
                                TBSelectionCard(
                                    title: candidate.name,
                                    description: candidate.detailText,
                                    indicator: .radio,
                                    isSelected: selectedRestaurantCandidateID == candidate.id && !usesRestaurantDirectInput,
                                    showsUnselectedBorder: false
                                ) {
                                    selectedRestaurantCandidateID = candidate.id
                                    usesRestaurantDirectInput = false
                                    isDirectRestaurantInputFocused = false
                                }
                            }

                            TBSelectionCard(
                                title: "직접 입력",
                                description: "사진 위치가 다르거나 후보가 맞지 않으면 식당명을 직접 남길 수 있어요.",
                                indicator: .radio,
                                isSelected: usesRestaurantDirectInput,
                                showsUnselectedBorder: false
                            ) {
                                selectedRestaurantCandidateID = nil
                                usesRestaurantDirectInput.toggle()
                                if !usesRestaurantDirectInput {
                                    isDirectRestaurantInputFocused = false
                                }
                            }

                            if usesRestaurantDirectInput {
                                SectionCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("식당명 직접 입력")
                                            .font(TBFont.semibold(14))
                                            .foregroundStyle(TBColor.textPrimary)

                                        TBTextInput(
                                            text: $directRestaurantName,
                                            placeholder: "예: 정식당",
                                            accessibilityName: "식당명",
                                            focus: $isDirectRestaurantInputFocused,
                                            onSubmit: continueRestaurantSelection
                                        )
                                    }
                                }
                                .id(Self.directRestaurantInputScrollID)
                            }
                        }
                    }
                    .tbPageContentPadding(bottom: TBSpacing.page + 156)
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
                .scrollClipDisabled()
                .scrollDismissesKeyboard(.interactively)
                .padding(.bottom, isEditingDirectRestaurantWithKeyboard ? TBSpacing.x12 : 0)
            }

            TBFlowStepCTA(
                actionLabel: "식당 확인하고 메뉴 선택",
                currentIndex: 0,
                total: 1,
                isEnabled: canContinueRestaurantSelection,
                backgroundColor: TBColor.page,
                showsIndicator: false,
                action: continueRestaurantSelection
            )
            .opacity(isEditingDirectRestaurantWithKeyboard ? 0 : 1)
            .allowsHitTesting(!isEditingDirectRestaurantWithKeyboard)
            .accessibilityHidden(isEditingDirectRestaurantWithKeyboard)
        }
    }

    private var menuSelectionView: some View {
        ScrollViewReader { scrollProxy in
            menuSelectionContent
                .onChange(of: menuKeyboard.visibleHeight) { previousHeight, currentHeight in
                    guard previousHeight <= 0, currentHeight > 0 else { return }
                    revealDirectMenuInput(using: scrollProxy)
                }
        }
    }

    private var isEditingDirectMenuWithKeyboard: Bool {
        usesDirectInput && isDirectMenuInputFocused && menuKeyboard.visibleHeight > 0
    }

    private func revealDirectMenuInput(using scrollProxy: ScrollViewProxy) {
        guard isEditingDirectMenuWithKeyboard else { return }

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            scrollProxy.scrollTo(Self.directMenuInputScrollID, anchor: .bottom)
        }
    }

    private var menuSelectionContent: some View {
        ZStack(alignment: .bottom) {
            TBColor.page
                .ignoresSafeArea()
                .allowsHitTesting(false)

            VStack(spacing: 0) {
                TBFlowTopBar(
                    title: "식후 피드백",
                    showsDivider: false,
                    backgroundColor: TBColor.page,
                    leadingIconSize: TBIcon.Size.large,
                    leadingIconStrokeWidth: TBIcon.Stroke.medium,
                    leadingAction: closeFeedback
                )

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        DiningFeedbackIntroHeader(
                            title: "어떤 메뉴를 먼저 기록할까요?",
                            subtitle: "가장 선명하게 기억나는 메뉴부터 선택해 주세요.",
                            contextText: menuContextLabel
                        )

                        VStack(spacing: 12) {
                            VStack(spacing: 12) {
                                ForEach(Array(feedbackDishes.enumerated()), id: \.element.id) { index, dish in
                                    if isEditableUserMenu(dish) {
                                        SwipeableCustomMenuCard(
                                            title: dish.title,
                                            description: menuCardDishKindDescription(for: dish),
                                            isSelected: selectedDishIndex == index && !usesDirectInput,
                                            onSelect: {
                                                selectDish(at: index)
                                            },
                                            onEdit: {
                                                startEditingCustomDish(dish)
                                            },
                                            onDelete: {
                                                deleteCustomDish(dish)
                                            }
                                        )
                                        .transition(menuCardRemovalTransition)
                                    } else {
                                        TBSelectionCard(
                                            title: dish.title,
                                            description: menuCardDishKindDescription(for: dish),
                                            indicator: .radio,
                                            isSelected: selectedDishIndex == index && !usesDirectInput,
                                            showsUnselectedBorder: false
                                        ) {
                                            selectDish(at: index)
                                        }
                                        .transition(menuCardRemovalTransition)
                                    }
                                }

                                TBSelectionCard(
                                    title: "직접 입력",
                                    description: "코스 목록에 없는 메뉴도 미각 기록으로 남길 수 있어요.",
                                    indicator: .radio,
                                    isSelected: usesDirectInput,
                                    showsUnselectedBorder: false
                                ) {
                                    if usesDirectInput {
                                        dismissDirectMenuInput()
                                    } else {
                                        openDirectMenuInput()
                                    }
                                }
                            }
                            .background {
                                GeometryReader { proxy in
                                    Color.clear.preference(
                                        key: DirectMenuOptionCardsFramePreferenceKey.self,
                                        value: proxy.frame(
                                            in: .named(Self.menuSelectionCoordinateSpace)
                                        )
                                    )
                                }
                            }

                            if usesDirectInput {
                                SectionCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text(editingCustomDishID == nil ? "메뉴 직접 입력" : "메뉴 수정")
                                            .font(TBFont.semibold(14))
                                            .foregroundStyle(TBColor.textPrimary)

                                        HStack(spacing: 8) {
                                            TBTextInput(
                                                text: $directMenuTitle,
                                                placeholder: "예: 오미자와 배 디저트",
                                                accessibilityName: "메뉴명",
                                                focus: $isDirectMenuInputFocused,
                                                onSubmit: addCustomDish
                                            )

                                            Button(action: addCustomDish) {
                                                let isDisabled = directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty

                                                Text(directMenuActionLabel)
                                                    .font(TBFont.semibold(12))
                                                    .foregroundStyle(isDisabled ? TBColor.textDisabled : TBColor.textInverse)
                                                    .padding(.horizontal, 16)
                                                    .frame(height: 44)
                                                    .background(isDisabled ? TBColor.disabledSurface : TBColor.textPrimary)
                                                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                                            }
                                            .buttonStyle(TBTokenButtonStyle())
                                            .disabled(directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                                        }
                                    }
                                }
                                .background {
                                    GeometryReader { proxy in
                                        Color.clear.preference(
                                            key: DirectMenuInputFramePreferenceKey.self,
                                            value: proxy.frame(
                                                in: .named(Self.menuSelectionCoordinateSpace)
                                            )
                                        )
                                    }
                                }
                                .id(Self.directMenuInputScrollID)
                            }
                        }

                        if selectedDish != nil {
                            SectionCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack(alignment: .top, spacing: 12) {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("디시 종류")
                                                .font(TBFont.bold(14))
                                                .foregroundStyle(TBColor.textPrimary)

                                            Text("추천 태그를 먼저 골라두었어요. 메뉴와 다르면 직접 바꿔주세요.")
                                                .font(TBFont.regular(12))
                                                .foregroundStyle(TBColor.textSubtle)
                                                .lineSpacing(3)
                                        }

                                        Spacer()

                                        Text("선택사항")
                                            .font(TBFont.semibold(11))
                                            .foregroundStyle(TBColor.textFaint)
                                    }

                                    TBWrapLayout(spacing: 8) {
                                        ForEach(fixture?.dishKindOptions ?? []) { kind in
                                            TBSelectableChip(
                                                title: kind.label,
                                                iconName: LucideIcon.dishKindSymbol(for: kind.id),
                                                isSelected: selectedKindIDs.contains(kind.id)
                                            ) {
                                                toggleKind(kind.id)
                                            }
                                        }

                                        DiningFeedbackAddChipButton(
                                            accessibilityLabel: "디시 종류 직접 입력"
                                        ) {}
                                    }
                                }
                            }
                        }
                    }
                    .tbPageContentPadding(bottom: TBSpacing.page + 156)
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
                .scrollClipDisabled()
                .scrollDismissesKeyboard(.interactively)
                .padding(.bottom, isEditingDirectMenuWithKeyboard ? TBSpacing.x12 : 0)
            }

            TBFlowStepCTA(
                actionLabel: "취향까지 기록",
                currentIndex: 0,
                total: 1,
                isEnabled: selectedDish != nil,
                backgroundColor: TBColor.page,
                showsIndicator: false,
                secondaryActionLabel: canOfferQuickCapture ? "여기까지만 저장" : nil,
                secondaryAction: canOfferQuickCapture ? saveQuickCapture : nil,
                secondaryButtonEnabled: canSaveQuickCapture,
                secondaryButtonVisualDisabled: !canSaveQuickCapture,
                action: {
                    phase = .overallEvaluation
                }
            )
            .opacity(isEditingDirectMenuWithKeyboard ? 0 : 1)
            .allowsHitTesting(!isEditingDirectMenuWithKeyboard)
            .accessibilityHidden(isEditingDirectMenuWithKeyboard)

            if let pendingDeletedMenu {
                ToastSurface(
                    title: "메뉴를 삭제했어요",
                    message: pendingDeletedMenu.dish.title,
                    messageLineLimit: 1,
                    icon: .trash2,
                    tone: .destructive,
                    actionTitle: "되돌리기",
                    action: restoreDeletedCustomDish
                )
                .padding(.horizontal, TBSpacing.page)
                .padding(.bottom, 96)
                .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
                .zIndex(10)
            }
        }
        .coordinateSpace(name: Self.menuSelectionCoordinateSpace)
        .onPreferenceChange(DirectMenuInputFramePreferenceKey.self) { frame in
            directMenuInputFrame = frame
        }
        .onPreferenceChange(DirectMenuOptionCardsFramePreferenceKey.self) { frame in
            directMenuOptionCardsFrame = frame
        }
        .simultaneousGesture(directMenuOutsideTapGesture)
        .animation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion), value: feedbackDishes.map(\.id))
        .onChange(of: pendingDeletedMenu?.id) { _, _ in
            presentMenuDeletionToast()
        }
        .onAppear {
            presentMenuDeletionToast()
            restoreEntryMenuSelectionIfNeeded()
            if phase == .tasteWords, focusedExperienceID == nil {
                prepareTasteMapFocus()
            }
        }
        .onDisappear {
            deletionToast.cancel()
        }
        .alert("사진을 저장하지 못했어요", isPresented: photoLoadErrorBinding) {
            Button("확인", role: .cancel) {
                photoLoadError = nil
            }
        } message: {
            Text(photoLoadError ?? "")
        }
    }

    private var tasteWordsView: some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottom) {
                Group {
                    if baseTasteExperiencePositions.isEmpty {
                        HospitalityEmptyState(
                            title: "미각 지도를 불러오지 못했어요",
                            description: "잠시 뒤 다시 열면 메뉴의 미각 인상을 이어서 기록할 수 있어요."
                        )
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .tbPageContentPadding()
                    } else {
                        TasteExperienceMapViewport(
                            basePositions: baseTasteExperiencePositions,
                            renderedPositions: renderedTasteExperiencePositions,
                            selectedExperienceIDs: selectedExperienceIDs,
                            focusedExperienceID: focusedExperienceID,
                            focusRequest: focusRequest,
                            introDelays: tasteExperienceIntroDelays,
                            reduceMotion: reduceMotion,
                            onFocusedExperienceChange: { focusedExperienceID = $0 },
                            onInteractionChange: { isTasteMapInteracting = $0 },
                            onBubbleTap: handleTasteExperienceTap
                        )
                        .overlay {
                            Color.white
                                .opacity(tasteMapVeilOpacity)
                                .allowsHitTesting(false)
                        }
                        .task {
                            await runTasteMapIntro()
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    tasteMapTopBar

                    Spacer(minLength: 0)
                }

                if let focusedExperience, !isTasteMapInteracting {
                    TasteExperienceSelectionCard(
                        experience: focusedExperience,
                        selectedExperienceIDs: selectedExperienceIDs,
                        experienceByID: experienceByID,
                        onContinue: handleFocusedTasteExperienceAction
                    )
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.bottom, 20)
                    .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .background(TBColor.focus)
        }
        .animation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion), value: isTasteMapInteracting)
        .animation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion), value: focusedExperienceID)
        .sheet(isPresented: $isTasteSearchPresented) {
            TasteExperienceSearchSheet(axes: tasteExperienceAxes) { experience in
                requestTasteExperienceFocus(experience.id)
                isTasteSearchPresented = false
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    private var tasteMapTopBar: some View {
        Group {
            if #available(iOS 26.0, *) {
                GlassEffectContainer(spacing: 0) {
                    tasteMapTopBarContent
                }
            } else {
                tasteMapTopBarContent
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: TBSize.chromeIconButton)
        .zIndex(20)
    }

    private var tasteMapTopBarContent: some View {
        ZStack {
            Text(selectedMenuTitle)
                .font(TBFont.bold(15))
                .foregroundStyle(TBColor.textPrimary)
                .padding(.horizontal, 12)
                .frame(height: TBSize.chromeIconButton)
                .modifier(TasteMapChromeGlass(shape: Capsule()))
                .allowsHitTesting(false)

            HStack {
                Button {
                    phase = .overallEvaluation
                } label: {
                    LucideIcon(
                        .chevronLeft,
                        size: TBIcon.Size.large,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: TBSize.chromeIconButton, height: TBSize.chromeIconButton)
                    .foregroundStyle(TBColor.textSecondary)
                    .modifier(TasteMapChromeGlass(shape: Circle(), isInteractive: true))
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("전체 평가로 돌아가기")

                Spacer()

                HStack(spacing: 8) {
                    if !selectedExperienceIDs.isEmpty {
                        Button {
                            activeDetailExperienceIndex = 0
                            phase = .detailTags
                        } label: {
                            Text("다음")
                                .font(TBFont.semibold(12))
                                .foregroundStyle(TBColor.textPrimary)
                                .padding(.horizontal, 14)
                                .frame(height: TBSize.chromeIconButton)
                                .modifier(TasteMapChromeGlass(shape: Capsule(), isInteractive: true))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("선택한 미각 인상 평가하기")
                    }

                    Button {
                        isTasteSearchPresented = true
                    } label: {
                        LucideIcon(
                            .search,
                            size: TBIcon.Size.large,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        .frame(width: TBSize.chromeIconButton, height: TBSize.chromeIconButton)
                        .foregroundStyle(TBColor.textSecondary)
                        .modifier(TasteMapChromeGlass(shape: Circle(), isInteractive: true))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("미각 단어 검색")
                }
            }
            .padding(.horizontal, TBSpacing.page)
        }
    }

    private var detailTagsView: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                detailFlowTopBar {
                    phase = .tasteWords
                }

                ScrollView {
                    VStack(spacing: 28) {
                        TasteExperienceDetailHero(
                            experiences: selectedExperiences,
                            activeIndex: activeDetailExperienceIndex,
                            onSelectIndex: { activeDetailExperienceIndex = $0 }
                        )

                        if let activeDetailExperience,
                           let selection = sensorySelectionBinding(
                               id: activeDetailExperience.id,
                               type: .bubble
                           ) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("선택한 미각 평가")
                                    .font(TBFont.bold(14))
                                    .foregroundStyle(TBColor.textPrimary)
                                DiningSensorySelectionEditor(
                                    selection: selection,
                                    relatedBubbles: relatedBubbleOptions
                                )
                            }
                        }

                        DiningReflectionEntryCard(
                            photoData: reflectionPhotoData,
                            onOpenNote: { phase = .reflection },
                            onOpenCamera: {
                                openCameraCapture(returningTo: .detailTags)
                            }
                        )

                        VStack(spacing: 28) {
                            if let activeDetailExperience {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack(spacing: 8) {
                                        LucideIcon(
                                            .link,
                                            size: TBIcon.Size.xSmall,
                                            strokeWidth: TBIcon.Stroke.regular
                                        )
                                        Text("새로 고른 디테일 태그는 ‘\(activeDetailExperience.label)’ 버블에 연결돼요.")
                                            .font(TBFont.regular(12))
                                            .lineSpacing(3)
                                    }
                                    Text(DiningSensoryRecommendationPolicy.detailPrompt(for: overallEvaluation))
                                        .font(TBFont.regular(11))
                                        .foregroundStyle(TBColor.textHint)
                                        .lineSpacing(3)
                                }
                                .foregroundStyle(TBColor.textSecondary)
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(TBColor.mutedSurface)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            }

                            ForEach(detailTagCategories) { category in
                                DiningDetailTagSelector(
                                    category: category,
                                    accentAxis: activeDetailExperience?.axis ?? .umami,
                                    selectedTagIDs: selectedDetailTagIDs,
                                    recommendedTagIDs: recommendedDetailTagIDs,
                                    customTags: customTags(in: category.id),
                                    onToggle: toggleDetailTag,
                                    isCustomInputOpen: customTagCategoryID == category.id,
                                    customInputValue: $customTagLabel,
                                    onOpenCustomInput: {
                                        customTagCategoryID = category.id
                                        customTagLabel = ""
                                    },
                                    onCloseCustomInput: {
                                        customTagCategoryID = nil
                                        customTagLabel = ""
                                    },
                                    onSubmitCustomInput: addCustomDetailTag
                                )
                            }

                            if !selectedDetailSelections.isEmpty {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("선택한 디테일 평가")
                                        .font(TBFont.bold(14))
                                        .foregroundStyle(TBColor.textPrimary)
                                    Text("각 태그가 어느 미각과 연결됐는지 확인하고, 필요한 항목만 더 알려주세요.")
                                        .font(TBFont.regular(12))
                                        .foregroundStyle(TBColor.textHint)
                                        .lineSpacing(3)

                                    ForEach(selectedDetailSelections) { item in
                                        if let selection = sensorySelectionBinding(
                                            id: item.id,
                                            type: .detailTag
                                        ) {
                                            DiningSensorySelectionEditor(
                                                selection: selection,
                                                relatedBubbles: relatedBubbleOptions
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.top, 12)
                    .padding(.bottom, 164)
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
            }

            TBFlowBottomCTA(
                actionLabel: "완료",
                helperText: detailHelperText,
                backgroundColor: TBColor.focus,
                action: {
                    showResultCard()
                }
            )
        }
        .background(TBColor.focus.ignoresSafeArea())
        .alert("사진을 불러오지 못했어요", isPresented: photoLoadErrorBinding) {
            Button("확인", role: .cancel) {
                photoLoadError = nil
            }
        } message: {
            Text(photoLoadError ?? "")
        }
    }

    private var reflectionView: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                detailFlowTopBar {
                    phase = .detailTags
                }

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(activeDetailExperience?.label ?? "선택한 미각")
                                .font(TBFont.bold(18))
                                .foregroundStyle(activeDetailExperience?.axis.mainColor ?? TBColor.textPrimary)
                            Text("선택을 보충하고 싶다면 메모를 남겨주세요.")
                                .font(TBFont.semibold(14))
                                .foregroundStyle(TBColor.textSubtle)
                        }

                        TextEditor(text: $reflectionNote)
                            .font(TBFont.regular(13))
                            .foregroundStyle(TBColor.textPrimary)
                            .scrollContentBackground(.hidden)
                            .padding(10)
                            .frame(minHeight: 156)
                            .background(TBColor.focus)
                            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: 20, style: .continuous)
                                    .stroke(TBColor.border)
                            }

                        Text("추가 메모 · 선택사항")
                            .font(TBFont.regular(11))
                            .foregroundStyle(TBColor.textFaint)

                        DiningReflectionPhotoEditor(
                            photoData: reflectionPhotoData,
                            photoPickerItem: $photoPickerItem,
                            onRemove: {
                                cancelPhotoLoading()
                                reflectionPhotoData = nil
                                reflectionPhotoFilename = nil
                                capturedPhotoPalette = nil
                            }
                        )
                    }
                    .tbPageContentPadding(bottom: TBSpacing.page + 164)
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
            }

            TBFlowBottomCTA(
                actionLabel: "계속하기",
                helperText: detailHelperText,
                backgroundColor: TBColor.focus,
                secondaryActionLabel: "취소하기",
                secondaryAction: { phase = .detailTags },
                action: {
                    showResultCard()
                }
            )
        }
        .background(TBColor.focus.ignoresSafeArea())
    }

    private var cameraCaptureView: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if let session = cameraModel.previewSession {
                DiningFeedbackCameraPreview(session: session)
                    .ignoresSafeArea()
                    .opacity(cameraModel.isRunning ? 1 : 0)
            }

            if let errorMessage = cameraModel.errorMessage {
                DiningFeedbackCameraStatusCard(message: errorMessage)
                    .padding(.horizontal, TBSpacing.page)
            } else if !cameraModel.isRunning {
                DiningFeedbackCameraStatusCard(message: "카메라를 준비하고 있어요.")
                    .padding(.horizontal, TBSpacing.page)
            }

            VStack {
                LinearGradient(
                    colors: [Color.black.opacity(0.45), Color.black.opacity(0)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 132)

                Spacer()

                LinearGradient(
                    colors: [Color.black.opacity(0), Color.black.opacity(0.55)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 176)
            }
            .allowsHitTesting(false)
            .ignoresSafeArea()

            VStack(spacing: 0) {
                HStack {
                    Button(action: closeCameraCapture) {
                        DiningFeedbackCameraChromeIcon(icon: .x, showsBackground: false)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("카메라 닫기")

                    Spacer()

                    Button(action: cameraModel.toggleFlash) {
                        DiningFeedbackCameraChromeIcon(
                            icon: cameraModel.isFlashOn ? .zapOff : .zap,
                            isActive: cameraModel.isFlashOn
                        )
                    }
                    .buttonStyle(.plain)
                    .disabled(!cameraModel.canUseFlash)
                    .accessibilityLabel(cameraModel.isFlashOn ? "플래시 끄기" : "플래시 켜기")
                }
                .padding(.horizontal, 16)
                .padding(.top, DiningFeedbackCameraControlMetrics.topChromePadding)

                Spacer()

                HStack(alignment: .center) {
                    PhotosPicker(selection: $photoPickerItem, matching: .images) {
                        DiningFeedbackCameraChromeIcon(icon: .image)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("사진첩에서 선택")

                    Spacer()

                    Button(action: captureDiningPhoto) {
                        ZStack {
                            Circle()
                                .stroke(Color.white, lineWidth: 2)
                                .frame(
                                    width: DiningFeedbackCameraControlMetrics.captureButtonSize,
                                    height: DiningFeedbackCameraControlMetrics.captureButtonSize
                                )
                            Circle()
                                .fill(Color.white)
                                .frame(
                                    width: DiningFeedbackCameraControlMetrics.captureButtonInnerSize,
                                    height: DiningFeedbackCameraControlMetrics.captureButtonInnerSize
                                )
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(!cameraModel.isRunning)
                    .accessibilityLabel("사진 촬영")

                    Spacer()

                    Button(action: cameraModel.switchCamera) {
                        DiningFeedbackCameraChromeIcon(icon: .switchCamera)
                    }
                    .buttonStyle(.plain)
                    .disabled(!cameraModel.isRunning)
                    .accessibilityLabel("전면 후면 카메라 전환")
                }
                .frame(height: DiningFeedbackCameraControlMetrics.captureButtonSize)
                .padding(.horizontal, 28)
                .padding(.bottom, DiningFeedbackCameraControlMetrics.bottomPadding)
                .opacity(showsLaunchTransitionOverlay ? 0 : 1)
                .allowsHitTesting(!showsLaunchTransitionOverlay)
                .animation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion), value: showsLaunchTransitionOverlay)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            let sessionID = UUID()
            cameraSessionID = sessionID
            cameraModel.onCapture = { data in
                Task { @MainActor in
                    guard cameraSessionID == sessionID, phase == .cameraCapture,
                          photoPickerItem == nil else { return }
                    startLoadingCameraPhoto(data)
                }
            }
            restaurantResolver.prepareForPhotoLocation()
            cameraModel.start()
        }
        .onDisappear {
            cameraSessionID = UUID()
            cameraModel.onCapture = nil
            cameraModel.stop()
        }
        .alert("사진을 불러오지 못했어요", isPresented: photoLoadErrorBinding) {
            Button("확인", role: .cancel) {
                photoLoadError = nil
            }
        } message: {
            Text(photoLoadError ?? "")
        }
    }

    private var resultView: some View {
        GeometryReader { proxy in
            ZStack(alignment: .bottom) {
                resultStageContent
                    .allowsHitTesting(!isResultShareSheetPresented)

                if isResultShareSheetPresented {
                    resultShareSheet
                        .frame(
                            width: proxy.size.width,
                            height: resultShareSheetHeight,
                            alignment: .bottom
                        )
                        .offset(
                            y: proxy.safeAreaInsets.bottom
                                + resultShareSheetDragTranslation
                        )
                        .simultaneousGesture(resultShareSheetDragGesture)
                        .transition(TasteBloomMotion.sheetTransition(reduceMotion: reduceMotion))
                        .zIndex(30)
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
        .background {
            DiningFeedbackResultBackground(palette: resultVisualPalette)
                .ignoresSafeArea()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
        .ignoresSafeArea(edges: .horizontal)
        .alert("사진을 저장하지 못했어요", isPresented: photoLoadErrorBinding) {
            Button("확인", role: .cancel) {
                photoLoadError = nil
            }
        } message: {
            Text(photoLoadError ?? "")
        }
    }

    private var resultStageContent: some View {
        ZStack {
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture(perform: showResultChrome)

            Button(action: showResultChrome) {
                DiningFeedbackResultCardBloom(
                    palette: resultVisualPalette,
                    reduceMotion: reduceMotion
                ) {
                    DiningFeedbackResultCard(
                        kind: resultKind,
                        restaurant: selectedRestaurantName,
                        menuTitle: selectedMenuTitle,
                        experiences: selectedExperiences,
                        detailTags: selectedDetailTagMetadata,
                        reflectionNote: resolvedReflectionNote,
                        photoData: reflectionPhotoData
                    )
                }
            }
            .buttonStyle(.plain)
            .padding(.horizontal, DiningFeedbackResultLayout.cardHorizontalPadding)
            .accessibilityLabel(
                resultKind == .quickCapture ? "빠른 저장 결과 카드" : "미각 결과 카드"
            )
            .accessibilityHint(
                resultKind == .quickCapture
                    ? "상단 공유 버튼과 하단 취향 덧붙이기 또는 완료 버튼을 표시합니다"
                    : "상단 공유 버튼과 하단 저장 버튼을 표시합니다"
            )

            if isResultChromeVisible {
                VStack(spacing: 0) {
                    resultTopBar
                    Spacer(minLength: 0)
                }
                .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
            }

            if isResultChromeVisible {
                VStack(spacing: 0) {
                    Spacer(minLength: 0)
                    resultSplitCTA
                }
                    .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
            }
        }
        .animation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion), value: isResultChromeVisible)
    }

    private var resultTopBar: some View {
        ZStack {
            HStack {
                Button(action: handleResultBack) {
                    LucideIcon(
                        .chevronLeft,
                        size: TBIcon.Size.large,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
                    .foregroundStyle(TBColor.textPrimary)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(
                    resultKind == .quickCapture
                        ? "메뉴 선택으로 돌아가기"
                        : "디테일 태그로 돌아가기"
                )

                Spacer()

                Button(action: showResultShareSheet) {
                    LucideIcon(
                        .share,
                        size: TBIcon.Size.large,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
                    .foregroundStyle(TBColor.textPrimary)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(
                    resultKind == .quickCapture ? "식사 기록 카드 공유" : "미각 결과 카드 공유"
                )
            }
            .padding(.horizontal, TBSpacing.page)
        }
        .frame(maxWidth: .infinity)
        .frame(height: TBSize.topAppBarHeight)
        .background(Color.clear)
        .zIndex(20)
    }

    private var resultSplitCTA: some View {
        HStack(spacing: FlowBottomCtaMetrics.secondaryButtonGap) {
            if resultKind == .quickCapture {
                resultSecondaryButton(
                    title: "취향 덧붙이기",
                    action: continueQuickCaptureWithTasteFeedback
                )
            } else if entry == nil && quickSavedEntryID == nil {
                resultSecondaryButton(
                    title: "추가 기록",
                    action: handleResultAdditionalRecord
                )
            }

            PrimaryButton(
                title: resultKind == .quickCapture ? "완료" : "저장",
                action: resultKind == .quickCapture ? closeFeedback : saveFeedback
            )
        }
        .padding(.horizontal, TBSpacing.page)
        .padding(.bottom, FlowBottomCtaMetrics.bottomPadding)
    }

    private func resultSecondaryButton(
        title: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.medium(14))
                .frame(maxWidth: .infinity)
                .frame(minHeight: TBSize.primaryButtonHeight)
                .foregroundStyle(TBColor.textPrimary)
                .background(TBColor.surface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                        .stroke(Color.white.opacity(0.8), lineWidth: 1)
                }
        }
        .buttonStyle(.plain)
    }

    private var resultShareSheet: some View {
        BottomSheetShell(
            headerStart: AnyView(
                BottomSheetCloseButton(action: hideResultShareSheet)
            ),
            headerCenter: AnyView(
                Text("결과 카드 공유")
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            ),
            footer: AnyView(resultShareActionFooter),
            footerBackground: TBColor.focus,
            stageMode: .fixed,
            usesNativeSheetChrome: false
        ) {
            resultSharePreviewArea
        }
    }

    private var resultSharePreviewArea: some View {
        GeometryReader { proxy in
            let availableWidth = proxy.size.width - (TBSpacing.page * 2)
            let availableHeight = max(proxy.size.height - 24, 0)
            let previewWidth = max(
                0,
                min(availableWidth, availableHeight * resultShareCanvasAspectRatio)
            )
            let previewHeight = previewWidth / resultShareCanvasAspectRatio

            resultSharePreview
                .frame(width: previewWidth, height: previewHeight)
                .frame(
                    width: proxy.size.width,
                    height: proxy.size.height,
                    alignment: .center
                )
                .padding(.top, 4)
        }
    }

    private var resultSharePreview: some View {
        ZStack {
            if let resultSharePreviewImage {
                Image(uiImage: resultSharePreviewImage)
                    .resizable()
                    .scaledToFit()
            } else {
                TBColor.mutedSurface

                ProgressView()
                    .tint(TBColor.textMuted)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous)
                .stroke(TBColor.borderSubtle, lineWidth: 1)
        }
        .clipped()
        .accessibilityLabel("공유 화면 미리보기")
    }

    private var resultShareActionFooter: some View {
        VStack(spacing: 14) {
            Divider()
                .overlay(TBColor.borderSubtle)

            if let resultShareStatusMessage {
                Text(resultShareStatusMessage)
                    .font(TBFont.medium(12))
                    .foregroundStyle(TBColor.textSecondary)
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(TBColor.mutedSurface)
                    .clipShape(
                        RoundedRectangle(
                            cornerRadius: TBRadius.row,
                            style: .continuous
                        )
                    )
                    .transition(.opacity)
            }

            HStack(alignment: .top, spacing: 14) {
                ForEach(ResultShareOption.allCases) { option in
                    resultShareOptionButton(option)
                }
            }
        }
    }

    private func resultShareOptionButton(_ option: ResultShareOption) -> some View {
        Button {
            handleResultShareOption(option)
        } label: {
            VStack(spacing: 7) {
                ZStack {
                    if option == .instagramStory {
                        RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous)
                            .fill(instagramGradient)

                        InstagramLogo()
                            .frame(width: 26, height: 26)
                            .foregroundStyle(Color.white)
                    } else {
                        RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous)
                            .fill(TBColor.mutedSurface)

                        LucideIcon(
                            option.icon,
                            size: TBIcon.Size.large,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        .foregroundStyle(TBColor.textPrimary)

                        RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous)
                            .stroke(TBColor.borderSubtle, lineWidth: 1)
                    }
                }
                .aspectRatio(1, contentMode: .fit)
                .frame(maxWidth: .infinity)

                Text(option.title)
                    .font(TBFont.medium(10))
                    .foregroundStyle(TBColor.textSecondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(option.title)
        .accessibilityHint(option.detail)
    }

    private var instagramGradient: LinearGradient {
        LinearGradient(
            colors: [
                Color(red: 0.51, green: 0.22, blue: 0.71),
                Color(red: 0.88, green: 0.19, blue: 0.42),
                Color(red: 0.99, green: 0.68, blue: 0.28)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var resultShareSheetHeight: CGFloat {
        BottomSheetShellMetrics.stageHeight(
            screenHeight: UIScreen.main.bounds.height,
            safeAreaTop: resultKeyWindowSafeAreaInsets.top
        )
    }

    private var resultShareCanvasSize: CGSize {
        UIScreen.main.bounds.size
    }

    private var resultShareCanvasAspectRatio: CGFloat {
        let size = resultShareCanvasSize
        guard size.height > 0 else {
            return 9.0 / 19.5
        }

        return size.width / size.height
    }

    private var resultShareSheetDragGesture: some Gesture {
        DragGesture(minimumDistance: StagedBottomSheetDragMetrics.minimumDistance)
            .onChanged { value in
                guard canDragResultShareSheet else {
                    return
                }

                let verticalMovement = value.translation.height
                let horizontalMovement = abs(value.translation.width)
                guard verticalMovement > 0, verticalMovement >= horizontalMovement else {
                    return
                }

                isDraggingResultShareSheet = true
                resultShareSheetDragTranslation = verticalMovement
            }
            .onEnded { value in
                guard canDragResultShareSheet else {
                    return
                }

                let predictedTranslation = max(
                    value.translation.height,
                    value.predictedEndTranslation.height
                )
                let shouldDismiss = predictedTranslation >= resultShareSheetHeight
                    * StagedBottomSheetDragMetrics.dismissProgressThreshold

                if shouldDismiss {
                    hideResultShareSheet()
                } else {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        resultShareSheetDragTranslation = 0
                        isDraggingResultShareSheet = false
                    }
                }
            }
    }

    private var resultKeyWindowSafeAreaInsets: UIEdgeInsets {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets ?? .zero
    }

    private func detailFlowTopBar(
        title: String? = nil,
        onBack: @escaping () -> Void
    ) -> some View {
        TBFlowTopBar(
            title: title ?? selectedMenuTitle,
            showsDivider: false,
            leadingAction: onBack
        )
    }

    private var scenario: DiningFeedbackScenarioContract {
        fixture?.scenario ?? DiningFeedbackScenarioContract(
            completedAt: "",
            courseName: "모던 한식 코스",
            postDiningPrompt: "",
            reservationId: 0,
            restaurant: entry?.restaurant ?? "밍글스",
            dishes: []
        )
    }

    private var hasExplicitRestaurantContext: Bool {
        confirmedRestaurantName != nil || selectedRestaurantCandidate != nil || usesRestaurantDirectInput
    }

    private var menuContextLabel: String {
        if let selectedRestaurantCatalogSummary {
            return "\(selectedRestaurantCatalogSummary.category) · \(selectedRestaurantName)"
        }

        if isScenarioRestaurantSelected {
            return "\(scenario.courseName) · \(selectedRestaurantName)"
        }

        return "직접 입력 · \(selectedRestaurantName)"
    }

    private var dishKindLabelByID: [String: String] {
        Dictionary(uniqueKeysWithValues: (fixture?.dishKindOptions ?? []).map { ($0.id, $0.label) })
    }

    private func menuCardDishKindDescription(for dish: DiningFeedbackDishContract) -> String {
        let labels = initialKindIDs(for: dish)
            .map { dishKindLabelByID[$0] ?? $0 }
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

        return labels.isEmpty ? "디시 종류 미분류" : labels.joined(separator: " · ")
    }

    private var feedbackDishes: [DiningFeedbackDishContract] {
        let baseDishes: [DiningFeedbackDishContract]
        let restaurantDishes = selectedRestaurantDishes
        if !restaurantDishes.isEmpty {
            baseDishes = restaurantDishes
        } else if hasExplicitRestaurantContext {
            baseDishes = []
        } else {
            baseDishes = scenario.dishes
        }

        let entryMenu = entry?.menu.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let savedEntryDishes: [DiningFeedbackDishContract]
        if !entryMenu.isEmpty,
           !baseDishes.contains(where: {
               Self.normalizedMenuTitle($0.title) == Self.normalizedMenuTitle(entryMenu)
           }) {
            savedEntryDishes = [customDish(title: entryMenu, id: "entry-menu")]
        } else {
            savedEntryDishes = []
        }

        let anchoredDishes = baseDishes + savedEntryDishes
        return anchoredDishes
            + rememberedRestaurantDishes(excluding: anchoredDishes + customDishes)
            + customDishes
    }

    private var selectedDish: DiningFeedbackDishContract? {
        guard let selectedDishIndex,
              feedbackDishes.indices.contains(selectedDishIndex) else {
            return nil
        }

        return feedbackDishes[selectedDishIndex]
    }

    private var selectedRestaurantDishes: [DiningFeedbackDishContract] {
        if isScenarioRestaurantSelected, !scenario.dishes.isEmpty {
            return scenario.dishes
        }

        guard let selectedRestaurantCatalogSummary else {
            return []
        }

        return selectedRestaurantCatalogSummary.memorableDishes.enumerated().map { index, dish in
            DiningFeedbackDishContract(
                chefIntent: "\(selectedRestaurantCatalogSummary.name)의 메뉴를 실제 미각 기록으로 남겨 다음 다이닝 판단에 반영하기 위한 후보입니다.",
                courseLabel: index == 0 ? "대표 메뉴 후보" : "기억 후보 \(index + 1)",
                feedbackChoices: [],
                flavorNotes: dish.tags,
                id: "restaurant-\(selectedRestaurantCatalogSummary.id)-\(dish.id)",
                ingredients: [],
                subtitle: dish.summary,
                techniques: [],
                title: dish.title
            )
        }
    }

    private var selectedRestaurantCatalogSummary: RestaurantSummary? {
        let selectedName = selectedRestaurantName
        return RestaurantCatalog.restaurants.first { restaurant in
            Self.restaurantNameMatches(selectedName, restaurant.name)
        }
    }

    private var selectedRestaurantMenuStorageKey: String? {
        selectedRestaurantCandidate?.id
            ?? selectedRestaurantCatalogSummary.map { "catalog-\($0.id)" }
    }

    private func rememberedRestaurantDishes(
        excluding excludedDishes: [DiningFeedbackDishContract]
    ) -> [DiningFeedbackDishContract] {
        let excludedTitles = Set(
            excludedDishes.map { Self.normalizedMenuTitle($0.title) }
        )

        return appModel.rememberedMenus(
            for: selectedRestaurantName,
            restaurantKey: selectedRestaurantMenuStorageKey
        )
        .filter { !excludedTitles.contains(Self.normalizedMenuTitle($0)) }
        .enumerated()
        .map { index, title in
            customDish(
                title: title,
                id: "remembered-\(index)-\(Self.normalizedMenuTitle(title))"
            )
        }
    }

    private var isScenarioRestaurantSelected: Bool {
        Self.restaurantNameMatches(selectedRestaurantName, scenario.restaurant)
    }

    private var selectedRestaurantCandidate: DiningFeedbackRestaurantCandidate? {
        guard let selectedRestaurantCandidateID else { return nil }
        return restaurantResolver.candidates.first { $0.id == selectedRestaurantCandidateID }
    }

    private var selectedRestaurantName: String {
        if let confirmedRestaurantName,
           !confirmedRestaurantName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return confirmedRestaurantName
        }

        if usesRestaurantDirectInput {
            let trimmedName = directRestaurantName.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmedName.isEmpty {
                return trimmedName
            }
        }

        if let selectedRestaurantCandidate {
            return selectedRestaurantCandidate.name
        }

        return scenario.restaurant
    }

    private var canContinueRestaurantSelection: Bool {
        if usesRestaurantDirectInput {
            return !directRestaurantName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }

        return selectedRestaurantCandidate != nil
    }

    private var selectedMenuTitle: String {
        if usesDirectInput {
            return directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        if let selectedDish {
            return selectedDish.title
        }

        return didRestoreEntryMenuSelection ? "" : entry?.menu ?? ""
    }

    private var canOfferQuickCapture: Bool {
        entry?.hasCompletedTasteFeedback != true
            && reflectionPhotoData != nil
    }

    private var canSaveQuickCapture: Bool {
        guard canOfferQuickCapture, let confirmedRestaurantName else { return false }
        return !confirmedRestaurantName
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .isEmpty
    }

    private var directMenuActionLabel: String {
        editingCustomDishID == nil ? "추가" : "수정"
    }

    private var menuCardRemovalTransition: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
    }

    private var directMenuOutsideTapGesture: some Gesture {
        DragGesture(
            minimumDistance: 0,
            coordinateSpace: .named(Self.menuSelectionCoordinateSpace)
        )
        .onChanged { value in
            guard !isTrackingDirectMenuOutsideTap else { return }

            isTrackingDirectMenuOutsideTap = true
            // The keyboard may move the card before the original touch ends.
            directMenuOutsideTapStartedOpen = usesDirectInput
                && !directMenuInputFrame.isNull
                && !directMenuInputFrame.contains(value.startLocation)
        }
        .onEnded { value in
            let startedOpen = directMenuOutsideTapStartedOpen
            isTrackingDirectMenuOutsideTap = false
            directMenuOutsideTapStartedOpen = false

            guard startedOpen,
                  usesDirectInput,
                  isOutsideDirectMenuInputTap(value) else {
                return
            }

            dismissDirectMenuInput()
        }
    }

    private var resultVisualPalette: DiningFeedbackResultVisualPalette {
        switch resultKind {
        case .quickCapture:
            .photo(capturedPhotoPalette ?? entry?.photoPalette ?? .neutralFallback)
        case .tasteFeedback:
            .taste(experiences: selectedExperiences)
        }
    }

    private var resultShareText: String {
        let trimmedMenu = selectedMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        let subject = trimmedMenu.isEmpty
            ? selectedRestaurantName
            : "\(selectedRestaurantName) \(trimmedMenu)"
        let recordType = resultKind == .quickCapture ? "식사 기록" : "미각 기록"
        return "\(subject)의 \(recordType)"
    }

    private var resultShareLink: String {
        var components = URLComponents()
        components.scheme = "tastebuddy"
        components.host = "dining-feedback"
        components.path = "/result"
        var queryItems = [
            URLQueryItem(name: "restaurant", value: selectedRestaurantName)
        ]
        let trimmedMenu = selectedMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedMenu.isEmpty {
            queryItems.append(URLQueryItem(name: "menu", value: trimmedMenu))
        }
        components.queryItems = queryItems

        return components.url?.absoluteString ?? resultShareText
    }

    private var instagramStoriesSourceApplication: String? {
        guard let appID = Bundle.main.object(
            forInfoDictionaryKey: "TBInstagramFacebookAppID"
        ) as? String else {
            return nil
        }

        let trimmedAppID = appID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedAppID.isEmpty,
              !trimmedAppID.contains("$(") else {
            return nil
        }

        return trimmedAppID
    }

    private func selectDish(at index: Int) {
        isDirectMenuInputFocused = false
        usesDirectInput = false
        directMenuTitle = ""
        editingCustomDishID = nil
        editingCustomDishOriginalTitle = nil
        directMenuInputFrame = .null
        if selectedDishIndex == index {
            selectedDishIndex = nil
            selectedKindIDs = []
        } else {
            selectedDishIndex = index
            if feedbackDishes.indices.contains(index) {
                selectedKindIDs = Set(
                    initialKindIDs(for: feedbackDishes[index])
                )
            }
        }
    }

    private func openDirectMenuInput() {
        selectedDishIndex = nil
        selectedKindIDs = []
        directMenuInputFrame = .null
        usesDirectInput = true
        editingCustomDishID = nil
        editingCustomDishOriginalTitle = nil
        directMenuTitle = ""
    }

    private func dismissDirectMenuInput() {
        isDirectMenuInputFocused = false
        selectedDishIndex = nil
        selectedKindIDs = []
        usesDirectInput = false
        editingCustomDishID = nil
        editingCustomDishOriginalTitle = nil
        directMenuTitle = ""
        directMenuInputFrame = .null
    }

    private func isOutsideDirectMenuInputTap(_ value: DragGesture.Value) -> Bool {
        let tolerance = Self.outsideTapTranslationTolerance
        guard abs(value.translation.width) <= tolerance,
              abs(value.translation.height) <= tolerance else {
            return false
        }

        let isInsideInputCard = !directMenuInputFrame.isNull
            && directMenuInputFrame.contains(value.location)
        let isInsideOptionCards = !directMenuOptionCardsFrame.isNull
            && directMenuOptionCardsFrame.contains(value.location)
        return !isInsideInputCard && !isInsideOptionCards
    }

    private func continueRestaurantSelection() {
        let directName = directRestaurantName.trimmingCharacters(in: .whitespacesAndNewlines)
        if usesRestaurantDirectInput, !directName.isEmpty {
            confirmedRestaurantName = directName
        } else if let selectedRestaurantCandidate {
            confirmedRestaurantName = selectedRestaurantCandidate.name
        } else {
            return
        }

        isDirectRestaurantInputFocused = false
        selectedDishIndex = nil
        customDishes = []
        selectedKindIDs = []
        usesDirectInput = selectedRestaurantDishes.isEmpty
            && appModel.rememberedMenus(
                for: selectedRestaurantName,
                restaurantKey: selectedRestaurantMenuStorageKey
            ).isEmpty
        directMenuTitle = ""
        editingCustomDishID = nil
        editingCustomDishOriginalTitle = nil
        phase = .menu
    }

    private func addCustomDish() {
        let title = directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else {
            return
        }

        isDirectMenuInputFocused = false

        if let editingCustomDishID,
           let customIndex = customDishes.firstIndex(where: { $0.id == editingCustomDishID }) {
            let updatedDish = customDish(title: title, id: editingCustomDishID)
            customDishes[customIndex] = updatedDish
            appModel.updateRememberedRestaurantMenu(
                editingCustomDishOriginalTitle ?? updatedDish.title,
                to: title,
                for: selectedRestaurantName,
                restaurantKey: selectedRestaurantMenuStorageKey
            )
            selectedDishIndex = feedbackDishes.firstIndex { $0.id == editingCustomDishID }
            selectedKindIDs = Set(
                DiningFeedbackDishKindAutoSelection.inferredKindIDs(for: updatedDish)
            )
            usesDirectInput = false
            directMenuTitle = ""
            self.editingCustomDishID = nil
            editingCustomDishOriginalTitle = nil
            return
        }

        if let editingCustomDishID {
            appModel.updateRememberedRestaurantMenu(
                editingCustomDishOriginalTitle ?? title,
                to: title,
                for: selectedRestaurantName,
                restaurantKey: selectedRestaurantMenuStorageKey
            )
            selectedDishIndex = feedbackDishes.firstIndex {
                Self.normalizedMenuTitle($0.title) == Self.normalizedMenuTitle(title)
                    || $0.id == editingCustomDishID
            }
            selectedKindIDs = Set(
                DiningFeedbackDishKindAutoSelection.inferredKindIDs(menuTitle: title)
            )
            usesDirectInput = false
            directMenuTitle = ""
            self.editingCustomDishID = nil
            editingCustomDishOriginalTitle = nil
            return
        }

        let nextDish = customDish(title: title, id: "custom-\(UUID().uuidString)")
        customDishes.append(nextDish)
        appModel.rememberRestaurantMenu(
            title,
            for: selectedRestaurantName,
            restaurantKey: selectedRestaurantMenuStorageKey
        )
        selectedDishIndex = feedbackDishes.count - 1
        selectedKindIDs = Set(
            DiningFeedbackDishKindAutoSelection.inferredKindIDs(for: nextDish)
        )
        usesDirectInput = false
        directMenuTitle = ""
        editingCustomDishID = nil
        editingCustomDishOriginalTitle = nil
    }

    private func customDish(title: String, id: String) -> DiningFeedbackDishContract {
        DiningFeedbackDishContract(
            chefIntent: "직접 기억한 메뉴를 다음 다이닝 맥락에 반영하기 위한 기록입니다.",
            courseLabel: "직접 입력",
            feedbackChoices: [],
            flavorNotes: [],
            id: id,
            ingredients: [],
            subtitle: "직접 입력한 메뉴",
            techniques: [],
            title: title
        )
    }

    private func isEditableUserMenu(_ dish: DiningFeedbackDishContract) -> Bool {
        customDishes.contains { $0.id == dish.id }
            || dish.id.hasPrefix("remembered-")
    }

    private func startEditingCustomDish(_ dish: DiningFeedbackDishContract) {
        selectedDishIndex = nil
        selectedKindIDs = []
        directMenuTitle = dish.title
        editingCustomDishID = dish.id
        editingCustomDishOriginalTitle = dish.title
        usesDirectInput = true
    }

    private func deleteCustomDish(_ dish: DiningFeedbackDishContract) {
        let selectedDishID = selectedDish?.id
        let deletedMenu = PendingDeletedCustomMenu(
            customIndex: customDishes.firstIndex { $0.id == dish.id },
            dish: dish,
            restaurantKey: selectedRestaurantMenuStorageKey,
            restaurantName: selectedRestaurantName,
            selectedDishID: selectedDishID
        )

        UIImpactFeedbackGenerator(style: .light).impactOccurred()

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            customDishes.removeAll { $0.id == dish.id }
            appModel.removeRememberedRestaurantMenu(
                dish.title,
                for: selectedRestaurantName,
                restaurantKey: selectedRestaurantMenuStorageKey
            )

            if editingCustomDishID == dish.id {
                editingCustomDishID = nil
                editingCustomDishOriginalTitle = nil
                directMenuTitle = ""
                usesDirectInput = false
            }

            if selectedDishID == nil || selectedDishID == dish.id {
                selectedDishIndex = nil
                selectedKindIDs = []
            } else {
                selectedDishIndex = feedbackDishes.firstIndex { $0.id == selectedDishID }
            }

            pendingDeletedMenu = deletedMenu
        }
    }

    private func restoreDeletedCustomDish() {
        guard let pendingDeletedMenu else { return }
        deletionToast.cancel()

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            if let customIndex = pendingDeletedMenu.customIndex,
               !customDishes.contains(where: { $0.id == pendingDeletedMenu.dish.id }) {
                customDishes.insert(
                    pendingDeletedMenu.dish,
                    at: min(customIndex, customDishes.count)
                )
            }

            appModel.rememberRestaurantMenu(
                pendingDeletedMenu.dish.title,
                for: pendingDeletedMenu.restaurantName,
                restaurantKey: pendingDeletedMenu.restaurantKey
            )

            if pendingDeletedMenu.selectedDishID == pendingDeletedMenu.dish.id {
                selectedDishIndex = feedbackDishes.firstIndex { restoredDish in
                    restoredDish.id == pendingDeletedMenu.dish.id
                        || Self.normalizedMenuTitle(restoredDish.title)
                            == Self.normalizedMenuTitle(pendingDeletedMenu.dish.title)
                }
                selectedKindIDs = Set(
                    DiningFeedbackDishKindAutoSelection.inferredKindIDs(
                        for: pendingDeletedMenu.dish
                    )
                )
            }

            self.pendingDeletedMenu = nil
        }
    }

    private func presentMenuDeletionToast() {
        guard let toastID = pendingDeletedMenu?.id else {
            deletionToast.cancel()
            return
        }

        deletionToast.present(policy: .undo) {
            guard pendingDeletedMenu?.id == toastID else { return }
            pendingDeletedMenu = nil
        }
    }

    private func restoreEntryMenuSelectionIfNeeded() {
        guard !didRestoreEntryMenuSelection else { return }
        didRestoreEntryMenuSelection = true

        guard let entry else { return }
        let restoredTitle = entry.menu.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !restoredTitle.isEmpty,
              let index = feedbackDishes.firstIndex(where: {
                  Self.normalizedMenuTitle($0.title) == Self.normalizedMenuTitle(restoredTitle)
              }) else {
            return
        }

        usesDirectInput = false
        selectedDishIndex = index
        selectedKindIDs = Set(initialKindIDs(for: feedbackDishes[index]))
    }

    private func initialKindIDs(for dish: DiningFeedbackDishContract) -> [String] {
        if let entry,
           !entry.dishKindIDs.isEmpty,
           Self.normalizedMenuTitle(entry.menu) == Self.normalizedMenuTitle(dish.title) {
            return entry.dishKindIDs
        }

        return DiningFeedbackDishKindAutoSelection.inferredKindIDs(for: dish)
    }

    private static func restaurantNameMatches(_ lhs: String, _ rhs: String) -> Bool {
        let left = normalizedRestaurantName(lhs)
        let right = normalizedRestaurantName(rhs)
        guard left.count >= 2, right.count >= 2 else {
            return false
        }

        return left == right || left.contains(right) || right.contains(left)
    }

    private static func normalizedRestaurantName(_ value: String) -> String {
        value
            .lowercased()
            .filter { character in
                character.isLetter || character.isNumber
            }
    }

    private static func normalizedMenuTitle(_ value: String) -> String {
        value
            .lowercased()
            .filter { character in
                character.isLetter || character.isNumber
            }
    }

    private func toggleKind(_ id: String) {
        if selectedKindIDs.contains(id) {
            selectedKindIDs.remove(id)
        } else {
            selectedKindIDs.insert(id)
        }
    }

    private var experienceByID: [String: TasteExperience] {
        Dictionary(uniqueKeysWithValues: tasteExperiences.map { ($0.id, $0) })
    }

    private var selectedExperiences: [TasteExperience] {
        selectedExperienceIDs.compactMap { experienceByID[$0] }
    }

    private var activeDetailExperience: TasteExperience? {
        guard !selectedExperiences.isEmpty else { return nil }
        return selectedExperiences[
            min(activeDetailExperienceIndex, selectedExperiences.count - 1)
        ]
    }

    private var recommendedDetailTagIDs: [String] {
        let baseIDs = DiningDetailTagCatalog.recommendedIDs(
            experiences: selectedExperiences,
            dishKindIDs: Set(resolvedSelectedDishKindIDs)
        )
        return DiningSensoryRecommendationPolicy.orderedDetailTagIDs(
            baseIDs: baseIDs,
            overallEvaluation: overallEvaluation
        )
    }

    private var selectedDetailTagMetadata: [DiningDetailTagMetadata] {
        selectedDetailTagIDs.compactMap { id in
            if let metadata = DiningDetailTagCatalog.metadata(for: id) {
                return metadata
            }
            guard let selection = sensorySelections.first(where: {
                $0.type == .detailTag && $0.id == id
            }) else {
                return nil
            }
            return DiningDetailTagMetadata(
                id: id,
                label: selection.labelSnapshot,
                categoryID: "preserved",
                categoryLabel: "기존 선택"
            )
        }
    }

    private var selectedDetailSelections: [DiningSensorySelection] {
        selectedDetailTagIDs.compactMap { id in
            sensorySelections.first { $0.type == .detailTag && $0.id == id }
        }
    }

    private var relatedBubbleOptions: [DiningSensoryRelatedBubbleOption] {
        selectedExperiences.map { .init(id: $0.id, label: $0.label) }
    }

    private var detailHelperText: String {
        if selectedDetailTagIDs.isEmpty {
            return "태그를 고르지 않아도 미각 인상은 저장됩니다."
        }
        return "\(selectedDetailTagIDs.count)개의 디테일 단서를 함께 저장합니다."
    }

    private var resolvedReflectionNote: String {
        reflectionNote.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func sensorySelectionBinding(
        id: String,
        type: DiningSensorySelection.Kind
    ) -> Binding<DiningSensorySelection>? {
        guard let initial = sensorySelections.first(where: {
            $0.id == id && $0.type == type
        }) else {
            return nil
        }
        return Binding(
            get: {
                sensorySelections.first(where: { $0.id == id && $0.type == type }) ?? initial
            },
            set: { updated in
                sensorySelections = DiningSensorySelectionEditing.upsert(
                    updated,
                    in: sensorySelections
                )
            }
        )
    }

    private var photoLoadErrorBinding: Binding<Bool> {
        Binding(
            get: { photoLoadError != nil },
            set: { isPresented in
                if !isPresented {
                    photoLoadError = nil
                }
            }
        )
    }

    private var focusedExperience: TasteExperience? {
        guard let focusedExperienceID else { return nil }
        return experienceByID[focusedExperienceID]
    }

    private var enlargedExperienceIDs: [String] {
        if selectedExperienceIDs.count >= 3 {
            return selectedExperienceIDs
        }

        guard let focusedExperienceID else {
            return selectedExperienceIDs
        }

        return selectedExperienceIDs.contains(focusedExperienceID)
            ? selectedExperienceIDs
            : selectedExperienceIDs + [focusedExperienceID]
    }

    private var renderedTasteExperiencePositions: [TasteExperienceBubblePosition] {
        TasteExperienceMapEngine.renderPositions(
            basePositions: baseTasteExperiencePositions,
            enlargedExperienceIDs: enlargedExperienceIDs
        )
    }

    private func handleTasteExperienceTap(_ experience: TasteExperience) {
        requestTasteExperienceFocus(experience.id)
        let nextSelection = TasteExperienceMapEngine.toggleSelection(
            experience.id,
            in: selectedExperienceIDs
        )
        selectedExperienceIDs = nextSelection
        reconcileBubbleSelections()

        guard nextSelection.contains(experience.id), nextSelection.count < 3 else {
            return
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + TasteBloomMotion.duration(.press, reduceMotion: reduceMotion)) {
            guard phase == .tasteWords, focusedExperienceID == experience.id,
                  selectedExperienceIDs.contains(experience.id) else { return }
            focusNextUnselectedExperience(from: experience.id)
        }
    }

    private func handleFocusedTasteExperienceAction() {
        guard let focusedExperience else { return }

        if selectedExperienceIDs.count >= 3 {
            activeDetailExperienceIndex = 0
            phase = .detailTags
            return
        }

        if selectedExperienceIDs.contains(focusedExperience.id) {
            focusNextUnselectedExperience(from: focusedExperience.id)
        } else {
            selectedExperienceIDs = TasteExperienceMapEngine.toggleSelection(
                focusedExperience.id,
                in: selectedExperienceIDs
            )
            reconcileBubbleSelections()
        }
    }

    private func focusNextUnselectedExperience(from experienceID: String) {
        guard let nextID = TasteExperienceMapEngine.nextUnselectedExperienceID(
            from: experienceID,
            selectedExperienceIDs: selectedExperienceIDs,
            positions: renderedTasteExperiencePositions
        ) else {
            return
        }

        requestTasteExperienceFocus(nextID)
    }

    private func requestTasteExperienceFocus(_ experienceID: String) {
        focusedExperienceID = experienceID
        focusRequest = TasteExperienceMapFocusRequest(experienceID: experienceID)
    }

    private func prepareTasteMapFocus() {
        guard let id = DiningSensoryRecommendationPolicy.firstBubbleID(
            experiences: tasteExperiences,
            dishKindIDs: Set(resolvedSelectedDishKindIDs),
            preserving: selectedExperienceIDs
        ) else {
            return
        }
        requestTasteExperienceFocus(id)
    }

    private func customTags(in categoryID: String) -> [DiningFeedbackTagContract] {
        selectedDetailTagIDs.compactMap { id in
            guard let metadata = DiningDetailTagCatalog.metadata(for: id),
                  metadata.categoryID == categoryID,
                  id.hasPrefix("custom:")
            else {
                return nil
            }
            return DiningFeedbackTagContract(id: id, label: metadata.label)
        }
    }

    private func toggleDetailTag(_ id: String) {
        if selectedDetailTagIDs.contains(id) {
            selectedDetailTagIDs.removeAll { $0 == id }
            sensorySelections.removeAll { $0.type == .detailTag && $0.id == id }
        } else {
            selectedDetailTagIDs.append(id)
            let label = DiningDetailTagCatalog.metadata(for: id)?.label ?? id
            sensorySelections = DiningSensorySelectionEditing.upsert(
                DiningSensorySelection(
                    id: id,
                    type: .detailTag,
                    labelSnapshot: label,
                    relatedBubbleID: activeDetailExperience?.id
                ),
                in: sensorySelections
            )
        }
    }

    private func addCustomDetailTag() {
        let label = customTagLabel.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let categoryID = customTagCategoryID, !label.isEmpty else {
            return
        }

        let id = "custom:\(categoryID):\(label)"
        if !selectedDetailTagIDs.contains(id) {
            selectedDetailTagIDs.append(id)
            sensorySelections = DiningSensorySelectionEditing.upsert(
                DiningSensorySelection(
                    id: id,
                    type: .detailTag,
                    labelSnapshot: label,
                    relatedBubbleID: activeDetailExperience?.id
                ),
                in: sensorySelections
            )
        }
        customTagCategoryID = nil
        customTagLabel = ""
    }

    private func reconcileBubbleSelections() {
        let selectedIDs = Set(selectedExperienceIDs)
        if selectedIDs.isEmpty {
            sensorySelections = []
            selectedDetailTagIDs = []
            return
        }

        sensorySelections.removeAll { selection in
            if selection.type == .bubble {
                return experienceByID[selection.id] != nil
                    && !selectedIDs.contains(selection.id)
            }
            if let relatedBubbleID = selection.relatedBubbleID {
                return experienceByID[relatedBubbleID] != nil
                    && !selectedIDs.contains(relatedBubbleID)
            }
            return false
        }

        for id in selectedExperienceIDs where !sensorySelections.contains(where: {
            $0.type == .bubble && $0.id == id
        }) {
            guard let experience = experienceByID[id] else { continue }
            sensorySelections.append(
                DiningSensorySelection(
                    id: id,
                    type: .bubble,
                    labelSnapshot: experience.label
                )
            )
        }
        selectedDetailTagIDs = sensorySelections
            .filter { $0.type == .detailTag }
            .map(\.id)
    }

    private var phaseAfterPhotoCapture: Phase {
        if shouldResolveRestaurantAfterPhoto {
            return .restaurantSelection
        }

        return selectedExperienceIDs.isEmpty ? Phase.menu : Phase.reflection
    }

    private var shouldResolveRestaurantAfterPhoto: Bool {
        entry == nil && cameraClosePhase == nil && selectedExperienceIDs.isEmpty
    }

    private func openCameraCapture(returningTo phase: Phase?) {
        cancelPhotoLoading()
        photoLoadError = nil
        cameraClosePhase = phase
        self.phase = .cameraCapture
    }

    private func closeCameraCapture() {
        cancelPhotoLoading()
        cameraSessionID = UUID()
        pendingCaptureLocation = nil
        cameraModel.stop()
        if let cameraClosePhase {
            phase = cameraClosePhase
            self.cameraClosePhase = nil
        } else {
            closeFeedback()
        }
    }

    private func captureDiningPhoto() {
        cancelPhotoLoading()
        pendingCaptureLocation = restaurantResolver.captureLocationSnapshot()
        cameraModel.capturePhoto()
    }

    @MainActor
    private func startLoadingCameraPhoto(_ data: Data) {
        cancelPhotoLoading()
        let requestID = photoLoadRequestID
        let nextPhase = phaseAfterPhotoCapture
        let capturedLocation = pendingCaptureLocation
        pendingCaptureLocation = nil
        photoLoadTask = Task { @MainActor in
            defer { finishPhotoLoading(requestID: requestID) }
            guard await applyReflectionPhotoData(data, requestID: requestID),
                  phase == .cameraCapture else { return }
            cameraClosePhase = nil
            if nextPhase == .restaurantSelection {
                beginRestaurantResolution(
                    from: data,
                    capturedLocation: capturedLocation,
                    assetLocation: nil
                )
            }
            phase = nextPhase
        }
    }

    @MainActor
    private func cancelPhotoLoading() {
        photoLoadRequestID = UUID()
        photoLoadTask?.cancel()
        photoLoadTask = nil
        photoPickerItem = nil
    }

    @MainActor
    private func finishPhotoLoading(requestID: UUID, selection: PhotosPickerItem? = nil) {
        guard photoLoadRequestID == requestID else { return }
        photoLoadTask = nil
        // Do not clear a newer selection whose onChange has not run yet.
        if photoPickerItem == selection {
            photoPickerItem = nil
        }
    }

    @MainActor
    private func isCurrentPhotoRequest(_ requestID: UUID, selection: PhotosPickerItem? = nil) -> Bool {
        !Task.isCancelled && photoLoadRequestID == requestID && photoPickerItem == selection
    }

    @MainActor
    private func applyReflectionPhotoData(
        _ data: Data,
        requestID: UUID,
        selection: PhotosPickerItem? = nil
    ) async -> Bool {
        async let normalizedPhoto = DiningReflectionPhotoStore.normalizedJPEGDataInBackground(data)
        async let extractedPalette = DiningPhotoPalette.extractInBackground(from: data)
        let (normalizedData, photoPalette) = await (normalizedPhoto, extractedPalette)
        guard isCurrentPhotoRequest(requestID, selection: selection) else { return false }
        guard let normalizedData else {
            photoLoadError = "선택한 이미지를 읽을 수 없어요. 다른 사진을 선택해주세요."
            return false
        }

        reflectionPhotoData = normalizedData
        reflectionPhotoFilename = nil
        capturedPhotoPalette = photoPalette
        photoLoadError = nil
        return true
    }

    @MainActor
    private func beginRestaurantResolution(
        from photoData: Data,
        capturedLocation: CLLocation?,
        assetLocation: CLLocation?
    ) {
        selectedRestaurantCandidateID = nil
        usesRestaurantDirectInput = false
        directRestaurantName = ""
        confirmedRestaurantName = nil

        restaurantResolutionTask?.cancel()
        restaurantResolutionTask = Task { @MainActor in
            await restaurantResolver.resolveRestaurantCandidates(
                from: photoData,
                capturedLocation: capturedLocation,
                assetLocation: assetLocation
            )
            guard !Task.isCancelled else { return }
            selectedRestaurantCandidateID = restaurantResolver.candidates.first?.id
            usesRestaurantDirectInput = restaurantResolver.candidates.isEmpty
        }
    }

    @MainActor
    private func startLoadingReflectionPhoto(from item: PhotosPickerItem) {
        guard photoPickerItem == item else { return }
        photoLoadTask?.cancel()
        photoLoadRequestID = UUID()
        let requestID = photoLoadRequestID
        let isCameraSelection = phase == .cameraCapture
        let nextPhase = phaseAfterPhotoCapture
        photoLoadTask = Task { @MainActor in
            defer { finishPhotoLoading(requestID: requestID, selection: item) }
            do {
                let data = try await item.loadTransferable(type: Data.self)
                guard isCurrentPhotoRequest(requestID, selection: item) else { return }
                guard let data else {
                    photoLoadError = "선택한 이미지를 읽을 수 없어요. 다른 사진을 선택해주세요."
                    return
                }
                guard await applyReflectionPhotoData(data, requestID: requestID, selection: item) else { return }
                if isCameraSelection {
                    guard phase == .cameraCapture else { return }
                    cameraClosePhase = nil
                    if nextPhase == .restaurantSelection {
                        beginRestaurantResolution(
                            from: data,
                            capturedLocation: nil,
                            assetLocation: Self.photoLibraryLocation(for: item)
                        )
                    }
                    phase = nextPhase
                }
            } catch {
                guard isCurrentPhotoRequest(requestID, selection: item) else { return }
                photoLoadError = "사진을 불러오는 중 문제가 생겼어요. 다시 시도해주세요."
            }
        }
    }

    private static func photoLibraryLocation(for item: PhotosPickerItem) -> CLLocation? {
        guard let itemIdentifier = item.itemIdentifier else {
            return nil
        }

        let result = PHAsset.fetchAssets(
            withLocalIdentifiers: [itemIdentifier],
            options: nil
        )
        return result.firstObject?.location
    }

    @MainActor
    private func runTasteMapIntro() async {
        tasteMapVeilOpacity = reduceMotion ? 0 : 1
        guard !reduceMotion else { return }

        try? await Task.sleep(for: .seconds(TasteBloomMotion.Role.feedback.duration))
        guard !Task.isCancelled else { return }
        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            tasteMapVeilOpacity = 0
        }
    }

    private func saveQuickCapture() {
        guard canSaveQuickCapture else { return }

        let entryID = entry?.id ?? quickSavedEntryID ?? UUID()
        let photoFilename: String

        if let reflectionPhotoData {
            do {
                photoFilename = try DiningReflectionPhotoStore.save(
                    reflectionPhotoData,
                    entryID: entryID
                )
            } catch {
                photoLoadError = "사진을 기기에 저장하지 못했어요. 잠시 뒤 다시 시도해주세요."
                return
            }
        } else if let existingFilename = reflectionPhotoFilename ?? entry?.reflectionPhotoFilename {
            photoFilename = existingFilename
        } else {
            return
        }

        let photoPalette = capturedPhotoPalette
            ?? reflectionPhotoData.map(DiningPhotoPalette.extract(from:))
            ?? entry?.photoPalette
            ?? .neutralFallback

        quickSavedEntryID = entryID
        reflectionPhotoFilename = photoFilename
        capturedPhotoPalette = photoPalette

        onSave(
            DiningEntry(
                id: entryID,
                mealID: entry?.mealID ?? entryID,
                restaurant: selectedRestaurantName,
                restaurantID: resolvedRestaurantID,
                menu: selectedMenuTitle,
                menuItemID: resolvedMenuItemID,
                observedAt: workingEntryDate,
                savedAt: entry?.savedAt,
                updatedAt: entry?.updatedAt,
                rating: 0,
                note: "",
                tasteExperienceIDs: [],
                detailTagIDs: [],
                overallEvaluation: overallEvaluation,
                dishKindIDs: [],
                reflectionPhotoFilename: photoFilename,
                tbaAnalysisSnapshot: nil,
                feedbackStatus: .captured,
                photoPalette: photoPalette
            )
        )
        showResultCard(kind: .quickCapture)
    }

    private func saveFeedback() {
        guard selectedExperienceIDs.first.flatMap({ experienceByID[$0] }) != nil else {
            return
        }
        let entryID = entry?.id ?? quickSavedEntryID ?? UUID()
        var photoFilename = reflectionPhotoFilename
        if let reflectionPhotoData {
            do {
                photoFilename = try DiningReflectionPhotoStore.save(
                    reflectionPhotoData,
                    entryID: entryID
                )
            } catch {
                photoLoadError = "사진을 기기에 저장하지 못했어요. 기존 기록은 그대로 유지했어요."
                return
            }
        } else if let existingFilename = entry?.reflectionPhotoFilename {
            DiningReflectionPhotoStore.remove(filename: existingFilename)
            photoFilename = nil
        }
        let dishKindIDs = resolvedSelectedDishKindIDs

        onSave(
            DiningEntry(
                id: entryID,
                mealID: entry?.mealID ?? entryID,
                restaurant: selectedRestaurantName,
                restaurantID: resolvedRestaurantID,
                menu: selectedMenuTitle,
                menuItemID: resolvedMenuItemID,
                observedAt: workingEntryDate,
                savedAt: entry?.savedAt,
                updatedAt: entry?.updatedAt,
                rating: entry?.rating ?? 0,
                note: resolvedReflectionNote,
                tasteExperienceIDs: selectedExperienceIDs,
                detailTagIDs: selectedDetailTagIDs,
                sensorySelections: sensorySelections,
                overallEvaluation: overallEvaluation,
                dishKindIDs: dishKindIDs,
                reflectionPhotoFilename: photoFilename,
                tbaAnalysisSnapshot: nil,
                feedbackStatus: .completed,
                photoPalette: capturedPhotoPalette ?? entry?.photoPalette
            )
        )
        closeFeedback()
    }

    private var resolvedRestaurantID: String? {
        if let restaurantID = entry?.restaurantID {
            return restaurantID
        }
        if let candidateID = selectedRestaurantCandidate?.id {
            return candidateID
        }
        return selectedRestaurantCatalogSummary?.id
    }

    private var resolvedMenuItemID: String? {
        if let menuItemID = entry?.menuItemID,
           Self.normalizedMenuTitle(entry?.menu ?? "") == Self.normalizedMenuTitle(selectedMenuTitle) {
            return menuItemID
        }
        guard let selectedDish,
              selectedDish.id.hasPrefix("restaurant-") else {
            return nil
        }
        return selectedDish.id
    }

    private func closeFeedback() {
        cancelPhotoLoading()
        restaurantResolutionTask?.cancel()
        restaurantResolutionTask = nil

        guard startsWithLaunchTransition else {
            performFeedbackDismissal()
            return
        }
        guard !isRunningTasteBloomDismissal else { return }

        isRunningTasteBloomDismissal = true

        if reduceMotion {
            terminalDismissalOpacity = 0
            return
        }

        let dismissalDuration = DiningFeedbackTasteBloomTransitionMetrics
            .dismissalDuration
        let fadeStart = DiningFeedbackTasteBloomTransitionMetrics
            .dismissalFadeStartProgress

        // 마스크 안에서 꽃잎 곡선을 계산하므로, 시간만 등속으로 진행한다.
        withAnimation(.linear(duration: dismissalDuration)) {
            tasteBloomDismissalProgress = 1
        }
        withAnimation(
            TasteBloomMotion.animation(.press, reduceMotion: reduceMotion)?
                .delay(dismissalDuration * fadeStart)
        ) {
            terminalDismissalOpacity = 0
        }
    }

    private func finishTasteBloomDismissalAfterDelay() async {
        guard isRunningTasteBloomDismissal else { return }

        let delay = reduceMotion
            ? DiningFeedbackTasteBloomTransitionMetrics.reducedMotionDuration
            : DiningFeedbackTasteBloomTransitionMetrics.dismissalDuration
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        guard !Task.isCancelled, isRunningTasteBloomDismissal else { return }

        performFeedbackDismissal()
    }

    private func performFeedbackDismissal() {
        if let onClose {
            onClose()
        } else {
            dismiss()
        }
    }

    private var resolvedSelectedDishKindIDs: [String] {
        let selectedIDs = Array(selectedKindIDs).sorted()
        guard selectedIDs.isEmpty else { return selectedIDs }

        if let selectedDish {
            return DiningFeedbackDishKindAutoSelection
                .inferredKindIDs(for: selectedDish)
                .sorted()
        }

        return DiningFeedbackDishKindAutoSelection
            .inferredKindIDs(menuTitle: selectedMenuTitle)
            .sorted()
    }

    private func handleEdgeSwipeBack() {
        switch phase {
        case .menu:
            closeFeedback()
        case .restaurantSelection:
            closeFeedback()
        case .overallEvaluation:
            phase = .menu
        case .tasteWords:
            phase = .overallEvaluation
        case .detailTags:
            phase = .tasteWords
        case .cameraCapture:
            closeCameraCapture()
        case .reflection:
            phase = .detailTags
        case .result:
            handleResultBack()
        }
    }

    private func showResultCard(kind: DiningFeedbackResultKind = .tasteFeedback) {
        resultKind = kind
        isResultChromeVisible = false
        isResultShareSheetPresented = false
        resultShareSheetDragTranslation = 0
        isDraggingResultShareSheet = false
        canDragResultShareSheet = false
        resultSharePreviewImage = nil
        resultShareStatusMessage = nil
        phase = .result
    }

    private func showResultChrome() {
        guard !isResultChromeVisible else {
            return
        }

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            isResultChromeVisible = true
        }
    }

    private func handleResultBack() {
        isResultChromeVisible = false
        isResultShareSheetPresented = false
        resultShareSheetDragTranslation = 0
        isDraggingResultShareSheet = false
        canDragResultShareSheet = false
        resultSharePreviewImage = nil
        resultShareStatusMessage = nil
        phase = resultKind == .quickCapture ? .menu : .detailTags
    }

    private func continueQuickCaptureWithTasteFeedback() {
        isResultChromeVisible = false
        isResultShareSheetPresented = false
        resultShareSheetDragTranslation = 0
        isDraggingResultShareSheet = false
        canDragResultShareSheet = false
        resultSharePreviewImage = nil
        resultShareStatusMessage = nil
        phase = selectedMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? .menu
            : .tasteWords
    }

    private func showResultShareSheet() {
        resultShareStatusMessage = nil
        resultSharePreviewImage = makeResultShareImage()
        resultShareSheetDragTranslation = 0
        isDraggingResultShareSheet = false
        canDragResultShareSheet = false
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            isResultShareSheetPresented = true
        }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(TasteBloomMotion.duration(.sheet, reduceMotion: reduceMotion)))
            if isResultShareSheetPresented {
                canDragResultShareSheet = true
            }
        }
    }

    private func hideResultShareSheet() {
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            isResultShareSheetPresented = false
            resultShareSheetDragTranslation = 0
            isDraggingResultShareSheet = false
            canDragResultShareSheet = false
        }
    }

    private func handleResultShareOption(_ option: ResultShareOption) {
        switch option {
        case .instagramStory:
            shareResultToInstagramStory()
        case .copy:
            guard let image = preparedResultShareImage else {
                resultShareStatusMessage = "복사할 이미지를 준비하지 못했어요."
                return
            }
            UIPasteboard.general.image = image
            resultShareStatusMessage = "전체 공유 화면 이미지를 복사했어요."
        case .saveImage:
            saveResultImageToPhotos()
        case .copyLink:
            UIPasteboard.general.string = resultShareLink
            resultShareStatusMessage = "결과 카드 링크를 복사했어요."
        }
    }

    @MainActor
    private func makeResultShareImage() -> UIImage? {
        let canvasSize = resultShareCanvasSize
        let renderer = ImageRenderer(
            content: DiningFeedbackResultShareImage(
                kind: resultKind,
                restaurant: selectedRestaurantName,
                menuTitle: selectedMenuTitle,
                experiences: selectedExperiences,
                detailTags: selectedDetailTagMetadata,
                reflectionNote: resolvedReflectionNote,
                photoData: reflectionPhotoData,
                palette: resultVisualPalette,
                canvasSize: canvasSize
            )
            .frame(width: canvasSize.width, height: canvasSize.height)
        )
        renderer.scale = 3
        return renderer.uiImage
    }

    @MainActor
    private var preparedResultShareImage: UIImage? {
        resultSharePreviewImage ?? makeResultShareImage()
    }

    private func shareResultToInstagramStory() {
        guard let sourceApplication = instagramStoriesSourceApplication else {
            resultShareStatusMessage = "Instagram Story 연결을 위한 App ID가 필요해요."
            return
        }

        guard let imageData = preparedResultShareImage?.pngData() else {
            resultShareStatusMessage = "공유 이미지를 준비하지 못했어요."
            return
        }

        guard let url = URL(
            string: "instagram-stories://share?source_application=\(sourceApplication)"
        ),
              UIApplication.shared.canOpenURL(url) else {
            resultShareStatusMessage = "Instagram 앱을 찾지 못했어요."
            return
        }

        UIPasteboard.general.setItems(
            [[
                "com.instagram.sharedSticker.backgroundImage": imageData
            ]],
            options: [
                .expirationDate: Date().addingTimeInterval(60 * 5)
            ]
        )

        hideResultShareSheet()
        UIApplication.shared.open(url)
    }

    private func saveResultImageToPhotos() {
        guard let image = preparedResultShareImage else {
            resultShareStatusMessage = "저장할 이미지를 준비하지 못했어요."
            return
        }

        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                Task { @MainActor in
                    resultShareStatusMessage = "사진 저장 권한이 필요해요."
                }
                return
            }

            PHPhotoLibrary.shared().performChanges {
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            } completionHandler: { success, _ in
                Task { @MainActor in
                    resultShareStatusMessage = success
                        ? "결과 카드 이미지를 저장했어요."
                        : "이미지를 저장하지 못했어요."
                }
            }
        }
    }

    private func handleResultAdditionalRecord() {
        cancelPhotoLoading()
        restaurantResolutionTask?.cancel()
        restaurantResolutionTask = nil
        selectedDishIndex = nil
        selectedRestaurantCandidateID = nil
        usesRestaurantDirectInput = false
        directRestaurantName = ""
        confirmedRestaurantName = entry?.restaurant
        restaurantResolver.reset()
        usesDirectInput = false
        directMenuTitle = ""
        editingCustomDishID = nil
        editingCustomDishOriginalTitle = nil
        selectedKindIDs = []
        selectedExperienceIDs = []
        focusedExperienceID = nil
        focusRequest = nil
        isTasteMapInteracting = false
        isTasteSearchPresented = false
        tasteMapVeilOpacity = 1
        selectedDetailTagIDs = []
        sensorySelections = []
        overallEvaluation = nil
        activeDetailExperienceIndex = 0
        reflectionNote = ""
        reflectionPhotoData = nil
        reflectionPhotoFilename = nil
        capturedPhotoPalette = nil
        photoPickerItem = nil
        photoLoadError = nil
        pendingCaptureLocation = nil
        cameraClosePhase = nil
        customTagCategoryID = nil
        customTagLabel = ""
        isResultChromeVisible = false
        isResultShareSheetPresented = false
        resultShareSheetDragTranslation = 0
        isDraggingResultShareSheet = false
        canDragResultShareSheet = false
        resultSharePreviewImage = nil
        resultShareStatusMessage = nil
        phase = .menu
    }
}

private enum SwipeableCustomMenuCardMetrics {
    static let actionWidth: CGFloat = 74
    static let revealWidth = actionWidth * 2
    static let revealThreshold: CGFloat = 44
    static let closeThreshold = actionWidth * 0.7
    static let editBackgroundExtension = SelectionCardMetrics.cardRadius
    static let deleteBackgroundExtension = SelectionCardMetrics.cardRadius

    static var maxDragWidth: CGFloat {
        max(UIScreen.main.bounds.width, revealWidth)
    }

    static var fullSwipeThreshold: CGFloat {
        max(revealWidth + actionWidth * 0.6, maxDragWidth * 0.6)
    }
}

private struct SwipeableCustomMenuCard: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let title: String
    let description: String?
    let isSelected: Bool
    let onSelect: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void

    @State private var settledOffset: CGFloat = 0
    @GestureState private var dragTranslation: CGFloat = 0

    private var currentOffset: CGFloat {
        let rawOffset = settledOffset + dragTranslation
        return min(
            0,
            max(-SwipeableCustomMenuCardMetrics.maxDragWidth, rawOffset)
        )
    }

    private var showsActions: Bool {
        currentOffset < -1
    }

    private var revealDistance: CGFloat {
        -currentOffset
    }

    private var visibleActionDistance: CGFloat {
        max(SwipeableCustomMenuCardMetrics.revealWidth, revealDistance)
    }

    private var actionLayerWidth: CGFloat {
        visibleActionDistance + SwipeableCustomMenuCardMetrics.editBackgroundExtension
    }

    private var deleteActionWidth: CGFloat {
        max(
            SwipeableCustomMenuCardMetrics.actionWidth,
            visibleActionDistance - SwipeableCustomMenuCardMetrics.actionWidth
        )
    }

    private var deleteBackgroundWidth: CGFloat {
        deleteActionWidth + SwipeableCustomMenuCardMetrics.deleteBackgroundExtension
    }

    var body: some View {
        ZStack(alignment: .trailing) {
            ZStack(alignment: .trailing) {
                actionBackground(
                    TBColor.destructive,
                    roundsTrailingCorners: true
                )
                .frame(width: deleteBackgroundWidth)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
                .allowsHitTesting(false)

                HStack(spacing: 0) {
                    TasteAxis.salty.tintColor
                        .frame(width: SwipeableCustomMenuCardMetrics.editBackgroundExtension)

                    actionButton(
                        title: "수정",
                        icon: .pencil,
                        foreground: TasteAxis.salty.mainColor,
                        background: TasteAxis.salty.tintColor,
                        width: SwipeableCustomMenuCardMetrics.actionWidth,
                        roundsTrailingCorners: true
                    ) {
                        closeActions()
                        onEdit()
                    }

                    actionButton(
                        title: "삭제",
                        icon: .trash2,
                        foreground: TBColor.textInverse,
                        background: TBColor.destructive,
                        width: deleteActionWidth,
                        roundsTrailingCorners: true
                    ) {
                        onDelete()
                    }
                }
            }
            .frame(width: actionLayerWidth)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
            .opacity(showsActions ? 1 : 0)
            .allowsHitTesting(settledOffset <= -SwipeableCustomMenuCardMetrics.revealWidth)

            TBSelectionCard(
                title: title,
                description: description,
                indicator: .radio,
                isSelected: isSelected && !showsActions,
                showsUnselectedBorder: false
            ) {
                if settledOffset == 0 {
                    onSelect()
                } else {
                    closeActions()
                }
            }
            .offset(x: currentOffset)
            .highPriorityGesture(swipeGesture)
        }
        .accessibilityAction(named: "수정", onEdit)
        .accessibilityAction(named: "삭제", onDelete)
    }

    private var swipeGesture: some Gesture {
        DragGesture(minimumDistance: 12, coordinateSpace: .local)
            .updating($dragTranslation) { value, state, _ in
                guard abs(value.translation.width) > abs(value.translation.height) else {
                    return
                }
                state = value.translation.width
            }
            .onEnded { value in
                guard abs(value.translation.width) > abs(value.translation.height) else {
                    return
                }

                let proposedOffset = settledOffset + value.translation.width
                let proposedRevealDistance = clampedRevealDistance(for: proposedOffset)
                if proposedRevealDistance >= SwipeableCustomMenuCardMetrics.fullSwipeThreshold {
                    settledOffset = 0
                    onDelete()
                    return
                }

                let predictedOffset = settledOffset + value.predictedEndTranslation.width
                let revealDistance = max(
                    proposedRevealDistance,
                    clampedRevealDistance(for: predictedOffset)
                )
                let threshold = settledOffset < 0 && value.translation.width > 0
                    ? SwipeableCustomMenuCardMetrics.closeThreshold
                    : SwipeableCustomMenuCardMetrics.revealThreshold
                let targetOffset = revealDistance >= threshold
                    ? -SwipeableCustomMenuCardMetrics.revealWidth
                    : 0

                withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
                    settledOffset = targetOffset
                }
            }
    }

    private func actionButton(
        title: String,
        icon: LucideIconName,
        foreground: Color,
        background: Color,
        width: CGFloat,
        roundsTrailingCorners: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                LucideIcon(
                    icon,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.medium
                )
                Text(title)
                    .font(TBFont.semibold(11))
            }
            .frame(width: width)
            .frame(maxHeight: .infinity)
            .foregroundStyle(foreground)
            .background(actionBackground(background, roundsTrailingCorners: roundsTrailingCorners))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func actionBackground(
        _ color: Color,
        roundsTrailingCorners: Bool
    ) -> some View {
        if roundsTrailingCorners {
            color
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: SelectionCardMetrics.cardRadius,
                        style: .continuous
                    )
                )
                .overlay(alignment: .leading) {
                    color.frame(width: SelectionCardMetrics.cardRadius)
                }
        } else {
            color
        }
    }

    private func clampedRevealDistance(for offset: CGFloat) -> CGFloat {
        min(
            SwipeableCustomMenuCardMetrics.maxDragWidth,
            max(0, -offset)
        )
    }

    private func closeActions() {
        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            settledOffset = 0
        }
    }
}

private struct DiningFeedbackIntroHeader: View {
    let title: String
    let subtitle: String
    let contextText: String?

    var body: some View {
        VStack(spacing: 12) {
            Text(title)
                .font(TBFont.bold(18))
                .foregroundStyle(TBColor.textPrimary)
                .multilineTextAlignment(.center)
                .lineSpacing(2)

            VStack(spacing: 8) {
                Text(subtitle)
                    .font(TBFont.regular(14))
                    .foregroundStyle(TBColor.textBody)
                    .multilineTextAlignment(.center)
                    .lineSpacing(5)

                if let contextText, !contextText.isEmpty {
                    Text(contextText)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textHint)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 16)
    }
}

private struct InstagramLogo: View {
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .stroke(lineWidth: 2)

            Circle()
                .stroke(lineWidth: 2)
                .frame(width: 10, height: 10)

            Circle()
                .fill()
                .frame(width: 3, height: 3)
                .offset(x: 7, y: -7)
        }
        .accessibilityHidden(true)
    }
}

private struct TasteExperienceMapFocusRequest: Equatable {
    let id = UUID()
    let experienceID: String
}

private struct TasteExperienceSelectionCard: View {
    let experience: TasteExperience
    let selectedExperienceIDs: [String]
    let experienceByID: [String: TasteExperience]
    let onContinue: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 0) {
                Text(experience.label)
                    .font(TBFont.bold(16))
                    .foregroundStyle(experience.axis.mainColor)
                    .lineLimit(2)

                Text(experience.description)
                    .font(TBFont.regular(14))
                    .foregroundStyle(TBColor.textSubtle)
                    .lineSpacing(2)
                    .padding(.top, 4)

                TasteSelectionPriorityGuide(
                    selectedExperienceIDs: selectedExperienceIDs,
                    experienceByID: experienceByID
                )
                .padding(.top, 12)
            }

            Spacer(minLength: 0)

            Button(action: onContinue) {
                LucideIcon(
                    .chevronRight,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.medium
                )
                    .foregroundStyle(TBColor.textInverse)
                    .frame(width: 48, height: 48)
                    .background(TBColor.textPrimary)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(actionAccessibilityLabel)
        }
        .padding(16)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                .stroke(TBColor.borderCard, lineWidth: 1)
        }
        .shadow(
            color: TBShadow.soft.color,
            radius: TBShadow.soft.radius,
            x: TBShadow.soft.x,
            y: TBShadow.soft.y
        )
    }

    private var actionAccessibilityLabel: String {
        if selectedExperienceIDs.count >= 3 {
            return "선택한 미각 인상으로 기록하기"
        }

        return selectedExperienceIDs.contains(experience.id)
            ? "다음 미각 후보로 이동하기"
            : "현재 미각 인상 선택하기"
    }
}

private struct TasteSelectionPriorityGuide: View {
    let selectedExperienceIDs: [String]
    let experienceByID: [String: TasteExperience]

    var body: some View {
        HStack(spacing: 12) {
            ForEach(0..<3, id: \.self) { slotIndex in
                let slotExperience = selectedExperienceIDs[safe: slotIndex]
                    .flatMap { experienceByID[$0] }
                let isActiveSlot = slotIndex == activeSlotIndex
                let color = slotExperience?.axis.mainColor ?? TBColor.border

                HStack(spacing: 6) {
                    Circle()
                        .fill(slotExperience == nil ? Color.clear : color)
                        .overlay {
                            Circle().stroke(color, lineWidth: 1)
                        }
                        .frame(width: 12, height: 12)

                    if isActiveSlot {
                        Text(activeLabel)
                            .font(TBFont.semibold(11))
                            .foregroundStyle(TBColor.textFaint)
                            .fixedSize()
                    }
                }
                .frame(minHeight: 16)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(activeLabel)
    }

    private var activeSlotIndex: Int {
        min(selectedExperienceIDs.count, 2)
    }

    private var activeLabel: String {
        if selectedExperienceIDs.isEmpty {
            return "메인 미각 선택"
        }

        return selectedExperienceIDs.count < 3 ? "보조 미각 선택" : "미각 선택 완료"
    }
}

private struct TasteExperienceDetailHero: View {
    let experiences: [TasteExperience]
    let activeIndex: Int
    let onSelectIndex: (Int) -> Void

    private var activeExperience: TasteExperience? {
        guard !experiences.isEmpty else { return nil }
        return experiences[min(activeIndex, experiences.count - 1)]
    }

    var body: some View {
        VStack(spacing: 16) {
            if let activeExperience {
                VStack(spacing: 8) {
                    Text(activeIndex == 0 ? "메인 미각" : "보조 미각")
                        .font(TBFont.semibold(11))
                        .foregroundStyle(activeExperience.axis.tintTextColor.opacity(0.7))
                    Text(activeExperience.label)
                        .font(TBFont.bold(17))
                        .foregroundStyle(activeExperience.axis.tintTextColor)
                        .multilineTextAlignment(.center)
                }
                .padding(20)
                .frame(width: 176, height: 176)
                .background(activeExperience.axis.tintColor)
                .clipShape(Circle())
                .overlay {
                    Circle()
                        .stroke(activeExperience.axis.tintSoftBorderColor)
                }
            }

            HStack(spacing: 12) {
                ForEach(Array(experiences.enumerated()), id: \.element.id) { index, experience in
                    Button {
                        onSelectIndex(index)
                    } label: {
                        Circle()
                            .fill(
                                index == activeIndex
                                    ? experience.axis.tintColor
                                    : experience.axis.tintColor.opacity(0.45)
                            )
                            .frame(width: 24, height: 24)
                            .overlay {
                                Circle()
                                    .stroke(experience.axis.mainColor.opacity(0.22))
                            }
                            .scaleEffect(index == activeIndex ? 1.1 : 1)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(
                        "\(index == 0 ? "메인" : "보조") 미각 \(experience.label) 보기"
                    )
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
}

private struct DiningReflectionEntryCard: View {
    let photoData: Data?
    let onOpenNote: () -> Void
    let onOpenCamera: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            if let photoData, let image = UIImage(data: photoData) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 48, height: 48)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .clipped()
            } else {
                VStack(alignment: .leading, spacing: 3) {
                    Text("추가 메모 또는 사진")
                        .font(TBFont.medium(14))
                        .foregroundStyle(TBColor.textPrimary)
                    Text("선택한 버블과 태그를 보충하고 싶을 때만 남겨주세요.")
                        .font(TBFont.regular(11))
                        .foregroundStyle(TBColor.textMuted)
                        .lineLimit(2)
                }
            }

            Spacer(minLength: 0)

            Button(action: onOpenNote) {
                LucideIcon(
                    .pencil,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(width: 40, height: 40)
                .foregroundStyle(TBColor.textSecondary)
                .background(TBColor.focus)
                .clipShape(Circle())
                .overlay {
                    Circle().stroke(TBColor.border)
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel("선택사항인 추가 메모 작성")

            Button(action: onOpenCamera) {
                LucideIcon(
                    .camera,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(width: 40, height: 40)
                .foregroundStyle(TBColor.textSecondary)
                .background(TBColor.focus)
                .clipShape(Circle())
                .overlay {
                    Circle().stroke(TBColor.border)
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel("미식 기록 사진 추가")
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(TBColor.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(TBColor.borderSubtle)
        }
    }
}

private struct DiningReflectionPhotoEditor: View {
    let photoData: Data?
    @Binding var photoPickerItem: PhotosPickerItem?
    let onRemove: () -> Void

    var body: some View {
        if let photoData, let image = UIImage(data: photoData) {
            ZStack(alignment: .topTrailing) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .aspectRatio(4.0 / 3.0, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .clipped()

                Button(action: onRemove) {
                    LucideIcon(
                        .x,
                        size: TBIcon.Size.small,
                        strokeWidth: TBIcon.Stroke.medium
                    )
                    .frame(width: 36, height: 36)
                    .foregroundStyle(.white)
                    .background(Color.black.opacity(0.54))
                    .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .padding(10)
                .accessibilityLabel("선택한 사진 삭제")
            }
        } else {
            PhotosPicker(selection: $photoPickerItem, matching: .images) {
                VStack(spacing: 10) {
                    LucideIcon(
                        .camera,
                        size: TBIcon.Size.large,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    Text("사진첩에서 미식 기록 추가")
                        .font(TBFont.semibold(13))
                }
                .foregroundStyle(TBColor.textMuted)
                .frame(maxWidth: .infinity)
                .frame(height: 132)
                .background(TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(TBColor.border, style: StrokeStyle(dash: [5, 5]))
                }
            }
            .buttonStyle(.plain)
        }
    }
}

private struct DiningFeedbackCameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> DiningFeedbackCameraPreviewUIView {
        let view = DiningFeedbackCameraPreviewUIView()
        view.previewLayer.session = session
        view.previewLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ uiView: DiningFeedbackCameraPreviewUIView, context: Context) {
        uiView.previewLayer.session = session
    }
}

private final class DiningFeedbackCameraPreviewUIView: UIView {
    override class var layerClass: AnyClass {
        AVCaptureVideoPreviewLayer.self
    }

    var previewLayer: AVCaptureVideoPreviewLayer {
        layer as! AVCaptureVideoPreviewLayer
    }
}

private struct DiningFeedbackCameraStatusCard: View {
    let message: String

    var body: some View {
        Text(message)
            .font(TBFont.regular(13))
            .foregroundStyle(Color.white)
            .multilineTextAlignment(.center)
            .lineSpacing(4)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color.black.opacity(0.55))
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color.white.opacity(0.14))
            }
    }
}

private enum DiningFeedbackCameraControlMetrics {
    static let chromeButtonSize: CGFloat = 48
    static let captureButtonSize: CGFloat = 72
    static let captureButtonInnerSize: CGFloat = 58

    static var topChromePadding: CGFloat {
        max(
            0,
            AppChromeMetrics.topPadding
                + TBSize.topAppBarHeight / 2
                - chromeButtonSize / 2
        )
    }

    static var bottomPadding: CGFloat {
        (TBSize.bottomTabBarHeight - captureButtonSize) / 2
    }
}

private struct DiningFeedbackCameraChromeIcon: View {
    let icon: LucideIconName
    var isActive = false
    var showsBackground = true

    var body: some View {
        LucideIcon(
            icon,
            size: AppChromeMetrics.iconSize,
            strokeWidth: TBIcon.Stroke.regular
        )
        .frame(
            width: DiningFeedbackCameraControlMetrics.chromeButtonSize,
            height: DiningFeedbackCameraControlMetrics.chromeButtonSize
        )
        .foregroundStyle(Color.white)
        .background {
            if showsBackground {
                Circle()
                    .fill(Color.white.opacity(isActive ? 0.28 : 0.18))
            }
        }
        .contentShape(Circle())
    }
}



private struct DiningFeedbackRestaurantCandidate: Identifiable, Equatable {
    let id: String
    let name: String
    let address: String?
    let distanceMeters: CLLocationDistance?

    var detailText: String {
        let distanceText = distanceMeters.map(Self.formattedDistance)
        return [address, distanceText].compactMap { value in
            guard let value else { return nil }
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? nil : trimmed
        }
        .joined(separator: " · ")
    }

    private static func formattedDistance(_ meters: CLLocationDistance) -> String {
        if meters >= 1000 {
            return String(format: "%.1fkm 근처", meters / 1000)
        }

        return "\(Int(round(meters / 10) * 10))m 근처"
    }
}

private final class DiningFeedbackRestaurantResolver: NSObject, ObservableObject {
    enum State: Equatable {
        case idle
        case loading
        case found
        case unavailable(String)
    }

    @Published private(set) var candidates: [DiningFeedbackRestaurantCandidate] = []
    @Published private(set) var state: State = .idle

    private let locationManager = CLLocationManager()
    private let placeAPIClient = RestaurantPlaceAPIClient()
    private var latestLocation: CLLocation?
    private var activeResolutionID = UUID()
    private static let fullAccuracyPurposeKey = "DishMemoryRestaurantSuggestion"

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    var isLoading: Bool {
        if case .loading = state {
            return true
        }
        return false
    }

    var statusText: String {
        switch state {
        case .idle:
            return "사진 위치를 확인하면 카카오 장소 기준으로 후보를 제안할게요."
        case .loading:
            return "사진 위치 기준으로 가까운 식당을 카카오 장소에서 찾고 있어요."
        case .found:
            return "\(candidates.count)개의 가까운 식당 후보를 찾았어요."
        case .unavailable(let message):
            return message
        }
    }

    func prepareForPhotoLocation() {
        guard CLLocationManager.locationServicesEnabled() else {
            return
        }

        switch locationManager.authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            requestFullAccuracyIfNeeded()
            locationManager.startUpdatingLocation()
        case .denied, .restricted:
            break
        @unknown default:
            break
        }
    }

    @MainActor
    func resolveRestaurantCandidates(
        from photoData: Data,
        capturedLocation: CLLocation?,
        assetLocation: CLLocation?
    ) async {
        guard !Task.isCancelled else { return }
        let resolutionID = UUID()
        activeResolutionID = resolutionID
        state = .loading
        candidates = []

        guard let location = assetLocation
            ?? capturedLocation
            ?? Self.location(fromPhotoData: photoData)
            ?? latestLocation
            ?? locationManager.location
        else {
            state = .unavailable("사진에서 위치를 확인하지 못했어요. 식당명을 직접 입력해 주세요.")
            return
        }

        let recognizedTextLines = await Self.recognizedTextLines(from: photoData)
        guard !Task.isCancelled, activeResolutionID == resolutionID else { return }
        let nearbyCandidates = await searchNearbyRestaurants(
            near: location,
            recognizedTextLines: recognizedTextLines
        )
        guard !Task.isCancelled, activeResolutionID == resolutionID else { return }
        candidates = nearbyCandidates
        state = nearbyCandidates.isEmpty
            ? .unavailable("이 위치 주변의 식당 후보를 찾지 못했어요. 식당명을 직접 입력해 주세요.")
            : .found
    }

    @MainActor
    func reset() {
        activeResolutionID = UUID()
        candidates = []
        state = .idle
    }

    func captureLocationSnapshot() -> CLLocation? {
        latestLocation ?? locationManager.location
    }

    private func requestFullAccuracyIfNeeded() {
        guard #available(iOS 14.0, *),
              locationManager.accuracyAuthorization == .reducedAccuracy else {
            return
        }

        locationManager.requestTemporaryFullAccuracyAuthorization(
            withPurposeKey: Self.fullAccuracyPurposeKey
        ) { [weak self] _ in
            self?.locationManager.startUpdatingLocation()
        }
    }

    private func searchNearbyRestaurants(
        near location: CLLocation,
        recognizedTextLines: [String]
    ) async -> [DiningFeedbackRestaurantCandidate] {
        let kakaoCandidates = await searchKakaoNearbyRestaurants(
            near: location,
            recognizedTextLines: recognizedTextLines
        )
        if !kakaoCandidates.isEmpty {
            return kakaoCandidates
        }

        return await searchMapKitNearbyRestaurants(
            near: location,
            recognizedTextLines: recognizedTextLines
        )
    }

    private func searchKakaoNearbyRestaurants(
        near location: CLLocation,
        recognizedTextLines: [String]
    ) async -> [DiningFeedbackRestaurantCandidate] {
        var seenIDs = Set<String>()
        var candidates: [DiningFeedbackRestaurantCandidate] = []
        let radii = searchRadii(for: location)

        func appendPlaces(_ places: [KakaoRestaurantPlace]) {
            for place in places {
                guard let candidate = candidate(from: place, photoLocation: location),
                      seenIDs.insert(candidate.id).inserted else {
                    continue
                }
                candidates.append(candidate)
            }
        }

        for radius in radii {
            do {
                let places = try await placeAPIClient.searchNearbyKakaoRestaurantPlaces(
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    radiusMeters: radius,
                    size: 15
                )

                appendPlaces(places)

                if candidates.count >= 5 {
                    break
                }
            } catch {
                continue
            }
        }

        let keywordRadius = max(radii.last ?? 700, 700)
        for query in Self.restaurantSearchQueries(from: recognizedTextLines) {
            do {
                let places = try await placeAPIClient.searchNearbyKakaoRestaurantPlaces(
                    query: query,
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    radiusMeters: keywordRadius,
                    size: 5
                )
                appendPlaces(places)
            } catch {
                continue
            }
        }

        return Array(
            rankedCandidates(
                candidates,
                recognizedTextLines: recognizedTextLines
            )
                .prefix(5)
        )
    }

    private func searchMapKitNearbyRestaurants(
        near location: CLLocation,
        recognizedTextLines: [String]
    ) async -> [DiningFeedbackRestaurantCandidate] {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = "restaurant"
        request.resultTypes = .pointOfInterest
        request.region = MKCoordinateRegion(
            center: location.coordinate,
            latitudinalMeters: 420,
            longitudinalMeters: 420
        )

        do {
            let response = try await MKLocalSearch(request: request).start()
            return Array(
                rankedCandidates(
                    response.mapItems.compactMap { item in
                        candidate(from: item, photoLocation: location)
                    },
                    recognizedTextLines: recognizedTextLines
                )
                    .prefix(5)
            )
        } catch {
            return []
        }
    }

    private func searchRadii(for location: CLLocation) -> [Int] {
        let accuracy = location.horizontalAccuracy
        let minimumRadius = accuracy > 0
            ? min(700, max(120, Int(accuracy.rounded(.up)) * 2))
            : 150
        return [minimumRadius, 300, 700]
            .map { min(max($0, 80), 1000) }
            .sorted()
            .reduce(into: [Int]()) { result, radius in
                if !result.contains(radius) {
                    result.append(radius)
                }
            }
    }

    private func rankedCandidates(
        _ candidates: [DiningFeedbackRestaurantCandidate],
        recognizedTextLines: [String]
    ) -> [DiningFeedbackRestaurantCandidate] {
        candidates.sorted { lhs, rhs in
            candidateScore(lhs, recognizedTextLines: recognizedTextLines)
                < candidateScore(rhs, recognizedTextLines: recognizedTextLines)
        }
    }

    private func candidateScore(
        _ candidate: DiningFeedbackRestaurantCandidate,
        recognizedTextLines: [String]
    ) -> Double {
        let distanceScore = candidate.distanceMeters ?? .greatestFiniteMagnitude
        return max(
            0,
            distanceScore - textMatchBoost(
                for: candidate,
                recognizedTextLines: recognizedTextLines
            )
        )
    }

    private func textMatchBoost(
        for candidate: DiningFeedbackRestaurantCandidate,
        recognizedTextLines: [String]
    ) -> Double {
        let recognizedText = recognizedTextLines
            .map(Self.normalizedSearchText)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        guard !recognizedText.isEmpty else {
            return 0
        }

        let normalizedName = Self.normalizedSearchText(candidate.name)
        if normalizedName.count >= 2, recognizedText.contains(normalizedName) {
            return 420
        }

        if Self.meaningfulTokens(from: candidate.name).contains(where: recognizedText.contains) {
            return 240
        }

        if let address = candidate.address,
           Self.meaningfulTokens(from: address).contains(where: recognizedText.contains) {
            return 80
        }

        return 0
    }

    private func candidate(
        from item: MKMapItem,
        photoLocation: CLLocation
    ) -> DiningFeedbackRestaurantCandidate? {
        guard let name = item.name?.trimmingCharacters(in: .whitespacesAndNewlines),
              !name.isEmpty else {
            return nil
        }

        let itemLocation = item.placemark.location
        let distance = itemLocation?.distance(from: photoLocation)
        let coordinate = item.placemark.coordinate
        let address = formattedAddress(from: item.placemark)
        let id = [
            name,
            String(format: "%.5f", coordinate.latitude),
            String(format: "%.5f", coordinate.longitude)
        ].joined(separator: "-")

        return DiningFeedbackRestaurantCandidate(
            id: id,
            name: name,
            address: address,
            distanceMeters: distance
        )
    }

    private func candidate(
        from place: KakaoRestaurantPlace,
        photoLocation: CLLocation
    ) -> DiningFeedbackRestaurantCandidate? {
        guard let latitude = place.latitude,
              let longitude = place.longitude else {
            return nil
        }

        let placeLocation = CLLocation(latitude: latitude, longitude: longitude)
        let address = place.roadAddress ?? place.address
        let id = place.placeID ?? [
            place.name,
            String(format: "%.5f", latitude),
            String(format: "%.5f", longitude)
        ].joined(separator: "-")

        return DiningFeedbackRestaurantCandidate(
            id: "kakao-\(id)",
            name: place.name,
            address: address,
            distanceMeters: placeLocation.distance(from: photoLocation)
        )
    }

    private func formattedAddress(from placemark: MKPlacemark) -> String? {
        let components = [
            placemark.locality,
            placemark.subLocality,
            placemark.thoroughfare
        ]
        .compactMap { value -> String? in
            guard let value else { return nil }
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? nil : trimmed
        }

        return components.isEmpty ? placemark.title : components.joined(separator: " ")
    }

    private static func location(fromPhotoData data: Data) -> CLLocation? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let gps = properties[kCGImagePropertyGPSDictionary] as? [CFString: Any],
              let latitude = doubleValue(gps[kCGImagePropertyGPSLatitude]),
              let longitude = doubleValue(gps[kCGImagePropertyGPSLongitude])
        else {
            return nil
        }

        let latitudeRef = stringValue(gps[kCGImagePropertyGPSLatitudeRef])
        let longitudeRef = stringValue(gps[kCGImagePropertyGPSLongitudeRef])
        let resolvedLatitude = latitudeRef == "S" ? -latitude : latitude
        let resolvedLongitude = longitudeRef == "W" ? -longitude : longitude

        return CLLocation(latitude: resolvedLatitude, longitude: resolvedLongitude)
    }

    private static func recognizedTextLines(from data: Data) async -> [String] {
        guard let image = UIImage(data: data),
              let cgImage = image.cgImage else {
            return []
        }

        return await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                let request = VNRecognizeTextRequest()
                request.recognitionLevel = .accurate
                request.recognitionLanguages = ["ko-KR", "en-US"]
                request.usesLanguageCorrection = true

                let handler = VNImageRequestHandler(
                    cgImage: cgImage,
                    orientation: cgImageOrientation(for: image.imageOrientation),
                    options: [:]
                )
                do {
                    try handler.perform([request])
                    let lines = request.results?
                        .compactMap { observation in
                            observation.topCandidates(1).first?.string
                        } ?? []
                    continuation.resume(returning: lines)
                } catch {
                    continuation.resume(returning: [])
                }
            }
        }
    }

    private static func restaurantSearchQueries(from lines: [String]) -> [String] {
        let excludedFragments = [
            "합계", "승인", "카드", "영수증", "주문", "테이블", "사업자", "대표",
            "전화", "tel", "total", "receipt", "card", "order", "table"
        ]
        var seen = Set<String>()

        return lines.compactMap { line -> String? in
            let collapsed = line
                .replacingOccurrences(of: "\n", with: " ")
                .split(whereSeparator: \.isWhitespace)
                .joined(separator: " ")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            guard collapsed.count >= 2, collapsed.count <= 32 else {
                return nil
            }
            guard !isMostlyNumeric(collapsed) else {
                return nil
            }

            let normalized = normalizedSearchText(collapsed)
            guard normalized.count >= 2,
                  !excludedFragments.contains(where: { normalized.contains(normalizedSearchText($0)) }),
                  seen.insert(normalized).inserted else {
                return nil
            }

            return collapsed
        }
        .prefix(4)
        .map(\.self)
    }

    private static func meaningfulTokens(from value: String) -> [String] {
        value
            .split(whereSeparator: { character in
                character.isWhitespace || character.isPunctuation || character.isSymbol
            })
            .map(String.init)
            .map(normalizedSearchText)
            .filter { token in
                token.count >= 2 && !isMostlyNumeric(token)
            }
    }

    private static func normalizedSearchText(_ value: String) -> String {
        value
            .lowercased()
            .filter { character in
                character.isLetter || character.isNumber || character.isWhitespace
            }
            .split(whereSeparator: \.isWhitespace)
            .joined()
    }

    private static func isMostlyNumeric(_ value: String) -> Bool {
        let characters = value.filter { !$0.isWhitespace }
        guard !characters.isEmpty else {
            return true
        }

        let numericCount = characters.filter(\.isNumber).count
        return Double(numericCount) / Double(characters.count) > 0.6
    }

    private static func cgImageOrientation(for orientation: UIImage.Orientation) -> CGImagePropertyOrientation {
        switch orientation {
        case .up:
            return .up
        case .upMirrored:
            return .upMirrored
        case .down:
            return .down
        case .downMirrored:
            return .downMirrored
        case .left:
            return .left
        case .leftMirrored:
            return .leftMirrored
        case .right:
            return .right
        case .rightMirrored:
            return .rightMirrored
        @unknown default:
            return .up
        }
    }

    private static func doubleValue(_ value: Any?) -> Double? {
        if let value = value as? Double {
            return value
        }
        if let value = value as? NSNumber {
            return value.doubleValue
        }
        if let value = value as? String {
            return Double(value)
        }
        return nil
    }

    private static func stringValue(_ value: Any?) -> String? {
        if let value = value as? String {
            return value
        }
        return nil
    }
}

extension DiningFeedbackRestaurantResolver: CLLocationManagerDelegate {
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            requestFullAccuracyIfNeeded()
            manager.startUpdatingLocation()
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        latestLocation = locations.last
    }
}

private final class DiningFeedbackCameraModel: NSObject, ObservableObject {
    var onCapture: ((Data) -> Void)?

    @Published private(set) var previewSession: AVCaptureSession?
    @Published private(set) var isRunning = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var isFlashOn = false
    @Published private(set) var canUseFlash = false

    private let sessionQueue = DispatchQueue(label: "com.tastebuddy.dining-feedback.camera")
    // First-use AVFoundation setup must not block the launch overlay's first frame.
    // Both properties are accessed only on sessionQueue.
    private lazy var session = AVCaptureSession()
    private lazy var output = AVCapturePhotoOutput()
    private var videoInput: AVCaptureDeviceInput?
    private var currentPosition: AVCaptureDevice.Position = .back

    func start() {
        setErrorMessage(nil)

        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            configureAndStart()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] isGranted in
                guard let self else { return }
                if isGranted {
                    self.configureAndStart()
                } else {
                    self.setErrorMessage("카메라 접근이 허용되지 않았어요. 설정에서 권한을 켜거나 사진첩에서 이미지를 선택해주세요.")
                }
            }
        case .denied, .restricted:
            setErrorMessage("카메라 접근이 허용되지 않았어요. 설정에서 권한을 켜거나 사진첩에서 이미지를 선택해주세요.")
        @unknown default:
            setErrorMessage("카메라 상태를 확인하지 못했어요. 사진첩에서 이미지를 선택해 기록을 이어갈 수 있어요.")
        }
    }

    func stop() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            self.turnOffTorchIfNeeded()
            if self.session.isRunning {
                self.session.stopRunning()
            }
            self.setIsFlashOn(false)
            self.setIsRunning(false)
        }
    }

    func capturePhoto() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            guard self.session.isRunning else {
                self.setErrorMessage("카메라 화면을 불러온 뒤 다시 촬영해주세요.")
                return
            }

            let settings = AVCapturePhotoSettings()
            if self.videoInput?.device.hasFlash == true {
                settings.flashMode = self.isFlashOn ? .on : .off
            }
            self.output.capturePhoto(with: settings, delegate: self)
        }
    }

    func switchCamera() {
        let nextPosition: AVCaptureDevice.Position = currentPosition == .back ? .front : .back
        sessionQueue.async { [weak self] in
            guard let self else { return }
            do {
                self.turnOffTorchIfNeeded()
                try self.configureSession(position: nextPosition)
                if !self.session.isRunning {
                    self.session.startRunning()
                }
                self.setIsFlashOn(false)
                self.setIsRunning(true)
                self.setErrorMessage(nil)
            } catch {
                self.setErrorMessage("카메라를 전환하지 못했어요.")
            }
        }
    }

    func toggleFlash() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            guard let device = self.videoInput?.device,
                  device.hasTorch || device.hasFlash else {
                self.setErrorMessage("이 기기에서는 플래시를 바로 켤 수 없어요.")
                self.setIsFlashOn(false)
                return
            }

            let nextFlashState = !self.isFlashOn
            do {
                if device.hasTorch {
                    try self.setTorch(nextFlashState, on: device)
                }
                self.setIsFlashOn(nextFlashState)
                self.setErrorMessage(nil)
            } catch {
                self.setIsFlashOn(false)
                self.setErrorMessage("플래시를 켜지 못했어요.")
            }
        }
    }

    private func configureAndStart() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            do {
                try self.configureSession(position: self.currentPosition)
                if !self.session.isRunning {
                    self.session.startRunning()
                }
                self.setIsRunning(true)
                self.setErrorMessage(nil)
            } catch {
                self.setErrorMessage("이 기기에서는 카메라를 바로 열 수 없어요. 사진첩에서 이미지를 골라도 기록을 이어갈 수 있어요.")
            }
        }
    }

    private func configureSession(position: AVCaptureDevice.Position) throws {
        session.beginConfiguration()
        defer { session.commitConfiguration() }

        session.sessionPreset = .photo
        turnOffTorchIfNeeded()

        for input in session.inputs {
            session.removeInput(input)
        }
        for output in session.outputs {
            session.removeOutput(output)
        }

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
            ?? AVCaptureDevice.default(for: .video)
        else {
            throw CameraConfigurationError.unavailable
        }

        let nextInput = try AVCaptureDeviceInput(device: device)
        guard session.canAddInput(nextInput) else {
            throw CameraConfigurationError.unavailable
        }
        session.addInput(nextInput)

        guard session.canAddOutput(output) else {
            throw CameraConfigurationError.unavailable
        }
        session.addOutput(output)

        videoInput = nextInput
        currentPosition = nextInput.device.position
        setCanUseFlash(nextInput.device.hasTorch || nextInput.device.hasFlash)
    }

    private func turnOffTorchIfNeeded() {
        guard let device = videoInput?.device,
              device.hasTorch,
              device.torchMode != .off else {
            return
        }

        try? setTorch(false, on: device)
    }

    private func setTorch(_ isOn: Bool, on device: AVCaptureDevice) throws {
        try device.lockForConfiguration()
        defer {
            device.unlockForConfiguration()
        }

        if isOn {
            let level = min(Float(0.78), AVCaptureDevice.maxAvailableTorchLevel)
            try device.setTorchModeOn(level: level)
        } else {
            device.torchMode = .off
        }
    }

    private func setIsRunning(_ value: Bool) {
        let preparedSession = value ? session : nil
        DispatchQueue.main.async {
            self.previewSession = preparedSession
            self.isRunning = value
        }
    }

    private func setIsFlashOn(_ value: Bool) {
        DispatchQueue.main.async {
            self.isFlashOn = value
        }
    }

    private func setCanUseFlash(_ value: Bool) {
        DispatchQueue.main.async {
            self.canUseFlash = value
            if !value {
                self.isFlashOn = false
            }
        }
    }

    private func setErrorMessage(_ message: String?) {
        DispatchQueue.main.async {
            self.errorMessage = message
        }
    }

    private enum CameraConfigurationError: Error {
        case unavailable
    }
}

extension DiningFeedbackCameraModel: AVCapturePhotoCaptureDelegate {
    func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        if error != nil {
            setErrorMessage("사진을 저장하지 못했어요. 다시 시도해주세요.")
            return
        }

        guard let data = photo.fileDataRepresentation() else {
            setErrorMessage("사진을 저장하지 못했어요. 다시 시도해주세요.")
            return
        }

        DispatchQueue.main.async {
            self.onCapture?(data)
        }
    }
}

private struct DiningDetailTagSelector: View {
    let category: DiningFeedbackTagCategoryContract
    let accentAxis: TasteAxis
    let selectedTagIDs: [String]
    let recommendedTagIDs: [String]
    let customTags: [DiningFeedbackTagContract]
    let onToggle: (String) -> Void
    let isCustomInputOpen: Bool
    @Binding var customInputValue: String
    let onOpenCustomInput: () -> Void
    let onCloseCustomInput: () -> Void
    let onSubmitCustomInput: () -> Void

    @FocusState private var isCustomInputFocused: Bool

    private var orderedTags: [DiningFeedbackTagContract] {
        DiningSensoryRecommendationPolicy.orderedTags(
            category.tags + customTags,
            recommendedIDs: recommendedTagIDs
        )
    }

    private var tagRows: [[DiningFeedbackTagContract]] {
        let breakIndex = Int(ceil(Double(orderedTags.count) / 2))
        return [
            Array(orderedTags.prefix(breakIndex)),
            Array(orderedTags.dropFirst(breakIndex)),
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(category.label)
                    .font(TBFont.bold(14))
                    .foregroundStyle(TBColor.textPrimary)
                Spacer()
                Text("선택사항")
                    .font(TBFont.medium(11))
                    .foregroundStyle(TBColor.textFaint)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        customInputControl
                        ForEach(tagRows[0]) { tag in
                            tagButton(tag)
                        }
                    }
                    HStack(spacing: 8) {
                        ForEach(tagRows[1]) { tag in
                            tagButton(tag)
                        }
                    }
                }
                .padding(.horizontal, TBSpacing.page)
            }
            .contentMargins(.horizontal, 0, for: .scrollContent)
            .padding(.horizontal, -TBSpacing.page)
        }
    }

    @ViewBuilder
    private var customInputControl: some View {
        if isCustomInputOpen {
            TextField("", text: $customInputValue)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textPrimary)
                .tint(TBColor.textPrimary)
                .multilineTextAlignment(.center)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.done)
                .focused($isCustomInputFocused)
                .padding(.horizontal, 12)
                .frame(width: customInputWidth, height: 36)
                .background(TBColor.mutedSurface)
                .clipShape(Capsule())
                .overlay {
                    Capsule().stroke(TBColor.border)
                }
                .onSubmit(onSubmitCustomInput)
                .onAppear {
                    DispatchQueue.main.async {
                        isCustomInputFocused = true
                    }
                }
                .onChange(of: isCustomInputFocused) { _, isFocused in
                    if !isFocused,
                       customInputValue.trimmingCharacters(
                           in: .whitespacesAndNewlines
                       ).isEmpty {
                        onCloseCustomInput()
                    }
                }
                .accessibilityLabel("\(category.label) 직접 입력")
        } else {
            DiningFeedbackAddChipButton(
                accessibilityLabel: "\(category.label) 직접 입력",
                action: onOpenCustomInput
            )
        }
    }

    private var customInputWidth: CGFloat {
        let trimmedValue = customInputValue.trimmingCharacters(in: .newlines)
        guard !trimmedValue.isEmpty else {
            return 36
        }

        let font = UIFont(name: "Pretendard-SemiBold", size: 12)
            ?? UIFont.systemFont(ofSize: 12, weight: .semibold)
        let textWidth = (trimmedValue as NSString).size(
            withAttributes: [.font: font]
        ).width
        return min(220, max(36, ceil(textWidth) + 24))
    }

    private func tagButton(_ tag: DiningFeedbackTagContract) -> some View {
        let isSelected = selectedTagIDs.contains(tag.id)
        return Button {
            onToggle(tag.id)
        } label: {
            Text(tag.label)
                .font(TBFont.semibold(12))
                .foregroundStyle(
                    isSelected
                        ? accentAxis.mainColor
                        : TBColor.textSubtle
                )
                .padding(.horizontal, 12)
                .frame(height: 36)
                .background(
                    isSelected
                        ? accentAxis.tintColor
                        : TBColor.mutedSurface
                )
                .clipShape(Capsule())
                .overlay {
                    Capsule()
                        .stroke(
                            isSelected
                                ? accentAxis.mainColor.opacity(0.28)
                                : TBColor.border
                        )
                }
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

private struct DiningFeedbackResultVisualPalette {
    let background: Color
    let main: Color
    let secondary: Color
    let tertiary: Color
    let photoAreaProportions: [Double]?

    static func taste(experiences: [TasteExperience]) -> DiningFeedbackResultVisualPalette {
        let mainAxis = experiences.first?.axis ?? .umami
        let secondaryAxis = experiences.dropFirst().first?.axis ?? mainAxis
        let tertiaryAxis = experiences.dropFirst(2).first?.axis ?? secondaryAxis
        return DiningFeedbackResultVisualPalette(
            background: mainAxis.tintColor,
            main: mainAxis.mainColor,
            secondary: secondaryAxis.mainColor,
            tertiary: tertiaryAxis.mainColor,
            photoAreaProportions: nil
        )
    }

    static func photo(_ palette: DiningPhotoPalette) -> DiningFeedbackResultVisualPalette {
        DiningFeedbackResultVisualPalette(
            background: palette.primary.tintSwiftUIColor,
            main: palette.primary.swiftUIColor,
            secondary: palette.secondary.swiftUIColor,
            tertiary: palette.tertiary.swiftUIColor,
            photoAreaProportions: palette.colorProportions
        )
    }
}

private struct DiningFeedbackResultBackground: View {
    let palette: DiningFeedbackResultVisualPalette
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation) { timeline in
            GeometryReader { proxy in
                let elapsed = reduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
                let size = proxy.size
                let largest = max(size.width, size.height)
                let primaryAreaScale = areaScale(for: 0, tasteBaseline: 0.56)
                let secondaryAreaScale = areaScale(for: 1, tasteBaseline: 0.24)
                let tertiaryAreaScale = areaScale(for: 2, tasteBaseline: 0.20)

                ZStack {
                    palette.background

                    LinearGradient(
                        gradient: backgroundGradient,
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .opacity(0.68)
                    .scaleEffect(1.16)

                    meshBlob(
                        color: palette.main,
                        opacity: 0.92,
                        width: largest * 1.56 * primaryAreaScale,
                        height: largest * 1.28 * primaryAreaScale,
                        centerX: 0.38,
                        centerY: 0.42,
                        containerSize: size,
                        driftX: sin(elapsed / 3.8) * size.width * 0.10,
                        driftY: cos(elapsed / 3.8) * size.height * 0.08,
                        scale: 1.10 + CGFloat(sin(elapsed / 2.2)) * 0.08,
                        blur: 34
                    )

                    meshBlob(
                        color: palette.secondary,
                        opacity: 0.86,
                        width: largest * 0.82 * secondaryAreaScale,
                        height: largest * 0.66 * secondaryAreaScale,
                        centerX: 0.74,
                        centerY: 0.25,
                        containerSize: size,
                        driftX: cos(elapsed / 3.2) * size.width * 0.16,
                        driftY: sin(elapsed / 3.2) * size.height * 0.12,
                        scale: 1.08 + CGFloat(cos(elapsed / 2.4)) * 0.10,
                        blur: 28
                    )

                    meshBlob(
                        color: palette.tertiary,
                        opacity: 0.82,
                        width: largest * 0.88 * tertiaryAreaScale,
                        height: largest * 0.72 * tertiaryAreaScale,
                        centerX: 0.40,
                        centerY: 0.78,
                        containerSize: size,
                        driftX: sin(elapsed / 3.5) * size.width * 0.14,
                        driftY: cos(elapsed / 3.5) * size.height * 0.15,
                        scale: 1.10 + CGFloat(sin(elapsed / 2.6)) * 0.11,
                        blur: 30
                    )

                    Color.white.opacity(0.08)
                }
                .frame(width: size.width, height: size.height)
                .clipped()
            }
        }
    }

    private var backgroundGradient: Gradient {
        guard let proportions = palette.photoAreaProportions else {
            return Gradient(colors: [
                palette.secondary.opacity(0.10),
                palette.main.opacity(0.42),
                palette.tertiary.opacity(0.08)
            ])
        }

        let colors = [palette.main, palette.secondary, palette.tertiary]
        let active = zip(colors, proportions)
            .filter { $0.1 > 0.000_1 }
            .map { (color: $0.0, proportion: $0.1) }
        guard let first = active.first else {
            return Gradient(colors: [palette.main])
        }

        var stops = [Gradient.Stop(color: first.color.opacity(0.42), location: 0)]
        var boundary = first.proportion
        for index in 0..<(active.count - 1) {
            let current = active[index]
            let next = active[index + 1]
            let transition = min(0.045, current.proportion * 0.18, next.proportion * 0.18)
            stops.append(Gradient.Stop(
                color: current.color.opacity(0.42),
                location: min(1, max(0, boundary - transition))
            ))
            stops.append(Gradient.Stop(
                color: next.color.opacity(0.42),
                location: min(1, max(0, boundary + transition))
            ))
            boundary += next.proportion
        }
        stops.append(Gradient.Stop(
            color: active.last?.color.opacity(0.42) ?? first.color.opacity(0.42),
            location: 1
        ))
        return Gradient(stops: stops)
    }

    private func areaScale(for index: Int, tasteBaseline: Double) -> CGFloat {
        guard let proportions = palette.photoAreaProportions,
              proportions.indices.contains(index) else {
            return 1
        }
        guard proportions[index] > 0 else {
            return 0.001
        }
        return CGFloat(sqrt(proportions[index] / tasteBaseline))
    }

    private func meshBlob(
        color: Color,
        opacity: Double,
        width: CGFloat,
        height: CGFloat,
        centerX: CGFloat,
        centerY: CGFloat,
        containerSize: CGSize,
        driftX: CGFloat,
        driftY: CGFloat,
        scale: CGFloat,
        blur: CGFloat
    ) -> some View {
        RadialGradient(
            colors: [
                Color.white.opacity(0.24),
                color.opacity(opacity * 0.70),
                color.opacity(opacity * 0.34),
                Color.clear
            ],
            center: .center,
            startRadius: 0,
            endRadius: max(width, height) * 0.48
        )
        .frame(width: width, height: height)
        .scaleEffect(scale)
        .blur(radius: blur)
        .position(
            x: centerX * containerSize.width + driftX,
            y: centerY * containerSize.height + driftY
        )
        .allowsHitTesting(false)
    }
}

private struct DiningFeedbackResultCardBloom<Content: View>: View {
    let palette: DiningFeedbackResultVisualPalette
    let reduceMotion: Bool
    @ViewBuilder let content: () -> Content

    @State private var hasStarted = false
    @State private var isEntered = false
    @State private var isHaloVisible = false

    var body: some View {
        ZStack {
            halo

            content()
                .opacity(reduceMotion || isEntered ? 1 : 0)
                .blur(radius: reduceMotion || isEntered ? 0 : 8)
                .scaleEffect(reduceMotion || isEntered ? 1 : 0.88, anchor: .center)
                .offset(y: reduceMotion || isEntered ? 0 : 24)
        }
        .task {
            await runEntryAnimationIfNeeded()
        }
    }

    private var halo: some View {
        RoundedRectangle(cornerRadius: 32, style: .continuous)
            .fill(
                AngularGradient(
                    colors: [
                        .clear,
                        palette.main.opacity(0.22),
                        .clear,
                        palette.secondary.opacity(0.18),
                        .clear,
                        palette.tertiary.opacity(0.16),
                        .clear,
                        palette.main.opacity(0.18),
                        .clear
                    ],
                    center: .center,
                    angle: .degrees(-18)
                )
            )
            .overlay {
                RoundedRectangle(cornerRadius: 32, style: .continuous)
                    .fill(
                        RadialGradient(
                            colors: [
                                palette.main.opacity(0.26),
                                .clear
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: 168
                        )
                    )
            }
            .padding(-22)
            .blur(radius: isHaloVisible ? 14 : 22)
            .opacity(reduceMotion ? 0 : (isHaloVisible ? 0.72 : 0))
            .scaleEffect(isHaloVisible ? 1.08 : 1.34)
            .rotationEffect(.degrees(isHaloVisible ? 5 : 18))
            .allowsHitTesting(false)
    }

    @MainActor
    private func runEntryAnimationIfNeeded() async {
        guard !hasStarted else {
            return
        }

        hasStarted = true

        guard !reduceMotion else {
            isEntered = true
            return
        }

        withAnimation(TasteBloomMotion.animation(.bloom, reduceMotion: reduceMotion)?.delay(TasteBloomMotion.Role.press.duration)) {
            isEntered = true
        }

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)?.delay(TasteBloomMotion.stagger)) {
            isHaloVisible = true
        }

        try? await Task.sleep(for: .seconds(TasteBloomMotion.Role.sheet.duration))
        guard !Task.isCancelled else { return }

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            isHaloVisible = false
        }
    }
}

private struct DiningFeedbackResultCard: View {
    let kind: DiningFeedbackResultKind
    let restaurant: String
    let menuTitle: String
    let experiences: [TasteExperience]
    let detailTags: [DiningDetailTagMetadata]
    let reflectionNote: String
    let photoData: Data?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            resultImage

            VStack(alignment: .leading, spacing: 2) {
                Text(displayTitle)
                    .font(TBFont.bold(14))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineLimit(2)
                Text(displaySubtitle)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textMuted)
            }

            if kind == .tasteFeedback && (!experiences.isEmpty || !detailTags.isEmpty) {
                VStack(alignment: .leading, spacing: DiningFeedbackResultLayout.chipRowGap) {
                    if !experiences.isEmpty {
                        HStack(spacing: DiningFeedbackResultLayout.chipGap) {
                            ForEach(Array(experiences.prefix(3))) { experience in
                                DiningResultReactionBubble(experience: experience)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .clipped()
                    }

                    if !detailTags.isEmpty {
                        DiningResultDetailTagRow(detailTags: detailTags)
                    }
                }
            }

            if kind == .quickCapture {
                HStack(alignment: .top, spacing: 8) {
                    LucideIcon(
                        .sparkles,
                        size: TBIcon.Size.xSmall,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .padding(.top, 1)

                    Text("취향은 언제든 덧붙일 수 있어요.")
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textSubtle)
                        .lineSpacing(3)
                }
                .foregroundStyle(TBColor.textPrimary)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            } else if !reflectionNote.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        LucideIcon(
                            .sparkles,
                            size: TBIcon.Size.xSmall,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        Text("미식 노트")
                            .font(TBFont.semibold(13))
                    }
                    .foregroundStyle(TBColor.textPrimary)

                    Text(reflectionNote)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textSubtle)
                        .lineSpacing(3)
                        .lineLimit(4)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .padding(12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: Color.black.opacity(0.16), radius: 35, x: 0, y: 24)
    }

    private var trimmedMenuTitle: String {
        menuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var displayTitle: String {
        kind == .quickCapture && trimmedMenuTitle.isEmpty
            ? restaurant
            : trimmedMenuTitle
    }

    private var displaySubtitle: String {
        kind == .quickCapture && trimmedMenuTitle.isEmpty
            ? "식사를 담아두었어요"
            : restaurant
    }

    @ViewBuilder
    private var resultImage: some View {
        Color.clear
            .aspectRatio(DiningFeedbackResultLayout.photoAspectRatio, contentMode: .fit)
            .overlay {
                ZStack {
                    TBColor.disabledSurface

                    if let photoData, let image = UIImage(data: photoData) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                    } else {
                        LucideIcon(
                            .camera,
                            size: TBIcon.Size.large,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        .foregroundStyle(TBColor.textHint)
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private enum DiningFeedbackResultLayout {
    static let cardHorizontalPadding: CGFloat = 50
    static let photoAspectRatio: CGFloat = 4.0 / 5.0
    static let chipGap: CGFloat = 6
    static let chipRowGap: CGFloat = 6
}

private struct DiningResultReactionBubble: View {
    let experience: TasteExperience

    var body: some View {
        Text(experience.label)
            .font(TBFont.semibold(10))
            .lineLimit(1)
            .foregroundStyle(experience.axis.mainColor)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(experience.axis.tintSoftColor)
            .clipShape(Capsule())
            .overlay {
                Capsule()
                    .stroke(experience.axis.tintSoftBorderColor, lineWidth: 1)
            }
            .fixedSize(horizontal: true, vertical: false)
            .accessibilityLabel(experience.label)
            .accessibilityHint(experience.axis.label)
    }
}

private struct DiningResultDetailTagRow: View {
    let detailTags: [DiningDetailTagMetadata]

    var body: some View {
        TBOverflowTagRow(items: detailTags, spacing: DiningFeedbackResultLayout.chipGap) { tag in
            TasteChip(title: tag.label, tone: .neutral, size: .xs)
                .accessibilityLabel("\(tag.label), \(tag.categoryLabel)")
        } overflow: { count in
            TasteChip(title: "+\(count)", tone: .neutral, size: .xs)
                .accessibilityLabel("\(count)개 태그 더 있음")
        }
    }
}

private struct DiningFeedbackResultShareImage: View {
    let kind: DiningFeedbackResultKind
    let restaurant: String
    let menuTitle: String
    let experiences: [TasteExperience]
    let detailTags: [DiningDetailTagMetadata]
    let reflectionNote: String
    let photoData: Data?
    let palette: DiningFeedbackResultVisualPalette
    let canvasSize: CGSize

    var body: some View {
        ZStack {
            DiningFeedbackResultBackground(palette: palette)

            DiningFeedbackResultCard(
                kind: kind,
                restaurant: restaurant,
                menuTitle: menuTitle,
                experiences: experiences,
                detailTags: detailTags,
                reflectionNote: reflectionNote,
                photoData: photoData
            )
            .padding(.horizontal, DiningFeedbackResultLayout.cardHorizontalPadding)
        }
        .frame(width: canvasSize.width, height: canvasSize.height)
        .clipped()
    }
}

#if DEBUG
private struct DiningFeedbackQuickCaptureResultPreview: View {
    private let palette = DiningFeedbackResultVisualPalette(
        background: Color(red: 0.94, green: 0.89, blue: 0.82),
        main: Color(red: 0.82, green: 0.43, blue: 0.20),
        secondary: Color(red: 0.36, green: 0.55, blue: 0.34),
        tertiary: Color(red: 0.75, green: 0.62, blue: 0.36),
        photoAreaProportions: [0.58, 0.27, 0.15]
    )

    var body: some View {
        ZStack {
            DiningFeedbackResultBackground(palette: palette)

            DiningFeedbackResultCard(
                kind: .quickCapture,
                restaurant: "온지음",
                menuTitle: "",
                experiences: [],
                detailTags: [],
                reflectionNote: "",
                photoData: nil
            )
            .padding(.horizontal, DiningFeedbackResultLayout.cardHorizontalPadding)
        }
        .frame(width: 390, height: 844)
    }
}

#Preview("Quick capture completion") {
    DiningFeedbackQuickCaptureResultPreview()
}
#endif

private struct TasteExperienceSearchSheet: View {
    let axes: [TasteExperienceAxisContract]
    let onSelect: (TasteExperience) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    var body: some View {
        NavigationStack {
            List {
                ForEach(filteredAxes) { axis in
                    Section(axis.label) {
                        ForEach(axis.words, id: \.key) { word in
                            let experience = TasteExperience(
                                id: "\(axis.id.rawValue)-\(word.key)",
                                axis: axis.id,
                                intensity: word.intensity,
                                key: word.key,
                                label: word.label,
                                description: word.description,
                                angleOffset: word.angleOffset,
                                radiusOffset: word.radiusOffset
                            )

                            Button {
                                onSelect(experience)
                                dismiss()
                            } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(experience.label)
                                        .font(TBFont.semibold(14))
                                        .foregroundStyle(TBColor.textPrimary)
                                    Text(experience.description)
                                        .font(TBFont.regular(12))
                                        .foregroundStyle(TBColor.textMuted)
                                        .lineLimit(2)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .contentShape(Rectangle())
                                .padding(.vertical, 4)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .listStyle(.plain)
            .searchable(text: $query, prompt: "기억에 남은 미각 인상")
            .navigationTitle("미각 단어 찾기")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
        .preferredColorScheme(.light)
    }

    private var filteredAxes: [TasteExperienceAxisContract] {
        let normalizedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedQuery.isEmpty else { return axes }

        return axes.compactMap { axis in
            let words = axis.words.filter {
                $0.label.localizedCaseInsensitiveContains(normalizedQuery)
                    || $0.description.localizedCaseInsensitiveContains(normalizedQuery)
            }

            guard !words.isEmpty else { return nil }
            return TasteExperienceAxisContract(
                id: axis.id,
                label: axis.label,
                angle: axis.angle,
                words: words
            )
        }
    }
}

private struct TasteExperienceMapViewport: UIViewRepresentable {
    let basePositions: [TasteExperienceBubblePosition]
    let renderedPositions: [TasteExperienceBubblePosition]
    let selectedExperienceIDs: [String]
    let focusedExperienceID: String?
    let focusRequest: TasteExperienceMapFocusRequest?
    let introDelays: [String: TimeInterval]
    let reduceMotion: Bool
    let onFocusedExperienceChange: (String?) -> Void
    let onInteractionChange: (Bool) -> Void
    let onBubbleTap: (TasteExperience) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> TasteExperienceMapScrollView {
        let scrollView = TasteExperienceMapScrollView()
        scrollView.delegate = context.coordinator
        scrollView.backgroundColor = .white
        scrollView.contentInsetAdjustmentBehavior = .never
        scrollView.decelerationRate = .fast
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.minimumZoomScale = TasteExperienceMapEngine.minimumZoom
        scrollView.maximumZoomScale = TasteExperienceMapEngine.maximumZoom
        scrollView.bounces = true
        scrollView.bouncesZoom = true
        scrollView.alpha = 0

        let hostingController = UIHostingController(rootView: AnyView(canvas))
        hostingController.view.backgroundColor = .clear
        hostingController.view.frame = CGRect(
            x: 0,
            y: 0,
            width: TasteExperienceMapEngine.mapSize,
            height: TasteExperienceMapEngine.mapSize
        )
        scrollView.addSubview(hostingController.view)
        scrollView.contentSize = hostingController.view.bounds.size
        context.coordinator.hostingController = hostingController
        scrollView.onLayout = { [weak coordinator = context.coordinator] scrollView in
            coordinator?.layout(scrollView)
        }

        return scrollView
    }

    func updateUIView(_ scrollView: TasteExperienceMapScrollView, context: Context) {
        context.coordinator.parent = self
        context.coordinator.hostingController?.rootView = AnyView(canvas)
        context.coordinator.layout(scrollView)
        context.coordinator.applyFocusRequestIfNeeded(focusRequest, in: scrollView)
    }

    static func dismantleUIView(
        _ scrollView: TasteExperienceMapScrollView,
        coordinator: Coordinator
    ) {
        coordinator.cancelFocusAnimation()
        scrollView.delegate = nil
        scrollView.onLayout = nil
        coordinator.hostingController?.view.removeFromSuperview()
        coordinator.hostingController = nil
    }

    private var canvas: some View {
        TasteExperienceMapCanvas(
            positions: renderedPositions,
            selectedExperienceIDs: selectedExperienceIDs,
            focusedExperienceID: focusedExperienceID,
            introDelays: introDelays,
            reduceMotion: reduceMotion,
            onBubbleTap: onBubbleTap
        )
    }

    final class Coordinator: NSObject, UIScrollViewDelegate {
        var parent: TasteExperienceMapViewport
        var hostingController: UIHostingController<AnyView>?

        private var hasInitialized = false
        private var isInitializationScheduled = false
        private var isAnimating = false
        private var focusAnimator: UIViewPropertyAnimator?
        private var lastFocusRequestID: UUID?
        private var lastReportedExperienceID: String?
        private var snapSuppressedUntil: TimeInterval = 0
        private var viewportSize: CGSize = .zero

        init(parent: TasteExperienceMapViewport) {
            self.parent = parent
        }

        func layout(_ scrollView: UIScrollView) {
            guard scrollView.bounds.width > 0, scrollView.bounds.height > 0 else {
                return
            }

            let nextInset = UIEdgeInsets(
                top: scrollView.bounds.height / 2,
                left: scrollView.bounds.width / 2,
                bottom: scrollView.bounds.height / 2,
                right: scrollView.bounds.width / 2
            )
            if scrollView.contentInset != nextInset {
                scrollView.contentInset = nextInset
            }

            let nextViewportSize = scrollView.bounds.size
            if hasInitialized,
               viewportSize != .zero,
               viewportSize != nextViewportSize,
               !scrollView.isDragging,
               !scrollView.isDecelerating,
               !scrollView.isZooming,
               !isAnimating {
                let target = snapTarget(for: parent.focusedExperienceID)
                scrollView.setContentOffset(
                    centeredOffset(
                        for: target.point,
                        zoom: scrollView.zoomScale,
                        in: scrollView
                    ),
                    animated: false
                )
            }
            viewportSize = nextViewportSize

            scheduleInitialCenteringIfNeeded(in: scrollView)
        }

        private func scheduleInitialCenteringIfNeeded(in scrollView: UIScrollView) {
            guard !hasInitialized, !isInitializationScheduled else {
                return
            }

            isInitializationScheduled = true
            DispatchQueue.main.async { [weak self, weak scrollView] in
                DispatchQueue.main.async {
                    guard let self,
                          let scrollView,
                          scrollView.window != nil,
                          scrollView.bounds.width > 0,
                          scrollView.bounds.height > 0 else {
                        self?.isInitializationScheduled = false
                        return
                    }

                    let initialTarget = self.snapTarget(
                        for: self.parent.focusedExperienceID
                    )
                    let initialZoom = initialTarget.experienceID == nil
                        ? TasteExperienceMapEngine.entryZoom
                        : TasteExperienceMapEngine.selectedZoom

                    scrollView.setZoomScale(initialZoom, animated: false)
                    scrollView.layoutIfNeeded()
                    scrollView.setContentOffset(
                        self.centeredOffset(
                            for: initialTarget.point,
                            zoom: initialZoom,
                            in: scrollView
                        ),
                        animated: false
                    )
                    scrollView.alpha = 1

                    self.lastReportedExperienceID = initialTarget.experienceID
                    self.hasInitialized = true
                    self.isInitializationScheduled = false
                }
            }
        }

        func applyFocusRequestIfNeeded(
            _ request: TasteExperienceMapFocusRequest?,
            in scrollView: UIScrollView
        ) {
            guard hasInitialized,
                  let request,
                  request.id != lastFocusRequestID else {
                return
            }

            lastFocusRequestID = request.id
            animate(
                to: snapTarget(for: request.experienceID),
                in: scrollView
            )
        }

        func viewForZooming(in scrollView: UIScrollView) -> UIView? {
            hostingController?.view
        }

        func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
            cancelFocusAnimation()
            parent.onInteractionChange(true)
        }

        func scrollViewDidScroll(_ scrollView: UIScrollView) {
            guard hasInitialized, !isAnimating else { return }
            reportClosestTarget(in: scrollView)
        }

        func scrollViewDidEndDragging(
            _ scrollView: UIScrollView,
            willDecelerate decelerate: Bool
        ) {
            if !decelerate {
                snapWhenAllowed(scrollView)
            }
        }

        func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
            snapWhenAllowed(scrollView)
        }

        func scrollViewWillBeginZooming(
            _ scrollView: UIScrollView,
            with view: UIView?
        ) {
            cancelFocusAnimation()
            parent.onInteractionChange(true)
        }

        func scrollViewDidZoom(_ scrollView: UIScrollView) {
            guard hasInitialized, !isAnimating else { return }
            reportClosestTarget(in: scrollView)
        }

        func scrollViewDidEndZooming(
            _ scrollView: UIScrollView,
            with view: UIView?,
            atScale scale: CGFloat
        ) {
            snapSuppressedUntil = Date.timeIntervalSinceReferenceDate
                + TasteExperienceMapEngine.pinchSnapSuppressionDuration
            snapWhenAllowed(scrollView)
        }

        private func snapWhenAllowed(_ scrollView: UIScrollView) {
            let remainingDelay = snapSuppressedUntil - Date.timeIntervalSinceReferenceDate
            guard remainingDelay <= 0 else {
                DispatchQueue.main.asyncAfter(deadline: .now() + remainingDelay) { [weak self, weak scrollView] in
                    guard let self,
                          let scrollView,
                          !scrollView.isDragging,
                          !scrollView.isDecelerating,
                          !scrollView.isZooming else {
                        return
                    }

                    self.snapWhenAllowed(scrollView)
                }
                return
            }

            animate(to: closestTarget(in: scrollView), in: scrollView)
        }

        private func animate(
            to target: SnapTarget,
            in scrollView: UIScrollView
        ) {
            cancelFocusAnimation()
            let targetZoom = target.experienceID == nil
                ? TasteExperienceMapEngine.entryZoom
                : TasteExperienceMapEngine.selectedZoom
            let targetOffset = centeredOffset(
                for: target.point,
                zoom: targetZoom,
                in: scrollView
            )

            parent.onInteractionChange(true)
            isAnimating = true
            let updates = {
                scrollView.zoomScale = targetZoom
                scrollView.contentOffset = targetOffset
            }
            let completion = { [weak self] in
                guard let self else { return }
                self.isAnimating = false
                self.focusAnimator = nil
                self.lastReportedExperienceID = target.experienceID
                self.parent.onFocusedExperienceChange(target.experienceID)
                self.parent.onInteractionChange(false)
            }
            guard !parent.reduceMotion else {
                updates()
                completion()
                return
            }
            let animator = TasteBloomMotion.animator(.sheet, animations: updates)
            focusAnimator = animator
            animator.addCompletion { position in
                if position == .end { completion() }
            }
            animator.startAnimation()
        }

        func cancelFocusAnimation() {
            focusAnimator?.stopAnimation(true)
            focusAnimator = nil
            isAnimating = false
        }

        private func reportClosestTarget(in scrollView: UIScrollView) {
            let target = closestTarget(in: scrollView)
            guard target.experienceID != lastReportedExperienceID else {
                return
            }

            lastReportedExperienceID = target.experienceID
            parent.onFocusedExperienceChange(target.experienceID)
        }

        private func closestTarget(in scrollView: UIScrollView) -> SnapTarget {
            let zoom = max(scrollView.zoomScale, 0.001)
            let visibleCenter = CGPoint(
                x: (scrollView.contentOffset.x + scrollView.bounds.width / 2) / zoom,
                y: (scrollView.contentOffset.y + scrollView.bounds.height / 2) / zoom
            )
            let candidates = [
                SnapTarget(
                    experienceID: nil,
                    point: CGPoint(
                        x: TasteExperienceMapEngine.mapCenter,
                        y: TasteExperienceMapEngine.mapCenter
                    )
                ),
            ] + parent.basePositions.map {
                SnapTarget(experienceID: $0.id, point: $0.point)
            }

            return candidates.min {
                distance($0.point, visibleCenter) < distance($1.point, visibleCenter)
            } ?? candidates[0]
        }

        private func snapTarget(for experienceID: String?) -> SnapTarget {
            guard let experienceID,
                  let position = parent.basePositions.first(where: { $0.id == experienceID })
            else {
                return SnapTarget(
                    experienceID: nil,
                    point: CGPoint(
                        x: TasteExperienceMapEngine.mapCenter,
                        y: TasteExperienceMapEngine.mapCenter
                    )
                )
            }

            return SnapTarget(experienceID: experienceID, point: position.point)
        }

        private func centeredOffset(
            for point: CGPoint,
            zoom: CGFloat,
            in scrollView: UIScrollView
        ) -> CGPoint {
            CGPoint(
                x: point.x * zoom - scrollView.bounds.width / 2,
                y: point.y * zoom - scrollView.bounds.height / 2
            )
        }

        private func distance(_ left: CGPoint, _ right: CGPoint) -> CGFloat {
            hypot(left.x - right.x, left.y - right.y)
        }

        private struct SnapTarget {
            let experienceID: String?
            let point: CGPoint
        }
    }
}

private final class TasteExperienceMapScrollView: UIScrollView {
    var onLayout: ((TasteExperienceMapScrollView) -> Void)?

    override func layoutSubviews() {
        super.layoutSubviews()
        onLayout?(self)
    }
}

private enum TasteExperienceBubbleMotion {
    static let selectionResizeDuration = TasteBloomMotion.duration(.content, reduceMotion: false)
    static let entranceDuration = TasteBloomMotion.duration(.sheet, reduceMotion: false)
    static let outlineFadeDuration = TasteBloomMotion.duration(.feedback, reduceMotion: false)
}

private struct TasteExperienceBubbleOutlineRequest: Equatable {
    let isSelected: Bool
    let reduceMotion: Bool
}

private struct TasteExperienceMapCanvas: View {
    let positions: [TasteExperienceBubblePosition]
    let selectedExperienceIDs: [String]
    let focusedExperienceID: String?
    let introDelays: [String: TimeInterval]
    let reduceMotion: Bool
    let onBubbleTap: (TasteExperience) -> Void

    var body: some View {
        ZStack(alignment: .topLeading) {
            TBColor.focus

            ForEach(positions) { position in
                TasteExperienceBubbleView(
                    position: position,
                    priorityIndex: selectedExperienceIDs.firstIndex(of: position.id),
                    isSelected: selectedExperienceIDs.contains(position.id)
                        || focusedExperienceID == position.id,
                    distanceFromFocusedExperience: distanceFromFocusedExperience(to: position),
                    introDelay: introDelays[position.id] ?? 0.9,
                    reduceMotion: reduceMotion,
                    onTap: { onBubbleTap(position.experience) }
                )
                .position(x: position.x, y: position.y)
                .zIndex(
                    selectedExperienceIDs.contains(position.id)
                        || focusedExperienceID == position.id ? 4 : 3
                )
                .animation(
                    reduceMotion
                        ? nil
                        : TasteBloomMotion.animation(.content, reduceMotion: reduceMotion),
                    value: position
                )
            }
        }
        .frame(
            width: TasteExperienceMapEngine.mapSize,
            height: TasteExperienceMapEngine.mapSize
        )
    }

    private func distanceFromFocusedExperience(
        to position: TasteExperienceBubblePosition
    ) -> CGFloat? {
        guard let focusedExperienceID,
              let focusedPosition = positions.first(where: { $0.id == focusedExperienceID })
        else {
            return nil
        }

        return hypot(position.x - focusedPosition.x, position.y - focusedPosition.y)
    }
}

private struct TasteExperienceBubbleView: View {
    let position: TasteExperienceBubblePosition
    let priorityIndex: Int?
    let isSelected: Bool
    let distanceFromFocusedExperience: CGFloat?
    let introDelay: TimeInterval
    let reduceMotion: Bool
    let onTap: () -> Void

    @State private var hasEntered = false
    @State private var showsSelectionOutline = false
    @State private var entryStartedAt = Date.timeIntervalSinceReferenceDate

    var body: some View {
        Button(action: onTap) {
            ZStack {
                Circle()
                    .fill(position.experience.axis.tintColor.opacity(fillOpacity))

                if showsSelectionOutline {
                    Circle()
                        .stroke(
                            position.experience.axis.tintSoftBorderColor,
                            lineWidth: 1
                        )
                }

                if let priorityIndex {
                    Text(priorityIndex == 0 ? "메인 미각" : "보조 미각")
                        .font(TBFont.semibold(10))
                        .foregroundStyle(position.experience.axis.tintTextColor.opacity(0.7))
                        .offset(y: -26)
                }

                Text(position.experience.label)
                    .font(TBFont.bold(14))
                    .foregroundStyle(position.experience.axis.tintTextColor.opacity(textOpacity))
                    .multilineTextAlignment(.center)
                    .lineLimit(3)
                    .minimumScaleFactor(0.84)
                    .padding(.horizontal, 14)
                    .offset(y: priorityIndex == nil ? 0 : 8)
                    .scaleEffect(isSelected ? 1.14 : 1)
            }
            .frame(width: position.size, height: position.size)
            .contentShape(Circle())
            .shadow(
                color: isSelected ? Color.black.opacity(0.12) : .clear,
                radius: isSelected ? 23 : 0,
                x: 0,
                y: isSelected ? 18 : 0
            )
        }
        .buttonStyle(.plain)
        .opacity(reduceMotion || hasEntered ? 1 : 0)
        .scaleEffect(reduceMotion || hasEntered ? 1 : 0.72)
        .task(id: position.id) {
            guard !reduceMotion else {
                hasEntered = true
                return
            }

            try? await Task.sleep(for: .seconds(introDelay))
            guard !Task.isCancelled else { return }
            withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                hasEntered = true
            }
        }
        .task(
            id: TasteExperienceBubbleOutlineRequest(
                isSelected: isSelected,
                reduceMotion: reduceMotion
            )
        ) {
            guard isSelected else {
                showsSelectionOutline = false
                return
            }

            guard !reduceMotion else {
                showsSelectionOutline = true
                return
            }

            let entranceReadyAt = entryStartedAt
                + introDelay
                + TasteExperienceBubbleMotion.entranceDuration
            let remainingEntranceTime = max(
                entranceReadyAt - Date.timeIntervalSinceReferenceDate,
                0
            )
            let delay = max(
                TasteExperienceBubbleMotion.selectionResizeDuration,
                remainingEntranceTime
            )

            try? await Task.sleep(for: .seconds(delay))
            guard !Task.isCancelled else { return }

            withAnimation(
                TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion)
            ) {
                showsSelectionOutline = true
            }
        }
        .accessibilityLabel(position.experience.label)
        .accessibilityValue(accessibilityValue)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private var fillOpacity: Double {
        if isSelected {
            return 1
        }

        guard let distanceFromFocusedExperience else {
            return 0.56
        }

        let distanceStep = max(
            1,
            Int(round(distanceFromFocusedExperience / TasteExperienceMapEngine.gridSpacing))
        )
        let whiteMix = min(80, distanceStep * 20)
        return Double(100 - whiteMix) / 100
    }

    private var textOpacity: Double {
        isSelected ? 1 : max(0.54, fillOpacity + 0.18)
    }

    private var accessibilityValue: String {
        guard let priorityIndex else {
            return isSelected ? "현재 초점" : ""
        }

        return priorityIndex == 0 ? "메인 미각" : "보조 미각"
    }
}

private struct DiningFeedbackAddChipButton: View {
    let accessibilityLabel: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            LucideIcon(
                .plus,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.regular
            )
            .frame(width: 36, height: 36)
            .foregroundStyle(TBColor.textMuted)
            .background(TBColor.mutedSurface)
            .clipShape(Circle())
            .overlay {
                Circle().stroke(TBColor.border)
            }
        }
        .buttonStyle(TBTokenButtonStyle())
        .accessibilityLabel(accessibilityLabel)
    }
}

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
