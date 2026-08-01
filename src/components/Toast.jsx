import { RotateCcw, X } from 'lucide-react'

export default function Toast({ name, onUndo, onDismiss }) {
  return (
    <div className="toast" role="status">
      <span className="toast-message">Removed "{name}"</span>
      <button className="toast-undo" onClick={onUndo}>
        <RotateCcw size={14} /> Undo
      </button>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss" title="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
