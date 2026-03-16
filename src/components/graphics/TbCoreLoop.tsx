import TasteCircularLoop from './TasteCircularLoop';

interface TbCoreLoopProps {
  activeLevel: number;
  className?: string;
}

const RING_BASE_COLOR = '#FFEBCC';
const RING_BASE_COLOR_SOFT = '#FFEBCC1A';
const RING_GUIDE_BASE_COLOR = '#FF9900';
const RING_GLOW_FAINT = '#FFEBCC08';

const SWEET_SCALE = [
  '#FFF5E5',
  '#FFEBCC',
  '#FFE0B2',
  '#FFD699',
  '#FFCC7F',
  '#FFC266',
  '#FFB74C',
  '#FFAD33',
  '#FFA319',
  '#FF9900',
] as const;

export default function TbCoreLoop({ activeLevel, className = '' }: TbCoreLoopProps) {
  return (
    <TasteCircularLoop
      activeLevel={activeLevel}
      ariaLabel="TB Core Loop"
      data-name="TB_Core Loop"
      data-node-id="2606:1965"
      className={className}
      glowTransparentColor={RING_GLOW_FAINT}
      nodeColors={SWEET_SCALE}
      ringBaseColor={RING_BASE_COLOR}
      ringBaseColorSoft={RING_BASE_COLOR_SOFT}
      ringGuideBaseColor={RING_GUIDE_BASE_COLOR}
    />
  );
}
