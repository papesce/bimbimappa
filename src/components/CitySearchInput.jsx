import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, X, Clock, Trash2, Check, MapPin, Map, ChevronDown } from 'lucide-react'
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

export default function CitySearchInput({ onCitySelect, onClear, autoFocus, radius, onRadiusChange, cityName, viewingPlace }) {
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState(loadRecent)
  const [confirmingClearAll, setConfirmingClearAll] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const blurRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  const search = useCallback(async (q) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { Accept: 'application/json', 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setResults(data)
      setOpen(true)
    } catch {
      setResults([])
      setOpen(false)
    }
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    if (val.trim().length < 2) {
      setResults([])
      if (val.trim().length === 0) setOpen(true)
      return
    }
    timerRef.current = setTimeout(() => search(val.trim()), 300)
  }

  function handleSelect(r) {
    clearTimeout(blurRef.current)
    const name = r.display_name.split(',')[0]
    setOpen(false)

    const entry = { name, lat: parseFloat(r.lat), lon: parseFloat(r.lon) }
    const next = [entry, ...recent.filter(e => e.name !== name)].slice(0, MAX_RECENT)
    setRecent(next)
    saveRecent(next)

    onCitySelect(entry.lat, entry.lon, name)
    setQuery('')
    setEditing(false)
  }

  function handleRecentSelect(entry) {
    clearTimeout(blurRef.current)
    setOpen(false)
    onCitySelect(entry.lat, entry.lon, entry.name)
    setQuery('')
    setEditing(false)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    setEditing(false)
    onClear()
  }

  function handleFocus() {
    setOpen(true)
  }

  function handleBlur() {
    blurRef.current = setTimeout(() => {
      setOpen(false)
      setEditing(false)
      setQuery('')
      setResults([])
    }, 150)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setQuery('')
      setResults([])
      setOpen(false)
      setEditing(false)
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

  function handleOpen() {
    setEditing(true)
  }

  const showRecent = query.trim().length === 0 && recent.length > 0
  const showNoRecent = query.trim().length === 0 && recent.length === 0 && open
  const showResults = query.trim().length >= 2 && open
  const showNoResults = query.trim().length >= 2 && open && results.length === 0

  if (viewingPlace) {
    return (
      <div className="city-search">
        <div className="city-search-pill city-search-pill--static">
          <MapPin size={12} className="city-search-pill-icon" />
          <span className="city-search-pill-label">Viewing <strong>{viewingPlace.name}</strong></span>
          <button className="city-search-pill-clear" onClick={onClear} title="Clear filter">
            <X size={12} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`city-search${editing ? ' city-search--editing' : ''}`}>
      {!editing ? (
        <button className="city-search-pill" onClick={handleOpen} type="button">
          {cityName
            ? <MapPin size={12} className="city-search-pill-icon" />
            : <Map size={12} className="city-search-pill-icon" />
          }
          <span className="city-search-pill-label">
            {cityName
              ? <>Showing in <strong>{cityName}</strong>{radius ? ` · ${radius} km` : ''}</>
              : <>Showing in current map view</>
            }
          </span>
          {cityName
            ? <button className="city-search-pill-clear" onClick={(e) => { e.stopPropagation(); handleClear() }} title="Clear filter"><X size={12} /></button>
            : <ChevronDown size={12} className="city-search-pill-chevron" />
          }
        </button>
      ) : (
        <>
          <Search size={14} className="city-search-icon" />
          <input
            ref={inputRef}
            className="city-search-input"
            type="text"
            placeholder="Search city…"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          {query.length > 0 && (
            <button
              className="city-search-clear"
              onMouseDown={(e) => { e.preventDefault(); handleClear() }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          {open && (showRecent || showNoRecent || showResults || showNoResults) && (
            <div className="city-search-dropdown">
              {showRecent && (
                <>
                  <div className="city-search-dropdown-header">
                    <span>Recent searches</span>
                    {confirmingClearAll ? (
                      <span className="city-search-confirm-inline">
                        <span>Clear all?</span>
                        <button
                          className="city-search-confirm-btn danger"
                          onMouseDown={(e) => { e.preventDefault(); clearAllRecent(e); setConfirmingClearAll(false) }}
                        >
                          <Check size={11} />Yes
                        </button>
                        <button
                          className="city-search-confirm-btn"
                          onMouseDown={(e) => { e.preventDefault(); setConfirmingClearAll(false) }}
                        >
                          <X size={11} />No
                        </button>
                      </span>
                    ) : (
                      <button
                        className="city-search-clear-all"
                        onMouseDown={(e) => { e.preventDefault(); setConfirmingClearAll(true) }}
                      >
                        <Trash2 size={11} /> Clear all
                      </button>
                    )}
                  </div>
                  {recent.map((entry) => (
                    <button
                      key={entry.name}
                      className="city-search-option city-search-recent"
                      onMouseDown={() => handleRecentSelect(entry)}
                    >
                      <Clock size={12} className="city-search-option-icon" />
                      <span className="city-search-option-text">{entry.name}</span>
                      <span
                        className="city-search-option-remove"
                        onMouseDown={(e) => { e.preventDefault(); removeRecent(e, entry.name) }}
                      >
                        <X size={12} />
                      </span>
                    </button>
                  ))}
                </>
              )}
              {showNoRecent && (
                <div className="city-search-empty">No recent searches</div>
              )}
              {showResults && results.map((r) => (
                <button
                  key={r.place_id}
                  className="city-search-option"
                  onMouseDown={() => handleSelect(r)}
                >
                  {r.display_name}
                </button>
              ))}
              {showNoResults && (
                <div className="city-search-empty">No results found</div>
              )}
              <div className="city-search-radius-row">
                <span className="city-search-radius-label">Radius</span>
                <RadiusSelector value={radius} onChange={onRadiusChange} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
