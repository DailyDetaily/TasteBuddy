import { useMemo } from 'react';

import {
  getLegacyHomeCardArchiveData,
  LegacyHomeAdjustmentHistorySection,
  LegacyHomeChefCard,
  LegacyHomeEmptyChefCard,
  LegacyHomeHistoryCard,
  LegacyHomeSpecialNoteCard,
  LegacyHomeTasteProfileCard,
  LegacyHomeTasteSummarySection,
} from '../../imports/Home';

function ArchiveEyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
      {children}
    </span>
  );
}

function ArchivePanel({
  children,
  componentNames,
  description,
  title,
}: {
  children: React.ReactNode;
  componentNames?: string[];
  description: string;
  title: string;
}) {
  return (
    <div
      className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-4 shadow-[var(--tb-shadow-soft)]"
      data-component-preview={componentNames?.length === 1 ? componentNames[0] : undefined}
      data-component-preview-list={componentNames?.length ? JSON.stringify(componentNames) : undefined}
    >
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{title}</p>
        <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">{description}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ArchivePhoneFrame({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          {description}
        </p>
      </div>
      <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[32px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] shadow-[0_24px_60px_rgba(15,15,15,0.12)]">
        <div className="pointer-events-none flex justify-center pt-3">
          <div className="h-1.5 w-24 rounded-full bg-[var(--tb-color-border-strong)]" />
        </div>
        <div className="h-[844px] overflow-y-auto overflow-x-hidden bg-[var(--tb-color-bg-page)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LegacyHomeCardArchive() {
  const archiveData = useMemo(() => getLegacyHomeCardArchiveData(), []);
  const featuredChefs = archiveData.featuredChefs.slice(0, 3);
  const historyCards = archiveData.adjustmentHistoryData.slice(0, 2);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
      <div className="grid gap-4">
        <ArchivePanel
          componentNames={['LegacyHomeChefCard', 'LegacyHomeEmptyChefCard']}
          title="셰프 카드 아카이브"
          description="이전에 홈 상단에서 쓰던 셰프 매칭 카드와 empty 상태를 그대로 보관합니다."
        >
          <div className="flex flex-wrap gap-2">
            <ArchiveEyebrow>LegacyHomeChefCard</ArchiveEyebrow>
            <ArchiveEyebrow>LegacyHomeEmptyChefCard</ArchiveEyebrow>
            <ArchiveEyebrow>홈 상단 카드</ArchiveEyebrow>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {featuredChefs.map((chef) => (
              <div key={`${chef.name}-${chef.restaurant}`} className="shrink-0">
                <LegacyHomeChefCard chef={chef} />
              </div>
            ))}
            <div className="shrink-0">
              <LegacyHomeEmptyChefCard index={0} />
            </div>
          </div>
        </ArchivePanel>

        <div className="grid gap-4 lg:grid-cols-2">
          <ArchivePanel
            componentNames={['LegacyHomeTasteProfileCard']}
            title="미각변화 카드"
            description="홈에서 사용하던 요약 카드 본체입니다. 필요하면 detail 액션만 다시 연결하면 됩니다."
          >
            <div className="flex flex-wrap gap-2">
              <ArchiveEyebrow>LegacyHomeTasteProfileCard</ArchiveEyebrow>
              <ArchiveEyebrow>요약 카드</ArchiveEyebrow>
            </div>
            <div className="mt-4">
              <LegacyHomeTasteProfileCard
                cardData={archiveData.tasteProfileCard}
                onOpenDetail={() => undefined}
              />
            </div>
          </ArchivePanel>

          <ArchivePanel
            componentNames={['LegacyHomeSpecialNoteCard']}
            title="특이사항 카드"
            description="셰프 전달 포인트와 미니 그래프를 담던 카드 구현입니다."
          >
            <div className="flex flex-wrap gap-2">
              <ArchiveEyebrow>LegacyHomeSpecialNoteCard</ArchiveEyebrow>
              <ArchiveEyebrow>셰프 메모 카드</ArchiveEyebrow>
            </div>
            <div className="mt-4">
              <LegacyHomeSpecialNoteCard
                cardData={archiveData.specialNoteCard}
                onOpenDetail={() => undefined}
              />
            </div>
          </ArchivePanel>
        </div>

        <ArchivePanel
          componentNames={['LegacyHomeHistoryCard']}
          title="조정 히스토리 카드"
          description="개별 히스토리 카드도 따로 남겨 두었습니다. 비교 모드나 상세 이동은 나중에 다시 연결할 수 있습니다."
        >
          <div className="flex flex-wrap gap-2">
            <ArchiveEyebrow>LegacyHomeHistoryCard</ArchiveEyebrow>
            <ArchiveEyebrow>조정 기록 카드</ArchiveEyebrow>
          </div>
          <div className="mt-4 grid gap-3">
            {historyCards.map((history) => (
              <LegacyHomeHistoryCard
                key={history.id}
                history={history}
                onRate={(_id, _rating) => undefined}
                onClick={() => undefined}
              />
            ))}
          </div>
        </ArchivePanel>
      </div>

      <div className="grid gap-6">
        <ArchivePhoneFrame
          title="레거시 미각 요약 섹션"
          description="카드를 눌러 detail overlay까지 확인할 수 있는 예전 홈 섹션 전체를 보관합니다."
        >
          <LegacyHomeTasteSummarySection
            reservationHint={archiveData.reservationHint}
            specialNoteCard={archiveData.specialNoteCard}
            tasteProfileCard={archiveData.tasteProfileCard}
            tasteProfileOverviewValues={archiveData.tasteProfileOverviewValues}
            tasteProfileSeries={archiveData.tasteProfileSeries}
          />
        </ArchivePhoneFrame>

        <ArchivePhoneFrame
          title="레거시 히스토리 섹션"
          description="전체 보기와 detail overlay까지 포함한 예전 조정 히스토리 흐름입니다."
        >
          <LegacyHomeAdjustmentHistorySection
            initialHistoryData={archiveData.adjustmentHistoryData}
          />
        </ArchivePhoneFrame>
      </div>
    </div>
  );
}
