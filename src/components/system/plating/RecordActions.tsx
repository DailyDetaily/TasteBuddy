import type { MouseEventHandler } from "react";
import IconActionButton from "./IconActionButton";

type Props = {
  isRecorded?: boolean;
  isBookmarked?: boolean;
  disabled?: boolean;
  activeColor?: string;
  recordLabel?: string;
  bookmarkLabel?: string;
  onRecord?: MouseEventHandler<HTMLButtonElement>;
  onBookmark?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export default function RecordActions({ isRecorded = false, isBookmarked = false, disabled, activeColor, recordLabel, bookmarkLabel, onRecord, onBookmark, className = "" }: Props) {
  return <div className={`tb-record-actions ${className}`} role="group" aria-label="기록과 북마크">
    {onRecord && <IconActionButton kind="save" active={isRecorded} disabled={disabled} activeColor={activeColor} label={recordLabel} onClick={onRecord} />}
    {onBookmark && <IconActionButton kind="bookmark" active={isBookmarked} disabled={disabled} activeColor={activeColor} label={bookmarkLabel} onClick={onBookmark} />}
  </div>;
}
