"""Run actual Foundation question code on macOS; this is not iOS storage/UI proof.

--baseline reproduces the family-wide completion defect from the starting HEAD.
The three baseline source files had no pre-existing edits (see saved status).
"""
from pathlib import Path
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
native = root / "ios/TasteBuddy"
baseline = "--baseline" in sys.argv

def source(path):
    if baseline:
        return subprocess.check_output(["git", "show", "a69feb0fbb112834068f8191cc7a120a8bcef3d9:ios/TasteBuddy/" + path], cwd=root, text=True)
    return (native / path).read_text()

models = (native / "Domain/Models/SensoryAnalysisModels.swift").read_text()
swift = models[:models.index("struct SensoryObservation:")]
for file in ["PersonalTasteModel.swift", "PersonalTasteInsights.swift", "PersonalTasteQuestions.swift"]:
    swift += source("Domain/Models/" + file)
if not baseline:
    swift += (native / "Domain/Models/PersonalTasteQuestionInstance.swift").read_text()
swift += r'''
let selection = SensorySelectionEvidence(selectionID: "sour-fresh", type: "bubble", catalogVersion: "dining-sensory-selection/1", labelSnapshot: "산뜻한 산미", facet: "selection", labelValue: "산뜻한 산미", responseValue: "sour-fresh", relatedBubbleID: nil, relatedBubbleLabel: nil, resolution: "resolved")
func presence(_ id: String) -> PersonalTasteModelRecord {
    .init(observationId: id + "-presence", userId: "owner", experienceId: id, kind: "sensory_presence", attribute: "taste.sour", value: .flag(true), scale: "presence-v1", target: "sauce", phase: "after_swallow", selectionEvidence: selection)
}
func model(_ rows: [PersonalTasteModelRecord], suppressed: [String] = []) -> PersonalTasteModelSnapshot {
    PersonalTasteModelBuilder.buildRecords(records: rows, userID: "owner", suppressedQuestionIDs: suppressed__NATIVE_MODE__)
}
let rows = [presence("A"), presence("B")]
let before = model(rows)
let completed = before.availableSelections.first!.id
let after = model(rows, suppressed: [completed])
print("QUESTION_REPRO before=\(before.availableSelections.count) afterSuppressA=\(after.availableSelections.count)")
if CommandLine.arguments.contains("--baseline") {
    precondition(before.availableSelections.count == 1 && after.availableSelections.isEmpty, "Expected starting grouped-ID defect")
    print("BASELINE_Q1_REPRODUCED two experiences share one completed family")
} else {
    precondition(before.availableSelections.count == 2 && after.availableSelections.count == 1)
    let added = model(rows + [presence("C")], suppressed: [completed])
    precondition(added.availableSelections.count == 2)
    precondition(model(rows.reversed()).availableSelections == before.availableSelections)
    var revised = rows; revised[0].observationId = "new-analysis-hash"
    precondition(Set(model(revised).availableSelections.map(\.id)) == Set(before.availableSelections.map(\.id)))
    let unchanged = model(rows)
    precondition(unchanged.units.isEmpty && unchanged.candidates.isEmpty)
    precondition(!unchanged.availableSelections.contains { $0.createsEvidence })
    print("NATIVE_QUESTION_CORE Q1 Q2 Q8 Q10 Q15 stableID reorder PASS")
    for n in [50, 500, 2000] {
        let load = (0..<n).flatMap { index -> [PersonalTasteModelRecord] in
            let row = presence("answered-\(index)")
            var rating = row; rating.observationId += "-liking"; rating.kind = "attribute_liking"
            rating.scale = "attribute-three-category-v1"; rating.value = .text("positive")
            return [row, rating]
        }
        let start = Date()
        let result = PersonalTasteModelBuilder.buildRecords(records: load, userID: "owner", individualQuestions: true, nativeAnswerOptions: { _, _ in [] })
        precondition(!result.availableSelections.contains { $0.facet == "liking" })
        print(String(format: "NATIVE_ANSWERED_SCOPE_PERF count=%d ms=%.2f", n, Date().timeIntervalSince(start)*1000))
    }

    for n in [50, 500] {
        let load = (0..<n).map { presence("synthetic-\($0)") }
        let start = Date(); let result = model(load)
        precondition(result.availableSelections.count == n)
        print(String(format: "NATIVE_QUESTION_PERF count=%d ms=%.2f", n, Date().timeIntervalSince(start)*1000))
    }
}
let contract = try JSONDecoder().decode(PersonalTasteModelContract.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
for fixture in contract.fixtures {
    let actual = PersonalTasteModelBuilder.buildRecords(records: fixture.records, userID: fixture.userID, asOf: PersonalTasteModelBuilder.date(fixture.asOf))
    precondition(PersonalTasteModelBuilder.canonical(actual) == PersonalTasteModelBuilder.canonical(fixture.expected), "Shared contract \(fixture.id)")
    for prediction in fixture.predictions { precondition(PersonalTasteModelBuilder.predict(actual, query: prediction.query.query) == prediction.expected) }
}
print("SHARED_MODEL_CONTRACT \(contract.fixtures.count) PASS")
'''
swift = swift.replace("__NATIVE_MODE__", "" if baseline else ", individualQuestions: true")
with tempfile.TemporaryDirectory(prefix="tastebuddy-question-core-") as temporary:
    work = Path(temporary)
    (work / "main.swift").write_text(swift)
    subprocess.run(["xcrun", "swiftc", "-Onone", str(work / "main.swift"), "-o", str(work / "check")], check=True)
    subprocess.run([str(work / "check"), str(native / "Resources/TBA/personal-taste-model-contract.json"), *sys.argv[1:]], check=True)
