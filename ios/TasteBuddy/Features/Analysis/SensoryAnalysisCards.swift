import SwiftUI

enum SensoryAnalysisDisplayState: Equatable {
    case empty
    case processing
    case failed(String)
    case ready(SensoryAnalysisSnapshot)
}

struct SensoryAnalysisHeroCard: View {
    let snapshot: SensoryAnalysisSnapshot

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("나의 미각 타입")
                        .font(TBFont.medium(12))
                        .foregroundStyle(TBColor.textHint)

                    Text(snapshot.mainWing.label)
                        .font(TBFont.semibold(18))
                        .tracking(-0.24)
                        .foregroundStyle(TBColor.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Text(heroDescription)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textSubtle)
                    .lineSpacing(4)

                HStack(alignment: .top, spacing: 12) {
                    recordCount(title: "완료 기록", count: snapshot.completedExperienceCount)
                    recordCount(title: "근거 기록", count: snapshot.sourceExperienceCount)
                }
                .padding(.top, 2)
            }
            .accessibilityElement(children: .combine)
        }
    }

    private var heroDescription: String {
        switch snapshot.mainWing.status {
        case "provisional_profile":
            return "반복해서 나타난 직접 평가와 감각 기록을 바탕으로 한 현재 범위의 해석이에요."
        case "ambiguous_main":
            return "서로 다른 상황의 기록이 함께 있어 한 가지 입맛으로 정하지 않고 있어요."
        default:
            return "기록한 감각과 직접 평가를 쌓으며 좋아하는 조합과 부담스러운 조건을 확인하고 있어요."
        }
    }

    private func recordCount(title: String, count: Int) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(TBFont.medium(11))
                .foregroundStyle(TBColor.textHint)
            Text("\(count)개")
                .font(TBFont.semibold(13))
                .foregroundStyle(TBColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

}

