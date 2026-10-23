import MateArt from './MateArt.jsx'

export default function EmptyState({ title, note, action = null }) {
  return (
    <div className="empty">
      <MateArt className="empty__art" size={132} />
      {title ? <p className="empty__title">{title}</p> : null}
      {note ? <p className="empty__note">{note}</p> : null}
      {action}
    </div>
  )
}
