import Foundation

enum TasteSurveyConstructContract: String, Codable, CaseIterable, Sendable {
    case recalledIntensity = "recalled_intensity"
}

enum TasteSurveyAnchorStabilityContract: String, Codable {
    case high
    case medium
    case low
}

struct TasteSurveyInstrumentContract: Codable, Equatable {
    let id: String
    let title: String
    let version: String

    static let current = TasteSurveyInstrumentContract(
        id: "taste-buddy-initial-six-taste-survey",
        title: "Taste Buddy Reference Food Recall Survey",
        version: "2.0.0"
    )
}

struct TasteSurveyLikertScaleContract: Codable, Equatable {
    let min: Int
    let max: Int
    let midpointValue: Int
    let uncertainLabel: String
    let labels: [String: String]

    func label(for value: Int) -> String {
        labels[String(value)] ?? ""
    }

    static let intensity = TasteSurveyLikertScaleContract(
        min: 0, max: 4, midpointValue: 2, uncertainLabel: "기억나지 않아요",
        labels: ["0": "전혀 느끼지 않음", "1": "약하게 느껴짐", "2": "중간 정도로 느껴짐", "3": "강하게 느껴짐", "4": "매우 강하게 느껴짐"]
    )
}

struct TasteSurveyContextOptionContract: Codable, Equatable, Identifiable {
    let value: String
    let label: String

    var id: String { value }
}

struct TasteSurveyContextStepContract: Codable, Equatable, Identifiable {
    let id: String
    let badgeLabel: String
    let title: String
    let description: String
    let options: [TasteSurveyContextOptionContract]
}

struct TasteSurveyAnchorContract: Codable, Equatable {
    let id: String
    let version: String
    let label: String
    let description: String
    let stability: TasteSurveyAnchorStabilityContract
    let conditions: [String]
}

struct TasteSurveyExploratoryMetadataContract: Codable, Equatable {
    let appliesToTasteIds: [TasteAxis]
    let interpretationCaution: String
    let rationale: String
}

struct TasteSurveyItemContract: Codable, Equatable, Identifiable {
    let anchor: TasteSurveyAnchorContract
    let construct: TasteSurveyConstructContract
    let exploratoryMetadata: TasteSurveyExploratoryMetadataContract?
    let id: String
    let prompt: String
    let helper: String
    let recallWindow: String
    let reverseKeyed: Bool
    let tasteId: TasteAxis
}

struct TasteSurveyResponseContract: Codable, Equatable {
    let itemId: String
    let selectedValue: Int?
    let uncertain: Bool
    var uncertaintyReason: TasteSurveyUncertaintyReasonContract? = nil
}

enum TasteSurveyUncertaintyReasonContract: String, Codable, CaseIterable {
    case neverTried = "never_tried"
    case cannotRecall = "cannot_recall"
    case cannotIsolateTaste = "cannot_isolate_taste"

    var label: String {
        switch self {
        case .neverTried: "먹어본 적 없어요"
        case .cannotRecall: "기억나지 않아요"
        case .cannotIsolateTaste: "지방맛을 구분하기 어려워요"
        }
    }
}

/// 원문·음식·조건·척도·버전을 함께 보존하는 회상 응답. 실제 시식이나 역치 검사와 구분한다.
struct TasteSurveySubmissionContract: Codable, Equatable {
    let schemaVersion: Int
    let source: String
    let recordedAt: String
    let instrument: TasteSurveyInstrumentContract
    let recallWindow: String
    let scale: TasteSurveyLikertScaleContract
    let items: [TasteSurveyItemContract]
    let responses: [TasteSurveyResponseContract]
    let respondentContext: TasteSurveyRespondentContextContract

    var normalizedResponses: [TasteSurveyResponseContract] {
        TasteSurveyScoringEngine.normalizeResponses(responses, items: items)
    }

