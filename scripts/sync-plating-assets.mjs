import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "public/plating");
const high = "output/branding/work/portfolio-20260929/high-resolution";
const entries = [
  [
    "logo-black",
    "Logo-Black",
    `${high}/Logo-Black.mp4`,
    "brand-launch/src/LogoGrid/LogoBlack.tsx",
    "로고",
    "로고의 등장과 서명",
    "로고",
    "16:9",
  ],
  [
    "logo-grid",
    "LogoGrid",
    `${high}/LogoGrid.mp4`,
    "brand-launch/src/LogoGrid/LogoGrid.tsx",
    "로고 작도",
    "조형의 원리를 드러내는 그리드",
    "로고",
    "16:9",
  ],
  [
    "petal",
    "TasteBuddy-Petal-Shorts",
    `${high}/TasteBuddy-Petal-Shorts.mp4`,
    "brand-launch/src/PetalLogo/index.tsx",
    "꽃잎",
    "원본 꽃잎의 펼침과 접힘",
    "로고",
    "9:16",
  ],
  [
    "kinetic",
    "Kinetic-Statements",
    `${high}/Kinetic-Statements.mp4`,
    "brand-launch/src/KineticStatements/index.tsx",
    "키네틱 타이포",
    "Kalice의 획에서 시작하는 문장",
    "타이포그래피",
    "16:9",
  ],
  [
    "bloom-gallery",
    "TasteBloom-9",
    `${high}/TasteBloom-9.mp4`,
    "brand-launch/src/TasteBloomAvatars/index.tsx",
    "Taste Bloom",
    "서로 다른 미각의 꽃",
    "그래픽",
    "1:1",
  ],
  [
    "bloom-wave",
    "TasteBloom-Wave",
    `${high}/TasteBloom-Wave.mp4`,
    "brand-launch/src/TasteBloomAvatars/index.tsx",
    "블룸 웨이브",
    "중심에서 바깥으로 전해지는 흐름",
    "그래픽",
    "1:1",
  ],
  [
    "bloom-profile",
    "TasteBloom-Profile-Landscape",
    `${high}/TasteBloom-Profile-Landscape.mp4`,
    "brand-launch/src/TasteBloomAvatars/Profile.tsx",
    "미각 프로필",
    "제품의 프로필을 브랜드 장면으로",
    "그래픽",
    "16:9",
  ],
  [
    "experience",
    "TasteCategory-Experience",
    `${high}/TasteCategory-Experience.mp4`,
    "brand-launch/src/TasteDataCategoryMotion/index.tsx",
    "경험",
    "기록이 쌓이는 형태",
    "카테고리",
    "16:9",
  ],
  [
    "sensation",
    "TasteCategory-Sensation",
    `${high}/TasteCategory-Sensation.mp4`,
    "brand-launch/src/TasteDataCategoryMotion/index.tsx",
    "감각",
    "감각의 연결과 움직임",
    "카테고리",
    "16:9",
  ],
  [
    "preference",
    "TasteCategory-Preference",
    `${high}/TasteCategory-Preference.mp4`,
    "brand-launch/src/TasteDataCategoryMotion/index.tsx",
    "취향",
    "서로 다른 방향의 관계",
    "카테고리",
    "16:9",
  ],
  [
    "context",
    "TasteCategory-Context",
    `${high}/TasteCategory-Context.mp4`,
    "brand-launch/src/TasteDataCategoryMotion/index.tsx",
    "맥락",
    "조건에 따라 달라지는 관계",
    "카테고리",
    "16:9",
  ],
  [
    "change",
    "TasteCategory-Change",
    `${high}/TasteCategory-Change.mp4`,
    "brand-launch/src/TasteDataCategoryMotion/index.tsx",
    "변화",
    "시간에 따라 달라지는 인상",
    "카테고리",
    "16:9",
  ],
  [
    "graph-bar",
    "TasteGraph-Bar",
    `${high}/TasteGraph-Bar.mp4`,
    "brand-launch/src/GraphMotion/BarGraph.tsx",
    "막대 그래프",
    "캡슐의 성장과 안착",
    "제품 연출",
    "16:9",
  ],
  [
    "graph-change",
    "TasteGraph-TasteChange",
    `${high}/TasteGraph-TasteChange.mp4`,
    "brand-launch/src/GraphMotion/TasteChangeGraph.tsx",
    "미각 변화",
    "선을 따라 움직이는 끝점",
    "제품 연출",
    "16:9",
  ],
  [
    "insight-card",
    "HomePeriodInsightCard",
    `${high}/HomePeriodInsightCard.mp4`,
    "brand-launch/src/HomePeriodInsightMotion/index.tsx",
    "인사이트 카드",
    "순서대로 펼쳐지는 해석",
    "제품 연출",
    "16:9",
  ],
  [
    "bloom-frame",
    "TabBar-CameraEntry-Portrait",
    "brand-launch/output/tabbar-camera-entry/result-card-bloom-20260930/short-inner-delay/bloom-frame-short-inner-delay.mp4",
    "brand-launch/src/TabBarCameraEntry/result-card-motion.ts",
    "블룸 프레임",
    "심벌에서 사진을 담는 프레임으로",
    "시그니처 모션",
    "원본",
  ],
  [
    "sauce-splatter",
    "TabBar-CameraEntry-Portrait",
    "brand-launch/output/tabbar-camera-entry/chip-metaball-20260930/chip-entrance-preview.mp4",
    "brand-launch/src/DiningFeedbackMotion/chip-motion.ts",
    "소스 스플래터",
    "다음 원으로 이어지는 선택",
    "시그니처 모션",
    "원본",
  ],
];

