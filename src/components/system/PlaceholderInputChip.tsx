import { useLayoutEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Plus } from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

interface PlaceholderInputChipProps {
  'aria-label': string;
  className?: string;
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
  inputRef?: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  value: string;
}

export default function PlaceholderInputChip({
  'aria-label': ariaLabel,
  className,
  enterKeyHint = 'done',
  inputRef,
  onChange,
  onSubmit,
  placeholder,
  value,
}: PlaceholderInputChipProps) {
  const [isFocused, setIsFocused] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const [chipHeight, setChipHeight] = useState<number | null>(null);
  const shouldShowHint = !value && !isFocused;
  const measuredText = value || (shouldShowHint ? placeholder : '');

  const setInputRefs = (element: HTMLInputElement | null) => {
    internalInputRef.current = element;

    if (inputRef) {
      inputRef.current = element;
    }
  };

  useLayoutEffect(() => {
    const measureElement = measureRef.current;

    if (!measureElement) {
      return;
    }

    setInputWidth(Math.ceil(measureElement.getBoundingClientRect().width));
  }, [measuredText]);

  useLayoutEffect(() => {
    const formElement = formRef.current;

    if (!formElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateChipHeight = () => {
      setChipHeight(Math.ceil(formElement.getBoundingClientRect().height));
    };
    const resizeObserver = new ResizeObserver(updateChipHeight);

    updateChipHeight();
    resizeObserver.observe(formElement);

    return () => resizeObserver.disconnect();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      ref={formRef}
      className={cn(
        'relative inline-flex h-8 max-w-full shrink-0 items-center gap-2 rounded-full bg-[var(--tb-user-accent-tint-surface)] px-[14px] py-0',
        className,
      )}
      style={{
        minWidth: chipHeight ? `${chipHeight}px` : undefined,
      }}
      onSubmit={handleSubmit}
    >
      <span
        ref={measureRef}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-0 whitespace-pre text-[13px] font-semibold opacity-0',
          shouldShowHint ? 'inline-flex items-center gap-2' : '',
        )}
      >
        {shouldShowHint ? (
          <>
            <Plus
              aria-hidden="true"
              className="shrink-0"
              size={ICON_TOKENS.size.sm}
              strokeWidth={1.9}
            />
            <span>{placeholder}</span>
          </>
        ) : (
          measuredText
        )}
      </span>
      {shouldShowHint ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[14px] top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 whitespace-pre text-[13px] font-semibold text-[var(--tb-user-accent-main)]"
        >
          <Plus
            aria-hidden="true"
            className="shrink-0"
            size={ICON_TOKENS.size.sm}
            strokeWidth={1.9}
          />
          <span>{placeholder}</span>
        </span>
      ) : null}
      <input
        ref={setInputRefs}
        aria-label={ariaLabel}
        className={cn(
          'h-full min-w-0 bg-transparent p-0 text-[13px] font-semibold caret-[var(--tb-user-accent-main)] outline-none placeholder:text-transparent',
          value ? 'text-[var(--tb-user-accent-main)]' : 'text-transparent',
        )}
        enterKeyHint={enterKeyHint}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder=""
        size={1}
        style={{
          width: inputWidth !== null ? `${Math.max(inputWidth, 2)}px` : undefined,
          maxWidth: 'calc(100vw - 96px)',
        }}
        value={value}
      />
    </form>
  );
}
