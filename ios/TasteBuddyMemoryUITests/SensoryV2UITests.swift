import XCTest

final class SensoryV2UITests: XCTestCase {
    func testNewWordSearchAndDetailOnlySave() {
        let app = XCUIApplication()
        app.launchArguments = ["--sensory-v2-qa"]
        app.launch()
        let search = app.buttons["미각 단어 검색"]
        XCTAssertTrue(search.waitForExistence(timeout: 20))
        let map = XCTAttachment(screenshot: app.screenshot())
        map.name = "sensory-v2-160-bubble-map"; map.lifetime = .keepAlways; add(map)
        search.tap()
        let field = app.searchFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap(); field.typeText("조청 같은 단맛")
        XCTAssertTrue(app.buttons["조청 같은 단맛"].waitForExistence(timeout: 5))
        app.buttons["조청 같은 단맛"].tap()
        let skip = app.buttons["버블 없이 디테일 기록하기"]
        XCTAssertTrue(skip.waitForExistence(timeout: 5)); skip.tap()
        let details = app.textFields["디테일 태그 검색"]
        for _ in 0..<5 where !details.isHittable { app.swipeUp() }
        XCTAssertTrue(details.waitForExistence(timeout: 5)); details.tap(); details.typeText("마실수록 쌓임")
        let tag = app.buttons["마실수록 쌓임"]
        XCTAssertTrue(tag.waitForExistence(timeout: 5)); tag.tap()
        app.swipeDown()
        let detail = XCTAttachment(screenshot: app.screenshot())
        detail.name = "sensory-v2-coffee-details"; detail.lifetime = .keepAlways; add(detail)
        let done = app.buttons["완료"]
        XCTAssertTrue(done.waitForExistence(timeout: 5)); done.tap()
        let save = app.buttons["저장"]
        XCTAssertTrue(save.waitForExistence(timeout: 5)); save.tap()
        XCTAssertTrue(app.staticTexts["검증용 기록 저장 완료"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["saved-v2.detail.flow.sip-build"].exists)
        XCTAssertTrue(app.staticTexts["버블 0 · 디테일 1"].exists)
    }
}
