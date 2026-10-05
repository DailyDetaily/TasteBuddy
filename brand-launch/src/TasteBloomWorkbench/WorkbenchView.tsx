import type { CSSProperties } from "react";
import { SourceBloomAvatar } from "./source-avatar.generated";
import {
  playgroundShape,
  shapeOptions,
  shapeCountLimits,
  tasteControls,
  type BloomShape,
  type TasteKey,
  type TasteProfile,
} from "./settings";
import "../../../src/styles/design-system.css";
import "../../../src/components/system/PalateBloomAvatar.css";
import "./workbench.css";

type Props = {
  profile: TasteProfile;
  onChange?: (taste: TasteKey, value: number) => void;
  onReset?: () => void;
  shape?: BloomShape;
  onShapeChange?: (shape: BloomShape) => void;
  shapeCount?: number;
  onShapeCountChange?: (count: number) => void;
  demo?: boolean;
  focus?: TasteKey | "count";
  cursor?: { x: number; y: number; pressed: boolean };
};
export const WorkbenchView = ({
  profile,
  onChange,
  onReset,
  shape = playgroundShape,
  onShapeChange,
  shapeCount = playgroundShape.shapeCountOverride,
  onShapeCountChange,
  demo = false,
  focus,
  cursor,
}: Props) => {
  return (
    <div className="bloom-workbench" data-demo={demo}>
      <div className="bw-workspace">
        <aside className="bw-panel" aria-label="블룸 아바타 조절 패널">
          <section className="bw-card" aria-label="미각">
            <div className="bw-panel-heading">
              <h2 className="bw-card-title">미각</h2>
              <button
                className="bw-reset"
                onClick={onReset}
                type="button"
                aria-label="미각 점수 초기화"
              >
                초기화
              </button>
            </div>
            <div className="bw-controls">
              {tasteControls.map(({ key, label }) => (
                <div
                  className="bw-taste-control"
                  key={key}
                  data-control={key}
                  data-focused={focus === key}
                >
                  <label className="bw-control-label" htmlFor={`taste-${key}`}>
                    {label}
                  </label>
                  <div
                    className="bw-slider-shell"
                    style={
                      {
                        "--score-ratio": profile[key] / 100,
                        "--taste-color": `var(--tb-taste-${key}-main)`,
                      } as CSSProperties
                    }
                  >
                    <div className="bw-slider-track" aria-hidden>
                      <span />
                    </div>
                    <input
                      id={`taste-${key}`}
                      aria-label={`${label} 점수`}
                      aria-valuetext={`${profile[key]}점`}
                      className="bw-score-slider"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={profile[key]}
                      onChange={(event) =>
                        onChange?.(key, Number(event.target.value))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="bw-card" aria-label="형태 선택">
            <h2 className="bw-card-title">형태</h2>
            <div className="bw-shape-fields" aria-label="블룸 형태 선택">
              {(Object.keys(shapeOptions) as (keyof BloomShape)[]).map(
                (key, index) => (
                  <div className="bw-shape-row" key={key}>
                    <span className="bw-shape-label">
                      {["꽃잎", "수술", "암술"][index]}
                    </span>
                    <div
                      className="bw-shape-options"
                      role="group"
                      aria-label={`${["꽃잎", "수술", "암술"][index]} 형태`}
                    >
                      {shapeOptions[key].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-label={`${["꽃잎", "수술", "암술"][index]} ${label}`}
                          aria-pressed={shape[key] === value}
                          onClick={() =>
                            onShapeChange?.({ ...shape, [key]: value })
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
          <section className="bw-card" aria-label="개수 조절">
            <h2 className="bw-card-title">개수</h2>
            <div
              className="bw-taste-control"
              data-control="count"
              data-focused={focus === "count"}
            >
              <span className="bw-control-label" id="bloom-count-label">
                반복
              </span>
              <div
                className="bw-count-stepper"
                role="group"
                aria-labelledby="bloom-count-label"
              >
                <button
                  type="button"
                  aria-label="반복 개수 줄이기"
                  disabled={shapeCount <= shapeCountLimits.min}
                  onClick={() =>
                    onShapeCountChange?.(
                      Math.max(shapeCountLimits.min, shapeCount - 1),
                    )
                  }
                >
                  −
                </button>
                <output
                  id="bloom-count"
                  aria-label="반복 개수"
                  aria-live="polite"
                >
                  {shapeCount}
                </output>
                <button
                  type="button"
                  aria-label="반복 개수 늘리기"
                  disabled={shapeCount >= shapeCountLimits.max}
                  onClick={() =>
                    onShapeCountChange?.(
                      Math.min(shapeCountLimits.max, shapeCount + 1),
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
          </section>
        </aside>
        <main className="bw-stage" aria-label="블룸 아바타 미리보기">
          <div className="bw-preview">
            <div
              className="bw-avatar-shell"
              data-profile={JSON.stringify(profile)}
            >
              <SourceBloomAvatar
                profile={profile}
                {...playgroundShape}
                {...shape}
                shapeCountOverride={shapeCount}
                size={440}
                showFrame={false}
                ariaLabel="미각 점수에 따른 블룸 아바타"
              />
            </div>
          </div>
        </main>
      </div>
      {demo && cursor && (
        <div
          className="bw-demo-cursor"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          {cursor.pressed && <span className="bw-cursor-ring" />}
          <svg width="25" height="31" viewBox="0 0 25 31">
            <path
              d="M2 2 L2 25 L8 19 L13 29 L17 27 L12 17 L22 17 Z"
              fill="#171717"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
