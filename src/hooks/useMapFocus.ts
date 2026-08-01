import { useState, useEffect, useCallback, useMemo } from 'react'
import { getPlacesWithinRadius, findOptimalRadius } from '../lib/geo'
import { reverseGeocode } from '../lib/nominatim'
import type { GeoPoint, MapFocusState, Place } from '../types'

const STORAGE_KEY = 'bimbimappa-map-focus'
const DEFAULT_CENTER: GeoPoint = { lat: -34.6037, lng: -58.3816 } // Buenos Aires
const GEOLOCATION_TIMEOUT = 8000
const GEOLOCATION_MAX_AGE = 300000 // 5 min

function loadStored(): MapFocusState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MapFocusState
  } catch { /* corrupted — ignore */ }
  return null
}

function persist(center: GeoPoint, radius: number, cityName: string, stateName: string, countryCode: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ center, radius, cityName, stateName, countryCode }))
  } catch { /* storage full — ignore */ }
}

export function useMapFocus(places: Place[]) {
  const stored = useMemo(() => loadStored(), [])

  const [center, setCenterState] = useState<GeoPoint | null>(stored?.center ?? null)
  const [radius, setRadiusState] = useState<number>(stored?.radius ?? 50)
  const [cityName, setCityName] = useState(stored?.cityName ?? '')
  const [stateName, setStateName] = useState(stored?.stateName ?? '')
  const [countryCode, setCountryCode] = useState(stored?.countryCode ?? '')
  const [isGeolocating, setIsGeolocating] = useState(!stored)
  const [autoMode, setAutoMode] = useState(!stored)

  // Request browser geolocation when autoMode is active (first visit or after resetToGeolocation)
  useEffect(() => {
    if (!autoMode) return
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
  }, [autoMode])

  // Resolve countryCode from center via reverse geocode when missing (geolocation or old stored data)
  useEffect(() => {
    if (!center || countryCode) return
    reverseGeocode(center.lat, center.lng)
      .then(data => {
        const cc = data.address?.country_code ?? ''
        if (cc) {
          setCountryCode(cc)
          persist(center, radius, cityName, stateName, cc)
        }
      })
      .catch(() => {})
  }, [center])

  // Auto-compute optimal radius once places load (geolocation first-visit flow)
  useEffect(() => {
    if (!autoMode || !center || places.length === 0) return
    const { radius: optimal } = findOptimalRadius(places, center)
    setRadiusState(optimal)
    persist(center, optimal, '', '', '')
    setAutoMode(false)
  }, [autoMode, center, places])

  const setCenter = useCallback(
    (lat: number, lng: number, name: string, state: string, cc = ''): void => {
      const c: GeoPoint = { lat, lng }
      setCenterState(c)
      setCityName(name || '')
      setStateName(state || '')
      setCountryCode(cc || '')
      setAutoMode(false)
      persist(c, radius, name, state, cc)
    },
    [radius]
  )

  const setRadius = useCallback(
    (r: number): void => {
      setRadiusState(r)
      setAutoMode(false)
      if (center) persist(center, r, cityName, stateName, countryCode)
    },
    [center, cityName, stateName, countryCode]
  )

  // Set center + radius atomically (e.g. "focus here" from the map viewport)
  const setFocusCenter = useCallback((lat: number, lng: number, r: number): void => {
    const c: GeoPoint = { lat, lng }
    setCenterState(c)
    setRadiusState(r)
    setCityName('')
    setStateName('')
    setCountryCode('')
    setAutoMode(false)
    setIsGeolocating(false)
    persist(c, r, '', '', '')
  }, [])

  const clearCenter = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEY)
    setCenterState(null)
    setCityName('')
    setStateName('')
    setCountryCode('')
    setAutoMode(false)
  }, [])

  const resetToGeolocation = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEY)
    setCenterState(null)
    setCityName('')
    setStateName('')
    setCountryCode('')
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
    stateName,
    countryCode,
    matchedPlaces,
    isGeolocating,
    setCenter,
    setRadius,
    setFocusCenter,
    clearCenter,
    resetToGeolocation,
  }
}
