import SwiftUI

/// 필터 의미는 화면이 소유하고, 선택 표시와 터치 영역은 공통으로 유지한다.
struct TBCapsuleTabs<Selection: Hashable>: View {
    @Namespace private var selectionNamespace
    let options: [Selection]
    @Binding var selection: Selection
    var selectedForeground = TBColor.textPrimary
    var selectedBackground = TBColor.surface
    var selectedBorder = TBColor.border
    let title: (Selection) -> String

    var body: some View {
        HStack(spacing: TBSpacing.x8) {
            ForEach(options, id: \.self) { option in
                Button { selection = option } label: {
                    Text(title(option))
                        .font(selection == option ? TBFont.bold(13) : TBFont.medium(13))
                        .foregroundStyle(selection == option ? selectedForeground : TBColor.textTertiary)
                        .padding(.horizontal, 14)
                        .frame(height: 32)
                        .background {
                            if selection == option {
                                Capsule()
                                    .fill(selectedBackground)
                                    .overlay { Capsule().strokeBorder(selectedBorder, lineWidth: 1) }
                                    .matchedGeometryEffect(id: "selection", in: selectionNamespace)
                            }
                        }
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(TBTokenButtonStyle())
                .accessibilityAddTraits(selection == option ? .isSelected : [])
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, TBSpacing.x16)
        .tasteBloomMotion(.feedback, value: selection)
    }
}

#Preview("캡슐 필터 탭") {
    @Previewable @State var selectedMonths = 0
    TBCapsuleTabs(options: [1, 3, 6, 12, 0], selection: $selectedMonths,
                  selectedForeground: TasteAxis.salty.tintSurfaceTextColor,
                  selectedBackground: TasteAxis.salty.tintColor,
                  selectedBorder: TasteAxis.salty.borderDefaultColor) {
        $0 == 0 ? "전부" : $0 == 12 ? "1년" : "\($0)개월"
    }
    .padding(.top, TBSpacing.x16)
    .background(TBColor.page)
}

enum TBSectionTitleSize {
    case medium
    case large

    var font: Font {
        switch self {
        case .medium: TBTextStyle.subsectionTitle.font
        case .large: TBTextStyle.sectionTitle.font
        }
    }
}

struct TBPageSection<Content: View>: View {
    let title: String
    var subtitle: String? = nil
    var titleSize: TBSectionTitleSize = .large
    private let content: Content

