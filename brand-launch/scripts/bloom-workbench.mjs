import { context } from "esbuild";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import "./sync-bloom-workbench.mjs";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const require = createRequire(import.meta.url);
const output = await mkdtemp(path.join(os.tmpdir(), "taste-bloom-workbench-"));
await mkdir(path.join(project, "output/bloom-workbench"), { recursive: true });
await symlink(path.join(project, "public/fonts"), path.join(output, "fonts"));
await symlink(
  path.join(project, "output/bloom-workbench"),
  path.join(output, "exports"),
);
await writeFile(
  path.join(output, "index.html"),
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Taste Buddy · Bloom Studio</title><link rel="stylesheet" href="/workbench.css"></head><body><div id="root"></div><script src="/workbench.js"></script></body></html>`,
);
const ctx = await context({
  absWorkingDir: project,
  entryPoints: ["src/TasteBloomWorkbench/standalone.tsx"],
  outfile: path.join(output, "workbench.js"),
  bundle: true,
  jsx: "automatic",
  platform: "browser",
  sourcemap: true,
  external: ["/fonts/*"],
  alias: {
    react: path.dirname(require.resolve("react/package.json")),
    "react-dom": path.dirname(require.resolve("react-dom/package.json")),
  },
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "info",
});
await ctx.watch();
const server = await ctx.serve({
  host: "127.0.0.1",
  port: 3111,
  servedir: output,
});
console.log(`Bloom Studio ready: http://localhost:${server.port}`);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await ctx.dispose();
    process.exit(0);
  });
