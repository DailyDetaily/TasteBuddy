import SwiftUI
import UIKit

enum TBThemePreference: String, CaseIterable {
    case system, light, dark

    static let storageKey = "tb-color-mode-preference"

    var title: String {
        switch self {
        case .system: return "시스템"
        case .light: return "라이트"
        case .dark: return "다크"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

private struct TBSystemColorSchemeKey: EnvironmentKey {
    static let defaultValue: ColorScheme = .light
}

extension EnvironmentValues {
    var tbSystemColorScheme: ColorScheme {
        get { self[TBSystemColorSchemeKey.self] }
        set { self[TBSystemColorSchemeKey.self] = newValue }
    }
}

/// Plating sheet presentation: the surface and its presenting screen share progress.
enum TBSheetPresentation {
    enum Background {
        static let scale: CGFloat = 0.9
        static let offsetY: CGFloat = 10
        static let radius: CGFloat = 20
        static let dimOpacity: CGFloat = 0.6
        static let shadowY: CGFloat = 0
        static let shadowBlur: CGFloat = 0
        static let shadowOpacity: CGFloat = 0
    }

    enum Surface {
        static let heightRatio: CGFloat = 0.98
        static let topInset: CGFloat = 12
        static let radius: CGFloat = 32
        static let grabberWidth: CGFloat = 36
        static let grabberHeight: CGFloat = 5
    }

    enum Drag {
        static let minimumDistance: CGFloat = 6
        static let dismissProgress: CGFloat = 0.32
    }
}

enum TBLightColor {
    static let page = Color(hex: 0xF3F3F3)
    static let focus = Color.white
    static let surface = Color.white
    static let surfaceHover = Color(hex: 0xFAFAFA)
    static let mutedSurface = Color(hex: 0xF7F7F7)
    static let elevatedSurface = Color(hex: 0xFCFCFC)
    static let disabledSurface = Color(hex: 0xEFEFEF)
    static let placeholderSurface = Color(hex: 0xEFEFEF)
    static let inverseSurface = Color(hex: 0x0F0F0F)
    static let overlaySurface = Color.white.opacity(0.8)
    static let textPrimary = Color(hex: 0x0F0F0F)
    static let textSecondary = Color(hex: 0x3F3F3F)
    static let textTertiary = Color(hex: 0x535353)
    static let textBody = Color(hex: 0x666666)
    /// Readable auxiliary actions; disabled controls keep their separate state color.
    static let textAction = textBody
    static let textHint = Color(hex: 0x6F6F6F)
    static let textDisabled = Color(hex: 0xAFAFAF)
    static let textSubtle = Color(hex: 0x0F0F0F, alpha: 0.60)
    static let textMuted = Color(hex: 0x0F0F0F, alpha: 0.50)
    static let textFaint = Color(hex: 0x0F0F0F, alpha: 0.40)
    static let textInverse = Color.white
    static let borderCard = Color(hex: 0xF0F0F0)
    static let borderSubtle = Color(hex: 0xE8E8E8)
    static let border = Color(hex: 0xE7E7E7)
    static let borderStrong = Color(hex: 0xE5E5E5)
    static let borderDisabled = Color(hex: 0xE0E0E0)
    static let borderAvatar = Color(hex: 0x0F0F0F, alpha: 0.20)
    static let borderAvatarSoft = Color(hex: 0x0F0F0F, alpha: 0.15)
    static let iconPrimary = Color(hex: 0x3F3F3F)
    static let iconHover = Color(hex: 0x6F6F6F)
    static let iconMuted = Color(hex: 0xAFAFAF)
    static let neutral = Color(hex: 0x3F3F3F)
    static let neutralSoft = Color(hex: 0xEFEFEF)
    static let informative = Color(hex: 0x3F3F3F)
    static let informativeSoft = Color(hex: 0xF7F7F7)
    static let success = Color(hex: 0x2F8F5B)
    static let successText = Color(hex: 0x236B45)
    static let successStrong = Color(hex: 0x236B45)
    static let successSoft = Color(hex: 0xE6F4EC)
    static let warning = Color(hex: 0xA8661A)
    static let warningText = Color(hex: 0x875014)
    static let warningStrong = Color(hex: 0x875014)
    static let warningSoft = Color(hex: 0xFFF1DE)
    static let destructive = Color(hex: 0xD4183D)
    static let destructiveText = Color(hex: 0xB31333)
    static let destructiveSoft = Color(hex: 0xFCEDEF)
    static let actionPrimary = Color(hex: 0x0F0F0F)
    static let actionOnPrimary = Color.white
    static let selectionSurface = Color(hex: 0x0F0F0F)
    static let selectionText = Color.white
    static let focusRing = Color(hex: 0x3F3F3F)
    static let hoverOverlay = Color.black.opacity(0.04)
    static let pressedOverlay = Color.black.opacity(0.06)
    static let pressedInverseOverlay = Color.white.opacity(0.10)
    static let scrimSubtle = Color.black.opacity(0.35)
    static let scrimDefault = Color.black.opacity(0.50)
    static let scrimStrong = Color.black.opacity(0.60)
}

enum TBSpacing {
    static let x2: CGFloat = 2
    static let x4: CGFloat = 4
    static let x6: CGFloat = 6
    static let x8: CGFloat = 8
    static let x10: CGFloat = 10
    static let x12: CGFloat = 12
    static let x16: CGFloat = 16
    static let x20: CGFloat = 20
    static let x24: CGFloat = 24
    static let x40: CGFloat = 40
    static let page: CGFloat = 20
    static let pageTop: CGFloat = 8
    static var mainTabContentBottom: CGFloat { TBSize.bottomTabBarHeight + x12 }
    static let section: CGFloat = 20
    static let card: CGFloat = 12
}

enum TBRadius {
    static let badge: CGFloat = 6
    static let icon: CGFloat = 8
    static let chip: CGFloat = 999
    static let control: CGFloat = 10
    static let row: CGFloat = 12
    static let support: CGFloat = 14
    static let card: CGFloat = 20
    static let media: CGFloat = 24
    static let full: CGFloat = 9999
}

enum TBSize {
    static let screenMaxWidth: CGFloat = 1440
    static let topAppBarHeight: CGFloat = 32
    static let bottomTabBarHeight: CGFloat = 60
    static let primaryButtonHeight: CGFloat = 48
    static let bottomFadeMinHeight: CGFloat = 140
    static let bottomIndicatorWidth: CGFloat = 134
    static let chromeIconButton: CGFloat = 40
    static let tasteLoopSize: CGFloat = 320
    static let tasteLoopGuideDotDiameter: CGFloat = 1
    static let tasteLoopGuideDotGap: CGFloat = 3
    static let tasteLoopGuideRadius: CGFloat = 138
    static let tasteLoopLabelOffset: CGFloat = 4
    static let tasteLoopNodeRadius: CGFloat = 12
    static let tasteLoopOuterRingInset: CGFloat = 10
    static let tasteLoopOuterRingThickness: CGFloat = 24
    static let tasteLoopRingRadius: CGFloat = 138
    static let tasteLoopStepCount: Int = 10
}

enum TBTypography {
    enum FontSize {
        static let x10: CGFloat = 10
        static let x11: CGFloat = 11
        static let x12: CGFloat = 12
        static let x13: CGFloat = 13
        static let x14: CGFloat = 14
        static let x15: CGFloat = 15
        static let x16: CGFloat = 16
        static let x18: CGFloat = 18
        static let x20: CGFloat = 18
        static let x22: CGFloat = 18
        static let x24: CGFloat = 18
        static let x28: CGFloat = 18
    }

    enum Weight {
        static let regular = 400
        static let medium = 500
        static let semibold = 600
        static let bold = 700
    }

    enum LineHeight {
        static let tight: CGFloat = 1.2
        static let snug: CGFloat = 1.35
        static let normal: CGFloat = 1.4
        static let relaxed: CGFloat = 1.5
    }

    enum LetterSpacing {
        static let tight: CGFloat = -0.24
        static let micro: CGFloat = 0.14
        static let none: CGFloat = 0
    }
}

enum TBShadow {
    static let hover = ShadowToken(color: Color(hex: 0x0F0F0F).opacity(0.06), radius: 3, x: 0, y: 1)
    static let soft = ShadowToken(color: Color.black.opacity(0.10), radius: 20, x: 0, y: 4)
    static let strong = ShadowToken(color: Color(hex: 0x0F0F0F).opacity(0.12), radius: 32, x: 0, y: 12)
    static let button = ShadowToken(color: Color.black.opacity(0.10), radius: 20, x: 0, y: 8)
    static let drawer = ShadowToken(color: Color.black.opacity(0.24), radius: 60, x: 0, y: 20)
}

struct ShadowToken {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
}

typealias TBMotion = TasteBloomMotion

enum TBDataViz {
    enum Progress {
        static let barHeight: CGFloat = 8
        static let track = TBColor.borderSubtle
    }

    enum Radar {
        static let size: CGFloat = 320
        static let grid = TBColor.borderSubtle
        static let averageFill = Color(hex: 0xF0F0F0, alpha: 0.60)
        static let averageStroke = Color(hex: 0xD0D0D0)
        static let highlightFill = Color(hex: 0xFF9900, alpha: 0.12)
        static let highlightStroke = Color(hex: 0xFF9900)
        static let labelSize: CGFloat = 10
        static let labelColor = TBColor.textHint
        static let nodeSize: CGFloat = 3
        static let outerDotSize: CGFloat = 8
    }

    enum Trend {
        static let lineStrokeWidth: CGFloat = 1
        static let dotSize: CGFloat = 4
        static let activeDotSize: CGFloat = 5
    }

    enum Ring {
        static let outerSize: CGFloat = 320
        static let innerNodeRadius: CGFloat = 12
        static let stepCount = 10
        static let outerRingThickness: CGFloat = 24
        static let guideDotSize: CGFloat = 1
        static let stepPulses = 1
    }
}

enum TBFont {
    static func regular(_ size: CGFloat) -> Font {
        .custom("Pretendard-Regular", size: min(size, 18))
    }

    static func medium(_ size: CGFloat) -> Font {
        .custom("Pretendard-Medium", size: min(size, 18))
    }

    static func semibold(_ size: CGFloat) -> Font {
        .custom("Pretendard-SemiBold", size: min(size, 18))
    }

    static func bold(_ size: CGFloat) -> Font {
        .custom("Pretendard-Bold", size: min(size, 18))
    }
}

/// Native text recipes keep the existing base sizes and Pretendard scaling.
/// Content-specific line limits belong to the component, not the type role.
enum TBTextStyle {
    case sectionTitle, subsectionTitle, sheetTitle, body, caption, detailAction
    case control, compactControl, cardLabel, supporting, tasteContext, tasteTitle, primaryButton, topBarTitle

    var font: Font {
        .custom(metrics.font, size: metrics.size)
    }

    var color: Color {
        switch self {
        case .sectionTitle, .subsectionTitle, .sheetTitle: TBColor.textPrimary
        case .body, .caption: TBColor.textBody
        case .detailAction: TBColor.textAction
        case .supporting: TBColor.textFaint
        case .control, .compactControl, .cardLabel, .tasteContext, .tasteTitle, .primaryButton, .topBarTitle:
            TBColor.textPrimary
        }
    }

    var lineSpacing: CGFloat {
        switch self {
        case .body: 4
        case .caption: 3
        default: 0
        }
    }

    /// The Figma role is a single recipe, not independent per-screen font overrides.
    var figmaRole: String? {
        switch self {
        case .control: "Product/Control"
        case .compactControl: "Product/Compact"
        case .cardLabel: "Product/Card/Label"
        case .supporting: "Product/Supporting"
        case .tasteContext: "Component/TasteExperience/Context"
        case .tasteTitle: "Component/TasteExperience/Title"
        case .primaryButton: "Component/PrimaryButton/Label"
        case .topBarTitle: "Product/TopBar Title"
        default: nil
        }
    }

    private var metrics: (font: String, size: CGFloat, lineHeight: CGFloat?) {
        switch self {
        case .sectionTitle: ("Pretendard-Bold", 18, nil)
        case .subsectionTitle: ("Pretendard-Bold", 16, nil)
        case .sheetTitle: ("Pretendard-Bold", 15, nil)
        case .body: ("Pretendard-Regular", 14, nil)
        case .caption: ("Pretendard-SemiBold", 12, nil)
        case .detailAction: ("Pretendard-Medium", 11, nil)
        case .control: ("Pretendard-Medium", 14, 20)
        case .compactControl: ("Pretendard-Medium", 12, 18)
        case .cardLabel: ("Pretendard-Bold", 14, 20)
        case .supporting: ("Pretendard-Medium", 11, 16)
        case .tasteContext: ("Pretendard-SemiBold", 11, 16)
        case .tasteTitle: ("Pretendard-Bold", 17, 23)
        case .primaryButton: ("Pretendard-SemiBold", 14, 20)
        case .topBarTitle: ("Pretendard-Bold", 15, 22)
        }
    }

    var fixedLineHeight: CGFloat? { metrics.lineHeight }

    var additionalLeading: CGFloat {
        guard let lineHeight = metrics.lineHeight,
              let font = UIFont(name: metrics.font, size: metrics.size) else { return 0 }
        return max(0, lineHeight - font.lineHeight)
    }
}

/// Line spacing alone does not set a one-line label's height. Add the remaining
/// leading around the text, and scale it with the same Dynamic Type reference.
private struct TBTypographyModifier: ViewModifier {
    let style: TBTextStyle
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1

    func body(content: Content) -> some View {
        let leading = style.additionalLeading * scale
        content
            .font(style.font)
            .lineSpacing(style.fixedLineHeight == nil ? style.lineSpacing : leading)
            .padding(.vertical, leading / 2)
    }
}

private struct TBOptionalTypographyModifier: ViewModifier {
    let style: TBTextStyle?

    @ViewBuilder
    func body(content: Content) -> some View {
        if let style { content.modifier(TBTypographyModifier(style: style)) }
        else { content }
    }
}

extension Color {
    /// Keep role names stable while UIKit resolves the current appearance.
    static func tbAdaptive(light: Color, dark: Color) -> Color {
        let lightColor = UIColor(light).resolvedColor(with: UITraitCollection(userInterfaceStyle: .light))
        let darkColor = UIColor(dark).resolvedColor(with: UITraitCollection(userInterfaceStyle: .dark))
        return Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? darkColor : lightColor
        })
    }

    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }

