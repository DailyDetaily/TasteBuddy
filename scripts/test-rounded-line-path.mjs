import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-rounded-line-'));
const modulePath = path.join(dir, 'geometry.mjs');
await build({entryPoints: ['src/components/system/roundedLinePath.ts'], bundle: true, platform: 'node', format: 'esm', outfile: modulePath, logLevel: 'silent'});
const { roundedLineCorners, roundedLineMarkers, buildRoundedLinePath } = await import(modulePath);
after(() => rm(dir, {recursive: true, force: true}));
const xy = (pairs) => pairs.map(([x, y]) => ({x, y}));
const fixtures = [[], xy([[6,28]]), xy([[6,28],[46,28],[86,28],[126,28]]),
  xy([[6,42],[46,34],[86,32],[126,14]]), xy([[6,14],[46,32],[86,34],[126,42]]),
  xy([[6,42],[46,14],[86,42],[126,14]]), xy([[0,0],[1,10],[2,0],[3,10]]),
  xy([[6,28],[6,28],[46,20],[86,20]])];
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`);

test('fixed circular corners preserve endpoints, source values, tangent continuity and bounded trim', () => {
  for (const points of fixtures) {
    const before = structuredClone(points);
    const corners = roundedLineCorners(points);
    const markers = roundedLineMarkers(points);
    assert.doesNotMatch(buildRoundedLinePath(points), /NaN|Infinity/);
    assert.deepEqual(points, before);
    assert.deepEqual(markers[0], points[0]);
    assert.deepEqual(markers.at(-1), points.at(-1));
    corners.forEach((corner, i) => {
      if (!corner) return;
      assert.ok(corner.radius <= 12 && corner.radius > 0);
      const incoming = {x: points[i].x - points[i-1].x, y: points[i].y - points[i-1].y};
      const outgoing = {x: points[i+1].x - points[i].x, y: points[i+1].y - points[i].y};
      assert.ok(Math.hypot(points[i].x-corner.entry.x, points[i].y-corner.entry.y) <= Math.hypot(incoming.x,incoming.y)/2 + 1e-8);
      assert.ok(Math.hypot(points[i].x-corner.exit.x, points[i].y-corner.exit.y) <= Math.hypot(outgoing.x,outgoing.y)/2 + 1e-8);
      for (const point of [corner.entry,corner.exit,markers[i]]) near(Math.hypot(point.x-corner.center.x,point.y-corner.center.y),corner.radius);
      near((corner.entry.x-corner.center.x)*incoming.x+(corner.entry.y-corner.center.y)*incoming.y,0);
      near((corner.exit.x-corner.center.x)*outgoing.x+(corner.exit.y-corner.center.y)*outgoing.y,0);
      near(markers[i].x,points[i].x);
    });
    assert.equal((buildRoundedLinePath(points).match(/ A /g)??[]).length,corners.filter(Boolean).length);
    assert.equal((buildRoundedLinePath(points,12,true).match(/ C /g)??[]).length,corners.filter(Boolean).length);
  }
});

test('the actual Swift helper matches web circular fillets for the same layouts', {skip: process.platform !== 'darwin'}, async () => {
  const source = await readFile('ios/TasteBuddy/Components/SystemParityComponents.swift','utf8');
  const native = source.slice(source.indexOf('enum TasteLineRounding {'), source.indexOf('/// 홈 카드의 고정 크기 미니 그래프.'));
  assert.ok(native.includes('path.addArc'));
  const main = path.join(dir,'main.swift');
  await writeFile(main, `import SwiftUI\n${native}\n
let rows = try JSONSerialization.jsonObject(with: FileHandle.standardInput.readDataToEndOfFile()) as! [[[String:Double]]]
let output: [[Any]] = rows.map { row in
  let points = row.map { CGPoint(x: $0["x"]!, y: $0["y"]!) }
  _ = TasteLineRounding.path(points).cgPath
  let markers = TasteLineRounding.markers(points)
  return TasteLineRounding.corners(points).enumerated().map { index, corner -> Any in
    guard let c = corner else { return NSNull() }
    return ["entry":["x":c.entry.x,"y":c.entry.y],"exit":["x":c.exit.x,"y":c.exit.y],"radius":c.radius,"marker":["x":markers[index].x,"y":markers[index].y]] as [String:Any]
  }
}
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: output))
`);
  const binary = path.join(dir,'geometry');
  execFileSync('xcrun',['swiftc',main,'-o',binary],{timeout:120000});
  const actual=JSON.parse(execFileSync(binary,{input:JSON.stringify(fixtures),encoding:'utf8'}));
  fixtures.forEach((points,index)=>roundedLineCorners(points).forEach((corner,i)=>{
    if (!corner) return assert.equal(actual[index][i],null);
    near(actual[index][i].radius,corner.radius);
    for(const key of ['entry','exit','marker']) for(const axis of ['x','y']) near(actual[index][i][key][axis],corner[key][axis]);
  }));
});
