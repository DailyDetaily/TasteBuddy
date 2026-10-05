import { useEffect, useRef, type CSSProperties } from "react";
import { TASTE_TOKENS } from "../constants/designTokens";
import { BASE } from "./catalog";
import "./plating-foundation-map.css";

// Keep the taste map's 126px circles, 136px hex grid and entrance keyframes.
const DIAMETER = 126;
const SELECTED_DIAMETER = 164;
const STEP = 136;
const ROW_HEIGHT = (STEP * Math.sqrt(3)) / 2;
const MAP_SPAN_X = STEP * 7;
const MAP_SPAN_Y = ROW_HEIGHT * 4;
const MAP_WIDTH = MAP_SPAN_X + DIAMETER + 80;
const MAP_HEIGHT = MAP_SPAN_Y + DIAMETER + 64;
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

type Foundation = {
  label: string;
  path: string;
  column: number;
  row: number;
  taste: keyof typeof TASTE_TOKENS;
};

const foundations: Foundation[] = [
  {
    label: "색상 역할",
    path: "foundations/colors#roles",
    column: -3,
    row: -2,
    taste: "sweet",
  },
  {
    label: "반응형",
    path: "foundations/layout#safe-area",
    column: -2,
    row: -2,
    taste: "sour",
  },
  {
    label: "서체",
    path: "foundations/typography#fonts",
    column: -1,
    row: -2,
    taste: "bitter",
  },
  {
    label: "읽기와 대비",
    path: "accessibility#read",
    column: 0,
    row: -2,
    taste: "salty",
  },
  {
    label: "모션 원칙",
    path: "motion#roles",
    column: 1,
    row: -2,
    taste: "umami",
  },
  { label: "용어", path: "writing#terms", column: 2, row: -2, taste: "fat" },
  {
    label: "변경 이력",
    path: "governance#changes",
    column: 3,
    row: -2,
    taste: "fat",
  },
  {
    label: "제품 원칙",
    path: "principles",
    column: -3.5,
    row: -1,
    taste: "sweet",
  },
  {
    label: "아이콘",
    path: "foundations/icons#icons",
    column: -2.5,
    row: -1,
    taste: "sweet",
  },
  {
    label: "이미지",
    path: "foundations/icons#images",
    column: -1.5,
    row: -1,
    taste: "sour",
  },
  {
    label: "반경",
    path: "foundations/radius",
    column: -0.5,
    row: -1,
    taste: "bitter",
  },
  {
    label: "스페이싱",
    path: "foundations/spacing",
    column: 0.5,
    row: -1,
    taste: "salty",
  },
  {
    label: "접근성",
    path: "accessibility",
    column: 1.5,
    row: -1,
    taste: "umami",
  },
  {
    label: "상태",
    path: "foundations/state",
    column: 2.5,
    row: -1,
    taste: "umami",
  },
  {
    label: "레이어",
    path: "foundations/elevation",
    column: 3.5,
    row: -1,
    taste: "fat",
  },
  {
    label: "컬러",
    path: "foundations/colors",
    column: -3,
    row: 0,
    taste: "sweet",
  },
  {
    label: "레이아웃",
    path: "foundations/layout",
    column: -2,
    row: 0,
    taste: "sour",
  },
  {
    label: "타이포그래피",
    path: "foundations/typography",
    column: -1,
    row: 0,
    taste: "bitter",
  },
  {
    label: "디자인 토큰",
    path: "foundations/design-tokens",
    column: 0,
    row: 0,
    taste: "salty",
  },
  { label: "모션", path: "motion", column: 1, row: 0, taste: "umami" },
  {
    label: "보이스 앤 톤",
    path: "writing#voice",
    column: 2,
    row: 0,
    taste: "fat",
  },
  { label: "컴포넌트", path: "components", column: 3, row: 0, taste: "fat" },
  {
    label: "버튼",
    path: "components/primary-button",
    column: -3.5,
    row: 1,
    taste: "sweet",
  },
  {
    label: "탐색",
    path: "components/bottom-tab",
    column: -2.5,
    row: 1,
    taste: "sour",
  },
  {
    label: "입력",
    path: "components/text-input",
    column: -1.5,
    row: 1,
    taste: "bitter",
  },
  {
    label: "감각 선택",
    path: "patterns/sensory",
    column: -0.5,
    row: 1,
    taste: "bitter",
  },
  {
    label: "누름 피드백",
    path: "foundations/feedback",
    column: 0.5,
    row: 1,
    taste: "salty",
  },
  {
    label: "브랜드",
    path: "brand-assets",
    column: 1.5,
    row: 1,
    taste: "umami",
  },
  {
    label: "식사 기록",
    path: "patterns/dining",
    column: 2.5,
    row: 1,
    taste: "fat",
  },
  {
    label: "오버레이",
    path: "components/bottom-sheet",
    column: 3.5,
    row: 1,
    taste: "fat",
  },
  {
    label: "선택",
    path: "components/selection-card",
    column: -3,
    row: 2,
    taste: "sweet",
  },
  {
    label: "검색",
    path: "components/search-field",
    column: -2,
    row: 2,
    taste: "sour",
  },
  {
    label: "카드",
    path: "components/card",
    column: -1,
    row: 2,
    taste: "bitter",
  },
  {
    label: "미각 칩",
    path: "components/taste-chip",
    column: 0,
    row: 2,
    taste: "salty",
  },
  {
    label: "오류 안내",
    path: "patterns/recovery",
    column: 1,
    row: 2,
    taste: "umami",
  },
  {
    label: "취향 해석",
    path: "patterns/interpretation",
    column: 2,
    row: 2,
    taste: "fat",
  },
  { label: "운영", path: "governance", column: 3, row: 2, taste: "fat" },
];
const MAX_DISTANCE = Math.max(
  ...foundations.map((item) =>
    Math.hypot(item.column * STEP, item.row * ROW_HEIGHT),
  ),
);

