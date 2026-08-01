import { CATEGORIES } from '../lib/categories'
import type { PlaceCategory } from '../types'

export interface CategoryPickerProps {
  value: PlaceCategory | null
  onChange: (category: PlaceCategory | null) => void
}

export default function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="category-picker">
      {CATEGORIES.map(c => {
        const active = value === c.key
        const Icon = c.icon
        return (
          <button
            key={c.key}
            type="button"
            className={`category-chip${active ? ' active' : ''}`}
            onClick={() => onChange(active ? null : c.key)}
            title={c.label}
            aria-pressed={active}
          >
            <span className="category-chip-icon" style={{ background: c.color }}>
              <Icon size={13} strokeWidth={2.5} color="#fff" />
            </span>
            <span className="category-chip-label">{c.label}</span>
          </button>
        )
      })}
    </div>
  )
}
