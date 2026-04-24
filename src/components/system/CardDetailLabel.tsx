import {
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

interface CardDetailLabelProps {
  className?: string;
  label?: string;
}

export default function CardDetailLabel({
  className,
  label = '자세히보기',
}: CardDetailLabelProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-[var(--tb-color-icon-muted)]',
        className,
      )}
    >
      <span>{label}</span>
      <ChevronRightIcon
        aria-hidden="true"
        size={ICON_TOKENS.size.md}
        className="shrink-0"
      />
    </div>
  );
}
