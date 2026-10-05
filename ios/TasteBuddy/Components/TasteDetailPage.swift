import SwiftUI

/// Shared reading surface extracted from TasteChangeFocusView.
/// The route owns navigation/safe areas; each card supplies its own controls and content.
struct TasteDetailPage<Controls: View, Content: View>: View {
    @Environment(\.tasteDetailChrome) private var routeChrome
    @Environment(\.tbTopChromeInset) private var inheritedTopChromeInset
    @Environment(\.dismiss) private var dismiss
    let title: String
    var topChrome: AnyView? = nil
    var contentOffset: CGFloat? = nil
    private let controls: () -> Controls
    private let content: () -> Content

    init(title: String, topChrome: AnyView? = nil, contentOffset: CGFloat? = nil,
         @ViewBuilder controls: @escaping () -> Controls,
         @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.topChrome = topChrome
        self.contentOffset = contentOffset
        self.controls = controls
        self.content = content
    }

    @ViewBuilder
    var body: some View {
        if inheritedTopChromeInset == nil {
            page.tbScreenTopChrome()
        } else {
            page
        }
    }

    private var page: some View {
        TBCollapsingTopChromeScrollView(
            topChrome: topChrome ?? routeChrome?.header ?? AnyView(
                TopAppBar(appearance: .transparent, title: title, showBack: true,
                          showsDefaultActions: false, onBack: { dismiss() })
            ),
            contentOffset: contentOffset ?? routeChrome?.contentOffset ?? 0,
            pinnedHeader: {
                controls()
                    // Let the shared progressive backdrop blur through the pinned header.
                    .overlay(alignment: .bottom) { Rectangle().fill(TBColor.borderSubtle).frame(height: 0.5) }
            },
            content: content
        )
        .tbPageBackground()
        .accessibilityIdentifier("taste-detail-page")
    }
}

extension TasteDetailPage where Controls == EmptyView {
    init(title: String, @ViewBuilder content: @escaping () -> Content) {
        self.init(title: title, controls: { EmptyView() }, content: content)
    }
}

struct TasteDetailChrome {
    let header: AnyView?
    let contentOffset: CGFloat
    let onBack: () -> Void
}

private struct TasteDetailChromeKey: EnvironmentKey {
    static let defaultValue: TasteDetailChrome? = nil
}
private struct TasteDetailNavigateKey: EnvironmentKey {
    static let defaultValue: ((TasteCardDetailRoute) -> Void)? = nil
}
extension EnvironmentValues {
    var tasteDetailChrome: TasteDetailChrome? {
        get { self[TasteDetailChromeKey.self] }
        set { self[TasteDetailChromeKey.self] = newValue }
    }
    var tasteDetailNavigate: ((TasteCardDetailRoute) -> Void)? {
        get { self[TasteDetailNavigateKey.self] }
        set { self[TasteDetailNavigateKey.self] = newValue }
    }
}

/// Main-shell cards push AppRoute. Standalone previews/modal pickers get the same full page,
/// never a second bottom sheet. Clear the source selection before its view is unmounted.
private struct TasteDetailPresentation: ViewModifier {
    @Environment(\.tasteDetailNavigate) private var navigate
    @Binding var selection: TasteCardDetailRoute?
    @State private var standalone: TasteCardDetailRoute?

    func body(content: Content) -> some View {
        content
            .onChange(of: selection) { _, route in
                guard let route else { return }
                selection = nil
                if let navigate { navigate(route) }
                else { standalone = route }
            }
            .fullScreenCover(item: $standalone) { route in
                TasteDetailStandaloneHost(route: route)
                    .environment(\.tasteDetailNavigate, nil)
            }
    }
}
extension View {
    func tasteDetail(_ selection: Binding<TasteCardDetailRoute?>) -> some View {
        modifier(TasteDetailPresentation(selection: selection))
    }
}

private struct TasteDetailStandaloneHost: View {
    @Environment(\.dismiss) private var dismiss
    let route: TasteCardDetailRoute
    var body: some View {
        TasteCardDetailDestination(route: route)
            .environment(\.tasteDetailChrome, .init(
                header: AnyView(TopAppBar(appearance: .transparent, title: route.title,
                                         showBack: true, showsDefaultActions: false, onBack: { dismiss() })),
                contentOffset: 0, onBack: { dismiss() }
            ))
            .tbScreenTopChrome()
            .accessibilityAction(.escape) { dismiss() }
    }
}

