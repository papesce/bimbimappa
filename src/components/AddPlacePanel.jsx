import { useState } from 'react'
import { MapPin, Link, StickyNote, Search, Loader, X } from 'lucide-react'
import { geocodePlace } from '../lib/geocode'

export default function AddPlacePanel({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [notes, setNotes] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle | searching | saving | error
  const [errorMsg, setErrorMsg] = useState('')
  const [resolved, setResolved] = useState(null) // { lat, lng, formattedAddress }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setStatus('searching')
    setErrorMsg('')
    setResolved(null)

    try {
      const geo = await geocodePlace(searchQuery)
      setResolved(geo)
      if (!name) setName(searchQuery)
      setStatus('idle')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!resolved || !name.trim()) return

    setStatus('saving')
    try {
      await onAdd({
        name: name.trim(),
        address: resolved.formattedAddress,
        lat: resolved.lat,
        lng: resolved.lng,
        notes: notes.trim(),
        sourceUrl: sourceUrl.trim(),
      })
      // Reset
      setName('')
      setSearchQuery('')
      setNotes('')
      setSourceUrl('')
      setResolved(null)
      setStatus('idle')
      onClose()
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Add a place</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {/* Step 1: find the location */}
      <form onSubmit={handleSearch} className="field-group">
        <label className="field-label">
          <Search size={14} /> Search address or place name
        </label>
        <div className="input-row">
          <input
            className="input"
            placeholder="e.g. Temaiken Zoo, Buenos Aires"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn-secondary" type="submit" disabled={status === 'searching'}>
            {status === 'searching' ? <Loader size={14} className="spin" /> : 'Find'}
          </button>
        </div>
      </form>

      {resolved && (
        <div className="resolved-badge">
          <MapPin size={13} />
          <span>{resolved.formattedAddress}</span>
        </div>
      )}

      {/* Step 2: fill in the details */}
      <form onSubmit={handleSave} className="field-group">
        <label className="field-label">
          <MapPin size={14} /> Place name
        </label>
        <input
          className="input"
          placeholder="What do you call this place?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="field-label" style={{ marginTop: '12px' }}>
          <Link size={14} /> Paste the Instagram / TikTok link <span className="optional">(optional)</span>
        </label>
        <input
          className="input"
          placeholder="https://www.instagram.com/p/..."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          type="url"
        />

        <label className="field-label" style={{ marginTop: '12px' }}>
          <StickyNote size={14} /> Notes <span className="optional">(optional)</span>
        </label>
        <textarea
          className="input textarea"
          placeholder="Good for toddlers, bring sunscreen, closed Mondays..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <button
          className="btn-primary"
          type="submit"
          disabled={!resolved || !name.trim() || status === 'saving'}
          style={{ marginTop: '16px' }}
        >
          {status === 'saving' ? (
            <><Loader size={14} className="spin" /> Saving…</>
          ) : (
            'Save to map'
          )}
        </button>
      </form>
    </div>
  )
}