    init(hexRGBA: UInt) {
        self.init(
            hex: (hexRGBA >> 8) & 0xFF_FFFF,
            alpha: Double(hexRGBA & 0xFF) / 255
        )
    }
}

extension View {
    func tbTypography(_ style: TBTextStyle?) -> some View {
        modifier(TBOptionalTypographyModifier(style: style))
    }

    func tbTextStyle(_ style: TBTextStyle) -> some View {
        modifier(TBTypographyModifier(style: style))
            .foregroundStyle(style.color)
    }

    func tbPageBackground(_ color: Color = TBColor.page) -> some View {
        background(color.ignoresSafeArea())
    }

    func tbPageContentPadding(bottom: CGFloat = TBSpacing.page) -> some View {
        padding(.horizontal, TBSpacing.page)
            .padding(.top, TBSpacing.pageTop)
            .padding(.bottom, bottom)
    }

    @ViewBuilder
    func tbInlineNavigationTitle() -> some View {
        #if os(iOS)
            navigationBarTitleDisplayMode(.inline)
        #else
            self
        #endif
    }

    @ViewBuilder
    func tbPagingTabStyle() -> some View {
        #if os(iOS)
            tabViewStyle(.page(indexDisplayMode: .never))
        #else
            tabViewStyle(.automatic)
        #endif
    }
}

