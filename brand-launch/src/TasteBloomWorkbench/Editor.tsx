import { useState } from "react";
import { WorkbenchView } from "./WorkbenchView";
import { defaultProfile, playgroundShape, type BloomShape } from "./settings";
export const BloomEditor = () => {
  const [profile, setProfile] = useState(defaultProfile);
  const [shape, setShape] = useState<BloomShape>(playgroundShape);
  const [shapeCount, setShapeCount] = useState<number>(
    playgroundShape.shapeCountOverride,
  );
  return (
    <WorkbenchView
      profile={profile}
      shape={shape}
      shapeCount={shapeCount}
      onShapeCountChange={setShapeCount}
      onChange={(taste, value) =>
        setProfile((current) => ({ ...current, [taste]: value }))
      }
      onShapeChange={setShape}
      onReset={() => {
        setProfile(defaultProfile);
        setShape(playgroundShape);
        setShapeCount(playgroundShape.shapeCountOverride);
      }}
    />
  );
};
