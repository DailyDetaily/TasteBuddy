import XCTest
@testable import TasteBuddy

final class GastronomyDataTests: XCTestCase {
    private var calendar: Calendar {
        var c = Calendar(identifier: .gregorian); c.timeZone = TimeZone(secondsFromGMT: 9 * 3600)!; return c
    }
    private var now: Date { calendar.date(from: .init(year: 2026, month: 9, day: 15, hour: 12))! }
    private func date(_ daysAgo: Int) -> Date { calendar.date(byAdding: .day, value: -daysAgo, to: now)! }
    private func record(_ id: String, meal: String? = nil, daysAgo: Int? = 1,
                        menu: String? = "menu-a", restaurant: String? = "restaurant-a", kinds: [String] = ["kind-a"]) -> TDRecord {
        .init(id: id, mealID: meal ?? id, date: daysAgo.map(date),
              menu: menu.map { .init(id: $0, label: $0) }, restaurant: restaurant.map { .init(id: $0, label: $0) },
              foodKinds: kinds.map { .init(id: $0, label: $0) })
    }
    private func observation(_ id: String, entry: String, facet: TDFacet = .presence, value: String? = nil,
                             attribute: String = "taste.sour", reference: String? = nil, selection: String = "choice-a",
                             target: String = "broth", phase: String = "during_meal") -> TDObservation {
        .init(id: id, entryID: entry, facet: facet, attribute: attribute, label: reference ?? attribute,
              value: value ?? (facet == .presence ? "present" : facet == .intensity ? "strong" : facet == .fit ? "just_right" : "positive"),
              target: target, phase: phase, selection: selection, reference: reference, scale: facet.scale, catalogVersion: "catalog/1")
    }
    private func state(_ records: [TDRecord], _ observations: [TDObservation] = [], window: TDWindow = .all,
                       issues: [TDEvidenceIssue] = []) -> TDState {
        TDDataEngine.prepare(records: records, observations: observations, window: window, now: now, calendar: calendar, issues: issues)
    }
    private func count(_ rows: [TDSegment], _ key: String) -> Int { rows.first { $0.key == key }?.count ?? 0 }

    func testValidatedParentLinkDoesNotJoinSiblingsOrDifferentScope() {
        let parent = observation("parent", entry: "a", facet: .liking, selection: "parent")
        var child = observation("intensity", entry: "a", facet: .intensity, selection: "child")
        child.parentSelection = "parent"
        var sibling = observation("sibling", entry: "a", facet: .liking, selection: "sibling")
        sibling.parentSelection = "parent"
        let otherScope = observation("other", entry: "a", facet: .liking, selection: "parent", target: "sauce")
        let index = TDDataEngine.intensityIndex([child])
        XCTAssertEqual(TDDataEngine.linkedIntensity(parent, index: index, issues: []).map(\.id), ["intensity"])
        XCTAssertTrue(TDDataEngine.linkedIntensity(sibling, index: index, issues: []).isEmpty)
        XCTAssertTrue(TDDataEngine.linkedIntensity(otherScope, index: index, issues: []).isEmpty)
        let issue = TDEvidenceIssue(id: "conflict", entryID: "a", facet: .intensity, attribute: "taste.sour", reference: nil, reason: "conflict", selection: "child")
        XCTAssertTrue(TDDataEngine.linkedIntensity(parent, index: index, issues: [issue]).isEmpty)
    }

    func testPendingAromaDoesNotAppearInTasteIntensityDomain() {
        let issue = TDEvidenceIssue(id: "pending", entryID: "a", facet: .intensity, attribute: "aroma.roasted", reference: nil, reason: "pending")
        let s = state([record("a")], issues: [issue])
        XCTAssertTrue(TDDataEngine.distributionRows(s, facet: .intensity, domain: "맛").isEmpty)
        XCTAssertEqual(TDDataEngine.distributionRows(s, facet: .intensity, domain: "향").count, 1)
    }

