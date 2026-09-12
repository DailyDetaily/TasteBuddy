import {AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame} from 'remotion';

export const Palate: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill name="나다운 이유" style={{backgroundColor: '#F8F6F1', color: '#0F0F0F', fontFamily: 'Pretendard', overflow: 'hidden'}}>
    <CanvasImage name="같은 재료의 다른 감각" src={staticFile('images/second-food.png')} width={1080} height={1920} fit="cover" style={{position: 'absolute', left: 0, top: -120, width: 1080, height: 1920, scale: interpolate(frame, [0, 162], [1.03, 1.09], {extrapolateRight: 'clamp', output: 'perceptual-scale'}), translate: interpolate(frame, [0, 162], ['0px 120px', '0px 76px'], {extrapolateRight: 'clamp'})}} />
    <Interactive.Div name="주요 브랜드 약속 앞 문장" style={{position: 'absolute', top: 205, left: 90, fontSize: 100, letterSpacing: -4.6, fontWeight: 400, lineHeight: 1.23, opacity: interpolate(frame, [8, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), translate: interpolate(frame, [8, 42], ['0px 32px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>좋아하는 맛에는,</Interactive.Div>
    <Interactive.Div name="주요 브랜드 약속 뒷 문장" style={{position: 'absolute', top: 330, left: 90, fontSize: 100, letterSpacing: -4.6, fontWeight: 600, lineHeight: 1.23, opacity: interpolate(frame, [38, 61], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), translate: interpolate(frame, [38, 78], ['0px 32px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>나다운 이유가 있다.</Interactive.Div>
    <Interactive.Div name="취향의 주체" style={{position: 'absolute', left: 94, top: 550, fontSize: 44, color: '#666666', letterSpacing: -1.3, opacity: interpolate(frame, [70, 95], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>서로 다른, 나만의 취향.</Interactive.Div>
  </AbsoluteFill>;
};
