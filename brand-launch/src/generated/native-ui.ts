// native-ui.mjs가 생성합니다. 앱 UI는 iOS SwiftUI에서 캡처합니다.
export interface NativeScreenCapture { src: string; width: number; height: number; }
export interface NativeCapture {
  status: 'ready' | 'building' | 'error' | 'stale';
  revision: string; capturedSourceHash: string; currentSourceHash: string; capturedAt: string; message: string;
  screens: { dining: NativeScreenCapture; feedback: NativeScreenCapture; analysis: NativeScreenCapture; };
}
export const nativeCapture: NativeCapture = {
  "status": "ready",
  "revision": "7483ccf47a31-1789917783044-68455f9c",
  "capturedSourceHash": "7483ccf47a31cf68f30fe50e64f00a277770a6110c1c35032a73bca80f247fea",
  "currentSourceHash": "7483ccf47a31cf68f30fe50e64f00a277770a6110c1c35032a73bca80f247fea",
  "capturedAt": "2026-09-20T15:23:03.043Z",
  "message": "현재 iOS SwiftUI 소스로 앱 화면을 갱신했어요.",
  "screens": {
    "dining": {
      "src": "native/7483ccf47a31-1789917783044-68455f9c-dining.png",
      "width": 1206,
      "height": 2622
    },
    "feedback": {
      "src": "native/7483ccf47a31-1789917783044-68455f9c-feedback.png",
      "width": 1206,
      "height": 2622
    },
    "analysis": {
      "src": "native/7483ccf47a31-1789917783044-68455f9c-analysis.png",
      "width": 1206,
      "height": 2622
    }
  }
};
