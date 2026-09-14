import Foundation
import CryptoKit

/// 날짜를 알지 못해도 원문은 보존한다. nil은 출처가 없는 이전 저장 자료다.
struct DiningMealTime: Codable, Equatable, Sendable {
    struct Source: DiningSelectionStringValue {
        let rawValue: String
        init(rawValue: String) { self.rawValue = rawValue }
        static let confirmed = Self(rawValue: "user_confirmed")
        static let approximate = Self(rawValue: "approximate_period")
        static let photoCandidate = Self(rawValue: "photo_candidate")
        static let recordedOnly = Self(rawValue: "recorded_only")
        static let unknown = Self(rawValue: "unknown")
        static let allCases: [Self] = [.confirmed, .approximate, .recordedOnly, .unknown]
        var label: String {
            switch self {
            case .confirmed: "확인한 식사일"
            case .approximate: "대략적인 식사 기간"
            case .photoCandidate: "사진 촬영일 후보 · 식사일 미확인"
            case .recordedOnly: "기록일만 확인"
            case .unknown: "식사 시점 모름"
            default: "알 수 없는 날짜 출처"
            }
        }
    }
    var source: Source
    var start: Date?
    var end: Date?
    var confirmedAt: Date?
    var confirmedDate: Date? { source == .confirmed ? start : nil }
}

/// 실제로 달라진 원본 필드만 보존한다. AI 정제와 사진 파일은 이력에 복제하지 않는다.
struct DiningMemoryCorrection: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    let revision: Int
    let changedAt: Date
    var before: [String: DiningSelectionJSON]
    var after: [String: DiningSelectionJSON]
    var fields: [String] { Array(Set(before.keys).union(after.keys)).sorted() }
    var scopeLabel: String { fields.map { Self.label($0) }.joined(separator: " · ") }
    static func label(_ field: String) -> String {
        ["note": "회고", "restaurant": "식당", "restaurantID": "식당 연결", "menu": "메뉴", "menuItemID": "메뉴 연결",
         "sensorySelections": "감각 응답", "overallEvaluation": "음식 전체 평가", "mealTime": "식사 시점",
         "observedAt": "저장된 날짜", "dishKindIDs": "음식 분류", "tasteExperienceIDs": "미각 선택", "detailTagIDs": "디테일 선택", "feedbackStatus": "기록 상태"][field] ?? field
    }
}

extension DiningEntry {
    var memoryRevisionNumber: Int { memoryRevision ?? 0 }
    var mealTimeLabel: String { mealTime?.source.label ?? "이전 저장 날짜 · 실제 식사일 미확인" }
    var confirmedMealDate: Date? { mealTime?.confirmedDate }

    /// 저장 실패는 호출자에게 전달한다. 알 수 없는 선택값도 원문 JSON 그대로 포함한다.
    func memorySourceFields() throws -> [String: DiningSelectionJSON] {
        func json<T: Encodable>(_ value: T) throws -> DiningSelectionJSON {
            try JSONDecoder().decode(DiningSelectionJSON.self, from: JSONEncoder().encode(value))
        }
        return try ["restaurant": json(restaurant), "restaurantID": json(restaurantID), "menu": json(menu), "menuItemID": json(menuItemID),
                    "note": json(note), "observedAt": json(observedAt), "mealTime": json(mealTime),
                    "sensorySelections": json(sensorySelections), "overallEvaluation": json(overallEvaluation),
                    "tasteExperienceIDs": json(tasteExperienceIDs), "detailTagIDs": json(detailTagIDs),
                    "dishKindIDs": json(dishKindIDs), "feedbackStatus": json(feedbackStatus)]
    }

    func recordingCorrection(from previous: DiningEntry, at date: Date) throws -> DiningEntry {
        var result = self
        let before = try previous.memorySourceFields(), after = try result.memorySourceFields()
        let changed = Set(before.keys).union(after.keys).filter { before[$0] != after[$0] }
        result.memoryRevision = previous.memoryRevision
        result.memoryCorrections = previous.memoryCorrections
        guard !changed.isEmpty else { return result }
        result.memoryRevision = previous.memoryRevisionNumber + 1
        var history = previous.memoryCorrections ?? []
        // 명시적으로 지운 필드는 이전 이력에서도 원문을 반환하지 않는다.
        let erased = changed.filter { field in
            // 날짜 출처의 nil 복원은 개인정보 삭제 동작이 아니라 이전 불확실성으로의 교정이다.
            // 기록 자체를 삭제하면 날짜 교정 이력도 함께 사라진다.
            // 레거시 선택 ID가 남은 nil 복원도 실행 취소다. 명시적인 [] 삭제와 구분한다.
            let restoresLegacySelections = field == "sensorySelections" && after[field] == .null
                && (!result.tasteExperienceIDs.isEmpty || !result.detailTagIDs.isEmpty)
            return !["mealTime", "observedAt"].contains(field) && !restoresLegacySelections &&
                (after[field] == .null || after[field] == .string("") || after[field] == .array([]))
        }
        for i in history.indices {
            for field in erased { history[i].before.removeValue(forKey: field); history[i].after.removeValue(forKey: field) }
        }
        let retained = changed.filter { !erased.contains($0) }
        history.append(.init(id: UUID(), revision: result.memoryRevisionNumber, changedAt: date,
                             before: Dictionary(uniqueKeysWithValues: retained.compactMap { key in before[key].map { (key, $0) } }),
                             after: Dictionary(uniqueKeysWithValues: changed.compactMap { key in after[key].map { (key, $0) } })))
        result.memoryCorrections = history
        return result
    }

