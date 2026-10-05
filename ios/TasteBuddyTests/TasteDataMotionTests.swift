import XCTest
@testable import TasteBuddy

final class TasteDataMotionTests: XCTestCase {
    private var calendar: Calendar { var c = Calendar(identifier: .gregorian); c.timeZone = TimeZone(secondsFromGMT: 0)!; return c }
    private var now: Date { Date(timeIntervalSince1970: 1_790_000_000) }
    private func state(empty: Bool = false, split: Bool = false) -> TDState {
        let records = empty ? [] : [
            TDRecord(id: "a", mealID: "meal1", date: now.addingTimeInterval(-86400), menu: .init(id: "menu-a", label: "국수"), restaurant: nil, foodKinds: [.init(id: "noodle", label: "면")]),
            TDRecord(id: "b", mealID: "meal1", date: now.addingTimeInterval(-86400), menu: .init(id: "menu-b", label: "만두"), restaurant: nil, foodKinds: [.init(id: "dumpling", label: "만두")]),
            TDRecord(id: "c", mealID: split ? "meal1" : "meal2", date: now.addingTimeInterval(-86400*4), menu: .init(id: "menu-a", label: "국수"), restaurant: nil, foodKinds: [.init(id: "noodle", label: "면")])
        ]
        let observations: [TDObservation] = empty ? [] : ["a", "c"].flatMap { id in
            [TDObservation(id: id+"-presence", entryID: id, facet: .presence, attribute: "taste.salty", label: "짠맛", value: "present", target: "broth", phase: "during", selection: "salt"),
             TDObservation(id: id+"-liking", entryID: id, facet: .liking, attribute: "taste.salty", label: "짠맛", value: id == "a" ? "positive" : "negative", target: "broth", phase: "during", selection: "salt")]
        }
        return TDDataEngine.prepare(records: records, observations: observations, window: .all, now: now, calendar: calendar)
    }
    private func input(_ category: TDCategory, state: TDState) -> TDCategoryMotionInput {
        let result = TDDataEngine.result(state, category: category, calendar: calendar)
        return .make(state: state, result: result, category: category, domain: "맛", attribute: nil,
                     facet: .liking, contextDimension: "foodKind", heroDimension: nil, calendar: calendar)
    }
    private func data(_ input: TDCategoryMotionInput) throws -> [String: Any] {
        let envelope = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(input.json.utf8)) as? [String: Any])
        return try XCTUnwrap(envelope["data"] as? [String: Any])
    }
    func testExperienceUsesRealDishIDsAndKeepsMealCountSeparate() throws {
        let input = input(.experience, state: state())
        let records = try XCTUnwrap(try data(input)["records"] as? [[String: Any]])
        XCTAssertEqual(records.count, 3)
        XCTAssertEqual(Set(records.compactMap { $0["mealId"] as? String }).count, 2)
        XCTAssertEqual(Set(records.compactMap { $0["id"] as? String }), ["a", "b", "c"])
    }
    func testSensoryUsesConfirmedMealIDsAndNoWeakAnswerForMissingIntensity() throws {
        let payload = try data(input(.sensation, state: state()))
        XCTAssertEqual(payload["validMealIds"] as? [String], ["meal1", "meal2"])
        let senses = try XCTUnwrap(payload["senses"] as? [[String: Any]])
        XCTAssertEqual(senses.count, 6)
        let salty = try XCTUnwrap(senses.first { $0["name"] as? String == "짠맛" })
        XCTAssertEqual(salty["mealIds"] as? [String], ["meal1", "meal2"])
        XCTAssertEqual((salty["intensity"] as? [String: Int])?["weak"], 0)
    }
    func testPreferencePreservesActualSampleIDsAndOpposingResponses() throws {
        let responses = try XCTUnwrap(try data(input(.preference, state: state()))["responses"] as? [[String: Any]])
        XCTAssertEqual(Set(responses.compactMap { $0["unitId"] as? String }), ["meal1", "meal2"])
        XCTAssertEqual(Set(responses.compactMap { $0["response"] as? Int }), [0, 2])
    }
    func testSplitResponsesRemainDistinctFromUnanswered() throws {
        let payload = try data(input(.preference, state: state(split: true)))
        XCTAssertEqual(payload["state"] as? String, "held")
        let responses = try XCTUnwrap(payload["responses"] as? [[String: Any]])
        XCTAssertEqual(responses.count, 1)
        XCTAssertEqual(responses.first?["response"] as? String, "split")
    }
    func testNativeJavaScriptCoreRendersAllFiveCategoriesFromRealScope() async throws {
        let worker = TDCategoryMotionWorker()
        for category in TDCategory.allCases {
            let start = Date.timeIntervalSinceReferenceDate
            let frame = try await worker.frame(input: input(category, state: state()), request: .init(tick: 0, playback: "reduced", alignment: 0, rotation: 0))
            print("Category motion cold frame \(category.id): \((Date.timeIntervalSinceReferenceDate - start) * 1000) ms")
            XCTAssertFalse(frame.title.isEmpty, category.id)
            XCTAssertEqual(frame.summaryOpacity, 1, category.id)
            XCTAssertTrue(frame.dots.allSatisfy { $0.x.isFinite && $0.y.isFinite && $0.r > 0 }, category.id)
            if category == .experience { XCTAssertEqual(frame.value, "2") }
            if category == .preference { XCTAssertEqual(frame.value, "2") }
            if category == .context { XCTAssertEqual(frame.value, "1") }
        }
    }
    func testContextAndChangeOnlyContractWhenEntranceTimeIsExplicitlyRewound() async throws {
        let worker = TDCategoryMotionWorker()
        for category in [TDCategory.context, .change] {
            let source = input(category, state: state())
            XCTAssertEqual(source.playback, "intro")
            for second in [14.5, 15.6, 60.0] {
                let frame = try await worker.frame(input: source, request: .init(tick: Int(second * 30), playback: source.playback, alignment: 0, rotation: 0))
                XCTAssertEqual(frame.summaryOpacity, 1, category.id)
                XCTAssertGreaterThan(frame.dots.count, 1, category.id)
                XCTAssertTrue(frame.dots.allSatisfy { $0.r == 9.5 && $0.opacity == 1 }, category.id)
            }
            let rewound = try await worker.frame(input: source, request: .init(tick: 0, playback: source.playback, alignment: 0, rotation: 0))
            XCTAssertEqual(rewound.summaryOpacity, 0, category.id)
            XCTAssertEqual(rewound.dots.filter { $0.opacity > 0.001 }.count, 1, category.id)
        }
    }
    func testHeldMotionUsesNeutralColourForEveryCategory() async throws {
        let worker = TDCategoryMotionWorker()
        for category in TDCategory.allCases {
            let original = input(category, state: state())
            var envelope = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(original.json.utf8)) as? [String: Any])
            var payload = try XCTUnwrap(envelope["data"] as? [String: Any])
            payload["state"] = "held"; envelope["data"] = payload
            let json = String(data: try JSONSerialization.data(withJSONObject: envelope), encoding: .utf8)!
            let held = TDCategoryMotionInput(json: json, category: category, selectedLabel: original.selectedLabel)
            let frame = try await worker.frame(input: held, request: .init(tick: 0, playback: "reduced", alignment: 0, rotation: 0))
            XCTAssertEqual(frame.state, "held", category.id)
            XCTAssertFalse(frame.dots.isEmpty, category.id)
            XCTAssertTrue(frame.dots.allSatisfy { $0.color == "#E8E8E8" && $0.tintColor == "#E8E8E8" }, category.id)
            XCTAssertTrue(frame.notes.contains("해석 보류"), category.id)
        }
    }
    func testNativeEmptyStatesDoNotInventPositiveResponsesOrMealCounts() async throws {
        let worker = TDCategoryMotionWorker()
        for category in TDCategory.allCases {
            let frame = try await worker.frame(input: input(category, state: state(empty: true)), request: .init(tick: 0, playback: "reduced", alignment: 0, rotation: 0))
            XCTAssertTrue(frame.value.contains("—"), category.id)
            XCTAssertNotEqual(frame.state, "valid", category.id)
        }
    }
}
