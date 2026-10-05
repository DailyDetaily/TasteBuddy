import Foundation

enum DiningSensoryV2Parser {
    static func parse(
        _ selections: [DiningSensorySelection],
        allSelections: [DiningSensorySelection],
        legacyCatalog: DiningSensoryCatalogContract,
        catalog: DiningSensoryV2Catalog? = DiningSensoryV2Catalog.shared
    ) -> SensoryRuleResult {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        func canonical(_ value: DiningSensorySelection) -> String { String(data: (try? encoder.encode(value)) ?? Data(), encoding: .utf8) ?? "" }
        func distinct(_ values: [DiningSensorySelection]) -> [DiningSensorySelection] {
            var seen = Set<String>(); return values.filter { seen.insert(canonical($0)).inserted }
        }
        let choices = distinct(selections), all = distinct(allSelections)
        let groups = Dictionary(grouping: choices, by: \.stableID)
        var result = SensoryRuleResult()
        let scales = ["sensory_presence": "presence-v1", "sensory_detail": "sensory-detail-v1", "sensory_intensity": "expression-strength-v1", "attribute_liking": "attribute-three-category-v1", "preference_fit": "preference-fit-v1"]
        let intensityValues = ["light": "weak", "medium": "medium", "strong": "strong"]
        let fitValues = ["tooWeak": "below_preferred", "justRight": "just_right", "tooStrong": "above_preferred"]
        let likingValues = ["liked": "positive", "neutral": "neutral", "disliked": "negative"]

        for selection in choices {
            let definition = catalog?.definition(for: selection) ?? catalog?.entry(selection.id)
            let label = selection.labelSnapshot
            let parents = all.filter { $0.type == .bubble && $0.id == selection.relatedBubbleID }
            let parent = parents.count == 1 ? parents.first : nil
            let currentParent = parent?.catalogVersion == DiningSensorySelection.currentCatalogVersion ? parent.flatMap { catalog?.definition(for: $0) } : nil
            let oldParent = parent.flatMap { p in legacyCatalog.entries.first { $0.type == "bubble" && $0.id == p.id && $0.catalogVersion == p.catalogVersion } }
            let parentAttribute = currentParent?.attribute ?? oldParent?.attribute
            let parentLabel = currentParent?.label ?? oldParent?.label
            let span = SensorySourceSpan(start: 0, end: label.utf16.count, quote: label)
            var target = selection.target.rawValue, phase = selection.phase.rawValue

            func metadata(_ facet: String = "selection", _ response: String? = nil, _ resolution: String? = nil) -> SensorySelectionEvidence {
                let value = response ?? selection.id
                return .init(selectionID: selection.id, type: selection.type.rawValue, catalogVersion: selection.catalogVersion,
                    labelSnapshot: label, facet: facet, labelValue: facet == "selection" ? label : value,
                    responseValue: value, relatedBubbleID: selection.relatedBubbleID,
                    relatedBubbleLabel: parent?.labelSnapshot ?? selection.relatedBubbleLabelSnapshot,
                    resolution: resolution ?? definition?.resolution ?? "unresolved",
                    selectionInstanceID: selection.selectionInstanceID, definitionVersion: selection.definitionVersion,
                    bindingMode: definition?.bindingMode ?? selection.bindingMode, semanticFacets: definition?.semanticFacets)
            }
            func pending(_ reason: String, _ facet: String = "selection", _ response: String? = nil) {
                result.unresolved.append(.init(phrase: label, reason: reason, sourceSpans: [span], selectionEvidence: metadata(facet, response, "unresolved")))
            }
            guard selection.unparsedPayload == nil else { pending("unreadable_selection_payload"); continue }
            guard let definition, definition.type == selection.type.rawValue else { pending("unknown_selection_id"); continue }
            guard selection.catalogVersion == catalog?.version else { pending("unknown_selection_catalog_version"); continue }
            guard selection.definitionVersion == definition.definitionVersion else { pending("unknown_selection_definition_version"); continue }
            guard label == definition.label else { pending("selection_label_mismatch"); continue }
            guard groups[selection.stableID]?.count == 1 else { pending("conflicting_choice_responses", "conflict", canonical(selection)); continue }
            let validResponses = [
                ("liking", selection.liking?.rawValue, Set(likingValues.keys)),
                ("intensity", selection.intensity?.rawValue, Set(intensityValues.keys)),
                ("preferenceFit", selection.preferenceFit?.rawValue, Set(fitValues.keys)),
                ("target", target as String?, Set(DiningSensorySelection.Target.allCases.map(\.rawValue))),
                ("phase", phase as String?, Set(DiningSensorySelection.Phase.allCases.map(\.rawValue))),
            ]
            if let invalid = validResponses.first(where: { _, value, allowed in value.map { !allowed.contains($0) } ?? false }) {
                pending("unknown_selection_response", invalid.0, invalid.1); continue
            }
            guard selection.bindingMode == definition.bindingMode,
                  selection.relatedBubbleID == nil || definition.bindingMode == "modifier" else { pending("unsupported_selection_binding"); continue }
            guard ["whole_dish", "component", "bubble", "relation"].contains(selection.scopeKind ?? ""),
                  selection.scopeKind != "bubble" || selection.relatedBubbleID != nil,
                  selection.relatedBubbleID == nil || selection.scopeKind == "bubble",
                  definition.bindingMode != "relation" || selection.scopeKind == "relation" else { pending("unsupported_selection_scope"); continue }
            if definition.bindingMode == "modifier", let related = selection.relatedBubbleID {
                guard let parent, parentAttribute != nil, parent.labelSnapshot == parentLabel, parent.unparsedPayload == nil,
                      DiningSensorySelection.Target.allCases.contains(parent.target), DiningSensorySelection.Phase.allCases.contains(parent.phase),
                      parent.liking.map({ likingValues[$0.rawValue] != nil }) ?? true,
                      parent.intensity.map({ intensityValues[$0.rawValue] != nil }) ?? true,
                      parent.preferenceFit.map({ fitValues[$0.rawValue] != nil }) ?? true,
                      currentParent?.intrinsicTarget == nil || parent.target == .unspecified || parent.target.rawValue == currentParent?.intrinsicTarget,
                      currentParent?.intrinsicPhase == nil || parent.phase == .unspecified || parent.phase.rawValue == currentParent?.intrinsicPhase,
                      currentParent == nil || (parent.definitionVersion == currentParent?.definitionVersion && parent.bindingMode == "independent" && parent.relatedBubbleID == nil && ["whole_dish", "component"].contains(parent.scopeKind ?? "")) else {
                    pending("related_bubble_unavailable", "relation", related); continue
                }
                if target == "unspecified" { target = parent.target != .unspecified ? parent.target.rawValue : currentParent?.intrinsicTarget ?? oldParent?.intrinsicTarget ?? "unspecified" }
                if phase == "unspecified" { phase = parent.phase.rawValue }
            }
            if (definition.intrinsicTarget != nil && target != "unspecified" && definition.intrinsicTarget != target)
                || (definition.intrinsicPhase != nil && phase != "unspecified" && definition.intrinsicPhase != phase) {
                pending("conflicting_selection_scope"); continue
            }
            target = definition.intrinsicTarget ?? target
            phase = definition.intrinsicPhase ?? phase
            let attribute = definition.bindingMode == "modifier" && parent != nil ? parentAttribute ?? definition.attribute : definition.attribute
            let reference: String? = definition.referenceLabel != nil || definition.type == "detailTag" || !definition.semanticFacets.objectValue.isEmpty ? label : nil
            func add(_ kind: String, _ value: SensoryValue, _ facet: String = "selection", _ response: String? = nil) {
                result.observations.append(.init(kind: kind, attribute: attribute, value: value, scale: scales[kind] ?? "",
                    target: target, phase: phase, phrase: label, sourceSpans: [span], reference: reference, selectionEvidence: metadata(facet, response)))
            }
            if definition.type == "bubble", definition.referenceLabel == nil { add("sensory_presence", .flag(true)) }
            add("sensory_detail", .text(label))
            if definition.resolution == "unresolved_composite" { pending("composite_meaning_unresolved") }
            let intensity = selection.intensity.flatMap { intensityValues[$0.rawValue] }
            if let intensity, let intrinsic = definition.intrinsicIntensity, intensity != intrinsic { pending("conflicting_selection_intensity", "intensity", selection.intensity?.rawValue) }
            else if let value = intensity ?? definition.intrinsicIntensity { add("sensory_intensity", .text(value), selection.intensity == nil ? "selection" : "intensity", selection.intensity?.rawValue) }
            let fit = selection.preferenceFit.flatMap { fitValues[$0.rawValue] }
            if let fit, let intrinsic = definition.intrinsicFit, fit != intrinsic { pending("conflicting_selection_preference_fit", "preferenceFit", selection.preferenceFit?.rawValue) }
            else if let value = fit ?? definition.intrinsicFit { add("preference_fit", .text(value), selection.preferenceFit == nil ? "selection" : "preferenceFit", selection.preferenceFit?.rawValue) }
            if let liking = selection.liking, let value = likingValues[liking.rawValue] { add("attribute_liking", .text(value), "liking", liking.rawValue) }
        }
        return result
    }
}
