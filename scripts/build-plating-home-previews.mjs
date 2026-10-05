import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const films = JSON.parse(await fs.readFile("src/plating/bx-home.json", "utf8"));
const selected = new Set([
  "Sauce-Symbol",
  "LogoGrid",
  "TasteBuddy-Petal-Shorts",
  "Kinetic-Statements",
  "TasteBubbleMap",
  "TasteBloom-Profile",
]);
const urls = {},
  evidence = [];
await fs.mkdir("public/plating/bx-preview", { recursive: true });
for (const film of films.filter((f) => selected.has(f.id))) {
  const filename = film.id.toLowerCase() + ".mp4",
    path = "public/plating/bx-preview/" + filename;
  const result = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-i",
      film.source,
      "-map",
      "0:v:0",
      "-an",
      "-vf",
      "scale=min(960\\,iw):-2:flags=lanczos",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-threads",
      "2",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      path,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(result.stderr);
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
      path,
    ],
    { encoding: "utf8" },
  );
  if (probe.status) throw new Error(probe.stderr);
  const data = JSON.parse(probe.stdout),
    stream = data.streams[0];
  if (
    stream.r_frame_rate !== film.fps ||
    Math.abs(Number(data.format.duration) - film.duration) > 0.05
  )
    throw new Error("Timing mismatch " + film.id);
  const bytes = await fs.readFile(path);
  urls[film.id] = "/plating/bx-preview/" + filename;
  evidence.push({
    id: film.id,
    source: film.source,
    sourceSha256: film.sha256,
    preview: urls[film.id],
    previewSha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    width: stream.width,
    height: stream.height,
    fps: stream.r_frame_rate,
    duration: Number(data.format.duration),
    derivation:
      "Proportional downscale without crop; source timing preserved; original retained",
  });
  console.log(
    film.id +
      ": " +
      stream.width +
      "×" +
      stream.height +
      " / " +
      Math.round(bytes.length / 1024) +
      " KiB",
  );
}
await fs.writeFile(
  "src/plating/bx-previews.json",
  JSON.stringify(urls, null, 2) + "\n",
);
await fs.writeFile(
  "output/plating/home-preview-evidence.json",
  JSON.stringify(evidence, null, 2) + "\n",
);
