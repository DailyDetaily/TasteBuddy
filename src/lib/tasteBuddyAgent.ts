import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import {
  TBA_CORE_TASTE_LEXICON,
  TBA_CORE_TASTE_LEXICON_MIN_ACTIVE_CONFIDENCE,
  TBA_CORE_TASTE_LEXICON_VERSION,
} from '../constants/tbaCoreTasteLexicon';
import {
  canUseLexiconForSurface,
  mapCoreTasteLexiconSignalsForDiningNote,
  rankLexiconForDishKinds,
} from './tbaKnowledge';
import {
  buildCoreTasteKnowledgeDocs,
  buildKnowledgeDocFromLexicon,
  canUseKnowledgeDocForSurface,
  filterKnowledgeDocsForSurface,
  rankKnowledgeDocsForDishKinds,
  retrieveTbaKnowledgeDocs,
  TBA_CORE_TASTE_KNOWLEDGE_DOCS,
} from './tbaKnowledgeDocs';
import {
  TBA_SIGNAL_TAXONOMY,
  TBA_SIGNAL_BY_ID,
} from '../constants/tbaSignalTaxonomy';
import {
  TBA_FOODON_BRIDGE_ENTRIES,
  TBA_FOODON_BRIDGE_VERSION,
  TBA_FOODON_REFERENCE_LICENSE,
  TBA_FOODON_REFERENCE_PATH,
} from '../constants/tbaFoodOnBridge';
import {
  TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES,
  TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_COUNT,
  TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_PATH,
  TBA_FOOD_KNOWLEDGE_RUNTIME_VERSION,
} from '../constants/tbaFoodKnowledgeRuntime';
import {
  findFoodOnBridgeEntriesByText,
  getFoodOnBridgeEntryById,
  mapFoodOnBridgeInput,
} from './tbaFoodOnMapping';
import {
  inferTbaMenuContext,
  getTbaFoodKnowledgeEntryById,
  getTbaFoodKnowledgeEntryLabel,
} from './tbaFoodKnowledgeDataset';
import {
  findTbaSignalDefinitionsByText,
  getTbaSignalById,
  mapCoreLexiconToTbaSignalIds,
  mapFeedbackInputToTbaSignals,
  mapTagsToTbaSignals,
} from './tbaSignalMapping';
import type { TbaCoreTasteLexiconEntry } from '../types/tasteBuddyKnowledge';
import {
  getDishKindLabel,
  inferDishKindIds,
  resolveDishKindLabels,
} from '../constants/dishKindTags';
import { getDiningDetailTagMetadata } from '../constants/diningDetailTags';
import type { TasteMeasurementSnapshot } from '../constants/tasteMeasurementData';
import {
  PERCEPTUAL_AXES,
  type PerceptualAxis,
  type PerceptualVector,
  type TasteVector,
} from '../types/tastePersonalization';
import {
  createZeroPerceptualVector,
  createZeroTasteVector,
} from './tastePersonalization';
import type {
  DiningReview,
  AggregateTasteBuddyAgentEvidenceEventsInput,
  GenerateTasteMatchFeedInput,
  IngestDiningReviewInput,
  PublicTasteProfile,
  TasteIdentitySignal,
  TasteMatchCategory,
  TasteMatchFeedItem,
  TasteBuddyAgentDiningAnalysisSnapshot,
  TasteBuddyAgentConfidenceSignalType,
  TasteBuddyAgentFeedbackEvidenceEvent,
  CalculateTasteBuddyAgentFeedbackEvidenceConfidenceInput,
  TasteBuddyAgentFeedbackEvidenceConfidenceEffect,
  TasteBuddyAgentUserConfidenceState,
  TasteProfileSnapshot,
  TasteProfileStage,
  TasteProfileVisibility,
  TasteSimilarityEdge,
  TasteSimilarityOptions,
  TasteSocialRelation,
} from '../types/tasteBuddyAgent';

const PERCEPTUAL_AXIS_LABELS: Record<PerceptualAxis, string> = {
  aromaIntensity: '향의 선명도',
  brightness: '밝은 산뜻함',
  cleanFinish: '깔끔한 마무리',
  heaviness: '무게감',
  linger: '긴 여운',
  smoke: '스모키함',
  textureRichness: '질감의 밀도',
  thermalImpact: '온도감',
};

const TAG_TASTE_HINTS: Record<string, Partial<Record<TasteId, number>>> = {
  crisp: { sour: 0.58, bitter: 0.16 },
  delicate: { sour: 0.22, bitter: 0.16, fat: -0.2 },
  deep: { umami: 0.62, fat: 0.28 },
  dessert: { sweet: 0.58, fat: 0.22 },
  fermented: { umami: 0.52, sour: 0.24 },
  fresh: { sour: 0.5, bitter: 0.18 },
  gentle: { sweet: 0.2, fat: -0.1, salty: -0.1 },
  grilled: { bitter: 0.22, umami: 0.46, fat: 0.2 },
  rich: { fat: 0.58, umami: 0.22 },
  savory: { umami: 0.6, salty: 0.2 },
  seafood: { umami: 0.48, salty: 0.22, sour: 0.14 },
  smoky: { bitter: 0.28, umami: 0.36 },
  spicy: { bitter: 0.18, sour: 0.2 },
  sweet: { sweet: 0.62 },
};

const TAG_PERCEPTUAL_HINTS: Record<string, Partial<Record<PerceptualAxis, number>>> = {
  crisp: { brightness: 0.58, cleanFinish: 0.5 },
  delicate: { cleanFinish: 0.42, linger: 0.34 },
  deep: { linger: 0.58, heaviness: 0.3 },
  dessert: { textureRichness: 0.42, cleanFinish: 0.24 },
  fermented: { aromaIntensity: 0.42, linger: 0.36 },
  fresh: { brightness: 0.58, cleanFinish: 0.44 },
  gentle: { cleanFinish: 0.34, textureRichness: 0.22 },
  grilled: { smoke: 0.56, aromaIntensity: 0.32 },
  rich: { textureRichness: 0.58, heaviness: 0.42 },
  savory: { linger: 0.42, heaviness: 0.26 },
  seafood: { cleanFinish: 0.36, brightness: 0.2 },
  smoky: { smoke: 0.62, linger: 0.24 },
  spicy: { thermalImpact: 0.44, aromaIntensity: 0.34 },
  sweet: { textureRichness: 0.22, cleanFinish: 0.2 },
};

const DINING_NOTE_TAG_LABELS: Record<string, string> = {
  crisp: '산뜻한 산미',
  deep: '깊은 여운',
  delicate: '섬세한 여운',
  dessert: '디저트 균형',
  fermented: '발효 향',
  fresh: '산뜻한 산미',
  gentle: '부드러운 흐름',
  grilled: '불맛이 선명함',
  rich: '농도감 있음',
  savory: '감칠맛 깊음',
  seafood: '해산물 감칠맛',
  smoky: '스모키한 향',
  spicy: '선명한 향신감',
  sweet: '단맛',
};

const DINING_NOTE_DETAIL_LABELS: Record<string, string> = {
  crisp: '산뜻한 마무리',
  deep: '긴 여운',
  delicate: '섬세한 여운',
  dessert: '디저트 균형',
  fermented: '발효 향',
  fresh: '맑은 향',
  gentle: '부드러운 흐름',
  grilled: '구운 향',
  rich: '농도감',
  savory: '감칠 흐름',
  seafood: '해산물 결',
  smoky: '스모키한 향',
  spicy: '향신감',
  sweet: '정돈된 단맛',
};

const DINING_NOTE_DETAIL_PROSE_LABELS: Record<string, string> = {
  '간이 선명함': '선명한 간',
  '균형이 좋음': '좋은 균형',
  '한 맛이 앞섬': '한 맛이 먼저 보이는 점',
  '단맛이 받쳐줌': '단맛의 받침',
  '산미가 정리함': '산미의 정리감',
  '감칠맛이 깊음': '깊은 감칠맛',
  '마무리가 무거움': '마무리의 무게',
  '강도가 높음': '높은 강도',
  '중심이 또렷함': '또렷한 중심',
  '끝맛이 가벼움': '가벼운 끝맛',
  '맛이 겹쳐짐': '겹쳐지는 맛',
  '모서리가 부드러움': '부드러운 모서리',
  '처음에 선명함': '선명한 첫인상',
  '중반에 퍼짐': '중반에 퍼지는 맛',
  '뒤로 갈수록 깊어짐': '뒤로 갈수록 깊어지는 흐름',
  '피니시가 깨끗함': '깨끗한 피니시',
  '오래 남음': '오래 남는 여운',
  '빠르게 사라짐': '빠르게 사라지는 끝맛',
  '다음 맛을 열어줌': '다음 맛을 열어주는 흐름',
  '끝에 쌓임': '끝에 쌓이는 무게',
  '앞맛이 부드러움': '부드러운 앞맛',
  '중반이 조여짐': '조여지는 중반',
  '리듬이 매끄러움': '매끄러운 리듬',
  '마무리가 조용함': '조용한 마무리',
  '부드러움': '부드러운 질감',
  '밀도 있음': '밀도 있는 질감',
  '가벼움': '가벼운 질감',
  '코팅감 있음': '입안에 남는 코팅감',
  '건조함': '건조한 질감',
  '온도가 잘 맞음': '잘 맞은 온도',
  '차갑게 정리됨': '차갑게 정리되는 느낌',
  '따뜻하게 퍼짐': '따뜻하게 퍼지는 느낌',
  '씹는 힘이 있음': '씹는 힘',
  '수분감 있음': '수분감',
  '재료감이 선명함': '선명한 재료감',
  '굽기가 좋음': '좋은 굽기',
  '소스가 이끎': '소스가 이끄는 흐름',
  '지방이 받쳐줌': '지방의 받침',
  '산미가 구조를 만듦': '산미가 잡아주는 구조',
  '대비가 좋음': '좋은 대비',
  '재료 간 연결이 좋음': '재료 사이의 연결감',
  '조리가 강함': '강한 조리감',
  '구성감이 좋음': '좋은 구성감',
  '가니시가 맞음': '가니시의 균형',
  '불맛이 선명함': '선명한 불맛',
  '양감이 적절함': '적절한 양감',
  '코스 연결이 좋음': '좋은 코스 연결',
};

const LEXICON_CATEGORY_LABELS: Record<TbaCoreTasteLexiconEntry['category'], string> = {
  aroma: '향 신호',
  composition: '구성 신호',
  finish: '여운 신호',
  ingredient: '재료 신호',
  process: '조리 신호',
  taste: '미각 신호',
  texture: '질감 신호',
};

export interface TasteBuddyAgentDiningNoteTag {
  id: string;
  label: string;
  title?: string;
}

export interface TasteBuddyAgentDiningNoteTasteBubble extends TasteBuddyAgentDiningNoteTag {
  colorTaste?: string;
}

