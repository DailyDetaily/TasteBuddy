import {
  COLOR_TOKENS,
  COMPONENT_TOKENS,
  ICON_TOKENS,
  LAYOUT_TOKENS,
  MOTION_TOKENS,
  NEUTRAL_TASTE_TOKENS,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  SPACING_TOKENS,
  TASTE_TOKENS,
  TYPOGRAPHY_TOKENS,
  type TasteId,
} from "../../constants/designTokens";

export interface SourceReference {
  file: string;
  note: string;
}

export interface InventoryEntry {
  description?: string;
  name: string;
  note?: string;
  source: string;
  status?: "currently-used" | "defined-but-unused" | "defined-only";
}

export interface TokenSwatch {
  cssVar: string;
  description?: string;
  name: string;
  source: string;
  status?: "currently-used" | "defined-but-unused";
  value: string;
}

export interface TypographySpec {
  cssVars: string[];
  name: string;
  sample: string;
  source: string;
  usage: string;
  value: {
    fontSize: string;
    fontWeight: number;
    letterSpacing?: string;
    lineHeight: number;
  };
}

export const STYLE_STRUCTURE: InventoryEntry[] = [
  {
    name: "전역 스타일 진입점",
    note: "Tailwind, globals, 앱 토큰 시트를 한곳에서 불러옵니다.",
    source: "src/index.css",
    status: "currently-used",
  },
  {
    name: "공용 테마 토큰",
    note: "shadcn 스타일의 semantic token과 dark mode 변수가 여기에 있습니다.",
    source: "src/styles/globals.css",
    status: "defined-but-unused",
  },
  {
    name: "Taste Buddy tokens",
    note: "실제 앱 shell, surface, text, taste, spacing, motion, radius 토큰이 여기에 정의됩니다.",
    source: "src/styles/design-system.css",
    status: "currently-used",
  },
  {
    name: "타입 기반 토큰 미러",
    note: "CSS 변수를 차트, 맛 로직, UI 메타데이터용 TS 객체로 미러링합니다.",
    source: "src/constants/designTokens.ts",
    status: "currently-used",
  },
  {
    name: "공용 앱 컴포넌트",
    note: "실제 앱은 작은 system layer와 card / navigation shell을 재사용합니다.",
    source: "src/components/system, src/components/SectionCard.tsx, src/components/TopAppBar.tsx, src/components/BottomTabBar.tsx",
    status: "currently-used",
  },
  {
    name: "공용 UI 프리미티브",
    note: "더 큰 Radix/shadcn 세트가 src/components/ui 아래에 있지만, 현재 메인 앱 플로우에서는 거의 쓰이지 않습니다.",
    source: "src/components/ui",
    status: "defined-but-unused",
  },
  {
    name: "다크 모드 범위",
    note: "generic semantic token만 .dark override가 있고, tb-* 앱 토큰 레이어에는 없습니다.",
    source: "src/styles/globals.css",
    status: "defined-only",
  },
];

