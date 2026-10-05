import { NativeRecordPhoto } from "./NativeDiningHome";
import NativePhotoHints from "./NativePhotoHints";
import { diningDetailTagCategories } from "../../constants/diningDetailTags";
import { useEffect, useMemo, useRef, useState } from "react";
import { SENSORY_V2, makeSensoryV2Presentation, makeSensoryV2Selection, sensoryV2Categories, sensoryV2Entry, sensoryV2MatchesQuery, sensorySelectionKey, validSensoryV2Presentation } from '../../lib/sensoryV2.mjs';
import SensoryProfileControls from './SensoryProfileControls';
import DishKindIcon from '../system/DishKindIcon';
import { Camera, X } from "lucide-react";
import { DINING_SELECTION_CATALOG } from "../../../scripts/tba-platform-pilot/dining-selections.mjs";
import { DINING_OVERALL_RESPONSES } from "../../../scripts/tba-platform-pilot/dining-overall-evaluation.mjs";
import { DISH_KIND_GROUPS, getDishKindOptionsForSelection } from "../../constants/dishKindTags";
import {
  searchKakaoRestaurantPlaces,
  type KakaoPlaceSearchResult,
} from "../../lib/tasteBuddySupabase";
import {
  effectiveSelections,
  makeSelection,
  newNativeRecord,
  overallEvaluation,
  swiftTime,
  type NativeRecord,
  type SensorySelection,
} from "../../lib/gastronomy/nativeRecord";
import {
  TasteExperienceMap,
  type TasteExperienceWord,
  type TasteMapViewportState,
} from "../reservation/DiningFeedbackFlow";
import SensorySelectionEditor from "./SensorySelectionEditor";
import { DetailHeader } from "../gastronomy/TasteDataPage";
const titles = ["미식 기록", "전체 평가", "미각 버블", "디테일", "기록 확인"];
const field =
  "min-h-11 w-full rounded-[14px] border border-[var(--tb-color-border-default)] bg-white px-3 text-[14px]";
