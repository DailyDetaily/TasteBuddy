import SwiftUI
import UIKit

/// Geometry variants keep the existing dining and authentication forms distinct.
enum TBTextInputVariant {
    case dining
    case auth

    var minimumHeight: CGFloat { self == .dining ? 44 : 48 }
    var cornerRadius: CGFloat { self == .dining ? TBRadius.control : TBRadius.row }
    var font: Font { self == .dining ? TBFont.semibold(13) : TBFont.regular(14) }
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
        return isFocused ? TBColor.textSecondary : TBColor.border
    }

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x8) {
            if let label {
                Text(label)
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textMuted)
                    .accessibilityHidden(true)
            }

            TextField(
                "",
                text: $text,
                prompt: Text(placeholder).foregroundStyle(TBColor.textHint)
            )
            .font(variant.font)
            .foregroundStyle(isEffectivelyEnabled ? TBColor.textPrimary : TBColor.textDisabled)
            .tint(TBColor.textPrimary)
            .focused(focus ?? $internalFocus)
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
            }
            .disabled(!isEnabled)
            .onSubmit(onSubmit)
            .accessibilityLabel(accessibilityName ?? label ?? placeholder)
            .accessibilityHint(errorText.map { "오류: \($0)" } ?? helperText ?? "")

            if let message {
                Text(message)
                    .font(TBFont.regular(12))
                    .foregroundStyle(errorText == nil ? TBColor.textBody : TBColor.destructive)
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

/// Selection behavior around the existing neutral Chip color and type vocabulary.
struct TBSelectableChip: View {
    @Environment(\.isEnabled) private var environmentIsEnabled

    let title: String
    var isSelected = false
    var variant: TBSelectableChipVariant = .dining
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
        if isSelected { return ChipStyle.resolve(tone: .neutral, variant: .solid) }
        return ChipStyle(
            background: variant.background,
            border: variant.border,
            foreground: ChipStyle.resolve(tone: .neutral, variant: .soft).foreground
        )
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(ChipSize.medium.font)
                .lineLimit(variant == .dining ? 1 : nil)
                .fixedSize(horizontal: variant == .dining, vertical: true)
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
