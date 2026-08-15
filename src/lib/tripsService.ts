import { supabase } from './supabase'
import type { Trip, TripInput } from '../types'

const LOCAL_STORAGE_KEY = 'bimbimappa_local_trips'

function getLocalTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Trip[]
  } catch {
    return []
  }
}

function saveLocalTrips(trips: Trip[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trips))
  } catch {
    // ignore
  }
}

export async function fetchTrips(): Promise<Trip[]> {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .is('deleted_at', null)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase trips fetch error, using local fallback:', error.message)
      return getLocalTrips().filter(t => !t.deleted_at)
    }

    const trips = (data ?? []) as Trip[]
    saveLocalTrips(trips)
    return trips
  } catch (err) {
    console.warn('fetchTrips fallback to local storage:', err)
    return getLocalTrips().filter(t => !t.deleted_at)
  }
}

export async function insertTrip(input: TripInput): Promise<Trip> {
  const payload = {
    name: input.name,
    notes: input.notes ?? null,
    priority: input.priority ?? 1,
    place_ids: input.place_ids ?? [],
    target_date: input.target_date ?? null,
  }

  try {
    const { data, error } = await supabase
      .from('trips')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    const trip = data as Trip
    const local = getLocalTrips().filter(t => t.id !== trip.id)
    saveLocalTrips([trip, ...local])
    return trip
  } catch (err) {
    console.warn('insertTrip fallback to local storage:', err)
    const localTrip: Trip = {
      id: `local-trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: payload.name,
      notes: payload.notes,
      priority: payload.priority,
      place_ids: payload.place_ids,
      target_date: payload.target_date,
      deleted_at: null,
      created_at: new Date().toISOString(),
    }
    const local = getLocalTrips()
    saveLocalTrips([localTrip, ...local])
    return localTrip
  }
}

export async function updateTrip(id: string, updates: Partial<TripInput>): Promise<Trip> {
  try {
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    if (!data || data.length === 0) throw new Error('Trip not found')
    const trip = data[0] as Trip
    const local = getLocalTrips().map(t => (t.id === id ? trip : t))
    saveLocalTrips(local)
    return trip
  } catch (err) {
    console.warn('updateTrip fallback to local storage:', err)
    const local = getLocalTrips()
    const existing = local.find(t => t.id === id)
    if (!existing) throw new Error('Trip not found')
    const updated: Trip = {
      ...existing,
      ...updates,
    }
    saveLocalTrips(local.map(t => (t.id === id ? updated : t)))
    return updated
  }
}

export async function softDeleteTrip(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('trips')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.warn('softDeleteTrip fallback to local storage:', err)
  }
  const local = getLocalTrips().map(t => (t.id === id ? { ...t, deleted_at: new Date().toISOString() } : t))
  saveLocalTrips(local)
}

export async function addPlaceToTrip(trip: Trip, placeId: string): Promise<Trip> {
  if (trip.place_ids.includes(placeId)) return trip
  const updatedPlaceIds = [...trip.place_ids, placeId]
  return updateTrip(trip.id, { place_ids: updatedPlaceIds })
}

export async function removePlaceFromTrip(trip: Trip, placeId: string): Promise<Trip> {
  const updatedPlaceIds = trip.place_ids.filter(id => id !== placeId)
  return updateTrip(trip.id, { place_ids: updatedPlaceIds })
}
