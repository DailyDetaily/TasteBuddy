import Foundation

/// 동일 음식 경험·감각·reference·대상·시점 안에서도 동일 선택/검증된 원문 출처만 짝짓는다.
struct TasteIntensityLikingMatrix: Equatable {
    struct Cell: Identifiable, Equatable {
        let intensity: String
        let liking: String
        let entryIDs: Set<UUID>
        let mealIDs: Set<UUID>
        let evidenceIDs: Set<String>
        var id: String { intensity + ":" + liking }
    }
    let cells: [Cell]
    let unknownEntryIDs: Set<UUID>
    let conflictEntryIDs: Set<UUID>
    static let levels = ["weak", "medium", "strong"]
    static let likings = ["positive", "neutral", "negative"]

    static func build(observations: [SensoryObservation], attribute: String, reference: String?,
                      unresolved: [SensoryUnresolved] = [], catalog: DiningSensoryCatalogContract? = nil) -> Self {
        var seen = Set<String>()
        let rows = observations.filter {
            $0.attribute == attribute && $0.reference == reference && seen.insert($0.id).inserted
                && ["sensory_presence", "sensory_intensity", "attribute_liking"].contains($0.kind)
        }
        func scope(_ row: SensoryObservation) -> String {
            PersonalTasteModelBuilder.json([row.experienceID.uuidString, attribute, reference ?? "", row.target, row.phase])
        }
        func source(_ row: SensoryObservation) -> String {
            if let selected = row.selectionEvidence {
                return PersonalTasteModelBuilder.json([selected.type, selected.selectionID, selected.catalogVersion,
                                                       selected.labelSnapshot, selected.relatedBubbleID ?? ""])
            }
            return PersonalTasteModelBuilder.json([row.sourceField, row.phrase, PersonalTasteModelBuilder.canonical(row.sourceSpans)])
        }
        var pairs: [String: [SensoryObservation]] = [:], unknown = Set<UUID>(), conflicts = Set<UUID>()
        for pending in unresolved where pending.reason.contains("conflict") {
            guard let selected = pending.selectionEvidence, let catalog, selected.catalogVersion == catalog.version,
                  let item = catalog.entries.first(where: { $0.id == selected.selectionID && $0.type == selected.type && $0.label == selected.labelSnapshot }),
                  item.attribute == attribute, (item.reference == true ? item.label : nil) == reference else { continue }
            conflicts.insert(pending.experienceID)
        }
        for group in Dictionary(grouping: rows, by: scope).values {
            guard let first = group.first else { continue }
            var confirmed: [String: [SensoryObservation]] = [:]
            var conflicted = false
            for sameSource in Dictionary(grouping: group, by: source).values {
                let intensities = Set(sameSource.filter { $0.kind == "sensory_intensity" && $0.scale == "expression-strength-v1" }.map { $0.value.text })
                let ratings = Set(sameSource.filter { $0.kind == "attribute_liking" && $0.scale == "attribute-three-category-v1" }.map { $0.value.text })
                if intensities.count > 1 || ratings.count > 1 { conflicted = true; continue }
                guard let intensity = intensities.first, levels.contains(intensity), let liking = ratings.first, likings.contains(liking),
                      !sameSource.contains(where: { $0.kind == "sensory_presence" && $0.value == .flag(false) }) else { continue }
                confirmed[intensity + ":" + liking, default: []] += sameSource
            }
            if conflicted || confirmed.count > 1 { conflicts.insert(first.experienceID) }
            else if let pair = confirmed.first { pairs[pair.key, default: []] += pair.value }
            else { unknown.insert(first.experienceID) }
        }
        return .init(cells: likings.flatMap { liking in levels.map { intensity in
            let pair = pairs[intensity + ":" + liking] ?? []
            return Cell(intensity: intensity, liking: liking, entryIDs: Set(pair.map(\.experienceID)),
                        mealIDs: Set(pair.map(\.independentMealID)), evidenceIDs: Set(pair.map(\.id)))
        }}, unknownEntryIDs: unknown.subtracting(conflicts), conflictEntryIDs: conflicts)
    }
}
