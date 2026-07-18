import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, X, Clock, Trash2, Check, MapPin } from 'lucide-react'
import RadiusSelector from './RadiusSelector'

const RECENT_KEY = 'bimbimappa-recent-cities'
const MAX_RECENT = 10

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveRecent(list) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))) } catch {}
}

export default function UnifiedSearchInput({ onCitySelect, onClear, center, stateName, radius, onRadiusChange, cityName, viewingPlace, activeFilter, places, onLocate }) {
  const [query, setQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState(loadRecent)
  const [confirmingClearAll, setConfirmingClearAll] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const blurRef = useRef(null)
  const shouldRefocus = useRef(false)

  const q = query.trim().toLowerCase()
  const hasCity = !!cityName
  const showCitySection = !hasCity

  const matchedPlaces = q.length >= 2
    ? places.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      )
    : []

  const searchCities = useCallback(async (searchQuery) => {
    try {
      const q = cityName && stateName
        ? `${searchQuery}, ${cityName}, ${stateName}`
        : cityName
          ? `${searchQuery}, ${cityName}`
          : searchQuery
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
        { headers: { Accept: 'application/json', 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      console.log('[Search] Nominatim query:', q, '→', data.length, 'results')
      setCityResults(data)
    } catch {
      setCityResults([])
    }
  }, [cityName, stateName])

  useEffect(() => {
    if (shouldRefocus.current && inputRef.current) {
      inputRef.current.focus()
      shouldRefocus.current = false
    }
  })

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    if (val.trim().length < 2) {
      setCityResults([])
      return
    }
    if (showCitySection) {
      timerRef.current = setTimeout(() => searchCities(val.trim()), 300)
    }
    setOpen(true)
  }

  function handleSelectCity(r) {
    clearTimeout(blurRef.current)
    shouldRefocus.current = true
    const name = r.display_name.split(',')[0].trim()
    const state = r.address?.state || r.address?.region || r.address?.county || ''
    const countryCode = r.address?.country_code || ''
    setOpen(false)

    const entry = { name, lat: parseFloat(r.lat), lon: parseFloat(r.lon), state, countryCode }
    const next = [entry, ...recent.filter(e => e.name !== name)].slice(0, MAX_RECENT)
    setRecent(next)
    saveRecent(next)

    onCitySelect(entry.lat, entry.lon, name, state, countryCode)
    setQuery('')
    setCityResults([])
  }

  function handleRecentSelect(entry) {
    clearTimeout(blurRef.current)
    shouldRefocus.current = true
    setOpen(false)
    onCitySelect(entry.lat, entry.lon, entry.name, entry.state || '', entry.countryCode || '')
    setQuery('')
    setCityResults([])
  }

  function handleSelectPlace(place) {
    clearTimeout(blurRef.current)
    setOpen(false)
    setQuery('')
    onLocate(place)
  }

  function handleClearCity() {
    onClear()
  }

  function handleClearInput() {
    setQuery('')
    setCityResults([])
  }

  function handleFocus() {
    setOpen(true)
  }

  function handleBlur() {
    blurRef.current = setTimeout(() => {
      setOpen(false)
      setCityResults([])
    }, 150)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setQuery('')
      setCityResults([])
      setOpen(false)
    }
  }

  function removeRecent(e, name) {
    e.stopPropagation()
    const next = recent.filter(r => r.name !== name)
    setRecent(next)
    saveRecent(next)
  }

  function clearAllRecent(e) {
    e.stopPropagation()
    setRecent([])
    saveRecent([])
  }

  const showDropdown = open && (
    (!hasCity && q.length === 0) ||
    (q.length >= 2)
  )

  const showRecent = !hasCity && q.length === 0 && recent.length > 0
  const showNoRecent = !hasCity && q.length === 0 && recent.length === 0 && open
  const showCityResults = showCitySection && q.length >= 2 && cityResults.length > 0
  const showPlaceResults = q.length >= 2 && matchedPlaces.length > 0
  const showNoResults = q.length >= 2 &&
    ((showCitySection && cityResults.length === 0 && matchedPlaces.length === 0) ||
     (!showCitySection && matchedPlaces.length === 0))

  if (viewingPlace) {
    return (
      <div className="unified-search">
        <div className="unified-search-row">
          <div className="unified-search-token unified-search-token--viewing">
            <MapPin size={12} className="unified-search-token-icon" />
            <span className="unified-search-token-label">Viewing <strong>{viewingPlace.name}</strong></span>
            <button className="unified-search-token-clear" onClick={onClear} title="Clear">
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="unified-search">
      <div className="unified-search-row">
        <Search size={14} className="unified-search-icon" />
        <input
          ref={inputRef}
          className="unified-search-input"
          type="text"
          placeholder={hasCity ? "Search in this area…" : "Search places or filter by city…"}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {query.length > 0 && (
          <button
            className="unified-search-clear"
            onMouseDown={(e) => { e.preventDefault(); handleClearInput() }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {hasCity && (
        <div className="unified-search-radius-inline">
          <RadiusSelector value={radius} onChange={onRadiusChange} />
        </div>
      )}
      {showDropdown && (
        <div className="unified-search-dropdown">
          {showRecent && (
            <>
              <div className="unified-search-dropdown-header">
                <span>Recent searches</span>
                {confirmingClearAll ? (
                  <span className="unified-search-confirm-inline">
                    <span>Clear all?</span>
                    <button
                      className="unified-search-confirm-btn danger"
                      onMouseDown={(e) => { e.preventDefault(); clearAllRecent(e); setConfirmingClearAll(false) }}
                    >
                      <Check size={11} />Yes
                    </button>
                    <button
                      className="unified-search-confirm-btn"
                      onMouseDown={(e) => { e.preventDefault(); setConfirmingClearAll(false) }}
                    >
                      <X size={11} />No
                    </button>
                  </span>
                ) : (
                  <button
                    className="unified-search-clear-all"
                    onMouseDown={(e) => { e.preventDefault(); setConfirmingClearAll(true) }}
                  >
                    <Trash2 size={11} /> Clear all
                  </button>
                )}
              </div>
              {recent.map((entry) => (
                <button
                  key={entry.name}
                  className="unified-search-option unified-search-recent"
                  onMouseDown={(e) => { e.preventDefault(); handleRecentSelect(entry) }}
                >
                  <Clock size={12} className="unified-search-option-icon" />
                  <span className="unified-search-option-text">{entry.name}</span>
                  <span
                    className="unified-search-option-remove"
                    onMouseDown={(e) => { e.preventDefault(); removeRecent(e, entry.name) }}
                  >
                    <X size={12} />
                  </span>
                </button>
              ))}
            </>
          )}
          {showNoRecent && (
            <div className="unified-search-empty">No recent searches</div>
          )}
          {showCityResults && (
            <>
              <div className="unified-search-dropdown-header">
                <span>📍 Cities</span>
              </div>
              {cityResults.map((r) => (
                <button
                  key={r.place_id}
                  className="unified-search-option"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectCity(r) }}
                >
                  <MapPin size={12} className="unified-search-option-icon" />
                  <span className="unified-search-option-text">{r.display_name}</span>
                </button>
              ))}
            </>
          )}
          {showPlaceResults && (
            <>
              <div className="unified-search-dropdown-header">
                <span>⭐ Your places</span>
              </div>
              {matchedPlaces.slice(0, 10).map((place) => (
                <button
                  key={place.id}
                  className="unified-search-option"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectPlace(place) }}
                >
                  <MapPin size={12} className="unified-search-option-icon" />
                  <span className="unified-search-option-text">
                    <strong>{place.name}</strong>
                    <span className="unified-search-option-sub">{place.address}</span>
                  </span>
                </button>
              ))}
            </>
          )}
          {showNoResults && (
            <div className="unified-search-empty">No results found</div>
          )}
        </div>
      )}
    </div>
  )
}
