import { useEffect, useRef, type CSSProperties } from "react";
import { bloomSvgLayers } from "../../brand-launch/src/TasteBloomAvatars/generated";

const BLOOM_CYCLE_MS = 5600;

function PetalRing({
  petals,
  inner = false,
}: {
  petals: readonly string[];
  inner?: boolean;
}) {
  return (
    <div
      className={`pl-home-bloom-ring${inner ? " pl-home-bloom-ring-inner" : ""}`}
      data-bloom-layer={inner ? "inner-petals" : "outer-petals"}
    >
      {petals.map((petal, index) => {
        const angle = 180 / petals.length + (360 / petals.length) * index;
        return (
          <div
            key={index}
            className="pl-home-bloom-petal-direction"
            style={{ transform: `rotateZ(${angle}deg)` }}
          >
            <div className="pl-home-bloom-petal-perspective">
              <div className="pl-home-bloom-petal-fold">
                <svg
                  className="pl-home-bloom-svg"
                  viewBox="0 0 100 100"
                  focusable="false"
                >
                  <g
                    transform={`rotate(${-angle} 50 50)`}
                    dangerouslySetInnerHTML={{ __html: petal }}
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PlatingBloomStrip({
  rows,
}: {
  rows: readonly (readonly string[])[];
}) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    type BloomControl = {
      animations: { animation: CSSAnimation; delay: number }[];
      duration: number;
      autoTime: number;
      clockOffset: number;
      overlays: Animation[];
      generation: number;
      state: "folding" | "folded" | "opening" | "open";
    };
    const controls = new Map<HTMLDivElement, BloomControl>();
    // A separate CSS clock keeps the wave's time even while a flower is hovered.
    const cycleClock = viewport.getAnimations().find(
      (animation): animation is CSSAnimation =>
        animation instanceof CSSAnimation &&
        animation.animationName === "pl-bloom-clock",
    );
    const rowElements = Array.from(
      viewport.querySelectorAll<HTMLDivElement>(".pl-home-bloom-row"),
    );
    const motion = rowElements.map((element, index) => ({
      element,
      items: Array.from(
        element.querySelectorAll<HTMLDivElement>(".pl-home-bloom-avatar"),
      ),
      direction: index === 0 ? -1 : 1,
      step: 1,
      offset: 0,
    }));
    let visible = false;
    let frame = 0;
    let previousTime = performance.now();
    let drag: {
      id: number;
      row: number;
      x: number;
      offset: number;
      moved: boolean;
    } | null = null;
    const wrap = (value: number, period: number) =>
      ((value % period) + period) % period;
    const resumeCycle = (avatar: HTMLDivElement, control: BloomControl) => {
      control.animations.forEach(({ animation }) => {
        animation.currentTime = control.autoTime;
        animation.play();
        if (cycleClock?.startTime !== null && cycleClock?.startTime !== undefined)
          animation.startTime = Number(cycleClock.startTime) - control.clockOffset;
      });
      control.overlays.forEach((animation) => animation.cancel());
      controls.delete(avatar);
      delete avatar.dataset.bloomInteraction;
    };
    const transitionFlower = (
      avatar: HTMLDivElement,
      control: BloomControl,
      opening: boolean,
    ) => {
      // Read the visible pose before cancelling an interrupted transition.
      const poses = control.animations.map(({ animation }) => {
        const element = (animation.effect as KeyframeEffect).target as Element;
        const style = getComputedStyle(element);
        return { element, transform: style.transform, opacity: style.opacity };
      });
      control.overlays.forEach((animation) => animation.cancel());
      const generation = ++control.generation;
      control.state = opening ? "opening" : "folding";
      avatar.dataset.bloomInteraction = control.state;
      control.overlays = control.animations.map(({ animation }, index) => {
        const { element, transform, opacity } = poses[index];
        const name = animation.animationName;
        const petals = name.endsWith("fold");
        const inner = name.includes("inner");
        const delay = opening
          ? petals ? inner ? 25 : 0 : inner ? 75 : 55
          : petals ? inner ? 12 : 20 : inner ? 0 : 8;
        return element.animate(
          [
            { transform, opacity },
            {
              transform: petals
                ? `rotateX(${opening ? 0 : 55}deg)`
                : `scale(${opening ? 1 : 0.45})`,
              opacity: petals ? 1 : opening ? 1 : 0.8,
            },
          ],
          {
            duration: opening ? 200 : 160,
            delay,
            easing: "cubic-bezier(0.333333, 0, 0.666667, 1)",
            fill: "both",
          },
        );
      });
      void Promise.all(control.overlays.map((animation) => animation.finished))
        .then(() => {
          if (controls.get(avatar) !== control || control.generation !== generation)
            return;
          control.state = opening ? "open" : "folded";
          avatar.dataset.bloomInteraction = control.state;
        })
        .catch(() => {
          // A new pointer transition or unmount cancels the previous animations.
        });
    };
    const paint = () => {
      motion.forEach((row) => {
        const period = row.items.length * row.step;
        row.offset = wrap(row.offset, period);
        row.element.dataset.offset = row.offset.toFixed(2);
        row.items.forEach((item, index) => {
          const x = wrap(index * row.step + row.offset, period) - row.step;
          item.style.transform = `translate3d(${x}px, 0, 0)`;
        });
      });
    };
    const animate = (time: number) => {
      frame = 0;
      const elapsed = Math.max(0, (time - previousTime) / 1000);
      const seconds = Math.min(elapsed, 0.05);
      previousTime = time;
      motion.forEach((row, index) => {
        if (drag?.row !== index) row.offset += row.direction * 34 * seconds;
      });
      paint();
      controls.forEach((control, avatar) => {
        control.autoTime = cycleClock
          ? Number(cycleClock.currentTime) + control.clockOffset
          : control.autoTime + elapsed * 1000;
        const phase =
          wrap(control.autoTime - control.animations[0].delay, control.duration) /
          control.duration;
        // All source layers are fully open in this shared interval. Rejoin
        // there so pointer interaction never shifts the repeating wave.
        if (control.state === "open" && phase >= 0.245 && phase <= 0.45)
          resumeCycle(avatar, control);
      });
      if (viewport.dataset.animating === "true")
        frame = requestAnimationFrame(animate);
    };
    const updatePlayback = () => {
      const running = visible && !document.hidden && !reducedMotion.matches;
      viewport.dataset.animating = String(running);
      if (running && !frame) {
        previousTime = performance.now();
        frame = requestAnimationFrame(animate);
      } else if (!running) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const measure = () => {
      const width = viewport.clientWidth;
      const baseSize =
        width <= 760
          ? 84
          : Math.min(118, Math.max(92, window.innerWidth * 0.08));
      const size = Math.max(
        baseSize,
        ...motion.map(
          (row) =>
            width / (row.items.length - 2) -
            (parseFloat(getComputedStyle(row.element).columnGap) || 0),
        ),
      );
      // Increase the canvas on wide screens instead of repeating flower kinds.
      viewport.style.setProperty("--pl-bloom-size", `${size}px`);
      motion.forEach((row) => {
        const gap = parseFloat(getComputedStyle(row.element).columnGap) || 0;
        row.step = size + gap;
        row.offset = row.step - size * 0.18;
      });
      paint();
      viewport.dataset.ready = "true";
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    });
    observer.observe(viewport);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    measure();
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const row = rowElements.indexOf(
        event.target.closest(".pl-home-bloom-row") as HTMLDivElement,
      );
      if (row < 0) return;
      drag = {
        id: event.pointerId,
        row,
        x: event.clientX,
        offset: motion[row].offset,
        moved: false,
      };
    };
    const move = (event: PointerEvent) => {
      if (!drag) return;
      if (!drag.moved && Math.abs(event.clientX - drag.x) > 5) {
        drag.moved = true;
        viewport.setPointerCapture(event.pointerId);
        viewport.dataset.dragging = "true";
      }
      if (drag.moved) {
        event.preventDefault();
        motion[drag.row].offset = drag.offset + event.clientX - drag.x;
        paint();
      }
    };
    const up = () => {
      const id = drag?.id;
      drag = null;
      delete viewport.dataset.dragging;
      if (id !== undefined && viewport.hasPointerCapture(id))
        viewport.releasePointerCapture(id);
    };
    const lostCapture = (event: PointerEvent) => {
      // Touch begins with implicit capture on the child; transferring it to
      // the viewport must keep the current drag alive.
      if (event.target === viewport) up();
    };
    const leave = () => {
      if (drag && !drag.moved) up();
    };
    const enterFlower = (event: PointerEvent) => {
      if (
        event.pointerType !== "mouse" ||
        !finePointer.matches ||
        reducedMotion.matches ||
        !(event.target instanceof Element)
      )
        return;
      const avatar = event.target.closest<HTMLDivElement>(
        ".pl-home-bloom-avatar",
      );
      if (
        !avatar ||
        (event.relatedTarget instanceof Node &&
          avatar.contains(event.relatedTarget))
      )
        return;
      const existing = controls.get(avatar);
      if (existing) {
        transitionFlower(avatar, existing, false);
        return;
      }
      const animations = avatar
        .getAnimations({ subtree: true })
        .filter(
          (animation): animation is CSSAnimation =>
            animation instanceof CSSAnimation &&
            animation.animationName.startsWith("pl-bloom-"),
        )
        .map((animation) => ({
          animation,
          delay: Number(animation.effect?.getTiming().delay ?? 0),
        }));
      if (!animations.length) return;
      const main =
        animations.find(
          ({ animation }) => animation.animationName === "pl-bloom-outer-fold",
        ) ?? animations[0];
      const duration =
        Number(main.animation.effect?.getTiming().duration) || 5600;
      const autoTime = Number(main.animation.currentTime ?? 0);
      animations.forEach(({ animation }) => animation.pause());
      const control: BloomControl = {
        animations,
        duration,
        autoTime,
        clockOffset: autoTime - Number(cycleClock?.currentTime ?? autoTime),
        overlays: [],
        generation: 0,
        state: "folding",
      };
      controls.set(avatar, control);
      transitionFlower(avatar, control, false);
    };
    const leaveFlower = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const avatar = event.target.closest<HTMLDivElement>(
        ".pl-home-bloom-avatar",
      );
      if (
        !avatar ||
        (event.relatedTarget instanceof Node &&
          avatar.contains(event.relatedTarget))
      )
        return;
      const control = controls.get(avatar);
      if (control) transitionFlower(avatar, control, true);
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== viewport) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        motion.forEach((row) => {
          row.offset += event.key === "ArrowRight" ? -180 : 180;
        });
        paint();
      }
    };
    viewport.addEventListener("pointerdown", down);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", up);
    viewport.addEventListener("pointercancel", up);
    viewport.addEventListener("lostpointercapture", lostCapture);
    viewport.addEventListener("pointerleave", leave);
    viewport.addEventListener("pointerover", enterFlower);
    viewport.addEventListener("pointerout", leaveFlower);
    viewport.addEventListener("keydown", key);
    window.addEventListener("blur", up);
    document.addEventListener("visibilitychange", updatePlayback);
    reducedMotion.addEventListener("change", updatePlayback);
    updatePlayback();
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      controls.forEach((control, avatar) => resumeCycle(avatar, control));
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", up);
      viewport.removeEventListener("pointercancel", up);
      viewport.removeEventListener("lostpointercapture", lostCapture);
      viewport.removeEventListener("pointerleave", leave);
      viewport.removeEventListener("pointerover", enterFlower);
      viewport.removeEventListener("pointerout", leaveFlower);
      viewport.removeEventListener("keydown", key);
      window.removeEventListener("blur", up);
      document.removeEventListener("visibilitychange", updatePlayback);
      reducedMotion.removeEventListener("change", updatePlayback);
    };
  }, [rows]);

  return (
    <div
      ref={viewportRef}
      className="pl-home-blooms"
      style={{ "--pl-bloom-cycle": `${BLOOM_CYCLE_MS}ms` } as CSSProperties}
      role="region"
      aria-label="테이스트 블룸 아바타 갤러리"
      tabIndex={0}
    >
      <div className="pl-home-bloom-track" aria-hidden="true">
        {rows.map((row, rowIndex) => (
          <div className="pl-home-bloom-row" key={rowIndex}>
            {row.map((id, index) => {
              const layers = bloomSvgLayers[id];
              return (
                <div
                  key={`${id}-${index}`}
                  className="pl-home-bloom-avatar"
                  data-bloom-id={id}
                  style={
                    {
                      "--pl-bloom-delay": `${-BLOOM_CYCLE_MS + (index * BLOOM_CYCLE_MS) / row.length + rowIndex * 50}ms`,
                    } as CSSProperties
                  }
                >
                  <PetalRing petals={layers.outerPetals} />
                  <PetalRing petals={layers.innerPetals} inner />
                  <svg
                    className="pl-home-bloom-svg"
                    viewBox="0 0 100 100"
                    focusable="false"
                  >
                    <g
                      className="pl-home-bloom-outer-stamens"
                      dangerouslySetInnerHTML={{ __html: layers.outerStamens }}
                    />
                    <g
                      className="pl-home-bloom-inner-stamens"
                      dangerouslySetInnerHTML={{ __html: layers.innerStamens }}
                    />
                    <g dangerouslySetInnerHTML={{ __html: layers.pistil }} />
                  </svg>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
