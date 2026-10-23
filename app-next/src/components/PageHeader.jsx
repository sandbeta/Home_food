import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function PageHeader({ title, sub, back = false, right = null, sticky = true }) {
  const navigate = useNavigate()
  return (
    <header className={sticky ? 'page-head' : 'page-head page-head--static'}>
      <div className="page-head__bar">
        {back ? (
          <button type="button" className="icon-btn" aria-label="返回" onClick={() => navigate(-1)}>
            <Icon name="back" size={22} />
          </button>
        ) : null}
        <div className="grow">
          <h1 className={`page-head__title ${back ? '' : 'page-head__title--lead'}`}>{title}</h1>
          {sub ? <p className="page-head__sub">{sub}</p> : null}
        </div>
        {right}
      </div>
    </header>
  )
}
