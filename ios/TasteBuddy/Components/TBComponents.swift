import SwiftUI
import UIKit

struct SectionCard<Content: View>: View {
    private let content: Content
    private let background: Color

    init(background: Color = TBColor.surface, @ViewBuilder content: () -> Content) {
        self.background = background
        self.content = content()
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(TBSpacing.card)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                    .stroke(TBColor.borderCard, lineWidth: 1)
            }
    }
}

enum PrimaryButtonSize: Equatable {
    case `default`
    case compact

    var fontSize: CGFloat {
        switch self {
        case .default: 14
        case .compact: 12
        }
    }

    var horizontalPadding: CGFloat {
        switch self {
        case .default: 0
        case .compact: 16
        }
    }

    var verticalPadding: CGFloat {
        switch self {
        case .default: 0
        case .compact: 8
        }
    }

    var height: CGFloat {
        switch self {
        case .default: TBSize.primaryButtonHeight
        case .compact: 40
        }
    }
}

struct PrimaryButton: View {
    let title: String
    var isEnabled = true
    var visualDisabled = false
    var fullWidth = true
    var size: PrimaryButtonSize = .default
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.semibold(size.fontSize))
                .padding(.horizontal, size.horizontalPadding)
                .padding(.vertical, size.verticalPadding)
                .frame(maxWidth: fullWidth ? .infinity : nil)
                .frame(minHeight: size.height)
                .foregroundStyle(appearsDisabled ? TBColor.textDisabled : TBColor.textInverse)
                .background(appearsDisabled ? TBColor.disabledSurface : TBColor.textPrimary)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                .shadow(
                    color: (!appearsDisabled && size == .default) ? Color.black.opacity(0.10) : .clear,
                    radius: 20,
                    x: 0,
                    y: 8
                )
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
    }

    private var appearsDisabled: Bool {
        !isEnabled || visualDisabled
    }
}

enum StepIndicatorMetrics {
    static let gap: CGFloat = 6
    static let activeWidth: CGFloat = 16
    static let inactiveWidth: CGFloat = 6
    static let height: CGFloat = 6
}

struct TBStepIndicator: View {
    let currentIndex: Int
    let total: Int
    var activeColor = TBColor.textPrimary
    var inactiveColor = TBColor.borderStrong

    var body: some View {
        HStack(spacing: StepIndicatorMetrics.gap) {
            ForEach(0..<max(total, 0), id: \.self) { index in
                Capsule()
                    .fill(index == currentIndex ? activeColor : inactiveColor)
                    .frame(
                        width: index == currentIndex ? StepIndicatorMetrics.activeWidth : StepIndicatorMetrics.inactiveWidth,
                        height: StepIndicatorMetrics.height
                    )
                    .animation(.easeInOut(duration: 0.3), value: currentIndex)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("진행 단계 \(min(currentIndex + 1, total)) / \(total)")
    }
}

enum FlowBottomCtaMetrics {
    static let horizontalPadding: CGFloat = TBSpacing.page
    static let bottomPadding: CGFloat = 12
    static let minHeight: CGFloat = TBSize.bottomFadeMinHeight
    static let secondaryButtonGap: CGFloat = 8
    static let stepIndicatorBottomMargin: CGFloat = 32
    static let helperBottomMargin: CGFloat = 8
    static let indicatorToHelperGap: CGFloat = 6
}

struct TBFlowBottomCTA: View {
    let actionLabel: String
    var isEnabled = true
    var actionVisualDisabled = false
    var actionFullWidth = true
    var actionSize: PrimaryButtonSize = .default
    var helperText: String? = nil
    var backgroundColor = TBColor.focus
    var secondaryActionLabel: String? = nil
    var secondaryAction: (() -> Void)? = nil
    var secondaryButtonEnabled = true
    var secondaryButtonVisualDisabled = false
    var secondaryActionView: AnyView? = nil
    var topSlot: AnyView? = nil
    let action: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)

            if let topSlot {
                topSlot
            }

            if let helperText {
                Text(helperText)
                    .font(TBFont.medium(11))
                    .foregroundStyle(TBColor.textFaint)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, FlowBottomCtaMetrics.helperBottomMargin)
            }

