import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  readSources,
  inspectStructures,
  buildContract,
  sourceFiles,
} from "./native-feedback/contract.mjs";
import {
  syncNativeFeedback,
  watchNativeFeedback,
  defaultRoot,
} from "./native-feedback-sync.mjs";
import { block } from "./native-feedback/source.mjs";

const sources = await readSources(defaultRoot);
const baseline = inspectStructures(sources);
const demo = JSON.parse(
  await fs.readFile(
    new URL("./native-feedback/demo.json", import.meta.url),
    "utf8",
  ),
);
const build = (s) => buildContract(s, baseline, demo);
test("Swift declaration reader ignores quoted and commented braces", () => {
  assert.equal(
    block(
      'struct A { Text("}") // {\n /* { nested } */ let n=1 }',
      "struct A",
    ).trim(),
    'Text("}") // {\n /* { nested } */ let n=1',
  );
});
test("live native tokens and all current catalog entries are exported", async () => {
  const c = await build(sources);
  assert.equal(c.status, "ready");
  assert.equal(c.ui.controlRadius, 10);
  assert.equal(c.ui.primaryHeight, 48);
  assert.equal(c.chip.height, 36);
  assert.equal(c.bubbles.bubbles.length, 160);
  assert.equal(c.details.categories.length, 5);
  assert.equal(c.details.categories.flatMap((c) => c.tags).length, 69);
});
test("native text area metrics synchronize while inserted UI still requires review", async () => {
  const input = sources.input.replace(
    "minimumHeight: CGFloat = 156",
    "minimumHeight: CGFloat = 180",
  );
  const c = await build({ ...sources, input });
  assert.equal(c.textArea.height, 180);
  assert.equal(c.textArea.focusedBorder, 2);
  assert.equal(c.status, "ready", JSON.stringify(c.review));
  const changed = input.replace(
    "struct TBTextArea: View {",
    "struct TBTextArea: View {\n let unreviewedInset = 7",
  );
  assert.ok(
    (await build({ ...sources, input: changed })).review.some(
      (r) => r.section === "textArea",
    ),
  );
});
test("dish groups include current selections and keep legacy kinds only when selected", async () => {
  const c = await build(sources);
  assert.deepEqual(
    c.dishKindGroups.map((g) => g.id),
    ["ingredient", "form", "method", "attribute"],
  );
  const kinds = c.dishKindGroups.flatMap((g) => g.kinds);
  assert.equal(kinds.length, 32);
  for (const id of c.selectedDishKindIDs)
    assert.ok(
      kinds.some((k) => k.id === id),
      id,
    );
  for (const { id } of kinds) assert.ok(c.dishKindIcons[id]?.length, id);
  const legacy = await buildContract(sources, baseline, {
    ...demo,
    dishKindIDs: ["seafood", "grain_noodle"],
  });
  assert.deepEqual(
    legacy.dishKindGroups.find((g) => g.id === "legacy").kinds.map((k) => k.id),
    ["grain_noodle"],
  );
  const changed = await build({
    ...sources,
    map: sources.map.replace('return "주요 재료"', 'return "주재료"'),
  });
  assert.equal(changed.dishKindGroups[0].label, "주재료");
  assert.equal(changed.status, "ready");
});
test("native press feedback dimensions synchronize without suppressing structural review", async () => {
  const c = await build({
    ...sources,
    controlMotion: sources.controlMotion.replace(
      "pressDistance: CGFloat = 1",
      "pressDistance: CGFloat = 2",
    ),
  });
  assert.equal(c.controls.pressDistance, 2);
  assert.equal(c.status, "ready", JSON.stringify(c.review));
});
test("native theme changes update dimensions and semantic colors without structure review", async () => {
  const c = await build({
    ...sources,
    theme: sources.theme
      .replace(
        "static let control: CGFloat = 10",
        "static let control: CGFloat = 13",
      )
      .replace(
        "static let textPrimary = Color(hex: 0x0F0F0F)",
        "static let textPrimary = Color(hex: 0x203040)",
      ),
  });
  assert.equal(c.ui.controlRadius, 13);
  assert.equal(c.colors.textPrimary, "#203040");
  assert.equal(c.status, "ready");
});
test("mapped inline chip dimensions update the contract and remain ready", async () => {
  const c = await build({
    ...sources,
    input: sources.input.replace(
      "minHeight: variant == .dining ? 36",
      "minHeight: variant == .dining ? 40",
    ),
  });
  assert.equal(c.chip.height, 40);
  assert.equal(c.status, "ready", JSON.stringify(c.review));
});
test("source copy updates use the original stable string slot", async () => {
  const original = "후보가 맞지 않으면 식당명을 직접 남길 수 있어요";
  const c = await build({
    ...sources,
    dining: sources.dining.replace(original, "식당명을 직접 적어주세요"),
  });
  assert.equal(c.copy.restaurant[original], "식당명을 직접 적어주세요");
  assert.equal(c.status, "ready");
});
test("native-only catalog edits reach the video without waiting for web JSON regeneration", async () => {
  const data = JSON.parse(sources.catalog);
  data.axes[0].words[0].label = "새 네이티브 버블";
  data.profiles.find((p) => p.id === "generic").categoryLabels.texture =
    "새 질감 카테고리";
  const c = await build({ ...sources, catalog: JSON.stringify(data) });
  assert.equal(c.bubbles.bubbles[0].label, "새 네이티브 버블");
  assert.equal(
    c.details.categories.find((c) => c.id === "texture").label,
    "새 질감 카테고리",
  );
});
test("inserted UI and unsupported inline geometry are reviewable", async () => {
  const start = sources.dining.indexOf("private var detailTagsView:");
  const changed =
    sources.dining.slice(0, start) +
    sources.dining
      .slice(start)
      .replace("VStack(spacing: 0) {", 'VStack(spacing: 0) { Text("새 영역")');
  assert.equal((await build({ ...sources, dining: changed })).status, "review");
  const input = sources.input.replace(
    "HStack(spacing: 6)",
    "HStack(spacing: 7)",
  );
  assert.equal((await build({ ...sources, input })).status, "ready"); // explicitly mapped icon gap
  const header = sources.components.replace(
    "Color.clear\n                    .frame(",
    "Color.clear\n                    .padding(7)\n                    .frame(",
  );
  assert.equal(
    (await build({ ...sources, components: header })).status,
    "review",
  );
});
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tb-feedback-sync-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const [key, file] of Object.entries(sourceFiles)) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), sources[key]);
  }
  const config = path.join(root, "brand-launch/scripts/native-feedback");
  await fs.mkdir(config, { recursive: true });
  await fs.writeFile(
    path.join(config, "structure-baseline.json"),
    JSON.stringify(baseline),
  );
  await fs.writeFile(path.join(config, "demo.json"), JSON.stringify(demo));
  return root;
}
test("watcher regenerates on an actual file save, preserves frame data, and gates structural changes", async (t) => {
  const root = await fixture(t);
  const events = [];
  const worker = await watchNativeFeedback({
    root,
    onSync: (e) => events.push(e),
  });
  t.after(() => worker.close());
  const wait = async (predicate) => {
    const until = Date.now() + 7000;
    while (!predicate() && Date.now() < until)
      await new Promise((r) => setTimeout(r, 50));
    assert.ok(
      predicate(),
      JSON.stringify(events.map((e) => e.error?.message || e.contract?.status)),
    );
  };
  await fs.writeFile(
    path.join(root, sourceFiles.theme),
    sources.theme.replace(
      "static let primaryButtonHeight: CGFloat = 48",
      "static let primaryButtonHeight: CGFloat = 52",
    ),
  );
  await wait(() => events.some((e) => e.contract?.ui.primaryHeight === 52));
  const generated = await fs.readFile(
    path.join(root, "brand-launch/src/generated/native-feedback.ts"),
    "utf8",
  );
  assert.match(generated, /"primaryHeight": 52/);
  assert.equal(
    (await syncNativeFeedback({ root, check: true })).contract.status,
    "ready",
  );
  const start = sources.dining.indexOf("private var detailTagsView:");
  await fs.writeFile(
    path.join(root, sourceFiles.dining),
    sources.dining.slice(0, start) +
      sources.dining
        .slice(start)
        .replace(
          "VStack(spacing: 0) {",
          'VStack(spacing: 0) { Text("새 영역")',
        ),
  );
  await wait(() => events.some((e) => e.contract?.status === "review"));
  await assert.rejects(syncNativeFeedback({ root, check: true }), /구조/);
});
test("freshness validation rejects an edited or missing generated module", async (t) => {
  const root = await fixture(t);
  await syncNativeFeedback({ root });
  await fs.writeFile(
    path.join(root, "brand-launch/src/generated/native-feedback.ts"),
    "stale",
  );
  await assert.rejects(syncNativeFeedback({ root, check: true }), /다릅니다/);
});

test("watcher marks missing native files as errors and recovers after restoration", async (t) => {
  const root = await fixture(t);
  const events = [];
  const worker = await watchNativeFeedback({
    root,
    onSync: (e) => events.push(e),
  });
  t.after(() => worker.close());
  const file = path.join(root, sourceFiles.theme);
  await fs.rename(file, file + ".test-backup");
  await worker.drain();
  assert.equal(events.at(-1).contract.status, "error");
  await assert.rejects(syncNativeFeedback({ root, check: true }));
  await fs.rename(file + ".test-backup", file);
  await worker.drain();
  assert.equal(events.at(-1).contract.status, "ready");
  assert.equal(
    (await syncNativeFeedback({ root, check: true })).contract.status,
    "ready",
  );
});
