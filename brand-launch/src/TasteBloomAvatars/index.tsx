import { Composition, Folder } from "remotion";
import { TasteBloomPresentation, TasteBloomComparison } from "./Presentation";
import {
  BLOOM_GALLERY_FRAMES,
  BLOOM_OVERVIEW_FRAMES,
  BLOOM_OVERVIEW_SINGLE_COLOR_FRAMES,
  BLOOM_FPS,
} from "./cycle";
import { TasteBloomProfile } from "./Profile";
import { PROFILE_DURATION_FRAMES } from "./profile-motion";
import { BloomControlsDemo } from "../TasteBloomWorkbench/Demo";
import {
  DEMO_FRAMES,
  DEMO_FPS,
  STUDIO_WIDTH,
  STUDIO_HEIGHT,
} from "../TasteBloomWorkbench/settings";

export const TasteBloomAvatarCompositions = () => (
  <Folder name="Taste-Bloom">
    <Composition
      id="TasteBloom-Controls-Demo"
      component={BloomControlsDemo}
      width={STUDIO_WIDTH}
      height={STUDIO_HEIGHT}
      fps={DEMO_FPS}
      durationInFrames={DEMO_FRAMES}
    />
    <Composition
      id="TasteBloom-Profile"
      component={TasteBloomProfile}
      width={1080}
      height={1080}
      fps={BLOOM_FPS}
      durationInFrames={PROFILE_DURATION_FRAMES}
    />
    <Composition
      id="TasteBloom-Profile-Landscape"
      component={TasteBloomProfile}
      defaultProps={{ elementScale: 1.5 }}
      width={1920}
      height={1080}
      fps={BLOOM_FPS}
      durationInFrames={PROFILE_DURATION_FRAMES}
    />
    <Composition
      id="TasteBloom-9"
      component={TasteBloomPresentation}
      width={1080}
      height={1080}
      fps={BLOOM_FPS}
      durationInFrames={BLOOM_GALLERY_FRAMES}
    />
    <Composition
      id="TasteBloom-Wave"
      component={TasteBloomComparison}
      width={1080}
      height={1080}
      fps={BLOOM_FPS}
      durationInFrames={
        BLOOM_OVERVIEW_FRAMES + BLOOM_OVERVIEW_SINGLE_COLOR_FRAMES
      }
    />
  </Folder>
);