function dateInput(value?: number | null) {
  if (value == null) return "";
  const d = new Date(Date.UTC(2001, 0, 1) + value * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
async function jpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("사진을 읽지 못했어요.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("사진을 준비하지 못했어요.")),
        "image/jpeg",
        0.88,
      ),
    );
  } finally {
    bitmap.close();
  }
}
export default function NativeDiningEditor({
  original,
  owner,
  seed,
  meal,
  entries,
  onSave,
  onClose,
}: {
  original?: NativeRecord;
  owner: string;
  seed?: Pick<NativeRecord, "restaurant"> &
    Partial<Pick<NativeRecord, "menu" | "restaurantID" | "foodSource">>;
  meal?: NativeRecord;
  entries: NativeRecord[];
  onSave: (
    entry: NativeRecord,
    expected: NativeRecord | null,
    photo?: { filename: string; blob: Blob },
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [baseline] = useState(() =>
    original ? structuredClone(original) : null,
  );
  const [entry, setEntry] = useState(() =>
      structuredClone(original ?? { ...newNativeRecord(meal), ...seed }),
    ),
    [step, setStep] = useState(0),
    [saving, setSaving] = useState(false),
    [error, setError] = useState<string | null>(null),
    [discard, setDiscard] = useState(false);
  const [sourcePhoto, setSourcePhoto] = useState<File | null>(null);
  const [linkedBubbleID, setLinkedBubbleID] = useState<string | null>(null);
  const [detailSearch, setDetailSearch] = useState('');
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [customInputs, setCustomInputs] = useState<Record<string,string>>({});
  const [photo, setPhoto] = useState<
      { filename: string; blob: Blob } | undefined
    >(),
    [photoURL, setPhotoURL] = useState<string | null>(null),
    [photoLoading, setPhotoLoading] = useState(false);
  const [search, setSearch] = useState(""),
    [showWords, setShowWords] = useState(false),
    [places, setPlaces] = useState<KakaoPlaceSearchResult[]>([]),
    [searching, setSearching] = useState(false),
    [placeMessage, setPlaceMessage] = useState("");
  const shellRef = useRef<HTMLDivElement>(null);
  const mapViewportRef = useRef<TasteMapViewportState | null>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    return () => {
      if (prior?.isConnected) prior.focus({ preventScroll: true });
    };
  }, []);
  const request = useRef(0),
    alive = useRef(true),
    formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current++;
    };
  }, []);
  useEffect(() => {
    if (!photo) {
      setPhotoURL(null);
      return;
    }
    const url = URL.createObjectURL(photo.blob);
    setPhotoURL(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  useEffect(() => {
    formRef.current?.scrollTo(0, 0);
    setError(null);
  }, [step]);
  const selections = effectiveSelections(entry),
    bubbles = selections.filter((s) => s.type === "bubble"),
    details = selections.filter((s) => s.type === "detailTag");
  const dishKindIDs = entry.dishKindIDs ?? [];
  const usesLegacyMap = !!baseline && effectiveSelections(baseline).some(s=>s.type==='bubble'&&s.catalogVersion==='dining-sensory-selection/1');
  const presentation = useMemo(() => validSensoryV2Presentation(entry.sensoryPresentation) ? entry.sensoryPresentation : makeSensoryV2Presentation({menu:entry.menu,dishKindIDs:entry.dishKindIDs ?? []}), [entry.sensoryPresentation,entry.menu,entry.dishKindIDs]);
  const categoryPools = useMemo(() => {
    if (showAllDetails || detailSearch.trim()) return SENSORY_V2.entries.filter(e=>e.type==='detailTag'&&e.label.includes(detailSearch.trim())).reduce<{id:string;label:string;tags:{id:string;label:string}[]}[]>((groups,e)=>{
      let group=groups.find(g=>g.id===e.familyId);
      if(!group){group={id:e.familyId!,label:diningDetailTagCategories.find(f=>f.id===e.familyId)?.label??e.familyId!,tags:[]};groups.push(group);}
      group.tags.push({id:e.id,label:e.label});return groups;
    },[]);
    return sensoryV2Categories(presentation);
  },[presentation,showAllDetails,detailSearch]);
  const update = (fields: Partial<NativeRecord>) =>
    setEntry((current) => {
      const next = {...current,...fields};
      if ((fields.menu !== undefined || fields.dishKindIDs !== undefined) && effectiveSelections(current).length===0) {
        next.sensoryPresentation=makeSensoryV2Presentation({menu:next.menu,dishKindIDs:next.dishKindIDs ?? [],profileSelection:presentation.profileSelection,flagOverrides:presentation.flagOverrides});
      }
      return next;
    });
  const setSelections = (next: SensorySelection[]) =>
    update({
      sensorySelections: next,
      sensoryPresentation: {...(entry.sensoryPresentation??{}),...presentation,bubbleCatalogVersion:usesLegacyMap?'dining-sensory-selection/1':SENSORY_V2.version,displayedBubbleIDs:(usesLegacyMap?DINING_SELECTION_CATALOG:SENSORY_V2.entries).filter(e=>e.type==='bubble').map(e=>e.id)},
      tasteExperienceIDs: next
        .filter((s) => s.type === "bubble")
        .map((s) => s.id),
      detailTagIDs: next.filter((s) => s.type === "detailTag").map((s) => s.id),
    });
  const remove = (selection: SensorySelection) =>
    setSelections(
      selections
        .filter((s) => sensorySelectionKey(s)!==sensorySelectionKey(selection)),
    );
  const toggleBubble = (word: TasteExperienceWord) => {
    const found = bubbles.find((s) => s.id === word.id);
    if (found) {
      remove(found);
      return bubbles.filter((s) => s.id !== word.id).map((s) => s.id);
    }
    if (bubbles.length >= 3) return bubbles.map((s) => s.id);
    const next = [...selections, makeSelection(word.id, "bubble")];
    setSelections(next);
    return next.filter((s) => s.type === "bubble").map((s) => s.id);
  };
  const setSelection = (next: SensorySelection, previousKey=sensorySelectionKey(next)) =>
    setSelections(
      selections.map((s) =>
        sensorySelectionKey(s)===previousKey ? next : s,
      ),
    );
  const scopedDetail = (id:string) => details.find(s=>s.id===id&&(sensoryV2Entry(id)?.bindingMode!=='modifier'||(s.relatedBubbleID??null)===(bubbles.find(b=>b.id===linkedBubbleID)?.id??null)));
  const toggleDetail = (id:string) => {
    const selected=scopedDetail(id);
    if(selected){remove(selected);return;}
    setSelections([...selections,makeSensoryV2Selection(id,{relatedBubble:bubbles.find(b=>b.id===linkedBubbleID)??null})]);
  };
  const addCustom = (family:string) => {
    const label=(customInputs[family]??'').trim();if(!label)return;
    const id=`custom:${family}:${label}`;
    if(!details.some(s=>s.id===id))setSelections([...selections,{id,type:'detailTag',catalogVersion:SENSORY_V2.version,definitionVersion:'custom/1',selectionInstanceID:crypto.randomUUID(),labelSnapshot:label,bindingMode:'independent',scopeKind:'whole_dish',target:'whole_dish',phase:'unspecified'}]);
    setCustomInputs(current=>({...current,[family]:''}));
  };
  const canContinue =
    step === 0
      ? !!entry.menu.trim() && !photoLoading
      : step === 1
        ? !!entry.overallEvaluation &&
          !!DINING_OVERALL_RESPONSES[entry.overallEvaluation.responseValue]
        : step === 2
          ? true
          : true;
  const close = () => {
    if (!saving) setDiscard(true);
  };
  const next = () => {
    if (canContinue) {
      if(!validSensoryV2Presentation(entry.sensoryPresentation))update({sensoryPresentation:presentation});
      setStep((n) => n + 1);
    }
  };
  const save = async (status = "completed") => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...entry, feedbackStatus: status }, baseline, photo);
      onClose();
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error
            ? e.message
            : "저장하지 못했어요. 작성한 내용은 유지했어요.",
        );
    } finally {
      if (alive.current) setSaving(false);
    }
  };
  const lookup = async () => {
    const id = ++request.current;
    const query = entry.restaurant.trim();
    if (!query) return;
    setSearching(true);
    setPlaceMessage("");
    try {
      const found = await searchKakaoRestaurantPlaces(query);
      if (alive.current && id === request.current) {
        setPlaces(found);
        if (!found.length)
          setPlaceMessage(
            "일치하는 식당을 찾지 못했어요. 식당명만 남길 수 있어요.",
          );
      }
    } finally {
      if (alive.current && id === request.current) setSearching(false);
    }
  };
  const recipes = [
    ...new Map(
      entries
        .filter(
          (e) =>
            e.foodSource?.kind === "homeCooked" && e.foodSource.homeCookingID,
        )
        .map((e) => [e.foodSource!.homeCookingID!, e]),
    ).entries(),
  ];
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[var(--tb-color-bg-page)]"
      ref={shellRef}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          if (discard) setDiscard(false);
          else close();
        }
        if (e.key === "Tab") {
          const scope = discard
            ? shellRef.current?.querySelector('[role="alertdialog"]')
            : shellRef.current;
          const controls = Array.from(
            scope?.querySelectorAll<HTMLElement>(
              'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]',
            ) ?? [],
          ).filter((el) => el.getClientRects().length > 0);
          const first = controls[0],
            last = controls[controls.length - 1];
          if (
            e.shiftKey &&
            (document.activeElement === first ||
              !scope?.contains(document.activeElement))
          ) {
            e.preventDefault();
            last?.focus();
          } else if (
            !e.shiftKey &&
            (document.activeElement === last ||
              !scope?.contains(document.activeElement))
          ) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={original ? "미식 기록 수정" : "새 미식 기록"}
    >
      <div className="flex items-center">
        <div className="min-w-0 flex-1">
          <DetailHeader
            title={titles[step]}
            onBack={() => {
              if (!saving) {
                if (step) setStep((n) => n - 1);
                else close();
              }
            }}
          />
        </div>
        <button
          type="button"
          className="mr-3 flex size-11 items-center justify-center"
          aria-label="기록 닫기"
          onClick={close}
          disabled={saving}
        >
          <X size={20} />
        </button>
      </div>
      {step === 2 && !showWords ? (
        <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
          <TasteExperienceMap
            viewportStateRef={mapViewportRef}
            sensoryPresentation={usesLegacyMap ? undefined : presentation}
            sensorySelections={selections}
            selectedExperienceIds={bubbles.map((b) => b.id)}
            onToggleSelection={toggleBubble}
            onConfirm={(word) => {
              if (!bubbles.some((s) => s.id === word.id) && bubbles.length < 3)
                setSelections([
                  ...selections,
                  makeSelection(word.id, "bubble"),
                ]);
              setStep(3);
            }}
          />
          <button
            type="button"
            className="absolute right-5 top-3 z-40 min-h-11 rounded-full bg-white px-4 text-[12px] shadow-sm"
            onClick={() => setShowWords(true)}
          >
            미각 단어 검색
          </button>
          <button
            type="button"
            className="absolute left-5 top-3 z-40 min-h-11 rounded-full bg-white px-4 text-[12px] shadow-sm"
            onClick={() => setStep(3)}
          >
            {bubbles.length ? `${bubbles.length}개 선택 · 다음` : '디테일만 기록'}
          </button>
        </div>
      ) : (
        <div
          ref={formRef}
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5"
        >
          <div className="mx-auto flex max-w-[560px] flex-col gap-6">
            {step === 0 && (
              <>
                <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] bg-white p-4">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="선택한 음식 사진"
                      className="max-h-52 rounded-xl object-contain"
                    />
                  ) : original && entry.reflectionPhotoFilename ? (
                    <NativeRecordPhoto
                      owner={owner}
                      entry={entry}
                      fallback={<Camera size={28} />}
                    />
                  ) : (
                    <Camera size={28} />
                  )}
                  <span className="text-[13px]">
                    {photoLoading
                      ? "사진 준비 중"
                      : entry.reflectionPhotoFilename &&
                          original?.reflectionPhotoFilename ===
                            entry.reflectionPhotoFilename &&
                          !photo
                        ? "기존 사진 유지 · 사진 변경"
                        : "사진으로 기록하기 · 선택사항"}
                  </span>
                  <input
                    aria-label="음식 사진"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={photoLoading || saving}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPhotoLoading(true);
                      try {
                        const blob = await jpeg(file);
                        if (!alive.current) return;
                        const filename = `${crypto.randomUUID()}.jpg`;
                        setPhoto({ filename, blob });
                        setSourcePhoto(file);
                        update({ reflectionPhotoFilename: filename });
                      } catch {
                        setError(
                          "사진을 읽지 못했어요. 다른 사진을 선택해 주세요.",
                        );
                      } finally {
                        if (alive.current) setPhotoLoading(false);
                      }
                    }}
                  />
                </label>
                {sourcePhoto && (
                  <NativePhotoHints
                    key={photo?.filename}
                    file={sourcePhoto}
                    onMenu={(menu) => update({ menu, menuItemID: null })}
                    onRestaurant={(restaurantID, restaurant) =>
                      update({
                        restaurant,
                        restaurantID,
                        foodSource: {
                          kind: "restaurant",
                          version: 1,
                          restaurantNamespace: "kakao",
                        },
                      })
                    }
                  />
                )}
                {entry.reflectionPhotoFilename && (
                  <button
                    type="button"
                    className="min-h-11 text-sm underline"
                    onClick={() => {
                      setPhoto(undefined);
                      setSourcePhoto(null);
                      update({
                        reflectionPhotoFilename: entry.additionalPhotoFilenames?.[0] ?? null,
                        additionalPhotoFilenames: entry.additionalPhotoFilenames?.slice(1) ?? [],
                      });
                    }}
                  >
                    사진 제거
                  </button>
                )}
                <label className="text-[13px] font-semibold">
                  메뉴 이름
                  <input
                    autoFocus
                    aria-label="메뉴 이름"
                    className={`${field} mt-2`}
                    value={entry.menu}
                    onChange={(e) =>
                      update({ menu: e.target.value, menuItemID: null })
                    }
                    placeholder="어떤 음식을 기록할까요?"
                  />
                </label>
                <label className="text-[13px] font-semibold">
                  식당 · 선택사항
                  <div className="mt-2 flex gap-2">
                    <input
                      aria-label="식당 이름"
                      className={field}
                      value={entry.restaurant}
                      onChange={(e) => {
                        request.current++;
                        setPlaces([]);
                        setSearching(false);
                        update({
                          restaurant: e.target.value,
                          restaurantID: null,
                        });
                      }}
                      placeholder="식당명 입력"
                    />
                    <button
                      type="button"
                      onClick={lookup}
                      disabled={searching || !entry.restaurant.trim()}
                      className="shrink-0 rounded-xl bg-white px-3 text-[12px]"
                    >
                      {searching ? "검색 중" : "식당 찾기"}
                    </button>
                  </div>
                </label>
                {places.map((p, i) => (
                  <button
                    type="button"
                    className="rounded-[14px] bg-white p-3 text-left text-[13px]"
                    key={p.placeId ?? i}
                    onClick={() => {
                      if (!p.placeId || !p.name) return;
                      update({
                        restaurant: p.name,
                        restaurantID: p.placeId,
                        foodSource: {
                          kind: "restaurant",
                          restaurantNamespace: "kakao",
                          version: 1,
                        },
                      });
                      setPlaces([]);
                      setPlaceMessage("확인한 식당에 연결했어요.");
                    }}
                  >
                    {p.name}
                    <span className="mt-1 block text-[11px] text-[var(--tb-color-text-hint)]">
                      {p.roadAddress ?? p.address}
                    </span>
                  </button>
                ))}
                {placeMessage && <p className="text-[12px]">{placeMessage}</p>}
                <details className="rounded-[18px] bg-white p-4">
                  <summary className="min-h-11 cursor-pointer text-[13px] font-semibold">
                    식사 시점 · 선택사항
                  </summary>
                  <select
                    aria-label="식사일 출처"
                    className={field}
                    value={entry.mealTime?.source ?? "unknown"}
                    onChange={(e) =>
                      update({ mealTime: { source: e.target.value } })
                    }
                  >
                    <option value="unknown">식사 시점 모름</option>
                    <option value="user_confirmed">확인한 식사일</option>
                    <option value="recorded_only">기록일만 확인</option>
                    {entry.mealTime?.source &&
                      !["unknown", "user_confirmed", "recorded_only"].includes(
                        entry.mealTime.source,
                      ) && (
                        <option value={entry.mealTime.source}>
                          이전에 남긴 식사 시점 유지
                        </option>
                      )}
                  </select>
                  {entry.mealTime?.source === "user_confirmed" && (
                    <input
                      aria-label="확인한 식사일"
                      type="date"
                      className={`${field} mt-3`}
                      max={dateInput(swiftTime())}
                      value={dateInput(entry.mealTime.start)}
                      onChange={(e) =>
                        update({
                          mealTime: {
                            source: "user_confirmed",
                            start: e.target.value
                              ? swiftTime(
                                  new Date(e.target.value + "T00:00:00"),
                                )
                              : null,
                            confirmedAt: swiftTime(),
                          },
                        })
                      }
                    />
                  )}
                  <p className="mt-3 text-[11px] text-[var(--tb-color-text-hint)]">
                    저장한 날짜를 실제 식사일로 대신 사용하지 않아요.
                  </p>
                </details>
                <details className="rounded-[18px] bg-white p-4">
                  <summary className="min-h-11 cursor-pointer text-[13px] font-semibold">
                    음식 출처 · 선택사항
                  </summary>
                  <select
                    aria-label="음식 출처"
                    className={field}
                    value={entry.foodSource?.kind ?? "unknown"}
                    onChange={(e) =>
                      update({
                        foodSource: {
                          ...entry.foodSource,
                          kind: e.target.value,
                          homeCookingID: null,
                          version: 1,
                        },
                      })
                    }
                  >
                    <option value="unknown">출처 미확인</option>
                    <option value="restaurant">식당 음식</option>
                    <option value="homeCooked">직접 만든 요리</option>
                    {entry.foodSource?.kind &&
                      !["unknown", "restaurant", "homeCooked"].includes(
                        entry.foodSource.kind,
                      ) && (
                        <option value={entry.foodSource.kind}>
                          이전 출처 유지
                        </option>
                      )}
                  </select>
                  {entry.foodSource?.kind === "homeCooked" && (
                    <>
                      <select
                        aria-label="같은 요리 연결"
                        value={entry.foodSource.homeCookingID ?? ""}
                        className={`${field} mt-3`}
                        onChange={(e) =>
                          update({
                            foodSource: {
                              ...entry.foodSource!,
                              homeCookingID: e.target.value || null,
                            },
                          })
                        }
                      >
                        <option value="">요리 연결 미확인</option>
                        {recipes.map(([id, e]) => (
                          <option value={id} key={id}>
                            {e.menu}
                          </option>
                        ))}
                        {entry.foodSource.homeCookingID &&
                          !recipes.some(
                            ([id]) => id === entry.foodSource!.homeCookingID,
                          ) && (
                            <option value={entry.foodSource.homeCookingID}>
                              새로 연결한 요리
                            </option>
                          )}
                      </select>
                      <button
                        type="button"
                        className="min-h-11 text-[12px]"
                        onClick={() =>
                          update({
                            foodSource: {
                              ...entry.foodSource!,
                              homeCookingID: crypto.randomUUID().toUpperCase(),
                            },
                          })
                        }
                      >
                        새로운 직접 만든 요리로 연결
                      </button>
                    </>
                  )}
                </details>
                <details className="rounded-[18px] bg-white p-4">
                  <summary className="min-h-11 cursor-pointer text-[13px] font-semibold">
                    음식 종류와 특성 · 선택사항
                  </summary>
                  {[...DISH_KIND_GROUPS, { id: "legacy", label: "이전에 선택한 분류" }].map((group) => {
                    const options = getDishKindOptionsForSelection(dishKindIDs).filter((kind) => kind.group === group.id);
                    if (!options.length) return null;
                    return <div key={group.id} className="mt-3">
                      <p className="mb-2 text-[11px] text-[var(--tb-color-text-subtle)]">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((k) => <button
                          type="button" key={k.id} aria-pressed={dishKindIDs.includes(k.id)}
                          className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3 text-[12px] ${dishKindIDs.includes(k.id) ? "border-black bg-black text-white" : "border-transparent bg-[var(--tb-color-surface-muted)]"}`}
                          onClick={() => update({ dishKindIDs: dishKindIDs.includes(k.id) ? dishKindIDs.filter((id) => id !== k.id) : [...dishKindIDs, k.id] })}
                        ><DishKindIcon id={k.id} /><span>{k.label}</span></button>)}
                      </div>
                    </div>;
                  })}
                </details>
                <SensoryProfileControls presentation={presentation} onChange={(profileSelection,flagOverrides)=>update({sensoryPresentation:makeSensoryV2Presentation({menu:entry.menu,dishKindIDs,profileSelection,flagOverrides})})}/>
              </>
            )}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-[20px] font-bold">
                    이 음식은 전체적으로 어땠나요?
                  </h2>
                  <p className="mt-2 text-[13px] text-[var(--tb-color-text-hint)]">
                    가장 가까운 느낌을 골라주세요.
                  </p>
                </div>
                <div className="flex flex-col gap-[10px]">
                  {Object.entries(DINING_OVERALL_RESPONSES).map(
                    ([value, response]) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={
                          entry.overallEvaluation?.responseValue === value
                        }
                        className={`min-h-[64px] rounded-[20px] border p-4 text-left text-[14px] font-semibold ${entry.overallEvaluation?.responseValue === value ? "border-black bg-white" : "border-transparent bg-white"}`}
                        onClick={() =>
                          update({
                            overallEvaluation: overallEvaluation(value),
                          })
                        }
                      >
                        {response.label}
                        <span className="float-right">
                          {entry.overallEvaluation?.responseValue === value
                            ? "●"
                            : "○"}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
            {step === 2 && showWords && (
              <>
                <button
                  type="button"
                  className="min-h-11 text-left text-[13px]"
                  onClick={() => setShowWords(false)}
                >
                  미각 버블 지도로 돌아가기
                </button>
                <input
                  aria-label="미각 단어 검색"
                  className={field}
                  placeholder="기억에 남은 맛을 찾아보세요"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <p className="text-[12px]">
                  최대 3개 · 선택 {bubbles.length}개
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(usesLegacyMap?DINING_SELECTION_CATALOG:SENSORY_V2.entries).filter(
                    (c) => c.type === "bubble" && (c.label.includes(search) || (!usesLegacyMap && sensoryV2MatchesQuery(c.id, search))),
                  ).map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      aria-pressed={bubbles.some((b) => b.id === c.id)}
                      onClick={() =>
                        toggleBubble({ id: c.id } as TasteExperienceWord)
                      }
                      className={`min-h-[64px] rounded-full border px-3 text-[12px] ${bubbles.some((b) => b.id === c.id) ? "border-black bg-black text-white" : "border-transparent bg-white"}`}
                    >
                      {bubbles.find(b => b.id === c.id)?.labelSnapshot ?? c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 3 && (
              <>
                {bubbles.length > 0 && <section className="flex flex-col gap-3">
                  <h2 className="text-[16px] font-bold">선택한 미각 평가</h2>
                  {bubbles.map((s) => (
                    <SensorySelectionEditor
                      key={sensorySelectionKey(s)}
                      selection={s}
                      bubbles={bubbles}
                      onChange={next=>setSelection(next,sensorySelectionKey(s))}
                      onRemove={() => remove(s)}
                    />
                  ))}
                </section>}
                <section>
                  <h2 className="mb-3 text-[16px] font-bold">
                    디테일 태그 · 선택사항
                  </h2>
                  <label className="mb-4 block text-[12px]">
                    흐름을 설명할 대상
                    <select
                      aria-label="흐름을 설명할 대상"
                      className={`${field} mt-2`}
                      value={
                        bubbles.find((b) => b.id === linkedBubbleID)?.id ??
                        ""
                      }
                      onChange={(e) => setLinkedBubbleID(e.target.value||null)}
                    >
                      <option value="">음식 전체</option>
                      {bubbles.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.labelSnapshot}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mb-4 flex items-center gap-2">
                    <input aria-label="디테일 태그 검색" className={field} value={detailSearch} onChange={e=>setDetailSearch(e.target.value)} placeholder="디테일 태그 검색"/>
                    <button type="button" className="min-h-11 shrink-0 text-[12px]" onClick={()=>setShowAllDetails(v=>!v)}>{showAllDetails?'음식에 맞는 표현':'전체 표현'}</button>
                  </div>
                  <div className="flex flex-col gap-6">
                    {categoryPools.map((group) => (
                      <section key={group.id}>
                        <h3 className="mb-3 text-[14px] font-semibold">
                          {group.label}
                        </h3>
                        <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-2 overflow-x-auto pb-2">
                          {group.tags.map((c) => {
                            const selected = scopedDetail(c.id);
                            return (
                              <button
                                type="button"
                                key={c.id}
                                aria-pressed={!!selected}
                                className={`min-h-11 rounded-full border px-3 text-[12px] ${selected ? "border-black bg-black text-white" : "border-transparent bg-white"}`}
                                onClick={() => toggleDetail(c.id)}
                              >
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <input aria-label={`${group.label} 직접 입력`} className={field} placeholder="직접 입력" value={customInputs[group.id]??''} onChange={e=>setCustomInputs(v=>({...v,[group.id]:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCustom(group.id);}}}/>
                          <button type="button" className="min-h-11 shrink-0 px-2 text-[12px]" onClick={()=>addCustom(group.id)}>추가</button>
                        </div>
                      </section>
                    ))}
                  </div>
                </section>
                {details.length > 0 && (
                  <section className="flex flex-col gap-3">
                    <h2 className="text-[16px] font-bold">
                      선택한 디테일 평가
                    </h2>
                    {details.map((s) => (
                      <SensorySelectionEditor
                        key={sensorySelectionKey(s)}
                        selection={s}
                        bubbles={bubbles}
                        onChange={next=>setSelection(next,sensorySelectionKey(s))}
                        onRemove={() => remove(s)}
                        onDuplicate={()=>setSelections([...selections,{...s,selectionInstanceID:crypto.randomUUID(),liking:null,intensity:null,preferenceFit:null}])}
                      />
                    ))}
                  </section>
                )}
                <label className="text-[13px] font-semibold">
                  추가 메모 · 선택사항
                  <textarea
                    aria-label="추가 메모"
                    className={`${field} mt-2 min-h-[120px] py-3 font-normal`}
                    value={entry.note}
                    onChange={(e) => update({ note: e.target.value })}
                    placeholder="선택한 버블과 태그를 보충하고 싶을 때만 남겨주세요."
                  />
                </label>
              </>
            )}
            {step === 4 && (
              <article className="rounded-[24px] bg-white p-5">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt="선택한 음식 사진"
                    className="mb-4 max-h-56 w-full rounded-xl object-cover"
                  />
                ) : original && entry.reflectionPhotoFilename ? (
                  <NativeRecordPhoto owner={owner} entry={entry} />
                ) : null}
                <p className="text-[12px] text-[var(--tb-color-text-hint)]">
                  {entry.restaurant || "식당 미기록"}
                </p>
                <h2 className="mt-2 text-[24px] font-bold">{entry.menu}</h2>
                <p className="mt-3 text-[14px]">
                  {entry.overallEvaluation?.responseLabelSnapshot ??
                    "음식 전체 미평가"}
                </p>
                <p className="mt-3 text-[12px] text-[var(--tb-color-text-hint)]">
                  {entry.mealTime?.source === "user_confirmed"
                    ? `식사일 ${dateInput(entry.mealTime.start)}`
                    : "식사일 미확인"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selections.map((s) => (
                    <span
                      key={sensorySelectionKey(s)}
                      className="rounded-full bg-[var(--tb-color-surface-muted)] px-3 py-2 text-[12px]"
                    >
                      {s.labelSnapshot}
                    </span>
                  ))}
                </div>
                {entry.note && (
                  <p className="mt-5 whitespace-pre-wrap text-[14px] leading-6">
                    {entry.note}
                  </p>
                )}
              </article>
            )}
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="px-5 py-3 text-[13px] text-red-700">
          {error}
        </p>
      )}
      {(step !== 2 || showWords) && (
        <footer
          className="shrink-0 bg-[var(--tb-color-bg-page)] p-5"
          style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            className="min-h-[52px] w-full rounded-full bg-black px-5 text-[14px] font-semibold text-white disabled:opacity-30"
            disabled={!canContinue || saving}
            onClick={step === 4 ? () => void save() : next}
          >
            {saving
              ? "저장 중"
              : step === 4
                ? "저장"
                : step === 1
                  ? "미각 버블 고르기"
                  : "다음"}
          </button>
          {step === 0 && !baseline && (
            <button
              type="button"
              className="mt-2 min-h-11 w-full text-[12px]"
              disabled={!canContinue || saving}
              onClick={() => void save("captured")}
            >
              사진·메뉴만 먼저 저장
            </button>
          )}
        </footer>
      )}
      {discard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-5">
          <div
            role="alertdialog"
            aria-label="기록 닫기 확인"
            className="w-full max-w-sm rounded-[24px] bg-white p-5"
          >
            <h2 className="text-[16px] font-bold">
              작성 중인 기록을 닫을까요?
            </h2>
            <p className="mt-2 text-[13px]">
              아직 저장하지 않은 변경은 반영되지 않아요.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                className="min-h-11 flex-1 rounded-full bg-[var(--tb-color-surface-muted)]"
                onClick={() => setDiscard(false)}
              >
                계속 작성
              </button>
              <button
                className="min-h-11 flex-1 rounded-full bg-black text-white"
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
