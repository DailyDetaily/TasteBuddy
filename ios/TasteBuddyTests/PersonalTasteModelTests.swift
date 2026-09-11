import XCTest
@testable import TasteBuddy

final class PersonalTasteModelTests: XCTestCase {
    func testSharedConditionalModelAndPredictionFixtures() throws {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("TasteBuddy/Resources/TBA/personal-taste-model-contract.json")
        let contract = try JSONDecoder().decode(PersonalTasteModelContract.self, from: Data(contentsOf: url))
        XCTAssertGreaterThanOrEqual(contract.fixtures.count, 16)
        for fixture in contract.fixtures {
            let model = PersonalTasteModelBuilder.buildRecords(records: fixture.records, userID: fixture.userID, asOf: PersonalTasteModelBuilder.date(fixture.asOf))
            // 화면용 대기열을 제외한 공유 저장/전달 계약을 비교한다.
            XCTAssertEqual(PersonalTasteModelBuilder.canonical(model), PersonalTasteModelBuilder.canonical(fixture.expected), fixture.id)
            for prediction in fixture.predictions { XCTAssertEqual(PersonalTasteModelBuilder.predict(model, query: prediction.query.query), prediction.expected, fixture.id) }
        }
    }
    func testActualNativeEntryMetadataAndHistoricalCutoff() throws {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
        let observed = Date(timeIntervalSince1970: 1_700_000_000), known = observed.addingTimeInterval(100)
        let meal = UUID()
        let entry = DiningEntry(mealID: meal, restaurant: "식당", restaurantID: "restaurant-id", menu: "음식", menuItemID: "menu-id", observedAt: observed, savedAt: known, rating: 3, note: "", sensorySelections: [.init(id:"sour-fresh",type:.bubble,labelSnapshot:"산뜻한 산미",liking:.liked,intensity:.strong,target:.sauce,phase:.duringMeal)], dishKindIDs:["seafood"])
        let current = try SensoryAnalysisEngine.analyze(entries:[entry],contract:contract,userID:"owner")
        XCTAssertEqual(current.personalModel?.userID,"owner")
        XCTAssertEqual(current.personalModel?.units.first?.mealID,meal.uuidString.lowercased())
        XCTAssertEqual(current.personalModel?.units.first?.intensity,"strong")
        XCTAssertTrue(current.personalModel?.units.first?.evidence.contains(where: { $0.conditionSources.contains(where: { $0.dimension == "target" && $0.labelSnapshot == "소스" }) }) == true)
        XCTAssertEqual(current.observations.first?.restaurantID,"restaurant-id")
        XCTAssertEqual(current.observations.first?.menuItemID,"menu-id")
        let prior = try SensoryAnalysisEngine.analyze(entries:[entry],contract:contract,userID:"owner",asOf:observed.addingTimeInterval(50))
        XCTAssertEqual(prior.completedExperienceCount,0)
        XCTAssertTrue(prior.observations.isEmpty)
        XCTAssertTrue(prior.personalModel?.units.isEmpty == true)
    }
}
