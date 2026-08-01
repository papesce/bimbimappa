import type { GeoPoint } from './geo'

export interface ResolvedLocation extends GeoPoint {
  formattedAddress: string
}

export interface GoogleGeocodeResponse {
  status: string
  results: Array<{
    geometry: { location: GeoPoint }
    formatted_address: string
  }>
}
