import SwiftUI

struct TDCardSurface<Content: View>: View {
    let category: TDCategory
    let title: String
    let subtitle: String
    let content: Content
    init(category: TDCategory, title: String, subtitle: String, @ViewBuilder content: () -> Content) {
        self.category = category; self.title = title; self.subtitle = subtitle; self.content = content()
    }
    var body: some View {
        TasteInsightSummaryCardLayout(indicatorColors: [TBColor.textSecondary], indicatorCategory: category, sectionLabel: title,
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
        TDCardSurface(category: category, title: title, subtitle: period.range(calendar: .current)) {
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
        var supportingText: String?
        var chart: HomeArchiveChart?
        if card.id == "meals", let row = selectedRow {
            title = row.count.map { "식사 \($0)회" } ?? row.value
            detail = row.detail.replacingOccurrences(of: "확인된 범위의 ", with: "")
        } else if card.id.hasPrefix("measure-") || card.id == "first" || card.id == "repeat" {
            // Only display language changes; the engine still owns identity, first/repeat
            // eligibility and representative ordering.
            if card.id.hasPrefix("measure-"),
               let dimension = TDDimension.allCases.first(where: { card.id == "measure-" + $0.id }),
               card.state == .ready || card.state == .zeroOccurrences {
                title = (dimension == .foodKind ? "기록한 음식 종류 " : dimension.rawValue + " ")
                    + "\(card.rows.count)\(dimension.unit)"
            } else if card.id == "first" || card.id == "repeat" {
                title = card.meaning.replacingOccurrences(
                    of: "확인된 ", with: card.id == "first" ? "첫 기록 " : "반복 기록 ")
            }
            if let row = selectedRow {
                if card.id == "first" {
                    detail = "최근 첫 기록: " + row.title + "\n" + row.value
                } else if card.id == "repeat", let count = row.count {
                    let minimum = row.detail.contains("최소 횟수") ? "최소 " : ""
                    detail = row.title + "\n첫 기록 이후 \(minimum)\(count)회"
                } else {
                    detail = row.title + " · " + (row.count.map { "식사 \($0)회" } ?? row.value)
                }
            } else {
                detail = card.state == .zeroOccurrences ? "선택 범위의 기록 없음" : "식사일·기록 연결 확인 필요"
            }
        } else if let row = selectedRow {
            title = row.title + " · " + row.value
            detail = row.segments.isEmpty ? row.detail : responseSummary(row.segments)
            switch card.id {
            case "presence":
                if let count = row.count, let base = row.denominator {
                    title = "\(row.title) 기록 · 식사 \(base)회 중 \(count)회"
                }
                detail = "감각을 기록한 식사 기준\n한 식사에 여러 감각 가능"
            case "intensity", "liking", "fit":
                let label = card.id == "intensity" ? "강도" : card.id == "liking" ? "호감" : "알맞음"
                let name = row.state == .invalidEvidence ? TDSensoryDisplayLabel.resolve(row.title) : row.title
                let subject = name + (card.id == "fit" ? "의 " : " ") + label
                title = row.id == "unclassified" ? label + " 응답 확인 필요" : evaluationTitle(subject: subject, row: row)
            case "overall":
                if let count = row.count, count > 0 { title = "요리 \(count)개 평가" }
                else { title = row.state == .invalidEvidence ? "요리 평가 확인 필요" : "아직 요리 평가 없음" }
            case "context-foodKind", "context-target", "context-phase", "context-intensity":
                let reaction = contextReaction(card.meaning)
                var subject = row.title
                if card.id == "context-intensity" {
                    let strength = ["약함": "약한", "중간": "중간 강도의", "강함": "강한"][row.title] ?? row.title
                    subject = strength + " " + reaction.sense
                    detail = reaction.facet + "\n" + responseSummary(row.segments)
                } else {
                    detail = reaction.sense + " " + reaction.facet + "\n" + responseSummary(row.segments)
                }
                title = evaluationTitle(subject: subject, row: row, isContext: true)
            case "change-experience":
                if let comparison = row.comparison {
                    let dimension = TDDimension.allCases.first { $0.id == row.id }
                    let label = dimension?.rawValue ?? "식사", unit = dimension?.unit ?? "회"
                    let before = comparison.before.map { "\($0)\(unit)" } ?? "미확인"
                    let after = comparison.after.map { "\($0)\(unit)" } ?? "미확인"
                    title = label + " " + before + " → " + after
                    detail = "이전 → 최근"
                    if let dimension {
                        detail += dimension == .foodKind ? " · 저장한 분류 기준" : " · 확인된 \(label) 기준"
                    }
                }
            case "change-presence":
                let copy = presenceComparison(row)
                title = copy.title; detail = copy.detail
            default: break
            }
            supportingText = itemCount(card)
            if !row.segments.isEmpty {
                chart = .init(kind: .distribution, unit: card.id == "overall" ? "개 요리" : "번 식사",
                              period: card.evidence.period.range(calendar: .current),
                              segments: row.segments.map { segment in
                    .init(id: segment.key, label: responseLabel(segment), count: segment.count,
                          entryIDs: Set(segment.evidence.entryIDs.compactMap(UUID.init(uuidString:))),
                          evidenceIDs: segment.evidence.observationIDs)
                })
            }
        } else {
            let copy = emptyCopy(card)
            title = copy.title; detail = copy.detail
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
            title += card.id == "change-liking" ? " 호감" : " 알맞음"
            detail = comparisonResponses(before, period: "이전") + "\n" + comparisonResponses(after, period: "최근")
            if before.evidence.conditions["conditionsConfirmed"] != "true" || after.evidence.conditions["conditionsConfirmed"] != "true" {
                detail = "조건 확인 필요\n" + detail
            }
            let scopeCount = card.rows.filter { $0.id.hasSuffix(":before") }.count
            supportingText = scopeCount > 1 ? "비교 묶음 \(scopeCount)개" : nil
            chart = nil // A single period's distribution cannot represent a comparison.
        }
        return .init(kind: kind, title: title, detail: detail, supportingText: supportingText, stats: [], chartValues: [],
                     accentAxis: category.routeKind.axis, state: card.state == .ready || card.state == .zeroOccurrences ? .populated : .insufficient,
                     archiveChart: chart, category: category)
    }

    private static func responseLabel(_ segment: TDSegment) -> String {
        segment.key == "unresolved" ? "응답 확인 필요" : segment.label
    }

    private static func responseSummary(_ segments: [TDSegment]) -> String {
        let present = segments.filter { $0.count > 0 }
        return present.isEmpty ? "응답 없음" : present.map { "\(responseLabel($0)) \($0.count)" }.joined(separator: " · ")
    }

    private static func evaluationTitle(subject: String, row: TDRow, isContext: Bool = false) -> String {
        guard let count = row.count, count > 0 else {
            return subject + (row.state == .invalidEvidence ? " · 응답 확인 필요" : " · 응답 없음")
        }
        let hasPending = row.segments.contains { ["missing", "unresolved"].contains($0.key) && $0.count > 0 }
        return subject + " · 식사 \(count)회" + (isContext ? " 평가" : hasPending ? " 응답" : "")
    }

    private static func contextReaction(_ meaning: String) -> (sense: String, facet: String) {
        for (suffix, label) in [(" · " + TDFacet.liking.title, "호감"), (" · " + TDFacet.fit.title, "알맞음")] {
            if meaning.hasSuffix(suffix) { return (String(meaning.dropLast(suffix.count)), label) }
        }
        return (meaning, "평가")
    }

    private static func itemCount(_ card: TDCard) -> String? {
        guard card.rows.count > 1 else { return nil }
        // An unclassified issue is an evidence row, not another identified sense.
        if card.rows.contains(where: { $0.id == "unclassified" }) {
            return "표시 항목 \(card.rows.count)개"
        }
        let label: String
        switch card.id {
        case "presence", "liking", "fit", "change-presence": label = "감각"
        case "context-foodKind": label = "음식 종류"
        case "context-target": label = "부위"
        case "context-phase": label = "시점"
        case "context-intensity": label = "강도"
        default: return nil
        }
        return "\(label) \(card.rows.count)가지"
    }

    private static func comparisonResponses(_ row: TDRow, period: String) -> String {
        if row.count == 0 {
            let pending = row.segments.filter { ["missing", "unresolved"].contains($0.key) && $0.count > 0 }
            if !pending.isEmpty { return period + ": " + responseSummary(pending) }
            return period + " 응답 없음"
        }
        return period + ": " + responseSummary(row.segments)
    }

    private static func presenceComparison(_ row: TDRow) -> (title: String, detail: String) {
        guard let comparison = row.comparison else {
            return (row.title + " 기록 비율", "비교 응답 부족")
        }
        func rate(_ count: Int?, _ base: Int?) -> String? {
            guard let count, let base, base > 0 else { return nil }
            return "\(Int((Double(count) / Double(base) * 100).rounded()))%"
        }
        func fraction(_ count: Int?, _ base: Int?, period: String) -> String {
            guard let count, let base, base > 0 else { return period + " 비교 자료 부족" }
            return "\(period) \(count)/\(base)회"
        }
        let before = rate(comparison.before, comparison.beforeDenominator)
        let after = rate(comparison.after, comparison.afterDenominator)
        let compatible = row.evidence.conditions["catalogComparable"] == "true"
        var equal = false, increasing = false
        if compatible, let b = comparison.before, let a = comparison.after,
           let nB = comparison.beforeDenominator, let nA = comparison.afterDenominator, nB > 0, nA > 0 {
            // Compare the exact fractions, never the rounded percentages or delta.
            let previous = Decimal(b) * Decimal(nA), recent = Decimal(a) * Decimal(nB)
            equal = previous == recent
            increasing = recent > previous
        }
        var title = row.title + " 기록 비율"
        if let before, let after {
            title += equal ? " \(after) 유지" : " \(before) → \(after)"
        } else if before != nil || after != nil {
            title += " \(before ?? "—") → \(after ?? "—")"
        }
        var detail = fraction(comparison.before, comparison.beforeDenominator, period: "이전")
            + " → " + fraction(comparison.after, comparison.afterDenominator, period: "최근")
        detail += "\n감각을 기록한 식사 기준"
        if compatible, !equal, let delta = comparison.percentagePointDifference {
            let direction = increasing ? "증가" : "감소"
            let amount = String(format: "%.1f", abs(delta))
            detail += amount == "0.0" ? " · 0.1%p 미만 \(direction)" : " · \(amount)%p \(direction)"
        } else if !compatible {
            detail += "\n감각 응답 기준 확인 필요"
        }
        return (title, detail)
    }

    private static func emptyCopy(_ card: TDCard) -> (title: String, detail: String) {
        if card.state == .invalidEvidence { return ("응답 확인 필요", "확인되지 않은 응답은 집계에서 제외") }
        switch card.id {
        case "presence": return ("집계할 감각 기록 없음", "감각 응답 확인 필요")
        case "intensity": return ("강도 응답 없음", "직접 선택한 강도 기준")
        case "liking": return ("호감 응답 없음", "직접 남긴 감각별 호감 기준")
        case "fit": return ("알맞음 응답 없음", "직접 남긴 알맞음 응답 기준")
        case "context-foodKind", "context-target", "context-phase", "context-intensity":
            return ("비교할 응답 없음", "감각 평가와 기록 조건 확인 필요")
        case "change-presence": return ("비교할 감각 기록 없음", "이전·최근 감각 응답 확인 필요")
        case "change-liking", "change-fit": return ("비교할 평가 없음", "같은 메뉴·감각·기록 조건 기준")
        default: return (card.meaning, card.note)
        }
    }
}

struct TDArchiveMeasurementCard: View {
    let card: TDCard
    let data: HomePeriodInsightCardData
    let onOpen: () -> Void
    var controls: AnyView? = nil
    var body: some View {
        HomePeriodInsightCard(data: data, onTap: onOpen, labelOverride: card.title,
                              detailLineLimit: nil, controls: controls,
                              summaryItemCount: data.supportingText, usesReadableInsightLayout: true)
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
              accentAxis: category.routeKind.axis, state: .populated, category: category)
    }

    var body: some View {
        HomePeriodInsightCard(data: summary, onTap: onOpen, labelOverride: card.kind.label,
                              detailLineLimit: nil,
                              headerActionLabel: nil,
                              balancedFooter: AnyView(footer), usesReadableInsightLayout: true)
            .accessibilityLabel(accessibilityLabel)
            .accessibilityHint("발견의 근거와 원본을 엽니다")
            .accessibilityIdentifier("taste-data-discovery-" + card.id)
            .contextMenu { Button("이 발견 7일간 보지 않기", action: onSnooze) }
    }
    private var footer: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x12) {
            Text(scope).font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
                .fixedSize(horizontal: false, vertical: true)
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
        case .restaurantCollection: "한 식당에서 기록한 여러 메뉴"
        case .menuCooccurrence: "같은 식사에 함께 기록한 메뉴"
        case .foodKindAcrossRestaurants: "여러 식당에서 기록한 같은 음식 종류"
        case .newMenuAtKnownRestaurant: "기록한 적 있는 식당의 첫 기록 메뉴"
        case .sensoryCooccurrence: "같은 요리에 함께 기록한 감각"
        case .commonPreference: "여러 메뉴에서 호감을 남긴 감각"
        case .repeatedGoodEvaluation: "같은 메뉴에 반복한 좋은 평가"
        case .overallContrast: "음식 전체와 감각별 평가의 차이"
        case .familiarTasteInNewMenu: "첫 기록 메뉴에서도 호감을 남긴 감각"
        case .patternException: "앞선 기록과 다른 최근 한 식사의 평가"
        case .preferredIntensity: "감각 강도별 알맞음·부족함·과함"
        case .conditionalContrast: "같은 감각에 대한 메뉴별 평가 차이"
        case .timeGap: "같은 메뉴의 두 식사 기록 간격"
        case .lastYear: "지난해 이맘때의 식사 기록"
        case .revisitComparison: "같은 메뉴의 두 식사 평가"
        case .periodChange: "같은 메뉴·감각의 기간별 호감 비율"
        case .sensoryPeriodChange: "감각을 기록한 식사의 기간별 비율"
        case .fitPeriodChange: "같은 메뉴·감각·기록 조건의 기간별 알맞음"
        case .repeatedMenu: "같은 메뉴를 기록한 식사 횟수"
        }
    }

    private var summary: HomePeriodInsightCardData {
        .init(kind: .tasteClue, title: "아직 발견 없음", detail: description,
              supportingText: nil, stats: [], chartValues: [],
              accentAxis: category.routeKind.axis, state: .insufficient, category: category)
    }

    var body: some View {
        HomePeriodInsightCard(
            data: summary, labelOverride: label, detailLineLimit: nil,
            headerActionLabel: nil,
            balancedFooter: AnyView(
                Text("아직 발견 조건을 충족하지 않았어요")
                    .font(TBFont.regular(11)).foregroundStyle(TBColor.textHint)
            ),
            usesReadableInsightLayout: true
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
