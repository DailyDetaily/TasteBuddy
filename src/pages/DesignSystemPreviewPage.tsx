import { useMemo, useState } from 'react';

import { DiningAiAnalysisScreen, DiningFeedbackScreen } from '../components/reservation/DiningFeedbackFlow';
import {
  createDiningFeedbackDraft,
  getDiningFeedbackScenario,
  type DiningFeedbackDraft,
} from '../constants/diningFeedbackData';
import { createInitialTasteMeasurementSnapshot } from '../constants/tasteMeasurementData';
import AnalysisPage from './AnalysisPage';
import OnboardingScreen from './OnboardingScreen';
import ProfilePage from './ProfilePage';
import TeastickConnectScreen from './TeastickConnectScreen';

interface OverlayNote {
  id: string;
  left: string;
  top: string;
}

interface ShowcaseSectionProps {
  description: string;
  notes: Array<{ id: string; text: string }>;
  overlayNotes?: OverlayNote[];
  title: string;
  children: React.ReactNode;
}

function OverlayBadge({ id, left, top }: OverlayNote) {
  return (
    <div
      className="absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[rgba(15,15,15,0.88)] text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(15,15,15,0.25)]"
      style={{ left, top }}
    >
      {id}
    </div>
  );
}

function ShowcaseSection({
  children,
  description,
  notes,
  overlayNotes = [],
  title,
}: ShowcaseSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[32px] border border-[var(--tb-color-border-default)] bg-white p-4 shadow-[0_12px_30px_rgba(15,15,15,0.06)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">{title}</h2>
        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">{description}</p>
      </div>

      <div className="relative mx-auto w-full max-w-[390px] overflow-hidden rounded-[32px] border border-[var(--tb-color-border-default)] bg-white shadow-[0_24px_60px_rgba(15,15,15,0.12)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-3">
          <div className="h-1.5 w-24 rounded-full bg-[var(--tb-color-border-strong)]" />
        </div>
        <div className="relative h-[844px] overflow-hidden bg-white">
          {overlayNotes.map((note) => (
            <OverlayBadge key={`${title}-${note.id}-${note.left}-${note.top}`} {...note} />
          ))}
          {children}
        </div>
      </div>

      <div className="grid gap-2">
        {notes.map((note) => (
          <div
            key={`${title}-${note.id}`}
            className="flex items-start gap-3 rounded-[16px] bg-[var(--tb-color-surface-muted)] px-3 py-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--tb-color-text-primary)] text-[11px] font-bold text-[var(--tb-color-text-inverse)]">
              {note.id}
            </span>
            <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">{note.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DesignSystemPreviewPage() {
  const measurementSnapshot = useMemo(() => createInitialTasteMeasurementSnapshot(), []);
  const diningScenario = useMemo(() => getDiningFeedbackScenario(3), []);
  const initialDraft = useMemo(
    () => (diningScenario ? createDiningFeedbackDraft(diningScenario) : null),
    [diningScenario],
  );
  const [draft, setDraft] = useState<DiningFeedbackDraft | null>(initialDraft);
  const focusSection =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('focus');
  const isFocusedView = focusSection !== null;

  if (!diningScenario || !draft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--tb-color-surface-muted)] p-6">
        <p className="text-[14px] text-[var(--tb-color-text-primary)]">
          디자인 시스템 미리보기를 준비할 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7F7F7_0%,#FFFFFF_22%,#F7F7F7_100%)] px-4 py-6">
      <div
        className={`mx-auto flex w-full flex-col gap-6 ${
          isFocusedView ? 'max-w-[480px]' : 'max-w-[1480px]'
        }`}
      >
        {!isFocusedView && (
          <div className="rounded-[32px] bg-[var(--tb-color-text-primary)] px-6 py-6 text-[var(--tb-color-text-inverse)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Design System Update Preview
                </p>
                <h1 className="text-[28px] font-bold leading-tight">
                  변경된 요소를 실제 화면 위에 표시한 미리보기
                </h1>
                <p className="max-w-[720px] text-[14px] leading-relaxed text-white/78">
                  숫자 배지가 붙은 위치가 이번에 디자인 시스템 기준으로 정리한 영역입니다. 각 화면은 실제 컴포넌트를 그대로 렌더링합니다.
                </p>
              </div>
              <a
                href="/"
                className="inline-flex h-[44px] items-center justify-center rounded-[var(--tb-radius-10)] bg-white px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)]"
              >
                기본 앱으로 돌아가기
              </a>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${isFocusedView ? 'xl:grid-cols-1' : 'xl:grid-cols-2'}`}>
          {(!focusSection || focusSection === 'onboarding') && (
            <ShowcaseSection
            title="Onboarding"
            description="모션 토큰, 텍스트 컬러, 인디케이터 컬러를 시스템 값으로 맞춘 상태입니다."
            overlayNotes={[
              { id: '1', left: '50%', top: '18%' },
              { id: '2', left: '50%', top: '47%' },
              { id: '3', left: '50%', top: '78%' },
            ]}
            notes={[
              { id: '1', text: '슬라이드 전환 거리를 화면별 하드코딩 대신 모션 토큰 기준으로 통일했습니다.' },
              { id: '2', text: '헤드라인과 본문 컬러를 뉴트럴 텍스트 토큰으로 정리했습니다.' },
              { id: '3', text: '하단 인디케이터의 active/inactive 컬러를 시스템 border/text 계층에 맞췄습니다.' },
            ]}
          >
            <OnboardingScreen onComplete={() => undefined} />
          </ShowcaseSection>
          )}

          {(!focusSection || focusSection === 'teastick') && (
            <ShowcaseSection
            title="Teastick Connect"
            description="드로어 전환과 단계 카드가 공통 motion/neutral 규칙을 따르도록 정돈했습니다."
            overlayNotes={[
              { id: '1', left: '49%', top: '32%' },
              { id: '2', left: '22%', top: '47%' },
              { id: '3', left: '50%', top: '78%' },
            ]}
            notes={[
              { id: '1', text: '제목과 설명 컬러를 text token으로 치환했습니다.' },
              { id: '2', text: '단계 카드의 회색 배경, 경계선, 비활성 배지를 시스템 neutral 값으로 맞췄습니다.' },
              { id: '3', text: '드로어/배경 카드 전환 시간과 easing을 motion token 기반으로 맞췄습니다.' },
            ]}
          >
            <TeastickConnectScreen
              onConnect={() => undefined}
              onSkip={() => undefined}
              initialDrawerOpen
              initialDrawerStep="connected"
            />
          </ShowcaseSection>
          )}

          {(!focusSection || focusSection === 'analysis') && (
            <ShowcaseSection
            title="Analysis"
            description="CTA, 차트, 내비게이션 보조 요소의 색과 모션을 공통 시스템 언어로 정리했습니다."
            overlayNotes={[
              { id: '1', left: '50%', top: '22%' },
              { id: '2', left: '50%', top: '44%' },
              { id: '3', left: '50%', top: '68%' },
            ]}
            notes={[
              { id: '1', text: '요약 카드와 info 버튼의 텍스트/아이콘 톤을 뉴트럴 토큰에 맞췄습니다.' },
              { id: '2', text: '미니 CTA의 반경, 아이콘 박스, 텍스트 명도 계층을 시스템 기준으로 정리했습니다.' },
              { id: '3', text: '레이더/라인 차트의 grid, label, tooltip shadow, dot size를 data viz token으로 연결했습니다.' },
            ]}
          >
            <AnalysisPage measurementSnapshot={measurementSnapshot} onStartMeasurement={() => undefined} />
          </ShowcaseSection>
          )}

          {(!focusSection || focusSection === 'profile') && (
            <ShowcaseSection
            title="Profile"
            description="프로필 헤더, 장치 상태 카드, progress bar의 회색 계층과 아이콘 톤을 통일했습니다."
            overlayNotes={[
              { id: '1', left: '20%', top: '13%' },
              { id: '2', left: '50%', top: '27%' },
              { id: '3', left: '50%', top: '46%' },
            ]}
            notes={[
              { id: '1', text: '아바타 배경과 외곽선이 맛 색 배경/neutral border token을 따르도록 맞췄습니다.' },
              { id: '2', text: '장치 상태 카드 내부 텍스트, 아이콘, 구분선이 시스템 neutral scale로 정리되었습니다.' },
              { id: '3', text: '미각 막대의 track과 보조 텍스트를 공통 border/text token으로 통일했습니다.' },
            ]}
          >
            <ProfilePage measurementSnapshot={measurementSnapshot} onStartMeasurement={() => undefined} />
          </ShowcaseSection>
          )}

          {(!focusSection || focusSection === 'dining-feedback') && (
            <ShowcaseSection
            title="Dining Feedback"
            description="이 화면은 one-off 값이 가장 많았던 영역이라 카드, pill, textarea, 선택 상태를 집중 정리했습니다."
            overlayNotes={[
              { id: '1', left: '50%', top: '16%' },
              { id: '2', left: '26%', top: '32%' },
              { id: '3', left: '50%', top: '56%' },
            ]}
            notes={[
              { id: '1', text: '헤더 카드 배경을 임의 색에서 system muted surface로 통일했습니다.' },
              { id: '2', text: 'rating/choice/meta pill의 border와 text alpha를 시스템 token으로 치환했습니다.' },
              { id: '3', text: 'textarea와 코스 카드 내부 white strip의 반경과 border가 공통 radius/border 규칙을 따릅니다.' },
            ]}
          >
            <DiningFeedbackScreen
              draft={draft}
              onBack={() => undefined}
              onChange={setDraft}
              onSubmit={() => undefined}
              scenario={diningScenario}
            />
          </ShowcaseSection>
          )}

          {(!focusSection || focusSection === 'ai-feedback-analysis') && (
            <ShowcaseSection
            title="AI Feedback Analysis"
            description="강조 카드와 taste-color insight 블록이 neutral base 위에서 taste accent만 쓰도록 정리됐습니다."
            overlayNotes={[
              { id: '1', left: '50%', top: '14%' },
              { id: '2', left: '18%', top: '34%' },
              { id: '3', left: '50%', top: '64%' },
            ]}
            notes={[
              { id: '1', text: '메인 dark card의 badge, 요약 panel radius, 텍스트 계층을 시스템 기준으로 통일했습니다.' },
              { id: '2', text: 'sweet/salty/umami insight 아이콘 박스를 taste token 기반으로 맞췄습니다.' },
              { id: '3', text: '상세 해석 카드의 muted strip, white strip, 보조 텍스트 톤을 공통 규칙으로 정리했습니다.' },
            ]}
          >
            <DiningAiAnalysisScreen
              draft={draft}
              measurementSnapshot={measurementSnapshot}
              onBack={() => undefined}
              onClose={() => undefined}
              scenario={diningScenario}
            />
          </ShowcaseSection>
          )}
        </div>
      </div>
    </div>
  );
}
