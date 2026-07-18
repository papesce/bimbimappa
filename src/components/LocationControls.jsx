import { Crosshair, Globe } from 'lucide-react'

export default function LocationControls({ isGeolocating, onReset, onShowAll }) {
  return (
    <div className="location-controls">
      <button
        className={`location-bar-geo${isGeolocating ? ' spinning' : ''}`}
        onClick={onReset}
        title="Use my location"
        aria-label="Use my location"
      >
        <Crosshair size={16} />
      </button>
      <button
        className="location-bar-geo"
        onClick={onShowAll}
        title="Show all places"
        aria-label="Show all places"
      >
        <Globe size={16} />
      </button>
    </div>
  )
}