            if let secondaryActionLabel, let secondaryAction {
                HStack(spacing: FlowBottomCtaMetrics.secondaryButtonGap) {
                    secondaryButton(
                        title: secondaryActionLabel,
                        isEnabled: secondaryButtonEnabled,
                        visualDisabled: secondaryButtonVisualDisabled,
                        action: secondaryAction
                    )

                    PrimaryButton(
                        title: actionLabel,
                        isEnabled: isEnabled,
                        visualDisabled: actionVisualDisabled,
                        size: actionSize,
                        action: action
                    )
                }
            } else {
                PrimaryButton(
                    title: actionLabel,
                    isEnabled: isEnabled,
                    visualDisabled: actionVisualDisabled,
                    fullWidth: actionFullWidth,
                    size: actionSize,
                    action: action
                )
            }

            if let secondaryActionView {
                secondaryActionView
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        }
        .padding(.horizontal, FlowBottomCtaMetrics.horizontalPadding)
        .padding(.bottom, FlowBottomCtaMetrics.bottomPadding)
        .frame(maxWidth: .infinity)
        .frame(height: FlowBottomCtaMetrics.minHeight)
        .background(
            LinearGradient(
                stops: [
                    .init(color: backgroundColor.opacity(0), location: 0),
                    .init(color: backgroundColor.opacity(0.8), location: 0.45),
                    .init(color: backgroundColor, location: 1),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea(edges: .bottom)
        )
    }

    private func secondaryButton(
        title: String,
        isEnabled: Bool,
        visualDisabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        let appearsDisabled = !isEnabled || visualDisabled

        return Button(action: action) {
            Text(title)
                .font(TBFont.medium(actionSize.fontSize))
                .frame(maxWidth: .infinity)
                .frame(minHeight: actionSize.height)
                .foregroundStyle(appearsDisabled ? TBColor.textDisabled : TBColor.textTertiary)
                .background(Color.clear)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                        .stroke(appearsDisabled ? TBColor.borderDisabled : TBColor.borderStrong)
                }
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
    }
}

struct TBFlowStepCTA: View {
    let actionLabel: String
    let currentIndex: Int
    let total: Int
    var isEnabled = true
    var actionVisualDisabled = false
    var actionFullWidth = true
    var actionSize: PrimaryButtonSize = .default
    var activeColor = TBColor.textPrimary
    var inactiveColor = TBColor.borderStrong
    var helperText: String? = nil
    var backgroundColor = TBColor.focus
    var showsIndicator = true
    var stepLabel: String? = nil
    var secondaryActionLabel: String? = nil
    var secondaryAction: (() -> Void)? = nil
    var secondaryButtonEnabled = true
    var secondaryButtonVisualDisabled = false
    var secondaryActionView: AnyView? = nil
    let action: () -> Void

    var body: some View {
        TBFlowBottomCTA(
            actionLabel: actionLabel,
            isEnabled: isEnabled,
            actionVisualDisabled: actionVisualDisabled,
            actionFullWidth: actionFullWidth,
            actionSize: actionSize,
            helperText: helperText,
            backgroundColor: backgroundColor,
            secondaryActionLabel: secondaryActionLabel,
            secondaryAction: secondaryAction,
            secondaryButtonEnabled: secondaryButtonEnabled,
            secondaryButtonVisualDisabled: secondaryButtonVisualDisabled,
            secondaryActionView: secondaryActionView,
            topSlot: indicatorTopSlot,
            action: action
        )
    }

    private var indicatorTopSlot: AnyView? {
        guard showsIndicator else {
            return nil
        }

        let indicator = TBStepIndicator(
            currentIndex: currentIndex,
            total: total,
            activeColor: activeColor,
            inactiveColor: inactiveColor
        )

        if let stepLabel {
            return AnyView(
                VStack(spacing: 0) {
                    indicator
                    Text(stepLabel)
                        .font(TBFont.medium(12))
                        .foregroundStyle(TBColor.textFaint)
                        .multilineTextAlignment(.center)
                        .padding(.top, 6)
                }
                .padding(.bottom, FlowBottomCtaMetrics.stepIndicatorBottomMargin)
            )
        }

        return AnyView(
            indicator
                .padding(
                    .bottom,
                    helperText == nil
                        ? FlowBottomCtaMetrics.stepIndicatorBottomMargin
                        : FlowBottomCtaMetrics.indicatorToHelperGap
                )
        )
    }
}

struct TBFlowTopBar: View {
    let title: String?
    var leadingSymbol = "chevron.left"
    var leadingAccessibilityLabel = "이전 화면으로 돌아가기"
    var showsLeading = true
    var showsDivider = true
    var backgroundColor = TBColor.focus
    let leadingAction: () -> Void

