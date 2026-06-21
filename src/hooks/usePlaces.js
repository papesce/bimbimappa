import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * All DB operations for places.
 * Table shape (see schema.sql):
 *   id, name, address, lat, lng, notes, source_url, created_at
 */
export function usePlaces() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPlaces = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setPlaces(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPlaces()

    // Realtime: any family member who adds a pin shows up immediately for others
    const channel = supabase
      .channel('places-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, fetchPlaces)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchPlaces])

  async function addPlace({ name, address, lat, lng, notes, sourceUrl }) {
    const { data, error } = await supabase
      .from('places')
      .insert([{ name, address, lat, lng, notes, source_url: sourceUrl }])
      .select()
      .single()

    if (error) throw new Error(error.message)
    setPlaces((prev) => [data, ...prev])
    return data
  }

  async function deletePlace(id) {
    const { error } = await supabase.from('places').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setPlaces((prev) => prev.filter((p) => p.id !== id))
  }

  return { places, loading, error, addPlace, deletePlace, refetch: fetchPlaces }
}
