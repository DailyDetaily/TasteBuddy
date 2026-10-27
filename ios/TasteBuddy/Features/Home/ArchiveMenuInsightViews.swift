import SwiftUI

enum HomeArchiveMenuMetricKind: String, CaseIterable, Identifiable {
    case exploration = "menu-exploration", repeated = "repeat-menu", satisfaction = "new-menu-satisfaction"
    var id: String { rawValue }
    var title: String {
        switch self {
        case .exploration: "새로운 메뉴 탐험"
        case .repeated: "다시 찾은 한 접시"
        case .satisfaction: "새 메뉴 만족도"
        }
    }
    var axis: TasteAxis {
        switch self { case .exploration: .sweet; case .repeated: .salty; case .satisfaction: .sour }
    }
    var period: String { self == .repeated ? "전체 기간" : "최근 30일 · 오늘 포함" }
    var meaning: String {
        switch self {
        case .exploration:
            "확인된 식사일과 현지 시간 기준이에요. 같은 식당의 같은 메뉴를 한 번만 세요. 처음 먹었다는 뜻이 아닌 앱의 첫 기록이에요. 이전 기록의 날짜가 불명확하면 첫 기록으로 확정하지 않아요."
        case .repeated:
            "같은 식당의 같은 메뉴를 기록한 서로 다른 식사 수 TOP 3예요. 식사일 미확인 기록도 포함해요. 같은 식사의 여러 요리는 반복을 늘리지 않으며, 횟수를 호감으로 해석하지 않아요."
        case .satisfaction:
            "최근 30일에 처음 기록한 메뉴의 첫 식사 별점만 비교해요. 유효한 0.5~5점 별점이 있는 메뉴가 분모, 4점 이상이 분자예요. 첫날 여러 식사의 순서나 별점이 불명확하면 제외해요. 미평가·이전 5단계 평가는 별점으로 바꾸지 않아요."
        }
    }
}

struct HomeArchiveMenuMetricCard: View {
    let kind: HomeArchiveMenuMetricKind
    let insights: HomeArchiveMenuInsights
    var onTap: (() -> Void)?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HomePeriodInsightCard(data: presentation, onTap: onTap, labelOverride: kind.title,
                              legend: legend, visualization: AnyView(HomeArchiveMenuMiniGraph(kind: kind, insights: insights)))
            .accessibilityIdentifier("home-archive-metric-" + kind.rawValue)
    }

    private var presentation: HomePeriodInsightCardData {
        let title: String, detail: String, graphHasData: Bool
        let partial = insights.unknownDateCount > 0 || insights.unlinkedMenuCount > 0 || !insights.uncertainMenus.isEmpty
        switch kind {
        case .exploration:
            graphHasData = !insights.newMenus.isEmpty || !insights.familiarMenus.isEmpty
            title = !graphHasData && partial ? "첫 기록 확인 필요" : "첫 기록 \(insights.newMenus.count)가지"
            detail = "기존 메뉴 \(insights.familiarMenus.count)가지\n최근 30일 · 앱 기록 기준"
        case .repeated:
            graphHasData = !insights.repeatedMenus.isEmpty
            if let first = insights.repeatedMenus.first {
                title = first.label.components(separatedBy: " · ").first ?? first.label
                detail = "서로 다른 식사 \(first.mealCount)번\n전체 기간 · 상위 3개"
            } else {
                title = insights.unlinkedMenuCount > 0 ? "메뉴 연결 확인 필요" : "아직 반복 메뉴 없음"
                detail = "같은 메뉴를 다시 기록하면 보여요\n전체 기간 · 상위 3개"
            }
        case .satisfaction:
            graphHasData = insights.ratedCount > 0
            title = graphHasData ? "\(insights.ratedCount)가지 중 \(insights.satisfiedMenus.count)가지"
                : !insights.ambiguousRatingMenus.isEmpty ? "첫 평가 확인 필요" : "아직 별점 없음"
            detail = graphHasData ? "첫 식사에서 4점 이상\n최근 30일" : "새 메뉴의 첫 별점을 기다려요\n최근 30일 · 첫 식사 기준"
        }
        return .init(kind: kind == .exploration ? .newExperiences : kind == .repeated ? .repeatPatterns : .tasteClue,
                     title: title, detail: detail, supportingText: kind.meaning, stats: [], chartValues: [],
                     accentAxis: kind.axis, state: graphHasData ? .populated : partial ? .insufficient : .empty,
                     category: kind == .satisfaction ? .preference : .experience)
    }

    private var legend: [TBSummaryCardLegendItem] {
        func color(_ axis: TasteAxis) -> Color { TBMiniChartColor.color(axis, tint: 40, mode: TBColorMode(colorScheme)) }
        var items: [TBSummaryCardLegendItem] = []
        switch kind {
        case .exploration:
            items = [.init(id: "new", label: "첫 기록 \(insights.newMenus.count)가지", color: color(.sweet)),
                     .init(id: "familiar", label: "기존 \(insights.familiarMenus.count)가지", color: color(.umami))]
        case .repeated:
            items = insights.repeatedMenus.enumerated().map { index, menu in
                .init(id: menu.id, label: "\(index + 1). \(menu.label) · \(menu.mealCount)번", color: color(.salty))
            }
        case .satisfaction:
            if insights.ratedCount > 0 {
                items = [.init(id: "satisfied", label: "4점 이상 \(insights.satisfiedMenus.count)가지", color: color(.sour)),
                         .init(id: "below", label: "4점 미만 \(insights.belowThresholdMenus.count)가지", color: TBColorMode(colorScheme).chartRemainder)]
            }
            if !insights.unratedMenus.isEmpty { items.append(.init(id: "unrated", label: "첫 별점 없음 \(insights.unratedMenus.count)가지")) }
            if !insights.ambiguousRatingMenus.isEmpty { items.append(.init(id: "ambiguous", label: "첫 평가 확인 필요 \(insights.ambiguousRatingMenus.count)가지")) }
        }
        if kind != .repeated {
            if !insights.uncertainMenus.isEmpty { items.append(.init(id: "uncertain", label: "첫 기록 여부 미확인 \(insights.uncertainMenus.count)가지")) }
            if insights.unknownDateCount > 0 { items.append(.init(id: "undated", label: "식사일 미확인 \(insights.unknownDateCount)개")) }
        }
        if insights.unlinkedMenuCount > 0 { items.append(.init(id: "unlinked", label: "메뉴 연결 미확인 \(insights.unlinkedMenuCount)개")) }
        return items
    }
}

