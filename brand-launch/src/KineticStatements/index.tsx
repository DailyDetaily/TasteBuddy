import { Composition, Folder } from "remotion";
import { KineticStatements } from "./KineticStatements";
import { KINETIC_FPS, kineticTiming } from "./motion";
import { kineticStatementsDefaults, kineticStatementsSchema } from "./settings";

export const KineticStatementsCompositions = () => (
  <Folder name="Kinetic-Statements">
    {[
      { id: "Kinetic-Statements", width: 1920, height: 1080 },
      { id: "Kinetic-Statements-Square", width: 1080, height: 1080 },
      { id: "Kinetic-Statements-Portrait", width: 1080, height: 1920 },
    ].map((format) => (
      <Composition
        key={format.id}
        {...format}
        component={KineticStatements}
        schema={kineticStatementsSchema}
        defaultProps={kineticStatementsDefaults}
        fps={KINETIC_FPS}
        durationInFrames={
          kineticTiming(kineticStatementsDefaults).durationInFrames
        }
        calculateMetadata={({ props }) => ({
          durationInFrames: kineticTiming(props).durationInFrames,
        })}
      />
    ))}
  </Folder>
);
