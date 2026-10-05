import { useCurrentFrame } from "remotion";
import "../fonts";
import "../TasteBloomAvatars/fonts";
import { WorkbenchView } from "./WorkbenchView";
import { demoAt, demoCursorAt } from "./demo-motion";
export const BloomControlsDemo = () => {
  const frame = useCurrentFrame();
  const scene = demoAt(frame);
  return (
    <WorkbenchView
      profile={scene.profile}
      shape={scene.shape}
      shapeCount={scene.shapeCount}
      demo
      focus={scene.focus}
      cursor={demoCursorAt(frame)}
    />
  );
};
