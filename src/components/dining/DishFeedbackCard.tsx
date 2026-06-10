import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

import { ICON_TOKENS } from '../../constants/designTokens';
import SectionCard from '../SectionCard';
import ActionOverlayCard from '../system/ActionOverlayCard';
import ImageBox from '../system/ImageBox';
import PalateBloomAvatar, {
  DEFAULT_PALATE_BLOOM_PROFILE,
  type TasteProfile as PalateBloomTasteProfile,
} from '../system/PalateBloomAvatar';
import TasteChip from '../system/TasteChip';
import type { TasteBuddyAgentDiningAnalysisSnapshot } from '../../types/tasteBuddyAgent';

export interface DishFeedbackCardTag {
  id: string;
  label: string;
  title?: string;
}

export interface DishFeedbackCardTasteBubble extends DishFeedbackCardTag {
  colorTaste?: string;
}

export interface DishFeedbackCardImage {
  alt: string;
  imageSrc?: string | null;
}

export interface DishFeedbackCardViewModel {
  absoluteDateLabel: string;
  author: {
    avatarImageSrc?: string | null;
    avatarProfile?: PalateBloomTasteProfile;
    displayName: string;
    shapeSeed?: string;
  };
  detailTags: DishFeedbackCardTag[];
  id: string;
  images: DishFeedbackCardImage[];
  restaurantName: string;
  relativeDateLabel: string;
  subject: string;
  synthesisSummary: string;
  tbaAnalysisSnapshot?: TasteBuddyAgentDiningAnalysisSnapshot | null;
  tasteBubbles: DishFeedbackCardTasteBubble[];
}

interface DishFeedbackCardProps {
  actions?: {
    onDelete?: () => void;
    onEdit?: () => void;
    onShare?: () => void;
  };
  card: DishFeedbackCardViewModel;
  commentCount?: number;
  interactive?: boolean;
  onLike?: () => void;
  onOpenAuthorProfile?: () => void;
  onOpenComments?: () => void;
  onOpenSubject?: () => void;
  onSelect?: () => void;
  unframed?: boolean;
}

const AUTHOR_LINE_TRUNCATION_MARK = '..';
const MIN_AUTHOR_NAME_LENGTH = 2;
const MIN_AUTHOR_SUBJECT_LENGTH = 3;
const DETAIL_TAG_GAP = 6;
const SKELETON_TASTE_CHIP_WIDTHS = ['104px', '92px', '112px'] as const;
const SKELETON_DETAIL_CHIP_WIDTHS = ['64px', '76px', '84px'] as const;

function DishFeedbackSkeletonShape({
  className,
  style,
}: {
  className: string;
  style?: CSSProperties;
}) {
  return <span aria-hidden="true" className={`block tb-skeleton-shimmer ${className}`} style={style} />;
}

function DishFeedbackActionButton({
  children,
  danger = false,
  icon,
  onClick,
}: {
  children: string;
  danger?: boolean;
  icon: typeof Pencil;
  onClick: () => void;
}) {
  const Icon = icon;

  return (
    <button
      type="button"
      className={`flex h-12 w-full items-center gap-3 rounded-[var(--tb-radius-12)] px-3 text-left text-[14px] font-semibold transition-colors hover:bg-[var(--tb-color-surface-muted)] ${
        danger ? 'text-[var(--destructive)]' : 'text-[var(--tb-color-text-primary)]'
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <span className="flex size-8 items-center justify-center">
        <Icon size={ICON_TOKENS.size.md} strokeWidth={ICON_TOKENS.strokeWidth.regular} />
      </span>
      <span>{children}</span>
    </button>
  );
}

function DishFeedbackActionSheet({
  onClose,
  onDelete,
  onEdit,
  onShare,
  subject,
}: {
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  subject: string;
}) {
  const runAction = (action?: () => void) => {
    action?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 px-5 pb-[max(18px,var(--tb-safe-area-bottom))]"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${subject} 카드 옵션`}
        className="w-full rounded-[20px] bg-[var(--tb-color-bg-focus)] p-3 shadow-[var(--tb-shadow-drawer)]"
        onClick={(event) => event.stopPropagation()}
      >
        <DishFeedbackActionButton danger icon={Trash2} onClick={() => runAction(onDelete)}>
          삭제
        </DishFeedbackActionButton>
        <DishFeedbackActionButton icon={Pencil} onClick={() => runAction(onEdit)}>
          편집
        </DishFeedbackActionButton>
        <DishFeedbackActionButton icon={Send} onClick={() => runAction(onShare)}>
          공유
        </DishFeedbackActionButton>
      </div>
    </div>
  );
}

