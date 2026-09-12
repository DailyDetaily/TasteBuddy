import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, staticFile } from "remotion";
import { Opening } from "./scenes/Opening";
import { Feedback } from "./scenes/Feedback";
import { Connection } from "./scenes/Connection";
import { Record } from "./scenes/Record";
import { Insight } from "./scenes/Insight";
import { Signature } from "./scenes/Signature";
import "./fonts";

export const BrandLaunch: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <Audio
      name="오리지널 브랜드 사운드"
      src={staticFile("audio/taste-buddy-score.wav")}
      volume={0.72}
    />
    <TransitionSeries>
      <TransitionSeries.Sequence
        durationInFrames={102}
        name="01 왜 이 맛이 좋았을까"
      >
        <Opening />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence
        durationInFrames={162}
        name="02 한 끼를 기록하고"
      >
        <Record />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence
        durationInFrames={192}
        name="03 느낀 맛을 남기면"
      >
        <Feedback />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence
        durationInFrames={252}
        name="04 나의 취향을 이해해요"
      >
        <Insight />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence
        durationInFrames={162}
        name="05 기록에서 이해까지"
      >
        <Connection />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={90} name="06 Taste Buddy">
        <Signature />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
