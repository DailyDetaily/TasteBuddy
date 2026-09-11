import SwiftUI

struct TastePerceptionCards: View {
    let snapshot: SensoryAnalysisSnapshot
    let submissions: [TasteSurveySubmissionContract]
    let entries: [DiningEntry]
    var onOpenTasteChange: () -> Void = {}
    @State private var showMeals = false
    @State var showPrevious = false
    @State private var detail: PerceptionDetail?

    private var survey: [SurveyPerceptionPoint] { SurveyPerception.points(submissions: submissions) }
    private var model: TastePerceptionSnapshot { snapshot.perception }
    private var surveyChanges: [SurveyPerceptionPoint] { survey.filter(\.hasChange) }
    private var hasChanges: Bool { !model.changes.isEmpty || !surveyChanges.isEmpty }
    private var hasComparison: Bool { model.patterns.contains { $0.previousLevel != nil && $0.currentLevel != nil }
        || survey.contains { $0.previousValue != nil && $0.value != nil } }
    private var currentPatterns: [TastePerceptionPattern] { TasteAxis.allCases.compactMap { model.current(for: $0) } }
    private var hasPrevious: Bool { showMeals ? currentPatterns.contains { !$0.previous.mealIDs.isEmpty } : survey.contains { $0.previousSubmission != nil } }
    private func values(previous: Bool) -> [TasteAxis: Double] {
        if showMeals {
            return Dictionary(uniqueKeysWithValues: currentPatterns.compactMap { pattern in
                (previous ? pattern.previousLevel : pattern.currentLevel).map { (pattern.axis, Double($0 + 1)) }
            })
        }
        return Dictionary(uniqueKeysWithValues: survey.compactMap { point in
            (previous ? point.previousValue : point.value).map { (point.axis, Double($0)) }
        })
    }
    private func count(previous: Bool) -> Int {
        showMeals ? Set(currentPatterns.flatMap { previous ? $0.previous.mealIDs : $0.recent.mealIDs }).count : values(previous: previous).count
    }
    private var periodLabel: String {
        let dates: [Date] = showMeals ? currentPatterns.flatMap { pattern in
            let period = showPrevious ? pattern.previous : pattern.recent
            return [period.start, period.end].compactMap { $0 }
        } : survey.compactMap { PersonalTasteModelBuilder.date((showPrevious ? $0.previousSubmission : $0.submission)?.recordedAt) }
        guard let start = dates.min(), let end = dates.max() else { return showPrevious ? "이전 기록" : "최근 기록" }
        let label = start.formatted(.dateTime.year().month(.twoDigits).day(.twoDigits).locale(Locale(identifier: "ko_KR")))
        return Calendar.current.isDate(start, inSameDayAs: end) ? label : label + " – " + end.formatted(.dateTime.month(.twoDigits).day(.twoDigits).locale(Locale(identifier: "ko_KR")))
    }
    private func openRadarEvidence(reference: Bool = false) {
        detail = showMeals ? .meal(currentPatterns.filter { !reference || $0.previousLevel != nil })
            : .survey(survey.filter { !reference || $0.previousValue != nil })
    }

