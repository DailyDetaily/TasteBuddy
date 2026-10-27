import XCTest
@testable import TasteBuddy

final class TastePerceptionTests: XCTestCase {
    private struct Fixtures: Decodable { let cases: [Case] }
    private struct Case: Decodable {
        let id: String; let records: [Record]; let asOf: String?; let expected: Expected
    }
    private struct Expected: Decodable {
        let meals: Int; let patterns: Int; let changes: Int; let contrasts: Int; let levels: [Int?]; let recentCounts: [Int]?
    }
    private struct Record: Decodable {
        let observationId: String; let userId: String; let experienceId: UUID; let mealId: UUID
        let feedbackCompleted: Bool; let confirmationStatus: String; let kind: String; let attribute: String
        let value: SensoryValue; let scale: String; let foodName: String; let restaurantID: String?; let restaurantName: String?
        let menuItemID: String?; let target: String; let phase: String; let observedAt: String; let knownAt: String
        let phrase: String; let dishKindIDs: [String]; let reference: String?
        var observation: SensoryObservation {
            .init(id: observationId, experienceID: experienceId, foodName: foodName, recordedAt: PersonalTasteModelBuilder.date(observedAt)!, sourceField: "fixture", kind: kind, attribute: attribute, attributeLabel: "짠맛", value: value, scale: scale, target: target, phase: phase, phrase: phrase, sourceSpans: [], reference: reference, combinationComponents: [], mealID: mealId, observedAt: PersonalTasteModelBuilder.date(observedAt), knownAt: PersonalTasteModelBuilder.date(knownAt), dishKindIDs: dishKindIDs, restaurantID: restaurantID, menuItemID: menuItemID, restaurantName: restaurantName)
        }
    }
    private var root: URL { URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent() }
    func testSharedEvidenceCases() throws {
        let fixture = try JSONDecoder().decode(Fixtures.self, from: Data(contentsOf: root.appendingPathComponent("TasteBuddy/Resources/TBA/taste-perception-fixtures.json")))
        for example in fixture.cases {
            let observations = example.records.filter { $0.feedbackCompleted && $0.userId == "owner" && ["explicit_user_choice", "rule_extracted_statement"].contains($0.confirmationStatus) }.map(\.observation)
            let result = TastePerceptionEngine.build(observations: observations, asOf: PersonalTasteModelBuilder.date(example.asOf))
            XCTAssertEqual(result.evidenceCount, example.expected.meals, example.id)
            XCTAssertEqual(result.patterns.count, example.expected.patterns, example.id)
            XCTAssertEqual(result.changes.count, example.expected.changes, example.id)
            XCTAssertEqual(result.contrasts.count, example.expected.contrasts, example.id)
            XCTAssertEqual(TasteAxis.allCases.map { result.current(for: $0)?.currentLevel }, example.expected.levels, example.id)
            if let counts = example.expected.recentCounts { XCTAssertEqual(result.current(for: .salty)?.counts, counts, example.id) }
            XCTAssertEqual(TastePerceptionEngine.build(observations: observations + observations, asOf: PersonalTasteModelBuilder.date(example.asOf)), result, example.id)
        }
    }
    func testCompletedMealFlowSeparatesStrengthLikingAndFit() throws {
        let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: root.appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")))
        let entries: [DiningEntry] = (0..<3).map { index in
            let date = Date(timeIntervalSince1970: 1_780_000_000 + Double(index * 86400))
            return .init(restaurant: "테스트 식당", menu: "국물 요리", date: date, savedAt: date,
                         rating: 1, note: "", sensorySelections: [.init(id: "salty-broth-salt", type: .bubble,
                         labelSnapshot: "육수의 짠맛", liking: .disliked, intensity: .strong, preferenceFit: .justRight, target: .broth, phase: .firstBite)],
                         mealTime: .init(source: .confirmed, start: date, confirmedAt: date))
        }
        let result = try SensoryAnalysisEngine.analyze(entries: entries, contract: contract)
        XCTAssertEqual(result.perception.current(for: .salty)?.currentLevel, 2)
        XCTAssertEqual(result.perception.evidenceCount, 3)
        XCTAssertTrue(result.observations.contains { $0.kind == "preference_fit" && $0.value == .text("just_right") })
        XCTAssertTrue(result.observations.contains { $0.kind == "attribute_liking" && $0.value == .text("negative") })
        let capture = DiningEntry(restaurant: "테스트 식당", menu: "국물 요리", rating: 0, note: "강한 짠맛", feedbackStatus: .captured)
        XCTAssertEqual(try SensoryAnalysisEngine.analyze(entries: [capture], contract: contract).perception, .empty)
    }
    func testSurveyZeroUnknownAndComparableHistory() throws {
        let catalog = try TasteSurveyCatalogLoader.load()
        let date = Date(timeIntervalSince1970: 1_780_000_000)
        let old = try XCTUnwrap(TasteSurveyScoringEngine.makeCompatibleResult(items: catalog.items, responses: catalog.items.map { .init(itemId: $0.id, selectedValue: 2, uncertain: false) }, measuredAt: PersonalTasteModelBuilder.timestamp(date)).snapshot.surveySubmission)
        let current = try XCTUnwrap(TasteSurveyScoringEngine.makeCompatibleResult(items: catalog.items, responses: [.init(itemId: catalog.items[0].id, selectedValue: 0, uncertain: false), .init(itemId: catalog.items[1].id, selectedValue: nil, uncertain: true)], measuredAt: PersonalTasteModelBuilder.timestamp(date.addingTimeInterval(86400))).snapshot.surveySubmission)
        let sameTime = try XCTUnwrap(TasteSurveyScoringEngine.makeCompatibleResult(items: catalog.items, responses: old.responses, measuredAt: ISO8601DateFormatter().string(from: date.addingTimeInterval(86400))).snapshot.surveySubmission)
        XCTAssertTrue(SurveyPerception.points(submissions: [current, sameTime]).allSatisfy { !$0.hasChange })
        let points = SurveyPerception.points(submissions: [current, old, current])
        XCTAssertEqual(points.first { $0.axis == catalog.items[0].tasteId }?.value, 0)
        XCTAssertEqual(points.filter { $0.value != nil }.count, 1)
        XCTAssertEqual(points.filter(\.hasChange).count, 1)
        XCTAssertNil(points.first { $0.axis == catalog.items[1].tasteId }?.value)
        let series = TasteChangeSeries.build(perception: .empty, survey: points)
        let sweet = try XCTUnwrap(series.first { $0.axis == catalog.items[0].tasteId })
        XCTAssertEqual(sweet.points.map(\.value), [2, 0])
        XCTAssertEqual(sweet.maximum, 4)
        XCTAssertEqual(TasteChangeSeries.changeLabel(sweet.points), "더 약하게")
        XCTAssertTrue(sweet.points.allSatisfy { $0.experienceIDs.isEmpty })
        XCTAssertEqual(TasteChangeSeries.changeLabel(Array(sweet.points.suffix(1))), "비교 부족")
        XCTAssertEqual(TasteChangeSeries.summary(series).map(\.id), [sweet.id])
        XCTAssertEqual(TasteChangeSeries.summary(series).first?.points.map(\.value), [2, 0])
    }
    func testMouthfeelDoesNotFillMissingTasteAxisAndUnknownMealTimeCannotBecomeRecentComparison() throws {
        let entries = (0..<3).map { index -> DiningEntry in
            let date = Date(timeIntervalSince1970: 1_780_000_000 + Double(index) * 86400)
            return .init(restaurant: "합성 식당", menu: "크림 파스타", date: date, savedAt: date, rating: 5, note: "",
                sensorySelections: [.init(id: "fat-coating", type: .bubble, labelSnapshot: "입안을 감싸는 지방감",
                    intensity: .light, target: .sauce, phase: .afterSwallow)],
                mealTime: .init(source: .confirmed, start: date, confirmedAt: date))
        }
        // 문구는 현재 카탈로그에서 가져와 테스트용 선택을 만든다.
        let catalog = try XCTUnwrap(SensoryAnalysisEngine.contract?.selectionCatalog)
        let item = try XCTUnwrap(catalog.entries.first { $0.attribute == "mouthfeel.fatty" && $0.type == "bubble" && $0.intrinsicIntensity == nil })
        let records = entries.map { entry in
            DiningEntry(id: entry.id, restaurant: entry.restaurant, menu: entry.menu, date: entry.date, savedAt: entry.savedAt,
                rating: 5, note: "", sensorySelections: [.init(id: item.id, type: .bubble, labelSnapshot: item.label,
                    intensity: .light, target: .sauce, phase: .afterSwallow)], mealTime: entry.mealTime)
        }
        let result = try SensoryAnalysisEngine.analyze(entries: records)
        XCTAssertNil(result.perception.current(for: .fat)?.currentLevel)
        XCTAssertNil(result.perception.current(for: .fat)?.previousLevel)
        var unknown = records.map { entry in
            DiningEntry(id: entry.id, restaurant: entry.restaurant, menu: entry.menu, date: entry.date, savedAt: entry.savedAt,
                rating: 5, note: "", sensorySelections: [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                    intensity: .light, target: .sauce, phase: .afterSwallow)], mealTime: entry.mealTime)
        }
        XCTAssertEqual(try SensoryAnalysisEngine.analyze(entries: unknown).perception.current(for: .sour)?.currentLevel, 0)
        for index in unknown.indices { unknown[index].mealTime = nil }
        XCTAssertTrue(try SensoryAnalysisEngine.analyze(entries: unknown).perception.patterns.isEmpty)
        XCTAssertNil(TastePerceptionEngine.axis(for: "mouthfeel.fatty"))
        XCTAssertNil(TastePerceptionEngine.axis(for: "aroma.nutty"))
    }
    func testChangeScreenUsesScopedPeriodsWithoutInventingMissingValues() throws {
        let fixtures = try JSONDecoder().decode(Fixtures.self, from: Data(contentsOf: root.appendingPathComponent("TasteBuddy/Resources/TBA/taste-perception-fixtures.json")))
        let example = try XCTUnwrap(fixtures.cases.first { $0.expected.changes > 0 })
        let model = TastePerceptionEngine.build(observations: example.records.map(\.observation))
        let pattern = try XCTUnwrap(model.changes.first)
        let series = try XCTUnwrap(TasteChangeSeries.build(perception: model, survey: []).first { $0.id == pattern.id })
        XCTAssertEqual(series.points.map(\.value), [pattern.previousLevel!, pattern.currentLevel!])
        XCTAssertEqual(series.points.map(\.count), [3, 3])
        XCTAssertEqual(series.points.first?.evidenceIDs, pattern.previous.evidenceIDs)
        XCTAssertEqual(series.points.last?.experienceIDs, pattern.recent.experienceIDs)
        XCTAssertTrue(TasteChangeSeries.build(perception: .empty, survey: []).isEmpty)
        let summary = TasteChangeSeries.summary([series])
        XCTAssertEqual(summary.map(\.id), [pattern.id])
        XCTAssertEqual(summary.first?.points.map(\.value), [pattern.previousLevel!, pattern.currentLevel!])
    }

    func testSummaryKeepsUnchangedComparisonsAndRejectsMissingOrOverlappingPeriods() {
        let date = Date(timeIntervalSince1970: 1_780_000_000)
        func point(_ id: String, day: Int, value: Int) -> TasteChangeSeries.Point {
            .init(id: id, date: date.addingTimeInterval(Double(day) * 86400), start: date.addingTimeInterval(Double(day) * 86400),
                  value: value, label: "중간", evidenceIDs: [id], experienceIDs: [], count: 3)
        }
        func series(_ id: String, _ points: [TasteChangeSeries.Point], source: String = "식사 기록") -> TasteChangeSeries {
            .init(id: id, axis: .salty, source: source, condition: "같은 국물 · 첫입", maximum: source == "식사 기록" ? 2 : 4, points: points, details: [])
        }
        let stable = series("stable", [point("이전", day: 0, value: 1), point("최근", day: 1, value: 1)])
        let missing = series("missing", [point("최근", day: 1, value: 2)])
        let overlap = series("overlap", [point("이전", day: 1, value: 0), point("최근", day: 1, value: 2)])
        let recall = series("recall", [point("이전", day: 0, value: 4), point("최근", day: 1, value: 0)], source: "기준 음식 회상")
        XCTAssertEqual(TasteChangeSeries.summary([missing, overlap, stable, recall]).map(\.id), ["stable"])
        XCTAssertEqual(TasteChangeSeries.changeLabel(stable.points), "같은 강도")
        XCTAssertTrue(TasteChangeSeries.summary([missing, overlap]).isEmpty)
        XCTAssertEqual(TasteChangeSeries.summary([recall]).first?.points.map(\.value), [4, 0])
    }
}


