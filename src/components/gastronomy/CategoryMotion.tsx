import { useEffect, useRef, useState } from "react";
import nativeEngine from "../../../ios/TasteBuddy/Resources/CategoryMotion/TasteDataCategoryMotion.js?raw";
import {
  buildCards,
  dimensionRows,
  mealCount,
  senseKey,
  type Category,
  type Facet,
  type State,
} from "../../lib/gastronomy/engine";
interface Frame {
  state: string;
  dots: {
    id: string;
    x: number;
    y: number;
    r: number;
    color: string;
    opacity: number;
    tintColor?: string;
    tint?: number;
  }[];
  bridges?: {
    points: { x: number; y: number }[];
    color: string;
    opacity: number;
  }[];
  title: string;
  value: string;
  unit: string;
  notes: string[];
  summaryOpacity: number;
}
function motionInput(
  state: State,
  category: Category,
  domain: string,
  attribute: string,
  facet: Facet,
) {
  const scope =
    state.selected.length === 0 && state.unknown.length && state.window
      ? "held"
      : state.records.length === 0
        ? "noData"
        : "valid";
  let data: any;
  const cards = buildCards(state, category, { domain, attribute, facet });
  if (category === "experience")
    data = {
      kind: "experienceCluster",
      state: scope,
      records: state.selected.map((r) => ({
        id: r.id,
        mealId: r.mealID,
        identity:
          r.menu && r.menuKey !== null
            ? {
                kind: r.source === "homeCooked" ? "home" : "menu",
                id: r.menuKey ?? JSON.stringify([r.restaurant, r.menu]),
                name: r.menu,
              }
            : null,
      })),
    };
  if (category === "sensation") {
    const presence = state.observations.filter((o) => o.facet === "presence");
    const map = new Map(state.selected.map((r) => [r.id, r.mealID]));
    const keys =
      domain === "맛"
        ? [
            "taste.sweet",
            "taste.sour",
            "taste.bitter",
            "taste.salty",
            "taste.umami",
            "mouthfeel.fatty",
          ]
        : [
            ...new Set(
              presence
                .filter((o) =>
                  domain === "향"
                    ? o.attribute.startsWith("aroma.")
                    : domain === "식감"
                      ? /^(texture|mouthfeel)\./.test(o.attribute)
                      : true,
                )
                .map((o) => o.attribute),
            ),
          ];
    const names = ["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"];
    data = {
      kind: "sensoryRays",
      state: scope,
      domain:
        domain === "향" ? "aroma" : domain === "식감" ? "texture" : "taste",
      validMealIds: [
        ...new Set(presence.map((o) => map.get(o.entryID)).filter(Boolean)),
      ],
      senses: keys.map((key, i) => {
        const obs = presence.filter(
          (o) =>
            o.attribute === key && (!attribute || senseKey(o) === attribute),
        );
        const intensity =
          cards
            .find((c) => c.id === "intensity")
            ?.rows.find((r) => r.id === JSON.stringify([key, ""]))?.segments ??
          [];
        return {
          id: JSON.stringify([key, ""]),
          name: domain === "맛" ? names[i] : (obs[0]?.label ?? key),
          color: i % 6,
          mealIds: [
            ...new Set(obs.map((o) => map.get(o.entryID)).filter(Boolean)),
          ],
          intensity: Object.fromEntries(
            ["weak", "medium", "strong", "unanswered"].map((k) => [
              k,
              intensity.find(
                (s) => s.key === (k === "unanswered" ? "missing" : k),
              )?.count ?? 0,
            ]),
          ),
        };
      }),
    };
  }
  const responses = (segments: any[] = []) =>
    segments.flatMap((s) =>
      s.sampleIDs.map((id: string) => ({
        id,
        unitId: id,
        response:
          s.key === "missing"
            ? "unanswered"
            : s.key === "mixed"
              ? "split"
              : (facet === "overall"
                  ? [
                      "very_positive",
                      "positive",
                      "neutral",
                      "negative",
                      "very_negative",
                    ]
                  : facet === "fit"
                    ? ["below_preferred", "just_right", "above_preferred"]
                    : ["positive", "neutral", "negative"]
                ).indexOf(s.key),
      })),
    );
  if (category === "preference")
    data = {
      kind: "preferenceFocus",
      state: scope,
      mode:
        facet === "overall" ? "overall" : facet === "fit" ? "fit" : "liking",
      responses: responses(
        cards.find((c) => c.id === facet)?.rows[0]?.segments,
      ),
    };
  if (
    category === "preference" &&
    data.state === "valid" &&
    !data.responses.some((r: any) => typeof r.response === "number")
  )
    data.state = data.responses.some((r: any) => r.response === "split")
      ? "held"
      : data.responses.length
        ? "unanswered"
        : "noData";
  if (category === "context")
    data = {
      kind: "contextLayers",
      state: scope,
      mode: facet === "fit" ? "fit" : "liking",
      sense: cards[0]?.meaning ?? "",
      dimension: "food",
      conditions:
        cards[0]?.rows.map((r) => ({
          id: r.id,
          label: r.title,
          responses: responses(r.segments),
        })) ?? [],
    };
  if (category === "change") {
    const pair = cards[0]?.rows
      .find((r) => r.id === "menu")
      ?.value.split(" → ")
      .map(Number) ?? [0, 0];
    const status = state.selected.length
      ? "valid"
      : scope === "held"
        ? "held"
        : "noData";
    data = {
      kind: "changeRipples",
      state: scope,
      metric: "메뉴",
      unit: "개",
      maximum: Math.max(1, ...pair),
      previous: {
        label: "이전",
        start: "이전 기간",
        end: "",
        value: scope === "held" ? null : pair[0],
        state: status,
      },
      recent: {
        label: "최근",
        start: "최근 기간",
        end: "",
        value: scope === "held" ? null : pair[1],
        state: status,
      },
    };
  }
  return JSON.stringify({
    data,
    ...(attribute ? { selected: attribute } : {}),
  });
}
export default function CategoryMotion({
  state,
  category,
  domain,
  attribute,
  facet,
}: {
  state: State;
  category: Category;
  domain: string;
  attribute: string;
  facet: Facet;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [failed, setFailed] = useState(false);
  const input = motionInput(state, category, domain, attribute, facet);
  useEffect(() => {
    setFrame(null);
    setFailed(false);
    // Native's exact engine runs in a dedicated worker; no remote script or rendering fixture.
    const blob = new Blob(
      [
        nativeEngine,
        "\nonmessage=function(e){try{if(e.data.input)TasteBuddyCategoryMotion.configure(e.data.input);postMessage({frame:JSON.parse(TasteBuddyCategoryMotion.frame(e.data.time,JSON.stringify(e.data.options)))});}catch(error){postMessage({error:String(error)});}};",
      ],
      { type: "text/javascript" },
    );
    const url = URL.createObjectURL(blob),
      worker = new Worker(url);
    URL.revokeObjectURL(url);
    let id = 0,
      ready = true,
      stopped = false;
    const started = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    worker.onmessage = (e) => {
      ready = true;
      if (stopped) return;
      if (e.data.error) {
        setFailed(true);
        return;
      }
      setFrame(e.data.frame);
    };
    worker.onerror = () => {
      setFailed(true);
      stopped = true;
    };
    const render = (time: number) => {
      if (stopped) return;
      const intro = category === "experience" ? 6.4 : 1.8;
      const top = ref.current?.getBoundingClientRect().top ?? 0;
      const scroll = Math.max(0, Math.min(1, -top / 300));
      if (ready && !document.hidden) {
        ready = false;
        worker.postMessage({
          input,
          time: reduce.matches
            ? intro
            : scroll > 0
              ? intro * (1 - scroll)
              : (time - started) / 1000,
          options: { playback: "intro", alignment: 0, rotation: 0 },
        });
      }
      if (!reduce.matches) id = requestAnimationFrame(render);
    };
    render(started);
    return () => {
      stopped = true;
      cancelAnimationFrame(id);
      worker.terminate();
    };
  }, [input, category]);
  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-square w-full max-w-[340px]"
      aria-label={
        frame ? [frame.title, frame.value, frame.unit].join(" ") : "미식 데이터"
      }
    >
      {frame && (
        <>
          <svg
            viewBox="0 0 640 640"
            className="h-full w-full"
            aria-hidden="true"
          >
            {frame.bridges?.map((b, i) => (
              <path
                key={i}
                d={
                  b.points.length === 8
                    ? `M${b.points[0].x} ${b.points[0].y} C${b.points[1].x} ${b.points[1].y} ${b.points[2].x} ${b.points[2].y} ${b.points[3].x} ${b.points[3].y} L${b.points[4].x} ${b.points[4].y} C${b.points[5].x} ${b.points[5].y} ${b.points[6].x} ${b.points[6].y} ${b.points[7].x} ${b.points[7].y} Z`
                    : ""
                }
                fill={b.color}
                opacity={b.opacity}
              />
            ))}
            {frame.dots.map((d) => (
              <g key={d.id} opacity={d.opacity}>
                <circle cx={d.x} cy={d.y} r={d.r} fill={d.color} />
                {d.tintColor && (
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r={d.r}
                    fill={d.tintColor}
                    opacity={d.tint ?? 0}
                  />
                )}
              </g>
            ))}
          </svg>
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ opacity: frame.summaryOpacity }}
          >
            <p className="text-[12px] text-[var(--tb-color-text-hint)]">
              {frame.title}
            </p>
            <p className="mt-1 max-w-[37%] truncate text-[22px] font-bold tabular-nums">
              {frame.value}
            </p>
            <p className="mt-1 max-w-[37%] text-[12px] font-medium">
              {frame.unit}
            </p>
            {frame.state !== "valid" && frame.notes?.[0] && (
              <p className="mt-1 max-w-[37%] text-[11px] text-[var(--tb-color-text-hint)]">
                {frame.notes[0]}
              </p>
            )}
          </div>
        </>
      )}
      {!frame && !failed && (
        <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[var(--tb-color-text-hint)]">
          준비 중
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px]">
          {category === "experience"
            ? `${mealCount(state.selected)}번의 식사 · ${dimensionRows(state.selected, "menu").length}개 메뉴`
            : "현재 기록의 측정 데이터"}
        </div>
      )}
    </div>
  );
}
