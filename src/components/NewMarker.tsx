import { useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Trash2, Pencil, Navigation, Car, ExternalLink, Radar } from 'lucide-react'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'
import { getLinks } from '../lib/links'
import { formatDateRange } from '../lib/date'
import { toTitleCase } from '../lib/text'
import { formatAmenity, formatPriceTier, formatPriority, formatRating } from '../lib/placeAttributes'
import BrandIcon from './BrandIcon'
import ConfirmRow from './ConfirmRow'
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
    const links = getLinks(place)
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
        <div className="popup-icon-actions">
          <a
            href={googleMapsUrl(place.lat, place.lng)}
            rel="noopener noreferrer"
            className="popup-icon-action"
            title="Google Maps"
          >
            <Navigation size={18} />
          </a>
          <a
            href={wazeUrl(place.lat, place.lng)}
            rel="noopener noreferrer"
            className="popup-icon-action"
            title="Waze"
          >
            <Car size={18} />
          </a>
        </div>
        {links.length > 0 && (
          <div className="popup-links">
            {links.map(link => (
              <a
                key={link.id || link.url}
                href={link.url}
                rel="noopener noreferrer"
                className="popup-link-row"
              >
                <span className="popup-link-icon">
                  <BrandIcon url={link.url} size={14} />
                </span>
                <span className="popup-link-label">
                  {link.label || 'Link'}
                  {link.is_primary && <span className="popup-link-primary">primary</span>}
                </span>
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        )}
        <div className="popup-actions">
          <button className="popup-action-btn explore" onClick={() => onExplorePlace(place)}>
            <Radar size={12} /> Explore nearby
          </button>
          <button className="popup-action-btn" onClick={() => onEdit(place)}>
            <Pencil size={12} /> Edit
          </button>
          <button
            className="popup-action-btn danger"
            onClick={() => setConfirmingId(confirmingId === place.id ? null : place.id)}
            style={{ marginLeft: 'auto' }}
            title="Remove"
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
        {confirmingId === place.id && (
          <ConfirmRow
            variant="dense"
            onConfirm={() => { onDelete(place.id); setConfirmingId(null) }}
            onCancel={() => setConfirmingId(null)}
          />
        )}
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
