import { Crosshair } from 'lucide-react'
import RadiusSelector from './RadiusSelector'

export default function LocationControls({
  radius,
  isGeolocating,
  onRadiusChange,
  onReset,
}) {
  return (
    <div className="location-bar">
      <div className="location-bar-radius">
        <span className="location-bar-radius-label">Radius</span>
        <RadiusSelector value={radius} onChange={onRadiusChange} />
      </div>
      <div className="location-bar-divider" />
      <button
        className={`location-bar-geo${isGeolocating ? ' spinning' : ''}`}
        onClick={onReset}
        title="Use my location"
        aria-label="Use my location"
      >
        <Crosshair size={16} />
      </button>
    </div>
  )
}