extension TastePerceptionTests {
    func testOverallProfileSharedCases() throws {
        struct Fixture: Decodable {
            struct Example: Decodable {
                struct Expected: Decodable { let values: [Double?]; let previous: [Double?]; let rated: [Int]; let mixed: [Int] }
                let id: String; let records: [PersonalTasteModelRecord]; let expected: Expected
            }
            let asOf: String; let timeZone: String; let cases: [Example]
        }
        let url = root.deletingLastPathComponent().appendingPathComponent("scripts/fixtures/overall-taste-profile.json")
        let fixture = try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: url))
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: fixture.timeZone)!
        let now = try XCTUnwrap(PersonalTasteModelBuilder.date(fixture.asOf))
        for example in fixture.cases {
            let model = PersonalTasteModelBuilder.buildRecords(records: example.records, userID: "owner", assessQuestions: false)
            let result = OverallTasteProfile.build(model: model, records: example.records, userID: "owner", referenceDate: now, calendar: calendar)
            for (index, axis) in result.axes.enumerated() {
                if let expected = example.expected.values[index] {
                    XCTAssertEqual(try XCTUnwrap(axis.current.value), expected, accuracy: 0.000001, example.id)
                } else { XCTAssertNil(axis.current.value, example.id) }
                if let expected = example.expected.previous[index] {
                    XCTAssertEqual(try XCTUnwrap(axis.previous.value), expected, accuracy: 0.000001, example.id)
                } else { XCTAssertNil(axis.previous.value, example.id) }
            }
            XCTAssertEqual(result.axes.map { $0.current.rated }, example.expected.rated, example.id)
            XCTAssertEqual(result.axes.map { $0.current.mixed }, example.expected.mixed, example.id)
            XCTAssertEqual(OverallTasteProfile.build(model: model, records: example.records + example.records, userID: "owner", referenceDate: now, calendar: calendar), result, example.id)
            XCTAssertEqual(OverallTasteProfile.build(model: model, records: example.records, userID: "other", referenceDate: now, calendar: calendar), .empty)
        }
    }
}
