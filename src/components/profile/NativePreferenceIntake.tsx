import { useRef, useState } from "react";
import PreferenceIntakeScreen from "../../pages/PreferenceIntakeScreen";
import { useNativePreferences } from "../../lib/gastronomy/useNativePreferences";
import {
  preferenceSignature,
  updateNativePreferences,
} from "../../lib/gastronomy/nativePreferences";
import type {
  PreferenceIntakeProfile,
  PreferenceIntakeResponses,
} from "../../constants/preferenceIntakeData";
export default function NativePreferenceIntake({
  owner,
  onBack,
  onComplete,
  legacyProfile,
}: {
  owner: string;
  onBack: () => void;
  onComplete: (p: PreferenceIntakeProfile) => void | Promise<void>;
  legacyProfile?: PreferenceIntakeProfile | null;
}) {
  const journal = useNativePreferences(owner);
  if (!journal.ready || !journal.data)
    return (
      <div className="p-5">
        <p role={journal.error ? "alert" : "status"}>
          {journal.error ?? "선호 응답을 불러오고 있어요."}
        </p>
        <button className="min-h-11" onClick={journal.retry}>
          다시 시도
        </button>
        <button className="ml-4 min-h-11" onClick={onBack}>
          닫기
        </button>
      </div>
    );
  return (
    <Editor
      key={owner}
      owner={owner}
      journal={journal}
      onBack={onBack}
      onComplete={onComplete}
      legacyProfile={legacyProfile}
    />
  );
}
function Editor({
  owner,
  journal,
  onBack,
  onComplete,
  legacyProfile,
}: {
  owner: string;
  journal: ReturnType<typeof useNativePreferences>;
  onBack: () => void;
  onComplete: (p: PreferenceIntakeProfile) => void | Promise<void>;
  legacyProfile?: PreferenceIntakeProfile | null;
}) {
  const [initial] = useState(() => journal.data!);
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const expected = useRef(initial.signature),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  const profile = initial.profile ?? (owner === "guest" ? legacyProfile : null);
  async function apply(
    value: PreferenceIntakeProfile | PreferenceIntakeResponses,
    complete = false,
  ) {
    const next = await journal.changeSnapshot((s) => {
      if (ownerRef.current !== owner)
        throw Error("계정이 바뀌어 저장을 멈췄어요.");
      return updateNativePreferences(s, value, expected.current, complete);
    });
    expected.current = preferenceSignature(next.snapshot);
  }
  const draft = (value: PreferenceIntakeResponses) => {
    const pending = queue.current.catch(() => {}).then(() => apply(value));
    queue.current = pending;
    void pending.catch(() => {});
    return pending;
  };
  return (
    <PreferenceIntakeScreen
      userID="local-owner"
      initialProfile={profile}
      initialResponses={initial.draft ?? undefined}
      onDraft={draft}
      onBack={onBack}
      onComplete={async (value) => {
        await queue.current.catch(() => {});
        await apply(value, true);
        await onComplete(value);
      }}
    />
  );
}
