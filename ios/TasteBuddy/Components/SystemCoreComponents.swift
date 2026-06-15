import SwiftUI
import UIKit

@MainActor
final class BottomComposerKeyboardObserver: NSObject, ObservableObject {
    @Published private(set) var visibleHeight: CGFloat = 0

    override init() {
        super.init()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleKeyboardNotification),
            name: UIResponder.keyboardWillChangeFrameNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleKeyboardNotification),
            name: UIResponder.keyboardWillHideNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func handleKeyboardNotification(_ notification: Notification) {
        let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double ?? 0.24
        let keyboardFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect ?? .zero

        withAnimation(.easeOut(duration: duration)) {
            visibleHeight = Self.visibleKeyboardHeight(for: keyboardFrame)
        }
    }

    private static func visibleKeyboardHeight(for keyboardFrame: CGRect) -> CGFloat {
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap(\.windows)
            .first(where: \.isKeyWindow) else {
            return 0
        }

        let keyboardFrameInWindow = window.convert(keyboardFrame, from: nil)
        return max(0, window.bounds.maxY - keyboardFrameInWindow.minY)
    }
}

enum TokenBoxSize: CaseIterable {
    case small
    case medium
    case large

    var sideLength: CGFloat {
        switch self {
        case .small: 32
        case .medium: 40
        case .large: 48
        }
    }
}

enum TokenBoxMetrics {
    static let radius: CGFloat = TBRadius.icon
    static let smallSize: CGFloat = TokenBoxSize.small.sideLength
    static let mediumSize: CGFloat = TokenBoxSize.medium.sideLength
    static let largeSize: CGFloat = TokenBoxSize.large.sideLength
}

struct TokenBox<Content: View>: View {
    var size: TokenBoxSize? = .small
    var background = TBColor.mutedSurface
    var foreground = TBColor.textPrimary
    private let content: Content

    init(
        size: TokenBoxSize? = .small,
        background: Color = TBColor.mutedSurface,
        foreground: Color = TBColor.textPrimary,
        @ViewBuilder content: () -> Content
    ) {
        self.size = size
        self.background = background
        self.foreground = foreground
        self.content = content()
    }

    var body: some View {
        content
            .foregroundStyle(foreground)
            .frame(
                width: size?.sideLength,
                height: size?.sideLength
            )
            .frame(maxWidth: size == nil ? .infinity : nil, maxHeight: size == nil ? .infinity : nil)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: TokenBoxMetrics.radius, style: .continuous))
    }
}

struct SectionTitle: View {
    let title: String
    var size: TBSectionTitleSize = .large

    var body: some View {
        Text(title)
            .font(size.font)
            .foregroundStyle(TBColor.textPrimary)
    }
}

enum ImageBoxKind {
    case chef
    case restaurant
    case menu
}

enum ImageBoxFallback {
    case chef
    case generic
    case menu
    case person
    case restaurant
}

enum ImageBoxVariant {
    case neutral
    case taste
}

enum ImageBoxMetrics {
    static let radius: CGFloat = TBRadius.icon
    static let smallSize: CGFloat = TokenBoxMetrics.smallSize
    static let mediumSize: CGFloat = TokenBoxMetrics.mediumSize
    static let largeSize: CGFloat = TokenBoxMetrics.largeSize
    static let fallbackIconSmall: CGFloat = TBIcon.Size.small
    static let fallbackIconMedium: CGFloat = TBIcon.Size.medium
    static let fallbackIconLarge: CGFloat = TBIcon.Size.large
}

struct ImageBox: View {
    let alt: String
    var kind: ImageBoxKind? = nil
    var fallback: ImageBoxFallback? = nil
    var fallbackIconSize: CGFloat? = nil
    var fallbackIconColor = TBColor.textHint
    var imageName: String? = nil
    var imageURL: URL? = nil
    var size: TokenBoxSize? = .medium
    var taste: TasteAxis = .umami
    var variant: ImageBoxVariant = .neutral
    var contentMode: ContentMode = .fill

