const OPTIONS = [1, 5, 10, 50, 100, 200]

export interface RadiusSelectorProps {
  value: number
  onChange: (km: number) => void
}

export default function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <div className="radius-pills">
      {OPTIONS.map((km) => (
        <button
          key={km}
          type="button"
          className={`radius-pill${value === km ? ' radius-pill--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); onChange(km) }}
        >
          {km}
        </button>
      ))}
    </div>
  )
}