export interface TasteBuddyAgentDiningNote {
  detailTags: TasteBuddyAgentDiningNoteTag[];
  summary: string;
  tasteBubbles: TasteBuddyAgentDiningNoteTasteBubble[];
}

export type TasteBuddyAgentResponsibility =
  | 'taste-identity'
  | 'public-profile'
  | 'core-taste-lexicon'
  | 'food-knowledge-rag'
  | 'dining-review-ingestion'
  | 'dining-note'
  | 'preference-learning'
  | 'taste-similarity'
  | 'taste-match-feed'
  | 'confidence-gating'
  | 'recommendation-explanation';

export interface TasteBuddyAgentCapability {
  id: TasteBuddyAgentResponsibility;
  label: string;
  description: string;
}

export const TASTE_BUDDY_AGENT_NAME = 'TasteBuddyAgent';
export const TASTE_BUDDY_AGENT_ALIAS = 'TBA';
export const TBA_DINING_ANALYSIS_SNAPSHOT_VERSION = 'tba-dining-analysis-v1';

export const TASTE_BUDDY_AGENT_CAPABILITIES: readonly TasteBuddyAgentCapability[] = [
  {
    id: 'taste-identity',
    label: 'Taste Identity',
    description: '6축 미각 측정값, 식후 피드백, 리뷰 기록을 해석해 사용자의 안정적인 미각 정체성을 만듭니다.',
  },
  {
    id: 'public-profile',
    label: 'Public Taste Profile',
    description: 'raw measurement 대신 공개 가능한 taste signature와 공개 리뷰만 소셜 그래프에 노출합니다.',
  },
  {
    id: 'core-taste-lexicon',
    label: 'Core Taste Lexicon',
    description: 'TBA가 미각 버블, 디테일 태그, 미식 노트, 추천 설명을 같은 기준어휘로 해석하도록 100개 핵심 미각 개념을 관리합니다.',
  },
  {
    id: 'food-knowledge-rag',
    label: 'Food Knowledge RAG',
    description: 'FoodSky/FoodEarth, FoodOn taxonomy, recipe technique pattern을 검색 근거로 사용해 메뉴의 재료/조리/음식 종류 맥락을 보강합니다.',
  },
  {
    id: 'dining-review-ingestion',
    label: 'Dining Review Ingestion',
    description: '별점, 메뉴, 디시 종류, 미각 태그, 디테일 태그, 자유 문장을 구조화된 taste evidence로 정리합니다.',
  },
  {
    id: 'dining-note',
    label: 'Dining Note',
    description: '작성자의 6축 미각 프로필과 메뉴 종류를 반영해 사용자가 직접 쓴 것처럼 읽히는 미식 노트를 만듭니다.',
  },
  {
    id: 'taste-similarity',
    label: 'Taste Similarity',
    description: 'taste, perceptual, preference, review behavior 신호를 confidence에 따라 감쇠해 사용자 간 입맛 거리를 계산합니다.',
  },
  {
    id: 'taste-match-feed',
    label: 'Taste Match Feed',
    description: '유사 사용자 공개 리뷰, 음식 적합도, 리뷰 신뢰도, 최근성, 다양성을 합산해 홈 피드를 구성합니다.',
  },
  {
    id: 'preference-learning',
    label: 'Preference Learning',
    description: '앱 피드백에서 반복 선택된 미각 버블, 디테일 태그, 재방문 의향을 사용자별 선호 confidence로 업데이트합니다.',
  },
  {
    id: 'confidence-gating',
    label: 'Confidence Gating',
    description: '검수와 앱 피드백 confidence가 낮은 지식 항목은 추천, 셰프 가이드, TCS 보정에 사용하지 않습니다.',
  },
  {
    id: 'recommendation-explanation',
    label: 'Recommendation Explanation',
    description: '점수 자체보다 어떤 미각 신호가 맞는지 설명하는 문장을 deterministic fallback으로 생성합니다.',
  },
] as const;

