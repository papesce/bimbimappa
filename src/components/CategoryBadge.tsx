import { getCategory } from '../lib/categories';
import type { PlaceCategory } from '../types';

export interface CategoryBadgeProps {
  category: PlaceCategory;
  showLabel?: boolean;
}

export default function CategoryBadge({ category, showLabel = false }: CategoryBadgeProps) {
  const { label, color, icon: Icon } = getCategory(category);
  return (
    <span className="category-badge" title={label}>
      <span className="category-badge-icon" style={{ background: color }}>
        <Icon size={11} strokeWidth={2.5} color="#fff" />
      </span>
      {showLabel && <span className="category-badge-label">{label}</span>}
    </span>
  );
}
