import {
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
} from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

interface CardDetailLabelProps {
  className?: string;
  direction?: 'down' | 'right' | 'up';
  label?: string;
}

export default function CardDetailLabel({
  className,
  direction = 'right',
  label = '자세히보기',
}: CardDetailLabelProps) {
  const Icon = direction === 'down'
    ? ChevronDownIcon
    : direction === 'up'
      ? ChevronUpIcon
      : ChevronRightIcon;

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-[var(--tb-color-icon-muted)]',
        className,
      )}
    >
      <span>{label}</span>
      <Icon
        aria-hidden="true"
        size={ICON_TOKENS.size.md}
        className="shrink-0"
      />
    </div>
  );
}
