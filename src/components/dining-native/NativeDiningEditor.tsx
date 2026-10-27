import { NativeRecordPhoto } from "./NativeDiningHome";
import NativePhotoHints from "./NativePhotoHints";
import { useEffect, useMemo, useRef, useState } from "react";
import { SENSORY_V2, makeSensoryV2Presentation, makeSensoryV2Selection, sensoryV2Categories, sensoryV2Entry, sensoryV2MatchesQuery, sensorySelectionKey, validSensoryV2Presentation } from '../../lib/sensoryV2.mjs';
import SensoryProfileControls from './SensoryProfileControls';
import DishKindIcon from '../system/DishKindIcon';
import { Camera, X, Pencil, Clock3, MapPin, Plus } from "lucide-react";
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
  findTasteExperience,
  type TasteExperienceWord,
  type TasteMapViewportState,
} from "../reservation/DiningFeedbackFlow";
import SelectionCard from '../system/SelectionCard';
import PrimaryButton from '../system/PrimaryButton';
import BottomSheetShell, { BottomSheetCloseButton } from '../system/BottomSheetShell';
import { DrawerTitle, DrawerDescription } from '../ui/drawer';
import { getTasteTintSurface, getTasteTintSurfaceText, getTasteChipBorder } from '../../constants/tasteColors';
import { nativeOverallStar } from '../../lib/gastronomy/archiveMenuInsights';
import './native-dining.css';
import { DetailHeader } from "../gastronomy/TasteDataPage";
const titles = ["식후 피드백", "전체 평가", "미각 버블", "디테일", "기록 확인"];
const field =
  "min-h-11 w-full rounded-[14px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-3 text-[14px]";
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
  initialPhoto,
  owner,
  seed,
  meal,
  entries,
  onSave,
  onClose,
}: {
  original?: NativeRecord;
  initialPhoto?: File;
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
  const [manualMenu, setManualMenu] = useState(true);
  const [menuSelectionConfirmed, setMenuSelectionConfirmed] = useState(Boolean(original?.menu || seed?.menu));
  const [sourcePhoto, setSourcePhoto] = useState<File | null>(null);
  const [linkedBubbleID, setLinkedBubbleID] = useState<string | null>(null);
  const [supplement, setSupplement] = useState<'note' | 'date' | 'location' | null>(null);
  const [noteBeforeEdit, setNoteBeforeEdit] = useState('');
  const [customCategory, setCustomCategory] = useState<string | null>(null);
  const detailPhotoRef = useRef<HTMLInputElement>(null);
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
    if (!initialPhoto) return;
    let cancelled = false;
    setSourcePhoto(initialPhoto);
    setPhotoLoading(true);
    void jpeg(initialPhoto).then((blob) => {
      if (cancelled) return;
      const filename = `${crypto.randomUUID()}.jpg`;
      setPhoto({ filename, blob });
      setEntry((current) => ({ ...current, reflectionPhotoFilename: filename }));
    }).catch(() => {
      if (!cancelled) setError('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.');
    }).finally(() => { if (!cancelled) setPhotoLoading(false); });
    return () => { cancelled = true; };
  }, [initialPhoto]);
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
  const categoryPools = useMemo(() => sensoryV2Categories(presentation), [presentation]);
  const activeBubble = bubbles.find((bubble) => bubble.id === linkedBubbleID) ?? bubbles[0];
  const activeAxis = findTasteExperience(activeBubble?.id)?.axis;
  const activeTaste = ({ sweet: '단맛', sour: '신맛', salty: '짠맛', bitter: '쓴맛', umami: '감칠맛', fat: '지방맛' } as Record<string, string>)[activeAxis ?? ''] ?? '감칠맛';
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
  const scopedDetail = (id:string) => details.find(s=>s.id===id&&(sensoryV2Entry(id)?.bindingMode!=='modifier'||(s.relatedBubbleID??null)===(activeBubble?.id??null)));
  const toggleDetail = (id:string) => {
    const selected=scopedDetail(id);
    if(selected){remove(selected);return;}
    setSelections([...selections,makeSensoryV2Selection(id,{relatedBubble:activeBubble??null})]);
  };
  const addCustom = (family:string) => {
    const label=(customInputs[family]??'').trim();if(!label)return;
    const id=`custom:${family}:${label}`;
    if(!details.some(s=>s.id===id))setSelections([...selections,{id,type:'detailTag',catalogVersion:SENSORY_V2.version,definitionVersion:'custom/1',selectionInstanceID:crypto.randomUUID(),labelSnapshot:label,bindingMode:'independent',scopeKind:'whole_dish',target:'whole_dish',phase:'unspecified'}]);
    setCustomInputs(current=>({...current,[family]:''}));
  };
  const canContinue =
    step === 0
      ? !!entry.menu.trim() && menuSelectionConfirmed && !photoLoading
      : step === 1
        ? !!entry.overallEvaluation &&
          (!!DINING_OVERALL_RESPONSES[entry.overallEvaluation.responseValue] || nativeOverallStar(entry.overallEvaluation) !== null)
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
  const menuCandidates = [...new Map(entries.filter((candidate) => {
    if (!entry.restaurant.trim()) return false;
    return entry.restaurantID ? candidate.restaurantID === entry.restaurantID : !candidate.restaurantID && candidate.restaurant === entry.restaurant;
  }).map((candidate) => [candidate.menuItemID ?? candidate.menu, candidate])).values()].slice(0, 8);
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
      className={`fixed inset-0 z-[80] flex flex-col ${step === 3 ? "bg-[var(--tb-color-bg-focus)]" : "bg-[var(--tb-color-bg-page)]"}`}
      ref={shellRef}
      onKeyDown={(e) => {
        if (supplement === 'date' || supplement === 'location') return;
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
            title={step === 3 ? entry.menu : titles[step]}
            onBack={() => {
              if (!saving) {
                if (supplement) setSupplement(null);
                else if (step) setStep((n) => n - 1);
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
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[var(--tb-color-surface-base)]">
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
            className="absolute right-5 top-3 z-40 min-h-11 rounded-full bg-[var(--tb-color-surface-base)] px-4 text-[12px] shadow-sm"
            onClick={() => setShowWords(true)}
          >
            미각 단어 검색
          </button>
          <button
            type="button"
            className="absolute left-5 top-3 z-40 min-h-11 rounded-full bg-[var(--tb-color-surface-base)] px-4 text-[12px] shadow-sm"
            onClick={() => setStep(3)}
          >
            {bubbles.length ? `${bubbles.length}개 선택 · 다음` : '디테일만 기록'}
          </button>
        </div>
      ) : (
        <div
          ref={formRef}
          className={`min-h-0 flex-1 overflow-y-auto px-5 pb-8 ${step === 3 ? "pt-3" : "pt-4"}`}
        >
          <div className="mx-auto flex max-w-[560px] flex-col gap-6">
            {step === 0 && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-[18px] font-bold">어떤 메뉴를 먼저 기록할까요?</h2>
                  <p className="text-[13px] text-[var(--tb-color-text-subtle)]">가장 선명하게 기억나는 메뉴부터 선택해 주세요.</p>
                  {entry.restaurant && <p className="text-[12px] text-[var(--tb-color-text-muted)]">{entry.restaurant}</p>}
                </div>
                <div className="flex flex-col gap-3">
                  {menuCandidates.map((candidate) => <SelectionCard key={candidate.menuItemID ?? candidate.menu} title={candidate.menu} description="이 식당에서 기록한 메뉴" selected={!manualMenu && entry.menu === candidate.menu} className={!manualMenu && entry.menu === candidate.menu ? 'shadow-none' : 'border-transparent shadow-none'} onClick={() => {
                    setManualMenu(false); setMenuSelectionConfirmed(true);
                    update({ menu: candidate.menu, menuItemID: candidate.menuItemID ?? null, dishKindIDs: candidate.dishKindIDs ?? [] });
                  }} />)}
                  {!manualMenu && menuSelectionConfirmed && !menuCandidates.some((candidate) => candidate.menu === entry.menu) && <SelectionCard title={entry.menu} description="직접 입력한 메뉴" selected className="shadow-none" onClick={() => { setManualMenu(true); setMenuSelectionConfirmed(false); }} />}
                  <SelectionCard title="직접 입력" description="목록에 없는 메뉴도 미각 기록으로 남길 수 있어요." selected={manualMenu} className={manualMenu ? 'shadow-none' : 'border-transparent shadow-none'} onClick={() => setManualMenu(true)} />
                  {manualMenu && <div className="rounded-[20px] bg-[var(--tb-color-surface-card)] p-3">
                    <label className="text-[14px] font-semibold">메뉴 직접 입력
                      <div className="mt-3 flex gap-2"><input autoFocus={!initialPhoto} aria-label="메뉴 이름" className={`${field} min-w-0 flex-1`} value={entry.menu} onChange={(event) => { setMenuSelectionConfirmed(false); update({ menu: event.target.value, menuItemID: null }); }} onKeyDown={(event) => { if (event.key === 'Enter' && entry.menu.trim()) { event.preventDefault(); setMenuSelectionConfirmed(true); setManualMenu(false); } }} placeholder="예: 오미자와 배 디저트" />
                        <button type="button" disabled={!entry.menu.trim() || photoLoading} className="min-h-11 shrink-0 rounded-[14px] bg-[var(--tb-color-interaction-primary)] px-4 text-[12px] font-semibold text-[var(--tb-color-interaction-on-primary)] disabled:bg-[var(--tb-color-surface-disabled)] disabled:text-[var(--tb-color-text-disabled)]" onClick={() => { setMenuSelectionConfirmed(true); setManualMenu(false); }}>추가</button>
                      </div>
                    </label>
                  </div>}
                </div>
                <div className="flex flex-col gap-3">
                  <button type="button" className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-[var(--tb-color-surface-card)] p-3 text-left" onClick={() => setSupplement('date')}>
                    <span className="flex-1"><span className="block text-[12px] text-[var(--tb-color-text-secondary)]">식사일</span><span className="mt-1.5 block text-[16px] font-semibold">{entry.mealTime?.source === 'user_confirmed' && entry.mealTime.start != null ? dateInput(entry.mealTime.start) : '식사일 미확인'}</span></span><Clock3 size={18} className="text-[var(--tb-color-text-hint)]" />
                  </button>
                  <button type="button" className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-[var(--tb-color-surface-card)] p-3 text-left" onClick={() => setSupplement('location')}>
                    <span className="flex-1"><span className="block text-[12px] text-[var(--tb-color-text-secondary)]">식당 연결</span><span className="mt-1.5 block text-[16px] font-semibold">{entry.restaurant || '식당 미확인'}</span></span><MapPin size={18} className="text-[var(--tb-color-text-hint)]" />
                  </button>
                  <button type="button" aria-label="음식 사진 선택" className="flex min-h-16 items-center gap-3 rounded-[20px] bg-[var(--tb-color-surface-card)] p-3 text-left" onClick={() => detailPhotoRef.current?.click()}>
                    {photoURL ? <img src={photoURL} alt="선택한 음식 사진" className="size-12 rounded-[10px] object-cover" /> : original?.reflectionPhotoFilename ? <div className="size-12 overflow-hidden rounded-[10px]"><NativeRecordPhoto owner={owner} entry={entry} /></div> : <Camera size={24} className="text-[var(--tb-color-text-hint)]" />}
                    <span className="flex-1 text-[14px]">{photoLoading ? '사진 준비 중' : entry.reflectionPhotoFilename ? '사진 변경' : '사진 추가 · 선택사항'}</span><Plus size={18} />
                  </button>
                  {entry.reflectionPhotoFilename && <button type="button" className="min-h-11 self-start text-[12px] text-[var(--tb-color-text-hint)]" onClick={() => { setPhoto(undefined); setSourcePhoto(null); update({ reflectionPhotoFilename: entry.additionalPhotoFilenames?.[0] ?? null, additionalPhotoFilenames: entry.additionalPhotoFilenames?.slice(1) ?? [] }); }}>사진 제거</button>}
                </div>
                {sourcePhoto && <details className="rounded-[20px] bg-[var(--tb-color-surface-card)] p-3"><summary className="cursor-pointer text-[13px] font-semibold">사진에서 메뉴·식당 찾기</summary><div className="mt-3"><NativePhotoHints key={photo?.filename} file={sourcePhoto} onMenu={(menu) => { setManualMenu(true); setMenuSelectionConfirmed(false); update({ menu, menuItemID: null }); }} onRestaurant={(restaurantID, restaurant) => update({ restaurant, restaurantID, menuItemID: null, foodSource: { kind: 'restaurant', restaurantNamespace: 'kakao', version: 1 } })} /></div></details>}
                <details className="rounded-[20px] bg-[var(--tb-color-surface-card)] p-3">
                  <summary className="min-h-8 cursor-pointer text-[13px] font-semibold">음식 정보 · 선택사항</summary>
                  <div className="mt-3 flex flex-col gap-3">
                <details className="rounded-[18px] bg-[var(--tb-color-surface-base)] p-4">
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
                <details className="rounded-[18px] bg-[var(--tb-color-surface-base)] p-4">
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
                          className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3 text-[12px] ${dishKindIDs.includes(k.id) ? "border-[var(--tb-color-text-primary)] bg-[var(--tb-color-interaction-primary)] text-[var(--tb-color-interaction-on-primary)]" : "border-transparent bg-[var(--tb-color-surface-muted)]"}`}
                          onClick={() => update({ dishKindIDs: dishKindIDs.includes(k.id) ? dishKindIDs.filter((id) => id !== k.id) : [...dishKindIDs, k.id] })}
                        ><DishKindIcon id={k.id} /><span>{k.label}</span></button>)}
                      </div>
                    </div>;
                  })}
                </details>
                <SensoryProfileControls presentation={presentation} onChange={(profileSelection,flagOverrides)=>update({sensoryPresentation:makeSensoryV2Presentation({menu:entry.menu,dishKindIDs,profileSelection,flagOverrides})})}/>
                  </div>
                </details>
              </>
            )}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-[18px] font-bold">
                    이 음식은 전체적으로 어땠나요?
                  </h2>
                  <p className="mt-2 text-[13px] text-[var(--tb-color-text-hint)]">
                    가장 가까운 느낌을 골라주세요.
                  </p>
                </div>
                <div className="flex flex-col gap-[10px]">
                  {nativeOverallStar(entry.overallEvaluation) !== null && <p className="text-[13px] text-[var(--tb-color-text-subtle)]">현재 평가: {nativeOverallStar(entry.overallEvaluation)}점</p>}
                  {Object.entries(DINING_OVERALL_RESPONSES).map(([value, response]) => (
                    <SelectionCard key={value} title={response.label} singleLine indicator="radio"
                      selected={entry.overallEvaluation?.responseValue === value}
                      className={`h-[50px] py-0 shadow-none ${entry.overallEvaluation?.responseValue === value ? '' : 'border-transparent'}`}
                      onClick={() => update({ overallEvaluation: overallEvaluation(value) })} />
                  ))}
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
                      className={`min-h-[64px] rounded-full border px-3 text-[12px] ${bubbles.some((b) => b.id === c.id) ? "border-[var(--tb-color-text-primary)] bg-[var(--tb-color-interaction-primary)] text-[var(--tb-color-interaction-on-primary)]" : "border-transparent bg-[var(--tb-color-surface-base)]"}`}
                    >
                      {bubbles.find(b => b.id === c.id)?.labelSnapshot ?? c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 3 && (supplement === 'note' ? (
              <label className="text-[14px] font-semibold text-[var(--tb-color-text-secondary)]">추가 메모 · 선택사항
                <textarea autoFocus aria-label="추가 메모" className="mt-2 min-h-[176px] w-full rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)] p-3 text-[13px] font-normal outline-none" value={entry.note} onChange={(event) => update({ note: event.target.value })} placeholder="기억에 남는 맛과 상황을 적어 주세요." />
              </label>
            ) : (
              <div className="flex flex-col gap-7">
                <div className="flex min-h-[232px] flex-col items-center gap-4 py-2">
                  {activeBubble ? <>
                    <div className="flex size-44 flex-col items-center justify-center gap-2 rounded-full border px-5 text-center" style={{ background: getTasteTintSurface(activeTaste), color: getTasteTintSurfaceText(activeTaste), borderColor: getTasteChipBorder(activeTaste) }}>
                      <span className="text-[11px] font-semibold opacity-70">메인 미각</span>
                      <strong className="text-[17px] leading-[23px]">{activeBubble.labelSnapshot}</strong>
                    </div>
                    <div className="flex items-center gap-2" role="group" aria-label="선택한 미각">
                      {bubbles.map((bubble) => <button key={bubble.id} type="button" aria-label={bubble.labelSnapshot} aria-pressed={bubble.id === activeBubble.id} className={`size-6 rounded-full border ${bubble.id === activeBubble.id ? '' : 'opacity-40'}`} style={{ background: getTasteTintSurface(activeTaste), borderColor: getTasteChipBorder(activeTaste) }} onClick={() => setLinkedBubbleID(bubble.id)} />)}
                    </div>
                  </> : <div className="flex size-44 items-center justify-center rounded-full bg-[var(--tb-color-surface-muted)] px-5 text-center text-[17px] font-bold">음식의 디테일을<br />남겨주세요</div>}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] p-3">
                    <p className="min-w-0 flex-1 truncate text-[14px]">{entry.note || '추가 메모 또는 사진'}</p>
                    <button type="button" aria-label="추가 메모" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)]" onClick={() => { setNoteBeforeEdit(entry.note); setSupplement('note'); }}><Pencil size={16} strokeWidth={1.8} /></button>
                    <button type="button" aria-label="사진 추가" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)]" onClick={() => detailPhotoRef.current?.click()}><Camera size={16} strokeWidth={1.8} /></button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" aria-label="식사 날짜 수정" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] p-3 text-left text-[14px]" onClick={() => setSupplement('date')}><Clock3 size={16} className="shrink-0" /><span className="truncate">{entry.mealTime?.source === 'user_confirmed' && entry.mealTime.start != null ? dateInput(entry.mealTime.start) : '식사일 미확인'}</span></button>
                    <button type="button" aria-label="위치 수정" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] p-3 text-left text-[14px]" onClick={() => setSupplement('location')}><MapPin size={16} className="shrink-0" /><span className="truncate">{entry.restaurant || '위치 미확인'}</span></button>
                  </div>
                </div>
                {categoryPools.map((group) => <section key={group.id}>
                  <div className="mb-3 flex items-center justify-between"><h3 className="text-[14px] font-bold">{group.label}</h3><span className="text-[11px] text-[var(--tb-color-text-faint)]">선택사항</span></div>
                  <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button type="button" aria-label={`${group.label} 직접 입력`} className="flex size-9 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)]" onClick={() => setCustomCategory(customCategory === group.id ? null : group.id)}><Plus size={14} /></button>
                    {group.tags.map((tag) => { const selected = !!scopedDetail(tag.id); return <button type="button" key={tag.id} aria-pressed={selected} className="h-9 rounded-full border px-3 text-[12px]" style={{ background: selected ? getTasteTintSurface(activeTaste) : 'var(--tb-color-surface-muted)', color: selected ? getTasteTintSurfaceText(activeTaste) : 'var(--tb-color-text-subtle)', borderColor: selected ? getTasteChipBorder(activeTaste) : 'var(--tb-color-border-default)' }} onClick={() => toggleDetail(tag.id)}>{tag.label}</button>; })}
                    {details.filter((selection) => selection.id.startsWith(`custom:${group.id}:`)).map((selection) => <button type="button" key={sensorySelectionKey(selection)} aria-pressed="true" aria-label={`${selection.labelSnapshot} 선택 해제`} className="h-9 rounded-full border px-3 text-[12px]" style={{ background: getTasteTintSurface(activeTaste), color: getTasteTintSurfaceText(activeTaste), borderColor: getTasteChipBorder(activeTaste) }} onClick={() => remove(selection)}>{selection.labelSnapshot}</button>)}
                  </div>
                  {customCategory === group.id && <div className="mt-2 flex gap-2"><input autoFocus aria-label={`${group.label} 직접 입력`} className={field} placeholder="직접 입력" value={customInputs[group.id] ?? ''} onChange={(event) => setCustomInputs((values) => ({ ...values, [group.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustom(group.id); setCustomCategory(null); } }} /><button type="button" className="min-h-11 shrink-0 px-2 text-[12px]" onClick={() => { addCustom(group.id); setCustomCategory(null); }}>추가</button></div>}
                </section>)}
              </div>
            ))}
            {step === 4 && (
              <article className="rounded-[24px] bg-[var(--tb-color-surface-base)] p-5">
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
        <footer className="native-dining-flow-footer shrink-0" style={step === 3 ? { background: 'linear-gradient(transparent, var(--tb-color-bg-focus) 40%)' } : undefined}>
          {step === 1 && !canContinue && <p className="mb-2 text-center text-[11px] text-[var(--tb-color-text-faint)]">전체 평가를 하나 선택해 주세요.</p>}
          {step === 3 && <p className="mb-2 text-center text-[11px] text-[var(--tb-color-text-faint)]">태그를 고르지 않아도 미각 인상은 저장됩니다.</p>}
          <div className="flex gap-2">
            {step === 3 && supplement === 'note' && <button type="button" className="min-h-12 flex-1 rounded-[12px] border border-[var(--tb-color-border-default)] text-[14px]" onClick={() => { update({ note: noteBeforeEdit }); setSupplement(null); }}>취소하기</button>}
            <PrimaryButton className={step === 3 && supplement === 'note' ? 'flex-1' : ''} disabled={!canContinue || saving} onClick={step === 4 ? () => void save() : step === 3 && supplement === 'note' ? () => setSupplement(null) : next}>
              {saving ? '저장 중' : step === 4 ? '저장' : step === 1 ? '미각 버블 고르기' : step === 3 ? supplement === 'note' ? '계속하기' : '완료' : step === 0 ? '취향까지 기록' : '다음'}
            </PrimaryButton>
          </div>
          {step === 0 && !baseline && <button type="button" className="mt-2 min-h-11 w-full text-[12px]" disabled={!canContinue || saving} onClick={() => void save('captured')}>사진·메뉴만 먼저 저장</button>}
        </footer>
      )}
      <input ref={detailPhotoRef} aria-label="디테일 사진" type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (event) => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        setPhotoLoading(true);
        try { const blob = await jpeg(file); if (!alive.current) return; const filename = `${crypto.randomUUID()}.jpg`; setPhoto({ filename, blob }); setSourcePhoto(file); update({ reflectionPhotoFilename: filename }); }
        catch { setError('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.'); }
        finally { if (alive.current) setPhotoLoading(false); }
      }} />
      <BottomSheetShell open={supplement === 'date' || supplement === 'location'} onOpenChange={(open) => { if (!open) setSupplement(null); }} contentClassName="!z-[90]" overlayClassName="!z-[89]" headerStart={<BottomSheetCloseButton />} headerCenter={<DrawerTitle className="text-[15px] font-bold">{supplement === 'date' ? '식사 날짜' : '위치'}</DrawerTitle>}>
        <DrawerDescription className="sr-only">확인한 식사 날짜와 식당만 기록에 반영합니다.</DrawerDescription>
        <div className="flex flex-col gap-4 px-5 pb-8">
          {supplement === 'date' ? <label className="text-[14px]">확인한 식사일<input type="date" aria-label="확인한 식사일" className={`${field} mt-2`} max={dateInput(swiftTime())} value={entry.mealTime?.source === 'user_confirmed' ? dateInput(entry.mealTime.start) : ''} onChange={(event) => update({ mealTime: event.target.value ? { source: 'user_confirmed', start: swiftTime(new Date(event.target.value + 'T00:00:00')), confirmedAt: swiftTime() } : { source: 'unknown' } })} /><span className="mt-2 block text-[12px] text-[var(--tb-color-text-hint)]">날짜를 모르면 비워두세요.</span></label>
            : <>
              <label className="text-[14px]">식당 이름<div className="mt-2 flex gap-2"><input aria-label="기록 위치" className={`${field} min-w-0 flex-1`} value={entry.restaurant} onChange={(event) => { request.current++; setPlaces([]); setSearching(false); update({ restaurant: event.target.value, restaurantID: null, menuItemID: null, foodSource: entry.foodSource ? { ...entry.foodSource, restaurantPlace: null } : entry.foodSource }); }} /><button type="button" disabled={searching || !entry.restaurant.trim()} className="shrink-0 rounded-[14px] bg-[var(--tb-color-surface-muted)] px-3 text-[12px]" onClick={lookup}>{searching ? '검색 중' : '식당 찾기'}</button></div></label>
              {places.map((place) => <button type="button" key={place.placeId} className="rounded-[20px] bg-[var(--tb-color-surface-muted)] p-3 text-left" onClick={() => { if (!place.placeId || !place.name) return; update({ restaurant: place.name, restaurantID: place.placeId, menuItemID: null, foodSource: {kind:'restaurant',restaurantNamespace:'kakao',version:1,restaurantPlace:{name:place.name,address:place.roadAddress ?? place.address ?? '',kakaoPlaceID:place.placeId,latitude:place.lat,longitude:place.lng,phone:place.phone}} });setPlaces([]);setPlaceMessage('확인한 식당에 연결했어요.'); }}><span className="text-[14px] font-semibold">{place.name}</span><span className="mt-1 block text-[12px] text-[var(--tb-color-text-hint)]">{place.roadAddress ?? place.address}</span></button>)}
              {placeMessage && <p role="status" className="text-[12px] text-[var(--tb-color-text-hint)]">{placeMessage}</p>}
            </>}
          <PrimaryButton onClick={() => setSupplement(null)}>확인</PrimaryButton>
        </div>
      </BottomSheetShell>
      {discard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-5">
          <div
            role="alertdialog"
            aria-label="기록 닫기 확인"
            className="w-full max-w-sm rounded-[24px] bg-[var(--tb-color-surface-base)] p-5"
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
                className="min-h-11 flex-1 rounded-full bg-[var(--tb-color-interaction-primary)] text-[var(--tb-color-interaction-on-primary)]"
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
