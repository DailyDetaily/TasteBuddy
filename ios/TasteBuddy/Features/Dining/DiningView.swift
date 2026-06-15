import SwiftUI
import UIKit
import Photos
import PhotosUI

struct DiningView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var presentation: DiningPresentation?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    TBPageSection(title: "나의 디시") {
                        VStack(spacing: 12) {
                            ForEach(dishFeedItems) { item in
                                let displayItem = appModel
                                    .dishFeedbackItemWithCurrentComments(item)
                                NativeDishFeedbackCard(
                                    item: displayItem,
                                    onOptionsTap: {
                                        presentation = .actions(displayItem)
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
                .padding(TBSpacing.page)
            }
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
                case .actions(let item):
                    DishActionSheet(
                        item: item,
                        editableEntry: diningEntry(for: item),
                        onShowDetail: {
                            self.presentation = .comments(item)
                        },
                        onEdit: { entry in
                            self.presentation = .edit(entry)
                        },
                        onDelete: { entryId in
                            appModel.removeDiningEntry(id: entryId)
                            self.presentation = nil
                        }
                    )
                }
            }
        }
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
            let dishKindTags = TasteBuddyAgent.inferDishKindIds(
                title: subject,
                subtitle: entry.restaurant,
                flavorNotes: tasteTags + detailTags
            )
            let tbaInput = TasteBuddyAgentDiningAnalysisInput(
                detailTags: detailTags,
                dishKindTags: dishKindTags,
                id: entry.id.uuidString,
                ingredients: [],
                restaurantName: entry.restaurant,
                reviewSnippet: entry.note.isEmpty
                    ? "전체 만족도 \(entry.rating)점으로 남긴 기록입니다. 다음에는 더 구체적인 미각 단서를 함께 남겨보세요."
                    : entry.note,
                subject: subject,
                tasteTags: tasteTags,
                techniques: []
            )
            let snapshot = TasteBuddyAgent.buildDiningAnalysisSnapshot(tbaInput)
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
    case actions(DiningDishFeedbackItem)

    var id: String {
        switch self {
        case .newFeedback:
            "new-feedback"
        case .edit(let entry):
            "edit-\(entry.id.uuidString)"
        case .comments(let item):
            "comments-\(item.id)"
        case .actions(let item):
            "actions-\(item.id)"
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
            .toolbar(.hidden, for: .navigationBar)
            .tbPageBackground(TBColor.focus)
        }
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
                .padding(TBSpacing.page)
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

private struct DishActionSheet: View {
    let item: DiningDishFeedbackItem
    let editableEntry: DiningEntry?
    let onShowDetail: () -> Void
    let onEdit: (DiningEntry) -> Void
    let onDelete: (UUID) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var showsDeleteAlert = false

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                SectionCard {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(item.dishTitle)
                            .font(TBFont.bold(17))
                            .foregroundStyle(TBColor.textPrimary)
                        Text("\(item.restaurantName) · \(item.reactionLabel)")
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textHint)
                    }
                }

                VStack(spacing: 10) {
                    ActionSheetRow(icon: "doc.text.magnifyingglass", title: "디시 상세 보기", detail: "메인 미각, 짧은 기록, 태그를 확인합니다") {
                        dismiss()
                        Task { @MainActor in
                            onShowDetail()
                        }
                    }

                    ActionSheetRow(
                        icon: "square.and.pencil",
                        title: "후기 수정",
                        detail: editableEntry == nil ? "샘플 카드는 수정할 수 없습니다" : "레스토랑, 메뉴, 만족도, 노트를 다시 정리합니다",
                        isDisabled: editableEntry == nil
                    ) {
                        guard let editableEntry else { return }
                        dismiss()
                        Task { @MainActor in
                            onEdit(editableEntry)
                        }
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

                Spacer()
            }
            .padding(TBSpacing.page)
            .navigationTitle("디시 옵션")
            .tbInlineNavigationTitle()
            .tbPageBackground()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
            .alert("이 디시 기록을 삭제할까요?", isPresented: $showsDeleteAlert) {
                Button("취소", role: .cancel) {}
                Button("삭제", role: .destructive) {
                    if let id = editableEntry?.id {
                        onDelete(id)
                    }
                    dismiss()
                }
            } message: {
                Text("삭제한 기록은 이 기기의 프로필 정교화 기준에서 제외됩니다.")
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
            ActionSheetRowContent(icon: icon, title: title, detail: detail, isDestructive: isDestructive)
                .opacity(isDisabled ? 0.48 : 1)
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
    }
}

private struct ActionSheetRowContent: View {
    let icon: String
    let title: String
    let detail: String
    var isDestructive = false

