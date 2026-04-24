import {
  Check as CheckIcon
} from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';

const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...props }: any) => (
  <Icon
    {...props}
    className={className}
    style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }}
  />
);

const Check = wrapIcon(CheckIcon);

const CHECKLIST_ITEMS = [
  '입 안을 깨끗이 헹궈주세요',
  '30분 이내 음식 섭취 여부 확인',
  '조용하고 집중 가능한 상태인지 확인',
] as const;

export default function TasteMeasurementChecklistPanel() {
  return (
    <>
      <div className="mb-12 mt-8 text-center">
        <h1 className="mb-3 text-[18px] font-bold leading-tight tracking-tight">
          체크리스트
        </h1>
        <p className="text-[14px] text-[var(--tb-color-text-body)]">
          정확한 미각 측정을 위해, 아래 단계를 먼저 준비해주세요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {CHECKLIST_ITEMS.map((text) => (
          <div
            key={text}
            className="flex w-full items-center gap-3 rounded-[20px] bg-[var(--tb-color-surface-muted)] p-3"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-black">
              <Check size={ICON_TOKENS.size.md} color="white" strokeWidth={3} />
            </div>
            <span className="text-[15px] font-bold text-black">{text}</span>
          </div>
        ))}
      </div>
    </>
  );
}
