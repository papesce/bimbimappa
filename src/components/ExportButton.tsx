import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportPlacesJson } from '../lib/exportPlaces'

export default function ExportButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)

    try {
      await exportPlacesJson()
    } catch {
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
