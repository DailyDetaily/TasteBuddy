import SwiftUI

struct TDCardSurface<Content: View>: View {
    let title: String
    let subtitle: String
    let content: Content
    init(title: String, subtitle: String, @ViewBuilder content: () -> Content) {
        self.title = title; self.subtitle = subtitle; self.content = content()
    }
    var body: some View {
        TasteInsightSummaryCardLayout(indicatorColors: [TBColor.textSecondary], sectionLabel: title,
                                      actionLabel: nil, title: subtitle, showsTitle: false,
                                      combinesAccessibilityChildren: false, sectionLabelLineLimit: nil) {
            Text(subtitle).tbTextStyle(.caption)
            content
        }
    }
}

struct TDMetricRows: View {
    let rows: [TDRow]
    let limit: Int
    let onSelect: (TDRow) -> Void
    var body: some View {
        if rows.isEmpty { Text("현재 범위에서 확인할 자료가 없어요.").tbTextStyle(.body) }
        ForEach(Array(rows.prefix(limit))) { row in
            TDMetricRowButton(row: row, onSelect: onSelect).buttonStyle(.plain)
            .accessibilityLabel(Text("\(row.title) · \(row.value) · \(row.detail)"))
            .accessibilityHint("해당 항목의 집계 기준과 원본을 엽니다")
        }
    }
}

private struct TDMetricRowButton: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let row: TDRow
    let onSelect: (TDRow) -> Void
    var body: some View {
        Button(action: { onSelect(row) }) { content }
    }
    private var content: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x8) {
            metricTitle(row)
            if !row.segments.isEmpty { TDSegmentBar(segments: row.segments) }
            if !row.detail.isEmpty { Text(row.detail).tbTextStyle(.caption).multilineTextAlignment(.leading) }
        }.frame(maxWidth: .infinity, minHeight: 44, alignment: .leading).contentShape(Rectangle())
    }
    @ViewBuilder private func metricTitle(_ row: TDRow) -> some View {
        if dynamicTypeSize.isAccessibilitySize {
            VStack(alignment: .leading, spacing: TBSpacing.x8) {
                Text(row.title).tbTextStyle(.body).fixedSize(horizontal: false, vertical: true)
                Text(row.value).tbTextStyle(.caption).fixedSize(horizontal: false, vertical: true)
            }
        } else {
            HStack(alignment: .top) {
                Text(row.title).tbTextStyle(.body)
                Text(row.value).tbTextStyle(.caption).multilineTextAlignment(.trailing)
            }
        }
    }

}

struct TDSegmentBar: View {
    let segments: [TDSegment]
    /// Colors are keyed by meaning, never by the index of a nonzero-only array.
    static func opacity(_ key: String) -> Double {
        ["very_negative": 0.3, "negative": 0.42, "neutral": 0.58, "positive": 0.76, "very_positive": 0.95,
         "weak": 0.35, "medium": 0.60, "strong": 0.90,
         "below_preferred": 0.4, "just_right": 0.85, "above_preferred": 0.6,
         "mixed": 0.48, "missing": 0.16, "unresolved": 0.24][key] ?? 0.65
    }
    var body: some View {
        let total = max(1, segments.reduce(0) { $0 + $1.count })
        VStack(alignment: .leading, spacing: TBSpacing.x8) {
            GeometryReader { proxy in
                HStack(spacing: 0) {
                    ForEach(segments, id: \.key) { segment in
                        Rectangle().fill(TBColor.textBody.opacity(Self.opacity(segment.key)))
                            .overlay(Rectangle().stroke(TBColor.surface, lineWidth: 1))
                            .frame(width: proxy.size.width * CGFloat(segment.count) / CGFloat(total))
                    }
                }
            }.frame(height: 12).accessibilityHidden(true)
            Text(TDDataEngine.summary(segments)).tbTextStyle(.caption)
        }
    }
}

