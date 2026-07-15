import { Crosshair } from 'lucide-react'

export default function LocationControls({ isGeolocating, onReset }) {
  return (
    <button
      className={`location-bar-geo${isGeolocating ? ' spinning' : ''}`}
      onClick={onReset}
      title="Use my location"
      aria-label="Use my location"
    >
      <Crosshair size={16} />
    </button>
  )
}
