import XCTest
@testable import TasteBuddy

final class DiningSensorySelectionBoundaryTests: XCTestCase {
    func testMalformedSelectionDoesNotDiscardSiblingOrRawPayload() throws {
        let data = Data(#"[{"id":"sour-fresh","type":"bubble","catalogVersion":"dining-sensory-selection/1","labelSnapshot":"산뜻한 산미","liking":{"future":1}},{"id":"sour-fresh","type":"bubble","catalogVersion":"dining-sensory-selection/1","labelSnapshot":"산뜻한 산미","liking":"liked"},42]"#.utf8)
        let values = try JSONDecoder().decode([DiningSensorySelection].self, from: data)
        XCTAssertEqual(values.count, 3)
        XCTAssertNotNil(values[0].unparsedPayload)
        XCTAssertEqual(values[1].liking, .liked)
        XCTAssertNotNil(values[2].unparsedPayload)
        XCTAssertEqual(try JSONDecoder().decode([DiningSensorySelection].self, from: JSONEncoder().encode(values)), values)
    }

    func testFutureResponseStringSurvivesRoundTrip() throws {
        let data = Data(#"{"id":"sour-fresh","type":"bubble","catalogVersion":"dining-sensory-selection/1","labelSnapshot":"산뜻한 산미","liking":"future-response"}"#.utf8)
        let chosen = try JSONDecoder().decode(DiningSensorySelection.self, from: data)
        XCTAssertNil(chosen.unparsedPayload)
        XCTAssertEqual(chosen.liking?.rawValue, "future-response")
        XCTAssertEqual(try JSONDecoder().decode(DiningSensorySelection.self, from: JSONEncoder().encode(chosen)), chosen)
    }

    func testEveryPublishedSelectionFixtureMatchesNativeParser() throws {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
        XCTAssertEqual(contract.selectionCatalog.entries.count, 132)
        for fixture in contract.selectionCatalog.fixtures {
            XCTAssertEqual(DiningSensorySelectionParser.parse(fixture.selections, catalog: contract.selectionCatalog), fixture.expected, fixture.id)
        }
    }

    func testOverallFiveCategoryFixturesAndMalformedRoundTrip() throws {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
        XCTAssertEqual(DiningOverallEvaluation.Response.allCases.count, 5)
        for fixture in contract.overallEvaluationContract.fixtures {
            XCTAssertEqual(fixture.evaluation.parse(), fixture.expected, fixture.id)
        }
        let malformed = try JSONDecoder().decode(DiningOverallEvaluation.self, from: Data(#"{"responseValue":{"future":1},"responseLabelSnapshot":"저장된 응답"}"#.utf8))
        XCTAssertNotNil(malformed.unparsedPayload)
        XCTAssertEqual(malformed.parse().unresolved.first?.phrase, "저장된 응답")
        XCTAssertEqual(try JSONDecoder().decode(DiningOverallEvaluation.self, from: JSONEncoder().encode(malformed)), malformed)
    }
}
