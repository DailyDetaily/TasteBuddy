import SwiftUI

struct TastePerceptionCards: View {
    let snapshot: SensoryAnalysisSnapshot
    let submissions: [TasteSurveySubmissionContract]
    let entries: [DiningEntry]
    var onOpenTasteChange: () -> Void = {}
    var isLoading = false
    var error: String? = nil
    var onRetry: (() -> Void)? = nil
    @State private var detail: TasteCardDetailRoute?
    private var overall: OverallTasteProfile { OverallTasteProfile.build(snapshot: snapshot) }

    private var survey: [SurveyPerceptionPoint] { SurveyPerception.points(submissions: submissions) }
    private var model: TastePerceptionSnapshot { snapshot.perception }
    private var changeSeries: [TasteChangeSeries] { TasteChangeSeries.summary(TasteChangeSeries.build(perception: model, survey: survey)) }
    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x20) {
            VStack(spacing: 0) {
                if isLoading {
                    ProgressView("전체 기록을 불러오고 있어요")
                        .font(TBFont.regular(13))
                        .frame(maxWidth: .infinity, minHeight: 300)
                } else if let error {
                    VStack(spacing: TBSpacing.x12) {
                        Text("입맛 기록을 불러오지 못했어요").font(TBFont.semibold(14))
                        Text(error).font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                        if let onRetry { Button("다시 시도", action: onRetry).frame(minHeight: 44) }
                    }.frame(maxWidth: .infinity, minHeight: 300)
                } else {
                    OverallTasteRadar(profile: overall)
                        .id(snapshot.personalModel?.userID)
                }
            }
            .accessibilityIdentifier("taste-perception-radar")

            TasteInsightSummaryCardLayout(
                indicatorColors: changeSeries.map(\.axis.mainColor),
                indicatorCategory: .change,
                sectionLabel: "미각 변화", actionLabel: "자세히보기", title: isLoading ? "기록을 불러오고 있어요" : error != nil ? "기록 조회 실패" : changeTitle,
                accessibilityLabel: changeAccessibilityLabel,
                onTap: isLoading || error != nil ? nil : onOpenTasteChange
            ) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity, minHeight: 52)
                } else if let error {
                    Text(error).font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                    if let onRetry { Button("다시 시도", action: onRetry).frame(minHeight: 44) }
                } else if changeSeries.isEmpty {
                    TasteChangeEmptySummary()
                } else {
                    TastePerceptionChangeSummary(series: changeSeries)
                }
            }
            .accessibilityIdentifier("taste-perception-change")

            HomePeriodInsightCard(data: specialNoteSummary,
                                  onTap: isLoading || error != nil ? nil : { detail = .perception(.conditions) },
                                  labelOverride: "특이사항", visualization: AnyView(Color.clear),
                                  indicatorColors: model.contrasts.isEmpty ? [TBColor.textDisabled] : model.contrasts.map(\.first.axis.mainColor),
                                  showsIndicatorIcon: true)
        }
        .onChange(of: snapshot.perception) { _, _ in detail = nil }
        .tasteDetail($detail)
    }

    private var changeTitle: String {
        guard let first = changeSeries.first else { return "비교할 기록이 부족해요" }
        return first.source == "식사 기록" ? "식사에서 느낀 강도 변화" : "기준 음식의 회상 강도 변화"
    }
    private var changeAccessibilityLabel: String? {
        guard !isLoading, error == nil else { return nil }
        let rows = changeSeries.map { row in
            "\(row.axis.label), \(row.source), \(row.condition), " + row.points.map { "\($0.id) \($0.label)" }.joined(separator: " → ")
        }
        return (["미각 변화", changeTitle] + rows).joined(separator: ", ")
    }
    private var specialNoteSummary: HomePeriodInsightCardData {
        let contrast = isLoading || error != nil ? nil : model.contrasts.first
        return .init(kind: .tasteClue, title: isLoading ? "불러오는 중" : error != nil ? "기록 조회 실패" : contrast == nil ? "—" : "같은 음식의 강도 차이",
                     detail: isLoading ? "현재 기록 집계\n잠시만 기다려주세요" : error != nil ? "다시 시도 필요\n기록 조회 실패" : contrast.map { "\($0.first.axis.label) · 다른 조건\n근거 \($0.mealIDs.count)번의 식사" } ?? "비교 응답 부족\n같은 음식 기준",
                     supportingText: nil, stats: [], chartValues: [], accentAxis: contrast?.first.axis,
                     state: contrast == nil ? .insufficient : .populated, category: .context)
    }
}

