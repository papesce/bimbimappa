import { useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { formatDateRange } from '../lib/date'
import { toTitleCase } from '../lib/text'
import { formatAmenity, formatPriceTier, formatPriority, formatRating } from '../lib/placeAttributes'
import PlaceActions from './PlaceActions'
import CategoryBadge from './CategoryBadge'
import type { Place } from '../types'

export interface NewMarkerProps {
  place: Place
  icon: L.DivIcon
  confirmingId: string | null
  setConfirmingId: (id: string | null) => void
  onDelete: (id: string) => void
  onEdit: (place: Place) => void
  markerRefs: MutableRefObject<Record<string, L.Marker | null>>
  isMobile: boolean
  onMobilePopup: (placeId: string) => void
  onExplorePlace: (place: Place) => void
}

export default function NewMarker({ place, icon, confirmingId, setConfirmingId, onDelete, onEdit, markerRefs, isMobile, onMobilePopup, onExplorePlace }: NewMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    markerRefs.current[place.id] = markerRef.current
    return () => { delete markerRefs.current[place.id] }
  }, [markerRefs, place.id])

  // Stable reference across re-renders: react-leaflet's Popup re-runs instance.update()
  // whenever props.children identity changes, which can feed an autopan -> moveend ->
  // setState -> re-render loop near the viewport edge (Safari).
  const popupContent = useMemo(() => {
    return (
      <div className="popup">
        <p className="popup-name">
          {place.category && <CategoryBadge category={place.category} />}
          {toTitleCase(place.name)}
        </p>
        <p className="popup-address">{place.address}</p>
        {place.date_from && (
          <p className="popup-date">{formatDateRange(place.date_from, place.date_to)}</p>
        )}
        {(place.price_tier || place.priority || place.rating || (place.amenities && place.amenities.length > 0)) && (
          <p className="popup-metrics">
            {place.price_tier && <span className="popup-metric">{formatPriceTier(place.price_tier)}</span>}
            {place.priority && <span className="popup-metric">{formatPriority(place.priority)}</span>}
            {place.rating && <span className="popup-metric">{formatRating(place.rating)}</span>}
            {place.amenities?.slice(0, 3).map(a => <span key={a} className="popup-metric">{formatAmenity(a)}</span>)}
          </p>
        )}
        {place.notes && (
          <p className="popup-notes">"{place.notes}"</p>
        )}
        <PlaceActions
          place={place}
          variant="inline"
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
          onDelete={onDelete}
          onEdit={onEdit}
          onExplore={onExplorePlace}
        />
      </div>
    )
  }, [place, confirmingId, setConfirmingId, onDelete, onEdit, onExplorePlace])

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={icon}
      eventHandlers={isMobile ? { click: () => onMobilePopup(place.id) } : undefined}
    >
      {!isMobile && <Popup minWidth={240} closeButton={true} autoPanPaddingTopLeft={L.point(24, 96)} autoPanPaddingBottomRight={L.point(24, 24)}>
        {popupContent}
      </Popup>}
    </Marker>
  )
}
