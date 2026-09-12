import { useId, useRef, useState, type PointerEvent } from "react";
import { AbsoluteFill, Composition, Folder, Internals, useCurrentFrame, useVideoConfig } from "remotion";
import { analysisCircle, analysisLineColorIndex, analysisLineOpacity, analysisPoints, centeredAnalysisCircle, rotationTransitionDuration, feedbackEntry, feedbackMorph, feedbackPaths, feedbackRings, feedbackTransitionDuration, feedbackEndDuration, insightFrame, insightIntroDuration, insightAlignment, insightDragDelta, insightInertia, duration, motionPoints, palette, styles, type MotionStyle, type RotationDivisions, type RotationRayCount, type Point } from "./taste-motion";

const FeedbackMotion = ({time, rayCount, angle, endingAt}: {time: number; rayCount: RotationRayCount; angle: number; endingAt: number | null}) => {
  const maskId = useId().replace(/:/g, "");
  const {bend, gradientBlend} = feedbackMorph(time);
  const rings = feedbackRings(time, endingAt);
  const paths = bend < 1 ? feedbackPaths(time, rayCount, angle).map(points => points.map(({x, y}, i) => `${i ? "L" : "M"}${x.toFixed(3)} ${y.toFixed(3)}`).join(" ")) : [];
  const stops = Array.from({length: rayCount + 1}, (_, i) => `${palette[i % 6]} ${i / rayCount * 100}%`).join(", ");
  return <g>
    {paths.map((d, i) => <path key={i} d={d} fill="none" stroke={palette[i % rayCount % 6]} strokeWidth={4} />)}
    <defs>
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={640} height={640}>
        {bend < 1 ? paths.map((d, i) => <path key={i} d={d} fill="none" stroke="white" strokeWidth={4} />)
          : rings.map((ring, i) => <circle key={i} cx={320} cy={320} r={ring.radius} fill="none" stroke="white" strokeWidth={4} opacity={ring.opacity} />)}
      </mask>
    </defs>
    <foreignObject x={0} y={0} width={640} height={640} mask={`url(#${maskId})`} opacity={gradientBlend}>
      <div style={{width: "100%", height: "100%", background: `conic-gradient(from ${90 + angle * 180 / Math.PI}deg, ${stops})`}} />
    </foreignObject>
  </g>;
};

