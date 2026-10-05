import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const load = async (file) => {
  const text = await readFile(
    new URL(`../src/PetalLogo/${file}.ts`, import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
  );
};
const m = await load("motion");
const source = await load("source");
const solid = await load("solidGeometry");

test("attached petal path and source color are preserved byte for byte", async () => {
  const svg = await readFile(
    new URL("../public/brand/petal-logo/source.svg", import.meta.url),
    "utf8",
  );
  assert.equal(svg.match(/<path d="([^"]+)"/)[1], source.PETAL_PATH);
  assert.equal(
    svg.match(/<path[^>]+fill="([^"]+)"/)[1],
    source.PETAL_SOURCE_FILL,
  );
  assert.equal(
    createHash("sha256").update(svg).digest("hex"),
    source.PETAL_SOURCE_SHA256,
  );
});

test("six petals settle at 60 degree intervals and remain still for the end card", () => {
  const last = m.PETAL_DURATION - 1;
  assert.equal(m.PETAL_ANGLES.length, 6);
  assert.deepEqual(m.getPetalScene(), m.getPetalScene());
  for (let i = 0; i < 6; i++) {
    const pose = m.getPetalPose(last, i);
    assert.equal(pose.angle, m.PETAL_ANGLES[i]);
    assert.equal(pose.opacity, 1);
    assert.equal(pose.rotationX, 0);
    assert.equal(m.getPetalPose(0, i).rotationX, 90);
    assert.notEqual(m.getPetalPose(m.PETAL_FPS - 1, i).rotationX, 0);
    assert.equal(m.getPetalPose(m.PETAL_FPS, i).rotationX, 0);
    assert.equal(pose.rotationY, 90);
    assert.equal(pose.thickness, 10);
    assert.deepEqual(m.getPetalPose(132, i), pose);
  }
});

test("scrubbing in any order is deterministic and all petal geometry stays inside frame", () => {
  const frames = Array.from({ length: m.PETAL_DURATION }, (_, f) => f);
  const samples = (frame) => ({
    scene: m.getPetalScene(),
    petals: [
      ...m.PETAL_ANGLES.map((_, i) => m.getPetalPose(frame, i)),
      ...(frame >= m.PETAL_COPY_START
        ? m.PETAL_ANGLES.map((_, i) => {
            const pose = m.getPetalPose(frame, i);
            return { ...pose, angle: pose.angle + m.copyRotationZ(frame) };
          })
        : []),
    ],
  });
  const baseline = frames.map(samples);
  for (const frame of frames.reverse()) {
    const { scene, petals } = samples(frame);
    assert.deepEqual(samples(frame), baseline[frame]);
    petals.forEach((p) => {
      // Conservative SVG control hull, including the outlying Bezier handles.
      for (const x of [-3, 262])
        for (const y of [0, 590]) {
          for (const depth of [-p.thickness / 2, p.thickness / 2]) {
            const x0 = (x - m.PETAL_PIVOT.x) * scene.scale;
            const y0 = (y - m.PETAL_PIVOT.y) * scene.scale;
            const rx = (p.rotationX * Math.PI) / 180;
            const ry = (p.rotationY * Math.PI) / 180;
            const rz = (p.angle * Math.PI) / 180;
            const x1 = x0 * Math.cos(ry) + depth * Math.sin(ry);
            const z1 = -x0 * Math.sin(ry) + depth * Math.cos(ry);
            const y2 = y0 * Math.cos(rx) - z1 * Math.sin(rx);
            const z2 = y0 * Math.sin(rx) + z1 * Math.cos(rx);
            const perspective =
              m.PETAL_PERSPECTIVE / (m.PETAL_PERSPECTIVE - z2);
            const px =
              scene.x + (x1 * Math.cos(rz) - y2 * Math.sin(rz)) * perspective;
            const py =
              scene.y + (x1 * Math.sin(rz) + y2 * Math.cos(rz)) * perspective;
            assert.ok(
              px > 90 && px < 990 && py > 280 && py < 1500,
              `safe area ${frame}: ${px},${py}`,
            );
          }
        }
    });
  }
});

