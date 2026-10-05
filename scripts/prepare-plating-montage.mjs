import fs from "node:fs/promises";
const kind = process.argv[2] || "setup";
const registry = JSON.parse(await fs.readFile("output/plating/registry.json", "utf8"));
const map = JSON.parse(await fs.readFile("src/plating/figma-map.json", "utf8"));
const extra = await fs.readFile("output/plating/figma/montage-state.json", "utf8").then(JSON.parse).catch(() => ({}));
const output = `output/plating/figma/montage-${kind}.js`;
const data = { components: registry.components, tastes: registry.tastes, spacing: registry.spacing, radius: registry.radius, map, extra };
if (!kind.startsWith("components-")) delete data.components;
if (["overview", "typography"].includes(kind)) {
  data.art = {
    title: await fs.readFile("output/plating/figma/kalice-plating.svg", "utf8"),
    kalice: await fs.readFile("output/plating/figma/kalice-kalice.svg", "utf8"),
    symbol: await fs.readFile("public/plating/symbol.svg", "utf8"),
  };
}
const helper = String.raw`
const createdNodeIds=[],mutatedNodeIds=[],removedNodeIds=[];
await Promise.all(['Regular','Medium','Bold'].map(style=>figma.loadFontAsync({family:'Noto Sans KR',style})));
const vars=Object.fromEntries((await figma.variables.getLocalVariablesAsync()).map(v=>[v.name,v]));
const styles=Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s=>[s.name,s.id]));
function own(n){createdNodeIds.push(n.id);return n;}
function paint(n,name){n.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',vars[name])];}
function pad(n,v){n.paddingTop=v;n.paddingBottom=v;n.paddingLeft=v;n.paddingRight=v;}
function col(parent,name,width,gap=16,color){const n=own(figma.createAutoLayout('VERTICAL'));parent.appendChild(n);n.name=name;n.resize(width,40);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.itemSpacing=gap;n.fills=[];n.clipsContent=false;if(color)paint(n,color);return n;}
function row(parent,name,width,gap=16,color){const n=own(figma.createAutoLayout('HORIZONTAL'));parent.appendChild(n);n.name=name;n.resize(width,40);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='AUTO';n.itemSpacing=gap;n.fills=[];n.clipsContent=false;if(color)paint(n,color);return n;}
async function text(parent,value,style='Guide/Body',color='color/text/primary',width){const n=own(figma.createText());n.fontName={family:'Noto Sans KR',style:'Regular'};n.characters=String(value);await n.setTextStyleIdAsync(styles[style]);paint(n,color);parent.appendChild(n);n.name=String(value).split('\n')[0].slice(0,60);n.textAutoResize='HEIGHT';n.resize(width??parent.width-parent.paddingLeft-parent.paddingRight,Math.max(20,n.height));return n;}
function rule(parent,width){const n=own(figma.createRectangle());parent.appendChild(n);n.resize(width,1);paint(n,'color/border/default');return n;}
async function link(parent,label,url,width){const n=await text(parent,label,'Guide/Meta','color/text/body',width);n.hyperlink={type:'URL',value:url};return n;}
function box(parent,w,h,color,radius=8){const n=own(figma.createRectangle());parent.appendChild(n);n.resize(w,h);paint(n,color);n.cornerRadius=radius;return n;}
function instance(parent,main,width){const n=main.createInstance();parent.appendChild(n);createdNodeIds.push(n.id,...n.findAll().map(v=>v.id));if(width&&n.width>width)n.resize(width,n.height);return n;}
function remove(n){removedNodeIds.push(n.id,...('findAll'in n?n.findAll().map(v=>v.id):[]));n.remove();}
function result(extra={}){return{createdNodeIds:[...new Set(createdNodeIds)],mutatedNodeIds:[...new Set(mutatedNodeIds)],removedNodeIds:[...new Set(removedNodeIds)],...extra};}
`;
let body = "";
if (kind === "setup") body = String.raw`
const styleSpecs=[['Guide/Display',56,'Medium',66],['Guide/Title',36,'Medium',48],['Guide/Section',20,'Medium',30],['Guide/Body',14,'Regular',23],['Guide/Meta',11,'Regular',18]];const newStyleIds=[];
for(const [name,size,weight,line] of styleSpecs){if(styles[name])continue;const s=figma.createTextStyle();s.name=name;s.fontName={family:'Noto Sans KR',style:weight};s.fontSize=size;s.lineHeight={unit:'PIXELS',value:line};s.description='Documentation hierarchy; intended Pretendard. Current Figma tool font fallback is Noto Sans KR.';styles[name]=s.id;newStyleIds.push(s.id);}
const definitions=[['overview','Overview','0:1'],['updates','Updates'],['color','Foundations / Color','4:122'],['semantic','  ┗ Semantic'],['typography','  ┗ Typography'],['layout','  ┗ Space & shape'],['actions','Components / Action & Input','4:123'],['navigation','  ┗ Navigation & Content','4:124'],['feedback','  ┗ Feedback & Overlay','4:125'],['domain','  ┗ Taste Buddy','4:126'],['patterns','Patterns','4:127'],['brand','Brand & Motion','4:128'],['resources','Resources']];const pages={};
for(const [key,name,id] of definitions){let p=id?await figma.getNodeByIdAsync(id):figma.root.children.find(p=>p.name===name);if(!p){p=own(figma.createPage());}p.name=name;pages[key]=p.id;mutatedNodeIds.push(p.id);}
for(let i=0;i<definitions.length;i++){const p=await figma.getNodeByIdAsync(pages[definitions[i][0]]);figma.root.insertChild(i,p);}
return result({pages,newStyleIds,styles,totalPages:figma.root.children.length});
`;
if (/^components-(actions|navigation|feedback|domain)$/.test(kind)) {
  const key=kind.slice(11);
  const names={actions:'Action & Input',navigation:'Navigation & Content',feedback:'Feedback & Overlay',domain:'Taste Buddy'};
  const old={actions:'6:2',navigation:'7:94',feedback:'8:2',domain:'9:2'};
  const groups={actions:['액션','입력·선택'],navigation:['탐색','콘텐츠'],feedback:['피드백','오버레이'],domain:['Taste Buddy']};
  body = `const page=await figma.getNodeByIdAsync(data.extra.pages[${JSON.stringify(key)}]);await figma.setCurrentPageAsync(page);const oldReviewId=${JSON.stringify(old[key])};const families=data.components.filter(c=>${JSON.stringify(groups[key])}.includes(c.group));const pageTitle=${JSON.stringify(names[key])};\n` + String.raw`
if(page.children.some(n=>n.name.startsWith('Library / ')))throw new Error('This page is already revised. Inspect the existing boards instead of regenerating.');
const heading=col(page,'Library index / '+pageTitle,4144,14);heading.x=64;heading.y=64;await text(heading,pageTitle,'Guide/Display');await text(heading,'상태와 속성을 비교한 뒤, 각 보드 아래의 Main component를 편집해요.','Guide/Body','color/text/body');
const boards={},indexLinks=row(heading,'Jump to components',4144,28);indexLinks.layoutWrap='WRAP';indexLinks.counterAxisSpacing=12;
let x=64,y=310,rowHeight=0,index=0,variantCount=0;
const prefixes={'액션':'Action','입력·선택':'Input','탐색':'Navigation','콘텐츠':'Content','피드백':'Feedback','오버레이':'Overlay','Taste Buddy':'TasteBuddy'};
for(const c of families){
 const set=await figma.getNodeByIdAsync(data.map.components[c.id]);variantCount+=set.children.length;
 const fonts=new Map();for(const t of set.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);for(const f of fonts.values())await figma.loadFontAsync(f);
 const section=own(figma.createSection());page.appendChild(section);section.name='Library / '+c.name;section.x=x;section.y=y;paint(section,'color/surface/base');
 const body=col(section,'Component guide / '+c.name,1280,32,'color/surface/card');body.x=32;body.y=32;pad(body,64);body.cornerRadius=24;
 const header=col(body,'Header',1152,10);await text(header,c.group.toUpperCase(),'Guide/Meta','color/text/body');await text(header,c.name,'Guide/Title');await text(header,c.purpose,'Guide/Body','color/text/body');
 const status=row(body,'Implementation status',1152,12,'color/surface/muted');pad(status,16);status.cornerRadius=10;
 await text(status,c.demo==='production'?'Web · 실제 컴포넌트':'Web · 규격 재현','Guide/Meta','color/text/body',220);await text(status,'Native · 현재 소스 기준','Guide/Meta','color/text/body',240);await link(status,'문서와 코드 ↗','http://127.0.0.1:3001/design-system/components/'+c.id,310);
 const preview=col(body,'Variants & states',1152,20,'color/surface/muted');pad(preview,24);preview.cornerRadius=16;await text(preview,'Variants & states','Guide/Section');
 const columns=c.id==='primary-button'?4:(c.id==='bottom-sheet'?2:3);const gap=16;const width=(1104-gap*(columns-1))/columns;
 for(let i=0;i<set.children.length;i+=columns){const line=row(preview,'Variant row '+(Math.floor(i/columns)+1),1104,gap);for(const main of set.children.slice(i,i+columns)){const cell=col(line,main.name,width,16,'color/surface/card');pad(cell,16);cell.cornerRadius=10;await text(cell,main.name.replaceAll(',',' · '),'Guide/Meta','color/text/body');const sample=col(cell,'Example',width-32,8);sample.minHeight=c.id==='bottom-sheet'?70:52;sample.primaryAxisAlignItems='CENTER';instance(sample,main,width-32);}}
 const props=col(body,'Properties',1152,14);await text(props,'Properties','Guide/Section');
 const propertyHead=row(props,'Property header',1152,16);await text(propertyHead,'속성','Guide/Meta','color/text/body',260);await text(propertyHead,'종류','Guide/Meta','color/text/body',144);await text(propertyHead,'값 · 기본값','Guide/Meta','color/text/body',716);rule(props,1152);
 for(const [name,p] of Object.entries(set.componentPropertyDefinitions)){const line=row(props,'Property / '+name,1152,16);await text(line,name.split('#')[0],'Guide/Body','color/text/primary',260);await text(line,p.type,'Guide/Meta','color/text/body',144);const values=p.type==='VARIANT'?p.variantOptions.join(' / '):p.type==='INSTANCE_SWAP'?'Icon/Close · Back · Check · Search':String(p.defaultValue);await text(line,values,'Guide/Body','color/text/body',716);}
 const details=row(body,'Specification & usage',1152,32);const spec=col(details,'Specification',560,12);await text(spec,'Specification','Guide/Section');await text(spec,c.specs);await text(spec,c.difference,'Guide/Meta','color/text/body');const usage=col(details,'Usage',560,12);await text(usage,'Usage','Guide/Section');await text(usage,c.rule);await text(usage,c.accessibility,'Guide/Meta','color/text/body');
 rule(body,1152);const source=col(body,'Main component',1152,18);await text(source,'Main component','Guide/Section');await text(source,'이 원본을 편집하면 연결된 인스턴스에 반영돼요.','Guide/Meta','color/text/body');
 const master=col(source,'Master surface',1152,24,'color/surface/base');pad(master,24);master.cornerRadius=16;master.counterAxisAlignItems='CENTER';master.appendChild(set);set.name=prefixes[c.group]+'/'+c.name;mutatedNodeIds.push(set.id);
 await link(body,'Figma 원본 ↗','https://www.figma.com/design/'+data.map.fileKey+'?node-id='+set.id.replace(':','-'),1152);
 await text(body,c.source+'\n'+c.native,'Guide/Meta','color/text/body');
 section.resizeWithoutConstraints(1344,body.height+64);boards[c.id]=section.id;await link(indexLinks,c.name,'https://www.figma.com/design/'+data.map.fileKey+'?node-id='+section.id.replace(':','-'),Math.max(132,c.name.length*8));
 rowHeight=Math.max(rowHeight,section.height);index++;if(index%3===0){x=64;y+=rowHeight+96;rowHeight=0;}else x+=1440;
}
const old=await figma.getNodeByIdAsync(oldReviewId);if(old)remove(old);
const icons=page.children.filter(n=>n.type==='COMPONENT'&&n.name.startsWith('Icon/'));if(icons.length){const resource=col(page,'Resource / Icon primitives',1280,20,'color/surface/card');resource.x=64;resource.y=y+rowHeight+96;pad(resource,40);await text(resource,'Icon primitives','Guide/Title');const r=row(resource,'Icon masters',1200,40);for(const icon of icons){r.appendChild(icon);mutatedNodeIds.push(icon.id);}await text(resource,'IconButton의 Instance Swap으로 변경해요.','Guide/Body','color/text/body');}
return result({page:page.id,boards,componentSets:families.length,variants:variantCount,heading:heading.id});
`;
}
if (["color", "semantic", "typography", "layout", "updates", "resources"].includes(kind)) {
  const title = { color:"Color", semantic:"Semantic color", typography:"Typography", layout:"Space & shape", updates:"Updates", resources:"Resources" }[kind];
  const intro = { color:"Taste Buddy의 미각 6색과 기본 팔레트.", semantic:"같은 색이어도 역할이 다르면 별도 이름으로 연결해요.", typography:"Kalice의 브랜드 표현과 Pretendard의 제품 언어.", layout:"반복되는 간격, 형태와 플랫폼별 크기 기준.", updates:"변경한 내용과 실제 확인 범위.", resources:"디자인, 코드, 문서의 기준을 연결해요." }[kind];
  body = `const page=await figma.getNodeByIdAsync(data.extra.pages[${JSON.stringify(kind)}]);await figma.setCurrentPageAsync(page);if(page.children.some(n=>n.name===${JSON.stringify("Guide / "+title)}))throw new Error('Guide already exists; inspect before retry.');const root=col(page,${JSON.stringify("Guide / "+title)},1280,40,'color/surface/card');root.x=64;root.y=64;pad(root,64);root.cornerRadius=24;await text(root,${JSON.stringify(title)},'Guide/Title');await text(root,${JSON.stringify(intro)},'Guide/Body','color/text/body');\n`;
  if(kind==='color') body+=String.raw`
const palette=row(root,'Taste palette',1152,16);for(const t of data.tastes){const cell=col(palette,t.label,178.6667,12);box(cell,178.6667,160,'taste/'+t.id+'/main',12);await text(cell,t.label,'Guide/Section');await text(cell,t.main.toUpperCase(),'Guide/Meta','color/text/body');const sample=col(cell,'Readable tint',178.6667,6,'taste/'+t.id+'/tintSurface');pad(sample,12);sample.cornerRadius=8;await text(sample,t.label,'Guide/Body','taste/'+t.id+'/tintSurfaceText');}
await text(root,'Token reference','Guide/Section');
for(const t of data.tastes){const r=row(root,'Token / '+t.id,1152,24);box(r,80,48,'taste/'+t.id+'/main');await text(r,'taste/'+t.id+'/main','Guide/Body','color/text/primary',370);await text(r,'primitive/taste/'+t.id+'/main','Guide/Meta','color/text/body',470);await text(r,t.main.toUpperCase(),'Guide/Meta','color/text/body',160);rule(root,1152);}
const rules=row(root,'Color usage',1152,24);for(const [h,b] of [['역할','미각 원색은 분류와 그래픽에, tintSurfaceText는 작은 글자에 사용해요.'],['의미','감각의 존재·강도·호감·적절성·음식 전체 평가는 서로 다른 정보예요.']]){const c=col(rules,h,564,12,'color/surface/muted');pad(c,24);c.cornerRadius=16;await text(c,h,'Guide/Section');await text(c,b);}
await link(root,'Semantic color ↗','https://www.figma.com/design/'+data.map.fileKey+'?node-id='+data.extra.pages.semantic.replace(':','-'));
const old=await figma.getNodeByIdAsync('11:2');if(old)remove(old);
`;
  if(kind==='semantic') body+=String.raw`
const tokens=Object.values(vars).filter(v=>v.name.startsWith('color/'));const primitiveById=Object.fromEntries(Object.values(vars).map(v=>[v.id,v]));
const head=row(root,'Table heading',1152,24);await text(head,'색','Guide/Meta','color/text/body',80);await text(head,'역할','Guide/Meta','color/text/body',370);await text(head,'원시 값 연결','Guide/Meta','color/text/body',470);await text(head,'현재 값','Guide/Meta','color/text/body',160);rule(root,1152);
function resolve(v){const a=Object.values(v.valuesByMode)[0];return a?.type==='VARIABLE_ALIAS'?resolve(primitiveById[a.id]):a;}
function hex(c){return '#'+[c.r,c.g,c.b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('').toUpperCase();}
for(const v of tokens){const r=row(root,'Role / '+v.name,1152,24);box(r,80,48,v.name);await text(r,v.name,'Guide/Body','color/text/primary',370);const val=Object.values(v.valuesByMode)[0];await text(r,val?.type==='VARIABLE_ALIAS'?primitiveById[val.id].name:'Literal','Guide/Meta','color/text/body',470);await text(r,hex(resolve(v)),'Guide/Meta','color/text/body',160);rule(root,1152);}
await text(root,'제품은 현재 라이트 토큰을 기준으로 해요. 문서 사이트의 다크 테마를 제품 다크 모드의 구현으로 해석하지 않아요.','Guide/Body','color/text/body');
`;
  if(kind==='typography') body+=String.raw`
const pair=row(root,'Type families',1152,32);const display=col(pair,'Kalice',560,24,'color/surface/muted');pad(display,32);display.cornerRadius=16;const outline=figma.createNodeFromSvg(data.art.kalice);display.appendChild(outline);createdNodeIds.push(outline.id,...outline.findAll().map(n=>n.id));outline.name='Kalice / Original glyph outlines';outline.rescale(360/outline.width);await text(display,'Kalice · Display','Guide/Section');await text(display,'기존 Kalice 원본 글리프의 편집 가능한 벡터예요. 로고와 영문 디스플레이에 사용해요.','Guide/Body','color/text/body');const body=col(pair,'Pretendard',560,24,'color/surface/muted');pad(body,32);body.cornerRadius=16;await text(body,'가나다 Aa','Guide/Display');await text(body,'Pretendard · Product','Guide/Section');await text(body,'제품·한글·본문의 기준 폰트예요. 현재 Figma 도구 환경에서는 Noto Sans KR로 표시돼요.','Guide/Body','color/text/body');
await text(root,'Product styles','Guide/Section');const samples=await figma.getLocalTextStylesAsync();for(const s of samples.filter(s=>s.name.startsWith('Product/'))){const r=row(root,s.name,1152,24);await text(r,s.name,'Guide/Meta','color/text/body',240);await text(r,s.fontSize+'px / '+(s.lineHeight.value??'Auto'),'Guide/Meta','color/text/body',180);await text(r,'맛의 경험을 담고, 관계를 정돈해요.',s.name,'color/text/primary',684);rule(root,1152);}
await text(root,'문서와 브랜드','Guide/Section');await text(root,'홈 32–88px · 문서 제목 36–64px · 제품 UI 10–18px. 문서의 편집 크기를 제품에 옮겨 쓰지 않아요.');await text(root,'Kalice·Pretendard의 Figma 텍스트 로드는 현재 도구 환경에서 불가해요. 스타일의 글꼴을 원본으로 바꿀 때 긴 한국어와 줄바꿈을 다시 확인하세요.','Guide/Meta','color/text/body');
`;
  if(kind==='layout') body+=String.raw`
await text(root,'Spacing','Guide/Section');for(const [name,value] of Object.entries(data.spacing)){const r=row(root,'Space / '+name,1152,24);await text(r,'spacing/'+name,'Guide/Meta','color/text/body',160);await text(r,value,'Guide/Body','color/text/primary',100);box(r,parseFloat(value)*8,24,'taste/sweet/main',2);}
await text(root,'Radius','Guide/Section');const radii=row(root,'Radius specimens',1152,16);radii.layoutWrap='WRAP';radii.counterAxisSpacing=20;for(const [name,value] of Object.entries(data.radius)){const c=col(radii,name,128,12);const n=box(c,128,100,'taste/sweet/tintSurface',parseFloat(value));n.setBoundVariable('cornerRadius',vars['radius/'+name]);await text(c,'radius/'+name+' · '+value,'Guide/Meta','color/text/body');}
await text(root,'Platform metrics','Guide/Section');for(const [a,b,c] of [['Control height','Default 48 / Compact 40','Native · Web'],['Touch target','44 minimum','Native · Web'],['Sheet radius','Native 32 / Web 20','플랫폼 차이'],['Top bar','Native 48 / Web 56','플랫폼 차이'],['Page gutter','20','Native'],['Card padding','12','Native']]){const r=row(root,a,1152,24);await text(r,a,'Guide/Body','color/text/primary',260);await text(r,b,'Guide/Body','color/text/body',520);await text(r,c,'Guide/Meta','color/text/body',324);rule(root,1152);}
`;
  if(kind==='updates') body+=String.raw`
await text(root,'2026.09.30','Guide/Section');for(const [heading,copy] of [['Library structure','몽타주 참고 파일의 역할별 분류, 속성 예제, 원본 배치를 적용했어요. 31개 기존 Component Set ID와 변수 연결을 유지해요.'],['Foundations','Color, Semantic, Typography, Space & shape를 분리하고 역할·참조·값을 표로 정리했어요.'],['Product corrections','TasteChip의 숫자 0과 읽는 색, 버튼의 긴 한국어, 시트 초점 복귀, 토스트 행동을 보완했어요.'],['Home','영상 벤토를 제거하고 Kalice·Pretendard, Bloom 그래픽과 짧은 문구를 사용해요.'],['Verification','웹 타입 검사·빌드, 브라우저 61개 기능 점검, iOS 빌드와 상태 화면 캡처를 확인했어요.']]){const r=col(root,heading,1152,12,'color/surface/muted');pad(r,24);r.cornerRadius=12;await text(r,heading,'Guide/Section');await text(r,copy);}
await text(root,'Limits','Guide/Section');await text(root,'Figma 폰트 대체 · Code Connect 플랜 제한 · 실기기/VoiceOver/Android 미검증. 문서의 확인 범위를 제품 전체 검증으로 확대하지 않아요.','Guide/Body','color/text/body');
`;
  if(kind==='resources') body+=String.raw`
for(const [heading,copy] of [['Source of truth','Native UI: ios/TasteBuddy · 제품 의미: DESIGN.md / 제품 경험 지침 · 브랜드: brand-launch · Web: 실제 컴포넌트와 토큰'],['Writing','짧은 감각 제목, 구체적인 다음 행동. 저장 실패는 대상과 재시도를 안내해요. 입력 보존은 실제 동작이 확인된 경우에만 말해요.'],['Data meaning','기록 없음과 0을 구분해요. 감각의 존재·강도·호감·적절성·음식 전체 평가는 서로 대체하지 않아요.'],['Accessibility','키보드 초점, 긴 한국어, 320px 폭, 오류와 빈 상태, 동작 줄이기를 함께 확인해요. Figma 프로토타입은 실제 조작 검증을 대신하지 않아요.'],['Changes','플랫폼 소스 → 관련 토큰·컴포넌트 → Figma 원본 → 문서의 순서로 영향을 확인해요. 기존 ID와 원본을 유지하고 차이는 기록해요.']]){const c=col(root,heading,1152,12,'color/surface/muted');pad(c,24);c.cornerRadius=12;await text(c,heading,'Guide/Section');await text(c,copy);}
await link(root,'플레이팅 사이트 ↗','http://127.0.0.1:3001/design-system');await link(root,'라이팅 ↗','http://127.0.0.1:3001/design-system/writing');await link(root,'접근성 ↗','http://127.0.0.1:3001/design-system/accessibility');await link(root,'참고: Wanted Design System ↗','https://www.figma.com/design/cBy8RRtgNuhqgYcW4yM4Jo?node-id=0-1');
`;
  body+=String.raw`return result({page:page.id,root:root.id,bounds:{width:root.width,height:root.height}});`;
}
if(kind==='overview') body=String.raw`
const page=await figma.getNodeByIdAsync(data.extra.pages.overview);await figma.setCurrentPageAsync(page);const cover=await figma.getNodeByIdAsync('4:129');if(cover.children.some(n=>n.name==='Brand introduction'))throw new Error('Overview already revised.');for(const n of [...cover.children])remove(n);mutatedNodeIds.push(cover.id);cover.name='Plating / Cover';cover.layoutMode='HORIZONTAL';cover.resize(1280,720);cover.primaryAxisSizingMode='FIXED';cover.counterAxisSizingMode='FIXED';cover.itemSpacing=0;pad(cover,0);cover.clipsContent=true;cover.x=64;cover.y=64;paint(cover,'color/surface/card');
const left=col(cover,'Brand introduction',500,24,'color/surface/muted');left.resize(500,720);left.primaryAxisSizingMode='FIXED';pad(left,48);const symbol=figma.createNodeFromSvg(data.art.symbol);left.appendChild(symbol);createdNodeIds.push(symbol.id,...symbol.findAll().map(n=>n.id));symbol.rescale(48/symbol.height);const gap=col(left,'Breathing room',404,0);gap.resize(404,72);gap.primaryAxisSizingMode='FIXED';const title=figma.createNodeFromSvg(data.art.title);left.appendChild(title);createdNodeIds.push(title.id,...title.findAll().map(n=>n.id));title.name='Plating / Kalice original glyph outlines';title.rescale(404/title.width);await text(left,'Taste Buddy\nDesign System','Guide/Title');await text(left,'맛의 경험을 담고, 의미를 드러내요.','Guide/Body','color/text/body');const fill=col(left,'Flexible space',404,0);fill.layoutSizingVertical='FILL';await text(left,'V1 · 2026','Guide/Meta','color/text/body');
const right=col(cover,'System specimens',780,24,'color/surface/card');pad(right,32);right.resize(780,720);right.primaryAxisSizingMode='FIXED';await text(right,'A system for every taste.','Guide/Section');const colors=row(right,'Taste colors',716,10);for(const t of data.tastes)box(colors,111,80,'taste/'+t.id+'/main',12);
const middle=row(right,'Component specimens',716,20);const bloom=col(middle,'Taste Bloom',276,12,'taste/umami/tintSurface');pad(bloom,24);bloom.cornerRadius=20;const bloomSet=await figma.getNodeByIdAsync(data.map.components['taste-bloom']);const bloomMain=bloomSet.children.find(n=>n.name.includes('표본'))??bloomSet.children[0];const b=instance(bloom,bloomMain,228);await text(bloom,'Taste Bloom','Guide/Meta','color/text/body');
const controls=col(middle,'Product controls',420,24,'color/surface/base');pad(controls,24);controls.cornerRadius=20;for(const id of ['text-input','selection-card']){const set=await figma.getNodeByIdAsync(data.map.components[id]);instance(controls,set.children[0],372);}const buttonSet=await figma.getNodeByIdAsync(data.map.components['primary-button']);instance(controls,buttonSet.children[0],372);
const chips=row(right,'Domain selection',716,16,'color/surface/muted');pad(chips,20);chips.cornerRadius=16;const chipSet=await figma.getNodeByIdAsync(data.map.components['taste-chip']);for(const t of data.tastes){const main=chipSet.children.find(n=>n.name.includes('Taste='+t.id)&&n.name.includes('State=기본'))??chipSet.children[data.tastes.indexOf(t)*3];instance(chips,main);}
const index=col(page,'Start here',1280,32,'color/surface/card');index.x=64;index.y=880;pad(index,64);index.cornerRadius=24;await text(index,'Start here','Guide/Title');const links=[['Foundations','Color · Semantic · Typography · Space',data.extra.pages.color],['Components','Action · Navigation · Feedback · Taste Buddy',data.extra.pages.actions],['Patterns','식사 기록 → 감각 선택 → 결과와 해석',data.extra.pages.patterns],['Brand & Motion','원본 로고 · Bloom · Remotion 에셋',data.extra.pages.brand],['Resources','라이팅 · 접근성 · 코드와 문서 연결',data.extra.pages.resources]];for(const [h,b,id] of links){const r=row(index,h,1152,32);await link(r,h+' ↗','https://www.figma.com/design/'+data.map.fileKey+'?node-id='+id.replace(':','-'),300);await text(r,b,'Guide/Body','color/text/body',820);rule(index,1152);}await link(index,'플레이팅 사이트 ↗','http://127.0.0.1:3001/design-system');await text(index,'제품 규격과 의미는 Taste Buddy 원본이 기준이에요. Figma 폰트 대체와 플랫폼별 차이는 Typography·Updates에서 확인할 수 있어요.','Guide/Meta','color/text/body');
return result({page:page.id,cover:cover.id,index:index.id});
`;
if (!body) throw new Error(`Unsupported phase: ${kind}`);
const code=`const data=${JSON.stringify(data)};\n${helper}\n${body}`;
new (Object.getPrototypeOf(async function(){}).constructor)(code);
await fs.writeFile(output,code);
console.log(`${output}: ${code.length} chars`);
