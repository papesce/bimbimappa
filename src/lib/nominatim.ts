import type { GeoPoint, NominatimResult, ReverseGeocodeResult } from '../types'

export interface NominatimSearchOptions {
  cityName?: string
  stateName?: string
  center?: GeoPoint | null
}

export async function searchNominatim(
  query: string,
  { cityName, stateName, center }: NominatimSearchOptions = {}
): Promise<NominatimResult[]> {
  const q = cityName && stateName
    ? `${query}, ${cityName}, ${stateName}`
    : cityName
      ? `${query}, ${cityName}`
      : query
  let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`
  if (center) {
    const d = 1
    url += `&viewbox=${center.lng - d},${center.lat - d},${center.lng + d},${center.lat + d}`
  }
  const res = await fetch(url, { headers: { Accept: 'application/json', 'Accept-Language': 'en' } })
  const data = await res.json() as NominatimResult[]
  console.log('[Search] Nominatim query:', q, '→', data.length, 'results')
  return data
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { Accept: 'application/json', 'Accept-Language': 'en' } }
  )
  return res.json() as Promise<ReverseGeocodeResult>
}
