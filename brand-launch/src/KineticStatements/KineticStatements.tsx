import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  Interactive,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { kaliceReady } from "../TasteBloomAvatars/fonts";
import { kineticLayout } from "./layout";
import { easeOut, kineticTiming, progress } from "./motion";
import type { KineticStatementsProps } from "./settings";
import { TerminalStatement } from "./TerminalStatement";
import { shapeStatement } from "./typography";

export const KineticStatements = (props: KineticStatementsProps) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const timing = kineticTiming(props);
  const layout = kineticLayout(width, height);
  const [fontHandle] = useState(() =>
    delayRender("Kinetic Statements · Kalice"),
  );

  useEffect(() => {
    kaliceReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);

  const stageScale = Math.min(width / layout.width, height / layout.height);

  return (
    <AbsoluteFill style={{ backgroundColor: "#F3F3F1", overflow: "hidden" }}>
      <div
        data-kinetic-statements
        data-kinetic-frame={frame}
        data-phrase-starts={timing.phrases
          .map(({ start }) => start)
          .join(",")}
        style={{
          position: "absolute",
          width: layout.width,
          height: layout.height,
          left: (width - layout.width * stageScale) / 2,
          top: (height - layout.height * stageScale) / 2,
          transformOrigin: "0 0",
          transform: `scale(${stageScale})`,
          fontFamily: "Kalice, serif",
          color: props["문장 색"],
        }}
      >
        {timing.phrases.map((phrase, index) => {
          const shaped = shapeStatement(
            phrase.text,
            layout.text.width,
            layout.text.size,
            layout.text.maxLines,
          );
          const y = layout.text.centerY - shaped.height / 2;
          const exitProgress = phrase.isLast
            ? 0
            : easeOut(progress(frame, phrase.exitStart, phrase.exitEnd));
          const durationInFrames = phrase.isLast
            ? undefined
            : Math.max(1, phrase.exitEnd - phrase.start + 1);

          return (
            <Sequence
              key={phrase.text}
              name={`${String(index + 1).padStart(2, "0")} · ${phrase.text}`}
              from={phrase.start}
              durationInFrames={durationInFrames}
              layout="none"
            >
              <Interactive.Div
                name={phrase.text}
                style={{
                  position: "absolute",
                  left: layout.text.left,
                  top: y,
                  width: layout.text.width,
                  opacity: 1 - exitProgress,
                  transform: `translateY(${-14 * exitProgress}px)`,
                }}
              >
                <TerminalStatement
                  text={phrase.text}
                  frame={frame}
                  start={phrase.start}
                  fillFrames={timing.fillFrames}
                  stagger={timing.stagger}
                  width={layout.text.width}
                  size={layout.text.size}
                  maxLines={layout.text.maxLines}
                  color={props["문장 색"]}
                  prefix={`phrase-${index + 1}`}
                />
              </Interactive.Div>
            </Sequence>
          );
        })}

      </div>
    </AbsoluteFill>
  );
};
