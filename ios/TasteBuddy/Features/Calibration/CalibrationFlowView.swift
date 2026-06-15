import SwiftUI

struct CalibrationFlowView: View {
    var onExit: () -> Void = {}
    @State private var loadState: LoadState = .loading

    private enum LoadState {
        case loading
        case loaded(TasteSurveyCatalogContract)
        case failed
    }

    var body: some View {
        Group {
            switch loadState {
            case .loading:
                CalibrationLoadingView()
            case .loaded(let catalog):
                TasteSurveyFlowView(catalog: catalog, onExit: onExit)
            case .failed:
                CalibrationErrorView(retry: loadCatalog)
            }
        }
        .task {
            if case .loading = loadState {
                loadCatalog()
            }
        }
    }

    private func loadCatalog() {
        do {
            loadState = .loaded(try TasteSurveyCatalogLoader.load())
        } catch {
            loadState = .failed
        }
    }
}

private struct TasteSurveyFlowView: View {
    @EnvironmentObject private var appModel: AppModel

    let catalog: TasteSurveyCatalogContract
    let onExit: () -> Void

    @State private var phase: Phase = .intro
    @State private var contextIndex = 0
    @State private var questionIndex = 0
    @State private var respondentContext = TasteSurveyRespondentContextContract()
    @State private var birthDate = Calendar.current.date(
        from: DateComponents(year: 1990, month: 1, day: 1)
    ) ?? .now
    @State private var responses: [String: TasteSurveyResponseContract] = [:]
    @State private var compatibleResult: TasteSurveyCompatibleResultContract?
    @State private var skippedContext = false
    @State private var skippedQuestions = false

    private enum Phase: Equatable {
        case intro
        case context
        case questionsIntro
        case questions
        case profileIntro
        case review
        case result
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                if phase != .result {
                    TBFlowTopBar(
                        title: headerTitle,
                        leadingSymbol: leadingSymbol,
                        leadingAccessibilityLabel: leadingAccessibilityLabel,
                        showsLeading: true,
                        showsDivider: !isIntroPhase,
                        backgroundColor: screenBackground,
                        leadingAction: goBack
                    )
                }

