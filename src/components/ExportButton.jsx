import { useState } from 'react'
import { Download } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ExportButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleExport() {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw new Error(fetchError.message)

      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const date = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `family-fun-map-export-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Export failed. Try again.')
      setTimeout(() => setError(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <span style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        onClick={handleExport}
        disabled={loading}
        title="Export JSON"
      >
        {loading
          ? <span className="spin" style={{ display: 'flex' }}><Download size={18} /></span>
          : <Download size={18} />}
      </button>
      {error && <span className="error-msg" style={{ position: 'absolute', top: '100%', right: 0, whiteSpace: 'nowrap' }}>{error}</span>}
    </span>
  )
}
