export default function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      data-hit="44"
      onClick={() => onChange(!checked)}
    />
  )
}
