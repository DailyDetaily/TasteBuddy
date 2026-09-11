import XCTest
@testable import TasteBuddy

/// 생산 정제 코드를 읽기 전에 UI 라벨로 동결한 SS-01...SS-20의 개발 검토다.
/// 기준표: structured-selection-review/1, SHA-256 b31600b192bd55c0b17f1068313287796258ea95b1b9124ca533f1dfdcf2872a
final class SensoryStructuredSelectionTests: XCTestCase {
    private func selection(
        _ id: String, _ label: String, type: DiningSensorySelection.Kind = .bubble,
        liking: DiningSensorySelection.Liking? = nil,
        intensity: DiningSensorySelection.Intensity? = nil,
        fit: DiningSensorySelection.PreferenceFit? = nil,
        target: DiningSensorySelection.Target = .unspecified,
        phase: DiningSensorySelection.Phase = .unspecified,
        related: String? = nil, version: String = DiningSensorySelection.catalogVersion
    ) -> DiningSensorySelection {
        .init(id: id, type: type, catalogVersion: version, labelSnapshot: label, liking: liking, intensity: intensity, preferenceFit: fit, target: target, phase: phase, relatedBubbleID: related)
    }
    private func meal(
        _ selections: [DiningSensorySelection]?, id: UUID = UUID(), note: String = "",
        legacy: [String] = [], detailIDs: [String] = []
    ) -> DiningEntry {
        DiningEntry(id: id, restaurant: "기록한 식당", menu: "기록한 음식", rating: 5, note: note, tasteExperienceIDs: legacy, detailTagIDs: detailIDs, sensorySelections: selections)
    }
    private func analyze(_ meals: [DiningEntry]) throws -> SensoryAnalysisSnapshot {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("TasteBuddy/Resources/TBA/tba-sensory-contract.json")
        let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
        let result = try SensoryAnalysisEngine.analyze(entries: meals, contract: contract)
        XCTAssertEqual(result.actualApiCalls, 0)
        return result
    }
    private func has(_ result: SensoryAnalysisSnapshot, _ kind: String, _ attribute: String, _ value: SensoryValue) -> Bool {
        result.observations.contains { $0.kind == kind && $0.attribute == attribute && $0.value == value }
    }
    private func noLiking(_ result: SensoryAnalysisSnapshot, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertFalse(result.observations.contains { $0.kind.hasSuffix("liking") }, file: file, line: line)
    }

