import EmptyState from "../system/EmptyState";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, SquarePen } from "lucide-react";
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
}: {
  records: RecordRow[];
  onEditRecord?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {records.length === 0 ? (
        <p className="py-6 text-[13px] text-[var(--tb-color-text-hint)]">
          현재 범위에 연결된 원본 기록이 없어요.
        </p>
      ) : (
        records.map((r) => (
          <article key={r.id} className="rounded-[20px] bg-white p-4">
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
            {r.note && (
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6">
                {r.note}
              </p>
            )}
            {r.labels.length > 0 && (
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
  return (
    <header
      className="sticky top-0 z-10 flex h-14 shrink-0 items-center bg-[var(--tb-color-bg-page)] px-3"
      style={{
        paddingTop: "var(--tb-safe-area-top)",
        height: "calc(56px + var(--tb-safe-area-top))",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로"
        className="flex size-11 items-center justify-center"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold">
        {title}
      </h1>
      <span className="size-11" />
    </header>
  );
}
export function MeasurementDetail({
  card,
  data,
  onBack,
  color,
  onEditRecord,
}: {
  card: Card;
  data: Data;
  onBack: () => void;
  color: string;
  onEditRecord?: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string[] | null>(null);
  const ids = selected ?? [...new Set(card.rows.flatMap((r) => r.entryIDs))];
  return (
    <main className="flex h-full flex-col bg-[var(--tb-color-bg-page)]">
      <DetailHeader title={card.title} onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-5">
        <p className="mb-5 text-[12px] text-[var(--tb-color-text-hint)]">
          {card.meaning}
        </p>
        {card.rows.length === 0 ? (
          <p className="mb-6 text-[14px]">현재 기록이 없어요</p>
        ) : (
          card.rows.map((row) => (
            <section className="mb-4 rounded-[20px] bg-white p-4" key={row.id}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-4 text-left"
                onClick={() => setSelected(row.entryIDs)}
              >
                <span className="text-[14px] font-semibold">{row.title}</span>
                <span className="text-[13px]">{row.value}</span>
              </button>
              <p className="text-[12px] text-[var(--tb-color-text-hint)]">
                {row.detail}
              </p>
              {row.segments?.map((segment) => (
                <button
                  type="button"
                  key={segment.key}
                  onClick={() => setSelected(segment.entryIDs)}
                  className="mt-2 flex min-h-11 w-full items-center gap-3 text-[12px] text-left"
                >
                  <span className="w-16 shrink-0">{segment.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--tb-color-surface-muted)]">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${(segment.count / Math.max(1, ...row.segments!.map((s) => s.count))) * 100}%`,
                        background: color,
                      }}
                    />
                  </span>
                  <span>{segment.count}</span>
                </button>
              ))}
            </section>
          ))
        )}
        <div className="mb-3 mt-6 flex items-center justify-between">
          <h2 className="text-[16px] font-bold">관련 원본 기록</h2>
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="min-h-11 text-[12px]"
            >
              전체 근거 보기
            </button>
          )}
        </div>
        <RecordEvidence
          records={data.records.filter((r) => ids.includes(r.id))}
          onEditRecord={onEditRecord}
        />
      </div>
    </main>
  );
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
  const [detail, setDetail] = useState<Card | null>(null);
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
    "min-h-11 max-w-full rounded-xl bg-white px-3 text-[12px]";
  if (detail)
    return (
      <MeasurementDetail
        card={detail}
        data={data}
        color={meta.color}
        onEditRecord={onEditRecord}
        onBack={() => setDetail(null)}
      />
    );
  const cardView = (card: Card) => (
    <PeriodCard
      key={card.id}
      label={card.title}
      title={
        ["menu", "restaurant", "foodKind", "first", "repeat"].includes(card.id)
          ? `${card.rows.length}${card.id === "restaurant" ? "곳" : card.id === "foodKind" ? "가지" : "개"}`
          : card.rows[0]
            ? `${card.id === "meals" ? "" : card.rows[0].title + " · "}${card.rows[0].value}`
            : "아직 기록 없음"
      }
      detail={
        card.rows.length
          ? card.rows
              .slice(0, 3)
              .map((r) => `${r.title} · ${r.detail || r.value}`)
              .join("\n")
          : "기록이 쌓이면 이곳에서 살펴볼 수 있어요."
      }
      color={meta.color}
      onOpen={() => setDetail(card)}
    />
  );
  const events = (
    first: boolean,
    dimension: string,
    setDimension: (value: string) => void,
  ) => {
    const title = first ? "처음 기록한 경험" : "다시 기록한 경험";
    const rows = eventRows(state, dimension, first);
    return (
      <div className="rounded-[20px] bg-white p-3">
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
          id: first ? "first" : "repeat",
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
                    setDetail({
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
              onOpen={setDetail}
            />
          </div>
        )}
      </div>
    </main>
  );
}
