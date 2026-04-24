import { useState, type ReactNode } from "react";
import {
  RefreshCw as RefreshCwIcon,
  BatteryFull as BatteryFullIcon,
  Bluetooth as BluetoothIcon,
  Calendar as CalendarIcon,
  MessageCircle as MessageCircleIcon,
  ChevronRight as ChevronRightIcon,
  Utensils as UtensilsIcon,
  Settings as SettingsIcon,
  Sparkles as SparklesIcon,
  Star as StarIcon
} from 'lucide-react';

import chefHwangJeongin from "../../assets/HwangJeongin.png";
import chefLeeEunji from "../../assets/LeeEunji.png";
import chefLimJeongsik from "../../assets/LimJeongsik.png";
import { ICON_TOKENS, TASTE_IDS, TASTE_TOKENS, type TasteId } from "../../constants/designTokens";
import { buildTasteAdjustmentGradient } from "../../constants/tasteColors";
import TasteMeasurementMiniCta from "../measurement/TasteMeasurementMiniCta";
import SectionCard from "../SectionCard";
import CardIconBox from "../system/CardIconBox";
import InspectableComponent from "../system/InspectableComponent";
import InterpretationDetailDrawer, {
  type InterpretationDetailContent,
} from "../system/InterpretationDetailDrawer";
import InterpretationCard from "../system/InterpretationCard";
import OutlineBadge from "../system/OutlineBadge";
import TCSHintCard from "../system/TCSHintCard";
import SectionTitle from "../system/SectionTitle";
import StatusChip from "../system/StatusChip";
import TasteChip from "../system/TasteChip";
import CardScrollList from "../system/CardScrollList";
import { TasteTintCardPreviewCard, TasteTintCardPreviewChips } from "./TasteTintCardInteractivePreview";
import TasteTintCard from "../system/TasteTintCard";
import TasteTintCardList from "../system/TasteTintCardList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import PreviewableSourceText from "./PreviewableSourceText";

interface CardGalleryProps {
  accentTaste: TasteId;
  ctaTone: "alert" | "neutral";
  onNavigateToSection?: (sectionId: string, componentName: string) => void;
  statusBackgroundColor: string;
  statusColor: string;
  statusLabel: string;
}

