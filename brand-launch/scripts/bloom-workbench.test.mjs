import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import ts from "typescript";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {SourceBloomAvatar,sortTasteProfile} from "../src/TasteBloomWorkbench/source-avatar.generated.js";
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const cache=new Map();
function load(file){
  if(cache.has(file))return cache.get(file);
  const {outputText}=ts.transpileModule(fs.readFileSync(file,"utf8"),{fileName:file,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}});
  const module={exports:{}};
  const localRequire=(name)=>{
    if(name.endsWith(".css"))return {};
    if(name==="../ui/utils")return {cn:(...values)=>values.filter(Boolean).join(" ")};
    if(!name.startsWith("."))return require(name);
    const base=path.resolve(path.dirname(file),name);
    const found=[base,base+".ts",base+".tsx"].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
    if(!found)throw new Error(name);
    return load(found);
  };
  new Function("require","module","exports",outputText)(localRequire,module,module.exports);
  cache.set(file,module.exports);
  return module.exports;
}
const original=load(path.join(root,"src/components/system/PalateBloomAvatar.tsx")).default;
test("terminology changes preserve existing seeded avatar SVGs",()=>{
  const {fixtures}=JSON.parse(fs.readFileSync(new URL("./fixtures/bloom-terminology-baseline.json",import.meta.url),"utf8"));
  for(const {profile,shapeSeed,svgSha256} of fixtures){
    for(const Component of [original,SourceBloomAvatar]){
      const markup=renderToStaticMarkup(React.createElement(Component,{profile,shapeSeed:shapeSeed??undefined,showFrame:false,size:96}));
      assert.equal(createHash("sha256").update(markup).digest("hex"),svgSha256,`avatar identity changed for ${shapeSeed??"profile-derived seed"}`);
    }
  }
});
const baseline={sweet:85,sour:72,bitter:41,salty:63,umami:54,fat:38};
const round={petalShape:"roundPetal",stamenShape:"thinStamen",pistilShape:"solidPistil"};
const render=(Component,profile,shape=round)=>renderToStaticMarkup(React.createElement(Component,{profile,...shape,shapeCountOverride:4,size:440,showFrame:false}));
test("live SVG matches the original app for all 36 shape combinations and edge scores",()=>{
  const profiles=[baseline,{...baseline,sour:100},{...baseline,sweet:20},Object.fromEntries(Object.keys(baseline).map(key=>[key,0])),Object.fromEntries(Object.keys(baseline).map(key=>[key,50])),Object.fromEntries(Object.keys(baseline).map(key=>[key,100]))];
  for(const petalShape of ["roundPetal","capsulePetal","softDiamondPetal","serratedTipPetal"])
    for(const stamenShape of ["thinStamen","roundedSpokeStamen","dottedRayStamen"])
      for(const pistilShape of ["solidPistil","diamondPistil","seedCluster"])
        for(const profile of profiles){
          const actual=render(SourceBloomAvatar,profile,{petalShape,stamenShape,pistilShape});
          assert.equal(actual,render(original,profile,{petalShape,stamenShape,pistilShape}));
          assert.doesNotMatch(actual,/NaN|Infinity/);
        }
});
test("ranking changes colours and score separation changes radius without changing selected forms",()=>{
  assert.equal(sortTasteProfile(baseline)[0].taste,"sweet");
  assert.equal(sortTasteProfile({...baseline,sour:100})[0].taste,"sour");
  const paintedRadii=(markup)=>[...markup.matchAll(/<circle\b[^>]*fill="[^"]*"[^>]*r="([\d.]+)"/g)].map(match=>Number(match[1]));
  const before=paintedRadii(render(SourceBloomAvatar,baseline));
  const after=paintedRadii(render(SourceBloomAvatar,{...baseline,sweet:100}));
  assert.equal(before.length,after.length);
  assert.equal(before[0],after[0]);
  assert.ok(after[1]<before[1],"higher leading score reveals more background");
});
