import XCTest
@testable import TasteBuddy

final class HomeSummaryEngineTests: XCTestCase {
    func testEmptyEntriesReturnAllSummaryKindsAndExplicitEmptyState() {
        let metrics = HomeSummaryEngine.metrics(for: [])

        XCTAssertEqual(
            metrics.map(\.kind),
            HomeSummaryMetricKind.allCases
        )
        XCTAssertEqual(metrics.count, 6)
        XCTAssertEqual(metrics.first { $0.kind == .record }?.value, "0")
        XCTAssertEqual(
            metrics.first { $0.kind == .frequentMenu }?.state,
            .empty
        )
        XCTAssertEqual(
            metrics.first { $0.kind == .regularRestaurant }?.state,
            .empty
        )
        XCTAssertEqual(
            metrics.first { $0.kind == .tasteDiscovery }?.state,
            .empty
        )
        XCTAssertEqual(
            metrics.first { $0.kind == .breadth }?.state,
            .empty
        )
        XCTAssertEqual(
            metrics.first { $0.kind == .tasteChange }?.state,
            .insufficient
        )
    }

    func testMetricsAggregateRecordsBreadthAndCatalogTasteLabel() {
        let entries = [
            makeEntry(
                restaurant: "온지음",
                menu: "저녁 코스",
                date: date(1),
                tasteExperienceIDs: ["sour-fresh"],
                dishKindIDs: ["broth"]
            ),
            makeEntry(
                restaurant: "온지음",
                menu: "저녁 코스",
                date: date(2),
                tasteExperienceIDs: ["sour-fresh", "umami-clear"],
                dishKindIDs: ["broth", "seafood"]
            ),
            makeEntry(
                restaurant: "밍글스",
                menu: "점심 코스",
                date: date(3),
                tasteExperienceIDs: ["umami-clear"],
                dishKindIDs: ["seafood"]
            ),
        ]

        let metrics = HomeSummaryEngine.metrics(for: entries)
        let record = metric(.record, in: metrics)
        let frequentMenu = metric(.frequentMenu, in: metrics)
        let regularRestaurant = metric(.regularRestaurant, in: metrics)
        let tasteDiscovery = metric(.tasteDiscovery, in: metrics)
        let breadth = metric(.breadth, in: metrics)
        let tasteChange = metric(.tasteChange, in: metrics)

        XCTAssertEqual(record.value, "3")
        XCTAssertEqual(record.detail, "식당 2곳 · 메뉴 2개")
        XCTAssertEqual(frequentMenu.value, "저녁 코스")
        XCTAssertEqual(frequentMenu.detail, "2회 기록")
        XCTAssertEqual(regularRestaurant.value, "온지음")
        XCTAssertEqual(regularRestaurant.detail, "2회 기록")
        XCTAssertEqual(
            tasteDiscovery.value,
            TasteExperienceCatalog.experienceByID["umami-clear"]?.label
        )
        XCTAssertEqual(tasteDiscovery.detail, "2회 등장")
        XCTAssertEqual(breadth.value, "2개 메뉴")
        XCTAssertEqual(breadth.detail, "식당 2곳 · 음식 종류 2개")
        XCTAssertEqual(tasteChange.state, .insufficient)
        XCTAssertTrue(tasteChange.detail.contains("반복 반응"))
    }

    func testSingleRecordUsesEvidenceBasedMetricNames() {
        let metrics = HomeSummaryEngine.metrics(for: [
            makeEntry(
                restaurant: "온지음",
                menu: "저녁 코스",
                date: date(1),
                tasteExperienceIDs: ["sour-fresh"]
            ),
        ])

        XCTAssertEqual(metric(.frequentMenu, in: metrics).title, "최다 기록 메뉴")
        XCTAssertEqual(metric(.regularRestaurant, in: metrics).title, "최다 방문 식당")
        XCTAssertEqual(metric(.tasteDiscovery, in: metrics).title, "최다 미각 단서")
        XCTAssertEqual(metric(.frequentMenu, in: metrics).detail, "처음 기록한 메뉴")
        XCTAssertEqual(metric(.regularRestaurant, in: metrics).detail, "처음 기록한 식당")
    }