/// Shared controls, not shared meaning: overview/evidence for a discovery,
/// distribution/records for a measurement, and period controls for taste change.
enum TasteDetailSection: String, CaseIterable, Identifiable {
    case overview, evidence
    var id: String { rawValue }
}
struct TasteDetailSectionPicker: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Binding var selection: TasteDetailSection
    var overviewTitle = "요약"
    var evidenceTitle = "기록"
    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                Picker("상세 보기", selection: $selection) {
                    Text(overviewTitle).tag(TasteDetailSection.overview)
                    Text(evidenceTitle).tag(TasteDetailSection.evidence)
                }.pickerStyle(.menu).frame(maxWidth: .infinity, minHeight: 44)
                    .padding(.horizontal, TBSpacing.page).padding(.bottom, TBSpacing.x12)
            } else {
                TBCapsuleTabs(options: TasteDetailSection.allCases, selection: $selection) { section in
                    section == .overview ? overviewTitle : evidenceTitle
                }
            }
        }
        .accessibilityIdentifier("taste-detail-sections")
    }
}

enum TasteDetailPeriod: Int, CaseIterable, Identifiable {
    case oneMonth = 1
    case threeMonths = 3
    case sixMonths = 6
    case oneYear = 12
    case all = 0

    var id: Int { rawValue }
    var title: String {
        switch self {
        case .oneMonth: "1개월"
        case .threeMonths: "3개월"
        case .sixMonths: "6개월"
        case .oneYear: "1년"
        case .all: "전체"
        }
    }

    func range(referenceDate: Date, calendar: Calendar = .current) -> (start: Date, end: Date)? {
        guard rawValue > 0 else { return nil }
        let day = calendar.startOfDay(for: referenceDate)
        guard let end = calendar.date(byAdding: .day, value: 1, to: day),
              let start = calendar.date(byAdding: .month, value: -rawValue, to: end) else { return nil }
        return (start, end)
    }

    func contains(_ date: Date, referenceDate: Date, calendar: Calendar = .current) -> Bool {
        guard let range = range(referenceDate: referenceDate, calendar: calendar) else { return date <= referenceDate }
        return date >= range.start && date < range.end
    }
}

struct TasteDetailPeriodPicker: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Binding var selection: TasteDetailPeriod
    var axis: TasteAxis? = nil

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                Picker("기간", selection: $selection) {
                    ForEach(TasteDetailPeriod.allCases) { period in Text(period.title).tag(period) }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: .infinity, minHeight: 44)
                .padding(.horizontal, TBSpacing.page)
                .padding(.bottom, TBSpacing.x12)
            } else if let axis {
                TBCapsuleTabs(
                    options: TasteDetailPeriod.allCases,
                    selection: $selection,
                    selectedForeground: axis.tintSurfaceTextColor,
                    selectedBackground: axis.tintColor,
                    selectedBorder: axis.tintSoftBorderColor
                ) { $0.title }
            } else {
                TBCapsuleTabs(options: TasteDetailPeriod.allCases, selection: $selection) { $0.title }
            }
        }
        .accessibilityIdentifier("taste-detail-periods")
    }
}

struct TasteDetailMetric: View {
    let label: String
    let value: String
    var accent = TBColor.textPrimary
    var labelColor: Color? = nil
    var background = TBColor.mutedSurface
    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x4) {
            Text(label).font(TBFont.semibold(11)).foregroundStyle(labelColor ?? TBColor.textHint)
            Text(value).font(TBFont.bold(14)).foregroundStyle(accent)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(TBSpacing.x12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(background, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct TasteDetailNote: View {
    let title: String
    let detail: String
    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x4) {
            Text(title).font(TBFont.semibold(12)).foregroundStyle(TBColor.textPrimary)
            Text(detail).font(TBFont.regular(12)).foregroundStyle(TBColor.textSubtle)
                .lineSpacing(3).fixedSize(horizontal: false, vertical: true)
        }
        .padding(TBSpacing.x12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TBColor.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(TBColor.borderSubtle, lineWidth: 1))
    }
}

/// One quiet surface for related values, rather than a card around every sentence.
struct TasteDetailGroup<Content: View>: View {
    private let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View {
        VStack(alignment: .leading, spacing: 0) { content }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TBColor.surface, in: RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
    }
}

struct TasteDetailValueRow: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let title: String
    let value: String
    var accent = TBColor.textPrimary
    var showsDivider = true
    var showsChevron = false
    var body: some View {
        VStack(spacing: 0) {
            if showsDivider { Divider().overlay(TBColor.borderSubtle).padding(.horizontal, TBSpacing.x16) }
            let layout = dynamicTypeSize.isAccessibilitySize
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: TBSpacing.x8))
                : AnyLayout(HStackLayout(alignment: .firstTextBaseline, spacing: TBSpacing.x12))
            layout {
                Text(title).font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                HStack(spacing: TBSpacing.x8) {
                    Text(value).font(TBFont.semibold(15)).foregroundStyle(accent)
                        .multilineTextAlignment(dynamicTypeSize.isAccessibilitySize ? .leading : .trailing)
                    if showsChevron {
                        Image(systemName: "chevron.right").font(TBFont.medium(11)).foregroundStyle(TBColor.textHint)
                    }
                }
            }
            .fixedSize(horizontal: false, vertical: true)
            .padding(.horizontal, TBSpacing.x16).padding(.vertical, TBSpacing.x12)
            .frame(minHeight: 52)
        }
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

