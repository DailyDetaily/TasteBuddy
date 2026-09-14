"""Supplemental macOS execution of the actual Foundation memory source.

This is NOT an iOS/AppModel/UI test. Source extraction retains DiningEntry,
corrections, selection parsing, observation production, search and comparison.
The UI-only photo/AI containers are opaque JSON; catalog labels come from the
same contract. Profile, Taste Change, storage and async publication are excluded.
Run the native XCTest suites for those integration boundaries.
"""
from pathlib import Path
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
native = root / "ios/TasteBuddy"


def read(path):
    return (native / path).read_text()


def between(source, start, end):
    return source[source.index(start):source.index(end)]


models = read("Domain/Models/SensoryAnalysisModels.swift")
taste = read("Models/TasteModels.swift")
engine = read("Domain/UseCases/SensoryAnalysisEngine.swift")
search = read("Features/Home/HomeSearchModels.swift")
perception = read("Domain/Models/TastePerception.swift")
observation_body = between(engine, "        // Repeated IDs", "        let entriesByID")
engine_helpers = between(engine, "    private static func isLegacySelectionSummary", "    private static func scopeKey")
source = "import Foundation\nimport CryptoKit\n"
source += read("Domain/Models/DiningSensorySelection.swift")
source += read("Domain/Models/DiningOverallEvaluation.swift")
source += between(models, "/// Native rules", "struct SensoryInsight:")
source += models[models.index("struct SensoryRuleAtom:"):]
source += "\ntypealias DiningPhotoPalette = DiningSelectionJSON\ntypealias TasteBuddyAgentDiningAnalysisSnapshot = DiningSelectionJSON\n"
source += between(taste, "enum DiningEntryFeedbackStatus:", "enum DiningReflectionPhotoStore")
source += read("Domain/Models/DiningMemoryContext.swift")
source += read("Domain/UseCases/DiningSensorySelectionParser.swift")
source += "\nstruct SensoryAnalysisSnapshot { let observations: [SensoryObservation]; let unresolved: [SensoryUnresolved] }\n"
source += "enum SensoryAnalysisEngine {\nstatic func analyze(entries: [DiningEntry], contract: SensoryNativeContract?) -> SensoryAnalysisSnapshot {\n"
source += observation_body + "return .init(observations: observations, unresolved: unresolved)\n}\n" + engine_helpers + "}\n"
source += engine[engine.index("private final class SensoryNativeParser"):]
source += "\nenum HomeSearchEngine {\n" + between(search, "    static func normalize(_ value:", "    private static func hasSearchableCompleteCharacter") + "}\n"
source += "enum TastePerceptionEngine {\n" + between(perception, "    static func targetLabel", "    private static func key") + "}\n"
source += r'''
struct HostCatalogLabel { let label: String }
enum TasteExperienceCatalog { static var experienceByID: [String: HostCatalogLabel] = [:] }
enum DiningDetailTagCatalog {
    static var labels: [String: HostCatalogLabel] = [:]
    static func metadata(for id: String) -> HostCatalogLabel? { labels[id] }
}
'''
source += read("Domain/Models/FoodMemory.swift")
source += r'''
let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
for entry in contract.selectionCatalog.entries {
    if entry.type == "bubble" { TasteExperienceCatalog.experienceByID[entry.id] = .init(label: entry.label) }
    else { DiningDetailTagCatalog.labels[entry.id] = .init(label: entry.label) }
}
var entries = try JSONDecoder().decode([DiningEntry].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
var failures = 0, checks = 0
func check(_ value: Bool, _ name: String) {
    checks += 1
    if !value { failures += 1; print("CORE_FAIL \(name)") }
}
func index(_ entries: [DiningEntry]) -> FoodMemoryIndex {
    .build(entries: entries, snapshot: SensoryAnalysisEngine.analyze(entries: entries, contract: contract), generation: UUID(), analysisReady: true)
}
func id(_ number: Int) -> UUID { UUID(uuidString: String(format: "00000000-0000-4000-8000-%012d", number))! }
let before = index(entries)
let a = before.search("전에 좋았다고 기록한 파스타는 무엇이었고, 당시 어떤 표현을 남겼지?")
check(Set(a.matches.map(\.id)) == Set([1, 3, 4].map(id)), "A whole positive R1 R3 R4")
check(a.searchedCount == 9 && a.candidates.count == 8, "A entire scope and counter candidates")
check(before.search("레몬파스타").candidates.count == 3, "compact Korean menu")
check(before.search("파스타는").candidates.count == 8, "Korean particle")
let unrelated = DiningEntry(restaurant: "합성", menu: "파스타이탈리아", rating: 0, note: "파스타치오", sensorySelections: [], feedbackStatus: .captured)
check(index([unrelated]).search("파스타").matches.isEmpty, "no false food substring join")
let spaced = DiningEntry(restaurant: "합성", menu: "레   몬   파   스   타", rating: 0, note: String(repeating: "다른 경험이었다. ", count: 200), sensorySelections: [], feedbackStatus: .captured)
check(index([spaced]).search("레몬파스타").matches.count == 1, "compact match survives repeated whitespace and long note")
check(before.search("맛있었다.").matches.contains { $0.id == id(1) }, "R1 no reason recall")
check(before.search("파스타", filter: .partialPositive).matches.contains { $0.id == id(9) && !$0.hasWholePositive }, "R9 partial only")
check(before.search("파스타", filter: .uncertain).matches.contains { $0.id == id(5) }, "R5 uncertainty")
check(!before.documents.filter { [id(2), id(6)].contains($0.id) }.contains(where: \.hasWholePositive), "R2 R6 generated is not approval")
let comparison = FoodMemoryComparison(documents: before.documents)
check(comparison.opposedAttributes.contains("산미") && comparison.positiveSharedAttributes.contains("산미"), "B common and counter")
check(comparison.unknownTimeCount == 9 && comparison.mealCount == 9, "C uncertain meal times")
let old = entries[6]
var correction = old
correction.note = "산미는 좋았다. 싫었던 것은 생선 비린 향이었다. 앞의 ‘별로였다’는 전체 평가다."
let correctedAt = ISO8601DateFormatter().date(from: "2026-08-10T12:00:00Z")!
entries[6] = try correction.preparedForUpdate(previous: old, at: correctedAt)
let corrected = index(entries)
check(corrected.search("생선 비린 향").matches.map(\.id) == [id(7)], "D corrected source recalled")
check(!corrected.documents.first { $0.id == id(7) }!.observations.contains { $0.attribute == "taste.sour" && $0.value == .text("negative") }, "D no sour dislike")
check(corrected.documents.first { $0.id == id(3) }!.observations.contains { $0.attribute == "taste.sour" && $0.value == .text("negative") }, "D unrelated dislike retained")
check(entries[6].date == old.date && entries[6].knownAt(sourceField: "note") == correctedAt && entries[6].knownAt(sourceField: "sensorySelections:bubble:sour-sharp:selection") == nil, "C1 source timing")
check(try JSONDecoder().decode([DiningEntry].self, from: JSONEncoder().encode(entries)) == entries, "source round trip")
var cleared = entries[6]; cleared.note = ""
cleared = try cleared.preparedForUpdate(previous: entries[6], at: correctedAt)
let clearedJSON = String(data: try JSONEncoder().encode(cleared), encoding: .utf8)!
check(!clearedJSON.contains("생선 비린") && !clearedJSON.contains("산미가 또렷"), "explicit clear removes historical text")
var selectedChecks = 0
for fixture in contract.selectionCatalog.fixtures {
    let actual = DiningSensorySelectionParser.parse(fixture.selections, catalog: contract.selectionCatalog)
    check(actual == fixture.expected, "selection parity \(fixture.id)"); selectedChecks += 1
}
for fixture in contract.overallEvaluationContract.fixtures {
    check(fixture.evaluation.parse() == fixture.expected, "overall parity \(fixture.id)"); selectedChecks += 1
}
print("HOST_NATIVE_MEMORY_CORE checks=\(checks) structuredFixtures=\(selectedChecks) failures=\(failures)")
for count in CommandLine.arguments.contains("--skip-performance") ? [] : [50, 500, 2000] {
    let load = (0..<count).map { n in DiningEntry(restaurant: "합성 부하", menu: n.isMultiple(of: 2) ? "레몬 파스타" : "다른 음식", rating: 0, note: "산미가 강해서 좋았다. 전체적으로 맛있었다. " + String(repeating: "오래 기억할 식사였다. ", count: 12), sensorySelections: [], feedbackStatus: .completed) }
    let started = Date()
    let snapshot = SensoryAnalysisEngine.analyze(entries: load, contract: contract)
    let analyzed = Date()
    let indexed = FoodMemoryIndex.build(entries: load, snapshot: snapshot, generation: UUID(), analysisReady: true)
    let built = Date()
    var recalled = 0
    for n in 0..<20 { recalled += indexed.search(n.isMultiple(of: 2) ? "파스타" : "산미", filter: .all).matches.count }
    let searched = Date()
    let compared = FoodMemoryComparison(documents: indexed.documents)
    let finished = Date()
    check(compared.mealCount == count && recalled > 0, "load correctness \(count)")
    print(String(format: "HOST_NATIVE_MEMORY_PERF count=%d observation_ms=%.2f index_ms=%.2f search20_ms=%.2f compare_ms=%.2f", count, analyzed.timeIntervalSince(started)*1000, built.timeIntervalSince(analyzed)*1000, searched.timeIntervalSince(built)*1000, finished.timeIntervalSince(searched)*1000))
}
print("HOST_NATIVE_MEMORY_FINAL checks=\(checks) failures=\(failures)")
exit(failures == 0 ? 0 : 1)
'''
with tempfile.TemporaryDirectory(prefix="tastebuddy-memory-core-") as work:
    swift = Path(work) / "main.swift"
    binary = Path(work) / "memory-core"
    swift.write_text(source)
    subprocess.run(["xcrun", "swiftc", "-Onone", str(swift), "-o", str(binary)], check=True)
    result = subprocess.run([str(binary), str(native / "Resources/TBA/tba-sensory-contract.json"), str(native / "Resources/Fixtures/longitudinal-food-memory.json"), *sys.argv[1:]])
    raise SystemExit(result.returncode)