struct SensoryEvidenceSummaryCard: View {
    let observationCount: Int
    let unresolvedCount: Int
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            SectionCard {
                HStack(spacing: TBSpacing.x12) {
                    LucideIcon(
                        systemName: "doc.text.magnifyingglass",
                        size: TBIcon.Size.base,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                    .foregroundStyle(TBColor.textSecondary)
                    .frame(width: 38, height: 38)
                    .background(TBColor.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                    VStack(alignment: .leading, spacing: TBSpacing.x4) {
                        Text("기록에서 확인한 근거")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)
                        Text(summary)
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textHint)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    CardDetailLabel(label: "근거 보기")
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("기록 근거 보기. \(summary)")
    }

    private var summary: String {
        unresolvedCount > 0
            ? "감각·평가 정보 \(observationCount)개 · 확인 중인 표현 \(unresolvedCount)개"
            : "감각·평가 정보 \(observationCount)개"
    }
}

struct SensoryAnalysisStatusCard: View {
    let state: SensoryAnalysisDisplayState

    var body: some View {
        SectionCard {
            switch state {
            case .processing:
                VStack(spacing: TBSpacing.x12) {
                    ProgressView()
                        .tint(TBColor.textPrimary)
                    statusCopy(
                        title: "기록을 다시 읽고 있어요",
                        description: "완료한 경험의 감각과 직접 평가만 모아 현재 해석을 준비하고 있어요."
                    )
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, TBSpacing.section)
            case .failed(let message):
                EmptyState(
                    title: "분석을 불러오지 못했어요",
                    description: message,
                    icon: .info
                )
            case .empty:
                EmptyState(
                    title: "아직 해석할 식사 기록이 없어요",
                    description: "아래 가운데 기록 버튼에서 식사 피드백을 완료하면 감각의 세부 표현과 상황을 함께 모아 보여드려요.",
                    icon: .squarePen
                )
            case .ready:
                EmptyView()
            }
        }
    }

    private func statusCopy(title: String, description: String) -> some View {
        VStack(spacing: TBSpacing.x4) {
            Text(title)
                .font(TBFont.bold(16))
                .foregroundStyle(TBColor.textPrimary)
            Text(description)
                .font(TBFont.regular(13))
                .foregroundStyle(TBColor.textMuted)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
        }
    }
}

struct PersonalTasteCandidateGroup: Identifiable {
    let id: String
    let attribute: String
    let reference: String?
    let label: String
    let candidates: [PersonalTasteCandidate]

    var title: String {
        if positiveCandidate != nil, negativeCandidate != nil {
            return "\(label), 조건에 따라 달랐던 반응"
        }
        if candidates.contains(where: { $0.status == "mixed" }) {
            return "\(label), 상황에 따라 달랐던 기록"
        }
        return representative.conditions.isEmpty
            ? "\(label)에 남긴 평가"
            : "\(label), \(conditionText(representative))에서 남긴 평가"
    }

    var body: String {
        if let positiveCandidate, let negativeCandidate {
            return "\(summary(for: positiveCandidate)) \(summary(for: negativeCandidate))"
        }
        if let directional = [positiveCandidate, negativeCandidate].compactMap({ $0 }).first,
           let mixed = mixedCandidate {
            return "\(summary(for: directional)) \(summary(for: mixed))"
        }
        return summary(for: representative)
    }

    var mealIDs: [String] {
        Array(Set(candidates.flatMap { candidate in
            candidate.evidence.map(\.mealID)
        })).sorted()
    }

    var evidenceIDs: [String] {
        Array(Set(candidates.flatMap(\.evidenceIDs))).sorted()
    }

    var highlightedCandidates: [PersonalTasteCandidate] {
        var result = [positiveCandidate, negativeCandidate, mixedCandidate].compactMap { $0 }
        if result.isEmpty { result = [representative] }
        var seen = Set<String>()
        return result.filter { seen.insert($0.id).inserted }
    }

    private var representative: PersonalTasteCandidate {
        PersonalTasteCandidatePresentation.ordered(candidates).first!
    }

    private var positiveCandidate: PersonalTasteCandidate? {
        strongest(direction: "positive")
    }

    private var negativeCandidate: PersonalTasteCandidate? {
        strongest(direction: "negative")
    }

    private var mixedCandidate: PersonalTasteCandidate? {
        let anchor = positiveCandidate ?? negativeCandidate
        return candidates
            .filter { $0.status == "mixed" && $0.distribution.mealCount > 0 }
            .sorted { left, right in
                if let anchor {
                    let leftMatches = sharesConditionDimension(left, withDifferentValueFrom: anchor)
                    let rightMatches = sharesConditionDimension(right, withDifferentValueFrom: anchor)
                    if leftMatches != rightMatches { return leftMatches }
                }
                return PersonalTasteCandidatePresentation.precedes(left, right)
            }
            .first
    }

    private func sharesConditionDimension(
        _ candidate: PersonalTasteCandidate,
        withDifferentValueFrom anchor: PersonalTasteCandidate
    ) -> Bool {
        candidate.conditions.contains { condition in
            anchor.conditions.contains {
                $0.dimension == condition.dimension && $0.value != condition.value
            }
        }
    }

    private func strongest(direction: String) -> PersonalTasteCandidate? {
        candidates
            .filter { $0.direction == direction && $0.distribution.mealCount > 0 }
            .sorted(by: PersonalTasteCandidatePresentation.precedes)
            .first
    }

    func conditionText(_ candidate: PersonalTasteCandidate) -> String {
        if candidate.conditions.isEmpty { return "기록한 식사" }
        return candidate.conditions
            .map { PersonalTasteConditionLabels.label(for: $0) }
            .joined(separator: " · ")
    }

    func summary(for candidate: PersonalTasteCandidate) -> String {
        let mealCount = candidate.distribution.mealCount
        let subject = candidate.conditions.isEmpty
            ? label
            : "\(conditionText(candidate)) \(label)"
        if let direction = candidate.direction {
            let response = [
                "positive": "호감",
                "neutral": "보통",
                "negative": "아쉬움",
            ][direction] ?? "같은 반응"
            return "\(subject)는 \(mealCount)번의 식사에서 \(response)을 남겼어요."
        }
        var responses: [String] = []
        if candidate.distribution.positive > 0 { responses.append("호감") }
        if candidate.distribution.neutral > 0 { responses.append("중립") }
        if candidate.distribution.negative > 0 { responses.append("아쉬움") }
        if candidate.distribution.mixed > 0 { responses.append("한 식사 안의 다른 평가") }
        if responses.count > 1 {
            let joined = responses.dropLast().joined(separator: ", ") + "과 " + responses.last!
            return "\(subject)에는 \(joined)이 함께 있었어요."
        }
        if let response = responses.first {
            return "\(subject)는 \(mealCount)번의 식사에서 \(response)을 남겼고 더 확인하고 있어요."
        }
        return "\(subject)는 아직 방향을 정할 평가가 부족해요."
    }
}

enum PersonalTasteCandidatePresentation {
    static func groups(_ candidates: [PersonalTasteCandidate]) -> [PersonalTasteCandidateGroup] {
        let grouped = Dictionary(grouping: candidates.filter { $0.distribution.mealCount > 0 }) {
            [$0.attribute, $0.reference ?? ""].joined(separator: "|")
        }
        return grouped.keys.sorted().compactMap { key in
            guard let values = grouped[key], let first = values.first else { return nil }
            return PersonalTasteCandidateGroup(
                id: key,
                attribute: first.attribute,
                reference: first.reference,
                label: first.label,
                candidates: ordered(values)
            )
        }
        .sorted {
            if $0.mealIDs.count != $1.mealIDs.count {
                return $0.mealIDs.count > $1.mealIDs.count
            }
            return $0.id < $1.id
        }
    }

    static func ordered(_ candidates: [PersonalTasteCandidate]) -> [PersonalTasteCandidate] {
        candidates.sorted(by: precedes)
    }

    static func precedes(_ left: PersonalTasteCandidate, _ right: PersonalTasteCandidate) -> Bool {
        let priority = [
            "repeated_direction": 0,
            "mixed": 1,
            "unstable": 2,
            "first_signal": 3,
            "insufficient_context": 4,
        ]
        let leftPriority = priority[left.status, default: 5]
        let rightPriority = priority[right.status, default: 5]
        if leftPriority != rightPriority { return leftPriority < rightPriority }
        if left.conditions.isEmpty != right.conditions.isEmpty {
            return !left.conditions.isEmpty
        }
        if left.conditions.count != right.conditions.count {
            return left.conditions.count < right.conditions.count
        }
        if left.distribution.mealCount != right.distribution.mealCount {
            return left.distribution.mealCount > right.distribution.mealCount
        }
        return left.id < right.id
    }

    static func eyebrow(_ group: PersonalTasteCandidateGroup) -> String {
        let mealCount = group.mealIDs.count
        if group.candidates.contains(where: { !$0.counterMealIDs.isEmpty || $0.status == "mixed" }) {
            return "\(mealCount)번의 식사 · 조건과 다른 기록 포함"
        }
        return mealCount > 1 ? "\(mealCount)번의 식사에서 조건 비교" : "첫 단서 · 1번의 식사"
    }
}

struct TasteQuestionChoice: Identifiable, Equatable {
    let id: String
    let title: String
}

struct TasteQuestionMedia: View {
    var photoFilename: String?
    var illustrationSeed: String
    @Environment(\.displayScale) private var displayScale
    @State private var thumbnail: CGImage?
    @State private var loadedPhotoFilename: String?

    var body: some View {
        Group {
            if let thumbnail, loadedPhotoFilename == photoFilename {
                Image(decorative: thumbnail, scale: displayScale, orientation: .up)
                    .resizable().scaledToFill()
            } else {
                PalateBloomAvatar(size: 48, tasteProfile: nil, shapeSeed: illustrationSeed, showFrame: false)
            }
        }
        .frame(width: 60, height: 60)
        .background(TBColor.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))
        .accessibilityHidden(true)
        .task(id: photoFilename) {
            thumbnail = nil
            loadedPhotoFilename = nil
            guard let photoFilename else { return }
            let image = await DiningReflectionPhotoStore.thumbnail(
                for: photoFilename, fillingSquareOf: max(1, Int(ceil(60 * displayScale)))
            )
            guard !Task.isCancelled else { return }
            thumbnail = image
            loadedPhotoFilename = photoFilename
        }
    }
}

/// 질문의 출처나 학습 방식과 분리된 표시 컴포넌트. 뒷면은 질문 수를 나타내지 않는 장식이다.
struct TasteQuestionStackCard: View {
    let question: String
    let supportingText: String
    let choices: [TasteQuestionChoice]
    var photoFilename: String?
    var showsMedia: Bool
    var illustrationSeed: String
    var showsStack = true
    var isStackExpanded = false
    var onToggleStack: (() -> Void)?
    var fallbackActionTitle = "기록에서 답하기"
    var onConfirm: ((String) -> String?)? = nil
    var onStartRecord: (() -> Void)? = nil
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isExpanded: Bool
    @State private var selectedID: String?
    @State private var errorMessage: String?
    @State private var submitted = false

