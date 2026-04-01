import React from 'react';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export default function SectionCard({ children, className = '', onClick, hoverEffect = !!onClick }: SectionCardProps) {
  return (
    <div
      className={`tb-section-card ${
        hoverEffect ? 'tb-section-card--interactive' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="tb-section-card__body">
          {children}
        </div>
      </div>
    </div>
  );
}
