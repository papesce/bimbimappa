import { useRef } from 'react'
import { Navigation, Pencil, X } from 'lucide-react'
import { getPrimaryLink } from '../lib/links'
import { formatDateRange } from '../lib/date'
import { toTitleCase } from '../lib/text'
import { formatAmenity, formatPriceTier, formatPriority, formatRating } from '../lib/placeAttributes'
import BrandIcon from './BrandIcon'
import PlaceActions from './PlaceActions'
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
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragState>({ startY: 0, startVisiblePx: 0, dragging: false, interactive: false })

  const HIDDEN_PX = 48
  const PEEK_PX = 230

  function getVisiblePx() {
    const maxVisible = window.innerHeight * 0.5
    if (sheetState === 'hidden') return HIDDEN_PX
    if (sheetState === 'peek') return PEEK_PX
    return maxVisible
  }

  function handleTouchStart(e: React.TouchEvent) {
    dragRef.current = {
      startY: e.touches[0].clientY,
      startVisiblePx: getVisiblePx(),
      dragging: true,
      interactive: !!(e.target as Element).closest('button, a, input, textarea, select, label'),
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragRef.current.dragging || dragRef.current.interactive) return
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

  function handleTouchEnd(e: React.TouchEvent) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (dragRef.current.interactive) return
    const delta = dragRef.current.startY - e.changedTouches[0].clientY
    const finalVisible = dragRef.current.startVisiblePx + delta
    const maxVisible = window.innerHeight * 0.5
    let newState: SheetState
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

  const primaryLink = place ? getPrimaryLink(place) : null
  return (
    <div
      ref={sheetRef}
      className={`bottom-sheet bottom-sheet--${sheetState}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Always-visible: drag handle */}
      <div className="sheet-grab-bar">
        <div className="sheet-drag-handle-wrap" onClick={handleHandleTap}>
          <div className="sheet-drag-handle" />
        </div>
      </div>

      {/* Peek row — name, address, primary link, Edit */}
      {place && sheetState !== 'hidden' && (
        <div className="sheet-peek-content" onClick={() => onSheetChange('expanded')}>
          <p className="sheet-place-name">{toTitleCase(place.name)}</p>
          <p className="sheet-place-address">{place.address}</p>
          <div className="sheet-peek-actions">
            {primaryLink && (
              <a
                href={primaryLink.url}
                rel="noopener noreferrer"
                className="sheet-icon-action"
                title={primaryLink.label || 'Source'}
                onClick={e => e.stopPropagation()}
              >
                <BrandIcon url={primaryLink.url} size={18} />
                <span>Source</span>
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
              rel="noopener noreferrer"
              className="sheet-icon-action"
              title="Navigate"
              onClick={e => e.stopPropagation()}
            >
              <Navigation size={18} />
              <span>Navigate</span>
            </a>
            <button
              className="place-action-btn"
              onClick={(e) => { e.stopPropagation(); onEdit(place) }}
            >
              <Pencil size={14} /> Edit
            </button>
          </div>
        </div>
      )}

      {/* Expanded content */}
      {place && sheetState === 'expanded' && (
        <div className="sheet-expanded-content">
          <button className="sheet-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>

          {place.date_from && (
            <p className="popup-date">{formatDateRange(place.date_from, place.date_to)}</p>
          )}
          {(place.price_tier || place.priority || place.rating || (place.amenities && place.amenities.length > 0)) && (
            <p className="sheet-place-metrics">
              {place.price_tier && <span className="sheet-place-metric">{formatPriceTier(place.price_tier)}</span>}
              {place.priority && <span className="sheet-place-metric">{formatPriority(place.priority)}</span>}
              {place.rating && <span className="sheet-place-metric">{formatRating(place.rating)}</span>}
              {place.amenities?.slice(0, 3).map(a => <span key={a} className="sheet-place-metric">{formatAmenity(a)}</span>)}
            </p>
          )}
          {place.notes && (
            <p className="popup-notes">"{place.notes}"</p>
          )}

          <PlaceActions
            place={place}
            variant="expanded"
            confirmingId={confirmingId}
            setConfirmingId={onConfirmingChange}
            onDelete={onDelete}
            onEdit={onEdit}
            onExplore={onExplore}
            isMobile
          />
        </div>
      )}
    </div>
  )
}
