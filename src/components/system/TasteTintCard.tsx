import type { CSSProperties, ReactNode } from 'react';

import { TASTE_TOKENS, type TasteId } from '../../constants/designTokens';
import { getTasteTint } from '../../constants/tasteColors';
import { cn } from '../ui/utils';
import TokenBox from './TokenBox';

export interface TasteTintCardProps {
  className?: string;
  detail?: ReactNode;
  detailClassName?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  leading?: ReactNode;
  leadingClassName?: string;
  leadingStyle?: CSSProperties;
  onClick?: () => void;
  style?: CSSProperties;
  tasteId: TasteId;
  title: ReactNode;
  titleClassName?: string;
}

export default function TasteTintCard({
  className,
  description,
  descriptionClassName,
  detail,
  detailClassName,
  leading,
  leadingClassName,
  leadingStyle,
  onClick,
  style,
  tasteId,
  title,
  titleClassName,
}: TasteTintCardProps) {
  const taste = TASTE_TOKENS[tasteId];
  const rootClassName = cn(
    'box-border relative flex h-[132px] w-[132px] shrink-0 flex-col items-start gap-[12px] overflow-clip rounded-[20px] p-[12px] text-left',
    onClick &&
      'cursor-pointer appearance-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--tb-shadow-strong)] active:scale-[0.98]',
    className,
  );
  const rootStyle = {
    backgroundColor: taste.palette.tintSurface,
    border: `1px solid ${getTasteTint(taste.label, 0.18)}`,
    ...style,
  } satisfies CSSProperties;

  const content = (
    <div className="flex h-full w-full flex-col items-start gap-[12px]">
      {leading ? (
        <TokenBox
          className={cn(
            'relative overflow-hidden',
            leadingClassName,
          )}
          backgroundToken="surface-base"
          size="lg"
          style={leadingStyle}
        >
          {leading}
        </TokenBox>
      ) : null}

      <div className="relative flex w-full grow flex-col items-start justify-between leading-[normal]">
        <div className="relative flex w-full shrink-0 flex-col items-start gap-[2px]">
          <p
            className={cn(
              "w-full truncate font-['Pretendard_Variable:Bold',sans-serif] text-[14px] font-bold",
              titleClassName,
            )}
            style={{ color: taste.palette.tintSurfaceText }}
          >
            {title}
          </p>
          {description ? (
            <p
              className={cn(
                "w-full truncate font-['Pretendard_Variable:Regular',sans-serif] text-[10px] font-normal",
                descriptionClassName,
              )}
              style={{ color: taste.palette.tintSurfaceSubText }}
            >
              {description}
            </p>
          ) : null}
        </div>

        {detail ? (
          <p
            className={cn(
              "w-full truncate font-['Pretendard_Variable:SemiBold',sans-serif] text-[10px] font-semibold",
              detailClassName,
            )}
            style={{ color: taste.palette.tintSurfaceText }}
          >
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" className={rootClassName} onClick={onClick} style={rootStyle}>
        {content}
      </button>
    );
  }

  return (
    <div className={rootClassName} style={rootStyle}>
      {content}
    </div>
  );
}