test("seven layers separate the copy turn, ray shortening and final hold", () => {
  assert.equal(m.petalLayers.length, 7);
  let end = 0;
  for (const chapter of m.petalChapters) {
    assert.equal(chapter.from, end);
    end += chapter.duration;
  }
  assert.equal(end, 180);
  assert.equal(m.PETAL_DURATION, 180);
  assert.deepEqual(
    m.petalLayers.map((layer) => layer.duration),
    [30, 30, 10, 10, 10, 10, 90],
  );
});

test("all petals first reach fully open at one second, without early crossing", () => {
  let previous = 91;
  for (let frame = 0; frame <= m.PETAL_FPS; frame++) {
    const first = m.getPetalPose(frame, 0);
    if (frame < m.PETAL_FPS) {
      assert.ok(first.rotationX > 0, `opened early at frame ${frame}`);
      assert.ok(first.rotationX < previous);
    } else assert.equal(first.rotationX, 0);
    previous = first.rotationX;
    for (let i = 0; i < 6; i++) {
      const petal = m.getPetalPose(frame, i);
      assert.equal(petal.angle, m.PETAL_ANGLES[i]);
      assert.equal(petal.rotationX, first.rotationX);
      assert.equal(petal.opacity, 1);
    }
  }
  // AE Easy Ease acts on the rotation value itself, symmetrically in time.
  assert.equal(m.openingRotationX(7.5), 75.9375);
  assert.equal(m.openingRotationX(15), 45);
  assert.equal(m.openingRotationX(22.5), 14.0625);
  const dt = 0.0001;
  assert.ok(Math.abs((m.openingRotationX(dt) - 90) / dt) < 0.001);
  assert.ok(Math.abs(m.openingRotationX(30 - dt) / dt) < 0.001);
  assert.deepEqual(m.getPetalScene(), { x: 540, y: 960, scale: 0.53 });
});

test("hold one second then turn each thick petal over exactly ten frames", () => {
  for (let frame = 30; frame < 60; frame++) {
    assert.ok(m.getPetalPose(frame, 0).rotationY === 0);
    assert.equal(m.getPetalPose(frame, 0).thickness, 0);
  }
  for (let i = 0; i < 6; i++) {
    assert.ok(m.getPetalPose(60, i).rotationY === 0);
    assert.equal(m.getPetalPose(60, i).thickness, 10);
    assert.equal(m.getPetalPose(64.5, i).rotationY, 45);
    assert.equal(m.getPetalPose(69, i).rotationY, 90);
    assert.deepEqual(m.getPetalPose(70, i), m.getPetalPose(179, i));
    for (let frame = 61; frame < 69; frame++) {
      const angle = m.getPetalPose(frame, i).rotationY;
      assert.ok(angle > 0 && angle < 90);
    }
  }
});

test("extruded side walls form a closed perimeter with no zero length panels", () => {
  const walls = solid.petalWalls(source.PETAL_PATH, 0.53, m.PETAL_PIVOT);
  assert.ok(walls.length > 20 && walls.length < 512);
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i],
      next = walls[(i + 1) % walls.length];
    const radians = (wall.angle * Math.PI) / 180;
    assert.ok(wall.length > 0);
    assert.ok(
      Math.abs(wall.x + wall.length * Math.cos(radians) - next.x) < 1e-8,
    );
    assert.ok(
      Math.abs(wall.y + wall.length * Math.sin(radians) - next.y) < 1e-8,
    );
  }
});

test("copied held set turns clockwise 30 degrees in ten frames into twelve equal rays", () => {
  assert.equal(m.copyRotationZ(70), 0);
  assert.equal(m.copyRotationZ(74.5), 15);
  assert.equal(m.copyRotationZ(79), 30);
  assert.equal(m.copyRotationZ(179), 30);
  let previous = 0;
  for (let f = 71; f < 80; f++) {
    const angle = m.copyRotationZ(f);
    assert.ok(angle > previous && angle <= 30);
    previous = angle;
    for (let i = 0; i < 6; i++)
      assert.deepEqual(m.getPetalPose(f, i), m.getPetalPose(69, i));
  }
  const angles = [
    ...m.PETAL_ANGLES,
    ...m.PETAL_ANGLES.map((a) => a + m.copyRotationZ(79)),
  ]
    .map((a) => (a + 360) % 360)
    .sort((a, b) => a - b);
  assert.deepEqual(
    angles,
    Array.from({ length: 12 }, (_, i) => i * 30),
  );
});

