import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  block,
  match,
  numberToken,
  themeColors,
  structureSignature,
  numberTokens,
  hash,
} from "./source.mjs";

export const sourceFiles = {
  theme: "ios/TasteBuddy/DesignSystem/TBTheme.swift",
  components: "ios/TasteBuddy/Components/TBComponents.swift",
  input: "ios/TasteBuddy/Components/NativeInputComponents.swift",
  parity: "ios/TasteBuddy/Components/SystemParityComponents.swift",
  chrome: "ios/TasteBuddy/Components/Shell/AppChromeComponents.swift",
  icons: "ios/TasteBuddy/Components/LucideIcon.swift",
  palette: "ios/TasteBuddy/Models/TasteModels.swift",
  dining: "ios/TasteBuddy/Features/Dining/DiningView.swift",
  overall:
    "ios/TasteBuddy/Features/Dining/DiningOverallEvaluationStepView.swift",
  evaluation: "ios/TasteBuddy/Domain/Models/DiningOverallEvaluation.swift",
  map: "ios/TasteBuddy/Domain/Models/DiningFeedbackContractModels.swift",
  catalog: "ios/TasteBuddy/Resources/TBA/dining-sensory-v2.json",
  fixture: "ios/TasteBuddy/Resources/Fixtures/dining-feedback-scenario.json",
  sensoryLogic: "src/lib/sensoryV2.mjs",
  controlMotion: "ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift",
  dishIcons: "src/constants/dishKindIcons.ts",
};
const declarations = {
  font: ["theme", "enum TBFont"],
  typography: ["theme", "enum TBTypography"],
  restaurant: ["dining", "private var restaurantSelectionContent:"],
  menu: ["dining", "private var menuSelectionContent:"],
  dishKindGroups: ["dining", "private var dishKindSelectionGroups:"],
  dishKindGroupLabels: ["map", "enum DiningDishKindGroup:"],
  details: ["dining", "private var detailTagsView:"],
  note: ["dining", "private var reflectionView:"],
  helper: ["dining", "private var detailHelperText:"],
  photoEntry: ["dining", "private struct DiningReflectionEntryCard:"],
  camera: ["dining", "private var cameraCaptureView:"],
  cameraMetrics: ["dining", "private enum DiningFeedbackCameraControlMetrics"],
  result: ["dining", "private var resultStageContent:"],
  resultHeader: ["dining", "private var resultTopBar:"],
  resultCard: ["dining", "private struct DiningFeedbackResultCard:"],
  resultLayout: ["dining", "private enum DiningFeedbackResultLayout"],
  bubble: ["dining", "private struct TasteExperienceBubbleView:"],
  bubbleCard: ["dining", "private struct TasteExperienceSelectionCard:"],
  detailHero: ["dining", "private struct TasteExperienceDetailHero:"],
  tagSelector: ["dining", "private struct DiningDetailTagSelector:"],
  intro: ["dining", "private struct DiningFeedbackIntroHeader:"],
  addChip: ["dining", "private struct DiningFeedbackAddChipButton:"],
  input: ["input", "struct TBTextInput:"],
  inputVariant: ["input", "enum TBTextInputVariant"],
  textArea: ["input", "struct TBTextArea:"],
  chip: ["input", "struct TBSelectableChip:"],
  header: ["components", "struct TBFlowTopBar:"],
  cta: ["components", "struct TBFlowBottomCTA:"],
  primaryButton: ["components", "struct PrimaryButton:"],
  primaryAppearance: ["components", "enum PrimaryButtonAppearance"],
  controlFeedback: ["controlMotion", "enum TBControlFeedback"],
  selectionCard: ["components", "struct TBSelectionCard:"],
  sectionCard: ["components", "struct SectionCard<"],
  overall: ["overall", "struct DiningOverallEvaluationStepView:"],
  evaluation: ["evaluation", "struct DiningOverallEvaluation:"],
  backdrop: ["chrome", "private struct TBTopChromeBackdrop:"],
};
const strings = (text) =>
  [...text.matchAll(/"((?:\\.|[^"\\])*)"/g)]
    .map((m) => m[1])
    .filter((value) => !value.includes("\\("));

