import Foundation

enum PreferenceIntakeSelectionModeContract: String, Codable {
    case single
    case multiple
}

struct PreferenceIntakeOptionContract: Codable, Equatable, Identifiable {
    let description: String
    let id: String
    let label: String
}

struct PreferenceIntakeQuestionContract: Codable, Equatable, Identifiable {
    let description: String
    let eyebrow: String
    let gridColumns: Int?
    let helperText: String?
    let id: String
    let maxSelections: Int?
    let minSelections: Int?
    let noneOptionId: String?
    let options: [PreferenceIntakeOptionContract]
    let selectionMode: PreferenceIntakeSelectionModeContract
    let title: String
}

struct PreferenceIntakeResponsesContract: Codable, Equatable {
    var allergies: [String] = []
    var avoidedSignals: [String] = []
    var dietaryRestrictions: [String] = []
    var explorationStyle: String? = nil
    var flavorIntensityPreference: String? = nil
    var preferredCuisineTypes: [String] = []
    var sharePreferenceWithRestaurant: String? = nil

    func value(for questionId: String) -> PreferenceIntakeResponseValue {
        switch questionId {
        case "allergies":
            .multiple(allergies)
        case "avoidedSignals":
            .multiple(avoidedSignals)
        case "dietaryRestrictions":
            .multiple(dietaryRestrictions)
        case "preferredCuisineTypes":
            .multiple(preferredCuisineTypes)
        case "explorationStyle":
            .single(explorationStyle)
        case "flavorIntensityPreference":
            .single(flavorIntensityPreference)
        case "sharePreferenceWithRestaurant":
            .single(sharePreferenceWithRestaurant)
        default:
            .single(nil)
        }
    }

    mutating func setMultiple(_ values: [String], for questionId: String) {
        switch questionId {
        case "allergies":
            allergies = values
        case "avoidedSignals":
            avoidedSignals = values
        case "dietaryRestrictions":
            dietaryRestrictions = values
        case "preferredCuisineTypes":
            preferredCuisineTypes = values
        default:
            break
        }
    }

    mutating func setSingle(_ value: String, for questionId: String) {
        switch questionId {
        case "explorationStyle":
            explorationStyle = value
        case "flavorIntensityPreference":
            flavorIntensityPreference = value
        case "sharePreferenceWithRestaurant":
            sharePreferenceWithRestaurant = value
        default:
            break
        }
    }
}

enum PreferenceIntakeResponseValue: Equatable {
    case multiple([String])
    case single(String?)
}

typealias PreferenceIntakeProfileContract = PreferenceIntakeResponsesContract

struct PreferenceIntakeFixtureContract: Decodable {
    let schemaVersion: Int
    let sourceFiles: [String]
    let questions: [PreferenceIntakeQuestionContract]
    let referenceResponses: PreferenceIntakeResponsesContract
    let expectedProfile: PreferenceIntakeProfileContract
    let answeredByQuestion: [String: Bool]
    let selectionCases: [PreferenceIntakeSelectionCaseContract]
}

struct PreferenceIntakeSelectionCaseContract: Decodable {
    let id: String
    let questionId: String
    let currentValue: [String]
    let optionId: String
    let expected: [String]
}

enum PreferenceIntakeCatalogLoader {
    static func load(bundle: Bundle = .main) throws -> PreferenceIntakeFixtureContract {
        guard let url =
            bundle.url(
                forResource: "preference-intake",
                withExtension: "json",
                subdirectory: "Fixtures"
            )
            ?? bundle.url(forResource: "preference-intake", withExtension: "json")
        else {
            throw CocoaError(.fileNoSuchFile)
        }

        return try JSONDecoder().decode(
            PreferenceIntakeFixtureContract.self,
            from: Data(contentsOf: url)
        )
    }
}