    func testJournalBucketsUseCalendarDayBoundariesAndExcludeFutureEntries() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let referenceDate = calendar.date(
            from: DateComponents(
                year: 2026,
                month: 8,
                day: 31,
                hour: 12
            )
        )!
        let entries = [
            makeEntry(restaurant: "오늘", menu: "메뉴", date: shiftedDate(0, from: referenceDate, calendar: calendar)),
            makeEntry(restaurant: "7일 전", menu: "메뉴", date: shiftedDate(7, from: referenceDate, calendar: calendar)),
            makeEntry(restaurant: "8일 전", menu: "메뉴", date: shiftedDate(8, from: referenceDate, calendar: calendar)),
            makeEntry(restaurant: "30일 전", menu: "메뉴", date: shiftedDate(30, from: referenceDate, calendar: calendar)),
            makeEntry(restaurant: "31일 전", menu: "메뉴", date: shiftedDate(31, from: referenceDate, calendar: calendar)),
            makeEntry(restaurant: "미래", menu: "메뉴", date: shiftedDate(-1, from: referenceDate, calendar: calendar)),
        ]

        let buckets = HomeJournalBucketEngine.buckets(
            for: entries,
            referenceDate: referenceDate,
            calendar: calendar
        )

        XCTAssertEqual(buckets.lastSevenDays.map(\.restaurant), ["오늘", "7일 전"])
        XCTAssertEqual(buckets.daysEightThroughThirty.map(\.restaurant), ["8일 전", "30일 전"])
        XCTAssertEqual(buckets.older.map(\.restaurant), ["31일 전"])
    }

    func testTiesPreferTheMostRecentOccurrenceBeforeStableStringOrder() {
        let entries = [
            makeEntry(
                restaurant: "가게 A",
                menu: "메뉴 A",
                date: date(1),
                tasteExperienceIDs: ["sour-fresh"]
            ),
            makeEntry(
                restaurant: "가게 A",
                menu: "메뉴 A",
                date: date(2),
                tasteExperienceIDs: ["sour-fresh"]
            ),
            makeEntry(
                restaurant: "가게 B",
                menu: "메뉴 B",
                date: date(3),
                tasteExperienceIDs: ["umami-clear"]
            ),
            makeEntry(
                restaurant: "가게 B",
                menu: "메뉴 B",
                date: date(4),
                tasteExperienceIDs: ["umami-clear"]
            ),
        ]

        let metrics = HomeSummaryEngine.metrics(for: entries)

        XCTAssertEqual(metric(.frequentMenu, in: metrics).value, "메뉴 B")
        XCTAssertEqual(metric(.regularRestaurant, in: metrics).value, "가게 B")
        XCTAssertEqual(
            metric(.tasteDiscovery, in: metrics).value,
            TasteExperienceCatalog.experienceByID["umami-clear"]?.label
        )
    }

    func testTiesWithTheSameLatestDateUseStableStringOrder() {
        let sameDate = date(10)
        let entries = [
            makeEntry(
                restaurant: "가게 B",
                menu: "메뉴 B",
                date: sameDate
            ),
            makeEntry(
                restaurant: "가게 A",
                menu: "메뉴 A",
                date: sameDate
            ),
        ]

        let metrics = HomeSummaryEngine.metrics(for: entries)

        XCTAssertEqual(metric(.frequentMenu, in: metrics).value, "메뉴 A")
        XCTAssertEqual(metric(.regularRestaurant, in: metrics).value, "가게 A")
    }

    func testRatingDoesNotChangeSummaryMetrics() {
        let id = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
        let lowRating = DiningEntry(
            id: id,
            restaurant: "온지음",
            menu: "저녁 코스",
            date: date(1),
            rating: 1,
            note: "기록",
            tasteExperienceIDs: ["sour-fresh"],
            dishKindIDs: ["broth"]
        )
        let highRating = DiningEntry(
            id: id,
            restaurant: "온지음",
            menu: "저녁 코스",
            date: date(1),
            rating: 5,
            note: "기록",
            tasteExperienceIDs: ["sour-fresh"],
            dishKindIDs: ["broth"]
        )

        XCTAssertEqual(
            HomeSummaryEngine.metrics(for: [lowRating]),
            HomeSummaryEngine.metrics(for: [highRating])
        )
    }

    private func metric(
        _ kind: HomeSummaryMetricKind,
        in metrics: [HomeSummaryMetric]
    ) -> HomeSummaryMetric {
        metrics.first { $0.kind == kind }!
    }

    private func makeEntry(
        restaurant: String,
        menu: String,
        date: Date,
        rating: Int = 3,
        tasteExperienceIDs: [String] = [],
        dishKindIDs: [String] = []
    ) -> DiningEntry {
        DiningEntry(
            restaurant: restaurant,
            menu: menu,
            date: date,
            rating: rating,
            note: "기록",
            tasteExperienceIDs: tasteExperienceIDs,
            dishKindIDs: dishKindIDs
        )
    }

    private func date(_ day: TimeInterval) -> Date {
        Date(timeIntervalSince1970: day * 86_400)
    }

    private func shiftedDate(
        _ daysAgo: Int,
        from referenceDate: Date,
        calendar: Calendar
    ) -> Date {
        calendar.date(byAdding: .day, value: -daysAgo, to: referenceDate)!
    }
}

