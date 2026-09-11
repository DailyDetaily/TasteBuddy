import Foundation

enum TasteMeasurementSourceContract: String, Codable, Equatable {
    case broadStarter = "broad-starter"
    case measured
    case recalledIntensity = "recalled-intensity"
}

enum TasteProfileConfidenceContract: String, Codable, Equatable {
    case starter = "Starter"
    case building = "Building"
    case refined = "Refined"
}

struct TasteAxisIntVector: Codable, Equatable {
    let sweet: Int
    let sour: Int
    let bitter: Int
    let salty: Int
    let umami: Int
    let fat: Int

    subscript(axis: TasteAxis) -> Int {
        switch axis {
        case .sweet: sweet
        case .sour: sour
        case .bitter: bitter
        case .salty: salty
        case .umami: umami
        case .fat: fat
        }
    }

    init(values: [TasteAxis: Int]) {
        sweet = values[.sweet] ?? 0
        sour = values[.sour] ?? 0
        bitter = values[.bitter] ?? 0
        salty = values[.salty] ?? 0
        umami = values[.umami] ?? 0
        fat = values[.fat] ?? 0
    }
}

struct TasteAxisDoubleVector: Codable, Equatable {
    let sweet: Double
    let sour: Double
    let bitter: Double
    let salty: Double
    let umami: Double
    let fat: Double

    subscript(axis: TasteAxis) -> Double {
        switch axis {
        case .sweet: sweet
        case .sour: sour
        case .bitter: bitter
        case .salty: salty
        case .umami: umami
        case .fat: fat
        }
    }

    init(values: [TasteAxis: Double]) {
        sweet = values[.sweet] ?? 0
        sour = values[.sour] ?? 0
        bitter = values[.bitter] ?? 0
        salty = values[.salty] ?? 0
        umami = values[.umami] ?? 0
        fat = values[.fat] ?? 0
    }
}

struct TasteMeasurementSnapshotContract: Codable, Equatable {
    let measuredAt: String
    let results: TasteAxisDoubleVector
    let source: TasteMeasurementSourceContract
}

struct StarterDiningContextContract: Codable, Equatable {
    let baselineReference: String
    let calibrationMode: String
}

struct RestaurantReadyGuidanceContract: Codable, Equatable {
    let cautionAxis: TasteAxis
    let cautionLabel: String
    let confidence: TasteProfileConfidenceContract
    let context: StarterDiningContextContract
    let evidence: [String]
    let goalPhrase: String
    let summaryLine: String
    let surfaceLabel: String
    let topAxes: [TasteAxis]
    let topLabels: [String]
}

struct QuickCalibrationContractResult: Codable, Equatable {
    let absoluteScores: TasteAxisIntVector
    let relativeScores: TasteAxisIntVector
    let snapshot: TasteMeasurementSnapshotContract
    let starterGuidance: RestaurantReadyGuidanceContract
}
