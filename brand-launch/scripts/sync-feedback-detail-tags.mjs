import { syncNativeFeedback } from "./native-feedback-sync.mjs";
const result = await syncNativeFeedback();
if (result.retry || result.contract.status !== "ready")
  throw new Error("Native feedback sync needs review");
console.log(
  `${result.contract.details.categories.length} native categories synchronized`,
);
