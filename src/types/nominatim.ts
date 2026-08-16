export interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    state?: string;
    region?: string;
    county?: string;
    country_code?: string;
  };
}

export interface RecentCity {
  name: string;
  lat: number;
  lon: number;
  state: string;
  countryCode: string;
}

export interface ReverseGeocodeResult {
  address?: {
    country_code?: string;
  };
}
