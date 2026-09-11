import XCTest
@testable import TasteBuddy

/// advanced-model-review/1의 동결 원자료 허용/금지 기준. 모델 실행 결과로 기대값을 만들지 않는다.
final class AdvancedPersonalTasteModelTests: XCTestCase {
    private func records(_ prefix: String, count: Int = 4, liking: String = "positive", target: String = "unspecified", phase: String = "unspecified", intensity: String? = nil, dishKinds: [String] = []) -> [PersonalTasteModelRecord] {
        (0..<count).flatMap { index -> [PersonalTasteModelRecord] in
            let meal = "\(prefix)-\(index)", phrase = "산뜻한 산미"
            let base = PersonalTasteModelRecord(observationId: "\(meal):liking", userId: "review-user", experienceId: meal, mealId: meal, attribute: "taste.sour", value: .text(liking), target: target, phase: phase, observedAt: "2026-01-01T12:00:00Z", knownAt: "2026-01-01T13:00:00Z", dishKindIDs: dishKinds, phrase: phrase, sourceSpans: [.init(start: 0, end: phrase.utf16.count, quote: phrase)])
            guard let intensity else { return [base] }
            var strength = base
            strength.observationId = "\(meal):intensity"
            strength.kind = "sensory_intensity"
            strength.value = .text(intensity)
            strength.scale = "expression-strength-v1"
            return [base, strength]
        }
    }
    private func build(_ rows: [PersonalTasteModelRecord], asOf: Date? = nil) -> PersonalTasteModelSnapshot {
        PersonalTasteModelBuilder.buildRecords(records: rows, userID: "review-user", asOf: asOf)
    }
    private func predict(_ model: PersonalTasteModelSnapshot, target: String? = nil, phase: String? = nil, intensity: String? = nil, dishKinds: [String] = []) -> PersonalTastePrediction {
        PersonalTasteModelBuilder.predict(model, query: .init(attribute: "taste.sour", target: target, phase: phase, intensity: intensity, dishKindIDs: dishKinds))
    }
    private func ids(_ model: PersonalTasteModelSnapshot) -> Set<String> {
        Set(model.candidates.flatMap(\.evidenceIDs) + (model.nextSelection?.evidenceIDs ?? []))
    }
    func testAM01StrengthConditionsRetainOpposingDirections() {
        let model = build(records("weak", intensity: "weak") + records("strong", liking: "negative", intensity: "strong"))
        XCTAssertEqual(predict(model, intensity: "weak").direction, "positive")
        XCTAssertEqual(predict(model, intensity: "strong").direction, "negative")
        XCTAssertTrue(model.candidates.contains { $0.distribution.positive > 0 && $0.distribution.negative > 0 })
    }
    func testAM02And03TargetAndPhaseDoNotOverwriteEachOther() {
        let target = build(records("sauce", target: "sauce", phase: "during_meal", intensity: "medium") + records("dish", liking: "negative", target: "whole_dish", phase: "during_meal", intensity: "medium"))
        XCTAssertEqual(predict(target, target: "sauce", phase: "during_meal", intensity: "medium").direction, "positive")
        XCTAssertEqual(predict(target, target: "whole_dish", phase: "during_meal", intensity: "medium").direction, "negative")
        let phase = build(records("first", phase: "first_bite") + records("late", liking: "negative", phase: "late_meal"))
        XCTAssertEqual(predict(phase, phase: "first_bite").direction, "positive")
        XCTAssertEqual(predict(phase, phase: "late_meal").direction, "negative")
    }
    func testAM04And05DishConditionsPreserveDifferencesAndAbstainForUnseenKinds() {
        let seafood = records("seafood", dishKinds: ["seafood"])
        let model = build(seafood + records("meat", liking: "negative", dishKinds: ["meat"]))
        XCTAssertEqual(predict(model, dishKinds: ["seafood"]).direction, "positive")
        XCTAssertEqual(predict(model, dishKinds: ["meat"]).direction, "negative")
        XCTAssertNil(predict(build(seafood), dishKinds: ["meat"]).direction)
    }
    func testAM06SameContextContradictionsRemainMixed() {
        let model = build(records("yes") + records("no", liking: "negative"))
        XCTAssertNil(predict(model).direction)
        XCTAssertTrue(model.candidates.contains { $0.distribution.positive == 4 && $0.distribution.negative == 4 })
    }
    func testAM07UnobservedConfoundedCombinationCannotUseBroadFallback() {
        let model = build(records("yes", target: "sauce", phase: "first_bite", intensity: "weak") + records("no", liking: "negative", target: "whole_dish", phase: "late_meal", intensity: "strong"))
        XCTAssertNil(predict(model, target: "sauce", phase: "first_bite", intensity: "strong").direction)
    }
    func testAM08StrongLikedAndJustRightCannotBecomeOverloadOrDislike() {
        let input = records("strong-fit", intensity: "strong")
        let fit = input.filter { $0.kind == "attribute_liking" }.map { row in
            var r = row
            r.observationId += ":fit"
            r.kind = "preference_fit"
            r.value = .text("just_right")
            r.scale = "preference-fit-v1"
            return r
        }
        let model = build(input + fit)
        XCTAssertEqual(model.candidates, build(input).candidates)
        XCTAssertTrue(model.candidates.allSatisfy { $0.distribution.negative == 0 })
        XCTAssertEqual(predict(model, intensity: "strong").direction, "positive")
    }
    func testAM09DuplicateAndReorderedRecordsDoNotIncreaseMealEvidence() {
        let input = records("repeat", intensity: "strong")
        let original = build(input)
        let duplicate = build(Array(input.reversed()) + input)
        XCTAssertEqual(duplicate.candidates, original.candidates)
        XCTAssertEqual(duplicate.nextSelection, original.nextSelection)
        XCTAssertEqual(duplicate.units, original.units)
    }
    func testAM10And11FacetsAndSecondSelectionWithinOneMealAreOneMeal() {
        var input = records("single", count: 1, target: "sauce", phase: "first_bite", intensity: "strong")
        var second = input[0]
        second.observationId = "second-selection:liking"
        input.append(second)
        XCTAssertTrue(build(input).candidates.allSatisfy { $0.distribution.mealCount == 1 })
    }
    func testAM12DistinctMealsWithIdenticalContentRemainTwo() {
        XCTAssertTrue(build(records("distinct", count: 2)).candidates.contains { $0.distribution.mealCount == 2 })
    }
    func testAM13And14OverallFiveStepsCannotChangeIndividualDistributionOrCreatePreferenceAlone() {
        let individual = records("sour", liking: "negative")
        var whole = individual[0]
        whole.observationId = "overall"
        whole.kind = "overall_liking"
        whole.attribute = nil
        whole.scale = "overall-five-category-v1"
        whole.value = .text("positive")
        let first = build(individual + [whole])
        whole.value = .text("very_negative")
        let second = build(individual + [whole])
        XCTAssertEqual(first.candidates, second.candidates)
        XCTAssertEqual(first.nextSelection, second.nextSelection)
        XCTAssertTrue(build([whole]).candidates.isEmpty)
    }
    func testAM15And16MissingEvaluationIsNotNeutralAndNeutralIsNotNegative() {
        var presence = records("unanswered", count: 1)[0]
        presence.kind = "sensory_presence"
        presence.value = .flag(true)
        presence.scale = "presence-v1"
        XCTAssertTrue(build([presence]).candidates.allSatisfy { $0.distribution.positive == 0 && $0.distribution.neutral == 0 && $0.distribution.negative == 0 })
        let explicit = build(records("neutral", count: 1, liking: "neutral") + records("negative", count: 1, liking: "negative"))
        XCTAssertTrue(explicit.candidates.contains { $0.distribution.neutral == 1 && $0.distribution.negative == 1 && $0.distribution.positive == 0 })
    }
    func testAM20And23ReplacementAndDeletionRetractAllDerivedReferences() {
        let before = build(records("mutable"))
        let after = build(records("mutable", liking: "negative"))
        XCTAssertTrue(before.candidates.contains { $0.distribution.positive == 4 })
        XCTAssertTrue(after.candidates.allSatisfy { $0.distribution.positive == 0 })
        let deleted = build([])
        XCTAssertTrue(deleted.candidates.isEmpty)
        XCTAssertNil(deleted.nextSelection)
        XCTAssertTrue(ids(deleted).isEmpty)
    }
    func testAM24KnownAtCutoffExcludesFutureEditsAndUnknownLegacyTimes() throws {
        let original = records("known")
        let late = records("edited", liking: "negative").map { row in var r = row; r.knownAt = "2027-01-01T00:00:00Z"; return r }
        let legacy = records("legacy", liking: "negative").map { row in var r = row; r.knownAt = nil; return r }
        let cutoff = try XCTUnwrap(ISO8601DateFormatter().date(from: "2026-02-01T00:00:00Z"))
        let historical = build(original + late + legacy, asOf: cutoff)
        XCTAssertEqual(historical.candidates, build(original, asOf: cutoff).candidates)
        XCTAssertFalse(historical.temporalValidity.historicalReconstruction)
        XCTAssertTrue(ids(historical).allSatisfy { !$0.hasPrefix("edited-") && !$0.hasPrefix("legacy-") })
        let current = build(legacy)
        XCTAssertGreaterThan(current.temporalValidity.missingKnownAtCount, 0)
        XCTAssertFalse(current.candidates.isEmpty)
    }
    func testAM25SingleMealMustAbstainFromStableDirection() {
        let model = build(records("sparse", count: 1))
        XCTAssertNil(predict(model).direction)
        XCTAssertTrue(model.candidates.allSatisfy { $0.status != "repeated_direction" })
    }
    func testAM26CounterEvidenceRemainsVisible() {
        let model = build(records("support", target: "sauce") + records("exception", count: 1, liking: "negative", target: "whole_dish"))
        XCTAssertTrue(model.candidates.contains { $0.distribution.negative > 0 })
        XCTAssertTrue(ids(model).contains("exception-0:liking"))
    }
    func testAM29AllOutputEvidenceIsRealAndGeneratedQuestionCannotBecomeEvidence() {
        let input = records("trace", target: "sauce")
        let model = build(input), allowed = Set(input.map(\.observationId))
        XCTAssertTrue(ids(model).isSubset(of: allowed))
        if let question = model.nextSelection {
            XCTAssertFalse(question.createsEvidence)
            var generated = input[0]
            generated.observationId = "generated-question"
            generated.kind = "generated_question"
            generated.value = .text(question.question)
            generated.confirmationStatus = "generated_not_user_evidence"
            XCTAssertEqual(build(input + [generated]).candidates, model.candidates)
        }
    }
    func testAM30UnobservedWeakIntensityDoesNotInheritStrongDislike() {
        XCTAssertNil(predict(build(records("only-strong", liking: "negative", intensity: "strong")), intensity: "weak").direction)
    }
    func testAM31And32OrderAndOtherUsersCannotChangeOwnInterpretation() {
        let own = records("own", target: "sauce")
        XCTAssertEqual(build(own), build(Array(own.reversed())))
        let other = records("other", liking: "negative").map { row in var r = row; r.userId = "another-user"; return r }
        let combined = build(own + other)
        XCTAssertEqual(combined.candidates, build(own).candidates)
        XCTAssertTrue(ids(combined).allSatisfy { !$0.hasPrefix("other-") })
    }
}
