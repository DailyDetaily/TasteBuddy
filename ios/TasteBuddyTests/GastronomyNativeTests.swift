import XCTest
@testable import TasteBuddy

final class GastronomyNativeTests: XCTestCase {
    func testMinimalDetailDoesNotPlotInvalidOrIncompatibleComparisons() {
        let comparisons: [TDComparison] = [
            .init(before: -1, after: 2),
            .init(before: 4, after: 2, beforeDenominator: 3, afterDenominator: 3),
            .init(before: 1, after: 2, beforeDenominator: 0, afterDenominator: 3),
            .init(before: 1, after: 2, beforeState: .invalidEvidence)
        ]
        for comparison in comparisons {
            let row = TDRow(id: "scope", title: "감각", value: "", comparison: comparison)
            let points = TDDetailPresentation.points(rows: [row], selected: row)
            XCTAssertNil(points.first?.plottedValue)
            XCTAssertNotNil(points.last?.plottedValue)
        }
        var row = TDRow(id: "incompatible", title: "감각", value: "", comparison: .init(before: 1, after: 2))
        row.evidence.conditions["catalogComparable"] = "false"
        XCTAssertTrue(TDDetailPresentation.points(rows: [row], selected: row).allSatisfy { $0.plottedValue == nil })
        XCTAssertEqual(TDDetailPresentation.status(row), "비교 기준 확인 필요")
    }

    func testMinimalDetailKeepsDenominatorAndDistinguishesZeroFromUnknown() {
        let row = TDRow(id: "ratio", title: "감각", value: "", comparison: .init(before: 0, after: 3, beforeDenominator: 4, afterDenominator: 4))
        let points = TDDetailPresentation.points(rows: [row], selected: row)
        XCTAssertEqual(points.first?.plottedValue, 0)
        XCTAssertEqual(points.last?.plottedValue, 75)
        XCTAssertTrue(points.first?.valueLabel.contains("0/4") == true)
        XCTAssertTrue(points.last?.valueLabel.contains("3/4") == true)
        let unknown = TDRow(id: "unknown", title: "감각", value: "", comparison: .init(before: nil, after: 0))
        let unknownPoints = TDDetailPresentation.points(rows: [unknown], selected: unknown)
        XCTAssertNil(unknownPoints.first?.plottedValue)
        XCTAssertEqual(unknownPoints.last?.plottedValue, 0)
    }

    func testMinimalDetailKeepsEssentialStateWithoutGuidanceParagraphs() {
        var row = TDRow(id: "scope", title: "감각", value: "", state: .missingResponse)
        XCTAssertEqual(TDDetailPresentation.status(row), "응답 없음")
        row.state = .ready
        row.evidence.conditions["conditionsConfirmed"] = "false"
        XCTAssertEqual(TDDetailPresentation.status(row), "조건 미확인")
        row.evidence.conditions.removeAll()
        XCTAssertNil(TDDetailPresentation.status(row))
    }

    func testMinimalDetailPlotSeparatesMissingFromZero() {
        let zero = TasteDetailPlotPoint(id: "zero", label: "0", value: 0, valueLabel: "0")
        XCTAssertEqual(zero.plottedValue, 0)
        let missingValues: [Double?] = [nil, -.infinity, .nan, -1]
        for value in missingValues {
            XCTAssertNil(TasteDetailPlotPoint(id: "missing", label: "미확인", value: value, valueLabel: "—").plottedValue)
        }
        XCTAssertNil(TDDetailPresentation.status(.zeroOccurrences))
        XCTAssertEqual(TDDetailPresentation.status(.insufficientComparison), "비교 부족")
    }

    func testMinimalDetailDoesNotSumOverlappingRows() {
        let rows: [TDRow] = [
            .init(id: "a", title: "국물", value: "4회", amount: 4, count: 4),
            .init(id: "b", title: "소스", value: "3회", amount: 3, count: 3)
        ]
        let points = TDDetailPresentation.points(rows: rows, selected: rows[0])
        XCTAssertEqual(points.map(\.plottedValue), [4, 3])
        XCTAssertEqual(points.map(\.id), ["a", "b"])
    }

    func testMinimalDetailComparisonUsesEachPeriodsDenominator() {
        let row = TDRow(id: "comparison", title: "산미", value: "3/6 → 4/8",
                        comparison: .init(before: 3, after: 4, beforeDenominator: 6, afterDenominator: 8))
        XCTAssertEqual(TDDetailPresentation.points(rows: [row], selected: row).map(\.plottedValue), [50, 50])
        var unknown = row
        unknown.comparison?.beforeDenominator = 0
        let points = TDDetailPresentation.points(rows: [unknown], selected: unknown)
        XCTAssertNil(points[0].plottedValue)
        XCTAssertEqual(points[1].plottedValue, 50)
    }