// BEGIN GENERATED COLOR MODES
// Generated by scripts/build-color-modes.mjs. Semantic colors follow the active UIKit appearance.
enum TBColor {
    static let chartOnBrightFill = Color(hex: 0x0F0F0F)
    static let chartComparisonTrack = Color.tbAdaptive(light: Color(hex: 0x666666, alpha: 0.18), dark: Color(hex: 0x454545))
    static let chartRemainder = Color.tbAdaptive(light: Color(hex: 0xE4E4E4), dark: Color(hex: 0xA3A3A3))
    static let page = Color.tbAdaptive(light: TBLightColor.page, dark: TBDarkColor.page)
    static let focus = Color.tbAdaptive(light: TBLightColor.focus, dark: TBDarkColor.focus)
    static let surface = Color.tbAdaptive(light: TBLightColor.surface, dark: TBDarkColor.surface)
    static let surfaceHover = Color.tbAdaptive(light: TBLightColor.surfaceHover, dark: TBDarkColor.surfaceHover)
    static let mutedSurface = Color.tbAdaptive(light: TBLightColor.mutedSurface, dark: TBDarkColor.mutedSurface)
    static let elevatedSurface = Color.tbAdaptive(light: TBLightColor.elevatedSurface, dark: TBDarkColor.elevatedSurface)
    static let disabledSurface = Color.tbAdaptive(light: TBLightColor.disabledSurface, dark: TBDarkColor.disabledSurface)
    static let overlaySurface = Color.tbAdaptive(light: TBLightColor.overlaySurface, dark: TBDarkColor.overlaySurface)
    static let placeholderSurface = Color.tbAdaptive(light: TBLightColor.placeholderSurface, dark: TBDarkColor.placeholderSurface)
    static let inverseSurface = Color.tbAdaptive(light: TBLightColor.inverseSurface, dark: TBDarkColor.inverseSurface)
    static let actionPrimary = Color.tbAdaptive(light: TBLightColor.actionPrimary, dark: TBDarkColor.actionPrimary)
    static let actionOnPrimary = Color.tbAdaptive(light: TBLightColor.actionOnPrimary, dark: TBDarkColor.actionOnPrimary)
    static let selectionSurface = Color.tbAdaptive(light: TBLightColor.selectionSurface, dark: TBDarkColor.selectionSurface)
    static let selectionText = Color.tbAdaptive(light: TBLightColor.selectionText, dark: TBDarkColor.selectionText)
    static let focusRing = Color.tbAdaptive(light: TBLightColor.focusRing, dark: TBDarkColor.focusRing)
    static let hoverOverlay = Color.tbAdaptive(light: TBLightColor.hoverOverlay, dark: TBDarkColor.hoverOverlay)
    static let pressedOverlay = Color.tbAdaptive(light: TBLightColor.pressedOverlay, dark: TBDarkColor.pressedOverlay)
    static let pressedInverseOverlay = Color.tbAdaptive(light: TBLightColor.pressedInverseOverlay, dark: TBDarkColor.pressedInverseOverlay)
    static let textPrimary = Color.tbAdaptive(light: TBLightColor.textPrimary, dark: TBDarkColor.textPrimary)
    static let textSecondary = Color.tbAdaptive(light: TBLightColor.textSecondary, dark: TBDarkColor.textSecondary)
    static let textTertiary = Color.tbAdaptive(light: TBLightColor.textTertiary, dark: TBDarkColor.textTertiary)
    static let textBody = Color.tbAdaptive(light: TBLightColor.textBody, dark: TBDarkColor.textBody)
    static let textAction = Color.tbAdaptive(light: TBLightColor.textAction, dark: TBDarkColor.textAction)
    static let textHint = Color.tbAdaptive(light: TBLightColor.textHint, dark: TBDarkColor.textHint)
    static let textDisabled = Color.tbAdaptive(light: TBLightColor.textDisabled, dark: TBDarkColor.textDisabled)
    static let textInverse = Color.tbAdaptive(light: TBLightColor.textInverse, dark: TBDarkColor.textInverse)
    static let textSubtle = Color.tbAdaptive(light: TBLightColor.textSubtle, dark: TBDarkColor.textSubtle)
    static let textMuted = Color.tbAdaptive(light: TBLightColor.textMuted, dark: TBDarkColor.textMuted)
    static let textFaint = Color.tbAdaptive(light: TBLightColor.textFaint, dark: TBDarkColor.textFaint)
    static let borderCard = Color.tbAdaptive(light: TBLightColor.borderCard, dark: TBDarkColor.borderCard)
    static let borderSubtle = Color.tbAdaptive(light: TBLightColor.borderSubtle, dark: TBDarkColor.borderSubtle)
    static let border = Color.tbAdaptive(light: TBLightColor.border, dark: TBDarkColor.border)
    static let borderStrong = Color.tbAdaptive(light: TBLightColor.borderStrong, dark: TBDarkColor.borderStrong)
    static let borderDisabled = Color.tbAdaptive(light: TBLightColor.borderDisabled, dark: TBDarkColor.borderDisabled)
    static let borderAvatar = Color.tbAdaptive(light: TBLightColor.borderAvatar, dark: TBDarkColor.borderAvatar)
    static let borderAvatarSoft = Color.tbAdaptive(light: TBLightColor.borderAvatarSoft, dark: TBDarkColor.borderAvatarSoft)
    static let iconPrimary = Color.tbAdaptive(light: TBLightColor.iconPrimary, dark: TBDarkColor.iconPrimary)
    static let iconHover = Color.tbAdaptive(light: TBLightColor.iconHover, dark: TBDarkColor.iconHover)
    static let iconMuted = Color.tbAdaptive(light: TBLightColor.iconMuted, dark: TBDarkColor.iconMuted)
    static let neutral = Color.tbAdaptive(light: TBLightColor.neutral, dark: TBDarkColor.neutral)
    static let neutralSoft = Color.tbAdaptive(light: TBLightColor.neutralSoft, dark: TBDarkColor.neutralSoft)
    static let informative = Color.tbAdaptive(light: TBLightColor.informative, dark: TBDarkColor.informative)
    static let informativeSoft = Color.tbAdaptive(light: TBLightColor.informativeSoft, dark: TBDarkColor.informativeSoft)
    static let success = Color.tbAdaptive(light: TBLightColor.success, dark: TBDarkColor.success)
    static let successText = Color.tbAdaptive(light: TBLightColor.successText, dark: TBDarkColor.successText)
    static let successStrong = Color.tbAdaptive(light: TBLightColor.successStrong, dark: TBDarkColor.successStrong)
    static let successSoft = Color.tbAdaptive(light: TBLightColor.successSoft, dark: TBDarkColor.successSoft)
    static let warning = Color.tbAdaptive(light: TBLightColor.warning, dark: TBDarkColor.warning)
    static let warningText = Color.tbAdaptive(light: TBLightColor.warningText, dark: TBDarkColor.warningText)
    static let warningStrong = Color.tbAdaptive(light: TBLightColor.warningStrong, dark: TBDarkColor.warningStrong)
    static let warningSoft = Color.tbAdaptive(light: TBLightColor.warningSoft, dark: TBDarkColor.warningSoft)
    static let destructive = Color.tbAdaptive(light: TBLightColor.destructive, dark: TBDarkColor.destructive)
    static let destructiveText = Color.tbAdaptive(light: TBLightColor.destructiveText, dark: TBDarkColor.destructiveText)
    static let destructiveSoft = Color.tbAdaptive(light: TBLightColor.destructiveSoft, dark: TBDarkColor.destructiveSoft)
    static let scrimSubtle = Color.tbAdaptive(light: TBLightColor.scrimSubtle, dark: TBDarkColor.scrimSubtle)
    static let scrimDefault = Color.tbAdaptive(light: TBLightColor.scrimDefault, dark: TBDarkColor.scrimDefault)
    static let scrimStrong = Color.tbAdaptive(light: TBLightColor.scrimStrong, dark: TBDarkColor.scrimStrong)
    static let borderFaint = borderCard
    static let borderFocus = focusRing
    static let borderSelected = selectionSurface
    static let borderDestructive = destructive
    static let borderSuccess = success
    static let borderSuccessSoft = successSoft
    static let borderWarning = warning
    static let borderWarningSoft = warningSoft
    static let borderOnMuted = Color.tbAdaptive(light: Color(hex: 0xE5E5E5), dark: Color(hex: 0x484848))
    static let controlSurface = Color.tbAdaptive(light: Color(hex: 0xF7F7F7), dark: Color(hex: 0x484848))
    static let switchOffThumb = Color.tbAdaptive(light: Color(hex: 0xFFFFFF), dark: Color(hex: 0xF5F5F5))
    static let switchOnThumb = Color.tbAdaptive(light: Color(hex: 0xFFFFFF), dark: Color(hex: 0x0F0F0F))
    static let heatmapNeutral = Color.tbAdaptive(light: Color(hex: 0xE4E4E4), dark: Color(hex: 0x454545))
    static let neutralSelectionText = Color.tbAdaptive(light: Color(hex: 0x7A7A7A), dark: Color(hex: 0xDEDEDE))
}