    var body: some View {
        ZStack {
            if let title {
                Text(title)
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            }

            HStack {
                if showsLeading {
                    Button(action: leadingAction) {
                        LucideIcon(
                            systemName: leadingSymbol,
                            size: TBIcon.Size.medium,
                            strokeWidth: TBIcon.Stroke.regular
                        )
                            .foregroundStyle(TBColor.textSecondary)
                            .frame(
                                width: TBSize.chromeIconButton,
                                height: TBSize.chromeIconButton
                            )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(leadingAccessibilityLabel)
                } else {
                    Color.clear
                        .frame(
                            width: TBSize.chromeIconButton,
                            height: TBSize.chromeIconButton
                        )
                }

                Spacer()

                Color.clear
                    .frame(
                        width: TBSize.chromeIconButton,
                        height: TBSize.chromeIconButton
                    )
            }
        }
        .frame(height: TBSize.topAppBarHeight)
        .padding(.horizontal, TBSpacing.page)
        .background(backgroundColor)
        .overlay(alignment: .bottom) {
            if showsDivider {
                Rectangle()
                    .fill(TBColor.borderSubtle)
                    .frame(height: 1)
            }
        }
    }
}

enum SelectionCardMetrics {
    static let gap: CGFloat = 12
    static let padding: CGFloat = 16
    static let indicatorSize: CGFloat = 18
    static let indicatorTopPadding: CGFloat = 2
    static let radioDotSize: CGFloat = 8
    static let checkboxRadius: CGFloat = 6
    static let cardRadius: CGFloat = TBRadius.card
    static let selectedShadowRadius: CGFloat = 12
    static let selectedShadowYOffset: CGFloat = 8
}

struct TBSelectionCard: View {
    enum Indicator {
        case checkbox
        case radio
    }

