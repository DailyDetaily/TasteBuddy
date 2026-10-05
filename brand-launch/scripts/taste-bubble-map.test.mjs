import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,dir,load,layout,motion,settings,dist,gapStats,visible} from './bubble-grid-test-helpers.mjs';

const {BASE_BUBBLES,MAP,GRID_GUARD_WORLD,buildBubbleGrid,hexPoint,hexCell,hexRing,axisAtCell,expandBubbleGrid,bubbleLabelLines}=layout;
const {bubbleMapFrame,bubbleMapDuration,bubbleEntrance,bubbleDrift,focusAttenuation,INTRO_SECONDS,MAIN_DEMO_SECONDS,LOOP_SECONDS,DEMO_IDS,FULL_MAP_ZOOM}=motion;
const {bubbleMapDefaults: standard,bubbleMapSchema}=settings;
const idle={...standard,재생:'대기 루프'};
const reduced={...standard,재생:'모션 줄이기'};
const {nativeContentSpring,nativeVeilOpacity,NATIVE_SHEET_SETTLING,NATIVE_CONTENT_SETTLING,NATIVE_SHEET_SAMPLES}=load(path.join(dir,'native-spring.ts'));
const fixture=JSON.parse(fs.readFileSync(path.join(root,'../ios/TasteBuddy/Resources/Fixtures/dining-feedback-scenario.json'),'utf8'));
const native=JSON.parse(fs.readFileSync(path.join(root,'output/taste-bubble-map/native-layout.json'),'utf8'));
const at=(seconds,props=standard)=>bubbleMapFrame((INTRO_SECONDS+seconds)*30,props);
const center={x:MAP.center,y:MAP.center};
const {FINALE,rotateMapPoint,finaleState,reverseBubbleExit}=load(path.join(dir,'finale.ts'));
const HOLD_TIME=(FINALE.settled+FINALE.exitStart)/2;
const drawn=state=>visible(state).filter(b=>b.renderOpacity>0.01&&b.screenRadius>0.001);

function assertCoverage(state) {
  if(state.finalePhase==='blank'){
    assert.equal(state.bubbles.length,0);return;
  }
  const cells=new Set(state.bubbles.map(b=>`${b.q}:${b.r}`));
  const half=MAP.viewport/(2*state.zoom)+MAP.diameter/2;
  const radians=state.rotationDegrees*Math.PI/180;
  const c=Math.cos(radians),sin=Math.sin(radians);
  const bound=half*(Math.abs(c)+Math.abs(sin));
  const rowHeight=MAP.spacing*Math.sqrt(3)/2;
  const rMin=Math.ceil((state.camera.y-bound-MAP.center)/rowHeight);
  const rMax=Math.floor((state.camera.y+bound-MAP.center)/rowHeight);
  for(let r=rMin;r<=rMax;r++){
    const qMin=Math.ceil((state.camera.x-bound-MAP.center)/MAP.spacing-r/2);
    const qMax=Math.floor((state.camera.x+bound-MAP.center)/MAP.spacing-r/2);
    for(let q=qMin;q<=qMax;q++){
      if(q===0&&r===0)continue;
      const point=hexPoint(q,r),dx=point.x-state.camera.x,dy=point.y-state.camera.y;
      if(Math.abs(dx*c-dy*sin)>half||Math.abs(dx*sin+dy*c)>half)continue;
      assert.ok(cells.has(`${q}:${r}`),`missing rotated-view cell ${q}:${r}, time=${state.loopSeconds}`);
    }
  }
}

test('all 72 native labels, axes, exact coordinates and spring delays are preserved',()=>{
  const words=fixture.tasteExperienceAxes.flatMap(axis=>axis.words.map(word=>({id:`${axis.id}-${word.key}`,label:word.label})));
  assert.equal(BASE_BUBBLES.length,72);
  assert.deepEqual(BASE_BUBBLES.map(({id,label})=>({id,label})),words);
  for(const b of BASE_BUBBLES){
    const n=native.find(p=>p.id===b.id);
    assert.ok(n);assert.ok(dist(b,n)<1e-6);assert.equal(b.diameter,n.diameter);
    assert.ok(Math.abs(b.introDelay-n.introDelay)<1e-8);
    assert.equal(axisAtCell(b.q,b.r),b.axis);
  }
});