interface BuildDiningNoteInput {
  detailTags: readonly string[];
  dishKindTags?: readonly string[];
  id: string;
  ingredients?: readonly string[];
  restaurantName: string;
  reviewSnippet?: string;
  reviewerProfile?: TasteProfileSnapshot;
  reviewerName?: string;
  subject: string;
  tasteTags: readonly string[];
  techniques?: readonly string[];
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals = 3) {
  return Number(value.toFixed(decimals));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeEvidenceIds(ids: readonly string[] | undefined) {
  return Array.from(new Set((ids ?? []).map((id) => id.trim()).filter(Boolean))).sort();
}

function haveDifferentEvidenceIds(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
) {
  const normalizedLeft = normalizeEvidenceIds(left);
  const normalizedRight = normalizeEvidenceIds(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return true;
  }

  return normalizedLeft.some((id, index) => id !== normalizedRight[index]);
}

function getEvidenceStateConfidence(
  state: CalculateTasteBuddyAgentFeedbackEvidenceConfidenceInput['next'],
) {
  return clamp(state?.tbaConfidence ?? state?.snapshot?.confidence ?? 0);
}

function getEvidenceSnapshotFingerprint(
  state: CalculateTasteBuddyAgentFeedbackEvidenceConfidenceInput['next'],
) {
  const snapshot = state?.snapshot;

  if (!snapshot) {
    return '';
  }

  return JSON.stringify({
    detailTags: snapshot.detailTags.map((tag) => tag.id),
    foodKnowledgeMatchIds: snapshot.foodKnowledgeMatchIds,
    foodOnMatchIds: snapshot.foodOnMatchIds,
    lexiconCandidateIds: snapshot.lexiconCandidateIds,
    summary: snapshot.summary,
    tasteBubbles: snapshot.tasteBubbles.map((tag) => tag.id),
    tbaSignalIds: snapshot.tbaSignalIds,
    version: snapshot.version,
  });
}

export function calculateFeedbackEvidenceConfidenceEffect(
  input: CalculateTasteBuddyAgentFeedbackEvidenceConfidenceInput,
): TasteBuddyAgentFeedbackEvidenceConfidenceEffect {
  const previousEffectiveConfidence = getEvidenceStateConfidence(input.previous);
  const nextBaseConfidence = getEvidenceStateConfidence(input.next);

  if (input.eventType === 'deleted') {
    return {
      action: 'remove',
      changedDimensions: ['snapshot'],
      confidenceDelta: roundTo(-previousEffectiveConfidence),
      confidenceLift: 0,
      nextEffectiveConfidence: 0,
      previousEffectiveConfidence: roundTo(previousEffectiveConfidence),
      reasons: ['삭제된 피드백은 선호 하락이 아니라 해당 evidence를 confidence 계산에서 제외하는 신호로 처리합니다.'],
    };
  }

  const changedDimensions: TasteBuddyAgentFeedbackEvidenceConfidenceEffect['changedDimensions'] = [];

  if (haveDifferentEvidenceIds(input.previous?.tasteTagIds, input.next?.tasteTagIds)) {
    changedDimensions.push('taste');
  }

  if (haveDifferentEvidenceIds(input.previous?.detailTagIds, input.next?.detailTagIds)) {
    changedDimensions.push('detail');
  }

  if (haveDifferentEvidenceIds(input.previous?.dishKindIds, input.next?.dishKindIds)) {
    changedDimensions.push('dish-kind');
  }

  if (haveDifferentEvidenceIds(input.previous?.signalIds, input.next?.signalIds)) {
    changedDimensions.push('signal');
  }

  if (getEvidenceSnapshotFingerprint(input.previous) !== getEvidenceSnapshotFingerprint(input.next)) {
    changedDimensions.push('snapshot');
  }

  const confidenceLift = clamp(
    (changedDimensions.includes('taste') ? 0.08 : 0) +
      (changedDimensions.includes('detail') ? 0.06 : 0) +
      (changedDimensions.includes('dish-kind') ? 0.04 : 0),
    0,
    0.16,
  );
  const nextEffectiveConfidence = clamp(nextBaseConfidence + confidenceLift);
  const action =
    input.eventType === 'created'
      ? 'include'
      : changedDimensions.length > 0 || confidenceLift > 0
        ? 'adjust'
        : 'ignore';
  const reasons = [
    input.eventType === 'created'
      ? '새 피드백은 TBA confidence 계산에 포함할 수 있는 evidence로 기록합니다.'
      : changedDimensions.length > 0
        ? '사용자가 수정한 태그와 메뉴 종류는 TBA 자동 해석보다 강한 보정 신호로 기록합니다.'
        : '해석 근거가 바뀌지 않아 confidence 재계산은 보류할 수 있습니다.',
  ];

  if (confidenceLift > 0) {
    reasons.push('사용자 수정 신호가 있어 해당 evidence의 유효 confidence를 소폭 올려 기록합니다.');
  }

  return {
    action,
    changedDimensions,
    confidenceDelta: roundTo(nextEffectiveConfidence - previousEffectiveConfidence),
    confidenceLift: roundTo(confidenceLift),
    nextEffectiveConfidence: roundTo(nextEffectiveConfidence),
    previousEffectiveConfidence: roundTo(previousEffectiveConfidence),
    reasons,
  };
}

type ConfidenceSignalTarget = {
  label?: string;
  signalId: string;
  signalType: TasteBuddyAgentConfidenceSignalType;
};

type MutableUserConfidenceState = TasteBuddyAgentUserConfidenceState & {
  effectiveConfidenceSum: number;
};

function getConfidenceSignalKey(signalType: TasteBuddyAgentConfidenceSignalType, signalId: string) {
  return `${signalType}:${signalId}`;
}

function getConfidenceSignalLabel(signalType: TasteBuddyAgentConfidenceSignalType, signalId: string) {
  if (signalType === 'dish-kind') {
    return getDishKindLabel(signalId);
  }

  if (signalType === 'tba-signal') {
    return getTbaSignalById(signalId)?.label ?? signalId;
  }

  if (signalType === 'lexicon') {
    return TBA_CORE_TASTE_LEXICON.find((entry) => entry.id === signalId)?.label ?? signalId;
  }

  if (signalType === 'food-knowledge') {
    const entry = getTbaFoodKnowledgeEntryById(TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES, signalId);
    return entry ? getTbaFoodKnowledgeEntryLabel(entry) : signalId;
  }

  return getFoodOnBridgeEntryById(signalId)?.koName ?? getFoodOnBridgeEntryById(signalId)?.canonicalName ?? signalId;
}

function uniqueConfidenceTargets(targets: readonly ConfidenceSignalTarget[]) {
  const seenKeys = new Set<string>();

  return targets.filter((target) => {
    const key = getConfidenceSignalKey(target.signalType, target.signalId);

    if (!target.signalId || seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function pickNonEmptyStringArray(
  primary: readonly string[] | null | undefined,
  fallback: readonly string[] | null | undefined,
) {
  return primary?.length ? primary : fallback ?? [];
}

function getEventConfidenceTargets(
  event: TasteBuddyAgentFeedbackEvidenceEvent,
  side: 'next' | 'previous',
) {
  const snapshot = side === 'next' ? event.nextSnapshot : event.previousSnapshot;
  const signalIds = side === 'next' ? event.nextSignalIds : event.previousSignalIds;
  const dishKindIds = side === 'next' ? event.nextDishKindIds : event.previousDishKindIds;

  return uniqueConfidenceTargets([
    ...pickNonEmptyStringArray(signalIds, snapshot?.tbaSignalIds).map((signalId) => ({
      label: getConfidenceSignalLabel('tba-signal', signalId),
      signalId,
      signalType: 'tba-signal' as const,
    })),
    ...(snapshot?.lexiconCandidateIds ?? []).map((signalId) => ({
      label: getConfidenceSignalLabel('lexicon', signalId),
      signalId,
      signalType: 'lexicon' as const,
    })),
    ...(snapshot?.foodOnMatchIds ?? []).map((signalId) => ({
      label: getConfidenceSignalLabel('foodon', signalId),
      signalId,
      signalType: 'foodon' as const,
    })),
    ...(snapshot?.foodKnowledgeMatchIds ?? []).map((signalId) => ({
      label: getConfidenceSignalLabel('food-knowledge', signalId),
      signalId,
      signalType: 'food-knowledge' as const,
    })),
    ...(dishKindIds ?? []).map((signalId) => ({
      label: getConfidenceSignalLabel('dish-kind', signalId),
      signalId,
      signalType: 'dish-kind' as const,
    })),
  ]);
}

function getMutableConfidenceState(
  statesByKey: Map<string, MutableUserConfidenceState>,
  target: ConfidenceSignalTarget,
) {
  const key = getConfidenceSignalKey(target.signalType, target.signalId);
  const existing = statesByKey.get(key);

  if (existing) {
    if (target.label && !existing.label) {
      existing.label = target.label;
    }

    return existing;
  }

  const state: MutableUserConfidenceState = {
    adjustCount: 0,
    confidence: 0.5,
    effectiveConfidenceSum: 0,
    evidenceCount: 0,
    label: target.label ?? getConfidenceSignalLabel(target.signalType, target.signalId),
    payload: {},
    removeCount: 0,
    signalId: target.signalId,
    signalType: target.signalType,
    supportCount: 0,
  };

  statesByKey.set(key, state);
  return state;
}

function applyConfidenceTargetEvidence(params: {
  effectiveConfidence: number;
  event: TasteBuddyAgentFeedbackEvidenceEvent;
  mode: 'adjust' | 'remove' | 'support';
  statesByKey: Map<string, MutableUserConfidenceState>;
  target: ConfidenceSignalTarget;
}) {
  const state = getMutableConfidenceState(params.statesByKey, params.target);

  if (params.mode === 'remove') {
    state.removeCount += 1;
  } else if (params.mode === 'adjust') {
    state.adjustCount += 1;
    state.evidenceCount += 1;
    state.effectiveConfidenceSum += params.effectiveConfidence;
  } else {
    state.supportCount += 1;
    state.evidenceCount += 1;
    state.effectiveConfidenceSum += params.effectiveConfidence;
  }

  state.lastEventId = params.event.id ?? state.lastEventId;
  state.lastEvidenceAt = params.event.createdAt ?? state.lastEvidenceAt;
}

function finalizeConfidenceState(state: MutableUserConfidenceState): TasteBuddyAgentUserConfidenceState {
  const positiveCount = state.supportCount + state.adjustCount;
  const averageEffectiveConfidence = positiveCount > 0
    ? state.effectiveConfidenceSum / positiveCount
    : 0;
  const confidence = clamp(
    0.42 +
      state.supportCount * 0.07 +
      state.adjustCount * 0.05 -
      state.removeCount * 0.1 +
      averageEffectiveConfidence * 0.25,
    0.05,
    0.98,
  );
  const { effectiveConfidenceSum: _effectiveConfidenceSum, ...publicState } = state;

  return {
    ...publicState,
    confidence: roundTo(confidence),
    payload: {
      ...publicState.payload,
      averageEffectiveConfidence: roundTo(averageEffectiveConfidence),
    },
  };
}

export function aggregateFeedbackEvidenceEvents({
  events,
}: AggregateTasteBuddyAgentEvidenceEventsInput): TasteBuddyAgentUserConfidenceState[] {
  const statesByKey = new Map<string, MutableUserConfidenceState>();

  events
    .slice()
    .sort((left, right) => (left.createdAt ?? '').localeCompare(right.createdAt ?? ''))
    .forEach((event) => {
      const effectiveConfidence = clamp(
        event.confidenceEffect?.nextEffectiveConfidence ??
          event.confidenceDelta ??
          event.nextSnapshot?.confidence ??
          event.previousSnapshot?.confidence ??
          0.5,
      );

      if (event.evidenceAction === 'remove' || event.eventType === 'deleted') {
        getEventConfidenceTargets(event, 'previous').forEach((target) => {
          applyConfidenceTargetEvidence({
            effectiveConfidence,
            event,
            mode: 'remove',
            statesByKey,
            target,
          });
        });
        return;
      }

      const nextTargets = getEventConfidenceTargets(event, 'next');
      const previousTargetKeys = new Set(
        getEventConfidenceTargets(event, 'previous').map((target) =>
          getConfidenceSignalKey(target.signalType, target.signalId),
        ),
      );
      const nextTargetKeys = new Set(
        nextTargets.map((target) => getConfidenceSignalKey(target.signalType, target.signalId)),
      );

      if (event.evidenceAction === 'adjust') {
        getEventConfidenceTargets(event, 'previous')
          .filter((target) => !nextTargetKeys.has(getConfidenceSignalKey(target.signalType, target.signalId)))
          .forEach((target) => {
            applyConfidenceTargetEvidence({
              effectiveConfidence,
              event,
              mode: 'remove',
              statesByKey,
              target,
            });
          });
      }

      nextTargets.forEach((target) => {
        applyConfidenceTargetEvidence({
          effectiveConfidence,
          event,
          mode: event.evidenceAction === 'adjust' && previousTargetKeys.size > 0 ? 'adjust' : 'support',
          statesByKey,
          target,
        });
      });
    });

  return Array.from(statesByKey.values())
    .map(finalizeConfidenceState)
    .sort((left, right) => (
      right.confidence - left.confidence ||
      right.evidenceCount - left.evidenceCount ||
      left.signalId.localeCompare(right.signalId, 'ko')
    ));
}

function normalizeTasteMeasurementValue(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0.5;
  }

  return clamp(value / 10);
}

function getTasteLabel(tasteId: TasteId) {
  return TASTE_TOKENS[tasteId].label;
}

function getTopTasteIds(vector: TasteVector, count = 2) {
  return TASTE_IDS
    .slice()
    .sort((left, right) => vector[right] - vector[left])
    .slice(0, count);
}

function getTopPerceptualAxes(vector: PerceptualVector, count = 2) {
  return PERCEPTUAL_AXES
    .slice()
    .sort((left, right) => vector[right] - vector[left])
    .slice(0, count);
}

function createTasteVectorFromMeasurement(snapshot: TasteMeasurementSnapshot): TasteVector {
  const vector = createZeroTasteVector();

  for (const tasteId of TASTE_IDS) {
    vector[tasteId] = normalizeTasteMeasurementValue(snapshot.results[tasteId]);
  }

  return vector;
}

function inferPerceptualVector(tasteVector: TasteVector): PerceptualVector {
  const vector = createZeroPerceptualVector();

  vector.brightness = roundTo(clamp(tasteVector.sour * 0.55 + tasteVector.bitter * 0.15 + (1 - tasteVector.fat) * 0.18));
  vector.heaviness = roundTo(clamp(tasteVector.fat * 0.58 + tasteVector.umami * 0.28 + tasteVector.salty * 0.08));
  vector.cleanFinish = roundTo(clamp((1 - tasteVector.fat) * 0.42 + tasteVector.sour * 0.28 + (1 - tasteVector.umami) * 0.12));
  vector.linger = roundTo(clamp(tasteVector.umami * 0.36 + tasteVector.bitter * 0.24 + tasteVector.fat * 0.2));
  vector.smoke = roundTo(clamp(tasteVector.bitter * 0.34 + tasteVector.umami * 0.2 + tasteVector.fat * 0.12));
  vector.aromaIntensity = roundTo(clamp(tasteVector.sour * 0.25 + tasteVector.bitter * 0.22 + tasteVector.umami * 0.18 + tasteVector.sweet * 0.12));
  vector.textureRichness = roundTo(clamp(tasteVector.fat * 0.5 + tasteVector.umami * 0.2 + tasteVector.sweet * 0.12));
  vector.thermalImpact = roundTo(clamp(tasteVector.bitter * 0.18 + tasteVector.sour * 0.16 + tasteVector.salty * 0.14 + tasteVector.umami * 0.12));

  return vector;
}

function inferSensitivityVector(tasteVector: TasteVector): TasteVector {
  const vector = createZeroTasteVector();

  for (const tasteId of TASTE_IDS) {
    const value = tasteVector[tasteId];
    const distanceFromCenter = Math.abs(value - 0.5);
    vector[tasteId] = roundTo(clamp(0.32 + distanceFromCenter * 0.95 + Math.max(0, value - 0.72) * 0.25));
  }

  return vector;
}

function inferPreferenceVector(tasteVector: TasteVector, sensitivityVector: TasteVector): TasteVector {
  const vector = createZeroTasteVector();

  for (const tasteId of TASTE_IDS) {
    const value = tasteVector[tasteId];
    vector[tasteId] = roundTo(clamp(0.26 + value * 0.68 - sensitivityVector[tasteId] * 0.08));
  }

  return vector;
}

function buildConfidenceByAxis(
  snapshot: TasteMeasurementSnapshot,
  feedbackCount: number,
  reviewCount: number,
): Record<TasteId, number> {
  const isMeasured = snapshot.source === 'measured';
  const evidenceLift = clamp((feedbackCount + reviewCount) / 10, 0, 0.22);

  return TASTE_IDS.reduce<Record<TasteId, number>>((result, tasteId) => {
    const hasValue = typeof snapshot.results[tasteId] === 'number';
    const value = normalizeTasteMeasurementValue(snapshot.results[tasteId]);
    const salienceLift = Math.abs(value - 0.5) * 0.12;

    result[tasteId] = roundTo(clamp((hasValue ? 0.44 : 0.18) + (isMeasured ? 0.18 : 0) + evidenceLift + salienceLift));
    return result;
  }, {} as Record<TasteId, number>);
}

function deriveStage(confidenceByAxis: Record<TasteId, number>, feedbackCount: number, reviewCount: number): TasteProfileStage {
  const confidence = average(TASTE_IDS.map((tasteId) => confidenceByAxis[tasteId]));
  const evidenceCount = feedbackCount + reviewCount;

  if (confidence >= 0.78 && evidenceCount >= 10) {
    return 'Refined';
  }

  if (confidence >= 0.66 && evidenceCount >= 5) {
    return 'Patterned';
  }

  if (confidence >= 0.5 && evidenceCount >= 1) {
    return 'Learning';
  }

  return 'Starter';
}

function buildStablePatterns(
  tasteVector: TasteVector,
  perceptualVector: PerceptualVector,
  confidenceByAxis: Record<TasteId, number>,
): TasteIdentitySignal[] {
  const tasteSignals = getTopTasteIds(tasteVector, 2).map((tasteId) => ({
    confidence: confidenceByAxis[tasteId],
    id: `taste:${tasteId}`,
    label: getTasteLabel(tasteId),
    summary: `${getTasteLabel(tasteId)} 축이 먼저 읽히는 프로필이에요.`,
    tasteId,
  }));
  const perceptualSignals = getTopPerceptualAxes(perceptualVector, 2).map((axis) => ({
    confidence: roundTo(perceptualVector[axis] * 0.72),
    id: `perceptual:${axis}`,
    label: PERCEPTUAL_AXIS_LABELS[axis],
    summary: `${PERCEPTUAL_AXIS_LABELS[axis]}을 선호 신호로 함께 봅니다.`,
  }));

  return [...tasteSignals, ...perceptualSignals].slice(0, 4);
}

function buildWatchPoints(
  sensitivityVector: TasteVector,
  confidenceByAxis: Record<TasteId, number>,
): TasteIdentitySignal[] {
  const sensitivityPoint = TASTE_IDS
    .slice()
    .sort((left, right) => sensitivityVector[right] - sensitivityVector[left])[0];
  const lowConfidencePoint = TASTE_IDS
    .slice()
    .sort((left, right) => confidenceByAxis[left] - confidenceByAxis[right])[0];

  return [sensitivityPoint, lowConfidencePoint]
    .filter((tasteId, index, list): tasteId is TasteId => Boolean(tasteId) && list.indexOf(tasteId) === index)
    .map((tasteId) => ({
      confidence: confidenceByAxis[tasteId],
      id: `watch:${tasteId}`,
      label: getTasteLabel(tasteId),
      summary:
        sensitivityVector[tasteId] > 0.58
          ? `${getTasteLabel(tasteId)}은 강도가 쌓이면 피로도가 올라갈 수 있어요.`
          : `${getTasteLabel(tasteId)}은 아직 더 많은 리뷰로 확인할 축이에요.`,
      tasteId,
    }));
}

function buildTasteSignature(tasteVector: TasteVector, perceptualVector: PerceptualVector) {
  const topTasteLabels = getTopTasteIds(tasteVector, 2).map(getTasteLabel).join(' · ');
  const topPerceptualLabel = PERCEPTUAL_AXIS_LABELS[getTopPerceptualAxes(perceptualVector, 1)[0] ?? 'cleanFinish'];

  return `${topTasteLabels} 중심, ${topPerceptualLabel}을 함께 보는 입맛`;
}

export function buildTasteIdentity({
  feedbackCount = 0,
  measuredAtOverride,
  measurementSnapshot,
  reviewCount = 0,
  userId = 'local-user',
}: {
  feedbackCount?: number;
  measuredAtOverride?: string;
  measurementSnapshot: TasteMeasurementSnapshot;
  reviewCount?: number;
  userId?: string;
}): TasteProfileSnapshot {
  if (measurementSnapshot.source === 'recalled-intensity') {
    throw new TypeError('기준 음식 회상 강도를 선호·민감도 프로필로 변환할 수 없습니다.');
  }
  const tasteVector = createTasteVectorFromMeasurement(measurementSnapshot);
  const perceptualVector = inferPerceptualVector(tasteVector);
  const sensitivityVector = inferSensitivityVector(tasteVector);
  const preferenceVector = inferPreferenceVector(tasteVector, sensitivityVector);
  const confidenceByAxis = buildConfidenceByAxis(measurementSnapshot, feedbackCount, reviewCount);
  const stage = deriveStage(confidenceByAxis, feedbackCount, reviewCount);

  return {
    confidenceByAxis,
    generatedAt: measuredAtOverride ?? new Date().toISOString(),
    perceptualVector,
    preferenceVector,
    sensitivityVector,
    stablePatterns: buildStablePatterns(tasteVector, perceptualVector, confidenceByAxis),
    stage,
    tasteSignature: buildTasteSignature(tasteVector, perceptualVector),
    tasteVector,
    userId,
    watchPoints: buildWatchPoints(sensitivityVector, confidenceByAxis),
  };
}

export function publishTasteProfile(
  snapshot: TasteProfileSnapshot,
  options: {
    avatarPath?: string | null;
    averageRating?: number | null;
    displayName?: string | null;
    nickname?: string | null;
    reviewCount?: number;
    visibility?: TasteProfileVisibility;
  } = {},
): PublicTasteProfile {
  return {
    avatarPath: options.avatarPath ?? null,
    displayName: options.displayName?.trim() || 'Taste Buddy Guest',
    nickname: options.nickname?.trim() || 'taste-buddy',
    publicStats: {
      averageRating: options.averageRating ?? null,
      reviewCount: options.reviewCount ?? 0,
    },
    snapshot,
    stage: snapshot.stage,
    tasteSignature: snapshot.tasteSignature,
    userId: snapshot.userId,
    visibility: options.visibility ?? 'private',
  };
}

function normalizeReviewTags(tags: readonly string[]) {
  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 6);
}

function getDiningNoteTagLabel(tag: string) {
  return getDiningDetailTagMetadata(tag)?.label ?? DINING_NOTE_TAG_LABELS[tag] ?? tag;
}

function getDiningNoteDetailLabel(tag: string) {
  return getDiningDetailTagMetadata(tag)?.label ?? DINING_NOTE_DETAIL_LABELS[tag] ?? getDiningNoteTagLabel(tag);
}

function getDiningNoteDetailTitle(tag: string) {
  return getDiningDetailTagMetadata(tag)?.categoryLabel ?? getDiningNoteTagLabel(tag);
}

function getDiningNoteDetailProseLabel(label: string) {
  return DINING_NOTE_DETAIL_PROSE_LABELS[label] ?? label;
}

function getDominantTasteIdForTag(tag: string): TasteId | null {
  const directTasteId = TASTE_IDS.find((tasteId) => getTasteLabel(tasteId) === tag);

  if (directTasteId) {
    return directTasteId;
  }

  const hints = TAG_TASTE_HINTS[tag];

  if (!hints) {
    return null;
  }

  const dominantTaste = TASTE_IDS
    .slice()
    .sort((left, right) => Math.max(0, hints[right] ?? 0) - Math.max(0, hints[left] ?? 0))[0] ?? null;

  if (!dominantTaste || Math.max(0, hints[dominantTaste] ?? 0) <= 0) {
    return null;
  }

  return dominantTaste;
}

function getDominantPerceptualAxisForTag(tag: string): PerceptualAxis | null {
  const hints = TAG_PERCEPTUAL_HINTS[tag];

  if (!hints) {
    return null;
  }

  const dominantAxis = PERCEPTUAL_AXES
    .slice()
    .sort((left, right) => Math.max(0, hints[right] ?? 0) - Math.max(0, hints[left] ?? 0))[0] ?? null;

  if (!dominantAxis || Math.max(0, hints[dominantAxis] ?? 0) <= 0) {
    return null;
  }

  return dominantAxis;
}

function getReviewerTasteAxisScore(profile: TasteProfileSnapshot | undefined, tasteId: TasteId) {
  if (!profile) {
    return 0.5;
  }

  return clamp(
    profile.tasteVector[tasteId] * 0.44 +
      profile.preferenceVector[tasteId] * 0.36 +
      profile.confidenceByAxis[tasteId] * 0.2,
  );
}

function getReviewerPerceptualAxisScore(profile: TasteProfileSnapshot | undefined, axis: PerceptualAxis) {
  if (!profile) {
    return 0.5;
  }

  return clamp(profile.perceptualVector[axis]);
}

function getTagTasteScore(tags: readonly string[], tasteId: TasteId) {
  const total = tags.reduce((sum, tag) => {
    const directScore = getTasteLabel(tasteId) === tag ? 0.62 : 0;

    return sum + directScore + Math.max(0, TAG_TASTE_HINTS[tag]?.[tasteId] ?? 0);
  }, 0);

  return clamp(total / 1.15);
}

function getTagPerceptualScore(tags: readonly string[], axis: PerceptualAxis) {
  const total = tags.reduce((sum, tag) => sum + Math.max(0, TAG_PERCEPTUAL_HINTS[tag]?.[axis] ?? 0), 0);

  return clamp(total / 1.15);
}

function getTasteBubbleLabelForAxis(tags: readonly string[], tasteId: TasteId) {
  const bestTag = tags
    .slice()
    .sort((left, right) => Math.max(0, TAG_TASTE_HINTS[right]?.[tasteId] ?? 0) - Math.max(0, TAG_TASTE_HINTS[left]?.[tasteId] ?? 0))[0];

  if (bestTag && Math.max(0, TAG_TASTE_HINTS[bestTag]?.[tasteId] ?? 0) > 0) {
    return getDiningNoteTagLabel(bestTag);
  }

  return `${getTasteLabel(tasteId)} 반응`;
}

function buildDiningNoteTasteBubbles({
  detailTags,
  id,
  reviewerProfile,
  tasteTags,
}: {
  detailTags: readonly string[];
  id: string;
  reviewerProfile?: TasteProfileSnapshot;
  tasteTags: readonly string[];
}): TasteBuddyAgentDiningNoteTasteBubble[] {
  const signalTags = [...tasteTags, ...detailTags];
  const hasReviewTasteSignals = signalTags.some((tag) => getDominantTasteIdForTag(tag));
  const candidates = TASTE_IDS
    .map((tasteId) => {
      const tagScore = getTagTasteScore(signalTags, tasteId);
      const profileScore = getReviewerTasteAxisScore(reviewerProfile, tasteId);
      const score = hasReviewTasteSignals
        ? tagScore * 0.62 + profileScore * 0.38
        : profileScore;

      return {
        colorTaste: getTasteLabel(tasteId),
        id: `${id}-taste-note-${tasteId}`,
        label: getTasteBubbleLabelForAxis(signalTags, tasteId),
        score,
        title: getTasteLabel(tasteId),
      };
    })
    .filter((candidate) => candidate.score > 0.18);

  const seenLabels = new Set<string>();

  return candidates
    .sort((left, right) => right.score - left.score)
    .filter((candidate) => {
      if (seenLabels.has(candidate.label)) {
        return false;
      }

      seenLabels.add(candidate.label);
      return true;
    })
    .slice(0, 3)
    .map(({ score: _score, ...bubble }) => bubble);
}

function buildDiningNoteDetailTags({
  detailTags,
  id,
  reviewerProfile,
  tasteTags,
}: {
  detailTags: readonly string[];
  id: string;
  reviewerProfile?: TasteProfileSnapshot;
  tasteTags: readonly string[];
}): TasteBuddyAgentDiningNoteTag[] {
  const sourceTags = detailTags.length > 0 ? detailTags : tasteTags;
  const seenLabels = new Set<string>();
  const hasReviewPerceptualSignals = sourceTags.some((tag) => getDominantPerceptualAxisForTag(tag));
  const tagCandidates = sourceTags.map((tag, index) => {
    const dominantAxis = getDominantPerceptualAxisForTag(tag);
    const profileScore = dominantAxis ? getReviewerPerceptualAxisScore(reviewerProfile, dominantAxis) : 0.38;
    const tagScore = dominantAxis ? getTagPerceptualScore(sourceTags, dominantAxis) : 0.24;

    return {
      id: `${id}-detail-note-${tag}-${index}`,
      label: getDiningNoteDetailLabel(tag),
      score: tagScore * 0.58 + profileScore * 0.42,
      title: dominantAxis ? PERCEPTUAL_AXIS_LABELS[dominantAxis] : getDiningNoteDetailTitle(tag),
    };
  });
  const profileFallbackCandidates = reviewerProfile
    ? getTopPerceptualAxes(reviewerProfile.perceptualVector, 4).map((axis, index) => ({
        id: `${id}-profile-detail-note-${axis}-${index}`,
        label: PERCEPTUAL_AXIS_LABELS[axis],
        score: getReviewerPerceptualAxisScore(reviewerProfile, axis) * 0.8,
        title: '작성자 미각 프로필',
      }))
    : [];

  return [...tagCandidates, ...(hasReviewPerceptualSignals ? [] : profileFallbackCandidates)]
    .sort((left, right) => right.score - left.score)
    .filter((tag) => {
      if (seenLabels.has(tag.label)) {
        return false;
      }

      seenLabels.add(tag.label);
      return true;
    })
    .slice(0, 6);
}

function getDominantTasteIdForLexiconEntry(entry: TbaCoreTasteLexiconEntry) {
  return TASTE_IDS
    .map((tasteId) => ({
      score: Math.abs(entry.tasteVector[tasteId] ?? 0),
      tasteId,
    }))
    .sort((left, right) => right.score - left.score)[0]?.score > 0.05
    ? TASTE_IDS
        .map((tasteId) => ({
          score: Math.abs(entry.tasteVector[tasteId] ?? 0),
          tasteId,
        }))
        .sort((left, right) => right.score - left.score)[0].tasteId
    : null;
}

function mergeDiningNoteItemsByLabel<TItem extends { label: string }>(
  primaryItems: readonly TItem[],
  fallbackItems: readonly TItem[],
  limit: number,
) {
  const seenLabels = new Set<string>();

  return [...primaryItems, ...fallbackItems]
    .filter((item) => {
      if (seenLabels.has(item.label)) {
        return false;
      }

      seenLabels.add(item.label);
      return true;
    })
    .slice(0, limit);
}

function buildLexiconDiningNoteTasteBubbles({
  id,
  lexiconMapping,
}: {
  id: string;
  lexiconMapping: ReturnType<typeof mapCoreTasteLexiconSignalsForDiningNote>;
}): TasteBuddyAgentDiningNoteTasteBubble[] {
  return lexiconMapping.tasteBubbleLabels.map((label, index) => {
    const candidate = lexiconMapping.lexiconCandidates.find((item) => item.entry.label === label);
    const dominantTasteId = candidate ? getDominantTasteIdForLexiconEntry(candidate.entry) : null;
    const colorTaste = dominantTasteId ? getTasteLabel(dominantTasteId) : undefined;

    return {
      colorTaste,
      id: `${id}-lexicon-taste-note-${candidate?.entry.id ?? index}`,
      label,
      title: colorTaste ?? (candidate ? LEXICON_CATEGORY_LABELS[candidate.entry.category] : 'TBA Core Taste Lexicon'),
    };
  });
}

function buildLexiconDiningNoteDetailTags({
  id,
  lexiconMapping,
}: {
  id: string;
  lexiconMapping: ReturnType<typeof mapCoreTasteLexiconSignalsForDiningNote>;
}): TasteBuddyAgentDiningNoteTag[] {
  return lexiconMapping.detailTagLabels.map((label, index) => {
    const candidate = lexiconMapping.lexiconCandidates.find((item) => item.entry.label === label);

    return {
      id: `${id}-lexicon-detail-note-${candidate?.entry.id ?? index}`,
      label,
      title: candidate ? LEXICON_CATEGORY_LABELS[candidate.entry.category] : 'TBA Core Taste Lexicon',
    };
  });
}

function joinKoreanList(labels: readonly string[]) {
  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return labels[0];
  }

  const prefix = labels.slice(0, -1).join(', ');

  return `${prefix}${hasKoreanFinalConsonant(prefix) ? '과' : '와'} ${labels[labels.length - 1]}`;
}

function hasKoreanFinalConsonant(value: string) {
  const lastCharacter = [...value.trim()].reverse().find((character) => /[가-힣]/.test(character));

  if (!lastCharacter) {
    return false;
  }

  const code = lastCharacter.charCodeAt(0) - 0xac00;

  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

function withKoreanParticle(value: string, withFinal: string, withoutFinal: string) {
  return `${value}${hasKoreanFinalConsonant(value) ? withFinal : withoutFinal}`;
}

type DiningNoteTemplateKind =
  | 'broth'
  | 'cold'
  | 'dessert'
  | 'fermented'
  | 'general'
  | 'grilled'
  | 'meat'
  | 'seafood'
  | 'vegetable';

interface DiningNoteTemplateContext {
  detailPhrase: string;
  detailSubject: string;
  detailTopic: string;
  kindPhrase: string;
  kindPhraseAsDirection: string;
  reviewSentence: string;
  subject: string;
  subjectTopic: string;
  tastePhrase: string;
  tasteSubject: string;
}

type DiningNoteTemplate = (context: DiningNoteTemplateContext) => string;

function getDiningNoteTemplateKind(kindLabels: readonly string[]): DiningNoteTemplateKind {
  if (kindLabels.some((label) => /디저트|타르트|아이스|과일/.test(label))) return 'dessert';
  if (kindLabels.some((label) => /구이|훈연|불|숯/.test(label))) return 'grilled';
  if (kindLabels.some((label) => /국물|브로스|육수/.test(label))) return 'broth';
  if (kindLabels.some((label) => /해산물|생선|조개/.test(label))) return 'seafood';
  if (kindLabels.some((label) => /육류|고기|한우|오리|양/.test(label))) return 'meat';
  if (kindLabels.some((label) => /채소|허브|나물/.test(label))) return 'vegetable';
  if (kindLabels.some((label) => /발효|장/.test(label))) return 'fermented';
  if (kindLabels.some((label) => /차가운/.test(label))) return 'cold';

  return 'general';
}

const DINING_NOTE_REVIEW_TEMPLATES: Record<DiningNoteTemplateKind, readonly DiningNoteTemplate[]> = {
  broth: [
    ({ detailPhrase, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 국물 맛이 천천히 열렸고, ${tasteSubject} 차분하게 이어졌어요. ${detailPhrase} 덕분에 흐름이 편안했어요.${reviewSentence}`.trim(),
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 첫 입보다 뒤로 갈수록 ${tasteSubject} 더 잘 보였어요. ${detailSubject} 남아서 전체 호흡이 안정적으로 느껴졌어요.${reviewSentence}`.trim(),
  ],
  cold: [
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 차가운 온도감 때문에 ${tasteSubject} 더 선명하게 느껴졌어요. ${detailSubject} 피니시를 깨끗하게 정리해줬어요.${reviewSentence}`.trim(),
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 입안에 들어왔을 때 ${tasteSubject} 또렷했고, ${detailSubject} 끝을 가볍게 잡아줬어요.${reviewSentence}`.trim(),
  ],
  dessert: [
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} ${tasteSubject} 중심이었지만, ${detailSubject} 끝을 가볍게 잡아줘서 과하게 남지 않았어요.${reviewSentence}`.trim(),
    ({ detailPhrase, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 단순히 달기보다 ${tasteSubject} 먼저 기억났어요. ${detailPhrase} 덕분에 마지막 인상이 부드럽게 닫혔어요.${reviewSentence}`.trim(),
  ],
  fermented: [
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 발효에서 오는 깊이가 있었고, ${tasteSubject} 뒤로 길게 남았어요. ${detailSubject} 맛의 결을 더 또렷하게 만들었어요.${reviewSentence}`.trim(),
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 장의 깊이가 먼저 느껴졌고, ${tasteSubject} 묵직하게 받쳐줬어요. ${detailSubject} 있어서 끝맛이 단조롭지 않았어요.${reviewSentence}`.trim(),
  ],
  general: [
    ({ detailSubject, kindPhraseAsDirection, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} ${tasteSubject} 먼저 남았고, ${detailSubject} 전체 흐름을 정리해줬어요.${kindPhraseAsDirection ? ` ${kindPhraseAsDirection} 기억에 남는 메뉴였어요.` : ''}${reviewSentence}`.trim(),
    ({ detailSubject, kindPhrase, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 첫 인상보다 여운이 더 좋았고, ${tasteSubject} 자연스럽게 이어졌어요. ${detailSubject} 인상을 잡아줬어요.${kindPhrase ? ` ${kindPhrase} 쪽의 매력이 잘 보였어요.` : ''}${reviewSentence}`.trim(),
  ],
  grilled: [
    ({ detailTopic, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 구운 향이 먼저 잡혔고, ${tasteSubject} 뒤에서 이어졌어요. ${detailTopic} 생각보다 오래 남았어요.${reviewSentence}`.trim(),
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 불향이 앞에 서 있었지만 과하게 닫히지는 않았어요. ${tasteSubject} 받쳐주고 ${detailSubject} 뒤를 정리해줬어요.${reviewSentence}`.trim(),
  ],
  meat: [
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 한입 먹었을 때 볼륨이 확실했고, ${tasteSubject} 오래 남았어요. ${detailSubject} 있어서 끝이 너무 무겁게 닫히지는 않았어요.${reviewSentence}`.trim(),
    ({ detailPhrase, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 첫 입의 볼륨이 좋았고, ${tasteSubject} 오래 이어졌어요. ${detailPhrase} 덕분에 전체 인상이 균형 있게 남았어요.${reviewSentence}`.trim(),
  ],
  seafood: [
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} ${tasteSubject} 먼저 맑게 올라왔고, ${detailSubject} 뒤를 정리해줘서 좋았어요.${reviewSentence}`.trim(),
    ({ detailPhrase, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 입안에서 ${tasteSubject} 선명했고, ${detailPhrase} 덕분에 끝이 무겁지 않았어요.${reviewSentence}`.trim(),
  ],
  vegetable: [
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 재료의 향이 먼저 보였고, ${tasteSubject} 조용히 받쳐줬어요. ${detailSubject} 전체 인상을 산뜻하게 만들었어요.${reviewSentence}`.trim(),
    ({ detailSubject, reviewSentence, subjectTopic, tasteSubject }) =>
      `${subjectTopic} 향이 앞으로 나오면서도 과하지 않았고, ${tasteSubject} 편안하게 남았어요. ${detailSubject} 메뉴의 결을 살렸어요.${reviewSentence}`.trim(),
  ],
};

function getStableTemplateIndex(parts: readonly string[], templateCount: number) {
  if (templateCount <= 1) {
    return 0;
  }

  const seed = parts.join('|');
  let hash = 0;

  for (const character of seed) {
    hash = (hash + character.charCodeAt(0)) % 9973;
  }

  return hash % templateCount;
}

function getDiningNoteReviewSentence(reviewSnippet?: string) {
  const snippet = reviewSnippet?.trim();

  if (!snippet) {
    return '';
  }

  if (
    snippet.includes('사용자가 남긴 감각 단서가 가장 중요한 기준') ||
    snippet.includes('다음 선택에 참고할 만한 미각 신호')
  ) {
    return '';
  }

  return ` ${snippet}`;
}

function buildReviewLikeDiningNoteSummary({
  detailPhrase,
  kindLabels,
  reviewSnippet,
  subject,
  tastePhrase,
}: {
  detailPhrase: string;
  kindLabels: readonly string[];
  reviewSnippet?: string;
  subject: string;
  tastePhrase: string;
}) {
  const templateKind = getDiningNoteTemplateKind(kindLabels);
  const resolvedTastePhrase = tastePhrase || '전체 밸런스';
  const resolvedDetailPhrase = detailPhrase || '마무리';
  const kindPhrase = joinKoreanList(kindLabels.slice(0, 2));
  const kindPhraseAsDirection = kindPhrase
    ? `${kindPhrase}${hasKoreanFinalConsonant(kindPhrase) ? '으로' : '로'}`
    : '';
  const reviewSentence = getDiningNoteReviewSentence(reviewSnippet);
  const templates = DINING_NOTE_REVIEW_TEMPLATES[templateKind];
  const templateIndex = getStableTemplateIndex(
    [subject, resolvedTastePhrase, resolvedDetailPhrase, kindPhrase],
    templates.length,
  );

  return templates[templateIndex]({
    detailSubject: withKoreanParticle(resolvedDetailPhrase, '이', '가'),
    detailPhrase: resolvedDetailPhrase,
    detailTopic: withKoreanParticle(resolvedDetailPhrase, '은', '는'),
    kindPhrase,
    kindPhraseAsDirection,
    reviewSentence,
    subject,
    subjectTopic: withKoreanParticle(subject, '은', '는'),
    tastePhrase: resolvedTastePhrase,
    tasteSubject: withKoreanParticle(resolvedTastePhrase, '이', '가'),
  });
}

function buildDiningNoteAnalysis(input: BuildDiningNoteInput) {
  const normalizedTasteTags = normalizeReviewTags(input.tasteTags);
  const normalizedDetailTags = normalizeReviewTags(input.detailTags);
  const dishKindLabels = resolveDishKindLabels(input.dishKindTags ?? []);
  const subject = input.subject || input.restaurantName;
  const lexiconMapping = mapCoreTasteLexiconSignalsForDiningNote({
    detailTags: normalizedDetailTags,
    dishKindTags: input.dishKindTags ?? [],
    foodKnowledgeEntries: TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES,
    ingredients: input.ingredients ?? [],
    reviewerProfile: input.reviewerProfile,
    subject,
    tasteTags: normalizedTasteTags,
    techniques: input.techniques ?? [],
  });
  const fallbackTasteBubbles = buildDiningNoteTasteBubbles({
    detailTags: normalizedDetailTags,
    id: input.id,
    reviewerProfile: input.reviewerProfile,
    tasteTags: normalizedTasteTags,
  });
  const fallbackDetailTags = buildDiningNoteDetailTags({
    detailTags: normalizedDetailTags,
    id: input.id,
    reviewerProfile: input.reviewerProfile,
    tasteTags: normalizedTasteTags,
  });
  const tasteBubbles = mergeDiningNoteItemsByLabel(
    buildLexiconDiningNoteTasteBubbles({
      id: input.id,
      lexiconMapping,
    }),
    fallbackTasteBubbles,
    3,
  );
  const detailTags = mergeDiningNoteItemsByLabel(
    buildLexiconDiningNoteDetailTags({
      id: input.id,
      lexiconMapping,
    }),
    fallbackDetailTags,
    6,
  );
  const tastePhrase = joinKoreanList(tasteBubbles.slice(0, 2).map((bubble) => bubble.label));
  const detailPhrase = joinKoreanList(
    detailTags.slice(0, 2).map((tag) => getDiningNoteDetailProseLabel(tag.label)),
  );

  return {
    lexiconMapping,
    note: {
      detailTags,
      summary: buildReviewLikeDiningNoteSummary({
        detailPhrase,
        kindLabels: dishKindLabels,
        reviewSnippet: input.reviewSnippet,
        subject,
        tastePhrase,
      }),
      tasteBubbles,
    },
    subject,
  };
}

export function buildDiningNote(input: BuildDiningNoteInput): TasteBuddyAgentDiningNote {
  return buildDiningNoteAnalysis(input).note;
}

export function buildDiningAnalysisSnapshot(input: BuildDiningNoteInput): TasteBuddyAgentDiningAnalysisSnapshot {
  const analysis = buildDiningNoteAnalysis(input);

  return {
    confidence: analysis.lexiconMapping.confidence,
    detailTags: analysis.note.detailTags,
    foodKnowledgeMatchIds: analysis.lexiconMapping.foodKnowledgeMatches.map((match) => match.entry.id),
    foodOnMatchIds: analysis.lexiconMapping.foodOnMatches.map((match) => match.entry.id),
    generatedAt: new Date().toISOString(),
    lexiconCandidateIds: analysis.lexiconMapping.lexiconCandidates.map((candidate) => candidate.entry.id),
    source: 'TasteBuddyAgent',
    subject: analysis.subject,
    summary: analysis.note.summary,
    tasteBubbles: analysis.note.tasteBubbles,
    tbaSignalIds: analysis.lexiconMapping.tbaSignalIds,
    version: TBA_DINING_ANALYSIS_SNAPSHOT_VERSION,
  };
}

function buildDiningAnalysisInputForTasteMatchItem(item: TasteMatchFeedItem): BuildDiningNoteInput {
  const inferredDishKindTags = inferDishKindIds({
    flavorNotes: [...item.tasteTags, ...item.experienceTags],
    subtitle: item.restaurantName,
    title: item.dishTitle ?? item.restaurantName,
  });

  return {
    detailTags: item.experienceTags,
    dishKindTags: item.dishKindTags?.length ? item.dishKindTags : inferredDishKindTags,
    id: item.id,
    ingredients: item.ingredients ?? [],
    restaurantName: item.restaurantName,
    reviewSnippet: item.reviewSnippet,
    reviewerProfile: item.reviewer.snapshot,
    reviewerName: item.reviewer.nickname || item.reviewer.displayName,
    subject: item.dishTitle ?? item.restaurantName,
    tasteTags: item.tasteTags,
    techniques: item.techniques ?? [],
  };
}

export function buildDiningNoteForTasteMatchItem(item: TasteMatchFeedItem): TasteBuddyAgentDiningNote {
  return buildDiningNote(buildDiningAnalysisInputForTasteMatchItem(item));
}

export function buildDiningAnalysisSnapshotForTasteMatchItem(
  item: TasteMatchFeedItem,
): TasteBuddyAgentDiningAnalysisSnapshot {
  return buildDiningAnalysisSnapshot(buildDiningAnalysisInputForTasteMatchItem(item));
}

function buildTasteSignalsFromTags(tags: readonly string[]) {
  const vector: Partial<Record<TasteId, number>> = {};
  const normalizedTags = normalizeReviewTags(tags);

  for (const tag of normalizedTags) {
    const hints = TAG_TASTE_HINTS[tag] ?? {};

    for (const tasteId of TASTE_IDS) {
      vector[tasteId] = roundTo((vector[tasteId] ?? 0) + (hints[tasteId] ?? 0));
    }
  }

  for (const tasteId of TASTE_IDS) {
    if (vector[tasteId] !== undefined) {
      vector[tasteId] = roundTo(clamp(vector[tasteId]!, -1, 1));
    }
  }

  return vector;
}

export function ingestDiningReview(input: IngestDiningReviewInput): DiningReview {
  const tasteTags = normalizeReviewTags(input.tasteTags ?? []);
  const experienceTags = normalizeReviewTags(input.experienceTags ?? []);
  const reviewText = input.reviewText?.trim() ?? '';

  return {
    createdAt: input.createdAt ?? new Date().toISOString(),
    dishId: input.dishId ?? null,
    dishKindTags: input.dishKindTags ?? inferDishKindIds({
      flavorNotes: [...tasteTags, ...experienceTags],
      title: input.dishTitle ?? input.restaurantName,
    }),
    dishTitle: input.dishTitle ?? null,
    experienceTags,
    id: input.id ?? `${input.reviewerId}:${input.restaurantId}:${Date.now()}`,
    ingredients: input.ingredients ?? [],
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    reviewSnippet: reviewText || '이 다이닝은 다음 선택에 참고할 만한 미각 신호를 남겼어요.',
    reviewerId: input.reviewerId,
    tasteSignals: buildTasteSignalsFromTags([...tasteTags, ...experienceTags]),
    tasteTags,
    techniques: input.techniques ?? [],
    visibility: input.visibility ?? 'private',
  };
}

function getVectorSimilarity<K extends string>(
  keys: readonly K[],
  left: Record<K, number>,
  right: Record<K, number>,
  confidence?: Partial<Record<K, number>>,
) {
  let totalWeight = 0;
  let weightedDistance = 0;

  for (const key of keys) {
    const weight = clamp(confidence?.[key] ?? 1, 0.25, 1);
    totalWeight += weight;
    weightedDistance += Math.abs(left[key] - right[key]) * weight;
  }

  return totalWeight > 0 ? clamp(1 - weightedDistance / totalWeight) : 0;
}

function signalFromSharedTaste(tasteId: TasteId, confidence: number): TasteIdentitySignal {
  return {
    confidence,
    id: `shared:${tasteId}`,
    label: getTasteLabel(tasteId),
    summary: `${getTasteLabel(tasteId)}을 비슷한 강도로 읽습니다.`,
    tasteId,
  };
}

export function computeTasteSimilarity(
  source: TasteProfileSnapshot,
  target: TasteProfileSnapshot,
  options: TasteSimilarityOptions = {},
): TasteSimilarityEdge {
  const tasteSimilarity = getVectorSimilarity(TASTE_IDS, source.tasteVector, target.tasteVector, source.confidenceByAxis);
  const perceptualSimilarity = getVectorSimilarity(PERCEPTUAL_AXES, source.perceptualVector, target.perceptualVector);
  const preferenceSimilarity = getVectorSimilarity(TASTE_IDS, source.preferenceVector, target.preferenceVector, source.confidenceByAxis);
  const reviewBehaviorOverlap = clamp(options.reviewBehaviorOverlap ?? 0.62);
  const similarityScore = Math.round(
    (tasteSimilarity * 0.4 + perceptualSimilarity * 0.3 + preferenceSimilarity * 0.2 + reviewBehaviorOverlap * 0.1) * 100,
  );
  const sharedTasteIds = TASTE_IDS
    .slice()
    .sort((left, right) => {
      const leftShared = 1 - Math.abs(source.tasteVector[left] - target.tasteVector[left]);
      const rightShared = 1 - Math.abs(source.tasteVector[right] - target.tasteVector[right]);
      return rightShared - leftShared;
    })
    .slice(0, 2);
  const differentTasteIds = TASTE_IDS
    .slice()
    .sort((left, right) => {
      const leftDiff = Math.abs(source.tasteVector[left] - target.tasteVector[left]);
      const rightDiff = Math.abs(source.tasteVector[right] - target.tasteVector[right]);
      return rightDiff - leftDiff;
    })
    .slice(0, 2);

  return {
    computedAt: new Date().toISOString(),
    differenceSignals: differentTasteIds.map((tasteId) => ({
      confidence: roundTo(Math.abs(source.tasteVector[tasteId] - target.tasteVector[tasteId])),
      id: `different:${tasteId}`,
      label: getTasteLabel(tasteId),
      summary: `${getTasteLabel(tasteId)}을 다르게 받아들일 수 있어요.`,
      tasteId,
    })),
    sharedSignals: sharedTasteIds.map((tasteId) =>
      signalFromSharedTaste(tasteId, roundTo(1 - Math.abs(source.tasteVector[tasteId] - target.tasteVector[tasteId]))),
    ),
    similarityScore,
    sourceUserId: source.userId,
    targetUserId: target.userId,
  };
}

function getStageConfidence(stage: TasteProfileStage) {
  if (stage === 'Refined') return 1;
  if (stage === 'Patterned') return 0.82;
  if (stage === 'Learning') return 0.66;
  return 0.48;
}

function getItemFit(viewer: TasteProfileSnapshot, review: DiningReview) {
  const activeSignals = TASTE_IDS.filter((tasteId) => review.tasteSignals[tasteId] !== undefined);

  if (activeSignals.length === 0) {
    return 0.5;
  }

  const fit = average(
    activeSignals.map((tasteId) => {
      const signal = clamp((review.tasteSignals[tasteId] ?? 0) / 2 + 0.5);
      return 1 - Math.abs(viewer.preferenceVector[tasteId] - signal);
    }),
  );

  return clamp(fit);
}

function getFreshness(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return 0.55;
  }

  const days = Math.max(0, (Date.now() - createdTime) / (1000 * 60 * 60 * 24));
  return clamp(Math.pow(0.5, days / 90), 0.35, 1);
}

function getCategory(score: number, similarityScore: number): TasteMatchCategory {
  if (score >= 82 && similarityScore >= 72) {
    return 'Strong Match';
  }

  if (score >= 64) {
    return 'Worth Exploring';
  }

  return 'Taste Contrast';
}

function getRelationLabel(similarityScore: number): TasteSocialRelation {
  if (similarityScore >= 82) return 'Taste Twin';
  if (similarityScore >= 58) return 'Similar Palate';
  return 'Contrasting Palate';
}

export function explainRecommendation(
  viewer: TasteProfileSnapshot,
  reviewer: PublicTasteProfile,
  review: DiningReview,
  edge: TasteSimilarityEdge,
  learnedSignals: readonly string[] = [],
) {
  const sharedLabels = edge.sharedSignals.map((signal) => signal.label).join('과 ');
  const topTaste = getTopTasteIds(viewer.preferenceVector, 1)[0];
  const topTasteLabel = topTaste ? getTasteLabel(topTaste) : '현재 미각';
  const learnedSignalPhrase = learnedSignals.length > 0
    ? ` 최근 내 기록에서도 ${learnedSignals.slice(0, 2).join(' · ')} 신호가 반복돼 우선순위를 조금 높였어요.`
    : '';

  if (edge.similarityScore >= 72) {
    return `${reviewer.nickname}님과 ${sharedLabels} 흐름이 가까워서, ${review.restaurantName}의 기록을 먼저 참고할 만해요.${learnedSignalPhrase}`;
  }

  return `${topTasteLabel}을 기준으로 보면 ${review.restaurantName}은 익숙한 취향에서 살짝 넓혀볼 수 있는 경험이에요.${learnedSignalPhrase}`;
}

function getUserConfidenceStateMap(states: readonly TasteBuddyAgentUserConfidenceState[] = []) {
  return new Map(
    states.map((state) => [
      getConfidenceSignalKey(state.signalType, state.signalId),
      state,
    ]),
  );
}

function getReviewConfidenceTargets(review: DiningReview) {
  const signalMapping = mapFeedbackInputToTbaSignals({
    detailTags: review.experienceTags,
    dishKindTags: review.dishKindTags ?? [],
    tasteTags: review.tasteTags,
  });

  return uniqueConfidenceTargets([
    ...(review.dishKindTags ?? []).map((signalId) => ({
      label: getConfidenceSignalLabel('dish-kind', signalId),
      signalId,
      signalType: 'dish-kind' as const,
    })),
    ...signalMapping.mappedSignals.map((signal) => ({
      label: signal.definition.label,
      signalId: signal.definition.id,
      signalType: 'tba-signal' as const,
    })),
  ]);
}

function getLearnedConfidenceForReview(
  review: DiningReview,
  stateByKey: Map<string, TasteBuddyAgentUserConfidenceState>,
) {
  const matchedStates = getReviewConfidenceTargets(review)
    .map((target) => stateByKey.get(getConfidenceSignalKey(target.signalType, target.signalId)))
    .filter((state): state is TasteBuddyAgentUserConfidenceState => Boolean(state && state.confidence >= 0.58))
    .sort((left, right) => right.confidence - left.confidence || right.evidenceCount - left.evidenceCount);

  if (matchedStates.length === 0) {
    return {
      labels: [] as string[],
      score: 0,
    };
  }

  const topStates = matchedStates.slice(0, 4);
  const score = average(topStates.map((state) => state.confidence));

  return {
    labels: Array.from(
      new Set(
        topStates
          .map((state) => state.label ?? getConfidenceSignalLabel(state.signalType, state.signalId))
          .filter(Boolean),
      ),
    ),
    score: roundTo(score),
  };
}

export function generateTasteMatchFeed({
  candidateProfiles = getDefaultPublicTasteProfiles(),
  limit = 6,
  reviews = [],
  userConfidenceStates = [],
  viewerProfile,
}: GenerateTasteMatchFeedInput): TasteMatchFeedItem[] {
  const publicProfilesById = new Map(
    candidateProfiles
      .filter((profile) => profile.visibility === 'public' || profile.visibility === 'followers')
      .map((profile) => [profile.userId, profile]),
  );
  const seenRestaurantIds = new Set<string>();
  const userConfidenceStateMap = getUserConfidenceStateMap(userConfidenceStates);

  return reviews
    .filter((review) => review.visibility === 'public' && publicProfilesById.has(review.reviewerId))
    .map((review) => {
      const reviewer = publicProfilesById.get(review.reviewerId)!;
      const edge = computeTasteSimilarity(viewerProfile, reviewer.snapshot, {
        reviewBehaviorOverlap: review.rating >= 4 ? 0.72 : 0.48,
      });
      const itemFit = getItemFit(viewerProfile, review);
      const reviewerConfidence = getStageConfidence(reviewer.stage);
      const freshness = getFreshness(review.createdAt);
      const diversity = seenRestaurantIds.has(review.restaurantId) ? 0.9 : 1;
      const learnedConfidence = getLearnedConfidenceForReview(review, userConfidenceStateMap);
      seenRestaurantIds.add(review.restaurantId);
      const score = Math.round(
        (edge.similarityScore / 100 * 0.42 +
          itemFit * 0.26 +
          reviewerConfidence * 0.15 +
          freshness * 0.09 +
          learnedConfidence.score * 0.08) *
          100 *
          diversity,
      );
      const category = getCategory(score, edge.similarityScore);

      return {
        category,
        dishId: review.dishId,
        dishKindTags: review.dishKindTags,
        dishTitle: review.dishTitle,
        experienceTags: review.experienceTags,
        id: `feed:${review.id}`,
        ingredients: review.ingredients,
        itemType: review.dishTitle ? 'dish' : 'restaurant',
        learnedConfidenceScore: learnedConfidence.score,
        learnedConfidenceSignals: learnedConfidence.labels,
        matchScore: score,
        reason: explainRecommendation(viewerProfile, reviewer, review, edge, learnedConfidence.labels),
        relationLabel: getRelationLabel(edge.similarityScore),
        restaurantId: review.restaurantId,
        restaurantName: review.restaurantName,
        reviewCreatedAt: review.createdAt,
        reviewSnippet: review.reviewSnippet,
        reviewer,
        reviewerId: reviewer.userId,
        sharedSignals: edge.sharedSignals,
        supportingSignals: edge.sharedSignals.map((signal) => signal.label),
        tasteTags: review.tasteTags,
        techniques: review.techniques,
      } satisfies TasteMatchFeedItem;
    })
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) return right.matchScore - left.matchScore;
      return left.restaurantName.localeCompare(right.restaurantName, 'ko');
    })
    .slice(0, limit);
}

function createSyntheticSnapshot(
  userId: string,
  values: Record<TasteId, number>,
  feedbackCount: number,
  reviewCount: number,
): TasteProfileSnapshot {
  const measurementSnapshot: TasteMeasurementSnapshot = {
    measuredAt: new Date().toISOString(),
    results: values,
    source: 'measured',
  };

  return buildTasteIdentity({
    feedbackCount,
    measurementSnapshot,
    reviewCount,
    userId,
  });
}

export function getDefaultPublicTasteProfiles(): PublicTasteProfile[] {
  return [
    publishTasteProfile(
      createSyntheticSnapshot('taste-dev-mina', {
        bitter: 4.4,
        fat: 5.2,
        salty: 4.8,
        sour: 7.8,
        sweet: 4.6,
        umami: 7.2,
      }, 18, 24),
      {
        averageRating: 4.7,
        displayName: '김민아',
        nickname: '맑은끝민아',
        reviewCount: 24,
        visibility: 'public',
      },
    ),
    publishTasteProfile(
      createSyntheticSnapshot('taste-dev-joon', {
        bitter: 5.6,
        fat: 7.4,
        salty: 5.8,
        sour: 4.2,
        sweet: 5.4,
        umami: 8.2,
      }, 14, 21),
      {
        averageRating: 4.5,
        displayName: '박준서',
        nickname: '깊은여운준서',
        reviewCount: 21,
        visibility: 'public',
      },
    ),
    publishTasteProfile(
      createSyntheticSnapshot('taste-dev-harin', {
        bitter: 5.2,
        fat: 4.8,
        salty: 4.6,
        sour: 6.8,
        sweet: 7.4,
        umami: 5.6,
      }, 12, 18),
      {
        averageRating: 4.4,
        displayName: '이하린',
        nickname: '계절감하린',
        reviewCount: 18,
        visibility: 'public',
      },
    ),
    publishTasteProfile(
      createSyntheticSnapshot('taste-dev-seoyoon', {
        bitter: 5.1,
        fat: 4.1,
        salty: 4.2,
        sour: 8.4,
        sweet: 4.2,
        umami: 6.6,
      }, 11, 16),
      {
        averageRating: 4.6,
        displayName: '정서윤',
        nickname: '산미탐험서윤',
        reviewCount: 16,
        visibility: 'public',
      },
    ),
    publishTasteProfile(
      createSyntheticSnapshot('taste-dev-doyun', {
        bitter: 6.9,
        fat: 7.1,
        salty: 5.9,
        sour: 4.6,
        sweet: 4.8,
        umami: 8,
      }, 10, 14),
      {
        averageRating: 4.3,
        displayName: '최도윤',
        nickname: '불향도윤',
        reviewCount: 14,
        visibility: 'public',
      },
    ),
    publishTasteProfile(
      createSyntheticSnapshot('taste-dev-jiwoo', {
        bitter: 4.3,
        fat: 6.8,
        salty: 4,
        sour: 6.1,
        sweet: 8.2,
        umami: 5.1,
      }, 13, 19),
      {
        averageRating: 4.5,
        displayName: '한지우',
        nickname: '디저트지우',
        reviewCount: 19,
        visibility: 'public',
      },
    ),
    publishTasteProfile(
      createSyntheticSnapshot('taste-dev-yerin', {
        bitter: 4.7,
        fat: 3.9,
        salty: 4.4,
        sour: 7.1,
        sweet: 5.1,
        umami: 6.9,
      }, 9, 13),
      {
        averageRating: 4.4,
        displayName: '오예린',
        nickname: '섬세한여운예린',
        reviewCount: 13,
        visibility: 'public',
      },
    ),
    publishTasteProfile(
      createSyntheticSnapshot('taste-dev-taeo', {
        bitter: 5.7,
        fat: 6.2,
        salty: 6.4,
        sour: 4.8,
        sweet: 4.9,
        umami: 8.5,
      }, 15, 22),
      {
        averageRating: 4.6,
        displayName: '강태오',
        nickname: '장맛태오',
        reviewCount: 22,
        visibility: 'public',
      },
    ),
  ];
}

export function getDefaultDiningReviews(): DiningReview[] {
  return [
    ingestDiningReview({
      createdAt: '2026-05-18T12:00:00.000Z',
      dishTitle: '제철 생선과 맑은 소스',
      experienceTags: ['fresh', 'delicate'],
      id: 'review-mina-jungsik-fish',
      rating: 5,
      restaurantId: 'jungsik-seoul',
      restaurantName: '정식당',
      reviewText: '해산물의 감칠맛이 선명한데 끝이 무겁지 않았고, 산뜻한 산미가 여운을 길게 정리해줬어요.',
      reviewerId: 'taste-dev-mina',
      tasteTags: ['seafood', 'crisp'],
      visibility: 'public',
    }),
    ingestDiningReview({
      createdAt: '2026-05-05T12:00:00.000Z',
      dishTitle: '한우와 깊은 장 소스',
      experienceTags: ['deep', 'rich'],
      id: 'review-joon-mingles-beef',
      rating: 5,
      restaurantId: 'mingles-seoul',
      restaurantName: '밍글스',
      reviewText: '감칠맛과 지방감이 겹치지만 무겁게 닫히지 않고, 장의 깊은 여운이 편안하게 남았습니다.',
      reviewerId: 'taste-dev-joon',
      tasteTags: ['savory', 'fermented'],
      visibility: 'public',
    }),
    ingestDiningReview({
      createdAt: '2026-04-29T12:00:00.000Z',
      dishTitle: '딸기와 허브 디저트',
      experienceTags: ['fresh', 'dessert'],
      id: 'review-harin-lysee-dessert',
      rating: 4,
      restaurantId: 'lysee-seoul',
      restaurantName: '숍 리제',
      reviewText: '단맛이 앞서지만 산뜻한 허브감이 있어 끝맛이 부담스럽지 않았어요.',
      reviewerId: 'taste-dev-harin',
      tasteTags: ['sweet', 'crisp'],
      visibility: 'public',
    }),
    ingestDiningReview({
      createdAt: '2026-05-21T12:00:00.000Z',
      dishTitle: '감귤 향의 해산물',
      experienceTags: ['fresh', 'delicate'],
      id: 'review-seoyoon-evett-citrus-seafood',
      rating: 5,
      restaurantId: 'evett-seoul',
      restaurantName: '에빗',
      reviewText: '산미가 선명하지만 날카롭지 않고, 해산물의 감칠맛을 더 투명하게 열어주는 느낌이었어요.',
      reviewerId: 'taste-dev-seoyoon',
      tasteTags: ['seafood', 'crisp'],
      visibility: 'public',
    }),
    ingestDiningReview({
      createdAt: '2026-05-16T12:00:00.000Z',
      dishTitle: '숯향 오리와 발효 소스',
      experienceTags: ['smoky', 'rich'],
      id: 'review-doyun-7thdoor-duck',
      rating: 5,
      restaurantId: '7th-door-seoul',
      restaurantName: '세븐스도어',
      reviewText: '불향이 앞에 또렷하게 서고 발효 소스의 감칠맛이 뒤를 채워서 깊이가 좋았습니다.',
      reviewerId: 'taste-dev-doyun',
      tasteTags: ['grilled', 'fermented'],
      visibility: 'public',
    }),
    ingestDiningReview({
      createdAt: '2026-05-14T12:00:00.000Z',
      dishTitle: '피스타치오 타르트',
      experienceTags: ['dessert', 'gentle'],
      id: 'review-jiwoo-lysee-pistachio',
      rating: 5,
      restaurantId: 'lysee-seoul',
      restaurantName: '숍 리제',
      reviewText: '견과의 지방감이 풍성하지만 단맛이 정돈되어 있어서 끝맛이 깨끗했습니다.',
      reviewerId: 'taste-dev-jiwoo',
      tasteTags: ['sweet', 'rich'],
      visibility: 'public',
    }),
    ingestDiningReview({
      createdAt: '2026-05-10T12:00:00.000Z',
      dishTitle: '백김치 국물과 생선',
      experienceTags: ['fresh', 'gentle'],
      id: 'review-yerin-jungsik-white-kimchi',
      rating: 5,
      restaurantId: 'jungsik-seoul',
      restaurantName: '정식당',
      reviewText: '짧은 산미와 맑은 감칠맛이 섬세하게 이어져서 자극보다 균형이 먼저 느껴졌어요.',
      reviewerId: 'taste-dev-yerin',
      tasteTags: ['seafood', 'delicate'],
      visibility: 'public',
    }),
    ingestDiningReview({
      createdAt: '2026-05-19T12:00:00.000Z',
      dishTitle: '장 소스와 한우',
      experienceTags: ['deep', 'rich'],
      id: 'review-taeo-kwonsooksoo-jang-beef',
      rating: 5,
      restaurantId: 'kwonsooksoo-seoul',
      restaurantName: '권숙수',
      reviewText: '짭조름한 장맛이 감칠맛을 길게 끌고 가고, 지방감은 뒤에서 부드럽게 받쳐줬어요.',
      reviewerId: 'taste-dev-taeo',
      tasteTags: ['fermented', 'savory'],
      visibility: 'public',
    }),
  ];
}

export const TasteBuddyAgent = {
  alias: TASTE_BUDDY_AGENT_ALIAS,
  buildDiningAnalysisSnapshot,
  buildDiningAnalysisSnapshotForTasteMatchItem,
  buildDiningNote,
  buildDiningNoteForTasteMatchItem,
  buildTasteIdentity,
  aggregateFeedbackEvidenceEvents,
  calculateFeedbackEvidenceConfidenceEffect,
  capabilities: TASTE_BUDDY_AGENT_CAPABILITIES,
  computeTasteSimilarity,
  coreTasteLexicon: TBA_CORE_TASTE_LEXICON,
  coreTasteLexiconMinActiveConfidence: TBA_CORE_TASTE_LEXICON_MIN_ACTIVE_CONFIDENCE,
  coreTasteLexiconVersion: TBA_CORE_TASTE_LEXICON_VERSION,
  coreTasteKnowledgeDocs: TBA_CORE_TASTE_KNOWLEDGE_DOCS,
  foodOnBridgeEntries: TBA_FOODON_BRIDGE_ENTRIES,
  foodOnBridgeVersion: TBA_FOODON_BRIDGE_VERSION,
  foodOnReferenceLicense: TBA_FOODON_REFERENCE_LICENSE,
  foodOnReferencePath: TBA_FOODON_REFERENCE_PATH,
  foodKnowledgeRuntimeEntries: TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES,
  foodKnowledgeRuntimeSourceCount: TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_COUNT,
  foodKnowledgeRuntimeSourcePath: TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_PATH,
  foodKnowledgeRuntimeVersion: TBA_FOOD_KNOWLEDGE_RUNTIME_VERSION,
  signalTaxonomy: TBA_SIGNAL_TAXONOMY,
  signalById: TBA_SIGNAL_BY_ID,
  displayName: TASTE_BUDDY_AGENT_NAME,
  explainRecommendation,
  generateTasteMatchFeed,
  getDefaultDiningReviews,
  getDefaultPublicTasteProfiles,
  ingestDiningReview,
  inferMenuContext: (menuName: string) => (
    inferTbaMenuContext(TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES, menuName)
  ),
  publishTasteProfile,
  buildCoreTasteKnowledgeDocs,
  buildKnowledgeDocFromLexicon,
  canUseKnowledgeDocForSurface,
  canUseCoreTasteLexiconForSurface: canUseLexiconForSurface,
  filterKnowledgeDocsForSurface,
  findFoodOnBridgeEntriesByText,
  findSignalDefinitionsByText: findTbaSignalDefinitionsByText,
  getFoodOnBridgeEntryById,
  getSignalById: getTbaSignalById,
  mapCoreLexiconToSignalIds: mapCoreLexiconToTbaSignalIds,
  mapCoreTasteLexiconSignalsForDiningNote,
  mapFeedbackInputToSignals: mapFeedbackInputToTbaSignals,
  mapFoodOnBridgeInput,
  mapTagsToSignals: mapTagsToTbaSignals,
  rankKnowledgeDocsForDishKinds,
  rankCoreTasteLexiconForDishKinds: rankLexiconForDishKinds,
  retrieveKnowledgeDocs: retrieveTbaKnowledgeDocs,
} as const;

export const TBA = TasteBuddyAgent;