    var answeredCount: Int {
        normalizedResponses.filter { !$0.uncertain && $0.selectedValue != nil }.count
    }

    func response(for itemID: String) -> TasteSurveyResponseContract? {
        normalizedResponses.first { $0.itemId == itemID }
    }

    func responseLabel(for itemID: String) -> String {
        guard let response = response(for: itemID) else { return "미응답" }
        if response.uncertain { return (response.uncertaintyReason ?? .cannotRecall).label }
        return response.selectedValue.map { scale.label(for: $0) } ?? "미응답"
    }

    var summary: String {
        answeredCount > 0
            ? "\(answeredCount)가지 기준 음식에서 기억한 맛의 강도를 남겼어요. 음식마다 기준이 달라 맛 사이의 민감도 순위나 좋아하는 정도로 해석하지 않아요."
            : "아직 강도를 답한 기준 음식이 없어요. 먹어본 적 없거나 기억나지 않는 응답은 점수로 채우지 않고 남겨요."
    }
}

struct TasteSurveyRespondentContextContract: Codable, Equatable {
    var birthDate: String? = nil
    var sexContext: String? = nil
    var smokingStatus: String? = nil
}

struct TasteAxisOptionalDoubleVector: Codable, Equatable {
    let sweet: Double?
    let sour: Double?
    let bitter: Double?
    let salty: Double?
    let umami: Double?
    let fat: Double?

    subscript(axis: TasteAxis) -> Double? {
        switch axis {
        case .sweet: sweet
        case .sour: sour
        case .bitter: bitter
        case .salty: salty
        case .umami: umami
        case .fat: fat
        }
    }

    init(values: [TasteAxis: Double?]) {
        sweet = values[.sweet] ?? nil
        sour = values[.sour] ?? nil
        bitter = values[.bitter] ?? nil
        salty = values[.salty] ?? nil
        umami = values[.umami] ?? nil
        fat = values[.fat] ?? nil
    }
}

struct TasteSurveyMeasurementSnapshotContract: Codable, Equatable {
    let measuredAt: String
    let results: TasteAxisOptionalDoubleVector
    let source: TasteMeasurementSourceContract
    var surveySubmission: TasteSurveySubmissionContract? = nil
}

struct TasteSurveyTasteScoreContract: Equatable {
    let baseVectorScore: Double?
    let confidence: Double
    let constructConfidence: [TasteSurveyConstructContract: Double]
    let constructScores: [TasteSurveyConstructContract: Double]
    let excludedItemCount: Int
    let respondedItemCount: Int
    let tasteId: TasteAxis
    let totalItemCount: Int
}

struct TasteSurveyScoringOutputContract: Equatable {
    let snapshot: TasteSurveyMeasurementSnapshotContract
    let tasteScores: [TasteAxis: TasteSurveyTasteScoreContract]
}

struct TasteSurveyCompatibleResultContract: Codable, Equatable {
    let snapshot: TasteSurveyMeasurementSnapshotContract
    let starterGuidance: RestaurantReadyGuidanceContract
}

struct TasteSurveyCatalogContract: Decodable, Equatable {
    let schemaVersion: Int
    let instrument: TasteSurveyInstrumentContract
    let likertScale: TasteSurveyLikertScaleContract
    let contextSteps: [TasteSurveyContextStepContract]
    let items: [TasteSurveyItemContract]
}

enum TasteSurveyCatalogLoader {
    static func load(bundle: Bundle = .main) throws -> TasteSurveyCatalogContract {
        guard let url =
            bundle.url(
                forResource: "taste-survey-golden",
                withExtension: "json",
                subdirectory: "Fixtures"
            )
            ?? bundle.url(forResource: "taste-survey-golden", withExtension: "json")
        else {
            throw CocoaError(.fileNoSuchFile)
        }

        return try JSONDecoder().decode(
            TasteSurveyCatalogContract.self,
            from: Data(contentsOf: url)
        )
    }
}
