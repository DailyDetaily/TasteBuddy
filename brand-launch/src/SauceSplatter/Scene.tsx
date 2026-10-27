import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MetaballChipRow } from "../DiningFeedbackMotion/MetaballChipRow";
import {
  ResultChip,
  type ResultChipItem,
} from "../DiningFeedbackMotion/ResultChip";
import { fontReady } from "../fonts";
import {
  SAUCE_ROW_DELAY,
  SAUCE_SPLASH_SEPARATION,
  sauceSplatterElapsed,
  sauceRowSizes,
  sauceSplatterTiming,
} from "./motion";
import {
  createSauceCameraTrack,
  sauceCameraOffset,
} from "./camera";
import type { SauceSplatterProps } from "./settings";
import { DishKindIcon } from "./DishKindIcon";
import {
  nativeDishChipMetrics,
  nativeDishChipColors,
  nativeDishChipGap,
} from "./native-chip";

export const SauceSplatter = (props: SauceSplatterProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const measure = useRef<HTMLDivElement>(null);
  const [chipWidths, setChipWidths] = useState<number[]>([]);
  const [fontHandle] = useState(() =>
    delayRender("Measuring Sauce Splatter chips"),
  );
  const items = useMemo<ResultChipItem[]>(
    () =>
      props.칩.map((chip) => ({
        label: chip.문구,
        colors: nativeDishChipColors(chip.선택),
        icon:
          chip.아이콘 === "없음" ? undefined : (
            <DishKindIcon kind={chip.아이콘 ?? "자동"} label={chip.문구} />
          ),
      })),
    [props.칩],
  );

  useLayoutEffect(() => {
    let active = true;
    const update = () => {
      if (!active || !measure.current) return;
      // Computed layout width excludes Studio's preview zoom and our display scale.
      setChipWidths(
        Array.from(measure.current.children).map((chip) =>
          Number.parseFloat(getComputedStyle(chip).width),
        ),
      );
    };
    update();
    void fontReady
      .then(() => {
        update();
        if (active) continueRender(fontHandle);
      })
      .catch(cancelRender);
    return () => {
      active = false;
    };
  }, [items, fontHandle]);

  const rowCount = props["줄 수"];
  const rows = useMemo(() => {
    let cursor = 0;
    return sauceRowSizes(items.length, rowCount).map((count) => {
      const start = cursor;
      cursor += count;
      const widths = chipWidths.slice(start, cursor);
      return {
        items: items.slice(start, cursor),
        widths,
        width:
          widths.reduce((sum, chipWidth) => sum + chipWidth, 0) +
          (count - 1) * nativeDishChipGap,
      };
    });
  }, [items, chipWidths, rowCount]);
  const rowWidth = Math.max(1, ...rows.map((row) => row.width));
  const rowGap = nativeDishChipGap;
  const stageHeight =
    rows.length * nativeDishChipMetrics.height + (rows.length - 1) * rowGap;
  // Preserve vertical breathing room and native chip proportions while the
  // larger rows continue beyond the frame horizontally.
  const verticalPadding = props["상하 여백"] ?? 72;
  const scale = Math.min(
    props["확대 배율"],
    (height - verticalPadding * 2) / stageHeight,
  );
  const elapsed = sauceSplatterElapsed(frame, props, fps);
  const cameraPadding = props["카메라 여백"];
  const cameraTrack = useMemo(
    () =>
      createSauceCameraTrack({
        rows: rows.map((row) => row.widths),
        scale,
        viewportWidth: width,
        padding: cameraPadding,
        gap: nativeDishChipGap,
      }),
    [rows, scale, width, cameraPadding],
  );
  const timing = sauceSplatterTiming(props, fps);
  const cameraElapsed =
    props.재생 === "정지"
      ? cameraTrack.endSeconds
      : ((frame - timing.startFrames) / fps) * props.속도;
  const cameraX = sauceCameraOffset(cameraElapsed, cameraTrack);

  return (
    <AbsoluteFill
      data-sauce-splatter
      style={{
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Pretendard, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        ref={measure}
        aria-hidden
        style={{
          position: "absolute",
          display: "inline-flex",
          width: "max-content",
          gap: nativeDishChipGap,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {items.map((item, index) => (
          <ResultChip key={index} {...item} metrics={nativeDishChipMetrics} />
        ))}
      </div>
      <div
        data-sauce-splatter-stage
        data-display-scale={scale}
        data-camera-x={cameraX}
        data-camera-padding={cameraPadding}
        data-vertical-padding={verticalPadding}
        style={{
          position: "absolute",
          left: cameraPadding - cameraX,
          top: (height - stageHeight * scale) / 2,
          width: rowWidth || 1,
          height: stageHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: rowGap,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          visibility: chipWidths.length === items.length ? "visible" : "hidden",
        }}
      >
        {rows.map((row, index) => (
          <div
            key={index}
            data-sauce-row={index}
            style={{ width: row.width, height: nativeDishChipMetrics.height }}
          >
            <MetaballChipRow
              items={row.items}
              metrics={nativeDishChipMetrics}
              gap={nativeDishChipGap}
              separation={SAUCE_SPLASH_SEPARATION}
              elapsed={elapsed - index * SAUCE_ROW_DELAY}
            />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