export const COLOR_GROUPS: Array<{
  colors: TokenSwatch[];
  id: string;
  name: string;
}> = [
    {
      id: "background",
      name: "배경 & 서피스",
      colors: [
        {
          name: "bg-page",
          value: COLOR_TOKENS.background.page,
          cssVar: "--tb-color-bg-page",
          source: "src/styles/design-system.css / COLOR_TOKENS.background.page",
          status: "currently-used",
          description: "앱 shell 배경",
        },
        {
          name: "bg-focus",
          value: COLOR_TOKENS.background.focus,
          cssVar: "--tb-color-bg-focus",
          source: "src/styles/design-system.css / COLOR_TOKENS.background.focus",
          status: "currently-used",
          description: "집중형 flow 화면 배경",
        },
        {
          name: "surface-base",
          value: COLOR_TOKENS.surface.base,
          cssVar: "--tb-color-surface-base",
          source: "src/styles/design-system.css / COLOR_TOKENS.surface.base",
          status: "currently-used",
          description: "상단 바, 내부 strip",
        },
        {
          name: "surface-card",
          value: COLOR_TOKENS.surface.card,
          cssVar: "--tb-color-surface-card",
          source: "src/styles/design-system.css / COLOR_TOKENS.surface.card",
          status: "currently-used",
          description: "기본 카드",
        },
        {
          name: "surface-muted",
          value: COLOR_TOKENS.surface.muted,
          cssVar: "--tb-color-surface-muted",
          source: "src/styles/design-system.css / COLOR_TOKENS.surface.muted",
          status: "currently-used",
          description: "체크리스트 블록, 보조 패널",
        },
        {
          name: "surface-elevated",
          value: COLOR_TOKENS.surface.elevated,
          cssVar: "--tb-color-surface-elevated",
          source: "src/styles/design-system.css / COLOR_TOKENS.surface.elevated",
          status: "currently-used",
        },
        {
          name: "surface-disabled",
          value: COLOR_TOKENS.surface.disabled,
          cssVar: "--tb-color-surface-disabled",
          source: "src/styles/design-system.css / COLOR_TOKENS.surface.disabled",
          status: "currently-used",
        },
        {
          name: "surface-overlay",
          value: COLOR_TOKENS.surface.overlay,
          cssVar: "--tb-color-surface-overlay",
          source: "src/styles/design-system.css / COLOR_TOKENS.surface.overlay",
          status: "currently-used",
          description: "반투명 선택 패널",
        },
      ],
    },
    {
      id: "text",
      name: "텍스트 & 아이콘",
      colors: [
        {
          name: "text-primary",
          value: COLOR_TOKENS.text.primary,
          cssVar: "--tb-color-text-primary",
          source: "src/styles/design-system.css / COLOR_TOKENS.text.primary",
          status: "currently-used",
        },
        {
          name: "text-secondary",
          value: COLOR_TOKENS.text.secondary,
          cssVar: "--tb-color-text-secondary",
          source: "src/styles/design-system.css / COLOR_TOKENS.text.secondary",
          status: "currently-used",
        },
        {
          name: "text-tertiary",
          value: COLOR_TOKENS.text.tertiary,
          cssVar: "--tb-color-text-tertiary",
          source: "src/styles/design-system.css / COLOR_TOKENS.text.tertiary",
          status: "currently-used",
        },
        {
          name: "text-body",
          value: COLOR_TOKENS.text.body,
          cssVar: "--tb-color-text-body",
          source: "src/styles/design-system.css / COLOR_TOKENS.text.body",
          status: "currently-used",
        },
        {
          name: "text-hint",
          value: COLOR_TOKENS.text.hint,
          cssVar: "--tb-color-text-hint",
          source: "src/styles/design-system.css / COLOR_TOKENS.text.hint",
          status: "currently-used",
        },
        {
          name: "text-disabled",
          value: COLOR_TOKENS.text.disabled,
          cssVar: "--tb-color-text-disabled",
          source: "src/styles/design-system.css / COLOR_TOKENS.text.disabled",
          status: "currently-used",
        },
        {
          name: "icon-primary",
          value: COLOR_TOKENS.icon.primary,
          cssVar: "--tb-color-icon-primary",
          source: "src/styles/design-system.css / COLOR_TOKENS.icon.primary",
          status: "currently-used",
        },
        {
          name: "icon-hover",
          value: COLOR_TOKENS.icon.hover,
          cssVar: "--tb-color-icon-hover",
          source: "src/styles/design-system.css / COLOR_TOKENS.icon.hover",
          status: "currently-used",
        },
        {
          name: "icon-muted",
          value: COLOR_TOKENS.icon.muted,
          cssVar: "--tb-color-icon-muted",
          source: "src/styles/design-system.css / COLOR_TOKENS.icon.muted",
          status: "currently-used",
        },
      ],
    },
    {
      id: "border",
      name: "보더 & 상태",
      colors: [
        {
          name: "border-card",
          value: COLOR_TOKENS.border.card,
          cssVar: "--tb-color-border-card",
          source: "src/styles/design-system.css / COLOR_TOKENS.border.card",
          status: "currently-used",
        },
        {
          name: "border-subtle",
          value: COLOR_TOKENS.border.subtle,
          cssVar: "--tb-color-border-subtle",
          source: "src/styles/design-system.css / COLOR_TOKENS.border.subtle",
          status: "currently-used",
        },
        {
          name: "border-default",
          value: COLOR_TOKENS.border.default,
          cssVar: "--tb-color-border-default",
          source: "src/styles/design-system.css / COLOR_TOKENS.border.default",
          status: "currently-used",
        },
        {
          name: "border-strong",
          value: COLOR_TOKENS.border.strong,
          cssVar: "--tb-color-border-strong",
          source: "src/styles/design-system.css / COLOR_TOKENS.border.strong",
          status: "currently-used",
        },
        {
          name: "border-disabled",
          value: COLOR_TOKENS.border.disabled,
          cssVar: "--tb-color-border-disabled",
          source: "src/styles/design-system.css / COLOR_TOKENS.border.disabled",
          status: "currently-used",
        },
        {
          name: "success",
          value: COLOR_TOKENS.state.success,
          cssVar: "--tb-color-success",
          source: "src/styles/design-system.css / COLOR_TOKENS.state.success",
          status: "currently-used",
          description: "앱 semantic success 전경색",
        },
        {
          name: "success-soft",
          value: COLOR_TOKENS.state.successSoft,
          cssVar: "--tb-color-success-soft",
          source: "src/styles/design-system.css / COLOR_TOKENS.state.successSoft",
          status: "currently-used",
          description: "success 배경 채움색",
        },
        {
          name: "warning",
          value: COLOR_TOKENS.state.warning,
          cssVar: "--tb-color-warning",
          source: "src/styles/design-system.css / COLOR_TOKENS.state.warning",
          status: "currently-used",
          description: "앱 semantic warning 전경색",
        },
        {
          name: "warning-soft",
          value: COLOR_TOKENS.state.warningSoft,
          cssVar: "--tb-color-warning-soft",
          source: "src/styles/design-system.css / COLOR_TOKENS.state.warningSoft",
          status: "currently-used",
          description: "warning 배경 채움색",
        },
        {
          name: "destructive",
          value: COLOR_TOKENS.state.destructive,
          cssVar: "--tb-color-destructive",
          source: "src/styles/design-system.css / COLOR_TOKENS.state.destructive",
          status: "currently-used",
          description: "삭제, 위험 액션 foreground / solid fill",
        },
        {
          name: "primary",
          value: "#030213",
          cssVar: "--primary",
          source: "src/styles/globals.css",
          status: "defined-but-unused",
          description: "공용 shadcn semantic 토큰",
        },
        {
          name: "secondary",
          value: "oklch(0.95 0.0058 264.53)",
          cssVar: "--secondary",
          source: "src/styles/globals.css",
          status: "defined-but-unused",
        },
        {
          name: "destructive",
          value: COLOR_TOKENS.state.destructive,
          cssVar: "--destructive",
          source: "src/styles/globals.css -> COLOR_TOKENS.state.destructive",
          status: "currently-used",
        },
      ],
    },
    {
      id: "taste",
      name: "맛 포인트 컬러",
      colors: (Object.entries(TASTE_TOKENS) as Array<[TasteId, (typeof TASTE_TOKENS)[TasteId]]>).map(
        ([tasteId, definition]) => ({
          name: tasteId,
          value: definition.palette.main,
          cssVar: `--tb-taste-${tasteId}-main`,
          source: "src/styles/design-system.css / TASTE_TOKENS",
          status: "currently-used",
          description: definition.label,
        }),
      ).concat({
        name: "neutral",
        value: NEUTRAL_TASTE_TOKENS.palette.main,
        cssVar: "--tb-taste-neutral-main",
        source: "src/styles/design-system.css / NEUTRAL_TASTE_TOKENS",
        status: "currently-used",
        description: "모든맛 / 중립 미각 포인트 컬러",
      }),
    },
    {
      id: "taste-tint-surface",
      name: "미각 틴트 서페이스",
      colors: (Object.entries(TASTE_TOKENS) as Array<[TasteId, (typeof TASTE_TOKENS)[TasteId]]>).map(
        ([tasteId, definition]) => ({
          name: tasteId,
          value: definition.palette.tintSurface,
          cssVar: `--tb-taste-${tasteId}-tint-surface`,
          source: "src/styles/design-system.css / src/constants/designTokens.ts",
          status: "currently-used",
          description: `${definition.label} 해석형 카드 배경 (미각 틴트 카드 / 세부 분석)`,
        }),
      ).concat({
        name: "neutral",
        value: NEUTRAL_TASTE_TOKENS.palette.tintSurface,
        cssVar: "--tb-taste-neutral-tint-surface",
        source: "src/styles/design-system.css / NEUTRAL_TASTE_TOKENS",
        status: "currently-used",
        description: "모든맛 활성 상태 배경 (#7A7A7A + white 80%)",
      }),
    },
    {
      id: "taste-tint-soft",
      name: "미각 틴트 소프트",
      colors: (Object.entries(TASTE_TOKENS) as Array<[TasteId, (typeof TASTE_TOKENS)[TasteId]]>).map(
        ([tasteId, definition]) => ({
          name: tasteId,
          value: definition.palette.tintSoft,
          cssVar: `--tb-taste-${tasteId}-tint-soft`,
          source: "src/styles/design-system.css / src/constants/designTokens.ts",
          status: "currently-used",
          description: `${definition.label} 인라인 칩 / 메타 칩 배경`,
        }),
      ),
    },
    {
      id: "taste-tint-soft-border",
      name: "미각 틴트 소프트 보더",
      colors: (Object.entries(TASTE_TOKENS) as Array<[TasteId, (typeof TASTE_TOKENS)[TasteId]]>).map(
        ([tasteId, definition]) => ({
          name: tasteId,
          value: definition.palette.tintSoftBorder,
          cssVar: `--tb-taste-${tasteId}-tint-soft-border`,
          source: "src/styles/design-system.css / src/constants/designTokens.ts",
          status: "currently-used",
          description: `${definition.label} 인라인 칩 / 메타 칩 보더`,
        }),
      ),
    },
    {
      id: "taste-tint-surface-text",
      name: "미각 틴트 서페이스 텍스트",
      colors: (Object.entries(TASTE_TOKENS) as Array<[TasteId, (typeof TASTE_TOKENS)[TasteId]]>).map(
        ([tasteId, definition]) => ({
          name: tasteId,
          value: definition.palette.tintSurfaceText,
          cssVar: `--tb-taste-${tasteId}-tint-surface-text`,
          source: "src/styles/design-system.css / src/constants/designTokens.ts",
          status: "currently-used",
          description: `${definition.label} 틴트 서페이스 위 텍스트`,
        }),
      ),
    },
    {
      id: "taste-tint-surface-sub-text",
      name: "미각 틴트 서페이스 보조 텍스트",
      colors: (Object.entries(TASTE_TOKENS) as Array<[TasteId, (typeof TASTE_TOKENS)[TasteId]]>).map(
        ([tasteId, definition]) => ({
          name: tasteId,
          value: definition.palette.tintSurfaceSubText,
          cssVar: `--tb-taste-${tasteId}-tint-surface-sub-text`,
          source: "src/styles/design-system.css / src/constants/designTokens.ts",
          status: "currently-used",
          description: `${definition.label} 틴트 서페이스 위 보조 텍스트`,
        }),
      ),
    },
  ];