    func testRestoredRingUsesValidatedPeriodMealsAndPresenceRatherThanRatings() {
        let records = [record("a", meal: "same"), record("b", meal: "same"), record("outside", daysAgo: 100)]
        let observations = [observation("a", entry: "a"), observation("b", entry: "b"),
                            observation("like", entry: "a", facet: .liking, attribute: "taste.sweet"),
                            observation("old", entry: "outside", attribute: "taste.bitter")]
        let summary = TDCategoryRingSummary.make(state(records, observations, window: .recent(30, now: now, calendar: calendar)))
        XCTAssertEqual(summary.mealCount, 1)
        XCTAssertEqual(summary.distribution.counts, [0, 1, 0, 0, 0, 0])
        var conflict = records[0]; conflict.fingerprint = "conflict"
        XCTAssertNil(TDCategoryRingSummary.make(state([records[0], conflict])).mealCount)
    }

    func testArchiveCardPreviewKeepsOneEvaluationScopeAndDoesNotAddOverlappingRows() throws {
        let sample = state([record("a")], [observation("sour", entry: "a", facet: .liking),
                                          observation("sweet", entry: "a", facet: .liking, attribute: "taste.sweet")])
        let card = try XCTUnwrap(TDDataEngine.preference(sample, facet: .liking).cards.first { $0.id == "liking" })
        let display = TDArchiveCardPresentation.make(card, category: .preference)
        XCTAssertEqual(display.archiveChart?.total, 1)
        XCTAssertEqual(display.supportingText, "감각 2가지")
        XCTAssertFalse(display.detail.contains("전체 2개 항목"))
        XCTAssertEqual(card.rows.count, 2, "All scopes remain available in the evidence detail")
    }

    func testChangeCardPreviewMatchesBothPeriodsWithinOneScope() throws {
        let records = [record("a-before", daysAgo: 40), record("a-after"),
                       record("b-before", daysAgo: 40, menu: "menu-b"), record("b-after", menu: "menu-b")]
        let observations = records.flatMap { record in
            [observation("strength-" + record.id, entry: record.id, facet: .intensity),
             observation("liking-" + record.id, entry: record.id, facet: .liking,
                         value: record.id.hasPrefix("b") ? "neutral" : record.id.hasSuffix("before") ? "negative" : "positive")]
        }
        let sample = state(records, observations, window: .recent(30, now: now, calendar: calendar))
        var card = try XCTUnwrap(TDDataEngine.change(sample, calendar: calendar).cards.first { $0.id == "change-liking" })
        guard card.rows.count == 4 else { return XCTFail("Expected two valid comparison scopes, got \(card.rows.count) rows") }
        // Adjacent rows now belong to different scopes; adjacency must not join them.
        card.rows = [card.rows[0], card.rows[2], card.rows[3], card.rows[1]]
        let display = TDArchiveCardPresentation.make(card, category: .change)
        XCTAssertTrue(display.detail.contains("이전: 아쉬움 1\n최근: 좋음 1"), display.detail)
        XCTAssertFalse(display.detail.contains("보통"))
        XCTAssertEqual(display.supportingText, "비교 묶음 2개")
        XCTAssertNil(display.archiveChart, "A lone prior-period distribution would hide the comparison")
        XCTAssertEqual(card.rows.count, 4)
    }

    func testCompactPresenceComparisonPreservesFractionsUnknownsAndSubRoundingChanges() {
        func display(_ comparison: TDComparison, compatible: Bool = true) -> HomePeriodInsightCardData {
            var proof = TDEvidenceBundle()
            proof.conditions["catalogComparable"] = compatible ? "true" : "false"
            let row = TDRow(id: "sour", title: "산미", value: "engine-owned value",
                            evidence: proof, comparison: comparison)
            return TDArchiveCardPresentation.make(
                .init(id: "change-presence", title: "감각 기록의 변화", meaning: "comparison", rows: [row]),
                category: .change)
        }
        let same = display(.init(before: 5, after: 8, beforeDenominator: 5, afterDenominator: 8))
        XCTAssertEqual(same.title, "산미 기록 비율 100% 유지")
        XCTAssertTrue(same.detail.contains("이전 5/5회 → 최근 8/8회"))
        XCTAssertTrue(same.detail.contains("감각을 기록한 식사 기준"))

        let small = display(.init(before: 5_000, after: 5_001, beforeDenominator: 10_000, afterDenominator: 10_000))
        XCTAssertEqual(small.title, "산미 기록 비율 50% → 50%")
        XCTAssertTrue(small.detail.contains("0.1%p 미만 증가"))
        XCTAssertFalse(small.title.contains("유지"), "Rounded equal percentages are not equal source fractions")

        let zero = display(.init(before: 0, after: 0, beforeDenominator: 5, afterDenominator: 8))
        XCTAssertEqual(zero.title, "산미 기록 비율 0% 유지")
        XCTAssertTrue(zero.detail.contains("이전 0/5회 → 최근 0/8회"))

        let missing = display(.init(before: nil, after: 3, beforeDenominator: 0, afterDenominator: 8))
        XCTAssertEqual(missing.title, "산미 기록 비율 — → 38%")
        XCTAssertTrue(missing.detail.contains("이전 비교 자료 부족"))
        XCTAssertFalse(missing.detail.contains("0/0"))
        XCTAssertFalse(missing.title.contains("유지"))

        let incompatible = display(.init(before: 5, after: 8, beforeDenominator: 5, afterDenominator: 8), compatible: false)
        XCTAssertTrue(incompatible.detail.contains("감각 응답 기준 확인 필요"))
        XCTAssertFalse(incompatible.title.contains("유지"))
    }

