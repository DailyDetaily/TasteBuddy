import SwiftUI

struct StepBadge: View {
    let currentIndex: Int
    let total: Int

    var body: some View {
        OutlineBadge(title: "\(min(currentIndex + 1, total)) / \(total)")
            .accessibilityLabel("진행 단계 \(min(currentIndex + 1, total)) / \(total)")
    }
}

struct TCSBadge: View {
    let title: String
    var axes: [TasteAxis] = [.sweet, .sour, .umami]
    var isEnabled = true

    var body: some View {
        Text(title)
            .font(TBFont.bold(10))
            .foregroundStyle(TBColor.textInverse)
            .lineLimit(1)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.badge, style: .continuous))
            .shadow(color: Color.black.opacity(0.10), radius: 8, x: 0, y: 2)
            .fixedSize(horizontal: true, vertical: false)
    }

    private var background: some ShapeStyle {
        if isEnabled {
            return AnyShapeStyle(
                LinearGradient(
                    colors: axes.prefix(4).map(\.mainColor),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
        }

        return AnyShapeStyle(TBColor.disabledSurface)
    }
}

enum TCSHintCardSurface {
    case nested
    case standalone
}

struct TCSHintCard: View {
    let description: String
    var title: String? = nil
    var icon: LucideIconName = .sparkles
    var surface: TCSHintCardSurface = .nested

    var body: some View {
        SectionCard(background: surface == .standalone ? TBColor.surface : TBColor.mutedSurface) {
            HStack(alignment: .top, spacing: 12) {
                TokenBox(size: .small, background: TBColor.surface, foreground: TBColor.textPrimary) {
                    LucideIcon(icon, size: TBIcon.Size.medium, strokeWidth: TBIcon.Stroke.regular)
                }

                VStack(alignment: .leading, spacing: title == nil ? 0 : 2) {
                    if let title {
                        Text(title)
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)
                    }

                    Text(description)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textSubtle)
                        .lineSpacing(3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}

struct TasteProfileAvatar: View {
    let scores: [TasteAxis: Int]
    var size: CGFloat = 48

    var body: some View {
        ZStack {
            Circle()
                .fill(TBColor.mutedSurface)

            AngularGradient(
                colors: gradientColors,
                center: .center
            )
            .clipShape(Circle())
            .opacity(0.88)

            Circle()
                .stroke(TBColor.borderAvatarSoft, lineWidth: 1)

            Text(initials)
                .font(TBFont.bold(size * 0.24))
                .foregroundStyle(TBColor.textPrimary)
                .padding(6)
                .background(TBColor.overlaySurface)
                .clipShape(Circle())
        }
        .frame(width: size, height: size)
        .accessibilityLabel("미각 프로필 아바타")
    }

    private var gradientColors: [Color] {
        let ordered = TasteAxis.allCases.sorted {
            (scores[$0] ?? 50) > (scores[$1] ?? 50)
        }
        let colors = ordered.flatMap { axis in
            Array(repeating: axis.mainColor, count: max(1, (scores[axis] ?? 50) / 18))
        }
        return colors + [colors.first ?? TBColor.textPrimary]
    }

    private var initials: String {
        TasteAxis.allCases
            .sorted { (scores[$0] ?? 50) > (scores[$1] ?? 50) }
            .prefix(2)
            .map { String($0.label.prefix(1)) }
            .joined()
    }
}

struct PalateSignatureAvatar: View {
    let profile: TasteProfile
    var size: CGFloat = 64

    var body: some View {
        ZStack {
            ForEach(Array(profile.topAxes.prefix(3).enumerated()), id: \.offset) { index, axis in
                Circle()
                    .stroke(axis.mainColor.opacity(0.24), lineWidth: CGFloat(10 - index * 2))
                    .frame(
                        width: size - CGFloat(index * 12),
                        height: size - CGFloat(index * 12)
                    )
                    .blur(radius: CGFloat(index))
            }

            PalateBloomAvatar(size: size * 0.58, seed: profile.summary)
        }
        .frame(width: size, height: size)
        .accessibilityLabel("시그니처 미각 아바타")
    }
}

struct PalateOrbAvatar: View {
    let axes: [TasteAxis]
    var size: CGFloat = 56

    var body: some View {
        Canvas { context, canvasSize in
            let center = CGPoint(x: canvasSize.width / 2, y: canvasSize.height / 2)
            let radius = min(canvasSize.width, canvasSize.height) / 2
            for (index, axis) in axes.prefix(6).enumerated() {
                var wedge = Path()
                let start = Angle.degrees(Double(index) * 60 - 90).radians
                let end = Angle.degrees(Double(index + 1) * 60 - 90).radians
                wedge.move(to: center)
                wedge.addArc(center: center, radius: radius, startAngle: .radians(start), endAngle: .radians(end), clockwise: false)
                wedge.closeSubpath()
                context.fill(wedge, with: .color(axis.mainColor.opacity(index < 3 ? 0.70 : 0.34)))
            }
        }
        .clipShape(Circle())
        .overlay {
            Circle().stroke(TBColor.borderAvatar, lineWidth: 1)
        }
        .frame(width: size, height: size)
        .accessibilityLabel("미각 오브 아바타")
    }
}

struct ToastSurface: View {
    let title: String
    var message: String? = nil
    var icon: LucideIconName = .circleCheck
    var tone: StatusRow.Tone = .neutral

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            LucideIcon(icon, size: TBIcon.Size.base, strokeWidth: TBIcon.Stroke.regular)
                .frame(width: 28, height: 28)
                .foregroundStyle(tone.foreground)
                .background(tone.background)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(TBFont.semibold(13))
                    .foregroundStyle(TBColor.textPrimary)
                if let message {
                    Text(message)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(3)
                }
            }

            Spacer(minLength: 0)
        }
        .padding(12)
        .background(TBColor.focus)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
        .shadow(color: Color.black.opacity(0.10), radius: 20, x: 0, y: 4)
        .accessibilityElement(children: .combine)
    }
}

struct CardScrollList<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(alignment: .top, spacing: 10) {
                content
            }
            .padding(.vertical, 2)
        }
    }
}