    init(
        question: String,
        supportingText: String,
        choices: [TasteQuestionChoice],
        photoFilename: String? = nil,
        showsMedia: Bool = true,
        illustrationSeed: String = "taste-question",
        showsStack: Bool = true,
        initiallyExpanded: Bool = false,
        isStackExpanded: Bool = false,
        onToggleStack: (() -> Void)? = nil,
        fallbackActionTitle: String = "기록에서 답하기",
        onConfirm: ((String) -> String?)? = nil,
        onStartRecord: (() -> Void)? = nil
    ) {
        self.question = question
        self.supportingText = supportingText
        self.choices = choices
        self.photoFilename = photoFilename
        self.showsMedia = showsMedia
        self.illustrationSeed = illustrationSeed
        self.showsStack = showsStack
        self.isStackExpanded = isStackExpanded
        self.onToggleStack = onToggleStack
        self.fallbackActionTitle = fallbackActionTitle
        self.onConfirm = onConfirm
        self.onStartRecord = onStartRecord
        _isExpanded = State(initialValue: initiallyExpanded)
    }

    var body: some View {
        SectionCard(showsBorder: false) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top, spacing: TBSpacing.x4) {
                    Button {
                        withAnimation(TasteBloomMotion.animation(isExpanded ? .content : .sheet, reduceMotion: reduceMotion)) {
                            isExpanded.toggle()
                        }
                    } label: {
                        HStack(alignment: .top, spacing: TBSpacing.x12) {
                            if showsMedia {
                                TasteQuestionMedia(photoFilename: photoFilename, illustrationSeed: illustrationSeed)
                            }
                            VStack(alignment: .leading, spacing: TBSpacing.x4) {
                                Text(question)
                                    .font(TBFont.semibold(14))
                                    .foregroundStyle(TBColor.textPrimary)
                                    .lineLimit(isExpanded ? 3 : 2)
                                if !isExpanded {
                                    Text(supportingText)
                                        .font(TBFont.regular(11))
                                        .foregroundStyle(TBColor.textHint)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.85)
                                }
                            }
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, minHeight: 60, maxHeight: 60, alignment: .topLeading)
                        }
                        .frame(maxWidth: .infinity, minHeight: 60, maxHeight: 60, alignment: .topLeading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .combine)
                    .accessibilityValue(isExpanded ? "펼쳐짐" : "접힘")
                    .accessibilityHint(isExpanded ? "답변 선택지를 접습니다" : "답변 선택지를 펼칩니다")
                    .accessibilityIdentifier("taste-question-toggle")

                    if let onToggleStack {
                        Button(action: onToggleStack) {
                            LucideIcon(.chevronDown, size: TBIcon.Size.small)
                                .rotationEffect(.degrees(isStackExpanded ? 180 : 0))
                                .tasteBloomMotion(.content, value: isStackExpanded)
                                .foregroundStyle(TBColor.iconMuted)
                                .frame(width: 24, height: 24)
                                .frame(width: 44, height: 44, alignment: .topTrailing)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(isStackExpanded ? "대기 질문 접기" : "대기 질문 펼치기")
                        .accessibilityIdentifier("taste-question-stack-toggle")
                    }
                }