test('native and added cells occupy one exact 126 / 136 hex grid with no duplicates',()=>{
  for(const zoom of [1,MAP.entryZoom,.5,FULL_MAP_ZOOM]){
    const grid=buildBubbleGrid(center,zoom),cells=new Set();
    for(const b of grid){
      const key=`${b.q}:${b.r}`;assert.ok(!cells.has(key));cells.add(key);
      assert.equal(b.diameter,126);assert.ok(dist(b,hexPoint(b.q,b.r))<1e-5);
      assert.deepEqual(hexCell(b),{q:b.q,r:b.r});
    }
    assert.ok(!cells.has('0:0'),'intentional center void must stay empty');
    // Fill the 18 missing perimeter cells, but never the center.
    assert.equal(grid.filter(b=>b.kind==='extended'&&hexRing(b.q,b.r)<=5).length,18);
  }
});

test('added labels and colors remain on their original taste-axis sector',()=>{
  const grid=buildBubbleGrid(center,FULL_MAP_ZOOM);
  const labels=new Map(fixture.tasteExperienceAxes.map(axis=>[axis.id,new Set(axis.words.map(w=>w.label))]));
  for(const b of grid){assert.equal(b.axis,axisAtCell(b.q,b.r));assert.ok(labels.get(b.axis).has(b.label));}
  for(const axis of labels.keys())assert.ok(grid.filter(b=>b.axis===axis).length>100);
});

test('cell identities and labels stay stable when the camera pans or zooms',()=>{
  const first=buildBubbleGrid(center,1),byId=new Map(first.map(b=>[b.id,b]));
  for(const camera of [{x:780,y:810},{x:500,y:722},{x:976,y:840}]){
    for(const b of buildBubbleGrid(camera,.86))if(byId.has(b.id))assert.deepEqual(b,byId.get(b.id));
  }
});

test('focused views use a small local pool; zoom-out generates only visible cells plus guard rows',()=>{
  for(const t of [0,2.4,3.4,5.6,6.5,8.8,9.8,10.8,12.8]){
    const s=at(t);assert.ok(s.activeCellCount<=230,`too many active cells: ${s.activeCellCount}`);
    assert.ok(s.addedCellCount<=158);assert.equal(s.bubbles.length,s.activeCellCount);assertCoverage(s);
  }
  const full=at(HOLD_TIME);
  assert.ok(full.activeCellCount>1800&&full.activeCellCount<2500);
  assert.equal(full.physicsCellCount,0,'settled small map must not run packing physics');
  assert.ok(visible(full).length>1800);
  assertCoverage(full);
  assert.ok(GRID_GUARD_WORLD<400);
});

test('no permanent 3960-item atlas or separate transform path is imported',()=>{
  const source=fs.readFileSync(path.join(dir,'layout.ts'),'utf8');
  const motionSource=fs.readFileSync(path.join(dir,'motion.ts'),'utf8');
  const renderer=fs.readFileSync(path.join(dir,'TasteBubbleMap.tsx'),'utf8');
  assert.ok(!source.includes('TBA_ATLAS_BUBBLES'));
  assert.ok(!motionSource.includes('const extendedPushScale'));
  assert.ok(!motionSource.includes('const nativePositions'));
  assert.ok(!renderer.includes('TBA_ATLAS_BUBBLES.map'));
  assert.ok(fs.statSync(path.join(dir,'tba-atlas.ts')).size<1000);
});

