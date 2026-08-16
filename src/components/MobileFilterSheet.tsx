import { X } from 'lucide-react';
import { useDismissable } from '../hooks/useDismissable';
import type { FilterKey, PriceTier, PriorityLevel } from '../types';
import PanelFilters from './PanelFilters';

interface MobileFilterSheetProps {
  filter: FilterKey;
  onFilterChange: (value: FilterKey) => void;
  amenityFilters: string[];
  onAmenityFiltersChange: (value: string[]) => void;
  priceFilter: PriceTier | null;
  onPriceFilterChange: (value: PriceTier | null) => void;
  priorityFilter: PriorityLevel | null;
  onPriorityFilterChange: (value: PriorityLevel | null) => void;
  ratingFilter: number | null;
  onRatingFilterChange: (value: number | null) => void;
  visitedFilter: 'all' | 'visited' | 'unvisited';
  onVisitedFilterChange: (value: 'all' | 'visited' | 'unvisited') => void;
  onClose: () => void;
}

export default function MobileFilterSheet(props: MobileFilterSheetProps) {
  const sheetRef = useDismissable<HTMLElement>(props.onClose);
  return (
    <div className="mobile-filter-backdrop">
      <section ref={sheetRef} className="mobile-filter-sheet" aria-label="Browse filters">
        <div className="mobile-filter-heading">
          <div>
            <p className="eyebrow">Explore</p>
            <h2>Filter places</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={props.onClose}
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>
        <PanelFilters
          filter={props.filter}
          onFilterChange={props.onFilterChange}
          amenityFilters={props.amenityFilters}
          onAmenityFiltersChange={props.onAmenityFiltersChange}
          priceFilter={props.priceFilter}
          onPriceFilterChange={props.onPriceFilterChange}
          priorityFilter={props.priorityFilter}
          onPriorityFilterChange={props.onPriorityFilterChange}
          ratingFilter={props.ratingFilter}
          onRatingFilterChange={props.onRatingFilterChange}
          visitedFilter={props.visitedFilter}
          onVisitedFilterChange={props.onVisitedFilterChange}
          alwaysOpen
        />
        <button type="button" className="mobile-filter-done" onClick={props.onClose}>
          Show places
        </button>
      </section>
    </div>
  );
}
