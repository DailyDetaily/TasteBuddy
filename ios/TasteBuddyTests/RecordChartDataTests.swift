import XCTest
@testable import TasteBuddy

final class RecordChartDataTests: XCTestCase {
    private var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Seoul")!
        return calendar
    }
    private func date(_ value: String) -> Date { ISO8601DateFormatter().date(from: value)! }
    private var now: Date { date("2026-10-08T12:00:00+09:00") }

    func testMonthMatchesWebCalendarAndZeroFutureRules() {
        let data = TBRecordChartData.make(records: [
            .init(id: "a", date: date("2026-10-01T12:00:00+09:00"), source: "unknown"),
            .init(id: "b", date: date("2026-09-30T16:00:00Z"), source: "unknown")
        ], now: now, calendar: calendar, unknownDateCount: 0, futureCount: 0)
        XCTAssertEqual(data.month.count, 31)
        XCTAssertEqual(data.startDay, 3)
        XCTAssertEqual(data.month[0].count, 2)
        XCTAssertEqual(data.month[7].count, 0)
        XCTAssertNil(data.month[8].count)
        XCTAssertEqual(data.total, 2)
        let leap = TBRecordChartData.make(records: [], now: date("2028-02-29T12:00:00+09:00"), calendar: calendar, unknownDateCount: 0, futureCount: 0)
        XCTAssertEqual(leap.month.count, 29)
        XCTAssertTrue(leap.month.allSatisfy { $0.count == 0 })
    }

    func testAllChartsUseSameDishRecordsAndKnownSourceDenominator() {
        let data = TBRecordChartData.make(records: [
            .init(id: "a", date: date("2026-10-01T12:00:00+09:00"), source: "homeCooked"),
            .init(id: "b", date: date("2026-10-01T12:00:00+09:00"), source: "restaurant"),
            .init(id: "c", date: date("2026-10-01T12:00:00+09:00"), source: "unknown")
        ], now: now, calendar: calendar, unknownDateCount: 2, futureCount: 1)
        XCTAssertEqual(data.total, 3)
        XCTAssertEqual(data.series.map(\.value), [1, 1, 1])
        XCTAssertEqual(data.previous, [0, 0, 0, 0, 0, 0, 3])
        XCTAssertEqual(data.current, Array(repeating: 0, count: 7))
        XCTAssertEqual(data.absoluteValues.reduce(0, +), 200.0 / 3, accuracy: 1e-9)
        XCTAssertEqual(data.unknownDateCount, 2)
        XCTAssertEqual(data.futureCount, 1)
    }

    func testFoodKindBubblesDeduplicatePerDishAndKeepOverlappingKinds() {
        let day = date("2026-10-01T12:00:00+09:00")
        let fish = TBRecordChartData.FoodKind(id: "seafood", label: "해산물")
        let meat = TBRecordChartData.FoodKind(id: "meat", label: "육류")
        let noodle = TBRecordChartData.FoodKind(id: "noodle", label: "면류")
        let data = TBRecordChartData.make(records: [
            .init(id: "a", date: day, source: "unknown", foodKinds: [fish, fish, meat]),
            .init(id: "b", date: day, source: "unknown", foodKinds: [fish, noodle]),
            .init(id: "c", date: day, source: "unknown", foodKinds: [meat]),
            .init(id: "d", date: day, source: "unknown", foodKinds: [noodle]),
            .init(id: "e", date: day, source: "unknown")
        ], now: now, calendar: calendar, unknownDateCount: 0, futureCount: 0)
        XCTAssertEqual(data.total, 5)
        XCTAssertEqual(data.foodKinds.map(\.id), ["meat", "noodle", "seafood"])
        XCTAssertEqual(data.foodKinds.map(\.value), [2, 2, 2])
        XCTAssertEqual(data.unclassifiedFoodCount, 1)
    }

    func testHeatmapFiveLevelsPaddingAndFullBounds() {
        XCTAssertEqual(TBMiniHeatmapGeometry.tintSteps, [80, 60, 40, 20, 0])
        let values: [Int?] = [0, 1, 2, 3, 4, 20, nil]
        let cells = TBMiniHeatmapGeometry.cells(values: values, startDay: 3)
        XCTAssertEqual(cells.count, 14)
        XCTAssertEqual(cells.filter { !$0.padding }.map(\.level), [0, 1, 2, 3, 4, 4, nil])
        XCTAssertEqual(cells.filter(\.padding).count, 7)
        XCTAssertEqual(cells.first!.x, 0)
        XCTAssertEqual(cells.first!.y, 0)
        XCTAssertEqual(cells.last!.x + cells.last!.width, 132, accuracy: 1e-9)
        XCTAssertEqual(cells.last!.y + cells.last!.height, 56, accuracy: 1e-9)
        XCTAssertTrue(cells.filter(\.padding).allSatisfy { $0.value == nil })
    }

    func testExistingValidationFeedsAdapterWithoutDuplicateOrUnknownDateInflation() {
        let records: [TDRecord] = [
            .init(id: "a", mealID: "m", date: date("2026-10-01T12:00:00+09:00"), menu: nil, restaurant: nil, foodKinds: []),
            .init(id: "b", mealID: "m", date: nil, menu: nil, restaurant: nil, foodKinds: []),
            .init(id: "future", mealID: "f", date: date("2026-10-09T12:00:00+09:00"), menu: nil, restaurant: nil, foodKinds: [])
        ]
        let state = TDDataEngine.prepare(records: records + [records[0]], observations: [], window: .all, now: now, calendar: calendar)
        let data = TBRecordChartData.make(state: state, calendar: calendar)
        XCTAssertEqual(data.total, 0)
        XCTAssertEqual(data.unknownDateCount, 2)
        XCTAssertEqual(data.futureCount, 1)
        XCTAssertTrue(data.absoluteValues.isEmpty)
    }
}
