import { useState, useMemo } from 'react'
import { ArrowLeft, Compass, MapPin, Plus, Trash2, X, Sparkles, Pencil, Check } from 'lucide-react'
import { toTitleCase } from '../lib/text'
import { getDistanceKm } from '../lib/geo'
import CategoryBadge from './CategoryBadge'
import type { Place, Trip, TripInput, TripPriority } from '../types'

interface TripDetailViewProps {
  trip: Trip
  allPlaces: Place[]
  onBack: () => void
  onUpdateTrip: (id: string, updates: Partial<TripInput>) => Promise<Trip>
  onDeleteTrip: (id: string) => Promise<void>
  onRemovePlace: (tripId: string, placeId: string) => Promise<void>
  onAddPlace: (tripId: string, placeId: string) => Promise<void>
  onLocatePlace: (place: Place) => void
  onFocusTripOnMap: (trip: Trip) => void
  onClose: () => void
}

export default function TripDetailView({
  trip,
  allPlaces,
  onBack,
  onUpdateTrip,
  onDeleteTrip,
  onRemovePlace,
  onAddPlace,
  onLocatePlace,
  onFocusTripOnMap,
  onClose,
}: TripDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(trip.name)
  const [priority, setPriority] = useState<TripPriority>(trip.priority)
  const [notes, setNotes] = useState(trip.notes || '')
  const [targetDate, setTargetDate] = useState(trip.target_date || '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const tripPlaces = useMemo(() => {
    return trip.place_ids
      .map(id => allPlaces.find(p => p.id === id))
      .filter((p): p is Place => p !== undefined)
  }, [trip.place_ids, allPlaces])

  // Suggested nearby places within 15 km of any place in this trip that are not yet in the trip
  const nearbySuggestions = useMemo(() => {
    if (tripPlaces.length === 0) return []
    const unassignedPlaces = allPlaces.filter(p => !trip.place_ids.includes(p.id))

    const suggestionsWithDistance: { place: Place; minDistanceKm: number }[] = []

    for (const unassigned of unassignedPlaces) {
      let minDistance = Infinity
      for (const tripPlace of tripPlaces) {
        const dist = getDistanceKm(tripPlace.lat, tripPlace.lng, unassigned.lat, unassigned.lng)
        if (dist < minDistance) {
          minDistance = dist
        }
      }
      if (minDistance <= 15) {
        suggestionsWithDistance.push({ place: unassigned, minDistanceKm: minDistance })
      }
    }

    return suggestionsWithDistance
      .sort((a, b) => a.minDistanceKm - b.minDistanceKm)
      .slice(0, 6)
  }, [tripPlaces, allPlaces, trip.place_ids])

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsSaving(true)
    try {
      await onUpdateTrip(trip.id, {
        name: name.trim(),
        priority,
        notes: notes.trim() || null,
        target_date: targetDate.trim() || null,
      })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const priorityLabel = trip.priority === 1 ? 'High (Next Up)' : trip.priority === 2 ? 'Medium (Soon)' : 'Low (Someday)'
  const priorityBadgeClass = `priority-badge--p${trip.priority}`

  return (
    <div className="trip-detail-view">
      <div className="trip-detail-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to trips list">
          <ArrowLeft size={18} />
        </button>
        <div className="trip-detail-header-title">
          <h2>{toTitleCase(trip.name)}</h2>
          <span className={`priority-badge ${priorityBadgeClass}`}>{priorityLabel}</span>
        </div>
        <div className="trip-detail-header-actions">
          <button
            className={`icon-btn${isEditing ? ' active' : ''}`}
            onClick={() => setIsEditing(val => !val)}
            title="Edit trip details"
          >
            <Pencil size={16} />
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="Close outings" title="Close outings">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="trip-detail-body">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="trip-edit-form">
            <div className="field">
              <label htmlFor="edit-trip-name">Trip Name</label>
              <input
                id="edit-trip-name"
                type="text"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Priority</label>
              <div className="priority-selector">
                <button
                  type="button"
                  className={`priority-btn priority-btn--p1${priority === 1 ? ' active' : ''}`}
                  onClick={() => setPriority(1)}
                >
                  🔴 High
                </button>
                <button
                  type="button"
                  className={`priority-btn priority-btn--p2${priority === 2 ? ' active' : ''}`}
                  onClick={() => setPriority(2)}
                >
                  🟡 Medium
                </button>
                <button
                  type="button"
                  className={`priority-btn priority-btn--p3${priority === 3 ? ' active' : ''}`}
                  onClick={() => setPriority(3)}
                >
                  🔵 Low
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="edit-trip-target-date">Target Date / Timeframe</label>
              <input
                id="edit-trip-target-date"
                type="text"
                className="input"
                placeholder="e.g. Next Saturday, Oct 12-14, Fall Break"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="edit-trip-notes">Notes</label>
              <textarea
                id="edit-trip-notes"
                className="input textarea"
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes for this trip..."
              />
            </div>

            <div className="trip-edit-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!name.trim() || isSaving}
              >
                <Check size={14} /> {isSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setName(trip.name)
                  setPriority(trip.priority)
                  setNotes(trip.notes || '')
                  setTargetDate(trip.target_date || '')
                  setIsEditing(false)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="trip-info-summary">
            {trip.target_date && (
              <p className="trip-summary-date">
                📅 <strong>Target:</strong> {trip.target_date}
              </p>
            )}
            {trip.notes && (
              <p className="trip-summary-notes">"{trip.notes}"</p>
            )}
            {tripPlaces.length > 0 && (
              <button
                type="button"
                className="btn btn-primary trip-focus-map-btn"
                onClick={() => onFocusTripOnMap(trip)}
              >
                <Compass size={16} /> View all {tripPlaces.length} places on Map
              </button>
            )}
          </div>
        )}

        {/* Places in this trip */}
        <div className="trip-places-section">
          <div className="trip-section-heading">
            <h3>Places in this trip ({tripPlaces.length})</h3>
          </div>

          {tripPlaces.length === 0 ? (
            <div className="trip-places-empty">
              <p>No places added to this trip yet.</p>
              <p className="trip-places-empty-sub">
                Add places from your saved list or use nearby suggestions below.
              </p>
            </div>
          ) : (
            <ul className="trip-places-list">
              {tripPlaces.map(place => (
                <li key={place.id} className="trip-place-card">
                  {place.photo_url ? (
                    <img src={place.photo_url} alt="" className="trip-place-photo" />
                  ) : (
                    <div className="trip-place-photo-placeholder">
                      {place.category && <CategoryBadge category={place.category} />}
                    </div>
                  )}
                  <div className="trip-place-info" onClick={() => onLocatePlace(place)}>
                    <div className="trip-place-title">
                      {place.category && <CategoryBadge category={place.category} />}
                      <strong>{toTitleCase(place.name)}</strong>
                    </div>
                    <p className="trip-place-address">{place.address}</p>
                  </div>
                  <div className="trip-place-actions">
                    <button
                      className="icon-btn icon-btn--sm"
                      onClick={() => onLocatePlace(place)}
                      title="Show on map"
                    >
                      <MapPin size={14} />
                    </button>
                    <button
                      className="icon-btn icon-btn--sm danger"
                      onClick={() => onRemovePlace(trip.id, place.id)}
                      title="Remove from this trip"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Nearby Suggestions to add */}
        {nearbySuggestions.length > 0 && (
          <div className="trip-suggestions-section">
            <div className="trip-section-heading">
              <span className="trip-suggestions-title">
                <Sparkles size={14} /> Suggested places nearby
              </span>
            </div>
            <ul className="trip-suggestions-list">
              {nearbySuggestions.map(({ place, minDistanceKm }) => (
                <li key={place.id} className="trip-suggestion-item">
                  <div className="trip-suggestion-body" onClick={() => onLocatePlace(place)}>
                    <div className="trip-suggestion-title">
                      {place.category && <CategoryBadge category={place.category} />}
                      <strong>{toTitleCase(place.name)}</strong>
                    </div>
                    <span className="trip-suggestion-dist">
                      {minDistanceKm < 1
                        ? `${Math.round(minDistanceKm * 1000)} m away`
                        : `${minDistanceKm.toFixed(1)} km away`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAddPlace(trip.id, place.id)}
                  >
                    <Plus size={13} /> Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Delete trip */}
        <div className="trip-danger-section">
          {confirmDelete ? (
            <div className="trip-confirm-delete">
              <p>Delete this trip?</p>
              <div className="trip-confirm-delete-actions">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => onDeleteTrip(trip.id)}
                >
                  Yes, delete trip
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn-text-danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} /> Delete this trip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
