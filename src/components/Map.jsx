import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Trash2, ExternalLink, Pencil, Check, X, Navigation, ChevronLeft } from 'lucide-react'
import { googleMapsUrl, wazeUrl } from '../lib/navigation'

function MapController({ focusPlaces, center, radius, focusPlace, onFocusDone, fitBoundsTrigger }) {
  const map = useMap()

  // Fit the camera to the full radius circle + any matched markers
  useEffect(() => {
    if (!center && focusPlaces.length === 0) return
    let bounds
    if (center) {
      const centerLatLng = L.latLng(center.lat, center.lng)
      bounds = centerLatLng.toBounds(radius * 2000)
    }
    if (focusPlaces.length > 0) {
      const markerBounds = L.latLngBounds(focusPlaces.map(p => [p.lat, p.lng]))
      bounds = bounds ? bounds.extend(markerBounds) : markerBounds
    }
    if (!bounds) return
    map.fitBounds(bounds, { padding: [48, 48] })
  }, [focusPlaces, center, radius, map]) // eslint-disable-line react-hooks/exhaustive-deps

  // Explicit refit triggered by "Back to area" button
  useEffect(() => {
    if (fitBoundsTrigger === 0) return
    let bounds
    if (center) {
      const centerLatLng = L.latLng(center.lat, center.lng)
      bounds = centerLatLng.toBounds(radius * 2000)
    }
    if (focusPlaces.length > 0) {
      const markerBounds = L.latLngBounds(focusPlaces.map(p => [p.lat, p.lng]))
      bounds = bounds ? bounds.extend(markerBounds) : markerBounds
    }
    if (bounds) map.fitBounds(bounds, { padding: [48, 48] })
  }, [fitBoundsTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  // On new/edited place: fly to it
  useEffect(() => {
    if (!focusPlace) return
    map.flyTo([focusPlace.lat, focusPlace.lng], 14)
    onFocusDone()
  }, [focusPlace, map, onFocusDone]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

function BackToAreaButton({ viewingPlace, onViewArea }) {
  if (!viewingPlace) return null
  return (
    <button className="map-reset-btn" onClick={onViewArea} title="Back to area view">
      <ChevronLeft size={16} /> Back to area
    </button>
  )
}

function BoundsTracker({ onViewportChange }) {
  const map = useMap()
  useMapEvents({
    moveend() {
      const b = map.getBounds()
      onViewportChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    },
  })
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

const centerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px;
    height: 28px;
    position: relative;
  ">
    <div style="
      position: absolute;
      top: 50%; left: 50%;
      width: 20px; height: 20px;
      margin: -10px 0 0 -10px;
      border: 2.5px solid #4A90D9;
      border-radius: 50%;
      background: rgba(74,144,217,0.15);
    "></div>
    <div style="
      position: absolute;
      top: 50%; left: 50%;
      width: 8px; height: 8px;
      margin: -4px 0 0 -4px;
      background: #4A90D9;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
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

export default function Map({ places, focusPlaces, center, radius, onDelete, onEdit, focusPlace, onFocusDone, newPlaceId, popupPlaceId, onPopupDone, onViewportChange, viewingPlace, onViewArea, fitBoundsTrigger }) {
  const [confirmingId, setConfirmingId] = useState(null)
  const [circleOpacity, setCircleOpacity] = useState(0)
  const circleFadeRef = useRef(null)
  const markerRefs = useRef({})
  const defaultCenter = [-34.6037, -58.3816]
  const defaultZoom = 5

  // Show circle at full opacity on city/radius change, then fade out
  useEffect(() => {
    if (!center) {
      setCircleOpacity(0)
      return
    }
    setCircleOpacity(1)

    const fadeTimer = setTimeout(() => {
      let opacity = 1
      circleFadeRef.current = setInterval(() => {
        opacity -= 0.05
        if (opacity <= 0) {
          setCircleOpacity(0)
          clearInterval(circleFadeRef.current)
        } else {
          setCircleOpacity(opacity)
        }
      }, 50)
    }, 2500)

    return () => {
      clearTimeout(fadeTimer)
      if (circleFadeRef.current) clearInterval(circleFadeRef.current)
    }
  }, [center?.lat, center?.lng, radius])

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      className="main-map"
    >
      <MapController focusPlaces={focusPlaces} center={center} radius={radius} focusPlace={focusPlace} onFocusDone={onFocusDone} fitBoundsTrigger={fitBoundsTrigger} />
      <BoundsTracker onViewportChange={onViewportChange} />
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

      {center && circleOpacity > 0 && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radius * 1000}
          pathOptions={{
            color: '#4A90D9',
            fillColor: '#4A90D9',
            fillOpacity: 0.12 * circleOpacity,
            opacity: circleOpacity,
            weight: 2,
          }}
        />
      )}

      {center && (
        <Marker
            position={[center.lat, center.lng]}
            icon={centerIcon}
          >
            <Popup>
              <div className="popup">
                <p className="popup-name">Search center</p>
                <p className="popup-address">{radius} km radius</p>
              </div>
            </Popup>
          </Marker>
      )}

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
      <BackToAreaButton viewingPlace={viewingPlace} onViewArea={onViewArea} />
    </MapContainer>
  )
}

function NewMarker({ place, icon, isNew, confirmingId, setConfirmingId, onDelete, onEdit, markerRefs }) {
  const markerRef = useRef(null)
  const [navOpen, setNavOpen] = useState(false)

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
            <div className="nav-wrapper">
              <button className="popup-action-btn" onClick={() => setNavOpen(!navOpen)}>
                <Navigation size={12} /> Directions
              </button>
              {navOpen && (
                <div className="nav-menu">
                  <a href={googleMapsUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="nav-menu-item" onClick={() => setNavOpen(false)}>Google Maps</a>
                  <a href={wazeUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="nav-menu-item" onClick={() => setNavOpen(false)}>Waze</a>
                </div>
              )}
            </div>
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
