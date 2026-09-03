import SwiftUI
import UIKit

struct SectionCard<Content: View>: View {
    @Environment(\.tbCardBordersVisible) private var cardBordersVisible

    private let content: Content
    private let background: Color
    private let showsBorder: Bool

    init(
        background: Color = TBColor.surface,
        showsBorder: Bool = true,
        @ViewBuilder content: () -> Content
    ) {
        self.background = background
        self.showsBorder = showsBorder
        self.content = content()
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(TBSpacing.card)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
            .overlay {
                if showsBorder && cardBordersVisible {
                    RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                        .stroke(TBColor.borderCard, lineWidth: 1)
                }
            }
    }
}

private struct TBCardBordersVisibleKey: EnvironmentKey {
    static let defaultValue = true
}

extension EnvironmentValues {
    var tbCardBordersVisible: Bool {
        get { self[TBCardBordersVisibleKey.self] }
        set { self[TBCardBordersVisibleKey.self] = newValue }
    }
}

extension View {
    func tbCardBordersVisible(_ isVisible: Bool) -> some View {
        environment(\.tbCardBordersVisible, isVisible)
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

/// Disabled appearance belongs to the label's color tokens, never whole-button opacity.
struct TBTokenButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(isEnabled && configuration.isPressed && !reduceMotion ? 0.98 : 1)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

enum PrimaryButtonAppearance {
    case primary
    case tasteTint(TasteAxis)

    var foreground: Color {
        switch self {
        case .primary: TBColor.textInverse
        case .tasteTint(let axis): axis.tintTextColor
        }
    }

    var background: Color {
        switch self {
        case .primary: TBColor.textPrimary
        case .tasteTint(let axis): axis.tintColor
        }
    }

    var hasShadow: Bool {
        if case .primary = self { return true }
        return false
    }
}

struct PrimaryButton: View {
    @Environment(\.isEnabled) private var environmentIsEnabled

    let title: String
    var isEnabled = true
    var visualDisabled = false
    var fullWidth = true
    var size: PrimaryButtonSize = .default
    var appearance: PrimaryButtonAppearance = .primary
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.semibold(size.fontSize))
                .padding(.horizontal, size.horizontalPadding)
                .padding(.vertical, size.verticalPadding)
                .frame(maxWidth: fullWidth ? .infinity : nil)
                .frame(minHeight: size.height)
                .foregroundStyle(appearsDisabled ? TBColor.textDisabled : appearance.foreground)
                .background(appearsDisabled ? TBColor.disabledSurface : appearance.background)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                .shadow(
                    color: (!appearsDisabled && size == .default && appearance.hasShadow)
                        ? Color.black.opacity(0.10) : .clear,
                    radius: 20,
                    x: 0,
                    y: 8
                )
        }
        .buttonStyle(TBTokenButtonStyle())
        .disabled(!isEnabled)
    }

    private var appearsDisabled: Bool {
        !isEnabled || !environmentIsEnabled || visualDisabled
    }
}

struct AuthTextActionButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textFaint)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .frame(height: 28)
        }
        .buttonStyle(.plain)
    }
}