struct HomeArchiveMenuMiniGraph: View {
    let kind: HomeArchiveMenuMetricKind
    let insights: HomeArchiveMenuInsights
    var body: some View {
        Group {
            switch kind {
            case .exploration:
                if !insights.newMenus.isEmpty || !insights.familiarMenus.isEmpty {
                    TBMiniBubbleChart(items: [.init(value: Double(insights.newMenus.count), axis: .sweet),
                                             .init(value: Double(insights.familiarMenus.count), axis: .umami)])
                }
            case .repeated:
                if !insights.repeatedMenus.isEmpty {
                    TBMiniChart(values: insights.repeatedMenus.map { Double($0.mealCount) }, axis: .salty, highlightsEachValue: true)
                }
            case .satisfaction:
                if let percent = insights.satisfactionPercent {
                    TBMiniPieChart(segments: [.init(value: percent, axis: .sour)], absolute: true)
                }
            }
        }.frame(width: TBMiniChartMetrics.width, height: TBMiniChartMetrics.height)
    }
}

struct HomeArchiveMenuMetricDetailView: View {
    let kind: HomeArchiveMenuMetricKind
    @EnvironmentObject private var appModel: AppModel
    @State private var selectedEntryIDs: Set<UUID>?
    @State private var openedEntryID: UUID?
    @Environment(\.colorScheme) private var colorScheme
    private struct GroupRow: Identifiable {
        let id: String
        let title: String
        let value: String
        let entryIDs: Set<UUID>
    }
    private func rows(_ data: HomeArchiveMenuInsights) -> [GroupRow] {
        func row(_ id: String, _ title: String, _ menus: [HomeArchiveMenuInsights.Menu], firstOnly: Bool = false) -> GroupRow {
            .init(id: id, title: title, value: "\(menus.count)가지",
                  entryIDs: Set(menus.flatMap { firstOnly ? $0.firstEntryIDs : $0.entryIDs }.compactMap(UUID.init(uuidString:))))
        }
        var result: [GroupRow]
        switch kind {
        case .exploration:
            result = [row("new", "처음 기록한 메뉴", data.newMenus), row("familiar", "이전부터 기록한 메뉴", data.familiarMenus)]
        case .repeated:
            result = data.repeatedMenus.map {
                .init(id: $0.id, title: $0.label, value: "\($0.mealCount)번의 식사",
                      entryIDs: Set($0.entryIDs.compactMap(UUID.init(uuidString:))))
            }
        case .satisfaction:
            result = [row("satisfied", "첫 식사에서 4점 이상", data.satisfiedMenus, firstOnly: true),
                      row("below", "첫 식사에서 4점 미만", data.belowThresholdMenus, firstOnly: true)]
            if !data.unratedMenus.isEmpty { result.append(row("unrated", "첫 별점 없음", data.unratedMenus, firstOnly: true)) }
            if !data.ambiguousRatingMenus.isEmpty { result.append(row("ambiguous", "첫 평가 확인 필요", data.ambiguousRatingMenus, firstOnly: true)) }
        }
        if kind != .repeated {
            if !data.uncertainMenus.isEmpty { result.append(row("uncertain", "첫 기록 여부 미확인", data.uncertainMenus)) }
            if data.unknownDateCount > 0 {
                result.append(.init(id: "undated", title: "식사일 미확인", value: "\(data.unknownDateCount)개",
                                    entryIDs: Set(data.unknownDateEntryIDs.compactMap(UUID.init(uuidString:)))))
            }
        }
        if data.unlinkedMenuCount > 0 {
            result.append(.init(id: "unlinked", title: "메뉴 연결 미확인", value: "\(data.unlinkedMenuCount)개",
                                entryIDs: Set(data.unlinkedMenuEntryIDs.compactMap(UUID.init(uuidString:)))))
        }
        return result
    }