export const TYPOGRAPHY_SPECS: TypographySpec[] = [
  {
    name: "디스플레이",
    sample: "한눈에 들어오는 결과 헤드라인",
    source: "DESIGN.md / src/styles/design-system.css",
    usage: "완료 / 성공 헤드라인",
    cssVars: [
      "--tb-font-size-18",
      "--tb-font-size-28",
      "--tb-font-weight-bold",
      "--tb-line-height-tight",
    ],
    value: { fontSize: TYPOGRAPHY_TOKENS.fontSize[28], fontWeight: 700, lineHeight: 1.2 },
  },
  {
    name: "헤딩",
    sample: "프로필은 조금씩 더 정교해집니다",
    source: "DESIGN.md / src/pages/OnboardingScreen.tsx / src/pages/TastickConnectScreen.tsx",
    usage: "온보딩과 드로어 타이틀",
    cssVars: ["--tb-font-size-22", "--tb-font-weight-bold", "--tb-line-height-snug"],
    value: { fontSize: TYPOGRAPHY_TOKENS.fontSize[22], fontWeight: 700, lineHeight: 1.35 },
  },
  {
    name: "타이틀",
    sample: "미각 프로필",
    source: "src/components/system/SectionTitle.tsx / src/pages/AnalysisPage.tsx",
    usage: "섹션 타이틀과 페이지 단위 카드",
    cssVars: ["--tb-font-size-18", "--tb-font-weight-bold", "--tb-letter-spacing-tight"],
    value: {
      fontSize: TYPOGRAPHY_TOKENS.fontSize[18],
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: TYPOGRAPHY_TOKENS.letterSpacing.tight,
    },
  },
  {
    name: "본문",
    sample: "현재 프로필을 빠르게 정리해 첫 예약부터 활용할 수 있도록 돕습니다.",
    source: "src/styles/design-system.css / src/pages/DiningPage.tsx",
    usage: "카드 본문과 설명 문구",
    cssVars: ["--tb-font-size-14", "--tb-font-weight-regular", "--tb-line-height-relaxed"],
    value: { fontSize: TYPOGRAPHY_TOKENS.fontSize[14], fontWeight: 400, lineHeight: 1.5 },
  },
  {
    name: "캡션",
    sample: "보조 정보, 상태 라벨, 메타 텍스트",
    source: "src/components/system/OutlineBadge.tsx / src/components/system/StatusChip.tsx",
    usage: "배지, 헬퍼 텍스트, 메타 정보",
    cssVars: ["--tb-font-size-12", "--tb-font-weight-semibold", "--tb-line-height-normal"],
    value: { fontSize: TYPOGRAPHY_TOKENS.fontSize[12], fontWeight: 600, lineHeight: 1.4 },
  },
];

