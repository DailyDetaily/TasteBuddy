import type { MouseEvent } from 'react';

import Chip from '../system/Chip';
import { cn } from '../ui/utils';
import { getFilePreviewHref } from './filePreviewRegistry';

type SourceFileLinkVariant = 'block' | 'chip' | 'inline';

interface SourceFileLinkProps {
  className?: string;
  file: string;
  label?: string;
  variant?: SourceFileLinkVariant;
}

const FILE_PATH_PATTERN = /(src\/[A-Za-z0-9_./-]+\.(?:tsx|ts|css|md))/g;
const FILE_PATH_SEGMENT_PATTERN = /^src\/[A-Za-z0-9_./-]+\.(?:tsx|ts|css|md)$/;

function getVariantClassName(variant: Exclude<SourceFileLinkVariant, 'chip'>) {
  if (variant === 'block') {
    return 'block min-w-0 max-w-full cursor-pointer whitespace-normal break-all font-mono text-[11px] leading-relaxed text-[var(--tb-color-text-primary)]';
  }

  return 'inline cursor-pointer text-current underline decoration-[rgba(15,15,15,0.25)] underline-offset-[0.18em] transition-colors';
}

export function SourceFileLink({
  className,
  file,
  label,
  variant = 'inline',
}: SourceFileLinkProps) {
  const href = getFilePreviewHref(file);
  const content = label ?? file;
  const baseClassName = variant === 'chip' ? null : getVariantClassName(variant);

  if (!href) {
    if (variant === 'chip') {
      return (
        <Chip className={className} size="xs">
          {content}
        </Chip>
      );
    }

    return <span className={cn(baseClassName, className)}>{content}</span>;
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) {
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.location.assign(href);
  };

  if (variant === 'chip') {
    return (
      <Chip
        asChild
        size="xs"
        className={cn(
          'cursor-pointer font-mono hover:border-[var(--tb-color-text-primary)] hover:bg-[var(--tb-color-surface-base)] hover:text-[var(--tb-color-text-primary)]',
          className,
        )}
      >
        <a
          href={href}
          title={`${file} 라이브 프리뷰 보기`}
          onClick={handleClick}
        >
          {content}
        </a>
      </Chip>
    );
  }

  return (
    <a
      href={href}
      title={`${file} 라이브 프리뷰 보기`}
      onClick={handleClick}
      className={cn(
        baseClassName,
        variant === 'block' && 'hover:text-[var(--tb-color-text-primary)]',
        variant === 'inline' && 'hover:text-[var(--tb-color-text-primary)]',
        className,
      )}
    >
      {content}
    </a>
  );
}

interface PreviewableSourceTextProps {
  className?: string;
  value: string;
}

export default function PreviewableSourceText({
  className,
  value,
}: PreviewableSourceTextProps) {
  const parts = value.split(FILE_PATH_PATTERN);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) {
          return null;
        }

        if (FILE_PATH_SEGMENT_PATTERN.test(part)) {
          return (
            <SourceFileLink
              key={`${part}-${index}`}
              file={part}
            />
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </span>
  );
}
