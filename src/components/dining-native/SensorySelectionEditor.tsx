import type { SensorySelection } from "../../lib/gastronomy/nativeRecord";
import { conditionLabels } from "../../lib/gastronomy/engine";
const choices = {
  liking: {
    title: "어땠나요?",
    values: {
      liked: "좋았어요",
      neutral: "보통이에요",
      disliked: "아쉬웠어요",
    },
  },
  intensity: {
    title: "얼마나 느껴졌나요?",
    values: { light: "약하게", medium: "중간 정도", strong: "강하게" },
  },
  preferenceFit: {
    title: "양은 알맞았나요?",
    values: {
      tooWeak: "조금 부족했어요",
      justRight: "알맞았어요",
      tooStrong: "조금 과했어요",
    },
  },
};
export default function SensorySelectionEditor({
  selection,
  bubbles,
  onChange,
  onRemove,
  onDuplicate,
}: {
  selection: SensorySelection;
  bubbles: SensorySelection[];
  onChange: (s: SensorySelection) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
}) {
  const update = (key: string, value: string | null) =>
    onChange({ ...selection, [key]: value, ...(key==='target'&&selection.bindingMode!=='relation'&&!selection.relatedBubbleID?{scopeKind:value==='whole_dish'||value==='unspecified'?'whole_dish':'component'}:{}) });
  return (
    <details className="rounded-[18px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-[14px]">
      <summary className="min-h-11 cursor-pointer text-[13px] font-semibold">
        {selection.labelSnapshot}
        <span className="ml-3 text-[11px] font-normal">선택 평가</span>
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        {Object.entries(choices).map(([key, group]) => (
          <fieldset key={key}>
            <legend className="mb-2 text-[11px] font-semibold">
              {group.title}
            </legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(group.values).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={selection[key] === value}
                  className={`min-h-11 rounded-full border px-3 text-[12px] ${selection[key] === value ? "border-black bg-black text-white" : "border-transparent bg-white"}`}
                  onClick={() =>
                    update(key, selection[key] === value ? null : value)
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-2">
          {[
            [
              "target",
              "대상",
              [
                "whole_dish",
                "sauce",
                "surface",
                "inside",
                "coating",
                "skin",
                "broth",
                "noodles",
                "meat",
                "filling",
                "flesh",
                "cream",
                "beverage",
                "rice_grains",
              ],
            ],
            [
              "phase",
              "시점",
              [
                "first_bite",
                "first_sip",
                "early_meal",
                "during_meal",
                "late_meal",
                "after_swallow",
                "after_meal",
                "while_chewing",
                "repeated_bites",
                "repeated_sips",
              ],
            ],
          ].map(([key, label, options]) => (
            <label className="text-[11px]" key={key as string}>
              {label as string}
              <select
                aria-label={`${selection.labelSnapshot} ${label}`}
                className="ml-2 min-h-11 rounded-xl bg-white px-2 text-[12px]"
                value={String(selection[key as string] ?? "unspecified")}
                onChange={(e) => update(key as string, e.target.value)}
              >
                <option value="unspecified">따로 정하지 않음</option>
                {(options as string[]).filter(value => selection.catalogVersion !== 'dining-sensory-selection/1' || !['beverage','rice_grains','first_sip','while_chewing','repeated_bites','repeated_sips'].includes(value)).map((value) => (
                  <option key={value} value={value}>
                    {conditionLabels[value] ?? ({beverage:'음료',rice_grains:'밥알',first_sip:'첫 모금',while_chewing:'씹는 동안',repeated_bites:'반복해서 먹을 때',repeated_sips:'반복해서 마실 때'} as Record<string,string>)[value] ?? value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {selection.type === "detailTag" && (selection.bindingMode==='modifier'||selection.catalogVersion==='dining-sensory-selection/1') && (
          <label className="text-[11px]">
            연결
            <select
              className="ml-2 min-h-11 rounded-xl bg-white px-2 text-[12px]"
              aria-label={`${selection.labelSnapshot} 연결`}
              value={selection.relatedBubbleID ?? ""}
              onChange={(e) => onChange({...selection,relatedBubbleID:e.target.value||null,relatedBubbleLabelSnapshot:bubbles.find(b=>b.id===e.target.value)?.labelSnapshot??null,scopeKind:e.target.value?'bubble':'whole_dish',target:e.target.value?'unspecified':'whole_dish'})}
            >
              <option value="">음식 전체</option>
              {selection.relatedBubbleID&&!bubbles.some(b=>b.id===selection.relatedBubbleID)&&<option value={selection.relatedBubbleID}>{String(selection.relatedBubbleLabelSnapshot??'기존 선택')} · 연결 확인</option>}
              {bubbles.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.labelSnapshot}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="text-[11px] leading-5 text-[var(--tb-color-text-hint)]">
          모든 평가는 선택사항이며, 고르지 않은 값은 미응답으로 저장됩니다.
        </p>
        <button
          type="button"
          className="min-h-11 text-left text-[12px]"
          onClick={onRemove}
        >
          이 선택 지우기
        </button>
        {onDuplicate&&<button type="button" className="min-h-11 text-left text-[12px]" onClick={onDuplicate}>다른 대상·시점으로 추가</button>}
      </div>
    </details>
  );
}
