import { AbsoluteFill, Composition, Folder, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

const dishes = [20, 19, 18, 16, 15, 12];
const schema = z.object({ holdSeconds: z.number().min(1).max(8), dissolveSeconds: z.number().min(0.1).max(1) });
type Props = z.infer<typeof schema>;
const defaults: Props = { holdSeconds: 2.55, dissolveSeconds: 0.45 };

export const DishTopviews = ({ holdSeconds, dissolveSeconds }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hold = Math.round(holdSeconds * fps);
  const fade = Math.max(2, Math.round(dissolveSeconds * fps));
  const segment = hold + fade;
  const index = Math.floor(frame / segment) % dishes.length;
  const local = frame % segment;
  const opacity = interpolate(local, [hold, segment - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <Img src={staticFile(`brand/dish-topviews/dish-${dishes[index]}.png`)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    <AbsoluteFill style={{ opacity }}><Img src={staticFile(`brand/dish-topviews/dish-${dishes[(index + 1) % dishes.length]}.png`)} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></AbsoluteFill>
  </AbsoluteFill>;
};

export const DishTopviewCompositions = () => <Folder name="Food-Imagery">
  <Composition id="DishTopviews-Sequence" component={DishTopviews} schema={schema} defaultProps={defaults} width={1080} height={1080} fps={30} durationInFrames={546}
    calculateMetadata={({ props }) => ({ durationInFrames: dishes.length * (Math.round(props.holdSeconds * 30) + Math.round(props.dissolveSeconds * 30)) })} />
</Folder>;
