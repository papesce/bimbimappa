/**
 * Haversine formula — great-circle distance between two lat/lng points.
 * Returns distance in kilometres.
 */
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth's mean radius in km
  const toRad = (deg) => (deg * Math.PI) / 180
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
export function getPlacesWithinRadius(places, center, radiusKm) {
  return places.filter(
    (p) => getDistanceKm(center.lat, center.lng, p.lat, p.lng) <= radiusKm
  )
}

/**
 * Walk the radii array (smallest → largest) and return the first bucket
 * that contains at least `minResults` places. If none do, return the
 * largest radius with whatever it catches — never expand past the last entry.
 */
export function findOptimalRadius(
  places,
  center,
  radii = [50, 100, 150, 200],
  minResults = 10
) {
  for (const r of radii) {
    const matched = getPlacesWithinRadius(places, center, r)
    if (matched.length >= minResults) return { radius: r, matchedPlaces: matched }
  }
  const lastR = radii[radii.length - 1]
  return { radius: lastR, matchedPlaces: getPlacesWithinRadius(places, center, lastR) }
}
