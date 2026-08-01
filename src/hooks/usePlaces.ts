import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  fetchPlaces as fetchPlacesService,
  insertPlace,
  softDeletePlace,
  restorePlace as restorePlaceService,
  updatePlace as updatePlaceService,
} from '../lib/placesService'
import type { Place, PlaceInput } from '../types'

/**
 * All DB operations for places.
 * Table shape (see schema.sql):
 *   id, name, address, lat, lng, notes, source_url, links, date_from, date_to, deleted_at, created_at
 */
export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlacesData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPlacesService()
      setPlaces(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPlacesData()

    // Realtime: any family member who adds a pin shows up immediately for others
    const channel = supabase
      .channel('places-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, fetchPlacesData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPlacesData])

  async function addPlace(input: PlaceInput): Promise<Place> {
    const data = await insertPlace(input)
    setPlaces((prev) => [data, ...prev])
    return data
  }

  const deletePlace = useCallback(async (id: string): Promise<void> => {
    await softDeletePlace(id)
    setPlaces((prev) => prev.filter((p) => p.id !== id))
  }, [])

  async function restorePlace(id: string): Promise<Place> {
    const data = await restorePlaceService(id)
    setPlaces((prev) => [data, ...prev.filter((p) => p.id !== id)])
    return data
  }

  async function updatePlace(id: string, updates: Partial<PlaceInput>): Promise<Place> {
    const data = await updatePlaceService(id, updates)
    setPlaces((prev) => prev.map((p) => (p.id === id ? data : p)))
    return data
  }

  return { places, loading, error, addPlace, deletePlace, restorePlace, updatePlace, refetch: fetchPlacesData }
}
