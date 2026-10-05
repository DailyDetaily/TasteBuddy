import XCTest

final class HomeSearchRecommendationUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testPersonalChipUsesExistingSearchResultsAndDeletingEvidenceRefreshesIt() {
        let app = XCUIApplication()
        app.launchArguments = ["--search-recommendation-qa", "--search-recommendation-controls"]
        app.launch()
        let chip = app.buttons["search-recommendation-chip-taste"]
        XCTAssertTrue(chip.waitForExistence(timeout: 60), app.debugDescription)
        chip.tap()
        XCTAssertTrue(app.staticTexts["매운새우완탕"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["매운야채완탕"].exists)
        XCTAssertTrue(app.staticTexts["총 2개 결과"].exists)
        XCTAssertFalse(app.staticTexts["search-recommendation-reason"].exists)
        XCTAssertFalse(app.buttons["다시 고르기"].exists)
        XCTAssertFalse(app.buttons["식당 찾기"].exists)
        XCTAssertEqual(app.staticTexts["search-recommendation-transport-count"].label, "외부 검색 호출 0")
        app.buttons["search-recommendation-delete-evidence"].tap()
        let general = app.buttons["search-recommendation-chip-general"]
        XCTAssertTrue(general.waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertFalse(chip.exists)
        XCTAssertFalse(app.staticTexts["search-recommendation-reason"].exists)
        general.tap()
        XCTAssertTrue(app.staticTexts["매운새우완탕"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["총 2개 결과"].exists)
        XCTAssertEqual(app.staticTexts["search-recommendation-transport-count"].label, "외부 검색 호출 0")
    }

    func testColdStartAndExplicitRestaurantSearchLeaveTheMenuIntent() {
        let app = XCUIApplication()
        app.launchArguments = ["--search-recommendation-qa", "--search-recommendation-empty"]
        app.launch()
        let chip = app.buttons["search-recommendation-chip-general"]
        XCTAssertTrue(chip.waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertFalse(app.buttons["search-recommendation-chip-taste"].exists)
        capture(app, name: "Existing search — recommendation chips")
        chip.tap()
        XCTAssertTrue(app.staticTexts["매운새우완탕"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["총 2개 결과"].exists)
        XCTAssertFalse(app.buttons["다시 고르기"].exists)
        XCTAssertFalse(app.buttons["식당 찾기"].exists)
        capture(app, name: "Existing search — menu results")
        app.buttons["매운새우완탕"].tap()
        let field = app.textFields["통합 검색"]
        XCTAssertEqual(field.value as? String, "딘타이펑")
        XCTAssertFalse(app.staticTexts["search-recommendation-reason"].exists)
    }

    private func capture(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