function entranceScale(progress: number) {
  const stops = [
    [0, 0.72],
    [0.54, 1.045],
    [0.74, 0.985],
    [1, 1],
  ];
  const index = progress < 0.54 ? 0 : progress < 0.74 ? 1 : 2;
  const [start, from] = stops[index];
  const [end, to] = stops[index + 1];
  const t = clamp((progress - start) / (end - start));
  return from + (to - from) * (1 - Math.pow(1 - t, 3));
}

export default function PlatingFoundationMap() {
  const viewportRef = useRef<HTMLElement>(null);
  const spaceRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const space = spaceRef.current;
    const plane = planeRef.current;
    const reset = resetRef.current;
    if (!viewport || !space || !plane || !reset) return;

    const bubbles = Array.from(plane.querySelectorAll<HTMLAnchorElement>("a"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let lastTime = 0;
    let lastProgress = -1;
    let lastCenter = -1;
    let width = 0;
    let height = 0;
    let zoom = 1;
    let restingZoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let keyboardReveal = false;
    let keyboardNavigating = false;
    let pointer: { x: number; y: number } | null = null;
    let drag: {
      id: number;
      x: number;
      y: number;
      left: number;
      top: number;
      moved: boolean;
    } | null = null;
    let suppressClickUntil = 0;
    let pinch: { distance: number; zoom: number; x: number; y: number } | null =
      null;

    const layout = () => {
      // As in the product map, every outer bubble can reach the viewport center.
      offsetX = width / 2 - ((MAP_WIDTH - MAP_SPAN_X) / 2) * zoom;
      offsetY = height / 2 - ((MAP_HEIGHT - MAP_SPAN_Y) / 2) * zoom;
      space.style.width = `${width + MAP_SPAN_X * zoom}px`;
      space.style.height = `${height + MAP_SPAN_Y * zoom}px`;
      plane.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
    };

    const render = (time: number) => {
      frame = 0;
      const rect = viewport.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      const revealStart = window.innerHeight * 0.92;
      const revealEnd = Math.max(68, window.innerHeight - height - 140);
      const progress =
        reducedMotion.matches || keyboardReveal
          ? 1
          : clamp(
              (revealStart - rect.top) / Math.max(1, revealStart - revealEnd),
            );

      const centerX =
        (viewport.scrollLeft + width / 2 - offsetX) / zoom - MAP_WIDTH / 2;
      const centerY =
        (viewport.scrollTop + height / 2 - offsetY) / zoom - MAP_HEIGHT / 2;
      let nearest = 0;
      let nearestDistance = Infinity;
      foundations.forEach((item, index) => {
        const distance = Math.hypot(
          item.column * STEP - centerX,
          item.row * ROW_HEIGHT - centerY,
        );
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      if (nearest !== lastCenter) {
        lastCenter = nearest;
        const center = foundations[nearest];
        viewport.dataset.center = center.label;
        bubbles.forEach((bubble, index) => {
          const item = foundations[index];
          const dx = (item.column - center.column) * STEP;
          const dy = (item.row - center.row) * ROW_HEIGHT;
          const distance = Math.hypot(dx, dy);
          const selected = index === nearest;
          const diameter = selected ? SELECTED_DIAMETER : DIAMETER;
          // Move the surrounding grid outward to keep the enlarged circle clear.
          const push = selected ? 0 : (SELECTED_DIAMETER - DIAMETER) / 2;
          bubble.style.width = `${diameter}px`;
          bubble.style.height = `${diameter}px`;
          bubble.style.left = `${MAP_WIDTH / 2 + item.column * STEP - diameter / 2 + (distance ? (dx / distance) * push : 0)}px`;
          bubble.style.top = `${MAP_HEIGHT / 2 + item.row * ROW_HEIGHT - diameter / 2 + (distance ? (dy / distance) * push : 0)}px`;
          bubble.style.zIndex = selected ? "1" : "0";
          // Keep the center clear and mix 40–90% white into the surrounding rings.
          const whiteMix = selected
            ? 0
            : Math.min(90, Math.max(1, Math.round(distance / STEP)) * 20 + 20);
          bubble.style.setProperty("--bubble-strength", `${100 - whiteMix}%`);
        });
      }

      if (progress !== lastProgress) {
        lastProgress = progress;
        viewport.dataset.progress = progress.toFixed(3);
        bubbles.forEach((bubble, index) => {
          const item = foundations[index];
          const distance = Math.hypot(
            item.column * STEP,
            item.row * ROW_HEIGHT,
          );
          const delay = (distance / MAX_DISTANCE) * 0.38;
          const local = clamp((progress - delay) / 0.62);
          bubble.style.opacity = `${clamp(local / 0.54)}`;
          bubble.style.transform = `scale(${entranceScale(local)})`;
          bubble.style.pointerEvents = local > 0.3 ? "auto" : "none";
        });
      }

      // Hovering near an edge gently explores that direction; dragging takes over.
      if (
        visible &&
        progress > 0.95 &&
        pointer &&
        pointer.y >= rect.top &&
        pointer.y <= rect.bottom &&
        !drag &&
        !pinch &&
        !reducedMotion.matches &&
        finePointer.matches &&
        !keyboardNavigating
      ) {
        const edgeSpeed = (position: number, size: number) => {
          const relative = (position / size - 0.5) * 2;
          return (
            Math.sign(relative) *
            Math.pow(clamp((Math.abs(relative) - 0.55) / 0.45), 2)
          );
        };
        const delta = Math.min(time - lastTime, 32) / 1000;
        const dx = edgeSpeed(pointer.x - rect.left, width) * 190 * delta;
        const dy = edgeSpeed(pointer.y - rect.top, height) * 100 * delta;
        const left = viewport.scrollLeft;
        const top = viewport.scrollTop;
        viewport.scrollLeft += dx;
        viewport.scrollTop += dy;
        if (viewport.scrollLeft !== left || viewport.scrollTop !== top)
          schedule();
      }
      lastTime = time;
    };

    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    const recenter = () => {
      zoom = restingZoom;
      pointer = null;
      layout();
      viewport.scrollLeft = (space.offsetWidth - width) / 2;
      viewport.scrollTop = (space.offsetHeight - height) / 2;
      schedule();
    };

    const resize = () => {
      const wasMobile = width <= 760;
      const zoomRatio = zoom / restingZoom;
      const x = (viewport.scrollLeft + width / 2 - offsetX) / zoom;
      const y = (viewport.scrollTop + height / 2 - offsetY) / zoom;
      const initial = width === 0;
      width = viewport.clientWidth;
      height = viewport.clientHeight;
      const isMobile = width <= 760;
      restingZoom = isMobile
        ? 0.86
        : Math.max(1.42, (width * 1.14) / MAP_WIDTH);
      if (initial || wasMobile !== isMobile) {
        recenter();
      } else {
        zoom = restingZoom * zoomRatio;
        layout();
        viewport.scrollLeft = x * zoom + offsetX - width / 2;
        viewport.scrollTop = y * zoom + offsetY - height / 2;
      }
      schedule();
    };

    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      suppressClickUntil = 0;
      keyboardNavigating = false;
      pointer = null;
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: viewport.scrollLeft,
        top: viewport.scrollTop,
        moved: false,
      };
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (!drag) {
        pointer = { x: event.clientX, y: event.clientY };
        schedule();
        return;
      }
      if (
        !drag.moved &&
        Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6
      ) {
        drag.moved = true;
        viewport.setPointerCapture(event.pointerId);
        viewport.dataset.dragging = "true";
      }
      if (drag.moved) {
        event.preventDefault();
        viewport.scrollLeft = drag.left - (event.clientX - drag.x);
        viewport.scrollTop = drag.top - (event.clientY - drag.y);
      }
    };
    const pointerUp = () => {
      if (drag?.moved) suppressClickUntil = performance.now() + 400;
      const id = drag?.id;
      drag = null;
      delete viewport.dataset.dragging;
      if (id !== undefined && viewport.hasPointerCapture(id))
        viewport.releasePointerCapture(id);
    };
    const pointerLeave = () => {
      pointer = null;
      if (drag && !drag.moved) pointerUp();
    };
    const preventDrag = (event: Event) => event.preventDefault();
    const wheel = (event: WheelEvent) => {
      if (
        !finePointer.matches ||
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return;
      // Page scrolling drives the entrance; the mouse explores the map by drag.
      event.preventDefault();
      pointer = null;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      window.scrollBy({ top: event.deltaY * unit, behavior: "auto" });
    };
    const click = (event: MouseEvent) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const touchStart = (event: TouchEvent) => {
      pointer = null;
      if (event.touches.length !== 2) return;
      event.preventDefault();
      const [a, b] = Array.from(event.touches);
      const rect = viewport.getBoundingClientRect();
      pinch = {
        distance: Math.max(
          1,
          Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        ),
        zoom,
        x:
          (viewport.scrollLeft +
            (a.clientX + b.clientX) / 2 -
            rect.left -
            offsetX) /
          zoom,
        y:
          (viewport.scrollTop +
            (a.clientY + b.clientY) / 2 -
            rect.top -
            offsetY) /
          zoom,
      };
    };
    const touchMove = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      const [a, b] = Array.from(event.touches);
      const rect = viewport.getBoundingClientRect();
      zoom = clamp(
        (pinch.zoom *
          Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)) /
          pinch.distance,
        width <= 760 ? 0.72 : restingZoom * 0.72,
        width <= 760 ? 1.42 : restingZoom * 1.42,
      );
      layout();
      viewport.scrollLeft =
        pinch.x * zoom + offsetX - ((a.clientX + b.clientX) / 2 - rect.left);
      viewport.scrollTop =
        pinch.y * zoom + offsetY - ((a.clientY + b.clientY) / 2 - rect.top);
    };
    const touchEnd = () => {
      if (pinch) suppressClickUntil = performance.now() + 400;
      pinch = null;
    };

    const focus = (event: FocusEvent) => {
      pointer = null;
      // Pointer clicks keep their natural location. Keyboard focus brings every
      // destination into view even when its entrance hasn't played yet.
      keyboardNavigating =
        event.target instanceof HTMLElement &&
        event.target.matches(":focus-visible");
      if (!keyboardNavigating) return;
      keyboardReveal = true;
      const index = bubbles.indexOf(event.target as HTMLAnchorElement);
      if (index >= 0) {
        const item = foundations[index];
        viewport.scrollLeft =
          (MAP_WIDTH / 2 + item.column * STEP) * zoom + offsetX - width / 2;
        viewport.scrollTop =
          (MAP_HEIGHT / 2 + item.row * ROW_HEIGHT) * zoom +
          offsetY -
          height / 2;
      }
      schedule();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.target !== viewport) return;
      const direction: Record<string, [number, number]> = {
        ArrowLeft: [-96, 0],
        ArrowRight: [96, 0],
        ArrowUp: [0, -96],
        ArrowDown: [0, 96],
      };
      if (event.key === "Home") {
        event.preventDefault();
        recenter();
      } else if (direction[event.key]) {
        event.preventDefault();
        viewport.scrollBy({
          left: direction[event.key][0],
          top: direction[event.key][1],
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(viewport);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("blur", pointerUp);
    reducedMotion.addEventListener("change", schedule);
    viewport.addEventListener("pointerdown", pointerDown);
    viewport.addEventListener("scroll", schedule, { passive: true });
    viewport.addEventListener("pointermove", pointerMove);
    viewport.addEventListener("pointerup", pointerUp);
    viewport.addEventListener("pointercancel", pointerUp);
    viewport.addEventListener("lostpointercapture", pointerUp);
    viewport.addEventListener("pointerleave", pointerLeave);
    viewport.addEventListener("dragstart", preventDrag);
    viewport.addEventListener("wheel", wheel, { passive: false });
    viewport.addEventListener("click", click, true);
    viewport.addEventListener("touchstart", touchStart, { passive: false });
    viewport.addEventListener("touchmove", touchMove, { passive: false });
    viewport.addEventListener("touchend", touchEnd);
    viewport.addEventListener("touchcancel", touchEnd);
    viewport.addEventListener("focusin", focus);
    viewport.addEventListener("keydown", keyDown);
    reset.addEventListener("click", recenter);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("blur", pointerUp);
      reducedMotion.removeEventListener("change", schedule);
      viewport.removeEventListener("pointerdown", pointerDown);
      viewport.removeEventListener("scroll", schedule);
      viewport.removeEventListener("pointermove", pointerMove);
      viewport.removeEventListener("pointerup", pointerUp);
      viewport.removeEventListener("pointercancel", pointerUp);
      viewport.removeEventListener("lostpointercapture", pointerUp);
      viewport.removeEventListener("pointerleave", pointerLeave);
      viewport.removeEventListener("dragstart", preventDrag);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("click", click, true);
      viewport.removeEventListener("touchstart", touchStart);
      viewport.removeEventListener("touchmove", touchMove);
      viewport.removeEventListener("touchend", touchEnd);
      viewport.removeEventListener("touchcancel", touchEnd);
      viewport.removeEventListener("focusin", focus);
      viewport.removeEventListener("keydown", keyDown);
      reset.removeEventListener("click", recenter);
    };
  }, []);

  return (
    <section className="pl-foundations" aria-labelledby="pl-foundations-title">
      <header className="pl-foundations-heading">
        <h2 id="pl-foundations-title">플레이팅의 기반</h2>
      </header>
      <div className="pl-foundations-frame">
        <nav
          ref={viewportRef}
          className="pl-foundations-viewport"
          aria-label="디자인 시스템 버블 맵"
          aria-describedby="pl-foundations-help"
          tabIndex={0}
        >
          <div ref={spaceRef} className="pl-foundations-space">
            <div
              ref={planeRef}
              className="pl-foundations-plane"
              style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
            >
              {foundations.map((item) => {
                const palette = TASTE_TOKENS[item.taste].palette;
                return (
                  <a
                    key={item.label}
                    href={`${BASE}/${item.path}`}
                    className="pl-foundation-bubble"
                    draggable={false}
                    style={
                      {
                        left: MAP_WIDTH / 2 + item.column * STEP - DIAMETER / 2,
                        top:
                          MAP_HEIGHT / 2 + item.row * ROW_HEIGHT - DIAMETER / 2,
                        width: DIAMETER,
                        height: DIAMETER,
                        "--bubble-fill": palette.tintSurface,
                        "--bubble-ink": palette.tintSurfaceText,
                      } as CSSProperties
                    }
                  >
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </nav>
        <div className="pl-foundations-edges" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="pl-foundations-caption">
        <p id="pl-foundations-help" className="pl-sr">
          드래그하거나 밀어서 맵을 이동하고, 두 손가락으로 확대할 수 있어요.
          방향키로 이동할 수 있어요. Tab으로 항목을 선택하고 Enter로 문서를
          열어요.
        </p>
        <button ref={resetRef} type="button">
          처음 위치로
        </button>
      </div>
    </section>
  );
}
