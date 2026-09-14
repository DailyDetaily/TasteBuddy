import Foundation

/// 해결 경로가 있는 중요한 원문/충돌만 편집 질문으로 연결한다. 답을 제시하거나 추정하지 않는다.
enum PersonalTasteSourceReviewQuestions {
    static func make(unresolved: [SensoryUnresolved], entries: [DiningEntry], userID: String) -> [PersonalTasteNextSelection] {
        let byID = Dictionary(entries.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
        var seen = Set<String>()
        return unresolved.sorted { $0.recordedAt == $1.recordedAt ? $0.id < $1.id : $0.recordedAt > $1.recordedAt }
            .filter { (($0.needsMeaningReview && $0.sourceField == "note") || $0.reason.contains("conflict")) && byID[$0.experienceID] != nil }
            .compactMap { row -> PersonalTasteNextSelection? in
                let key = PersonalTasteModelBuilder.json([row.experienceID.uuidString, row.sourceField, row.phrase,
                    PersonalTasteModelBuilder.canonical(row.sourceSpans), row.reason])
                guard seen.insert(key).inserted, let entry = byID[row.experienceID] else { return nil }
                let conflict = row.reason.contains("conflict")
                return .init(id: PersonalTasteModelBuilder.identifier("question-instance-v2-review", [userID, key]),
                    attribute: "unresolved", label: row.phrase, facet: conflict ? "conflict" : "meaning",
                    question: conflict ? "서로 다른 응답을 확인하고 원래 기록을 바로잡을까요?" : "이 표현에서 더 기억나는 점이 있나요?",
                    reason: row.reason, evidenceIDs: [row.id], mealIDs: [entry.mealID.uuidString.lowercased()], createsEvidence: false,
                    intent: "source_review", proposedCondition: nil, unobserved: false, responseSourceID: row.id,
                    sourceExperienceID: entry.id.uuidString.lowercased())
            }
    }
}
