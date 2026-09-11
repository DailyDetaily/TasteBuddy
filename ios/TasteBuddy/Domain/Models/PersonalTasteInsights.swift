import Foundation

struct PersonalTasteFitDistribution: Codable, Equatable, Sendable {
    var belowPreferred: Int = 0
    var justRight: Int = 0
    var abovePreferred: Int = 0
    var mixed: Int = 0
    var mealCount: Int
}

struct PersonalTasteFitPattern: Codable, Equatable, Identifiable, Sendable {
    let id: String; let attribute: String; let reference: String?; let label: String
    let conditions: [PersonalTasteCondition]; let distribution: PersonalTasteFitDistribution
    let status: String; let repeatedValue: String?
    let mealIDs: [String]; let evidenceIDs: [String]; let evidence: [PersonalTasteEvidence]
}

struct PersonalTasteOverallCell: Codable, Equatable, Sendable {
    let overallValue: String; let attributeValue: String
    var mealIDs: [String]; var evidenceIDs: [String]
}

struct PersonalTasteOverallPattern: Codable, Equatable, Identifiable, Sendable {
    let id: String; let attribute: String; let reference: String?; let label: String
    let conditions: [PersonalTasteCondition]; let cells: [PersonalTasteOverallCell]
    let mealIDs: [String]; let mixedMealIDs: [String]
    let evidenceIDs: [String]; let evidence: [PersonalTasteEvidence]; let causalClaim: String?
}

struct PersonalTasteQuestionImpact: Codable, Equatable, Sendable {
    let changedInterpretationCount: Int
    let alternativeCount: Int
    let comparedMealCount: Int
    let basis: String
}

extension PersonalTasteModelBuilder {
    static let fitValues = ["below_preferred", "just_right", "above_preferred"]
    static let likingValues = ["positive", "neutral", "negative"]
    static let overallValues = ["very_positive", "positive", "neutral", "negative", "very_negative"]

    private struct InsightRating {
        let record: PersonalTasteModelRecord
        let intensity: String?
        var overallValue: String? = nil
        var evidenceRows: [PersonalTasteModelRecord]

        func value(_ dimension: String) -> String? {
            switch dimension {
            case "intensity": return intensity
            case "target": return record.target
            case "phase": return record.phase
            default: return nil
            }
        }
        func matches(_ conditions: [PersonalTasteCondition]) -> Bool {
            conditions.allSatisfy { $0.dimension == "dishKind" ? record.dishKindIDs.contains($0.value) : value($0.dimension) == $0.value }
        }
    }

    static func insightAttributeKey(_ row: PersonalTasteModelRecord) -> String {
        json([nullable(row.attribute), nullable(row.reference)])
    }

    // 소유자·시점·중복 ID 검사를 통과한 관찰에서 같은 선택의 강도만 연결한다.
    private static func scopedRatings(_ records: [PersonalTasteModelRecord], kind: String, scale: String, values: [String]) -> [InsightRating] {
        let scopes = Dictionary(grouping: records, by: scope)
        return records.compactMap { row in
            guard row.kind == kind, row.scale == scale, values.contains(row.value.text),
                  let attribute = row.attribute, !attribute.hasSuffix(".unspecified") else { return nil }
            let related = (scopes[scope(row)] ?? []).filter { sameSelection(row, $0) }
            guard !related.contains(where: { $0.kind == "sensory_presence" && $0.value == .flag(false) }) else { return nil }
            let intensities = related.filter { $0.kind == "sensory_intensity" && $0.scale == "expression-strength-v1" }
            let levels = unique(intensities.map { $0.value.text })
            let intensity = levels.count == 1 && ["weak", "medium", "strong"].contains(levels[0]) ? levels[0] : nil
            return .init(record: row, intensity: intensity, evidenceRows: [row] + intensities)
        }
    }

    private static func insightConditionSets(_ rows: [InsightRating]) -> [(String, [PersonalTasteCondition])] {
        var sets: [String: [PersonalTasteCondition]] = ["[]": []]
        var seenConditions = Set<[PersonalTasteCondition]>()
        for row in rows {
            let dimensions = ["target", "phase", "intensity"].compactMap { dimension -> PersonalTasteCondition? in
                guard let value = row.value(dimension), value != "unspecified" else { return nil }
                return .init(dimension: dimension, value: value)
            }
            let unsorted = dimensions + row.record.dishKindIDs.map { PersonalTasteCondition(dimension: "dishKind", value: $0) }
            guard seenConditions.insert(unsorted).inserted else { continue }
            let available = unsorted.sorted { canonical($0) < canonical($1) }
            for i in available.indices {
                sets[canonical([available[i]])] = [available[i]]
                for j in available.indices where j > i && available[i].dimension != available[j].dimension {
                    let pair = [available[i], available[j]]; sets[canonical(pair)] = pair
                }
            }
        }
        return sets.keys.sorted().map { ($0, sets[$0]!) }
    }

