import {SENSORY_V2, type SensoryV2Presentation} from '../../lib/sensoryV2.mjs';

export default function SensoryProfileControls({presentation,onChange}: {
  presentation:SensoryV2Presentation;
  onChange:(profiles:string[]|null, flags:Record<string,string>)=>void;
}) {
  return <div className="flex flex-wrap items-start gap-3 text-[12px]">
    <label className="flex min-h-11 flex-1 items-center gap-2">
      표현 종류
      <select aria-label="음식별 미각 표현 종류" className="min-h-11 min-w-0 flex-1 rounded-xl bg-[var(--tb-color-surface-base)] px-3"
        value={presentation.profileSelection==null?'auto':presentation.profileSelection[0]??'generic'}
        onChange={e=>onChange(e.target.value==='auto'?null:e.target.value==='generic'?[]:[e.target.value],presentation.flagOverrides)}>
        <option value="auto">자동 · {presentation.profileIds.map(id=>SENSORY_V2.profiles.find(p=>p.id===id)?.label).join(' · ')}</option>
        {SENSORY_V2.profiles.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </label>
    <details className="w-full rounded-xl bg-[var(--tb-color-surface-muted)] px-3">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold">음식 구성 확인</summary>
      <div className="grid grid-cols-2 gap-2 pb-3">
        {SENSORY_V2.contextFlags.map(flag=><label key={flag.id} className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={presentation.contextFlags[flag.id]==='confirmed'} onChange={e=>onChange(presentation.profileSelection,{...presentation.flagOverrides,[flag.id]:e.target.checked?'confirmed':'explicitly_rejected'})}/>
          {flag.label}
        </label>)}
        <button type="button" className="col-span-2 min-h-11 text-left" onClick={()=>onChange(presentation.profileSelection,{})}>자동 확인으로 되돌리기</button>
      </div>
    </details>
  </div>;
}
