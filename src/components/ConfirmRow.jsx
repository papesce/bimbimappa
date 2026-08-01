import { Check, X } from 'lucide-react'

export default function ConfirmRow({ message = 'Remove this place?', confirmLabel = 'Remove', onConfirm, onCancel, variant = 'default' }) {
  return (
    <div className={`confirm-row${variant === 'dense' ? ' confirm-row--dense' : ''}`}>
      <span className="confirm-message">{message}</span>
      <div className="confirm-actions">
        <button className="confirm-btn danger" onClick={onConfirm}>
          <Check size={14} /> {confirmLabel}
        </button>
        <button className="confirm-btn" onClick={onCancel}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  )
}
