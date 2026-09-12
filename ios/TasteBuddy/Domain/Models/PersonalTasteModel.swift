import Foundation
import CryptoKit

/// JS와 Native가 공유하는 관찰 입력. userId는 인증된 분석 소유자와 정확히 일치해야 한다.
struct PersonalTasteModelRecord: Codable, Equatable, Sendable {
    var observationId: String
    var userId: String
    var experienceId: String
    var mealId: String
    var kind: String
    var attribute: String?
    var attributeLabel: String?
    var reference: String?
    var value: SensoryValue
    var scale: String
    var target: String
    var phase: String
    var observedAt: String?
    var knownAt: String?
    var dishKindIDs: [String]
    var phrase: String
    var sourceSpans: [SensorySourceSpan]
    var confirmationStatus: String
    var selectionEvidence: SensorySelectionEvidence?
    var conditionSources: [PersonalTasteConditionSource]
    init(observationId: String, userId: String, experienceId: String, mealId: String? = nil, kind: String = "attribute_liking", attribute: String? = nil, attributeLabel: String? = nil, reference: String? = nil, value: SensoryValue, scale: String = "attribute-three-category-v1", target: String = "unspecified", phase: String = "unspecified", observedAt: String? = nil, knownAt: String? = nil, dishKindIDs: [String] = [], phrase: String = "", sourceSpans: [SensorySourceSpan] = [], confirmationStatus: String = "explicit_user_choice", selectionEvidence: SensorySelectionEvidence? = nil, conditionSources: [PersonalTasteConditionSource] = []) {
        self.observationId = observationId; self.userId = userId; self.experienceId = experienceId; self.mealId = mealId ?? experienceId; self.kind = kind; self.attribute = attribute; self.attributeLabel = attributeLabel; self.reference = reference; self.value = value; self.scale = scale; self.target = target; self.phase = phase; self.observedAt = observedAt; self.knownAt = knownAt; self.dishKindIDs = dishKindIDs; self.phrase = phrase; self.sourceSpans = sourceSpans; self.confirmationStatus = confirmationStatus; self.selectionEvidence = selectionEvidence; self.conditionSources = conditionSources
    }
}
struct PersonalTasteCondition: Codable, Equatable, Hashable, Sendable { let dimension: String; let value: String }
struct PersonalTasteDistribution: Codable, Equatable, Sendable { var positive: Int; var neutral: Int; var negative: Int; var mixed: Int; var mealCount: Int }
struct PersonalTasteStability: Codable, Equatable, Sendable { let evaluatedMealCount: Int; let unchangedCount: Int; let stable: Bool }
struct PersonalTasteConditionSource: Codable, Equatable, Sendable { let dimension: String; let value: String; let sourceField: String; let labelSnapshot: String? }
struct PersonalTasteEvidence: Codable, Equatable, Sendable { let id: String; let mealID: String; let phrase: String; let sourceSpans: [SensorySourceSpan]; var selectionEvidence: SensorySelectionEvidence? = nil; var conditionSources: [PersonalTasteConditionSource] = [] }
struct PersonalTasteUnit: Codable, Equatable, Sendable {
    let id: String; let mealID: String; let experienceIDs: [String]; let attribute: String; let reference: String?; let label: String
    let target: String; let phase: String; let intensity: String?; let dishKindIDs: [String]; let liking: String; let intensityConflict: Bool
    let evidenceIDs: [String]; let evidence: [PersonalTasteEvidence]
}
struct PersonalTasteCandidate: Codable, Equatable, Identifiable, Sendable {
    let id: String; let attribute: String; let reference: String?; let label: String; let conditions: [PersonalTasteCondition]
    let title: String; let body: String; let status: String; let direction: String?
    let distribution: PersonalTasteDistribution; let baselineDistribution: PersonalTasteDistribution
    let supportMealIDs: [String]; let counterMealIDs: [String]; let neutralMealIDs: [String]; let mixedMealIDs: [String]
    let evidenceIDs: [String]; let evidence: [PersonalTasteEvidence]; let abstainReasons: [String]
    let stability: PersonalTasteStability; let contrastsWithBaseline: Bool
}
struct PersonalTasteNextSelection: Codable, Equatable, Identifiable, Sendable {
    let id: String; let attribute: String; let label: String; let facet: String; let question: String; let reason: String
    let evidenceIDs: [String]; let mealIDs: [String]; let createsEvidence: Bool
    let intent: String; let proposedCondition: PersonalTasteCondition?; let unobserved: Bool
    var responseSourceID: String? = nil
    var impact: PersonalTasteQuestionImpact? = nil
}
struct PersonalTasteOverallAssociation: Codable, Equatable, Sendable {
    let unitID: String; let mealID: String; let attribute: String; let individualValue: String; let overallValues: [String]; let evidenceIDs: [String]; let causalClaim: String?
}
struct PersonalTasteExcludedEvidence: Codable, Equatable, Sendable { let id: String; let reason: String }
struct PersonalTasteTemporalValidity: Codable, Equatable, Sendable { let mode: String; let asOf: String?; let missingKnownAtCount: Int; let historicalReconstruction: Bool }
struct PersonalTastePolicy: Codable, Equatable, Sendable {
    var minMeals: Int = 3
    var minConditionMeals: Int = 3
    var maxConditionDimensions: Int = 2
}
struct PersonalTasteModelSnapshot: Codable, Equatable, Sendable {
    let version: String; let userID: String; let policy: PersonalTastePolicy
    let units: [PersonalTasteUnit]; let candidates: [PersonalTasteCandidate]; let nextSelection: PersonalTasteNextSelection?
    let overallAssociations: [PersonalTasteOverallAssociation]; let excludedEvidence: [PersonalTasteExcludedEvidence]
    let temporalValidity: PersonalTasteTemporalValidity; let limits: [String]
    var fitPatterns: [PersonalTasteFitPattern] = []
    var overallPatterns: [PersonalTasteOverallPattern] = []
    // 화면용 대기열. 기존 저장/외부 전달 계약에는 nextSelection만 유지한다.
    var queuedSelections: [PersonalTasteNextSelection] = []
    var availableSelections: [PersonalTasteNextSelection] {
        queuedSelections.isEmpty ? [nextSelection].compactMap { $0 } : queuedSelections
    }
    enum CodingKeys: String, CodingKey {
        case version, userID, policy, units, candidates, nextSelection
        case overallAssociations, excludedEvidence, temporalValidity, limits, fitPatterns, overallPatterns
    }
}
struct PersonalTastePrediction: Codable, Equatable, Sendable { let direction: String?; let candidateID: String?; let status: String; let abstainReasons: [String]; let evidenceIDs: [String] }
struct PersonalTasteQuery: Sendable {
    let attribute: String; var reference: String? = nil; var target: String? = nil; var phase: String? = nil; var intensity: String? = nil; var dishKindIDs: [String] = []
}