                if isExpanded {
                    answerContent
                        .padding(.top, TBSpacing.x16)
                        .transition(TasteBloomMotion.questionReveal(reduceMotion: reduceMotion))
                }
            }
            .clipped()
        }
        .background {
            if showsStack {
                backCard(inset: 12, offset: TBSpacing.x16)
                    .transition(.opacity)
                backCard(inset: 6, offset: TBSpacing.x8)
                    .transition(.opacity)
            }
        }
        .padding(.bottom, showsStack ? TBSpacing.x16 : 0)
        .accessibilityElement(children: .contain)

    }

    private var answerContent: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x12) {
            if !choices.isEmpty, onConfirm != nil {
                let layout = choices.count <= 3
                    ? AnyLayout(HStackLayout(spacing: TBSpacing.x8))
                    : AnyLayout(VStackLayout(spacing: 0))
                layout {
                    ForEach(choices) { choice in
                        choiceButton(choice)
                    }
                }
                .disabled(submitted)
            } else if let onStartRecord {
                PrimaryButton(title: fallbackActionTitle, size: .compact, action: onStartRecord)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textBody)
                    .fixedSize(horizontal: false, vertical: true)
            }

        }
        .accessibilityIdentifier("taste-question-answers")
    }

    private func choiceButton(_ choice: TasteQuestionChoice) -> some View {
        let selected = selectedID == choice.id
        let style = ChipStyle.resolve(tone: .neutral, variant: selected ? .solid : .soft)
        return Button {
            selectedID = choice.id
            errorMessage = onConfirm?(choice.id)
            submitted = errorMessage == nil
        } label: {
            Text(choice.title)
                .font(ChipSize.small.font)
                .foregroundStyle(selected ? style.foreground : TBColor.textSecondary)
                .padding(.horizontal, ChipSize.small.horizontalPadding)
                .frame(maxWidth: .infinity)
                .frame(height: ChipSize.small.lineHeight + 2 * ChipSize.small.verticalPadding)
                .background(style.background)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                        .strokeBorder(selected ? style.border : TBColor.borderCard)
                }
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(TBTokenButtonStyle())
        .accessibilityAddTraits(selected ? .isSelected : [])
        .tasteBloomMotion(.feedback, value: selected)
        .accessibilityIdentifier("taste-question-choice-\(choice.id)")
    }

    private func backCard(inset: CGFloat, offset: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
            .fill(TBColor.surface)
            .overlay {
                RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                    .fill(TBColor.surface)
                    .shadow(color: TBColor.textPrimary.opacity(0.08), radius: 3, y: 2)
                    .padding(.horizontal, -6)
                    .offset(y: -TBSpacing.x8)
            }
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
            .padding(.horizontal, inset)
            .offset(y: offset)
            .allowsHitTesting(false)
            .accessibilityHidden(true)
    }
}

enum PersonalTasteInlineAnswer {
    static func sourceEntry(for selection: PersonalTasteNextSelection, observations: [SensoryObservation], entries: [DiningEntry]) -> DiningEntry? {
        guard selection.intent == "clarification",
              let sourceID = selection.responseSourceID,
              let source = observations.first(where: {
                  $0.id == sourceID && $0.attribute == selection.attribute && selection.evidenceIDs.contains($0.id)
              }) else { return nil }
        return entries.first { $0.id == source.experienceID }
    }

    static func choices(for facet: String) -> [TasteQuestionChoice] {
        switch facet {
        case "liking": DiningSensorySelection.Liking.allCases.map { .init(id: $0.rawValue, title: $0.label) }
        case "intensity": DiningSensorySelection.Intensity.allCases.map { .init(id: $0.rawValue, title: $0.label) }
        case "target": DiningSensorySelection.Target.allCases.filter { $0 != .unspecified }.map { .init(id: $0.rawValue, title: $0.label) }
        case "phase": DiningSensorySelection.Phase.allCases.filter { $0 != .unspecified }.map { .init(id: $0.rawValue, title: $0.label) }
        default: []
        }
    }

    /// 원래 선택에서 비어 있는 항목만 보완하며 새로운 식사나 출처를 만들지 않는다.
    static func applying(_ answerID: String, to entry: DiningEntry, context: PersonalTasteQuestionResponseContext) -> DiningEntry? {
        guard context.selection.intent == "clarification",
              entry.id == context.sourceEntryID,
              entry.hasCompletedTasteFeedback,
              let source = context.sourceSelectionEvidence,
              choices(for: context.selection.facet).contains(where: { $0.id == answerID }),
              var selections = entry.sensorySelections else { return nil }
        let matches = selections.indices.filter {
            let item = selections[$0]
            return item.id == source.selectionID && item.type.rawValue == source.type
                && item.catalogVersion == source.catalogVersion && item.labelSnapshot == source.labelSnapshot
                && item.relatedBubbleID == source.relatedBubbleID && item.unparsedPayload == nil
                && item.target.rawValue == context.sourceTarget && item.phase.rawValue == context.sourcePhase
        }
        guard matches.count == 1, let index = matches.first else { return nil }
        switch context.selection.facet {
        case "liking":
            guard selections[index].liking == nil else { return nil }
            selections[index].liking = .init(rawValue: answerID)
        case "intensity":
            guard selections[index].intensity == nil else { return nil }
            selections[index].intensity = .init(rawValue: answerID)
        case "target":
            guard selections[index].target == .unspecified else { return nil }
            selections[index].target = .init(rawValue: answerID)
        case "phase":
            guard selections[index].phase == .unspecified else { return nil }
            selections[index].phase = .init(rawValue: answerID)
        default: return nil
        }
        return DiningEntry(
            id: entry.id, mealID: entry.mealID, restaurant: entry.restaurant,
            restaurantID: entry.restaurantID, menu: entry.menu, menuItemID: entry.menuItemID,
            observedAt: entry.observedAt, savedAt: entry.savedAt, updatedAt: entry.updatedAt,
            rating: entry.rating, note: entry.note, tasteExperienceIDs: entry.tasteExperienceIDs,
            detailTagIDs: entry.detailTagIDs, sensorySelections: selections,
            overallEvaluation: entry.overallEvaluation, dishKindIDs: entry.dishKindIDs,
            reflectionPhotoFilename: entry.reflectionPhotoFilename,
            tbaAnalysisSnapshot: entry.tbaAnalysisSnapshot, feedbackStatus: entry.feedbackStatus,
            photoPalette: entry.photoPalette
        )
    }
}

struct PersonalTasteAnswerToast: ViewModifier {
    var bottomPadding: CGFloat = TBSpacing.mainTabContentBottom
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @StateObject private var toast = TBToastPresenter()
    @State private var undoFailed = false

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .bottom) {
                if toast.isPresented {
                    ToastSurface(
                        title: undoFailed ? "기록이 바뀌어 취소하지 못했어요" : "답변을 기록했어요",
                        tone: undoFailed ? .warning : .success,
                        actionTitle: undoFailed ? nil : "취소",
                        action: {
                            if appModel.undoPersonalTasteAnswer() {
                                toast.cancel()
                            } else {
                                undoFailed = true
                                toast.present(policy: .copyConfirmation)
                            }
                        }
                    )
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.bottom, bottomPadding)
                    .transition(.opacity)
                }
            }
            .animation(TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion), value: toast.isPresented)
            .onChange(of: appModel.personalTasteAnswerUndo?.id) { _, id in
                guard let id else { return }
                undoFailed = false
                toast.present(policy: .undo) {
                    if appModel.personalTasteAnswerUndo?.id == id {
                        appModel.personalTasteAnswerUndo = nil
                    }
                }
            }
            .onDisappear { toast.dismiss() }
    }
}

