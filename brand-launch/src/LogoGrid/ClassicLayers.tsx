import React from "react";
import { Sequence } from "remotion";
import { GridLayer } from "./GridLayer";
import { SerifGuideLayer } from "./SerifGuideLayer";

// Functional groups, with explicit source nodes for independent Studio editing.
// Circle labels move with their circle. Symbol stays beneath all other artwork.
export const ClassicLayers: React.FC = () => (
  <>
    <Sequence name="03 · 작도 원" durationInFrames={300} layout="none">
      <SerifGuideLayer
        elementIndices={[1, 52, 53, 54]}
        name="로고타입 · 세리프 원 가이드"
        from={43}
        durationInFrames={229}
      />
      <GridLayer
        elementIndices={[35, 49]}
        name="중앙 12원·숫자"
        from={0}
        durationInFrames={276}
      />
      <GridLayer
        elementIndices={[24, 50]}
        name="위쪽 6원·숫자"
        from={8}
        durationInFrames={268}
      />
      <GridLayer
        elementIndices={[44, 48]}
        name="14원·숫자"
        from={16}
        durationInFrames={260}
      />
      <GridLayer
        elementIndices={[45, 47]}
        name="28원·숫자"
        from={24}
        durationInFrames={252}
      />
      <GridLayer
        elementIndices={[25, 46]}
        name="38원·숫자"
        from={32}
        durationInFrames={244}
      />
      <GridLayer
        elementIndices={[23, 80]}
        name="아래쪽 6원·숫자"
        from={48}
        durationInFrames={228}
      />
      <GridLayer
        elementIndices={[26, 27, 28, 36, 37, 38, 39, 40, 41, 42, 43]}
        name="둘레 작도 원"
        from={37}
        durationInFrames={223}
      />
      <GridLayer
        elementIndices={[29, 30, 31, 32, 33, 34]}
        name="바깥 모서리 원"
        from={30}
        durationInFrames={242}
      />
      <GridLayer
        elementIndices={[72]}
        name="연결 간격 원"
        from={30}
        durationInFrames={242}
      />
    </Sequence>
    <Sequence name="04 · 로고타입" durationInFrames={300} layout="none">
      <GridLayer
        elementIndices={[2, 3, 4, 5, 6]}
        name="Taste"
        from={43}
        durationInFrames={186}
      />
      <GridLayer
        elementIndices={[7, 8, 9, 10, 11]}
        name="Buddy"
        from={51}
        durationInFrames={178}
      />
    </Sequence>
    <Sequence name="01 · 치수·주석" durationInFrames={300} layout="none">
      <GridLayer
        elementIndices={[55, 74, 75, 76]}
        name="심볼 하단 치수"
        from={31}
        durationInFrames={239}
      />
      <GridLayer
        elementIndices={[56, 77, 78, 79]}
        name="로고타입 하단 치수"
        from={31}
        durationInFrames={239}
      />
      <GridLayer
        elementIndices={[12, 13, 14, 15, 81, 82, 83, 85]}
        name="여백 치수·숫자"
        from={31}
        durationInFrames={239}
      />
      <GridLayer
        elementIndices={[0, 16]}
        name="로고타입 보조 원·숫자"
        from={30}
        durationInFrames={242}
      />
    </Sequence>
    <Sequence name="02 · 가이드선" durationInFrames={300} layout="none">
      <GridLayer
        elementIndices={[57, 58, 59, 60]}
        name="공통 수평 기준선"
        from={24}
        durationInFrames={248}
      />
      <GridLayer
        elementIndices={[63, 64, 65, 66]}
        name="심볼 세로 기준선"
        from={24}
        durationInFrames={248}
      />
      <GridLayer
        elementIndices={[61, 62]}
        name="심볼·로고타입 연결선"
        from={24}
        durationInFrames={248}
      />
      <GridLayer
        elementIndices={[67, 68, 69, 70]}
        name="로고타입 높이 기준선"
        from={24}
        durationInFrames={248}
      />
      <GridLayer
        elementIndices={[71, 84]}
        name="로고타입 우측 기준선"
        from={24}
        durationInFrames={248}
      />
    </Sequence>

    <Sequence name="05 · 심볼 · 최하단" durationInFrames={300} layout="none">
      <GridLayer
        elementIndices={[17, 18, 19, 20, 21, 22]}
        name="심볼 · 여섯 꽃잎"
        from={18}
        durationInFrames={240}
      />
    </Sequence>
  </>
);
