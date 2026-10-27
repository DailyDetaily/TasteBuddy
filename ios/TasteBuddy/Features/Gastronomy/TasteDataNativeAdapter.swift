import Foundation

/// Native source validation occurs before legacy archive helpers can discard conflicting originals.
/// The adapter never manufactures an observation from generated prose or a photograph.
struct TDNativeInput: Sendable {
    let records: [TDRecord]
    let observations: [TDObservation]
    let issues: [TDEvidenceIssue]
    let entries: [DiningEntry]
    let nativeObservations: [SensoryObservation]
    /// Valid current half-star answers retain their own scale for archive presentation.
    /// The five-category gastronomy contract must not reinterpret these as liking categories.
    var overallStarObservations: [SensoryObservation] = []
}

enum TDNativeAdapter {
    /// The measurement contract is choice-only; a source statement is out of scope, not corrupt evidence.
    static let sensoryEvidenceScopeDescription = "감각·평가 집계는 선택형 응답 기준이에요. 자유 회고는 원문과 나의 입맛 분석에 남으며, 이 집계에는 포함하지 않아요."

    struct Catalog: Decodable {
        struct Kind: Decodable { let id: String; let label: String }
        let dishKindOptions: [Kind]
        let legacyDishKindOptions: [Kind]?
    }
    static let kindLabels: [String: String] = {
        let url = Bundle.main.url(forResource: "dining-feedback-scenario", withExtension: "json")
            ?? Bundle.main.url(forResource: "dining-feedback-scenario", withExtension: "json", subdirectory: "Fixtures")
        guard let url, let data = try? Data(contentsOf: url), let catalog = try? JSONDecoder().decode(Catalog.self, from: data) else { return [:] }
        return Dictionary((catalog.dishKindOptions + (catalog.legacyDishKindOptions ?? [])).map { ($0.id, $0.label) }, uniquingKeysWith: { a, _ in a })
    }()
    static func clean(_ value: String?) -> String? {
        guard let value else { return nil }
        let result = value.trimmingCharacters(in: .whitespacesAndNewlines).precomposedStringWithCanonicalMapping
        return result.isEmpty ? nil : result
    }
    static func inputs(entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot, now: Date) -> TDNativeInput {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
        let records = entries.map { entry -> TDRecord in
            let source = entry.foodSource
            let origin: TDSourceFilter = source?.kind == "homeCooked" ? .homeCooked : source?.kind == "restaurant" ? .restaurant : .unknown
            // Existing restaurant IDs belong to the app's restaurant namespace. Explicit external
            // providers retain their namespace instead of colliding with an equal-looking app ID.
            let restaurant: TDIdentity? = origin == .homeCooked ? nil : clean(entry.restaurantID).map {
                .init(id: TDDataEngine.key([clean(source?.restaurantNamespace) ?? "tastebuddy.restaurant", $0]),
                      label: clean(entry.restaurant) ?? "이름 미확인 식당")
            }
            let menuToken = clean(entry.menuItemID).map { TDDataEngine.key(["id", $0]) }
                ?? clean(entry.menu).map { TDDataEngine.key(["name", $0]) }
            let menu: TDIdentity?
            if origin == .homeCooked, let identity = clean(source?.homeCookingID) {
                menu = .init(id: TDDataEngine.key(["homeCooked", identity]), label: (clean(entry.menu) ?? "직접 만든 요리") + " · 직접 만든 요리")
            } else if let restaurant, let menuToken {
                menu = .init(id: TDDataEngine.key([restaurant.id, menuToken]), label: (clean(entry.menu) ?? "이름 미확인 메뉴") + " · " + restaurant.label)
            } else { menu = nil }
            let kinds = Set(entry.dishKindIDs).sorted().compactMap { id in kindLabels[id].map { TDIdentity(id: id, label: $0) } }
            let date = (entry.mealTime?.confirmedAt ?? .distantPast) <= now ? entry.confirmedMealDate : nil
            return .init(id: entry.id.uuidString, mealID: entry.mealID.uuidString, date: date,
                         menu: menu, restaurant: restaurant, foodKinds: kinds, source: origin,
                         revision: entry.memoryRevisionNumber,
                         fingerprint: (try? encoder.encode(entry)).map { HomeDiscoveryCard.digest($0.base64EncodedString()) } ?? "unreadable",
                         classificationUnresolved: kinds.count != Set(entry.dishKindIDs).count)
        }
        let originalGroups = Dictionary(grouping: entries, by: \.id)
        let conflictingMeals = Set(originalGroups.values.filter { rows in rows.contains { $0 != rows[0] } }.flatMap { $0.map(\.mealID) })
        let originals = originalGroups.values.compactMap { rows -> DiningEntry? in
            guard let first = rows.first, !conflictingMeals.contains(first.mealID), first.observedAt <= now else { return nil }
            return first
        }
        let byID = Dictionary(uniqueKeysWithValues: originals.map { ($0.id, $0) })
        let catalog = SensoryAnalysisEngine.contract?.selectionCatalog
        var issues: [TDEvidenceIssue] = []
        var atoms: [UUID: [SensoryRuleAtom]] = [:]
        func linkage(_ evidence: SensorySelectionEvidence?) -> String {
            guard let identity = SensoryEvidenceLinkage.identity(evidence) else { return "" }
            var parts = [identity.type, identity.selectionID, identity.catalogVersion, identity.relatedBubbleID ?? ""]
            if let instance = identity.selectionInstanceID { parts.append(instance) }
            return TDDataEngine.key(parts)
        }
        func pending(_ id: String, entry: UUID, facet: TDFacet?, attribute: String?, reference: String?, reason: String, evidence: SensorySelectionEvidence?) {
            issues.append(.init(id: id, entryID: entry.uuidString, facet: facet, attribute: attribute, reference: reference,
                                reason: reason, selection: linkage(evidence)))
        }
        for entry in originals where entry.hasCompletedTasteFeedback {
            if Task.isCancelled { break }
            var result = SensoryRuleResult()
            if let catalog {
                result = DiningSensorySelectionParser.parse(SensoryAnalysisEngine.effectiveSelections(for: entry, catalog: catalog), catalog: catalog)
            }
            if let overall = entry.overallEvaluation {
                let parsed = overall.parse(); result.observations += parsed.observations; result.unresolved += parsed.unresolved
            }
            atoms[entry.id] = result.observations
            for (index, unresolved) in result.unresolved.enumerated() {
                let evidence = unresolved.selectionEvidence
                let definition = catalog?.entries.first { $0.id == evidence?.selectionID && $0.type == evidence?.type }
                let facet: TDFacet? = evidence?.type == "overallEvaluation" ? .overall : ["intensity": .intensity, "liking": .liking, "preferenceFit": .fit][evidence?.facet ?? ""]
                pending("parse:\(entry.id):\(index)", entry: entry.id, facet: facet, attribute: definition?.attribute,
                        reference: definition?.reference == true ? definition?.label : nil,
                        reason: unresolved.reason, evidence: evidence)
            }
        }
        let excluded = Set(snapshot.personalModel?.excludedEvidence.map(\.id) ?? [])
        let grouped = Dictionary(grouping: snapshot.observations, by: \.id)
        var valid: [TDObservation] = [], native: [SensoryObservation] = []
        var overallStars: [SensoryObservation] = []
        var matchedAtoms = Set<String>()
        func atomKey(_ entryID: UUID, _ atom: SensoryRuleAtom) -> String {
            let value = (try? encoder.encode(atom.value))?.base64EncodedString() ?? ""
            let selection = (try? encoder.encode(atom.selectionEvidence))?.base64EncodedString() ?? ""
            return TDDataEngine.key([entryID.uuidString, atom.kind, atom.attribute ?? "", atom.reference ?? "", atom.scale,
                                    value, atom.target ?? "whole_dish", atom.phase ?? "unspecified", selection])
        }
        for id in grouped.keys.sorted() {
            if Task.isCancelled { break }
            let rows = grouped[id]!, row = rows[0]
            guard let entry = byID[row.experienceID], entry.hasCompletedTasteFeedback,
                  let facet = TDFacet.allCases.first(where: { $0.kind == row.kind }) else { continue }
            // A genuine note observation belongs to the full TBA analysis, not this choice-only
            // measurement. Do not turn it into an issue that quarantines valid choices in the meal.
            // Mixed-provenance duplicate IDs still reach the conflict check below.
            if rows.allSatisfy({ $0.sourceField == "note" && $0.selectionEvidence == nil }) { continue }
            let candidate = (atoms[entry.id] ?? []).first { atom in
                atom.kind == row.kind && atom.attribute == row.attribute && atom.reference == row.reference
                    && atom.value == row.value && atom.scale == row.scale
                    && (atom.target ?? "whole_dish") == row.target && (atom.phase ?? "unspecified") == row.phase
                    && atom.selectionEvidence == row.selectionEvidence
            }
            let isOverallStars = facet == .overall && row.scale == DiningOverallEvaluation.starScale
            let invalid: String?
            if rows.contains(where: { $0 != row }) { invalid = "동일 관찰 ID 충돌" }
            else if excluded.contains(id) { invalid = "제외된 근거" }
            else if row.sourceRevision != entry.memoryRevisionNumber { invalid = "이전 원본 버전의 관찰" }
            else if row.independentMealID != entry.mealID { invalid = "식사 연결 불일치" }
            else if (row.knownAt ?? row.recordedAt) > now || (row.observedAt ?? row.recordedAt) > now { invalid = "현재 이후에 알려진 관찰" }
            else if candidate == nil || row.selectionEvidence == nil { invalid = "현재 직접 응답과 관찰 불일치" }
            else if row.scale != facet.scale && !isOverallStars { invalid = "알 수 없는 응답 척도" }
            else { invalid = nil }
            if let invalid {
                pending(id, entry: entry.id, facet: facet, attribute: row.attribute, reference: row.reference,
                        reason: invalid, evidence: row.selectionEvidence); continue
            }
            if isOverallStars {
                overallStars.append(row)
                if let candidate { matchedAtoms.insert(atomKey(entry.id, candidate)) }
                pending(id, entry: entry.id, facet: facet, attribute: row.attribute, reference: row.reference,
                        reason: "별점 응답은 5단계 호감과 다른 척도예요", evidence: row.selectionEvidence)
                continue
            }
            if facet == .presence && row.value != .flag(true) { continue }
            if facet != .overall && (row.attribute == nil || row.attribute!.hasSuffix(".unspecified")) { continue }
            let value = facet == .presence ? "present" : row.value.text
            guard facet.values.contains(value) else {
                pending(id, entry: entry.id, facet: facet, attribute: row.attribute, reference: row.reference,
                        reason: "알 수 없는 응답 값", evidence: row.selectionEvidence); continue
            }
            valid.append(.init(id: row.id, entryID: entry.id.uuidString, facet: facet, attribute: row.attribute ?? "overall",
                               label: row.reference ?? row.attributeLabel, value: value, target: row.target, phase: row.phase,
                               selection: linkage(row.selectionEvidence), reference: row.reference, scale: row.scale,
                               sourceRevision: row.sourceRevision, catalogVersion: row.selectionEvidence?.catalogVersion ?? ""))
            native.append(row)
            if let candidate { matchedAtoms.insert(atomKey(entry.id, candidate)) }
        }
        // A direct response waiting for a matching analysis is pending, not an unanswered question.
        for (entryID, values) in atoms {
            for (index, atom) in values.enumerated() {
                guard let facet = TDFacet.allCases.first(where: { $0.kind == atom.kind }), !matchedAtoms.contains(atomKey(entryID, atom)) else { continue }
                if facet == .presence && atom.value != .flag(true) { continue }
                pending("pending:\(entryID):\(index)", entry: entryID, facet: facet, attribute: atom.attribute,
                        reference: atom.reference, reason: "직접 응답의 유효 관찰 확인 필요", evidence: atom.selectionEvidence)
            }
        }
        // Only a currently validated parent with identical sensory scope may bridge choices.
        let nativeByID = Dictionary(uniqueKeysWithValues: native.map { ($0.id, $0) })
        let parents = Dictionary(grouping: valid.filter { row in
            row.facet == .presence && nativeByID[row.id]?.selectionEvidence?.type == "bubble"
        }) { row in
            let evidence = nativeByID[row.id]!.selectionEvidence!
            return TDDataEngine.key([row.entryID, evidence.selectionID, evidence.catalogVersion, row.senseKey, row.target, row.phase])
        }
        for index in valid.indices {
            let row = valid[index]
            guard let evidence = nativeByID[row.id]?.selectionEvidence, let parentID = evidence.relatedBubbleID else { continue }
            let key = TDDataEngine.key([row.entryID, parentID, evidence.catalogVersion, row.senseKey, row.target, row.phase])
            let choices = Set((parents[key] ?? []).map(\.selection))
            if choices.count == 1 { valid[index].parentSelection = choices.first }
        }
        return .init(records: records, observations: valid, issues: issues, entries: originals, nativeObservations: native,
                     overallStarObservations: overallStars)
    }
}
