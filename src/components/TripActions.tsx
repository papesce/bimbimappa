import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDismissable } from '../hooks/useDismissable';
import type { Trip } from '../types';
import ConfirmRow from './ConfirmRow';

interface TripActionsProps {
  trip: Trip;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => Promise<void>;
}

export default function TripActions({ trip, onEditTrip, onDeleteTrip }: TripActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useDismissable<HTMLDivElement>(() => setOpen(false));

  return (
    <div ref={ref} className="place-actions place-actions--menu">
      <button
        type="button"
        className="action-btn place-actions-trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Trip actions"
        title="Trip actions"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="place-actions-menu">
          <div className="place-actions-menu-primary">
            <button
              type="button"
              className="place-action-btn"
              onClick={() => {
                setOpen(false);
                onEditTrip(trip);
              }}
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          <div className="place-actions-more">
            {confirming ? (
              <ConfirmRow
                message="Delete this trip?"
                confirmLabel="Delete"
                onConfirm={async () => {
                  await onDeleteTrip(trip.id);
                  setConfirming(false);
                  setOpen(false);
                }}
                onCancel={() => setConfirming(false)}
              />
            ) : (
              <button
                type="button"
                className="place-actions-row-link danger"
                onClick={() => setConfirming(true)}
              >
                <Trash2 size={14} /> <span className="place-actions-link-label">Delete trip</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
