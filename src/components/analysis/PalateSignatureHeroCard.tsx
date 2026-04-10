import type { TasteMeasurementEntry } from '../../constants/tasteMeasurementData';
import SectionCard from '../SectionCard';
import TasteChip from '../system/TasteChip';

type PalateSignatureId =
  | 'purist'
  | 'explorer'
  | 'harmonist'
  | 'curator'
  | 'epicure'
  | 'aesthete';

interface PalateSignatureHeroCardProps {
  measurementAgeLabel: string;
  tasteEntries: TasteMeasurementEntry[];
}

interface PalateSignatureDefinition {
  description: (context: {
    primaryTaste: string;
    secondaryTaste: string;
    weakestTaste: string;
  }) => string;
  label: string;
  subtitle: string;
}

const PALATE_SIGNATURES: Record<PalateSignatureId, PalateSignatureDefinition> = {
  purist: {
    label: 'Purist',
    subtitle: '정제된 균형을 선호하는 미각',
    description: ({ primaryTaste, secondaryTaste }) =>
      `${primaryTaste}과 ${secondaryTaste} 축도 과하게 치우치지 않아, 강한 자극보다 재료의 선명함과 정제된 밸런스를 더 높게 보는 성향으로 읽힙니다.`,
  },
  explorer: {
    label: 'Explorer',
    subtitle: '새로운 조합을 반기는 미각',
    description: ({ primaryTaste, secondaryTaste }) =>
      `특히 ${primaryTaste}과 ${secondaryTaste} 축 반응이 도드라져, 예상 밖의 풍미나 낯선 조합에서도 포인트를 빠르게 포착하는 성향으로 보입니다.`,
  },
  harmonist: {
    label: 'Harmonist',
    subtitle: '조화를 먼저 읽는 미각',
    description: () =>
      '여섯 가지 맛의 편차가 비교적 고르게 나타나 한 요소의 강함보다 전체적인 조화와 흐름을 안정적으로 즐기는 성향에 가깝습니다.',
  },
  curator: {
    label: 'Curator',
    subtitle: '정교한 차이를 읽는 미각',
    description: ({ primaryTaste, weakestTaste }) =>
      `특히 ${primaryTaste}과 ${weakestTaste}의 대비가 또렷해, 풍미의 결·밸런스·마무리 차이를 세밀하게 읽어내며 취향의 기준을 정교하게 쌓아가는 성향으로 보입니다.`,
  },
  epicure: {
    label: 'Epicure',
    subtitle: '깊이와 여운에 끌리는 미각',
    description: ({ primaryTaste, secondaryTaste }) =>
      `${primaryTaste}과 ${secondaryTaste} 축이 살아 있어, 레이어가 많은 맛이나 긴 여운을 지닌 풍미에서 만족을 느끼기 쉬운 성향으로 해석됩니다.`,
  },
  aesthete: {
    label: 'Aesthete',
    subtitle: '감각의 결을 섬세하게 보는 미각',
    description: ({ primaryTaste, secondaryTaste }) =>
      `${primaryTaste}과 ${secondaryTaste} 축이 선명하게 드러나, 첫 인상과 피니시의 분위기 차이까지 감각적으로 받아들이는 성향으로 보입니다.`,
  },
};

function getTasteEntry(entries: TasteMeasurementEntry[], label: string) {
  return entries.find((entry) => entry.label === label);
}

