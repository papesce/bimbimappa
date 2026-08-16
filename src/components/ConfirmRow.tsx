import { Check, Trash2, X } from 'lucide-react'

export interface ConfirmRowProps {
  message?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'inline'
}

export default function ConfirmRow({ message = 'Remove this place?', confirmLabel = 'Remove', onConfirm, onCancel, variant = 'default' }: ConfirmRowProps) {
  if (variant === 'inline') {
    return (
      <button className="confirm-btn danger confirm-btn--block" onClick={onConfirm}>
        <Trash2 size={14} /> {confirmLabel}
      </button>
    )
  }
  return (
    <div className="confirm-row">
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