                Group {
                    switch phase {
                    case .intro:
                        SurveyIntroView(activeStepIndex: 0)
                    case .context:
                        SurveyContextView(
                            step: catalog.contextSteps[contextIndex],
                            index: contextIndex,
                            total: catalog.contextSteps.count,
                            birthDate: $birthDate,
                            respondentContext: $respondentContext
                        )
                    case .questionsIntro:
                        SurveyIntroView(activeStepIndex: 1)
                    case .questions:
                        SurveyQuestionView(
                            item: catalog.items[questionIndex],
                            index: questionIndex,
                            total: catalog.items.count,
                            scale: catalog.likertScale,
                            response: responses[catalog.items[questionIndex].id],
                            onSelectValue: selectValue,
                            onSelectUncertain: selectUncertain
                        )
                    case .profileIntro:
                        SurveyIntroView(activeStepIndex: 2)
                    case .review:
                        SurveyReviewView(
                            items: catalog.items,
                            scale: catalog.likertScale,
                            responses: responses,
                            onEdit: editQuestion
                        )
                    case .result:
                        if let compatibleResult {
                            SurveyResultView(result: compatibleResult)
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            TBFlowStepCTA(
                actionLabel: buttonTitle,
                currentIndex: ctaCurrentIndex,
                total: ctaTotal,
                isEnabled: isContinueEnabled,
                activeColor: ctaActiveColor,
                backgroundColor: screenBackground,
                showsIndicator: showsCtaIndicator,
                secondaryActionView: introSkipAction,
                action: continueFlow
            )
        }
        .background(screenBackground.ignoresSafeArea())
    }

    private var headerTitle: String? {
        switch phase {
        case .intro, .questionsIntro, .profileIntro:
            nil
        case .context:
            "해석 참고 정보"
        case .questions:
            "\(catalog.items[questionIndex].tasteId.label) 설문"
        case .review:
            "응답 검토"
        case .result:
            ""
        }
    }

    private var isIntroPhase: Bool {
        phase == .intro || phase == .questionsIntro || phase == .profileIntro
    }

    private var screenBackground: Color {
        isIntroPhase ? TBColor.page : TBColor.focus
    }

    private var leadingSymbol: String {
        phase == .questions && questionIndex == 0 ? "xmark" : "chevron.left"
    }

    private var leadingAccessibilityLabel: String {
        phase == .questions && questionIndex == 0
            ? "설문 닫기"
            : "이전 화면으로 돌아가기"
    }

    private var ctaCurrentIndex: Int {
        switch phase {
        case .intro:
            0
        case .context:
            contextIndex
        case .questionsIntro:
            1
        case .questions:
            questionIndex
        case .profileIntro:
            2
        case .review, .result:
            0
        }
    }

    private var ctaTotal: Int {
        switch phase {
        case .intro, .questionsIntro, .profileIntro:
            3
        case .context:
            catalog.contextSteps.count
        case .questions:
            catalog.items.count
        case .review, .result:
            1
        }
    }

    private var ctaActiveColor: Color {
        phase == .questions
            ? catalog.items[questionIndex].tasteId.mainColor
            : TBColor.textPrimary
    }

    private var showsCtaIndicator: Bool {
        phase != .review && phase != .result
    }

    private var buttonTitle: String {
        switch phase {
        case .intro:
            "설문 시작"
        case .context:
            contextIndex == catalog.contextSteps.count - 1 ? "설문으로 이어가기" : "계속"
        case .questionsIntro:
            "감각 반응으로 이어가기"
        case .questions:
            questionIndex == catalog.items.count - 1 ? "응답 검토" : "다음 문항"
        case .profileIntro:
            "응답 확인하기"
        case .review:
            "프로필 해석 보기"
        case .result:
            "프로필 저장하고 시작하기"
        }
    }

    private var introSkipAction: AnyView? {
        guard isIntroPhase else {
            return nil
        }

        return AnyView(
            Button(action: skipCurrentIntroSection) {
                Text("건너뛰기")
                    .font(TBFont.semibold(12))
                    .foregroundStyle(TBColor.textFaint)
                    .padding(.horizontal, 8)
                    .frame(height: 40)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(introSkipAccessibilityLabel)
        )
    }

    private var introSkipAccessibilityLabel: String {
        switch phase {
        case .intro:
            "해석 참고 정보 건너뛰기"
        case .questionsIntro:
            "감각 반응 설문 건너뛰기"
        case .profileIntro:
            "프로필 확인 건너뛰고 시작하기"
        default:
            "현재 단계 건너뛰기"
        }
    }

    private var isContinueEnabled: Bool {
        guard phase == .questions else {
            return true
        }
        let itemId = catalog.items[questionIndex].id
        guard let response = responses[itemId] else {
            return false
        }
        return response.uncertain || response.selectedValue != nil
    }

    private func continueFlow() {
        switch phase {
        case .intro:
            skippedContext = false
            contextIndex = 0
            phase = .context
        case .context:
            saveBirthDateIfNeeded()
            if contextIndex < catalog.contextSteps.count - 1 {
                contextIndex += 1
            } else {
                phase = .questionsIntro
            }
        case .questionsIntro:
            skippedQuestions = false
            questionIndex = 0
            phase = .questions
        case .questions:
            guard isContinueEnabled else {
                return
            }
            if questionIndex < catalog.items.count - 1 {
                questionIndex += 1
            } else {
                phase = .profileIntro
            }
        case .profileIntro:
            phase = .review
        case .review:
            compatibleResult = TasteSurveyScoringEngine.makeCompatibleResult(
                items: catalog.items,
                responses: catalog.items.compactMap { responses[$0.id] },
                measuredAt: ISO8601DateFormatter().string(from: .now)
            )
            phase = .result
        case .result:
            guard let compatibleResult else {
                return
            }
            appModel.saveProfile(
                TasteSurveyScoringEngine.makeProfile(from: compatibleResult)
            )
        }
    }

    private func goBack() {
        switch phase {
        case .intro:
            onExit()
        case .context:
            if contextIndex > 0 {
                contextIndex -= 1
            } else {
                phase = .intro
            }
        case .questionsIntro:
            if skippedContext {
                skippedContext = false
                phase = .intro
            } else {
                contextIndex = max(catalog.contextSteps.count - 1, 0)
                phase = .context
            }
        case .questions:
            if questionIndex > 0 {
                questionIndex -= 1
            } else {
                phase = .questionsIntro
            }
        case .profileIntro:
            if skippedQuestions {
                skippedQuestions = false
                phase = .questionsIntro
            } else {
                questionIndex = max(catalog.items.count - 1, 0)
                phase = .questions
            }
        case .review:
            phase = .profileIntro
        case .result:
            phase = .review
        }
    }

    private func skipCurrentIntroSection() {
        switch phase {
        case .intro:
            skippedContext = true
            phase = .questionsIntro
        case .questionsIntro:
            skippedQuestions = true
            phase = .profileIntro
        case .profileIntro:
            appModel.saveProfile(
                CalibrationEngine.makeProfile(responses: [:])
            )
        default:
            break
        }
    }

    private func selectValue(_ value: Int) {
        let itemId = catalog.items[questionIndex].id
        responses[itemId] = TasteSurveyResponseContract(
            itemId: itemId,
            selectedValue: value,
            uncertain: false
        )
        compatibleResult = nil
    }

    private func selectUncertain() {
        let itemId = catalog.items[questionIndex].id
        responses[itemId] = TasteSurveyResponseContract(
            itemId: itemId,
            selectedValue: nil,
            uncertain: true
        )
        compatibleResult = nil
    }

    private func editQuestion(_ index: Int) {
        questionIndex = index
        phase = .questions
    }

    private func saveBirthDateIfNeeded() {
        guard catalog.contextSteps[contextIndex].id == "birthDate" else {
            return
        }
        respondentContext.birthDate = Self.birthDateFormatter.string(from: birthDate)
    }

    private static let birthDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}

private struct SurveyIntroView: View {
    let activeStepIndex: Int

    private let steps = [
        (
            title: "해석 참고 정보",
            description: "생년월일, 성별 관련 정보, 흡연 상태를 선택해 미각 응답을 더 안정적으로 읽을 준비를 합니다."
        ),
        (
            title: "감각 반응 정리",
            description: "열두 문항으로 작은 차이와 부담이 생기는 지점을 차분하게 확인합니다."
        ),
        (
            title: "첫 미각 프로필 준비",
            description: "응답은 다음 식사 개인화와 셰프가 참고할 수 있는 표현으로 정리됩니다."
        ),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                VStack(spacing: 12) {
                    Text("지금부터 고객님의 미각을\n정밀하게 준비합니다.")
                        .font(TBFont.bold(18))
                        .foregroundStyle(TBColor.textPrimary)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)

                    Text("최근의 감각 반응을 바탕으로 첫 프로필을 차분하게 잡아볼게요.")
                        .font(TBFont.regular(14))
                        .foregroundStyle(TBColor.textBody)
                        .multilineTextAlignment(.center)
                        .lineSpacing(5)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 24)
                .padding(.bottom, 48)

                VStack(spacing: 12) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                        SurveyIntroStepCard(
                            number: index + 1,
                            title: step.title,
                            description: step.description,
                            isActive: index == activeStepIndex,
                            isComplete: index < activeStepIndex
                        )
                    }
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.bottom, 188)
        }
        .scrollIndicators(.hidden)
        .background(TBColor.page)
    }
}

