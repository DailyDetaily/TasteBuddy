import SwiftUI

struct PersonalTasteInsightGroup: Identifiable {
    enum Kind: Hashable { case fit, overall }
    struct Row: Identifiable {
        let id: String
        let condition: String
        let summary: String
        let counts: [String]
    }
    let id: String
    let kind: Kind
    let title: String
    let body: String
    let rows: [Row]
    let mealIDs: [String]
    let evidenceIDs: [String]
    let mixedMealIDs: [String]
    var eyebrow: String { "\(mealIDs.count)번의 식사 · \(kind == .fit ? "알맞음의 기록" : "전체 평가와 감각 평가")" }
}

enum PersonalTasteInsightPresentation {
    static func fitLabel(_ value: String) -> String {
        ["below_preferred": "조금 부족했어요", "just_right": "알맞았어요", "above_preferred": "조금 과했어요"][value] ?? "여러 응답"
    }
    static func overallLabel(_ value: String) -> String {
        ["very_positive": "정말 좋았어요", "positive": "좋았어요", "neutral": "보통이었어요", "negative": "아쉬웠어요", "very_negative": "많이 아쉬웠어요"][value] ?? "미응답"
    }
    static func likingLabel(_ value: String) -> String {
        ["positive": "좋았어요", "neutral": "보통이에요", "negative": "아쉬웠어요"][value] ?? "미응답"
    }
    static func conditionText(_ conditions: [PersonalTasteCondition]) -> String {
        conditions.isEmpty ? "기록한 조건 전체" : conditions.map { PersonalTasteConditionLabels.label(for: $0) }.joined(separator: " · ")
    }

    static func groups(_ model: PersonalTasteModelSnapshot?) -> [PersonalTasteInsightGroup] {
        guard let model else { return [] }
        var result: [PersonalTasteInsightGroup] = []
        let fits = Dictionary(grouping: model.fitPatterns) { PersonalTasteModelBuilder.json([$0.attribute, PersonalTasteModelBuilder.nullable($0.reference)]) }
        for key in fits.keys.sorted() {
            let patterns = fits[key]!, baseline = patterns.first { $0.conditions.isEmpty }!
            var signatures = Set<String>()
            let distinct = patterns.sorted {
                if ($0.repeatedValue != nil) != ($1.repeatedValue != nil) { return $0.repeatedValue != nil }
                return preferredConditions($0.conditions, $1.conditions, leftID: $0.id, rightID: $1.id)
            }.filter { signatures.insert($0.mealIDs.joined(separator: "|") + ":" + PersonalTasteModelBuilder.canonical($0.distribution)).inserted }
            let rows = distinct.map { pattern in
                PersonalTasteInsightGroup.Row(id: pattern.id, condition: conditionText(pattern.conditions), summary: fitSummary(pattern), counts: fitCounts(pattern.distribution))
            }
            let repeated = Set(patterns.compactMap(\.repeatedValue))
            let title = repeated.contains("just_right") && repeated.contains("above_preferred")
                ? "\(baseline.label), 알맞았던 때와 과했던 때" : "\(baseline.label)의 알맞은 수준을 살펴봤어요"
            let body = rows.prefix(2).map { "\($0.condition): \($0.summary)" }.joined(separator: "\n")
            result.append(.init(id: "fit:" + baseline.id, kind: .fit, title: title, body: body, rows: rows, mealIDs: baseline.mealIDs, evidenceIDs: baseline.evidenceIDs, mixedMealIDs: []))
        }
        let overalls = Dictionary(grouping: model.overallPatterns) { PersonalTasteModelBuilder.json([$0.attribute, PersonalTasteModelBuilder.nullable($0.reference)]) }
        for key in overalls.keys.sorted() {
            let patterns = overalls[key]!, baseline = patterns.first { $0.conditions.isEmpty }!
            var signatures = Set<String>()
            let distinct = patterns.sorted {
                let left = $0.cells.map { $0.mealIDs.count }.max() ?? 0, right = $1.cells.map { $0.mealIDs.count }.max() ?? 0
                if left != right { return left > right }
                return preferredConditions($0.conditions, $1.conditions, leftID: $0.id, rightID: $1.id)
            }.filter { pattern in
                let signature = pattern.cells.map { "\($0.overallValue):\($0.attributeValue):\($0.mealIDs.joined(separator: "|"))" }.joined(separator: ";") + pattern.mixedMealIDs.joined(separator: "|")
                return signatures.insert(signature).inserted
            }
            let rows = distinct.map { pattern in
                PersonalTasteInsightGroup.Row(id: pattern.id, condition: conditionText(pattern.conditions), summary: overallSummary(pattern, policy: model.policy), counts: overallCounts(pattern))
            }
            result.append(.init(id: "overall:" + baseline.id, kind: .overall, title: "음식 전체와 \(baseline.label)의 평가는 어떻게 이어졌을까요", body: overallCardSummary(baseline, policy: model.policy), rows: rows, mealIDs: baseline.mealIDs, evidenceIDs: baseline.evidenceIDs, mixedMealIDs: baseline.mixedMealIDs))
        }
        return result
    }

