import { MapPin, Navigation, Search, SlidersHorizontal, X } from 'lucide-react'
import { CATEGORIES, getCategory } from '../lib/categories'
import { getDistanceKm } from '../lib/geo'
import { getPrimaryLink } from '../lib/links'
import { toTitleCase } from '../lib/text'
import BrandIcon from './BrandIcon'
import type { Place, PlaceCategory } from '../types'

interface MobileExplorerProps {
  places: Place[]
  center: { lat: number; lng: number } | null
  cityName: string
  query: string
  onQueryChange: (query: string) => void
  category: PlaceCategory | null
  onCategoryChange: (category: PlaceCategory | null) => void
  onSelect: (place: Place) => void
  onNearMe: () => void
  onOpenFilters: () => void
}

export default function MobileExplorer({ places, center, cityName, query, onQueryChange, category, onCategoryChange, onSelect, onNearMe, onOpenFilters }: MobileExplorerProps) {
  const normalizedQuery = query.trim().toLowerCase()
  const visiblePlaces = places
    .filter(place => !category || place.category === category)
    .filter(place => !normalizedQuery || `${place.name} ${place.address}`.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      if (!center) return 0
      return getDistanceKm(center.lat, center.lng, a.lat, a.lng) - getDistanceKm(center.lat, center.lng, b.lat, b.lng)
    })
    .slice(0, 12)

  return (
    <section className="mobile-explorer" aria-label="Explore places">
      <div className="mobile-explorer-grip" />
      <div className="mobile-explorer-heading">
        <div>
          <p className="eyebrow">Explore</p>
          <h2>{cityName ? `Near ${cityName}` : 'Places nearby'}</h2>
        </div>
        <button className="mobile-explorer-filter" onClick={onOpenFilters} aria-label="Open filters">
          <SlidersHorizontal size={17} />
        </button>
      </div>

      <div className="mobile-explorer-search">
        <Search size={17} />
        <input value={query} onChange={e => onQueryChange(e.target.value)} placeholder="Search places" aria-label="Search places" />
        {query && <button onClick={() => onQueryChange('')} aria-label="Clear search"><X size={15} /></button>}
      </div>

      <div className="mobile-explorer-actions">
        <button className="mobile-explorer-nearby" onClick={onNearMe}><Navigation size={15} /> Near me</button>
        <span className="mobile-explorer-count">{visiblePlaces.length} places</span>
      </div>

      <div className="mobile-explorer-types" aria-label="Browse by type">
        <button className={!category ? 'active' : ''} onClick={() => onCategoryChange(null)}>All</button>
        {CATEGORIES.filter(item => item.key !== 'home').map(item => {
          const count = places.filter(place => place.category === item.key).length
          if (!count) return null
          return <button key={item.key} className={category === item.key ? 'active' : ''} onClick={() => onCategoryChange(category === item.key ? null : item.key)}>{item.label}</button>
        })}
      </div>

      <div className="mobile-explorer-results">
        {visiblePlaces.map(place => {
          const primaryLink = getPrimaryLink(place)
          const config = getCategory(place.category)
          const distance = center ? getDistanceKm(center.lat, center.lng, place.lat, place.lng) : null
          return (
            <article className="mobile-explorer-card" key={place.id} onClick={() => onSelect(place)}>
              <div className="mobile-explorer-card-icon" style={{ backgroundColor: config.color }}><MapPin size={16} /></div>
              <div className="mobile-explorer-card-body">
                <strong>{toTitleCase(place.name)}</strong>
                <span>{config.label}{distance !== null ? ` · ${distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}` : ''}</span>
              </div>
              {primaryLink && <a className="mobile-explorer-source" href={primaryLink.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label={`Open source for ${place.name}`}><BrandIcon url={primaryLink.url} size={17} /></a>}
            </article>
          )
        })}
        {visiblePlaces.length === 0 && <p className="mobile-explorer-empty">No places match. Try another type or search.</p>}
      </div>
    </section>
  )
}