    var body: some View {
        TBPageSection(title: "맛을 느끼는 경향") {
            SectionCard {
                VStack(spacing: 0) {
                    HStack {
                        radarNavigationButton("chevron.left", label: "이전 기간 보기", enabled: !showPrevious && hasPrevious) { showPrevious = true }
                        Spacer()
                        Menu {
                            Button("기준 음식 회상") { showMeals = false; showPrevious = false }
                            Button("식사 기록") { showMeals = true; showPrevious = false }
                        } label: {
                            Text(periodLabel).font(TBFont.semibold(14)).foregroundStyle(TBColor.textPrimary)
                                .frame(minHeight: 44)
                        }.accessibilityLabel("\(periodLabel), 기록 출처 선택")
                        Spacer()
                        radarNavigationButton("chevron.right", label: "다음 기간 보기", enabled: showPrevious) { showPrevious = false }
                    }
                    ZStack {
                        TasteRadarView(reportedValues: values(previous: showPrevious), maximum: showMeals ? 3 : 4,
                                       referenceValues: showPrevious ? [:] : values(previous: true))
                            .frame(maxWidth: 360).frame(maxWidth: .infinity)
                            .id([showMeals, showPrevious])
                            .transition(.opacity)
                    }
                    .tasteBloomMotion(.content, value: [showMeals, showPrevious])
                    HStack(alignment: .bottom, spacing: 4) {
                        Button { openRadarEvidence() } label: {
                            VStack(spacing: 4) {
                                Text("나의 반응").font(TBFont.regular(10)).foregroundStyle(TBColor.textHint)
                                RadarComparisonValueBadge(count(previous: showPrevious) == 0 ? "기록 없음" : showMeals ? "식사 \(count(previous: showPrevious))회" : "회상 \(count(previous: showPrevious))개")
                            }.frame(minHeight: 44)
                        }.buttonStyle(.plain).accessibilityHint("적용 조건과 원본 기록 보기")
                        RadarComparisonArrowBadge()
                        Button { openRadarEvidence(reference: true) } label: {
                            VStack(spacing: 4) {
                                Text("기준 반응").font(TBFont.regular(10)).foregroundStyle(TBColor.textHint)
                                RadarComparisonValueBadge(!showPrevious && !values(previous: true).isEmpty ? "이전 기록" : "아직 없음")
                            }.frame(minHeight: 44)
                        }.buttonStyle(.plain).disabled(showPrevious || values(previous: true).isEmpty)
                    }.padding(.top, 8)
                }
            }
            .accessibilityIdentifier("taste-perception-radar")

            TasteInsightSummaryCardLayout(
                indicatorColors: model.changes.map(\.axis.mainColor) + surveyChanges.map(\.axis.mainColor),
                sectionLabel: "미각변화", actionLabel: "기록 비교", title: changeTitle,
                onTap: onOpenTasteChange
            ) {
                if !hasComparison { TasteChangeEmptySummary() }
                Text(hasChanges ? changeSummary : hasComparison ? "비교한 기록에서는 같은 강도로 남겼어요." : "비교할 기록이 더 필요해요.")
                    .font(TBFont.regular(13)).foregroundStyle(TBColor.textBody).lineSpacing(4)
            }
            .accessibilityIdentifier("taste-perception-change")

            TasteInsightSummaryCardLayout(
                indicatorColors: model.contrasts.map(\.first.axis.mainColor),
                sectionLabel: "특이사항", actionLabel: "조건과 근거", title: model.contrasts.isEmpty ? "조건별 차이는 확인 중" : "같은 음식도 조건에 따라 다르게 느꼈어요",
                onTap: { detail = .conditions }
            ) {
                Text(model.contrasts.first.map { "\($0.first.conditionLabel) · \($0.second.conditionLabel) — 근거 \($0.mealIDs.count)번의 식사" }
                     ?? "같은 음식의 부위나 시점을 다르게 남긴 반복 기록을 살펴봐요.")
                    .font(TBFont.regular(13)).foregroundStyle(TBColor.textBody).lineSpacing(4)
            }
        }
        .onAppear { showMeals = TasteAxis.allCases.contains { model.current(for: $0)?.currentLevel != nil } }
        .onChange(of: snapshot.perception) { _, _ in detail = nil }
        .sheet(item: $detail) { selection in
            TastePerceptionDetailSheet(selection: selection, model: model, survey: survey, observations: snapshot.observations, entries: entries)
        }
    }

    private func radarNavigationButton(_ symbol: String, label: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            LucideIcon(systemName: symbol, size: TBIcon.Size.base, strokeWidth: TBIcon.Stroke.regular)
                .foregroundStyle(enabled ? TBColor.textPrimary : TBColor.textDisabled).frame(width: 44, height: 44)
        }.buttonStyle(TBTokenButtonStyle()).disabled(!enabled).accessibilityLabel(label)
    }

    private var changeTitle: String {
        if let first = model.changes.first { return "\(first.axis.label)을 느낀 강도가 달라졌어요" }
        return surveyChanges.isEmpty ? "아직 변화없음" : "기준 음식에서 기억한 강도가 달라졌어요"
    }
    private var changeSummary: String {
        if let first = model.changes.first {
            return "\(first.conditionLabel) · 이전 \(first.previous.mealIDs.count)번과 최근 \(first.recent.mealIDs.count)번의 식사"
        }
        return "같은 음식·조건·척도로 남긴 이전·최근 회상 응답을 비교했어요."
    }
}

