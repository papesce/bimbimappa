const OPTIONS = [25, 50, 100, 200]

export default function RadiusSelector({ value, onChange }) {
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
