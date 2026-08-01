import { useState } from 'react'
import { Compass, ExternalLink, MapPin, MoreVertical, Navigation, Pencil, Trash2 } from 'lucide-react'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'
import { getLinks } from '../lib/links'
import BrandIcon from './BrandIcon'
import ConfirmRow from './ConfirmRow'
import type { Place } from '../types'

export interface PlaceActionsProps {
  place: Place
  confirmingId: string | null
  setConfirmingId: (id: string | null) => void
  onDelete: (id: string) => void
  onEdit: (place: Place) => void
  onExplore: (place: Place) => void
  variant?: 'inline' | 'expanded'
}

export function isPlaceDeleteConfirming(id: string, confirmingId: string | null, place: Place): boolean {
  return confirmingId === id && place.id === id
}

export default function PlaceActions({
  place,
  confirmingId,
  setConfirmingId,
  onDelete,
  onEdit,
  onExplore,
  variant = 'inline',
}: PlaceActionsProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const links = getLinks(place)
  const confirming = isPlaceDeleteConfirming(place.id, confirmingId, place)

  return (
    <div className={`place-actions place-actions--${variant}`}>
      <div className="place-actions-primary">
        <button className="place-action-btn explore" onClick={() => onExplore(place)}>
          <Compass size={12} /> Nearby
        </button>
        <button className="place-action-btn" onClick={() => onEdit(place)}>
          <Pencil size={12} /> Edit
        </button>
        <button
          className="place-action-btn"
          onClick={() => setMoreOpen(o => !o)}
          aria-expanded={moreOpen}
          title={moreOpen ? 'Hide more actions' : 'More actions'}
        >
          <MoreVertical size={12} /> {moreOpen ? 'Less' : 'More'}
        </button>
      </div>

      {moreOpen && (
        <div className="place-actions-more">
          <a href={googleMapsUrl(place.lat, place.lng)} rel="noopener noreferrer" className="place-actions-row-link">
            <MapPin size={14} /> <span className="place-actions-link-label">Google Maps</span>
          </a>
          <a href={wazeUrl(place.lat, place.lng)} rel="noopener noreferrer" className="place-actions-row-link">
            <Navigation size={14} /> <span className="place-actions-link-label">Waze</span>
          </a>
          {links.length > 0 && (
            <>
              <div className="place-actions-divider" />
              {links.map(link => (
                <a
                  key={link.id || link.url}
                  href={link.url}
                  rel="noopener noreferrer"
                  className="place-actions-row-link"
                >
                  <BrandIcon url={link.url} size={14} />
                  <span className="place-actions-link-label">
                    {link.label || 'Link'}
                    {link.is_primary && <span className="place-actions-link-primary">primary</span>}
                  </span>
                  <ExternalLink size={13} />
                </a>
              ))}
            </>
          )}
          <div className="place-actions-divider" />
          {confirming ? (
            <ConfirmRow
              variant="inline"
              onConfirm={() => { onDelete(place.id); setConfirmingId(null) }}
              onCancel={() => setConfirmingId(null)}
            />
          ) : (
            <button className="place-actions-row-link danger" onClick={() => setConfirmingId(place.id)}>
              <Trash2 size={14} /> <span className="place-actions-link-label">Remove</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