struct TDCategoryHero: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let category: TDCategory
    let rows: [TDRow]
    let period: TDWindow
    let totalMenuCount: Int
    let fallbackMealCount: Int?
    let fallbackDishCount: Int
    let onSelect: (TDRow) -> Void
    private var title: String {
        switch category {
        case .experience: "메뉴별로 쌓인 경험"
        case .sensation: "기록에 남은 감각"
        case .preference: "직접 남긴 평가의 분포"
        case .context: "조건별로 남긴 반응"
        case .change: "최근 기간의 기록 흐름"
        }
    }
    var body: some View {
        TDCardSurface(title: title, subtitle: period.range(calendar: .current)) {
            if rows.isEmpty {
                if category == .experience {
                    if let fallbackMealCount {
                        Text("식사 \(fallbackMealCount)번 · 요리 기록 \(fallbackDishCount)개").tbTextStyle(.subsectionTitle)
                    } else { Text("식사 수 확인 필요").tbTextStyle(.subsectionTitle) }
                    Text(fallbackDishCount > 0 ? "메뉴 정체성을 연결하면 메뉴별 경험을 볼 수 있어요." : "이 범위에서 확인할 수 있는 원본이 없어요. 아래의 집계 상태를 확인해주세요.").tbTextStyle(.body)
                } else {
                    Text("이 보기의 자료가 아직 없어요. 다른 보기와 아래 측정에서 남긴 응답을 확인할 수 있어요.").tbTextStyle(.body)
                }
            } else {
                switch category {
                case .experience: experience
                case .sensation: sensation
                case .change:
                    if dynamicTypeSize.isAccessibilitySize { TDMetricRows(rows: rows, limit: rows.count, onSelect: onSelect) }
                    else { TDTimeBars(rows: rows, onSelect: onSelect) }
                    Text("최근 구간의 시간축이에요. 이전·최근 비교는 아래 측정에 두 기간을 함께 표시해요.").tbTextStyle(.caption)
                case .preference: TDMetricRows(rows: rows, limit: 3, onSelect: onSelect)
                case .context:
                    TDMetricRows(rows: rows, limit: 2, onSelect: onSelect)
                    Text("명시된 조건별 미통제 집계 · 겹치는 식사는 근거 상세에 표시해요.").tbTextStyle(.caption)
                }
            }
        }.accessibilityIdentifier("taste-data-hero-" + category.id)
    }
    private var experience: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x16) {
            Text("전체 메뉴 \(totalMenuCount)개 · 최대 6개 미리보기").tbTextStyle(.caption)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: dynamicTypeSize.isAccessibilitySize ? 260 : 140), alignment: .leading)], alignment: .leading, spacing: 18) {
                ForEach(Array(rows.prefix(6))) { row in
                    Button { onSelect(row) } label: {
                        VStack(alignment: .leading, spacing: TBSpacing.x8) {
                            HStack(spacing: 3) {
                                ForEach(0..<min(8, row.count ?? Int(row.amount ?? 0)), id: \.self) { _ in Circle().fill(TBColor.textBody).frame(width: 7, height: 7) }
                                if (row.count ?? 0) > 8 { Text("+\((row.count ?? 0) - 8)").tbTextStyle(.caption) }
                            }.accessibilityHidden(true)
                            Text(row.title).tbTextStyle(.body).multilineTextAlignment(.leading)
                            Text(row.value).tbTextStyle(.caption)
                        }.frame(maxWidth: .infinity, minHeight: 70, alignment: .leading)
                    }.buttonStyle(.plain).accessibilityLabel(row.title + " · " + row.value)
                }
            }
            Text("묶음 1개는 메뉴 1개, 점 1개는 그 메뉴를 기록한 식사 1번이에요. 같은 식사의 여러 메뉴는 서로 다른 묶음에 들어가요.").tbTextStyle(.caption)
        }
    }
    private var sensation: some View {
        let maximum = max(1, rows.compactMap(\.amount).max() ?? 1)
        return VStack(alignment: .leading, spacing: TBSpacing.x16) {
            ForEach(Array(rows.prefix(6))) { row in
                Button { onSelect(row) } label: {
                    VStack(alignment: .leading, spacing: TBSpacing.x8) {
                        HStack { Text(row.title).tbTextStyle(.body); Spacer(); Text(row.value).tbTextStyle(.caption) }
                        Canvas { context, size in
                            let length = size.width * CGFloat((row.amount ?? 0) / maximum)
                            var x: CGFloat = 3
                            while x < length {
                                context.fill(Path(ellipseIn: CGRect(x: x, y: 0, width: 5, height: 5)), with: .color(TBColor.textBody))
                                x += 9
                            }
                        }.frame(height: 5).accessibilityHidden(true)
                    }.frame(minHeight: 44)
                }.buttonStyle(.plain).accessibilityLabel(row.title + " · " + row.value)
            }
            Text("점 막대의 길이는 기록 횟수에 비례해요. 강도와 호감은 각각의 응답으로 따로 확인해요.").tbTextStyle(.caption)
        }
    }
}

