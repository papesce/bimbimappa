import { ArrowUpDown, Compass, MapPin, Plus, Search, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDismissable } from '../hooks/useDismissable';
import { toTitleCase } from '../lib/text';
import type { Place, Trip, TripInput, TripPriority, TripSortOption } from '../types';
import TripDetailView from './TripDetailView';

interface TripsPanelProps {
  trips: Trip[];
  places: Place[];
  activeTripId: string | null;
  onSelectTrip: (trip: Trip | null) => void;
  onAddTrip: (input: TripInput) => Promise<Trip>;
  onUpdateTrip: (id: string, updates: Partial<TripInput>) => Promise<Trip>;
  onDeleteTrip: (id: string) => Promise<void>;
  onAddPlaceToTrip: (tripId: string, placeId: string) => Promise<void>;
  onRemovePlaceFromTrip: (tripId: string, placeId: string) => Promise<void>;
  onLocatePlace: (place: Place) => void;
  onClose: () => void;
  onFocusTripOnMap: (trip: Trip) => void;
  embedded?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  pendingTripId?: string | null;
  onPendingTripConsumed?: () => void;
}

export default function TripsPanel({
  trips,
  places,
  activeTripId,
  onSelectTrip,
  onAddTrip,
  onUpdateTrip,
  onDeleteTrip,
  onAddPlaceToTrip,
  onRemovePlaceFromTrip,
  onLocatePlace,
  onClose,
  onFocusTripOnMap,
  embedded = false,
  searchQuery: controlledQuery,
  onSearchChange,
  pendingTripId,
  onPendingTripConsumed,
}: TripsPanelProps) {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(activeTripId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<TripSortOption>('priority');

  const searchQuery = onSearchChange ? (controlledQuery ?? '') : localSearchQuery;
  const setSearchQuery = onSearchChange ?? setLocalSearchQuery;

  // Form state for creating a new trip
  const [newName, setNewName] = useState('');
  const [newPriority, setNewPriority] = useState<TripPriority>(1);
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const createCardRef = useDismissable<HTMLDivElement>(() => setShowCreateModal(false), {
    outsideClick: false,
    closeOnEscape: showCreateModal,
  });

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find(t => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  useEffect(() => {
    if (pendingTripId) {
      setSelectedTripId(pendingTripId);
      onPendingTripConsumed?.();
    }
  }, [pendingTripId, onPendingTripConsumed]);

  const filteredTrips = useMemo(() => {
    let result = [...trips];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.target_date?.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      if (sortOption === 'priority') {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOption === 'count') {
        return b.place_ids.length - a.place_ids.length;
      }
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'date') {
        if (a.target_date && b.target_date) return a.target_date.localeCompare(b.target_date);
        if (a.target_date) return -1;
        if (b.target_date) return 1;
        return a.priority - b.priority;
      }
      return 0;
    });

    return result;
  }, [trips, searchQuery, sortOption]);

  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const created = await onAddTrip({
        name: newName.trim(),
        priority: newPriority,
        target_date: newTargetDate.trim() || null,
        notes: newNotes.trim() || null,
        place_ids: [],
      });
      setShowCreateModal(false);
      setNewName('');
      setNewTargetDate('');
      setNewNotes('');
      setSelectedTripId(created.id);
    } finally {
      setIsCreating(false);
    }
  }

  if (selectedTrip) {
    return (
      <TripDetailView
        trip={selectedTrip}
        allPlaces={places}
        onBack={() => setSelectedTripId(null)}
        onUpdateTrip={onUpdateTrip}
        onDeleteTrip={async id => {
          await onDeleteTrip(id);
          setSelectedTripId(null);
          onSelectTrip(null);
        }}
        onAddPlace={onAddPlaceToTrip}
        onRemovePlace={onRemovePlaceFromTrip}
        onLocatePlace={onLocatePlace}
        onFocusTripOnMap={onFocusTripOnMap}
      />
    );
  }

  return (
    <div className="panel trips-panel">
      {embedded ? (
        <div className="library-places-header">
          <div>
            <h3>Planned Trips</h3>
            <span>
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
            </span>
          </div>
          <button
            type="button"
            className="icon-btn panel-add-btn library-add-place"
            onClick={() => setShowCreateModal(true)}
            title="Create new trip"
          >
            <Plus size={18} />
          </button>
        </div>
      ) : (
        <div className="panel-header">
          <div className="panel-header-left">
            <Compass size={20} className="panel-header-icon" />
            <h2>Next Trips</h2>
            <span className="panel-header-count">{trips.length}</span>
          </div>
          <div className="panel-header-right">
            <button
              type="button"
              className="icon-btn panel-add-btn"
              onClick={() => setShowCreateModal(true)}
              title="Create new trip"
            >
              <Plus size={18} />
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close panel">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="trips-panel-controls">
        {!embedded && (
          <div className="trips-search-bar">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="trips-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        <div className="trips-sort-selector">
          <ArrowUpDown size={13} />
          <span>Sort:</span>
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as TripSortOption)}
            className="trips-sort-select"
          >
            <option value="priority">Priority (High → Low)</option>
            <option value="count">Most Places</option>
            <option value="date">Target Date</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="panel-body trips-panel-body">
        {showCreateModal && (
          <div className="trip-create-card" ref={createCardRef}>
            <div className="trip-create-card-header">
              <h3>
                <Sparkles size={16} /> New Trip / Outing
              </h3>
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateTrip}>
              <div className="field">
                <label htmlFor="trip-create-name">Trip Name</label>
                <input
                  id="trip-create-name"
                  type="text"
                  className="input"
                  placeholder="e.g. Next Sunday in Como, Fall Colors"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <span>Priority</span>
                <div className="priority-selector">
                  <button
                    type="button"
                    className={`priority-btn priority-btn--p1${newPriority === 1 ? ' active' : ''}`}
                    onClick={() => setNewPriority(1)}
                  >
                    🔴 High
                  </button>
                  <button
                    type="button"
                    className={`priority-btn priority-btn--p2${newPriority === 2 ? ' active' : ''}`}
                    onClick={() => setNewPriority(2)}
                  >
                    🟡 Medium
                  </button>
                  <button
                    type="button"
                    className={`priority-btn priority-btn--p3${newPriority === 3 ? ' active' : ''}`}
                    onClick={() => setNewPriority(3)}
                  >
                    🔵 Low
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="trip-create-target-date">Target Date / Window (optional)</label>
                <input
                  id="trip-create-target-date"
                  type="text"
                  className="input"
                  placeholder="e.g. This Weekend, Oct 12, Sunny Day"
                  value={newTargetDate}
                  onChange={e => setNewTargetDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="trip-create-notes">Notes (optional)</label>
                <input
                  id="trip-create-notes"
                  type="text"
                  className="input"
                  placeholder="e.g. Check opening hours, pack stroller"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                />
              </div>

              <div className="trip-create-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Trip'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredTrips.length === 0 && !showCreateModal ? (
          <div className="trips-empty-state">
            <Compass size={36} className="trips-empty-icon" />
            <p className="trips-empty-title">
              {searchQuery ? 'No trips match your search' : 'No trips planned yet'}
            </p>
            <p className="trips-empty-sub">
              Group your saved places into upcoming weekend outings or itineraries and sort them by
              priority.
            </p>
            <button
              type="button"
              className="btn btn-primary trips-empty-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} /> Plan your first trip
            </button>
          </div>
        ) : (
          <ul className="trips-list">
            {filteredTrips.map(trip => {
              const tripPlaceObjs = trip.place_ids
                .map(id => places.find(p => p.id === id))
                .filter((p): p is Place => p !== undefined);
              const priorityLabel =
                trip.priority === 1 ? 'High' : trip.priority === 2 ? 'Medium' : 'Low';
              const priorityClass = `priority-badge--p${trip.priority}`;
              const isMapActive = activeTripId === trip.id;
              const openTrip = () => {
                setSelectedTripId(trip.id);
                onSelectTrip(trip);
              };

              return (
                <li
                  key={trip.id}
                  className={`trip-item-card${isMapActive ? ' is-map-active' : ''}`}
                  onClick={openTrip}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openTrip();
                    }
                  }}
                >
                  <div className="trip-item-top">
                    <div className="trip-item-info">
                      <div className="trip-item-title-row">
                        <span className={`priority-badge ${priorityClass}`}>{priorityLabel}</span>
                        <h3 className="trip-item-name">{toTitleCase(trip.name)}</h3>
                      </div>
                      {trip.target_date && (
                        <span className="trip-item-date">📅 {trip.target_date}</span>
                      )}
                    </div>
                    {tripPlaceObjs.length > 0 && (
                      <button
                        type="button"
                        className={`icon-btn trip-item-map-btn${isMapActive ? ' active' : ''}`}
                        title="View trip on map"
                        onClick={e => {
                          e.stopPropagation();
                          onFocusTripOnMap(trip);
                        }}
                      >
                        <Compass size={16} />
                      </button>
                    )}
                  </div>

                  {trip.notes && <p className="trip-item-notes">"{trip.notes}"</p>}

                  <div className="trip-item-footer">
                    <span className="trip-item-places-count">
                      <MapPin size={13} /> {tripPlaceObjs.length}{' '}
                      {tripPlaceObjs.length === 1 ? 'place' : 'places'}
                    </span>

                    {tripPlaceObjs.length > 0 && (
                      <div className="trip-item-photo-previews">
                        {tripPlaceObjs.slice(0, 4).map(p => (
                          <div key={p.id} className="trip-photo-preview-item" title={p.name}>
                            {p.photo_url ? (
                              <img src={p.photo_url} alt="" className="trip-photo-preview-img" />
                            ) : (
                              <span className="trip-photo-preview-initial">
                                {p.name[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                        ))}
                        {tripPlaceObjs.length > 4 && (
                          <span className="trip-photo-preview-more">
                            +{tripPlaceObjs.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