final class HomePeriodInsightEngineTests: XCTestCase {
    func testRollingWindowsUseCalendarDayBoundariesExcludeFutureAndOverlap() {
        let calendar = utcCalendar()
        let reference = referenceDate(calendar)
        let entries = [
            makeEntry("오늘", "A", daysAgo: 0, reference: reference, calendar: calendar),
            makeEntry("6일", "B", daysAgo: 6, reference: reference, calendar: calendar),
            makeEntry("7일", "C", daysAgo: 7, reference: reference, calendar: calendar),
            makeEntry("29일", "D", daysAgo: 29, reference: reference, calendar: calendar),
            makeEntry("1년", "E", daysAgo: 365, reference: reference, calendar: calendar),
            makeEntry("미래", "F", daysAgo: -1, reference: reference, calendar: calendar),
        ]

        let sections = HomePeriodInsightEngine.sections(for: entries, referenceDate: reference, calendar: calendar)

        XCTAssertEqual(sections.map(\.period), [.lastSevenDays, .lastThirtyDays, .lastTwelveMonths])
        XCTAssertEqual(card(.recordFlow, in: sections[0]).title, "2번 기록")
        XCTAssertTrue(
            card(.recordFlow, in: sections[0]).detail.contains("오늘")
                || card(.recordFlow, in: sections[0]).detail.contains("6일")
        )
        XCTAssertTrue(card(.recordFlow, in: sections[0]).detail.contains("A"))
        XCTAssertEqual(card(.repeatPatterns, in: sections[1]).stats.first { $0.label == "메뉴" }?.value, "4개")
        XCTAssertEqual(card(.experienceBreadth, in: sections[2]).stats.first { $0.label == "메뉴" }?.value, "5개")
        XCTAssertEqual(card(.recordFlow, in: sections[0]).chartValues.count, 7)
        XCTAssertEqual(card(.experienceBreadth, in: sections[2]).chartValues.reduce(0, +), 5)
    }

    func testAllOnceRepeatPatternUsesNeutralFallbackInsteadOfRanking() {
        let calendar = utcCalendar()
        let reference = referenceDate(calendar)
        let entries = [
            makeEntry("식당 A", "메뉴 A", daysAgo: 1, reference: reference, calendar: calendar),
            makeEntry("식당 B", "메뉴 B", daysAgo: 2, reference: reference, calendar: calendar),
        ]

        let repeatCard = card(.repeatPatterns, in: HomePeriodInsightEngine.sections(for: entries, referenceDate: reference, calendar: calendar)[1])

        XCTAssertEqual(repeatCard.title, "새로운 선택 4개")
        XCTAssertEqual(repeatCard.detail, "메뉴 A 외 1개\n식당 A 외 1곳")
        XCTAssertFalse(repeatCard.title.contains("최다"))
        XCTAssertFalse(repeatCard.title.contains("가장 많이"))
    }

    func testRepeatedRankingShowsCoLeadersInsteadOfChoosingArbitraryWinner() {
        let calendar = utcCalendar()
        let reference = referenceDate(calendar)
        let entries = [
            makeEntry("식당 A", "메뉴 A", daysAgo: 1, reference: reference, calendar: calendar),
            makeEntry("식당 B", "메뉴 B", daysAgo: 2, reference: reference, calendar: calendar),
            makeEntry("식당 A", "메뉴 A", daysAgo: 3, reference: reference, calendar: calendar),
            makeEntry("식당 B", "메뉴 B", daysAgo: 4, reference: reference, calendar: calendar),
        ]

        let repeatCard = card(.repeatPatterns, in: HomePeriodInsightEngine.sections(for: entries, referenceDate: reference, calendar: calendar)[1])

        XCTAssertEqual(repeatCard.title, "반복된 선택")
        XCTAssertEqual(repeatCard.detail, "메뉴 A 외 1개 · 2회\n식당 A 외 1곳 · 2회")
        XCTAssertFalse(repeatCard.title.contains("최다"))
    }

