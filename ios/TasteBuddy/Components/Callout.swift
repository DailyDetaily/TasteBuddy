import SwiftUI

enum CalloutTone: String, CaseIterable {
    case neutral, informative, positive, warning, critical

    var background: Color {
        switch self {
        case .neutral: TBColor.neutralSoft
        case .informative: TBColor.informativeSoft
        case .positive: TBColor.successSoft
        case .warning: TBColor.warningSoft
        case .critical: TBColor.destructiveSoft
        }
    }

    var foreground: Color {
        switch self {
        case .neutral: TBColor.neutral
        case .informative: TBColor.informative
        case .positive: TBColor.successText
        case .warning: TBColor.warningText
        case .critical: TBColor.destructiveText
        }
    }

    var permitsDismissal: Bool { self != .warning && self != .critical }
}

struct CalloutLink {
    let title: String
    let url: URL
}

enum CalloutInteraction {
    case display(link: CalloutLink? = nil)
    case actionable(action: () -> Void)
    case dismissible(label: String, onDismiss: () -> Void)
}

/// Inline information. The caller owns navigation and the dismissed state.
/// Warning and critical messages remain visible even if dismissal is requested.
struct Callout: View {
    let message: String
    var title: String? = nil
    var tone: CalloutTone = .neutral
    var icon: String? = "info.circle.fill"
    var interaction: CalloutInteraction = .display()

    @Environment(\.isEnabled) private var isEnabled

    @ViewBuilder
    var body: some View {
        switch interaction {
        case .actionable(let action):
            Button(action: action) {
                content(link: nil, showsChevron: true, dismiss: nil)
            }
            .buttonStyle(CalloutButtonStyle(background: tone.background))
        case .display(let link):
            content(link: link, showsChevron: false, dismiss: nil)
                .background(tone.background, in: shape)
        case .dismissible(let label, let onDismiss):
            content(link: nil, showsChevron: false,
                    dismiss: tone.permitsDismissal ? (label, onDismiss) : nil)
                .background(tone.background, in: shape)
        }
    }

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
    }

    private func content(link: CalloutLink?, showsChevron: Bool,
                         dismiss: (label: String, action: () -> Void)?) -> some View {
        HStack(alignment: .center, spacing: TBSpacing.x12) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .accessibilityHidden(true)
            }
            Text(copy(link: link))
                .font(TBFont.regular(14))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .tint(isEnabled ? tone.foreground : TBColor.textDisabled)
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .accessibilityHidden(true)
            }
            if let dismiss {
                Button(action: dismiss.action) {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .medium))
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(dismiss.label)
                .padding(.trailing, -11)
                .padding(.vertical, -11)
            }
        }
        .foregroundStyle(isEnabled ? tone.foreground : TBColor.textDisabled)
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 50, alignment: .leading)
        .contentShape(shape)
    }

    private func copy(link: CalloutLink?) -> AttributedString {
        var result = AttributedString()
        if let title, !title.isEmpty {
            var heading = AttributedString(title + "  ")
            heading.font = TBFont.semibold(14)
            result += heading
        }
        result += AttributedString(message)
        if let link {
            var anchor = AttributedString("  " + link.title)
            anchor.link = link.url
            anchor.underlineStyle = .single
            result += anchor
        }
        return result
    }
}

private struct CalloutButtonStyle: ButtonStyle {
    let background: Color
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.tbControlFeedbackReduceMotion) private var reduceControlMotion

    func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed && isEnabled
        configuration.label
            .background(background, in: RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                    .fill(pressed ? TBColor.pressedOverlay : Color.clear)
                    .allowsHitTesting(false)
            }
            .scaleEffect(pressed && !reduceMotion && !reduceControlMotion ? 0.99 : 1)
            .animation(reduceMotion || reduceControlMotion ? nil : .easeOut(duration: 0.12), value: pressed)
    }
}

#Preview("Callout · Native") {
    VStack(spacing: 16) {
        Callout(message: "기억에 남는 감각을 식사 메모로 남길 수 있어요.", title: "안내")
        Callout(message: "감각의 강도와 좋아하는 정도를 따로 기록해 주세요.", title: "안내",
                  tone: .informative, interaction: .actionable(action: {}))
        Callout(message: "한 번 읽으면 충분한 안내예요.", title: "새소식",
                  interaction: .dismissible(label: "새소식 닫기", onDismiss: {}))
    }
    .padding(20)
    .background(TBColor.page)
}
