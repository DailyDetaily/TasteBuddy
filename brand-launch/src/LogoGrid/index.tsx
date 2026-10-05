import { Composition, Folder } from "remotion";
import { LogoGrid, LogoGridCompare, LogoGridReference } from "./LogoGrid";
import { LogoBlack } from "./LogoBlack";

export const LogoGridCompositions: React.FC = () => (
  <Folder name="Logo-Grid">
    <Folder name="01-Original">
      <Composition
        id="LogoGrid"
        component={LogoGrid}
        width={3840}
        height={2160}
        fps={30}
        durationInFrames={300}
        defaultProps={{ showConstruction: true, animate: true }}
      />
      <Composition
        id="LogoGrid-HD"
        component={LogoGrid}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
        defaultProps={{ showConstruction: true, animate: true }}
      />
      <Composition
        id="LogoGrid-Compare"
        component={LogoGridCompare}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
      />
      <Composition
        id="LogoGrid-Reference"
        component={LogoGridReference}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
      />
    </Folder>
    <Folder name="02-Black">
      <Composition
        id="Logo-Black"
        component={LogoBlack}
        width={3840}
        height={2160}
        fps={30}
        durationInFrames={300}
      />
      <Composition
        id="Logo-Black-HD"
        component={LogoBlack}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
      />
    </Folder>
  </Folder>
);
