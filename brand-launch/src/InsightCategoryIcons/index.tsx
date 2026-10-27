import { Composition, Folder } from "remotion";
import { CategoryIconTransition } from "./Transition";
import { CATEGORY_ICON_FPS, categoryIconTransitionTiming } from "./motion";
import {
  categoryIconTransitionDefaults,
  categoryIconTransitionSchema,
} from "./settings";

export const InsightCategoryIconCompositions = () => (
  <Folder name="InsightCategoryIcons">
    <Composition
      id="InsightCategoryIcons-Transition"
      component={CategoryIconTransition}
      schema={categoryIconTransitionSchema}
      defaultProps={categoryIconTransitionDefaults}
      calculateMetadata={({ props }) => ({
        durationInFrames: categoryIconTransitionTiming(props).durationInFrames,
      })}
      width={1080}
      height={1080}
      fps={CATEGORY_ICON_FPS}
      durationInFrames={
        categoryIconTransitionTiming(categoryIconTransitionDefaults)
          .durationInFrames
      }
    />
  </Folder>
);
