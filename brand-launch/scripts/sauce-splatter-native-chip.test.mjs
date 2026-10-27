import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";
import ts from "typescript";
import { build } from "esbuild";
import { block } from "./native-feedback/source.mjs";

const dir = await mkdtemp(path.join(os.tmpdir(), "tb-native-chip-"));
after(() => rm(dir, { recursive: true, force: true }));
await build({
  stdin: {
    contents: `export * from './src/SauceSplatter/native-chip';
      export * from './src/DiningFeedbackMotion/ResultChip';
      export {DISH_KIND_ICON_NODES as icons} from '../src/constants/dishKindIcons';
      export {createElement as h} from 'react';
      export {renderToStaticMarkup as render} from 'react-dom/server';`,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  outfile: path.join(dir, "current.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
});
const current = createRequire(import.meta.url)(path.join(dir, "current.cjs"));
const input = await readFile(
  "../ios/TasteBuddy/Components/NativeInputComponents.swift",
  "utf8",
);
const parity = await readFile(
  "../ios/TasteBuddy/Components/SystemParityComponents.swift",
  "utf8",
);
const theme = await readFile(
  "../ios/TasteBuddy/DesignSystem/TBTheme.swift",
  "utf8",
);
const dining = await readFile(
  "../ios/TasteBuddy/Features/Dining/DiningView.swift",
  "utf8",
);
const chip = block(input, "struct TBSelectableChip:");
const size = block(parity, "enum ChipSize:");
const number = (source, regex) => Number(source.match(regex)?.[1] ?? NaN);
const root = ts.createSourceFile(
  "Root.tsx",
  await readFile("src/Root.tsx", "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let propsExpression;
function visit(node) {
  if (
    ts.isJsxSelfClosingElement(node) &&
    node.attributes.properties.some(
      (attr) =>
        ts.isJsxAttribute(attr) &&
        attr.name.getText(root) === "id" &&
        attr.initializer?.text === "Sauce-Splatter",
    )
  ) {
    propsExpression = node.attributes.properties
      .find((attr) => attr.name?.getText(root) === "defaultProps")
      .initializer.expression.getText(root);
  }
  ts.forEachChild(node, visit);
}
visit(root);
const compiled = ts.transpileModule(`export default ${propsExpression}`, {
  compilerOptions: { module: ts.ModuleKind.ES2022 },
}).outputText;
const props = (
  await import(
    `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
  )
).default;

test("food chip metrics follow current TBSelectableChip and ChipSize.medium", () => {
  const m = current.nativeDishChipMetrics;
  assert.equal(
    m.height,
    number(chip, /minHeight: variant == \.dining \? (\d+)/),
  );
  assert.equal(
    m.fontSize,
    number(block(size, "var fontSize:"), /case \.medium: (\d+)/),
  );
  assert.equal(
    m.paddingX,
    number(block(size, "var horizontalPadding:"), /case \.medium: (\d+)/),
  );
  assert.equal(
    m.paddingY,
    number(chip, /padding\(\.vertical, variant == \.correction \? \d+ : (\d+)/),
  );
  assert.equal(m.iconGap, number(chip, /HStack\(spacing: (\d+)/));
  assert.equal(
    current.nativeDishIconSize,
    number(chip, /frame\(width: (\d+), height:/),
  );
  assert.equal(
    m.borderWidth,
    number(chip, /strokeBorder\(style.border, lineWidth: (\d+)/),
  );
  assert.equal(
    current.nativeDishChipGap,
    number(
      block(dining, "private var dishKindSelectionGroups:"),
      /TBWrapLayout\(spacing: (\d+)/,
    ),
  );
  assert.match(size, /TBFont\.medium\(fontSize\)/);
  assert.match(block(theme, "static func medium("), /Pretendard-Medium/);
  assert.equal(m.fontWeight, 500);
});

test("default and selected colors follow native light-mode style branches", () => {
  const light = block(theme, "enum TBLightColor {");
  const hex = (key) => {
    const value = light.match(
      new RegExp(`static let ${key} = Color\\(hex: 0x([A-Fa-f0-9]+)\\)`),
    );
    return value
      ? `#${value[1]}`
      : (assert.match(light, new RegExp(`static let ${key} = Color.white`)),
        "#FFFFFF");
  };
  assert.match(
    block(input, "enum TBSelectableChipVariant"),
    /\.dining \? TBColor\.mutedSurface/,
  );
  assert.match(
    block(input, "enum TBSelectableChipVariant"),
    /\.dining \? TBColor\.border/,
  );
  assert.match(
    chip,
    /ChipStyle\.resolve\(tone: \.neutral, variant: \.soft\).foreground/,
  );
  assert.match(
    parity,
    /case \(\.neutral, \.soft\):[\s\S]*?foreground: TBColor.textTertiary/,
  );
  assert.match(theme, /static let borderSelected = selectionSurface/);
  assert.deepEqual(current.nativeDishChipColors(false), {
    fill: hex("mutedSurface"),
    border: hex("border"),
    text: hex("textTertiary"),
  });
  assert.deepEqual(current.nativeDishChipColors(true), {
    fill: hex("selectionSurface"),
    border: hex("selectionSurface"),
    text: hex("selectionText"),
  });
});

test("all 24 labels and icon geometry match the native fixture and SVG assets", async () => {
  const fixture = JSON.parse(
    await readFile(
      "../ios/TasteBuddy/Resources/Fixtures/dining-feedback-scenario.json",
      "utf8",
    ),
  );
  assert.equal(props.칩.length, 24);
  for (const item of props.칩) {
    assert.equal(
      fixture.dishKindOptions.find((kind) => kind.id === item.아이콘)?.label,
      item.문구,
    );
    assert.ok(current.icons[item.아이콘]?.length);
  }
  const selected = Object.fromEntries(
    props.칩.map((item) => [item.아이콘, current.icons[item.아이콘]]),
  );
  execFileSync(
    "python3",
    [
      "-c",
      `import json,sys,xml.etree.ElementTree as ET
from pathlib import Path
for kind,nodes in json.load(sys.stdin).items():
 p=Path('../ios/TasteBuddy/Resources/Assets.xcassets/DishKindIcons')/('DishKind-'+kind+'.imageset')/('DishKind-'+kind+'.svg')
 root=ET.parse(p).getroot()
 assert root.attrib['viewBox']=='0 0 24 24'
 assert root.attrib['stroke-width']=='2'
 actual=[[n.tag.split('}')[-1],dict(n.attrib)] for n in root]
 assert actual==nodes, kind
`,
    ],
    { input: JSON.stringify(selected), encoding: "utf8" },
  );
});

test("the bundled medium font is the same file as the native font", async () => {
  assert.deepEqual(
    await readFile("public/fonts/Pretendard-Medium.otf"),
    await readFile("../ios/TasteBuddy/Resources/Pretendard-Medium.otf"),
  );
});

test("existing result chips keep their original markup without native metrics", async () => {
  const original = execFileSync(
    "git",
    ["show", "HEAD:brand-launch/src/DiningFeedbackMotion/ResultChip.tsx"],
    { encoding: "utf8" },
  );
  await build({
    stdin: {
      contents: original,
      resolveDir: path.resolve("src/DiningFeedbackMotion"),
      loader: "tsx",
    },
    outfile: path.join(dir, "original.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
  });
  const previous = createRequire(import.meta.url)(
    path.join(dir, "original.cjs"),
  );
  for (const axis of [
    undefined,
    "단맛",
    "신맛",
    "쓴맛",
    "짠맛",
    "감칠맛",
    "지방맛",
  ]) {
    assert.equal(
      current.render(current.h(current.ResultChip, { label: "기존 칩", axis })),
      current.render(
        current.h(previous.ResultChip, { label: "기존 칩", axis }),
      ),
    );
  }
});