struct TasteTintCardList: View {
    let entries: [RadarTasteEntry]

    var body: some View {
        LazyVGrid(
            columns: [GridItem(.adaptive(minimum: 132), spacing: 10)],
            alignment: .leading,
            spacing: 10
        ) {
            ForEach(entries) { entry in
                TasteTintCard(
                    axis: entry.axis,
                    title: entry.axis.label,
                    description: entry.score >= entry.averageScore ? "더 또렷하게 감지" : "더 부드럽게 필요",
                    detail: "현재 반응 \(entry.score)점",
                    symbol: entry.axis.symbol
                )
            }
        }
    }
}

struct TasteAxisMeter: View {
    let axis: TasteAxis
    let value: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(axis.label)
                    .font(TBFont.semibold(12))
                    .foregroundStyle(axis.tintTextColor)
                Spacer()
                Text("\(value)")
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textPrimary)
            }

            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(TBColor.borderSubtle)
                    Capsule()
                        .fill(axis.mainColor)
                        .frame(width: proxy.size.width * CGFloat(min(max(value, 0), 100)) / 100)
                }
            }
            .frame(height: TBDataViz.Progress.barHeight)
        }
        .accessibilityLabel("\(axis.label) \(value)점")
    }
}

struct HospitalityEmptyState: View {
    let title: String
    let description: String
    var actionLabel: String? = nil
    var onAction: (() -> Void)? = nil

    var body: some View {
        SectionCard(background: TBColor.elevatedSurface) {
            VStack(alignment: .leading, spacing: 14) {
                TokenBox(size: .large, background: TasteAxis.umami.tintColor, foreground: TasteAxis.umami.tintTextColor) {
                    LucideIcon(.sparkles, size: TBIcon.Size.large)
                }

                VStack(alignment: .leading, spacing: 5) {
                    Text(title)
                        .font(TBFont.bold(16))
                        .foregroundStyle(TBColor.textPrimary)
                    Text(description)
                        .font(TBFont.regular(13))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(4)
                }

                if let actionLabel, let onAction {
                    Button(action: onAction) {
                        Text(actionLabel)
                            .font(TBFont.semibold(12))
                            .foregroundStyle(TasteAxis.umami.tintTextColor)
                            .padding(.horizontal, 14)
                            .frame(height: 40)
                            .background(TasteAxis.umami.tintColor)
                            .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

struct ReservationCard: View {
    let restaurantName: String
    let status: String
    let description: String

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    SectionTitle(title: restaurantName, size: .medium)
                    Spacer()
                    StatusChip(title: status, backgroundColor: TBColor.successSoft, foregroundColor: TBColor.success)
                }
                Text(description)
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textBody)
                    .lineSpacing(4)
            }
        }
    }
}

struct InterpretationDetailDrawer<Content: View>: View {
    let title: String
    private let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        BottomSheetShell(
            headerCenter: AnyView(
                Text(title)
                    .font(TBFont.bold(15))
                    .foregroundStyle(TBColor.textPrimary)
            )
        ) {
            ScrollView {
                content
                    .padding(TBSpacing.page)
            }
        }
    }
}