struct PersonalTasteNextQuestionCard: View {
    @EnvironmentObject private var appModel: AppModel
    let selection: PersonalTasteNextSelection
    var sourceSelectionLabel: String? = nil
    var showsStack = false
    var isStackExpanded = false
    var onToggleStack: (() -> Void)?
    var onStartNewRecord: (() -> Void)?

    var body: some View {
        let entry = PersonalTasteInlineAnswer.sourceEntry(
            for: selection, observations: appModel.sensoryAnalysis.observations, entries: appModel.diningEntries
        )
        let meal = entry.map {
            [$0.restaurant, $0.menu].filter { !$0.isEmpty }.joined(separator: " · ")
        }
        TasteQuestionStackCard(
            question: meal.map { "\($0)\n\(selection.question)" } ?? selection.question,
            supportingText: "답변하려면 카드를 탭해주세요.",
            choices: selection.intent == "clarification" && sourceSelectionLabel != nil
                ? PersonalTasteInlineAnswer.choices(for: selection.facet) : [],
            photoFilename: entry?.reflectionPhotoFilename,
            illustrationSeed: selection.id,
            showsStack: showsStack,
            initiallyExpanded: initiallyExpandedForQA,
            isStackExpanded: isStackExpanded,
            onToggleStack: onToggleStack,
            fallbackActionTitle: selection.intent == "exploration" ? "새 식사에서 확인" : "기록에서 답하기",
            onConfirm: saveAnswer,
            onStartRecord: onStartNewRecord
        )
        .id(selection.id)
    }

    private var initiallyExpandedForQA: Bool {
        #if DEBUG || targetEnvironment(simulator)
        let arguments = ProcessInfo.processInfo.arguments
        return arguments.contains("--sensory-insights-home-qa")
            && arguments.contains("--question-stack-expanded-qa")
        #else
        return false
        #endif
    }

    private func saveAnswer(_ answerID: String) -> String? {
        guard let context = appModel.personalTasteQuestionResponseContext(for: selection),
              let entryID = context.sourceEntryID,
              let entry = appModel.diningEntry(id: entryID),
              let updated = PersonalTasteInlineAnswer.applying(answerID, to: entry, context: context) else {
            return "기록이 바뀌었어요. 기록을 확인한 뒤 다시 답해주세요."
        }
        switch appModel.savePersonalTasteQuestionResponse(updated, context: context) {
        case .updated(resolved: true):
            appModel.preparePersonalTasteAnswerUndo(before: entry, context: context)
            return nil
        case .updated, .added: return "답변을 기록했어요. 기록에서 남은 내용을 확인해주세요."
        case .sourceUnavailable: return "연결된 기록을 찾지 못했어요. 기록을 다시 확인해주세요."
        }
    }
}

#Preview("질문 카드 · 접힘") {
    TasteQuestionStackCard(
        question: "산뜻한 산미는 얼마나 강하게 느껴졌나요?",
        supportingText: "답변하려면 카드를 탭해주세요.",
        choices: PersonalTasteInlineAnswer.choices(for: "intensity"),
        onToggleStack: {},
        onConfirm: { _ in nil }
    )
    .padding(TBSpacing.page)
    .background(TBColor.page)
}

#Preview("질문 카드 · 펼침") {
    TasteQuestionStackCard(
        question: "산뜻한 산미는 얼마나 강하게 느껴졌나요?",
        supportingText: "답변하려면 카드를 탭해주세요.",
        choices: PersonalTasteInlineAnswer.choices(for: "intensity"),
        initiallyExpanded: true,
        onToggleStack: {},
        onConfirm: { _ in nil }
    )
    .padding(TBSpacing.page)
    .background(TBColor.page)
}

