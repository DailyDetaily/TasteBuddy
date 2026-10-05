import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Local Kalice Regular file; loadFont also waits for it during Remotion renders.
export const kaliceReady = loadFont({
  family: "Kalice",
  url: staticFile("fonts/Kalice-Trial-Regular.otf"),
  weight: "400",
});