    let title: String
    var description: String? = nil
    var indicator: Indicator = .radio
    var isSelected = false
    var singleLine = false
    var isEnabled = true
    var trailing: AnyView? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: singleLine ? .center : .top, spacing: SelectionCardMetrics.gap) {
                selectionIndicator
                    .padding(.top, singleLine ? 0 : SelectionCardMetrics.indicatorTopPadding)

                VStack(alignment: .leading, spacing: 0) {
                    Text(title)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(TBColor.textPrimary)
                        .lineSpacing(2)

                    if let description {
                        Text(description)
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textMuted)
                            .lineSpacing(3)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if let trailing {
                    trailing
                        .fixedSize()
                }
            }
            .padding(SelectionCardMetrics.padding)
            .frame(maxWidth: .infinity, minHeight: singleLine ? 44 : nil, alignment: .leading)
            .background(isEnabled ? TBColor.surface : TBColor.disabledSurface)
            .clipShape(RoundedRectangle(cornerRadius: SelectionCardMetrics.cardRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: SelectionCardMetrics.cardRadius, style: .continuous)
                    .stroke(
                        isSelected ? TBColor.textPrimary : TBColor.border,
                        lineWidth: 1
                    )
            }
            .shadow(
                color: isSelected ? TBColor.textPrimary.opacity(0.06) : .clear,
                radius: SelectionCardMetrics.selectedShadowRadius,
                x: 0,
                y: SelectionCardMetrics.selectedShadowYOffset
            )
            .contentShape(RoundedRectangle(cornerRadius: SelectionCardMetrics.cardRadius, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    @ViewBuilder
    private var selectionIndicator: some View {
        switch indicator {
        case .checkbox:
            ZStack {
                RoundedRectangle(cornerRadius: SelectionCardMetrics.checkboxRadius, style: .continuous)
                    .fill(isSelected ? TBColor.textPrimary : Color.clear)
                    .overlay {
                        RoundedRectangle(cornerRadius: SelectionCardMetrics.checkboxRadius, style: .continuous)
                            .stroke(
                                isSelected ? TBColor.textPrimary : TBColor.borderDisabled,
                                lineWidth: 1
                            )
                    }

                if isSelected {
                    LucideIcon(
                        .check,
                        size: TBIcon.Size.xSmall,
                        strokeWidth: TBIcon.Stroke.medium
                    )
                        .foregroundStyle(TBColor.textInverse)
                }
            }
            .frame(width: SelectionCardMetrics.indicatorSize, height: SelectionCardMetrics.indicatorSize)

        case .radio:
            ZStack {
                Circle()
                    .stroke(
                        isSelected ? TBColor.textPrimary : TBColor.borderDisabled,
                        lineWidth: isSelected ? 2 : 1
                    )

                if isSelected {
                    Circle()
                        .fill(TBColor.textPrimary)
                        .frame(width: SelectionCardMetrics.radioDotSize, height: SelectionCardMetrics.radioDotSize)
                }
            }
            .frame(width: SelectionCardMetrics.indicatorSize, height: SelectionCardMetrics.indicatorSize)
        }
    }
}

struct TBFlowHeaderBlock: View {
    enum TitleSize {
        case medium
        case large

        var fontSize: CGFloat {
            switch self {
            case .medium: 16
            case .large: 18
            }
        }
    }

    let title: String
    var description: String? = nil
    var topLeft: String? = nil
    var currentIndex: Int? = nil
    var total: Int? = nil
    var titleSize: TitleSize = .large
    var topLeftSlot: AnyView? = nil
    var topRightSlot: AnyView? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if hasTopRow {
                HStack(alignment: .center, spacing: 12) {
                    topLeftContent
                        .frame(minWidth: 0, maxWidth: .infinity, alignment: .leading)

                    topRightContent
                        .fixedSize()
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(TBFont.bold(titleSize.fontSize))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineSpacing(1)

                if let description {
                    Text(description)
                        .font(TBFont.regular(14))
                        .foregroundStyle(TBColor.textSubtle)
                        .lineSpacing(4)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var hasTopRow: Bool {
        topLeftSlot != nil || topRightSlot != nil || topLeft != nil || (currentIndex != nil && total != nil)
    }

    @ViewBuilder
    private var topLeftContent: some View {
        if let topLeftSlot {
            topLeftSlot
        } else if let topLeft {
            OutlineBadge(title: topLeft)
        }
    }

    @ViewBuilder
    private var topRightContent: some View {
        if let topRightSlot {
            topRightSlot
        } else if let currentIndex, let total {
            OutlineBadge(title: "\(currentIndex + 1) / \(total)")
        }
    }
}

struct OutlineBadge: View {
    let title: String

    var body: some View {
        Text(title)
            .font(TBFont.semibold(10))
            .foregroundStyle(TBColor.textTertiary)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(TBColor.surface)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.badge, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: TBRadius.badge, style: .continuous)
                    .stroke(TBColor.textTertiary.opacity(0.35))
            }
    }
}

struct BundledPNG: View {
    let name: String
    var contentMode: ContentMode = .fill

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            } else {
                TBColor.mutedSurface
            }
        }
    }

    private var image: UIImage? {
        guard let path = Bundle.main.path(forResource: name, ofType: "png") else {
            return nil
        }
        return UIImage(contentsOfFile: path)
    }
}

struct TBFlowLayout<Content: View>: View {
    let spacing: CGFloat
    private let content: Content

    init(spacing: CGFloat, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    var body: some View {
        LazyVGrid(
            columns: [
                GridItem(.adaptive(minimum: 82), spacing: spacing, alignment: .leading)
            ],
            alignment: .leading,
            spacing: spacing
        ) {
            content
        }
    }
}

struct TasteBubbleRow: View {
    let bubbles: [DishFeedbackTasteBubble]

    init(axes: [TasteAxis]) {
        self.bubbles = axes.map { DishFeedbackTasteBubble.fromAxis($0) }
    }

    init(bubbles: [DishFeedbackTasteBubble]) {
        self.bubbles = bubbles
    }

    var body: some View {
        HStack(spacing: 6) {
            ForEach(bubbles) { bubble in
                DishFeedbackTasteBubbleChip(bubble: bubble)
            }
            Spacer(minLength: 0)
        }
        .accessibilityLabel(bubbles.map(\.label).joined(separator: ", "))
    }
}

private struct DishFeedbackTasteBubbleChip: View {
    let bubble: DishFeedbackTasteBubble

