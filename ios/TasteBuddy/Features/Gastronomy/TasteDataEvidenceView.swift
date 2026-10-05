import SwiftUI

struct TDDataDetailView: View {
    let request: TDDetailSelection
    @Binding var selectedPeriod: TDCardDetailPeriod
    let periodRequest: TDCardDetailRequest
    let axis: TasteAxis?
    let resolve: () -> TDDetailSelection?
    let isUpdating: () -> Bool
    @State private var plotRowID: String?
    @State private var overviewLimit = 40

    var body: some View {
        TasteDetailPage(title: request.title) {
            TDCardDetailPeriodPicker(selection: $selectedPeriod, request: periodRequest, axis: axis)
        } content: {
            if let selection = resolve() {
                overview(selection)
            } else {
                Group {
                    if isUpdating() { ProgressView("불러오는 중") }
                    else { Text("현재 기록이 없어요").tbTextStyle(.body) }
                }.frame(maxWidth: .infinity, minHeight: 180)
            }
        }
        .onChange(of: selectedPeriod) { _, _ in
            plotRowID = nil
        }
    }
    private func overview(_ selection: TDDetailSelection) -> some View {
        VStack(spacing: TBSpacing.x20) {
            TasteDetailChartPanel {
                TasteDetailScope(text: TDDetailPresentation.scope(selection.evidence))
                    .frame(maxWidth: .infinity).accessibilityIdentifier("taste-data-detail-title")
                if selection.rows.isEmpty {
                    Text("—").font(TBFont.bold(18)).foregroundStyle(TBColor.textHint)
                        .frame(maxWidth: .infinity, minHeight: 150)
                    Text("기록 없음").font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                        .frame(maxWidth: .infinity)
                } else {
                    let rows = selection.rows
                    let usesSingleScope = rows.contains { !$0.segments.isEmpty || $0.comparison != nil }
                    if usesSingleScope, rows.count > 1 {
                        Picker("비교 항목", selection: Binding(get: { rows.first { $0.id == plotRowID }?.id ?? rows[0].id }, set: { plotRowID = $0 })) {
                            ForEach(rows) { row in Text(row.title).tag(row.id) }
                        }.pickerStyle(.menu).frame(minHeight: 44).tint(TBColor.textPrimary)
                    }
                    let row = rows.first { $0.id == plotRowID } ?? rows[0]
                    let points = TDDetailPresentation.points(rows: rows, selected: row)
                    if let status = TDDetailPresentation.status(row) { TasteDetailScope(text: status) }
                    if !points.isEmpty {
                        if usesSingleScope {
                            if rows.count == 1 { Text(row.title).font(TBFont.medium(13)).foregroundStyle(TBColor.textSecondary) }
                            Text(row.value).font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                        }
                        TasteDetailBarPlot(points: points)
                            .accessibilityIdentifier("taste-data-detail-plot")
                        if !usesSingleScope && rows.count > points.count {
                            TasteDetailScope(text: "상위 \(points.count)개 · 식사 횟수")
                        }
                    } else {
                        Text(row.title).font(TBFont.medium(13)).foregroundStyle(TBColor.textSecondary)
                        Text(row.value).font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                            .frame(minHeight: 72, alignment: .topLeading)
                    }
                }
            }
            if selection.metricID == "meals", let row = selection.rows.first {
                TasteDetailGroup {
                    TasteDetailValueRow(title: "요리 기록", value: "\(row.entryIDs.count)개", showsDivider: false)
                        .accessibilityIdentifier("taste-data-detail-row-" + row.id)
                }.padding(.horizontal, TBSpacing.page)
            } else if !selection.rows.isEmpty {
                TasteDetailGroup {
                    ForEach(Array(selection.rows.prefix(overviewLimit).enumerated()), id: \.element.id) { index, row in
                        VStack(spacing: 0) {
                            TasteDetailValueRow(title: row.title, value: row.value, showsDivider: index > 0)
                            if let status = TDDetailPresentation.status(row) {
                                TasteDetailScope(text: status)
                                    .padding(.horizontal, TBSpacing.x16).padding(.bottom, TBSpacing.x12)
                            }
                        }.accessibilityIdentifier("taste-data-detail-row-" + row.id)
                    }
                    if selection.rows.count > overviewLimit {
                        Button("더 보기") { overviewLimit += 40 }.font(TBFont.medium(12)).frame(maxWidth: .infinity, minHeight: 48)
                    }
                }.padding(.horizontal, TBSpacing.page)
            }
        }.padding(.bottom, TBSpacing.page)
    }
}

