import SwiftUI

// Adapted from feat/gastronomy-data-five-categories-20260915 @ 7f16530.
// One active measurement path; updated for the implementation specification v2.
extension TDCategory {
    var routeKind: HomeArchiveCard.Kind {
        switch self {
        case .experience: return .experience
        case .sensation: return .sensation
        case .preference: return .liking
        case .context: return .condition
        case .change: return .change
        }
    }
    var symbol: String {
        switch self {
        case .experience: return "square.grid.2x2"
        case .sensation: return "waveform"
        case .preference: return "heart"
        case .context: return "slider.horizontal.3"
        case .change: return "chart.xyaxis.line"
        }
    }
}
extension HomeArchiveCard.Kind {
    var dataCategory: TDCategory {
        switch self {
        case .record, .repeated, .experience: return .experience
        case .sensation: return .sensation
        case .liking, .fit, .difference: return .preference
        case .condition: return .context
        case .change: return .change
        }
    }
}
extension HomeDiscoveryCard.Kind {
    var dataCategory: TDCategory {
        switch self {
        case .restaurantCollection, .repeatedMenu, .menuCooccurrence, .foodKindAcrossRestaurants, .newMenuAtKnownRestaurant: return .experience
        case .commonPreference, .repeatedGoodEvaluation, .overallContrast, .familiarTasteInNewMenu, .patternException: return .preference
        case .preferredIntensity, .conditionalContrast: return .context
        case .sensoryCooccurrence: return .sensation
        case .timeGap, .lastYear, .revisitComparison, .periodChange, .fitPeriodChange, .sensoryPeriodChange: return .change
        }
    }
}
enum TDPeriodChoice: String, CaseIterable, Identifiable {
    case all = "전체", month = "이번 달", lastMonth = "지난달", thirty = "최근 30일", ninety = "최근 90일"
    var id: String { rawValue }
    func window(now: Date, calendar: Calendar) -> TDWindow {
        switch self {
        case .all: return .all
        case .thirty: return .recent(30, now: now, calendar: calendar)
        case .ninety: return .recent(90, now: now, calendar: calendar)
        case .lastMonth:
            let current = calendar.dateInterval(of: .month, for: now)?.start ?? calendar.startOfDay(for: now)
            return .init(label: "지난달", start: calendar.date(byAdding: .month, value: -1, to: current), end: current)
        case .month:
            let day = calendar.startOfDay(for: now)
            return .init(label: "이번 달 · 오늘까지", start: calendar.dateInterval(of: .month, for: day)?.start,
                         end: calendar.date(byAdding: .day, value: 1, to: day))
        }
    }
}
struct TDDetailSelection: Identifiable {
    var id = UUID()
    let title: String
    let meaning: String
    let note: String
    let rows: [TDRow]
    var metricID: String? = nil
    var rowID: String? = nil
    var evidence: TDEvidenceBundle = .init()
}
struct TDRenderKey: Equatable {
    let entries: [DiningEntry]
    let analysis: SensoryAnalysisSnapshot
    let owner: String
    let category: TDCategory
    let period: TDWindow
    let day: Date
    let domain: String
    let attribute: String?
    let facet: TDFacet
    let timeZone: String
    var source: TDSourceFilter = .all
    var contextDimension: String = "foodKind"
    var heroDimension: TDDimension? = .menu
}
struct TDPreparedHeader {
    let key: TDRenderKey
    let ring: TDCategoryRingSummary
    let motion: TDCategoryMotionInput
}
struct TDRendered {
    let key: TDRenderKey
    let input: TDNativeInput
    let state: TDState
    let result: TDResult
    let discoveries: [HomeDiscoveryCard]
    let eventCards: [String: TDCard]
    let attributes: [TDIdentity]
    let ring: TDCategoryRingSummary
    let motion: TDCategoryMotionInput
    let summaries: [String: HomePeriodInsightCardData]
    let eventSummaries: [String: HomePeriodInsightCardData]
}

struct HomeArchiveDetailView: View {
    let kind: HomeArchiveCard.Kind
    var bottomContentInset: CGFloat = 0
    var body: some View {
        TasteDataCategoryView(category: kind.dataCategory, bottomContentInset: bottomContentInset, archiveKind: kind)
            .id(kind.dataCategory)
    }
}

