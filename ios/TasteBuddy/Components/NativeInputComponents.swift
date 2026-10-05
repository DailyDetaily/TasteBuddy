import SwiftUI
import UIKit

/// Geometry variants keep the existing dining and authentication forms distinct.
enum TBTextInputVariant {
    case dining
    case auth
    case profile

    var minimumHeight: CGFloat { self == .dining ? 44 : 48 }
    var cornerRadius: CGFloat { self == .dining ? TBRadius.control : TBRadius.row }
    var font: Font {
        switch self {
        case .dining: return TBFont.semibold(13)
        case .auth: return TBFont.regular(14)
        case .profile: return TBFont.semibold(14)
        }
    }
}

/// An editable field; validation, keyboard choice and submission belong to the caller.
struct TBTextInput: View {
    @Environment(\.isEnabled) private var environmentIsEnabled
    @FocusState private var internalFocus: Bool

    @Binding var text: String
    let placeholder: String
    var label: String? = nil
    var accessibilityName: String? = nil
    var helperText: String? = nil
    var errorText: String? = nil
    var variant: TBTextInputVariant = .dining
    var isEnabled = true
    var focus: FocusState<Bool>.Binding? = nil
    var keyboardType: UIKeyboardType = .default
    var textContentType: UITextContentType? = nil
    var submitLabel: SubmitLabel = .done
    var onSubmit: () -> Void = {}

    private var isEffectivelyEnabled: Bool { isEnabled && environmentIsEnabled }
    private var isFocused: Bool { focus?.wrappedValue ?? internalFocus }
    private var message: String? { errorText ?? helperText }

    private var borderColor: Color {
        if !isEffectivelyEnabled { return TBColor.borderDisabled }
        if errorText != nil { return TBColor.destructive }
        return isFocused ? TBColor.focusRing : TBColor.border
    }

    @ViewBuilder
    private var focusedTextField: some View {
        if let focus {
            baseTextField.focused(focus)
        } else {
            baseTextField.focused($internalFocus)
        }
    }