private struct SurveyIntroStepCard: View {
    let number: Int
    let title: String
    let description: String
    let isActive: Bool
    let isComplete: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(
                        isActive || isComplete
                            ? TBColor.textPrimary
                            : TBColor.textDisabled
                    )

                if isComplete {
                    LucideIcon(
                        .check,
                        size: TBIcon.Size.xSmall,
                        strokeWidth: TBIcon.Stroke.medium
                    )
                        .foregroundStyle(TBColor.textInverse)
                } else {
                    Text("\(number)")
                        .font(TBFont.bold(13))
                        .foregroundStyle(TBColor.textInverse)
                }
            }
            .frame(width: 24, height: 24)

            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(TBFont.bold(14))
                    .foregroundStyle(
                        isActive || isComplete
                            ? TBColor.textPrimary
                            : TBColor.textTertiary
                    )

                if isActive {
                    Text(description)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(4)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(isActive || isComplete ? TBColor.elevatedSurface : TBColor.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
        .overlay {
            if isActive {
                RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                    .stroke(TBColor.borderStrong)
            }
        }
        .opacity(isComplete ? 0.8 : 1)
    }
}

private struct SurveyContextView: View {
    let step: TasteSurveyContextStepContract
    let index: Int
    let total: Int
    @Binding var birthDate: Date
    @Binding var respondentContext: TasteSurveyRespondentContextContract

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                HStack {
                    OutlineBadge(title: step.badgeLabel)
                    Spacer()
                    OutlineBadge(title: "\(index + 1) / \(total)")
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("설문 해석에 참고할 정보")
                        .font(TBFont.semibold(12))
                        .foregroundStyle(TBColor.textSecondary)
                    Text("진단이나 평가 목적이 아니며, 답변하지 않아도 설문을 계속할 수 있어요.")
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textSubtle)
                        .lineSpacing(4)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous)
                        .stroke(TBColor.borderSubtle)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(step.title)
                        .font(TBFont.bold(18))
                        .foregroundStyle(TBColor.textPrimary)
                    Text(step.description)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textMuted)
                        .lineSpacing(4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if step.id == "birthDate" {
                    VStack(alignment: .leading, spacing: 7) {
                        DatePicker(
                            "생년월일",
                            selection: $birthDate,
                            in: ...Date(),
                            displayedComponents: .date
                        )
                        .datePickerStyle(.wheel)
                        .labelsHidden()
                        .frame(maxWidth: .infinity)
                        .environment(\.locale, Locale(identifier: "ko_KR"))
                    }
                    .padding(16)
                    .background(TBColor.focus)
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.media, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: TBRadius.media, style: .continuous)
                            .stroke(TBColor.borderSubtle)
                    }
                } else {
                    VStack(spacing: 12) {
                        ForEach(step.options) { option in
                            TBSelectionCard(
                                title: option.label,
                                indicator: .checkbox,
                                isSelected: selectedValue == option.value,
                                singleLine: true
                            ) {
                                setSelectedValue(option.value)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, 16)
            .padding(.bottom, 188)
        }
        .scrollIndicators(.hidden)
    }

    private var selectedValue: String? {
        switch step.id {
        case "sexContext":
            respondentContext.sexContext
        case "smokingStatus":
            respondentContext.smokingStatus
        default:
            respondentContext.birthDate
        }
    }

    private func setSelectedValue(_ value: String) {
        switch step.id {
        case "sexContext":
            respondentContext.sexContext = value
        case "smokingStatus":
            respondentContext.smokingStatus = value
        default:
            break
        }
    }
}