export const SPACING_ITEMS = Object.entries(SPACING_TOKENS).map(([name, value]) => ({
  name: `space-${name}`,
  value,
  source: "src/styles/design-system.css / SPACING_TOKENS",
}));

export const RADIUS_ITEMS = Object.entries(RADIUS_TOKENS).map(([name, value]) => ({
  name: `radius-${name}`,
  value,
  source: "src/styles/design-system.css / RADIUS_TOKENS",
}));

export const SHADOW_ITEMS = Object.entries(SHADOW_TOKENS).map(([name, value]) => ({
  name,
  value,
  source: "src/styles/design-system.css / SHADOW_TOKENS",
}));

export const BORDER_ITEMS = [
  {
    name: "기본 보더",
    value: `1px solid ${COLOR_TOKENS.border.default}`,
    source: "src/styles/design-system.css / --tb-color-border-default",
  },
  {
    name: "강조 보더",
    value: `1px solid ${COLOR_TOKENS.border.strong}`,
    source: "src/styles/design-system.css / --tb-color-border-strong",
  },
  {
    name: "아바타 보더",
    value: `1px solid ${COLOR_TOKENS.border.avatar}`,
    source: "src/styles/design-system.css / --tb-color-border-avatar",
  },
];

export const ICON_RULES = [
  {
    name: "Lucide 시스템 아이콘",
    source: "src/components/TopAppBar.tsx / src/components/BottomTabBar.tsx / src/components/AppMenuDrawer.tsx / src/components/NotificationPanel.tsx / src/pages/AnalysisPage.tsx / src/pages/ProfilePage.tsx / src/pages/TastickConnectScreen.tsx / src/pages/TasteMeasurementScreen.tsx / src/components/reservation/DiningFeedbackFlow.tsx",
    description: "메인 내비게이션, 오버레이, 측정/피드백 플로우까지 현재 실제 앱 아이콘 언어는 lucide-react로 정리되었습니다.",
  },
  {
    name: "Lucide 보조 아이콘",
    source: "src/pages/DesignSystemPage.tsx / src/components/design-system/CardGallery.tsx / src/components/ui",
    description: "Lucide는 현재 디자인 시스템 문서, 카드 갤러리 샘플, 일부 generic UI primitive 내부의 예시와 샘플에 사용됩니다.",
  },
  {
    name: "아이콘 사이즈 토큰",
    source: "src/constants/designTokens.ts / src/styles/design-system.css",
    description: `정의된 크기: ${Object.keys(ICON_TOKENS.size).join(", ")}`,
  },
];

