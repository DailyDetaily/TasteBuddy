import Foundation
import SwiftUI


/// Five fixed data entry points. The existing read/snooze-aware question/discovery stack is preserved.
struct HomeSensorySummarySection: View {
    @EnvironmentObject private var appModel: AppModel
    let snapshot: SensoryAnalysisSnapshot
    let isUpdating: Bool
    let error: String?
    var onOpenAnalysis: (() -> Void)?
    var onOpenQuestions: (() -> Void)?
    var onStartNewDining: ((PersonalTasteNextSelection) -> Void)?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    var onOpenInsight: ((HomeArchiveCard.Kind) -> Void)? = nil
    @State private var selectedDiscoveryID: String?
    @State private var showsAllStackCards = false
    @State private var isQuestionStackExpanded: Bool = {
        #if DEBUG || targetEnvironment(simulator)
        let arguments = ProcessInfo.processInfo.arguments
        return arguments.contains("--sensory-insights-home-qa") && arguments.contains("--question-queue-expanded-qa")
        #else
        return false
        #endif
    }()
    var body: some View {
        let pendingCards = appModel.homeJournalStackItems
        let stackCards = HomeJournalStackItem.preview(pendingCards, limit: isQuestionStackExpanded ? 3 : 1)
        TBPageSection(title: "미식 데이터", titleSize: .medium) {
            CardScrollList(spacing: TBSpacing.x12) {
                ForEach(TDCategory.allCases) { category in
                    HomeSummaryCard(label: category.rawValue, value: category.subtitle,
                                    detail: "측정과 발견 보기", axis: category.routeKind.axis,
                                    symbol: category.symbol,
                                    onTap: onOpenInsight.map { open in { open(category.routeKind) } })
                }
            }
            if isUpdating {
                SensoryAnalysisStatusCard(state: .processing)
            } else if let error {
                SensoryAnalysisStatusCard(state: .failed(error))
            } else if !pendingCards.isEmpty {
                VStack(spacing: TBSpacing.x12) {
                    ForEach(Array(stackCards.enumerated()), id: \.element.id) { index, item in
                        stackCard(item, index: index, total: pendingCards.count)
                            .transition(TasteBloomMotion.questionReveal(reduceMotion: reduceMotion, index: max(0, index - 1)))
                    }
                    if isQuestionStackExpanded && pendingCards.count > stackCards.count {
                        Button("카드 전체보기 · \(pendingCards.count)개") { showsAllStackCards = true }
                            .font(TBFont.regular(12)).foregroundStyle(TBColor.textAction)
                            .frame(maxWidth: .infinity, minHeight: 44).buttonStyle(.plain)
                            .accessibilityIdentifier("taste-questions-see-all")
                    }
                }.accessibilityIdentifier("home-taste-questions")
            }
        }
        .tasteBloomMotion(.content, value: isUpdating)
        .tasteBloomMotion(.content, value: pendingCards.map(\.id))
        .sheet(isPresented: Binding(get: { selectedDiscoveryID != nil }, set: { if !$0 { selectedDiscoveryID = nil } })) {
            if let selectedDiscoveryID { HomeDiscoveryDetailView(discoveryID: selectedDiscoveryID) }
        }
        .sheet(isPresented: $showsAllStackCards) { HomeJournalStackListView(onStartNewRecord: onStartNewDining) }
        .task { appModel.refreshHomeDiscoveriesIfNeeded() }
        .onChange(of: scenePhase) { _, phase in if phase == .active { appModel.refreshHomeDiscoveriesIfNeeded() } }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in
            selectedDiscoveryID = nil; showsAllStackCards = false; isQuestionStackExpanded = false
        }
    }
    @ViewBuilder private func stackCard(_ item: HomeJournalStackItem, index: Int, total: Int) -> some View {
        let toggle: (() -> Void)? = index == 0 && total > 1 ? {
            withAnimation(TasteBloomMotion.animation(isQuestionStackExpanded ? .content : .sheet, reduceMotion: reduceMotion)) {
                isQuestionStackExpanded.toggle()
            }
        } : nil
        switch item {
        case .question(let question):
            PersonalTasteNextQuestionCard(selection: question,
                sourceSelectionLabel: snapshot.observations.first { $0.id == question.responseSourceID }?.selectionEvidence?.labelSnapshot,
                showsStack: !isQuestionStackExpanded && total > 1, isStackExpanded: isQuestionStackExpanded,
                onToggleStack: toggle, onStartNewRecord: { onStartNewDining?(question) }, stackAccessibilityLabel: "질문과 발견 카드")
        case .discovery(let card):
            HomeDiscoveryStackCard(card: card, showsStack: !isQuestionStackExpanded && total > 1,
                isStackExpanded: isQuestionStackExpanded, onToggleStack: toggle, onOpen: { selectedDiscoveryID = card.id })
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
        var result: [Group] = [], indices: [String: Int] = [:]
        for question in questions {
            let entry = PersonalTasteInlineAnswer.sourceEntry(for: question, observations: observations, entries: entries)
            let key = entry.map { entry in
                if let id = entry.menuItemID, !id.isEmpty { return HomeArchiveIdentity.restaurant(entry) + "menu:\(id)" }
                let names = [entry.restaurant, entry.menu].map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
                return "meal:" + names.joined(separator: "\u{001F}")
            } ?? "question:\(question.id)"
            if let index = indices[key] { result[index].questions.append(question) }
            else { indices[key] = result.count; result.append(.init(id: key, entry: entry, questions: [question])) }
        }
        return result
    }
}

struct PersonalTasteQuestionsView: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var pendingQuestion: PersonalTasteQuestionResponseContext?
    @StateObject private var errorToast = TBToastPresenter()
    var body: some View {
        BottomSheetShell(headerStart: AnyView(BottomSheetCloseButton { dismiss() }),
                         headerCenter: AnyView(Text("질문 전체보기").tbTextStyle(.sheetTitle)),
                         stageMode: .auto(maxHeightRatio: 1), usesNativeSheetChrome: true, surfaceBackground: TBColor.page) {
            BottomSheetScrollView {
                LazyVStack(alignment: .leading, spacing: TBSpacing.section) {
                    if appModel.sensoryAnalysisIsUpdating { SensoryAnalysisStatusCard(state: .processing) }
                    else if let error = appModel.sensoryAnalysisError { SensoryAnalysisStatusCard(state: .failed(error)) }
                    else if groups.isEmpty {
                        SectionCard(showsBorder: false) {
                            Text("지금 확인할 질문이 없어요").font(TBFont.regular(14)).foregroundStyle(TBColor.textHint)
                        }
                    } else {
                        ForEach(groups) { group in
                            VStack(alignment: .leading, spacing: TBSpacing.x12) {
                                ForEach(group.questions) { question in
                                    PersonalTasteNextQuestionCard(selection: question,
                                        sourceSelectionLabel: appModel.sensoryAnalysis.observations.first { $0.id == question.responseSourceID }?.selectionEvidence?.labelSnapshot,
                                        onStartNewRecord: { pendingQuestion = appModel.personalTasteQuestionResponseContext(for: question) })
                                }
                            }
                        }
                    }
                }.tbPageContentPadding()
            }
        }
        .presentationDetents([.large]).presentationDragIndicator(.hidden)
        .presentationCornerRadius(BottomSheetShellMetrics.topRadius)
        .fullScreenCover(item: $pendingQuestion) { context in
            if context.selection.intent != "exploration", let id = context.sourceEntryID, let entry = appModel.diningEntry(id: id) {
                DiningFeedbackSheet(entry: entry, startMode: .details) { save($0, context: context) }
            } else if context.selection.intent == "exploration" {
                DiningFeedbackSheet(startMode: .menu) { save($0, context: context) }
            } else {
                Color.clear.onAppear { pendingQuestion = nil; appModel.refreshSensoryAnalysis(); errorToast.present(policy: .copyConfirmation) }
            }
        }
        .overlay(alignment: .bottom) {
            if errorToast.isPresented {
                ToastSurface(title: "연결된 기록이 없어 저장하지 못했어요", icon: .info, tone: .warning).padding(TBSpacing.page)
            }
        }
        .modifier(PersonalTasteAnswerToast(bottomPadding: TBSpacing.x12))
        .onDisappear { errorToast.cancel() }
    }
    private var userID: String { appModel.sensoryAnalysis.personalModel?.userID ?? "local-owner" }
    private var groups: [PersonalTasteQuestionList.Group] {
        let questions = PersonalTasteInlineAnswer.answerableQuestions(
            appModel.sensoryAnalysis.personalModel?.availableSelections ?? [], observations: appModel.sensoryAnalysis.observations, entries: appModel.diningEntries
        ).filter { appModel.shouldPresentPersonalTasteQuestion(id: $0.id, userID: userID) }
        return PersonalTasteQuestionList.groups(questions: questions, observations: appModel.sensoryAnalysis.observations, entries: appModel.diningEntries)
    }
    private func save(_ entry: DiningEntry, context: PersonalTasteQuestionResponseContext) {
        if case .sourceUnavailable = appModel.savePersonalTasteQuestionResponse(entry, context: context) { errorToast.present(policy: .copyConfirmation) }
    }
}

