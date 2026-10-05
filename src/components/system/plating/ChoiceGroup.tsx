import CapsuleTabs, { type CapsuleTabsProps } from './CapsuleTabs';

/** Compatibility alias. New consumers should use CapsuleTabs directly. */
export default function ChoiceGroup({ appearance = 'segmented', ...props }: CapsuleTabsProps<string> & {
  appearance?: 'segmented' | 'period';
}) {
  return <CapsuleTabs {...props} collapseToMenu={props.collapseToMenu ?? appearance === 'period'} />;
}