struct CalibrationQuestionHeader: View {
    let title: String
    let description: String
    let currentIndex: Int
    let total: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                OutlineBadge(title: "Quick Taste Calibration")
                Spacer()
                StepBadge(currentIndex: currentIndex, total: total)
            }

            Text(title)
                .font(TBFont.bold(18))
                .foregroundStyle(TBColor.textPrimary)
                .lineSpacing(2)

            Text(description)
                .font(TBFont.regular(14))
                .foregroundStyle(TBColor.textSubtle)
                .lineSpacing(4)
        }
    }
}

enum TBUIButtonVariant {
    case primary
    case secondary
    case outline
    case destructive
    case ghost
    case link
}

struct TBUIButton: View {
    let title: String
    var variant: TBUIButtonVariant = .primary
    var size: CGFloat = TBSize.primaryButtonHeight
    var isEnabled = true
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.semibold(13))
                .foregroundStyle(foreground)
                .frame(maxWidth: .infinity)
                .frame(height: size)
                .background(background)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                        .stroke(border, lineWidth: variant == .outline ? 1 : 0)
                }
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.45)
    }

    private var background: Color {
        switch variant {
        case .primary: TBColor.textPrimary
        case .secondary: TBColor.mutedSurface
        case .outline, .ghost, .link: .clear
        case .destructive: Color.red.opacity(0.12)
        }
    }

    private var foreground: Color {
        switch variant {
        case .primary: TBColor.textInverse
        case .destructive: Color.red
        case .link: TBColor.textPrimary
        default: TBColor.textPrimary
        }
    }

    private var border: Color {
        variant == .outline ? TBColor.border : .clear
    }
}

struct TBUIBadge: View {
    let title: String
    var variant: ChipVariant = .soft

    var body: some View {
        Chip(title: title, size: .small, tone: .neutral, variant: variant)
    }
}

struct TBUICard<Content: View>: View {
    let title: String
    var description: String? = nil
    private let content: Content

    init(title: String, description: String? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.description = description
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(TBFont.semibold(14))
                    .foregroundStyle(TBColor.textPrimary)
                if let description {
                    Text(description)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(3)
                }
            }
            content
        }
        .padding(24)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                .stroke(TBColor.border)
        }
    }
}

struct TBUIInput: View {
    let placeholder: String
    var text: String = ""

    var body: some View {
        HStack {
            Text(text.isEmpty ? placeholder : text)
                .font(TBFont.regular(13))
                .foregroundStyle(text.isEmpty ? TBColor.textHint : TBColor.textPrimary)
            Spacer()
        }
        .frame(height: 44)
        .padding(.horizontal, 12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                .stroke(TBColor.border)
        }
    }
}

struct TBUITextarea: View {
    let placeholder: String
    var text: String = ""

    var body: some View {
        VStack(alignment: .leading) {
            Text(text.isEmpty ? placeholder : text)
                .font(TBFont.regular(13))
                .foregroundStyle(text.isEmpty ? TBColor.textHint : TBColor.textPrimary)
                .lineSpacing(4)
            Spacer(minLength: 0)
        }
        .frame(minHeight: 92, alignment: .topLeading)
        .padding(12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                .stroke(TBColor.border)
        }
    }
}

struct TBUISelectTrigger: View {
    let title: String

    var body: some View {
        HStack {
            Text(title)
                .font(TBFont.medium(13))
                .foregroundStyle(TBColor.textPrimary)
            Spacer()
            LucideIcon(.chevronDown, size: TBIcon.Size.small)
                .foregroundStyle(TBColor.iconPrimary)
        }
        .frame(height: 44)
        .padding(.horizontal, 12)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                .stroke(TBColor.border)
        }
    }
}

struct TBUICheckbox: View {
    let title: String
    var isChecked = false

