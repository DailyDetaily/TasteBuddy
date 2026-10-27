"""Run current Foundation Swift against independent semantic contrasts and the frozen shared contract.
Usage: python3 scripts/test-tba-policy-native.py /absolute/CONTRAST_CASES.json /absolute/new-evidence-dir
This compiles real model sources on macOS. It is not an iOS UI or production-account test.
"""
from pathlib import Path
import json, subprocess, sys, hashlib
root=Path(__file__).resolve().parents[1]
fixture=Path(sys.argv[1]).resolve(); work=Path(sys.argv[2]).resolve(); work.mkdir(parents=True,exist_ok=True)
assert not (work/'native-contrast-results.json').exists(), 'Do not overwrite an earlier execution'
native=root/'ios/TasteBuddy/Domain/Models'
files=['SensoryAnalysisModels.swift','DiningSensorySelection.swift','PersonalTasteModel.swift','PersonalTasteInsights.swift','PersonalTasteQuestions.swift','PersonalTasteQuestionInstance.swift']
sources={name:(native/name).read_text() for name in files}
models=sources['SensoryAnalysisModels.swift']
swift=models[:models.index('    static func scopeKey(')]+'}\n'
selection=sources['DiningSensorySelection.swift']
swift+=selection[selection.index('indirect enum DiningSelectionJSON:'):selection.index('/// 미래 enum값')]
for name in files[2:]: swift+=sources[name]+'\n'
swift+=r'''
func nullable(_ value: String?) -> Any { value as Any? ?? NSNull() }
let root = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! [String: Any]
let decoder = JSONDecoder()
var output: [[String: Any]] = []
var failures = 0
for pair in root["pairs"] as! [[String: Any]] {
    for variant in pair["variants"] as! [[String: Any]] {
        let input = variant["input"] as! [String: Any]
        let records = try decoder.decode([PersonalTasteModelRecord].self, from: JSONSerialization.data(withJSONObject: input["records"]!))
        let options = input["options"] as? [String: Any] ?? [:]
        let links = (options["validatedIntensityLinks"] as? [String: [String]] ?? [:]).mapValues { Set($0) }
        let model = PersonalTasteModelBuilder.buildRecords(records: records, userID: input["userID"] as! String,
            asOf: PersonalTasteModelBuilder.date(options["asOf"] as? String),
            assessQuestions: options["_assessQuestions"] as? Bool ?? true,
            individualQuestions: options["individualQuestions"] as? Bool ?? false,
            validatedIntensityLinks: links)
        let candidate = model.candidates.first { $0.attribute == "taste.sour" && $0.conditions.isEmpty }
        let intensityIDs = Set(records.filter { $0.kind == "sensory_intensity" }.map(\.observationId))
        var prediction: String? = nil
        if let query = input["query"] as? [String: Any] {
            let q = try decoder.decode(PersonalTasteContractQuery.self, from: JSONSerialization.data(withJSONObject: query))
            prediction = PersonalTasteModelBuilder.predict(model, query: q.query).direction
        }
        let intensities: [Any] = Set(model.units.map(\.intensity)).sorted { ($0 ?? "null") < ($1 ?? "null") }.map(nullable)
        let all: [String: Any] = [
            "mealCount": candidate?.distribution.mealCount ?? 0, "direction": nullable(candidate?.direction),
            "unitCount": model.units.count, "positive": candidate?.distribution.positive ?? 0,
            "neutral": candidate?.distribution.neutral ?? 0, "negative": candidate?.distribution.negative ?? 0,
            "mixed": candidate?.distribution.mixed ?? 0, "excludedCount": model.excludedEvidence.count,
            "missingKnownAtCount": model.temporalValidity.missingKnownAtCount, "intensities": intensities,
            "overallAssociationCount": model.overallAssociations.count, "hasOverallPatterns": !model.overallPatterns.isEmpty,
            "hasFitIntensity": model.fitPatterns.contains { $0.conditions.contains { $0.dimension == "intensity" } },
            "hasOverallIntensity": model.overallPatterns.contains { $0.conditions.contains { $0.dimension == "intensity" } },
            "overallHasIntensityEvidence": model.overallPatterns.contains { !$0.evidenceIDs.filter { intensityIDs.contains($0) }.isEmpty },
            "intensityClarificationCount": model.availableSelections.filter { $0.intent == "clarification" && $0.facet == "intensity" }.count,
            "fitRepeatedValue": nullable(model.fitPatterns.first { $0.conditions.isEmpty }?.repeatedValue),
            "predictionDirection": nullable(prediction)
        ]
        let expected = variant["expected"] as! [String: Any]
        let actual = Dictionary(uniqueKeysWithValues: expected.keys.map { ($0, all[$0]!) })
        let passed = NSDictionary(dictionary: actual).isEqual(to: expected)
        if !passed { failures += 1; print("NATIVE_POLICY_FAIL \(pair["id"]!)/\(variant["label"]!) expected=\(expected) actual=\(actual)") }
        output.append(["pairID": pair["id"]!, "label": variant["label"]!, "expected": expected, "actual": actual, "passed": passed])
    }
}
let contract = try decoder.decode(PersonalTasteModelContract.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
var contractFailures = 0
for fixture in contract.fixtures {
    let model = PersonalTasteModelBuilder.buildRecords(records: fixture.records, userID: fixture.userID, asOf: PersonalTasteModelBuilder.date(fixture.asOf))
    if PersonalTasteModelBuilder.canonical(model) != PersonalTasteModelBuilder.canonical(fixture.expected) { contractFailures += 1; print("SHARED_FAIL \(fixture.id)") }
    for prediction in fixture.predictions {
        if PersonalTasteModelBuilder.predict(model, query: prediction.query.query) != prediction.expected { contractFailures += 1; print("PREDICTION_FAIL \(fixture.id)") }
    }
}
let report: [String: Any] = ["evidenceClass":"synthetic_foundation_execution", "cases":output.count, "failures":failures,
    "sharedFixtures":contract.fixtures.count, "sharedFailures":contractFailures, "results":output]
try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: CommandLine.arguments[3]))
print("NATIVE_INDEPENDENT_POLICY \(output.count-failures)/\(output.count) PASS; FROZEN_SHARED \(contract.fixtures.count) fixtures, \(contractFailures) failures")
exit(failures + contractFailures == 0 ? 0 : 1)
'''
(work/'main.swift').write_text(swift)
(work/'source-hashes.json').write_text(json.dumps({str(native/name):hashlib.sha256((native/name).read_bytes()).hexdigest() for name in files},indent=2))
subprocess.run(['xcrun','swiftc','-Onone',str(work/'main.swift'),'-o',str(work/'policy-check')],cwd=root,check=True)
subprocess.run([str(work/'policy-check'),str(fixture),str(root/'ios/TasteBuddy/Resources/TBA/personal-taste-model-contract.json'),str(work/'native-contrast-results.json')],cwd=root,check=True)