enum TBColorMode: String, CaseIterable {
    case light, dark
    init(_ scheme: ColorScheme) { self = scheme == .dark ? .dark : .light }
    var chartRemainder: Color { self == .dark ? Color(hex: 0xA3A3A3) : Color(hex: 0xE4E4E4) }
    var page: Color { self == .dark ? TBDarkColor.page : TBLightColor.page }
    var focus: Color { self == .dark ? TBDarkColor.focus : TBLightColor.focus }
    var surface: Color { self == .dark ? TBDarkColor.surface : TBLightColor.surface }
    var surfaceHover: Color { self == .dark ? TBDarkColor.surfaceHover : TBLightColor.surfaceHover }
    var mutedSurface: Color { self == .dark ? TBDarkColor.mutedSurface : TBLightColor.mutedSurface }
    var elevatedSurface: Color { self == .dark ? TBDarkColor.elevatedSurface : TBLightColor.elevatedSurface }
    var disabledSurface: Color { self == .dark ? TBDarkColor.disabledSurface : TBLightColor.disabledSurface }
    var overlaySurface: Color { self == .dark ? TBDarkColor.overlaySurface : TBLightColor.overlaySurface }
    var placeholderSurface: Color { self == .dark ? TBDarkColor.placeholderSurface : TBLightColor.placeholderSurface }
    var inverseSurface: Color { self == .dark ? TBDarkColor.inverseSurface : TBLightColor.inverseSurface }
    var actionPrimary: Color { self == .dark ? TBDarkColor.actionPrimary : TBLightColor.actionPrimary }
    var actionOnPrimary: Color { self == .dark ? TBDarkColor.actionOnPrimary : TBLightColor.actionOnPrimary }
    var selectionSurface: Color { self == .dark ? TBDarkColor.selectionSurface : TBLightColor.selectionSurface }
    var selectionText: Color { self == .dark ? TBDarkColor.selectionText : TBLightColor.selectionText }
    var focusRing: Color { self == .dark ? TBDarkColor.focusRing : TBLightColor.focusRing }
    var hoverOverlay: Color { self == .dark ? TBDarkColor.hoverOverlay : TBLightColor.hoverOverlay }
    var pressedOverlay: Color { self == .dark ? TBDarkColor.pressedOverlay : TBLightColor.pressedOverlay }
    var pressedInverseOverlay: Color { self == .dark ? TBDarkColor.pressedInverseOverlay : TBLightColor.pressedInverseOverlay }
    var textPrimary: Color { self == .dark ? TBDarkColor.textPrimary : TBLightColor.textPrimary }
    var textSecondary: Color { self == .dark ? TBDarkColor.textSecondary : TBLightColor.textSecondary }
    var textTertiary: Color { self == .dark ? TBDarkColor.textTertiary : TBLightColor.textTertiary }
    var textBody: Color { self == .dark ? TBDarkColor.textBody : TBLightColor.textBody }
    var textAction: Color { self == .dark ? TBDarkColor.textAction : TBLightColor.textAction }
    var textHint: Color { self == .dark ? TBDarkColor.textHint : TBLightColor.textHint }
    var textDisabled: Color { self == .dark ? TBDarkColor.textDisabled : TBLightColor.textDisabled }
    var textInverse: Color { self == .dark ? TBDarkColor.textInverse : TBLightColor.textInverse }
    var textSubtle: Color { self == .dark ? TBDarkColor.textSubtle : TBLightColor.textSubtle }
    var textMuted: Color { self == .dark ? TBDarkColor.textMuted : TBLightColor.textMuted }
    var textFaint: Color { self == .dark ? TBDarkColor.textFaint : TBLightColor.textFaint }
    var borderCard: Color { self == .dark ? TBDarkColor.borderCard : TBLightColor.borderCard }
    var borderSubtle: Color { self == .dark ? TBDarkColor.borderSubtle : TBLightColor.borderSubtle }
    var border: Color { self == .dark ? TBDarkColor.border : TBLightColor.border }
    var borderStrong: Color { self == .dark ? TBDarkColor.borderStrong : TBLightColor.borderStrong }
    var borderDisabled: Color { self == .dark ? TBDarkColor.borderDisabled : TBLightColor.borderDisabled }
    var borderAvatar: Color { self == .dark ? TBDarkColor.borderAvatar : TBLightColor.borderAvatar }
    var borderAvatarSoft: Color { self == .dark ? TBDarkColor.borderAvatarSoft : TBLightColor.borderAvatarSoft }
    var iconPrimary: Color { self == .dark ? TBDarkColor.iconPrimary : TBLightColor.iconPrimary }
    var iconHover: Color { self == .dark ? TBDarkColor.iconHover : TBLightColor.iconHover }
    var iconMuted: Color { self == .dark ? TBDarkColor.iconMuted : TBLightColor.iconMuted }
    var neutral: Color { self == .dark ? TBDarkColor.neutral : TBLightColor.neutral }
    var neutralSoft: Color { self == .dark ? TBDarkColor.neutralSoft : TBLightColor.neutralSoft }
    var informative: Color { self == .dark ? TBDarkColor.informative : TBLightColor.informative }
    var informativeSoft: Color { self == .dark ? TBDarkColor.informativeSoft : TBLightColor.informativeSoft }
    var success: Color { self == .dark ? TBDarkColor.success : TBLightColor.success }
    var successText: Color { self == .dark ? TBDarkColor.successText : TBLightColor.successText }
    var successStrong: Color { self == .dark ? TBDarkColor.successStrong : TBLightColor.successStrong }
    var successSoft: Color { self == .dark ? TBDarkColor.successSoft : TBLightColor.successSoft }
    var warning: Color { self == .dark ? TBDarkColor.warning : TBLightColor.warning }
    var warningText: Color { self == .dark ? TBDarkColor.warningText : TBLightColor.warningText }
    var warningStrong: Color { self == .dark ? TBDarkColor.warningStrong : TBLightColor.warningStrong }
    var warningSoft: Color { self == .dark ? TBDarkColor.warningSoft : TBLightColor.warningSoft }
    var destructive: Color { self == .dark ? TBDarkColor.destructive : TBLightColor.destructive }
    var destructiveText: Color { self == .dark ? TBDarkColor.destructiveText : TBLightColor.destructiveText }
    var destructiveSoft: Color { self == .dark ? TBDarkColor.destructiveSoft : TBLightColor.destructiveSoft }
    var scrimSubtle: Color { self == .dark ? TBDarkColor.scrimSubtle : TBLightColor.scrimSubtle }
    var scrimDefault: Color { self == .dark ? TBDarkColor.scrimDefault : TBLightColor.scrimDefault }
    var scrimStrong: Color { self == .dark ? TBDarkColor.scrimStrong : TBLightColor.scrimStrong }
    var borderFaint: Color { borderCard }
    var borderFocus: Color { focusRing }
    var borderSelected: Color { selectionSurface }
    var borderDestructive: Color { destructive }
    var borderSuccess: Color { success }
    var borderSuccessSoft: Color { successSoft }
    var borderWarning: Color { warning }
    var borderWarningSoft: Color { warningSoft }
    var borderOnMuted: Color { self == .dark ? Color(hex: 0x484848) : Color(hex: 0xE5E5E5) }
}

enum TBDarkColor {
    static let page = Color(hex: 0x141414)
    static let focus = Color(hex: 0x141414)
    static let surface = Color(hex: 0x282828)
    static let surfaceHover = Color(hex: 0x303030)
    static let mutedSurface = Color(hex: 0x222222)
    static let elevatedSurface = Color(hex: 0x343434)
    static let disabledSurface = Color(hex: 0x313131)
    static let overlaySurface = Color(hex: 0x282828, alpha: 0.88)
    static let placeholderSurface = Color(hex: 0x313131)
    static let inverseSurface = Color(hex: 0xF5F5F5)
    static let actionPrimary = Color(hex: 0xF5F5F5)
    static let actionOnPrimary = Color(hex: 0x0F0F0F)
    static let selectionSurface = Color(hex: 0xF5F5F5)
    static let selectionText = Color(hex: 0x0F0F0F)
    static let focusRing = Color(hex: 0xDEDEDE)
    static let hoverOverlay = Color(hex: 0xFFFFFF, alpha: 0.06)
    static let pressedOverlay = Color(hex: 0xFFFFFF, alpha: 0.1)
    static let pressedInverseOverlay = Color(hex: 0x000000, alpha: 0.08)
    static let textPrimary = Color(hex: 0xF5F5F5)
    static let textSecondary = Color(hex: 0xDEDEDE)
    static let textTertiary = Color(hex: 0xC6C6C6)
    static let textBody = Color(hex: 0xB8B8B8)
    static let textAction = Color(hex: 0xB8B8B8)
    static let textHint = Color(hex: 0xA3A3A3)
    static let textDisabled = Color(hex: 0x666666)
    static let textInverse = Color(hex: 0x0F0F0F)
    static let textSubtle = Color(hex: 0xF5F5F5, alpha: 0.6)
    static let textMuted = Color(hex: 0xF5F5F5, alpha: 0.5)
    static let textFaint = Color(hex: 0xF5F5F5, alpha: 0.4)
    static let borderCard = Color(hex: 0x303030)
    static let borderSubtle = Color(hex: 0x333333)
    static let border = Color(hex: 0x3B3B3B)
    static let borderStrong = Color(hex: 0x808080)
    static let borderDisabled = Color(hex: 0x303030)
    static let borderAvatar = Color(hex: 0xF5F5F5, alpha: 0.2)
    static let borderAvatarSoft = Color(hex: 0xF5F5F5, alpha: 0.15)
    static let iconPrimary = Color(hex: 0xDEDEDE)
    static let iconHover = Color(hex: 0xF5F5F5)
    static let iconMuted = Color(hex: 0x909090)
    static let neutral = Color(hex: 0xDEDEDE)
    static let neutralSoft = Color(hex: 0x252525)
    static let informative = Color(hex: 0xDEDEDE)
    static let informativeSoft = Color(hex: 0x222222)
    static let success = Color(hex: 0x75CB9B)
    static let successText = Color(hex: 0xADE5C5)
    static let successStrong = Color(hex: 0x75CB9B)
    static let successSoft = Color(hex: 0x203B2D)
    static let warning = Color(hex: 0xE6B572)
    static let warningText = Color(hex: 0xF2D5AE)
    static let warningStrong = Color(hex: 0xE6B572)
    static let warningSoft = Color(hex: 0x44331F)
    static let destructive = Color(hex: 0xF78298)
    static let destructiveText = Color(hex: 0xF9B8C5)
    static let destructiveSoft = Color(hex: 0x4A2430)
    static let scrimSubtle = Color(hex: 0x000000, alpha: 0.35)
    static let scrimDefault = Color(hex: 0x000000, alpha: 0.5)
    static let scrimStrong = Color(hex: 0x000000, alpha: 0.6)
}

