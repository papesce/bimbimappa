import { useState } from 'react'
import { MapPin, List, Plus, X } from 'lucide-react'
import Map from './components/Map'
import AddPlacePanel from './components/AddPlacePanel'
import PlacesList from './components/PlacesList'
import ExportButton from './components/ExportButton'
import LocationControls from './components/LocationControls'
import AccessDenied from './components/AccessDenied'
import { usePlaces } from './hooks/usePlaces'
import { useAuth } from './hooks/useAuth'
import { useMapFocus } from './hooks/useMapFocus'
import { getPlacesWithinBounds } from './lib/geo'
import './index.css'

function getFilterRange(filter) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  if (filter === 'all') return null

  if (filter === 'month') {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999),
    }
  }

  // week (Mon–Sun)
  const daysSinceMonday = (now.getDay() + 6) % 7
  const monday = new Date(year, month, now.getDate() - daysSinceMonday)
  const sunday = new Date(year, month, now.getDate() - daysSinceMonday + 6, 23, 59, 59, 999)
  return { start: monday, end: sunday }
}

export default function App() {
  const { authed, login } = useAuth()
  const { places, loading, addPlace, deletePlace, updatePlace } = usePlaces()
  const { center, radius, cityName, matchedPlaces, isGeolocating, setCenter, setRadius, clearCenter, resetToGeolocation } = useMapFocus(places)
  const [panel, setPanel] = useState(null)
  const [editingPlace, setEditingPlace] = useState(null)
  const [filter, setFilter] = useState('all')
  const [focusPlace, setFocusPlace] = useState(null)
  const [newPlaceId, setNewPlaceId] = useState(null)
  const [popupPlaceId, setPopupPlaceId] = useState(null)
  const [viewportBounds, setViewportBounds] = useState(null)
  const [viewingPlace, setViewingPlace] = useState(null)
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0)

  async function handleAdd(data) {
    const result = await addPlace(data)
    if (result) {
      setFocusPlace({ lat: result.lat, lng: result.lng })
      setNewPlaceId(result.id)
      setPopupPlaceId(result.id)
      setViewingPlace({ id: result.id, name: result.name })
      setTimeout(() => setNewPlaceId(null), 4000)
      setPanel(null)
    }
  }

  async function handleUpdate(id, data) {
    const result = await updatePlace(id, data)
    if (result) {
      setFocusPlace({ lat: result.lat, lng: result.lng })
      setPopupPlaceId(result.id)
      setViewingPlace({ id: result.id, name: result.name })
    }
  }

  const filterRange = getFilterRange(filter)
  let filteredPlaces = matchedPlaces
  if (filterRange) {
    filteredPlaces = filteredPlaces.filter(p => {
      if (!p.date_from) return false
      const [fy, fm, fd] = p.date_from.split('-').map(Number)
      const from = new Date(fy, fm - 1, fd)
      const [ty, tm, td] = (p.date_to || p.date_from).split('-').map(Number)
      const to = new Date(ty, tm - 1, td, 23, 59, 59, 999)
      return to >= filterRange.start && from <= filterRange.end
    })
  }
  if (viewportBounds) {
    filteredPlaces = getPlacesWithinBounds(filteredPlaces, viewportBounds)
  }

  function handleViewArea() {
    setViewingPlace(null)
    setFitBoundsTrigger(n => n + 1)
    setPanel('list')
  }

  if (!authed) return <AccessDenied onLogin={login} />

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ]

  return (
    <div className="app">
      <div className={`map-wrapper${loading ? ' map-loading' : ''}`}>
        <Map
          places={filteredPlaces}
          focusPlaces={matchedPlaces}
          center={center}
          radius={radius}
          onDelete={deletePlace}
          onEdit={setEditingPlace}
          focusPlace={focusPlace}
          onFocusDone={() => setFocusPlace(null)}
          newPlaceId={newPlaceId}
          popupPlaceId={popupPlaceId}
          onPopupDone={() => setPopupPlaceId(null)}
          onViewportChange={setViewportBounds}
          viewingPlace={viewingPlace}
          onViewArea={handleViewArea}
          fitBoundsTrigger={fitBoundsTrigger}
        />
      </div>

      <header className="topbar">
        <div className="topbar-brand">
          <MapPin size={18} strokeWidth={2.5} />
          <span>Family Fun Map</span>
          {import.meta.env.VITE_APP_VERSION && (
            <span className="version-badge">{import.meta.env.VITE_APP_VERSION}</span>
          )}
        </div>
        <div className="topbar-actions">
          <span className="pin-count">
            {filteredPlaces.length} of {matchedPlaces.length} {matchedPlaces.length === 1 ? 'place' : 'places'}
          </span>
          <button
            className={`icon-btn${panel === 'list' ? ' active' : ''}`}
            onClick={() => setPanel(panel === 'list' ? null : 'list')}
            aria-label="Saved places"
            title="Saved places"
          >
            <List size={18} />
          </button>
        </div>
      </header>

      {/* Filter chip strip — floats below the topbar over the map */}
      <div className="filter-strip">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-pill${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Location controls — geolocation only, floats below the filter strip left side */}
      <LocationControls
        isGeolocating={isGeolocating}
        onReset={() => { resetToGeolocation(); setViewingPlace(null) }}
      />

      {/* FAB — primary action, bottom-right; hidden while any panel is open */}
      {!panel && !editingPlace && (
        <button
          className="fab"
          onClick={() => setPanel('add')}
          aria-label="Add place"
          title="Add place"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <aside className={`side-panel${(panel || editingPlace) ? ' open' : ''}`}>
        {panel === 'add' && !editingPlace && (
          <AddPlacePanel
            key="add"
            onAdd={handleAdd}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === 'list' && !editingPlace && (
          <div className="panel">
            <div className="panel-header">
              <h2>Saved places</h2>
              <div className="panel-header-right">
                <ExportButton />
                <button className="icon-btn" onClick={() => setPanel(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="panel-body">
              <PlacesList
                places={filteredPlaces}
                onDelete={deletePlace}
                onEdit={setEditingPlace}
                onLocate={(place) => {
                  setFocusPlace({ lat: place.lat, lng: place.lng })
                  setPopupPlaceId(place.id)
                  setViewingPlace({ id: place.id, name: place.name })
                  setPanel(null)
                }}
                activeFilter={filter}
                cityName={cityName}
                radius={radius}
                onRadiusChange={(r) => { setRadius(r); setViewingPlace(null) }}
                onCitySelect={(lat, lng, name) => { setCenter(lat, lng, name); setViewingPlace(null) }}
                onClear={() => { clearCenter(); setViewingPlace(null) }}
                viewingPlace={viewingPlace}
              />
            </div>
          </div>
        )}
        {editingPlace && (
          <AddPlacePanel
            key={editingPlace.id}
            editPlace={editingPlace}
            onUpdate={handleUpdate}
            onClose={() => { setEditingPlace(null); setPanel(null) }}
          />
        )}
      </aside>
    </div>
  )
}
