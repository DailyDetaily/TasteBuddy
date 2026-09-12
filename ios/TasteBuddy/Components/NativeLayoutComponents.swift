import SwiftUI

/// Wraps views at their rendered natural width; unlike `TBFlowLayout`, it does not
/// allocate equal-width adaptive grid columns.
struct TBWrapLayout: Layout {
    let spacing: CGFloat

    func sizeThatFits(
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) -> CGSize {
        let arrangement = TBWrapArrangement(
            sizes: subviews.map { $0.sizeThatFits(.unspecified) },
            availableWidth: proposal.width,
            spacing: spacing
        )
        return arrangement.size
    }

    func placeSubviews(
        in bounds: CGRect,
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) {
        let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
        let arrangement = TBWrapArrangement(
            sizes: sizes,
            availableWidth: bounds.width,
            spacing: spacing
        )

        for (index, subview) in subviews.enumerated() {
            let origin = arrangement.origins[index]
            subview.place(
                at: CGPoint(x: bounds.minX + origin.x, y: bounds.minY + origin.y),
                proposal: ProposedViewSize(sizes[index])
            )
        }
    }
}

/// One calculation is shared by measurement and placement so mixed-height rows
/// and exact-width fits cannot disagree between the two layout passes.
struct TBWrapArrangement {
    let size: CGSize
    let origins: [CGPoint]

    init(sizes: [CGSize], availableWidth: CGFloat?, spacing: CGFloat) {
        let proposedWidth = availableWidth.flatMap { $0.isFinite ? max(0, $0) : nil }
        let widthLimit = proposedWidth ?? .greatestFiniteMagnitude
        let gap = max(0, spacing)
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var contentWidth: CGFloat = 0
        var positions: [CGPoint] = []

        for item in sizes {
            // An oversized first item stays on its own row; do not add a blank row.
            if x > 0 && x + item.width > widthLimit {
                x = 0
                y += rowHeight + gap
                rowHeight = 0
            }

            positions.append(CGPoint(x: x, y: y))
            contentWidth = max(contentWidth, x + item.width)
            x += item.width + gap
            rowHeight = max(rowHeight, item.height)
        }

        size = CGSize(width: proposedWidth ?? contentWidth, height: y + rowHeight)
        origins = positions
    }
}

/// Keeps the longest leading prefix that fits, including the actual `+N` chip.
/// Chip size and accessible descriptions remain the caller's responsibility.
struct TBOverflowTagRow<Item: Identifiable, Tag: View, Overflow: View>: View {
    let items: [Item]
    let spacing: CGFloat
    private let tag: (Item) -> Tag
    private let overflow: (Int) -> Overflow

    init(
        items: [Item],
        spacing: CGFloat = 6,
        @ViewBuilder tag: @escaping (Item) -> Tag,
        @ViewBuilder overflow: @escaping (Int) -> Overflow
    ) {
        self.items = items
        self.spacing = spacing
        self.tag = tag
        self.overflow = overflow
    }

    var body: some View {
        ViewThatFits(in: .horizontal) {
            ForEach(Array((0...items.count).reversed()), id: \.self) { visibleCount in
                HStack(spacing: spacing) {
                    ForEach(Array(items.prefix(visibleCount))) { item in
                        tag(item)
                    }

                    if visibleCount < items.count {
                        overflow(items.count - visibleCount)
                    }
                }
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct TBFlowLoadingState: View {
    let message: String
    var background: Color = TBColor.focus

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text(message)
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textBody)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background)
        .accessibilityElement(children: .combine)
    }
}

struct TBFlowRetryState: View {
    let title: String
    let message: String
    var retryTitle = "다시 시도"
    var background: Color = TBColor.focus
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.section) {
            SectionHeading(title: title, subtitle: message)
            PrimaryButton(title: retryTitle, action: retry)
        }
        .tbPageContentPadding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background)
    }
}

#if canImport(PreviewsMacros)
    #Preview("Natural width tags") {
        VStack(alignment: .leading, spacing: 24) {
            TBWrapLayout(spacing: 6) {
                ForEach(TasteAxis.allCases) { axis in
                    TasteChip(title: axis.label, tone: .taste, colorAxis: axis, size: .sm)
                }
            }

            TBOverflowTagRow(items: TasteAxis.allCases) { axis in
                TasteChip(title: axis.label, tone: .neutral, size: .sm)
            } overflow: { count in
                TasteChip(title: "+\(count)", tone: .neutral, size: .sm)
                    .accessibilityLabel("\(count)개 태그 더 있음")
            }
        }
        .frame(width: 220)
        .padding(TBSpacing.page)
        .background(TBColor.page)
    }

    #Preview("Survey loading") {
        TBFlowLoadingState(message: "미각 설문을 준비하고 있어요")
    }

    #Preview("Survey retry") {
        TBFlowRetryState(
            title: "미각 설문을 불러오지 못했어요",
            message: "잠시 후 다시 시도해 주세요.",
            retry: {}
        )
    }
#endif
