import { MapPin, Trash2, Pencil, Navigation, MoreVertical } from 'lucide-react'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'
import { getLinks } from '../lib/links'
import { toTitleCase } from '../lib/text'
import { formatDateRange } from '../lib/date'
import BrandIcon from './BrandIcon'
import ConfirmRow from './ConfirmRow'
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
}

export default function PlaceCard({ place, confirmingId, setConfirmingId, menuOpenId, setMenuOpenId, onLocate, onDelete, onEdit }: PlaceCardProps) {
  return (
    <li className="place-card">
      <button
        className="place-card-body"
        onClick={() => onLocate(place)}
        title="Show on map"
      >
        <p className="place-name">{toTitleCase(place.name)}</p>
        <p className="place-address">{place.address}</p>
        {place.date_from && (
          <p className="place-date">{formatDateRange(place.date_from, place.date_to)}</p>
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
