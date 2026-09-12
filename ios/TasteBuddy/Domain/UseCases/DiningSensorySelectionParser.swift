import Foundation

/// 고정 ID와 버전에 대응하는 의미만 읽는다. 선택 문구를 자유문장 파서로 전달하지 않는다.
enum DiningSensorySelectionParser {
    static func parse(_ selections: [DiningSensorySelection], catalog: DiningSensoryCatalogContract) -> SensoryRuleResult {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        func canonical(_ selection: DiningSensorySelection) -> String { String(data: (try? encoder.encode(selection)) ?? Data(), encoding: .utf8) ?? "" }
        var seen: Set<String> = []
        let unique = selections.filter { seen.insert(canonical($0)).inserted }
        let groups = Dictionary(grouping: unique) { $0.type.rawValue + ":" + $0.id }
        let entries = Dictionary(uniqueKeysWithValues: catalog.entries.map { ($0.type + ":" + $0.id, $0) })
        var result = SensoryRuleResult()
        let scales = ["sensory_presence": "presence-v1", "sensory_detail": "sensory-detail-v1", "sensory_intensity": "expression-strength-v1", "attribute_liking": "attribute-three-category-v1", "preference_fit": "preference-fit-v1"]
        for selection in unique {
            let label = selection.labelSnapshot, key = selection.type.rawValue + ":" + selection.id
            let entry = entries[key]
            let parent = selection.relatedBubbleID.flatMap { id in unique.first { $0.type == .bubble && $0.id == id } }
            let parentEntry = parent.flatMap { entries["bubble:" + $0.id] }
            let span = SensorySourceSpan(start: 0, end: label.utf16.count, quote: label)
            var target = selection.target.rawValue, phase = selection.phase.rawValue
            func metadata(_ facet: String = "selection", _ response: String? = nil, _ resolution: String? = nil) -> SensorySelectionEvidence {
                let value = response ?? selection.id
                return .init(selectionID: selection.id, type: selection.type.rawValue, catalogVersion: selection.catalogVersion, labelSnapshot: label, facet: facet, labelValue: catalog.labels[facet]?[value] ?? label, responseValue: value, relatedBubbleID: selection.relatedBubbleID, relatedBubbleLabel: parent?.labelSnapshot, resolution: resolution ?? entry?.resolution ?? "unresolved")
            }
            func pending(_ reason: String, _ facet: String = "selection", _ response: String? = nil) {
                result.unresolved.append(.init(phrase: label, reason: reason, sourceSpans: [span], selectionEvidence: metadata(facet, response, "unresolved")))
            }
            guard selection.unparsedPayload == nil else { pending("unreadable_selection_payload", "selection", canonical(selection)); continue }
            guard selection.catalogVersion == catalog.version else { pending("unknown_selection_catalog_version"); continue }
            guard let entry else { pending("unknown_selection_id"); continue }
            guard label == entry.label else { pending("selection_label_mismatch"); continue }
            guard groups[key]?.count == 1 else { pending("conflicting_choice_responses", "conflict", canonical(selection)); continue }
            let fields: [(String, String?)] = [("liking", selection.liking?.rawValue), ("intensity", selection.intensity?.rawValue), ("preferenceFit", selection.preferenceFit?.rawValue), ("target", target), ("phase", phase)]
            if let invalid = fields.first(where: { field, value in value.map { catalog.values[field]?[$0] == nil } ?? false }) { pending("unknown_selection_response", invalid.0, invalid.1); continue }
            let validParent = parent != nil && parentEntry != nil && parent?.catalogVersion == catalog.version && parent?.labelSnapshot == parentEntry?.label && groups["bubble:" + (parent?.id ?? "")]?.count == 1
            if let related = selection.relatedBubbleID, !validParent { pending("related_bubble_unavailable", "relation", related) }
            if validParent, let parent, let parentEntry {
                if target == "unspecified" { target = parent.target != .unspecified ? parent.target.rawValue : parentEntry.intrinsicTarget ?? target }
                if phase == "unspecified" { phase = parent.phase.rawValue }
            }
            if (entry.intrinsicTarget != nil && target != "unspecified" && target != entry.intrinsicTarget) || (entry.intrinsicPhase != nil && phase != "unspecified" && phase != entry.intrinsicPhase) {
                pending("conflicting_selection_scope", entry.intrinsicTarget != nil ? "target" : "phase", entry.intrinsicTarget != nil ? target : phase); continue
            }
            target = entry.intrinsicTarget ?? target; phase = entry.intrinsicPhase ?? phase
            let attribute = entry.attribute
            let detailAttribute = validParent && entry.contextRole != nil ? parentEntry?.attribute ?? attribute : attribute
            func add(_ kind: String, _ attribute: String, _ value: SensoryValue, _ facet: String = "selection", _ response: String? = nil) {
                let reference: String? = attribute == entry.attribute && entry.reference == true ? label : attribute == parentEntry?.attribute && parentEntry?.reference == true ? parent?.labelSnapshot : nil
                result.observations.append(.init(kind: kind, attribute: attribute, value: value, scale: scales[kind] ?? "", target: target, phase: phase, phrase: label, sourceSpans: [span], reference: reference, selectionEvidence: metadata(facet, response)))
            }
            if !attribute.hasSuffix(".unspecified") { add("sensory_presence", attribute, .flag(true)) }
            add("sensory_detail", detailAttribute, .text(label))
            let intensity = selection.intensity.flatMap { catalog.values["intensity"]?[$0.rawValue] }
            if let intrinsic = entry.intrinsicIntensity, let intensity, intrinsic != intensity { pending("conflicting_selection_intensity", "intensity", selection.intensity?.rawValue) }
            else if let value = intensity ?? entry.intrinsicIntensity {
                add("sensory_intensity", entry.contextRole == "intensity" && validParent ? parentEntry?.attribute ?? attribute : attribute, .text(value), selection.intensity == nil ? "selection" : "intensity", selection.intensity?.rawValue)
            }
            let fit = selection.preferenceFit.flatMap { catalog.values["preferenceFit"]?[$0.rawValue] }
            if let intrinsic = entry.intrinsicFit, let fit, intrinsic != fit { pending("conflicting_selection_preference_fit", "preferenceFit", selection.preferenceFit?.rawValue) }
            else if let value = fit ?? entry.intrinsicFit { add("preference_fit", attribute, .text(value), selection.preferenceFit == nil ? "selection" : "preferenceFit", selection.preferenceFit?.rawValue) }
            if let liking = selection.liking, let value = catalog.values["liking"]?[liking.rawValue] { add("attribute_liking", attribute, .text(value), "liking", liking.rawValue) }
        }
        return result
    }
}
