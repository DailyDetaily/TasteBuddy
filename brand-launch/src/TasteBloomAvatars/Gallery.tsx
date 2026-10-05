import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import "../fonts";
import "./fonts";
import { AnimatedBloom } from "./AnimatedBloom";
import { bloomForms } from "./forms";
import { bloomSvgLayers } from "./generated";
import { BLOOM_CYCLE_FRAMES, bloomCycleAt } from "./cycle";

export const TasteBloomGallery = ({
  batchIndex = 0,
}: {
  batchIndex?: number;
}) => {
  const frame = useCurrentFrame();
  const cycle = bloomCycleAt(frame + batchIndex * BLOOM_CYCLE_FRAMES);
  const visibleForms = bloomForms.slice(
    cycle.displayedBatch * 9,
    cycle.displayedBatch * 9 + 9,
  );
  return (
    <AbsoluteFill
      style={{
        background: "#FFFFFF",
        color: "#302E2B",
        fontFamily: "Pretendard, sans-serif",
        padding: "44px 60px 28px",
      }}
    >
      <div
        aria-label="36가지 형태를 9개씩 보여주는 테이스트 블룸"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          flex: 1,
          gap: "10px 28px",
        }}
      >
        {visibleForms.map((variant, index) => {
          const previous = bloomForms[cycle.batch * 9 + index];
          const next = bloomForms[cycle.nextBatch * 9 + index];
          const backgroundColor = interpolateColors(
            cycle.colorProgress,
            [0, 1],
            [
              bloomSvgLayers[previous.id].backgroundColor,
              bloomSvgLayers[next.id].backgroundColor,
            ],
          );
          return (
            <figure
              key={index}
              data-bloom-id={variant.id}
              data-bloom-form={variant.formNumber}
              style={{
                margin: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <AnimatedBloom
                id={variant.id}
                index={index}
                label={`${variant.name}: ${variant.detail}`}
                motionTime={cycle.motionTime}
                backgroundColor={backgroundColor}
              />
              <figcaption style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "Kalice, serif",
                    fontSize: 14,
                    fontWeight: 400,
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      color: "#968E84",
                      fontSize: "inherit",
                      fontWeight: 400,
                      letterSpacing: "-0.04em",
                      marginRight: 4,
                    }}
                  >
                    {String(variant.formNumber).padStart(2, "0")}
                  </span>
                  {variant.name}
                </div>
                <div style={{ fontSize: 12, color: "#837A70" }}>
                  {variant.detail}
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
