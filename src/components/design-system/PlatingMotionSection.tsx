import { useEffect, useRef, useState } from 'react';
import { DESIGN_SYSTEM, MOTION_TOKENS } from '../../constants/designTokens';
import {
  getPlatingMotion, PLATING_MOTION_RECIPES, PLATING_MOTION_ROLES, PLATING_SIGNATURE_MOTIONS,
  type PlatingMotionName, type PlatingMotionRecipe,
} from '../../constants/platingMotion';
import PlaygroundSection from './PlaygroundSection';
import { SourceFileLink } from './PreviewableSourceText';
import './PlatingMotionSection.css';

export default function PlatingMotionSection() {
  const [name, setName] = useState<PlatingMotionName>('resultBloom');
  const [rate, setRate] = useState(1);
  const [fps, setFps] = useState(60);
  const [previewReduced, setPreviewReduced] = useState(false);
  const [systemReduced, setSystemReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const sampleRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const reduced = previewReduced || systemReduced;
  const recipe: PlatingMotionRecipe = PLATING_MOTION_RECIPES[name];
  const totalMs = recipe.delayMs + recipe.durationMs;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const element = sampleRef.current;
    if (!element) return;
    const { keyframes, options } = getPlatingMotion(name, { reducedMotion: reduced });
    const animation = element.animate(keyframes, options);
    animation.pause();
    animation.currentTime = reduced ? 0 : totalMs;
    animationRef.current = animation;
    setTime(totalMs);
    setPlaying(false);
    return () => { animation.cancel(); animationRef.current = null; };
  }, [name, reduced, totalMs]);

  useEffect(() => {
    if (animationRef.current) animationRef.current.updatePlaybackRate(rate);
  }, [rate]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const animation = animationRef.current;
      if (!animation) return;
      setTime(Math.min(totalMs, Number(animation.currentTime ?? 0)));
      if (animation.playState === 'finished') setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, totalMs]);

  useEffect(() => {
    const pause = () => {
      animationRef.current?.pause();
      setPlaying(false);
    };
    const onVisibility = () => { if (document.hidden) pause(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); });
    if (sampleRef.current?.parentElement) observer.observe(sampleRef.current.parentElement);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  const seek = (milliseconds: number) => {
    const animation = animationRef.current;
    if (!animation || reduced) return;
    animation.pause();
    animation.currentTime = milliseconds;
    setTime(milliseconds);
    setPlaying(false);
  };
  const togglePlay = () => {
    const animation = animationRef.current;
    if (!animation || reduced) return;
    if (playing) { animation.pause(); setPlaying(false); return; }
    if (Number(animation.currentTime) >= totalMs) animation.currentTime = 0;
    animation.playbackRate = rate;
    animation.play();
    setPlaying(true);
  };

  return (
    <PlaygroundSection
      id="motion"
      title="Plating Motion · 플레이팅 모션"
      description="누르고, 정돈하고, 펼치고, 피어나는 움직임. 역할과 키프레임을 골라 같은 시간축에서 확인합니다."
      sources={[
        { file: 'src/constants/platingMotion.ts', note: '역할·키프레임·실행 옵션의 공통 원본' },
        { file: 'src/styles/plating-motion.css', note: '공통 원본에서 생성한 CSS. 웹 결과 카드도 사용합니다.' },
        { file: 'docs/design/motion-system.md', note: '원칙·네이밍·플랫폼별 계약·브랜드 시퀀스' },
      ]}
    >
      <div className="plating-motion">
        <div className="plating-motion-intro">
          <p className="plating-motion-eyebrow">{DESIGN_SYSTEM.englishName} / Motion 1.0</p>
          <p>{DESIGN_SYSTEM.description}</p>
          <p className="plating-motion-muted">기본 값 → 동작 역할 → 키프레임 → 연출 패턴</p>
        </div>

        <div className="plating-motion-roles" aria-label="모션의 다섯 역할">
          {Object.entries(PLATING_MOTION_ROLES).map(([role, value]) => (
            <div key={role}>
              <span className="plating-motion-muted">{role}</span>
              <strong>{value.label}</strong>
              <span>{value.durationMs}ms</span>
              <small>{value.use}</small>
            </div>
          ))}
        </div>
        <p className="plating-motion-muted">역할 시간은 iOS 스프링의 체감 시간과 웹 기본 프리셋의 기준입니다. 독립 연출의 전체 길이는 별도로 표시합니다.</p>

        <div className="plating-motion-workbench">
          <div className="plating-motion-player">
            <div className="plating-motion-controls">
              <label>키프레임 패턴
                <select value={name} onChange={(event) => setName(event.target.value as PlatingMotionName)}>
                  {Object.entries(PLATING_MOTION_RECIPES).map(([key, entry]) => <option key={key} value={key}>{entry.name}</option>)}
                </select>
              </label>
              <label>재생 속도
                <select value={rate} onChange={(event) => setRate(Number(event.target.value))}>
                  <option value={0.25}>0.25×</option><option value={0.5}>0.5×</option><option value={1}>1×</option>
                </select>
              </label>
              <label>프레임 환산
                <select value={fps} onChange={(event) => setFps(Number(event.target.value))}>
                  <option value={30}>30 fps</option><option value={60}>60 fps</option>
                </select>
              </label>
            </div>
            <div className="plating-motion-stage" data-pattern={name}>
              <span className="plating-motion-stage-label">{reduced ? '동작 줄이기 · 최종 상태' : recipe.name}</span>
              <div ref={sampleRef} className="plating-motion-sample" style={{ transformOrigin: recipe.origin }} data-testid="plating-motion-sample">
                <span className="plating-motion-eyebrow">Plating</span>
                <strong>경험이 자리를 잡는 순간</strong>
                <span className="plating-motion-muted">플레이팅 모션 키프레임 샘플</span>
                <div className="plating-motion-sample-line" /><div className="plating-motion-sample-line" />
              </div>
            </div>
            <div className="plating-motion-transport">
              <button type="button" onClick={togglePlay} disabled={reduced}>{playing ? '일시정지' : time >= totalMs ? '다시 재생' : '재생'}</button>
              <button type="button" onClick={() => seek(0)} disabled={reduced}>처음으로</button>
              <output aria-label="현재 모션 시간" aria-live="off">{Math.round(time)} / {totalMs}ms · {Math.round(time * fps / 1000)}f</output>
            </div>
            <label className="plating-motion-scrubber">타임라인
              <input type="range" min={0} max={totalMs} step={1} value={Math.round(time)} onChange={(event) => seek(Number(event.target.value))} disabled={reduced} />
            </label>
            <label className="plating-motion-reduced">
              <input type="checkbox" checked={reduced} disabled={systemReduced} onChange={(event) => setPreviewReduced(event.target.checked)} />
              동작 줄이기{systemReduced ? ' · 시스템 설정 적용 중' : ' 미리보기'}
            </label>
          </div>

          <div className="plating-motion-spec">
            <h3>{recipe.name}</h3>
            <code>{recipe.id}</code>
            <dl>
              <div><dt>시작 조건</dt><dd>{recipe.trigger}</dd></div>
              <div><dt>길이 / 지연</dt><dd>{recipe.durationMs}ms / {recipe.delayMs}ms</dd></div>
              <div><dt>이징</dt><dd><code>{recipe.easing}</code></dd></div>
              <div><dt>기준점</dt><dd>{recipe.origin}</dd></div>
              <div><dt>종료 / 반복</dt><dd>최종 상태 유지 / 1회</dd></div>
              <div><dt>순차 등장</dt><dd>{MOTION_TOKENS.staggerMs}ms 간격 · 웹 기본 프리셋은 최대 240ms 추가 지연</dd></div>
            </dl>
            <p className="plating-motion-muted">{recipe.scope}</p>
            <p className="plating-motion-muted">동작 줄이기는 지연·이동 없이 최종 상태를 표시합니다. 프레임 수는 표시용 환산이며 실행 시계는 ms입니다.</p>
            <SourceFileLink file={recipe.source} />
          </div>
        </div>

        <div className="plating-motion-table-wrap">
          <table>
            <caption>키프레임 · 시점을 누르면 해당 상태로 이동</caption>
            <thead><tr><th>구간</th><th>시간 / 프레임</th><th>상태</th><th>속성</th></tr></thead>
            <tbody>{recipe.frames.map((frame) => {
              const at = recipe.delayMs + frame.offset * recipe.durationMs;
              return <tr key={frame.offset}>
                <td><button type="button" onClick={() => seek(at)} disabled={reduced}>{Math.round(frame.offset * 100)}%</button></td>
                <td>{Number(at.toFixed(1))}ms / {Math.round(at * fps / 1000)}f</td>
                <td>{frame.label}</td>
                <td><code>{Object.entries(frame.values).map(([key, value]) => `${key}: ${value}`).join('; ')}</code></td>
              </tr>;
            })}</tbody>
          </table>
        </div>

        <div className="plating-motion-signatures">
          {PLATING_SIGNATURE_MOTIONS.map((pattern) => (
            <article key={pattern.id}>
              <p className="plating-motion-eyebrow">{pattern.platform} / {pattern.englishName}</p>
              <h3>{pattern.name}</h3>
              <p>{pattern.rule}</p>
              <p className="plating-motion-muted">{pattern.duration} · {pattern.curve}</p>
              <ol>{pattern.landmarks.map((point) => <li key={point.timeMs}><time>{(point.timeMs / 1000).toFixed(3)}s</time><span>{point.label}</span></li>)}</ol>
              <SourceFileLink file={pattern.source} />
            </article>
          ))}
        </div>
        <p className="plating-motion-muted">브랜드 시퀀스의 위 목록은 원본 코드의 주요 시점입니다. 위 웹 샘플은 이 두 시퀀스의 렌더러가 아니며, 실제 형태와 물리는 각 Remotion 소스에서 확인합니다.</p>
      </div>
    </PlaygroundSection>
  );
}