    var body: some View {
        Group {
            if let resolvedImageName {
                imageContainer {
                    BundledPNG(name: resolvedImageName, contentMode: contentMode)
                }
            } else if let imageURL {
                imageContainer {
                    AsyncImage(url: imageURL) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: contentMode)
                        case .empty:
                            fallbackContent
                                .opacity(0.72)
                        case .failure:
                            fallbackContent
                        @unknown default:
                            fallbackContent
                        }
                    }
                }
            } else {
                fallbackContent
            }
        }
        .accessibilityLabel(alt)
    }

    private var resolvedImageName: String? {
        if let imageName {
            return imageName.replacingOccurrences(of: ".png", with: "")
        }

        guard kind == .chef else {
            return nil
        }

        return ChefImageResolver.bundledImageName(for: alt)
    }

    private var effectiveFallback: ImageBoxFallback {
        if let fallback {
            return fallback
        }

        switch kind {
        case .chef:
            return .person
        case .menu:
            return .menu
        case .restaurant:
            return .restaurant
        case nil:
            return .generic
        }
    }

    private var effectiveIconSize: CGFloat {
        if let fallbackIconSize {
            return fallbackIconSize
        }

        switch size ?? .medium {
        case .small:
            return ImageBoxMetrics.fallbackIconSmall
        case .medium:
            return ImageBoxMetrics.fallbackIconMedium
        case .large:
            return ImageBoxMetrics.fallbackIconLarge
        }
    }

    private var fallbackBackground: Color {
        switch variant {
        case .neutral:
            return TBColor.mutedSurface
        case .taste:
            return TBColor.surface
        }
    }

    private var fallbackForeground: Color {
        switch variant {
        case .neutral, .taste:
            return fallbackIconColor
        }
    }

    private var fallbackIcon: LucideIconName {
        switch effectiveFallback {
        case .chef:
            return .chefHat
        case .generic:
            return .circleDot
        case .menu:
            return .utensils
        case .person:
            return .user
        case .restaurant:
            return .store
        }
    }

    private var fallbackContent: some View {
        TokenBox(
            size: size,
            background: fallbackBackground,
            foreground: fallbackForeground
        ) {
            LucideIcon(
                fallbackIcon,
                size: effectiveIconSize,
                strokeWidth: TBIcon.Stroke.regular
            )
        }
    }

    private func imageContainer<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .frame(
                width: size?.sideLength,
                height: size?.sideLength
            )
            .frame(maxWidth: size == nil ? .infinity : nil, maxHeight: size == nil ? .infinity : nil)
            .background(TBColor.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: ImageBoxMetrics.radius, style: .continuous))
    }
}

struct ChefAvatar: View {
    let alt: String
    var iconSize: CGFloat? = nil
    var imageName: String? = nil
    var imageURL: URL? = nil
    var size: TokenBoxSize? = .medium
    var taste: TasteAxis = .umami
    var variant: ImageBoxVariant = .taste

    var body: some View {
        ImageBox(
            alt: alt,
            kind: .chef,
            fallbackIconSize: iconSize,
            imageName: imageName,
            imageURL: imageURL,
            size: size,
            taste: taste,
            variant: variant
        )
    }
}

enum ChefImageResolver {
    private static let bundledImageByName: [String: String] = [
        "강민구": "KangMingoo",
        "Kang Mingoo": "KangMingoo",
        "이은지": "LeeEunji",
        "임정식": "LimJeongsik",
        "온지음": "OnjiumChefs",
        "온지음 셰프": "OnjiumChefs",
        "조은희 / 박성배": "OnjiumChefs",
        "Cho Eun-hee / Park Sung-bae": "OnjiumChefs",
        "Eun-hee Cho and Sung-bae Park": "OnjiumChefs"
    ]

    static func bundledImageName(for name: String) -> String? {
        let normalizedName = name.replacingOccurrences(of: #"\s*셰프$"#, with: "", options: .regularExpression)
        return bundledImageByName[normalizedName] ?? bundledImageByName[name]
    }
}

enum StatusChipMetrics {
    static let radius: CGFloat = TBRadius.badge
    static let horizontalPadding: CGFloat = TBSpacing.x6
    static let verticalPadding: CGFloat = TBSpacing.x2
    static let fontSize: CGFloat = 10
}

struct StatusChip: View {
    let title: String
    var backgroundColor = TBColor.mutedSurface
    var foregroundColor = TBColor.textTertiary

    var body: some View {
        Text(title)
            .font(TBFont.semibold(StatusChipMetrics.fontSize))
            .foregroundStyle(foregroundColor)
            .lineLimit(1)
            .padding(.horizontal, StatusChipMetrics.horizontalPadding)
            .padding(.vertical, StatusChipMetrics.verticalPadding)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: StatusChipMetrics.radius, style: .continuous))
            .fixedSize(horizontal: true, vertical: false)
    }
}

enum EmptyStateActionTone {
    case `default`
    case userAccent
}

enum EmptyStateMetrics {
    static let verticalPadding: CGFloat = 48
    static let horizontalPadding: CGFloat = 24
    static let gap: CGFloat = 16
    static let iconContainerSize: CGFloat = TBIcon.Container.large
    static let iconRadius: CGFloat = TBRadius.support
    static let iconSize: CGFloat = TBIcon.Size.medium
    static let titleSize: CGFloat = 16
    static let descriptionSize: CGFloat = 13
}

