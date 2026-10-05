import XCTest

final class GastronomyUITests: XCTestCase {
    func testNativeCalloutActionAndDismissal() {
        let previewApp = XCUIApplication()
        previewApp.launchArguments = ["--design-system-preview", "--callout-preview"]
        previewApp.launch()
        let action = previewApp.buttons["native-callout-action"]
        XCTAssertTrue(action.waitForExistence(timeout: 10))
        action.tap()
        XCTAssertEqual(previewApp.staticTexts["native-callout-action-count"].label, "안내 실행 1회")
        let close = previewApp.buttons["새소식 닫기"]
        XCTAssertTrue(close.exists)
        close.tap()
        XCTAssertFalse(close.exists)
        let restore = previewApp.buttons["native-callout-restore"]
        XCTAssertTrue(restore.exists)
        restore.tap()
        XCTAssertTrue(close.exists)
        let attachment = XCTAttachment(screenshot: previewApp.screenshot())
        attachment.name = "Native Callout · actions and dismissal"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private var app: XCUIApplication!
    override func setUpWithError() throws { continueAfterFailure = false; app = XCUIApplication() }
    private func element(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot()); attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
    private func reveal(_ target: XCUIElement) {
        for _ in 0..<12 where !target.isHittable { app.swipeUp() }
        XCTAssertTrue(target.isHittable, app.debugDescription)
    }
    func testCapturePopulatedDiscoveryExamplesForEveryCategory() {
        for category in ["경험", "감각", "취향", "맥락", "변화"] {
            app.launchArguments = ["--gastronomy-qa", "--gastronomy-reduce-motion", "--gastronomy-discovery-examples", "--gastronomy-category=" + category]
            app.launch()
            let rail = app.scrollViews.matching(NSPredicate(format: "identifier BEGINSWITH %@", "taste-data-discovery-list-" + category + "-new-")).firstMatch
            XCTAssertTrue(rail.waitForExistence(timeout: 120), app.debugDescription)
            reveal(rail)
            let card = rail.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "taste-data-discovery-")).firstMatch
            XCTAssertTrue(card.exists, app.debugDescription)
            // Keep the entire populated card, its section heading, and the page title in the capture.
            for _ in 0..<5 where rail.frame.maxY > app.frame.maxY - 30 {
                app.coordinate(withNormalizedOffset: CGVector(dx: 0.97, dy: 0.8))
                    .press(forDuration: 0.1, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.97, dy: 0.5)))
            }
            XCTAssertGreaterThan(rail.frame.minY, 110)
            XCTAssertLessThanOrEqual(rail.frame.maxY, app.frame.maxY - 15)
            XCTAssertFalse(card.label.isEmpty)
            capture("discovery-example-" + category)
            app.terminate()
        }
    }
    func testFiveCategoriesOpenFromRealHomeAndKeepCorrectRoutes() throws {
        app.launchArguments = ["--gastronomy-qa", "--gastronomy-reduce-motion"]
        app.launch()
        let rail = element("home-gastronomy-categories")
        XCTAssertTrue(rail.waitForExistence(timeout: 120), app.debugDescription)
        for category in ["경험", "감각", "취향", "맥락", "변화"] {
            let button = element("home-category-" + category)
            // Offscreen horizontal cells can throw while querying isHittable on iOS 26.
            // Bring the whole cell into the viewport before asking for a hit point.
            for _ in 0..<8 {
                let frame = button.frame, viewport = rail.frame.intersection(app.frame)
                if button.exists && frame.intersection(viewport).width >= 60 { break }
                let targetX: CGFloat = frame.width > 0 && frame.midX < viewport.midX ? 0.8 : 0.2
                rail.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
                    .press(forDuration: 0.1, thenDragTo: rail.coordinate(withNormalizedOffset: CGVector(dx: targetX, dy: 0.5)))
            }
            XCTAssertTrue(button.isHittable, app.debugDescription); button.tap()
            XCTAssertTrue(element("taste-data-" + category).waitForExistence(timeout: 60), app.debugDescription)
            XCTAssertTrue(element("taste-data-hero-" + category).waitForExistence(timeout: 120), app.debugDescription)
            let firstMetric = ["경험": "meals", "감각": "presence", "취향": "overall", "맥락": "context-foodKind", "변화": "change-experience"][category]!
            XCTAssertTrue(element("taste-data-card-" + firstMetric).waitForExistence(timeout: 120))
            let initialPage = try backgroundPixel()
            capture("gastronomy-" + category)
            app.swipeUp()
            let tintedPage = try backgroundPixel(), tintedBar = try backgroundPixel(yFraction: 0.1)
            XCTAssertGreaterThan(colorDifference(initialPage, tintedPage), 4, category + " page must reach its tint surface")
            XCTAssertLessThanOrEqual(colorDifference(tintedPage, tintedBar), 2, category + " top bar must match the page tint")
            capture("gastronomy-scrolled-" + category)
            app.swipeDown(); app.swipeDown()
            XCTAssertLessThanOrEqual(colorDifference(initialPage, try backgroundPixel()), 2, category + " page must restore its original background")
            let back = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "뒤로")).firstMatch
            XCTAssertTrue(back.exists, app.debugDescription); back.tap()
            XCTAssertTrue(rail.waitForExistence(timeout: 30))
        }
    }
    func testFirstAndRepeatThreeWayControlsAndEvidenceScope() {
        app.launchArguments = ["--gastronomy-qa", "--gastronomy-reduce-motion", "--gastronomy-category=경험"]
        app.launch()
        XCTAssertTrue(element("taste-data-hero-경험").waitForExistence(timeout: 120))
        for id in ["taste-data-first", "taste-data-repeat"] {
            let card = element(id); reveal(card)
            for title in ["식당", "음식 종류", "메뉴"] {
                let option = card.buttons[title].firstMatch
                XCTAssertTrue(option.exists, app.debugDescription); option.tap()
            }
            capture(id)
        }
        app.swipeDown(); app.swipeDown(); app.swipeDown(); app.swipeDown()
        let meals = element("taste-data-card-meals"); reveal(meals)
        meals.tap()
        XCTAssertTrue(element("taste-card-detail-screen").waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(element("taste-data-detail-title").waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(element("taste-detail-periods").waitForExistence(timeout: 30), app.debugDescription)
        app.buttons["1개월"].firstMatch.tap()
        let detailRow = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "taste-data-detail-row-")).firstMatch
        XCTAssertTrue(detailRow.waitForExistence(timeout: 30), app.debugDescription)
        detailRow.tap()
        XCTAssertTrue(element("taste-data-evidence-role").waitForExistence(timeout: 30), app.debugDescription)
        capture("gastronomy-evidence-scopes")
    }
    func testEmptyArchiveKeepsNeutralRingAndHasNoInventedMeasurements() {
        app.launchArguments = ["--gastronomy-qa", "--gastronomy-reduce-motion", "--gastronomy-empty", "--gastronomy-category=감각"]
        app.launch()
        XCTAssertTrue(app.staticTexts["첫 미식 기록을 기다리고 있어요"].waitForExistence(timeout: 120))
        XCTAssertTrue(element("taste-data-hero-감각").exists)
        let motion = element("taste-data-hero-감각")
        XCTAssertTrue(motion.waitForExistence(timeout: 30))
        expectation(for: NSPredicate(format: "label CONTAINS %@", "—"), evaluatedWith: motion)
        waitForExpectations(timeout: 30)
        XCTAssertFalse(element("taste-data-card-presence").exists)
        capture("gastronomy-empty")
    }
    func testRingTintAndHorizontalDiscoveryCardsOpenEvidence() throws {
        app.launchArguments = ["--gastronomy-qa", "--gastronomy-reduce-motion", "--gastronomy-category=경험"]
        app.launch()
        XCTAssertTrue(element("taste-data-card-meals").waitForExistence(timeout: 120))
        let before = try backgroundPixel()
        capture("ring-before-scroll")
        app.swipeUp()
        let after = try backgroundPixel()
        XCTAssertGreaterThan(colorDifference(before, after), 4,
                             "Scrolling past the ring must change the page to the category tint surface")
        capture("ring-after-scroll-tint")
        let rail = element("taste-data-discovery-list-경험-new-현재 범위에서 발견")
        reveal(rail)
        let cards = rail.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "taste-data-discovery-"))
        XCTAssertGreaterThanOrEqual(cards.count, 2, app.debugDescription)
        let first = cards.element(boundBy: 0), second = cards.element(boundBy: 1)
        XCTAssertGreaterThan(second.frame.minX, first.frame.minX)
        XCTAssertEqual(first.frame.minY, second.frame.minY, accuracy: 3)
        XCTAssertLessThan(first.frame.width, rail.frame.width)
        capture("discoveries-horizontal")
        rail.swipeLeft()
        second.tap()
        XCTAssertTrue(element("taste-card-detail-screen").waitForExistence(timeout: 30))
        XCTAssertTrue(element("taste-detail-periods").waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertFalse(app.staticTexts["관련 기록"].exists)
        capture("discovery-period-detail")
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "뒤로")).firstMatch.tap()
        XCTAssertTrue(element("taste-data-read-discoveries").waitForExistence(timeout: 15))
    }

    func testAllCategoryMeasurementsUseFullDetailAndReturnToTheirCategory() {
        let metrics = ["경험": "meals", "감각": "presence", "취향": "overall", "맥락": "context-foodKind", "변화": "change-experience"]
        for category in ["경험", "감각", "취향", "맥락", "변화"] {
            app.launchArguments = ["--gastronomy-qa", "--gastronomy-reduce-motion", "--gastronomy-category=" + category]
            app.launch()
            let metric = element("taste-data-card-" + metrics[category]!)
            XCTAssertTrue(metric.waitForExistence(timeout: 120), app.debugDescription)
            reveal(metric); metric.tap()
            XCTAssertTrue(element("taste-card-detail-screen").waitForExistence(timeout: 30), app.debugDescription)
            XCTAssertTrue(element("taste-data-detail-title").waitForExistence(timeout: 30), app.debugDescription)
            XCTAssertEqual(app.sheets.count, 0, "An analysis card must push a full page, not a sheet")
            XCTAssertFalse(app.staticTexts["식사와 요리 기록을 구분해요"].exists)
            XCTAssertFalse(app.staticTexts["이 지표를 읽는 방법"].exists)
            XCTAssertTrue(element("taste-detail-periods").waitForExistence(timeout: 30), app.debugDescription)
            XCTAssertTrue(app.buttons["1개월"].firstMatch.exists)
            XCTAssertTrue(app.buttons["3개월"].firstMatch.exists)
            app.buttons["1개월"].firstMatch.tap()
            capture("card-detail-overview-" + category)
            let detailRow = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "taste-data-detail-row-")).firstMatch
            XCTAssertTrue(detailRow.waitForExistence(timeout: 30), app.debugDescription)
            XCTAssertFalse(app.staticTexts["관련 기록"].exists)
            XCTAssertFalse(element("taste-data-evidence-role").exists)
            let back = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "뒤로")).firstMatch
            XCTAssertTrue(back.isHittable, app.debugDescription); back.tap()
            XCTAssertTrue(element("taste-data-" + category).waitForExistence(timeout: 30), app.debugDescription)
            app.terminate()
        }
    }

    private func colorDifference(_ before: [Int], _ after: [Int]) -> Int {
        zip(before, after).map { abs($0 - $1) }.max() ?? 0
    }
    private func backgroundPixel(yFraction: CGFloat = 0.5) throws -> [Int] {
        let source = try XCTUnwrap(app.screenshot().image.cgImage)
        let pixel = try XCTUnwrap(source.cropping(to: CGRect(x: 4, y: (CGFloat(source.height) * yFraction).rounded(.down), width: 1, height: 1)))
        var rgba = [UInt8](repeating: 0, count: 4)
        let ok = rgba.withUnsafeMutableBytes { bytes -> Bool in
            guard let context = CGContext(data: bytes.baseAddress, width: 1, height: 1, bitsPerComponent: 8,
                                          bytesPerRow: 4, space: CGColorSpaceCreateDeviceRGB(),
                                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
            context.draw(pixel, in: CGRect(x: 0, y: 0, width: 1, height: 1))
            return true
        }
        XCTAssertTrue(ok)
        return Array(rgba.prefix(3)).map(Int.init)
    }

    func testLargeTextContextAndChangeRemainReadable() {
        for category in ["맥락", "변화"] {
            app.launchArguments = ["--gastronomy-qa", "--gastronomy-reduce-motion", "--gastronomy-category=" + category,
                                   "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            app.launch()
            XCTAssertTrue(element("taste-data-hero-" + category).waitForExistence(timeout: 120))
            capture("large-text-ring-" + category)
            let measurement = element(category == "맥락" ? "taste-data-card-context-foodKind" : "taste-data-card-change-experience")
            reveal(measurement)
            XCTAssertTrue(measurement.isHittable)
            capture("large-text-measurement-" + category)
            app.terminate()
        }
    }
    func testCategorySpecificMotionHeadersUseNativeDataAndCentralSummaries() {
        for category in ["경험", "감각", "취향", "맥락", "변화"] {
            app.launchArguments = ["--gastronomy-qa", "--gastronomy-reduce-motion", "--gastronomy-category=" + category]
            app.launch()
            let motion = element("taste-data-hero-" + category)
            XCTAssertTrue(motion.waitForExistence(timeout: 120), app.debugDescription)
            let ready = NSPredicate(format: "label CONTAINS %@", " · ")
            expectation(for: ready, evaluatedWith: motion)
            waitForExpectations(timeout: 120)
            XCTAssertFalse(motion.label.contains("집계 중"), motion.label)
            XCTAssertEqual(motion.value as? String, category + " 모션")
            XCTAssertGreaterThan(motion.frame.height, 200)
            capture("category-motion-connected-" + category)
            app.terminate()
        }
    }

}

/// Exercises modal navigation with isolated data; VoiceOver focus requires separate verification.
final class AppShellModalUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--shell-preview"]
        app.launch()
        XCTAssertTrue(app.buttons["메뉴 열기"].waitForExistence(timeout: 60), app.debugDescription)
    }

    private func expectExists(_ element: XCUIElement, _ exists: Bool) {
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == %@", NSNumber(value: exists)), object: element
        )
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 10), .completed, app.debugDescription)
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testSheetClosesAndRestoresBackgroundControls() {
        expectExists(app.buttons["홈"], true)
        app.buttons["메뉴 열기"].tap()
        expectExists(app.buttons["닫기"], true)
        XCTAssertTrue(app.buttons["닫기"].isHittable)
        capture("foundations-menu-modal")
        app.buttons["닫기"].tap()
        expectExists(app.buttons["메뉴 열기"], true)
        expectExists(app.buttons["홈"], true)
        XCTAssertTrue(app.buttons["메뉴 열기"].isHittable)
    }

    func testConfirmationCancelRestoresEditSheetThenHome() {
        app.buttons["프로필 확인 및 편집"].tap()
        expectExists(app.buttons["프로필 편집"], true)
        app.buttons["프로필 편집"].tap()
        expectExists(app.buttons["내 계정 삭제하기"], true)
        for _ in 0..<6 where !app.buttons["내 계정 삭제하기"].isHittable { app.swipeUp() }
        app.buttons["내 계정 삭제하기"].tap()
        expectExists(app.buttons["아니오"], true)
        XCTAssertTrue(app.buttons["아니오"].isHittable)
        capture("foundations-confirmation-modal")
        app.buttons["아니오"].tap()
        expectExists(app.buttons["프로필로 돌아가기"], true)
        expectExists(app.buttons["닫기"], true)
        XCTAssertTrue(app.buttons["프로필로 돌아가기"].isHittable)
        app.buttons["닫기"].tap()
        expectExists(app.buttons["홈"], true)
    }
}

