import SwiftUI

struct AnalysisView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @EnvironmentObject private var appModel: AppModel
    @State private var selectedDetail: TasteCardDetailRoute?
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
            .tasteDetail($selectedDetail)
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
        AccountDataSyncNotice()
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
            onOpenTasteChange: onOpenTasteChange,
            isLoading: appModel.sensoryAnalysisIsUpdating || appModel.backendSessionStatus == .restoring,
            error: appModel.sensoryAnalysisError,
            onRetry: { Task { await appModel.syncAccountData(); appModel.refreshSensoryAnalysis() } }
        )
        .id(appModel.memoryAccountGeneration)
    }

    private func readyContent(_ snapshot: SensoryAnalysisSnapshot) -> some View {
        SensoryAnalysisHeroCard(snapshot: snapshot, showsCard: false)
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
        guard let model = snapshot.personalModel else { return nil }
        return PersonalTasteInlineAnswer.answerableQuestions(
            model.availableSelections, observations: snapshot.observations, entries: appModel.diningEntries
        ).first { appModel.shouldPresentPersonalTasteQuestion(id: $0.id, userID: model.userID) }
    }

    @ViewBuilder
    private func personalTasteQuestionFeedback(
        _ context: PersonalTasteQuestionResponseContext
    ) -> some View {
        if context.selection.intent != "exploration",
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
