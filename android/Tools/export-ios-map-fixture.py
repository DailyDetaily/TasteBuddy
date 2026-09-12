#!/usr/bin/env python3
"""iOS의 실제 격자 엔진을 Swift로 실행해 Android 배치 비교 자료를 만든다."""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--source", type=Path, default=root.parent / "ios/TasteBuddy")
args = parser.parse_args()
text = (args.source / "Domain/Models/DiningFeedbackContractModels.swift").read_text()
models = text[text.index("struct TasteExperienceAxisContract:"):text.index("extension DiningFeedbackFixtureContract")]
engine = text[text.index("enum TasteExperienceMapEngine {"):text.index("enum DiningFeedbackFixtureLoader {")]
program = '''import Foundation
enum TasteAxis: String, Codable { case sweet, sour, salty, umami, bitter, fat }
extension Array { subscript(safe index: Int) -> Element? { indices.contains(index) ? self[index] : nil } }
''' + models + engine + '''
struct Input: Decodable { let tasteExperienceAxes: [TasteExperienceAxisContract] }
let input = try JSONDecoder().decode(Input.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
let base = TasteExperienceMapEngine.basePositions(axes: input.tasteExperienceAxes)
let selections: [[String]] = [[], ["sweet-soft"], ["sweet-soft", "umami-meaty", "fat-coating"]]
let cases: [[String: Any]] = selections.map { ids in
    ["selected": ids, "positions": TasteExperienceMapEngine.renderPositions(basePositions: base, enlargedExperienceIDs: ids).map { p in ["id": p.id, "x": Double(p.x), "y": Double(p.y), "size": Double(p.size)] }]
}
let json = try JSONSerialization.data(withJSONObject: cases, options: [.sortedKeys, .prettyPrinted])
FileHandle.standardOutput.write(json)
'''
output = root / "app/src/test/resources/ios-map-golden.json"
output.parent.mkdir(exist_ok=True, parents=True)
with tempfile.TemporaryDirectory(prefix="tastebuddy-map-") as directory:
    source = Path(directory) / "Map.swift"
    source.write_text(program)
    binary = Path(directory) / "Map"
    subprocess.run(["xcrun", "swiftc", str(source), "-o", str(binary)], check=True)
    data = subprocess.check_output([str(binary), str(args.source / "Resources/Fixtures/dining-feedback-scenario.json")])
    output.write_bytes(data + b"\n")
    coordinates = [{key: point[key] for key in ("id", "x", "y")} for point in json.loads(data)[0]["positions"]]
    (root / "app/src/main/assets/catalog/taste-map-layout.json").write_text(json.dumps(coordinates, ensure_ascii=False, indent=2) + "\n")
print("iOS 맛 지도 비교 자료 3개 생성 완료")