    func testMinimalDetailKeepsMissingResponseBucketsAndNoFakeChangeChart() {
        let row = TDRow(id: "response", title: "호감", value: "응답 2개", segments: [
            .init(key: "positive", label: "좋음", count: 2), .init(key: "missing", label: "미응답", count: 3)
        ])
        XCTAssertEqual(TDDetailPresentation.points(rows: [row], selected: row).map(\.valueLabel), ["2", "3"])
        let before = TDRow(id: "scope:before", title: "이전", value: "2개", segments: row.segments)
        let after = TDRow(id: "scope:after", title: "최근", value: "2개", segments: row.segments)
        XCTAssertTrue(TDDetailPresentation.points(rows: [before, after], selected: before).isEmpty)
    }

    func testTasteDetailPeriodReaggregatesOnlyRecordsInsideSelectedWindow() throws {
        let recent = record(days: 10)
        let older = record(days: 70)
        let oneMonth = TasteDetailPeriod.oneMonth.tdWindow(referenceDate: now, calendar: calendar)
        let (_, monthState) = try input([recent, older], window: oneMonth)
        XCTAssertEqual(Set(monthState.selected.map(\.id)), Set([recent.id.uuidString]))

        let threeMonths = TasteDetailPeriod.threeMonths.tdWindow(referenceDate: now, calendar: calendar)
        let (_, quarterState) = try input([recent, older], window: threeMonths)
        XCTAssertEqual(Set(quarterState.selected.map(\.id)), Set([recent.id.uuidString, older.id.uuidString]))
    }

    func testCardDetailPreservesExactSourcePeriodAndCanReturnToIt() throws {
        let reference = try XCTUnwrap(calendar.date(from: .init(year: 2026, month: 10, day: 2, hour: 12)))
        let september = try XCTUnwrap(calendar.date(from: .init(year: 2026, month: 9, day: 1)))
        let october = try XCTUnwrap(calendar.date(from: .init(year: 2026, month: 10, day: 1)))
        let end = try XCTUnwrap(calendar.date(from: .init(year: 2026, month: 10, day: 3)))
        let windows: [TDWindow] = [.all, .recent(30, now: reference, calendar: calendar),
                                  .recent(90, now: reference, calendar: calendar),
                                  .init(label: "이번 달", start: october, end: end),
                                  .init(label: "지난달", start: september, end: october)]
        for window in windows {
            let request = TDCardDetailRequest(title: "검증 지표", category: .experience, window: window, source: .all,
                domain: "taste", attribute: nil, facet: .overall, contextDimension: "foodKind", heroDimension: .menu,
                referenceDate: reference, timeZoneID: calendar.timeZone.identifier, target: .metric(id: "meals", rowID: nil))
            XCTAssertEqual(request.selectingPeriod(.original).window, window)
            XCTAssertEqual(request.selectingPeriod(.preset(.oneMonth)).window,
                           TasteDetailPeriod.oneMonth.tdWindow(referenceDate: reference, calendar: calendar))
            XCTAssertEqual(request.selectingPeriod(.original).window, window)
            let options = TDCardDetailPeriod.options(original: window, referenceDate: reference, calendar: calendar)
            XCTAssertEqual(options.filter { $0 == .original }.count, 1)
        }
        XCTAssertFalse(TDCardDetailPeriod.options(original: .all, referenceDate: reference, calendar: calendar).contains(.preset(.all)))
    }

