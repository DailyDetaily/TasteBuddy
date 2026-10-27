import { useEffect, useRef } from 'react';
import { onboardingMotionFrame, onboardingPalette, reducedMotionTime, type NativeOnboardingMotionStyle } from './nativeOnboardingGeometry';

/** Decorative native onboarding motion. No account measurements or synthetic scores. */
export default function NativeOnboardingMotion({ style, size = 280, isActive = true }: {
  style: NativeOnboardingMotionStyle;
  size?: number;
  isActive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = 0, startedAt = performance.now(), lastPaint = -Infinity;
    const paint = (time: number) => {
      const side = canvas.getBoundingClientRect().width || size;
      const pixels = Math.max(1, Math.round(side * window.devicePixelRatio));
      if (canvas.width !== pixels || canvas.height !== pixels) { canvas.width = pixels; canvas.height = pixels; }
      context.setTransform(pixels / 640, 0, 0, pixels / 640, 0, 0);
      context.clearRect(0, 0, 640, 640);
      context.lineWidth = 4;
      context.lineCap = 'butt';
      const frame = onboardingMotionFrame(style, time);
      const gradient = context.createConicGradient(0, 320, 320);
      for (let index = 0; index <= 12; index++) gradient.addColorStop(index / 12, onboardingPalette[index % 6]);
      for (const stroke of frame.strokes) {
        if (stroke.opacity <= 0 || stroke.points.length === 0) continue;
        context.beginPath();
        context.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
        context.globalAlpha = stroke.opacity;
        context.strokeStyle = onboardingPalette[stroke.color];
        context.stroke();
        if (frame.gradientBlend > 0) { context.globalAlpha = stroke.opacity * frame.gradientBlend; context.strokeStyle = gradient; context.stroke(); }
      }
      for (const ring of frame.rings) {
        context.beginPath();
        context.arc(320, 320, ring.radius, 0, Math.PI * 2);
        context.globalAlpha = ring.opacity;
        context.strokeStyle = gradient;
        context.stroke();
      }
      context.globalAlpha = 1;
    };
    const tick = (timestamp: number) => {
      if (!isActive || document.hidden || motionPreference.matches) return;
      if (timestamp - lastPaint >= 1000 / 30) { paint((timestamp - startedAt) / 1000); lastPaint = timestamp; }
      animation = requestAnimationFrame(tick);
    };
    const restart = () => {
      cancelAnimationFrame(animation);
      startedAt = performance.now(); lastPaint = -Infinity;
      paint(motionPreference.matches ? reducedMotionTime(style) : 0);
      if (isActive && !document.hidden && !motionPreference.matches) animation = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(() => paint(motionPreference.matches ? reducedMotionTime(style) : (performance.now() - startedAt) / 1000));
    resize.observe(canvas);
    motionPreference.addEventListener('change', restart);
    document.addEventListener('visibilitychange', restart);
    restart();
    return () => { cancelAnimationFrame(animation); resize.disconnect(); motionPreference.removeEventListener('change', restart); document.removeEventListener('visibilitychange', restart); };
  }, [style, size, isActive]);
  return <canvas ref={canvasRef} width={size} height={size} data-native-motion={style} aria-hidden="true" style={{ display: 'block', width: size, maxWidth: '100%', height: 'auto', aspectRatio: '1 / 1' }} />;
}
