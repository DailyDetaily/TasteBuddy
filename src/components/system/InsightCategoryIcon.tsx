import { Globe, Heart, Orbit, RefreshCw, Speech } from 'lucide-react';
import { ICON_TOKENS } from '../../constants/designTokens';
import { categories, type Category } from '../../lib/gastronomy/engine';

export const InsightExperienceIcon = Globe;

/** The same five meanings are used by navigation and summary-card headers. */
export const INSIGHT_CATEGORY_ICONS = {
  experience: InsightExperienceIcon,
  sensation: Speech,
  preference: Heart,
  context: Orbit,
  change: RefreshCw,
} as const;

export default function InsightCategoryIcon({
  category,
  size = ICON_TOKENS.size.base,
  strokeWidth = ICON_TOKENS.strokeWidth.medium,
  className,
  color,
}: {
  category: Category;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}) {
  const Icon = INSIGHT_CATEGORY_ICONS[category];
  return <Icon
    aria-hidden="true"
    data-insight-category={category}
    className={className}
    size={size}
    style={{ color: color ?? categories.find(item => item.id === category)!.color }}
    fill="none"
    strokeWidth={category === 'preference' ? ICON_TOKENS.strokeWidth.strong : strokeWidth}
  />;
}