/// 직접 보고한 조건의 식사별 분포를 비교한다. 숫자 신뢰도나 인과 효과를 만들지 않는다.
enum PersonalTasteModelBuilder {
    static let version = "tba-personal-taste-model/2"
    private static let outcomes = ["positive", "neutral", "negative"]
    static func unique(_ values: [String]) -> [String] { Array(Set(values)).sorted() }
    static func json(_ value: Any) -> String {
        String(data: (try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .fragmentsAllowed, .withoutEscapingSlashes])) ?? Data(), encoding: .utf8) ?? ""
    }
    static func canonical<T: Encodable>(_ value: T) -> String {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        return String(data: (try? encoder.encode(value)) ?? Data(), encoding: .utf8) ?? ""
    }
    static func nullable(_ value: String?) -> Any { value as Any? ?? NSNull() }
    static func identifier(_ type: String, _ parts: [Any]) -> String { type + ":" + SHA256.hash(data: Data(json(parts).utf8)).prefix(10).map { String(format: "%02x", $0) }.joined() }
    static func scope(_ r: PersonalTasteModelRecord) -> String { json([r.experienceId, nullable(r.attribute), nullable(r.reference), r.target, r.phase]) }
    private static func attributeKey(_ u: PersonalTasteUnit) -> String { json([u.attribute, nullable(u.reference)]) }
    static func label(_ r: PersonalTasteModelRecord) -> String {
        r.reference ?? r.attributeLabel ?? ["taste.sweet":"단맛", "taste.sour":"산미", "taste.salty":"짠맛", "taste.bitter":"쓴맛", "taste.umami":"감칠맛", "texture.crisp":"바삭함", "texture.soft":"부드러운 식감", "aroma.roasted":"구운 향"][r.attribute ?? ""] ?? r.attribute ?? ""
    }
    static func date(_ value: String?) -> Date? {
        guard let value else { return nil }
        let formatter = ISO8601DateFormatter(); formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: value) ?? ISO8601DateFormatter().date(from: value)
    }
    static func timestamp(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter(); formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return formatter.string(from: date)
    }
    private static func vote(_ units: [PersonalTasteUnit]) -> ([(String, String)], PersonalTasteDistribution) {
        let groups = Dictionary(grouping: units, by: \.mealID)
        let meals = groups.keys.sorted().map { id -> (String,String) in let values = unique(groups[id]!.map(\.liking)); return (id, values.count == 1 ? values[0] : "mixed") }
        var d = PersonalTasteDistribution(positive: 0, neutral: 0, negative: 0, mixed: 0, mealCount: meals.count)
        for (_, value) in meals { switch value { case "positive": d.positive += 1; case "negative": d.negative += 1; case "neutral": d.neutral += 1; default: d.mixed += 1 } }
        return (meals, d)
    }
    private static func leader(_ d: PersonalTasteDistribution) -> String? {
        let values = ["positive":d.positive, "neutral":d.neutral, "negative":d.negative]; let maximum = values.values.max() ?? 0
        let winners = outcomes.filter { values[$0] == maximum }; return maximum > 0 && winners.count == 1 ? winners[0] : nil
    }
    private static func value(_ u: PersonalTasteUnit, _ dimension: String) -> String? { switch dimension { case "target": u.target; case "phase": u.phase; case "intensity": u.intensity; default: nil } }
    private static func matches(_ u: PersonalTasteUnit, _ conditions: [PersonalTasteCondition]) -> Bool { conditions.allSatisfy { $0.dimension == "dishKind" ? u.dishKindIDs.contains($0.value) : value(u, $0.dimension) == $0.value } }
    private static func conditionList(_ u: PersonalTasteUnit) -> [PersonalTasteCondition] {
        ["target", "phase", "intensity"].compactMap { dimension in guard let value = value(u, dimension), value != "unspecified" else { return nil }; return .init(dimension: dimension, value: value) } + u.dishKindIDs.map { .init(dimension: "dishKind", value: $0) }
    }
    private static func conditionLabel(_ c: PersonalTasteCondition) -> String {
        let labels = ["target":["sauce":"소스", "surface":"겉", "inside":"속", "whole_dish":"음식 전체", "broth":"국물"], "phase":["first_bite":"첫입", "early_meal":"초반", "during_meal":"먹는 동안", "late_meal":"나중", "after_swallow":"삼킨 뒤", "after_meal":"식사 후"], "intensity":["weak":"약한 강도", "medium":"중간 강도", "strong":"강한 강도"]]
        return labels[c.dimension]?[c.value] ?? c.value
    }
    static func evidence(_ records: [PersonalTasteModelRecord]) -> [PersonalTasteEvidence] {
        var byID: [String: PersonalTasteEvidence] = [:]
        for r in records { byID[r.observationId] = .init(id: r.observationId, mealID: r.mealId, phrase: r.phrase, sourceSpans: r.sourceSpans, selectionEvidence:r.selectionEvidence, conditionSources:r.conditionSources) }
        return byID.keys.sorted().compactMap { byID[$0] }
    }
    private struct Rated { let record: PersonalTasteModelRecord; let intensity: String?; let conflict: Bool; let intensityRows: [PersonalTasteModelRecord] }
    static func sameSelection(_ a: PersonalTasteModelRecord, _ b: PersonalTasteModelRecord) -> Bool {
        guard let x = a.selectionEvidence else { return b.selectionEvidence == nil }
        guard let y = b.selectionEvidence else { return false }
        return x.selectionID == y.selectionID && x.type == y.type && x.catalogVersion == y.catalogVersion && x.relatedBubbleID == y.relatedBubbleID
    }
    private static func subtract(_ d: PersonalTasteDistribution, _ value: String) -> PersonalTasteDistribution {
        var next = d; next.mealCount -= 1
        switch value { case "positive": next.positive -= 1; case "negative": next.negative -= 1; case "neutral": next.neutral -= 1; default: next.mixed -= 1 }
        return next
    }
    struct Question { let attribute: String; let reference: String?; let label: String; let facet: String; let reason: String; var score: Int; var evidenceIDs: [String]; var mealIDs: [String]; let target: String; let phase: String; var intent: String = "clarification"; var proposedCondition: PersonalTasteCondition? = nil; var responseSourceID: String? = nil; var impact: PersonalTasteQuestionImpact? = nil }

    static func buildRecords(records: [PersonalTasteModelRecord], userID: String, asOf: Date? = nil, policy: PersonalTastePolicy = .init(), suppressedQuestionIDs: [String] = [], assessQuestions: Bool = true, includeEvidence: Bool = true) -> PersonalTasteModelSnapshot {
        precondition(policy.minMeals >= 2 && policy.minConditionMeals >= 2 && policy.maxConditionDimensions == 2)
        var excluded: [PersonalTasteExcludedEvidence] = []; var included: [PersonalTasteModelRecord] = []; var missingKnownAtCount = 0
        let byID = Dictionary(grouping: records, by: \.observationId)
        for id in byID.keys.sorted() {
            let duplicates = byID[id]!, r = duplicates[0]; var reason: String?
            if duplicates.count > 1 && duplicates.contains(where: { canonical($0) != canonical(r) }) { reason = "conflicting_record_identity" }
            else if r.userId != userID { reason = "different_user" }
            else if userID.isEmpty || id.isEmpty || r.experienceId.isEmpty || r.mealId.isEmpty { reason = "missing_record_identity" }
            if r.knownAt == nil { missingKnownAtCount += 1 }
            if reason == nil, let asOf {
                if date(r.observedAt) == nil { reason = "observed_time_unknown" }
                else if date(r.knownAt) == nil { reason = "known_time_unknown" }
                else if date(r.observedAt)! > asOf || date(r.knownAt)! > asOf { reason = "after_cutoff" }
            }
            if reason == nil && !["explicit_user_choice", "rule_extracted_statement"].contains(r.confirmationStatus) { reason = "unconfirmed" }
            if let reason { excluded.append(.init(id: id, reason: reason)); continue }
            var copy = r; copy.dishKindIDs = unique(r.dishKindIDs); included.append(copy)
        }
        let scopeGroups = Dictionary(grouping: included, by: scope)
        var ratingGroups: [String: [Rated]] = [:]
        for r in included where r.kind == "attribute_liking" {
            var reason: String?
            if r.attribute == nil || r.attribute?.hasSuffix(".unspecified") == true { reason = "unknown_attribute" }
            else if !outcomes.contains(r.value.text) || r.scale != "attribute-three-category-v1" { reason = "unsupported_liking" }
            else if (scopeGroups[scope(r)] ?? []).contains(where: { $0.kind == "sensory_presence" && $0.value == .flag(false) && sameSelection($0, r) }) { reason = "absence_qualified" }
            if let reason { excluded.append(.init(id: r.observationId, reason: reason)); continue }
            let intensityRows = (scopeGroups[scope(r)] ?? []).filter { $0.kind == "sensory_intensity" && $0.scale == "expression-strength-v1" && sameSelection($0, r) }
            let levels = unique(intensityRows.map { $0.value.text })
            let intensity = levels.count == 1 && ["weak", "medium", "strong"].contains(levels[0]) ? levels[0] : nil
            let key = json([userID, r.mealId, r.attribute!, nullable(r.reference), r.target, r.phase, nullable(intensity), r.dishKindIDs])
            ratingGroups[key, default: []].append(.init(record: r, intensity: intensity, conflict: levels.count > 1, intensityRows: intensityRows))
        }
        let units: [PersonalTasteUnit] = ratingGroups.keys.sorted().map { key in
            let rows = ratingGroups[key]!, r = rows[0].record, values = unique(rows.map { $0.record.value.text })
            return .init(id: identifier("unit", [key]), mealID: r.mealId, experienceIDs: unique(rows.map { $0.record.experienceId }), attribute: r.attribute!, reference: r.reference, label: label(r), target: r.target, phase: r.phase, intensity: rows[0].intensity, dishKindIDs: r.dishKindIDs, liking: values.count == 1 ? values[0] : "mixed", intensityConflict: rows.contains(where: \.conflict), evidenceIDs: includeEvidence ? unique(rows.flatMap { [$0.record.observationId] + $0.intensityRows.map(\.observationId) }) : [], evidence: includeEvidence ? evidence(rows.flatMap { [$0.record] + $0.intensityRows }) : [])
        }
        var candidates: [PersonalTasteCandidate] = []
        let attributes = Dictionary(grouping: units, by: attributeKey)
        for key in attributes.keys.sorted() {
            let attributeUnits = attributes[key]!, (_, base) = vote(attributeUnits)
            var conditionSets: [String: [PersonalTasteCondition]] = ["[]": []]
            var seenConditions = Set<[PersonalTasteCondition]>()
            for u in attributeUnits {
                let unsorted = conditionList(u)
                guard seenConditions.insert(unsorted).inserted else { continue }
                let available = unsorted.sorted { canonical($0) < canonical($1) }
                for c in available { conditionSets[canonical([c])] = [c] }
                for i in available.indices { for j in available.indices where j > i && available[i].dimension != available[j].dimension { let pair = [available[i], available[j]]; conditionSets[canonical(pair)] = pair } }
            }
            for conditionKey in conditionSets.keys.sorted() {
                let conditions = conditionSets[conditionKey]!, selected = attributeUnits.filter { matches($0, conditions) }
                let (meals, distribution) = vote(selected), rawDirection = leader(distribution)
                let opposite: String? = rawDirection == "positive" ? "negative" : rawDirection == "negative" ? "positive" : nil
                let counter = opposite.map { value in meals.filter { $0.1 == value }.map { $0.0 } } ?? (rawDirection == "neutral" ? meals.filter { ["positive","negative"].contains($0.1) }.map { $0.0 } : [])
                let minimum = conditions.isEmpty ? policy.minMeals : policy.minConditionMeals
                let unchanged = meals.filter { meal in rawDirection != nil && leader(subtract(distribution, meal.1)) == rawDirection }.count
                let stable = meals.count > 1 && unchanged == meals.count
                var reasons: [String] = []
                if meals.count < minimum { reasons.append(conditions.isEmpty ? "needs_independent_meals" : "condition_needs_repeated_meals") }
                if distribution.mixed > 0 { reasons.append("conflicting_reports_in_meal") }
                if rawDirection == nil { reasons.append("no_unique_direction") }
                if !counter.isEmpty { reasons.append("counter_evidence_present") }
                if !stable { reasons.append("leave_one_meal_out_unstable") }
                if conditions.contains(where: { $0.dimension == "intensity" }) && selected.contains(where: \.intensityConflict) { reasons.append("intensity_conflict") }
                let direction = reasons.isEmpty ? rawDirection : nil
                let status = direction != nil ? "repeated_direction" : distribution.mixed > 0 || !counter.isEmpty || rawDirection == nil ? "mixed" : meals.count < minimum ? (conditions.isEmpty ? "first_signal" : "insufficient_context") : "unstable"
                let first = selected[0], conditionText = conditions.map(conditionLabel).joined(separator: " · ")
                let title = conditions.isEmpty ? "\(first.label)에 남긴 평가" : "\(first.label), \(conditionText)에서 남긴 평가"
                let body: String
                if let direction { body = "\(meals.count)번의 식사에서 \(direction == "positive" ? "호감" : direction == "negative" ? "아쉬움" : "중립") 방향이 반복됐어요. 관찰한 조건의 기록이며 원인을 뜻하지 않아요." }
                else { body = "\(meals.count)번의 식사를 비교했어요. 반례나 부족한 조건을 확인하며 판단을 유보해요." }
                var evidenceByID: [String: PersonalTasteEvidence] = [:]; for item in selected.flatMap(\.evidence) { evidenceByID[item.id] = item }
                candidates.append(.init(id: identifier("candidate", [userID, key, conditionKey]), attribute: first.attribute, reference: first.reference, label: first.label, conditions: conditions, title: title, body: body, status: status, direction: direction, distribution: distribution, baselineDistribution: base, supportMealIDs: rawDirection.map { value in meals.filter { $0.1 == value }.map { $0.0 } } ?? [], counterMealIDs: counter, neutralMealIDs: meals.filter { $0.1 == "neutral" }.map { $0.0 }, mixedMealIDs: meals.filter { $0.1 == "mixed" }.map { $0.0 }, evidenceIDs: unique(selected.flatMap(\.evidenceIDs)), evidence: evidenceByID.keys.sorted().compactMap { evidenceByID[$0] }, abstainReasons: reasons, stability: .init(evaluatedMealCount: meals.count, unchangedCount: unchanged, stable: stable), contrastsWithBaseline: direction != nil && leader(base) != direction))
            }
        }
        candidates.sort { $0.id < $1.id }
        let fitPatterns = buildFitPatterns(included, userID: userID, policy: policy, includeEvidence: includeEvidence)
        let overallPatterns = buildOverallPatterns(included, userID: userID, includeEvidence: includeEvidence)
        let overallAssociations: [PersonalTasteOverallAssociation] = (includeEvidence ? units : []).compactMap { unit in
            let overall = included.filter { $0.kind == "overall_liking" && unit.experienceIDs.contains($0.experienceId) && $0.scale == "overall-five-category-v1" }
            guard !overall.isEmpty else { return nil }
            return .init(unitID: unit.id, mealID: unit.mealID, attribute: unit.attribute, individualValue: unit.liking, overallValues: unique(overall.map { $0.value.text }), evidenceIDs: unique(unit.evidenceIDs + overall.map(\.observationId)), causalClaim: nil)
        }
        excluded.sort { $0.id == $1.id ? $0.reason < $1.reason : $0.id < $1.id }
        func snapshot(_ next: PersonalTasteNextSelection?) -> PersonalTasteModelSnapshot {
            return .init(version: version, userID: userID, policy: policy, units: units, candidates: candidates, nextSelection: next, overallAssociations: overallAssociations, excludedEvidence: excluded, temporalValidity: .init(mode: asOf == nil ? "current_snapshot" : "historical_as_of", asOf: asOf.map(timestamp), missingKnownAtCount: missingKnownAtCount, historicalReconstruction: false), limits: ["분포는 기록한 식사 수이며 미래 호감 확률이 아니에요.", "조건별 차이는 연관이며 원인을 확정하지 않아요.", "전체 평가는 개별 감각의 평가를 바꾸지 않아요.", "과거 수정 이력이 없는 기록은 과거 상태로 복원하지 않아요."], fitPatterns: fitPatterns, overallPatterns: overallPatterns)
        }
        if !assessQuestions { return snapshot(nil) }
        var questions: [Question] = []
        for r in included where r.attribute != nil && r.attribute?.hasSuffix(".unspecified") != true && r.kind == "sensory_presence" && r.value == .flag(true) {
            if included.contains(where: { $0.kind == "attribute_liking" && scope($0) == scope(r) && sameSelection($0, r) }) { continue }
            questions.append(.init(attribute: r.attribute!, reference: r.reference, label: label(r), facet: "liking", reason: "liking_not_reported", score: 100, evidenceIDs: [r.observationId], mealIDs: [r.mealId], target: r.target, phase: r.phase))
        }
        for u in units {
            let missing: [(String,Bool,Int)] = [("intensity",u.intensity == nil,70),("target",u.target == "unspecified",60),("phase",u.phase == "unspecified",50)]
            for (facet, isMissing, score) in missing where isMissing {
                let unstable = candidates.contains { $0.attribute == u.attribute && $0.reference == u.reference && $0.status == "mixed" }
                questions.append(.init(attribute: u.attribute, reference: u.reference, label: u.label, facet: facet, reason: unstable ? "unstable_context_comparison" : "\(facet)_not_reported", score: unstable ? 90 : score, evidenceIDs: u.evidenceIDs, mealIDs: [u.mealID], target: u.target, phase: u.phase))
            }
        }
        questions += fitQuestions(included, patterns: fitPatterns)
        for key in attributes.keys.sorted() {
            let rows = attributes[key]!, known = unique(rows.compactMap(\.intensity))
            guard known.contains(where: { level in vote(rows.filter { $0.intensity == level }).1.mealCount >= policy.minConditionMeals }), let proposed = ["weak", "medium", "strong"].first(where: { !known.contains($0) }) else { continue }
            let first = rows[0]
            questions.append(.init(attribute:first.attribute,reference:first.reference,label:first.label,facet:"intensity",reason:"unobserved_intensity_comparison",score:10,evidenceIDs:unique(rows.flatMap(\.evidenceIDs)),mealIDs:unique(rows.map(\.mealID)),target:"unspecified",phase:"unspecified",intent:"exploration",proposedCondition:.init(dimension:"intensity",value:proposed)))
        }
        var questionGroups: [String: Question] = [:]
        for q in questions {
            let key = json([q.attribute, nullable(q.reference), q.facet, q.target, q.phase, q.intent, q.proposedCondition.map { ["dimension":$0.dimension,"value":$0.value] } as Any? ?? NSNull()])
            if var old = questionGroups[key] { old.score = max(old.score, q.score); old.evidenceIDs = unique(old.evidenceIDs + q.evidenceIDs); old.mealIDs = unique(old.mealIDs + q.mealIDs); questionGroups[key] = old }
            else { questionGroups[key] = q }
        }
        let suppressed = Set(suppressedQuestionIDs)
        questionGroups = questionGroups.filter { !suppressed.contains(identifier("next-selection", [userID, $0.key])) }
        if assessQuestions { questionGroups = assessQuestionGroups(questionGroups, included: included, userID: userID, policy: policy, candidates: candidates, fitPatterns: fitPatterns, overallPatterns: overallPatterns) }
        let ranked = questionGroups.keys.sorted { a,b in
            let left = questionGroups[a]!, right = questionGroups[b]!
            let leftImpact = left.impact?.changedInterpretationCount ?? 0, rightImpact = right.impact?.changedInterpretationCount ?? 0
            if leftImpact != rightImpact { return leftImpact > rightImpact }
            if left.score != right.score { return left.score > right.score }
            if left.mealIDs.count != right.mealIDs.count { return left.mealIDs.count > right.mealIDs.count }
            return a < b
        }
        let selections: [PersonalTasteNextSelection] = ranked.map { key in
            let q = questionGroups[key]!
            let question = q.intent == "exploration" ? "다음 식사에서 \(conditionLabel(q.proposedCondition!))로 느낀 \(q.label)는 어떤지 확인해 볼까요?" : ["liking":"\(q.label) 자체는 어땠나요?", "intensity":"\(q.label)는 어느 정도로 느껴졌나요?", "target":"\(q.label)는 어느 부분에서 느껴졌나요?", "phase":"\(q.label)는 언제 느껴졌나요?"][q.facet]!
            return .init(id: identifier("next-selection", [userID, key]), attribute: q.attribute, label: q.label, facet: q.facet, question: question, reason: q.reason, evidenceIDs: unique(q.evidenceIDs), mealIDs: unique(q.mealIDs), createsEvidence: false, intent:q.intent, proposedCondition:q.proposedCondition, unobserved:q.intent == "exploration", responseSourceID: q.responseSourceID, impact: q.impact)
        }
        var result = snapshot(selections.first)
        result.queuedSelections = selections
        return result
    }

    static func predict(_ model: PersonalTasteModelSnapshot, query: PersonalTasteQuery) -> PersonalTastePrediction {
        let dimensions = [("target",query.target),("phase",query.phase),("intensity",query.intensity)]
        let explicit = dimensions.compactMap { d, v -> PersonalTasteCondition? in guard let v, v != "unspecified" else { return nil }; return .init(dimension:d,value:v) } + query.dishKindIDs.map { PersonalTasteCondition(dimension:"dishKind",value:$0) }
        let units = model.units.filter { $0.attribute == query.attribute && $0.reference == query.reference && matches($0, explicit) }
        let (exactMeals, distribution) = vote(units), minimum = explicit.isEmpty ? model.policy.minMeals : model.policy.minConditionMeals
        func failure(_ reason: String) -> PersonalTastePrediction { .init(direction:nil,candidateID:nil,status:"abstained",abstainReasons:[reason],evidenceIDs:unique(units.flatMap(\.evidenceIDs))) }
        if units.isEmpty { return failure("unobserved_attribute_or_conditions") }
        if distribution.mealCount < minimum { return failure("query_conditions_need_repeated_meals") }
        if distribution.mixed > 0 || distribution.positive > 0 && distribution.negative > 0 { return failure("query_condition_counter_evidence") }
        let exactDirection = leader(distribution)
        if exactDirection == "neutral" && (distribution.positive > 0 || distribution.negative > 0) { return failure("query_condition_counter_evidence") }
        if exactDirection == nil || exactMeals.contains(where: { leader(subtract(distribution,$0.1)) != exactDirection }) { return failure("query_leave_one_meal_out_unstable") }
        let candidates = model.candidates.filter { candidate in
            candidate.attribute == query.attribute && candidate.reference == query.reference && candidate.conditions.allSatisfy { c in
                switch c.dimension { case "dishKind": return query.dishKindIDs.contains(c.value); case "target": return query.target == c.value; case "phase": return query.phase == c.value; case "intensity": return query.intensity == c.value; default: return false }
            }
        }
        let depth = candidates.map { $0.conditions.count }.max() ?? -1
        let best = candidates.filter { $0.conditions.count == depth }.sorted { $0.distribution.mealCount != $1.distribution.mealCount ? $0.distribution.mealCount > $1.distribution.mealCount : $0.id < $1.id }
        let supported = best.filter { $0.direction != nil }
        if supported.isEmpty { return failure("specific_condition_abstained") }
        let directions = unique(supported.compactMap(\.direction))
        if directions.count == 1, directions[0] == leader(distribution), let selected = supported.first { return .init(direction:selected.direction,candidateID:selected.id,status:"observed_condition_direction",abstainReasons:[],evidenceIDs:unique(units.flatMap(\.evidenceIDs))) }
        return failure(directions.count > 1 ? "conflicting_matching_conditions" : "no_supported_condition")
    }
}

struct PersonalTasteModelContract: Decodable {
    struct Fixture: Decodable {
        struct Prediction: Decodable { let query: PersonalTasteContractQuery; let expected: PersonalTastePrediction }
        let id: String; let userID: String; let records: [PersonalTasteModelRecord]; let asOf: String?; let expected: PersonalTasteModelSnapshot; let predictions: [Prediction]
    }
    let version: String; let fixtures: [Fixture]
}
struct PersonalTasteContractQuery: Decodable {
    let attribute: String; let reference: String?; let target: String?; let phase: String?; let intensity: String?; let dishKindIDs: [String]?
    var query: PersonalTasteQuery { .init(attribute:attribute,reference:reference,target:target,phase:phase,intensity:intensity,dishKindIDs:dishKindIDs ?? []) }
}
