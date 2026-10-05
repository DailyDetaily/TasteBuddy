import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const {flipTiming,flipPose}=require('../src/DiningFeedbackMotion/flip-motion.ts');
const {computeCanUpdateDefaultPropsFromContent}=require('@remotion/studio-codemods');
const root=fs.readFileSync(new URL('../src/Root.tsx',import.meta.url),'utf8');
const config=computeCanUpdateDefaultPropsFromContent(root,'DiningFeedback-Flip');
const props=config.currentDefaultProps;
const t=flipTiming(props);
test('flip is independently editable and preserves all six carousel dishes',()=>{
 assert.equal(config.canUpdate,true);
 const carousel=computeCanUpdateDefaultPropsFromContent(root,'DiningFeedback-Result').currentDefaultProps;
 const contentOnly = cards => cards.map(({ "주색 영역 비중": coverage, ...content }) => content);
 assert.deepEqual(contentOnly(props.카드),contentOnly(carousel.카드));assert.equal(t.durationInFrames,414);
 assert.equal(carousel['스크롤 시간'],2.5);assert.equal(carousel['주변 카드 불투명도'],1);
});
test('each old face folds edge-on before its replacement opens',()=>{
 for(let i=0;i<6;i++){
  const start=i*t.segment;
  assert.equal(flipPose(start,props).cardIndex,i);assert.equal(flipPose(start+t.hold-1,props).rotation,0);
  const outgoing=flipPose(start+t.hold+t.fold-1,props);const incoming=flipPose(start+t.hold+t.fold,props);
  assert.equal(outgoing.cardIndex,i);assert.equal(incoming.cardIndex,(i+1)%6);
  assert.equal(Math.abs(outgoing.rotation),90);assert.equal(incoming.rotation,-outgoing.rotation);
  assert.equal(flipPose(start+t.segment-1,props).rotation,0);
 }
});
test('left, right and alternating choices set horizontal rotation signs',()=>{
 const middle=t.hold+3;
 assert.ok(flipPose(middle,{...props,'플립 방향':'왼쪽'}).rotation<0);
 assert.ok(flipPose(middle,{...props,'플립 방향':'오른쪽'}).rotation>0);
 const alternating={...props,"플립 방향":"좌우 번갈아"};
 assert.ok(flipPose(middle,alternating).rotation*flipPose(middle+t.segment,alternating).rotation<0);
 for(let i=0;i<6;i++) assert.ok(flipPose(middle+i*t.segment,props).rotation<0);
});
test('faces never turn beyond edge-on and first/final appearance matches',()=>{
 for(let f=0;f<t.durationInFrames;f++)assert.ok(Math.abs(flipPose(f,props).rotation)<=90);
 const first=flipPose(0,props),last=flipPose(t.durationInFrames-1,props);
 assert.equal(first.cardIndex,last.cardIndex);assert.equal(first.rotation,last.rotation);assert.equal(first.elapsed,last.elapsed);assert.equal(last.blend,1);
});
test('static preview freezes the selected face and background',()=>{
 const fixed={...props,재생:'정지','정지 카드':3};assert.deepEqual(flipPose(0,fixed),flipPose(200,fixed));assert.equal(flipPose(0,fixed).cardIndex,2);
});
