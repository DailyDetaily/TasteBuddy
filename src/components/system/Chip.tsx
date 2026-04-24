import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { Slot } from '@radix-ui/react-slot';

import { COMPONENT_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

export type ChipSize = keyof typeof COMPONENT_TOKENS.chip.size;
export type ChipTone = keyof typeof COMPONENT_TOKENS.chip.tone;
export type ChipVariant = keyof (typeof COMPONENT_TOKENS.chip.tone)['neutral'];

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
  backgroundColorToken?: CSSProperties['backgroundColor'];
  leadingIcon?: ReactNode;
  size?: ChipSize;
  tone?: ChipTone;
  trailingIcon?: ReactNode;
  variant?: ChipVariant;
}

export default function Chip({
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
}: ChipProps) {
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