export const CURRENTLY_USED_COMPONENTS: InventoryEntry[] = [
  {
    name: "SectionCard",
    source: "src/components/SectionCard.tsx",
    note: "카드와 리스트 섹션의 기본 shell입니다.",
    status: "currently-used",
  },
  {
    name: "SummaryMetricCard",
    source: "src/components/system/SummaryMetricCard.tsx",
    note: "아이콘, 라벨, 값을 묶는 2열 요약 지표 타일입니다.",
    status: "currently-used",
  },
  {
    name: "PrimaryButton",
    source: "src/components/system/PrimaryButton.tsx",
    note: "온보딩, 측정, 예약, 피드백 플로우 전반의 주요 CTA입니다.",
    status: "currently-used",
  },
  {
    name: "FlowBottomCta",
    source: "src/components/system/FlowBottomCta.tsx",
    note: "온보딩과 미각 측정, 그리고 여러 flow screen의 하단 CTA shell입니다.",
    status: "currently-used",
  },
  {
    name: "FlowStepCta",
    source: "src/components/system/FlowStepCta.tsx",
    note: "온보딩과 미각 측정의 하단 스텝 footer를 공통 패턴으로 통일합니다.",
    status: "currently-used",
  },
  {
    name: "TopAppBar",
    source: "src/components/TopAppBar.tsx",
    note: "공용 상단 내비게이션 shell입니다.",
    status: "currently-used",
  },
  {
    name: "BottomTabBar",
    source: "src/components/BottomTabBar.tsx",
    note: "메인 플로우의 기본 앱 내비게이션입니다.",
    status: "currently-used",
  },
  {
    name: "NotificationPanel",
    source: "src/components/NotificationPanel.tsx",
    note: "TopAppBar의 알림 액션과 연결된 상단 드롭다운 오버레이입니다.",
    status: "currently-used",
  },
  {
    name: "AppMenuDrawer",
    source: "src/components/AppMenuDrawer.tsx",
    note: "TopAppBar의 메뉴 액션과 연결된 우측 드로어입니다.",
    status: "currently-used",
  },
  {
    name: "BottomSheetShell",
    source: "src/components/system/BottomSheetShell.tsx",
    note: "Tastick 연결 플로우와 해석 상세 drawer가 공유하는 공용 바텀시트 셸입니다.",
    status: "currently-used",
  },
  {
    name: "TasteProfileAvatar",
    source: "src/components/system/TasteProfileAvatar.tsx",
    note: "미각 데이터 6축을 그라데이션으로 번역하는 기본 프로필 아바타입니다.",
    status: "currently-used",
  },
  {
    name: "PalateSignatureAvatar",
    source: "src/components/system/PalateSignatureAvatar.tsx",
    note: "0-100 미각 비율을 원형 halo와 soft bloom으로 번역하는 프로필 시그니처 아바타입니다.",
    status: "defined-only",
  },
  {
    name: "PalateBloomAvatar",
    source: "src/components/system/PalateBloomAvatar.tsx",
    note: "6가지 미각 우선순위를 꽃잎과 이중 별 구조로 번역하는 프로필용 Palate Bloom 아바타입니다.",
    status: "defined-only",
  },
  {
    name: "PalateOrbAvatar",
    source: "src/components/system/PalateOrbAvatar.tsx",
    note: "1~3순위 미각은 앞면, 4~6순위 미각은 뒷면 조각으로 번역하는 원형 palate orb 아바타입니다.",
    status: "defined-only",
  },
  {
    name: "Chip",
    source: "src/components/system/Chip.tsx",
    note: "일반 목적의 neutral / semantic / icon label chip입니다.",
    status: "currently-used",
  },
  {
    name: "OutlineBadge",
    source: "src/components/system/OutlineBadge.tsx",
    note: "섹션과 프로필 라벨에 쓰입니다.",
    status: "currently-used",
  },
  {
    name: "StepBadge",
    source: "src/components/system/StepBadge.tsx",
    note: "사전 조사와 미각 측정의 진행 단계를 보여주는 아웃라인 배지입니다.",
    status: "currently-used",
  },
  {
    name: "StatusChip",
    source: "src/components/system/StatusChip.tsx",
    note: "예약 상태 메타데이터에 쓰입니다.",
    status: "currently-used",
  },
  {
    name: "TCSBadge",
    source: "src/components/system/TCSBadge.tsx",
    note: "홈 다이닝 준비 카드와 레거시 히스토리 카드 상단의 gradient TCS 배지입니다.",
    status: "currently-used",
  },
  {
    name: "TasteChip",
    source: "src/components/system/TasteChip.tsx",
    note: "맛 포인트에 특화된 작은 pill 컴포넌트입니다.",
    status: "currently-used",
  },
  {
    name: "TastePointArrowBox",
    source: "src/components/system/TastePointArrowBox.tsx",
    note: "미각 변화 요약과 셰프 조정 포인트 앞에 붙는 taste-colored 화살표 박스입니다.",
    status: "currently-used",
  },
  {
    name: "TasteLineChart",
    source: "src/components/system/TasteLineChart.tsx",
    note: "특이사항과 미각 변화 카드에서 쓰는 compact taste-aware line graph입니다.",
    status: "currently-used",
  },
  {
    name: "InterpretationCard",
    source: "src/components/system/InterpretationCard.tsx",
    note: "분석 인사이트, 셰프 번역 요약, 홈의 최근 프로필 변화 요약에 공통으로 쓰이는 해석 카드입니다.",
    status: "currently-used",
  },
  {
    name: "TasteTintCard",
    source: "src/components/system/TasteTintCard.tsx",
    note: "정사각형 미각 틴트 해석 카드입니다.",
    status: "currently-used",
  },
  {
    name: "TasteTintCardList",
    source: "src/components/system/TasteTintCardList.tsx",
    note: "미각 틴트 카드의 grid 전용 리스트 래퍼입니다.",
    status: "currently-used",
  },
  {
    name: "CardScrollList",
    source: "src/components/system/CardScrollList.tsx",
    note: "셰프 매칭과 세부 분석에 쓰는 가로 스크롤 카드 스트립 래퍼입니다.",
    status: "currently-used",
  },
  {
    name: "SectionTitle",
    source: "src/components/system/SectionTitle.tsx",
    note: "가이드라인 기반 heading helper로, 분석과 다이닝 피드백에서 쓰입니다.",
    status: "currently-used",
  },
  {
    name: "FlowHeaderBlock",
    source: "src/components/system/FlowHeaderBlock.tsx",
    note: "사전 조사와 미각 보정 intro에서 배지 행과 title / description 블록을 묶는 공통 header block입니다.",
    status: "currently-used",
  },
  {
    name: "TasteMeasurementMiniCta",
    source: "src/components/measurement/TasteMeasurementMiniCta.tsx",
    note: "여러 탭에서 재사용되는 앱 전용 inline 액션 카드입니다.",
    status: "currently-used",
  },
  {
    name: "EmptyState",
    source: "src/components/system/EmptyState.tsx",
    note: "예약이 없을 때처럼 비어 있는 상태를 안내하는 공용 empty state 블록입니다.",
    status: "currently-used",
  },
  {
    name: "ImproveAccuracyScreen",
    source: "src/pages/ImproveAccuracyScreen.tsx",
    note: "프로필 정밀도 향상 플로우를 설명하는 신규 full-screen composite입니다.",
    status: "currently-used",
  },
  {
    name: "DiningFeedbackFlow",
    source: "src/components/reservation/DiningFeedbackFlow.tsx",
    note: "플로우 전용 카드, 선택 패턴, 피드백 필드를 포함합니다.",
    status: "currently-used",
  },
];

export const UNUSED_UI_PRIMITIVES: InventoryEntry[] = [
  { name: "Button", source: "src/components/ui/button.tsx", status: "defined-but-unused" },
  { name: "Input", source: "src/components/ui/input.tsx", status: "defined-but-unused" },
  { name: "Textarea", source: "src/components/ui/textarea.tsx", status: "defined-but-unused" },
  { name: "Select", source: "src/components/ui/select.tsx", status: "defined-but-unused" },
  { name: "Checkbox", source: "src/components/ui/checkbox.tsx", status: "defined-but-unused" },
  { name: "RadioGroup", source: "src/components/ui/radio-group.tsx", status: "defined-but-unused" },
  { name: "Switch", source: "src/components/ui/switch.tsx", status: "defined-but-unused" },
  { name: "Tabs", source: "src/components/ui/tabs.tsx", status: "defined-but-unused" },
  { name: "Card", source: "src/components/ui/card.tsx", status: "defined-but-unused" },
  { name: "Badge", source: "src/components/ui/badge.tsx", status: "defined-but-unused" },
  { name: "Dialog", source: "src/components/ui/dialog.tsx", status: "defined-but-unused" },
  { name: "Sheet", source: "src/components/ui/sheet.tsx", status: "defined-but-unused" },
  { name: "Popover", source: "src/components/ui/popover.tsx", status: "defined-but-unused" },
  { name: "Tooltip", source: "src/components/ui/tooltip.tsx", status: "defined-but-unused" },
  { name: "Alert", source: "src/components/ui/alert.tsx", status: "defined-but-unused" },
  { name: "Progress", source: "src/components/ui/progress.tsx", status: "defined-but-unused" },
  { name: "Skeleton", source: "src/components/ui/skeleton.tsx", status: "defined-but-unused" },
  { name: "Slider", source: "src/components/ui/slider.tsx", status: "defined-but-unused" },
  { name: "Toast 래퍼", source: "src/components/ui/sonner.tsx", status: "defined-but-unused" },
  { name: "Drawer", source: "src/components/ui/drawer.tsx", status: "defined-but-unused" },
];