test('native spring entrance and white veil remain intact; added cells exist from the start',()=>{
  const first=bubbleMapFrame(0,standard);
  assert.ok(first.bubbles.filter(b=>b.kind==='native').every(b=>b.entrance===0));
  assert.ok(first.bubbles.filter(b=>b.kind==='extended').every(b=>b.entrance===1));
  assert.equal(first.atlasReveal,1);assert.equal(first.veilOpacity,1);
  assert.equal(bubbleMapFrame(5,standard).veilOpacity,1);
  const frame6=bubbleMapFrame(6,standard);assert.ok(frame6.veilOpacity>0&&frame6.veilOpacity<1);
  const settledFrame=Math.ceil(INTRO_SECONDS*30);
  assert.ok(bubbleMapFrame(settledFrame,standard).bubbles.every(b=>b.entrance===1));
  const earliest=BASE_BUBBLES.reduce((a,b)=>a.introDelay<b.introDelay?a:b);
  assert.equal(bubbleEntrance(earliest.introDelay,earliest),0);
  assert.ok(bubbleEntrance(earliest.introDelay+.43,earliest)>1);
  assert.equal(bubbleEntrance(earliest.introDelay+NATIVE_SHEET_SETTLING,earliest),1);
  assert.ok(Math.max(...NATIVE_SHEET_SAMPLES)>1.011);
  assert.ok(nativeContentSpring(.3)>1);assert.equal(nativeVeilOpacity(.18),1);
  assert.equal(nativeVeilOpacity(.18+NATIVE_CONTENT_SETTLING),0);
});

test('three selections do not multiply the entire grid displacement',()=>{
  const grid=buildBubbleGrid(center,1);
  const anchors=DEMO_IDS.map(id=>({...grid.find(b=>b.id===id),amount:1}));
  const moved=expandBubbleGrid(grid,anchors);
  for(let i=0;i<moved.length;i++)assert.ok(dist(moved[i],grid[i])<=19.00001,'radial seed exceeds one radius increment');
});

test('selected bubbles expand to 164, stay centered and preserve up to three priorities',()=>{
  [3.4,6.5,9.8].forEach((time,i)=>{
    const s=at(time),focus=s.bubbles.find(b=>b.id===DEMO_IDS[i]);
    assert.equal(s.bubbles.filter(b=>b.selected>.999).length,i+1);
    assert.equal(focus.diameter,164);assert.equal(focus.priority,i);assert.equal(focus.fillOpacity,1);
    assert.ok(Math.hypot(focus.screenX-360,focus.screenY-360)<1e-7);
  });
});

test('one spacing solver repels both native and added bubbles without overlap',()=>{
  for(const t of [0,2.4,3.4,5.6,6.5,8.8,9.8,10.8,12.4,12.8,13.2,HOLD_TIME]){
    const s=at(t),gaps=gapStats(s.bubbles);
    assert.ok(gaps.minimum>=9.95,`gap=${gaps.minimum} ${gaps.pair} time=${t}`);
    assert.ok(gaps.crossKindMinimum>=9.95);
  }
  const unselected=at(0),selected=at(9.8),before=new Map(unselected.bubbles.map(b=>[b.id,b]));
  assert.ok(selected.bubbles.filter(b=>b.kind==='extended'&&before.has(b.id)).some(b=>dist(b,before.get(b.id))>.5));
});

test('all final neighbor gaps return to exactly ten and the full-frame grid stops',()=>{
  const s=at(HOLD_TIME),byCell=new Map(s.bubbles.map(b=>[`${b.q}:${b.r}`,b]));
  for(const b of s.bubbles){
    assert.equal(b.diameter,126);assert.equal(b.labelOpacity,1);assert.equal(b.selected,0);
    assert.ok(dist(b,hexPoint(b.q,b.r))<1e-5);
    for(const [dq,dr] of [[1,0],[0,1],[-1,1]]){
      const neighbor=byCell.get(`${b.q+dq}:${b.r+dr}`);
      if(neighbor)assert.ok(Math.abs(dist(b,neighbor)-136)<1e-5);
    }
  }
  assert.deepEqual(s.bubbles,at(16.3).bubbles);
  assert.equal(s.focusID,null);assert.equal(s.zoom,FULL_MAP_ZOOM);
});

test('deselection happens before shrinking and keeps all taste-word labels',()=>{
  const large=at(11.8);assert.ok(large.bubbles.every(b=>b.selected<.001&&b.highlight<.001));
  assert.ok(DEMO_IDS.every(id=>large.bubbles.find(b=>b.id===id).diameter===164));
  const centered=at(12.4);assert.deepEqual(centered.camera,center);
  const shrunk=at(13.2);assert.deepEqual(shrunk.camera,center);
  assert.ok(DEMO_IDS.every(id=>Math.abs(shrunk.bubbles.find(b=>b.id===id).diameter-126)<1e-8));
  const renderer=fs.readFileSync(path.join(dir,'TasteBubbleMap.tsx'),'utf8');
  assert.ok(renderer.includes('opacity={b.labelOpacity}'));
  assert.ok(!renderer.includes('b.labelOpacity * (1 -'));
});