function getMinimumAuthorText(text: string, minLength: number) {
  const characters = Array.from(text);

  if (characters.length <= minLength) {
    return text;
  }

  return `${characters.slice(0, minLength).join('')}${AUTHOR_LINE_TRUNCATION_MARK}`;
}

function getAuthorTextToFitWidth({
  getTextWidth,
  minLength,
  text,
  width,
}: {
  getTextWidth: (text: string) => number;
  minLength: number;
  text: string;
  width: number;
}) {
  const characters = Array.from(text);

  if (characters.length <= minLength || getTextWidth(text) <= width) {
    return text;
  }

  const minimumText = getMinimumAuthorText(text, minLength);

  if (getTextWidth(minimumText) >= width) {
    return minimumText;
  }

  let low = minLength + 1;
  let high = characters.length - 1;
  let bestFit = minimumText;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = `${characters.slice(0, middle).join('')}${AUTHOR_LINE_TRUNCATION_MARK}`;

    if (getTextWidth(candidate) <= width) {
      bestFit = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return bestFit;
}

function DishFeedbackAuthorLine({
  authorName,
  onOpenAuthorProfile,
  onOpenSubject,
  subject,
}: {
  authorName: string;
  onOpenAuthorProfile?: () => void;
  onOpenSubject?: () => void;
  subject: string;
}) {
  const lineRef = useRef<HTMLParagraphElement | null>(null);
  const linkMeasureRef = useRef<HTMLSpanElement | null>(null);
  const bodyMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [visibleAuthorName, setVisibleAuthorName] = useState(authorName);
  const [visibleSubject, setVisibleSubject] = useState(subject);
  const textLinkClassName =
    'font-semibold underline-offset-2 transition-colors hover:text-[var(--tb-color-text-primary)] hover:underline focus-visible:rounded-[var(--tb-radius-6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]';

  useLayoutEffect(() => {
    const lineElement = lineRef.current;
    const linkMeasureElement = linkMeasureRef.current;
    const bodyMeasureElement = bodyMeasureRef.current;

    if (!lineElement || !linkMeasureElement || !bodyMeasureElement) {
      return;
    }

    const getLinkTextWidth = (text: string) => {
      linkMeasureElement.textContent = text;
      return linkMeasureElement.scrollWidth;
    };
    const getBodyTextWidth = (text: string) => {
      bodyMeasureElement.textContent = text;
      return bodyMeasureElement.scrollWidth;
    };
    const minimumAuthorName = getMinimumAuthorText(authorName, MIN_AUTHOR_NAME_LENGTH);

    const updateVisibleTexts = () => {
      const fixedWidth =
        getBodyTextWidth('님이\u00a0') + getBodyTextWidth('의 후기를 남기셨습니다.');
      const availableLinkWidth = lineElement.clientWidth - fixedWidth;
      const fullAuthorWidth = getLinkTextWidth(authorName);
      const fullSubjectWidth = getLinkTextWidth(subject);

      if (fullAuthorWidth + fullSubjectWidth <= availableLinkWidth) {
        setVisibleAuthorName(authorName);
        setVisibleSubject(subject);
        return;
      }

      const minimumAuthorWidth = getLinkTextWidth(minimumAuthorName);
      const authorWidthWithFullSubject = availableLinkWidth - fullSubjectWidth;

      if (authorWidthWithFullSubject >= minimumAuthorWidth) {
        setVisibleAuthorName(
          getAuthorTextToFitWidth({
            getTextWidth: getLinkTextWidth,
            minLength: MIN_AUTHOR_NAME_LENGTH,
            text: authorName,
            width: authorWidthWithFullSubject,
          }),
        );
        setVisibleSubject(subject);
        return;
      }

      setVisibleAuthorName(minimumAuthorName);
      setVisibleSubject(
        getAuthorTextToFitWidth({
          getTextWidth: getLinkTextWidth,
          minLength: MIN_AUTHOR_SUBJECT_LENGTH,
          text: subject,
          width: Math.max(0, availableLinkWidth - minimumAuthorWidth),
        }),
      );
    };

    updateVisibleTexts();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateVisibleTexts);

      return () => {
        window.removeEventListener('resize', updateVisibleTexts);
      };
    }

    const resizeObserver = new ResizeObserver(updateVisibleTexts);
    resizeObserver.observe(lineElement);
    window.addEventListener('resize', updateVisibleTexts);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateVisibleTexts);
    };
  }, [authorName, subject]);

  return (
    <p
      ref={lineRef}
      className="relative flex min-w-0 w-full max-w-full items-baseline overflow-hidden whitespace-nowrap text-[14px] font-normal leading-snug text-[var(--tb-color-text-primary)]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap font-semibold"
        ref={linkMeasureRef}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap font-normal"
        ref={bodyMeasureRef}
      />
      {onOpenAuthorProfile ? (
        <button
          type="button"
          className={`min-w-0 shrink-0 overflow-hidden whitespace-nowrap ${textLinkClassName}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenAuthorProfile();
          }}
          title={authorName}
        >
          {visibleAuthorName}
        </button>
      ) : (
        <span className="min-w-0 shrink-0 overflow-hidden whitespace-nowrap font-semibold" title={authorName}>
          {visibleAuthorName}
        </span>
      )}
      <span className="shrink-0 whitespace-nowrap">님이&nbsp;</span>
      {onOpenSubject ? (
        <button
          type="button"
          className={`min-w-0 shrink-0 overflow-hidden whitespace-nowrap ${textLinkClassName}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenSubject();
          }}
          title={subject}
        >
          {visibleSubject}
        </button>
      ) : (
        <span className="min-w-0 shrink-0 overflow-hidden whitespace-nowrap font-semibold" title={subject}>
          {visibleSubject}
        </span>
      )}
      <span className="shrink-0 whitespace-nowrap">의 후기를 남기셨습니다.</span>
    </p>
  );
}