    func testCompactExperienceKeepsFirstExcludedFromRepeatAndUnknownSeparateFromZero() {
        let sample = state([record("a", daysAgo: 10), record("b", daysAgo: 5), record("c", daysAgo: 1)])
        for dimension in TDDimension.allCases {
            let card = TDDataEngine.eventCard(sample, dimension: dimension, first: false, calendar: calendar)
            let display = TDArchiveCardPresentation.make(card, category: .experience)
            XCTAssertEqual(display.title, "반복 기록 \(dimension.rawValue) 1\(dimension.unit)")
            XCTAssertTrue(display.detail.contains("첫 기록 이후 2회"))
            XCTAssertEqual(card.rows.first?.count, 2)
        }
        let unknown = state([record("unknown", menu: nil, restaurant: nil)])
        let unknownCard = TDDataEngine.experience(unknown).cards.first { $0.id == "measure-메뉴" }!
        let unknownDisplay = TDArchiveCardPresentation.make(unknownCard, category: .experience)
        XCTAssertEqual(unknownDisplay.title, "연결·분류 확인 필요")
        XCTAssertFalse(unknownDisplay.title.contains("0개"))

        let emptyCard = TDDataEngine.experience(state([])).cards.first { $0.id == "measure-메뉴" }!
        let emptyDisplay = TDArchiveCardPresentation.make(emptyCard, category: .experience)
        XCTAssertEqual(emptyDisplay.title, "메뉴 0개")
        XCTAssertEqual(emptyDisplay.detail, "선택 범위의 기록 없음")
    }

    func testCompactResponseCopyRetainsMixedMissingAndUnresolvedCounts() {
        let segments: [TDSegment] = [
            .init(key: "positive", label: "좋음", count: 2),
            .init(key: "mixed", label: "응답 나뉨", count: 1),
            .init(key: "missing", label: "미응답", count: 2),
            .init(key: "unresolved", label: "해석 보류", count: 1),
        ]
        let row = TDRow(id: "sour", title: "산미", value: "engine-owned value",
                        segments: segments, state: .invalidEvidence, count: 3, denominator: 6)
        let card = TDCard(id: "liking", title: "감각별 호감", meaning: "liking",
                          rows: [row], state: .invalidEvidence)
        let display = TDArchiveCardPresentation.make(card, category: .preference)
        XCTAssertEqual(display.title, "산미 호감 · 식사 3회 응답")
        XCTAssertEqual(display.detail, "좋음 2 · 응답 나뉨 1 · 미응답 2 · 응답 확인 필요 1")
        XCTAssertEqual(display.archiveChart?.total, 6)
        XCTAssertEqual(display.state, .insufficient)
        XCTAssertEqual(card.rows[0].segments.map(\.count), [2, 1, 2, 1])
    }