test('rotated full-frame viewport has no missing grid cells at any corner',()=>{
  const s=at(HOLD_TIME);assertCoverage(s);
  const half=MAP.viewport/(2*s.zoom);
  for(const [x,y] of [[-half,-half],[half,-half],[-half,half],[half,half]]){
    const unrotated=rotateMapPoint({x:MAP.center+x,y:MAP.center+y},-s.rotationDegrees);
    const cell=hexCell(unrotated);
    assert.ok(s.bubbles.some(b=>b.q===cell.q&&b.r===cell.r));
  }
  assert.ok(s.bubbles.some(b=>b.screenX<0));assert.ok(s.bubbles.some(b=>b.screenX>720));
  assert.ok(s.bubbles.some(b=>b.screenY<0));assert.ok(s.bubbles.some(b=>b.screenY>720));
});

test('loop seam, seeking and reduced motion are deterministic',()=>{
  assert.deepEqual(bubbleMapFrame(0,idle),bubbleMapFrame(LOOP_SECONDS*30,idle));
  assert.deepEqual(bubbleMapFrame(0,reduced),bubbleMapFrame(60,reduced));
  for(const b of BASE_BUBBLES)assert.deepEqual(bubbleDrift(0,b.id),bubbleDrift(LOOP_SECONDS,b.id));
  for(const f of [345,52,480,153]){
    const before=bubbleMapFrame(f,standard);bubbleMapFrame(210,standard);
    assert.deepEqual(before,bubbleMapFrame(f,standard));
  }
});

test('distance fading is symmetric and full-map labels never fade out',()=>{
  let previous=1;
  for(let d=0;d<=1000;d++){const value=focusAttenuation(d);assert.ok(value<=previous+1e-10&&value>=.2);previous=value;}
  for(const [x,y] of [[200,0],[-200,0],[0,200],[0,-200]])assert.equal(focusAttenuation(Math.hypot(x,y)),focusAttenuation(200));
  assert.ok(at(HOLD_TIME).bubbles.every(b=>b.labelOpacity===1&&b.fillOpacity===1));
});

test('all frames keep coverage and new viewport cells never pop in on-screen',()=>{
  let previous=null,maxStep=0,maxFocusCells=0;
  for(let frame=0;frame<bubbleMapDuration(standard);frame++){
    const s=bubbleMapFrame(frame,standard);assertCoverage(s);
    if(s.zoom>=.86)maxFocusCells=Math.max(maxFocusCells,s.activeCellCount);
    for(const b of s.bubbles){
      assert.ok([b.x,b.y,b.screenX,b.screenY,b.screenRadius,b.labelOpacity].every(Number.isFinite));
      assert.ok(!(b.q===0&&b.r===0));
    }
    if(previous){
      const previousByID=new Map(previous.bubbles.map(b=>[b.id,b]));
      for(const b of visible(s,15)){
        assert.ok(previousByID.has(b.id),`visible cell popped in: ${b.id}, frame ${frame}`);
        maxStep=Math.max(maxStep,dist(b,previousByID.get(b.id)));
      }
    }
    previous=s;
  }
  assert.ok(maxFocusCells<=230,`peak focused cells ${maxFocusCells}`);
  assert.ok(maxStep<7,`one-frame world-space jump ${maxStep}`);
});

test('labels fit three lines and playback props still calculate the same durations',()=>{
  for(const b of buildBubbleGrid(center,FULL_MAP_ZOOM)){
    const lines=bubbleLabelLines(b.label);assert.ok(lines.length<=3);assert.equal(lines.join(' '),b.label);
  }
  assert.equal(bubbleMapDuration(standard),610);assert.equal(bubbleMapDuration(idle),420);assert.equal(bubbleMapDuration(reduced),90);
  assert.equal(bubbleMapDuration({...standard,'재생 속도':.5}),1219);
  assert.ok(!bubbleMapSchema.safeParse({...standard,'재생 속도':0}).success);
  assert.throws(()=>buildBubbleGrid(center,.01));
});