test("ray shortening fixes outer tips and ends at an inner-to-outer radius ratio of one quarter", () => {
  const radii = solid.projectedPetalRadii(
    source.PETAL_PATH,
    0.53,
    m.PETAL_PIVOT,
    m.PETAL_PERSPECTIVE,
  );
  assert.ok(radii.outer > 330 && radii.outer < 350);
  assert.ok(radii.inner > 20 && radii.inner < 24);
  assert.equal(m.PETAL_SHORTEN_START, 80);
  assert.equal(m.PETAL_SHORTEN_FRAMES, 10);
  const start = m.getLineLengthState(80, radii),
    end = m.getLineLengthState(89, radii);
  assert.equal(start.scale, 1);
  assert.ok(Math.abs(end.inner / end.outer - 0.25) < 1e-12);
  let previous = radii.inner;
  for (let frame = 80; frame < 90; frame++) {
    const state = m.getLineLengthState(frame, radii);
    assert.ok(
      Math.abs(-radii.outer * state.scale + state.offset + radii.outer) < 1e-10,
    );
    assert.ok(
      Math.abs(-radii.inner * state.scale + state.offset + state.inner) < 1e-10,
    );
    assert.ok(state.inner >= previous);
    assert.equal(state.outer, radii.outer);
    previous = state.inner;
  }
  assert.deepEqual(m.getLineLengthState(90, radii), end);
  assert.deepEqual(m.getLineLengthState(179, radii), end);
  assert.deepEqual(m.getLineLengthState(79, radii), start);
});


test("analysis preserves all 12 outer tips, centers smoothly and scrubs deterministically", async () => {
  const { analysisRayTransform } = await load("analysisGeometry");
  const { analysisCircle } = await load("../taste-motion");
  const radii = solid.projectedPetalRadii(source.PETAL_PATH, 0.53, m.PETAL_PIVOT, m.PETAL_PERSPECTIVE);
  const outer = radii.outer;
  const inner = outer / 4;
  const pose = (time, angle) => analysisRayTransform(time, analysisCircle(time), angle, outer, inner, {top:analysisCircle(0),arrival:analysisCircle(1.5)});
  for (const t of [0, 3]) {
    const { matrix, dx, dy, radius } = pose(t, 0);
    matrix.forEach((value, i) => assert.ok(Math.abs(value - [1, 0, 0, 1, 0, 0][i]) < 1e-12));
    assert.ok(Math.abs(dx) < 1e-12);
    assert.ok(Math.abs(dy) < 1e-12);
    assert.equal(radius, inner);
  }
  let movement = 0;
  for (let f = 0; f < 90; f++) {
    const u = f / 89;
    const t = 3 * u * u * (3 - 2 * u);
    for (let angle = 0; angle < 360; angle += 30) {
      const state = pose(t, angle);
      assert.deepEqual(pose(t, angle), state);
      const [a, b, c, d, e, g] = state.matrix;
      const transform = (x, y) => ({x: a*x+c*y+e, y: b*x+d*y+g});
      const tip = transform(0, -outer);
      assert.ok(Math.abs(tip.x) < 1e-9);
      assert.ok(Math.abs(tip.y + outer) < 1e-9);
      const inside = transform(0, -inner);
      const rad = angle * Math.PI / 180;
      const world = {x: inside.x * Math.cos(rad) - inside.y * Math.sin(rad), y: inside.x * Math.sin(rad) + inside.y * Math.cos(rad)};
      assert.ok(Math.abs(Math.hypot(world.x - state.dx, world.y - state.dy) - state.radius) < 1e-9);
      assert.ok(Math.hypot(state.dx, state.dy) + state.radius < outer);
      assert.ok(d > 0);
      assert.ok(Math.abs(a*c + b*d) < 1e-12, "end cross-section stays perpendicular, without shear");
      assert.ok(Math.abs(Math.hypot(a, b) - 1) < 1e-12, "line width stays unchanged");
      const outerWorld = {x: outer * Math.sin(rad), y: -outer * Math.cos(rad)};
      const towardCenter = {x: state.dx - outerWorld.x, y: state.dy - outerWorld.y};
      const lineVector = {x: world.x - outerWorld.x, y: world.y - outerWorld.y};
      assert.ok(Math.abs(towardCenter.x * lineVector.y - towardCenter.y * lineVector.x) < 1e-8, "each straight line points at the inner center");
      movement = Math.max(movement, Math.hypot(state.dx, state.dy));
    }
  }
  assert.ok(movement > 50, "inner opening visibly moves while outer tips stay fixed");
  for (const end of [0, 3]) {
    const dt = 0.00001;
    const p = pose(end === 0 ? dt : end - dt, 0);
    assert.ok(Math.hypot(p.dx, p.dy) / dt < 0.1, "zero endpoint speed");
  }
});