    /// 다른 감각이나 메모만 수정했다고 이 응답을 다시 한 것으로 세지 않는다.
    func knownAt(sourceField: String, phrase: String? = nil) -> Date? {
        let key = sourceField.hasPrefix("sensorySelections:") ? "sensorySelections" : sourceField.hasPrefix("overallEvaluation:") ? "overallEvaluation" : sourceField
        func facet(_ value: DiningSelectionJSON?) -> DiningSelectionJSON? {
            if key == "note", let phrase, case .string(let note) = value {
                // 절의 단어만 같아도 주어·조건이 바뀌었을 수 있다. 문장 전체가 그대로인 경우만 유지한다.
                let sentences = note.components(separatedBy: CharacterSet(charactersIn: ".!?\n"))
                    .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                let fragment = phrase.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines.union(CharacterSet(charactersIn: ".!?")))
                let contexts = sentences.filter { !$0.isEmpty && !fragment.isEmpty && $0.contains(fragment) }
                return contexts.isEmpty ? value : .array(contexts.sorted().map(DiningSelectionJSON.string))
            }
            guard key == "sensorySelections" else { return value }
            let parts = sourceField.split(separator: ":").map(String.init)
            guard parts.count == 4, case .array(let selections) = value else { return value }
            let choice = selections.first { raw in
                guard case .object(let fields) = raw else { return false }
                return fields["type"] == .string(parts[1]) && fields["id"] == .string(parts[2])
            }
            guard case .object(let fields) = choice else { return nil }
            if parts[3] == "selection" { return .object(fields.filter { !["liking", "intensity", "preferenceFit"].contains($0.key) }) }
            // 해당 응답의 대상·시점이 달라졌다면 새 문맥이 알려진 시각을 사용한다.
            // 다른 응답의 강도만 바뀐 경우 호감 응답 시각은 유지한다.
            return .object(["response": fields[parts[3]] ?? .null,
                            "target": fields["target"] ?? .null, "phase": fields["phase"] ?? .null])
        }
        var historicalBubbles = tasteExperienceIDs, historicalTags = detailTagIDs
        func ids(_ value: DiningSelectionJSON?, fallback: [String]) -> [String] {
            guard case .array(let values) = value else { return fallback }
            return values.compactMap { if case .string(let id) = $0 { return id }; return nil }
        }
        func restored(_ value: DiningSelectionJSON?, bubbles: [String], tags: [String]) -> DiningSelectionJSON? {
            guard key == "sensorySelections", value == .null else { return value }
            let selections = SensoryAnalysisEngine.legacySelections(bubbleIDs: bubbles, tagIDs: tags, catalog: SensoryAnalysisEngine.contract?.selectionCatalog)
            guard let data = try? JSONEncoder().encode(selections) else { return value }
            return (try? JSONDecoder().decode(DiningSelectionJSON.self, from: data)) ?? value
        }
        for correction in (memoryCorrections ?? []).reversed() {
            let beforeBubbles = ids(correction.before["tasteExperienceIDs"], fallback: historicalBubbles)
            let beforeTags = ids(correction.before["detailTagIDs"], fallback: historicalTags)
            if correction.fields.contains(key) {
                // nil 레거시를 실제 선택 배열로 저장해도 원래 선택까지 새 응답 시각으로 바꾸지 않는다.
                let before = restored(correction.before[key], bubbles: beforeBubbles, tags: beforeTags)
                let after = restored(correction.after[key], bubbles: historicalBubbles, tags: historicalTags)
                if facet(before) != facet(after) { return correction.changedAt }
            }
            historicalBubbles = beforeBubbles; historicalTags = beforeTags
        }
        return memoryCorrections == nil ? updatedAt ?? savedAt : savedAt
    }

    static func memoryFingerprint(_ entries: [DiningEntry]) -> String {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
        guard let data = try? encoder.encode(entries.sorted { $0.id.uuidString < $1.id.uuidString }) else { return "unavailable" }
        return SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
}