const InsightMotion = ({time}: {time: number}) => {
  const maskId = useId().replace(/:/g, "");
  const playing = Internals.usePlaying();
  const [interaction, setInteraction] = useState({at: 0, anchorAt: 0, from: 0, to: 0});
  const [rotation, setRotation] = useState({angle: 0, velocity: 0, at: 0});
  const dragPoint = useRef<{point: Point; at: number; velocity: number} | null>(null);
  const rotationAngle = rotation.angle + insightInertia(rotation.velocity, time - rotation.at);
  const alignment = playing && time >= interaction.at ? insightAlignment(time - interaction.at, interaction.from, interaction.to) : interaction.to;
  const press = (pressed: boolean) => setInteraction({at: time, anchorAt: alignment === 0 || alignment === 1 ? time : interaction.anchorAt, from: alignment, to: pressed ? 1 : 0});
  const pointerPoint = (event: PointerEvent<SVGGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const scale = 640 / Math.min(bounds.width, bounds.height);
    return {x: (event.clientX - bounds.left - bounds.width / 2) * scale, y: (event.clientY - bounds.top - bounds.height / 2) * scale};
  };
  const endDrag = (stamp: number, inertial: boolean) => {
    const drag = dragPoint.current;
    if (drag) setRotation(value => ({angle: value.angle, velocity: inertial && stamp - drag.at <= 120 ? drag.velocity : 0, at: time}));
    dragPoint.current = null; press(false);
  };
  const frame = insightFrame(time, false, alignment, Math.max(0, time - interaction.anchorAt), rotationAngle);
  return <g role="button" tabIndex={0} aria-label="누르는 동안 미각별 정렬" aria-pressed={interaction.to === 1}
    aria-description="드래그하거나 좌우 방향키로 링을 회전할 수 있습니다."
    style={{cursor: frame.expansion === 1 ? interaction.to === 1 ? "grabbing" : "grab" : "pointer", touchAction: "none"}}
    onPointerDown={event => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragPoint.current = frame.expansion === 1 ? {point: pointerPoint(event), at: event.timeStamp, velocity: 0} : null;
      setRotation({angle: rotationAngle, velocity: 0, at: time}); press(true);
    }}
    onPointerMove={event => {
      const drag = dragPoint.current;
      if (drag) {
        const point = pointerPoint(event), delta = insightDragDelta(drag.point, point);
        const elapsed = Math.max(1 / 240, (event.timeStamp - drag.at) / 1000);
        const velocity = Math.max(-8, Math.min(8, drag.velocity * 0.4 + delta / elapsed * 0.6));
        setRotation(value => ({...value, angle: value.angle + delta}));
        dragPoint.current = {point, at: event.timeStamp, velocity};
      }
    }}
    onPointerUp={event => endDrag(event.timeStamp, true)} onPointerCancel={event => endDrag(event.timeStamp, false)}
    onLostPointerCapture={event => endDrag(event.timeStamp, false)} onBlur={event => endDrag(event.timeStamp, false)}
    onKeyDown={event => {
      if (event.key === " " || event.key === "Enter") { event.preventDefault(); event.stopPropagation(); if (!event.repeat) press(true); }
      if (frame.expansion === 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); event.stopPropagation(); setRotation({angle: rotationAngle + (event.key === "ArrowRight" ? 1 : -1) * Math.PI / 12, velocity: 0, at: time}); }
    }}
    onKeyUp={event => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); event.stopPropagation(); press(false); } }}>
    <rect x={0} y={0} width={640} height={640} fill="transparent" />
    {frame.expansion === 0 ? palette.slice(0, 6).map((color, colorIndex) => <g key={colorIndex}>
      <defs>
        <radialGradient id={`${maskId}-color-${colorIndex}`} gradientUnits="userSpaceOnUse" cx={320} cy={320} r={74.2}>
          <stop offset={1 / 6} stopColor={color} stopOpacity={1} />
          <stop offset={1} stopColor={color} stopOpacity={0.35} />
        </radialGradient>
        <mask id={`${maskId}-shape-${colorIndex}`} maskUnits="userSpaceOnUse" x={0} y={0} width={640} height={640} style={{maskType: "alpha"}}>
          {frame.bridges.filter(bridge => bridge.colorIndex === colorIndex).map(({points: p, child}) => <path key={child} fill="white"
            d={`M${p[0].x} ${p[0].y} C${p[1].x} ${p[1].y} ${p[2].x} ${p[2].y} ${p[3].x} ${p[3].y} L${p[4].x} ${p[4].y} C${p[5].x} ${p[5].y} ${p[6].x} ${p[6].y} ${p[7].x} ${p[7].y} Z`} />)}
          {frame.dots.filter(dot => dot.colorIndex === colorIndex).map((dot, index) => <circle key={index} cx={dot.x} cy={dot.y} r={dot.radius} fill="white" />)}
        </mask>
      </defs>
      <rect x={0} y={0} width={640} height={640} fill={`url(#${maskId}-color-${colorIndex})`} mask={`url(#${maskId}-shape-${colorIndex})`} />
    </g>) : frame.dots.map((dot, index) => <circle key={index} cx={dot.x} cy={dot.y} r={dot.radius} fill={palette[dot.colorIndex]} opacity={dot.opacity} />)}
  </g>;
};

