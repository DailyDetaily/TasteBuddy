import { Composition, Folder } from "remotion";
import { TasteBubbleMap } from "./TasteBubbleMap";
import { BUBBLE_FPS, bubbleMapDuration } from "./motion";
import {
  bubbleMapDefaults,
  bubbleMapSchema,
  type BubbleMapProps,
} from "./settings";

const variants: { id: string; mode: BubbleMapProps["재생"] }[] = [
  { id: "TasteBubbleMap", mode: "전체 흐름" },
  { id: "TasteBubbleMap-Idle", mode: "대기 루프" },
  { id: "TasteBubbleMap-Reduced", mode: "모션 줄이기" },
];
export const TasteBubbleMapCompositions = () => (
  <Folder name="TasteBubbleMapMotion">
    {variants.map(({ id, mode }) => {
      const props = { ...bubbleMapDefaults, 재생: mode };
      return (
        <Composition
          key={id}
          id={id}
          component={TasteBubbleMap}
          schema={bubbleMapSchema}
          width={1080}
          height={1080}
          fps={BUBBLE_FPS}
          durationInFrames={bubbleMapDuration(props)}
          defaultProps={props}
          calculateMetadata={({ props: current }) => ({
            durationInFrames: bubbleMapDuration(current),
          })}
        />
      );
    })}
  </Folder>
);
