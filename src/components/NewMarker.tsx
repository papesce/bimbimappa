import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Trash2, Pencil, Navigation, Car, ExternalLink, Radar } from 'lucide-react'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'
import { getLinks } from '../lib/links'
import { formatDateRange } from '../lib/date'
import BrandIcon from './BrandIcon'
import ConfirmRow from './ConfirmRow'
import AutoOpenPopup from './AutoOpenPopup'
import type { Place } from '../types'

export interface NewMarkerProps {
  place: Place
  icon: L.DivIcon
  isNew: boolean
  confirmingId: string | null
  setConfirmingId: (id: string | null) => void
  onDelete: (id: string) => void
  onEdit: (place: Place) => void
  markerRefs: MutableRefObject<Record<string, L.Marker | null>>
  isMobile: boolean
  onMobilePopup: (placeId: string) => void
  onExplorePlace: (place: Place) => void
}

export default function NewMarker({ place, icon, isNew, confirmingId, setConfirmingId, onDelete, onEdit, markerRefs, isMobile, onMobilePopup, onExplorePlace }: NewMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)
  const links = getLinks(place)

  useEffect(() => {
    markerRefs.current[place.id] = markerRef.current
    return () => { delete markerRefs.current[place.id] }
  })

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={icon}
      eventHandlers={isMobile ? { click: () => onMobilePopup(place.id) } : undefined}
    >
      {isNew && (
        <AutoOpenPopup
          markerRef={markerRef}
          isMobile={isMobile}
          placeId={place.id}
          onMobilePopup={onMobilePopup}
        />
      )}
      {!isMobile && <Popup minWidth={240} closeButton={true} autoPanPaddingTopLeft={L.point(24, 96)} autoPanPaddingBottomRight={L.point(24, 24)}>
        <div className="popup">
          <p className="popup-name">{place.name}</p>
          <p className="popup-address">{place.address}</p>
          {place.date_from && (
            <p className="popup-date">{formatDateRange(place.date_from, place.date_to)}</p>
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
      </Popup>}
    </Marker>
  )
}
