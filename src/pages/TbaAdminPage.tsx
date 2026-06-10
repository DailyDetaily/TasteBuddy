import {
  Activity,
  BookOpen,
  Database,
  FileSearch,
  GitBranch,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import SectionCard from '../components/SectionCard';
import TasteChip from '../components/system/TasteChip';
import { ICON_TOKENS } from '../constants/designTokens';
import { DISH_KIND_OPTIONS, getDishKindLabel } from '../constants/dishKindTags';
import {
  DEFAULT_TASTE_MEASUREMENT_RESULTS,
  createTasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { TBA } from '../lib/tasteBuddyAgent';
import type { TbaFoodKnowledgeEntry } from '../types/tbaFoodOntology';
import type {
  TbaCoreTasteLexiconEntry,
  TbaKnowledgeSurface,
} from '../types/tasteBuddyKnowledge';

type TbaAdminTab = 'inspector' | 'lexicon' | 'food-knowledge' | 'evidence';

const TBA_ADMIN_TABS: Array<{
  id: TbaAdminTab;
  label: string;
}> = [
  { id: 'inspector', label: 'Note Inspector' },
  { id: 'lexicon', label: 'Lexicon' },
  { id: 'food-knowledge', label: 'Food Knowledge' },
  { id: 'evidence', label: 'Evidence' },
];

const SURFACE_OPTIONS: TbaKnowledgeSurface[] = [
  'taste-bubble',
  'detail-tag',
  'dining-note',
  'recommendation',
  'chef-guide',
  'tcs',
];

const DEFAULT_NOTE_INPUT = {
  detailTagsText: '섬세한 여운, 깨끗한 피니시, 간이 선명함',
  dishKindIds: ['seafood', 'broth', 'cold'],
  ingredientsText: '생선, 맑은 육수, 허브, 감귤',
  restaurantName: 'TBA Test Kitchen',
  subject: '감귤 향의 해산물',
  tasteTagsText: '해산물 감칠맛, 산뜻한 산미',
  techniquesText: '차갑게, 육수, 인퓨전',
};

function splitInputText(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return '-';
  }

  return `${Math.round(value * 100)}%`;
}

function getStatusTone(status: string) {
  if (status === 'active' || status === 'human-reviewed') {
    return 'text-[var(--tb-color-success)] bg-[var(--tb-color-success-soft)]';
  }

  if (status === 'retired') {
    return 'text-[var(--tb-color-text-disabled)] bg-[var(--tb-color-surface-disabled)]';
  }

  return 'text-[var(--tb-color-warning)] bg-[var(--tb-color-warning-soft)]';
}

function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[var(--tb-color-bg-page)] text-[var(--tb-color-text-primary)] [-webkit-overflow-scrolling:touch]">
      <main className="mx-auto flex min-h-full w-full max-w-[1180px] flex-col gap-5 px-5 pb-10 pt-[calc(var(--tb-safe-area-top)+20px)]">
        {children}
      </main>
    </div>
  );
}

