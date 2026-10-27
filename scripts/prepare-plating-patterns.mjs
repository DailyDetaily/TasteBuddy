import fs from 'node:fs/promises';
const state=JSON.parse(await fs.readFile('output/plating/figma/state.json','utf8'));
const code=`
const state=${JSON.stringify({defaults:state.defaults,components:state.components,styles:state.styles,pages:state.pages})};
await Promise.all(['Regular','Medium','Bold'].map(style=>figma.loadFontAsync({family:'Pretendard',style})));
const page=await figma.getNodeByIdAsync(state.pages['06 · Patterns']);await figma.setCurrentPageAsync(page);if(page.children.length)throw new Error('Patterns already exist.');
const ids=[],screens=[],actions=[],instances=[];const vars=Object.fromEntries((await figma.variables.getLocalVariablesAsync()).map(v=>[v.name,v]));
function paint(n,name){n.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',vars[name])];}
function frame(parent,name,width,direction='VERTICAL'){const n=figma.createAutoLayout(direction);ids.push(n.id);parent.appendChild(n);n.name=name;n.resize(width,20);n.primaryAxisSizingMode=direction==='VERTICAL'?'AUTO':'FIXED';n.counterAxisSizingMode=direction==='VERTICAL'?'FIXED':'AUTO';n.itemSpacing=20;n.setBoundVariable('itemSpacing',vars['spacing/20']);n.fills=[];n.clipsContent=false;return n;}
function pad(n,value){for(const f of ['paddingTop','paddingBottom','paddingLeft','paddingRight']){n[f]=value;n.setBoundVariable(f,vars['spacing/'+value]);}}
async function text(parent,content,style='Product/Body',width=0){const n=figma.createText();ids.push(n.id);n.fontName={family:'Pretendard',style:'Regular'};n.characters=content;await n.setTextStyleIdAsync(state.styles[style]);paint(n,'color/text/primary');parent.appendChild(n);if(width){n.textAutoResize='HEIGHT';n.resize(width,n.height);}return n;}
async function instance(parent,id,label,width=350){const main=await figma.getNodeByIdAsync(state.defaults[id]);const n=main.createInstance();parent.appendChild(n);n.name=id+' / instance';ids.push(n.id);instances.push(n.id);n.resize(width,n.height);if(label){const key=Object.keys(n.componentProperties).find(k=>k.startsWith('Label#'));if(key)n.setProperties({[key]:label});}return n;}
const root=frame(page,'Flow review / Meal to meaning',1810);root.x=80;root.y=80;pad(root,40);paint(root,'color/surface/card');await text(root,'기록에서 해석으로','Editorial/Title');await text(root,'검토용 화면: 실제 메인 컴포넌트 인스턴스 조합. 합성 예제이며 현재 제품 화면의 픽셀 단위 복제는 아닙니다.','Editorial/Body',1730);
const row=page;
const titles=['01 · 식사 맥락','02 · 감각 선택','03 · 결과 확인','04 · 해석과 근거'];
for(let i=0;i<4;i++){const phone=frame(row,titles[i],390);phone.x=80+i*440;phone.y=390;phone.minHeight=780;pad(phone,20);paint(phone,'color/surface/base');phone.setBoundVariable('cornerRadius',vars['radius/24']);await text(phone,titles[i],'Product/Helper',350);await instance(phone,'top-bar',null,350);await instance(phone,'step-indicator',null,90);screens.push(phone.id);
 if(i===0){await text(phone,'무엇을 드셨나요?','Product/Heading',350);await text(phone,'합성 예제 · 오늘의 저녁','Product/Helper',350);await instance(phone,'text-input','음식 이름');await instance(phone,'selection-card','편안한 한 끼');actions.push(await instance(phone,'primary-button','감각 선택하기'));}
 if(i===1){await text(phone,'어떤 감각이 느껴졌나요?','Product/Heading',350);await text(phone,'선택은 호감과 별개예요. 느낀 감각을 골라 주세요.','Product/Body',350);await instance(phone,'sensory-bubble');await instance(phone,'taste-chip',null,120);actions.push(await instance(phone,'primary-button','선택 완료'));}
 if(i===2){await text(phone,'고소함이 남는 식사','Product/Heading',350);await instance(phone,'taste-bloom',null,350);await instance(phone,'dining-result');actions.push(await instance(phone,'primary-button','기록 확인'));}
 if(i===3){await text(phone,'기록에서 보이는 경향','Product/Heading',350);await instance(phone,'interpretation-card');await instance(phone,'taste-graph');await text(phone,'존재·강도·호감은 다른 정보예요. 관측하지 않은 값은 0으로 채우지 않아요.','Product/Helper',350);actions.push(await instance(phone,'primary-button','다시 살펴보기'));}
}
for(let i=0;i<actions.length;i++)await actions[i].setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:screens[(i+1)%screens.length],navigation:'NAVIGATE',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.18}}]}]);
await text(root,'Prototype 범위: 버튼으로 검토 화면 사이를 이동합니다. 실제 입력 검증·저장·뒤로 가기 이력·시트 제스처는 코드에서 확인합니다.','Editorial/Body',1730);
const stress=frame(page,'Stress review / Korean & empty states',1180);stress.x=80;stress.y=1320;pad(stress,40);paint(stress,'color/surface/card');await text(stress,'긴 한국어 · 빈 상태 · 오류','Editorial/Title');const stressRow=frame(stress,'320px constraints',1100,'HORIZONTAL');stressRow.itemSpacing=30;
for(const [title,id,label] of [['긴 한국어 · 320px','primary-button','오늘 느낀 감각과 식사의 맥락을 모두 확인하고 기록을 완료할게요'],['기록 없음','empty-state',null],['입력 오류','inline-error','음식 이름']]){const cell=frame(stressRow,title,340);pad(cell,10);paint(cell,'color/surface/base');await text(cell,title,'Product/Helper',320);await instance(cell,id,label,320);}
await text(stress,'동작 줄이기: 최종 상태와 텍스트를 제공합니다. Figma에서는 화면 이동만 근사하며 WAAPI·Native 애니메이션과 같다고 판단하지 않습니다.','Editorial/Body',1100);
const links=await text(stress,'웹에서 실제 조작 확인 ↗','Product/Control');links.hyperlink={type:'URL',value:'http://127.0.0.1:3001/design-system/components/primary-button'};
const createdNodeIds=[...new Set([...ids,...page.findAll().map(n=>n.id)])];return{createdNodeIds,mutatedNodeIds:[],page:page.id,review:root.id,stress:stress.id,screens,instanceCount:instances.length,prototypeCount:actions.length,bounds:{width:root.width,height:root.height}};
`;
new(Object.getPrototypeOf(async function(){}).constructor)(code);
await fs.writeFile('output/plating/figma/patterns.js',code);
