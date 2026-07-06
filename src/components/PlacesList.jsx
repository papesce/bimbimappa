import { useState } from 'react'
import { MapPin, ExternalLink, Trash2, Pencil, Check, X, Navigation } from 'lucide-react'

export default function PlacesList({ places, onDelete, onEdit, onLocate, activeFilter }) {
  const [confirmingId, setConfirmingId] = useState(null)

  if (places.length === 0) {
    const messages = {
      week: 'No places added this week.',
      month: 'No places added this month.',
    }
    return (
      <div className="empty-state">
        <MapPin size={32} strokeWidth={1.5} />
        <p>{messages[activeFilter] || 'No places saved yet.'}</p>
        <p className="empty-sub">
          {activeFilter && activeFilter !== 'all'
            ? 'Try switching to "All" to see everything.'
            : 'Tap "Add place" to drop the first pin.'}
        </p>
      </div>
    )
  }

  return (
    <ul className="places-list">
      {places.map((place) => (
        <li key={place.id} className="place-card">
          <button
            className="place-card-body"
            onClick={() => onLocate(place)}
            title="Show on map"
          >
            <p className="place-name">{place.name}</p>
            <p className="place-address">{place.address}</p>
            {place.date_from && (
              <p className="place-date">
                {new Date(place.date_from + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {place.date_to && place.date_to !== place.date_from
                  ? `–${new Date(place.date_to + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : ''}
              </p>
            )}
            {place.notes && <p className="place-notes">"{place.notes}"</p>}

            {confirmingId === place.id && (
              <div className="delete-confirm-row">
                <span>Remove?</span>
                <button
                  className="action-btn danger"
                  onClick={() => { onDelete(place.id); setConfirmingId(null) }}
                  title="Yes, remove"
                >
                  <Check size={13} />
                </button>
                <button
                  className="action-btn"
                  onClick={() => setConfirmingId(null)}
                  title="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </button>
          <div className="place-card-actions">
            <button
              className="action-btn locate"
              onClick={() => onLocate(place)}
              title="Show on map"
            >
              <Navigation size={14} />
            </button>
            {place.source_url && (
              <a
                href={place.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="action-link"
                title="View source"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <button
              className="action-btn"
              onClick={() => onEdit(place)}
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              className={`action-btn${confirmingId === place.id ? ' danger' : ''}`}
              onClick={() => setConfirmingId(confirmingId === place.id ? null : place.id)}
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
