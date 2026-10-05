import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { Slot } from '@radix-ui/react-slot';
import { Plus } from 'lucide-react';
import './Chip.css';

import { COMPONENT_TOKENS, TASTE_TOKENS, type TasteId } from '../../constants/designTokens';
import { cn } from '../ui/utils';

export type ChipSize = keyof typeof COMPONENT_TOKENS.chip.size;
export type ChipTone = keyof typeof COMPONENT_TOKENS.chip.tone;
export type ChipVariant = keyof (typeof COMPONENT_TOKENS.chip.tone)['neutral'];

interface ChipSurfaceProps extends HTMLAttributes<HTMLSpanElement> {
  kind?: undefined;
  asChild?: boolean;
  backgroundColorToken?: CSSProperties['backgroundColor'];
  leadingIcon?: ReactNode;
  size?: ChipSize;
  tone?: ChipTone;
  trailingIcon?: ReactNode;
  variant?: ChipVariant;
}

function ChipSurface({
  asChild = false,
  backgroundColorToken,
  children,
  className,
  leadingIcon,
  size = 'sm',
  style,
  tone = 'neutral',
  trailingIcon,
  variant = 'soft',
  ...props
}: ChipSurfaceProps) {
  const Comp = asChild ? Slot : 'span';
  const sizeTokens = COMPONENT_TOKENS.chip.size[size];
  const toneTokens = COMPONENT_TOKENS.chip.tone[tone][variant];

  const renderIcon = (icon: ReactNode) => {
    if (!icon) {
      return null;
    }

    const iconShellStyle = {
      width: sizeTokens.iconSize,
      height: sizeTokens.iconSize,
    } as CSSProperties;

    if (isValidElement<{ className?: string; style?: CSSProperties }>(icon)) {
      return (
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center justify-center"
          style={iconShellStyle}
        >
          {cloneElement(icon, {
            className: icon.props.className,
            style: {
              ...(icon.props.style ?? {}),
              width: '100%',
              height: '100%',
            },
          })}
        </span>
      );
    }

    return (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center"
        style={iconShellStyle}
      >
        {icon}
      </span>
    );
  };

  const chipStyle = {
    backgroundColor: backgroundColorToken ?? toneTokens.backgroundColor,
    borderColor: toneTokens.borderColor,
    color: toneTokens.color,
    fontSize: sizeTokens.fontSize,
    gap: sizeTokens.gap,
    paddingBlock: sizeTokens.paddingBlock,
    paddingInline: sizeTokens.paddingInline,
    ...style,
  } as CSSProperties;

  return (
    <Comp
      data-chip-size={size}
      data-chip-tone={tone}
      data-chip-variant={variant}
      data-slot="chip"
      className={cn(
        'tb-chip border',
        'disabled:pointer-events-none disabled:opacity-60',
        'aria-disabled:pointer-events-none aria-disabled:opacity-60',
        className,
      )}
      style={chipStyle}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {renderIcon(leadingIcon)}
          {children ? <span>{children}</span> : null}
          {renderIcon(trailingIcon)}
        </>
      )}
    </Comp>
  );
}

