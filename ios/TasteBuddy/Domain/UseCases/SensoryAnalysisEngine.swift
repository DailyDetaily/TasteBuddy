import Foundation
import CryptoKit

/// Deterministic, API-free native mirror of the sensory contract. The legacy axis engine is not an input.
enum SensoryAnalysisEngine {
    static let version = "tba-native-sensory/2"
    static let contract: SensoryNativeContract? = {
        let bundle = Bundle.main
        guard let url = bundle.url(forResource: "tba-sensory-contract", withExtension: "json", subdirectory: "TBA")
            ?? bundle.url(forResource: "tba-sensory-contract", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(SensoryNativeContract.self, from: data)
    }()

    enum AnalysisError: Error, LocalizedError {
        case contractUnavailable
        var errorDescription: String? { "감각 분석 기준을 불러오지 못했어요." }
    }
    static func analyze(entries: [DiningEntry], userID: String = "local-owner", asOf: Date? = nil, suppressedQuestionIDs: [String] = [], preferenceSubmissions: [PreferenceIntakeSubmission] = []) throws -> SensoryAnalysisSnapshot {
        try analyze(entries: entries, contract: contract, userID: userID, asOf: asOf, suppressedQuestionIDs: suppressedQuestionIDs, preferenceSubmissions: preferenceSubmissions)
    }
    static func analyze(entries: [DiningEntry], contract: SensoryNativeContract?, userID: String = "local-owner", asOf: Date? = nil, suppressedQuestionIDs: [String] = [], preferenceSubmissions: [PreferenceIntakeSubmission] = []) throws -> SensoryAnalysisSnapshot {
        guard contract != nil else { throw AnalysisError.contractUnavailable }
        var snapshot = buildSnapshot(entries: entries, contract: contract, userID: userID, asOf: asOf, suppressedQuestionIDs: suppressedQuestionIDs)
        snapshot.statedPreferences = PreferenceIntakeContractEngine.evidence(submissions: preferenceSubmissions, userID: userID, asOf: asOf)
        return snapshot
    }

    private static func buildSnapshot(entries: [DiningEntry], contract: SensoryNativeContract?, userID: String, asOf: Date?, suppressedQuestionIDs: [String]) -> SensoryAnalysisSnapshot {
        // Repeated IDs are not independent experiences. Use the latest supplied copy once.
        var seen: Set<UUID> = []
        let completed = entries.filter { $0.hasCompletedTasteFeedback && seen.insert($0.id).inserted }
        let parser = contract.map(SensoryNativeParser.init)
        let labels = Dictionary(uniqueKeysWithValues: (contract?.semantic.attributes ?? []).map { ($0.id, $0.label ?? $0.meaning) })
        var observations: [SensoryObservation] = []
        var unresolved: [SensoryUnresolved] = []
        for entry in completed {
            var sources: [(String, String, SensoryRuleResult)] = []
            if let overall = entry.overallEvaluation { sources.append(("overallEvaluation:liking", overall.responseLabelSnapshot, overall.parse())) }
            let selections: [DiningSensorySelection]
            if let direct = entry.sensorySelections { selections = direct }
            else {
                let ids = entry.tasteExperienceIDs.map { ($0, DiningSensorySelection.Kind.bubble) } + entry.detailTagIDs.map { ($0, DiningSensorySelection.Kind.detailTag) }
                selections = ids.map { id, kind in
                    let known = contract?.selectionCatalog.entries.first { $0.id == id && $0.type == kind.rawValue }
                    let oldLabel = kind == .bubble ? TasteExperienceCatalog.experienceByID[id]?.label : DiningDetailTagCatalog.metadata(for: id)?.label
                    return DiningSensorySelection(id: id, type: kind, labelSnapshot: known?.label ?? oldLabel ?? id)
                }
            }
            if let contract {
                let chosen = DiningSensorySelectionParser.parse(selections, catalog: contract.selectionCatalog)
                for atom in chosen.observations {
                    let evidence = atom.selectionEvidence
                    let field = "sensorySelections:\(evidence?.type ?? ""):\(evidence?.selectionID ?? ""):\(evidence?.facet ?? "selection")"
                    sources.append((field, atom.phrase ?? "", .init(observations: [atom])))
                }
                for pending in chosen.unresolved {
                    let evidence = pending.selectionEvidence
                    let field = "sensorySelections:\(evidence?.type ?? ""):\(evidence?.selectionID ?? ""):\(evidence?.facet ?? "selection")"
                    sources.append((field, pending.phrase, .init(unresolved: [pending], needsAI: false)))
                }
            }
            if !entry.note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isLegacySelectionSummary(entry, contract: contract), let parser {
                sources.append(("note", entry.note, parser.parse(entry.note)))
            }
            for (field, original, result) in sources {
                for atom in result.observations {
                    guard let phrase = atom.phrase, let spans = atom.sourceSpans,
                          spans.allSatisfy({ span in
                              let ns = original as NSString
                              return span.start >= 0 && span.end > span.start && span.end <= ns.length && ns.substring(with: NSRange(location: span.start, length: span.end - span.start)) == span.quote
                          }) else { continue }
                    let id = stableID([entry.id.uuidString, field, atom.kind, atom.attribute ?? "", atom.value.text, atom.target ?? "whole_dish", atom.phase ?? "unspecified", phrase, String(spans.first?.start ?? 0), evidenceIdentity(atom.selectionEvidence)])
                    observations.append(.init(id: id, experienceID: entry.id, foodName: entry.menu, recordedAt: entry.date, sourceField: field, kind: atom.kind, attribute: atom.attribute, attributeLabel: atom.reference ?? labels[atom.attribute ?? ""] ?? "음식 전체", value: atom.value, scale: atom.scale, target: atom.target ?? "whole_dish", phase: atom.phase ?? "unspecified", phrase: phrase, sourceSpans: spans, reference: atom.reference, combinationComponents: atom.combinationComponents ?? [], selectionEvidence: atom.selectionEvidence, mealID: entry.mealID, observedAt: entry.observedAt, knownAt: entry.updatedAt ?? entry.savedAt, dishKindIDs: entry.dishKindIDs, restaurantID: entry.restaurantID, menuItemID: entry.menuItemID, restaurantName: entry.restaurant))
                }
                for pending in result.unresolved {
                    unresolved.append(.init(id: stableID([entry.id.uuidString, field, pending.reason, pending.phrase, String(pending.sourceSpans.first?.start ?? 0), evidenceIdentity(pending.selectionEvidence)]), experienceID: entry.id, foodName: entry.menu, recordedAt: entry.date, sourceField: field, phrase: pending.phrase, reason: pending.reason, sourceSpans: pending.sourceSpans, needsMeaningReview: result.needsAI || pending.selectionEvidence != nil, selectionEvidence: pending.selectionEvidence, observedAt: entry.observedAt, knownAt: entry.updatedAt ?? entry.savedAt))
                }
            }
        }
        observations = dedupe(observations, by: { $0.id })
        unresolved = dedupe(unresolved, by: { $0.id })
        let entriesByID = Dictionary(uniqueKeysWithValues: completed.map { ($0.id,$0) })
        let personalModel = PersonalTasteModelBuilder.buildRecords(records: observations.map { o in
            .init(observationId: o.id, userId: userID, experienceId: o.experienceID.uuidString.lowercased(), mealId: o.independentMealID.uuidString.lowercased(), kind: o.kind, attribute: o.attribute, attributeLabel: o.attributeLabel, reference: o.reference, value: o.value, scale: o.scale, target: o.target, phase: o.phase, observedAt: o.observedAt.map(PersonalTasteModelBuilder.timestamp), knownAt: o.knownAt.map(PersonalTasteModelBuilder.timestamp), dishKindIDs: o.dishKindIDs, phrase: o.phrase, sourceSpans: o.sourceSpans, confirmationStatus: o.selectionEvidence == nil ? "rule_extracted_statement" : "explicit_user_choice", selectionEvidence: o.selectionEvidence, conditionSources: personalConditionSources(o, entry: entriesByID[o.experienceID]))
        }, userID: userID, asOf: asOf, suppressedQuestionIDs: suppressedQuestionIDs)
        if let asOf {
            observations = observations.filter { ($0.observedAt ?? .distantFuture) <= asOf && ($0.knownAt ?? .distantFuture) <= asOf }
            unresolved = unresolved.filter { ($0.observedAt ?? .distantFuture) <= asOf && ($0.knownAt ?? .distantFuture) <= asOf }
        }
        return .init(engineVersion: "\(version):\(contract?.ruleVersion ?? "unavailable")", observations: observations, unresolved: unresolved, insights: buildInsights(observations), mainWing: buildProfile(observations, styles: contract?.styles ?? []), completedExperienceCount: completed.filter { entry in asOf.map { entry.observedAt <= $0 && (entry.updatedAt ?? entry.savedAt ?? .distantFuture) <= $0 } ?? true }.count, sourceExperienceCount: Set(observations.filter { ($0.kind != "sensory_detail" && $0.kind != "unresolved") || ($0.selectionEvidence != nil && $0.selectionEvidence?.resolution != "unresolved") }.map(\.experienceID)).count, actualApiCalls: 0, needsMeaningReview: unresolved.contains(where: \.needsMeaningReview), limits: ["직접 남긴 감각과 평가만 해석하며 음식 이름·기존 점수로 취향을 추정하지 않아요.", "미등록 표현과 복잡한 조건은 원문으로 보관하고 의미 확인을 기다려요.", "메인·윙은 반복 기록을 구분하는 표시 정책이며 검증된 확률이나 고정 성격이 아니에요.", "같은 식사의 여러 기록은 mealID로 묶어 반복 횟수를 계산해요."], personalModel: personalModel, perception: TastePerceptionEngine.build(observations: observations, asOf: asOf))
    }

    private static func personalConditionSources(_ observation: SensoryObservation, entry: DiningEntry?) -> [PersonalTasteConditionSource] {
        var result = observation.dishKindIDs.map { PersonalTasteConditionSource(dimension:"dishKind",value:$0,sourceField:"dishKindIDs:\($0)",labelSnapshot:nil) }
        for (dimension,value) in [("target",observation.target),("phase",observation.phase)] where value != "unspecified" {
            var sourceField = observation.sourceField, label = observation.phrase
            if let evidence = observation.selectionEvidence {
                let selected = entry?.sensorySelections?.first { $0.id == evidence.selectionID && $0.type.rawValue == evidence.type }
                let parent = entry?.sensorySelections?.first { $0.type == .bubble && $0.id == evidence.relatedBubbleID }
                let directValue = dimension == "target" ? selected?.target.rawValue : selected?.phase.rawValue
                let parentValue = dimension == "target" ? parent?.target.rawValue : parent?.phase.rawValue
                if directValue == value, let selected {
                    sourceField = "sensorySelections:\(selected.type.rawValue):\(selected.id):\(dimension)"
                    label = dimension == "target" ? selected.target.label : selected.phase.label
                } else if parentValue == value, let parent {
                    sourceField = "sensorySelections:bubble:\(parent.id):\(dimension)"
                    label = dimension == "target" ? parent.target.label : parent.phase.label
                } else { sourceField = "sensorySelections:\(evidence.type):\(evidence.selectionID):selection"; label = evidence.labelSnapshot }
            }
            result.append(.init(dimension:dimension,value:value,sourceField:sourceField,labelSnapshot:label))
        }
        if observation.kind == "sensory_intensity" { result.append(.init(dimension:"intensity",value:observation.value.text,sourceField:observation.sourceField,labelSnapshot:observation.selectionEvidence?.labelValue ?? observation.phrase)) }
        return result
    }

    private static func isLegacySelectionSummary(_ entry: DiningEntry, contract: SensoryNativeContract?) -> Bool {
        let suffix = "으로 기억에 남은 식후 피드백입니다."
        guard entry.note.hasSuffix(suffix), let contract else { return false }
        let segments = String(entry.note.dropLast(suffix.count)).components(separatedBy: ", ")
        let known = Set(contract.selectionCatalog.entries.filter { $0.type == "bubble" }.map(\.label))
        return !segments.isEmpty && segments.enumerated().allSatisfy { index, text in
            let prefix = index == 0 ? "메인 미각 " : "보조 미각 "
            return text.hasPrefix(prefix) && known.contains(String(text.dropFirst(prefix.count)))
        }
    }

    static func parse(_ text: String, contract: SensoryNativeContract, target: String? = nil, phase: String? = nil) -> SensoryRuleResult {
        SensoryNativeParser(contract: contract).parse(text, target: target, phase: phase)
    }
    static func parseChoice(id: String, label: String, contract: SensoryNativeContract, target: String? = nil, phase: String? = nil) -> SensoryRuleResult {
        SensoryNativeParser(contract: contract).parseChoice(label: label, id: id, target: target, phase: phase)
    }
    private static func evidenceIdentity(_ evidence: SensorySelectionEvidence?) -> String {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
        return String(data: (try? encoder.encode(evidence)) ?? Data(), encoding: .utf8) ?? ""
    }
    private static func evidenceText(_ item: SensoryObservation) -> String {
        guard let evidence = item.selectionEvidence else { return "“\(item.phrase)”" }
        return "선택 ‘\(evidence.labelSnapshot)’ · 응답 ‘\(evidence.labelValue)’"
    }
    private static func stableID(_ components: [String]) -> String {
        let data = (try? JSONEncoder().encode(components)) ?? Data()
        return SHA256.hash(data: data).prefix(12).map { String(format: "%02x", $0) }.joined()
    }
    private static func dedupe<T>(_ values: [T], by key: (T) -> String) -> [T] { var seen: Set<String> = []; return values.filter { seen.insert(key($0)).inserted } }
    private static func scopeKey(_ o: SensoryObservation) -> String { [o.experienceID.uuidString, o.attribute ?? "", o.reference ?? "", o.target, o.phase].joined(separator: "|") }
    private static func directLiking(_ records: [SensoryObservation]) -> [SensoryObservation] {
        records.filter { item in
            item.kind == "attribute_liking" && item.attribute?.hasSuffix(".unspecified") != true && !records.contains { $0.kind == "sensory_presence" && $0.value == .flag(false) && scopeKey($0) == scopeKey(item) }
        }
    }

    private static func buildInsights(_ records: [SensoryObservation]) -> [SensoryInsight] {
        let groups = Dictionary(grouping: directLiking(records)) { [$0.attribute ?? "", $0.reference ?? ""].joined(separator: "|") }
        var findings: [SensoryInsight] = []
        for key in groups.keys.sorted() {
            guard let items = groups[key], let first = items.first else { continue }
            let positive = items.filter { $0.value == .text("positive") }
            let negative = items.filter { $0.value == .text("negative") }
            guard !positive.isEmpty || !negative.isEmpty else { continue }
            let meals = Array(Set(items.map(\.experienceID))).sorted { $0.uuidString < $1.uuidString }
            let title: String, body: String, kind: String
            if let good = positive.first, let bad = negative.first {
                let differentContext = Set(items.map { [$0.foodName, $0.target, $0.phase].joined(separator: "|") }).count > 1
                kind = differentContext ? "contextual_preference" : "variable_preference"
                title = "\(first.attributeLabel), 달랐던 반응"
                body = "\(good.foodName)에서는 \(evidenceText(good)), \(bad.foodName)에서는 \(evidenceText(bad))라고 남겼어요."
            } else {
                kind = meals.count > 1 ? "repeated_preference" : "scoped_preference"
                title = positive.isEmpty ? "\(first.attributeLabel)이 아쉬웠던 기록" : "\(first.attributeLabel)에서 찾은 즐거움"
                body = meals.count > 1 ? "\(meals.count)개 기록에서 \(positive.isEmpty ? "아쉬움" : "호감")을 직접 남겼어요. \(evidenceText(first))" : "\(first.foodName)에서 \(evidenceText(first))라고 남겼어요."
            }
            findings.append(.init(id: stableID(["insight", key, kind] + items.map(\.id).sorted()), kind: kind, attribute: first.attribute, title: title, body: body, evidenceIDs: items.map(\.id), experienceIDs: meals))
        }
        for item in records where item.kind == "attribute_liking" && item.attribute?.hasSuffix(".unspecified") == true && item.selectionEvidence != nil {
            let evidence = item.selectionEvidence!
            findings.append(.init(id: stableID(["selected_descriptor", item.id]), kind: "selected_descriptor_preference", attribute: item.attribute, title: "\(evidence.labelSnapshot)에 남긴 평가", body: "선택한 표현 ‘\(evidence.labelSnapshot)’에 ‘\(evidence.labelValue)’라고 응답했어요.", evidenceIDs: [item.id], experienceIDs: [item.experienceID]))
        }
        for item in records where item.kind == "combination_liking" || item.kind == "preference_fit" {
            findings.append(.init(id: stableID(["scoped", item.id]), kind: item.kind, attribute: item.attribute, title: item.kind == "combination_liking" ? "함께 먹을 때 남긴 느낌" : "이 음식에서 느낀 알맞은 정도", body: "\(item.foodName): \(evidenceText(item))", evidenceIDs: [item.id], experienceIDs: [item.experienceID]))
        }
        // 부재가 포함된 평가는 해당 감각 자체의 호감으로 분리하지 않는다.
        for item in records where item.kind == "attribute_liking" {
            let absence = records.filter { $0.kind == "sensory_presence" && $0.value == .flag(false) && scopeKey($0) == scopeKey(item) }
            guard !absence.isEmpty else { continue }
            let evidence = [item] + absence
            findings.append(.init(id: stableID(["qualified", item.id]), kind: "qualified_preference", attribute: item.attribute, title: "감각이 없었던 경험의 평가", body: "\(item.foodName)에서 \(evidenceText(item))라고 남겼어요. 감각의 부재를 포함한 이 경험의 평가예요.", evidenceIDs: evidence.map(\.id), experienceIDs: [item.experienceID]))
        }
        let direct = directLiking(records)
        let scoped = Dictionary(grouping: direct, by: scopeKey)
        for key in scoped.keys.sorted() {
            guard let liking = scoped[key], let first = liking.first else { continue }
            let intensity = records.filter { $0.kind == "sensory_intensity" && scopeKey($0) == key }
            guard let level = intensity.first, Set(intensity.map(\.value)).count == 1, Set(liking.map(\.value)).count == 1 else { continue }
            let evidence = liking + intensity
            findings.append(.init(id: stableID(["intensity_liking", key] + evidence.map(\.id).sorted()), kind: "intensity_and_liking", attribute: first.attribute, title: "\(first.attributeLabel), 함께 남긴 강도와 평가", body: "\(first.foodName)에서 \(evidenceText(level)), \(evidenceText(first))라고 남겼어요. 같은 대상과 시점에 남긴 표현이에요.", evidenceIDs: evidence.map(\.id), experienceIDs: [first.experienceID]))
        }
        let phaseLabels = ["first_bite": "첫입", "early_meal": "초반", "during_meal": "먹는 동안", "late_meal": "나중", "after_swallow": "삼킨 뒤", "after_meal": "식사 후"]
        let targetLabels = ["surface": "겉", "inside": "속", "sauce": "소스", "coating": "튀김옷", "skin": "껍질", "broth": "국물", "noodles": "면", "meat": "고기", "filling": "소", "flesh": "속살", "cream": "크림"]
        for dimension in ["phase", "target"] {
            let groups = Dictionary(grouping: direct) { item in [item.experienceID.uuidString, item.attribute ?? "", item.reference ?? "", dimension == "phase" ? item.target : item.phase].joined(separator: "|") }
            for key in groups.keys.sorted() {
                let items = (groups[key] ?? []).filter { dimension == "phase" ? phaseLabels[$0.phase] != nil : targetLabels[$0.target] != nil }
                guard let first = items.first, Set(items.map { dimension == "phase" ? $0.phase : $0.target }).count > 1, Set(items.map(\.value)).count > 1 else { continue }
                let kind = dimension == "phase" ? "within_meal_difference" : "target_preference_difference"
                let details = items.map { item in "\((dimension == "phase" ? phaseLabels[item.phase] : targetLabels[item.target]) ?? "")에는 \(evidenceText(item))" }.joined(separator: " / ")
                findings.append(.init(id: stableID([kind, key] + items.map(\.id).sorted()), kind: kind, attribute: first.attribute, title: "\(first.attributeLabel), \(dimension == "phase" ? "시점" : "부위")에 따라 달랐던 평가", body: details, evidenceIDs: items.map(\.id), experienceIDs: [first.experienceID]))
            }
        }
        return findings.sorted { left, right in
            let priorities = ["within_meal_difference": 6, "target_preference_difference": 6, "contextual_preference": 5, "qualified_preference": 4, "intensity_and_liking": 3]
            let leftPriority = priorities[left.kind, default: 0], rightPriority = priorities[right.kind, default: 0]
            if leftPriority != rightPriority { return leftPriority > rightPriority }
            return left.experienceCount != right.experienceCount ? left.experienceCount > right.experienceCount : left.id < right.id
        }
    }

    private static func buildProfile(_ records: [SensoryObservation], styles: [SensoryNativeContract.Style]) -> SensoryMainWing {
        let direct = directLiking(records)
        let candidates = styles.map { style -> SensoryStyleCandidate in
            let relevant = (style.id == "harmonist" ? direct + records.filter { $0.kind == "combination_liking" } : direct).filter { item in
                if style.id == "harmonist" && item.kind == "combination_liking" { return true }
                if style.id == "texturalist" { return item.attribute?.hasPrefix("texture.") == true }
                if style.id == "maximalist" {
                    guard ["taste", "aroma", "trigeminal"].contains(item.domain ?? "") else { return false }
                    let levels = Set(records.filter { $0.kind == "sensory_intensity" && scopeKey($0) == scopeKey(item) }.map(\.value))
                    return levels == [.text("strong")]
                }
                return style.attributes.contains(item.attribute ?? "")
            }
            let support = relevant.filter { $0.value == .text("positive") }, counter = relevant.filter { $0.value == .text("negative") }
            let supportCount = Set(support.map(\.independentMealID)).count, counterCount = Set(counter.map(\.independentMealID)).count
            let status = !support.isEmpty && !counter.isEmpty ? "mixed" : supportCount >= 2 ? "repeated_support" : !support.isEmpty ? "first_signal" : !counter.isEmpty ? "scoped_dislike" : "unknown"
            return .init(id: style.id, name: style.name, label: style.label, status: status, supportEvidenceIDs: support.map(\.id), counterEvidenceIDs: counter.map(\.id), supportExperienceCount: supportCount, counterExperienceCount: counterCount, eligible: supportCount >= 2 && supportCount > counterCount)
        }
        func stronger(_ a: SensoryStyleCandidate, _ b: SensoryStyleCandidate) -> Bool {
            let netA = a.supportExperienceCount - a.counterExperienceCount, netB = b.supportExperienceCount - b.counterExperienceCount
            return netA != netB ? netA > netB : a.supportExperienceCount > b.supportExperienceCount
        }
        func leader(_ options: [SensoryStyleCandidate]) -> SensoryStyleCandidate? {
            guard let first = options.sorted(by: stronger).first else { return nil }
            return options.filter { !stronger($0, first) && !stronger(first, $0) }.count == 1 ? first : nil
        }
        let eligible = candidates.filter(\.eligible), main = leader(eligible)
        let wingOptions = eligible.filter { item in
            guard let main, item.id != main.id else { return false }
            let remaining = records.filter { item.supportEvidenceIDs.contains($0.id) && !main.supportEvidenceIDs.contains($0.id) }
            return Set(remaining.map(\.independentMealID)).count >= 2
        }
        let wing = leader(wingOptions)
        return .init(status: main != nil ? "provisional_profile" : eligible.isEmpty ? "learning" : "ambiguous_main", main: main, wing: wing, candidates: candidates, label: main.map { $0.name + (wing.map { " · \($0.name) 윙" } ?? "") } ?? (eligible.isEmpty ? "입맛을 알아가는 중이에요" : "여러 취향이 함께 보여요"))
    }
}

private final class SensoryNativeParser {
    let contract: SensoryNativeContract
    var regexes: [String: NSRegularExpression] = [:]
    init(contract: SensoryNativeContract) { self.contract = contract }
    func regex(_ pattern: String) -> NSRegularExpression? {
        if let regex = regexes[pattern] { return regex }
        let compiled = try? NSRegularExpression(pattern: pattern)
        regexes[pattern] = compiled
        return compiled
    }
    func matches(_ pattern: String, _ text: String) -> [NSTextCheckingResult] { regex(pattern)?.matches(in: text, range: NSRange(location: 0, length: text.utf16.count)) ?? [] }
    func has(_ pattern: String, _ text: String) -> Bool { !matches(pattern, text).isEmpty }
    func pattern(_ name: String) -> String { contract.patterns[name] ?? "(?!)" }
    func slice(_ text: String, _ range: NSRange) -> String { (text as NSString).substring(with: range) }
    struct Sense { let attribute: String; let phrase: String; let range: NSRange; var reference: String? }
    struct Scope { let target: String; let phase: String; let ambiguous: Bool }
    func senses(_ text: String) -> [Sense] {
        var found: [Sense] = []
        for definition in contract.language.senses {
            for match in matches(definition.pattern, text) {
                let before = match.range.location > 0 ? slice(text, NSRange(location: match.range.location - 1, length: 1)) : ""
                let end = NSMaxRange(match.range), after = slice(text, NSRange(location: end, length: text.utf16.count - end))
                if has("[가-힣A-Za-z]", before) { continue }
                if has("^[가-힣A-Za-z]", after) && !has("^(?:은|는|이|가|을|를|도|만|의|에|으로|과|와|었|있|없|나|좋|싫|부담|강|약|적|많|덜)", after) { continue }
                found.append(.init(attribute: definition.attribute, phrase: slice(text, match.range), range: match.range))
            }
        }
        let metaphor = "(?:아몬드|땅콩|헤이즐넛|호두|레몬|오렌지|딸기|사과|복숭아|장미|자스민|버터|우유|바질|민트|버섯|가죽|나무|연기)(?: 같은|를 닮은|을 닮은|를 떠올리는|을 떠올리는) 향"
        for match in matches(metaphor, text) { let quote = slice(text, match.range); found.append(.init(attribute: "aroma.reference", phrase: quote, range: match.range, reference: quote)) }
        return found.filter { $0.attribute != "trigeminal.tingling" || !found.contains { $0.attribute == "trigeminal.fizzy" } }.sorted { $0.range.location < $1.range.location }
    }
    func scope(_ text: String, target: String?, phase: String?) -> Scope {
        let targets = contract.language.targets.filter { item in matches(item.pattern, text).contains { $0.range.location == 0 || !has("[가-힣A-Za-z]", slice(text, NSRange(location: $0.range.location - 1, length: 1))) } }.map(\.value)
        let phases = contract.language.phases.filter { has($0.pattern, text) }.map(\.value)
        return .init(target: targets.first ?? target ?? "whole_dish", phase: phases.first ?? phase ?? "unspecified", ambiguous: targets.count > 1 || phases.count > 1)
    }
    func domain(_ text: String) -> String? {
        let patterns = [("aroma", "향(?:은|이|을|의|에|도|만|과|과는|$)|냄새"), ("mouthfeel", "입안|구강|혀에 남|기름진 느낌"), ("texture", "식감|질감|씹|부서|겉은|속은"), ("temperature", "온도|차갑|따뜻|뜨거|식으니"), ("trigeminal", "자극|얼얼|알싸|따끔"), ("finish", "여운|뒷맛"), ("taste", "맛(?:은|이|을|의|에|도|만|과|$)")]
        return patterns.first { has($0.1, text) }?.0
    }
    func parseChoice(label: String, id: String? = nil, target: String? = nil, phase: String? = nil) -> SensoryRuleResult {
        guard let entry = contract.lexicon.first(where: { $0.label == label && (id == nil || $0.id == id) }) else { return parse(label, target: target, phase: phase) }
        let span = SensorySourceSpan(start: 0, end: label.utf16.count, quote: label)
        let atoms = entry.semanticAtoms.map { original -> SensoryRuleAtom in
            var atom = original; atom.target = atom.target ?? target ?? "whole_dish"; atom.phase = atom.phase ?? phase ?? "unspecified"; atom.phrase = label; atom.sourceSpans = [span]; return atom
        }
        return .init(observations: atoms, unresolved: entry.resolution == "resolved" ? [] : [.init(phrase: label, reason: entry.reason, sourceSpans: [span])], needsAI: false)
    }

