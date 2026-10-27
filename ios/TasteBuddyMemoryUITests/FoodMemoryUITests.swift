import XCTest
import UIKit

/// Exercises the real search → original → correction route with the existing isolated fixture.
final class PlatingMemoryEditingUITests: XCTestCase {
    private var app: XCUIApplication!
    private let originalNote = "산미가 또렷했다. 전체적으로 별로였다."
    private let correctedNote = "산미는 좋았다. 생선의 향은 아쉬웠다."

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--food-memory-qa"]
    }

    private func text(_ value: String) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", value)).firstMatch
    }
    private func button(_ value: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", value)).firstMatch
    }
    private func reveal(_ element: XCUIElement) {
        let visible = app.frame.insetBy(dx: 0, dy: 160)
        for _ in 0..<18 {
            if element.exists && element.isHittable && visible.contains(CGPoint(x: element.frame.midX, y: element.frame.midY)) { return }
            app.swipeUp()
        }
        XCTFail("Could not reach \(element)\n\(app.debugDescription)")
    }
    private func replace(_ field: XCUIElement, with value: String) {
        XCTAssertTrue(field.waitForExistence(timeout: 30), app.debugDescription)
        field.tap()
        // These fixtures fit inside the editing viewport. Explicitly tap the
        // trailing empty area to put the insertion point AFTER the original.
        // Cmd+A is not a select-all contract on the iPhone software keyboard.
        // Reopening TextEditor and tapping its center can put the caret first.
        field.coordinate(withNormalizedOffset: CGVector(
            dx: 0.95, dy: field.elementType == .textView ? 0.85 : 0.5
        )).tap()
        let previous = field.value as? String ?? ""
        if !previous.isEmpty {
            field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: previous.count))
        }
        if field.elementType == .textView {
            XCTAssertEqual(field.value as? String, "", "Existing note must be cleared before typing")
        }
        field.typeText(value)
        XCTAssertEqual(field.value as? String, value, "The test must enter exactly the intended replacement")
    }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
    private func openCorrection() {
        app.launch()
        XCTAssertTrue(text("평가 필터 8개").waitForExistence(timeout: 120), app.debugDescription)
        replace(app.textFields.firstMatch, with: "세비체")
        XCTAssertTrue(text("평가 필터 1개").waitForExistence(timeout: 30))
        let record = button("세비체"); reveal(record); record.tap()
        XCTAssertTrue(text(originalNote).waitForExistence(timeout: 30))
        button("기록 옵션").tap()
        let edit = button("메모 수정")
        XCTAssertTrue(edit.waitForExistence(timeout: 10))
        XCTAssertGreaterThanOrEqual(edit.frame.height, 44)
        capture("plating-edit-01-action-group")
        edit.tap()
        XCTAssertTrue(app.textViews["추가 메모"].waitForExistence(timeout: 30))
    }

    func testUnchangedCancelThenDirtyContinueDiscardAndSave() {
        openCorrection()
        XCTAssertFalse(app.buttons["저장하기"].isEnabled)
        capture("plating-edit-02-unchanged")
        app.buttons["취소하기"].tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 30))
        XCTAssertEqual(app.alerts.count, 0)
        button("기록 옵션").tap()
        let edit = button("메모 수정")
        XCTAssertTrue(edit.waitForExistence(timeout: 10)); edit.tap()
        replace(app.textViews["추가 메모"], with: correctedNote)
        XCTAssertTrue(app.buttons["저장하기"].isEnabled)
        capture("plating-edit-03-keyboard")
        app.buttons["취소하기"].tap()
        let discard = app.alerts["변경 내용을 버릴까요?"]
        XCTAssertTrue(discard.waitForExistence(timeout: 10))
        capture("plating-edit-04-discard-confirmation")
        discard.buttons["계속 수정"].tap()
        XCTAssertEqual(app.textViews["추가 메모"].value as? String, correctedNote)
        app.buttons["취소하기"].tap()
        discard.buttons["변경 내용 버리기"].tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 30))
        XCTAssertTrue(text(originalNote).exists)
        button("기록 옵션").tap()
        XCTAssertTrue(edit.waitForExistence(timeout: 10)); edit.tap()
        XCTAssertTrue(app.textViews["추가 메모"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.textViews["추가 메모"].value as? String, originalNote)
        replace(app.textViews["추가 메모"], with: correctedNote)
        app.buttons["저장하기"].tap()
        XCTAssertTrue(text(correctedNote).waitForExistence(timeout: 30))
        capture("plating-edit-05-saved-original")
    }

    func testLargeTextEditorAndCancelRemainReachable() {
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", UIContentSizeCategory.accessibilityExtraExtraExtraLarge.rawValue]
        openCorrection()
        let editor = app.textViews["추가 메모"]
        XCTAssertGreaterThan(editor.frame.height, 180)
        XCTAssertLessThanOrEqual(editor.frame.maxX, app.frame.maxX)
        XCTAssertTrue(app.buttons["취소하기"].isHittable)
        capture("plating-edit-06-large-text")
        app.buttons["취소하기"].tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 30))
    }
}