function DishFeedbackImageRail({
  images,
  subject,
  unframed = false,
}: {
  images: readonly DishFeedbackCardImage[];
  subject: string;
  unframed?: boolean;
}) {
  const safeImages = images.filter((image) => Boolean(image.imageSrc));
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const railElement = railRef.current;

    if (railElement) {
      railElement.scrollLeft = 0;
    }
  }, [subject, unframed, safeImages.length]);

  if (safeImages.length === 0) {
    return null;
  }

  const railBleedOffset = unframed ? '-20px' : 'calc(var(--tb-space-12) * -1)';
  const railInset = unframed ? '20px' : 'var(--tb-space-12)';
  const railWidth = unframed ? '100dvw' : 'calc(100% + (var(--tb-space-12) * 2))';
  const tileMaxSize = '220px';
  const visibleTileCount = 2.25;
  const tileSize = unframed
    ? `min(calc((100dvw - 40px - 16px) / ${visibleTileCount}), ${tileMaxSize})`
    : `min(calc((100% - 16px) / ${visibleTileCount}), ${tileMaxSize})`;

  return (
    <div
      className="overflow-x-auto pb-1 no-scrollbar"
      ref={railRef}
      style={{
        marginInlineStart: railBleedOffset,
        overscrollBehaviorY: 'auto',
        touchAction: 'pan-x pan-y',
        width: railWidth,
      }}
    >
      <div className="flex w-full gap-2" style={{ paddingInline: railInset }}>
        {safeImages.map((image, index) => (
          <ImageBox
            alt={image.alt}
            className="aspect-square rounded-[var(--tb-radius-12)]"
            fallbackIconSize={ICON_TOKENS.size.xl}
            imageSrc={image.imageSrc}
            key={`${subject}-${image.alt}-${index}`}
            kind="menu"
            style={{
              flex: `0 0 ${tileSize}`,
              width: tileSize,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DetailMoreChip({ count }: { count: number }) {
  return (
    <TasteChip
      className="shrink-0"
      taste={`+${count}`}
      title={`${count}개 태그 더 있음`}
      tone="neutral"
    />
  );
}

function DetailTagRow({ tags }: { tags: readonly DishFeedbackCardTag[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const counterMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);
  const tagSignature = tags.map((tag) => `${tag.id}:${tag.label}`).join('|');

  useLayoutEffect(() => {
    const containerElement = containerRef.current;
    const measureElement = measureRef.current;

    if (!containerElement || !measureElement) {
      return;
    }

    let animationFrameId = 0;

    const updateVisibleCount = () => {
      const availableWidth = containerElement.clientWidth;
      const tagElements = Array.from(
        measureElement.querySelectorAll<HTMLElement>('[data-dish-feedback-detail-tag="true"]'),
      );

      if (availableWidth <= 0 || tagElements.length === 0) {
        setVisibleCount(tags.length);
        return;
      }

      const tagWidths = tagElements.map((tagElement) => tagElement.offsetWidth);
      const moreChipWidth = counterMeasureRef.current?.offsetWidth ?? 0;
      let nextVisibleCount = 0;

      for (let count = tagWidths.length; count >= 0; count -= 1) {
        const hiddenCount = tagWidths.length - count;
        const visibleElementCount = count + (hiddenCount > 0 ? 1 : 0);
        const gapWidth = Math.max(0, visibleElementCount - 1) * DETAIL_TAG_GAP;
        const tagsWidth = tagWidths
          .slice(0, count)
          .reduce((totalWidth, tagWidth) => totalWidth + tagWidth, 0);
        const requiredWidth = tagsWidth + (hiddenCount > 0 ? moreChipWidth : 0) + gapWidth;

        if (requiredWidth <= availableWidth) {
          nextVisibleCount = count;
          break;
        }
      }

      setVisibleCount((currentVisibleCount) =>
        currentVisibleCount === nextVisibleCount ? currentVisibleCount : nextVisibleCount,
      );
    };

    const requestUpdate = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateVisibleCount);
    };

    requestUpdate();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', requestUpdate);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', requestUpdate);
      };
    }

    const resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(containerElement);
    resizeObserver.observe(measureElement);
    window.addEventListener('resize', requestUpdate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', requestUpdate);
    };
  }, [tagSignature, tags.length]);

  const resolvedVisibleCount = Math.min(visibleCount, tags.length);
  const hiddenCount = Math.max(0, tags.length - resolvedVisibleCount);

  return (
    <div className="relative min-w-0 w-full" ref={containerRef}>
      <div className="flex w-full flex-nowrap items-center gap-[6px] overflow-hidden">
        {tags.slice(0, resolvedVisibleCount).map((tag) => (
          <TasteChip
            className="shrink-0"
            key={tag.id}
            taste={tag.label}
            tone="neutral"
            title={tag.title}
          />
        ))}
        {hiddenCount > 0 ? <DetailMoreChip count={hiddenCount} /> : null}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max flex-nowrap items-center gap-[6px]"
        ref={measureRef}
      >
        {tags.map((tag) => (
          <TasteChip
            className="shrink-0"
            data-dish-feedback-detail-tag="true"
            key={tag.id}
            taste={tag.label}
            tone="neutral"
            title={tag.title}
          />
        ))}
        <span ref={counterMeasureRef}>
          <DetailMoreChip count={tags.length} />
        </span>
      </div>
    </div>
  );
}

function TasteBubbleRow({
  bubbles,
}: {
  bubbles: readonly DishFeedbackCardTasteBubble[];
}) {
  return (
    <div className="flex w-full flex-wrap items-start gap-[6px]">
      {bubbles.map((bubble) => (
        <TasteChip
          className="max-w-full px-3 py-1.5 text-[10px] font-semibold leading-none"
          colorTaste={bubble.colorTaste}
          key={bubble.id}
          taste={bubble.label}
          title={bubble.title ?? bubble.colorTaste}
          tone={bubble.colorTaste ? 'taste' : 'neutral'}
        />
      ))}
    </div>
  );
}

const DINING_NOTE_CLAMP_LINES = 4;

function DiningNotePreview({ summary }: { summary: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLParagraphElement | null>(null);
  const measureButtonRef = useRef<HTMLButtonElement | null>(null);
  const measureSummaryRef = useRef<HTMLSpanElement | null>(null);
  const [collapsedSummary, setCollapsedSummary] = useState(summary);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [summary]);

  useLayoutEffect(() => {
    const containerElement = containerRef.current;
    const measureElement = measureRef.current;
    const measureButtonElement = measureButtonRef.current;
    const measureSummaryElement = measureSummaryRef.current;

    if (!containerElement || !measureElement || !measureButtonElement || !measureSummaryElement) {
      return;
    }

    let animationFrameId = 0;

    const updateCollapsedSummary = () => {
      const lineHeight = Number.parseFloat(window.getComputedStyle(measureElement).lineHeight);
      const maxCollapsedHeight = Number.isFinite(lineHeight)
        ? lineHeight * DINING_NOTE_CLAMP_LINES
        : 0;

      measureButtonElement.style.display = 'none';
      measureSummaryElement.textContent = summary;

      if (maxCollapsedHeight <= 0 || measureElement.scrollHeight <= maxCollapsedHeight + 1) {
        setCollapsedSummary((currentSummary) => (currentSummary === summary ? currentSummary : summary));
        setIsOverflowing(false);
        return;
      }

      measureButtonElement.style.display = 'inline';

      const summaryCharacters = Array.from(summary);
      let low = 0;
      let high = summaryCharacters.length;
      let bestFit = '';

      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const candidate = summaryCharacters.slice(0, middle).join('').trimEnd();

        measureSummaryElement.textContent = candidate;

        if (measureElement.scrollHeight <= maxCollapsedHeight + 1) {
          bestFit = candidate;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      setCollapsedSummary((currentSummary) => (currentSummary === bestFit ? currentSummary : bestFit));
      setIsOverflowing(true);
    };

    const requestUpdate = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateCollapsedSummary);
    };

    requestUpdate();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', requestUpdate);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', requestUpdate);
      };
    }

    const resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(containerElement);
    window.addEventListener('resize', requestUpdate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', requestUpdate);
    };
  }, [summary]);

  const visibleSummary = isOverflowing && !isExpanded ? collapsedSummary : summary;

  return (
    <div
      className="relative w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-3"
      ref={containerRef}
    >
      <p className="text-[12px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]">
        <span className="font-semibold text-[var(--tb-color-text-primary)]">미식 노트: </span>
        {visibleSummary}
        {isOverflowing ? (
          <>
            {' '}
            <button
              type="button"
              className="inline font-semibold text-[var(--tb-color-text-faint)] underline-offset-2 hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                setIsExpanded((current) => !current);
              }}
            >
              {isExpanded ? '접기' : '.. 더보기'}
            </button>
          </>
        ) : null}
      </p>

      <p
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-3 right-3 top-3 text-[12px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]"
        ref={measureRef}
      >
        <span className="font-semibold text-[var(--tb-color-text-primary)]">미식 노트: </span>
        <span ref={measureSummaryRef} />
        {' '}
        <button
          type="button"
          className="inline font-semibold text-[var(--tb-color-text-faint)]"
          ref={measureButtonRef}
        >
          .. 더보기
        </button>
      </p>
    </div>
  );
}

