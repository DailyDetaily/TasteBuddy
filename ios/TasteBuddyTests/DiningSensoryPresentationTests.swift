import XCTest
@testable import TasteBuddy

final class DiningSensoryPresentationTests: XCTestCase {
    private func contract() throws -> SensoryNativeContract {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        return try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
    }

    private func entry(
        note: String = "", rating: Int = 5,
        status: DiningEntryFeedbackStatus = .completed,
        legacy: TasteBuddyAgentDiningAnalysisSnapshot? = nil
    ) -> DiningEntry {
        DiningEntry(restaurant: "기록한 식당", menu: "기록한 음식", date: Date(timeIntervalSince1970: 1_700_000_000), rating: rating, note: note, tasteExperienceIDs: [], detailTagIDs: [], dishKindIDs: ["broth"], reflectionPhotoFilename: "preserved-photo.jpg", tbaAnalysisSnapshot: legacy, feedbackStatus: status)
    }

    func testLegacyResultAndHighRatingCannotCreateSensoryTagsOrLiking() throws {
        let legacy = TasteBuddyAgentDiningAnalysisSnapshot(confidence: 0.99, detailTags: [], foodKnowledgeMatchIds: [], foodOnMatchIds: [], generatedAt: "old", lexiconCandidateIds: [], source: "old", subject: "old", summary: "사용하지 않을 과거 분석", tasteBubbles: [], tbaSignalIds: [], version: "tba-dining-analysis-v1")
        let meal = entry(legacy: legacy)
        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        let original = try encoder.encode(meal)
        let analysis = try SensoryAnalysisEngine.analyze(entries: [meal], contract: contract())
        let item = DiningDishFeedbackItem.fromDiningEntry(meal, analysis: analysis)
        XCTAssertNil(item.tbaAnalysisSnapshot)
        XCTAssertFalse(item.summary.contains(legacy.summary))
        XCTAssertTrue(item.detailTags.isEmpty)
        XCTAssertTrue(item.tasteBubbles.isEmpty)
        XCTAssertFalse(item.liked)
        XCTAssertEqual(item.reactionLabel, "감각 단서 기다리는 중")
        XCTAssertEqual(item.images.first?.localPhotoFilename, meal.reflectionPhotoFilename)
        XCTAssertEqual(try encoder.encode(meal), original, "표시 전환은 저장된 원본과 과거 호환 데이터를 변경하지 않는다")
        XCTAssertEqual(analysis.actualApiCalls, 0)
    }

    func testCurrentAnalysisUsesOnlyTheMatchingExperienceAndKeepsItsSource() throws {
        let meal = entry(note: "단맛이 좋았습니다.")
        let other = entry(note: "바삭함이 싫었습니다.")
        let analysis = try SensoryAnalysisEngine.analyze(entries: [meal, other], contract: contract())
        let item = DiningDishFeedbackItem.fromDiningEntry(meal, analysis: analysis)
        XCTAssertTrue(item.summary.contains(meal.note))
        XCTAssertFalse(item.summary.contains(other.note))
        XCTAssertEqual(item.detailTags.map(\.label), [meal.note])
        XCTAssertFalse(item.liked, "입맛 호감과 카드에 누른 좋아요를 혼동하지 않는다")
        XCTAssertNil(item.tbaAnalysisSnapshot)
    }

    func testCapturedAndProcessingRecordsDoNotReuseOldOrOtherAnalysis() throws {
        let completed = entry(note: "단맛이 좋았습니다.")
        let captured = entry(note: "단맛이 좋았습니다.", status: .captured)
        let analysis = try SensoryAnalysisEngine.analyze(entries: [completed], contract: contract())
        let pendingItem = DiningDishFeedbackItem.fromDiningEntry(completed, analysis: nil)
        XCTAssertEqual(pendingItem.reactionLabel, "해석 준비 중")
        XCTAssertTrue(pendingItem.detailTags.isEmpty)
        let capturedItem = DiningDishFeedbackItem.fromDiningEntry(captured, analysis: analysis)
        XCTAssertEqual(capturedItem.reactionLabel, "취향 기록 전")
        XCTAssertTrue(capturedItem.detailTags.isEmpty)
        XCTAssertEqual(capturedItem.images.first?.localPhotoFilename, captured.reflectionPhotoFilename)
    }

    func testUnclassifiedDetailIsNotPresentedAsAConfirmedSensoryTag() throws {
        let meal = entry(note: "향이 종이처럼 납작해서 좋았습니다.")
        let analysis = try SensoryAnalysisEngine.analyze(entries: [meal], contract: contract())
        let item = DiningDishFeedbackItem.fromDiningEntry(meal, analysis: analysis)
        XCTAssertTrue(analysis.observations.contains(where: \.isUnclassifiedDetail))
        XCTAssertEqual(item.reactionLabel, "표현 확인 중")
        XCTAssertTrue(item.detailTags.isEmpty)
        XCTAssertTrue(item.tasteBubbles.isEmpty)
    }

    func testStaticFeedExamplesDoNotRegenerateDeprecatedAnalysis() {
        for item in TasteBuddyNativeContent.followingDishFeedbackItems {
            XCTAssertNil(item.tbaAnalysisSnapshot)
            XCTAssertEqual(item.reactionLabel, "예시 기록")
            XCTAssertTrue(item.detailTags.isEmpty)
            XCTAssertTrue(item.tasteBubbles.isEmpty)
        }
        let converted = DiningDishFeedbackItem.fromTasteMatchFeedItem(TasteBuddyNativeContent.tasteMatchFeed[0])
        XCTAssertNil(converted.tbaAnalysisSnapshot)
        XCTAssertEqual(converted.reactionLabel, "예시 기록")
        XCTAssertFalse(converted.summary.contains("92%"))
    }
}
