import SwiftUI

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
                                        presentation = .detail(displayItem)
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
                case .detail(let item):
                    DishFeedbackDetailSheet(item: item)
                case .comments(let item):
                    DiningCommentsFocusSheet(item: item)
                case .actions(let item):
                    DishActionSheet(
                        item: item,
                        editableEntry: diningEntry(for: item),
                        onShowDetail: {
                            self.presentation = .detail(item)
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
            let tasteTags = (appModel.profile?.topAxes ?? [.umami, .sour]).map(\.label)
            let detailTags = entry.rating >= 4
                ? ["balance-well-balanced", "flow-opens-next", "composition-connected"]
                : ["balance-one-note-forward", "flow-finish-piled", "composition-course-fit"]
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

            return appModel.dishFeedbackItemWithCurrentComments(DiningDishFeedbackItem(
                id: entry.id.uuidString,
                authorName: "나",
                restaurantName: entry.restaurant,
                dishTitle: subject,
                summary: snapshot.summary,
                reactionLabel: snapshot.tasteBubbles.first?.label ?? (entry.rating >= 4 ? "편안한 밸런스" : "다음 조절 필요"),
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
    case detail(DiningDishFeedbackItem)
    case comments(DiningDishFeedbackItem)
    case actions(DiningDishFeedbackItem)

    var id: String {
        switch self {
        case .newFeedback:
            "new-feedback"
        case .edit(let entry):
            "edit-\(entry.id.uuidString)"
        case .detail(let item):
            "detail-\(item.id)"
        case .comments(let item):
            "comments-\(item.id)"
        case .actions(let item):
            "actions-\(item.id)"
        }
    }
}

private struct DiningCommentsFocusSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @FocusState private var isComposerFocused: Bool
    @State private var commentDraft = ""

    let item: DiningDishFeedbackItem

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        NativeDishFeedbackCard(
                            item: displayItem,
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

                            if comments.isEmpty {
                                Text("아직 댓글이 없어요. 이 디시에 남긴 감상을 짧게 이어갈 수 있어요.")
                                    .font(TBFont.regular(12))
                                    .foregroundStyle(TBColor.textMuted)
                                    .lineSpacing(3)
                            } else {
                                ForEach(comments) { comment in
                                    DiningCommentPreviewRow(comment: comment)
                                }
                            }
                        }
                    }
                    .padding(TBSpacing.page)
                    .padding(.bottom, 24)
                }

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
                        .foregroundStyle(trimmedDraft.isEmpty ? TBColor.textHint : TBColor.textBody)
                        .disabled(trimmedDraft.isEmpty)
                }
                .padding(.horizontal, TBSpacing.page)
                .padding(.top, 12)
                .padding(.bottom, 14)
                .background(TBColor.focus)
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(TBColor.borderSubtle)
                        .frame(height: 1)
                }
            }
            .navigationTitle("댓글")
            .tbInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
            .tbPageBackground()
        }
    }

    private var displayItem: DiningDishFeedbackItem {
        appModel.dishFeedbackItemWithCurrentComments(item)
    }

    private var comments: [DishFeedbackComment] {
        appModel.comments(for: item.id)
    }

    private var trimmedDraft: String {
        commentDraft.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func submitComment() {
        guard !trimmedDraft.isEmpty else { return }
        appModel.addDishFeedbackComment(feedbackID: item.id, message: trimmedDraft)
        commentDraft = ""
    }
}

