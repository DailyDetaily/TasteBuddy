import { Sequence } from "remotion";
import { TasteBloomGallery } from "./Gallery";
import { TasteBloomOverview } from "./Overview";
import {
  BLOOM_OVERVIEW_FRAMES,
  BLOOM_OVERVIEW_SINGLE_COLOR_FRAMES,
} from "./cycle";

// The gallery and the A/B comparison each have their own composition.
export const TasteBloomPresentation = () => (
  <>
    <Sequence durationInFrames={210} name="01 · Avatars 01–09" layout="none">
      <TasteBloomGallery batchIndex={0} />
    </Sequence>
    <Sequence
      from={210}
      durationInFrames={210}
      name="02 · Avatars 10–18"
      layout="none"
    >
      <TasteBloomGallery batchIndex={1} />
    </Sequence>
    <Sequence
      from={420}
      durationInFrames={210}
      name="03 · Avatars 19–27"
      layout="none"
    >
      <TasteBloomGallery batchIndex={2} />
    </Sequence>
    <Sequence
      from={630}
      durationInFrames={210}
      name="04 · Avatars 28–36"
      layout="none"
    >
      <TasteBloomGallery batchIndex={3} />
    </Sequence>
  </>
);

export const TasteBloomComparison = () => (
  <>
    <Sequence
      durationInFrames={BLOOM_OVERVIEW_FRAMES}
      name="A · Overlapping Color Waves"
      layout="none"
    >
      <TasteBloomOverview paletteMode="individual" waveMode="overlap" />
    </Sequence>
    <Sequence
      from={BLOOM_OVERVIEW_FRAMES}
      durationInFrames={BLOOM_OVERVIEW_SINGLE_COLOR_FRAMES}
      name="B · One Color Wave at a Time"
      layout="none"
    >
      <TasteBloomOverview paletteMode="wave" waveMode="single-color" />
    </Sequence>
  </>
);