/// 실제 SwiftUI 화면을 합성 R1–R9로 구동한다. 사용자 계정이나 사진을 사용하지 않는다.
final class FoodMemoryUITests: XCTestCase {
    private let correction = "산미는 좋았다. 싫었던 것은 생선 비린 향이었다. 앞의 ‘별로였다’는 전체 평가다."
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--food-memory-qa"]
    }

    private func text(_ fragment: String) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", fragment)).firstMatch
    }
    private func button(_ fragment: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", fragment)).firstMatch
    }
    private func reveal(_ element: XCUIElement) {
        for _ in 0..<10 where !element.isHittable { app.swipeUp() }
        XCTAssertTrue(element.isHittable, app.debugDescription)
    }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    private func replace(_ element: XCUIElement, with value: String) {
        XCTAssertTrue(element.waitForExistence(timeout: 30), app.debugDescription)
        element.tap()
        let old = element.value as? String ?? ""
        element.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: old.count) + value)
    }

    func testSearchComparisonCorrectionUndoRedoAndDeletion() throws {
        app.launch()
        XCTAssertTrue(text("평가 필터 8개").waitForExistence(timeout: 120), app.debugDescription)
        capture("memory-01-search-all")
        button("모든 기록").tap()
        app.buttons["음식 전체가 좋았던"].firstMatch.tap()
        XCTAssertTrue(text("평가 필터 3개").waitForExistence(timeout: 30), app.debugDescription)
        capture("memory-02-whole-positive")
        button("이 검색 범위의 경험 비교").tap()
        XCTAssertTrue(text("기록 8개").waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(text("서로 다른 반응: 산미").exists)
        capture("memory-03-comparison-with-counterexample")
        app.navigationBars["경험 비교"].buttons["닫기"].tap()
        button("음식 전체가 좋았던").tap()
        app.buttons["모든 기록"].firstMatch.tap()
        replace(app.textFields.firstMatch, with: "세비체")
        XCTAssertTrue(text("평가 필터 1개").waitForExistence(timeout: 30), app.debugDescription)
        let record = button("세비체")
        reveal(record); record.tap()
        XCTAssertTrue(text("산미가 또렷했다. 전체적으로 별로였다.").waitForExistence(timeout: 30))
        capture("memory-04-original-uncertain-meal-date")
        button("기록 옵션").tap()
        let edit = button("메모 수정")
        XCTAssertTrue(edit.waitForExistence(timeout: 10)); edit.tap()
        replace(app.textViews.firstMatch, with: correction)
        app.buttons["저장하기"].tap()
        XCTAssertTrue(text(correction).waitForExistence(timeout: 30))
        button("기록 옵션").tap()
        button("수정 이력").tap()
        let undo = button("이전 수정 되돌리기")
        reveal(undo); capture("memory-05-correction-provenance")
        undo.tap()
        XCTAssertTrue(text("수정을 되돌렸어요.").waitForExistence(timeout: 30))
        app.buttons["뒤로"].firstMatch.tap()
        XCTAssertTrue(text("산미가 또렷했다. 전체적으로 별로였다.").waitForExistence(timeout: 30))
        button("기록 옵션").tap()
        button("수정 이력").tap()
        reveal(undo); undo.tap()
        app.buttons["뒤로"].firstMatch.tap()
        XCTAssertTrue(text(correction).waitForExistence(timeout: 30))
        button("기록 옵션").tap()
        button("기록 삭제").tap()
        app.alerts.buttons["삭제"].tap()
        XCTAssertTrue(text("삭제되었거나 현재 계정에서 볼 수 없는 기록").waitForExistence(timeout: 30))
        capture("memory-06-deleted-detail")
        app.buttons["뒤로"].tap()
        XCTAssertTrue(text("전체 8개 조회").waitForExistence(timeout: 30))
        XCTAssertTrue(text("평가 필터 0개").exists)
        capture("memory-07-deleted-search")
    }

    func testLargeContentSizeHasAccessibleSearchAndOriginalActions() throws {
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", UIContentSizeCategory.accessibilityExtraExtraExtraLarge.rawValue]
        app.launch()
        XCTAssertTrue(text("평가 필터 8개").waitForExistence(timeout: 120), app.debugDescription)
        XCTAssertTrue(app.textFields.firstMatch.isHittable)
        capture("memory-08-large-content-size")
        let record = button("크림 파스타")
        reveal(record); record.tap()
        button("기록 옵션").tap()
        let edit = app.sheets.buttons["메모 수정"]
        XCTAssertTrue(edit.waitForExistence(timeout: 10))
        XCTAssertFalse(edit.label.isEmpty)
        capture("memory-09-large-detail-actions")
    }
}