    init(
        title: String,
        subtitle: String? = nil,
        titleSize: TBSectionTitleSize = .large,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.subtitle = subtitle
        self.titleSize = titleSize
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.card) {
            VStack(alignment: .leading, spacing: TBSpacing.x4) {
                Text(title)
                    .font(titleSize.font)
                    .foregroundStyle(TBColor.textPrimary)

                if let subtitle {
                    Text(subtitle)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(3)
                }
            }

            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

enum ChipSize: CaseIterable {
    case extraSmall
    case small
    case medium

    var fontSize: CGFloat {
        switch self {
        case .extraSmall: 10
        case .small: 11
        case .medium: 12
        }
    }

    var font: Font {
        TBFont.medium(fontSize)
    }

    var iconSize: CGFloat {
        switch self {
        case .extraSmall, .small: TBIcon.Size.xSmall
        case .medium: TBIcon.Size.small
        }
    }

    var horizontalPadding: CGFloat {
        switch self {
        case .extraSmall: 8
        case .small: 10
        case .medium: 12
        }
    }

    var verticalPadding: CGFloat {
        switch self {
        case .extraSmall: 4
        case .small: 6
        case .medium: 8
        }
    }

    var gap: CGFloat {
        switch self {
        case .extraSmall: 4
        case .small: 6
        case .medium: 8
        }
    }
}

enum ChipTone: CaseIterable {
    case neutral
    case success
    case warning
    case accent
}

enum ChipVariant: CaseIterable {
    case soft
    case outline
    case solid
    case text
}

struct ChipStyle: Equatable {
    let background: Color
    let border: Color
    let foreground: Color

    static func resolve(tone: ChipTone, variant: ChipVariant, tasteAxis: TasteAxis? = nil) -> ChipStyle {
        if let tasteAxis {
            switch variant {
            case .soft:
                return ChipStyle(background: tasteAxis.chipBackgroundColor,
                                 border: tasteAxis.borderDefaultColor,
                                 foreground: tasteAxis.tintTextColor)
            case .outline:
                return ChipStyle(background: .clear, border: tasteAxis.borderAccentColor,
                                 foreground: tasteAxis.tintTextColor)
            case .solid:
                return ChipStyle(background: tasteAxis.tintTextColor, border: tasteAxis.tintTextColor,
                                 foreground: TBColor.textInverse)
            case .text:
                return ChipStyle(background: .clear, border: .clear, foreground: tasteAxis.tintTextColor)
            }
        }

        return switch (tone, variant) {
        case (.neutral, .soft):
            ChipStyle(
                background: TBChipColor.neutralBackground,
                border: TBColor.borderOnMuted,
                foreground: TBColor.textTertiary
            )
        case (.neutral, .outline):
            ChipStyle(
                background: .clear,
                border: TBColor.border,
                foreground: TBColor.textSecondary
            )
        case (.neutral, .solid), (.accent, .solid):
            ChipStyle(
                background: TBColor.selectionSurface,
                border: TBColor.borderSelected,
                foreground: TBColor.selectionText
            )
        case (.neutral, .text):
            ChipStyle(
                background: .clear,
                border: .clear,
                foreground: TBColor.textSecondary
            )
        case (.success, .soft):
            ChipStyle(
                background: TBColor.successSoft,
                border: TBColor.borderSuccessSoft,
                foreground: TBColor.successText
            )
        case (.success, .outline):
            ChipStyle(background: .clear, border: TBColor.borderSuccess, foreground: TBColor.successText)
        case (.success, .solid):
            ChipStyle(
                background: TBColor.successStrong,
                border: TBColor.successStrong,
                foreground: TBColor.textInverse
            )
        case (.success, .text):
            ChipStyle(background: .clear, border: .clear, foreground: TBColor.successText)
        case (.warning, .soft):
            ChipStyle(
                background: TBColor.warningSoft,
                border: TBColor.borderWarningSoft,
                foreground: TBColor.warningText
            )
        case (.warning, .outline):
            ChipStyle(background: .clear, border: TBColor.borderWarning, foreground: TBColor.warningText)
        case (.warning, .solid):
            ChipStyle(
                background: TBColor.warningStrong,
                border: TBColor.warningStrong,
                foreground: TBColor.textInverse
            )
        case (.warning, .text):
            ChipStyle(background: .clear, border: .clear, foreground: TBColor.warningText)
        case (.accent, .soft):
            ChipStyle(
                background: TBColor.surface,
                border: TBColor.textPrimary,
                foreground: TBColor.textPrimary
            )
        case (.accent, .outline):
            ChipStyle(background: .clear, border: TBColor.textPrimary, foreground: TBColor.textPrimary)
        case (.accent, .text):
            ChipStyle(background: .clear, border: .clear, foreground: TBColor.textPrimary)
        }
    }
}

struct Chip: View {
    @Environment(\.isEnabled) private var environmentIsEnabled

    let title: String
    var value: String? = nil
    var tasteAxis: TasteAxis? = nil
    var valueForegroundColorOverride: Color? = nil
    var leadingSymbol: String? = nil
    var trailingSymbol: String? = nil
    var trailingAction: (() -> Void)? = nil
    var trailingAccessibilityLabel: String? = nil
    var backgroundColorOverride: Color? = nil
    var borderColorOverride: Color? = nil
    var foregroundColorOverride: Color? = nil
    var trailingForegroundColorOverride: Color? = nil
    var horizontalPaddingOverride: CGFloat? = nil
    var size: ChipSize = .small
    var tone: ChipTone = .neutral
    var variant: ChipVariant = .soft
    var isEnabled = true

    private var isEffectivelyEnabled: Bool {
        isEnabled && environmentIsEnabled
    }

    private var style: ChipStyle {
        ChipStyle.resolve(tone: tone, variant: variant, tasteAxis: tasteAxis)
    }

    private var labelColor: Color {
        guard isEffectivelyEnabled else { return TBColor.textDisabled }
        if let foregroundColorOverride { return foregroundColorOverride }
        return tasteAxis != nil && value != nil && variant != .solid ? TBColor.textPrimary : style.foreground
    }

    var body: some View {
        HStack(spacing: size.gap) {
            if let leadingSymbol {
                LucideIcon(
                    systemName: leadingSymbol,
                    size: size.iconSize,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(width: size.iconSize, height: size.iconSize)
            }

            Text(title)
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)

            if let value {
                Text(value)
                    .font(TBFont.semibold(size.fontSize))
                    .foregroundStyle(isEffectivelyEnabled
                        ? (valueForegroundColorOverride ?? foregroundColorOverride ?? style.foreground)
                        : TBColor.textDisabled)
                    .lineLimit(1)
                    .fixedSize(horizontal: true, vertical: false)
            }

            if let trailingSymbol {
                trailingIcon(symbol: trailingSymbol)
            }
        }
        .font(size.font)
        .foregroundStyle(labelColor)
        .padding(.horizontal, horizontalPaddingOverride ?? size.horizontalPadding)
        .padding(.vertical, size.verticalPadding)
        .background(isEffectivelyEnabled ? (backgroundColorOverride ?? style.background) : TBColor.disabledSurface)
        .clipShape(Capsule())
        .overlay {
            Capsule().strokeBorder(isEffectivelyEnabled ? (borderColorOverride ?? style.border) : TBColor.borderDisabled, lineWidth: 1)
        }
        .disabled(!isEnabled)
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder
    private func trailingIcon(symbol: String) -> some View {
        let icon = LucideIcon(
            systemName: symbol,
            size: size.iconSize,
            strokeWidth: TBIcon.Stroke.regular
        )
        .foregroundStyle(
            isEffectivelyEnabled
                ? (trailingForegroundColorOverride ?? foregroundColorOverride ?? style.foreground)
                : TBColor.textDisabled
        )
        .frame(width: size.iconSize, height: size.iconSize)

        if let trailingAction {
            Button(action: trailingAction) {
                icon
            }
            .buttonStyle(TBTokenButtonStyle())
            .accessibilityLabel(trailingAccessibilityLabel ?? "\(title) 액션")
        } else {
            icon
        }
    }
}

struct NeutralChip: View {
    let title: String
    var symbol: String? = nil
    var size: ChipSize = .small

    var body: some View {
        Chip(
            title: title,
            leadingSymbol: symbol,
            size: size,
            tone: .neutral,
            variant: .soft
        )
    }
}

struct CardDetailLabel: View {
    enum Direction: Equatable {
        case down
        case right
        case up

        var angle: Double {
            switch self {
            case .down: 90
            case .right: 0
            case .up: -90
            }
        }
    }

    var label = "자세히보기"
    var direction: Direction = .right

    var body: some View {
        HStack(spacing: 2) {
            Text(label)
                .contentTransition(.opacity)
            LucideIcon(
                .chevronRight,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.regular
            )
            .rotationEffect(.degrees(direction.angle))
        }
        .tbTextStyle(.detailAction)
        .fixedSize()
        .tasteBloomMotion(.feedback, value: direction)
    }
}

enum PalateSignatureID: String, CaseIterable {
    case purist
    case explorer
    case harmonist
    case curator
    case epicure
    case aesthete
}

struct PalateSignature: Equatable {
    let id: PalateSignatureID
    let label: String
    let subtitle: String
    let description: String
    let accentAxes: [TasteAxis]
}

enum PalateSignatureEngine {
    static func derive(entries: [RadarTasteEntry]) -> PalateSignature {
        let normalizedEntries = TasteRadarContract.normalizedEntries(entries)
        let axisOrder = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.enumerated().map { ($0.element, $0.offset) }
        )
        let sortedEntries = normalizedEntries.sorted { left, right in
            let leftDelta = delta(for: left)
            let rightDelta = delta(for: right)
            if leftDelta == rightDelta {
                return axisOrder[left.axis, default: 0] < axisOrder[right.axis, default: 0]
            }
            return leftDelta > rightDelta
        }
        let strongest = sortedEntries.first ?? RadarTasteEntry(axis: .sweet, score: 50)
        let second = sortedEntries.dropFirst().first ?? strongest
        let weakest = sortedEntries.last ?? strongest
        let spread = delta(for: strongest) - delta(for: weakest)
        let averageDelta = normalizedEntries.map(delta(for:)).reduce(0, +)
            / Double(max(normalizedEntries.count, 1))
        let totalDeltaAbs = normalizedEntries.map { abs(delta(for: $0)) }.reduce(0, +)
        let elevatedCount = normalizedEntries.filter { delta(for: $0) > 0.7 }.count
        let brightDelta = delta(for: normalizedEntries[0]) + delta(for: normalizedEntries[1])
        let savoryDepthDelta = delta(for: normalizedEntries[4]) + delta(for: normalizedEntries[5])
        let contrastDelta = [
            delta(for: normalizedEntries[1]),
            delta(for: normalizedEntries[2]),
            delta(for: normalizedEntries[3])
        ].max() ?? 0

        let signatureID: PalateSignatureID
        if spread <= 1.4, abs(averageDelta) <= 0.55 {
            signatureID = .harmonist
        } else if spread <= 2.2, averageDelta < 0.2, elevatedCount <= 2 {
            signatureID = .purist
        } else if savoryDepthDelta >= 1.2, delta(for: normalizedEntries[4]) > -0.2 {
            signatureID = .epicure
        } else if spread >= 4.4 || totalDeltaAbs >= 9.5 {
            signatureID = .curator
        } else if brightDelta >= 1.8, elevatedCount >= 2 {
            signatureID = .aesthete
        } else if contrastDelta >= 1.1 || strongest.axis == .bitter {
            signatureID = .explorer
        } else {
            signatureID = .curator
        }

        return makeSignature(
            id: signatureID,
            primary: strongest.axis,
            secondary: second.axis,
            weakest: weakest.axis
        )
    }

    static func derive(profile: TasteProfile) -> PalateSignature {
        derive(
            entries: TasteAxis.allCases.map {
                RadarTasteEntry(axis: $0, score: profile.score(for: $0))
            }
        )
    }

    private static func delta(for entry: RadarTasteEntry) -> Double {
        Double(entry.score - entry.averageScore) / 10
    }

    private static func makeSignature(
        id: PalateSignatureID,
        primary: TasteAxis,
        secondary: TasteAxis,
        weakest: TasteAxis
    ) -> PalateSignature {
        let label: String
        let subtitle: String
        let description: String

        switch id {
        case .purist:
            label = "Purist"
            subtitle = "정제된 균형을 선호하는 미각"
            description = "\(primary.label)과 \(secondary.label) 축도 과하게 치우치지 않아, 강한 자극보다 재료의 선명함과 정제된 밸런스를 더 높게 보는 성향으로 읽힙니다."
        case .explorer:
            label = "Explorer"
            subtitle = "새로운 조합을 반기는 미각"
            description = "특히 \(primary.label)과 \(secondary.label) 축 반응이 도드라져, 예상 밖의 풍미나 낯선 조합에서도 포인트를 빠르게 포착하는 성향으로 보입니다."
        case .harmonist:
            label = "Harmonist"
            subtitle = "조화를 먼저 읽는 미각"
            description = "여섯 가지 맛의 편차가 비교적 고르게 나타나 한 요소의 강함보다 전체적인 조화와 흐름을 안정적으로 즐기는 성향에 가깝습니다."
        case .curator:
            label = "Curator"
            subtitle = "정교한 차이를 읽는 미각"
            description = "특히 \(primary.label)과 \(weakest.label)의 대비가 또렷해, 풍미의 결·밸런스·마무리 차이를 세밀하게 읽어내며 취향의 기준을 정교하게 쌓아가는 성향으로 보입니다."
        case .epicure:
            label = "Epicure"
            subtitle = "깊이와 여운에 끌리는 미각"
            description = "\(primary.label)과 \(secondary.label) 축이 살아 있어, 레이어가 많은 맛이나 긴 여운을 지닌 풍미에서 만족을 느끼기 쉬운 성향으로 해석됩니다."
        case .aesthete:
            label = "Aesthete"
            subtitle = "감각의 결을 섬세하게 보는 미각"
            description = "\(primary.label)과 \(secondary.label) 축이 선명하게 드러나, 첫 인상과 피니시의 분위기 차이까지 감각적으로 받아들이는 성향으로 보입니다."
        }

        return PalateSignature(
            id: id,
            label: label,
            subtitle: subtitle,
            description: description,
            accentAxes: [primary, secondary]
        )
    }
}

struct PalateSignatureHeroCard: View {
    let profile: TasteProfile

    private var signature: PalateSignature {
        PalateSignatureEngine.derive(profile: profile)
    }

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("나의 미각 타입")
                        .font(TBFont.medium(12))
                        .foregroundStyle(TBColor.textHint)

                    Text(signature.label)
                        .font(TBFont.semibold(18))
                        .tracking(-0.24)
                        .foregroundStyle(TBColor.textPrimary)

                    Text(signature.subtitle)
                        .font(TBFont.semibold(13))
                        .foregroundStyle(TBColor.textSecondary)
                        .padding(.top, 2)
                }

                Text(signature.description)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textSubtle)
                    .lineSpacing(4)

                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Current Focus")
                            .font(TBFont.medium(11))
                            .foregroundStyle(TBColor.textHint)
                        HStack(spacing: 6) {
                            ForEach(signature.accentAxes) { axis in
                                Chip(title: axis.label, tasteAxis: axis, size: .small)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Updated")
                            .font(TBFont.medium(11))
                            .foregroundStyle(TBColor.textHint)
                        Text(profile.measurementDisplayAgeLabel)
                            .font(TBFont.semibold(13))
                            .foregroundStyle(TBColor.textPrimary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.top, 2)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("미각 시그니처 요약")
        }
    }
}

enum TasteMeasurementMiniCtaTone: CaseIterable {
    case alert
    case neutral
}

enum TasteMeasurementMiniCtaPadding: CaseIterable {
    case compact
    case `default`

