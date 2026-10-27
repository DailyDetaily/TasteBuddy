import { componentExampleContent as exampleContent } from "./componentExampleContent";
import type { CatalogComponent } from "./catalog";
import type { PreviewOptions } from "./componentDocumentation";

export function componentExampleCode(component: CatalogComponent, settings: PreviewOptions, state: string, label: string): string {
  const string = (value: string) => JSON.stringify(value);
  const disabled = state.includes("비활성") && state !== "설명 가능한 비활성";
  const selected = state.includes("선택") || state.startsWith("켜짐");
  const docReproduction = `// 현재 문서 프리뷰를 재현하는 코드입니다.\n// 제품 컴포넌트 API와 조합 설명은 속성 표 및 소스를 참고하세요.\nimport ComponentPreview from './ComponentPreview';\nimport { components } from './catalog';\n\nconst component = components.find(item => item.id === ${string(component.id)})!;\n<ComponentPreview\n  component={component}\n  state=${string(state)}\n  options={${JSON.stringify(settings, null, 2)}}${label ? `\n  label={${string(label)}}` : ""}\n/>`;
  switch (component.id) {
    case "tcs-badge": {
      const adjustments = state === "단색" ? [{ taste: "단맛", change: 12 }]
        : state === "세 가지 맛" ? [{ taste: "신맛", change: 10 }, { taste: "지방맛", change: 6 }, { taste: "쓴맛", change: 3 }]
        : state === "빈 데이터" || disabled ? [] : [{ taste: "단맛", change: 20 }, { taste: "감칠맛", change: 5 }];
      return `import TCSBadge from './components/system/TCSBadge';\n\n<TCSBadge\n  adjustments={${JSON.stringify(adjustments)}}${label ? `\n  label=${string(label)}` : ""}${disabled ? '\n  disabled' : ''}\n/>`;
    }
    case "chip-group": {
      const editable = state === "편집형" || state === "입력 중";
      return `import ChipGroup from './components/system/plating/ChipGroup';\n\n<ChipGroup items={tags}${editable ? '\n  variant="editable" axis="sweet"\n  onToggle={toggleTag} onAdd={addTag}' : ''}\n  label="질감과 온도"\n/>\n// tags의 id·label·selected·recommended·custom과 저장은 화면에서 관리해요.`;
    }
    case "capsule-tabs": {
      const taste = settings.axis && settings.axis !== "none" ? ` axis=${string(settings.axis)}` : "";
      const menu = settings.menu === undefined ? state === "큰 글자" : settings.menu === "true";
      const inactive = settings.disabled === undefined ? disabled : settings.disabled === "true";
      const common = `${taste}${menu ? ' menu' : ''}${inactive ? ' disabled' : ''}`;
      return (settings.usage ?? (state === "기간 선택" ? "period" : "view")) === "period"
        ? `import PeriodPicker from './components/system/plating/PeriodPicker';\n\n<PeriodPicker value={period} onValueChange={setPeriod}${common} />\n// PeriodPicker는 CapsuleTabs에 기간 옵션을 전달해요.\n// 날짜 범위 계산과 데이터 필터링은 화면에서 처리해요.`
        : `import CapsuleTabs from './components/system/plating/CapsuleTabs';\n\n<CapsuleTabs label=${string(label || "상세 보기")}\n  options={[{value: 'overview', label: '요약'}, {value: 'records', label: '기록'}]}\n  value={mode} onValueChange={setMode}${common}\n/>`;
    }
    case "disclosure": {
      const values = settings.open === "open" ? (settings.multiple === "true" ? ["item-1", "item-3"] : ["item-3"]) : [];
      const text = ["이 항목의 세부 내용을 작성합니다.", "짧은 정보는 목록으로 나누고, 이어지는 설명은 문장으로 작성합니다."];
      if (state === "긴 내용") text.push("내용이 길어지면 패널 높이가 늘어나며 다른 항목과 함께 페이지에서 스크롤됩니다.");
      const body = settings.format === "paragraph" ? `<p>${text.join(" ")}</p>` : `<ul>\n        ${text.map(line => `<li>${line}</li>`).join("\n        ")}\n      </ul>`;
      return `import Accordion, { AccordionItem, AccordionTrigger, AccordionContent } from './components/system/plating/Accordion';\n\n<Accordion multiple={${settings.multiple === "true"}} variant=${string(settings.variant || "inline")}\n  size=${string(settings.size || "medium")} disabled={${disabled}} defaultValues={${JSON.stringify(values)}}>\n  {[1, 2, 3].map(index => <AccordionItem value={\`item-\${index}\`} key={index}>\n    <AccordionTrigger title={\`${label || "헤더 타이틀"} \${index}\`} />\n    <AccordionContent><div className="tb-pl-accordion-body">\n      ${body}\n    </div></AccordionContent>\n  </AccordionItem>)}\n</Accordion>`;
    }
    case "chip": {
      if (["디테일 기본", "디테일 선택", "추가", "입력 중", "+N"].includes(state)) {
        const example = state === "+N" ? '<Chip kind="overflow" count={3} />'
          : state === "추가" || state === "입력 중" ? '<Chip kind="add" onAdd={addTag} />'
          : `<Chip kind="label" label=${string(label || "부드러움")}${state === "디테일 선택" ? ' selected axis="sweet"' : ''} />`;
        return `import Chip from './components/system/Chip';\n\n${example}\n// Chip의 kind로 기본 표시·추가 입력·생략 표시를 선택해요.`;
      }
      const leading = ["leading", "both"].includes(settings.icons);
      const trailing = ["trailing", "both"].includes(settings.icons);
      const iconSize = settings.size === "md" ? 14 : 12;
      if (settings.usage === "display") return `import Chip from './components/system/Chip';\nimport { Check, ChevronRight } from 'lucide-react';\n\n<Chip size=${string(settings.size)} tone=${string(settings.tone)} variant=${string(settings.variant)}${leading ? '\n  leadingIcon={<Check />}' : ''}${trailing ? '\n  trailingIcon={<ChevronRight />}' : ''}>\n  {${string(label || '가보고 싶은 다이닝')}}\n</Chip>`;
      return `import { useState } from 'react';\nimport Chip from './components/system/Chip';\nimport { Check, ChevronRight } from 'lucide-react';\n\n// 아래 상태와 JSX를 화면 컴포넌트 안에 배치하세요.\nconst [selected, setSelected] = useState(${selected});\n<Chip asChild size=${string(settings.size)} tone=${string(settings.tone)}\n  variant=${settings.usage === "toggle" ? `{selected ? "solid" : ${string(settings.variant)}}` : string(settings.variant)}>\n  <button type="button" className="active:scale-[0.97]" disabled={${disabled}}${settings.usage === "toggle" ? '\n    aria-pressed={selected}\n    onClick={() => setSelected(value => !value)}' : '\n    onClick={onAction}'}>\n    ${leading ? `<Check size={${iconSize}} aria-hidden="true" />\n    ` : ''}<span>{${string(label || '가보고 싶은 다이닝')}}</span>${trailing ? `\n    <ChevronRight size={${iconSize}} aria-hidden="true" />` : ''}\n  </button>\n</Chip>\n// asChild에서는 아이콘도 button 자식 안에 넣어요.\n// 누름 비교 형태는 문서 예제이며 Chip의 pressed prop은 없어요.`;
    }
    case "primary-button": return `<PrimaryButton size=${string(settings.size)}\n  fullWidth={${settings.fullWidth}}\n  disabled={${disabled || state === "처리 중"}}\n  visualDisabled={${state === "설명 가능한 비활성"}}\n  aria-busy={${state === "처리 중"}} onClick={onAction}>\n  {${string(state === "처리 중" ? "저장 중" : label || "기록 완료")}}\n</PrimaryButton>`;
    case "switch": return `const [checked, setChecked] = useState(${selected});\n<label>\n  <Switch size=${string(settings.size)} checked={checked}\n    disabled={${disabled}} onCheckedChange={setChecked} />\n  {${string(label || exampleContent.switch)}}\n</label>`;
    case "selection-card": return `const [selected, setSelected] = useState(${selected});\n<SelectionCard title={${string(label || exampleContent.selectionCard.title)}}\n  indicator=${string(settings.indicator)} singleLine={${settings.singleLine}}\n  description={${settings.singleLine === "true" ? "undefined" : string(exampleContent.selectionCard.description)}}\n  selected={selected} disabled={${disabled}}${settings.trailing === "true" ? '\n  trailing={<ChevronRight aria-hidden="true" />}' : ''}\n  onClick={() => setSelected(value => !value)} />`;
    case "avatar": return `<TasteProfileAvatar initials={${string(label || "TB")}} size=${string(settings.size)}\n  ariaLabel="프로필"${settings.content === "image" ? '\n  imageSrc="/plating/petal.jpg"' : ''} />`;
    case "taste-chip": return `<TasteChip taste=${string(settings.taste)} tone=${string(settings.tone)}${settings.value !== "none" ? ` value={${settings.value}}` : ''} />`;
    case "divider": return `<Separator orientation=${string(settings.orientation)} decorative={${settings.decorative}} />\n// vertical에는 높이가 있는 부모가 필요해요.`;
    case "taste-bloom": return state === "기록 없음" ? '<p>기록이 쌓이면 미각의 관계를 보여드릴게요.</p>' : `<PalateBloomAvatar\n  profile={{sweet:72, sour:58, bitter:36, salty:46, umami:84, fat:63}}\n  size={${settings.size}} showFrame={${settings.frame}}\n  petalShape=${string(settings.petal)}\n  stamenShape=${string(settings.stamen)}\n  pistilShape=${string(settings.pistil)}\n  ariaLabel="합성 예제의 미각 관계"\n/>`;
    default: return docReproduction;
  }
}
