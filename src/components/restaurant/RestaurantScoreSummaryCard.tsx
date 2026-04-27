import SectionCard from '../SectionCard';
import Chip from '../system/Chip';
import TasteChip from '../system/TasteChip';

export interface RestaurantScoreTag {
  id: string;
  label: string;
  tasteAxis?: 'sweet' | 'salty' | 'sour' | 'bitter' | 'umami' | 'fat';
  tone?: 'neutral' | 'taste';
}

export interface RestaurantScoreSummaryViewModel {
  scores: {
    overallScore: number;
    palateFriendsAverageScore: number;
    personalMatchRate: number;
  };
  tags: RestaurantScoreTag[];
}

const TASTE_AXIS_LABEL = {
  bitter: '쓴맛',
  fat: '지방맛',
  salty: '짠맛',
  sour: '신맛',
  sweet: '단맛',
  umami: '감칠맛',
} as const;

interface RestaurantScoreSummaryCardProps {
  summary: RestaurantScoreSummaryViewModel;
}

export default function RestaurantScoreSummaryCard({
  summary,
}: RestaurantScoreSummaryCardProps) {
  const scoreItems = [
    {
      label: '나와의 매칭률',
      value: `${summary.scores.personalMatchRate}%`,
    },
    {
      label: '미각 친구 평균',
      value: `${summary.scores.palateFriendsAverageScore}점`,
    },
    {
      label: '전체 점수',
      value: `${summary.scores.overallScore.toFixed(1)} / 5`,
    },
  ];

  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {scoreItems.map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-[12px] bg-[var(--tb-color-surface-muted)] px-2 py-3 text-center"
            >
              <p className="text-[18px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
                {item.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-snug text-[var(--tb-color-text-muted)]">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">
          숫자는 선택의 시작점이고, 아래 감각 태그가 이곳이 어떤 경험으로 남을 가능성이 높은지 더 잘 보여줘요.
        </p>

        <div className="flex flex-wrap gap-2">
          {summary.tags.map((tag) =>
            tag.tone === 'taste' && tag.tasteAxis ? (
              <TasteChip
                key={tag.id}
                taste={TASTE_AXIS_LABEL[tag.tasteAxis]}
                value={tag.label}
              />
            ) : (
              <Chip key={tag.id} size="xs" tone="neutral" variant="soft">
                {tag.label}
              </Chip>
            ),
          )}
        </div>
      </div>
    </SectionCard>
  );
}
