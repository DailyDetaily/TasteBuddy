import { createClient } from "@supabase/supabase-js";
import { getCurrentSupabaseSession } from "../supabase";
import type { ArchiveTransport } from "./nativeRepository";
async function context(owner: string) {
  const session = await getCurrentSupabaseSession();
  if (session?.user.id !== owner && !(owner === "guest" && !session))
    throw new Error(
      "로그인 계정이 바뀌어 백업을 멈췄어요. 작성한 기록은 원래 계정에 보관되어 있어요.",
    );
  if (!session || session.user.is_anonymous) return null;
  const url = import.meta.env.VITE_SUPABASE_URL,
    key =
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("계정 백업 연결을 확인해 주세요.");
  // A request admitted for one owner must never acquire another account's refreshed token.
  return createClient(url, key, {
    accessToken: async () => session.access_token,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
export const nativeTransport: ArchiveTransport = {
  async downloadPhoto(owner, filename) {
    const client = await context(owner);
    if (!client || !/^[A-Za-z0-9_-]{1,251}\.jpg$/.test(filename))
      throw new Error("사진 복원에 필요한 계정과 파일을 확인해 주세요.");
    const { data, error } = await client.storage.from("native-dining-photos")
      .download(`${owner.toLowerCase()}/${filename}`);
    if (error || !data || data.size === 0 || data.size > 6291456 ||
        !["image/jpeg", "application/octet-stream"].includes(data.type))
      throw new Error("계정 사진을 복원하지 못했어요. 기존 기록은 유지했어요. 다시 시도해 주세요.");
    return data.type === "image/jpeg" ? data : new Blob([data], { type: "image/jpeg" });
  },
  async fetch(owner) {
    const client = await context(owner);
    if (!client) return { enabled: false, remote: null };
    const { data, error } = await client
      .from("native_account_data")
      .select("payload,revision")
      .eq("user_id", owner)
      .limit(1)
      .maybeSingle();
    if (error)
      throw new Error(
        "계정 기록을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
      );
    return {
      enabled: true,
      remote: data ? { snapshot: data.payload, revision: data.revision } : null,
    };
  },
  async save(owner, snapshot, revision, photo) {
    const client = await context(owner);
    if (!client)
      throw new Error(
        "이 기록은 기기에 보관되어 있어요. 계정 백업은 로그인 후 사용할 수 있어요.",
      );
    for (const filename of snapshot.photoFilenames) {
      const blob = await photo(filename);
      if (!blob) {
        // A missing local original is safe only when the account already owns its remote copy.
        await nativeTransport.downloadPhoto!(owner, filename);
        continue;
      }
      const lease = await client.rpc("begin_account_media_upload");
      if (lease.error)
        throw new Error(
          "사진 백업을 준비하지 못했어요. 기기 원본은 보관되어 있어요.",
        );
      try {
        const path = `${owner.toLowerCase()}/${filename}`;
        const uploaded = await client.storage
          .from("native-dining-photos")
          .upload(path, blob, {
            contentType: "image/jpeg",
            cacheControl: "0",
            upsert: false,
          });
        if (uploaded.error) {
          const existing = await client.storage
            .from("native-dining-photos")
            .download(path);
          if (existing.error || !existing.data)
            throw new Error(
              "사진을 백업하지 못했어요. 기기 원본은 보관되어 있어요.",
            );
          const hash = async (b: Blob) =>
            Array.from(
              new Uint8Array(
                await crypto.subtle.digest("SHA-256", await b.arrayBuffer()),
              ),
            ).join(",");
          if ((await hash(existing.data)) !== (await hash(blob)))
            throw new Error("같은 이름의 다른 사진이 있어 백업을 멈췄어요.");
        }
      } finally {
        await client.rpc("finish_account_media_upload", {
          upload_id: lease.data,
        });
      }
    }
    const active = await getCurrentSupabaseSession();
    if (active?.user.id !== owner)
      throw new Error("계정이 바뀌어 백업을 멈췄어요.");
    const { data, error } = await client.rpc("save_native_account_data", {
      p_user_id: owner,
      p_payload: snapshot,
      p_expected_revision: revision,
    });
    if (error)
      throw new Error(
        error.code === "40001"
          ? "다른 기기의 기록이 변경되어 백업을 멈췄어요. 웹 기록은 기기에 보관되어 있어요."
          : "백업을 완료하지 못했어요. 기기에 저장한 원본은 유지했어요.",
      );
    return data;
  },
};
