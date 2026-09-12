import SwiftUI

struct AnalysisView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @EnvironmentObject private var appModel: AppModel
    @State private var selectedSheet: SensoryAnalysisSheetSelection?
    @State private var pendingPersonalTasteQuestion: PersonalTasteQuestionResponseContext?
    @State private var showsPreferenceIntake = false
    @StateObject private var personalTasteQuestionErrorToast = TBToastPresenter()
    let systemTopChrome: AnyView?
    let onStartMeasurement: () -> Void
    let onOpenTasteChange: () -> Void

    init(
        systemTopChrome: AnyView? = nil,
        onStartMeasurement: @escaping () -> Void = {},
        onOpenTasteChange: @escaping () -> Void = {}
    ) {
        self.systemTopChrome = systemTopChrome
        self.onStartMeasurement = onStartMeasurement
        self.onOpenTasteChange = onOpenTasteChange
    }

    var body: some View {
        NavigationStack {
            MainTabChromeScrollView(topChrome: systemTopChrome) {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    analysisContent
                }
                .tasteBloomMotion(.content, value: appModel.sensoryAnalysisIsUpdating)
                .tbPageContentPadding(bottom: TBSpacing.mainTabContentBottom)
                .containerRelativeFrame(.horizontal, alignment: .leading)
                .tbCardBordersVisible(false)
            }
            .scrollBounceBehavior(.basedOnSize, axes: .horizontal)
            .navigationTitle("분석")
            .tbInlineNavigationTitle()
            .toolbar(.hidden, for: .navigationBar)
            .tbPageBackground()
            .sheet(item: $selectedSheet) { selection in
                analysisSheet(selection)
            }
        }
        .ignoresSafeArea(.container, edges: systemTopChrome == nil ? [] : .top)
        .fullScreenCover(item: $pendingPersonalTasteQuestion) { context in
            personalTasteQuestionFeedback(context)
        }
        .sheet(isPresented: $showsPreferenceIntake) {
            PreferenceIntakeFlowView(onBack: { showsPreferenceIntake = false }, onComplete: { showsPreferenceIntake = false })
        }
        .overlay(alignment: .bottom) {
            if personalTasteQuestionErrorToast.isPresented {
                ToastSurface(
                    title: "연결된 기록이 없어 저장하지 못했어요",
                    icon: .info,
                    tone: .warning
                )
                .padding(.horizontal, TBSpacing.page)
                .padding(.bottom, TBSpacing.mainTabContentBottom)
                .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
                .zIndex(10)
            }
        }
        .animation(
            TasteBloomMotion.animation(.feedback, reduceMotion: reduceMotion),
            value: personalTasteQuestionErrorToast.isPresented
        )
        .onDisappear { personalTasteQuestionErrorToast.cancel() }
        .modifier(PersonalTasteAnswerToast())
    }

    @ViewBuilder
    private var analysisContent: some View {
        switch displayState {
        case .ready(let snapshot):
            readyContent(snapshot)
        case .empty, .processing, .failed:
            TBPageSection(title: "나의 입맛") {
                SensoryAnalysisStatusCard(state: displayState)
            }
        }
        TastePerceptionCards(
            snapshot: appModel.sensoryAnalysis,
            submissions: ([appModel.profile].compactMap { $0 } + appModel.profileHistory).compactMap(\.surveySubmission),
            entries: appModel.diningEntries,
            onOpenTasteChange: onOpenTasteChange
        )
        if let submission = appModel.profile?.surveySubmission {
            TBPageSection(title: "처음 남긴 맛의 단서") {
                TasteSurveyEvidenceCard(submission: submission)
            }
        }
        TBPageSection(title: "내가 알려준 선호") {
            PreferenceIntakeEvidenceCard(evidence: appModel.sensoryAnalysis.statedPreferences,
                                        hasLegacyProfile: appModel.preferenceProfile != nil) { showsPreferenceIntake = true }
        }
    }

    @ViewBuilder
    private func readyContent(_ snapshot: SensoryAnalysisSnapshot) -> some View {
        TBPageSection(title: "나의 입맛") {
            SensoryAnalysisHeroCard(snapshot: snapshot)

            SensoryEvidenceSummaryCard(
                observationCount: snapshot.observations.count,
                unresolvedCount: snapshot.unresolved.count
            ) {
                selectedSheet = .evidence
            }

            if snapshot.needsMeaningReview || !snapshot.unresolved.isEmpty {
                InterpretationCard(
                    description: "아직 뜻을 확인 중인 표현이 있어요",
                    eyebrow: "선택 확인",
                    supportingText: "원문은 보존하고, 의미가 분명해지기 전에는 입맛 사실로 확정하지 않아요.",
                    detailLabel: "표현 보기",
                    accentColor: TBColor.textDisabled,
                    onExpand: { selectedSheet = .evidence }
                )
            }
        }

        TBPageSection(title: "인사이트") {
            let personalCandidates = PersonalTasteCandidatePresentation.groups(
                snapshot.personalModel?.candidates ?? []
            )
            if !personalCandidates.isEmpty {
                VStack(spacing: TBSpacing.x12) {
                    ForEach(personalCandidates) { candidate in
                        InterpretationCard(
                            description: candidate.title,
                            eyebrow: PersonalTasteCandidatePresentation.eyebrow(candidate),
                            supportingText: candidate.body,
                            detailLabel: "근거 보기",
                            accentColor: TBColor.textDisabled,
                            onExpand: { selectedSheet = .personalCandidate(candidate.id) }
                        )
                    }
                }
            } else if snapshot.insights.isEmpty {
                SectionCard {
                    VStack(alignment: .leading, spacing: TBSpacing.x4) {
                        Text("다음 단서를 모으고 있어요")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)
                        Text("같은 감각의 직접 평가나 다른 상황의 기록이 쌓이면 비교할 수 있는 해석을 보여드려요.")
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textHint)
                            .lineSpacing(4)
                    }
                }
            } else {
                VStack(spacing: TBSpacing.x12) {
                    ForEach(snapshot.insights) { insight in
                        InterpretationCard(
                            description: insight.title,
                            eyebrow: insightEyebrow(insight),
                            supportingText: insight.body,
                            detailLabel: "근거 보기",
                            accentColor: TBColor.textDisabled,
                            onExpand: { selectedSheet = .insight(insight.id) }
                        )
                    }
                }
            }
        }

        let insightGroups = PersonalTasteInsightPresentation.groups(snapshot.personalModel)
        ForEach([PersonalTasteInsightGroup.Kind.fit, .overall], id: \.self) { kind in
            let groups = insightGroups.filter { $0.kind == kind }
            if !groups.isEmpty {
                TBPageSection(title: kind == .fit ? "알맞았던 조건" : "음식 전체와 감각") {
                    VStack(spacing: TBSpacing.x12) {
                        ForEach(groups) { group in
                            InterpretationCard(
                                description: group.title,
                                eyebrow: group.eyebrow,
                                supportingText: group.body,
                                detailLabel: "근거 보기",
                                accentColor: TBColor.textDisabled,
                                onExpand: { selectedSheet = .personalInsight(group.id) }
                            )
                        }
                    }
                }
            }
        }

        if let question = visibleNextSelection(in: snapshot) {
            TBPageSection(title: "다음 선택") {
                PersonalTasteNextQuestionCard(
                    selection: question,
                    sourceSelectionLabel: snapshot.observations.first {
                        $0.id == question.responseSourceID
                    }?.selectionEvidence?.labelSnapshot,
                    onStartNewRecord: {
                        pendingPersonalTasteQuestion = appModel.personalTasteQuestionResponseContext(
                            for: question
                        )
                    }
                )
                .task(id: question.id) {
                    appModel.recordPersonalTasteQuestionExposure(
                        id: question.id,
                        userID: snapshot.personalModel?.userID ?? "local-owner"
                    )
                }
            }
        }

        if let configuration = ChatGPTAnalysisConfiguration.load() {
            ChatGPTAnalysisCard(configuration: configuration)
        }

    }

    private var displayState: SensoryAnalysisDisplayState {
        if appModel.sensoryAnalysisIsUpdating { return .processing }
        if let error=appModel.sensoryAnalysisError { return .failed(error) }
        let snapshot=appModel.sensoryAnalysis
        if snapshot.observations.isEmpty,
           snapshot.unresolved.isEmpty,
           snapshot.insights.isEmpty,
           snapshot.completedExperienceCount == 0 {
            return .empty
        }
        return .ready(snapshot)
    }

    private func insightEyebrow(_ insight: SensoryInsight) -> String {
        if insight.experienceCount > 1 { return "\(insight.experienceCount)개 기록" }
        return "현재 기록의 해석"
    }

    private func visibleNextSelection(
        in snapshot: SensoryAnalysisSnapshot
    ) -> PersonalTasteNextSelection? {
        guard let model = snapshot.personalModel,
              let selection = model.nextSelection,
              appModel.shouldPresentPersonalTasteQuestion(
                id: selection.id,
                userID: model.userID
              ) else {
            return nil
        }
        return selection
    }

    @ViewBuilder
    private func analysisSheet(_ selection: SensoryAnalysisSheetSelection) -> some View {
        switch selection {
        case .evidence:
            SensoryEvidenceDetailSheet(
                observations: appModel.sensoryAnalysis.observations,
                unresolved: appModel.sensoryAnalysis.unresolved
            )
        case .insight(let id):
            if let insight=appModel.sensoryAnalysis.insights.first(where: { $0.id == id }) {
                let evidenceIDs=Set(insight.evidenceIDs)
                SensoryInsightDetailSheet(
                    insight: insight,
                    observations: appModel.sensoryAnalysis.observations.filter { evidenceIDs.contains($0.id) },
                    unresolved: [],
                    limits: appModel.sensoryAnalysis.limits
                )
            }
        case .personalCandidate(let id):
            if let model = appModel.sensoryAnalysis.personalModel,
               let group = PersonalTasteCandidatePresentation.groups(model.candidates)
                .first(where: { $0.id == id }) {
                PersonalTasteCandidateDetailSheet(
                    group: group,
                    observations: appModel.sensoryAnalysis.observations,
                    entries: appModel.diningEntries,
                    limits: model.limits + appModel.sensoryAnalysis.limits
                )
            }
        case .personalInsight(let id):
            if let group = PersonalTasteInsightPresentation.groups(appModel.sensoryAnalysis.personalModel)
                .first(where: { $0.id == id }) {
                PersonalTasteInsightDetailSheet(
                    group: group,
                    observations: appModel.sensoryAnalysis.observations,
                    entries: appModel.diningEntries
                )
            }
        case .questionEvidence(let id):
            if let selection = appModel.sensoryAnalysis.personalModel?.nextSelection,
               selection.id == id {
                let evidenceIDs = Set(selection.evidenceIDs)
                SensoryEvidenceDetailSheet(
                    observations: appModel.sensoryAnalysis.observations.filter {
                        evidenceIDs.contains($0.id)
                    },
                    unresolved: []
                )
            }
        }
    }

    @ViewBuilder
    private func personalTasteQuestionFeedback(
        _ context: PersonalTasteQuestionResponseContext
    ) -> some View {
        if context.selection.intent == "clarification",
           let sourceEntryID = context.sourceEntryID,
           let sourceEntry = appModel.diningEntry(id: sourceEntryID) {
            DiningFeedbackSheet(entry: sourceEntry, startMode: .details) { entry in
                savePersonalTasteQuestionResponse(entry, context: context)
            }
        } else if context.selection.intent == "exploration" {
            DiningFeedbackSheet(startMode: .menu) { entry in
                savePersonalTasteQuestionResponse(entry, context: context)
            }
        } else {
            Color.clear
                .onAppear {
                    appModel.refreshSensoryAnalysis()
                    pendingPersonalTasteQuestion = nil
                }
        }
    }

    private func savePersonalTasteQuestionResponse(
        _ entry: DiningEntry,
        context: PersonalTasteQuestionResponseContext
    ) {
        if case .sourceUnavailable = appModel.savePersonalTasteQuestionResponse(
            entry,
            context: context
        ) {
            personalTasteQuestionErrorToast.present(policy: .copyConfirmation)
        }
    }
}

private enum SensoryAnalysisSheetSelection: Identifiable {
    case evidence
    case insight(String)
    case personalCandidate(String)
    case personalInsight(String)
    case questionEvidence(String)

    var id: String {
        switch self {
        case .evidence: "evidence"
        case .insight(let id): "insight:\(id)"
        case .personalCandidate(let id): "personal-candidate:\(id)"
        case .personalInsight(let id): "personal-insight:\(id)"
        case .questionEvidence(let id): "question-evidence:\(id)"
        }
    }
}
