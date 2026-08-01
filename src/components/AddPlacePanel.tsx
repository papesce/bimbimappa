import { useState } from 'react'
import { MapPin, Link, StickyNote, Search, Loader, X, Pencil, Calendar, CheckCircle2, RotateCcw, Plus } from 'lucide-react'
import { geocodePlace } from '../lib/geocode'
import { getLinks, inferLinkLabel } from '../lib/links'
import LocationPreview from './LocationPreview'
import type { GeoPoint, Place, PlaceInput, PlaceLink, ResolvedLocation, Status } from '../types'

export interface AddPlacePanelProps {
  onAdd?: (data: PlaceInput) => Promise<void>
  onUpdate?: (id: string, data: PlaceInput) => Promise<void>
  onClose: () => void
  editPlace?: Place | null
  cityName: string
  stateName: string
  countryCode: string
  initialQuery: string
  onShowInMap?: ((coords: GeoPoint) => void) | null
}

export default function AddPlacePanel({ onAdd, onUpdate, onClose, editPlace, cityName, stateName, countryCode, initialQuery, onShowInMap }: AddPlacePanelProps) {
  const isEditing = !!editPlace
  const [name, setName] = useState(editPlace?.name || '')
  const [searchQuery, setSearchQuery] = useState(editPlace?.address || initialQuery || '')
  const [notes, setNotes] = useState(editPlace?.notes || '')
  const [links, setLinks] = useState<PlaceLink[]>(() => {
    const existing = getLinks(editPlace)
    return existing.length > 0
      ? existing.map(l => ({
          id: l.id || crypto.randomUUID(),
          url: l.url,
          label: l.label || '',
          is_primary: !!l.is_primary,
        }))
      : []
  })
  const [dateFrom, setDateFrom] = useState(editPlace?.date_from || '')
  const [dateTo, setDateTo] = useState(editPlace?.date_to || '')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [changingAddress, setChangingAddress] = useState(false)
  const [resolved, setResolved] = useState<ResolvedLocation | null>(
    editPlace ? { lat: editPlace.lat, lng: editPlace.lng, formattedAddress: editPlace.address } : null
  )

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setStatus('searching')
    setErrorMsg('')
    setResolved(null)

    try {
      const geo = await geocodePlace(searchQuery, { region: countryCode })
      console.log('[Add] geocode:', searchQuery, '→', { city: cityName, state: stateName, countryCode, ...geo })
      setResolved(geo)
      if (!name) setName(searchQuery)
      setStatus('idle')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  function updateLink(id: string, patch: Partial<PlaceLink>) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  function handleUrlChange(id: string, url: string) {
    setLinks(prev => prev.map(l => {
      if (l.id !== id) return l
      const wasAuto = !l.label || l.label === inferLinkLabel(l.url)
      return { ...l, url, label: wasAuto ? inferLinkLabel(url) : l.label }
    }))
  }

  function setPrimary(id: string) {
    setLinks(prev => prev.map(l => ({ ...l, is_primary: l.id === id })))
  }

  function addLink() {
    setLinks(prev => [...prev, { id: crypto.randomUUID(), url: '', label: '', is_primary: prev.length === 0 }])
  }

  function removeLink(id: string) {
    setLinks(prev => {
      const next = prev.filter(l => l.id !== id)
      if (next.length > 0 && !next.some(l => l.is_primary)) {
        next[0] = { ...next[0], is_primary: true }
      }
      return next
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!resolved || !name.trim()) return

    setStatus('saving')
    try {
      const savedLinks = links
        .filter(l => l.url.trim())
        .map(l => ({
          id: l.id,
          url: l.url.trim(),
          label: l.label.trim() || inferLinkLabel(l.url.trim()),
          is_primary: l.is_primary,
        }))
      const hasPrimary = savedLinks.some(l => l.is_primary)
      const finalLinks = savedLinks.length > 0 && !hasPrimary
        ? savedLinks.map((l, i) => ({ ...l, is_primary: i === 0 }))
        : savedLinks

      const data: PlaceInput = {
        name: name.trim(),
        address: resolved.formattedAddress,
        lat: resolved.lat,
        lng: resolved.lng,
        notes: notes.trim(),
        links: finalLinks,
        date_from: dateFrom || null,
        date_to: dateTo || null,
      }

      if (isEditing) {
        await onUpdate!(editPlace.id, data)
      } else {
        await onAdd!(data)
      }

      setName('')
      setSearchQuery('')
      setNotes('')
      setLinks([])
      setResolved(null)
      setStatus('idle')
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{isEditing ? 'Edit place' : 'Add a place'}</h2>
        <div className="panel-header-right">
          {!isEditing && (
            <span className="step-indicator">
              Step {resolved ? '2' : '1'} of 2
            </span>
          )}
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="panel-body">
        <div className="panel-scroll-area">
          {isEditing && (
            <div className="location-summary">
              <div className="location-summary-main">
                <CheckCircle2 size={14} />
                <span className="location-summary-address">
                  {resolved?.formattedAddress || editPlace?.address}
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary small"
                onClick={() => {
                  if (changingAddress && !resolved && editPlace) {
                    setResolved({ lat: editPlace.lat, lng: editPlace.lng, formattedAddress: editPlace.address })
                  }
                  setChangingAddress(!changingAddress)
                }}
              >
                {changingAddress ? 'Cancel' : <><RotateCcw size={12} /> Change</>}
              </button>
            </div>
          )}

          {(!isEditing || changingAddress) && (
            <>
              {/* Step 1: find the location */}
              <form onSubmit={handleSearch} className="field-group">
                <label className="field-label">
                  <Search size={14} /> {isEditing ? 'Change address or location' : 'Search address or place name'}
                </label>
                <div className="input-row">
                  <div className="input-wrapper">
                    <input
                      className="input"
                      placeholder="e.g. Temaiken Zoo, Buenos Aires"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button type="button" className="input-clear" onClick={() => setSearchQuery('')} aria-label="Clear">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button className="btn-secondary" type="submit" disabled={status === 'searching'}>
                    {status === 'searching' ? <Loader size={14} className="spin" /> : 'Find'}
                  </button>
                </div>
              </form>

              {errorMsg && status === 'error' && !resolved && (
                <p className="error-msg" style={{ padding: '4px 20px 0' }}>{errorMsg}</p>
              )}

              {resolved && (
                <LocationPreview
                  resolved={resolved}
                  onReset={() => { setResolved(null); setSearchQuery('') }}
                  onShowInMap={onShowInMap}
                />
              )}
            </>
          )}

          {/* Step 2: fill in the details — locked until location is resolved */}
          <form
            id="details-form"
            onSubmit={handleSave}
            className={`field-group step-2${!resolved && !isEditing ? ' locked' : ''}`}
          >
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
            <Link size={14} /> Links <span className="optional">(optional — pick one as primary)</span>
          </label>
          {links.map((link) => (
            <div key={link.id} className="link-row">
              <input
                type="radio"
                name="primary-link"
                className="link-primary-radio"
                checked={!!link.is_primary}
                onChange={() => setPrimary(link.id)}
                title="Primary link"
                aria-label="Mark as primary link"
              />
              <div className="link-fields">
                <input
                  className="input"
                  placeholder="https://www.instagram.com/p/..."
                  value={link.url}
                  onChange={(e) => handleUrlChange(link.id, e.target.value)}
                  type="url"
                />
                <input
                  className="input link-label-input"
                  placeholder="Label (auto)"
                  value={link.label}
                  onChange={(e) => updateLink(link.id, { label: e.target.value })}
                />
              </div>
              <button
                className="action-btn"
                type="button"
                onClick={() => removeLink(link.id)}
                title="Remove link"
                aria-label="Remove link"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button className="btn-link-add" type="button" onClick={addLink}>
            <Plus size={14} /> Add another link
          </button>

          <label className="field-label" style={{ marginTop: '12px' }}>
            <Calendar size={14} /> Date <span className="optional">(optional — single day or range)</span>
          </label>
          <div className="input-row">
            <div className="date-field">
              <span className="date-field-label">From</span>
              <input
                className="input"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                aria-label="From date"
              />
            </div>
            <div className="date-field date-field--to">
              <span className="date-field-label">To</span>
              <input
                className="input"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                aria-label="To date"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                className="action-btn date-clear"
                type="button"
                onClick={() => { setDateFrom(''); setDateTo('') }}
                title="Clear dates"
              >
                <X size={14} />
              </button>
            )}
          </div>

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

          {errorMsg && resolved && <p className="error-msg">{errorMsg}</p>}
        </form>
        </div>
      </div>

      {/* Sticky footer — Save button always visible */}
      <div className="panel-footer">
        <button
          className="btn-primary"
          type="submit"
          form="details-form"
          disabled={!resolved || !name.trim() || status === 'saving'}
        >
          {status === 'saving' ? (
            <><Loader size={14} className="spin" /> {isEditing ? 'Updating…' : 'Saving…'}</>
          ) : (
            <>{isEditing ? <Pencil size={14} /> : <MapPin size={14} />} {isEditing ? 'Update' : 'Save to map'}</>
          )}
        </button>
      </div>
    </div>
  )
}