private struct SurveyQuestionView: View {
    let item: TasteSurveyItemContract
    let index: Int
    let total: Int
    let scale: TasteSurveyLikertScaleContract
    let response: TasteSurveyResponseContract?
    let onSelectValue: (Int) -> Void
    let onSelectUncertain: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                HStack {
                    OutlineBadge(title: item.tasteId.label)
                    Spacer()
                    if item.exploratoryMetadata != nil {
                        NeutralChip(title: "조심스럽게 해석")
                    }
                    OutlineBadge(title: "\(index + 1) / \(total)")
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text(item.anchor.label)
                        .font(TBFont.bold(16))
                        .foregroundStyle(item.tasteId.mainColor)
                    Text(item.anchor.description)
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textSubtle)
                        .lineSpacing(4)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(TBColor.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous)
                        .stroke(TBColor.borderSubtle)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(item.prompt)
                        .font(TBFont.bold(16))
                        .foregroundStyle(TBColor.textPrimary)
                        .lineSpacing(2)
                    Text(
                        item.construct == .salience
                            ? "작은 차이가 빨리 또렷하게 느껴지는지 확인해요."
                            : "조금 더 강해졌을 때 쉽게 과하다고 느끼는지 확인해요."
                    )
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textMuted)
                    .lineSpacing(4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(spacing: 12) {
                    ForEach(scale.min...scale.max, id: \.self) { value in
                        TBSelectionCard(
                            title: scale.label(for: value),
                            indicator: .checkbox,
                            isSelected: response?.uncertain == false
                                && response?.selectedValue == value,
                            singleLine: true
                        ) {
                            onSelectValue(value)
                        }
                    }
                }

                Button(action: onSelectUncertain) {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(scale.uncertainLabel)
                                .font(TBFont.semibold(13))
                                .foregroundStyle(TBColor.textPrimary)
                            Text("최근 기준으로 떠올리기 어렵다면 따로 표시해요.")
                                .font(TBFont.regular(11))
                                .foregroundStyle(TBColor.textHint)
                        }
                        Spacer()
                        Text("별도 저장")
                            .font(TBFont.semibold(11))
                            .foregroundStyle(TBColor.textFaint)
                    }
                    .padding(16)
                    .background(
                        response?.uncertain == true
                            ? TBColor.mutedSurface
                            : TBColor.surface
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(
                                response?.uncertain == true
                                    ? TBColor.textSecondary
                                    : TBColor.borderStrong,
                                style: StrokeStyle(lineWidth: 1, dash: [5])
                            )
                    }
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(
                    response?.uncertain == true ? .isSelected : []
                )
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, 16)
            .padding(.bottom, 188)
        }
        .scrollIndicators(.hidden)
    }
}

