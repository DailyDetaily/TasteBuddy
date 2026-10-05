import type { ComponentProps, ReactNode } from "react";
import { ArrowRight, X } from "lucide-react";
import PrimaryButton from "../components/system/PrimaryButton";
import ProductTasteChip from "../components/system/TasteChip";
import { getTasteTintSoftBorder } from "../constants/tasteColors";
import type { CatalogComponent } from "./catalog";
import type { ComponentGuide, GuideKind } from "./componentGuides";
import "./component-guides.css";
import { NativeAnatomy, NativePropertyBoards, NativeStateBoard } from "./NativeVisualDocumentation";

function TasteChip(props: ComponentProps<typeof ProductTasteChip>) {
  // SwiftUI Capsule.strokeBorder paints inside the existing size.
  const border =
    props.tone === "neutral"
      ? "#E5E5E5"
      : getTasteTintSoftBorder(props.colorTaste ?? props.taste);
  return (
    <ProductTasteChip
      {...props}
      style={{ borderWidth: 0, boxShadow: `inset 0 0 0 1px ${border}` }}
    />
  );
}

function StaticSample({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pl-guide-sample ${className}`}
      aria-hidden="true"
      ref={(node) => {
        if (node) node.inert = true;
      }}
    >
      {children}
    </div>
  );
}

function Marker({ children }: { children: ReactNode }) {
  return <span className="pl-guide-marker">{children}</span>;
}

function SheetCallout({ children }: { children: ReactNode }) {
  return (
    <span className="pl-guide-sheet-callout">
      <Marker>{children}</Marker>
    </span>
  );
}

function Anatomy({ guide }: { guide: ComponentGuide }) {
  return (
    <figure className="pl-guide-anatomy">
      <StaticSample className={`pl-guide-anatomy-stage is-${guide.kind}`}>
        {guide.kind === "button" ? (
          <div className="pl-guide-button-map">
            <span className="pl-guide-callout">
              <Marker>1</Marker> 버튼 영역
            </span>
            <PrimaryButton>기록 완료</PrimaryButton>
            <span className="pl-guide-callout is-label">
              <Marker>2</Marker> 행동 이름
            </span>
          </div>
        ) : guide.kind === "taste" ? (
          <div className="pl-guide-taste-map">
            <span className="pl-guide-callout">
              <Marker>1</Marker> 바탕 · 경계
            </span>
            <div className="pl-guide-taste-magnified">
              <TasteChip taste="단맛" value={0} />
            </div>
            <div className="pl-guide-taste-parts">
              <span>
                <Marker>2</Marker> 이름
              </span>
              <span>
                <Marker>3</Marker> 값
              </span>
            </div>
          </div>
        ) : (
          <div className="pl-guide-sheet-map">
            <div className="pl-guide-sheet-grabber">
              <SheetCallout>1</SheetCallout>
              <span />
            </div>
            <div className="pl-guide-sheet-header">
              <SheetCallout>2</SheetCallout>
              <strong>감각 선택</strong>
              <X size={24} strokeWidth={1.8} />
            </div>
            <div className="pl-guide-sheet-body">
              <SheetCallout>3</SheetCallout>
              <span>본문 · 필요한 경우 내부 스크롤</span>
              <span className="pl-guide-sheet-item">고소함</span>
              <span className="pl-guide-sheet-item">산뜻함</span>
            </div>
            <div className="pl-guide-sheet-footer">
              <SheetCallout>4</SheetCallout>
              <PrimaryButton>선택 완료</PrimaryButton>
            </div>
          </div>
        )}
      </StaticSample>
      <figcaption>
        <span className="pl-guide-caption">
          {guide.platform === "ios"
            ? guide.kind === "sheet"
              ? "iOS 슬롯 구조 · 본문과 전체 높이는 설명용으로 축약"
              : guide.kind === "taste"
                ? "iOS 기본 xs 규격의 구조도 · 2배 확대"
                : "iOS 기본 버튼 규격의 구조도"
            : guide.kind === "sheet"
              ? "웹 슬롯의 배치를 보여주는 축소 도식"
              : guide.kind === "taste"
                ? "실제 웹 칩을 2배 확대해 부품을 표시한 구조도"
                : "실제 웹 버튼에 부품 이름을 표시한 구조도"}
        </span>
        <ol className="pl-guide-parts">
          {guide.anatomy.map((part, index) => (
            <li key={part.slot}>
              <Marker>{index + 1}</Marker>
              <div>
                <strong>{part.name}</strong>
                <code>{part.slot}</code>
                <p>{part.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}

function GuideTable({
  label,
  headings,
  rows,
}: {
  label: string;
  headings: string[];
  rows: ReactNode[][];
}) {
  return (
    <div
      className="pl-guide-table-scroll"
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table>
        <caption>{label}</caption>
        <thead>
          <tr>
            {headings.map((heading) => (
              <th scope="col" key={heading}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((value, cell) =>
                cell === 0 ? (
                  <th scope="row" key={cell}>
                    {value}
                  </th>
                ) : (
                  <td key={cell}>{value}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StateSamples({ kind }: { kind: GuideKind }) {
  if (kind === "sheet") {
    return (
      <ol className="pl-guide-flow" aria-label="명시적인 적용의 흐름">
        {["열기", "임시 선택", "적용 성공", "닫고 복귀"].map((label, index) => (
          <li key={label}>
            <span>{label}</span>
            {index < 3 && <ArrowRight size={16} aria-hidden="true" />}
          </li>
        ))}
      </ol>
    );
  }
  const samples =
    kind === "button"
      ? [
          { name: "기본", view: <PrimaryButton>기록 완료</PrimaryButton> },
          {
            name: "누름 모양",
            view: (
              <PrimaryButton style={{ transform: "scale(.98)" }}>
                기록 완료
              </PrimaryButton>
            ),
          },
          {
            name: "비활성",
            view: <PrimaryButton disabled>기록 완료</PrimaryButton>,
          },
          {
            name: "처리 중 조합",
            view: (
              <PrimaryButton disabled aria-busy>
                저장 중
              </PrimaryButton>
            ),
          },
        ]
      : [
          { name: "이름만", view: <TasteChip taste="단맛" /> },
          { name: "0 포함", view: <TasteChip taste="단맛" value={0} /> },
          {
            name: "중립 표현",
            view: <TasteChip taste="단맛" tone="neutral" />,
          },
          {
            name: "중립 표현 + 0",
            view: <TasteChip taste="단맛" tone="neutral" value={0} />,
          },
        ];
  return (
    <div className="pl-guide-state-samples">
      {samples.map((sample) => (
        <figure key={sample.name}>
          <StaticSample>{sample.view}</StaticSample>
          <figcaption>{sample.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function UsageSample({
  kind,
  avoid = false,
}: {
  kind: GuideKind;
  avoid?: boolean;
}) {
  return (
    <StaticSample className="pl-guide-usage-sample">
      {kind === "button" ? (
        <div className="pl-guide-action-pair">
          {avoid ? (
            <>
              <PrimaryButton>확인</PrimaryButton>
              <PrimaryButton>확인</PrimaryButton>
            </>
          ) : (
            <>
              <span className="pl-guide-secondary-action">나중에</span>
              <PrimaryButton>식사 기록 완료</PrimaryButton>
            </>
          )}
        </div>
      ) : kind === "taste" ? (
        <div className="pl-guide-taste-example">
          <span>이번 식사의 미각 강도 · 0–10</span>
          {avoid ? (
            <>
              <div>
                <TasteChip taste="단맛" value={0} />
                <span>싫어함</span>
              </div>
              <div>
                <TasteChip taste="신맛" value={0} />
                <span>미기록을 0으로 채움</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <TasteChip taste="단맛" value={0} />
                <span>강도 0으로 기록</span>
              </div>
              <div>
                <TasteChip taste="신맛" />
                <span>기록 없음</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="pl-guide-sheet-example">
          <div>
            <span>
              <X size={15} /> 닫기
            </span>
            <ArrowRight size={15} />
            <strong>{avoid ? "저장 완료" : "이전 화면"}</strong>
          </div>
          <div>
            <span>{avoid ? "중단 버튼" : "선택 완료"}</span>
            <ArrowRight size={15} />
            <strong>{avoid ? "저장 완료" : "선택 적용"}</strong>
          </div>
        </div>
      )}
    </StaticSample>
  );
}

export default function ComponentGuidelines({
  component,
  supplementalReference,
}: {
  component: CatalogComponent;
  supplementalReference?: ReactNode;
}) {
  const guide = component.guide;
  if (!guide) return null;
  return (
    <div className="pl-component-guide" data-platform={guide.platform}>
      <section className="pl-doc-section" id="anatomy">
        <h2>Anatomy <span className="pl-heading-translation">구조</span></h2>
        {guide.platform === "ios" ? <NativeAnatomy component={component} /> : <Anatomy guide={guide} />}
        {guide.platform === "ios" && <NativePropertyBoards component={component} />}
        <h3>어떤 값을 조절하나요</h3>
        <GuideTable
          label={
            guide.platform === "ios"
              ? "현재 iOS 컴포넌트의 속성"
              : "현재 웹 컴포넌트의 속성"
          }
          headings={["속성", "기본값", "사용 기준"]}
          rows={guide.properties.map((property) => [
            <code>{property.name}</code>,
            <code>{property.initial}</code>,
            property.description,
          ])}
        />
      </section>
      {guide.platform !== "ios" && supplementalReference}
      <section className="pl-doc-section" id="states">
        <h2>상태와 조합</h2>
        <p>{guide.stateNote}</p>
        {guide.platform === "ios" ? <NativeStateBoard component={component} /> : <StateSamples kind={guide.kind} />}
        {guide.kind !== "sheet" && (
          <p className="pl-guide-caption">
            상태별 모양 비교예요. 조작은 상단 미리보기에서 확인해요.
          </p>
        )}
        <GuideTable
          label="조건별 표현과 동작"
          headings={["상태", "조건", "표현", "동작"]}
          rows={guide.states.map((state) => [
            state.name,
            state.condition,
            state.appearance,
            state.behavior,
          ])}
        />
      </section>
      <section className="pl-doc-section" id="usage">
        <h2>언제, 어떻게 사용하나요</h2>
        <p>{component.usage}</p>
        <div className="pl-guide-rules">
          {guide.rules.map((rule) => (
            <div key={rule.title}>
              <h3>{rule.title}</h3>
              <p>{rule.body}</p>
            </div>
          ))}
        </div>
        <p className="pl-guide-caption">{guide.example.context}</p>
        <div className="pl-guide-examples">
          <figure>
            <figcaption>
              <span className="pl-guide-verdict">권장</span>
              <p>{guide.example.good}</p>
            </figcaption>
            <UsageSample kind={guide.kind} />
          </figure>
          <figure>
            <figcaption>
              <span className="pl-guide-verdict">피해야 할 예</span>
              <p>{guide.example.avoid}</p>
            </figcaption>
            <UsageSample kind={guide.kind} avoid />
          </figure>
        </div>
      </section>
      <section className="pl-doc-section" id="specs">
        <h2>
          {guide.platform === "ios"
            ? "iOS 토큰과 구현 규격"
            : "토큰과 플랫폼 규격"}
        </h2>
        <p>
          2026.10.01 소스 기준이에요. 토큰 참조와 컴포넌트에 직접 지정된
          구현값을 함께 표시해요.
        </p>
        <GuideTable
          label={
            guide.platform === "ios"
              ? "iOS의 부품별 스타일 명세"
              : "웹의 부품별 스타일 명세"
          }
          headings={["부품", "적용 상태", "참조 / 구현값", "현재 값"]}
          rows={guide.tokens.map((token) => [
            token.part,
            token.state,
            <code>{token.reference}</code>,
            token.value,
          ])}
        />
        <h3>
          {guide.platform === "ios"
            ? "iOS 세부 규격 확인"
            : "Web과 iOS의 현재 차이"}
        </h3>
        <GuideTable
          label={
            guide.platform === "ios"
              ? "현재 SwiftUI 소스 기준 · 기기 실행 검증과 별개"
              : "플랫폼별 구현 규격 · 실행 검증 상태와 별개"
          }
          headings={
            guide.platform === "ios"
              ? ["항목", "iOS 구현"]
              : ["항목", "Web", "iOS"]
          }
          rows={guide.platforms.map((platform) =>
            guide.platform === "ios"
              ? [platform.property, platform.ios]
              : [platform.property, platform.web, platform.ios],
          )}
        />
      </section>
      <section className="pl-doc-section" id="access">
        <h2>인터랙션과 접근성</h2>
        <ul>
          {guide.accessibility.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        {guide.platform !== "ios" && (
          <a className="pl-inline-link" href="/design-system/accessibility">
            접근성 기준 읽기 ↗
          </a>
        )}
        <details className="pl-guide-references">
          <summary>명세를 확인한 소스와 참고 문서</summary>
          <ul>
            {guide.sources.map((path) => (
              <li key={path}>
                <a
                  href={`vscode://file//Users/sinjunho/Desktop/Taste%20Buddy/${path}`}
                >
                  {path}
                </a>
              </li>
            ))}
          </ul>
          <a href={guide.reference.href} target="_blank" rel="noreferrer">
            {guide.reference.label} ↗
          </a>
          <p>
            SEED의 문서 구성을 참고하고, 규격과 예시는 현재 Taste Buddy 구현을
            기준으로 작성했어요.
          </p>
        </details>
      </section>
    </div>
  );
}
