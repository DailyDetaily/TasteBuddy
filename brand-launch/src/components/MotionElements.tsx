import { CanvasImage, staticFile } from "remotion";
import { symbolPaths } from "../generated/brand";
import { NativeScreen, NativeScreenName } from "./NativeScreen";
export const BrandSymbol: React.FC<{ color?: string }> = ({
  color = "#0F0F0F",
}) => (
  <svg width="100%" height="100%" viewBox="0 0 64 72" fill={color}>
    {symbolPaths.map((d, i) => (
      <path key={i} d={d} />
    ))}
  </svg>
);
export const LogoConstruction: React.FC<{ progress?: number }> = ({
  progress = 1,
}) => (
  <svg width="100%" height="100%" viewBox="0 0 800 800" fill="none">
    <g
      stroke="#D5D5D5"
      strokeWidth="1.25"
      strokeDasharray="1"
      strokeDashoffset={1 - progress}
    >
      <circle cx="400" cy="400" r="305" pathLength="1" />
      <circle cx="400" cy="400" r="218" pathLength="1" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <g key={a} transform={`rotate(${a} 400 400)`}>
          <circle cx="400" cy="182" r="87" pathLength="1" />
          <line x1="400" y1="28" x2="400" y2="772" pathLength="1" />
        </g>
      ))}
    </g>
  </svg>
);
export const Phone: React.FC<{ screen: NativeScreenName }> = ({ screen }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      padding: 10,
      background: "#FFFFFF",
      border: "2px solid #E1E1E1",
      borderRadius: 66,
      boxShadow: "0 24px 70px rgba(15,15,15,0.09)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 55,
        overflow: "hidden",
      }}
    >
      <NativeScreen screen={screen} />
    </div>
  </div>
);
// 같은 원본 캡처를 확대하므로 세부 화면도 SwiftUI 변경을 따라갑니다.
export const NativeDetail: React.FC<{
  screen: NativeScreenName;
  y: number;
}> = ({ screen, y }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      overflow: "hidden",
      position: "relative",
      background: "#FFFFFF",
    }}
  >
    <div
      style={{
        position: "absolute",
        width: "100%",
        aspectRatio: "1260 / 2736",
        top: y,
        left: 0,
      }}
    >
      <NativeScreen screen={screen} />
    </div>
  </div>
);
export const Food: React.FC = () => (
  <CanvasImage
    name="영상용 식사 사진"
    src={staticFile("images/hero-food.png")}
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
);
export const BrandCorner: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 112,
      top: 72,
      display: "flex",
      alignItems: "center",
      gap: 18,
    }}
  >
    <div style={{ width: 27, height: 31 }}>
      <BrandSymbol />
    </div>
    <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.6 }}>
      Taste Buddy
    </span>
  </div>
);