test('zoom-out runs without rotating the bubble map and then holds exactly',()=>{
  assert.equal(FINALE.degrees,0);
  assert.equal(at(FINALE.start).rotationDegrees,0);
  assert.equal(at(FINALE.start).zoom,MAP.selectedZoom);
  const half=at((FINALE.start+FINALE.settled)/2);
  assert.equal(half.rotationDegrees,0);
  assert.ok(Math.abs(half.zoom-(MAP.selectedZoom+FULL_MAP_ZOOM)/2)<1e-12);
  const duringShrink=at(12.8);
  assert.equal(duringShrink.rotationDegrees,0);
  assert.ok(duringShrink.zoom<1);
  const selected=duringShrink.bubbles.filter(b=>DEMO_IDS.includes(b.id));
  assert.ok(selected.every(b=>b.diameter>126&&b.diameter<164));
  const final=at(HOLD_TIME);
  assert.equal(final.rotationDegrees,0);assert.equal(final.finalePhase,'grid-hold');
  for(const b of final.bubbles){
    assert.ok(Math.abs(b.screenX-(360+(b.x-MAP.center)*final.zoom))<1e-7);
    assert.ok(Math.abs(b.screenY-(360+(b.y-MAP.center)*final.zoom))<1e-7);
  }
});

test('held map fills the square with one connected six-axis grid and no symbol masking',()=>{
  const s=at(HOLD_TIME),bubbles=drawn(s),byCell=new Map(bubbles.map(b=>[`${b.q}:${b.r}`,b]));
  assert.ok(bubbles.length>1800,'final square is not densely filled');
  assert.equal(bubbles.filter(b=>b.kind==='native').length,72);
  assert.ok(!byCell.has('0:0'),'central slot must remain intentionally empty');
  assert.equal(s.finalePhase,'grid-hold');
  assert.ok(s.bubbles.every(b=>b.renderOpacity===1&&b.exitScale===1));
  assert.equal(bubbles.length,visible(s).length,'a silhouette is hiding visible grid cells');
  const bounds=[
    Math.min(...bubbles.map(b=>b.screenX-b.screenRadius)),
    Math.min(...bubbles.map(b=>b.screenY-b.screenRadius)),
    Math.max(...bubbles.map(b=>b.screenX+b.screenRadius)),
    Math.max(...bubbles.map(b=>b.screenY+b.screenRadius)),
  ];
  assert.ok(bounds[0]<0&&bounds[1]<0&&bounds[2]>720&&bounds[3]>720,JSON.stringify(bounds));
  const offsets=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  const visited=new Set(),queue=[bubbles[0]],contacts=new Map();
  while(queue.length){
    const b=queue.pop(),key=`${b.q}:${b.r}`;
    if(visited.has(key))continue;visited.add(key);
    for(const [dq,dr] of offsets){
      const n=byCell.get(`${b.q+dq}:${b.r+dr}`);if(!n)continue;
      if(!visited.has(`${n.q}:${n.r}`))queue.push(n);
      if(n.axis!==b.axis){const pair=[n.axis,b.axis].sort().join(':');contacts.set(pair,(contacts.get(pair)??0)+1);}
    }
  }
  assert.equal(visited.size,bubbles.length,'axis wedges must remain connected');
  const axes=fixture.tasteExperienceAxes.map(a=>a.id);
  for(let i=0;i<axes.length;i++){
    const pair=[axes[i],axes[(i+1)%6]].sort().join(':');
    assert.ok(contacts.get(pair)>20,`missing adjoining axis boundary ${pair}`);
    assert.ok(bubbles.filter(b=>b.axis===axes[i]).length>200);
  }
  const motionSource=fs.readFileSync(path.join(dir,'motion.ts'),'utf8');
  const finaleSource=fs.readFileSync(path.join(dir,'finale.ts'),'utf8');
  assert.ok(!motionSource.includes('flowerMembership'));
  assert.ok(!motionSource.includes('shapeOpacity'));
  assert.ok(!finaleSource.includes('flowerBoundaryRadius'));
  assertCoverage(s);
});

