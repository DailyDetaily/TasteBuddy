import { MOTION_TOKENS } from './designTokens';

/** Plating Motion 1.0. UI roles are shared; platform curves keep their own model. */
export const PLATING_MOTION_ROLES = {
  press: { label: '누르기', durationMs: MOTION_TOKENS.durationMs.press, use: '버튼 누름과 복귀' },
  feedback: { label: '응답하기', durationMs: MOTION_TOKENS.durationMs.fast, use: '선택·아이콘·탭의 상태 변화' },
  content: { label: '정돈하기', durationMs: MOTION_TOKENS.durationMs.normal, use: '카드·단계·기간 교체' },
  sheet: { label: '펼치기', durationMs: MOTION_TOKENS.durationMs.medium, use: '시트·질문·그래프 등장' },
  bloom: { label: '피어나기', durationMs: MOTION_TOKENS.durationMs.slowest, use: '기록 진입·심벌·결과 강조' },
} as const;

export type PlatingMotionRole = keyof typeof PLATING_MOTION_ROLES;
export type PlatingFrameValues = Partial<Pick<Keyframe, 'opacity' | 'transform' | 'filter' | 'clipPath'>>;
export interface PlatingKeyframe {
  offset: number;
  label: string;
  values: PlatingFrameValues;
}
export interface PlatingMotionRecipe {
  id: string;
  name: string;
  role: PlatingMotionRole;
  durationMs: number;
  delayMs: number;
  easing: string;
  origin: string;
  trigger: string;
  scope: string;
  source: string;
  selector?: string;
  frames: readonly PlatingKeyframe[];
}

const keyframe = (offset: number, label: string, values: PlatingFrameValues): PlatingKeyframe => ({ offset, label, values });
const roleDuration = (role: PlatingMotionRole) => PLATING_MOTION_ROLES[role].durationMs;
const nativeSource = 'ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift';
const adaptedScope = 'iOS의 상태·거리 규칙을 웹 키프레임으로 정의. 웹 프리뷰에서 사용하며 제품 화면 확대 적용은 별도.';

