import {
  useId,
  useState,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from "react";
import { ArrowRight, Check, Heart, Plus, Search, Type } from "lucide-react";
import { BASE } from "./catalog";
import {
  FOUNDATION_TOPICS,
  IOS_FOUNDATIONS,
  TASTE_COLOR_INTENTS,
  TEXT_ROLE_LABELS,
  nativeColor,
  nativeMetric,
} from "./foundationReferenceData";
import "./foundation-reference.css";
import { FoundationBehaviorSection } from "./FoundationBehaviorReference";
import { SemanticColorReference } from "./ColorFoundationReference";
import { AtomicColorReference, ColorStyleMigration, TasteSemanticReference } from "./ColorStyleGuideReference";
import { ColorModeComparison, ColorModePicker } from "./ColorModeReference";
import VisualizationColorReference from "./VisualizationColorReference";
import { ContrastColorTable, InteractionColorExamples, StateColorExamples } from "./ColorRoleExamples";
import ColorUsageExamples from "./ColorUsageExamples";
import { ComponentTextReference, TypographyDynamicReference, TypographyFontReference, TypographyRoleBoard, TypographyUsageReference } from "./TypographyFoundationReference";

type DocLink = ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>;
type SectionProps = { slug: string; section: string; LinkComponent: DocLink };
const FOUNDATION_PAGES = new Set([
  "foundations",
  "foundations/design-tokens",
  "foundations/colors",
  "foundations/typography",
  "foundations/layout",
  "foundations/spacing",
  "foundations/radius",
  "foundations/elevation",
  "foundations/state",
  "foundations/feedback",
]);
export function FoundationIntro({ slug }: { slug: string }) {
  if (slug === "foundations/colors") return <><ColorModePicker /><ColorModeComparison /></>;
  if (!FOUNDATION_PAGES.has(slug)) return null;
  return (
    <div className="plfd-scope">
      <span>iOS</span>
      <p>
        {slug === "foundations/colors"
          ? "Light · Atomic / Semantic"
          : "현재 SwiftUI 소스의 기준값과 사용법"}
      </p>
    </div>
  );
}
function ReferenceTable({
  caption,
  children,
  headings,
}: {
  caption: string;
  headings: string[];
  children: ReactNode;
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
            {headings.map((heading) => (
              <th scope="col" key={heading}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function CodeExample({ children }: { children: string }) {
  return (
    <pre className="plfd-code" tabIndex={0} aria-label="SwiftUI 사용 예">
      <code>{children}</code>
    </pre>
  );
}
function TopicGraphic({ kind }: { kind: string }) {
  const tastes = IOS_FOUNDATIONS.tastes;
  return (
    <div
      className={"plfd-topic-art plfd-topic-art--" + kind}
      aria-hidden="true"
    >
      {kind === "colors" ? (
        tastes.map((taste) => (
          <i key={taste.id} style={{ background: taste.main }} />
        ))
      ) : kind === "tokens" ? (
        <>
          <code>12 pt</code>
          <ArrowRight size={20} />
          <code>TBSpacing.card</code>
        </>
      ) : kind === "type" ? (
        <>
          <strong>읽기 좋은 글자</strong>
          <span>제목에서 짧은 설명까지</span>
        </>
      ) : kind === "layout" || kind === "radius" ? (
        [6, 10, 20, 24].map((radius) => (
          <i key={radius} style={{ borderRadius: radius }} />
        ))
      ) : kind === "spacing" ? (
        [4, 8, 12, 20, 40].map((width) => (
          <i
            key={width}
            style={{
              width,
              height: 50,
              background: "currentColor",
              opacity: 0.65,
            }}
          />
        ))
      ) : kind === "elevation" ? (
        <>
          <span>화면</span>
          <ArrowRight size={16} />
          <span>시트</span>
          <ArrowRight size={16} />
          <span>확인</span>
        </>
      ) : kind === "state" ? (
        <>
          <Check size={23} />
          <span>선택 + 누름</span>
        </>
      ) : kind === "feedback" ? (
        <>
          <span>누르기</span>
          <ArrowRight size={18} />
          <span>표면의 응답</span>
        </>
      ) : kind === "icons" ? (
        <>
          <Search />
          <Plus />
          <Heart />
        </>
      ) : kind === "writing" ? (
        <span>
          차분하게 초대하고
          <br />
          정확하게 설명해요.
        </span>
      ) : kind === "motion" ? (
        <>
          <span>누르기</span>
          <ArrowRight size={20} />
          <span>응답하기</span>
        </>
      ) : (
        <>
          <Type size={30} />
          <span>
            같은 경험,
            <br />
            다른 읽기 방식
          </span>
        </>
      )}
    </div>
  );
}
function TopicList({
  section,
  LinkComponent,
}: {
  section: string;
  LinkComponent: DocLink;
}) {
  return (
    <div className="plfd-topic-grid">
      {FOUNDATION_TOPICS.filter((topic) => topic.group === section).map(
        (topic) => (
          <LinkComponent
            className="plfd-topic"
            href={BASE + "/" + topic.slug}
            key={topic.slug}
          >
            <TopicGraphic kind={topic.kind} />
            <h3>
              {topic.title}
              <ArrowRight size={17} />
            </h3>
            <p>{topic.description}</p>
          </LinkComponent>
        ),
      )}
    </div>
  );
}
function TokenLayers() {
  return (
    <>
      <div className="plfd-token-chain" aria-label="기초 치수에서 카드까지">
        <div>
          <span>기초 치수</span>
          <strong>{nativeMetric("spacing", "x12")} pt</strong>
          <code>TBSpacing.x12</code>
        </div>
        <ArrowRight aria-hidden="true" size={20} />
        <div>
          <span>용도</span>
          <strong>카드 안쪽 여백</strong>
          <code>TBSpacing.card</code>
        </div>
        <ArrowRight aria-hidden="true" size={20} />
        <div>
          <span>SwiftUI 적용</span>
          <strong>padding</strong>
          <code>.padding(TBSpacing.card)</code>
        </div>
      </div>
      <p className="plfd-note">
        현재 두 간격 상수는 각각 같은 값을 선언해요. 아래 사용 예에서는 역할
        이름을 선택해요.
      </p>
      <CodeExample>
        {
          'VStack(spacing: TBSpacing.section) {\n    Text("이번 식사의 감각")\n        .tbTextStyle(.sectionTitle)\n}\n.padding(TBSpacing.card)\n.background(TBColor.surface)\n.clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))'
        }
      </CodeExample>
    </>
  );
}
function TokenNames({ LinkComponent }: { LinkComponent: DocLink }) {
  const rows = [
    ["TBColor", "색의 역할", "TBColor.page", "foundations/colors"],
    [
      "TasteAxis",
      "미각별 팔레트",
      "TasteAxis.sweet.tintTextColor",
      "foundations/colors#atomic",
    ],
    [
      "TBTextStyle",
      "글자의 역할과 조합",
      "TBTextStyle.body",
      "foundations/typography#product",
    ],
    [
      "TBTypography",
      "글자 크기·굵기 등의 기초값",
      "TBTypography.FontSize.x14",
      "foundations/typography#legacy",
    ],
    [
      "TBSpacing",
      "간격의 크기와 용도",
      "TBSpacing.card",
      "foundations/spacing",
    ],
    ["TBRadius", "모서리의 용도", "TBRadius.card", "foundations/radius"],
    [
      "TBSize",
      "요소와 배치의 치수",
      "TBSize.primaryButtonHeight",
      "foundations/layout",
    ],
    [
      "TasteBloomMotion",
      "iOS의 움직임",
      "typealias TBMotion = TasteBloomMotion",
      "motion",
    ],
    [
      "TBDataViz",
      "차트의 표현 치수와 색",
      "TBDataViz.Radar.grid",
      "patterns/interpretation",
    ],
  ];
  return (
    <ReferenceTable
      caption="iOS 토큰의 이름과 역할"
      headings={["정의", "용도", "사용 예"]}
    >
      {rows.map(([name, purpose, example, path]) => (
        <tr key={name}>
          <th scope="row">
            <LinkComponent href={BASE + "/" + path}>{name}</LinkComponent>
          </th>
          <td>{purpose}</td>
          <td>
            <code>{example}</code>
          </td>
        </tr>
      ))}
    </ReferenceTable>
  );
}
function NativeSources() {
  return (
    <>
      <ReferenceTable
        caption="이번 iOS 참조값의 소스"
        headings={["소스", "문서에 연결한 내용"]}
      >
        <tr>
          <th scope="row">
            <code>TBTheme.swift</code>
          </th>
          <td>
            TBColor, TBSpacing, TBRadius, TBSize, TBTypography, TBTextStyle
          </td>
        </tr>
        <tr>
          <th scope="row">
            <code>TasteModels.swift</code>
          </th>
          <td>TasteAxis의 6개 기본 팔레트와 배경 위 글자색</td>
        </tr>
        <tr>
          <th scope="row">
            <code>TasteBloomMotion.swift</code>
          </th>
          <td>TBControlFeedback의 눌림 거리·표면색 농도와 press 시간</td>
        </tr>
      </ReferenceTable>
      <p className="plfd-note">
        색상과 글자 예제는 iOS 소스의 값을 브라우저에서 표현해요. 실제 글리프·행
        높이·Dynamic Type은 iOS에서 확인해요. 측정용 팔레트는 기본 미각 팔레트와
        별도로 다룹니다.
      </p>
    </>
  );
}
function TastePalette() {
  return (
    <>
      <div className="plfd-taste-grid">
        {IOS_FOUNDATIONS.tastes.map((taste) => (
          <article className="plfd-taste" key={taste.id}>
            <div
              className="plfd-taste-main"
              style={{ background: taste.main }}
              aria-hidden="true"
            />
            <h3>{taste.label}</h3>
            <span className="plfd-taste-color-name">
              {TASTE_COLOR_INTENTS[taste.id].colorName}
            </span>
            <p className="plfd-taste-rationale">
              {TASTE_COLOR_INTENTS[taste.id].rationale}
            </p>
            <code>TasteAxis.{taste.id}</code>
            <div
              className="plfd-taste-reading"
              style={{ background: taste.tintSurface, color: taste.tintText }}
            >
              {taste.label} · 배경 위 글자색
            </div>
            <dl>
              <div>
                <dt>mainColor</dt>
                <dd>{taste.main}</dd>
              </div>
              <div>
                <dt>tintSurfaceColor</dt>
                <dd>{taste.tintSurface}</dd>
              </div>
              <div>
                <dt>tintTextColor</dt>
                <dd>{taste.tintText}</dd>
              </div>
            </dl>
            <details>
              <summary>그라디언트</summary>
              <div
                className="plfd-taste-gradient"
                style={{
                  background:
                    "linear-gradient(135deg, " +
                    taste.gradient.join(", ") +
                    ")",
                }}
              />
              <code>{taste.gradient.join(" → ")}</code>
              <small>
                linearGradient · topLeading → bottomTrailing의 방향을 보여주는
                참고 예
              </small>
            </details>
          </article>
        ))}
      </div>
      <p className="plfd-note">
        mainColor는 차트와 분류 그래픽의 미각 원색이에요. 밝은 미각 배경에는
        tintSurfaceColor를, 작은 라벨·음식명과 TasteChip의 숫자에는
        tintTextColor를 사용해요. 배경 위 글자색인 tintTextColor는 팔레트의
        tintSurfaceText를 참조해요.
      </p>
      <CodeExample>
        {
          "let axis = TasteAxis.sweet\n\nText(axis.label)\n    .foregroundStyle(axis.tintTextColor)\n    .padding(TBSpacing.x8)\n    .background(axis.tintSurfaceColor)"
        }
      </CodeExample>
    </>
  );
}
function ColorPairings() {
  const [tasteId, setTasteId] = useState(IOS_FOUNDATIONS.tastes[0].id);
  const taste = IOS_FOUNDATIONS.tastes.find((item) => item.id === tasteId)!;
  return (
    <div className="plfd-pairings">
      <div
        className="plfd-choice-group"
        role="group"
        aria-label="미각색 예제 선택"
      >
        {IOS_FOUNDATIONS.tastes.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={item.id === tasteId}
            onClick={() => setTasteId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="plfd-pair-grid">
        <figure>
          <div
            className="plfd-pair-stage"
            style={{
              background: nativeColor("surface"),
              color: nativeColor("textPrimary"),
            }}
          >
            <i className="plfd-taste-dot" style={{ background: taste.main }} />
            <span>{taste.label}</span>
          </div>
          <figcaption>
            <strong>분류를 드러내는 색</strong>
            <code>mainColor + TBColor.textPrimary</code>
          </figcaption>
        </figure>
        <figure>
          <div
            className="plfd-pair-stage"
            style={{ background: taste.tintSurface, color: taste.tintText }}
          >
            <span>{taste.label}을 기록했어요</span>
          </div>
          <figcaption>
            <strong>글자와 배경의 색 조합</strong>
            <code>tintSurfaceColor + tintTextColor</code>
          </figcaption>
        </figure>
      </div>
      <p className="plfd-note">
        작은 글자와 숫자는 배경 위 글자색을 사용해요. 현재 iOS TasteChip의 미각
        숫자도 tintTextColor를 사용합니다. mainColor를 작은 글자의 색으로 대신
        쓰지 않아요.
      </p>
    </div>
  );
}
function TypographyReference() {
  return <><TypographyRoleBoard /><details className="pl-type-browser-preview"><summary>문구를 직접 입력해 보기 · 브라우저 참고</summary><BrowserTypographyReference /></details></>;
}
function BrowserTypographyReference() {
  const [scale, setScale] = useState(1);
  const [text, setText] = useState("");
  const sampleId = useId();
  const scaleId = useId();
  return (
    <>
      <div className="plfd-toolbar">
        <label htmlFor={sampleId}>
          <span>직접 읽어보기</span>
          <input
            id={sampleId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="예문을 입력해 보세요"
          />
        </label>
        <label htmlFor={scaleId}>
          <span>참고 예제 배율</span>
          <select
            id={scaleId}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
          >
            <option value={1}>100%</option>
            <option value={1.5}>150%</option>
            <option value={2}>200%</option>
          </select>
        </label>
      </div>
      <p className="plfd-note">
        크기·굵기·색상의 관계를 보여주는 브라우저 예제예요. 이 배율은 iOS
        Dynamic Type 재현이 아니며, 네이티브 행 높이와 줄바꿈은 기기에서
        확인해요.
      </p>
      <div className="plfd-type-list">
        {IOS_FOUNDATIONS.typography.roles.map((role) => {
          const meta = TEXT_ROLE_LABELS[role.name];
          return (
            <article className="plfd-type-row" key={role.name}>
              <div className="plfd-type-meta">
                <strong>{meta.label}</strong>
                <code>TBTextStyle.{role.name}</code>
                <span>
                  {role.size}pt · {role.weight}
                </span>
              </div>
              <div
                className="plfd-type-sample"
                style={{ background: nativeColor("surface") }}
              >
                <p
                  style={{
                    fontFamily: '"Plating Sans", Pretendard, sans-serif',
                    fontSize: role.size * scale,
                    fontWeight: IOS_FOUNDATIONS.typography.weights[role.weight],
                    color: nativeColor(role.color),
                    lineHeight: 1.6,
                  }}
                >
                  {text || meta.sample}
                </p>
              </div>
              <dl>
                <div>
                  <dt>전경</dt>
                  <dd>
                    <code>TBColor.{role.color}</code>
                  </dd>
                </div>
                <div>
                  <dt>iOS 추가 행간</dt>
                  <dd>{role.additionalLineSpacing}pt</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
      <p className="plfd-note">
        추가 행간은 SwiftUI lineSpacing 값이에요. 폰트 자체의 행 높이에
        더해지며, 이 역할들은 자간을 별도로 지정하지 않아요.
      </p>
      <CodeExample>
        {
          'Text("이번 식사의 감각")\n    .tbTextStyle(.sectionTitle)\n\nText("고소한 향과 부드러운 질감을 기록했어요.")\n    .tbTextStyle(.body)'
        }
      </CodeExample>
    </>
  );
}
function LegacyTypography() {
  const legacy = IOS_FOUNDATIONS.typography.fontSizes.filter(
    (item) => Number(item.name.slice(1)) !== item.value,
  );
  return (
    <>
      <ReferenceTable
        caption="기존 사용처를 위한 글자 크기 이름"
        headings={["기존 iOS 이름", "실제 기본값"]}
      >
        {legacy.map((item) => (
          <tr key={item.name}>
            <th scope="row">
              <code>TBTypography.FontSize.{item.name}</code>
            </th>
            <td>{item.value}pt</td>
          </tr>
        ))}
      </ReferenceTable>
      <p className="plfd-note">
        새로운 제목과 본문에는 TBTextStyle의 역할을 먼저 선택해요. TBFont는
        요청한 기본 크기에 min(size, 18)을 적용하며, Dynamic Type으로 확대된
        표시 크기는 이 18pt 기본값과 구분합니다.
      </p>
    </>
  );
}
export function FoundationSection({
  slug,
  section,
  LinkComponent,
}: SectionProps) {
  if (slug === "foundations")
    return <TopicList section={section} LinkComponent={LinkComponent} />;
  if (slug === "foundations/design-tokens") {
    if (section === "layers") return <TokenLayers />;
    if (section === "naming")
      return <TokenNames LinkComponent={LinkComponent} />;
    if (section === "platforms") return <NativeSources />;
  }
  if (slug === "foundations/colors") {
    if (section === "visualization-colors") return <VisualizationColorReference />;
    if (section === "atomic") return <AtomicColorReference />;
    if (section === "semantic") return <><TasteSemanticReference /><SemanticColorReference compact /></>;
    if (section === "color-details") return <>
      <details className="pl-color-guide-details"><summary>미각색의 선정 이유</summary><TastePalette /></details>
      <details className="pl-color-guide-details"><summary>대비·상태 조합</summary><ContrastColorTable /><StateColorExamples /></details>
      <details className="pl-color-guide-details"><summary>제품 사용 예 · Light</summary><ColorUsageExamples /></details>
      <details className="pl-color-guide-details"><summary>기존 TB 컬러 비교</summary><ColorStyleMigration /></details>
    </>;
    if (section === "color-migration") return <ColorStyleMigration />;
    if (section === "roles") return <SemanticColorReference />;
    if (section === "state-pairs") return <StateColorExamples />;
    if (section === "interaction-colors") return <InteractionColorExamples />;
    if (section === "contrast") return <ContrastColorTable />;
    if (section === "color-usage-examples") return <ColorUsageExamples />;
    if (section === "taste") return <TastePalette />;
    if (section === "pairings") return <ColorPairings />;
  }
  if (slug === "foundations/typography") {
    if (section === "product") return <TypographyReference />;
    if (section === "component-text") return <ComponentTextReference />;
    if (section === "type-recipes") return <TypographyUsageReference />;
    if (section === "wrap") return <TypographyDynamicReference />;
    if (section === "fonts") return <TypographyFontReference />;
    if (section === "legacy") return <LegacyTypography />;
  }
  return <FoundationBehaviorSection slug={slug} section={section} />;
}