    func parse(_ text: String, target: String? = nil, phase: String? = nil) -> SensoryRuleResult {
        struct Clause { let text: String; let start: Int; var deferred = false; var quoted = false }
        var result = SensoryRuleResult(), clauses: [Clause] = []
        let unresolvedStructure = #"(?:그 향|그 맛|그 식감|그것|이것)|(?:안 .*(?:아니|않))|(?:않은 건 아니|없지 않|지 않지)"#
        for sentence in matches(#"[^.!?\n]+(?:[.!?\n]|$)"#, text) {
            let source = slice(text, sentence.range)
            if has(#"["“”‘’「」]"#, source) { clauses.append(.init(text: source, start: sentence.range.location, quoted: true)); continue }
            if has(unresolvedStructure, source) { clauses.append(.init(text: source, start: sentence.range.location, deferred: true)); continue }
            for raw in matches(#"[^,;]+(?:[,;]|$)"#, source) {
                let body = slice(source, raw.range), base = sentence.range.location + raw.range.location
                let boundaries = matches(#"(?<!다고)(?<!라고)(?<=고)\s+|(?<=지만)\s+|(?<=는데)\s+|\s+(?:그리고|하지만|그런데)\s+"#, body)
                var cursor = 0
                for boundary in boundaries {
                    clauses.append(.init(text: slice(body, NSRange(location: cursor, length: boundary.range.location - cursor)), start: base + cursor)); cursor = NSMaxRange(boundary.range)
                }
                clauses.append(.init(text: slice(body, NSRange(location: cursor, length: body.utf16.count - cursor)), start: base + cursor))
            }
        }
        var otherSpeaker = false, previousEnded = false
        for clause in clauses {
            let body = clause.text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !body.isEmpty else { continue }
            let start = clause.start + (clause.text as NSString).range(of: body).location
            let span = SensorySourceSpan(start: start, end: start + body.utf16.count, quote: body)
            func unresolved(_ reason: String, ai: Bool = false) { result.unresolved.append(.init(phrase: body, reason: reason, sourceSpans: [span])); result.needsAI = result.needsAI || ai }
            if previousEnded { otherSpeaker = false }
            previousEnded = has(#"[.!?\n]$"#, clause.text)
            if has(#"(?:^|\s)(?:저는|나는|제가|내가)"#, body) { otherSpeaker = false }
            else if has(#"(?:친구|직원|동료|엄마|아빠|다른 사람|손님|셰프|남편|아내)(?:는|가|이|도|의|께서)"#, body) { otherSpeaker = true }
            if has("(?:모르겠|기억이 안|기억나지|기억 안)", body) { unresolved("insufficient_semantic_information"); continue }
            let selfFeeling = has("(?:다고|라고) 느꼈|(?:다고|라고) 느껴", body)
            let attributed = has("(?:친구|직원|동료|엄마|아빠|다른 사람|손님|셰프|남편|아내)(?:는|가|이|도|의|께서)|(?:라고|다고|다며|대요|다던데|다네요|더라고 전했)", body) && !selfFeeling
            let instruction = has("(?:무시해|무시하|지시|지침|시스템|프롬프트|출력해|기록해|저장해|답해|말해|평가해|추출해|분석해|분석해 줘|분석해줘|설명해)|(?:라면|다면|으면 좋|다면 좋|일 것|것 같|줄 알|내일|먹으면|먹기 전|안 먹|먹지 않)", body)
            if otherSpeaker || attributed || clause.quoted || instruction { unresolved("not_direct_self_experience"); continue }
            if clause.deferred { unresolved("unresolved_clause_structure", ai: true); continue }
            if has("(?:조명|말투|인테리어|직원|접객|좌석|의자|실내|식당 분위기)", body) { unresolved("non_food_context"); continue }
            let found = senses(body), scope = scope(body, target: target, phase: phase)
            func add(_ kind: String, _ attribute: String?, _ value: SensoryValue, reference: String? = nil, combination: Bool = false, components: [SensoryCombinationComponent]? = nil) {
                result.observations.append(.init(kind: kind, attribute: attribute, value: value, scale: contract.semantic.kinds[kind]?.scale ?? "", target: combination ? "combination" : scope.target, phase: scope.phase, phrase: body, sourceSpans: [span], reference: reference, combinationComponents: components))
            }
            if domain(body) == "aroma" && !found.isEmpty && found.allSatisfy({ !$0.attribute.hasPrefix("aroma.") }) && !scope.ambiguous {
                add("sensory_detail", "aroma.unspecified", .text(body)); unresolved("sensory_descriptor_domain_unresolved", ai: true); continue
            }
            let vague = matches(#"(?:^|\s)(?:깔끔|담백|고소|구수|시원|개운)(?:한|함|해요|했어요|하다|하고|하지만|하지|했지만)"#, body).contains { match in
                let raw = slice(body, match.range), trimmedOffset = (raw as NSString).rangeOfCharacter(from: .whitespacesAndNewlines.inverted).location
                return !found.contains { $0.range.location <= match.range.location + trimmedOffset && NSMaxRange($0.range) >= NSMaxRange(match.range) }
            }
            let ambiguousNegation = has("(?:지 않지|없지 않|안 .*않|아닌 건 아니|않은 건 아니|않다고는|덜 .*않)", body)
            let combination = has("조합|함께 먹|같이 먹|어울", body)
            let positive = has(pattern("positiveEvaluation"), body), negative = has(pattern("negativeEvaluation"), body)
            if has(pattern("comparativeOrConditional"), body) && !found.isEmpty {
                if found.count == 1 && !scope.ambiguous && !has("때만", body) { add("sensory_detail", found[0].attribute, .text(body), reference: found[0].reference) }
                unresolved("unresolved_condition_or_comparison", ai: true); continue
            }
            let likingNegated = has("좋지(?:는|도)? 않|싫지(?:는|도)? 않|맛있지(?:는|도)? 않|나쁘지(?:는|도)? 않", body)
            if has("싫지(?:는|도)? 않았|싫지(?:는|도)? 않", body) && found.count == 1 && !scope.ambiguous { add("sensory_presence", found[0].attribute, .flag(true)); unresolved("insufficient_liking_information"); continue }
            if (scope.ambiguous && !combination) || ambiguousNegation || likingNegated || (positive && negative) || (found.count > 1 && has(#"(?:좋|싫|너무|강|약|적당|않|없|아니|안\s)"#, body) && !combination) {
                unresolved("unresolved_clause_structure", ai: !found.isEmpty || positive || negative); continue
            }
            if combination {
                if found.count > 1 || scope.ambiguous { unresolved("unresolved_combination_scope", ai: true); continue }
                if positive != negative { add("combination_liking", nil, .text(positive ? "positive" : "negative"), combination: true, components: found.map { .init(attribute: $0.attribute, target: scope.target, reference: $0.reference) }) }
                else { unresolved("combination_relation_unresolved") }
                continue
            }
            if found.isEmpty {
                if let domain = domain(body), (!vague || domain == "aroma") && !scope.ambiguous { add("sensory_detail", "\(domain).unspecified", .text(body)); unresolved(positive != negative ? "explicit_evaluation_scope_unresolved" : "unclassified_sensory_description", ai: true) }
                else if vague { unresolved("insufficient_semantic_information") }
                else if positive != negative && !scope.ambiguous && scope.target == "whole_dish" && !has("(?:가격|서비스|주차|직원|분위기|의자|인테리어|거리)", body) { add("overall_liking", nil, .text(positive ? "positive" : "negative")) }
                else if has("(?:맛|향|식감|단|쓴|짠|매운|바삭|소스|후반|첫입)", body) { unresolved("unresolved_clause_structure", ai: true) }
                else { unresolved("unrelated_text") }
                continue
            }
            // 강도의 부정만으로 감각의 부재나 반대 강도를 확정할 수 없다.
            if has(#"(?:(?:강|약|진|연|은은|희미)하|세)(?:지(?:는|도)?|진)\s*않|(?:^|\s)안\s+(?:강|약|진|연|은은|희미|세)|(?:강|약|진|연|은은|희미)하게\s+(?:느껴지지|나지)\s*않"#, body) {
                if found.count == 1 { add("sensory_detail", found[0].attribute, .text(body), reference: found[0].reference) }
                unresolved("unresolved_intensity_negation", ai: true); continue
            }
            for sense in found {
                let absent = has(#"(?:^|\s)안\s"#, body) || has(#"(?:지(?:는|도)?\s?않|없(?:어|다|었|고)|느껴지지|나지 않)"#, body)
                if has("아니", body) && !absent { unresolved("unresolved_negation", ai: true); continue }
                let fit: String? = has("너무|지나치게|과하게|과했|과해|과한|과도", body) ? "above_preferred" : has("덜 .*좋|더 .*좋|부족|싱거", body) ? "below_preferred" : has("적당|딱 좋|알맞", body) ? "just_right" : nil
                let intensity: String? = has("진한|진해|진했|강한|강해|강했|강하게|매우|아주|엄청", body) ? "strong" : has("은은|약한|약해|약했|살짝|희미", body) ? "weak" : nil
                add("sensory_presence", sense.attribute, .flag(!absent), reference: sense.reference)
                if !absent, let intensity { add("sensory_intensity", sense.attribute, .text(intensity), reference: sense.reference) }
                if !absent, let fit, !(positive && !negative) || fit == "just_right" { add("preference_fit", sense.attribute, .text(fit), reference: sense.reference) }
                if positive != negative { add("attribute_liking", sense.attribute, .text(positive ? "positive" : "negative"), reference: sense.reference) }
            }
            if found.count == 1 && (has(pattern("temporalDetail"), body) || has(#"(?:했다|했습니다)[.!?,;]?$"#, body)) { add("sensory_detail", found[0].attribute, .text(body), reference: found[0].reference) }
            if !positive && !negative && has(pattern("evaluationCue"), body) { unresolved("uninterpreted_evaluation", ai: true) }
            if found.contains(where: { $0.attribute == "trigeminal.tingling" }) { unresolved("tingling_cause_unspecified") }
            if found.contains(where: { $0.attribute == "finish.duration" }) { unresolved("finish_attribute_duration_phase_unspecified") }
            if vague { unresolved("insufficient_semantic_information") }
        }
        return result
    }
}
