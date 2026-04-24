import { useMemo, useState, type ReactNode } from 'react';

import {
  ChevronRight,
  Clock,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

import ReservationCard from '../reservation/ReservationCard';
import {
  DiningFeedbackScreen,
} from '../reservation/DiningFeedbackFlow';
import SectionCard from '../SectionCard';
import CalibrationQuestionHeader from '../measurement/CalibrationQuestionHeader';
import TasteAxisMeter from '../measurement/TasteAxisMeter';
import TasteMeasurementActivePanel from '../measurement/TasteMeasurementActivePanel';
import TasteMeasurementChecklistPanel from '../measurement/TasteMeasurementChecklistPanel';
import TasteMeasurementCompletedPanel from '../measurement/TasteMeasurementCompletedPanel';
import TasteMeasurementIntroPanel from '../measurement/TasteMeasurementIntroPanel';
import TasteMeasurementMiniCta from '../measurement/TasteMeasurementMiniCta';
import TasteMeasurementPreparationPanel from '../measurement/TasteMeasurementPreparationPanel';
import EmptyState from '../system/EmptyState';
import BottomSheetShell, {
  BottomSheetCloseButton,
  BottomSheetIconButton,
} from '../system/BottomSheetShell';
import CardDetailLabel from '../system/CardDetailLabel';
import CardScrollList from '../system/CardScrollList';
import Chip from '../system/Chip';
import FlowBottomCta from '../system/FlowBottomCta';
import FlowHeaderBlock from '../system/FlowHeaderBlock';
import FlowStepCta from '../system/FlowStepCta';
import HexRadarChart from '../system/HexRadarChart';
import TCSBadge from '../system/TCSBadge';
import HospitalityEmptyState from '../system/HospitalityEmptyState';
import InterpretationCard from '../system/InterpretationCard';
import InterpretationDetailDrawer, {
  type InterpretationDetailContent,
} from '../system/InterpretationDetailDrawer';
import OutlineBadge from '../system/OutlineBadge';
import PageSection from '../system/PageSection';
import PrimaryButton from '../system/PrimaryButton';
import ProfileConfidenceCard from '../system/ProfileConfidenceCard';
import SelectionCard from '../system/SelectionCard';
import TCSHintCard from '../system/TCSHintCard';
import SectionTitle from '../system/SectionTitle';
import StepBadge from '../system/StepBadge';
import StatusChip from '../system/StatusChip';
import StepIndicator from '../system/StepIndicator';
import TasteChip from '../system/TasteChip';
import TastePointArrowBox, {
  TASTE_POINT_ARROW_BOX_DIRECTION_TOKENS,
  TASTE_POINT_ARROW_BOX_SIZE_TOKENS,
} from '../system/TastePointArrowBox';
import TasteTintCardInteractivePreview from './TasteTintCardInteractivePreview';
import TasteTintCard from '../system/TasteTintCard';
import TasteTintCardList from '../system/TasteTintCardList';
import {
  Badge,
} from '../ui/badge';
import {
  Button,
} from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TASTE_IDS, TASTE_TOKENS } from '../../constants/designTokens';
import {
  createDiningFeedbackDraft,
  getDiningFeedbackScenario,
} from '../../constants/diningFeedbackData';
import { RESERVATION_CATALOG } from '../../constants/reservationCatalog';
import {
  createInitialTasteMeasurementSnapshot,
  getTasteMeasurementEntries,
} from '../../constants/tasteMeasurementData';
import ImproveAccuracyScreen from '../../pages/ImproveAccuracyScreen';
import OnboardingScreen from '../../pages/OnboardingScreen';
import ProfilePage from '../../pages/ProfilePage';
import QuickTasteCalibrationScreen from '../../pages/QuickTasteCalibrationScreen';
import ReservationConfirmationScreen from '../../pages/ReservationConfirmationScreen';
import ReservationPage from '../../pages/ReservationPage';
import TasteMeasurementScreen from '../../pages/TasteMeasurementScreen';
import { cn } from '../ui/utils';

export interface FilePreviewDefinition {
  description: string;
  frameClassName?: string;
  kind: 'component' | 'mobile-screen';
  title: string;
  render: () => ReactNode;
}

export interface FilePreviewEntry {
  definition: FilePreviewDefinition;
  file: string;
}

function FlowBottomCtaFilePreview() {
  return (
    <div className="relative min-h-[340px] bg-[var(--tb-color-surface-base)]">
      <div className="px-6 pt-6">
        <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
          FlowBottomCta shell
        </p>
        <p className="mt-2 max-w-[320px] text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          Safe-area spacing, bottom fade, helper copy, and secondary action alignment are handled here.
        </p>
      </div>
      <FlowBottomCta
        actionLabel="연결 없이 계속"
        helperText="하드웨어 없이도 다음 단계로 이어집니다."
        onAction={() => undefined}
      />
    </div>
  );
}

function FlowStepCtaFilePreview() {
  return (
    <div className="relative min-h-[340px] bg-[var(--tb-color-surface-base)]">
      <div className="px-6 pt-6">
        <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
          Shared onboarding / measurement footer
        </p>
        <p className="mt-2 max-w-[360px] text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          The step indicator and primary action stay centered while the active step can tint with the current taste palette.
        </p>
      </div>
      <FlowStepCta
        actionLabel="다음"
        currentIndex={1}
        indicatorActiveColor={TASTE_TOKENS.sour.palette.main}
        onAction={() => undefined}
        total={4}
      />
    </div>
  );
}

function FlowHeaderBlockFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
          <FlowHeaderBlock
            description="이 답변은 다음 예약과 셰프 준비 가이드를 더 정교하게 맞추는 데 쓰여요."
            title="식사 취향은 어떤 흐름에 가까운가요?"
            titleClassName="leading-tight"
            topLeft={<OutlineBadge>사전 조사</OutlineBadge>}
            topRight={<StepBadge currentIndex={0} total={7} />}
          />
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
          <FlowHeaderBlock
            descriptionClassName="whitespace-pre-line"
            description={
              <>
                숫자 대신 모두가 아는 기준 음식만 떠올리면 됩니다.{'\n'}
                첫 예약부터 바로 쓰는 스타터 프로필을 1분 안에 만들 수 있어요.
              </>
            }
            title={
              <>
                익숙한 음식 6개로{'\n'}내 미각의 영점을 먼저 맞춰요
              </>
            }
            titleClassName="whitespace-pre-line leading-tight"
            topLeft={<OutlineBadge>Digital Anchoring</OutlineBadge>}
            topRight={<OutlineBadge>보통 1분 이내</OutlineBadge>}
          />
        </div>
      </div>
    </div>
  );
}