struct PersonalTasteCandidateDetailSheet: View {
    let group: PersonalTasteCandidateGroup
    let observations: [SensoryObservation]
    let entries: [DiningEntry]
    let limits: [String]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton { dismiss() }),
            headerCenter: AnyView(Text("조건별 입맛").tbTextStyle(.sheetTitle)),
            stageMode: .auto(maxHeightRatio: 1),
            usesNativeSheetChrome: true,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    SectionCard(background: TBColor.mutedSurface) {
                        VStack(alignment: .leading, spacing: TBSpacing.x8) {
                            Text(PersonalTasteCandidatePresentation.eyebrow(group))
                                .font(TBFont.semibold(11))
                                .foregroundStyle(TBColor.textHint)
                            Text(group.title)
                                .font(TBFont.bold(18))
                                .foregroundStyle(TBColor.textPrimary)
                            Text(group.body)
                                .font(TBFont.regular(13))
                                .foregroundStyle(TBColor.textBody)
                                .lineSpacing(4)
                            let visibleConditions = Array(Set(group.candidates.flatMap { candidate in
                                candidate.conditions.map { PersonalTasteConditionLabels.label(for: $0) }
                            })).sorted()
                            if !visibleConditions.isEmpty {
                                TBFlowLayout(spacing: TBSpacing.x8) {
                                    ForEach(visibleConditions, id: \.self) { condition in
                                        NeutralChip(title: condition)
                                    }
                                }
                            }
                        }
                    }

                    ForEach(group.highlightedCandidates) { candidate in
                        let condition = group.conditionText(candidate)
                        let categorizedMealIDs = Set(
                            candidate.supportMealIDs
                                + candidate.counterMealIDs
                                + candidate.neutralMealIDs
                                + candidate.mixedMealIDs
                        )
                        let otherMealIDs = Array(
                            Set(candidate.evidence.map(\.mealID))
                                .subtracting(categorizedMealIDs)
                        ).sorted()
                        if !candidate.supportMealIDs.isEmpty {
                            mealEvidenceSection(
                                title: "\(condition) · 근거 식사",
                                subtitle: group.summary(for: candidate),
                                mealIDs: candidate.supportMealIDs,
                                evidenceIDs: Set(candidate.evidenceIDs)
                            )
                        }
                        if !candidate.neutralMealIDs.isEmpty {
                            mealEvidenceSection(
                                title: "\(condition) · 중립으로 남긴 식사",
                                subtitle: "좋고 싫음 어느 쪽으로도 두지 않은 기록이에요.",
                                mealIDs: candidate.neutralMealIDs,
                                evidenceIDs: Set(candidate.evidenceIDs)
                            )
                        }
                        if !candidate.mixedMealIDs.isEmpty {
                            mealEvidenceSection(
                                title: "\(condition) · 한 식사 안에서 평가가 엇갈린 식사",
                                subtitle: "같은 식사에서 함께 나타난 서로 다른 평가를 그대로 보여드려요.",
                                mealIDs: candidate.mixedMealIDs,
                                evidenceIDs: Set(candidate.evidenceIDs)
                            )
                        }
                        if !candidate.counterMealIDs.isEmpty {
                            mealEvidenceSection(
                                title: "\(condition) · 다른 반응을 남긴 식사",
                                subtitle: "이 조건 안의 반대 기록도 숨기지 않아요.",
                                mealIDs: candidate.counterMealIDs,
                                evidenceIDs: Set(candidate.evidenceIDs)
                            )
                        }
                        if !otherMealIDs.isEmpty {
                            mealEvidenceSection(
                                title: "\(condition) · 평가가 엇갈린 식사",
                                subtitle: "한쪽 방향으로 묶이지 않은 식사도 근거에서 빼지 않아요.",
                                mealIDs: otherMealIDs,
                                evidenceIDs: Set(candidate.evidenceIDs)
                            )
                        }
                    }

                    let highlightedEvidence = Set(
                        group.highlightedCandidates.flatMap(\.evidenceIDs)
                    )
                    let remainingEvidence = Set(group.evidenceIDs).subtracting(highlightedEvidence)
                    if !remainingEvidence.isEmpty {
                        mealEvidenceSection(
                            title: "이 감각의 다른 조건 기록",
                            subtitle: "현재 카드에 연결된 다른 부위·시점·강도 기록도 함께 보존해요.",
                            mealIDs: group.mealIDs,
                            evidenceIDs: remainingEvidence
                        )
                    }

                    if !limits.isEmpty {
                        TBPageSection(title: "해석 범위", titleSize: .medium) {
                            SectionCard {
                                VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                    ForEach(limits.prefix(3), id: \.self) { limit in
                                        Text(limit)
                                            .font(TBFont.regular(12))
                                            .foregroundStyle(TBColor.textBody)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                            }
                        }
                    }
                }
                .tbPageContentPadding()
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .presentationCornerRadius(BottomSheetShellMetrics.topRadius)
    }

    @ViewBuilder
    private func mealEvidenceSection(
        title: String,
        subtitle: String,
        mealIDs: [String],
        evidenceIDs: Set<String>
    ) -> some View {
        TBPageSection(title: title, subtitle: subtitle) {
            if mealIDs.isEmpty {
                SectionCard {
                    Text("아직 이 범위에서 연결된 식사 근거가 없어요.")
                        .font(TBFont.regular(13))
                        .foregroundStyle(TBColor.textMuted)
                }
            } else {
                VStack(alignment: .leading, spacing: TBSpacing.x12) {
                    ForEach(mealIDs, id: \.self) { mealID in
                        let mealEntries = entriesForMeal(mealID)
                        VStack(alignment: .leading, spacing: TBSpacing.x8) {
                            HStack(alignment: .firstTextBaseline) {
                                Text(mealTitle(mealEntries))
                                    .font(TBFont.semibold(13))
                                    .foregroundStyle(TBColor.textPrimary)
                                Spacer()
                                if mealEntries.count > 1 {
                                    Text("같은 식사 · \(mealEntries.count)개 메뉴")
                                        .font(TBFont.semibold(10))
                                        .foregroundStyle(TBColor.textSecondary)
                                }
                            }
                            SensoryEvidenceList(
                                observations: observationsForMeal(
                                    mealID,
                                    evidenceIDs: evidenceIDs
                                ),
                                unresolved: []
                            )
                        }
                    }
                }
            }
        }
    }

    private func entriesForMeal(_ mealID: String) -> [DiningEntry] {
        entries
            .filter { $0.mealID.uuidString.caseInsensitiveCompare(mealID) == .orderedSame }
            .sorted { $0.id.uuidString < $1.id.uuidString }
    }

    private func observationsForMeal(
        _ mealID: String,
        evidenceIDs: Set<String>
    ) -> [SensoryObservation] {
        let recordIDs = Set(entriesForMeal(mealID).map(\.id))
        return observations.filter {
            evidenceIDs.contains($0.id) && recordIDs.contains($0.experienceID)
        }
    }

    private func mealTitle(_ mealEntries: [DiningEntry]) -> String {
        guard let first = mealEntries.first else { return "연결된 식사" }
        return "\(first.restaurant) · \(first.observedAt.formatted(date: .abbreviated, time: .omitted))"
    }
}

