import L from 'leaflet';
import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { formatDateRange } from '../lib/date';
import {
  formatAmenity,
  formatPriceTier,
  formatPriority,
  formatRating,
} from '../lib/placeAttributes';
import { toTitleCase } from '../lib/text';
import type { Place } from '../types';
import CategoryBadge from './CategoryBadge';
import PlaceActions from './PlaceActions';
import VisitedBadge from './VisitedBadge';

export interface NewMarkerProps {
  place: Place;
  icon: L.DivIcon;
  dimmed?: boolean;
  confirmingId: string | null;
  setConfirmingId: (id: string | null) => void;
  onDelete: (id: string) => void;
  onEdit: (place: Place) => void;
  markerRefs: MutableRefObject<Record<string, L.Marker | null>>;
  isMobile: boolean;
  onMobilePopup: (placeId: string) => void;
  onExplorePlace: (place: Place) => void;
  onAddToTrip?: (place: Place) => void;
}

export default function NewMarker({
  place,
  icon,
  dimmed,
  confirmingId,
  setConfirmingId,
  onDelete,
  onEdit,
  markerRefs,
  isMobile,
  onMobilePopup,
  onExplorePlace,
  onAddToTrip,
}: NewMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    markerRefs.current[place.id] = markerRef.current;
    return () => {
      delete markerRefs.current[place.id];
    };
  }, [markerRefs, place.id]);

  // Stable reference across re-renders: react-leaflet's Popup re-runs instance.update()
  // whenever props.children identity changes, which can feed an autopan -> moveend ->
  // setState -> re-render loop near the viewport edge (Safari).
  const popupContent = useMemo(() => {
    return (
      <div className="popup">
        <p className="popup-name">
          {place.category && <CategoryBadge category={place.category} />}
          {place.visited && <VisitedBadge compact />}
          {toTitleCase(place.name)}
        </p>
        <p className="popup-address">{place.address}</p>
        {place.photo_url && <img src={place.photo_url} alt="" className="popup-photo" />}
        {place.date_from && (
          <p className="popup-date">{formatDateRange(place.date_from, place.date_to)}</p>
        )}
        {(place.price_tier ||
          place.priority ||
          place.rating ||
          (place.amenities && place.amenities.length > 0)) && (
          <p className="popup-metrics">
            {place.price_tier && (
              <span className="popup-metric">{formatPriceTier(place.price_tier)}</span>
            )}
            {place.priority && (
              <span className="popup-metric">{formatPriority(place.priority)}</span>
            )}
            {place.rating && <span className="popup-metric">{formatRating(place.rating)}</span>}
            {place.amenities?.slice(0, 3).map(a => (
              <span key={a} className="popup-metric">
                {formatAmenity(a)}
              </span>
            ))}
          </p>
        )}
        <PlaceActions
          place={place}
          variant="inline"
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
          onDelete={onDelete}
          onEdit={onEdit}
          onExplore={onExplorePlace}
          onAddToTrip={onAddToTrip}
          notes={place.notes}
        />
      </div>
    );
  }, [place, confirmingId, setConfirmingId, onDelete, onEdit, onExplorePlace, onAddToTrip]);

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={icon}
      className={dimmed ? 'marker--dimmed' : undefined}
      eventHandlers={isMobile ? { click: () => onMobilePopup(place.id) } : undefined}
    >
      {!isMobile && (
        <Popup
          minWidth={240}
          closeButton={true}
          autoPanPaddingTopLeft={L.point(24, 96)}
          autoPanPaddingBottomRight={L.point(24, 24)}
        >
          {popupContent}
        </Popup>
      )}
    </Marker>
  );
}