extension HomeArchiveCard.Kind {
    func backgroundColor(tintProgress: Double) -> Color {
        var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
        var tintRed: CGFloat = 0, tintGreen: CGFloat = 0, tintBlue: CGFloat = 0
        guard UIColor(TBColor.page).getRed(&red, green: &green, blue: &blue, alpha: &alpha),
              UIColor(axis.tintSurfaceColor).getRed(&tintRed, green: &tintGreen, blue: &tintBlue, alpha: &alpha) else { return TBColor.page }
        let progress = min(1, max(0, tintProgress))
        return Color(red: red + (tintRed-red)*progress, green: green + (tintGreen-green)*progress, blue: blue + (tintBlue-blue)*progress)
    }
    var axis: TasteAxis {
        switch self {
        case .record: return .umami
        case .repeated, .liking: return .sweet
        case .experience: return .fat
        case .sensation, .condition: return .sour
        case .fit: return .salty
        case .difference, .change: return .bitter
        }
    }
    var symbol: String {
        switch self {
        case .record: return "calendar.badge.checkmark.fill"
        case .repeated: return "fork.knife.fill"
        case .experience: return "globe.fill"
        case .liking: return "heart.fill"
        case .sensation: return "sparkles.fill"
        case .fit: return "checkmark.circle.fill"
        case .condition: return "slider.horizontal.3"
        case .difference: return "arrow.left.arrow.right"
        case .change: return "arrow.up.right.fill"
        }
    }
}
struct HomeInsightTintPreferenceKey: PreferenceKey {
    static var defaultValue: [String: Double] = [:]
    static func reduce(value: inout [String: Double], nextValue: () -> [String: Double]) {
        value.merge(nextValue(), uniquingKeysWith: { _, next in next })
    }
}
struct HomeSummaryCard: View {
    let label: String
    let value: String
    let detail: String
    let axis: TasteAxis
    let symbol: String
    var onTap: (() -> Void)? = nil
    var body: some View {
        RecommendationMiniCardLayout(axis: axis, title: label, subtitle: value, detail: detail,
            detailFont: TBFont.regular(10), subtitleFont: TBFont.semibold(14), onTap: onTap) {
                LucideIcon(systemName: symbol, size: TBIcon.Size.small, strokeWidth: TBIcon.Stroke.medium, filled: true)
                    .frame(width: RecommendationMiniCardMetrics.avatarSize, height: RecommendationMiniCardMetrics.avatarSize)
                    .foregroundStyle(axis.mainColor).background(TBColor.surface).clipShape(Circle())
            }
    }
}
/// Compatibility for older previews/call sites; the live home uses TDCategory.
struct HomeSummaryRail: View {
    let metrics: [HomeSummaryMetric]
    var onSelect: ((HomeSummaryMetricKind) -> Void)? = nil
    var body: some View {
        TBPageSection(title: "미식 요약", titleSize: .medium) {
            CardScrollList(spacing: TBSpacing.x12) {
                ForEach(metrics) { metric in
                    HomeSummaryCard(label: metric.label, value: metric.value, detail: metric.detail,
                                    axis: .umami, symbol: "chart.bar", onTap: onSelect.map { select in { select(metric.kind) } })
                }
            }
        }
    }
}
#if canImport(PreviewsMacros)
#Preview("미식 데이터 · 경험") {
    TasteDataCategoryView(category: .experience)
        .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: [.sample]))
}
#Preview("미식 데이터 · 감각") {
    TasteDataCategoryView(category: .sensation)
        .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: []))
}
#Preview("미식 데이터 · 취향") {
    TasteDataCategoryView(category: .preference)
        .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: []))
}
#Preview("미식 데이터 · 맥락") {
    TasteDataCategoryView(category: .context)
        .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: []))
}
#Preview("미식 데이터 · 변화") {
    TasteDataCategoryView(category: .change)
        .environmentObject(AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: []))
}
#endif



// TASTE_DATA_CORE_BEGIN
// Pure value layer. Counts describe the retained archive, never all meals or inferred preferences.
enum TDCategory: String, CaseIterable, Identifiable, Sendable {
    case experience = "경험", sensation = "감각", preference = "취향", context = "맥락", change = "변화"
    var id: String { rawValue }
    var subtitle: String {
        switch self {
        case .experience: return "식사·메뉴·식당·음식 종류"
        case .sensation: return "느낀 맛·향·식감과 강도"
        case .preference: return "음식 전체·감각 호감·알맞음"
        case .context: return "조건에 따라 남긴 반응"
        case .change: return "기간별 경험·감각·평가"
        }
    }
}
enum TDDimension: String, CaseIterable, Identifiable, Sendable {
    case menu = "메뉴", restaurant = "식당", foodKind = "음식 종류"
    var id: String { rawValue }
    var unit: String { self == .restaurant ? "곳" : self == .foodKind ? "가지" : "개" }
}
struct TDIdentity: Equatable, Hashable, Sendable {
    let id: String
    let label: String
}
struct TDRecord: Equatable, Sendable {
    let id: String
    let mealID: String
    let date: Date?
    let menu: TDIdentity?
    let restaurant: TDIdentity?
    let foodKinds: [TDIdentity]
    func identities(_ dimension: TDDimension) -> [TDIdentity] {
        switch dimension {
        case .menu: return menu.map { [$0] } ?? []
        case .restaurant: return restaurant.map { [$0] } ?? []
        case .foodKind: return foodKinds
        }
    }
}
enum TDFacet: String, CaseIterable, Sendable {
    case presence, intensity, liking, fit, overall
    var title: String {
        switch self {
        case .presence: return "감각 기록"
        case .intensity: return "느낀 강도"
        case .liking: return "감각별 호감"
        case .fit: return "강도의 알맞음"
        case .overall: return "음식 전체 평가"
        }
    }
    var values: [String] {
        switch self {
        case .presence: return ["present"]
        case .intensity: return ["weak", "medium", "strong"]
        case .liking: return ["negative", "neutral", "positive"]
        case .fit: return ["below_preferred", "just_right", "above_preferred"]
        case .overall: return ["very_negative", "negative", "neutral", "positive", "very_positive"]
        }
    }
    func label(_ value: String) -> String {
        if value == "mixed" { return self == .intensity ? "여러 강도" : "응답 나뉨" }
        if value == "missing" { return "미응답" }
        let labels = ["present":"기록함", "weak":"약함", "medium":"중간", "strong":"강함",
                      "negative":"아쉬움", "neutral":"보통", "positive":"좋음",
                      "below_preferred":"부족", "just_right":"알맞음", "above_preferred":"과함",
                      "very_negative":"많이 아쉬움", "very_positive":"매우 좋음"]
        return labels[value] ?? "해석 미확인"
    }
}
struct TDObservation: Equatable, Sendable {
    let id: String
    let entryID: String
    let facet: TDFacet
    let attribute: String
    let label: String
    let value: String
    let target: String
    let phase: String
    // Same direct selection only; never join intensity to another response by meal alone.
    let selection: String
    var domain: String {
        if attribute.hasPrefix("taste.") { return "맛" }
        if attribute.hasPrefix("aroma.") { return "향" }
        return "식감"
    }
}
struct TDWindow: Equatable, Sendable {
    let label: String
    let start: Date?
    let end: Date? // half-open [start, end)
    static let all = Self(label: "전체 기간", start: nil, end: nil)
    var isAll: Bool { start == nil && end == nil }
    func contains(_ date: Date?) -> Bool {
        guard let date else { return isAll }
        return (start == nil || date >= start!) && (end == nil || date < end!)
    }
    static func recent(_ days: Int, now: Date, calendar: Calendar) -> Self {
        let day = calendar.startOfDay(for: now)
        return .init(label: "최근 \(days)일", start: calendar.date(byAdding: .day, value: 1-days, to: day),
                     end: calendar.date(byAdding: .day, value: 1, to: day))
    }
    func previous(calendar: Calendar) -> Self {
        guard let start, let end else { return self }
        let days = calendar.dateComponents([.day], from: start, to: end).day ?? 0
        return .init(label: "직전 \(days)일", start: calendar.date(byAdding: .day, value: -days, to: start), end: start)
    }
    func range(calendar: Calendar) -> String {
        guard let start, let end else { return label }
        let formatter = DateFormatter()
        formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
        formatter.locale = Locale(identifier: "ko_KR"); formatter.dateFormat = "yyyy.M.d"
        let last = calendar.date(byAdding: .day, value: -1, to: end) ?? end
        return formatter.string(from: start) + "–" + formatter.string(from: last)
    }
}
struct TDSegment: Equatable, Sendable {
    let key: String
    let label: String
    let count: Int
}
struct TDRow: Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    var value: String
    var detail: String = ""
    var amount: Double? = nil
    var segments: [TDSegment] = []
    var entryIDs: Set<String> = []
}
struct TDCard: Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let meaning: String
    var rows: [TDRow]
    var note: String = ""
    var isDiscovery = false
    var entryIDs: Set<String> { Set(rows.flatMap(\.entryIDs)) }
}
struct TDEvent: Equatable, Sendable {
    let identity: TDIdentity
    let entryIDs: Set<String>
    let periodEntries: Set<String>
    let meals: Int
    let firstDate: Date?
    let isFirst: Bool
    let repeats: Int
    let uncertain: Bool
}
struct TDState: Equatable, Sendable {
    let records: [TDRecord]
    let observations: [TDObservation]
    let selected: [TDRecord]
    let window: TDWindow
    let now: Date
    let unknownDateIDs: Set<String>
    let futureIDs: Set<String>
    let conflictingIDs: Set<String>
    func records(in window: TDWindow) -> [TDRecord] { records.filter { window.contains($0.date) } }
}
struct TDResult: Equatable, Sendable {
    let hero: [TDRow]
    let cards: [TDCard]
    let discoveries: [TDCard]
}