    var body: some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 4, style: .continuous)
                .fill(isChecked ? TBColor.textPrimary : .clear)
                .frame(width: 18, height: 18)
                .overlay {
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .stroke(isChecked ? TBColor.textPrimary : TBColor.borderDisabled)
                }
                .overlay {
                    if isChecked {
                        LucideIcon(.check, size: TBIcon.Size.xSmall, strokeWidth: TBIcon.Stroke.medium)
                            .foregroundStyle(TBColor.textInverse)
                    }
                }

            Text(title)
                .font(TBFont.medium(13))
                .foregroundStyle(TBColor.textPrimary)
        }
    }
}

struct TBUIRadioGroup: View {
    let options: [String]
    var selectedIndex = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(options.enumerated()), id: \.offset) { index, option in
                HStack(spacing: 8) {
                    Circle()
                        .stroke(index == selectedIndex ? TBColor.textPrimary : TBColor.borderDisabled, lineWidth: index == selectedIndex ? 2 : 1)
                        .frame(width: 18, height: 18)
                        .overlay {
                            if index == selectedIndex {
                                Circle().fill(TBColor.textPrimary).frame(width: 8, height: 8)
                            }
                        }
                    Text(option)
                        .font(TBFont.medium(13))
                        .foregroundStyle(TBColor.textPrimary)
                }
            }
        }
    }
}

struct TBUISwitch: View {
    var isOn = true

    var body: some View {
        Capsule()
            .fill(isOn ? TBColor.textPrimary : TBColor.borderStrong)
            .frame(width: 44, height: 26)
            .overlay(alignment: isOn ? .trailing : .leading) {
                Circle()
                    .fill(TBColor.surface)
                    .frame(width: 22, height: 22)
                    .padding(2)
            }
    }
}

struct TBUITabs: View {
    let tabs: [String]
    var selectedIndex = 0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                Text(tab)
                    .font(TBFont.semibold(12))
                    .foregroundStyle(index == selectedIndex ? TBColor.textInverse : TBColor.textSecondary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 36)
                    .background(index == selectedIndex ? TBColor.textPrimary : TBColor.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
            }
        }
    }
}

struct TBUIAlert: View {
    let title: String
    let description: String
    var tone: StatusRow.Tone = .warning

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            LucideIcon(.bell, size: TBIcon.Size.base)
                .foregroundStyle(tone.foreground)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(TBFont.semibold(13))
                    .foregroundStyle(TBColor.textPrimary)
                Text(description)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textBody)
                    .lineSpacing(3)
            }
        }
        .padding(12)
        .background(tone.background.opacity(0.7))
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
    }
}

struct TBUIProgress: View {
    var value: CGFloat

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(TBColor.borderSubtle)
                Capsule()
                    .fill(TBColor.textPrimary)
                    .frame(width: proxy.size.width * min(max(value, 0), 1))
            }
        }
        .frame(height: TBDataViz.Progress.barHeight)
    }
}

struct TBUISkeleton: View {
    var height: CGFloat = 48

    var body: some View {
        RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
            .fill(TBColor.disabledSurface)
            .frame(height: height)
            .overlay {
                LinearGradient(
                    colors: [.clear, Color.white.opacity(0.54), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .opacity(0.6)
            }
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
    }
}

struct TBUISliderPreview: View {
    var value: CGFloat = 0.6
    var axis: TasteAxis = .umami

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(TBColor.borderSubtle).frame(height: 12)
                Capsule().fill(axis.mainColor.opacity(0.22)).frame(width: proxy.size.width * value, height: 12)
                Circle()
                    .fill(TBColor.surface)
                    .frame(width: 28, height: 28)
                    .overlay { Circle().stroke(axis.mainColor, lineWidth: 2) }
                    .shadow(color: Color.black.opacity(0.18), radius: 10, x: 0, y: 6)
                    .offset(x: max(0, proxy.size.width * value - 14))
            }
        }
        .frame(height: 28)
    }
}

struct TBUIDialogContent<Content: View>: View {
    let title: String
    let description: String
    private let content: Content

    init(title: String, description: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.description = description
        self.content = content()
    }

    var body: some View {
        ActionOverlayCard(title: title, description: description) {
            content
        }
    }
}

struct TBUIPopoverContent: View {
    let text: String

    var body: some View {
        Text(text)
            .font(TBFont.regular(12))
            .foregroundStyle(TBColor.textBody)
            .lineSpacing(3)
            .padding(12)
            .background(TBColor.focus)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
            .shadow(color: Color.black.opacity(0.10), radius: 20, x: 0, y: 4)
    }
}

