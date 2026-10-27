import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Menu,
  Search,
  X,
} from "lucide-react";
import {
  BASE,
  PLATING_FIGMA,
  components,
  docs,
  librarySections,
  navGroups,
  references,
  type CatalogComponent,
  type DocPage,
  type LibraryEntry,
} from "./catalog";
import { componentLocation, libraryAreas, type LibraryArea } from "./catalogNavigation";
import assets from "./assets.json";
import figmaMap from "./figma-map.json";
import ComponentReview from "./ComponentReview";
import CalloutReview from "./CalloutReview";
import { nativeVisualSections } from "./NativeVisualDocumentation";
import MediaPlayer, { type BrandAsset } from "./MediaPlayer";
import "./plating.css";
import PlatingHome from "./PlatingHome";
import PlatingCursor from "./PlatingCursor";
import ComponentReference from "./ComponentReference";
import { componentExampleCode } from "./componentExampleCode";
import {
  componentDocumentation,
  defaultPreviewOptions,
  statePreviewOptions,
} from "./componentDocumentation";
import "./component-reference.css";
import NativeComponentReference, {
  NativeComponentThumbnail,
} from "./NativeComponentReference";
import Accordion, { AccordionItem, AccordionTrigger } from "../components/system/plating/Accordion";
import {
  nativeComponentAudit,
  nativeAuditKindLabels,
} from "./nativeComponentAudit";
import { FoundationIntro, FoundationSection } from "./FoundationReference";
import { ColorModeProvider } from "./ColorModeReference";
const MotionSection = lazy(
  () => import("../components/design-system/PlatingMotionSection"),
);
const ComponentPreview = lazy(() => import("./ComponentPreview"));
const AdditionalPreview = lazy(() => import("./AdditionalPreview"));
const ComponentGuidelines = lazy(() => import("./ComponentGuidelines"));
const SheetPresentation = lazy(() => import("./SheetPresentation"));
const SummaryCardExamples = lazy(() => import("./SummaryCardExamples"));
const Legacy = lazy(() => import("../pages/DesignSystemPage"));
const rootSource = "/Users/sinjunho/Desktop/Taste Buddy/";
const map = figmaMap as {
  components: Record<string, string>;
  pages: Record<string, string>;
  verification: string;
};
function figmaURL(id?: string) {
  return id
    ? `${PLATING_FIGMA}?node-id=${id.replace(":", "-")}`
    : PLATING_FIGMA;
}
function navigate(href: string) {
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
function Link({
  href = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (
          !e.defaultPrevented &&
          href.startsWith(BASE) &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          e.button === 0
        ) {
          e.preventDefault();
          navigate(href);
        }
      }}
    >
      {children}
    </a>
  );
}
function route() {
  let path = window.location.pathname.replace(/\/+$/, "");
  if ([BASE + "/components/segmented-control", BASE + "/components/period-tabs"].includes(path)) {
    path = BASE + "/components/capsule-tabs";
    window.history.replaceState({}, "", path + window.location.search + window.location.hash);
  }
  if (path === BASE + "/components/input-button") {
    path = BASE + "/components/select";
    window.history.replaceState({}, "", path + window.location.search + window.location.hash);
  }
  if (path === BASE + "/components/toggle-action") {
    path = BASE + "/components/icon-action-button";
    window.history.replaceState({}, "", path + window.location.search + window.location.hash);
  }
  if (path === BASE + "/components/tag-group") {
    path = BASE + "/components/chip-group";
    window.history.replaceState({}, "", path + window.location.search + window.location.hash);
  }
  if (path === BASE + "/foundations/layout") {
    const movedSections: Record<string, string> = {
      "#spacing": "spacing",
      "#shape": "radius",
      "#layers": "elevation",
      "#responsive": "layout#safe-area",
    };
    const destination = movedSections[window.location.hash];
    if (destination) {
      window.history.replaceState({}, "", BASE + "/foundations/" + destination);
      path = window.location.pathname;
    }
  }
  if (path === BASE && window.location.hash) {
    const hash = window.location.hash.slice(1);
    if (hash === "pl-main") return "";
    if (hash === "motion") return "motion";
    if (["colors", "typography", "layout"].includes(hash))
      return `foundations/${hash}`;
    return "legacy";
  }
  return path.startsWith(BASE)
    ? path.slice(BASE.length).replace(/^\//, "")
    : "";
}
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      className="pl-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setError(false);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1800);
        } catch {
          setError(true);
        }
      }}
      aria-label={copied ? "복사됨" : "코드 복사"}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span>
        {error ? "직접 선택해 복사해 주세요" : copied ? "복사됨" : "복사"}
      </span>
    </button>
  );
}
function SourceLink({ path }: { path: string }) {
  return (
    <a className="pl-source" href={`vscode://file/${rootSource}${path}`}>
      {path}
      <ArrowUpRight size={13} />
    </a>
  );
}
function Heading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <header className="pl-page-heading">
      <p className="pl-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="pl-lead">{intro}</p>
    </header>
  );
}
function Tag({ children }: { children: ReactNode }) {
  return <span className="pl-tag">{children}</span>;
}

