import SwiftUI

struct TBDesignToken: Equatable {
    let path: String
    let cssVariable: String?
    let rawValue: String
    let value: TBDesignTokenValue

    init(
        _ path: String,
        cssVariable: String? = nil,
        rawValue: String,
        value: TBDesignTokenValue
    ) {
        self.path = path
        self.cssVariable = cssVariable
        self.rawValue = rawValue
        self.value = value
    }
}

enum TBDesignTokenValue: Equatable {
    case pixels(CGFloat)
    case integer(Int)
    case number(Double)
    case milliseconds(Int)
    case text(String)
    case alias(String)
}

private func tbToken(
    _ path: String,
    _ rawValue: String,
    _ value: TBDesignTokenValue,
    cssVariable: String? = nil
) -> TBDesignToken {
    TBDesignToken(path, cssVariable: cssVariable, rawValue: rawValue, value: value)
}

enum TBDesignFoundationTokens {
    enum SpacingTokens {
        static let x2 = token("2", "2px", .pixels(2), "--tb-space-2")
        static let x4 = token("4", "4px", .pixels(4), "--tb-space-4")
        static let x6 = token("6", "6px", .pixels(6), "--tb-space-6")
        static let x8 = token("8", "8px", .pixels(8), "--tb-space-8")
        static let x10 = token("10", "10px", .pixels(10), "--tb-space-10")
        static let x12 = token("12", "12px", .pixels(12), "--tb-space-12")
        static let x16 = token("16", "16px", .pixels(16), "--tb-space-16")
        static let x20 = token("20", "20px", .pixels(20), "--tb-space-20")
        static let x24 = token("24", "24px", .pixels(24), "--tb-space-24")
        static let x40 = token("40", "40px", .pixels(40), "--tb-space-40")

