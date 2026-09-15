import XCTest
import UIKit

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
        let edit = button("회고·식사 시점 바로잡기")
        reveal(edit); edit.tap()
        replace(app.textViews.firstMatch, with: correction)
        app.navigationBars["기록 바로잡기"].buttons["저장"].tap()
        XCTAssertTrue(text(correction).waitForExistence(timeout: 30))
        let undo = button("이전 수정 되돌리기")
        reveal(undo); capture("memory-05-correction-provenance")
        undo.tap()
        XCTAssertTrue(text("현재 회고: 산미가 또렷했다. 전체적으로 별로였다.").waitForExistence(timeout: 30))
        reveal(undo); undo.tap()
        XCTAssertTrue(text("현재 회고: " + correction).waitForExistence(timeout: 30))
        let delete = button("내가 먹은 기록이 아님 · 삭제")
        reveal(delete); delete.tap()
        app.alerts.buttons["삭제"].tap()
        XCTAssertTrue(text("삭제되었거나 현재 계정에서 볼 수 없는 기록").waitForExistence(timeout: 30))
        capture("memory-06-deleted-detail")
        app.navigationBars["음식 기억"].buttons["닫기"].tap()
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
        let edit = button("회고·식사 시점 바로잡기")
        reveal(edit)
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
        XCTAssertTrue(app.navigationBars["음식 기억"].waitForExistence(timeout: 30))
        XCTAssertTrue(text("식사일").exists)
        capture("home-question-04-current-original")
    }
    func test03AnalysisRadarMissingAxesAndMatrixOriginal() throws {
        app.launchArguments = ["--sensory-insights-qa", "--home-questions-confirmed-dates-qa"]
        app.launch()
        let radar = app.otherElements["여섯 가지 미각 축을 보여주는 미각 반응 차트"].firstMatch
        XCTAssertTrue(radar.waitForExistence(timeout: 120), app.debugDescription)
        let radarTitle = text("맛을 느끼는 경향")
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
        XCTAssertTrue(app.navigationBars["음식 기억"].waitForExistence(timeout: 30), app.debugDescription)
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
        XCTAssertTrue(app.navigationBars["음식 기억"].waitForExistence(timeout: 30))
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
