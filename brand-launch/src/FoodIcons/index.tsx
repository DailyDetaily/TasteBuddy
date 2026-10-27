import { Composition, Folder } from "remotion";
import { FoodIconGrid, FoodIconSingle } from "./Board";
import { FoodIconTransition } from "./Transition";
import { foodIconTransitionTiming } from "./transition-motion";
import {
  foodIconTransitionDefaults,
  foodIconTransitionSchema,
} from "./transition-settings";
import { foodIcons } from "./catalog";
import {
  FOOD_ICON_FPS,
  foodIconGridTiming,
  foodIconSingleTiming,
} from "./timing";
import {
  foodIconGridSchema,
  foodIconSingleSchema,
  gridDefaults,
  singleDefaults,
} from "./settings";

// The grid and individual previews have separate clocks; icons loop themselves.
const preview = {
  fps: FOOD_ICON_FPS,
  durationInFrames: foodIconGridTiming(1).durationInFrames,
};

export const FoodIconCompositions = () => (
  <Folder name="Food-Icons">
    <Composition
      id="FoodIcons-Grid"
      component={FoodIconGrid}
      schema={foodIconGridSchema}
      defaultProps={gridDefaults}
      calculateMetadata={({ props }) => ({
        durationInFrames: foodIconGridTiming(props["모션 속도"])
          .durationInFrames,
      })}
      width={1920}
      height={1280}
      {...preview}
    />
    <Composition
      id="FoodIcons-Transition"
      component={FoodIconTransition}
      schema={foodIconTransitionSchema}
      defaultProps={foodIconTransitionDefaults}
      calculateMetadata={({ props }) => ({
        durationInFrames: foodIconTransitionTiming(props).durationInFrames,
      })}
      width={1080}
      height={1080}
      fps={FOOD_ICON_FPS}
      durationInFrames={
        foodIconTransitionTiming(foodIconTransitionDefaults).durationInFrames
      }
    />
    <Folder name="Individual">
      {foodIcons.map((icon) => (
        <Composition
          key={icon.id}
          id={`FoodIcon-${icon.id.replace(/_/g, "-")}`}
          component={FoodIconSingle}
          schema={foodIconSingleSchema}
          defaultProps={{ ...singleDefaults, 아이콘: icon.label }}
          calculateMetadata={({ props }) => {
            const selected = foodIcons.find(
              ({ label }) => label === props.아이콘,
            );
            return {
              durationInFrames: foodIconSingleTiming(
                selected?.id ?? icon.id,
                props["모션 속도"],
              ).durationInFrames,
            };
          }}
          width={1080}
          height={1080}
          fps={FOOD_ICON_FPS}
          durationInFrames={foodIconSingleTiming(icon.id, 1).durationInFrames}
        />
      ))}
    </Folder>
  </Folder>
);
