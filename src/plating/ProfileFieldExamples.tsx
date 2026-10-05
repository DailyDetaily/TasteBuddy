import { useState } from "react";
import TextInput from "../components/system/TextInput";
import SelectField from "../components/system/SelectField";
import SelectionCard from "../components/system/SelectionCard";
import PrimaryButton from "../components/system/PrimaryButton";
import WheelDatePicker from "../components/system/plating/WheelDatePicker";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../components/ui/dialog";

export function TextInputExample({ state, label, inputType = "text" }: { state: string; label: string; inputType?: string }) {
  const [value, setValue] = useState(state === "입력됨" ? "tastebuddy" : "");
  return <TextInput type={inputType} label={label || "버디네임"} placeholder="Taste Buddy에서 사용할 이름" value={value} onChange={event => setValue(event.target.value)} helperText="친구가 나를 찾는 고유 버디네임입니다." error={state === "오류" ? "버디네임을 입력해 주세요." : undefined} disabled={state === "비활성"} readOnly={state === "읽기 전용"} data-doc-focused={state === "초점" || undefined} />;
}

const options = [{ value: "female", label: "여성" }, { value: "male", label: "남성" }, { value: "other", label: "기타 / 직접 응답하지 않음" }, { value: "skip", label: "답변하지 않음" }];
const dietaryOptions = ["채식 위주", "비건", "페스코", "돼지고기 제외"];

export function SelectFieldExample({ state, label, thumbnail }: { state: string; label: string; thumbnail?: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(state === "선택됨" ? "female" : "");
  const [date, setDate] = useState("");
  const [draftDate, setDraftDate] = useState("1995-01-01");
  const [dietary, setDietary] = useState<string[]>([]);
  const kind = state === "날짜 선택" ? "date" : state === "복수 선택" ? "multiple" : state === "메뉴 선택" ? "menu" : "single";
  const title = label || (kind === "date" ? "생년월일" : kind === "multiple" ? "식이제한" : "성별");
  const selected = kind === "date" ? date : kind === "multiple" ? dietary.join(", ") : options.find(option => option.value === value)?.label;
  const error = state === "오류" ? "선택한 값을 확인해 주세요." : undefined;
  if (kind === "menu") return <SelectField mode="menu" label={title} value={value} options={options} onChange={event => setValue(event.target.value)} />;
  const trigger = <SelectField label={title} value={selected} disabled={state === "비활성"} error={error} aria-expanded={open} />;
  if (thumbnail) return trigger;
  if (kind === "date") return <Dialog open={open} onOpenChange={next => { if (next) setDraftDate(date || "1995-01-01"); setOpen(next); }}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent className="pl-add-profile-date-dialog">
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <DialogDescription className="sr-only">생년월일을 선택하고 적용해 주세요.</DialogDescription>
      <WheelDatePicker title={title} value={draftDate} onValueChange={setDraftDate} onClose={() => setOpen(false)} onApply={value => { setDate(value); setOpen(false); }} />
    </DialogContent>
  </Dialog>;
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent className="pl-add-picker-dialog">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>프로필의 선택 방식을 보여주는 로컬 예제예요.</DialogDescription>
      {kind === "multiple" ? <>
        <div className="pl-add-stack">{dietaryOptions.map(option => <SelectionCard key={option} title={option} indicator="checkbox" singleLine selected={dietary.includes(option)} onClick={() => setDietary(previous => previous.includes(option) ? previous.filter(item => item !== option) : [...previous, option])} />)}</div>
        <PrimaryButton onClick={() => setOpen(false)}>선택 완료</PrimaryButton>
      </> : <div className="pl-add-stack">{options.map(option => <SelectionCard key={option.value} title={option.label} indicator="radio" singleLine selected={value === option.value} onClick={() => setValue(value === option.value ? "" : option.value)} />)}</div>}
    </DialogContent>
  </Dialog>;
}
