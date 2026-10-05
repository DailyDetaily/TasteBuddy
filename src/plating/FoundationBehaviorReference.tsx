import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Layers, X } from "lucide-react";
import { IOS_FOUNDATIONS, nativeMetric } from "./foundationReferenceData";
import { NativeLayoutReference, NativeLayoutKeyboardReference, NativeLayoutDynamicReference, NativeSpacingReference } from "./NativeLayoutReference";
import "./foundation-behavior.css";
const feedback = IOS_FOUNDATIONS.controlFeedback;

function Note({ children }: { children: ReactNode }) {
  return <p className="plfd-note">{children}</p>;
}
function Table({
  caption,
  headings,
  rows,
}: {
  caption: string;
  headings: string[];
  rows: ReactNode[][];
}) {
  return (
    <div
      className="plfd-table-scroll"
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headings.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) =>
                j === 0 ? (
                  <th scope="row" key={j}>
                    {cell}
                  </th>
                ) : (
                  <td key={j}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function LayoutAnatomy() {
  return (
    <div className="plfb-anatomy">
      <div className="plfb-phone" aria-label="iOS 화면 영역 도식">
        <div className="plfb-safe">상단 안전 영역</div>
        <div className="plfb-topbar">
          상단바 <span>32 + 8 + 8 pt</span>
        </div>
        <div className="plfb-content">
          <small>좌우 {nativeMetric("spacing", "page")} pt</small>
          <strong>콘텐츠 영역</strong>
          <p>설명과 기록이 쌓이는 곳</p>
          <div>카드 안쪽 {nativeMetric("spacing", "card")} pt</div>
          <div>다음 섹션까지 {nativeMetric("spacing", "section")} pt</div>
          <span>콘텐츠 스크롤 ↕</span>
        </div>
        <div className="plfb-tabs">
          하단 탭 · 최소 {nativeMetric("sizes", "bottomTabBarHeight")} pt
        </div>
        <div className="plfb-safe">하단 안전 영역</div>
      </div>
      <div className="plfb-explainer">
        <span className="plfb-eyebrow">화면에서 역할로</span>
        <h3>고정 영역과 읽는 영역</h3>
        <p>
          상단바·하단 탭과 콘텐츠의 공간을 구분해요. 안전 영역의 실제 높이는
          기기와 표시 환경에서 받아요.
        </p>
        <dl>
          <dt>상단바</dt>
          <dd>가운데 행 32pt에 위아래 8pt를 더해요.</dd>
          <dt>하단 탭</dt>
          <dd>safeAreaInset으로 공간을 확보해요.</dd>
          <dt>메인탭 콘텐츠 하단</dt>
          <dd>기존 화면은 mainTabContentBottom 72pt도 사용해요.</dd>
        </dl>
      </div>
      <Note>
        도식은 영역의 관계를 보여줘요. iPhone 렌더링이나 기기별 안전 영역 측정
        결과는 아니에요.
      </Note>
    </div>
  );
}
function LayoutRules({ section }: { section: string }) {
  if (section === "anatomy") return <>
    <NativeLayoutReference />
    <details className="pl-layout-reference-details"><summary>화면 영역의 관계를 도식으로 보기</summary><LayoutAnatomy /></details>
  </>;
  if (section === "safe-area")
    return (
      <>
      <Table
        caption="현재 iOS 배치의 소유권"
        headings={["영역", "현재 구현", "설계할 때 확인할 점"]}
        rows={[
          [
            "화면",
            "AppShellView",
            "상단 안전 영역은 루트가 전달해요. 루트는 하단 키보드 안전 영역을 무시해요.",
          ],
          [
            "시트",
            "BottomSheetShell",
            "헤더 → 콘텐츠 → 푸터가 공간을 나눠 가져요. 푸터 아래는 max(12, safeAreaBottom)예요.",
          ],
          [
            "인증 입력",
            "AuthEntryView",
            "이메일 단계의 주요 행동만 화면에서 계산한 오프셋으로 옮겨요. 키보드 대응은 입력 화면이 소유해요.",
          ],
        ]}
      />
      <NativeLayoutKeyboardReference />
      </>
    );
  if (section === "scrolling")
    return (
      <Table
        caption="콘텐츠 배치와 스크롤의 구분"
        headings={["구성", "사용 목적", "현재 규칙"]}
        rows={[
          [
            "TBWrapLayout",
            "자연 너비의 태그",
            "들어갈 공간이 없으면 다음 줄로 보내요. 긴 첫 항목의 너비를 임의로 줄이지 않아요.",
          ],
          [
            "TBFlowLayout",
            "반복 선택 항목",
            "최소 82pt의 adaptive grid를 사용해요.",
          ],
          [
            "TBOverflowTagRow",
            "한 줄 요약",
            "실제 +N 너비까지 계산해 앞쪽 항목을 보여줘요.",
          ],
          [
            "시트 드래그",
            "스크롤과 닫기",
            "콘텐츠가 위쪽 경계이거나 스크롤할 내용이 없을 때 시트로 전달해요.",
          ],
        ]}
      />
    );
  if (section === "dynamic-type") return <NativeLayoutDynamicReference />;
  return null;
}
const spacingRoles: Record<string, string> = {
  page: "페이지 좌우",
  pageTop: "페이지 위",
  mainTabContentBottom: "메인탭 콘텐츠 하단",
  section: "섹션 사이",
  card: "카드 안쪽",
};
const radiusRoles: Record<string, string> = {
  badge: "작은 배지",
  icon: "아이콘 바탕",
  chip: "칩과 캡슐",
  control: "주요 입력과 버튼",
  row: "행",
  support: "보조 영역",
  card: "카드",
  media: "이미지 영역",
  full: "완전히 둥근 형태",
};
function SpacingReference({ section }: { section: string }) {
  if (section === "scale")
    return (
      <div className="plfb-spacing-scale" aria-label="iOS 기본 간격 스케일">
        {IOS_FOUNDATIONS.spacing
          .filter((x) => /^x\d+$/.test(x.name))
          .map((x) => (
            <div key={x.name}>
              <code>{x.name}</code>
              <div>
                <i style={{ width: x.value * 3 }} />
              </div>
              <span>{x.value} pt</span>
            </div>
          ))}
        <Note>막대 길이는 비교를 위해 3배로 표시했어요.</Note>
      </div>
    );
  if (section === "roles")
    return (
      <Table
        caption="TBSpacing의 용도별 상수"
        headings={["토큰", "용도", "현재 값"]}
        rows={Object.entries(spacingRoles).map(([key, label]) => [
          <code>TBSpacing.{key}</code>,
          label,
          `${nativeMetric("spacing", key)} pt`,
        ])}
      />
    );
  if (section === "content")
    return (
      <>
      <NativeSpacingReference />
      <details className="pl-layout-reference-details"><summary>간격의 관계를 도식으로 보기</summary>
      <div className="plfb-spacing-example">
        <div>
          <small>바깥 · page 20pt</small>
          <article>
            <strong>기록의 감각</strong>
            <p>
              같은 그룹의 정보는 가까이 두고,
              <br />
              다음 섹션과는 간격을 둬요.
            </p>
            <span>안쪽 · card 12pt</span>
          </article>
          <small>다음 섹션 · section 20pt</small>
        </div>
        <Note>
          모든 간격을 한 스케일에 맞추기보다, 먼저 정보가 같은 그룹인지
          결정해요. 안전 영역은 고정 여백과 별도로 계산해요.
        </Note>
      </div>
      </details>
      </>
    );
  return null;
}
function RadiusReference({ section }: { section: string }) {
  if (section === "scale")
    return (
      <div className="plfb-radius-grid">
        {IOS_FOUNDATIONS.radius.map((x) => (
          <div key={x.name}>
            <i style={{ borderRadius: x.value }} />
            <code>{x.name}</code>
            <span>{x.value} pt</span>
          </div>
        ))}
      </div>
    );
  if (section === "roles")
    return (
      <Table
        caption="iOS 모서리의 역할"
        headings={["토큰", "용도", "현재 값"]}
        rows={IOS_FOUNDATIONS.radius.map((x) => [
          <code>TBRadius.{x.name}</code>,
          radiusRoles[x.name],
          `${x.value} pt`,
        ])}
      />
    );
  if (section === "containment")
    return (
      <>
        <div className="plfb-radius-containment">
          <div>
            <div>카드 · 20pt</div>
            <span>안쪽 요소는 자신의 역할을 따라요.</span>
          </div>
          <div className="plfb-sheet-corner">시트 · 위 모서리 32pt</div>
        </div>
        <Note>
          카드와 버튼은 SwiftUI의 continuous 모서리를 사용해요. 브라우저의
          border-radius 예시는 형태 비교용이에요. 시트 32pt는 TBRadius가 아닌
          BottomSheetShellMetrics에 정의되어 있어요.
        </Note>
      </>
    );
  return null;
}
function ElevationReference({ section }: { section: string }) {
  if (section === "levels")
    return (
      <div className="plfb-layer-list">
        {[
          ["화면", "상단바 · 스크롤 · 하단 탭", "화면 안의 순서를 관리해요."],
          [
            "시트",
            "헤더 · 콘텐츠 · 푸터 · floatingLayer",
            "시트 안의 안내는 시트가 소유해요.",
          ],
          ["확인", "삭제 확인 · 커버 편집", "현재 작업 위에서 선택을 받아요."],
        ].map(([title, content, note], i) => (
          <div key={title}>
            <Layers size={20} aria-hidden="true" />
            <span>0{i + 1}</span>
            <strong>{title}</strong>
            <p>
              {content}
              <small>{note}</small>
            </p>
          </div>
        ))}
        <Note>
          번호는 설명 순서예요. SwiftUI의 zIndex는 같은 부모 안에서만 순서를
          정하므로 앱 전체의 층 번호로 사용하지 않아요.
        </Note>
      </div>
    );
  if (section === "presentation")
    return (
      <Table
        caption="표시 영역을 소유하는 뷰"
        headings={["표시", "호스트", "처리 방식"]}
        rows={[
          [
            "프로필·알림·인증 등 주 시트",
            "AppShellView",
            "현재 경로는 ZStack의 커스텀 staged sheet예요.",
          ],
          [
            "시트의 코드 옵션·취소 확인",
            "BottomSheetShell.floatingLayer",
            "해당 시트 안에서 콘텐츠 위에 표시해요.",
          ],
          [
            "시트의 복사 알림·오류",
            "작업이 발생한 시트",
            "토스트를 그 시트의 overlay 또는 ZStack에 붙여요.",
          ],
          [
            "시스템 sheet·fullScreenCover·alert",
            "각 presentation",
            "다른 표시 경계예요. 화면의 큰 zIndex 값으로 건너갈 수 없어요.",
          ],
        ]}
      />
    );
  if (section === "focus")
    return (
      <>
        <div className="plfb-focus-flow">
          <div>화면 탐색</div>
          <span aria-hidden="true">→</span>
          <div>
            <strong>시트 열림</strong>
            <small>뒤 화면 접근성 숨김</small>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <strong>상위 확인 열림</strong>
            <small>뒤 시트 접근성 숨김</small>
          </div>
        </div>
        <Note>
          AppShell의 커스텀 시트·커버 편집·삭제 확인에 적용해요. 표시 영역에는
          isModal을 부여해요. 진입·닫기 후 VoiceOver 초점 복원은 별도 사용성
          확인이 필요해요.
        </Note>
      </>
    );
  return null;
}
function StateExplorer() {
  const id = useId();
  const [selected, setSelected] = useState(true);
  const [pressed, setPressed] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const isPressed = pressed && !disabled;
  return (
    <div className="plfb-state-explorer">
      <div className="plfb-state-controls">
        {[
          ["selected", "선택됨", selected, setSelected],
          ["pressed", "누르는 중", pressed, setPressed],
          ["disabled", "사용 불가", disabled, setDisabled],
        ].map(([key, label, checked, setter]) => (
          <label key={String(key)} htmlFor={id + key}>
            <input
              id={id + key}
              type="checkbox"
              checked={Boolean(checked)}
              onChange={(e) =>
                (setter as (value: boolean) => void)(e.target.checked)
              }
            />
            {String(label)}
          </label>
        ))}
      </div>
      <div className="plfb-state-stage">
        <div
          className="plfb-selection-specimen"
          data-selected={selected}
          data-pressed={isPressed}
          data-disabled={disabled}
        >
          <span>산뜻한 맛</span>
          <i>{selected && <Check size={16} aria-hidden="true" />}</i>
        </div>
        <p aria-live="polite">
          {disabled
            ? "선택 의미는 유지 · 실행과 눌림 반응은 차단"
            : isPressed
              ? "선택 여부와 함께 일시적인 눌림 표면 표시"
              : selected
                ? "선택한 의미 유지 · 다음 입력 대기"
                : "선택하지 않음 · 입력 가능"}
        </p>
      </div>
      <Note>
        상태 조합을 설명하는 도식이에요. 선택 정보는 지속되고, 누름은 손을 떼면
        끝나요. 비활성에서는 눌림 요청을 표시하지 않아요.
      </Note>
    </div>
  );
}
function StateReference({ section }: { section: string }) {
  if (section === "model")
    return (
      <div className="plfb-state-model">
        <div>
          <small>의미</small>
          <strong>선택됨 · 선택 안 됨</strong>
          <p>사용자가 정한 값을 기억해요.</p>
        </div>
        <div>
          <small>입력</small>
          <strong>기본 · 누르는 중</strong>
          <p>현재의 조작을 보여줘요.</p>
        </div>
        <div>
          <small>실행</small>
          <strong>가능 · 불가</strong>
          <p>행동을 실행할 수 있는지 정해요.</p>
        </div>
      </div>
    );
  if (section === "combinations") return <StateExplorer />;
  if (section === "disabled")
    return (
      <Table
        caption="비활성처럼 보여도 실행 규칙은 다를 수 있어요"
        headings={["설정", "실행", "눌림 반응"]}
        rows={[
          [<code>isEnabled: false</code>, "실행 차단", "표면색·축소 모두 없음"],
          [
            <code>.disabled(true)</code>,
            "부모 환경을 포함해 실행 차단",
            "표면색·축소 모두 없음",
          ],
          [
            <code>visualDisabled: true</code>,
            "설명이나 조건 안내를 실행할 수 있음",
            "실행 가능하면 표면색·축소 제공",
          ],
        ]}
      />
    );
  if (section === "loading")
    return (
      <>
        <pre className="plfd-code" tabIndex={0}>
          <code>
            {
              'PrimaryButton(\n    title: isSaving ? "저장 중…" : "저장",\n    isEnabled: !isSaving,\n    action: save\n)'
            }
          </code>
        </pre>
        <Note>
          현재 공통 버튼에는 별도 loading 속성이 없어요. 작업을 소유한 화면이
          제목과 실행 가능 상태를 함께 바꾸고, 실패 시 재시도할 수 있게
          되돌려요.
        </Note>
      </>
    );
  return null;
}
function PressExample({
  title,
  kind,
  reduced,
  disabled,
  wide = false,
}: {
  title: string;
  kind: "primary" | "neutral";
  reduced: boolean;
  disabled: boolean;
  wide?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const [scale, setScale] = useState(1);
  const start = (element: HTMLButtonElement) => {
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    setScale(
      1 -
        feedback.pressDistance /
          Math.max(
            height,
            width / feedback.widthBasisDivisor,
            feedback.minimumBasis,
          ),
    );
    setPressed(true);
  };
  return (
    <button
      type="button"
      className="plfb-press-button"
      data-kind={kind}
      data-pressed={pressed && !disabled}
      data-reduced={reduced}
      disabled={disabled}
      style={
        {
          "--plfb-press-scale": scale,
          "--plfb-press-duration": feedback.durationMs + "ms",
          "--plfb-press-alpha":
            kind === "primary"
              ? feedback.primaryOpacity
              : feedback.neutralOpacity,
          width: wide ? "100%" : undefined,
        } as CSSProperties
      }
      onPointerDown={(e) => start(e.currentTarget)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onBlur={() => setPressed(false)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") start(e.currentTarget);
      }}
      onKeyUp={() => setPressed(false)}
    >
      <span>{title}</span>
    </button>
  );
}
function FeedbackPlayground() {
  const [reduced, setReduced] = useState(false);
  const [disabled, setDisabled] = useState(false);
  return (
    <div className="plfb-feedback">
      <div className="plfb-state-controls">
        <label>
          <input
            type="checkbox"
            checked={reduced}
            onChange={(e) => setReduced(e.target.checked)}
          />
          동작 줄이기
        </label>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          사용 불가
        </label>
      </div>
      <div className="plfb-press-stage">
        <PressExample
          title="식사 기록하기"
          kind="primary"
          reduced={reduced}
          disabled={disabled}
          wide
        />
        <PressExample
          title="다음에 하기"
          kind="neutral"
          reduced={reduced}
          disabled={disabled}
        />
      </div>
      <Note>
        버튼을 누른 채로 표면 변화를 살펴보세요. 브라우저 설명 예시이며 실제
        iOS의 spring 곡선과 같은 렌더링은 아니에요. 운영체제의 동작 줄이기
        설정도 우선 적용해요.
      </Note>
      <Table
        caption="새 iOS 공통 눌림 규칙의 적용 범위"
        headings={["구성", "표면", "크기·시간"]}
        rows={[
          [
            "PrimaryButton",
            `어두운 표면 위 흰색 ${feedback.primaryOpacity * 100}%`,
            `기준 크기당 ${feedback.pressDistance}pt 축소 · 기존 ${feedback.durationMs}ms spring`,
          ],
          [
            "TBFlowBottomCTA 보조 행동",
            `검정 ${feedback.neutralOpacity * 100}%`,
            "같은 크기 계산",
          ],
          [
            "TBSelectionCard",
            `검정 ${feedback.neutralOpacity * 100}% · 선택 색/테두리 유지`,
            "같은 크기 계산",
          ],
        ]}
      />
      <Note>
        축소 기준은 max(높이, 너비 ÷ {feedback.widthBasisDivisor},{" "}
        {feedback.minimumBasis}pt)예요. 가로 감소량은 최대{" "}
        {feedback.pressDistance * feedback.widthBasisDivisor}pt로 제한돼요. 기존
        TBTokenButtonStyle의 다른 사용처는 기존 동작을 유지해요.
      </Note>
    </div>
  );
}
function FeedbackReference({ section }: { section: string }) {
  if (section === "press") return <FeedbackPlayground />;
  if (section === "cancel")
    return (
      <div className="plfb-focus-flow">
        <div>
          눌림 시작<small>표면색 + 크기 반응</small>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          취소·영역 이탈<small>기본 표면으로 복귀</small>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <X size={18} aria-hidden="true" /> 실행하지 않음
        </div>
      </div>
    );
  if (section === "reduce-motion")
    return (
      <Table
        caption="접근성 설정과 입력 반응"
        headings={["조건", "표면색", "크기와 애니메이션"]}
        rows={[
          [
            "일반 입력",
            "눌림 동안만 표시",
            `크기에 맞춰 축소 · ${feedback.durationMs}ms spring`,
          ],
          [
            "동작 줄이기",
            "눌림 동안 즉시 표시",
            "축소 없음 · 전환 애니메이션 없음",
          ],
          ["실제 비활성", "변화 없음", "변화 없음"],
        ]}
      />
    );
  return null;
}
export function FoundationBehaviorSection({
  slug,
  section,
}: {
  slug: string;
  section: string;
}) {
  if (slug === "foundations/layout") return <LayoutRules section={section} />;
  if (slug === "foundations/spacing")
    return <SpacingReference section={section} />;
  if (slug === "foundations/radius")
    return <RadiusReference section={section} />;
  if (slug === "foundations/elevation")
    return <ElevationReference section={section} />;
  if (slug === "foundations/state") return <StateReference section={section} />;
  if (slug === "foundations/feedback")
    return <FeedbackReference section={section} />;
  return null;
}
