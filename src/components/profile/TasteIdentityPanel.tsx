import { Compass, Eye, ShieldCheck, UsersRound } from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';
import {
  getTasteTint,
  getTasteTintSurface,
  getTasteTintSurfaceSubText,
  getTasteTintSurfaceText,
} from '../../constants/tasteColors';
import type {
  PublicTasteProfile,
  TasteIdentitySignal,
  TasteProfileSnapshot,
  TasteSimilarityEdge,
} from '../../types/tasteBuddyAgent';
import SectionTitle from '../system/SectionTitle';
import TasteChip from '../system/TasteChip';

interface TasteIdentityPanelProps {
  profile: TasteProfileSnapshot;
  publicProfiles?: PublicTasteProfile[];
  similarityEdges?: TasteSimilarityEdge[];
}

function getSignalTone(signal: TasteIdentitySignal) {
  return signal.tasteId ? signal.label : '감칠맛';
}

function SignalCard({ signal }: { signal: TasteIdentitySignal }) {
  const tasteLabel = getSignalTone(signal);

  return (
    <div
      className="rounded-[16px] border p-3"
      style={{
        backgroundColor: getTasteTintSurface(tasteLabel),
        borderColor: getTasteTint(tasteLabel, 0.18),
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="min-w-0 truncate text-[13px] font-bold"
          style={{ color: getTasteTintSurfaceText(tasteLabel) }}
        >
          {signal.label}
        </p>
        <span
          className="shrink-0 rounded-full bg-white/50 px-2 py-1 text-[10px] font-semibold"
          style={{ color: getTasteTintSurfaceText(tasteLabel) }}
        >
          {Math.round(signal.confidence * 100)}%
        </span>
      </div>
      <p
        className="mt-2 text-[12px] leading-relaxed"
        style={{ color: getTasteTintSurfaceSubText(tasteLabel) }}
      >
        {signal.summary}
      </p>
    </div>
  );
}

export default function TasteIdentityPanel({
  profile,
  publicProfiles = [],
  similarityEdges = [],
}: TasteIdentityPanelProps) {
  const topSignals = profile.stablePatterns.slice(0, 4);
  const watchPoints = profile.watchPoints.slice(0, 2);
  const similarProfiles = publicProfiles.slice(0, 3);

  return (
    <div className="tb-section-stack">
      <section className="rounded-[20px] bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--tb-color-surface-muted)]">
            <ShieldCheck size={ICON_TOKENS.size.md} className="text-[var(--tb-color-icon-primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
              Taste Identity · {profile.stage}
            </p>
            <h2 className="mt-1 text-[18px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
              {profile.tasteSignature}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              점수보다 반복되는 감각 패턴을 먼저 보고, 비슷한 입맛의 공개 리뷰와 연결합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="tb-card-stack">
        <SectionTitle as="h3" size="md">
          안정적으로 읽히는 신호
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {topSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </section>

      <section className="rounded-[20px] bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--tb-color-surface-muted)]">
            <Eye size={ICON_TOKENS.size.base} className="text-[var(--tb-color-icon-primary)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[var(--tb-color-text-primary)]">
              더 확인할 미각
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {watchPoints.map((signal) => (
                <TasteChip
                  key={signal.id}
                  colorTaste={getSignalTone(signal)}
                  taste={signal.label}
                  value={`${Math.round(signal.confidence * 100)}%`}
                />
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              낮은 confidence나 높은 민감도는 다음 리뷰에서 우선 확인합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="tb-card-stack">
        <SectionTitle as="h3" size="md">
          비슷한 입맛
        </SectionTitle>
        <div className="grid gap-3">
          {similarProfiles.length === 0 ? (
            <div className="rounded-[20px] bg-white p-4">
              <div className="flex gap-3">
                <UsersRound size={ICON_TOKENS.size.lg} className="text-[var(--tb-color-icon-muted)]" />
                <div>
                  <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                    아직 공개된 유사 프로필이 부족해요
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    공개 리뷰가 쌓이면 Taste Twin과 Similar Palate가 이곳에 정리됩니다.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {similarProfiles.map((publicProfile) => {
            const edge = similarityEdges.find((item) => item.targetUserId === publicProfile.userId);
            return (
              <article key={publicProfile.userId} className="rounded-[20px] bg-white p-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--tb-color-surface-muted)]">
                    <Compass size={ICON_TOKENS.size.md} className="text-[var(--tb-color-icon-primary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                        {publicProfile.displayName}
                      </p>
                      <span className="shrink-0 rounded-full bg-[var(--tb-color-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--tb-color-text-muted)]">
                        {edge?.similarityScore ?? 0}%
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                      @{publicProfile.nickname}
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      {publicProfile.tasteSignature}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
