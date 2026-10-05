import { CategoryGallery } from "./Gallery";
import { Composition, Folder } from "remotion";
import { CategoryHeaderMotion } from "./CategoryHeaderMotion";
import {
  TasteCategoryCollection,
  TASTE_CATEGORY_COLLECTION_DURATION,
} from "./TasteCategoryCollection";
import { CategoryPreview, type PreviewProps } from "./Preview";
import { categoryPlaybackDuration } from "./geometry";
import { categories } from "./types";
import type { Category, Playback, Scenario } from "./types";
const variants: { suffix: string; playback: Playback; scenario: Scenario }[] = [
  { suffix: "", playback: "intro", scenario: "standard" },
  { suffix: "idle", playback: "idle", scenario: "standard" },
  { suffix: "reduced", playback: "reduced", scenario: "standard" },
  { suffix: "empty", playback: "idle", scenario: "empty" },
  { suffix: "dense", playback: "intro", scenario: "dense" },
  { suffix: "unanswered", playback: "idle", scenario: "unanswered" },
  { suffix: "held", playback: "idle", scenario: "held" },
  { suffix: "zero", playback: "intro", scenario: "zero" },
];

const headerCompositions: {
  id: string;
  name: string;
  category: Category;
}[] = [
  { id: "TasteCategory-Experience", name: "01-Experience", category: "experienceCluster" },
  { id: "TasteCategory-Sensation", name: "02-Sensation", category: "sensoryRays" },
  { id: "TasteCategory-Preference", name: "03-Preference", category: "preferenceFocus" },
  { id: "TasteCategory-Context", name: "04-Context", category: "contextLayers" },
  { id: "TasteCategory-Change", name: "05-Change", category: "changeRipples" },
];

export const TasteDataCategoryCompositions = () => (
  <Folder name="TasteDataCategoryMotion">
    <Folder name="Category-Headers">
      <Composition
        id="TasteCategory-Collection"
        component={TasteCategoryCollection}
        durationInFrames={TASTE_CATEGORY_COLLECTION_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {headerCompositions.map(({ id, name, category }) => (
        <Folder key={id} name={name}>
          <Composition
            id={id}
            component={CategoryHeaderMotion}
            durationInFrames={360}
            fps={30}
            width={1080}
            height={1080}
            defaultProps={{
              category,
              scenario: "standard",
              mode: "liking",
              domain: "taste",
              backgroundColor: "#F3F3F3",
            }}
          />
        </Folder>
      ))}
    </Folder>
    <Composition
      id="TasteData-all"
      component={CategoryGallery}
      durationInFrames={1992}
      fps={30}
      width={1000}
      height={824}
    />
    {categories.map((category) => (
      <Folder key={category} name={category}>
        {[
          ...variants,
          ...(category === "changeRipples"
            ? (["decrease", "equal", "unlinked"] as Scenario[]).map(
                (scenario) => ({
                  suffix: scenario,
                  playback: "intro" as Playback,
                  scenario,
                }),
              )
            : []),
          ...(category === "preferenceFocus"
            ? [
                {
                  suffix: "small",
                  playback: "intro" as Playback,
                  scenario: "small" as Scenario,
                },
                {
                  suffix: "all-negative",
                  playback: "intro" as Playback,
                  scenario: "decrease" as Scenario,
                },
              ]
            : []),
          ...(category === "contextLayers"
            ? [
                {
                  suffix: "single",
                  playback: "intro" as Playback,
                  scenario: "single" as Scenario,
                },
              ]
            : []),
          ...(category === "experienceCluster"
            ? [
                {
                  suffix: "added",
                  playback: "intro" as Playback,
                  scenario: "added" as Scenario,
                },
              ]
            : []),
        ].map((v) => (
          <Composition
            key={v.suffix}
            id={"TasteData-" + category + (v.suffix ? "-" + v.suffix : "")}
            component={CategoryPreview}
            durationInFrames={Math.round(
              categoryPlaybackDuration(
                category,
                v.playback,
              ) * 30,
            )}
            fps={30}
            width={1000}
            height={720}
            defaultProps={
              {
                category,
                playback: v.playback,
                scenario: v.scenario,
              } satisfies PreviewProps
            }
          />
        ))}
      </Folder>
    ))}
  </Folder>
);