    var value: CGFloat {
        switch self {
        case .compact: 12
        case .default: 16
        }
    }
}

enum TasteMeasurementMiniCtaActionPlacement: CaseIterable {
    case bottom
    case right
}

struct TasteMeasurementMiniCta: View {
    @Environment(\.tbCardBordersVisible) private var cardBordersVisible

    let actionLabel: String
    var actionFullWidth = false
    var actionPlacement: TasteMeasurementMiniCtaActionPlacement = .bottom
    let description: String
    var meta: String? = nil
    var padding: TasteMeasurementMiniCtaPadding = .compact
    let title: String
    var tone: TasteMeasurementMiniCtaTone = .neutral
    var accentAxis: TasteAxis = .sweet
    let onAction: () -> Void

    var body: some View {
        Group {
            if actionPlacement == .right {
                HStack(alignment: .bottom, spacing: 12) {
                    copy
                    compactAction
                }
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    copy
                    compactAction
                        .frame(
                            maxWidth: actionFullWidth ? .infinity : nil,
                            alignment: .leading
                        )
                }
            }
        }
        .padding(padding.value)
        .background(background)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
        .overlay {
            if cardBordersVisible {
                RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            }
        }
    }

    private var copy: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title)
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textPrimary)

            Text(description)
                .font(TBFont.regular(12))
                .foregroundStyle(TBColor.textSubtle)
                .lineSpacing(2)

            if let meta {
                Text(meta)
                    .font(TBFont.medium(11))
                    .foregroundStyle(TBColor.textFaint)
                    .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var compactAction: some View {
        PrimaryButton(
            title: actionLabel,
            fullWidth: actionFullWidth,
            size: .compact,
            appearance: .tasteTint(accentAxis),
            action: onAction
        )
    }

    @ViewBuilder
    private var background: some View {
        switch tone {
        case .neutral:
            TBColor.surface
        case .alert:
            LinearGradient(
                colors: [TasteAxis.sweet.tintColor, TBColor.surface],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private var borderColor: Color {
        switch tone {
        case .neutral: TBColor.borderFaint
        case .alert: TasteAxis.sweet.borderStrongColor
        }
    }
}

enum TastePointTrend: String, CaseIterable {
    case increase
    case decrease
    case neutral

    var symbol: String {
        switch self {
        case .increase: "arrow.up.right"
        case .decrease: "arrow.down.right"
        case .neutral: "minus"
        }
    }
}

struct TasteInsightSummaryDetail: Identifiable, Equatable {
    let axis: TasteAxis
    let changeValue: Double
    let history: [Double]
    let trend: TastePointTrend
    var currentScore: Int? = nil

    var id: TasteAxis.ID { axis.id }

    var currentValueLabel: String {
        if let currentScore {
            return "\(currentScore)점"
        }
        // Keep manually supplied benchmark values distinct from actual scores.
        return "기준 대비 \(changeLabel)"
    }

    var changeLabel: String {
        let rounded = changeValue.rounded()
        let number = abs(rounded.truncatingRemainder(dividingBy: 1)) < 0.001
            ? String(Int(rounded))
            : String(format: "%.1f", rounded)
        return changeValue > 0 ? "+\(number)%" : "\(number)%"
    }
}

struct TasteInsightSummaryCardData: Equatable {
    let actionLabel: String?
    let details: [TasteInsightSummaryDetail]
    let keywords: [String]
    let sectionLabel: String
    let title: String

    var hasHistory: Bool {
        details.contains { !$0.history.isEmpty }
    }

    static func tasteProfile(
        _ profile: TasteProfile,
        history: [TasteProfile] = []
    ) -> TasteInsightSummaryCardData {
        let details = profile.radarEntries
            .map { entry in
                let change = Double(entry.score - entry.averageScore)
                return TasteInsightSummaryDetail(
                    axis: entry.axis,
                    changeValue: change,
                    history: historyValues(
                        for: entry.axis,
                        profiles: history,
                        excluding: profile
                    ),
                    trend: trend(for: change),
                    currentScore: entry.score
                )
            }
            .sorted { abs($0.changeValue) > abs($1.changeValue) }
        let primary = details.first?.axis ?? profile.strongestAxis
        let secondary = details.dropFirst().first?.axis ?? profile.weakestAxis

        return TasteInsightSummaryCardData(
            actionLabel: "현재 기준",
            details: details,
            keywords: [
                "\(primary.label) 반응",
                "\(secondary.label) 대비",
                profile.confidence
            ],
            sectionLabel: "미각변화",
            title: "\(primary.label)과 \(secondary.label) 반응이 현재 기준에서 달라요"
        )
    }

    static func specialNote(
        _ profile: TasteProfile,
        history: [TasteProfile] = []
    ) -> TasteInsightSummaryCardData {
        let strongest = profile.radarEntries.max {
            ($0.score - $0.averageScore) < ($1.score - $1.averageScore)
        } ?? RadarTasteEntry(axis: profile.strongestAxis, score: profile.score(for: profile.strongestAxis))
        let weakest = profile.radarEntries.min {
            ($0.score - $0.averageScore) < ($1.score - $1.averageScore)
        } ?? RadarTasteEntry(axis: profile.weakestAxis, score: profile.score(for: profile.weakestAxis))
        let entries = [strongest, weakest]
        let details = entries.map { entry -> TasteInsightSummaryDetail in
            let change = Double(entry.score - entry.averageScore)
            return TasteInsightSummaryDetail(
                axis: entry.axis,
                changeValue: change,
                history: historyValues(
                    for: entry.axis,
                    profiles: history,
                    excluding: profile
                ),
                trend: trend(for: change),
                currentScore: entry.score
            )
        }

        return TasteInsightSummaryCardData(
            actionLabel: nil,
            details: details,
            keywords: [
                "\(strongest.axis.label) 조정",
                "\(weakest.axis.label) 마무리",
                "다음 다이닝"
            ],
            sectionLabel: "특이사항",
            title: "\(strongest.axis.label)과 \(weakest.axis.label) 전달을 함께 조정해요"
        )
    }

    private static func trend(for change: Double) -> TastePointTrend {
        if change > 0 {
            return .increase
        }
        if change < 0 {
            return .decrease
        }
        return .neutral
    }

    private static func historyValues(
        for axis: TasteAxis,
        profiles: [TasteProfile],
        excluding currentProfile: TasteProfile
    ) -> [Double] {
        profiles
            .filter { $0.createdAt != currentProfile.createdAt }
            .sorted { $0.createdAt < $1.createdAt }
            .suffix(TasteLineChartMetrics.maximumHistoryCount)
            .map {
                Double($0.score(for: axis) - TasteRadarContract.averageScore(for: axis))
            }
    }
}

struct TastePointArrowBox: View {
    var axis: TasteAxis? = nil
    let trend: TastePointTrend
    var size: CGFloat = 18
    var glyphSize: CGFloat? = nil
    var strokeWidth: CGFloat = TBIcon.Stroke.regular

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 2 / 9, style: .continuous)
                .fill(axis?.mainColor ?? TBColor.textHint)

            LucideIcon(
                systemName: trend.symbol,
                size: glyphSize ?? size * 0.5,
                strokeWidth: strokeWidth
            )
                .foregroundStyle(Color.white)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

struct TasteChangeEmptySummary: View {
    var body: some View {
        VStack(spacing: TasteLineChartMetrics.rowSpacing) {
            ForEach(["상승 변화", "하강 변화"], id: \.self) { label in
                HStack(spacing: TBSpacing.x16) {
                    HStack(spacing: 8) {
                        TastePointArrowBox(trend: .neutral)
                        Text(label).font(TBFont.medium(14)).foregroundStyle(TBColor.textHint)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                    Canvas { context, size in
                        // Decorative empty state, independent of recorded values.
                        let radius = TasteLineChartMetrics.currentNodeDiameter / 2
                        let start = CGPoint(x: radius, y: size.height / 2)
                        let end = CGPoint(x: size.width - radius, y: start.y)
                        var path = Path()
                        path.move(to: start)
                        path.addLine(to: end)
                        context.stroke(path, with: .color(TBColor.textHint.opacity(0.12)),
                                       style: StrokeStyle(lineWidth: TasteLineChartMetrics.trackLineWidth, lineCap: .round))
                        context.stroke(path, with: .linearGradient(Gradient(colors: [TBColor.textHint.opacity(0.25), TBColor.textHint]), startPoint: start, endPoint: end),
                                       style: StrokeStyle(lineWidth: TasteLineChartMetrics.coreLineWidth, lineCap: .round))
                        context.fill(Path(ellipseIn: CGRect(x: end.x - radius, y: start.y - radius, width: radius * 2, height: radius * 2)), with: .color(TBColor.textHint))
                    }.frame(width: 132, height: TasteLineChartMetrics.rowHeight)
                }.frame(height: TasteLineChartMetrics.rowHeight)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("상승 변화와 하강 변화 모두 비교 기록 없음")
    }
}

#Preview("미각변화 빈 기록") {
    TasteChangeEmptySummary().padding()
}

struct TasteLineChartEntry: Identifiable, Equatable {
    let axis: TasteAxis
    let values: [Double]

    var id: TasteAxis.ID { axis.id }
}

enum TasteLineChartMetrics {
    static let maximumHistoryCount = TasteProfileHistoryContract.maximumStoredProfiles
    static let maximumPointCount = maximumHistoryCount + 1
    static let currentNodeDiameter: CGFloat = 12
    static let historyNodeDiameter: CGFloat = 4
    static let trackLineWidth: CGFloat = currentNodeDiameter
    static let coreLineWidth: CGFloat = 2
    static let cornerRadius: CGFloat = 12
    static let rowHeight: CGFloat = 24
    static let rowSpacing: CGFloat = 4

    static func visibleValues(_ values: [Double]) -> [Double] {
        Array(values.suffix(maximumPointCount))
    }

    static func horizontalLayout(pointCount: Int, availableWidth: CGFloat, maxPointGap: CGFloat = 36,
                                 plotWidth: CGFloat? = nil, showsPendingHistory: Bool = false)
        -> (width: CGFloat, pointGap: CGFloat, firstX: CGFloat) {
        let pending = showsPendingHistory && pointCount == 1
        let intervals = max(pointCount - 1, 0)
        let contentWidth = max((plotWidth ?? availableWidth) - currentNodeDiameter, 0)
        let gap = intervals > 0 ? (plotWidth != nil ? contentWidth / CGFloat(intervals)
            : min(maxPointGap, contentWidth / CGFloat(intervals))) : 0
        let width = plotWidth ?? (pending ? max(availableWidth, 0) : currentNodeDiameter + CGFloat(intervals) * gap)
        // Keep the existing left-to-right waiting track; one observed point alone has no line.
        let firstX = pointCount == 1 && plotWidth != nil && !pending
            ? width - currentNodeDiameter / 2 : currentNodeDiameter / 2
        return (width, gap, firstX)
    }
}

/// Fixed circular fillets shared with web roundedLinePath.ts; source values stay unchanged.
enum TasteLineRounding {
    struct Corner {
        let entry: CGPoint
        let exit: CGPoint
        let radius: CGFloat
        let marker: CGPoint
    }

    static func corners(_ points: [CGPoint], radius: CGFloat = 12) -> [Corner?] {
        points.enumerated().map { index, point in
            guard index > 0, index < points.count - 1, radius > 0 else { return nil }
            let before = points[index - 1], after = points[index + 1]
            let incomingLength = hypot(point.x - before.x, point.y - before.y)
            let outgoingLength = hypot(after.x - point.x, after.y - point.y)
            guard incomingLength > 0, outgoingLength > 0 else { return nil }
            let incoming = CGPoint(x: (point.x - before.x) / incomingLength, y: (point.y - before.y) / incomingLength)
            let outgoing = CGPoint(x: (after.x - point.x) / outgoingLength, y: (after.y - point.y) / outgoingLength)
            let angle = acos(max(-1, min(1, incoming.x * outgoing.x + incoming.y * outgoing.y)))
            guard angle >= 1e-6, .pi - angle >= 1e-6 else { return nil }
            let tangent = tan(angle / 2)
            let trim = min(radius * tangent, incomingLength / 2, outgoingLength / 2)
            let arcRadius = trim / tangent
            let entry = CGPoint(x: point.x - incoming.x * trim, y: point.y - incoming.y * trim)
            let sign: CGFloat = incoming.x * outgoing.y - incoming.y * outgoing.x > 0 ? 1 : -1
            let center = CGPoint(x: entry.x - sign * incoming.y * arcRadius,
                                 y: entry.y + sign * incoming.x * arcRadius)
            return Corner(
                entry: entry,
                exit: CGPoint(x: point.x + outgoing.x * trim, y: point.y + outgoing.y * trim),
                radius: arcRadius,
                marker: CGPoint(x: point.x, y: center.y - sign * sqrt(max(0,
                    arcRadius * arcRadius - (point.x - center.x) * (point.x - center.x))))
            )
        }
    }

    /// Keep each historical sample's x while placing its dot on the rounded line.
    static func markers(_ points: [CGPoint], radius: CGFloat = 12) -> [CGPoint] {
        zip(points, corners(points, radius: radius)).map { point, corner in corner?.marker ?? point }
    }

    static func path(_ points: [CGPoint], radius: CGFloat = 12) -> Path {
        var path = Path()
        guard let first = points.first else { return path }
        path.move(to: first)
        let rounds = corners(points, radius: radius)
        for index in 1..<max(1, points.count) {
            if let corner = rounds[index] {
                path.addLine(to: corner.entry)
                path.addArc(tangent1End: points[index], tangent2End: corner.exit, radius: corner.radius)
            } else {
                path.addLine(to: points[index])
            }
        }
        return path
    }
}

/// 홈 카드의 고정 크기 미니 그래프. 상세 차트의 실제 수치 높이와 구분한다.
enum TBMiniChartMetrics {
    static let width: CGFloat = TBMiniChartDimensions.width
    static let height: CGFloat = TBMiniChartDimensions.height
    static let gap: CGFloat = 3
    static let weeklyGap: CGFloat = 8
    static let groupGap: CGFloat = 8
    static let intraGroupGap: CGFloat = 2
    static let maximumBarWidth: CGFloat = 12
    static let zeroHeightRatio: CGFloat = 0.5

    static func spacing(count: Int, grouped: Bool = false, fitWeek: Bool = true) -> CGFloat {
        let preferred = grouped ? groupGap : (fitWeek && count == 7 ? weeklyGap : gap)
        return count > 0 ? min(preferred, width / CGFloat((grouped ? 3 : 2) * count)) : gap
    }

    static func innerSpacing(count: Int) -> CGFloat {
        guard count > 0 else { return 0 }
        let cell = (width - spacing(count: count, grouped: true) * CGFloat(count - 1)) / CGFloat(count)
        return min(intraGroupGap, cell / 4)
    }

    static func barWidth(count: Int, grouped: Bool = false, fitWeek: Bool = true) -> CGFloat {
        guard count > 0 else { return 0 }
        let cell = (width - spacing(count: count, grouped: grouped, fitWeek: fitWeek) * CGFloat(count - 1)) / CGFloat(count)
        return min(maximumBarWidth, grouped ? (cell - innerSpacing(count: count)) / 2 : cell)
    }

    static func barHeight(value: Double, maximum: Double, barWidth: CGFloat) -> CGFloat {
        guard value.isFinite, value >= 0 else { return 0 }
        if value == 0 { return barWidth * zeroHeightRatio }
        guard maximum > 1 else { return barWidth }
        return barWidth + CGFloat(max(0, value - 1) / (maximum - 1)) * (height - barWidth)
    }
}

struct TBMiniChart: View {
    let values: [Double]
    var comparisonValues: [Double]? = nil
    let axis: TasteAxis
    var onSelect: ((Int) -> Void)? = nil
    var highlightsEachValue = false

    var body: some View {
        let grouped = comparisonValues != nil
        let count = max(values.count, comparisonValues?.count ?? 0)
        let maximum = (values + (comparisonValues ?? [])).filter { $0.isFinite }.max() ?? 0
        let width = TBMiniChartMetrics.barWidth(count: count, grouped: grouped)
        HStack(alignment: .bottom, spacing: TBMiniChartMetrics.spacing(count: count, grouped: grouped)) {
            ForEach(0..<count, id: \.self) { index in
                HStack(alignment: .bottom, spacing: grouped ? TBMiniChartMetrics.innerSpacing(count: count) : 0) {
                    if let comparisonValues {
                        bar(value: comparisonValues.indices.contains(index) ? comparisonValues[index] : .nan,
                            width: width, maximum: maximum, last: highlightsEachValue || index == count - 1, comparison: true)
                    }
                    bar(value: values.indices.contains(index) ? values[index] : .nan,
                        width: width, maximum: maximum, last: highlightsEachValue || index == count - 1, comparison: false)
                }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                    .contentShape(Rectangle())
                    .onTapGesture { onSelect?(index) }
            }
        }
        .frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height)
        .tasteBloomChartReveal(from: .bottom)
        .accessibilityHidden(true)
    }

    private func bar(value: Double, width: CGFloat, maximum: Double, last: Bool, comparison: Bool) -> some View {
        TasteChartBarMark(axis: axis, showsEndpoint: value > 0 && last, isComparison: comparison,
                          endpointColor: axis.mainColor)
            .frame(width: width, height: TBMiniChartMetrics.barHeight(value: value, maximum: maximum, barWidth: width))
    }
}

/// 캡슐 막대와 끝점을 공유한다. 높이는 호출부가 미니/상세 규칙에 맞춰 전달한다.
struct TasteChartBarMark: View {
    let axis: TasteAxis
    var showsEndpoint = false
    var isComparison = false
    var endpointColor: Color? = nil

    var body: some View {
        GeometryReader { geometry in
            let diameter = min(geometry.size.width, geometry.size.height)
            if diameter > 0 {
                ZStack(alignment: .top) {
                    Capsule().fill(isComparison ? TBColor.chartComparisonTrack : axis.chartTrackColor)
                    if showsEndpoint {
                        Circle().fill(isComparison ? TBColor.textBody : (endpointColor ?? axis.mainColor))
                            .frame(width: diameter, height: diameter)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
        }
        .accessibilityHidden(true)
    }
}

/// 기존 선 그래프의 트랙·그라데이션·끝점을 값이 정한 가로 구간에 사용한다.
struct TasteChartTrackMark: View {
    let axis: TasteAxis

    var body: some View {
        Canvas { context, size in
            let diameter = min(TasteLineChartMetrics.currentNodeDiameter, min(size.width, size.height))
            guard diameter > 0 else { return }
            let radius = diameter / 2
            let start = CGPoint(x: radius, y: size.height / 2)
            let end = CGPoint(x: size.width - radius, y: start.y)
            var path = Path()
            path.move(to: start)
            path.addLine(to: end)
            context.stroke(path, with: .color(axis.lineChartTrackColor),
                           style: StrokeStyle(lineWidth: diameter, lineCap: .round))
            context.stroke(path, with: .linearGradient(
                Gradient(colors: [axis.lineChartStartColor, axis.lineChartEndColor]), startPoint: start, endPoint: end),
                style: StrokeStyle(lineWidth: min(TasteLineChartMetrics.coreLineWidth, diameter), lineCap: .round))
            context.fill(Path(ellipseIn: CGRect(x: end.x - radius, y: end.y - radius, width: diameter, height: diameter)),
                         with: .color(axis.lineChartEndColor))
        }
        .accessibilityHidden(true)
    }
}

struct TasteLineChart: View {
    let entries: [TasteLineChartEntry]
    var maxPointGap: CGFloat = 36
    var plotWidth: CGFloat? = nil
    var showsPendingHistory = false
    var plotHeight: CGFloat? = nil
    var valueDomain: ClosedRange<Double>? = nil

    private var rowHeight: CGFloat {
        guard let plotHeight else { return TasteLineChartMetrics.rowHeight }
        return (plotHeight - CGFloat(max(0, entries.count - 1)) * TasteLineChartMetrics.rowSpacing) / CGFloat(max(1, entries.count))
    }

    private var domain: ClosedRange<Double> {
        if let valueDomain { return valueDomain }
        let values = entries.flatMap { TasteLineChartMetrics.visibleValues($0.values) }
        guard let minimum = values.min(), let maximum = values.max() else {
            return -1...1
        }
        if minimum == maximum {
            let padding = max(1, abs(minimum) * 0.2)
            return (minimum - padding)...(maximum + padding)
        }
        let padding = max(1, (maximum - minimum) * 0.18)
        return (minimum - padding)...(maximum + padding)
    }

    var body: some View {
        VStack(spacing: TasteLineChartMetrics.rowSpacing) {
            ForEach(entries) { entry in
                GeometryReader { proxy in
                    let values = TasteLineChartMetrics.visibleValues(entry.values)
                    let drawsPendingTrack = showsPendingHistory && values.count == 1
                    let layout = TasteLineChartMetrics.horizontalLayout(pointCount: values.count,
                        availableWidth: proxy.size.width, maxPointGap: maxPointGap,
                        plotWidth: plotWidth, showsPendingHistory: showsPendingHistory)

                    HStack(spacing: 0) {
                        Spacer(minLength: 0)
                        Canvas { context, size in
                            draw(
                                context: &context,
                                size: size,
                                axis: entry.axis,
                                values: values,
                                pointGap: layout.pointGap,
                                firstX: layout.firstX,
                                drawsPendingTrack: drawsPendingTrack
                            )
                        }
                        .frame(width: layout.width, height: rowHeight)
                    }
                }
                .frame(height: rowHeight)
            }
        }
        .tasteBloomChartReveal()
        .accessibilityHidden(true)
    }

    private func draw(
        context: inout GraphicsContext,
        size: CGSize,
        axis: TasteAxis,
        values: [Double],
        pointGap: CGFloat,
        firstX: CGFloat,
        drawsPendingTrack: Bool
    ) {
        guard !values.isEmpty else { return }
        let nodeRadius = TasteLineChartMetrics.currentNodeDiameter / 2
        let points = values.enumerated().map { index, value in
            let denominator = max(domain.upperBound - domain.lowerBound, 0.001)
            let normalized = (value - domain.lowerBound) / denominator
            return CGPoint(
                x: firstX + pointGap * CGFloat(index),
                y: plotHeight == nil ? 18 - CGFloat(normalized) * 10
                    : size.height - nodeRadius - CGFloat(normalized) * (size.height - 2 * nodeRadius)
            )
        }
        let path = TasteLineRounding.path(points, radius: TasteLineChartMetrics.cornerRadius)
        let lineShading = GraphicsContext.Shading.linearGradient(
            Gradient(colors: [axis.lineChartStartColor, axis.lineChartEndColor]),
            startPoint: CGPoint(x: 0, y: 12),
            endPoint: CGPoint(x: size.width, y: 12)
        )

        if drawsPendingTrack, let current = points.first {
            drawPendingTrack(context: &context, size: size, axis: axis, current: current)
        } else if points.count > 1 {
            context.stroke(
                path,
                with: .color(axis.lineChartTrackColor),
                style: StrokeStyle(
                    lineWidth: TasteLineChartMetrics.trackLineWidth,
                    lineCap: .round,
                    lineJoin: .round
                )
            )
            context.stroke(
                path,
                with: lineShading,
                style: StrokeStyle(
                    lineWidth: TasteLineChartMetrics.coreLineWidth,
                    lineCap: .round,
                    lineJoin: .round
                )
            )
        }

        let historyDiameter = TasteLineChartMetrics.historyNodeDiameter
        for point in TasteLineRounding.markers(points, radius: TasteLineChartMetrics.cornerRadius).dropLast() {
            context.fill(Path(ellipseIn: CGRect(
                x: point.x - historyDiameter / 2, y: point.y - historyDiameter / 2,
                width: historyDiameter, height: historyDiameter
            )), with: lineShading)
        }

        if let current = points.last {
            context.fill(
                Path(
                    ellipseIn: CGRect(
                        x: current.x - nodeRadius,
                        y: current.y - nodeRadius,
                        width: TasteLineChartMetrics.currentNodeDiameter,
                        height: TasteLineChartMetrics.currentNodeDiameter
                    )
                ),
                with: .color(axis.lineChartEndColor)
            )
        }
    }

    private func drawPendingTrack(
        context: inout GraphicsContext,
        size: CGSize,
        axis: TasteAxis,
        current: CGPoint
    ) {
        let end = CGPoint(
            x: size.width - TasteLineChartMetrics.currentNodeDiameter / 2,
            y: current.y
        )
        guard end.x > current.x else { return }

        // Decorative waiting space, not invented past samples or a forecast.
        var track = Path()
        track.move(to: current)
        track.addLine(to: end)

        context.stroke(
            track,
            with: .linearGradient(
                Gradient(stops: [
                    .init(color: axis.lineChartTrackColor, location: 0),
                    .init(color: axis.lineChartTrackColor, location: 0.45),
                    .init(color: .clear, location: 1)
                ]),
                startPoint: current,
                endPoint: end
            ),
            style: StrokeStyle(lineWidth: TasteLineChartMetrics.trackLineWidth, lineCap: .round)
        )
        context.stroke(
            track,
            with: .linearGradient(
                Gradient(stops: [
                    .init(color: axis.lineChartEndColor, location: 0),
                    .init(color: axis.lineChartStartColor, location: 0.6),
                    .init(color: .clear, location: 1)
                ]),
                startPoint: current,
                endPoint: end
            ),
            style: StrokeStyle(lineWidth: TasteLineChartMetrics.coreLineWidth, lineCap: .round)
        )
    }
}

/// Measures the complete header and body together before balancing the footer.
private struct TasteInsightEqualSectionsLayout: Layout {
    private let spacing: CGFloat = TBSpacing.x12

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let sizes = subviews.map { $0.sizeThatFits(.init(width: proposal.width, height: nil)) }
        guard sizes.count == 3 else { return .zero }
        return CGSize(width: proposal.width ?? sizes.map(\.width).max() ?? 0,
                      height: max(sizes[0].height, sizes[2].height) * 2 + sizes[1].height + spacing * 2)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count == 3 else { return }
        let dividerHeight = subviews[1].sizeThatFits(.init(width: bounds.width, height: nil)).height
        let sectionHeight = max(0, (bounds.height - dividerHeight - spacing * 2) / 2)
        subviews[0].place(at: bounds.origin, anchor: .topLeading,
                          proposal: .init(width: bounds.width, height: sectionHeight))
        subviews[1].place(at: CGPoint(x: bounds.minX, y: bounds.minY + sectionHeight + spacing), anchor: .topLeading,
                          proposal: .init(width: bounds.width, height: dividerHeight))
        subviews[2].place(at: CGPoint(x: bounds.minX, y: bounds.minY + sectionHeight + spacing * 2 + dividerHeight), anchor: .topLeading,
                          proposal: .init(width: bounds.width, height: sectionHeight))
    }
}

/// SummaryCard Body: text occupies at most half the row; the graph keeps its 132pt plot.
/// Matches the 156pt text column in a 352pt Figma card, without fixing the card width.
struct TBSummaryCardBodyLayout: Layout {
    private func textWidth(_ width: CGFloat) -> CGFloat {
        max(0, min((width - TBSpacing.x16) / 2, width - TBMiniChartMetrics.width - TBSpacing.x16))
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 328
        guard subviews.count == 2 else {
            return subviews.first?.sizeThatFits(.init(width: width, height: nil)) ?? .zero
        }
        let text = subviews[0].sizeThatFits(.init(width: textWidth(width), height: nil))
        let chart = subviews[1].sizeThatFits(.init(width: TBMiniChartMetrics.width, height: nil))
        return CGSize(width: width, height: max(text.height, chart.height))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count == 2 else {
            subviews.first?.place(at: bounds.origin, anchor: .topLeading, proposal: .init(width: bounds.width, height: bounds.height))
            return
        }
        subviews[0].place(at: CGPoint(x: bounds.minX, y: bounds.midY), anchor: .leading,
                          proposal: .init(width: textWidth(bounds.width), height: nil))
        subviews[1].place(at: CGPoint(x: bounds.maxX, y: bounds.midY), anchor: .trailing,
                          proposal: .init(width: TBMiniChartMetrics.width, height: nil))
    }
}

struct TBSummaryCardLegendItem: Identifiable {
    let id: String
    let label: String
    var color: Color? = nil
}

struct TBSummaryCardLegend: View {
    let items: [TBSummaryCardLegendItem]

    var body: some View {
        TBWrapLayout(spacing: TBSpacing.x8) { labels }
        .font(TBFont.medium(TBTypography.FontSize.x10))
        .foregroundStyle(TBColor.textBody)
    }

    private var labels: some View {
        ForEach(items) { item in
            HStack(spacing: TBSpacing.x4) {
                if let color = item.color {
                    Circle().fill(color).frame(width: 5, height: 5).accessibilityHidden(true)
                }
                Text(item.label).fixedSize(horizontal: false, vertical: true)
            }
            .frame(minHeight: 14)
        }
    }
}

struct TBSummaryCardFooter: View {
    let items: [TBSummaryCardLegendItem]

    var body: some View {
        if !items.isEmpty {
            VStack(alignment: .leading, spacing: TBSpacing.x12) {
                Rectangle().fill(TBColor.borderSubtle).frame(height: 0.5).accessibilityHidden(true)
                TBSummaryCardLegend(items: items)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct TasteInsightSummaryCardLayout<Content: View>: View {
    let indicatorColors: [Color]
    var indicatorWeights: [Double] = []
    var indicatorIcon: LucideIconName? = nil
    var indicatorCategory: TDCategory? = nil
    let sectionLabel: String
    let actionLabel: String?
    let title: String
    var titleContentSpacing: CGFloat = TBSpacing.x12
    var showsTitle = true
    var combinesAccessibilityChildren = true
    var sectionLabelLineLimit: Int? = 1
    var accessibilityLabel: String? = nil
    var accessibilityHint: String? = nil
    var onTap: (() -> Void)? = nil
    private let content: Content
    private let balancedFooter: AnyView?
    private let legend: [TBSummaryCardLegendItem]

    init(
        indicatorColors: [Color],
        indicatorWeights: [Double] = [],
        indicatorIcon: LucideIconName? = nil,
        indicatorCategory: TDCategory? = nil,
        sectionLabel: String,
        actionLabel: String?,
        title: String,
        titleContentSpacing: CGFloat = TBSpacing.x12,
        showsTitle: Bool = true,
        combinesAccessibilityChildren: Bool = true,
        sectionLabelLineLimit: Int? = 1,
        accessibilityLabel: String? = nil,
        accessibilityHint: String? = nil,
        onTap: (() -> Void)? = nil,
        balancedFooter: AnyView? = nil,
        legend: [TBSummaryCardLegendItem] = [],
        @ViewBuilder content: () -> Content
    ) {
        self.indicatorColors = indicatorColors
        self.indicatorWeights = indicatorWeights
        self.indicatorIcon = indicatorIcon
        self.indicatorCategory = indicatorCategory
        self.sectionLabel = sectionLabel
        self.actionLabel = actionLabel
        self.title = title
        self.titleContentSpacing = titleContentSpacing
        self.showsTitle = showsTitle
        self.combinesAccessibilityChildren = combinesAccessibilityChildren
        self.sectionLabelLineLimit = sectionLabelLineLimit
        self.accessibilityLabel = accessibilityLabel
        self.accessibilityHint = accessibilityHint
        self.onTap = onTap
        self.balancedFooter = balancedFooter
        self.legend = legend
        self.content = content()
    }

    var body: some View {
        Group {
            if let onTap {
                Button(action: onTap) {
                    cardContent
                }
                .buttonStyle(.plain)
            } else {
                cardContent
            }
        }
        .accessibilityElement(children: combinesAccessibilityChildren ? .combine : .contain)
        .accessibilityLabel(([accessibilityLabel ?? "\(sectionLabel), \(title)"] + legend.map(\.label)).joined(separator: ", "))
        .accessibilityHint(accessibilityHint ?? "")
        .accessibilityAddTraits(onTap == nil ? [] : .isButton)
    }

    private var cardContent: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x12) {
            if let balancedFooter {
                TasteInsightEqualSectionsLayout {
                    upperContent
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    Divider().overlay(TBColor.borderSubtle).frame(height: 0.5)
                    balancedFooter
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                }
            } else {
                upperContent
            }
            TBSummaryCardFooter(items: legend)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
    }

    private var upperContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 16) {
                HStack(spacing: 6) {
                    if let indicatorCategory {
                        TDCategoryIcon(category: indicatorCategory, color: indicatorColors.first)
                    } else if let indicatorIcon {
                        LucideIcon(
                            indicatorIcon,
                            size: TBIcon.Size.base,
                            strokeWidth: TBIcon.Stroke.medium
                        )
                        .frame(width: 16, height: 16)
                        .foregroundStyle(indicatorColors.first ?? TBColor.textDisabled)
                    } else {
                        TasteGradientIndicator(
                            segments: indicatorColors.enumerated().map { index, color in
                                TasteGradientIndicatorSegment(
                                    color: color,
                                    weight: index < indicatorWeights.count
                                        ? indicatorWeights[index]
                                        : 1
                                )
                            }
                        )
                    }

                    Text(sectionLabel)
                        .font(TBFont.bold(14))
                        .foregroundStyle(TBColor.textPrimary)
                        .lineLimit(sectionLabelLineLimit)
                        .frame(minHeight: 20, alignment: .leading)
                }

                Spacer(minLength: 0)

                if let actionLabel {
                    CardDetailLabel(label: actionLabel)
                }
            }

            if showsTitle {
                VStack(alignment: .leading, spacing: titleContentSpacing) {
                    Text(title)
                        .font(TBFont.bold(16))
                        .foregroundStyle(TBColor.textPrimary)
                        .lineSpacing(2)
                        .frame(minHeight: 23, alignment: .leading)

                    content
                }
            } else {
                content
            }
        }
    }
}

struct TasteInsightSummaryCard: View {
    let data: TasteInsightSummaryCardData
    let onTap: () -> Void

    private var summaryDetails: [TasteInsightSummaryDetail] {
        let increases = data.details
            .filter { $0.trend == .increase }
            .sorted { $0.changeValue > $1.changeValue }
        let decreases = data.details
            .filter { $0.trend == .decrease }
            .sorted { $0.changeValue < $1.changeValue }
        var details: [TasteInsightSummaryDetail] = []

        if let increase = increases.first {
            details.append(increase)
        }
        if let decrease = decreases.first, decrease.axis != details.first?.axis {
            details.append(decrease)
        }
        return details.isEmpty ? Array(data.details.prefix(2)) : details
    }

    var body: some View {
        TasteInsightSummaryCardLayout(
            indicatorColors: summaryDetails.map(\.axis.mainColor),
            indicatorWeights: summaryDetails.map { abs($0.changeValue) },
            indicatorCategory: .change,
            sectionLabel: data.sectionLabel,
            actionLabel: data.actionLabel ?? "자세히보기",
            title: data.title,
            accessibilityLabel: data.hasHistory ? nil : firstRecordAccessibilityLabel,
            onTap: onTap
        ) {
            detailsContent
        }
    }

    private var detailsContent: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: TBSpacing.x16) {
                VStack(alignment: .leading, spacing: TasteLineChartMetrics.rowSpacing) {
                    ForEach(summaryDetails) { detail in
                        HStack(spacing: 8) {
                            if data.hasHistory {
                                TastePointArrowBox(
                                    axis: detail.axis,
                                    trend: detail.trend,
                                    glyphSize: 12,
                                    strokeWidth: 3
                                )
                            } else {
                                LucideIcon(
                                    systemName: detail.axis.symbol,
                                    size: TBIcon.Size.base,
                                    strokeWidth: TBIcon.Stroke.regular
                                )
                                .foregroundStyle(detail.axis.mainColor)
                                .frame(width: 18, height: 18)
                                .accessibilityHidden(true)
                            }

                            HStack(spacing: 6) {
                                Text(detail.axis.label)
                                    .font(TBFont.medium(14))
                                    .foregroundStyle(TBColor.textSecondary)
                                    .lineLimit(1)
                                Text(data.hasHistory ? detail.changeLabel : detail.currentValueLabel)
                                    .font(TBFont.semibold(12))
                                    .foregroundStyle(detail.axis.mainColor)
                            }
                        }
                        .frame(height: TasteLineChartMetrics.rowHeight)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .leading, spacing: TBSpacing.x4) {
                    TasteLineChart(
                        entries: summaryDetails.map {
                            TasteLineChartEntry(
                                axis: $0.axis,
                                values: $0.history + [$0.changeValue]
                            )
                        },
                        plotWidth: TBMiniChartMetrics.width,
                        showsPendingHistory: !data.hasHistory
                    )

                    if !data.hasHistory {
                        Text("기록 대기")
                            .font(TBFont.regular(11))
                            .foregroundStyle(TBColor.textSecondary)
                    }
                }
                .frame(width: 132, alignment: .leading)
            }

            HStack(spacing: 6) {
                ForEach(Array(data.keywords.enumerated()), id: \.offset) { _, keyword in
                    keywordChip(keyword)
                }
            }
        }
    }

    private var firstRecordAccessibilityLabel: String {
        let currentValues = summaryDetails.map {
            "\($0.axis.label) \($0.currentValueLabel)"
        }.joined(separator: ", ")
        return "\(data.sectionLabel), \(data.title), 첫 기록, \(currentValues). 기록 대기. 오른쪽 선은 추이가 아닌 다음 기록을 위한 표시예요."
    }

    @ViewBuilder
    private func keywordChip(_ keyword: String) -> some View {
        if let axis = TasteAxis.allCases.first(where: { keyword.hasPrefix($0.label) }) {
            let value = keyword
                .dropFirst(axis.label.count)
                .trimmingCharacters(in: .whitespaces)
            Chip(title: axis.label, value: value.isEmpty ? nil : value, tasteAxis: axis, size: .small)
        } else {
            Chip(title: keyword, size: .small)
        }
    }
}

#Preview("Insight Summary First Record Waiting Track") {
    ScrollView {
        VStack(spacing: TBSpacing.x12) {
            TasteInsightSummaryCard(data: .tasteProfile(.sample)) {}
            TasteInsightSummaryCard(data: .specialNote(.sample)) {}
        }
        .padding(TBSpacing.page)
    }
    .tbPageBackground()
}

struct InterpretationCard: View {
    let description: String
    var eyebrow: String? = nil
    var supportingText: String? = nil
    var detailLabel: String? = nil
    var accentColor: Color = TBColor.textDisabled
    var indicatorColors: [Color]? = nil
    var indicatorWeights: [Double] = []
    var actionAccentColor: Color = TasteAxis.sweet.mainColor
    @State private var supportingTextExpanded = false
    var onExpand: (() -> Void)? = nil

    var body: some View {
        content
            .onTapGesture { onExpand?() }
            .accessibilityElement(children: .contain)
            .onChange(of: supportingText) { _, _ in supportingTextExpanded = false }
    }

    private var content: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 12) {
                    if let eyebrow {
                        Text(eyebrow)
                            .font(TBFont.semibold(12))
                            .foregroundStyle(TBColor.textHint)
                            .lineLimit(1)
                    }

                    Spacer(minLength: 0)

                    if let onExpand {
                        InlineButton(title: detailLabel ?? "자세히보기", tone: .neutral, icon: .chevronRight, action: onExpand)
                    } else if let detailLabel {
                        CardDetailLabel(label: detailLabel)
                    }
                }

                HStack(alignment: .center, spacing: 12) {
                    indicator
                        .padding(.vertical, 5)

                    VStack(alignment: .leading, spacing: TBSpacing.x4) {
                        Text(description)
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)
                            .lineLimit(supportingText == nil ? 2 : 1)

                        if let supportingText {
                            supportingDescription(supportingText)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    @ViewBuilder
    private func supportingDescription(_ text: String) -> some View {
        if supportingTextExpanded {
            HStack(alignment: .firstTextBaseline, spacing: TBSpacing.x6) {
                supportingLabel(text)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                InlineButton(title: "접기", accentColor: actionAccentColor) {
                    supportingTextExpanded = false
                }
            }
        } else {
            ViewThatFits(in: .horizontal) {
                supportingLabel(text)
                    .lineLimit(1)
                    .fixedSize(horizontal: true, vertical: false)
                HStack(alignment: .firstTextBaseline, spacing: TBSpacing.x6) {
                    supportingLabel(text)
                        .lineLimit(1)
                        .truncationMode(.tail)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    InlineButton(title: "더보기", accentColor: actionAccentColor) {
                        if let onExpand { onExpand() }
                        else { supportingTextExpanded = true }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func supportingLabel(_ text: String) -> some View {
        Text(text)
            .font(TBFont.regular(12))
            .foregroundStyle(TBColor.textHint)
    }

    private var indicator: some View {
        let colors = indicatorColors ?? [accentColor]
        return TasteGradientIndicator(
            segments: colors.enumerated().map { index, color in
                TasteGradientIndicatorSegment(
                    color: color,
                    weight: index < indicatorWeights.count
                        ? indicatorWeights[index]
                        : 1
                )
            },
            style: .verticalCapsule
        )
    }
}

enum RecommendationMiniCardMetrics {
    static let width: CGFloat = 132
    static let height: CGFloat = 132
    static let radius: CGFloat = TBRadius.card
    static let padding: CGFloat = 12
    static let contentWidth: CGFloat = width - padding * 2
    static let contentHeight: CGFloat = height - padding * 2
    static let gap: CGFloat = 12
    static let avatarSize: CGFloat = 42
    static let imageBoxSize = TokenBoxSize.large
    static let imageFallbackIconSize = TBIcon.Size.extraLarge
}

struct RecommendationMiniCardLayout<Visual: View>: View {
    let axis: TasteAxis
    let title: String
    let subtitle: String
    let detail: String
    let detailFont: Font
    var subtitleFont: Font = TBFont.regular(10)
    var onTap: (() -> Void)? = nil
    private let visual: Visual

    init(
        axis: TasteAxis,
        title: String,
        subtitle: String,
        detail: String,
        detailFont: Font = TBFont.semibold(10),
        subtitleFont: Font = TBFont.regular(10),
        onTap: (() -> Void)? = nil,
        @ViewBuilder visual: () -> Visual
    ) {
        self.axis = axis
        self.title = title
        self.subtitle = subtitle
        self.detail = detail
        self.detailFont = detailFont
        self.subtitleFont = subtitleFont
        self.onTap = onTap
        self.visual = visual()
    }

    var body: some View {
        Group {
            if let onTap {
                Button(action: onTap) {
                    cardContent
                }
                .buttonStyle(.plain)
            } else {
                cardContent
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel([title, subtitle, detail].joined(separator: ", "))
        .accessibilityAddTraits(onTap == nil ? [] : .isButton)
    }

    private var cardContent: some View {
        VStack(alignment: .leading, spacing: RecommendationMiniCardMetrics.gap) {
            visual

            RecommendationMiniCardTextLayout(
                title: title,
                subtitle: subtitle,
                detail: detail,
                axis: axis,
                detailFont: detailFont,
                subtitleFont: subtitleFont
            )
        }
        .frame(
            width: RecommendationMiniCardMetrics.contentWidth,
            height: RecommendationMiniCardMetrics.contentHeight,
            alignment: .topLeading
        )
        .platingLayoutFrame("home-card-content", when: title == TDCategory.experience.rawValue)
        .padding(RecommendationMiniCardMetrics.padding)
        .background(axis.tintColor)
        .clipShape(
            RoundedRectangle(
                cornerRadius: RecommendationMiniCardMetrics.radius,
                style: .continuous
            )
        )
        .overlay {
            RoundedRectangle(
                cornerRadius: RecommendationMiniCardMetrics.radius,
                style: .continuous
            )
            .stroke(axis.borderDefaultColor)
        }
        .platingLayoutFrame("home-card", when: title == TDCategory.experience.rawValue)
    }
}

struct RecommendationMiniCardTextLayout: View {
    let title: String
    let subtitle: String
    let detail: String
    let axis: TasteAxis
    var detailFont: Font = TBFont.semibold(10)
    var subtitleFont: Font = TBFont.regular(10)

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(TBFont.bold(14))
                    .foregroundStyle(axis.tintTextColor)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Text(subtitle)
                    .font(subtitleFont)
                    .foregroundStyle(axis.tintSubTextColor)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Spacer(minLength: 0)

            Text(detail)
                .font(detailFont)
                .foregroundStyle(axis.tintTextColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct TasteTintCard: View {
    @Environment(\.tbCardBordersVisible) private var cardBordersVisible

    let axis: TasteAxis
    let title: String
    var description: String? = nil
    var detail: String? = nil
    var symbol: String? = nil
    var onTap: (() -> Void)? = nil

    var body: some View {
        Group {
            if let onTap {
                Button(action: onTap) {
                    content
                }
                .buttonStyle(.plain)
            } else {
                content
            }
        }
        .accessibilityElement(children: .combine)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let symbol {
                LucideIcon(
                    systemName: symbol,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.medium
                )
                    .frame(width: 48, height: 48)
                    .foregroundStyle(axis.mainColor)
                    .background(TBColor.surface)
                    .clipShape(
                        RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous)
                    )
            }

            VStack(alignment: .leading, spacing: 2) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(TBFont.bold(14))
                        .foregroundStyle(axis.tintTextColor)
                        .lineLimit(1)

                    if let description {
                        Text(description)
                            .font(TBFont.regular(10))
                            .foregroundStyle(axis.tintSubTextColor)
                            .lineLimit(1)
                    }
                }

                Spacer(minLength: 0)

                if let detail {
                    Text(detail)
                        .font(TBFont.semibold(10))
                        .foregroundStyle(axis.tintTextColor)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .padding(12)
        .frame(width: 132, height: 132, alignment: .topLeading)
        .background(axis.tintColor)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
        .overlay {
            if cardBordersVisible {
                RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                    .stroke(axis.borderDefaultColor, lineWidth: 1)
            }
        }
    }
}

struct TasteTintMiniCard: View {
    let entry: TasteAxisAnalysis
    var subtitleOverride: String? = nil
    var onTap: (() -> Void)? = nil

    var body: some View {
        RecommendationMiniCardLayout(
            axis: entry.axis,
            title: entry.axis.label,
            subtitle: subtitleOverride ?? entry.deltaSummary,
            detail: entry.detail,
            onTap: onTap
        ) {
            LucideIcon(
                systemName: entry.directionSymbol,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.medium
            )
            .frame(
                width: RecommendationMiniCardMetrics.avatarSize,
                height: RecommendationMiniCardMetrics.avatarSize
            )
            .foregroundStyle(entry.axis.mainColor)
            .background(TBColor.surface)
            .clipShape(Circle())
        }
    }
}

struct SummaryMetricCard: View {
    let metric: ProfileActivityMetric
    var onTap: (() -> Void)? = nil

    var body: some View {
        Group {
            if let onTap {
                Button(action: onTap) {
                    content
                }
                .buttonStyle(.plain)
            } else {
                content
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(onTap == nil ? [] : .isButton)
    }

    private var content: some View {
        SectionCard(showsBorder: false) {
            HStack(spacing: 8) {
                LucideIcon(
                    systemName: metric.symbol,
                    size: TBIcon.Size.medium,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .frame(
                        width: 40,
                        height: 40
                    )
                    .foregroundStyle(metric.color)
                    .background(metric.color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))

                VStack(alignment: .leading, spacing: 0) {
                    Text(metric.label)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineLimit(1)
                    Text(metric.value)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(TBColor.textPrimary)
                        .lineLimit(1)
                }
            }
        }
    }
}

enum ProfileConfidenceStage: String, CaseIterable {
    case starter = "Starter"
    case building = "Building"
    case refined = "Refined"

    var title: String {
        switch self {
        case .starter: "첫 기준으로 다음 식사를 맞추기 시작한 Starter 단계예요"
        case .building: "다음 식사를 더 안정적으로 맞춰가는 Building 단계예요"
        case .refined: "다음 식사에 안정적으로 반영되는 Refined 단계예요"
        }
    }

    var description: String {
        switch self {
        case .starter:
            "첫 기준으로 현재 취향의 기본 윤곽이 만들어졌어요. 지금도 메뉴 선택과 매장 전달에는 바로 활용할 수 있고, 한두 번 더 쌓이면 더 안정적인 가이드가 됩니다."
        case .building:
            "측정과 식사 피드백이 겹치며 무엇이 잘 맞고 어디에서 조정이 필요한지 읽히기 시작했어요. 현재도 충분히 유용하고, 반복될수록 다음 식사에 더 정교하게 반영됩니다."
        case .refined:
            "반복 측정과 피드백이 누적되어, 취향과 컨디션 변화의 패턴이 비교적 안정적으로 읽히는 상태예요. 작은 업데이트만으로도 좋은 개인화를 유지할 수 있어요."
        }
    }

    var nextStep: String {
        switch self {
        case .starter:
            "한 번 더 점검하거나 첫 식사 피드백이 쌓이면 다음 식사에 반영되는 기준이 더 자연스러워져요."
        case .building:
            "이번 식사의 짧은 피드백 한 줄이 다음 식사와 매장 전달 가이드를 더 안정적으로 맞춰줘요."
        case .refined:
            "중요한 예약 전에만 현재 컨디션을 다시 반영해도 다음 식사에 충분히 좋은 정확도를 유지할 수 있어요."
        }
    }

    var caption: String {
        switch self {
        case .starter: "첫 측정 기준"
        case .building: "반복 학습 중"
        case .refined: "충분히 안정화"
        }
    }
}

struct ProfileConfidenceCard: View {
    let measurementAgeLabel: String
    let measurementCount: Int
    var needsMeasurementRefresh = false
    let stage: ProfileConfidenceStage
    let strongestAxis: TasteAxis
    let weakestAxis: TasteAxis

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        OutlineBadge(title: "\(stage.rawValue) Profile")

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Profile Confidence")
                                .font(TBFont.semibold(12))
                                .foregroundStyle(TBColor.textHint)
                            Text(stage.title)
                                .font(TBFont.bold(16))
                                .foregroundStyle(TBColor.textPrimary)
                                .lineSpacing(1)
                        }
                    }

                    Spacer(minLength: 0)

                    HStack(spacing: 4) {
                        Text(measurementCount <= 1 ? "측정 기준" : "누적 기준")
                            .font(TBFont.medium(10))
                            .foregroundStyle(TBColor.textHint)
                        Text("\(measurementCount)회")
                            .font(TBFont.semibold(10))
                            .foregroundStyle(TBColor.textPrimary)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(TBColor.mutedSurface)
                    .clipShape(Capsule())
                }

                Text(stage.description)
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textSubtle)
                    .lineSpacing(3)

                HStack(spacing: 8) {
                    ForEach(ProfileConfidenceStage.allCases, id: \.self) { item in
                        ProfileConfidenceStageBox(
                            stage: item,
                            state: stageState(for: item)
                        )
                    }
                }

                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("지금 식사에 먼저 반영되는 포인트")
                            .font(TBFont.semibold(12))
                            .foregroundStyle(TBColor.textHint)
                        Text("지금 프로필에서 비교적 먼저 읽히는 축이에요.")
                            .font(TBFont.regular(11))
                            .foregroundStyle(TBColor.textSubtle)
                        HStack(spacing: 8) {
                            Chip(title: strongestAxis.label, value: "우선 반영", tasteAxis: strongestAxis, size: .small)
                            Chip(title: weakestAxis.label, value: "더 확인 중", tasteAxis: weakestAxis, size: .small)
                        }
                        .padding(.top, 4)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("다음 식사에 더 잘 반영되는 순간")
                            .font(TBFont.semibold(12))
                            .foregroundStyle(TBColor.textHint)
                        Text(
                            needsMeasurementRefresh
                                ? "최근 컨디션을 다시 반영하면 이번 예약에 현재 프로필이 더 자연스럽게 맞춰져요."
                                : stage.nextStep
                        )
                        .font(TBFont.regular(13))
                        .foregroundStyle(TBColor.textPrimary)
                        .lineSpacing(3)
                        Text("최근 기준 \(measurementAgeLabel)")
                            .font(TBFont.regular(11))
                            .foregroundStyle(TBColor.textSubtle)
                    }
                }
            }
        }
    }

    private func stageState(for item: ProfileConfidenceStage) -> ProfileConfidenceStageBox.State {
        let currentIndex = ProfileConfidenceStage.allCases.firstIndex(of: stage) ?? 0
        let itemIndex = ProfileConfidenceStage.allCases.firstIndex(of: item) ?? 0
        if itemIndex == currentIndex { return .current }
        return itemIndex < currentIndex ? .past : .future
    }
}

private struct ProfileConfidenceStageBox: View {
    enum State {
        case past
        case current
        case future
    }

    let stage: ProfileConfidenceStage
    let state: State

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(stage.rawValue)
                .font(TBFont.semibold(12))
                .foregroundStyle(state == .current ? TBColor.textPrimary : TBColor.textHint)
            Text(stage.caption)
                .font(TBFont.regular(11))
                .foregroundStyle(TBColor.textMuted)
                .lineLimit(2)
        }
        .padding(12)
        .frame(maxWidth: .infinity, minHeight: 72, alignment: .topLeading)
        .background(state == .current ? TBColor.mutedSurface : TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous)
                .stroke(
                    state == .current ? TBColor.textSecondary : TBColor.borderDisabled,
                    style: StrokeStyle(
                        lineWidth: 1,
                        dash: state == .future ? [4, 3] : []
                    )
                )
        }
        .opacity(state == .past ? 0.7 : 1)
    }
}