enum PersonalTasteConditionLabels {
    private static let dishKindLabels: [String: String] = {
        let options = (try? DiningFeedbackFixtureLoader.load().dishKindOptions) ?? []
        return Dictionary(uniqueKeysWithValues: options.map { ($0.id, $0.label) })
    }()
    private static let targetLabels = [
        "whole_dish": "음식 전체", "sauce": "소스", "surface": "겉면", "inside": "속",
        "coating": "튀김옷", "skin": "껍질", "broth": "국물", "noodles": "면",
        "meat": "고기", "filling": "속재료", "flesh": "속살", "cream": "크림",
    ]
    private static let phaseLabels = [
        "first_bite": "첫입", "early_meal": "식사 초반", "during_meal": "먹는 동안",
        "late_meal": "식사 후반", "after_swallow": "삼킨 뒤", "after_meal": "식사 후",
    ]
    private static let intensityLabels = [
        "weak": "은은하게 느낀", "medium": "중간 강도로 느낀", "strong": "강하게 느낀",
    ]

    static func label(for condition: PersonalTasteCondition) -> String {
        switch condition.dimension {
        case "dishKind":
            return dishKindLabels[condition.value] ?? "선택한 음식 종류"
        case "target":
            return targetLabels[condition.value] ?? "선택한 부위"
        case "phase":
            return phaseLabels[condition.value] ?? "선택한 시점"
        case "intensity":
            return intensityLabels[condition.value] ?? "선택한 강도"
        default:
            return "기록한 조건"
        }
    }
}

