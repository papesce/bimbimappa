import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { GeoPoint, Place } from '../types'

export interface MapControllerProps {
  focusPlaces: Place[]
  center: GeoPoint | null
  radius: number
  focusPlace: GeoPoint | null
  onFocusDone: () => void
  fitBoundsTrigger: number
  previewArea: GeoPoint | null
  onPreviewAreaDone: () => void
  suppressFit: number
}

export default function MapController({ focusPlaces, center, radius, focusPlace, onFocusDone, fitBoundsTrigger, previewArea, onPreviewAreaDone, suppressFit }: MapControllerProps) {
  const map = useMap()

  // Fit the camera to the full radius circle + any matched markers
  useEffect(() => {
    if (previewArea) return
    if (suppressFit > 0) return
    if (!center && focusPlaces.length === 0) return
    let bounds: L.LatLngBounds | null = null
    if (center) {
      const centerLatLng = L.latLng(center.lat, center.lng)
      bounds = centerLatLng.toBounds(radius * 2000)
    }
    if (focusPlaces.length > 0) {
      const markerBounds = L.latLngBounds(focusPlaces.map(p => [p.lat, p.lng]))
      bounds = bounds ? bounds.extend(markerBounds) : markerBounds
    }
    if (!bounds) return
    map.fitBounds(bounds, { padding: [48, 48] })
  }, [focusPlaces, center, radius, map, suppressFit, previewArea])

  // Explicit refit triggered by "Back to area" button
  useEffect(() => {
    if (fitBoundsTrigger === 0) return
    let bounds: L.LatLngBounds | null = null
    if (center) {
      const centerLatLng = L.latLng(center.lat, center.lng)
      bounds = centerLatLng.toBounds(radius * 2000)
    }
    if (focusPlaces.length > 0) {
      const markerBounds = L.latLngBounds(focusPlaces.map(p => [p.lat, p.lng]))
      bounds = bounds ? bounds.extend(markerBounds) : markerBounds
    }
    if (bounds) map.fitBounds(bounds, { padding: [48, 48] })
  }, [fitBoundsTrigger, focusPlaces, center, radius, map])

  // On new/edited place: fly to it
  useEffect(() => {
    if (!focusPlace) return
    map.flyTo([focusPlace.lat, focusPlace.lng], 14)
    onFocusDone()
  }, [focusPlace, map, onFocusDone])

  // Show area in map: fly to preview location
  useEffect(() => {
    if (!previewArea) return
    map.flyTo([previewArea.lat, previewArea.lng], 14)
    onPreviewAreaDone()
  }, [previewArea, map, onPreviewAreaDone])

  return null
}