function StepIndicatorFilePreview() {
  return (
    <div className="flex min-h-[220px] items-center justify-center bg-[var(--tb-color-surface-base)] p-8">
      <StepIndicator
        activeColor={TASTE_TOKENS.umami.palette.main}
        currentIndex={2}
        total={6}
      />
    </div>
  );
}

function StepBadgeFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto flex max-w-[720px] flex-wrap items-center gap-3 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <StepBadge currentIndex={0} total={7} />
        <StepBadge currentIndex={1} total={6} />
        <StepBadge currentStep={3} total={6} />
      </div>
    </div>
  );
}

function ReservationCardFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[390px]">
        <ReservationCard
          onSelect={() => undefined}
          reservation={RESERVATION_CATALOG[0]}
        />
      </div>
    </div>
  );
}

function TasteMeasurementMiniCtaFilePreview() {
  const measurementSnapshot = createInitialTasteMeasurementSnapshot();

  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[520px]">
        <TasteMeasurementMiniCta
          actionLabel="현재 컨디션 반영"
          description="다가오는 식사 전에 한 번 더 측정하면 현재 컨디션까지 반영된 개인화 가이드를 준비할 수 있어요."
          meta={`마지막 측정 ${measurementSnapshot.measuredAt.slice(0, 10)}`}
          onAction={() => undefined}
          title="예약 개인화 정확도 업데이트 추천"
          tone="alert"
        />
      </div>
    </div>
  );
}

function TasteTintCardFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[520px]">
        <TasteTintCardInteractivePreview />
      </div>
    </div>
  );
}

function TasteTintCardListFilePreview() {
  const entries = TASTE_IDS.map((tasteId, index) => ({
    detail: '보조 텍스트',
    description: '설명 텍스트',
    order: index + 1,
    tasteId,
    title: '타이틀',
  }));

  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[720px]">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
          <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">Grid wrapper preview</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            같은 정사각형 카드를 화면 폭에 맞춰 그리드로 배치할 수 있습니다.
          </p>
          <div className="mt-4 grid gap-4">
            <TasteTintCardList className="lg:grid-cols-3">
              {entries.map((entry) => (
                <TasteTintCard
                  key={entry.tasteId}
                  description={entry.description}
                  detail={entry.detail}
                  leading={
                    <span
                      className="text-[16px] font-bold"
                      style={{ color: TASTE_TOKENS[entry.tasteId].palette.dark }}
                    >
                      {String(entry.order).padStart(2, '0')}
                    </span>
                  }
                  leadingClassName="bg-white/80"
                  tasteId={entry.tasteId}
                  title={entry.title}
                />
              ))}
            </TasteTintCardList>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardScrollListFilePreview() {
  const entries = TASTE_IDS.map((tasteId, index) => ({
    detail: '보조 텍스트',
    description: '설명 텍스트',
    order: index + 1,
    tasteId,
    title: '타이틀',
  }));

  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[720px]">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
          <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
            Horizontal scroll wrapper preview
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            셰프 매칭과 세부 분석처럼 가로로 넘기는 카드 스트립을 위해 쓰는 공용 래퍼입니다.
          </p>
          <div className="mt-4">
            <CardScrollList fullBleed={false}>
              {entries.map((entry) => (
                <TasteTintCard
                  key={entry.tasteId}
                  className="shrink-0"
                  description={entry.description}
                  detail={entry.detail}
                  leading={
                    <span className="text-[16px] font-bold" style={{ color: TASTE_TOKENS[entry.tasteId].palette.dark }}>
                      {String(entry.order).padStart(2, '0')}
                    </span>
                  }
                  leadingClassName="bg-white/80"
                  tasteId={entry.tasteId}
                  title={entry.title}
                />
              ))}
            </CardScrollList>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasteAxisMeterFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[420px]">
        <TasteAxisMeter absoluteScore={74} tasteId="sour" />
      </div>
    </div>
  );
}

function HexRadarChartFilePreview() {
  const measurementSnapshot = createInitialTasteMeasurementSnapshot();

  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[420px] rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <HexRadarChart
          myTasteData={getTasteMeasurementEntries(measurementSnapshot)}
          shouldAnimate={false}
        />
      </div>
    </div>
  );
}

function SelectionCardFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto grid max-w-[720px] gap-3 md:grid-cols-2">
        <SelectionCard
          description="쉐프의 의도는 살리되 산뜻한 전개를 더 선호해요."
          title="가벼운 시작이 좋아요"
        />
        <SelectionCard
          description="메인으로 갈수록 밀도감이 자연스럽게 쌓이는 흐름이 편안해요."
          indicator="checkbox"
          selected
          title="후반 무게감은 천천히"
        />
      </div>
    </div>
  );
}

