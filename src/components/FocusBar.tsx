import type { ActiveFilterChip, FilterKey, FocusEntity, PriceTier, PriorityLevel } from '../types';
import FilterChip from './FilterChip';
import PanelFilters from './PanelFilters';
import RadiusSelector from './RadiusSelector';

export interface FocusBarProps {
  focus: FocusEntity | null;
  areaChip: ActiveFilterChip | null;
  radiusValue: number;
  onClearFocus: () => void;
  onRecenter: () => void;
  onRadiusChange: (km: number) => void;
  onHoverRadius?: (km: number | null) => void;
  filter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  amenityFilters: string[];
  onAmenityFiltersChange: (filters: string[]) => void;
  priceFilter: PriceTier | null;
  onPriceFilterChange: (value: PriceTier | null) => void;
  priorityFilter: PriorityLevel | null;
  onPriorityFilterChange: (value: PriorityLevel | null) => void;
  ratingFilter: number | null;
  onRatingFilterChange: (value: number | null) => void;
  visitedFilter: 'all' | 'visited' | 'unvisited';
  onVisitedFilterChange: (value: 'all' | 'visited' | 'unvisited') => void;
}

export default function FocusBar({
  focus,
  areaChip,
  radiusValue,
  onClearFocus,
  onRecenter,
  onRadiusChange,
  onHoverRadius,
  filter,
  onFilterChange,
  amenityFilters,
  onAmenityFiltersChange,
  priceFilter,
  onPriceFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  ratingFilter,
  onRatingFilterChange,
  visitedFilter,
  onVisitedFilterChange,
}: FocusBarProps) {
  const chip: ActiveFilterChip | null = focus
    ? {
        type: focus.kind,
        label: focus.label,
        onClear: onClearFocus,
        onRecenter,
        onHover: hover => onHoverRadius?.(hover ? focus.radius : null),
      }
    : areaChip;

  return (
    <div className="focus-bar">
      {chip && (
        <div className="focus-bar-row">
          <FilterChip f={chip} />
          <span className="focus-bar-radius">
            <span className="focus-bar-radius-label">Radius</span>
            <RadiusSelector value={radiusValue} onChange={onRadiusChange} onHover={onHoverRadius} />
            <span className="focus-bar-radius-label">Km</span>
          </span>
        </div>
      )}
      <PanelFilters
        filter={filter}
        onFilterChange={onFilterChange}
        amenityFilters={amenityFilters}
        onAmenityFiltersChange={onAmenityFiltersChange}
        priceFilter={priceFilter}
        onPriceFilterChange={onPriceFilterChange}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={onPriorityFilterChange}
        ratingFilter={ratingFilter}
        onRatingFilterChange={onRatingFilterChange}
        visitedFilter={visitedFilter}
        onVisitedFilterChange={onVisitedFilterChange}
      />
    </div>
  );
}
