import React from "react";
import { AbsoluteFill } from "remotion";
import { GridScene } from "./GridLayer";
import { DynamicLayers } from "./DynamicLayers";

export const LogoGridDynamic: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <GridScene variant="dynamic">
      <DynamicLayers />
    </GridScene>
  </AbsoluteFill>
);
