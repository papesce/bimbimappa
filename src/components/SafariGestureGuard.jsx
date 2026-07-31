import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export default function SafariGestureGuard() {
  const map = useMap()
  useEffect(() => {
    if (typeof window === 'undefined' || !('onGestureStart' in window)) return
    const el = map.getContainer()
    const prevent = (e) => e.preventDefault()
    el.addEventListener('gesturestart', prevent)
    el.addEventListener('gesturechange', prevent)
    el.addEventListener('gestureend', prevent)
    return () => {
      el.removeEventListener('gesturestart', prevent)
      el.removeEventListener('gesturechange', prevent)
      el.removeEventListener('gestureend', prevent)
    }
  }, [map])
  return null
}