function TCSBadgeFilePreview() {
  const examples = [
    [{ taste: '단맛', change: '+12%' }],
    [
      { taste: '단맛', change: '+20%' },
      { taste: '감칠맛', change: '+5%' },
    ],
    [
      { taste: '신맛', change: '+10%' },
      { taste: '지방맛', change: '+6%' },
      { taste: '쓴맛', change: '+3%' },
    ],
  ];

  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto grid max-w-[520px] gap-4 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <div className="grid gap-2">
          <p className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
            활성 상태
          </p>
          <div className="flex flex-wrap gap-3">
            {examples.map((adjustments, index) => (
              <TCSBadge
                key={`tcs-badge-preview-${index}`}
                adjustments={adjustments}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
            비활성 상태
          </p>
          <div className="flex flex-wrap gap-3">
            <TCSBadge disabled />
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomSheetShellFilePreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-[560px] bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto flex max-w-[640px] flex-col gap-4">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
            Shared bottom sheet shell
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            Header slots, scrollable body, and a fixed footer CTA are handled inside one reusable product shell.
          </p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            Open bottom sheet
          </Button>
        </div>
      </div>

      <BottomSheetShell
        open={open}
        onOpenChange={setOpen}
        headerStart={<BottomSheetCloseButton />}
        headerEnd={
          <BottomSheetIconButton ariaLabel="더보기" icon={MoreHorizontal} />
        }
        footer={
          <PrimaryButton onClick={() => setOpen(false)}>
            확인했어요
          </PrimaryButton>
        }
      >
        <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col overflow-y-auto px-5 pb-8">
          <div className="rounded-[24px] bg-[var(--tb-color-surface-muted)] p-5">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              Shell headline
            </p>
            <h2 className="mt-2 text-[16px] font-semibold leading-[1.45] text-[var(--tb-color-text-primary)]">
              Product-shaped bottom sheet layout
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-secondary)]">
              Tastick connect and interpretation detail both plug their own content into the same shell.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            <SectionCard hoverEffect={false}>
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                Body content
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                The shell itself does not own product logic. It only provides the shared frame for header, body, and footer.
              </p>
            </SectionCard>
            <SectionCard hoverEffect={false}>
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                Reuse target
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                Good for explanation drawers, setup guides, and other lightweight action sheets that need a consistent Taste Buddy overlay shell.
              </p>
            </SectionCard>
          </div>
        </div>
      </BottomSheetShell>
    </div>
  );
}

function CalibrationQuestionHeaderFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[720px] rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <CalibrationQuestionHeader
          description="강한 산미를 좋아하는지보다, 익숙한 기준점이 내 입에 어떻게 들어오는지 떠올려보세요."
          questionIndex={1}
          tasteLabel="신맛"
          title={'수제버거집 기본 피클의 산미는\n지금의 나에게 어느 쪽에 가까운가요?'}
          totalQuestions={6}
        />
      </div>
    </div>
  );
}

function TCSHintCardFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[520px]">
        <SectionCard hoverEffect={false}>
          <div className="flex w-full flex-col gap-4">
            <div>
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                현재 선택
              </p>
              <p className="mt-2 text-[16px] font-bold leading-[1.2] text-[var(--tb-color-text-primary)]">
                기준보다 조금 더 산뜻한 쪽
              </p>
            </div>

            <TCSHintCard
              title="이 답변은 이렇게 반영돼요"
              description="기준보다 부담스럽게 느껴질수록 신맛 좌표는 낮아지고, 더 즐겁게 느껴질수록 높아져요."
              surface="nested"
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function InterpretationCardFilePreview() {
  const [activeInterpretation, setActiveInterpretation] =
    useState<InterpretationDetailContent | null>(null);
  const [isInterpretationDrawerOpen, setIsInterpretationDrawerOpen] = useState(false);
  const interpretationPreview: InterpretationDetailContent = {
    accentColor: TASTE_TOKENS.sweet.palette.main,
    description: '단맛과 산미의 시작 좌표가 현재 더 빠르게 반응해 코스 후반 무게감은 한 톤 정리될 때 만족이 높아질 가능성이 있어요.',
    eyebrow: '현재 해석 요약',
    meaning: '첫 인상에서 읽히는 축이 빠르게 잡히는 편이라, 강한 대비보다 흐름이 자연스럽게 이어질 때 전체 만족이 더 안정적일 수 있어요.',
    nextStep: '다음 식사에서는 초반 산미와 단맛을 한 번에 높게 밀기보다, 중간 텐션을 분리해 읽는 방식으로 안내해요.',
    title: '단맛과 산미가 먼저 열리는 프로필',
  };

  const handleOpenInterpretation = () => {
    setActiveInterpretation(interpretationPreview);
    setIsInterpretationDrawerOpen(true);
  };

  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[520px]">
        <InterpretationCard
          accentColor={TASTE_TOKENS.sweet.palette.main}
          description={interpretationPreview.description}
          eyebrow={interpretationPreview.eyebrow}
          supportingText="탭하면 해석 drawer가 열립니다."
          onExpand={handleOpenInterpretation}
        />
      </div>

      <InterpretationDetailDrawer
        interpretation={activeInterpretation}
        open={isInterpretationDrawerOpen}
        onOpenChange={setIsInterpretationDrawerOpen}
      />
    </div>
  );
}

function CardDetailLabelFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <div className="flex items-start justify-between gap-3 rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] p-4">
          <div>
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              홈 카드
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
              최근 프로필 변화 카드의 우측 상단 액션 라벨입니다.
            </p>
          </div>
          <CardDetailLabel label="변화 보기" />
        </div>

        <div className="flex items-start justify-between gap-3 rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] p-4">
          <div>
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              분석 카드
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
              카드 상황에 따라 문구만 바꿔서 같은 affordance를 유지합니다.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CardDetailLabel label="해석 보기" />
            <CardDetailLabel label="가이드 보기" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InterpretationDetailDrawerFilePreview() {
  const [open, setOpen] = useState(false);
  const interpretationPreview: InterpretationDetailContent = {
    accentColor: TASTE_TOKENS.sour.palette.main,
    description: '산미와 단맛이 먼저 열리는 패턴이 보여, 초반 인상은 더 맑고 선명하게 읽힐 가능성이 있어요.',
    eyebrow: '상세 해석',
    meaning: '지금은 무게를 초반부터 밀기보다, 중심 축을 먼저 또렷하게 잡아주는 구성이 전체 리듬을 더 편안하게 만들 수 있어요.',
    nextStep: '다음 식사에서는 전채와 첫 메인 사이의 산미 전개를 조금 더 분리해서 읽히도록 안내해요.',
    title: '산미와 단맛이 먼저 열리는 흐름',
  };

  return (
    <div className="min-h-[720px] bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto flex max-w-[640px] flex-col gap-4">
        <InterpretationCard
          accentColor={interpretationPreview.accentColor}
          description={interpretationPreview.description}
          eyebrow={interpretationPreview.eyebrow}
          supportingText="카드를 탭하면 상세 drawer가 열립니다."
          onExpand={() => setOpen(true)}
        />
      </div>

      <InterpretationDetailDrawer
        interpretation={interpretationPreview}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function PageSectionFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[720px] rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <PageSection
          title="지금 읽히는 포인트"
          contentClassName="grid gap-3"
        >
          <SectionCard hoverEffect={false}>
            <div className="w-full">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                먼저 반응하는 축
              </p>
              <p className="mt-2 text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                신맛과 감칠맛이 초반에 더 또렷해요
              </p>
            </div>
          </SectionCard>
          <SectionCard hoverEffect={false}>
            <div className="w-full">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                다음 식사 반영
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                초반 코스의 선명도는 살리고, 후반 무게감은 한 톤 늦춰 읽히게 하는 편이 자연스러울 수 있어요.
              </p>
            </div>
          </SectionCard>
        </PageSection>
      </div>
    </div>
  );
}

function ProfileConfidenceCardFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[720px]">
        <ProfileConfidenceCard
          measurementAgeLabel="3일 전 측정"
          measurementCount={3}
          stage="Building"
          strongestTasteLabel="신맛"
          weakestTasteLabel="지방맛"
        />
      </div>
    </div>
  );
}

function HospitalityEmptyStateFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[720px]">
        <HospitalityEmptyState
          actionLabel="첫 예약 준비하기"
          description="아직 예약은 없지만, 지금 프로필만으로도 어떤 코스 흐름이 더 잘 맞는지 미리 정리할 수 있어요."
          onAction={() => undefined}
          secondaryLabel="식후 피드백이 쌓일수록 더 정교해집니다."
          title="다음 다이닝을 준비할 기준은 이미 만들어졌어요"
          topTasteLabels={['신맛', '감칠맛', '단맛']}
        />
      </div>
    </div>
  );
}

function TasteMeasurementChecklistPanelFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[520px] rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <TasteMeasurementChecklistPanel />
      </div>
    </div>
  );
}

function TasteMeasurementIntroPanelFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto flex min-h-[640px] max-w-[520px] flex-col rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <TasteMeasurementIntroPanel />
      </div>
    </div>
  );
}

function TasteMeasurementPreparationPanelFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto flex min-h-[700px] max-w-[520px] flex-col rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <TasteMeasurementPreparationPanel
          currentTaste={TASTE_TOKENS.sour}
          stepIndex={1}
          totalSteps={6}
        />
      </div>
    </div>
  );
}

function TasteMeasurementActivePanelFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto flex min-h-[700px] max-w-[520px] flex-col rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <TasteMeasurementActivePanel
          activeLevel={4}
          currentTaste={TASTE_TOKENS.sour}
          currentTasteId="sour"
        />
      </div>
    </div>
  );
}

function TasteMeasurementCompletedPanelFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[720px] rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <TasteMeasurementCompletedPanel
          snapshot={createInitialTasteMeasurementSnapshot()}
        />
      </div>
    </div>
  );
}

function SectionCardFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-4">
      <div className="mx-auto max-w-[520px]">
        <SectionCard hoverEffect={false}>
          <div className="flex w-full flex-col gap-3">
            <OutlineBadge>Starter Profile</OutlineBadge>
            <SectionTitle size="md">현재 입맛 인벤토리</SectionTitle>
            <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              앱 전반에서 반복되는 기본 카드 셸입니다. 안쪽 블록, 보조 카피, 상태 칩 조합의 기준이 됩니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <TasteChip taste="신맛" value="현재 더 또렷한 포인트" />
              <TasteChip taste="단맛" value="보정 필요" />
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PrimaryButtonFilePreview() {
  return (
    <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-3 bg-[var(--tb-color-surface-muted)] p-6">
      <PrimaryButton fullWidth={false}>Default</PrimaryButton>
      <PrimaryButton fullWidth={false} size="compact">Compact</PrimaryButton>
      <PrimaryButton fullWidth={false} disabled>Disabled</PrimaryButton>
    </div>
  );
}

function OutlineBadgeFilePreview() {
  return (
    <div className="flex min-h-[180px] items-center justify-center bg-[var(--tb-color-surface-muted)] p-6">
      <OutlineBadge>Starter Profile</OutlineBadge>
    </div>
  );
}

function StatusChipFilePreview() {
  return (
    <div className="flex min-h-[180px] items-center justify-center bg-[var(--tb-color-surface-muted)] p-6">
      <StatusChip color="var(--tb-color-text-secondary)">
        예약 확정
      </StatusChip>
    </div>
  );
}

function ChipFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-6">
      <div className="mx-auto grid max-w-[560px] gap-4">
        <div className="grid gap-2 rounded-[24px] border border-[var(--tb-color-border-default)] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip size="xs">XS</Chip>
            <Chip size="sm">SM</Chip>
            <Chip size="md">MD</Chip>
          </div>
        </div>

        <div className="grid gap-2 rounded-[24px] border border-[var(--tb-color-border-default)] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
            Tone
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip tone="neutral">Neutral</Chip>
            <Chip tone="success">Success</Chip>
            <Chip tone="warning" variant="outline">Warning</Chip>
            <Chip tone="accent" variant="solid">Accent</Chip>
          </div>
        </div>

        <div className="grid gap-2 rounded-[24px] border border-[var(--tb-color-border-default)] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
            Pattern
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip variant="text">Text label</Chip>
            <Chip
              size="md"
              tone="neutral"
              variant="outline"
              backgroundColorToken="var(--tb-color-surface-base)"
              leadingIcon={<Clock size={ICON_TOKENS.size.md} />}
              className="text-[var(--tb-color-text-primary)]"
            >
              Recent search
            </Chip>
            <Chip leadingIcon={<Sparkles size={ICON_TOKENS.size.md} />}>Icon + text</Chip>
            <Chip
              size="md"
              tone="accent"
              leadingIcon={<Sparkles size={ICON_TOKENS.size.md} />}
              trailingIcon={<ChevronRight size={ICON_TOKENS.size.md} />}
            >
              Chef-ready
            </Chip>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasteChipFilePreview() {
  return (
    <div className="flex min-h-[180px] items-center justify-center bg-[var(--tb-color-surface-muted)] p-6">
      <TasteChip taste="감칠맛" value="현재 더 또렷한 포인트" />
    </div>
  );
}

