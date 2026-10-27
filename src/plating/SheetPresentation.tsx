import { useEffect, useRef, useState } from 'react';
import BottomSheetShell, { BottomSheetCloseButton } from '../components/system/BottomSheetShell';
import SheetBackground from '../components/system/SheetBackground';
import PrimaryButton from '../components/system/PrimaryButton';
import { DrawerDescription, DrawerTitle, DrawerTrigger } from '../components/ui/drawer';
import { SHEET_PRESENTATION_TOKENS } from '../constants/designTokens';
import { applySheetBackgroundCardProgress } from '../lib/sheetPresentation';
import './sheet-presentation.css';

/** Isolated viewport for the real web Drawer, including its drag and focus behavior. */
export function SheetPresentationPreview() {
  const [open, setOpen] = useState(false);
  const background = useRef<HTMLDivElement>(null);
  useEffect(() => { applySheetBackgroundCardProgress(background.current, open ? 1 : 0); }, [open]);

  return (
    <div className="pl-sheet-live">
      <BottomSheetShell
        presentation="web"
        autoFocus
        open={open}
        onOpenChange={setOpen}
        onDrag={(_, progress) => applySheetBackgroundCardProgress(background.current, 1 - progress, true)}
        onRelease={(_, remainsOpen) => applySheetBackgroundCardProgress(background.current, remainsOpen ? 1 : 0)}
        trigger={
          <SheetBackground ref={background} className="pl-sheet-live-background">
            <img src="/plating/native-layout/home-large.png" alt="기존 홈 화면 예제" draggable={false} />
            <DrawerTrigger asChild>
              <PrimaryButton className="pl-sheet-live-open">시트 열기</PrimaryButton>
            </DrawerTrigger>
          </SheetBackground>
        }
        contentClassName="!h-auto !max-h-[70dvh]"
        bodyClassName="px-5 pb-4"
        headerCenter={<DrawerTitle>계정 연결</DrawerTitle>}
        headerEnd={<BottomSheetCloseButton />}
        footer={<PrimaryButton onClick={() => setOpen(false)}>완료</PrimaryButton>}
      >
        <DrawerDescription className="pl-sheet-live-description">
          시트를 아래로 끌면 뒤 화면도 함께 돌아옵니다.
        </DrawerDescription>
        <div className="pl-sheet-live-field">
          <label htmlFor="sheet-example-name">프로필 이름</label>
          <input id="sheet-example-name" defaultValue="테이스트버디" autoComplete="off" />
        </div>
      </BottomSheetShell>
    </div>
  );
}

export default function SheetPresentation() {
  const native = SHEET_PRESENTATION_TOKENS.native;
  const web = SHEET_PRESENTATION_TOKENS.web;
  const rows = [
    ['배경 크기', `${native.background.scale * 100}%`, `${web.background.scale * 100}%`],
    ['아래로 이동', `상단 안전 영역 + ${native.background.offsetY}pt`, `${web.background.offsetY}px`],
    ['배경 모서리', `${native.background.radius}pt`, `${web.background.radius}px`],
    ['배경 어둡기', `${native.background.dimOpacity * 100}%`, `${web.background.dimOpacity * 100}%`],
    ['시트 모서리', `${native.surface.radius}pt`, `${web.surface.radius}px`],
    ['배경 그림자', '없음', `Y ${web.background.shadowY} · Blur ${web.background.shadowBlur} · ${web.background.shadowOpacity * 100}%`],
  ];
  return (
    <section className="pl-doc-section pl-sheet-presentation" id="sheet-presentation">
      <h2>시트와 배경 카드</h2>
      <p>기존 화면은 자리를 유지하고, 바깥 표시 레이어만 축소합니다. 시트의 열기·드래그·닫기에 같은 진행 값을 연결합니다.</p>
      <div className="pl-sheet-presentation-grid">
        <figure>
          <iframe title="시트와 배경 카드 조합 예제" src="/design-system/sheet-presentation-preview" width="402" height="874" />
          <figcaption>웹 제품 컴포넌트로 재생 · 배경은 기존 iOS 홈 캡처</figcaption>
        </figure>
        <div>
          <div className="pl-table-scroll">
            <table>
              <caption>플랫폼별 현재 규격</caption>
              <thead><tr><th scope="col">항목</th><th scope="col">iOS</th><th scope="col">Web</th></tr></thead>
              <tbody>{rows.map(([name, ios, browser]) => <tr key={name}><th scope="row">{name}</th><td>{ios}</td><td>{browser}</td></tr>)}</tbody>
            </table>
          </div>
          <h3>연결 규칙</h3>
          <ul>
            <li><code>BottomSheetShell</code>은 앞쪽 시트, <code>SheetBackground</code>는 기존 화면을 담습니다.</li>
            <li>닫힘은 0, 열림은 1입니다. 아래로 끄는 동안 1에서 0으로 이어집니다.</li>
            <li>스크롤 위치와 내부 배치를 유지합니다. 시트가 열리면 배경 조작을 막고, 닫힌 뒤 열기 버튼으로 초점을 돌립니다.</li>
            <li>동작 줄이기에서는 배경의 크기·이동을 멈추고 가림막을 유지합니다.</li>
          </ul>
          <details>
            <summary>토큰과 코드</summary>
            <p><code>SHEET_PRESENTATION_TOKENS</code> · iOS <code>TBSheetPresentation</code></p>
            <pre><code>{`onDrag={(_, dragged) =>
  applySheetBackgroundCardProgress(ref.current, 1 - dragged, true)
}
onRelease={(_, open) =>
  applySheetBackgroundCardProgress(ref.current, open ? 1 : 0)
}`}</code></pre>
          </details>
        </div>
      </div>
    </section>
  );
}
