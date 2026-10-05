import { sha256 } from "../../../scripts/tba-engine/sha256.mjs";
export const nativeEvidenceID = (parts: unknown[]) =>
  sha256(JSON.stringify(parts).replace(/\//g, "\\/")).slice(0, 24);