enum TDDataEngine {
    static let version = "gastronomy-data/1"
    static func key(_ values: [String]) -> String { values.map { "\($0.utf8.count):\($0)" }.joined() }
    static func ids(_ records: [TDRecord]) -> Set<String> { Set(records.map(\.id)) }
    static func meals(_ records: [TDRecord]) -> Int { Set(records.map(\.mealID)).count }
    static func prepare(records: [TDRecord], observations: [TDObservation], window: TDWindow,
                        now: Date, calendar: Calendar) -> TDState {
        var conflicts = Set<String>()
        let grouped = Dictionary(grouping: records, by: \.id)
        let unique = grouped.keys.sorted().compactMap { id -> TDRecord? in
            guard let rows = grouped[id], let first = rows.first, !id.isEmpty, !first.mealID.isEmpty,
                  rows.allSatisfy({ $0 == first }) else { conflicts.insert(id); return nil }
            return first
        }
        var unknown = Set<String>(), future = Set<String>(), valid: [TDRecord] = []
        let today = calendar.startOfDay(for: now)
        let groupedMeals = Dictionary(grouping: unique, by: \.mealID)
        for meal in groupedMeals.keys.sorted() {
            let rows = groupedMeals[meal]!
            if rows.contains(where: { $0.date.map { calendar.startOfDay(for: $0) > today } ?? false }) {
                future.formUnion(ids(rows)); continue
            }
            let dates = Set(rows.compactMap(\.date).map { calendar.startOfDay(for: $0) })
            let date = rows.allSatisfy({ $0.date != nil }) && dates.count == 1 ? dates.first : nil
            if date == nil { unknown.formUnion(ids(rows)) }
            valid += rows.map { .init(id: $0.id, mealID: $0.mealID, date: date,
                                      menu: $0.menu, restaurant: $0.restaurant, foodKinds: $0.foodKinds) }
        }
        let validIDs = ids(valid)
        let obsGroups = Dictionary(grouping: observations, by: \.id)
        let obs = obsGroups.keys.sorted().compactMap { id -> TDObservation? in
            guard let rows = obsGroups[id], let first = rows.first, !id.isEmpty,
                  rows.allSatisfy({ $0 == first }), validIDs.contains(first.entryID),
                  first.facet.values.contains(first.value) else { return nil }
            return first
        }
        return .init(records: valid, observations: obs, selected: valid.filter { window.contains($0.date) },
                     window: window, now: now, unknownDateIDs: unknown, futureIDs: future, conflictingIDs: conflicts)
    }
    static func entityGroups(_ records: [TDRecord], _ dimension: TDDimension) -> [(TDIdentity, [TDRecord])] {
        var values: [String: TDIdentity] = [:], groups: [String: [TDRecord]] = [:]
        for row in records {
            var seen = Set<String>()
            for identity in row.identities(dimension) where !identity.id.isEmpty && seen.insert(identity.id).inserted {
                if values[identity.id] == nil || identity.label < values[identity.id]!.label { values[identity.id] = identity }
                groups[identity.id, default: []].append(row)
            }
        }
        return groups.keys.sorted().map { (values[$0]!, groups[$0]!) }
    }
    static func events(_ state: TDState, dimension: TDDimension) -> [TDEvent] {
        entityGroups(state.records, dimension).compactMap { identity, rows in
            let selected = rows.filter { state.window.contains($0.date) }
            guard !selected.isEmpty else { return nil }
            let mealRows = Dictionary(grouping: rows, by: \.mealID)
            let dates = mealRows.values.compactMap { $0.first?.date }.sorted()
            let uncertain = rows.contains { $0.date == nil }
            let first = dates.first
            var repeats = 0
            if state.window.isAll { repeats = max(0, mealRows.count - 1) }
            else if let first {
                repeats = dates.filter { $0 > first && state.window.contains($0) }.count
                if state.window.contains(first) { repeats += max(0, dates.filter { $0 == first }.count - 1) }
            }
            return .init(identity: identity, entryIDs: ids(rows), periodEntries: ids(selected), meals: meals(selected),
                         firstDate: uncertain ? nil : first, isFirst: !uncertain && first != nil && state.window.contains(first),
                         repeats: repeats, uncertain: uncertain)
        }
    }
    static func eventCard(_ state: TDState, dimension: TDDimension, first: Bool, calendar: Calendar) -> TDCard {
        let all = events(state, dimension: dimension)
        let values = all.filter { first ? $0.isFirst : $0.repeats > 0 }.sorted {
            if first, $0.firstDate != $1.firstDate { return ($0.firstDate ?? .distantPast) > ($1.firstDate ?? .distantPast) }
            if !first, $0.repeats != $1.repeats { return $0.repeats > $1.repeats }
            return $0.identity.id < $1.identity.id
        }
        let formatter = DateFormatter(); formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
        formatter.locale = Locale(identifier: "ko_KR"); formatter.dateFormat = "yyyy.M.d"
        let rows = values.map { event in
            TDRow(id: event.identity.id, title: event.identity.label,
                  value: first ? event.firstDate.map { formatter.string(from: $0) } ?? "식사일 미확인" : "다시 \(event.repeats)번",
                  detail: "기간 식사 \(event.meals)번 · 상세에는 전체 연결 기록 포함" + (event.uncertain ? " · 확인된 반복의 최소 횟수" : ""),
                  amount: first ? nil : Double(event.repeats), entryIDs: event.entryIDs)
        }
        let uncertain = all.filter(\.uncertain).count
        return .init(id: first ? "first" : "repeat", title: first ? "처음 기록한 경험" : "다시 기록한 경험",
                     meaning: "확인된 \(dimension.rawValue) \(rows.count)\(dimension.unit)", rows: rows,
                     note: (first ? "전체 아카이브의 확인 가능한 첫 식사일 기준. 처음 먹었다는 뜻은 아니에요." : "다른 식사만 반복으로 세어요. 같은 기간의 처음·다시에 모두 들어갈 수 있어요.")
                        + " 식사 순서 미확인 \(uncertain)항목. 미연결 기록은 첫 경험 판정을 보장하지 않아요.")
    }
    static func vote(_ observations: [TDObservation], records: [TDRecord], facet: TDFacet,
                     includeMissing: Set<String> = []) -> [TDSegment] {
        let recordMap = Dictionary(uniqueKeysWithValues: records.map { ($0.id, $0) })
        let eligible = observations.filter { $0.facet == facet && recordMap[$0.entryID] != nil }
        let grouped = Dictionary(grouping: eligible) { facet == .overall ? $0.entryID : recordMap[$0.entryID]!.mealID }
        var counts: [String: Int] = [:]
        for rows in grouped.values {
            let values = Set(rows.map(\.value))
            counts[values.count == 1 ? values.first! : "mixed", default: 0] += 1
        }
        counts["missing"] = includeMissing.subtracting(Set(grouped.keys)).count
        return (facet.values + ["mixed", "missing"]).map { .init(key: $0, label: facet.label($0), count: counts[$0] ?? 0) }
    }
    static func summary(_ segments: [TDSegment]) -> String {
        let present = segments.filter { $0.count > 0 }
        return present.isEmpty ? "응답 자료 없음" : present.map { "\($0.label) \($0.count)" }.joined(separator: " · ")
    }
    static func distributionRows(_ state: TDState, facet: TDFacet, domain: String? = nil) -> [TDRow] {
        let selectedIDs = ids(state.selected)
        let obs = state.observations.filter { selectedIDs.contains($0.entryID) && (domain == nil || $0.domain == domain) }
        let groups = Dictionary(grouping: obs.filter { $0.facet == facet || (facet == .intensity && $0.facet == .presence) }, by: \.attribute)
        return groups.keys.sorted().map { attribute in
            let rows = groups[attribute]!
            let recordMap = Dictionary(uniqueKeysWithValues: state.selected.map { ($0.id, $0.mealID) })
            let base = Set(rows.compactMap { recordMap[$0.entryID] })
            let segments = vote(rows, records: state.selected, facet: facet, includeMissing: facet == .intensity ? base : [])
            let n = segments.filter { $0.key != "missing" }.reduce(0) { $0 + $1.count }
            return .init(id: attribute, title: rows.map(\.label).sorted().first ?? attribute,
                         value: "\(n)번의 식사에서 응답", detail: summary(segments), amount: Double(n),
                         segments: segments, entryIDs: Set(rows.map(\.entryID)))
        }.sorted { ($0.amount ?? 0) == ($1.amount ?? 0) ? $0.id < $1.id : ($0.amount ?? 0) > ($1.amount ?? 0) }
    }
    static func presenceRows(_ state: TDState, domain: String? = nil) -> [TDRow] {
        let selectedIDs = ids(state.selected)
        let recordMap = Dictionary(uniqueKeysWithValues: state.selected.map { ($0.id, $0.mealID) })
        let obs = state.observations.filter { selectedIDs.contains($0.entryID) && $0.facet == .presence && (domain == nil || $0.domain == domain) }
        let base = Set(obs.compactMap { recordMap[$0.entryID] }).count
        return Dictionary(grouping: obs, by: \.attribute).map { attribute, rows in
            let n = Set(rows.compactMap { recordMap[$0.entryID] }).count
            return TDRow(id: attribute, title: rows.map(\.label).sorted().first ?? attribute,
                         value: "\(n)/\(base)번의 식사", detail: "감각 존재를 기록한 식사 기준 · 중복 선택 가능",
                         amount: Double(n), entryIDs: Set(rows.map(\.entryID)))
        }.sorted { $0.amount == $1.amount ? $0.id < $1.id : ($0.amount ?? 0) > ($1.amount ?? 0) }
    }
    static func experience(_ state: TDState) -> TDResult {
        var cards = [TDCard(id: "meals", title: "기록한 식사", meaning: "서로 다른 식사 식별자 기준",
                            rows: [.init(id: "meals", title: "식사", value: "\(meals(state.selected))번", detail: "요리 기록 \(state.selected.count)개", entryIDs: ids(state.selected))],
                            note: "평가가 없는 저장 기록도 포함. 같은 식사의 여러 요리·수정은 식사 횟수를 늘리지 않아요.")]
        for dimension in TDDimension.allCases {
            let groups = entityGroups(state.selected, dimension)
            let missing = state.selected.filter { $0.identities(dimension).isEmpty }.count
            let rows = groups.map { identity, entries in
                TDRow(id: identity.id, title: identity.label, value: "\(meals(entries))번의 식사",
                      amount: Double(meals(entries)), entryIDs: ids(entries))
            }.sorted { $0.amount == $1.amount ? $0.id < $1.id : ($0.amount ?? 0) > ($1.amount ?? 0) }
            let text = dimension == .menu ? "식당별 개별 메뉴 · 다른 식당의 같은 음식은 다른 메뉴" : dimension == .restaurant ? "확인된 식당·지점 · 방문 횟수나 선호가 아니에요" : "저장한 음식 분류 · 메뉴명으로 종류를 추정하지 않아요"
            cards.append(.init(id: "measure-" + dimension.id, title: "기록한 " + dimension.id,
                               meaning: rows.isEmpty && missing > 0 ? "연결·분류 확인 필요" : "\(rows.count)\(dimension.unit)", rows: rows,
                               note: text + " · 미연결 또는 해당 없음 \(missing)개 요리 기록"))
        }
        return .init(hero: cards[1].rows, cards: cards, discoveries: experienceDiscoveries(state))
    }
    static func experienceDiscoveries(_ state: TDState) -> [TDCard] {
        var cards: [TDCard] = []
        for (restaurant, rows) in entityGroups(state.selected, .restaurant) {
            let menus = entityGroups(rows, .menu)
            if meals(rows) >= 2 && menus.count >= 3 {
                cards.append(.init(id: key(["restaurantBreadth", restaurant.id]), title: "한 식당, 여러 메뉴",
                                   meaning: "\(restaurant.label)에서 \(meals(rows))번의 식사에 메뉴 \(menus.count)개를 기록했어요.",
                                   rows: [.init(id: restaurant.id, title: restaurant.label, value: "메뉴 \(menus.count)개", entryIDs: ids(rows))],
                                   note: "선택 기간 · 방문이나 호감의 추정이 아니에요.", isDiscovery: true))
            }
        }
        var pairs: [String: (TDIdentity, TDIdentity, Set<String>)] = [:]
        for (meal, rows) in Dictionary(grouping: state.selected, by: \.mealID) {
            let menus = entityGroups(rows, .menu).map { $0.0 }
            guard menus.count > 1 else { continue }
            for i in 0..<(menus.count-1) { for j in (i+1)..<menus.count {
                let id = key([menus[i].id, menus[j].id])
                var item = pairs[id] ?? (menus[i], menus[j], [])
                item.2.insert(meal); pairs[id] = item
            }}
        }
        for id in pairs.keys.sorted() {
            let (a, b, mealIDs) = pairs[id]!
            guard mealIDs.count >= 3 else { continue }
            let related = state.selected.filter { $0.menu?.id == a.id || $0.menu?.id == b.id }
            let denominator = meals(related.filter { $0.menu?.id == a.id })
            cards.append(.init(id: "pair:" + id, title: "함께 기록한 메뉴",
                               meaning: "\(a.label) · \(b.label)를 \(mealIDs.count)번의 식사에서 함께 남겼어요.",
                               rows: [.init(id: id, title: a.label, value: "\(denominator)번 중 \(mealIDs.count)번 함께", entryIDs: ids(related))],
                               note: "같은 날짜가 아니라 같은 식사 ID 기준. 각 메뉴의 별도 기록도 근거로 제공해요.", isDiscovery: true))
        }
        for (kind, rows) in entityGroups(state.selected, .foodKind) {
            let restaurants = entityGroups(rows, .restaurant)
            if restaurants.count >= 3 {
                cards.append(.init(id: "across:" + kind.id, title: "여러 식당에서 만난 음식 종류",
                                   meaning: "\(kind.label) 분류를 \(restaurants.count)곳의 식당에서 기록했어요.",
                                   rows: [.init(id: kind.id, title: kind.label, value: "\(restaurants.count)곳", entryIDs: ids(rows))],
                                   note: "직접 저장된 분류 기준. 넓은 분류를 특정 음식명으로 바꾸지 않아요.", isDiscovery: true))
            }
        }
        return cards.sorted { $0.id < $1.id }
    }
    static func sensation(_ state: TDState, domain: String) -> TDResult {
        let presence = presenceRows(state, domain: domain)
        let intensity = distributionRows(state, facet: .intensity, domain: domain)
        let cards = [TDCard(id: "presence", title: "기록한 맛·향·식감", meaning: domain, rows: presence,
                            note: "같은 식사의 같은 감각은 한 번. 여러 감각의 비율을 더해 100%로 만들지 않아요."),
                     TDCard(id: "intensity", title: "어느 정도로 느꼈나요", meaning: "느낀 강도", rows: intensity,
                            note: "강함은 좋음·과함이 아니에요. 같은 식사의 다른 강도는 ‘여러 강도’, 미응답은 별도 표시해요.")]
        let selectedIDs = ids(state.selected)
        let obs = state.observations.filter { $0.facet == .presence && selectedIDs.contains($0.entryID) }
        var groups: [String: (String, Set<String>)] = [:]
        for (entry, rows) in Dictionary(grouping: obs, by: \.entryID) {
            let attributes = Dictionary(grouping: rows, by: \.attribute)
            let keys = attributes.keys.sorted()
            guard keys.count > 1 else { continue }
            for i in 0..<(keys.count-1) { for j in (i+1)..<keys.count {
                let a = attributes[keys[i]]![0], b = attributes[keys[j]]![0]
                guard a.domain == domain || b.domain == domain else { continue }
                let id = key([keys[i], keys[j]])
                var item = groups[id] ?? (a.label + " + " + b.label, [])
                item.1.insert(entry); groups[id] = item
            }}
        }
        let discoveries = groups.keys.sorted().compactMap { id -> TDCard? in
            let (label, entries) = groups[id]!
            let n = meals(state.selected.filter { entries.contains($0.id) })
            guard n >= 3 else { return nil }
            return .init(id: "sensory-pair:" + id, title: "함께 느낀 감각", meaning: label,
                         rows: [.init(id: id, title: "같은 요리에서 함께 기록", value: "\(n)번의 식사", entryIDs: entries)],
                         note: "서로 다른 요리의 감각은 합치지 않아요. 향미 조합에 대한 호감은 추정하지 않아요.", isDiscovery: true)
        }
        return .init(hero: presence, cards: cards, discoveries: discoveries)
    }
    static func preference(_ state: TDState) -> TDResult {
        let selectedIDs = ids(state.selected)
        let overall = state.observations.filter { selectedIDs.contains($0.entryID) && $0.facet == .overall }
        let segments = vote(overall, records: state.selected, facet: .overall, includeMissing: selectedIDs)
        let answered = Set(overall.map(\.entryID)).count
        let overallRow = TDRow(id: "overall", title: "음식 전체", value: "요리 \(answered)개 평가", detail: summary(segments),
                               segments: segments, entryIDs: selectedIDs)
        let liking = distributionRows(state, facet: .liking)
        let fit = distributionRows(state, facet: .fit)
        let cards = [TDCard(id: "overall", title: "음식 전체는 어땠나요", meaning: "요리별 전체 5단계 평가", rows: [overallRow],
                            note: "감각 강도로 만든 별점은 사용하지 않아요. 미응답은 보통이나 아쉬움이 아니에요."),
                     TDCard(id: "liking", title: "감각별 호감", meaning: "좋음·보통·아쉬움", rows: liking,
                            note: "식사별 분포이며 고정된 취향이나 신뢰도 점수가 아니에요. 반대 응답도 함께 보여줘요."),
                     TDCard(id: "fit", title: "나에게 맞는 강도", meaning: "부족·알맞음·과함", rows: fit,
                            note: "알맞음은 호감과 별개의 응답이에요. 강도·호감을 서로 대신 채우지 않아요.")]
        return .init(hero: liking.isEmpty ? [overallRow] : liking, cards: cards, discoveries: [])
    }
    static func context(_ state: TDState, attribute: String?, facet: TDFacet) -> TDResult {
        let selectedIDs = ids(state.selected)
        let records = Dictionary(uniqueKeysWithValues: state.selected.map { ($0.id, $0) })
        let obs = state.observations.filter { selectedIDs.contains($0.entryID) && $0.facet == facet }
        let chosen = attribute ?? obs.map(\.attribute).sorted().first
        let selected = obs.filter { $0.attribute == chosen }
        let intensity = state.observations.filter { $0.facet == .intensity }
        var cards: [TDCard] = []
        for dimension in ["foodKind", "target", "phase", "intensity"] {
            var groups: [String: [TDObservation]] = [:]
            var names: [String: String] = [:]
            for row in selected {
                let conditions: [TDIdentity]
                switch dimension {
                case "foodKind": conditions = records[row.entryID]?.foodKinds ?? []
                case "target": conditions = row.target == "unspecified" ? [] : [.init(id: row.target, label: conditionLabel(row.target))]
                case "phase": conditions = row.phase == "unspecified" ? [] : [.init(id: row.phase, label: conditionLabel(row.phase))]
                default:
                    let values = Set(intensity.filter { $0.entryID == row.entryID && $0.attribute == row.attribute && $0.target == row.target && $0.phase == row.phase && $0.selection == row.selection }.map(\.value))
                    conditions = values.count == 1 ? [.init(id: values.first!, label: TDFacet.intensity.label(values.first!))] : []
                }
                for condition in conditions {
                    groups[condition.id, default: []].append(row); names[condition.id] = condition.label
                }
            }
            let rows = groups.keys.sorted().map { condition in
                let values = groups[condition]!
                let segments = vote(values, records: state.selected, facet: facet)
                let n = segments.reduce(0) { $0 + $1.count }
                return TDRow(id: key([dimension, condition]), title: names[condition]!, value: "\(n)번의 식사", detail: summary(segments),
                             segments: segments, entryIDs: Set(values.map(\.entryID)))
            }
            let title = ["foodKind":"음식 종류별 반응", "target":"느낀 부위별 반응", "phase":"먹는 시점별 반응", "intensity":"느낀 강도별 반응"][dimension]!
            cards.append(.init(id: "context-" + dimension, title: title,
                               meaning: (selected.first?.label ?? "감각 평가 자료 없음") + " · " + facet.title, rows: rows,
                               note: "조건 하나만 있어도 조회할 수 있어요. 집단이 겹칠 수 있고 다른 조건은 통제하지 않았어요. 조건 미응답은 집단을 만들지 않아요."))
        }
        return .init(hero: cards.first(where: { !$0.rows.isEmpty })?.rows ?? [], cards: cards, discoveries: [])
    }
    static func conditionLabel(_ value: String) -> String {
        ["whole_dish":"음식 전체", "sauce":"소스", "broth":"국물", "surface":"겉", "inside":"속",
         "first_bite":"첫입", "early_meal":"초반", "during_meal":"먹는 중", "late_meal":"후반",
         "after_swallow":"삼킨 뒤", "after_meal":"식사 후", "unspecified":"미응답"][value] ?? value
    }
    static func change(_ state: TDState, calendar: Calendar) -> TDResult {
        let recent = state.window.isAll ? TDWindow.recent(90, now: state.now, calendar: calendar) : state.window
        let previous = recent.previous(calendar: calendar)
        let before = state.records(in: previous), after = state.records(in: recent)
        let range = "이전 " + previous.range(calendar: calendar) + " / 최근 " + recent.range(calendar: calendar)
        var rows = [TDRow(id: "meal", title: "기록한 식사", value: "\(meals(before)) → \(meals(after))번", entryIDs: ids(before + after))]
        for dimension in TDDimension.allCases {
            rows.append(.init(id: dimension.id, title: dimension.id,
                              value: "\(entityGroups(before, dimension).count) → \(entityGroups(after, dimension).count)\(dimension.unit)", entryIDs: ids(before + after)))
        }
        var cards = [TDCard(id: "change-experience", title: "경험 범위의 변화", meaning: range, rows: rows,
                            note: "같은 길이의 두 기간. 기록량이 다를 수 있으며 기록하지 않은 실제 경험은 알 수 없어요.")]
        let relevantIDs = ids(before + after)
        let presence = state.observations.filter { $0.facet == .presence && relevantIDs.contains($0.entryID) }
        func presenceCount(_ entries: [TDRecord], attribute: String?) -> Int {
            let entriesMap = Dictionary(uniqueKeysWithValues: entries.map { ($0.id, $0.mealID) })
            return Set(presence.filter { attribute == nil || $0.attribute == attribute }.compactMap { entriesMap[$0.entryID] }).count
        }
        let beforeN = presenceCount(before, attribute: nil), afterN = presenceCount(after, attribute: nil)
        let presenceGroups = Dictionary(grouping: presence, by: \.attribute)
        let sensoryRows = presenceGroups.keys.sorted().map { attribute in
            let b = presenceCount(before, attribute: attribute), a = presenceCount(after, attribute: attribute)
            let left = beforeN > 0 ? "\(b)/\(beforeN)번" : "자료 없음"
            let right = afterN > 0 ? "\(a)/\(afterN)번" : "자료 없음"
            return TDRow(id: attribute, title: presenceGroups[attribute]!.map(\.label).sorted()[0], value: left + " → " + right,
                         detail: "이전 → 최근 · 감각 존재를 남긴 식사가 분모", entryIDs: ids(before + after))
        }
        cards.append(.init(id: "change-presence", title: "감각 기록의 변화", meaning: range, rows: sensoryRows,
                           note: "감각이 기록된 비중이며 감각 호감의 변화가 아니에요. 미응답 기간을 0으로 처리하지 않아요."))
        cards.append(evaluationChange(state, before: before, after: after, facet: .liking, range: range))
        cards.append(evaluationChange(state, before: before, after: after, facet: .fit, range: range))
        // Six actual calendar buckets; no interpolation across missing observations.
        let today = calendar.startOfDay(for: state.now)
        var hero: [TDRow] = []
        let formatter = DateFormatter(); formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
        formatter.locale = Locale(identifier: "ko_KR"); formatter.dateFormat = "M.d"
        if let start = recent.start, let end = recent.end {
            let total = max(1, calendar.dateComponents([.day], from: start, to: end).day ?? 1)
            let width = max(1, Int(ceil(Double(total)/6)))
            var cursor = start
            while cursor < end {
                let next = min(end, calendar.date(byAdding: .day, value: width, to: cursor) ?? end)
                guard next > cursor else { break }
                let selected = state.records.filter { $0.date.map { $0 >= cursor && $0 < next && $0 <= today } ?? false }
                let count = entityGroups(selected, .menu).count
                hero.append(.init(id: cursor.ISO8601Format(), title: formatter.string(from: cursor), value: "메뉴 \(count)개",
                                  detail: "\(formatter.string(from: cursor))부터 \(width)일 이하 구간", amount: Double(count), entryIDs: ids(selected)))
                cursor = next
            }
        }
        return .init(hero: hero, cards: cards, discoveries: [])
    }
    static func evaluationChange(_ state: TDState, before: [TDRecord], after: [TDRecord], facet: TDFacet, range: String) -> TDCard {
        let selected = before + after, selectedIDs = ids(selected)
        let entries = Dictionary(uniqueKeysWithValues: selected.map { ($0.id, $0) })
        let responses = state.observations.filter { $0.facet == facet && selectedIDs.contains($0.entryID) && entries[$0.entryID]?.menu != nil }
        let intensities = state.observations.filter { $0.facet == .intensity }
        func scope(_ row: TDObservation) -> String {
            let intensity = Set(intensities.filter { $0.entryID == row.entryID && $0.attribute == row.attribute && $0.selection == row.selection && $0.target == row.target && $0.phase == row.phase }.map(\.value))
            return key([entries[row.entryID]!.menu!.id, row.attribute, row.target, row.phase,
                        intensity.count == 1 ? intensity.first! : "unresolved-intensity"])
        }
        let groups = Dictionary(grouping: responses, by: scope)
        var rows: [TDRow] = []
        for id in groups.keys.sorted() {
            let values = groups[id]!, row = values[0]
            let title = entries[row.entryID]!.menu!.label + " · " + row.label + " · " + conditionLabel(row.target) + " / " + conditionLabel(row.phase)
            let b = vote(values, records: before, facet: facet), a = vote(values, records: after, facet: facet)
            let nB = b.reduce(0) { $0+$1.count }, nA = a.reduce(0) { $0+$1.count }
            let strength = Set(intensities.filter { $0.entryID == row.entryID && $0.attribute == row.attribute && $0.selection == row.selection && $0.target == row.target && $0.phase == row.phase }.map(\.value))
            let intensityLabel = strength.count == 1 ? TDFacet.intensity.label(strength.first!) : "강도 미확인·충돌 포함"
            let detail = "강도: \(intensityLabel) · " + (nB < 3 || nA < 3 ? "반복 비교 자료 부족 · " : "관찰된 분포만 비교 · ")
            let evidence = Set(values.map(\.entryID))
            rows.append(.init(id: id + ":before", title: title + " · 이전", value: nB == 0 ? "자료 없음" : "\(nB)번의 식사",
                              detail: detail + summary(b), segments: b, entryIDs: evidence.intersection(ids(before))))
            rows.append(.init(id: id + ":after", title: title + " · 최근", value: nA == 0 ? "자료 없음" : "\(nA)번의 식사",
                              detail: detail + summary(a), segments: a, entryIDs: evidence.intersection(ids(after))))
        }
        return .init(id: "change-" + facet.rawValue, title: facet == .liking ? "호감 평가의 변화" : "알맞음 응답의 변화",
                     meaning: range, rows: rows,
                     note: "식당별 같은 메뉴·감각·부위·시점·확인 강도로 묶어요. 강도 미확인은 별도 묶음이며 동일 강도라고 주장하지 않아요. 메뉴의 실제 조리 변화는 통제하지 않았어요.")
    }
    static func result(_ state: TDState, category: TDCategory, domain: String = "맛", attribute: String? = nil,
                       facet: TDFacet = .liking, calendar: Calendar) -> TDResult {
        switch category {
        case .experience: return experience(state)
        case .sensation: return sensation(state, domain: domain)
        case .preference: return preference(state)
        case .context: return context(state, attribute: attribute, facet: facet)
        case .change: return change(state, calendar: calendar)
        }
    }
}
// TASTE_DATA_CORE_END



