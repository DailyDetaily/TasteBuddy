import "./index.css";
import { TasteMotionCompositions } from "./TasteMotion";
import { Composition, Folder } from "remotion";
import { BrandLaunch } from "./BrandLaunch";
import { Opening } from "./scenes/Opening";
import { Feedback } from "./scenes/Feedback";
import { Connection } from "./scenes/Connection";
import { Record } from "./scenes/Record";
import { Insight } from "./scenes/Insight";
import { Signature } from "./scenes/Signature";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <TasteMotionCompositions />
      <Composition
        id="TasteBuddyLaunch"
        component={BrandLaunch}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition
          id="Opening"
          component={Opening}
          durationInFrames={102}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Record"
          component={Record}
          durationInFrames={162}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Feedback"
          component={Feedback}
          durationInFrames={192}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Insight"
          component={Insight}
          durationInFrames={252}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Connection"
          component={Connection}
          durationInFrames={162}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Signature"
          component={Signature}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