export function DishFeedbackCardSkeleton({ unframed = false }: { unframed?: boolean }) {
  const content = (
    <>
      <div className="flex min-w-0 w-full items-center gap-2">
        <DishFeedbackSkeletonShape className="size-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <DishFeedbackSkeletonShape className="h-[14px] w-[78%] max-w-[360px] rounded-full" />
          <DishFeedbackSkeletonShape className="mt-[7px] h-[10px] w-[36%] max-w-[180px] rounded-full" />
        </div>
        <DishFeedbackSkeletonShape className="size-8 shrink-0 rounded-full" />
      </div>

      <div className="flex w-full">
        <DishFeedbackSkeletonShape
          className="aspect-square rounded-[var(--tb-radius-12)]"
          style={{ width: 'min(calc((100% - 16px) / 2.25), 220px)' }}
        />
      </div>

      <div className="flex w-full flex-col gap-[6px]">
        <div className="flex w-full flex-wrap items-start gap-[6px]">
          {SKELETON_TASTE_CHIP_WIDTHS.map((width) => (
            <DishFeedbackSkeletonShape
              className="h-[26px] rounded-full"
              key={`taste-skeleton-${width}`}
              style={{ width }}
            />
          ))}
        </div>
        <div className="flex w-full flex-nowrap items-center gap-[6px] overflow-hidden">
          {SKELETON_DETAIL_CHIP_WIDTHS.map((width) => (
            <DishFeedbackSkeletonShape
              className="h-[26px] shrink-0 rounded-full"
              key={`detail-skeleton-${width}`}
              style={{ width }}
            />
          ))}
        </div>
      </div>

      <DishFeedbackSkeletonShape className="h-[76px] w-full rounded-[var(--tb-radius-12)]" />

      <div className="flex w-full items-center gap-2 border-t border-[rgba(15,15,15,0.08)] pt-[12px]">
        <span className="flex size-8 items-center justify-center" aria-hidden="true">
          <DishFeedbackSkeletonShape className="size-5 rounded-full" />
        </span>
        <span className="flex size-8 items-center justify-center" aria-hidden="true">
          <DishFeedbackSkeletonShape className="size-5 rounded-full" />
        </span>
        <span className="flex size-8 items-center justify-center" aria-hidden="true">
          <DishFeedbackSkeletonShape className="size-5 rounded-full" />
        </span>
        <DishFeedbackSkeletonShape className="ml-auto h-[11px] w-[72px] rounded-full" />
      </div>
    </>
  );
  const framedContent = unframed ? (
    <div className="flex w-full flex-col items-start gap-[12px]">{content}</div>
  ) : (
    <SectionCard hoverEffect={false} className="min-w-0 max-w-full gap-[12px]">
      {content}
    </SectionCard>
  );

  return (
    <article
      aria-busy="true"
      aria-label="디시 기록을 불러오는 중"
      className="block min-w-0 w-full max-w-full overflow-hidden text-left"
    >
      {framedContent}
    </article>
  );
}