export async function readSources(root) {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(sourceFiles).map(async ([key, file]) => [
        key,
        await readFile(path.join(root, file), "utf8"),
      ]),
    ),
  );
}
export function inspectStructures(sources) {
  return Object.fromEntries(
    Object.entries(declarations).map(([key, [file, marker]]) => {
      const body = block(sources[file], marker);
      return [
        key,
        {
          file: sourceFiles[file],
          marker,
          signature: structureSignature(body),
          strings: strings(body),
          numbers: numberTokens(body).map((token) => token.value),
          dynamicStrings: [...body.matchAll(/"((?:\\.|[^"\\])*)"/g)]
            .map((m) => m[1])
            .filter((value) => value.includes("\\(")),
        },
      ];
    }),
  );
}
export async function buildContract(sources, baseline, demo) {
  const coverage = new Map();
  const numeric = (text, regex, name) => {
    const found = match(text, regex, name);
    const start = found.index + found[0].lastIndexOf(found[1]);
    const indices = coverage.get(text) ?? new Set();
    indices.add(start);
    coverage.set(text, indices);
    return Number(found[1]);
  };

  const structures = inspectStructures(sources);
  const review = [];
  const copy = {};
  for (const [key, current] of Object.entries(structures)) {
    const prior = baseline[key];
    if (
      prior &&
      JSON.stringify(prior.dynamicStrings) !==
        JSON.stringify(current.dynamicStrings)
    )
      review.push({
        section: key,
        file: current.file,
        message: "동적 문구가 변경되어 영상 어댑터 확인이 필요합니다.",
      });
    if (
      !prior ||
      prior.signature !== current.signature ||
      prior.strings.length !== current.strings.length
    ) {
      review.push({
        section: key,
        file: current.file,
        message: "화면 구조가 변경되어 영상 어댑터 확인이 필요합니다.",
      });
      continue;
    }
    copy[key] = Object.fromEntries(
      prior.strings.map((original, i) => [original, current.strings[i]]),
    );
  }
  const colors = themeColors(sources.theme);
  const n = (type, name) => numberToken(sources, type, name);
  const ui = {
    pagePadding: n("TBSpacing", "page"),
    pageTopPadding: n("TBSpacing", "pageTop"),
    safeAreaTop: demo.safeArea.top,
    safeAreaBottom: demo.safeArea.bottom,
    topBarHeight: n("TBSize", "topAppBarHeight"),
    topChromeMaxBlur: n("TBTopChromeBlurMetrics", "maxBlurRadius"),
    topChromeFadeExtension: n("TBTopChromeBlurMetrics", "fadeExtension"),
    titleSize: numeric(
      block(sources.components, declarations.header[1]),
      /TBFont\.bold\(([\d.]+)\)/,
      "header font",
    ),
    controlRadius: n("TBRadius", "control"),
    primaryHeight: n("TBSize", "primaryButtonHeight"),
    ctaBottomPadding: n("FlowBottomCtaMetrics", "bottomPadding"),
    ctaGap: n("FlowBottomCtaMetrics", "secondaryButtonGap"),
    ctaFadeHeight: n("FlowBottomCtaMetrics", "minHeight"),
    ctaPagePadding: n("FlowBottomCtaMetrics", "horizontalPadding"),
    ctaHelperGap: n("FlowBottomCtaMetrics", "helperBottomMargin"),
    detailSectionGap: numeric(
      block(sources.dining, declarations.details[1]),
      /VStack\(spacing:\s*(?!0\b)([\d.]+)/,
      "detail section gap",
    ),
    detailContentTop: numeric(
      block(sources.dining, declarations.details[1]),
      /padding\(\.top,\s*([\d.]+)/,
      "detail top padding",
    ),
    sectionPadding: n("TBSpacing", "card"),
    cardRadius: n("TBRadius", "card"),
    selectionPadding: n("SelectionCardMetrics", "padding"),
    selectionGap: n("SelectionCardMetrics", "gap"),
    selectionIndicator: n("SelectionCardMetrics", "indicatorSize"),
    radioDot: n("SelectionCardMetrics", "radioDotSize"),
    selectionShadowRadius: n("SelectionCardMetrics", "selectedShadowRadius"),
    selectionShadowY: n("SelectionCardMetrics", "selectedShadowYOffset"),
    fieldHeight: numeric(
      block(sources.input, "enum TBTextInputVariant"),
      /minimumHeight:[^\n]+\?\s*([\d.]+)/,
      "dining field height",
    ),
    primaryFontSize: numeric(
      block(
        block(sources.components, "enum PrimaryButtonSize:"),
        "var fontSize:",
      ),
      /case \.default:\s*([\d.]+)/,
      "CTA font",
    ),
    primaryShadowRadius: numeric(
      block(sources.components, "struct PrimaryButton:"),
      /radius:\s*([\d.]+)/,
      "CTA shadow",
    ),
    primaryShadowY: numeric(
      block(sources.components, "struct PrimaryButton:"),
      /y:\s*([\d.]+)/,
      "CTA shadow offset",
    ),
    primaryShadowOpacity: numeric(
      block(sources.components, "struct PrimaryButton:"),
      /Color\.black\.opacity\(([\d.]+)\)/,
      "CTA shadow opacity",
    ),
    chromeButtonSize: n("TBSize", "chromeIconButton"),
    homeIndicatorWidth: n("TBSize", "bottomIndicatorWidth"),
  };
  const textAreaBlock = block(sources.input, declarations.textArea[1]);
  const textArea = {
    height: numeric(
      textAreaBlock,
      /minimumHeight: CGFloat = ([\d.]+)/,
      "text area height",
    ),
    labelSize: numeric(
      textAreaBlock,
      /TBFont\.semibold\(([\d.]+)\)/,
      "text area label",
    ),
    fontSize: numeric(
      textAreaBlock,
      /TBFont\.regular\(([\d.]+)\)/,
      "text area font",
    ),
    gap: n("TBSpacing", "x8"),
    padding: n("TBSpacing", "x10"),
    // TextEditor uses UITextView's default 5pt line-fragment / 8pt text insets.
    insetX: numeric(
      textAreaBlock,
      /padding\(\.horizontal, ([\d.]+)\)/,
      "text area horizontal inset",
    ),
    insetY: n("TBSpacing", "x8"),
    focusedBorder: numeric(
      textAreaBlock,
      /isFocused \? ([\d.]+) :/,
      "text area focus border",
    ),
  };
  const controlBlock = block(
    sources.controlMotion,
    declarations.controlFeedback[1],
  );
  const controls = {
    pressDistance: numeric(
      controlBlock,
      /pressDistance: CGFloat = ([\d.]+)/,
      "control press distance",
    ),
    widthBasisDivisor: numeric(
      controlBlock,
      /widthBasisDivisor: CGFloat = ([\d.]+)/,
      "control width basis",
    ),
    minimumBasis: numeric(
      controlBlock,
      /minimumBasis: CGFloat = ([\d.]+)/,
      "control minimum basis",
    ),
    primaryPressedOpacity: numeric(
      controlBlock,
      /var opacity:[^\n]+\? ([\d.]+) :/,
      "primary press tint",
    ),
  };
  const chipBlock = block(sources.input, declarations.chip[1]);
  const chipSize = block(sources.parity, "enum ChipSize:");
  const add = block(sources.dining, declarations.addChip[1]);
  const chip = {
    height: numeric(
      chipBlock,
      /minHeight:\s*variant == \.dining \?\s*([\d.]+)/,
      "chip height",
    ),
    paddingX: numeric(
      block(chipSize, "var horizontalPadding:"),
      /case \.medium:\s*([\d.]+)/,
      "chip padding",
    ),
    paddingY: numeric(
      chipBlock,
      /padding\(\.vertical, variant == \.correction \?\s*[\d.]+\s*:\s*([\d.]+)/,
      "chip vertical padding",
    ),
    fontSize: numeric(
      block(chipSize, "var fontSize:"),
      /case \.medium:\s*([\d.]+)/,
      "chip font",
    ),
    selectedBorderOpacity: numeric(
      chipBlock,
      /border: accentAxis\.mainColor\.opacity\(([\d.]+)\)/,
      "taste chip border",
    ),
    addSize: numeric(add, /frame\(width:\s*([\d.]+)/, "add chip size"),
    borderWidth: numeric(
      chipBlock,
      /strokeBorder\(style.border, lineWidth:\s*([\d.]+)/,
      "chip border width",
    ),
    categoryFontSize: numeric(
      block(sources.dining, declarations.tagSelector[1]),
      /TBFont\.bold\(([\d.]+)\)/,
      "category font",
    ),
    gap: numeric(chipBlock, /HStack\(spacing:\s*([\d.]+)/, "chip icon gap"),
    assetSize: numeric(
      chipBlock,
      /frame\(width:\s*([\d.]+), height:/,
      "chip asset size",
    ),
    categoryHeaderGap: numeric(
      block(sources.dining, declarations.tagSelector[1]),
      /VStack\(alignment: \.leading, spacing:\s*([\d.]+)\)/,
      "detail category heading gap",
    ),
    rowGap: numeric(
      block(sources.dining, declarations.tagSelector[1]),
      /ScrollView\(\.horizontal[\s\S]*?VStack\(alignment: \.leading, spacing:\s*([\d.]+)\)/,
      "detail row gap",
    ),
    iconSize: numeric(
      block(block(sources.icons, "enum TBIcon"), "enum Size"),
      /static let small:[^=]+?=\s*([\d.]+)/,
      "small icon",
    ),
  };
  const groupBlock = block(sources.dining, declarations.dishKindGroups[1]);
  const groupLabels = block(sources.map, declarations.dishKindGroupLabels[1]);
  const groupIDs = match(
    groupLabels,
    /case ([\w, ]+)\n/,
    "dish kind group order",
  )[1]
    .split(",")
    .map((id) => id.trim());
  const fixture = JSON.parse(sources.fixture);
  const allKinds = [
    ...fixture.dishKindOptions,
    ...(fixture.legacyDishKindOptions ?? []),
  ];
  const dishKindGroups = groupIDs
    .map((id) => ({
      id,
      label: match(
        groupLabels,
        new RegExp(`case \\.${id}: return "([^"]+)"`),
        `dish kind group ${id}`,
      )[1],
      kinds: allKinds.filter(
        (kind) =>
          (kind.group ?? "ingredient") === id &&
          (id !== "legacy" || demo.dishKindIDs.includes(kind.id)),
      ),
    }))
    .filter((group) => group.kinds.length);
  const dishKindLayout = {
    gap: numeric(
      groupBlock,
      /VStack\(alignment: \.leading, spacing: ([\d.]+)\)/,
      "dish kind group gap",
    ),
    wrapGap: numeric(
      groupBlock,
      /TBWrapLayout\(spacing: ([\d.]+)\)/,
      "dish kind wrap gap",
    ),
    labelSize: numeric(
      groupBlock,
      /TBFont\.regular\(([\d.]+)\)/,
      "dish kind group label",
    ),
  };
  const dishKindIcons = JSON.parse(
    match(
      sources.dishIcons,
      / = (\{[\s\S]*\});\s*$/,
      "dish kind icon exports",
    )[1],
  );
  for (const { kinds } of dishKindGroups) {
    for (const kind of kinds) {
      if (!dishKindIcons[kind.id])
        throw new Error(`음식 종류 아이콘 없음: ${kind.id}`);
    }
  }
  const mapBody = block(sources.map, "enum TasteExperienceMapEngine");
  const mapN = (key) =>
    numeric(mapBody, new RegExp(`static let ${key}:[^=]+?=\\s*([\\d.]+)`), key);
  const bubble = {
    diameter: mapN("bubbleSize"),
    selectedDiameter: mapN("selectedBubbleSize"),
    spacing: mapN("gridSpacing"),
    entryZoom: mapN("entryZoom"),
    selectedZoom: mapN("selectedZoom"),
    relaxationIterations: numeric(
      mapBody,
      /relaxationIterations = (\d+)/,
      "map relaxation",
    ),
    labelSize: numeric(
      block(sources.dining, declarations.bubble[1]),
      /TBFont\.bold\(([\d.]+)\)/,
      "bubble font",
    ),
    selectedLabelScale: numeric(
      block(sources.dining, declarations.bubble[1]),
      /scaleEffect\(isSelected \? ([\d.]+)/,
      "bubble label scale",
    ),
    unfocusedOpacity: numeric(
      block(sources.dining, declarations.bubble[1]),
      /return (0\.\d+)/,
      "bubble unfocused opacity",
    ),
    whiteMixStep: numeric(
      block(sources.dining, declarations.bubble[1]),
      /distanceStep \* ([\d.]+)/,
      "bubble fade step",
    ),
    maximumWhiteMix: numeric(
      block(sources.dining, declarations.bubble[1]),
      /whiteMix = min\(([\d.]+)/,
      "bubble minimum fill",
    ),
    minimumTextOpacity: numeric(
      block(sources.dining, declarations.bubble[1]),
      /max\(([\d.]+), fillOpacity/,
      "bubble minimum text",
    ),
    textOpacityBoost: numeric(
      block(sources.dining, declarations.bubble[1]),
      /fillOpacity \+ ([\d.]+)/,
      "bubble text opacity",
    ),
    heroSize: numeric(
      block(sources.dining, declarations.detailHero[1]),
      /frame\(width:\s*([\d.]+)/,
      "detail hero",
    ),
  };
  const axisNames = {
    sweet: "단맛",
    sour: "신맛",
    bitter: "쓴맛",
    salty: "짠맛",
    umami: "감칠맛",
    fat: "지방맛",
  };
  const palette = Object.fromEntries(
    Object.entries(axisNames).map(([id, label]) => {
      const body = match(
        sources.palette,
        new RegExp(`static let ${id} = make\\(([\\s\\S]*?)\\n    \\)`),
        `palette ${id}`,
      )[1];
      const hex = (key) =>
        "#" +
        match(
          body,
          new RegExp(`${key}: 0x([0-9a-f]+)`, "i"),
          key,
        )[1].toUpperCase();
      return [
        label,
        {
          main: hex("main"),
          tint: /tintSurface: 0x/i.test(body)
            ? hex("tintSurface")
            : (() => {
                const white = Number(match(
                  sources.palette,
                  /tintSurface:\s*TBTasteTint\.color\(main, white: (\d+)\)/,
                  "palette white-mix surface",
                )[1]);
                if (![10, 20, 30, 40, 50, 60, 70, 80, 90, 95].includes(white))
                  throw new Error("Unsupported palette white-mix step");
                const main = hex("main");
                return "#" + [1, 3, 5].map(offset =>
                  Math.floor((parseInt(main.slice(offset, offset + 2), 16) * (100 - white) + 255 * white + 50) / 100)
                    .toString(16).padStart(2, "0"),
                ).join("").toUpperCase();
              })(),
          text: hex("tintSurfaceText"),
        },
      ];
    }),
  );
  const nativeCatalog = JSON.parse(sources.catalog);
  // Evaluate the existing cross-platform rules against the exact native catalog,
  // without relying on the separately generated web JSON or its module cache.
  const logic = sources.sensoryLogic.replace(
    /import catalog from [^;]+;/,
    `const catalog = ${JSON.stringify(nativeCatalog)};`,
  );
  const api = await import(
    `data:text/javascript;base64,${Buffer.from(logic).toString("base64")}`
  );
  const input = { menu: demo.menu, dishKindIDs: demo.dishKindIDs };
  const context = api.resolveSensoryV2Context(input);
  const details = {
    source: sourceFiles.catalog,
    ...input,
    context,
    categories: api.sensoryV2Categories(context),
  };
  const axisLabels = Object.fromEntries(
    nativeCatalog.axes.map((a) => [a.id, a.label]),
  );
  const bubbles = {
    source: sourceFiles.catalog,
    version: nativeCatalog.version,
    bubbles: nativeCatalog.axes.flatMap((axis) =>
      axis.words.map((word, i) => {
        const slot = nativeCatalog.layout.slots.find(
          (s) => s.axis === axis.id && s.index === i,
        );
        if (!slot) throw new Error(`네이티브 버블 슬롯 없음: ${axis.id}/${i}`);
        return {
          id: word.id,
          label: word.label,
          description: word.description,
          axis: axisLabels[axis.id],
          x: slot.x,
          y: slot.y,
        };
      }),
    ),
  };
  for (const [key, [file, marker]] of Object.entries(declarations)) {
    const body = block(sources[file], marker);
    const prior = baseline[key];
    const currentNumbers = numberTokens(body);
    const covered = coverage.get(body) ?? new Set();
    if (
      prior?.numbers &&
      currentNumbers.some(
        (token, i) =>
          prior.numbers[i] !== token.value && !covered.has(token.index),
      )
    ) {
      review.push({
        section: key,
        file: sourceFiles[file],
        message:
          "자동 연결되지 않은 화면 수치가 변경되었습니다. 영상 어댑터 확인이 필요합니다.",
      });
    }
  }
  return {
    schemaVersion: 1,
    sourceHash: hash(sources),
    status: review.length ? "review" : "ready",
    review,
    sourceFiles: Object.values(sourceFiles),
    ui,
    colors,
    chip,
    bubble,
    textArea,
    controls,
    palette,
    copy,
    details,
    bubbles,
    dishKinds: fixture.dishKindOptions,
    dishKindGroups,
    dishKindLayout,
    dishKindIcons,
    selectedDishKindIDs: demo.dishKindIDs,
  };
}
