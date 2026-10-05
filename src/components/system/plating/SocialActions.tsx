import type { MouseEventHandler } from "react";
import IconActionButton from "./IconActionButton";

type Props = {
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  disabled?: boolean;
  accentColor?: string;
  onLike: MouseEventHandler<HTMLButtonElement>;
  onComment?: MouseEventHandler<HTMLButtonElement>;
  onShare: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export default function SocialActions({ isLiked = false, likeCount, commentCount, shareCount, disabled, accentColor = "var(--tb-user-accent-main)", onLike, onComment, onShare, className = "" }: Props) {
  return <div className={`tb-social-actions ${className}`} role="group" aria-label="좋아요, 댓글, 공유">
    <IconActionButton kind="like" active={isLiked} count={likeCount} disabled={disabled} activeColor={accentColor} onClick={onLike} />
    <IconActionButton kind="comment" count={commentCount} disabled={disabled} readOnly={!onComment} onClick={onComment} />
    <IconActionButton kind="share" count={shareCount} disabled={disabled} onClick={onShare} />
  </div>;
}
