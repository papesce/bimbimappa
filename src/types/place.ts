export type PlaceCategory =
  | 'home'
  | 'museum'
  | 'shopping'
  | 'event_venue'
  | 'maze'
  | 'food'
  | 'park'
  | 'farm'
  | 'adventure_park'
  | 'fun_center'
  | 'theater'
  | 'auditorium'
  | 'other';
export type PriorityLevel = 1 | 2 | 3;
export type PriceTier = 1 | 2 | 3 | 4;

export interface PlaceAmenity {
  id: string;
  label: string;
}

export interface PlaceLink {
  id: string;
  url: string;
  label: string;
  is_primary: boolean;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  notes: string | null;
  source_url: string | null;
  links: PlaceLink[] | null;
  category: PlaceCategory | null;
  amenities: string[] | null;
  price_tier: PriceTier | null;
  priority: PriorityLevel | null;
  rating: number | null;
  date_from: string | null;
  date_to: string | null;
  photo_url: string | null;
  visited: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface PlaceInput {
  name: string;
  address: string;
  lat: number;
  lng: number;
  notes: string;
  links: PlaceLink[];
  category: PlaceCategory | null;
  amenities: string[];
  price_tier: PriceTier | null;
  priority: PriorityLevel | null;
  rating: number | null;
  date_from: string | null;
  date_to: string | null;
  photo_url: string | null;
  visited: boolean;
}

export interface ViewingPlace {
  id: string;
  name: string;
}
