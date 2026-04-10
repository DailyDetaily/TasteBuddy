import type { ReactNode } from 'react';

import { cn } from '../ui/utils';

export type InspectableNavigateHandler = (
  sectionId: string,
  componentName: string,
) => void;

interface InspectableComponentProps {
  children: ReactNode;
  className?: string;
  componentName: string;
  onNavigate?: InspectableNavigateHandler;
  sectionId: string;
}

export default function InspectableComponent({
  children,
  className,
  componentName,
  onNavigate,
  sectionId,
}: InspectableComponentProps) {
  if (!onNavigate) {
    return <>{children}</>;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      title={`${componentName} 컴포넌트 위치로 이동하려면 더블 클릭`}
      onDoubleClick={() => onNavigate(sectionId, componentName)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onNavigate(sectionId, componentName);
        }
      }}
      className={cn(
        'inline-flex cursor-pointer rounded-[10px] outline-none transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