test("center growth has its own layer and travel-return has exactly 90 frames", async () => {
  const text = await readFile(new URL("../src/PetalLogo/PetalLogo.tsx", import.meta.url), "utf8");
  const jsx = ts.createSourceFile("PetalLogo.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const layers = [];
  const visit = (node) => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(jsx) === "PetalLayer") {
      layers.push(Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).map(attr => [attr.name.getText(jsx), attr.initializer?.getText(jsx)])));
    }
    ts.forEachChild(node, visit);
  };
  visit(jsx);
  const growth=layers.find(l=>l.name.includes("중앙 빈 원 확대"));
  const movement=layers.find(l=>l.name.includes("분석 이동·복귀"));
  const n=value=>Number(value.slice(1,-1));
  assert.ok(n(growth.durationInFrames)>0);
  assert.equal(n(movement.from),n(growth.from)+n(growth.durationInFrames));
  assert.equal(movement.durationInFrames,"{90}");
  assert.match(movement.analysisTime,/\[0.18, 0.55, 0.8, 1.5, 2.125, 2.5, 3\]/);
  assert.equal(n(layers.find(l=>l.name.includes("조정 움직임")).from),n(movement.from)+90);
  layers.forEach(layer=>{
    const label=Number(layer.name.match(/"(\d+)/)[1]);
    assert.equal(layer.renderMode, label>=4 && label<=14 ? '"lines"' : undefined);
  });
});


test("adjustment splits into three equal radial layers then rejoins clockwise without bending", async () => {
  const { adjustmentLayers } = await load("adjustmentGeometry");
  const inner = 80, outer = 320;
  assert.deepEqual(adjustmentLayers(0, inner, outer).map(s => s.angle), [0,0,0]);
  assert.deepEqual(adjustmentLayers(3, inner, outer).map(s => s.angle), [30,30,30]);
  assert.ok(new Set(adjustmentLayers(1.5, inner, outer).map(s => s.angle)).size === 3);
  let previous = Array(3).fill(0);
  for (let f = 0; f < 90; f++) {
    const time = 3 * f / 89;
    const layers = adjustmentLayers(time, inner, outer);
    assert.deepEqual(adjustmentLayers(time, inner, outer), layers);
    assert.equal(layers.length, 3);
    layers.forEach((s, i) => {
      assert.equal(s.outer - s.inner, 80);
      if (i) assert.equal(s.inner, layers[i-1].outer);
      assert.ok(s.angle >= previous[i] && s.angle <= 30);
      previous[i] = s.angle;
    });
  }
  // Each stage is Easy Ease: zero angular speed at every state boundary.
  for (let step = 0; step <= 4; step++) {
    const time = step * 0.75, dt = 1e-6;
    const left = adjustmentLayers(time - dt, inner, outer);
    const right = adjustmentLayers(time + dt, inner, outer);
    left.forEach((s, i) => assert.ok(Math.abs(right[i].angle - s.angle)/(2*dt) < 0.01));
  }
});

