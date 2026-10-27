import SwiftUI

/// A query, not a copy of the evidence. Safe to keep after the category screen is unmounted.
struct TDCardDetailRequest: Hashable, Identifiable {
    enum Target: Hashable { case metric(id: String, rowID: String?); case discovery(id: String) }
    var id = UUID()
    let title: String
    let category: TDCategory
    let window: TDWindow
    let source: TDSourceFilter
    let domain: String
    let attribute: String?
    let facet: TDFacet
    let contextDimension: String
    let heroDimension: TDDimension?
    let referenceDate: Date
    let timeZoneID: String
    let target: Target

    static func == (lhs: Self, rhs: Self) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }

    func replacingWindow(_ window: TDWindow) -> Self {
        .init(id: id, title: title, category: category, window: window, source: source,
              domain: domain, attribute: attribute, facet: facet, contextDimension: contextDimension,
              heroDimension: heroDimension, referenceDate: referenceDate, timeZoneID: timeZoneID, target: target)
    }

    func selectingPeriod(_ period: TDCardDetailPeriod) -> Self {
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: timeZoneID) ?? calendar.timeZone
        return replacingWindow(period.window(original: window, referenceDate: referenceDate, calendar: calendar))
    }
}

extension TasteDetailPeriod {
    func tdWindow(referenceDate: Date, calendar: Calendar) -> TDWindow {
        guard let range = range(referenceDate: referenceDate, calendar: calendar) else { return .all }
        return .init(label: title, start: range.start, end: range.end)
    }

}

/// The source card's exact dates remain selectable alongside rolling calendar periods.
enum TDCardDetailPeriod: Hashable, Identifiable {
    case original
    case preset(TasteDetailPeriod)

    var id: Self { self }

    func title(original: TDWindow) -> String {
        switch self {
        case .original: original.isAll ? "전체" : original.label
        case .preset(let period): period.title
        }
    }

    func window(original: TDWindow, referenceDate: Date, calendar: Calendar) -> TDWindow {
        switch self {
        case .original: original
        case .preset(let period): period.tdWindow(referenceDate: referenceDate, calendar: calendar)
        }
    }

    static func options(original: TDWindow, referenceDate: Date, calendar: Calendar) -> [Self] {
        var options = TasteDetailPeriod.allCases.map(Self.preset)
        if let index = options.firstIndex(where: {
            let candidate = $0.window(original: original, referenceDate: referenceDate, calendar: calendar)
            return candidate.start == original.start && candidate.end == original.end
        }) {
            options[index] = .original
        } else {
            options.insert(.original, at: 0)
        }
        return options
    }
}

struct TDCardDetailPeriodPicker: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Binding var selection: TDCardDetailPeriod
    let request: TDCardDetailRequest
    let axis: TasteAxis?

    var body: some View {
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: request.timeZoneID) ?? calendar.timeZone
        let options = TDCardDetailPeriod.options(original: request.window, referenceDate: request.referenceDate, calendar: calendar)
        return Group {
            if dynamicTypeSize.isAccessibilitySize {
                Picker("기간", selection: $selection) {
                    ForEach(options) { period in Text(period.title(original: request.window)).tag(period) }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: .infinity, minHeight: 44)
                .padding(.horizontal, TBSpacing.page)
                .padding(.bottom, TBSpacing.x12)
            } else {
                ViewThatFits(in: .horizontal) {
                    tabs(options).fixedSize(horizontal: true, vertical: false)
                    ScrollView(.horizontal) { tabs(options) }
                        .scrollIndicators(.hidden)
                }
            }
        }
        .accessibilityIdentifier("taste-detail-periods")
    }

    @ViewBuilder private func tabs(_ options: [TDCardDetailPeriod]) -> some View {
        if let axis {
            TBCapsuleTabs(options: options, selection: $selection,
                          selectedForeground: axis.tintSurfaceTextColor,
                          selectedBackground: axis.tintColor,
                          selectedBorder: axis.borderDefaultColor) { $0.title(original: request.window) }
        } else {
            TBCapsuleTabs(options: options, selection: $selection) { $0.title(original: request.window) }
        }
    }
}

struct TDCardDetailResolution {
    var selection: TDDetailSelection?
    var discovery: HomeDiscoveryCard?
}

