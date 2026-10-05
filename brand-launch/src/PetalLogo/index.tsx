import { Composition, Folder } from "remotion";
import { PetalLogo } from "./PetalLogo";
import { PETAL_DURATION, PETAL_FPS } from "./motion";
import { petalSchema } from "./settings";

export const PetalLogoCompositions: React.FC = () => (
  <Folder name="Petal-Logo">
    <Composition
      id="TasteBuddy-Petal-Shorts"
      component={PetalLogo}
      width={1080}
      height={1920}
      fps={PETAL_FPS}
      durationInFrames={PETAL_DURATION}
      schema={petalSchema}
      calculateMetadata={({ props }) => ({
        durationInFrames: props["영상 길이"],
      })}
      defaultProps={{
        backgroundColor: "#FFFFFF",
        symbolColor: "#0F0F0F",
        "심볼 배율": 0.53,
        "중앙 여백 비율": 0.25,
        "영상 길이": 496,
      }}
    />
  </Folder>
);
