import { useId, useLayoutEffect, useRef, useState } from 'react';
import Chip, { type ChipInputState } from '../Chip';
import type { TasteId } from '../../../constants/designTokens';
import { visibleChipCount } from './chipGroupLayout.mjs';
import './ChipGroup.css';

export interface ChipGroupItem {
  id: string;
  label: string;
  title?: string;
  selected?: boolean;
  recommended?: boolean;
  custom?: boolean;
}

/** Detail tags share the same Chip compositions in product screens and documentation. */
export default function ChipGroup({ items, label = '디테일 태그', variant = 'basic', overflow = variant === 'editable',
  emptyLabel = '표시할 태그가 없어요.', axis, onToggle, onAdd, input, disabled = false,
}: {
  items: readonly (string | ChipGroupItem)[];
  label?: string;
  variant?: 'basic' | 'editable';
  overflow?: boolean;
  emptyLabel?: string;
  axis?: TasteId;
  onToggle?: (id: string) => void;
  onAdd?: (value: string) => void;
  input?: ChipInputState;
  disabled?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const measures = useRef<HTMLDivElement>(null);
  const add = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const tags: ChipGroupItem[] = items.map((item, index) => typeof item === 'string' ? { id: `${index}-${item}`, label: item } : item);
  const itemKey = JSON.stringify(tags);
  useLayoutEffect(() => {
    if (!overflow || !root.current || !measures.current) return;
    const measure = () => {
      const widths = Array.from(measures.current!.querySelectorAll<HTMLElement>('[data-chip]')).map(node => node.getBoundingClientRect().width);
      const counts = Array.from(measures.current!.querySelectorAll<HTMLElement>('[data-count]')).map(node => node.getBoundingClientRect().width);
      const leading = add.current?.getBoundingClientRect().width ?? 0;
      setVisibleCount(visibleChipCount(widths, root.current!.clientWidth, 8, leading, counts));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root.current);
    for (const child of measures.current.children) observer.observe(child);
    if (add.current) observer.observe(add.current);
    return () => observer.disconnect();
  }, [itemKey, overflow, variant]);

  const count = Math.min(visibleCount, tags.length);
  const hidden = tags.length - count;
  const shown = overflow && !expanded ? tags.slice(0, count) : tags;
  if (!tags.length && variant === 'basic') return <p className="tb-chip-group-empty">{emptyLabel}</p>;
  return <div className="tb-chip-group" ref={root}>
    <div id={id} className={`tb-chip-group-items${overflow && !expanded ? ' is-collapsed' : ''}`} role="group" aria-label={label}>
      {variant === 'editable' && <div className="tb-chip-group-add" ref={add}>
        <Chip kind="add" label={`${label} 직접 입력`} input={input} onAdd={onAdd} disabled={disabled} />
      </div>}
      {shown.map(tag => <Chip kind="label" key={tag.id} {...tag} axis={axis} disabled={disabled}
        onClick={onToggle ? () => onToggle(tag.id) : undefined} />)}
      {overflow && hidden > 0 && <div ref={more} className="tb-chip-group-more">
        {expanded ? <Chip kind="label" label="접기" onClick={() => { setExpanded(false); requestAnimationFrame(() => more.current?.querySelector('button')?.focus()); }} />
          : <Chip kind="overflow" count={hidden} expanded={false} controls={id}
            onClick={() => { setExpanded(true); requestAnimationFrame(() => more.current?.querySelector('button')?.focus()); }} />}
      </div>}
    </div>
    {overflow && <div className="tb-chip-group-measure-clip" aria-hidden="true"><div className="tb-chip-group-measures" ref={measures}>
      {tags.map(tag => <span data-chip key={tag.id}><Chip kind="label" {...tag} axis={axis} /></span>)}
      {tags.map((_, index) => <span data-count key={`count-${index}`}><Chip kind="overflow" count={index + 1} /></span>)}
    </div></div>}
  </div>;
}
