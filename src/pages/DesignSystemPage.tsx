import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ElementType } from "react";

import {
  CirclePlus as CirclePlusIcon,
  Bell as BellIcon,
  CalendarCheck as CalendarCheckIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  UserRound as UserRoundIcon,
  BatteryFull as BatteryFullIcon,
  Bluetooth as BluetoothIcon,
  Calendar as CalendarIcon,
  CircleCheck as CircleCheckIcon,
  Clock as ClockIcon,
  Filter as FilterIcon,
  Utensils as UtensilsIcon,
  List as ListIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Sparkles as SparklesIcon,
  Star as StarIcon,
  MessageCircle as MessageCircleIcon,
  RefreshCw as RefreshCwIcon,
  SlidersHorizontal as SlidersHorizontalIcon
} from 'lucide-react';

import AppMenuDrawer from "../components/AppMenuDrawer";
import BottomTabBar, { type TabType } from "../components/BottomTabBar";
import AnchoredFlowCtaPreview from "../components/design-system/AnchoredFlowCtaPreview";
import CardGallery from "../components/design-system/CardGallery";
import ComponentStyleSpecCard from "../components/design-system/ComponentStyleSpecCard";
import CurrentHomeCardArchive from "../components/design-system/CurrentHomeCardArchive";
import LegacyHomeCardArchive from "../components/design-system/LegacyHomeCardArchive";
import PlaygroundSection, {
  PlaygroundLiveControlsDock,
  PlaygroundLiveControlsProvider,
} from "../components/design-system/PlaygroundSection";
import PreviewableSourceText, { SourceFileLink } from "../components/design-system/PreviewableSourceText";
import AnalysisTabIcon from "../components/system/AnalysisTabIcon";
import HomeTabIcon from "../components/system/HomeTabIcon";
import {
  getFilePreviewEntries,
  type FilePreviewEntry,
} from "../components/design-system/filePreviewRegistry";
import {
  buildComponentCodexPrompt,
  buildComponentStyleSnippet,
  COMPONENT_STYLE_SPECS,
  type ComponentStyleSpec,
} from "../components/design-system/componentStyleSpecs";
import {
  AUDIT_SUMMARY,
  COLOR_GROUPS,
  CURRENTLY_USED_COMPONENTS,
  ICON_RULES,
  INCONSISTENCIES,
  PLAYGROUND_DEFAULTS,
  PLAYGROUND_SECTION_SOURCES,
  RADIUS_ITEMS,
  SHADOW_ITEMS,
  SOURCE_REFERENCES,
  SPACING_ITEMS,
  STYLE_STRUCTURE,
  TODO_ITEMS,
  TYPOGRAPHY_SPECS,
  UNUSED_UI_PRIMITIVES,
} from "../components/design-system/inventory";
import TasteMeasurementMiniCta from "../components/measurement/TasteMeasurementMiniCta";
import NotificationPanel from "../components/NotificationPanel";
import SectionCard from "../components/SectionCard";
import TopAppBar from "../components/TopAppBar";
import EmptyState from "../components/system/EmptyState";
import Chip, {
  type ChipSize,
  type ChipTone,
  type ChipVariant,
} from "../components/system/Chip";
import TCSBadge from "../components/system/TCSBadge";
import OutlineBadge from "../components/system/OutlineBadge";
import PrimaryButton from "../components/system/PrimaryButton";
import SelectionCard from "../components/system/SelectionCard";
import SectionTitle from "../components/system/SectionTitle";
import StepBadge from "../components/system/StepBadge";
import StepIndicator from "../components/system/StepIndicator";
import StatusChip from "../components/system/StatusChip";
import TasteChip from "../components/system/TasteChip";
import PalateBloomAvatar, {
  getPalateBloomShapeCounts,
  PALATE_BLOOM_SHAPE_COUNT_LIMITS,
  type PalateBloomCoreShape,
  type PalateBloomPetalShape,
  type PalateBloomStarShape,
} from "../components/system/PalateBloomAvatar";
import PalateSignatureAvatar, {
  type PalateSignatureAvatarVariant,
  type TasteProfile as PalateSignatureTasteProfile,
} from "../components/system/PalateSignatureAvatar";
import PalateOrbAvatar from "../components/system/PalateOrbAvatar";
import {
  PROFILE_AVATAR_SIZE_KEYS,
  PROFILE_AVATAR_SIZE_TOKENS,
  type ProfileAvatarSize,
} from "../components/system/profileAvatarSizeTokens";
import TasteProfileAvatar, {
  createTasteProfileAvatarInitials,
} from "../components/system/TasteProfileAvatar";
import TastePointArrowBox, {
  TASTE_POINT_ARROW_BOX_DIRECTION_TOKENS,
  TASTE_POINT_ARROW_BOX_SIZE_TOKENS,
  type TastePointArrowBoxSize,
  type TastePointArrowBoxTrend,
} from "../components/system/TastePointArrowBox";
import ToastSurface from "../components/system/ToastSurface";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Progress } from "../components/ui/progress";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Skeleton } from "../components/ui/skeleton";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { cn } from "../components/ui/utils";
import { COLOR_TOKENS, ICON_TOKENS, SHADOW_TOKENS, TASTE_TOKENS, type TasteId } from "../constants/designTokens";
import {
  createTasteMeasurementSnapshot,
  type TasteMeasurementResults,
} from "../constants/tasteMeasurementData";
import { getTasteTint } from "../constants/tasteColors";
import {
  buildDesignSystemCssSnippet,
  buildDesignTokensTsSnippet,
  DESIGN_TOKEN_RUNTIME_DEFAULTS,
  applyDesignTokenRuntimeState,
  clearAppliedDesignTokenRuntimeState,
  clearPersistedDesignTokenRuntimeState,
  countDesignTokenRuntimeDifferences,
  loadPersistedDesignTokenRuntimeState,
  persistDesignTokenRuntimeState,
  type DesignTokenRuntimeState,
} from "../lib/designTokenRuntime";
import { type AppNotification } from "../lib/notificationsSupabase";
import ImproveAccuracyScreen from "./ImproveAccuracyScreen";
import ReservationConfirmationScreen from "./ReservationConfirmationScreen";

type ButtonFamily = "system" | "generic";
type ButtonState = "default" | "active" | "disabled" | "loading";
type GenericBadgeVariant = "default" | "secondary" | "outline" | "destructive";
type GenericButtonVariant = "default" | "secondary" | "outline" | "destructive" | "ghost" | "link";
type GenericButtonSize = "default" | "sm" | "lg" | "icon";
type AppStatus = "upcoming" | "preparing" | "ready" | "completed";

const SECTION_NAV = [
  { id: "audit", label: "점검" },
  { id: "components", label: "컴포넌트" },
  { id: "colors", label: "컬러" },
  { id: "typography", label: "타이포" },
  { id: "spacing", label: "간격" },
  { id: "shadows", label: "그림자" },
  { id: "icons", label: "아이콘" },
  { id: "buttons", label: "버튼" },
  { id: "badges", label: "칩 / 배지" },
  { id: "fields", label: "필드" },
  { id: "cards", label: "카드" },
  { id: "navigation", label: "내비게이션" },
  { id: "feedback", label: "피드백" },
  { id: "overlay", label: "오버레이" },
  { id: "appSpecific", label: "앱 전용" },
  { id: "componentSpecs", label: "스타일값" },
  { id: "auditNotes", label: "메모" },
] as const;

type SectionId = (typeof SECTION_NAV)[number]["id"];

const COMPONENT_ARCHITECTURE_GROUPS = [
  {
    id: "actionsFlow",
    title: "액션 & 플로우",
    description: "CTA, 진행 헤더, step feedback처럼 사용자를 다음 단계로 밀어주는 컴포넌트들입니다.",
    components: [
      "PrimaryButton",
      "FlowBottomCta",
      "FlowStepCta",
      "FlowHeaderBlock",
      "CalibrationQuestionHeader",
      "StepIndicator",
      "StepBadge",
    ],
  },
  {
    id: "statusLabels",
    title: "상태 & 라벨",
    description: "상태, 단계, taste 포인트를 짧고 빠르게 읽히게 하는 마이크로 컴포넌트들입니다.",
    components: [
      "TCSBadge",
      "Chip",
      "OutlineBadge",
      "StatusChip",
      "TasteChip",
      "TasteProfileAvatar",
      "PalateSignatureAvatar",
      "PalateBloomAvatar",
      "PalateOrbAvatar",
      "TastePointArrowBox",
      "ToastSurface",
    ],
  },
  {
    id: "inputsSelection",
    title: "입력 & 선택",
    description: "폼 프리미티브와 선택형 카드처럼 답변을 수집하는 컴포넌트들입니다.",
    components: [
      "SelectionCard",
      "Input",
      "Textarea",
      "Select",
      "Checkbox",
      "RadioGroup",
      "Switch",
    ],
  },
  {
    id: "cardsInterpretation",
    title: "카드 & 해석",
    description: "프로필 요약, 시각화, empty state, 상세 해석처럼 의미를 설명하는 서피스 컴포넌트들입니다.",
    components: [
      "SectionCard",
      "PageSection",
      "ReservationCard",
      "CardDetailLabel",
      "InterpretationCard",
      "InterpretationDetailDrawer",
      "HexRadarChart",
      "TasteLineChart",
      "TasteAxisMeter",
      "TasteTintCard",
      "TasteTintCardList",
      "CardScrollList",
      "ProfileConfidenceCard",
      "HospitalityEmptyState",
      "EmptyState",
      "TasteMeasurementMiniCta",
    ],
  },
  {
    id: "navigationShell",
    title: "내비게이션 셸",
    description: "앱 화면 이동과 상단/하단 셸 구조를 담당하는 컴포넌트들입니다.",
    components: [
      "TopAppBar",
      "BottomTabBar",
      "Tabs",
    ],
  },
  {
    id: "overlayLayers",
    title: "오버레이 레이어",
    description: "내비게이션 위에서 열리는 제품 전용 패널과 generic overlay primitive를 함께 묶었습니다.",
    components: [
      "BottomSheetShell",
      "NotificationPanel",
      "AppMenuDrawer",
      "Dialog",
      "Sheet",
      "Popover",
      "Tooltip",
    ],
  },
  {
    id: "screenComposites",
    title: "스크린 & 플로우 패널",
    description: "feature 흐름을 실제 화면 단위로 묶는 복합 컴포넌트들입니다.",
    components: [
      "TasteMeasurementChecklistPanel",
      "TasteMeasurementIntroPanel",
      "TasteMeasurementPreparationPanel",
      "TasteMeasurementActivePanel",
      "TasteMeasurementCompletedPanel",
      "ImproveAccuracyScreen",
      "ReservationConfirmationScreen",
      "DiningFeedbackFlow",
    ],
  },
] as const;

const BUTTON_SECTION_FILE_PREVIEWS = [
  "src/components/system/FlowHeaderBlock.tsx",
  "src/components/measurement/CalibrationQuestionHeader.tsx",
] as const;

const CARD_SECTION_FILE_PREVIEWS = [
  "src/components/system/PageSection.tsx",
  "src/components/system/CardDetailLabel.tsx",
  "src/components/system/InterpretationDetailDrawer.tsx",
  "src/components/system/HexRadarChart.tsx",
  "src/components/system/TasteLineChart.tsx",
  "src/components/system/TasteTintCard.tsx",
  "src/components/system/TasteTintCardList.tsx",
  "src/components/system/CardScrollList.tsx",
  "src/components/system/ProfileConfidenceCard.tsx",
  "src/components/system/HospitalityEmptyState.tsx",
] as const;

const APP_SPECIFIC_SECTION_FILE_PREVIEWS = [
  "src/components/measurement/TasteMeasurementChecklistPanel.tsx",
  "src/components/measurement/TasteMeasurementIntroPanel.tsx",
  "src/components/measurement/TasteMeasurementPreparationPanel.tsx",
  "src/components/measurement/TasteMeasurementActivePanel.tsx",
  "src/components/measurement/TasteMeasurementCompletedPanel.tsx",
] as const;

const OVERLAY_SECTION_FILE_PREVIEWS = [
  "src/components/system/BottomSheetShell.tsx",
] as const;

const COMPONENT_ARCHITECTURE_COUNT = COMPONENT_ARCHITECTURE_GROUPS.reduce(
  (count, group) => count + group.components.length,
  0,
);

const GENERIC_BUTTON_VARIANTS: GenericButtonVariant[] = [
  "default",
  "secondary",
  "outline",
  "destructive",
  "ghost",
  "link",
];

function getNotificationPanelPreviewNotifications(): AppNotification[] {
  const now = Date.now();

  return [
    {
      id: "preview-notification-guidance-ready",
      type: "guidance_ready",
      title: "셰프 가이드 준비",
      body: "예약 프로필이 셰프가 참고할 수 있는 보정 가이드로 정리되었습니다.",
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "preview-notification-follower-added",
      type: "follower_added",
      title: "새 팔로워",
      body: "민서님이 당신의 다이닝 기록을 팔로우하기 시작했습니다.",
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "preview-notification-reservation-confirmed",
      type: "reservation_confirmed",
      title: "예약 개인화 진행",
      body: "다음 다이닝을 위해 현재 프로필 기준의 개인화 준비가 시작되었습니다.",
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "preview-notification-feedback-request",
      type: "feedback_request",
      title: "식후 피드백 반영",
      body: "남긴 피드백이 다음 다이닝 기준을 더 섬세하게 만드는 데 쓰입니다.",
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];
}
const GENERIC_BADGE_VARIANTS: GenericBadgeVariant[] = [
  "default",
  "secondary",
  "outline",
  "destructive",
];
const CHIP_SIZES: ChipSize[] = ["xs", "sm", "md"];
const CHIP_VARIANTS: ChipVariant[] = ["soft", "outline", "solid", "text"];
const CHIP_TONES: ChipTone[] = ["neutral", "success", "warning", "accent"];
const GENERIC_BUTTON_SIZES: GenericButtonSize[] = ["default", "sm", "lg", "icon"];
const TASTE_OPTIONS = Object.keys(TASTE_TOKENS) as TasteId[];
const AVATAR_TASTE_DEFAULTS: Record<TasteId, number> = {
  sweet: 8.5,
  sour: 7.2,
  bitter: 4.1,
  salty: 6.3,
  umami: 5.4,
  fat: 3.8,
};
const BLOOM_SHAPE_COUNT_DEFAULT = 4;
const BLOOM_PETAL_SHAPE_DEFAULT: PalateBloomPetalShape = "roundPetal";
const BLOOM_STAR_SHAPE_DEFAULT: PalateBloomStarShape = "thinStar";
const BLOOM_CORE_SHAPE_DEFAULT: PalateBloomCoreShape = "solidCore";
const BLOOM_PETAL_SHAPE_OPTIONS = [
  { value: "roundPetal", label: "roundPetal" },
  { value: "capsulePetal", label: "capsulePetal" },
  { value: "softDiamondPetal", label: "softDiamondPetal" },
  { value: "serratedTipPetal", label: "serratedTipPetal" },
] satisfies ReadonlyArray<{ value: PalateBloomPetalShape; label: string }>;
const BLOOM_STAR_SHAPE_OPTIONS = [
  { value: "thinStar", label: "thinStar" },
  { value: "roundedSpokeStar", label: "roundedSpokeStar" },
  { value: "dottedRayStar", label: "dottedRayStar" },
] satisfies ReadonlyArray<{ value: PalateBloomStarShape; label: string }>;
const BLOOM_CORE_SHAPE_OPTIONS = [
  { value: "solidCore", label: "solidCore" },
  { value: "diamondCore", label: "diamondCore" },
  { value: "seedCluster", label: "seedCluster" },
] satisfies ReadonlyArray<{ value: PalateBloomCoreShape; label: string }>;
const PALATE_SIGNATURE_LIVE_PREVIEWS = [
  { initials: "S", size: "sm", variant: "soft" },
  { initials: "M", size: "md", variant: "soft" },
  { initials: "L", size: "lg", variant: "soft" },
  { initials: "XL", size: "xl", variant: "soft" },
] satisfies ReadonlyArray<{
  initials: string;
  size: ProfileAvatarSize;
  variant: PalateSignatureAvatarVariant;
}>;
const GENERIC_BADGE_VARIANT_LABELS: Record<GenericBadgeVariant, string> = {
  default: "기본",
  secondary: "보조",
  outline: "아웃라인",
  destructive: "위험",
};
const CHIP_SIZE_LABELS: Record<ChipSize, string> = {
  xs: "XS",
  sm: "SM",
  md: "MD",
};
const CHIP_VARIANT_LABELS: Record<ChipVariant, string> = {
  soft: "Soft",
  outline: "Outline",
  solid: "Solid",
  text: "Text",
};
const CHIP_TONE_LABELS: Record<ChipTone, string> = {
  neutral: "Neutral",
  success: "Success",
  warning: "Warning",
  accent: "Accent",
};
const TASTE_POINT_ARROW_BOX_SIZE_GROUPS: ReadonlyArray<{
  size: TastePointArrowBoxSize;
  tastes: readonly TasteId[];
}> = [
    { size: "sm", tastes: ["sweet", "sour"] },
    { size: "md", tastes: ["bitter", "salty"] },
    { size: "lg", tastes: ["umami", "fat"] },
  ];
const TASTE_POINT_ARROW_BOX_SIZE_PREVIEW_ITEMS = TASTE_POINT_ARROW_BOX_SIZE_GROUPS.flatMap((group) =>
  group.tastes.map((tasteId, index) => ({
    size: group.size,
    tasteId,
    trend: (index === 0 ? "increase" : "decrease") as Exclude<TastePointArrowBoxTrend, "neutral">,
  })),
);
const TASTE_POINT_ARROW_BOX_DIRECTION_LABELS: Record<TastePointArrowBoxTrend, string> = {
  increase: "상향",
  decrease: "하향",
  neutral: "중립",
};
const GENERIC_BUTTON_VARIANT_LABELS: Record<GenericButtonVariant, string> = {
  default: "기본",
  secondary: "보조",
  outline: "아웃라인",
  destructive: "위험",
  ghost: "고스트",
  link: "링크",
};
const GENERIC_BUTTON_SIZE_LABELS: Record<GenericButtonSize, string> = {
  default: "기본",
  sm: "작게",
  lg: "크게",
  icon: "아이콘",
};
const APP_TAB_LABELS: Record<TabType, string> = {
  home: "홈",
  analysis: "분석",
  reservation: "예약",
  profile: "프로필",
};
const SEGMENTED_TAB_LABELS = {
  overview: "개요",
  tokens: "토큰",
  patterns: "패턴",
} as const;
const ACCENT_PALETTE_LABELS = {
  main: "메인",
  dark: "진한 톤",
  light: "밝은 톤",
  bg: "배경 톤",
} as const;

const STATUS_CONFIG: Record<AppStatus, { bg: string; color: string; label: string }> = {
  upcoming: {
    label: "예약 확정",
    color: "var(--tb-color-text-secondary)",
    bg: "var(--tb-color-surface-muted)",
  },
  preparing: {
    label: "TCS 준비 중",
    color: "var(--tb-color-text-secondary)",
    bg: "var(--tb-color-surface-muted)",
  },
  ready: {
    label: "준비 완료",
    color: "var(--tb-color-text-primary)",
    bg: "var(--tb-color-surface-muted)",
  },
  completed: {
    label: "완료",
    color: "var(--tb-color-text-disabled)",
    bg: "var(--tb-color-surface-muted)",
  },
};

const wrapLucideIcon = (IconComponent: ElementType) => {
  return ({ size, fontSize, style, ...props }: any) => (
    <IconComponent
      {...props}
      style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }}
    />
  );
};

