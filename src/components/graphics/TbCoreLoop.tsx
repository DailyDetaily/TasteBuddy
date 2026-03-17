import TasteCircularLoop from './TasteCircularLoop';
import { TASTE_TOKENS } from '../../constants/designTokens';

interface TbCoreLoopProps {
  activeLevel: number;
  className?: string;
}

const SWEET_LOOP = TASTE_TOKENS.sweet.measurement.loop;

export default function TbCoreLoop({ activeLevel, className = '' }: TbCoreLoopProps) {
  return (
    <TasteCircularLoop
      activeLevel={activeLevel}
      ariaLabel="TB Core Loop"
      data-name="TB_Core Loop"
      data-node-id="2606:1965"
      className={className}
      glowTransparentColor={SWEET_LOOP.glowTransparentColor}
      nodeColors={SWEET_LOOP.nodeColors}
      ringBaseColor={SWEET_LOOP.ringBaseColor}
      ringBaseColorSoft={SWEET_LOOP.ringBaseColorSoft}
      ringGuideBaseColor={SWEET_LOOP.ringGuideBaseColor}
    />
  );
}
