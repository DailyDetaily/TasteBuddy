import type { ReactNode } from 'react';

interface CardIconBoxProps {
  children: ReactNode;
  className?: string;
}

export default function CardIconBox({
  children,
  className = '',
}: CardIconBoxProps) {
  return (
    <div
      className={`flex size-[32px] shrink-0 items-center justify-center rounded-[8px] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