const appIcons = [
  { name: "Home", library: "Custom SVG", Component: wrapLucideIcon(HomeTabIcon) },
  { name: "Analysis", library: "Custom SVG", Component: wrapLucideIcon(AnalysisTabIcon) },
  { name: "CalendarCheck", library: "Lucide", Component: wrapLucideIcon(CalendarCheckIcon) },
  { name: "UserRound", library: "Lucide", Component: wrapLucideIcon(UserRoundIcon) },
  { name: "ChevronLeft", library: "Lucide", Component: wrapLucideIcon(ChevronLeftIcon) },
  { name: "ChevronRight", library: "Lucide", Component: wrapLucideIcon(ChevronRightIcon) },
  { name: "Info", library: "Lucide", Component: wrapLucideIcon(InfoIcon) },
  { name: "Bell", library: "Lucide", Component: wrapLucideIcon(BellIcon) },
  { name: "CirclePlus", library: "Lucide", Component: wrapLucideIcon(CirclePlusIcon) },
  { name: "Menu", library: "Lucide", Component: wrapLucideIcon(MenuIcon) },
];

const lucidePreviewIcons = [
  { name: "RefreshCw", library: "Lucide", Component: wrapLucideIcon(RefreshCwIcon) },
  { name: "Sparkles", library: "Lucide", Component: wrapLucideIcon(SparklesIcon) },
  { name: "Utensils", library: "Lucide", Component: wrapLucideIcon(UtensilsIcon) },
  { name: "List", library: "Lucide", Component: wrapLucideIcon(ListIcon) },
  { name: "CircleCheck", library: "Lucide", Component: wrapLucideIcon(CircleCheckIcon) },
  { name: "Settings", library: "Lucide", Component: wrapLucideIcon(SettingsIcon) },
  { name: "Bluetooth", library: "Lucide", Component: wrapLucideIcon(BluetoothIcon) },
  { name: "BatteryFull", library: "Lucide", Component: wrapLucideIcon(BatteryFullIcon) },
  { name: "Search", library: "Lucide", Component: wrapLucideIcon(SearchIcon) },
  { name: "Star", library: "Lucide", Component: wrapLucideIcon(StarIcon) },
  { name: "Calendar", library: "Lucide", Component: wrapLucideIcon(CalendarIcon) },
  { name: "MessageCircle", library: "Lucide", Component: wrapLucideIcon(MessageCircleIcon) },
];

const ICON_PREVIEW_SIZE = {
  size: ICON_TOKENS.size.md,
  container: ICON_TOKENS.container.md,
} as const;

const ICON_SIZE_RULES = [
  {
    id: "s",
    label: "S",
    size: ICON_TOKENS.size.sm,
    container: ICON_TOKENS.container.sm,
    usage: "보조 정보, 리스트 보조 표시, 밀도 높은 행 안의 서브 액션",
  },
  {
    id: "m",
    label: "M",
    size: ICON_TOKENS.size.md,
    container: ICON_TOKENS.container.md,
    usage: "기본 액션, 검색 결과 액션, 대부분의 일반 카드/리스트 아이콘",
  },
  {
    id: "l",
    label: "L",
    size: ICON_TOKENS.size.lg,
    container: ICON_TOKENS.container.lg,
    usage: "back/close, 탭 아이콘, 기간 이동, 더 강한 네비게이션 버튼",
  },
] as const;

const TCS_BADGE_EXAMPLES = [
  [{ taste: "단맛", change: "+12%" }],
  [
    { taste: "단맛", change: "+20%" },
    { taste: "감칠맛", change: "+5%" },
  ],
  [
    { taste: "신맛", change: "+10%" },
    { taste: "지방맛", change: "+6%" },
    { taste: "쓴맛", change: "+3%" },
  ],
] as const;

function TCSBadgeStateGroup({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const CURRENTLY_USED_COMPONENT_STYLE_SPECS = COMPONENT_STYLE_SPECS.filter(
  (spec) => spec.status === "currently-used",
);
const DEFINED_COMPONENT_STYLE_SPECS = COMPONENT_STYLE_SPECS.filter(
  (spec) => spec.status === "defined-but-unused",
);

function SectionEyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
      {children}
    </span>
  );
}

