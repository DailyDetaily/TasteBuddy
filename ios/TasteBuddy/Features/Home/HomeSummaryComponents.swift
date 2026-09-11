import SwiftUI

/// 홈과 나의 입맛은 동일한 분석 결과를 사용한다. 표시용 표본이나 점수를 만들지 않는다.
struct HomeSensorySummarySection: View {
    @EnvironmentObject private var appModel: AppModel
    let snapshot: SensoryAnalysisSnapshot
    let isUpdating: Bool
    let error: String?
    var onOpenAnalysis: (() -> Void)?
    var onOpenQuestions: (() -> Void)?
    @State private var homeQuestionIDs: [String]?
    var onStartNewDining: ((PersonalTasteNextSelection) -> Void)?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isQuestionStackExpanded: Bool = {
        #if DEBUG || targetEnvironment(simulator)
        let arguments = ProcessInfo.processInfo.arguments
        return arguments.contains("--sensory-insights-home-qa") && arguments.contains("--question-queue-expanded-qa")
        #else
        return false
        #endif
    }()
    var onOpenInsight: ((HomeArchiveCard.Kind) -> Void)? = nil

    var body: some View {
        let cards = HomeArchiveSummaryEngine.cards(entries: appModel.diningEntries, snapshot: snapshot)
        TBPageSection(title: "인사이트 요약", titleSize: .medium) {
            CardScrollList(spacing: TBSpacing.x12) {
                ForEach(cards) { card in
                    HomeSummaryCard(
                        label: card.kind.rawValue,
                        value: card.value,
                        detail: card.detail,
                        axis: card.kind.axis,
                        symbol: card.kind.symbol,
                        onTap: onOpenInsight.map { open in { open(card.kind) } }
                    )
                }
            }

            if isUpdating {
                SensoryAnalysisStatusCard(state: .processing)
            } else if let error {
                SensoryAnalysisStatusCard(state: .failed(error))
            } else {
                let batchIDs = homeQuestionIDs ?? PersonalTasteQuestionList.homeIDs(
                    questions: visibleQuestions, observations: snapshot.observations, entries: appModel.diningEntries
                )
                let questions = PersonalTasteQuestionList.remaining(ids: batchIDs, questions: visibleQuestions)
                let hasMore = visibleQuestions.contains { !batchIDs.contains($0.id) }
                VStack(spacing: TBSpacing.x12) {
                    ForEach(Array((isQuestionStackExpanded ? questions : Array(questions.prefix(1))).enumerated()), id: \.element.id) { index, question in
                        PersonalTasteNextQuestionCard(
                            selection: question,
                            sourceSelectionLabel: snapshot.observations.first {
                                $0.id == question.responseSourceID
                            }?.selectionEvidence?.labelSnapshot,
                            showsStack: !isQuestionStackExpanded && (questions.count > 1 || hasMore),
                            isStackExpanded: isQuestionStackExpanded,
                            onToggleStack: question.id == questions.first?.id && (questions.count > 1 || hasMore) ? {
                                withAnimation(TasteBloomMotion.animation(isQuestionStackExpanded ? .content : .sheet, reduceMotion: reduceMotion)) {
                                    isQuestionStackExpanded.toggle()
                                }
                            } : nil,
                            onStartNewRecord: { onStartNewDining?(question) }
                        )
                        .transition(TasteBloomMotion.questionReveal(reduceMotion: reduceMotion, index: max(0, index - 1)))
                        .task(id: question.id) {
                            appModel.recordPersonalTasteQuestionExposure(id: question.id, userID: personalModelUserID)
                        }
                    }
                    if questions.isEmpty, let homeQuestionIDs, !homeQuestionIDs.isEmpty {
                        let answered = homeQuestionIDs.allSatisfy {
                            appModel.personalTasteQuestionProgressByUser[personalModelUserID]?[$0]?.status == .resolved
                        }
                        SectionCard(showsBorder: false) {
                            Text(answered ? "지금 보여드린 질문에 모두 답했어요" : "기록이 바뀌어 지금 확인할 질문이 없어요")
                                .font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                                .frame(maxWidth: .infinity, minHeight: 44)
                        }
                    }
                    if (isQuestionStackExpanded || questions.isEmpty), hasMore {
                        Button("질문 전체보기 · \(visibleQuestions.count)개") { onOpenQuestions?() }
                            .font(TBFont.regular(12)).foregroundStyle(TBColor.textAction)
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("taste-questions-see-all")
                    }
                }
            }
        }
        .tasteBloomMotion(.content, value: isUpdating)
        .tasteBloomMotion(.content, value: visibleQuestions.map(\.id))
        .onChange(of: isUpdating ? [] : visibleQuestions.map(\.id), initial: true) { _, ids in
            guard homeQuestionIDs == nil, !ids.isEmpty, error == nil else { return }
            homeQuestionIDs = PersonalTasteQuestionList.homeIDs(
                questions: visibleQuestions, observations: snapshot.observations, entries: appModel.diningEntries
            )
        }
    }