struct EmptyState: View {
    let title: String
    let description: String
    var actionLabel: String? = nil
    var actionTone: EmptyStateActionTone = .default
    var icon: LucideIconName? = nil
    var onAction: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: EmptyStateMetrics.gap) {
            if let icon {
                LucideIcon(
                    icon,
                    size: EmptyStateMetrics.iconSize,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(
                    width: EmptyStateMetrics.iconContainerSize,
                    height: EmptyStateMetrics.iconContainerSize
                )
                .foregroundStyle(TBColor.textHint)
                .background(TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: EmptyStateMetrics.iconRadius, style: .continuous))
            }

            VStack(spacing: 4) {
                Text(title)
                    .font(TBFont.bold(EmptyStateMetrics.titleSize))
                    .foregroundStyle(TBColor.textPrimary)
                    .multilineTextAlignment(.center)

                Text(description)
                    .font(TBFont.regular(EmptyStateMetrics.descriptionSize))
                    .foregroundStyle(TBColor.textMuted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
            }

            if let actionLabel, let onAction {
                Button(action: onAction) {
                    Text(actionLabel)
                        .font(TBFont.semibold(12))
                        .foregroundStyle(actionForeground)
                        .padding(.horizontal, 16)
                        .frame(minHeight: 40)
                        .background(actionBackground)
                        .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                }
                .buttonStyle(.plain)
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, EmptyStateMetrics.horizontalPadding)
        .padding(.vertical, EmptyStateMetrics.verticalPadding)
        .accessibilityElement(children: .combine)
    }

    private var actionBackground: Color {
        switch actionTone {
        case .default:
            return TBColor.textPrimary
        case .userAccent:
            return TasteAxis.sweet.tintColor
        }
    }

    private var actionForeground: Color {
        switch actionTone {
        case .default:
            return TBColor.textInverse
        case .userAccent:
            return TasteAxis.sweet.tintTextColor
        }
    }
}

enum ActionOverlayCardLayout {
    case stack
    case split
}

enum ActionOverlayCardActionTone {
    case `default`
    case destructive
}

struct ActionOverlayCardAction: Identifiable {
    let id: String
    let label: String
    var tone: ActionOverlayCardActionTone = .default
    var isDisabled = false
    var action: () -> Void = {}
}

enum ActionOverlayCardMetrics {
    static let overlayOpacity: Double = 0.35
    static let horizontalPadding: CGFloat = TBSpacing.page
    static let cardMaxWidth: CGFloat = 320
    static let cardRadius: CGFloat = TBRadius.card
    static let stackPadding: CGFloat = 16
    static let customContentHorizontalPadding: CGFloat = 20
    static let customContentVerticalPadding: CGFloat = 16
    static let titleStackSpacing: CGFloat = 8
    static let actionHeight: CGFloat = 44
}

struct ActionOverlayCard<Content: View>: View {
    let title: String
    var description: String? = nil
    var actions: [ActionOverlayCardAction] = []
    var layout: ActionOverlayCardLayout = .stack
    var headerStart: AnyView? = nil
    var headerEnd: AnyView? = nil
    var onBackdropTap: (() -> Void)? = nil
    var backdropOpacity = ActionOverlayCardMetrics.overlayOpacity
    private let content: Content

    init(
        title: String,
        description: String? = nil,
        actions: [ActionOverlayCardAction] = [],
        layout: ActionOverlayCardLayout = .stack,
        headerStart: AnyView? = nil,
        headerEnd: AnyView? = nil,
        onBackdropTap: (() -> Void)? = nil,
        backdropOpacity: Double = ActionOverlayCardMetrics.overlayOpacity,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.description = description
        self.actions = actions
        self.layout = layout
        self.headerStart = headerStart
        self.headerEnd = headerEnd
        self.onBackdropTap = onBackdropTap
        self.backdropOpacity = backdropOpacity
        self.content = content()
    }

    var body: some View {
        ZStack {
            Color.black
                .opacity(backdropOpacity)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture {
                    onBackdropTap?()
                }

            VStack(spacing: 0) {
                header

                if Content.self != EmptyView.self {
                    content
                        .padding(.top, 20)
                }

                if !actions.isEmpty {
                    actionStack
                        .padding(.top, Content.self == EmptyView.self ? 0 : 16)
                }
            }
            .padding(cardPadding)
            .frame(maxWidth: ActionOverlayCardMetrics.cardMaxWidth)
            .background(TBColor.focus)
            .clipShape(RoundedRectangle(cornerRadius: ActionOverlayCardMetrics.cardRadius, style: .continuous))
            .shadow(color: Color.black.opacity(0.24), radius: 30, x: 0, y: 20)
        }
        .padding(.horizontal, ActionOverlayCardMetrics.horizontalPadding)
    }