export const INCONSISTENCIES: InventoryEntry[] = [
  {
    name: "토큰 레이어가 두 갈래로 병존",
    source: "src/styles/globals.css / src/styles/design-system.css",
    note: "generic semantic theme와 tb-* 앱 테마가 역할이 겹치지만, 실제 앱 shell은 tb-* 레이어가 주도합니다.",
  },
  {
    name: "기능 페이지에 하드코딩 유틸리티 값이 남아 있음",
    source: "src/pages/DiningPage.tsx / src/pages/ProfilePage.tsx / src/components/reservation/DiningFeedbackFlow.tsx",
    note: "여러 padding, radius, text size가 시각적으로는 토큰과 맞지만, 토큰 참조 대신 raw arbitrary value로 반복됩니다.",
  },
  {
    name: "SectionTitle이 일관되게 채택되지 않음",
    source: "src/components/system/SectionTitle.tsx / src/pages/AnalysisPage.tsx / src/pages/ProfilePage.tsx",
    note: "여러 페이지 섹션이 공용 heading helper 대신 ad hoc heading class를 계속 사용합니다.",
  },
  {
    name: "다크 모드 적용 범위가 부분적",
    source: "src/styles/globals.css / src/styles/design-system.css",
    note: "generic semantic token 세트에만 .dark override가 있어서, 실제 앱 shell은 일관되게 다크 모드 전환이 되지 않습니다.",
  },
  {
    name: "상태 색상 적용 범위 점검 필요",
    source: "src/styles/design-system.css / src/styles/globals.css",
    note: "success, warning, destructive는 first-class tb-* 토큰으로 정의되어 있으며 generic destructive token도 앱 토큰을 참조합니다.",
  },
];

export const TODO_ITEMS: InventoryEntry[] = [
  {
    name: "공용 폼 필드 추출",
    source: "src/components/reservation/DiningFeedbackFlow.tsx / src/pages/DiningPage.tsx",
    note: "검색 행, textarea shell, choice selector가 재사용 가능한 field component로 추출될 수 있을 만큼 시각 규칙을 반복합니다.",
  },
  {
    name: "리스트 아이템 프리미티브 추출",
    source: "src/pages/ProfilePage.tsx / src/pages/DiningPage.tsx",
    note: "예약 행, 셰프 행, 설정 행이 비슷한 list-cell 패턴을 공유하지만 아직 inline으로 작성되어 있습니다.",
  },
  {
    name: "오버레이 전략 통합",
    source: "src/pages/TastickConnectScreen.tsx / src/components/ui/dialog.tsx / src/components/ui/sheet.tsx / src/components/ui/drawer.tsx",
    note: "제품은 custom drawer형 레이아웃을 쓰고 있고, Radix/Vaul overlay도 존재하지만 아직 메인 앱에는 통합되지 않았습니다.",
  },
  {
    name: "지속형 디자인 토큰 편집기",
    source: "src/lib/designTokenRuntime.ts / src/styles/design-system.css / src/constants/designTokens.ts",
    note: "플로팅 메뉴로 로컬 앱 전체에 runtime override를 적용할 수 있지만, source-of-truth 코드 변경은 여전히 토큰 파일 수정이 필요합니다.",
  },
];

export const SOURCE_REFERENCES: SourceReference[] = [
  {
    file: "DESIGN.md",
    note: "프로젝트의 현재 디자인 시스템 기준 문서입니다.",
  },
  {
    file: "src/index.css",
    note: "Tailwind와 두 토큰 레이어를 함께 불러옵니다.",
  },
  {
    file: "src/styles/globals.css",
    note: "공용 semantic 토큰, 다크 모드, 기본 유틸리티가 있습니다.",
  },
  {
    file: "src/styles/design-system.css",
    note: "앱 전용 tb-* 토큰과 컴포넌트 CSS class가 있습니다.",
  },
  {
    file: "src/constants/designTokens.ts",
    note: "CSS 변수에서 미러링된 타입 기반 토큰 소스입니다.",
  },
  {
    file: "src/components/system",
    note: "현재 실제로 쓰이고 있는 앱 레벨 재사용 컴포넌트입니다.",
  },
  {
    file: "src/components/ui",
    note: "정의된 Radix/shadcn 프리미티브로, 현재 화면에서는 대부분 미사용 상태입니다.",
  },
];

