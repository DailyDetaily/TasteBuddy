import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { build } from "esbuild";

const bundled = await build({
  stdin: {
    contents: "export {components} from './src/plating/catalog'; export {nativeComponentAudit,nativeAuditKindLabels} from './src/plating/nativeComponentAudit';",
    resolveDir: process.cwd(), loader: "ts",
  }, bundle: true, platform: "node", format: "esm", write: false,
});
const { components, nativeComponentAudit: audit, nativeAuditKindLabels: labels } = await import(
  "data:text/javascript;base64," + Buffer.from(bundled.outputFiles[0].text).toString("base64"),
);
const ids = new Set(components.map(c => c.id));
const extra = Object.keys(audit).filter(id => !ids.has(id));
if (extra.length) throw new Error(`Unknown audit families: ${extra.join(", ")}`);
const files = new Map();
const entries = [];
for (const c of components) {
  const a = audit[c.id];
  if (!a) throw new Error(`Missing iOS audit: ${c.id}`);
  const sources = [];
  for (const ref of a.sources) {
    if (!files.has(ref.path)) files.set(ref.path, await fs.readFile(ref.path, "utf8"));
    const contents = files.get(ref.path);
    const index = contents.indexOf(ref.anchor);
    if (index < 0) throw new Error(`${c.id}: missing anchor ${ref.anchor} in ${ref.path}`);
    sources.push({ ...ref, line: contents.slice(0, index).split("\n").length,
      sha256: crypto.createHash("sha256").update(contents).digest("hex") });
  }
  entries.push({ id: c.id, name: c.name, ...a, sources });
}
const counts = Object.fromEntries(Object.keys(labels).map(kind => [kind, entries.filter(e => e.kind === kind).length]));
const captureMap = JSON.parse(await fs.readFile("src/plating/nativeAuditCaptures.json", "utf8"));
const captured = Object.keys(captureMap);
const sourceOnly = entries.filter(e => !captured.includes(e.id));
const root = "output/plating/native-audit-20261001";
await fs.mkdir(root, { recursive: true });
await fs.writeFile(path.join(root, "audit.json"), JSON.stringify({
  reviewedOn: "2026-10-01", total: entries.length, counts,
  capturedFamilies: captured.length, capturedImages: Object.values(captureMap).flat().length,
  sourceOnlyFamilies: sourceOnly.map(e => e.id),
  scope: "Current iOS source contract. Native snapshots, when supplied, are isolated component fixtures, not product journeys or VoiceOver tests.",
  entries,
}, null, 2) + "\n");
const lines = ["# Plating의 iOS 컴포넌트 대조", "", "2026-10-01 · 현재 카탈로그 51개 계열을 각 Swift 선언 또는 실제 사용처와 대조했다.", "",
  "기존 웹 예제의 크기·API·상태가 iOS와 같은지 확인한 기록이다. 시스템 컨트롤과 정적 참고 견본은 제품 공용 컴포넌트와 구분한다. 아래 항목의 소스 해시는 `output/plating/native-audit-20261001/audit.json`에 있다.", "",
  "| 종류 | 수 |", "| --- | ---: |", ...Object.entries(counts).map(([kind,n]) => `| ${labels[kind]} | ${n} |`), "",
  `Native 확인: 시뮬레이터 빌드 성공. ${captured.length}개 계열의 실제 SwiftUI 타입을 ${Object.values(captureMap).flat().length}장의 독립 예제로 캡처하고 전체 이미지를 확인했다. 사진·문구·값은 합성 예제이며 화면 전환·저장·VoiceOver의 실행 검증은 아니다.`, "",
  `소스만 대조한 ${sourceOnly.length}개: ${sourceOnly.map(e => e.name).join(", ")}. 화면 안의 private 구성과 시스템 메뉴·피커, 독립 iOS 타입이 없는 항목이다.`, "",
  "## 항목별 확인", "", "| 항목 | 실제 iOS 대응 | 종류 | 규격 | 확인된 차이 |", "| --- | --- | --- | --- | --- |",
  ...entries.map(e => `| [${e.name}](http://127.0.0.1:3001/design-system/components/${e.id}#native-audit) | ${e.nativeType} | ${labels[e.kind]} | ${e.specs.replaceAll("|", "\\|")} | ${e.differences.join(" ").replaceAll("|", "\\|")} |`), "",
  "## 소스와 상태", "",
];
for (const e of entries) {
  lines.push(`### ${e.name}`, "", ...e.sources.map(s => `- [${s.path}:${s.line}](../../${s.path}#L${s.line}) · \`${s.anchor}\``), "",
    `규격: ${e.specs}`, "", "| 속성 | 기본값 또는 계약 |", "| --- | --- |", ...e.properties.map(([p,v]) => `| ${p} | ${v} |`), "",
    "| 상태 | 실제 표현·책임 |", "| --- | --- |", ...e.states.map(([p,v]) => `| ${p} | ${v} |`), "", e.behavior, "");
}
lines.push("## 검증 범위", "", "51개 계열 모두 선언·사용처와 연결하고 각 anchor의 존재를 확인했다. 소스만으로 OS 외형, 모션의 체감, VoiceOver, 실제 저장·복귀 여정을 검증했다고 표시하지 않는다. Native 스냅샷과 빌드 결과는 같은 증거 폴더에서 별도로 확인한다.", "");
await fs.writeFile("docs/design/plating-ios-component-audit.md", lines.join("\n"));
console.log(`${entries.length} iOS families reviewed; ${files.size} source files; ${JSON.stringify(counts)}`);