/// The populated counterpart of TasteChangeEmptySummary, using the existing line/arrow primitives.
/// Values are ordinal responses from the detail series, never profile percentages.
struct TastePerceptionChangeSummary: View {
    let series: [TasteChangeSeries]
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        VStack(spacing: TasteLineChartMetrics.rowSpacing) {
            ForEach(series) { row in
                let before = row.points.first!, after = row.points.last!
                let trend: TastePointTrend = after.value > before.value ? .increase : after.value < before.value ? .decrease : .neutral
                let layout = dynamicTypeSize.isAccessibilitySize
                    ? AnyLayout(VStackLayout(alignment: .leading, spacing: 4)) : AnyLayout(TBSummaryCardBodyLayout())
                layout {
                    HStack(spacing: 8) {
                        TastePointArrowBox(axis: row.axis, trend: trend, glyphSize: 12, strokeWidth: 3)
                        HStack(spacing: 6) {
                            Text(row.axis.label).font(TBFont.medium(14)).foregroundStyle(TBColor.textSecondary)
                            Text(TasteChangeSeries.changeLabel(row.points)).font(TBFont.semibold(12)).foregroundStyle(row.axis.mainColor)
                        }
                    }.frame(minHeight: TasteLineChartMetrics.rowHeight, alignment: .leading)
                    TasteLineChart(entries: [.init(axis: row.axis, values: row.points.map { Double($0.value) })],
                                   plotWidth: TBMiniChartMetrics.width, plotHeight: TasteLineChartMetrics.rowHeight,
                                   valueDomain: 0...Double(row.maximum))
                        .frame(width: TBMiniChartMetrics.width, height: TasteLineChartMetrics.rowHeight)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("\(row.axis.label), \(row.source), \(row.condition), 이전 \(before.label)에서 최근 \(after.label), \(before.count)개와 \(after.count)개 근거")
            }
        }
        .accessibilityIdentifier("taste-perception-change-graphs")
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
                // Keep every distribution above the supporting cards when multiple senses are visible.
                ForEach(visiblePatterns) { pattern in
                    TasteDetailChartPanel {
                        Text(pattern.axis.label).font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                        TasteDetailScope(text: pattern.conditionLabel)
                        TasteDetailScope(text: "식사 \(pattern.recent.mealIDs.count)회 · \(dateRange(pattern.recent))")
                        TasteDetailBarPlot(points: pattern.counts.enumerated().map { index, count in
                            .init(id: String(index), label: TastePerceptionEngine.levelLabels[index],
                                  value: Double(count), valueLabel: "\(count)회")
                        }, accent: pattern.axis.mainColor, unit: "회", axis: pattern.axis)
                    }
                }
                VStack(alignment: .leading, spacing: TBSpacing.x20) {
                    if visiblePatterns.isEmpty && visiblePoints.isEmpty {
                        SectionCard(showsBorder: false) {
                            Text("기록 없음").font(TBFont.regular(13)).foregroundStyle(TBColor.textHint)
                                .frame(maxWidth: .infinity, minHeight: 180)
                        }
                    }
                    ForEach(visiblePatterns) { pattern in
                        TasteDetailGroup {
                            VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                Text(pattern.axis.label).font(TBFont.semibold(14)).foregroundStyle(TBColor.textPrimary)
                                TasteDetailScope(text: pattern.conditionLabel)
                            }.padding(TBSpacing.x16)
                            TasteDetailValueRow(title: "최근 강도", value: pattern.currentLevel.map { TastePerceptionEngine.levelLabels[$0] } ?? "—", showsDivider: false)
                            TasteDetailValueRow(title: "이전 강도", value: pattern.previousLevel.map { TastePerceptionEngine.levelLabels[$0] } ?? "—")
                            if pattern.conflictCount > 0 { TasteDetailValueRow(title: "응답 나뉨", value: "\(pattern.conflictCount)개") }
                        }
                        TasteDetailDisclosure("\(pattern.axis.label) · 기록") {
                            if pattern.previousLevel != nil { Text("이전 · \(dateRange(pattern.previous)) · 식사 \(pattern.previous.mealIDs.count)회") }
                            let ids = Set(pattern.recent.evidenceIDs + pattern.previous.evidenceIDs)
                            SensoryEvidenceList(observations: observations.filter { ids.contains($0.id) }, unresolved: [])
                        }
                    }
                    ForEach(visiblePoints) { point in
                        if let item = point.item, let submission = point.submission {
                            TasteDetailGroup {
                                VStack(alignment: .leading, spacing: TBSpacing.x16) {
                                    Text(point.axis.label).font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                                    TasteDetailScope(text: item.anchor.label + " · 회상 강도 0–4")
                                }.padding(TBSpacing.x16)
                                TasteDetailValueRow(title: "최근 · \(submission.recordedAt.prefix(10))", value: submission.responseLabel(for: item.id), showsDivider: false)
                                if let previous = point.previousSubmission {
                                    TasteDetailValueRow(title: "이전 · \(previous.recordedAt.prefix(10))", value: previous.responseLabel(for: item.id))
                                }
                            }
                            TasteDetailDisclosure("\(point.axis.label) · 응답 조건") {
                                Text(item.prompt)
                                ForEach(item.anchor.conditions, id: \.self) { Text($0) }
                            }
                        }
                    }
                }.padding(.horizontal, TBSpacing.page)
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
                         liking: .disliked, intensity: index < 3 ? .light : .strong, preferenceFit: .justRight, target: .broth, phase: .firstBite),
                         .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", intensity: index < 3 ? .strong : .light,
                               target: .sauce, phase: .afterSwallow)],
                         mealTime: .init(source: .confirmed, start: date, confirmedAt: date))
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
                                     onOpenTasteChange: { showsChanges = true }).padding(20)
            }
            .defaultScrollAnchor(args.contains("--perception-bottom") ? .bottom : .top)
            .background(TBColor.page)
        }
    }
}
#endif