private struct SurveyReviewView: View {
    let items: [TasteSurveyItemContract]
    let scale: TasteSurveyLikertScaleContract
    let responses: [String: TasteSurveyResponseContract]
    let onEdit: (Int) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                HStack {
                    OutlineBadge(title: "Review")
                    Spacer()
                    OutlineBadge(title: "\(completedCount) / \(items.count)")
                }

                SectionHeading(
                    title: "응답을 한 번 확인해 주세요",
                    subtitle: "이 응답은 첫 프로필을 해석하는 출발점으로 쓰입니다. 떠올리기 어려웠던 항목은 그대로 남겨도 됩니다."
                )

                VStack(spacing: 10) {
                    ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                        Button {
                            onEdit(index)
                        } label: {
                            SectionCard {
                                HStack(alignment: .top, spacing: 12) {
                                    VStack(alignment: .leading, spacing: 7) {
                                        HStack(spacing: 6) {
                                            TasteChip(
                                                axis: item.tasteId,
                                                value: item.construct == .salience ? "감지" : "부담"
                                            )
                                            if item.exploratoryMetadata != nil {
                                                NeutralChip(title: "탐색")
                                            }
                                        }
                                        Text(item.anchor.label)
                                            .font(TBFont.semibold(13))
                                            .foregroundStyle(TBColor.textPrimary)
                                        Text(item.prompt)
                                            .font(TBFont.regular(12))
                                            .foregroundStyle(TBColor.textBody)
                                            .lineLimit(2)
                                            .lineSpacing(2)
                                    }

                                    Spacer(minLength: 8)

                                    VStack(alignment: .trailing, spacing: 4) {
                                        Text("응답")
                                            .font(TBFont.medium(10))
                                            .foregroundStyle(TBColor.textHint)
                                        Text(responseLabel(for: item.id))
                                            .font(TBFont.semibold(12))
                                            .foregroundStyle(TBColor.textPrimary)
                                            .multilineTextAlignment(.trailing)
                                            .frame(maxWidth: 104, alignment: .trailing)
                                    }
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, 16)
            .padding(.bottom, 156)
        }
        .scrollIndicators(.hidden)
    }

    private var completedCount: Int {
        items.filter {
            guard let response = responses[$0.id] else {
                return false
            }
            return response.uncertain || response.selectedValue != nil
        }.count
    }

    private func responseLabel(for itemId: String) -> String {
        guard let response = responses[itemId] else {
            return "미응답"
        }
        if response.uncertain {
            return scale.uncertainLabel
        }
        return response.selectedValue.map { scale.label(for: $0) } ?? "미응답"
    }
}

private struct SurveyResultView: View {
    let result: TasteSurveyCompatibleResultContract

