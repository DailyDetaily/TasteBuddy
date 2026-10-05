import React from "react";
import { AbsoluteFill, CanvasImage, Sequence, staticFile } from "remotion";
import { GridLayer, GridScene } from "./GridLayer";
import {
  getBlackSymbolOffset,
  getBlackWordmarkFillProgress,
} from "./blackMotion";

// Reuse the original logo's timing and geometry with only three editable logo
// layers. No construction circles, lines, dimensions or numbers are mounted.
export const LogoBlack: React.FC<{
  backgroundColor?: string;
  backgroundImage?: string | null;
}> = ({
  backgroundColor = "#FFFFFF",
  backgroundImage = "images/kinetic-statements/fine-dining-topview-padded.png",
}) => (
  <AbsoluteFill style={{ backgroundColor }}>
    {backgroundImage ? (
      <Sequence name="00 · 디시 배경 · 16:9" durationInFrames={300}>
        <CanvasImage
          name="파인다이닝 탑뷰 배경"
          src={staticFile(backgroundImage)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
          }}
        />
      </Sequence>
    ) : null}
    <GridScene
      variant="classic"
      showConstruction={false}
      logoColor="#000000"
      symbolOffset={getBlackSymbolOffset}
      wordmarkFillProgress={getBlackWordmarkFillProgress}
    >
      <Sequence name="01 · 로고타입" durationInFrames={300} layout="none">
        <GridLayer
          elementIndices={[2, 3, 4, 5, 6]}
          name="Taste · 블랙"
          from={43}
          durationInFrames={186}
        />
        <GridLayer
          elementIndices={[7, 8, 9, 10, 11]}
          name="Buddy · 블랙"
          from={51}
          durationInFrames={178}
        />
      </Sequence>
      <Sequence name="02 · 심볼 · 최하단" durationInFrames={300} layout="none">
        <GridLayer
          elementIndices={[17, 18, 19, 20, 21, 22]}
          name="심볼 · 여섯 꽃잎 · 블랙"
          from={18}
          durationInFrames={240}
        />
      </Sequence>
    </GridScene>
  </AbsoluteFill>
);
