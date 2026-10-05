import { useState } from "react";
import IconActionButton, { type IconActionKind } from "../components/system/plating/IconActionButton";
import RecordActions from "../components/system/plating/RecordActions";
import SocialActions from "../components/system/plating/SocialActions";

export default function IconActionExamples({ id, state, thumbnail }: { id: string; state: string; thumbnail?: boolean }) {
  const [liked, setLiked] = useState(state === "활성" || state === "선택");
  const [bookmarked, setBookmarked] = useState(state === "활성" || state === "저장됨");
  const [recorded, setRecorded] = useState(state === "활성" || state === "저장됨");
  const [opened, setOpened] = useState<"record" | "bookmark" | "comment" | "share" | null>(null);
  const disabled = state === "비활성";
  const noCounts = state === "숫자 없음";
  const activate = (kind: IconActionKind) => kind === "like" ? setLiked(!liked) : setOpened(kind === "save" ? "record" : kind);
  const controls = id === "record-actions"
    ? <RecordActions isRecorded={recorded} isBookmarked={bookmarked} disabled={disabled} onRecord={() => setOpened("record")} onBookmark={() => setOpened("bookmark")} />
    : id === "social-actions"
      ? <SocialActions isLiked={liked} likeCount={noCounts ? undefined : liked ? 1 : 0} commentCount={noCounts ? undefined : 2} shareCount={noCounts ? undefined : 0} disabled={disabled} accentColor="var(--tb-taste-salty-main)" onLike={() => setLiked(!liked)} onComment={() => setOpened("comment")} onShare={() => setOpened("share")} />
      : <div className="pl-add-actions">{(["save", "bookmark", "like", "comment", "share"] as const).map(kind => <IconActionButton key={kind} kind={kind} active={kind === "save" ? recorded : kind === "bookmark" ? bookmarked : kind === "like" && liked} count={!noCounts && ["like", "comment", "share"].includes(kind) ? (kind === "like" ? Number(liked) : kind === "comment" ? 2 : 0) : undefined} disabled={disabled} activeColor={kind === "like" ? "var(--tb-taste-salty-main)" : undefined} onClick={() => activate(kind)} />)}</div>;
  return <div className="pl-add-stack">
    {controls}
    {!thumbnail && <p className="tb-pl-hint">제품과 같은 버튼 구성 · 숫자와 저장 상태는 이 예제 안에서만 바뀌어요.</p>}
    {!thumbnail && opened && <div className="pl-add-stack" role="region" aria-label="액션 예제">
      <p role="status">{opened === "record" ? "기록 작성 예제" : opened === "bookmark" ? "북마크 편집 예제" : opened === "comment" ? "댓글 보기 예제" : "공유 예제"}</p>
      {opened === "record" && <button type="button" className="tb-pl-text-action" onClick={() => { setRecorded(true); setOpened(null); }}>기록 완료 상태로 보기</button>}
      {opened === "bookmark" && <button type="button" className="tb-pl-text-action" onClick={() => { setBookmarked(!bookmarked); setOpened(null); }}>{bookmarked ? "북마크 해제" : "북마크 저장"}</button>}
      <button type="button" className="tb-pl-text-action" onClick={() => setOpened(null)}>닫기</button>
    </div>}
  </div>;
}
