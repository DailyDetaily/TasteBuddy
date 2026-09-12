import XCTest
@testable import TasteBuddy

final class ChatGPTAnalysisConnectionTests: XCTestCase {
    func testConnectionOnlyAcceptsConfiguredChatGPTPluginURLsWithoutUserData() {
        XCTAssertNotNil(ChatGPTAnalysisConfiguration.from(value: "https://chatgpt.com/plugins/tastebuddy"))
        for value in ["$(TB_CHATGPT_ENTRY_URL)", "https://chatgpt.com", "https://example.com/plugins/tastebuddy",
                      "http://chatgpt.com/plugins/tastebuddy", "https://chatgpt.com/plugins/tastebuddy?q=private",
                      "https://user@chatgpt.com/plugins/tastebuddy"] {
            XCTAssertNil(ChatGPTAnalysisConfiguration.from(value: value))
        }
    }

    func testExportPreservesWholeRecentExperiencesAndExcludesGeneratedInsights() throws {
        let observations = (0..<25).flatMap { index -> [SensoryObservation] in
            let id = UUID()
            return ["intensity", "preference"].map { kind in
                SensoryObservation(id: "\(index)-\(kind)", experienceID: id, foodName: "기록한 음식",
                    recordedAt: Date(timeIntervalSince1970: Double(index)), sourceField: "note",
                    kind: kind, attribute: "taste.sour", attributeLabel: "산미", value: .text("강함"),
                    scale: "test", target: "food", phase: "finish", phrase: "신맛이 강해서 좋았어요",
                    sourceSpans: [], reference: nil, combinationComponents: [])
            }
        }
        let snapshot = SensoryAnalysisSnapshot(engineVersion: "test", observations: observations, unresolved: [],
            insights: [.init(id: "generated", kind: "test", attribute: nil, title: "생성한 해석", body: "원문 아님", evidenceIDs: [], experienceIDs: [])],
            mainWing: .empty, completedExperienceCount: 25, sourceExperienceCount: 25, actualApiCalls: 0,
            needsMeaningReview: false, limits: [])
        let payload = ChatGPTAnalysisExport(snapshot: snapshot, now: Date(timeIntervalSince1970: 100))
        XCTAssertEqual(payload.totalExperienceCount, 25)
        XCTAssertEqual(payload.includedExperienceCount, 20)
        XCTAssertEqual(payload.observations.count, 40)
        XCTAssertFalse(payload.observations.contains { $0.id.hasPrefix("0-") })
        XCTAssertTrue(payload.observations.contains { $0.id == "24-preference" })
        let json = try XCTUnwrap(String(data: JSONEncoder().encode(payload), encoding: .utf8))
        XCTAssertTrue(json.contains("신맛이 강해서 좋았어요"))
        XCTAssertFalse(json.contains("생성한 해석"))
        XCTAssertFalse(json.contains("insights"))
    }
}
