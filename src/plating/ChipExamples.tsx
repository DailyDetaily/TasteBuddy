import { useState } from 'react';
import Chip from '../components/system/Chip';
import ChipGroup, { type ChipGroupItem } from '../components/system/plating/ChipGroup';
import { diningDetailTagCategories } from '../constants/diningDetailTags';

const exampleTags = diningDetailTagCategories.find(category => category.id === 'texture')!.tags.slice(0, 6);

export function ChipGroupExample({ state, label }: { state: string; label: string }) {
  const editable = state === '편집형' || state === '입력 중';
  const [items, setItems] = useState<ChipGroupItem[]>(state === '빈 목록' ? [] : exampleTags.map((tag, index) => ({
    ...tag, selected: editable && index === 0,
  })));
  const [open, setOpen] = useState(state === '입력 중');
  const [value, setValue] = useState(state === '입력 중' ? '뒤로 갈수록 깊어짐' : '');
  const shown = state === '긴 문구' ? [{ id: 'flow-deepens-late', label: '뒤로 갈수록 깊어짐' }, ...items] : items;
  const add = () => {
    const text = value.trim();
    if (!text) return;
    setItems(current => current.some(tag => tag.label === text) ? current.map(tag => tag.label === text ? { ...tag, selected: true } : tag)
      : [{ id: `custom-${text}`, label: text, selected: true, custom: true }, ...current]);
    setValue(''); setOpen(false);
  };
  return <ChipGroup label={label || '질감과 온도'} variant={editable ? 'editable' : 'basic'}
    items={shown} axis="sweet"
    onToggle={editable ? id => setItems(current => current.map(tag => tag.id === id ? { ...tag, selected: !tag.selected } : tag)) : undefined}
    input={{ open, value, onOpen: () => setOpen(true), onClose: () => setOpen(false), onChange: setValue, onSubmit: add }} />;
}

export function ChipExample({ state, label }: { state: string; label: string }) {
  const [open, setOpen] = useState(state === '입력 중');
  const [value, setValue] = useState(state === '입력 중' ? '뒤로 갈수록 깊어짐' : '');
  const [added, setAdded] = useState('');
  if (state === '+N') return <Chip kind="overflow" count={3} />;
  if (state === '추가' || state === '입력 중') return <div className="pl-add-stack">
    <Chip kind="add" label={label || '태그 직접 입력'} input={{ open, value,
      onOpen: () => setOpen(true), onClose: () => setOpen(false), onChange: setValue,
      onSubmit: () => { if (value.trim()) { setAdded(value.trim()); setValue(''); setOpen(false); } },
    }} />
    {added && <><Chip kind="label" label={added} selected axis="sweet" /><p role="status">{added} 태그를 추가했어요.</p></>}
  </div>;
  return <Chip kind="label" label={label || '부드러움'} selected={state === '디테일 선택'} axis="sweet" />;
}