/// 홈/나의 입맛 실화면 검증. 기존 합성 자료 + 명시적으로 확인한 날짜 변형만 사용한다.
final class HomeTasteQuestionUITests: XCTestCase {
    private var app: XCUIApplication!
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--sensory-insights-home-qa", "--home-questions-confirmed-dates-qa", "--question-queue-expanded-qa"]
    }
    private func reveal(_ element: XCUIElement, verticalInset: CGFloat = 180) {
        // SwiftUI는 스크롤 밖의 버튼도 hittable로 보고할 수 있다.
        // 고정 헤더와 하단 탭을 피해 실제 화면 안에 중심을 옮긴 뒤 누른다.
        let visible = app.frame.insetBy(dx: 0, dy: verticalInset)
        for _ in 0..<24 {
            guard element.exists else { app.swipeUp(); continue }
            let frame = element.frame
            if visible.contains(CGPoint(x: frame.midX, y: frame.midY)) && element.isHittable { return }
            let limit = app.frame.height / 4
            let distance = min(max(frame.midY - visible.midY, -limit), limit)
            let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5))
            start.press(forDuration: 0.05,
                        thenDragTo: start.withOffset(CGVector(dx: 0, dy: -distance)),
                        withVelocity: .slow, thenHoldForDuration: 0.2)
        }
        XCTFail("고정 UI 안쪽으로 요소를 스크롤하지 못했어요: \(element)")
    }
    private func text(_ fragment: String) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", fragment)).firstMatch
    }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
    func test01QuestionScopeAnswerUndoAndChartCategoryOriginal() throws {
        app.launch()
        let toggle = app.buttons["taste-question-toggle"].firstMatch
        XCTAssertTrue(toggle.waitForExistence(timeout: 120), app.debugDescription)
        reveal(toggle); toggle.tap()
        XCTAssertTrue(text("국물").exists)
        XCTAssertTrue(text("먹는 동안").exists)
        let answer = app.buttons["taste-question-choice-medium"].firstMatch
        reveal(answer); capture("home-question-01-scope")
        XCTAssertFalse(app.buttons["원래 기록 보기/수정"].exists)
        XCTAssertFalse(app.buttons["기억이 안 나요"].exists)
        XCTAssertFalse(app.buttons["나중에"].exists)
        XCTAssertFalse(app.buttons["이 질문은 그만 보기"].exists)
        answer.tap()
        // 3.5초 토스트 안에서 연속 AX 조회 대신 실제 확인한 버튼 중심을 즉시 누른다.
        let undoFrame = app.buttons["취소"].firstMatch.frame
        XCTAssertFalse(undoFrame.isEmpty)
        app.coordinate(withNormalizedOffset: .zero)
            .withOffset(CGVector(dx: undoFrame.midX, dy: undoFrame.midY)).tap()
        XCTAssertTrue(app.buttons["taste-question-toggle"].firstMatch.waitForExistence(timeout: 30))
        let metric = app.buttons["home-archive-metric-overall"]
        reveal(metric); capture("home-question-02-four-charts")
        metric.tap()
        XCTAssertTrue(app.navigationBars["음식 전체 평가"].waitForExistence(timeout: 30))
        let category = app.buttons["archive-segment-veryLiked"]
        reveal(category); category.tap()
        XCTAssertTrue(text("필터:").exists)
        capture("home-question-03-category")
        let record = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "중간 산미의 국물")).firstMatch
        reveal(record); record.tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 30))
        XCTAssertTrue(text("식사일").exists)
        capture("home-question-04-current-original")
    }
    func test03AnalysisRadarMissingAxesAndMatrixOriginal() throws {
        app.launchArguments = ["--sensory-insights-qa", "--home-questions-confirmed-dates-qa"]
        app.launch()
        let radar = app.otherElements["여섯 가지 미각 축을 보여주는 미각 반응 차트"].firstMatch
        XCTAssertTrue(radar.waitForExistence(timeout: 120), app.debugDescription)
        let radarTitle = text("감각 패턴")
        reveal(radarTitle)
        if radarTitle.exists && radarTitle.frame.minY > 180 {
            let origin = app.coordinate(withNormalizedOffset: .zero)
            origin.withOffset(CGVector(dx: app.frame.width * 0.9, dy: radarTitle.frame.minY))
                .press(forDuration: 0.1, thenDragTo: origin.withOffset(CGVector(dx: app.frame.width * 0.9, dy: 160)))
        }
        let radarSummary = radar.value as? String ?? ""
        XCTAssertTrue(radarSummary.contains("단맛 기록 없음"), radarSummary)
        XCTAssertTrue(radarSummary.contains("신맛 강도 3"), radarSummary)
        capture("analysis-question-01-radar")
        let candidate = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH %@", "taste-candidate-")).firstMatch
        reveal(candidate); candidate.tap()
        let cell = app.buttons["taste-matrix-strong:negative"]
        XCTAssertTrue(cell.waitForExistence(timeout: 30), app.debugDescription)
        reveal(cell)
        XCTAssertTrue(cell.label.contains("3개"), cell.label)
        capture("analysis-question-02-matrix")
        cell.tap()
        XCTAssertTrue(text("진한 산미의 국물").waitForExistence(timeout: 30), app.debugDescription)
        capture("analysis-question-03-matrix-evidence")
        // 중첩 시트 뒤의 같은 이름 메뉴 대신 가장 위에 열린 근거 시트의 메뉴를 선택한다.
        let originals = try XCTUnwrap(app.buttons.matching(NSPredicate(format: "label == %@", "원본 열기·수정")).allElementsBoundByIndex.last)
        reveal(originals)
        XCTAssertGreaterThanOrEqual(originals.frame.height, 44)
        originals.tap()
        let original = app.buttons.matching(NSPredicate(format: "identifier == %@ OR (label CONTAINS %@ AND label CONTAINS %@)",
            "open-food-memory-c0000000-0000-0000-0000-000000000004", "진한 산미의 국물", "2026년 9월 7일")).firstMatch
        XCTAssertTrue(original.waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertTrue(original.label.contains("2026년 9월 7일"), original.label)
        original.tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 30), app.debugDescription)
        capture("analysis-question-04-current-original")
    }
    func test02LargeTypeQuestionAndMetricActionsRemainReachable() throws {
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", UIContentSizeCategory.accessibilityExtraExtraExtraLarge.rawValue]
        app.launch()
        let toggle = app.buttons["taste-question-toggle"].firstMatch
        XCTAssertTrue(toggle.waitForExistence(timeout: 120))
        let tasteTab = app.buttons["나의 입맛"].firstMatch
        XCTAssertTrue(tasteTab.isHittable)
        XCTAssertLessThan(tasteTab.frame.height, 100, "하단 탭 문구가 세로로 길어져 본문을 가리지 않아야 한다")
        reveal(toggle); toggle.tap()
        let answer = app.buttons["taste-question-choice-medium"].firstMatch
        reveal(answer); capture("home-question-large-01-actions")
        XCTAssertGreaterThanOrEqual(answer.frame.height, 44)
        XCTAssertFalse(app.buttons["나중에"].exists)
        answer.tap()
        XCTAssertTrue(text("이 식사에 답변을 기록했어요").waitForExistence(timeout: 30))
        let metric = app.buttons["home-archive-metric-meals"]
        reveal(metric); capture("home-question-large-02-chart")
        metric.tap()
        XCTAssertTrue(app.navigationBars["기록한 식사"].waitForExistence(timeout: 30))
        let unknown = app.buttons["archive-segment-unknown"]
        reveal(unknown); unknown.tap()
        XCTAssertTrue(app.buttons["필터 해제"].exists)
        capture("home-question-large-03-zero-category")
    }

    func test04HomeStackKeepsEveryRemainingQuestionInAllCards() throws {
        app.launchArguments += ["--question-batch-qa"]
        app.launch()
        let allCards = app.buttons["taste-questions-see-all"]
        XCTAssertTrue(allCards.waitForExistence(timeout: 120))
        reveal(allCards); allCards.tap()
        XCTAssertTrue(app.navigationBars["질문과 발견 카드"].waitForExistence(timeout: 30))
        let laterQuestion = app.buttons.matching(NSPredicate(format:
            "identifier == %@ AND label CONTAINS %@", "taste-question-toggle", "검증 메뉴 4")).firstMatch
        reveal(laterQuestion)
        XCTAssertTrue(laterQuestion.isHittable)
        XCTAssertFalse(app.buttons["다른 확인할 기록 보기"].exists)
        XCTAssertFalse(text("이번에 보여드린 질문에 답변을 기록했어요").exists)
        capture("home-all-remaining-questions")
    }

    func test08DiscoverySharesTheQuestionStackAndOpensOnlyItsOriginals() throws {
        app.launchArguments.removeAll { $0 == "--question-queue-expanded-qa" }
        app.launch()
        let discovery = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "home-discovery-open-")).firstMatch
        XCTAssertTrue(discovery.waitForExistence(timeout: 120))
        XCTAssertFalse(app.buttons["taste-question-toggle"].firstMatch.exists)
        let stack = app.buttons["taste-question-stack-toggle"].firstMatch
        reveal(stack); capture("home-discovery-01-collapsed"); stack.tap()
        XCTAssertTrue(app.buttons["taste-question-toggle"].firstMatch.waitForExistence(timeout: 10))
        reveal(discovery); capture("home-discovery-02-shared-stack"); discovery.tap()
        XCTAssertTrue(app.navigationBars["발견 카드"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.staticTexts["home-discovery-detail-title"].exists)
        XCTAssertTrue(text("연결된 음식 기록").exists)
        XCTAssertFalse(app.buttons["taste-question-choice-liked"].exists)
        let original = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "원본 열기 · 수정")).firstMatch
        reveal(original); capture("home-discovery-03-originals"); original.tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 30))
        capture("home-discovery-04-food-memory")
    }

    func test05LegacyQuestionsRemainOnHomeAfterOneAnswer() throws {
        app.launchArguments += ["--question-legacy-qa"]
        app.launch()
        let toggle = app.buttons["taste-question-toggle"].firstMatch
        XCTAssertTrue(toggle.waitForExistence(timeout: 120))
        reveal(toggle); toggle.tap()
        let answer = app.buttons["taste-question-choice-liked"].firstMatch
        reveal(answer)
        XCTAssertTrue(app.buttons["taste-question-choice-neutral"].firstMatch.exists)
        XCTAssertTrue(app.buttons["taste-question-choice-disliked"].firstMatch.exists)
        XCTAssertFalse(app.buttons["원래 기록 보기/수정"].exists)
        capture("legacy-home-inline-choices")
        answer.tap()
        XCTAssertTrue(text("이 식사에 답변을 기록했어요").waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["원래 기록 보기/수정"].exists)
        XCTAssertFalse(text("서로 다른 응답을 확인하고").exists)
        XCTAssertGreaterThan(app.buttons.matching(identifier: "taste-question-toggle").count, 1)
    }

    func test06AnalysisLegacyQuestionHasInlineChoices() throws {
        app.launchArguments = ["--sensory-insights-qa", "--question-legacy-qa"]
        app.launch()
        let toggle = app.buttons["taste-question-toggle"].firstMatch
        XCTAssertTrue(toggle.waitForExistence(timeout: 120))
        reveal(toggle); toggle.tap()
        let answer = app.buttons["taste-question-choice-neutral"].firstMatch
        reveal(answer)
        XCTAssertFalse(app.buttons["원래 기록 보기/수정"].exists)
        capture("legacy-analysis-inline-choices")
        answer.tap()
        XCTAssertTrue(text("이 식사에 답변을 기록했어요").waitForExistence(timeout: 10))
    }

    func test07HomeShowsAllThenLeavesQuestionAreaEmptyWhenFinished() throws {
        app.launchArguments += ["--question-finish-qa", "--question-stack-expanded-qa"]
        app.launch()
        let questions = app.buttons.matching(identifier: "taste-question-toggle")
        XCTAssertTrue(questions.firstMatch.waitForExistence(timeout: 120))
        waitForQuestionCount(2)
        XCTAssertTrue(app.otherElements["home-taste-questions"].exists)
        let liking = app.buttons["taste-question-choice-liked"].firstMatch
        let intensity = app.buttons["taste-question-choice-medium"].firstMatch
        reveal(liking); capture("home-two-remaining-questions")
        liking.tap()
        waitForQuestionCount(1)
        reveal(intensity); intensity.tap()
        waitForQuestionCount(0)
        XCTAssertFalse(app.otherElements["home-taste-questions"].exists)
        XCTAssertFalse(text("이번에 보여드린 질문에 답변을 기록했어요").exists)
        XCTAssertFalse(text("지금 확인할 질문이 없어요").exists)
        capture("home-question-area-empty")
    }

    private func waitForQuestionCount(_ expected: Int, timeout: TimeInterval = 30) {
        let deadline = Date().addingTimeInterval(timeout)
        repeat {
            if app.buttons.matching(identifier: "taste-question-toggle").count == expected { return }
            RunLoop.current.run(until: Date().addingTimeInterval(0.2))
        } while Date() < deadline
        XCTFail("남은 질문 수가 \(expected)개가 되지 않았어요")
    }
}

