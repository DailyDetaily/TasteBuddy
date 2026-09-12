import Foundation

enum TasteSurveyScoringEngine {
    /// 같은 문항의 마지막 상태만 사용한다. 모름·범위 밖 값·이전 버전 문항은 점수가 아니다.
    static func normalizeResponses(
        _ responses: [TasteSurveyResponseContract],
        items: [TasteSurveyItemContract]
    ) -> [TasteSurveyResponseContract] {
        let itemsByID = Dictionary(items.map { ($0.id, $0) }, uniquingKeysWith: { _, last in last })
        var byID: [String: TasteSurveyResponseContract] = [:]
        for response in responses {
            guard let item = itemsByID[response.itemId] else { continue }
            byID[response.itemId] = nil
            if response.uncertain {
                let reason = response.uncertaintyReason == .cannotIsolateTaste && item.tasteId != .fat
                    ? .cannotRecall : (response.uncertaintyReason ?? .cannotRecall)
                byID[item.id] = .init(itemId: item.id, selectedValue: nil, uncertain: true, uncertaintyReason: reason)
            } else if let value = response.selectedValue, (0...4).contains(value), response.uncertaintyReason == nil {
                byID[item.id] = .init(itemId: item.id, selectedValue: value, uncertain: false)
            }
        }
        return items.compactMap { byID[$0.id] }
    }

    static func score(
        items: [TasteSurveyItemContract],
        responses: [TasteSurveyResponseContract],
        measuredAt: String,
        respondentContext: TasteSurveyRespondentContextContract = .init(),
        instrument: TasteSurveyInstrumentContract = .current,
        scale: TasteSurveyLikertScaleContract = .intensity
    ) -> TasteSurveyScoringOutputContract {
        let normalized = normalizeResponses(responses, items: items)
        let byID = Dictionary(normalized.map { ($0.itemId, $0) }, uniquingKeysWith: { _, last in last })
        var scores: [TasteAxis: TasteSurveyTasteScoreContract] = [:]
        var values: [TasteAxis: Double?] = [:]
        for axis in TasteAxis.allCases {
            let axisItems = items.filter { $0.tasteId == axis }
            let answered = axisItems.compactMap { item -> Int? in
                guard let response = byID[item.id], !response.uncertain else { return nil }
                return response.selectedValue
            }
            let score = answered.first.map { Double($0) / 4 }
            values[axis] = score.map { $0 * 10 }
            scores[axis] = .init(
                baseVectorScore: score,
                confidence: 0,
                constructConfidence: [.recalledIntensity: 0],
                constructScores: score.map { [.recalledIntensity: $0] } ?? [:],
                excludedItemCount: axisItems.count - answered.count,
                respondedItemCount: answered.count,
                tasteId: axis,
                totalItemCount: axisItems.count
            )
        }
        let submission = TasteSurveySubmissionContract(
            schemaVersion: 2, source: "reference-food-recall", recordedAt: measuredAt,
            instrument: instrument, recallWindow: "recent-3-months", scale: scale,
            items: items, responses: normalized, respondentContext: respondentContext
        )
        return .init(
            snapshot: .init(measuredAt: measuredAt, results: .init(values: values), source: .recalledIntensity, surveySubmission: submission),
            tasteScores: scores
        )
    }

    static func makeCompatibleResult(
        items: [TasteSurveyItemContract],
        responses: [TasteSurveyResponseContract],
        measuredAt: String,
        respondentContext: TasteSurveyRespondentContextContract = .init(),
        instrument: TasteSurveyInstrumentContract = .current,
        scale: TasteSurveyLikertScaleContract = .intensity
    ) -> TasteSurveyCompatibleResultContract {
        let output = score(
            items: items, responses: responses, measuredAt: measuredAt,
            respondentContext: respondentContext, instrument: instrument, scale: scale
        )
        let submission = output.snapshot.surveySubmission!
        let evidence = submission.items.compactMap { item -> String? in
            guard let response = submission.response(for: item.id), !response.uncertain else { return nil }
            return "\(item.anchor.label)의 \(item.tasteId.label): \(submission.responseLabel(for: item.id))."
        }
        return .init(
            snapshot: output.snapshot,
            starterGuidance: .init(
                cautionAxis: .fat, cautionLabel: "추가 확인", confidence: .starter,
                context: .init(baselineReference: "reference-food-recall-v2", calibrationMode: "recalled-intensity"),
                evidence: evidence + ["흰 우유의 지방맛 응답은 예비 단서이며 질감·향·느끼함과 구분해 살펴봐요."],
                goalPhrase: "기준 음식에서 기억한 맛의 강도",
                summaryLine: submission.summary, surfaceLabel: "기준 음식 회상 기록",
                topAxes: [], topLabels: []
            )
        )
    }

    static func makeProfile(from result: TasteSurveyCompatibleResultContract) -> TasteProfile {
        // Preserve missing values as absent keys; never manufacture neutral or population values.
        let scores = Dictionary(uniqueKeysWithValues: TasteAxis.allCases.compactMap { axis -> (String, Int)? in
            guard let value = result.snapshot.results[axis] else { return nil }
            return (axis.rawValue, Int((value * 10).rounded()))
        })
        let preciseDateFormatter = ISO8601DateFormatter()
        preciseDateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let recordedDate = preciseDateFormatter.date(from: result.snapshot.measuredAt)
            ?? ISO8601DateFormatter().date(from: result.snapshot.measuredAt)
        return .init(
            createdAt: recordedDate ?? .now,
            scores: scores, confidence: result.starterGuidance.confidence.rawValue,
            summary: result.starterGuidance.summaryLine, topAxes: [],
            cautionAxis: .fat, surveySubmission: result.snapshot.surveySubmission
        )
    }
}