    private var axis: TasteAxis? {
        bubble.resolvedAxis
    }

    var body: some View {
        Text(bubble.label)
            .font(TBFont.semibold(10))
            .foregroundStyle(axis?.tintTextColor ?? TBColor.textTertiary)
            .lineLimit(1)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(axis?.mainColor.opacity(0.05) ?? TBColor.mutedSurface)
            .clipShape(Capsule())
            .overlay {
                Capsule()
                    .stroke(axis?.mainColor.opacity(0.18) ?? TBColor.borderStrong, lineWidth: 1)
            }
            .accessibilityLabel(bubble.title ?? bubble.label)
    }
}

struct NativeDishFeedbackCard: View {
    let item: DiningDishFeedbackItem
    var absoluteDateLabel = "최근 기록"
    var relativeDateLabel = "최근"
    var showsOptions = true
    var framed = true
    var onOptionsTap: (() -> Void)? = nil
    var onDetailTap: (() -> Void)? = nil
    var onCommentsTap: (() -> Void)? = nil
    var onLike: (() -> Void)? = nil
    var onShare: (() -> Void)? = nil
    var onEdit: (() -> Void)? = nil
    var onDelete: (() -> Void)? = nil

    @State private var isLocalActionSheetPresented = false
    @State private var isDeleteConfirmationPresented = false
    @State private var isLiked = false

    var body: some View {
        Group {
            if framed {
                SectionCard {
                    cardContent
                }
            } else {
                cardContent
            }
        }
        .contentShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
        .onTapGesture {
            onDetailTap?()
        }
        .task(id: item.id) {
            isLiked = item.liked
        }
        .sheet(isPresented: $isLocalActionSheetPresented) {
            DishFeedbackActionSheet(
                subject: item.dishTitle,
                onDelete: {
                    isLocalActionSheetPresented = false
                    isDeleteConfirmationPresented = true
                },
                onEdit: {
                    isLocalActionSheetPresented = false
                    onEdit?()
                },
                onShare: {
                    isLocalActionSheetPresented = false
                    onShare?()
                }
            )
            .presentationDetents([.height(220)])
            .presentationDragIndicator(.visible)
            .presentationBackground(TBColor.focus)
        }
        .alert("이 디시 기록을 삭제할까요?", isPresented: $isDeleteConfirmationPresented) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) {
                onDelete?()
            }
        } message: {
            Text("삭제하면 나의 디시에서 이 기록이 사라집니다.")
        }
    }

    private var primaryAxis: TasteAxis {
        item.primaryTasteAxis
    }

    @ViewBuilder
    private var cardContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                PalateBloomAvatar(size: 32, seed: item.id)

                VStack(alignment: .leading, spacing: 2) {
                    authorLine
                        .foregroundStyle(TBColor.textPrimary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    Text("\(item.restaurantName) · \(relativeDateLabel)")
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if showsOptions {
                    Button {
                        if let onOptionsTap {
                            onOptionsTap()
                        } else {
                            isLocalActionSheetPresented = true
                        }
                    } label: {
                        LucideIcon(
                            .ellipsis,
                            size: TBIcon.Size.base,
                            strokeWidth: TBIcon.Stroke.medium
                        )
                            .frame(width: 32, height: 32)
                            .foregroundStyle(TBColor.textHint)
                            .background(TBColor.mutedSurface.opacity(0.01))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                }
            }

            DishFeedbackImageRail(images: item.images, unframed: !framed)

            if !item.tasteBubbles.isEmpty || !item.detailTags.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    if !item.tasteBubbles.isEmpty {
                        TasteBubbleRow(bubbles: item.tasteBubbles)
                    }

                    if !item.detailTags.isEmpty {
                        DishFeedbackDetailTagRow(tags: item.detailTags)
                    }
                }
            }

            DiningNotePreview(summary: item.summary)

            Divider()
                .overlay(TBColor.borderSubtle)

