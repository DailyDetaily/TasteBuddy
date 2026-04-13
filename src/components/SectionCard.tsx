import React, { type HTMLAttributes } from 'react';

interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
  hoverEffect?: boolean;
}

export default function SectionCard({
  children,
  className = '',
  onClick,
  hoverEffect = !!onClick,
  ...props
}: SectionCardProps) {
  return (
    <div
      className={`tb-section-card ${
        hoverEffect ? 'tb-section-card--interactive' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
