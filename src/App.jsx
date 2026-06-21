import { useState } from 'react'
import { MapPin, List, Plus, X } from 'lucide-react'
import Map from './components/Map'
import AddPlacePanel from './components/AddPlacePanel'
import PlacesList from './components/PlacesList'
import AccessDenied from './components/AccessDenied'
import { usePlaces } from './hooks/usePlaces'
import { useAuth } from './hooks/useAuth'
import './index.css'

export default function App() {
  const { authed } = useAuth()
  const { places, loading, addPlace, deletePlace } = usePlaces()
  const [panel, setPanel] = useState(null) // null | 'add' | 'list'

  if (!authed) return <AccessDenied />

  return (
    <div className="app">
      {/* Map fills the screen */}
      <div className="map-wrapper">
        {!loading && (
          <Map places={places} onDelete={deletePlace} />
        )}
      </div>

      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-brand">
          <MapPin size={18} strokeWidth={2.5} />
          <span>Family Fun Map</span>
        </div>
        <div className="topbar-actions">
          <span className="pin-count">{places.length} {places.length === 1 ? 'place' : 'places'}</span>
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

      {/* Sliding side panel */}
      {panel && (
        <aside className="side-panel">
          {panel === 'add' && (
            <AddPlacePanel
              onAdd={addPlace}
              onClose={() => setPanel(null)}
            />
          )}
          {panel === 'list' && (
            <div className="panel">
              <div className="panel-header">
                <h2>Saved places</h2>
                <button className="icon-btn" onClick={() => setPanel(null)}>
                  <X size={18} />
                </button>
              </div>
              <PlacesList places={places} onDelete={deletePlace} />
            </div>
          )}
        </aside>
      )}
    </div>
  )
}
