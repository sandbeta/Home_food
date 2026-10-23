import Icon from './Icon.jsx'

export default function Stepper({ value, onChange, min = 1, max = 99, label = '份数' }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="stepper__btn"
        aria-label="少一份"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Icon name="minus" size={18} />
      </button>
      <span className="stepper__value" aria-live="polite">{value}</span>
      <button
        type="button"
        className="stepper__btn"
        aria-label="多一份"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}
