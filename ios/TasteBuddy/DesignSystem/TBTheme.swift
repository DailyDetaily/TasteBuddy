import SwiftUI

enum TBColor {
    static let page = Color(hex: 0xF3F3F3)
    static let focus = Color.white
    static let surface = Color.white
    static let surfaceHover = Color(hex: 0xFAFAFA)
    static let mutedSurface = Color(hex: 0xF7F7F7)
    static let elevatedSurface = Color(hex: 0xFCFCFC)
    static let disabledSurface = Color(hex: 0xEFEFEF)
    static let overlaySurface = Color.white.opacity(0.8)
    static let textPrimary = Color(hex: 0x0F0F0F)
    static let textSecondary = Color(hex: 0x3F3F3F)
    static let textTertiary = Color(hex: 0x535353)
    static let textBody = Color(hex: 0x666666)
    /// Readable auxiliary actions; disabled controls keep their separate state color.
    static let textAction = textBody
    static let textHint = Color(hex: 0x888888)
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
    static let success = Color(hex: 0x2F8F5B)
    static let successSoft = Color(hex: 0xE6F4EC)
    static let warning = Color(hex: 0xA8661A)
    static let warningSoft = Color(hex: 0xFFF1DE)
    static let destructive = Color(hex: 0xD4183D)
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

    var font: Font {
        switch self {
        case .sectionTitle: TBFont.bold(18)
        case .subsectionTitle: TBFont.bold(16)
        case .sheetTitle: TBFont.bold(15)
        case .body: TBFont.regular(14)
        case .caption: TBFont.semibold(12)
        case .detailAction: TBFont.medium(11)
        }
    }

    var color: Color {
        switch self {
        case .sectionTitle, .subsectionTitle, .sheetTitle: TBColor.textPrimary
        case .body, .caption: TBColor.textBody
        case .detailAction: TBColor.textAction
        }
    }

    var lineSpacing: CGFloat {
        switch self {
        case .body: 4
        case .caption: 3
        default: 0
        }
    }
}

extension Color {
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
    func tbTextStyle(_ style: TBTextStyle) -> some View {
        font(style.font)
            .foregroundStyle(style.color)
            .lineSpacing(style.lineSpacing)
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