            HStack(spacing: 8) {
                Button {
                    isLiked.toggle()
                    if isLiked {
                        onLike?()
                    }
                } label: {
                    LucideIcon(
                        .heart,
                        size: TBIcon.Size.base,
                        strokeWidth: TBIcon.Stroke.regular,
                        filled: isLiked
                    )
                    .frame(width: 32, height: 32)
                    .foregroundStyle(isLiked ? primaryAxis.mainColor : TBColor.textHint)
                    .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isLiked ? "좋아요 취소" : "좋아요")

                if let onCommentsTap {
                    Button(action: onCommentsTap) {
                        commentIcon
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("댓글 \(item.commentCount)개 보기")
                } else {
                    commentIcon
                }

                Button {
                    onShare?()
                } label: {
                    LucideIcon(
                        .send,
                        size: TBIcon.Size.base,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .frame(width: 32, height: 32)
                    .foregroundStyle(TBColor.textHint)
                    .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("공유")

                Spacer()

                Text(absoluteDateLabel)
                    .font(TBFont.regular(11))
                    .foregroundStyle(TBColor.textMuted)
                    .lineLimit(1)
            }
            .padding(.top, 2)
        }
    }

    private var authorLine: Text {
        Text(item.authorName)
            .font(TBFont.semibold(14))
        + Text("님이 ")
            .font(TBFont.regular(14))
        + Text(item.dishTitle)
            .font(TBFont.semibold(14))
        + Text("의 후기를 남기셨습니다.")
            .font(TBFont.regular(14))
    }

    private var commentIcon: some View {
        HStack(spacing: 4) {
            LucideIcon(
                .messageCircle,
                size: TBIcon.Size.base,
                strokeWidth: TBIcon.Stroke.regular
            )
            .frame(width: 32, height: 32)
            .foregroundStyle(item.commentCount > 0 ? TBColor.textPrimary : TBColor.textHint)

            if item.commentCount > 0 {
                Text("\(item.commentCount)")
                    .font(TBFont.semibold(11))
                    .foregroundStyle(TBColor.textMuted)
            }
        }
    }
}

private struct DishFeedbackDetailTagRow: View {
    let tags: [DishFeedbackCardTag]

    var body: some View {
        ViewThatFits(in: .horizontal) {
            ForEach(Array((0...tags.count).reversed()), id: \.self) { visibleCount in
                DishFeedbackDetailTagCandidate(
                    tags: tags,
                    visibleCount: visibleCount
                )
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .clipped()
    }
}

private struct DishFeedbackDetailTagCandidate: View {
    let tags: [DishFeedbackCardTag]
    let visibleCount: Int

    var body: some View {
        HStack(spacing: 6) {
            ForEach(visibleTags) { tag in
                NeutralChip(title: tag.label)
                    .lineLimit(1)
                    .accessibilityLabel(tag.title ?? tag.label)
            }

            if hiddenCount > 0 {
                NeutralChip(title: "+\(hiddenCount)")
                    .accessibilityLabel("\(hiddenCount)개 태그 더 있음")
            }
        }
        .fixedSize(horizontal: true, vertical: false)
    }

    private var hiddenCount: Int {
        max(0, tags.count - visibleCount)
    }

    private var visibleTags: [DishFeedbackCardTag] {
        Array(tags.prefix(visibleCount))
    }
}

private struct DishFeedbackImageRail: View {
    let images: [DiningDishFeedbackItem.Image]
    var unframed = false

    private var visibleImages: [DiningDishFeedbackItem.Image] {
        images.filter(\.isUserFeedbackMedia)
    }

    var body: some View {
        if !visibleImages.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(visibleImages) { image in
                        dishImage(image)
                    }
                }
                .padding(.horizontal, unframed ? TBSpacing.page : TBSpacing.card)
            }
            .contentMargins(.horizontal, 0, for: .scrollContent)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, unframed ? -TBSpacing.page : -TBSpacing.card)
            .accessibilityElement(children: .contain)
        }
    }

    @ViewBuilder
    private func dishImage(_ image: DiningDishFeedbackItem.Image) -> some View {
        let tileSize: CGFloat = 144

        if let imageURL = image.imageURL {
            AsyncImage(url: imageURL) { phase in
                switch phase {
                case .success(let remoteImage):
                    remoteImage
                        .resizable()
                        .scaledToFill()
                case .failure:
                    feedbackImagePlaceholder
                case .empty:
                    ProgressView()
                        .tint(TBColor.textHint)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(TBColor.disabledSurface)
                @unknown default:
                    feedbackImagePlaceholder
                }
            }
            .frame(width: tileSize, height: tileSize)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
            .clipped()
            .accessibilityLabel(image.alt)
        } else if let imageName = image.imageName {
            BundledPNG(name: imageName)
                .frame(width: tileSize, height: tileSize)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
                .clipped()
                .accessibilityLabel(image.alt)
        }
    }