/** Explicit start/end states. Easing applies to each interval, matching CSS keyframes. */
export const PLATING_MOTION_RECIPES = {
  pressIn: {
    id: 'plating-press-in', name: '누름', role: 'press', durationMs: roleDuration('press'), delayMs: 0,
    easing: MOTION_TOKENS.easing.standard, origin: '50% 50%', trigger: '포인터·키보드 누름 시작',
    scope: adaptedScope, source: nativeSource,
    frames: [keyframe(0, '기본', { transform: 'scale(1)' }), keyframe(1, '눌림', { transform: 'scale(0.98)' })],
  },
  pressOut: {
    id: 'plating-press-out', name: '누름 복귀', role: 'press', durationMs: roleDuration('press'), delayMs: 0,
    easing: MOTION_TOKENS.easing.entrance, origin: '50% 50%', trigger: '누름 해제·취소',
    scope: adaptedScope, source: nativeSource,
    frames: [keyframe(0, '눌림', { transform: 'scale(0.98)' }), keyframe(1, '기본', { transform: 'scale(1)' })],
  },
  feedback: {
    id: 'plating-feedback', name: '선택 응답', role: 'feedback', durationMs: roleDuration('feedback'), delayMs: 0,
    easing: MOTION_TOKENS.easing.entrance, origin: '50% 50%', trigger: '선택 표시·상태 없는 아이콘 교체',
    scope: adaptedScope, source: nativeSource,
    frames: [keyframe(0, '교체 전', { opacity: 0, transform: 'scale(0.9)' }), keyframe(1, '선택됨', { opacity: 1, transform: 'scale(1)' })],
  },
  contentEnter: {
    id: 'plating-content-enter', name: '콘텐츠 등장', role: 'content', durationMs: roleDuration('content'), delayMs: 0,
    easing: MOTION_TOKENS.easing.entrance, origin: '50% 50%', trigger: '새 카드·콘텐츠 진입',
    scope: adaptedScope, source: nativeSource,
    frames: [keyframe(0, '준비', { opacity: 0, transform: 'translateY(8px)' }), keyframe(1, '자리 잡음', { opacity: 1, transform: 'translateY(0)' })],
  },
  contentExit: {
    id: 'plating-content-exit', name: '콘텐츠 퇴장', role: 'content', durationMs: roleDuration('content'), delayMs: 0,
    easing: MOTION_TOKENS.easing.exit, origin: '50% 50%', trigger: '질문 접힘·이전 콘텐츠 정리',
    scope: adaptedScope, source: nativeSource,
    frames: [keyframe(0, '표시 중', { opacity: 1, transform: 'translateY(0)' }), keyframe(1, '퇴장', { opacity: 0, transform: 'translateY(-8px)' })],
  },
  questionEnter: {
    id: 'plating-question-enter', name: '질문 펼침', role: 'sheet', durationMs: roleDuration('sheet'), delayMs: 0,
    easing: MOTION_TOKENS.easing.entrance, origin: '50% 0%', trigger: '질문 답변·대기 카드 펼침',
    scope: adaptedScope, source: nativeSource,
    frames: [keyframe(0, '접힘', { opacity: 0, transform: 'translateY(-20px) scale(0.97)' }), keyframe(1, '펼침', { opacity: 1, transform: 'translateY(0) scale(1)' })],
  },
  sheetEnter: {
    id: 'plating-sheet-enter', name: '시트 열기', role: 'sheet', durationMs: roleDuration('sheet'), delayMs: 0,
    easing: MOTION_TOKENS.easing.entrance, origin: '50% 100%', trigger: '하단 시트 열기',
    scope: adaptedScope, source: nativeSource,
    frames: [keyframe(0, '아래쪽', { transform: 'translateY(100%)' }), keyframe(1, '열림', { transform: 'translateY(0)' })],
  },
  sheetExit: {
    id: 'plating-sheet-exit', name: '시트 닫기', role: 'sheet', durationMs: roleDuration('sheet'), delayMs: 0,
    easing: MOTION_TOKENS.easing.exit, origin: '50% 100%', trigger: '하단 시트 닫기',
    scope: adaptedScope, source: nativeSource,
    frames: [keyframe(0, '열림', { transform: 'translateY(0)' }), keyframe(1, '아래쪽', { transform: 'translateY(100%)' })],
  },
  chartReveal: {
    id: 'plating-chart-reveal', name: '그래프 드러내기', role: 'sheet', durationMs: roleDuration('sheet'), delayMs: 0,
    easing: MOTION_TOKENS.easing.entrance, origin: '0% 50%', trigger: '선 그래프가 뷰포트에 들어왔을 때 한 번',
    scope: '최종 데이터 위의 표시 마스크만 연다. 수치·좌표를 애니메이션으로 바꾸지 않는다.', source: nativeSource,
    frames: [keyframe(0, '마스크 닫힘', { clipPath: 'inset(0 100% 0 0)' }), keyframe(1, '전체 표시', { clipPath: 'inset(0 0% 0 0)' })],
  },
  resultBloom: {
    id: 'plating-result-bloom', name: '결과 카드 블룸', role: 'bloom', durationMs: 860, delayMs: 120,
    easing: 'cubic-bezier(0.18, 0.92, 0.2, 1)', origin: '50% 58%', trigger: '웹 식사 기록 결과 카드 진입',
    scope: '기존 웹 결과 카드에 연결. iOS 720ms 역할 및 Remotion 블룸 프레임과 별도 시퀀스.',
    source: 'src/constants/platingMotion.ts', selector: '.dining-result-card-bloom',
    frames: [
      keyframe(0, '응축', { opacity: 0, filter: 'blur(8px)', transform: 'translate3d(0, 24px, 0) scale(0.88)' }),
      keyframe(0.46, '봉우리', { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0, -4px, 0) scale(1.018)' }),
      keyframe(0.72, '복귀', { transform: 'translate3d(0, 1px, 0) scale(0.996)' }),
      keyframe(1, '안착', { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0, 0, 0) scale(1)' }),
    ],
  },
} as const satisfies Record<string, PlatingMotionRecipe>;

export type PlatingMotionName = keyof typeof PLATING_MOTION_RECIPES;
export const PLATING_MAX_STAGGER_MS = 240;

/** Use on a dedicated motion wrapper; cancel the prior Animation before replacing it. */
export function getPlatingMotion(name: PlatingMotionName, { reducedMotion = false, index = 0 } = {}) {
  const recipe: PlatingMotionRecipe = PLATING_MOTION_RECIPES[name];
  const last = recipe.frames[recipe.frames.length - 1].values;
  const staggerIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const keyframes: Keyframe[] = reducedMotion
    ? [{ ...last, offset: 0 }, { ...last, offset: 1 }]
    : recipe.frames.map(({ offset, values }) => ({ ...values, offset, easing: recipe.easing }));
  const options: KeyframeAnimationOptions = {
    duration: reducedMotion ? 0 : recipe.durationMs,
    delay: reducedMotion ? 0 : recipe.delayMs + Math.min(staggerIndex * MOTION_TOKENS.staggerMs, PLATING_MAX_STAGGER_MS),
    // Per-keyframe easing above matches CSS. Do not ease the whole timeline again.
    easing: 'linear', fill: 'both', iterations: 1,
  };
  return { keyframes, options, origin: recipe.origin };
}

/** Timeline landmarks, not a substitute renderer for the source geometry/physics. */
export const PLATING_SIGNATURE_MOTIONS = [
  {
    id: 'bloom-frame', name: '블룸 프레임', englishName: 'Bloom Frame', platform: 'Remotion',
    source: 'brand-launch/src/TabBarCameraEntry/result-card-motion.ts',
    curve: '구간별 smoothstep · t²(3−2t)', duration: '1.66s',
    rule: '흰 원본 심벌 → O → 카드 외곽 → 사진 프레임. 안쪽 확장은 외곽보다 60ms 뒤에 시작한다.',
    landmarks: [
      { timeMs: 20, label: '심벌 등장 시작' }, { timeMs: 380, label: '꽃잎 합체 시작' },
      { timeMs: 600, label: 'O 완성' }, { timeMs: 640, label: '외곽 확장 시작' },
      { timeMs: 700, label: '안쪽 확장 시작' }, { timeMs: 1000, label: '사진 프레임 완성' },
      { timeMs: 1020, label: '사진·초점 등장' }, { timeMs: 1360, label: '블러 14 → 0 완료' },
      { timeMs: 1660, label: '진입 완료' },
    ],
  },
  {
    id: 'sauce-splatter', name: '소스 스플래터', englishName: 'Sauce Splatter', platform: 'Remotion',
    source: 'brand-launch/src/DiningFeedbackMotion/chip-motion.ts',
    curve: '감쇠 스프링 · ω 14 / ζ 0.58', duration: '2개 칩 기준 1.30s',
    rule: '원 → 캡슐 → 86% 높이 압축 → 다음 원 분리. 텍스트 비율과 최종 칩 크기를 보존한다.',
    landmarks: [
      { timeMs: 0, label: '첫 원 등장' }, { timeMs: 120, label: '첫 캡슐 확장' },
      { timeMs: 280, label: '두 번째 원 생성' },
      { timeMs: Math.round((0.12 + Math.PI / (14 * Math.sqrt(1 - 0.58 ** 2))) * 1000), label: '첫 칩 봉우리' },
      { timeMs: 500, label: '두 번째 원 분리·확장' }, { timeMs: 1300, label: '두 칩 안착' },
    ],
  },
] as const;