test("feedback preserves the starting segments and joins twelve arcs into each of three rings", async () => {
  const {feedbackPoint, feedbackPose, feedbackFaces, clipFeedbackFace, feedbackFacePath} = await load("feedbackGeometry");
  const inner=80, outer=320, half=40;
  const rotate=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
  for (let layer=0;layer<3;layer++) {
    const mid=inner+80*(layer+0.5);
    for (const p of [{x:-5,y:-mid+half},{x:5,y:-mid-half},{x:0,y:-mid}]) {
      const start=feedbackPoint(p,0,layer,inner,outer);
      assert.ok(Math.hypot(start.x-p.x,start.y-p.y)<1e-9);
    }
    for (const time of [1.7,2,3]) {
      const a=feedbackPoint({x:0,y:-mid+half},time,layer,inner,outer);
      const b=rotate(feedbackPoint({x:0,y:-mid-half},time,layer,inner,outer),Math.PI/6);
      assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-9,"neighbor arc endpoints join");
      for(let j=0;j<=24;j++) {
        const p=feedbackPoint({x:0,y:-mid-half+2*half*j/24},time,layer,inner,outer);
        assert.ok(Math.abs(Math.hypot(p.x,p.y)-(mid+half*feedbackPose(time).spread))<1e-9);
      }
    }
  }
  const radii=solid.projectedPetalRadii(source.PETAL_PATH,0.53,m.PETAL_PIVOT,m.PETAL_PERSPECTIVE);
  const faces=feedbackFaces(solid.petalWalls(source.PETAL_PATH,0.53,m.PETAL_PIVOT),10,m.PETAL_PERSPECTIVE,radii.inner,radii.outer,radii.outer/4);
  assert.ok(faces.length>80);
  for(let layer=0;layer<3;layer++) {
    const ri=radii.outer/4, step=(radii.outer-ri)/3;
    for(const face of faces) {
      const clipped=clipFeedbackFace(face.points,ri+step*layer,ri+step*(layer+1));
      const path=feedbackFacePath(clipped,2,layer,ri,radii.outer);
      assert.equal(path.includes("NaN"),false);
      assert.equal(path,feedbackFacePath(clipped,2,layer,ri,radii.outer));
      for(const p of clipped) {
        assert.ok(-p.y >= ri+step*layer-1e-8 && -p.y <= ri+step*(layer+1)+1e-8);
      }
    }
  }
});


test("feedback loop is periodic with continuous invisible resets", async () => {
  const {feedbackLoopRings} = await load("feedbackGeometry");
  const same = (a,b) => a.forEach((r,i)=>{
    assert.ok(Math.abs(r.radius-b[i].radius)<1e-9);
    assert.ok(Math.abs(r.opacity-b[i].opacity)<1e-9);
  });
  const first=feedbackLoopRings(0,80,320);
  same(first,feedbackLoopRings(3,80,320));
  same(first,feedbackLoopRings(6,80,320));
  first.forEach((r,i)=>{
    assert.ok(Math.abs(r.radius-(120+i*80))<1e-9);
    assert.ok(Math.abs(r.opacity-1)<1e-9);
  });
  for(let f=0;f<90;f++) {
    const time=f/30;
    same(feedbackLoopRings(time,80,320),feedbackLoopRings(time+3,80,320));
  }
  for(let layer=0;layer<3;layer++) {
    const reset=(1-(1/6+layer/3))*3;
    for(const t of [reset-1e-5,reset+1e-5]) assert.ok(feedbackLoopRings(t,80,320)[layer].opacity<1e-6);
  }
});

test("closing layers reverse the existing keyframes and finish folded without an opacity fade", async () => {
  const {interpolate,Easing} = await import("remotion");
  const text=await readFile(new URL("../src/PetalLogo/PetalLogo.tsx",import.meta.url),"utf8");
  const sourceFile=ts.createSourceFile("PetalLogo.tsx",text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const layers=[];
  const visit=node=>{
    if(ts.isJsxSelfClosingElement(node) && node.tagName.getText(sourceFile)==="PetalLayer") {
      layers.push(Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).map(a=>[a.name.getText(sourceFile),a.initializer])));
    }
    ts.forEachChild(node,visit);
  };
  visit(sourceFile);
  const number=(node)=>Number(node.expression.getText(sourceFile));
  const at=(index,prop,frame)=>{
    const node=layers[index][prop].expression;
    if(!ts.isCallExpression(node)) return Number(node.getText(sourceFile));
    const inputs=node.arguments[1].elements.map(e=>Number(e.getText(sourceFile)));
    const values=node.arguments[2].elements.map(e=>Number(e.getText(sourceFile)));
    assert.match(node.getText(sourceFile),/Easing.bezier/);
    return interpolate(frame,inputs,values,{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.bezier(1/3,0,2/3,1)});
  };
  const span=(index,prop)=>layers[index][prop].expression.arguments[1].elements.map(e=>Number(e.getText(sourceFile)));
  // Studio may retime each layer independently; compare normalized progress,
  // not the original absolute frame positions or original durations.
  for(const [forward,reverse,prop] of [
    [9,11,"feedbackTime"], [5,12,"shortening"], [4,13,"rotationZ"],
    [2,14,"rotationY"], [0,15,"rotationX"],
  ]) {
    const [fs,fe]=span(forward,prop), [rs,re]=span(reverse,prop);
    for(let step=0;step<=50;step++) {
      const p=step/50;
      assert.ok(Math.abs(at(forward,prop,fe-(fe-fs)*p)-at(reverse,prop,rs+(re-rs)*p))<1e-9,`${prop} reversed at progress ${p}`);
    }
  }
  assert.equal(layers.length,17);
  let previous=-1;
  for(let i=11;i<layers.length;i++) {
    assert.ok(number(layers[i].from)>=previous);
    assert.ok(number(layers[i].durationInFrames)>0);
    previous=number(layers[i].from);
    assert.equal(layers[i].opacity,undefined);
  }
  const [depthStart,depthEnd]=span(14,"thickness");
  assert.equal(at(14,"thickness",depthStart),10);
  assert.equal(at(14,"thickness",depthEnd),0);
  const [foldStart,foldEnd]=span(15,"rotationX");
  assert.equal(at(15,"rotationX",foldStart),0);
  assert.equal(at(15,"rotationX",foldEnd),90);
  assert.equal(at(16,"rotationX",number(layers[16].from)),90);
});


