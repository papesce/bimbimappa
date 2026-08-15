import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MapController from './MapController'
import BackToAreaButton from './BackToAreaButton'
import BoundsTracker from './BoundsTracker'
import ClosePopupOnDrag from './ClosePopupOnDrag'
import PopupOpener from './PopupOpener'
import NewMarker from './NewMarker'
import SafariGestureGuard from './SafariGestureGuard'
import { makePlaceIcon, centerIcon } from '../lib/leafletIcons'
import type { GeoPoint, MapBounds, Place, ViewingPlace } from '../types'

export interface MapProps {
  places: Place[]
  focusPlaces: Place[]
  center: GeoPoint | null
  radius: number
  onDelete: (id: string) => void
  onEdit: (place: Place) => void
  focusPlace: GeoPoint | null
  onFocusDone: () => void
  newPlaceId: string | null
  popupPlaceId: string | null
  onPopupDone: () => void
  onViewportChange: (bounds: MapBounds) => void
  viewingPlace: ViewingPlace | null
  onViewArea: () => void
  onDismissViewing: () => void
  fitBoundsTrigger: number
  previewArea: GeoPoint | null
  onPreviewAreaDone: () => void
  suppressFit: number
  hoverRadiusKm: number | null
  boundsCenter: GeoPoint | null
  boundsRadius: number | null
  isMobile: boolean
  confirmingId: string | null
  setConfirmingId: (id: string | null) => void
  onMobilePopup: (placeId: string) => void
  hoverPlaceId: string | null
  onExplorePlace: (place: Place) => void
  onAddToTrip?: (place: Place) => void
}

function SearchCenterPopupContent({ radius }: { radius: number }) {
  const content = useMemo(() => (
    <div className="popup">
      <p className="popup-name">Search center</p>
      <p className="popup-address">{radius} km radius</p>
    </div>
  ), [radius])
  return content
}

export default function Map({ places, focusPlaces, center, radius, onDelete, onEdit, focusPlace, onFocusDone, newPlaceId, popupPlaceId, onPopupDone, onViewportChange, viewingPlace, onViewArea, onDismissViewing, fitBoundsTrigger, previewArea, onPreviewAreaDone, suppressFit, hoverRadiusKm, boundsCenter, boundsRadius, isMobile, confirmingId, setConfirmingId, onMobilePopup, hoverPlaceId, onExplorePlace, onAddToTrip }: MapProps) {
  const hovering = hoverRadiusKm !== null
  // confirmingId is lifted to App when mobile so BottomSheet can share it;
  // on desktop it arrives as null/undefined and we alias local names for clarity.
  const [localConfirmingId, setLocalConfirmingId] = useState<string | null>(null)
  const activeConfirmingId = isMobile ? confirmingId : localConfirmingId
  const setActiveConfirmingId = isMobile ? setConfirmingId : setLocalConfirmingId
  const [circleOpacity, setCircleOpacity] = useState(0)
  const circleFadeRef = useRef<number | null>(null)
  const markerRefs = useRef<Record<string, L.Marker | null>>({})
  const defaultCenter: [number, number] = [-34.6037, -58.3816]
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
          if (circleFadeRef.current) clearInterval(circleFadeRef.current)
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
      <MapController focusPlaces={focusPlaces} center={center} radius={radius} focusPlace={focusPlace} onFocusDone={onFocusDone} fitBoundsTrigger={fitBoundsTrigger} previewArea={previewArea} onPreviewAreaDone={onPreviewAreaDone} suppressFit={suppressFit} />
      <BoundsTracker onViewportChange={onViewportChange} />
      <ClosePopupOnDrag />
      <SafariGestureGuard />
      {popupPlaceId && (
        <PopupOpener
          markerRefs={markerRefs}
          popupPlaceId={popupPlaceId}
          onPopupDone={onPopupDone}
          isMobile={isMobile}
          onMobilePopup={onMobilePopup}
        />
      )}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center && (hovering || circleOpacity > 0) && (
        <Circle
          center={[center.lat, center.lng]}
          radius={(hoverRadiusKm ?? radius) * 1000}
          pathOptions={{
            color: '#4A90D9',
            fillColor: '#4A90D9',
            fillOpacity: hovering ? 0.15 : 0.12 * circleOpacity,
            opacity: hovering ? 0.8 : circleOpacity,
            weight: 2,
          }}
        />
      )}

      {!center && boundsCenter && hovering && (hoverRadiusKm != null || boundsRadius != null) && (
        <Circle
          center={[boundsCenter.lat, boundsCenter.lng]}
          radius={(hoverRadiusKm ?? boundsRadius ?? 0) * 1000}
          pathOptions={{
            color: '#4A90D9',
            fillColor: '#4A90D9',
            fillOpacity: 0.15,
            opacity: 0.8,
            weight: 2,
          }}
        />
      )}

      {center && (
        <Marker
            position={[center.lat, center.lng]}
            icon={centerIcon}
          >
            <Popup autoPanPaddingTopLeft={L.point(24, 96)} autoPanPaddingBottomRight={L.point(24, 24)}>
              <SearchCenterPopupContent radius={radius} />
            </Popup>
          </Marker>
      )}

      {places.map((place) => {
        const isNew = place.id === newPlaceId
        return (
        <NewMarker
          key={place.id}
          place={place}
          icon={makePlaceIcon(place.category, isNew ? 'new' : hoverPlaceId === place.id ? 'hover' : 'normal')}
          confirmingId={activeConfirmingId}
          setConfirmingId={setActiveConfirmingId}
          onDelete={onDelete}
          onEdit={onEdit}
          markerRefs={markerRefs}
          isMobile={isMobile}
          onMobilePopup={onMobilePopup}
          onExplorePlace={onExplorePlace}
          onAddToTrip={onAddToTrip}
        />
        )
      })}
      {!isMobile && <BackToAreaButton viewingPlace={viewingPlace} onViewArea={onViewArea} onDismissViewing={onDismissViewing} />}
    </MapContainer>
  )
}
