import {
  canonical,
  decodeNativeValue,
  encodeNativeValue,
  type NativeSnapshot,
} from "./nativeRecord";
export const PROFILE_IDENTITY_KEY = "tastebuddy.ios.profile-identity.v1";
export const PROFILE_AVATAR_KEY = "tastebuddy.ios.profile-avatar-image-data.v1";
export interface NativeProfileIdentity {
  displayName: string;
  nickname: string;
  birthDate?: string | null;
  sexContext?: string | null;
  smokingStatus?: string | null;
  dietaryRestrictions: string[];
  [key: string]: unknown;
}
export const profileSignature = (s: NativeSnapshot) =>
  canonical([
    s.values[PROFILE_IDENTITY_KEY] ?? null,
    s.values[PROFILE_AVATAR_KEY] ?? null,
  ]);
const stringOrNil = (v: unknown) => v == null || typeof v === "string";
export function decodeProfileIdentity(value: string): NativeProfileIdentity {
  const r = decodeNativeValue(value) as NativeProfileIdentity | null;
  if (
    !r ||
    typeof r !== "object" ||
    typeof r.displayName !== "string" ||
    typeof r.nickname !== "string" ||
    !Array.isArray(r.dietaryRestrictions) ||
    !r.dietaryRestrictions.every((v) => typeof v === "string") ||
    ![r.birthDate, r.sexContext, r.smokingStatus].every(stringOrNil)
  )
    throw Error("프로필 원본을 읽지 못했어요. 기존 원본은 유지되어 있어요.");
  return r;
}
export function avatarBytes(base64: string) {
  if (
    !base64 ||
    base64.length % 4 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      base64,
    )
  )
    throw Error("프로필 사진 원본을 읽지 못했어요.");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
export function avatarMime(bytes: Uint8Array) {
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71)
    return "image/png";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}
export function readNativeProfileIdentity(s: NativeSnapshot) {
  const raw = s.values[PROFILE_IDENTITY_KEY],
    avatar = s.values[PROFILE_AVATAR_KEY];
  const identity = raw === undefined ? null : decodeProfileIdentity(raw);
  const mime = avatar === undefined ? null : avatarMime(avatarBytes(avatar));
  return {
    identity,
    avatar,
    avatarDataUrl: avatar && mime ? `data:${mime};base64,${avatar}` : null,
    unsupportedAvatar: avatar !== undefined && !mime,
    present: raw !== undefined || avatar !== undefined,
    signature: profileSignature(s),
  };
}
export interface ProfileIdentityEdit {
  displayName: string;
  nickname: string;
  birthDate: string | null;
  sexContext: string | null;
  smokingStatus: string | null;
  dietaryRestrictions: string[];
}
const normalizeNickname = (s: string) => s.trim().replace(/^@+|@+$/g, "");
export function updateNativeProfileIdentity(
  s: NativeSnapshot,
  edit: ProfileIdentityEdit,
  expected: string,
  avatar?: string | null,
): NativeSnapshot {
  if (profileSignature(s) !== expected)
    throw Error(
      "다른 곳에서 프로필이 바뀌었어요. 작성한 내용을 보관한 뒤 다시 열어 확인해 주세요.",
    );
  const current = readNativeProfileIdentity(s),
    before = current.identity;
  if (!edit.displayName.trim() || !normalizeNickname(edit.nickname))
    throw Error("이름과 버디네임을 입력해 주세요.");
  if (!edit.dietaryRestrictions.every((v) => typeof v === "string"))
    throw Error("식이제한 응답을 확인해 주세요.");
  if (edit.birthDate) {
    const date = new Date(edit.birthDate + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(edit.birthDate) ||
      !Number.isFinite(+date) ||
      date.toISOString().slice(0, 10) !== edit.birthDate
    )
      throw Error("생년월일을 확인해 주세요.");
  }
  const preserveUnsupported = (
    field: "sexContext" | "smokingStatus",
    known: string[],
  ) =>
    edit[field] === null && before?.[field] && !known.includes(before[field]!)
      ? before[field]
      : edit[field];
  const identity: NativeProfileIdentity = {
    ...before,
    ...edit,
    displayName: edit.displayName.trim(),
    nickname: normalizeNickname(edit.nickname),
    sexContext: preserveUnsupported("sexContext", [
      "male",
      "female",
      "other",
      "prefer_not_to_say",
    ]),
    smokingStatus: preserveUnsupported("smokingStatus", [
      "current",
      "former",
      "never",
      "prefer_not_to_say",
    ]),
    dietaryRestrictions: edit.dietaryRestrictions.filter(
      (v) => v !== "dietary-restrictions-none",
    ),
  };
  const values: Record<string, string> = {
    ...s.values,
    [PROFILE_IDENTITY_KEY]: encodeNativeValue(identity),
  };
  if (avatar === null) delete values[PROFILE_AVATAR_KEY];
  else if (avatar !== undefined) {
    const bytes = avatarBytes(avatar);
    if (
      bytes.length > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png"].includes(avatarMime(bytes) ?? "")
    )
      throw Error("프로필 사진 형식이나 크기를 확인해 주세요.");
    values[PROFILE_AVATAR_KEY] = avatar;
  }
  const next = { ...s, values };
  if (new TextEncoder().encode(JSON.stringify(next)).length > 16 * 1024 * 1024)
    throw Error(
      "계정 백업 용량을 초과했어요. 더 작은 프로필 사진을 선택해 주세요.",
    );
  return canonical(next) === canonical(s) ? s : next;
}
/** Export cropped pixels as JPEG, readable by UIImage and independent of public media storage. */
export async function prepareNativeProfileAvatar(blob: Blob): Promise<string> {
  if (blob.size > 5 * 1024 * 1024)
    throw Error("프로필 사진은 5MB 이하로 선택해 주세요.");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!avatarMime(bytes)) throw Error("지원하지 않는 사진 형식이에요.");
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(
      1,
      512 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("사진을 처리하지 못했어요.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.88).split(",")[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}
