import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { GridScene } from "./GridLayer";
import { ClassicLayers } from "./ClassicLayers";

export type LogoGridProps = { showConstruction: boolean; animate: boolean };
export const LogoGridArtwork: React.FC<
  LogoGridProps & { outputScale?: number }
> = (props) => (
  <GridScene variant="classic" {...props}>
    <ClassicLayers />
  </GridScene>
);

export const LogoGrid: React.FC<LogoGridProps> = (props) => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <LogoGridArtwork {...props} />
  </AbsoluteFill>
);

export const LogoGridReference: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <OffthreadVideo
      src={staticFile("brand/logo-grid/reference-hd.mp4")}
      muted
      style={{ width: "100%", height: "100%" }}
    />
  </AbsoluteFill>
);

export const LogoGridCompare: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ backgroundColor: "#F4F4F2", fontFamily: "Arial, sans-serif" }}
    >
      <div
        style={{
          position: "absolute",
          left: 48,
          top: 48,
          fontSize: 24,
          color: "#343434",
        }}
      >
        SVG RECONSTRUCTION
      </div>
      <div
        style={{
          position: "absolute",
          left: 1008,
          top: 48,
          fontSize: 24,
          color: "#343434",
        }}
      >
        SUPPLIED MP4 / REFERENCE
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 240,
          width: 960,
          height: 540,
          backgroundColor: "white",
        }}
      >
        <LogoGridArtwork showConstruction animate outputScale={0.5} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 240,
          width: 960,
          height: 540,
        }}
      >
        <LogoGridReference />
      </div>
      <div
        style={{
          position: "absolute",
          left: 48,
          bottom: 64,
          fontSize: 20,
          color: "#666666",
        }}
      >
        {(frame / 30).toFixed(2)}s · frame {String(frame).padStart(3, "0")} /
        299
      </div>
    </AbsoluteFill>
  );
};
