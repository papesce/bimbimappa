import { Crosshair, Globe, LocateFixed } from 'lucide-react'

export interface LocationControlsProps {
  isGeolocating: boolean
  onReset: () => void
  onShowAll: () => void
  onFocusHere: () => void
}

export default function LocationControls({ isGeolocating, onReset, onShowAll, onFocusHere }: LocationControlsProps) {
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
      <button
        className="location-bar-geo"
        onClick={onFocusHere}
        title="Focus on current view"
        aria-label="Focus on current view"
      >
        <LocateFixed size={16} />
      </button>
    </div>
  )
}