    private var personalModelUserID: String {
        snapshot.personalModel?.userID ?? "local-owner"
    }

    private var visibleQuestions: [PersonalTasteNextSelection] {
        (snapshot.personalModel?.availableSelections ?? []).filter {
            appModel.shouldPresentPersonalTasteQuestion(id: $0.id, userID: personalModelUserID)
        }
    }

}

enum PersonalTasteQuestionList {
    struct Group: Identifiable {
        let id: String
        let entry: DiningEntry?
        var questions: [PersonalTasteNextSelection]
    }

    static func groups(questions: [PersonalTasteNextSelection], observations: [SensoryObservation], entries: [DiningEntry]) -> [Group] {
        var result: [Group] = []
        var indices: [String: Int] = [:]
        for question in questions {
            let entry = PersonalTasteInlineAnswer.sourceEntry(for: question, observations: observations, entries: entries)
            let key = entry.map { entry in
                if let id = entry.menuItemID, !id.isEmpty { return "menu:\(id)" }
                let names = [entry.restaurant, entry.menu].map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
                return "meal:" + names.joined(separator: "\u{001F}")
            } ?? "question:\(question.id)"
            if let index = indices[key] {
                result[index].questions.append(question)
            } else {
                indices[key] = result.count
                result.append(.init(id: key, entry: entry, questions: [question]))
            }
        }
        return result
    }

    static func homeIDs(questions: [PersonalTasteNextSelection], observations: [SensoryObservation], entries: [DiningEntry]) -> [String] {
        groups(questions: questions, observations: observations, entries: entries).prefix(3).compactMap { $0.questions.first?.id }
    }

    static func remaining(ids: [String], questions: [PersonalTasteNextSelection]) -> [PersonalTasteNextSelection] {
        ids.compactMap { id in questions.first { $0.id == id } }
    }
}

