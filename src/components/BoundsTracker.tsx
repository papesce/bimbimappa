import { useMap, useMapEvents } from 'react-leaflet'
import type { MapBounds } from '../types'

export interface BoundsTrackerProps {
  onViewportChange: (bounds: MapBounds) => void
}

export default function BoundsTracker({ onViewportChange }: BoundsTrackerProps) {
  const map = useMap()
  useMapEvents({
    moveend() {
      const b = map.getBounds()
      onViewportChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    },
  })
  return null
}
