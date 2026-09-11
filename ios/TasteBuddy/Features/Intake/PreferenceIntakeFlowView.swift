import SwiftUI

struct PreferenceIntakeFlowView: View {
    let onBack: () -> Void
    var onComplete: () -> Void = {}

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
                TBFlowLoadingState(message: "사전 조사를 준비하고 있어요")
            case .loaded(let fixture):
                PreferenceIntakeQuestionsView(
                    questions: fixture.questions,
                    onBack: onBack,
                    onComplete: onComplete
                )
            case .failed:
                TBFlowRetryState(
                    title: "사전 조사 항목을 불러오지 못했어요",
                    message: "안전 정보와 첫 추천 기준을 다시 준비할게요.",
                    retry: loadFixture
                )
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @EnvironmentObject private var appModel: AppModel

    let questions: [PreferenceIntakeQuestionContract]
    let onBack: () -> Void
    let onComplete: () -> Void

    @State private var questionIndex = 0
    @State private var responses: PreferenceIntakeResponsesContract
    @State private var saveError: String?

    init(
        questions: [PreferenceIntakeQuestionContract],
        onBack: @escaping () -> Void,
        onComplete: @escaping () -> Void
    ) {
        self.questions = questions
        self.onBack = onBack
        self.onComplete = onComplete
        _responses = State(initialValue: PreferenceIntakeResponsesContract())
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                TBFlowTopBar(
                    title: "식사 선호",
                    leadingAccessibilityLabel: questionIndex == 0
                        ? "서비스 설명으로 돌아가기"
                        : "이전 질문으로 돌아가기",
                    showsDivider: false,
                    leadingAction: goBack
                )

                ScrollView {
                    ZStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: TBSpacing.section) {
                            TBFlowHeaderBlock(
                                title: currentQuestion.title,
                                description: currentQuestion.description,
                                topLeft: currentQuestion.eyebrow,
                                currentIndex: questionIndex,
                                total: questions.count
                            )

                            if let saveError {
                                Text(saveError).font(TBFont.regular(13)).foregroundStyle(TBColor.textBody)
                            }

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
                        .id(currentQuestion.id)
                        .transition(.opacity)
                    }
                    .tasteBloomMotion(.content, value: questionIndex)
                }
                .scrollIndicators(.hidden)
            }

            TBFlowStepCTA(
                actionLabel: isLastQuestion
                    ? "선호 저장"
                    : "다음 질문",
                currentIndex: questionIndex,
                total: questions.count,
                isEnabled: canContinue,
                helperText: helperText,
                action: continueFlow
            )
        }
        .tbScreenTopChrome()
        .background(TBColor.focus.ignoresSafeArea())
        .edgeSwipeBack(action: goBack)
        .onAppear {
            if let draft = appModel.preferenceIntakeDraft {
                responses = draft
            } else if let profile = appModel.preferenceProfile {
                responses = PreferenceIntakeContractEngine.responsesFromProfile(profile)
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

        return "나의 입맛 화면에서 다시 바꿀 수 있어요"
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
            do {
                guard questions.allSatisfy({ PreferenceIntakeContractEngine.isAnswered(question: $0, responses: responses) }) else { throw CocoaError(.coderInvalidValue) }
                let profile = try PreferenceIntakeContractEngine.completeProfile(
                    questions: questions,
                    responses: responses,
                    previous: appModel.preferenceProfile ?? appModel.preferenceIntakeDraft
                )
                guard appModel.completePreferenceIntake(profile) else { throw CocoaError(.fileWriteUnknown) }
                onComplete()
            } catch {
                saveError = "응답을 저장하지 못했어요. 선택은 유지되어 있으니 다시 시도해 주세요."
            }
            return
        }

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            questionIndex += 1
        }
    }

    private func goBack() {
        if questionIndex == 0 {
            onBack()
            return
        }

        withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
            questionIndex -= 1
        }
    }
}

struct PreferenceIntakeEvidenceCard: View {
    let evidence: PreferenceIntakeEvidenceSnapshot
    var hasLegacyProfile = false
    let onEdit: () -> Void

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(evidence.submissionID == nil ? "식사 선호를 알려주세요" : "직접 알려준 식사 선호")
                    .font(TBFont.bold(16)).foregroundStyle(TBColor.textPrimary)
                if let recordedAt = evidence.recordedAt, let date = PersonalTasteModelBuilder.date(recordedAt) {
                    Text("\(date.formatted(date: .abbreviated, time: .omitted)) · 응답 \(evidence.answeredQuestionCount)개")
                        .font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                }
                if evidence.submissionID == nil {
                    Text(hasLegacyProfile ? "기존 선택은 보관 중이에요. 다시 저장하면 질문과 응답 시점을 함께 남겨요." : "피해야 할 재료와 편안하게 즐기는 음식부터 입맛을 알아가요.")
                        .font(TBFont.regular(13)).foregroundStyle(TBColor.textBody)
                }
                ForEach(evidence.records) { record in
                    DisclosureGroup {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(record.response.questionText)
                            Text(record.response.questionDescription)
                            ForEach(record.response.selectedOptions) { option in Text("\(option.label) · \(option.description)") }
                        }.font(TBFont.regular(12)).foregroundStyle(TBColor.textBody).padding(.vertical, 8)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(record.label).font(TBFont.medium(13))
                            Text(record.summary).font(TBFont.regular(13)).foregroundStyle(TBColor.textBody)
                        }
                    }.tint(TBColor.textSecondary)
                }
                Text("직접 알려준 선호는 실제 식사에서 확인한 반응과 구분해요.")
                    .font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                if evidence.records.contains(where: { $0.kind == "sharing_preference" && $0.state != "unanswered" }) {
                    Text("공유 선호를 저장해도 정보가 전송되지는 않아요.").font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                }
                if !evidence.excludedSubmissions.isEmpty {
                    Text("일부 응답의 출처를 확인하지 못했어요. 선호를 다시 확인해 주세요.").font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                }
                Button(evidence.submissionID == nil ? "선호 기록하기" : "선호 수정하기", action: onEdit)
                    .font(TBFont.semibold(14)).foregroundStyle(TBColor.textPrimary).frame(minHeight: 44)
            }
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview("Preference Evidence") {
        PreferenceIntakeEvidenceCard(evidence: .empty, hasLegacyProfile: false, onEdit: {})
            .padding(20)
    }

    #Preview("Preference Intake") {
        PreferenceIntakeFlowView(onBack: {})
            .environmentObject(AppModel.preview(onboardingComplete: true))
    }
#endif
