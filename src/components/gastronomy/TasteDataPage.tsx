import EmptyState from "../system/EmptyState";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SquarePen } from "lucide-react";
import TopAppBar from "../TopAppBar";
import CapsuleTabs from "../system/plating/CapsuleTabs";
import { PERIOD_OPTIONS } from "../system/plating/PeriodPicker";
import type { TasteId } from "../../constants/designTokens";
import MiniChart from "../system/plating/MiniChart";
import { DetailCartesianChart, DetailHorizontalBars } from '../system/DetailCharts';
import { detailPlotPoints, orderedDetailSegments, prepareDetailState, resolveDetailCard, type DetailPeriod, type DetailQuery, type ResolvedDetailCard } from "./detailPresentation";
import "./taste-detail.css";
import {
  buildCards,
  categories,
  discoveryLabels,
  eventRows,
  facetLabels,
  periodLabels,
  prepare,
  senseKey,
  type Card,
  type Category,
  type Data,
  type Facet,
  type Period,
  type RecordRow,
  type Row,
} from "../../lib/gastronomy/engine";
import CategoryMotion from "./CategoryMotion";
import Discoveries from "./Discoveries";
import PeriodCard from "./PeriodCard";
import CardScrollList from "../system/CardScrollList";
export function RecordEvidence({
  records,
  onEditRecord,
  compact = false,
}: {
  records: RecordRow[];
  onEditRecord?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {records.length === 0 ? (
        <p className="py-6 text-[13px] text-[var(--tb-color-text-hint)]">
          현재 범위에 연결된 원본 기록이 없어요.
        </p>
      ) : (
        records.map((r) => (
          <article key={r.id} className="rounded-[20px] bg-[var(--tb-color-surface-base)] p-4">
            <h3 className="text-[16px] font-semibold">
              {r.menu || "메뉴 미기록"}
            </h3>
            <p className="mt-1 text-[13px]">{r.restaurant || "식당 미기록"}</p>
            <p className="mt-2 text-[12px] text-[var(--tb-color-text-hint)]">
              {r.date
                ? `식사일 ${new Date(r.date).toLocaleDateString("ko-KR")}`
                : "식사일 미확인"}
              {r.savedAt
                ? ` · 저장 ${new Date(r.savedAt).toLocaleDateString("ko-KR")}`
                : ""}
            </p>
            {!compact && r.note && (
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6">
                {r.note}
              </p>
            )}
            {!compact && r.labels.length > 0 && (
              <p className="mt-3 text-[12px] leading-5">
                직접 선택 · {r.labels.join(" · ")}
              </p>
            )}
            {r.id.startsWith("native:") && onEditRecord && (
              <button
                type="button"
                className="mt-3 min-h-11 text-[12px] font-semibold"
                onClick={() => onEditRecord(r.id.slice(7))}
              >
                원본 수정
              </button>
            )}
          </article>
        ))
      )}
    </div>
  );
}
export function DetailHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return <header className="tb-taste-detail-header">
    <TopAppBar appearance="transparent" title={title} showBack onBack={onBack} rightActions={<></>} />
  </header>;
}

export function DetailValueGroup({ rows }: { rows: { title: string; value: ReactNode }[] }) {
  return <dl className="tb-taste-detail-group">
    {rows.map((row, index) => <div className="tb-taste-detail-value" key={`${row.title}-${index}`}>
      <dt>{row.title}</dt><dd>{row.value}</dd>
    </div>)}
  </dl>;
}

