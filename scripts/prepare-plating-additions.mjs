import fs from 'node:fs/promises';

const group = process.argv[2] || 'input';
// Native IconActionButton / RecordActions / SocialActions use the dedicated native source components.
const groups = {
  input: { page: '4:123', ids: ['textarea', 'select', 'segmented-control', 'date-picker'] },
  action: { page: '4:123', ids: ['text-action', 'action-area'] },
  content: { page: '4:124', ids: ['period-tabs', 'image-frame', 'disclosure', 'chip-group'] },
  feedback: { page: '4:125', ids: ['notification-badge', 'skeleton', 'flow-loading', 'flow-retry'] },
  domain: { page: '4:126', ids: ['scope-label'] },
};
if (!groups[group]) throw new Error('Unknown addition group');
const registry = JSON.parse(await fs.readFile('output/plating/registry.json', 'utf8'));
const map = JSON.parse(await fs.readFile('src/plating/figma-map.json', 'utf8'));
const state = JSON.parse(await fs.readFile('output/plating/additions/figma-state.json', 'utf8').catch(() => '{}'));
const items = groups[group].ids.map(id => registry.components.find(c => c.id === id));
if (items.some(c => !c)) throw new Error('Build the registry before preparing additions');
const iconNames = ['chevron-down', 'heart', 'bookmark', 'bell', 'image-plus', 'loader-circle', 'arrow-left', 'x', 'utensils'];
const icons = {};
for (const name of iconNames) {
  const { __iconNode } = await import(`../node_modules/lucide-react/dist/esm/icons/${name}.js`);
  icons[name] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#3f3f3f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${__iconNode.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([key]) => key !== 'key').map(([key, value]) => `${key}="${value}"`).join(' ')} />`).join('')}</svg>`;
}
let helper = await fs.readFile('/Users/sinjunho/.codex/plugins/cache/openai-curated-remote/figma/15.0.0/skills/figma-generate-library/scripts/createComponentWithVariants.js', 'utf8');
// The caller switches page once per call, including when constructing several related families.
helper = helper.replace('await figma.setCurrentPageAsync(page)', '/* page selected by caller */');
helper = helper.replace(/\/\*[\s\S]*?\*\//g, '');
const imageBase64 = groups[group].ids.some(id => ['image-frame'].includes(id)) ? (await fs.readFile('output/plating/additions/figma-image.jpg')).toString('base64') : '';
const setup = `const items=${JSON.stringify(items)};const pageId=${JSON.stringify(groups[group].page)};const tokenIds=${JSON.stringify(map.variables)};const iconIds=${JSON.stringify(state.icons || {})};const knownComponents=${JSON.stringify(state.components || {})};const iconSVG=${JSON.stringify(icons)};const imageBase64=${JSON.stringify(imageBase64)};`;
const code = setup + '\n' + helper + String.raw`
const page=await figma.getNodeByIdAsync(pageId);await figma.setCurrentPageAsync(page);
const created=[];const mutated=[];const result={components:{},reviews:{},icons:{...iconIds},counts:{}};
const track=n=>{created.push(n.id);return n;};
const vars=Object.fromEntries((await figma.variables.getLocalVariablesAsync()).map(v=>[v.name,v]));
const styles=Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s=>[s.name,s]));
await Promise.all(['Regular','Medium','Bold'].map(style=>figma.loadFontAsync({family:'Pretendard',style})));
await figma.loadFontAsync({family:'Inter',style:'Regular'});
function bind(n,field,key){if(!vars[key])throw new Error('Missing token '+key);n.setBoundVariable(field,vars[key]);}
function paint(n,key,stroke=false){const p=figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',vars[key]);if(stroke){n.strokes=[p];n.strokeWeight=1;}else n.fills=[p];}
function pad(n,v){for(const edge of ['Top','Right','Bottom','Left'])bind(n,'padding'+edge,'spacing/'+v);}
function frame(parent,name,width=296,dir='VERTICAL'){const n=track(figma.createAutoLayout(dir));parent.appendChild(n);n.name=name;n.resize(width,44);n.fills=[];n.clipsContent=false;n.primaryAxisSizingMode=dir==='VERTICAL'?'AUTO':'FIXED';n.counterAxisSizingMode=dir==='VERTICAL'?'FIXED':'AUTO';bind(n,'itemSpacing','spacing/8');return n;}
async function text(parent,copy,style='Product/Body',color='color/text/primary',width=296){const n=track(figma.createText());n.name=copy.slice(0,32);await n.setTextStyleIdAsync(styles[style].id);n.characters=copy;paint(n,color);n.textAutoResize='HEIGHT';n.resize(width,20);parent.appendChild(n);n.layoutSizingVertical='HUG';return n;}
function shape(parent,w,h,color,radius='radius/8'){const n=track(figma.createRectangle());parent.appendChild(n);n.resize(w,h);paint(n,color);bind(n,'cornerRadius',radius);return n;}
let imageHash=null;
if(imageBase64){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let bits=0,buffer=0;const bytes=[];for(const c of imageBase64){const v=chars.indexOf(c);if(v<0)continue;buffer=(buffer<<6)|v;bits+=6;if(bits>=8){bits-=8;bytes.push((buffer>>bits)&255);}}imageHash=figma.createImage(new Uint8Array(bytes)).hash;}
const bottom=()=>Math.max(64,...page.children.map(n=>n.y+n.height));
if(Object.keys(result.icons).length===0){const resource=frame(page,'Resource / Plating additions icons',560,'HORIZONTAL');resource.x=64;resource.y=bottom()+96;resource.layoutWrap='WRAP';resource.counterAxisSpacing=16;for(const [name,svg]of Object.entries(iconSVG)){const comp=track(figma.createComponent());resource.appendChild(comp);comp.name='Icon/'+name;comp.resize(24,24);comp.fills=[];const v=track(figma.createNodeFromSvg(svg));comp.appendChild(v);v.resize(24,24);for(const node of v.findAll()){created.push(node.id);if('strokes'in node&&node.strokes.length)paint(node,'color/text/body',true);}result.icons[name]=comp.id;}}
const iconNodes=Object.fromEntries(await Promise.all(Object.entries(result.icons).map(async([k,id])=>[k,await figma.getNodeByIdAsync(id)])));
function icon(parent,name='chevron-down',size=16){const n=track(iconNodes[name].createInstance());parent.appendChild(n);n.resize(size,size);n.name='Icon';return n;}
const primary=await figma.getNodeByIdAsync('6:5');
function button(parent,label,width=296){const n=track(primary.createInstance());parent.appendChild(n);n.setProperties({'Label#6:0':label});n.resize(width,n.height);n.name='Primary action';return n;}
async function quiet(parent,label,width=296){const row=frame(parent,'Text action',width,'HORIZONTAL');row.minHeight=44;row.counterAxisAlignItems='CENTER';row.primaryAxisAlignItems='CENTER';const t=await text(row,label,'Product/Helper','color/text/body',width);t.textAlignHorizontal='CENTER';t.textDecoration='UNDERLINE';return t;}
async function field(parent,label,value,message,{multiline=false,error=false,disabled=false,select=false}={}){const l=await text(parent,label,'Product/Helper','color/text/body');const row=frame(parent,'Field',296,multiline?'VERTICAL':'HORIZONTAL');pad(row,multiline?10:12);row.minHeight=multiline?176:select?48:44;row.counterAxisAlignItems=multiline?'MIN':'CENTER';paint(row,disabled?'color/surface/disabled':'color/surface/card');paint(row,error?'color/feedback/destructive':'color/border/default',true);bind(row,'cornerRadius',multiline?'radius/20':select?'radius/12':'radius/10');await text(row,value,'Product/Body','color/text/body',select?244:272);if(select)icon(row);if(message)await text(parent,message,'Product/Helper',error?'color/feedback/destructive':'color/text/body');return l;}
async function choice(parent,words,selected,{period=false,menu=false}={}){
if(menu)return field(parent,period?'기간':'상세 보기',words[selected],'',{select:true});
const row=frame(parent,'Options',296,'HORIZONTAL');bind(row,'itemSpacing',period?'spacing/4':'spacing/8');
if(!period){row.primaryAxisAlignItems='CENTER';row.counterAxisAlignItems='CENTER';}
const width=(296-(words.length-1)*4)/words.length;
for(let i=0;i<words.length;i++){
const cell=frame(row,'Option / '+words[i],period?width:54,'HORIZONTAL');cell.minHeight=44;cell.primaryAxisAlignItems='CENTER';cell.counterAxisAlignItems='CENTER';
if(!period)cell.primaryAxisSizingMode='AUTO';
const surface=period?cell:frame(cell,'Capsule',54,'HORIZONTAL');
if(!period){surface.resize(54,32);surface.primaryAxisSizingMode='AUTO';surface.counterAxisSizingMode='FIXED';surface.primaryAxisAlignItems='CENTER';surface.counterAxisAlignItems='CENTER';surface.paddingLeft=14;surface.paddingRight=14;}
bind(surface,'cornerRadius','radius/full');
if(i===selected){paint(surface,period?'component/primary-button/background':'color/surface/card');paint(surface,'color/border/default',true);}
const t=await text(surface,words[i],'Product/Helper',period?(i===selected?'color/text/inverse':'color/text/body'):(i===selected?'color/text/primary':'color/text/tertiary'),period?width-8:26);t.textAlignHorizontal='CENTER';
if(!period){t.fontName={family:'Pretendard',style:i===selected?'Bold':'Medium'};t.fontSize=13;t.textAutoResize='WIDTH_AND_HEIGHT';}
}}

async function tags(parent,values){const row=frame(parent,'Tag list',296,'HORIZONTAL');row.layoutWrap='WRAP';bind(row,'itemSpacing','spacing/6');row.counterAxisSpacing=6;for(const value of values){const item=frame(row,'Tag',100,'HORIZONTAL');item.primaryAxisSizingMode='AUTO';pad(item,6);paint(item,'color/surface/card');paint(item,'color/border/default',true);bind(item,'cornerRadius','radius/full');const t=await text(item,value,'Product/Helper','color/text/body',260);t.textAutoResize='WIDTH_AND_HEIGHT';}}
async function loading(parent,message){const row=frame(parent,'Loading',296);row.minHeight=180;row.primaryAxisAlignItems='CENTER';row.counterAxisAlignItems='CENTER';bind(row,'itemSpacing','spacing/16');icon(row,'loader-circle',24);const t=await text(row,message,'Product/Body','color/text/body');t.textAlignHorizontal='CENTER';}
async function picture(parent,ratio=16/9,fallback=false){const f=frame(parent,'Image frame',296,'HORIZONTAL');f.resize(296,296/ratio);f.primaryAxisSizingMode='FIXED';f.counterAxisSizingMode='FIXED';f.primaryAxisAlignItems='CENTER';f.counterAxisAlignItems='CENTER';bind(f,'cornerRadius','radius/8');f.clipsContent=true;if(fallback){paint(f,'color/surface/muted');icon(f,'utensils',24);}else f.fills=[{type:'IMAGE',imageHash,scaleMode:'FILL'}];}
async function wheel(parent,parts){await text(parent,'생년월일','Product/Title');const columns=frame(parent,'Year / Month / Day',296,'HORIZONTAL');bind(columns,'itemSpacing','spacing/4');for(let col=0;col<3;col++){const column=frame(columns,['Year','Month','Day'][col],96);column.counterAxisAlignItems='CENTER';for(let delta=-2;delta<=2;delta++){const cell=frame(column,'Wheel row',96,'HORIZONTAL');cell.minHeight=42;cell.counterAxisAlignItems='CENTER';bind(cell,'cornerRadius','radius/12');if(delta===0)paint(cell,'color/surface/muted');const value=parts[col]+(col===0?-delta:delta);const max=col===0?2026:col===1?12:new Date(parts[0],parts[1],0).getDate();const valid=value>=(col===0?1920:1)&&value<=max;const t=await text(cell,valid?String(value)+['년','월','일'][col]:' ',delta===0?'Product/Title':'Product/Body','color/text/body',96);t.textAlignHorizontal='CENTER';if(delta!==0)cell.opacity=Math.abs(delta)===1?.64:.3;}}await quiet(parent,'날짜 직접 입력');}
const periods=['1개월','3개월','6개월','1년','전체'];
async function content(c,s,comp){let label=null;const disabled=s==='비활성';switch(c.id){
case 'textarea': label=await field(comp,'추가 메모 · 선택사항',s==='입력됨'?'겉은 바삭하고 안은 부드러웠어요. 마지막에 구운 향이 남았어요.':'기억에 남는 맛과 상황을 적어 주세요.',s==='오류'?'메모를 저장하지 못했어요. 작성한 내용은 남아 있어요.':'',{multiline:true,error:s==='오류',disabled});break;
case 'select':label=await field(comp,'성별',s==='선택됨'?'여성':'선택해 주세요',s==='오류'?'선택한 값을 확인해 주세요.':'',{select:true,error:s==='오류',disabled});break;
case 'segmented-control':await choice(comp,['요약','기록'],s==='기록'?1:0,{menu:s==='큰 글자'});await text(comp,s==='기록'?'합성 예제 · 고소함을 기록한 식사 3개':'최근 기록에서 고소한 감각을 자주 선택했어요.','Product/Helper','color/text/body');break;
case 'period-tabs':await choice(comp,periods,Math.max(0,periods.indexOf(s)),{period:true,menu:s==='큰 글자'});await text(comp,(s==='큰 글자'?'3개월':s)+' · 식사일 기준','Product/Caption','color/text/body');break;
case 'text-action':label=await quiet(comp,'작성 취소');break;
case 'notification-badge':{const row=frame(comp,'Notification',296,'HORIZONTAL');row.minHeight=44;row.counterAxisAlignItems='CENTER';row.primaryAxisAlignItems='CENTER';icon(row,'bell',24);if(s!=='읽음'){if(s==='점')shape(row,6,6,'color/feedback/destructive','radius/full');else{const badge=frame(row,'Badge',s==='99+'?30:18,'HORIZONTAL');badge.minHeight=18;badge.primaryAxisAlignItems='CENTER';bind(badge,'cornerRadius','radius/full');paint(badge,'color/feedback/destructive');const t=await text(badge,s==='99+'?'99+':'3','Product/Caption','color/text/inverse',s==='99+'?28:16);t.textAlignHorizontal='CENTER';}}await text(comp,s==='읽음'?'모든 알림을 확인했어요.':'읽지 않은 알림 '+(s==='99+'?'120':'3')+'개','Product/Helper','color/text/body');break;}
case 'skeleton':{if(s==='아바타'||s==='카드')shape(comp,44,44,'color/border/default','radius/full');if(s==='텍스트'||s==='카드')for(const width of [296,222,148])shape(comp,width,10,'color/border/default');if(s==='미디어'||s==='카드')shape(comp,296,166,'color/border/default');break;}
case 'image-frame':await picture(comp,s==='정사각형'?1:16/9,['원본 없음','불러오기 실패'].includes(s));if(s==='불러오기 실패'||s==='원본 없음')await text(comp,s==='원본 없음'?'등록된 사진이 없어요.':'사진을 불러오지 못했어요.','Product/Helper','color/text/body');break;
case 'disclosure':{
  const list=frame(comp,'Accordion / '+(s==='분리형'?'separated':'inline'),296);list.itemSpacing=s==='분리형'?12:0;
  const expanded=s!=='접힘'&&!disabled;const paragraph=s==='문장형';const lines=['이 항목의 세부 내용을 작성합니다.','짧은 정보는 불렛으로 나누고, 이어지는 설명은 문장으로 작성합니다.'];
  if(s==='긴 내용')lines.push('내용이 길어지면 패널 높이가 늘어나며 다음 항목과 함께 페이지에서 스크롤됩니다.');
  for(let i=1;i<=3;i++){
    if(i>1&&s!=='분리형'){const inset=frame(list,'Divider inset',296);inset.paddingLeft=inset.paddingRight=20;const divider=track(figma.createRectangle());inset.appendChild(divider);divider.resize(256,1);paint(divider,'color/border/default');}
    const item=frame(list,'Item '+i,296);item.itemSpacing=0;
    if(s==='분리형'){paint(item,'color/surface/card');paint(item,'color/border/default',true);bind(item,'cornerRadius','radius/12');}
    const row=frame(item,'Header / Trigger',296,'HORIZONTAL');row.resize(296,56);row.primaryAxisSizingMode='FIXED';row.counterAxisSizingMode='AUTO';row.paddingLeft=row.paddingRight=20;row.paddingTop=row.paddingBottom=16;row.itemSpacing=12;row.counterAxisAlignItems='CENTER';
    const t=await text(row,'헤더 타이틀 '+i,styles['Component/Accordion/Title']?'Component/Accordion/Title':'Product/Control','color/text/primary',224);t.fontSize=16;t.lineHeight={unit:'PIXELS',value:24};if(i===1)label=t;
    const arrow=icon(row,'chevron-down',20);const isOpen=expanded&&(i===3||(s==='복수 펼침'&&i===1));if(isOpen)arrow.rotation=180;
    if(isOpen){const panel=frame(item,'Content panel',296);panel.paddingLeft=panel.paddingRight=20;panel.paddingTop=4;panel.paddingBottom=20;panel.itemSpacing=4;
      if(paragraph)await text(panel,lines.join(' '),'Product/Body','color/text/body',256);
      else for(const line of lines){const bullet=frame(panel,'Bullet point',256,'HORIZONTAL');bullet.resize(256,1);bullet.primaryAxisSizingMode='FIXED';bullet.counterAxisSizingMode='AUTO';bullet.itemSpacing=8;await text(bullet,'•','Product/Body','color/text/body',10);await text(bullet,line,'Product/Body','color/text/body',238);}
    }
  }break;
}
case 'scope-label':await text(comp,s==='자기보고'?'미각 설문 · 직접 답한 평소 선호 · 식사 감각 강도와 별개예요.':s==='근거 부족'?'아직 비교할 기록이 충분하지 않아요. 기록하지 않은 감각은 판단하지 않아요.':'최근 3개월 · 식사일 기준 · 직접 남긴 기록 8개','Product/Caption','color/text/body');break;
case 'chip-group':case 'tag-group':if(s==='빈 목록')await text(comp,'표시할 태그가 없어요.','Product/Helper','color/text/body');else await tags(comp,s==='한 줄'?['고소함','바삭함','구운 향','+3']:s==='긴 문구'?['천천히 구운 견과류의 고소한 향','고소함','바삭함','구운 향']:['고소함','바삭함','구운 향','산뜻함','부드러움','긴 여운']);break;
case 'flow-loading':await loading(comp,s==='긴 안내'?'이전에 남긴 답변을 확인하고 있어요. 잠시만 기다려 주세요.':'미각 설문을 준비하고 있어요');break;
case 'flow-retry':label=await text(comp,'미각 설문을 불러오지 못했어요','Product/Title');await text(comp,s==='긴 안내'?'연결 상태를 확인한 뒤 다시 시도해 주세요. 이전에 작성한 답변은 유지돼요.':'잠시 후 다시 시도해 주세요.','Product/Body','color/text/body');button(comp,'다시 시도');break;
case 'action-area':{await text(comp,'식사 경험을 차례로 남겨요.','Product/Helper','color/text/body');const dots=frame(comp,'Step indicator',296,'HORIZONTAL');dots.minHeight=44;dots.counterAxisAlignItems='CENTER';dots.primaryAxisAlignItems='CENTER';for(let i=0;i<5;i++)shape(dots,i===1?16:6,6,i===1?'component/primary-button/background':'color/border/default','radius/full');await text(comp,'2 / 5단계','Product/Caption','color/text/body');if(s==='보조 행동')await quiet(comp,'이전');button(comp,'다음');break;}
case 'date-picker':label=await field(comp,s==='기간'||s==='오류'?'기간 시작':'식사일','2026. 09. 01','실제로 식사한 날짜를 남겨요.',{disabled});if(s==='기간'||s==='오류')await field(comp,'기간 끝',s==='오류'?'2026. 08. 30':'2026. 09. 30',s==='오류'?'종료일은 시작일 이후로 골라 주세요.':'',{error:s==='오류'});break;
}if(disabled)comp.opacity=.45;return label;}
let y=bottom()+120;
for(const c of items){const existing=page.findOne(n=>n.type==='COMPONENT_SET'&&(n.id===knownComponents[c.id]||n.name==='Library additions/'+c.name||n.name.endsWith('/'+c.name)));if(existing){result.components[c.id]=existing.id;const review=page.findOne(n=>n.type==='FRAME'&&n.name==='Review additions/'+c.name);if(review)result.reviews[c.id]=review.id;result.counts[c.id]=existing.children.length;continue;}
const built=await createComponentWithVariants({name:'Library additions/'+c.name,description:c.purpose+' '+c.rule,variantAxes:{State:c.states},baseProps:{width:296,height:44,fills:[],layoutMode:'VERTICAL',itemSpacing:8},page});
const set=built.componentSet;created.push(set.id,...built.variants.map(v=>v.id));set.clipsContent=false;
const labels=[];for(let i=0;i<built.variants.length;i++){const comp=built.variants[i];comp.primaryAxisSizingMode='AUTO';comp.counterAxisSizingMode='FIXED';comp.counterAxisAlignItems='MIN';comp.primaryAxisAlignItems='MIN';bind(comp,'itemSpacing','spacing/8');labels.push(await content(c,c.states[i],comp));}
if(labels.some(Boolean)&&c.id!=='date-picker'){const first=labels.find(Boolean);const key=set.addComponentProperty('Label','TEXT',first.characters);for(const label of labels)if(label)label.componentPropertyReferences={characters:key};}
const cellH=Math.max(...built.variants.map(v=>v.height))+40;const cols=Math.min(3,built.variants.length);built.variants.forEach((v,i)=>{v.x=24+(i%cols)*328;v.y=24+Math.floor(i/cols)*cellH;});set.resizeWithoutConstraints(cols*328+16,Math.ceil(built.variants.length/cols)*cellH+8);set.x=1200;set.y=y;set.documentationLinks=[{uri:'http://127.0.0.1:3001/design-system/components/'+c.id}];
const review=frame(page,'Review additions/'+c.name,1064);review.x=64;review.y=y;pad(review,24);paint(review,'color/surface/card');bind(review,'itemSpacing','spacing/20');await text(review,c.name+' · '+c.korean,'Product/Heading','color/text/primary',1016);await text(review,c.purpose,'Product/Body','color/text/body',1016);
const grid=frame(review,'State examples',1016,'HORIZONTAL');grid.layoutWrap='WRAP';grid.itemSpacing=16;grid.counterAxisSpacing=16;for(const variant of built.variants){const cell=frame(grid,variant.name,328);pad(cell,16);paint(cell,'color/surface/base');bind(cell,'cornerRadius','radius/12');const inst=track(variant.createInstance());cell.appendChild(inst);await text(cell,variant.name,'Product/Caption','color/text/body',296);}
await text(review,c.specs,'Product/Helper','color/text/body',1016);await text(review,c.rule,'Product/Helper','color/text/body',1016);await text(review,c.difference,'Product/Caption','color/text/body',1016);const link=await text(review,'↗ /design-system/components/'+c.id,'Product/Helper','color/text/primary',1016);link.hyperlink={type:'URL',value:'http://127.0.0.1:3001/design-system/components/'+c.id};
result.components[c.id]=set.id;result.reviews[c.id]=review.id;result.counts[c.id]=built.variants.length;y+=Math.max(set.height,review.height)+96;
}
return {...result,page:page.id,createdNodeIds:[...new Set(created)],mutatedNodeIds:mutated,bounds:Object.entries(result.reviews).map(([key,id])=>{const n=page.findOne(n=>n.id===id);return {key,id,width:n.width,height:n.height};})};
`;
new (Object.getPrototypeOf(async function(){}).constructor)(code);
await fs.mkdir('output/plating/additions', {recursive:true});
await fs.writeFile(`output/plating/additions/figma-${group}.js`,code);
console.log(`Prepared ${group}: ${items.length} families`);