final class FoodMemoryDetailRedesignUITests: XCTestCase {
    func testStarRatingHalfStepsLoweringDoubleTapClearAndReentry() {
        continueAfterFailure = false
        let app = makeApp()
        app.launch()
        let rating = app.descendants(matching: .any)["food-memory-rating"].firstMatch
        XCTAssertTrue(rating.waitForExistence(timeout: 60), app.debugDescription)
        func expect(_ value: String) {
            let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", value), object: rating)
            XCTAssertEqual(XCTWaiter.wait(for: [changed], timeout: 5), .completed, app.debugDescription)
        }
        func tap(_ star: Int) {
            rating.coordinate(withNormalizedOffset: CGVector(dx: (Double(star) - 0.5) / 5, dy: 0.5)).tap()
        }
        expect("5점 중 4점")
        tap(3); expect("5점 중 3점")
        tap(3); expect("5점 중 2.5점")
        tap(3); expect("5점 중 3점")
        tap(5); expect("5점 중 4.5점")
        tap(5); expect("5점 중 5점")
        tap(5); expect("5점 중 4.5점")
        app.buttons["뒤로"].firstMatch.tap()
        app.staticTexts["버터 파스타"].firstMatch.tap()
        XCTAssertTrue(rating.waitForExistence(timeout: 10))
        expect("5점 중 4.5점")
        rating.doubleTap()
        expect("평가 없음")
        tap(1); expect("5점 중 0.5점")
        tap(1); expect("5점 중 1점")
    }