export interface ChipInputState {
  open: boolean;
  value: string;
  onOpen: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

type ChipControlProps = { disabled?: boolean; title?: string } & ({
  kind: 'label'; label: string; selected?: boolean; recommended?: boolean;
  custom?: boolean; axis?: TasteId; onClick?: () => void;
} | {
  kind: 'add'; label?: string; input?: ChipInputState; onAdd?: (value: string) => void;
} | {
  kind: 'overflow'; count: number; onClick?: () => void; expanded?: boolean; controls?: string;
});

/** Chip supports a label/selection, the expanding + input, and +N. */
export type ChipProps = ChipSurfaceProps | ChipControlProps;

export default function Chip(props: ChipProps) {
  if (props.kind === undefined) return <ChipSurface {...props} />;
  if (props.kind === 'add') return <AddChip {...props} />;
  if (props.kind === 'overflow') {
    if (props.count < 1) return null;
    const label = `${props.count}개 태그 더 ${props.onClick ? '보기' : '있음'}`;
    return <ChipSurface asChild size="md" className="tb-chip-control" style={chipControlStyle}>
      {props.onClick ? <button type="button" onClick={props.onClick} disabled={props.disabled}
        aria-label={label} aria-expanded={props.expanded} aria-controls={props.controls}>+{props.count}</button>
        : <span title={props.title || label}>+{props.count}</span>}
    </ChipSurface>;
  }
  const palette = props.axis ? TASTE_TOKENS[props.axis].palette : undefined;
  const style: CSSProperties = {
    ...chipControlStyle,
    ...(props.selected ? {
      backgroundColor: palette?.tintSurface ?? 'var(--tb-color-text-primary)',
      borderColor: palette?.tintSoftBorder ?? 'var(--tb-color-text-primary)',
      color: palette?.tintSurfaceText ?? 'var(--tb-color-text-inverse)',
    } : props.recommended ? {
      backgroundColor: 'color-mix(in srgb, var(--tb-user-accent-main) 10%, white)',
      borderColor: 'color-mix(in srgb, var(--tb-user-accent-main) 46%, white)',
      color: 'var(--tb-user-accent-main)',
    } : props.custom ? { borderStyle: 'dashed' } : {}),
  };
  const content = <span className="tb-chip-control-label">{props.label}</span>;
  return <ChipSurface asChild size="md" className="tb-chip-control" style={style}>
    {props.onClick ? <button type="button" title={props.title || props.label} disabled={props.disabled}
      aria-pressed={props.selected} onClick={props.onClick}>{content}</button>
      : <span title={props.title || props.label}>{content}</span>}
  </ChipSurface>;
}

const chipControlStyle: CSSProperties = {
  minHeight: 36, padding: '0 12px', fontSize: 12, fontWeight: 600, lineHeight: '18px',
  backgroundColor: 'var(--tb-color-surface-muted)', borderColor: 'var(--tb-color-border-default)',
  color: 'var(--tb-color-text-subtle)',
};

function AddChip({ label = '태그 직접 입력', input, onAdd, disabled }: Extract<ChipControlProps, { kind: 'add' }>) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const composing = useRef(false);
  const restoreFocus = useRef(false);
  const isOpen = input?.open ?? open;
  const draft = input?.value ?? value;
  const change = input?.onChange ?? setValue;
  const close = () => { input ? input.onClose() : setOpen(false); };
  useEffect(() => {
    if (isOpen) field.current?.focus();
    else if (restoreFocus.current) { trigger.current?.focus(); restoreFocus.current = false; }
  }, [isOpen]);
  if (!isOpen) return <ChipSurface asChild size="md" className="tb-chip-control tb-chip-control-add"
    style={{ ...chipControlStyle, padding: 0, width: 36, color: 'var(--tb-color-text-muted)' }}>
    <button ref={trigger} type="button" aria-label={label} disabled={disabled || (!input && !onAdd)}
      onClick={() => { input ? input.onOpen() : setOpen(true); }}>
      <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
    </button>
  </ChipSurface>;
  return <ChipSurface asChild size="md" className="tb-chip-control tb-chip-control-input" style={chipControlStyle}>
    <form onSubmit={event => {
      event.preventDefault();
      if (composing.current || disabled || !draft.trim()) return;
      restoreFocus.current = true;
      if (input) input.onSubmit();
      else { onAdd?.(draft.trim()); setValue(''); setOpen(false); }
    }}>
      <span className="tb-chip-control-input-measure" aria-hidden="true">{draft || ' '}</span>
      <input ref={field} aria-label={label} value={draft} size={1} disabled={disabled}
        autoComplete="off" autoCapitalize="none" spellCheck={false} enterKeyHint="done"
        onChange={event => change(event.target.value)}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={() => { composing.current = false; }}
        onKeyDown={event => {
          if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
            event.preventDefault(); change(''); restoreFocus.current = true; close();
          }
        }} onBlur={() => { if (!draft.trim()) close(); }} />
    </form>
  </ChipSurface>;
}
