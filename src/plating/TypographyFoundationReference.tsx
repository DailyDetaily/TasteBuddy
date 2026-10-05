import { IOS_FOUNDATIONS, TEXT_ROLE_LABELS } from "./foundationReferenceData";
import { componentTextRecipes, nativeTypography, typographyRecipes, type TypographyCapture } from "./typographyReferenceData";
import "./typography-foundation.css";

function NativeTypeImage({ capture, alt }: { capture?: TypographyCapture; alt: string }) {
  if (!capture) return <p className="plfd-note">네이티브 표본을 준비하고 있어요.</p>;
  return <img src={`/plating/native-typography/${capture.file}`} alt={alt} width={capture.width} height={capture.height} loading="lazy" />;
}

export function TypographyRoleBoard() {
  return <>
    <div className="pl-type-role-board">{IOS_FOUNDATIONS.typography.roles.map(role => {
      const metric = nativeTypography.fonts.find(font => font.role === role.name);
      return <article className="pl-type-role" key={role.name}>
        <div className="pl-type-role-meta"><h3>{TEXT_ROLE_LABELS[role.name].label}</h3><code>TBTextStyle.{role.name}</code><strong>{role.size}pt · {role.weight}</strong><span>TBColor.{role.color}</span><span>추가 행간 {role.additionalLineSpacing}pt</span></div>
        <div className="pl-type-role-image"><NativeTypeImage capture={nativeTypography.captures.find(c => c.id === `role-${role.name}`)} alt={`${TEXT_ROLE_LABELS[role.name].label} 실제 SwiftUI 글자 표본`} />{metric && <small>폰트 기본 행 높이 {metric.lineHeight.toFixed(2)}pt</small>}</div>
      </article>;
    })}</div>
    <p className="plfd-note">기본 글자 크기 Large에서 실제 SwiftUI로 렌더한 표본이에요. 폰트 기본 행 높이는 등록된 UIFont의 측정값이고, 추가 행간은 SwiftUI lineSpacing 값이에요. 줄바꿈된 행 사이에 적용하며 고정 행 높이와는 달라요.</p>
  </>;
}

export function ComponentTextReference() {
  return <>
    <div className="pl-type-table" role="region" aria-label="컴포넌트의 글자 규격" tabIndex={0}><table><caption>공용 텍스트 역할과 함께 쓰는 컴포넌트 규격</caption><thead><tr><th>용도</th><th>글자</th><th>색상</th><th>사용 API</th><th>배치</th></tr></thead><tbody>{componentTextRecipes.map(([role, font, color, api, layout]) => <tr key={role}><th scope="row">{role}</th><td>{font}</td><td><code>{color}</code></td><td><code>{api}</code></td><td>{layout}</td></tr>)}</tbody></table></div>
    <p className="plfd-note">화면 상단 제목과 버튼은 해당 공용 컴포넌트에서 규격을 정해요. 현재 TBTextStyle에는 screenTitle·button이라는 별도 역할이 없어요. 새 본문은 TBTextStyle, 상단 바와 버튼은 해당 컴포넌트의 API를 사용해요.</p>
  </>;
}

export function TypographyUsageReference() {
  return <div className="pl-type-usage-list">{typographyRecipes.map(recipe => <article className="pl-type-usage" key={recipe.id}>
    <h3>{recipe.title}</h3><p>{recipe.description}</p>
    <div className="pl-type-usage-layout"><figure><NativeTypeImage capture={nativeTypography.captures.find(c => c.id === recipe.id)} alt={`${recipe.title} · 실제 폰트 조합을 사용한 SwiftUI 표본`} /><figcaption><code>{recipe.component}</code><span>제품 소스에서 추출한 글자 조합 · 문서용 예문</span></figcaption></figure>
    <div className="pl-type-recipe-rows">{recipe.rows.map(([name, font, color, layout]) => <div key={name}><strong>{name}</strong><span>{font}</span><code>{color}</code><small>{layout}</small></div>)}</div></div>
    <p className="plfd-note">{recipe.note}</p><details className="pl-type-sources"><summary>네이티브 구현 근거</summary>{recipe.sources.map(source => <p key={source}><code>ios/TasteBuddy/{source}</code></p>)}</details>
  </article>)}</div>;
}

export function TypographyDynamicReference() {
  const labels = { large: "기본 · Large", xxxLarge: "크게 · XXX Large", accessibility2: "접근성 · AX2" };
  return <>
    <div className="pl-type-dynamic-grid">{(["large", "xxxLarge", "accessibility2"] as const).map(category => {
      const capture = nativeTypography.captures.find(c => c.id === `dynamic-${category}`);
      return <figure key={category}><figcaption><strong>{labels[category]}</strong><code>.{category}</code></figcaption><NativeTypeImage capture={capture} alt={`${labels[category]}에서 긴 한국어 제목·본문·설명·버튼을 렌더한 SwiftUI 표본`} />{capture && <small>동일 너비 {capture.width}pt · 콘텐츠 높이 {capture.height}pt</small>}</figure>;
    })}</div>
    <p className="plfd-note">같은 문구와 390pt 너비에 iOS의 세 가지 Dynamic Type 크기를 적용했어요. 콘텐츠에 필요한 높이를 각각 측정해 캡처했으며, 실제 화면의 스크롤·키보드·고정 하단 영역 검증은 포함하지 않아요. 이미지를 화면에 맞춰 축소하므로 글자의 절대 크기는 기기에서 보는 크기와 다를 수 있어요.</p>
    <ul className="pl-type-wrap-rules"><li>긴 음식명·장소명·오류 안내로 제목과 본문이 끊기는 위치를 확인해요.</li><li>버튼의 높이는 최소값으로 사용하고, 확대된 문구가 필요한 높이를 확보해요.</li><li>말줄임이 있는 카드에는 원문을 확인할 경로를 함께 제공해요.</li><li>본문 전체를 작은 고정 크기나 minimumScaleFactor로 축소하지 않아요.</li></ul>
  </>;
}

export function TypographyFontReference() {
  const fonts = [...new Map(nativeTypography.fonts.map(font => [font.postScriptName, font])).values()];
  const order = ["Pretendard-Regular", "Pretendard-Medium", "Pretendard-SemiBold", "Pretendard-Bold"];
  fonts.sort((a, b) => order.indexOf(a.postScriptName) - order.indexOf(b.postScriptName));
  return <div className="pl-type-fonts">{fonts.map(font => <div key={font.postScriptName}><strong>{font.postScriptName}</strong><span>{font.familyName}</span><small>시뮬레이터에서 등록 확인</small></div>)}</div>;
}
