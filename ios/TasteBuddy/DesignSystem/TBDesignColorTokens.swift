import SwiftUI

struct TBDesignColorToken: Equatable {
    let path: String
    let cssVariable: String?
    let rawValue: String
    let value: TBDesignColorValue

    init(
        _ path: String,
        cssVariable: String? = nil,
        rawValue: String,
        value: TBDesignColorValue
    ) {
        self.path = path
        self.cssVariable = cssVariable
        self.rawValue = rawValue
        self.value = value
    }

    var color: Color? {
        value.color
    }

    var gradientColors: [Color]? {
        value.gradientColors
    }
}

enum TBDesignColorValue: Equatable {
    case solid(hex: UInt, alpha: Double)
    case linearGradient(degrees: Double, stops: [UInt], raw: String)
    case alias(cssVariable: String)
    case shadow(raw: String)

    static func hex(_ hex: UInt, alpha: Double = 1) -> TBDesignColorValue {
        .solid(hex: hex, alpha: alpha)
    }

    static func hexRGBA(_ hexRGBA: UInt) -> TBDesignColorValue {
        let rgb = (hexRGBA >> 8) & 0xFF_FFFF
        let alpha = Double(hexRGBA & 0xFF) / 255
        return .solid(hex: rgb, alpha: alpha)
    }

    static func rgba(_ red: UInt, _ green: UInt, _ blue: UInt, _ alpha: Double) -> TBDesignColorValue {
        .solid(hex: (red << 16) + (green << 8) + blue, alpha: alpha)
    }

    var color: Color? {
        switch self {
        case let .solid(hex, alpha):
            return Color(hex: hex, alpha: alpha)
        case .linearGradient, .alias, .shadow:
            return nil
        }
    }

    var gradientColors: [Color]? {
        switch self {
        case let .linearGradient(_, stops, _):
            return stops.map { Color(hex: $0) }
        case .solid, .alias, .shadow:
            return nil
        }
    }
}

enum TBDesignColorTokens {
    enum ColorTokens {
        enum Background {
            static let page = token("background.page", "--tb-color-bg-page", "#F3F3F3", .hex(0xF3F3F3))
            static let focus = token("background.focus", "--tb-color-bg-focus", "#FFFFFF", .hex(0xFFFFFF))

            static let all = [page, focus]
        }

        enum Surface {
            static let base = token("surface.base", "--tb-color-surface-base", "#FFFFFF", .hex(0xFFFFFF))
            static let card = token("surface.card", "--tb-color-surface-card", "#FFFFFF", .hex(0xFFFFFF))
            static let cardHover = token("surface.cardHover", "--tb-color-surface-card-hover", "#FAFAFA", .hex(0xFAFAFA))
            static let muted = token("surface.muted", "--tb-color-surface-muted", "#F7F7F7", .hex(0xF7F7F7))
            static let elevated = token("surface.elevated", "--tb-color-surface-elevated", "#FCFCFC", .hex(0xFCFCFC))
            static let disabled = token("surface.disabled", "--tb-color-surface-disabled", "#EFEFEF", .hex(0xEFEFEF))
            static let overlay = token("surface.overlay", "--tb-color-surface-overlay", "rgba(255, 255, 255, 0.8)", .rgba(255, 255, 255, 0.8))

            static let all = [base, card, cardHover, muted, elevated, disabled, overlay]
        }

        enum Text {
            static let primary = token("text.primary", "--tb-color-text-primary", "#0F0F0F", .hex(0x0F0F0F))
            static let secondary = token("text.secondary", "--tb-color-text-secondary", "#3F3F3F", .hex(0x3F3F3F))
            static let tertiary = token("text.tertiary", "--tb-color-text-tertiary", "#535353", .hex(0x535353))
            static let body = token("text.body", "--tb-color-text-body", "#666666", .hex(0x666666))
            static let hint = token("text.hint", "--tb-color-text-hint", "#888888", .hex(0x888888))
            static let disabled = token("text.disabled", "--tb-color-text-disabled", "#AFAFAF", .hex(0xAFAFAF))
            static let inverse = token("text.inverse", "--tb-color-text-inverse", "#FFFFFF", .hex(0xFFFFFF))
            static let subtle = token("text.subtle", "--tb-color-text-subtle", "rgba(15, 15, 15, 0.6)", .rgba(15, 15, 15, 0.6))
            static let muted = token("text.muted", "--tb-color-text-muted", "rgba(15, 15, 15, 0.5)", .rgba(15, 15, 15, 0.5))
            static let faint = token("text.faint", "--tb-color-text-faint", "rgba(15, 15, 15, 0.4)", .rgba(15, 15, 15, 0.4))

            static let all = [primary, secondary, tertiary, body, hint, disabled, inverse, subtle, muted, faint]
        }

        enum Border {
            static let card = token("border.card", "--tb-color-border-card", "#F0F0F0", .hex(0xF0F0F0))
            static let subtle = token("border.subtle", "--tb-color-border-subtle", "#E8E8E8", .hex(0xE8E8E8))
            static let `default` = token("border.default", "--tb-color-border-default", "#E7E7E7", .hex(0xE7E7E7))
            static let strong = token("border.strong", "--tb-color-border-strong", "#E5E5E5", .hex(0xE5E5E5))
            static let disabled = token("border.disabled", "--tb-color-border-disabled", "#E0E0E0", .hex(0xE0E0E0))
            static let avatar = token("border.avatar", "--tb-color-border-avatar", "rgba(15, 15, 15, 0.2)", .rgba(15, 15, 15, 0.2))
            static let avatarSoft = token("border.avatarSoft", "--tb-color-border-avatar-soft", "rgba(15, 15, 15, 0.15)", .rgba(15, 15, 15, 0.15))

            static let all = [card, subtle, `default`, strong, disabled, avatar, avatarSoft]
        }

        enum Icon {
            static let primary = token("icon.primary", "--tb-color-icon-primary", "#3F3F3F", .hex(0x3F3F3F))
            static let hover = token("icon.hover", "--tb-color-icon-hover", "#6F6F6F", .hex(0x6F6F6F))
            static let muted = token("icon.muted", "--tb-color-icon-muted", "#AFAFAF", .hex(0xAFAFAF))

            static let all = [primary, hover, muted]
        }

        enum State {
            static let success = token("state.success", "--tb-color-success", "#2F8F5B", .hex(0x2F8F5B))
            static let successSoft = token("state.successSoft", "--tb-color-success-soft", "#E6F4EC", .hex(0xE6F4EC))
            static let warning = token("state.warning", "--tb-color-warning", "#A8661A", .hex(0xA8661A))
            static let warningSoft = token("state.warningSoft", "--tb-color-warning-soft", "#FFF1DE", .hex(0xFFF1DE))

            static let all = [success, successSoft, warning, warningSoft]
        }

        static let all = Background.all + Surface.all + Text.all + Border.all + Icon.all + State.all