await fs.mkdir(output, { recursive: true });
const manifest = [];
for (const [
  id,
  composition,
  source,
  renderer,
  title,
  description,
  category,
  intendedRatio,
] of entries) {
  const bytes = await fs.readFile(path.join(root, source));
  const destination = path.join(output, `${id}.mp4`);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  let changed = true;
  try {
    changed =
      createHash("sha256")
        .update(await fs.readFile(destination))
        .digest("hex") !== sha256;
  } catch {}
  if (changed) await fs.writeFile(destination, bytes);
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
      destination,
    ],
    { encoding: "utf8" },
  );
  if (probe.status !== 0) throw new Error(probe.stderr);
  const data = JSON.parse(probe.stdout),
    stream = data.streams[0],
    duration = Number(data.format.duration);
  const poster = path.join(output, `${id}.jpg`);
  let posterExists = true;
  try {
    await fs.access(poster);
  } catch {
    posterExists = false;
  }
  if (changed || !posterExists) {
    const result = spawnSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-ss",
      String(Math.min(duration * 0.52, 5)),
      "-i",
      destination,
      "-frames:v",
      "1",
      "-vf",
      "scale=960:-2",
      "-q:v",
      "3",
      poster,
    ]);
    if (result.status !== 0) throw new Error(String(result.stderr));
  }
  manifest.push({
    id,
    title,
    description,
    category,
    composition,
    source,
    renderer,
    intendedRatio,
    width: stream.width,
    height: stream.height,
    fps: stream.r_frame_rate,
    duration,
    sha256,
    bytes: bytes.length,
    video: `/plating/${id}.mp4`,
    poster: `/plating/${id}.jpg`,
    evidence: "기존 렌더",
    exportedAt: source.includes("20260930") ? "2026-09-30" : "2026-09-29",
  });
}
for (const file of ["symbol.svg", "wordmark.svg"])
  await fs.copyFile(
    path.join(root, "brand-launch/public/brand", file),
    path.join(output, file),
  );
for (const file of [
  "Pretendard-Regular.otf",
  "Pretendard-Medium.otf",
  "Pretendard-SemiBold.otf",
  "Pretendard-Bold.otf",
  "Kalice-Trial-Regular.otf",
  "LICENSE.txt",
])
  await fs.copyFile(
    path.join(root, "brand-launch/public/fonts", file),
    path.join(output, file),
  );
await fs.mkdir(path.join(root, "src/plating"), { recursive: true });
await fs.writeFile(
  path.join(root, "src/plating/assets.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Prepared ${manifest.length} source-preserving videos, frame posters, SVGs and licensed Pretendard files.`,
);
