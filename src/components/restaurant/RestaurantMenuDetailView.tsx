import TopAppBar from '../TopAppBar';
import SectionCard from '../SectionCard';
import Chip from '../system/Chip';
import ImageBox from '../system/ImageBox';
import PageSection from '../system/PageSection';
import PrimaryButton from '../system/PrimaryButton';
import StatusChip from '../system/StatusChip';
import TasteChip from '../system/TasteChip';
import { TASTE_TOKENS, type TasteId } from '../../constants/designTokens';

export interface RestaurantMenuDetailViewModel {
  id: string;
  title: string;
  restaurantName: string;
  chefName: string;
  courseLabel: string;
  imageUrl?: string | null;
  summaryLine: string;
  fitBand: string;
  confidenceLabel: string;
  expectedTasteFlow: string;
  mainRisk: string;
  chefIntent: string;
  similarPalateSignal: string;
  pastExperienceComparison?: string;
  lowConfidenceHint?: string;
  tasteTags: {
    id: string;
    label: string;
    tasteAxis?: TasteId;
    tone: 'taste' | 'neutral';
  }[];
}

interface RestaurantMenuDetailViewProps {
  menu: RestaurantMenuDetailViewModel;
  onBack: () => void;
  onRecordDishMemory: () => void;
}

export default function RestaurantMenuDetailView({
  menu,
  onBack,
  onRecordDishMemory,
}: RestaurantMenuDetailViewProps) {
  const highlightedTasteTags = menu.tasteTags.filter((tag) => tag.tasteAxis).slice(0, 4);
  const neutralTags = menu.tasteTags.filter((tag) => !tag.tasteAxis).slice(0, 4);
  const summaryItems = [
    ['내 기준 Fit', menu.fitBand],
    ['근거 신뢰도', menu.confidenceLabel],
    ['예상되는 감각 흐름', menu.expectedTasteFlow],
    ['주의해서 볼 지점', menu.mainRisk],
  ] as const;

  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)] animate-slideIn">
      <TopAppBar title={menu.title} showBack onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pb-10 pt-5">
          <SectionCard hoverEffect={false}>
            <div className="flex items-start gap-4">
              <ImageBox
                alt={`${menu.title} 이미지`}
                className="size-[72px] rounded-[14px]"
                imageSrc={menu.imageUrl}
                kind="menu"
                variant="neutral"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  <Chip size="xs" tone="neutral" variant="soft">
                    {menu.courseLabel}
                  </Chip>
                  <StatusChip>{menu.confidenceLabel}</StatusChip>
                </div>
                <h1 className="mt-3 text-[18px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                  {menu.title}
                </h1>
                <p className="mt-1 text-[12px] text-[var(--tb-color-text-tertiary)]">
                  {menu.restaurantName} · {menu.chefName} 셰프
                </p>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
              {menu.summaryLine}
            </p>
          </SectionCard>

          <PageSection title="메뉴 Fit 요약" titleAs="h2" titleSize="md">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {summaryItems.map(([label, body]) => (
                <SectionCard key={label} className="rounded-[16px] p-0" hoverEffect={false}>
                  <div className="rounded-[16px] bg-[var(--tb-color-surface-card)] p-4">
                    <p className="text-[11px] font-semibold text-[var(--tb-color-text-tertiary)]">
                      {label}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                      {body}
                    </p>
                  </div>
                </SectionCard>
              ))}
            </div>
          </PageSection>

          <PageSection title="관련 미각 축" titleAs="h2" titleSize="md">
            <SectionCard hoverEffect={false}>
              <div className="flex flex-wrap gap-2">
                {highlightedTasteTags.map((tag) => (
                  <TasteChip
                    key={tag.id}
                    taste={tag.tasteAxis ? TASTE_TOKENS[tag.tasteAxis].label : tag.label}
                    value={tag.label}
                  />
                ))}
                {neutralTags.map((tag) => (
                  <Chip key={tag.id} size="sm" tone="neutral" variant="soft">
                    {tag.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">
                이 축들은 점수표가 아니라, 메뉴가 내 기준에서 어떤 방식으로 기억될지 읽기 위한 단서예요.
              </p>
            </SectionCard>
          </PageSection>

          <PageSection title="비슷한 미각 신호" titleAs="h2" titleSize="md">
            <SectionCard hoverEffect={false}>
              <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                {menu.similarPalateSignal}
              </p>
            </SectionCard>
          </PageSection>

          <PageSection title="과거 경험과 비교" titleAs="h2" titleSize="md">
            <SectionCard hoverEffect={false}>
              <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                {menu.lowConfidenceHint ??
                  menu.pastExperienceComparison ??
                  '아직 비교 기준이 충분하지 않아요. 먹어본 메뉴로 기록하면 다음 판단이 더 선명해집니다.'}
              </p>
            </SectionCard>
          </PageSection>

          <PageSection title="셰프 의도" titleAs="h2" titleSize="md">
            <SectionCard hoverEffect={false}>
              <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                {menu.chefIntent}
              </p>
            </SectionCard>
          </PageSection>

          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-3">
              <PrimaryButton onClick={onRecordDishMemory}>먹어본 메뉴로 기록하기</PrimaryButton>
              <button
                type="button"
                className="min-h-[44px] rounded-[10px] border border-[var(--tb-color-border-default)] px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
                onClick={onBack}
              >
                나중에 비교하기
              </button>
            </div>
          </SectionCard>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