    private var baseTextField: some View {
        TextField(
            "",
            text: $text,
            prompt: Text(placeholder).foregroundStyle(TBColor.textHint)
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x8) {
            if let label {
                Text(label)
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textMuted)
                    .accessibilityHidden(true)
            }

            focusedTextField
            .font(variant.font)
            .foregroundStyle(isEffectivelyEnabled ? TBColor.textPrimary : TBColor.textDisabled)
            .tint(TBColor.textPrimary)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .keyboardType(keyboardType)
            .textContentType(textContentType)
            .submitLabel(submitLabel)
            .padding(.horizontal, TBSpacing.x12)
            .padding(.vertical, TBSpacing.x10)
            .frame(minHeight: variant.minimumHeight)
            .background(isEffectivelyEnabled ? TBColor.surface : TBColor.disabledSurface)
            .clipShape(RoundedRectangle(cornerRadius: variant.cornerRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: variant.cornerRadius, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
                    .allowsHitTesting(false)
            }
            .disabled(!isEnabled)
            .onSubmit(onSubmit)
            .accessibilityLabel(accessibilityName ?? label ?? placeholder)
            .accessibilityHint(errorText.map { "오류: \($0)" } ?? helperText ?? "")
            .platingLayoutFrame("sheet-input", when: variant == .auth && keyboardType == .emailAddress)

            if let message {
                Text(message)
                    .font(TBFont.regular(variant == .profile ? 11 : 12))
                    .foregroundStyle(errorText == nil ? (variant == .profile ? TBColor.textFaint : TBColor.textBody) : TBColor.destructive)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

/// A field-shaped trigger. The screen supplies its date, single- or multiple-choice picker.
struct TBSelectField: View {
    @Environment(\.isEnabled) private var environmentIsEnabled
    let label: String
    var value: String? = nil
    var placeholder = "선택해 주세요"
    var helperText: String? = nil
    var errorText: String? = nil
    var isEnabled = true
    var isExpanded = false
    let action: () -> Void

    private var isEffectivelyEnabled: Bool { isEnabled && environmentIsEnabled }
    private var selectedValue: String? {
        value.flatMap { $0.isEmpty || $0 == placeholder ? nil : $0 }
    }
    private var borderColor: Color {
        if !isEffectivelyEnabled { return TBColor.borderDisabled }
        if errorText != nil { return TBColor.destructive }
        return isExpanded ? TBColor.focusRing : TBColor.border
    }

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x8) {
            Text(label)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textMuted)
                .accessibilityHidden(true)

            Button(action: action) {
                HStack(spacing: TBSpacing.x12) {
                    Text(selectedValue ?? placeholder)
                        .font(TBTextInputVariant.profile.font)
                        .foregroundStyle(isEffectivelyEnabled
                            ? (selectedValue == nil ? TBColor.textHint : TBColor.textPrimary)
                            : TBColor.textDisabled)
                        .lineLimit(1)
                    Spacer()
                    LucideIcon(.chevronDown, size: TBIcon.Size.small, strokeWidth: TBIcon.Stroke.strong)
                        .foregroundStyle(isEffectivelyEnabled ? TBColor.iconPrimary : TBColor.textDisabled)
                        .accessibilityHidden(true)
                }
                .padding(.horizontal, TBSpacing.x12)
                .frame(minHeight: TBTextInputVariant.profile.minimumHeight)
                .background(isEffectivelyEnabled ? TBColor.surface : TBColor.disabledSurface)
                .clipShape(RoundedRectangle(cornerRadius: TBTextInputVariant.profile.cornerRadius, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBTextInputVariant.profile.cornerRadius, style: .continuous)
                        .stroke(borderColor, lineWidth: 1)
                        .allowsHitTesting(false)
                }
            }
            .buttonStyle(.plain)
            .disabled(!isEnabled)
            .accessibilityLabel(label)
            .accessibilityValue(selectedValue ?? placeholder)
            .accessibilityHint(errorText.map { "오류: \($0)" } ?? helperText ?? "선택창 열기")

            if let message = errorText ?? helperText {
                Text(message)
                    .font(TBFont.regular(11))
                    .foregroundStyle(errorText == nil ? TBColor.textFaint : TBColor.destructive)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

/// Bounded native multiline editing. The caller owns validation and persistence.
/// Reuses the dining memo's 20pt surface; large text expands the editing viewport.
enum TBTextAreaMetrics {
    static func height(minimum: CGFloat, scale: CGFloat) -> CGFloat {
        let base = minimum.isFinite && minimum > 0 ? minimum : 156
        let factor = scale.isFinite && scale > 0 ? max(1, scale) : 1
        return base * factor
    }
}

struct TBTextArea: View {
    @Environment(\.isEnabled) private var environmentIsEnabled
    @FocusState private var internalFocus: Bool
    @ScaledMetric(relativeTo: .body) private var editorScale: CGFloat = 1

    @Binding var text: String
    let label: String
    var placeholder = ""
    var accessibilityName: String? = nil
    var helperText: String? = nil
    var errorText: String? = nil
    var minimumHeight: CGFloat = 156
    var isEnabled = true
    var focus: FocusState<Bool>.Binding? = nil

    private var isEffectivelyEnabled: Bool { isEnabled && environmentIsEnabled }
    private var isFocused: Bool { focus?.wrappedValue ?? internalFocus }
    private var borderColor: Color {
        if !isEffectivelyEnabled { return TBColor.borderDisabled }
        if errorText != nil { return TBColor.destructive }
        return isFocused ? TBColor.focusRing : TBColor.border
    }

    @ViewBuilder
    private var editor: some View {
        if let focus { TextEditor(text: $text).focused(focus) }
        else { TextEditor(text: $text).focused($internalFocus) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x8) {
            Text(label)
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityHidden(true)
            ZStack(alignment: .topLeading) {
                editor
                    .font(TBFont.regular(13))
                    .foregroundStyle(isEffectivelyEnabled ? TBColor.textPrimary : TBColor.textDisabled)
                    .scrollContentBackground(.hidden)
                    .tint(TBColor.textPrimary)
                    .accessibilityLabel(accessibilityName ?? label)
                    .accessibilityHint(errorText.map { "오류: \($0)" } ?? helperText ?? "")
                if text.isEmpty && !placeholder.isEmpty {
                    Text(placeholder)
                        .font(TBFont.regular(13))
                        .foregroundStyle(isEffectivelyEnabled ? TBColor.textHint : TBColor.textDisabled)
                        .padding(.horizontal, 5)
                        .padding(.vertical, TBSpacing.x8)
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
            }
            .frame(height: TBTextAreaMetrics.height(minimum: minimumHeight, scale: editorScale))
            .padding(TBSpacing.x10)
            .background(isEffectivelyEnabled ? TBColor.surface : TBColor.disabledSurface,
                        in: RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                    .strokeBorder(borderColor, lineWidth: isEffectivelyEnabled && isFocused ? 2 : 1)
                    .allowsHitTesting(false)
            }
            .disabled(!isEnabled)
            if let message = errorText ?? helperText {
                Text(message)
                    .font(TBFont.regular(12))
                    .foregroundStyle(errorText == nil ? TBColor.textBody : TBColor.destructiveText)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

enum TBSelectableChipVariant {
    case dining
    case correction

    var background: Color { self == .dining ? TBColor.mutedSurface : TBColor.surface }
    var border: Color { self == .dining ? TBColor.border : TBColor.borderSubtle }
}

/// Shared selection behavior with neutral defaults and optional taste-axis colors.
struct TBSelectableChip: View {
    @Environment(\.isEnabled) private var environmentIsEnabled

    let title: String
    var iconName: String? = nil
    var iconAssetName: String? = nil
    var isSelected = false
    var variant: TBSelectableChipVariant = .dining
    var accentAxis: TasteAxis? = nil
    var isEnabled = true
    let action: () -> Void

    private var isEffectivelyEnabled: Bool { isEnabled && environmentIsEnabled }
    private var style: ChipStyle {
        if !isEffectivelyEnabled {
            return ChipStyle(
                background: TBColor.disabledSurface,
                border: TBColor.borderDisabled,
                foreground: TBColor.textDisabled
            )
        }
        if isSelected {
            if let accentAxis {
                return ChipStyle(
                    background: accentAxis.tintColor,
                    border: accentAxis.mainColor.opacity(0.28),
                    foreground: accentAxis.mainColor
                )
            }
            return ChipStyle.resolve(tone: .neutral, variant: .solid)
        }
        return ChipStyle(
            background: variant.background,
            border: variant.border,
            foreground: accentAxis == nil
                ? ChipStyle.resolve(tone: .neutral, variant: .soft).foreground
                : TBColor.textSubtle
        )
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let iconAssetName {
                    Image(iconAssetName)
                        .renderingMode(.template)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 16, height: 16)
                        .accessibilityHidden(true)
                } else if let iconName {
                    LucideIcon(
                        systemName: iconName,
                        size: 14,
                        strokeWidth: 1.8
                    )
                }
                Text(title)
                    .font(ChipSize.medium.font)
                    .lineLimit(variant == .dining ? 1 : nil)
                    .fixedSize(horizontal: variant == .dining, vertical: true)
            }
            .foregroundStyle(style.foreground)
            .padding(.horizontal, ChipSize.medium.horizontalPadding)
            .padding(.vertical, variant == .correction ? 9 : 8)
            .frame(minHeight: variant == .dining ? 36 : nil)
            .background(style.background)
            .clipShape(Capsule())
            .overlay {
                Capsule().strokeBorder(style.border, lineWidth: 1)
            }
        }
        .buttonStyle(TBTokenButtonStyle())
        .disabled(!isEnabled)
        .accessibilityLabel(title)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        .tasteBloomMotion(.feedback, value: isSelected)
    }
}

private struct NativeInputStatesPreview: View {
    @State private var restaurant = ""
    @State private var email = "taste@example.com"
    @State private var invalidEmail = "taste@"
    @State private var isSelected = true

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.x20) {
                TBTextInput(
                    text: $restaurant,
                    placeholder: "예: 정식당",
                    label: "식당명",
                    helperText: "방문한 식당 이름을 남겨주세요."
                )
                TBTextInput(
                    text: $invalidEmail,
                    placeholder: "이메일을 입력해주세요",
                    label: "이메일",
                    errorText: "이메일 주소를 확인해주세요.",
                    variant: .auth,
                    keyboardType: .emailAddress,
                    textContentType: .emailAddress
                )
                TBTextInput(
                    text: $email,
                    placeholder: "이메일을 입력해주세요",
                    label: "전송 중인 이메일",
                    variant: .auth,
                    isEnabled: false
                )
                TBWrapLayout(spacing: TBSpacing.x8) {
                    TBSelectableChip(title: "디저트", isSelected: isSelected) {
                        isSelected.toggle()
                    }
                    TBSelectableChip(title: "주소", variant: .correction) {}
                    TBSelectableChip(title: "선택 불가", isEnabled: false) {}
                }
            }
            .padding(TBSpacing.page)
        }
        .background(TBColor.page)
    }
}

#if canImport(PreviewsMacros)
    #Preview("입력과 선택 · 실제 상태") {
        NativeInputStatesPreview()
    }

    #Preview("입력과 선택 · 글자 확대") {
        NativeInputStatesPreview()
            .environment(\.dynamicTypeSize, .accessibility2)
    }

    #Preview("정보 수정 칩 · 좁은 화면과 글자 확대") {
        TBFlowLayout(spacing: TBSpacing.x8) {
            ForEach(["주소", "영업시간", "인스타그램"], id: \.self) { title in
                TBSelectableChip(
                    title: title,
                    isSelected: title == "인스타그램",
                    variant: .correction
                ) {}
            }
        }
        .frame(width: 280)
        .padding(TBSpacing.page)
        .background(TBColor.page)
        .environment(\.dynamicTypeSize, .accessibility2)
    }
#endif
