import { Image, SwitchCamera, X, ZapOff } from 'lucide-react';
import { useRef } from 'react';

/** Camera and photo access are handed to the browser only after an explicit tap. */
export default function NativeDiningCameraSource({ onPhoto, onManual, onClose }: {
  onPhoto: (file: File) => void;
  onManual: () => void;
  onClose: () => void;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const shell = useRef<HTMLElement>(null);
  return <section ref={shell} role="dialog" aria-modal="true" aria-label="음식 사진 기록" className="fixed inset-0 z-[80] flex flex-col bg-black text-white" onKeyDown={(event) => {
    if (event.key === 'Escape') onClose();
    if (event.key === 'Tab') {
      const controls = Array.from(shell.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <div className="flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <button autoFocus type="button" aria-label="카메라 닫기" className="flex size-12 items-center justify-center" onClick={onClose}><X size={24} strokeWidth={1.8} /></button>
      <span aria-label="플래시는 촬영 화면에서 설정" className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white/40"><ZapOff size={24} strokeWidth={1.8} /></span>
    </div>
    <div className="flex flex-1 items-center px-5">
      <p className="w-full rounded-[20px] border border-white/15 bg-black/55 px-4 py-3 text-center text-[13px] leading-[1.5]">촬영 버튼으로 카메라를 열거나<br />사진첩에서 이미지를 골라 기록을 이어가세요.</p>
    </div>
    <div className="px-7 pb-[max(28px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="사진첩에서 선택" className="flex size-12 items-center justify-center rounded-full bg-white/15" onClick={() => library.current?.click()}><Image size={24} strokeWidth={1.8} /></button>
        <button type="button" aria-label="음식 사진 촬영" className="flex size-[72px] items-center justify-center rounded-full border-2 border-white" onClick={() => camera.current?.click()}><span className="size-[58px] rounded-full bg-white" /></button>
        <span aria-label="전면·후면 전환은 촬영 화면에서 설정" className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white/40"><SwitchCamera size={24} strokeWidth={1.8} /></span>
      </div>
      <button type="button" className="mt-5 min-h-11 w-full text-[13px] text-white/75" onClick={onManual}>사진 없이 기록하기</button>
    </div>
    <input ref={camera} aria-label="카메라 사진" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onPhoto(file); }} />
    <input ref={library} aria-label="사진첩 이미지" type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onPhoto(file); }} />
  </section>;
}
