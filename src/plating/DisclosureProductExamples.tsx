import { useEffect, useRef } from 'react';
import './disclosure-product-examples.css';

export default function DisclosureProductExamples() {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.location.hash === '#product-examples') sectionRef.current?.scrollIntoView({ block: 'start' });
  }, []);
  return <section className="pl-product-examples" id="product-examples" aria-labelledby="pl-product-examples-title" ref={sectionRef}>
    <div className="pl-product-examples-heading">
      <p>ACCORDION · 구조</p>
      <h2 id="pl-product-examples-title">헤더 타이틀과 콘텐츠 패널</h2>
      <p>시드와 같은 목록 구조로 구성하고, 본문은 불렛 또는 문장 형태로 작성해요.</p>
    </div>
    <div className="pl-product-assessment">
      <p><strong>여러 항목이 세로로 이어지는 아코디언이에요.</strong> 항목 사이에 구분선을 두고, 펼친 본문은 해당 헤더 바로 아래에 배치합니다.</p>
      <ul>
        <li><strong>접힘:</strong> 헤더 타이틀과 아래 방향 화살표만 표시해요.</li>
        <li><strong>펼침:</strong> 헤더 타이틀, 위 방향 화살표, 콘텐츠 패널을 표시해요.</li>
        <li><strong>콘텐츠 패널:</strong> 짧은 정보는 불렛 목록, 이어지는 설명은 문장형으로 작성해요.</li>
      </ul>
      <p>기본은 한 항목씩 펼치며, 여러 항목을 동시에 여는 방식도 제공해요. 긴 본문은 패널 높이가 늘어나고 페이지에서 함께 스크롤됩니다.</p>
      <a href="https://seed-design.io/components/accordion" target="_blank" rel="noreferrer">참조한 구조 · SEED Accordion</a>
    </div>
  </section>;
}
