export interface PlaceLink {
  id: string
  url: string
  label: string
  is_primary: boolean
}

export interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  notes: string | null
  source_url: string | null
  links: PlaceLink[] | null
  date_from: string | null
  date_to: string | null
  deleted_at: string | null
  created_at: string
}

export interface PlaceInput {
  name: string
  address: string
  lat: number
  lng: number
  notes: string
  links: PlaceLink[]
  date_from: string | null
  date_to: string | null
}

export interface ViewingPlace {
  id: string
  name: string
}
