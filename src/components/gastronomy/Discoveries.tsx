import { lazy, Suspense, useEffect, useState } from "react";
import {
  buildDiscoveries,
  discoveryLabels,
  type Card,
  type Category,
  type State,
  type Period,
} from "../../lib/gastronomy/engine";
import PeriodCard from "./PeriodCard";
import CardScrollList from "../system/CardScrollList";
const NativeDiscoverySection = lazy(
  () => import("../home-native/NativeDiscoverySection"),
);
export default function Discoveries(props: {
  state: State;
  category: Category;
  color: string;
  ownerID: string;
  onOpen: (card: Card) => void;
  period?: Period;
  source?: string;
}) {
  if (props.state.records.some((record) => record.id.startsWith("native:")))
    return (
      <Suspense fallback={<p role="status">발견을 불러오고 있어요</p>}>
        <NativeDiscoverySection
          key={props.ownerID}
          owner={props.ownerID}
          category={props.category}
          color={props.color}
          period={props.period}
          source={props.source}
        />
      </Suspense>
    );
  return <LegacyDiscoveries {...props} />;
}
type Visibility = Record<string, { read?: boolean; until?: number }>;
function LegacyDiscoveries({
  state,
  category,
  color,
  ownerID,
  onOpen,
}: {
  state: State;
  category: Category;
  color: string;
  ownerID: string;
  onOpen: (card: Card) => void;
}) {
  const key = `tastebuddy-discoveries-v1:${ownerID}`;
  const [visibility, setVisibility] = useState<{
    key: string;
    value: Visibility;
  }>(() => ({ key, value: read(key) }));
  useEffect(() => setVisibility({ key, value: read(key) }), [key]);
  const current = visibility.key === key ? visibility.value : {};
  const [limit, setLimit] = useState(3);
  const cards = buildDiscoveries(state).filter(
    (c) =>
      c.category === category &&
      (current[c.meaningKey]?.until ?? 0) <= Date.now(),
  );
  const unread = cards.filter((c) => !current[c.meaningKey]?.read),
    seen = cards.filter((c) => current[c.meaningKey]?.read);
  const update = (meaning: string, value: Visibility[string]) => {
    const next = { ...current, [meaning]: value };
    setVisibility({ key, value: next });
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Browsing still works when storage is unavailable. */
    }
  };
  const rail = (items: typeof cards) => (
    <CardScrollList snapsToCards contentClassName="items-stretch gap-3">
      {items.map((c) => (
        <div
          className="flex w-[calc(100vw-72px)] min-w-[240px] max-w-[360px] shrink-0 flex-col gap-1"
          key={c.id}
        >
          <PeriodCard
            category={category}
            label={c.title}
            title={c.detail}
            detail={c.meaning}
            color={color}
            onOpen={() => {
              update(c.meaningKey, { read: true });
              onOpen(c);
            }}
            footer={c.rows[0].value}
          />
          <button
            type="button"
            className="min-h-11 text-[11px] text-[var(--tb-color-text-hint)]"
            onClick={() =>
              update(c.meaningKey, {
                ...current[c.meaningKey],
                until: Date.now() + 7 * 86400000,
              })
            }
          >
            나중에 보기
          </button>
        </div>
      ))}
    </CardScrollList>
  );
  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold">발견</h2>
      {unread.length ? (
        rail(unread.slice(0, limit))
      ) : (
        <CardScrollList snapsToCards contentClassName="items-stretch gap-3">
          {discoveryLabels[category].map((label, i) => (
            <div
              key={`${label}-${i}`}
              className="flex w-[calc(100vw-72px)] min-w-[240px] max-w-[360px] shrink-0"
            >
              <PeriodCard
                category={category}
                label={label}
                title="다음 단서를 모으고 있어요"
                detail="같은 감각의 직접 평가나 다른 상황의 기록이 쌓이면 비교할 수 있는 해석을 보여드려요."
                color={color}
                footer="확인할 근거가 더 필요해요"
              />
            </div>
          ))}
        </CardScrollList>
      )}
      {unread.length > limit && (
        <button
          className="min-h-11 text-[12px]"
          onClick={() => setLimit((n) => n + 30)}
        >
          발견 더 보기 · {limit}/{unread.length}개
        </button>
      )}
      {seen.length > 0 && (
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-[13px]">
            확인한 발견 {seen.length}개
          </summary>
          {rail(seen)}
        </details>
      )}
    </section>
  );
}
function read(key: string): Visibility {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}
