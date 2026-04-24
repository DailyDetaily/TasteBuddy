import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

import { cn } from '../ui/utils';

export type TokenBoxSize = 'sm' | 'md' | 'lg';

type TokenBoxBackgroundToken =
  | 'surface-base'
  | 'surface-card'
  | 'surface-muted'
  | 'surface-elevated'
  | 'surface-disabled'
  | 'taste-sweet-bg'
  | 'taste-salty-bg'
  | 'taste-umami-bg'
  | 'taste-sour-bg'
  | 'taste-bitter-bg';

type TokenBoxTextToken =
  | 'text-primary'
  | 'text-secondary'
  | 'text-muted'
  | 'text-subtle'
  | 'icon-primary'
  | 'icon-muted'
  | 'taste-sweet-main'
  | 'taste-salty-main'
  | 'taste-umami-main'
  | 'taste-sour-main'
  | 'taste-bitter-main';

const SIZE_CLASS: Record<TokenBoxSize, string> = {
  sm: 'size-[var(--tb-box-size-sm)]',
  md: 'size-[var(--tb-box-size-md)]',
  lg: 'size-[var(--tb-box-size-lg)]',
};

const BACKGROUND_TOKEN: Record<TokenBoxBackgroundToken, string> = {
  'surface-base': 'var(--tb-color-surface-base)',
  'surface-card': 'var(--tb-color-surface-card)',
  'surface-muted': 'var(--tb-color-surface-muted)',
  'surface-elevated': 'var(--tb-color-surface-elevated)',
  'surface-disabled': 'var(--tb-color-surface-disabled)',
  'taste-sweet-bg': 'var(--tb-taste-sweet-bg)',
  'taste-salty-bg': 'var(--tb-taste-salty-bg)',
  'taste-umami-bg': 'var(--tb-taste-umami-bg)',
  'taste-sour-bg': 'var(--tb-taste-sour-bg)',
  'taste-bitter-bg': 'var(--tb-taste-bitter-bg)',
};

const TEXT_TOKEN: Record<TokenBoxTextToken, string> = {
  'text-primary': 'var(--tb-color-text-primary)',
  'text-secondary': 'var(--tb-color-text-secondary)',
  'text-muted': 'var(--tb-color-text-muted)',
  'text-subtle': 'var(--tb-color-text-subtle)',
  'icon-primary': 'var(--tb-color-icon-primary)',
  'icon-muted': 'var(--tb-color-icon-muted)',
  'taste-sweet-main': 'var(--tb-taste-sweet-main)',
  'taste-salty-main': 'var(--tb-taste-salty-main)',
  'taste-umami-main': 'var(--tb-taste-umami-main)',
  'taste-sour-main': 'var(--tb-taste-sour-main)',
  'taste-bitter-main': 'var(--tb-taste-bitter-main)',
};

interface TokenBoxProps extends HTMLAttributes<HTMLDivElement> {
  backgroundToken?: TokenBoxBackgroundToken;
  children: ReactNode;
  className?: string;
  size?: TokenBoxSize | null;
  style?: CSSProperties;
  textToken?: TokenBoxTextToken;
}

export default function TokenBox({
  backgroundToken = 'surface-muted',
  children,
  className,
  size = 'sm',
  style,
  textToken = 'text-primary',
  ...props
}: TokenBoxProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[var(--tb-radius-8)]',
        size ? SIZE_CLASS[size] : null,
        className,
      )}
      style={{
        backgroundColor: BACKGROUND_TOKEN[backgroundToken],
        color: TEXT_TOKEN[textToken],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
