import XCTest
@testable import TasteBuddy

final class CalibrationEngineTests: XCTestCase {
    func testNeutralResponsesCreateBalancedStarterProfile() {
        let responses = Dictionary(
            uniqueKeysWithValues: TasteAxis.allCases.map { ($0, 0) }
        )

        let profile = CalibrationEngine.makeProfile(responses: responses)

        XCTAssertEqual(profile.confidence, "Starter")
        XCTAssertEqual(profile.score(for: .sweet), 50)
        XCTAssertTrue(profile.summary.contains("균형형"))
    }

    func testHighestAxesAndCautionAxisAreDerivedFromResponses() {
        let profile = CalibrationEngine.makeProfile(
            responses: [
                .sweet: 3,
                .sour: 2,
                .bitter: 0,
                .salty: -3,
                .umami: 1,
                .fat: -1
            ]
        )

        XCTAssertEqual(profile.topAxes, [.sweet, .sour])
        XCTAssertEqual(profile.cautionAxis, .salty)
        XCTAssertEqual(profile.score(for: .sweet), 100)
        XCTAssertEqual(profile.score(for: .salty), 0)
    }
}

