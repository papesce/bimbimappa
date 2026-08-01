import { supabase } from './supabase'
import type { Place, PlaceInput } from '../types'

export async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Place[]
}

export async function insertPlace(input: PlaceInput): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .insert([input])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Place
}

export async function softDeletePlace(id: string): Promise<void> {
  const { error } = await supabase
    .from('places')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function restorePlace(id: string): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .update({ deleted_at: null })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Place
}

export async function updatePlace(id: string, updates: Partial<PlaceInput>): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Update failed — check that the UPDATE RLS policy is applied in Supabase')
  return data[0] as Place
}
