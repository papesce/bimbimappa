import type { GeoPoint, MapBounds, Place } from '../types'

/**
 * Haversine formula — great-circle distance between two lat/lng points.
 * Returns distance in kilometres.
 */
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Return places that fall within `radiusKm` of `center`.
 */
export function getPlacesWithinRadius(places: Place[], center: GeoPoint, radiusKm: number): Place[] {
  return places.filter(
    (p) => getDistanceKm(center.lat, center.lng, p.lat, p.lng) <= radiusKm
  )
}

/**
 * Return places that fall within the given map bounds.
 * bounds = { north, south, east, west }
 */
export function getPlacesWithinBounds(places: Place[], bounds: MapBounds): Place[] {
  return places.filter(
    (p) => p.lat >= bounds.south && p.lat <= bounds.north &&
           p.lng >= bounds.west  && p.lng <= bounds.east
  )
}

/**
 * Walk the radii array (smallest → largest) and return the first bucket
 * that contains at least `minResults` places. If none do, return the
 * largest radius with whatever it catches — never expand past the last entry.
 */
export function findOptimalRadius(
  places: Place[],
  center: GeoPoint,
  radii: number[] = [50, 100, 150, 200],
  minResults = 10
): { radius: number; matchedPlaces: Place[] } {
  for (const r of radii) {
    const matched = getPlacesWithinRadius(places, center, r)
    if (matched.length >= minResults) return { radius: r, matchedPlaces: matched }
  }
  const lastR = radii[radii.length - 1]
  return { radius: lastR, matchedPlaces: getPlacesWithinRadius(places, center, lastR) }
}
