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
import type { CarouselProps } from "./carousel-settings";
import {
  carouselPose,
  cardOpacity,
  relativeCardPosition,
  mixHex,
} from "./carousel-motion";

const FeedbackStage: React.FC<
  CarouselProps & { layer: "both" | "card" | "background" }
> = ({ layer, ...props }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("식후 피드백 Pretendard"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fontReady
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch(cancelRender);
  }, [handle]);
  const pose = carouselPose(frame, props, fps);
  const from = cardPalette(props.카드[pose.from]);
  const to = cardPalette(props.카드[pose.to]);
  const main = mixHex(from.main, to.main, pose.blend);
  const colors = {
    background: mixHex(from.background, to.background, pose.blend),
    main,
    secondary: mixHex(from.secondary, to.secondary, pose.blend),
    tertiary: mixHex(from.tertiary, to.tertiary, pose.blend),
  };
  const scale = width / 1120;
  const logicalHeight = height / scale;
  const pitch = 290 + (props["카드 간격"] ?? 24);
  return (
    <AbsoluteFill
      style={{ overflow: "hidden" }}
      data-feedback-carousel
      data-position={pose.position}
      data-main-color={main}
      data-secondary-color={colors.secondary}
      data-tertiary-color={colors.tertiary}
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
        {layer !== "card" && (
          <Sequence name="3색 그라데이션 · 카드와 동기화" layout="none">
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
        )}
        {layer !== "background" && ready && (
          <Sequence name="6장의 결과 카드 · 레퍼런스 가감속" layout="none">
            <AbsoluteFill data-feedback-flat>
              {props.카드.map((card, index) => {
                const relative = relativeCardPosition(index, pose.position);
                return (
                  <div
                    key={index}
                    data-dish-index={index}
                    data-card-offset={relative}
                    style={{
                      position: "absolute",
                      left: 560 - 145,
                      top: "50%",
                      width: 290,
                      transform: `translate(${relative * pitch}px, -50%)`,
                      opacity: cardOpacity(
                        relative,
                        props["주변 카드 불투명도"] ?? 1,
                      ),
                      willChange: "transform, opacity",
                    }}
                  >
                    <FeedbackCard
                      {...card}
                      squarePhoto
                      uniformHeight={500}
                      재생="정지"
                      {...{
                        "재생 시간": 10,
                        "배경 속도": 0,
                        "배경 시작 시점": 0,
                      }}
                    />
                  </div>
                );
              })}
            </AbsoluteFill>
          </Sequence>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const DiningFeedbackResult: React.FC<CarouselProps> = (props) => (
  <FeedbackStage {...props} layer="both" />
);
export const DiningFeedbackCard: React.FC<CarouselProps> = (props) => (
  <FeedbackStage {...props} layer="card" />
);
export const DiningFeedbackGradient: React.FC<CarouselProps> = (props) => (
  <FeedbackStage {...props} layer="background" />
);
