import fs from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import {
  buildContract,
  inspectStructures,
  readSources,
  sourceFiles,
} from "./native-feedback/contract.mjs";
import { hash } from "./native-feedback/source.mjs";

const script = fileURLToPath(import.meta.url);
export const defaultRoot = path.resolve(path.dirname(script), "../..");
const generatedRelative = "brand-launch/src/generated/native-feedback.ts";
const manifestRelative = "brand-launch/.native-feedback-sync/manifest.json";
const configRelative = "brand-launch/scripts/native-feedback";
const readJSON = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
export async function atomicWrite(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  if ((await fs.readFile(file, "utf8").catch(() => null)) === content)
    return false;
  const tmp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, content);
  await fs.rename(tmp, file);
  return true;
}
export const serialize = (contract) =>
  `// Generated from native SwiftUI sources by native-feedback-sync.mjs. Do not edit.\nexport const nativeFeedback = ${JSON.stringify(contract, null, 2)} as const;\nexport const nativeFeedbackSync: {status: 'ready' | 'review' | 'error'; sourceHash: string; review: readonly {section: string; file: string; message: string}[]} = nativeFeedback;\n`;
const liveMetadata = (contract) =>
  JSON.stringify({
    inputHash: contract.inputHash,
    status: contract.status,
    review: contract.review,
  }) + "\n";
async function publishFailure(root, error) {
  const manifest = path.join(root, manifestRelative);
  const previous = await readJSON(manifest).catch(() => null);
  if (!previous) return { error };
  const contract = {
    ...previous,
    status: "error",
    inputHash: hash(error.message),
    review: [
      { section: "source", file: "ios/TasteBuddy", message: error.message },
    ],
  };
  await atomicWrite(manifest, JSON.stringify(contract, null, 2) + "\n");
  const changed = await atomicWrite(
    path.join(root, generatedRelative),
    serialize(contract),
  );
  await atomicWrite(
    path.join(root, "brand-launch/public/native-feedback-sync.json"),
    liveMetadata(contract),
  );
  return { contract, changed, error };
}

export async function syncNativeFeedback({
  root = defaultRoot,
  check = false,
  acceptStructure = false,
} = {}) {
  const sources = await readSources(root);
  const basePath = path.join(root, configRelative, "structure-baseline.json");
  const demo = await readJSON(path.join(root, configRelative, "demo.json"));
  const baseline = acceptStructure
    ? inspectStructures(sources)
    : await readJSON(basePath);
  const manifest = path.join(root, manifestRelative);
  let contract;
  try {
    contract = await buildContract(sources, baseline, demo);
    contract.inputHash = hash({ sources, baseline, demo });
    if (hash(await readSources(root)) !== hash(sources)) return { retry: true };
  } catch (error) {
    if (check) throw error;
    const previous = await readJSON(manifest).catch(() => null);
    if (!previous) throw error;
    contract = {
      ...previous,
      status: "error",
      sourceHash: hash(sources),
      review: [
        { section: "source", file: "ios/TasteBuddy", message: error.message },
      ],
      inputHash: hash({ sources, baseline, demo }),
    };
  }
  const output = path.join(root, generatedRelative);
  if (check) {
    if (contract.status !== "ready")
      throw new Error(
        contract.review
          .map((r) => `${r.file} (${r.section}): ${r.message}`)
          .join("\n"),
      );
    if (
      (await fs.readFile(output, "utf8").catch(() => null)) !==
      serialize(contract)
    )
      throw new Error(
        "네이티브 소스와 영상 UI가 다릅니다. npm run sync:feedback를 실행해 주세요.",
      );
    const live = await fs
      .readFile(
        path.join(root, "brand-launch/public/native-feedback-sync.json"),
        "utf8",
      )
      .catch(() => null);
    if (live !== liveMetadata(contract))
      throw new Error("Studio 동기화 상태 파일이 최신이 아닙니다.");
    return { contract, changed: false };
  }
  if (acceptStructure)
    await atomicWrite(basePath, JSON.stringify(baseline, null, 2) + "\n");
  await atomicWrite(manifest, JSON.stringify(contract, null, 2) + "\n");
  const changed = await atomicWrite(output, serialize(contract));
  await atomicWrite(
    path.join(root, "brand-launch/public/native-feedback-sync.json"),
    liveMetadata(contract),
  );
  return { contract, changed };
}

