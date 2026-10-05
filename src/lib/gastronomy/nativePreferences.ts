import {
  canonical,
  decodeNativeValue,
  encodeNativeValue,
  type NativeSnapshot,
} from "./nativeRecord";
import type {
  PreferenceIntakeProfile,
  PreferenceIntakeResponses,
} from "../../constants/preferenceIntakeData";
import { isPreferenceIntakeSubmission } from "../preferenceIntakeEvidence.mjs";
export const NATIVE_PREFERENCE_PROFILE = "tastebuddy.ios.preference-profile.v1";
export const NATIVE_PREFERENCE_DRAFT =
  "tastebuddy.ios.preference-intake-draft.v1";
const arrays = [
  "allergies",
  "avoidedSignals",
  "dietaryRestrictions",
  "preferredCuisineTypes",
] as const;
const singles = [
  "explorationStyle",
  "flavorIntensityPreference",
  "sharePreferenceWithRestaurant",
] as const;
export function preferenceSignature(s: NativeSnapshot) {
  return canonical([
    s.values[NATIVE_PREFERENCE_PROFILE] ?? null,
    s.values[NATIVE_PREFERENCE_DRAFT] ?? null,
  ]);
}
function decode(raw: string | undefined): PreferenceIntakeProfile | null {
  if (raw === undefined) return null;
  const value = decodeNativeValue(raw);
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("선호 응답 원본을 읽지 못했어요. 원본은 유지되어 있어요.");
  const p = value as Record<string, unknown>;
  if (
    arrays.some(
      (k) =>
        !Array.isArray(p[k]) ||
        !(p[k] as unknown[]).every((v) => typeof v === "string"),
    ) ||
    singles.some((k) => p[k] != null && typeof p[k] !== "string") ||
    (p.submissions != null && !Array.isArray(p.submissions))
  )
    throw Error("선호 응답 원본을 읽지 못했어요. 원본은 유지되어 있어요.");
  // Preserve future submissions verbatim. Evidence readers decide which versions they can interpret.
  return p as unknown as PreferenceIntakeProfile;
}
export function readNativePreferences(s: NativeSnapshot) {
  return {
    profile: decode(s.values[NATIVE_PREFERENCE_PROFILE]),
    draft: decode(s.values[NATIVE_PREFERENCE_DRAFT]),
    present: NATIVE_PREFERENCE_PROFILE in s.values,
    signature: preferenceSignature(s),
  };
}
export function updateNativePreferences(
  s: NativeSnapshot,
  value: PreferenceIntakeProfile | PreferenceIntakeResponses,
  expected: string,
  complete = false,
): NativeSnapshot {
  if (preferenceSignature(s) !== expected)
    throw Error(
      "다른 곳에서 선호 응답이 바뀌었어요. 선택을 보관한 뒤 다시 열어 확인해 주세요.",
    );
  const state = readNativePreferences(s),
    encoded = encodeNativeValue(value);
  decode(encoded);
  if (complete) {
    const submissions = (value as PreferenceIntakeProfile).submissions ?? [],
      latest = submissions.at(-1);
    if (
      !latest ||
      !isPreferenceIntakeSubmission(latest) ||
      latest.userID !== "local-owner" ||
      latest.responses.some((r) => r.state !== "answered")
    )
      throw Error("완료한 설문 응답을 확인해 주세요.");
    const old = state.profile?.submissions ?? [];
    if (canonical(submissions.slice(0, old.length)) !== canonical(old))
      throw Error("이전 설문 원본이 달라 저장을 멈췄어요.");
  }
  const key = complete ? NATIVE_PREFERENCE_PROFILE : NATIVE_PREFERENCE_DRAFT;
  const next = {
    ...s,
    values: {
      ...s.values,
      [key]: encodeNativeValue({
        ...((complete ? state.profile : state.draft) ?? {}),
        ...value,
      }),
    },
  };
  if (complete) delete next.values[NATIVE_PREFERENCE_DRAFT];
  if (new TextEncoder().encode(JSON.stringify(next)).length > 16 * 1024 * 1024)
    throw Error("계정 백업 용량을 초과했어요. 선택은 유지되어 있어요.");
  return next;
}
