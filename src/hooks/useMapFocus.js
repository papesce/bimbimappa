import { useState, useEffect, useCallback, useMemo } from 'react'
import { getPlacesWithinRadius, findOptimalRadius } from '../lib/geo'

const STORAGE_KEY = 'bimbimappa-map-focus'
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 } // Buenos Aires
const GEOLOCATION_TIMEOUT = 8000
const GEOLOCATION_MAX_AGE = 300000 // 5 min

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* corrupted — ignore */ }
  return null
}

function persist(center, radius, cityName) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ center, radius, cityName }))
  } catch { /* storage full — ignore */ }
}

export function useMapFocus(places) {
  const stored = useMemo(() => loadStored(), [])

  const [center, setCenterState] = useState(stored?.center || null)
  const [radius, setRadiusState] = useState(stored?.radius || 50)
  const [cityName, setCityName] = useState(stored?.cityName || '')
  const [isGeolocating, setIsGeolocating] = useState(!stored)
  const [autoMode, setAutoMode] = useState(!stored)

  // Request browser geolocation on first visit (no stored preference)
  useEffect(() => {
    if (stored) return
    if (!navigator.geolocation) {
      setCenterState(DEFAULT_CENTER)
      setIsGeolocating(false)
      setAutoMode(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenterState({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsGeolocating(false)
        // radius computed by the auto-effect below once places arrive
      },
      () => {
        setCenterState(DEFAULT_CENTER)
        setIsGeolocating(false)
        setAutoMode(false)
      },
      { timeout: GEOLOCATION_TIMEOUT, maximumAge: GEOLOCATION_MAX_AGE }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-compute optimal radius once places load (geolocation first-visit flow)
  useEffect(() => {
    if (!autoMode || !center || places.length === 0) return
    const { radius: optimal } = findOptimalRadius(places, center)
    setRadiusState(optimal)
    persist(center, optimal, '')
    setAutoMode(false)
  }, [autoMode, center, places])

  const setCenter = useCallback(
    (lat, lng, name) => {
      const c = { lat, lng }
      setCenterState(c)
      setCityName(name || '')
      setAutoMode(false)
      persist(c, radius, name)
    },
    [radius]
  )

  const setRadius = useCallback(
    (r) => {
      setRadiusState(r)
      setAutoMode(false)
      if (center) persist(center, r, cityName)
    },
    [center, cityName]
  )

  const clearCenter = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setCenterState(null)
    setCityName('')
    setAutoMode(false)
  }, [])

  const resetToGeolocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setCenterState(null)
    setCityName('')
    setAutoMode(true)
    setIsGeolocating(true)
  }, [])

  const matchedPlaces = useMemo(() => {
    if (!center || places.length === 0) return places
    return getPlacesWithinRadius(places, center, radius)
  }, [places, center, radius])

  return {
    center,
    radius,
    cityName,
    matchedPlaces,
    isGeolocating,
    setCenter,
    setRadius,
    clearCenter,
    resetToGeolocation,
  }
}
