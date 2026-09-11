import SwiftUI

struct DiningSensoryRelatedBubbleOption: Identifiable, Equatable {
    let id: String
    let label: String
}

enum DiningSensorySelectionEditing {
    static func toggled<Value: Equatable>(_ value: Value?, candidate: Value) -> Value? {
        value == candidate ? nil : candidate
    }

    static func upsert(
        _ selection: DiningSensorySelection,
        in selections: [DiningSensorySelection]
    ) -> [DiningSensorySelection] {
        guard let index = selections.firstIndex(where: {
            $0.id == selection.id && $0.type == selection.type
        }) else {
            return selections + [selection]
        }
        var updated = selections
        updated[index] = selection
        return updated
    }
}

struct DiningSensorySelectionEditor: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Binding var selection: DiningSensorySelection
    let relatedBubbles: [DiningSensoryRelatedBubbleOption]
    @State private var isExpanded = false

    init(
        selection: Binding<DiningSensorySelection>,
        relatedBubbles: [DiningSensoryRelatedBubbleOption],
        initiallyExpanded: Bool = false
    ) {
        _selection = selection
        self.relatedBubbles = relatedBubbles
        _isExpanded = State(initialValue: initiallyExpanded)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Button {
                withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) { isExpanded.toggle() }
            } label: {
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(selection.labelSnapshot)
                            .font(TBFont.semibold(13))
                            .foregroundStyle(TBColor.textPrimary)
                        Text(summary)
                            .font(TBFont.regular(11))
                            .foregroundStyle(TBColor.textHint)
                            .lineLimit(2)
                    }
                    Spacer(minLength: 8)
                    Text(isExpanded ? "접기" : "선택 평가")
                        .font(TBFont.semibold(11))
                        .foregroundStyle(TBColor.textSecondary)
                    LucideIcon(
                        isExpanded ? .chevronUp : .chevronDown,
                        size: TBIcon.Size.xSmall,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .foregroundStyle(TBColor.textHint)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if isExpanded {
                evaluationBody
                    .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
            }
        }
        .padding(14)
        .background(TBColor.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(TBColor.borderSubtle)
        }
    }

    private var evaluationBody: some View {
        VStack(alignment: .leading, spacing: 16) {
            optionalChoiceRow(
                title: "어땠나요?",
                values: DiningSensorySelection.Liking.allCases,
                selected: selection.liking,
                label: \.label
            ) { value in
                selection.liking = DiningSensorySelectionEditing.toggled(
                    selection.liking,
                    candidate: value
                )
            }

            optionalChoiceRow(
                title: "얼마나 느껴졌나요?",
                values: DiningSensorySelection.Intensity.allCases,
                selected: selection.intensity,
                label: \.label
            ) { value in
                selection.intensity = DiningSensorySelectionEditing.toggled(
                    selection.intensity,
                    candidate: value
                )
            }

            optionalChoiceRow(
                title: "양은 알맞았나요?",
                values: DiningSensorySelection.PreferenceFit.allCases,
                selected: selection.preferenceFit,
                label: \.label
            ) { value in
                selection.preferenceFit = DiningSensorySelectionEditing.toggled(
                    selection.preferenceFit,
                    candidate: value
                )
            }

            HStack(spacing: 8) {
                selectionMenu(
                    title: "대상",
                    value: selection.target.label,
                    options: DiningSensorySelection.Target.allCases
                ) { selection.target = $0 }

                selectionMenu(
                    title: "시점",
                    value: selection.phase.label,
                    options: DiningSensorySelection.Phase.allCases
                ) { selection.phase = $0 }
            }

            if selection.type == .detailTag, !relatedBubbles.isEmpty {
                Menu {
                    Button("연결 미지정") { selection.relatedBubbleID = nil }
                    ForEach(relatedBubbles) { bubble in
                        Button(bubble.label) { selection.relatedBubbleID = bubble.id }
                    }
                } label: {
                    menuLabel(
                        title: "연결",
                        value: relatedBubbleLabel
                    )
                }
            }

            Text("모든 평가는 선택사항이며, 고르지 않은 값은 미응답으로 저장됩니다.")
                .font(TBFont.regular(11))
                .foregroundStyle(TBColor.textFaint)
                .lineSpacing(3)
        }
    }

    private func optionalChoiceRow<Value: Identifiable & Equatable>(
        title: String,
        values: [Value],
        selected: Value?,
        label: KeyPath<Value, String>,
        onSelect: @escaping (Value) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(TBFont.semibold(11))
                .foregroundStyle(TBColor.textSecondary)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(values) { value in
                        TBSelectableChip(
                            title: value[keyPath: label],
                            isSelected: selected == value,
                            action: { onSelect(value) }
                        )
                    }
                }
            }
        }
    }

    private func selectionMenu<Value: Identifiable>(
        title: String,
        value: String,
        options: [Value],
        onSelect: @escaping (Value) -> Void
    ) -> some View where Value.ID == String {
        Menu {
            ForEach(options) { option in
                Button(optionLabel(option)) { onSelect(option) }
            }
        } label: {
            menuLabel(title: title, value: value)
        }
    }

    private func optionLabel<Value>(_ option: Value) -> String {
        if let target = option as? DiningSensorySelection.Target { return target.label }
        if let phase = option as? DiningSensorySelection.Phase { return phase.label }
        return "선택"
    }

    private func menuLabel(title: String, value: String) -> some View {
        HStack(spacing: 6) {
            Text("\(title): \(value)")
                .font(TBFont.semibold(11))
                .lineLimit(1)
            LucideIcon(.chevronDown, size: TBIcon.Size.xSmall, strokeWidth: TBIcon.Stroke.regular)
        }
        .foregroundStyle(TBColor.textSecondary)
        .padding(.horizontal, 10)
        .frame(minHeight: 36)
        .background(TBColor.surface)
        .clipShape(Capsule())
        .overlay { Capsule().stroke(TBColor.border) }
    }

    private var relatedBubbleLabel: String {
        guard let id = selection.relatedBubbleID else { return "미지정" }
        return relatedBubbles.first(where: { $0.id == id })?.label ?? "기존 선택"
    }

    private var summary: String {
        let responses = [
            selection.liking?.label,
            selection.intensity?.label,
            selection.preferenceFit?.label,
            selection.target == .unspecified ? nil : selection.target.label,
            selection.phase == .unspecified ? nil : selection.phase.label,
        ].compactMap { $0 }
        return responses.isEmpty ? "평가하지 않아도 저장돼요" : responses.joined(separator: " · ")
    }
}

private struct DiningSensorySelectionEditorPreview: View {
    @State private var empty = DiningSensorySelection(
        id: "umami-deep",
        type: .bubble,
        labelSnapshot: "깊은 감칠맛"
    )
    @State private var partial = DiningSensorySelection(
        id: "flow-clean-finish",
        type: .detailTag,
        labelSnapshot: "깔끔한 끝맛",
        liking: .liked,
        phase: .afterSwallow,
        relatedBubbleID: "umami-deep"
    )

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                DiningSensorySelectionEditor(selection: $empty, relatedBubbles: [])
                DiningSensorySelectionEditor(
                    selection: $partial,
                    relatedBubbles: [
                        .init(id: "umami-deep", label: "깊은 감칠맛"),
                        .init(id: "fat-coating", label: "고소한 코팅감"),
                    ],
                    initiallyExpanded: true
                )
            }
            .padding()
        }
        .background(TBColor.page)
    }
}

#Preview("Structured sensory selection states") {
    DiningSensorySelectionEditorPreview()
}
