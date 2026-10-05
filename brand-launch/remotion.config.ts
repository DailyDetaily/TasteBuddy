import { execFileSync } from "node:child_process";
import path from "node:path";
/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");

// Also cover direct `npx remotion studio/render` invocations.
const syncScript = path.resolve("scripts/native-feedback-sync.mjs");
execFileSync(process.execPath, [syncScript, "--allow-review"], {
  stdio: "inherit",
});
if (!process.argv.includes("studio")) {
  execFileSync(process.execPath, [syncScript, "--check"], { stdio: "inherit" });
}
