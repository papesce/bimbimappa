import { useEffect } from 'react'
import type { MutableRefObject } from 'react'
import L from 'leaflet'

export interface AutoOpenPopupProps {
  markerRef: MutableRefObject<L.Marker | null>
  isMobile: boolean
  placeId: string
  onMobilePopup: (placeId: string) => void
}

// Auto-opens the popup for the newly added marker
export default function AutoOpenPopup({ markerRef, isMobile, placeId, onMobilePopup }: AutoOpenPopupProps) {
  useEffect(() => {
    if (isMobile) {
      onMobilePopup(placeId)
    } else {
      if (markerRef.current) markerRef.current.openPopup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
