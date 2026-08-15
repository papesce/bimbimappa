import { useState } from 'react'
import { Compass, ExternalLink, MapPin, MoreVertical, Navigation, Pencil, Plus, Trash2 } from 'lucide-react'
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
  onAddToTrip?: (place: Place) => void
  notes?: string | null
  isMobile?: boolean
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
  onAddToTrip,
  notes,
  isMobile = false,
  variant = 'inline',
}: PlaceActionsProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const links = getLinks(place)
  const confirming = isPlaceDeleteConfirming(place.id, confirmingId, place)
  const primaryLink = links.find(link => link.is_primary) || links[0] || null
  const secondaryLinks = primaryLink ? links.filter(link => link.id !== primaryLink.id || link.url !== primaryLink.url) : links

  return (
    <div className={`place-actions place-actions--${variant} ${isMobile ? 'place-actions-mobile' : 'place-actions-desktop'}`}>
      <div className="place-actions-primary">
        {isMobile ? (primaryLink ? (
          <a href={primaryLink.url} rel="noopener noreferrer" className="place-action-btn source-link">
            <ExternalLink size={12} /> Source
          </a>
        ) : (
          <button className="place-action-btn source-link source-unavailable" disabled><ExternalLink size={12} /> Source</button>
        )) : (primaryLink ? (
          <a href={primaryLink.url} rel="noopener noreferrer" className="place-action-btn source-link">
            <ExternalLink size={12} /> Source
          </a>
        ) : (
          <button className="place-action-btn source-link source-unavailable" disabled><ExternalLink size={12} /> Source</button>
        ))}
        {isMobile && (
          <a
            href={googleMapsUrl(place.lat, place.lng)}
            rel="noopener noreferrer"
            className="place-action-btn navigate-link"
          >
            <Navigation size={12} /> Navigate
          </a>
        )}
        <button className="place-action-btn explore" onClick={() => onExplore(place)}>
          <Compass size={12} /> Nearby
        </button>
        {onAddToTrip && (
          <button className="place-action-btn trip" onClick={() => onAddToTrip(place)} title="Add to trip">
            <Plus size={12} /> Trip
          </button>
        )}
        {!isMobile && (
          <button className="place-action-btn" onClick={() => onEdit(place)}>
            <Pencil size={12} /> Edit
          </button>
        )}
        {!isMobile && <>
          <a href={googleMapsUrl(place.lat, place.lng)} rel="noopener noreferrer" className="place-action-btn navigate-link"><MapPin size={12} /> Google Maps</a>
          <a href={wazeUrl(place.lat, place.lng)} rel="noopener noreferrer" className="place-action-btn navigate-link"><Navigation size={12} /> Waze</a>
        </>}
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
          {secondaryLinks.length > 0 && (
            <>
              <div className="place-actions-divider" />
              {secondaryLinks.map(link => (
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
          {notes && <p className="place-actions-notes">"{notes}"</p>}
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