private enum PerceptionDetail: Identifiable {
    case meal([TastePerceptionPattern]), survey([SurveyPerceptionPoint]), conditions
    var id: String {
        switch self { case .meal: "meal"; case .survey: "survey"; case .conditions: "conditions" }
    }
}

private struct TastePerceptionDetailSheet: View {
    let selection: PerceptionDetail
    let model: TastePerceptionSnapshot
    let survey: [SurveyPerceptionPoint]
    let observations: [SensoryObservation]
    let entries: [DiningEntry]
    @Environment(\.dismiss) private var dismiss
    @State private var originalEntry: DiningEntry?
    private var patterns: [TastePerceptionPattern] {
        switch selection {
        case .meal(let rows): rows
        case .conditions: model.contrasts.flatMap { [$0.first, $0.second] }
        case .survey: []
        }
    }
    private var points: [SurveyPerceptionPoint] {
        switch selection { case .survey(let rows): rows; default: [] }
    }
    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton { dismiss() }),
            headerCenter: AnyView(Text("강도 기록과 적용 조건").tbTextStyle(.sheetTitle)),
            stageMode: .auto(maxHeightRatio: 1), usesNativeSheetChrome: true, surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    if patterns.isEmpty && points.isEmpty {
                        SectionCard { Text("비교할 기록이 더 필요해요. 음식·부위·시점과 직접 느낀 강도를 함께 남겨주세요.").font(TBFont.regular(13)) }
                    }
                    ForEach(Array(Dictionary(grouping: patterns, by: \.id).values.compactMap(\.first)).sorted { $0.id < $1.id }) { pattern in
                        TBPageSection(title: pattern.axis.label, subtitle: pattern.conditionLabel) {
                            SectionCard {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("최근 \(pattern.recent.mealIDs.count)번의 식사 · \(dateRange(pattern.recent))").font(TBFont.semibold(13))
                                    Text(pattern.currentLevel.map { "\(TastePerceptionEngine.levelLabels[$0]) 느낀 경향" } ?? "확인 중").font(TBFont.medium(13))
                                    Text(pattern.counts.enumerated().filter { $0.element > 0 }.map { "\(TastePerceptionEngine.levelLabels[$0.offset]) \($0.element)번" }.joined(separator: " · ")).font(TBFont.regular(12))
                                    if let previous = pattern.previousLevel {
                                        Text("이전 \(pattern.previous.mealIDs.count)번 · \(dateRange(pattern.previous)) · \(TastePerceptionEngine.levelLabels[previous])").font(TBFont.regular(12))
                                    }
                                    if pattern.conflictCount > 0 { Text("같은 식사에서 강도 응답이 나뉜 기록 \(pattern.conflictCount)개").font(TBFont.regular(12)) }
                                    Text("기록된 음식·부위·시점 안에서만 비교해요. 조리 상태와 온도 등 기록하지 않은 조건이나 변화의 원인은 알 수 없어요.").font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                                }.foregroundStyle(TBColor.textBody)
                            }
                            let ids = Set(pattern.recent.evidenceIDs + pattern.previous.evidenceIDs)
                            SensoryEvidenceList(observations: observations.filter { ids.contains($0.id) }, unresolved: [])
                            ForEach(entries.filter { (pattern.recent.experienceIDs + pattern.previous.experienceIDs).contains($0.id) }) { entry in
                                Button { originalEntry = entry } label: {
                                    Label("\(entry.menu) · \(entry.observedAt.formatted(date: .abbreviated, time: .omitted)) 원래 기록 보기", systemImage: "arrow.up.right")
                                        .font(TBFont.medium(12)).frame(minHeight: 44)
                                }.tint(TBColor.textSecondary)
                            }
                        }
                    }
                    ForEach(points) { point in
                        if let item = point.item, let submission = point.submission {
                            TBPageSection(title: point.axis.label, subtitle: item.anchor.label) {
                                SectionCard {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("최근 · \(submission.recordedAt.prefix(10)) · \(submission.responseLabel(for: item.id))").font(TBFont.semibold(13))
                                        if let previous = point.previousSubmission {
                                            Text("이전 · \(previous.recordedAt.prefix(10)) · \(previous.responseLabel(for: item.id))").font(TBFont.regular(13))
                                        }
                                        Text(item.prompt).font(TBFont.regular(13))
                                        ForEach(item.anchor.conditions, id: \.self) { Text($0).font(TBFont.regular(12)) }
                                        Text("회상 응답은 실제 식사 횟수에 포함하지 않아요.").font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                                    }
                                }
                            }
                        }
                    }
                }.tbPageContentPadding()
            }
        }
        .presentationDetents([.large]).presentationDragIndicator(.hidden)
        .sheet(item: $originalEntry) { entry in
            DishFeedbackDetailSheet(item: .fromDiningEntry(entry, analysis: nil))
        }
    }
    private func dateRange(_ period: TastePerceptionPeriod) -> String {
        guard let start = period.start, let end = period.end else { return "시점 확인 중" }
        return "\(start.formatted(date: .abbreviated, time: .omitted))–\(end.formatted(date: .abbreviated, time: .omitted))"
    }
}

