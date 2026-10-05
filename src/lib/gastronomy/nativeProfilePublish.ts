import { createClient } from "@supabase/supabase-js";
import { getCurrentSupabaseSession } from "../supabase";
/** Public name/handle are a separate delivery step; the private snapshot remains durable on failure. */
export async function publishNativeProfileIdentity(
  owner: string,
  displayName: string,
  nickname: string,
) {
  const session = await getCurrentSupabaseSession();
  if (session?.user.id !== owner && !(owner === "guest" && !session))
    throw Error("계정이 바뀌어 공개 프로필 반영을 멈췄어요.");
  if (!session || session.user.is_anonymous) return;
  const url = import.meta.env.VITE_SUPABASE_URL,
    key =
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw Error("공개 프로필 연결을 확인해 주세요.");
  const client = createClient(url, key, {
    accessToken: async () => session.access_token,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const values = { display_name: displayName, nickname };
  const { error } = await client
    .from("profiles")
    .upsert({ id: owner, ...values }, { onConflict: "id" });
  if (error)
    throw Error(
      "기기에는 저장했지만 공개 프로필에 반영하지 못했어요. 버디네임과 연결 상태를 확인해 주세요.",
    );
  // Pin the admitted token for this request too; a later login cannot receive the former user's metadata.
  if ((await getCurrentSupabaseSession())?.user.id !== owner)
    throw Error("계정이 바뀌어 공개 프로필 반영을 멈췄어요.");
  const response = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: values }),
  });
  if (!response.ok)
    throw Error(
      "기기에는 저장했지만 계정 표시 정보 반영은 아직 완료되지 않았어요. 다시 저장해 주세요.",
    );
}
