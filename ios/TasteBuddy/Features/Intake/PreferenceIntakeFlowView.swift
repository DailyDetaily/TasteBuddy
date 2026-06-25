import SwiftUI

struct PreferenceIntakeFlowView: View {
    let onBack: () -> Void

    @State private var loadState: LoadState = .loading

    private enum LoadState {
        case loading
        case loaded(PreferenceIntakeFixtureContract)
        case failed
    }

    var body: some View {
        Group {
            switch loadState {
            case .loading:
                IntakeLoadingView()
            case .loaded(let fixture):
                PreferenceIntakeQuestionsView(
                    questions: fixture.questions,
                    onBack: onBack
                )
            case .failed:
                IntakeErrorView(retry: loadFixture)
            }
        }
        .task {
            if case .loading = loadState {
                loadFixture()
            }
        }
    }

    private func loadFixture() {
        do {
            loadState = .loaded(try PreferenceIntakeCatalogLoader.load())
        } catch {
            loadState = .failed
        }
    }
}

private struct PreferenceIntakeQuestionsView: View {
    @EnvironmentObject private var appModel: AppModel

    let questions: [PreferenceIntakeQuestionContract]
    let onBack: () -> Void

    @State private var questionIndex = 0
    @State private var responses: PreferenceIntakeResponsesContract

    init(
        questions: [PreferenceIntakeQuestionContract],
        onBack: @escaping () -> Void
    ) {
        self.questions = questions
        self.onBack = onBack
        _responses = State(initialValue: PreferenceIntakeResponsesContract())
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                TBFlowTopBar(
                    title: "사전 조사",
                    leadingAccessibilityLabel: questionIndex == 0
                        ? "서비스 설명으로 돌아가기"
                        : "이전 질문으로 돌아가기",
                    showsDivider: false,
                    leadingAction: goBack
                )

                ScrollView {
                    VStack(alignment: .leading, spacing: TBSpacing.section) {
                        TBFlowHeaderBlock(
                            title: currentQuestion.title,
                            description: currentQuestion.description,
                            topLeft: currentQuestion.eyebrow,
                            currentIndex: questionIndex,
                            total: questions.count
                        )

                        VStack(spacing: 12) {
                            ForEach(currentQuestion.options) { option in
                                TBSelectionCard(
                                    title: option.label,
                                    description: option.description,
                                    indicator: .checkbox,
                                    isSelected: isSelected(option.id),
                                    trailing: optionTrailingSlot(option.id)
                                ) {
                                    select(option.id)
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

            TBFlowStepCTA(
                actionLabel: isLastQuestion
                    ? "미각 질문으로 이어가기"
                    : "다음 질문",
                currentIndex: questionIndex,
                total: questions.count,
                isEnabled: canContinue,
                helperText: helperText,
                action: continueFlow
            )
        }
        .background(TBColor.focus.ignoresSafeArea())
        .edgeSwipeBack(action: goBack)
        .onAppear {
            if let draft = appModel.preferenceIntakeDraft {
                responses = draft
            }
        }
    }

    private var currentQuestion: PreferenceIntakeQuestionContract {
        questions[questionIndex]
    }

    private var isLastQuestion: Bool {
        questionIndex == questions.count - 1
    }

    private var canContinue: Bool {
        PreferenceIntakeContractEngine.isAnswered(
            question: currentQuestion,
            responses: responses
        )
    }

    private var selectionCount: Int {
        switch responses.value(for: currentQuestion.id) {
        case .multiple(let values):
            values.count
        case .single(let value):
            value == nil ? 0 : 1
        }
    }

    private var helperText: String {
        if !canContinue,
           let minimum = currentQuestion.minSelections,
           selectionCount < minimum {
            return "최소 \(minimum)개를 골라주세요"
        }

        if currentQuestion.selectionMode == .multiple,
           let maximum = currentQuestion.maxSelections {
            return "\(selectionCount)/\(maximum) 선택"
        }

        return "이 답변은 나중에 프로필에서 다시 바꿀 수 있어요"
    }

    private func isSelected(_ optionId: String) -> Bool {
        switch responses.value(for: currentQuestion.id) {
        case .multiple(let values):
            values.contains(optionId)
        case .single(let value):
            value == optionId
        }
    }

    private func optionTrailingSlot(_ optionId: String) -> AnyView? {
        guard isSelected(optionId) else {
            return nil
        }

        return AnyView(
            StatusChip(
                title: "선택됨",
                backgroundColor: TBColor.successSoft,
                foregroundColor: TBColor.success
            )
        )
    }

    private func select(_ optionId: String) {
        switch currentQuestion.selectionMode {
        case .single:
            responses.setSingle(optionId, for: currentQuestion.id)
        case .multiple:
            let currentValues: [String]
            if case .multiple(let values) = responses.value(for: currentQuestion.id) {
                currentValues = values
            } else {
                currentValues = []
            }
            responses.setMultiple(
                PreferenceIntakeContractEngine.nextMultipleSelection(
                    question: currentQuestion,
                    currentValue: currentValues,
                    optionId: optionId
                ),
                for: currentQuestion.id
            )
        }
        appModel.savePreferenceIntakeDraft(responses)
    }

    private func continueFlow() {
        guard canContinue else {
            return
        }

        if isLastQuestion {
            appModel.completePreferenceIntake(
                PreferenceIntakeContractEngine.buildProfile(
                    questions: questions,
                    responses: responses
                )
            )
            return
        }

        withAnimation(.easeInOut(duration: 0.28)) {
            questionIndex += 1
        }
    }

    private func goBack() {
        if questionIndex == 0 {
            onBack()
            return
        }

        withAnimation(.easeInOut(duration: 0.28)) {
            questionIndex -= 1
        }
    }
}

private struct IntakeLoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text("사전 조사를 준비하고 있어요")
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textBody)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TBColor.focus)
    }
}

private struct IntakeErrorView: View {
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.section) {
            SectionHeading(
                title: "사전 조사 항목을 불러오지 못했어요",
                subtitle: "안전 정보와 첫 추천 기준을 다시 준비할게요."
            )
            PrimaryButton(title: "다시 시도", action: retry)
        }
        .tbPageContentPadding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TBColor.focus)
    }
}

#if canImport(PreviewsMacros)
    #Preview("Preference Intake") {
        PreferenceIntakeFlowView(onBack: {})
            .environmentObject(AppModel.preview(onboardingComplete: true))
    }
#endif
