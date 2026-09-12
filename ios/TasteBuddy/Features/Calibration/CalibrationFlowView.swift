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
                TBFlowLoadingState(message: "미각 설문을 준비하고 있어요")
            case .loaded(let catalog):
                TasteSurveyFlowView(catalog: catalog, onExit: onExit)
            case .failed:
                TBFlowRetryState(
                    title: "미각 설문을 불러오지 못했어요",
                    message: "잠시 후 다시 시도하면 설문을 다시 준비할게요.",
                    retry: loadCatalog
                )
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @EnvironmentObject private var appModel: AppModel

    let catalog: TasteSurveyCatalogContract
    let onExit: () -> Void

    @State private var phase: Phase = .intro
    @State private var contextIndex = 0
    @State private var questionIndex = 0
    @State private var respondentContext = TasteSurveyRespondentContextContract()
    @State private var didSelectBirthDate = false
    @State private var birthDate = Calendar.current.date(
        from: DateComponents(year: 1990, month: 1, day: 1)
    ) ?? .now
    @State private var responses: [String: TasteSurveyResponseContract] = [:]
    @State private var compatibleResult: TasteSurveyCompatibleResultContract?
    @State private var skippedContext = false
    @State private var skippedQuestions = false

    init(catalog: TasteSurveyCatalogContract, onExit: @escaping () -> Void) {
        self.catalog = catalog
        self.onExit = onExit
        #if DEBUG || targetEnvironment(simulator)
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("--survey-fat-question-qa") {
            _phase = State(initialValue: .questions)
            _questionIndex = State(initialValue: catalog.items.firstIndex { $0.tasteId == .fat } ?? 0)
        } else if arguments.contains("--survey-evidence-result-qa") {
            let sampleResponses: [TasteSurveyResponseContract] = catalog.items.map { item in
                .init(itemId: item.id, selectedValue: item.tasteId == .fat ? nil : 0,
                      uncertain: item.tasteId == .fat,
                      uncertaintyReason: item.tasteId == .fat ? .cannotIsolateTaste : nil)
            }
            _phase = State(initialValue: .result)
            _compatibleResult = State(initialValue: TasteSurveyScoringEngine.makeCompatibleResult(
                items: catalog.items, responses: sampleResponses, measuredAt: "2026-09-07T00:00:00Z",
                instrument: catalog.instrument, scale: catalog.likertScale
            ))
        }
        #endif
    }

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
                        showsDivider: false,
                        backgroundColor: screenBackground,
                        leadingAction: goBack
                    )
                }

                ZStack(alignment: .top) {
                    switch phase {
                    case .intro:
                        SurveyIntroView(activeStepIndex: 0)
                    case .context:
                        SurveyContextView(
                            step: catalog.contextSteps[contextIndex],
                            index: contextIndex,
                            total: catalog.contextSteps.count,
                            birthDate: $birthDate,
                            didSelectBirthDate: $didSelectBirthDate,
                            respondentContext: $respondentContext
                        )
                        .id(contextIndex)
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
                        .id(questionIndex)
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
                .tasteBloomMotion(.content, value: phase)
                .tasteBloomMotion(.content, value: contextIndex)
                .tasteBloomMotion(.content, value: questionIndex)
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
        .tbScreenTopChrome(isEnabled: phase != .result)
        .background(screenBackground.ignoresSafeArea())
        .edgeSwipeBack(action: goBack)
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
            "설문 결과 보기"
        case .result:
            "설문 결과 저장하고 시작하기"
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
            "설문 결과 확인 건너뛰고 시작하기"
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
            compatibleResult = makeResult()
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
                TasteSurveyScoringEngine.makeProfile(from: makeResult())
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

    private func selectUncertain(_ reason: TasteSurveyUncertaintyReasonContract) {
        let itemId = catalog.items[questionIndex].id
        responses[itemId] = TasteSurveyResponseContract(
            itemId: itemId,
            selectedValue: nil,
            uncertain: true,
            uncertaintyReason: reason
        )
        compatibleResult = nil
    }

    private func makeResult() -> TasteSurveyCompatibleResultContract {
        TasteSurveyScoringEngine.makeCompatibleResult(
            items: catalog.items,
            responses: catalog.items.compactMap { responses[$0.id] },
            measuredAt: ISO8601DateFormatter().string(from: .now),
            respondentContext: respondentContext,
            instrument: catalog.instrument,
            scale: catalog.likertScale
        )
    }

    private func editQuestion(_ index: Int) {
        questionIndex = index
        phase = .questions
    }

    private func saveBirthDateIfNeeded() {
        guard catalog.contextSteps[contextIndex].id == "birthDate", didSelectBirthDate else {
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
            description: "여섯 가지 기준 음식을 떠올리며 맛이 얼마나 강하게 느껴졌는지 기록합니다."
        ),
        (
            title: "설문 응답 정리",
            description: "지금 남긴 응답을 설문 범위의 참고 결과로 정리합니다."
        ),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                VStack(spacing: 12) {
                    Text("최근에 느낀 감각을\n차분하게 기록해요.")
                        .font(TBFont.bold(18))
                        .foregroundStyle(TBColor.textPrimary)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)

                    Text("최근 3개월의 경험을 떠올려 주세요. 먹어본 적 없거나 기억나지 않으면 따로 표시할 수 있어요.")
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
        HStack(alignment: rowAlignment, spacing: 12) {
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

    private var rowAlignment: VerticalAlignment {
        isActive ? .top : .center
    }
}

private struct SurveyContextView: View {
    let step: TasteSurveyContextStepContract
    let index: Int
    let total: Int
    @Binding var birthDate: Date
    @Binding var didSelectBirthDate: Bool
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
                        .onChange(of: birthDate) { _, _ in didSelectBirthDate = true }
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
            .padding(.top, TBSpacing.pageTop)
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
    let onSelectUncertain: (TasteSurveyUncertaintyReasonContract) -> Void

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
                        .foregroundStyle(item.tasteId.tintSurfaceTextColor)
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
                    Text(item.helper)
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
                        .accessibilityIdentifier("survey-\(item.tasteId.rawValue)-intensity-\(value)")
                    }
                }

                VStack(spacing: 8) {
                    ForEach(TasteSurveyUncertaintyReasonContract.allCases.filter {
                        $0 != .cannotIsolateTaste || item.tasteId == .fat
                    }, id: \.self) { reason in
                        TBSelectionCard(
                            title: reason.label,
                            indicator: .checkbox,
                            isSelected: response?.uncertain == true
                                && (response?.uncertaintyReason ?? .cannotRecall) == reason,
                            singleLine: false
                        ) {
                            onSelectUncertain(reason)
                        }
                        .accessibilityIdentifier("survey-\(item.tasteId.rawValue)-\(reason.rawValue)")
                    }
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, TBSpacing.pageTop)
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
                    subtitle: "설문 응답을 정리한 참고 결과예요. 떠올리기 어려웠던 항목은 그대로 남겨도 됩니다."
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
                                                value: "느낀 강도"
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
            .padding(.top, TBSpacing.pageTop)
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
            return (response.uncertaintyReason ?? .cannotRecall).label
        }
        return response.selectedValue.map { scale.label(for: $0) } ?? "미응답"
    }
}

private struct SurveyResultView: View {
    let result: TasteSurveyCompatibleResultContract

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                SectionHeading(
                    title: "기억한 맛을 정리했어요",
                    subtitle: "기준 음식에서 느낀 강도를 그대로 남겼어요. 좋아하는 정도는 식사 기록에서 따로 살펴봐요."
                )
                if let submission = result.snapshot.surveySubmission {
                    TasteSurveyEvidenceCard(submission: submission)
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, TBSpacing.pageTop)
            .padding(.bottom, 156)
        }
        .scrollIndicators(.hidden)
    }
}

#if canImport(PreviewsMacros)
    #Preview("Taste Survey") {
        CalibrationFlowView()
            .environmentObject(AppModel.preview(onboardingComplete: true))
    }
#endif
