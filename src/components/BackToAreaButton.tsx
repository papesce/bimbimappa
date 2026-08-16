import { ChevronLeft, X } from 'lucide-react';
import type { ViewingPlace } from '../types';

export interface BackToAreaButtonProps {
  viewingPlace: ViewingPlace | null;
  onViewArea: () => void;
  onDismissViewing: () => void;
  className?: string;
}

export default function BackToAreaButton({
  viewingPlace,
  onViewArea,
  onDismissViewing,
  className,
}: BackToAreaButtonProps) {
  if (!viewingPlace) return null;
  return (
    <div className={`map-reset-btn${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="map-reset-main"
        onClick={onViewArea}
        title="Back to area view"
      >
        <ChevronLeft size={16} /> Back to area
      </button>
      <span className="map-reset-divider" />
      <button
        type="button"
        className="map-reset-dismiss"
        onClick={onDismissViewing}
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
