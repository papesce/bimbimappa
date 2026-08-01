import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import { FILTERS } from '../lib/filters'
import { AMENITY_OPTIONS, formatAmenity, formatPriceTier, formatPriority } from '../lib/placeAttributes'
import FilterChip from './FilterChip'
import type { ActiveFilterChip, FilterKey, PriceTier, PriorityLevel } from '../types'

export interface PanelFiltersProps {
  filter: FilterKey
  onFilterChange: (filter: FilterKey) => void
  amenityFilters: string[]
  onAmenityFiltersChange: (filters: string[]) => void
  priceFilter: PriceTier | null
  onPriceFilterChange: (value: PriceTier | null) => void
  priorityFilter: PriorityLevel | null
  onPriorityFilterChange: (value: PriorityLevel | null) => void
  ratingFilter: number | null
  onRatingFilterChange: (value: number | null) => void
}

export default function PanelFilters({
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
}: PanelFiltersProps) {
  const hasActive = filter !== 'all' || amenityFilters.length > 0 || priceFilter !== null || priorityFilter !== null || ratingFilter !== null
  const [open, setOpen] = useState(hasActive)

  const activeCount =
    (filter !== 'all' ? 1 : 0) +
    amenityFilters.length +
    (priceFilter ? 1 : 0) +
    (priorityFilter ? 1 : 0) +
    (ratingFilter ? 1 : 0)

  const toggleAmenity = (amenity: string) => {
    onAmenityFiltersChange(
      amenityFilters.includes(amenity)
        ? amenityFilters.filter(a => a !== amenity)
        : [...amenityFilters, amenity]
    )
  }

  const summaryChips: ActiveFilterChip[] = []
  if (filter !== 'all') {
    summaryChips.push({
      type: 'date',
      label: FILTERS.find(f => f.key === filter)?.label || filter,
      onClear: () => onFilterChange('all'),
    })
  }
  for (const amenity of amenityFilters) {
    summaryChips.push({
      type: 'attribute',
      label: formatAmenity(amenity),
      onClear: () => onAmenityFiltersChange(amenityFilters.filter(a => a !== amenity)),
    })
  }
  if (priceFilter) {
    summaryChips.push({
      type: 'attribute',
      label: `Price ${formatPriceTier(priceFilter)}`,
      onClear: () => onPriceFilterChange(null),
    })
  }
  if (priorityFilter) {
    summaryChips.push({
      type: 'attribute',
      label: `${formatPriority(priorityFilter)} priority`,
      onClear: () => onPriorityFilterChange(null),
    })
  }
  if (ratingFilter) {
    summaryChips.push({
      type: 'attribute',
      label: `${ratingFilter}★`,
      onClear: () => onRatingFilterChange(null),
    })
  }

  const clearAll = () => {
    onFilterChange('all')
    onAmenityFiltersChange([])
    onPriceFilterChange(null)
    onPriorityFilterChange(null)
    onRatingFilterChange(null)
  }

  return (
    <div className="panel-filters">
      <button
        type="button"
        className={`panel-filters-toggle${hasActive ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <SlidersHorizontal size={14} />
        <span>Filters</span>
        {activeCount > 0 && <span className="panel-filters-count">{activeCount}</span>}
        <ChevronDown size={14} className={`panel-filters-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <>
          <div className="panel-filter-group">
            <span className="panel-filter-label">Date</span>
            <div className="panel-filter-chips">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`filter-pill${filter === f.key ? ' active' : ''}`}
                  onClick={() => onFilterChange(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-filter-group">
            <span className="panel-filter-label">Amenities</span>
            <div className="panel-filter-chips">
              {AMENITY_OPTIONS.map(option => {
                const active = amenityFilters.includes(option)
                return (
                  <button
                    key={option}
                    className={`filter-pill filter-pill--attribute${active ? ' active' : ''}`}
                    onClick={() => toggleAmenity(option)}
                  >
                    {formatAmenity(option)}
                  </button>
                )
              })}
              {amenityFilters.length > 0 && (
                <button className="filter-pill filter-pill-clear" onClick={() => onAmenityFiltersChange([])}>
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </div>
          <div className="panel-filter-grid">
            <div className="panel-filter-group">
              <span className="panel-filter-label">Price</span>
              <div className="panel-filter-chips">
                {[1,2,3,4].map(t => (
                  <button key={t} className={`filter-pill filter-pill--attribute${priceFilter === t ? ' active' : ''}`} onClick={() => onPriceFilterChange(priceFilter === t ? null : t as PriceTier)}>
                    {formatPriceTier(t as PriceTier)}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-filter-group">
              <span className="panel-filter-label">Priority</span>
              <div className="panel-filter-chips">
                {[1,2,3].map(t => (
                  <button key={t} className={`filter-pill filter-pill--attribute${priorityFilter === t ? ' active' : ''}`} onClick={() => onPriorityFilterChange(priorityFilter === t ? null : t as PriorityLevel)}>
                    {formatPriority(t as PriorityLevel)}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-filter-group">
              <span className="panel-filter-label">Rating</span>
              <div className="panel-filter-chips">
                {[1,2,3,4,5].map(t => (
                  <button key={t} className={`filter-pill filter-pill--attribute${ratingFilter === t ? ' active' : ''}`} onClick={() => onRatingFilterChange(ratingFilter === t ? null : t)}>
                    {t}★
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!open && hasActive && (
        <div className="panel-filters-active">
          {summaryChips.map((chip, i) => (
            <FilterChip key={i} f={chip} />
          ))}
          {summaryChips.length > 1 && (
            <button className="filter-pill filter-pill-clear panel-filters-clear-all" onClick={clearAll}>
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
