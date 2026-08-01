import { X } from 'lucide-react'
import type { ActiveFilterChip } from '../types'

export interface FilterChipProps {
  f: ActiveFilterChip
}

export default function FilterChip({ f }: FilterChipProps) {
  const clickable = !!f.onRecenter
  return (
    <div
      className={`filter-chip filter-chip--${f.type}${clickable ? ' filter-chip--clickable' : ''}`}
      onClick={clickable ? f.onRecenter : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          f.onRecenter?.()
        }
      } : undefined}
      onMouseEnter={f.onHover ? () => f.onHover?.(true) : undefined}
      onMouseLeave={f.onHover ? () => f.onHover?.(false) : undefined}
    >
      <span className="filter-chip-label">{f.label}</span>
      <button className="filter-chip-clear" onClick={(e) => { e.stopPropagation(); f.onClear() }} title={`Clear ${f.type} filter`}>
        <X size={12} />
      </button>
    </div>
  )
}
