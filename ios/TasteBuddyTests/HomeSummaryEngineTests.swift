import XCTest
import SwiftUI
import UIKit
@testable import TasteBuddy

final class HomeArchiveSummaryEngineTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_788_768_000)
    private var calendar: Calendar {
        var value = Calendar(identifier: .gregorian)
        value.timeZone = TimeZone(secondsFromGMT: 0)!
        return value
    }

    private func entry(
        daysAgo: Int = 1, mealID: UUID? = nil, menu: String = "국물",
        selection: DiningSensorySelection? = nil, overall: DiningOverallEvaluation? = nil,
        status: DiningEntryFeedbackStatus = .completed, rating: Int = 0
    ) -> DiningEntry {
        let date = now.addingTimeInterval(-Double(daysAgo) * 86_400)
        return DiningEntry(mealID: mealID, restaurant: "기록 식당", menu: menu, observedAt: date,
                           savedAt: date, rating: rating, note: "", sensorySelections: selection.map { [$0] } ?? [],
                           overallEvaluation: overall, feedbackStatus: status)
    }

    private func cards(_ entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot? = nil) throws -> [HomeArchiveCard] {
        let snapshot = try snapshot ?? SensoryAnalysisEngine.analyze(entries: entries)
        return HomeArchiveSummaryEngine.cards(entries: entries, snapshot: snapshot, referenceDate: now, calendar: calendar)
    }

    private func sour(liked: Bool = true, fit: Bool = true) -> DiningSensorySelection {
        .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: liked ? .liked : .disliked,
              intensity: liked ? .medium : .strong, preferenceFit: fit ? (liked ? .justRight : .tooStrong) : nil,
              target: .broth, phase: .duringMeal)
    }

    func testInsightTasteCompositionUsesRelatedCompletedMealsAndDeduplicatesAxes() throws {
        let meal = UUID()
        let first = entry(mealID: meal, selection: sour(liked: false))
        let duplicate = entry(mealID: meal, selection: sour())
        let other = entry(selection: .init(id: "umami-clear", type: .bubble, labelSnapshot: "맑은 감칠맛"))
        let outside = entry(selection: sour())
        let unfinished = entry(selection: sour(), status: .captured)
        let entries = [first, duplicate, other, outside, unfinished]
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        let card = HomeArchiveCard(kind: .record, value: "", detail: "", explanation: "",
                                   entryIDs: [first.id, duplicate.id, other.id, unfinished.id], evidenceIDs: [])
        let distribution = HomeInsightTasteDistribution.make(card: card, entries: entries, snapshot: snapshot, referenceDate: now)
        XCTAssertEqual(distribution.counts, [0, 1, 0, 0, 1, 0])
        XCTAssertEqual(distribution.dotColorIndices.filter { $0 == 1 }.count, 63)
        XCTAssertEqual(distribution.dotColorIndices.filter { $0 == 4 }.count, 63)
        XCTAssertEqual(distribution, HomeInsightTasteDistribution.make(card: card, entries: entries.reversed(), snapshot: snapshot, referenceDate: now))
        XCTAssertEqual(HomeInsightTasteDistribution.make(card: card, entries: [unfinished], snapshot: snapshot, referenceDate: now), .empty)
        XCTAssertEqual(HomeInsightTasteDistribution.make(card: .empty(.record), entries: entries, snapshot: snapshot, referenceDate: now), .empty)
    }

    func testInsightCompositionDoesNotTurnOverallLikingOrMissingEvidenceIntoTaste() throws {
        let liked = entry(overall: .init(response: .veryLiked), rating: 5)
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [liked])
        let card = try XCTUnwrap(cards([liked], snapshot: snapshot).first { $0.kind == .liking })
        let distribution = HomeInsightTasteDistribution.make(card: card, entries: [liked], snapshot: snapshot, referenceDate: now)
        XCTAssertEqual(distribution, .empty)
        XCTAssertEqual(distribution.accessibilitySummary, "확인된 미각 근거 없음")
    }

    func testInsightCompositionOnlyCountsPositivePresenceInSixMappedAxes() {
        let source = entry()
        func observation(_ attribute: String, kind: String = "sensory_presence", value: SensoryValue = .flag(true)) -> SensoryObservation {
            .init(id: UUID().uuidString, experienceID: source.id, foodName: source.menu, recordedAt: source.observedAt,
                  sourceField: "note", kind: kind, attribute: attribute, attributeLabel: "", value: value,
                  scale: "", target: "whole", phase: "during_meal", phrase: "", sourceSpans: [], reference: nil, combinationComponents: [])
        }
        let observations = ["taste.sweet", "taste.sour", "taste.bitter", "taste.salty", "taste.umami", "mouthfeel.fatty"].map { observation($0) }
            + [observation("aroma.roasted"), observation("texture.soft"), observation("trigeminal.heat"),
               observation("taste.sweet", value: .flag(false)), observation("taste.sweet", kind: "attribute_liking", value: .text("positive")),
               observation("taste.sweet", kind: "sensory_intensity", value: .text("strong"))]
        let snapshot = SensoryAnalysisSnapshot(engineVersion: "test", observations: observations, unresolved: [], insights: [],
                                               mainWing: .empty, completedExperienceCount: 1, sourceExperienceCount: 1,
                                               actualApiCalls: 0, needsMeaningReview: false, limits: [])
        let card = HomeArchiveCard(kind: .record, value: "", detail: "", explanation: "", entryIDs: [source.id], evidenceIDs: [])
        XCTAssertEqual(HomeInsightTasteDistribution.make(card: card, entries: [source], snapshot: snapshot, referenceDate: now).counts, [1, 1, 1, 1, 1, 1])
        XCTAssertEqual(HomeInsightTasteDistribution.make(card: card, entries: [source.additionalMenuDraft(id: source.id)], snapshot: snapshot, referenceDate: now), .empty)
        XCTAssertEqual(HomeInsightTasteDistribution.make(card: card, entries: [source], snapshot: snapshot, referenceDate: now.addingTimeInterval(-2 * 86_400)), .empty)
    }

    func testInsightDotAllocationPreservesCompositionAndGroupingAtEveryMotionStage() {
        let distribution = HomeInsightTasteDistribution(counts: [1, 2, 0, 0, 7, 0])
        let colors = distribution.dotColorIndices
        XCTAssertEqual((0..<6).map { axis in colors.filter { $0 == axis }.count }, [13, 25, 0, 0, 88, 0])
        for time in [0.0, 0.3, 0.7, 1.5, 4, 9] {
            let frame = TasteMotionGeometry.insightFrame(time: time, colorIndices: colors)
            XCTAssertEqual(frame.dots.map(\.colorIndex), colors)
            XCTAssertTrue(frame.bridges.allSatisfy { frame.dots[$0.parent].colorIndex == frame.dots[$0.child].colorIndex })
        }
        let frame = TasteMotionGeometry.insightFrame(time: 9, settled: true, alignment: 1, colorIndices: colors)
        let sorted = frame.dots.sorted { atan2($0.point.y - 320, $0.point.x - 320) < atan2($1.point.y - 320, $1.point.x - 320) }
        let changes = sorted.indices.filter { sorted[$0].colorIndex != sorted[($0 + 1) % sorted.count].colorIndex }.count
        XCTAssertEqual(changes, 3)
        XCTAssertEqual(Set(HomeInsightTasteDistribution(counts: [0, 0, 0, 0, 1, 0]).dotColorIndices), [4])
    }

    func testEmptyArchiveKeepsNineCardsWithoutInventingEvidence() throws {
        let result = try cards([])
        XCTAssertEqual(result.map(\.kind), HomeArchiveCard.Kind.allCases)
        XCTAssertEqual(Set(result.map(\.id)).count, 9)
        XCTAssertTrue(result.allSatisfy { $0.isEmpty && $0.evidenceIDs.isEmpty })
        XCTAssertEqual(result.map(\.value), ["기록 없음", "반복 없음", "경험 없음", "호감 기록 없음", "감각 기록 없음", "응답 없음", "데이터 대기 중", "데이터 대기 중", "데이터 대기 중"])
    }

    func testArchiveCountsRecordsAndMealsSeparatelyWithoutInventingTaste() throws {
        let meal = UUID()
        let first = entry(mealID: meal, status: .captured, rating: 5)
        let second = entry(mealID: meal, menu: "샐러드", status: .captured, rating: 5)
        let result = try cards([first, first, second])
        XCTAssertEqual(result.filter { !$0.isEmpty }.map(\.kind), [.record, .experience])
        XCTAssertEqual(result[0].value, "2개 기록")
        XCTAssertEqual(result[0].detail, "1번의 식사")
        XCTAssertEqual(result.first { $0.kind == .experience }?.value, "2개 메뉴")
        XCTAssertTrue(result.allSatisfy { $0.evidenceIDs.isEmpty })
        XCTAssertEqual(try cards([]).map(\.kind), HomeArchiveCard.Kind.allCases)
        XCTAssertEqual(try cards([entry(daysAgo: -1)]).first?.value, "기록 없음")
    }

    func testAllNineCardsUseTBAEvidenceAndStayStableWhenRecordsAreReordered() throws {
        let previous = (100..<103).map { entry(daysAgo: $0, menu: "산미 국물", selection: sour(), overall: .init(response: .liked)) }
        let recent = (1..<4).map { entry(daysAgo: $0, menu: "진한 국물", selection: sour(liked: false), overall: .init(response: .veryLiked)) }
        let other = (4..<7).map {
            entry(daysAgo: $0, menu: "감칠맛 국물", selection: .init(id: "umami-clear", type: .bubble, labelSnapshot: "맑은 감칠맛"))
        }
        let entries = previous + recent + other
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        let result = try cards(entries, snapshot: snapshot)
        XCTAssertEqual(result.map(\.kind), HomeArchiveCard.Kind.allCases)
        XCTAssertEqual(result, try cards(Array(entries.reversed())))
        let sourceIDs = Set(snapshot.observations.map(\.id))
        for card in result.dropFirst(3) {
            XCTAssertFalse(card.evidenceIDs.isEmpty, card.id)
            XCTAssertTrue(card.evidenceIDs.isSubset(of: sourceIDs), card.id)
            XCTAssertTrue(card.entryIDs.isSubset(of: Set(entries.map(\.id))), card.id)
        }
        let liking = try XCTUnwrap(result.first { $0.kind == .liking })
        XCTAssertTrue(snapshot.observations.filter { liking.evidenceIDs.contains($0.id) }.allSatisfy { $0.kind == "overall_liking" })
        let difference = try XCTUnwrap(result.first { $0.kind == .difference })
        XCTAssertEqual(difference.value, "음식 · 호감")
        XCTAssertTrue(difference.detail.hasSuffix("· 아쉬움"))
        XCTAssertTrue(difference.explanation.contains("3번의 식사"))
        XCTAssertEqual(Set(snapshot.observations.filter { difference.evidenceIDs.contains($0.id) }.map(\.kind)), ["overall_liking", "attribute_liking", "sensory_intensity"])
        XCTAssertEqual(result.first { $0.kind == .change }?.detail, "기록 100% → 50%")
    }

    func testFitPresenceAndLegacyRatingNeverCreateLiking() throws {
        let presence = entry(selection: .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미"), rating: 5)
        let fits = (1..<4).map {
            entry(daysAgo: $0, selection: .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", preferenceFit: .justRight))
        }
        let result = try cards([presence] + fits)
        XCTAssertNotNil(result.first { $0.kind == .fit })
        XCTAssertFalse(result.contains { !$0.isEmpty && [.liking, .sensation, .condition, .difference].contains($0.kind) })
        XCTAssertEqual(result.first { $0.kind == .fit }?.detail, "알맞았어요")
    }

    func testSingleAndConflictingSensoryResponsesDoNotBecomeRepeatedPreference() throws {
        let single = try cards([entry(selection: sour(), overall: .init(response: .disliked))])
        XCTAssertEqual(single.first { $0.kind == .sensation }?.detail, "첫 단서")
        XCTAssertEqual(single.first { $0.kind == .condition }?.isEmpty, true)
        XCTAssertEqual(single.first { $0.kind == .liking }?.isEmpty, true)
        let meal = UUID()
        let mixed = try cards([entry(mealID: meal, selection: sour()), entry(mealID: meal, selection: sour(liked: false))])
        XCTAssertEqual(mixed.first { $0.kind == .sensation }?.detail, "평가가 나뉘어요")
        XCTAssertEqual(mixed.first { $0.kind == .repeated }?.isEmpty, true)
        XCTAssertEqual(mixed.first { $0.kind == .condition }?.isEmpty, true)
        XCTAssertEqual(mixed.first { $0.kind == .difference }?.isEmpty, true)
    }

    func testRemovingEvidenceReplacesStalePersonalInterpretationsWithPlaceholders() throws {
        let entries = (1..<4).map { entry(daysAgo: $0, selection: sour(), overall: .init(response: .liked)) }
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        let result = try cards([entries[0]], snapshot: snapshot)
        XCTAssertEqual(result.first { $0.kind == .sensation }?.isEmpty, true)
        XCTAssertEqual(result.first { $0.kind == .fit }?.isEmpty, true)
        XCTAssertEqual(result.first { $0.kind == .condition }?.isEmpty, true)
        XCTAssertEqual(result.first { $0.kind == .liking }?.entryIDs, [entries[0].id])
        XCTAssertEqual(try cards([]).map(\.kind), HomeArchiveCard.Kind.allCases)
    }

    func testChangeNeedsIndependentMealsInBothPeriods() throws {
        let previousMeal = UUID(), recentMeal = UUID()
        let previous = (100..<103).map { entry(daysAgo: $0, mealID: previousMeal, selection: sour()) }
        let recent = (1..<4).map {
            entry(daysAgo: $0, mealID: recentMeal, selection: .init(id: "umami-clear", type: .bubble, labelSnapshot: "맑은 감칠맛"))
        }
        XCTAssertEqual(try cards(previous + recent).first { $0.kind == .change }?.isEmpty, true)
        XCTAssertEqual(try cards(previous).first { $0.kind == .change }?.isEmpty, true)
    }
}

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

final class HomeArchiveMetricsEngineTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_788_768_000)

    private func entry(mealID: UUID? = nil, status: DiningEntryFeedbackStatus = .completed,
                       liking: DiningSensorySelection.Liking? = nil,
                       overall: DiningOverallEvaluation.Response? = nil) -> DiningEntry {
        DiningEntry(mealID: mealID, restaurant: "기록 식당", menu: "국물", observedAt: now.addingTimeInterval(-86_400),
                    savedAt: now.addingTimeInterval(-86_400), rating: 5, note: "",
                    sensorySelections: liking.map {
                        [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: $0)]
                    } ?? [], overallEvaluation: overall.map { .init(response: $0) }, feedbackStatus: status)
    }

    private func metrics(_ entries: [DiningEntry]) throws -> [HomeArchiveMetric] {
        HomeArchiveMetricsEngine.sections(entries: entries,
            snapshot: try SensoryAnalysisEngine.analyze(entries: entries), referenceDate: now).flatMap(\.cards)
    }

    func testEmptyArchiveKeepsAllFixedSlotsWithoutInventingNeutralRatings() throws {
        let cards = try metrics([])
        XCTAssertEqual(cards.map(\.id), ["meals", "menus", "restaurants", "overall"])
        XCTAssertEqual(cards.first { $0.id == "meals" }?.data.title, "0회")
        XCTAssertEqual(cards.first { $0.id == "overall" }?.data.title, "응답 없음")
        XCTAssertTrue(cards.allSatisfy { $0.evidenceIDs.isEmpty })
    }

    func testMealsDeduplicateEntriesAndDoNotTreatAdditionalMenusAsRepeatVisits() throws {
        let mealID = UUID()
        let first = entry(mealID: mealID)
        let second = entry(mealID: mealID, status: .captured)
        let cards = try metrics([first, first, second])
        XCTAssertEqual(cards.first { $0.id == "meals" }?.data.title, "1회")
        XCTAssertEqual(cards.first { $0.id == "restaurants" }?.data.detail, "다시 방문한 식당 0곳 · 전체 기간")
        XCTAssertEqual(cards.first { $0.id == "menus" }?.data.detail, "다시 먹은 메뉴 0가지 · 전체 기간")
        XCTAssertEqual(cards.first { $0.id == "overall" }?.data.title, "응답 없음", "Legacy rating must not become direct overall feedback")
        let repeated = try metrics([first, second, entry()])
        XCTAssertEqual(repeated.first { $0.id == "restaurants" }?.data.detail, "다시 방문한 식당 1곳 · 전체 기간")
        XCTAssertEqual(repeated.first { $0.id == "menus" }?.data.detail, "다시 먹은 메뉴 1가지 · 전체 기간")
    }

    func testConflictingMealRatingsStayMixedAndUnfinishedFeedbackIsExcluded() throws {
        let mealID = UUID()
        let positive = entry(mealID: mealID, overall: .liked)
        let negative = entry(mealID: mealID, overall: .disliked)
        let unfinished = entry(status: .captured, overall: .liked)
        let cards = try metrics([positive, negative, unfinished])
        let overall = try XCTUnwrap(cards.first { $0.id == "overall" })
        XCTAssertEqual(overall.data.title, "1회의 평가")
        XCTAssertTrue(overall.data.detail.contains("평가 나뉨 1 / 1회"))
        XCTAssertFalse(overall.entryIDs.contains(unfinished.id))
        XCTAssertEqual(cards, try metrics([unfinished, negative, positive]))
    }

    func testOnlyDirectOverallFeedbackContributesToSatisfaction() throws {
        let date = now.addingTimeInterval(-86_400)
        let fitOnly = DiningEntry(restaurant: "식당", menu: "국물", observedAt: date, savedAt: date,
            rating: 5, note: "", sensorySelections: [
                .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                      intensity: .strong, preferenceFit: .justRight),
            ], overallEvaluation: .init(response: .veryLiked))
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [fitOnly])
        let cards = HomeArchiveMetricsEngine.sections(entries: [fitOnly], snapshot: snapshot,
                                                       referenceDate: now).flatMap(\.cards)
        let overall = try XCTUnwrap(cards.first { $0.id == "overall" })
        XCTAssertEqual(overall.data.title, "1회의 평가")
        XCTAssertTrue(overall.data.detail.contains("매우 좋음 1"))
        XCTAssertEqual(Set(snapshot.observations.filter { overall.evidenceIDs.contains($0.id) }.map(\.kind)), ["overall_liking"])
        XCTAssertEqual(cards.count, 4, "감각 응답이 있어도 하단 카드 수를 늘리지 않는다.")
        XCTAssertEqual(try metrics([entry(liking: .liked)]).first { $0.id == "overall" }?.data.title, "응답 없음")
    }

    func testDeletedFutureAndNotYetKnownEvidenceCannotContribute() throws {
        let current = entry(overall: .liked)
        let removed = entry(overall: .disliked)
        let future = DiningEntry(restaurant: "미래 식당", menu: "미래 메뉴",
            observedAt: now.addingTimeInterval(86_400), rating: 0, note: "")
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [current, removed])
        let source = try XCTUnwrap(snapshot.observations.first { $0.kind == "overall_liking" && $0.experienceID == current.id })
        var late = source
        late.knownAt = now.addingTimeInterval(60)
        let lateSnapshot = SensoryAnalysisSnapshot(engineVersion: snapshot.engineVersion,
            observations: [late], unresolved: [], insights: [], mainWing: .empty,
            completedExperienceCount: 1, sourceExperienceCount: 1,
            actualApiCalls: 0, needsMeaningReview: false, limits: [])
        let lateCards = HomeArchiveMetricsEngine.sections(entries: [current], snapshot: lateSnapshot,
                                                           referenceDate: now).flatMap(\.cards)
        XCTAssertEqual(lateCards.first { $0.id == "overall" }?.data.title, "응답 없음")
        let cards = HomeArchiveMetricsEngine.sections(entries: [current, future], snapshot: snapshot,
                                                       referenceDate: now).flatMap(\.cards)
        XCTAssertEqual(cards.first { $0.id == "meals" }?.data.title, "1회")
        XCTAssertEqual(cards.first { $0.id == "overall" }?.entryIDs, [current.id])
        XCTAssertTrue(cards.allSatisfy { !$0.entryIDs.contains(removed.id) && !$0.entryIDs.contains(future.id) })
    }

    func testExcludedAndDuplicateEvidenceRespectTBAEligibility() throws {
        let current = entry(overall: .liked)
        let original = try SensoryAnalysisEngine.analyze(entries: [current])
        let source = try XCTUnwrap(original.observations.first { $0.kind == "overall_liking" })
        var snapshot = SensoryAnalysisSnapshot(engineVersion: original.engineVersion,
            observations: original.observations + original.observations,
            unresolved: [], insights: [], mainWing: .empty, completedExperienceCount: 1,
            sourceExperienceCount: 1, actualApiCalls: 0, needsMeaningReview: false, limits: [])
        let cards = HomeArchiveMetricsEngine.sections(entries: [current], snapshot: snapshot,
                                                       referenceDate: now).flatMap(\.cards)
        XCTAssertEqual(cards.first { $0.id == "overall" }?.data.title, "1회의 평가")
        XCTAssertEqual(cards.first { $0.id == "overall" }?.evidenceIDs, [source.id])
        snapshot.personalModel = PersonalTasteModelBuilder.buildRecords(records: [
            .init(observationId: source.id, userId: "other-owner", experienceId: current.id.uuidString,
                  kind: source.kind, attribute: source.attribute, value: source.value, scale: source.scale),
        ], userID: "local-owner")
        let excluded = HomeArchiveMetricsEngine.sections(entries: [current], snapshot: snapshot,
                                                          referenceDate: now).flatMap(\.cards)
        XCTAssertEqual(excluded.first { $0.id == "overall" }?.data.title, "응답 없음")
        XCTAssertTrue(excluded.allSatisfy { !$0.evidenceIDs.contains(source.id) })
    }

    func testSensoryResponsesAndUnsupportedScalesDoNotCreateOverallRatings() {
        let current = entry()
        func observation(_ id: String, kind: String, value: SensoryValue, scale: String) -> SensoryObservation {
            .init(id: id, experienceID: current.id, foodName: current.menu, recordedAt: current.date,
                  sourceField: "note", kind: kind, attribute: "taste.sour", attributeLabel: "신맛",
                  value: value, scale: scale, target: "whole_dish", phase: "unspecified",
                  phrase: "", sourceSpans: [], reference: nil, combinationComponents: [])
        }
        let invalid = observation("invalid", kind: "overall_liking", value: .text("positive"), scale: "unknown")
        let fit = observation("fit", kind: "preference_fit", value: .text("just_right"), scale: "preference-fit-v1")
        let absent = observation("absent", kind: "sensory_presence", value: .flag(false), scale: "boolean")
        let snapshot = SensoryAnalysisSnapshot(engineVersion: "test", observations: [invalid, fit, absent],
            unresolved: [], insights: [], mainWing: .empty, completedExperienceCount: 1,
            sourceExperienceCount: 1, actualApiCalls: 0, needsMeaningReview: false, limits: [])
        let cards = HomeArchiveMetricsEngine.sections(entries: [current], snapshot: snapshot,
                                                       referenceDate: now).flatMap(\.cards)
        XCTAssertEqual(cards.first { $0.id == "overall" }?.data.title, "응답 없음")
        XCTAssertTrue(cards.allSatisfy { $0.evidenceIDs.isEmpty })
    }

    @MainActor
    func testHomeMetricsFitCompactViewportAndRemainReachableByScrolling() async throws {
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let previousWindow = scene.windows.first { $0.isKeyWindow }
        let window = UIWindow(windowScene: scene)
        defer {
            window.isHidden = true
            window.rootViewController = nil
            previousWindow?.makeKey()
        }
        func descendants(_ view: UIView) -> [UIView] { [view] + view.subviews.flatMap(descendants) }
        let evaluated = DiningEntry(restaurant: "기록 식당", menu: "국물",
            observedAt: now.addingTimeInterval(-86_400), savedAt: now.addingTimeInterval(-86_400),
            rating: 0, note: "", sensorySelections: [
                .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                      liking: .liked, intensity: .medium, preferenceFit: .justRight),
            ], overallEvaluation: .init(response: .veryLiked))
        let records = [entry(liking: .liked), entry(liking: .disliked), entry(status: .captured), evaluated]
        for (name, width, entries) in [("empty", 320.0, [DiningEntry]()), ("populated", 402.0, records)] {
            let model = AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: entries)
            for _ in 0..<50 {
                if !model.sensoryAnalysisIsUpdating { break }
                try await Task.sleep(for: .milliseconds(100))
            }
            XCTAssertFalse(model.sensoryAnalysisIsUpdating)
            XCTAssertNil(model.sensoryAnalysisError)
            let host = UIHostingController(rootView: HomeView(showsSearchTrigger: false)
                .environmentObject(model)
                .tbCardBordersVisible(false))
            window.frame = CGRect(x: 0, y: 0, width: width, height: 874)
            window.rootViewController = host
            window.makeKeyAndVisible()
            try await Task.sleep(for: .milliseconds(400))
            host.view.layoutIfNeeded()
            let scroll = try XCTUnwrap(descendants(host.view).compactMap { $0 as? UIScrollView }
                .max { $0.bounds.height < $1.bounds.height })
            XCTAssertLessThanOrEqual(scroll.contentSize.width, scroll.bounds.width + 1,
                                     "응답 분포와 빈 카드가 가로 화면을 벗어나지 않아야 한다.")
            let start = -scroll.adjustedContentInset.top
            let end = scroll.contentSize.height + scroll.adjustedContentInset.bottom - scroll.bounds.height
            XCTAssertGreaterThan(end, start, "고정 지표와 최근 기록까지 스크롤할 수 있어야 한다.")
            let offsets = stride(from: Double(start), to: Double(end), by: Double(scroll.bounds.height) * 0.8)
                .map { CGFloat($0) } + [end]
            for (index, offset) in offsets.enumerated() {
                scroll.setContentOffset(CGPoint(x: 0, y: offset), animated: false)
                try await Task.sleep(for: .milliseconds(120))
                host.view.layoutIfNeeded()
                XCTAssertEqual(scroll.contentOffset.y, offset, accuracy: 1)
                let image = UIGraphicsImageRenderer(bounds: window.bounds).image { _ in
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                let attachment = XCTAttachment(image: image)
                attachment.name = "home-archive-\(name)-\(Int(width))-\(index)"
                attachment.lifetime = .keepAlways
                add(attachment)
            }
        }
    }
}
