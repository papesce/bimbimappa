import type L from 'leaflet';
import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

export interface AutoOpenPopupProps {
  markerRef: MutableRefObject<L.Marker | null>;
  isMobile: boolean;
  placeId: string;
  onMobilePopup: (placeId: string) => void;
}

// Auto-opens the popup for the newly added marker
export default function AutoOpenPopup({
  markerRef,
  isMobile,
  placeId,
  onMobilePopup,
}: AutoOpenPopupProps) {
  const didOpenRef = useRef(false);

  useEffect(() => {
    if (didOpenRef.current) return;
    didOpenRef.current = true;

    if (isMobile) {
      onMobilePopup(placeId);
    } else {
      if (markerRef.current) markerRef.current.openPopup();
    }
  }, [isMobile, markerRef, onMobilePopup, placeId]);
  return null;
}