extension TasteAxis {
    func chartColor(tint: Int, in mode: TBColorMode) -> Color {
        switch tint {
        case 80:
            switch self {
            case .sweet: return mode == .dark ? Color(hex: 0xD28006) : Color(hex: 0xFFEBCC)
            case .sour: return mode == .dark ? Color(hex: 0xD2B106) : Color(hex: 0xFFF7CC)
            case .bitter: return mode == .dark ? Color(hex: 0x7DA606) : Color(hex: 0xEAF4CC)
            case .salty: return mode == .dark ? Color(hex: 0x6180D2) : Color(hex: 0xE3EBFF)
            case .umami: return mode == .dark ? Color(hex: 0x956196) : Color(hex: 0xF0E3F0)
            case .fat: return mode == .dark ? Color(hex: 0x7D7167) : Color(hex: 0xEAE7E4)
            }
        case 60:
            switch self {
            case .sweet: return mode == .dark ? Color(hex: 0xE88D03) : Color(hex: 0xFFD699)
            case .sour: return mode == .dark ? Color(hex: 0xE8C303) : Color(hex: 0xFFEF99)
            case .bitter: return mode == .dark ? Color(hex: 0x89B803) : Color(hex: 0xD5E999)
            case .salty: return mode == .dark ? Color(hex: 0x698DE8) : Color(hex: 0xC7D6FF)
            case .umami: return mode == .dark ? Color(hex: 0xA469A5) : Color(hex: 0xE1C7E1)
            case .fat: return mode == .dark ? Color(hex: 0x897B71) : Color(hex: 0xD5CFCA)
            }
        case 40:
            switch self {
            case .sweet: return mode == .dark ? Color(hex: 0xFF9900) : Color(hex: 0xFFC266)
            case .sour: return mode == .dark ? Color(hex: 0xFFD600) : Color(hex: 0xFFE666)
            case .bitter: return mode == .dark ? Color(hex: 0x95C900) : Color(hex: 0xBFDF66)
            case .salty: return mode == .dark ? Color(hex: 0x7299FF) : Color(hex: 0xAAC2FF)
            case .umami: return mode == .dark ? Color(hex: 0xB372B4) : Color(hex: 0xD1AAD2)
            case .fat: return mode == .dark ? Color(hex: 0x95867A) : Color(hex: 0xBFB6AF)
            }
        case 20:
            switch self {
            case .sweet: return mode == .dark ? Color(hex: 0xFFA51F) : Color(hex: 0xFFAD33)
            case .sour: return mode == .dark ? Color(hex: 0xFFDB1F) : Color(hex: 0xFFDE33)
            case .bitter: return mode == .dark ? Color(hex: 0xA2CF1F) : Color(hex: 0xAAD433)
            case .salty: return mode == .dark ? Color(hex: 0x83A5FF) : Color(hex: 0x8EADFF)
            case .umami: return mode == .dark ? Color(hex: 0xBC83BD) : Color(hex: 0xC28EC3)
            case .fat: return mode == .dark ? Color(hex: 0xA2958A) : Color(hex: 0xAA9E95)
            }
        case 0:
            switch self {
            case .sweet: return mode == .dark ? Color(hex: 0xFFB340) : Color(hex: 0xFF9900)
            case .sour: return mode == .dark ? Color(hex: 0xFFE040) : Color(hex: 0xFFD600)
            case .bitter: return mode == .dark ? Color(hex: 0xB0D740) : Color(hex: 0x95C900)
            case .salty: return mode == .dark ? Color(hex: 0x95B3FF) : Color(hex: 0x7299FF)
            case .umami: return mode == .dark ? Color(hex: 0xC695C7) : Color(hex: 0xB372B4)
            case .fat: return mode == .dark ? Color(hex: 0xB0A49B) : Color(hex: 0x95867A)
            }
        default: return chartColor(tint: 40, in: mode)
        }
    }

    func heatmapColor(level: Int, in mode: TBColorMode) -> Color {
        let colors: [Color]
        switch self {
        case .sweet: colors = mode == .dark ? [Color(hex: 0x604214), Color(hex: 0x8E5B0E), Color(hex: 0xBB7408), Color(hex: 0xE88D03), Color(hex: 0xFF9900)] : [Color(hex: 0xFFEBCC), Color(hex: 0xFFD699), Color(hex: 0xFFC266), Color(hex: 0xFFAD33), Color(hex: 0xFF9900)]
        case .sour: colors = mode == .dark ? [Color(hex: 0x605414), Color(hex: 0x8E790E), Color(hex: 0xBB9E08), Color(hex: 0xE8C303), Color(hex: 0xFFD600)] : [Color(hex: 0xFFF7CC), Color(hex: 0xFFEF99), Color(hex: 0xFFE666), Color(hex: 0xFFDE33), Color(hex: 0xFFD600)]
        case .bitter: colors = mode == .dark ? [Color(hex: 0x405014), Color(hex: 0x59730E), Color(hex: 0x719508), Color(hex: 0x89B803), Color(hex: 0x95C900)] : [Color(hex: 0xEAF4CC), Color(hex: 0xD5E999), Color(hex: 0xBFDF66), Color(hex: 0xAAD433), Color(hex: 0x95C900)]
        case .salty: colors = mode == .dark ? [Color(hex: 0x364260), Color(hex: 0x475B8E), Color(hex: 0x5874BB), Color(hex: 0x698DE8), Color(hex: 0x7299FF)] : [Color(hex: 0xE3EBFF), Color(hex: 0xC7D6FF), Color(hex: 0xAAC2FF), Color(hex: 0x8EADFF), Color(hex: 0x7299FF)]
        case .umami: colors = mode == .dark ? [Color(hex: 0x49364A), Color(hex: 0x684768), Color(hex: 0x865886), Color(hex: 0xA469A5), Color(hex: 0xB372B4)] : [Color(hex: 0xF0E3F0), Color(hex: 0xE1C7E1), Color(hex: 0xD1AAD2), Color(hex: 0xC28EC3), Color(hex: 0xB372B4)]
        case .fat: colors = mode == .dark ? [Color(hex: 0x403C38), Color(hex: 0x59514B), Color(hex: 0x71665E), Color(hex: 0x897B71), Color(hex: 0x95867A)] : [Color(hex: 0xEAE7E4), Color(hex: 0xD5CFCA), Color(hex: 0xBFB6AF), Color(hex: 0xAA9E95), Color(hex: 0x95867A)]
        }
        return colors[max(0, min(4, level))]
    }