/// Presentation only: never sum overlapping conditions or coerce unknown values to zero.
enum TDDetailPresentation {
    static func status(_ row: TDRow) -> String? {
        if row.evidence.conditions["catalogComparable"] == "false" { return "비교 기준 확인 필요" }
        if row.evidence.conditions["conditionsConfirmed"] == "false" { return "조건 미확인" }
        return status(row.state)
    }
    static func status(_ state: TDCardState) -> String? {
        switch state {
        case .ready, .zeroOccurrences: nil
        case .emptyArchive: "기록 없음"
        case .missingResponse: "응답 없음"
        case .unresolvedIdentity: "연결 미확인"
        case .insufficientComparison: "비교 부족"
        case .invalidEvidence: "응답 확인 필요"
        case .updating: "갱신 중"
        case .failed: "불러오기 실패"
        }
    }
    static func scope(_ evidence: TDEvidenceBundle) -> String {
        var calendar = Calendar.current
        if let zone = TimeZone(identifier: evidence.timeZone) { calendar.timeZone = zone }
        let period = evidence.comparisonPeriod.map { $0.range(calendar: calendar) + " ↔ " + evidence.period.range(calendar: calendar) }
            ?? evidence.period.range(calendar: calendar)
        var labels = [period, evidence.unit.rawValue + " 기준"]
        if evidence.sourceFilter != .all { labels.append(evidence.sourceFilter.rawValue) }
        if let scale = evidence.scale, let facet = TDFacet.allCases.first(where: { $0.scale == scale }) {
            labels.append(facet.title)
        }
        return labels.joined(separator: " · ")
    }
    static func points(rows: [TDRow], selected row: TDRow) -> [TasteDetailPlotPoint] {
        if let comparison = row.comparison {
            func point(_ id: String, value: Int?, denominator: Int?, state: TDCardState) -> TasteDetailPlotPoint {
                guard row.evidence.conditions["catalogComparable"] != "false",
                      state == .ready || state == .zeroOccurrences,
                      let value, value >= 0 else {
                    return .init(id: id, label: id, value: nil, valueLabel: "—")
                }
                if comparison.beforeDenominator != nil || comparison.afterDenominator != nil {
                    guard let denominator, denominator > 0, value <= denominator else {
                        return .init(id: id, label: id, value: nil, valueLabel: "—")
                    }
                    let percentage = Double(value) / Double(denominator) * 100
                    return .init(id: id, label: id, value: percentage,
                                 valueLabel: "\(value)/\(denominator) · " + String(format: "%.0f%%", percentage))
                }
                return .init(id: id, label: id, value: Double(value), valueLabel: String(value))
            }
            return [point("이전", value: comparison.before, denominator: comparison.beforeDenominator, state: comparison.beforeState),
                    point("최근", value: comparison.after, denominator: comparison.afterDenominator, state: comparison.afterState)]
        }
        // Paired evaluation rows stay side by side in the value list; one period alone is not a change chart.
        if rows.contains(where: { $0.id.hasSuffix(":before") }) { return [] }
        if !row.segments.isEmpty {
            return row.segments.map { .init(id: $0.key, label: $0.label, value: Double($0.count), valueLabel: String($0.count)) }
        }
        guard rows.count > 1, rows.contains(where: { $0.amount != nil }) else { return [] }
        return rows.prefix(6).map { .init(id: $0.id, label: $0.title, value: $0.amount,
                                        valueLabel: $0.count.map(String.init) ?? $0.value) }
    }
}

struct TDDiscoveryDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    @Binding var selectedPeriod: TDCardDetailPeriod
    let periodRequest: TDCardDetailRequest
    let axis: TasteAxis?
    let resolve: () -> HomeDiscoveryCard?
    let isUpdating: () -> Bool
    var body: some View {
        let card = resolve()
        TasteDetailPage(title: "발견") {
            TDCardDetailPeriodPicker(selection: $selectedPeriod, request: periodRequest, axis: axis)
        } content: {
            if let card {
                TasteDiscoverySummary(card: card)
            } else {
                Group {
                    if isUpdating() { ProgressView("불러오는 중") }
                    else { Text("이 기간의 발견이 없어요").tbTextStyle(.body) }
                }.frame(maxWidth: .infinity, minHeight: 180)
            }
        }
        .task(id: card?.semanticKey) { if let card { appModel.markGastronomyDiscoveryRead(card) } }
    }
}

private struct TDEvidenceOption: Identifiable {
    let id: String
    let title: String
    let refs: TDEvidenceIDs
}