struct TDTimeBars: View {
    let rows: [TDRow]
    let onSelect: (TDRow) -> Void
    var body: some View {
        let maximum = max(1, rows.compactMap(\.amount).max() ?? 1)
        HStack(alignment: .bottom, spacing: TBSpacing.x8) {
            ForEach(rows) { row in
                TDTimeBarButton(row: row, maximum: maximum, onSelect: onSelect).buttonStyle(.plain).accessibilityLabel(Text("\(row.title) · \(row.value) · \(row.detail)"))
            }
        }.frame(minHeight: 150, alignment: .bottom)
    }
}

private struct TDTimeBarButton: View {
    let row: TDRow
    let maximum: Double
    let onSelect: (TDRow) -> Void
    var body: some View { Button(action: { onSelect(row) }) { content } }
    private var content: some View {
        let countText: String = row.count.map { String($0) } ?? "미확인"
        let dateText: String = row.evidence.period.start.map { $0.formatted(.dateTime.month().day()) } ?? row.title
        return VStack(spacing: TBSpacing.x8) {
            Text(countText).tbTextStyle(.caption)
            if let value = row.amount {
                RoundedRectangle(cornerRadius: 4).fill(TBColor.textBody)
                    .frame(height: CGFloat(value / maximum) * 100)
            }
            Text(dateText).tbTextStyle(.caption)
        }.frame(maxWidth: .infinity, minHeight: 44, alignment: .bottom)
    }

}

/// The ring reads the same validated period/source scope as the measurement cards.
struct TDCategoryRingSummary: Equatable {
    let mealCount: Int?
    let isEmptyArchive: Bool
    let distribution: HomeInsightTasteDistribution

    static func make(_ state: TDState) -> Self {
        let count = TDDataEngine.meals(state.selected)
        let unresolved = count == 0 && (!state.conflictingIDs.isEmpty || (!state.window.isAll && !state.unknownDateIDs.isEmpty))
        let records = Dictionary(uniqueKeysWithValues: state.selected.map { ($0.id, $0.mealID) })
        let axes = ["taste.sweet", "taste.sour", "taste.bitter", "taste.salty", "taste.umami", "mouthfeel.fatty"]
        var meals = Array(repeating: Set<String>(), count: axes.count)
        for observation in state.observations where observation.facet == .presence {
            guard let meal = records[observation.entryID], let axis = axes.firstIndex(of: observation.attribute) else { continue }
            meals[axis].insert(meal)
        }
        return .init(mealCount: unresolved ? nil : count, isEmptyArchive: state.originalCount == 0,
                     distribution: .init(counts: meals.map(\.count)))
    }
}

/// Category-specific motion and central summary share the same validated scope as the cards.
struct TDCategoryRingHeader: View {
    let kind: HomeArchiveCard.Kind
    let summary: TDCategoryRingSummary?
    let motion: TDCategoryMotionInput?
    let height: CGFloat
    let reduceMotion: Bool
    @Binding var tintProgress: Double

