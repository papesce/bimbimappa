import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Trash2, ExternalLink, Pencil, Check, X } from 'lucide-react'

function MapController({ places, focusPlace, onFocusDone }) {
  const map = useMap()
  const hasFit = useRef(false)

  // Once places load for the first time, fit all markers in view
  useEffect(() => {
    if (hasFit.current || places.length === 0) return
    hasFit.current = true
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
  }, [places]) // eslint-disable-line react-hooks/exhaustive-deps

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

const newIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:36px;height:36px;">
      <div class="new-marker-ring"></div>
      <div style="
        background: #FF6B6B;
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 12px rgba(255,107,107,0.6);
        position: relative;
        z-index: 1;
      "></div>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -40],
})

// Auto-opens the popup for the newly added marker
function AutoOpenPopup({ markerRef }) {
  useEffect(() => {
    if (markerRef.current) markerRef.current.openPopup()
  }, [markerRef])
  return null
}

// Opens the popup for a place selected from the list, after fly-to completes
function PopupOpener({ markerRefs, popupPlaceId, onPopupDone }) {
  const map = useMap()
  useEffect(() => {
    const handler = () => {
      const ref = markerRefs.current[popupPlaceId]
      if (ref) ref.openPopup()
      onPopupDone()
    }
    map.once('moveend', handler)
    return () => map.off('moveend', handler)
  }, [popupPlaceId]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function Map({ places, onDelete, onEdit, focusPlace, onFocusDone, newPlaceId, popupPlaceId, onPopupDone }) {
  const [confirmingId, setConfirmingId] = useState(null)
  const markerRefs = useRef({})
  const defaultCenter = [-34.6037, -58.3816]
  const defaultZoom = 5

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      className="main-map"
    >
      <MapController places={places} focusPlace={focusPlace} onFocusDone={onFocusDone} />
      {popupPlaceId && (
        <PopupOpener
          markerRefs={markerRefs}
          popupPlaceId={popupPlaceId}
          onPopupDone={onPopupDone}
        />
      )}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {places.map((place) => {
        const isNew = place.id === newPlaceId
        return (
        <NewMarker
          key={place.id}
          place={place}
          icon={isNew ? newIcon : customIcon}
          isNew={isNew}
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
          onDelete={onDelete}
          onEdit={onEdit}
          markerRefs={markerRefs}
        />
        )
      })}
    </MapContainer>
  )
}

function NewMarker({ place, icon, isNew, confirmingId, setConfirmingId, onDelete, onEdit, markerRefs }) {
  const markerRef = useRef(null)

  useEffect(() => {
    markerRefs.current[place.id] = markerRef.current
    return () => { delete markerRefs.current[place.id] }
  })

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={icon}
    >
      {isNew && <AutoOpenPopup markerRef={markerRef} />}
      <Popup minWidth={220}>
        <div className="popup">
          <p className="popup-name">{place.name}</p>
          <p className="popup-address">{place.address}</p>
          {place.date_from && (
            <p className="popup-date">
              {new Date(place.date_from + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {place.date_to && place.date_to !== place.date_from
                ? `–${new Date(place.date_to + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : ''}
            </p>
          )}
          {place.notes && (
            <p className="popup-notes">"{place.notes}"</p>
          )}
          <div className="popup-actions">
            {place.source_url && (
              <a
                href={place.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="popup-action-link"
              >
                <ExternalLink size={12} /> Source
              </a>
            )}
            <button className="popup-action-btn" onClick={() => onEdit(place)}>
              <Pencil size={12} /> Edit
            </button>
            <button
              className={`popup-action-btn${confirmingId === place.id ? ' danger' : ''}`}
              onClick={() => setConfirmingId(confirmingId === place.id ? null : place.id)}
              style={{ marginLeft: 'auto' }}
              title="Remove"
            >
              <Trash2 size={12} />
            </button>
          </div>
          {confirmingId === place.id && (
            <div className="popup-confirm-row">
              <span>Remove?</span>
              <button
                className="popup-action-btn danger"
                onClick={() => { onDelete(place.id); setConfirmingId(null) }}
                title="Yes, remove"
              >
                <Check size={12} />
              </button>
              <button
                className="popup-action-btn"
                onClick={() => setConfirmingId(null)}
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
