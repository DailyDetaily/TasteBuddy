import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimatedBloom } from "./AnimatedBloom";
import { bloomForms } from "./forms";
import { BLOOM_OVERVIEW_SINGLE_SPEED } from "./cycle";
import {
  overviewCells,
  overviewAppearanceAt,
  overviewWaveAt,
  overviewWaves,
  type OverviewPaletteMode,
  type OverviewWaveMode,
} from "./overview-layout";

export const TasteBloomOverview = ({
  paletteMode,
  waveMode = "overlap",
}: {
  paletteMode: OverviewPaletteMode;
  waveMode?: OverviewWaveMode;
}) => {
  const frame = useCurrentFrame();
  const motionFrame =
    waveMode === "single-color" ? frame * BLOOM_OVERVIEW_SINGLE_SPEED : frame;
  return (
    <AbsoluteFill
      data-bloom-overview
      data-overview-frame={frame}
      data-overview-motion-frame={motionFrame}
      data-bloom-palette-mode={paletteMode}
      data-bloom-wave-mode={waveMode}
      aria-label={`테이스트 블룸 36종 ${waveMode === "overlap" ? "여러 색 파동 중첩" : "한 색씩 순차 파동"}`}
      style={{
        background: "#FFFFFF",
        padding: 72,
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gridTemplateRows: "repeat(6, 1fr)",
        placeItems: "center",
      }}
    >
      {overviewCells.map((cell) => {
        const active = overviewWaves.flatMap((_, wave) => {
          const pulse = overviewWaveAt(
            motionFrame,
            cell.ring,
            wave,
            waveMode,
            cell.rippleOffset,
          );
          const appearance = overviewAppearanceAt(
            wave,
            cell.index,
            paletteMode,
          );
          return pulse ? [{ ...pulse, appearance }] : [];
        });
        if (active.length === 0) return null;
        const newest = active[active.length - 1].wave;
        const variant = bloomForms[cell.index];
        return (
          <div
            key={variant.id}
            data-bloom-id={variant.id}
            data-bloom-form={variant.formNumber}
            data-bloom-ring={cell.ring}
            data-bloom-ripple-offset={
              waveMode === "single-color" ? cell.rippleOffset : 0
            }
            data-bloom-color={newest + 1}
            style={{
              position: "relative",
              width: 60,
              height: 60,
              gridRow: Math.floor(cell.index / 6) + 1,
              gridColumn: (cell.index % 6) + 1,
            }}
          >
            {active.map((pulse) => (
              <div
                key={pulse.wave}
                data-bloom-wave={pulse.wave + 1}
                data-bloom-age={pulse.age}
                data-bloom-scale={pulse.scale}
                data-bloom-start={pulse.startsAt}
                data-bloom-interior-visible={pulse.interiorVisible}
                data-bloom-interior-opacity={pulse.interiorOpacity}
                aria-hidden={pulse.wave !== newest ? true : undefined}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `scale(${pulse.scale})`,
                  transformOrigin: "50% 50%",
                  zIndex: overviewWaves.length - pulse.wave,
                  pointerEvents: "none",
                }}
              >
                <AnimatedBloom
                  id={variant.id}
                  index={0}
                  label={variant.name}
                  size={60}
                  motionTime={pulse.motionTime}
                  interiorVisible={pulse.interiorVisible}
                  interiorOpacity={pulse.interiorOpacity}
                  backgroundColor={pulse.appearance.backgroundColor}
                  backgroundProgress={pulse.backgroundProgress}
                  colors={pulse.appearance.colors}
                />
              </div>
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
