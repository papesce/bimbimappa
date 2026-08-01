import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

// Closing any open popup on drag keeps the map freely pannable and avoids
// popups getting stuck at the screen edge (e.g. under the topbar).
export default function ClosePopupOnDrag() {
  const map = useMap()
  useEffect(() => {
    const close = () => map.closePopup()
    map.on('dragstart', close)
    return () => { map.off('dragstart', close) }
  }, [map])
  return null
}
