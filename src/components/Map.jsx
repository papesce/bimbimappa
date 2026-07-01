import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Trash2, ExternalLink, Pencil } from 'lucide-react'

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

export default function Map({ places, onDelete, onEdit }) {
  // Default center: Buenos Aires. Will auto-fit if places exist.
  const defaultCenter = [-34.6037, -58.3816]
  const defaultZoom = places.length === 0 ? 5 : 10

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
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
                <button
                  onClick={() => onDelete(place.id)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