        private static func token(
            _ path: String,
            _ cssVariable: String,
            _ rawValue: String,
            _ value: TBDesignColorValue
        ) -> TBDesignColorToken {
            TBDesignColorToken("COLOR_TOKENS.\(path)", cssVariable: cssVariable, rawValue: rawValue, value: value)
        }
    }

    enum ShadowTokens {
        static let hover = token("hover", "0 1px 3px rgba(15, 15, 15, 0.06)")
        static let soft = token("soft", "0 4px 20px rgba(0, 0, 0, 0.1)")
        static let strong = token("strong", "0 12px 32px rgba(15, 15, 15, 0.12)")
        static let button = token("button", "0 8px 20px rgba(0, 0, 0, 0.1)")
        static let drawer = token("drawer", "0 20px 60px rgba(0, 0, 0, 0.24)")

        static let all = [hover, soft, strong, button, drawer]

        private static func token(_ path: String, _ rawValue: String) -> TBDesignColorToken {
            TBDesignColorToken("SHADOW_TOKENS.\(path)", rawValue: rawValue, value: .shadow(raw: rawValue))
        }
    }

    enum DataVizTokens {
        enum Progress {
            static let barTrack = token("progress.barTrack", "--tb-data-viz-progress-track", "#E8E8E8", .hex(0xE8E8E8))

            static let all = [barTrack]
        }

        enum Radar {
            static let gridColor = token("radar.gridColor", "--tb-data-viz-radar-grid", "#E8E8E8", .hex(0xE8E8E8))
            static let averageFill = token("radar.averageFill", "--tb-data-viz-radar-average-fill", "rgba(240, 240, 240, 0.6)", .rgba(240, 240, 240, 0.6))
            static let averageStroke = token("radar.averageStroke", "--tb-data-viz-radar-average-stroke", "#D0D0D0", .hex(0xD0D0D0))
            static let highlightFill = token("radar.highlightFill", "--tb-data-viz-radar-highlight-fill", "rgba(255, 153, 0, 0.12)", .rgba(255, 153, 0, 0.12))
            static let highlightStroke = token("radar.highlightStroke", "--tb-data-viz-radar-highlight-stroke", "#FF9900", .hex(0xFF9900))
            static let labelColor = token("radar.labelColor", "--tb-data-viz-radar-label-color", "#888888", .hex(0x888888))

            static let all = [gridColor, averageFill, averageStroke, highlightFill, highlightStroke, labelColor]
        }

        static let all = Progress.all + Radar.all

        private static func token(
            _ path: String,
            _ cssVariable: String,
            _ rawValue: String,
            _ value: TBDesignColorValue
        ) -> TBDesignColorToken {
            TBDesignColorToken("DATA_VIZ_TOKENS.\(path)", cssVariable: cssVariable, rawValue: rawValue, value: value)
        }
    }

    enum TasteTokens {
        enum Sweet {
            static let main = palette("sweet", "main", "--tb-taste-sweet-main", "#FF9900", .hex(0xFF9900))
            static let dark = palette("sweet", "dark", "--tb-taste-sweet-dark", "#CC7A00", .hex(0xCC7A00))
            static let light = palette("sweet", "light", "--tb-taste-sweet-light", "#FFCC80", .hex(0xFFCC80))
            static let bg = palette("sweet", "bg", "--tb-taste-sweet-bg", "#FFD699", .hex(0xFFD699))
            static let tintSoft = palette("sweet", "tintSoft", "--tb-taste-sweet-tint-soft", "rgba(255, 153, 0, 0.05)", .rgba(255, 153, 0, 0.05))
            static let tintSoftBorder = palette("sweet", "tintSoftBorder", "--tb-taste-sweet-tint-soft-border", "rgba(255, 153, 0, 0.18)", .rgba(255, 153, 0, 0.18))
            static let tintSurface = palette("sweet", "tintSurface", "--tb-taste-sweet-tint-surface", "#FFEBCC", .hex(0xFFEBCC))
            static let tintSurfaceSubText = palette("sweet", "tintSurfaceSubText", "--tb-taste-sweet-tint-surface-sub-text", "#896735", .hex(0x896735))
            static let tintSurfaceText = palette("sweet", "tintSurfaceText", "--tb-taste-sweet-tint-surface-text", "#6F4609", .hex(0x6F4609))
            static let gradient = palette("sweet", "gradient", "--tb-taste-sweet-gradient", "linear-gradient(135deg, #FF9900, #FFB84D)", .linearGradient(degrees: 135, stops: [0xFF9900, 0xFFB84D], raw: "linear-gradient(135deg, #FF9900, #FFB84D)"))

            static let accent = measurement("sweet", "accent", "--tb-taste-sweet-accent", "#FF9500", .hex(0xFF9500))
            static let node1 = loop("sweet", "nodeColors.0", "#FFF5E5", .hex(0xFFF5E5))
            static let node2 = loop("sweet", "nodeColors.1", "#FFEBCC", .hex(0xFFEBCC))
            static let node3 = loop("sweet", "nodeColors.2", "#FFE0B2", .hex(0xFFE0B2))
            static let node4 = loop("sweet", "nodeColors.3", "#FFD699", .hex(0xFFD699))
            static let node5 = loop("sweet", "nodeColors.4", "#FFCC7F", .hex(0xFFCC7F))
            static let node6 = loop("sweet", "nodeColors.5", "#FFC266", .hex(0xFFC266))
            static let node7 = loop("sweet", "nodeColors.6", "#FFB74C", .hex(0xFFB74C))
            static let node8 = loop("sweet", "nodeColors.7", "#FFAD33", .hex(0xFFAD33))
            static let node9 = loop("sweet", "nodeColors.8", "#FFA319", .hex(0xFFA319))
            static let node10 = loop("sweet", "nodeColors.9", "#FF9900", .hex(0xFF9900))
            static let ringBaseColor = loop("sweet", "ringBaseColor", "#FFEBCC", .hex(0xFFEBCC))
            static let ringBaseColorSoft = loop("sweet", "ringBaseColorSoft", "#FFEBCC1A", .hexRGBA(0xFFEBCC1A))
            static let ringGuideBaseColor = loop("sweet", "ringGuideBaseColor", "#FF9900", .hex(0xFF9900))
            static let glowTransparentColor = loop("sweet", "glowTransparentColor", "#FFEBCC08", .hexRGBA(0xFFEBCC08))

            static let paletteTokens = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient]
            static let nodeColors = [node1, node2, node3, node4, node5, node6, node7, node8, node9, node10]
            static let measurementTokens = [accent] + nodeColors + [ringBaseColor, ringBaseColorSoft, ringGuideBaseColor, glowTransparentColor]
            static let all = paletteTokens + measurementTokens
        }

