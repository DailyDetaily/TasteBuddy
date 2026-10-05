import { PreviewSurface } from "./PreviewSurface";
import { PlayerInternals } from "@remotion/player";
import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useMemo,
  type CSSProperties,
} from "react";
import {
  Internals,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
  getRemotionEnvironment,
} from "remotion";
import { fontReady } from "../fonts";
import {
  categoryFrame,
  categoryIntroDuration,
  categoryLoopDuration,
} from "./geometry";
import {
  insightDragDelta,
  insightAlignment,
  insightInertia,
} from "../taste-motion";
import { fixture } from "./fixtures";
import type { Category, Frame, Mode, Playback, Scenario } from "./types";
const path = (points: { x: number; y: number }[]) =>
  points
    .map((p, i) => (i ? "L" : "M") + p.x.toFixed(3) + " " + p.y.toFixed(3))
    .join(" ");
const tintFill = (base: string, tint?: string, amount = 0) => {
  if (!tint || amount === 0) return base;
  if (amount === 1) return tint;
  const a = parseInt(base.slice(1), 16),
    b = parseInt(tint.slice(1), 16);
  const channels = [16, 8, 0].map(
    (shift) =>
      ((a >> shift) & 255) +
      (((b >> shift) & 255) - ((a >> shift) & 255)) * amount,
  );
  return `rgb(${channels.join(",")})`;
};
const control: CSSProperties = {
  font: "inherit",
  fontSize: 13,
  border: "1px solid #e6e4e1",
  background: "white",
  borderRadius: 8,
  padding: "7px 10px",
  color: "#38332f",
  cursor: "pointer",
};
export function CategorySVG({
  frame,
  time,
  onSelect,
}: {
  frame: Frame;
  time: number;
  onSelect?: (id: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 640 640"
      width={640}
      height={640}
      style={{ display: "block", fontFamily: "Pretendard" }}
      aria-label={frame.title + " 데이터 모션"}
      data-motion-phase={frame.motionPhase}
    >
      {frame.bridges?.map(({ id, points: p, color, opacity }) => (
        <path
          key={id}
          fill={color}
          opacity={opacity}
          d={`M${p[0].x} ${p[0].y} C${p[1].x} ${p[1].y} ${p[2].x} ${p[2].y} ${p[3].x} ${p[3].y} L${p[4].x} ${p[4].y} C${p[5].x} ${p[5].y} ${p[6].x} ${p[6].y} ${p[7].x} ${p[7].y} Z`}
        />
      ))}
      {frame.lines.map((line) => (
        <g
          key={line.id}
          data-line-id={line.id}
          data-data-line={line.data}
          onClick={() => line.group && onSelect?.(line.group)}
        >
          <path
            d={path(line.points)}
            fill="none"
            stroke={line.color}
            strokeWidth={line.width}
            strokeLinecap="round"
            opacity={line.opacity}
          />
          {!!line.highlight && (
            <path
              d={path(line.points)}
              fill="none"
              stroke={line.color}
              strokeWidth={line.width + 1}
              strokeLinecap="butt"
              opacity={line.highlight}
              pathLength={100}
              strokeDasharray="12 88"
              strokeDashoffset={(-(time % 12) / 12) * 100}
            />
          )}
        </g>
      ))}
      {frame.dots.map((dot) => (
        <g
          key={dot.id}
          aria-hidden="true"
          onClick={() => dot.group && onSelect?.(dot.group)}
        >
          <circle
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={tintFill(dot.color, dot.tintColor, dot.tint)}
            opacity={dot.opacity}
          />
          {onSelect && (
            <circle cx={dot.x} cy={dot.y} r={10} fill="transparent" />
          )}
        </g>
      ))}
      <g
        opacity={frame.summaryOpacity}
        textAnchor="middle"
        fill="#302e2b"
        transform={frame.layout === "bars" ? "translate(0,-224)" : undefined}
      >
        <text x={320} y={285} fontSize={16} fontWeight={500}>
          {frame.title}
        </text>
        <text
          x={320}
          y={340}
          fontSize={frame.value.length > 6 ? 38 : 52}
          fontWeight={700}
        >
          {frame.value}
        </text>
        <text x={320} y={372} fontSize={14} fill="#726d68">
          {frame.unit}
        </text>
        {frame.state !== "valid" && (
          <text x={320} y={397} fontSize={12} fill="#95867A">
            {frame.notes[0]}
          </text>
        )}
      </g>
      <g opacity={frame.summaryOpacity}>
        {frame.labels.map((label) => (
          <g
            key={label.id}
            onClick={() => label.group && onSelect?.(label.group)}
            style={{ cursor: label.group ? "pointer" : undefined }}
          >
            <text
              x={label.x}
              y={label.y}
              fontSize={12}
              fontWeight={500}
              textAnchor={label.anchor || "middle"}
              fill={label.color || "#514b45"}
            >
              {label.text}
            </text>
            {label.sub && (
              <text
                x={label.x}
                y={label.y + 17}
                fontSize={11}
                textAnchor={label.anchor || "middle"}
                fill="#817970"
              >
                {label.sub}
              </text>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
// This controller is mounted only in Studio; exports keep their deterministic frame clock.
export function CategoryPlaybackControls({
  playback,
  category,
  onScrub,
  introSeconds = categoryIntroDuration(category),
  loopSeconds = categoryLoopDuration(category),
}: {
  playback: Playback;
  category: Category;
  onScrub: () => void;
  introSeconds?: number;
  loopSeconds?: number;
}) {
  const { id, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame(),
    playing = Internals.usePlaying();
  const { seek, play, pause, playAsAutoPlay, emitter } =
    PlayerInternals.usePlayerMethods();
  const autoStarted = useRef(false);
  const autoPending = useRef(false);
  const [muted, setMuted] = Internals.usePlayerMutedState();
  const originalMuted = useRef(muted);
  const automatic = true;
  const controlRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const loopStart =
    playback === "idle"
      ? 0
      : Math.round(introSeconds * fps);
  useEffect(() => {
    if (!automatic) return;
    // This silent preview must not wait on the browser's blocked audio autoplay clock.
    const previous = originalMuted.current;
    setMuted(true);
    return () => setMuted(previous);
  }, [automatic, setMuted]);
  useEffect(() => {
    if (!automatic || autoStarted.current || autoPending.current) return;
    autoPending.current = true;
    pause();
    seek(0);
  }, [automatic, seek, pause]);
  useEffect(() => {
    if (!autoPending.current || playing || (automatic && !muted)) return;
    autoPending.current = false;
    autoStarted.current = true;
    playAsAutoPlay();
  }, [playing, playAsAutoPlay, automatic, muted]);
  const loopEnd = Math.min(
    durationInFrames,
    loopStart + Math.round(loopSeconds * fps),
  );
  useLayoutEffect(() => {
    if (playing && frame >= loopEnd - 1) seek(loopStart);
  }, [playing, frame, loopEnd, seek, loopStart]);
  useEffect(() => {
    const ended = () => {
      // The normal loop runs before the last frame. Also recover an end caused by a dropped frame.
      autoPending.current = true;
      seek(loopStart);
    };
    emitter.addEventListener("ended", ended);
    return () => emitter.removeEventListener("ended", ended);
  }, [emitter, loopStart, seek]);
  useEffect(() => {
    const surface =
      controlRef.current?.parentElement?.parentElement?.querySelector(
        "svg[aria-label]",
      );
    if (!surface) return;
    const wheel = (event: Event) => {
      const e = event as WheelEvent;
      if (e.ctrlKey || e.deltaY === 0) return;
      e.preventDefault();
      e.stopPropagation();
      pause();
      const end = Math.round(introSeconds * fps);
      const current =
        playback === "idle" ? end : Math.min(end, frameRef.current);
      const delta =
        e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 640 : 1);
      const next = Math.max(0, Math.min(end, current - delta * 0.15));
      onScrub();
      frameRef.current = Math.round(next);
      seek(frameRef.current);
    };
    surface.addEventListener("wheel", wheel, { passive: false });
    return () => surface.removeEventListener("wheel", wheel);
  }, [introSeconds, fps, playback, pause, seek, onScrub]);
  return (
    <div
      ref={controlRef}
      style={{
        order: 1,
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 12,
      }}
      data-testid={
        category === "experienceCluster"
          ? "experience-playback"
          : "sensory-playback"
      }
      data-frame={frame}
      data-composition={id}
    >
      <span>{playing ? "재생 중 · 계속 반복" : "일시정지"}</span>
      <button style={control} onClick={playing ? pause : play}>
        {playing ? "정지" : "재생"}
      </button>
    </div>
  );
}

export type PreviewProps = {
  category: Category;
  playback: Playback;
  scenario: Scenario;
  initialMode?: Mode;
  initialDomain?: "taste" | "aroma" | "texture";
};
export const CategoryPreview = ({
  category,
  playback,
  scenario,
  initialMode = "liking",
  initialDomain = "taste",
}: PreviewProps) => {
  const frameNumber = useCurrentFrame(),
    { fps, id: compositionId } = useVideoConfig(),
    time = frameNumber / fps;
  const [fontHandle] = useState(() => delayRender("Pretendard"));
  useEffect(() => {
    fontReady
      .then(() => continueRender(fontHandle))
      .catch(() => continueRender(fontHandle));
  }, [fontHandle]);
  const [scrubIntro, setScrubIntro] = useState(false);
  const effectivePlayback = scrubIntro ? "intro" : playback;
  const [selected, setSelected] = useState(""),
    [mode, setMode] = useState<Mode>(initialMode),
    [domain, setDomain] = useState(initialDomain),
    [page, setPage] = useState(0);
  const playing = Internals.usePlaying();
  const studioMotion =
    getRemotionEnvironment().isStudio && playback !== "reduced";
  const sensoryDrag = useRef<{
    x: number;
    y: number;
    at: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  const suppressSelection = useRef(false);
  const spinClock = useRef({ time, elapsed: 0 });
  if (time !== spinClock.current.time) {
    const delta = time - spinClock.current.time;
    spinClock.current = {
      time,
      elapsed:
        spinClock.current.elapsed +
        Math.max(0, delta < 0 ? delta + categoryLoopDuration(category) : delta),
    };
  }
  const [spin, setSpin] = useState({ angle: 0, velocity: 0, at: 0 });
  const inertialRing = category === "sensoryRays" || category === "experienceCluster";
  const experienceReady = category !== "experienceCluster" || effectivePlayback === "reduced" || effectivePlayback === "idle" || time >= categoryIntroDuration(category);
  const sensoryAngle =
    spin.angle +
    insightInertia(spin.velocity, spinClock.current.elapsed - spin.at);
  const finishSensoryDrag = (stamp: number, inertial: boolean) => {
    const d = sensoryDrag.current;
    if (!d) return;
    suppressSelection.current = d.moved;
    setSpin((v) => ({
      ...v,
      velocity: inertial && stamp - d.at <= 120 ? d.velocity : 0,
      at: spinClock.current.elapsed,
    }));
    sensoryDrag.current = null;
  };
  const preferenceGesture = useRef<{
    wasAligned: boolean;
    moved: boolean;
  } | null>(null);
  const [interaction, setInteraction] = useState({ at: 0, from: 0, to: 0 }),
    [rotation, setRotation] = useState(0);
  const alignment =
    playing && spinClock.current.elapsed >= interaction.at
      ? insightAlignment(
          spinClock.current.elapsed - interaction.at,
          interaction.from,
          interaction.to,
        )
      : interaction.to;
  const setPressed = (value: boolean) =>
    setInteraction({
      at: spinClock.current.elapsed,
      from: alignment,
      to: value ? 1 : 0,
    });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [added, setAdded] = useState(false);
  const data = useMemo(
      () =>
        fixture(
          category,
          category === "experienceCluster" && added ? "added" : scenario,
          mode,
          domain,
        ),
      [category, scenario, mode, domain, added],
    ),
    frame = categoryFrame(data, time, {
      playback: effectivePlayback,
      selected,
      page,
      alignment,
      rotation: inertialRing ? sensoryAngle : rotation,
    });
  return (
    <PreviewSurface
      style={{
        background: "white",
        fontFamily: "Pretendard",
        color: "#302e2b",
        padding: 24,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "baseline", gap: 14, height: 32 }}
      >
        {studioMotion && (
          <CategoryPlaybackControls
            key={compositionId}
            playback={effectivePlayback}
            category={category}
            onScrub={() => {
              setScrubIntro(true);
              setSpin({
                angle: sensoryAngle + (category === "experienceCluster"
                  ? Math.max(0, effectivePlayback === "idle" ? time : time - categoryIntroDuration(category)) / 60 * Math.PI * 2 : 0),
                velocity: 0,
                at: spinClock.current.elapsed,
              });
            }}
          />
        )}
        <b style={{ fontSize: 20 }}>
          {
            {
              experienceCluster: "경험",
              sensoryRays: "감각",
              preferenceFocus: "취향",
              contextLayers: "맥락",
              changeRipples: "변화",
            }[category]
          }
        </b>
        <span style={{ fontSize: 12, color: "#95867A" }}>
          예시 데이터 ·{" "}
          {playback === "intro"
            ? "진입 + 대기"
            : playback === "idle"
              ? `대기 ${categoryLoopDuration(category)}초 반복`
              : "모션 줄이기"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <div
          role={
            category === "preferenceFocus" || inertialRing
              ? "button"
              : undefined
          }
          tabIndex={
            category === "preferenceFocus" || inertialRing
              ? 0
              : undefined
          }
          aria-label={
            category === "preferenceFocus"
              ? "취향 링 클릭으로 색별 정렬, 다시 클릭으로 펼치기, 드래그 회전"
              : inertialRing
                ? (category === "experienceCluster" ? "경험 링 드래그 회전" : "감각 링 드래그 회전")
                : undefined
          }
          data-ring-alignment={
            category === "preferenceFocus" ? alignment : undefined
          }
          data-ring-rotation={
            inertialRing ? sensoryAngle : undefined
          }
          onPointerDown={(e) => {
            if (inertialRing) {
              if (!experienceReady) return;
              suppressSelection.current = false;
              const b = e.currentTarget.getBoundingClientRect();
              sensoryDrag.current = {
                x: ((e.clientX - b.left) / b.width) * 640 - 320,
                y: ((e.clientY - b.top) / b.height) * 640 - 320,
                at: e.timeStamp,
                velocity: 0,
                moved: false,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
              setSpin({
                angle: sensoryAngle,
                velocity: 0,
                at: spinClock.current.elapsed,
              });
              return;
            }
            if (category !== "preferenceFocus") return;
            preferenceGesture.current = {
              wasAligned: interaction.to === 1,
              moved: false,
            };
            suppressSelection.current = false;
            e.currentTarget.setPointerCapture(e.pointerId);
            const b = e.currentTarget.getBoundingClientRect();
            drag.current = {
              x: ((e.clientX - b.left) / b.width) * 640 - 320,
              y: ((e.clientY - b.top) / b.height) * 640 - 320,
            };
            setPressed(true);
          }}
          onPointerMove={(e) => {
            const d = sensoryDrag.current;
            if (inertialRing && d) {
              const b = e.currentTarget.getBoundingClientRect();
              const p = {
                x: ((e.clientX - b.left) / b.width) * 640 - 320,
                y: ((e.clientY - b.top) / b.height) * 640 - 320,
              };
              const delta = insightDragDelta(d, p);
              const elapsed = Math.max(0.008, (e.timeStamp - d.at) / 1000);
              const velocity = Math.max(
                -8,
                Math.min(8, d.velocity * 0.4 + (delta / elapsed) * 0.6),
              );
              setSpin((v) => ({ ...v, angle: v.angle + delta }));
              sensoryDrag.current = {
                ...p,
                at: e.timeStamp,
                velocity,
                moved: d.moved || Math.abs(delta) > 0.005,
              };
              return;
            }
            if (!drag.current) return;
            const b = e.currentTarget.getBoundingClientRect(),
              p = {
                x: ((e.clientX - b.left) / b.width) * 640 - 320,
                y: ((e.clientY - b.top) / b.height) * 640 - 320,
              };
            const delta = insightDragDelta(drag.current, p);
            if (preferenceGesture.current && Math.abs(delta) > 0.005)
              preferenceGesture.current.moved = true;
            setRotation((r) => r + delta);
            drag.current = p;
          }}
          onPointerUp={(e) => {
            finishSensoryDrag(e.timeStamp, playback !== "reduced");
            drag.current = null;
            const gesture = preferenceGesture.current;
            if (gesture) {
              setPressed(
                gesture.moved ? gesture.wasAligned : !gesture.wasAligned,
              );
              suppressSelection.current = true;
              preferenceGesture.current = null;
            }
          }}
          onPointerCancel={(e) => {
            finishSensoryDrag(e.timeStamp, false);
            drag.current = null;
            if (preferenceGesture.current) {
              setPressed(preferenceGesture.current.wasAligned);
              preferenceGesture.current = null;
            }
          }}
          onLostPointerCapture={(e) => {
            finishSensoryDrag(e.timeStamp, false);
            drag.current = null;
            if (preferenceGesture.current) {
              setPressed(preferenceGesture.current.wasAligned);
              preferenceGesture.current = null;
            }
          }}
          onBlur={() => {
            finishSensoryDrag(0, false);
            drag.current = null;
            if (preferenceGesture.current) {
              setPressed(preferenceGesture.current.wasAligned);
              preferenceGesture.current = null;
            }
          }}
          onKeyDown={(e) => {
            if (
              inertialRing && experienceReady &&
              (e.key === "ArrowLeft" || e.key === "ArrowRight")
            ) {
              e.preventDefault();
              e.stopPropagation();
              setSpin({
                angle:
                  sensoryAngle +
                  ((e.key === "ArrowRight" ? 1 : -1) * Math.PI) / 12,
                velocity: 0,
                at: spinClock.current.elapsed,
              });
              return;
            }
            if (category !== "preferenceFocus") return;
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              if (!e.repeat) setPressed(interaction.to === 0);
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              e.stopPropagation();
              setRotation(
                (r) => r + ((e.key === "ArrowRight" ? 1 : -1) * Math.PI) / 12,
              );
            }
          }}
          style={{
            touchAction:
              category === "preferenceFocus" || inertialRing
                ? "none"
                : undefined,
            userSelect:
              category === "preferenceFocus" || inertialRing
                ? "none"
                : undefined,
            cursor:
              category === "preferenceFocus"
                ? interaction.to
                  ? "grabbing"
                  : "grab"
                : inertialRing && experienceReady
                  ? "grab"
                  : undefined,
          }}
        >
          <CategorySVG
            frame={frame}
            time={playback === "reduced" ? 0 : time}
            onSelect={(id) => {
              if (suppressSelection.current) {
                suppressSelection.current = false;
                return;
              }
              setSelected(selected === id ? "" : id);
            }}
          />
        </div>
        <aside
          style={{
            width: 260,
            paddingTop: 32,
            fontSize: 13,
            lineHeight: 1.7,
            wordBreak: "keep-all",
          }}
        >
          {(category === "preferenceFocus" || category === "contextLayers") && (
            <div style={{ display: "flex", gap: 5, marginBottom: 18 }}>
              {(
                [
                  "liking",
                  "fit",
                  ...(category === "preferenceFocus" ? ["overall"] : []),
                ] as Mode[]
              ).map((m) => (
                <button
                  key={m}
                  style={{
                    ...control,
                    background: m === mode ? "#f3f1ed" : "white",
                  }}
                  onClick={() => {
                    setMode(m);
                    setSelected("");
                  }}
                >
                  {m === "liking" ? "호감" : m === "fit" ? "알맞음" : "전체"}
                </button>
              ))}
            </div>
          )}
          {category === "sensoryRays" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {(["taste", "aroma", "texture"] as const).map((d) => (
                <button
                  key={d}
                  style={{
                    ...control,
                    background: d === domain ? "#f3f1ed" : "white",
                  }}
                  onClick={() => {
                    setDomain(d);
                    setSelected("");
                  }}
                >
                  {d === "taste" ? "맛" : d === "aroma" ? "향" : "식감"}
                </button>
              ))}
            </div>
          )}
          {category === "experienceCluster" && scenario === "standard" && (
            <button
              style={{ ...control, marginBottom: 18 }}
              onClick={() => setAdded((a) => !a)}
            >
              {added ? "추가 기록 되돌리기" : "된장국 기록 1개 추가"}
            </button>
          )}
          <p style={{ fontWeight: 600, margin: "0 0 12px" }}>표현 기준</p>
          <p style={{ color: "#746c64", margin: "0 0 20px" }}>{frame.legend}</p>
          {frame.notes.map((note, i) => (
            <p key={i} style={{ margin: "8px 0" }}>
              {note}
            </p>
          ))}
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 24 }}
          >
            {frame.choices.map((choice) => (
              <button
                key={choice.id}
                aria-pressed={selected === choice.id}
                style={{
                  ...control,
                  background: selected === choice.id ? "#f3f1ed" : "white",
                }}
                onClick={() =>
                  setSelected(selected === choice.id ? "" : choice.id)
                }
              >
                {frame.dots.some((d) => d.group === choice.id) && (
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: frame.dots.find((d) => d.group === choice.id)
                        ?.color,
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                )}
                {choice.label}
              </button>
            ))}
          </div>
          {scenario === "dense" && category === "contextLayers" && (
            <div style={{ marginTop: 12 }}>
              <button
                style={control}
                onClick={() => setPage(page === 0 ? 1 : 0)}
              >
                조건 페이지 {page + 1} / 2
              </button>
            </div>
          )}
          {frame.selection.length > 0 && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: "1px solid #e9e6e2",
              }}
            >
              {frame.selection.map((line, i) => (
                <p
                  key={i}
                  style={{ margin: "4px 0", fontWeight: i === 0 ? 600 : 400 }}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: "#95867A", marginTop: 28 }}>
            선택은 대비와 설명만 변경합니다.
            <br />
            재생·정지·프레임 탐색: Studio 하단 · 그림 위 스크롤: 아래로 되감기 /
            위로 펼치기
          </p>
        </aside>
      </div>
    </PreviewSurface>
  );
};
