import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Img, staticFile } from "remotion";
import { NativeText } from "../HomePeriodInsightMotion/native";
import type { FeedbackProps } from "./settings";
import { ResultChip } from "./ResultChip";
import { MetaballChipRow } from "./MetaballChipRow";

const Sparkles = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinejoin="round"
    strokeLinecap="round"
  >
    <path d="M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9Z" />
  </svg>
);

// Mirrors TBOverflowTagRow: a single row, reserving room for +N.
const DetailTags: React.FC<{ tags: string[]; entranceElapsed?: number }> = ({
  tags,
  entranceElapsed,
}) => {
  const measure = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(tags.length);
  useLayoutEffect(() => {
    const root = measure.current;
    if (!root) return;
    const nodes = Array.from(root.children) as HTMLElement[];
    const widths = nodes.slice(0, tags.length).map((node) => node.offsetWidth);
    const total = (n: number) =>
      widths.slice(0, n).reduce((sum, value) => sum + value, 0) +
      Math.max(0, n - 1) * 6;
    let count = tags.length;
    while (
      count > 0 &&
      total(count) +
        (count < tags.length
          ? 6 + nodes[tags.length + tags.length - count - 1].offsetWidth
          : 0) >
        root.clientWidth
    )
      count--;
    setVisible(count);
  }, [tags]);
  if (!tags.length) return null;
  const visibleLabels = tags.slice(0, visible);
  if (visible < tags.length) visibleLabels.push(`+${tags.length - visible}`);
  return (
    <div style={{ position: "relative" }}>
      <div
        ref={measure}
        aria-hidden
        style={{
          display: "flex",
          gap: 6,
          position: "absolute",
          width: "100%",
          visibility: "hidden",
        }}
      >
        {tags.map((tag, i) => (
          <ResultChip key={i} label={tag} />
        ))}
        {tags.map((_, i) => (
          <ResultChip key={`overflow-${i}`} label={`+${i + 1}`} />
        ))}
      </div>
      <div
        data-feedback-tags
        style={{
          display: "flex",
          gap: 6,
          overflow: entranceElapsed === undefined ? "hidden" : "visible",
        }}
      >
        {entranceElapsed !== undefined ? (
          <MetaballChipRow
            items={visibleLabels.map((label) => ({ label }))}
            elapsed={entranceElapsed}
          />
        ) : (
          visibleLabels.map((tag, i) => <ResultChip key={i} label={tag} />)
        )}
      </div>
    </div>
  );
};

export type FeedbackCardReveal = {
  surface: number;
  photoVisible: boolean;
  // Focus progress: 0 = blurred, 1 = sharp.
  photo: number;
  title: number;
  reactions: number;
  details: number;
  note: number;
};

const fillMask = (progress?: number): CSSProperties =>
  progress === undefined || progress >= 1
    ? {}
    : { clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` };

export const FeedbackCard: React.FC<
  FeedbackProps & {
    squarePhoto?: boolean;
    uniformHeight?: number;
    cardWidth?: number;
    reveal?: FeedbackCardReveal;
    chipEntrance?: { reactions: number; details: number };
  }
> = (props) => {
  const photo = props["사진 경로"].trim();
  const reveal = props.reveal;
  const photoAppearance: CSSProperties = reveal
    ? {
        opacity: reveal.photoVisible ? 1 : 0,
        filter:
          reveal.photo < 1 ? `blur(${14 * (1 - reveal.photo)}px)` : undefined,
      }
    : {};
  return (
    <div
      data-feedback-card
      data-card-surface-fill={reveal?.surface}
      aria-label="식후 피드백 결과 카드 · 예시 데이터"
      style={{
        width: props.cardWidth ?? 290,
        height: props.uniformHeight,
        padding: 12,
        background: reveal ? `rgba(255,255,255,${reveal.surface})` : "#FFFFFF",
        color: "#0F0F0F",
        borderRadius: 20,
        boxShadow: `0 24px 35px rgba(0,0,0,${0.16 * (reveal?.surface ?? 1)})`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: "Pretendard, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        data-feedback-photo
        style={{
          aspectRatio: props.squarePhoto ? "1" : "4 / 5",
          flexShrink: 0,
          borderRadius: 12,
          overflow: "hidden",
          background:
            reveal && !reveal.photoVisible ? "transparent" : "#EFEFEF",
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        {photo ? (
          <Img
            src={
              /^(https?:|data:|blob:)/.test(photo) ? photo : staticFile(photo)
            }
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              ...photoAppearance,
            }}
          />
        ) : (
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888888"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={photoAppearance}
          >
            <path d="M14.5 4h-5L7 7H4Q2 7 2 9v9q0 2 2 2h16q2 0 2-2V9q0-2-2-2h-3Z" />
            <circle cx={12} cy={13} r={3} />
          </svg>
        )}
      </div>
      <div
        data-feedback-title
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          ...fillMask(reveal?.title),
        }}
      >
        <NativeText size={14} weight={700} lineLimit={2}>
          {props.메뉴명.trim()}
        </NativeText>
        <NativeText size={12} weight={400} color="rgba(15,15,15,0.5)">
          {props.식당명}
        </NativeText>
      </div>
      {(props["맛 반응"].length > 0 || props["상세 태그"].length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {props["맛 반응"].length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                overflow: props.chipEntrance ? "visible" : "hidden",
                ...fillMask(reveal?.reactions),
              }}
            >
              {props.chipEntrance ? (
                <MetaballChipRow
                  items={props["맛 반응"].slice(0, 3).map((reaction) => ({
                    label: reaction.문구,
                    axis: reaction.미각,
                  }))}
                  elapsed={props.chipEntrance.reactions}
                />
              ) : (
                props["맛 반응"]
                  .slice(0, 3)
                  .map((reaction, i) => (
                    <ResultChip
                      key={i}
                      label={reaction.문구}
                      axis={reaction.미각}
                    />
                  ))
              )}
            </div>
          )}
          {props["상세 태그"].length > 0 && (
            <div style={fillMask(reveal?.details)}>
              <DetailTags
                tags={props["상세 태그"]}
                entranceElapsed={props.chipEntrance?.details}
              />
            </div>
          )}
        </div>
      )}
      {props["미식 노트"] !== "" && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#F7F7F7",
            flex: props.uniformHeight ? 1 : undefined,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            ...fillMask(reveal?.note),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles />
            <NativeText size={13} weight={600}>
              미식 노트
            </NativeText>
          </div>
          <NativeText
            size={12}
            weight={400}
            color="rgba(15,15,15,0.6)"
            lineSpacing={3}
            lineLimit={4}
          >
            {props["미식 노트"]}
          </NativeText>
        </div>
      )}
    </div>
  );
};
