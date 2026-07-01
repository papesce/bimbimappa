import { useState } from 'react'
import { MapPin, List, Plus, X } from 'lucide-react'
import Map from './components/Map'
import AddPlacePanel from './components/AddPlacePanel'
import PlacesList from './components/PlacesList'
import AccessDenied from './components/AccessDenied'
import { usePlaces } from './hooks/usePlaces'
import { useAuth } from './hooks/useAuth'
import './index.css'

function getFilterStart(filter) {
  const now = new Date()
  if (filter === 'all') return null
  if (filter === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (filter === 'week') {
    const daysSinceMonday = (now.getDay() + 6) % 7
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday)
  }
}

export default function App() {
  const { authed } = useAuth()
  const { places, loading, addPlace, deletePlace, updatePlace } = usePlaces()
  const [panel, setPanel] = useState(null)
  const [editingPlace, setEditingPlace] = useState(null)
  const [filter, setFilter] = useState('all')

  const filterStart = getFilterStart(filter)
  const filteredPlaces = filterStart
    ? places.filter(p => new Date(p.created_at) >= filterStart)
    : places

  if (!authed) return <AccessDenied />

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ]

  return (
    <div className="app">
      <div className="map-wrapper">
        {!loading && (
          <Map places={filteredPlaces} onDelete={deletePlace} onEdit={setEditingPlace} />
        )}
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
          <div className="filter-bar">
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
          <span className="pin-count">
            {filteredPlaces.length} of {places.length} {places.length === 1 ? 'place' : 'places'}
          </span>
          <button
            className="btn-secondary small"
            onClick={() => setPanel(panel === 'list' ? null : 'list')}
          >
            <List size={14} /> List
          </button>
          <button
            className="btn-primary small"
            onClick={() => setPanel(panel === 'add' ? null : 'add')}
          >
            <Plus size={14} /> Add place
          </button>
        </div>
      </header>

      {(panel || editingPlace) && (
        <aside className="side-panel">
          {panel === 'add' && !editingPlace && (
            <AddPlacePanel
              key="add"
              onAdd={addPlace}
              onClose={() => setPanel(null)}
            />
          )}
          {panel === 'list' && !editingPlace && (
            <div className="panel">
              <div className="panel-header">
                <h2>Saved places</h2>
                <button className="icon-btn" onClick={() => setPanel(null)}>
                  <X size={18} />
                </button>
              </div>
              <PlacesList
                places={filteredPlaces}
                onDelete={deletePlace}
                onEdit={setEditingPlace}
                activeFilter={filter}
              />
            </div>
          )}
          {editingPlace && (
            <AddPlacePanel
              key={editingPlace.id}
              editPlace={editingPlace}
              onUpdate={updatePlace}
              onClose={() => { setEditingPlace(null); setPanel(null) }}
            />
          )}
        </aside>
      )}
    </div>
  )
}
