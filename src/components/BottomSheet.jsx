import { useRef } from 'react'
import { ExternalLink, Navigation, Car, Pencil, Trash2, X } from 'lucide-react'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'
import { getLinks, getPrimaryLink, BrandIcon } from '../lib/links.jsx'
import ConfirmRow from './ConfirmRow'

export default function BottomSheet({
  place,
  sheetState,
  onSheetChange,
  filter,
  onFilterChange,
  FILTERS,
  onEdit,
  onDelete,
  confirmingId,
  onConfirmingChange,
  onClose,
}) {
  const sheetRef = useRef(null)
  const dragRef = useRef({ startY: 0, startVisiblePx: 0, dragging: false })

  const HIDDEN_PX = 60
  const PEEK_PX = 230

  function getVisiblePx() {
    const maxVisible = window.innerHeight * 0.5
    if (sheetState === 'hidden') return HIDDEN_PX
    if (sheetState === 'peek') return PEEK_PX
    return maxVisible
  }

  function handleTouchStart(e) {
    dragRef.current = {
      startY: e.touches[0].clientY,
      startVisiblePx: getVisiblePx(),
      dragging: true,
    }
  }

  function handleTouchMove(e) {
    if (!dragRef.current.dragging) return
    const delta = dragRef.current.startY - e.touches[0].clientY
    const maxVisible = window.innerHeight * 0.5
    const newVisible = dragRef.current.startVisiblePx + delta
    const clamped = Math.max(HIDDEN_PX, Math.min(maxVisible, newVisible))
    const translatePx = maxVisible - clamped
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
      sheetRef.current.style.transform = `translateY(${translatePx}px)`
    }
  }

  function handleTouchEnd(e) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const delta = dragRef.current.startY - e.changedTouches[0].clientY
    const finalVisible = dragRef.current.startVisiblePx + delta
    const maxVisible = window.innerHeight * 0.5
    let newState
    if (!place || finalVisible < 90) {
      newState = 'hidden'
    } else if (finalVisible < maxVisible * 0.6) {
      newState = 'peek'
    } else {
      newState = 'expanded'
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
      sheetRef.current.style.transition = ''
    }
    onSheetChange(newState)
    if (newState === 'hidden') onClose()
  }

  function handleHandleTap() {
    if (!place) {
      onSheetChange('hidden')
    } else if (sheetState === 'hidden') {
      onSheetChange('peek')
    } else if (sheetState === 'peek') {
      onSheetChange('expanded')
    } else {
      onSheetChange('peek')
    }
  }

  function formatDate(place) {
    const from = new Date(place.date_from + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!place.date_to || place.date_to === place.date_from) return from
    const to = new Date(place.date_to + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${from}–${to}`
  }

  const links = place ? getLinks(place) : []
  const primaryLink = place ? getPrimaryLink(place) : null

  return (
    <div
      ref={sheetRef}
      className={`bottom-sheet bottom-sheet--${sheetState}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Always-visible: drag handle + filter chips */}
      <div className="sheet-filter-bar">
        <div className="sheet-drag-handle-wrap" onClick={handleHandleTap}>
          <div className="sheet-drag-handle" />
        </div>
        <div className="sheet-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`filter-pill${filter === f.key ? ' active' : ''}`}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Peek row — name, address, one-tap action icons */}
      {place && sheetState !== 'hidden' && (
        <div className="sheet-peek-content" onClick={() => onSheetChange('expanded')}>
          <p className="sheet-place-name">{place.name}</p>
          <p className="sheet-place-address">{place.address}</p>
          <div className="sheet-icon-actions">
            {primaryLink && (
              <a
                href={primaryLink.url}
                                rel="noopener noreferrer"
                className="sheet-icon-action"
                title={primaryLink.label || 'Source'}
                onClick={e => e.stopPropagation()}
              >
                <BrandIcon url={primaryLink.url} size={18} />
              </a>
            )}
            <a
              href={googleMapsUrl(place.lat, place.lng)}
                            rel="noopener noreferrer"
              className="sheet-icon-action"
              title="Google Maps"
              onClick={e => e.stopPropagation()}
            >
              <Navigation size={18} />
            </a>
            <a
              href={wazeUrl(place.lat, place.lng)}
                            rel="noopener noreferrer"
              className="sheet-icon-action"
              title="Waze"
              onClick={e => e.stopPropagation()}
            >
              <Car size={18} />
            </a>
            <button
              className="sheet-action-btn"
              onClick={(e) => { e.stopPropagation(); onEdit(place) }}
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              className="sheet-action-btn danger"
              onClick={(e) => { e.stopPropagation(); onConfirmingChange(confirmingId === place.id ? null : place.id) }}
              title="Remove"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>
      )}

      {place && confirmingId === place.id && (
        <div className="sheet-confirm-wrap">
          <ConfirmRow
            onConfirm={() => { onDelete(place.id); onConfirmingChange(null); onClose() }}
            onCancel={() => onConfirmingChange(null)}
          />
        </div>
      )}

      {/* Expanded content */}
      {place && sheetState === 'expanded' && (
        <div className="sheet-expanded-content">
          <button className="sheet-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>

          {place.date_from && (
            <p className="popup-date">{formatDate(place)}</p>
          )}
          {place.notes && (
            <p className="popup-notes">"{place.notes}"</p>
          )}

          {links.length > 0 && (
            <div className="sheet-links">
              {links.map(link => (
                <a
                  key={link.id || link.url}
                  href={link.url}
                                    rel="noopener noreferrer"
                  className="sheet-link-row"
                >
                  <span className="sheet-link-icon">
                    <BrandIcon url={link.url} size={16} />
                  </span>
                  <span className="sheet-link-label">
                    {link.label || 'Link'}
                    {link.is_primary && <span className="sheet-link-primary">primary</span>}
                  </span>
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