        enum Sour {
            static let main = palette("sour", "main", "--tb-taste-sour-main", "#FBC02D", .hex(0xFBC02D))
            static let dark = palette("sour", "dark", "--tb-taste-sour-dark", "#C99A00", .hex(0xC99A00))
            static let light = palette("sour", "light", "--tb-taste-sour-light", "#FDD835", .hex(0xFDD835))
            static let bg = palette("sour", "bg", "--tb-taste-sour-bg", "#FFEF99", .hex(0xFFEF99))
            static let tintSoft = palette("sour", "tintSoft", "--tb-taste-sour-tint-soft", "rgba(251, 192, 45, 0.05)", .rgba(251, 192, 45, 0.05))
            static let tintSoftBorder = palette("sour", "tintSoftBorder", "--tb-taste-sour-tint-soft-border", "rgba(251, 192, 45, 0.18)", .rgba(251, 192, 45, 0.18))
            static let tintSurface = palette("sour", "tintSurface", "--tb-taste-sour-tint-surface", "#FFF7CC", .hex(0xFFF7CC))
            static let tintSurfaceSubText = palette("sour", "tintSurfaceSubText", "--tb-taste-sour-tint-surface-sub-text", "#897C35", .hex(0x897C35))
            static let tintSurfaceText = palette("sour", "tintSurfaceText", "--tb-taste-sour-tint-surface-text", "#6F5F09", .hex(0x6F5F09))
            static let gradient = palette("sour", "gradient", "--tb-taste-sour-gradient", "linear-gradient(135deg, #FBC02D, #FFD54F)", .linearGradient(degrees: 135, stops: [0xFBC02D, 0xFFD54F], raw: "linear-gradient(135deg, #FBC02D, #FFD54F)"))

            static let accent = measurement("sour", "accent", "--tb-taste-sour-accent", "#FFD600", .hex(0xFFD600))
            static let node1 = loop("sour", "nodeColors.0", "#FFF7CC", .hex(0xFFF7CC))
            static let node2 = loop("sour", "nodeColors.1", "#FFF4B8", .hex(0xFFF4B8))
            static let node3 = loop("sour", "nodeColors.2", "#FFF1A3", .hex(0xFFF1A3))
            static let node4 = loop("sour", "nodeColors.3", "#FFEE8F", .hex(0xFFEE8F))
            static let node5 = loop("sour", "nodeColors.4", "#FFEB7A", .hex(0xFFEB7A))
            static let node6 = loop("sour", "nodeColors.5", "#FFE866", .hex(0xFFE866))
            static let node7 = loop("sour", "nodeColors.6", "#FFE552", .hex(0xFFE552))
            static let node8 = loop("sour", "nodeColors.7", "#FFE23D", .hex(0xFFE23D))
            static let node9 = loop("sour", "nodeColors.8", "#FFDF29", .hex(0xFFDF29))
            static let node10 = loop("sour", "nodeColors.9", "#FFD600", .hex(0xFFD600))
            static let ringBaseColor = loop("sour", "ringBaseColor", "#FFF7CC", .hex(0xFFF7CC))
            static let ringBaseColorSoft = loop("sour", "ringBaseColorSoft", "#FFF7CC1A", .hexRGBA(0xFFF7CC1A))
            static let ringGuideBaseColor = loop("sour", "ringGuideBaseColor", "#FFD600", .hex(0xFFD600))
            static let glowTransparentColor = loop("sour", "glowTransparentColor", "#FFF7CC08", .hexRGBA(0xFFF7CC08))