    @ViewBuilder
    private var header: some View {
        if headerStart != nil || headerEnd != nil {
            HStack {
                (headerStart ?? AnyView(Color.clear.frame(width: 40, height: 40)))
                    .frame(width: 40, height: 40, alignment: .leading)

                Spacer()

                Text(title)
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
                    .multilineTextAlignment(.center)

                Spacer()

                (headerEnd ?? AnyView(Color.clear.frame(width: 40, height: 40)))
                    .frame(width: 40, height: 40, alignment: .trailing)
            }
            .frame(minHeight: 40)
        } else {
            VStack(spacing: ActionOverlayCardMetrics.titleStackSpacing) {
                Text(title)
                    .font(TBFont.bold(16))
                    .foregroundStyle(TBColor.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)

                if let description {
                    Text(description)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                }
            }
            .padding(.bottom, layout == .split ? 16 : 0)
        }
    }

    @ViewBuilder
    private var actionStack: some View {
        switch layout {
        case .stack:
            VStack(spacing: 8) {
                ForEach(actions) { action in
                    actionButton(action, compact: true)
                }
            }
        case .split:
            HStack(spacing: 8) {
                ForEach(actions) { action in
                    actionButton(action, compact: false)
                }
            }
        }
    }

    private var cardPadding: EdgeInsets {
        if Content.self == EmptyView.self {
            return EdgeInsets(
                top: ActionOverlayCardMetrics.stackPadding,
                leading: ActionOverlayCardMetrics.stackPadding,
                bottom: ActionOverlayCardMetrics.stackPadding,
                trailing: ActionOverlayCardMetrics.stackPadding
            )
        }

        return EdgeInsets(
            top: ActionOverlayCardMetrics.customContentVerticalPadding,
            leading: ActionOverlayCardMetrics.customContentHorizontalPadding,
            bottom: ActionOverlayCardMetrics.customContentVerticalPadding,
            trailing: ActionOverlayCardMetrics.customContentHorizontalPadding
        )
    }

    private func actionButton(_ action: ActionOverlayCardAction, compact: Bool) -> some View {
        Button(action: action.action) {
            Text(action.label)
                .font(TBFont.semibold(13))
                .foregroundStyle(actionForeground(action))
                .frame(maxWidth: .infinity)
                .frame(height: ActionOverlayCardMetrics.actionHeight)
                .background(actionBackground(action, compact: compact))
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                .overlay {
                    if layout == .split && compact == false && action.tone == .default {
                        RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                            .stroke(TBColor.borderStrong, lineWidth: 1)
                    }
                }
        }
        .buttonStyle(.plain)
        .disabled(action.isDisabled)
        .opacity(action.isDisabled ? 0.45 : 1)
    }

    private func actionForeground(_ action: ActionOverlayCardAction) -> Color {
        switch action.tone {
        case .default:
            layout == .split ? TBColor.textTertiary : TBColor.textPrimary
        case .destructive:
            Color.red
        }
    }

    private func actionBackground(_ action: ActionOverlayCardAction, compact: Bool) -> Color {
        switch action.tone {
        case .default:
            compact ? TBColor.mutedSurface : Color.clear
        case .destructive:
            compact ? TBColor.mutedSurface : Color.red.opacity(0.12)
        }
    }
}

extension ActionOverlayCard where Content == EmptyView {
    init(
        title: String,
        description: String? = nil,
        actions: [ActionOverlayCardAction] = [],
        layout: ActionOverlayCardLayout = .stack,
        headerStart: AnyView? = nil,
        headerEnd: AnyView? = nil,
        onBackdropTap: (() -> Void)? = nil,
        backdropOpacity: Double = ActionOverlayCardMetrics.overlayOpacity
    ) {
        self.init(
            title: title,
            description: description,
            actions: actions,
            layout: layout,
            headerStart: headerStart,
            headerEnd: headerEnd,
            onBackdropTap: onBackdropTap,
            backdropOpacity: backdropOpacity
        ) {
            EmptyView()
        }
    }
}