struct PersonalTasteQuestionsView: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var pendingQuestion: PersonalTasteQuestionResponseContext?
    @StateObject private var errorToast = TBToastPresenter()

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton { dismiss() }),
            headerCenter: AnyView(Text("질문 전체보기").tbTextStyle(.sheetTitle)),
            stageMode: .auto(maxHeightRatio: 1),
            usesNativeSheetChrome: true,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                LazyVStack(alignment: .leading, spacing: TBSpacing.section) {
                    if appModel.sensoryAnalysisIsUpdating {
                        SensoryAnalysisStatusCard(state: .processing)
                    } else if let error = appModel.sensoryAnalysisError {
                        SensoryAnalysisStatusCard(state: .failed(error))
                    } else if groups.isEmpty {
                        SectionCard(showsBorder: false) {
                            Text("지금 확인할 질문이 없어요")
                                .font(TBFont.regular(14)).foregroundStyle(TBColor.textHint)
                        }
                    } else {
                        ForEach(groups) { group in
                            VStack(alignment: .leading, spacing: TBSpacing.x12) {
                                ForEach(group.questions) { question in
                                    PersonalTasteNextQuestionCard(
                                        selection: question,
                                        sourceSelectionLabel: appModel.sensoryAnalysis.observations.first {
                                            $0.id == question.responseSourceID
                                        }?.selectionEvidence?.labelSnapshot,
                                        onStartNewRecord: {
                                            pendingQuestion = appModel.personalTasteQuestionResponseContext(for: question)
                                        }
                                    )
                                    .task(id: question.id) {
                                        appModel.recordPersonalTasteQuestionExposure(id: question.id, userID: userID)
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
        .fullScreenCover(item: $pendingQuestion) { context in
            if context.selection.intent == "clarification", let id = context.sourceEntryID,
               let entry = appModel.diningEntry(id: id) {
                DiningFeedbackSheet(entry: entry, startMode: .details) { save($0, context: context) }
            } else if context.selection.intent == "exploration" {
                DiningFeedbackSheet(startMode: .menu) { save($0, context: context) }
            } else {
                Color.clear.onAppear {
                    pendingQuestion = nil
                    appModel.refreshSensoryAnalysis()
                    errorToast.present(policy: .copyConfirmation)
                }
            }
        }
        .overlay(alignment: .bottom) {
            if errorToast.isPresented {
                ToastSurface(title: "연결된 기록이 없어 저장하지 못했어요", icon: .info, tone: .warning)
                    .padding(TBSpacing.page)
            }
        }
        .modifier(PersonalTasteAnswerToast(bottomPadding: TBSpacing.x12))
        .onDisappear { errorToast.cancel() }
    }

    private var userID: String { appModel.sensoryAnalysis.personalModel?.userID ?? "local-owner" }

    private var groups: [PersonalTasteQuestionList.Group] {
        let questions = (appModel.sensoryAnalysis.personalModel?.availableSelections ?? []).filter {
            appModel.shouldPresentPersonalTasteQuestion(id: $0.id, userID: userID)
        }
        return PersonalTasteQuestionList.groups(questions: questions, observations: appModel.sensoryAnalysis.observations, entries: appModel.diningEntries)
    }

    private func save(_ entry: DiningEntry, context: PersonalTasteQuestionResponseContext) {
        if case .sourceUnavailable = appModel.savePersonalTasteQuestionResponse(entry, context: context) {
            errorToast.present(policy: .copyConfirmation)
        }
    }
}

#Preview("질문 전체보기 · 빈 상태") {
    PersonalTasteQuestionsView()
        .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: []))
}

extension HomeArchiveCard.Kind {
    func backgroundColor(tintProgress: Double) -> Color {
        var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
        var tintRed: CGFloat = 0, tintGreen: CGFloat = 0, tintBlue: CGFloat = 0
        guard UIColor(TBColor.page).getRed(&red, green: &green, blue: &blue, alpha: &alpha),
              UIColor(axis.tintSurfaceColor).getRed(&tintRed, green: &tintGreen, blue: &tintBlue, alpha: &alpha) else { return TBColor.page }
        let progress = min(1, max(0, tintProgress))
        return Color(red: red + (tintRed - red) * progress,
                     green: green + (tintGreen - green) * progress,
                     blue: blue + (tintBlue - blue) * progress)
    }

    var axis: TasteAxis {
        switch self {
        case .record: .umami
        case .repeated, .liking: .sweet
        case .experience: .fat
        case .sensation, .condition: .sour
        case .fit: .salty
        case .difference, .change: .bitter
        }
    }

    var symbol: String {
        switch self {
        case .record: "calendar.badge.checkmark.fill"
        case .repeated: "fork.knife.fill"
        case .experience: "globe.fill"
        case .liking: "heart.fill"
        case .sensation: "sparkles.fill"
        case .fit: "checkmark.circle.fill"
        case .condition: "slider.horizontal.3"
        case .difference: "arrow.left.arrow.right"
        case .change: "arrow.up.right.fill"
        }
    }
}

struct HomeInsightTintPreferenceKey: PreferenceKey {
    static var defaultValue: [String: Double] = [:]
    static func reduce(value: inout [String: Double], nextValue: () -> [String: Double]) {
        value.merge(nextValue(), uniquingKeysWith: { _, next in next })
    }
}

struct HomeArchiveDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var backgroundTintProgress = 0.0
    let kind: HomeArchiveCard.Kind
    var bottomContentInset: CGFloat = 0

    var body: some View {
        let snapshot = appModel.sensoryAnalysis
        let card = HomeArchiveSummaryEngine.cards(entries: appModel.diningEntries, snapshot: snapshot)
            .first { $0.kind == kind } ?? .empty(kind)
        let entries = appModel.diningEntries.filter { card.entryIDs.contains($0.id) }
            .sorted { $0.observedAt > $1.observedAt }

        let tasteDistribution = HomeInsightTasteDistribution.make(card: card, entries: entries, snapshot: snapshot)

        GeometryReader { viewport in
            let ringHeight = min(340, max(1, viewport.size.width - TBSpacing.page * 2))
            ScrollView {
                LazyVStack(alignment: .leading, spacing: TBSpacing.x24) {
                    VStack(spacing: TBSpacing.x24) {
                        GeometryReader { ring in
                            let hidden = min(ringHeight, max(0, ring.bounds(of: .scrollView)?.minY ?? 0))
                            let collapse = Double(hidden / ringHeight)
                            HomeInsightDotRing(kind: kind, mealCount: Set(entries.map(\.mealID)).count,
                                               reduceMotion: reduceMotion, tasteDistribution: tasteDistribution, collapseProgress: collapse)
                                .frame(width: ring.size.width, height: ringHeight)
                                .scaleEffect(1 - collapse, anchor: .top)
                                .offset(y: hidden)
                                .allowsHitTesting(collapse == 0)
                                .accessibilityHidden(collapse == 1)
                        }
                        .frame(width: ringHeight, height: ringHeight)
                        .onGeometryChange(for: Double.self) { proxy in
                            let hiddenFraction = (proxy.bounds(of: .scrollView)?.minY ?? 0) / ringHeight
                            // 링의 2/3 이후부터 스크롤 위치에 맞춰 색을 섞는다.
                            return min(1, max(0, Double(hiddenFraction) * 3 - 2))
                        } action: { progress in
                            backgroundTintProgress = progress
                        }
                        .frame(maxWidth: .infinity)

                        VStack(alignment: .leading, spacing: TBSpacing.x8) {
                            Text(card.value).tbTextStyle(.sectionTitle)
                            Text(card.detail)
                                .font(TBFont.semibold(14)).foregroundStyle(kind.axis.tintSurfaceTextColor)
                            if !card.explanation.isEmpty {
                                Text(card.explanation).tbTextStyle(.body)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .accessibilityElement(children: .combine)
                    }

                    if !entries.isEmpty {
                        VStack(spacing: 0) {
                            HStack(spacing: TBSpacing.x12) {
                                LucideIcon(systemName: kind.symbol, size: 20, filled: true)
                                    .accessibilityHidden(true)
                                Text("관련 기록").font(TBFont.semibold(16))
                                Spacer(minLength: TBSpacing.x8)
                                Text("\(entries.count)개 · 최근순").font(TBFont.regular(12))
                            }
                            .foregroundStyle(TBColor.textPrimary)
                            .padding(TBSpacing.x20)
                            .background(kind.axis.mainColor)

                            ForEach(entries) { entry in
                                let evidence = snapshot.observations.filter {
                                    $0.experienceID == entry.id && card.evidenceIDs.contains($0.id)
                                }
                                HomeInsightRecordRow(
                                    entry: entry, evidence: evidence, axis: kind.axis,
                                    showsNote: card.evidenceIDs.isEmpty
                                )
                                if entry.id != entries.last?.id {
                                    Divider().overlay(TBColor.borderSubtle)
                                        .padding(.horizontal, TBSpacing.x20)
                                }
                            }
                        }
                        .background(TBColor.surface)
                        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
                    } else {
                        SectionCard(showsBorder: false) {
                            VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                Text("관련 기록").tbTextStyle(.subsectionTitle)
                                Text("연결할 기록이 아직 없어요").tbTextStyle(.body)
                            }
                            .padding(TBSpacing.x8)
                        }
                    }
                }
                .tbPageContentPadding(bottom: TBSpacing.page + bottomContentInset)
                // 기록이 적어도 링을 완전히 접을 만큼의 스크롤 거리를 유지한다.
                .frame(minHeight: viewport.size.height + ringHeight + TBSpacing.pageTop, alignment: .top)
            }
        }
        .tbPageBackground(kind.backgroundColor(tintProgress: backgroundTintProgress))
        .preference(key: HomeInsightTintPreferenceKey.self, value: [kind.rawValue: backgroundTintProgress])
        .accessibilityIdentifier("home-insight-detail")
    }
}

struct HomeInsightDotRing: View {
    let kind: HomeArchiveCard.Kind
    let mealCount: Int
    let reduceMotion: Bool
    var tasteDistribution: HomeInsightTasteDistribution = .empty
    var collapseProgress = 0.0
    @Environment(\.scenePhase) private var scenePhase
    @State private var startedAt: Date?
    @State private var scrollStartedAt: Date?
    @State private var isVisible = false
    @State private var interaction = TasteMotionGeometry.InsightInteraction()
    @State private var rotation = TasteMotionGeometry.InsightRotation()
    @GestureState private var isPressed = false

    var body: some View {
        let colorIndices = tasteDistribution.dotColorIndices
        TimelineView(.animation(minimumInterval: 1.0 / 30, paused: reduceMotion || !isVisible || scenePhase != .active || mealCount == 0 || collapseProgress > 0)) { timeline in
            let date = scrollStartedAt ?? timeline.date
            let time = startedAt.map { date.timeIntervalSince($0) } ?? 0
            let reverseTime = collapseProgress > 0 ? min(time, TasteMotionGeometry.insightIntroDuration) * (1 - collapseProgress) : time
            let frame = TasteMotionGeometry.insightFrame(time: reverseTime, settled: reduceMotion || mealCount == 0,
                                                        alignment: reduceMotion ? interaction.target : interaction.value(at: date),
                                                        freeMotionTime: max(0, time - TasteMotionGeometry.insightIntroDuration),
                                                        alignmentElapsed: interaction.anchorElapsed(at: date), rotation: rotation.value(at: date),
                                                        colorIndices: colorIndices)
            ZStack {
                Canvas { context, size in
                    let side = min(size.width, size.height)
                    context.translateBy(x: (size.width - side) / 2, y: (size.height - side) / 2)
                    context.scaleBy(x: side / 640, y: side / 640)
                    // 점의 색 비율은 관련 식사의 미각 관찰 구성입니다.
                    let palette = tasteDistribution.total == 0 ? Array(repeating: TBColor.borderSubtle, count: 6) : TasteAxis.allCases.map { $0.palette.main }
                    TasteMotionView.drawInsight(context: &context, frame: frame, palette: palette)
                }
                .accessibilityHidden(true)

                Circle().stroke(kind.axis.mainColor.opacity(0.10), lineWidth: 1)
                    .padding(68)
                    .opacity(frame.expansion)
                    .accessibilityHidden(true)

                VStack(spacing: TBSpacing.x8) {
                    Text(mealCount == 0 ? "—" : mealCount.formatted())
                        .font(.custom("Pretendard-Bold", size: 64, relativeTo: .largeTitle))
                        .monospacedDigit().minimumScaleFactor(0.5).lineLimit(1)
                        .foregroundStyle(TBColor.textPrimary)
                    Text(mealCount == 0 ? "기록을 기다려요" : "번의 식사")
                        .font(TBFont.medium(13)).foregroundStyle(TBColor.textBody)
                    LucideIcon(systemName: kind.symbol, size: 20, filled: true)
                        .foregroundStyle(kind.axis.tintSurfaceTextColor)
                        .frame(width: 40, height: 40)
                        .background(TBColor.surface, in: RoundedRectangle(cornerRadius: TBRadius.row))
                        .padding(.top, TBSpacing.x4)
                        .accessibilityHidden(true)
                }
                .padding(.horizontal, 90)
                .opacity(frame.expansion)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .contentShape(Rectangle())
        .onGeometryChange(for: CGSize.self) { $0.size } action: { rotation.size = $0 }
        .highPriorityGesture(DragGesture(minimumDistance: 0)
            .updating($isPressed) { _, pressed, _ in pressed = true }
            .onChanged { value in
                if collapseProgress == 0 && (reduceMotion || startedAt.map { Date.now.timeIntervalSince($0) >= TasteMotionGeometry.insightIntroDuration } == true) { rotation.drag(to: value.location) }
            }
            .onEnded { _ in rotation.end(immediate: reduceMotion) }, including: mealCount > 0 && collapseProgress == 0 ? .all : .none)
        .onChange(of: isPressed) {
            interaction.setPressed(isPressed, immediate: reduceMotion)
            if !isPressed { rotation.end(immediate: reduceMotion) }
        }
        .onChange(of: collapseProgress) { old, new in
            if old == 0, new > 0 { scrollStartedAt = .now }
            if new == 0, let pausedAt = scrollStartedAt {
                startedAt = startedAt?.addingTimeInterval(Date.now.timeIntervalSince(pausedAt))
                scrollStartedAt = nil
            }
        }
        .accessibilityAddTraits(mealCount > 0 ? .isButton : [])
        .accessibilityHint("누르면 미각별로 모이고, 드래그하면 회전합니다. 이중 탭으로 정렬을 전환하고 위아래로 쓸어 회전할 수 있습니다.")
        .accessibilityAction { if mealCount > 0 { interaction.setPressed(interaction.target == 0, immediate: reduceMotion) } }
        .accessibilityAdjustableAction { direction in
            guard mealCount > 0, collapseProgress == 0 else { return }
            switch direction {
            case .increment: rotation.rotate(by: .pi / 12)
            case .decrement: rotation.rotate(by: -.pi / 12)
            @unknown default: break
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(mealCount == 0 ? "연결된 식사 기록 없음" : "이 인사이트에 연결된 식사 \(mealCount)번")
        .accessibilityValue(tasteDistribution.accessibilitySummary)
        .accessibilityIdentifier("home-insight-meal-count")
        .onGeometryChange(for: Bool.self) { proxy in
            TasteBloomMotion.chartIsVisible(size: proxy.size, viewport: proxy.bounds(of: .scrollView))
        } action: { visible in
            if visible && startedAt == nil { startedAt = .now }
            isVisible = visible
        }
        .onDisappear { isVisible = false }
    }
}

private struct HomeInsightRecordRow: View {
    let entry: DiningEntry
    let evidence: [SensoryObservation]
    let axis: TasteAxis
    let showsNote: Bool

    var body: some View {
        Group {
            if !evidence.isEmpty || (showsNote && !entry.note.isEmpty) {
                DisclosureGroup {
                    if !evidence.isEmpty {
                        SensoryEvidenceList(observations: evidence, unresolved: [])
                            .padding(.top, TBSpacing.x12)
                    } else {
                        Text(entry.note).tbTextStyle(.body)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.top, TBSpacing.x12)
                    }
                } label: { label }
                .tint(axis.tintSurfaceTextColor)
            } else {
                label
            }
        }
        .padding(TBSpacing.x20)
    }

    private var label: some View {
        HStack(alignment: .top, spacing: TBSpacing.x12) {
            VStack(spacing: TBSpacing.x4) {
                Text(entry.observedAt.formatted(.dateTime.month(.abbreviated)))
                    .font(TBFont.regular(10))
                Text(entry.observedAt.formatted(.dateTime.day()))
                    .font(TBFont.bold(18))
            }
            .foregroundStyle(axis.tintSurfaceTextColor)
            .frame(width: 44, height: 54)
            .background(axis.tintSoftColor, in: RoundedRectangle(cornerRadius: TBRadius.row))
            .accessibilityLabel(entry.observedAt.formatted(date: .complete, time: .omitted))

            VStack(alignment: .leading, spacing: TBSpacing.x4) {
                Text(entry.menu).tbTextStyle(.subsectionTitle)
                Text(entry.restaurant).tbTextStyle(.caption)
                if let observation = evidence.first {
                    Text(observation.selectionEvidence.map { "\($0.labelSnapshot) · \($0.labelValue)" } ?? "“\(observation.phrase)”")
                        .font(TBFont.regular(12)).foregroundStyle(axis.tintSurfaceTextColor)
                        .lineLimit(2)
                } else if showsNote && !entry.note.isEmpty {
                    Text(entry.note).tbTextStyle(.body).lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, TBSpacing.x4)
    }
}

#Preview("인사이트 상세 · 기록") {
    AppShellView(initialRoute: .homeInsight(.record))
        .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: [.sample]))
}

#Preview("인사이트 상세 · 빈 상태") {
    AppShellView(initialRoute: .homeInsight(.condition))
        .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: []))
}