const TasteMotion = ({ style, transitionFromAnalysis = false, sequence = false, divisions = 6, rayCount = 12 }: { style: MotionStyle; transitionFromAnalysis?: boolean; sequence?: boolean; divisions?: RotationDivisions; rayCount?: RotationRayCount }) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const transitions = transitionFromAnalysis || sequence;
  const rotationStart = 4 + rotationTransitionDuration;
  const feedbackStart = rotationStart + 4;
  const rotating = transitions && time >= rotationStart;
  const inFeedback = sequence && time >= feedbackStart;
  const activeStyle = inFeedback ? "feedbackRings" : transitions ? rotating ? "rotatingLayers" : "analysis" : style;
  const motionTime = inFeedback ? time - feedbackStart : rotating ? time - rotationStart : time;
  const circle = activeStyle === "analysis"
    ? transitions && time >= 4 ? centeredAnalysisCircle(analysisCircle(4), time - 4, rayCount) : analysisCircle(time)
    : null;
  const collapseFromDensity = transitions && time >= 4 && !rotating ? analysisCircle(4).lineDensity : null;
  const points = circle ? analysisPoints(circle, collapseFromDensity) : activeStyle === "feedbackRings" ? [] : motionPoints(activeStyle, motionTime, divisions, rayCount);
  const lineDensity = circle?.lineDensity ?? 0;
  return (
    <AbsoluteFill style={{backgroundColor: "white"}}>
      <svg viewBox="0 0 640 640" width="100%" height="100%">
        {activeStyle === "feedbackRings" && <FeedbackMotion time={motionTime} rayCount={rayCount} angle={inFeedback ? feedbackEntry(4, motionTime, divisions, rayCount).angle : 0} endingAt={inFeedback ? feedbackTransitionDuration + 6 : null} />}
        {activeStyle === "analysis" && Array.from({length: points.length / 2}, (_, i) => (
          <line key={i} x1={points[i * 2].x} y1={points[i * 2].y} x2={points[i * 2 + 1].x} y2={points[i * 2 + 1].y} stroke={palette[analysisLineColorIndex(i, lineDensity)]} strokeWidth={4} opacity={Math.max(analysisLineOpacity(i, collapseFromDensity ?? lineDensity), analysisLineOpacity(i, lineDensity))} />
        ))}
        {activeStyle === "rotatingLayers" && Array.from({length: points.length / 2}, (_, i) => (
          <line key={i} x1={points[i * 2].x} y1={points[i * 2].y} x2={points[i * 2 + 1].x} y2={points[i * 2 + 1].y} stroke={palette[i % 6]} strokeWidth={4} />
        ))}
        {activeStyle === "detailMatrix" && <>
          {Array.from({length: 32}, (_, i) => {
            const start = i / 32 * Math.PI * 2 + 0.016;
            const end = (i + 1) / 32 * Math.PI * 2 - 0.016;
            return <path key={i} d={`M320 320 L${320 + 316 * Math.cos(start)} ${320 + 316 * Math.sin(start)} A316 316 0 0 1 ${320 + 316 * Math.cos(end)} ${320 + 316 * Math.sin(end)} Z`} fill="#F0F0F0" />;
          })}
          <polygon points={points.map(({x,y}) => `${x},${y}`).join(" ")} fill={palette[0]} fillOpacity={0.24} stroke={palette[0]} strokeWidth={3} strokeLinejoin="round" />
          {points.map(({x,y}, i) => <g key={i}>
            <line x1={320} y1={320} x2={x} y2={y} stroke={palette[0]} strokeWidth={1.3} strokeOpacity={0.65} />
            <circle cx={x} cy={y} r={7} fill={palette[0]} />
          </g>)}
        </>}
        {activeStyle === "insightRing" && <InsightMotion time={time} /> }
      </svg>
    </AbsoluteFill>
  );
};

export const TasteMotionCompositions = () => (
  <Folder name="TasteMotion">
    <Composition id="TasteMotion-completeFlow" component={TasteMotion} defaultProps={{style: "analysis" as MotionStyle, sequence: true, divisions: 6 as RotationDivisions, rayCount: 12 as RotationRayCount}} durationInFrames={Math.round((4 + rotationTransitionDuration + 4 + feedbackTransitionDuration + 6 + feedbackEndDuration + 0.5) * 30)} fps={30} width={640} height={640} />
    <Folder name="RotationModes">
      {([3, 6, 12] as const).map(divisions => (
        <Folder key={divisions} name={`${divisions}-segments`}>
          {([12, 24, 48] as const).map(rayCount => (
            <Composition key={rayCount} id={`TasteMotion-${divisions}-segments-${rayCount}-lines`} component={TasteMotion} defaultProps={{style: "analysis" as MotionStyle, transitionFromAnalysis: true, divisions, rayCount}} durationInFrames={Math.round((4 + rotationTransitionDuration + duration("rotatingLayers", divisions, rayCount)) * 30)} fps={30} width={640} height={640} />
          ))}
        </Folder>
      ))}
    </Folder>
    <Composition id="TasteMotion-analysisToRotation" component={TasteMotion} defaultProps={{style: "analysis" as MotionStyle, transitionFromAnalysis: true}} durationInFrames={Math.round((4 + rotationTransitionDuration + duration("rotatingLayers", 6)) * 30)} fps={30} width={640} height={640} />
    {styles.map((style) => (
      <Composition key={style} id={style === "rotatingLayers" || style === "feedbackRings" || style === "insightRing" ? `TasteMotion-${style}` : `Onboarding-${style}`} component={TasteMotion} defaultProps={{style, rayCount: (style === "feedbackRings" ? 24 : 12) as RotationRayCount}} durationInFrames={Math.round((duration(style, 6) + (style === "insightRing" ? insightIntroDuration : 0)) * 30)} fps={30} width={640} height={640} />
    ))}
  </Folder>
);
