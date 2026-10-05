import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontReady } from "../fonts";
import { FeedbackBackground } from "./Background";
import { FeedbackCard } from "./Card";
import { cardPalette } from "./palette";
import { mixHex } from "./carousel-motion";
import { flipPose } from "./flip-motion";
import type { FlipProps } from "./flip-settings";

export const DiningFeedbackFlip: React.FC<FlipProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [handle] = useState(() =>
    delayRender("DiningFeedback Flip Pretendard"),
  );
  useEffect(() => {
    fontReady.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  const pose = flipPose(frame, props, fps);
  const from = cardPalette(props.카드[pose.from]);
  const to = cardPalette(props.카드[pose.to]);
  const colors = {
    background: mixHex(from.background, to.background, pose.blend),
    main: mixHex(from.main, to.main, pose.blend),
    secondary: mixHex(from.secondary, to.secondary, pose.blend),
    tertiary: mixHex(from.tertiary, to.tertiary, pose.blend),
  };
  const scale = width / 1120;
  const logicalHeight = height / scale;
  return (
    <AbsoluteFill
      data-feedback-flip
      data-active-card={pose.cardIndex}
      data-flip-angle={pose.rotation}
      style={{ overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          width: 1120,
          height: logicalHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Sequence name="3색 그라데이션 · 플립과 동기화" layout="none">
          <FeedbackBackground
            colors={colors}
            mainCoverage={
              from.mainCoverage +
              (to.mainCoverage - from.mainCoverage) * pose.blend
            }
            elapsed={pose.elapsed}
            width={1120}
            height={logicalHeight}
          />
        </Sequence>
        <Sequence name="결과 카드 · 좌우 플립" layout="none">
          <AbsoluteFill style={{ perspective: 900 }}>
            {/* Keep all images mounted so exchanging faces never waits for a photo download. */}
            {props.카드.map((card, index) => (
              <div
                key={index}
                data-flip-face={index}
                style={{
                  position: "absolute",
                  width: 290,
                  height: 500,
                  left: 415,
                  top: (logicalHeight - 500) / 2,
                  visibility: index === pose.cardIndex ? "visible" : "hidden",
                  transform: `rotateY(${index === pose.cardIndex ? pose.rotation : 0}deg)`,
                  transformOrigin: "center center",
                  backfaceVisibility: "hidden",
                  willChange: "transform",
                }}
              >
                <FeedbackCard
                  {...card}
                  squarePhoto
                  uniformHeight={500}
                  재생="정지"
                  {...{ "재생 시간": 10, "배경 속도": 0, "배경 시작 시점": 0 }}
                />
              </div>
            ))}
          </AbsoluteFill>
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
