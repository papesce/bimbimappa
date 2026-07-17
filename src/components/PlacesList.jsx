import { useState, useEffect } from 'react'
import { MapPin, ExternalLink, Trash2, Pencil, Check, X, Navigation, Search, MoreVertical } from 'lucide-react'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'
import CitySearchInput from './CitySearchInput'

function toTitleCase(str) {
  if (!str) return str
  if (str === str.toUpperCase() && str !== str.toLowerCase()) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }
  return str
}

export default function PlacesList({ places, onDelete, onEdit, onLocate, activeFilter, cityName, radius, onRadiusChange, onCitySelect, onClear, viewingPlace }) {
  const [confirmingId, setConfirmingId] = useState(null)
  const [query, setQuery] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)

  useEffect(() => {
    if (!menuOpenId) return
    const close = () => setMenuOpenId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpenId])

  const q = query.trim().toLowerCase()
  const visible = q
    ? places.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      )
    : places

  const areaHeader = (
    <div className="area-controls">
      <CitySearchInput
        onCitySelect={onCitySelect}
        onClear={onClear}
        radius={radius}
        onRadiusChange={onRadiusChange}
        cityName={cityName}
        viewingPlace={viewingPlace}
        activeFilter={activeFilter}
      />
    </div>
  )

  if (places.length === 0) {
    const messages = {
      week: 'No places added this week.',
      month: 'No places added this month.',
    }
    return (
      <>
        {areaHeader}
        <div className="empty-state">
          <MapPin size={32} strokeWidth={1.5} />
          <p>{messages[activeFilter] || 'No places saved yet.'}</p>
          <p className="empty-sub">
            {activeFilter && activeFilter !== 'all'
              ? 'Try switching to "All" to see everything.'
              : 'Tap "Add place" to drop the first pin.'}
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      {areaHeader}
      <div className="search-bar">
        <Search size={14} className="search-icon" />
        <input
          className="search-input"
          type="search"
          placeholder="Search places…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      {visible.length === 0 && q && (
        <div className="empty-state">
          <Search size={28} strokeWidth={1.5} />
          <p>No results for "{query}"</p>
        </div>
      )}
    <ul className="places-list">
      {visible.map((place) => (
        <li key={place.id} className="place-card">
          <button
            className="place-card-body"
            onClick={() => onLocate(place)}
            title="Show on map"
          >
            <p className="place-name">{toTitleCase(place.name)}</p>
            <p className="place-address">{place.address}</p>
            {place.date_from && (
              <p className="place-date">
                {new Date(place.date_from + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {place.date_to && place.date_to !== place.date_from
                  ? `–${new Date(place.date_to + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : ''}
              </p>
            )}
            {place.notes && <p className="place-notes">"{place.notes}"</p>}
          </button>
          <div className="place-card-actions">
            <button
              className="action-btn locate"
              onClick={() => onLocate(place)}
              title="Show on map"
            >
              <Navigation size={14} />
            </button>
            <div className="card-menu-wrapper">
              <button
                className="action-btn"
                title="More actions"
                onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === place.id ? null : place.id) }}
              >
                <MoreVertical size={14} />
              </button>
              {menuOpenId === place.id && (
                <div className="card-menu" onClick={e => e.stopPropagation()}>
                  <a href={googleMapsUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="card-menu-item" onClick={() => setMenuOpenId(null)}>
                    <MapPin size={13} />Google Maps
                  </a>
                  <a href={wazeUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="card-menu-item" onClick={() => setMenuOpenId(null)}>
                    <Navigation size={13} />Waze
                  </a>
                  {place.source_url && (
                    <a href={place.source_url} target="_blank" rel="noopener noreferrer" className="card-menu-item" onClick={() => setMenuOpenId(null)}>
                      <ExternalLink size={13} />View source
                    </a>
                  )}
                  <button className="card-menu-item" onClick={() => { onEdit(place); setMenuOpenId(null) }}>
                    <Pencil size={13} />Edit
                  </button>
                  <div className="card-menu-divider" />
                  {confirmingId === place.id ? (
                    <div className="card-menu-confirm">
                      <span>Remove?</span>
                      <button className="card-menu-confirm-btn danger" onClick={() => { onDelete(place.id); setConfirmingId(null); setMenuOpenId(null) }}>
                        <Check size={12} />Yes
                      </button>
                      <button className="card-menu-confirm-btn" onClick={() => setConfirmingId(null)}>
                        <X size={12} />No
                      </button>
                    </div>
                  ) : (
                    <button className="card-menu-item danger" onClick={() => setConfirmingId(place.id)}>
                      <Trash2 size={13} />Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
    </>
  )
}
