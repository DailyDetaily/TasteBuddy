import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const sourceRoot = "/Users/sinjunho/Desktop/Taste Buddy BX Plan/public";
const registryPath = path.join(sourceRoot, "portfolio-media.js");
const { portfolioMedia } = await import(
  "data:text/javascript;base64," +
    Buffer.from(await fs.readFile(registryPath, "utf8")).toString("base64")
);
const chosen = [
  ["Logo-Black", "Taste Buddy", "Brand signature", "hero", "logo-black"],
  [
    "TasteBuddy-Petal-Shorts",
    "심벌의 움직임",
    "Symbol motion",
    "phone",
    "petal",
  ],
  ["LogoGrid", "형태의 원리", "Logo grid", "grid", "logo-grid"],
  ["Sauce-Symbol", "감각을 담는 모양", "Sauce symbol", "sauce", null],
  [
    "Kinetic-Statements",
    "취향을 말하는 언어",
    "Kinetic typography",
    "kinetic",
    "kinetic",
  ],
  [
    "TasteBloom-Profile",
    "나다운 취향",
    "Personal signature",
    "profile",
    "bloom-profile",
  ],
  [
    "TasteBloom-9",
    "저마다 다른 취향",
    "Bloom variations",
    "bloom",
    "bloom-gallery",
  ],
  [
    "TasteBloom-Wave",
    "서로 이어지는 취향",
    "A wave of tastes",
    "wave",
    "bloom-wave",
  ],
  [
    "TasteBloom-Controls-Demo",
    "나만의 미각을 만들어요",
    "Make it yours",
    "controls",
    null,
  ],
  [
    "TasteBloom-Profile-Landscape",
    "취향이 피어나는 순간",
    "Taste Bloom profile",
    "landscape",
    "bloom-profile",
  ],
  [
    "TasteMotion-completeFlow",
    "분석에서 피드백까지",
    "Taste Motion",
    "flow",
    null,
  ],
  ["TasteCategory-Experience", "경험", "Experience", "category", "experience"],
  ["TasteCategory-Sensation", "감각", "Sensation", "category", "sensation"],
  ["TasteCategory-Preference", "취향", "Preference", "category", "preference"],
  ["TasteCategory-Context", "맥락", "Context", "category", "context"],
  ["TasteCategory-Change", "변화", "Change", "category", "change"],
  ["TasteBubbleMap", "감각 사이의 관계", "Sensory vocabulary", "map", null],
  [
    "TasteGraph-Bar",
    "기록이 쌓이는 방식",
    "Every record adds up",
    "graph",
    "graph-bar",
  ],
  [
    "TasteGraph-TasteChange",
    "변화가 보이는 순간",
    "Change becomes visible",
    "graph",
    "graph-change",
  ],
  [
    "HomePeriodInsightCard",
    "일상에서 발견한 패턴",
    "Patterns in everyday meals",
    "insight",
    "insight-card",
  ],
  [
    "DiningFeedback-Flip",
    "경험을 담는 카드",
    "Dining feedback",
    "dining",
    null,
  ],
];
await fs.mkdir("public/plating/bx-plan", { recursive: true });
const output = [];
for (const [id, title, label, layout, detail] of chosen) {
  const entry = portfolioMedia.find((x) => x.id === id);
  if (!entry) throw new Error("Missing BX PLAN registry item " + id);
  const source = path.join(sourceRoot, entry.src);
  const bytes = await fs.readFile(source);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const filename = path.basename(entry.src);
  await fs.writeFile(path.join("public/plating/bx-plan", filename), bytes);
  const posterName = path.basename(entry.poster);
  await fs.copyFile(
    path.join(sourceRoot, entry.poster),
    path.join("public/plating/bx-plan", posterName),
  );
  const probe = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,r_frame_rate:format=duration",
      "-of",
      "json",
      source,
    ],
    { encoding: "utf8" },
  );
  if (probe.status) throw new Error(probe.stderr);
  const media = JSON.parse(probe.stdout);
  output.push({
    id,
    title,
    label,
    layout,
    detail,
    video: "/plating/bx-plan/" + filename,
    poster: "/plating/bx-plan/" + posterName,
    width: media.streams[0].width,
    height: media.streams[0].height,
    duration: Number(media.format.duration),
    fps: media.streams[0].r_frame_rate,
    sha256,
    registrySha256: entry.sha256,
    registryHashMatches: entry.sha256 === sha256,
    source,
    registry: registryPath,
    sourceSite: "Taste Buddy BX Plan",
  });
}
await fs.writeFile(
  "src/plating/bx-home.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  `Copied ${output.length} byte-identical BX PLAN videos and original posters. Source project unchanged.`,
);
