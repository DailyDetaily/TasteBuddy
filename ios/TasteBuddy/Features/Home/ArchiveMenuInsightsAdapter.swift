import Foundation

extension HomeArchiveMenuInsights {
    static func make(input: TDNativeInput, state: TDState, calendar: Calendar = .current) -> Self {
        let source = Dictionary(input.entries.map { ($0.id.uuidString, $0) }, uniquingKeysWith: { first, _ in first })
        let records = state.records.filter { row in
            guard let entry = source[row.id] else { return false }
            return (entry.savedAt ?? entry.observedAt) <= state.now
        }.map { row in
            Record(id: row.id, mealID: row.mealID, menuKey: row.menu?.id, restaurantKey: row.restaurant?.id,
                   menu: source[row.id]?.menu ?? "", restaurant: row.source == .homeCooked ? "" : source[row.id]?.restaurant ?? "",
                   date: row.date)
        }
        let ids = Set(records.map(\.id))
        let stars = input.overallStarObservations.compactMap { observation -> Star? in
            guard ids.contains(observation.experienceID.uuidString),
                  observation.scale == DiningOverallEvaluation.starScale,
                  let value = Double(observation.value.text) else { return nil }
            return Star(id: observation.id, entryID: observation.experienceID.uuidString, value: value)
        }
        return make(records: records, stars: stars, now: state.now, calendar: calendar)
    }
}
