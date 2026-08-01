import { X } from 'lucide-react'
import PanelFilters from './PanelFilters'
import type { FilterKey, PriceTier, PriorityLevel } from '../types'

interface MobileFilterSheetProps {
  filter: FilterKey
  onFilterChange: (value: FilterKey) => void
  amenityFilters: string[]
  onAmenityFiltersChange: (value: string[]) => void
  priceFilter: PriceTier | null
  onPriceFilterChange: (value: PriceTier | null) => void
  priorityFilter: PriorityLevel | null
  onPriorityFilterChange: (value: PriorityLevel | null) => void
  ratingFilter: number | null
  onRatingFilterChange: (value: number | null) => void
  onClose: () => void
}

export default function MobileFilterSheet(props: MobileFilterSheetProps) {
  return (
    <div className="mobile-filter-backdrop" onClick={props.onClose}>
      <section className="mobile-filter-sheet" onClick={e => e.stopPropagation()} aria-label="Browse filters">
        <div className="mobile-filter-heading">
          <div><p className="eyebrow">Explore</p><h2>Filter places</h2></div>
          <button className="icon-btn" onClick={props.onClose} aria-label="Close filters"><X size={18} /></button>
        </div>
        <PanelFilters {...props} alwaysOpen />
        <button className="mobile-filter-done" onClick={props.onClose}>Show places</button>
      </section>
    </div>
  )
}
