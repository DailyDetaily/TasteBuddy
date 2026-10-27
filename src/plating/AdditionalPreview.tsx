import MiniTreemapChartExamples from "./MiniTreemapChartExamples";
import InlineButtonExamples from './InlineButtonExamples';
import MiniBubbleChartExamples from "./MiniBubbleChartExamples";
import MiniHeatmapExamples from "./MiniHeatmapExamples";
import TCSBadgeExamples from "./TCSBadgeExamples";
import PieDonutChartExamples from "./PieDonutChartExamples";
import MiniStackedBarChartExamples from "./MiniStackedBarChartExamples";
import MiniAreaChartExamples from "./MiniAreaChartExamples";
import { getBirthDateLabel } from "../components/system/BirthDatePicker";
import { SelectFieldExample } from "./ProfileFieldExamples";
import IconActionExamples from "./IconActionExamples";
import MiniChartExamples from "./MiniChartExamples";
import MiniLineChartExamples from "./MiniLineChartExamples";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import PrimaryButton from "../components/system/PrimaryButton";
import StepIndicator from "../components/system/StepIndicator";
import ImageBox from "../components/system/ImageBox";
import { DateField, TextareaField } from "../components/system/plating/Fields";
import CapsuleTabs from "../components/system/plating/CapsuleTabs";
import PeriodPicker, { PERIOD_OPTIONS, type TasteDetailPeriod } from "../components/system/plating/PeriodPicker";
import { TASTE_IDS, type TasteId } from "../constants/designTokens";
import { NotificationBadge, TextAction } from "../components/system/plating/Actions";
import { ScopeLabel } from "../components/system/plating/Disclosure";
import Accordion, { AccordionItem, AccordionTrigger, AccordionContent } from "../components/system/plating/Accordion";
import Callout from "../components/system/plating/Callout";
import type { PreviewOptions } from "./componentDocumentation";
import { ChipGroupExample } from "./ChipExamples";
import { ContentSkeleton, FlowLoadingState, FlowRetryState } from "../components/system/plating/FlowState";
import WheelDatePicker from "../components/system/plating/WheelDatePicker";
import "./additional-preview.css";

const exampleImage = "/plating/bx-plan/dishtopviews-sequence-54adff12.jpg";
const modeOptions = [{ value: "overview", label: "요약" }, { value: "records", label: "기록" }];