    func testDistinctSensoryInstancesDoNotShareIntensityOrQuestions() throws {
        let catalog = try XCTUnwrap(DiningSensoryV2Catalog.shared)
        var liking = try XCTUnwrap(catalog.selection("v2.detail.texture.soft", instanceID: "A"))
        liking.liking = .liked
        var intensity = try XCTUnwrap(catalog.selection("v2.detail.texture.soft", instanceID: "B"))
        intensity.intensity = .strong
        let (_, state) = try input([record(selections: [liking, intensity])])
        let likingRow = try XCTUnwrap(state.observations.first { $0.facet == .liking })
        let intensityRow = try XCTUnwrap(state.observations.first { $0.facet == .intensity })
        XCTAssertNotEqual(likingRow.selection, intensityRow.selection)
        XCTAssertTrue(TDDataEngine.linkedIntensity(likingRow, index: TDDataEngine.intensityIndex(state.observations), issues: state.issues).isEmpty)

        liking.liking = .liked
        intensity.liking = .disliked
        intensity.intensity = nil
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [record(selections: [liking, intensity])])
        let questions = try XCTUnwrap(snapshot.personalModel).availableSelections.filter { $0.facet == "phase" }
        XCTAssertEqual(questions.count, 2)
        XCTAssertEqual(Set(questions.map(\.id)).count, 2)
        let sources = questions.compactMap { question in snapshot.observations.first { $0.id == question.responseSourceID } }
        XCTAssertEqual(Set(sources.compactMap { $0.selectionEvidence?.selectionInstanceID }), Set(["A", "B"]))
    }

    func testCorrectingOneInstanceKeepsTheOtherResponseTimestamp() throws {
        let catalog = try XCTUnwrap(DiningSensoryV2Catalog.shared)
        var first = try XCTUnwrap(catalog.selection("v2.detail.texture.soft", instanceID: "A"))
        var second = try XCTUnwrap(catalog.selection("v2.detail.texture.soft", instanceID: "B"))
        first.intensity = .light
        second.intensity = .light
        let original = record(selections: [first, second]).preparedForInitialSave(at: now)
        first.intensity = .strong
        let changedAt = now.addingTimeInterval(1)
        var payload = try XCTUnwrap(JSONSerialization.jsonObject(with: JSONEncoder().encode(original)) as? [String: Any])
        payload["sensorySelections"] = try JSONSerialization.jsonObject(with: JSONEncoder().encode([first, second]))
        let candidate = try JSONDecoder().decode(DiningEntry.self, from: JSONSerialization.data(withJSONObject: payload))
        let edited = try candidate.preparedForUpdate(previous: original, at: changedAt)
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [edited])
        let observations = snapshot.observations.filter { $0.kind == "sensory_intensity" }
        XCTAssertEqual(observations.first { $0.selectionEvidence?.selectionInstanceID == "A" }?.knownAt, changedAt)
        XCTAssertEqual(observations.first { $0.selectionEvidence?.selectionInstanceID == "B" }?.knownAt, now)
    }

    private var calendar: Calendar { var c = Calendar(identifier: .gregorian); c.timeZone = TimeZone(secondsFromGMT: 9 * 3600)!; return c }
    private var now: Date { calendar.date(from: .init(year: 2026, month: 9, day: 15, hour: 12))! }
    private func date(_ days: Int) -> Date { calendar.date(byAdding: .day, value: -days, to: now)! }
    private func record(meal: UUID = UUID(), restaurant: String? = "restaurant-a", menu: String = "menu-a", days: Int = 1,
                        selections: [DiningSensorySelection] = [], overall: DiningOverallEvaluation.Response? = nil,
                        source: DiningFoodSource? = .init(kind: "restaurant"), kinds: [String] = []) -> DiningEntry {
        .init(mealID: meal, restaurant: "합성 식당", restaurantID: restaurant, menu: menu, menuItemID: menu,
              observedAt: min(date(days), now), savedAt: now, rating: 5, note: "검증용 원문", sensorySelections: selections,
              overallEvaluation: overall.map { .init(response: $0) }, dishKindIDs: kinds, feedbackStatus: .completed,
              mealTime: .init(source: .confirmed, start: date(days), confirmedAt: now), foodSource: source)
    }
    private func sense(_ liking: DiningSensorySelection.Liking? = nil, intensity: DiningSensorySelection.Intensity? = nil,
                       fit: DiningSensorySelection.PreferenceFit? = nil) -> DiningSensorySelection {
        .init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미", liking: liking, intensity: intensity, preferenceFit: fit,
              target: .broth, phase: .duringMeal)
    }
    private func differentSense() throws -> DiningSensorySelection {
        let catalog = try XCTUnwrap(SensoryAnalysisEngine.contract?.selectionCatalog)
        let entry = try XCTUnwrap(catalog.entries.first { $0.type == "bubble" && $0.attribute != "taste.sour" && !$0.attribute.hasSuffix(".unspecified") })
        return .init(id: entry.id, type: .bubble, labelSnapshot: entry.label)
    }
    private func input(_ entries: [DiningEntry], window: TDWindow = .all) throws -> (TDNativeInput, TDState) {
        let snapshot = try SensoryAnalysisEngine.analyze(entries: entries)
        let input = TDNativeAdapter.inputs(entries: entries, snapshot: snapshot, now: now)
        return (input, TDDataEngine.prepare(records: input.records, observations: input.observations, window: window,
                                           now: now, calendar: calendar, issues: input.issues))
    }
    private func cards(_ entries: [DiningEntry], window: TDWindow = .all) throws -> [HomeDiscoveryCard] {
        let (input, state) = try input(entries, window: window)
        return HomeDiscoveryEngine.gastronomyCards(input: input, state: state, calendar: calendar)
    }
    private func detailRequest(_ target: TDCardDetailRequest.Target, category: TDCategory = .experience,
                               source: TDSourceFilter = .all) -> TDCardDetailRequest {
        .init(title: "검증 지표", category: category, window: .all, source: source,
              domain: "taste", attribute: nil, facet: .overall, contextDimension: "foodKind", heroDimension: .menu,
              referenceDate: now, timeZoneID: calendar.timeZone.identifier, target: target)
    }

    func testCardDetailMatchesSourceMeasurementInEveryCategory() throws {
        let (input, state) = try input((1...6).map { record(days: $0, selections: [sense(.liked, intensity: .strong, fit: .justRight)], overall: .liked) })
        for category in TDCategory.allCases {
            let result = TDDataEngine.result(state, category: category, domain: "taste", attribute: nil, facet: .overall,
                                             calendar: calendar, contextDimension: "foodKind", heroDimension: .menu)
            for card in result.cards {
                let request = detailRequest(.metric(id: card.id, rowID: nil), category: category)
                let resolved = try XCTUnwrap(TDCardDetailResolver.resolve(request, input: input).selection, card.id)
                XCTAssertEqual(resolved.title, card.title, card.id)
                XCTAssertEqual(resolved.meaning, card.meaning, card.id)
                XCTAssertEqual(resolved.rows, card.rows, card.id)
                XCTAssertEqual(resolved.evidence, card.evidence, card.id)
            }
        }
    }

    func testCardDetailKeepsFirstAndRepeatDimension() throws {
        let (input, state) = try input((1...4).map { record(days: $0) })
        for dimension in TDDimension.allCases {
            for first in [true, false] {
                let card = TDDataEngine.eventCard(state, dimension: dimension, first: first, calendar: calendar)
                let request = detailRequest(.metric(id: (first ? "first/" : "repeat/") + dimension.id, rowID: nil))
                let result = try XCTUnwrap(TDCardDetailResolver.resolve(request, input: input).selection)
                XCTAssertEqual(result.rows, card.rows)
                XCTAssertEqual(result.evidence, card.evidence)
            }
        }
    }

    func testCardDetailKeepsSourceFilterAndResolvesDeletedRecordsAgain() throws {
        let restaurant = record(), home = record(source: .init(kind: "homeCooked", homeCookingID: "recipe-a"))
        let (fullInput, _) = try input([restaurant, home])
        for source in TDSourceFilter.allCases {
            let request = detailRequest(.metric(id: "all-records", rowID: nil), source: source)
            let result = try XCTUnwrap(TDCardDetailResolver.resolve(request, input: fullInput).selection)
            let expected = TDDataEngine.prepare(records: fullInput.records, observations: fullInput.observations, window: .all,
                                                now: now, calendar: calendar, issues: fullInput.issues, sourceFilter: source)
            XCTAssertEqual(result.rows.first?.entryIDs, TDDataEngine.ids(expected.selected))
            XCTAssertEqual(result.evidence.sourceFilter, source)
        }
        let request = detailRequest(.metric(id: "all-records", rowID: nil))
        let (remainingInput, _) = try input([home])
        let refreshed = try XCTUnwrap(TDCardDetailResolver.resolve(request, input: remainingInput).selection)
        XCTAssertEqual(refreshed.rows.first?.entryIDs, [home.id.uuidString])
        XCTAssertFalse(refreshed.rows.flatMap(\.entryIDs).contains(restaurant.id.uuidString))
    }

    func testCardDetailNeverWidensMissingMetricOrRowToAllRecords() throws {
        let (input, _) = try input([record()])
        XCTAssertNil(TDCardDetailResolver.resolve(detailRequest(.metric(id: "removed-metric", rowID: nil)), input: input).selection)
        XCTAssertNil(TDCardDetailResolver.resolve(detailRequest(.metric(id: "meals", rowID: "removed-row")), input: input).selection)
    }

    func testCardDetailDiscoveryUsesCurrentAccountAndCurrentCandidates() throws {
        // Common preference is an active discovery. A single repeated menu is now
        // intentionally excluded from this route, so it cannot exercise resolution.
        let records = (1...6).map {
            record(menu: $0 <= 3 ? "menu-a" : "menu-b", days: $0,
                   selections: [sense(.liked, intensity: .strong)])
        }
        let (input, state) = try input(records)
        let candidates = HomeDiscoveryEngine.gastronomyCards(input: input, state: state, calendar: calendar)
        XCTAssertFalse(candidates.isEmpty)
        let (emptyInput, _) = try self.input([])
        let account = UUID()
        for card in candidates {
            let request = detailRequest(.discovery(id: card.id))
            let resolved = try XCTUnwrap(TDCardDetailResolver.resolve(request, input: input, account: account).discovery)
            XCTAssertEqual(resolved.semanticKey, card.semanticKey)
            XCTAssertEqual(resolved.accountGeneration, account)
            XCTAssertEqual(resolved.entryIDs, card.entryIDs)
            XCTAssertNil(TDCardDetailResolver.resolve(request, input: emptyInput, account: account).discovery)
        }
    }

    func testOriginalConflictIsCaughtBeforeLegacyNormalizerDropsIt() throws {
        let a = record(meal: UUID()), b = record(meal: UUID())
        var duplicate = a; duplicate.note = "서로 다른 원본"
        let sibling = record(meal: a.mealID, menu: "sibling")
        let (input, state) = try input([a, duplicate, sibling, b])
        XCTAssertEqual(state.selected.map(\.id), [b.id.uuidString])
        XCTAssertEqual(state.conflictingIDs, [a.id.uuidString, sibling.id.uuidString])
        XCTAssertFalse(input.nativeObservations.contains { $0.experienceID == a.id || $0.experienceID == sibling.id })
    }
    func testUnlinkedRestaurantIsPreservedWithoutInflatingIdentityCounts() throws {
        let (input, state) = try input([record(restaurant: nil), record(restaurant: nil)])
        XCTAssertEqual(input.records.count, 2)
        XCTAssertTrue(input.records.allSatisfy { $0.restaurant == nil && $0.menu == nil })
        XCTAssertEqual(TDDataEngine.experience(state).cards.first { $0.id == "measure-식당" }?.state, .unresolvedIdentity)
    }
    func testProviderNamespacesPreventIdentifierCollisions() throws {
        let a = record(restaurant: "42", source: .init(kind: "restaurant", restaurantNamespace: "provider-a"))
        let b = record(restaurant: "42", source: .init(kind: "restaurant", restaurantNamespace: "provider-b"))
        let (_, state) = try input([a, b])
        XCTAssertEqual(TDDataEngine.entityGroups(state.selected, .restaurant).count, 2)
        XCTAssertEqual(TDDataEngine.entityGroups(state.selected, .menu).count, 2)
    }
    func testExplicitHomeCookingRequiresIdentityAndIsNeverARestaurant() throws {
        let unknown = record(source: .init(kind: "homeCooked"))
        let identified = record(menu: "직접 만든 국수", source: .init(kind: "homeCooked", homeCookingID: "recipe-a"))
        let (_, state) = try input([unknown, identified])
        XCTAssertEqual(state.selected.count, 2)
        XCTAssertEqual(TDDataEngine.entityGroups(state.selected, .restaurant).count, 0)
        XCTAssertEqual(TDDataEngine.entityGroups(state.selected, .menu).count, 1)
    }
    func testLegacySourceStaysUnknownAndNewSourceSurvivesStorageCopies() throws {
        let legacy = record(source: nil)
        let (input, _) = try input([legacy])
        XCTAssertEqual(input.records[0].source, .unknown)
        let home = record(source: .init(kind: "homeCooked", homeCookingID: "recipe-a"))
        let decoded = try JSONDecoder().decode(DiningEntry.self, from: JSONEncoder().encode(home))
        XCTAssertEqual(decoded.foodSource, home.foodSource)
        XCTAssertEqual(home.additionalMenuDraft().foodSource?.kind, "homeCooked")
        XCTAssertNil(home.additionalMenuDraft().foodSource?.homeCookingID)
    }
    func testUnknownClassificationIsNotInventedFromMenuName() throws {
        var entry = record(menu: "김치찌개")
        // Use the public initializer to supply the explicitly unknown classification.
        entry = .init(id: entry.id, mealID: entry.mealID, restaurant: entry.restaurant, restaurantID: entry.restaurantID,
                      menu: entry.menu, observedAt: entry.observedAt, rating: 5, note: "", dishKindIDs: ["not-a-valid-kind"], mealTime: entry.mealTime)
        let (input, _) = try input([entry])
        XCTAssertTrue(input.records[0].foodKinds.isEmpty)
        XCTAssertTrue(input.records[0].classificationUnresolved)
    }
    func testCurrentParserKindIsCountedWithoutInferringLikingOrFit() throws {
        let entry = record(selections: [sense(nil, intensity: .strong)])
        let (_, state) = try input([entry])
        let row = try XCTUnwrap(TDDataEngine.distributionRows(state, facet: .intensity).first)
        XCTAssertEqual(row.segments.first { $0.key == "strong" }?.count, 1)
        XCTAssertEqual(TDDataEngine.distributionRows(state, facet: .liking).first?.count, 0)
        XCTAssertEqual(TDDataEngine.distributionRows(state, facet: .fit).first?.count, 0)
    }
    func testCurrentValidatedParentSelectionLinksItsIntensityAndLiking() throws {
        let catalog = try XCTUnwrap(SensoryAnalysisEngine.contract?.selectionCatalog)
        let definition = try XCTUnwrap(catalog.entries.first { $0.contextRole == "intensity" && $0.intrinsicIntensity != nil })
        let child = DiningSensorySelection(id: definition.id, type: .detailTag, labelSnapshot: definition.label, relatedBubbleID: "sour-fresh")
        let (_, state) = try input([record(selections: [sense(.liked), child])])
        let parent = try XCTUnwrap(state.observations.first { $0.facet == .liking })
        let linked = TDDataEngine.linkedIntensity(parent, index: TDDataEngine.intensityIndex(state.observations), issues: state.issues)
        XCTAssertEqual(linked.count, 1)
        XCTAssertEqual(linked.first?.value, definition.intrinsicIntensity)
        XCTAssertNotNil(linked.first?.parentSelection)
        let (_, unlinkedState) = try input([record(selections: [child])])
        XCTAssertTrue(unlinkedState.observations.allSatisfy { $0.parentSelection == nil })
        let repeated = (1...3).map { record(days: $0, selections: [sense(nil, fit: .justRight), child]) }
        let finding = try XCTUnwrap(cards(repeated).first { $0.kind == .preferredIntensity })
        XCTAssertEqual(finding.evidenceBundle?.roles[.numerator]?.mealIDs.count, 3)
    }
    func testFreeNoteRemainsInFullAnalysisWithoutBecomingAChoiceMeasurementIssue() throws {
        var entry = record()
        entry.note = "산미가 좋았습니다."
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [entry])
        XCTAssertTrue(snapshot.observations.contains { $0.sourceField == "note" && $0.kind == "attribute_liking" })
        XCTAssertFalse(try XCTUnwrap(snapshot.personalModel).units.isEmpty)
        let input = TDNativeAdapter.inputs(entries: [entry], snapshot: snapshot, now: now)
        XCTAssertTrue(input.observations.isEmpty)
        XCTAssertTrue(input.issues.isEmpty)
        XCTAssertEqual(input.entries.first?.note, entry.note)
    }

    func testFreeNoteDoesNotQuarantineAValidChoiceForTheSameSensation() throws {
        var entry = record(selections: [sense(.liked)])
        entry.note = "산미가 좋았습니다."
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [entry])
        XCTAssertTrue(snapshot.observations.contains { $0.sourceField == "note" && $0.attribute == "taste.sour" })
        let input = TDNativeAdapter.inputs(entries: [entry], snapshot: snapshot, now: now)
        XCTAssertTrue(input.issues.isEmpty)
        XCTAssertTrue(input.nativeObservations.allSatisfy { $0.selectionEvidence != nil })
        let state = TDDataEngine.prepare(records: input.records, observations: input.observations, window: .all,
                                         now: now, calendar: calendar, issues: input.issues)
        let distribution = try XCTUnwrap(TDDataEngine.distributionRows(state, facet: .liking).first)
        XCTAssertEqual(distribution.count, 1)
        XCTAssertEqual(distribution.segments.first { $0.key == "positive" }?.count, 1)
        XCTAssertEqual(distribution.segments.first { $0.key == "unresolved" }?.count, 0)
        let sources = HomeArchiveSources(validated: input, state: state)
        XCTAssertTrue(sources.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sour" })
    }

    func testFreeNoteDoesNotHidePendingStructuredResponsesWhenAnalysisIsMissing() {
        var entry = record(selections: [sense(.liked)])
        entry.note = "산미가 좋았습니다."
        let input = TDNativeAdapter.inputs(entries: [entry], snapshot: .empty, now: now)
        XCTAssertTrue(input.observations.isEmpty)
        XCTAssertTrue(input.issues.contains { $0.facet == .liking && $0.reason == "직접 응답의 유효 관찰 확인 필요" })
    }

    func testDiscoveryPreservesChoiceEvidenceAndDisclosesNoteScope() throws {
        let entries = (1...3).map { day -> DiningEntry in
            var entry = record(menu: "menu-\(day % 2)", days: day, selections: [sense(.liked)])
            entry.note = "산미가 좋았습니다."
            return entry
        }
        let (input, state) = try input(entries)
        let finding = try XCTUnwrap(HomeDiscoveryEngine.gastronomyCards(input: input, state: state, calendar: calendar)
            .first { $0.kind == .commonPreference })
        XCTAssertTrue(finding.limitations.contains(TDNativeAdapter.sensoryEvidenceScopeDescription))
        XCTAssertFalse(finding.evidenceIDs.isEmpty)
        XCTAssertTrue(finding.evidenceIDs.isSubset(of: Set(input.nativeObservations.map(\.id))))
        XCTAssertTrue(input.nativeObservations.allSatisfy { $0.sourceField != "note" && $0.selectionEvidence != nil })
    }

    func testChangedDirectChoiceRejectsStaleSameRevisionSnapshot() throws {
        let old = record(selections: [sense(.liked)])
        let snapshot = try SensoryAnalysisEngine.analyze(entries: [old])
        let changed = DiningEntry(id: old.id, mealID: old.mealID, restaurant: old.restaurant, restaurantID: old.restaurantID,
                                  menu: old.menu, observedAt: old.observedAt, rating: 5, note: old.note,
                                  sensorySelections: [sense(.disliked)], mealTime: old.mealTime)
        let input = TDNativeAdapter.inputs(entries: [changed], snapshot: snapshot, now: now)
        XCTAssertFalse(input.observations.contains { $0.facet == .liking && $0.value == "positive" })
        XCTAssertTrue(input.issues.contains { $0.facet == .liking })
    }
    func testConflictingRawChoiceIsUnresolvedRatherThanMixed() throws {
        let entry = record(selections: [sense(.liked), sense(.disliked)])
        let (_, state) = try input([entry])
        let rows = TDDataEngine.distributionRows(state, facet: .liking)
        XCTAssertTrue(rows.contains { row in row.segments.contains { $0.key == "unresolved" && $0.count == 1 } })
        XCTAssertFalse(rows.contains { row in row.segments.contains { $0.key == "mixed" && $0.count > 0 } })
    }
    func testMenuPairRequiresThreeMealsAndKeepsDenominatorAndSingleRecords() throws {
        var entries: [DiningEntry] = []
        for day in 1...3 { let meal = UUID(); entries += [record(meal: meal, menu: "A", days: day), record(meal: meal, menu: "B", days: day)] }
        XCTAssertFalse(try cards(Array(entries.prefix(4))).contains { $0.kind == .menuCooccurrence })
        entries.append(record(menu: "A", days: 10))
        let generated = try cards(entries).filter { $0.kind == .menuCooccurrence }
        XCTAssertEqual(generated.count, 1)
        let proof = try XCTUnwrap(generated.first?.evidenceBundle)
        XCTAssertEqual(proof.roles[.numerator]?.mealIDs.count, 3)
        XCTAssertEqual(proof.roles[.denominator]?.mealIDs.count, 4)
        XCTAssertEqual(proof.roles[.counter]?.mealIDs.count, 1)
        XCTAssertEqual(try cards(entries.reversed()).filter { $0.kind == .menuCooccurrence }.map(\.id), generated.map(\.id))
    }
    func testSameMealManyMenusDoesNotCreateRestaurantBreadth() throws {
        let meal = UUID()
        XCTAssertFalse(try cards((1...6).map { record(meal: meal, menu: "menu-\($0)") }).contains { $0.kind == .restaurantCollection })
        let values = [record(menu: "A", days: 1), record(menu: "B", days: 2), record(menu: "C", days: 2)]
        XCTAssertTrue(try cards(values).contains { $0.kind == .restaurantCollection })
    }
    func testSensoryPairMustCoexistInTheSameDish() throws {
        let other = try differentSense()
        var separate: [DiningEntry] = []
        for day in 1...3 { let meal = UUID(); separate += [record(meal: meal, days: day, selections: [sense()]), record(meal: meal, menu: "B", days: day, selections: [other])] }
        XCTAssertFalse(try cards(separate).contains { $0.kind == .sensoryCooccurrence })
        let together = (1...3).map { record(days: $0, selections: [sense(), other]) }
        let card = try XCTUnwrap(cards(together).first { $0.kind == .sensoryCooccurrence })
        XCTAssertEqual(card.evidenceBundle?.roles[.numerator]?.mealIDs.count, 3)
        XCTAssertEqual(card.evidenceBundle?.roles[.numerator]?.entryIDs.count, 3)
    }
    func testNewMenuAtKnownRestaurantRequiresEarlierDateAndNoUnknownMenuHistory() throws {
        let old = record(menu: "A", days: 60), new = record(menu: "B", days: 1)
        let window = TDWindow.recent(30, now: now, calendar: calendar)
        let card = try XCTUnwrap(cards([old, new], window: window).first { $0.kind == .newMenuAtKnownRestaurant })
        XCTAssertEqual(card.evidenceBundle?.roles[.contextOnly]?.entryIDs, [old.id.uuidString])
        XCTAssertFalse(try cards([record(menu: "A"), new], window: window).contains { $0.kind == .newMenuAtKnownRestaurant })
        var unknown = record(menu: "B", days: 80); unknown.mealTime = nil
        XCTAssertFalse(try cards([old, unknown, new], window: window).contains { $0.kind == .newMenuAtKnownRestaurant })
    }
    func testOverallAndAttributeContrastsOnlyConnectTheSameDish() throws {
        let whole = record(selections: [sense(.disliked)], overall: .liked)
        XCTAssertTrue(try cards([whole]).contains { $0.kind == .overallContrast })
        let meal = UUID()
        XCTAssertFalse(try cards([record(meal: meal, selections: [sense(.disliked)]), record(meal: meal, menu: "B", overall: .liked)]).contains { $0.kind == .overallContrast })
    }
    func testReadRemovesFromHomeButNotFromCategoryAndSnoozeAppliesToBoth() throws {
        let entries = (1...3).map { record(menu: "menu-\($0 % 2)", days: $0, selections: [sense(.liked)]) }
        let card = try XCTUnwrap(cards(entries).first { $0.kind == .commonPreference })
        let read = HomeDiscoveryPresentationPolicy.recordingRead(card, in: [:], at: now)
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.visible([card], hiddenUntil: read, referenceDate: now).isEmpty)
        XCTAssertEqual(HomeDiscoveryPresentationPolicy.categoryCards([card], category: .preference, hiddenUntil: read, referenceDate: now, read: true).count, 1)
        let hidden = HomeDiscoveryPresentationPolicy.snoozing(card, in: read, at: now)
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.categoryCards([card], category: .preference, hiddenUntil: hidden, referenceDate: now).isEmpty)
        var updated = entries; updated[0].note = "오탈자만 수정"
        let next = try XCTUnwrap(cards(updated).first { $0.kind == .commonPreference })
        XCTAssertEqual(next.semanticKey, card.semanticKey)
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.categoryCards([next], category: .preference, hiddenUntil: hidden, referenceDate: now).isEmpty)
    }

    func testFoodKindAcrossRestaurantsUsesVerifiedIdentityThreshold() throws {
        let kind = try XCTUnwrap(TDNativeAdapter.kindLabels.keys.sorted().first)
        let entries = (0..<3).map { record(restaurant: "restaurant-\($0)", kinds: [kind]) }
        XCTAssertFalse(try cards(Array(entries.prefix(2))).contains { $0.kind == .foodKindAcrossRestaurants })
        let finding = try XCTUnwrap(cards(entries).first { $0.kind == .foodKindAcrossRestaurants })
        XCTAssertEqual(finding.evidenceBundle?.roles[.numerator]?.entryIDs.count, 3)
        XCTAssertFalse(try cards(Array(entries.prefix(2)) + [record(restaurant: nil, kinds: [kind])]).contains { $0.kind == .foodKindAcrossRestaurants })
    }

    func testExtraSameDirectionMealUpdatesRevisionWithoutReopeningTheRelation() throws {
        var entries: [DiningEntry] = []
        for day in 1...4 { let meal = UUID(); entries += [record(meal: meal, menu: "A", days: day), record(meal: meal, menu: "B", days: day)] }
        let before = try XCTUnwrap(cards(entries).first { $0.kind == .menuCooccurrence })
        let meal = UUID(); entries += [record(meal: meal, menu: "A", days: 5), record(meal: meal, menu: "B", days: 5)]
        let after = try XCTUnwrap(cards(entries).first { $0.kind == .menuCooccurrence })
        XCTAssertEqual(before.id, after.id)
        XCTAssertEqual(before.semanticKey, after.semanticKey)
        XCTAssertNotEqual(before.revisionKey, after.revisionKey)
        let history = HomeDiscoveryPresentationPolicy.recordingRead(before, in: [:], at: now)
        XCTAssertTrue(HomeDiscoveryPresentationPolicy.visible([after], hiddenUntil: history, referenceDate: now.addingTimeInterval(2 * 86400)).isEmpty)
    }

    func testSensoryShareDiscoveryUsesUnroundedTwentyPointThresholdAndRealDenominators() throws {
        let other = try differentSense()
        for afterCount in [7, 8, 9] {
            let entries = (0..<20).flatMap { index in
                [record(days: 100 + index, selections: [other] + (index < 4 ? [sense()] : [])),
                 record(days: 1 + index, selections: [other] + (index < afterCount ? [sense()] : []))]
            }
            let finding = try cards(entries).first { $0.kind == .sensoryPeriodChange && $0.evidenceBundle?.attribute == "taste.sour" }
            XCTAssertEqual(finding != nil, afterCount >= 8)
            if let proof = finding?.evidenceBundle {
                XCTAssertEqual(proof.roles[.beforeNumerator]?.mealIDs.count, 4)
                XCTAssertEqual(proof.roles[.beforeDenominator]?.mealIDs.count, 20)
                XCTAssertEqual(proof.roles[.numerator]?.mealIDs.count, afterCount)
                XCTAssertEqual(proof.roles[.denominator]?.mealIDs.count, 20)
            }
        }
    }

    func testFitPeriodDiscoveryKeepsFortyPointBoundaryAndRequiresLinkedScope() throws {
        for afterPositive in [3, 4, 5] {
            let entries = (0..<5).flatMap { index in
                [record(days: 100 + index, selections: [sense(nil, intensity: .strong, fit: index < 2 ? .justRight : .tooStrong)]),
                 record(days: 1 + index, selections: [sense(nil, intensity: .strong, fit: index < afterPositive ? .justRight : .tooStrong)])]
            }
            let finding = try cards(entries).first { $0.kind == .fitPeriodChange }
            XCTAssertEqual(finding != nil, afterPositive >= 4)
            if let proof = finding?.evidenceBundle {
                XCTAssertEqual(proof.roles[.beforeDenominator]?.mealIDs.count, 5)
                XCTAssertEqual(proof.roles[.denominator]?.mealIDs.count, 5)
            }
        }
        let unlinked = (0..<5).flatMap { index in
            [record(days: 100 + index, selections: [sense(nil, fit: .tooStrong)]),
             record(days: 1 + index, selections: [sense(nil, fit: .justRight)])]
        }
        XCTAssertFalse(try cards(unlinked).contains { $0.kind == .fitPeriodChange })
    }
}