        static let all = [x2, x4, x6, x8, x10, x12, x16, x20, x24, x40]

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String
        ) -> TBDesignToken {
            tbToken("SPACING_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum RadiusTokens {
        static let x6 = token("6", "6px", .pixels(6), "--tb-radius-6")
        static let x8 = token("8", "8px", .pixels(8), "--tb-radius-8")
        static let x10 = token("10", "10px", .pixels(10), "--tb-radius-10")
        static let x12 = token("12", "12px", .pixels(12), "--tb-radius-12")
        static let x14 = token("14", "14px", .pixels(14), "--tb-radius-14")
        static let x20 = token("20", "20px", .pixels(20), "--tb-radius-20")
        static let x24 = token("24", "24px", .pixels(24), "--tb-radius-24")
        static let full = token("full", "9999px", .pixels(9999), "--tb-radius-full")

        static let all = [x6, x8, x10, x12, x14, x20, x24, full]

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String
        ) -> TBDesignToken {
            tbToken("RADIUS_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum TypographyTokens {
        enum Family {
            static let sans = token("family.sans", "\"Pretendard\", ui-sans-serif, system-ui, sans-serif", .text("\"Pretendard\", ui-sans-serif, system-ui, sans-serif"), "--tb-font-family-sans")

            static let all = [sans]
        }

        enum FontSize {
            static let x10 = token("fontSize.10", "10px", .pixels(10), "--tb-font-size-10")
            static let x11 = token("fontSize.11", "11px", .pixels(11), "--tb-font-size-11")
            static let x12 = token("fontSize.12", "12px", .pixels(12), "--tb-font-size-12")
            static let x13 = token("fontSize.13", "13px", .pixels(13), "--tb-font-size-13")
            static let x14 = token("fontSize.14", "14px", .pixels(14), "--tb-font-size-14")
            static let x15 = token("fontSize.15", "15px", .pixels(15), "--tb-font-size-15")
            static let x16 = token("fontSize.16", "16px", .pixels(16), "--tb-font-size-16")
            static let x18 = token("fontSize.18", "18px", .pixels(18), "--tb-font-size-18")
            static let x20 = token("fontSize.20", "18px", .pixels(18), "--tb-font-size-20")
            static let x22 = token("fontSize.22", "18px", .pixels(18), "--tb-font-size-22")
            static let x24 = token("fontSize.24", "18px", .pixels(18), "--tb-font-size-24")
            static let x28 = token("fontSize.28", "18px", .pixels(18), "--tb-font-size-28")

            static let all = [x10, x11, x12, x13, x14, x15, x16, x18, x20, x22, x24, x28]
        }

        enum FontWeight {
            static let regular = token("fontWeight.regular", "400", .integer(400), "--tb-font-weight-regular")
            static let medium = token("fontWeight.medium", "500", .integer(500), "--tb-font-weight-medium")
            static let semibold = token("fontWeight.semibold", "600", .integer(600), "--tb-font-weight-semibold")
            static let bold = token("fontWeight.bold", "700", .integer(700), "--tb-font-weight-bold")

            static let all = [regular, medium, semibold, bold]
        }

        enum LineHeight {
            static let tight = token("lineHeight.tight", "1.2", .number(1.2), "--tb-line-height-tight")
            static let snug = token("lineHeight.snug", "1.35", .number(1.35), "--tb-line-height-snug")
            static let normal = token("lineHeight.normal", "1.4", .number(1.4), "--tb-line-height-normal")
            static let relaxed = token("lineHeight.relaxed", "1.5", .number(1.5), "--tb-line-height-relaxed")

            static let all = [tight, snug, normal, relaxed]
        }

        enum LetterSpacing {
            static let tight = token("letterSpacing.tight", "-0.24px", .pixels(-0.24), "--tb-letter-spacing-tight")
            static let micro = token("letterSpacing.micro", "0.14px", .pixels(0.14), "--tb-letter-spacing-micro")
            static let none = token("letterSpacing.none", "0", .number(0), nil)

            static let all = [tight, micro, none]
        }

        static let all = Family.all + FontSize.all + FontWeight.all + LineHeight.all + LetterSpacing.all

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String?
        ) -> TBDesignToken {
            tbToken("TYPOGRAPHY_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum ShadowTokens {
        static let hover = token("hover", "0 1px 3px rgba(15, 15, 15, 0.06)")
        static let soft = token("soft", "0 4px 20px rgba(0, 0, 0, 0.1)")
        static let strong = token("strong", "0 12px 32px rgba(15, 15, 15, 0.12)")
        static let button = token("button", "0 8px 20px rgba(0, 0, 0, 0.1)")
        static let drawer = token("drawer", "0 20px 60px rgba(0, 0, 0, 0.24)")

        static let all = [hover, soft, strong, button, drawer]

        private static func token(_ path: String, _ rawValue: String) -> TBDesignToken {
            tbToken("SHADOW_TOKENS.\(path)", rawValue, .text(rawValue))
        }
    }

    enum MotionTokens {
        enum DurationMs {
            static let fast = token("durationMs.fast", "180", .milliseconds(180), "--tb-motion-duration-fast")
            static let normal = token("durationMs.normal", "300", .milliseconds(300), "--tb-motion-duration-normal")
            static let medium = token("durationMs.medium", "500", .milliseconds(500), "--tb-motion-duration-medium")
            static let slow = token("durationMs.slow", "620", .milliseconds(620), "--tb-motion-duration-slow")
            static let slowest = token("durationMs.slowest", "720", .milliseconds(720), "--tb-motion-duration-slowest")
            static let loopPulse = token("durationMs.loopPulse", "1600", .milliseconds(1600), "--tb-motion-duration-loop-pulse")
            static let splash = token("durationMs.splash", "2500", .milliseconds(2500), "--tb-motion-duration-splash")

            static let all = [fast, normal, medium, slow, slowest, loopPulse, splash]
        }

        enum Easing {
            static let standard = token("easing.standard", "ease", .text("ease"), "--tb-motion-ease-standard")
            static let entrance = token("easing.entrance", "cubic-bezier(0.22, 1, 0.36, 1)", .text("cubic-bezier(0.22, 1, 0.36, 1)"), "--tb-motion-ease-entrance")
            static let exit = token("easing.exit", "ease-out", .text("ease-out"), "--tb-motion-ease-exit")

            static let all = [standard, entrance, exit]
        }

        enum Spring {
            static let screenDamping = token("spring.screenDamping", "25", .number(25), nil)
            static let screenStiffness = token("spring.screenStiffness", "200", .number(200), nil)

            static let all = [screenDamping, screenStiffness]
        }

        enum Scale {
            static let press = token("scale.press", "0.98", .number(0.98), "--tb-motion-scale-press")
            static let tabHover = token("scale.tabHover", "1.05", .number(1.05), "--tb-motion-scale-tab-hover")
            static let tabActive = token("scale.tabActive", "1.1", .number(1.1), "--tb-motion-scale-tab-active")
            static let loopNodePulse = token("scale.loopNodePulse", "1.28", .number(1.28), "--tb-motion-scale-loop-node")
            static let loopLabelPulse = token("scale.loopLabelPulse", "1.06", .number(1.06), "--tb-motion-scale-loop-label")

            static let all = [press, tabHover, tabActive, loopNodePulse, loopLabelPulse]
        }

        enum Distance {
            static let xSmall = token("distance.xSmall", "8", .pixels(8), "--tb-motion-distance-xs")
            static let small = token("distance.small", "12", .pixels(12), "--tb-motion-distance-sm")
            static let medium = token("distance.medium", "20", .pixels(20), "--tb-motion-distance-md")
            static let large = token("distance.large", "40", .pixels(40), "--tb-motion-distance-lg")
            static let onboardingSwipe = token("distance.onboardingSwipe", "100", .pixels(100), "--tb-motion-distance-onboarding-swipe")

            static let all = [xSmall, small, medium, large, onboardingSwipe]
        }

        static let all = DurationMs.all + Easing.all + Spring.all + Scale.all + Distance.all

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String?
        ) -> TBDesignToken {
            tbToken("MOTION_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum IconTokens {
        enum Size {
            static let xs = token("size.xs", "12", .pixels(12), "--tb-icon-size-xs")
            static let sm = token("size.sm", "14", .pixels(14), "--tb-icon-size-sm")
            static let base = token("size.base", "16", .pixels(16), nil)
            static let md = token("size.md", "18", .pixels(18), "--tb-icon-size-md")
            static let control = token("size.control", "20", .pixels(20), nil)
            static let lg = token("size.lg", "24", .pixels(24), "--tb-icon-size-lg")
            static let xl = token("size.xl", "28", .pixels(28), "--tb-icon-size-xl")
            static let touch = token("size.touch", "24", .pixels(24), "--tb-icon-size-touch")
            static let hero = token("size.hero", "24", .pixels(24), "--tb-icon-size-hero")

            static let all = [xs, sm, base, md, control, lg, xl, touch, hero]
        }

        enum StrokeWidth {
            static let thin = token("strokeWidth.thin", "1.5", .number(1.5), "--tb-icon-stroke-thin")
            static let regular = token("strokeWidth.regular", "1.8", .number(1.8), "--tb-icon-stroke-regular")
            static let medium = token("strokeWidth.medium", "2", .number(2), "--tb-icon-stroke-medium")
            static let strong = token("strokeWidth.strong", "2.2", .number(2.2), "--tb-icon-stroke-strong")
            static let emphasis = token("strokeWidth.emphasis", "3", .number(3), "--tb-icon-stroke-emphasis")

            static let all = [thin, regular, medium, strong, emphasis]
        }

        enum Container {
            static let sm = token("container.sm", "18", .pixels(18), nil)
            static let md = token("container.md", "24", .pixels(24), nil)
            static let lg = token("container.lg", "32", .pixels(32), nil)
            static let xl = token("container.xl", "32", .pixels(32), nil)

            static let all = [sm, md, lg, xl]
        }

        static let all = Size.all + StrokeWidth.all + Container.all

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String?
        ) -> TBDesignToken {
            tbToken("ICON_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum BoxTokens {
        enum Size {
            static let sm = token("size.sm", "32", .pixels(32), "--tb-box-size-sm")
            static let md = token("size.md", "40", .pixels(40), "--tb-box-size-md")
            static let lg = token("size.lg", "48", .pixels(48), "--tb-box-size-lg")

            static let all = [sm, md, lg]
        }

        static let all = Size.all

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String
        ) -> TBDesignToken {
            tbToken("BOX_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum DataVizTokens {
        enum Progress {
            static let barHeight = token("progress.barHeight", "8", .pixels(8), "--tb-data-viz-progress-height")
            static let barTrack = token("progress.barTrack", "#E8E8E8", .alias("COLOR:#E8E8E8"), "--tb-data-viz-progress-track")

            static let all = [barHeight, barTrack]
        }

        enum Radar {
            static let size = token("radar.size", "320", .pixels(320), "--tb-data-viz-radar-size")
            static let gridColor = token("radar.gridColor", "#E8E8E8", .alias("COLOR:#E8E8E8"), "--tb-data-viz-radar-grid")
            static let averageFill = token("radar.averageFill", "rgba(240, 240, 240, 0.6)", .alias("COLOR:rgba(240, 240, 240, 0.6)"), "--tb-data-viz-radar-average-fill")
            static let averageStroke = token("radar.averageStroke", "#D0D0D0", .alias("COLOR:#D0D0D0"), "--tb-data-viz-radar-average-stroke")
            static let highlightFill = token("radar.highlightFill", "rgba(255, 153, 0, 0.12)", .alias("COLOR:rgba(255, 153, 0, 0.12)"), "--tb-data-viz-radar-highlight-fill")
            static let highlightStroke = token("radar.highlightStroke", "#FF9900", .alias("COLOR:#FF9900"), "--tb-data-viz-radar-highlight-stroke")
            static let labelSize = token("radar.labelSize", "10", .pixels(10), "--tb-data-viz-radar-label-size")
            static let labelColor = token("radar.labelColor", "#888888", .alias("COLOR:#888888"), "--tb-data-viz-radar-label-color")
            static let nodeSize = token("radar.nodeSize", "3", .pixels(3), "--tb-data-viz-radar-node-size")
            static let outerDotSize = token("radar.outerDotSize", "8", .pixels(8), "--tb-data-viz-radar-outer-dot-size")

            static let all = [
                size, gridColor, averageFill, averageStroke, highlightFill, highlightStroke,
                labelSize, labelColor, nodeSize, outerDotSize
            ]
        }

        enum Trend {
            static let lineStrokeWidth = token("trend.lineStrokeWidth", "1", .pixels(1), "--tb-data-viz-trend-line-width")
            static let dotSize = token("trend.dotSize", "4", .pixels(4), "--tb-data-viz-trend-dot-size")
            static let activeDotSize = token("trend.activeDotSize", "5", .pixels(5), "--tb-data-viz-trend-active-dot-size")

            static let all = [lineStrokeWidth, dotSize, activeDotSize]
        }

        enum Ring {
            static let outerSize = token("ring.outerSize", "320", .pixels(320), nil)
            static let innerNodeRadius = token("ring.innerNodeRadius", "12", .pixels(12), nil)
            static let stepCount = token("ring.stepCount", "10", .integer(10), nil)
            static let outerRingThickness = token("ring.outerRingThickness", "24", .pixels(24), nil)
            static let guideDotSize = token("ring.guideDotSize", "1", .pixels(1), nil)
            static let stepPulses = token("ring.stepPulses", "1", .integer(1), nil)

            static let all = [outerSize, innerNodeRadius, stepCount, outerRingThickness, guideDotSize, stepPulses]
        }

        static let all = Progress.all + Radar.all + Trend.all + Ring.all

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String?
        ) -> TBDesignToken {
            tbToken("DATA_VIZ_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum LayoutTokens {
        static let screenMaxWidth = token("screenMaxWidth", "1440px", .pixels(1440), "--tb-layout-screen-max-width")
        static let pageGutter = token("pageGutter", "20px", .pixels(20), "--tb-layout-page-gutter")
        static let sectionGap = token("sectionGap", "SPACING_TOKENS[20]", .alias("SPACING_TOKENS.20"), "--tb-layout-section-gap")
        static let cardStackGap = token("cardStackGap", "SPACING_TOKENS[12]", .alias("SPACING_TOKENS.12"), "--tb-layout-card-stack-gap")
        static let cardPadding = token("cardPadding", "12px", .pixels(12), "--tb-layout-card-padding")
        static let topAppBarHeight = token("topAppBarHeight", "32px", .pixels(32), "--tb-size-top-app-bar-height")
        static let bottomTabBarHeight = token("bottomTabBarHeight", "60px", .pixels(60), "--tb-size-bottom-tab-bar-height")
        static let primaryButtonHeight = token("primaryButtonHeight", "48px", .pixels(48), "--tb-size-primary-button-height")
        static let bottomFadeMinHeight = token("bottomFadeMinHeight", "140px", .pixels(140), "--tb-size-bottom-fade-min-height")
        static let bottomIndicatorWidth = token("bottomIndicatorWidth", "134px", .pixels(134), "--tb-size-bottom-indicator-width")
        static let tasteLoopSize = token("tasteLoopSize", "320", .pixels(320), "--tb-orbit-size")
        static let tasteLoopGuideDotDiameter = token("tasteLoopGuideDotDiameter", "1", .pixels(1), "--tb-orbit-guide-dot-size")
        static let tasteLoopGuideDotGap = token("tasteLoopGuideDotGap", "3", .pixels(3), "--tb-orbit-guide-dot-gap")
        static let tasteLoopGuideRadius = token("tasteLoopGuideRadius", "138", .pixels(138), "--tb-orbit-guide-radius")
        static let tasteLoopLabelOffset = token("tasteLoopLabelOffset", "4", .pixels(4), "--tb-orbit-label-offset")
        static let tasteLoopNodeRadius = token("tasteLoopNodeRadius", "12", .pixels(12), "--tb-orbit-node-radius")
        static let tasteLoopOuterRingInset = token("tasteLoopOuterRingInset", "10", .pixels(10), "--tb-orbit-ring-inset")
        static let tasteLoopOuterRingThickness = token("tasteLoopOuterRingThickness", "24", .pixels(24), "--tb-orbit-ring-thickness")
        static let tasteLoopRingRadius = token("tasteLoopRingRadius", "138", .pixels(138), nil)
        static let tasteLoopStepCount = token("tasteLoopStepCount", "10", .integer(10), nil)

        static let all = [
            screenMaxWidth, pageGutter, sectionGap, cardStackGap, cardPadding,
            topAppBarHeight, bottomTabBarHeight, primaryButtonHeight, bottomFadeMinHeight, bottomIndicatorWidth,
            tasteLoopSize, tasteLoopGuideDotDiameter, tasteLoopGuideDotGap, tasteLoopGuideRadius,
            tasteLoopLabelOffset, tasteLoopNodeRadius, tasteLoopOuterRingInset, tasteLoopOuterRingThickness,
            tasteLoopRingRadius, tasteLoopStepCount
        ]

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String?
        ) -> TBDesignToken {
            tbToken("LAYOUT_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum ComponentTokens {
        enum Card {
            static let background = token("card.background", "COLOR_TOKENS.surface.card", .alias("COLOR_TOKENS.surface.card"))
            static let hoverBackground = token("card.hoverBackground", "COLOR_TOKENS.surface.cardHover", .alias("COLOR_TOKENS.surface.cardHover"))
            static let padding = token("card.padding", "SPACING_TOKENS[12]", .alias("SPACING_TOKENS.12"))
            static let radius = token("card.radius", "RADIUS_TOKENS[20]", .alias("RADIUS_TOKENS.20"))

            static let all = [background, hoverBackground, padding, radius]
        }

        enum Button {
            static let height = token("button.height", "LAYOUT_TOKENS.primaryButtonHeight", .alias("LAYOUT_TOKENS.primaryButtonHeight"))
            static let radius = token("button.radius", "RADIUS_TOKENS[10]", .alias("RADIUS_TOKENS.10"))
            static let background = token("button.background", "COLOR_TOKENS.text.primary", .alias("COLOR_TOKENS.text.primary"))
            static let color = token("button.color", "COLOR_TOKENS.text.inverse", .alias("COLOR_TOKENS.text.inverse"))
            static let disabledBackground = token("button.disabledBackground", "COLOR_TOKENS.surface.disabled", .alias("COLOR_TOKENS.surface.disabled"))
            static let disabledColor = token("button.disabledColor", "COLOR_TOKENS.text.disabled", .alias("COLOR_TOKENS.text.disabled"))

            static let all = [height, radius, background, color, disabledBackground, disabledColor]
        }

        enum Badge {
            static let radius = token("badge.radius", "RADIUS_TOKENS[6]", .alias("RADIUS_TOKENS.6"))
            static let paddingInline = token("badge.paddingInline", "SPACING_TOKENS[8]", .alias("SPACING_TOKENS.8"))
            static let paddingBlock = token("badge.paddingBlock", "SPACING_TOKENS[2]", .alias("SPACING_TOKENS.2"))

            static let all = [radius, paddingInline, paddingBlock]
        }

        enum Chip {
            static let radius = token("chip.radius", "RADIUS_TOKENS.full", .alias("RADIUS_TOKENS.full"), "--tb-chip-radius")

            enum Size {
                enum ExtraSmall {
                    static let fontSize = token("chip.size.xs.fontSize", "TYPOGRAPHY_TOKENS.fontSize[10]", .alias("TYPOGRAPHY_TOKENS.fontSize.10"), "--tb-chip-xs-font-size")
                    static let gap = token("chip.size.xs.gap", "SPACING_TOKENS[4]", .alias("SPACING_TOKENS.4"), "--tb-chip-xs-gap")
                    static let iconSize = token("chip.size.xs.iconSize", "TYPOGRAPHY_TOKENS.fontSize[12]", .alias("TYPOGRAPHY_TOKENS.fontSize.12"), "--tb-chip-xs-icon-size")
                    static let paddingBlock = token("chip.size.xs.paddingBlock", "SPACING_TOKENS[4]", .alias("SPACING_TOKENS.4"), "--tb-chip-xs-padding-block")
                    static let paddingInline = token("chip.size.xs.paddingInline", "SPACING_TOKENS[8]", .alias("SPACING_TOKENS.8"), "--tb-chip-xs-padding-inline")

                    static let all = [fontSize, gap, iconSize, paddingBlock, paddingInline]
                }

                enum Small {
                    static let fontSize = token("chip.size.sm.fontSize", "TYPOGRAPHY_TOKENS.fontSize[11]", .alias("TYPOGRAPHY_TOKENS.fontSize.11"), "--tb-chip-sm-font-size")
                    static let gap = token("chip.size.sm.gap", "SPACING_TOKENS[6]", .alias("SPACING_TOKENS.6"), "--tb-chip-sm-gap")
                    static let iconSize = token("chip.size.sm.iconSize", "TYPOGRAPHY_TOKENS.fontSize[12]", .alias("TYPOGRAPHY_TOKENS.fontSize.12"), "--tb-chip-sm-icon-size")
                    static let paddingBlock = token("chip.size.sm.paddingBlock", "SPACING_TOKENS[6]", .alias("SPACING_TOKENS.6"), "--tb-chip-sm-padding-block")
                    static let paddingInline = token("chip.size.sm.paddingInline", "SPACING_TOKENS[10]", .alias("SPACING_TOKENS.10"), "--tb-chip-sm-padding-inline")

                    static let all = [fontSize, gap, iconSize, paddingBlock, paddingInline]
                }

                enum Medium {
                    static let fontSize = token("chip.size.md.fontSize", "TYPOGRAPHY_TOKENS.fontSize[12]", .alias("TYPOGRAPHY_TOKENS.fontSize.12"), "--tb-chip-md-font-size")
                    static let gap = token("chip.size.md.gap", "SPACING_TOKENS[8]", .alias("SPACING_TOKENS.8"), "--tb-chip-md-gap")
                    static let iconSize = token("chip.size.md.iconSize", "TYPOGRAPHY_TOKENS.fontSize[14]", .alias("TYPOGRAPHY_TOKENS.fontSize.14"), "--tb-chip-md-icon-size")
                    static let paddingBlock = token("chip.size.md.paddingBlock", "SPACING_TOKENS[8]", .alias("SPACING_TOKENS.8"), "--tb-chip-md-padding-block")
                    static let paddingInline = token("chip.size.md.paddingInline", "SPACING_TOKENS[12]", .alias("SPACING_TOKENS.12"), "--tb-chip-md-padding-inline")

                    static let all = [fontSize, gap, iconSize, paddingBlock, paddingInline]
                }

                static let all = ExtraSmall.all + Small.all + Medium.all
            }

            enum Tone {
                static let neutral = tone("neutral", soft: ("COLOR_TOKENS.surface.muted", "COLOR_TOKENS.border.default", "COLOR_TOKENS.text.muted"), outline: ("transparent", "COLOR_TOKENS.border.default", "COLOR_TOKENS.text.secondary"), solid: ("COLOR_TOKENS.text.primary", "COLOR_TOKENS.text.primary", "COLOR_TOKENS.text.inverse"), text: ("transparent", "transparent", "COLOR_TOKENS.text.secondary"))
                static let success = tone("success", soft: ("COLOR_TOKENS.state.successSoft", "COLOR_TOKENS.state.successSoft", "COLOR_TOKENS.state.success"), outline: ("transparent", "COLOR_TOKENS.state.success", "COLOR_TOKENS.state.success"), solid: ("COLOR_TOKENS.state.success", "COLOR_TOKENS.state.success", "COLOR_TOKENS.text.inverse"), text: ("transparent", "transparent", "COLOR_TOKENS.state.success"))
                static let warning = tone("warning", soft: ("COLOR_TOKENS.state.warningSoft", "COLOR_TOKENS.state.warningSoft", "COLOR_TOKENS.state.warning"), outline: ("transparent", "COLOR_TOKENS.state.warning", "COLOR_TOKENS.state.warning"), solid: ("COLOR_TOKENS.state.warning", "COLOR_TOKENS.state.warning", "COLOR_TOKENS.text.inverse"), text: ("transparent", "transparent", "COLOR_TOKENS.state.warning"))
                static let accent = tone("accent", soft: ("COLOR_TOKENS.surface.base", "COLOR_TOKENS.text.primary", "COLOR_TOKENS.text.primary"), outline: ("transparent", "COLOR_TOKENS.text.primary", "COLOR_TOKENS.text.primary"), solid: ("COLOR_TOKENS.text.primary", "COLOR_TOKENS.text.primary", "COLOR_TOKENS.text.inverse"), text: ("transparent", "transparent", "COLOR_TOKENS.text.primary"))

                static let all = neutral + success + warning + accent

                private static func tone(
                    _ tone: String,
                    soft: (String, String, String),
                    outline: (String, String, String),
                    solid: (String, String, String),
                    text: (String, String, String)
                ) -> [TBDesignToken] {
                    variant(tone, "soft", soft) +
                    variant(tone, "outline", outline) +
                    variant(tone, "solid", solid) +
                    variant(tone, "text", text)
                }

                private static func variant(
                    _ tone: String,
                    _ variant: String,
                    _ values: (String, String, String)
                ) -> [TBDesignToken] {
                    [
                        token("chip.tone.\(tone).\(variant).backgroundColor", values.0, .alias(values.0)),
                        token("chip.tone.\(tone).\(variant).borderColor", values.1, .alias(values.1)),
                        token("chip.tone.\(tone).\(variant).color", values.2, .alias(values.2))
                    ]
                }
            }

            static let all = [radius] + Size.all + Tone.all
        }

        enum Pill {
            static let radius = token("pill.radius", "RADIUS_TOKENS.full", .alias("RADIUS_TOKENS.full"))

            static let all = [radius]
        }

        static let all = Card.all + Button.all + Badge.all + Chip.all + Pill.all

        private static func token(
            _ path: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue,
            _ cssVariable: String? = nil
        ) -> TBDesignToken {
            tbToken("COMPONENT_TOKENS.\(path)", rawValue, value, cssVariable: cssVariable)
        }
    }

    enum CSSVariables {
        enum NonColor {
            static let all = [
                css("--tb-font-family-sans", "\"Pretendard\", ui-sans-serif, system-ui, sans-serif", .text("\"Pretendard\", ui-sans-serif, system-ui, sans-serif")),

                css("--tb-motion-duration-fast", "180ms", .milliseconds(180)),
                css("--tb-motion-duration-normal", "300ms", .milliseconds(300)),
                css("--tb-motion-duration-medium", "500ms", .milliseconds(500)),
                css("--tb-motion-duration-slow", "620ms", .milliseconds(620)),
                css("--tb-motion-duration-slowest", "720ms", .milliseconds(720)),
                css("--tb-motion-duration-loop-pulse", "1600ms", .milliseconds(1600)),
                css("--tb-motion-duration-splash", "2500ms", .milliseconds(2500)),
                css("--tb-motion-ease-standard", "ease", .text("ease")),
                css("--tb-motion-ease-entrance", "cubic-bezier(0.22, 1, 0.36, 1)", .text("cubic-bezier(0.22, 1, 0.36, 1)")),
                css("--tb-motion-ease-exit", "ease-out", .text("ease-out")),
                css("--tb-motion-scale-press", "0.98", .number(0.98)),
                css("--tb-motion-scale-tab-hover", "1.05", .number(1.05)),
                css("--tb-motion-scale-tab-active", "1.1", .number(1.1)),
                css("--tb-motion-scale-loop-node", "1.28", .number(1.28)),
                css("--tb-motion-scale-loop-label", "1.06", .number(1.06)),
                css("--tb-motion-distance-xs", "8px", .pixels(8)),
                css("--tb-motion-distance-sm", "12px", .pixels(12)),
                css("--tb-motion-distance-md", "20px", .pixels(20)),
                css("--tb-motion-distance-lg", "40px", .pixels(40)),
                css("--tb-motion-distance-onboarding-swipe", "100px", .pixels(100)),

                css("--tb-icon-size-xs", "12px", .pixels(12)),
                css("--tb-icon-size-sm", "14px", .pixels(14)),
                css("--tb-icon-size-md", "18px", .pixels(18)),
                css("--tb-icon-size-lg", "24px", .pixels(24)),
                css("--tb-icon-size-xl", "28px", .pixels(28)),
                css("--tb-icon-size-touch", "24px", .pixels(24)),
                css("--tb-icon-size-hero", "24px", .pixels(24)),
                css("--tb-box-size-sm", "32px", .pixels(32)),
                css("--tb-box-size-md", "40px", .pixels(40)),
                css("--tb-box-size-lg", "48px", .pixels(48)),
                css("--tb-icon-stroke-thin", "1.5", .number(1.5)),
                css("--tb-icon-stroke-regular", "1.8", .number(1.8)),
                css("--tb-icon-stroke-medium", "2", .number(2)),
                css("--tb-icon-stroke-strong", "2.2", .number(2.2)),
                css("--tb-icon-stroke-emphasis", "3", .number(3)),

                css("--tb-data-viz-progress-height", "8px", .pixels(8)),
                css("--tb-data-viz-radar-size", "320px", .pixels(320)),
                css("--tb-data-viz-radar-label-size", "10px", .pixels(10)),
                css("--tb-data-viz-radar-node-size", "3px", .pixels(3)),
                css("--tb-data-viz-radar-outer-dot-size", "8px", .pixels(8)),
                css("--tb-data-viz-trend-line-width", "1px", .pixels(1)),
                css("--tb-data-viz-trend-dot-size", "4px", .pixels(4)),
                css("--tb-data-viz-trend-active-dot-size", "5px", .pixels(5)),

                css("--tb-space-2", "2px", .pixels(2)),
                css("--tb-space-4", "4px", .pixels(4)),
                css("--tb-space-6", "6px", .pixels(6)),
                css("--tb-space-8", "8px", .pixels(8)),
                css("--tb-space-10", "10px", .pixels(10)),
                css("--tb-space-12", "12px", .pixels(12)),
                css("--tb-space-16", "16px", .pixels(16)),
                css("--tb-space-20", "20px", .pixels(20)),
                css("--tb-space-24", "24px", .pixels(24)),
                css("--tb-space-40", "40px", .pixels(40)),

                css("--tb-radius-6", "6px", .pixels(6)),
                css("--tb-radius-8", "8px", .pixels(8)),
                css("--tb-radius-10", "10px", .pixels(10)),
                css("--tb-radius-12", "12px", .pixels(12)),
                css("--tb-radius-14", "14px", .pixels(14)),
                css("--tb-radius-20", "20px", .pixels(20)),
                css("--tb-radius-24", "24px", .pixels(24)),
                css("--tb-radius-full", "9999px", .pixels(9999)),

                css("--tb-chip-radius", "var(--tb-radius-full)", .alias("--tb-radius-full")),
                css("--tb-chip-xs-padding-inline", "var(--tb-space-8)", .alias("--tb-space-8")),
                css("--tb-chip-xs-padding-block", "var(--tb-space-4)", .alias("--tb-space-4")),
                css("--tb-chip-xs-gap", "var(--tb-space-4)", .alias("--tb-space-4")),
                css("--tb-chip-xs-font-size", "var(--tb-font-size-10)", .alias("--tb-font-size-10")),
                css("--tb-chip-xs-icon-size", "var(--tb-font-size-12)", .alias("--tb-font-size-12")),
                css("--tb-chip-sm-padding-inline", "var(--tb-space-10)", .alias("--tb-space-10")),
                css("--tb-chip-sm-padding-block", "var(--tb-space-6)", .alias("--tb-space-6")),
                css("--tb-chip-sm-gap", "var(--tb-space-6)", .alias("--tb-space-6")),
                css("--tb-chip-sm-font-size", "var(--tb-font-size-11)", .alias("--tb-font-size-11")),
                css("--tb-chip-sm-icon-size", "var(--tb-font-size-12)", .alias("--tb-font-size-12")),
                css("--tb-chip-md-padding-inline", "var(--tb-space-12)", .alias("--tb-space-12")),
                css("--tb-chip-md-padding-block", "var(--tb-space-8)", .alias("--tb-space-8")),
                css("--tb-chip-md-gap", "var(--tb-space-8)", .alias("--tb-space-8")),
                css("--tb-chip-md-font-size", "var(--tb-font-size-12)", .alias("--tb-font-size-12")),
                css("--tb-chip-md-icon-size", "var(--tb-font-size-14)", .alias("--tb-font-size-14")),

                css("--tb-font-size-10", "10px", .pixels(10)),
                css("--tb-font-size-11", "11px", .pixels(11)),
                css("--tb-font-size-12", "12px", .pixels(12)),
                css("--tb-font-size-13", "13px", .pixels(13)),
                css("--tb-font-size-14", "14px", .pixels(14)),
                css("--tb-font-size-15", "15px", .pixels(15)),
                css("--tb-font-size-16", "16px", .pixels(16)),
                css("--tb-font-size-18", "18px", .pixels(18)),
                css("--tb-font-size-20", "18px", .pixels(18)),
                css("--tb-font-size-22", "18px", .pixels(18)),
                css("--tb-font-size-24", "18px", .pixels(18)),
                css("--tb-font-size-28", "18px", .pixels(18)),
                css("--tb-font-weight-regular", "400", .integer(400)),
                css("--tb-font-weight-medium", "500", .integer(500)),
                css("--tb-font-weight-semibold", "600", .integer(600)),
                css("--tb-font-weight-bold", "700", .integer(700)),
                css("--tb-line-height-tight", "1.2", .number(1.2)),
                css("--tb-line-height-snug", "1.35", .number(1.35)),
                css("--tb-line-height-normal", "1.4", .number(1.4)),
                css("--tb-line-height-relaxed", "1.5", .number(1.5)),
                css("--tb-letter-spacing-tight", "-0.24px", .pixels(-0.24)),
                css("--tb-letter-spacing-micro", "0.14px", .pixels(0.14)),

                css("--tb-layout-screen-max-width", "1440px", .pixels(1440)),
                css("--tb-layout-page-gutter", "20px", .pixels(20)),
                css("--tb-layout-section-gap", "20px", .pixels(20)),
                css("--tb-layout-card-stack-gap", "12px", .pixels(12)),
                css("--tb-layout-card-padding", "12px", .pixels(12)),
                css("--tb-safe-area-top", "env(safe-area-inset-top, 0px)", .text("env(safe-area-inset-top, 0px)")),
                css("--tb-safe-area-bottom", "env(safe-area-inset-bottom, 0px)", .text("env(safe-area-inset-bottom, 0px)")),
                css("--tb-size-top-app-bar-height", "32px", .pixels(32)),
                css("--tb-size-bottom-tab-bar-height", "60px", .pixels(60)),
                css("--tb-size-primary-button-height", "48px", .pixels(48)),
                css("--tb-size-bottom-fade-min-height", "140px", .pixels(140)),
                css("--tb-size-bottom-indicator-width", "134px", .pixels(134)),
                css("--tb-orbit-size", "320px", .pixels(320)),
                css("--tb-orbit-ring-inset", "10px", .pixels(10)),
                css("--tb-orbit-ring-thickness", "24px", .pixels(24)),
                css("--tb-orbit-node-diameter", "24px", .pixels(24)),
                css("--tb-orbit-node-radius", "12px", .pixels(12)),
                css("--tb-orbit-guide-dot-size", "1px", .pixels(1)),
                css("--tb-orbit-guide-dot-gap", "3px", .pixels(3)),
                css("--tb-orbit-guide-radius", "138px", .pixels(138)),
                css("--tb-orbit-label-offset", "4px", .pixels(4))
            ]
        }

        static let nonColorAll = NonColor.all

        private static func css(
            _ cssVariable: String,
            _ rawValue: String,
            _ value: TBDesignTokenValue
        ) -> TBDesignToken {
            tbToken("design-system.css.\(cssVariable)", rawValue, value, cssVariable: cssVariable)
        }
    }

    static let foundationAll =
        SpacingTokens.all +
        RadiusTokens.all +
        TypographyTokens.all +
        ShadowTokens.all +
        MotionTokens.all +
        IconTokens.all +
        BoxTokens.all +
        DataVizTokens.all +
        LayoutTokens.all

    static let componentAll = ComponentTokens.all
    static let designTokensAll = foundationAll + componentAll
}