function SampleBlock({
  badge = "실사용",
  children,
  componentNames,
  description,
  footer,
  previewBackgroundClass = "bg-[var(--tb-color-surface-muted)]",
  source,
  title,
}: {
  badge?: string;
  children: ReactNode;
  componentNames?: string[];
  description: string;
  footer?: ReactNode;
  previewBackgroundClass?: string;
  source: string;
  title: string;
}) {
  return (
    <div
      className="grid min-w-0 gap-3 rounded-[var(--tb-radius-20)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] p-4"
      data-component-preview={componentNames?.length === 1 ? componentNames[0] : undefined}
      data-component-preview-list={componentNames?.length ? JSON.stringify(componentNames) : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {description}
          </p>
          {componentNames?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {componentNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[10px] font-semibold text-[var(--tb-color-text-muted)]"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
            <PreviewableSourceText value={source} />
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[10px] font-semibold text-[var(--tb-color-text-muted)]">
          {badge}
        </span>
      </div>
      <div className={`min-w-0 overflow-hidden rounded-[var(--tb-radius-14)] p-3 ${previewBackgroundClass}`.trim()}>
        {children}
      </div>
      {footer ? <div className="min-w-0">{footer}</div> : null}
    </div>
  );
}

function GallerySection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">{title}</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          {description}
        </p>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">{children}</div>
    </section>
  );
}

const favoriteChefs = [
  { image: chefHwangJeongin, matchRate: 75, name: "황정인 셰프", restaurant: "레스토랑 베누" },
  { image: chefLeeEunji, matchRate: 72, name: "이은지 셰프", restaurant: "숍 리제" },
  { image: chefLimJeongsik, matchRate: 70, name: "임정식 셰프", restaurant: "정식당" },
] as const;

const tasteTintScrollSamples = TASTE_IDS.map((tasteId, index) => ({
  detail: "보조 텍스트",
  description: "설명 텍스트",
  tasteId,
  title: "타이틀",
  order: index + 1,
}));

const activityStats = [
  { color: "#FF9900", icon: SparklesIcon, label: "TCS 보정", value: "12회" },
  { color: "#B372B4", icon: MessageCircleIcon, label: "피드백", value: "8건" },
  { color: "#7299FF", icon: CalendarIcon, label: "이용 기간", value: "3개월" },
  { color: "#FBC02D", icon: StarIcon, label: "평균 만족도", value: "4.5" },
] as const;

const settingsItems = [
  { desc: "테이스틱으로 미각 민감도 다시 측정", icon: RefreshCwIcon, label: "미각 재측정" },
  { desc: "다이닝 전 미각 측정 알림", icon: SettingsIcon, label: "보정 알림 설정" },
] as const;

export default function CardGallery({
  accentTaste,
  ctaTone,
  onNavigateToSection,
  statusBackgroundColor,
  statusColor,
  statusLabel,
}: CardGalleryProps) {
  const accentLabel = TASTE_TOKENS[accentTaste].label;
  const [activeInterpretation, setActiveInterpretation] =
    useState<InterpretationDetailContent | null>(null);
  const [isInterpretationDrawerOpen, setIsInterpretationDrawerOpen] = useState(false);
  const [activeTasteTintId, setActiveTasteTintId] = useState<TasteId>(TASTE_IDS[0]);
  const chefTranslationSampleCopy =
    "단맛과 신맛이 현재 더 빠르게 반응하는 포인트이므로, 코스 구성 시 너무 밀도 있게 겹치지 않도록 조절하면 전반적 밸런스가 한층 여유롭게 맞춰집니다.";
  const chefTranslationSampleIndicator = buildTasteAdjustmentGradient(
    [
      { change: 86, taste: "단맛" },
      { change: 74, taste: "신맛" },
    ],
    "to bottom",
  );
  const openInterpretationDrawer = (interpretation: InterpretationDetailContent) => {
    setActiveInterpretation(interpretation);
    setIsInterpretationDrawerOpen(true);
  };
  const accentInterpretationSample: InterpretationDetailContent = {
    accentColor: TASTE_TOKENS[accentTaste].palette.main,
    description: `${accentLabel} 쪽이 현재 더 빠르게 반응하는 포인트라, 다음 코스에서는 한 번에 밀도 높게 겹치지 않게 조정하는 편이 더 편안합니다.`,
    eyebrow: "현재 해석 요약",
    indicatorBackground: TASTE_TOKENS[accentTaste].palette.main,
    meaning: `${accentLabel} 축이 먼저 읽히는 만큼, 시작 인상은 비교적 또렷하게 형성될 가능성이 있어요. 다른 맛을 완전히 덜어내기보다 연결감을 유지한 채 흐름을 나누는 쪽이 더 자연스럽습니다.`,
    nextStep: `예약 개인화와 셰프 가이드에서는 ${accentLabel} 밀도를 한 번에 밀기보다, 중간 여백을 두고 이어지는 코스를 우선 검토해요.`,
    title: `${accentLabel} 반응이 먼저 올라와요`,
  };
  const chefTranslationInterpretation: InterpretationDetailContent = {
    description: chefTranslationSampleCopy,
    eyebrow: "셰프 참고 가이드",
    indicatorBackground: chefTranslationSampleIndicator,
    meaning: "현재 프로필은 단맛과 신맛의 출발점이 먼저 읽히는 편이라, 코스 초반에 너무 밀집되면 균형이 살짝 앞쪽으로 쏠릴 수 있어요.",
    nextStep: "다음 식사에서는 산미와 단맛이 겹치는 지점을 나눠 읽는 참고 포인트로 전달됩니다. 셰프의 의도를 바꾸기보다, 손님이 더 편안하게 받아들이는 속도를 돕는 쪽에 가깝습니다.",
    title: "셰프가 참고할 현재 프로필 가이드",
  };
  const accentPalette = TASTE_TOKENS[accentTaste].palette;

  return (
    <div className="tb-section-stack">
      <GallerySection
        title="공용 카드"
        description="여러 화면에서 바로 재사용할 수 있는 공용 카드와 시스템 프리미티브입니다."
      >
        <SampleBlock
          title="SectionCard 기본 셸"
          description="현재 앱 전반에서 가장 많이 쓰는 기본 카드 래퍼입니다."
          componentNames={["SectionCard", "OutlineBadge", "SectionTitle", "StatusChip", "TasteChip"]}
          source="src/components/SectionCard.tsx"
        >
          <SectionCard hoverEffect={false}>
            <div className="flex w-full items-start justify-between gap-3">
              <div>
                <InspectableComponent
                  componentName="OutlineBadge"
                  onNavigate={onNavigateToSection}
                  sectionId="badges"
                >
                  <OutlineBadge>Starter Profile</OutlineBadge>
                </InspectableComponent>
                <SectionTitle className="mt-3">현재 입맛 인벤토리</SectionTitle>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  가장 많이 반복되는 카드 셸, 상태 칩, 미각 칩 조합입니다.
                </p>
              </div>
              <InspectableComponent
                componentName="StatusChip"
                onNavigate={onNavigateToSection}
                sectionId="badges"
              >
                <StatusChip color={statusColor} backgroundColor={statusBackgroundColor}>
                  {statusLabel}
                </StatusChip>
              </InspectableComponent>
            </div>
            <div className="flex flex-wrap gap-2">
              <InspectableComponent
                componentName="TasteChip"
                onNavigate={onNavigateToSection}
                sectionId="badges"
              >
                <TasteChip taste={accentLabel} value="현재 더 또렷한 포인트" />
              </InspectableComponent>
              <InspectableComponent
                componentName="TasteChip"
                onNavigate={onNavigateToSection}
                sectionId="badges"
              >
                <TasteChip taste="짠맛" value="보정 필요" />
              </InspectableComponent>
            </div>
            <div className="w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-base)] px-4 py-3">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">보조 정보 영역</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                카드 안쪽 보조 블록도 함께 재사용되는 구조입니다.
              </p>
            </div>
          </SectionCard>
        </SampleBlock>

        <SampleBlock
          title="ui/Card 프리미티브"
          description="내부 설정, 도구 화면, 문서형 레이아웃에서 쓸 수 있는 범용 카드입니다."
          componentNames={["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent"]}
          source="src/components/ui/card.tsx"
          badge="정의됨"
        >
          <Card className="border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] shadow-none">
            <CardHeader className="gap-1">
              <CardTitle className="text-[14px] text-[var(--tb-color-text-primary)]">공용 카드 레이아웃</CardTitle>
              <CardDescription className="text-[var(--tb-color-text-subtle)]">
                제목, 설명, 본문 구조가 필요한 화면에서 바로 사용할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-[13px] text-[var(--tb-color-text-subtle)]">
              <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                내부 문서형 콘텐츠나 설정 패널에 적합합니다.
              </div>
            </CardContent>
          </Card>
        </SampleBlock>

        <SampleBlock
          title="TasteMeasurementMiniCta"
          description="분석, 예약, 프로필 화면에서 쓰이는 인라인 CTA 카드입니다."
          componentNames={["TasteMeasurementMiniCta"]}
          source="src/components/measurement/TasteMeasurementMiniCta.tsx"
        >
          <InspectableComponent
            componentName="TasteMeasurementMiniCta"
            onNavigate={onNavigateToSection}
            sectionId="appSpecific"
          >
            <TasteMeasurementMiniCta
              title="재측정으로 프로필 업데이트"
              description={`${accentLabel} 쪽 반응을 중심으로 다음 예약 전 빠르게 프로필을 점검할 수 있어요.`}
              meta="최근 측정 후 6일 경과"
              actionLabel="지금 측정하기"
              onAction={() => undefined}
              tone={ctaTone}
            />
          </InspectableComponent>
        </SampleBlock>
      </GallerySection>

      <GallerySection
        title="예약 카드"
        description="예약 화면에서 실제로 쓰이거나 바로 카드 컴포넌트로 승격할 수 있는 예약 관련 카드들입니다."
      >
        <SampleBlock
          title="예약 요약 카드"
          description="예약 리스트의 핵심 카드 패턴입니다."
          componentNames={["SectionCard", "StatusChip", "TasteChip"]}
          source="src/pages/ReservationPage.tsx / ReservationCard"
        >
          <SectionCard hoverEffect={false}>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <InspectableComponent
                  componentName="StatusChip"
                  onNavigate={onNavigateToSection}
                  sectionId="badges"
                >
                  <StatusChip color={statusColor} backgroundColor={statusBackgroundColor}>
                    {statusLabel}
                  </StatusChip>
                </InspectableComponent>
                <span className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">레스토랑 베누</span>
              </div>
              <ChevronRightIcon size={ICON_TOKENS.size.md} className="text-[var(--tb-color-icon-muted)]" />
            </div>

            <div className="flex w-full items-center gap-3">
              <img
                src={chefHwangJeongin}
                alt="황정인 셰프"
                className="h-[40px] w-[40px] rounded-[var(--tb-radius-8)] object-cover"
              />
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">황정인 셰프</span>
                <span className="text-[11px] text-[var(--tb-color-text-muted)]">매칭률 92%</span>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1">
                <CalendarIcon size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-text-faint)]" />
                <span className="text-[11px] text-[var(--tb-color-text-subtle)]">4월 4일 오후 7:30</span>
              </div>
              <div className="flex items-center gap-1">
                <UtensilsIcon size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-text-faint)]" />
                <span className="text-[11px] text-[var(--tb-color-text-subtle)]">시그니처 코스</span>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-2">
              <SparklesIcon size={ICON_TOKENS.size.sm} style={{ color: statusColor }} />
              <span className="text-[12px] text-[var(--tb-color-text-primary)]">다음 다이닝 전에 TCS 보정을 권장해요.</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <InspectableComponent
                componentName="TasteChip"
                onNavigate={onNavigateToSection}
                sectionId="badges"
              >
                <TasteChip taste={accentLabel} value="강조 예정" />
              </InspectableComponent>
              <InspectableComponent
                componentName="TasteChip"
                onNavigate={onNavigateToSection}
                sectionId="badges"
              >
                <TasteChip taste="감칠맛" value="부드럽게 연결" />
              </InspectableComponent>
            </div>
          </SectionCard>
        </SampleBlock>

        <SampleBlock
          title="예약 반영 요약 카드"
          description="예약 상세에서 현재 프로필이 어떻게 반영됐는지 설명하는 카드입니다."
          componentNames={["SectionCard", "OutlineBadge", "SectionTitle"]}
          source="src/pages/ReservationPage.tsx"
        >
          <SectionCard hoverEffect={false}>
            <div className="flex w-full items-start justify-between gap-3">
              <div>
                <InspectableComponent
                  componentName="OutlineBadge"
                  onNavigate={onNavigateToSection}
                  sectionId="badges"
                >
                  <OutlineBadge>현재 프로필 반영</OutlineBadge>
                </InspectableComponent>
                <SectionTitle className="mt-3">다음 코스 추천 방향</SectionTitle>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {accentLabel}은 현재 더 또렷하게 반응하는 포인트로 읽히고, 감칠맛은 한 번에 강하게 밀기보다 여유 있게 이어질 때 더 편안할 가능성이 있어요.
                </p>
              </div>
            </div>
            <div className="w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">셰프 가이드</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                첫 코스는 산뜻하게 열고, 메인에서는 {accentLabel} 쪽 인상이 과해지지 않도록 밸런스를 잡는 구성이 현재 더 잘 맞습니다.
              </p>
            </div>
          </SectionCard>
        </SampleBlock>
      </GallerySection>

      <GallerySection
        title="프로필 카드"
        description="프로필 화면에서 반복되는 정보 카드, 통계 카드, 셰프 카드, 설정 카드 패턴입니다."
      >
        <SampleBlock
          title="기기 상태 카드"
          description="기기 연결 상태와 마지막 측정을 보여주는 프로필 대표 카드입니다."
          componentNames={["SectionCard"]}
          source="src/pages/ProfilePage.tsx"
        >
          <SectionCard hoverEffect={false}>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)]">
                  <span className="text-[10px] font-bold text-[var(--tb-color-text-inverse)]">TB</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">테이스틱</span>
                  <span className="text-[11px] text-[var(--tb-color-text-muted)]">Teastick Pro</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <BluetoothIcon size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-primary)]" />
                  <span className="text-[11px] font-medium text-[var(--tb-color-text-secondary)]">연결됨</span>
                </div>
                <div className="flex items-center gap-1">
                  <BatteryFullIcon size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-primary)]" />
                  <span className="text-[11px] font-medium text-[var(--tb-color-text-secondary)]">87%</span>
                </div>
              </div>
            </div>
            <div className="h-px w-full bg-[var(--tb-color-border-strong)]" />
            <div className="flex w-full items-center justify-between">
              <span className="text-[12px] text-[var(--tb-color-text-muted)]">마지막 측정</span>
              <span className="text-[12px] font-medium text-[var(--tb-color-text-primary)]">2026.03.15</span>
            </div>
          </SectionCard>
        </SampleBlock>

        <SampleBlock
          title="활동 통계 타일"
          description="프로필 요약 숫자를 2열 타일 카드로 보여주는 패턴입니다."
          componentNames={["SectionCard"]}
          source="src/pages/ProfilePage.tsx"
        >
          <div className="grid grid-cols-2 gap-3">
            {activityStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <SectionCard key={stat.label} hoverEffect={false}>
                  <div className="flex w-full items-center gap-2">
                    <div
                      className="flex h-[40px] w-[40px] items-center justify-center rounded-[var(--tb-radius-10)]"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <Icon size={ICON_TOKENS.size.md} strokeWidth={1.5} style={{ color: stat.color }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[var(--tb-color-text-muted)]">{stat.label}</span>
                      <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{stat.value}</span>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        </SampleBlock>

        <SampleBlock
          title="즐겨찾기 셰프 행"
          description="프로필에서 쓰는 셰프 리스트 아이템 조합입니다. 별도 카드 컴포넌트가 아니라 SectionCard와 Avatar의 조합으로 유지합니다."
          componentNames={["SectionCard", "ChefAvatar"]}
          source="src/pages/ProfilePage.tsx"
        >
          <div className="grid gap-3">
            {favoriteChefs.slice(0, 2).map((chef) => (
              <SectionCard key={chef.name} hoverEffect={false}>
                <div className="flex w-full items-center gap-3">
                  <img
                    src={chef.image}
                    alt={chef.name}
                    className="h-[40px] w-[40px] rounded-[var(--tb-radius-10)] object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{chef.name}</span>
                    <span className="text-[11px] text-[var(--tb-color-text-muted)]">{chef.restaurant}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{chef.matchRate}%</span>
                  <ChevronRightIcon size={ICON_TOKENS.size.md} className="text-[var(--tb-color-icon-muted)]" />
                </div>
              </SectionCard>
            ))}
          </div>
        </SampleBlock>

        <SampleBlock
          title="미각 틴트 카드"
          description="하단 미각 칩으로 한 장의 카드를 바꿔보는 정사각형 미각 해석 카드입니다."
          componentNames={["TasteTintCard", "TasteChip"]}
          source="src/components/system/TasteTintCard.tsx"
          footer={
            <TasteTintCardPreviewChips
              activeTasteId={activeTasteTintId}
              onChange={setActiveTasteTintId}
              ringOffsetClassName="focus-visible:ring-offset-[var(--tb-color-surface-card)]"
            />
          }
        >
          <div className="flex justify-center">
            <TasteTintCardPreviewCard activeTasteId={activeTasteTintId} />
          </div>
        </SampleBlock>

        <SampleBlock
          title="카드 가로 스크롤 리스트"
          description="셰프 매칭과 세부 분석처럼 가로로 탐색하는 카드 스트립을 위한 공용 래퍼입니다."
          componentNames={["CardScrollList"]}
          source="src/components/system/CardScrollList.tsx"
        >
          <CardScrollList fullBleed={false}>
            {tasteTintScrollSamples.map((sample, index) => {
              const taste = TASTE_TOKENS[sample.tasteId];

              return (
                <TasteTintCard
                  key={`${sample.tasteId}-scroll`}
                  leading={
                    <span className="text-[16px] font-bold" style={{ color: taste.palette.dark }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  }
                  leadingClassName="bg-white/80"
                  description={sample.description}
                  detail={sample.detail}
                  tasteId={sample.tasteId}
                  title={sample.title}
                />
              );
            })}
          </CardScrollList>
        </SampleBlock>

        <SampleBlock
          title="설정 액션 카드"
          description="프로필 하단 설정 섹션에서 재사용 가능한 액션 카드입니다."
          componentNames={["SectionCard"]}
          source="src/pages/ProfilePage.tsx"
        >
          <div className="grid gap-3">
            {settingsItems.map((item) => {
              const Icon = item.icon;

              return (
                <SectionCard key={item.label} hoverEffect={false}>
                  <div className="flex w-full items-center gap-3">
                    <Icon size={ICON_TOKENS.size.md} className="shrink-0 text-[var(--tb-color-icon-primary)]" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{item.label}</span>
                      <span className="text-[11px] text-[var(--tb-color-text-muted)]">{item.desc}</span>
                    </div>
                    <ChevronRightIcon size={ICON_TOKENS.size.md} className="text-[var(--tb-color-icon-muted)]" />
                  </div>
                </SectionCard>
              );
            })}
          </div>
        </SampleBlock>
      </GallerySection>

      <GallerySection
        title="피드백·보정 카드"
        description="식후 피드백과 빠른 보정 플로우에서 실제로 쓰이는 카드 패턴을 모두 모았습니다."
      >
        <SampleBlock
          title="피드백 요약 히어로 카드"
          description="피드백 결과를 가장 먼저 전달하는 대표 카드입니다."
          componentNames={["SectionCard"]}
          previewBackgroundClass="bg-[var(--tb-color-surface-base)]"
          source="src/components/reservation/DiningFeedbackFlow.tsx"
        >
          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-2">
                <div>
                  <h1 className="text-[18px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                    프로필이 업데이트됐습니다
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    다음 예약 추천에 반영할 수 있는 최신 프로필이 준비됐어요.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-base)] px-4 py-4">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">이번 피드백의 핵심</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                잘 맞은 인상과 남은 마찰이 함께 반영되면서, 다음 예약은 더 자연스럽게 맞출 수 있는 방향으로 정리됐어요.
              </p>
            </div>
          </SectionCard>
        </SampleBlock>

        <SampleBlock
          title="변화 노트 카드"
          description="피드백 후 달라진 포인트를 한 장씩 설명하는 카드입니다."
          componentNames={["SectionCard"]}
          source="src/components/reservation/DiningFeedbackFlow.tsx"
        >
          <div className="grid gap-3">
            {[
              {
                body: `${accentLabel} 포인트는 더 분명하게 반응하고, 짠맛은 후반부에 정리될 때 안정적으로 느껴졌어요.`,
                iconClass: "bg-[var(--tb-taste-sweet-bg)] text-[var(--tb-taste-sweet-main)]",
                title: "현재 더 또렷해진 포인트",
              },
              {
                body: "메인 코스는 감칠맛을 한 번에 강하게 밀기보다 여유 있게 이어지는 구성이 더 자연스럽습니다.",
                iconClass: "bg-[var(--tb-taste-salty-bg)] text-[var(--tb-taste-salty-main)]",
                title: "다음 예약 반영 힌트",
              },
            ].map((item) => (
              <SectionCard key={item.title} hoverEffect={false}>
                <div className="flex items-start gap-3">
                  <CardIconBox className={item.iconClass}>
                    <SparklesIcon size={ICON_TOKENS.size.md} />
                  </CardIconBox>
                  <div className="flex flex-col gap-1">
                    <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">{item.title}</p>
                    <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-tertiary)]">{item.body}</p>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        </SampleBlock>

        <SampleBlock
          title="Confidence 단계 카드"
          description="현재 프로필 단계와 다음 진화 단계를 설명하는 카드입니다."
          componentNames={["SectionCard"]}
          source="src/components/reservation/DiningFeedbackFlow.tsx"
        >
          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">Confidence</p>
                <h2 className="mt-2 text-[18px] font-bold text-[var(--tb-color-text-primary)]">
                  반복될수록 더 선명해지는 Building Profile 단계예요
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { caption: "첫 측정 기반", label: "Starter" },
                  { caption: "반복 학습 중", label: "Building" },
                  { caption: "충분히 안정화", label: "Refined" },
                ].map((step, index) => (
                  <div
                    key={step.label}
                    className={`rounded-[16px] border px-3 py-3 ${index === 1
                      ? "border-[var(--tb-color-text-secondary)] bg-[var(--tb-color-surface-muted)]"
                      : "border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)]"
                      }`}
                  >
                    <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{step.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">{step.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </SampleBlock>

        <SampleBlock
          title="셰프용 요약 카드"
          description="셰프가 빠르게 읽을 수 있는 현재 프로필 요약 카드입니다."
          componentNames={["SectionCard", "TasteChip"]}
          previewBackgroundClass="bg-[var(--tb-color-surface-base)]"
          source="src/components/reservation/DiningFeedbackFlow.tsx"
        >
          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex items-start gap-3">
              <CardIconBox className="bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
                <UtensilsIcon size={ICON_TOKENS.size.md} />
              </CardIconBox>
              <div className="flex flex-col gap-1">
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">셰프용 현재 요약</p>
                <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-tertiary)]">
                  {accentLabel}처럼 강하게 느껴진 포인트는 겹치지 않게 정리하고, 감칠맛처럼 짧게 남은 포인트는 더 자연스럽게 이어지는 방향이 현재 가장 잘 맞는 흐름입니다.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <InspectableComponent
                    componentName="TasteChip"
                    onNavigate={onNavigateToSection}
                    sectionId="badges"
                  >
                    <TasteChip taste={accentLabel} />
                  </InspectableComponent>
                  <InspectableComponent
                    componentName="TasteChip"
                    onNavigate={onNavigateToSection}
                    sectionId="badges"
                  >
                    <TasteChip taste="감칠맛" />
                  </InspectableComponent>
                </div>
              </div>
            </div>
          </SectionCard>
        </SampleBlock>

        <SampleBlock
          title="TCS 힌트 카드"
          description="질문 단계에서 현재 선택 맥락을 짧게 안내하는 카드입니다."
          componentNames={["SectionCard", "TCSHintCard"]}
          previewBackgroundClass="bg-[var(--tb-color-surface-base)]"
          source="src/components/system/TCSHintCard.tsx"
        >
          <SectionCard hoverEffect={false}>
            <div className="flex w-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                    현재 선택
                  </p>
                  <p className="mt-2 text-[16px] font-bold leading-[1.2] text-[var(--tb-color-text-primary)]">
                    기준보다 조금 더 산뜻한 쪽
                  </p>
                </div>
                <StatusChip tone="neutral">질문 2 / 6</StatusChip>
              </div>

              <TCSHintCard
                description="정답을 맞추는 과정이 아니라, 지금 더 자연스럽게 맞는 방향을 찾는 가벼운 보정 단계입니다."
                surface="nested"
              />
            </div>
          </SectionCard>
        </SampleBlock>

        <SampleBlock
          title="해석 카드"
          description="프로필 변화, 분석 인사이트, 셰프 번역 요약에 공통으로 쓰이는 짧은 해석 카드입니다. 필요하면 탭해 상세 drawer를 엽니다."
          componentNames={["InterpretationCard", "InterpretationDetailDrawer"]}
          source="src/components/system/InterpretationCard.tsx"
        >
          <div className="grid gap-3">
            <InterpretationCard
              accentColor={`var(--tb-taste-${accentTaste}-main)`}
              description={accentInterpretationSample.description}
              eyebrow={accentInterpretationSample.eyebrow}
              supportingText="탭하면 다음 식사에 어떻게 이어지는지 상세 해석을 볼 수 있어요."
              onExpand={() => openInterpretationDrawer(accentInterpretationSample)}
            />
            <InterpretationCard
              description={chefTranslationInterpretation.description}
              eyebrow={chefTranslationInterpretation.eyebrow}
              indicatorBackground={chefTranslationInterpretation.indicatorBackground}
              onExpand={() => openInterpretationDrawer(chefTranslationInterpretation)}
            />
          </div>
        </SampleBlock>

        <SampleBlock
          title="스타터 프로필 결과 카드"
          description="빠른 보정 완료 후 현재 프로필을 해석해 주는 카드입니다."
          componentNames={["SectionCard", "TasteChip"]}
          source="src/pages/QuickTasteCalibrationScreen.tsx"
        >
          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">현재 프로필 해석</p>
                <h2 className="mt-2 text-[18px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
                  {accentLabel}이 먼저 열리고 짠맛이 뒤에서 정리되는 흐름
                </h2>
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                지금의 응답을 바탕으로 만든 시작 프로필입니다. 예약과 식후 피드백이 쌓일수록 더 잘 맞는 다이닝으로 정교해집니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <InspectableComponent
                  componentName="TasteChip"
                  onNavigate={onNavigateToSection}
                  sectionId="badges"
                >
                  <TasteChip taste={accentLabel} value="현재 반응이 빠른 포인트" />
                </InspectableComponent>
                <InspectableComponent
                  componentName="TasteChip"
                  onNavigate={onNavigateToSection}
                  sectionId="badges"
                >
                  <TasteChip taste="감칠맛" value="천천히 이어지는 포인트" />
                </InspectableComponent>
              </div>
            </div>
          </SectionCard>
        </SampleBlock>

        <SampleBlock
          title="보정 단서 카드"
          description="선택한 답변이 현재 프로필에 어떻게 반영됐는지 설명하는 카드입니다."
          componentNames={["SectionCard"]}
          source="src/pages/QuickTasteCalibrationScreen.tsx"
        >
          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
                Texture Preference
              </p>
              <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">
                부드럽게 녹는 질감이 더 자연스러워요
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                지방감이 무겁게 오래 남기보다, 부드럽게 연결될 때 더 편안하게 느끼는 현재 경향으로 반영됩니다.
              </p>
            </div>
          </SectionCard>
        </SampleBlock>
      </GallerySection>

      <InterpretationDetailDrawer
        interpretation={activeInterpretation}
        open={isInterpretationDrawerOpen}
        onOpenChange={setIsInterpretationDrawerOpen}
      />
    </div>
  );
}
