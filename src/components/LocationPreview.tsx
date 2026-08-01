import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { CheckCircle2, MapPin, RotateCcw } from 'lucide-react'
import { previewIcon } from '../lib/leafletIcons'
import MiniMapController from './MiniMapController'
import SafariGestureGuard from './SafariGestureGuard'
import type { GeoPoint, ResolvedLocation } from '../types'

export interface LocationPreviewProps {
  resolved: ResolvedLocation
  onReset: () => void
  onShowInMap?: ((coords: GeoPoint) => void) | null
}

export default function LocationPreview({ resolved, onReset, onShowInMap }: LocationPreviewProps) {
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
          <SafariGestureGuard />
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
        <div className="location-preview-actions">
          {onShowInMap && (
            <button type="button" className="location-preview-show" onClick={() => onShowInMap({ lat, lng })}>
              <MapPin size={11} /> Show area in map
            </button>
          )}
          <button type="button" className="location-preview-reset" onClick={onReset}>
            <RotateCcw size={11} /> Not right? Search again
          </button>
        </div>
      </div>
    </div>
  )
}