    private static func preferredConditions(_ left: [PersonalTasteCondition], _ right: [PersonalTasteCondition], leftID: String, rightID: String) -> Bool {
        func rank(_ conditions: [PersonalTasteCondition]) -> Int {
            let dimensions = Set(conditions.map(\.dimension))
            return (dimensions.contains("intensity") ? 8 : 0) + (dimensions.contains("target") ? 4 : 0)
                + (dimensions.contains("dishKind") ? 2 : 0) + (dimensions.contains("phase") ? 1 : 0)
        }
        let l = rank(left), r = rank(right)
        return l == r ? leftID < rightID : l > r
    }

    static func fitSummary(_ pattern: PersonalTasteFitPattern) -> String {
        if let repeated = pattern.repeatedValue {
            return "‘\(fitLabel(repeated))’가 \(pattern.distribution.mealCount)번의 식사에서 반복됐어요."
        }
        let distribution = fitCounts(pattern.distribution).joined(separator: " · ")
        return pattern.status == "mixed_fit" ? "응답이 나뉘었어요. \(distribution)." : "\(distribution). 아직 반복 경향으로 정하지 않아요."
    }

    private static func fitCounts(_ d: PersonalTasteFitDistribution) -> [String] {
        [("조금 부족했어요", d.belowPreferred), ("알맞았어요", d.justRight), ("조금 과했어요", d.abovePreferred), ("한 식사에서 응답이 나뉨", d.mixed)]
            .filter { $0.1 > 0 }.map { "\($0.0) · \($0.1)번의 식사" }
    }

    static func overallSummary(_ pattern: PersonalTasteOverallPattern, policy: PersonalTastePolicy) -> String {
        let minimum = pattern.conditions.isEmpty ? policy.minMeals : policy.minConditionMeals
        let ranked = pattern.cells.sorted {
            if $0.mealIDs.count != $1.mealIDs.count { return $0.mealIDs.count > $1.mealIDs.count }
            return "\($0.overallValue):\($0.attributeValue)" < "\($1.overallValue):\($1.attributeValue)"
        }
        guard let cell = ranked.first else { return "같은 식사 안에 서로 다른 평가 쌍이 있어 한쪽으로 묶지 않았어요." }
        let pair = "전체 평가 ‘\(overallLabel(cell.overallValue))’와 \(pattern.label) 평가 ‘\(likingLabel(cell.attributeValue))’"
        let summary = cell.mealIDs.count >= minimum
            ? "\(pair)가 \(cell.mealIDs.count)번의 식사에서 함께 나왔어요."
            : "\(pair)가 \(cell.mealIDs.count)번 있었어요. 반복 경향은 더 살펴봐요."
        return summary + (ranked.count > 1 || !pattern.mixedMealIDs.isEmpty ? " 다른 평가 쌍도 함께 남아 있어요." : "")
    }

    private static func overallCardSummary(_ pattern: PersonalTasteOverallPattern, policy: PersonalTastePolicy) -> String {
        let ranked = pattern.cells.sorted {
            if $0.mealIDs.count != $1.mealIDs.count { return $0.mealIDs.count > $1.mealIDs.count }
            return "\($0.overallValue):\($0.attributeValue)" < "\($1.overallValue):\($1.attributeValue)"
        }
        guard let cell = ranked.first else { return overallSummary(pattern, policy: policy) }
        let pair = "전체 ‘\(overallLabel(cell.overallValue))’ · \(pattern.label) ‘\(likingLabel(cell.attributeValue))’: \(cell.mealIDs.count)번의 식사."
        if cell.mealIDs.count < policy.minMeals { return pair + " 반복 경향은 더 살펴봐요." }
        return pair + (ranked.count > 1 || !pattern.mixedMealIDs.isEmpty ? " 다른 평가도 함께 있어요." : "")
    }