enum BottomSheetShellMetrics {
    static let overlayOpacity: CGFloat = 0.60
    static let stageHeightRatio: CGFloat = 0.98
    static let authEntryEmailMaxHeightRatio: CGFloat = 0.72
    static let stageTopInset: CGFloat = 12
    static let maxWidth: CGFloat = TBSize.screenMaxWidth
    static let topRadius: CGFloat = 24
    static let clipsOnlyTopCorners = true
    static let usesCustomGrabber = true
    static let grabberTopMargin: CGFloat = 5
    static let grabberHeight: CGFloat = 5
    static let grabberToHeaderSpacing: CGFloat = 0
    static let grabberWidth: CGFloat = 36
    static let topAreaHeightIncludingGrabber: CGFloat =
        grabberTopMargin + grabberHeight + grabberToHeaderSpacing
    static let headerHorizontalPadding: CGFloat = TBSpacing.page
    static let headerBottomPadding: CGFloat = 16
    static let headerSlotSize: CGFloat = 40
    static let footerHorizontalPadding: CGFloat = TBSpacing.page
    static let footerTopPadding: CGFloat = 16
    static let footerBottomPadding: CGFloat = 12
    static let footerSafeAreaAccessoryTopGap: CGFloat = 12
    static let footerSafeAreaAccessoryHeight: CGFloat = 28
    static let iconButtonSize: CGFloat = TBIcon.Container.large
    static let iconSize: CGFloat = TBIcon.Size.large

    static func footerBottomPadding(safeAreaBottom: CGFloat) -> CGFloat {
        max(footerBottomPadding, safeAreaBottom)
    }

    static func footerSafeAreaHeight(
        safeAreaBottom: CGFloat,
        accessoryHeight: CGFloat?
    ) -> CGFloat {
        guard let accessoryHeight else {
            return footerBottomPadding(safeAreaBottom: safeAreaBottom)
        }

        return max(
            safeAreaBottom,
            footerSafeAreaAccessoryTopGap + accessoryHeight + footerBottomPadding
        )
    }

    static func stageHeight(screenHeight: CGFloat, safeAreaTop: CGFloat) -> CGFloat {
        max(0, screenHeight * stageHeightRatio - safeAreaTop - stageTopInset)
    }
}

enum BottomSheetStageMode: Equatable {
    case fixed
    case auto(maxHeightRatio: CGFloat)
}

enum StagedBottomSheetDragMetrics {
    static let minimumDistance: CGFloat = 6
    static let dismissProgressThreshold: CGFloat = 0.32
}

enum StagedBottomSheetBackgroundMetrics {
    static let openScale: CGFloat = 0.9
    static let openOffsetY: CGFloat = 10
    static let openRadius: CGFloat = 20
    static let shadowY: CGFloat = 20
    static let shadowBlur: CGFloat = 60
    static let shadowOpacity: CGFloat = 0.24
    static let animation = Animation.timingCurve(0.22, 1, 0.36, 1, duration: 0.62)
}

struct StagedBottomSheetBackground: ViewModifier {
    let progress: CGFloat
    var dimOpacity: CGFloat = 0
    var animates = true

    private var clampedProgress: CGFloat {
        min(max(progress, 0), 1)
    }

    private var clampedDimOpacity: CGFloat {
        min(max(dimOpacity, 0), 1)
    }

    func body(content: Content) -> some View {
        let scale = 1 - (1 - StagedBottomSheetBackgroundMetrics.openScale) * clampedProgress
        let offsetY = StagedBottomSheetBackgroundMetrics.openOffsetY * clampedProgress
        let radius = StagedBottomSheetBackgroundMetrics.openRadius * clampedProgress
        let shadowY = StagedBottomSheetBackgroundMetrics.shadowY * clampedProgress
        let shadowBlur = StagedBottomSheetBackgroundMetrics.shadowBlur * clampedProgress
        let shadowOpacity = StagedBottomSheetBackgroundMetrics.shadowOpacity * clampedProgress

        content
            .overlay(Color.black.opacity(clampedDimOpacity))
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .shadow(
                color: Color.black.opacity(shadowOpacity),
                radius: shadowBlur,
                x: 0,
                y: shadowY
            )
            .scaleEffect(scale, anchor: .top)
            .offset(y: offsetY)
            .animation(
                animates ? StagedBottomSheetBackgroundMetrics.animation : nil,
                value: clampedProgress
            )
    }
}

private struct BottomSheetTopRoundedShape: Shape {
    let radius: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let radius = min(radius, rect.width / 2, rect.height / 2)

