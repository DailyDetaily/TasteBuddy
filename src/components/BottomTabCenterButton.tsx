import { Plus } from 'lucide-react';
import { BorderBeam } from 'border-beam';
import React from 'react';
import { ICON_TOKENS } from '../constants/designTokens';

export interface BottomTabCenterButtonProps {
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
}

export default function BottomTabCenterButton({
  onClick,
  ariaLabel = '미각 업데이트 시작',
  title = '미각 업데이트',
}: BottomTabCenterButtonProps) {
  const beamRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const beamElement = beamRef.current;

    if (!beamElement || typeof window === 'undefined') {
      return undefined;
    }

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reduceMotionQuery.matches) {
      return undefined;
    }

    let animationFrame = 0;
    let isStopped = false;
    let startTime = 0;
    let lastLoopIndex = -1;
    const motionDurationMs = 4600;
    const travelRadius = 5.2;
    type BeamColor = { id: number; r: number; g: number; b: number };
    type BeamColorPair = [BeamColor, BeamColor];
    const tasteBeamColorTokens = [
      '--tb-taste-sweet-main',
      '--tb-taste-sour-main',
      '--tb-taste-bitter-main',
      '--tb-taste-salty-main',
      '--tb-taste-umami-main',
      '--tb-taste-fat-main',
    ];
    const fallbackTasteBeamColors: BeamColor[] = [
      { id: 0, r: 255, g: 153, b: 0 },
      { id: 1, r: 251, g: 192, b: 45 },
      { id: 2, r: 149, g: 201, b: 0 },
      { id: 3, r: 114, g: 153, b: 255 },
      { id: 4, r: 179, g: 114, b: 180 },
      { id: 5, r: 149, g: 134, b: 122 },
    ];

    const formatNumber = (value: number) => value.toFixed(4);
    const formatPixel = (value: number) => `${value.toFixed(2)}px`;
    const clampColorChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
    const parseBeamColor = (colorValue: string, fallback: BeamColor): BeamColor => {
      const value = colorValue.trim();
      const hexMatch = value.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      const shortHexMatch = value.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
      const rgbMatch = value.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);

      if (hexMatch) {
        return {
          id: fallback.id,
          r: Number.parseInt(hexMatch[1], 16),
          g: Number.parseInt(hexMatch[2], 16),
          b: Number.parseInt(hexMatch[3], 16),
        };
      }

      if (shortHexMatch) {
        return {
          id: fallback.id,
          r: Number.parseInt(`${shortHexMatch[1]}${shortHexMatch[1]}`, 16),
          g: Number.parseInt(`${shortHexMatch[2]}${shortHexMatch[2]}`, 16),
          b: Number.parseInt(`${shortHexMatch[3]}${shortHexMatch[3]}`, 16),
        };
      }

      if (rgbMatch) {
        return {
          id: fallback.id,
          r: clampColorChannel(Number.parseInt(rgbMatch[1], 10)),
          g: clampColorChannel(Number.parseInt(rgbMatch[2], 10)),
          b: clampColorChannel(Number.parseInt(rgbMatch[3], 10)),
        };
      }

      return fallback;
    };
    const tasteBeamColors = tasteBeamColorTokens.map((token, index) => {
      const tokenValue = window.getComputedStyle(document.documentElement).getPropertyValue(token);
      return parseBeamColor(tokenValue, fallbackTasteBeamColors[index]);
    });
    const mixBeamColor = (from: BeamColor, to: BeamColor, amount: number): BeamColor => ({
      id: from.id,
      r: clampColorChannel(from.r + (to.r - from.r) * amount),
      g: clampColorChannel(from.g + (to.g - from.g) * amount),
      b: clampColorChannel(from.b + (to.b - from.b) * amount),
    });
    const formatColor = (color: BeamColor) => `rgb(${color.r}, ${color.g}, ${color.b})`;
    const smoothStep = (value: number) => value * value * (3 - 2 * value);
    const pickBeamColorPair = (previousPair?: BeamColorPair): BeamColorPair => {
      let firstIndex = 0;
      let secondIndex = 1;

      for (let attempt = 0; attempt < 8; attempt += 1) {
        firstIndex = Math.floor(Math.random() * tasteBeamColors.length);
        secondIndex = Math.floor(Math.random() * tasteBeamColors.length);

        if (secondIndex === firstIndex) {
          secondIndex = (secondIndex + 1) % tasteBeamColors.length;
        }

        if (
          !previousPair ||
          previousPair[0].id !== firstIndex ||
          previousPair[1].id !== secondIndex
        ) {
          break;
        }
      }

      return [tasteBeamColors[firstIndex], tasteBeamColors[secondIndex]];
    };
    let currentBeamColorPair = pickBeamColorPair();
    let nextBeamColorPair = pickBeamColorPair(currentBeamColorPair);

    const syncBeamMotion = (timestamp: number) => {
      if (isStopped) {
        return;
      }

      if (startTime === 0) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const loopIndex = Math.floor(elapsed / motionDurationMs);
      const loopProgress = (elapsed % motionDurationMs) / motionDurationMs;
      const phase = loopProgress * Math.PI * 2;
      const swing = (offset = 0) => Math.sin(phase + offset);
      const wave = (offset = 0) => (1 - Math.cos(phase + offset)) / 2;
      const setMotionGroup = (index: 1 | 2 | 3, offset: number) => {
        beamElement.style.setProperty(`--tb-beam-w${index}`, formatNumber(0.86 + wave(offset) * 0.3));
        beamElement.style.setProperty(
          `--tb-beam-h${index}`,
          formatNumber(0.88 + wave(offset + Math.PI) * 0.24)
        );
        beamElement.style.setProperty(`--tb-beam-x${index}`, formatPixel(travelRadius * swing(offset)));
        beamElement.style.setProperty(
          `--tb-beam-y${index}`,
          formatPixel(travelRadius * swing(offset + Math.PI / 2))
        );
      };

      if (loopIndex !== lastLoopIndex) {
        if (lastLoopIndex >= 0) {
          currentBeamColorPair = nextBeamColorPair;
        }

        nextBeamColorPair = pickBeamColorPair(currentBeamColorPair);
        lastLoopIndex = loopIndex;
      }

      const colorMixAmount = smoothStep(loopProgress);
      const currentColorA = mixBeamColor(currentBeamColorPair[0], nextBeamColorPair[0], colorMixAmount);
      const currentColorB = mixBeamColor(currentBeamColorPair[1], nextBeamColorPair[1], colorMixAmount);

      beamElement.style.setProperty('--tb-center-beam-color-a', formatColor(currentColorA));
      beamElement.style.setProperty('--tb-center-beam-color-b', formatColor(currentColorB));
      setMotionGroup(1, 0);
      setMotionGroup(2, (Math.PI * 2) / 3);
      setMotionGroup(3, (Math.PI * 4) / 3);
      beamElement.style.setProperty('--tb-beam-glow-h', formatNumber(0.9 + wave(Math.PI / 3) * 0.2));
      beamElement.style.setProperty('--tb-beam-opacity', '1');
      beamElement.style.setProperty('--tb-beam-hue', `${(swing(Math.PI / 6) * 18).toFixed(2)}deg`);

      animationFrame = window.requestAnimationFrame(syncBeamMotion);
    };

    animationFrame = window.requestAnimationFrame(syncBeamMotion);

    return () => {
      isStopped = true;
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="flex min-w-0 items-center justify-center py-[6px]">
      <BorderBeam
        ref={beamRef}
        size="pulse-inner"
        colorVariant="colorful"
        className="tb-bottom-tab-center-beam"
      >
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel}
          title={title}
          className="relative flex size-[44px] items-center justify-center overflow-hidden rounded-full bg-[#1f1f1f] text-[var(--tb-color-text-inverse)] transition-transform duration-300 ease-[var(--tb-motion-ease-entrance)] hover:scale-[1.04] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-taste-sweet-main)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tb-color-bg-page)]"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-[1] size-[30px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(31,31,31,0.96)_0%,rgba(31,31,31,0.82)_42%,rgba(31,31,31,0)_72%)] blur-[6px]"
          />
          <Plus
            className="relative z-[2]"
            size={ICON_TOKENS.size.lg}
            strokeWidth={ICON_TOKENS.strokeWidth.regular}
          />
        </button>
      </BorderBeam>
    </div>
  );
}
