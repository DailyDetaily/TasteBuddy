import XCTest
@testable import TasteBuddy

/// 생성 규칙의 의미 계약. 검증용 합성 자료는 앱 화면의 fallback으로 사용하지 않는다.
final class HomeDiscoveryEngineTests: XCTestCase {
    private var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 9 * 3600)!
        return calendar
    }
    private var now: Date { calendar.date(from: .init(year: 2026, month: 9, day: 15, hour: 12))! }

    private func record(meal: UUID = UUID(), restaurant: String = "합성 식당", menu: String = "합성 냉면",
                        daysAgo: Int = 1, confirmed: Bool = true,
                        overall: DiningOverallEvaluation.Response? = nil, captured: Bool = false,
                        selections: [DiningSensorySelection] = [], id: UUID = UUID()) -> DiningEntry {
        let date = calendar.date(byAdding: .day, value: -daysAgo, to: now)!
        return .init(id: id, mealID: meal, restaurant: restaurant, menu: menu,
                     observedAt: min(date, now), savedAt: min(date, now), rating: 5, note: "맛있었다",
                     sensorySelections: selections, overallEvaluation: overall.map { .init(response: $0) },
                     feedbackStatus: captured ? .captured : .completed,
                     mealTime: confirmed ? .init(source: .confirmed, start: date, confirmedAt: now) : nil)
    }

    private func cards(_ entries: [DiningEntry], analyze: Bool = false) throws -> [HomeDiscoveryCard] {
        let snapshot: SensoryAnalysisSnapshot
        if analyze { snapshot = try SensoryAnalysisEngine.analyze(entries: entries) }
        else { snapshot = .empty }
        return HomeDiscoveryEngine.cards(entries: entries, snapshot: snapshot, referenceDate: now, calendar: calendar)
    }

    func testEmptyAndInsufficientRecordsDoNotInventDiscoveries() throws {
        XCTAssertTrue(try cards([]).isEmpty)
        XCTAssertTrue(try cards([record()]).isEmpty)
        XCTAssertTrue(try cards([record(), record()]).isEmpty)
    }

    func testRepeatedMenuNeedsThreeIndependentMeals() throws {
        let sameMeal = UUID()
        XCTAssertFalse(try cards((0..<3).map { _ in record(meal: sameMeal) }).contains { $0.kind == .repeatedMenu })
        let entries = (1...3).map { record(daysAgo: $0) }
        let repeated = try XCTUnwrap(cards(entries).first { $0.kind == .repeatedMenu })
        XCTAssertEqual(repeated.entryIDs, Set(entries.map(\.id)))
        XCTAssertTrue(repeated.title.contains("3번"))
    }

    func testSameMenuNameAtDifferentRestaurantsDoesNotCreateARepeat() throws {
        let entries = (1...3).map { record(restaurant: "식당 \($0)", daysAgo: $0) }
        XCTAssertFalse(try cards(entries).contains { $0.kind == .repeatedMenu })
    }

    func testCollectionNeedsThreeMenusAndMoreThanOneMeal() throws {
        let meal = UUID()
        let oneMeal = (1...3).map { record(meal: meal, menu: "메뉴 \($0)") }
        XCTAssertFalse(try cards(oneMeal).contains { $0.kind == .restaurantCollection })
        let entries = (1...3).map { record(menu: "메뉴 \($0)") }
        let collection = try XCTUnwrap(cards(entries).first { $0.kind == .restaurantCollection })
        XCTAssertEqual(collection.entryIDs, Set(entries.map(\.id)))
        XCTAssertTrue(collection.title.contains("3가지"))
    }

    func testGapUsesTwoConfirmedMealsWithoutClaimingNoMealsBetweenThem() throws {
        let previous = record(daysAgo: 87), latest = record(daysAgo: 1)
        let uncertain = record(daysAgo: 30, confirmed: false)
        let gap = try XCTUnwrap(cards([previous, latest, uncertain]).first { $0.kind == .timeGap })
        XCTAssertTrue(gap.title.contains("86일"))
        XCTAssertEqual(gap.entryIDs, [previous.id, latest.id])
        XCTAssertTrue(gap.explanation.contains("먹지 않았다는 뜻은 아니에요"))
    }

    func testFutureAndConflictingMealDatesCannotCreateTimeDiscoveries() throws {
        let previous = record(daysAgo: 100), future = record(daysAgo: -1)
        XCTAssertFalse(try cards([previous, future]).contains { $0.kind == .timeGap })
        let meal = UUID()
        let conflicting = [record(meal: meal, daysAgo: 1), record(meal: meal, daysAgo: 5)]
        XCTAssertFalse(try cards([previous] + conflicting).contains { $0.kind == .timeGap })
        XCTAssertFalse(try cards([record(confirmed: false), record(daysAgo: 100, confirmed: false)])
            .contains { $0.kind == .timeGap })
    }

    func testLastYearRequiresConfirmedMealDate() throws {
        let lastYear = calendar.date(byAdding: .year, value: -1, to: now)!
        let days = calendar.dateComponents([.day], from: lastYear, to: now).day!
        let dated = record(daysAgo: days), uncertain = record(daysAgo: days, confirmed: false)
        XCTAssertEqual(try cards([dated]).first { $0.kind == .lastYear }?.entryIDs, [dated.id])
        XCTAssertFalse(try cards([uncertain]).contains { $0.kind == .lastYear })
    }

    func testPositiveDiscoveryKeepsTheRatedDenominatorAndOriginalCounterexamples() throws {
        let entries = [record(overall: .liked), record(overall: .veryLiked), record(overall: .liked),
                       record(overall: .disliked), record()]
        let card = try XCTUnwrap(cards(entries, analyze: true).first { $0.kind == .repeatedGoodEvaluation })
        XCTAssertTrue(card.title.contains("3번"))
        XCTAssertTrue(card.detail.contains("직접 평가가 있는 식사 4번"))
        XCTAssertEqual(card.entryIDs, Set(entries.map(\.id)))
        XCTAssertEqual(card.evidenceIDs.count, 4)
    }

    func testLegacyRatingsNotesAndCapturedEvaluationsDoNotCreatePositiveDiscovery() throws {
        XCTAssertFalse(try cards((0..<3).map { _ in record() }, analyze: true)
            .contains { $0.kind == .repeatedGoodEvaluation })
        let captured = (0..<3).map { _ in record(overall: .liked, captured: true) }
        let generated = try cards(captured, analyze: true)
        XCTAssertTrue(generated.contains { $0.kind == .repeatedMenu })
        XCTAssertFalse(generated.contains { $0.kind == .repeatedGoodEvaluation })
    }

    func testConflictingEvaluationsWithinOneMenuMealDoNotCountAsAGoodMeal() throws {
        let meal = UUID()
        let entries = [record(meal: meal, overall: .liked), record(meal: meal, overall: .disliked),
                       record(overall: .liked), record(overall: .liked)]
        XCTAssertFalse(try cards(entries, analyze: true).contains { $0.kind == .repeatedGoodEvaluation })
    }

    func testStaleSnapshotCannotCarryOldGoodEvaluationsIntoAChangedRevision() throws {
        let entries = (0..<3).map { _ in record(overall: .liked) }
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        var changed = entries
        changed[0].memoryRevision = 1
        let result = HomeDiscoveryEngine.cards(entries: changed, snapshot: snapshot, referenceDate: now, calendar: calendar)
        XCTAssertFalse(result.contains { $0.kind == .repeatedGoodEvaluation })
    }

    func testInputOrderAndBackupRoundTripKeepTheSameDiscoveries() throws {
        let entries = [record(daysAgo: 100), record(daysAgo: 5), record(daysAgo: 1)]
        let before = try cards(entries)
        XCTAssertEqual(try cards(Array(entries.reversed())), before)
        let restored = try JSONDecoder().decode([DiningEntry].self, from: JSONEncoder().encode(entries))
        XCTAssertEqual(try cards(restored), before)
    }

    func testExactContentSuppressionExpiresAndRevisionChangesRemainDiscoverable() throws {
        let entries = (1...3).map { record(daysAgo: $0) }
        let original = try XCTUnwrap(cards(entries).first { $0.kind == .repeatedMenu })
        let expiry = now.addingTimeInterval(HomeDiscoveryPresentationPolicy.suppressionInterval)
        let history = [original.revisionKey: expiry]
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.visible([original], hiddenUntil: history, referenceDate: now).isEmpty)
        XCTAssertEqual(HomeDiscoveryPresentationPolicy.visible([original], hiddenUntil: history, referenceDate: expiry), [original])
        var changed = entries
        changed[0].memoryRevision = 1
        let revised = try XCTUnwrap(cards(changed).first { $0.kind == .repeatedMenu })
        XCTAssertEqual(revised.id, original.id)
        XCTAssertNotEqual(revised.revisionKey, original.revisionKey)
        XCTAssertEqual(HomeDiscoveryPresentationPolicy.visible([revised], hiddenUntil: history, referenceDate: now), [revised])
    }

    func testOtherPerspectivesRemainInQueueButHomePreviewDeduplicatesSubjects() throws {
        let entries = [record(daysAgo: 100, overall: .liked), record(daysAgo: 80, overall: .liked), record(daysAgo: 1, overall: .liked)]
        let candidates = try cards(entries, analyze: true)
        XCTAssertGreaterThan(candidates.count, 1)
        let visible = HomeDiscoveryPresentationPolicy.visible(candidates, hiddenUntil: [:], referenceDate: now)
        XCTAssertGreaterThan(visible.count, Set(visible.map(\.subjectID)).count)
        let preview = HomeJournalStackItem.preview(visible.map { .discovery($0) }, limit: 3)
        XCTAssertEqual(preview.count, Set(visible.map(\.subjectID)).count)
    }

    func testStackInterleavesDiscoveriesAndQuestionsAndHandlesEitherEmptySide() throws {
        let card = try XCTUnwrap(cards((1...3).map { record(daysAgo: $0) }).first)
        let question = PersonalTasteNextSelection(id: "synthetic-question", attribute: "taste.sour", label: "신맛",
            facet: "liking", question: "어땠나요?", reason: "", evidenceIDs: [], mealIDs: [], createsEvidence: false,
            intent: "clarification", proposedCondition: nil, unobserved: false)
        let mixed = HomeJournalStackItem.merged(questions: [question], discoveries: [card])
        XCTAssertEqual(mixed.map(\.id), ["discovery:" + card.revisionKey, "question:" + question.id])
        XCTAssertEqual(HomeJournalStackItem.merged(questions: [question], discoveries: []).count, 1)
        XCTAssertEqual(HomeJournalStackItem.merged(questions: [], discoveries: [card]).count, 1)
        XCTAssertTrue(HomeJournalStackItem.merged(questions: [], discoveries: []).isEmpty)
    }

    private func sense(_ liking: DiningSensorySelection.Liking? = .liked,
                       intensity: DiningSensorySelection.Intensity? = nil,
                       fit: DiningSensorySelection.PreferenceFit? = nil,
                       target: DiningSensorySelection.Target = .broth,
                       phase: DiningSensorySelection.Phase = .duringMeal) -> DiningSensorySelection {
        .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: liking,
              intensity: intensity, preferenceFit: fit, target: target, phase: phase)
    }

    private func commonRecords() -> [DiningEntry] {
        (1...3).map { record(menu: "합성 메뉴 \($0 % 2)", daysAgo: $0 + 10, selections: [sense()]) }
    }

    func testCommonPreferenceUsesDirectLikingAndKeepsCounterexamples() throws {
        let negative = record(menu: "합성 메뉴 0", selections: [sense(.disliked)])
        let entries = commonRecords() + [negative]
        let card = try XCTUnwrap(cards(entries, analyze: true).first { $0.kind == .commonPreference })
        XCTAssertTrue(card.detail.contains("4번 중 호감 3번"))
        XCTAssertTrue(card.evidenceSummary.contains("아쉬움 1"))
        XCTAssertTrue(card.entryIDs.contains(negative.id))
        XCTAssertFalse(card.evidenceIDs.isEmpty)
    }

    func testPresenceAndOverallSatisfactionCannotInventIndividualLiking() throws {
        let entries = (1...4).map { record(menu: "메뉴 \($0)", overall: .liked, selections: [sense(nil)]) }
        XCTAssertFalse(try cards(entries, analyze: true).contains { $0.kind == .commonPreference })
    }

    func testCommonPreferenceCountsMealsNotSelectionsOrDishes() throws {
        let meal = UUID()
        let entries = (1...4).map { record(meal: meal, menu: "메뉴 \($0)", selections: [sense(), sense()]) }
        XCTAssertFalse(try cards(entries, analyze: true).contains { $0.kind == .commonPreference })
    }

    func testDifferentTargetsAndPhasesCannotBeMergedIntoACommonPreference() throws {
        let entries = [record(menu: "A", selections: [sense(target: .broth)]),
                       record(menu: "B", selections: [sense(target: .sauce)]),
                       record(menu: "C", selections: [sense(phase: .firstBite)])]
        XCTAssertFalse(try cards(entries, analyze: true).contains { $0.kind == .commonPreference })
    }

    func testCapturedSelectionsAndFutureMealsCannotContributeToPreference() throws {
        let entries = [record(menu: "A", selections: [sense()]), record(menu: "B", selections: [sense()]),
                       record(menu: "C", captured: true, selections: [sense()]),
                       record(menu: "D", daysAgo: -1, selections: [sense()])]
        XCTAssertFalse(try cards(entries, analyze: true).contains { $0.kind == .commonPreference })
    }

    func testUnknownMealDatesCanSupportNonTemporalPreferenceOnly() throws {
        let entries = (1...3).map { record(menu: "메뉴 \($0)", confirmed: false, selections: [sense()]) }
        let result = try cards(entries, analyze: true)
        XCTAssertTrue(result.contains { $0.kind == .commonPreference })
        XCTAssertFalse(result.contains { [.patternException, .periodChange, .familiarTasteInNewMenu].contains($0.kind) })
    }

    func testSameRevisionStaleSelectionIsRejectedAgainstCurrentSource() throws {
        var entries = commonRecords()
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        let old = entries[0]
        entries[0] = record(meal: old.mealID, menu: old.menu, daysAgo: 11, selections: [sense(.disliked)], id: old.id)
        XCTAssertEqual(entries[0].memoryRevisionNumber, old.memoryRevisionNumber)
        let result = HomeDiscoveryEngine.cards(entries: entries, snapshot: snapshot, referenceDate: now, calendar: calendar)
        XCTAssertFalse(result.contains { $0.kind == .commonPreference })
    }

    func testRelationalCardOrderIsStableAcrossInputOrderAndSerialization() throws {
        let entries = commonRecords() + [record(menu: "새 메뉴", overall: .liked, selections: [sense()])]
        let result = try cards(entries, analyze: true)
        XCTAssertEqual(try cards(Array(entries.reversed()), analyze: true), result)
        let restored = try JSONDecoder().decode([DiningEntry].self, from: JSONEncoder().encode(entries))
        XCTAssertEqual(try cards(restored, analyze: true), result)
    }

    func testIntensityFitUsesTheSameMenuAndDoesNotInferLiking() throws {
        let entries = (1...6).map { index in
            record(daysAgo: index, selections: [sense(nil, intensity: index <= 3 ? .medium : .strong,
                                                      fit: index <= 3 ? .justRight : .tooStrong)])
        }
        let result = try cards(entries, analyze: true)
        let card = try XCTUnwrap(result.first { $0.kind == .preferredIntensity })
        XCTAssertTrue(card.detail.contains("중간 강도: 알맞음 3번"))
        XCTAssertTrue(card.detail.contains("강한 강도: 과함 3번"))
        XCTAssertFalse(result.contains { $0.kind == .commonPreference })
    }

    func testOnlyExcessFitDoesNotClaimTheIntensityWasJustRight() throws {
        let entries = (1...3).map { record(daysAgo: $0, selections: [sense(nil, intensity: .strong, fit: .tooStrong)]) }
        let card = try XCTUnwrap(cards(entries, analyze: true).first { $0.kind == .preferredIntensity })
        XCTAssertTrue(card.title.contains("과함"))
        XCTAssertFalse(card.title.contains("알맞았던"))
        XCTAssertTrue(card.detail.contains("강한 강도: 과함 3번"))
    }

    func testFitFromDifferentMenusIsNotAttributedToIntensityAlone() throws {
        let entries = (1...6).map { index in
            record(menu: index <= 3 ? "A" : "B", daysAgo: index,
                   selections: [sense(nil, intensity: index <= 3 ? .medium : .strong,
                                      fit: index <= 3 ? .justRight : .tooStrong)])
        }
        let result = try cards(entries, analyze: true).filter { $0.kind == .preferredIntensity }
        XCTAssertEqual(result.count, 2)
        XCTAssertFalse(result.contains { $0.detail.contains("중간 강도") && $0.detail.contains("강한 강도") })
    }

    func testConditionalContrastNeedsIndependentDisjointMealGroups() throws {
        let a = (1...3).map { record(menu: "A", daysAgo: $0, selections: [sense(.liked)]) }
        let b = (1...3).map { record(menu: "B", daysAgo: $0 + 5, selections: [sense(.disliked)]) }
        let card = try XCTUnwrap(cards(a + b, analyze: true).first { $0.kind == .conditionalContrast })
        XCTAssertTrue(card.detail.contains("좋았어요 3/3번"))
        XCTAssertTrue(card.detail.contains("아쉬웠어요 3/3번"))
        XCTAssertEqual(card.entryIDs.count, 6)
        let paired = (1...3).flatMap { day -> [DiningEntry] in
            let meal = UUID()
            return [record(meal: meal, menu: "A", daysAgo: day, selections: [sense(.liked)]),
                    record(meal: meal, menu: "B", daysAgo: day, selections: [sense(.disliked)])]
        }
        XCTAssertFalse(try cards(paired, analyze: true).contains { $0.kind == .conditionalContrast })
    }

    func testExceptionUsesOnlyEarlierMealsForItsBaseline() throws {
        let previous = (1...4).map { record(daysAgo: $0 + 10, selections: [sense(.disliked)]) }
        let recent = record(selections: [sense(.liked)])
        let card = try XCTUnwrap(cards(previous + [recent], analyze: true).first { $0.kind == .patternException })
        XCTAssertTrue(card.detail.contains("앞선 4번 중"))
        XCTAssertTrue(card.limitations.joined().contains("한 번의 다른 경험"))
        XCTAssertFalse(try cards(Array(previous.prefix(3)) + [recent], analyze: true).contains { $0.kind == .patternException })
    }

    func testExceptionCannotOrderAnUnconfirmedLatestMeal() throws {
        let previous = (1...4).map { record(daysAgo: $0 + 10, selections: [sense(.disliked)]) }
        let recent = record(confirmed: false, selections: [sense(.liked)])
        XCTAssertFalse(try cards(previous + [recent], analyze: true).contains { $0.kind == .patternException })
    }

    func testOverallContrastKeepsTheExactExperiencePairAndLabelsSingleExamples() throws {
        let entry = record(overall: .liked, selections: [sense(.disliked)])
        let card = try XCTUnwrap(cards([entry], analyze: true).first { $0.kind == .overallContrast })
        XCTAssertTrue(card.detail.contains("개별 경험"))
        XCTAssertEqual(card.entryIDs, [entry.id])
        let meal = UUID()
        let separate = [record(meal: meal, menu: "A", selections: [sense(.disliked)]),
                        record(meal: meal, menu: "B", overall: .liked)]
        XCTAssertFalse(try cards(separate, analyze: true).contains { $0.kind == .overallContrast })
    }

    func testDifferentOverallPairsWithinOneMealAreNotARepeatedPair() throws {
        let meal = UUID()
        let entries = [record(meal: meal, menu: "A", overall: .liked, selections: [sense(.disliked)]),
                       record(meal: meal, menu: "B", overall: .disliked, selections: [sense(.liked)])]
        XCTAssertFalse(try cards(entries, analyze: true).contains { $0.kind == .overallContrast })
        let repeated = (1...3).map { record(daysAgo: $0, overall: .liked, selections: [sense(.disliked)]) }
        let card = try XCTUnwrap(cards(repeated, analyze: true).first { $0.kind == .overallContrast })
        XCTAssertTrue(card.detail.contains("반복 관찰"))
    }

    func testRevisitComparisonDoesNotRequireSixtyDaysAndReplacesGapOnlyCard() throws {
        let close = [record(daysAgo: 5, overall: .neutral), record(overall: .liked)]
        XCTAssertTrue(try cards(close, analyze: true).contains { $0.kind == .revisitComparison })
        let far = [record(daysAgo: 100, overall: .disliked), record(overall: .liked)]
        let cards = try cards(far, analyze: true)
        XCTAssertTrue(cards.contains { $0.kind == .revisitComparison })
        XCTAssertFalse(cards.contains { $0.kind == .timeGap })
    }

    func testRevisitComparisonDoesNotOrderTwoMealsOnTheSameDay() throws {
        let entries = [record(overall: .liked), record(overall: .disliked)]
        XCTAssertFalse(try cards(entries, analyze: true).contains { $0.kind == .revisitComparison })
    }

    private func periodRecords(previousMenu: String = "A", recentMenu: String = "A") -> [DiningEntry] {
        let previous = (1...5).map { record(menu: previousMenu, daysAgo: 100 + $0,
                                           selections: [sense($0 == 1 ? .liked : .disliked, intensity: .medium)]) }
        let recent = (1...5).map { record(menu: recentMenu, daysAgo: $0,
                                         selections: [sense($0 == 5 ? .disliked : .liked, intensity: .medium)]) }
        return previous + recent
    }

    func testPeriodComparisonUsesFixedNinetyDayWindowsAndKeepsTheDenominator() throws {
        let card = try XCTUnwrap(cards(periodRecords(), analyze: true).first { $0.kind == .periodChange })
        XCTAssertTrue(card.detail.contains("이전 90일: 호감 1/5번"))
        XCTAssertTrue(card.detail.contains("최근 90일: 호감 4/5번"))
        XCTAssertEqual(card.entryIDs.count, 10)
        XCTAssertFalse(try cards(Array(periodRecords().dropLast()), analyze: true).contains { $0.kind == .periodChange })
    }

    func testDifferentMenuCompositionIsNotAnIndividualTasteChange() throws {
        XCTAssertFalse(try cards(periodRecords(previousMenu: "커피", recentMenu: "디저트"), analyze: true)
            .contains { $0.kind == .periodChange })
    }

    func testOneRecordedDayPerWindowCannotCreatePeriodChange() throws {
        let entries = (0..<10).map { index in
            record(daysAgo: index < 5 ? 100 : 1, selections: [sense(index < 5 ? .disliked : .liked)])
        }
        XCTAssertFalse(try cards(entries, analyze: true).contains { $0.kind == .periodChange })
    }

    func testFirstRecordedMenuConnectsOnlyItsOwnDirectPositiveRatings() throws {
        let earlier = commonRecords()
        let new = record(menu: "새 메뉴", overall: .liked, selections: [sense()])
        let card = try XCTUnwrap(cards(earlier + [new], analyze: true).first { $0.kind == .familiarTasteInNewMenu })
        XCTAssertTrue(card.entryIDs.contains(new.id))
        XCTAssertTrue(card.detail.contains("처음 기록한 메뉴"))
        let unknownPrior = record(menu: "새 메뉴", daysAgo: 50, confirmed: false)
        XCTAssertFalse(try cards(earlier + [new, unknownPrior], analyze: true).contains { $0.kind == .familiarTasteInNewMenu })
        let noOverall = record(menu: "새 메뉴", selections: [sense()])
        XCTAssertFalse(try cards(earlier + [noOverall], analyze: true).contains { $0.kind == .familiarTasteInNewMenu })
    }

    func testFamiliarMenuRetainsCounterexamplesAndDoesNotCherryPickPositiveHistory() throws {
        let earlier = commonRecords()
        let counter = record(menu: "합성 메뉴 0", daysAgo: 20, selections: [sense(.disliked)])
        let new = record(menu: "새 메뉴", overall: .liked, selections: [sense()])
        let card = try XCTUnwrap(cards(earlier + [counter, new], analyze: true)
            .first { $0.kind == .familiarTasteInNewMenu })
        XCTAssertTrue(card.entryIDs.contains(counter.id))
        XCTAssertTrue(card.detail.contains("평가 4번 중 호감 3번"))
        XCTAssertTrue(card.evidenceSummary.contains("아쉬움 1"))
        let moreCounters = (1...3).map { record(menu: "합성 메뉴 0", daysAgo: $0 + 25, selections: [sense(.disliked)]) }
        XCTAssertFalse(try cards(earlier + [counter, new] + moreCounters, analyze: true)
            .contains { $0.kind == .familiarTasteInNewMenu })
    }

    func testReadHistoryIgnoresCosmeticRevisionsAndAdditionalSameDirectionMeals() throws {
        let entries = commonRecords()
        let first = try XCTUnwrap(cards(entries, analyze: true).first { $0.kind == .commonPreference })
        let read = HomeDiscoveryPresentationPolicy.recordingRead(first, in: [:], at: now)
        var edited = entries
        edited[0].note = "사진 설명의 오타를 고쳤어요."
        edited[0].memoryRevision = 1
        let updated = try XCTUnwrap(cards(edited, analyze: true).first { $0.kind == .commonPreference })
        XCTAssertNotEqual(first.revisionKey, updated.revisionKey)
        XCTAssertEqual(first.semanticKey, updated.semanticKey)
        let more = try XCTUnwrap(cards(entries + [record(menu: "합성 메뉴 0", selections: [sense()])], analyze: true)
            .first { $0.kind == .commonPreference })
        XCTAssertEqual(first.semanticKey, more.semanticKey)
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.visible([updated, more], hiddenUntil: read,
            referenceDate: now.addingTimeInterval(40 * 86400)).isEmpty)
    }

    func testNewCounterexampleIsANewMeaningAfterTheSubjectCooldown() throws {
        let entries = commonRecords()
        let first = try XCTUnwrap(cards(entries, analyze: true).first { $0.kind == .commonPreference })
        let read = HomeDiscoveryPresentationPolicy.recordingRead(first, in: [:], at: now)
        let changed = try XCTUnwrap(cards(entries + [record(menu: "합성 메뉴 0", selections: [sense(.disliked)])], analyze: true)
            .first { $0.kind == .commonPreference })
        XCTAssertNotEqual(first.semanticKey, changed.semanticKey)
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.visible([changed], hiddenUntil: read, referenceDate: now).isEmpty)
        XCTAssertEqual(HomeDiscoveryPresentationPolicy.visible([changed], hiddenUntil: read,
            referenceDate: now.addingTimeInterval(25 * 3600)), [changed])
    }

    func testExplicitSnoozeCannotBeBypassedByRevisionOrMeaningChanges() throws {
        let entries = commonRecords()
        let first = try XCTUnwrap(cards(entries, analyze: true).first { $0.kind == .commonPreference })
        let snooze = HomeDiscoveryPresentationPolicy.snoozing(first, in: [:], at: now)
        let changed = try XCTUnwrap(cards(entries + [record(menu: "합성 메뉴 0", selections: [sense(.disliked)])], analyze: true)
            .first { $0.kind == .commonPreference })
        XCTAssertEqual(first.id, changed.id)
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.visible([changed], hiddenUntil: snooze,
            referenceDate: now.addingTimeInterval(6 * 86400)).isEmpty)
        XCTAssertEqual(HomeDiscoveryPresentationPolicy.visible([changed], hiddenUntil: snooze,
            referenceDate: now.addingTimeInterval(7 * 86400)), [changed])
    }

    func testReadDoesNotPermanentlySuppressAnotherPerspectiveOfTheSameSubject() throws {
        let entries = (1...3).map { record(daysAgo: $0, overall: .liked) }
        let result = try cards(entries, analyze: true)
        let readCard = try XCTUnwrap(result.first { $0.kind == .repeatedGoodEvaluation })
        let other = try XCTUnwrap(result.first { $0.kind == .repeatedMenu })
        let history = HomeDiscoveryPresentationPolicy.recordingRead(readCard, in: [:], at: now)
        let visible = HomeDiscoveryPresentationPolicy.visible(result, hiddenUntil: history,
            referenceDate: now.addingTimeInterval(25 * 3600))
        XCTAssertTrue(visible.contains { $0.id == other.id })
        XCTAssertFalse(visible.contains { $0.id == readCard.id })
    }

    func testNonpositivePresentationLimitsAreEmpty() throws {
        let generated = try cards(commonRecords(), analyze: true)
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.visible(generated, hiddenUntil: [:], referenceDate: now, limit: 0).isEmpty)
        XCTAssertTrue(HomeJournalStackItem.preview(generated.map { .discovery($0) }, limit: -1).isEmpty)
    }
}
