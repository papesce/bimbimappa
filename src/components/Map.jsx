import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Trash2, ExternalLink, Pencil, Check, X } from 'lucide-react'

function MapController({ places, focusPlace, onFocusDone }) {
  const map = useMap()

  // On mount: fit all existing markers in view
  useEffect(() => {
    if (places.length === 0) return
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // On new/edited place: fly to it
  useEffect(() => {
    if (!focusPlace) return
    map.flyTo([focusPlace.lat, focusPlace.lng], 14)
    onFocusDone()
  }, [focusPlace]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// Fix Leaflet's broken default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const customIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: #FF6B6B;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
})

export default function Map({ places, onDelete, onEdit, focusPlace, onFocusDone }) {
  const [confirmingId, setConfirmingId] = useState(null)
  const defaultCenter = [-34.6037, -58.3816]
  const defaultZoom = 5

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <MapController places={places} focusPlace={focusPlace} onFocusDone={onFocusDone} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={customIcon}
        >
          <Popup minWidth={220}>
            <div style={{ fontFamily: 'system-ui, sans-serif' }}>
              <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 4px' }}>
                {place.name}
              </p>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px' }}>
                {place.address}
              </p>
              {place.notes && (
                <p style={{ fontSize: '13px', margin: '0 0 8px', fontStyle: 'italic' }}>
                  "{place.notes}"
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {place.source_url && (
                  <a
                    href={place.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#FF6B6B', textDecoration: 'none' }}
                  >
                    <ExternalLink size={12} /> Source
                  </a>
                )}
                <button
                  onClick={() => onEdit(place)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                >
                  <Pencil size={12} /> Edit
                </button>
                {confirmingId === place.id ? (
                  <>
                    <span style={{ fontSize: '12px', color: '#e05555', marginLeft: 'auto' }}>Remove?</span>
                    <button
                      onClick={() => { onDelete(place.id); setConfirmingId(null) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05555', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px' }}
                      title="Yes, remove"
                    >
                      <Check size={12} /> Yes
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px' }}
                      title="Cancel"
                    >
                      <X size={12} /> No
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmingId(place.id)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