export const PLAYGROUND_SECTION_SOURCES: Record<string, SourceReference[]> = {
  audit: SOURCE_REFERENCES,
  colors: [
    {
      file: "src/styles/design-system.css",
      note: "semantic color 변수와 미각 포인트 컬러가 정의됩니다.",
    },
    {
      file: "src/constants/designTokens.ts",
      note: "COLOR_TOKENS와 TASTE_TOKENS가 CSS 값을 미러링합니다.",
    },
    {
      file: "src/styles/globals.css",
      note: "fallback용 공용 semantic color와 다크 모드 토큰이 있습니다.",
    },
  ],
  typography: [
    {
      file: "DESIGN.md",
      note: "현재 프로젝트의 타이포 ceiling과 shell 원칙을 정의합니다.",
    },
    {
      file: "src/styles/design-system.css",
      note: "font size, weight, line-height, letter-spacing 변수가 있습니다.",
    },
  ],
  spacing: [
    {
      file: "src/styles/design-system.css",
      note: "spacing, radius, layout, shadow 토큰과 card stack gap 의미 토큰이 정의됩니다.",
    },
    {
      file: "src/constants/designTokens.ts",
      note: "SPACING_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, LAYOUT_TOKENS가 있습니다.",
    },
    {
      file: "src/components/system/PageSection.tsx",
      note: "섹션 타이틀과 카드 스택을 묶을 때 공통 gap-3 리듬을 적용하는 래퍼입니다.",
    },
  ],
  icons: [
    {
      file: "src/components/TopAppBar.tsx",
      note: "내비게이션에서의 Lucide 아이콘 사용 예시입니다.",
    },
    {
      file: "src/components/measurement/TasteMeasurementMiniCta.tsx",
      note: "앱 전용 카드의 보조 아이콘과 CTA 조합 예시입니다.",
    },
  ],
  buttons: [
    {
      file: "src/components/system/PrimaryButton.tsx",
      note: "현재 앱에서 실제로 쓰이는 CTA 컴포넌트입니다.",
    },
    {
      file: "src/components/ui/button.tsx",
      note: "정의된 공용 button variant로, 기존 제품 화면에서는 미사용이었습니다.",
    },
  ],
  badges: [
    {
      file: "src/components/system/TCSBadge.tsx",
      note: "홈 카드 상단에 쓰이는 gradient TCS 배지 컴포넌트입니다.",
    },
    {
      file: "src/components/system/Chip.tsx",
      note: "제품 레벨의 공용 neutral / semantic chip입니다.",
    },
    {
      file: "src/components/ui/badge.tsx",
      note: "정의된 범용 badge 프리미티브입니다.",
    },
    {
      file: "src/components/system/OutlineBadge.tsx",
      note: "프로필 단계, 섹션 라벨에 쓰이는 앱 전용 outline badge입니다.",
    },
    {
      file: "src/components/system/StatusChip.tsx",
      note: "예약 상태를 보여주는 앱 전용 status badge이며, 홈 탭 TCS 배지를 기준으로 정리되었습니다.",
    },
    {
      file: "src/components/system/TasteChip.tsx",
      note: "미각 포인트와 현재 반응을 보여주는 앱 전용 taste chip입니다.",
    },
  ],
  fields: [
    {
      file: "src/components/ui/input.tsx",
      note: "공용 input shell입니다.",
    },
    {
      file: "src/components/ui/textarea.tsx",
      note: "공용 textarea shell입니다.",
    },
    {
      file: "src/components/ui/select.tsx",
      note: "Radix 기반 select 필드입니다.",
    },
    {
      file: "src/components/system/SelectionCard.tsx",
      note: "현재 공용 field 계열로 유지되는 선택형 카드 컴포넌트입니다.",
    },
  ],
  cards: [
    {
      file: "src/components/system/PageSection.tsx",
      note: "현재 메인 탭의 섹션 타이틀과 카드 스택이 card stack gap 규칙을 공유하는 공용 래퍼입니다.",
    },
    {
      file: "src/components/SectionCard.tsx",
      note: "현재 화면에서 쓰이는 메인 공용 card shell입니다.",
    },
    {
      file: "src/components/home/HomeCards.tsx",
      note: "현재 홈 화면에서 쓰이는 예약 준비, 셰프 매칭, 변화 요약 카드가 공유 컴포넌트로 정리되어 있습니다.",
    },
    {
      file: "src/components/design-system/CurrentHomeCardArchive.tsx",
      note: "현재 홈 카드들을 디자인 시스템에서 다시 확인할 수 있는 보관용 프리뷰입니다.",
    },
    {
      file: "src/components/measurement/TasteMeasurementMiniCta.tsx",
      note: "앱 전용 인라인 CTA 카드입니다.",
    },
    {
      file: "src/components/ui/card.tsx",
      note: "정의된 범용 card 프리미티브입니다.",
    },
    {
      file: "src/pages/ProfilePage.tsx",
      note: "기기 상태 카드, 활동 통계 타일, 셰프 카드, 설정 카드 패턴입니다.",
    },
    {
      file: "src/pages/DiningPage.tsx",
      note: "예약 요약 카드와 예약 상세 보정 카드 패턴입니다.",
    },
    {
      file: "src/components/reservation/DiningFeedbackFlow.tsx",
      note: "피드백 요약, 변화 노트, confidence, 셰프용 요약 카드가 있습니다.",
    },
    {
      file: "src/pages/TasteSurveyResultScreen.tsx",
      note: "설문 기반 스타터 프로필 결과 카드 패턴입니다.",
    },
    {
      file: "src/components/system/TCSHintCard.tsx",
      note: "미각 설문과 보정 안내의 힌트 카드를 공용 컴포넌트로 재사용합니다.",
    },
    {
      file: "src/components/system/InterpretationCard.tsx",
      note: "분석 인사이트, 셰프 번역 요약, 홈 변화 요약까지 같은 해석 카드 형태로 재사용합니다.",
    },
    {
      file: "src/pages/ImproveAccuracyScreen.tsx",
      note: "정확도 단계 카드, 장점 카드, 안심 메시지 카드가 추가되었습니다.",
    },
    {
      file: "src/pages/ReservationConfirmationScreen.tsx",
      note: "예약 확정 후 단계별 상태 카드와 완료 요약 카드가 정의되어 있습니다.",
    },
    {
      file: "src/components/system/EmptyState.tsx",
      note: "예약/추천 비어 있음 상태에 쓰이는 공용 empty state 컴포넌트입니다.",
    },
  ],
  navigation: [
    {
      file: "src/components/TopAppBar.tsx",
      note: "알림 배지와 메뉴 액션까지 포함한 현재 상단 내비게이션 shell입니다.",
    },
    {
      file: "src/components/BottomTabBar.tsx",
      note: "블러 배경과 press scale이 추가된 현재 하단 내비게이션 shell입니다.",
    },
    {
      file: "src/components/ui/tabs.tsx",
      note: "정의된 세그먼트 / tabs 프리미티브입니다.",
    },
  ],
  feedback: [
    {
      file: "src/components/ui/alert.tsx",
      note: "정의된 alert 프리미티브입니다.",
    },
    {
      file: "src/components/ui/progress.tsx",
      note: "정의된 progress 프리미티브입니다.",
    },
    {
      file: "src/components/ui/skeleton.tsx",
      note: "정의된 skeleton 프리미티브입니다.",
    },
    {
      file: "src/components/system/EmptyState.tsx",
      note: "DiningPage에서 실제로 사용하는 empty state 피드백 컴포넌트입니다.",
    },
    {
      file: "src/components/system/ToastSurface.tsx",
      note: "테이스트 리스트 액션 뒤에 뜨는 실제 앱 토스트 표면입니다.",
    },
    {
      file: "src/components/ui/sonner.tsx",
      note: "generic toast wrapper입니다. 제품 액션 토스트 표면은 ToastSurface가 담당합니다.",
    },
  ],
  overlay: [
    {
      file: "src/components/ui/dialog.tsx",
      note: "dialog 프리미티브입니다.",
    },
    {
      file: "src/components/ui/sheet.tsx",
      note: "sheet / bottom-sheet 프리미티브입니다.",
    },
    {
      file: "src/components/ui/popover.tsx",
      note: "popover 프리미티브입니다.",
    },
    {
      file: "src/components/ui/tooltip.tsx",
      note: "tooltip 프리미티브입니다.",
    },
    {
      file: "src/components/NotificationPanel.tsx",
      note: "현재 제품에서 실제로 쓰이는 상단 notification overlay입니다.",
    },
    {
      file: "src/components/AppMenuDrawer.tsx",
      note: "현재 제품에서 실제로 쓰이는 우측 menu drawer입니다.",
    },
  ],
  appSpecific: [
    {
      file: "src/components/system",
      note: "메인 앱 전용 재사용 컴포넌트입니다.",
    },
    {
      file: "src/components/system/TasteProfileAvatar.tsx",
      note: "미각 측정값 6축으로 멀티컬러 기본 프로필 아바타를 만드는 공용 컴포넌트입니다.",
    },
    {
      file: "src/components/system/profileAvatarSizeTokens.ts",
      note: "프로필형 아바타가 공유하는 sm 32px, md 42px, lg 68px, xl 96px 사이즈 토큰입니다.",
    },
    {
      file: "src/components/system/PalateSignatureAvatar.tsx",
      note: "0-100 미각 비율을 차트가 아닌 개인 미각 시그니처형 avatar로 표현하는 SVG 컴포넌트입니다.",
    },
    {
      file: "src/components/system/PalateBloomAvatar.tsx",
      note: "미각 우선순위를 6개 꽃 구조 레이어로 번역하는 SVG 프로필 아바타입니다.",
    },
    {
      file: "src/components/system/PalateOrbAvatar.tsx",
      note: "앞면/뒷면 조각의 깊이감으로 미각 우선순위를 표현하는 SVG 프로필 아바타입니다.",
    },
    {
      file: "src/components/measurement/TasteMeasurementMiniCta.tsx",
      note: "Taste Buddy 전용 CTA 카드입니다.",
    },
    {
      file: "src/components/reservation/DiningFeedbackFlow.tsx",
      note: "플로우 전용 custom choice와 feedback block이 있습니다.",
    },
    {
      file: "src/pages/ImproveAccuracyScreen.tsx",
      note: "선택형 정밀도 개선 안내와 benefits를 묶은 app-specific screen입니다.",
    },
    {
      file: "src/pages/ReservationConfirmationScreen.tsx",
      note: "예약 확정 후 상태 진행을 보여주는 신규 composite screen입니다.",
    },
  ],
  componentSpecs: [
    {
      file: "src/components/design-system/componentStyleSpecs.ts",
      note: "복사용 컴포넌트 스타일 값과 코덱스 프롬프트 템플릿이 정의됩니다.",
    },
    {
      file: "src/styles/design-system.css",
      note: "tb-* 공용 클래스 기반 컴포넌트의 실제 스타일 원본입니다.",
    },
    {
      file: "src/components/ui",
      note: "Badge, Button, Input, Select, Tabs, Overlay 프리미티브의 정의 위치입니다.",
    },
  ],
  auditNotes: [
    {
      file: "DESIGN.md",
      note: "현재 기준으로 사용하는 디자인 시스템 문서입니다.",
    },
    {
      file: "src/pages/OnboardingScreen.tsx",
      note: "실사용 중인 motion token과 온보딩 타이포그래피를 보여줍니다.",
    },
    {
      file: "src/pages/AnalysisPage.tsx",
      note: "data-viz token, section title, 혼합 아이콘 사용 예시를 보여줍니다.",
    },
  ],
};

