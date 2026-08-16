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

export interface PlaceCardProps {
  place: Place;
  confirmingId: string | null;
  setConfirmingId: (id: string | null) => void;
  onLocate: (place: Place) => void;
  onDelete: (id: string) => void;
  onEdit: (place: Place) => void;
  onExplore: (place: Place) => void;
  onHoverPlace?: (id: string | null) => void;
  onAddToTrip?: (place: Place) => void;
}

export default function PlaceCard({
  place,
  confirmingId,
  setConfirmingId,
  onLocate,
  onDelete,
  onEdit,
  onExplore,
  onHoverPlace,
  onAddToTrip,
}: PlaceCardProps) {
  return (
    <li
      className="place-card"
      onMouseEnter={() => onHoverPlace?.(place.id)}
      onMouseLeave={() => onHoverPlace?.(null)}
    >
      <button
        type="button"
        className="place-card-body"
        onClick={() => onLocate(place)}
        title="Show on map"
      >
        <p className="place-name">
          {place.category && <CategoryBadge category={place.category} />}
          {place.visited && <VisitedBadge compact />}
          {toTitleCase(place.name)}
        </p>
        <p className="place-address">{place.address}</p>
        {place.photo_url && <img src={place.photo_url} alt="" className="place-card-photo" />}
        {place.date_from && (
          <p className="place-date">{formatDateRange(place.date_from, place.date_to)}</p>
        )}
        {(place.price_tier ||
          place.priority ||
          place.rating ||
          (place.amenities && place.amenities.length > 0)) && (
          <p className="place-metrics">
            {place.price_tier && (
              <span className="place-metric">{formatPriceTier(place.price_tier)}</span>
            )}
            {place.priority && (
              <span className="place-metric">{formatPriority(place.priority)}</span>
            )}
            {place.rating && <span className="place-metric">{formatRating(place.rating)}</span>}
            {place.amenities?.slice(0, 3).map(a => (
              <span key={a} className="place-metric">
                {formatAmenity(a)}
              </span>
            ))}
          </p>
        )}
        {place.notes && <p className="place-notes">"{place.notes}"</p>}
      </button>
      <div className="place-card-actions">
        <PlaceActions
          place={place}
          variant="menu"
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
          onDelete={onDelete}
          onEdit={onEdit}
          onExplore={onExplore}
          onAddToTrip={onAddToTrip}
        />
      </div>
    </li>
  );
}
