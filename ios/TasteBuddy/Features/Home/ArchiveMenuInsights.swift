import Foundation

/// Pure projection of validated account records; no persisted display values.
/// Keep the shared fixtures in test-archive-menu-insights.mjs aligned with the web.
struct HomeArchiveMenuInsights: Codable, Equatable, Sendable {
    struct Record: Sendable {
        let id: String
        let mealID: String
        let menuKey: String?
        let restaurantKey: String?
        let menu: String
        let restaurant: String
        let date: Date?
    }
    struct Star: Sendable {
        let id: String
        let entryID: String
        let value: Double
    }
    struct Menu: Codable, Equatable, Identifiable, Sendable {
        let id: String
        let label: String
        let mealCount: Int
        let entryIDs: [String]
        let firstEntryIDs: [String]
    }
    var newMenus: [Menu] = []
    var familiarMenus: [Menu] = []
    var uncertainMenus: [Menu] = []
    var repeatedMenus: [Menu] = []
    var satisfiedMenus: [Menu] = []
    var belowThresholdMenus: [Menu] = []
    var unratedMenus: [Menu] = []
    var ambiguousRatingMenus: [Menu] = []
    var mealCount = 0
    var menuCount = 0
    var restaurantCount = 0
    var unknownDateCount = 0
    var unlinkedMenuCount = 0
    var unknownDateEntryIDs: [String] = []
    var unlinkedMenuEntryIDs: [String] = []
    var ratedCount: Int { satisfiedMenus.count + belowThresholdMenus.count }
    var satisfactionPercent: Double? {
        ratedCount > 0 ? Double(satisfiedMenus.count) / Double(ratedCount) * 100 : nil
    }

    static func make(records: [Record], stars: [Star], now: Date, calendar: Calendar = .current) -> Self {
        let start = calendar.date(byAdding: .day, value: -29, to: calendar.startOfDay(for: now))!
        let groups = Dictionary(grouping: records.filter { $0.menuKey != nil }, by: { $0.menuKey! })
        let validStars = Dictionary(grouping: stars, by: \.id).values.compactMap { rows -> Star? in
            let first = rows[0]
            guard rows.allSatisfy({ $0.entryID == first.entryID && $0.value == first.value }),
                  first.value.isFinite, (0.5...5).contains(first.value),
                  (first.value * 2).rounded() == first.value * 2 else { return nil }
            return first
        }
        var result = Self()
        result.mealCount = Set(records.map(\.mealID)).count
        result.menuCount = groups.count
        result.restaurantCount = Set(records.compactMap(\.restaurantKey)).count
        result.unknownDateCount = records.filter { $0.date == nil }.count
        result.unlinkedMenuCount = records.filter { $0.menuKey == nil }.count
        result.unknownDateEntryIDs = records.filter { $0.date == nil }.map(\.id).sorted()
        result.unlinkedMenuEntryIDs = records.filter { $0.menuKey == nil }.map(\.id).sorted()
        for (id, source) in groups {
            let rows = source.sorted { $0.id < $1.id }
            let dates = rows.compactMap(\.date)
            let firstDate = dates.min()
            let firstRows = firstDate.map { date in rows.filter { $0.date == date } } ?? []
            let menu = Menu(id: id, label: rows[0].menu + (rows[0].restaurant.isEmpty ? " · 직접 만든 요리" : " · " + rows[0].restaurant),
                            mealCount: Set(rows.map(\.mealID)).count, entryIDs: rows.map(\.id),
                            firstEntryIDs: firstRows.map(\.id))
            if menu.mealCount >= 2 { result.repeatedMenus.append(menu) }
            guard dates.contains(where: { $0 >= start }) else { continue }
            if let firstDate, firstDate < start {
                result.familiarMenus.append(menu)
            } else if rows.contains(where: { $0.date == nil }) {
                result.uncertainMenus.append(menu)
            } else {
                result.newMenus.append(menu)
                let answers = Set(validStars.filter { menu.firstEntryIDs.contains($0.entryID) }.map(\.value))
                if Set(firstRows.map(\.mealID)).count != 1 || answers.count > 1 {
                    result.ambiguousRatingMenus.append(menu)
                } else if let answer = answers.first {
                    if answer >= 4 { result.satisfiedMenus.append(menu) }
                    else { result.belowThresholdMenus.append(menu) }
                } else {
                    result.unratedMenus.append(menu)
                }
            }
        }
        result.newMenus.sort { $0.id < $1.id }
        result.familiarMenus.sort { $0.id < $1.id }
        result.uncertainMenus.sort { $0.id < $1.id }
        result.satisfiedMenus.sort { $0.id < $1.id }
        result.belowThresholdMenus.sort { $0.id < $1.id }
        result.unratedMenus.sort { $0.id < $1.id }
        result.ambiguousRatingMenus.sort { $0.id < $1.id }
        result.repeatedMenus.sort {
            $0.mealCount == $1.mealCount ? $0.id < $1.id : $0.mealCount > $1.mealCount
        }
        result.repeatedMenus = Array(result.repeatedMenus.prefix(3))
        return result
    }
}
