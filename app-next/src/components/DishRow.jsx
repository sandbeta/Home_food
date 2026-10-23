import DishThumb from './DishThumb.jsx'
import Icon from './Icon.jsx'
import { money } from '../lib/format.js'

export default function DishRow({ dish, onOpen, onAdd, flag = null, faved = false }) {
  const src = Boolean(dish?.image_url)
  return (
    <article className="dish-row">
      <button type="button" className="dish-row__main" onClick={() => onOpen?.(dish)} aria-label={`看 ${dish.name}`}>
        <span className={`dish-row__media${src ? ' has-photo' : ''}`}>
          <DishThumb dish={dish} size={58} />
        </span>
        <span className="dish-row__text">
          <span className="dish-row__name-line">
            <span className="dish-row__name">{dish.name}</span>
            {faved ? <Icon name="heart" size={13} fill className="dish-row__heart" /> : null}
          </span>
          {dish.description ? <span className="dish-row__desc t-clamp-2">{dish.description}</span> : null}
          <span className="dish-row__meta">
            <span className="price price--sm">{money(dish.price)}</span>
            {flag ? <span className={`tag ${flag.tone || ''}`}>{flag.label}</span> : null}
          </span>
        </span>
      </button>
      <button
        type="button"
        className="dish-row__add"
        aria-label={`加一份 ${dish.name}`}
        onClick={() => onAdd?.(dish)}
      >
        <Icon name="plus" size={20} strokeWidth={2.2} />
      </button>
    </article>
  )
}
