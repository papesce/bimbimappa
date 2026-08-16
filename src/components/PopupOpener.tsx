import type L from 'leaflet';
import type { MutableRefObject } from 'react';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export interface PopupOpenerProps {
  markerRefs: MutableRefObject<Record<string, L.Marker | null>>;
  popupPlaceId: string;
  onPopupDone: () => void;
  isMobile: boolean;
  onMobilePopup: (placeId: string) => void;
}

// Opens the popup for a place selected from the list, after fly-to completes
export default function PopupOpener({
  markerRefs,
  popupPlaceId,
  onPopupDone,
  isMobile,
  onMobilePopup,
}: PopupOpenerProps) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      if (isMobile) {
        onMobilePopup(popupPlaceId);
      } else {
        const ref = markerRefs.current[popupPlaceId];
        if (ref) ref.openPopup();
      }
      onPopupDone();
    };
    map.once('moveend', handler);
    return () => {
      map.off('moveend', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupPlaceId, onMobilePopup, map.off, onPopupDone, markerRefs.current, map.once, isMobile]);
  return null;
}