    func testUnknownTasteIDsAreIgnoredAndKnownClueUsesEntryShare() {
        let calendar = utcCalendar()
        let reference = referenceDate(calendar)
        let entries = [
            makeEntry("A", "A", daysAgo: 1, reference: reference, calendar: calendar, tastes: ["unknown", " sour-fresh "]),
            makeEntry("B", "B", daysAgo: 2, reference: reference, calendar: calendar, tastes: ["unknown"]),
            makeEntry("C", "C", daysAgo: 3, reference: reference, calendar: calendar, tastes: ["SOUR-FRESH"]),
        ]

        let tasteCard = card(.tasteClue, in: HomePeriodInsightEngine.sections(for: entries, referenceDate: reference, calendar: calendar)[1])

        XCTAssertEqual(tasteCard.stats.first { $0.label == "등장" }?.value, "2회")
        XCTAssertEqual(tasteCard.stats.first { $0.label == "전체 기록" }?.value, "67%")
        XCTAssertEqual(tasteCard.detail, "2회 등장\n기록 비중 67%")
        XCTAssertEqual(tasteCard.accentAxis, .sour)
    }

    func testTasteChangeStaysInsufficientUntilBothWindowsHaveThreeTaggedEntries() {
        let calendar = utcCalendar()
        let reference = referenceDate(calendar)
        let entries = [
            makeEntry("A", "A", daysAgo: 1, reference: reference, calendar: calendar, tastes: ["sour-fresh"]),
            makeEntry("B", "B", daysAgo: 2, reference: reference, calendar: calendar, tastes: ["sour-fresh"]),
            makeEntry("C", "C", daysAgo: 91, reference: reference, calendar: calendar, tastes: ["sour-fresh"]),
            makeEntry("D", "D", daysAgo: 92, reference: reference, calendar: calendar, tastes: ["sour-fresh"]),
            makeEntry("E", "E", daysAgo: 93, reference: reference, calendar: calendar, tastes: ["sour-fresh"]),
        ]

        let changeCard = card(.tasteChange, in: HomePeriodInsightEngine.sections(for: entries, referenceDate: reference, calendar: calendar)[2])

        XCTAssertEqual(changeCard.state, .insufficient)
        XCTAssertTrue(changeCard.title.contains("대기"))
        XCTAssertEqual(changeCard.detail, "직전 90일 · 3/3\n최근 90일 · 2/3")
    }

    func testTasteChangeComparesTaggedEntrySharesAndProducesMonthlyChart() {
        let calendar = utcCalendar()
        let reference = referenceDate(calendar)
        let entries = [
            makeEntry("A", "A", daysAgo: 1, reference: reference, calendar: calendar, tastes: ["sour-fresh"]),
            makeEntry("B", "B", daysAgo: 2, reference: reference, calendar: calendar, tastes: ["sour-fresh"]),
            makeEntry("C", "C", daysAgo: 3, reference: reference, calendar: calendar, tastes: ["sour-fresh"]),
            makeEntry("D", "D", daysAgo: 91, reference: reference, calendar: calendar, tastes: ["umami-clear"]),
            makeEntry("E", "E", daysAgo: 92, reference: reference, calendar: calendar, tastes: ["umami-clear"]),
            makeEntry("F", "F", daysAgo: 93, reference: reference, calendar: calendar, tastes: ["umami-clear"]),
        ]

        let section = HomePeriodInsightEngine.sections(for: entries, referenceDate: reference, calendar: calendar)[2]
        let changeCard = card(.tasteChange, in: section)

        XCTAssertEqual(changeCard.state, .populated)
        XCTAssertTrue(changeCard.title.contains("기록 비중"))
        XCTAssertTrue(changeCard.title.contains("→"))
        XCTAssertEqual(changeCard.chartValues.count, 12)
        XCTAssertNotNil(changeCard.accentAxis)
    }

    private func card(_ kind: HomePeriodInsightKind, in section: HomePeriodInsightSectionData) -> HomePeriodInsightCardData {
        section.cards.first { $0.kind == kind }!
    }

    private func utcCalendar() -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        return calendar
    }

    private func referenceDate(_ calendar: Calendar) -> Date {
        calendar.date(from: DateComponents(year: 2026, month: 8, day: 31, hour: 12))!
    }

    private func makeEntry(
        _ restaurant: String,
        _ menu: String,
        daysAgo: Int,
        reference: Date,
        calendar: Calendar,
        tastes: [String] = []
    ) -> DiningEntry {
        DiningEntry(
            restaurant: restaurant,
            menu: menu,
            date: calendar.date(byAdding: .day, value: -daysAgo, to: reference)!,
            rating: 1,
            note: "기록",
            tasteExperienceIDs: tastes
        )
    }
}