    var body: some View {
        GeometryReader { proxy in
            ringContent(width: proxy.size.width, hidden: hiddenDistance(proxy))
        }
        .frame(width: height, height: height)
        .onGeometryChange(for: Double.self) { proxy in
            let hidden: CGFloat = (proxy.bounds(of: .scrollView)?.minY ?? 0) / height
            return min(1.0, max(0.0, Double(hidden) * 3.0 - 2.0))
        } action: { tintProgress = $0 }
        .frame(maxWidth: .infinity)
    }
    private func hiddenDistance(_ proxy: GeometryProxy) -> CGFloat {
        let y: CGFloat = proxy.bounds(of: .scrollView)?.minY ?? 0
        return min(height, max(CGFloat.zero, y))
    }
    private func ringContent(width: CGFloat, hidden: CGFloat) -> some View {
        let collapse: Double = Double(hidden / height)
        return motionContent(collapse: collapse)
            .frame(width: width, height: height)
            .scaleEffect(CGFloat(1.0 - collapse), anchor: .top)
            .offset(y: hidden)
            .allowsHitTesting(collapse == 0)
            .accessibilityHidden(collapse == 1)
    }
    @ViewBuilder private func motionContent(collapse: Double) -> some View {
        if let motion {
            TDCategoryMotionView(input: motion, reduceMotion: reduceMotion, collapseProgress: collapse)
                .id(motion.json)
        } else {
            Text(countLabel).font(TBFont.medium(13)).foregroundStyle(TBColor.textHint)
        }
    }
    private var countValue: String {
        guard let summary, !summary.isEmptyArchive, let count = summary.mealCount else { return "—" }
        return count.formatted()
    }
    private var countLabel: String {
        guard let summary else { return "집계 중" }
        if summary.isEmptyArchive { return "기록을 기다려요" }
        return summary.mealCount == nil ? "식사 수 확인 필요" : "번의 식사"
    }
}

/// Adapts already-computed measurements to the exact component used by Home archive cards.
/// It never adds distributions together across overlapping sensory/condition scopes.
enum TDArchiveCardPresentation {
    static func make(_ card: TDCard, category: TDCategory, attribute: String? = nil,
                     timeline: [TDRow] = [], dimension: TDDimension? = nil) -> HomePeriodInsightCardData {
        let kind: HomePeriodInsightKind
        switch card.id {
        case "meals": kind = .recordFlow
        case "first": kind = .newExperiences
        case "repeat": kind = .repeatPatterns
        default: kind = category == .experience ? .experienceBreadth : category == .change ? .tasteChange : .tasteClue
        }
        let selectedRow: TDRow?
        if card.id == "change-experience" {
            selectedRow = card.rows.first { $0.id == (dimension?.id ?? "meal") } ?? card.rows.first
        } else {
            selectedRow = attribute.flatMap { key in card.rows.first { $0.id == key } } ?? card.rows.first
        }
        var title = card.meaning, detail = card.note
        var chart: HomeArchiveChart?
        if card.id == "meals", let row = selectedRow {
            title = row.count.map { "\($0)번의 식사" } ?? row.value
            detail = row.detail
        } else if card.id.hasPrefix("measure-") || card.id == "first" || card.id == "repeat" {
            // These are identity/count cards, matching Home's text-only composition policy.
            if let row = selectedRow {
                detail = row.title + " · " + row.value
                if card.id == "first" { detail = "최근 처음 기록: " + detail }
            } else {
                detail = card.state == .zeroOccurrences ? "선택한 범위에 해당하는 기록이 없어요." : "식사일이나 기록의 연결을 확인해주세요."
            }
        } else if let row = selectedRow {
            title = row.title + " · " + row.value
            detail = row.segments.isEmpty ? row.detail : TDDataEngine.summary(row.segments)
            if category == .context { detail = card.meaning + " · " + detail }
            if card.rows.count > 1 && card.id != "change-experience" { detail += " · 전체 \(card.rows.count)개 항목" }
            if !row.segments.isEmpty {
                chart = .init(kind: .distribution, unit: card.id == "overall" ? "개 요리" : "번 식사",
                              period: card.evidence.period.range(calendar: .current),
                              segments: row.segments.map { segment in
                    .init(id: segment.key, label: segment.label, count: segment.count,
                          entryIDs: Set(segment.evidence.entryIDs.compactMap(UUID.init(uuidString:))),
                          evidenceIDs: segment.evidence.observationIDs)
                })
            }
        }
        if card.id == "change-experience", !timeline.isEmpty, timeline.allSatisfy({ $0.count != nil }) {
            chart = .init(kind: .timeSeries, unit: dimension?.unit ?? "번", period: card.evidence.period.range(calendar: .current),
                          segments: timeline.map { row in
                .init(id: row.id, label: row.title, count: row.count!, entryIDs: Set(row.entryIDs.compactMap(UUID.init(uuidString:))))
            })
        }
        if ["change-liking", "change-fit"].contains(card.id),
           let before = card.rows.first(where: { $0.id.hasSuffix(":before") }),
           let after = card.rows.first(where: { $0.id == String(before.id.dropLast(":before".count)) + ":after" }) {
            // Match both periods of the same menu/attribute/condition scope.
            title = before.title.hasSuffix(" · 이전") ? String(before.title.dropLast(" · 이전".count)) : before.title
            let left = before.count == 0 ? before.value : TDDataEngine.summary(before.segments)
            let right = after.count == 0 ? after.value : TDDataEngine.summary(after.segments)
            detail = "이전 " + left + " → 최근 " + right
            if before.evidence.conditions["conditionsConfirmed"] != "true" || after.evidence.conditions["conditionsConfirmed"] != "true" {
                detail = "조건 확인 필요 · " + detail
            }
            let scopeCount = card.rows.filter { $0.id.hasSuffix(":before") }.count
            if scopeCount > 1 { detail += " · 전체 \(scopeCount)개 범위" }
            chart = nil // A single period's distribution cannot represent a comparison.
        }
        return .init(kind: kind, title: title, detail: detail, supportingText: nil, stats: [], chartValues: [],
                     accentAxis: category.routeKind.axis, state: card.state == .ready || card.state == .zeroOccurrences ? .populated : .insufficient,
                     archiveChart: chart)
    }
}