// MARK: - Native input bridge: current original + current revision + matching parser atom
private enum TDNativeAdapter {
    struct Catalog: Decodable {
        struct Kind: Decodable { let id: String; let label: String }
        let dishKindOptions: [Kind]
    }
    static let kindLabels: [String: String] = {
        let url = Bundle.main.url(forResource: "dining-feedback-scenario", withExtension: "json")
            ?? Bundle.main.url(forResource: "dining-feedback-scenario", withExtension: "json", subdirectory: "Fixtures")
        guard let url, let bytes = try? Data(contentsOf: url), let catalog = try? JSONDecoder().decode(Catalog.self, from: bytes) else { return [:] }
        return Dictionary(catalog.dishKindOptions.map { ($0.id, $0.label) }, uniquingKeysWith: { a, _ in a })
    }()
    static func inputs(entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot, now: Date) -> ([TDRecord], [TDObservation]) {
        let sources = HomeArchiveSources(entries: entries, snapshot: snapshot, referenceDate: now)
        func clean(_ value: String?) -> String? {
            guard let value else { return nil }
            let text = value.trimmingCharacters(in: .whitespacesAndNewlines)
            return text.isEmpty ? nil : text.precomposedStringWithCanonicalMapping
        }
        let records = sources.entries.map { entry -> TDRecord in
            // Name-only locations cannot safely identify a restaurant branch or home cooking.
            let restaurant = clean(entry.restaurantID).map { TDIdentity(id: "restaurant:" + $0, label: clean(entry.restaurant) ?? "이름 미확인 식당") }
            let menu: TDIdentity?
            let menuToken = clean(entry.menuItemID).map { TDDataEngine.key(["id", $0]) }
                ?? clean(entry.menu).map { TDDataEngine.key(["name", $0]) }
            if let restaurant, let menuToken {
                menu = .init(id: TDDataEngine.key([restaurant.id, menuToken]), label: (clean(entry.menu) ?? "이름 미확인 메뉴") + " · " + restaurant.label)
            } else { menu = nil }
            let kinds = Set(entry.dishKindIDs).sorted().compactMap { id in kindLabels[id].map { TDIdentity(id: id, label: $0) } }
            return .init(id: entry.id.uuidString, mealID: entry.mealID.uuidString, date: entry.confirmedMealDate,
                         menu: menu, restaurant: restaurant, foodKinds: kinds)
        }
        var allowed: [UUID: [SensoryRuleAtom]] = [:]
        for entry in sources.entries where entry.hasCompletedTasteFeedback {
            var atoms: [SensoryRuleAtom] = []
            if let catalog = SensoryAnalysisEngine.contract?.selectionCatalog {
                let selections = entry.sensorySelections ?? SensoryAnalysisEngine.legacySelections(
                    bubbleIDs: entry.tasteExperienceIDs, tagIDs: entry.detailTagIDs, catalog: catalog)
                atoms += DiningSensorySelectionParser.parse(selections, catalog: catalog).observations
            }
            if let overall = entry.overallEvaluation { atoms += overall.parse().observations }
            allowed[entry.id] = atoms
        }
        let kinds: [String: TDFacet] = ["sensory_presence":.presence, "sensory_intensity":.intensity,
                                        "attribute_liking":.liking, "preference_fit":.fit, "overall_liking":.overall]
        let scales: [TDFacet: String] = [.presence:"presence-v1", .intensity:"expression-strength-v1",
                                        .liking:"attribute-three-category-v1", .fit:"preference-fit-v1", .overall:"overall-five-category-v1"]
        let observations = sources.observations.compactMap { row -> TDObservation? in
            guard let facet = kinds[row.kind], scales[facet] == row.scale,
                  let selection = row.selectionEvidence,
                  (allowed[row.experienceID] ?? []).contains(where: { atom in
                      atom.kind == row.kind && atom.attribute == row.attribute && atom.reference == row.reference
                        && atom.value == row.value && atom.scale == row.scale
                        && (atom.target ?? "unspecified") == row.target && (atom.phase ?? "unspecified") == row.phase
                        && atom.selectionEvidence == row.selectionEvidence
                  }) else { return nil }
            if facet != .overall && (row.attribute == nil || row.attribute!.hasSuffix(".unspecified")) { return nil }
            if facet == .presence && row.value != .flag(true) { return nil }
            let attribute = (row.attribute ?? "overall") + (row.reference.map { "|reference:" + $0 } ?? "")
            return .init(id: row.id, entryID: row.experienceID.uuidString, facet: facet, attribute: attribute,
                         label: row.reference ?? row.attributeLabel, value: facet == .presence ? "present" : row.value.text,
                         target: row.target, phase: row.phase,
                         selection: TDDataEngine.key([selection.type, selection.selectionID, selection.catalogVersion, selection.relatedBubbleID ?? ""]))
        }
        return (records, observations)
    }
}

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
private extension HomeDiscoveryCard.Kind {
    var dataCategory: TDCategory {
        switch self {
        case .restaurantCollection, .repeatedMenu: return .experience
        case .commonPreference, .repeatedGoodEvaluation, .overallContrast, .familiarTasteInNewMenu, .patternException: return .preference
        case .preferredIntensity, .conditionalContrast: return .context
        case .timeGap, .lastYear, .revisitComparison, .periodChange: return .change
        }
    }
}
private enum TDPeriodChoice: String, CaseIterable, Identifiable {
    case all = "전체", month = "이번 달", thirty = "최근 30일", ninety = "최근 90일"
    var id: String { rawValue }
    func window(now: Date, calendar: Calendar) -> TDWindow {
        switch self {
        case .all: return .all
        case .thirty: return .recent(30, now: now, calendar: calendar)
        case .ninety: return .recent(90, now: now, calendar: calendar)
        case .month:
            let day = calendar.startOfDay(for: now)
            return .init(label: "이번 달 · 오늘까지", start: calendar.dateInterval(of: .month, for: day)?.start,
                         end: calendar.date(byAdding: .day, value: 1, to: day))
        }
    }
}
private struct TDDetailSelection: Identifiable {
    let id = UUID()
    let title: String
    let meaning: String
    let note: String
    let rows: [TDRow]
}
private struct TDRenderKey: Equatable {
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
}
private struct TDRendered {
    let key: TDRenderKey
    let state: TDState
    let result: TDResult
}