test('brief hold precedes a readable outside-in reverse entrance in place, ending on empty background',()=>{
  assert.equal(FINALE.exitStart-FINALE.settled,1.200000000000001);
  assert.ok(Math.abs((FINALE.exitEnd-FINALE.exitStart)-1.2)<1e-12);
  assert.ok(FINALE.end-FINALE.exitEnd>=.59);
  const held=at(HOLD_TIME),reference=new Map(held.bubbles.map(b=>[b.id,b]));
  assert.deepEqual(held.bubbles,at(FINALE.exitStart).bubbles);
  for(const progress of [.15,.35,.55,.75,.95]){
    const s=at(FINALE.exitStart+progress*(FINALE.exitEnd-FINALE.exitStart));
    assert.equal(s.rotationDegrees,0);assert.equal(s.zoom,FULL_MAP_ZOOM);
    const bubbles=drawn(s);
    for(const b of bubbles){
      const old=reference.get(b.id);
      assert.ok(old&&old.renderOpacity===1);
      assert.equal(b.renderOpacity,1,'exit must not fade bubbles');
      assert.equal(b.exitOpacity,1,'exit opacity must remain fully opaque');
      assert.ok(Math.abs(b.screenX-old.screenX)<1e-7,'exit must not move bubbles toward center');
      assert.ok(Math.abs(b.screenY-old.screenY)<1e-7,'exit must not move bubbles toward center');
      assert.ok(b.screenRadius<=old.screenRadius+1e-6,'exit must disappear only by shrinking');
    }
  }
  const extended=held.bubbles.filter(b=>b.kind==='extended');
  const nearExtended=extended.reduce((a,b)=>dist(a,center)<dist(b,center)?a:b);
  const farExtended=extended.reduce((a,b)=>dist(a,center)>dist(b,center)?a:b);
  assert.ok(reverseBubbleExit(farExtended,.3).scale<reverseBubbleExit(nearExtended,.3).scale);
  assert.equal(reverseBubbleExit(farExtended,.95).positionScale,1);
  assert.equal(reverseBubbleExit(farExtended,.95).opacity,1);

  // Native + extended cells must share ONE radial wave. The far added edge
  // is gone well before the wave reaches the native-72 outer boundary.
  const nativeOuter=held.bubbles.filter(b=>b.kind==='native').reduce((a,b)=>dist(a,center)>dist(b,center)?a:b);
  const nativeInner=held.bubbles.filter(b=>b.kind==='native').reduce((a,b)=>dist(a,center)<dist(b,center)?a:b);
  const outsideNative=extended.filter(b=>hexRing(b.q,b.r)>=6);
  const firstExtendedOutside=outsideNative.reduce((a,b)=>dist(a,center)<dist(b,center)?a:b);
  assert.ok(reverseBubbleExit(farExtended,.35).scale<.01);
  assert.ok(reverseBubbleExit(nativeOuter,.35).scale>.99);
  assert.ok(
    reverseBubbleExit(firstExtendedOutside,.65).scale <
      reverseBubbleExit(nativeOuter,.65).scale,
    'wave must cross the added ring-6 boundary before the native outer ring',
  );
  assert.ok(
    reverseBubbleExit(nativeOuter,.75).scale <
      reverseBubbleExit(nativeInner,.75).scale,
    'native map must continue outside-to-inside after the handoff',
  );

  // The native intro order is only a local tie-break inside the same radius.
  const nativeRing5=BASE_BUBBLES.filter(b=>hexRing(b.q,b.r)===5);
  const earlyRing5=nativeRing5.reduce((a,b)=>a.introDelay<b.introDelay?a:b);
  const lateRing5=nativeRing5.reduce((a,b)=>a.introDelay>b.introDelay?a:b);
  assert.ok(reverseBubbleExit(lateRing5,.75).scale<reverseBubbleExit(earlyRing5,.75).scale);
  for(const t of [FINALE.exitEnd,FINALE.end]){
    const s=at(t);assert.equal(s.finalePhase,'blank');assert.equal(s.bubbles.length,0);
    assert.equal(s.addedCellCount,0);assert.equal(s.physicsCellCount,0);assert.equal(s.veilOpacity,0);
  }
  const last=bubbleMapFrame(bubbleMapDuration(standard)-1,standard);
  assert.equal(last.bubbles.length,0);
});