struct HomeSummaryCard: View {
    let label: String
    let value: String
    let detail: String
    let axis: TasteAxis
    let symbol: String
    var onTap: (() -> Void)? = nil

    var body: some View {
        RecommendationMiniCardLayout(
            axis: axis,
            title: label,
            subtitle: detail,
            detail: value,
            detailFont: TBFont.regular(14),
            onTap: onTap
        ) {
            LucideIcon(
                systemName: symbol,
                size: TBIcon.Size.small,
                strokeWidth: TBIcon.Stroke.medium,
                filled: true
            )
            .frame(
                width: RecommendationMiniCardMetrics.avatarSize,
                height: RecommendationMiniCardMetrics.avatarSize
            )
            .foregroundStyle(axis.mainColor)
            .background(TBColor.surface)
            .clipShape(Circle())
        }
    }
}

struct HomeSummaryRail: View {
    let metrics: [HomeSummaryMetric]
    var onSelect: ((HomeSummaryMetricKind) -> Void)? = nil

    var body: some View {
        TBPageSection(title: "미식 요약", titleSize: .medium) {
            CardScrollList(spacing: TBSpacing.x12) {
                ForEach(metrics) { metric in
                    HomeSummaryCard(
                        label: metric.cardLabel,
                        value: metric.cardValue,
                        detail: metric.cardDetail,
                        axis: metric.kind.cardAxis,
                        symbol: metric.kind.cardSymbol,
                        onTap: onSelect.map { handler in
                            { handler(metric.kind) }
                        }
                    )
                }
            }
        }
    }
}

