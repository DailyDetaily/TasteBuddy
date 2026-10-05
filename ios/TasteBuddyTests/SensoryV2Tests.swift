import XCTest
@testable import TasteBuddy

final class SensoryV2Tests: XCTestCase {
    struct Fixtures: Decodable {
        struct ParserCase: Decodable { let id: String; let selections: [DiningSensorySelection]; let expected: SensoryRuleResult }
        struct ContextCase: Decodable {
            struct Input: Decodable { let menu: String; let dishKindIDs: [String]; let profileSelection: [String]?; let flagOverrides: [String: String] }
            let id: String; let input: Input; let expected: DiningSensoryPresentation; let categories: [DiningFeedbackTagCategoryContract]
        }
        let fixtures: [ParserCase]; let contexts: [ContextCase]
    }
    private var root: URL { URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent() }
    private func catalog() throws -> DiningSensoryV2Catalog { try .load(from: root.appendingPathComponent("ios/TasteBuddy/Resources/TBA/dining-sensory-v2.json")) }
    private func fixture() throws -> Fixtures { try JSONDecoder().decode(Fixtures.self, from: Data(contentsOf: root.appendingPathComponent("scripts/fixtures/sensory-v2-parity.json"))) }
    private func legacy() throws -> DiningSensoryCatalogContract {
        try JSONDecoder().decode(DiningSensoryCatalogContract.self, from: Data(contentsOf: root.appendingPathComponent("ios/TasteBuddy/Resources/TBA/dining-sensory-selection-catalog.json")))
    }
    func testBundledCatalogAndAllVersionedParserFixturesMatchWeb() throws {
        let data = try catalog(), old = try legacy()
        XCTAssertNotNil(DiningSensoryV2Catalog.shared)
        XCTAssertEqual(data.entries.filter { $0.type == "bubble" }.count, 160)
        XCTAssertEqual(data.entries.filter { $0.type == "detailTag" }.count, 147)
        for row in try fixture().fixtures {
            let actual = DiningSensoryV2Parser.parse(row.selections, allSelections: row.selections, legacyCatalog: old, catalog: data)
            XCTAssertEqual(actual, row.expected, row.id)
        }
    }
    func testFoodProfilesAndStableSlotsMatchWeb() throws {
        let data = try catalog()
        let base = data.axes.flatMap { $0.words.compactMap(\.id) }
        for row in try fixture().contexts {
            let actual = data.presentation(menu: row.input.menu, dishKindIDs: row.input.dishKindIDs, profileSelection: row.input.profileSelection, flagOverrides: row.input.flagOverrides)
            XCTAssertEqual(actual, row.expected, row.id)
            XCTAssertEqual(data.categories(actual), row.categories, row.id)
            XCTAssertTrue(data.isValid(actual))
            XCTAssertLessThanOrEqual(zip(base, actual.orderedBubbleIDs).filter { $0 != $1 }.count, 24)
            let positions = TasteExperienceMapEngine.basePositions(axes: data.displayAxes(actual))
            XCTAssertEqual(positions.count, 160)
            XCTAssertEqual(Set(positions.map { "\($0.x):\($0.y)" }).count, 160)
            XCTAssertTrue(positions.allSatisfy { $0.x.isFinite && $0.y.isFinite && $0.x > 82 && $0.y > 82 && $0.x < TasteExperienceMapEngine.mapSize - 82 && $0.y < TasteExperienceMapEngine.mapSize - 82 })
        }
    }
    func testSavingV2AndFutureFieldsPreservesOriginalAndPresentation() throws {
        let data = try catalog()
        var selection = try XCTUnwrap(data.selection("v2.detail.texture.thick-sauce", instanceID: "saved-instance"))
        selection.additionalFields["futureField"] = .object(["retain": .bool(true)])
        let entry = DiningEntry(restaurant: "검증용 식당", menu: "검증용 파스타", rating: 0, note: "", sensorySelections: [selection],
            sensoryPresentation: .encoded(data.presentation(menu: "크림 파스타", dishKindIDs: [])))
        let prepared = entry.preparedForInitialSave(at: .now)
        let restored = try JSONDecoder().decode(DiningEntry.self, from: JSONEncoder().encode(prepared))
        XCTAssertEqual(restored.sensorySelections, entry.sensorySelections)
        XCTAssertEqual(restored.sensoryPresentation, entry.sensoryPresentation)
        let expected: DiningSelectionJSON? = .object(["retain": .bool(true)])
        XCTAssertEqual(restored.sensorySelections?.first?.additionalFields["futureField"], expected)
    }
    func testNewWordsDoNotManufactureLikingOrRating() throws {
        let data = try catalog(), old = try legacy()
        let selections = data.entries.compactMap { data.selection($0.id, instanceID: $0.id) }
        let result = DiningSensoryV2Parser.parse(selections, allSelections: selections, legacyCatalog: old, catalog: data)
        XCTAssertFalse(result.observations.contains { $0.kind == "attribute_liking" })
        for experience in TasteExperienceCatalog.experiences where experience.id.hasPrefix("v2.") {
            XCTAssertNil(experience.intensity)
            XCTAssertEqual(TasteExperienceMapEngine.mappedRating(for: experience), 0)
        }
    }
    func testNaturalLabelsAndDescriptionsAreAvailableAndOldNamesAreSearchable() throws {
        let data = try catalog()
        XCTAssertEqual(data.entry("v2.bubble.bitter.lingering")?.label, "쌉싸름한 여운")
        XCTAssertEqual(data.entry("v2.bubble.umami.subtle")?.label, "은근한 깊이")
        XCTAssertEqual(data.entry("v2.bubble.salty.subtle")?.label, "부드러운 간")
        XCTAssertTrue(data.axes.flatMap(\.words).allSatisfy { !$0.description.isEmpty })
        XCTAssertTrue(data.matchesQuery("오래 남는 쓴맛", id: "v2.bubble.bitter.lingering"))
        XCTAssertEqual(data.archivedEntries?.count, 166)
    }
    func testHistoricalDefinitionsAndMapLabelsArePreserved() throws {
        let data = try catalog(), old = try legacy()
        for historical in data.archivedEntries ?? [] {
            var selection = try XCTUnwrap(data.selection(historical.id, instanceID: "historical:" + historical.id))
            selection.labelSnapshot = historical.label
            selection.definitionVersion = historical.definitionVersion
            selection.target = .init(rawValue: historical.intrinsicTarget ?? "whole_dish")
            selection.phase = .init(rawValue: historical.intrinsicPhase ?? "unspecified")
            let snapshot = selection
            let result = DiningSensoryV2Parser.parse([selection], allSelections: [selection], legacyCatalog: old, catalog: data)
            XCTAssertTrue(result.unresolved.isEmpty, historical.id)
            XCTAssertTrue(result.observations.contains { $0.kind == "sensory_detail" && $0.phrase == historical.label }, historical.id)
            XCTAssertEqual(selection, snapshot)
            XCTAssertEqual(data.definition(for: selection)?.definitionVersion, historical.definitionVersion)
            let presentation = data.presentation(menu: "튀김", dishKindIDs: [])
            let normal = data.displayAxes(presentation).flatMap(\.words)
            let restored = data.displayAxes(presentation, preserving: [selection]).flatMap(\.words)
            XCTAssertEqual(normal.compactMap(\.id), restored.compactMap(\.id))
            XCTAssertEqual(restored.first { $0.id == selection.id }?.label, historical.label)
            let encoded = try JSONEncoder().encode(selection)
            XCTAssertEqual(try JSONDecoder().decode(DiningSensorySelection.self, from: encoded), selection)
        }
    }
    func testIndependentDetailsSurviveWithoutBubblesAndInstancesStaySeparate() throws {
        let data = try catalog(), old = try legacy()
        var first = try XCTUnwrap(data.selection("v2.detail.texture.soft", instanceID: "first"))
        first.target = .surface; first.liking = .liked
        var second = try XCTUnwrap(data.selection("v2.detail.texture.soft", instanceID: "second"))
        second.target = .inside; second.liking = .disliked
        let selections = DiningSensorySelectionEditing.upsert(second, in: [first])
        XCTAssertEqual(selections.count, 2)
        let result = DiningSensoryV2Parser.parse(selections, allSelections: selections, legacyCatalog: old, catalog: data)
        XCTAssertTrue(result.unresolved.isEmpty)
        let liking = result.observations.filter { $0.kind == "attribute_liking" }
        XCTAssertEqual(liking.count, 2)
        XCTAssertFalse(SensoryEvidenceLinkage.sameSelection(liking[0].selectionEvidence, liking[1].selectionEvidence))
    }
}
