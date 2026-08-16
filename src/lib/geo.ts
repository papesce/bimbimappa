import type { GeoPoint, MapBounds, Place } from '../types';

/**
 * Haversine formula — great-circle distance between two lat/lng points.
 * Returns distance in kilometres.
 */
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Return places that fall within `radiusKm` of `center`.
 */
export function getPlacesWithinRadius(
  places: Place[],
  center: GeoPoint,
  radiusKm: number,
): Place[] {
  return places.filter(p => getDistanceKm(center.lat, center.lng, p.lat, p.lng) <= radiusKm);
}

/**
 * Return places that fall within the given map bounds.
 * bounds = { north, south, east, west }
 */
export function getPlacesWithinBounds(places: Place[], bounds: MapBounds): Place[] {
  return places.filter(
    p =>
      p.lat >= bounds.south &&
      p.lat <= bounds.north &&
      p.lng >= bounds.west &&
      p.lng <= bounds.east,
  );
}

export interface NearbySuggestion {
  place: Place;
  minDistanceKm: number;
}

/**
 * Find saved places not already in the trip that sit within `maxKm` of any
 * place in the trip, sorted by proximity. Returns up to `limit` results.
 */
export function getNearbySuggestions(
  tripPlaces: Place[],
  allPlaces: Place[],
  { maxKm = 15, limit = 6 }: { maxKm?: number; limit?: number } = {},
): NearbySuggestion[] {
  if (tripPlaces.length === 0) return [];
  const tripIds = new Set(tripPlaces.map(p => p.id));

  const suggestionsWithDistance: NearbySuggestion[] = [];

  for (const candidate of allPlaces) {
    if (tripIds.has(candidate.id)) continue;
    let minDistance = Infinity;
    for (const tripPlace of tripPlaces) {
      const dist = getDistanceKm(tripPlace.lat, tripPlace.lng, candidate.lat, candidate.lng);
      if (dist < minDistance) minDistance = dist;
    }
    if (minDistance <= maxKm) {
      suggestionsWithDistance.push({ place: candidate, minDistanceKm: minDistance });
    }
  }

  return suggestionsWithDistance.sort((a, b) => a.minDistanceKm - b.minDistanceKm).slice(0, limit);
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
  minResults = 10,
): { radius: number; matchedPlaces: Place[] } {
  for (const r of radii) {
    const matched = getPlacesWithinRadius(places, center, r);
    if (matched.length >= minResults) return { radius: r, matchedPlaces: matched };
  }
  const lastR = radii[radii.length - 1];
  return { radius: lastR, matchedPlaces: getPlacesWithinRadius(places, center, lastR) };
}

/**
 * Geographic centre of a set of places (mean of coordinates). Returns `null`
 * for an empty list; single-place trips resolve to that place's coordinates.
 */
export function getTripCentroid(places: Place[]): GeoPoint | null {
  if (places.length === 0) return null;
  if (places.length === 1) return { lat: places[0].lat, lng: places[0].lng };
  const sum = places.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), {
    lat: 0,
    lng: 0,
  });
  return { lat: sum.lat / places.length, lng: sum.lng / places.length };
}

const DEFAULT_RADII = [5, 10, 50, 100, 200];

/**
 * Smallest radius bucket that covers every place from `center`, so a trip's
 * default radius never hides any of its own places. Falls back to the largest
 * bucket, or `minRadius` when the list is empty.
 */
export function getCoveringRadiusKm(
  center: GeoPoint,
  places: Place[],
  radii: number[] = DEFAULT_RADII,
  minRadius = 5,
): number {
  for (const r of radii) {
    if (places.every(p => getDistanceKm(center.lat, center.lng, p.lat, p.lng) <= r)) return r;
  }
  return radii[radii.length - 1] ?? minRadius;
}
