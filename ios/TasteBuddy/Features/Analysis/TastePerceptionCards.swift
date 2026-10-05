import SwiftUI

struct TastePerceptionCards: View {
    let snapshot: SensoryAnalysisSnapshot
    let submissions: [TasteSurveySubmissionContract]
    let entries: [DiningEntry]
    var onOpenTasteChange: () -> Void = {}
    @State private var showMeals = false
    @State private var sourceWasChosen = false
    @State var showPrevious = false
    @State private var detail: TasteCardDetailRoute?

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
        detail = .perception(showMeals ? .meal(referenceOnly: reference) : .survey(referenceOnly: reference))
    }

    var body: some View {
        TBPageSection(title: "감각 패턴") {
            SectionCard {
                VStack(spacing: 0) {
                    HStack {
                        radarNavigationButton("chevron.left", label: "이전 기간 보기", enabled: !showPrevious && hasPrevious) { showPrevious = true }
                        Spacer()
                        Menu {
                            Button("기준 음식 회상") { sourceWasChosen = true; showMeals = false; showPrevious = false }
                            Button("식사 기록") { sourceWasChosen = true; showMeals = true; showPrevious = false }
                        } label: {
                            VStack(spacing: 3) {
                                Text(showMeals ? "식사 기록" : "기준 음식 회상").font(TBFont.semibold(14))
                                Text(periodLabel).font(TBFont.regular(11))
                            }.foregroundStyle(TBColor.textPrimary)
                                .frame(minHeight: 44)
                        }.accessibilityLabel("\(periodLabel), 기록 출처 선택")
                        Spacer()
                        radarNavigationButton("chevron.right", label: "다음 기간 보기", enabled: showPrevious) { showPrevious = false }
                    }
                    ZStack {
                        TasteRadarView(reportedValues: values(previous: showPrevious), maximum: showMeals ? 3 : 4,
                                       referenceValues: showPrevious ? [:] : values(previous: true).filter { values(previous: false)[$0.key] != nil })
                            .frame(maxWidth: 360).frame(maxWidth: .infinity)
                            .id([showMeals, showPrevious])
                            .transition(.opacity)
                    }
                    .tasteBloomMotion(.content, value: [showMeals, showPrevious])
                    HStack(alignment: .bottom, spacing: 4) {
                        Button { openRadarEvidence() } label: {
                            VStack(spacing: 4) {
                                Text(showPrevious ? "이전 기록" : "현재 기록").font(TBFont.regular(10)).foregroundStyle(TBColor.textHint)
                                RadarComparisonValueBadge(count(previous: showPrevious) == 0 ? "기록 없음" : showMeals ? "식사 \(count(previous: showPrevious))회" : "회상 \(count(previous: showPrevious))개")
                            }.frame(minHeight: 44, alignment: .bottom)
                        }.buttonStyle(.plain).accessibilityHint("적용 조건과 원본 기록 보기")
                        RadarComparisonArrowBadge()
                        Button { openRadarEvidence(reference: true) } label: {
                            VStack(spacing: 4) {
                                Text("비교할 이전 기록").font(TBFont.regular(10)).foregroundStyle(TBColor.textHint)
                                RadarComparisonValueBadge(!showPrevious && !values(previous: true).isEmpty ? "이전 기록" : "아직 없음")
                            }.frame(minHeight: 44, alignment: .bottom)
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
            }
            .accessibilityIdentifier("taste-perception-change")

            TasteInsightSummaryCardLayout(
                indicatorColors: model.contrasts.map(\.first.axis.mainColor),
                sectionLabel: "특이사항", actionLabel: "조건과 근거", title: model.contrasts.isEmpty ? "조건별 차이는 확인 중" : "같은 음식도 조건에 따라 다르게 느꼈어요",
                onTap: { detail = .perception(.conditions) }
            ) {
                Text(model.contrasts.first.map { "\($0.first.conditionLabel) · \($0.second.conditionLabel) — 근거 \($0.mealIDs.count)번의 식사" }
                     ?? "같은 음식의 부위나 시점을 다르게 남긴 반복 기록을 살펴봐요.")
                    .font(TBFont.regular(13)).foregroundStyle(TBColor.textBody).lineSpacing(4)
            }
        }
        .onAppear { if !sourceWasChosen { showMeals = TasteAxis.allCases.contains { model.current(for: $0)?.currentLevel != nil } } }
        .onChange(of: snapshot.perception) { _, _ in
            detail = nil
            if !sourceWasChosen { showMeals = TasteAxis.allCases.contains { model.current(for: $0)?.currentLevel != nil } }
        }
        .tasteDetail($detail)
    }

    private func radarNavigationButton(_ symbol: String, label: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            LucideIcon(systemName: symbol, size: TBIcon.Size.base, strokeWidth: TBIcon.Stroke.regular)
                .foregroundStyle(enabled ? TBColor.textPrimary : TBColor.textDisabled).frame(width: 44, height: 44)
        }.buttonStyle(TBTokenButtonStyle()).disabled(!enabled).accessibilityLabel(label)
    }

    private var changeTitle: String {
        if let first = model.changes.first { return "\(first.axis.label)을 느낀 강도가 달라졌어요" }
        return surveyChanges.isEmpty ? (hasComparison ? "비교한 기록에서는 같은 강도예요" : "비교할 기록이 부족해요") : "기준 음식에서 기억한 강도가 달라졌어요"
    }
    private var changeSummary: String {
        if let first = model.changes.first {
            return "\(first.conditionLabel) · 이전 \(first.previous.mealIDs.count)번과 최근 \(first.recent.mealIDs.count)번의 식사"
        }
        return "같은 음식·조건·척도로 남긴 이전·최근 회상 응답을 비교했어요."
    }
}

struct TastePerceptionDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    let request: TastePerceptionDetailRequest
    @State private var selectedAxis: TasteAxis?
    private var model: TastePerceptionSnapshot { appModel.sensoryAnalysis.perception }
    private var observations: [SensoryObservation] { appModel.sensoryAnalysis.observations }
    private var entries: [DiningEntry] { appModel.diningEntries }
    private var survey: [SurveyPerceptionPoint] {
        SurveyPerception.points(submissions: ([appModel.profile].compactMap { $0 } + appModel.profileHistory).compactMap(\.surveySubmission))
    }
    private var patterns: [TastePerceptionPattern] {
        switch request {
        case .meal(let reference): TasteAxis.allCases.compactMap { model.current(for: $0) }.filter { !reference || $0.previousLevel != nil }
        case .conditions: model.contrasts.flatMap { [$0.first, $0.second] }
        case .survey: []
        }
    }
    private var points: [SurveyPerceptionPoint] {
        switch request { case .survey(let reference): survey.filter { !reference || $0.previousValue != nil }; default: [] }
    }
    private var visiblePatterns: [TastePerceptionPattern] {
        Array(Dictionary(grouping: patterns.filter { selectedAxis == nil || $0.axis == selectedAxis }, by: \.id)
            .values.compactMap(\.first)).sorted { $0.id < $1.id }
    }
    private var visiblePoints: [SurveyPerceptionPoint] {
        points.filter { selectedAxis == nil || $0.axis == selectedAxis }
    }
    var body: some View {
        TasteDetailPage(title: request == .conditions ? "조건별 차이" : "감각 패턴") {
            Picker("감각", selection: $selectedAxis) {
                Text("전체 감각").tag(nil as TasteAxis?)
                ForEach(TasteAxis.allCases, id: \.self) { axis in Text(axis.label).tag(Optional(axis)) }
            }.pickerStyle(.menu).frame(maxWidth: .infinity, minHeight: 48).tint(TBColor.textPrimary)
                .accessibilityIdentifier("taste-perception-detail-axis")
        } content: {
            VStack(alignment: .leading, spacing: TBSpacing.x20) {
                if visiblePatterns.isEmpty && visiblePoints.isEmpty {
                    Text("기록 없음").font(TBFont.regular(13)).foregroundStyle(TBColor.textHint)
                        .frame(maxWidth: .infinity, minHeight: 180)
                }
                ForEach(visiblePatterns) { pattern in
                    TasteDetailChartPanel {
                        Text(pattern.axis.label).font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                        TasteDetailScope(text: pattern.conditionLabel)
                        TasteDetailScope(text: "식사 \(pattern.recent.mealIDs.count)회 · \(dateRange(pattern.recent))")
                        TasteDetailBarPlot(points: pattern.counts.enumerated().map { index, count in
                            .init(id: String(index), label: TastePerceptionEngine.levelLabels[index],
                                  value: Double(count), valueLabel: "\(count)회")
                        }, accent: pattern.axis.mainColor)
                    }
                    TasteDetailGroup {
                        TasteDetailValueRow(title: "최근 강도", value: pattern.currentLevel.map { TastePerceptionEngine.levelLabels[$0] } ?? "—", showsDivider: false)
                        TasteDetailValueRow(title: "이전 강도", value: pattern.previousLevel.map { TastePerceptionEngine.levelLabels[$0] } ?? "—")
                        if pattern.conflictCount > 0 { TasteDetailValueRow(title: "응답 나뉨", value: "\(pattern.conflictCount)개") }
                    }.padding(.horizontal, TBSpacing.page)
                    TasteDetailDisclosure("기록") {
                        if pattern.previousLevel != nil { Text("이전 · \(dateRange(pattern.previous)) · 식사 \(pattern.previous.mealIDs.count)회") }
                        let ids = Set(pattern.recent.evidenceIDs + pattern.previous.evidenceIDs)
                        SensoryEvidenceList(observations: observations.filter { ids.contains($0.id) }, unresolved: [])
                    }.padding(.horizontal, TBSpacing.page)
                }
                ForEach(visiblePoints) { point in
                    if let item = point.item, let submission = point.submission {
                        TasteDetailChartPanel {
                            Text(point.axis.label).font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                            TasteDetailScope(text: item.anchor.label + " · 회상 강도 0–4")
                        }
                        TasteDetailGroup {
                            TasteDetailValueRow(title: "최근 · \(submission.recordedAt.prefix(10))", value: submission.responseLabel(for: item.id), showsDivider: false)
                            if let previous = point.previousSubmission {
                                TasteDetailValueRow(title: "이전 · \(previous.recordedAt.prefix(10))", value: previous.responseLabel(for: item.id))
                            }
                        }.padding(.horizontal, TBSpacing.page)
                        TasteDetailDisclosure("응답 조건") {
                            Text(item.prompt)
                            ForEach(item.anchor.conditions, id: \.self) { Text($0) }
                        }.padding(.horizontal, TBSpacing.page)
                    }
                }
            }.padding(.bottom, TBSpacing.page)
        }
    }
    private func dateRange(_ period: TastePerceptionPeriod) -> String {
        guard let start = period.start, let end = period.end else { return "날짜 미확인" }
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