struct TBSkeletonBlock: View {
    var cornerRadius: CGFloat = TBRadius.row

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(TBColor.disabledSurface)
            .overlay {
                LinearGradient(
                    colors: [.clear, Color.white.opacity(0.54), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .opacity(0.6)
            }
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
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
    @Environment(\.isEnabled) private var environmentIsEnabled

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
        let appearsDisabled = !isEnabled || !environmentIsEnabled || visualDisabled

        return Button(action: action) {
            Text(title)
                .font(TBFont.medium(actionSize.fontSize))
                .frame(maxWidth: .infinity)
                .frame(minHeight: actionSize.height)
                .foregroundStyle(appearsDisabled ? TBColor.textDisabled : TBColor.textTertiary)
                .background(appearsDisabled ? TBColor.disabledSurface : Color.clear)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                        .stroke(appearsDisabled ? TBColor.borderDisabled : TBColor.borderStrong)
                }
        }
        .buttonStyle(TBTokenButtonStyle())
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
    var leadingIconSize = TBIcon.Size.large
    var leadingIconStrokeWidth = TBIcon.Stroke.regular
    let leadingAction: () -> Void

    var body: some View {
        ZStack {
            if let title {
                Text(title)
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineLimit(1)
                    .allowsHitTesting(false)
            }

            HStack {
                if showsLeading {
                    Button(action: leadingAction) {
                        LucideIcon(
                            systemName: leadingSymbol,
                            size: leadingIconSize,
                            strokeWidth: leadingIconStrokeWidth
                        )
                            .foregroundStyle(TBColor.textSecondary)
                            .frame(
                                width: TBIcon.Container.large,
                                height: TBIcon.Container.large
                            )
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(leadingAccessibilityLabel)
                } else {
                    Color.clear
                        .frame(
                            width: TBIcon.Container.large,
                            height: TBIcon.Container.large
                        )
                }

                Spacer()

                Color.clear
                    .frame(
                        width: TBIcon.Container.large,
                        height: TBIcon.Container.large
                    )
            }
            .padding(.horizontal, TBSpacing.page)
        }
        .frame(maxWidth: .infinity)
        .frame(height: TBSize.topAppBarHeight)
        .tbTopChromeBackground(fallback: backgroundColor)
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
    @Environment(\.isEnabled) private var environmentIsEnabled

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
    var showsUnselectedBorder = true
    var trailing: AnyView? = nil
    let action: () -> Void

    private var isEffectivelyEnabled: Bool {
        isEnabled && environmentIsEnabled
    }

    var body: some View {
        Button(action: action) {
            HStack(alignment: singleLine ? .center : .top, spacing: SelectionCardMetrics.gap) {
                selectionIndicator
                    .padding(.top, singleLine ? 0 : SelectionCardMetrics.indicatorTopPadding)

                VStack(alignment: .leading, spacing: 0) {
                    Text(title)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(isEffectivelyEnabled ? TBColor.textPrimary : TBColor.textDisabled)
                        .lineSpacing(2)

                    if let description {
                        Text(description)
                            .font(TBFont.regular(12))
                            .foregroundStyle(isEffectivelyEnabled ? TBColor.textMuted : TBColor.textDisabled)
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
            .background(isEffectivelyEnabled ? TBColor.surface : TBColor.disabledSurface)
            .clipShape(RoundedRectangle(cornerRadius: SelectionCardMetrics.cardRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: SelectionCardMetrics.cardRadius, style: .continuous)
                    .stroke(
                        selectionCardBorderColor,
                        lineWidth: 1
                    )
            }
            .shadow(
                color: isSelected && isEffectivelyEnabled ? TBColor.textPrimary.opacity(0.06) : .clear,
                radius: SelectionCardMetrics.selectedShadowRadius,
                x: 0,
                y: SelectionCardMetrics.selectedShadowYOffset
            )
            .contentShape(RoundedRectangle(cornerRadius: SelectionCardMetrics.cardRadius, style: .continuous))
        }
        .buttonStyle(TBTokenButtonStyle())
        .disabled(!isEnabled)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    @ViewBuilder
    private var selectionIndicator: some View {
        switch indicator {
        case .checkbox:
            ZStack {
                RoundedRectangle(cornerRadius: SelectionCardMetrics.checkboxRadius, style: .continuous)
                    .fill(isSelected ? selectionControlColor : Color.clear)
                    .overlay {
                        RoundedRectangle(cornerRadius: SelectionCardMetrics.checkboxRadius, style: .continuous)
                            .stroke(
                                isSelected ? selectionControlColor : TBColor.borderDisabled,
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
                    .strokeBorder(
                        isSelected ? selectionControlColor : TBColor.borderDisabled,
                        lineWidth: isSelected ? 2 : 1
                    )

                if isSelected {
                    Circle()
                        .fill(selectionControlColor)
                        .frame(width: SelectionCardMetrics.radioDotSize, height: SelectionCardMetrics.radioDotSize)
                }
            }
            .frame(width: SelectionCardMetrics.indicatorSize, height: SelectionCardMetrics.indicatorSize)
        }
    }

    private var selectionControlColor: Color {
        isEffectivelyEnabled ? TBColor.textPrimary : TBColor.textDisabled
    }

    private var selectionCardBorderColor: Color {
        guard isEffectivelyEnabled else {
            return TBColor.borderDisabled
        }

        guard isSelected || showsUnselectedBorder else {
            return .clear
        }

        return isSelected ? TBColor.textPrimary : TBColor.border
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
        TBWrapLayout(spacing: DishFeedbackCardMetrics.chipStackGap) {
            ForEach(bubbles) { bubble in
                DishFeedbackTasteBubbleChip(bubble: bubble)
            }
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
        TasteChip(
            title: bubble.label,
            tone: axis == nil ? .neutral : .taste,
            colorAxis: axis,
            size: .sm
        )
            .lineLimit(1)
            .accessibilityLabel(bubble.title ?? bubble.label)
    }
}

struct NativeDishFeedbackCard: View {
    let item: DiningDishFeedbackItem
    var absoluteDateLabel = "최근 기록"
    var relativeDateLabel = "최근"
    var showsOptions = true
    var framed = true
    var noteTrailingPadding: CGFloat = 0
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
        cardBody
            .contentShape(RoundedRectangle(cornerRadius: DishFeedbackCardMetrics.radius, style: .continuous))
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
    private var cardBody: some View {
        if framed {
            cardContent
                .padding(DishFeedbackCardMetrics.padding)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(TBColor.surface)
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: DishFeedbackCardMetrics.radius,
                        style: .continuous
                    )
                )
        } else {
            cardContent
        }
    }

    @ViewBuilder
    private var cardContent: some View {
        VStack(alignment: .leading, spacing: DishFeedbackCardMetrics.contentGap) {
            HStack(spacing: DishFeedbackCardMetrics.headerGap) {
                PalateBloomAvatar(size: DishFeedbackCardMetrics.avatarSize, seed: item.id)
                    .accessibilityLabel("\(item.authorName) 프로필 아바타")

                VStack(alignment: .leading, spacing: 2) {
                    DishFeedbackAuthorLine(
                        authorName: item.authorName,
                        subject: item.dishTitle
                    )
                        .foregroundStyle(TBColor.textPrimary)
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
                            size: DishFeedbackCardMetrics.actionIconSize,
                            strokeWidth: TBIcon.Stroke.medium
                        )
                            .frame(
                                width: DishFeedbackCardMetrics.optionButtonSize,
                                height: DishFeedbackCardMetrics.optionButtonSize
                            )
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

            DiningNotePreview(
                summary: item.summary,
                trailingPadding: noteTrailingPadding
            )

            Rectangle()
                .fill(TBColor.textPrimary.opacity(DishFeedbackCardMetrics.actionDividerOpacity))
                .frame(height: 1)

            HStack(spacing: DishFeedbackCardMetrics.actionGap) {
                Button {
                    isLiked.toggle()
                    if isLiked {
                        onLike?()
                    }
                } label: {
                    HStack(spacing: DishFeedbackCardMetrics.actionCountGap) {
                        LucideIcon(
                            .heart,
                            size: DishFeedbackCardMetrics.heartActionIconSize,
                            strokeWidth: TBIcon.Stroke.regular,
                            filled: isLiked
                        )
                        .frame(
                            width: DishFeedbackCardMetrics.actionIconFrameWidth,
                            height: DishFeedbackCardMetrics.actionButtonSize
                        )
                        .foregroundStyle(isLiked ? primaryAxis.mainColor : TBColor.textHint)

                        actionCountText(displayedLikeCount)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isLiked ? "좋아요 \(displayedLikeCount)개, 좋아요 취소" : "좋아요 \(displayedLikeCount)개")

                if let onCommentsTap {
                    Button(action: onCommentsTap) {
                        commentActionLabel
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("댓글 \(item.commentCount)개 보기")
                } else {
                    commentActionLabel
                }

                Button {
                    onShare?()
                } label: {
                    shareActionLabel
                }
                .buttonStyle(.plain)
                .accessibilityLabel("공유 \(displayedShareCount)개")

                Spacer()

                Text(absoluteDateLabel)
                    .font(TBFont.regular(11))
                    .foregroundStyle(TBColor.textMuted)
                    .lineLimit(1)
            }
        }
    }

    private var displayedLikeCount: Int {
        isLiked ? 1 : 0
    }

    private var displayedShareCount: Int {
        0
    }

    private var commentActionLabel: some View {
        HStack(spacing: DishFeedbackCardMetrics.actionCountGap) {
            commentIcon
            actionCountText(item.commentCount)
        }
        .contentShape(Rectangle())
    }

    private var shareActionLabel: some View {
        HStack(spacing: DishFeedbackCardMetrics.actionCountGap) {
            LucideIcon(
                .send,
                size: DishFeedbackCardMetrics.shareActionIconSize,
                strokeWidth: TBIcon.Stroke.regular
            )
            .frame(
                width: DishFeedbackCardMetrics.actionIconFrameWidth,
                height: DishFeedbackCardMetrics.actionButtonSize
            )
            .foregroundStyle(TBColor.textHint)

            actionCountText(displayedShareCount)
        }
        .contentShape(Rectangle())
    }

    private var commentIcon: some View {
        LucideIcon(
            .messageCircle,
            size: DishFeedbackCardMetrics.commentActionIconSize,
            strokeWidth: TBIcon.Stroke.regular
        )
        .frame(
            width: DishFeedbackCardMetrics.actionIconFrameWidth,
            height: DishFeedbackCardMetrics.actionButtonSize
        )
        .foregroundStyle(TBColor.textHint)
        .contentShape(Circle())
    }

    private func actionCountText(_ count: Int) -> some View {
        Text("\(count)")
            .font(TBFont.regular(12))
            .foregroundStyle(TBColor.textMuted)
            .lineLimit(1)
            .monospacedDigit()
    }
}

enum DishFeedbackCardMetrics {
    static let padding: CGFloat = 12
    static let contentGap: CGFloat = 12
    static let radius: CGFloat = 20
    static let headerGap: CGFloat = 8
    static let avatarSize: CGFloat = 32
    static let authorLineHeight: CGFloat = 19
    static let optionButtonSize: CGFloat = 32
    static let chipStackGap: CGFloat = 6
    static let actionDividerOpacity: CGFloat = 0.08
    static let actionGap: CGFloat = 8
    static let actionCountGap: CGFloat = 2
    static let actionIconSize: CGFloat = 18
    static let heartActionIconSize: CGFloat = 18
    static let commentActionIconSize: CGFloat = 18
    static let shareActionIconSize: CGFloat = 17
    static let actionIconFrameWidth: CGFloat = 18
    static let actionButtonSize: CGFloat = 32
    static let notePadding: CGFloat = 12
    static let noteRadius: CGFloat = 12
    static let skeletonImageTileSize: CGFloat = 144
    static let skeletonChipHeight: CGFloat = 26
    static let skeletonNoteHeight: CGFloat = 76
}

struct NativeDishFeedbackCardSkeleton: View {
    var framed = true

    var body: some View {
        Group {
            if framed {
                skeletonContent
                    .padding(DishFeedbackCardMetrics.padding)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(TBColor.surface)
                    .clipShape(
                        RoundedRectangle(
                            cornerRadius: DishFeedbackCardMetrics.radius,
                            style: .continuous
                        )
                    )
            } else {
                skeletonContent
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("디시 기록을 불러오는 중")
    }

    private var skeletonContent: some View {
        VStack(alignment: .leading, spacing: DishFeedbackCardMetrics.contentGap) {
            HStack(spacing: DishFeedbackCardMetrics.headerGap) {
                TBSkeletonBlock(cornerRadius: DishFeedbackCardMetrics.avatarSize / 2)
                    .frame(
                        width: DishFeedbackCardMetrics.avatarSize,
                        height: DishFeedbackCardMetrics.avatarSize
                    )

                VStack(alignment: .leading, spacing: 7) {
                    DishFeedbackSkeletonLine(widthRatio: 0.78, maxWidth: 360, height: 14)
                    DishFeedbackSkeletonLine(widthRatio: 0.36, maxWidth: 180, height: 10)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                TBSkeletonBlock(cornerRadius: DishFeedbackCardMetrics.optionButtonSize / 2)
                    .frame(
                        width: DishFeedbackCardMetrics.optionButtonSize,
                        height: DishFeedbackCardMetrics.optionButtonSize
                    )
            }

            TBSkeletonBlock(cornerRadius: TBRadius.support)
                .frame(
                    width: DishFeedbackCardMetrics.skeletonImageTileSize,
                    height: DishFeedbackCardMetrics.skeletonImageTileSize
                )

            VStack(alignment: .leading, spacing: DishFeedbackCardMetrics.chipStackGap) {
                HStack(spacing: DishFeedbackCardMetrics.chipStackGap) {
                    ForEach([104, 92, 112], id: \.self) { width in
                        TBSkeletonBlock(cornerRadius: DishFeedbackCardMetrics.skeletonChipHeight / 2)
                            .frame(
                                width: CGFloat(width),
                                height: DishFeedbackCardMetrics.skeletonChipHeight
                            )
                    }
                }

                HStack(spacing: DishFeedbackCardMetrics.chipStackGap) {
                    ForEach([64, 76, 84], id: \.self) { width in
                        TBSkeletonBlock(cornerRadius: DishFeedbackCardMetrics.skeletonChipHeight / 2)
                            .frame(
                                width: CGFloat(width),
                                height: DishFeedbackCardMetrics.skeletonChipHeight
                            )
                    }
                }
                .clipped()
            }

            TBSkeletonBlock(cornerRadius: DishFeedbackCardMetrics.noteRadius)
                .frame(maxWidth: .infinity)
                .frame(height: DishFeedbackCardMetrics.skeletonNoteHeight)

            Rectangle()
                .fill(TBColor.textPrimary.opacity(DishFeedbackCardMetrics.actionDividerOpacity))
                .frame(height: 1)

            HStack(spacing: DishFeedbackCardMetrics.actionGap) {
                ForEach(0..<3, id: \.self) { _ in
                    TBSkeletonBlock(cornerRadius: 10)
                        .frame(width: 20, height: 20)
                        .frame(
                            width: DishFeedbackCardMetrics.actionButtonSize,
                            height: DishFeedbackCardMetrics.actionButtonSize
                        )
                }

                Spacer()

                TBSkeletonBlock(cornerRadius: 6)
                    .frame(width: 72, height: 11)
            }
        }
    }
}

private struct DishFeedbackSkeletonLine: View {
    let widthRatio: CGFloat
    let maxWidth: CGFloat
    let height: CGFloat

    var body: some View {
        GeometryReader { proxy in
            TBSkeletonBlock(cornerRadius: height / 2)
                .frame(
                    width: min(proxy.size.width * widthRatio, maxWidth),
                    height: height,
                    alignment: .leading
                )
        }
        .frame(height: height)
    }
}

struct DishFeedbackAuthorLine: View {
    let authorName: String
    let subject: String

    var body: some View {
        GeometryReader { proxy in
            let visibleText = DishFeedbackAuthorLineTruncator.visibleText(
                authorName: authorName,
                subject: subject,
                availableWidth: proxy.size.width
            )

            HStack(alignment: .firstTextBaseline, spacing: 0) {
                Text(visibleText.authorName)
                    .font(TBFont.semibold(14))
                Text("님이 ")
                    .font(TBFont.regular(14))
                Text(visibleText.subject)
                    .font(TBFont.semibold(14))
                Text("의 후기를 남기셨습니다.")
                    .font(TBFont.regular(14))
            }
            .lineLimit(1)
            .frame(width: proxy.size.width, alignment: .leading)
            .clipped()
        }
        .frame(height: DishFeedbackCardMetrics.authorLineHeight)
    }
}

enum DishFeedbackAuthorLineTruncator {
    static let truncationMark = ".."
    static let minimumAuthorNameLength = 2
    static let minimumSubjectLength = 3

    static func visibleText(
        authorName: String,
        subject: String,
        availableWidth: CGFloat
    ) -> (authorName: String, subject: String) {
        guard availableWidth > 0 else {
            return (
                minimumText(authorName, minLength: minimumAuthorNameLength),
                minimumText(subject, minLength: minimumSubjectLength)
            )
        }

        let fixedWidth = width(of: "님이 ", weight: .regular)
            + width(of: "의 후기를 남기셨습니다.", weight: .regular)
        let availableLinkWidth = max(0, availableWidth - fixedWidth)
        let fullAuthorWidth = width(of: authorName, weight: .semibold)
        let fullSubjectWidth = width(of: subject, weight: .semibold)

        if fullAuthorWidth + fullSubjectWidth <= availableLinkWidth {
            return (authorName, subject)
        }

        let minimumAuthorName = minimumText(authorName, minLength: minimumAuthorNameLength)
        let minimumAuthorWidth = width(of: minimumAuthorName, weight: .semibold)
        let authorWidthWithFullSubject = availableLinkWidth - fullSubjectWidth

        if authorWidthWithFullSubject >= minimumAuthorWidth {
            return (
                textToFitWidth(
                    authorName,
                    minLength: minimumAuthorNameLength,
                    width: authorWidthWithFullSubject
                ),
                subject
            )
        }

        return (
            minimumAuthorName,
            textToFitWidth(
                subject,
                minLength: minimumSubjectLength,
                width: max(0, availableLinkWidth - minimumAuthorWidth)
            )
        )
    }

    static func minimumText(_ text: String, minLength: Int) -> String {
        let characters = Array(text)

        if characters.count <= minLength {
            return text
        }

        return String(characters.prefix(minLength)) + truncationMark
    }

    private static func textToFitWidth(
        _ text: String,
        minLength: Int,
        width: CGFloat
    ) -> String {
        let characters = Array(text)

        if characters.count <= minLength || Self.width(of: text, weight: .semibold) <= width {
            return text
        }

        let minimum = minimumText(text, minLength: minLength)

        if Self.width(of: minimum, weight: .semibold) >= width {
            return minimum
        }

        var low = minLength + 1
        var high = characters.count - 1
        var bestFit = minimum

        while low <= high {
            let middle = (low + high) / 2
            let candidate = String(characters.prefix(middle)) + truncationMark

            if Self.width(of: candidate, weight: .semibold) <= width {
                bestFit = candidate
                low = middle + 1
            } else {
                high = middle - 1
            }
        }

        return bestFit
    }

    private static func width(of text: String, weight: UIFont.Weight) -> CGFloat {
        let fontName = weight == .semibold ? "Pretendard-SemiBold" : "Pretendard-Regular"
        let font = UIFont(name: fontName, size: 14)
            ?? UIFont.systemFont(ofSize: 14, weight: weight)
        return ceil((text as NSString).size(withAttributes: [.font: font]).width)
    }
}

private struct DishFeedbackDetailTagRow: View {
    let tags: [DishFeedbackCardTag]

    var body: some View {
        TBOverflowTagRow(items: tags) { tag in
            TasteChip(title: tag.label, tone: .neutral, size: .sm)
                .accessibilityLabel(tag.title ?? tag.label)
        } overflow: { hiddenCount in
            TasteChip(title: "+\(hiddenCount)", tone: .neutral, size: .sm)
                .accessibilityLabel("\(hiddenCount)개 태그 더 있음")
        }
        .clipped()
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
                LazyHStack(spacing: 8) {
                    ForEach(visibleImages) { image in
                        DishFeedbackImageTile(image: image)
                    }
                }
                .padding(.horizontal, unframed ? TBSpacing.page : TBSpacing.card)
            }
            .contentMargins(.horizontal, 0, for: .scrollContent)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(height: 144)
            .padding(.horizontal, unframed ? -TBSpacing.page : -TBSpacing.card)
            .accessibilityElement(children: .contain)
        }
    }
}

private struct DishFeedbackImageTile: View {
    @Environment(\.displayScale) private var displayScale
    let image: DiningDishFeedbackItem.Image
    @State private var thumbnail: CGImage?
    @State private var loadedRequest: Request?
    @State private var loadGeneration = UUID()
    @State private var didFinishLoading = false
    private let tileSize: CGFloat = 144

    private struct Request: Equatable {
        let filename: String?
        let data: Data?
        let pixels: Int

        var hasLocalSource: Bool { filename != nil || data != nil }
    }

    var body: some View {
        let request = Request(
            filename: image.localPhotoFilename,
            data: image.imageData,
            pixels: max(1, Int(ceil(tileSize * displayScale)))
        )
        imageContent(for: request)
            .frame(width: tileSize, height: tileSize)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
            .clipped()
            .accessibilityLabel(image.alt)
            .task(id: request) {
                let generation = UUID()
                loadGeneration = generation
                thumbnail = nil
                loadedRequest = request
                didFinishLoading = false
                guard request.hasLocalSource else { return }
                let result = await DiningReflectionPhotoStore.thumbnail(
                    for: request.filename,
                    data: request.data,
                    fillingSquareOf: request.pixels
                )
                guard !Task.isCancelled, loadGeneration == generation else { return }
                thumbnail = result
                didFinishLoading = true
            }
            .onDisappear {
                // Lazy stacks retain row state; release its decoded pixels outside the viewport.
                loadGeneration = UUID()
                thumbnail = nil
                loadedRequest = nil
                didFinishLoading = false
            }
    }

    @ViewBuilder
    private func imageContent(for request: Request) -> some View {
        if loadedRequest == request, let thumbnail {
            Image(decorative: thumbnail, scale: displayScale, orientation: .up)
                .resizable()
                .scaledToFill()
        } else if request.hasLocalSource, !(didFinishLoading && loadedRequest == request) {
            loadingPlaceholder
        } else if let imageURL = image.imageURL {
            AsyncImage(url: imageURL) { phase in
                switch phase {
                case .success(let remoteImage):
                    remoteImage
                        .resizable()
                        .scaledToFill()
                case .failure:
                    feedbackImagePlaceholder
                case .empty:
                    loadingPlaceholder
                @unknown default:
                    feedbackImagePlaceholder
                }
            }
        } else if let imageName = image.imageName {
            BundledPNG(name: imageName)
        } else if request.hasLocalSource {
            feedbackImagePlaceholder
        }
    }

    private var loadingPlaceholder: some View {
        ProgressView()
            .tint(TBColor.textHint)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(TBColor.disabledSurface)
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
    var trailingPadding: CGFloat = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            (
                Text("미식 노트: ")
                    .font(TBFont.semibold(14))
                    .foregroundStyle(TBColor.textPrimary)
                + Text(summary)
                    .font(TBFont.regular(14))
                    .foregroundStyle(TBColor.textSubtle)
            )
            .lineSpacing(4)
            .lineLimit(4)
        }
        .padding(DishFeedbackCardMetrics.notePadding)
        .padding(.trailing, trailingPadding)
        .background(TBColor.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: DishFeedbackCardMetrics.noteRadius, style: .continuous))
    }
}

struct StatusRow: View {
    enum Tone {
        case neutral
        case success
        case warning
        case destructive

        var foreground: Color {
            switch self {
            case .neutral: TBColor.textSecondary
            case .success: TBColor.success
            case .warning: TBColor.warning
            case .destructive: TBColor.destructive
            }
        }

        var background: Color {
            switch self {
            case .neutral: TBColor.mutedSurface
            case .success: TBColor.successSoft
            case .warning: TBColor.warningSoft
            case .destructive: TBColor.destructive.opacity(0.10)
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
    #Preview("Primary and taste-tinted buttons") {
        VStack(spacing: TBSpacing.x16) {
            PrimaryButton(title: "다음으로") {}
            PrimaryButton(title: "미각 측정 시작", size: .compact, appearance: .tasteTint(.sweet)) {}
            PrimaryButton(
                title: "미각 측정 시작",
                isEnabled: false,
                size: .compact,
                appearance: .tasteTint(.sweet)
            ) {}
        }
        .padding(TBSpacing.page)
        .background(TBColor.page)
    }

    #Preview("CTA Disabled Color Tokens") {
        ZStack {
            LinearGradient(
                colors: [TBColor.textPrimary, TBColor.warning, TBColor.surface],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            VStack(spacing: TBSpacing.x16) {
                PrimaryButton(title: "식당 확인하고 메뉴 선택", isEnabled: false) {}
                PrimaryButton(title: "선택한 메뉴 기록하기", visualDisabled: true) {}
                PrimaryButton(title: "상위 화면에서 비활성화") {}
                    .disabled(true)
            }
            .padding(TBSpacing.page)
        }
    }

    #Preview("Status Row") {
        StatusRowPreviewGallery()
    }
#endif
