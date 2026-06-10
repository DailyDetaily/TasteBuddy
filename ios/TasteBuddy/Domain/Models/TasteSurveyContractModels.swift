import Foundation

enum TasteSurveyConstructContract: String, Codable, CaseIterable {
    case salience
    case overload
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
}

struct TasteSurveyLikertScaleContract: Codable, Equatable {
    let min: Int
    let max: Int
    let neutralValue: Int
    let uncertainLabel: String
    let labels: [String: String]

    func label(for value: Int) -> String {
        labels[String(value)] ?? ""
    }
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
    let label: String
    let description: String
    let stability: TasteSurveyAnchorStabilityContract
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
    let recallWindow: String
    let reverseKeyed: Bool
    let tasteId: TasteAxis
}

struct TasteSurveyResponseContract: Codable, Equatable {
    let itemId: String
    let selectedValue: Int?
    let uncertain: Bool
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
