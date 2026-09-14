import Foundation

/// 가족 ID는 표시 묶음/이전 이력 조회용, instance ID는 원출처의 한 확인 항목용이다.
extension PersonalTasteModelBuilder {
    static func questionSourceKey(_ source: PersonalTasteModelRecord) -> String {
        if let selected = source.selectionEvidence {
            return json([source.experienceId, selected.type, selected.selectionID,
                         selected.catalogVersion, selected.labelSnapshot, nullable(selected.relatedBubbleID)])
        }
        // 원문은 위치와 인용을 함께 고정한다. 문장 위치가 바뀌면 다른 문장에 재연결하지 않는다.
        return json([source.experienceId, source.phrase, canonical(source.sourceSpans)])
    }

    static func individualQuestionGroups(_ questions: [Question], included: [PersonalTasteModelRecord]) -> [String: Question] {
        let byID = Dictionary(included.map { ($0.observationId, $0) }, uniquingKeysWith: { first, _ in first })
        let bySource = Dictionary(grouping: included, by: questionSourceKey)
        var result: [String: Question] = [:]
        for q in questions {
            let family = json([q.attribute, nullable(q.reference), q.facet, q.target, q.phase, q.intent,
                               q.proposedCondition.map { ["dimension": $0.dimension, "value": $0.value] } as Any? ?? NSNull()])
            if q.intent == "exploration" {
                // 명시적인 선택적 제안. 기존 식사 응답 instance와 다른 수명주기다.
                let observed = Set(included.filter { $0.attribute == q.attribute && $0.reference == q.reference && $0.kind == "sensory_intensity" }.map { $0.value.text })
                let missing = ["weak", "medium", "strong"].filter { !observed.contains($0) }
                // 한쪽 끝의 기록만 있으면 인접 범주를 선택적 비교로 제시한다.
                // 중간만 있고 두 방향이 동률이면 임의의 약한 맛을 먼저 권하지 않는다.
                let proposed = missing.count == 1 ? missing.first : observed == ["weak"] || observed == ["strong"] ? "medium" : nil
                guard let proposed else { continue }
                var optional = q; optional.proposedCondition = .init(dimension: "intensity", value: proposed)
                let explorationKey = json([q.attribute, nullable(q.reference), q.facet, q.target, q.phase, q.intent,
                                           ["dimension": "intensity", "value": proposed]])
                result[explorationKey] = optional
                continue
            }
            let sources = q.evidenceIDs.compactMap { byID[$0] }.filter {
                $0.attribute == q.attribute && $0.reference == q.reference && $0.target == q.target && $0.phase == q.phase
            }.sorted {
                if ($0.kind == "sensory_presence") != ($1.kind == "sensory_presence") { return $0.kind == "sensory_presence" }
                return $0.observationId < $1.observationId
            }
            var seen = Set<String>()
            for source in sources {
                let logicalSource = questionSourceKey(source)
                guard seen.insert(logicalSource).inserted else { continue }
                let peers = (bySource[logicalSource] ?? []).filter { $0.attribute == q.attribute && $0.reference == q.reference
                        && $0.target == q.target && $0.phase == q.phase
                }
                let kind = q.facet == "liking" ? "attribute_liking" : q.facet == "intensity" ? "sensory_intensity" : ""
                // 유효한 값이나 충돌을 미응답으로 바꾸지 않는다.
                if !kind.isEmpty && peers.contains(where: { $0.kind == kind }) { continue }
                let key = json([family, logicalSource])
                var copy = q
                copy.evidenceIDs = unique(peers.map(\.observationId))
                copy.mealIDs = [source.mealId]
                copy.responseSourceID = source.observationId
                if let old = result[key], old.score >= copy.score { continue }
                result[key] = copy
            }
        }
        return result
    }
}

/// 노출 정책은 취향 자료가 아니다. 시간은 제품 정책이며 검증된 최적 간격이 아니다.
struct PersonalTasteQuestionPresentationPolicy {
    var deferredInterval: TimeInterval = 24 * 60 * 60
    var cannotRecallInterval: TimeInterval = 30 * 24 * 60 * 60
    var answeredCooldown: TimeInterval = 24 * 60 * 60
    var legacyMigrationCooldown: TimeInterval = 7 * 24 * 60 * 60
}