struct TasteDataCategoryView: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let category: TDCategory
    var bottomContentInset: CGFloat = 0
    var archiveKind: HomeArchiveCard.Kind? = nil
    @State private var backgroundTintProgress = 0.0
    @State private var period: TDPeriodChoice = .all
    @State private var source: TDSourceFilter = .all
    @State private var domain = "맛"
    @State private var firstDimension: TDDimension = .menu
    @State private var repeatDimension: TDDimension = .menu
    @State private var attribute: String?
    @State private var facet: TDFacet = .liking
    @State private var contextDimension = "foodKind"
    @State private var heroDimension: TDDimension? = .menu
    @State private var referenceDate = Date.now
    @State private var rendered: TDRendered?
    @State private var preparedHeader: TDPreparedHeader?
    @State private var selectedDetail: TasteCardDetailRoute?
    @State private var discoveryLimit = 3
    @State private var readDiscoveryLimit = 30
    @State private var showReadDiscoveries = false

    private var kind: HomeArchiveCard.Kind { archiveKind ?? category.routeKind }
    private var ringReduceMotion: Bool {
        #if DEBUG || targetEnvironment(simulator)
        let arguments = ProcessInfo.processInfo.arguments
        return reduceMotion || (arguments.contains("--gastronomy-qa") && arguments.contains("--gastronomy-reduce-motion"))
        #else
        return reduceMotion
        #endif
    }
    private var effectivePeriod: TDPeriodChoice { category == .change && period == .all ? .ninety : period }
    private var renderKey: TDRenderKey {
        let calendar = Calendar.current
        return .init(entries: appModel.diningEntries, analysis: appModel.sensoryAnalysis,
                     owner: appModel.memoryAccountGeneration.uuidString, category: category,
                     period: effectivePeriod.window(now: referenceDate, calendar: calendar), day: calendar.startOfDay(for: referenceDate),
                     domain: domain, attribute: attribute, facet: facet, timeZone: calendar.timeZone.identifier,
                     source: source, contextDimension: contextDimension, heroDimension: heroDimension)
    }
    private var currentHeader: TDPreparedHeader? { preparedHeader?.key == renderKey ? preparedHeader : nil }
    private var current: TDRendered? { rendered?.key == renderKey ? rendered : nil }
    var body: some View {
        let key = renderKey
        GeometryReader { viewport in
            let ringHeight = min(340, max(1, viewport.size.width - TBSpacing.page * 2))
            let contentWidth = viewport.size.width - TBSpacing.page * 2
            ScrollView {
                // The card set is bounded; a regular stack avoids lazy layout cycles on height changes.
                VStack(alignment: .leading, spacing: TBSpacing.x24) {
                    TDCategoryRingHeader(kind: kind, summary: current?.ring ?? currentHeader?.ring, motion: current?.motion ?? currentHeader?.motion, height: ringHeight,
                                         reduceMotion: ringReduceMotion, tintProgress: $backgroundTintProgress)
                        .accessibilityIdentifier("taste-data-hero-" + category.id)
                    if let current { content(current, width: contentWidth) }
                    else { ProgressView("현재 기록에서 집계하고 있어요").frame(maxWidth: .infinity, minHeight: 120) }
                    if let error = appModel.sensoryAnalysisError {
                        Text(error).tbTextStyle(.caption)
                        Button("분석 다시 시도") { appModel.refreshSensoryAnalysis() }.frame(minHeight: 44)
                    }
                }
                .tbPageContentPadding(bottom: TBSpacing.page + bottomContentInset)
                .frame(minHeight: viewport.size.height + ringHeight + TBSpacing.pageTop, alignment: .top)
            }
        }
        .tbPageBackground(kind.backgroundColor(tintProgress: backgroundTintProgress))
        .preference(key: HomeInsightTintPreferenceKey.self, value: [kind.rawValue: backgroundTintProgress])
        .accessibilityIdentifier("taste-data-" + category.id)
        .task(id: key) { await refresh(key) }
        .onChange(of: effectivePeriod) { _, _ in selectedDetail = nil }
        .onChange(of: source) { _, _ in selectedDetail = nil }
        .onChange(of: domain) { _, _ in attribute = nil }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { referenceDate = .now; appModel.refreshHomeDiscoveriesIfNeeded() }
        }
        .onReceive(NotificationCenter.default.publisher(for: .NSCalendarDayChanged)) { _ in referenceDate = .now }
        .onReceive(NotificationCenter.default.publisher(for: .NSSystemTimeZoneDidChange)) { _ in referenceDate = .now }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in
            rendered = nil; preparedHeader = nil; selectedDetail = nil; attribute = nil
            backgroundTintProgress = 0; discoveryLimit = 3; readDiscoveryLimit = 30; showReadDiscoveries = false
        }
        .tasteDetail($selectedDetail)
    }
    private var periodPicker: some View {
        Picker("측정 기간", selection: Binding(get: { effectivePeriod }, set: { period = $0 })) {
            ForEach(TDPeriodChoice.allCases.filter { category != .change || $0 != .all }) { Text($0.rawValue).tag($0) }
        }.pickerStyle(.menu).font(TBFont.medium(12)).fixedSize(horizontal: false, vertical: true)
            .frame(minHeight: 44).accessibilityIdentifier("taste-data-period")
    }
    @MainActor private func refresh(_ key: TDRenderKey) async {
        let now = referenceDate, calendar = Calendar.current
        let reusable = rendered.flatMap { $0.key.entries == key.entries && $0.key.analysis == key.analysis && $0.key.owner == key.owner && $0.key.day == key.day && $0.key.timeZone == key.timeZone ? $0.input : nil }
        let cached = appModel.homeArchivePresentation.flatMap { presentation in
            presentation.sourceEntries == key.entries && presentation.sourceSnapshot == key.analysis && presentation.referenceDay == key.day && presentation.sourceTimeZone == key.timeZone
                ? presentation.gastronomyInput : nil
        }
        let input = reusable ?? cached
        let worker = Task.detached(priority: .userInitiated) { () -> TDRendered in
            let input = input ?? TDNativeAdapter.inputs(entries: key.entries, snapshot: key.analysis, now: now)
            let state = TDDataEngine.prepare(records: input.records, observations: input.observations, window: key.period,
                                             now: now, calendar: calendar, issues: input.issues, sourceFilter: key.source)
            let result = TDDataEngine.result(state, category: key.category, domain: key.domain, attribute: key.attribute,
                                             facet: key.facet, calendar: calendar, contextDimension: key.contextDimension, heroDimension: key.heroDimension)
            let ring = TDCategoryRingSummary.make(state)
            let motion = TDCategoryMotionInput.make(state: state, result: result, category: key.category, domain: key.domain,
                                                     attribute: key.attribute, facet: key.facet, contextDimension: key.contextDimension,
                                                     heroDimension: key.heroDimension, calendar: calendar)
            // Present validated header data before computing the lower discovery/event cards.
            await MainActor.run {
                guard !Task.isCancelled, key == renderKey else { return }
                preparedHeader = TDPreparedHeader(key: key, ring: ring, motion: motion)
            }
            var eventCards: [String: TDCard] = [:]
            if key.category == .experience {
                for dimension in TDDimension.allCases {
                    eventCards["first/" + dimension.id] = TDDataEngine.eventCard(state, dimension: dimension, first: true, calendar: calendar)
                    eventCards["repeat/" + dimension.id] = TDDataEngine.eventCard(state, dimension: dimension, first: false, calendar: calendar)
                }
            }
            let selectedIDs = TDDataEngine.ids(state.selected)
            let observationGroups = Dictionary(grouping: state.observations.filter {
                selectedIDs.contains($0.entryID) && $0.facet != .overall && (key.category != .sensation || $0.domain == key.domain)
            }, by: \.senseKey)
            let attributes = observationGroups.keys.sorted().map { TDIdentity(id: $0, label: observationGroups[$0]![0].label) }
            let discoveries = HomeDiscoveryEngine.gastronomyCards(input: input, state: state, calendar: calendar).map { candidate in
                var copy = candidate; copy.accountGeneration = UUID(uuidString: key.owner); return copy
            }
            let summaries = Dictionary(uniqueKeysWithValues: result.cards.map { card in
                (card.id, TDArchiveCardPresentation.make(card, category: key.category, attribute: key.attribute,
                                                         timeline: result.hero, dimension: key.heroDimension))
            })
            let eventSummaries = eventCards.mapValues { TDArchiveCardPresentation.make($0, category: .experience) }
            return .init(key: key, input: input, state: state, result: result, discoveries: discoveries,
                         eventCards: eventCards, attributes: attributes, ring: ring, motion: motion,
                         summaries: summaries, eventSummaries: eventSummaries)
        }
        let value = await withTaskCancellationHandler(operation: { await worker.value }, onCancel: { worker.cancel() })
        guard !Task.isCancelled, key == renderKey else { return }
        rendered = value
    }
    @ViewBuilder private func content(_ output: TDRendered, width: CGFloat) -> some View {
        if appModel.diningEntries.isEmpty {
            HomeJournalEmptyState()
        } else {
            VStack(alignment: .leading, spacing: TBSpacing.x12) {
                let layout = dynamicTypeSize.isAccessibilitySize
                    ? AnyLayout(VStackLayout(alignment: .leading, spacing: TBSpacing.x8))
                    : AnyLayout(HStackLayout(alignment: .center, spacing: TBSpacing.x12))
                layout {
                    Text("측정 데이터").tbTextStyle(.sectionTitle).frame(maxWidth: .infinity, alignment: .leading)
                    periodPicker
                }
                if category != .experience {
                    TasteDetailScope(text: "선택 응답 기준")
                        .accessibilityLabel(TDNativeAdapter.sensoryEvidenceScopeDescription)
                        .accessibilityIdentifier("taste-data-evidence-scope")
                }
                ForEach(output.result.cards.filter { $0.id != "first" && $0.id != "repeat" }) { card in
                    if let summary = output.summaries[card.id] {
                        TDArchiveMeasurementCard(card: card, data: summary, onOpen: { open(card) })
                            .accessibilityIdentifier("taste-data-card-" + card.id)
                    }
                }
                if category == .experience {
                    eventView(output, first: true, dimension: $firstDimension)
                    eventView(output, first: false, dimension: $repeatDimension)
                }
            }
            discoveries(output, width: width)
        }
    }
    @ViewBuilder private func controls(_ output: TDRendered) -> some View {
        if appModel.diningEntries.contains(where: { $0.foodSource != nil }) {
            Picker("음식 출처", selection: $source) { ForEach(TDSourceFilter.allCases) { Text($0.rawValue).tag($0) } }
                .pickerStyle(.menu).frame(minHeight: 44).accessibilityIdentifier("taste-data-source")
        }
        if category == .sensation {
            Picker("감각 영역", selection: $domain) { ForEach(["맛", "향", "식감", "기타"], id: \.self) { Text($0).tag($0) } }
                .pickerStyle(.menu).accessibilityIdentifier("taste-data-sensory-domain")
        }
        if [.sensation, .preference, .context, .change].contains(category) {
            Picker("감각 선택", selection: $attribute) {
                Text("전체 또는 대표 감각").tag(nil as String?)
                ForEach(output.attributes, id: \.id) { Text($0.label).tag(Optional($0.id)) }
            }.pickerStyle(.menu).accessibilityIdentifier("taste-data-attribute")
        }
        if category == .context || category == .preference {
            Picker("반응의 종류", selection: $facet) {
                if category == .preference { Text("음식 전체").tag(TDFacet.overall) }
                Text("감각 호감").tag(TDFacet.liking)
                Text("알맞음").tag(TDFacet.fit)
            }.pickerStyle(.menu).accessibilityIdentifier("taste-data-facet")
        }
        if category == .change {
            Picker("경험 지표", selection: $heroDimension) {
                Text("식사").tag(nil as TDDimension?)
                ForEach(TDDimension.allCases) { Text($0.rawValue).tag(Optional($0)) }
            }.pickerStyle(.menu)
            Text("이전 " + output.state.window.previous(calendar: .current).range(calendar: .current) + " ↔ 최근 " + output.state.window.range(calendar: .current)).tbTextStyle(.caption)
        }
    }
    private func eventView(_ output: TDRendered, first: Bool, dimension: Binding<TDDimension>) -> some View {
        let key = (first ? "first/" : "repeat/") + dimension.wrappedValue.id
        let card = output.eventCards[key] ?? TDCard(id: key, title: "경험", meaning: "자료 없음", rows: [])
        let data = output.eventSummaries[key] ?? TDArchiveCardPresentation.make(card, category: .experience)
        let picker = Picker("경험의 단위", selection: dimension) {
            ForEach(TDDimension.allCases) { Text($0.rawValue).tag($0) }
        }
        let controls = dynamicTypeSize.isAccessibilitySize ? AnyView(picker.pickerStyle(.menu)) : AnyView(picker.pickerStyle(.segmented))
        return TDArchiveMeasurementCard(card: card, data: data, onOpen: { open(card, metricID: key) }, controls: controls)
            .accessibilityIdentifier(first ? "taste-data-first" : "taste-data-repeat")
    }
    @ViewBuilder private func discoveries(_ output: TDRendered, width: CGFloat) -> some View {
        let unread = HomeDiscoveryPresentationPolicy.categoryCards(output.discoveries, category: category,
                                                                   hiddenUntil: appModel.homeDiscoveryHiddenUntil, referenceDate: referenceDate, read: false)
        let read = HomeDiscoveryPresentationPolicy.categoryCards(output.discoveries, category: category,
                                                                 hiddenUntil: appModel.homeDiscoveryHiddenUntil, referenceDate: referenceDate, read: true)
        Text("발견").tbTextStyle(.sectionTitle)
        if unread.isEmpty {
            CardScrollList(spacing: TBSpacing.x12, fullBleed: false, snapsToCards: true, trailingContentPadding: TBSpacing.page) {
                ForEach(HomeDiscoveryCard.Kind.allCases.filter {
                    $0.dataCategory == category && $0 != .repeatedMenu
                }, id: \.rawValue) { kind in
                    TDDiscoveryEmptyCard(category: category, kind: kind)
                        .frame(width: max(240, min(360, width - 32)))
                }
            }
            .scrollClipDisabled()
            .padding(.trailing, -TBSpacing.page)
        } else {
            discoveryGroups(Array(unread.prefix(discoveryLimit)), state: output.state, width: width, isRead: false)
        }
        if unread.count > discoveryLimit {
            Button("발견 더 보기 · \(min(discoveryLimit, unread.count))/\(unread.count)개") { discoveryLimit += 30 }.frame(minHeight: 44)
        }
        if discoveryLimit > 3 { Button("발견 접기") { discoveryLimit = 3 }.frame(minHeight: 44) }
        if !read.isEmpty {
            DisclosureGroup("확인한 발견 \(read.count)개", isExpanded: $showReadDiscoveries) {
                discoveryGroups(Array(read.prefix(readDiscoveryLimit)), state: output.state, width: width, isRead: true)
                if read.count > readDiscoveryLimit { Button("확인한 발견 더 보기") { readDiscoveryLimit += 30 }.frame(minHeight: 44) }
            }.accessibilityIdentifier("taste-data-read-discoveries")
        }
    }
    @ViewBuilder private func discoveryGroups(_ cards: [HomeDiscoveryCard], state: TDState, width: CGFloat, isRead: Bool) -> some View {
        let titles = ["현재 범위에서 발견", "전체 기록에서 발견", "별도 비교 기간에서 발견"]
        ForEach(titles, id: \.self) { title in
            let members = cards.filter { discoveryGroup($0, state: state) == title }
            if !members.isEmpty {
                if title != "현재 범위에서 발견" { Text(title).tbTextStyle(.subsectionTitle) }
                TDDiscoveryCardList(cards: members, category: category, width: width,
                                    onOpen: { card in
                                        selectedDetail = .category(detailRequest(title: card.kind.label, target: .discovery(id: card.id)))
                                    }, onSnooze: { appModel.suppressGastronomyDiscovery($0) })
                    .accessibilityIdentifier("taste-data-discovery-list-" + category.id + (isRead ? "-read-" : "-new-") + title)
            }
        }
    }
    private func discoveryGroup(_ card: HomeDiscoveryCard, state: TDState) -> String {
        if (card.evidenceBundle?.sourceFilter ?? .all) != state.sourceFilter { return "전체 기록에서 발견" }
        switch card.dataScope {
        case .wholeArchive: return state.window.isAll && state.sourceFilter == .all ? "현재 범위에서 발견" : "전체 기록에서 발견"
        case .selectedPeriod: return "현재 범위에서 발견"
        case .comparison(_, let after):
            return category == .change && after == state.window ? "현재 범위에서 발견" : "별도 비교 기간에서 발견"
        }
    }
    private func open(_ card: TDCard, row: TDRow? = nil, metricID: String? = nil) {
        selectedDetail = .category(detailRequest(title: row?.title ?? card.title,
                                                 target: .metric(id: metricID ?? card.id, rowID: row?.id)))
    }
    private func openRecords(_ state: TDState, unknown: Bool) {
        selectedDetail = .category(detailRequest(title: unknown ? "식사일 미확인 기록" : "관련 원본 기록",
                                                 target: .metric(id: unknown ? "unknown-records" : "all-records", rowID: nil)))
    }
    private func detailRequest(title: String, target: TDCardDetailRequest.Target) -> TDCardDetailRequest {
        .init(title: title, category: category,
              window: effectivePeriod.window(now: referenceDate, calendar: .current),
              source: source, domain: domain, attribute: attribute, facet: facet,
              contextDimension: contextDimension, heroDimension: heroDimension,
              referenceDate: referenceDate, timeZoneID: Calendar.current.timeZone.identifier, target: target)
    }
}