    func lineChartTrackColor(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0x604214) : Color(hex: 0xFFEBCC)
        case .sour: return mode == .dark ? Color(hex: 0x605414) : Color(hex: 0xFFF7CC)
        case .bitter: return mode == .dark ? Color(hex: 0x405014) : Color(hex: 0xEAF4CC)
        case .salty: return mode == .dark ? Color(hex: 0x364260) : Color(hex: 0xE3EBFF)
        case .umami: return mode == .dark ? Color(hex: 0x49364A) : Color(hex: 0xF0E3F0)
        case .fat: return mode == .dark ? Color(hex: 0x403C38) : Color(hex: 0xEAE7E4)
        }
    }
    var lineChartTrackColor: Color { .tbAdaptive(light: lineChartTrackColor(in: .light), dark: lineChartTrackColor(in: .dark)) }

    func lineChartStartColor(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0x774E11) : Color(hex: 0xFFE0B3)
        case .sour: return mode == .dark ? Color(hex: 0x776611) : Color(hex: 0xFFF3B3)
        case .bitter: return mode == .dark ? Color(hex: 0x4C6111) : Color(hex: 0xDFEFB3)
        case .salty: return mode == .dark ? Color(hex: 0x3E4E77) : Color(hex: 0xD5E0FF)
        case .umami: return mode == .dark ? Color(hex: 0x583E59) : Color(hex: 0xE8D5E9)
        case .fat: return mode == .dark ? Color(hex: 0x4C4642) : Color(hex: 0xDFDBD7)
        }
    }
    var lineChartStartColor: Color { .tbAdaptive(light: lineChartStartColor(in: .light), dark: lineChartStartColor(in: .dark)) }

    func lineChartEndColor(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0xFF9900) : Color(hex: 0xFF9900)
        case .sour: return mode == .dark ? Color(hex: 0xFFD600) : Color(hex: 0xFFD600)
        case .bitter: return mode == .dark ? Color(hex: 0x95C900) : Color(hex: 0x95C900)
        case .salty: return mode == .dark ? Color(hex: 0x7299FF) : Color(hex: 0x7299FF)
        case .umami: return mode == .dark ? Color(hex: 0xB372B4) : Color(hex: 0xB372B4)
        case .fat: return mode == .dark ? Color(hex: 0x95867A) : Color(hex: 0x95867A)
        }
    }
    var lineChartEndColor: Color { .tbAdaptive(light: lineChartEndColor(in: .light), dark: lineChartEndColor(in: .dark)) }

    func chipBackgroundColor(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0x604214) : Color(hex: 0xFFEBCC)
        case .sour: return mode == .dark ? Color(hex: 0x605414) : Color(hex: 0xFFF7CC)
        case .bitter: return mode == .dark ? Color(hex: 0x405014) : Color(hex: 0xEAF4CC)
        case .salty: return mode == .dark ? Color(hex: 0x364260) : Color(hex: 0xE3EBFF)
        case .umami: return mode == .dark ? Color(hex: 0x49364A) : Color(hex: 0xF0E3F0)
        case .fat: return mode == .dark ? Color(hex: 0x403C38) : Color(hex: 0xEAE7E4)
        }
    }
    var chipBackgroundColor: Color { .tbAdaptive(light: chipBackgroundColor(in: .light), dark: chipBackgroundColor(in: .dark)) }

    func chipBorderColor(in mode: TBColorMode) -> Color { palette(in: mode).borderDefault }
    var chipBorderColor: Color { borderDefaultColor }

    func miniChartMainColor(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0xFFB340) : Color(hex: 0xFF9900)
        case .sour: return mode == .dark ? Color(hex: 0xFFE040) : Color(hex: 0xFFD600)
        case .bitter: return mode == .dark ? Color(hex: 0xB0D740) : Color(hex: 0x95C900)
        case .salty: return mode == .dark ? Color(hex: 0x95B3FF) : Color(hex: 0x7299FF)
        case .umami: return mode == .dark ? Color(hex: 0xC695C7) : Color(hex: 0xB372B4)
        case .fat: return mode == .dark ? Color(hex: 0xB0A49B) : Color(hex: 0x95867A)
        }
    }
    var miniChartMainColor: Color { .tbAdaptive(light: miniChartMainColor(in: .light), dark: miniChartMainColor(in: .dark)) }

    func miniChartTint20Color(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0xFFA51F) : Color(hex: 0xFFAD33)
        case .sour: return mode == .dark ? Color(hex: 0xFFDB1F) : Color(hex: 0xFFDE33)
        case .bitter: return mode == .dark ? Color(hex: 0xA2CF1F) : Color(hex: 0xAAD433)
        case .salty: return mode == .dark ? Color(hex: 0x83A5FF) : Color(hex: 0x8EADFF)
        case .umami: return mode == .dark ? Color(hex: 0xBC83BD) : Color(hex: 0xC28EC3)
        case .fat: return mode == .dark ? Color(hex: 0xA2958A) : Color(hex: 0xAA9E95)
        }
    }
    var miniChartTint20Color: Color { .tbAdaptive(light: miniChartTint20Color(in: .light), dark: miniChartTint20Color(in: .dark)) }

    var palette: TasteAxisPalette {
        let light = lightPalette
        let dark = palette(in: .dark)
        return TasteAxisPalette(
            main: .tbAdaptive(light: light.main, dark: dark.main),
            dark: .tbAdaptive(light: light.dark, dark: dark.dark),
            light: .tbAdaptive(light: light.light, dark: dark.light),
            bg: .tbAdaptive(light: light.bg, dark: dark.bg),
            tintSoft: .tbAdaptive(light: light.tintSoft, dark: dark.tintSoft),
            tintSoftBorder: .tbAdaptive(light: light.tintSoftBorder, dark: dark.tintSoftBorder),
            borderSubtle: .tbAdaptive(light: light.borderSubtle, dark: dark.borderSubtle),
            borderDefault: .tbAdaptive(light: light.borderDefault, dark: dark.borderDefault),
            borderStrong: .tbAdaptive(light: light.borderStrong, dark: dark.borderStrong),
            borderAccent: .tbAdaptive(light: light.borderAccent, dark: dark.borderAccent),
            tintSurface: .tbAdaptive(light: light.tintSurface, dark: dark.tintSurface),
            tintSurfaceSubText: .tbAdaptive(light: light.tintSurfaceSubText, dark: dark.tintSurfaceSubText),
            tintSurfaceText: .tbAdaptive(light: light.tintSurfaceText, dark: dark.tintSurfaceText),
            gradientColors: light.gradientColors
        )
    }

    var measurementPalette: TasteAxisMeasurementPalette {
        let light = lightMeasurementPalette
        let dark = measurementPalette(in: .dark)
        return TasteAxisMeasurementPalette(
            accent: .tbAdaptive(light: light.accent, dark: dark.accent),
            nodeColors: zip(light.nodeColors, dark.nodeColors).map { Color.tbAdaptive(light: $0.0, dark: $0.1) },
            ringBaseColor: .tbAdaptive(light: light.ringBaseColor, dark: dark.ringBaseColor),
            ringBaseColorSoft: .tbAdaptive(light: light.ringBaseColorSoft, dark: dark.ringBaseColorSoft),
            ringGuideBaseColor: .tbAdaptive(light: light.ringGuideBaseColor, dark: dark.ringGuideBaseColor),
            glowTransparentColor: .tbAdaptive(light: light.glowTransparentColor, dark: dark.glowTransparentColor)
        )
    }

    func palette(in mode: TBColorMode) -> TasteAxisPalette {
        guard mode == .dark else { return lightPalette }
        switch self {
        case .sweet:
            return TasteAxisPalette(
                main: Color(hex: 0xFF9900),
                dark: Color(hex: 0xD28006),
                light: Color(hex: 0xFFAD33),
                bg: Color(hex: 0x774E11),
                tintSoft: Color(hex: 0x604214),
                tintSoftBorder: Color(hex: 0x493516),
                borderSubtle: Color(hex: 0x604214),
                borderDefault: Color(hex: 0x774E11),
                borderStrong: Color(hex: 0x8E5B0E),
                borderAccent: Color(hex: 0xFF9900),
                tintSurface: Color(hex: 0x604214),
                tintSurfaceSubText: Color(hex: 0xFFCC80),
                tintSurfaceText: Color(hex: 0xFFEBCC),
                gradientColors: lightPalette.gradientColors
            )
        case .sour:
            return TasteAxisPalette(
                main: Color(hex: 0xFFD600),
                dark: Color(hex: 0xD2B106),
                light: Color(hex: 0xFFDE33),
                bg: Color(hex: 0x776611),
                tintSoft: Color(hex: 0x605414),
                tintSoftBorder: Color(hex: 0x494116),
                borderSubtle: Color(hex: 0x605414),
                borderDefault: Color(hex: 0x776611),
                borderStrong: Color(hex: 0x8E790E),
                borderAccent: Color(hex: 0xFFD600),
                tintSurface: Color(hex: 0x605414),
                tintSurfaceSubText: Color(hex: 0xFFEB80),
                tintSurfaceText: Color(hex: 0xFFF7CC),
                gradientColors: lightPalette.gradientColors
            )
        case .bitter:
            return TasteAxisPalette(
                main: Color(hex: 0x95C900),
                dark: Color(hex: 0x7DA606),
                light: Color(hex: 0xAAD433),
                bg: Color(hex: 0x4C6111),
                tintSoft: Color(hex: 0x405014),
                tintSoftBorder: Color(hex: 0x343F16),
                borderSubtle: Color(hex: 0x405014),
                borderDefault: Color(hex: 0x4C6111),
                borderStrong: Color(hex: 0x59730E),
                borderAccent: Color(hex: 0x95C900),
                tintSurface: Color(hex: 0x405014),
                tintSurfaceSubText: Color(hex: 0xCAE480),
                tintSurfaceText: Color(hex: 0xEAF4CC),
                gradientColors: lightPalette.gradientColors
            )
        case .salty:
            return TasteAxisPalette(
                main: Color(hex: 0x7299FF),
                dark: Color(hex: 0x6180D2),
                light: Color(hex: 0x8EADFF),
                bg: Color(hex: 0x3E4E77),
                tintSoft: Color(hex: 0x364260),
                tintSoftBorder: Color(hex: 0x2D3549),
                borderSubtle: Color(hex: 0x364260),
                borderDefault: Color(hex: 0x3E4E77),
                borderStrong: Color(hex: 0x475B8E),
                borderAccent: Color(hex: 0x7299FF),
                tintSurface: Color(hex: 0x364260),
                tintSurfaceSubText: Color(hex: 0xB9CCFF),
                tintSurfaceText: Color(hex: 0xE3EBFF),
                gradientColors: lightPalette.gradientColors
            )
        case .umami:
            return TasteAxisPalette(
                main: Color(hex: 0xB372B4),
                dark: Color(hex: 0x956196),
                light: Color(hex: 0xC28EC3),
                bg: Color(hex: 0x583E59),
                tintSoft: Color(hex: 0x49364A),
                tintSoftBorder: Color(hex: 0x3A2D3A),
                borderSubtle: Color(hex: 0x49364A),
                borderDefault: Color(hex: 0x583E59),
                borderStrong: Color(hex: 0x684768),
                borderAccent: Color(hex: 0xB372B4),
                tintSurface: Color(hex: 0x49364A),
                tintSurfaceSubText: Color(hex: 0xD9B9DA),
                tintSurfaceText: Color(hex: 0xF0E3F0),
                gradientColors: lightPalette.gradientColors
            )
        case .fat:
            return TasteAxisPalette(
                main: Color(hex: 0x95867A),
                dark: Color(hex: 0x7D7167),
                light: Color(hex: 0xAA9E95),
                bg: Color(hex: 0x4C4642),
                tintSoft: Color(hex: 0x403C38),
                tintSoftBorder: Color(hex: 0x34312F),
                borderSubtle: Color(hex: 0x403C38),
                borderDefault: Color(hex: 0x4C4642),
                borderStrong: Color(hex: 0x59514B),
                borderAccent: Color(hex: 0x95867A),
                tintSurface: Color(hex: 0x403C38),
                tintSurfaceSubText: Color(hex: 0xCAC3BD),
                tintSurfaceText: Color(hex: 0xEAE7E4),
                gradientColors: lightPalette.gradientColors
            )
        }
    }

    func chartTrackColor(in mode: TBColorMode) -> Color {
        guard mode == .dark else { return lightPalette.tintSurface }
        switch self {
        case .sweet: return Color(hex: 0x604214)
        case .sour: return Color(hex: 0x605414)
        case .bitter: return Color(hex: 0x405014)
        case .salty: return Color(hex: 0x364260)
        case .umami: return Color(hex: 0x49364A)
        case .fat: return Color(hex: 0x403C38)
        }
    }

    func measurementPalette(in mode: TBColorMode) -> TasteAxisMeasurementPalette {
        guard mode == .dark else { return lightMeasurementPalette }
        switch self {
        case .sweet:
            return TasteAxisMeasurementPalette(
                accent: Color(hex: 0xFF9900),
                nodeColors: [Color(hex: 0x8E5B0E), Color(hex: 0x9B620C), Color(hex: 0xA7690B), Color(hex: 0xB47009), Color(hex: 0xC07708), Color(hex: 0xCD7D06), Color(hex: 0xD98405), Color(hex: 0xE68B03), Color(hex: 0xF29202), Color(hex: 0xFF9900)],
                ringBaseColor: Color(hex: 0x8E5B0E),
                ringBaseColorSoft: Color(hexRGBA: 0xFF99001A),
                ringGuideBaseColor: Color(hex: 0xFF9900),
                glowTransparentColor: Color(hexRGBA: 0xFF990014)
            )
        case .sour:
            return TasteAxisMeasurementPalette(
                accent: Color(hex: 0xFFD600),
                nodeColors: [Color(hex: 0x8E790E), Color(hex: 0x9B830C), Color(hex: 0xA78E0B), Color(hex: 0xB49809), Color(hex: 0xC0A208), Color(hex: 0xCDAD06), Color(hex: 0xD9B705), Color(hex: 0xE6C103), Color(hex: 0xF2CC02), Color(hex: 0xFFD600)],
                ringBaseColor: Color(hex: 0x8E790E),
                ringBaseColorSoft: Color(hexRGBA: 0xFFD6001A),
                ringGuideBaseColor: Color(hex: 0xFFD600),
                glowTransparentColor: Color(hexRGBA: 0xFFD60014)
            )
        case .bitter:
            return TasteAxisMeasurementPalette(
                accent: Color(hex: 0x95C900),
                nodeColors: [Color(hex: 0x59730E), Color(hex: 0x607D0C), Color(hex: 0x66860B), Color(hex: 0x6D9009), Color(hex: 0x749908), Color(hex: 0x7AA306), Color(hex: 0x81AC05), Color(hex: 0x88B603), Color(hex: 0x8EBF02), Color(hex: 0x95C900)],
                ringBaseColor: Color(hex: 0x59730E),
                ringBaseColorSoft: Color(hexRGBA: 0x95C9001A),
                ringGuideBaseColor: Color(hex: 0x95C900),
                glowTransparentColor: Color(hexRGBA: 0x95C90014)
            )
        case .salty:
            return TasteAxisMeasurementPalette(
                accent: Color(hex: 0x7299FF),
                nodeColors: [Color(hex: 0x475B8E), Color(hex: 0x4C629B), Color(hex: 0x5169A7), Color(hex: 0x5570B4), Color(hex: 0x5A77C0), Color(hex: 0x5F7DCD), Color(hex: 0x6484D9), Color(hex: 0x688BE6), Color(hex: 0x6D92F2), Color(hex: 0x7299FF)],
                ringBaseColor: Color(hex: 0x475B8E),
                ringBaseColorSoft: Color(hexRGBA: 0x7299FF1A),
                ringGuideBaseColor: Color(hex: 0x7299FF),
                glowTransparentColor: Color(hexRGBA: 0x7299FF14)
            )
        case .umami:
            return TasteAxisMeasurementPalette(
                accent: Color(hex: 0xB372B4),
                nodeColors: [Color(hex: 0x684768), Color(hex: 0x704C70), Color(hex: 0x795179), Color(hex: 0x815581), Color(hex: 0x895A8A), Color(hex: 0x925F92), Color(hex: 0x9A649B), Color(hex: 0xA268A3), Color(hex: 0xAB6DAC), Color(hex: 0xB372B4)],
                ringBaseColor: Color(hex: 0x684768),
                ringBaseColorSoft: Color(hexRGBA: 0xB372B41A),
                ringGuideBaseColor: Color(hex: 0xB372B4),
                glowTransparentColor: Color(hexRGBA: 0xB372B414)
            )
        case .fat:
            return TasteAxisMeasurementPalette(
                accent: Color(hex: 0x95867A),
                nodeColors: [Color(hex: 0x59514B), Color(hex: 0x605750), Color(hex: 0x665D55), Color(hex: 0x6D635B), Color(hex: 0x746960), Color(hex: 0x7A6E65), Color(hex: 0x81746A), Color(hex: 0x887A70), Color(hex: 0x8E8075), Color(hex: 0x95867A)],
                ringBaseColor: Color(hex: 0x59514B),
                ringBaseColorSoft: Color(hexRGBA: 0x95867A1A),
                ringGuideBaseColor: Color(hex: 0x95867A),
                glowTransparentColor: Color(hexRGBA: 0x95867A14)
            )
        }
    }

    func measurementTextColor(in mode: TBColorMode) -> Color { palette(in: mode).tintSurfaceText }
    func radarSpokeColor(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0x774E11) : Color(hex: 0xFFE1B3)
        case .sour: return mode == .dark ? Color(hex: 0x776611) : Color(hex: 0xFEEABD)
        case .bitter: return mode == .dark ? Color(hex: 0x4C6111) : Color(hex: 0xE1F0B7)
        case .salty: return mode == .dark ? Color(hex: 0x3E4E77) : Color(hex: 0xD7E2FF)
        case .umami: return mode == .dark ? Color(hex: 0x583E59) : Color(hex: 0xE8D7E9)
        case .fat: return mode == .dark ? Color(hex: 0x4C4642) : Color(hex: 0xE0DBD8)
        }
    }
    var radarSpokeColor: Color { .tbAdaptive(light: radarSpokeColor(in: .light), dark: radarSpokeColor(in: .dark)) }
    func radarOutlineColor(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0xFF9900) : Color(hex: 0xFFCC80)
        case .sour: return mode == .dark ? Color(hex: 0xFFD600) : Color(hex: 0xFDE096)
        case .bitter: return mode == .dark ? Color(hex: 0x95C900) : Color(hex: 0xCAE480)
        case .salty: return mode == .dark ? Color(hex: 0x7299FF) : Color(hex: 0xB9CCFF)
        case .umami: return mode == .dark ? Color(hex: 0xB372B4) : Color(hex: 0xD9B9DA)
        case .fat: return mode == .dark ? Color(hex: 0x95867A) : Color(hex: 0xCAC2BD)
        }
    }
    var radarOutlineColor: Color { .tbAdaptive(light: radarOutlineColor(in: .light), dark: radarOutlineColor(in: .dark)) }
    func radarLineStartColor(in mode: TBColorMode) -> Color {
        switch self {
        case .sweet: return mode == .dark ? Color(hex: 0xFF9900) : Color(hex: 0xFFB342)
        case .sour: return mode == .dark ? Color(hex: 0xFFD600) : Color(hex: 0xFCD369)
        case .bitter: return mode == .dark ? Color(hex: 0x95C900) : Color(hex: 0xB5D94A)
        case .salty: return mode == .dark ? Color(hex: 0x7299FF) : Color(hex: 0x9BB6FF)
        case .umami: return mode == .dark ? Color(hex: 0xB372B4) : Color(hex: 0xC69AC7)
        case .fat: return mode == .dark ? Color(hex: 0x95867A) : Color(hex: 0xB1A69E)
        }
    }
}

