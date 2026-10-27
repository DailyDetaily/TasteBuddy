import Foundation

/// Counts from validated, account-scoped original records. No fixtures or inferred taste scores.
struct TBRecordChartData {
    struct FoodKind: Equatable { let id: String; let label: String }
    struct FoodKindCount: Identifiable { let id: String; let label: String; let value: Int }
    struct SensorySeries: Identifiable {
        let id: String
        let label: String
        let values: [Double?]
        let comparisonValues: [Double?]
        let value: Int
    }
    struct Input: Equatable {
        let id: String
        let date: Date?
        let source: String
        var foodKinds: [FoodKind] = []
        var mealID: String? = nil
        var tasteIDs: [String] = []
        var hasSensoryRecord = false
    }
    struct Day: Identifiable {
        let id: String
        let date: Date
        let count: Int?
        let entryIDs: [String]
    }
    struct Series: Identifiable {
        let id: String
        let label: String
        let values: [Int]
        let value: Int
    }
    let monthLabel: String
    let startDay: Int
    let month: [Day]
    let current: [Int]
    let previous: [Int]
    let currentDays: [String]
    let previousDays: [String]
    let series: [Series]
    let foodKinds: [FoodKindCount]
    let unclassifiedFoodCount: Int
    let sensorySeries: [SensorySeries]
    let areaDays: [String]
    let areaComparisonDays: [String]
    let sensoryUnobservedMeals: Int
    let unknownDateCount: Int
    let futureCount: Int
    var total: Int { month.reduce(0) { $0 + ($1.count ?? 0) } }
    var lineValues: [Double] { current.suffix(4).map(Double.init) }
    var absoluteValues: [Double] {
        guard total > 0 else { return [] }
        return series.prefix(2).map { Double($0.value) / Double(total) * 100 }
    }