    private static func overallCounts(_ pattern: PersonalTasteOverallPattern) -> [String] {
        var counts = pattern.cells.map { "전체 ‘\(overallLabel($0.overallValue))’ · \(pattern.label) ‘\(likingLabel($0.attributeValue))’ — \($0.mealIDs.count)번의 식사" }
        if !pattern.mixedMealIDs.isEmpty { counts.append("한 식사에서 서로 다른 평가 쌍 · \(pattern.mixedMealIDs.count)번의 식사") }
        return counts
    }
}

struct PersonalTasteInsightDetailView: View {
    let group: PersonalTasteInsightGroup
    let observations: [SensoryObservation]
    let entries: [DiningEntry]
    @State private var section: TasteDetailSection = .overview
    var body: some View {
        TasteDetailPage(title: group.kind == .fit ? "알맞았던 조건" : "전체와 감각의 평가") {
            TasteDetailSectionPicker(selection: $section, overviewTitle: "비교", evidenceTitle: "기록")
        } content: {
            VStack(alignment: .leading, spacing: TBSpacing.x20) {
                if section == .overview {
                    SectionCard(showsBorder: false) {
                        VStack(alignment: .leading, spacing: TBSpacing.x16) {
                        Text(group.title).font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                            .fixedSize(horizontal: false, vertical: true)
                        TasteDetailScope(text: "식사 \(group.mealIDs.count)회 · \(group.kind == .fit ? "알맞음" : "전체·감각 평가")")
                        }
                    }.padding(.horizontal, TBSpacing.page)
                    TasteDetailGroup {
                        ForEach(Array(group.rows.enumerated()), id: \.element.id) { index, row in
                            VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                if index > 0 { Divider().overlay(TBColor.borderSubtle) }
                                Text(row.condition).font(TBFont.semibold(13)).foregroundStyle(TBColor.textPrimary)
                                ForEach(row.counts, id: \.self) { count in
                                    Text(count).font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }.padding(TBSpacing.x16)
                        }
                    }.padding(.horizontal, TBSpacing.page)
                } else {
                    VStack(alignment: .leading, spacing: TBSpacing.x16) {
                        ForEach(group.mealIDs, id: \.self) { mealID in
                            let mealEntries = entries.filter { $0.mealID.uuidString.lowercased() == mealID.lowercased() }
                            let entryIDs = Set(mealEntries.map(\.id)), evidenceIDs = Set(group.evidenceIDs)
                            if let first = mealEntries.sorted(by: { $0.id.uuidString < $1.id.uuidString }).first {
                                SectionCard(showsBorder: false) {
                                    VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                        Text("\(first.restaurant) · \(first.observedAt.formatted(date: .abbreviated, time: .omitted))")
                                            .font(TBFont.semibold(13)).foregroundStyle(TBColor.textPrimary)
                                        if group.mixedMealIDs.contains(mealID) { TasteDetailScope(text: "응답 나뉨") }
                                    }
                                }
                            }
                            SensoryEvidenceList(observations: observations.filter { evidenceIDs.contains($0.id) && entryIDs.contains($0.experienceID) }, unresolved: [], groupsActionsInCard: true)
                        }
                    }.padding(.horizontal, TBSpacing.page)
                }
            }.padding(.bottom, TBSpacing.page)
        }.modifier(MemoryRevisionDismissal())
    }
}

#Preview("알맞음 조건 상세") {
    PersonalTasteInsightDetailView(
        group: .init(id: "preview", kind: .fit, title: "산미가 알맞았던 때와 과했던 때", body: "", rows: [
            .init(id: "medium", condition: "국물 · 중간 강도로 느낀", summary: "‘알맞았어요’가 3번의 식사에서 반복됐어요.", counts: ["알맞았어요 · 3번의 식사"]),
            .init(id: "strong", condition: "국물 · 강하게 느낀", summary: "‘조금 과했어요’가 3번의 식사에서 반복됐어요.", counts: ["조금 과했어요 · 3번의 식사"])
        ], mealIDs: [], evidenceIDs: [], mixedMealIDs: []), observations: [], entries: []
    )
}
