import InterpretationCard from '../components/system/InterpretationCard';
import { TextInputExample } from "./ProfileFieldExamples";
import { componentExampleContent as exampleContent } from "./componentExampleContent";
import { ChipExample } from "./ChipExamples";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Home,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import PrimaryButton from "../components/system/PrimaryButton";
import TopAppBar from "../components/TopAppBar";
import TasteChip from "../components/system/TasteChip";
import SelectionCard from "../components/system/SelectionCard";
import Chip, { type ChipSize, type ChipTone, type ChipVariant } from "../components/system/Chip";
import StatusChip from "../components/system/StatusChip";
import EmptyState from "../components/system/EmptyState";
import StepIndicator from "../components/system/StepIndicator";
import ToastSurface from "../components/system/ToastSurface";
import PalateBloomAvatar, { type PalateBloomPetalShape, type PalateBloomStamenShape, type PalateBloomPistilShape } from "../components/system/PalateBloomAvatar";
import TasteProfileAvatar from "../components/system/TasteProfileAvatar";
import CompactCard from "../components/system/CompactCard";
import BottomSheetShell, {
  BottomSheetCloseButton,
  BottomSheetIconButton,
} from "../components/system/BottomSheetShell";
import {
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "../components/ui/drawer";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import type { CatalogComponent } from "./catalog";
import AdditionalPreview from "./AdditionalPreview";
import { defaultPreviewOptions, statePreviewOptions, type PreviewOptions } from "./componentDocumentation";
import { COMPONENT_TOKENS } from "../constants/designTokens";

const profile = {
  sweet: 72,
  sour: 58,
  bitter: 36,
  salty: 46,
  umami: 84,
  fat: 63,
};
const senses = ["고소함", "산뜻함", "부드러움", "바삭함"];
export default function ComponentPreview({
  component,
  state = component.states[0],
  label = "",
  compact = false,
  thumbnail = false,
  sample = false,
  options: optionOverrides,
}: {
  component: CatalogComponent;
  state?: string;
  label?: string;
  compact?: boolean;
  thumbnail?: boolean;
  sample?: boolean;
  options?: PreviewOptions;
}) {
  const options = { ...defaultPreviewOptions(component.id), ...statePreviewOptions(component.id, state), ...optionOverrides };
  const staticExample = sample || thumbnail;
  const uid = useId();
  const [selected, setSelected] = useState(
    () => state.includes("선택") || state.startsWith("켜짐"),
  );
  const [radioValue, setRadioValue] = useState(() => exampleContent.radio.options[state.includes("선택") ? 1 : 0].value);
  const [mixed, setMixed] = useState(state === "혼합");
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState(0);
  const [bubbles, setBubbles] = useState<string[]>(["고소함"]);
  const opener = useRef<HTMLButtonElement>(null);
  const disabled = state.includes("비활성") && state !== "설명 가능한 비활성";
  const readOnly = state === "읽기 전용";
  const pressed = state.includes("누름");
  const empty = /없음|부족/.test(state);
  const showFeedback = (message: string) => setFeedback(message);
  useEffect(() => {
    // A preset seeds the example; subsequent input controls its live state.
    setSelected(state.includes("선택") || state.startsWith("켜짐"));
    setRadioValue(exampleContent.radio.options[state.includes("선택") ? 1 : 0].value);
    setMixed(state === "혼합");
    setText(["입력됨", "읽기 전용", "결과 없음"].includes(state) ? "토마토 파스타" : "");
    setFeedback("");
    if (component.id === "bottom-tab")
      setTab(["홈", "다이닝", "분석"].indexOf(state));
    if (component.id === "sensory-bubble") setBubbles(state.includes("선택") ? ["고소함"] : []);
    if (component.id === "step-indicator")
      setStep(state === "첫 단계" ? 0 : state === "마지막 단계" ? Number(options.total) - 1 : Math.floor(Number(options.total) / 2));
    if (state === "초점" && !staticExample) document.getElementById(uid)?.focus();
    if (!staticExample) setOpen(state === "열림" || state === "항목 비활성");
  }, [component.id, state, uid, staticExample, options.total]);
  const word = label || "기록 완료";
  let demo;
  switch (component.id) {
    case "primary-button":
      demo = (
        <PrimaryButton
          size={compact || options.size === "compact" ? "compact" : "default"}
          fullWidth={options.fullWidth !== "false"}
          visualDisabled={state === "설명 가능한 비활성"}
          disabled={disabled || state === "처리 중"}
          aria-busy={state === "처리 중"}
          onClick={() =>
            showFeedback(
              state === "설명 가능한 비활성" ? "아직 완료하지 않은 항목이 있어요." : "기록을 완료했어요. 이 예제는 데이터를 저장하지 않아요.",
            )
          }
          style={pressed ? { transform: "scale(.98)" } : undefined}
        >
          {state === "처리 중" ? "저장 중" : word}
        </PrimaryButton>
      );
      break;
    case "icon-button":
      demo = (
        <div className="pl-demo-row">
          <BottomSheetIconButton
            icon={options.icon === "search" ? Search : options.icon === "filter" ? SlidersHorizontal : X}
            iconSize={Number(options.iconSize)}
            iconStrokeWidth={Number(options.stroke)}
            ariaLabel={options.icon === "search" ? "검색 예제" : options.icon === "filter" ? "필터 예제" : "닫기 예제"}
            onClick={() => showFeedback("아이콘 버튼을 실행했어요.")}
            disabled={disabled}
          />
        </div>
      );
      break;
    case "text-input":
      demo = <TextInputExample key={state} state={state} label={label} inputType={options.inputType} />;
      break;
    case "inline-error":
    case "search-field": {
      const error = state === "오류" || component.id === "inline-error";
      demo = (
        <div className="pl-demo-field">
          <label htmlFor={uid}>
            {component.id === "search-field" ? "음식 검색" : "음식 이름"}
          </label>
          <div className="pl-search-field">
            {component.id === "search-field" && (
              <Search size={18} aria-hidden="true" />
            )}
            <Input
              id={uid}
              type={component.id === "search-field" ? "search" : options.inputType ?? "text"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={label || "음식 이름을 입력해 주세요"}
              aria-invalid={error}
              aria-describedby={options.helper !== "false" ? `${uid}-help` : undefined}
              data-doc-focused={state === "초점" || undefined}
            />
            {component.id === "search-field" && options.clear !== "false" && text && (
              <button
                type="button"
                aria-label="입력 지우기"
                disabled={disabled || readOnly}
                onClick={() => { setText(""); document.getElementById(uid)?.focus(); }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {options.helper !== "false" && <span id={`${uid}-help`} className={error ? "pl-error" : ""}>
            {error
              ? options.message === "format" ? "이름은 2글자 이상 입력해 주세요." : "음식 이름을 입력해 주세요."
              : empty
                ? "검색 결과가 없어요. 다른 이름으로 찾아보세요."
                : "기록할 음식을 알아볼 수 있는 이름을 입력해요."}
          </span>}
        </div>
      );
      break;
    }
    case "selection-card":
      demo = (
        <SelectionCard
          title={label || exampleContent.selectionCard.title}
          description={options.singleLine === "true" ? undefined : exampleContent.selectionCard.description}
          indicator={options.indicator === "checkbox" ? "checkbox" : "radio"}
          singleLine={options.singleLine === "true"}
          trailing={options.trailing === "true" ? <ChevronRight size={18} aria-hidden="true" /> : undefined}
          selected={selected}
          disabled={disabled}
          onClick={() => setSelected((current) => !current)}
        />
      );
      break;
    case "chip": {
      if (["디테일 기본", "디테일 선택", "추가", "입력 중", "+N"].includes(state)) {
        demo = <ChipExample key={state} state={state} label={label} />;
        break;
      }
      const size = options.size as ChipSize;
      const iconSize = Number.parseFloat(COMPONENT_TOKENS.chip.size[size].iconSize);
      const leading = ["leading", "both"].includes(options.icons) ? <Check size={iconSize} aria-hidden="true" /> : undefined;
      const trailing = ["trailing", "both"].includes(options.icons) ? <ChevronRight size={iconSize} aria-hidden="true" /> : undefined;
      const isToggle = options.usage === "toggle";
      const variant = (isToggle && selected ? "solid" : options.variant) as ChipVariant;
      const chipProps = { size, variant, tone: options.tone as ChipTone, style: pressed ? { transform: "scale(.97)" } : undefined };
      demo = options.usage === "display" ? (
        <Chip {...chipProps} leadingIcon={leading} trailingIcon={trailing}>{label || "가보고 싶은 다이닝"}</Chip>
      ) : (
        <Chip {...chipProps} asChild>
          <button type="button" className="active:scale-[0.97]" disabled={disabled} aria-pressed={isToggle ? selected : undefined}
            onClick={() => isToggle ? setSelected(v => !v) : showFeedback("칩의 행동을 실행했어요.")}>
            {leading}<span>{label || "가보고 싶은 다이닝"}</span>{trailing}
          </button>
        </Chip>
      );
      break;
    }
    case "checkbox":
      demo = (
        <label className="pl-demo-control">
          <Checkbox
            checked={mixed ? "indeterminate" : selected}
            disabled={disabled}
            aria-invalid={options.invalid === "true"}
            onCheckedChange={(v) => { setMixed(v === "indeterminate"); setSelected(v === true); }}
          />
          <span>{label || exampleContent.checkbox}</span>
        </label>
      );
      break;
    case "radio":
      demo = (
        <RadioGroup
          value={radioValue}
          onValueChange={setRadioValue}
          disabled={disabled}
          orientation={options.orientation === "vertical" ? "vertical" : "horizontal"}
          aria-label={label || exampleContent.radio.label}
          className={options.orientation === "vertical" ? "pl-demo-stack" : "pl-demo-row"}
        >
          {exampleContent.radio.options.map((option) => (
            <label className="pl-demo-control" key={option.value}>
              <RadioGroupItem value={option.value} aria-invalid={options.invalid === "true"} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      );
      break;
    case "switch":
      demo = (
        <label className="pl-demo-control">
          <Switch
            size={options.size as "sm" | "md" | "lg"}
            checked={selected}
            disabled={disabled}
            onCheckedChange={setSelected}
          />
          <span>{label || exampleContent.switch}</span>
        </label>
      );
      break;
    case "top-bar":
      if (options.appearance === "glass") {
        demo = <div className="pl-demo-topbar-glass-stage">
          <TopAppBar appearance="glass" title={label || "버섯 리소토"} showBack={options.back !== "false"}
            onBack={() => showFeedback("전체 평가로 돌아가는 예제")}
            rightActions={options.actions === "false" ? <></> : <>
              <button type="button" aria-label="미각 단어 검색" onClick={() => showFeedback("미각 단어 검색을 여는 예제")}><Search size={24} strokeWidth={1.8} /></button>
              <button type="button" aria-label="디테일 태그 기록하기" onClick={() => showFeedback("디테일 태그로 이동하는 예제")}><ChevronRight size={24} strokeWidth={1.8} /></button>
            </>} />
        </div>;
        break;
      }
      demo = (
        <div className="pl-demo-topbar" data-appearance={options.appearance}>
          {options.back !== "false" ? <button
            aria-label="이전 화면"
            onClick={() => showFeedback("이전 화면으로 이동하는 예제")}
          >
            <ArrowLeft size={20} />
          </button> : <span className="pl-demo-chrome-space" aria-hidden="true" />}
          <strong>{label || "식사 기록"}</strong>
          {options.actions !== "false" ? <button
            aria-label="추가 메뉴"
            onClick={() => showFeedback("추가 메뉴 예제")}
          >
            <MoreHorizontal size={20} />
          </button> : <span className="pl-demo-chrome-space" aria-hidden="true" />}
        </div>
      );
      break;
    case "bottom-tab":
      demo = (
        <div className="pl-demo-tabs">
          {[Home, Check, Sparkles].map((Icon, i) => (
            <button
              key={i}
              aria-current={tab === i ? "page" : undefined}
              aria-label={["홈", "다이닝", "분석"][i]}
              onClick={() => setTab(i)}
            >
              <Icon size={21} />
              {options.labels !== "false" && <span>{["홈", "다이닝", "분석"][i]}</span>}
            </button>
          ))}
        </div>
      );
      break;
    case "back-button":
      demo = (
        <button
          className="pl-demo-back"
          disabled={disabled}
          aria-label={label || "이전 단계"}
          onClick={() => showFeedback("방문한 이전 단계로 돌아가요")}
        >
          <ArrowLeft size={20} />
          {options.labelVisible !== "false" && <span>{label || "이전 단계"}</span>}
        </button>
      );
      break;
    case "step-indicator":
      demo = (
        <div className="pl-demo-stack">
          <StepIndicator total={Number(options.total)} currentIndex={step}
            activeColor={options.accent === "taste" ? "var(--tb-taste-sweet-main)" : undefined} />
          {!staticExample && (
            <button
              className="pl-text-action"
              onClick={() => setStep((step + 1) % Number(options.total))}
            >
              다음 단계
            </button>
          )}
        </div>
      );
      break;
    case "card":
      demo = (
        <CompactCard
          as={options.as === "button" ? "button" : "div"}
          disabled={options.as === "button" && disabled}
          onClick={options.as === "button" ? () => showFeedback("카드 상세를 여는 예제예요.") : undefined}
          heading={label || "오늘의 식사"}
          metadata={options.metadata !== "false" ? "합성 예제 · 저녁" : undefined}
          media={<span className="pl-demo-food">◒</span>}
          actions={options.actions === "true" ? <ChevronRight size={18} aria-hidden="true" /> : undefined}
        />
      );
      break;
    case "list-row":
      demo = (
        <div className="pl-demo-list">
          {["기록한 식사", "내가 느낀 감각"].map((t, index) => (
            <div key={t} className="pl-demo-value-row" data-stacked={options.layout === "stack" || undefined}
              style={{ borderTop: index > 0 && options.divider === "true" ? "1px solid var(--tb-color-border-subtle)" : undefined }}>
              <span>{t}</span>
              {options.chevron === "true" ? <button onClick={() => showFeedback(`${t} 상세 예제`)}>
                {index ? "6개" : "3회"}<ChevronRight size={18} />
              </button> : <strong>{index ? "6개" : "3회"}</strong>}
            </div>
          ))}
        </div>
      );
      break;
    case "badge":
      demo = (
        <div className="pl-demo-row">
          <StatusChip
            color={options.tone === "default" ? undefined : `var(--tb-color-${options.tone})`}
            backgroundColor={options.tone === "default" ? undefined : `var(--tb-color-${options.tone}-soft)`}
          >{label || (options.tone === "success" ? "저장 완료" : options.tone === "warning" ? "확인 필요" : "기록 기반")}</StatusChip>
        </div>
      );
      break;
    case "avatar":
      demo = <TasteProfileAvatar initials={label || "TB"} size={options.size as "sm" | "md" | "lg" | "xl"}
        ariaLabel="합성 예제 프로필" imageSrc={options.content === "image" ? "/plating/petal.jpg" : undefined} />;
      break;
    case "divider":
      demo = (
        <div className={options.orientation === "vertical" ? "pl-demo-row pl-divider-vertical" : "pl-demo-stack"}>
          <span>식사 경험</span>
          <Separator orientation={options.orientation === "vertical" ? "vertical" : "horizontal"} decorative={options.decorative !== "false"} />
          <span>감각과 평가</span>
        </div>
      );
      break;
    case "toast":
      demo = (
        <ToastSurface
          message={label || "기록을 저장했어요"}
          media={options.media === "true" ? <Check size={20} aria-hidden="true" /> : undefined}
          actionLabel={options.action === "true" ? "되돌리기" : undefined}
          onAction={
            options.action === "true"
              ? () =>
                  showFeedback("되돌리기 예제예요. 실제 기록은 바뀌지 않아요.")
              : undefined
          }
        />
      );
      break;
    case "empty-state":
      demo = (
        <EmptyState
          title={
            state === "검색 결과 없음"
              ? "검색 결과가 없어요"
              : "아직 식사 기록이 없어요"
          }
          description={
            state === "검색 결과 없음"
              ? "다른 이름으로 찾아보세요."
              : "첫 경험을 남겨 보세요."
          }
          actionLabel={options.action === "false" ? undefined : state === "검색 결과 없음" ? "조건 지우기" : "식사 기록"}
          actionTone={options.actionTone === "user-accent" ? "user-accent" : "default"}
          icon={options.icon === "true" ? <Search size={20} aria-hidden="true" /> : undefined}
          onAction={() => showFeedback("다음 행동을 시작하는 예제예요.")}
        />
      );
      break;
    case "progress":
      demo = (
        <div className="pl-demo-stack">
          <span role="status">기록을 살펴보고 있어요</span>
          {state === "비정량" ? (
            <span className={`pl-demo-loading ${staticExample ? "is-static" : ""}`} role="progressbar" aria-label="처리 중" />
          ) : (
            <Progress value={Number(options.value)} aria-label="기록 분석 진행률"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(options.value)} />
          )}
        </div>
      );
      break;
    case "bottom-sheet":
      demo = staticExample ? (
        state === "닫힘" && !thumbnail ? <PrimaryButton>바텀시트 열기</PrimaryButton> :
        <div className="pl-demo-sheet">
          <span className="pl-grabber" />
          <div className="pl-demo-row">{options.headerLayout === "back" && <ArrowLeft size={18} />}<strong>{label || "감각 선택"}</strong>{options.close === "true" && <X size={18} />}</div>
          <p>식사에서 느낀 감각을 골라 주세요.</p>
          <TasteChip taste="단맛" />
          {options.footer === "true" && <PrimaryButton>선택 완료</PrimaryButton>}
        </div>
      ) : (
        <BottomSheetShell
          open={open}
          onOpenChange={setOpen}
          trigger={
            <DrawerTrigger asChild>
              <PrimaryButton ref={opener}>바텀시트 열기</PrimaryButton>
            </DrawerTrigger>
          }
          headerStart={options.headerLayout === "back" ? <BottomSheetIconButton icon={ArrowLeft} ariaLabel="이전 선택 단계" onClick={() => showFeedback("이전 선택 단계 예제")} /> : undefined}
          headerCenter={<DrawerTitle>{label || "감각 선택"}</DrawerTitle>}
          headerEnd={options.close === "true" ? <BottomSheetCloseButton /> : undefined}
          footer={
            options.footer === "true" ?
            <PrimaryButton
              onClick={() => {
                setOpen(false);
                opener.current?.focus();
              }}
            >
              선택 완료
            </PrimaryButton> : undefined
          }
        >
          <DrawerDescription>
            식사에서 느낀 감각을 골라 주세요. 선택은 호감과 별개예요.
          </DrawerDescription>
          <div className="pl-sheet-choices">
            {senses.map((v) => (
              <SelectionCard
                key={v}
                title={v}
                indicator="checkbox"
                selected={bubbles.includes(v)}
                onClick={() =>
                  setBubbles(
                    bubbles.includes(v)
                      ? bubbles.filter((x) => x !== v)
                      : [...bubbles, v],
                  )
                }
              />
            ))}
          </div>
        </BottomSheetShell>
      );
      break;
    case "dialog":
      demo = staticExample ? (
        state === "닫힘" && !thumbnail ? <PrimaryButton>다이얼로그 열기</PrimaryButton> :
        <div className="pl-demo-dialog">
          <strong>기록을 삭제할까요?</strong>
          {options.description === "true" && <p>대상을 확인한 뒤 결정해 주세요.</p>}
          <div style={{display:"flex",gap:8,flexDirection:options.actionLayout === "stack" ? "column" : "row"}}><span>취소</span><span>기록 삭제</span></div>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <PrimaryButton>다이얼로그 열기</PrimaryButton>
          </DialogTrigger>
          <DialogContent aria-describedby={options.description === "false" ? undefined : `${uid}-description`}>
            <DialogTitle>{label || "예제 기록을 삭제할까요?"}</DialogTitle>
            {options.description === "true" && <DialogDescription id={`${uid}-description`}>
              합성 예제로 만든 기록이에요. 실제 데이터는 바뀌지 않아요.
            </DialogDescription>}
            <div className={options.actionLayout === "stack" ? "pl-demo-stack" : "pl-demo-row"}>
              <button
                className="pl-quiet-button"
                onClick={() => setOpen(false)}
              >
                취소
              </button>
              <PrimaryButton
                fullWidth={false}
                onClick={() => {
                  setOpen(false);
                  showFeedback("예제 기록을 삭제했어요.");
                }}
              >
                예제 기록 삭제
              </PrimaryButton>
            </div>
          </DialogContent>
        </Dialog>
      );
      break;
    case "menu":
      demo = staticExample ? (
        state === "닫힘" && !thumbnail ? <PrimaryButton>기록 메뉴 열기</PrimaryButton> :
        <div className="pl-demo-menu">
          <span>{options.menuType !== "action" && <Check size={14} />} {options.menuType === "action" ? "기록 편집" : "기록 기준"}</span>
          <span style={{opacity:state === "항목 비활성" ? .5 : 1,color:options.destructive === "true" && options.menuType === "action" ? "var(--tb-color-destructive)" : undefined}}>{options.menuType === "action" ? "기록 삭제" : "미각 기준"}</span>
        </div>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <PrimaryButton>기록 메뉴 열기</PrimaryButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={options.align as "start" | "center" | "end"}>
            {options.menuType === "checkbox" ? <>
              <DropdownMenuCheckboxItem checked={selected} onCheckedChange={setSelected}>기록 기준</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={mixed} disabled={state === "항목 비활성"} onCheckedChange={setMixed}>미각 기준</DropdownMenuCheckboxItem>
            </> : options.menuType === "radio" ? <DropdownMenuRadioGroup value={selected ? "taste" : "record"} onValueChange={v=>setSelected(v === "taste")}>
              <DropdownMenuRadioItem value="record">기록 기준</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="taste" disabled={state === "항목 비활성"}>미각 기준</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup> : <>
            <DropdownMenuItem onSelect={() => showFeedback("기록 편집 예제")}>
              기록 편집
            </DropdownMenuItem>
            <DropdownMenuItem
              variant={options.destructive === "true" ? "destructive" : "default"}
              disabled={state === "항목 비활성"}
              onSelect={() =>
                showFeedback("삭제 확인은 다이얼로그에서 진행해요")
              }
            >
              기록 삭제
            </DropdownMenuItem>
            </>}
          </DropdownMenuContent>
        </DropdownMenu>
      );
      break;
    case "taste-chip":
      demo = (
        <div className="pl-demo-row pl-taste-wrap">
            <TasteChip
              taste={options.taste}
              tone={options.tone === "neutral" ? "neutral" : "taste"}
              value={options.value !== "none" ? Number(options.value) : undefined}
            />
        </div>
      );
      break;
    case "sensory-bubble":
      demo = (
        <div className={options.layout === "wrap" ? "pl-demo-row pl-sensory-wrap" : "pl-bubble-demo"}>
          {senses.map((v, i) => (
            <button
              key={v}
              style={{
                width: options.layout === "wrap" ? undefined : [85, 72, 92, 78][i],
                height: options.layout === "wrap" ? undefined : [85, 72, 92, 78][i],
              }}
              disabled={disabled}
              aria-pressed={bubbles.includes(v)}
              onClick={() =>
                  setBubbles(options.selection === "single" ? [v] :
                  bubbles.includes(v)
                    ? bubbles.filter((x) => x !== v)
                    : [...bubbles, v],
                )
              }
            >
              {v}
            </button>
          ))}
        </div>
      );
      break;
    case "taste-bloom":
      demo = empty ? (
        <p>기록이 쌓이면 미각의 관계를 보여드릴게요.</p>
      ) : (
        <PalateBloomAvatar
          profile={profile}
          size={thumbnail ? 128 : Number(options.size)}
          showFrame={options.frame === "true"}
          petalShape={options.petal as PalateBloomPetalShape}
          stamenShape={options.stamen as PalateBloomStamenShape}
          pistilShape={options.pistil as PalateBloomPistilShape}
          ariaLabel="합성 예제: 감칠맛 84, 단맛 72, 지방맛 63, 신맛 58, 짠맛 46, 쓴맛 36"
        />
      );
      break;
    case "interpretation-card":
      demo = <InterpretationCard eyebrow="합성 예제 · 기록 3개" description={label || "같은 감각도 조건에 따라 달라져요"} supportingText={empty ? "해석을 위한 기록이 더 필요해요." : "기록한 감각과 직접 평가를 함께 살펴봐요. 같은 감각도 음식의 온도와 식사 상황에 따라 다르게 느껴질 수 있어요."} />;
      break;
    case "dining-result":
      demo = empty ? (
        <div className="pl-result-demo"><span className="pl-mini-kicker">{component.id === "dining-result" ? "기록 0개" : "근거 부족"}</span><strong>{component.id === "dining-result" ? "아직 식사 기록이 없어요" : "해석을 위해 기록이 더 필요해요"}</strong><p>{component.id === "dining-result" ? "첫 식사 경험을 남겨 보세요." : "관찰을 더 모은 뒤 경향을 살펴봐요."}</p></div>
      ) : (
        <div className="pl-result-demo">
          {options.scope === "true" && <span className="pl-mini-kicker">합성 예제 · 기록 3개</span>}
          <strong>{label || "고소함이 남는 식사"}</strong>
          <p>최근 기록에서 고소한 감각을 자주 선택했어요.</p>
          {options.tags === "true" && <div className="pl-demo-row">
            <TasteChip taste="감칠맛" />
            <TasteChip taste="지방맛" />
          </div>}
        </div>
      );
      break;
    case "stack-card":
    case "expandable-card": {
      const captureState = state === "스택 펼침" || state === "본문 펼침" ? "expanded" : "default";
      demo = <img src={`/plating/native-component-audit/${component.id}--${captureState}.png`} alt={`실제 SwiftUI 렌더 · ${state} · 합성 예제`} style={{ width: "100%", maxWidth: 390, height: "auto" }} />;
      break;
    }
    case "taste-graph": {
      const values = Object.entries(profile).map(([key,value],i)=>({key,label:["단맛","신맛","쓴맛","짠맛","감칠맛","지방맛"][i],value:i === 0 && state === "미확인 포함" ? null : i === 0 && state === "0 포함" ? 0 : value}));
      const alternative = `합성 예제 미각 강도: ${values.map(v=>`${v.label} ${v.value ?? "미확인"}`).join(", ")}. 호감 점수가 아니에요.`;
      demo = empty ? (
        <p>아직 비교할 기록이 없어요.</p>
      ) : options.display === "table" ? (
        <table className="pl-demo-data-table"><caption>합성 예제 · 강도 0–100</caption><thead><tr><th>미각</th><th>강도</th></tr></thead><tbody>{values.map(v=><tr key={v.key}><th>{v.label}</th><td>{v.value ?? "미확인"}</td></tr>)}</tbody></table>
      ) : (
        <div
          className="pl-graph-demo"
          role="img"
          aria-label={alternative}
        >
          {values.map(({key, value, label: tasteLabel}) => (
            <div key={key}>
              <span>{tasteLabel}</span>
              <div>
                {value !== null && <i
                  style={{
                    width: `${value}%`,
                    background: `var(--tb-taste-${key}-main)`,
                  }}
                />}
              </div>
              {options.labels !== "false" && <b>{value ?? "—"}</b>}
            </div>
          ))}
        </div>
      );
      break;
    }
    default:
      demo = <AdditionalPreview key={`${component.id}:${state}`} id={component.id} state={state} label={label} thumbnail={thumbnail || (component.id === "tcs-badge" && staticExample)} options={options} />;
  }
  return (
    <div
      className={`pl-product-demo ${thumbnail ? "is-thumbnail" : ""} ${sample ? "is-comparison" : ""}`}
      data-component={component.id}
      data-demo-state={state}
      aria-hidden={sample || undefined}
      ref={(node) => { if (node) node.inert = sample; }}
    >
      <div className="pl-demo-content">{demo}</div>
      {!thumbnail && feedback && (
        <p className="pl-demo-feedback" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
