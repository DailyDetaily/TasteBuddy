import Foundation

extension TBRecordChartData {
    /// The same validated state used by the archive, rebuilt after restore/edit/delete/account switch.
    static func make(state: TDState, calendar: Calendar = .current) -> Self {
        let presence = state.observations.filter { $0.facet == .presence && $0.value == "present" }
        let byEntry = Dictionary(grouping: presence, by: \.entryID)
        let observedIDs = Set(presence.map(\.entryID))
        let allowed = ["sweet", "sour", "bitter", "salty", "umami", "fat"]
        return make(records: state.records.map { record in
            Input(id: record.id, date: record.date,
                  source: record.source == .homeCooked ? "homeCooked" : record.source == .restaurant ? "restaurant" : "unknown",
                  foodKinds: record.foodKinds.map { .init(id: $0.id, label: $0.label) }, mealID: record.mealID,
                  tasteIDs: allowed.filter { axis in (byEntry[record.id] ?? []).contains { $0.attribute == (axis == "fat" ? "mouthfeel.fatty" : "taste.\(axis)") } },
                  hasSensoryRecord: observedIDs.contains(record.id))
        }, now: state.now, calendar: calendar, unknownDateCount: state.unknownDateIDs.count, futureCount: state.futureIDs.count)
    }
}
