import { useCallback, useEffect, useId, useRef, useState } from 'react';
import vector from './splashLogoVector.json';
import { clampSplashProgress, splashEase, splashPetalMatrix } from './splashLogoMotion';

interface SplashLogoProps {
    autoplays?: boolean;
    onComplete?: () => void;
}

export default function SplashLogo({ autoplays = true, onComplete }: SplashLogoProps) {
    const completionRef = useRef(onComplete);
    const completed = useRef(false);
    const [elapsed, setElapsed] = useState(0);
    const [reduceMotion, setReduceMotion] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const prefix = useId().replace(/:/g, '');
    const duration = vector.durationFrames / vector.fps;
    useEffect(() => { completionRef.current = onComplete; }, [onComplete]);
    const finish = useCallback(() => {
        if (completed.current) return;
        completed.current = true;
        completionRef.current?.();
    }, []);
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduceMotion(query.matches);
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        if (!autoplays) return;
        if (reduceMotion) {
            const timer = window.setTimeout(finish, 350);
            return () => window.clearTimeout(timer);
        }
        const start = performance.now();
        let handle = 0;
        const tick = (now: number) => {
            const time = Math.min(duration, Math.max(0, (now - start) / 1000));
            setElapsed(time);
            if (time >= duration) finish();
            else handle = requestAnimationFrame(tick);
        };
        handle = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(handle);
    }, [autoplays, duration, finish, reduceMotion]);

    const still = !autoplays || reduceMotion;
    const frame = (still ? duration : elapsed) * vector.fps;
    const { symbol, placement, viewport } = vector;
    const scale = viewport.displayWidth / viewport.width;
    const move = 1 - splashEase((frame - symbol.moveStart) / (symbol.moveEnd - symbol.moveStart));
    const x = (symbol.initialX - placement.x - symbol.cx * placement.scale) * move;
    const y = (symbol.initialY - placement.y - symbol.cy * placement.scale) * move;
    const fold = Math.PI / 2 * (1 - splashEase(frame / symbol.openFrames));
    return (
        <div role="img" aria-label="Taste Buddy" data-splash-state={still ? 'still' : 'animating'}
            data-splash-renderer="vector" data-splash-frame={frame}
            style={{ width: viewport.displayWidth, height: viewport.displayHeight, flexShrink: 0, position: 'relative', overflow: 'hidden', isolation: 'isolate' }}>
            <div style={{ position: 'absolute', width: 1920, height: 1080, left: -viewport.cropX * scale,
                top: -viewport.cropY * scale, transformOrigin: '0 0', transform: `scale(${scale})` }}>
                <div data-splash-symbol="true" style={{ position: 'absolute', width: 1000, height: 500,
                    transformOrigin: '0 0', transform: `translate(${placement.x + x}px, ${placement.y + y}px) scale(${placement.scale})` }}>
                    {symbol.leaves.map(leaf => (
                        <svg key={leaf.index} width="1000" height="500" viewBox="0 0 1000 500" aria-hidden="true"
                            style={{ position: 'absolute', inset: 0, overflow: 'visible', transformOrigin: `${symbol.cx}px ${symbol.cy}px`,
                                transform: `matrix3d(${splashPetalMatrix(leaf.angle, fold, symbol.perspective).join(',')})` }}>
                            <path d={leaf.d} fill="#000000" />
                        </svg>
                    ))}
                </div>
                <svg width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true"
                    style={{ position: 'absolute', inset: 0 }}>
                    <g transform={`translate(${placement.x} ${placement.y}) scale(${placement.scale})`}>
                        {vector.glyphs.map(glyph => {
                            const progress = clampSplashProgress((frame - glyph.start) / glyph.duration);
                            if (progress <= 0) return null;
                            const step = Math.min(vector.maskSteps, Math.floor(progress * vector.maskSteps));
                            const id = `${prefix}-fill-${glyph.index}`;
                            return <g key={glyph.index}>
                                {step < vector.maskSteps && <defs><clipPath id={id}>
                                    <path d={glyph.masks[step]} clipRule="evenodd" />
                                </clipPath></defs>}
                                <path d={glyph.d} fill="#000000" clipPath={step < vector.maskSteps ? `url(#${id})` : undefined} />
                            </g>;
                        })}
                    </g>
                </svg>
            </div>
        </div>
    );
}