struct TBUITooltipContent: View {
    let text: String

    var body: some View {
        Text(text)
            .font(TBFont.medium(11))
            .foregroundStyle(TBColor.textInverse)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(TBColor.textPrimary)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))
    }
}

struct TBUISheetContent<Content: View>: View {
    let title: String
    private let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        BottomSheetShell(
            headerCenter: AnyView(Text(title).font(TBFont.bold(15)).foregroundStyle(TBColor.textPrimary))
        ) {
            content.padding(TBSpacing.page)
        }
    }
}

struct TBUIDrawerContent<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        HStack {
            Spacer(minLength: 44)
            VStack(alignment: .leading, spacing: 14) {
                content
            }
            .padding(TBSpacing.page)
            .frame(width: 300, alignment: .topLeading)
            .frame(maxHeight: .infinity, alignment: .topLeading)
            .background(TBColor.focus)
            .shadow(color: Color.black.opacity(0.24), radius: 60, x: -12, y: 0)
        }
        .background(Color.black.opacity(0.35))
    }
}

struct TasteMeasurementChecklistPanel: View {
    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                SectionTitle(title: "측정 전 확인", size: .medium)
                ForEach(["물 한 모금으로 입안을 정리했어요", "향이 강한 음식은 잠시 피했어요", "지금 컨디션을 기준으로 남길게요"], id: \.self) {
                    TBUICheckbox(title: $0, isChecked: true)
                }
            }
        }
    }
}

struct TasteMeasurementIntroPanel: View {
    var body: some View {
        InterpretationCard(
            description: "지금의 컨디션을 다음 다이닝 기준으로 정리합니다.",
            eyebrow: "Quick Taste Calibration",
            supportingText: "정확도보다 일관된 시작점을 만드는 것이 먼저입니다.",
            detailLabel: "시작하기",
            accentColor: TasteAxis.sour.mainColor
        )
    }
}

struct TasteMeasurementPreparationPanel: View {
    var body: some View {
        HospitalityEmptyState(
            title: "측정을 준비하고 있어요",
            description: "짧은 확인 뒤 바로 미각 기준을 업데이트합니다.",
            actionLabel: "준비 완료"
        ) {}
    }
}

struct TasteMeasurementActivePanel: View {
    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 14) {
                CalibrationQuestionHeader(
                    title: "첫 반응을 어디에서 느꼈나요?",
                    description: "정답보다 지금 가장 먼저 떠오르는 감각을 기준으로 선택합니다.",
                    currentIndex: 0,
                    total: 6
                )
                TasteAxisMeter(axis: .sweet, value: 64)
                TBUISliderPreview(value: 0.64, axis: .sweet)
            }
        }
    }
}

struct TasteMeasurementCompletedPanel: View {
    var body: some View {
        ProfileConfidenceCard(
            measurementAgeLabel: "오늘",
            measurementCount: 1,
            stage: .starter,
            strongestAxis: .sweet,
            weakestAxis: .bitter
        )
    }
}

struct ReservationConfirmationPanel: View {
    var body: some View {
        ReservationCard(
            restaurantName: "온지음",
            status: "준비 중",
            description: "예약 생성은 native scope에서 제외하지만, 확인 화면의 카드 구조는 디자인 시스템 카탈로그에 유지합니다."
        )
    }
}