        path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + radius))
        path.addQuadCurve(
            to: CGPoint(x: rect.minX + radius, y: rect.minY),
            control: CGPoint(x: rect.minX, y: rect.minY)
        )
        path.addLine(to: CGPoint(x: rect.maxX - radius, y: rect.minY))
        path.addQuadCurve(
            to: CGPoint(x: rect.maxX, y: rect.minY + radius),
            control: CGPoint(x: rect.maxX, y: rect.minY)
        )
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

struct BottomSheetIconButton: View {
    var ariaLabel: String
    var icon: LucideIconName
    var iconSize = BottomSheetShellMetrics.iconSize
    var iconStrokeWidth = TBIcon.Stroke.regular
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            LucideIcon(
                icon,
                size: iconSize,
                strokeWidth: iconStrokeWidth
            )
            .frame(
                width: BottomSheetShellMetrics.iconButtonSize,
                height: BottomSheetShellMetrics.iconButtonSize
            )
            .foregroundStyle(TBColor.iconPrimary)
            .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(ariaLabel)
    }
}

struct BottomSheetCloseButton: View {
    var ariaLabel = "닫기"
    var action: () -> Void

    var body: some View {
        BottomSheetIconButton(
            ariaLabel: ariaLabel,
            icon: .x,
            action: action
        )
    }
}

struct BottomSheetShell<Content: View>: View {
    var headerStart: AnyView? = nil
    var headerCenter: AnyView? = nil
    var headerEnd: AnyView? = nil
    var footer: AnyView? = nil
    var footerSafeAreaAccessory: AnyView? = nil
    var footerSafeAreaAccessoryHeight = BottomSheetShellMetrics.footerSafeAreaAccessoryHeight
    var footerHorizontalPadding = BottomSheetShellMetrics.footerHorizontalPadding
    var footerTopPadding = BottomSheetShellMetrics.footerTopPadding
    var footerBottomPaddingOverride: CGFloat? = nil
    var footerBackground: Color? = nil
    var footerKeyboardOffset: CGFloat = 0
    var floatingLayer: AnyView? = nil
    var stageMode: BottomSheetStageMode = .fixed
    var usesNativeSheetChrome = false
    private let content: Content

    init(
        headerStart: AnyView? = nil,
        headerCenter: AnyView? = nil,
        headerEnd: AnyView? = nil,
        footer: AnyView? = nil,
        footerSafeAreaAccessory: AnyView? = nil,
        footerSafeAreaAccessoryHeight: CGFloat = BottomSheetShellMetrics.footerSafeAreaAccessoryHeight,
        footerHorizontalPadding: CGFloat = BottomSheetShellMetrics.footerHorizontalPadding,
        footerTopPadding: CGFloat = BottomSheetShellMetrics.footerTopPadding,
        footerBottomPaddingOverride: CGFloat? = nil,
        footerBackground: Color? = nil,
        footerKeyboardOffset: CGFloat = 0,
        floatingLayer: AnyView? = nil,
        stageMode: BottomSheetStageMode = .fixed,
        usesNativeSheetChrome: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.headerStart = headerStart
        self.headerCenter = headerCenter
        self.headerEnd = headerEnd
        self.footer = footer
        self.footerSafeAreaAccessory = footerSafeAreaAccessory
        self.footerSafeAreaAccessoryHeight = footerSafeAreaAccessoryHeight
        self.footerHorizontalPadding = footerHorizontalPadding
        self.footerTopPadding = footerTopPadding
        self.footerBottomPaddingOverride = footerBottomPaddingOverride
        self.footerBackground = footerBackground
        self.footerKeyboardOffset = footerKeyboardOffset
        self.floatingLayer = floatingLayer
        self.stageMode = stageMode
        self.usesNativeSheetChrome = usesNativeSheetChrome
        self.content = content()
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                Capsule()
                    .fill(TBColor.textHint)
                    .frame(
                        width: BottomSheetShellMetrics.grabberWidth,
                        height: BottomSheetShellMetrics.grabberHeight
                    )
                    .padding(.top, BottomSheetShellMetrics.grabberTopMargin)
                    .padding(.bottom, BottomSheetShellMetrics.grabberToHeaderSpacing)
                    .accessibilityHidden(true)

                if hasHeader {
                    header
                }

                content
                    .frame(
                        maxWidth: .infinity,
                        maxHeight: contentMaxHeight,
                        alignment: .topLeading
                    )

                if footer != nil || footerSafeAreaAccessory != nil {
                    VStack(spacing: 0) {
                        if let footer {
                            footer
                                .frame(maxWidth: .infinity)
                                .padding(.horizontal, footerHorizontalPadding)
                                .padding(.top, footerTopPadding)
                        }

                        Group {
                            if let footerSafeAreaAccessory {
                                footerSafeAreaAccessory
                                    .frame(maxWidth: .infinity)
                                    .padding(.horizontal, BottomSheetShellMetrics.footerHorizontalPadding)
                                    .padding(.top, BottomSheetShellMetrics.footerSafeAreaAccessoryTopGap)
                            } else {
                                Color.clear
                            }
                        }
                        .frame(
                            height: footerBottomPaddingOverride
                                ?? BottomSheetShellMetrics.footerSafeAreaHeight(
                                    safeAreaBottom: bottomSafeAreaInset,
                                    accessoryHeight: footerSafeAreaAccessory == nil
                                        ? nil
                                        : footerSafeAreaAccessoryHeight
                                ),
                            alignment: .top
                        )
                    }
                    .background(footerBackground ?? Color.clear)
                    .offset(y: -footerKeyboardOffset)
                    .animation(.easeOut(duration: 0.24), value: footerKeyboardOffset)
                }
            }
            .frame(maxWidth: usesNativeSheetChrome ? .infinity : BottomSheetShellMetrics.maxWidth)
            .frame(height: fixedStageHeight)
            .frame(maxHeight: automaticMaxHeight)
            .modifier(BottomSheetSurfaceChrome(usesNativeSheetChrome: usesNativeSheetChrome))

