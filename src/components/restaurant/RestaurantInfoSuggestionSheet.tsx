import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, Pencil } from 'lucide-react';

import BottomSheetShell from '../system/BottomSheetShell';
import PrimaryButton from '../system/PrimaryButton';
import SectionTitle from '../system/SectionTitle';
import { Textarea } from '../ui/textarea';
import { ICON_TOKENS } from '../../constants/designTokens';
import RestaurantInfoCard, {
  buildRestaurantInfoRows,
  type RestaurantInfoRowId,
  type RestaurantInfoRowViewModel,
  type RestaurantInfoViewModel,
} from './RestaurantInfoCard';

interface RestaurantInfoSuggestionSheetProps {
  info: RestaurantInfoViewModel;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  restaurantName: string;
}

type SuggestionStep = 'select' | 'edit' | 'done';

function getSuggestionTabLabel(row: RestaurantInfoRowViewModel) {
  if (row.id === 'address') {
    return '위치';
  }

  if (row.id === 'phone') {
    return '전화';
  }

  return row.label;
}

export default function RestaurantInfoSuggestionSheet({
  info,
  onOpenChange,
  open,
  restaurantName,
}: RestaurantInfoSuggestionSheetProps) {
  const rows = useMemo(() => buildRestaurantInfoRows(info), [info]);
  const [step, setStep] = useState<SuggestionStep>('select');
  const [selectedRow, setSelectedRow] = useState<RestaurantInfoRowViewModel | null>(null);
  const [activeRowIds, setActiveRowIds] = useState<RestaurantInfoRowId[]>([]);
  const [suggestedValues, setSuggestedValues] = useState<
    Partial<Record<RestaurantInfoRowId, string>>
  >({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setStep('select');
    setSelectedRow(null);
    setActiveRowIds([]);
    setSuggestedValues({});
  }, [open]);

  const handleSelectRow = (row: RestaurantInfoRowViewModel) => {
    setSelectedRow(row);
    setActiveRowIds([row.id]);
    setSuggestedValues({ [row.id]: row.value });
    setStep('edit');
  };

  const handleToggleEditTab = (row: RestaurantInfoRowViewModel) => {
    setSelectedRow(row);
    setActiveRowIds((current) => {
      if (current.includes(row.id)) {
        return current.length > 1 ? current.filter((rowId) => rowId !== row.id) : current;
      }

      return [...current, row.id];
    });
    setSuggestedValues((current) => ({
      ...current,
      [row.id]: current[row.id] ?? row.value,
    }));
  };

  const handleSuggestionValueChange = (rowId: RestaurantInfoRowId, value: string) => {
    setSuggestedValues((current) => ({
      ...current,
      [rowId]: value,
    }));
  };

  const activeRows = rows.filter((row) => activeRowIds.includes(row.id));
  const canSubmitSuggestion = activeRows.some((row) => {
    const suggestedValue = suggestedValues[row.id]?.trim() ?? '';

    return suggestedValue.length > 0 && suggestedValue !== row.value.trim();
  });
  const isEditPage = step === 'edit' && Boolean(selectedRow);

  const footer =
    step === 'done' ? (
      <PrimaryButton onClick={() => onOpenChange(false)}>완료</PrimaryButton>
    ) : (
      <button
        className="min-h-[48px] w-full rounded-[14px] bg-[var(--tb-color-surface-muted)] px-4 text-[14px] font-semibold text-[var(--tb-color-text-secondary)] transition-colors hover:bg-[var(--tb-color-surface-subtle)] hover:text-[var(--tb-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]"
        onClick={() => onOpenChange(false)}
        type="button"
      >
        취소
      </button>
    );

  return (
    <>
      {isEditPage ? (
        <div className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col bg-[var(--tb-color-bg-focus)]">
          <header className="relative flex min-h-[64px] shrink-0 items-center justify-center border-b border-[var(--tb-color-border-subtle)] px-14 pt-[env(safe-area-inset-top)]">
            <button
              aria-label="수정할 정보 선택으로 돌아가기"
              className="absolute left-3 top-[calc(env(safe-area-inset-top)+12px)] flex size-10 items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]"
              onClick={() => setStep('select')}
              type="button"
            >
              <ArrowLeft size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
            </button>
            <h2 className="truncate text-center text-[16px] font-semibold text-[var(--tb-color-text-primary)]">
              정보 수정
            </h2>
          </header>

          <main className="flex-1 overflow-y-auto px-5 py-5">
            <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
              <div className="flex items-start gap-3">
                <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-secondary)]">
                  <Pencil size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <SectionTitle as="h3" size="lg">
                    수정할 정보를 선택해주세요
                  </SectionTitle>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">
                    여러 항목을 함께 선택하면 한 번에 수정 제안을 남길 수 있어요.
                  </p>
                </div>
              </div>

              <div
                aria-label="수정할 정보 선택"
                className="flex flex-wrap gap-2"
                role="tablist"
              >
                {rows.map((row) => {
                  const isSelected = activeRowIds.includes(row.id);

                  return (
                    <button
                      aria-selected={isSelected}
                      className={`min-h-[34px] rounded-full border px-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)] ${
                        isSelected
                          ? 'border-[var(--tb-color-border-strong)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-surface-base)]'
                          : 'border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-muted)] hover:border-[var(--tb-color-border-default)] hover:text-[var(--tb-color-text-primary)]'
                      }`}
                      key={row.id}
                      onClick={() => handleToggleEditTab(row)}
                      role="tab"
                      type="button"
                    >
                      {getSuggestionTabLabel(row)}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-4">
                {activeRows.map((row) => (
                  <label className="flex flex-col gap-2" key={row.id}>
                    <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                      {getSuggestionTabLabel(row)}
                    </span>
                    <Textarea
                      className="min-h-[112px] rounded-[14px] border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-4 py-3 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)] placeholder:text-[var(--tb-color-text-hint)] focus-visible:ring-[var(--tb-color-border-default)]"
                      onChange={(event) => handleSuggestionValueChange(row.id, event.target.value)}
                      value={suggestedValues[row.id] ?? row.value}
                    />
                  </label>
                ))}
              </div>
            </div>
          </main>

          <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-3">
            <button
              className="min-h-[48px] rounded-[14px] bg-[var(--tb-color-surface-muted)] px-4 text-[14px] font-semibold text-[var(--tb-color-text-secondary)] transition-colors hover:bg-[var(--tb-color-surface-subtle)] hover:text-[var(--tb-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              취소
            </button>
            <PrimaryButton disabled={!canSubmitSuggestion} onClick={() => setStep('done')}>
              제출
            </PrimaryButton>
          </footer>
        </div>
      ) : null}

      {!isEditPage ? (
        <BottomSheetShell
          open={open}
          onOpenChange={onOpenChange}
          contentClassName="h-auto max-h-[88vh]"
          bodyClassName="overflow-y-auto no-scrollbar px-5 pb-2"
          footer={footer}
        >
          {step === 'done' ? (
            <div className="flex flex-col items-center gap-5 pt-4 text-center">
              <div className="flex size-[48px] items-center justify-center rounded-full bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-primary)]">
                <CheckCircle size={ICON_TOKENS.size.xl} strokeWidth={1.8} />
              </div>
              <div className="flex flex-col gap-2">
                <SectionTitle as="h2" size="lg">
                  수정 제안을 받았어요
                </SectionTitle>
                <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
                  제안된 정보는 확인 후 {restaurantName}의 장소 정보 판단에 반영할게요.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 pt-1">
              <div className="flex items-start gap-3">
                <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-secondary)]">
                  <Pencil size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <SectionTitle as="h2" size="lg">
                    어떤 정보를 고칠까요?
                  </SectionTitle>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">
                    위치 및 정보 카드에서 수정이 필요한 행을 선택해주세요.
                  </p>
                </div>
              </div>

              <RestaurantInfoCard
                info={info}
                rows={rows}
                onRowClick={handleSelectRow}
                showRowChevron
                variant="plain"
              />
            </div>
          )}
        </BottomSheetShell>
      ) : null}
    </>
  );
}