private extension HomeSummaryMetricKind {
    var cardAxis: TasteAxis {
        switch self {
        case .record: .umami
        case .frequentMenu: .sweet
        case .regularRestaurant: .salty
        case .tasteDiscovery: .sour
        case .breadth: .fat
        case .tasteChange: .bitter
        }
    }

    var cardSymbol: String {
        switch self {
        case .record: "calendar.badge.checkmark.fill"
        case .frequentMenu: "fork.knife.fill"
        case .regularRestaurant: "storefront.fill"
        case .tasteDiscovery: "sparkles.fill"
        case .breadth: "globe.fill"
        case .tasteChange: "arrow.up.right.fill"
        }
    }
}

private extension HomeSummaryMetric {
    var cardLabel: String {
        if detail == "처음 기록한 메뉴" {
            return "최근 기록 메뉴"
        }

        if detail == "처음 기록한 식당" {
            return "방문한 식당"
        }

        if kind == .tasteDiscovery, detail == "1회 등장" {
            return "기록한 미각 단서"
        }

        return title
    }

    var cardValue: String {
        if state == .empty {
            return kind == .record ? "0번의 식사" : "기록 대기"
        }

        if kind == .record {
            return "\(value)번의 식사"
        }

        return value
    }

    var cardDetail: String {
        switch state {
        case .populated:
            return detail
                .replacingOccurrences(of: "식당 ", with: "")
        case .empty:
            return switch kind {
            case .record: "첫 기록을 남겨보세요"
            case .frequentMenu: "메뉴 기록 후 표시"
            case .regularRestaurant: "식당 기록 후 표시"
            case .tasteDiscovery: "미각 단서를 모으는 중"
            case .breadth: "경험을 모으는 중"
            case .tasteChange: "반응을 모으는 중"
            }
        case .building, .insufficient:
            return "반응 데이터가 더 필요해요"
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview("감각 요약 · 빈 기록") {
        HomeSensorySummarySection(snapshot: .empty, isUpdating: false, error: nil)
            .padding(TBSpacing.page)
            .background(TBColor.page)
            .environmentObject(AppModel.preview())
    }

    #Preview("미식 아카이브 · 카드") {
        let entries = [DiningEntry.sample]
        let snapshot = (try? SensoryAnalysisEngine.analyze(entries: entries)) ?? .empty
        CardScrollList {
            ForEach(HomeArchiveSummaryEngine.cards(entries: entries, snapshot: snapshot)) { card in
                HomeSummaryCard(label: card.kind.rawValue, value: card.value, detail: card.detail, axis: card.kind.axis, symbol: card.kind.symbol)
            }
        }
        .padding(TBSpacing.page)
        .background(TBColor.page)
    }

    #Preview {
        HomeSummaryRail(
            metrics: HomeSummaryEngine.metrics(for: [.sample])
        )
        .padding(TBSpacing.page)
        .background(TBColor.page)
    }
#endif
