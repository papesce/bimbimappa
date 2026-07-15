import { useState, useRef } from 'react'
import { Crosshair, MapPin, Search } from 'lucide-react'
import CitySearchInput from './CitySearchInput'
import RadiusSelector from './RadiusSelector'

export default function LocationControls({
  radius,
  isGeolocating,
  onCitySelect,
  onRadiusChange,
  onReset,
  onClear,
}) {
  const [expanded, setExpanded] = useState(false)
  const [cityName, setCityName] = useState(null)
  const blurTimer = useRef(null)

  function handleFocus() {
    clearTimeout(blurTimer.current)
    setExpanded(true)
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setExpanded(false), 150)
  }

  function handleCitySelect(lat, lng, name) {
    setCityName(name)
    onCitySelect(lat, lng, name)
    // collapse after selection — task complete
    blurTimer.current = setTimeout(() => setExpanded(false), 150)
  }

  function handleClear() {
    setCityName(null)
    onClear()
  }

  if (!expanded) {
    return (
      <button
        className="location-bar location-bar--pill"
        onClick={() => setExpanded(true)}
        aria-label="Open city search"
      >
        {cityName
          ? <MapPin size={13} className="location-bar-pill-icon" />
          : <Search size={13} className="location-bar-pill-icon" />
        }
        <span className="location-bar-pill-label">
          {cityName ?? 'Search city…'}
        </span>
      </button>
    )
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setExpanded(false)
  }

  return (
    <div
      className="location-bar"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div className="location-bar-search">
        <CitySearchInput
          onCitySelect={handleCitySelect}
          onClear={handleClear}
          autoFocus
        />
      </div>
      <div className="location-bar-divider" />
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
