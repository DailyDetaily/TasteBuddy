import React, { createContext, useContext, useRef } from "react";
import {
  Interactive,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  type InteractiveBaseProps,
  type SequenceControls,
} from "remotion";
import { logoGridElements, type LogoGridElement } from "./geometry";
import { ClassicElementArtwork } from "./ClassicElementArtwork";
import { DynamicElementArtwork } from "./DynamicElementArtwork";
import {
  getGridLayerWindow,
  gridLayerZIndex,
  type GridVariant,
} from "./layerTiming";

type Scene = {
  variant: GridVariant;
  animate: boolean;
  showConstruction: boolean;
  logoColor?: string;
  symbolOffset?: (frame: number) => { x: number; y: number };
  wordmarkFillProgress?: (frame: number, index: number) => number;
  outputScale: number;
  cameraFrame: number;
};
const SceneContext = createContext<Scene | null>(null);
export const useGridScene = () => {
  const scene = useContext(SceneContext);
  if (!scene) throw new Error("Grid artwork requires GridScene");
  return scene;
};
export const GridScene: React.FC<{
  variant: GridVariant;
  animate?: boolean;
  showConstruction?: boolean;
  logoColor?: string;
  symbolOffset?: Scene["symbolOffset"];
  wordmarkFillProgress?: Scene["wordmarkFillProgress"];
  outputScale?: number;
  children: React.ReactNode;
}> = ({
  variant,
  animate = true,
  showConstruction = true,
  logoColor,
  symbolOffset,
  wordmarkFillProgress,
  outputScale,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  return (
    <SceneContext.Provider
      value={{
        variant,
        animate,
        showConstruction,
        logoColor,
        symbolOffset,
        wordmarkFillProgress,
        outputScale: outputScale ?? width / 1920,
        cameraFrame: animate ? (frame * 30) / fps : 120,
      }}
    >
      {/* Isolate the complete artwork so the negative symbol plane stays above
          the composition background and below every construction overlay. */}
      <div
        data-grid-scene={variant}
        style={{ position: "absolute", inset: 0, isolation: "isolate" }}
      >
        {children}
      </div>
    </SceneContext.Provider>
  );
};

export type GridArtworkProps = {
  nodes: LogoGridElement[];
  frame: number;
  cameraFrame: number;
  outputScale: number;
  logoColor?: string;
  wordmarkFillProgress?: Scene["wordmarkFillProgress"];
  outlineRef: React.RefObject<SVGGraphicsElement | null>;
};
const LayerArtwork: React.FC<{
  indices: number[];
  scene: Scene;
  outlineRef: GridArtworkProps["outlineRef"];
}> = ({ indices, scene, outlineRef }) => {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sourceFrom = Math.min(
    ...indices.map((index) => getGridLayerWindow(index, scene.variant).from),
  );
  const Artwork =
    scene.variant === "classic" ? ClassicElementArtwork : DynamicElementArtwork;
  const sourceFrame = scene.animate
    ? (localFrame * 30) / fps + sourceFrom
    : 120;
  const isSymbol = indices.every(
    (index) => logoGridElements[index].role === "logo.symbol",
  );
  const symbolOffset = isSymbol ? scene.symbolOffset?.(sourceFrame) : undefined;
  return (
    <div
      data-grid-element-indices={indices.join(",")}
      data-grid-role={isSymbol ? "logo.symbol" : "artwork"}
      data-symbol-offset-x={symbolOffset?.x}
      data-symbol-offset-y={symbolOffset?.y}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: Math.max(...indices.map(gridLayerZIndex)),
        isolation: "isolate",
        transformStyle: "flat",
        transform:
          symbolOffset && (symbolOffset.x !== 0 || symbolOffset.y !== 0)
            ? `translate(${symbolOffset.x * scene.outputScale}px, ${symbolOffset.y * scene.outputScale}px)`
            : undefined,
      }}
    >
      <Artwork
        nodes={indices.map((index) => {
          const node = logoGridElements[index];
          return scene.logoColor && node.role.startsWith("logo.")
            ? { ...node, props: { ...node.props, fill: scene.logoColor } }
            : node;
        })}
        frame={sourceFrame}
        cameraFrame={scene.cameraFrame}
        outputScale={scene.outputScale}
        logoColor={scene.logoColor}
        wordmarkFillProgress={scene.wordmarkFillProgress}
        outlineRef={outlineRef}
      />
    </div>
  );
};

type Props = InteractiveBaseProps & { elementIndices: number[] };
const LayerInner: React.FC<Props & { controls?: SequenceControls }> = (
  props,
) => {
  const scene = useGridScene();
  const outlineRef = useRef<SVGGraphicsElement | null>(null);
  const construction = props.elementIndices.every((index) =>
    logoGridElements[index].role.startsWith("guide."),
  );
  return (
    <Sequence
      from={scene.animate ? props.from : 0}
      durationInFrames={scene.animate ? props.durationInFrames : 300}
      name={props.name}
      hidden={props.hidden || (construction && !scene.showConstruction)}
      showInTimeline={props.showInTimeline}
      trimBefore={props.trimBefore}
      freeze={props.freeze}
      controls={props.controls}
      outlineRef={outlineRef}
      layout="none"
    >
      <LayerArtwork
        indices={props.elementIndices}
        scene={scene}
        outlineRef={outlineRef}
      />
    </Sequence>
  );
};

// Each use has its own JSX source node so Studio can independently select,
// move, trim, freeze, and hide a functional group, with edits saved to that source node.
export const GridLayer = Interactive.withSchema({
  Component: LayerInner,
  componentName: "로고 그리드 요소",
  componentIdentity: null,
  supportsEffects: false,
  schema: { ...Interactive.baseSchema },
});
