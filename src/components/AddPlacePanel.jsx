import { useEffect } from 'react'
import { useState } from 'react'
import { MapPin, Link, StickyNote, Search, Loader, X, Pencil, Calendar, CheckCircle2, RotateCcw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { geocodePlace } from '../lib/geocode'

// Coral marker — matches the main map style, slightly smaller
const previewIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#FF6B6B;width:22px;height:22px;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
})

// Flies to the new coords whenever lat/lng change (MapContainer ignores prop updates)
function MiniMapController({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 15)
  }, [lat, lng]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function LocationPreview({ resolved, onReset }) {
  const { lat, lng, formattedAddress } = resolved

  return (
    <div className="location-preview">
      <div className="location-preview-map">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <MiniMapController lat={lat} lng={lng} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lng]} icon={previewIcon} />
        </MapContainer>
      </div>
      <div className="location-preview-body">
        <div className="location-preview-status">
          <CheckCircle2 size={14} />
          <span>Location found</span>
        </div>
        <p className="location-preview-address">{formattedAddress}</p>
        <button type="button" className="location-preview-reset" onClick={onReset}>
          <RotateCcw size={11} /> Not right? Search again
        </button>
      </div>
    </div>
  )
}

export default function AddPlacePanel({ onAdd, onUpdate, onClose, editPlace, cityName, stateName, countryCode, initialQuery }) {
  const isEditing = !!editPlace
  const [name, setName] = useState(editPlace?.name || '')
  const [searchQuery, setSearchQuery] = useState(editPlace?.address || initialQuery || '')
  const [notes, setNotes] = useState(editPlace?.notes || '')
  const [sourceUrl, setSourceUrl] = useState(editPlace?.source_url || '')
  const [dateFrom, setDateFrom] = useState(editPlace?.date_from || '')
  const [dateTo, setDateTo] = useState(editPlace?.date_to || '')
  const [status, setStatus] = useState('idle') // idle | searching | saving | error
  const [errorMsg, setErrorMsg] = useState('')
  const [resolved, setResolved] = useState(
    editPlace ? { lat: editPlace.lat, lng: editPlace.lng, formattedAddress: editPlace.address } : null
  )

  async function handleSearch(e) {
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
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!resolved || !name.trim()) return

    setStatus('saving')
    try {
      const data = {
        name: name.trim(),
        address: resolved.formattedAddress,
        lat: resolved.lat,
        lng: resolved.lng,
        notes: notes.trim(),
        source_url: sourceUrl.trim(),
        date_from: dateFrom || null,
        date_to: dateTo || null,
      }

      if (isEditing) {
        await onUpdate(editPlace.id, data)
      } else {
        await onAdd({ ...data, sourceUrl: sourceUrl.trim() })
      }

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
        {/* Step 1: find the location */}
        <form onSubmit={handleSearch} className="field-group">
          <label className="field-label">
            <Search size={14} /> {isEditing ? 'Change address or location' : 'Search address or place name'}
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

        {errorMsg && status === 'error' && !resolved && (
          <p className="error-msg" style={{ padding: '4px 20px 0' }}>{errorMsg}</p>
        )}

        {resolved && (
          <LocationPreview
            resolved={resolved}
            onReset={() => { setResolved(null); setSearchQuery('') }}
          />
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
            <div className="date-field">
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
                className="action-btn"
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