/// All existing .homeInsight routes remain resolvable. The home now offers five fixed category entries.
struct HomeArchiveDetailView: View {
    let kind: HomeArchiveCard.Kind
    var bottomContentInset: CGFloat = 0
    var body: some View {
        TasteDataCategoryView(category: kind.dataCategory, bottomContentInset: bottomContentInset)
            .id(kind.dataCategory)
            .preference(key: HomeInsightTintPreferenceKey.self, value: [kind.rawValue: 0])
    }
}

struct TasteDataCategoryView: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let category: TDCategory
    var bottomContentInset: CGFloat = 0
    @State private var period: TDPeriodChoice = .all
    @State private var domain = "맛"
    @State private var firstDimension: TDDimension = .menu
    @State private var repeatDimension: TDDimension = .menu
    @State private var contextAttribute: String?
    @State private var contextFacet: TDFacet = .liking
    @State private var referenceDate = Date.now
    @State private var rendered: TDRendered?
    @State private var detail: TDDetailSelection?
    @State private var discoveryID: String?
    @State private var expandedCards: Set<String> = []
    @State private var showAllDiscoveries = false

    private var renderKey: TDRenderKey {
        let calendar = Calendar.current
        return .init(entries: appModel.diningEntries, analysis: appModel.sensoryAnalysis,
                     owner: String(describing: appModel.memoryAccountGeneration), category: category,
                     period: period.window(now: referenceDate, calendar: calendar), day: calendar.startOfDay(for: referenceDate),
                     domain: domain, attribute: contextAttribute, facet: contextFacet, timeZone: calendar.timeZone.identifier)
    }
    private var existingDiscoveries: [HomeDiscoveryCard] {
        // Reuse the app's read/snooze-aware queue. Do not revive suppressed candidates.
        appModel.homeJournalStackItems.compactMap { item -> HomeDiscoveryCard? in
            guard case .discovery(let card) = item, card.kind.dataCategory == category else { return nil }
            // Experience relationships below replace legacy count milestones, not duplicate them.
            guard category != .experience else { return nil }
            return card
        }
    }
    var body: some View {
        let key = renderKey
        ScrollView {
            LazyVStack(alignment: .leading, spacing: TBSpacing.section) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(category.rawValue).tbTextStyle(.sectionTitle)
                        Text(category.subtitle).tbTextStyle(.body)
                    }
                    Spacer(minLength: 8)
                    Picker("측정 기간", selection: $period) {
                        ForEach(TDPeriodChoice.allCases) { Text($0.rawValue).tag($0) }
                    }.pickerStyle(.menu)
                }
                Text(key.period.range(calendar: .current) + " · 확인된 식사일 기준").tbTextStyle(.caption)
                if category != .experience && appModel.sensoryAnalysisIsUpdating {
                    SensoryAnalysisStatusCard(state: .processing)
                } else if category != .experience, let error = appModel.sensoryAnalysisError {
                    SensoryAnalysisStatusCard(state: .failed(error))
                } else if let rendered, rendered.key == key {
                    categoryContent(rendered)
                } else {
                    ProgressView("현재 기록에서 데이터를 집계하고 있어요")
                        .frame(maxWidth: .infinity, minHeight: 160)
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, TBSpacing.pageTop)
            .padding(.bottom, TBSpacing.page + bottomContentInset)
        }
        .tbPageBackground()
        .accessibilityIdentifier("taste-data-" + category.id)
        .task(id: key) { await refresh(key) }
        .task { appModel.refreshHomeDiscoveriesIfNeeded() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { referenceDate = .now; appModel.refreshHomeDiscoveriesIfNeeded() }
        }
        .onReceive(NotificationCenter.default.publisher(for: .NSCalendarDayChanged)) { _ in referenceDate = .now }
        .onChange(of: key) { _, _ in detail = nil; discoveryID = nil }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in
            rendered = nil; detail = nil; discoveryID = nil; contextAttribute = nil
            expandedCards = []; showAllDiscoveries = false
        }
        .sheet(item: $detail) { selection in TDDataDetailSheet(selection: selection).environmentObject(appModel) }
        .sheet(isPresented: Binding(get: { discoveryID != nil }, set: { if !$0 { discoveryID = nil } })) {
            if let discoveryID { HomeDiscoveryDetailView(discoveryID: discoveryID).environmentObject(appModel) }
        }
    }
    @MainActor private func refresh(_ key: TDRenderKey) async {
        let capturedNow = Date.now
        let (records, observations) = TDNativeAdapter.inputs(entries: key.entries, snapshot: key.analysis, now: capturedNow)
        let window = key.period, category = key.category, domain = key.domain, attribute = key.attribute, facet = key.facet
        let calendar = Calendar.current
        let worker = Task.detached(priority: .userInitiated) { () -> (TDState, TDResult) in
            let state = TDDataEngine.prepare(records: records, observations: observations, window: window, now: capturedNow, calendar: calendar)
            return (state, TDDataEngine.result(state, category: category, domain: domain, attribute: attribute, facet: facet, calendar: calendar))
        }
        let output = await withTaskCancellationHandler(operation: { await worker.value }, onCancel: { worker.cancel() })
        guard !Task.isCancelled, key == renderKey else { return }
        rendered = .init(key: key, state: output.0, result: output.1)
    }
    @ViewBuilder private func categoryContent(_ output: TDRendered) -> some View {
        let state = output.state, result = output.result
        if appModel.diningEntries.isEmpty {
            TDCardSurface(title: "첫 음식 경험부터 남겨보세요", subtitle: "아직 기록이 없어요") {
                Text("다이닝에서 기록한 음식과 평가가 이곳에 모여요. 사진이나 모든 평가를 채울 필요는 없어요.").tbTextStyle(.body)
            }
        } else {
            if category == .sensation { sensoryControls }
            if category == .context { contextControls(state) }
            hero(result.hero)
            quality(state)
            Text("측정").tbTextStyle(.sectionTitle)
            ForEach(result.cards) { cardView($0) }
            if category == .experience {
                eventView(state, first: true, dimension: $firstDimension)
                eventView(state, first: false, dimension: $repeatDimension)
            }
            Text("발견").tbTextStyle(.sectionTitle)
            if result.discoveries.isEmpty && existingDiscoveries.isEmpty {
                Text("현재 범위에서 보여줄 발견이 없어요. 측정 데이터는 계속 확인할 수 있으며, 자료 부족을 관계가 없다는 뜻으로 해석하지 않아요.")
                    .tbTextStyle(.body)
            } else {
                ForEach(Array(result.discoveries.prefix(showAllDiscoveries ? result.discoveries.count : 3))) { cardView($0) }
                if result.discoveries.count > 3 && !showAllDiscoveries {
                    Button("이 기간의 발견 더 보기 · \(result.discoveries.count)개") { showAllDiscoveries = true }.frame(minHeight: 44)
                }
                if !existingDiscoveries.isEmpty {
                    Text("아카이브 전체에서 선정한 발견 · 비교 기간은 각 카드에 표시돼요").tbTextStyle(.caption)
                    ForEach(existingDiscoveries) { card in
                        TDCardSurface(title: card.kind.label, subtitle: "전체 기록 분석 · 선택 기간의 측정과 별도") {
                            Text(card.title).tbTextStyle(.subsectionTitle)
                            Text(card.detail).tbTextStyle(.body)
                            if !card.evidenceSummary.isEmpty { Text(card.evidenceSummary).tbTextStyle(.caption) }
                            Button("근거와 해석 범위 보기") { discoveryID = card.id }.frame(minHeight: 44)
                        }
                        .contextMenu { Button("이 발견 7일간 보지 않기") { appModel.suppressHomeDiscovery(id: card.id) } }
                    }
                }
            }
            TDCardSurface(title: "기록으로 돌아가기", subtitle: "선택 기간의 요리 기록 \(state.selected.count)개") {
                Button("기간의 원본 기록 보기") {
                    detail = .init(title: "관련 기록", meaning: state.window.range(calendar: .current), note: "선택한 측정 기간의 기록이에요.",
                                   rows: [.init(id: "all", title: "요리 기록", value: "\(state.selected.count)개", entryIDs: TDDataEngine.ids(state.selected))])
                }.frame(minHeight: 44)
            }
        }
    }
    private var sensoryControls: some View {
        Picker("감각 영역", selection: $domain) { ForEach(["맛", "향", "식감"], id: \.self) { Text($0).tag($0) } }
            .pickerStyle(.segmented).accessibilityIdentifier("taste-data-sensory-domain")
    }
    private func contextControls(_ state: TDState) -> some View {
        let relevant = state.observations.filter { ($0.facet == .liking || $0.facet == .fit) && TDDataEngine.ids(state.selected).contains($0.entryID) }
        let groups = Dictionary(grouping: relevant, by: \.attribute)
        return VStack(alignment: .leading, spacing: 12) {
            Picker("비교할 감각", selection: $contextAttribute) {
                Text("기록된 감각 자동 선택").tag(nil as String?)
                ForEach(groups.keys.sorted(), id: \.self) { id in
                    Text(groups[id]!.map(\.label).sorted()[0]).tag(Optional(id))
                }
            }.pickerStyle(.menu)
            Picker("반응의 종류", selection: $contextFacet) {
                Text("감각 호감").tag(TDFacet.liking)
                Text("알맞음").tag(TDFacet.fit)
            }.pickerStyle(.segmented)
        }
    }
    @ViewBuilder private func quality(_ state: TDState) -> some View {
        let missing = state.unknownDateIDs.count
        if missing > 0 || !state.futureIDs.isEmpty || !state.conflictingIDs.isEmpty {
            TDCardSurface(title: "집계 범위 확인", subtitle: "미확인과 0을 구분해요") {
                if missing > 0 {
                    Text("식사일 미확인 요리 기록 \(missing)개. 전체 누적에는 포함하고 기간·첫 경험 판단에서는 분리해요.").tbTextStyle(.body)
                    Button("식사일 미확인 기록 보기") {
                        detail = .init(title: "식사일 미확인 기록", meaning: "기간 필터 밖의 미확인 기록", note: "저장일을 식사일로 바꾸지 않아요. 원본에서 확인할 수 있어요.",
                                       rows: [.init(id: "undated", title: "요리 기록", value: "\(missing)개", entryIDs: state.unknownDateIDs)])
                    }.frame(minHeight: 44)
                }
                if !state.futureIDs.isEmpty { Text("미래 식사일이 포함된 식사의 요리 기록 \(state.futureIDs.count)개 제외").tbTextStyle(.caption) }
                if !state.conflictingIDs.isEmpty { Text("식별자 충돌 \(state.conflictingIDs.count)개 제외").tbTextStyle(.caption) }
            }
        }
    }
    private func eventView(_ state: TDState, first: Bool, dimension: Binding<TDDimension>) -> some View {
        let card = TDDataEngine.eventCard(state, dimension: dimension.wrappedValue, first: first, calendar: .current)
        return TDCardSurface(title: card.title, subtitle: state.window.label) {
            if dynamicTypeSize.isAccessibilitySize {
                Picker("경험의 단위", selection: dimension) { ForEach(TDDimension.allCases) { Text($0.rawValue).tag($0) } }.pickerStyle(.menu)
            } else {
                Picker("경험의 단위", selection: dimension) { ForEach(TDDimension.allCases) { Text($0.rawValue).tag($0) } }.pickerStyle(.segmented)
            }
            Text(card.meaning).tbTextStyle(.subsectionTitle)
            rows(card.rows, limit: 3)
            Text(card.note).tbTextStyle(.caption)
            Button("전체 목록과 연결 기록 보기") { open(card) }.frame(minHeight: 44)
        }.accessibilityIdentifier(first ? "taste-data-first" : "taste-data-repeat")
    }
    private func cardView(_ card: TDCard) -> some View {
        TDCardSurface(title: card.title, subtitle: card.meaning) {
            rows(card.rows, limit: expandedCards.contains(card.id) ? card.rows.count : 3)
            if card.rows.count > 3 {
                Button(expandedCards.contains(card.id) ? "접기" : "항목 더 보기 · \(card.rows.count)개") {
                    if expandedCards.contains(card.id) { expandedCards.remove(card.id) } else { expandedCards.insert(card.id) }
                }.frame(minHeight: 44)
            }
            Text(card.note).tbTextStyle(.caption)
            Button("집계 기준과 원본 보기") { open(card) }.frame(minHeight: 44)
        }.accessibilityIdentifier("taste-data-card-" + card.id)
    }
    @ViewBuilder private func rows(_ values: [TDRow], limit: Int) -> some View {
        if values.isEmpty { Text("현재 범위에서 확인할 자료가 없어요.").tbTextStyle(.body) }
        ForEach(Array(values.prefix(limit))) { row in
            Button {
                detail = .init(title: row.title, meaning: row.value, note: row.detail, rows: [row])
            } label: {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top) {
                        Text(row.title).tbTextStyle(.body)
                        Spacer(minLength: 8)
                        Text(row.value).tbTextStyle(.caption).multilineTextAlignment(.trailing)
                    }
                    if !row.segments.isEmpty { TDSegmentBar(segments: row.segments) }
                    if !row.detail.isEmpty { Text(row.detail).tbTextStyle(.caption).multilineTextAlignment(.leading) }
                }.frame(maxWidth: .infinity, minHeight: 44, alignment: .leading).contentShape(Rectangle())
            }.buttonStyle(.plain)
        }
    }
    private func open(_ card: TDCard) {
        detail = .init(title: card.title, meaning: card.meaning, note: card.note, rows: card.rows)
    }
    private func hero(_ values: [TDRow]) -> some View {
        let titles: [TDCategory: String] = [.experience:"메뉴별로 쌓인 경험", .sensation:"기록에 남은 감각",
                                           .preference:"평가가 모인 방향", .context:"조건별로 남긴 반응", .change:"기간별 메뉴 기록"]
        return TDCardSurface(title: titles[category]!, subtitle: category == .change ? "변화 카드와 같은 최근 기간 · 여섯 구간 이내" : "선택한 기간의 유효한 기록") {
            if values.isEmpty {
                Text("시각화할 자료가 아직 없어요. 아래에서 기록과 미확인 상태를 확인할 수 있어요.").tbTextStyle(.body)
            } else if category == .experience {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: dynamicTypeSize.isAccessibilitySize ? 260 : 140), alignment: .leading)], alignment: .leading, spacing: 18) {
                    ForEach(Array(values.prefix(6))) { row in
                        Button { detail = .init(title: row.title, meaning: row.value, note: "이 메뉴의 기간 내 기록이에요.", rows: [row]) } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 3) {
                                    ForEach(0..<min(8, Int(row.amount ?? 0)), id: \.self) { _ in Circle().fill(TBColor.textBody).frame(width: 7, height: 7) }
                                    if (row.amount ?? 0) > 8 { Text("+\(Int(row.amount ?? 0)-8)").tbTextStyle(.caption) }
                                }.accessibilityHidden(true)
                                Text(row.title).tbTextStyle(.body).multilineTextAlignment(.leading)
                                Text(row.value).tbTextStyle(.caption)
                            }.frame(maxWidth: .infinity, minHeight: 70, alignment: .leading).contentShape(Rectangle())
                        }.buttonStyle(.plain)
                    }
                }
                Text("한 묶음은 메뉴, 점 1개는 그 메뉴를 기록한 식사 1번. 한 식사의 여러 메뉴는 따로 표시돼요.").tbTextStyle(.caption)
            } else if category == .change && !dynamicTypeSize.isAccessibilitySize {
                TDTimeBars(rows: values) { row in detail = .init(title: row.title, meaning: row.value, note: row.detail, rows: [row]) }
            } else if category == .sensation {
                let maxValue = max(1, values.compactMap(\.amount).max() ?? 1)
                ForEach(Array(values.prefix(6))) { row in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack { Text(row.title).tbTextStyle(.body); Spacer(); Text(row.value).tbTextStyle(.caption) }
                        GeometryReader { proxy in
                            Capsule().fill(TBColor.textBody).frame(width: proxy.size.width * CGFloat((row.amount ?? 0) / maxValue))
                        }.frame(height: 7).accessibilityHidden(true)
                    }
                }
                Text("막대는 기록 빈도이며 강도나 호감이 아니에요. 강도 분포는 아래 카드에서 확인해요.").tbTextStyle(.caption)
            } else {
                rows(values, limit: 3)
            }
            if values.count > 6 { Text("나머지 항목은 아래 측정 카드에서 이어 볼 수 있어요.").tbTextStyle(.caption) }
        }.accessibilityIdentifier("taste-data-hero-" + category.id)
    }
}

