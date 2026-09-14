"""Run the actual Foundation-only Swift parser while simulator startup is unavailable.

This supplements, and does not replace, the iOS XCTest and UI runs. Only unused
contract properties requiring the UI model graph are omitted from this harness.
"""
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
models = (root / "ios/TasteBuddy/Domain/Models/SensoryAnalysisModels.swift").read_text()
engine = (root / "ios/TasteBuddy/Domain/UseCases/SensoryAnalysisEngine.swift").read_text()
shared = models[:models.index("struct SensoryObservation:")]
shared += models[models.index("struct SensoryCombinationComponent:"):models.index("struct SensoryUnresolved:")]
shared += models[models.index("struct SensoryRuleAtom:"):]
shared = shared.replace("    let selectionCatalog: DiningSensoryCatalogContract\n", "")
shared = shared.replace("    let overallEvaluationContract: DiningOverallEvaluationContract\n", "")
parser = engine[engine.index("private final class SensoryNativeParser"):]
main = r'''
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let contract = try JSONDecoder().decode(SensoryNativeContract.self, from: Data(contentsOf: url))
private let parser = SensoryNativeParser(contract: contract)
var failures = 0
for fixture in contract.fixtures {
    let actual: SensoryRuleResult
    switch fixture.answer.value {
    case .text(let text): actual = parser.parse(text, target: fixture.answer.target, phase: fixture.answer.phase)
    case .choices(let choices):
        var combined = SensoryRuleResult()
        for choice in choices {
            let part = parser.parseChoice(label: choice.label, id: choice.id, target: fixture.answer.target, phase: fixture.answer.phase)
            combined.observations += part.observations; combined.unresolved += part.unresolved
            combined.needsAI = combined.needsAI || part.needsAI
        }
        actual = combined
    }
    if actual != fixture.expected { print("PARITY_FAIL \(fixture.id)"); failures += 1 }
}
print("SWIFT_SOURCE_PARSER_PARITY fixtures=\(contract.fixtures.count) failures=\(failures)")
let fixed = "오늘은 배고픈 점심이었다. 소스가 오래 남았지만 고소해서 좋았다."
let r9 = parser.parse(fixed)
let encoded = try JSONEncoder().encode(r9)
print("FIXED_R9 " + String(data: encoded, encoding: .utf8)!)
if r9.observations.contains(where: { $0.kind == "overall_liking" && $0.value == .text("positive") }) {
    print("SEMANTIC_FAIL R9 sauce approval must not become whole-dish approval"); failures += 1
}
let semanticCases: [(String, String, (SensoryRuleResult) -> Bool)] = [
    ("R1", "맛있었다.", { $0.observations.contains { $0.kind == "overall_liking" && $0.value == .text("positive") } }),
    ("R3", "오늘 점심에 먹었다. 전체적으로 맛있었지만 산미는 강해서 아쉬웠다.", { result in
        result.observations.contains { $0.kind == "overall_liking" && $0.value == .text("positive") }
        && result.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sour" && $0.value == .text("negative") }
    }),
    ("R4", "오늘 점심에 먹었다. 산미가 강해서 좋았다. 전체적으로도 맛있었다.", { $0.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sour" && $0.value == .text("positive") } }),
    ("R5", "작년에 먹은 사진을 보고 적는다. 맛있었던 것 같지만 날짜와 이유는 기억나지 않는다.", { !$0.observations.contains { $0.kind.contains("liking") } }),
    ("R7", "산미가 또렷했다. 전체적으로 별로였다.", { result in
        result.observations.contains { $0.kind == "overall_liking" && $0.value == .text("negative") }
        && !result.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sour" && $0.value == .text("negative") }
    }),
    ("R9-part", fixed, { $0.observations.contains { $0.kind == "part_liking" && $0.target == "sauce" && $0.value == .text("positive") } }),
    ("C1", "산미는 좋았다. 싫었던 것은 생선 비린 향이었다. 앞의 ‘별로였다’는 전체 평가다.", { !$0.observations.contains { $0.kind == "attribute_liking" && $0.attribute == "taste.sour" && $0.value == .text("negative") } }),
    ("goal", "앞으로 덜 달게 먹고 싶다.", { !$0.observations.contains { $0.kind.contains("liking") } }),
    ("part-negation", "소스가 오래 남았지만 고소해서 좋았던 것은 아니다.", { !$0.observations.contains { $0.kind.contains("liking") } }),
    ("sentence-boundary", "소스가 오래 남았다. 고소해서 좋았다.", { !$0.observations.contains { $0.kind.contains("liking") } }),
    ("explicit-whole", "소스가 오래 남았지만 전체적으로 맛있었다.", { $0.observations.contains { $0.kind == "overall_liking" && $0.value == .text("positive") } })
]
for (id, source, allowed) in semanticCases {
    let result = parser.parse(source)
    let spansValid = result.observations.allSatisfy { atom in
        (atom.sourceSpans ?? []).allSatisfy { span in
            span.start >= 0 && span.end <= source.utf16.count && span.start <= span.end
            && (source as NSString).substring(with: NSRange(location: span.start, length: span.end - span.start)) == span.quote
        }
    }
    if !allowed(result) || !spansValid { print("SEMANTIC_FAIL \(id)"); failures += 1 }
}
print("SWIFT_FIXED_SOURCE_CHECKS cases=\(semanticCases.count) totalFailures=\(failures)")
exit(failures == 0 ? 0 : 1)
'''
with tempfile.TemporaryDirectory(prefix="tastebuddy-parser-") as work:
    source = Path(work) / "main.swift"
    source.write_text(shared + parser + main)
    result = subprocess.run(["xcrun", "swift", str(source), str(root / "ios/TasteBuddy/Resources/TBA/tba-sensory-contract.json")])
    raise SystemExit(result.returncode)