function ControlBlock({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <label className="min-w-0 text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{label}</label>
        {hint ? (
          <span className="shrink-0 text-[11px] text-[var(--tb-color-text-muted)]">{hint}</span>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SliderControl({
  label,
  max,
  min,
  onChange,
  step = 1,
  unit = "px",
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  unit?: string;
  value: number;
}) {
  return (
    <ControlBlock label={label} hint={`${value}${unit}`}>
      <div className="w-full max-w-full min-w-0 overflow-hidden px-2 py-1">
        <Slider
          className="min-w-0 max-w-full"
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={(values) => onChange(values[0] ?? value)}
        />
      </div>
    </ControlBlock>
  );
}

function ColorControl({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <ControlBlock label={label} hint={value}>
      <div className="flex items-center gap-3">
        <input
          className="h-10 w-14 cursor-pointer rounded-[12px] border border-[var(--tb-color-border-default)] bg-transparent p-1"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="min-w-0 flex-1 rounded-[12px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-2 font-mono text-[12px] text-[var(--tb-color-text-primary)]">
          {value}
        </div>
      </div>
    </ControlBlock>
  );
}

function SegmentedControl<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void;
  options: readonly { label: string; value: T }[];
  value: T;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
            option.value === value
              ? "border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-white"
              : "border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-subtle)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function StatusTag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "used" | "unused" | "note";
}) {
  const className =
    tone === "used"
      ? "border-[rgba(15,15,15,0.12)] bg-[rgba(15,15,15,0.06)] text-[var(--tb-color-text-primary)]"
      : tone === "unused"
        ? "border-[rgba(255,153,0,0.2)] bg-[rgba(255,153,0,0.12)] text-[#9A5E00]"
        : "border-[rgba(114,153,255,0.22)] bg-[rgba(114,153,255,0.12)] text-[#365FC8]";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", className)}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
  );
}

function ComponentPreviewUnit({
  children,
  hint,
  name,
}: {
  children: React.ReactNode;
  hint?: string;
  name: string;
}) {
  return (
    <div
      className="grid gap-2 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-3 py-3"
      data-component-preview={name}
    >
      <div>
        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{name}</p>
        {hint ? (
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">{hint}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

function resolveFilePreviewEntries(
  files: readonly string[],
  entries: FilePreviewEntry[],
) {
  return files
    .map((file) => entries.find((entry) => entry.file === file))
    .filter((entry): entry is FilePreviewEntry => entry !== undefined);
}

function FilePreviewCard({
  entry,
  previewCardClass,
}: {
  entry: FilePreviewEntry;
  previewCardClass: string;
}) {
  return (
    <div className={cn(previewCardClass, "p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
            {entry.definition.title}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {entry.definition.description}
          </p>
        </div>
        <SourceFileLink
          file={entry.file}
          label="원본"
          variant="chip"
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-[24px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)]">
        {entry.definition.render()}
      </div>
    </div>
  );
}

function ChipSizeSelector({
  activeSize,
  onChange,
}: {
  activeSize: ChipSize;
  onChange: (size: ChipSize) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIP_SIZES.map((size) => {
        const isActive = activeSize === size;

        return (
          <Chip
            key={size}
            asChild
            size={size}
            tone={isActive ? "accent" : "neutral"}
            variant={isActive ? "solid" : "soft"}
            className="cursor-pointer"
          >
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(size)}
            >
              {CHIP_SIZE_LABELS[size]}
            </button>
          </Chip>
        );
      })}
    </div>
  );
}

function findComponentPreviewTarget(componentName: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const exactMatch = Array.from(
    document.querySelectorAll<HTMLElement>('[data-component-preview]'),
  ).find((element) => element.dataset.componentPreview === componentName);

  if (exactMatch) {
    return exactMatch;
  }

  return (
    Array.from(
      document.querySelectorAll<HTMLElement>('[data-component-preview-list]'),
    ).find((element) => {
      const rawList = element.dataset.componentPreviewList;

      if (!rawList) {
        return false;
      }

      try {
        return (JSON.parse(rawList) as string[]).includes(componentName);
      } catch {
        return false;
      }
    }) ?? null
  );
}

function PhonePreviewFrame({
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

function InventoryCard({
  description,
  name,
  note,
  source,
  status,
}: {
  description?: string;
  name: string;
  note?: string;
  source: string;
  status?: "currently-used" | "defined-but-unused" | "defined-only";
}) {
  return (
    <div className="rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{name}</p>
          {description ? (
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              {description}
            </p>
          ) : null}
        </div>
        {status === "currently-used" ? <StatusTag tone="used">Currently used</StatusTag> : null}
        {status === "defined-but-unused" ? <StatusTag tone="unused">Defined but unused</StatusTag> : null}
        {status === "defined-only" ? <StatusTag tone="note">Defined only</StatusTag> : null}
      </div>
      {note ? (
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">{note}</p>
      ) : null}
      <p className="mt-3 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
        <PreviewableSourceText value={source} />
      </p>
    </div>
  );
}

function dedupeInventoryEntries<T extends { name: string }>(entries: readonly T[]) {
  const seenNames = new Set<string>();

  return entries.filter((entry) => {
    if (seenNames.has(entry.name)) {
      return false;
    }

    seenNames.add(entry.name);
    return true;
  });
}

export default function DesignSystemPage() {
  const initialRuntimeTokenState = useMemo(() => loadPersistedDesignTokenRuntimeState(), []);
  const previewableTsxFiles = useMemo(
    () => getFilePreviewEntries().filter((entry) => entry.file.endsWith(".tsx")),
    [],
  );
  const previewableScreenFiles = useMemo(
    () => previewableTsxFiles.filter((entry) => entry.file.startsWith("src/pages/")),
    [previewableTsxFiles],
  );
  const previewableAppComponentFiles = useMemo(
    () =>
      previewableTsxFiles.filter(
        (entry) =>
          entry.file.startsWith("src/components/") &&
          !entry.file.startsWith("src/components/ui/"),
      ),
    [previewableTsxFiles],
  );
  const previewableUiPrimitiveFiles = useMemo(
    () => previewableTsxFiles.filter((entry) => entry.file.startsWith("src/components/ui/")),
    [previewableTsxFiles],
  );
  const componentArchitectureGroups = COMPONENT_ARCHITECTURE_GROUPS;
  const buttonSectionPreviewEntries = useMemo(
    () => resolveFilePreviewEntries(BUTTON_SECTION_FILE_PREVIEWS, previewableAppComponentFiles),
    [previewableAppComponentFiles],
  );
  const cardSectionPreviewEntries = useMemo(
    () => resolveFilePreviewEntries(CARD_SECTION_FILE_PREVIEWS, previewableAppComponentFiles),
    [previewableAppComponentFiles],
  );
  const appSpecificSectionPreviewEntries = useMemo(
    () => resolveFilePreviewEntries(APP_SPECIFIC_SECTION_FILE_PREVIEWS, previewableAppComponentFiles),
    [previewableAppComponentFiles],
  );
  const overlaySectionPreviewEntries = useMemo(
    () => resolveFilePreviewEntries(OVERLAY_SECTION_FILE_PREVIEWS, previewableAppComponentFiles),
    [previewableAppComponentFiles],
  );
  const componentArchitectureCount = COMPONENT_ARCHITECTURE_COUNT;
  const currentlyUsedComponentEntries = useMemo(
    () =>
      dedupeInventoryEntries(
        CURRENTLY_USED_COMPONENTS.filter((item) =>
          item.source.startsWith("src/components/"),
        ),
      ),
    [],
  );
  const currentlyUsedScreenEntries = useMemo(
    () =>
      dedupeInventoryEntries(
        CURRENTLY_USED_COMPONENTS.filter((item) =>
          item.source.startsWith("src/pages/"),
        ),
      ),
    [],
  );
  const definedButUnusedPrimitiveEntries = useMemo(
    () =>
      dedupeInventoryEntries(
        UNUSED_UI_PRIMITIVES.filter((item) =>
          item.source.startsWith("src/components/ui/"),
        ),
      ),
    [],
  );

  const [background, setBackground] = useState(initialRuntimeTokenState.background);
  const [cardSurface, setCardSurface] = useState(initialRuntimeTokenState.cardSurface);
  const [primaryText, setPrimaryText] = useState(initialRuntimeTokenState.primaryText);
  const [bodyText, setBodyText] = useState(initialRuntimeTokenState.bodyText);
  const [border, setBorder] = useState(initialRuntimeTokenState.border);
  const [displaySize, setDisplaySize] = useState(initialRuntimeTokenState.displaySize);
  const [titleSize, setTitleSize] = useState(initialRuntimeTokenState.titleSize);
  const [bodySize, setBodySize] = useState(initialRuntimeTokenState.bodySize);
  const [captionSize, setCaptionSize] = useState(initialRuntimeTokenState.captionSize);
  const [fontWeight, setFontWeight] = useState(initialRuntimeTokenState.fontWeight);
  const [lineHeight, setLineHeight] = useState(initialRuntimeTokenState.lineHeight);
  const [cardRadius, setCardRadius] = useState(initialRuntimeTokenState.cardRadius);
  const [controlRadius, setControlRadius] = useState(initialRuntimeTokenState.controlRadius);
  const [gap, setGap] = useState(initialRuntimeTokenState.gap);
  const [sectionGap, setSectionGap] = useState(initialRuntimeTokenState.sectionGap);
  const [borderWidth, setBorderWidth] = useState(1);
  const [shadowKey, setShadowKey] = useState<keyof typeof SHADOW_TOKENS>(initialRuntimeTokenState.shadowKey);
  const [iconStroke, setIconStroke] = useState<number>(ICON_TOKENS.strokeWidth.regular);
  const [buttonFamily, setButtonFamily] = useState<ButtonFamily>("system");
  const [buttonState, setButtonState] = useState<ButtonState>("default");
  const [genericBadgeVariant, setGenericBadgeVariant] = useState<GenericBadgeVariant>("default");
  const [chipSize, setChipSize] = useState<ChipSize>("sm");
  const [chipVariant, setChipVariant] = useState<ChipVariant>("soft");
  const [chipTone, setChipTone] = useState<ChipTone>("neutral");
  const [genericButtonVariant, setGenericButtonVariant] = useState<GenericButtonVariant>("default");
  const [genericButtonSize, setGenericButtonSize] = useState<GenericButtonSize>("default");
  const [systemButtonCompact, setSystemButtonCompact] = useState(false);
  const [systemButtonFullWidth, setSystemButtonFullWidth] = useState(false);
  const [fieldDisabled, setFieldDisabled] = useState(false);
  const [fieldError, setFieldError] = useState(false);
  const [fieldFocus, setFieldFocus] = useState(true);
  const [fieldCheckbox, setFieldCheckbox] = useState(true);
  const [fieldSwitch, setFieldSwitch] = useState(true);
  const [fieldSelect, setFieldSelect] = useState("starter");
  const [fieldRadio, setFieldRadio] = useState("balanced");
  const [activeTab, setActiveTab] = useState<TabType>("analysis");
  const [showBack, setShowBack] = useState(false);
  const [showUnreadNotifications, setShowUnreadNotifications] = useState(true);
  const [genericTabsValue, setGenericTabsValue] = useState("overview");
  const [progress, setProgress] = useState(68);
  const [destructiveAlert, setDestructiveAlert] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [previewNotifications, setPreviewNotifications] = useState<AppNotification[]>(() =>
    getNotificationPanelPreviewNotifications(),
  );
  const [accentTaste, setAccentTaste] = useState<TasteId>(PLAYGROUND_DEFAULTS.accentTaste);
  const [avatarTasteValues, setAvatarTasteValues] =
    useState<Record<TasteId, number>>(AVATAR_TASTE_DEFAULTS);
  const [bloomShapeCount, setBloomShapeCount] = useState(BLOOM_SHAPE_COUNT_DEFAULT);
  const [bloomPetalShape, setBloomPetalShape] =
    useState<PalateBloomPetalShape>(BLOOM_PETAL_SHAPE_DEFAULT);
  const [bloomStarShape, setBloomStarShape] =
    useState<PalateBloomStarShape>(BLOOM_STAR_SHAPE_DEFAULT);
  const [bloomCoreShape, setBloomCoreShape] =
    useState<PalateBloomCoreShape>(BLOOM_CORE_SHAPE_DEFAULT);
  const [statusKey, setStatusKey] = useState<AppStatus>("preparing");
  const [ctaTone, setCtaTone] = useState<"neutral" | "alert">("alert");
  const [improveAccuracyStage, setImproveAccuracyStage] = useState<
    "Starter" | "Building" | "Refined"
  >("Building");
  const [confirmationPreviewKey, setConfirmationPreviewKey] = useState(0);
  const [appliedRuntimeTokenState, setAppliedRuntimeTokenState] =
    useState<DesignTokenRuntimeState>(initialRuntimeTokenState);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
  const [sectionJumpMenuOpen, setSectionJumpMenuOpen] = useState(false);
  const [liveControlsDockOpen, setLiveControlsDockOpen] = useState(true);
  const [activeLiveControlSectionId, setActiveLiveControlSectionId] = useState<SectionId | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const hashSectionId = window.location.hash.replace(/^#/, "") as SectionId;

    return SECTION_NAV.some((section) => section.id === hashSectionId) ? hashSectionId : null;
  });
  const [liveControlsPortalRootElement, setLiveControlsPortalRootElement] = useState<HTMLDivElement | null>(null);
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState<{
    message: string;
    tone: "note" | "success";
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const floatingMenuClusterRef = useRef<HTMLDivElement | null>(null);
  const floatingMenuPointerIntentRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startedOutside: boolean;
    moved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startedOutside: false,
    moved: false,
  });

  const accentPalette = TASTE_TOKENS[accentTaste].palette;
  const avatarMeasurementSnapshot = useMemo(
    () =>
      createTasteMeasurementSnapshot(
        TASTE_OPTIONS.reduce((results, tasteId) => {
          results[tasteId] = avatarTasteValues[tasteId];
          return results;
        }, {} as TasteMeasurementResults),
        new Date("2026-05-20T12:00:00+09:00").toISOString(),
        "measured",
      ),
    [avatarTasteValues],
  );
  const livePalateAvatarProfile = useMemo<PalateSignatureTasteProfile>(
    () =>
      TASTE_OPTIONS.reduce((profile, tasteId) => {
        profile[tasteId] = Math.round(avatarTasteValues[tasteId] * 10);
        return profile;
      }, {} as PalateSignatureTasteProfile),
    [avatarTasteValues],
  );
  const livePalateTopTasteIds = useMemo(
    () =>
      [...TASTE_OPTIONS]
        .sort((left, right) => livePalateAvatarProfile[right] - livePalateAvatarProfile[left])
        .slice(0, 2),
    [livePalateAvatarProfile],
  );
  const livePalateBloomShapeCounts = useMemo(
    () => getPalateBloomShapeCounts(livePalateAvatarProfile, bloomShapeCount),
    [bloomShapeCount, livePalateAvatarProfile],
  );
  const updateAvatarTasteValue = (tasteId: TasteId, value: number) => {
    setAvatarTasteValues((currentValues) => ({
      ...currentValues,
      [tasteId]: Number(value.toFixed(1)),
    }));
  };
  const resetAvatarPreviewControls = () => {
    setAvatarTasteValues(AVATAR_TASTE_DEFAULTS);
    setBloomShapeCount(BLOOM_SHAPE_COUNT_DEFAULT);
    setBloomPetalShape(BLOOM_PETAL_SHAPE_DEFAULT);
    setBloomStarShape(BLOOM_STAR_SHAPE_DEFAULT);
    setBloomCoreShape(BLOOM_CORE_SHAPE_DEFAULT);
  };
  const currentRuntimeTokenState = useMemo<DesignTokenRuntimeState>(
    () => ({
      background,
      bodySize,
      bodyText,
      border,
      captionSize,
      cardRadius,
      cardSurface,
      controlRadius,
      displaySize,
      fontWeight,
      gap,
      lineHeight,
      primaryText,
      sectionGap,
      shadowKey,
      titleSize,
    }),
    [
      background,
      bodySize,
      bodyText,
      border,
      captionSize,
      cardRadius,
      cardSurface,
      controlRadius,
      displaySize,
      fontWeight,
      gap,
      lineHeight,
      primaryText,
      sectionGap,
      shadowKey,
      titleSize,
    ],
  );
  const pendingRuntimeDiffCount = countDesignTokenRuntimeDifferences(
    currentRuntimeTokenState,
    appliedRuntimeTokenState,
  );
  const hasPendingRuntimeChanges = pendingRuntimeDiffCount > 0;
  const designSystemCssSnippet = useMemo(
    () => buildDesignSystemCssSnippet(currentRuntimeTokenState),
    [currentRuntimeTokenState],
  );
  const designTokensTsSnippet = useMemo(
    () => buildDesignTokensTsSnippet(currentRuntimeTokenState),
    [currentRuntimeTokenState],
  );
  const activeLiveControlSection = activeLiveControlSectionId
    ? SECTION_NAV.find((section) => section.id === activeLiveControlSectionId) ?? null
    : null;

  useEffect(() => {
    if (!applyFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setApplyFeedback(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [applyFeedback]);

  useEffect(() => {
    applyDesignTokenRuntimeState(currentRuntimeTokenState);

    return () => {
      const appliedDiffCount = countDesignTokenRuntimeDifferences(
        appliedRuntimeTokenState,
        DESIGN_TOKEN_RUNTIME_DEFAULTS,
      );

      if (appliedDiffCount === 0) {
        clearAppliedDesignTokenRuntimeState();
        return;
      }

      applyDesignTokenRuntimeState(appliedRuntimeTokenState);
    };
  }, [appliedRuntimeTokenState, currentRuntimeTokenState]);

  const syncRuntimeTokenControls = (nextState: DesignTokenRuntimeState) => {
    setBackground(nextState.background);
    setCardSurface(nextState.cardSurface);
    setPrimaryText(nextState.primaryText);
    setBodyText(nextState.bodyText);
    setBorder(nextState.border);
    setDisplaySize(nextState.displaySize);
    setTitleSize(nextState.titleSize);
    setBodySize(nextState.bodySize);
    setCaptionSize(nextState.captionSize);
    setFontWeight(nextState.fontWeight);
    setLineHeight(nextState.lineHeight);
    setCardRadius(nextState.cardRadius);
    setControlRadius(nextState.controlRadius);
    setGap(nextState.gap);
    setSectionGap(nextState.sectionGap);
    setShadowKey(nextState.shadowKey);
  };

  const handleApplyRuntimeChanges = () => {
    applyDesignTokenRuntimeState(currentRuntimeTokenState);
    persistDesignTokenRuntimeState(currentRuntimeTokenState);
    setAppliedRuntimeTokenState(currentRuntimeTokenState);
    setApplyFeedback({
      message: "현재 앱 런타임에 바로 반영되었습니다.",
      tone: "success",
    });
  };

  const handleResetRuntimeChanges = () => {
    clearPersistedDesignTokenRuntimeState();
    syncRuntimeTokenControls(DESIGN_TOKEN_RUNTIME_DEFAULTS);
    setAppliedRuntimeTokenState(DESIGN_TOKEN_RUNTIME_DEFAULTS);
    setApplyFeedback({
      message: "런타임 반영을 초기화했습니다.",
      tone: "note",
    });
  };

  const handleDismissFloatingMenus = () => {
    setLiveControlsDockOpen(false);
    setSectionJumpMenuOpen(false);
    setFloatingMenuOpen(false);
    setExportPreviewOpen(false);
  };

  const handleToggleLiveControlsDock = () => {
    setSectionJumpMenuOpen(false);
    setFloatingMenuOpen(false);
    setExportPreviewOpen(false);
    setLiveControlsDockOpen((previous) => !previous);
  };

  const handleToggleSectionJumpMenu = () => {
    setLiveControlsDockOpen(false);
    setFloatingMenuOpen(false);
    setExportPreviewOpen(false);
    setSectionJumpMenuOpen((previous) => !previous);
  };

  const handleToggleFloatingMenu = () => {
    setLiveControlsDockOpen(false);
    setSectionJumpMenuOpen(false);
    setExportPreviewOpen(false);
    setFloatingMenuOpen((previous) => !previous);
  };

  const copyTextToClipboard = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    if (typeof document === "undefined") {
      throw new Error("Clipboard unavailable");
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopyExportSnippet = async (target: "css" | "ts") => {
    const snippet = target === "css" ? designSystemCssSnippet : designTokensTsSnippet;
    const label =
      target === "css" ? "design-system.css용 스니펫" : "designTokens.ts용 스니펫";

    try {
      await copyTextToClipboard(snippet);
      setApplyFeedback({
        message: `${label}을 클립보드에 복사했습니다.`,
        tone: "success",
      });
    } catch {
      setApplyFeedback({
        message: `${label} 복사에 실패했습니다. 아래 코드 블록에서 직접 복사해 주세요.`,
        tone: "note",
      });
      setExportPreviewOpen(true);
    }
  };

  const handleCopyComponentStyleSnippet = async (spec: ComponentStyleSpec) => {
    try {
      await copyTextToClipboard(buildComponentStyleSnippet(spec));
      setApplyFeedback({
        message: `${spec.name} 스타일 값을 클립보드에 복사했습니다.`,
        tone: "success",
      });
    } catch {
      setApplyFeedback({
        message: `${spec.name} 스타일 값 복사에 실패했습니다.`,
        tone: "note",
      });
    }
  };

  const handleCopyComponentCodexPrompt = async (spec: ComponentStyleSpec) => {
    try {
      await copyTextToClipboard(buildComponentCodexPrompt(spec));
      setApplyFeedback({
        message: `${spec.name} 코덱스 프롬프트를 클립보드에 복사했습니다.`,
        tone: "success",
      });
    } catch {
      setApplyFeedback({
        message: `${spec.name} 코덱스 프롬프트 복사에 실패했습니다.`,
        tone: "note",
      });
    }
  };

  const handleJumpToSection = (sectionId: (typeof SECTION_NAV)[number]["id"]) => {
    if (typeof document === "undefined") {
      return;
    }

    const target = document.getElementById(sectionId);

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
    setSectionJumpMenuOpen(false);
  };

  const handleComponentNavigate = (sectionId: string, componentName: string) => {
    const componentTarget = findComponentPreviewTarget(componentName);

    if (componentTarget) {
      componentTarget.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${sectionId}`);
      }
      setSectionJumpMenuOpen(false);
      setApplyFeedback({
        message: `${componentName} 위치로 이동했습니다.`,
        tone: "note",
      });
      return;
    }

    if (!SECTION_NAV.some((section) => section.id === sectionId)) {
      return;
    }

    handleJumpToSection(sectionId as (typeof SECTION_NAV)[number]["id"]);
    setApplyFeedback({
      message: `${componentName} 위치로 이동했습니다.`,
      tone: "note",
    });
  };

  const handlePreviewNotificationRead = (id: string) => {
    setPreviewNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  const handlePreviewNotificationsReadAll = () => {
    setPreviewNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true })),
    );
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    let rafId = 0;

    const syncActiveLiveControlSection = () => {
      const threshold = Math.round(window.innerHeight * 0.22);
      let nextActiveSectionId: SectionId | null = null;

      for (const section of SECTION_NAV) {
        const element = document.getElementById(section.id);

        if (!element) {
          continue;
        }

        const { top } = element.getBoundingClientRect();

        if (top <= threshold) {
          nextActiveSectionId = section.id;
        } else {
          break;
        }
      }

      setActiveLiveControlSectionId((previous) => {
        return previous === nextActiveSectionId ? previous : nextActiveSectionId;
      });
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(syncActiveLiveControlSection);
    };

    scheduleSync();
    scrollContainer.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("hashchange", scheduleSync);

    return () => {
      scrollContainer.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("hashchange", scheduleSync);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!floatingMenuOpen && !sectionJumpMenuOpen && !liveControlsDockOpen) {
      return;
    }

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      floatingMenuPointerIntentRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startedOutside: !floatingMenuClusterRef.current?.contains(target),
        moved: false,
      };
    };

    const handleDocumentPointerMove = (event: PointerEvent) => {
      if (floatingMenuPointerIntentRef.current.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = Math.abs(event.clientX - floatingMenuPointerIntentRef.current.startX);
      const deltaY = Math.abs(event.clientY - floatingMenuPointerIntentRef.current.startY);

      if (deltaX > 8 || deltaY > 8) {
        floatingMenuPointerIntentRef.current.moved = true;
      }
    };

    const handleDocumentPointerUp = (event: PointerEvent) => {
      if (floatingMenuPointerIntentRef.current.pointerId !== event.pointerId) {
        return;
      }

      const target = event.target;
      const startedOutside = floatingMenuPointerIntentRef.current.startedOutside;
      const moved = floatingMenuPointerIntentRef.current.moved;

      floatingMenuPointerIntentRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        startedOutside: false,
        moved: false,
      };

      if (!(target instanceof Node)) {
        return;
      }

      if (!startedOutside || moved || floatingMenuClusterRef.current?.contains(target)) {
        return;
      }

      handleDismissFloatingMenus();
    };

    const handleDocumentPointerCancel = () => {
      floatingMenuPointerIntentRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        startedOutside: false,
        moved: false,
      };
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    document.addEventListener("pointermove", handleDocumentPointerMove, true);
    document.addEventListener("pointerup", handleDocumentPointerUp, true);
    document.addEventListener("pointercancel", handleDocumentPointerCancel, true);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
      document.removeEventListener("pointermove", handleDocumentPointerMove, true);
      document.removeEventListener("pointerup", handleDocumentPointerUp, true);
      document.removeEventListener("pointercancel", handleDocumentPointerCancel, true);
    };
  }, [floatingMenuOpen, liveControlsDockOpen, sectionJumpMenuOpen]);

  const previewStyle = useMemo(
    () =>
      ({
        "--background": background,
        "--foreground": primaryText,
        "--card": cardSurface,
        "--card-foreground": primaryText,
        "--popover": cardSurface,
        "--popover-foreground": primaryText,
        "--primary": primaryText,
        "--primary-foreground": "#ffffff",
        "--secondary": COLOR_TOKENS.surface.muted,
        "--secondary-foreground": primaryText,
        "--accent": COLOR_TOKENS.surface.muted,
        "--accent-foreground": primaryText,
        "--destructive": "#d4183d",
        "--destructive-foreground": "#ffffff",
        "--border": border,
        "--input": border,
        "--input-background": COLOR_TOKENS.surface.muted,
        "--switch-background": border,
        "--ring": primaryText,
        "--radius": `${controlRadius}px`,
        "--tb-color-bg-page": background,
        "--tb-color-bg-focus": cardSurface,
        "--tb-color-surface-base": cardSurface,
        "--tb-color-surface-card": cardSurface,
        "--tb-color-surface-muted": COLOR_TOKENS.surface.muted,
        "--tb-color-text-primary": primaryText,
        "--tb-color-text-body": bodyText,
        "--tb-color-text-tertiary": bodyText,
        "--tb-color-border-default": border,
        "--tb-color-border-strong": border,
        "--tb-color-success": COLOR_TOKENS.state.success,
        "--tb-color-success-soft": COLOR_TOKENS.state.successSoft,
        "--tb-color-warning": COLOR_TOKENS.state.warning,
        "--tb-color-warning-soft": COLOR_TOKENS.state.warningSoft,
        "--tb-radius-20": `${cardRadius}px`,
        "--tb-radius-14": `${Math.max(controlRadius + 4, controlRadius)}px`,
        "--tb-radius-12": `${Math.max(controlRadius + 2, controlRadius)}px`,
        "--tb-radius-10": `${controlRadius}px`,
        "--tb-layout-section-gap": `${sectionGap}px`,
        "--tb-space-12": `${gap}px`,
        "--tb-space-16": `${sectionGap}px`,
        "--tb-space-20": `${sectionGap}px`,
        "--tb-layout-card-stack-gap": `${gap}px`,
        "--tb-font-size-28": `${displaySize}px`,
        "--tb-font-size-24": `${displaySize}px`,
        "--tb-font-size-22": `${displaySize}px`,
        "--tb-font-size-20": `${displaySize}px`,
        "--tb-font-size-18": `${titleSize}px`,
        "--tb-font-size-14": `${bodySize}px`,
        "--tb-font-size-12": `${captionSize}px`,
        "--tb-font-weight-semibold": `${fontWeight}`,
        "--tb-line-height-relaxed": `${lineHeight}`,
        "--tb-shadow-button": SHADOW_TOKENS[shadowKey],
        "--tb-shadow-soft": SHADOW_TOKENS.soft,
        "--tb-shadow-strong": SHADOW_TOKENS.strong,
      }) as CSSProperties,
    [
      background,
      bodySize,
      bodyText,
      border,
      cardRadius,
      cardSurface,
      captionSize,
      controlRadius,
      displaySize,
      fontWeight,
      gap,
      lineHeight,
      primaryText,
      sectionGap,
      shadowKey,
      titleSize,
    ],
  );

  const genericFieldClass = cn(fieldFocus && "ring-ring/50 ring-[3px]");
  const previewCardClass =
    "rounded-[var(--tb-radius-20)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)]";
  const previewPanelClass =
    "rounded-[var(--tb-radius-14)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)]";
  const previewInsetClass =
    "rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)]";
  const avatarPreviewGridClass = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";
  const avatarPreviewTileClass =
    "flex min-w-0 flex-col items-center gap-3 rounded-[var(--tb-radius-14)] bg-[var(--tb-color-surface-muted)] px-4 py-4 text-center";
  const avatarPreviewVisualClass = "flex h-[72px] items-center justify-center";
  const avatarPreviewMetaClass = "grid min-h-[56px] gap-1";
  const avatarPreviewLabelClass =
    "text-[13px] font-semibold text-[var(--tb-color-text-primary)]";
  const avatarPreviewDescriptionClass =
    "text-[11px] leading-relaxed text-[var(--tb-color-text-subtle)]";
  const avatarPreviewChipRowClass = "flex min-h-[28px] flex-wrap justify-center gap-1.5";
  const avatarPreviewSupportClass =
    "rounded-[var(--tb-radius-14)] bg-[var(--tb-color-surface-base)] px-4 py-3";
  const headerBackgroundStyle = useMemo<CSSProperties>(() => {
    const tasteClouds = [
      { alpha: 0.11, position: "10% 14%", size: "30%", taste: "단맛" },
      { alpha: 0.095, position: "82% 12%", size: "28%", taste: "신맛" },
      { alpha: 0.09, position: "66% 56%", size: "32%", taste: "쓴맛" },
      { alpha: 0.1, position: "18% 78%", size: "34%", taste: "짠맛" },
      { alpha: 0.095, position: "46% 10%", size: "24%", taste: "감칠맛" },
      { alpha: 0.09, position: "94% 82%", size: "26%", taste: "지방맛" },
    ] as const;

    return {
      backgroundColor: "var(--tb-color-surface-muted)",
      backgroundImage: [
        "linear-gradient(135deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 100%)",
        ...tasteClouds.map(
          ({ alpha, position, size, taste }) =>
            `radial-gradient(circle at ${position}, ${getTasteTint(taste, alpha)} 0%, transparent ${size})`,
        ),
      ].join(", "),
    };
  }, []);
  const previewColorValue = (tokenName: string, fallbackValue: string) => {
    switch (tokenName) {
      case "bg-page":
        return background;
      case "bg-focus":
      case "surface-base":
      case "surface-card":
        return cardSurface;
      case "text-primary":
        return primaryText;
      case "text-tertiary":
      case "text-body":
        return bodyText;
      case "border-default":
      case "border-strong":
        return border;
      default:
        return fallbackValue;
    }
  };
  const previewSpacingValue = (tokenName: string, fallbackValue: string) => {
    switch (tokenName) {
      case "space-12":
        return `${gap}px`;
      case "space-16":
      case "space-20":
        return `${sectionGap}px`;
      default:
        return fallbackValue;
    }
  };
  const previewRadiusValue = (tokenName: string, fallbackValue: string) => {
    switch (tokenName) {
      case "radius-10":
        return `${controlRadius}px`;
      case "radius-12":
        return `${Math.max(controlRadius + 2, controlRadius)}px`;
      case "radius-14":
        return `${Math.max(controlRadius + 4, controlRadius)}px`;
      case "radius-20":
        return `${cardRadius}px`;
      default:
        return fallbackValue;
    }
  };

  const highlightedButton =
    buttonFamily === "system" ? (
      <PrimaryButton
        fullWidth={systemButtonFullWidth}
        size={systemButtonCompact ? "compact" : "default"}
        disabled={buttonState === "disabled"}
        className={cn(buttonState === "active" && "scale-[0.98]")}
      >
        {buttonState === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            로딩 중
          </span>
        ) : (
          "미각 측정 시작"
        )}
      </PrimaryButton>
    ) : (
      <Button
        variant={genericButtonVariant}
        size={genericButtonSize}
        disabled={buttonState === "disabled"}
        className={cn(buttonState === "active" && "scale-[0.98]")}
      >
        {buttonState === "loading" ? <Spinner /> : genericButtonSize === "icon" ? <SparklesIcon className="size-4" /> : "Generic Button"}
      </Button>
    );

  const floatingMenuButtonClassName =
    "inline-flex shrink-0 self-end items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)] shadow-[0_18px_48px_rgba(15,15,15,0.14)] transition-colors hover:bg-[var(--tb-color-surface-muted)]";
  const floatingMenuIconStrokeWidth = 1.8;

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden bg-[linear-gradient(180deg,#f7f7f7_0%,#ffffff_18%,#f6f6f6_100%)] px-4 py-6"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col gap-6 pb-28">
        <header
          style={headerBackgroundStyle}
          className="overflow-hidden rounded-[36px] border border-[var(--tb-color-border-default)] text-[var(--tb-color-text-primary)] shadow-[0_24px_64px_rgba(15,15,15,0.08)]"
        >
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)] lg:px-8">
            <div className="flex flex-col gap-4">
              <div className="inline-flex w-fit items-center rounded-full border border-[var(--tb-color-border-default)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--tb-color-text-tertiary)]">
                Internal Route / Design Inventory
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/"
                  className="inline-flex w-fit items-center rounded-full border border-[var(--tb-color-border-default)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-base)]"
                >
                  Main App
                </a>
                <a
                  href="/design-system-updates"
                  className="inline-flex w-fit items-center rounded-full border border-[var(--tb-color-border-default)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-base)]"
                >
                  Existing Update Preview
                </a>
              </div>
              <div className="max-w-[780px]">
                <h1 className="text-[18px] font-bold leading-tight tracking-tight">
                  Design System / UI Playground
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--tb-color-text-body)]">
                  현재 앱에 실제로 존재하는 토큰, 컴포넌트, 화면 패턴을 한 페이지에 모았습니다.
                  오른쪽 하단 플로팅 컨트롤에서 값을 조절하면 각 섹션 preview가 즉시 반영되고, 우측 하단 플로팅 메뉴의
                  <span className="font-semibold"> 수정 사항 반영</span> 버튼으로 현재 앱 런타임에도 바로 적용할 수 있습니다.
                  코드 기준 영구 반영은 여전히 <span className="font-mono">src/styles/design-system.css</span> 와{" "}
                  <span className="font-mono">src/constants/designTokens.ts</span> 를 수정해야 합니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SECTION_NAV.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-full border border-[var(--tb-color-border-default)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-base)]"
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--tb-color-text-hint)]">Shared app components</p>
                <p className="mt-2 text-[18px] font-bold">{AUDIT_SUMMARY.componentCount}</p>
                <p className="mt-1 text-[12px] text-[var(--tb-color-text-body)]">currently used across active screens</p>
              </div>
              <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--tb-color-text-hint)]">Defined UI primitives</p>
                <p className="mt-2 text-[18px] font-bold">{AUDIT_SUMMARY.definedPrimitiveCount}</p>
                <p className="mt-1 text-[12px] text-[var(--tb-color-text-body)]">present in code, mostly unused before this page</p>
              </div>
              <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--tb-color-text-hint)]">Button height</p>
                <p className="mt-2 text-[18px] font-bold">{AUDIT_SUMMARY.sharedButtonHeight}</p>
                <p className="mt-1 text-[12px] text-[var(--tb-color-text-body)]">source of truth in the current app shell</p>
              </div>
              <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--tb-color-text-hint)]">Screen shell</p>
                <p className="mt-2 text-[18px] font-bold">{AUDIT_SUMMARY.screenMaxWidth}</p>
                <p className="mt-1 text-[12px] text-[var(--tb-color-text-body)]">single-column app container</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--tb-color-border-default)] px-6 py-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
              <div>
                <div className="inline-flex w-fit items-center rounded-full border border-[var(--tb-color-border-default)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--tb-color-text-tertiary)]">
                  TSX Files
                </div>
                <h2 className="mt-3 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                  프리뷰 가능한 .tsx 파일
                </h2>
                <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[var(--tb-color-text-body)]">
                  현재 디자인 시스템에서 바로 눌러볼 수 있는 screen, app component, ui primitive 파일들입니다.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                        Screen Files
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">
                        실제 앱 화면 단위 컴포넌트
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                      {previewableScreenFiles.length}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {previewableScreenFiles.map((entry) => (
                      <SourceFileLink
                        key={entry.file}
                        file={entry.file}
                        label={entry.definition.title}
                        variant="chip"
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                        App Component Files
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">
                        Taste Buddy 제품 레벨 / feature 컴포넌트
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                      {previewableAppComponentFiles.length}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {previewableAppComponentFiles.map((entry) => (
                      <SourceFileLink
                        key={entry.file}
                        file={entry.file}
                        label={entry.definition.title}
                        variant="chip"
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                        UI Primitive Files
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">
                        `src/components/ui`의 범용 프리미티브
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                      {previewableUiPrimitiveFiles.length}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {previewableUiPrimitiveFiles.map((entry) => (
                      <SourceFileLink
                        key={entry.file}
                        file={entry.file}
                        label={entry.definition.title}
                        variant="chip"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <PlaygroundLiveControlsProvider
          activeSectionId={activeLiveControlSectionId}
          portalRootElement={liveControlsPortalRootElement}
        >
          <PlaygroundSection
            id="components"
            title="Component Architecture"
            description="이 페이지의 전체 컴포넌트를 역할 기준으로 다시 분류했습니다. 최근 추가 여부가 아니라 제품 안에서 무엇을 담당하는지 기준으로 묶고, 페이지 전용 데모 헬퍼는 제외한 뒤 작은 building block에서 복합 화면 패널 순서로 읽히게 정리했습니다."
            controls={
              <>
                <div className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                      정렬 기준
                    </p>
                    <span className="rounded-full border border-[var(--tb-color-border-default)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--tb-color-text-muted)]">
                      {componentArchitectureCount} components
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    액션과 상태처럼 작은 단위에서 시작해, 카드/해석, 내비게이션, 오버레이, 그리고 스크린 패널처럼 더 큰 조합으로 이어지게 배치했습니다.
                  </p>
                </div>

                <div className="grid gap-2">
                  {componentArchitectureGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-[16px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                          {group.title}
                        </p>
                        <span className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                          {group.components.length}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        {group.description}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            }
            sources={[
              {
                file: "src/components/design-system/filePreviewRegistry.tsx",
                note: "단독 파일 프리뷰 정의와 렌더링 source of truth입니다.",
              },
              {
                file: "src/pages/DesignSystemPage.tsx",
                note: "전체 컴포넌트 분류와 상세 프리뷰 섹션 순서를 함께 정리합니다.",
              },
            ]}
          >
            <div className="grid gap-6">
              {componentArchitectureGroups.map((group) => (
                <div key={group.id} className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                        {group.title}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        {group.description}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                      {group.components.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.components.map((componentName) => (
                      <span
                        key={`${group.id}-${componentName}`}
                        className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]"
                      >
                        {componentName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="audit"
            title="Style System Audit"
            description="프로젝트의 실제 스타일 구조와 현재 사용 중인 시스템 계층입니다. app shell은 tb-* 토큰이 주도하고, generic semantic layer와 Radix/shadcn primitives는 별도로 존재합니다."
            sources={PLAYGROUND_SECTION_SOURCES.audit}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-3">
                <SectionEyebrow>Structure</SectionEyebrow>
                {STYLE_STRUCTURE.map((entry) => (
                  <InventoryCard key={entry.name} {...entry} />
                ))}
              </div>
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-4">
                  <SectionEyebrow>Traceable Sources</SectionEyebrow>
                  <div className="mt-3 grid gap-2">
                    {SOURCE_REFERENCES.map((source) => (
                      <div
                        key={source.file}
                        className="rounded-[18px] bg-[var(--tb-color-surface-muted)] px-3 py-3"
                      >
                        <SourceFileLink
                          className="font-mono"
                          file={source.file}
                          variant="block"
                        />
                        <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          {source.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-4">
                  <SectionEyebrow>Read First</SectionEyebrow>
                  <ul className="mt-3 grid gap-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    <li>App shell colors, spacing, motion, and radius live in <span className="font-mono">design-system.css</span>.</li>
                    <li>Typed mirrors for charts, taste palettes, and component specs live in <span className="font-mono">designTokens.ts</span>.</li>
                    <li>Layout, shell, and typography rules live in <span className="font-mono">DESIGN.md</span>.</li>
                    <li>Dark mode exists only for the generic semantic layer in <span className="font-mono">globals.css</span>.</li>
                  </ul>
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="colors"
            title="Colors"
            description="semantic neutral tokens, taste accents, and the parallel generic theme colors that exist in the repo. The active app token layer now includes success and warning pairs so state chips can reference real tb-* tokens."
            controls={
              <>
                <ColorControl label="Page background" value={background} onChange={setBackground} />
                <ColorControl label="Card surface" value={cardSurface} onChange={setCardSurface} />
                <ColorControl label="Primary text" value={primaryText} onChange={setPrimaryText} />
                <ColorControl label="Body text" value={bodyText} onChange={setBodyText} />
                <ColorControl label="Border" value={border} onChange={setBorder} />
                <ControlBlock label="Accent taste" hint={TASTE_TOKENS[accentTaste].label}>
                  <SegmentedControl
                    value={accentTaste}
                    onChange={setAccentTaste}
                    options={TASTE_OPTIONS.map((taste) => ({
                      value: taste,
                      label: TASTE_TOKENS[taste].label,
                    }))}
                  />
                </ControlBlock>
                <div className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  <p className="font-semibold text-[var(--tb-color-text-primary)]">State color coverage</p>
                  <p className="mt-1">`success`와 `warning`은 이제 tb-* 토큰으로 정의되어 있습니다. `error`는 아직 generic semantic layer의 `--destructive`에 의존합니다.</p>
                </div>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.colors}
            previewStyle={previewStyle}
          >
            <div className="grid gap-5">
              {COLOR_GROUPS.map((group) => (
                <div key={group.id} className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[16px] font-semibold text-[var(--tb-color-text-primary)]">{group.name}</h3>
                    {group.id === "taste" ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--tb-color-surface-card)] px-3 py-1 text-[12px] text-[var(--tb-color-text-subtle)]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accentPalette.main }} />
                        Spotlight: {TASTE_TOKENS[accentTaste].label}
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.colors.map((color) => {
                      const colorValue = previewColorValue(color.name, color.value);

                      return (
                        <div
                          key={`${group.id}-${color.name}`}
                          className={cn(previewCardClass, "p-3")}
                        >
                          <div
                            className="h-16 rounded-[var(--tb-radius-12)] border border-black/5"
                            style={{ background: colorValue }}
                          />
                          <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                                {color.name}
                              </p>
                              <p className="mt-1 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                                {colorValue}
                              </p>
                            </div>
                            {color.status === "currently-used" ? <StatusTag tone="used">Used</StatusTag> : null}
                            {color.status === "defined-but-unused" ? <StatusTag tone="unused">Unused</StatusTag> : null}
                          </div>
                          <p className="mt-2 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                            {color.cssVar}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                            {color.description ?? color.source}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="typography"
            title="Typography"
            description="Pretendard-based hierarchy extracted from current screens and DESIGN.md. The live controls stay within the 18px ceiling so roles can be compared without breaking the system."
            controls={
              <>
                <SliderControl label="Display size" value={displaySize} min={16} max={18} onChange={setDisplaySize} />
                <SliderControl label="Title size" value={titleSize} min={14} max={18} onChange={setTitleSize} />
                <SliderControl label="Body size" value={bodySize} min={12} max={18} onChange={setBodySize} />
                <SliderControl label="Caption size" value={captionSize} min={10} max={14} onChange={setCaptionSize} />
                <SliderControl label="Font weight" value={fontWeight} min={400} max={700} step={100} unit="" onChange={setFontWeight} />
                <SliderControl label="Line height" value={Math.round(lineHeight * 100)} min={120} max={180} step={5} unit="" onChange={(value) => setLineHeight(value / 100)} />
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.typography}
            previewStyle={previewStyle}
          >
            <div className="grid gap-3">
              {TYPOGRAPHY_SPECS.map((spec) => {
                const dynamicStyle: CSSProperties =
                  spec.name === "디스플레이"
                    ? { fontSize: `${displaySize}px`, fontWeight, lineHeight }
                    : spec.name === "타이틀"
                      ? { fontSize: `${titleSize}px`, fontWeight, lineHeight }
                      : spec.name === "본문"
                        ? { fontSize: `${bodySize}px`, fontWeight: 400, lineHeight }
                        : spec.name === "캡션"
                          ? { fontSize: `${captionSize}px`, fontWeight, lineHeight }
                          : { fontSize: spec.value.fontSize, fontWeight: spec.value.fontWeight, lineHeight: spec.value.lineHeight };

                return (
                  <div
                    key={spec.name}
                    className={cn(previewCardClass, "px-4 py-4")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{spec.name}</p>
                        <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">{spec.usage}</p>
                      </div>
                      <div className="text-right font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                        <p>{dynamicStyle.fontSize}</p>
                        <p>{dynamicStyle.fontWeight}</p>
                        <p>{dynamicStyle.lineHeight}</p>
                      </div>
                    </div>
                    <div
                      className="mt-4 text-[var(--tb-color-text-primary)]"
                      style={dynamicStyle}
                    >
                      {spec.sample}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {spec.cssVars.map((token) => (
                        <Badge key={token} variant="outline">
                          {token}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-3 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                      {spec.source}
                    </p>
                  </div>
                );
              })}
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="spacing"
            title="Spacing & Radius"
            description="The current app rhythm is compact and mobile-first. Active screens now treat 12px (`gap-3`) as the default card-to-card stack rule, and these scales show the tokens behind that rhythm."
            controls={
              <>
                <SliderControl label="Card radius" value={cardRadius} min={8} max={32} onChange={setCardRadius} />
                <SliderControl label="Control radius" value={controlRadius} min={6} max={24} onChange={setControlRadius} />
                <SliderControl label="Card gap" value={gap} min={6} max={24} onChange={setGap} />
                <SliderControl label="Section gap" value={sectionGap} min={8} max={32} onChange={setSectionGap} />
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.spacing}
            previewStyle={previewStyle}
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="grid gap-3">
                <h3 className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">Spacing scale</h3>
                {SPACING_ITEMS.map((item) => {
                  const spacingValue = previewSpacingValue(item.name, item.value);

                  return (
                    <div key={item.name} className="grid grid-cols-[120px_minmax(0,1fr)_56px] items-center gap-3">
                      <span className="font-mono text-[12px] text-[var(--tb-color-text-muted)]">{item.name}</span>
                      <div className="rounded-full bg-[var(--tb-color-surface-card)] px-2 py-2">
                        <div
                          className="h-3 rounded-full bg-[var(--tb-color-text-primary)]"
                          style={{ width: spacingValue }}
                        />
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{spacingValue}</span>
                    </div>
                  );
                })}
                <div className={cn(previewCardClass, "p-4")}>
                  <div className="tb-card-stack">
                    <div className={cn(previewInsetClass, "px-3 py-3")}>
                      <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">Hero card</p>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">대표 예약 준비 또는 요약 카드</p>
                    </div>
                    <div className={cn(previewInsetClass, "px-3 py-3")}>
                      <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">Supporting card</p>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">신뢰도, 인사이트, CTA 카드</p>
                    </div>
                    <div className={cn(previewInsetClass, "px-3 py-3")}>
                      <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">Follow-up card</p>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">최근 변화, 셰프 요약, 상태 카드</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  <span className="font-semibold text-[var(--tb-color-text-primary)]">Card stack rule:</span>{" "}
                  stacked cards in active screens use <span className="font-mono">var(--tb-layout-card-stack-gap)</span>, which maps to{" "}
                  <span className="font-mono">{previewSpacingValue("space-12", "12px")}</span> and the Tailwind utility{" "}
                  <span className="font-mono">gap-3</span>.
                </div>
              </div>
              <div className="grid gap-3">
                <h3 className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">Radius scale</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {RADIUS_ITEMS.map((item) => {
                    const radiusValue = previewRadiusValue(item.name, item.value);

                    return (
                      <div key={item.name} className={cn(previewCardClass, "p-3")}>
                        <div
                          className="flex h-20 items-center justify-center border border-dashed border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)]"
                          style={{ borderRadius: radiusValue }}
                        >
                          <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                            {radiusValue}
                          </span>
                        </div>
                        <p className="mt-2 font-mono text-[12px] text-[var(--tb-color-text-muted)]">{item.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="shadows"
            title="Shadows & Borders"
            description="The current interface uses contrast first and shadow second. These previews show where depth is actually applied and how border tokens separate layers."
            controls={
              <>
                <ControlBlock label="Shadow preset" hint={shadowKey}>
                  <SegmentedControl
                    value={shadowKey}
                    onChange={(value) => setShadowKey(value as keyof typeof SHADOW_TOKENS)}
                    options={Object.keys(SHADOW_TOKENS).map((key) => ({ value: key, label: key }))}
                  />
                </ControlBlock>
                <SliderControl label="Border width" value={borderWidth} min={1} max={4} unit="px" onChange={setBorderWidth} />
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.spacing}
            previewStyle={previewStyle}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-3">
                {SHADOW_ITEMS.map((shadow) => (
                  <div key={shadow.name} className={cn(previewCardClass, "p-4")}>
                    <div
                      className="h-24 rounded-[var(--tb-radius-14)] bg-[var(--tb-color-surface-base)]"
                      style={{ boxShadow: shadow.value }}
                    />
                    <p className="mt-3 text-[13px] font-semibold text-[var(--tb-color-text-primary)]">{shadow.name}</p>
                    <p className="mt-1 font-mono text-[11px] text-[var(--tb-color-text-muted)]">{shadow.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3">
                <div
                  className={cn(previewCardClass, "p-4")}
                  style={{
                    border: `${borderWidth}px solid ${border}`,
                    boxShadow: SHADOW_TOKENS[shadowKey],
                  }}
                >
                  <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">Active border preview</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    Border width and shadow preset update this panel immediately. The current product
                    mostly keeps borders at 1px and uses stronger shadow only for buttons and drawers.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { name: "default border", value: `1px solid ${border}` },
                    { name: "strong border", value: `1px solid ${COLOR_TOKENS.border.strong}` },
                    { name: "avatar border", value: `1px solid ${COLOR_TOKENS.border.avatar}` },
                  ].map((item) => (
                    <div key={item.name} className={cn(previewCardClass, "p-3")}>
                      <div className="h-16 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)]" style={{ border: item.value }} />
                      <p className="mt-2 text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{item.name}</p>
                      <p className="mt-1 font-mono text-[11px] text-[var(--tb-color-text-muted)]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="icons"
            title="Icons"
            description="현재 실제 앱은 Lucide를 기본 아이콘 언어로 쓰되, 하단 바의 `홈`과 `나의 미각` 아이콘은 제공된 `home.svg`, `analysis.svg` 기준 커스텀 SVG를 사용합니다. 디자인 시스템 프리뷰도 같은 기준으로 맞춥니다."
            controls={
              <>
                <SliderControl label="Stroke width" value={Math.round(iconStroke * 10)} min={15} max={30} step={1} unit="" onChange={(value) => setIconStroke(value / 10)} />
                <div className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Size rules</p>
                  <div className="mt-2 grid gap-2">
                    {ICON_SIZE_RULES.map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between gap-3 rounded-[12px] bg-[var(--tb-color-surface-base)] px-3 py-2">
                        <div>
                          <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{preset.label}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">{preset.usage}</p>
                        </div>
                        <p className="font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                          {preset.size}px / {preset.container}px
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                    이제 제품 아이콘은 `S 14/18`, `M 18/24`, `L 24/32`만 사용합니다.
                  </p>
                </div>
                <div className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Icon rules</p>
                  <div className="mt-2 grid gap-2">
                    {ICON_RULES.map((rule) => (
                      <div key={rule.name}>
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{rule.name}</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.icons}
            previewStyle={previewStyle}
          >
            <div className="grid gap-5 xl:grid-cols-2">
              {[{ title: "App icons", icons: appIcons }, { title: "Lucide samples", icons: lucidePreviewIcons }].map((group) => (
                <div key={group.title} className="grid gap-3">
                  <h3 className="text-[16px] font-semibold text-[var(--tb-color-text-primary)]">{group.title}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.icons.map((icon) => {
                      const Icon = icon.Component as ElementType;
                      return (
                        <div key={icon.name} className={cn(previewCardClass, "p-3")}>
                          <div className="flex h-20 items-center justify-center rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-icon-primary)]">
                            <div
                              className="flex items-center justify-center rounded-full bg-[var(--tb-color-surface-base)]"
                              style={{
                                width: ICON_PREVIEW_SIZE.container,
                                height: ICON_PREVIEW_SIZE.container,
                              }}
                            >
                              <Icon size={ICON_PREVIEW_SIZE.size} strokeWidth={iconStroke} />
                            </div>
                          </div>
                          <p className="mt-2 text-[13px] font-semibold text-[var(--tb-color-text-primary)]">{icon.name}</p>
                          <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">{icon.library}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="buttons"
            title="Buttons"
            description="The active product uses PrimaryButton for the action itself, FlowBottomCta for the anchored shell, and FlowStepCta for the shared onboarding / measurement step footer. The measurement flow injects taste-aware indicator colors on top of the shared layout."
            controls={
              <>
                <ControlBlock label="Button family" hint={buttonFamily === "system" ? "current app" : "defined generic"}>
                  <SegmentedControl
                    value={buttonFamily}
                    onChange={setButtonFamily}
                    options={[
                      { value: "system", label: "PrimaryButton" },
                      { value: "generic", label: "ui/Button" },
                    ]}
                  />
                </ControlBlock>
                <ControlBlock label="State">
                  <SegmentedControl
                    value={buttonState}
                    onChange={setButtonState}
                    options={[
                      { value: "default", label: "Default" },
                      { value: "active", label: "Active" },
                      { value: "disabled", label: "Disabled" },
                      { value: "loading", label: "Loading" },
                    ]}
                  />
                </ControlBlock>
                {buttonFamily === "system" ? (
                  <>
                    <ControlBlock label="PrimaryButton size">
                      <SegmentedControl
                        value={systemButtonCompact ? "compact" : "default"}
                        onChange={(value) => setSystemButtonCompact(value === "compact")}
                        options={[
                          { value: "default", label: "Default" },
                          { value: "compact", label: "Compact" },
                        ]}
                      />
                    </ControlBlock>
                    <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                      <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Full width</span>
                      <Switch checked={systemButtonFullWidth} onCheckedChange={setSystemButtonFullWidth} />
                    </div>
                  </>
                ) : (
                  <>
                    <ControlBlock label="Variant">
                      <SegmentedControl
                        value={genericButtonVariant}
                        onChange={setGenericButtonVariant}
                        options={GENERIC_BUTTON_VARIANTS.map((variant) => ({
                          value: variant,
                          label: variant,
                        }))}
                      />
                    </ControlBlock>
                    <ControlBlock label="Size">
                      <SegmentedControl
                        value={genericButtonSize}
                        onChange={setGenericButtonSize}
                        options={GENERIC_BUTTON_SIZES.map((size) => ({ value: size, label: size }))}
                      />
                    </ControlBlock>
                  </>
                )}
                <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  Hover is live on cursor. The current app PrimaryButton does not define a distinct hover fill, while the generic button family does.
                </p>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.buttons}
            previewStyle={previewStyle}
          >
            <div className="grid gap-5">
              <div className={cn(previewCardClass, "p-4")}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">Focused preview</p>
                    <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">
                      Controlled by the floating dock.
                    </p>
                  </div>
                  {buttonFamily === "system" ? <StatusTag tone="used">Currently used</StatusTag> : <StatusTag tone="unused">Defined but unused</StatusTag>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SectionEyebrow>{buttonFamily === "system" ? "PrimaryButton" : "Button"}</SectionEyebrow>
                </div>
                <div className="mt-4 flex min-h-[120px] items-center justify-center rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-muted)] p-4">
                  {highlightedButton}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className={cn(previewCardClass, "p-4")}>
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">PrimaryButton states</p>
                    <StatusTag tone="used">Currently used</StatusTag>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SectionEyebrow>PrimaryButton</SectionEyebrow>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="flex flex-wrap gap-3">
                      <PrimaryButton fullWidth={false}>Default</PrimaryButton>
                      <PrimaryButton fullWidth={false} className="scale-[0.98]">Active</PrimaryButton>
                      <PrimaryButton fullWidth={false} disabled>Disabled</PrimaryButton>
                      <PrimaryButton fullWidth={false}>
                        <span className="inline-flex items-center gap-2"><Spinner /> Loading</span>
                      </PrimaryButton>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <PrimaryButton fullWidth={false} size="compact">Compact</PrimaryButton>
                      <PrimaryButton fullWidth={false} size="compact" disabled>Compact disabled</PrimaryButton>
                    </div>
                  </div>
                </div>

                <div className={cn(previewCardClass, "p-4")}>
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">ui/Button variants</p>
                    <StatusTag tone="unused">Defined but unused</StatusTag>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SectionEyebrow>Button</SectionEyebrow>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {GENERIC_BUTTON_VARIANTS.map((variant) => (
                      <Button key={variant} variant={variant}>
                        {variant}
                      </Button>
                    ))}
                    {GENERIC_BUTTON_SIZES.map((size) => (
                      <Button key={size} size={size}>
                        {size === "icon" ? <SparklesIcon className="size-4" /> : size}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <AnchoredFlowCtaPreview
                className={previewCardClass}
                indicatorActiveColor={TASTE_TOKENS.sweet.palette.main}
              />

              <div className="grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      Flow headers
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      `Component Architecture`에 섞여 있던 플로우 header preview를 버튼/액션 섹션으로 옮겨, 진행 유도용 컴포넌트를 한 곳에서 읽히게 정리했습니다.
                    </p>
                  </div>
                  <StatusTag tone="used">Currently used</StatusTag>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {buttonSectionPreviewEntries.map((entry) => (
                    <FilePreviewCard
                      key={entry.file}
                      entry={entry}
                      previewCardClass={previewCardClass}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="badges"
            title="Chips & Badges"
            description="일반 목적 `Chip`, 미각 전용 `TasteChip`, delta marker인 `TastePointArrowBox`, badge 계열과 ui `Badge` primitive를 역할 기준으로 분리해 보여줍니다. 제품 레벨의 짧은 라벨은 `Chip`, taste-aware 해석은 `TasteChip`, 미세 변화 포인트는 `TastePointArrowBox`, 단계/상태 배지는 기존 badge 계열을 유지합니다."
            controls={
              <>
                <ControlBlock label="공용 Chip size">
                  <SegmentedControl
                    value={chipSize}
                    onChange={setChipSize}
                    options={CHIP_SIZES.map((size) => ({
                      value: size,
                      label: CHIP_SIZE_LABELS[size],
                    }))}
                  />
                </ControlBlock>
                <ControlBlock label="공용 Chip variant">
                  <SegmentedControl
                    value={chipVariant}
                    onChange={setChipVariant}
                    options={CHIP_VARIANTS.map((variant) => ({
                      value: variant,
                      label: CHIP_VARIANT_LABELS[variant],
                    }))}
                  />
                </ControlBlock>
                <ControlBlock label="공용 Chip tone">
                  <SegmentedControl
                    value={chipTone}
                    onChange={setChipTone}
                    options={CHIP_TONES.map((tone) => ({
                      value: tone,
                      label: CHIP_TONE_LABELS[tone],
                    }))}
                  />
                </ControlBlock>
                <ControlBlock label="공용 Badge variant">
                  <SegmentedControl
                    value={genericBadgeVariant}
                    onChange={setGenericBadgeVariant}
                    options={GENERIC_BADGE_VARIANTS.map((variant) => ({
                      value: variant,
                      label: GENERIC_BADGE_VARIANT_LABELS[variant],
                    }))}
                  />
                </ControlBlock>
                <ControlBlock label="상태 배지">
                  <SegmentedControl
                    value={statusKey}
                    onChange={setStatusKey}
                    options={Object.keys(STATUS_CONFIG).map((status) => ({
                      value: status as AppStatus,
                      label: STATUS_CONFIG[status as AppStatus].label,
                    }))}
                  />
                </ControlBlock>
                <ControlBlock label="미각 배지" hint={TASTE_TOKENS[accentTaste].label}>
                  <SegmentedControl
                    value={accentTaste}
                    onChange={setAccentTaste}
                    options={TASTE_OPTIONS.map((taste) => ({
                      value: taste,
                      label: TASTE_TOKENS[taste].label,
                    }))}
                  />
                </ControlBlock>
                <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  카드 안의 배지나 칩을 더블 클릭하면 이 섹션으로 바로 이동합니다.
                </p>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.badges}
            previewStyle={previewStyle}
          >
            <div className="grid gap-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">General Chip</p>
                    <StatusTag tone="used">Currently used</StatusTag>
                  </div>
                  <div className={cn(previewCardClass, "p-4")}>
                    <ComponentPreviewUnit
                      name="Chip"
                      hint="size / tone / variant / icon+text"
                    >
                      <div className="grid w-full gap-3">
                        <div className="grid gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
                            Size
                          </p>
                          <ChipSizeSelector activeSize={chipSize} onChange={setChipSize} />
                        </div>

                        <div className="grid gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
                            Tone
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Chip size={chipSize} tone="neutral">Neutral</Chip>
                            <Chip size={chipSize} tone="success">Success</Chip>
                            <Chip size={chipSize} tone="warning" variant="outline">
                              Warning
                            </Chip>
                            <Chip size={chipSize} tone="accent" variant="solid">
                              Accent
                            </Chip>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
                            Pattern
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Chip size={chipSize} variant="text">
                              Text label
                            </Chip>
                            <Chip
                              size={chipSize}
                              tone="neutral"
                              variant="outline"
                              backgroundColorToken="var(--tb-color-surface-base)"
                              leadingIcon={<ClockIcon />}
                              className="text-[var(--tb-color-text-primary)]"
                            >
                              Recent search
                            </Chip>
                            <Chip
                              size={chipSize}
                              leadingIcon={<SparklesIcon />}
                            >
                              Icon + text
                            </Chip>
                            <Chip
                              size={chipSize}
                              tone={chipTone}
                              variant={chipVariant}
                              leadingIcon={<SparklesIcon />}
                              trailingIcon={<ChevronRightIcon />}
                            >
                              Interactive sample
                            </Chip>
                          </div>
                        </div>
                      </div>
                    </ComponentPreviewUnit>
                    <div className="mt-4 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      `Chip`은 Taste Buddy 제품 레벨의 공용 pill입니다. neutral source tag, semantic 상태, text-only label, icon + text label처럼 taste 맥락이 아닌 짧은 라벨을 담당합니다.
                    </div>
                    <p className="mt-4 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                      src/components/system/Chip.tsx
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">공용 Badge primitive</p>
                    <StatusTag tone="unused">Defined but unused</StatusTag>
                  </div>
                  <div className={cn(previewCardClass, "p-4")}>
                    <ComponentPreviewUnit
                      name="Badge"
                      hint="src/components/ui/badge.tsx"
                    >
                      <Badge variant={genericBadgeVariant}>
                        <SparklesIcon className="size-3" />
                        현재 선택된 배지
                      </Badge>
                      <Badge variant="default">기본</Badge>
                      <Badge variant="secondary">보조</Badge>
                      <Badge variant="outline">아웃라인</Badge>
                      <Badge variant="destructive">위험</Badge>
                    </ComponentPreviewUnit>
                    <div className="mt-4 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      `src/components/ui/badge.tsx`는 여전히 generic primitive로 남겨두고, 제품 안에서 반복되는 neutral/semantic chip 언어는 `Chip`으로 분리합니다.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Specialized TasteChip</p>
                      <StatusTag tone="used">Currently used</StatusTag>
                    </div>
                    <div className={cn(previewCardClass, "p-4")}>
                      <ComponentPreviewUnit
                        name="TasteChip"
                        hint="미각 포인트, 해석 메타"
                      >
                        <TasteChip taste={TASTE_TOKENS[accentTaste].label} value="현재 더 또렷한 포인트" />
                        <TasteChip taste="짠맛" value="보정 필요" />
                        <TasteChip taste="감칠맛" />
                        <TasteChip taste="첫 측정" tone="neutral" />
                      </ComponentPreviewUnit>
                      <div className="mt-4 grid gap-2 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                          구성 요소 설명
                        </p>
                        <div className="grid gap-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          <p>
                            `TastePointArrowBox` 자체는 왼쪽의 정사각형 micro marker만 담당합니다.
                          </p>
                          <p>
                            내부 구성은 `미각 컬러 배경 + 흰색 방향 화살표`이며, 크기 토큰은 `sm / md / lg`, 방향 토큰은 `increase / decrease / neutral`을 사용합니다.
                          </p>
                          <p>
                            카드 안에서 수치나 문장과 조합할 수 있지만, 컴포넌트 자체는 텍스트 없이 marker 역할만 유지합니다.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        `TasteChip`은 일반 `Chip`과 합치지 않고, taste palette와 해석 문맥을 직접 반영하는 도메인 전용 칩으로 유지합니다.
                      </div>
                      <p className="mt-4 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                        src/components/system/TasteChip.tsx
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">TastePointArrowBox</p>
                      <StatusTag tone="used">Currently used</StatusTag>
                    </div>
                    <div className={cn(previewCardClass, "p-4")}>
                      <ComponentPreviewUnit
                        name="TastePointArrowBox"
                        hint="미각 변화 delta marker"
                      >
                        <div className="grid w-full gap-3">
                          <div className="grid gap-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
                              Size token
                            </p>
                            <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-4">
                              <div className="grid grid-cols-6 gap-3">
                                {TASTE_POINT_ARROW_BOX_SIZE_PREVIEW_ITEMS.map((item) => (
                                  <div
                                    key={`taste-point-${item.size}-${item.tasteId}`}
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
                                {TASTE_POINT_ARROW_BOX_SIZE_GROUPS.map((group) => (
                                  <div
                                    key={`taste-point-size-token-${group.size}`}
                                    className="text-center"
                                  >
                                    <span className="font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                                      {group.size} {TASTE_POINT_ARROW_BOX_SIZE_TOKENS[group.size]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
                              Direction token
                            </p>
                            <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-4">
                              <div className="grid grid-cols-3 gap-3">
                                {(Object.values(TASTE_POINT_ARROW_BOX_DIRECTION_TOKENS) as TastePointArrowBoxTrend[]).map((direction) => (
                                  <div
                                    key={`taste-point-direction-${direction}`}
                                    className="grid min-w-0 grid-rows-[44px_auto] gap-2"
                                  >
                                    <div className="flex items-end justify-center">
                                      <TastePointArrowBox
                                        parentTaste={TASTE_TOKENS.umami.label}
                                        size="md"
                                        trend={direction}
                                      />
                                    </div>
                                    <div className="grid justify-items-center gap-0.5">
                                      <span className="font-mono text-[11px] text-[var(--tb-color-text-primary)]">
                                        {direction}
                                      </span>
                                      <span className="text-[11px] text-[var(--tb-color-text-muted)]">
                                        {TASTE_POINT_ARROW_BOX_DIRECTION_LABELS[direction]}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </ComponentPreviewUnit>
                      <div className="mt-4 grid gap-2 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                          구성 요소 설명
                        </p>
                        <div className="grid gap-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          <p>
                            `TastePointArrowBox` 자체는 왼쪽의 정사각형 micro marker만 담당합니다.
                          </p>
                          <p>
                            내부 구성은 `미각 컬러 배경 + 흰색 방향 화살표`이며, 크기 토큰은 `sm / md / lg`, 방향 토큰은 `increase / decrease / neutral`을 사용합니다.
                          </p>
                          <p>
                            카드 안에서 수치나 문장과 조합할 수 있지만, 컴포넌트 자체는 텍스트 없이 marker 역할만 유지합니다.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        `TastePointArrowBox`는 미각 변화 수치와 셰프 조정 포인트 앞에 붙는 taste-colored micro marker입니다. 일반 badge가 아니라, 해석 문장 안에서 짧게 리듬을 잡아주는 보조 표식으로 분리합니다.
                      </div>
                      <div className="mt-4 grid gap-2 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                          구성 요소 설명
                        </p>
                        <div className="grid gap-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          <p>
                            `TastePointArrowBox` 자체는 왼쪽의 정사각형 micro marker만 담당합니다.
                          </p>
                          <p>
                            내부 구성은 `미각 컬러 배경 + 흰색 방향 화살표`이며, 크기 토큰은 `sm / md / lg`, 방향 토큰은 `increase / decrease / neutral`을 사용합니다.
                          </p>
                          <p>
                            카드 안에서 수치나 문장과 조합할 수 있지만, 컴포넌트 자체는 텍스트 없이 marker 역할만 유지합니다.
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                        src/components/system/TastePointArrowBox.tsx
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 self-start">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Badge Family</p>
                    <StatusTag tone="used">Currently used</StatusTag>
                  </div>
                  <div className={cn(previewCardClass, "p-4")}>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <ComponentPreviewUnit
                        name="TCSBadge"
                        hint="활성 / 비활성 상태를 분리해 보여줍니다"
                      >
                        <div className="grid gap-3">
                          <TCSBadgeStateGroup title="활성 상태">
                            {TCS_BADGE_EXAMPLES.map((adjustments, index) => (
                              <TCSBadge
                                key={`badge-family-tcs-${index}`}
                                adjustments={[...adjustments]}
                              />
                            ))}
                          </TCSBadgeStateGroup>
                          <TCSBadgeStateGroup title="비활성 상태">
                            <TCSBadge disabled />
                          </TCSBadgeStateGroup>
                        </div>
                      </ComponentPreviewUnit>
                      <ComponentPreviewUnit
                        name="OutlineBadge"
                        hint="프로필 단계, 섹션 라벨"
                      >
                        <OutlineBadge>Starter Profile</OutlineBadge>
                      </ComponentPreviewUnit>
                      <ComponentPreviewUnit
                        name="StepBadge"
                        hint="플로우 진행 단계"
                      >
                        <StepBadge currentIndex={0} total={7} />
                      </ComponentPreviewUnit>
                      <ComponentPreviewUnit
                        name="StatusChip"
                        hint="예약 상태, 진행 단계"
                      >
                        <StatusChip color={STATUS_CONFIG[statusKey].color} backgroundColor={STATUS_CONFIG[statusKey].bg}>
                          {STATUS_CONFIG[statusKey].label}
                        </StatusChip>
                      </ComponentPreviewUnit>
                    </div>
                    <div className="mt-4 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      `TCSBadge`, `OutlineBadge`, `StepBadge`, `StatusChip`을 공식 badge 계열 컴포넌트로 유지합니다. 일반 라벨은 `Chip`, 미각 해석 메타는 `TasteChip`, delta marker는 `TastePointArrowBox`로 역할을 분리합니다.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-5">
                <div className={cn(previewCardClass, "p-4")}>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">TCSBadge 사용 예시</p>
                  <div className="mt-4 grid gap-4">
                    <TCSBadgeStateGroup title="활성 상태">
                      {TCS_BADGE_EXAMPLES.map((adjustments, index) => (
                        <TCSBadge
                          key={`tcs-badge-example-${index}`}
                          adjustments={[...adjustments]}
                        />
                      ))}
                    </TCSBadgeStateGroup>
                    <TCSBadgeStateGroup title="비활성 상태">
                      <TCSBadge disabled />
                    </TCSBadgeStateGroup>
                  </div>
                  <p className="mt-4 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                    src/components/system/TCSBadge.tsx
                  </p>
                </div>

                <div className={cn(previewCardClass, "p-4")}>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Chip 사용 예시</p>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <p className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]">Size</p>
                      <ChipSizeSelector activeSize={chipSize} onChange={setChipSize} />
                    </div>
                    <div className="grid gap-2">
                      <p className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]">Tone</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip size={chipSize} tone="neutral">Neutral</Chip>
                        <Chip size={chipSize} tone="success">Success</Chip>
                        <Chip size={chipSize} tone="warning" variant="outline">Warning</Chip>
                        <Chip size={chipSize} tone="accent" variant="solid">Accent</Chip>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <p className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]">Pattern</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip size={chipSize} variant="text">Text label</Chip>
                        <Chip
                          size={chipSize}
                          tone="neutral"
                          variant="outline"
                          backgroundColorToken="var(--tb-color-surface-base)"
                          leadingIcon={<ClockIcon />}
                          className="text-[var(--tb-color-text-primary)]"
                        >
                          Recent search
                        </Chip>
                        <Chip size={chipSize} leadingIcon={<SparklesIcon />}>Icon + text</Chip>
                        <Chip size={chipSize} trailingIcon={<ChevronRightIcon />}>Source link</Chip>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                    src/components/system/Chip.tsx
                  </p>
                </div>

                <div className={cn(previewCardClass, "p-4")}>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">OutlineBadge 사용 예시</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <OutlineBadge>Starter Profile</OutlineBadge>
                    <OutlineBadge>Building Profile</OutlineBadge>
                    <OutlineBadge>현재 프로필 반영</OutlineBadge>
                  </div>
                  <p className="mt-4 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                    src/components/system/OutlineBadge.tsx
                  </p>
                </div>

                <div className={cn(previewCardClass, "p-4")}>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">StepBadge 사용 예시</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StepBadge currentIndex={0} total={7} />
                    <StepBadge currentIndex={1} total={6} />
                    <StepBadge currentStep={3} total={6} />
                  </div>
                  <p className="mt-4 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                    src/components/system/StepBadge.tsx
                  </p>
                </div>

                <div className={cn(previewCardClass, "p-4")}>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">StatusChip 사용 예시</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(Object.keys(STATUS_CONFIG) as AppStatus[]).map((status) => (
                      <StatusChip
                        key={status}
                        color={STATUS_CONFIG[status].color}
                        backgroundColor={STATUS_CONFIG[status].bg}
                      >
                        {STATUS_CONFIG[status].label}
                      </StatusChip>
                    ))}
                  </div>
                  <p className="mt-4 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                    src/components/system/StatusChip.tsx
                  </p>
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="fields"
            title="Inputs / Fields"
            description="Shared generic fields are present but were not wired into the active app before this screen. 이번 정리에서는 로컬 패턴 대신 실제 파일이 있는 필드 컴포넌트만 남겨 두었습니다."
            controls={
              <>
                <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Disabled</span>
                  <Switch checked={fieldDisabled} onCheckedChange={setFieldDisabled} />
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Error state</span>
                  <Switch checked={fieldError} onCheckedChange={setFieldError} />
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Focus ring</span>
                  <Switch checked={fieldFocus} onCheckedChange={setFieldFocus} />
                </div>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.fields}
            previewStyle={previewStyle}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Generic primitives</p>
                  <StatusTag tone="unused">Defined but unused</StatusTag>
                </div>
                <Card className="gap-4 border-[var(--tb-color-border-default)]">
                  <CardHeader className="gap-1">
                    <CardTitle className="text-[14px]">Field set</CardTitle>
                    <CardDescription>Input, textarea, select, checkbox, radio, switch</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="flex flex-wrap gap-2">
                      <SectionEyebrow>Input</SectionEyebrow>
                      <SectionEyebrow>Textarea</SectionEyebrow>
                      <SectionEyebrow>Select</SectionEyebrow>
                      <SectionEyebrow>Checkbox</SectionEyebrow>
                      <SectionEyebrow>RadioGroup</SectionEyebrow>
                      <SectionEyebrow>Switch</SectionEyebrow>
                    </div>
                    <Input
                      disabled={fieldDisabled}
                      aria-invalid={fieldError}
                      className={genericFieldClass}
                      placeholder="사용자 이름"
                    />
                    <Textarea
                      disabled={fieldDisabled}
                      aria-invalid={fieldError}
                      className={genericFieldClass}
                      placeholder="현재 미각 프로필에 대한 메모를 남겨 보세요."
                    />
                    <Select value={fieldSelect} onValueChange={setFieldSelect} disabled={fieldDisabled}>
                      <SelectTrigger aria-invalid={fieldError} className={genericFieldClass}>
                        <SelectValue placeholder="프로필 단계 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter Profile</SelectItem>
                        <SelectItem value="building">Building Profile</SelectItem>
                        <SelectItem value="refined">Refined Profile</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="grid gap-3 rounded-[16px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] p-3">
                      <label className="flex items-center gap-3 text-[13px] text-[var(--tb-color-text-primary)]">
                        <Checkbox
                          disabled={fieldDisabled}
                          checked={fieldCheckbox}
                          onCheckedChange={(checked) => setFieldCheckbox(Boolean(checked))}
                        />
                        예약 정보 동기화
                      </label>
                      <RadioGroup value={fieldRadio} onValueChange={setFieldRadio} className="gap-2">
                        {[
                          { value: "balanced", label: "밸런스 중심" },
                          { value: "sweeter", label: "단맛 강조" },
                          { value: "salty", label: "짠맛 강조" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-3 text-[13px] text-[var(--tb-color-text-primary)]"
                          >
                            <RadioGroupItem disabled={fieldDisabled} value={option.value} />
                            {option.label}
                          </label>
                        ))}
                      </RadioGroup>
	                      <div className="flex items-center justify-between">
	                        <span className="text-[13px] text-[var(--tb-color-text-primary)]">Push 알림</span>
	                        <Switch checked={fieldSwitch} onCheckedChange={setFieldSwitch} disabled={fieldDisabled} />
	                      </div>
	                      <div className="grid gap-2 rounded-[12px] bg-[var(--tb-color-surface-base)] p-3">
	                        <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
	                          Switch sizes
	                        </span>
	                        <div className="flex flex-wrap items-center gap-4">
	                          {[
	                            { label: "sm", size: "sm" as const },
	                            { label: "md", size: "md" as const },
	                            { label: "lg", size: "lg" as const },
	                          ].map((item) => (
	                            <label
	                              key={item.size}
	                              className="flex items-center gap-2 text-[12px] font-semibold text-[var(--tb-color-text-secondary)]"
	                            >
	                              <Switch
	                                size={item.size}
	                                checked={fieldSwitch}
	                                onCheckedChange={setFieldSwitch}
	                                disabled={fieldDisabled}
	                              />
	                              {item.label}
	                            </label>
	                          ))}
	                        </div>
	                      </div>
	                    </div>
	                  </CardContent>
	                </Card>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Current product field component</p>
                  <StatusTag tone="used">Currently used</StatusTag>
                </div>
                <div className={cn(previewCardClass, "grid gap-3 p-4")}>
                  <div className="flex flex-wrap gap-2">
                    <SectionEyebrow>SelectionCard</SectionEyebrow>
                  </div>
                  <div className="grid gap-2">
                    <SelectionCard
                      description="쉐프의 의도는 살리되 전개는 더 가볍고 또렷하게 느끼고 싶어요."
                      disabled={fieldDisabled}
                      title="가벼운 시작이 좋아요"
                    />
                    <SelectionCard
                      description="메인으로 갈수록 밀도감이 자연스럽게 쌓이는 흐름이 편안해요."
                      disabled={fieldDisabled}
                      indicator="checkbox"
                      selected
                      title="후반 무게감은 천천히"
                    />
                  </div>
                  <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    `SelectionCard`만 현재 공용 field 계열 컴포넌트로 유지했습니다. 검색 행이나 textarea shell처럼 feature 안에서만 쓰는 inline 패턴은 디자인 시스템 컴포넌트 목록에서 제외했습니다.
                  </div>
                  <p className="font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                    src/components/system/SelectionCard.tsx
                  </p>
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="cards"
            title="Cards / Lists"
            description="공용 카드부터 예약, 프로필, 식후 피드백, 미각 설문 플로우까지 현재 앱에서 카드 컴포넌트처럼 쓰이는 패턴을 모두 모았습니다."
            controls={
              <>
                <SliderControl label="Card radius" value={cardRadius} min={8} max={32} onChange={setCardRadius} />
                <SliderControl label="Inner gap" value={gap} min={6} max={20} onChange={setGap} />
                <SliderControl label="Border width" value={borderWidth} min={1} max={3} unit="px" onChange={setBorderWidth} />
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.cards}
            previewStyle={previewStyle}
          >
            <div style={{ ["--tb-space-12" as string]: `${gap}px`, ["--tb-radius-20" as string]: `${cardRadius}px` }}>
              <div className="mb-3 rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                <span className="font-semibold text-[var(--tb-color-text-primary)]">Current rule:</span>{" "}
                active card stacks use <span className="font-mono">12px / gap-3</span> between cards. The gallery below is tightened to that same rhythm.
              </div>
              <CardGallery
                accentTaste={accentTaste}
                ctaTone={ctaTone}
                onNavigateToSection={handleComponentNavigate}
                statusLabel={STATUS_CONFIG[statusKey].label}
                statusColor={STATUS_CONFIG[statusKey].color}
                statusBackgroundColor={STATUS_CONFIG[statusKey].bg}
              />
            </div>
            <div className="mt-6 grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    Reusable interpretation surfaces
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    페이지 안에서 반복 조합되는 카드/해석 계열 building block을 여기로 모아, 구조 분류와 실물 preview 역할을 분리했습니다.
                  </p>
                </div>
                <StatusTag tone="used">Currently used</StatusTag>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {cardSectionPreviewEntries.map((entry) => (
                  <FilePreviewCard
                    key={entry.file}
                    entry={entry}
                    previewCardClass={previewCardClass}
                  />
                ))}
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    Current home cards
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    지금 HomePage에 실제로 쓰이는 카드들을 개별 컴포넌트와 스택 프리뷰로 함께 보관합니다.
                  </p>
                </div>
                <StatusTag tone="used">Currently used</StatusTag>
              </div>
              <div className="flex flex-wrap gap-2">
                <SectionEyebrow>HomeDiningPreparationCard</SectionEyebrow>
                <SectionEyebrow>ProfileConfidenceCard</SectionEyebrow>
                <SectionEyebrow>HomeChefMatchCard</SectionEyebrow>
                <SectionEyebrow>InterpretationCard</SectionEyebrow>
                <SectionEyebrow>TasteMeasurementMiniCta</SectionEyebrow>
              </div>
              <CurrentHomeCardArchive onNavigateToSection={handleComponentNavigate} />
            </div>
            <div className="mt-6 grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    Archived legacy home cards
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    예전에 사용하던 홈 카드들을 개별 컴포넌트와 섹션 단위로 따로 보관해 두었습니다.
                  </p>
                </div>
                <StatusTag tone="note">Archived for reuse</StatusTag>
              </div>
              <div className="flex flex-wrap gap-2">
                <SectionEyebrow>LegacyHomeChefCard</SectionEyebrow>
                <SectionEyebrow>LegacyHomeTasteProfileCard</SectionEyebrow>
                <SectionEyebrow>LegacyHomeSpecialNoteCard</SectionEyebrow>
                <SectionEyebrow>LegacyHomeHistoryCard</SectionEyebrow>
              </div>
              <LegacyHomeCardArchive />
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="navigation"
            title="Navigation"
            description="TopAppBar와 BottomTabBar를 실제 앱 셸 컴포넌트로 분리해 보여줍니다. 알림/메뉴 액션은 그대로 연결하되, NotificationPanel과 AppMenuDrawer 분류는 오버레이 섹션으로 옮겨 중복을 줄였습니다."
            controls={
              <>
                <ControlBlock label="Active app tab">
                  <SegmentedControl
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                      { value: "home", label: "Home" },
                      { value: "analysis", label: "Analysis" },
                      { value: "reservation", label: "Reservation" },
                      { value: "profile", label: "Profile" },
                    ]}
                  />
                </ControlBlock>
                <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Show back button</span>
                  <Switch checked={showBack} onCheckedChange={setShowBack} />
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Unread indicator</span>
                  <Switch
                    checked={showUnreadNotifications}
                    onCheckedChange={setShowUnreadNotifications}
                  />
                </div>
                <ControlBlock label="Generic tabs">
                  <SegmentedControl
                    value={genericTabsValue}
                    onChange={setGenericTabsValue}
                    options={[
                      { value: "overview", label: "Overview" },
                      { value: "tokens", label: "Tokens" },
                      { value: "patterns", label: "Patterns" },
                    ]}
                  />
                </ControlBlock>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.navigation}
            previewStyle={previewStyle}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Current app navigation</p>
                  <StatusTag tone="used">Currently used</StatusTag>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SectionEyebrow>TopAppBar</SectionEyebrow>
                  <SectionEyebrow>BottomTabBar</SectionEyebrow>
                </div>
                <div className="overflow-hidden rounded-[28px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)]">
                  <TopAppBar
                    showBack={showBack}
                    title={showBack ? "식후 피드백" : undefined}
                    onBack={() => undefined}
                    onStartMeasurement={() => undefined}
                    onOpenNotifications={() => setNotificationPanelOpen(true)}
                    onOpenMenu={() => setMenuDrawerOpen(true)}
                    hasUnreadNotifications={showUnreadNotifications}
                  />
                  <div className="grid min-h-[240px] content-center gap-3 px-5 py-6">
                    <div className={cn(previewPanelClass, "p-4")}>
                      <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                        앱 셸 미리보기
                      </p>
                      <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        알림 아이콘과 메뉴 아이콘은 실제 오버레이 컴포넌트를 열도록 연결되어 있습니다.
                      </p>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] px-4 py-3">
                      <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        현재 탭
                      </span>
                      <span className="text-[12px] text-[var(--tb-color-text-muted)]">
                        {APP_TAB_LABELS[activeTab]}
                      </span>
                    </div>
                  </div>
                  <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Generic tabs</p>
                  <StatusTag tone="unused">Defined but unused</StatusTag>
                </div>
                <Card className="border-[var(--tb-color-border-default)]">
                  <CardHeader>
                    <CardTitle className="text-[14px]">Segmented preview</CardTitle>
                    <CardDescription>Built from src/components/ui/tabs.tsx</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <SectionEyebrow>Tabs</SectionEyebrow>
                    </div>
                    <Tabs value={genericTabsValue} onValueChange={setGenericTabsValue}>
                      <TabsList className="w-full">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tokens">Tokens</TabsTrigger>
                        <TabsTrigger value="patterns">Patterns</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview" className="rounded-[16px] bg-[var(--tb-color-surface-muted)] p-4 text-[13px] text-[var(--tb-color-text-subtle)]">
                        Active app shell uses TopAppBar + BottomTabBar instead.
                      </TabsContent>
                      <TabsContent value="tokens" className="rounded-[16px] bg-[var(--tb-color-surface-muted)] p-4 text-[13px] text-[var(--tb-color-text-subtle)]">
                        This primitive is a good fit for future internal settings or segmented panels.
                      </TabsContent>
                      <TabsContent value="patterns" className="rounded-[16px] bg-[var(--tb-color-surface-muted)] p-4 text-[13px] text-[var(--tb-color-text-subtle)]">
                        The repo defines it, but production screens still use one-off patterns.
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="feedback"
            title="Feedback"
            description="Alerts, progress, skeleton, empty states, spinner, and toast surfaces that help review the current interaction language."
            controls={
              <>
                <SliderControl label="Progress" value={progress} min={0} max={100} unit="%" onChange={setProgress} />
                <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Destructive alert</span>
                  <Switch checked={destructiveAlert} onCheckedChange={setDestructiveAlert} />
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">Show skeleton state</span>
                  <Switch checked={showSkeleton} onCheckedChange={setShowSkeleton} />
                </div>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.feedback}
            previewStyle={previewStyle}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Live feedback components</p>
                  <StatusTag tone="unused">Mostly defined but unused</StatusTag>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SectionEyebrow>Alert</SectionEyebrow>
                  <SectionEyebrow>Progress</SectionEyebrow>
                  <SectionEyebrow>Skeleton</SectionEyebrow>
                  <SectionEyebrow>Spinner</SectionEyebrow>
                </div>
                <Alert
                  variant={destructiveAlert ? "destructive" : "default"}
                  className="rounded-[var(--tb-radius-20)]"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <AlertTitle>{destructiveAlert ? "주의가 필요한 상태" : "프로필이 업데이트됐습니다"}</AlertTitle>
                  <AlertDescription>
                    {destructiveAlert
                      ? "로컬 preview에서만 보이는 경고 상태입니다."
                      : "다음 예약 추천에 반영할 수 있는 최신 프로필이 준비됐어요."}
                  </AlertDescription>
                </Alert>
                <div className={cn(previewCardClass, "p-4")}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">Calibration progress</span>
                    <span className="text-[12px] text-[var(--tb-color-text-muted)]">{progress}%</span>
                  </div>
                  <Progress className="mt-3" value={progress} />
                </div>
                <div className={cn(previewCardClass, "p-4")}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">Step indicator</span>
                    <span className="text-[12px] text-[var(--tb-color-text-muted)]">Onboarding / Taste survey</span>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <div className="rounded-[16px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-base)] px-4 py-4">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">Default</p>
                      <StepIndicator className="mt-3" currentIndex={1} total={4} />
                    </div>
                    <div className="rounded-[16px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-base)] px-4 py-4">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">Taste accent</p>
                      <StepIndicator
                        className="mt-3"
                        currentIndex={2}
                        total={6}
                        activeColor={TASTE_TOKENS.sweet.palette.main}
                      />
                    </div>
                  </div>
                </div>
                <div className={cn(previewCardClass, "p-4")}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-primary)]">
                      {showSkeleton ? <Skeleton className="h-6 w-6 rounded-full" /> : <Spinner />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {showSkeleton ? (
                        <div className="grid gap-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      ) : (
                        <>
                          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Loading / Skeleton</p>
                          <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">Spinner is custom to this page; skeleton primitive comes from src/components/ui/skeleton.tsx.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className={cn(previewCardClass, "p-4")}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Empty state</p>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">`EmptyState`가 이제 DiningPage의 실제 empty 예약 상태에 연결되어 있습니다.</p>
                    </div>
                    <StatusTag tone="used">Currently used</StatusTag>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SectionEyebrow>EmptyState</SectionEyebrow>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className={cn(previewPanelClass, "p-2")}>
                      <EmptyState
                        title="아직 예약이 없어요"
                        description="프로필이 준비되면 맞춤 다이닝을 시작할 수 있어요."
                        icon={<CalendarIcon size={ICON_TOKENS.size.lg} />}
                      />
                    </div>
                    <div className={cn(previewPanelClass, "p-2")}>
                      <EmptyState
                        title="아직 추천 셰프가 없어요"
                        description="다음 측정과 예약 데이터를 쌓으면 더 잘 맞는 다이닝 후보를 추천할 수 있어요."
                        actionLabel="예약 추천 보기"
                        onAction={() => undefined}
                        icon={<UtensilsIcon size={ICON_TOKENS.size.lg} />}
                      />
                    </div>
                  </div>
                </div>
                <div className={cn(previewCardClass, "p-4")}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Toast surface</p>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">테이스트 리스트 액션 뒤에 뜨는 실제 앱 토스트 표면입니다.</p>
                    </div>
                    <StatusTag tone="used">Currently used</StatusTag>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SectionEyebrow>ToastSurface</SectionEyebrow>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-[20px] bg-[var(--tb-color-bg-page)] p-4">
                    <ToastSurface
                      actionLabel="보기"
                      media={(
                        <span className="flex size-10 items-center justify-center rounded-[12px] bg-[var(--tb-taste-umami-tint-surface)] text-[var(--tb-taste-umami-main)]">
                          <UtensilsIcon size={ICON_TOKENS.size.md} strokeWidth={1.8} />
                        </span>
                      )}
                      message="나중에 비교할 곳에 저장됨"
                    />
                    <div className="rounded-[16px] bg-[var(--tb-color-surface-base)] px-3 py-3">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        Usage
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        고정 위치는 화면별 컨테이너가 담당하고, ToastSurface는 media, message, action label만 렌더링합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="overlay"
            title="Overlay"
            description="generic overlay primitive와 현재 제품이 실제로 쓰는 NotificationPanel, AppMenuDrawer를 한 곳에 모았습니다. 이번 정리에서 overlay 분류는 이 섹션으로만 모아 중복을 없앴습니다."
            controls={
              <>
                <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
                <Button variant="outline" onClick={() => setSheetOpen(true)}>Open bottom sheet</Button>
                <Button variant="secondary" onClick={() => setPopoverOpen((previous) => !previous)}>Toggle popover</Button>
                <Button variant="ghost" onClick={() => setTooltipOpen((previous) => !previous)}>Toggle tooltip</Button>
                <Button variant="secondary" onClick={() => setNotificationPanelOpen(true)}>Open notifications</Button>
                <Button variant="outline" onClick={() => setMenuDrawerOpen(true)}>Open menu drawer</Button>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.overlay}
            previewStyle={previewStyle}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-[var(--tb-color-border-default)]">
                <CardHeader>
                  <CardTitle className="text-[14px]">Overlay triggers</CardTitle>
                  <CardDescription>All previews are interactive and use the actual component files in src/components/ui.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <div className="flex w-full flex-wrap gap-2">
                    <SectionEyebrow>Dialog</SectionEyebrow>
                    <SectionEyebrow>Sheet</SectionEyebrow>
                    <SectionEyebrow>Popover</SectionEyebrow>
                    <SectionEyebrow>Tooltip</SectionEyebrow>
                  </div>
                  <Button onClick={() => setDialogOpen(true)}>Dialog</Button>
                  <Button variant="outline" onClick={() => setSheetOpen(true)}>Bottom Sheet</Button>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="secondary">Popover</Button>
                    </PopoverTrigger>
                    <PopoverContent className="space-y-2">
                      <p className="text-[13px] font-semibold">Source reminder</p>
                      <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        Persist token updates in <span className="font-mono">src/styles/design-system.css</span> and{" "}
                        <span className="font-mono">src/constants/designTokens.ts</span>.
                      </p>
                    </PopoverContent>
                  </Popover>
                  <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost">Tooltip</Button>
                    </TooltipTrigger>
                    <TooltipContent>Internal component audit helper</TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>

              <div className={cn(previewCardClass, "p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Current product overlays</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      메인 앱은 generic primitive보다 제품 전용 overlay shell을 더 자주 사용합니다. 아래 버튼은 실제 컴포넌트를 그대로 엽니다.
                    </p>
                  </div>
                  <StatusTag tone="used">Currently used</StatusTag>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SectionEyebrow>NotificationPanel</SectionEyebrow>
                  <SectionEyebrow>AppMenuDrawer</SectionEyebrow>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className={cn(previewPanelClass, "p-4")}>
                    <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">NotificationPanel</p>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      상단 app bar에서 열리는 드롭다운형 알림 패널입니다. sticky header, unread dot, read/unread row 상태를 포함합니다.
                    </p>
                    <Button className="mt-3" size="sm" onClick={() => setNotificationPanelOpen(true)}>
                      패널 열기
                    </Button>
                  </div>
                  <div className={cn(previewPanelClass, "p-4")}>
                    <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">AppMenuDrawer</p>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      우측 glass drawer 안에 프로필 요약과 측정/정확도 향상 액션이 들어 있습니다.
                    </p>
                    <Button className="mt-3" variant="outline" size="sm" onClick={() => setMenuDrawerOpen(true)}>
                      드로어 열기
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    Shared bottom sheet shell
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    제품 전용 bottom sheet frame을 문서화해, 기능별 drawer가 같은 레이아웃 언어를 공유하도록 정리했습니다.
                  </p>
                </div>
                <StatusTag tone="used">Currently used</StatusTag>
              </div>
              <div className="grid gap-4">
                {overlaySectionPreviewEntries.map((entry) => (
                  <FilePreviewCard
                    key={entry.file}
                    entry={entry}
                    previewCardClass={previewCardClass}
                  />
                ))}
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>미각 프로필 공유</DialogTitle>
                  <DialogDescription>
                    이 dialog는 <span className="font-mono">src/components/ui/dialog.tsx</span> 에서 직접 렌더링됩니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-[16px] bg-[var(--tb-color-surface-muted)] p-4 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  우측 하단 플로팅 메뉴로 현재 앱 런타임에는 즉시 반영할 수 있고, 코드 기준 영구 반영은 원본 파일 수정이 필요합니다.
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>닫기</Button>
                  <Button onClick={() => setDialogOpen(false)}>확인</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetContent side="bottom" className="rounded-t-[28px]">
                <SheetHeader>
                  <SheetTitle>Bottom sheet preview</SheetTitle>
                  <SheetDescription>
                    현재 앱은 custom drawer를 더 많이 쓰지만, generic sheet도 코드에 준비되어 있습니다.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-3 px-4 pb-6">
                  <div className="rounded-[20px] bg-[var(--tb-color-surface-muted)] px-4 py-4 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    예약 보정, 빠른 선택, 프로필 설명 같은 lightweight overlay에 적합합니다.
                  </div>
                  <Button className="w-full" onClick={() => setSheetOpen(false)}>닫기</Button>
                </div>
              </SheetContent>
            </Sheet>
          </PlaygroundSection>

          <PlaygroundSection
            id="appSpecific"
            title="App-specific Components"
            description="Taste Buddy 고유의 시각 언어를 만드는 shared component와 신규 screen composite를 함께 모았습니다. 반복되는 작은 컴포넌트부터 최근 추가된 정확도 향상/예약 확정 플로우까지 같은 기준으로 확인할 수 있습니다."
            controls={
              <>
                <ControlBlock label="Taste accent" hint={TASTE_TOKENS[accentTaste].label}>
                  <SegmentedControl
                    value={accentTaste}
                    onChange={setAccentTaste}
                    options={TASTE_OPTIONS.map((taste) => ({
                      value: taste,
                      label: TASTE_TOKENS[taste].label,
                    }))}
                  />
                </ControlBlock>
                <div className="grid min-w-0 gap-3 rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        Profile avatar previews
                      </p>
                      <p className="mt-1 max-w-full text-[11px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        6가지 미각 값을 조절해 TasteProfile, Signature, Bloom 아바타 반영을 함께 확인합니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetAvatarPreviewControls}
                      className="shrink-0 rounded-full border border-[var(--tb-color-border-default)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                    >
                      초기화
                    </button>
                  </div>
                  <div className="grid min-w-0 gap-3">
                    {TASTE_OPTIONS.map((tasteId) => (
                      <SliderControl
                        key={`avatar-taste-control-${tasteId}`}
                        label={TASTE_TOKENS[tasteId].label}
                        value={avatarTasteValues[tasteId]}
                        min={0.5}
                        max={10}
                        step={0.1}
                        unit=" mM"
                        onChange={(value) => updateAvatarTasteValue(tasteId, value)}
                      />
                    ))}
                  </div>
                  <div className="grid min-w-0 gap-3 border-t border-[var(--tb-color-border-default)] pt-3">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                          Bloom shared count
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          하나의 공통 개수로 꽃잎 수와 별 꼭짓점 수를 맞춥니다.
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 font-mono text-[11px] text-[var(--tb-color-text-muted)]">
                        {bloomShapeCount}개
                      </span>
                    </div>
                    <SliderControl
                      label="공통 개수"
                      value={bloomShapeCount}
                      min={PALATE_BLOOM_SHAPE_COUNT_LIMITS.min}
                      max={PALATE_BLOOM_SHAPE_COUNT_LIMITS.max}
                      step={1}
                      unit="개"
                      onChange={(value) => setBloomShapeCount(Math.round(value))}
                    />
                    <ControlBlock label="꽃잎 형태" hint={bloomPetalShape}>
                      <SegmentedControl
                        value={bloomPetalShape}
                        onChange={setBloomPetalShape}
                        options={BLOOM_PETAL_SHAPE_OPTIONS}
                      />
                    </ControlBlock>
                    <ControlBlock label="별 형태" hint={bloomStarShape}>
                      <SegmentedControl
                        value={bloomStarShape}
                        onChange={setBloomStarShape}
                        options={BLOOM_STAR_SHAPE_OPTIONS}
                      />
                    </ControlBlock>
                    <ControlBlock label="코어 형태" hint={bloomCoreShape}>
                      <SegmentedControl
                        value={bloomCoreShape}
                        onChange={setBloomCoreShape}
                        options={BLOOM_CORE_SHAPE_OPTIONS}
                      />
                    </ControlBlock>
                  </div>
                </div>
                <ControlBlock label="Status chip">
                  <SegmentedControl
                    value={statusKey}
                    onChange={setStatusKey}
                    options={Object.keys(STATUS_CONFIG).map((status) => ({
                      value: status as AppStatus,
                      label: STATUS_CONFIG[status as AppStatus].label,
                    }))}
                  />
                </ControlBlock>
                <ControlBlock label="Mini CTA tone">
                  <SegmentedControl
                    value={ctaTone}
                    onChange={setCtaTone}
                    options={[
                      { value: "alert", label: "Alert" },
                      { value: "neutral", label: "Neutral" },
                    ]}
                  />
                </ControlBlock>
                <ControlBlock label="Accuracy stage">
                  <SegmentedControl
                    value={improveAccuracyStage}
                    onChange={setImproveAccuracyStage}
                    options={[
                      { value: "Starter", label: "Starter" },
                      { value: "Building", label: "Building" },
                      { value: "Refined", label: "Refined" },
                    ]}
                  />
                </ControlBlock>
                <Button variant="outline" onClick={() => setConfirmationPreviewKey((value) => value + 1)}>
                  Restart confirmation preview
                </Button>
              </>
            }
            sources={PLAYGROUND_SECTION_SOURCES.appSpecific}
            previewStyle={previewStyle}
          >
            <div className="grid gap-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Active shared components</p>
                    <StatusTag tone="used">Currently used</StatusTag>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SectionEyebrow>Chip</SectionEyebrow>
                    <SectionEyebrow>OutlineBadge</SectionEyebrow>
                    <SectionEyebrow>StatusChip</SectionEyebrow>
                    <SectionEyebrow>TasteChip</SectionEyebrow>
                    <SectionEyebrow>TasteProfileAvatar</SectionEyebrow>
                    <SectionEyebrow>PalateSignatureAvatar</SectionEyebrow>
                    <SectionEyebrow>PalateBloomAvatar</SectionEyebrow>
                    <SectionEyebrow>PalateOrbAvatar</SectionEyebrow>
                    <SectionEyebrow>TasteMeasurementMiniCta</SectionEyebrow>
                    <SectionEyebrow>SectionCard</SectionEyebrow>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Chip size="sm">source label</Chip>
                      <OutlineBadge>{TASTE_TOKENS[accentTaste].label} Focus</OutlineBadge>
                      <StatusChip color={STATUS_CONFIG[statusKey].color} backgroundColor={STATUS_CONFIG[statusKey].bg}>
                        {STATUS_CONFIG[statusKey].label}
                      </StatusChip>
                      <TasteChip taste={TASTE_TOKENS[accentTaste].label} value="현재 더 또렷한 포인트" />
                    </div>
                    <TasteMeasurementMiniCta
                      title="재측정으로 프로필 업데이트"
                      description={`${TASTE_TOKENS[accentTaste].label} 쪽 반응을 중심으로 다음 예약 전 빠르게 프로필을 보정할 수 있어요.`}
                      meta="최근 측정 후 6일 경과"
                      actionLabel="지금 측정하기"
                      onAction={() => undefined}
                      tone={ctaTone}
                    />
                    <div
                      className={cn(previewCardClass, "grid gap-4 p-4")}
                      data-component-preview="TasteProfileAvatar"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                            TasteProfileAvatar
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                            미각 측정값 6축을 비율로 섞어 기본 프로필의 멀티컬러 그라데이션을 만듭니다.
                          </p>
                        </div>
                        <SourceFileLink
                          file="src/components/system/TasteProfileAvatar.tsx"
                          label="원본"
                          variant="chip"
                        />
                      </div>
                      <div className={avatarPreviewGridClass}>
                        {PROFILE_AVATAR_SIZE_KEYS.map((size) => (
                          <div
                            key={`taste-profile-avatar-size-preview-${size}`}
                            className={avatarPreviewTileClass}
                          >
                            <div className={avatarPreviewVisualClass}>
                              <TasteProfileAvatar
                                ariaLabel={`TasteProfileAvatar ${size} preview`}
                                initials={createTasteProfileAvatarInitials("신준호")}
                                measurementSnapshot={avatarMeasurementSnapshot}
                                size={size}
                              />
                            </div>
                            <div className={avatarPreviewMetaClass}>
                              <p className={avatarPreviewLabelClass}>
                                {size} · {PROFILE_AVATAR_SIZE_TOKENS[size]}px
                              </p>
                              <p className={avatarPreviewDescriptionClass}>
                                실시간 컨트롤 값으로 그라데이션 반영 비율이 바뀝니다.
                              </p>
                            </div>
                            <div className={avatarPreviewChipRowClass}>
                              {livePalateTopTasteIds.map((tasteId) => (
                                <TasteChip
                                  key={`taste-profile-live-${size}-${tasteId}`}
                                  taste={TASTE_TOKENS[tasteId].label}
                                  value={`${avatarTasteValues[tasteId].toFixed(1)} mM`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={cn(avatarPreviewSupportClass, "grid gap-2")}>
                        {TASTE_OPTIONS.map((tasteId) => {
                          const ratioTotal = TASTE_OPTIONS.reduce(
                            (sum, id) => sum + avatarTasteValues[id],
                            0,
                          );
                          const ratio = Math.round((avatarTasteValues[tasteId] / ratioTotal) * 100);

                          return (
                            <div
                              key={`avatar-taste-ratio-${tasteId}`}
                              className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-2 text-[11px]"
                            >
                              <span className="font-semibold text-[var(--tb-color-text-muted)]">
                                {TASTE_TOKENS[tasteId].label}
                              </span>
                              <span className="h-2 overflow-hidden rounded-full bg-[var(--tb-color-surface-muted)]">
                                <span
                                  className="block h-full rounded-full"
                                  style={{
                                    width: `${ratio}%`,
                                    backgroundColor: TASTE_TOKENS[tasteId].palette.main,
                                  }}
                                />
                              </span>
                              <span className="text-right font-mono text-[var(--tb-color-text-muted)]">
                                {ratio}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div
                      className={cn(previewCardClass, "grid gap-4 p-4")}
                      data-component-preview="PalateSignatureAvatar"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                            PalateSignatureAvatar
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                            여섯 미각 비율을 차트가 아닌 개인 미각 시그니처형 halo avatar로 번역합니다.
                          </p>
                        </div>
                        <SourceFileLink
                          file="src/components/system/PalateSignatureAvatar.tsx"
                          label="원본"
                          variant="chip"
                        />
                      </div>
                      <div className={avatarPreviewGridClass}>
                        {PALATE_SIGNATURE_LIVE_PREVIEWS.map(({ initials, size, variant }) => (
                          <div
                            key={`palate-signature-live-preview-${size}`}
                            className={avatarPreviewTileClass}
                          >
                            <div className={avatarPreviewVisualClass}>
                              <PalateSignatureAvatar
                                ariaLabel={`${size} live palate signature avatar`}
                                initials={initials}
                                profile={livePalateAvatarProfile}
                                size={size}
                                variant={variant}
                              />
                            </div>
                            <div className={avatarPreviewMetaClass}>
                              <p className={avatarPreviewLabelClass}>
                                {size} · {PROFILE_AVATAR_SIZE_TOKENS[size]}px
                              </p>
                              <p className={avatarPreviewDescriptionClass}>
                                실시간 컨트롤 값으로 halo 구조와 중심부가 함께 바뀝니다.
                              </p>
                            </div>
                            <div className={avatarPreviewChipRowClass}>
                              {livePalateTopTasteIds.map((tasteId) => (
                                <TasteChip
                                  key={`palate-signature-live-${size}-${tasteId}`}
                                  taste={TASTE_TOKENS[tasteId].label}
                                  value={`${avatarTasteValues[tasteId].toFixed(1)} mM`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={cn(avatarPreviewSupportClass, "flex flex-wrap items-center gap-3")}>
                        {PROFILE_AVATAR_SIZE_KEYS.map((size) => (
                          <PalateSignatureAvatar
                            key={`palate-signature-token-row-${size}`}
                            ariaLabel={`${size} initialed palate signature avatar`}
                            initials={size.toUpperCase()}
                            profile={livePalateAvatarProfile}
                            showInitials
                            size={size}
                            variant="halo"
                          />
                        ))}
                        <p className="min-w-[160px] flex-1 text-[11px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          세 아바타가 같은 sm 32px, md 42px, lg 68px, xl 96px 토큰을 공유합니다.
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(previewCardClass, "grid gap-4 p-4")}
                      data-component-preview="PalateBloomAvatar"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                            PalateBloomAvatar
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                            미각 우선순위를 꽃잎과 이중 별 레이어로 쌓아 프로필용 Palate Bloom mark로 번역합니다.
                          </p>
                        </div>
                        <SourceFileLink
                          file="src/components/system/PalateBloomAvatar.tsx"
                          label="원본"
                          variant="chip"
                        />
                      </div>
                      <div className={avatarPreviewGridClass}>
                        {PROFILE_AVATAR_SIZE_KEYS.map((size) => (
                          <div
                            key={`palate-bloom-live-preview-${size}`}
                            className={avatarPreviewTileClass}
                          >
                            <div className={avatarPreviewVisualClass}>
                              <PalateBloomAvatar
                                coreShape={bloomCoreShape}
                                petalShape={bloomPetalShape}
                                profile={livePalateAvatarProfile}
                                shapeCountOverride={bloomShapeCount}
                                size={size}
                                starShape={bloomStarShape}
                              />
                            </div>
                            <div className={avatarPreviewMetaClass}>
                              <p className={avatarPreviewLabelClass}>
                                {size} · {PROFILE_AVATAR_SIZE_TOKENS[size]}px
                              </p>
                              <p className={avatarPreviewDescriptionClass}>
                                하나의 seed count로 꽃잎과 이중 별 개수가 함께 바뀝니다.
                              </p>
                            </div>
                            <div className={avatarPreviewChipRowClass}>
                              {livePalateTopTasteIds.map((tasteId) => (
                                <TasteChip
                                  key={`palate-bloom-live-${size}-${tasteId}`}
                                  taste={TASTE_TOKENS[tasteId].label}
                                  value={`${avatarTasteValues[tasteId].toFixed(1)} mM`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={cn(avatarPreviewSupportClass, "grid gap-3")}>
                        <div className="flex flex-wrap items-center gap-3">
                          {PROFILE_AVATAR_SIZE_KEYS.map((size) => (
                            <PalateBloomAvatar
                              coreShape={bloomCoreShape}
                              petalShape={bloomPetalShape}
                              key={`palate-bloom-token-row-${size}`}
                              profile={livePalateAvatarProfile}
                              shapeCountOverride={bloomShapeCount}
                              size={size}
                              starShape={bloomStarShape}
                            />
                          ))}
                          <p className="min-w-[160px] flex-1 text-[11px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                            6개 미각의 상대 점유율과 순위 간 격차를 함께 읽어, 한 값을 바꾸면 전체 Bloom 구조가 같이 재정렬됩니다.
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {[
                            { count: livePalateBloomShapeCounts.largePetal, label: "2순위 꽃잎" },
                            { count: livePalateBloomShapeCounts.smallPetal, label: "3순위 꽃잎" },
                            { count: livePalateBloomShapeCounts.largeStar, label: "4순위 별" },
                            { count: livePalateBloomShapeCounts.smallStar, label: "5순위 별" },
                          ].map(({ count, label }) => (
                            <div
                              key={`palate-bloom-shape-count-${label}`}
                              className="flex items-center justify-between gap-2 rounded-full bg-[var(--tb-color-surface-muted)] px-3 py-1.5 text-[11px]"
                            >
                              <span className="font-semibold text-[var(--tb-color-text-muted)]">
                                {label}
                              </span>
                              <span className="font-mono text-[var(--tb-color-text-primary)]">
                                {count}개
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(previewCardClass, "grid gap-4 p-4")}
                      data-component-preview="PalateOrbAvatar"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                            PalateOrbAvatar
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                            1~3순위 미각은 앞면 조각으로, 4~6순위 미각은 어둡고 흐린 뒷면 조각으로 감싸 원형 palate orb를 만듭니다.
                          </p>
                        </div>
                        <SourceFileLink
                          file="src/components/system/PalateOrbAvatar.tsx"
                          label="원본"
                          variant="chip"
                        />
                      </div>
                      <div className={avatarPreviewGridClass}>
                        {PROFILE_AVATAR_SIZE_KEYS.map((size) => (
                          <div
                            key={`palate-orb-live-preview-${size}`}
                            className={avatarPreviewTileClass}
                          >
                            <div className={avatarPreviewVisualClass}>
                              <PalateOrbAvatar
                                profile={livePalateAvatarProfile}
                                shapeSeed="design-system-orb-preview"
                                size={size}
                              />
                            </div>
                            <div className={avatarPreviewMetaClass}>
                              <p className={avatarPreviewLabelClass}>
                                {size} · {PROFILE_AVATAR_SIZE_TOKENS[size]}px
                              </p>
                              <p className={avatarPreviewDescriptionClass}>
                                앞면 3개 조각과 뒷면 3개 조각의 깊이감으로 미각 우선순위를 보여줍니다.
                              </p>
                            </div>
                            <div className={avatarPreviewChipRowClass}>
                              {livePalateTopTasteIds.map((tasteId) => (
                                <TasteChip
                                  key={`palate-orb-live-${size}-${tasteId}`}
                                  taste={TASTE_TOKENS[tasteId].label}
                                  value={`${avatarTasteValues[tasteId].toFixed(1)} mM`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={cn(avatarPreviewSupportClass, "flex flex-wrap items-center gap-3")}>
                        {PROFILE_AVATAR_SIZE_KEYS.map((size) => (
                          <PalateOrbAvatar
                            key={`palate-orb-token-row-${size}`}
                            profile={livePalateAvatarProfile}
                            shapeSeed={`design-system-orb-token-${size}`}
                            size={size}
                          />
                        ))}
                        <p className="min-w-[160px] flex-1 text-[11px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          4~6순위 조각은 가장자리로 밀리고 clipPath에 잘려, 뒤쪽 표면을 감싸는 보조 레이어처럼 보입니다.
                        </p>
                      </div>
                    </div>
                    <SectionCard hoverEffect={false}>
                      <div className="flex w-full items-start justify-between gap-3">
                        <div>
                          <SectionTitle>프로필 루프 카드</SectionTitle>
                          <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                            taste accent는 중립 바탕 위에 포인트로만 쓰는 것이 현재 앱의 기본 규칙입니다.
                          </p>
                        </div>
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[14px]"
                          style={{ background: accentPalette.bg, color: accentPalette.dark }}
                        >
                          <SparklesIcon size={ICON_TOKENS.size.md} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <TasteChip taste={TASTE_TOKENS[accentTaste].label} />
                        <TasteChip taste="지방맛" value="부드러움" />
                        <TasteChip taste="짠맛" value="후반 정리" />
                        <TasteChip taste="4회 예약" tone="neutral" />
                      </div>
                    </SectionCard>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className={cn(previewCardClass, "p-4")}>
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Taste accent breakdown</p>
                    <div className="mt-4 grid gap-2">
                      {(["main", "dark", "light", "bg"] as const).map((key) => (
                        <div key={key} className="flex items-center gap-3 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                          <div className="h-10 w-10 rounded-[var(--tb-radius-10)]" style={{ background: accentPalette[key] }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{ACCENT_PALETTE_LABELS[key]}</p>
                            <p className="font-mono text-[11px] text-[var(--tb-color-text-muted)]">{accentPalette[key]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={cn(previewCardClass, "p-4")}>
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Why these matter</p>
                    <ul className="mt-3 grid gap-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      <li>`PrimaryButton`, `SectionCard`, `TopAppBar`, `BottomTabBar` are the real shared shell today.</li>
                      <li>`Chip`, `TasteChip`, `StatusChip`, and `OutlineBadge` now split general labels from taste-aware interpretation.</li>
                      <li>`TasteMeasurementMiniCta`, `ImproveAccuracyScreen`, and `ReservationConfirmationScreen` show how new flows are inheriting the same system values.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">Measurement flow panels</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      측정 흐름 패널은 `Component Architecture`가 아니라 앱 전용 섹션에서 직접 preview해, feature composite의 실제 위치를 더 분명하게 보여줍니다.
                    </p>
                  </div>
                  <StatusTag tone="used">Currently used</StatusTag>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {appSpecificSectionPreviewEntries.map((entry) => (
                    <FilePreviewCard
                      key={entry.file}
                      entry={entry}
                      previewCardClass={previewCardClass}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">New screen composites</p>
                  <StatusTag tone="used">Recently added</StatusTag>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SectionEyebrow>ImproveAccuracyScreen</SectionEyebrow>
                  <SectionEyebrow>ReservationConfirmationScreen</SectionEyebrow>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <PhonePreviewFrame
                    title="Improve Accuracy"
                    description="정확도 단계 카드와 benefits, 안심 메시지, 하단 CTA가 하나의 풀스크린 흐름으로 정리되었습니다."
                  >
                    <ImproveAccuracyScreen
                      currentProfileStage={improveAccuracyStage}
                      onConnectDevice={() => undefined}
                      onSkip={() => undefined}
                    />
                  </PhonePreviewFrame>
                  <PhonePreviewFrame
                    title="Reservation Confirmation"
                    description="예약 확정 직후 상태 진행, 완료 카드, 후속 CTA를 묶은 신규 confirmation flow입니다."
                  >
                    <ReservationConfirmationScreen
                      key={confirmationPreviewKey}
                      onBack={() => undefined}
                      onComplete={() => undefined}
                    />
                  </PhonePreviewFrame>
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="componentSpecs"
            title="Component CSS Specs"
            description="컴포넌트별 현재 스타일 값을 정리해 두고, 바로 복사해서 코덱스에 붙여넣을 수 있는 섹션입니다. 먼저 `스타일 값 복사`로 현재값을 확인하고, 바로 수정 요청을 만들 때는 `코덱스 프롬프트 복사`를 쓰면 됩니다."
            controls={
              <div className="grid gap-3">
                <div className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                    추천 워크플로
                  </p>
                  <div className="mt-2 grid gap-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    <p>1. 디자인 프리뷰에서 원하는 컴포넌트 이름을 확인합니다.</p>
                    <p>2. 여기서 `스타일 값 복사` 또는 `코덱스 프롬프트 복사`를 누릅니다.</p>
                    <p>3. 복사한 내용을 그대로 붙여넣고 변경 요청만 덧붙이면 됩니다.</p>
                  </div>
                </div>
                <div className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                    포함 범위
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    현재 앱 공용 컴포넌트와 design preview에 노출된 주요 shadcn 프리미티브를 우선 정리했습니다.
                  </p>
                </div>
              </div>
            }
            sources={PLAYGROUND_SECTION_SOURCES.componentSpecs}
            previewStyle={previewStyle}
          >
            <div className="grid gap-6">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">
                    현재 앱 공용 컴포넌트
                  </p>
                  <StatusTag tone="used">Currently used</StatusTag>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {CURRENTLY_USED_COMPONENT_STYLE_SPECS.map((spec) => (
                    <ComponentStyleSpecCard
                      key={spec.id}
                      spec={spec}
                      onCopyStyle={handleCopyComponentStyleSnippet}
                      onCopyPrompt={handleCopyComponentCodexPrompt}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">
                    정의된 프리미티브
                  </p>
                  <StatusTag tone="unused">Defined but unused</StatusTag>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {DEFINED_COMPONENT_STYLE_SPECS.map((spec) => (
                    <ComponentStyleSpecCard
                      key={spec.id}
                      spec={spec}
                      onCopyStyle={handleCopyComponentStyleSnippet}
                      onCopyPrompt={handleCopyComponentCodexPrompt}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PlaygroundSection>

          <PlaygroundSection
            id="auditNotes"
            title="Currently Used / Unused / Inconsistencies / TODO"
            description="Audit notes derived from the current codebase before this page was added. 이번 정리에서는 실제 컴포넌트와 스크린/플로우를 분리하고, 페이지 전용 데모 헬퍼는 제외했습니다."
            sources={PLAYGROUND_SECTION_SOURCES.auditNotes}
          >
            <div className="grid gap-4">
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">Components</p>
                    <StatusTag tone="used">Active product</StatusTag>
                  </div>
                  {currentlyUsedComponentEntries.map((item) => (
                    <InventoryCard key={item.name} {...item} />
                  ))}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">Screens & Flows</p>
                    <StatusTag tone="used">Route-level</StatusTag>
                  </div>
                  {currentlyUsedScreenEntries.map((item) => (
                    <InventoryCard key={item.name} {...item} />
                  ))}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">Defined But Unused</p>
                    <StatusTag tone="unused">Pre-existing</StatusTag>
                  </div>
                  {definedButUnusedPrimitiveEntries.map((item) => (
                    <InventoryCard key={item.name} {...item} />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">Inconsistencies</p>
                    <StatusTag tone="note">Review targets</StatusTag>
                  </div>
                  {INCONSISTENCIES.map((item) => (
                    <InventoryCard key={item.name} {...item} />
                  ))}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">TODO</p>
                    <StatusTag tone="note">Next cleanup candidates</StatusTag>
                  </div>
                  {TODO_ITEMS.map((item) => (
                    <InventoryCard key={item.name} {...item} />
                  ))}
                </div>
              </div>
            </div>
          </PlaygroundSection>
        </PlaygroundLiveControlsProvider>
      </div>

      <NotificationPanel
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        notifications={previewNotifications}
        onMarkAllAsRead={handlePreviewNotificationsReadAll}
        onMarkAsRead={handlePreviewNotificationRead}
      />
      <AppMenuDrawer
        isOpen={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        onStartMeasurement={() => {
          setApplyFeedback({
            message: "메뉴의 미각 재측정 CTA는 실제 앱에서 측정 플로우로 연결됩니다.",
            tone: "note",
          });
        }}
        onImproveAccuracy={() => {
          handleJumpToSection("appSpecific");
          setApplyFeedback({
            message: "정확도 향상 프리뷰 위치로 이동했습니다.",
            tone: "note",
          });
        }}
      />

      <div
        ref={floatingMenuClusterRef}
        className="fixed bottom-4 right-4 z-[90] flex w-[min(380px,calc(100vw-2rem))] min-w-0 max-w-[calc(100vw-2rem)] flex-col items-stretch gap-3 sm:bottom-6 sm:right-6"
      >
        <PlaygroundLiveControlsDock
          activeSectionLabel={activeLiveControlSection?.label ?? null}
          onToggleOpen={() => setLiveControlsDockOpen((previous) => !previous)}
          onPortalRootChange={setLiveControlsPortalRootElement}
          visible={liveControlsDockOpen && activeLiveControlSectionId !== null}
        />

        <button
          type="button"
          onClick={handleToggleLiveControlsDock}
          aria-label={liveControlsDockOpen ? "라이브 컨트롤 도크 닫기" : "라이브 컨트롤 도크 열기"}
          title={liveControlsDockOpen ? "라이브 컨트롤 도크 닫기" : "라이브 컨트롤 도크 열기"}
          className={floatingMenuButtonClassName}
          style={{
            width: ICON_TOKENS.container.lg * 2,
            height: ICON_TOKENS.container.lg * 2,
          }}
        >
          <SlidersHorizontalIcon size={ICON_TOKENS.size.lg} strokeWidth={floatingMenuIconStrokeWidth} />
        </button>

        <button
          type="button"
          onClick={handleToggleSectionJumpMenu}
          aria-label={sectionJumpMenuOpen ? "섹션 바로가기 닫기" : "섹션 이동 메뉴 열기"}
          title={sectionJumpMenuOpen ? "섹션 바로가기 닫기" : "섹션 이동 메뉴 열기"}
          className={floatingMenuButtonClassName}
          style={{
            width: ICON_TOKENS.container.lg * 2,
            height: ICON_TOKENS.container.lg * 2,
          }}
        >
          <ListIcon size={ICON_TOKENS.size.lg} strokeWidth={floatingMenuIconStrokeWidth} />
        </button>

        {sectionJumpMenuOpen ? (
          <div className="self-end w-[min(220px,calc(100vw-2rem))] rounded-[24px] border border-[var(--tb-color-border-default)] bg-white/95 p-3 shadow-[0_20px_56px_rgba(15,15,15,0.18)] backdrop-blur">
            <p className="px-1 text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
              섹션 바로가기
            </p>
            <div className="mt-3 grid max-h-[min(60vh,520px)] gap-2 overflow-y-auto pr-1">
              {SECTION_NAV.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleJumpToSection(section.id)}
                  className="inline-flex items-center justify-between rounded-[14px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
                >
                  <span>{section.label}</span>
                  <ChevronRightIcon size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {floatingMenuOpen ? (
          <div className="w-full rounded-[28px] border border-[var(--tb-color-border-default)] bg-white/95 p-4 shadow-[0_24px_80px_rgba(15,15,15,0.18)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                  수정 사항 반영
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                  현재 앱
                </span>
                <button
                  type="button"
                  onClick={handleDismissFloatingMenus}
                  aria-label="플로팅 메뉴 접기"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-muted)] transition-colors hover:bg-[var(--tb-color-surface-base)]"
                  style={{
                    width: 28,
                    height: 28,
                  }}
                >
                  <ChevronRightIcon size={ICON_TOKENS.size.sm} className="rotate-90" />
                </button>
              </div>
            </div>

            <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              현재 preview 토큰 값을 앱 런타임 전체에 바로 적용합니다.
            </p>

            <div className="mt-4 rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                {hasPendingRuntimeChanges
                  ? `${pendingRuntimeDiffCount}개 토큰 변경이 적용 대기 중입니다.`
                  : "현재 플로팅 메뉴 반영값과 동일합니다."}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                코드 파일은 바뀌지 않고, 저장된 runtime override가 메인 앱에도 즉시 반영됩니다.
              </p>
            </div>

            <div className="mt-4 rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                    붙여넣기용 코드 내보내기
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                    현재 프리뷰 값을 토큰 파일에 붙여넣을 수 있는 스니펫으로 복사합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportPreviewOpen((previous) => !previous)}
                  className="rounded-full border border-[var(--tb-color-border-default)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-base)]"
                >
                  {exportPreviewOpen ? "코드 숨기기" : "코드 보기"}
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleCopyExportSnippet("css")}
                  className="inline-flex items-center justify-center rounded-[14px] border border-[var(--tb-color-border-default)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-base)]"
                >
                  `design-system.css` 복사
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyExportSnippet("ts")}
                  className="inline-flex items-center justify-center rounded-[14px] border border-[var(--tb-color-border-default)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-base)]"
                >
                  `designTokens.ts` 복사
                </button>
              </div>

              {exportPreviewOpen ? (
                <div className="mt-3 grid gap-3">
                  <div className="rounded-[16px] border border-[var(--tb-color-border-default)] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        `src/styles/design-system.css`
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyExportSnippet("css")}
                        className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]"
                      >
                        복사
                      </button>
                    </div>
                    <pre className="mt-2 max-h-40 overflow-auto rounded-[12px] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-[11px] leading-relaxed text-[var(--tb-color-text-primary)]">
                      <code>{designSystemCssSnippet}</code>
                    </pre>
                  </div>

                  <div className="rounded-[16px] border border-[var(--tb-color-border-default)] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        `src/constants/designTokens.ts`
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyExportSnippet("ts")}
                        className="text-[11px] font-semibold text-[var(--tb-color-text-muted)]"
                      >
                        복사
                      </button>
                    </div>
                    <pre className="mt-2 max-h-40 overflow-auto rounded-[12px] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-[11px] leading-relaxed text-[var(--tb-color-text-primary)]">
                      <code>{designTokensTsSnippet}</code>
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>

            {applyFeedback ? (
              <div
                className={cn(
                  "mt-3 rounded-[16px] px-3 py-3 text-[12px] leading-relaxed",
                  applyFeedback.tone === "success"
                    ? "bg-[var(--tb-color-success-soft)] text-[var(--tb-color-success)]"
                    : "bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-subtle)]",
                )}
              >
                {applyFeedback.message}
              </div>
            ) : null}

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={handleApplyRuntimeChanges}
                disabled={!hasPendingRuntimeChanges}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-[16px] px-4 py-3 text-[13px] font-semibold transition-colors",
                  hasPendingRuntimeChanges
                    ? "bg-[var(--tb-color-text-primary)] text-white shadow-[var(--tb-shadow-button)]"
                    : "bg-[var(--tb-color-surface-disabled)] text-[var(--tb-color-text-disabled)]",
                )}
              >
                수정 사항 반영
              </button>
              <button
                type="button"
                onClick={handleResetRuntimeChanges}
                className="inline-flex w-full items-center justify-center rounded-[16px] border border-[var(--tb-color-border-default)] bg-white px-4 py-3 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
              >
                반영 해제
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleToggleFloatingMenu}
          aria-label={floatingMenuOpen ? "실반영 메뉴 닫기" : "실반영 메뉴 열기"}
          title={floatingMenuOpen ? "실반영 메뉴 닫기" : "실반영 메뉴 열기"}
          className={floatingMenuButtonClassName}
          style={{
            width: ICON_TOKENS.container.lg * 2,
            height: ICON_TOKENS.container.lg * 2,
          }}
        >
          <SettingsIcon size={ICON_TOKENS.size.lg} strokeWidth={floatingMenuIconStrokeWidth} />
        </button>
      </div>
    </div>
  );
}
