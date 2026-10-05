import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontReady } from "../fonts";
import { FeedbackCard } from "../DiningFeedbackMotion/Card";
import { FeedbackBackground } from "../DiningFeedbackMotion/Background";
import {
  palette,
  resultPalette,
  rgba,
  type FeedbackProps,
  type TasteAxis,
  type ResultPalette,
} from "../DiningFeedbackMotion/settings";
import { mixHex } from "../DiningFeedbackMotion/carousel-motion";
import catalog from "./feedback-catalog";
import detailCatalog from "./detail-categories";
import { ProgressiveTopChrome } from "./ProgressiveTopChrome";
import { AddChip } from "./AddChip";
import { DishKindChips } from "./DishKindChips";
import {
  BUBBLE_INTRO_SECONDS,
  DETAIL_SELECTION_SECONDS,
  detailScrollState,
  feedbackTiming,
  type FeedbackStage,
} from "./feedback-timing";
import { bubbleEntry, nativeVeilOpacity } from "./bubble-entry";
import { smoothStep } from "./motion";
import {
  nativeFlowUI as ui,
  nativeColors as colors,
  nativeChip,
  nativeBubble,
  nativeTextArea,
  nativeControls,
  nativeText,
} from "./native-ui";
import { feedbackBubbleLayout } from "./feedback-layout";
import { blendBubbleOpacity, nativeBubbleOpacity } from "./bubble-appearance";
import { nativeLineHeight } from "../HomePeriodInsightMotion/native";
import { ResultCardReveal } from "./ResultCardReveal";
import { resultChromeOpacity } from "./result-card-motion";

const photo = "images/camera-entry/generated-pasta-reference.png";
const menu = detailCatalog.menu;
const restaurant = "저저";
const restaurantAddress = "합정 잔다리로 65 을지로 퇴계로 41길 31";
const note =
  "새우의 감칠맛과 버터의 풍성함이 좋았어요. 면은 쫄깃했고 허브 향이 산뜻하게 남았어요.";
const shrimp = catalog.bubbles.find(
  (b) => b.id === "v2.bubble.umami.shrimp-like",
)!;
const butter = catalog.bubbles.find(
  (b) => b.id === "v2.bubble.fat.butter-like",
)!;
const bubbleLayouts = [
  feedbackBubbleLayout([]),
  feedbackBubbleLayout([shrimp.id]),
  feedbackBubbleLayout([shrimp.id, butter.id]),
];
// Compute each settled focus state before mixing it with camera-pan progress.
// Using a moving distance with rounded native rings would introduce new steps.
const bubbleOpacities = bubbleLayouts.map((positions, index) => {
  const focusID = index === 1 ? shrimp.id : index === 2 ? butter.id : undefined;
  const focus = positions.find((b) => b.id === focusID);
  return positions.map((b) =>
    nativeBubbleOpacity(
      index > 0 && (b.id === shrimp.id || b.id === focusID),
      focus ? Math.hypot(b.x - focus.x, b.y - focus.y) : undefined,
    ),
  );
});
const axisColor = (axis: string) =>
  palette[axis === "지방감" ? "지방맛" : (axis as TasteAxis)];
const cardProps: FeedbackProps = {
  재생: "정지",
  "재생 시간": 5,
  "배경 속도": 1,
  "배경 시작 시점": 0,
  "사진 경로": photo,
  메뉴명: menu,
  식당명: restaurant,
  "맛 반응": [
    { 미각: "감칠맛", 문구: shrimp.label },
    { 미각: "지방맛", 문구: butter.label },
  ],
  "상세 태그": ["쫄깃함", "허브 향"],
  "미식 노트": note,
};
const panel: CSSProperties = {
  background: colors.surface,
  borderRadius: ui.cardRadius,
  padding: ui.sectionPadding,
};
const textStyle: CSSProperties = {
  fontFamily: "Pretendard, -apple-system, sans-serif",
  color: colors.textPrimary,
  fontSize: 14,
  lineHeight: `${nativeLineHeight(14)}px`,
};
const typed = (text: string, t: number, start = 0.6, seconds = 1.2) =>
  text.slice(
    0,
    Math.floor(text.length * Math.min(1, Math.max(0, (t - start) / seconds))),
  );