export const PLAYGROUND_DEFAULTS = {
  accentTaste: "sweet" as TasteId,
  background: COLOR_TOKENS.background.page,
  bodyText: COLOR_TOKENS.text.body,
  border: COLOR_TOKENS.border.default,
  cardRadius: Number.parseInt(RADIUS_TOKENS[20], 10),
  cardSurface: COLOR_TOKENS.surface.card,
  controlRadius: Number.parseInt(RADIUS_TOKENS[10], 10),
  displaySize: Number.parseInt(TYPOGRAPHY_TOKENS.fontSize[28], 10),
  fontWeight: TYPOGRAPHY_TOKENS.fontWeight.semibold,
  gap: Number.parseInt(SPACING_TOKENS[12], 10),
  iconSize: ICON_TOKENS.size.xl,
  primaryShadow: SHADOW_TOKENS.button,
  primaryText: COLOR_TOKENS.text.primary,
  sectionGap: Number.parseInt(SPACING_TOKENS[20], 10),
  titleSize: Number.parseInt(TYPOGRAPHY_TOKENS.fontSize[18], 10),
} as const;

export const AUDIT_SUMMARY = {
  componentCount: CURRENTLY_USED_COMPONENTS.length,
  definedPrimitiveCount: UNUSED_UI_PRIMITIVES.length,
  motionDuration: MOTION_TOKENS.durationMs.normal,
  screenMaxWidth: LAYOUT_TOKENS.screenMaxWidth,
  sharedButtonHeight: COMPONENT_TOKENS.button.height,
};
