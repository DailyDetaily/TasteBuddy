import Foundation

enum PreferenceIntakeSelectionModeContract: String, Codable {
    case single
    case multiple
}

struct PreferenceIntakeOptionContract: Codable, Equatable, Identifiable, Sendable {
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
    /// Completed source records only. Draft choices never become TBA evidence.
    var submissions: [PreferenceIntakeSubmission]? = nil

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

struct PreferenceIntakeSubmission: Codable, Equatable, Sendable, Identifiable {
    let schemaVersion: String
    let instrumentVersion: String
    let id: String
    let userID: String
    let recordedAt: String
    let knownAt: String
    let source: Source
    let responses: [Response]
    struct Source: Codable, Equatable, Sendable { let kind: String; let platform: String }
    struct Response: Codable, Equatable, Sendable {
        let questionID: String
        let questionText: String
        let questionDescription: String
        let state: String
        let selectedOptions: [PreferenceIntakeOptionContract]
    }
}

struct PreferenceIntakeEvidenceRecord: Equatable, Sendable, Identifiable {
    let id: String
    let sourceSubmissionID: String
    let kind: String
    let label: String
    let state: String
    let recordedAt: String
    let knownAt: String
    let response: PreferenceIntakeSubmission.Response
    var summary: String {
        state == "unanswered" ? "아직 답하지 않았어요" : response.selectedOptions.map(\.label).joined(separator: " · ")
    }
}

struct PreferenceIntakeEvidenceSnapshot: Equatable, Sendable {
    var version = "tba-preference-intake/1"
    var source = "self_report"
    var submissionID: String? = nil
    var recordedAt: String? = nil
    var answeredQuestionCount = 0
    var records: [PreferenceIntakeEvidenceRecord] = []
    var excludedSubmissions: [PersonalTasteExcludedEvidence] = []
    let limits = ["직접 알려준 선호이며 실제 식사에서 확인한 반응과 구분해요.",
                  "풍미 강도 선호를 개별 맛의 감각 강도나 민감도로 바꾸지 않아요.",
                  "피해야 할 재료에 대한 자기 보고이며 의학적 진단을 뜻하지 않아요.",
                  "공유 선호를 기록해도 정보가 전송되거나 공유 권한이 생기지 않아요."]
    static let empty = PreferenceIntakeEvidenceSnapshot()
}

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