const Chevron = ({ right = false }: { right?: boolean }) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path d={right ? "M9 5 16 12 9 19" : "M15 5 8 12 15 19"} />
  </svg>
);
const LineIcon = ({
  kind,
}: {
  kind: "pencil" | "camera" | "search" | "share";
}) => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {kind === "pencil" ? (
      <path d="M16 3l5 5M3 21l5-1L21 7a3.5 3.5 0 0 0-5-5L3 15z" />
    ) : kind === "camera" ? (
      <>
        <path d="M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11H2V8a2 2 0 0 1 2-2z" />
        <circle cx={12} cy={12} r={3} />
      </>
    ) : kind === "search" ? (
      <>
        <circle cx={10} cy={10} r={6} />
        <path d="m15 15 6 6" />
      </>
    ) : (
      <>
        <path d="M12 16V2m-4 4 4-4 4 4M5 10H3v11h18V10h-2" />
      </>
    )}
  </svg>
);
// Browser rendering of the native clear glass chrome: translucent material,
// backdrop diffusion, edge highlights, and a soft lifted shadow.
const chromeGlass: CSSProperties = {
  background:
    "linear-gradient(145deg, rgba(255,255,255,.56), rgba(255,255,255,.16) 55%, rgba(255,255,255,.34))",
  backdropFilter: "blur(12px) saturate(1.5)",
  WebkitBackdropFilter: "blur(12px) saturate(1.5)",
  boxShadow:
    "inset 0 1px 1px rgba(255,255,255,.95), inset 0 -1px 1px rgba(255,255,255,.5), 0 3px 12px rgba(0,0,0,.09), 0 0 0 .5px rgba(0,0,0,.035)",
  borderRadius: 999,
};
const Header = ({
  title,
  result = false,
  opacity = 1,
  next = false,
}: {
  title: string;
  result?: boolean;
  opacity?: number;
  next?: boolean;
}) => (
  <div
    data-result-chrome={result ? "header" : undefined}
    style={{
      opacity,
      position: "absolute",
      top: ui.safeAreaTop,
      left: ui.pagePadding,
      right: ui.pagePadding,
      height: next ? ui.chromeButtonSize : ui.topBarHeight,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 3,
    }}
  >
    <div
      style={{
        ...(next ? chromeGlass : {}),
        width: next ? ui.chromeButtonSize : ui.topBarHeight,
        height: next ? ui.chromeButtonSize : ui.topBarHeight,
        display: "grid",
        placeItems: "center",
        color: colors.textSecondary,
      }}
    >
      <Chevron />
    </div>
    <b
      style={{
        position: "absolute",
        ...(next ? chromeGlass : {}),
        left: next ? "50%" : 36,
        right: next ? undefined : 36,
        transform: next ? "translateX(-50%)" : undefined,
        whiteSpace: "nowrap",
        height: next ? ui.chromeButtonSize : undefined,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        fontSize: ui.titleSize,
        lineHeight: `${nativeLineHeight(ui.titleSize)}px`,
        padding: next ? "0 12px" : 0,
      }}
    >
      {result ? "" : nativeText(title)}
    </b>
    {next ? (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span
          style={{
            ...chromeGlass,
            fontSize: 12,
            fontWeight: 600,
            padding: "0 14px",
            height: ui.chromeButtonSize,
            display: "grid",
            placeItems: "center",
          }}
        >
          {nativeText("다음")}
        </span>
        <span
          style={{
            ...chromeGlass,
            width: ui.chromeButtonSize,
            height: ui.chromeButtonSize,
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
          >
            <circle cx={10.5} cy={10.5} r={7.5} />
            <path d="m16 16 5 5" />
          </svg>
        </span>
      </div>
    ) : (
      <span
        style={{
          width: ui.topBarHeight,
          height: ui.topBarHeight,
          display: "grid",
          placeItems: "center",
        }}
      >
        {result && <LineIcon kind="share" />}
      </span>
    )}
  </div>
);
const Intro = ({
  title,
  children,
  overall = false,
}: {
  title: string;
  children: ReactNode;
  overall?: boolean;
}) => (
  <div style={{ marginBottom: overall ? 24 : 20 }}>
    <div
      style={{
        fontSize: 18,
        fontWeight: 700,
        lineHeight: `${nativeLineHeight(18) + 2}px`,
        marginBottom: overall ? 8 : 12,
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontSize: overall ? 13 : 14,
        color: overall ? colors.textSubtle : colors.textBody,
        lineHeight: `${nativeLineHeight(overall ? 13 : 14) + (overall ? 4 : 5)}px`,
      }}
    >
      {children}
    </div>
  </div>
);
const Choice = ({
  title,
  description,
  selected = false,
}: {
  title: string;
  description?: string;
  selected?: boolean;
}) => (
  <div
    style={{
      ...panel,
      padding: ui.selectionPadding,
      boxShadow: `inset 0 0 0 1px ${selected ? colors.selectionSurface : "transparent"}${selected ? `, 0 ${ui.selectionShadowY}px ${ui.selectionShadowRadius}px ${rgba(colors.textPrimary, 0.06)}` : ""}`,
      display: "flex",
      alignItems: description ? "flex-start" : "center",
      gap: ui.selectionGap,
      minHeight: description ? undefined : 50,
      marginBottom: 10,
    }}
  >
    <span
      style={{
        width: ui.selectionIndicator,
        height: ui.selectionIndicator,
        marginTop: description ? 2 : 0,
        flexShrink: 0,
        borderRadius: "50%",
        border: `${selected ? 2 : 1}px solid ${selected ? colors.selectionSurface : colors.borderDisabled}`,
        display: "grid",
        placeItems: "center",
      }}
    >
      {selected && (
        <span
          style={{
            width: ui.radioDot,
            height: ui.radioDot,
            borderRadius: "50%",
            background: colors.selectionSurface,
          }}
        />
      )}
    </span>
    <div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          lineHeight: `${nativeLineHeight(14) + 2}px`,
        }}
      >
        {nativeText(title)}
      </div>
      {description && (
        <div
          style={{
            fontSize: 12,
            color: colors.textMuted,
            lineHeight: `${nativeLineHeight(12) + 3}px`,
          }}
        >
          {nativeText(description)}
        </div>
      )}
    </div>
  </div>
);
const Chip = ({
  label,
  selected = false,
  axis,
}: {
  label: string;
  selected?: boolean;
  axis?: TasteAxis;
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: `${nativeChip.paddingY}px ${nativeChip.paddingX}px`,
      minHeight: nativeChip.height,
      borderRadius: 999,
      border: `${nativeChip.borderWidth}px solid ${selected ? (axis ? rgba(palette[axis].main, nativeChip.selectedBorderOpacity) : colors.textPrimary) : colors.border}`,
      background: selected
        ? axis
          ? palette[axis].tint
          : colors.textPrimary
        : colors.mutedSurface,
      color: selected
        ? axis
          ? palette[axis].main
          : "white"
        : colors.textSubtle,
      fontSize: nativeChip.fontSize,
      fontWeight: 600,
      lineHeight: `${nativeLineHeight(nativeChip.fontSize)}px`,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);
const Field = ({ label, value }: { label: string; value: string }) => (
  <div style={{ ...panel, marginTop: 12 }}>
    <b style={{ fontSize: 14, fontWeight: 600 }}>{label}</b>
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          boxShadow: `inset 0 0 0 1px ${colors.focusRing}`,
          borderRadius: ui.controlRadius,
          padding: "10px 12px",
          height: ui.fieldHeight,
          fontSize: 13,
          fontWeight: 600,
          color: value ? colors.textPrimary : colors.textHint,
        }}
      >
        {value || nativeText("예: 오미자와 배 디저트", "menu")}
      </div>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "0 16px",
          height: ui.fieldHeight,
          borderRadius: ui.controlRadius,
          fontSize: 12,
          fontWeight: 600,
          color: value ? colors.textInverse : colors.textDisabled,
          background: value ? colors.textPrimary : colors.disabledSurface,
        }}
      >
        추가
      </div>
    </div>
  </div>
);
const MenuStep = ({ t }: { t: number }) => {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [scrollRange, setScrollRange] = useState(0);
  const entered = t >= 1.7;
  useEffect(() => {
    const handle = delayRender("Measure native menu groups");
    let active = true;
    fontReady
      .then(() => {
        if (active && viewport.current && content.current)
          setScrollRange(
            Math.max(
              0,
              content.current.scrollHeight - viewport.current.clientHeight,
            ),
          );
        continueRender(handle);
      })
      .catch(cancelRender);
    return () => {
      active = false;
      continueRender(handle);
    };
  }, [entered]);
  return (
    <div
      ref={viewport}
      data-native-menu-viewport
      style={{ height: "100%", overflow: "hidden" }}
    >
      <div
        ref={content}
        style={{
          transform: `translateY(${-scrollRange * smoothStep((t - 2.15) / 0.95)}px)`,
          paddingBottom: 16,
        }}
      >
        <Intro title={nativeText("어떤 메뉴를 먼저 기록할까요?", "menu")}>
          {nativeText("가장 선명하게 기억나는 메뉴부터 선택해 주세요.", "menu")}
        </Intro>
        <Choice title={entered ? menu : "직접 입력"} selected={t > 0.35} />
        {entered ? (
          <DishKindChips />
        ) : (
          <Field
            label={nativeText("메뉴 직접 입력", "menu")}
            value={typed(menu, t, 0.5, 1)}
          />
        )}
      </div>
    </div>
  );
};
const NoteStep = ({ t }: { t: number }) => {
  const value = typed(note, t, 0.4, 1.6);
  return (
    <div data-native-text-area>
      <div
        style={{
          fontSize: nativeTextArea.labelSize,
          fontWeight: 600,
          color: colors.textSecondary,
          marginBottom: nativeTextArea.gap,
        }}
      >
        {nativeText("추가 메모 · 선택사항", "note")}
      </div>
      <div
        style={{
          height: nativeTextArea.height + nativeTextArea.padding * 2,
          padding: `${nativeTextArea.padding + nativeTextArea.insetY}px ${nativeTextArea.padding + nativeTextArea.insetX}px`,
          background: colors.surface,
          borderRadius: ui.cardRadius,
          boxShadow: `inset 0 0 0 1px ${colors.border}`,
          fontSize: nativeTextArea.fontSize,
          lineHeight: `${nativeLineHeight(nativeTextArea.fontSize)}px`,
          color: value ? colors.textPrimary : colors.textHint,
        }}
      >
        {value || nativeText("기억에 남는 맛과 상황을 적어 주세요.", "note")}
        {value && <span style={{ opacity: t < 2 ? 1 : 0 }}>│</span>}
      </div>
    </div>
  );
};
const CTA = ({
  label,
  secondary,
  selected = true,
  press = false,
  background = colors.page,
  helper,
  opacity = 1,
}: {
  label: string;
  secondary?: string;
  selected?: boolean;
  press?: boolean;
  background?: string;
  helper?: string;
  opacity?: number;
}) => (
  <div
    data-native-cta-backdrop
    style={{
      opacity,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      // Native gradient ignores the bottom safe area; content still respects it.
      height: ui.ctaFadeHeight + ui.safeAreaBottom,
      padding: `0 ${ui.ctaPagePadding}px ${ui.ctaBottomPadding + ui.safeAreaBottom}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      background:
        background === "transparent"
          ? undefined
          : `linear-gradient(${background}00,${background}CC 45%,${background} 100%)`,
    }}
  >
    {helper && (
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: colors.textFaint,
          textAlign: "center",
          marginBottom: ui.ctaHelperGap,
        }}
      >
        {nativeText(helper)}
      </div>
    )}
    <div style={{ display: "flex", gap: ui.ctaGap }}>
      {secondary && (
        <div
          data-native-secondary-cta
          style={{
            flex: 1,
            background: "transparent",
            border: `1px solid ${colors.borderStrong}`,
            borderRadius: ui.controlRadius,
            height: ui.primaryHeight,
            display: "grid",
            placeItems: "center",
            fontSize: ui.primaryFontSize,
            fontWeight: 500,
            color: colors.textTertiary,
          }}
        >
          {secondary}
        </div>
      )}
      <div
        data-native-primary-cta
        style={{
          flex: 1,
          height: ui.primaryHeight,
          background: selected
            ? press
              ? mixHex(
                  colors.actionPrimary,
                  "#FFFFFF",
                  nativeControls.primaryPressedOpacity,
                )
              : colors.actionPrimary
            : colors.disabledSurface,
          color: selected ? colors.actionOnPrimary : colors.textDisabled,
          borderRadius: ui.controlRadius,
          display: "grid",
          placeItems: "center",
          fontSize: ui.primaryFontSize,
          fontWeight: 600,
          boxShadow: selected
            ? `0 ${ui.primaryShadowY}px ${ui.primaryShadowRadius}px ${rgba("#000000", ui.primaryShadowOpacity)}`
            : undefined,
          transform: `scale(${press && selected ? 1 - nativeControls.pressDistance / Math.max(ui.primaryHeight, (402 - 2 * ui.ctaPagePadding - (secondary ? ui.ctaGap : 0)) / (secondary ? 2 : 1) / nativeControls.widthBasisDivisor, nativeControls.minimumBasis) : 1})`,
        }}
      >
        {nativeText(label)}
      </div>
    </div>
  </div>
);
const Tap = ({
  t,
  at,
  x,
  y,
}: {
  t: number;
  at: number;
  x: number;
  y: number;
}) => {
  const p = (t - at) / 0.42;
  return p >= 0 && p <= 1 ? (
    <div
      style={{
        position: "absolute",
        left: x - 20,
        top: y - 20,
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "2px solid rgba(30,30,30,.4)",
        background: "rgba(255,255,255,.35)",
        transform: `scale(${0.65 + p * 0.75})`,
        opacity: 1 - p,
        pointerEvents: "none",
      }}
    />
  ) : null;
};
const HomeBar = () => (
  <div
    style={{
      position: "absolute",
      bottom: 8,
      left: (402 - ui.homeIndicatorWidth) / 2,
      width: ui.homeIndicatorWidth,
      height: 5,
      background: "#111",
      borderRadius: 4,
    }}
  />
);

const Bubbles = ({ t: elapsed }: { t: number }) => {
  const t = elapsed - BUBBLE_INTRO_SECONDS;
  const firstPan = smoothStep((t - 0.4) / 0.8);
  const secondPan = smoothStep((t - 2.4) / 0.7);
  const focus = t < 2.4 ? shrimp : butter;
  // Native focus enlarges a bubble before it is committed as a taste choice.
  const focus1 = smoothStep((t - 0.4) / 0.32);
  const focus2 = smoothStep((t - 2.4) / 0.32);
  const zoom =
    nativeBubble.entryZoom +
    firstPan * (nativeBubble.selectedZoom - nativeBubble.entryZoom);
  const positions = catalog.bubbles.map((b, i) => {
    const a = bubbleLayouts[0][i],
      c = bubbleLayouts[1][i],
      d = bubbleLayouts[2][i];
    return {
      ...b,
      x: a.x + (c.x - a.x) * focus1 + (d.x - c.x) * focus2,
      y: a.y + (c.y - a.y) * focus1 + (d.y - c.y) * focus2,
    };
  });
  const first = positions.find((b) => b.id === shrimp.id)!;
  const second = positions.find((b) => b.id === butter.id)!;
  const focused = t < 0.4 ? undefined : t < 2.4 ? first : second;
  const cx = (first.x * (1 - secondPan) + second.x * secondPan) * firstPan;
  const cy = (first.y * (1 - secondPan) + second.y * secondPan) * firstPan;
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {positions.map((b, i) => {
          const x = 201 + (b.x - cx) * zoom;
          const y = 370 + (b.y - cy) * zoom;
          if (x < -110 || x > 512 || y < -110 || y > 984) return null;
          const priority =
            b.id === shrimp.id && t >= 1.6
              ? 0
              : b.id === butter.id && t >= 3.6
                ? 1
                : undefined;
          const highlighted = priority !== undefined || focused?.id === b.id;
          const weight =
            b.id === shrimp.id ? focus1 : b.id === butter.id ? focus2 : 0;
          const diameter =
            nativeBubble.diameter +
            weight * (nativeBubble.selectedDiameter - nativeBubble.diameter);
          const color = axisColor(b.axis);
          const { fillOpacity, textOpacity } = blendBubbleOpacity(
            blendBubbleOpacity(
              bubbleOpacities[0][i],
              bubbleOpacities[1][i],
              firstPan,
            ),
            bubbleOpacities[2][i],
            secondPan,
          );
          const entry = bubbleEntry(b.id, elapsed);
          const outline = highlighted
            ? smoothStep((t - (b.id === shrimp.id ? 0.4 : 2.4) - 0.32) / 0.18)
            : 0;
          return (
            <div
              key={b.id}
              data-bubble-id={b.id}
              data-focused={focused?.id === b.id}
              data-fill-opacity={fillOpacity}
              style={{
                position: "absolute",
                left: x - diameter / 2,
                top: y - diameter / 2,
                width: diameter,
                height: diameter,
                borderRadius: "50%",
                background: rgba(color.tint, fillOpacity),
                boxShadow: `${highlighted ? "0 18px 46px rgba(0,0,0,.12), " : ""}inset 0 0 0 1px ${rgba(color.main, 0.18 * outline)}`,
                zIndex: highlighted ? 4 : 3,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                opacity: entry.opacity,
                transform: `scale(${zoom * entry.scale})`,
              }}
            >
              {priority !== undefined && (
                <span
                  style={{
                    position: "absolute",
                    fontSize: 10,
                    fontWeight: 600,
                    color: rgba(color.text, 0.7),
                    transform: "translateY(-26px)",
                    lineHeight: `${nativeLineHeight(10)}px`,
                  }}
                >
                  {nativeText(
                    priority === 0 ? "메인 미각" : "보조 미각",
                    "bubble",
                  )}
                </span>
              )}
              <span
                style={{
                  padding: "0 14px",
                  fontSize: nativeBubble.labelSize,
                  fontWeight: 700,
                  lineHeight: `${nativeLineHeight(nativeBubble.labelSize)}px`,
                  color: rgba(color.text, textOpacity),
                  transform: `translateY(${priority === undefined ? 0 : 8}px) scale(${1 + (nativeBubble.selectedLabelScale - 1) * weight})`,
                  wordBreak: "keep-all",
                  overflowWrap: "anywhere",
                }}
              >
                {b.label}
              </span>
            </div>
          );
        })}
        <div
          data-bubble-entry-veil
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            background: colors.surface,
            opacity: nativeVeilOpacity(elapsed),
            pointerEvents: "none",
          }}
        />
      </div>
      <div
        style={{
          opacity: smoothStep((t - 0.4) / 0.18),
          transform: `translateY(${8 * (1 - smoothStep((t - 0.4) / 0.18))}px)`,
          position: "absolute",
          left: ui.pagePadding,
          right: ui.pagePadding,
          bottom: 54,
          padding: 16,
          borderRadius: 20,
          background: colors.surface,
          border: `1px solid ${colors.borderCard}`,
          boxShadow: "0 6px 20px #0000000A",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: axisColor(focus.axis).main,
              lineHeight: `${nativeLineHeight(16)}px`,
            }}
          >
            {focus.label}
          </div>
          <div
            style={{
              fontSize: 14,
              color: colors.textSubtle,
              lineHeight: `${nativeLineHeight(14) + 2}px`,
              marginTop: 4,
            }}
          >
            {focus.description}
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginTop: 12,
              minHeight: 16,
            }}
          >
            {[0, 1, 2].map((i) => {
              const count = t >= 3.6 ? 2 : t >= 1.6 ? 1 : 0;
              const color = i === 0 ? palette.감칠맛.main : palette.지방맛.main;
              return (
                <span
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      border: `1px solid ${i < count ? color : colors.border}`,
                      background: i < count ? color : "transparent",
                    }}
                  />
                  {i === count && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: colors.textFaint,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {count ? "보조 미각 선택" : "메인 미각 선택"}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
        <span
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: colors.textPrimary,
            color: colors.textInverse,
          }}
        >
          <Chevron right />
        </span>
      </div>
      <Tap t={t} at={1.6} x={201} y={370} />
      <Tap t={t} at={3.6} x={201} y={370} />
    </>
  );
};

const DetailView = ({ t }: { t: number }) => {
  const scroll = detailScrollState(t);
  return (
    <div style={{ height: 660, overflow: "visible" }}>
      <div
        style={{
          transform: `translateY(${-scroll.page}px)`,
          paddingBottom: 164,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: 16,
            padding: "8px 0",
            marginBottom: ui.detailSectionGap,
          }}
        >
          <div
            style={{
              width: nativeBubble.heroSize,
              height: nativeBubble.heroSize,
              padding: 20,
              borderRadius: "50%",
              background: palette.감칠맛.tint,
              border: `1px solid ${palette.감칠맛.main}38`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
              textAlign: "center",
              color: palette.감칠맛.text,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>
              {nativeText("메인 미각")}
            </span>
            <b style={{ fontSize: 17, lineHeight: 1.3 }}>{shrimp.label}</b>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {["감칠맛", "지방맛"].map((axis, i) => (
              <span
                key={axis}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: palette[axis as TasteAxis].tint,
                  border: `1px solid ${palette[axis as TasteAxis].main}38`,
                  opacity: i ? 0.45 : 1,
                  transform: `scale(${i ? 1 : 1.1})`,
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            padding: 12,
            borderRadius: 20,
            background: colors.mutedSurface,
            border: `1px solid ${colors.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: ui.detailSectionGap,
          }}
        >
          <Img
            src={staticFile(photo)}
            style={{
              width: 48,
              height: 48,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
          <span style={{ flex: 1 }} />
          {(["pencil", "camera"] as const).map((kind) => (
            <span
              key={kind}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                display: "grid",
                placeItems: "center",
                color: colors.textSecondary,
              }}
            >
              <LineIcon kind={kind} />
            </span>
          ))}
        </div>
        {detailCatalog.categories.map((group) => {
          const breakIndex = Math.ceil(group.tags.length / 2);
          const rows = [
            group.tags.slice(0, breakIndex),
            group.tags.slice(breakIndex),
          ];
          const pan = scroll[group.id] ?? 0;
          return (
            <div
              key={group.id}
              data-detail-category={group.id}
              style={{ marginBottom: ui.detailSectionGap }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: nativeChip.categoryHeaderGap,
                  lineHeight: "20px",
                }}
              >
                <b style={{ fontSize: nativeChip.categoryFontSize }}>
                  {group.label}
                </b>
                <span style={{ fontSize: 11, color: colors.textFaint }}>
                  {nativeText("선택사항")}
                </span>
              </div>
              <div style={{ overflow: "hidden", padding: "1px 0" }}>
                <div
                  style={{
                    display: "inline-flex",
                    width: "max-content",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: nativeChip.rowGap,
                    transform: `translateX(min(0px, calc(${pan * (402 - 2 * ui.pagePadding)}px - ${pan * 100}%)))`,
                  }}
                >
                  {rows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      style={{ display: "flex", gap: nativeChip.rowGap }}
                    >
                      {rowIndex === 0 && (
                        <AddChip label={`${group.label} 직접 입력`} />
                      )}
                      {row.map((tag) => (
                        <span
                          key={tag.id}
                          data-detail-tag={tag.id}
                          style={{ display: "inline-flex" }}
                        >
                          <Chip
                            label={tag.label}
                            axis="감칠맛"
                            selected={
                              (tag.id === "v2.detail.texture.chewy" &&
                                t >= DETAIL_SELECTION_SECONDS.texture) ||
                              (tag.id === "v2.detail.aroma.herbal" &&
                                t >= DETAIL_SELECTION_SECONDS.aroma)
                            }
                          />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Stage = ({
  id,
  seconds,
  settled = false,
  resultFromPreview = false,
}: {
  id: FeedbackStage;
  seconds: number;
  settled?: boolean;
  resultFromPreview?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enter = smoothStep(t / 0.26);
  const result = id === "result";
  const resultStart =
    feedbackTiming(fps).stages.find((stage) => stage.id === "result")!.from /
    fps;
  return (
    <AbsoluteFill
      data-feedback-stage={id}
      style={{
        ...textStyle,
        background: ["bubbles", "details", "note"].includes(id)
          ? colors.focus
          : colors.page,
        transform:
          id === "bubbles" || result
            ? undefined
            : `translateX(${(1 - enter) * 40}px)`,
        opacity: id === "bubbles" || result ? 1 : enter,
      }}
    >
      {result && (
        <FeedbackBackground
          colors={resultPalette(cardProps["맛 반응"])}
          elapsed={t + (resultFromPreview ? resultStart : 0)}
          width={402}
          height={874}
        />
      )}
      {/* Native top chrome is enabled for form steps, including details and note. */}
      {id !== "bubbles" && !result && <ProgressiveTopChrome />}
      <Header
        title={
          id === "overall"
            ? "전체 평가"
            : ["bubbles", "details", "note"].includes(id)
              ? menu
              : result
                ? "식후 피드백 카드"
                : "식후 피드백"
        }
        result={result}
        next={id === "bubbles"}
        opacity={result ? resultChromeOpacity(t, resultFromPreview) : 1}
      />
      <div
        style={{
          position: "absolute",
          top:
            ui.safeAreaTop +
            ui.topBarHeight +
            (id === "note" || id === "menu"
              ? ui.pageTopPadding
              : id === "details"
                ? ui.detailContentTop
                : 24),
          left: ui.pagePadding,
          right: ui.pagePadding,
          bottom: 116,
        }}
      >
        {id === "restaurant" && (
          <>
            <Intro title={nativeText("어느 식당에서 남긴 기록인가요?")}>
              {nativeText(
                "사진 위치를 기준으로 가까운 식당 후보를 먼저 정리했어요. 맞는 식당을 고르거나, 보이지 않으면 직접 입력해 주세요.",
              )}
            </Intro>
            <Choice
              title={restaurant}
              description={`${restaurantAddress} · 근처 5m`}
              selected={t > 0.45}
            />
            <Choice
              title={nativeText("직접 입력")}
              description="후보가 맞지 않으면 식당명을 직접 남길 수 있어요"
              selected={false}
            />
          </>
        )}
        {id === "menu" && <MenuStep t={t} />}
        {id === "overall" && (
          <>
            <Intro title={nativeText("이 음식은 전체적으로 어땠나요?")} overall>
              {nativeText("가장 가까운 느낌을 골라주세요.")}
            </Intro>
            {[
              "정말 좋았어요",
              "좋았어요",
              "보통이었어요",
              "아쉬웠어요",
              "많이 아쉬웠어요",
            ].map((label, i) => (
              <Choice key={label} title={label} selected={t > 1 && i === 1} />
            ))}
          </>
        )}
        {id === "details" && <DetailView t={t} />}
        {id === "note" && <NoteStep t={t} />}
      </div>
      {id === "bubbles" && <Bubbles t={t} />}
      {result && (
        <ResultCardReveal
          elapsed={t}
          phase={resultFromPreview ? "complete" : "entrance"}
        >
          {(reveal) => (
            <FeedbackCard {...cardProps} cardWidth={302} reveal={reveal} />
          )}
        </ResultCardReveal>
      )}
      {id !== "bubbles" && (
        <CTA
          label={
            {
              restaurant: "식당 확인하고 메뉴 선택",
              menu: "취향까지 기록",
              overall: "미각 버블 고르기",
              details: "완료",
              note: "계속하기",
              result: "저장",
              bubbles: "",
            }[id]
          }
          secondary={
            result ? "추가 기록" : id === "note" ? "취소하기" : undefined
          }
          helper={
            ["details", "note"].includes(id)
              ? id === "details" && t < DETAIL_SELECTION_SECONDS.texture
                ? "태그를 고르지 않아도 미각 인상은 저장됩니다."
                : `${id === "details" && t < DETAIL_SELECTION_SECONDS.aroma ? 1 : 2}개의 디테일 단서를 함께 저장합니다.`
              : undefined
          }
          selected={
            t >
            (id === "restaurant"
              ? 0.45
              : id === "menu"
                ? 1.7
                : id === "overall"
                  ? 1
                  : 0)
          }
          background={
            result
              ? "transparent"
              : ["details", "note"].includes(id)
                ? colors.focus
                : colors.page
          }
          press={!settled && t > seconds - 0.25}
          opacity={result ? resultChromeOpacity(t, resultFromPreview) : 1}
        />
      )}
      <Tap
        t={settled || result ? -1 : t}
        at={
          id === "overall"
            ? 1
            : id === "restaurant"
              ? 0.45
              : id === "result"
                ? 3.5
                : seconds - 0.4
        }
        x={id === "bubbles" ? 358 : id === "overall" ? 194 : 201}
        y={
          id === "bubbles"
            ? 83
            : id === "overall"
              ? 326
              : id === "restaurant"
                ? 283
                : 874 -
                  ui.safeAreaBottom -
                  ui.ctaBottomPadding -
                  ui.primaryHeight / 2
        }
      />
      <HomeBar />
    </AbsoluteFill>
  );
};

export const FeedbackFlow = ({
  onlyResult = false,
  excludeResult = false,
  settled = false,
  resultFromPreview = false,
}: {
  onlyResult?: boolean;
  excludeResult?: boolean;
  settled?: boolean;
  resultFromPreview?: boolean;
}) => {
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender("Feedback flow Pretendard"));
  useEffect(() => {
    fontReady.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  const allStages = feedbackTiming(fps).stages;
  const stages = onlyResult
    ? allStages.filter((s) => s.id === "result").map((s) => ({ ...s, from: 0 }))
    : excludeResult
      ? allStages.filter((s) => s.id !== "result")
      : allStages;
  return (
    <AbsoluteFill style={{ background: colors.page, ...textStyle }}>
      {stages.map((stage, i) => (
        <Sequence
          key={stage.id}
          name={stage.name}
          from={stage.from}
          durationInFrames={
            stage.duration +
            (i < stages.length - 1 ? Math.round(fps * 0.26) : 0)
          }
        >
          <Stage
            id={stage.id}
            seconds={stage.seconds}
            settled={settled}
            resultFromPreview={resultFromPreview}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Show the demo menu name immediately; other fields follow the middle panel.
export const FeedbackResultPreview = ({
  elapsed,
  initialColors,
}: {
  elapsed: number;
  initialColors: ResultPalette;
}) => {
  const stages = feedbackTiming(60).stages;
  const starts = (id: FeedbackStage) =>
    stages.find((stage) => stage.id === id)!.from / 60;
  const second = elapsed >= starts("bubbles") + BUBBLE_INTRO_SECONDS + 3.6;
  const firstAt = starts("bubbles") + BUBBLE_INTRO_SECONDS + 1.6;
  const secondAt = starts("bubbles") + BUBBLE_INTRO_SECONDS + 3.6;
  const detailTime = elapsed - starts("details");
  const tags =
    detailTime >= DETAIL_SELECTION_SECONDS.aroma ? ["쫄깃함", "허브 향"] : [];
  const props: FeedbackProps = {
    ...cardProps,
    "사진 경로": elapsed >= 0 ? photo : "",
    메뉴명: menu,
    식당명: elapsed >= 0.45 ? restaurant : "",
    // Start each row's connected entrance once its selected items are known.
    "맛 반응": second ? cardProps["맛 반응"] : [],
    "상세 태그": tags,
    "미식 노트":
      elapsed >= starts("note")
        ? typed(note, elapsed - starts("note"), 0.4, 1.6)
        : "",
  };
  const mixColors = (a: ResultPalette, b: ResultPalette, blend: number) => ({
    background: mixHex(a.background, b.background, blend),
    main: mixHex(a.main, b.main, blend),
    secondary: mixHex(a.secondary, b.secondary, blend),
    tertiary: mixHex(a.tertiary, b.tertiary, blend),
  });
  const tasteColors = mixColors(
    resultPalette(cardProps["맛 반응"].slice(0, 1)),
    resultPalette(cardProps["맛 반응"]),
    smoothStep((elapsed - secondAt) / 0.65),
  );
  const backgroundColors = mixColors(
    initialColors,
    tasteColors,
    smoothStep((elapsed - firstAt) / 0.65),
  );
  return (
    <AbsoluteFill style={{ ...textStyle, background: colors.page }}>
      <AbsoluteFill style={{ opacity: smoothStep(elapsed / 0.2) }}>
        <FeedbackBackground
          colors={backgroundColors}
          elapsed={Math.max(0, elapsed)}
          width={402}
          height={874}
        />
      </AbsoluteFill>
      <ResultCardReveal elapsed={elapsed}>
        {(reveal) => (
          <FeedbackCard
            {...props}
            cardWidth={302}
            reveal={reveal}
            chipEntrance={{
              reactions: elapsed - secondAt,
              details: detailTime - DETAIL_SELECTION_SECONDS.aroma,
            }}
          />
        )}
      </ResultCardReveal>
      <HomeBar />
    </AbsoluteFill>
  );
};
