import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, X, Clock, Trash2, Check, MapPin } from 'lucide-react'
import RadiusSelector from './RadiusSelector'
import { loadRecent, saveRecent } from '../lib/recentCities'
import { searchNominatim } from '../lib/nominatim'
import { toTitleCase } from '../lib/text'
import type { FilterKey, GeoPoint, MapBounds, NominatimResult, Place, RecentCity } from '../types'

export interface UnifiedSearchInputProps {
  onCitySelect: (lat: number, lng: number, name: string, state: string, countryCode: string) => void
  onClear: () => void
  center: GeoPoint | null
  stateName: string
  radius?: number
  onRadiusChange?: (radius: number) => void
  cityName: string
  activeFilter?: FilterKey
  places: Place[]
  onLocate: (place: Place) => void
  query: string
  onQueryChange: (query: string) => void
  viewportBounds?: MapBounds | null
  boundsRadius?: number | null
  onBoundsRadiusChange?: (radius: number) => void
  onHoverRadius?: (km: number | null) => void
  variant?: 'default' | 'topbar'
  autoFocus?: boolean
  onFocusChange?: (focused: boolean) => void
  hideRadius?: boolean
}

export default function UnifiedSearchInput({ onCitySelect, center, stateName, radius, onRadiusChange, cityName, places, onLocate, query, onQueryChange, viewportBounds, boundsRadius, onBoundsRadiusChange, onHoverRadius, variant = 'default', autoFocus, onFocusChange, hideRadius = false }: UnifiedSearchInputProps) {
  const [cityResults, setCityResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<RecentCity[]>(loadRecent)
  const [confirmingClearAll, setConfirmingClearAll] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const blurRef = useRef<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const shouldRefocus = useRef(false)
  const [isScrollable, setIsScrollable] = useState(false)

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus()
  }, [autoFocus])

  const q = query.trim().toLowerCase()
  const hasCity = !!cityName
  const showCitySection = !hasCity

  const matchedPlaces = q.length >= 2
    ? places.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.amenities?.some(a => a.toLowerCase().includes(q)) ||
        String(p.price_tier ?? '').includes(q) ||
        String(p.priority ?? '').includes(q) ||
        String(p.rating ?? '').includes(q)
      )
    : []

  const searchCities = useCallback(async (searchQuery: string) => {
    try {
      const data = await searchNominatim(searchQuery, { cityName, stateName, center })
      setCityResults(data)
    } catch {
      setCityResults([])
    }
  }, [cityName, stateName, center])

  useEffect(() => {
    if (shouldRefocus.current && inputRef.current) {
      inputRef.current.focus()
      shouldRefocus.current = false
    }
  })

  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const el = dropdownRef.current
      setIsScrollable(el.scrollHeight > el.clientHeight)
    }
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onQueryChange(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.trim().length < 2) {
      setCityResults([])
      return
    }
    if (showCitySection) {
      timerRef.current = setTimeout(() => searchCities(val.trim()), 300)
    }
    setOpen(true)
  }

  function handleSelectCity(r: NominatimResult) {
    if (blurRef.current) clearTimeout(blurRef.current)
    shouldRefocus.current = true
    const name = r.display_name.split(',')[0].trim()
    const state = r.address?.state || r.address?.region || r.address?.county || ''
    const countryCode = r.address?.country_code || ''
    setOpen(false)

    const entry: RecentCity = { name, lat: parseFloat(r.lat), lon: parseFloat(r.lon), state, countryCode }
    const next = [entry, ...recent.filter(e => e.name !== name)].slice(0, 10)
    setRecent(next)
    saveRecent(next)

    onCitySelect(entry.lat, entry.lon, name, state, countryCode)
    onQueryChange('')
    setCityResults([])
  }

  function handleRecentSelect(entry: RecentCity) {
    if (blurRef.current) clearTimeout(blurRef.current)
    shouldRefocus.current = true
    setOpen(false)
    onCitySelect(entry.lat, entry.lon, entry.name, entry.state || '', entry.countryCode || '')
    onQueryChange('')
    setCityResults([])
  }

  function handleSelectPlace(place: Place) {
    if (blurRef.current) clearTimeout(blurRef.current)
    setOpen(false)
    onQueryChange('')
    onLocate(place)
  }

  function handleClearInput() {
    onQueryChange('')
    setCityResults([])
  }

  function handleFocus() {
    setOpen(true)
    onFocusChange?.(true)
  }

  function handleBlur() {
    blurRef.current = setTimeout(() => {
      setOpen(false)
      setCityResults([])
      onFocusChange?.(false)
    }, 150)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onQueryChange('')
      setCityResults([])
      setOpen(false)
    }
  }

  function removeRecent(e: React.MouseEvent, name: string) {
    e.stopPropagation()
    const next = recent.filter(r => r.name !== name)
    setRecent(next)
    saveRecent(next)
  }

  function clearAllRecent(e: React.MouseEvent) {
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

  return (
    <div className={`unified-search${variant === 'topbar' ? ' unified-search--topbar' : ''}`}>
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
      {!hideRadius && (center || (viewportBounds && !center)) && (
        <div className="unified-search-radius-inline">
          <span className="unified-search-radius-label">Radius</span>
          <RadiusSelector value={center ? radius ?? 0 : boundsRadius ?? 0} onChange={center ? onRadiusChange ?? (() => {}) : onBoundsRadiusChange ?? (() => {})} onHover={onHoverRadius} />
           <span className="unified-search-radius-label">Km</span>
        </div>
      )}
      {showDropdown && (
        <div ref={dropdownRef} className={`unified-search-dropdown${isScrollable ? ' unified-search-dropdown--scrollable' : ''}`}>
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
              {matchedPlaces.slice(0, 15).map((place) => (
                <button
                  key={place.id}
                  className="unified-search-option"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectPlace(place) }}
                >
                  <MapPin size={12} className="unified-search-option-icon" />
                  <span className="unified-search-option-text">
                    <strong>{toTitleCase(place.name)}</strong>
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