export default function DishFeedbackCard({
  actions,
  card,
  commentCount = 0,
  interactive = true,
  onLike,
  onOpenAuthorProfile,
  onOpenComments,
  onOpenSubject,
  onSelect,
  unframed = false,
}: DishFeedbackCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const isCardInteractive = interactive && Boolean(onSelect);
  const hasActions = Boolean(actions);

  useEffect(() => {
    if (!isActionSheetOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsActionSheetOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActionSheetOpen]);

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isCardInteractive || event.defaultPrevented || event.target !== event.currentTarget) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
    }
  };
  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);

    if (nextIsLiked) {
      onLike?.();
    }
  };
  const handleCommentClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onOpenComments?.();
  };
  const handleShareClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    actions?.onShare?.();
  };
  const content = (
    <>
      <div className="flex min-w-0 w-full items-center gap-2">
        <PalateBloomAvatar
          ariaLabel={`${card.author.displayName} 프로필 아바타`}
          imageSrc={card.author.avatarImageSrc}
          profile={card.author.avatarProfile ?? DEFAULT_PALATE_BLOOM_PROFILE}
          shapeSeed={card.author.shapeSeed}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <DishFeedbackAuthorLine
            authorName={card.author.displayName}
            onOpenAuthorProfile={onOpenAuthorProfile}
            onOpenSubject={onOpenSubject}
            subject={card.subject}
          />
          <p className="max-w-full truncate text-[12px] text-[var(--tb-color-text-muted)]">
            {card.restaurantName}
            <span aria-hidden="true"> · </span>
            {card.relativeDateLabel}
          </p>
        </div>
        {hasActions ? (
          <button
            type="button"
            aria-label="디시 카드 옵션"
            aria-expanded={isActionSheetOpen}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--tb-color-text-muted)] transition-colors hover:bg-[var(--tb-color-surface-muted)] hover:text-[var(--tb-color-text-primary)]"
            onClick={(event) => {
              event.stopPropagation();
              setIsActionSheetOpen(true);
            }}
          >
            <MoreHorizontal size={ICON_TOKENS.size.md} strokeWidth={ICON_TOKENS.strokeWidth.regular} />
          </button>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-3">
        <DishFeedbackImageRail images={card.images} subject={card.subject} unframed={unframed} />
      </div>

      {card.tasteBubbles.length > 0 || card.detailTags.length > 0 ? (
        <div className="flex w-full flex-col gap-[6px]">
          {card.tasteBubbles.length > 0 ? <TasteBubbleRow bubbles={card.tasteBubbles} /> : null}
          {card.detailTags.length > 0 ? <DetailTagRow tags={card.detailTags} /> : null}
        </div>
      ) : null}

      <DiningNotePreview summary={card.synthesisSummary} />

      <div className="flex w-full items-center gap-2 border-t border-[rgba(15,15,15,0.08)] pt-[12px]">
        <button
          type="button"
          aria-label={isLiked ? '좋아요 취소' : '좋아요'}
          aria-pressed={isLiked}
          className={`flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-color-surface-muted)] ${
            isLiked ? 'text-[var(--tb-user-accent-main)]' : 'text-[var(--tb-color-text-muted)]'
          }`}
          onClick={handleLikeClick}
        >
          <Heart
            fill={isLiked ? 'currentColor' : 'none'}
            size={ICON_TOKENS.size.md}
            strokeWidth={ICON_TOKENS.strokeWidth.regular}
          />
        </button>
        <button
          type="button"
          aria-label="댓글"
          className={`flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-color-surface-muted)] ${
            commentCount > 0
              ? 'text-[var(--tb-color-text-primary)]'
              : 'text-[var(--tb-color-text-muted)]'
          }`}
          onClick={handleCommentClick}
        >
          <MessageCircle size={ICON_TOKENS.size.md} strokeWidth={ICON_TOKENS.strokeWidth.regular} />
        </button>
        <button
          type="button"
          aria-label="공유"
          className="flex size-8 items-center justify-center rounded-full text-[var(--tb-color-text-muted)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
          onClick={handleShareClick}
        >
          <Send size={ICON_TOKENS.size.md} strokeWidth={ICON_TOKENS.strokeWidth.regular} />
        </button>
        <span className="ml-auto shrink-0 whitespace-nowrap text-right text-[11px] font-normal text-[var(--tb-color-text-muted)]">
          {card.absoluteDateLabel}
        </span>
      </div>
      {isActionSheetOpen ? (
        <DishFeedbackActionSheet
          onClose={() => setIsActionSheetOpen(false)}
          onDelete={() => {
            setIsDeleteConfirmOpen(true);
          }}
          onEdit={actions?.onEdit}
          onShare={actions?.onShare}
          subject={card.subject}
        />
      ) : null}
      {isDeleteConfirmOpen ? (
        <ActionOverlayCard
          title="이 디시 기록을 삭제할까요?"
          description="삭제하면 나의 디시에서 이 기록이 사라집니다."
          layout="split"
          onBackdropClick={() => setIsDeleteConfirmOpen(false)}
          actions={[
            {
              label: '취소',
              onClick: () => setIsDeleteConfirmOpen(false),
            },
            {
              label: '삭제',
              tone: 'destructive',
              onClick: () => {
                setIsDeleteConfirmOpen(false);
                actions?.onDelete?.();
              },
            },
          ]}
        />
      ) : null}
    </>
  );
  const framedContent = unframed ? (
    <div className="flex w-full flex-col items-start gap-[12px]">{content}</div>
  ) : (
    <SectionCard hoverEffect={false} className="min-w-0 max-w-full gap-[12px]">
      {content}
    </SectionCard>
  );

  if (!isCardInteractive) {
    return <article className="block min-w-0 w-full max-w-full overflow-hidden text-left">{framedContent}</article>;
  }

  return (
    <article
      role="button"
      tabIndex={0}
      className="block min-w-0 w-full max-w-full overflow-hidden text-left"
      onClick={onSelect}
      onKeyDown={handleCardKeyDown}
    >
      {framedContent}
    </article>
  );
}
