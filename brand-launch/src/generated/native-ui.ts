// native-ui.mjs가 생성합니다. 앱 UI는 iOS SwiftUI에서 캡처합니다.
export interface NativeScreenCapture { src: string; width: number; height: number; }
export interface NativeCapture {
  status: 'ready' | 'building' | 'error' | 'stale';
  revision: string; capturedSourceHash: string; currentSourceHash: string; capturedAt: string; message: string;
  screens: { dining: NativeScreenCapture; feedback: NativeScreenCapture; analysis: NativeScreenCapture; };
}
export const nativeCapture: NativeCapture = {
  "status": "ready",
  "revision": "d94d20920dea-1788936245857-f97592f5",
  "capturedSourceHash": "d94d20920dead261cf576c7f1c8ea3ff3922aeeefc4f587d73ca2e794f2e5b82",
  "currentSourceHash": "d94d20920dead261cf576c7f1c8ea3ff3922aeeefc4f587d73ca2e794f2e5b82",
  "capturedAt": "2026-09-09T06:44:05.857Z",
  "message": "현재 iOS SwiftUI 소스로 앱 화면을 갱신했어요.",
  "screens": {
    "dining": {
      "src": "native/d94d20920dea-1788936245857-f97592f5-dining.png",
      "width": 1206,
      "height": 2622
    },
    "feedback": {
      "src": "native/d94d20920dea-1788936245857-f97592f5-feedback.png",
      "width": 1206,
      "height": 2622
    },
    "analysis": {
      "src": "native/d94d20920dea-1788936245857-f97592f5-analysis.png",
      "width": 1206,
      "height": 2622
    }
  }
};