function TastePointArrowBoxFilePreview() {
  const groupedTasteIds = [
    { size: 'sm', tastes: ['sweet', 'sour'] },
    { size: 'md', tastes: ['bitter', 'salty'] },
    { size: 'lg', tastes: ['umami', 'fat'] },
  ] as const;
  const sizePreviewItems = groupedTasteIds.flatMap((group) =>
    group.tastes.map((tasteId, index) => ({
      size: group.size,
      tasteId,
      trend: index === 0 ? 'increase' : 'decrease',
    })),
  );

  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-6">
      <div className="mx-auto grid max-w-[460px] gap-3 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <div className="rounded-[18px] bg-[var(--tb-color-surface-muted)] px-4 py-4">
          <div className="grid grid-cols-6 gap-3">
            {sizePreviewItems.map((item) => (
              <div
                key={`taste-point-preview-${item.size}-${item.tasteId}`}
                className="grid min-w-0 grid-rows-[64px_auto] gap-2"
              >
                <div className="flex items-end justify-center">
                  <TastePointArrowBox
                    parentTaste={TASTE_TOKENS[item.tasteId].label}
                    size={item.size}
                    trend={item.trend}
                  />
                </div>
                <span className="text-center text-[11px] font-medium text-[var(--tb-color-text-subtle)]">
                  {TASTE_TOKENS[item.tasteId].label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-[var(--tb-color-border-default)] pt-3">
            {groupedTasteIds.map((group) => (
              <div
                key={`taste-point-preview-size-token-${group.size}`}
                className="text-center"
              >
                <span className="font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                  {group.size} {TASTE_POINT_ARROW_BOX_SIZE_TOKENS[group.size]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
          <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
            Direction token
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {(Object.values(TASTE_POINT_ARROW_BOX_DIRECTION_TOKENS) as Array<keyof typeof TASTE_POINT_ARROW_BOX_DIRECTION_TOKENS>).map((direction) => (
              <div
                key={`taste-point-preview-direction-${direction}`}
                className="grid min-w-0 grid-rows-[44px_auto] justify-items-center gap-2 rounded-[14px] bg-white px-3 py-3"
              >
                <TastePointArrowBox
                  parentTaste={TASTE_TOKENS.umami.label}
                  size="md"
                  trend={direction}
                />
                <div className="grid justify-items-center gap-0.5">
                  <span className="font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                    {direction}
                  </span>
                  <span className="text-[11px] text-[var(--tb-color-text-muted)]">
                    {direction === 'increase' ? '상향' : direction === 'decrease' ? '하향' : '중립'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitleFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-6">
      <div className="mx-auto max-w-[520px] rounded-[24px] bg-white p-5 shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
        <SectionTitle size="lg">프로필이 식사 맥락에 맞게 정리됩니다</SectionTitle>
      </div>
    </div>
  );
}

function EmptyStateFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-6">
      <div className="mx-auto max-w-[520px]">
        <EmptyState
          description="현재 프로필과 연결된 다이닝 예약을 정리하고 있어요."
          title="예약을 불러오는 중이에요"
        />
      </div>
    </div>
  );
}

function UiCardFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-6">
      <div className="mx-auto max-w-[520px]">
        <Card className="border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] shadow-none">
          <CardHeader className="gap-1">
            <CardTitle className="text-[14px] text-[var(--tb-color-text-primary)]">
              Generic card primitive
            </CardTitle>
            <CardDescription className="text-[var(--tb-color-text-subtle)]">
              Title, description, and content regions are kept flexible for internal tools and document-like layouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-[13px] text-[var(--tb-color-text-subtle)]">
            <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
              범용 Card 프리미티브는 문서형 UI에서 사용합니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UiButtonFilePreview() {
  return (
    <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-3 bg-[var(--tb-color-surface-muted)] p-6">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  );
}

function UiBadgeFilePreview() {
  return (
    <div className="flex min-h-[180px] flex-wrap items-center justify-center gap-3 bg-[var(--tb-color-surface-muted)] p-6">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  );
}

function UiInputFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-6">
      <div className="mx-auto max-w-[420px]">
        <Input defaultValue="셰프, 레스토랑, 지역 검색" />
      </div>
    </div>
  );
}

function UiTextareaFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-6">
      <div className="mx-auto max-w-[520px]">
        <Textarea defaultValue="예: 메인 이후의 무게감은 조금 빨리 쌓였고, 디저트는 마무리가 더 선명하면 좋겠어요." />
      </div>
    </div>
  );
}

function UiSelectFilePreview() {
  return (
    <div className="bg-[var(--tb-color-surface-muted)] p-6">
      <div className="mx-auto max-w-[320px]">
        <Select defaultValue="starter">
          <SelectTrigger>
            <SelectValue placeholder="Profile stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="building">Building</SelectItem>
            <SelectItem value="refined">Refined</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function OnboardingScreenFilePreview() {
  return <OnboardingScreen onComplete={() => undefined} />;
}

function QuickTasteCalibrationScreenFilePreview() {
  return (
    <QuickTasteCalibrationScreen
      onBack={() => undefined}
      onComplete={() => undefined}
    />
  );
}

function TasteMeasurementScreenFilePreview() {
  return (
    <TasteMeasurementScreen
      initialPhase="intro"
      onBack={() => undefined}
      onComplete={() => undefined}
    />
  );
}

function ReservationPageFilePreview() {
  const measurementSnapshot = createInitialTasteMeasurementSnapshot();

  return (
    <ReservationPage
      disableHydration
      initialReservations={RESERVATION_CATALOG}
      measurementSnapshot={measurementSnapshot}
      onStartMeasurement={() => undefined}
    />
  );
}

function ProfilePageFilePreview() {
  return (
    <ProfilePage
      measurementSnapshot={createInitialTasteMeasurementSnapshot()}
      onStartMeasurement={() => undefined}
    />
  );
}

function ImproveAccuracyScreenFilePreview() {
  return (
    <ImproveAccuracyScreen
      currentProfileStage="Building"
      onConnectDevice={() => undefined}
      onSkip={() => undefined}
    />
  );
}

function ReservationConfirmationScreenFilePreview() {
  return (
    <ReservationConfirmationScreen
      onBack={() => undefined}
      onComplete={() => undefined}
    />
  );
}

function DiningFeedbackFlowFilePreview() {
  const scenario = useMemo(() => getDiningFeedbackScenario(3), []);
  const [draft, setDraft] = useState(() => (
    scenario ? createDiningFeedbackDraft(scenario) : null
  ));

  if (!scenario || !draft) {
    return null;
  }

  return (
    <DiningFeedbackScreen
      draft={draft}
      onBack={() => undefined}
      onChange={setDraft}
      onSubmit={() => undefined}
      scenario={scenario}
    />
  );
}

const FILE_PREVIEW_DEFINITIONS: Record<string, FilePreviewDefinition> = {
  'src/components/SectionCard.tsx': {
    description: 'The shared hospitality card shell used across profile, reservation, and feedback flows.',
    kind: 'component',
    title: 'SectionCard.tsx',
    render: () => <SectionCardFilePreview />,
  },
  'src/components/system/PrimaryButton.tsx': {
    description: 'The current app primary action button with default, compact, and disabled states.',
    kind: 'component',
    title: 'PrimaryButton.tsx',
    render: () => <PrimaryButtonFilePreview />,
  },
  'src/components/system/FlowBottomCta.tsx': {
    description: 'The anchored bottom CTA shell with safe-area spacing and bottom fade.',
    kind: 'component',
    title: 'FlowBottomCta.tsx',
    render: () => <FlowBottomCtaFilePreview />,
  },
  'src/components/system/FlowStepCta.tsx': {
    description: 'The shared onboarding / taste measurement footer built on top of FlowBottomCta and StepIndicator.',
    kind: 'component',
    title: 'FlowStepCta.tsx',
    render: () => <FlowStepCtaFilePreview />,
  },
  'src/components/system/FlowHeaderBlock.tsx': {
    description: 'A shared flow intro header block that aligns top badges with a title and description stack.',
    kind: 'component',
    title: 'FlowHeaderBlock.tsx',
    render: () => <FlowHeaderBlockFilePreview />,
  },
  'src/components/system/PageSection.tsx': {
    description: 'A section wrapper that pairs a SectionTitle with a stacked content area.',
    kind: 'component',
    title: 'PageSection.tsx',
    render: () => <PageSectionFilePreview />,
  },
  'src/components/system/StepIndicator.tsx': {
    description: 'A reusable progress dot indicator that can tint only the active step with taste palette colors.',
    kind: 'component',
    title: 'StepIndicator.tsx',
    render: () => <StepIndicatorFilePreview />,
  },
  'src/components/system/StepBadge.tsx': {
    description: 'A compact progress badge used in flow headers for question counts like 1 / 7.',
    kind: 'component',
    title: 'StepBadge.tsx',
    render: () => <StepBadgeFilePreview />,
  },
  'src/components/system/OutlineBadge.tsx': {
    description: 'Neutral outline badge used for stage labels and light contextual tags.',
    kind: 'component',
    title: 'OutlineBadge.tsx',
    render: () => <OutlineBadgeFilePreview />,
  },
  'src/components/system/Chip.tsx': {
    description: 'The product-level general chip used for neutral, semantic, and icon-plus-text inline labels.',
    kind: 'component',
    title: 'Chip.tsx',
    render: () => <ChipFilePreview />,
  },
  'src/components/system/StatusChip.tsx': {
    description: 'Status chip used in reservation and hospitality state surfaces.',
    kind: 'component',
    title: 'StatusChip.tsx',
    render: () => <StatusChipFilePreview />,
  },
  'src/components/system/TasteChip.tsx': {
    description: 'Taste-aware chip used to translate profile interpretation into short labels.',
    kind: 'component',
    title: 'TasteChip.tsx',
    render: () => <TasteChipFilePreview />,
  },
  'src/components/system/TastePointArrowBox.tsx': {
    description: 'Taste-colored arrow marker used ahead of micro deltas and chef adjustment points.',
    kind: 'component',
    title: 'TastePointArrowBox.tsx',
    render: () => <TastePointArrowBoxFilePreview />,
  },
  'src/components/system/SectionTitle.tsx': {
    description: 'Shared section title typography used across app flows.',
    kind: 'component',
    title: 'SectionTitle.tsx',
    render: () => <SectionTitleFilePreview />,
  },
  'src/components/system/TCSHintCard.tsx': {
    description: 'Contextual hint card used in quick taste calibration flows.',
    kind: 'component',
    title: 'TCSHintCard.tsx',
    render: () => <TCSHintCardFilePreview />,
  },
  'src/components/system/TCSBadge.tsx': {
    description: 'Gradient TCS badge used at the top of home dining-preparation and legacy history cards.',
    kind: 'component',
    title: 'TCSBadge.tsx',
    render: () => <TCSBadgeFilePreview />,
  },
  'src/components/system/BottomSheetShell.tsx': {
    description: 'Shared product bottom-sheet shell with header slots, scrollable body, and fixed footer CTA.',
    kind: 'component',
    title: 'BottomSheetShell.tsx',
    render: () => <BottomSheetShellFilePreview />,
  },
  'src/components/system/SelectionCard.tsx': {
    description: 'Selectable card used in preference and intake flows for radio or checkbox-style choices.',
    kind: 'component',
    title: 'SelectionCard.tsx',
    render: () => <SelectionCardFilePreview />,
  },
  'src/components/system/HexRadarChart.tsx': {
    description: 'Taste profile radar chart used to visualize six taste axes in a hospitality-friendly format.',
    kind: 'component',
    title: 'HexRadarChart.tsx',
    render: () => <HexRadarChartFilePreview />,
  },
  'src/components/system/InterpretationCard.tsx': {
    description: 'Interpretation card that surfaces profile meaning in a compact hospitality voice.',
    kind: 'component',
    title: 'InterpretationCard.tsx',
    render: () => <InterpretationCardFilePreview />,
  },
  'src/components/system/CardDetailLabel.tsx': {
    description: 'Compact top-right card affordance label with a configurable action phrase.',
    kind: 'component',
    title: 'CardDetailLabel.tsx',
    render: () => <CardDetailLabelFilePreview />,
  },
  'src/components/system/InterpretationDetailDrawer.tsx': {
    description: 'A drawer that expands profile interpretation into meaning and next-step guidance.',
    kind: 'component',
    title: 'InterpretationDetailDrawer.tsx',
    render: () => <InterpretationDetailDrawerFilePreview />,
  },
  'src/components/system/ProfileConfidenceCard.tsx': {
    description: 'Profile confidence card that explains the current stage and what will refine it next.',
    kind: 'component',
    title: 'ProfileConfidenceCard.tsx',
    render: () => <ProfileConfidenceCardFilePreview />,
  },
  'src/components/system/HospitalityEmptyState.tsx': {
    description: 'A hospitality-style empty state that keeps momentum toward the next dining experience.',
    kind: 'component',
    title: 'HospitalityEmptyState.tsx',
    render: () => <HospitalityEmptyStateFilePreview />,
  },
  'src/components/system/EmptyState.tsx': {
    description: 'The shared empty/loading-style placeholder used in app flows.',
    kind: 'component',
    title: 'EmptyState.tsx',
    render: () => <EmptyStateFilePreview />,
  },
  'src/components/measurement/TasteMeasurementMiniCta.tsx': {
    description: 'The compact measurement CTA block used in reservation and profile surfaces.',
    kind: 'component',
    title: 'TasteMeasurementMiniCta.tsx',
    render: () => <TasteMeasurementMiniCtaFilePreview />,
  },
  'src/components/system/TasteTintCard.tsx': {
    description: 'The reusable square taste tint card used for measurement interpretation and summary blocks.',
    kind: 'component',
    title: 'TasteTintCard.tsx',
    render: () => <TasteTintCardFilePreview />,
  },
  'src/components/system/TasteTintCardList.tsx': {
    description: 'The grid wrapper for reusable square taste tint cards.',
    kind: 'component',
    title: 'TasteTintCardList.tsx',
    render: () => <TasteTintCardListFilePreview />,
  },
  'src/components/system/CardScrollList.tsx': {
    description: 'The horizontal scroll wrapper for reusable card strips.',
    kind: 'component',
    title: 'CardScrollList.tsx',
    render: () => <CardScrollListFilePreview />,
  },
  'src/components/measurement/TasteAxisMeter.tsx': {
    description: 'A single taste axis meter used in quick calibration result summaries.',
    kind: 'component',
    title: 'TasteAxisMeter.tsx',
    render: () => <TasteAxisMeterFilePreview />,
  },
  'src/components/measurement/CalibrationQuestionHeader.tsx': {
    description: 'The question header block for quick calibration with title, description, and step count.',
    kind: 'component',
    title: 'CalibrationQuestionHeader.tsx',
    render: () => <CalibrationQuestionHeaderFilePreview />,
  },
  'src/components/measurement/TasteMeasurementChecklistPanel.tsx': {
    description: 'The checklist panel shown before starting device-based taste measurement.',
    kind: 'component',
    title: 'TasteMeasurementChecklistPanel.tsx',
    render: () => <TasteMeasurementChecklistPanelFilePreview />,
  },
  'src/components/measurement/TasteMeasurementIntroPanel.tsx': {
    description: 'The introductory panel that sets up the measurement flow before device guidance begins.',
    kind: 'component',
    title: 'TasteMeasurementIntroPanel.tsx',
    render: () => <TasteMeasurementIntroPanelFilePreview />,
  },
  'src/components/measurement/TasteMeasurementPreparationPanel.tsx': {
    description: 'The preparation panel that explains device posture and readiness before a taste run.',
    kind: 'component',
    title: 'TasteMeasurementPreparationPanel.tsx',
    render: () => <TasteMeasurementPreparationPanelFilePreview />,
  },
  'src/components/measurement/TasteMeasurementActivePanel.tsx': {
    description: 'The active measurement panel with animated loop feedback while sensitivity is being measured.',
    kind: 'component',
    title: 'TasteMeasurementActivePanel.tsx',
    render: () => <TasteMeasurementActivePanelFilePreview />,
  },
  'src/components/measurement/TasteMeasurementCompletedPanel.tsx': {
    description: 'The completion panel that summarizes the measured taste profile and detailed values.',
    kind: 'component',
    title: 'TasteMeasurementCompletedPanel.tsx',
    render: () => <TasteMeasurementCompletedPanelFilePreview />,
  },
  'src/components/reservation/ReservationCard.tsx': {
    description: 'The reusable reservation list card extracted from the reservation screen.',
    kind: 'component',
    title: 'ReservationCard.tsx',
    render: () => <ReservationCardFilePreview />,
  },
  'src/components/reservation/DiningFeedbackFlow.tsx': {
    description: 'The dining feedback flow surface used after dining to refine the next reservation.',
    kind: 'mobile-screen',
    title: 'DiningFeedbackFlow.tsx',
    render: () => <DiningFeedbackFlowFilePreview />,
  },
  'src/components/ui/card.tsx': {
    description: 'The generic card primitive from the ui layer.',
    kind: 'component',
    title: 'card.tsx',
    render: () => <UiCardFilePreview />,
  },
  'src/components/ui/button.tsx': {
    description: 'The generic ui button primitive with multiple variants.',
    kind: 'component',
    title: 'button.tsx',
    render: () => <UiButtonFilePreview />,
  },
  'src/components/ui/badge.tsx': {
    description: 'The generic ui badge primitive.',
    kind: 'component',
    title: 'badge.tsx',
    render: () => <UiBadgeFilePreview />,
  },
  'src/components/ui/input.tsx': {
    description: 'The generic ui input primitive.',
    kind: 'component',
    title: 'input.tsx',
    render: () => <UiInputFilePreview />,
  },
  'src/components/ui/textarea.tsx': {
    description: 'The generic ui textarea primitive.',
    kind: 'component',
    title: 'textarea.tsx',
    render: () => <UiTextareaFilePreview />,
  },
  'src/components/ui/select.tsx': {
    description: 'The generic ui select primitive.',
    kind: 'component',
    title: 'select.tsx',
    render: () => <UiSelectFilePreview />,
  },
  'src/pages/OnboardingScreen.tsx': {
    description: 'The onboarding screen as it appears in the current product flow.',
    kind: 'mobile-screen',
    title: 'OnboardingScreen.tsx',
    render: () => <OnboardingScreenFilePreview />,
  },
  'src/pages/QuickTasteCalibrationScreen.tsx': {
    description: 'The full quick taste calibration flow screen.',
    kind: 'mobile-screen',
    title: 'QuickTasteCalibrationScreen.tsx',
    render: () => <QuickTasteCalibrationScreenFilePreview />,
  },
  'src/pages/TasteMeasurementScreen.tsx': {
    description: 'The taste measurement flow using the shared anchored step footer.',
    kind: 'mobile-screen',
    title: 'TasteMeasurementScreen.tsx',
    render: () => <TasteMeasurementScreenFilePreview />,
  },
  'src/pages/ReservationPage.tsx': {
    description: 'The reservation screen with personalized dining interpretation and reservation list.',
    kind: 'mobile-screen',
    title: 'ReservationPage.tsx',
    render: () => <ReservationPageFilePreview />,
  },
  'src/pages/ProfilePage.tsx': {
    description: 'The profile screen showing evolving confidence, activity summary, and taste profile.',
    kind: 'mobile-screen',
    title: 'ProfilePage.tsx',
    render: () => <ProfilePageFilePreview />,
  },
  'src/pages/ImproveAccuracyScreen.tsx': {
    description: 'The optional precision upgrade screen for Teastick-assisted profile refinement.',
    kind: 'mobile-screen',
    title: 'ImproveAccuracyScreen.tsx',
    render: () => <ImproveAccuracyScreenFilePreview />,
  },
  'src/pages/ReservationConfirmationScreen.tsx': {
    description: 'The reservation confirmation progression screen after booking.',
    kind: 'mobile-screen',
    title: 'ReservationConfirmationScreen.tsx',
    render: () => <ReservationConfirmationScreenFilePreview />,
  },
};

export function getFilePreviewDefinition(file: string) {
  return FILE_PREVIEW_DEFINITIONS[file.trim()] ?? null;
}

export function getFilePreviewEntries(): FilePreviewEntry[] {
  return Object.entries(FILE_PREVIEW_DEFINITIONS)
    .map(([file, definition]) => ({
      definition,
      file,
    }))
    .sort((left, right) => left.file.localeCompare(right.file));
}

export function getFilePreviewHref(file: string) {
  const normalizedFile = file.trim();

  if (!getFilePreviewDefinition(normalizedFile)) {
    return null;
  }

  return `/design-system-updates?file-preview=${encodeURIComponent(normalizedFile)}`;
}

interface ComponentFilePreviewProps {
  file: string;
}

export default function ComponentFilePreview({
  file,
}: ComponentFilePreviewProps) {
  const definition = getFilePreviewDefinition(file);

  if (!definition) {
    return (
      <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#F7F7F7_0%,#FFFFFF_28%,#F7F7F7_100%)] px-4 py-6">
        <div className="mx-auto flex max-w-[920px] flex-col gap-6">
          <div className="rounded-[32px] bg-[var(--tb-color-text-primary)] px-6 py-6 text-[var(--tb-color-text-inverse)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Component File Preview
            </p>
            <h1 className="mt-2 text-[18px] font-bold leading-tight">
              이 파일은 아직 단일 프리뷰가 연결되어 있지 않습니다
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-white/78">
              현재는 앱에서 실제로 자주 확인하는 screen / component 파일 위주로 라이브 프리뷰를 연결해두었습니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/design-system"
                className="inline-flex h-[44px] items-center justify-center rounded-[var(--tb-radius-10)] bg-white px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)]"
              >
                디자인 시스템으로 돌아가기
              </a>
              <a
                href="/design-system-updates"
                className="inline-flex h-[44px] items-center justify-center rounded-[var(--tb-radius-10)] border border-white/24 px-4 text-[13px] font-semibold text-white"
              >
                업데이트 프리뷰 보기
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--tb-color-border-default)] bg-white px-5 py-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--tb-color-text-muted)]">
              Requested file
            </p>
            <p className="mt-3 break-all font-mono text-[12px] text-[var(--tb-color-text-primary)]">
              {file}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#F7F7F7_0%,#FFFFFF_28%,#F7F7F7_100%)] px-4 py-6">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
        <div className="rounded-[32px] bg-[var(--tb-color-text-primary)] px-6 py-6 text-[var(--tb-color-text-inverse)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Component File Preview
              </p>
              <h1 className="text-[18px] font-bold leading-tight">
                {definition.title}
              </h1>
              <p className="max-w-[760px] text-[14px] leading-relaxed text-white/78">
                {definition.description}
              </p>
              <p className="break-all font-mono text-[11px] text-white/72">
                {file}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/design-system"
                className="inline-flex h-[44px] items-center justify-center rounded-[var(--tb-radius-10)] bg-white px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)]"
              >
                디자인 시스템
              </a>
              <a
                href="/design-system-updates"
                className="inline-flex h-[44px] items-center justify-center rounded-[var(--tb-radius-10)] border border-white/24 px-4 text-[13px] font-semibold text-white"
              >
                업데이트 프리뷰
              </a>
            </div>
          </div>
        </div>

        {definition.kind === 'mobile-screen' ? (
          <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[32px] border border-[var(--tb-color-border-default)] bg-white shadow-[0_24px_60px_rgba(15,15,15,0.12)]">
            <div className="pointer-events-none absolute" />
            <div className="pointer-events-none flex justify-center pt-3">
              <div className="h-1.5 w-24 rounded-full bg-[var(--tb-color-border-strong)]" />
            </div>
            <div className="h-[844px] overflow-y-auto overflow-x-hidden bg-white">
              {definition.render()}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'overflow-hidden rounded-[32px] border border-[var(--tb-color-border-default)] bg-white shadow-[0_24px_60px_rgba(15,15,15,0.08)]',
              definition.frameClassName,
            )}
          >
            {definition.render()}
          </div>
        )}
      </div>
    </div>
  );
}
