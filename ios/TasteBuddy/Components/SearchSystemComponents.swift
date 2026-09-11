import SwiftUI

enum SearchOverlayShellMetrics {
    static let fieldHeight: CGFloat = 44
    static let iconButtonSize: CGFloat = 44
    static let headerHorizontalPadding: CGFloat = 20
    static let headerTopPadding: CGFloat = TBSpacing.pageTop
    static let headerBottomPadding: CGFloat = TBSpacing.x8
    static let headerGap: CGFloat = 8
    static let bodyTopPadding: CGFloat = TBSpacing.pageTop
    static let bodyBottomPadding: CGFloat = 32
}

struct SearchOverlayShell<Content: View>: View {
    let accessibilityLabel: String
    let placeholder: String
    @Binding var query: String
    let onSubmit: () -> Void
    let onClose: () -> Void
    private let content: Content

    @FocusState private var isSearchFocused: Bool

    init(
        accessibilityLabel: String = "통합 검색",
        placeholder: String,
        query: Binding<String>,
        onSubmit: @escaping () -> Void,
        onClose: @escaping () -> Void,
        @ViewBuilder content: () -> Content
    ) {
        self.accessibilityLabel = accessibilityLabel
        self.placeholder = placeholder
        _query = query
        self.onSubmit = onSubmit
        self.onClose = onClose
        self.content = content()
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                content
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, SearchOverlayShellMetrics.headerHorizontalPadding)
                    .padding(.top, SearchOverlayShellMetrics.bodyTopPadding)
                    .padding(.bottom, SearchOverlayShellMetrics.bodyBottomPadding)
            }
            .scrollIndicators(.hidden)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(TBColor.page.ignoresSafeArea())
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                isSearchFocused = true
            }
        }
    }

    private var header: some View {
        HStack(spacing: SearchOverlayShellMetrics.headerGap) {
            searchField

            Button(action: onSubmit) {
                LucideIcon(
                    .search,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(
                    width: SearchOverlayShellMetrics.iconButtonSize,
                    height: SearchOverlayShellMetrics.iconButtonSize
                )
                .foregroundStyle(TBColor.textSecondary)
                .background(TBColor.mutedSurface)
                .clipShape(Circle())
                .overlay {
                    Circle().stroke(TBColor.border)
                }
            }
            .buttonStyle(TBTokenButtonStyle())
            .accessibilityLabel("검색 실행")

            Button("취소", action: onClose)
                .font(TBFont.semibold(13))
                .foregroundStyle(TBColor.textBody)
                .frame(height: SearchOverlayShellMetrics.iconButtonSize)
                .contentShape(Rectangle())
                .buttonStyle(TBTokenButtonStyle())
        }
        .padding(.horizontal, SearchOverlayShellMetrics.headerHorizontalPadding)
        .padding(.top, SearchOverlayShellMetrics.headerTopPadding)
        .padding(.bottom, SearchOverlayShellMetrics.headerBottomPadding)
        .background(TBColor.page.opacity(0.95).ignoresSafeArea(edges: .top))
    }

    private var searchField: some View {
        TextField(placeholder, text: $query)
            .font(TBFont.medium(13))
            .foregroundStyle(TBColor.textPrimary)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .submitLabel(.search)
            .focused($isSearchFocused)
            .onSubmit(onSubmit)
            .accessibilityLabel(accessibilityLabel)
            .frame(height: SearchOverlayShellMetrics.fieldHeight)
            .padding(.horizontal, 16)
            .background(TBColor.mutedSurface)
            .clipShape(Capsule())
            .overlay {
                Capsule().stroke(TBColor.border)
            }
    }
}

enum CompactCardMetrics {
    static let padding: CGFloat = 12
    static let gap: CGFloat = 12
    static let actionGap: CGFloat = 0
    static let radius: CGFloat = 20
    static let mediaSize: CGFloat = 40
    static let actionButtonSize: CGFloat = TBIcon.Container.medium
    static let actionIconSize: CGFloat = TBIcon.Size.medium
}

enum SearchResultCompactCardMetrics {
    static let actionButtonSize: CGFloat = TBIcon.Container.large
    static let actionIconSize: CGFloat = TBIcon.Size.large
}

struct CompactCard<Media: View, Actions: View>: View {
    let heading: String
    var metadata: String?
    var isSelected = false
    var action: (() -> Void)?
    private let media: Media
    private let actions: Actions

    init(
        heading: String,
        metadata: String? = nil,
        isSelected: Bool = false,
        action: (() -> Void)? = nil,
        @ViewBuilder media: () -> Media,
        @ViewBuilder actions: () -> Actions
    ) {
        self.heading = heading
        self.metadata = metadata
        self.isSelected = isSelected
        self.action = action
        self.media = media()
        self.actions = actions()
    }

    var body: some View {
        cardContent
    }

    private var cardContent: some View {
        ZStack {
            if let action {
                Button(action: action) {
                    Color.clear
                        .frame(maxWidth: .infinity)
                        .frame(
                            height: CompactCardMetrics.mediaSize
                                + CompactCardMetrics.padding * 2
                        )
                        .contentShape(
                            RoundedRectangle(
                                cornerRadius: CompactCardMetrics.radius,
                                style: .continuous
                            )
                        )
                }
                .buttonStyle(.plain)
                .accessibilityLabel(heading)
                .accessibilityHint(metadata ?? "")
            }

            HStack(spacing: CompactCardMetrics.gap) {
                mainContent
                    .allowsHitTesting(action == nil)

                actions
                    .fixedSize()
            }
            .padding(CompactCardMetrics.padding)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(isSelected ? TBColor.mutedSurface : TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: CompactCardMetrics.radius, style: .continuous))
        .contentShape(RoundedRectangle(cornerRadius: CompactCardMetrics.radius, style: .continuous))
        .accessibilityElement(children: action == nil ? .combine : .contain)
        .tasteBloomMotion(.feedback, value: isSelected)
    }

    private var mainContent: some View {
        HStack(spacing: CompactCardMetrics.gap) {
            media
                .frame(
                    width: CompactCardMetrics.mediaSize,
                    height: CompactCardMetrics.mediaSize
                )
                .fixedSize()

            VStack(alignment: .leading, spacing: 3) {
                Text(heading)
                    .font(TBFont.semibold(14))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineLimit(1)

                if let metadata {
                    Text(metadata)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension CompactCard where Actions == EmptyView {
    init(
        heading: String,
        metadata: String? = nil,
        isSelected: Bool = false,
        action: (() -> Void)? = nil,
        @ViewBuilder media: () -> Media
    ) {
        self.init(
            heading: heading,
            metadata: metadata,
            isSelected: isSelected,
            action: action,
            media: media,
            actions: { EmptyView() }
        )
    }
}

struct CompactCardIconActionButton: View {
    let symbol: LucideIconName
    var isActive = false
    var filled = false
    let accessibilityLabel: String
    var actionButtonSize = CompactCardMetrics.actionButtonSize
    var actionIconSize = CompactCardMetrics.actionIconSize
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            LucideIcon(
                symbol,
                size: actionIconSize,
                strokeWidth: TBIcon.Stroke.regular,
                filled: filled || isActive
            )
            .tasteBloomReplace(value: filled || isActive)
            .frame(
                width: actionButtonSize,
                height: actionButtonSize
            )
            .foregroundStyle(TBColor.textSecondary)
            .contentShape(Rectangle())
        }
        .buttonStyle(TBTokenButtonStyle())
        .accessibilityLabel(accessibilityLabel)
    }
}
