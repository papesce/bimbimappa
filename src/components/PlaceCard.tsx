import { MapPin, Trash2, Pencil, Navigation, MoreVertical, Compass } from 'lucide-react'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'
import { getLinks } from '../lib/links'
import { toTitleCase } from '../lib/text'
import { formatDateRange } from '../lib/date'
import { formatAmenity, formatPriceTier, formatPriority, formatRating } from '../lib/placeAttributes'
import BrandIcon from './BrandIcon'
import ConfirmRow from './ConfirmRow'
import CategoryBadge from './CategoryBadge'
import type { Place } from '../types'

export interface PlaceCardProps {
  place: Place
  confirmingId: string | null
  setConfirmingId: (id: string | null) => void
  menuOpenId: string | null
  setMenuOpenId: (id: string | null) => void
  onLocate: (place: Place) => void
  onDelete: (id: string) => void
  onEdit: (place: Place) => void
  onHoverPlace?: (id: string | null) => void
  onAddToTrip?: (place: Place) => void
}

export default function PlaceCard({ place, confirmingId, setConfirmingId, menuOpenId, setMenuOpenId, onLocate, onDelete, onEdit, onHoverPlace, onAddToTrip }: PlaceCardProps) {
  return (
    <li
      className="place-card"
      onMouseEnter={() => onHoverPlace?.(place.id)}
      onMouseLeave={() => onHoverPlace?.(null)}
    >
      <button
        className="place-card-body"
        onClick={() => onLocate(place)}
        title="Show on map"
      >
        <p className="place-name">
          {place.category && <CategoryBadge category={place.category} />}
          {toTitleCase(place.name)}
        </p>
        <p className="place-address">{place.address}</p>
        {place.photo_url && <img src={place.photo_url} alt="" className="place-card-photo" />}
        {place.date_from && (
          <p className="place-date">{formatDateRange(place.date_from, place.date_to)}</p>
        )}
        {(place.price_tier || place.priority || place.rating || (place.amenities && place.amenities.length > 0)) && (
          <p className="place-metrics">
            {place.price_tier && <span className="place-metric">{formatPriceTier(place.price_tier)}</span>}
            {place.priority && <span className="place-metric">{formatPriority(place.priority)}</span>}
            {place.rating && <span className="place-metric">{formatRating(place.rating)}</span>}
            {place.amenities?.slice(0, 3).map(a => <span key={a} className="place-metric">{formatAmenity(a)}</span>)}
          </p>
        )}
        {place.notes && <p className="place-notes">"{place.notes}"</p>}
      </button>
      <div className="place-card-actions">
        <div className="card-menu-wrapper">
          <button
            className="action-btn"
            title="More actions"
            onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === place.id ? null : place.id) }}
          >
            <MoreVertical size={14} />
          </button>
          {menuOpenId === place.id && (
            <div className="card-menu" onClick={e => e.stopPropagation()}>
              <a href={googleMapsUrl(place.lat, place.lng)} rel="noopener noreferrer" className="card-menu-item" onClick={() => setMenuOpenId(null)}>
                <MapPin size={13} />Google Maps
              </a>
              <a href={wazeUrl(place.lat, place.lng)} rel="noopener noreferrer" className="card-menu-item" onClick={() => setMenuOpenId(null)}>
                <Navigation size={13} />Waze
              </a>
              {getLinks(place).map(link => (
                <a key={link.id || link.url} href={link.url} rel="noopener noreferrer" className="card-menu-item" onClick={() => setMenuOpenId(null)}>
                  <BrandIcon url={link.url} size={13} />{link.label || 'Link'}{link.is_primary ? ' ★' : ''}
                </a>
              ))}
              {onAddToTrip && (
                <button className="card-menu-item" onClick={() => { onAddToTrip(place); setMenuOpenId(null) }}>
                  <Compass size={13} />Add to Trip
                </button>
              )}
              <button className="card-menu-item" onClick={() => { onEdit(place); setMenuOpenId(null) }}>
                <Pencil size={13} />Edit
              </button>
              <div className="card-menu-divider" />
              {confirmingId === place.id ? (
                <ConfirmRow
                  variant="dense"
                  onConfirm={() => { onDelete(place.id); setConfirmingId(null); setMenuOpenId(null) }}
                  onCancel={() => setConfirmingId(null)}
                />
              ) : (
                <button className="card-menu-item danger" onClick={() => setConfirmingId(place.id)}>
                  <Trash2 size={13} />Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