private struct TDCardSurface<Content: View>: View {
    let title: String
    let subtitle: String
    let content: Content
    init(title: String, subtitle: String, @ViewBuilder content: () -> Content) {
        self.title = title; self.subtitle = subtitle; self.content = content()
    }
    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x12) {
            Text(title).tbTextStyle(.subsectionTitle)
            Text(subtitle).tbTextStyle(.caption)
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TBSpacing.x12)
        .background(TBColor.surface, in: RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
    }
}
private struct TDSegmentBar: View {
    let segments: [TDSegment]
    var body: some View {
        let nonzero = segments.filter { $0.count > 0 }
        let total = max(1, nonzero.reduce(0) { $0 + $1.count })
        VStack(alignment: .leading, spacing: 6) {
            GeometryReader { proxy in
                HStack(spacing: 0) {
                    ForEach(Array(nonzero.enumerated()), id: \.element.key) { index, segment in
                        Rectangle().fill(TBColor.textBody.opacity(0.25 + 0.7 * Double(index + 1) / Double(max(1, nonzero.count))))
                            .overlay(Rectangle().stroke(TBColor.surface, lineWidth: 1))
                            .frame(width: proxy.size.width * CGFloat(segment.count) / CGFloat(total))
                    }
                }
            }.frame(height: 12).accessibilityHidden(true)
            Text(TDDataEngine.summary(segments)).tbTextStyle(.caption)
        }
    }
}
private struct TDTimeBars: View {
    let rows: [TDRow]
    let onSelect: (TDRow) -> Void
    var body: some View {
        let maximum = max(1, rows.compactMap(\.amount).max() ?? 1)
        HStack(alignment: .bottom, spacing: 10) {
            ForEach(rows) { row in
                Button { onSelect(row) } label: {
                    VStack(spacing: 6) {
                        Text("\(Int(row.amount ?? 0))").tbTextStyle(.caption)
                        RoundedRectangle(cornerRadius: 4).fill(TBColor.textBody)
                            .frame(height: CGFloat((row.amount ?? 0) / maximum) * 110)
                        Text(row.title).tbTextStyle(.caption)
                    }.frame(maxWidth: .infinity, minHeight: 44, alignment: .bottom).contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityLabel(row.title + " · " + row.value)
            }
        }.frame(minHeight: 160, alignment: .bottom)
    }
}
private struct TDDataDetailSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let selection: TDDetailSelection
    @State private var selectedEntryID: UUID?
    @State private var displayLimit = 30
    private var documents: [FoodMemoryDocument] {
        let ids = Set(selection.rows.flatMap(\.entryIDs))
        let current = HomeArchiveIdentity.entries(appModel.diningEntries, asOf: .now).filter { ids.contains($0.id.uuidString) }
        return current.map { entry in
            appModel.foodMemoryIndex.documents.first { $0.id == entry.id && $0.entry == entry }
                ?? FoodMemoryDocument(entry: entry, observations: [], unresolved: [], searchableFields: [], isGeneratedNote: false)
        }.sorted {
            let left = $0.entry.confirmedMealDate ?? .distantPast, right = $1.entry.confirmedMealDate ?? .distantPast
            return left == right ? $0.id.uuidString < $1.id.uuidString : left > right
        }
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: TBSpacing.section) {
                    Text(selection.meaning).tbTextStyle(.subsectionTitle)
                    Text(selection.note).tbTextStyle(.body)
                    ForEach(selection.rows) { row in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(row.title + " · " + row.value).tbTextStyle(.body)
                            if !row.segments.isEmpty { TDSegmentBar(segments: row.segments) }
                            if !row.detail.isEmpty { Text(row.detail).tbTextStyle(.caption) }
                        }
                    }
                    Text("연결된 원본 \(documents.count)개 · 식사 \(Set(documents.map { $0.entry.mealID }).count)번").tbTextStyle(.subsectionTitle)
                    Text("해당 항목의 근거 기록이에요. 식사 단위 집계와 요리 기록 개수는 다를 수 있어요. 사진이 없어도 동일하게 열 수 있어요.").tbTextStyle(.caption)
                    ForEach(Array(documents.prefix(displayLimit))) { document in
                        Button { selectedEntryID = document.id } label: { FoodMemoryRow(document: document) }.buttonStyle(.plain)
                    }
                    if documents.count > displayLimit { Button("원본 더 보기") { displayLimit += 30 }.frame(minHeight: 44) }
                    if documents.isEmpty { Text("현재 연결된 기록이 없어요. 수정·삭제된 원본을 계속 표시하지 않아요.").tbTextStyle(.body) }
                }.tbPageContentPadding()
            }
            .tbPageBackground().navigationTitle(selection.title).tbInlineNavigationTitle()
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } } }
        }
        .sheet(isPresented: Binding(get: { selectedEntryID != nil }, set: { if !$0 { selectedEntryID = nil } })) {
            if let selectedEntryID { FoodMemoryDetailView(entryID: selectedEntryID).environmentObject(appModel) }
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }
}