            static let paletteTokens = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient]
            static let nodeColors = [node1, node2, node3, node4, node5, node6, node7, node8, node9, node10]
            static let measurementTokens = [accent] + nodeColors + [ringBaseColor, ringBaseColorSoft, ringGuideBaseColor, glowTransparentColor]
            static let all = paletteTokens + measurementTokens
        }

        enum Bitter {
            static let main = palette("bitter", "main", "--tb-taste-bitter-main", "#95C900", .hex(0x95C900))
            static let dark = palette("bitter", "dark", "--tb-taste-bitter-dark", "#6E9600", .hex(0x6E9600))
            static let light = palette("bitter", "light", "--tb-taste-bitter-light", "#E6EE9C", .hex(0xE6EE9C))
            static let bg = palette("bitter", "bg", "--tb-taste-bitter-bg", "#E0EBB4", .hex(0xE0EBB4))
            static let tintSoft = palette("bitter", "tintSoft", "--tb-taste-bitter-tint-soft", "rgba(149, 201, 0, 0.05)", .rgba(149, 201, 0, 0.05))
            static let tintSoftBorder = palette("bitter", "tintSoftBorder", "--tb-taste-bitter-tint-soft-border", "rgba(149, 201, 0, 0.18)", .rgba(149, 201, 0, 0.18))
            static let tintSurface = palette("bitter", "tintSurface", "--tb-taste-bitter-tint-surface", "#EAF4CC", .hex(0xEAF4CC))
            static let tintSurfaceSubText = palette("bitter", "tintSurfaceSubText", "--tb-taste-bitter-tint-surface-sub-text", "#70794B", .hex(0x70794B))
            static let tintSurfaceText = palette("bitter", "tintSurfaceText", "--tb-taste-bitter-tint-surface-text", "#505B24", .hex(0x505B24))
            static let gradient = palette("bitter", "gradient", "--tb-taste-bitter-gradient", "linear-gradient(135deg, #95C900, #AED581)", .linearGradient(degrees: 135, stops: [0x95C900, 0xAED581], raw: "linear-gradient(135deg, #95C900, #AED581)"))

            static let accent = measurement("bitter", "accent", "--tb-taste-bitter-accent", "#8CC600", .hex(0x8CC600))
            static let node1 = loop("bitter", "nodeColors.0", "#EAF4CC", .hex(0xEAF4CC))
            static let node2 = loop("bitter", "nodeColors.1", "#E1EFC0", .hex(0xE1EFC0))
            static let node3 = loop("bitter", "nodeColors.2", "#D8EAB4", .hex(0xD8EAB4))
            static let node4 = loop("bitter", "nodeColors.3", "#CFE5A8", .hex(0xCFE5A8))
            static let node5 = loop("bitter", "nodeColors.4", "#C5DF9C", .hex(0xC5DF9C))
            static let node6 = loop("bitter", "nodeColors.5", "#BCDA90", .hex(0xBCDA90))
            static let node7 = loop("bitter", "nodeColors.6", "#B3D584", .hex(0xB3D584))
            static let node8 = loop("bitter", "nodeColors.7", "#AAD078", .hex(0xAAD078))
            static let node9 = loop("bitter", "nodeColors.8", "#A0CB6C", .hex(0xA0CB6C))
            static let node10 = loop("bitter", "nodeColors.9", "#95C900", .hex(0x95C900))
            static let ringBaseColor = loop("bitter", "ringBaseColor", "#EAF4CC", .hex(0xEAF4CC))
            static let ringBaseColorSoft = loop("bitter", "ringBaseColorSoft", "#EAF4CC1A", .hexRGBA(0xEAF4CC1A))
            static let ringGuideBaseColor = loop("bitter", "ringGuideBaseColor", "#95C900", .hex(0x95C900))
            static let glowTransparentColor = loop("bitter", "glowTransparentColor", "#EAF4CC08", .hexRGBA(0xEAF4CC08))

            static let paletteTokens = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient]
            static let nodeColors = [node1, node2, node3, node4, node5, node6, node7, node8, node9, node10]
            static let measurementTokens = [accent] + nodeColors + [ringBaseColor, ringBaseColorSoft, ringGuideBaseColor, glowTransparentColor]
            static let all = paletteTokens + measurementTokens
        }

        enum Salty {
            static let main = palette("salty", "main", "--tb-taste-salty-main", "#7299FF", .hex(0x7299FF))
            static let dark = palette("salty", "dark", "--tb-taste-salty-dark", "#4A70CC", .hex(0x4A70CC))
            static let light = palette("salty", "light", "--tb-taste-salty-light", "#90CAF9", .hex(0x90CAF9))
            static let bg = palette("salty", "bg", "--tb-taste-salty-bg", "#C6D6FF", .hex(0xC6D6FF))
            static let tintSoft = palette("salty", "tintSoft", "--tb-taste-salty-tint-soft", "rgba(114, 153, 255, 0.05)", .rgba(114, 153, 255, 0.05))
            static let tintSoftBorder = palette("salty", "tintSoftBorder", "--tb-taste-salty-tint-soft-border", "rgba(114, 153, 255, 0.18)", .rgba(114, 153, 255, 0.18))
            static let tintSurface = palette("salty", "tintSurface", "--tb-taste-salty-tint-surface", "#E3EBFF", .hex(0xE3EBFF))
            static let tintSurfaceSubText = palette("salty", "tintSurfaceSubText", "--tb-taste-salty-tint-surface-sub-text", "#5A6789", .hex(0x5A6789))
            static let tintSurfaceText = palette("salty", "tintSurfaceText", "--tb-taste-salty-tint-surface-text", "#36466F", .hex(0x36466F))
            static let gradient = palette("salty", "gradient", "--tb-taste-salty-gradient", "linear-gradient(135deg, #7299FF, #9FBFFF)", .linearGradient(degrees: 135, stops: [0x7299FF, 0x9FBFFF], raw: "linear-gradient(135deg, #7299FF, #9FBFFF)"))

            static let accent = measurement("salty", "accent", "--tb-taste-salty-accent", "#5898FF", .hex(0x5898FF))
            static let node1 = loop("salty", "nodeColors.0", "#E3EBFF", .hex(0xE3EBFF))
            static let node2 = loop("salty", "nodeColors.1", "#D6E2FF", .hex(0xD6E2FF))
            static let node3 = loop("salty", "nodeColors.2", "#C9D9FF", .hex(0xC9D9FF))
            static let node4 = loop("salty", "nodeColors.3", "#BCD0FF", .hex(0xBCD0FF))
            static let node5 = loop("salty", "nodeColors.4", "#AFC7FF", .hex(0xAFC7FF))
            static let node6 = loop("salty", "nodeColors.5", "#A2BEFF", .hex(0xA2BEFF))
            static let node7 = loop("salty", "nodeColors.6", "#95B5FF", .hex(0x95B5FF))
            static let node8 = loop("salty", "nodeColors.7", "#88ACFF", .hex(0x88ACFF))
            static let node9 = loop("salty", "nodeColors.8", "#7BA3FF", .hex(0x7BA3FF))
            static let node10 = loop("salty", "nodeColors.9", "#7299FF", .hex(0x7299FF))
            static let ringBaseColor = loop("salty", "ringBaseColor", "#E3EBFF", .hex(0xE3EBFF))
            static let ringBaseColorSoft = loop("salty", "ringBaseColorSoft", "#E3EBFF1A", .hexRGBA(0xE3EBFF1A))
            static let ringGuideBaseColor = loop("salty", "ringGuideBaseColor", "#7299FF", .hex(0x7299FF))
            static let glowTransparentColor = loop("salty", "glowTransparentColor", "#E3EBFF08", .hexRGBA(0xE3EBFF08))

            static let paletteTokens = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient]
            static let nodeColors = [node1, node2, node3, node4, node5, node6, node7, node8, node9, node10]
            static let measurementTokens = [accent] + nodeColors + [ringBaseColor, ringBaseColorSoft, ringGuideBaseColor, glowTransparentColor]
            static let all = paletteTokens + measurementTokens
        }

        enum Umami {
            static let main = palette("umami", "main", "--tb-taste-umami-main", "#B372B4", .hex(0xB372B4))
            static let dark = palette("umami", "dark", "--tb-taste-umami-dark", "#8A5490", .hex(0x8A5490))
            static let light = palette("umami", "light", "--tb-taste-umami-light", "#CE93D8", .hex(0xCE93D8))
            static let bg = palette("umami", "bg", "--tb-taste-umami-bg", "#E1C7E1", .hex(0xE1C7E1))
            static let tintSoft = palette("umami", "tintSoft", "--tb-taste-umami-tint-soft", "rgba(179, 114, 180, 0.05)", .rgba(179, 114, 180, 0.05))
            static let tintSoftBorder = palette("umami", "tintSoftBorder", "--tb-taste-umami-tint-soft-border", "rgba(179, 114, 180, 0.18)", .rgba(179, 114, 180, 0.18))
            static let tintSurface = palette("umami", "tintSurface", "--tb-taste-umami-tint-surface", "#F0E3F0", .hex(0xF0E3F0))
            static let tintSurfaceSubText = palette("umami", "tintSurfaceSubText", "--tb-taste-umami-tint-surface-sub-text", "#705B70", .hex(0x705B70))
            static let tintSurfaceText = palette("umami", "tintSurfaceText", "--tb-taste-umami-tint-surface-text", "#513751", .hex(0x513751))
            static let gradient = palette("umami", "gradient", "--tb-taste-umami-gradient", "linear-gradient(135deg, #B372B4, #CE93D8)", .linearGradient(degrees: 135, stops: [0xB372B4, 0xCE93D8], raw: "linear-gradient(135deg, #B372B4, #CE93D8)"))

            static let accent = measurement("umami", "accent", "--tb-taste-umami-accent", "#AF52DE", .hex(0xAF52DE))
            static let node1 = loop("umami", "nodeColors.0", "#F0E3F0", .hex(0xF0E3F0))
            static let node2 = loop("umami", "nodeColors.1", "#E7D7E8", .hex(0xE7D7E8))
            static let node3 = loop("umami", "nodeColors.2", "#DECAE0", .hex(0xDECAE0))
            static let node4 = loop("umami", "nodeColors.3", "#D5BED8", .hex(0xD5BED8))
            static let node5 = loop("umami", "nodeColors.4", "#CCB1D0", .hex(0xCCB1D0))
            static let node6 = loop("umami", "nodeColors.5", "#C3A5C8", .hex(0xC3A5C8))
            static let node7 = loop("umami", "nodeColors.6", "#BA98C0", .hex(0xBA98C0))
            static let node8 = loop("umami", "nodeColors.7", "#B18CB8", .hex(0xB18CB8))
            static let node9 = loop("umami", "nodeColors.8", "#A87FB0", .hex(0xA87FB0))
            static let node10 = loop("umami", "nodeColors.9", "#B372B4", .hex(0xB372B4))
            static let ringBaseColor = loop("umami", "ringBaseColor", "#F0E3F0", .hex(0xF0E3F0))
            static let ringBaseColorSoft = loop("umami", "ringBaseColorSoft", "#F0E3F01A", .hexRGBA(0xF0E3F01A))
            static let ringGuideBaseColor = loop("umami", "ringGuideBaseColor", "#B372B4", .hex(0xB372B4))
            static let glowTransparentColor = loop("umami", "glowTransparentColor", "#F0E3F008", .hexRGBA(0xF0E3F008))

            static let paletteTokens = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient]
            static let nodeColors = [node1, node2, node3, node4, node5, node6, node7, node8, node9, node10]
            static let measurementTokens = [accent] + nodeColors + [ringBaseColor, ringBaseColorSoft, ringGuideBaseColor, glowTransparentColor]
            static let all = paletteTokens + measurementTokens
        }

        enum Fat {
            static let main = palette("fat", "main", "--tb-taste-fat-main", "#95867A", .hex(0x95867A))
            static let dark = palette("fat", "dark", "--tb-taste-fat-dark", "#6B5E54", .hex(0x6B5E54))
            static let light = palette("fat", "light", "--tb-taste-fat-light", "#BCAAA4", .hex(0xBCAAA4))
            static let bg = palette("fat", "bg", "--tb-taste-fat-bg", "#D5CFCA", .hex(0xD5CFCA))
            static let tintSoft = palette("fat", "tintSoft", "--tb-taste-fat-tint-soft", "rgba(149, 134, 122, 0.05)", .rgba(149, 134, 122, 0.05))
            static let tintSoftBorder = palette("fat", "tintSoftBorder", "--tb-taste-fat-tint-soft-border", "rgba(149, 134, 122, 0.18)", .rgba(149, 134, 122, 0.18))
            static let tintSurface = palette("fat", "tintSurface", "--tb-taste-fat-tint-surface", "#EAE7E4", .hex(0xEAE7E4))
            static let tintSurfaceSubText = palette("fat", "tintSurfaceSubText", "--tb-taste-fat-tint-surface-sub-text", "#66625D", .hex(0x66625D))
            static let tintSurfaceText = palette("fat", "tintSurfaceText", "--tb-taste-fat-tint-surface-text", "#453F3A", .hex(0x453F3A))
            static let gradient = palette("fat", "gradient", "--tb-taste-fat-gradient", "linear-gradient(135deg, #95867A, #B0A49A)", .linearGradient(degrees: 135, stops: [0x95867A, 0xB0A49A], raw: "linear-gradient(135deg, #95867A, #B0A49A)"))

            static let accent = measurement("fat", "accent", "--tb-taste-fat-accent", "#8E8279", .hex(0x8E8279))
            static let node1 = loop("fat", "nodeColors.0", "#EAE7E4", .hex(0xEAE7E4))
            static let node2 = loop("fat", "nodeColors.1", "#E2DEDA", .hex(0xE2DEDA))
            static let node3 = loop("fat", "nodeColors.2", "#DAD5D0", .hex(0xDAD5D0))
            static let node4 = loop("fat", "nodeColors.3", "#D2CCC6", .hex(0xD2CCC6))
            static let node5 = loop("fat", "nodeColors.4", "#CAC3BC", .hex(0xCAC3BC))
            static let node6 = loop("fat", "nodeColors.5", "#C2BAB2", .hex(0xC2BAB2))
            static let node7 = loop("fat", "nodeColors.6", "#BAB1A8", .hex(0xBAB1A8))
            static let node8 = loop("fat", "nodeColors.7", "#B2A89E", .hex(0xB2A89E))
            static let node9 = loop("fat", "nodeColors.8", "#AA9F94", .hex(0xAA9F94))
            static let node10 = loop("fat", "nodeColors.9", "#95867A", .hex(0x95867A))
            static let ringBaseColor = loop("fat", "ringBaseColor", "#EAE7E4", .hex(0xEAE7E4))
            static let ringBaseColorSoft = loop("fat", "ringBaseColorSoft", "#EAE7E41A", .hexRGBA(0xEAE7E41A))
            static let ringGuideBaseColor = loop("fat", "ringGuideBaseColor", "#95867A", .hex(0x95867A))
            static let glowTransparentColor = loop("fat", "glowTransparentColor", "#EAE7E408", .hexRGBA(0xEAE7E408))

            static let paletteTokens = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient]
            static let nodeColors = [node1, node2, node3, node4, node5, node6, node7, node8, node9, node10]
            static let measurementTokens = [accent] + nodeColors + [ringBaseColor, ringBaseColorSoft, ringGuideBaseColor, glowTransparentColor]
            static let all = paletteTokens + measurementTokens
        }

        static let all = Sweet.all + Sour.all + Bitter.all + Salty.all + Umami.all + Fat.all

        static func all(for axis: TasteAxis) -> [TBDesignColorToken] {
            switch axis {
            case .sweet: Sweet.all
            case .sour: Sour.all
            case .bitter: Bitter.all
            case .salty: Salty.all
            case .umami: Umami.all
            case .fat: Fat.all
            }
        }

        static func paletteMain(for axis: TasteAxis) -> TBDesignColorToken {
            switch axis {
            case .sweet: Sweet.main
            case .sour: Sour.main
            case .bitter: Bitter.main
            case .salty: Salty.main
            case .umami: Umami.main
            case .fat: Fat.main
            }
        }

        private static func palette(
            _ tasteId: String,
            _ path: String,
            _ cssVariable: String,
            _ rawValue: String,
            _ value: TBDesignColorValue
        ) -> TBDesignColorToken {
            TBDesignColorToken(
                "TASTE_TOKENS.\(tasteId).palette.\(path)",
                cssVariable: cssVariable,
                rawValue: rawValue,
                value: value
            )
        }

        private static func measurement(
            _ tasteId: String,
            _ path: String,
            _ cssVariable: String,
            _ rawValue: String,
            _ value: TBDesignColorValue
        ) -> TBDesignColorToken {
            TBDesignColorToken(
                "TASTE_TOKENS.\(tasteId).measurement.\(path)",
                cssVariable: cssVariable,
                rawValue: rawValue,
                value: value
            )
        }

        private static func loop(
            _ tasteId: String,
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignColorValue
        ) -> TBDesignColorToken {
            TBDesignColorToken(
                "TASTE_TOKENS.\(tasteId).measurement.loop.\(path)",
                rawValue: rawValue,
                value: value
            )
        }
    }

    enum NeutralTasteTokens {
        static let main = TBDesignColorToken(
            "NEUTRAL_TASTE_TOKENS.palette.main",
            cssVariable: "--tb-taste-neutral-main",
            rawValue: "#7A7A7A",
            value: .hex(0x7A7A7A)
        )
        static let tintSurface = TBDesignColorToken(
            "NEUTRAL_TASTE_TOKENS.palette.tintSurface",
            cssVariable: "--tb-taste-neutral-tint-surface",
            rawValue: "#E4E4E4",
            value: .hex(0xE4E4E4)
        )

        static let all = [main, tintSurface]
    }

    enum CSSVariables {
        enum Color {
            static let bgPage = css("--tb-color-bg-page", "#f3f3f3", .hex(0xF3F3F3))
            static let bgFocus = css("--tb-color-bg-focus", "#ffffff", .hex(0xFFFFFF))
            static let surfaceBase = css("--tb-color-surface-base", "#ffffff", .hex(0xFFFFFF))
            static let surfaceCard = css("--tb-color-surface-card", "#ffffff", .hex(0xFFFFFF))
            static let surfaceCardHover = css("--tb-color-surface-card-hover", "#fafafa", .hex(0xFAFAFA))
            static let surfaceMuted = css("--tb-color-surface-muted", "#f7f7f7", .hex(0xF7F7F7))
            static let surfaceElevated = css("--tb-color-surface-elevated", "#fcfcfc", .hex(0xFCFCFC))
            static let surfaceDisabled = css("--tb-color-surface-disabled", "#efefef", .hex(0xEFEFEF))
            static let surfaceOverlay = css("--tb-color-surface-overlay", "rgba(255, 255, 255, 0.8)", .rgba(255, 255, 255, 0.8))
            static let textPrimary = css("--tb-color-text-primary", "#0f0f0f", .hex(0x0F0F0F))
            static let textSecondary = css("--tb-color-text-secondary", "#3f3f3f", .hex(0x3F3F3F))
            static let textTertiary = css("--tb-color-text-tertiary", "#535353", .hex(0x535353))
            static let textBody = css("--tb-color-text-body", "#666666", .hex(0x666666))
            static let textHint = css("--tb-color-text-hint", "#888888", .hex(0x888888))
            static let textDisabled = css("--tb-color-text-disabled", "#afafaf", .hex(0xAFAFAF))
            static let textInverse = css("--tb-color-text-inverse", "#ffffff", .hex(0xFFFFFF))
            static let textSubtle = css("--tb-color-text-subtle", "rgba(15, 15, 15, 0.6)", .rgba(15, 15, 15, 0.6))
            static let textMuted = css("--tb-color-text-muted", "rgba(15, 15, 15, 0.5)", .rgba(15, 15, 15, 0.5))
            static let textFaint = css("--tb-color-text-faint", "rgba(15, 15, 15, 0.4)", .rgba(15, 15, 15, 0.4))
            static let borderCard = css("--tb-color-border-card", "#f0f0f0", .hex(0xF0F0F0))
            static let borderSubtle = css("--tb-color-border-subtle", "#e8e8e8", .hex(0xE8E8E8))
            static let borderDefault = css("--tb-color-border-default", "#e7e7e7", .hex(0xE7E7E7))
            static let borderStrong = css("--tb-color-border-strong", "#e5e5e5", .hex(0xE5E5E5))
            static let borderDisabled = css("--tb-color-border-disabled", "#e0e0e0", .hex(0xE0E0E0))
            static let borderAvatar = css("--tb-color-border-avatar", "rgba(15, 15, 15, 0.2)", .rgba(15, 15, 15, 0.2))
            static let borderAvatarSoft = css("--tb-color-border-avatar-soft", "rgba(15, 15, 15, 0.15)", .rgba(15, 15, 15, 0.15))
            static let iconPrimary = css("--tb-color-icon-primary", "#3f3f3f", .hex(0x3F3F3F))
            static let iconHover = css("--tb-color-icon-hover", "#6f6f6f", .hex(0x6F6F6F))
            static let iconMuted = css("--tb-color-icon-muted", "#afafaf", .hex(0xAFAFAF))
            static let success = css("--tb-color-success", "#2f8f5b", .hex(0x2F8F5B))
            static let successSoft = css("--tb-color-success-soft", "#e6f4ec", .hex(0xE6F4EC))
            static let warning = css("--tb-color-warning", "#a8661a", .hex(0xA8661A))
            static let warningSoft = css("--tb-color-warning-soft", "#fff1de", .hex(0xFFF1DE))

            static let all = [
                bgPage, bgFocus,
                surfaceBase, surfaceCard, surfaceCardHover, surfaceMuted, surfaceElevated, surfaceDisabled, surfaceOverlay,
                textPrimary, textSecondary, textTertiary, textBody, textHint, textDisabled, textInverse, textSubtle, textMuted, textFaint,
                borderCard, borderSubtle, borderDefault, borderStrong, borderDisabled, borderAvatar, borderAvatarSoft,
                iconPrimary, iconHover, iconMuted,
                success, successSoft, warning, warningSoft
            ]
        }

        enum Shadow {
            static let hover = shadow("--tb-shadow-hover", "0 1px 3px rgba(15, 15, 15, 0.06)")
            static let soft = shadow("--tb-shadow-soft", "0 4px 20px rgba(0, 0, 0, 0.1)")
            static let strong = shadow("--tb-shadow-strong", "0 12px 32px rgba(15, 15, 15, 0.12)")
            static let button = shadow("--tb-shadow-button", "0 8px 20px rgba(0, 0, 0, 0.1)")
            static let drawer = shadow("--tb-shadow-drawer", "0 20px 60px rgba(0, 0, 0, 0.24)")
            static let badgeElevated = shadow("--tb-shadow-badge-elevated", "0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)")

            static let all = [hover, soft, strong, button, drawer, badgeElevated]
        }

        enum DataViz {
            static let progressTrack = css("--tb-data-viz-progress-track", "#e8e8e8", .hex(0xE8E8E8))
            static let radarGrid = css("--tb-data-viz-radar-grid", "#e8e8e8", .hex(0xE8E8E8))
            static let radarAverageFill = css("--tb-data-viz-radar-average-fill", "rgba(240, 240, 240, 0.6)", .rgba(240, 240, 240, 0.6))
            static let radarAverageStroke = css("--tb-data-viz-radar-average-stroke", "#d0d0d0", .hex(0xD0D0D0))
            static let radarHighlightFill = css("--tb-data-viz-radar-highlight-fill", "rgba(255, 153, 0, 0.12)", .rgba(255, 153, 0, 0.12))
            static let radarHighlightStroke = css("--tb-data-viz-radar-highlight-stroke", "#ff9900", .hex(0xFF9900))
            static let radarLabelColor = css("--tb-data-viz-radar-label-color", "#888888", .hex(0x888888))

            static let all = [
                progressTrack,
                radarGrid, radarAverageFill, radarAverageStroke, radarHighlightFill, radarHighlightStroke, radarLabelColor
            ]
        }

        enum Taste {
            enum Sweet {
                static let main = css("--tb-taste-sweet-main", "#ff9900", .hex(0xFF9900))
                static let dark = css("--tb-taste-sweet-dark", "#cc7a00", .hex(0xCC7A00))
                static let light = css("--tb-taste-sweet-light", "#ffcc80", .hex(0xFFCC80))
                static let bg = css("--tb-taste-sweet-bg", "#ffd699", .hex(0xFFD699))
                static let tintSoft = css("--tb-taste-sweet-tint-soft", "rgba(255, 153, 0, 0.05)", .rgba(255, 153, 0, 0.05))
                static let tintSoftBorder = css("--tb-taste-sweet-tint-soft-border", "rgba(255, 153, 0, 0.18)", .rgba(255, 153, 0, 0.18))
                static let tintSurface = css("--tb-taste-sweet-tint-surface", "#ffebcc", .hex(0xFFEBCC))
                static let tintSurfaceSubText = css("--tb-taste-sweet-tint-surface-sub-text", "#896735", .hex(0x896735))
                static let tintSurfaceText = css("--tb-taste-sweet-tint-surface-text", "#6f4609", .hex(0x6F4609))
                static let gradient = css("--tb-taste-sweet-gradient", "linear-gradient(135deg, #ff9900, #ffb84d)", .linearGradient(degrees: 135, stops: [0xFF9900, 0xFFB84D], raw: "linear-gradient(135deg, #ff9900, #ffb84d)"))
                static let accent = css("--tb-taste-sweet-accent", "#ff9500", .hex(0xFF9500))
                static let ringBase = css("--tb-taste-sweet-ring-base", "var(--tb-taste-sweet-tint-surface)", .alias(cssVariable: "--tb-taste-sweet-tint-surface"))
                static let ringGuide = css("--tb-taste-sweet-ring-guide", "#ff9900", .hex(0xFF9900))

                static let all = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient, accent, ringBase, ringGuide]
            }

            enum Sour {
                static let main = css("--tb-taste-sour-main", "#fbc02d", .hex(0xFBC02D))
                static let dark = css("--tb-taste-sour-dark", "#c99a00", .hex(0xC99A00))
                static let light = css("--tb-taste-sour-light", "#fdd835", .hex(0xFDD835))
                static let bg = css("--tb-taste-sour-bg", "#ffef99", .hex(0xFFEF99))
                static let tintSoft = css("--tb-taste-sour-tint-soft", "rgba(251, 192, 45, 0.05)", .rgba(251, 192, 45, 0.05))
                static let tintSoftBorder = css("--tb-taste-sour-tint-soft-border", "rgba(251, 192, 45, 0.18)", .rgba(251, 192, 45, 0.18))
                static let tintSurface = css("--tb-taste-sour-tint-surface", "#fff7cc", .hex(0xFFF7CC))
                static let tintSurfaceSubText = css("--tb-taste-sour-tint-surface-sub-text", "#897c35", .hex(0x897C35))
                static let tintSurfaceText = css("--tb-taste-sour-tint-surface-text", "#6f5f09", .hex(0x6F5F09))
                static let gradient = css("--tb-taste-sour-gradient", "linear-gradient(135deg, #fbc02d, #ffd54f)", .linearGradient(degrees: 135, stops: [0xFBC02D, 0xFFD54F], raw: "linear-gradient(135deg, #fbc02d, #ffd54f)"))
                static let accent = css("--tb-taste-sour-accent", "#ffd600", .hex(0xFFD600))
                static let ringBase = css("--tb-taste-sour-ring-base", "var(--tb-taste-sour-tint-surface)", .alias(cssVariable: "--tb-taste-sour-tint-surface"))
                static let ringGuide = css("--tb-taste-sour-ring-guide", "#ffd600", .hex(0xFFD600))

                static let all = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient, accent, ringBase, ringGuide]
            }

            enum Bitter {
                static let main = css("--tb-taste-bitter-main", "#95c900", .hex(0x95C900))
                static let dark = css("--tb-taste-bitter-dark", "#6e9600", .hex(0x6E9600))
                static let light = css("--tb-taste-bitter-light", "#e6ee9c", .hex(0xE6EE9C))
                static let bg = css("--tb-taste-bitter-bg", "#e0ebb4", .hex(0xE0EBB4))
                static let tintSoft = css("--tb-taste-bitter-tint-soft", "rgba(149, 201, 0, 0.05)", .rgba(149, 201, 0, 0.05))
                static let tintSoftBorder = css("--tb-taste-bitter-tint-soft-border", "rgba(149, 201, 0, 0.18)", .rgba(149, 201, 0, 0.18))
                static let tintSurface = css("--tb-taste-bitter-tint-surface", "#eaf4cc", .hex(0xEAF4CC))
                static let tintSurfaceSubText = css("--tb-taste-bitter-tint-surface-sub-text", "#70794b", .hex(0x70794B))
                static let tintSurfaceText = css("--tb-taste-bitter-tint-surface-text", "#505b24", .hex(0x505B24))
                static let gradient = css("--tb-taste-bitter-gradient", "linear-gradient(135deg, #95c900, #aed581)", .linearGradient(degrees: 135, stops: [0x95C900, 0xAED581], raw: "linear-gradient(135deg, #95c900, #aed581)"))
                static let accent = css("--tb-taste-bitter-accent", "#8cc600", .hex(0x8CC600))
                static let ringBase = css("--tb-taste-bitter-ring-base", "var(--tb-taste-bitter-tint-surface)", .alias(cssVariable: "--tb-taste-bitter-tint-surface"))
                static let ringGuide = css("--tb-taste-bitter-ring-guide", "#95c900", .hex(0x95C900))

                static let all = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient, accent, ringBase, ringGuide]
            }

            enum Salty {
                static let main = css("--tb-taste-salty-main", "#7299ff", .hex(0x7299FF))
                static let dark = css("--tb-taste-salty-dark", "#4a70cc", .hex(0x4A70CC))
                static let light = css("--tb-taste-salty-light", "#90caf9", .hex(0x90CAF9))
                static let bg = css("--tb-taste-salty-bg", "#c6d6ff", .hex(0xC6D6FF))
                static let tintSoft = css("--tb-taste-salty-tint-soft", "rgba(114, 153, 255, 0.05)", .rgba(114, 153, 255, 0.05))
                static let tintSoftBorder = css("--tb-taste-salty-tint-soft-border", "rgba(114, 153, 255, 0.18)", .rgba(114, 153, 255, 0.18))
                static let tintSurface = css("--tb-taste-salty-tint-surface", "#e3ebff", .hex(0xE3EBFF))
                static let tintSurfaceSubText = css("--tb-taste-salty-tint-surface-sub-text", "#5a6789", .hex(0x5A6789))
                static let tintSurfaceText = css("--tb-taste-salty-tint-surface-text", "#36466f", .hex(0x36466F))
                static let gradient = css("--tb-taste-salty-gradient", "linear-gradient(135deg, #7299ff, #9fbfff)", .linearGradient(degrees: 135, stops: [0x7299FF, 0x9FBFFF], raw: "linear-gradient(135deg, #7299ff, #9fbfff)"))
                static let accent = css("--tb-taste-salty-accent", "#5898ff", .hex(0x5898FF))
                static let ringBase = css("--tb-taste-salty-ring-base", "var(--tb-taste-salty-tint-surface)", .alias(cssVariable: "--tb-taste-salty-tint-surface"))
                static let ringGuide = css("--tb-taste-salty-ring-guide", "#7299ff", .hex(0x7299FF))

                static let all = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient, accent, ringBase, ringGuide]
            }

            enum Umami {
                static let main = css("--tb-taste-umami-main", "#b372b4", .hex(0xB372B4))
                static let dark = css("--tb-taste-umami-dark", "#8a5490", .hex(0x8A5490))
                static let light = css("--tb-taste-umami-light", "#ce93d8", .hex(0xCE93D8))
                static let bg = css("--tb-taste-umami-bg", "#e1c7e1", .hex(0xE1C7E1))
                static let tintSoft = css("--tb-taste-umami-tint-soft", "rgba(179, 114, 180, 0.05)", .rgba(179, 114, 180, 0.05))
                static let tintSoftBorder = css("--tb-taste-umami-tint-soft-border", "rgba(179, 114, 180, 0.18)", .rgba(179, 114, 180, 0.18))
                static let tintSurface = css("--tb-taste-umami-tint-surface", "#f0e3f0", .hex(0xF0E3F0))
                static let tintSurfaceSubText = css("--tb-taste-umami-tint-surface-sub-text", "#705b70", .hex(0x705B70))
                static let tintSurfaceText = css("--tb-taste-umami-tint-surface-text", "#513751", .hex(0x513751))
                static let gradient = css("--tb-taste-umami-gradient", "linear-gradient(135deg, #b372b4, #ce93d8)", .linearGradient(degrees: 135, stops: [0xB372B4, 0xCE93D8], raw: "linear-gradient(135deg, #b372b4, #ce93d8)"))
                static let accent = css("--tb-taste-umami-accent", "#af52de", .hex(0xAF52DE))
                static let ringBase = css("--tb-taste-umami-ring-base", "var(--tb-taste-umami-tint-surface)", .alias(cssVariable: "--tb-taste-umami-tint-surface"))
                static let ringGuide = css("--tb-taste-umami-ring-guide", "#b372b4", .hex(0xB372B4))

                static let all = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient, accent, ringBase, ringGuide]
            }

            enum Fat {
                static let main = css("--tb-taste-fat-main", "#95867a", .hex(0x95867A))
                static let dark = css("--tb-taste-fat-dark", "#6b5e54", .hex(0x6B5E54))
                static let light = css("--tb-taste-fat-light", "#bcaaa4", .hex(0xBCAAA4))
                static let bg = css("--tb-taste-fat-bg", "#d5cfca", .hex(0xD5CFCA))
                static let tintSoft = css("--tb-taste-fat-tint-soft", "rgba(149, 134, 122, 0.05)", .rgba(149, 134, 122, 0.05))
                static let tintSoftBorder = css("--tb-taste-fat-tint-soft-border", "rgba(149, 134, 122, 0.18)", .rgba(149, 134, 122, 0.18))
                static let tintSurface = css("--tb-taste-fat-tint-surface", "#eae7e4", .hex(0xEAE7E4))
                static let tintSurfaceSubText = css("--tb-taste-fat-tint-surface-sub-text", "#66625d", .hex(0x66625D))
                static let tintSurfaceText = css("--tb-taste-fat-tint-surface-text", "#453f3a", .hex(0x453F3A))
                static let gradient = css("--tb-taste-fat-gradient", "linear-gradient(135deg, #95867a, #b0a49a)", .linearGradient(degrees: 135, stops: [0x95867A, 0xB0A49A], raw: "linear-gradient(135deg, #95867a, #b0a49a)"))
                static let accent = css("--tb-taste-fat-accent", "#8e8279", .hex(0x8E8279))
                static let ringBase = css("--tb-taste-fat-ring-base", "var(--tb-taste-fat-tint-surface)", .alias(cssVariable: "--tb-taste-fat-tint-surface"))
                static let ringGuide = css("--tb-taste-fat-ring-guide", "#95867a", .hex(0x95867A))

                static let all = [main, dark, light, bg, tintSoft, tintSoftBorder, tintSurface, tintSurfaceSubText, tintSurfaceText, gradient, accent, ringBase, ringGuide]
            }

            static let all = Sweet.all + Sour.all + Bitter.all + Salty.all + Umami.all + Fat.all
        }

        enum NeutralTaste {
            static let main = css("--tb-taste-neutral-main", "#7a7a7a", .hex(0x7A7A7A))
            static let tintSurface = css("--tb-taste-neutral-tint-surface", "#e4e4e4", .hex(0xE4E4E4))

            static let all = [main, tintSurface]
        }

        static let all = Color.all + Shadow.all + DataViz.all + Taste.all + NeutralTaste.all

        static let byVariable: [String: TBDesignColorToken] = Dictionary(
            uniqueKeysWithValues: all.compactMap { token in
                token.cssVariable.map { ($0, token) }
            }
        )

        private static func css(
            _ cssVariable: String,
            _ rawValue: String,
            _ value: TBDesignColorValue
        ) -> TBDesignColorToken {
            TBDesignColorToken(
                "design-system.css.\(cssVariable)",
                cssVariable: cssVariable,
                rawValue: rawValue,
                value: value
            )
        }

        private static func shadow(_ cssVariable: String, _ rawValue: String) -> TBDesignColorToken {
            TBDesignColorToken(
                "design-system.css.\(cssVariable)",
                cssVariable: cssVariable,
                rawValue: rawValue,
                value: .shadow(raw: rawValue)
            )
        }
    }

    static let designTokensAll = ColorTokens.all + DataVizTokens.all + TasteTokens.all + NeutralTasteTokens.all
    static let designTokensColorLikeAll = designTokensAll + ShadowTokens.all
    static let cssVariableAll = CSSVariables.all
}
