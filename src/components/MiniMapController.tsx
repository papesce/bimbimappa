import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export interface MiniMapControllerProps {
  lat: number;
  lng: number;
}

// Flies to the new coords whenever lat/lng change (MapContainer ignores prop updates)
export default function MiniMapController({ lat, lng }: MiniMapControllerProps) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}