function derivePalateSignature(entries: TasteMeasurementEntry[]) {
  const sortedByDelta = [...entries].sort((left, right) => right.deltaMm - left.deltaMm);
  const strongestEntry = sortedByDelta[0] ?? entries[0];
  const secondEntry = sortedByDelta[1] ?? strongestEntry;
  const weakestEntry = sortedByDelta[sortedByDelta.length - 1] ?? strongestEntry;

  const sweetEntry = getTasteEntry(entries, '단맛');
  const sourEntry = getTasteEntry(entries, '신맛');
  const bitterEntry = getTasteEntry(entries, '쓴맛');
  const saltyEntry = getTasteEntry(entries, '짠맛');
  const umamiEntry = getTasteEntry(entries, '감칠맛');
  const fatEntry = getTasteEntry(entries, '지방맛');

  const spread = (strongestEntry?.deltaMm ?? 0) - (weakestEntry?.deltaMm ?? 0);
  const averageDelta =
    entries.reduce((sum, entry) => sum + entry.deltaMm, 0) / Math.max(1, entries.length);
  const totalDeltaAbs = entries.reduce((sum, entry) => sum + Math.abs(entry.deltaMm), 0);
  const elevatedCount = entries.filter((entry) => entry.deltaMm > 0.7).length;
  const brightDelta = (sweetEntry?.deltaMm ?? 0) + (sourEntry?.deltaMm ?? 0);
  const savoryDepthDelta = (umamiEntry?.deltaMm ?? 0) + (fatEntry?.deltaMm ?? 0);
  const contrastDelta = Math.max(
    sourEntry?.deltaMm ?? 0,
    bitterEntry?.deltaMm ?? 0,
    saltyEntry?.deltaMm ?? 0,
  );

  let signatureId: PalateSignatureId = 'curator';

  if (spread <= 1.4 && Math.abs(averageDelta) <= 0.55) {
    signatureId = 'harmonist';
  } else if (spread <= 2.2 && averageDelta < 0.2 && elevatedCount <= 2) {
    signatureId = 'purist';
  } else if (savoryDepthDelta >= 1.2 && (umamiEntry?.deltaMm ?? 0) > -0.2) {
    signatureId = 'epicure';
  } else if (spread >= 4.4 || totalDeltaAbs >= 9.5) {
    signatureId = 'curator';
  } else if (brightDelta >= 1.8 && elevatedCount >= 2) {
    signatureId = 'aesthete';
  } else if (contrastDelta >= 1.1 || strongestEntry?.label === '쓴맛') {
    signatureId = 'explorer';
  }

  const definition = PALATE_SIGNATURES[signatureId];

  return {
    accentLabels: [strongestEntry?.label ?? '단맛', secondEntry?.label ?? '신맛'],
    description: definition.description({
      primaryTaste: strongestEntry?.label ?? '단맛',
      secondaryTaste: secondEntry?.label ?? '신맛',
      weakestTaste: weakestEntry?.label ?? '지방맛',
    }),
    label: definition.label,
    subtitle: definition.subtitle,
  };
}

export default function PalateSignatureHeroCard({
  measurementAgeLabel,
  tasteEntries,
}: PalateSignatureHeroCardProps) {
  const signature = derivePalateSignature(tasteEntries);
  const signatureLabelClassName =
    signature.label === 'Harmonist'
      ? 'text-[18px] font-semibold tracking-[-0.24px] text-[var(--tb-color-text-primary)]'
      : 'text-[18px] font-semibold tracking-[-0.24px] text-[var(--tb-color-text-primary)]';

  return (
    <SectionCard hoverEffect={false}>
      <section className="flex w-full flex-col gap-[10px]" aria-label="미각 시그니처 요약">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--tb-color-text-hint)]">
            나의 미각 타입
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className={signatureLabelClassName}>
              {signature.label}
            </h2>
          </div>
          <p className="mt-[2px] text-[13px] font-semibold text-[var(--tb-color-text-secondary)]">
            {signature.subtitle}
          </p>
        </div>

        <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          {signature.description}
        </p>

        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-2 pt-[2px]">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[var(--tb-color-text-hint)]">
              Current Focus
            </p>
            <div className="mt-1 flex flex-wrap gap-[6px]">
              {signature.accentLabels.map((tasteLabel) => (
                <TasteChip key={tasteLabel} taste={tasteLabel} />
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[var(--tb-color-text-hint)]">
              Updated
            </p>
            <p className="mt-[2px] text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
              {measurementAgeLabel}
            </p>
          </div>
        </div>
      </section>
    </SectionCard>
  );
}