    var body: some View {
        SectionCard {
            HStack(spacing: 12) {
                LucideIcon(
                    systemName: icon,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .frame(width: 36, height: 36)
                    .foregroundStyle(isDestructive ? Color.red : TBColor.textSecondary)
                    .background(isDestructive ? Color.red.opacity(0.08) : TBColor.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(isDestructive ? Color.red : TBColor.textPrimary)
                    Text(detail)
                        .font(TBFont.regular(11))
                        .foregroundStyle(TBColor.textHint)
                        .lineLimit(2)
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

struct DiningFeedbackSheet: View {
    private enum Phase {
        case menu
        case tasteWords
        case detailTags
        case reflection
        case result
    }

    private enum ResultShareOption: CaseIterable, Identifiable {
        case instagramStory
        case copy
        case saveImage
        case copyLink

        var id: Self { self }

        var title: String {
            switch self {
            case .instagramStory:
                "인스타그램 스토리"
            case .copy:
                "복사하기"
            case .saveImage:
                "이미지로 저장"
            case .copyLink:
                "카피 링크"
            }
        }

        var detail: String {
            switch self {
            case .instagramStory:
                "스토리 편집 화면으로 결과 카드를 보냅니다"
            case .copy:
                "미식 노트 요약을 텍스트로 복사합니다"
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
                .share
            case .saveImage:
                .archive
            case .copyLink:
                .globe
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
    let onClose: (() -> Void)?
    let onSave: (DiningEntry) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dismiss) private var dismiss
    @State private var phase: Phase = .menu
    @State private var selectedDishIndex: Int?
    @State private var usesDirectInput = false
    @State private var directMenuTitle = ""
    @State private var customDishes: [DiningFeedbackDishContract] = []
    @State private var selectedKindIDs: Set<String> = ["seafood", "meat", "broth"]
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
    @State private var customTagCategoryID: String?
    @State private var customTagLabel = ""
    @State private var isResultChromeVisible = false
    @State private var isResultShareOverlayVisible = false
    @State private var resultShareStatusMessage: String?

    init(
        entry: DiningEntry? = nil,
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
        self.onClose = onClose
        self.onSave = onSave
        _directMenuTitle = State(initialValue: entry?.menu ?? "")
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
    }

    var body: some View {
        Group {
            switch phase {
            case .menu:
                menuSelectionView
            case .tasteWords:
                tasteWordsView
            case .detailTags:
                detailTagsView
            case .reflection:
                reflectionView
            case .result:
                resultView
            }
        }
        .preferredColorScheme(.light)
    }

    private var menuSelectionView: some View {
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
                        VStack(alignment: .leading, spacing: 8) {
                            Text("어떤 메뉴를 먼저 기록할까요?")
                                .font(TBFont.bold(16))
                                .foregroundStyle(TBColor.textPrimary)
                            Text("모든 코스를 한 번에 평가하지 않아도 괜찮아요. 가장 선명하게 기억나는 메뉴부터 선택하면, 그 메뉴의 미각 인상만 차분히 기록할 수 있어요.")
                                .font(TBFont.regular(12))
                                .foregroundStyle(TBColor.textBody)
                                .lineSpacing(5)
                            Text("\(scenario.courseName) · \(scenario.restaurant)")
                                .font(TBFont.regular(12))
                                .foregroundStyle(TBColor.textHint)
                                .padding(.top, 4)
                        }

                        VStack(spacing: 12) {
                            ForEach(Array(feedbackDishes.enumerated()), id: \.element.id) { index, dish in
                                TBSelectionCard(
                                    title: dish.title,
                                    description: dish.subtitle,
                                    indicator: .radio,
                                    isSelected: selectedDishIndex == index && !usesDirectInput
                                ) {
                                    selectDish(at: index)
                                }
                            }

                            TBSelectionCard(
                                title: "직접 입력",
                                description: "코스 목록에 없는 메뉴도 미각 기록으로 남길 수 있어요.",
                                indicator: .radio,
                                isSelected: usesDirectInput
                            ) {
                                selectedDishIndex = nil
                                usesDirectInput.toggle()
                            }

                            if usesDirectInput {
                                SectionCard {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("메뉴 직접 입력")
                                            .font(TBFont.semibold(14))
                                            .foregroundStyle(TBColor.textPrimary)

                                        HStack(spacing: 8) {
                                            TextField("예: 오미자와 배 디저트", text: $directMenuTitle)
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
                                                Text("추가")
                                                    .font(TBFont.semibold(12))
                                                    .foregroundStyle(TBColor.textInverse)
                                                    .padding(.horizontal, 16)
                                                    .frame(height: 44)
                                                    .background(TBColor.textPrimary)
                                                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                                            }
                                            .buttonStyle(.plain)
                                            .disabled(directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                                        }
                                    }
                                }
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

                                        DiningFeedbackKindChip(
                                            title: "직접 입력",
                                            symbol: .plus,
                                            isDashed: true
                                        ) {}
                                    }
                                }
                            }
                        }
                    }
                    .padding(TBSpacing.page)
                    .padding(.bottom, 156)
                }
                .scrollIndicators(.hidden)
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
        }
        .background(TBColor.page.ignoresSafeArea())
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
                        .padding(TBSpacing.page)
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
        ZStack {
            Text(selectedMenuTitle)
                .font(TBFont.bold(15))
                .foregroundStyle(TBColor.textPrimary)
                .padding(.horizontal, 12)
                .frame(height: 32)
                .background {
                    Capsule()
                        .fill(.ultraThinMaterial)
                        .overlay {
                            Capsule().fill(Color.white.opacity(0.72))
                        }
                }
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
                    .background {
                        Circle()
                            .fill(.ultraThinMaterial)
                            .overlay {
                                Circle().fill(Color.white.opacity(0.72))
                            }
                    }
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
                    .background {
                        Circle()
                            .fill(.ultraThinMaterial)
                            .overlay {
                                Circle().fill(Color.white.opacity(0.72))
                            }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("미각 단어 검색")
            }
            .padding(.horizontal, TBSpacing.page)
        }
        .frame(maxWidth: .infinity)
        .frame(height: TBSize.topAppBarHeight)
        .zIndex(20)
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
                            photoPickerItem: $photoPickerItem
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
                    .padding(TBSpacing.page)
                    .padding(.bottom, 164)
                }
                .scrollIndicators(.hidden)
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

    private var resultView: some View {
        ZStack(alignment: .bottom) {
            DiningFeedbackResultBackground(experiences: selectedExperiences)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture(perform: showResultChrome)

            VStack(spacing: 0) {
                if isResultChromeVisible {
                    resultTopBar
                        .transition(.move(edge: .top).combined(with: .opacity))
                }

                Spacer()

                Button(action: showResultChrome) {
                    DiningFeedbackResultCardBloom(
                        mainAxis: resultMeshAxes.main,
                        secondaryAxis: resultMeshAxes.secondary,
                        tertiaryAxis: resultMeshAxes.tertiary,
                        reduceMotion: reduceMotion
                    ) {
                        DiningFeedbackResultCard(
                            restaurant: scenario.restaurant,
                            menuTitle: selectedMenuTitle,
                            experiences: selectedExperiences,
                            detailTags: selectedDetailTagMetadata,
                            reflectionNote: resolvedReflectionNote,
                            photoData: reflectionPhotoData
                        )
                    }
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 50)
                .accessibilityLabel("결과 카드")
                .accessibilityHint("상단 공유 버튼과 하단 저장 버튼을 표시합니다")

                Spacer()
            }

            if isResultChromeVisible {
                resultSplitCTA
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            if isResultShareOverlayVisible {
                resultShareOverlay
                    .transition(.opacity.combined(with: .scale(scale: 0.98)))
                    .zIndex(30)
            }
        }
        .animation(.easeOut(duration: 0.3), value: isResultChromeVisible)
        .animation(.easeOut(duration: 0.22), value: isResultShareOverlayVisible)
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

                Button(action: showResultShareOverlay) {
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

    private var resultShareOverlay: some View {
        ZStack {
            Color.black.opacity(0.24)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture(perform: hideResultShareOverlay)

            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("결과 카드 공유")
                            .font(TBFont.bold(16))
                            .foregroundStyle(TBColor.textPrimary)

                        Text("다음 식사를 더 잘 맞추는 기록으로 남겨둘게요.")
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textMuted)
                    }

                    Spacer()

                    Button(action: hideResultShareOverlay) {
                        LucideIcon(
                            .x,
                            size: TBIcon.Size.base,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                        .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
                        .foregroundStyle(TBColor.textSecondary)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("공유 옵션 닫기")
                }

                VStack(spacing: 8) {
                    ForEach(ResultShareOption.allCases) { option in
                        resultShareOptionButton(option)
                    }
                }

                if let resultShareStatusMessage {
                    Text(resultShareStatusMessage)
                        .font(TBFont.medium(12))
                        .foregroundStyle(TBColor.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(TBColor.mutedSurface)
                        .clipShape(
                            RoundedRectangle(
                                cornerRadius: TBRadius.row,
                                style: .continuous
                            )
                        )
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
            }
            .padding(16)
            .frame(maxWidth: 340)
            .background(.ultraThinMaterial)
            .background(TBColor.overlaySurface)
            .clipShape(
                RoundedRectangle(
                    cornerRadius: TBRadius.card,
                    style: .continuous
                )
            )
            .overlay {
                RoundedRectangle(
                    cornerRadius: TBRadius.card,
                    style: .continuous
                )
                .stroke(Color.white.opacity(0.70), lineWidth: 1)
            }
            .shadow(
                color: TBShadow.drawer.color,
                radius: TBShadow.drawer.radius,
                x: TBShadow.drawer.x,
                y: TBShadow.drawer.y
            )
            .padding(.horizontal, TBSpacing.page)
            .onTapGesture {}
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func resultShareOptionButton(_ option: ResultShareOption) -> some View {
        Button {
            handleResultShareOption(option)
        } label: {
            HStack(spacing: 12) {
                LucideIcon(
                    option.icon,
                    size: TBIcon.Size.control,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
                .foregroundStyle(TBColor.textPrimary)

                VStack(alignment: .leading, spacing: 2) {
                    Text(option.title)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(TBColor.textPrimary)

                    Text(option.detail)
                        .font(TBFont.regular(11))
                        .foregroundStyle(TBColor.textMuted)
                        .lineLimit(1)
                }

                Spacer()

                LucideIcon(
                    .chevronRight,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .foregroundStyle(TBColor.textHint)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(TBColor.surface)
            .clipShape(
                RoundedRectangle(
                    cornerRadius: TBRadius.support,
                    style: .continuous
                )
            )
            .overlay {
                RoundedRectangle(
                    cornerRadius: TBRadius.support,
                    style: .continuous
                )
                .stroke(TBColor.borderSubtle, lineWidth: 1)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(option.title)
        .accessibilityHint(option.detail)
    }

    private func detailFlowTopBar(
        title: String? = nil,
        onBack: @escaping () -> Void
    ) -> some View {
        ZStack {
            Text(title ?? selectedMenuTitle)
                .font(TBFont.bold(15))
                .foregroundStyle(TBColor.textPrimary)
                .lineLimit(1)
                .allowsHitTesting(false)

            HStack {
                Button(action: onBack) {
                    LucideIcon(
                        .chevronLeft,
                        size: TBIcon.Size.large,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
                    .foregroundStyle(TBColor.textSecondary)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("이전 화면으로 돌아가기")

                Spacer()

                Color.clear
                    .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
            }
            .padding(.horizontal, TBSpacing.page)
        }
        .frame(maxWidth: .infinity)
        .frame(height: TBSize.topAppBarHeight)
        .background(TBColor.focus)
        .zIndex(20)
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

    private var feedbackDishes: [DiningFeedbackDishContract] {
        let baseDishes: [DiningFeedbackDishContract]
        if scenario.dishes.isEmpty,
           let entry,
           !entry.menu.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            baseDishes = [customDish(title: entry.menu, id: "entry-menu")]
        } else {
            baseDishes = scenario.dishes
        }

        return baseDishes + customDishes
    }

    private var selectedDish: DiningFeedbackDishContract? {
        guard let selectedDishIndex,
              feedbackDishes.indices.contains(selectedDishIndex) else {
            return nil
        }

        return feedbackDishes[selectedDishIndex]
    }

    private var selectedMenuTitle: String {
        usesDirectInput
            ? directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
            : selectedDish?.title ?? entry?.menu ?? "메뉴"
    }

    private var resultMeshAxes: (main: TasteAxis, secondary: TasteAxis, tertiary: TasteAxis) {
        let mainAxis = selectedExperiences.first?.axis ?? .umami
        let secondaryAxis = selectedExperiences.dropFirst().first?.axis ?? mainAxis
        let tertiaryAxis = selectedExperiences.dropFirst(2).first?.axis ?? secondaryAxis
        return (mainAxis, secondaryAxis, tertiaryAxis)
    }

    private var resultShareText: String {
        "\(scenario.restaurant) \(selectedMenuTitle)의 미각 기록"
    }

    private var resultShareCopyText: String {
        let tasteLabels = selectedExperiences.map(\.label).joined(separator: ", ")
        let tagLabels = selectedDetailTagMetadata.map(\.label).joined(separator: ", ")

        return """
        \(scenario.restaurant) · \(selectedMenuTitle)
        미각 인상: \(tasteLabels.isEmpty ? "기록 중" : tasteLabels)
        디테일 단서: \(tagLabels.isEmpty ? "다음 식사에서 더 정교해질 예정" : tagLabels)
        미식 노트: \(resolvedReflectionNote)
        """
    }

    private var resultShareLink: String {
        var components = URLComponents()
        components.scheme = "tastebuddy"
        components.host = "dining-feedback"
        components.path = "/result"
        components.queryItems = [
            URLQueryItem(name: "restaurant", value: scenario.restaurant),
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
        usesDirectInput = false
        directMenuTitle = ""
        selectedDishIndex = selectedDishIndex == index ? nil : index
    }

    private func addCustomDish() {
        let title = directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else {
            return
        }

        let nextDish = customDish(title: title, id: "custom-\(UUID().uuidString)")
        customDishes.append(nextDish)
        selectedDishIndex = feedbackDishes.count - 1
        usesDirectInput = false
        directMenuTitle = ""
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

    @MainActor
    private func loadReflectionPhoto(from item: PhotosPickerItem) async {
        do {
            guard let data = try await item.loadTransferable(type: Data.self),
                  let normalizedData = DiningReflectionPhotoStore.normalizedJPEGData(data)
            else {
                photoLoadError = "선택한 이미지를 읽을 수 없어요. 다른 사진을 선택해주세요."
                return
            }

            reflectionPhotoData = normalizedData
            reflectionPhotoFilename = nil
            photoLoadError = nil
        } catch {
            photoLoadError = "사진을 불러오는 중 문제가 생겼어요. 다시 시도해주세요."
        }
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

        onSave(
            DiningEntry(
                id: entryID,
                restaurant: scenario.restaurant,
                menu: selectedMenuTitle,
                date: entry?.date ?? .now,
                rating: TasteExperienceMapEngine.mappedRating(for: primaryExperience),
                note: resolvedReflectionNote,
                tasteExperienceIDs: selectedExperienceIDs,
                detailTagIDs: selectedDetailTagIDs,
                reflectionPhotoFilename: photoFilename
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

    private func showResultCard() {
        isResultChromeVisible = false
        isResultShareOverlayVisible = false
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
        isResultShareOverlayVisible = false
        resultShareStatusMessage = nil
        phase = .detailTags
    }

    private func showResultShareOverlay() {
        resultShareStatusMessage = nil
        withAnimation(.easeOut(duration: 0.22)) {
            isResultShareOverlayVisible = true
        }
    }

    private func hideResultShareOverlay() {
        withAnimation(.easeOut(duration: 0.22)) {
            isResultShareOverlayVisible = false
        }
    }

    private func handleResultShareOption(_ option: ResultShareOption) {
        switch option {
        case .instagramStory:
            shareResultToInstagramStory()
        case .copy:
            UIPasteboard.general.string = resultShareCopyText
            resultShareStatusMessage = "미식 노트 요약을 복사했어요."
        case .saveImage:
            saveResultImageToPhotos()
        case .copyLink:
            UIPasteboard.general.string = resultShareLink
            resultShareStatusMessage = "결과 카드 링크를 복사했어요."
        }
    }

    @MainActor
    private func makeResultShareImage() -> UIImage? {
        let renderer = ImageRenderer(
            content: DiningFeedbackResultShareImage(
                restaurant: scenario.restaurant,
                menuTitle: selectedMenuTitle,
                experiences: selectedExperiences,
                detailTags: selectedDetailTagMetadata,
                reflectionNote: resolvedReflectionNote,
                photoData: reflectionPhotoData
            )
            .frame(width: 360, height: 640)
        )
        renderer.scale = 3
        return renderer.uiImage
    }

    private func shareResultToInstagramStory() {
        guard let sourceApplication = instagramStoriesSourceApplication else {
            resultShareStatusMessage = "Instagram Story 연결을 위한 App ID가 필요해요."
            return
        }

        guard let imageData = makeResultShareImage()?.pngData() else {
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

        hideResultShareOverlay()
        UIApplication.shared.open(url)
    }

    private func saveResultImageToPhotos() {
        guard let image = makeResultShareImage() else {
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
        usesDirectInput = false
        directMenuTitle = ""
        selectedKindIDs = ["seafood", "meat", "broth"]
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
        customTagCategoryID = nil
        customTagLabel = ""
        isResultChromeVisible = false
        isResultShareOverlayVisible = false
        resultShareStatusMessage = nil
        phase = .menu
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
                        .stroke(activeExperience.axis.mainColor.opacity(0.18))
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
    @Binding var photoPickerItem: PhotosPickerItem?

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

            PhotosPicker(selection: $photoPickerItem, matching: .images) {
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
            Button(action: onOpenCustomInput) {
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
            .accessibilityLabel("\(category.label) 직접 입력")
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

            if !experiences.isEmpty {
                TBFlowLayout(spacing: 6) {
                    ForEach(experiences) { experience in
                        TasteChip(
                            title: experience.label,
                            tone: .taste,
                            colorAxis: experience.axis
                        )
                    }
                }
            }

            if !detailTags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(detailTags) { tag in
                            TasteChip(title: tag.label, tone: .neutral)
                        }
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

private struct DiningFeedbackResultShareImage: View {
    let restaurant: String
    let menuTitle: String
    let experiences: [TasteExperience]
    let detailTags: [DiningDetailTagMetadata]
    let reflectionNote: String
    let photoData: Data?

    var body: some View {
        ZStack {
            DiningFeedbackResultBackground(experiences: experiences)

            VStack(spacing: 0) {
                Text("Taste Buddy")
                    .font(TBFont.semibold(12))
                    .foregroundStyle(Color.white.opacity(0.86))
                    .tracking(0.8)
                    .padding(.top, 34)

                Spacer(minLength: 28)

                DiningFeedbackResultCard(
                    restaurant: restaurant,
                    menuTitle: menuTitle,
                    experiences: experiences,
                    detailTags: detailTags,
                    reflectionNote: reflectionNote,
                    photoData: photoData
                )
                .padding(.horizontal, 30)

                Spacer(minLength: 28)

                Text("다음 식사를 더 잘 맞추는 미각 기록")
                    .font(TBFont.medium(12))
                    .foregroundStyle(Color.white.opacity(0.78))
                    .padding(.bottom, 34)
            }
        }
        .frame(width: 360, height: 640)
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
                            position.experience.axis.mainColor.opacity(0.18),
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

private struct DiningFeedbackKindChip: View {
    let title: String
    var symbol: LucideIconName? = nil
    var isSelected = false
    var isDashed = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: DiningFeedbackKindChipMetrics.gap) {
                if let symbol {
                    LucideIcon(
                        symbol,
                        size: TBIcon.Size.small,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                }

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
                    .strokeBorder(
                        isSelected ? TBColor.textPrimary : TBColor.border,
                        style: StrokeStyle(
                            lineWidth: 1,
                            dash: isDashed ? [4, 3] : []
                        )
                    )
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
