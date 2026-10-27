import Foundation

/// 음식 전체에 직접 남긴 평가. 5단계 문구와 0.5점 단위 별점의 척도를 구분해 보존한다.
struct DiningOverallEvaluation: Codable, Equatable, Sendable {
    static let version = "dining-overall-liking/1"
    static let starVersion = "dining-overall-stars/1"
    static let starScale = "overall-five-stars-half-step-v1"
    static let question = "이 음식은 전체적으로 어땠나요?"
    struct Response: DiningSelectionStringValue {
        let rawValue: String
        init(rawValue: String) { self.rawValue = rawValue }
        static let veryLiked = Self(rawValue: "veryLiked")
        static let liked = Self(rawValue: "liked")
        static let neutral = Self(rawValue: "neutral")
        static let disliked = Self(rawValue: "disliked")
        static let veryDisliked = Self(rawValue: "veryDisliked")
        static let allCases: [Self] = [.veryLiked, .liked, .neutral, .disliked, .veryDisliked]
        var label: String { ["veryLiked": "정말 좋았어요", "liked": "좋았어요", "neutral": "보통이었어요", "disliked": "아쉬웠어요", "veryDisliked": "많이 아쉬웠어요"][rawValue] ?? "알 수 없는 응답" }
        var semanticValue: String? { ["veryLiked": "very_positive", "liked": "positive", "neutral": "neutral", "disliked": "negative", "veryDisliked": "very_negative"][rawValue] }
    }
    var questionID: String
    var questionVersion: String
    var questionLabelSnapshot: String
    var responseValue: Response
    var responseLabelSnapshot: String
    var target: String
    var phase: String
    var unparsedPayload: DiningSelectionJSON?

    init(response: Response, questionID: String = "overall_liking", questionVersion: String = Self.version, questionLabelSnapshot: String = Self.question, responseLabelSnapshot: String? = nil, target: String = "whole_dish", phase: String = "unspecified") {
        self.questionID = questionID; self.questionVersion = questionVersion; self.questionLabelSnapshot = questionLabelSnapshot
        self.responseValue = response; self.responseLabelSnapshot = responseLabelSnapshot ?? response.label
        self.target = target; self.phase = phase
    }

    init?(starRating: Double) {
        guard starRating.isFinite, (0.5...5).contains(starRating),
              (starRating * 2).rounded() == starRating * 2 else { return nil }
        let value = Self.starText(starRating)
        self.init(response: .init(rawValue: value), questionVersion: Self.starVersion,
                  responseLabelSnapshot: "\(value)점")
    }

    static func starText(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(0...1)).locale(Locale(identifier: "en_US_POSIX")))
    }

    /// Existing five-category answers retain their stored wording; editing writes explicit stars.
    var starRating: Double? {
        guard !parse().observations.isEmpty else { return nil }
        if questionVersion == Self.starVersion { return numericStarRating }
        return ["veryDisliked": 1, "disliked": 2, "neutral": 3, "liked": 4, "veryLiked": 5][responseValue.rawValue]
    }

    private var numericStarRating: Double? {
        guard let value = Double(responseValue.rawValue), value.isFinite,
              (0.5...5).contains(value), (value * 2).rounded() == value * 2,
              Self.starText(value) == responseValue.rawValue else { return nil }
        return value
    }
    private enum CodingKeys: String, CodingKey { case questionID, questionVersion, questionLabelSnapshot, responseValue, responseLabelSnapshot, target, phase, unparsedPayload }
    init(from decoder: Decoder) throws {
        let raw = try DiningSelectionJSON(from: decoder)
        let c = try? decoder.container(keyedBy: CodingKeys.self)
        do {
            guard let c else { throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "전체평가 객체가 아님")) }
            self.init(response: try c.decode(Response.self, forKey: .responseValue), questionID: try c.decode(String.self, forKey: .questionID), questionVersion: try c.decode(String.self, forKey: .questionVersion), questionLabelSnapshot: try c.decode(String.self, forKey: .questionLabelSnapshot), responseLabelSnapshot: try c.decode(String.self, forKey: .responseLabelSnapshot), target: try c.decode(String.self, forKey: .target), phase: try c.decode(String.self, forKey: .phase))
            unparsedPayload = try c.decodeIfPresent(DiningSelectionJSON.self, forKey: .unparsedPayload)
        } catch {
            self.init(response: .init(rawValue: (try? c?.decode(String.self, forKey: .responseValue)) ?? "unknown"), questionID: (try? c?.decode(String.self, forKey: .questionID)) ?? "unknown", questionVersion: (try? c?.decode(String.self, forKey: .questionVersion)) ?? "unknown", questionLabelSnapshot: (try? c?.decode(String.self, forKey: .questionLabelSnapshot)) ?? "읽을 수 없는 전체평가", responseLabelSnapshot: (try? c?.decode(String.self, forKey: .responseLabelSnapshot)) ?? "읽을 수 없는 응답")
            unparsedPayload = raw
        }
    }

    func parse() -> SensoryRuleResult {
        let evidence = SensorySelectionEvidence(selectionID: questionID, type: "overallEvaluation", catalogVersion: questionVersion, labelSnapshot: questionLabelSnapshot, facet: "liking", labelValue: responseLabelSnapshot, responseValue: responseValue.rawValue, relatedBubbleID: nil, relatedBubbleLabel: nil, resolution: "resolved")
        let span = SensorySourceSpan(start: 0, end: responseLabelSnapshot.utf16.count, quote: responseLabelSnapshot)
        let reason: String?
        if unparsedPayload != nil { reason = "unreadable_overall_evaluation_payload" }
        else if questionID != "overall_liking" || ![Self.version, Self.starVersion].contains(questionVersion) { reason = "unknown_overall_evaluation_version" }
        else if questionLabelSnapshot != Self.question || responseLabelSnapshot != (questionVersion == Self.starVersion ? "\(responseValue.rawValue)점" : responseValue.label) { reason = "overall_evaluation_label_mismatch" }
        else if questionVersion == Self.starVersion ? numericStarRating == nil : responseValue.semanticValue == nil { reason = "unknown_overall_evaluation_response" }
        else if target != "whole_dish" || phase != "unspecified" { reason = "invalid_overall_evaluation_scope" }
        else { reason = nil }
        if let reason {
            let pending = SensorySelectionEvidence(selectionID: evidence.selectionID, type: evidence.type, catalogVersion: evidence.catalogVersion, labelSnapshot: evidence.labelSnapshot, facet: evidence.facet, labelValue: evidence.labelValue, responseValue: evidence.responseValue, relatedBubbleID: nil, relatedBubbleLabel: nil, resolution: "unresolved")
            return .init(unresolved: [.init(phrase: responseLabelSnapshot, reason: reason, sourceSpans: [span], selectionEvidence: pending)])
        }
        let isStars = questionVersion == Self.starVersion
        return .init(observations: [.init(kind: "overall_liking", attribute: nil,
            value: .text(isStars ? responseValue.rawValue : responseValue.semanticValue!),
            scale: isStars ? Self.starScale : "overall-five-category-v1", target: target, phase: phase,
            phrase: responseLabelSnapshot, sourceSpans: [span], selectionEvidence: evidence)])
    }
}

struct DiningOverallEvaluationContract: Decodable, Sendable {
    struct Fixture: Decodable, Sendable { let id: String; let evaluation: DiningOverallEvaluation; let expected: SensoryRuleResult }
    let version: String
    let fixtures: [Fixture]
}