struct TDEvidenceContent: View {
    @EnvironmentObject private var appModel: AppModel
    let selection: TDDetailSelection
    @State private var groupID = "all"
    @State private var selectedEntryID: UUID?
    @State private var displayLimit = 30
    private var evidence: TDEvidenceBundle {
        var result = selection.evidence
        for row in selection.rows { result.merge(row.evidence) }
        return result
    }
    private var options: [TDEvidenceOption] {
        let bundle = evidence
        var result = [TDEvidenceOption(id: "all", title: "전체 연결 원본", refs: bundle.all)]
        for role in TDEvidenceRole.allCases {
            if let refs = bundle.roles[role] { result.append(.init(id: role.id, title: role.rawValue, refs: refs)) }
        }
        for name in bundle.groups.keys.sorted() {
            result.append(.init(id: "group:" + name, title: name, refs: bundle.groups[name]!))
        }
        for row in selection.rows {
            for segment in row.segments where segment.count > 0 {
                result.append(.init(id: TDDataEngine.key([row.id, segment.key]), title: row.title + " · " + segment.label, refs: segment.evidence))
            }
        }
        if !result.contains(where: { $0.id == groupID }) {
            result.append(.init(id: groupID, title: "선택한 근거는 현재 없음", refs: .empty))
        }
        return result
    }
    private var currentRefs: TDEvidenceIDs { options.first { $0.id == groupID }?.refs ?? .empty }
    private var documents: [FoodMemoryDocument] {
        let refs = currentRefs
        let current = HomeArchiveIdentity.entries(appModel.diningEntries, asOf: .now).filter { refs.entryIDs.contains($0.id.uuidString) }
        let indexed = Dictionary(uniqueKeysWithValues: appModel.foodMemoryIndex.documents.map { ($0.id, $0) })
        return current.map { entry in
            if let document = indexed[entry.id], document.entry == entry { return document }
            return FoodMemoryDocument(entry: entry,
                                      observations: appModel.sensoryAnalysis.observations.filter { $0.experienceID == entry.id && $0.sourceRevision == entry.memoryRevisionNumber },
                                      unresolved: [], searchableFields: [], isGeneratedNote: true)
        }.sorted {
            let left = $0.entry.confirmedMealDate ?? .distantPast, right = $1.entry.confirmedMealDate ?? .distantPast
            return left == right ? $0.id.uuidString < $1.id.uuidString : left > right
        }
    }
    var body: some View {
        LazyVStack(alignment: .leading, spacing: TBSpacing.x16) {
            TasteDetailScope(text: TDDetailPresentation.scope(evidence))
            Picker("확인할 근거 범위", selection: $groupID) {
                ForEach(options) { option in
                    Text(option.title).tag(option.id)
                }
            }.pickerStyle(.menu).frame(minHeight: 44).tint(TBColor.textPrimary).accessibilityIdentifier("taste-data-evidence-role")
            Text("식사 \(Set(documents.map { $0.entry.mealID }).count)회 · 요리 \(documents.count)개").font(TBFont.medium(12)).foregroundStyle(TBColor.textSecondary)
            ForEach(Array(documents.prefix(displayLimit))) { document in
                VStack(alignment: .leading, spacing: TBSpacing.x8) {
                    Button { selectedEntryID = document.id } label: { FoodMemoryRow(document: document) }.buttonStyle(.plain)
                    let used = document.observations.filter { currentRefs.observationIDs.contains($0.id) }
                    ForEach(used) { observation in
                        if let response = observation.selectionEvidence {
                            Text(response.labelSnapshot + " · " + response.labelValue).tbTextStyle(.caption)
                                .padding(TBSpacing.x8).frame(maxWidth: .infinity, alignment: .leading)
                                .background(TBColor.mutedSurface, in: RoundedRectangle(cornerRadius: TBRadius.card))
                        }
                    }

                }
            }
            if documents.count > displayLimit { Button("원본 더 보기") { displayLimit += 30 }.frame(minHeight: 44) }
            if documents.isEmpty { Text("이 범위의 기록이 없어요").tbTextStyle(.body) }
            TasteDetailDisclosure() {
                if let comparison = evidence.comparisonPeriod {
                    TasteDetailScope(text: "비교 기간 · " + comparison.range(calendar: .current))
                }
                if !evidence.timeZone.isEmpty { TasteDetailScope(text: evidence.timeZone) }
                ForEach(evidence.conditions.keys.sorted(), id: \.self) { key in
                    if ["target", "phase", "intensity"].contains(key) {
                        Text(conditionTitle(key) + " · " + TDDataEngine.conditionLabel(evidence.conditions[key]!))
                    }
                }
                if !evidence.overlappingMealIDs.isEmpty { Text("조건 간 중복 · 식사 \(evidence.overlappingMealIDs.count)회") }
                ForEach(selection.rows) { row in
                    if !row.detail.isEmpty { Text(row.title + " · " + row.detail) }
                }
            }
        }.tbPageContentPadding()
        .onChange(of: groupID) { _, _ in displayLimit = 30 }
        .sheet(isPresented: Binding(get: { selectedEntryID != nil }, set: { if !$0 { selectedEntryID = nil } })) {
            if let selectedEntryID { FoodMemoryDetailView(entryID: selectedEntryID).environmentObject(appModel) }
        }
    }
    private func scaleLabel(_ value: String) -> String {
        TDFacet.allCases.first { $0.scale == value }?.title ?? "확인되지 않은 척도"
    }
    private func conditionTitle(_ value: String) -> String {
        ["target":"느낀 부위", "phase":"먹는 시점", "intensity":"연결된 강도"][value] ?? value
    }
}
