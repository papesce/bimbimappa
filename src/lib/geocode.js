const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY

/**
 * Converts a place name or address string into { lat, lng, formattedAddress }.
 * Uses Google Geocoding API (free tier covers ~40k requests/day).
 */
export async function geocodePlace(query, { region } = {}) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('key', API_KEY)
  if (region) url.searchParams.set('region', region)

  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK' || !data.results.length) {
    throw new Error(`Couldn't find "${query}". Try a more specific address.`)
  }

  const result = data.results[0]
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  }
}