    private func makeApp(empty: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--food-memory-detail-qa"]
        if empty { app.launchArguments.append("--food-memory-detail-empty-qa") }
        return app
    }

    func testStagedOptionsCardsAreAtTheBottomAndOpenCorrections() {
        continueAfterFailure = false
        let app = makeApp()
        app.launch()
        XCTAssertTrue(app.staticTexts["버터 파스타"].waitForExistence(timeout: 60), app.debugDescription)
        XCTAssertTrue(app.staticTexts["1 / 2"].waitForExistence(timeout: 20))
        XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "현재 원본 수정")).firstMatch.exists)
        XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "미응답")).firstMatch.exists)
        let photos = app.otherElements["food-memory-photos"]
        XCTAssertTrue(photos.exists, app.debugDescription)
        photos.swipeLeft()
        XCTAssertTrue(app.staticTexts["2 / 2"].waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertFalse(app.staticTexts["시트러스와 배"].exists)
        XCTAssertTrue(app.staticTexts["버터 파스타"].exists)
        photos.swipeRight()
        XCTAssertTrue(app.staticTexts["1 / 2"].waitForExistence(timeout: 10))
        app.buttons["기록 옵션"].tap()
        let options = app.descendants(matching: .any)["food-memory-options-sheet"].firstMatch
        XCTAssertTrue(options.waitForExistence(timeout: 10))
        XCTAssertGreaterThan(options.buttons["닫기"].frame.minY, app.frame.minY + 40)
        XCTAssertGreaterThanOrEqual(options.frame.maxY, app.frame.maxY - 50)
        options.buttons["메모 수정"].tap()
        let note = app.textViews["추가 메모"]
        XCTAssertTrue(note.waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertEqual(note.value as? String, "버터 향이 진하고 소스가 면에 부드럽게 감겼다. 끝에 남는 고소한 여운이 좋았다.")
        XCTAssertFalse(app.buttons["저장하기"].isEnabled)
        app.buttons["취소하기"].tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 10))
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "food-memory-redesign-carousel"; attachment.lifetime = .keepAlways; add(attachment)
    }

    func testExistingNoteCanBeEditedSavedReopenedAndDiscarded() {
        continueAfterFailure = false
        let app = makeApp()
        app.launch()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 60))
        let original = "버터 향이 진하고 소스가 면에 부드럽게 감겼다. 끝에 남는 고소한 여운이 좋았다."
        func openNote() -> XCUIElement {
            app.buttons["기록 옵션"].tap()
            let option = app.buttons["메모 수정"]
            XCTAssertTrue(option.waitForExistence(timeout: 10))
            option.tap()
            let note = app.textViews["추가 메모"]
            XCTAssertTrue(note.waitForExistence(timeout: 10), app.debugDescription)
            return note
        }
        let note = openNote()
        XCTAssertEqual(note.value as? String, original)
        note.tap()
        note.typeText("\nMemo edit QA")
        let savedText = note.value as? String
        XCTAssertNotEqual(savedText, original)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "existing-note-editor"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.buttons["저장하기"].tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 10))
        let reopened = openNote()
        XCTAssertEqual(reopened.value as? String, savedText)
        reopened.tap()
        reopened.typeText("Discard this draft")
        app.buttons["취소하기"].tap()
        let discard = app.alerts["변경 내용을 버릴까요?"].buttons["변경 내용 버리기"]
        XCTAssertTrue(discard.waitForExistence(timeout: 5))
        discard.tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 10))
        XCTAssertEqual(openNote().value as? String, savedText)
        app.buttons["취소하기"].tap()
    }

    func testRecordOptionsEditMetadataTogether() {
        continueAfterFailure = false
        let app = makeApp()
        app.launchArguments.append("--food-memory-context-qa")
        app.launch()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 60))
        func openInfo() {
            app.buttons["기록 옵션"].tap()
            let option = app.buttons["기록 정보 수정"]
            XCTAssertTrue(option.waitForExistence(timeout: 10), app.debugDescription)
            XCTAssertFalse(app.buttons["음식 출처 수정"].exists)
            XCTAssertFalse(app.buttons["날짜 수정"].exists)
            XCTAssertFalse(app.buttons["식당 수정"].exists)
            option.tap()
            XCTAssertTrue(app.navigationBars["기록 정보 수정"].waitForExistence(timeout: 10))
            XCTAssertFalse(app.buttons["dining-food-source-picker"].exists)
            XCTAssertFalse(app.staticTexts["음식 출처 · 선택 사항"].exists)
        }
        openInfo()
        XCTAssertFalse(app.navigationBars["기록 정보 수정"].buttons["저장"].isEnabled)
        app.buttons["dining-meal-date-card"].tap()
        XCTAssertTrue(app.navigationBars["식사일 선택"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.pickerWheels.element(boundBy: 2).value as? String, "4일")
        app.pickerWheels.element(boundBy: 2).adjust(toPickerWheelValue: "5일")
        app.navigationBars["식사일 선택"].buttons["적용"].tap()
        XCTAssertTrue(app.navigationBars["기록 정보 수정"].waitForExistence(timeout: 10))
        app.buttons["dining-restaurant-card"].tap()
        XCTAssertTrue(app.navigationBars["식당 선택"].waitForExistence(timeout: 10))
        let search = app.textFields["연결할 식당 검색"]
        search.tap()
        search.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 2))
        let restaurant = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "검증 식당 · B 지점")).firstMatch
        XCTAssertTrue(restaurant.waitForExistence(timeout: 10), app.debugDescription)
        restaurant.tap()
        XCTAssertTrue(app.navigationBars["기록 정보 수정"].waitForExistence(timeout: 10))
        let summary = XCTAttachment(screenshot: app.screenshot())
        summary.name = "integrated-record-info"; summary.lifetime = .keepAlways; add(summary)
        app.navigationBars["기록 정보 수정"].buttons["저장"].tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 10))
        openInfo()
        app.buttons["dining-meal-date-card"].tap()
        XCTAssertTrue(app.navigationBars["식사일 선택"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.pickerWheels.element(boundBy: 2).value as? String, "5일")
        app.navigationBars["식사일 선택"].buttons["취소"].tap()
        XCTAssertTrue(app.navigationBars["기록 정보 수정"].waitForExistence(timeout: 10))
        app.buttons["dining-restaurant-card"].tap()
        XCTAssertTrue(app.navigationBars["식당 선택"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.textFields["연결할 식당 검색"].value as? String, "검증 식당 · B 지점")
        app.navigationBars["식당 선택"].buttons["취소"].tap()
        XCTAssertTrue(app.navigationBars["기록 정보 수정"].waitForExistence(timeout: 10))
        app.navigationBars["기록 정보 수정"].buttons["취소"].tap()
        XCTAssertTrue(app.buttons["기록 옵션"].waitForExistence(timeout: 10))
    }

    func testStagedOptionsCardsOpenPhotoManagementAndKeepTheFoodRecord() {
        continueAfterFailure = false
        let app = makeApp()
        app.launch()
        XCTAssertTrue(app.staticTexts["1 / 2"].waitForExistence(timeout: 60))
        app.buttons["기록 옵션"].tap()
        let options = app.descendants(matching: .any)["food-memory-options-sheet"].firstMatch
        XCTAssertTrue(options.waitForExistence(timeout: 10))
        options.buttons["사진 관리"].tap()
        XCTAssertTrue(app.buttons["사진 1 삭제"].waitForExistence(timeout: 10))
        app.buttons["사진 1 삭제"].tap()
        app.alerts["이 사진을 삭제할까요?"].buttons["삭제"].tap()
        XCTAssertTrue(app.buttons["사진 1 삭제"].exists)
        XCTAssertFalse(app.buttons["사진 2 삭제"].exists)
        app.buttons["뒤로"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["버터 파스타"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["1 / 2"].exists)
        XCTAssertFalse(app.staticTexts["1 / 1"].exists)
        XCTAssertEqual(app.descendants(matching: .any)["food-memory-rating"].firstMatch.value as? String, "5점 중 4점")
    }

    func testEmptyFoodRecordStagedOptionsCanOpenDeleteConfirmation() {
        continueAfterFailure = false
        let app = makeApp(empty: true)
        app.launch()
        XCTAssertTrue(app.staticTexts["버터 파스타"].waitForExistence(timeout: 60))
        XCTAssertTrue(app.buttons["사진 추가"].exists)
        XCTAssertFalse(app.staticTexts["1 / 1"].exists)
        XCTAssertFalse(app.staticTexts["기억에 남은 맛"].exists)
        XCTAssertFalse(app.staticTexts["좋았어요"].exists)
        XCTAssertFalse(app.staticTexts["메모"].exists)
        app.buttons["기록 옵션"].tap()
        let options = app.descendants(matching: .any)["food-memory-options-sheet"].firstMatch
        XCTAssertTrue(options.waitForExistence(timeout: 10))
        options.buttons["기록 삭제"].tap()
        XCTAssertTrue(app.alerts["이 기록을 삭제할까요?"].waitForExistence(timeout: 10))
        app.alerts.buttons["취소"].tap()
        XCTAssertTrue(app.staticTexts["버터 파스타"].exists)
    }
}
