import personUsingTastickImage from '../../assets/Image of a person using the Tastick.png';
import { TASTE_TOKENS } from '../../constants/designTokens';

interface TasteMeasurementPreparationPanelProps {
  currentTaste: (typeof TASTE_TOKENS)[keyof typeof TASTE_TOKENS];
  stepIndex: number;
  totalSteps: number;
}

export default function TasteMeasurementPreparationPanel({
  currentTaste,
  stepIndex,
  totalSteps,
}: TasteMeasurementPreparationPanelProps) {
  return (
    <>
      <div className="mb-10 mt-8 text-center">
        <h1
          className="mb-3 text-[18px] font-bold leading-tight tracking-tight"
          style={{ color: currentTaste.measurement.accent }}
        >
          <span className="text-black">
            {currentTaste.measurement.ordinal}, {currentTaste.label} 측정
          </span>
        </h1>
        <p className="text-[14px] text-[var(--tb-color-text-body)]">
          지금부터 테이스틱이 10단계로 농도를 높여가며 용액을 분사합니다.
          <br />
          준비가 완료되면 테이스틱을 입에 물고 뒷면의 버튼을 눌러주세요.
        </p>
      </div>

      <div className="mb-6 flex flex-1 w-full items-center justify-center">
        <div className="relative flex aspect-square w-full max-w-[440px] items-center justify-center overflow-hidden rounded-[var(--tb-radius-20)] border border-[var(--tb-color-border-card)] bg-[var(--tb-color-bg-page)] shadow-sm">
          <img
            src={personUsingTastickImage}
            alt="Tastick Preparation"
            className="absolute inset-0 h-full w-full origin-bottom translate-y-[12%] scale-[1.9] object-cover object-center will-change-transform"
          />

          <div className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[12px] font-bold text-[var(--tb-color-text-hint)] backdrop-blur-sm">
            {stepIndex + 1} / {totalSteps}
          </div>
        </div>
      </div>
    </>
  );
}
