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
                    VStack(spacing: 12) {
                        switch contentState {
                        case .loading:
                            ForEach(0..<dishFeedbackSkeletonCardCount, id: \.self) { _ in
                                NativeDishFeedbackCardSkeleton()
                            }
                        case .populated:
                            ForEach(dishFeedItems) { item in
                                let displayItem = appModel
                                    .dishFeedbackItemWithCurrentComments(item)
                                NativeDishFeedbackCard(
                                    item: displayItem,
                                    onOptionsTap: onOpenDishOptions.map { handler in
                                        { handler(displayItem) }
                                    },
                                    onDetailTap: {
                                        presentation = .comments(displayItem)
                                    },
                                    onCommentsTap: {
                                        presentation = .comments(displayItem)
                                    }
                                )
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

    private var dishFeedItems: [DiningDishFeedbackItem] {
        if appModel.diningEntries.isEmpty {
            return TasteBuddyNativeContent.fallbackDishFeedbackItems.map {
                appModel.dishFeedbackItemWithCurrentComments($0)
            }
        }

        return appModel.diningEntries.map { entry in
            let subject = entry.menu.isEmpty ? "다이닝 기록" : entry.menu
            let recordedTasteTags = entry.tasteExperienceIDs.compactMap {
                TasteExperienceCatalog.experienceByID[$0]?.label
            }
            let tasteTags = recordedTasteTags.isEmpty
                ? (appModel.profile?.topAxes ?? [.umami, .sour]).map(\.label)
                : recordedTasteTags
            let detailTags = entry.detailTagIDs.isEmpty
                ? (
                    entry.rating >= 4
                        ? ["balance-well-balanced", "flow-opens-next", "composition-connected"]
                        : ["balance-one-note-forward", "flow-finish-piled", "composition-course-fit"]
                )
                : entry.detailTagIDs
            let dishKindTags = entry.dishKindIDs.isEmpty
                ? TasteBuddyAgent.inferDishKindIds(
                    title: subject,
                    subtitle: entry.restaurant,
                    flavorNotes: tasteTags + detailTags
                )
                : entry.dishKindIDs
            let reviewerProfile = appModel.tbaTasteProfile
            let tbaInput = TasteBuddyAgentDiningAnalysisInput(
                detailTags: detailTags,
                dishKindTags: dishKindTags,
                id: entry.id.uuidString,
                ingredients: [],
                restaurantName: entry.restaurant,
                reviewSnippet: entry.note.isEmpty
                    ? "전체 만족도 \(entry.rating)점으로 남긴 기록입니다. 다음에는 더 구체적인 미각 단서를 함께 남겨보세요."
                    : entry.note,
                reviewerProfile: reviewerProfile,
                subject: subject,
                tasteTags: tasteTags,
                techniques: []
            )
            let snapshot = entry.tbaAnalysisSnapshot
                ?? TasteBuddyAgent.buildDiningAnalysisSnapshot(tbaInput)
            let images = DiningReflectionPhotoStore.data(
                for: entry.reflectionPhotoFilename
            ).map {
                [
                    DiningDishFeedbackItem.Image(
                        id: "\(entry.id.uuidString)-reflection-photo",
                        alt: "\(subject) 미식 기록 사진",
                        imageData: $0
                    ),
                ]
            } ?? []

            return appModel.dishFeedbackItemWithCurrentComments(DiningDishFeedbackItem(
                id: entry.id.uuidString,
                authorName: "나",
                restaurantName: entry.restaurant,
                dishTitle: subject,
                summary: snapshot.summary,
                reactionLabel: snapshot.tasteBubbles.first?.label ?? (entry.rating >= 4 ? "편안한 밸런스" : "다음 조절 필요"),
                images: images,
                detailTags: snapshot.detailTags.map(DishFeedbackCardTag.fromTBA),
                tasteBubbles: snapshot.tasteBubbles.map(DishFeedbackTasteBubble.fromTBA),
                commentCount: 0,
                liked: entry.rating >= 4,
                tbaAnalysisSnapshot: snapshot
            ))
        }
    }

    private func diningEntry(for item: DiningDishFeedbackItem) -> DiningEntry? {
        guard let id = UUID(uuidString: item.id) else { return nil }
        return appModel.diningEntries.first { $0.id == id }
    }
}

private enum DiningPresentation: Identifiable {
    case newFeedback
    case edit(DiningEntry)
    case comments(DiningDishFeedbackItem)

    var id: String {
        switch self {
        case .newFeedback:
            "new-feedback"
        case .edit(let entry):
            "edit-\(entry.id.uuidString)"
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

private struct DishFeedbackDetailSheet: View {
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
                title: "디시 상세 보기",
                detail: "메인 미각, 짧은 기록, 태그를 확인합니다"
            ) {
                onShowDetail()
            }

            ActionSheetRow(
                icon: "square-pen",
                title: "후기 수정",
                detail: editableEntry == nil ? "샘플 카드는 수정할 수 없습니다" : "레스토랑, 메뉴, 만족도, 노트를 다시 정리합니다",
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
    static let duration: TimeInterval = 0.92
    static let reducedMotionDuration: TimeInterval = 0.16
    static let fadeOutDuration: TimeInterval = 0.12
    static let reducedMotionFadeOutDuration: TimeInterval = 0.12
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
    private enum Phase {
        case menu
        case restaurantSelection
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
    @State private var selectedKindIDs: Set<String> = []
    @State private var selectedExperienceIDs: [String]
    @State private var focusedExperienceID: String?
    @State private var focusRequest: TasteExperienceMapFocusRequest?
    @State private var isTasteMapInteracting = false
    @State private var isTasteSearchPresented = false
    @State private var tasteMapVeilOpacity = 1.0
    @State private var selectedDetailTagIDs: [String]
    @State private var activeDetailExperienceIndex = 0
    @State private var reflectionNote: String
    @State private var reflectionPhotoData: Data?
    @State private var reflectionPhotoFilename: String?
    @State private var photoPickerItem: PhotosPickerItem?
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
    @State private var showsLaunchTransitionOverlay: Bool
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
        let restoredExperienceIDs = (entry?.tasteExperienceIDs ?? [])
            .filter { validExperienceIDs.contains($0) }
            .prefix(3)

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
        _phase = State(
            initialValue: startMode == .cameraCapture ? .cameraCapture : .menu
        )
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
        _selectedDetailTagIDs = State(initialValue: entry?.detailTagIDs ?? [])
        _reflectionNote = State(initialValue: entry?.note ?? "")
        _reflectionPhotoFilename = State(initialValue: entry?.reflectionPhotoFilename)
        _reflectionPhotoData = State(
            initialValue: DiningReflectionPhotoStore.data(
                for: entry?.reflectionPhotoFilename
            )
        )
        _showsLaunchTransitionOverlay = State(
            initialValue: showsLaunchTransition && startMode == .cameraCapture
        )
    }

    var body: some View {
        ZStack {
            phaseView

            if showsLaunchTransitionOverlay {
                DiningFeedbackTasteBloomTransitionOverlay(launchOrigin: launchOrigin)
                    .transition(.opacity)
                    .zIndex(20)
            }
        }
        .tbScreenTopChrome(
            isEnabled: phase != .tasteWords && phase != .cameraCapture && phase != .result
        )
        .preferredColorScheme(.light)
        .edgeSwipeBack(
            isEnabled: !isTasteSearchPresented
                && !isResultShareSheetPresented
                && !isTasteMapInteracting,
            action: handleEdgeSwipeBack
        )
        .task(id: showsLaunchTransitionOverlay) {
            await dismissLaunchTransitionAfterDelay()
        }
    }

    @ViewBuilder
    private var phaseView: some View {
        switch phase {
        case .menu:
            menuSelectionView
        case .restaurantSelection:
            restaurantSelectionView
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

        withAnimation(
            .easeOut(
                duration: reduceMotion
                    ? DiningFeedbackTasteBloomTransitionMetrics.reducedMotionFadeOutDuration
                    : DiningFeedbackTasteBloomTransitionMetrics.fadeOutDuration
            )
        ) {
            showsLaunchTransitionOverlay = false
        }
    }

    private var restaurantSelectionView: some View {
        ScrollViewReader { scrollProxy in
            restaurantSelectionContent
                .onChange(of: isDirectRestaurantInputFocused) { _, _ in
                    revealDirectRestaurantInput(using: scrollProxy)
                }
                .onChange(of: menuKeyboard.visibleHeight) { _, _ in
                    revealDirectRestaurantInput(using: scrollProxy)
                }
                .onReceive(
                    NotificationCenter.default.publisher(
                        for: UIResponder.keyboardDidChangeFrameNotification
                    )
                ) { _ in
                    revealDirectRestaurantInput(using: scrollProxy)
                }
        }
    }

    private func revealDirectRestaurantInput(using scrollProxy: ScrollViewProxy) {
        guard usesRestaurantDirectInput,
              isDirectRestaurantInputFocused,
              menuKeyboard.visibleHeight > 0 else { return }

        withAnimation(.easeOut(duration: 0.24)) {
            scrollProxy.scrollTo(Self.directRestaurantInputScrollID, anchor: .bottom)
        }
    }

    private var restaurantSelectionContent: some View {
        // Reserve the CTA's height so the input card scrolls above it, not behind it.
        VStack(spacing: 0) {
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

                                        TextField("예: 정식당", text: $directRestaurantName)
                                            .focused($isDirectRestaurantInputFocused)
                                            .font(TBFont.semibold(13))
                                            .foregroundStyle(TBColor.textPrimary)
                                            .textInputAutocapitalization(.never)
                                            .autocorrectionDisabled()
                                            .submitLabel(.done)
                                            .padding(.horizontal, 12)
                                            .frame(height: 44)
                                            .background(TBColor.focus)
                                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                                            .overlay {
                                                RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                                                    .stroke(TBColor.border)
                                            }
                                            .onSubmit(continueRestaurantSelection)
                                    }
                                }
                                .id(Self.directRestaurantInputScrollID)
                            }
                        }
                    }
                    .tbPageContentPadding(bottom: TBSpacing.page)
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
                .scrollDismissesKeyboard(.interactively)
            }

            TBFlowStepCTA(
                actionLabel: "식당 확인하고 메뉴 선택",
                currentIndex: 0,
                total: 1,
                isEnabled: canContinueRestaurantSelection,
                backgroundColor: .clear,
                showsIndicator: false,
                action: continueRestaurantSelection
            )
        }
        .background(TBColor.page.ignoresSafeArea())
    }

    private var menuSelectionView: some View {
        ScrollViewReader { scrollProxy in
            menuSelectionContent
                .onChange(of: isDirectMenuInputFocused) { _, _ in
                    revealDirectMenuInput(using: scrollProxy)
                }
                .onChange(of: menuKeyboard.visibleHeight) { _, _ in
                    revealDirectMenuInput(using: scrollProxy)
                }
                .onReceive(
                    NotificationCenter.default.publisher(
                        for: UIResponder.keyboardDidChangeFrameNotification
                    )
                ) { _ in
                    // Re-align after the keyboard has resized the scroll viewport.
                    revealDirectMenuInput(using: scrollProxy)
                }
        }
    }

    private var isEditingDirectMenuWithKeyboard: Bool {
        usesDirectInput && isDirectMenuInputFocused && menuKeyboard.visibleHeight > 0
    }

    private func revealDirectMenuInput(using scrollProxy: ScrollViewProxy) {
        guard isEditingDirectMenuWithKeyboard else { return }

        withAnimation(.easeOut(duration: 0.24)) {
            scrollProxy.scrollTo(Self.directMenuInputScrollID, anchor: .bottom)
        }
    }

    private var menuSelectionContent: some View {
        ZStack(alignment: .bottom) {
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
                            subtitle: "모든 코스를 한 번에 평가하지 않아도 괜찮아요. 가장 선명하게 기억나는 메뉴부터 선택하면, 그 메뉴의 미각 인상만 차분히 기록할 수 있어요.",
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
                                            TextField("예: 오미자와 배 디저트", text: $directMenuTitle)
                                                .focused($isDirectMenuInputFocused)
                                                .font(TBFont.semibold(13))
                                                .foregroundStyle(TBColor.textPrimary)
                                                .textInputAutocapitalization(.never)
                                                .autocorrectionDisabled()
                                                .submitLabel(.done)
                                                .padding(.horizontal, 12)
                                                .frame(height: 44)
                                                .background(TBColor.focus)
                                                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                                                .overlay {
                                                    RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                                                        .stroke(TBColor.border)
                                                }
                                                .onSubmit(addCustomDish)

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

                                    DiningFeedbackKindChipWrap(spacing: 8) {
                                        ForEach(fixture?.dishKindOptions ?? []) { kind in
                                            DiningFeedbackKindChip(
                                                title: kind.label,
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
                actionLabel: "선택한 메뉴 기록하기",
                currentIndex: 0,
                total: 1,
                isEnabled: selectedDish != nil,
                backgroundColor: TBColor.page,
                showsIndicator: false,
                action: {
                    phase = .tasteWords
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
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(10)
            }
        }
        .background(TBColor.page.ignoresSafeArea())
        .coordinateSpace(name: Self.menuSelectionCoordinateSpace)
        .onPreferenceChange(DirectMenuInputFramePreferenceKey.self) { frame in
            directMenuInputFrame = frame
        }
        .onPreferenceChange(DirectMenuOptionCardsFramePreferenceKey.self) { frame in
            directMenuOptionCardsFrame = frame
        }
        .simultaneousGesture(directMenuOutsideTapGesture)
        .animation(.spring(response: 0.28, dampingFraction: 0.86), value: feedbackDishes.map(\.id))
        .task(id: pendingDeletedMenu?.id) {
            guard let toastID = pendingDeletedMenu?.id else { return }

            try? await Task.sleep(nanoseconds: ToastSurface.defaultDisplayDurationNanoseconds)
            guard !Task.isCancelled, pendingDeletedMenu?.id == toastID else { return }

            withAnimation(.easeOut(duration: 0.2)) {
                pendingDeletedMenu = nil
            }
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
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .background(TBColor.focus)
        }
        .animation(.easeOut(duration: 0.2), value: isTasteMapInteracting)
        .animation(.easeOut(duration: 0.2), value: focusedExperienceID)
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
        .frame(height: TBSize.topAppBarHeight)
        .zIndex(20)
    }

    private var tasteMapTopBarContent: some View {
        ZStack {
            Text(selectedMenuTitle)
                .font(TBFont.bold(15))
                .foregroundStyle(TBColor.textPrimary)
                .padding(.horizontal, 12)
                .frame(height: 32)
                .modifier(TasteMapChromeGlass(shape: Capsule()))
                .allowsHitTesting(false)

            HStack {
                Button {
                    phase = .menu
                } label: {
                    LucideIcon(
                        .chevronLeft,
                        size: TBIcon.Size.large,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
                    .foregroundStyle(TBColor.textSecondary)
                    .modifier(TasteMapChromeGlass(shape: Circle(), isInteractive: true))
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("메뉴 선택으로 돌아가기")

                Spacer()

                Button {
                    isTasteSearchPresented = true
                } label: {
                    LucideIcon(
                        .search,
                        size: TBIcon.Size.large,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
                    .foregroundStyle(TBColor.textSecondary)
                    .modifier(TasteMapChromeGlass(shape: Circle(), isInteractive: true))
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("미각 단어 검색")
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

                        DiningReflectionEntryCard(
                            photoData: reflectionPhotoData,
                            onOpenNote: { phase = .reflection },
                            onOpenCamera: {
                                openCameraCapture(returningTo: .detailTags)
                            }
                        )

                        VStack(spacing: 28) {
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
        .onChange(of: photoPickerItem) { _, item in
            guard let item else { return }
            Task {
                await loadReflectionPhoto(from: item)
            }
        }
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
                            Text("왜 느꼈는지 알려주세요.")
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

                        DiningReflectionPhotoEditor(
                            photoData: reflectionPhotoData,
                            photoPickerItem: $photoPickerItem,
                            onRemove: {
                                reflectionPhotoData = nil
                                reflectionPhotoFilename = nil
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
        .onChange(of: photoPickerItem) { _, item in
            guard let item else { return }
            Task {
                await loadReflectionPhoto(from: item)
            }
        }
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
                .animation(.easeOut(duration: 0.16), value: showsLaunchTransitionOverlay)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            cameraModel.onCapture = { data in
                Task { @MainActor in
                    applyCameraPhoto(data)
                }
            }
            restaurantResolver.prepareForPhotoLocation()
            cameraModel.start()
        }
        .onDisappear {
            cameraModel.onCapture = nil
            cameraModel.stop()
        }
        .onChange(of: photoPickerItem) { _, item in
            guard let item else { return }
            Task {
                if let photoPayload = await loadReflectionPhotoPayload(from: item) {
                    let nextPhase = phaseAfterPhotoCapture
                    photoPickerItem = nil
                    cameraClosePhase = nil
                    if nextPhase == .restaurantSelection {
                        beginRestaurantResolution(
                            from: photoPayload.data,
                            capturedLocation: nil,
                            assetLocation: photoPayload.assetLocation
                        )
                    }
                    phase = nextPhase
                }
            }
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
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .zIndex(30)
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
        .background {
            DiningFeedbackResultBackground(experiences: selectedExperiences)
                .ignoresSafeArea()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
        .ignoresSafeArea(edges: .horizontal)
    }

    private var resultStageContent: some View {
        ZStack {
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture(perform: showResultChrome)

            Button(action: showResultChrome) {
                DiningFeedbackResultCardBloom(
                    mainAxis: resultMeshAxes.main,
                    secondaryAxis: resultMeshAxes.secondary,
                    tertiaryAxis: resultMeshAxes.tertiary,
                    reduceMotion: reduceMotion
                ) {
                    DiningFeedbackResultCard(
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
            .accessibilityLabel("결과 카드")
            .accessibilityHint("상단 공유 버튼과 하단 저장 버튼을 표시합니다")

            if isResultChromeVisible {
                VStack(spacing: 0) {
                    resultTopBar
                    Spacer(minLength: 0)
                }
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            if isResultChromeVisible {
                VStack(spacing: 0) {
                    Spacer(minLength: 0)
                    resultSplitCTA
                }
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeOut(duration: 0.3), value: isResultChromeVisible)
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
                .accessibilityLabel("디테일 태그로 돌아가기")

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
                .accessibilityLabel("결과 카드 공유")
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
            Button(action: handleResultAdditionalRecord) {
                Text("추가 기록")
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

            PrimaryButton(
                title: "저장",
                action: saveFeedback
            )
        }
        .padding(.horizontal, TBSpacing.page)
        .padding(.bottom, FlowBottomCtaMetrics.bottomPadding)
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
                    withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
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
        } else if hasExplicitRestaurantContext,
                  let entry,
                  !entry.menu.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            baseDishes = [customDish(title: entry.menu, id: "entry-menu")]
        } else if hasExplicitRestaurantContext {
            baseDishes = []
        } else if scenario.dishes.isEmpty,
                  let entry,
                  !entry.menu.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            baseDishes = [customDish(title: entry.menu, id: "entry-menu")]
        } else {
            baseDishes = scenario.dishes
        }

        return baseDishes
            + rememberedRestaurantDishes(excluding: baseDishes + customDishes)
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
        usesDirectInput
            ? directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
            : selectedDish?.title ?? entry?.menu ?? "메뉴"
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

    private var resultMeshAxes: (main: TasteAxis, secondary: TasteAxis, tertiary: TasteAxis) {
        let mainAxis = selectedExperiences.first?.axis ?? .umami
        let secondaryAxis = selectedExperiences.dropFirst().first?.axis ?? mainAxis
        let tertiaryAxis = selectedExperiences.dropFirst(2).first?.axis ?? secondaryAxis
        return (mainAxis, secondaryAxis, tertiaryAxis)
    }

    private var resultShareText: String {
        "\(selectedRestaurantName) \(selectedMenuTitle)의 미각 기록"
    }

    private var resultShareLink: String {
        var components = URLComponents()
        components.scheme = "tastebuddy"
        components.host = "dining-feedback"
        components.path = "/result"
        components.queryItems = [
            URLQueryItem(name: "restaurant", value: selectedRestaurantName),
            URLQueryItem(name: "menu", value: selectedMenuTitle)
        ]

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

        withAnimation(.spring(response: 0.28, dampingFraction: 0.88)) {
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

        withAnimation(.spring(response: 0.28, dampingFraction: 0.88)) {
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
        DiningDetailTagCatalog.recommendedIDs(
            experiences: selectedExperiences,
            dishKindIDs: selectedKindIDs
        )
    }

    private var selectedDetailTagMetadata: [DiningDetailTagMetadata] {
        selectedDetailTagIDs.compactMap(DiningDetailTagCatalog.metadata)
    }

    private var detailHelperText: String {
        if selectedDetailTagIDs.isEmpty {
            return "태그를 고르지 않아도 미각 인상은 저장됩니다."
        }
        return "\(selectedDetailTagIDs.count)개의 디테일 단서를 함께 저장합니다."
    }

    private var resolvedReflectionNote: String {
        let trimmedNote = reflectionNote.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedNote.isEmpty else { return trimmedNote }

        let summary = selectedExperiences.enumerated().map { index, experience in
            "\(index == 0 ? "메인" : "보조") 미각 \(experience.label)"
        }
        return "\(summary.joined(separator: ", "))으로 기억에 남은 식후 피드백입니다."
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

        guard nextSelection.contains(experience.id), nextSelection.count < 3 else {
            return
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
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
        } else {
            selectedDetailTagIDs.append(id)
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
        }
        customTagCategoryID = nil
        customTagLabel = ""
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
        photoLoadError = nil
        cameraClosePhase = phase
        self.phase = .cameraCapture
    }

    private func closeCameraCapture() {
        cameraModel.stop()
        if let cameraClosePhase {
            phase = cameraClosePhase
            self.cameraClosePhase = nil
        } else {
            closeFeedback()
        }
    }

    private func captureDiningPhoto() {
        pendingCaptureLocation = restaurantResolver.captureLocationSnapshot()
        cameraModel.capturePhoto()
    }

    @MainActor
    private func applyCameraPhoto(_ data: Data) {
        guard applyReflectionPhotoData(data) else { return }
        let nextPhase = phaseAfterPhotoCapture
        let capturedLocation = pendingCaptureLocation
        pendingCaptureLocation = nil
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

    @discardableResult
    @MainActor
    private func applyReflectionPhotoData(_ data: Data) -> Bool {
        guard let normalizedData = DiningReflectionPhotoStore.normalizedJPEGData(data) else {
            photoLoadError = "선택한 이미지를 읽을 수 없어요. 다른 사진을 선택해주세요."
            return false
        }

        reflectionPhotoData = normalizedData
        reflectionPhotoFilename = nil
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

        Task { @MainActor in
            await restaurantResolver.resolveRestaurantCandidates(
                from: photoData,
                capturedLocation: capturedLocation,
                assetLocation: assetLocation
            )
            selectedRestaurantCandidateID = restaurantResolver.candidates.first?.id
            usesRestaurantDirectInput = restaurantResolver.candidates.isEmpty
        }
    }

    @discardableResult
    @MainActor
    private func loadReflectionPhoto(from item: PhotosPickerItem) async -> Bool {
        await loadReflectionPhotoData(from: item) != nil
    }

    @MainActor
    private func loadReflectionPhotoData(from item: PhotosPickerItem) async -> Data? {
        await loadReflectionPhotoPayload(from: item)?.data
    }

    @MainActor
    private func loadReflectionPhotoPayload(from item: PhotosPickerItem) async -> DiningFeedbackPhotoPayload? {
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                photoLoadError = "선택한 이미지를 읽을 수 없어요. 다른 사진을 선택해주세요."
                return nil
            }

            guard applyReflectionPhotoData(data) else {
                return nil
            }

            return DiningFeedbackPhotoPayload(
                data: data,
                assetLocation: Self.photoLibraryLocation(for: item)
            )
        } catch {
            photoLoadError = "사진을 불러오는 중 문제가 생겼어요. 다시 시도해주세요."
            return nil
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

        try? await Task.sleep(for: .milliseconds(260))
        withAnimation(.easeOut(duration: 0.28)) {
            tasteMapVeilOpacity = 0
        }
    }

    private func saveFeedback() {
        guard let primaryExperience = selectedExperienceIDs.first.flatMap({ experienceByID[$0] })
        else {
            return
        }
        let entryID = entry?.id ?? UUID()
        var photoFilename = reflectionPhotoFilename
        if let reflectionPhotoData {
            photoFilename = try? DiningReflectionPhotoStore.save(
                reflectionPhotoData,
                entryID: entryID
            )
        } else if let existingFilename = entry?.reflectionPhotoFilename {
            DiningReflectionPhotoStore.remove(filename: existingFilename)
            photoFilename = nil
        }
        let selectedTasteTags = selectedExperienceIDs.compactMap {
            experienceByID[$0]?.label
        }
        let dishKindIDs = resolvedSelectedDishKindIDs
        let reviewerProfile = appModel.tbaTasteProfile
        let tbaSnapshot = TasteBuddyAgent.buildDiningAnalysisSnapshot(
            TasteBuddyAgentDiningAnalysisInput(
                detailTags: selectedDetailTagIDs,
                dishKindTags: dishKindIDs,
                id: entryID.uuidString,
                restaurantName: selectedRestaurantName,
                reviewSnippet: resolvedReflectionNote,
                reviewerProfile: reviewerProfile,
                subject: selectedMenuTitle,
                tasteTags: selectedTasteTags
            )
        )

        onSave(
            DiningEntry(
                id: entryID,
                restaurant: selectedRestaurantName,
                menu: selectedMenuTitle,
                date: entry?.date ?? .now,
                rating: TasteExperienceMapEngine.mappedRating(for: primaryExperience),
                note: resolvedReflectionNote,
                tasteExperienceIDs: selectedExperienceIDs,
                detailTagIDs: selectedDetailTagIDs,
                dishKindIDs: dishKindIDs,
                reflectionPhotoFilename: photoFilename,
                tbaAnalysisSnapshot: tbaSnapshot
            )
        )
        closeFeedback()
    }

    private func closeFeedback() {
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
        case .tasteWords:
            phase = .menu
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

    private func showResultCard() {
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

        withAnimation(.easeOut(duration: 0.3)) {
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
        phase = .detailTags
    }

    private func showResultShareSheet() {
        resultShareStatusMessage = nil
        resultSharePreviewImage = makeResultShareImage()
        resultShareSheetDragTranslation = 0
        isDraggingResultShareSheet = false
        canDragResultShareSheet = false
        withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
            isResultShareSheetPresented = true
        }
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(700))
            if isResultShareSheetPresented {
                canDragResultShareSheet = true
            }
        }
    }

    private func hideResultShareSheet() {
        withAnimation(StagedBottomSheetBackgroundMetrics.animation) {
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
                restaurant: selectedRestaurantName,
                menuTitle: selectedMenuTitle,
                experiences: selectedExperiences,
                detailTags: selectedDetailTagMetadata,
                reflectionNote: resolvedReflectionNote,
                photoData: reflectionPhotoData,
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
        activeDetailExperienceIndex = 0
        reflectionNote = ""
        reflectionPhotoData = nil
        reflectionPhotoFilename = nil
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

                withAnimation(.spring(response: 0.28, dampingFraction: 0.86)) {
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
        withAnimation(.spring(response: 0.28, dampingFraction: 0.86)) {
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
                    Text("짧은 미식 기록 추가")
                        .font(TBFont.medium(14))
                        .foregroundStyle(TBColor.textPrimary)
                    Text("사진이나 메모로 왜 그렇게 느꼈는지 남겨보세요.")
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
            .accessibilityLabel("짧은 미식 기록 작성")

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

private struct DiningFeedbackPhotoPayload {
    let data: Data
    let assetLocation: CLLocation?
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
        let nearbyCandidates = await searchNearbyRestaurants(
            near: location,
            recognizedTextLines: recognizedTextLines
        )
        candidates = nearbyCandidates
        state = nearbyCandidates.isEmpty
            ? .unavailable("이 위치 주변의 식당 후보를 찾지 못했어요. 식당명을 직접 입력해 주세요.")
            : .found
    }

    @MainActor
    func reset() {
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
        let recommendedSet = Set(recommendedTagIDs)
        return (category.tags + customTags).enumerated().sorted { left, right in
            let leftRecommended = recommendedSet.contains(left.element.id)
            let rightRecommended = recommendedSet.contains(right.element.id)
            if leftRecommended != rightRecommended {
                return leftRecommended
            }
            return left.offset < right.offset
        }.map(\.element)
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

private struct DiningFeedbackResultBackground: View {
    let experiences: [TasteExperience]
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var axes: (main: TasteAxis, secondary: TasteAxis, tertiary: TasteAxis) {
        let mainAxis = experiences.first?.axis ?? .umami
        let secondaryAxis = experiences.dropFirst().first?.axis ?? mainAxis
        let tertiaryAxis = experiences.dropFirst(2).first?.axis ?? secondaryAxis
        return (mainAxis, secondaryAxis, tertiaryAxis)
    }

    var body: some View {
        TimelineView(.animation) { timeline in
            GeometryReader { proxy in
                let elapsed = reduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
                let size = proxy.size
                let largest = max(size.width, size.height)

                ZStack {
                    axes.main.tintColor

                    LinearGradient(
                        colors: [
                            axes.secondary.mainColor.opacity(0.10),
                            axes.main.mainColor.opacity(0.42),
                            axes.tertiary.mainColor.opacity(0.08)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .opacity(0.68)
                    .scaleEffect(1.16)

                    meshBlob(
                        axis: axes.main,
                        opacity: 0.92,
                        width: largest * 1.56,
                        height: largest * 1.28,
                        centerX: 0.38,
                        centerY: 0.42,
                        containerSize: size,
                        driftX: sin(elapsed / 3.8) * size.width * 0.10,
                        driftY: cos(elapsed / 3.8) * size.height * 0.08,
                        scale: 1.10 + CGFloat(sin(elapsed / 2.2)) * 0.08,
                        blur: 34
                    )

                    meshBlob(
                        axis: axes.secondary,
                        opacity: 0.86,
                        width: largest * 0.82,
                        height: largest * 0.66,
                        centerX: 0.74,
                        centerY: 0.25,
                        containerSize: size,
                        driftX: cos(elapsed / 3.2) * size.width * 0.16,
                        driftY: sin(elapsed / 3.2) * size.height * 0.12,
                        scale: 1.08 + CGFloat(cos(elapsed / 2.4)) * 0.10,
                        blur: 28
                    )

                    meshBlob(
                        axis: axes.tertiary,
                        opacity: 0.82,
                        width: largest * 0.88,
                        height: largest * 0.72,
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

    private func meshBlob(
        axis: TasteAxis,
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
                axis.mainColor.opacity(opacity * 0.70),
                axis.mainColor.opacity(opacity * 0.34),
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
    let mainAxis: TasteAxis
    let secondaryAxis: TasteAxis
    let tertiaryAxis: TasteAxis
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
                        mainAxis.mainColor.opacity(0.22),
                        .clear,
                        secondaryAxis.mainColor.opacity(0.18),
                        .clear,
                        tertiaryAxis.mainColor.opacity(0.16),
                        .clear,
                        mainAxis.mainColor.opacity(0.18),
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
                                mainAxis.mainColor.opacity(0.26),
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

        withAnimation(.timingCurve(0.18, 0.92, 0.2, 1, duration: 0.86).delay(0.12)) {
            isEntered = true
        }

        withAnimation(.timingCurve(0.18, 0.92, 0.2, 1, duration: 0.34).delay(0.08)) {
            isHaloVisible = true
        }

        try? await Task.sleep(for: .milliseconds(620))

        withAnimation(.timingCurve(0.18, 0.92, 0.2, 1, duration: 0.36)) {
            isHaloVisible = false
        }
    }
}

private struct DiningFeedbackResultCard: View {
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
                Text(menuTitle)
                    .font(TBFont.bold(14))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineLimit(2)
                Text(restaurant)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textMuted)
            }

            if !experiences.isEmpty || !detailTags.isEmpty {
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
        .padding(12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: Color.black.opacity(0.16), radius: 35, x: 0, y: 24)
    }

    @ViewBuilder
    private var resultImage: some View {
        if let photoData, let image = UIImage(data: photoData) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .aspectRatio(1, contentMode: .fit)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .clipped()
        } else {
            ZStack {
                TBColor.disabledSurface
                LucideIcon(
                    .camera,
                    size: TBIcon.Size.large,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .foregroundStyle(TBColor.textHint)
            }
            .aspectRatio(1, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }
}

private enum DiningFeedbackResultLayout {
    static let cardHorizontalPadding: CGFloat = 50
    static let chipGap: CGFloat = 6
    static let chipHeight: CGFloat = 20
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
        GeometryReader { proxy in
            let visibleCount = visibleCount(for: proxy.size.width)
            let hiddenCount = max(0, detailTags.count - visibleCount)

            HStack(spacing: DiningFeedbackResultLayout.chipGap) {
                ForEach(Array(detailTags.prefix(visibleCount))) { tag in
                    TasteChip(title: tag.label, tone: .neutral)
                        .lineLimit(1)
                        .fixedSize(horizontal: true, vertical: false)
                        .accessibilityLabel("\(tag.label), \(tag.categoryLabel)")
                }

                if hiddenCount > 0 {
                    TasteChip(title: "+\(hiddenCount)", tone: .neutral)
                        .lineLimit(1)
                        .fixedSize(horizontal: true, vertical: false)
                        .accessibilityLabel("\(hiddenCount)개 태그 더 있음")
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(height: DiningFeedbackResultLayout.chipHeight)
        .clipped()
    }

    private func visibleCount(for availableWidth: CGFloat) -> Int {
        guard availableWidth > 0 else {
            return detailTags.count
        }

        let tagWidths = detailTags.map { chipWidth(for: $0.label) }
        let moreWidth = chipWidth(for: "+\(detailTags.count)")

        for count in stride(from: detailTags.count, through: 0, by: -1) {
            let hiddenCount = detailTags.count - count
            let elementCount = count + (hiddenCount > 0 ? 1 : 0)
            let gapWidth = CGFloat(max(0, elementCount - 1)) * DiningFeedbackResultLayout.chipGap
            let visibleWidth = tagWidths.prefix(count).reduce(0, +)
            let requiredWidth = visibleWidth
                + (hiddenCount > 0 ? moreWidth : 0)
                + gapWidth

            if requiredWidth <= availableWidth {
                return count
            }
        }

        return 0
    }

    private func chipWidth(for text: String) -> CGFloat {
        let font = UIFont(name: "Pretendard-Medium", size: 10)
            ?? UIFont.systemFont(ofSize: 10, weight: .medium)
        let textWidth = ceil((text as NSString).size(withAttributes: [.font: font]).width)
        return textWidth + 16
    }
}

private struct DiningFeedbackResultShareImage: View {
    let restaurant: String
    let menuTitle: String
    let experiences: [TasteExperience]
    let detailTags: [DiningDetailTagMetadata]
    let reflectionNote: String
    let photoData: Data?
    let canvasSize: CGSize

    var body: some View {
        ZStack {
            DiningFeedbackResultBackground(experiences: experiences)

            DiningFeedbackResultCard(
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
            isAnimating = false
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
            isAnimating = false
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
            UIView.animate(
                withDuration: TasteExperienceMapEngine.zoomTransitionDuration,
                delay: 0,
                options: [.allowUserInteraction, .beginFromCurrentState, .curveEaseOut]
            ) {
                scrollView.zoomScale = targetZoom
                scrollView.contentOffset = targetOffset
            } completion: { [weak self] _ in
                guard let self else { return }
                self.isAnimating = false
                self.lastReportedExperienceID = target.experienceID
                self.parent.onFocusedExperienceChange(target.experienceID)
                self.parent.onInteractionChange(false)
            }
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
                .animation(.easeOut(duration: 0.3), value: position)
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

    var body: some View {
        Button(action: onTap) {
            ZStack {
                Circle()
                    .fill(position.experience.axis.tintColor.opacity(fillOpacity))

                if isSelected {
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
            withAnimation(
                .spring(response: 0.68, dampingFraction: 0.66, blendDuration: 0.08)
            ) {
                hasEntered = true
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

private enum DiningFeedbackKindChipMetrics {
    static let height: CGFloat = 36
    static let horizontalPadding: CGFloat = 12
    static let gap: CGFloat = 6
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
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabel)
    }
}

private struct DiningFeedbackKindChip: View {
    let title: String
    var isSelected = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: DiningFeedbackKindChipMetrics.gap) {
                Text(title)
                    .font(TBFont.semibold(12))
                    .lineLimit(1)
            }
            .foregroundStyle(isSelected ? TBColor.textInverse : TBColor.textMuted)
            .padding(.horizontal, DiningFeedbackKindChipMetrics.horizontalPadding)
            .frame(height: DiningFeedbackKindChipMetrics.height)
            .background(isSelected ? TBColor.textPrimary : TBColor.mutedSurface)
            .clipShape(Capsule())
            .overlay {
                Capsule()
                    .strokeBorder(isSelected ? TBColor.textPrimary : TBColor.border)
            }
        }
        .buttonStyle(.plain)
    }
}

private struct DiningFeedbackKindChipWrap<Content: View>: View {
    let spacing: CGFloat
    private let content: Content

    init(spacing: CGFloat, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    var body: some View {
        DiningFeedbackKindChipLayout(spacing: spacing) {
            content
        }
    }
}

private struct DiningFeedbackKindChipLayout: Layout {
    let spacing: CGFloat

    func sizeThatFits(
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) -> CGSize {
        let availableWidth = proposal.width ?? .greatestFiniteMagnitude
        let result = layoutRows(in: availableWidth, subviews: subviews)

        return CGSize(
            width: proposal.width ?? result.width,
            height: result.height
        )
    }

    func placeSubviews(
        in bounds: CGRect,
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            let shouldWrap = x > bounds.minX && x + size.width > bounds.maxX

            if shouldWrap {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }

            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }

    private func layoutRows(in availableWidth: CGFloat, subviews: Subviews) -> CGSize {
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxRowWidth: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            let shouldWrap = x > 0 && x + size.width > availableWidth

            if shouldWrap {
                maxRowWidth = max(maxRowWidth, x - spacing)
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }

            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }

        if x > 0 {
            maxRowWidth = max(maxRowWidth, x - spacing)
        }

        return CGSize(width: maxRowWidth, height: y + rowHeight)
    }
}

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