struct TDArchiveMeasurementCard: View {
    let card: TDCard
    let data: HomePeriodInsightCardData
    let onOpen: () -> Void
    var controls: AnyView? = nil
    var body: some View {
        HomePeriodInsightCard(data: data, onTap: onOpen, labelOverride: card.title,
                              detailLineLimit: 2, controls: controls)
    }
}

struct TDDiscoveryCard: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let card: HomeDiscoveryCard
    let category: TDCategory
    let onOpen: () -> Void
    let onSnooze: () -> Void

    private var summary: HomePeriodInsightCardData {
        .init(kind: .tasteClue, title: card.title == card.kind.label ? "" : card.title,
              detail: card.detail, supportingText: nil, stats: [], chartValues: [],
              accentAxis: category.routeKind.axis, state: .populated)
    }

    var body: some View {
        HomePeriodInsightCard(data: summary, onTap: onOpen, labelOverride: card.kind.label,
                              iconOverride: .sparkles, headerActionLabel: nil,
                              balancedFooter: AnyView(footer))
            .accessibilityLabel(accessibilityLabel)
            .accessibilityHint("발견의 근거와 원본을 엽니다")
            .accessibilityIdentifier("taste-data-discovery-" + card.id)
            .contextMenu { Button("이 발견 7일간 보지 않기", action: onSnooze) }
    }
    private var footer: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x12) {
            Text(scope).font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
                .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 3)
            Spacer(minLength: TBSpacing.x8)
            CardDetailLabel(label: "근거 보기")
        }
    }
    private var scope: String {
        card.dataScope.label(calendar: .current) + " · " + (card.evidenceBundle?.sourceFilter ?? .all).rawValue
    }
    private var accessibilityLabel: String {
        let title = card.title == card.kind.label ? card.kind.label : card.kind.label + ", " + card.title
        return [title, card.detail, scope].joined(separator: ", ")
    }
}