test("analysis grows before moving, shrinks during both moves, and preserves the latter half", async () => {
  const {analysisRayTransform} = await load("analysisGeometry");
  const {analysisCircle} = await load("../taste-motion");
  const anchors={top:analysisCircle(0),arrival:analysisCircle(1.5)};
  const outer=334.4213227, inner=outer/4, ratio=outer/316;
  const pose=t=>analysisRayTransform(t,analysisCircle(t),0,outer,inner,anchors);
  for (const t of [0,0.06,0.12,0.18]) {
    assert.ok(Math.abs(pose(t).dx)<1e-9 && Math.abs(pose(t).dy)<1e-9);
  }
  for(const [from,to,growing] of [[0,0.18,true],[0.18,0.55,false],[0.55,0.8,true],[0.8,1.5,false]]) {
    let previous=pose(from).radius;
    for(let i=1;i<=30;i++) {
      const r=pose(from+(to-from)*i/30).radius;
      assert.ok(growing?r>=previous-1e-9:r<=previous+1e-9);
      previous=r;
    }
  }
  const top=pose(0.55);
  assert.ok(top.dy<0);
  for(const t of [0.6,0.7,0.8]) {
    assert.ok(Math.hypot(pose(t).dx-top.dx,pose(t).dy-top.dy)<1e-9);
  }
  assert.ok(pose(1.5).dx>0 && pose(1.5).dy>0);
  const ease=v=>{const t=Math.min(1,Math.max(0,v));return t*t*(3-2*t);};
  for(let i=0;i<=90;i++) {
    const t=1.5+i/60, circle=analysisCircle(t), amount=ease(t/0.4)*ease((3-t)/0.4), p=pose(t);
    assert.equal(p.dx,(circle.x-320)*ratio*amount);
    assert.equal(p.dy,(circle.y-320)*ratio*amount);
    assert.equal(p.radius,inner+(circle.radius-79)*ratio*amount);
  }
});

test("closing layers cover every final frame once and leave only the authored 15-frame hold", async () => {
  const text=await readFile(new URL("../src/PetalLogo/PetalLogo.tsx",import.meta.url),"utf8");
  const jsx=ts.createSourceFile("PetalLogo.tsx",text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const tail=[];
  const visit=node=>{
    if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(jsx)==="PetalLayer") {
      const attrs=Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).map(a=>[a.name.getText(jsx),a.initializer]));
      if(Number(attrs.name.text.match(/^\d+/)[0])>=12) tail.push({start:Number(attrs.from.expression.text),length:Number(attrs.durationInFrames.expression.text)});
    }
    ts.forEachChild(node,visit);
  };
  visit(jsx);
  const registration=await readFile(new URL("../src/PetalLogo/index.tsx",import.meta.url),"utf8");
  const duration=Number(registration.match(/"영상 길이": (\d+)/)[1]);
  for(let f=tail[0].start;f<duration;f++) assert.equal(tail.filter(l=>f>=l.start&&f<l.start+l.length).length,1,`closing frame ${f}`);
  assert.equal(tail.at(-1).length,15);
  assert.equal(tail.at(-1).start+15,duration);
});
