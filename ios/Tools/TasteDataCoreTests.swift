import Foundation

/// Fictional fixtures only. Compiled with the exact production core, not a test reimplementation.
@main struct TasteDataCoreTests {
    static var checks = 0
    static var calendar: Calendar {
        var value = Calendar(identifier: .gregorian)
        value.timeZone = TimeZone(identifier: "Asia/Seoul")!
        return value
    }
    static func date(_ day: Int) -> Date {
        calendar.date(from: DateComponents(year: 2026, month: 9, day: day))!
    }
    static func check(_ passed: @autoclosure () -> Bool, _ name: String) {
        checks += 1
        guard passed() else { fatalError("FAIL \(checks): \(name)") }
        print("PASS \(checks): \(name)")
    }
    static let menuA = TDIdentity(id: "A:kimchi", label: "김치찌개 · A")
    static let menuB = TDIdentity(id: "B:kimchi", label: "김치찌개 · B")
    static let restaurantA = TDIdentity(id: "A", label: "식당 A")
    static let restaurantB = TDIdentity(id: "B", label: "식당 B")
    static let food = TDIdentity(id: "kimchi", label: "김치찌개")
    static func record(_ id: String, _ meal: String, _ day: Int?, menu: TDIdentity? = menuA,
                       restaurant: TDIdentity? = restaurantA, kinds: [TDIdentity] = [food]) -> TDRecord {
        .init(id: id, mealID: meal, date: day.map(date), menu: menu, restaurant: restaurant, foodKinds: kinds)
    }
    static func observation(_ id: String, _ entry: String, _ facet: TDFacet, _ value: String,
                            attribute: String = "taste.sour", selection: String = "one", target: String = "sauce") -> TDObservation {
        .init(id: id, entryID: entry, facet: facet, attribute: attribute, label: attribute,
              value: value, target: target, phase: "first_bite", selection: selection)
    }
    static func state(_ rows: [TDRecord], _ observations: [TDObservation] = [], window: TDWindow = .all) -> TDState {
        TDDataEngine.prepare(records: rows, observations: observations, window: window, now: date(15), calendar: calendar)
    }
    static func count(_ values: [TDSegment], _ key: String) -> Int { values.first { $0.key == key }?.count ?? 0 }
    static func main() {
        check(TDCategory.allCases.count == 5, "five fixed categories")
        check(TDDimension.allCases.count == 3, "menu restaurant food type")
        let empty = state([])
        check(TDDataEngine.experience(empty).cards.count == 4, "four base experience measurements")
        check(TDDataEngine.experience(empty).discoveries.isEmpty, "no invented discovery")
        let multi = state([record("1", "m", 1), record("2", "m", 1, menu: menuB, restaurant: restaurantB)])
        check(TDDataEngine.meals(multi.selected) == 1, "one meal many dishes")
        check(TDDataEngine.entityGroups(multi.selected, .menu).count == 2, "restaurant-specific menus")
        check(TDDataEngine.entityGroups(multi.selected, .foodKind).count == 1, "food kind separate from menu")
        check(TDDataEngine.entityGroups(multi.selected, .restaurant).count == 2, "restaurant count separate")
        check(state([record("1", "m", 1), record("1", "m", 1)]).records.count == 1, "identical duplicates deduplicated")
        check(state([record("1", "m", 1), record("1", "m", 2)]).records.isEmpty, "conflicting record ID excluded")
        let future = state([record("1", "m", 1), record("2", "m", 16)])
        check(future.records.isEmpty && future.futureIDs.count == 2, "future date excludes entire meal")
        check(state([record("1", "m", 1), record("2", "m", 2)]).unknownDateIDs.count == 2, "conflicting meal dates unknown")
        check(state([record("1", "m", 1), record("2", "m", nil)]).records.allSatisfy { $0.date == nil }, "incomplete date is not inferred")
        let window = TDWindow(label: "fixture", start: date(5), end: date(16))
        let unknown = state([record("1", "m1", nil), record("2", "m2", 8)], window: window)
        check(unknown.selected.count == 1 && unknown.records.count == 2, "undated retained outside period")
        check(!TDDataEngine.events(unknown, dimension: .menu)[0].isFirst, "unknown chronology blocks first")
        let history = state([record("1", "m1", 1), record("2", "m2", 8), record("3", "m3", 10)], window: window)
        check(!TDDataEngine.events(history, dimension: .menu)[0].isFirst, "first reads history before period")
        check(TDDataEngine.events(history, dimension: .menu)[0].repeats == 2, "period repeat count")
        let firstAgain = state([record("1", "m1", 8), record("2", "m2", 10)], window: window)
        check(TDDataEngine.events(firstAgain, dimension: .menu)[0].isFirst, "first in period")
        check(TDDataEngine.events(firstAgain, dimension: .menu)[0].repeats == 1, "first and repeat overlap")
        let sameDay = state([record("1", "m1", 8), record("2", "m2", 8)], window: window)
        check(TDDataEngine.events(sameDay, dimension: .menu)[0].repeats == 1, "same day independent meal repeats")
        let unknownOnly = state([record("1", "m1", nil), record("2", "m2", nil)])
        check(TDDataEngine.events(unknownOnly, dimension: .menu)[0].repeats == 1, "lifetime repeat without invented dates")
        check(!TDDataEngine.events(unknownOnly, dimension: .menu)[0].isFirst, "undated first unknown")
        let missing = state([record("1", "m1", 1, menu: nil, restaurant: nil, kinds: [])])
        check(TDDataEngine.entityGroups(missing.records, .menu).isEmpty, "unknown menu not unique entity")
        check(TDDataEngine.entityGroups(missing.records, .restaurant).isEmpty, "unknown source not restaurant")
        check(TDDataEngine.experience(missing).cards[1].meaning == "연결·분류 확인 필요", "unknown not a factual zero")
        let records = [record("1", "m1", 1), record("2", "m1", 1), record("3", "m2", 2)]
        let rows = [observation("p1", "1", .presence, "present"), observation("p2", "2", .presence, "present"), observation("p3", "3", .presence, "present"),
                    observation("i1", "1", .intensity, "strong"), observation("i2", "2", .intensity, "weak"),
                    observation("l1", "1", .liking, "positive"), observation("l2", "2", .liking, "negative"), observation("f", "1", .fit, "above_preferred")]
        let sensory = state(records, rows)
        check(TDDataEngine.presenceRows(sensory)[0].amount == 2, "presence once per meal and attribute")
        let strength = TDDataEngine.distributionRows(sensory, facet: .intensity)[0].segments
        check(count(strength, "mixed") == 1, "different intensities remain mixed")
        check(count(strength, "missing") == 1, "intensity nonresponse separate")
        let liking = TDDataEngine.distributionRows(sensory, facet: .liking)[0].segments
        check(count(liking, "mixed") == 1, "opposite meal responses preserved")
        check(count(liking, "positive") == 0, "counterevidence not discarded")
        check(count(TDDataEngine.distributionRows(sensory, facet: .fit)[0].segments, "above_preferred") == 1, "fit is its own response")
        check(TDDataEngine.distributionRows(state(records, [observation("i", "1", .intensity, "strong")]), facet: .liking).isEmpty, "intensity cannot create liking")
        check(TDDataEngine.distributionRows(state(records, [observation("f", "1", .fit, "above_preferred")]), facet: .liking).isEmpty, "fit cannot create dislike")
        check(state(records, [observation("x", "1", .liking, "positive"), observation("x", "1", .liking, "negative")]).observations.isEmpty, "conflicting observation ID excluded")
        check(state(records, [observation("x", "missing", .liking, "positive")]).observations.isEmpty, "orphan observation excluded")
        check(state(records, [observation("x", "1", .liking, "strong")]).observations.isEmpty, "wrong scale value excluded")
        let overall = TDDataEngine.preference(state(records, [observation("o1", "1", .overall, "positive"), observation("o2", "2", .overall, "negative")])).cards[0].rows[0]
        check(count(overall.segments, "positive") == 1 && count(overall.segments, "negative") == 1, "overall votes per dish")
        check(count(overall.segments, "missing") == 1, "overall nonresponse explicit")
        let ctx = TDDataEngine.context(state([record("1", "m1", 1)], [observation("l", "1", .liking, "positive")]), attribute: nil, facet: .liking)
        check(ctx.cards.count == 4, "four context measurements")
        check(ctx.cards[1].rows.count == 1, "one condition can be measured")
        let unspecified = state([record("1", "m1", 1)], [observation("l", "1", .liking, "positive", target: "unspecified")])
        check(TDDataEngine.context(unspecified, attribute: nil, facet: .liking).cards[1].rows.isEmpty, "unspecified condition not group")
        let unmatched = state([record("1", "m1", 1)], [observation("l", "1", .liking, "positive", selection: "A"), observation("i", "1", .intensity, "strong", selection: "B")])
        check(TDDataEngine.context(unmatched, attribute: nil, facet: .liking).cards[3].rows.isEmpty, "do not join other selection intensity")
        let matched = state([record("1", "m1", 1)], [observation("l", "1", .liking, "positive"), observation("i", "1", .intensity, "strong")])
        check(TDDataEngine.context(matched, attribute: nil, facet: .liking).cards[3].rows.count == 1, "same selection supports intensity condition")
        let recent = TDWindow.recent(30, now: date(15), calendar: calendar)
        let previous = recent.previous(calendar: calendar)
        check(previous.end == recent.start, "adjacent nonoverlapping windows")
        check(!previous.contains(recent.start) && recent.contains(recent.start), "half-open boundary")
        check(calendar.dateComponents([.day], from: previous.start!, to: previous.end!).day == 30, "equal calendar-day duration")
        check(TDDataEngine.change(empty, calendar: calendar).cards.count == 4, "four change measurements")
        check(TDDataEngine.change(empty, calendar: calendar).cards[2].rows.isEmpty, "missing time rating not zero score")
        let temporal = state([record("old", "m1", 1), record("new", "m2", 10)], [observation("l1", "old", .liking, "positive"), observation("l2", "new", .liking, "negative")], window: window)
        let changes = TDDataEngine.change(temporal, calendar: calendar)
        check(changes.cards[2].rows.count == 2, "same scope separate periods")
        check(changes.cards[2].rows.allSatisfy { $0.detail.contains("자료 부족") }, "sparse response not preference change")
        let unlikeMenus = state([record("old", "m1", 1), record("new", "m2", 10, menu: menuB, restaurant: restaurantB)], [observation("l1", "old", .liking, "positive"), observation("l2", "new", .liking, "negative")], window: window)
        check(TDDataEngine.change(unlikeMenus, calendar: calendar).cards[2].rows.count == 4, "different menus not pooled over time")
        let menus = [TDIdentity(id: "A:1", label: "라멘"), TDIdentity(id: "A:2", label: "교자"), TDIdentity(id: "A:3", label: "밥")]
        var repeated: [TDRecord] = []
        for day in 1...3 { for i in 0..<3 { repeated.append(record("\(day)-\(i)", "m\(day)", day, menu: menus[i])) } }
        let findings = TDDataEngine.experience(state(repeated)).discoveries
        check(findings.contains { $0.title == "한 식당, 여러 메뉴" }, "restaurant menu relationship")
        check(findings.filter { $0.title == "함께 기록한 메뉴" }.count == 3, "menu pairs within independent meals")
        let separate = state([record("1", "m1", 1, menu: menus[0]), record("2", "m2", 1, menu: menus[1])])
        check(!TDDataEngine.experience(separate).discoveries.contains { $0.title == "함께 기록한 메뉴" }, "same date not paired meal")
        var pairs: [TDObservation] = []
        for day in 1...3 { pairs += [observation("s\(day)", "\(day)-0", .presence, "present"), observation("t\(day)", "\(day)-0", .presence, "present", attribute: "texture.crisp")] }
        check(TDDataEngine.sensation(state(repeated, pairs), domain: "맛").discoveries.count == 1, "same dish sensory combination")
        let wrongDish = pairs.map { row in row.attribute == "texture.crisp" ? observation(row.id, row.entryID.replacingOccurrences(of: "-0", with: "-1"), .presence, "present", attribute: row.attribute) : row }
        check(TDDataEngine.sensation(state(repeated, wrongDish), domain: "맛").discoveries.isEmpty, "other dish cannot form combination")
        check(TDDataEngine.result(state(repeated, pairs), category: .experience, calendar: calendar) == TDDataEngine.result(state(Array(repeated.reversed()), Array(pairs.reversed())), category: .experience, calendar: calendar), "input-order determinism")
        check(TDDataEngine.key(["a:b", "c"]) != TDDataEngine.key(["a", "b:c"]), "collision-safe identities")
        for category in TDCategory.allCases {
            let result = TDDataEngine.result(sensory, category: category, calendar: calendar)
            check(result.cards.allSatisfy { !$0.isDiscovery }, "\(category.id) measurement roles")
            check(Set(result.cards.map(\.id)).count == result.cards.count, "\(category.id) unique measurement IDs")
        }
        print("TASTE_DATA_CORE_OK \(checks) assertions")
    }
}
