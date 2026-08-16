import { Check, Compass, Plus, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useDismissable } from '../hooks/useDismissable';
import { toTitleCase } from '../lib/text';
import type { Place, Trip, TripInput, TripPriority } from '../types';

interface AddToTripModalProps {
  place: Place;
  trips: Trip[];
  onToggleTripPlace: (tripId: string, placeId: string) => Promise<void>;
  onCreateTrip: (input: TripInput) => Promise<Trip>;
  onClose: () => void;
}

export default function AddToTripModal({
  place,
  trips,
  onToggleTripPlace,
  onCreateTrip,
  onClose,
}: AddToTripModalProps) {
  const [showCreate, setShowCreate] = useState(trips.length === 0);
  const [newTripName, setNewTripName] = useState('');
  const [newTripPriority, setNewTripPriority] = useState<TripPriority>(1);
  const [newTripNotes, setNewTripNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sheetRef = useDismissable<HTMLDivElement>(onClose);

  async function handleCreateNewTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!newTripName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateTrip({
        name: newTripName.trim(),
        priority: newTripPriority,
        notes: newTripNotes.trim() || null,
        place_ids: [place.id],
      });
      onClose();
    } catch (err) {
      console.error('Failed to create trip:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div ref={sheetRef} className="modal-sheet add-to-trip-modal">
        <div className="modal-header">
          <div className="modal-header-title">
            <Compass size={18} className="modal-icon" />
            <div>
              <h3>Add to Next Trip</h3>
              <p className="modal-sub">{toTitleCase(place.name)}</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {trips.length > 0 && (
            <div className="trips-checklist-section">
              <span className="trips-checklist-label">Select Trips</span>
              <div className="trips-checklist">
                {trips.map(trip => {
                  const isChecked = trip.place_ids.includes(place.id);
                  const priorityLabel =
                    trip.priority === 1 ? 'High' : trip.priority === 2 ? 'Medium' : 'Low';
                  const priorityClass = `priority-badge--p${trip.priority}`;
                  return (
                    <button
                      key={trip.id}
                      type="button"
                      className={`trips-checklist-item${isChecked ? ' is-selected' : ''}`}
                      onClick={() => onToggleTripPlace(trip.id, place.id)}
                    >
                      <div className="trips-checklist-checkbox">
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div className="trips-checklist-info">
                        <span className="trips-checklist-name">{trip.name}</span>
                        <span className="trips-checklist-meta">
                          <span className={`priority-badge ${priorityClass}`}>{priorityLabel}</span>
                          <span className="trips-count-label">
                            {trip.place_ids.length}{' '}
                            {trip.place_ids.length === 1 ? 'place' : 'places'}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!showCreate ? (
            <button
              type="button"
              className="btn btn-secondary add-new-trip-btn"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={16} /> Create new trip with this place
            </button>
          ) : (
            <form onSubmit={handleCreateNewTrip} className="create-trip-inline-form">
              <div className="create-trip-form-header">
                <span className="create-trip-form-title">
                  <Sparkles size={14} /> New Trip / Outing
                </span>
                {trips.length > 0 && (
                  <button
                    type="button"
                    className="btn-text-sub"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="field">
                <label htmlFor="new-trip-name">Trip Name</label>
                <input
                  id="new-trip-name"
                  type="text"
                  className="input"
                  placeholder="e.g. Next Sunday Outing, Rainy Day Museums"
                  value={newTripName}
                  onChange={e => setNewTripName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <span>Trip Priority</span>
                <div className="priority-selector">
                  <button
                    type="button"
                    className={`priority-btn priority-btn--p1${newTripPriority === 1 ? ' active' : ''}`}
                    onClick={() => setNewTripPriority(1)}
                  >
                    🔴 High (Next Up)
                  </button>
                  <button
                    type="button"
                    className={`priority-btn priority-btn--p2${newTripPriority === 2 ? ' active' : ''}`}
                    onClick={() => setNewTripPriority(2)}
                  >
                    🟡 Medium (Soon)
                  </button>
                  <button
                    type="button"
                    className={`priority-btn priority-btn--p3${newTripPriority === 3 ? ' active' : ''}`}
                    onClick={() => setNewTripPriority(3)}
                  >
                    🔵 Low (Someday)
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="new-trip-notes">Notes (optional)</label>
                <input
                  id="new-trip-notes"
                  type="text"
                  className="input"
                  placeholder="e.g. Bring picnic lunch, check tickets"
                  value={newTripNotes}
                  onChange={e => setNewTripNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary create-trip-submit"
                disabled={!newTripName.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create & Add Place'}
              </button>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary modal-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