    private var profile: TasteProfile {
        TasteSurveyScoringEngine.makeProfile(from: result)
    }

    private var resultAxes: [TasteAxis] {
        let ordered: [TasteAxis] = [
            result.starterGuidance.cautionAxis,
            result.starterGuidance.topAxes.first,
            result.starterGuidance.topAxes.dropFirst().first,
            .umami,
            .fat,
        ].compactMap { $0 }
        return ordered.reduce(into: []) { axes, axis in
            if !axes.contains(axis) {
                axes.append(axis)
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                VStack(alignment: .leading, spacing: 10) {
                    OutlineBadge(title: "\(profile.confidence) Profile")
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text("첫 미각 프로필이 준비됐어요")
                            .font(TBFont.bold(18))
                        LucideIcon(
                            .circleCheck,
                            size: TBIcon.Size.medium,
                            strokeWidth: TBIcon.Stroke.regular,
                            filled: true
                        )
                            .foregroundStyle(TBColor.textPrimary)
                    }
                    Text(result.starterGuidance.summaryLine)
                        .font(TBFont.regular(13))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(4)
                }

                SectionCard(background: TBColor.mutedSurface) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Confidence")
                            .font(TBFont.semibold(11))
                            .foregroundStyle(TBColor.textHint)
                        Text("시작 기준으로는 충분하고, 세부 축은 계속 다듬어집니다")
                            .font(TBFont.bold(15))
                        Text(result.starterGuidance.evidence.prefix(2).joined(separator: " "))
                            .font(TBFont.regular(13))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(3)
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("먼저 읽히는 포인트")
                        .font(TBFont.bold(16))

                    HStack(spacing: 10) {
                        ForEach(result.starterGuidance.topAxes.prefix(2)) { axis in
                            TasteTintMiniCard(
                                entry: TasteAxisAnalysis(
                                    axis: axis,
                                    score: profile.score(for: axis),
                                    delta: profile.score(for: axis) - 50
                                )
                            )
                        }
                    }
                }

                VStack(spacing: 10) {
                    ForEach(resultAxes) { axis in
                        AxisInterpretationCard(
                            axis: axis,
                            score: profile.score(for: axis),
                            label: resultLabel(for: axis)
                        )
                    }
                }

                SectionCard(background: TBColor.mutedSurface) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("조심스럽게 보는 축")
                            .font(TBFont.bold(14))
                        Text("감칠맛과 지방감은 재료 상태, 온도, 질감의 영향을 함께 받습니다. 지금은 확정된 판단보다 다음 식사에서 더 잘 맞추기 위한 참고 신호로 둡니다.")
                            .font(TBFont.regular(13))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(4)
                    }
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, 16)
            .padding(.bottom, 156)
        }
        .scrollIndicators(.hidden)
    }

    private func resultLabel(for axis: TasteAxis) -> String {
        if axis == result.starterGuidance.cautionAxis {
            return "부담 신호 확인"
        }
        if axis == .umami || axis == .fat {
            return "탐색 신호"
        }
        return "먼저 읽히는 축"
    }
}

private struct CalibrationLoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text("미각 설문을 준비하고 있어요")
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textBody)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TBColor.focus)
        .accessibilityElement(children: .combine)
    }
}

private struct CalibrationErrorView: View {
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.section) {
            SectionHeading(
                title: "미각 설문을 불러오지 못했어요",
                subtitle: "저장된 계약 리소스를 다시 확인한 뒤 설문을 준비할게요."
            )
            PrimaryButton(title: "다시 시도", action: retry)
        }
        .padding(TBSpacing.page)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TBColor.focus)
    }
}

#if canImport(PreviewsMacros)
    #Preview("Taste Survey") {
        CalibrationFlowView()
            .environmentObject(AppModel.preview(onboardingComplete: true))
    }
#endif