enum NativeDesignSystemInventory {
    static let architectureGroups: [(title: String, components: [String])] = [
        (
            "액션 & 플로우",
            [
                "PrimaryButton",
                "FlowBottomCta",
                "FlowStepCta",
                "FlowHeaderBlock",
                "CalibrationQuestionHeader",
                "StepIndicator",
                "StepBadge"
            ]
        ),
        (
            "상태 & 라벨",
            [
                "TCSBadge",
                "Chip",
                "OutlineBadge",
                "StatusChip",
                "TasteChip",
                "TasteProfileAvatar",
                "PalateSignatureAvatar",
                "PalateBloomAvatar",
                "PalateOrbAvatar",
                "TastePointArrowBox",
                "ToastSurface"
            ]
        ),
        (
            "입력 & 선택",
            [
                "SelectionCard",
                "Input",
                "Textarea",
                "Select",
                "Checkbox",
                "RadioGroup",
                "Switch"
            ]
        ),
        (
            "카드 & 해석",
            [
                "SectionCard",
                "PageSection",
                "ReservationCard",
                "CardDetailLabel",
                "InterpretationCard",
                "InterpretationDetailDrawer",
                "HexRadarChart",
                "TasteLineChart",
                "TasteAxisMeter",
                "TasteTintCard",
                "TasteTintCardList",
                "CardScrollList",
                "ProfileConfidenceCard",
                "HospitalityEmptyState",
                "EmptyState",
                "TasteMeasurementMiniCta"
            ]
        ),
        (
            "내비게이션 셸",
            [
                "TopAppBar",
                "BottomTabBar",
                "Tabs"
            ]
        ),
        (
            "오버레이 레이어",
            [
                "BottomSheetShell",
                "NotificationPanel",
                "AppMenuDrawer",
                "Dialog",
                "Sheet",
                "Popover",
                "Tooltip"
            ]
        ),
        (
            "스크린 & 플로우 패널",
            [
                "TasteMeasurementChecklistPanel",
                "TasteMeasurementIntroPanel",
                "TasteMeasurementPreparationPanel",
                "TasteMeasurementActivePanel",
                "TasteMeasurementCompletedPanel",
                "ImproveAccuracyScreen",
                "ReservationConfirmationScreen",
                "DiningFeedbackFlow"
            ]
        )
    ]

    static let filePreviewEntries = [
        "src/components/SectionCard.tsx",
        "src/components/system/PrimaryButton.tsx",
        "src/components/system/FlowBottomCta.tsx",
        "src/components/system/FlowStepCta.tsx",
        "src/components/system/FlowHeaderBlock.tsx",
        "src/components/system/PageSection.tsx",
        "src/components/system/StepIndicator.tsx",
        "src/components/system/StepBadge.tsx",
        "src/components/system/OutlineBadge.tsx",
        "src/components/system/Chip.tsx",
        "src/components/system/StatusChip.tsx",
        "src/components/system/TasteChip.tsx",
        "src/components/system/TastePointArrowBox.tsx",
        "src/components/system/TasteLineChart.tsx",
        "src/components/system/SectionTitle.tsx",
        "src/components/system/TCSHintCard.tsx",
        "src/components/system/TCSBadge.tsx",
        "src/components/system/BottomSheetShell.tsx",
        "src/components/system/SelectionCard.tsx",
        "src/components/system/HexRadarChart.tsx",
        "src/components/system/InterpretationCard.tsx",
        "src/components/system/CardDetailLabel.tsx",
        "src/components/system/InterpretationDetailDrawer.tsx",
        "src/components/system/ProfileConfidenceCard.tsx",
        "src/components/system/HospitalityEmptyState.tsx",
        "src/components/system/EmptyState.tsx",
        "src/components/measurement/TasteMeasurementMiniCta.tsx",
        "src/components/system/TasteTintCard.tsx",
        "src/components/system/TasteTintCardList.tsx",
        "src/components/system/CardScrollList.tsx",
        "src/components/measurement/TasteAxisMeter.tsx",
        "src/components/measurement/CalibrationQuestionHeader.tsx",
        "src/components/measurement/TasteMeasurementChecklistPanel.tsx",
        "src/components/measurement/TasteMeasurementIntroPanel.tsx",
        "src/components/measurement/TasteMeasurementPreparationPanel.tsx",
        "src/components/measurement/TasteMeasurementActivePanel.tsx",
        "src/components/measurement/TasteMeasurementCompletedPanel.tsx",
        "src/components/reservation/ReservationCard.tsx",
        "src/components/reservation/DiningFeedbackFlow.tsx",
        "src/components/ui/card.tsx",
        "src/components/ui/button.tsx",
        "src/components/ui/badge.tsx",
        "src/components/ui/input.tsx",
        "src/components/ui/textarea.tsx",
        "src/components/ui/select.tsx",
        "src/pages/OnboardingScreen.tsx",
        "src/pages/TasteSurveyIntroScreen.tsx",
        "src/pages/TasteMeasurementScreen.tsx",
        "src/pages/DiningPage.tsx",
        "src/pages/ProfilePage.tsx",
        "src/pages/ImproveAccuracyScreen.tsx",
        "src/pages/ReservationConfirmationScreen.tsx"
    ]

    static var totalArchitectureComponentCount: Int {
        architectureGroups.reduce(0) { $0 + $1.components.count }
    }

    static let currentlyUsedComponentCount = 32
    static let unusedPrimitiveCount = 20
    static let componentStyleSpecCount = 30
}
