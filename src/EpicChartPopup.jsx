export default function EpicChartPopup({
  visible,
  eyebrow,
  title,
  value,
  description,
  position = 'right',
}) {
  return (
    <div className={`epic-popup epic-popup-${position} ${visible ? 'show' : ''}`}>
      <div className="epic-popup-glow" />

      <span className="epic-popup-eyebrow">{eyebrow}</span>

      <h3>{title}</h3>

      {value && <div className="epic-popup-value">{value}</div>}

      <p>{description}</p>
    </div>
  )
}