            if let floatingLayer {
                floatingLayer
            }
        }
    }

    private var bottomSafeAreaInset: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets
            .bottom ?? 0
    }

    private var topSafeAreaInset: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets
            .top ?? 0
    }

    private var fixedStageHeight: CGFloat? {
        guard stageMode == .fixed else {
            return nil
        }

        return BottomSheetShellMetrics.stageHeight(
            screenHeight: UIScreen.main.bounds.height,
            safeAreaTop: topSafeAreaInset
        )
    }

    private var automaticMaxHeight: CGFloat? {
        switch stageMode {
        case .fixed:
            return nil
        case .auto(let maxHeightRatio):
            return UIScreen.main.bounds.height * maxHeightRatio
        }
    }

    private var contentMaxHeight: CGFloat? {
        stageMode == .fixed ? .infinity : nil
    }

    private var hasHeader: Bool {
        headerStart != nil || headerCenter != nil || headerEnd != nil
    }

    private var header: some View {
        ZStack {
            HStack {
                (headerStart ?? AnyView(Color.clear))
                    .frame(
                        width: BottomSheetShellMetrics.headerSlotSize,
                        height: BottomSheetShellMetrics.headerSlotSize,
                        alignment: .leading
                    )

                Spacer()

                (headerEnd ?? AnyView(Color.clear))
                    .frame(
                        width: BottomSheetShellMetrics.headerSlotSize,
                        height: BottomSheetShellMetrics.headerSlotSize,
                        alignment: .trailing
                    )
            }

            if let headerCenter {
                headerCenter
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.horizontal, BottomSheetShellMetrics.headerHorizontalPadding)
        .padding(.bottom, BottomSheetShellMetrics.headerBottomPadding)
    }
}

private struct BottomSheetSurfaceChrome: ViewModifier {
    var usesNativeSheetChrome: Bool

    func body(content: Content) -> some View {
        Group {
            if usesNativeSheetChrome {
                content
                    .background(TBColor.focus)
                    .clipShape(BottomSheetTopRoundedShape(radius: BottomSheetShellMetrics.topRadius))
                    .background(alignment: .bottom) {
                        bottomSafeAreaFill
                    }
                    .ignoresSafeArea(edges: [.horizontal, .bottom])
            } else {
                content
                    .background(TBColor.focus)
                    .clipShape(BottomSheetTopRoundedShape(radius: BottomSheetShellMetrics.topRadius))
                    .background(alignment: .bottom) {
                        bottomSafeAreaFill
                    }
                    .ignoresSafeArea(edges: .bottom)
                    .shadow(color: Color.black.opacity(0.24), radius: 30, x: 0, y: 20)
            }
        }
    }

    private var bottomSafeAreaFill: some View {
        TBColor.focus
            .frame(height: bottomSafeAreaInset)
            .frame(maxWidth: .infinity)
            .offset(y: bottomSafeAreaInset)
            .ignoresSafeArea(edges: .bottom)
    }

    private var bottomSafeAreaInset: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets
            .bottom ?? 0
    }
}

extension View {
    func prefersUISheetGrabberVisible(_ isVisible: Bool = true) -> some View {
        configureUISheetPresentation(prefersGrabberVisible: isVisible)
    }