type Props = { id: string; state: string; label: string; thumbnail?: boolean; options?: PreviewOptions };
export default function AdditionalPreview({ id, state, label, thumbnail = false, options }: Props) {
  const [value, setValue] = useState(state === "입력됨" ? "겉은 바삭하고 안은 부드러웠어요. 마지막에 구운 향이 남았어요." : "");
  const [mode, setMode] = useState(state === "기록" ? "records" : "overview");
  const [period, setPeriod] = useState<TasteDetailPeriod>(PERIOD_OPTIONS.find(p => p.label === state)?.value ?? 3);
  const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label;
  const periodAxis = options?.axis === "none" ? undefined : TASTE_IDS.includes(options?.axis as TasteId) ? options?.axis as TasteId : undefined;
  const capsuleMenu = options?.menu === undefined ? state === "큰 글자" : options.menu === "true";
  const capsuleDisabled = options?.disabled === undefined ? state === "비활성" : options.disabled === "true";
  const [feedback, setFeedback] = useState("");
  const disabled = state === "비활성";
  const error = state === "오류";
  switch (id) {
    case "inline-button": return <InlineButtonExamples {...{ state, label, thumbnail, options }} />;
    case "tcs-badge": return <TCSBadgeExamples state={state} label={label} thumbnail={thumbnail} />;
    case "mini-heatmap": return <MiniHeatmapExamples thumbnail={thumbnail} />;
    case "mini-chart": return <MiniChartExamples thumbnail={thumbnail} />;
    case "mini-treemap-chart": return <MiniTreemapChartExamples thumbnail={thumbnail} />;
    case "mini-bubble-chart": return <MiniBubbleChartExamples thumbnail={thumbnail} />;
    case "pie-donut-chart": return <PieDonutChartExamples thumbnail={thumbnail} />;
    case "mini-stacked-bar-chart": return <MiniStackedBarChartExamples thumbnail={thumbnail} />;
    case "mini-area-chart": return <MiniAreaChartExamples thumbnail={thumbnail} state={state} variant={options?.variant} />;
    case "mini-line-chart": return <MiniLineChartExamples thumbnail={thumbnail} />;
    case "callout": return <Callout title="안내" tone={state === "성공" ? "positive" : state === "주의" ? "warning" : state === "오류" ? "critical" : "neutral"}>{label || "기억에 남는 감각을 식사 메모로 남길 수 있어요."}</Callout>;
    case "textarea": return <TextareaField label={label || "추가 메모 · 선택사항"} value={value} disabled={disabled} autoFocus={state === "초점" && !thumbnail} onChange={e => setValue(e.target.value)} placeholder="기억에 남는 맛과 상황을 적어 주세요." error={error ? "메모를 저장하지 못했어요. 작성한 내용은 남아 있어요." : undefined} />;
    case "select": return <SelectFieldExample key={state} {...{ state, label, thumbnail }} />;
    case "capsule-tabs": return (options?.usage ?? (state === "기간 선택" ? "period" : "view")) === "period"
      ? <div className="pl-add-stack"><PeriodPicker label={label || "기간"} axis={periodAxis} value={period} onValueChange={setPeriod} menu={capsuleMenu} disabled={capsuleDisabled} /><ScopeLabel>{periodLabel} · 식사일 기준</ScopeLabel></div>
      : <div className="pl-add-stack"><CapsuleTabs label={label || "상세 보기"} options={modeOptions} value={mode} onValueChange={setMode} axis={periodAxis} disabled={capsuleDisabled} menu={capsuleMenu} /><p className="tb-pl-hint" role="status">{mode === "overview" ? "요약 보기" : "기록 보기"} · 합성 예제</p></div>;
    case "text-action": return <div className="pl-add-stack"><TextAction disabled={disabled} onClick={() => setFeedback("작성을 취소했어요.")}>{label || "작성 취소"}</TextAction>{feedback && <p className="tb-pl-hint" role="status">{feedback}</p>}</div>;
    case "icon-action-button":
    case "record-actions":
    case "social-actions": return <IconActionExamples key={`${id}-${state}`} {...{ id, state, thumbnail }} />;
    case "notification-badge": return <NotificationExample {...{ state, label }} />;
    case "skeleton": return <ContentSkeleton shape={state === "텍스트" ? "text" : state === "미디어" ? "rectangle" : state === "아바타" ? "circle" : "card"} />;
    case "image-frame": return <div className="pl-add-stack"><ImageBox imageSrc={state === "원본 없음" ? undefined : state === "불러오기 실패" ? "data:image/png;base64,broken" : exampleImage} alt={label || "Taste Buddy 식사 이미지 예제"} kind="menu" className={`w-full ${state === "정사각형" ? "aspect-square" : "aspect-video"}`} />{!thumbnail && <p className="tb-pl-hint">{state === "원본 없음" ? "등록된 사진이 없어요." : state === "불러오기 실패" ? "사진을 불러오지 못했어요." : "기존 브랜드 이미지 · 가운데 기준으로 잘라 보여요."}</p>}</div>;
    case "disclosure": return <AccordionExample state={state} label={label} options={options} />;
    case "scope-label": return <ScopeLabel>{label || (state === "자기보고" ? "미각 설문 · 직접 답한 평소 선호 · 식사 감각 강도와 별개예요." : state === "근거 부족" ? "아직 비교할 기록이 충분하지 않아요. 기록하지 않은 감각은 판단하지 않아요." : "최근 3개월 · 식사일 기준 · 직접 남긴 기록 8개")}</ScopeLabel>;
    case "chip-group": return <ChipGroupExample key={state} state={state} label={label} />;
    case "flow-loading": return <FlowLoadingState message={label || (state === "긴 안내" ? "이전에 남긴 답변을 확인하고 있어요. 잠시만 기다려 주세요." : "미각 설문을 준비하고 있어요")} />;
    case "flow-retry": return <RetryExample {...{ state, label, thumbnail }} />;
    case "action-area": return <ActionAreaExample {...{ state, label }} />;
    case "date-picker": return <DateExample {...{ state, label }} />;
    case "wheel-picker": return <WheelExample key={state} {...{ state, label, thumbnail }} />;
    default: return null;
  }
}

function NotificationExample({ state, label }: { state: string; label: string }) {
  const initialCount = state === "읽음" ? 0 : state === "99+" ? 120 : 3;
  const [count, setCount] = useState(initialCount);
  return <div className="pl-add-stack"><div className="pl-add-actions"><button className="pl-add-bell" type="button" aria-label={`${label || "알림"}, ${count ? `읽지 않은 알림 ${count}개` : "새 알림 없음"}`} onClick={() => setCount(0)}><Bell size={24} aria-hidden="true" /><NotificationBadge count={count} dot={state === "점"} /></button><TextAction onClick={() => setCount(3)}>알림 예제 추가</TextAction></div><p role="status" className="tb-pl-hint">{count ? `읽지 않은 알림 ${count}개` : "모든 알림을 확인했어요."}</p></div>;
}

function RetryExample({ state, label, thumbnail }: Omit<Props, "id">) {
  const [phase, setPhase] = useState<"error" | "loading" | "ready">("error");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (phase === "loading") return <FlowLoadingState />;
  if (phase === "ready") return <div className="pl-add-stack"><p role="status">설문을 불러왔어요.</p><TextAction onClick={() => setPhase("error")}>실패 예제 다시 보기</TextAction></div>;
  return <FlowRetryState title={label || "미각 설문을 불러오지 못했어요"} message={state === "긴 안내" ? "연결 상태를 확인한 뒤 다시 시도해 주세요. 이전에 작성한 답변은 유지돼요." : "잠시 후 다시 시도해 주세요."} onRetry={() => { if (thumbnail) return; setPhase("loading"); timer.current = setTimeout(() => setPhase("ready"), 700); }} />;
}

