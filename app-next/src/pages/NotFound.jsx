import { Link } from 'react-router-dom'
import { LambImage } from '../components/LambImage.jsx'

export default function NotFound() {
  return (
    <div className="page page--top not-found">
      <LambImage pose="steal" className="not-found__art" alt="" />
      <p className="t-title">这条走道没连着厨房</p>
      <p className="t-note">地址不对，回今天看看吧。</p>
      <Link to="/today" className="btn btn--primary">回今天</Link>
    </div>
  )
}