    private func detailGraph(_ data: HomeArchiveMenuInsights) -> some View {
        func color(_ axis: TasteAxis) -> Color { TBMiniChartColor.color(axis, tint: 40, mode: TBColorMode(colorScheme)) }
        func select(_ id: String) { selectedEntryIDs = rows(data).first { $0.id == id }?.entryIDs }
        return TasteDetailChartPanel {
            TasteDetailScope(text: kind.period)
            switch kind {
            case .exploration:
                Text(data.newMenus.isEmpty && data.familiarMenus.isEmpty && (!data.uncertainMenus.isEmpty || data.unknownDateCount > 0 || data.unlinkedMenuCount > 0)
                     ? "첫 기록 확인 필요" : "첫 기록 \(data.newMenus.count)가지").font(TBFont.bold(28)).foregroundStyle(TBColor.textPrimary)
                TasteDetailCompositionChart(items: [
                    .init(id: "new", label: "처음 기록한 메뉴", value: Double(data.newMenus.count), color: color(.sweet)),
                    .init(id: "familiar", label: "이전부터 기록한 메뉴", value: Double(data.familiarMenus.count), color: color(.umami))
                ], style: .bubbles, unit: "가지", onSelect: select)
                if !data.uncertainMenus.isEmpty { TasteDetailScope(text: "첫 기록 여부 미확인 \(data.uncertainMenus.count)가지 별도") }
            case .repeated:
                Text("다시 기록한 메뉴 TOP 3").font(TBFont.semibold(18)).foregroundStyle(TBColor.textPrimary)
                if data.repeatedMenus.isEmpty {
                    Text("아직 반복 메뉴가 없어요").font(TBFont.regular(13)).foregroundStyle(TBColor.textHint)
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    TasteDetailCompositionChart(items: data.repeatedMenus.map {
                        .init(id: $0.id, label: $0.label, value: Double($0.mealCount), color: color(.salty), axis: .salty)
                    }, style: .ranking, unit: "회", onSelect: select)
                }
                TasteDetailScope(text: "같은 메뉴를 기록한 서로 다른 식사 수")
            case .satisfaction:
                Text(data.ratedCount > 0 ? "\(data.ratedCount)가지 중 \(data.satisfiedMenus.count)가지"
                     : !data.ambiguousRatingMenus.isEmpty ? "첫 평가 확인 필요" : "아직 별점 없음")
                    .font(TBFont.semibold(18)).foregroundStyle(TBColor.textPrimary)
                TasteDetailCompositionChart(items: [
                    .init(id: "satisfied", label: "첫 식사에서 4점 이상", value: Double(data.satisfiedMenus.count), color: color(.sour)),
                    .init(id: "below", label: "첫 식사에서 4점 미만", value: Double(data.belowThresholdMenus.count), color: TBColorMode(colorScheme).chartRemainder)
                ], unit: "가지", centerValue: data.satisfactionPercent.map { String(format: "%.0f%%", $0) },
                   centerLabel: "첫 식사에서 4점 이상", onSelect: select)
                TasteDetailScope(text: data.ratedCount > 0 ? "첫 식사의 유효한 별점이 있는 새 메뉴 기준" : "첫 식사의 유효한 별점을 기다리고 있어요")
            }
        }
    }