function AdminHeader() {
  return (
    <section className="rounded-[24px] bg-[var(--tb-color-bg-focus)] p-5 shadow-[var(--tb-shadow-soft)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[720px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tb-color-text-muted)]">
            TasteBuddyAgent Operating Console
          </p>
          <h1 className="mt-2 text-[18px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
            TBA 운영 콘솔
          </h1>
          <p className="mt-2 text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]">
            미식 노트가 어떤 음식 지식, Core Lexicon, FoodOn bridge, confidence gate를 거쳐 만들어지는지 검수하는 내부 도구입니다.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:w-[360px]">
          <MetricTile label="Lexicon" value={`${TBA.coreTasteLexicon.length}`} />
          <MetricTile label="Food Knowledge" value={`${TBA.foodKnowledgeRuntimeEntries.length}`} />
          <MetricTile label="Signals" value={`${TBA.signalTaxonomy.length}`} />
        </div>
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
      <p className="text-[10px] font-medium leading-none text-[var(--tb-color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[16px] font-bold leading-none text-[var(--tb-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: TbaAdminTab;
  onChange: (tab: TbaAdminTab) => void;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-5 bg-[color-mix(in_srgb,var(--tb-color-bg-page)_86%,transparent)] px-5 py-2 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TBA_ADMIN_TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              type="button"
              className={`shrink-0 rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors ${
                isActive
                  ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-white'
                  : 'border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] text-[var(--tb-color-text-muted)]'
              }`}
              key={tab.id}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FieldLabel({
  children,
}: {
  children: string;
}) {
  return (
    <label className="text-[11px] font-semibold leading-none text-[var(--tb-color-text-muted)]">
      {children}
    </label>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        className="h-11 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-3 text-[13px] text-[var(--tb-color-text-primary)] outline-none transition-colors placeholder:text-[var(--tb-color-text-muted)] focus:border-[var(--tb-color-border-strong)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function MultiTextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        className="min-h-[72px] resize-none rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-3 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)] outline-none transition-colors placeholder:text-[var(--tb-color-text-muted)] focus:border-[var(--tb-color-border-strong)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SearchField({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-full border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-3">
      <Search
        aria-hidden="true"
        className="shrink-0 text-[var(--tb-color-text-muted)]"
        size={ICON_TOKENS.size.base}
        strokeWidth={ICON_TOKENS.strokeWidth.regular}
      />
      <input
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-muted)]"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function StatusPill({
  label,
}: {
  label: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold leading-none ${getStatusTone(label)}`}>
      {label}
    </span>
  );
}

function TraceChip({
  label,
  title,
}: {
  label: string;
  title?: string;
}) {
  return (
    <span
      className="max-w-full truncate rounded-full border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] px-2 py-1 text-[10px] font-medium leading-none text-[var(--tb-color-text-subtle)]"
      title={title ?? label}
    >
      {label}
    </span>
  );
}

function TraceSection({
  children,
  count,
  icon: Icon,
  title,
  variant = 'outer',
}: {
  children: ReactNode;
  count?: number;
  icon: typeof FileSearch;
  title: string;
  variant?: 'inner' | 'outer';
}) {
  return (
    <section
      className={`border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] p-4 ${
        variant === 'inner' ? 'rounded-[var(--tb-radius-8)]' : 'rounded-[20px]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--tb-radius-8)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-muted)]">
          <Icon size={ICON_TOKENS.size.base} strokeWidth={ICON_TOKENS.strokeWidth.regular} />
        </span>
        <h3 className="min-w-0 flex-1 text-[13px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
          {title}
        </h3>
        {typeof count === 'number' ? (
          <span className="rounded-full bg-[var(--tb-color-surface-muted)] px-2 py-1 text-[10px] font-semibold leading-none text-[var(--tb-color-text-muted)]">
            {count}
          </span>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function getLexiconLabel(id: string) {
  return TBA.coreTasteLexicon.find((entry) => entry.id === id)?.label ?? id;
}

function getFoodKnowledgeLabel(id: string) {
  const entry = TBA.foodKnowledgeRuntimeEntries.find((candidate) => candidate.id === id);

  return entry?.koName || entry?.canonicalName || id;
}

function getFoodOnLabel(id: string) {
  const entry = TBA.getFoodOnBridgeEntryById(id);

  return entry?.koName || entry?.canonicalName || id;
}

function getSignalLabel(id: string) {
  return TBA.getSignalById(id)?.label ?? id;
}

function NoteInspectorPanel() {
  const [subject, setSubject] = useState(DEFAULT_NOTE_INPUT.subject);
  const [restaurantName, setRestaurantName] = useState(DEFAULT_NOTE_INPUT.restaurantName);
  const [tasteTagsText, setTasteTagsText] = useState(DEFAULT_NOTE_INPUT.tasteTagsText);
  const [detailTagsText, setDetailTagsText] = useState(DEFAULT_NOTE_INPUT.detailTagsText);
  const [ingredientsText, setIngredientsText] = useState(DEFAULT_NOTE_INPUT.ingredientsText);
  const [techniquesText, setTechniquesText] = useState(DEFAULT_NOTE_INPUT.techniquesText);
  const [dishKindIds, setDishKindIds] = useState<string[]>(DEFAULT_NOTE_INPUT.dishKindIds);
  const inferredMenuContext = useMemo(() => TBA.inferMenuContext(subject), [subject]);

  useEffect(() => {
    setIngredientsText(inferredMenuContext.ingredients.join(', '));
    setTechniquesText(inferredMenuContext.techniques.join(', '));
    setDishKindIds(inferredMenuContext.dishKindIds);
  }, [inferredMenuContext]);

  const reviewerProfile = useMemo(() => (
    TBA.buildTasteIdentity({
      feedbackCount: 12,
      measurementSnapshot: createTasteMeasurementSnapshot(
        DEFAULT_TASTE_MEASUREMENT_RESULTS,
        '2026-06-01T12:00:00+09:00',
        'broad-starter',
      ),
      reviewCount: 8,
      userId: 'tba-admin-preview-user',
    })
  ), []);

  const snapshot = useMemo(() => (
    TBA.buildDiningAnalysisSnapshot({
      detailTags: splitInputText(detailTagsText),
      dishKindTags: dishKindIds,
      id: 'tba-admin-note-preview',
      ingredients: splitInputText(ingredientsText),
      restaurantName,
      reviewerProfile,
      subject,
      tasteTags: splitInputText(tasteTagsText),
      techniques: splitInputText(techniquesText),
    })
  ), [
    detailTagsText,
    dishKindIds,
    ingredientsText,
    restaurantName,
    reviewerProfile,
    subject,
    tasteTagsText,
    techniquesText,
  ]);

  const toggleDishKind = (kindId: string) => {
    setDishKindIds((current) => (
      current.includes(kindId)
        ? current.filter((id) => id !== kindId)
        : [...current, kindId]
    ));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <SectionCard className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tb-color-text-muted)]">
            Input
          </p>
          <h2 className="mt-1 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
            미식 노트 입력
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
            메뉴명을 바꾸면 재료, 조리 방식, 음식 종류를 자동 추론하고 TBA snapshot을 다시 계산합니다.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
          <TextField label="메뉴명" value={subject} onChange={setSubject} />
          <TextField label="레스토랑" value={restaurantName} onChange={setRestaurantName} />
          <MultiTextField label="미각 태그" value={tasteTagsText} onChange={setTasteTagsText} />
          <MultiTextField label="디테일 태그" value={detailTagsText} onChange={setDetailTagsText} />
          <MultiTextField label="재료" value={ingredientsText} onChange={setIngredientsText} />
          <MultiTextField label="조리/가공 방식" value={techniquesText} onChange={setTechniquesText} />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>음식 종류</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {DISH_KIND_OPTIONS.map((option) => {
              const isSelected = dishKindIds.includes(option.id);

              return (
                <button
                  type="button"
                  className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors ${
                    isSelected
                      ? 'border-[var(--tb-color-success)] bg-[var(--tb-color-success-soft)] text-[var(--tb-color-success)]'
                      : 'border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] text-[var(--tb-color-text-muted)]'
                  }`}
                  key={option.id}
                  onClick={() => toggleDishKind(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-col gap-4">
        <SectionCard className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tb-color-text-muted)]">
                Output
              </p>
              <h2 className="mt-1 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                TBA 미식 노트
              </h2>
            </div>
            <div className="rounded-full bg-[var(--tb-color-surface-muted)] px-3 py-1.5 text-[11px] font-bold text-[var(--tb-color-text-primary)]">
              {formatConfidence(snapshot.confidence)}
            </div>
          </div>

          <div className="rounded-[var(--tb-radius-16)] bg-[var(--tb-color-surface-muted)] p-4">
            <p className="text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]">
              <span className="font-semibold text-[var(--tb-color-text-primary)]">미식 노트: </span>
              {snapshot.summary}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TraceSection
              count={snapshot.tasteBubbles.length}
              icon={Activity}
              title="미각 버블"
              variant="inner"
            >
              <div className="flex flex-wrap gap-2">
                {snapshot.tasteBubbles.map((bubble) => (
                  <TasteChip
                    key={`${bubble.id}-${bubble.label}`}
                    colorTaste={bubble.colorTaste}
                    taste={bubble.label}
                    tone={bubble.colorTaste ? 'taste' : 'neutral'}
                  />
                ))}
              </div>
            </TraceSection>
            <TraceSection
              count={snapshot.detailTags.length}
              icon={ShieldCheck}
              title="디테일 태그"
              variant="inner"
            >
              <div className="flex flex-wrap gap-2">
                {snapshot.detailTags.map((tag) => (
                  <TraceChip key={`${tag.id}-${tag.label}`} label={tag.label} title={tag.id} />
                ))}
              </div>
            </TraceSection>
          </div>
        </SectionCard>

        <div className="grid gap-3 md:grid-cols-2">
          <TraceSection icon={BookOpen} title="Core Lexicon" count={snapshot.lexiconCandidateIds.length}>
            <div className="flex flex-wrap gap-2">
              {snapshot.lexiconCandidateIds.map((id) => (
                <TraceChip key={id} label={getLexiconLabel(id)} title={id} />
              ))}
            </div>
          </TraceSection>
          <TraceSection icon={Database} title="Food Knowledge" count={snapshot.foodKnowledgeMatchIds.length}>
            <div className="flex flex-wrap gap-2">
              {snapshot.foodKnowledgeMatchIds.map((id) => (
                <TraceChip key={id} label={getFoodKnowledgeLabel(id)} title={id} />
              ))}
            </div>
          </TraceSection>
          <TraceSection icon={GitBranch} title="FoodOn Bridge" count={snapshot.foodOnMatchIds.length}>
            <div className="flex flex-wrap gap-2">
              {snapshot.foodOnMatchIds.map((id) => (
                <TraceChip key={id} label={getFoodOnLabel(id)} title={id} />
              ))}
            </div>
          </TraceSection>
          <TraceSection icon={FileSearch} title="TBA Signals" count={snapshot.tbaSignalIds.length}>
            <div className="flex flex-wrap gap-2">
              {snapshot.tbaSignalIds.map((id) => (
                <TraceChip key={id} label={getSignalLabel(id)} title={id} />
              ))}
            </div>
          </TraceSection>
        </div>
      </div>
    </div>
  );
}

function LexiconExplorerPanel() {
  const [query, setQuery] = useState('');
  const [surface, setSurface] = useState<TbaKnowledgeSurface>('dining-note');
  const [dishKindId, setDishKindId] = useState('seafood');

  const rankedEntries = useMemo(() => (
    TBA.rankCoreTasteLexiconForDishKinds(TBA.coreTasteLexicon, [dishKindId], {
      includeBlocked: true,
      limit: 60,
      surface,
    })
  ), [dishKindId, surface]);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rankedEntries.filter((candidate) => {
      if (!normalizedQuery) {
        return true;
      }

      const entry = candidate.entry;
      return [
        entry.id,
        entry.label,
        entry.category,
        entry.status,
        entry.summary,
        ...entry.aliases,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    }).slice(0, 24);
  }, [query, rankedEntries]);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="min-w-0 flex-1">
            <SearchField
              placeholder="lexicon label, id, alias 검색"
              value={query}
              onChange={setQuery}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:w-[360px]">
            <select
              className="h-11 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-3 text-[12px] font-semibold text-[var(--tb-color-text-primary)] outline-none"
              value={dishKindId}
              onChange={(event) => setDishKindId(event.target.value)}
            >
              {DISH_KIND_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-3 text-[12px] font-semibold text-[var(--tb-color-text-primary)] outline-none"
              value={surface}
              onChange={(event) => setSurface(event.target.value as TbaKnowledgeSurface)}
            >
              {SURFACE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.map((candidate) => (
          <LexiconCard
            candidateConfidence={candidate.confidence}
            dishKindScore={candidate.dishKindScore}
            entry={candidate.entry}
            key={candidate.entry.id}
            usable={candidate.usable}
          />
        ))}
      </div>
    </div>
  );
}

function LexiconCard({
  candidateConfidence,
  dishKindScore,
  entry,
  usable,
}: {
  candidateConfidence: number;
  dishKindScore: number;
  entry: TbaCoreTasteLexiconEntry;
  usable: boolean;
}) {
  const primaryDishKinds = Object.entries(entry.dishKindAffinity)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  return (
    <SectionCard className="flex min-h-[210px] flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
            {entry.label}
          </p>
          <p className="mt-1 truncate text-[11px] text-[var(--tb-color-text-muted)]">
            {entry.id}
          </p>
        </div>
        <StatusPill label={entry.status} />
      </div>
      <p className="line-clamp-3 text-[12px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]">
        {entry.summary}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <MetricTile label="base" value={formatConfidence(entry.initialConfidence)} />
        <MetricTile label="combined" value={formatConfidence(candidateConfidence)} />
        <MetricTile label="dish" value={formatConfidence(dishKindScore)} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <TraceChip label={entry.category} />
        <TraceChip label={usable ? 'gate 통과' : 'gate 차단'} />
        {primaryDishKinds.map(([kindId, value]) => (
          <TraceChip
            key={`${entry.id}-${kindId}`}
            label={`${getDishKindLabel(kindId)} ${formatConfidence(value)}`}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function FoodKnowledgeExplorerPanel() {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');

  const entries = TBA.foodKnowledgeRuntimeEntries;
  const kindCounts = useMemo(() => (
    entries.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.kind] = (counts[entry.kind] ?? 0) + 1;
      return counts;
    }, {})
  ), [entries]);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((entry) => {
      if (kindFilter !== 'all' && entry.kind !== kindFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        entry.id,
        entry.koName,
        entry.canonicalName,
        entry.foodGroup,
        entry.status,
        entry.kind,
        ...entry.aliases,
        ...entry.dishKindIds,
        ...entry.lexiconIds,
        ...entry.ingredientSignalIds,
        ...entry.processSignalIds,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    }).slice(0, 40);
  }, [entries, kindFilter, query]);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard className="flex flex-col gap-4">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
          <SearchField
            placeholder="한국어 음식명, 재료, signal, source 검색"
            value={query}
            onChange={setQuery}
          />
          <select
            className="h-11 rounded-full border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-3 text-[12px] font-semibold text-[var(--tb-color-text-primary)] outline-none"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
          >
            <option value="all">전체 kind</option>
            {Object.keys(kindCounts).map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          <MetricTile label="runtime" value={`${entries.length}`} />
          <MetricTile label="source" value={`${TBA.foodKnowledgeRuntimeSourceCount}`} />
          <MetricTile label="FoodOn" value={`${TBA.foodOnBridgeEntries.length}`} />
          <MetricTile label="version" value={TBA.foodKnowledgeRuntimeVersion} />
          <MetricTile label="path" value="bridge" />
        </div>
      </SectionCard>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.map((entry) => (
          <FoodKnowledgeCard entry={entry} key={entry.id} />
        ))}
      </div>
    </div>
  );
}

function FoodKnowledgeCard({
  entry,
}: {
  entry: TbaFoodKnowledgeEntry;
}) {
  return (
    <SectionCard className="flex min-h-[220px] flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
            {entry.koName || entry.canonicalName}
          </p>
          <p className="mt-1 truncate text-[11px] text-[var(--tb-color-text-muted)]">
            {entry.id}
          </p>
        </div>
        <StatusPill label={entry.status} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MetricTile label="confidence" value={formatConfidence(entry.confidence)} />
        <MetricTile label="kind" value={entry.kind.replace('-', ' ')} />
        <MetricTile label="group" value={entry.foodGroup || '-'} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {entry.dishKindIds.slice(0, 4).map((kindId) => (
          <TraceChip key={`${entry.id}-${kindId}`} label={getDishKindLabel(kindId)} title={kindId} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[...entry.ingredientSignalIds, ...entry.processSignalIds].slice(0, 5).map((signalId) => (
          <TraceChip key={`${entry.id}-${signalId}`} label={getSignalLabel(signalId)} title={signalId} />
        ))}
      </div>
      <p className="mt-auto truncate text-[11px] text-[var(--tb-color-text-muted)]">
        source {entry.sourceRefs.map((sourceRef) => sourceRef.source).join(', ')}
      </p>
    </SectionCard>
  );
}

function EvidencePanel() {
  const simulatedEvents = useMemo(() => ([
    {
      eventType: 'created' as const,
      evidenceAction: 'include' as const,
      nextDishKindIds: ['seafood', 'broth'],
      nextSignalIds: ['dish-kind:seafood', 'lexicon:clean-finish', 'ingredient:white-fish'],
    },
    {
      eventType: 'detail_tags_changed' as const,
      evidenceAction: 'adjust' as const,
      nextDishKindIds: ['seafood', 'broth', 'cold'],
      nextSignalIds: ['dish-kind:cold', 'lexicon:cool-snap', 'lexicon:clean-finish'],
      previousDishKindIds: ['seafood', 'broth'],
      previousSignalIds: ['dish-kind:seafood', 'lexicon:clean-finish'],
    },
  ]), []);

  const confidenceStates = useMemo(() => TBA.aggregateFeedbackEvidenceEvents({ events: simulatedEvents }), [simulatedEvents]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <SectionCard className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tb-color-text-muted)]">
            Event Replay
          </p>
          <h2 className="mt-1 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
            Feedback Evidence 집계
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
            v1 콘솔은 샘플 이벤트를 집계해 support/adjust/remove가 confidence state로 바뀌는 구조를 보여줍니다. 실제 Supabase row 조회는 다음 단계에서 연결합니다.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {simulatedEvents.map((event, index) => (
            <div
              className="rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] p-3"
              key={`${event.eventType}-${index}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-bold text-[var(--tb-color-text-primary)]">
                  {event.eventType}
                </p>
                <TraceChip label={event.evidenceAction} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(event.nextSignalIds ?? []).map((signalId) => (
                  <TraceChip key={`${event.eventType}-${signalId}`} label={getSignalLabel(signalId)} title={signalId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tb-color-text-muted)]">
            User TBA Confidence State
          </p>
          <h2 className="mt-1 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
            집계된 confidence
          </h2>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {confidenceStates.slice(0, 10).map((state) => (
            <div
              className="rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] p-3"
              key={`${state.signalType}-${state.signalId}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-[var(--tb-color-text-primary)]">
                    {state.label ?? getSignalLabel(state.signalId)}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-[var(--tb-color-text-muted)]">
                    {state.signalType} · {state.signalId}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--tb-color-surface-muted)] px-2 py-1 text-[10px] font-bold text-[var(--tb-color-text-primary)]">
                  {formatConfidence(state.confidence)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <MetricTile label="support" value={`${state.supportCount}`} />
                <MetricTile label="adjust" value={`${state.adjustCount}`} />
                <MetricTile label="remove" value={`${state.removeCount}`} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default function TbaAdminPage() {
  const [activeTab, setActiveTab] = useState<TbaAdminTab>('inspector');

  return (
    <AdminShell>
      <AdminHeader />
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'inspector' ? <NoteInspectorPanel /> : null}
      {activeTab === 'lexicon' ? <LexiconExplorerPanel /> : null}
      {activeTab === 'food-knowledge' ? <FoodKnowledgeExplorerPanel /> : null}
      {activeTab === 'evidence' ? <EvidencePanel /> : null}
    </AdminShell>
  );
}