enum TBChipColor {
    static let neutralBackground = Color.tbAdaptive(light: Color(hex: 0xF7F7F7), dark: Color(hex: 0x343434))
    static let neutralBorder = TBColor.borderOnMuted
}

enum TBTasteMotionColor {
    static func hex(_ value: String, in mode: TBColorMode) -> String {
        switch value.uppercased() {
        case "#FF9900": return mode == .dark ? "#FF9900" : "#FF9900"
        case "#FFEBCC": return mode == .dark ? "#604214" : "#FFD699"
        case "#FFDEAB": return mode == .dark ? "#604214" : "#FFD699"
        case "#FFD600": return mode == .dark ? "#FFD600" : "#FFD600"
        case "#FFF7CC": return mode == .dark ? "#605414" : "#FFEF99"
        case "#FFF2AB": return mode == .dark ? "#605414" : "#FFEF99"
        case "#95C900": return mode == .dark ? "#95C900" : "#95C900"
        case "#EAF4CC": return mode == .dark ? "#405014" : "#D5E999"
        case "#DCEDAB": return mode == .dark ? "#405014" : "#D5E999"
        case "#7299FF": return mode == .dark ? "#7299FF" : "#7299FF"
        case "#E3EBFF": return mode == .dark ? "#364260" : "#C7D6FF"
        case "#D1DEFF": return mode == .dark ? "#364260" : "#C7D6FF"
        case "#B372B4": return mode == .dark ? "#B372B4" : "#B372B4"
        case "#F0E3F0": return mode == .dark ? "#49364A" : "#E1C7E1"
        case "#E6D1E6": return mode == .dark ? "#49364A" : "#E1C7E1"
        case "#95867A": return mode == .dark ? "#95867A" : "#95867A"
        case "#EAE7E4": return mode == .dark ? "#403C38" : "#D5CFCA"
        case "#DCD7D3": return mode == .dark ? "#403C38" : "#D5CFCA"
        case "#E4E0DA": return mode == .dark ? "#A3A3A3" : "#D0D0D0"
        case "#DEDAD5": return mode == .dark ? "#A3A3A3" : "#D0D0D0"
        case "#E8E8E8": return mode == .dark ? "#A3A3A3" : "#D0D0D0"
        case "#E4E4E4": return mode == .dark ? "#343434" : "#E4E4E4"
        default: return value
        }
    }
}