#Preview("응답 없음 · 레이더와 미각변화") {
    ScrollView { TastePerceptionCards(snapshot: .empty, submissions: [], entries: []).padding(20) }
        .background(TBColor.page)
}

#if DEBUG || targetEnvironment(simulator)
/// 실제 저장소와 연결하지 않는 렌더 검증 진입점.
struct TastePerceptionRuntimePreview: View {
    private let args = ProcessInfo.processInfo.arguments
    @State private var showsChanges = ProcessInfo.processInfo.arguments.contains("--perception-change-page")
    private var entries: [DiningEntry] {
        guard args.contains("--perception-meals") else { return [] }
        return (0..<6).map { index in
            let date = Date(timeIntervalSince1970: 1_780_000_000 + Double(index * 86400))
            return .init(restaurant: "검증 식당", menu: "국물 요리", date: date, savedAt: date, rating: 1, note: "",
                         sensorySelections: [.init(id: "salty-broth-salt", type: .bubble, labelSnapshot: "육수의 짠맛",
                         liking: .disliked, intensity: index < 3 ? .light : .strong, preferenceFit: .justRight, target: .broth, phase: .firstBite)])
        }
    }
    var body: some View {
        let sourceEntries = entries
        let observations = (try? SensoryAnalysisEngine.analyze(entries: sourceEntries)) ?? .empty
        if showsChanges {
            TasteChangeFocusView(topChrome: AnyView(TopAppBar(appearance: .transparent, title: "미각 변화", showBack: true, showsDefaultActions: false, onBack: { showsChanges = false })), contentOffset: 0,
                                seriesOverride: TasteChangeSeries.build(perception: observations.perception, survey: []))
                .environmentObject(AppModel.preview(onboardingComplete: true, diningEntries: sourceEntries))
                .tbScreenTopChrome()
        } else {
            ScrollView {
                TastePerceptionCards(snapshot: observations, submissions: [], entries: sourceEntries,
                                     onOpenTasteChange: { showsChanges = true }, showPrevious: args.contains("--perception-previous")).padding(20)
            }
            .defaultScrollAnchor(args.contains("--perception-bottom") ? .bottom : .top)
            .background(TBColor.page)
        }
    }
}
#endif

private struct RadarComparisonValueBadge: View {
    let label: String

    init(_ label: String) {
        self.label = label
    }

    var body: some View {
        Text(label)
            .font(TBFont.bold(12))
            .foregroundStyle(Color.white)
            .lineLimit(1)
            .fixedSize(horizontal: true, vertical: true)
            .padding(.horizontal, 10)
            .padding(.vertical, 3)
            .frame(height: 24)
            .background(TBColor.textPrimary)
            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}

private struct RadarComparisonArrowBadge: View {
    var body: some View {
        Text("→")
            .font(TBFont.bold(10))
            .foregroundStyle(Color.white)
            .frame(width: 24, height: 24)
            .fixedSize()
            .background(TBColor.textDisabled)
            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}