export function MeasurementDetail({ card, data, onBack, color, axis = 'umami', onEditRecord, chartContent, controls, scope }: {
  card: ResolvedDetailCard;
  chartContent?: ReactNode;
  controls?: ReactNode;
  scope?: string;
  data: Data;
  onBack: () => void;
  color: string;
  axis?: TasteId;
  onEditRecord?: (id: string) => void;
}) {
  const [plotRowID, setPlotRowID] = useState<string>();
  const [limit, setLimit] = useState(40);
  const row = card.rows.find(item => item.id === plotRowID) ?? card.rows[0];
  const records = useMemo(() => prepare(data).records, [data]);
  const points = detailPlotPoints(card, plotRowID, records);
  const hasSegments = card.rows.some(item => item.segments?.length) || !!card.comparisons;
  const comparisonStatus = row ? card.comparisons?.[row.id]?.status : undefined;
  const percentage = card.id === 'change-presence';
  const unit = percentage ? '%' : card.id === 'overall' ? '개' : card.id === 'change-experience' && row?.id !== 'meal' ? row?.id === 'restaurant' ? '곳' : row?.id === 'foodKind' ? '가지' : '개' : '회';
  const ids = [...new Set(card.rows.flatMap(item => item.entryIDs))];
  useEffect(() => { setPlotRowID(undefined); setLimit(40); }, [card.id, scope]);
  return <main className="tb-taste-detail" data-testid="taste-measurement-detail">
    <DetailHeader title={card.title} onBack={onBack} />
    {controls && <div className="tb-taste-detail-controls">{controls}</div>}
    <div className="tb-taste-detail-scroll">
      <div className="tb-taste-detail-stack">
        {chartContent ? <div>{chartContent}</div> : <section className={`tb-taste-detail-panel${points.length ? '' : ' tb-taste-detail-summary'}`}>
          <p className="tb-taste-detail-scope text-center">{(row ? card.comparisons?.[row.id]?.scope : undefined) ?? card.scope ?? scope ?? card.meaning}</p>
          {hasSegments && card.rows.length > 1 && <select aria-label="비교 항목" className="min-h-11 w-full bg-transparent text-[13px]" value={row?.id ?? ''} onChange={event => setPlotRowID(event.target.value)}>
            {card.rows.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>}
          {comparisonStatus && <p className="tb-taste-detail-scope">{comparisonStatus}</p>}
          {!row ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 text-[var(--tb-color-text-hint)]"><strong className="text-[18px]">—</strong><span className="text-[12px]">기록 없음</span></div> : <>
            {(hasSegments || !points.length) && <>{(!hasSegments || card.rows.length === 1) && <p className="text-[13px] text-[var(--tb-color-text-secondary)]">{row.title}</p>}<p className="text-[18px] font-bold">{row.value}</p></>}
            {points.length > 0 && (!hasSegments && !card.comparisons
              ? <DetailHorizontalBars items={points.map(point => ({ ...point, color, axis }))} unit={unit} label={card.title} />
              : <DetailCartesianChart labels={points.map(point => point.label)} series={[{ id: row.id, label: row.title, color, axis, highlightsEachValue: !card.comparisons, values: points.map(point => point.value) }]}
                unit={unit} label={card.title} maximum={percentage ? 100 : undefined} valueLabels={percentage ? points.map(point => point.valueLabel) : undefined}
                selectionKey={`${card.id}:${row.id}:${scope}`} initialIndex={card.comparisons ? points.length - 1 : points.reduce((best, point, index) => (point.value ?? -1) > (points[best]?.value ?? -1) ? index : best, 0)} />)}
            {!hasSegments && card.rows.length > points.length && points.length > 0 && <p className="tb-taste-detail-scope">상위 {points.length}개 · 식사 횟수</p>}
          </>}
        </section>}
        {!!card.rows.length && <DetailValueGroup rows={card.id === 'meals' ? [{ title: '요리 기록', value: `${ids.length}개` }] : card.rows.slice(0, limit).map(item => ({ title: item.title, value: item.value }))} />}
        {card.rows.length > limit && <button type="button" className="min-h-11 text-[12px]" onClick={() => setLimit(value => value + 40)}>더 보기</button>}
        {chartContent && <details className="tb-taste-detail-disclosure"><summary>관련 원본 기록</summary><RecordEvidence records={records.filter(record => ids.includes(record.id))} onEditRecord={onEditRecord} /></details>}
      </div>
    </div>
  </main>;
}

export default function TasteDataPage({
  category,
  data,
  onBack,
  ownerID,
  onEditRecord,
}: {
  category: Category;
  data: Data;
  onBack: () => void;
  ownerID: string;
  onEditRecord?: (id: string) => void;
}) {
  const [period, setPeriod] = useState<Period>(
    category === "change" ? "ninety" : "all",
  );
  const [source, setSource] = useState("all");
  const [domain, setDomain] = useState("맛"),
    [attribute, setAttribute] = useState(""),
    [facet, setFacet] = useState<Facet>("liking");
  const [firstDimension, setFirstDimension] = useState("menu"),
    [repeatDimension, setRepeatDimension] = useState("menu");
  const [detail, setDetail] = useState<DetailQuery | null>(null);
  const [detailPeriod, setDetailPeriod] = useState<DetailPeriod>('original');
  const openDetail = (card: Card) => {
    setDetailPeriod('original');
    setDetail({ id: card.id, title: card.title, category, originalPeriod: period, source, domain, attribute, facet });
  };
  useEffect(() => { setDetail(null); setDetailPeriod('original'); }, [ownerID, category]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  const state = useMemo(
    () => prepare(data, period, source, now),
    [data, period, source, now],
  );
  const meta = categories.find((c) => c.id === category)!;
  const cards = buildCards(state, category, { domain, attribute, facet });
  const attributes = [
    ...new Map(
      state.observations
        .filter((o) => o.facet !== "overall")
        .map((o) => [senseKey(o), o.label]),
    ).entries(),
  ];
  const selectClass =
    "min-h-11 max-w-full rounded-xl bg-[var(--tb-color-surface-base)] px-3 text-[12px]";
  if (detail) {
    const detailState = prepareDetailState(data, detail, detailPeriod, now);
    const currentCard = resolveDetailCard(detailState, detail);
    const axis: TasteId = category === 'experience' ? 'fat' : category === 'preference' ? 'sweet' : category === 'change' ? 'bitter' : 'sour';
    const originalLabel = periodLabels[detail.originalPeriod];
    const options: { value: DetailPeriod; label: string }[] = PERIOD_OPTIONS.map(option => option.value === 0 && detail.originalPeriod === 'all' ? { value: 'original', label: '전체' } : option);
    if (detail.originalPeriod !== 'all') options.unshift({ value: 'original', label: originalLabel });
    const periodLabel = detailPeriod === 'original' ? originalLabel : PERIOD_OPTIONS.find(option => option.value === detailPeriod)?.label;
    const unit = currentCard.id === 'overall' || currentCard.id === 'unknown' ? '요리 기록' : '식사';
    const sourceLabel = source === 'restaurant' ? ' · 식당 음식' : source === 'homeCooked' ? ' · 직접 만든 요리' : source === 'unknown' ? ' · 출처 미확인' : '';
    return <MeasurementDetail card={currentCard} data={data} color={meta.color} axis={axis} onBack={() => setDetail(null)}
      scope={`${currentCard.id === 'unknown' ? '전체' : periodLabel} 기간 · ${unit} 기준${sourceLabel}${currentCard.id === 'overall' ? ' · 음식 전체 평가' : ''}`}
      controls={<CapsuleTabs label="측정 상세 기간" options={options} value={detailPeriod} onValueChange={setDetailPeriod} axis={axis} collapseToMenu />} />;
  }
  const cardView = (card: Card) => {
    const row = card.rows.find(item => item.id === attribute) ?? card.rows[0];
    const segments = card.rows.some(item => item.id.endsWith(':before')) ? [] : orderedDetailSegments(row?.segments ?? []);
    const hasChart = segments.some(segment => segment.count > 0);
    const axis: TasteId = category === 'experience' ? 'fat' : category === 'preference' ? 'sweet' : category === 'change' ? 'bitter' : 'sour';
    const unit = card.id === 'overall' ? '개 요리' : '번 식사';
    const summary = segments.filter(segment => segment.count > 0).map(segment => `${segment.label} ${segment.count}`).join(' · ');
    return <PeriodCard key={card.id} category={category} label={card.title}
      title={(["menu", "restaurant", "foodKind"].includes(card.id) || /^(first|repeat)\//.test(card.id))
        ? `${card.rows.length}${card.id === 'restaurant' ? '곳' : card.id === 'foodKind' ? '가지' : '개'}`
        : row ? `${card.id === 'meals' ? '' : row.title + ' · '}${row.value}` : '아직 기록 없음'}
      detail={row ? segments.length ? `${summary || row.detail}${card.rows.length > 1 ? ` · 전체 ${card.rows.length}개 항목` : ''}` : row.detail || row.value : '기록이 쌓이면 이곳에서 살펴볼 수 있어요.'}
      visualization={hasChart ? <MiniChart values={segments.map(segment => segment.count)} axis={axis} highlightsEachValue /> : undefined}
      legend={hasChart ? segments.map(segment => ({ id: segment.key, label: `${segment.label} ${segment.count}${unit}` })) : []}
      color={meta.color} onOpen={() => openDetail(card)} />;
  };
  const events = (
    first: boolean,
    dimension: string,
    setDimension: (value: string) => void,
  ) => {
    const title = first ? "처음 기록한 경험" : "다시 기록한 경험";
    const rows = eventRows(state, dimension, first);
    return (
      <div className="rounded-[20px] bg-[var(--tb-color-surface-base)] p-3">
        <label className="flex items-center justify-between text-[12px]">
          {title}
          <select
            className={selectClass}
            aria-label={`${title}의 단위`}
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
          >
            <option value="menu">메뉴</option>
            <option value="restaurant">식당</option>
            <option value="foodKind">음식 종류</option>
          </select>
        </label>
        {cardView({
          id: `${first ? "first" : "repeat"}/${dimension}`,
          title,
          meaning: "확인된 식사일 기준 · 전체 기록과 비교",
          rows,
        })}
      </div>
    );
  };
  return (
    <main className="flex h-full flex-col bg-[var(--tb-color-bg-page)]">
      <DetailHeader title={meta.title} onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <CategoryMotion
          state={state}
          category={category}
          domain={domain}
          attribute={attribute}
          facet={facet}
        />
        {(data.sourceRecordCount ?? data.records.length) === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="첫 미식 기록을 기다리고 있어요"
              description="아래 가운데 기록 버튼으로 오늘의 메뉴와 기억에 남은 미각을 남겨보세요."
              icon={<SquarePen size={24} />}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {data.records.some((r) => r.source !== "unknown") && (
                <select
                  aria-label="음식 출처"
                  value={source}
                  className={selectClass}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="all">전체</option>
                  <option value="restaurant">식당 음식</option>
                  <option value="homeCooked">직접 만든 요리</option>
                  <option value="unknown">출처 미확인</option>
                </select>
              )}
              {category === "sensation" && (
                <select
                  aria-label="감각 영역"
                  value={domain}
                  className={selectClass}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setAttribute("");
                  }}
                >
                  {["맛", "향", "식감", "기타"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              )}
              {category !== "experience" && (
                <select
                  aria-label="감각 선택"
                  value={attribute}
                  className={selectClass}
                  onChange={(e) => setAttribute(e.target.value)}
                >
                  <option value="">전체 또는 대표 감각</option>
                  {attributes.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
              {(category === "preference" || category === "context") && (
                <select
                  aria-label="반응의 종류"
                  value={facet}
                  className={selectClass}
                  onChange={(e) => setFacet(e.target.value as Facet)}
                >
                  {(category === "preference"
                    ? ["overall", "liking", "fit"]
                    : ["liking", "fit"]
                  ).map((f) => (
                    <option key={f} value={f}>
                      {facetLabels[f as Facet]}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[18px] font-bold">측정 데이터</h2>
                <select
                  aria-label="측정 기간"
                  className={selectClass}
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value as Period);
                    setAttribute("");
                  }}
                >
                  {Object.entries(periodLabels)
                    .filter(([p]) => category !== "change" || p !== "all")
                    .map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>
              {category !== "experience" && (
                <p className="text-[11px] text-[var(--tb-color-text-hint)]">
                  선택 응답 기준
                </p>
              )}
              {state.unknown.length > 0 && (
                <button
                  type="button"
                  className="min-h-11 text-left text-[12px] text-[var(--tb-color-text-hint)]"
                  onClick={() =>
                    openDetail({
                      id: "unknown",
                      title: "식사일 미확인 기록",
                      meaning:
                        "저장일을 식사일로 대신 사용하지 않아요. 기간을 선택하면 제외돼요.",
                      rows: [
                        {
                          id: "unknown",
                          title: "날짜 미확인",
                          value: `${state.unknown.length}개`,
                          detail: "전체 기간에만 포함",
                          entryIDs: state.unknown.map((r) => r.id),
                        },
                      ],
                    })
                  }
                >
                  식사일 미확인 기록 {state.unknown.length}개 · 원본 보기
                </button>
              )}
              {cards.map(cardView)}
              {category === "experience" && (
                <>
                  {events(true, firstDimension, setFirstDimension)}
                  {events(false, repeatDimension, setRepeatDimension)}
                </>
              )}
            </section>
            <Discoveries
              period={period}
              source={source}
              state={state}
              category={category}
              color={meta.color}
              ownerID={ownerID}
              onOpen={openDetail}
            />
          </div>
        )}
      </div>
    </main>
  );
}