/// Full-width white plotting area. No decorative goal, score, or percentage is invented.
struct TasteDetailChartPanel<Content: View>: View {
    private let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x16) { content }
            .padding(.horizontal, TBSpacing.page).padding(.vertical, TBSpacing.x20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TBColor.surface)
    }
}

/// Captions contain scope, not instructions about how to use the app.
struct TasteDetailScope: View {
    let text: String
    var body: some View {
        Text(text).font(TBFont.regular(11)).foregroundStyle(TBColor.textSecondary)
            .fixedSize(horizontal: false, vertical: true)
    }
}

/// Technical qualifications remain reachable, but do not precede the user's data.
struct TasteDetailDisclosure<Content: View>: View {
    let title: String
    private let content: Content
    init(_ title: String = "세부 정보", @ViewBuilder content: () -> Content) {
        self.title = title; self.content = content()
    }
    var body: some View {
        DisclosureGroup {
            VStack(alignment: .leading, spacing: TBSpacing.x8) { content }
                .font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true).padding(.top, TBSpacing.x8)
        } label: {
            Text(title).font(TBFont.medium(12)).frame(minHeight: 44)
        }.tint(TBColor.textSecondary)
    }
}

struct TasteDetailPlotPoint: Identifiable, Equatable {
    let id: String
    let label: String
    let value: Double?
    let valueLabel: String
    /// Unknown and invalid values are never converted into zero-height measurements.
    var plottedValue: Double? {
        guard let value, value.isFinite, value >= 0 else { return nil }
        return value
    }
}

struct TasteDetailBarPlot: View {
    let points: [TasteDetailPlotPoint]
    var accent = TBColor.textSecondary
    var height: CGFloat = 180
    private var maximum: Double { max(1, points.compactMap(\.plottedValue).max() ?? 1) }
    var body: some View {
        VStack(spacing: TBSpacing.x12) {
            HStack(alignment: .bottom, spacing: TBSpacing.x12) {
                ForEach(points) { point in
                    VStack(spacing: TBSpacing.x8) {
                        Text(point.plottedValue == nil ? "—" : point.valueLabel)
                            .font(TBFont.medium(11)).foregroundStyle(TBColor.textPrimary)
                            .fixedSize(horizontal: false, vertical: true)
                        GeometryReader { geometry in
                            if let value = point.plottedValue {
                                Capsule().fill(accent)
                                    .frame(width: 6, height: value == 0 ? 3 : max(3, geometry.size.height * CGFloat(value / maximum)))
                                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                            }
                        }.frame(height: height)
                    }.frame(maxWidth: .infinity)
                }
            }
            .background(alignment: .bottom) {
                VStack {
                    Rectangle().fill(TBColor.borderSubtle).frame(height: 0.5)
                    Spacer()
                    Rectangle().fill(TBColor.borderSubtle).frame(height: 0.5)
                    Spacer()
                    Rectangle().fill(TBColor.borderSubtle).frame(height: 0.5)
                }.frame(height: height).accessibilityHidden(true)
            }
            HStack(alignment: .top, spacing: TBSpacing.x12) {
                ForEach(points) { point in
                    Text(point.label).font(TBFont.regular(11)).foregroundStyle(TBColor.textSecondary)
                        .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(points.map { "\($0.label), \($0.plottedValue == nil ? "미확인" : $0.valueLabel)" }.joined(separator: "; "))
    }
}

#Preview("공통 카드 상세 · 빈 데이터") {
    @Previewable @State var period: TasteDetailPeriod = .threeMonths
    TasteDetailPage(title: "측정 데이터") {
        TasteDetailPeriodPicker(selection: $period)
    } content: {
        VStack(spacing: TBSpacing.x20) {
            TasteDetailChartPanel {
                TasteDetailScope(text: period.title + " · 지각 강도")
                TasteDetailBarPlot(points: ["약", "중", "강"].map {
                    .init(id: $0, label: $0, value: nil, valueLabel: "—")
                })
            }
            TasteDetailGroup {
                TasteDetailValueRow(title: "최근", value: "—", showsDivider: false)
                TasteDetailValueRow(title: "이전", value: "—")
            }.padding(.horizontal, TBSpacing.page)
        }.padding(.bottom, TBSpacing.page)
    }
    .tbScreenTopChrome()
}
