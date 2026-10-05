import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const urls = new Map();
const moduleURL = (name) => {
  if (urls.has(name)) return urls.get(name);
  const file = new URL(
    "../src/TasteDataCategoryMotion/" + name + ".ts",
    import.meta.url,
  );
  let source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  source = source.replace(/['"]\.\/colors['"]/, () => JSON.stringify(moduleURL("colors")));
  source = source.replace(
    /['"]\.\.\/taste-motion['"]/,
    JSON.stringify(new URL("../src/taste-motion.ts", import.meta.url).href),
  );
  source = source.replace(
    /['"]\.\.\/\.\.\/\.\.\/src\/constants\/designTokens['"]/,
    JSON.stringify(
      new URL("../../src/constants/designTokens.ts", import.meta.url).href,
    ),
  );
  source = source.replace(/['"]\.\/experience-physics['"]/, () =>
    JSON.stringify(moduleURL("experience-physics")),
  );
  source = source.replace(/['"]\.\/([a-z-]+)['"]/g, (_, dependency) => JSON.stringify(moduleURL(dependency)));
  const url =
    "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  urls.set(name, url);
  return url;
};
const { fixture } = await import(moduleURL("fixtures"));
const { categoryFrame: experienceFrame, categoryIntroDuration, categoryLoopDuration } = await import(moduleURL("geometry"));
const EXPERIENCE_INTRO = categoryIntroDuration("experienceCluster");
const scenario = process.argv[2] || "standard";
if (!["standard", "dense", "empty", "added"].includes(scenario))
  throw new Error("Supported fixtures: standard, dense, empty, added");
const data = fixture("experienceCluster", scenario),
  fps = 30,
  introFrames = Math.round(EXPERIENCE_INTRO * fps),
  loopFrames = categoryLoopDuration("experienceCluster") * fps;
const final = experienceFrame(data, EXPERIENCE_INTRO);
const round = (n) => Math.round(n * 10000) / 10000;
const packFrame = (f) => ({
  values: f.dots.flatMap((d) =>
    [d.x, d.y, d.r, d.opacity, d.tint || 0].map(round),
  ),
  summaryOpacity: round(f.summaryOpacity),
  labels: f.labels,
  bridges: (f.bridges || []).map((b) => ({
    points: b.points.flatMap((p) => [p.x, p.y]).map(round),
    color: b.color,
    opacity: round(b.opacity),
  })),
});
const clip = {
  schemaVersion: 4,
  fps,
  introFrames,
  loopFrames,
  exampleData: true,
  reducedFrame: packFrame(experienceFrame(data, 0, { playback: "reduced" })),
  title: final.title,
  value: final.value,
  unit: final.unit,
  notes: final.notes,
  dots: final.dots.map(({ id, group, color, tintColor, role }) => ({
    id,
    group,
    color,
    tintColor,
    role,
  })),
  labels: final.labels,
  frames: Array.from({ length: introFrames + loopFrames }, (_, index) =>
    packFrame(experienceFrame(data, index / fps)),
  ),
};
const output = path.resolve(
  "output/category-motion/experience-v2/experience-" + scenario + ".json",
);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(clip));
console.log(
  JSON.stringify({
    output,
    frames: clip.frames.length,
    dots: clip.dots.length,
    bytes: fs.statSync(output).size,
  }),
);
