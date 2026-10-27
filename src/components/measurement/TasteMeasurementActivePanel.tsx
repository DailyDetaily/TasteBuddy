import TbCoreLoop from '../graphics/TbCoreLoop';
import TasteCircularLoop from '../graphics/TasteCircularLoop';
import { useProductColorMode } from '../../lib/colorMode';
import { MEASUREMENT_PALETTES_BY_MODE } from '../../constants/colorModes';
import { type TasteId } from '../../constants/designTokens';
import { TASTE_TOKENS } from '../../constants/uiColorTokens';

interface TasteMeasurementActivePanelProps {
  activeLevel: number;
  currentTaste: (typeof TASTE_TOKENS)[keyof typeof TASTE_TOKENS];
  currentTasteId: TasteId;
}

export default function TasteMeasurementActivePanel({
  activeLevel,
  currentTaste,
  currentTasteId,
}: TasteMeasurementActivePanelProps) {
  const mode = useProductColorMode();
  const measurement = MEASUREMENT_PALETTES_BY_MODE[mode][currentTasteId];
  const currentTasteLoop = measurement.loop;

  return (
    <>
      <div className="mb-[10vh] mt-8 text-center">
        <h1 className="mb-3 text-[18px] font-bold leading-tight tracking-tight">
          <span style={{ color: measurement.textColor }}>
            {currentTaste.label}
          </span>{' '}
          민감도를 측정 중입니다...
        </h1>
        <p className="text-[14px] text-[var(--tb-color-text-body)]">
          {currentTaste.label}이(가) 느껴지면 즉시 버튼을 눌러주세요.
        </p>
      </div>

      <div className="relative flex flex-1 w-full items-center justify-center">
        {currentTasteId === 'sweet' ? (
          <TbCoreLoop activeLevel={activeLevel} />
        ) : (
          <TasteCircularLoop
            activeLevel={activeLevel}
            ariaLabel={`${currentTaste.label} core loop`}
            {...currentTasteLoop}
          />
        )}
      </div>
    </>
  );
}