    var body: some View {
        TasteDetailPage(title: kind.title) {
            TasteDetailScope(text: kind.period)
        } content: {
            VStack(alignment: .leading, spacing: TBSpacing.x20) {
                if appModel.sensoryAnalysisIsUpdating || appModel.backendSessionStatus == .restoring {
                    ProgressView("현재 계정의 기록을 불러오고 있어요").frame(maxWidth: .infinity, minHeight: 180)
                } else if let error = appModel.sensoryAnalysisError {
                    SensoryAnalysisStatusCard(state: .failed(error))
                    Button("다시 시도") { Task { await appModel.syncAccountData(); appModel.refreshSensoryAnalysis() } }.frame(minHeight: 44)
                } else if let data = appModel.homeArchivePresentation?.menuInsights {
                    detailGraph(data)
                    VStack(alignment: .leading, spacing: TBSpacing.x20) {
                    AccountDataSyncNotice()
                    Text(kind.meaning).tbTextStyle(.body).foregroundStyle(TBColor.textSecondary)
                    let groups = rows(data)
                    TasteDetailGroup {
                        ForEach(Array(groups.enumerated()), id: \.element.id) { index, row in
                            Button { selectedEntryIDs = row.entryIDs } label: {
                                TasteDetailValueRow(title: row.title, value: row.value, showsDivider: index > 0)
                            }.buttonStyle(.plain)
                        }
                    }
                    HStack {
                        Text("관련 원본 기록").tbTextStyle(.subsectionTitle)
                        Spacer()
                        if selectedEntryIDs != nil {
                            Button("전체 근거 보기") { selectedEntryIDs = nil }.font(TBFont.regular(12)).frame(minHeight: 44)
                        }
                    }
                    let ids = selectedEntryIDs ?? Set(groups.flatMap(\.entryIDs))
                    let entries = appModel.diningEntries.filter { ids.contains($0.id) }
                        .sorted { $0.id.uuidString < $1.id.uuidString }
                    ForEach(entries) { entry in
                        Button { openedEntryID = entry.id } label: {
                            SectionCard {
                                VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                    Text(entry.menu).tbTextStyle(.subsectionTitle)
                                    Text(entry.restaurant).tbTextStyle(.caption)
                                    Text(entry.memoryDateDescription).tbTextStyle(.caption)
                                    Text("원본 열기 · 수정").tbTextStyle(.caption)
                                }.frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }.buttonStyle(.plain)
                    }
                    if entries.isEmpty { Text("현재 범위에 연결된 원본 기록이 없어요.").tbTextStyle(.caption) }
                    }.padding(.horizontal, TBSpacing.page)
                } else {
                    Text("기록을 확인하고 있어요").tbTextStyle(.body).padding(TBSpacing.page)
                }
            }.padding(.bottom, TBSpacing.page)
        }
        .sheet(isPresented: Binding(get: { openedEntryID != nil }, set: { if !$0 { openedEntryID = nil } })) {
            if let openedEntryID { FoodMemoryDetailView(entryID: openedEntryID) }
        }
        .onChange(of: appModel.memorySourceFingerprint) { _, _ in selectedEntryIDs = nil }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in selectedEntryIDs = nil; openedEntryID = nil }
    }
}

/// Recent source records replace the second record-count chart on Home.
struct HomeRecentArchiveRecords: View {
    @EnvironmentObject private var appModel: AppModel
    var onOpenAll: (() -> Void)?
    @State private var openedEntryID: UUID?
    var body: some View {
        if !appModel.sensoryAnalysisIsUpdating, appModel.sensoryAnalysisError == nil,
           appModel.backendSessionStatus != .restoring,
           let archive = appModel.homeArchivePresentation {
            let validIDs = Set(archive.gastronomyState.records.map(\.id))
            let entries = archive.sourceEntries.filter { validIDs.contains($0.id.uuidString) }.sorted {
                let lhs = $0.savedAt ?? $0.observedAt, rhs = $1.savedAt ?? $1.observedAt
                return lhs == rhs ? $0.id.uuidString < $1.id.uuidString : lhs > rhs
            }
            TBPageSection(title: "최근 기록") {
                if entries.isEmpty {
                    HomeJournalEmptyState()
                } else {
                    VStack(spacing: TBSpacing.x12) {
                        ForEach(Array(entries.prefix(3))) { entry in
                            Button { openedEntryID = entry.id } label: {
                                SectionCard {
                                    HStack(spacing: TBSpacing.x12) {
                                        VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                            Text(entry.menu).tbTextStyle(.subsectionTitle)
                                            Text(entry.restaurant).tbTextStyle(.caption)
                                            Text(entry.memoryDateDescription).tbTextStyle(.caption)
                                        }.frame(maxWidth: .infinity, alignment: .leading)
                                        LucideIcon(.chevronRight, size: 16).foregroundStyle(TBColor.textHint)
                                    }
                                }
                            }.buttonStyle(.plain)
                        }
                        if let onOpenAll {
                            Button("기록 전체보기", action: onOpenAll).font(TBFont.regular(12)).frame(minHeight: 44)
                        }
                    }
                }
            }
            .sheet(isPresented: Binding(get: { openedEntryID != nil }, set: { if !$0 { openedEntryID = nil } })) {
                if let openedEntryID { FoodMemoryDetailView(entryID: openedEntryID) }
            }
            .onChange(of: appModel.memoryAccountGeneration) { _, _ in openedEntryID = nil }
        }
    }
}