/// Selection is local presentation state; percentages always come from the latest account profile.
private struct OverallTasteRadar: View {
    let profile: OverallTasteProfile
    @State private var selectedAxis: TasteAxis?
    private var selected: OverallTasteProfile.Axis? { profile.axes.first { $0.axis == selectedAxis } }

    var body: some View {
        VStack(spacing: 0) {
            TasteRadarView(reportedValues: profile.values, maximum: 100,
                           referenceValues: profile.referenceValues, showsLikingRates: true,
                           selectedAxis: selectedAxis, onSelectAxis: { axis in
                selectedAxis = selectedAxis == axis ? nil : axis
            })
            .frame(maxWidth: 360).frame(maxWidth: .infinity)
            .padding(.bottom, -TBSpacing.x40)
            HStack(alignment: .bottom, spacing: TBSpacing.x4) {
                radarLegend("이전", reference: true)
                Text("→")
                    .font(TBFont.bold(10)).foregroundStyle(Color.white)
                    .frame(width: 24, height: 24)
                    .background(TBColor.textDisabled)
                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                    .accessibilityHidden(true)
                radarLegend("현재", reference: false)
            }
            if profile.values.isEmpty {
                Text("식사일과 감각별 호감이 확인된 기록을 모아 보여드려요.")
                    .font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                    .padding(.top, TBSpacing.x12)
            }
        }
    }

    private func radarLegend(_ label: String, reference: Bool) -> some View {
        let distribution = selected.map { reference ? $0.previous : $0.current }
        let valueLabel = distribution?.value.map { "\(Int($0.rounded()))%" } ?? "—"
        let summary: String = {
            guard let selected, let distribution else { return "미각을 선택해 주세요" }
            return "\(selected.axis.label), " + (distribution.value.map { "좋아한 비율 \(Int($0.rounded()))%, 평가한 식사 \(distribution.rated)회 중 \(distribution.positive)회" } ?? "미측정")
                + (distribution.mixed > 0 ? ", 평가가 나뉜 식사 \(distribution.mixed)회 제외" : "")
        }()
        return VStack(spacing: 4) {
            Text(label).font(TBFont.regular(10)).foregroundStyle(TBColor.textHint)
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(reference ? TBColor.textHint : TBColor.textSecondary)
                .frame(width: 48, height: 24)
                .overlay {
                    Text(valueLabel).font(TBFont.bold(12)).foregroundStyle(TBColor.textInverse)
                }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityValue(summary)
        .accessibilityIdentifier(reference ? "radar-previous-value" : "radar-current-value")
        .accessibilityHint(reference ? "가장 최근 식사일 이전까지의 기록이에요." : "전체 기간의 직접 호감 평가예요.")
    }
}