    func testCompactCopyDoesNotCallPendingPresenceMissingOrAnUnclassifiedIssueAnotherSense() {
        let pending = TDEvidenceIssue(id: "pending", entryID: "a", facet: .presence,
                                      attribute: "taste.sour", reference: nil, reason: "matching observation pending")
        let sample = state([record("a")], issues: [pending])
        let card = TDDataEngine.sensation(sample, domain: "맛").cards.first { $0.id == "presence" }!
        let display = TDArchiveCardPresentation.make(card, category: .sensation)
        XCTAssertEqual(display.title, "집계할 감각 기록 없음")
        XCTAssertFalse(display.detail.contains("응답 없음"))

        let unclassified = TDEvidenceIssue(id: "unknown", entryID: "b", facet: .liking,
                                           attribute: nil, reference: nil, reason: "unclassified")
        let mixed = state([record("a"), record("b")], [observation("sour", entry: "a", facet: .liking)], issues: [unclassified])
        let liking = TDDataEngine.preference(mixed).cards.first { $0.id == "liking" }!
        XCTAssertEqual(liking.rows.count, 2)
        XCTAssertEqual(TDArchiveCardPresentation.make(liking, category: .preference).supportingText, "표시 항목 2개")
        var unresolvedOnly = liking
        unresolvedOnly.rows = liking.rows.filter { $0.id == "unclassified" }
        XCTAssertEqual(TDArchiveCardPresentation.make(unresolvedOnly, category: .preference).title, "호감 응답 확인 필요")

        let knownPending = TDEvidenceIssue(id: "known-pending", entryID: "a", facet: .liking,
                                          attribute: "taste.sour", reference: nil, reason: "unrecognized response")
        let knownCard = TDDataEngine.preference(state([record("a")], issues: [knownPending])).cards.first { $0.id == "liking" }!
        let knownDisplay = TDArchiveCardPresentation.make(knownCard, category: .preference)
        XCTAssertEqual(knownDisplay.title, "산미 호감 · 응답 확인 필요")
        XCTAssertFalse(knownDisplay.title.contains("taste.sour"))
    }

