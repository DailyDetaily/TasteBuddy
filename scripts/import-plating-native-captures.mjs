import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const input = process.argv[2];
if (!input) throw new Error("Pass the simulator's plating-native-audit Documents directory.");
await fs.access(path.join(input, "complete.txt"));
const captures = JSON.parse(await fs.readFile(path.join(input, "captures.json"), "utf8"));
const records = {};
const output = "public/plating/native-component-audit";
const evidence = "output/plating/native-audit-20261001";
await fs.mkdir(output, { recursive: true });
for (const capture of captures) {
  if (!/^[a-z-]+--[a-z-]+\.png$/.test(capture.file)) throw new Error(`Invalid filename: ${capture.file}`);
  const bytes = await fs.readFile(path.join(input, capture.file));
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width !== capture.width * 3 || height !== capture.height * 3) throw new Error(`Capture dimensions disagree: ${capture.file}`);
  await fs.writeFile(path.join(output, capture.file), bytes);
  (records[capture.id] ??= []).push({ ...capture, sha256: crypto.createHash("sha256").update(bytes).digest("hex") });
}
await fs.writeFile("src/plating/nativeAuditCaptures.json", JSON.stringify(records, null, 2) + "\n");
await fs.writeFile(path.join(evidence, "capture-manifest.json"), JSON.stringify({
  runtime: "iOS 26.5", device: "Plating QA iPhone 17", dynamicType: "large",
  source: "ios/TasteBuddy/Features/DesignSystem/DesignSystemPreviewView.swift",
  sourceSha256: crypto.createHash("sha256").update(await fs.readFile("ios/TasteBuddy/Features/DesignSystem/DesignSystemPreviewView.swift")).digest("hex"),
  familyCount: Object.keys(records).length, imageCount: captures.length, captures: records,
}, null, 2) + "\n");
console.log(`${Object.keys(records).length} actual SwiftUI families; ${captures.length} native snapshots; PNG dimensions and hashes checked.`);
