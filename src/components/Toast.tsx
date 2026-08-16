import { RotateCcw, X } from 'lucide-react';
import { toTitleCase } from '../lib/text';

export interface ToastProps {
  name: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function Toast({ name, onUndo, onDismiss }: ToastProps) {
  return (
    <div className="toast" role="status">
      <span className="toast-message">Removed "{toTitleCase(name)}"</span>
      <button type="button" className="toast-undo" onClick={onUndo}>
        <RotateCcw size={14} /> Undo
      </button>
      <button
        type="button"
        className="toast-close"
        onClick={onDismiss}
        aria-label="Dismiss"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