    private var feedbackImagePlaceholder: some View {
        ZStack {
            TBColor.disabledSurface
            LucideIcon(
                .camera,
                size: TBIcon.Size.large,
                strokeWidth: TBIcon.Stroke.regular
            )
            .foregroundStyle(TBColor.textHint)
        }
    }
}

private struct DishFeedbackActionSheet: View {
    let subject: String
    let onDelete: () -> Void
    let onEdit: () -> Void
    let onShare: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            DishFeedbackActionButton(
                title: "삭제",
                icon: .trash2,
                isDestructive: true,
                action: onDelete
            )
            DishFeedbackActionButton(
                title: "편집",
                icon: .pencil,
                action: onEdit
            )
            DishFeedbackActionButton(
                title: "공유",
                icon: .send,
                action: onShare
            )
        }
        .padding(12)
        .background(TBColor.focus)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
        .accessibilityLabel("\(subject) 카드 옵션")
    }
}

private struct DishFeedbackActionButton: View {
    let title: String
    let icon: LucideIconName
    var isDestructive = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                LucideIcon(
                    icon,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(width: 32, height: 32)

                Text(title)
                    .font(TBFont.semibold(14))

                Spacer()
            }
            .foregroundStyle(isDestructive ? TBColor.warning : TBColor.textPrimary)
            .frame(height: 48)
            .padding(.horizontal, 12)
            .contentShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct DiningNotePreview: View {
    let summary: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            (
                Text("미식 노트: ")
                    .font(TBFont.bold(13))
                    .foregroundStyle(TBColor.textPrimary)
                + Text(summary)
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textBody)
            )
            .lineSpacing(4)
        }
        .padding(12)
        .background(TBColor.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

struct StatusRow: View {
    enum Tone {
        case neutral
        case success
        case warning

        var foreground: Color {
            switch self {
            case .neutral: TBColor.textSecondary
            case .success: TBColor.success
            case .warning: TBColor.warning
            }
        }

        var background: Color {
            switch self {
            case .neutral: TBColor.mutedSurface
            case .success: TBColor.successSoft
            case .warning: TBColor.warningSoft
            }
        }
    }

    let icon: String
    let title: String
    let detail: String
    var tone: Tone = .neutral

    var body: some View {
        HStack(spacing: 12) {
            LucideIcon(
                systemName: icon,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.regular
            )
                .frame(width: 32, height: 32)
                .foregroundStyle(tone.foreground)
                .background(tone.background)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            Text(title)
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textPrimary)

            Spacer(minLength: 8)

            Text(detail)
                .font(TBFont.medium(12))
                .foregroundStyle(tone.foreground)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
    }
}

struct StatusRowPreviewGallery: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 6) {
                Text("StatusRow")
                    .font(TBFont.bold(18))
                    .foregroundStyle(TBColor.textPrimary)

                Text("프로필의 현재 상태와 다음 행동을 차분하게 요약합니다.")
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textBody)
            }

            SectionCard {
                VStack(spacing: 16) {
                    StatusRow(
                        icon: "sparkles",
                        title: "미각 프로필",
                        detail: "Starter",
                        tone: .success
                    )

                    Divider()

                    StatusRow(
                        icon: "fork.knife",
                        title: "식사 기록",
                        detail: "2개의 경험",
                        tone: .neutral
                    )

                    Divider()

                    StatusRow(
                        icon: "arrow.triangle.2.circlepath",
                        title: "다음 정교화",
                        detail: "피드백 1회 남음",
                        tone: .warning
                    )
                }
            }

            Spacer()
        }
        .padding(TBSpacing.page)
        .background(TBColor.page.ignoresSafeArea())
    }
}

struct SectionHeading: View {
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(TBFont.bold(18))
                .foregroundStyle(TBColor.textPrimary)
            if let subtitle {
                Text(subtitle)
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textBody)
                    .lineSpacing(3)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#if canImport(PreviewsMacros)
    #Preview("Status Row") {
        StatusRowPreviewGallery()
    }
#endif