// Real file watcher plus content polling, coalescing edits and handling saves
// that replace entire files. The manifest/module publish only complete revisions.
export async function watchNativeFeedback({
  root = defaultRoot,
  onSync = () => {},
  studioPID,
} = {}) {
  let closed = false,
    timer,
    running = false,
    queued = false,
    lastInputs,
    lastError;
  const drain = async () => {
    if (closed) return;
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      const sources = await readSources(root);
      const baseline = await fs.readFile(
        path.join(root, configRelative, "structure-baseline.json"),
        "utf8",
      );
      const demo = await fs.readFile(
        path.join(root, configRelative, "demo.json"),
        "utf8",
      );
      const inputHash = hash({ sources, baseline, demo });
      if (inputHash !== lastInputs) {
        const result = await syncNativeFeedback({ root });
        if (result.retry) queued = true;
        else {
          lastInputs = inputHash;
          lastError = undefined;
          onSync(result);
        }
      }
    } catch (error) {
      lastInputs = undefined;
      if (lastError !== error.message) {
        lastError = error.message;
        onSync(await publishFailure(root, error));
      }
    } finally {
      running = false;
      if (queued && !closed) {
        queued = false;
        timer = setTimeout(drain, 200);
      }
    }
  };
  const notify = () => {
    clearTimeout(timer);
    timer = setTimeout(drain, 250);
  };
  const watchers = [];
  for (const file of [
    ...Object.values(sourceFiles),
    configRelative + "/demo.json",
    configRelative + "/structure-baseline.json",
  ]) {
    try {
      watchers.push(watch(path.join(root, file), notify));
    } catch {
      /* polling handles rename/missing files */
    }
  }
  const poll = setInterval(() => {
    if (studioPID) {
      try {
        process.kill(studioPID, 0);
      } catch {
        close();
        return;
      }
    }
    void drain();
  }, 1500);
  function close() {
    closed = true;
    clearTimeout(timer);
    clearInterval(poll);
    watchers.forEach((w) => w.close());
  }
  await drain();
  return { close, drain };
}

async function main() {
  const args = process.argv.slice(2);
  const rootArg = args.indexOf("--root");
  const root = rootArg < 0 ? defaultRoot : path.resolve(args[rootArg + 1]);
  if (args.includes("--watch")) {
    const pidAt = args.indexOf("--studio-pid");
    const ownerPath = path.join(
      root,
      "brand-launch/.native-feedback-sync/watcher.json",
    );
    const prior = await readJSON(ownerPath).catch(() => null);
    if (prior?.pid) {
      try {
        process.kill(prior.pid, 0);
        throw new Error(`동기화 감시가 이미 실행 중입니다 (PID ${prior.pid}).`);
      } catch (e) {
        if (e.code !== "ESRCH") throw e;
      }
    }
    await atomicWrite(
      ownerPath,
      JSON.stringify({ pid: process.pid, root }) + "\n",
    );
    const worker = await watchNativeFeedback({
      root,
      studioPID: pidAt < 0 ? undefined : Number(args[pidAt + 1]),
      onSync: ({ contract, changed, error }) => {
        if (error) console.error(`[native-feedback] ${error.message}`);
        else if (changed)
          console.log(
            `[native-feedback] ${contract.status}: ${contract.sourceHash.slice(0, 12)} (${contract.review.length} review)`,
          );
      },
    });
    const close = () => {
      worker.close();
    };
    process.on("SIGINT", close);
    process.on("SIGTERM", close);
    return;
  }
  const result = await syncNativeFeedback({
    root,
    check: args.includes("--check"),
    acceptStructure: args.includes("--accept-structure"),
  });
  if (result.retry)
    throw new Error("저장 중인 소스가 있습니다. 동기화를 다시 실행해 주세요.");
  console.log(
    `[native-feedback] ${result.contract.status}: ${result.contract.sourceHash.slice(0, 12)}`,
  );
  if (result.contract.status !== "ready" && !args.includes("--allow-review"))
    process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === script)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