final class ControlFeedbackUITests: XCTestCase {
    func testControlsKeepActionContractWithReduceMotionAndDisabledStates() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["--native-design-states-preview"]
        app.launch()
        let primary = app.buttons["native-feedback-primary"]
        XCTAssertTrue(primary.waitForExistence(timeout: 60), app.debugDescription)
        let count = app.staticTexts["native-feedback-action-count"]
        func expectCount(_ label: String) {
            let expectation = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", label), object: count)
            XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 5), .completed, app.debugDescription)
        }
        // The empty padded surface must be as tappable as the text.
        primary.coordinate(withNormalizedOffset: CGVector(dx: 0.08, dy: 0.5)).tap()
        expectCount("실행 1 · 안내 0")
        primary.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
            .press(forDuration: 0.15, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.98, dy: 0.95)))
        expectCount("실행 1 · 안내 0")
        for _ in 0..<4 where !app.switches["native-feedback-reduce-motion"].isHittable { app.swipeDown() }
        app.switches["native-feedback-reduce-motion"].tap()
        primary.tap()
        expectCount("실행 2 · 안내 0")
        app.buttons["native-feedback-explanation"].tap()
        expectCount("실행 2 · 안내 1")
        for id in ["native-feedback-disabled", "native-feedback-parent-disabled", "native-feedback-loading"] {
            XCTAssertTrue(app.buttons[id].exists, id)
            XCTAssertFalse(app.buttons[id].isEnabled, id)
        }
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "foundations-control-feedback-reduced-motion"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