    static func buildFitPatterns(_ records: [PersonalTasteModelRecord], userID: String, policy: PersonalTastePolicy, includeEvidence: Bool = true) -> [PersonalTasteFitPattern] {
        let ratings = scopedRatings(records, kind: "preference_fit", scale: "preference-fit-v1", values: fitValues)
        let attributes = Dictionary(grouping: ratings) { insightAttributeKey($0.record) }
        var patterns: [PersonalTasteFitPattern] = []
        for key in attributes.keys.sorted() {
            let rows = attributes[key]!, first = rows[0].record
            for (conditionKey, conditions) in insightConditionSets(rows) {
                let selected = rows.filter { $0.matches(conditions) }
                let groups = Dictionary(grouping: selected) { $0.record.mealId }
                var distribution = PersonalTasteFitDistribution(mealCount: groups.count)
                var mealValues: [String] = []
                for mealID in groups.keys.sorted() {
                    let values = unique(groups[mealID]!.map { $0.record.value.text })
                    let value = values.count == 1 ? values[0] : "mixed"; mealValues.append(value)
                    switch value {
                    case "below_preferred": distribution.belowPreferred += 1
                    case "just_right": distribution.justRight += 1
                    case "above_preferred": distribution.abovePreferred += 1
                    default: distribution.mixed += 1
                    }
                }
                let values = unique(mealValues), minimum = conditions.isEmpty ? policy.minMeals : policy.minConditionMeals
                let repeated = groups.count >= minimum && values.count == 1 && values[0] != "mixed" ? values[0] : nil
                let status = values.contains("mixed") || values.count > 1 ? "mixed_fit" : repeated != nil ? "repeated_fit" : groups.count == 1 ? "observed_once" : "limited_observations"
                let sources = includeEvidence ? evidence(selected.flatMap(\.evidenceRows)) : []
                patterns.append(.init(id: identifier("fit-pattern", [userID, key, conditionKey]), attribute: first.attribute!, reference: first.reference, label: label(first), conditions: conditions, distribution: distribution, status: status, repeatedValue: repeated, mealIDs: groups.keys.sorted(), evidenceIDs: sources.map(\.id), evidence: sources))
            }
        }
        return patterns.sorted { $0.id < $1.id }
    }

    static func fitQuestions(_ records: [PersonalTasteModelRecord], patterns: [PersonalTasteFitPattern]) -> [Question] {
        scopedRatings(records, kind: "preference_fit", scale: "preference-fit-v1", values: fitValues).flatMap { rating in
            let row = rating.record
            let missing: [(String, Bool, Int)] = [("intensity", rating.intensity == nil, 70), ("target", row.target == "unspecified", 60), ("phase", row.phase == "unspecified", 50)]
            let unstable = patterns.contains { $0.attribute == row.attribute && $0.reference == row.reference && $0.status == "mixed_fit" }
            return missing.filter { $0.1 }.map { facet, _, score in
                Question(attribute: row.attribute!, reference: row.reference, label: label(row), facet: facet, reason: unstable ? "unstable_context_comparison" : "\(facet)_not_reported", score: unstable ? 90 : score, evidenceIDs: rating.evidenceRows.map(\.observationId), mealIDs: [row.mealId], target: row.target, phase: row.phase)
            }
        }
    }

    static func buildOverallPatterns(_ records: [PersonalTasteModelRecord], userID: String, includeEvidence: Bool = true) -> [PersonalTasteOverallPattern] {
        let ratings = scopedRatings(records, kind: "attribute_liking", scale: "attribute-three-category-v1", values: likingValues)
        let overall = Dictionary(grouping: records.filter { $0.kind == "overall_liking" && $0.scale == "overall-five-category-v1" && overallValues.contains($0.value.text) }, by: \.experienceId)
        let pairs = ratings.flatMap { rating in
            (overall[rating.record.experienceId] ?? []).filter { $0.mealId == rating.record.mealId }.map { row in
                var pair = rating; pair.overallValue = row.value.text; pair.evidenceRows.append(row); return pair
            }
        }
        let attributes = Dictionary(grouping: pairs) { insightAttributeKey($0.record) }
        var patterns: [PersonalTasteOverallPattern] = []
        for key in attributes.keys.sorted() {
            let rows = attributes[key]!, first = rows[0].record
            for (conditionKey, conditions) in insightConditionSets(rows) {
                let selected = rows.filter { $0.matches(conditions) }
                let groups = Dictionary(grouping: selected) { $0.record.mealId }
                var cells: [String: PersonalTasteOverallCell] = [:], mixed: [String] = []
                for mealID in groups.keys.sorted() {
                    let items = groups[mealID]!, combinations = unique(items.map { json([$0.overallValue!, $0.record.value.text]) })
                    // 같은 식사의 서로 다른 평가 쌍은 특정 쌍의 반복 근거에 더하지 않는다.
                    guard combinations.count == 1 else { mixed.append(mealID); continue }
                    let cellKey = combinations[0], firstItem = items[0]
                    if cells[cellKey] == nil {
                        cells[cellKey] = .init(overallValue: firstItem.overallValue!, attributeValue: firstItem.record.value.text, mealIDs: [], evidenceIDs: [])
                    }
                    cells[cellKey]!.mealIDs.append(mealID)
                    if includeEvidence { cells[cellKey]!.evidenceIDs.append(contentsOf: items.flatMap { $0.evidenceRows.map(\.observationId) }) }
                }
                let sortedCells = cells.values.map { cell in
                    var result = cell; result.evidenceIDs = unique(cell.evidenceIDs); return result
                }.sorted {
                    let left = overallValues.firstIndex(of: $0.overallValue)!, right = overallValues.firstIndex(of: $1.overallValue)!
                    return left != right ? left < right : likingValues.firstIndex(of: $0.attributeValue)! < likingValues.firstIndex(of: $1.attributeValue)!
                }
                let sources = includeEvidence ? evidence(selected.flatMap(\.evidenceRows)) : []
                patterns.append(.init(id: identifier("overall-pattern", [userID, key, conditionKey]), attribute: first.attribute!, reference: first.reference, label: label(first), conditions: conditions, cells: sortedCells, mealIDs: groups.keys.sorted(), mixedMealIDs: mixed, evidenceIDs: sources.map(\.id), evidence: sources, causalClaim: nil))
            }
        }
        return patterns.sorted { $0.id < $1.id }
    }
}
