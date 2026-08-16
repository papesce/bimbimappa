import { MapPin } from 'lucide-react'
import UnifiedSearchInput from './UnifiedSearchInput'
import PlaceCard from './PlaceCard'
import type { GeoPoint, Place } from '../types'

export interface PlacesListProps {
  places: Place[]
  onDelete: (id: string) => void
  onEdit: (place: Place) => void
  onLocate: (place: Place) => void
  onCitySelect: (lat: number, lng: number, name: string, state: string, countryCode: string) => void
  onClear: () => void
  center: GeoPoint | null
  stateName: string
  cityName: string
  searchQuery: string
  onSearchChange: (query: string) => void
  onHoverPlace?: (id: string | null) => void
  onAddToTrip?: (place: Place) => void
  onExplore: (place: Place) => void
  confirmingId: string | null
  setConfirmingId: (id: string | null) => void
}

export default function PlacesList({ places, onDelete, onEdit, onLocate, onCitySelect, onClear, center, stateName, cityName, searchQuery, onSearchChange, onHoverPlace, onAddToTrip, onExplore, confirmingId, setConfirmingId }: PlacesListProps) {
  const search = (
    <div className="panel-search-area">
      <UnifiedSearchInput
        onCitySelect={onCitySelect}
        onClear={onClear}
        center={center}
        stateName={stateName}
        cityName={cityName}
        places={places}
        onLocate={onLocate}
        query={searchQuery}
        onQueryChange={onSearchChange}
        hideRadius
      />
    </div>
  )

  if (places.length === 0) {
    return (
      <>
        {search}
        <div className="panel-scroll-area">
          <div className="empty-state">
            <MapPin size={32} strokeWidth={1.5} />
            <p>No places saved yet.</p>
            <p className="empty-sub">
              Tap "Add place" to drop the first pin.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {search}
      <div className="panel-scroll-area">
      <ul className="places-list">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            confirmingId={confirmingId}
            setConfirmingId={setConfirmingId}
            onLocate={onLocate}
            onDelete={onDelete}
            onEdit={onEdit}
            onExplore={onExplore}
            onHoverPlace={onHoverPlace}
            onAddToTrip={onAddToTrip}
          />
        ))}
      </ul>
      </div>
    </>
  )
}
