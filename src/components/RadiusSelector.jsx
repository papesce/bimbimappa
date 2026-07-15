export default function RadiusSelector({ value, onChange }) {
  return (
    <select
      className="radius-selector"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      <option value={25}>25 km</option>
      <option value={50}>50 km</option>
      <option value={100}>100 km</option>
      <option value={150}>150 km</option>
      <option value={200}>200 km</option>
    </select>
  )
}