/// Uses the same engine as the source cards, including their denominator and source scope.
enum TDCardDetailResolver {
    static func resolve(_ request: TDCardDetailRequest, input: TDNativeInput,
                        account: UUID? = nil) -> TDCardDetailResolution {
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: request.timeZoneID) ?? calendar.timeZone
        let state = TDDataEngine.prepare(records: input.records, observations: input.observations,
                                         window: request.window, now: request.referenceDate, calendar: calendar,
                                         issues: input.issues, sourceFilter: request.source)
        switch request.target {
        case .discovery(let id):
            var card = HomeDiscoveryEngine.gastronomyCards(input: input, state: state, calendar: calendar).first { $0.id == id }
            card?.accountGeneration = account
            return .init(discovery: card)
        case .metric(let metricID, let rowID):
            let result = TDDataEngine.result(state, category: request.category, domain: request.domain,
                                             attribute: request.attribute, facet: request.facet, calendar: calendar,
                                             contextDimension: request.contextDimension, heroDimension: request.heroDimension)
            let card: TDCard?
            if let dimension = TDDimension.allCases.first(where: { "first/" + $0.id == metricID || "repeat/" + $0.id == metricID }) {
                card = TDDataEngine.eventCard(state, dimension: dimension, first: metricID.hasPrefix("first/"), calendar: calendar)
            } else if metricID == "hero" {
                card = .init(id: "hero", title: request.title, meaning: state.window.range(calendar: calendar), rows: result.hero)
            } else if metricID == "unknown-records" || metricID == "all-records" {
                let unknown = metricID == "unknown-records"
                let records = unknown ? state.records.filter { state.unknownDateIDs.contains($0.id) } : state.selected
                var proof = TDDataEngine.bundle(state)
                proof.add(unknown ? .unresolved : .denominator, TDDataEngine.evidence(records))
                if unknown { proof.period = .all; proof.sourceFilter = .all }
                card = .init(id: metricID, title: request.title, meaning: proof.period.range(calendar: calendar),
                             rows: [.init(id: "records", title: "요리 기록", value: "\(records.count)개",
                                          entryIDs: TDDataEngine.ids(records), evidence: proof)], evidence: proof)
            } else {
                card = result.cards.first { $0.id == metricID }
            }
            guard let card else { return .init() }
            let row = rowID.flatMap { id in card.rows.first { $0.id == id } }
            guard rowID == nil || row != nil else { return .init() }
            return .init(selection: .init(id: request.id, title: row?.title ?? card.title,
                                          meaning: row?.value ?? card.meaning, note: row?.detail ?? card.note,
                                          rows: row.map { [$0] } ?? card.rows, metricID: metricID, rowID: rowID,
                                          evidence: row?.evidence ?? card.evidence))
        }
    }
}

private struct TDCardDetailInputKey: Equatable {
    let requestID: UUID
    let entries: [DiningEntry]
    let analysis: SensoryAnalysisSnapshot
    let account: UUID
    let period: TDCardDetailPeriod
}

struct TDCategoryCardDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    let request: TDCardDetailRequest
    @State private var selectedPeriod: TDCardDetailPeriod = .original
    @State private var loadedKey: TDCardDetailInputKey?
    @State private var resolution: TDCardDetailResolution?

    private var key: TDCardDetailInputKey {
        .init(requestID: request.id, entries: appModel.diningEntries,
              analysis: appModel.sensoryAnalysis, account: appModel.memoryAccountGeneration,
              period: selectedPeriod)
    }
    private var current: TDCardDetailResolution? { loadedKey == key ? resolution : nil }
    var body: some View {
        Group {
            switch request.target {
            case .metric:
                TDDataDetailView(request: .init(title: request.title, meaning: "", note: "", rows: []),
                                 selectedPeriod: $selectedPeriod,
                                 periodRequest: request,
                                 axis: request.category.routeKind.axis,
                                 resolve: { current?.selection }, isUpdating: { current == nil })
            case .discovery:
                TDDiscoveryDetailView(selectedPeriod: $selectedPeriod,
                                      periodRequest: request,
                                      axis: request.category.routeKind.axis,
                                      resolve: { current?.discovery }, isUpdating: { current == nil })
            }
        }
        .task(id: key) { await refresh(key) }
        .accessibilityIdentifier("taste-category-card-detail")
    }

    @MainActor private func refresh(_ key: TDCardDetailInputKey) async {
        let activeRequest = request.selectingPeriod(key.period)
        let worker = Task.detached(priority: .userInitiated) {
            let input = TDNativeAdapter.inputs(entries: key.entries, snapshot: key.analysis, now: activeRequest.referenceDate)
            return TDCardDetailResolver.resolve(activeRequest, input: input, account: key.account)
        }
        let value = await withTaskCancellationHandler(operation: { await worker.value }, onCancel: { worker.cancel() })
        guard !Task.isCancelled, key == self.key else { return }
        resolution = value
        loadedKey = key
    }
}