    func testMealDishAndDayAreSeparateUnits() {
        let s = state([record("a", meal: "m"), record("b", meal: "m"), record("c", meal: "m"), record("d", meal: "m2")])
        XCTAssertEqual(TDDataEngine.meals(s.selected), 2)
        XCTAssertEqual(s.selected.count, 4)
        XCTAssertEqual(TDDataEngine.experience(s).cards[0].rows[0].count, 2)
    }
    func testDuplicateOriginalIsIdempotentAndConflictingOriginalQuarantinesWholeMeal() {
        let a = record("a", meal: "m"), b = record("b", meal: "m")
        XCTAssertEqual(state([a, a, b]).selected.count, 2)
        var changed = a; changed.fingerprint = "different-original-note"
        let s = state([a, changed, b, record("c")])
        XCTAssertEqual(TDDataEngine.ids(s.selected), ["c"])
        XCTAssertEqual(s.conflictingIDs, ["a", "b"])
    }
    func testDifferentRestaurantsMenusStayDistinctButFoodKindIsShared() {
        let s = state([record("a", menu: "A/김치찌개", restaurant: "A"), record("b", menu: "B/김치찌개", restaurant: "B")])
        XCTAssertEqual(TDDataEngine.entityGroups(s.selected, .menu).count, 2)
        XCTAssertEqual(TDDataEngine.entityGroups(s.selected, .foodKind).count, 1)
    }
    func testUnknownMenuIsNotAZeroKnownMenuCount() throws {
        let s = state([record("a", menu: nil, restaurant: nil)])
        let card = try XCTUnwrap(TDDataEngine.experience(s).cards.first { $0.id == "measure-메뉴" })
        XCTAssertEqual(card.state, .unresolvedIdentity)
        XCTAssertEqual(card.evidence.roles[.unresolved]?.entryIDs, ["a"])
    }
    func testFirstAndRepeatCanBothOccurInPeriod() {
        let s = state([record("a", daysAgo: 5), record("b", daysAgo: 1)], window: .recent(30, now: now, calendar: calendar))
        let event = TDDataEngine.events(s, dimension: .menu)[0]
        XCTAssertTrue(event.isFirst); XCTAssertEqual(event.repeats, 1)
        for dimension in TDDimension.allCases {
            XCTAssertEqual(TDDataEngine.eventCard(s, dimension: dimension, first: true, calendar: calendar).rows.count, 1)
            XCTAssertEqual(TDDataEngine.eventCard(s, dimension: dimension, first: false, calendar: calendar).rows.count, 1)
        }
    }
    func testPreviousPeriodFirstRecordIsCurrentRepeatWithReferenceEvidence() {
        let s = state([record("a", daysAgo: 60), record("b", daysAgo: 1)], window: .recent(30, now: now, calendar: calendar))
        XCTAssertTrue(TDDataEngine.eventCard(s, dimension: .menu, first: true, calendar: calendar).rows.isEmpty)
        let repeatCard = TDDataEngine.eventCard(s, dimension: .menu, first: false, calendar: calendar)
        XCTAssertEqual(repeatCard.rows[0].count, 1)
        XCTAssertEqual(repeatCard.rows[0].evidence.roles[.numerator]?.entryIDs, ["b"])
        XCTAssertEqual(repeatCard.rows[0].evidence.roles[.contextOnly]?.entryIDs, ["a"])
    }
    func testSameFirstDateGivesOneFirstAndMinimumOneRepeat() {
        let s = state([record("a"), record("b")], window: .recent(30, now: now, calendar: calendar))
        let event = TDDataEngine.events(s, dimension: .menu)[0]
        XCTAssertTrue(event.isFirst); XCTAssertEqual(event.repeats, 1)
        XCTAssertEqual(TDDataEngine.eventCard(s, dimension: .menu, first: true, calendar: calendar).rows.count, 1)
    }
    func testSameMenuTwiceInOneMealDoesNotIncreaseRepeat() {
        let s = state([record("a", meal: "m"), record("b", meal: "m")])
        XCTAssertEqual(TDDataEngine.events(s, dimension: .menu)[0].repeats, 0)
    }
    func testUnknownDateBlocksFirstButKeepsAllTimeRepeatAndProvenPeriodRepeat() {
        let rows = [record("a", daysAgo: nil), record("b", daysAgo: 8), record("c", daysAgo: 1)]
        let all = TDDataEngine.events(state(rows), dimension: .menu)[0]
        XCTAssertFalse(all.isFirst); XCTAssertEqual(all.repeats, 2)
        let period = TDDataEngine.events(state(rows, window: .recent(30, now: now, calendar: calendar)), dimension: .menu)[0]
        XCTAssertFalse(period.isFirst); XCTAssertEqual(period.repeats, 1); XCTAssertTrue(period.uncertain)
    }
    func testLateOldMealRecalculatesFirstUsingMealDate() {
        let window = TDWindow.recent(30, now: now, calendar: calendar)
        XCTAssertTrue(TDDataEngine.events(state([record("recent")], window: window), dimension: .menu)[0].isFirst)
        XCTAssertFalse(TDDataEngine.events(state([record("recent"), record("old", daysAgo: 80)], window: window), dimension: .menu)[0].isFirst)
    }
    func testIncompleteOrConflictingMealDatesAreUnknownAndFutureQuarantinesWholeMeal() {
        for second in [record("b", meal: "m", daysAgo: nil), record("b", meal: "m", daysAgo: 2)] {
            let s = state([record("a", meal: "m"), second])
            XCTAssertEqual(s.unknownDateIDs, ["a", "b"])
            XCTAssertEqual(s.records.count, 2)
            XCTAssertTrue(state([record("a", meal: "m"), second], window: .recent(30, now: now, calendar: calendar)).selected.isEmpty)
        }
        let future = state([record("a", meal: "m", daysAgo: -1), record("b", meal: "m")])
        XCTAssertTrue(future.records.isEmpty); XCTAssertEqual(future.futureIDs, ["a", "b"])
    }
    func testCalendarWindowIsHalfOpenAndPreviousHasEqualDays() {
        let window = TDWindow.recent(30, now: now, calendar: calendar)
        XCTAssertTrue(window.contains(window.start)); XCTAssertFalse(window.contains(window.end))
        let previous = window.previous(calendar: calendar)
        XCTAssertEqual(previous.end, window.start)
        XCTAssertEqual(calendar.dateComponents([.day], from: previous.start!, to: previous.end!).day, 30)
        let month = TDPeriodChoice.month.window(now: now, calendar: calendar)
        XCTAssertEqual(calendar.dateComponents([.day], from: month.start!, to: month.end!).day, 15)
        XCTAssertEqual(calendar.dateComponents([.day], from: month.previous(calendar: calendar).start!, to: month.previous(calendar: calendar).end!).day, 15)
    }
    func testIntensityLikingAndFitRemainIndependentIncludingMissingResponses() throws {
        let s = state([record("a")], [observation("presence", entry: "a"), observation("intensity", entry: "a", facet: .intensity)])
        let intensity = try XCTUnwrap(TDDataEngine.distributionRows(s, facet: .intensity).first)
        XCTAssertEqual(count(intensity.segments, "strong"), 1)
        for facet in [TDFacet.liking, .fit] {
            let row = try XCTUnwrap(TDDataEngine.distributionRows(s, facet: facet).first)
            XCTAssertEqual(count(row.segments, "missing"), 1)
            XCTAssertEqual(row.count, 0)
        }
    }
    func testFitDoesNotCreateLiking() throws {
        let s = state([record("a")], [observation("p", entry: "a"), observation("f", entry: "a", facet: .fit)])
        XCTAssertEqual(count(TDDataEngine.distributionRows(s, facet: .fit)[0].segments, "just_right"), 1)
        XCTAssertEqual(count(TDDataEngine.distributionRows(s, facet: .liking)[0].segments, "positive"), 0)
    }
    func testDistinctChoicesCanBeMixedButSameChoiceConflictIsUnresolved() {
        let r = [record("a", meal: "m"), record("b", meal: "m")]
        let values = [observation("a", entry: "a", facet: .intensity, value: "weak"), observation("b", entry: "b", facet: .intensity, value: "strong")]
        XCTAssertEqual(count(TDDataEngine.distributionRows(state(r, values), facet: .intensity)[0].segments, "mixed"), 1)
        let conflict = [values[0], observation("different", entry: "a", facet: .intensity, value: "strong")]
        let rows = TDDataEngine.distributionRows(state(r, conflict), facet: .intensity)
        XCTAssertEqual(count(rows[0].segments, "unresolved"), 1)
        XCTAssertEqual(count(rows[0].segments, "mixed"), 0)
    }
    func testConflictingObservationIDDoesNotBecomeMissingOrNeutral() {
        let values = [observation("same", entry: "a", facet: .liking), observation("same", entry: "a", facet: .liking, value: "negative")]
        let row = TDDataEngine.distributionRows(state([record("a")], values), facet: .liking)[0]
        XCTAssertEqual(count(row.segments, "unresolved"), 1)
        XCTAssertEqual(count(row.segments, "neutral"), 0)
        XCTAssertEqual(count(row.segments, "missing"), 0)
    }
    func testReferenceScaleAndOtherDomainsRemainDistinct() {
        var invalid = observation("invalid", entry: "a", facet: .liking); invalid.scale = "future-scale"
        let values = [observation("x", entry: "a", reference: "A|reference:B"), observation("y", entry: "b", reference: "A"), invalid,
                      observation("other", entry: "c", attribute: "temperature.hot")]
        let s = state([record("a"), record("b"), record("c")], values)
        XCTAssertEqual(TDDataEngine.presenceRows(s, domain: "맛").count, 2)
        XCTAssertEqual(TDDataEngine.presenceRows(s, domain: "기타").count, 1)
        XCTAssertEqual(TDDataEngine.presenceRows(s, domain: "식감").count, 0)
        XCTAssertTrue(s.issues.contains { $0.id == "invalid" })
    }
    func testDomainViewKeepsTheSamePresenceDenominatorAndExactEvidence() {
        let s = state([record("a"), record("b")], [observation("a", entry: "a"), observation("b", entry: "b", attribute: "aroma.roasted")])
        let row = TDDataEngine.presenceRows(s, domain: "맛")[0]
        XCTAssertEqual(row.count, 1); XCTAssertEqual(row.denominator, 2)
        XCTAssertEqual(row.evidence.roles[.numerator]?.entryIDs, ["a"])
        XCTAssertEqual(row.evidence.roles[.denominator]?.entryIDs, ["a", "b"])
        XCTAssertEqual(row.evidence.roles[.numerator]?.observationIDs, ["a"])
    }
    func testOverallUsesDishesRatherThanMealsAndNoLegacyRating() {
        let records = [record("a", meal: "m"), record("b", meal: "m"), record("c", meal: "m")]
        let values = records.map { observation($0.id, entry: $0.id, facet: .overall) }
        let row = TDDataEngine.preference(state(records, values)).cards[0].rows[0]
        XCTAssertEqual(row.count, 3); XCTAssertEqual(row.evidence.unit, .dish)
        XCTAssertEqual(TDDataEngine.preference(state(records)).cards[0].rows[0].count, 0)
    }
    func testOneContextIsMeasuredAndUnansweredContextIsNotInvented() {
        let s = state([record("a")], [observation("a", entry: "a", facet: .liking, target: "sauce", phase: "unspecified")])
        let cards = TDDataEngine.context(s, attribute: nil, facet: .liking).cards
        XCTAssertEqual(cards.first { $0.id == "context-target" }?.rows.count, 1)
        XCTAssertEqual(cards.first { $0.id == "context-phase" }?.rows.count, 0)
    }
    func testIntensityLinkRequiresSameNonemptyChoiceAndPreservesOverlap() {
        for selection in ["", "other-choice"] {
            let values = [observation("l", entry: "a", facet: .liking, selection: selection == "" ? "" : "choice-a"),
                          observation("i", entry: "a", facet: .intensity, selection: selection)]
            XCTAssertTrue(TDDataEngine.context(state([record("a")], values), attribute: nil, facet: .liking).cards.first { $0.id == "context-intensity" }!.rows.isEmpty)
        }
        let values = [observation("a", entry: "a", facet: .liking, target: "sauce"), observation("b", entry: "b", facet: .liking, target: "inside")]
        let card = TDDataEngine.context(state([record("a", meal: "m"), record("b", meal: "m")], values), attribute: nil, facet: .liking).cards.first { $0.id == "context-target" }!
        XCTAssertEqual(card.rows.count, 2); XCTAssertEqual(card.evidence.overlappingMealIDs, ["m"])
    }
    func testPresenceChangeUsesExactFractionsAndSeparatePeriods() {
        let records = (0..<39).map { record("\($0)", daysAgo: $0 < 15 ? 100 : 10) }
        let values = records.enumerated().map { index, r in observation(r.id, entry: r.id, attribute: index < 3 || (index >= 15 && index < 27) ? "taste.sour" : "aroma.roasted") }
        let result = TDDataEngine.change(state(records, values, window: .recent(90, now: now, calendar: calendar)), calendar: calendar)
        let row = result.cards.first { $0.id == "change-presence" }!.rows.first { $0.title == "taste.sour" }!
        XCTAssertEqual(row.comparison?.before, 3); XCTAssertEqual(row.comparison?.beforeDenominator, 15)
        XCTAssertEqual(row.comparison?.after, 12); XCTAssertEqual(row.comparison?.afterDenominator, 24)
        XCTAssertEqual(row.comparison?.percentagePointDifference ?? 0, 30, accuracy: 0.000001)
        XCTAssertEqual(row.evidence.roles[.beforeNumerator]?.entryIDs.count, 3)
        XCTAssertEqual(row.evidence.roles[.denominator]?.entryIDs.count, 24)
    }
    func testNoResponsePeriodDoesNotBecomeZeroPercentAndUnknownMenusAreNotZero() {
        let s = state([record("a", menu: nil, restaurant: nil)], [observation("a", entry: "a")], window: .recent(30, now: now, calendar: calendar))
        let result = TDDataEngine.change(s, calendar: calendar)
        XCTAssertNil(result.cards.first { $0.id == "change-presence" }!.rows[0].comparison?.percentagePointDifference)
        XCTAssertEqual(result.hero.last { !$0.entryIDs.isEmpty }?.state, .unresolvedIdentity)
        XCTAssertNil(result.hero.last { !$0.entryIDs.isEmpty }?.amount)
    }
    func testInputOrderAndDuplicatesPreserveMeasurementsAndEvidence() {
        let records = [record("a"), record("b")], observations = [observation("a", entry: "a"), observation("b", entry: "b")]
        let a = TDDataEngine.sensation(state(records, observations), domain: "맛")
        let b = TDDataEngine.sensation(state(Array(records.reversed()) + [records[0]], Array(observations.reversed()) + [observations[0]]), domain: "맛")
        XCTAssertEqual(a, b)
    }
    func testAllNineteenMeasurementDefinitionsRemainAvailableWithSparseData() {
        let sample = state([record("a")])
        let counts = TDCategory.allCases.map { TDDataEngine.result(sample, category: $0, calendar: calendar).cards.count }
        XCTAssertEqual(counts, [6, 2, 3, 4, 4])
        XCTAssertEqual(counts.reduce(0, +), 19)
    }
}
