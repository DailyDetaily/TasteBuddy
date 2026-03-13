import React from 'react';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export default function SectionCard({ children, className = '', onClick, hoverEffect = true }: SectionCardProps) {
  return (
    <div
      className={`bg-[#f3f3f3] rounded-[20px] w-full transition-all duration-300 ${
        hoverEffect ? 'hover:bg-[#ececec] hover:shadow-sm' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border flex flex-col gap-[12px] items-start p-[12px] w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
