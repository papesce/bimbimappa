import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import UnifiedSearchInput from './UnifiedSearchInput'
import FilterChip from './FilterChip'
import PanelFilters from './PanelFilters'
import PlaceCard from './PlaceCard'
import { toTitleCase } from '../lib/text'
import type { ActiveFilterChip, FilterKey, GeoPoint, MapBounds, Place, ViewingPlace } from '../types'
import type { PriceTier, PriorityLevel } from '../types'

export interface PlacesListProps {
  places: Place[]
  onDelete: (id: string) => void
  onEdit: (place: Place) => void
  onLocate: (place: Place) => void
  activeFilter: FilterKey
  center: GeoPoint | null
  stateName: string
  cityName: string
  radius: number
  onRadiusChange: (radius: number) => void
  onCitySelect: (lat: number, lng: number, name: string, state: string, countryCode: string) => void
  onClear: () => void
  onRecenter: () => void
  viewingPlace: ViewingPlace | null
  onClearViewing: () => void
  filter: FilterKey
  onFilterChange: (filter: FilterKey) => void
  viewportBounds: MapBounds | null
  onClearBounds: () => void
  boundsRadius: number | null
  onBoundsRadiusChange: (radius: number) => void
  onClearBoundsRadius: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onHoverRadius: (km: number | null) => void
  onHoverPlace?: (id: string | null) => void
  amenityFilters: string[]
  onAmenityFiltersChange: (filters: string[]) => void
  priceFilter: PriceTier | null
  onPriceFilterChange: (value: PriceTier | null) => void
  priorityFilter: PriorityLevel | null
  onPriorityFilterChange: (value: PriorityLevel | null) => void
  ratingFilter: number | null
  onRatingFilterChange: (value: number | null) => void
  onAddToTrip?: (place: Place) => void
}

export default function PlacesList({ places, onDelete, onEdit, onLocate, activeFilter, center, stateName, cityName, radius, onRadiusChange, onCitySelect, onClear, onRecenter, viewingPlace, onClearViewing, filter, onFilterChange, viewportBounds, onClearBounds, boundsRadius, onBoundsRadiusChange, onClearBoundsRadius, searchQuery, onSearchChange, onHoverRadius, onHoverPlace, amenityFilters, onAmenityFiltersChange, priceFilter, onPriceFilterChange, priorityFilter, onPriorityFilterChange, ratingFilter, onRatingFilterChange, onAddToTrip }: PlacesListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (!menuOpenId) return
    const close = () => setMenuOpenId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpenId])

  const activeFilters: ActiveFilterChip[] = []
  if (center) {
    activeFilters.push({
      type: 'city',
      label: cityName
        ? `📍 ${cityName}${radius ? ` · ${radius} km` : ''}`
        : `📍 ${radius ? `${radius} km radius` : 'Nearby'}`,
      onClear: onClear,
      onHover: (hover) => onHoverRadius(hover ? radius : null),
      onRecenter: onRecenter,
    })
  }
  if (viewportBounds && !center) {
    activeFilters.push({
      type: 'bounds',
      label: boundsRadius ? `Within ${boundsRadius} km` : 'Current map view',
      onClear: boundsRadius ? onClearBoundsRadius : onClearBounds,
      onHover: boundsRadius ? (hover) => onHoverRadius(hover ? boundsRadius : null) : undefined,
    })
  }

  const viewingFilter: ActiveFilterChip | null = viewingPlace ? {
    type: 'viewing',
    label: toTitleCase(viewingPlace.name),
    onClear: onClearViewing,
    onHover: (hover) => onHoverPlace?.(hover ? viewingPlace.id : null),
    onRecenter: () => {
      const place = places.find(p => p.id === viewingPlace.id)
      if (place) onLocate(place)
    }
  } : null

  if (places.length === 0) {
    const messages: Partial<Record<FilterKey, string>> = {
      week: 'No places added this week.',
      month: 'No places added this month.',
    }
    return (
      <>
        <div className="panel-search-area">
          <UnifiedSearchInput
            onCitySelect={onCitySelect}
            onClear={onClear}
            center={center}
            stateName={stateName}
            radius={radius}
            onRadiusChange={onRadiusChange}
            viewportBounds={viewportBounds}
            boundsRadius={boundsRadius}
            onBoundsRadiusChange={onBoundsRadiusChange}
            cityName={cityName}
            activeFilter={activeFilter}
            places={places}
            onLocate={onLocate}
            query={searchQuery}
            onQueryChange={onSearchChange}
            onHoverRadius={onHoverRadius}
          />
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
          />
          {viewingFilter && (
            <div className="filter-chips">
              <span className="filter-chips-label">Viewing</span>
              <FilterChip f={viewingFilter} />
            </div>
          )}
          {activeFilters.length > 0 && (
            <div className="filter-chips">
              <span className="filter-chips-label">Filters</span>
              {activeFilters.map((f, i) => (
                <FilterChip key={i} f={f} />
              ))}
            </div>
          )}
        </div>
        <div className="panel-scroll-area">
          <div className="empty-state">
            <MapPin size={32} strokeWidth={1.5} />
            <p>{messages[activeFilter] || 'No places saved yet.'}</p>
            <p className="empty-sub">
              {activeFilter && activeFilter !== 'all'
                ? 'Try switching to "All" to see everything.'
                : 'Tap "Add place" to drop the first pin.'}
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="panel-search-area">
          <UnifiedSearchInput
            onCitySelect={onCitySelect}
            onClear={onClear}
            center={center}
            stateName={stateName}
            radius={radius}
            onRadiusChange={onRadiusChange}
            viewportBounds={viewportBounds}
            boundsRadius={boundsRadius}
            onBoundsRadiusChange={onBoundsRadiusChange}
            cityName={cityName}
            activeFilter={activeFilter}
            places={places}
            onLocate={onLocate}
            query={searchQuery}
            onQueryChange={onSearchChange}
            onHoverRadius={onHoverRadius}
          />
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
          />
          {viewingFilter && (
            <div className="filter-chips">
              <span className="filter-chips-label">Viewing</span>
              <FilterChip f={viewingFilter} />
            </div>
          )}
          {activeFilters.length > 0 && (
            <div className="filter-chips">
              <span className="filter-chips-label">Filters</span>
              {activeFilters.map((f, i) => (
                <FilterChip key={i} f={f} />
              ))}
            </div>
          )}
      </div>
      <div className="panel-scroll-area">
      <ul className="places-list">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            confirmingId={confirmingId}
            setConfirmingId={setConfirmingId}
            menuOpenId={menuOpenId}
            setMenuOpenId={setMenuOpenId}
            onLocate={onLocate}
            onDelete={onDelete}
            onEdit={onEdit}
            onHoverPlace={onHoverPlace}
            onAddToTrip={onAddToTrip}
          />
        ))}
      </ul>
      </div>
    </>
  )
}