enum TBDataVizColor {
    static func progressBarTrack(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0x3B3B3B) : Color(hex: 0xE8E8E8) }
    static func radarGridColor(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0x3B3B3B) : Color(hex: 0xE8E8E8) }
    static func radarAverageFill(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0xA3A3A3, alpha: 0.18) : Color(hex: 0xF0F0F0, alpha: 0.6) }
    static func radarAverageStroke(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0x969696) : Color(hex: 0xD0D0D0) }
    static func radarHighlightFill(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0xFF9900, alpha: 0.2) : Color(hex: 0xFF9900, alpha: 0.12) }
    static func radarHighlightStroke(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0xFF9900) : Color(hex: 0xFF9900) }
    static func radarLabelColor(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0xA3A3A3) : Color(hex: 0x888888) }
    static func radarRenderedGridColor(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0x808080) : Color(hex: 0xE5E5E5) }
    static func radarCenterMask(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0x282828) : Color(hex: 0xFFFFFF) }
    static var progressBarTrack: Color { .tbAdaptive(light: progressBarTrack(in: .light), dark: progressBarTrack(in: .dark)) }
    static var radarGridColor: Color { .tbAdaptive(light: radarGridColor(in: .light), dark: radarGridColor(in: .dark)) }
    static var radarAverageFill: Color { .tbAdaptive(light: radarAverageFill(in: .light), dark: radarAverageFill(in: .dark)) }
    static var radarAverageStroke: Color { .tbAdaptive(light: radarAverageStroke(in: .light), dark: radarAverageStroke(in: .dark)) }
    static var radarHighlightFill: Color { .tbAdaptive(light: radarHighlightFill(in: .light), dark: radarHighlightFill(in: .dark)) }
    static var radarHighlightStroke: Color { .tbAdaptive(light: radarHighlightStroke(in: .light), dark: radarHighlightStroke(in: .dark)) }
    static var radarLabelColor: Color { .tbAdaptive(light: radarLabelColor(in: .light), dark: radarLabelColor(in: .dark)) }
    static var radarRenderedGridColor: Color { .tbAdaptive(light: radarRenderedGridColor(in: .light), dark: radarRenderedGridColor(in: .dark)) }
    static var radarCenterMask: Color { .tbAdaptive(light: radarCenterMask(in: .light), dark: radarCenterMask(in: .dark)) }
}

enum TBNeutralTasteColor {
    static func main(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0xA3A3A3) : Color(hex: 0x7A7A7A) }
    static func tint80(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0x2F2F2F) : Color(hex: 0xE4E4E4) }
    static func tintSurface(in mode: TBColorMode) -> Color { mode == .dark ? Color(hex: 0x484848) : Color(hex: 0xE4E4E4) }
    static var main: Color { .tbAdaptive(light: main(in: .light), dark: main(in: .dark)) }
    static var tint80: Color { .tbAdaptive(light: tint80(in: .light), dark: tint80(in: .dark)) }
    static var tintSurface: Color { .tbAdaptive(light: tintSurface(in: .light), dark: tintSurface(in: .dark)) }
}

enum TBEffectToken: String, CaseIterable {
    case hover, soft, strong, button, drawer, cardResult, selectionCard, profilePicker, profilePickerApply, stack, materialTopBar, badgeElevated
    func colors(in mode: TBColorMode) -> [Color] {
        switch self {
        case .hover: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.2)] : [Color(hex: 0x0F0F0F, alpha: 0.06)]
        case .soft: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.28)] : [Color(hex: 0x000000, alpha: 0.1)]
        case .strong: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.4)] : [Color(hex: 0x0F0F0F, alpha: 0.12)]
        case .button: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.28)] : [Color(hex: 0x000000, alpha: 0.1)]
        case .drawer: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.5)] : [Color(hex: 0x000000, alpha: 0.24)]
        case .cardResult: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.32)] : [Color(hex: 0x000000, alpha: 0.16)]
        case .selectionCard: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.2)] : [Color(hex: 0x0F0F0F, alpha: 0.06)]
        case .profilePicker: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.4)] : [Color(hex: 0x000000, alpha: 0.2)]
        case .profilePickerApply: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.28)] : [Color(hex: 0x000000, alpha: 0.1)]
        case .stack: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.2)] : [Color(hex: 0x0F0F0F, alpha: 0.08)]
        case .materialTopBar: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.18)] : [Color(hex: 0x000000, alpha: 0.08)]
        case .badgeElevated: return mode == .dark ? [Color(hex: 0x000000, alpha: 0.28), Color(hex: 0x000000, alpha: 0.18), Color(hex: 0xFFFFFF, alpha: 0.08)] : [Color(hex: 0x000000, alpha: 0.1), Color(hex: 0x000000, alpha: 0.1), Color(hex: 0xFFFFFF, alpha: 0.3)]
        }
    }
    func dynamicColor(at index: Int = 0) -> Color {
        .tbAdaptive(light: colors(in: .light)[index], dark: colors(in: .dark)[index])
    }
}
// END GENERATED COLOR MODES
