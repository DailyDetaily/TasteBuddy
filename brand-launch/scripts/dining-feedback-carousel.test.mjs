import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { computeCanUpdateDefaultPropsFromContent } = require('@remotion/studio-codemods');
const source = await readFile(new URL('../src/DiningFeedbackMotion/carousel-motion.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { carouselPose, carouselTiming, relativeCardPosition, referenceProgress, cardOpacity, mixHex } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const root = await readFile(new URL('../src/Root.tsx', import.meta.url), 'utf8');
const configs = ['Result', 'Card', 'Gradient'].map(name => computeCanUpdateDefaultPropsFromContent(root, `DiningFeedback-${name}`));
const props = configs[0].currentDefaultProps;

test('all three layers are editable and use the same six existing dishes and six colors', async () => {
 for (const config of configs) { assert.equal(config.canUpdate, true); assert.deepEqual(config.currentDefaultProps, props); }
 assert.equal(props.카드.length, 6);
 assert.equal(new Set(props.카드.map(card => card['메인 컬러'])).size, 6);
 assert.equal(new Set(props.카드.map(card => card['사진 경로'])).size, 6);
 for (const card of props.카드) await access(new URL(`../public/${card['사진 경로']}`, import.meta.url));
});
test('each dish holds in the center before moving, and background selects that dish', () => {
 const { segment, hold } = carouselTiming(props);
 for(let i=0; i<6; i++) for(const offset of [0, Math.max(0, hold - 1)]) {
  const pose = carouselPose(i*segment+offset, props);
  assert.equal(relativeCardPosition(i, pose.position), 0);
  assert.equal(pose.from, i); assert.equal(pose.blend, 0);
 }
});
test('reference curve matches measured clip positions and moves without reversal', () => {
 const samples=[[0,0],[0.1,0.006],[0.2,0.022],[0.3,0.057],[0.4,0.143],[0.5,0.506],[0.6,0.857],[0.7,0.939],[0.8,0.980],[0.9,0.994],[1,1]];
 for(const [time,measured] of samples) assert.ok(Math.abs(referenceProgress(time)-measured)<0.009);
 const values=Array.from({length:101},(_,i)=>referenceProgress(i/100));
 assert.equal(values[0],0);assert.equal(values[100],1);
 for(let i=1;i<values.length;i++) assert.ok(values[i]>=values[i-1] && values[i]<=1);
 assert.equal(carouselTiming(props).durationInFrames,450);
});
test('center emphasis fades continuously to the neighboring cards', () => {
 assert.equal(cardOpacity(0,0.35),1);
 assert.equal(cardOpacity(1,0.35),0.35);assert.equal(cardOpacity(-2,0.35),0.35);
 assert.equal(cardOpacity(0.5,0.35),cardOpacity(-0.5,0.35));
 assert.ok(cardOpacity(0.25,0.35)>cardOpacity(0.75,0.35));
});
test('first and final frames have identical card positions and background phase', () => {
 const first=carouselPose(0,props); const last=carouselPose(carouselTiming(props).durationInFrames-1,props);
 for(let i=0;i<6;i++) assert.equal(relativeCardPosition(i,first.position),relativeCardPosition(i,last.position));
 assert.equal(first.elapsed,last.elapsed); assert.equal(first.from,last.to); assert.equal(last.blend,1);
 assert.equal(mixHex('#FF9900','#FBC02D',0),'#ff9900'); assert.equal(mixHex('#FF9900','#FBC02D',1),'#fbc02d');
});
test('static mode stays on the selected dish; custom timings preserve the loop', () => {
 const fixed={...props,재생:'정지','정지 카드':4};
 assert.deepEqual(carouselPose(0,fixed),carouselPose(400,fixed));
 for(const fps of [24,30,60]) for(const move of [0.6,1,2]) {
  const settings={...props,'스크롤 시간':move,'카드 유지 시간':0.5};
  const t=carouselTiming(settings,fps); const last=carouselPose(t.durationInFrames-1,settings,fps);
  assert.equal(last.position,6); assert.equal(last.blend,1);
 }
});
