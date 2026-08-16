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
      onMouseEnter={f.onHover ? () => f.onHover?.(true) : undefined}
      onMouseLeave={f.onHover ? () => f.onHover?.(false) : undefined}
    >
      {clickable ? (
        <button type="button" className="filter-chip-main" onClick={f.onRecenter}>
          <span className="filter-chip-label">{f.label}</span>
        </button>
      ) : (
        <span className="filter-chip-label">{f.label}</span>
      )}
      <button
        className="filter-chip-clear"
        onClick={(e) => { e.stopPropagation(); f.onHover?.(false); f.onClear() }}
        title={`Clear ${f.type} filter`}
        aria-label={`Clear ${f.type} filter`}
      >
        <X size={12} />
      </button>
    </div>
  )
}