private struct DiningCommentPreviewRow: View {
    let comment: DishFeedbackComment

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            PalateBloomAvatar(size: 32, seed: comment.authorName)
            VStack(alignment: .leading, spacing: 2) {
                Text(comment.authorName)
                    .font(TBFont.semibold(13))
                    .foregroundStyle(TBColor.textPrimary)
                Text(comment.message)
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textSubtle)
                    .lineSpacing(4)
            }
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
                    Label(item.liked ? "좋아요" : "좋아요", systemImage: item.liked ? "heart.fill" : "heart")
                    Label("\(item.commentCount)", systemImage: "text.bubble")
                    Label("공유", systemImage: "square.and.arrow.up")
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
    }

    private let entry: DiningEntry?
    private let fixture: DiningFeedbackFixtureContract?
    let onSave: (DiningEntry) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var phase: Phase = .menu
    @State private var selectedDishIndex = 0
    @State private var usesDirectInput = false
    @State private var directMenuTitle = ""
    @State private var selectedKindIDs: Set<String> = ["seafood", "meat", "broth"]
    @State private var selectedWord = "산뜻한 산미"
    @State private var hasChangedWord = false

    init(entry: DiningEntry? = nil, onSave: @escaping (DiningEntry) -> Void) {
        self.entry = entry
        fixture = try? DiningFeedbackFixtureLoader.load()
        self.onSave = onSave
        _directMenuTitle = State(initialValue: entry?.menu ?? "")
        _usesDirectInput = State(initialValue: entry != nil)
    }

    var body: some View {
        Group {
            switch phase {
            case .menu:
                menuSelectionView
            case .tasteWords:
                tasteWordsView
            }
        }
        .preferredColorScheme(.light)
    }

    private var menuSelectionView: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                TBFlowTopBar(
                    title: "식후 피드백",
                    backgroundColor: TBColor.page,
                    leadingAction: { dismiss() }
                )

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("어떤 메뉴를 먼저 기록할까요?")
                                .font(TBFont.bold(18))
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

                        if let dish = selectedDish {
                            TBSelectionCard(
                                title: dish.title,
                                description: dish.subtitle,
                                indicator: .radio,
                                isSelected: !usesDirectInput
                            ) {
                                usesDirectInput = false
                            }
                        }

                        TBSelectionCard(
                            title: "직접 입력",
                            description: "코스 목록에 없는 메뉴도 미각 기록으로 남길 수 있어요.",
                            indicator: .radio,
                            isSelected: usesDirectInput,
                            trailing: AnyView(
                                StatusChip(
                                    title: "선택사항",
                                    backgroundColor: TBColor.mutedSurface,
                                    foregroundColor: TBColor.textHint
                                )
                            )
                        ) {
                            usesDirectInput = true
                        }

                        if usesDirectInput {
                            TextField("메뉴 이름", text: $directMenuTitle)
                                .font(TBFont.regular(14))
                                .padding(.horizontal, 16)
                                .frame(height: 48)
                                .background(TBColor.surface)
                                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control))
                                .overlay {
                                    RoundedRectangle(cornerRadius: TBRadius.control)
                                        .stroke(TBColor.border)
                                }
                        }

                        SectionCard {
                            VStack(alignment: .leading, spacing: 14) {
                                HStack {
                                    Text("디시 종류")
                                        .font(TBFont.bold(15))
                                    Spacer()
                                    Text("선택사항")
                                        .font(TBFont.regular(11))
                                        .foregroundStyle(TBColor.textHint)
                                }

                                Text("추천 태그를 먼저 골라두었어요. 메뉴와 다르면 직접 바꿔주세요.")
                                    .font(TBFont.regular(12))
                                    .foregroundStyle(TBColor.textBody)

                                TBFlowLayout(spacing: 8) {
                                    ForEach(fixture?.dishKindOptions ?? []) { kind in
                                        Button {
                                            toggleKind(kind.id)
                                        } label: {
                                            Text(kind.label)
                                                .font(TBFont.semibold(12))
                                                .foregroundStyle(
                                                    selectedKindIDs.contains(kind.id)
                                                        ? TBColor.textInverse
                                                        : TBColor.textSecondary
                                                )
                                                .padding(.horizontal, 13)
                                                .padding(.vertical, 9)
                                                .background(
                                                    selectedKindIDs.contains(kind.id)
                                                        ? TBColor.textPrimary
                                                        : TBColor.mutedSurface
                                                )
                                                .clipShape(Capsule())
                                                .overlay {
                                                    Capsule()
                                                        .stroke(
                                                            selectedKindIDs.contains(kind.id)
                                                                ? TBColor.textPrimary
                                                                : TBColor.border
                                                        )
                                                }
                                        }
                                        .buttonStyle(.plain)
                                    }

                                    NeutralChip(title: "직접 입력", symbol: "plus")
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
                isEnabled: !usesDirectInput || !directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
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
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                ZStack {
                    Text(selectedMenuTitle)
                        .font(TBFont.bold(15))
                        .foregroundStyle(TBColor.textPrimary)

                    HStack {
                        Button {
                            phase = .menu
                        } label: {
                            LucideIcon(
                                .chevronLeft,
                                size: TBIcon.Size.medium,
                                strokeWidth: TBIcon.Stroke.regular
                            )
                                .frame(width: 40, height: 40)
                                .foregroundStyle(TBColor.textSecondary)
                        }
                        .buttonStyle(.plain)

                        Spacer()

                        LucideIcon(
                            .search,
                            size: TBIcon.Size.control,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                            .frame(width: 40, height: 40)
                            .foregroundStyle(TBColor.textSecondary)
                    }
                }
                .frame(height: TBSize.topAppBarHeight)
                .padding(.horizontal, TBSpacing.page)
                .background(TBColor.focus.opacity(0.92))

                GeometryReader { geometry in
                    ZStack {
                        TBColor.focus

                        ForEach(tasteWords) { word in
                            Button {
                                if selectedWord == word.label {
                                    saveFeedback()
                                } else {
                                    selectedWord = word.label
                                    hasChangedWord = true
                                }
                            } label: {
                                Text(word.label)
                                    .font(
                                        word.label == selectedWord
                                            ? TBFont.bold(16)
                                            : TBFont.medium(13)
                                    )
                                    .foregroundStyle(word.axis.tintTextColor.opacity(0.78))
                                    .multilineTextAlignment(.center)
                                    .frame(width: word.size, height: word.size)
                                    .background(
                                        word.axis.tintColor.opacity(
                                            word.label == selectedWord ? 0.92 : 0.56
                                        )
                                    )
                                    .clipShape(Circle())
                                    .overlay {
                                        if word.label == selectedWord {
                                            Circle()
                                                .stroke(word.axis.mainColor.opacity(0.28))
                                        }
                                    }
                            }
                            .buttonStyle(.plain)
                            .position(
                                x: geometry.size.width * word.x,
                                y: geometry.size.height * word.y
                            )
                        }
                    }
                    .clipped()
                }
            }

            if hasChangedWord {
                TBFlowStepCTA(
                    actionLabel: "이 감각으로 기록하기",
                    currentIndex: 0,
                    total: 1,
                    showsIndicator: false,
                    action: saveFeedback
                )
            }
        }
        .background(TBColor.focus.ignoresSafeArea())
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

    private var selectedDish: DiningFeedbackDishContract? {
        guard !scenario.dishes.isEmpty else {
            return nil
        }
        return scenario.dishes[min(selectedDishIndex, scenario.dishes.count - 1)]
    }

    private var selectedMenuTitle: String {
        usesDirectInput
            ? directMenuTitle.trimmingCharacters(in: .whitespacesAndNewlines)
            : selectedDish?.title ?? entry?.menu ?? "메뉴"
    }

    private func toggleKind(_ id: String) {
        if selectedKindIDs.contains(id) {
            selectedKindIDs.remove(id)
        } else {
            selectedKindIDs.insert(id)
        }
    }

    private func saveFeedback() {
        onSave(
            DiningEntry(
                id: entry?.id ?? UUID(),
                restaurant: scenario.restaurant,
                menu: selectedMenuTitle,
                date: entry?.date ?? .now,
                rating: entry?.rating ?? 5,
                note: "\(selectedWord)을 중심으로 기억에 남은 식후 피드백입니다."
            )
        )
        dismiss()
    }

    private let tasteWords = [
        TasteWord(label: "오래 남는 단맛", axis: .sweet, x: 0.31, y: 0.07, size: 112),
        TasteWord(label: "피니시를 잡은\n단맛", axis: .sweet, x: 0.70, y: 0.07, size: 108),
        TasteWord(label: "둥근 단맛", axis: .sweet, x: 0.13, y: 0.24, size: 116),
        TasteWord(label: "캐러멜 같은 단맛", axis: .sweet, x: 0.50, y: 0.24, size: 124),
        TasteWord(label: "발효 산미", axis: .sour, x: 0.88, y: 0.24, size: 108),
        TasteWord(label: "은은한 과일 단맛", axis: .sweet, x: 0.30, y: 0.42, size: 124),
        TasteWord(label: "입맛을 여는 산미", axis: .sour, x: 0.72, y: 0.42, size: 126),
        TasteWord(label: "부드러운 단맛", axis: .sweet, x: 0.10, y: 0.61, size: 112),
        TasteWord(label: "산뜻한 산미", axis: .sour, x: 0.50, y: 0.61, size: 140),
        TasteWord(label: "부드러운 과일\n산미", axis: .sour, x: 0.88, y: 0.61, size: 116),
        TasteWord(label: "은근한 깊이", axis: .umami, x: 0.14, y: 0.82, size: 112),
        TasteWord(label: "쌉싸름한 여운", axis: .bitter, x: 0.50, y: 0.82, size: 112),
        TasteWord(label: "부드러운 간", axis: .salty, x: 0.86, y: 0.82, size: 112),
    ]
}

private struct TasteWord: Identifiable {
    let label: String
    let axis: TasteAxis
    let x: CGFloat
    let y: CGFloat
    let size: CGFloat

    var id: String {
        label
    }
}