    func configureUISheetPresentation(
        customDetentIdentifier: UISheetPresentationController.Detent.Identifier? = nil,
        customDetentHeight: CGFloat? = nil,
        selectedDetentIdentifier: UISheetPresentationController.Detent.Identifier? = nil,
        includesLargeDetent: Bool = false,
        prefersGrabberVisible: Bool = true,
        preferredCornerRadius: CGFloat? = nil
    ) -> some View {
        background(
            UISheetPresentationConfigurator(
                customDetentIdentifier: customDetentIdentifier,
                customDetentHeight: customDetentHeight,
                selectedDetentIdentifier: selectedDetentIdentifier,
                includesLargeDetent: includesLargeDetent,
                prefersGrabberVisible: prefersGrabberVisible,
                preferredCornerRadius: preferredCornerRadius
            )
        )
    }
}

extension UISheetPresentationController.Detent.Identifier {
    static let tasteBuddyAuthEntry = Self("tastebuddy.authEntry")
    static let tasteBuddyBottomSheet = Self("tastebuddy.bottomSheet")
}

private struct UISheetPresentationConfigurator: UIViewControllerRepresentable {
    var customDetentIdentifier: UISheetPresentationController.Detent.Identifier?
    var customDetentHeight: CGFloat?
    var selectedDetentIdentifier: UISheetPresentationController.Detent.Identifier?
    var includesLargeDetent: Bool
    var prefersGrabberVisible: Bool
    var preferredCornerRadius: CGFloat?

    func makeUIViewController(context: Context) -> Controller {
        Controller(configuration: configuration)
    }

    func updateUIViewController(_ controller: Controller, context: Context) {
        controller.configuration = configuration
        controller.configureSheetPresentation()
    }

    private var configuration: Configuration {
        Configuration(
            customDetentIdentifier: customDetentIdentifier,
            customDetentHeight: customDetentHeight,
            selectedDetentIdentifier: selectedDetentIdentifier,
            includesLargeDetent: includesLargeDetent,
            prefersGrabberVisible: prefersGrabberVisible,
            preferredCornerRadius: preferredCornerRadius
        )
    }

    struct Configuration {
        var customDetentIdentifier: UISheetPresentationController.Detent.Identifier?
        var customDetentHeight: CGFloat?
        var selectedDetentIdentifier: UISheetPresentationController.Detent.Identifier?
        var includesLargeDetent: Bool
        var prefersGrabberVisible: Bool
        var preferredCornerRadius: CGFloat?
    }

    final class Controller: UIViewController {
        var configuration: Configuration

        init(configuration: Configuration) {
            self.configuration = configuration
            super.init(nibName: nil, bundle: nil)
            view.backgroundColor = .clear
            view.isUserInteractionEnabled = false
        }

        @available(*, unavailable)
        required init?(coder: NSCoder) {
            fatalError("init(coder:) has not been implemented")
        }

        override func viewDidAppear(_ animated: Bool) {
            super.viewDidAppear(animated)
            configureSheetPresentation()
        }

        override func viewDidLayoutSubviews() {
            super.viewDidLayoutSubviews()
            configureSheetPresentation()
        }

        func configureSheetPresentation() {
            DispatchQueue.main.async { [weak self] in
                guard let self else {
                    return
                }

                var candidate: UIViewController? = self
                while let controller = candidate {
                    if let sheet = controller.sheetPresentationController
                        ?? controller.presentationController as? UISheetPresentationController {
                        self.applyConfiguration(to: sheet)
                        return
                    }
                    candidate = controller.parent
                }
            }
        }

        private func applyConfiguration(to sheet: UISheetPresentationController) {
            let changes = { [configuration] in
                if let customDetentIdentifier = configuration.customDetentIdentifier,
                   let customDetentHeight = configuration.customDetentHeight {
                    let clampedHeight = max(1, customDetentHeight)
                    var detents: [UISheetPresentationController.Detent] = [
                        .custom(identifier: customDetentIdentifier) { _ in
                            clampedHeight
                        }
                    ]

                    if configuration.includesLargeDetent {
                        detents.append(.large())
                    }

                    sheet.detents = detents
                    sheet.selectedDetentIdentifier =
                        configuration.selectedDetentIdentifier ?? customDetentIdentifier
                } else if configuration.includesLargeDetent {
                    sheet.detents = [.large()]
                    sheet.selectedDetentIdentifier = .large
                }

                sheet.prefersGrabberVisible = configuration.prefersGrabberVisible

                if let preferredCornerRadius = configuration.preferredCornerRadius {
                    sheet.preferredCornerRadius = preferredCornerRadius
                }
            }

            if view.window == nil {
                changes()
            } else {
                sheet.animateChanges(changes)
            }
        }
    }
}
