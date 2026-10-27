import Foundation

/// Resolve known attribute IDs through the existing catalog for display only.
enum TDSensoryDisplayLabel {
    static func resolve(_ value: String) -> String {
        if let attribute = SensoryAnalysisEngine.contract?.semantic.attributes.first(where: { $0.id == value }) {
            return attribute.label ?? attribute.meaning
        }
        return ["taste.", "aroma.", "texture.", "mouthfeel."].contains(where: value.hasPrefix)
            ? "감각 확인 필요" : value
    }
}

/// View-only mapping of validated TD evidence into the shared motion contract.
/// No fixture values, synthetic observations, or persistence/aggregation changes.
struct TDCategoryMotionInput: Equatable, Sendable {
    let json: String
    let category: TDCategory
    let selectedLabel: String
    var pageCount = 1
    var introDuration: Double { category == .experience ? 6.4 : 1.8 }
    var playback: String { "intro" }

    static func make(state: TDState, result: TDResult, category: TDCategory, domain: String,
                     attribute: String?, facet: TDFacet, contextDimension: String,
                     heroDimension: TDDimension?, calendar: Calendar) -> Self {
        let uncertain = state.selected.isEmpty && (!state.conflictingIDs.isEmpty || (!state.window.isAll && !state.unknownDateIDs.isEmpty))
        let scopeState = uncertain ? "held" : state.originalCount == 0 ? "noData" : "valid"
        var data: [String: Any] = [:], title: String? = nil, selected: String? = nil
        var pageCount = 1
        switch category {
        case .experience:
            let records: [[String: Any]] = state.selected.sorted { $0.id < $1.id }.map { record in
                let identity: Any = record.menu.map { menu in
                    ["kind": record.source == .homeCooked ? "home" : "menu", "id": menu.id, "name": menu.label]
                } ?? NSNull() as Any
                return ["id": record.id, "mealId": record.mealID, "identity": identity]
            }
            data = ["kind": "experienceCluster", "state": scopeState, "records": records]
        case .sensation:
            let recordMap = Dictionary(uniqueKeysWithValues: state.selected.map { ($0.id, $0.mealID) })
            let presence = state.observations.filter { recordMap[$0.entryID] != nil && $0.facet == .presence }
            let eligible = Set(presence.compactMap { recordMap[$0.entryID] }).sorted()
            let rows = result.cards.first { $0.id == "presence" }?.rows ?? []
            let intensity = TDDataEngine.distributionRows(state, facet: .intensity, domain: domain)
            let domainKey = domain == "향" ? "aroma" : domain == "식감" ? "texture" : "taste"
            let keys = domain == "맛" ? ["taste.sweet", "taste.sour", "taste.bitter", "taste.salty", "taste.umami", "mouthfeel.fatty"] : []
            let names = ["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]
            // Six native taste axes use confirmed presence, including mouthfeel.fatty.
            // Other domains retain their actual measured attributes/references.
            let senses: [[String: Any]] = (domain == "맛" ? keys.enumerated().map { index, key in
                let chosen = rows.first { $0.evidence.attribute == key && ($0.id == attribute || attribute == nil) }
                let matching = presence.filter { $0.attribute == key && (attribute == nil || chosen == nil || $0.senseKey == chosen?.id) }
                let ids = Set(matching.compactMap { recordMap[$0.entryID] }).sorted()
                let senseID = chosen?.id ?? key
                let responses = intensity.first { $0.id == senseID }?.segments ?? []
                return sensoryItem(id: senseID, name: names[index], color: index, mealIDs: ids, segments: responses)
            } : rows.enumerated().map { index, row in
                sensoryItem(id: row.id, name: row.title, color: index % 6,
                            mealIDs: Array(row.evidence.roles[.numerator]?.mealIDs ?? []).sorted(),
                            segments: intensity.first { $0.id == row.id }?.segments ?? [])
            })
            if domain == "기타" && attribute == nil { title = "기타 감각" }
            if let attribute, senses.contains(where: { $0["id"] as? String == attribute }) { selected = attribute }
            data = ["kind": "sensoryRays", "state": scopeState, "domain": domainKey, "validMealIds": eligible, "senses": senses]
        case .preference:
            let mode = facet == .overall ? "overall" : facet == .fit ? "fit" : "liking"
            let row = result.hero.first { $0.id == attribute } ?? result.hero.first
            let responses = evaluations(row?.segments ?? [], mode: mode, prefix: row?.id ?? "preference")
            let status = distributionState(responses, fallback: scopeState)
            data = ["kind": "preferenceFocus", "state": status, "mode": mode, "responses": responses]
            if let row, facet != .overall {
                let name = row.state == .invalidEvidence ? TDSensoryDisplayLabel.resolve(row.title) : row.title
                title = name + " · " + (facet == .fit ? "알맞음" : "호감")
            }
        case .context:
            let mode = facet == .fit ? "fit" : "liking"
            let card = result.cards.first { $0.id == "context-" + contextDimension }
            let sense = card?.meaning.replacingOccurrences(of: " · " + facet.title, with: "") ?? "감각 응답 없음"
            let conditions: [[String: Any]] = (card?.rows ?? []).map { row in
                ["id": row.id, "label": row.title, "responses": evaluations(row.segments, mode: mode, prefix: row.id)]
            }
            pageCount = max(1, (conditions.count + 3) / 4)
            data = ["kind": "contextLayers", "state": scopeState, "mode": mode, "sense": sense,
                    "dimension": ["foodKind": "food", "target": "target", "phase": "phase", "intensity": "intensity"][contextDimension] ?? "food",
                    "conditions": conditions]
        case .change:
            let row = result.cards.first { $0.id == "change-experience" }?.rows.first { $0.id == (heroDimension?.id ?? "meal") }
            let recent = state.window.isAll ? TDWindow.recent(90, now: state.now, calendar: calendar) : state.window
            let previous = recent.previous(calendar: calendar)
            let before = row?.comparison?.before, after = row?.comparison?.after
            let maximum = max(1, before ?? 0, after ?? 0)
            data = ["kind": "changeRipples", "state": scopeState, "metric": row?.title ?? "식사 수",
                    "unit": heroDimension?.unit ?? "번", "maximum": maximum,
                    "previous": period(label: "이전", value: before, status: row?.comparison?.beforeState, window: previous, calendar: calendar),
                    "recent": period(label: "최근", value: after, status: row?.comparison?.afterState, window: recent, calendar: calendar)]
        }
        var envelope: [String: Any] = ["data": data]
        if let title { envelope["title"] = title }
        if let selected { envelope["selected"] = selected }
        let encoded = (try? JSONSerialization.data(withJSONObject: envelope, options: [.sortedKeys])) ?? Data()
        return .init(json: String(data: encoded, encoding: .utf8) ?? "{}", category: category, selectedLabel: title ?? category.rawValue, pageCount: pageCount)
    }

    private static func sensoryItem(id: String, name: String, color: Int, mealIDs: [String], segments: [TDSegment]) -> [String: Any] {
        func count(_ key: String) -> Int { segments.first { $0.key == key }?.count ?? 0 }
        return ["id": id, "name": name, "color": color, "mealIds": mealIDs,
                "intensity": ["weak": count("weak"), "medium": count("medium"), "strong": count("strong"), "unanswered": count("missing")]]
    }
    /// Reuses sample IDs carried by the measurement engine, never fabricates IDs from counts.
    static func evaluations(_ segments: [TDSegment], mode: String, prefix: String) -> [[String: Any]] {
        let order = mode == "overall" ? ["very_positive", "positive", "neutral", "negative", "very_negative"]
            : mode == "fit" ? ["below_preferred", "just_right", "above_preferred"] : ["positive", "neutral", "negative"]
        return segments.flatMap { segment -> [[String: Any]] in
            let units = (mode == "overall" ? segment.evidence.entryIDs : segment.evidence.mealIDs).sorted()
            let response: Any
            if let index = order.firstIndex(of: segment.key) { response = index }
            else if segment.key == "mixed" { response = "split" }
            else if segment.key == "missing" { response = "unanswered" }
            else { response = "held" }
            return units.map { unit in ["id": TDDataEngine.key([prefix, segment.key, unit]), "unitId": unit, "response": response] }
        }
    }
    private static func distributionState(_ rows: [[String: Any]], fallback: String) -> String {
        if fallback != "valid" { return fallback }
        if rows.contains(where: { $0["response"] is Int }) { return "valid" }
        if rows.contains(where: { ["held", "split"].contains($0["response"] as? String ?? "") }) { return "held" }
        return rows.isEmpty ? "noData" : "unanswered"
    }
    private static func period(label: String, value: Int?, status: TDCardState?, window: TDWindow, calendar: Calendar) -> [String: Any] {
        let state = value != nil ? "valid" : status == .unresolvedIdentity ? "unlinked" : status == .invalidEvidence ? "held" : "noData"
        let formatter = DateFormatter(); formatter.calendar = calendar; formatter.timeZone = calendar.timeZone; formatter.dateFormat = "yyyy.MM.dd"
        return ["label": label, "value": value.map { $0 as Any } ?? NSNull(), "state": state,
                "start": window.start.map(formatter.string(from:)) ?? "—",
                "end": window.end.flatMap { calendar.date(byAdding: .day, value: -1, to: $0) }.map(formatter.string(from:)) ?? "—"]
    }
}
