import { supabase } from './supabase'
import type { Place } from '../types'

export async function exportPlacesJson(): Promise<void> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const places = (data ?? []) as Place[]
  const json = JSON.stringify(places, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `family-fun-map-export-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}
