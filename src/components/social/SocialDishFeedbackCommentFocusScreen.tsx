import {
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { ICON_TOKENS } from '../../constants/designTokens';
import type { TasteMatchFeedItem } from '../../types/tasteBuddyAgent';
import TopAppBar from '../TopAppBar';
import DishFeedbackCard from '../dining/DishFeedbackCard';
import PalateBloomAvatar, {
  DEFAULT_PALATE_BLOOM_PROFILE,
  type TasteProfile as PalateBloomTasteProfile,
} from '../system/PalateBloomAvatar';
import { createSocialDishFeedbackCardViewModel } from './SocialDishFeedbackCard';

interface SocialDishFeedbackCommentFocusScreenProps {
  comments: string[];
  item: TasteMatchFeedItem;
  onBack: () => void;
  onLike?: (item: TasteMatchFeedItem) => void;
  onOpenBuddyProfile?: (item: TasteMatchFeedItem) => void;
  onOpenRestaurantDetail?: (item: TasteMatchFeedItem) => void;
  onSubmitComment: (comment: string) => void;
  viewerAvatarImageSrc?: string | null;
  viewerAvatarProfile?: PalateBloomTasteProfile;
  viewerAvatarShapeSeed?: string;
  viewerNickname: string;
}

export default function SocialDishFeedbackCommentFocusScreen({
  comments,
  item,
  onBack,
  onLike,
  onOpenBuddyProfile,
  onOpenRestaurantDetail,
  onSubmitComment,
  viewerAvatarImageSrc,
  viewerAvatarProfile,
  viewerAvatarShapeSeed,
  viewerNickname,
}: SocialDishFeedbackCommentFocusScreenProps) {
  const [commentDraft, setCommentDraft] = useState('');
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextComment = commentDraft.trim();

    if (!nextComment) {
      return;
    }

    onSubmitComment(nextComment);
    setCommentDraft('');
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-focus)] animate-slideIn">
      <TopAppBar
        appearance="transparent"
        showBack
        onBack={onBack}
        rightActions={
          <div
            aria-hidden="true"
            style={{
              height: ICON_TOKENS.container.lg,
              width: ICON_TOKENS.container.lg,
            }}
          />
        }
      />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-5 px-5 pb-6">
          <DishFeedbackCard
            card={createSocialDishFeedbackCardViewModel(item)}
            commentCount={comments.length}
            interactive={false}
            onLike={() => onLike?.(item)}
            onOpenAuthorProfile={() => onOpenBuddyProfile?.(item)}
            onOpenComments={() => commentInputRef.current?.focus()}
            onOpenSubject={() => onOpenRestaurantDetail?.(item)}
            unframed
          />

          <section className="py-1">
            <h2 className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              댓글
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div
                    className="flex items-start gap-3"
                    key={`${item.id}-focus-comment-${index}`}
                  >
                    <PalateBloomAvatar
                      ariaLabel={`${viewerNickname} 댓글 작성자 아바타`}
                      imageSrc={viewerAvatarImageSrc}
                      profile={viewerAvatarProfile ?? DEFAULT_PALATE_BLOOM_PROFILE}
                      shapeSeed={viewerAvatarShapeSeed}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-tight text-[var(--tb-color-text-primary)]">
                        {viewerNickname}
                      </p>
                      <p className="mt-0 text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]">
                        {comment}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] font-normal leading-relaxed text-[var(--tb-color-text-muted)]">
                  아직 댓글이 없어요. 이 디시에 남긴 감상을 짧게 이어갈 수 있어요.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
      <form
        className="flex shrink-0 items-center gap-3 border-t border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-5 pb-[max(14px,var(--tb-safe-area-bottom))] pt-3"
        onSubmit={handleSubmit}
      >
        <PalateBloomAvatar
          ariaLabel={`${viewerNickname} 댓글 입력 아바타`}
          imageSrc={viewerAvatarImageSrc}
          profile={viewerAvatarProfile ?? DEFAULT_PALATE_BLOOM_PROFILE}
          shapeSeed={viewerAvatarShapeSeed}
          size="md"
        />
        <div className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-4 text-left transition-colors hover:bg-[var(--tb-color-surface-disabled)]">
          <input
            ref={commentInputRef}
            aria-label="댓글 입력"
            className="h-full min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-muted)] focus:ring-0"
            onChange={(event) => setCommentDraft(event.target.value)}
            placeholder="댓글을 남겨보세요"
            value={commentDraft}
          />
        </div>
        <button
          type="submit"
          className="shrink-0 text-[13px] font-semibold text-[var(--tb-color-text-body)] transition-colors hover:text-[var(--tb-color-text-primary)] disabled:text-[var(--tb-color-text-hint)]"
          disabled={!commentDraft.trim()}
        >
          등록
        </button>
      </form>
    </div>
  );
}
