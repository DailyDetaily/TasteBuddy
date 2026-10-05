import { AbsoluteFill, Series } from "remotion";
import { CategoryHeaderMotion } from "./CategoryHeaderMotion";
import {
  CategoryParticleTransition,
  CATEGORY_TRANSITION_FRAMES,
} from "./CategoryOrbitalTransition";

const EXPERIENCE_FRAMES = 228;
const CATEGORY_IDLE_FRAMES = 66;
const FINAL_FRAMES = 72;
const EXPERIENCE_IDLE_SECONDS = (EXPERIENCE_FRAMES - 1) / 30 - 6.4;
const CATEGORY_IDLE_SECONDS = (CATEGORY_IDLE_FRAMES - 1) / 30;

export const TASTE_CATEGORY_COLLECTION_DURATION =
  EXPERIENCE_FRAMES +
  CATEGORY_TRANSITION_FRAMES * 4 +
  CATEGORY_IDLE_FRAMES * 3 +
  FINAL_FRAMES;

export const TasteCategoryCollection = () => (
  <AbsoluteFill style={{ backgroundColor: "#F3F3F3", overflow: "hidden" }}>
    <Series>
      <Series.Sequence
        durationInFrames={EXPERIENCE_FRAMES}
        name="01 · Experience"
      >
        <CategoryHeaderMotion
          category="experienceCluster"
          scenario="standard"
          mode="liking"
          domain="taste"
          backgroundColor="#F3F3F3"
          playback="intro"
        />
      </Series.Sequence>

      <Series.Sequence
        durationInFrames={CATEGORY_TRANSITION_FRAMES}
        name="Transition · Experience → Sensation"
      >
        <CategoryParticleTransition
          durationInFrames={CATEGORY_TRANSITION_FRAMES}
          from="experienceCluster"
          to="sensoryRays"
          fromIdleTime={EXPERIENCE_IDLE_SECONDS}
        />
      </Series.Sequence>

      <Series.Sequence
        durationInFrames={CATEGORY_IDLE_FRAMES}
        name="02 · Sensation"
      >
        <CategoryHeaderMotion
          category="sensoryRays"
          scenario="standard"
          mode="liking"
          domain="taste"
          backgroundColor="#F3F3F3"
          playback="idle"
        />
      </Series.Sequence>

      <Series.Sequence
        durationInFrames={CATEGORY_TRANSITION_FRAMES}
        name="Transition · Sensation → Preference"
      >
        <CategoryParticleTransition
          durationInFrames={CATEGORY_TRANSITION_FRAMES}
          from="sensoryRays"
          to="preferenceFocus"
          fromIdleTime={CATEGORY_IDLE_SECONDS}
        />
      </Series.Sequence>

      <Series.Sequence
        durationInFrames={CATEGORY_IDLE_FRAMES}
        name="03 · Preference"
      >
        <CategoryHeaderMotion
          category="preferenceFocus"
          scenario="standard"
          mode="liking"
          domain="taste"
          backgroundColor="#F3F3F3"
          playback="idle"
        />
      </Series.Sequence>

      <Series.Sequence
        durationInFrames={CATEGORY_TRANSITION_FRAMES}
        name="Transition · Preference → Context"
      >
        <CategoryParticleTransition
          durationInFrames={CATEGORY_TRANSITION_FRAMES}
          from="preferenceFocus"
          to="contextLayers"
          fromIdleTime={CATEGORY_IDLE_SECONDS}
        />
      </Series.Sequence>

      <Series.Sequence
        durationInFrames={CATEGORY_IDLE_FRAMES}
        name="04 · Context"
      >
        <CategoryHeaderMotion
          category="contextLayers"
          scenario="standard"
          mode="liking"
          domain="taste"
          backgroundColor="#F3F3F3"
          playback="idle"
        />
      </Series.Sequence>

      <Series.Sequence
        durationInFrames={CATEGORY_TRANSITION_FRAMES}
        name="Transition · Context → Change"
      >
        <CategoryParticleTransition
          durationInFrames={CATEGORY_TRANSITION_FRAMES}
          from="contextLayers"
          to="changeRipples"
          fromIdleTime={CATEGORY_IDLE_SECONDS}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={FINAL_FRAMES} name="05 · Change">
        <CategoryHeaderMotion
          category="changeRipples"
          scenario="standard"
          mode="liking"
          domain="taste"
          backgroundColor="#F3F3F3"
          playback="idle"
        />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