    func testSS01RoastedAromaIsNotBitterTasteOrLiking() throws {
        let result = try analyze([meal([selection("bitter-roasted", "구운 향")])])
        XCTAssertTrue(has(result, "sensory_presence", "aroma.roasted", .flag(true)))
        XCTAssertFalse(result.observations.contains { $0.attribute == "taste.bitter" })
        noLiking(result)
    }
    func testSS02SoftTextureIsNotFatPresenceOrPreference() throws {
        let result = try analyze([meal([selection("fat-soft-texture", "부드러운 질감")])])
        XCTAssertTrue(has(result, "sensory_presence", "texture.soft", .flag(true)))
        XCTAssertFalse(result.observations.contains { $0.attribute == "mouthfeel.fatty" })
        noLiking(result)
    }
    func testSS03BubbleSelectionWithoutEvaluationDoesNotImplyLiking() throws {
        let result = try analyze([meal([selection("sweet-dense", "밀도 있는 단맛")])])
        XCTAssertTrue(result.observations.contains { $0.attribute == "taste.sweet" })
        noLiking(result)
        XCTAssertTrue(result.insights.isEmpty)
    }
    func testSS04StrongLikedAndJustRightAreIndependentFacets() throws {
        let result = try analyze([meal([selection("umami-clear", "맑은 감칠맛", liking: .liked, intensity: .strong, fit: .justRight)])])
        XCTAssertTrue(has(result, "attribute_liking", "taste.umami", .text("positive")))
        XCTAssertTrue(has(result, "sensory_intensity", "taste.umami", .text("strong")))
        XCTAssertTrue(has(result, "preference_fit", "taste.umami", .text("just_right")))
        XCTAssertFalse(has(result, "preference_fit", "taste.umami", .text("above_preferred")))
        XCTAssertTrue(result.observations.allSatisfy { $0.sourceField.hasPrefix("sensorySelections:bubble:umami-clear:") })
        let liking = try XCTUnwrap(result.observations.first { $0.kind == "attribute_liking" })
        let source = try XCTUnwrap(liking.selectionEvidence)
        XCTAssertEqual(source.selectionID, "umami-clear")
        XCTAssertEqual(source.type, "bubble")
        XCTAssertEqual(source.catalogVersion, DiningSensorySelection.catalogVersion)
        XCTAssertEqual(source.labelSnapshot, "맑은 감칠맛")
        XCTAssertEqual(source.facet, "liking")
        XCTAssertEqual(source.labelValue, "좋았어요")
        XCTAssertEqual(source.responseValue, "liked")
        XCTAssertEqual(liking.phrase, source.labelSnapshot)
        XCTAssertEqual(liking.sourceSpans, [.init(start: 0, end: source.labelSnapshot.utf16.count, quote: source.labelSnapshot)])
    }
    func testSS05TagDislikeDoesNotSpreadToAnotherBubble() throws {
        let result = try analyze([meal([
            selection("sweet-dense", "밀도 있는 단맛"),
            selection("aroma-smoky", "훈연 향", type: .detailTag, liking: .disliked),
        ])])
        XCTAssertTrue(has(result, "attribute_liking", "aroma.smoky", .text("negative")))
        XCTAssertFalse(result.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sweet" })
        XCTAssertFalse(result.observations.contains { $0.kind == "overall_liking" })
    }
    func testSS06RecommendedButUnselectedTagsAreNotEvidence() throws {
        let result = try analyze([meal([selection("umami-clear", "맑은 감칠맛")])])
        XCTAssertTrue(result.observations.contains { $0.attribute == "taste.umami" })
        XCTAssertFalse(result.observations.contains { $0.attribute == "texture.crisp" })
        XCTAssertFalse(result.observations.contains { $0.sourceField.contains("texture-crisp") })
    }
    func testSS07ExplicitTargetAndPhaseRemainScoped() throws {
        let result = try analyze([meal([selection("aroma-roasted", "구운 향", type: .detailTag, liking: .liked, target: .sauce, phase: .afterSwallow)])])
        let liking = try XCTUnwrap(result.observations.first { $0.kind == "attribute_liking" })
        XCTAssertEqual(liking.attribute, "aroma.roasted")
        XCTAssertEqual(liking.value, .text("positive"))
        XCTAssertEqual(liking.target, "sauce")
        XCTAssertEqual(liking.phase, "after_swallow")
    }
    func testSS08EmptyNotesCanProduceRepeatedPersonalInsights() throws {
        let chosen = selection("sour-fresh", "산뜻한 산미", liking: .liked)
        let first = meal([chosen]), second = meal([chosen])
        let result = try analyze([first, second])
        XCTAssertEqual(first.note, "")
        XCTAssertEqual(second.note, "")
        let insight = try XCTUnwrap(result.insights.first { $0.attribute == "taste.sour" })
        XCTAssertEqual(insight.experienceCount, 2)
        XCTAssertEqual(Set(insight.experienceIDs), [first.id, second.id])
        XCTAssertEqual(result.sourceExperienceCount, 2)
    }
    func testSS09CorrectedEvaluationReplacesPreviousLiking() throws {
        let id = UUID()
        let before = try analyze([meal([selection("sour-fresh", "산뜻한 산미", liking: .liked)], id: id)])
        XCTAssertTrue(has(before, "attribute_liking", "taste.sour", .text("positive")))
        let after = try analyze([meal([selection("sour-fresh", "산뜻한 산미", liking: .disliked)], id: id)])
        XCTAssertTrue(has(after, "attribute_liking", "taste.sour", .text("negative")))
        XCTAssertFalse(has(after, "attribute_liking", "taste.sour", .text("positive")))
        XCTAssertEqual(after.sourceExperienceCount, 1)
    }
    func testSS10ExplicitClearDoesNotResurrectLegacyIDs() throws {
        let result = try analyze([meal([], legacy: ["sour-fresh"], detailIDs: ["aroma-smoky"])])
        XCTAssertTrue(result.observations.isEmpty)
        XCTAssertTrue(result.insights.isEmpty)
    }
    func testSS11DeletingMealRemovesItsInterpretation() throws {
        let original = try analyze([meal([selection("sour-fresh", "산뜻한 산미", liking: .liked)])])
        XCTAssertFalse(original.insights.isEmpty)
        let deleted = try analyze([])
        XCTAssertTrue(deleted.observations.isEmpty)
        XCTAssertTrue(deleted.insights.isEmpty)
        XCTAssertEqual(deleted.sourceExperienceCount, 0)
    }
    func testSS12LegacySelectionDoesNotAcquireAbsentEvaluation() throws {
        let result = try analyze([meal(nil, legacy: ["bitter-roasted"])])
        XCTAssertTrue(has(result, "sensory_presence", "aroma.roasted", .flag(true)))
        XCTAssertFalse(result.observations.contains { $0.attribute == "taste.bitter" })
        noLiking(result)
    }
    func testSS13NilAndEmptySelectionListsRemainDifferentAfterCoding() throws {
        let nilEntry = meal(nil, legacy: ["bitter-roasted"])
        let clearEntry = meal([], legacy: ["bitter-roasted"])
        let decoder = JSONDecoder(), encoder = JSONEncoder()
        let restoredNil = try decoder.decode(DiningEntry.self, from: encoder.encode(nilEntry))
        let restoredClear = try decoder.decode(DiningEntry.self, from: encoder.encode(clearEntry))
        XCTAssertNil(restoredNil.sensorySelections)
        XCTAssertEqual(restoredClear.sensorySelections, [])
        XCTAssertFalse(try analyze([restoredNil]).observations.isEmpty)
        XCTAssertTrue(try analyze([restoredClear]).observations.isEmpty)
    }
    func testSS14UnknownIDKeepsOriginalSelectionAndWaitsForInterpretation() throws {
        let unknown = selection("future-sea-memory", "바닷바람을 닮은 느낌", liking: .liked)
        let original = meal([unknown])
        let restored = try JSONDecoder().decode(DiningEntry.self, from: JSONEncoder().encode(original))
        XCTAssertEqual(restored.sensorySelections, [unknown])
        let result = try analyze([restored])
        XCTAssertFalse(result.unresolved.isEmpty)
        XCTAssertTrue(result.unresolved.contains { $0.phrase.contains(unknown.labelSnapshot) })
        XCTAssertFalse(result.observations.contains { !$0.isUnclassifiedDetail })
        noLiking(result)
    }
    func testSS15UnsupportedCatalogVersionIsNotSilentlyRemapped() throws {
        let unknownVersion = selection("aroma-roasted", "구운 향", type: .detailTag, liking: .liked, version: "dining-sensory-selection/99")
        let original = meal([unknownVersion])
        let restored = try JSONDecoder().decode(DiningEntry.self, from: JSONEncoder().encode(original))
        XCTAssertEqual(restored.sensorySelections?.first?.catalogVersion, unknownVersion.catalogVersion)
        let result = try analyze([restored])
        XCTAssertFalse(result.unresolved.isEmpty)
        XCTAssertFalse(result.observations.contains { !$0.isUnclassifiedDetail })
        noLiking(result)
    }
    func testSS16MismatchedIDAndLabelDoesNotCreateConfirmedEvidence() throws {
        let mismatch = selection("aroma-roasted", "바삭함", type: .detailTag, liking: .liked)
        let result = try analyze([meal([mismatch])])
        XCTAssertFalse(result.unresolved.isEmpty)
        XCTAssertTrue(result.unresolved.contains { $0.phrase.contains(mismatch.labelSnapshot) })
        XCTAssertFalse(result.observations.contains { !$0.isUnclassifiedDetail })
        noLiking(result)
    }
    func testSS17DuplicateSelectionsAndMealsDoNotMultiplyEvidence() throws {
        let chosen = selection("sour-fresh", "산뜻한 산미", liking: .liked, intensity: .strong)
        let original = meal([chosen, chosen])
        let result = try analyze([original, original])
        XCTAssertEqual(result.sourceExperienceCount, 1)
        XCTAssertTrue(result.insights.allSatisfy { $0.experienceCount == 1 })
        XCTAssertNil(result.mainWing.main)
        XCTAssertEqual(Set(result.observations.map(\.id)).count, result.observations.count)
    }
    func testSS18GeneratedMemoDoesNotBecomeAdditionalSelectionEvidence() throws {
        let original = meal([selection("aroma-roasted", "구운 향", type: .detailTag)], note: "메인 미각 구운 향, 보조 미각 부드러운 단맛으로 기억에 남은 식후 피드백입니다.")
        let result = try analyze([original])
        XCTAssertTrue(has(result, "sensory_presence", "aroma.roasted", .flag(true)))
        XCTAssertFalse(result.observations.contains { $0.attribute == "taste.sweet" })
        XCTAssertFalse(result.observations.contains { $0.sourceField == "note" })
        noLiking(result)
    }
    func testSS19TagRelationDoesNotTransferItsLikingToBubble() throws {
        let result = try analyze([meal([
            selection("sweet-dense", "밀도 있는 단맛"),
            selection("texture-crisp", "바삭함", type: .detailTag, liking: .liked, related: "sweet-dense"),
        ])])
        XCTAssertTrue(has(result, "attribute_liking", "texture.crisp", .text("positive")))
        XCTAssertFalse(has(result, "attribute_liking", "taste.sweet", .text("positive")))
        let tagLiking = try XCTUnwrap(result.observations.first { $0.kind == "attribute_liking" && $0.attribute == "texture.crisp" })
        XCTAssertEqual(tagLiking.selectionEvidence?.relatedBubbleID, "sweet-dense")
        XCTAssertEqual(tagLiking.sourceField, "sensorySelections:detailTag:texture-crisp:liking")
    }
    func testSS20OpposingSensoryEvaluationsStaySeparateWithoutMemo() throws {
        let result = try analyze([meal([
            selection("umami-clear", "맑은 감칠맛", liking: .liked),
            selection("aroma-smoky", "훈연 향", type: .detailTag, liking: .disliked),
        ])])
        XCTAssertTrue(has(result, "attribute_liking", "taste.umami", .text("positive")))
        XCTAssertTrue(has(result, "attribute_liking", "aroma.smoky", .text("negative")))
        XCTAssertFalse(result.observations.contains { $0.kind == "overall_liking" })
        XCTAssertEqual(result.sourceExperienceCount, 1)
    }
}