function ActionAreaExample({ state, label }: { state: string; label: string }) {
  const [step, setStep] = useState(1);
  return (
    <div className="pl-add-action-screen">
      <p className="tb-pl-hint">식사 경험을 차례로 남겨요.</p>
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
        <div className="w-full max-w-[var(--tb-layout-screen-max-width)]">
          <div className="tb-bottom-fade relative flex min-h-[calc(var(--tb-size-bottom-fade-min-height)+var(--tb-safe-area-bottom))] w-full flex-col items-center justify-end gap-0 px-5 pb-[max(12px,var(--tb-safe-area-bottom))]">
            <div className="mb-8 flex flex-col items-center">
              <StepIndicator className="self-center" currentIndex={step} total={5} />
              <p className="text-center text-[12px] font-medium text-[var(--tb-color-text-faint)]">{`${step + 1} / 5단계`}</p>
            </div>
            {state === "보조 행동" ? (
              <div className="flex w-full gap-2">
                <PrimaryButton
                  className="border border-[var(--tb-color-border-strong)] bg-transparent text-[var(--tb-color-text-tertiary)] shadow-none"
                  disabled={step === 0}
                  onClick={() => setStep(Math.max(0, step - 1))}
                >
                  이전
                </PrimaryButton>
                <PrimaryButton onClick={() => setStep((step + 1) % 5)}>
                  {label || (step === 4 ? "처음부터 보기" : "다음")}
                </PrimaryButton>
              </div>
            ) : (
              <PrimaryButton disabled={state === "비활성"} onClick={() => setStep((step + 1) % 5)}>
                {label || (step === 4 ? "처음부터 보기" : "다음")}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function DateExample({ state, label }: { state: string; label: string }) {
  const [start, setStart] = useState("2026-09-01");
  const [end, setEnd] = useState(state === "오류" ? "2026-08-30" : "2026-09-30");
  const range = state === "기간" || state === "오류";
  return <div className="pl-add-stack"><DateField label={label || (range ? "기간 시작" : "식사일")} value={start} disabled={state === "비활성"} onChange={e => setStart(e.target.value)} hint={range ? "정확한 날짜가 기억나지 않을 때 기간을 남겨요." : "실제로 식사한 날짜를 남겨요."} />{range && <DateField label="기간 끝" value={end} min={start} onChange={e => setEnd(e.target.value)} error={end && start && end < start ? "종료일은 시작일 이후로 골라 주세요." : undefined} />}</div>;
}

function WheelExample({ state, label, thumbnail }: Omit<Props, "id">) {
  const initial = state === "말일" ? "2000-02-29" : "1995-01-01";
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [open, setOpen] = useState(true);
  return <div className="pl-add-stack">{open || thumbnail ? <WheelDatePicker title={label || "생년월일"} value={draft} onValueChange={setDraft} onClose={() => { setDraft(saved); setOpen(false); }} onApply={value => { setSaved(value); setOpen(false); }} /> : <TextAction onClick={() => { setDraft(saved); setOpen(true); }}>생년월일 선택 열기</TextAction>}{!thumbnail && <p className="tb-pl-hint" role="status">적용한 날짜 · {getBirthDateLabel(saved)}</p>}</div>;
}

function AccordionExample({ state, label, options }: Pick<Props, 'state' | 'label' | 'options'>) {
  const multiple = options?.multiple === undefined ? state === '복수 펼침' : options.multiple === 'true';
  const openPreset = options?.open ?? (state === '접힘' ? 'closed' : 'open');
  const [values, setValues] = useState<string[]>(openPreset === 'open' ? (multiple ? ['item-1', 'item-3'] : ['item-3']) : []);
  useEffect(() => { setValues(openPreset === 'open' ? (multiple ? ['item-1', 'item-3'] : ['item-3']) : []); }, [openPreset, multiple]);
  const variant = (options?.variant ?? (state === '분리형' ? 'separated' : 'inline')) === 'separated' ? 'separated' : 'inline';
  const format = (options?.format ?? (state === '문장형' ? 'paragraph' : 'bullets')) === 'paragraph' ? 'paragraph' : 'bullets';
  const size = options?.size === 'large' ? 'large' : options?.size === 'responsive' ? 'responsive' : 'medium';
  const lines = ['이 항목의 세부 내용을 작성합니다.', '짧은 정보는 목록으로 나누고, 이어지는 설명은 문장으로 작성합니다.', ...(state === '긴 내용' ? ['내용이 길어지면 패널 높이가 늘어나며 다른 항목과 함께 페이지에서 스크롤됩니다.'] : [])];
  return <Accordion multiple={multiple} values={values} onValuesChange={setValues} variant={variant} size={size} disabled={state === '비활성'}>
    {[1, 2, 3].map(index => <AccordionItem key={index} value={`item-${index}`}>
      <AccordionTrigger title={`${label || '헤더 타이틀'} ${index}`} />
      <AccordionContent><div className="tb-pl-accordion-body">{format === 'paragraph' ? <p>{lines.join(' ')}</p> : <ul>{lines.map(line => <li key={line}>{line}</li>)}</ul>}</div></AccordionContent>
    </AccordionItem>)}
  </Accordion>;
}
