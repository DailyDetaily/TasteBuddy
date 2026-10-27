import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tb-area-rounding-'));
const out=path.join(dir,'geometry.mjs');
await build({entryPoints:['src/components/system/plating/roundedAreaPath.ts'],bundle:true,platform:'node',format:'esm',outfile:out,logLevel:'silent'});
const {buildRoundedAreaPath,roundedAreaCornerSegments}=await import(out);
after(()=>fs.rm(dir,{recursive:true,force:true}));
const polygon=top=>[...top,{x:top.at(-1).x,y:56},{x:top[0].x,y:56}];
const fixtures=[
  polygon([{x:0,y:43},{x:44,y:31},{x:88,y:27},{x:132,y:0}]),
  polygon([{x:0,y:43},{x:44,y:31},{x:88,y:43},{x:132,y:43}]),
  polygon([{x:44,y:30},{x:88,y:4}]),
  polygon([{x:44,y:30},{x:66,y:15},{x:88,y:4}]),
  polygon([{x:0,y:54},{x:2,y:51},{x:4,y:54}]),
  polygon([{x:0,y:43},{x:44,y:43},{x:88,y:43},{x:132,y:43}]),
];
const numbers=s=>s.match(/-?\d+(?:\.\d+)?/g).map(Number);
test('missing-data runs keep their own outer R6 corners independent of their horizontal position',()=>{
  const run=fixtures[2];
  const translated=run.map(p=>({x:p.x-44,y:p.y}));
  const a=roundedAreaCornerSegments(run), b=roundedAreaCornerSegments(translated);
  assert.equal(a.length,b.length);
  a.forEach((s,i)=>{
    const av=numbers(s),bv=numbers(b[i]);
    av.forEach((v,j)=>assert.ok(Math.abs(v-bv[j]-(j%2===0?44:0))<0.00011));
  });
});
test('interior rounding stays finite and never consumes more than half either adjacent edge',()=>{
  fixtures.forEach(points=>roundedAreaCornerSegments(points).forEach((segment,i)=>{
    assert.doesNotMatch(segment,/NaN|Infinity/);
    if(!segment.includes(' C '))return;
    const v=numbers(segment), p=points[i],a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];
    assert.ok(Math.hypot(v[0]-p.x,v[1]-p.y)<=Math.hypot(a.x-p.x,a.y-p.y)/2+0.0001);
    assert.ok(Math.hypot(v.at(-2)-p.x,v.at(-1)-p.y)<=Math.hypot(b.x-p.x,b.y-p.y)/2+0.0001);
  }));
});
test('SwiftUI and web produce the same cubic paths for full, concave, missing and short runs',{skip:process.platform!=='darwin'},async()=>{
  const source=await fs.readFile('ios/TasteBuddy/Components/RecordMiniCharts.swift','utf8');
  const start=source.indexOf('    static func roundedPolygon(');
  let end=source.indexOf('{',start),depth=1;
  for(end++;depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
  const method=source.slice(start,end);
  const main=path.join(dir,'main.swift'), binary=path.join(dir,'native');
  await fs.writeFile(main,`import SwiftUI
struct Subject {\n${method}\n}
let rows = try JSONSerialization.jsonObject(with: FileHandle.standardInput.readDataToEndOfFile()) as! [[[String: Double]]]
let output = rows.map { row -> [[String: Any]] in
  let points = row.map { CGPoint(x: $0["x"]!, y: $0["y"]!) }
  var ops: [[String: Any]] = []
  Subject.roundedPolygon(points, radius: 6).cgPath.applyWithBlock { ptr in
    let element = ptr.pointee
    let kind: String, count: Int
    switch element.type {
    case .moveToPoint: kind = "M"; count = 1
    case .addLineToPoint: kind = "L"; count = 1
    case .addCurveToPoint: kind = "C"; count = 3
    case .closeSubpath: kind = "Z"; count = 0
    default: kind = "Q"; count = 2
    }
    ops.append(["type": kind, "values": (0..<count).flatMap { [element.points[$0].x, element.points[$0].y] }])
  }
  return ops
}
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: output))
`);
  execFileSync('xcrun',['swiftc',main,'-o',binary],{timeout:120000});
  const native=JSON.parse(execFileSync(binary,{input:JSON.stringify(fixtures),encoding:'utf8'}));
  fixtures.forEach((points,index)=>{
    const ops=[...buildRoundedAreaPath(points).matchAll(/([MLCZ])([^MLCZ]*)/g)].map(m=>({type:m[1],values:m[1]==='Z'?[]:numbers(m[2])}));
    assert.equal(ops.length,native[index].length);
    ops.forEach((op,i)=>{assert.equal(op.type,native[index][i].type);op.values.forEach((v,j)=>assert.ok(Math.abs(v-native[index][i].values[j])<0.00011));});
  });
});