struct SensoryInsightDetailSheet: View {
    let insight: SensoryInsight
    let observations: [SensoryObservation]
    let unresolved: [SensoryUnresolved]
    let limits: [String]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton { dismiss() }),
            headerCenter: AnyView(Text("인사이트").tbTextStyle(.sheetTitle)),
            stageMode: .auto(maxHeightRatio: 1),
            usesNativeSheetChrome: true,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    SectionCard(background: TBColor.mutedSurface) {
                        VStack(alignment: .leading, spacing: TBSpacing.x8) {
                            Text(insight.title)
                                .font(TBFont.bold(18))
                                .foregroundStyle(TBColor.textPrimary)
                            Text(insight.body)
                                .font(TBFont.regular(13))
                                .foregroundStyle(TBColor.textBody)
                                .lineSpacing(4)
                        }
                    }

                    TBPageSection(
                        title: "근거가 된 기록",
                        subtitle: "같은 기록에서 나온 여러 표현은 기록 수를 늘리지 않아요."
                    ) {
                        SensoryEvidenceList(observations: observations, unresolved: unresolved)
                    }

                    if !limits.isEmpty {
                        TBPageSection(title: "해석 범위", titleSize: .medium) {
                            SectionCard {
                                VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                    ForEach(limits.prefix(3), id: \.self) { limit in
                                        Label {
                                            Text(limit)
                                                .font(TBFont.regular(12))
                                                .foregroundStyle(TBColor.textBody)
                                        } icon: {
                                            LucideIcon(
                                                systemName: "minus",
                                                size: TBIcon.Size.small,
                                                strokeWidth: TBIcon.Stroke.regular
                                            )
                                            .foregroundStyle(TBColor.textHint)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                .tbPageContentPadding()
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .presentationCornerRadius(BottomSheetShellMetrics.topRadius)
    }
}

struct SensoryEvidenceDetailSheet: View {
    let observations: [SensoryObservation]
    let unresolved: [SensoryUnresolved]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton { dismiss() }),
            headerCenter: AnyView(Text("기록 근거").tbTextStyle(.sheetTitle)),
            stageMode: .auto(maxHeightRatio: 1),
            usesNativeSheetChrome: true,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                TBPageSection(
                    title: "선택과 추가 메모",
                    subtitle: "선택한 버블·태그와 추가 메모를 출처별로 구분해요."
                ) {
                    SensoryEvidenceList(observations: observations, unresolved: unresolved)
                }
                .tbPageContentPadding()
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .presentationCornerRadius(BottomSheetShellMetrics.topRadius)
    }
}

struct SensoryEvidenceList: View {
    let observations: [SensoryObservation]
    let unresolved: [SensoryUnresolved]

    var body: some View {
        if items.isEmpty {
            SectionCard {
                Text("연결된 기록 근거를 확인하고 있어요.")
                    .font(TBFont.regular(13))
                    .foregroundStyle(TBColor.textMuted)
            }
        } else {
            VStack(spacing: TBSpacing.x12) {
                ForEach(items) { item in
                    SectionCard {
                        VStack(alignment: .leading, spacing: TBSpacing.x8) {
                            Text(item.title)
                                .font(TBFont.semibold(14))
                                .foregroundStyle(TBColor.textPrimary)
                                .fixedSize(horizontal: false, vertical: true)
                            Text(item.sourceLabel)
                                .font(TBFont.semibold(11))
                                .foregroundStyle(TBColor.textSecondary)
                            if let responseLabel = item.responseLabel {
                                Text(responseLabel)
                                    .font(TBFont.regular(12))
                                    .foregroundStyle(TBColor.textBody)
                            }
                            Text(item.metadata)
                                .font(TBFont.regular(11))
                                .foregroundStyle(TBColor.textHint)
                            if item.needsMeaningReview {
                                Text("구체적인 뜻을 확인 중이에요")
                                    .font(TBFont.semibold(11))
                                    .foregroundStyle(TBColor.textSecondary)
                                    .padding(.horizontal, 9)
                                    .frame(minHeight: 28)
                                    .background(TBColor.mutedSurface)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
        }
    }

    private var items: [SensoryEvidenceDisplayItem] {
        var groups: [String: SensoryEvidenceDisplayItem] = [:]
        for observation in observations {
            let key="\(observation.experienceID.uuidString)|\(observation.phrase)|\(observation.sourceField)"
            if var existing=groups[key] {
                existing.labels.formUnion([observation.attributeLabel])
                groups[key]=existing
            } else {
                groups[key]=SensoryEvidenceDisplayItem(
                    id:key,
                    phrase:observation.phrase,
                    sourceField:observation.sourceField,
                    selectionEvidence:observation.selectionEvidence,
                    foodName:observation.foodName,
                    recordedAt:observation.recordedAt,
                    labels:[observation.attributeLabel],
                    target:observation.target,
                    phase:observation.phase,
                    needsMeaningReview:observation.isUnclassifiedDetail
                )
            }
        }
        for pending in unresolved {
            let key="\(pending.experienceID.uuidString)|\(pending.phrase)|\(pending.sourceField)"
            if var existing=groups[key] {
                existing.needsMeaningReview=true
                groups[key]=existing
            } else {
                groups[key]=SensoryEvidenceDisplayItem(
                    id:key,
                    phrase:pending.phrase,
                    sourceField:pending.sourceField,
                    selectionEvidence:pending.selectionEvidence,
                    foodName:pending.foodName,
                    recordedAt:pending.recordedAt,
                    labels:[],
                    target:"unspecified",
                    phase:"unspecified",
                    needsMeaningReview:true
                )
            }
        }
        return groups.values.sorted {
            if $0.recordedAt != $1.recordedAt { return $0.recordedAt > $1.recordedAt }
            return $0.id < $1.id
        }
    }
}

private struct SensoryEvidenceDisplayItem: Identifiable {
    let id: String
    let phrase: String
    let sourceField: String
    let selectionEvidence: SensorySelectionEvidence?
    let foodName: String
    let recordedAt: Date
    var labels: Set<String>
    let target: String
    let phase: String
    var needsMeaningReview: Bool

    var title: String {
        if let selectionEvidence {
            return selectionEvidence.labelSnapshot
        }
        return "“\(phrase)”"
    }

    var sourceLabel: String {
        if let selectionEvidence {
            if selectionEvidence.type == "overallEvaluation" {
                return "음식 전체 평가"
            }
            let kind = selectionEvidence.type == "bubble" ? "버블" : "디테일 태그"
            if let related = selectionEvidence.relatedBubbleLabel,
               selectionEvidence.type == "detailTag" {
                return "선택한 \(kind) · 연결: \(related)"
            }
            return "선택한 \(kind)"
        }
        if sourceField == "note" || sourceField == "reviewText" {
            return "추가 메모"
        }
        if sourceField.contains("tasteExperienceIDs") || sourceField.contains("detailTagIDs") {
            return "이전 선택"
        }
        return "기록한 항목"
    }

    var responseLabel: String? {
        guard let evidence = selectionEvidence else { return nil }
        let facet = [
            "selection":"선택",
            "liking":"호감",
            "intensity":"강도",
            "preferenceFit":"알맞음",
            "target":"대상",
            "phase":"시점",
            "relation":"연결",
        ][evidence.facet] ?? "응답"
        return "\(facet): \(evidence.labelValue)"
    }

    var metadata: String {
        let details=[foodName,labels.sorted().joined(separator: " · "),phaseLabel, targetLabel]
            .filter { !$0.isEmpty }
        return details.joined(separator: " · ")
    }

    private var phaseLabel: String {
        ["first_bite":"첫입", "early_meal":"식사 초반", "during_meal":"먹는 동안", "late_meal":"식사 후반", "after_swallow":"삼킨 뒤", "after_meal":"식사 후"][phase] ?? ""
    }

    private var targetLabel: String {
        ["whole_dish":"음식 전체", "sauce":"소스", "surface":"겉면", "inside":"속", "coating":"튀김옷", "skin":"껍질", "broth":"국물", "noodles":"면", "meat":"고기", "filling":"속재료", "flesh":"속살", "cream":"크림"][target] ?? ""
    }
}

#Preview("Sensory analysis cards — ready and pending") {
    let experienceID=UUID(uuidString: "7E14E84C-A16A-4C03-9021-C4914C2C12D0")!
    let observation=SensoryObservation(
        id:"preview-observation",
        experienceID:experienceID,
        foodName:"테스트 음식",
        recordedAt:.now,
        sourceField:"reviewText",
        kind:"sensory_detail",
        attribute:"texture.moist",
        attributeLabel:"촉촉한 식감",
        value:.text("씹을수록 촉촉했습니다."),
        scale:"sensory-detail-v1",
        target:"whole_dish",
        phase:"during_meal",
        phrase:"씹을수록 촉촉했습니다.",
        sourceSpans:[SensorySourceSpan(start:0,end:12,quote:"씹을수록 촉촉했습니다.")],
        reference:nil,
        combinationComponents:[]
    )
    let snapshot=SensoryAnalysisSnapshot(
        engineVersion:"preview-fixture",
        observations:[observation],
        unresolved:[],
        insights:[SensoryInsight(id:"preview-insight",kind:"condition",attribute:"texture.moist",title:"먹는 동안 촉촉함이 이어졌어요",body:"한 번의 경험에서 확인한 범위의 표현이에요.",evidenceIDs:[observation.id],experienceIDs:[experienceID])],
        mainWing:SensoryMainWing(status:"learning",main:nil,wing:nil,candidates:[],label:"입맛을 알아가는 중이에요"),
        completedExperienceCount:1,
        sourceExperienceCount:1,
        actualApiCalls:0,
        needsMeaningReview:false,
        limits:["가상 프리뷰 데이터입니다."]
    )
    ScrollView {
        VStack(spacing: TBSpacing.x12) {
            SensoryAnalysisHeroCard(snapshot:snapshot)
            SensoryEvidenceSummaryCard(observationCount:1,unresolvedCount:0) {}
            SensoryAnalysisStatusCard(state:.processing)
        }
        .padding(TBSpacing.page)
    }
    .tbPageBackground()
}

#Preview("미각 타입 · 기록 수집 중") {
    SensoryAnalysisHeroCard(snapshot: .empty)
        .padding(TBSpacing.page)
        .background(TBColor.page)
}
