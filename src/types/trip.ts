export type TripPriority = 1 | 2 | 3;

export type TripSortOption = 'priority' | 'date' | 'count' | 'name';

export interface Trip {
  id: string;
  name: string;
  notes: string | null;
  priority: TripPriority;
  place_ids: string[];
  target_date: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface TripInput {
  name: string;
  notes?: string | null;
  priority?: TripPriority;
  place_ids?: string[];
  target_date?: string | null;
}
