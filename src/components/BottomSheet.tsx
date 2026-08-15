import { useState, useRef } from 'react'
import { Compass, MapPin, Maximize2, Navigation, Pencil, Trash2, X } from 'lucide-react'
import { getPrimaryLink } from '../lib/links'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'
import { formatDateRange } from '../lib/date'
import { toTitleCase } from '../lib/text'
import { formatAmenity, formatPriceTier, formatPriority, formatRating } from '../lib/placeAttributes'
import BrandIcon from './BrandIcon'
import CategoryBadge from './CategoryBadge'
import ConfirmRow from './ConfirmRow'
import type { Place, SheetState } from '../types'

interface DragState {
  startY: number
  startVisiblePx: number
  dragging: boolean
  interactive: boolean
}

export interface BottomSheetProps {
  place: Place | null
  sheetState: SheetState
  onSheetChange: (state: SheetState) => void
  onEdit: (place: Place) => void
  onDelete: (id: string) => void
  confirmingId: string | null
  onConfirmingChange: (id: string | null) => void
  onClose: () => void
  onExplore: (place: Place) => void
}

export default function BottomSheet({
  place,
  sheetState,
  onSheetChange,
  onEdit,
  onDelete,
  confirmingId,
  onConfirmingChange,
  onClose,
  onExplore,
}: BottomSheetProps) {
  const [isLightboxOpen, setLightboxOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragState>({ startY: 0, startVisiblePx: 0, dragging: false, interactive: false })
  const HIDDEN_PX = 48
  const PEEK_PX = 205

  function getMaxVisiblePx() {
    return Math.min(window.innerHeight * 0.82, 680)
  }

  function getVisiblePx() {
    const maxVisible = getMaxVisiblePx()
    if (sheetState === 'hidden') return HIDDEN_PX
    if (sheetState === 'peek') return PEEK_PX
    return maxVisible
  }

  function handleTouchStart(e: React.TouchEvent) {
    dragRef.current = {
      startY: e.touches[0].clientY,
      startVisiblePx: getVisiblePx(),
      dragging: true,
      interactive: !!(e.target as Element).closest('button, a, input, textarea, select, label, .sheet-expanded-content'),
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragRef.current.dragging || dragRef.current.interactive) return
    const delta = dragRef.current.startY - e.touches[0].clientY
    const maxVisible = getMaxVisiblePx()
    const newVisible = dragRef.current.startVisiblePx + delta
    const clamped = Math.max(HIDDEN_PX, Math.min(maxVisible, newVisible))
    const translatePx = maxVisible - clamped
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
      sheetRef.current.style.transform = `translateY(${translatePx}px)`
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (dragRef.current.interactive) return
    const delta = dragRef.current.startY - e.changedTouches[0].clientY
    const finalVisible = dragRef.current.startVisiblePx + delta
    const maxVisible = getMaxVisiblePx()
    let newState: SheetState
    if (!place || finalVisible < 90) {
      newState = 'hidden'
    } else if (finalVisible < (PEEK_PX + maxVisible) / 2) {
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

  const primaryLink = place ? getPrimaryLink(place) : null

  return (
    <>
      <div
        ref={sheetRef}
        className={`bottom-sheet bottom-sheet--${sheetState}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle & close header */}
        <div className="sheet-grab-bar">
          <div className="sheet-drag-handle-wrap" onClick={handleHandleTap}>
            <div className="sheet-drag-handle" />
          </div>
          {place && (
            <button className="sheet-close-btn sheet-header-close-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Peek mode - Apple Maps style side-by-side preview */}
        {place && sheetState === 'peek' && (
          <div className="sheet-peek-content" onClick={() => onSheetChange('expanded')}>
            <div className="sheet-peek-header">
              <div className="sheet-peek-info">
                <div className="sheet-peek-title-row">
                  {place.category && <CategoryBadge category={place.category} />}
                  <p className="sheet-place-name">{toTitleCase(place.name)}</p>
                </div>
                <p className="sheet-place-address">{place.address}</p>
                {(place.price_tier || place.rating || place.priority) && (
                  <div className="sheet-peek-metrics">
                    {place.rating && <span className="sheet-place-metric">{formatRating(place.rating)}</span>}
                    {place.price_tier && <span className="sheet-place-metric">{formatPriceTier(place.price_tier)}</span>}
                    {place.priority && <span className="sheet-place-metric">{formatPriority(place.priority)}</span>}
                  </div>
                )}
              </div>
              {place.photo_url && (
                <button
                  type="button"
                  className="sheet-peek-thumbnail-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxOpen(true)
                  }}
                  aria-label={`View photo of ${place.name}`}
                  title="View photo fullscreen"
                >
                  <img src={place.photo_url} alt="" className="sheet-peek-thumbnail" />
                  <span className="sheet-thumbnail-zoom-hint" aria-hidden="true">
                    <Maximize2 size={11} />
                  </span>
                </button>
              )}
            </div>

            <div className="sheet-peek-actions">
              {primaryLink ? (
                <a
                  href={primaryLink.url}
                  rel="noopener noreferrer"
                  className="sheet-icon-action mobile-sheet-action"
                  title={primaryLink.label || 'Source'}
                  onClick={e => e.stopPropagation()}
                >
                  <BrandIcon url={primaryLink.url} size={16} />
                  <span>Source</span>
                </a>
              ) : (
                <button className="sheet-icon-action mobile-sheet-action sheet-source-unavailable" disabled title="No source available">
                  <span>Source</span>
                </button>
              )}
              <button
                className="place-action-btn explore mobile-sheet-action"
                onClick={(e) => { e.stopPropagation(); onExplore(place) }}
              >
                <Compass size={14} /> Nearby
              </button>
              <button
                className="place-action-btn mobile-sheet-action sheet-edit-btn"
                onClick={(e) => { e.stopPropagation(); onEdit(place) }}
              >
                <Pencil size={14} /> Edit
              </button>
            </div>

            <div className="sheet-navigation-row">
              <a href={googleMapsUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="mobile-sheet-action" onClick={e => e.stopPropagation()}>
                <MapPin size={14} /> Google Maps
              </a>
              <a href={wazeUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="mobile-sheet-action" onClick={e => e.stopPropagation()}>
                <Navigation size={14} /> Waze
              </a>
            </div>
          </div>
        )}

        {/* Expanded content */}
        {place && sheetState === 'expanded' && (
          <div className="sheet-expanded-content">
            {place.photo_url && (
              <div
                className="sheet-hero-photo-wrap"
                onClick={() => setLightboxOpen(true)}
                role="button"
                tabIndex={0}
                aria-label="View photo fullscreen"
              >
                <img src={place.photo_url} alt={place.name} className="sheet-hero-photo" />
                <span className="sheet-hero-zoom-badge">
                  <Maximize2 size={13} /> Tap to enlarge
                </span>
              </div>
            )}

            <div className="sheet-expanded-header">
              <div className="sheet-expanded-title-row">
                {place.category && <CategoryBadge category={place.category} showLabel />}
                <h2 className="sheet-expanded-title">{toTitleCase(place.name)}</h2>
              </div>
              <p className="sheet-place-address">{place.address}</p>
            </div>

            <div className="sheet-peek-actions">
              {primaryLink ? (
                <a
                  href={primaryLink.url}
                  rel="noopener noreferrer"
                  className="sheet-icon-action mobile-sheet-action"
                  title={primaryLink.label || 'Source'}
                >
                  <BrandIcon url={primaryLink.url} size={16} />
                  <span>Source</span>
                </a>
              ) : (
                <button className="sheet-icon-action mobile-sheet-action sheet-source-unavailable" disabled title="No source available">
                  <span>Source</span>
                </button>
              )}
              <button
                className="place-action-btn explore mobile-sheet-action"
                onClick={() => onExplore(place)}
              >
                <Compass size={14} /> Nearby
              </button>
              <button
                className="place-action-btn mobile-sheet-action sheet-edit-btn"
                onClick={() => onEdit(place)}
              >
                <Pencil size={14} /> Edit
              </button>
            </div>

            <div className="sheet-navigation-row">
              <a href={googleMapsUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="mobile-sheet-action">
                <MapPin size={14} /> Google Maps
              </a>
              <a href={wazeUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="mobile-sheet-action">
                <Navigation size={14} /> Waze
              </a>
            </div>

            {place.date_from && (
              <div className="sheet-section">
                <p className="popup-date">{formatDateRange(place.date_from, place.date_to)}</p>
              </div>
            )}

            {(place.price_tier || place.priority || place.rating || (place.amenities && place.amenities.length > 0)) && (
              <div className="sheet-place-metrics">
                {place.rating && <span className="sheet-place-metric">{formatRating(place.rating)}</span>}
                {place.price_tier && <span className="sheet-place-metric">{formatPriceTier(place.price_tier)}</span>}
                {place.priority && <span className="sheet-place-metric">{formatPriority(place.priority)}</span>}
                {place.amenities?.map(a => <span key={a} className="sheet-place-metric">{formatAmenity(a)}</span>)}
              </div>
            )}

            {place.notes && (
              <div className="sheet-notes-card">
                <p className="sheet-notes-text">"{place.notes}"</p>
              </div>
            )}

            <div className="sheet-mobile-actions">
              <div className="sheet-mobile-actions-section sheet-mobile-actions-section--manage">
                <div className="sheet-mobile-actions-row">
                  {confirmingId === place.id ? (
                    <ConfirmRow variant="inline" onConfirm={() => { onDelete(place.id); onConfirmingChange(null) }} onCancel={() => onConfirmingChange(null)} />
                  ) : (
                    <button className="place-actions-row-link danger mobile-sheet-action" onClick={() => onConfirmingChange(place.id)}>
                      <Trash2 size={14} /> <span className="place-actions-link-label">Delete place</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && place?.photo_url && (
        <div
          className="photo-lightbox-overlay"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${place.name}`}
        >
          <button
            type="button"
            className="photo-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close photo"
          >
            <X size={20} />
          </button>
          <div className="photo-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={place.photo_url} alt={place.name} className="photo-lightbox-img" />
            <div className="photo-lightbox-caption">
              <p className="photo-lightbox-title">{toTitleCase(place.name)}</p>
              {place.address && <p className="photo-lightbox-sub">{place.address}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
