import { PreviewSurface } from "./PreviewSurface";
import { useState } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  getRemotionEnvironment,
} from "remotion";
import { InsightMotion } from "../TasteMotion";
import { insightIntroDuration, duration } from "../taste-motion";
import { CategoryPreview, CategoryPlaybackControls } from "./Preview";
import {
  categories,
  type Category,
  type Playback,
  type Scenario,
} from "./types";
const names: Record<Category | "insightRing", string> = {
  insightRing: "기본 점 링",
  experienceCluster: "경험",
  sensoryRays: "감각",
  preferenceFocus: "취향",
  contextLayers: "맥락",
  changeRipples: "변화",
};
export const CategoryGallery = () => {
  const [category, setCategory] = useState<Category | "insightRing">(
    "experienceCluster",
  );
  const [playback, setPlayback] = useState<Playback>("intro");
  const [scenario, setScenario] = useState<Scenario>("standard");
  return (
    <PreviewSurface
      style={{
        background: "white",
        fontFamily: "Pretendard",
        color: "#302e2b",
      }}
    >
      <nav
        aria-label="애니메이션 선택"
        style={{
          height: 104,
          padding: "16px 24px",
          boxSizing: "border-box",
          borderBottom: "1px solid #eeeae6",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong style={{ fontSize: 15, marginRight: 12 }}>
            Taste Buddy 모션
          </strong>
          {(["insightRing", ...categories] as const).map((id) => (
            <button
              key={id}
              aria-pressed={id === category}
              onClick={() => {
                setCategory(id);
                if (id !== "changeRipples")
                  setScenario((s) =>
                    ["decrease", "equal", "unlinked"].includes(s)
                      ? "standard"
                      : s,
                  );

              }}
              style={{
                padding: "8px 19px",
                border: "1px solid #e6e4e1",
                borderRadius: 20,
                background: id === category ? "#302e2b" : "white",
                color: id === category ? "white" : "#514b45",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {names[id]}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
          }}
        >
          <label>
            재생 방식{" "}
            <select
              aria-label="재생 방식"
              value={playback}
              onChange={(e) => setPlayback(e.target.value as Playback)}
            >
              <option value="intro">진입 + 대기</option>
              <option value="idle">대기 반복</option>
              <option value="reduced">모션 줄이기</option>
            </select>
          </label>
          <label>
            예시 데이터{" "}
            <select
              disabled={category === "insightRing"}
              aria-label="예시 데이터"
              value={scenario}
              onChange={(e) => setScenario(e.target.value as Scenario)}
            >
              <option value="standard">기본</option>
              <option value="empty">자료 없음</option>
              <option value="dense">조밀한 데이터</option>
              <option value="zero">유효 0</option>
              <option value="unanswered">미응답</option>
              <option value="held">해석 보류</option>
              {category === "changeRipples" && (
                <>
                  <option value="decrease">감소 18 → 12</option>
                  <option value="equal">동일 12 → 12</option>
                  <option value="unlinked">이전 미확인</option>
                </>
              )}
            </select>
          </label>
          <span style={{ color: "#95867A" }}>
            선택하면 처음부터 재생 · 아래 타임라인에서 프레임 탐색
          </span>
        </div>
      </nav>
      <div
        style={{
          position: "absolute",
          top: 104,
          left: 0,
          width: 1000,
          height: 720,
        }}
      >
        {category === "insightRing" ? (
          <BaseRingPreview key={playback} playback={playback} />
        ) : (
          <CategoryPreview
            key={`${category}:${playback}:${scenario}`}
            category={category}
            playback={playback}
            scenario={scenario}
          />
        )}
      </div>
    </PreviewSurface>
  );
};

const BaseRingPreview = ({ playback }: { playback: Playback }) => {
  const frame = useCurrentFrame(),
    { fps } = useVideoConfig();
  const [scrub, setScrub] = useState(false);
  const effective = scrub ? "intro" : playback;
  const time =
    effective === "reduced"
      ? insightIntroDuration
      : frame / fps + (effective === "idle" ? insightIntroDuration : 0);
  return (
    <PreviewSurface style={{ padding: 24, background: "white" }}>
      <div
        style={{ height: 32, display: "flex", alignItems: "baseline", gap: 14 }}
      >
        <b style={{ fontSize: 20 }}>기본 점 링</b>
        <span style={{ fontSize: 12, color: "#95867A" }}>원본 모션</span>
        {getRemotionEnvironment().isStudio && effective !== "reduced" && (
          <CategoryPlaybackControls
            category="sensoryRays"
            playback={effective}
            introSeconds={insightIntroDuration}
            loopSeconds={duration("insightRing")}
            onScrub={() => setScrub(true)}
          />
        )}
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <svg
          width={640}
          height={640}
          viewBox="0 0 640 640"
          aria-label="기본 점 링"
        >
          <InsightMotion time={time} />
        </svg>
        <aside
          style={{
            width: 260,
            paddingTop: 32,
            fontSize: 13,
            lineHeight: 1.8,
            color: "#726d68",
          }}
        >
          기존 점 링을 그대로 표시합니다.
          <br />
          누르는 동안 미각별 정렬
          <br />
          드래그 회전 · 놓으면 관성
          <br />
          좌우 방향키로 회전
          <br />
          그림 위 스크롤로 되감기
        </aside>
      </div>
    </PreviewSurface>
  );
};