struct TDDiscoveryEmptyCard: View {
    let category: TDCategory
    let kind: HomeDiscoveryCard.Kind

    private var label: String {
        switch kind {
        case .timeGap: "기억 연결 · 기록 간격"
        case .lastYear: "기억 연결 · 지난해"
        default: kind.label
        }
    }

    private var description: String {
        switch kind {
        case .restaurantCollection: "한 식당에서 경험한 서로 다른 메뉴를 연결해요."
        case .menuCooccurrence: "같은 식사에 반복해서 함께 기록한 메뉴를 찾아요."
        case .foodKindAcrossRestaurants: "여러 식당에서 경험한 같은 음식 종류를 모아요."
        case .newMenuAtKnownRestaurant: "이전에 기록한 식당에서 처음 만난 메뉴를 찾아요."
        case .sensoryCooccurrence: "같은 요리에서 반복해서 함께 느낀 맛·향·식감을 찾아요."
        case .commonPreference: "서로 다른 메뉴에서 공통으로 좋아한 감각을 찾아요."
        case .repeatedGoodEvaluation: "같은 메뉴에 반복해서 남긴 좋은 평가를 모아요."
        case .overallContrast: "음식 전체의 평가와 개별 감각의 평가를 비교해요."
        case .familiarTasteInNewMenu: "새로운 메뉴에서 기존에 좋아했던 감각을 연결해요."
        case .patternException: "반복되던 평가와 다른 반응을 남긴 경험을 찾아요."
        case .preferredIntensity: "감각의 강도에 따라 알맞음·과함·부족함 응답을 살펴봐요."
        case .conditionalContrast: "같은 감각에 대한 평가가 메뉴에 따라 어떻게 다른지 비교해요."
        case .timeGap: "같은 메뉴의 확인된 두 식사일 사이 간격을 살펴봐요."
        case .lastYear: "지난해 이맘때 기록한 식사를 다시 연결해요."
        case .revisitComparison: "같은 메뉴의 두 식사에서 남긴 평가를 비교해요."
        case .periodChange: "같은 메뉴와 감각의 긍정 평가를 두 기간에 걸쳐 비교해요."
        case .sensoryPeriodChange: "특정 감각을 기록한 식사 비중이 기간별로 어떻게 다른지 살펴봐요."
        case .fitPeriodChange: "같은 메뉴·감각·강도에서 알맞음 응답을 기간별로 비교해요."
        case .repeatedMenu: "같은 메뉴를 기록한 식사 횟수를 살펴봐요."
        }
    }

    private var summary: HomePeriodInsightCardData {
        .init(kind: .tasteClue, title: "아직 발견 없음", detail: description,
              supportingText: nil, stats: [], chartValues: [],
              accentAxis: category.routeKind.axis, state: .insufficient)
    }

    var body: some View {
        HomePeriodInsightCard(
            data: summary, labelOverride: label, detailLineLimit: nil,
            iconOverride: .sparkles, headerActionLabel: nil,
            balancedFooter: AnyView(
                Text("조건에 맞는 기록이 쌓이면 발견이 표시돼요.")
                    .font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
            )
        )
        .accessibilityLabel("\(label), 아직 발견 없음, \(description)")
        .accessibilityIdentifier("taste-data-discovery-empty-" + category.id + "-" + kind.rawValue)
    }
}

struct TDDiscoveryCardList: View {
    let cards: [HomeDiscoveryCard]
    let category: TDCategory
    let width: CGFloat
    let onOpen: (HomeDiscoveryCard) -> Void
    let onSnooze: (HomeDiscoveryCard) -> Void
    var body: some View {
        CardScrollList(spacing: TBSpacing.x12, fullBleed: false, snapsToCards: true, trailingContentPadding: TBSpacing.page) {
            ForEach(cards) { card in
                TDDiscoveryCard(card: card, category: category, onOpen: { onOpen(card) }, onSnooze: { onSnooze(card) })
                    .frame(width: max(240, min(360, width - 32)))
            }
        }
        .scrollClipDisabled()
        .padding(.trailing, -TBSpacing.page)
    }
}
