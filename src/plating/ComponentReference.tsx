import { lazy, memo, Suspense, useId } from "react";
import type { CatalogComponent } from "./catalog";
import { getComponentDocumentation, type ComponentProperty } from "./componentDocumentation";
import { AnatomyAnnotations, anatomyNumberStyle } from "./NativeVisualDocumentation";

const Preview = lazy(() => import("./ComponentPreview"));
const sourceLabel = {
  web: "웹 속성",
  composition: "화면에서 조합",
  "native-spec": "Native 규격 재현",
};

function Comparison({ component, property, state }: { component: CatalogComponent; property: ComponentProperty; state: string }) {
  return (
    <div className="pl-property-group" data-property={property.key}>
      <div className="pl-property-heading">
        <h3>{property.title}</h3>
        <code>{property.api}</code>
      </div>
      <p>{property.description}</p>
      <div className="pl-web-property-board">
        {property.options.map((option) => (
          <figure className="pl-web-property-row" key={option.value} data-option={option.value}>
            <figcaption>
              <span>{property.title}</span><strong>{option.label}</strong>
              {option.description && <span>{option.description}</span>}
            </figcaption>
            <div className="pl-web-property-sample"><Preview component={component} state={option.previewState ?? state} options={{ [property.key]: option.value }} sample /></div>
          </figure>
        ))}
      </div>
    </div>
  );
}

function WebAnatomy({ component }: { component: CatalogComponent }) {
  const markerId = `web-anatomy-${useId().replaceAll(':', '')}`;
  const parts = getComponentDocumentation(component.id).anatomy;
  const state = component.id === 'disclosure' ? '펼침' : component.states.includes('열림') ? '열림' : component.states[0];
  return <figure className="pl-native-anatomy">
    <div className="pl-native-anatomy-scroll" role="region" aria-label={`${component.name} 웹 Anatomy 도해`} tabIndex={0}><div className="pl-web-anatomy-canvas">
      <div className="pl-web-anatomy-sample" aria-hidden="true" ref={node => { if (node) node.inert = true; }}><Preview component={component} state={state} sample /></div>
      <svg viewBox="0 0 780 430" role="img" aria-label={parts.map(([name]) => name).join(', ')}><AnatomyAnnotations markerId={markerId} left={225} top={110} width={330} height={210} labels={parts.map(([name], index) => [name, index === 0 ? .9 : .35 + index * .06, index === 0 ? .08 : .15 + index * .15])} /></svg>
    </div></div>
    <figcaption>현재 웹 공용 컴포넌트에 부품 번호와 연결선을 표시한 도해예요.</figcaption>
  </figure>;
}

function ComponentReference({ component, supplementary = false, idPrefix = "" }: { component: CatalogComponent; supplementary?: boolean; idPrefix?: string }) {
  const doc = getComponentDocumentation(component.id);
  const variantProperties = doc.properties.filter((p) => p.compare !== false && (p.kind === "variant" || p.kind === "layout"));
  const sizeProperties = doc.properties.filter((p) => p.compare !== false && p.kind === "size");
  const slotProperties = doc.properties.filter((p) => p.compare !== false && p.kind === "slot");
  const comparisonState = ["bottom-sheet", "dialog", "menu"].includes(component.id) ? "열림" : component.states[0];
  return (
    <Suspense fallback={<p>컴포넌트 예제를 불러오고 있어요.</p>}>
      {!supplementary && <section className="pl-doc-section" id={`${idPrefix}anatomy`}>
        <h2>Anatomy <span className="pl-heading-translation">구조</span></h2>
        <WebAnatomy component={component} />
        <ol className="pl-anatomy-list">
          {doc.anatomy.map(([name, description], index) => (
            <li key={name}><span className="pl-anatomy-index" aria-hidden="true" style={anatomyNumberStyle}>{index + 1}</span><div><h3>{name}</h3><p>{description}</p></div></li>
          ))}
        </ol>
      </section>}
      <section className="pl-doc-section" id={`${idPrefix}properties`}>
        <h2>Properties <span className="pl-heading-translation">속성</span></h2>
        <p>실제 컴포넌트에 전달하는 속성과 화면에서 함께 구성하는 동작을 구분해요. 위 프리뷰에서 옵션을 바꿔볼 수 있어요.</p>
        <div className="pl-property-table-wrap" role="region" aria-label="컴포넌트 속성 표" tabIndex={0}>
          <table className="pl-property-table">
            <caption className="pl-sr">{component.name} 속성, 지원 값과 문서 예제의 초기값</caption>
            <thead><tr><th scope="col">속성</th><th scope="col">값 / 예제 초기값</th><th scope="col">설명</th></tr></thead>
            <tbody>
              {doc.properties.map((property) => (
                <tr key={property.key}>
                  <th scope="row"><strong>{property.title}</strong><code>{property.api}</code><small>{sourceLabel[property.source]}</small></th>
                  <td><div className="pl-property-values">{property.options.map((v) => <code key={v.value}>{v.value}</code>)}</div><span className="pl-property-default">예제 초기값: {property.defaultValue}</span></td>
                  <td>{property.description}</td>
                </tr>
              ))}
              <tr><th scope="row">State<small>프리뷰 시작 상태</small></th><td>{doc.states.map(([value]) => value).join(" · ")}</td><td>상태를 고른 뒤 직접 조작할 수 있어요. 프리뷰의 초기값이 코드 원본의 기본값과 항상 같은 것은 아니에요.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="pl-doc-section" id={`${idPrefix}variants`}>
        <h2>Variant <span className="pl-heading-translation">종류와 배치</span></h2>
        <p>{doc.variantNote}</p>
        {variantProperties.map((property) => <Comparison component={component} property={property} state={comparisonState} key={property.key} />)}
        {variantProperties.length === 0 && <p className="pl-fixed-property">기본 외형을 유지하며 아래 상태와 슬롯으로 필요한 차이를 표현해요.</p>}
      </section>
      <section className="pl-doc-section" id={`${idPrefix}sizes`}>
        <h2>Size <span className="pl-heading-translation">크기</span></h2>
        <p>{doc.sizeNote}</p>
        {sizeProperties.map((property) => <Comparison component={component} property={property} state={comparisonState} key={property.key} />)}
      </section>
      {!supplementary && <section className="pl-doc-section" id={`${idPrefix}states`}>
        <h2>State <span className="pl-heading-translation">상태</span></h2>
        <p>아래는 상태를 나란히 비교하는 예제예요. 클릭·키보드 입력과 값 변경은 페이지 위의 프리뷰에서 확인해요.</p>
        <div className="pl-comparison-grid pl-state-grid">
          {doc.states.map(([value, description]) => (
            <figure className="pl-comparison-card" key={value} data-state-example={value}>
              <div className="pl-comparison-stage"><Preview component={component} state={value} sample /></div>
              <figcaption><strong>{value}</strong><span>{description}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>}
      <section className="pl-doc-section" id={`${idPrefix}slots`}>
        <h2>Slots <span className="pl-heading-translation">내용과 아이콘</span></h2>
        {doc.slots.length > 0 ? <dl className="pl-slot-list">{doc.slots.map(([name, description]) => <div key={name}><dt>{name}</dt><dd>{description}</dd></div>)}</dl> : <p>별도 콘텐츠 슬롯이 없어요. 지원하는 값과 배치 속성으로 사용해요.</p>}
        {slotProperties.map((property) => <Comparison component={component} property={property} state={comparisonState} key={property.key} />)}
      </section>
    </Suspense>
  );
}

export default memo(ComponentReference);
