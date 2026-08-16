export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapFocusState {
  center: GeoPoint;
  radius: number;
  cityName: string;
  stateName: string;
  countryCode: string;
}
