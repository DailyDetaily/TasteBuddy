import {CanvasImage, getRemotionEnvironment, staticFile} from 'remotion';
import {nativeCapture} from '../generated/native-ui';

export type NativeScreenName = 'dining' | 'feedback' | 'analysis';
export const NativeScreen: React.FC<{screen: NativeScreenName}> = ({screen}) => {
  const capture = nativeCapture.screens[screen];
  const fresh = nativeCapture.status === 'ready' && nativeCapture.capturedSourceHash === nativeCapture.currentSourceHash;
  if (getRemotionEnvironment().isRendering && (!fresh || !capture.src)) {
    throw new Error('iOS 캡처가 최신 상태가 아닙니다. npm run native:capture를 실행한 뒤 다시 내보내세요.');
  }
  return (
    <div style={{width: '100%', height: '100%', position: 'relative', background: '#FFFFFF', overflow: 'hidden'}}>
      {capture.src ? <CanvasImage name={screen === 'dining' ? '실제 SwiftUI 식사 기록 화면' : '실제 SwiftUI 취향 분석 화면'} src={staticFile(capture.src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}} /> : (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 50, fontFamily: 'Pretendard', fontSize: 34, color: '#666666', lineHeight: 1.6, textAlign: 'center'}}>실제 iOS 화면을<br />준비하고 있습니다.</div>
      )}
      {!fresh && <div style={{position: 'absolute', left: 18, right: 18, top: 150, padding: '20px 24px', background: '#0F0F0F', color: 'white', borderRadius: 12, fontSize: 25, lineHeight: 1.4}}>{nativeCapture.message || '앱 화면 갱신 대기 중'}{capture.src ? ' · 이전 캡처' : ''}</div>}
    </div>
  );
};