    static func make(records: [Input], now: Date, calendar: Calendar,
                     unknownDateCount: Int, futureCount: Int) -> Self {
        let today = calendar.startOfDay(for: now)
        let start = calendar.date(from: calendar.dateComponents([.year, .month], from: today))!
        let range = calendar.range(of: .day, in: .month, for: today)!
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone; formatter.dateFormat = "yyyy-MM-dd"
        func key(_ date: Date) -> String { formatter.string(from: date) }
        let valid = records.filter { $0.date.map { calendar.startOfDay(for: $0) <= today } ?? false }
        let byDay = Dictionary(grouping: valid) { key($0.date!) }
        let month: [Day] = range.map { number in
            let date = calendar.date(byAdding: .day, value: number - 1, to: start)!
            let rows = byDay[key(date)] ?? []
            return .init(id: key(date), date: date, count: date > today ? nil : rows.count, entryIDs: rows.map(\.id))
        }
        func dates(_ first: Int) -> [String] {
            (0..<7).map { key(calendar.date(byAdding: .day, value: first + $0, to: today)!) }
        }
        let currentDays = dates(-6), previousDays = dates(-13)
        let monthRows = month.flatMap { byDay[$0.id] ?? [] }
        func source(_ raw: String) -> String { ["homeCooked", "restaurant"].contains(raw) ? raw : "unknown" }
        let series = [("homeCooked", "직접 만든 요리"), ("restaurant", "식당 음식"), ("unknown", "출처 미확인")].map { id, label in
            Series(id: id, label: label, values: currentDays.map { day in (byDay[day] ?? []).filter { source($0.source) == id }.count },
                   value: monthRows.filter { source($0.source) == id }.count)
        }
        var kinds: [String: FoodKindCount] = [:]
        var unclassified = 0
        for record in monthRows {
            let unique = Dictionary(record.foodKinds.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
            if unique.isEmpty { unclassified += 1 }
            for kind in unique.values { kinds[kind.id] = .init(id: kind.id, label: kind.label, value: (kinds[kind.id]?.value ?? 0) + 1) }
        }
        let foodKinds = Array(kinds.values.sorted { $0.value == $1.value ? $0.id < $1.id : $0.value > $1.value }.prefix(3))
        let areaDays = Array(currentDays.suffix(4)), areaComparisonDays = Array(dates(-7).prefix(4))
        let areaAllDays = areaComparisonDays + areaDays
        let tastes = [("sweet", "단맛"), ("sour", "신맛"), ("bitter", "쓴맛"), ("salty", "짠맛"), ("umami", "감칠맛"), ("fat", "지방맛")]
        func tasteCount(_ id: String, _ day: String) -> Double? {
            let rows = byDay[day] ?? []
            if !rows.isEmpty && !rows.contains(where: \.hasSensoryRecord) { return nil }
            return Double(Set(rows.filter { $0.tasteIDs.contains(id) }.map { $0.mealID ?? $0.id }).count)
        }
        var sensoryCandidates: [SensorySeries] = []
        for (id, label) in tastes {
            let currentValues: [Double?] = areaDays.map { tasteCount(id, $0) }
            let previousValues: [Double?] = areaComparisonDays.map { tasteCount(id, $0) }
            let total: Double = (currentValues + previousValues).compactMap { $0 }.reduce(0, +)
            if total > 0 {
                sensoryCandidates.append(SensorySeries(id: id, label: label, values: currentValues, comparisonValues: previousValues, value: Int(total)))
            }
        }
        sensoryCandidates.sort { $0.value == $1.value ? $0.id < $1.id : $0.value > $1.value }
        let sensorySeries = Array(sensoryCandidates.prefix(3))
        let areaRecords = areaAllDays.flatMap { byDay[$0] ?? [] }
        let observedMeals = Set(areaRecords.filter(\.hasSensoryRecord).map { $0.mealID ?? $0.id })
        let unobservedMeals = Set(areaRecords.filter { !observedMeals.contains($0.mealID ?? $0.id) }.map { $0.mealID ?? $0.id }).count
        let components = calendar.dateComponents([.year, .month], from: today)
        return .init(monthLabel: "\(components.year!)년 \(components.month!)월", startDay: (calendar.component(.weekday, from: start) + 5) % 7,
                     month: month, current: currentDays.map { (byDay[$0] ?? []).count }, previous: previousDays.map { (byDay[$0] ?? []).count },
                     currentDays: currentDays, previousDays: previousDays, series: series, foodKinds: foodKinds, unclassifiedFoodCount: unclassified,
                     sensorySeries: sensorySeries, areaDays: areaDays, areaComparisonDays: areaComparisonDays, sensoryUnobservedMeals: unobservedMeals,
                     unknownDateCount: unknownDateCount, futureCount: futureCount)
    }
}

/// Matches COMPONENT_TOKENS.miniChart: 56pt plot centered within the 63pt summary text block.
enum TBMiniChartDimensions {
    static let width = 132.0
    static let height = 56.0
}

/// Shared zero baseline, equal date slots, no accumulation or interpolation over missing values.
enum TBMiniAreaGeometry {
    struct Point { let x: Double; let y: Double }
    struct Layer { let index: Int; let area: Double; let runs: [[Point]]; var tint = 60 }
    static func valueHeight(_ value: Double?, maximum: Double, height: Double = TBMiniChartDimensions.height) -> Double? {
        guard let value, value.isFinite, value >= 0 else { return nil }
        let one = min(12.0, height)
        if value <= 1 { return value * one }
        return one + (value - 1) / (max(maximum, value) - 1) * (height - one)
    }
    static func pointRuns(_ values: [Double?], maximum: Double, width: Double = TBMiniChartDimensions.width, height: Double = TBMiniChartDimensions.height) -> [[Point]] {
        var runs: [[Point]] = [], run: [Point] = []
        for (slot, value) in values.enumerated() {
            guard let pointHeight = valueHeight(value, maximum: maximum, height: height) else {
                if run.count > 1 { runs.append(run) }; run = []; continue
            }
            let y = height - pointHeight
            if values.count == 1 { runs.append([Point(x: 0, y: y), Point(x: width, y: y)]); continue }
            run.append(Point(x: width * Double(slot) / Double(values.count - 1), y: y))
        }
        if run.count > 1 { runs.append(run) }
        return runs
    }
    static func single(_ input: [Double?]) -> [[Point]] {
        let values = Array(input.suffix(4))
        let maximum = values.compactMap { $0 }.filter { $0.isFinite && $0 >= 0 }.max() ?? 0
        return pointRuns(values, maximum: maximum)
    }
    static func layers(_ input: [[Double?]], comparison: Bool) -> [Layer] {
        guard !input.isEmpty, input.count <= 3, !comparison || input.count == 2,
              let count = input.first?.count, count >= 2, input.allSatisfy({ $0.count == count }) else { return [] }
        let values: [[Double?]] = input.map { Array($0.suffix(4)).map { $0.flatMap { $0.isFinite && $0 >= 0 ? $0 : nil } } }
        let maximum: Double = values.flatMap { $0.compactMap { $0 } }.max() ?? 0
        guard maximum > 0 else { return [] }
        let width = TBMiniChartDimensions.width, height = TBMiniChartDimensions.height
        var result: [Layer] = []
        for (index, row) in values.enumerated() {
            let runs = pointRuns(row, maximum: maximum, width: width, height: height)
            var area = 0.0
            for (slot, value) in row.enumerated() {
                guard let value else { continue }
                if slot > 0, let before = row[slot - 1] {
                    area += (valueHeight(before, maximum: maximum, height: height)! / height + valueHeight(value, maximum: maximum, height: height)! / height) / 2
                }
            }
            result.append(Layer(index: index, area: area, runs: runs))
        }
        result.sort { $0.area == $1.area ? $0.index < $1.index : $0.area > $1.area }
        for order in result.indices { result[order].tint = comparison ? (order == 0 ? 80 : 20) : 20 }
        return result
    }
}

/// Monday-first 7-column calendar, matching miniHeatmapGeometry.ts exactly.
enum TBMiniHeatmapGeometry {
    struct Cell: Identifiable {
        let id: Int
        let value: Int?
        let padding: Bool
        let x: Double
        let y: Double
        let width: Double
        let height: Double
        var level: Int? { padding ? 0 : value.map { min(4, max(0, $0)) } }
    }
    static let tintSteps = [80, 60, 40, 20, 0]
    static func cells(values: [Int?], startDay: Int) -> [Cell] {
        guard !values.isEmpty else { return [] }
        let offset = (0..<7).contains(startDay) ? startDay : 0
        let rows = Int(ceil(Double(values.count + offset) / 7))
        let gap = min(2.0, min(TBMiniChartDimensions.width / 14, TBMiniChartDimensions.height / Double(rows * 2)))
        let width = (TBMiniChartDimensions.width - gap * 6) / 7, height = (TBMiniChartDimensions.height - gap * Double(rows - 1)) / Double(rows)
        return (0..<(rows * 7)).map { slot in
            let index = slot - offset, padding = !values.indices.contains(slot - offset)
            let value = padding ? nil : values[index].flatMap { $0 >= 0 ? $0 : nil }
            return Cell(id: index, value: value, padding: padding,
                        x: Double(slot % 7) * (width + gap), y: Double(slot / 7) * (height + gap), width: width, height: height)
        }
    }
}
