import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const native = await readFile(path.join(root, '../ios/TasteBuddy/Domain/Models/DiningFeedbackContractModels.swift'), 'utf8');
const types = native.slice(native.indexOf('struct TasteExperienceAxisContract:'), native.indexOf('extension DiningFeedbackFixtureContract'));
const engine = native.slice(native.indexOf('enum TasteExperienceMapEngine {'), native.indexOf('enum DiningFeedbackFixtureLoader'));
if (!types || !engine) throw new Error('Native map source boundaries changed.');
const directory = await mkdtemp(path.join(os.tmpdir(), 'tb-native-bubble-reference-'));
const swift = path.join(directory, 'main.swift');
// Only non-layout dependencies are stubbed. Geometry is executed from the unchanged native source.
const preamble = `import Foundation
import CoreGraphics
enum TasteAxis: String, Codable { case sweet, sour, salty, bitter, umami, fat }
enum TasteBloomMotion {
 enum Role { case feedback, content, sheet; var duration: Double { switch self { case .feedback: return 0.18; case .content: return 0.3; case .sheet: return 0.5 } } }
 static let stagger = 0.06
 static func duration(_ role: Role, reduceMotion: Bool) -> Double { role.duration }
}
private extension Collection { subscript(safe index: Index) -> Element? { indices.contains(index) ? self[index] : nil } }
`;
const tail = `
struct Fixture: Decodable { let tasteExperienceAxes: [TasteExperienceAxisContract] }
let fixture = try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
let positions = TasteExperienceMapEngine.basePositions(axes: fixture.tasteExperienceAxes)
let delays = TasteExperienceMapEngine.introDelays(axes: fixture.tasteExperienceAxes, positions: positions)
let values: [[String: Any]] = positions.map { ["id": $0.id, "x": Double($0.x), "y": Double($0.y), "diameter": Double($0.size), "introDelay": delays[$0.id] ?? -1] }
let encoded = try JSONSerialization.data(withJSONObject: values, options: [.sortedKeys, .prettyPrinted])
print(String(data: encoded, encoding: .utf8)!)
`;
await writeFile(swift, preamble + types + engine + tail);
const bytes = execFileSync('/usr/bin/swift', [swift, path.join(root, '../ios/TasteBuddy/Resources/Fixtures/dining-feedback-scenario.json')], { timeout: 120000, maxBuffer: 1024 * 1024 });
const data = JSON.parse(bytes.toString());
if (data.length !== 72) throw new Error('Unexpected native bubble count');
const out = path.join(root, 'output/taste-bubble-map/native-layout.json');
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(data, null, 2));
await writeFile(path.join(root, 'src/TasteBubbleMapMotion/native-layout.ts'), '// Generated from the unmodified Swift TasteExperienceMapEngine by export-native-bubble-layout.mjs.\nexport const NATIVE_BUBBLE_LAYOUT = ' + JSON.stringify(data, null, 2) + ' as const;\n');
console.log(`Executed unchanged native Swift map engine: ${data.length} positions and intro delays → ${out}`);