export default function PlatingSite() {
  const [slug, setSlug] = useState(route);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const main = useRef<HTMLElement>(null);
  const sidebarContainer = useRef<HTMLElement>(null);
  useEffect(() => {
    if (slug === "legacy") return;
    document.documentElement.classList.add("plating-document");
    return () => document.documentElement.classList.remove("plating-document");
  }, [slug]);
  useEffect(() => {
    const onRoute = (event: Event) => {
      if (event.type === "hashchange" && window.location.pathname !== BASE)
        return;
      setSlug(route());
      setMenuOpen(false);
      setSearchOpen(false);
      if (!window.location.hash || window.location.pathname === BASE)
        window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        main.current?.focus({ preventScroll: true });
        if (window.location.pathname !== BASE && window.location.hash) {
          document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: "start" });
        }
      });
    };
    window.addEventListener("popstate", onRoute);
    window.addEventListener("hashchange", onRoute);
    return () => {
      window.removeEventListener("popstate", onRoute);
      window.removeEventListener("hashchange", onRoute);
    };
  }, []);
  useEffect(() => {
    if (window.location.pathname !== BASE && window.location.hash)
      requestAnimationFrame(() =>
        document
          .getElementById(decodeURIComponent(window.location.hash.slice(1)))
          ?.scrollIntoView({ block: "start" }),
      );
  }, [slug]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const selectedComponent = components.find(
    (v) => `components/${v.id}` === slug || (slug === "components/inline-text-button" && v.id === "inline-button"),
  );
  const selectedDoc = docs.find((v) => v.slug === (slug === "components/action-area" ? "patterns/flow-step" : slug));
  const selectedCollection = libraryAreas.find((area) => area.entry === slug);
  const selectedAsset = assets.find((v) => `brand-assets/${v.id}` === slug);
  useEffect(() => {
    document.title = `${slug === "review/callout" ? "콜아웃 비교" : slug === "review/disclosure" ? "아코디언 비교" : selectedComponent?.korean || selectedDoc?.title || selectedCollection?.label || selectedAsset?.title || "플레이팅"} · Plating`;
  }, [slug, selectedComponent, selectedDoc, selectedCollection, selectedAsset]);
  const allResults = useMemo(
    () => [
      ...libraryAreas.map((area) => ({ title: area.label, detail: "목차", slug: area.entry, text: area.intro })),
      ...docs.map((d) => ({
        title: d.title,
        detail: d.eyebrow,
        slug: d.slug,
        text: d.intro + " " + d.sections.map((s) => s.body).join(" "),
      })),
      ...components.map((c) => ({
        title: `${c.name} · ${c.korean}`,
        detail: `${componentLocation(c.id).areaLabel} · ${componentLocation(c.id).category}`,
        slug: `components/${c.id}`,
        text: c.purpose + " " + c.usage,
      })),
      ...assets.map((a) => ({
        title: a.title,
        detail: "브랜드 에셋",
        slug: `brand-assets/${a.id}`,
        text: a.composition + " " + a.description,
      })),
    ],
    [],
  );
  const results = allResults
    .filter((v) =>
      (v.title + " " + v.detail + " " + v.text)
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    )
    .slice(0, 12);
  const activeSlug = selectedComponent ? `components/${selectedComponent.id}` : selectedDoc?.slug ?? slug;
  const activeNavGroup = navGroups.find(
    (group) =>
      group.items.some(([path]) => path === activeSlug) ||
      (group.id === "assets" && slug.startsWith("brand-assets/")),
  );
  const sidebarGroup = activeNavGroup ?? navGroups[0];
  useEffect(() => {
    sidebarContainer.current?.scrollTo(0, 0);
  }, [sidebarGroup.id]);
  const sidebarItems =
    sidebarGroup.id === "assets" && slug.startsWith("brand-assets")
      ? [
          ...sidebarGroup.items,
          ...assets.map(({ id, title }) => [`brand-assets/${id}`, title]),
        ]
      : sidebarGroup.items;
  const navigationLabel = sidebarGroup.label;
  const groupedSidebarPaths = new Set(sidebarGroup.sections?.flatMap((section) => section.items.map(([path]) => path)));
  const sidebarLink = ([path, label]: string[]) => (
    <Link href={`${BASE}/${path}`} aria-current={activeSlug === path ? "page" : undefined} key={path}>
      {label}
    </Link>
  );
  const sectionLinks = navGroups.map((group) => (
    <Link
      href={`${BASE}/${group.entry}`}
      aria-current={activeNavGroup?.id === group.id ? "true" : undefined}
      key={group.id}
    >
      {group.label}
    </Link>
  ));
  const sidebar = (
    <nav aria-label={`${navigationLabel} 탐색`}>
      <div className="pl-nav-group" key={sidebarGroup.id}>
        <p>{sidebarGroup.label}</p>
        {sidebarItems.filter(([path]) => !groupedSidebarPaths.has(path)).map(sidebarLink)}
      </div>
      {sidebarGroup.sections?.map((section) => (
        <div className="pl-nav-group" key={section.label}>
          <p>{section.label}</p>
          {section.items.map(sidebarLink)}
        </div>
      ))}
    </nav>
  );
  if (slug === "review/disclosure") return <ComponentReview />;
  if (slug === "review/callout") return <CalloutReview />;
  if (slug === "legacy")
    return (
      <Suspense fallback={<p>이전 플레이그라운드를 불러오고 있어요.</p>}>
        <Legacy />
      </Suspense>
    );
  const isHome = !slug;
  const toc =
    selectedCollection ? [
      { id: "catalog-index", title: "분류와 검색" },
      { id: "catalog-results", title: "문서 목차" },
    ] : selectedComponent?.id === "disclosure" ? [
      { id: "preview", title: "아코디언 미리보기" },
      { id: "anatomy", title: "구조" },
      { id: "properties", title: "속성" },
      { id: "variants", title: "펼침 방식과 배치" },
      { id: "sizes", title: "크기" },
      { id: "states", title: "접힘·펼침·본문 형식" },
      { id: "slots", title: "콘텐츠 슬롯" },
      { id: "sources", title: "소스와 연결" },
    ] : (selectedDoc || selectedComponent)
      ? [
          ...(selectedDoc?.sections.map((v) => ({
            id: v.id,
            title: v.title,
          })) ?? [
            ...(selectedComponent?.id === "bottom-sheet" ? [{ id: "sheet-presentation", title: "시트와 배경 카드" }] : []),
            ...((selectedComponent?.id === "mini-area-chart" || selectedComponent?.id === "mini-treemap-chart" || selectedComponent?.id === "mini-bubble-chart" || selectedComponent?.id === "pie-donut-chart" || selectedComponent?.id === "mini-stacked-bar-chart")
              ? [{ id: "web-preview", title: "차트 미리보기" }]
              : [{ id: "native-audit", title: "iOS 대조 결과" }, { id: "preview", title: "실제 iOS 렌더" }]),
            ...(selectedComponent?.guide?.platform === "ios"
              ? [
                  { id: "anatomy", title: "iOS 구조와 속성" },
                  ...nativeVisualSections(selectedComponent.id),
                  { id: "states", title: "상태와 조합" },
                ]
              : selectedComponent && nativeComponentAudit[selectedComponent.id]
                ? [
                    { id: "anatomy", title: "iOS 구조" },
                    { id: "properties", title: "iOS 속성" },
                    ...nativeVisualSections(selectedComponent.id),
                    { id: "states", title: "iOS 상태" },
                  ]
                : selectedComponent?.guide
                  ? [
                      { id: "anatomy", title: "구조와 속성" },
                      { id: "states", title: "상태와 조합" },
                    ]
                  : []),
            { id: "usage", title: "사용 규칙" },
            {
              id: "specs",
              title: selectedComponent?.guide
                ? "토큰·플랫폼 규격"
                : "구조와 규격",
            },
            { id: "access", title: "인터랙션·접근성" },
            { id: "sources", title: "소스와 연결" },
          ]),
        ]
      : [];
  return (
    <div className="plating-site" data-theme={isHome ? "light" : "dark"}>
      <PlatingCursor />
      <a className="pl-skip" href="#pl-main">
        본문으로 건너뛰기
      </a>
      <header className="pl-header">
        <Link href={BASE} className="pl-brand" aria-label="플레이팅 홈">
          <img src="/plating/symbol.svg" alt="" />
          <span>
            Plating<span className="pl-brand-dot">.</span>
          </span>
          <small>TASTE BUDDY</small>
        </Link>
        <nav className="pl-topnav" aria-label="전역 탐색">
          {sectionLinks}
        </nav>
        <div className="pl-header-actions">
          <DialogPrimitive.Root open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogPrimitive.Trigger asChild>
              <button className="pl-search-trigger" aria-label="검색">
                <Search size={17} />
                <span>검색</span>
                <kbd>⌘ K</kbd>
              </button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="pl-global-overlay" />
              <DialogPrimitive.Content
                className={`pl-search-modal ${isHome ? "" : "pl-theme-dark"}`}
              >
                <DialogPrimitive.Title className="pl-sr">
                  플레이팅 검색
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="pl-sr">
                  컴포넌트, 토큰, 문서와 브랜드 에셋을 검색해요.
                </DialogPrimitive.Description>
                <div className="pl-search-input">
                  <Search size={21} />
                  <input
                    autoFocus
                    placeholder="무엇을 찾고 있나요?"
                    aria-label="검색어"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <DialogPrimitive.Close aria-label="검색 닫기">
                    <X size={20} />
                  </DialogPrimitive.Close>
                </div>
                <div className="pl-search-results">
                  <p role="status">
                    {query ? `${results.length}개 결과` : "자주 찾는 문서"}
                  </p>
                  {results.length ? (
                    results.map((r) => (
                      <Link href={`${BASE}/${r.slug}`} key={r.slug}>
                        <span>
                          {r.title}
                          <small>{r.detail}</small>
                        </span>
                        <ArrowUpRight size={18} />
                      </Link>
                    ))
                  ) : (
                    <div className="pl-search-empty">
                      결과가 없어요. 다른 이름으로 찾아보세요.
                      <button onClick={() => setQuery("")}>
                        검색어 지우기
                      </button>
                    </div>
                  )}
                </div>
                <footer>Tab으로 이동 · Enter로 열기 · Esc로 닫기</footer>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
          <a
            className="pl-figma-top"
            href={PLATING_FIGMA}
            target="_blank"
            rel="noreferrer"
          >
            Figma
            <ArrowUpRight size={15} />
          </a>
          <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogPrimitive.Trigger asChild>
              <button className="pl-menu-trigger" aria-label="탐색 메뉴 열기">
                <Menu size={22} />
              </button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="pl-global-overlay" />
              <DialogPrimitive.Content
                className={`pl-mobile-menu ${isHome ? "" : "pl-theme-dark"}`}
              >
                <DialogPrimitive.Title>
                  플레이팅 {navigationLabel}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="pl-sr">
                  영역을 바꾸거나 현재 영역의 문서를 선택하세요.
                </DialogPrimitive.Description>
                <DialogPrimitive.Close
                  className="pl-menu-close"
                  aria-label="탐색 메뉴 닫기"
                >
                  <X size={22} />
                </DialogPrimitive.Close>
                <nav className="pl-mobile-sections" aria-label="영역 선택">
                  {sectionLinks}
                </nav>
                {sidebar}
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </header>
      {isHome ? (
        <main id="pl-main" ref={main} tabIndex={-1}>
          <HomePage />
        </main>
      ) : (
        <div className="pl-doc-shell">
          <aside className="pl-sidebar" ref={sidebarContainer}>
            {sidebar}
            <div className="pl-sidebar-bottom">
              <span className="pl-status-dot" /> Plating v1{" "}
              <small>2026.09</small>
            </div>
          </aside>
          <main id="pl-main" ref={main} tabIndex={-1} className="pl-document">
            <div className="pl-breadcrumb">
              <Link href={BASE}>Plating</Link>
              <span>/</span>
              <Link href={`${BASE}/${sidebarGroup.entry}`}>{sidebarGroup.label}</Link>
            </div>
            {selectedComponent ? (
              <ComponentPage
                key={selectedComponent.id}
                component={selectedComponent}
              />
            ) : selectedDoc ? (
              <Documentation page={selectedDoc} />
            ) : selectedCollection ? (
              <ComponentGallery key={selectedCollection.id} area={selectedCollection} />
            ) : slug === "brand-assets" ? (
              <AssetGallery />
            ) : selectedAsset ? (
              <AssetPage asset={selectedAsset} />
            ) : slug === "audit" ? (
              <AuditPage />
            ) : (
              <>
                <Heading
                  eyebrow="NOT FOUND"
                  title="이 문서를 찾지 못했어요"
                  intro="주소를 확인하거나 Plating의 분류와 목차에서 다시 찾아보세요."
                />
                <Link className="pl-dark-link" href={`${BASE}/getting-started#structure`}>
                  전체 목차 보기
                  <ArrowRight size={18} />
                </Link>
              </>
            )}
            <footer className="pl-doc-footer">
              <img src="/plating/symbol.svg" alt="" />
              <span>경험을 담고, 의미를 드러내요.</span>
              <Link href={`${BASE}/governance`}>운영과 변경 이력 ↗</Link>
            </footer>
          </main>
          <aside className="pl-toc">
            <p>이 페이지에서</p>
            {toc.map((v) => (
              <a key={v.id} href={`#${v.id}`}>
                {v.title}
              </a>
            ))}
            <a
              className="pl-toc-source"
              href={figmaURL(selectedCollection?.figmaNodeId ?? selectedDoc?.figmaNodeId ?? libraryAreas.find((area) => area.id === activeNavGroup?.id)?.figmaNodeId)}
              target="_blank"
              rel="noreferrer"
            >
              Figma 라이브러리 ↗
            </a>
          </aside>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  return <PlatingHome />;
}

function ComponentTile({ component: c }: { component: CatalogComponent }) {
  return (
    <Link href={`${BASE}/components/${c.id}`} className="pl-component-tile">
      <div
        className="pl-component-thumbnail"
        aria-hidden="true"
        ref={(node) => {
          if (node) node.inert = true;
        }}
      >
        {c.id === "disclosure" ? <Accordion>{[1, 2, 3].map(index => <AccordionItem key={index} value={`item-${index}`}><AccordionTrigger title={`헤더 타이틀 ${index}`} /></AccordionItem>)}</Accordion> : <NativeComponentThumbnail id={c.id} label={c.korean} />}
      </div>
      <div className="pl-tile-label">
        <div>
          <h3>{c.name}</h3>
          <span>{c.korean}</span>
        </div>
        <ArrowUpRight size={18} />
      </div>
    </Link>
  );
}
function LibraryEntryTile({ entry }: { entry: LibraryEntry }) {
  if (entry.component) return <ComponentTile component={entry.component} />;
  return (
    <Link href={`${BASE}/${entry.slug}`} className="pl-component-tile pl-reference-tile">
      <div className="pl-reference-summary">
        <Tag>{entry.reference ? "원본·소스 안내" : "사용 패턴"}</Tag>
        <p>{entry.purpose}</p>
      </div>
      <div className="pl-tile-label">
        <div><h3>{entry.name}</h3><span>{entry.reference?.korean ?? "패턴 문서"}</span></div>
        <ArrowUpRight size={18} />
      </div>
    </Link>
  );
}

function ComponentGallery({ area }: { area: LibraryArea }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("전체");
  const [scope, setScope] = useState("전체");
  const sections = librarySections(area);
  const foundSections = sections
    .filter((section) => group === "전체" || section.id === group)
    .map((section) => ({ ...section, entries: section.entries.filter((entry) =>
      (scope === "전체" || nativeComponentAudit[entry.id]?.kind === scope) &&
      `${entry.name} ${entry.component?.korean ?? entry.reference?.korean ?? ""} ${entry.purpose}`.toLowerCase().includes(query.trim().toLowerCase()),
    ) }))
    .filter((section) => section.entries.length > 0);
  const foundCount = foundSections.reduce((total, section) => total + section.entries.length, 0);
  return (
    <>
      <Heading
        eyebrow={area.label.toUpperCase()}
        title={area.label}
        intro={area.intro}
      />
      <div className="pl-gallery-tools" id="catalog-index">
        <label className="pl-filter-search">
          <Search size={18} />
          <input
            aria-label={`${area.label} 문서 검색`}
            placeholder="이 영역에서 문서 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {area.id !== "patterns" && <select
          aria-label="구현 범위"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="전체">전체 문서</option>
          {Object.entries(nativeAuditKindLabels).map(([kind, label]) => (
            <option key={kind} value={kind}>
              {label}
            </option>
          ))}
        </select>}
      </div>
      <div className="pl-filter-tabs" role="group" aria-label={`${area.label} 분류`}>
        {[{ id: "전체", label: "전체" }, ...sections].map((section) => (
          <button
            key={section.id}
            aria-pressed={group === section.id}
            onClick={() => setGroup(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
      <p className="pl-result-count" role="status">
        {foundCount}개 목차 항목
      </p>
      <div id="catalog-results">
      {foundCount ? (
        foundSections.map((section) => (
          <section className="pl-doc-section pl-catalog-section" key={section.id}>
            <h2>{section.label}</h2>
            <div className="pl-component-grid">
              {section.entries.map((entry) => <LibraryEntryTile key={entry.id} entry={entry} />)}
            </div>
          </section>
        ))
      ) : (
        <div className="pl-empty">
          <h2>찾는 문서가 없어요</h2>
          <button
            onClick={() => {
              setQuery("");
              setGroup("전체");
              setScope("전체");
            }}
          >
            검색과 필터 지우기
          </button>
        </div>
      )}
      </div>
    </>
  );
}
function ComponentPage({ component: c }: { component: CatalogComponent }) {
  const location = componentLocation(c.id);
  const isAccordion = c.id === "disclosure";
  const isCapsuleTabs = c.id === "capsule-tabs";
  const isChipFamily = c.id === "chip-group" || c.id === "chip";
  const isMiniChart = c.id === "mini-chart" || c.id === "mini-line-chart" || c.id === "mini-area-chart" || c.id === "mini-treemap-chart" || c.id === "mini-bubble-chart" || c.id === "pie-donut-chart" || c.id === "mini-stacked-bar-chart";
  const hasLiveExample = c.id === "inline-button" || isAccordion || isCapsuleTabs || isChipFamily || isMiniChart || c.id === "tcs-badge";
  const details = componentDocumentation[c.id];
  const audit = nativeComponentAudit[c.id];
  const [showWebReference, setShowWebReference] = useState(hasLiveExample);
  useEffect(() => { if (hasLiveExample) setShowWebReference(true); }, [hasLiveExample]);
  const [state, setState] = useState(c.states[0]);
  const [label, setLabel] = useState("");
  const [options, setOptions] = useState(() => ({
    ...defaultPreviewOptions(c.id),
    ...statePreviewOptions(c.id, c.states[0]),
  }));
  const [resetKey, setResetKey] = useState(0);
  const [tab, setTab] = useState("프리뷰");
  const exampleCode = details
    ? componentExampleCode(c, options, state, label)
    : c.code;
  const changeState = (next: string) => {
    setState(next);
    setOptions((value) => ({ ...value, ...statePreviewOptions(c.id, next) }));
  };
  return (
    <>
      <Heading
        eyebrow={`${location.areaLabel.toUpperCase()} / ${location.category}`}
        title={c.name}
        intro={c.purpose}
      />
      <div className="pl-meta-row">
        <Tag>{c.korean}</Tag>
        <Tag>{isAccordion || c.id === "mini-area-chart" || c.id === "mini-treemap-chart" || c.id === "mini-bubble-chart" || c.id === "pie-donut-chart" || c.id === "mini-stacked-bar-chart" ? "라이브러리 컴포넌트" : audit ? nativeAuditKindLabels[audit.kind] : "규격 재현"}</Tag>
        <a
          href={figmaURL(map.components[c.id])}
          target="_blank"
          rel="noreferrer"
        >
          Figma 참고
          <ArrowUpRight size={15} />
        </a>
      </div>
      {c.id === "bottom-sheet" && <Suspense fallback={null}><SheetPresentation /></Suspense>}
      {!isAccordion && <NativeComponentReference component={c} />}
      <details
        className="pl-web-archive"
        open={hasLiveExample ? showWebReference : undefined}
        onToggle={(event) => setShowWebReference(event.currentTarget.open)}
      >
        <summary>{c.id === "inline-button" ? "인라인 버튼 구성과 상태" : c.id === "tcs-badge" ? "TCS 배지 · Light / Dark" : c.id === "pie-donut-chart" ? "파이 도넛 차트 예시" : isMiniChart ? "공통 미니 그래프와 카드 적용 예시" : isAccordion ? "아코디언 구조와 동작" : isCapsuleTabs ? "공통 CapsuleTabs 예제" : isChipFamily ? "칩 구성과 동작" : "기존 웹 구현 참고"}</summary>
        {showWebReference && (
          <>
            <section id={isAccordion ? "preview" : "web-preview"} className="pl-playground">
              <div
                className="pl-preview-tabs"
                role="tablist"
                aria-label="예제 보기"
              >
                {["프리뷰", "코드"].map((t) => (
                  <button
                    key={t}
                    id={`${c.id}-${t}`}
                    role="tab"
                    aria-selected={tab === t}
                    aria-controls={`${c.id}-panel`}
                    tabIndex={tab === t ? 0 : -1}
                    onClick={() => setTab(t)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                        e.preventDefault();
                        const next = t === "프리뷰" ? "코드" : "프리뷰";
                        setTab(next);
                        document.getElementById(`${c.id}-${next}`)?.focus();
                      }
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div
                id={`${c.id}-panel`}
                role="tabpanel"
                aria-labelledby={`${c.id}-${tab}`}
                tabIndex={0}
              >
                {tab === "프리뷰" ? (
                  <div className="pl-live-stage">
                    <Suspense fallback={<p>프리뷰를 불러오고 있어요.</p>}>
                      <ComponentPreview
                        key={resetKey}
                        component={c}
                        state={state}
                        label={label}
                        options={options}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <div className="pl-code">
                    <CopyButton value={exampleCode} />
                    <pre>
                      <code>{exampleCode}</code>
                    </pre>
                  </div>
                )}
              </div>
              <div className="pl-controls">
                <label>
                  시작 상태
                  <select
                    aria-label="시작 상태"
                    value={state}
                    onChange={(e) => changeState(e.target.value)}
                  >
                    {c.states.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                {details?.properties
                  .filter((property) => property.control !== false)
                  .map((property) => (
                    <label key={property.key}>
                      {property.title}
                      <select
                        aria-label={property.title}
                        data-preview-control={property.key}
                        value={options[property.key]}
                        onChange={(e) => {
                          const selected = property.options.find(
                            (option) => option.value === e.target.value,
                          );
                          if (selected?.previewState)
                            changeState(selected.previewState);
                          setOptions((value) => ({
                            ...value,
                            [property.key]: e.target.value,
                          }));
                        }}
                      >
                        {property.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                <label>
                  문구
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="기본 문구"
                  />
                </label>
                <button
                  type="button"
                  className="pl-preview-reset"
                  onClick={() => {
                    setState(c.states[0]);
                    setLabel("");
                    setOptions({
                      ...defaultPreviewOptions(c.id),
                      ...statePreviewOptions(c.id, c.states[0]),
                    });
                    setResetKey((value) => value + 1);
                  }}
                >
                  초기화
                </button>
              </div>
            </section>
            <p className="pl-preview-note">
              {isChipFamily
                ? "Chip과 ChipGroup을 사용하는 공통 예제입니다. 문서에서 추가·선택한 값은 예제 안에서만 유지돼요."
                : isCapsuleTabs
                ? "CapsuleTabs의 보기 전환과 기간 선택 예제입니다. 같은 캡슐에 옵션·색상·상태를 조합하며, PeriodPicker도 이 컴포넌트를 사용해요."
                : c.demo === "production"
                ? "기존 웹 코드를 렌더링합니다. 예제의 저장·삭제·검색은 합성 데이터 안에서만 동작해요."
                : c.demo === "library"
                  ? "새로 추가한 재사용 웹 컴포넌트입니다. 조작은 예제 안에서 동작하며 제품 화면의 저장·동기화에는 연결하지 않았어요."
                  : "규격을 설명하는 웹 재현입니다. 네이티브의 화면·제스처와 완전히 동일한 구현으로 간주하지 않아요."}
            </p>
            {details && (
              <div className="pl-web-reference" data-platform="web">
                <p className="pl-reference-platform-note">
                  <strong>{isAccordion ? "Accordion 구조" : "웹 구현 비교"}</strong> 위 프리뷰와 아래 Properties ·
                  Variant · Size · Slots는 현재 React 구현 기준이에요. 이어지는
                  iOS 가이드의 속성·크기와는 구분해요.
                </p>
                <ComponentReference
                  component={c}
                  supplementary={!isAccordion && Boolean(c.guide)}
                  idPrefix={isAccordion ? "" : "web-"}
                />
              </div>
            )}
          </>
        )}
      </details>
      {isAccordion ? (
        <details className="pl-web-archive">
          <summary>관련 iOS 단일 펼침 영역</summary>
          <NativeComponentReference component={c} idPrefix="related-ios-" />
        </details>
      ) : c.guide ? (
        <Suspense fallback={<p>사용 가이드를 불러오고 있어요.</p>}>
          <ComponentGuidelines
            component={c}
            supplementalReference={
              details && c.guide.platform !== "ios" ? (
                <ComponentReference component={c} supplementary />
              ) : undefined
            }
          />
        </Suspense>
      ) : audit ? null : (
        <>
          {details && <ComponentReference component={c} />}
          <section className="pl-doc-section" id="usage">
            <h2>언제 사용하나요</h2>
            <p>{c.usage}</p>
            <p>{c.rule}</p>
            {details && (
              <ul>
                {details.guidelines.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            )}
            <div className="pl-do-dont">
              <div>
                <small>DO</small>
                <p>
                  {c.id === "taste-chip"
                    ? "단맛 0과 기록 없음을 구분해요."
                    : c.id === "primary-button"
                      ? "저장할 대상을 알려주는 “기록 완료”."
                      : "현재 상태와 다음 행동을 함께 보여줘요."}
                </p>
              </div>
              <div>
                <small>AVOID</small>
                <p>
                  {c.id === "taste-chip"
                    ? "값이 없다는 이유로 싫어한다고 설명하기."
                    : c.id === "primary-button"
                      ? "결과를 알 수 없는 “확인” 버튼 반복."
                      : "색이나 움직임만으로 의미를 전달하기."}
                </p>
              </div>
            </div>
          </section>
          <section className="pl-doc-section" id="specs">
            <h2>구조와 규격</h2>
            <div className="pl-spec-line">
              <span>기본 규격</span>
              <p>{c.specs}</p>
            </div>
            <div className="pl-spec-line">
              <span>필요한 상태</span>
              <p>{c.states.join(" · ")}</p>
            </div>
            <div className="pl-spec-line">
              <span>텍스트와 배치</span>
              <p>
                내용에 맞춘 너비, 긴 한국어 줄바꿈, 최소 터치 영역. 문서의 큰
                글자 규격은 프리뷰에 적용하지 않아요.
              </p>
            </div>
            <div className="pl-spec-line">
              <span>플랫폼 차이</span>
              <p>{c.difference}</p>
            </div>
          </section>
          <section className="pl-doc-section" id="access">
            <h2>인터랙션과 접근성</h2>
            <p>{c.accessibility}</p>
            <p>
              입력 → 상태 갱신 → 피드백 → 종료 순서로 동작해요. 동작
              줄이기에서는 의미가 같은 최종 상태를 즉시 보여줘요.
            </p>
            <Link className="pl-inline-link" href={`${BASE}/accessibility`}>
              접근성 기준 읽기 ↗
            </Link>
          </section>
        </>
      )}
      <section className="pl-doc-section" id="sources">
        <h2>소스와 연결</h2>
        {c.id === "bottom-sheet" && <>
          <SourceLink path="src/components/system/SheetBackground.tsx" />
          <SourceLink path="src/lib/sheetPresentation.ts" />
          <SourceLink path="src/constants/designTokens.ts" />
          <SourceLink path="ios/TasteBuddy/DesignSystem/TBTheme.swift" />
          <a className="pl-inline-link" href={figmaURL(map.components["sheet-presentation"])} target="_blank" rel="noreferrer">Figma 시트와 배경 카드 ↗</a>
        </>}
        {(!audit || isCapsuleTabs || isChipFamily) && <SourceLink path={c.source} />}
        {c.native && c.id !== "mini-area-chart" && <SourceLink path={c.native} />}
        {audit &&
          [...new Set(audit.sources.map((source) => source.path))]
            .filter((path) => path !== c.native)
            .map((path) => <SourceLink key={path} path={path} />)}
        {(!audit || isChipFamily) && details && (
          <>
            {details.sources
              .filter((path) => path !== c.source && path !== c.native)
              .map((path) => (
                <SourceLink key={path} path={path} />
              ))}
            {details.boundaries.length > 0 && (
              <div className="pl-document-boundaries">
                <h3>구현 범위</h3>
                <ul>
                  {details.boundaries.map((boundary) => (
                    <li key={boundary}>{boundary}</li>
                  ))}
                </ul>
              </div>
            )}
            <details className="pl-base-code">
              <summary>제품에서 사용하는 기본 코드</summary>
              <div className="pl-code">
                <CopyButton value={c.code} />
                <pre>
                  <code>{c.code}</code>
                </pre>
              </div>
            </details>
          </>
        )}
        {c.references && (
          <div className="pl-related">
            {c.references.map((reference) => (
              <a
                key={reference.url}
                href={reference.url}
                target="_blank"
                rel="noreferrer"
              >
                {reference.label} ↗
              </a>
            ))}
          </div>
        )}
        {["text-input", "taste-chip", "inline-error"].includes(c.id) && (
          <details className="pl-native-capture">
            <summary>iOS 상태 확인</summary>
            <a
              href="/plating/native-states-20260930.png"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/plating/native-states-20260930.png"
                alt="iOS 시뮬레이터에서 확인한 입력, 오류, 비활성 및 미각 칩 상태"
                loading="lazy"
                width="1206"
                height="2622"
              />
            </a>
            <p>
              2026.09.30 · iPhone 17 / iOS 26.5 시뮬레이터. 실기기·VoiceOver
              검증은 포함하지 않아요.
            </p>
          </details>
        )}
        <div className="pl-related">
          <Link href={`${BASE}/patterns/${c.pattern}`}>
            관련 제품 흐름
            <ArrowRight size={17} />
          </Link>
          <Link href={`${BASE}/foundations/colors`}>
            색상과 의미 토큰
            <ArrowRight size={17} />
          </Link>
          <Link href={`${BASE}/writing`}>
            문구 작성 기준
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
function Documentation({ page }: { page: DocPage }) {
  if (page.slug !== "foundations/colors") return <DocumentationContent page={page} />;
  return <ColorModeProvider key={page.slug}><DocumentationContent page={page} /></ColorModeProvider>;
}
function DocumentationContent({ page }: { page: DocPage }) {
  return (
    <>
      <Heading {...page} />
      {page.figmaNodeId && <div className="pl-meta-row">
        {page.sourcePaths && <Tag>원본·소스 안내</Tag>}
        <a href={figmaURL(page.figmaNodeId)} target="_blank" rel="noreferrer">Figma 원본과 목차 <ArrowUpRight size={15} /></a>
      </div>}
      <FoundationIntro slug={page.slug} />
      {page.slug === "components/summary-card" && <Suspense fallback={<p>요약 카드 예시를 불러오고 있어요.</p>}><SummaryCardExamples /></Suspense>}
      {page.sections.map((s) => (
        page.slug === "foundations/colors" && s.id === "color-usage-examples" ?
        <FoundationSection key={s.id} slug={page.slug} section={s.id} LinkComponent={Link} /> :
        <section className="pl-doc-section" id={s.id} key={s.id}>
          <h2>{s.title}</h2>
          <p>{s.body}</p>
          {page.slug === "patterns/sheet-presentation" && s.id === "examples" && <Suspense fallback={<p>시트 예시를 불러오고 있어요.</p>}><SheetPresentation /></Suspense>}
          {s.id === "sources" && page.sourcePaths && <div className="pl-source-list">
            {page.sourcePaths.map((path) => <SourceLink key={path} path={path} />)}
          </div>}
          {s.links && <ul className="pl-document-links">
            {s.links.map((link) => <li key={link.slug}><Link href={`${BASE}/${link.slug}`}>{link.label} <ArrowUpRight size={14} aria-hidden="true" /></Link></li>)}
          </ul>}
          {page.slug === "patterns/flow-step" && s.id === "examples" && (
            <>
              <a href={figmaURL("1282:5137")} target="_blank" rel="noreferrer">Figma 패턴 보기 ↗</a>
              <div className="pl-flow-pattern-examples">
                {["기본", "보조 행동", "비활성"].map((state) => (
                  <div key={state}>
                    <h3>{state}</h3>
                    <Suspense fallback={<p>예시를 불러오고 있어요.</p>}>
                      <AdditionalPreview id="action-area" state={state} label="" />
                    </Suspense>
                  </div>
                ))}
              </div>
            </>
          )}
          {s.items && (
            <ul>
              {s.items.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          )}
          <FoundationSection
            slug={page.slug}
            section={s.id}
            LinkComponent={Link}
          />
        </section>
      ))}
      {page.slug === "motion" && (
        <Suspense fallback={<p>모션 프리뷰를 불러오고 있어요.</p>}>
          <div className="pl-motion-embed">
            <MotionSection />
          </div>
        </Suspense>
      )}
      {page.slug === "writing" && (
        <div className="pl-do-dont">
          <div>
            <small>DO</small>
            <p>
              사진을 불러오지 못했어요.
              <br />
              다시 선택해 주세요.
            </p>
          </div>
          <div>
            <small>AVOID</small>
            <p>
              알 수 없는 오류입니다.
              <br />
              문제가 발생했습니다.
            </p>
          </div>
        </div>
      )}
      {page.slug === "governance" && (
        <section className="pl-doc-section">
          <h2>참고한 구조와 적용</h2>
          {references.map((r) => (
            <div className="pl-reference" key={r.name}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.name}
                <ArrowUpRight size={16} />
              </a>
              <p>{r.observation}</p>
              <p>→ {r.application}</p>
            </div>
          ))}
        </section>
      )}
      <div className="pl-related">
        <Link href={`${BASE}/components`}>
          Core components
          <ArrowRight size={17} />
        </Link>
        <Link href={`${BASE}/audit`}>
          현재 자산과 대응표
          <ArrowRight size={17} />
        </Link>
      </div>
    </>
  );
}
function AssetTile({ asset: a }: { asset: BrandAsset }) {
  return (
    <Link href={`${BASE}/brand-assets/${a.id}`} className="pl-asset-tile">
      <div>
        <img src={a.poster} alt={a.description} loading="lazy" />
        <span>{a.duration.toFixed(1)}s</span>
      </div>
      <h3>
        {a.title}
        <ArrowUpRight size={17} />
      </h3>
      <p>{a.composition}</p>
    </Link>
  );
}
function AssetGallery() {
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const found = assets.filter(
    (a) =>
      (category === "전체" || a.category === category) &&
      (a.title + a.composition).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="BRAND ASSETS"
        title="취향이 보이는 순간"
        intro="Remotion Studio에서 만든 로고, 꽃잎, Bloom과 브랜드 모션. 원본의 조형과 시간을 그대로 살펴보세요."
      />
      <div className="pl-gallery-tools">
        <label className="pl-filter-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="브랜드 에셋 검색"
            aria-label="브랜드 에셋 검색"
          />
        </label>
      </div>
      <div className="pl-filter-tabs" role="group" aria-label="브랜드 분류">
        {["전체", ...new Set(assets.map((a) => a.category))].map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="pl-result-count" role="status">
        {found.length}개 에셋 · 기존 렌더 스냅샷
      </p>
      <div className="pl-asset-grid">
        {found.map((a) => (
          <AssetTile asset={a} key={a.id} />
        ))}
      </div>
      {!found.length && (
        <div className="pl-empty">
          결과가 없어요.
          <button
            onClick={() => {
              setQuery("");
              setCategory("전체");
            }}
          >
            검색과 필터 지우기
          </button>
        </div>
      )}
    </>
  );
}
function AssetPage({ asset: a }: { asset: BrandAsset }) {
  return (
    <>
      <Heading
        eyebrow={`BRAND ASSETS / ${a.category}`}
        title={a.title}
        intro={a.description}
      />
      <MediaPlayer asset={a} />
      <div className="pl-meta-row">
        <Tag>기존 렌더 · {a.exportedAt}</Tag>
        <Tag>
          {a.width} × {a.height}
        </Tag>
        <Tag>{a.fps} fps</Tag>
      </div>
      <section className="pl-doc-section">
        <h2>원형과 사용</h2>
        <p>
          브랜드 소개, 포트폴리오와 시각적 서명에 사용해요. 원본의 전체
          구도·색상·타이포그래피를 보존하고 미디어 비율에 맞춰 contain으로
          표시해요. 작은 제품 UI에서는 읽기와 응답성을 먼저 확인하세요.
        </p>
        <div className="pl-spec-line">
          <span>컴포지션</span>
          <p>{a.composition}</p>
        </div>
        <div className="pl-spec-line">
          <span>현재 파일</span>
          <p>
            {a.width} × {a.height} · {a.duration.toFixed(3)}초 · {a.fps} fps
          </p>
        </div>
        <div className="pl-spec-line">
          <span>조절 범위</span>
          <p>
            사이트에서는 재생 위치·속도만 바꿔요. 조형·색·문구·타이밍의 변형은
            원본 컴포지션의 스키마와 기본 속성을 확인한 뒤 별도 버전으로
            관리해요.
          </p>
        </div>
        <div className="pl-spec-line">
          <span>적용 상태</span>
          <p>
            원본과 기존 렌더가 존재해요. 이 파일의 존재만으로 최종 채택·네이티브
            적용·최신 소스 재렌더를 주장하지 않아요.
          </p>
        </div>
      </section>
      <section className="pl-doc-section">
        <h2>원본과 연결</h2>
        <SourceLink path={a.renderer} />
        <SourceLink path={a.source} />
        <a
          className="pl-inline-link"
          href={`http://localhost:3110/${a.composition}`}
          target="_blank"
          rel="noreferrer"
        >
          Remotion Studio에서 원본 보기 ↗
        </a>
        <div className="pl-code">
          <CopyButton value={a.sha256} />
          <pre>
            <code>SHA-256\n{a.sha256}</code>
          </pre>
        </div>
      </section>
      <div className="pl-related">
        <Link href={`${BASE}/brand-assets`}>
          전체 브랜드 에셋
          <ArrowRight size={17} />
        </Link>
        <Link href={`${BASE}/motion`}>
          제품 모션 규칙
          <ArrowRight size={17} />
        </Link>
      </div>
    </>
  );
}
function AuditPage() {
  return (
    <>
      <Heading
        eyebrow="INVENTORY & EVIDENCE"
        title="현재 자산과 대응표"
        intro={`${components.length}개 계열의 사용처, 보완 사항과 산출물을 연결해요. 정의·구현·검증을 서로 다른 상태로 관리합니다.`}
      />
      <div className="pl-callout">
        <strong>판단 기준</strong>
        <p>
          네이티브 코드·화면은 제품 규격, 문서는 의도, Remotion은 BX 원본의
          근거예요. 이 표의 웹 프리뷰 확인과 실기기 검증은 별개입니다.
        </p>
      </div>
      <div className="pl-table-scroll pl-audit-table">
        <table>
          <caption>
            Plating v1 대응표 · 상세한 증거는 output/plating과
            docs/design/plating-v1.md
          </caption>
          <thead>
            <tr>
              {[
                "필수 항목",
                "실제 사용처",
                "현재 자산·근거",
                "부족한 점",
                "보완 방법",
                "우선순위",
                "Figma 상태",
                "코드 상태",
                "문서 상태",
                "검증 상태",
              ].map((v) => (
                <th key={v}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`${BASE}/components/${c.id}`}>{c.name}</Link>
                </td>
                <td>{c.usage}</td>
                <td>
                  {c.source}
                  <br />
                  {c.native}
                </td>
                <td>
                  {["taste-chip", "toast", "primary-button"].includes(c.id)
                    ? "값·대비·포커스 연결"
                    : "Figma·사용 규칙·연결 부재"}
                </td>
                <td>
                  {["taste-chip", "toast", "primary-button"].includes(c.id)
                    ? "공통 코드 보완 + 문서 등록"
                    : "현재 규격 추출 + 인스턴스·문서 등록"}
                </td>
                <td>
                  {["primary-button", "taste-chip", "bottom-sheet"].includes(
                    c.id,
                  )
                    ? "P0"
                    : "P1"}
                </td>
                <td>{map.components[c.id] ? "편집 가능" : "구축 중"}</td>
                <td>
                  {c.demo === "production"
                    ? "제품 코드 렌더"
                    : c.demo === "library"
                      ? "새 라이브러리 렌더"
                      : "문서용 규격 재현"}
                </td>
                <td>정의됨</td>
                <td>웹 검사 대상 · 실기기 미검증</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="pl-doc-section">
        <h2>v1 밖의 제안</h2>
        <ul>
          <li>다크 모드와 고대비 모드: 제품 공통 계약부터 정의해요.</li>
          <li>
            전체 Android 시각 동등성: 플랫폼별 화면과 제스처 검증을 별도로
            수행해요.
          </li>
          <li>
            Figma Pretendard: 실행 환경의 폰트 제공 후 글리프·줄바꿈을 다시
            확인해요.
          </li>
          <li>
            네이티브·웹 시트의 규격 통일: 기존 흐름에 대한 영향 확인 후 별도
            결정해요.
          </li>
        </ul>
      </section>
    </>
  );
}
