import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { NICKNAME, pickOne, HOME_NOTES } from '../lib/sweetCopy'
import KissIcon from '../components/KissIcon'

/*
 * 首页 · WeUI 设计语言试点
 * 克制扁平：#EDEDED 底 + 白色分组卡 + 0.5px 发丝线，系统字体，无阴影/渐变/弹跳动效。
 * 业务逻辑与晨光版完全一致：主推池带图优先、「换一道」原地轮换、常点网格随动、最近订单 3 条。
 */

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

const hideImg = (e) => { e.currentTarget.style.display = 'none' }
const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--color-weui-text3)" strokeWidth="1.5" strokeLinecap="round">
    <path d="m4.5 2 4 4-4 4" />
  </svg>
)

const SectHead = ({ title, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 4px 0' }}>
    <span className="weui-17 weui-medium weui-t1">{title}</span>
    {action}
  </div>
)
const linkBtn = { border: 'none', background: 'none', padding: 0, cursor: 'pointer' }

export default function Home() {
  const [recentOrders, setRecentOrders] = useState([])
  const [dishes, setDishes] = useState([])
  const [featIdx, setFeatIdx] = useState(0)
  const [sweetNote] = useState(() => pickOne(HOME_NOTES))
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => setRecentOrders(d.slice(0, 3)))
    fetch('/api/dishes?category=全部').then(r => r.json()).then(d => {
      // 主推大卡优先用带实拍图的菜；Fisher-Yates 无偏洗牌；新数据到来时轮换指针归零
      const shuf = (arr) => {
        const a = [...arr]
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[a[i], a[j]] = [a[j], a[i]]
        }
        return a
      }
      setDishes([...shuf(d.filter(x => getDishImage(x))), ...shuf(d.filter(x => !getDishImage(x)))])
      setFeatIdx(0)
    })
  }, [])

  const featured = dishes.length ? dishes[featIdx % dishes.length] : null
  const popular = dishes.length
    ? Array.from({ length: 6 }, (_, k) => dishes[(featIdx + 1 + k) % dishes.length])
    : []
  const fmtTime = (iso) => new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="weui-theme">
      <header className="weui-nav"><span className="weui-nav-title">晨光厨房</span></header>

      {/* 问候语：男朋友口吻，每次进入随机 */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="weui-17 weui-medium weui-t1">{getGreeting()}，{NICKNAME}</div>
        <div className="weui-14 weui-t2" style={{ marginTop: 2 }}>{sweetNote}</div>
      </div>

      <div style={{ padding: '8px 16px 76px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* 今日推荐 */}
        {featured && (
          <>
            <SectHead
              title="今日推荐"
              action={
                <button className="weui-link" style={linkBtn}
                  onClick={() => setFeatIdx(i => (i + 1) % Math.max(dishes.length, 1))}>
                  换一道
                </button>
              }
            />
            <div className="weui-group">
              <div
                style={{
                  height: 150, overflow: 'hidden', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-weui-press)',
                }}
              >
                <span style={{ fontSize: 48 }}>{getCategoryEmoji(featured.category)}</span>
                {getDishImage(featured) && (
                  <img
                    src={getDishImage(featured)} alt={featured.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={hideImg}
                  />
                )}
              </div>
              <div className="weui-cell" onClick={() => navigate(`/dish/${featured.id}`)} style={{ display: 'block' }}>
                <span style={{
                  fontSize: 10, color: 'var(--color-weui-green)',
                  border: '1px solid var(--color-weui-green)', borderRadius: 4, padding: '1px 4px',
                }}>
                  今日主推
                </span>
                <div className="weui-17 weui-medium weui-t1" style={{ marginTop: 4 }}>{featured.name}</div>
                <div className="weui-14 weui-t2" style={{ marginTop: 2 }}>{featured.description || '好吃的~'}</div>
                <div className="weui-17 weui-medium weui-t1" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ display: 'inline-flex', color: 'var(--color-weui-text2)' }}>
                    <KissIcon className="w-3.5 h-3.5" />
                  </span>
                  {featured.price}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 常点的 */}
        {popular.length > 0 && (
          <>
            <SectHead
              title="常点的"
              action={
                <button className="weui-link" style={linkBtn} onClick={() => navigate('/menu')}>全部</button>
              }
            />
            <div className="weui-group">
              {popular.map((dish) => (
                <div key={dish.id} className="weui-cell" onClick={() => navigate(`/dish/${dish.id}`)}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 4, overflow: 'hidden', flex: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                      background: 'var(--color-weui-press)',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{getCategoryEmoji(dish?.category)}</span>
                    {getDishImage(dish) && (
                      <img
                        src={getDishImage(dish)} alt={dish.name} loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={hideImg}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="weui-17 weui-t1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dish.name}</div>
                    <div className="weui-14 weui-t2" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dish.description || dish.category}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flex: 'none' }}>
                    <div className="weui-17 weui-medium weui-t1" style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                      <span style={{ display: 'inline-flex', color: 'var(--color-weui-text2)' }}>
                        <KissIcon className="w-3 h-3" />
                      </span>
                      {dish.price}
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}><Chevron /></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 最近订单 */}
        {recentOrders.length > 0 && (
          <>
            <SectHead
              title="最近订单"
              action={
                <button className="weui-link" style={linkBtn} onClick={() => navigate('/orders')}>全部</button>
              }
            />
            <div className="weui-group">
              {recentOrders.map((order) => (
                <div key={order.id} className="weui-cell" onClick={() => navigate(`/orders/${order.id}`)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="weui-17 weui-t1">订单 #{order.id}</div>
                    <div className="weui-14 weui-t2" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.items.map(i => `${i.dish_name}×${i.quantity}`).join('、')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flex: 'none' }}>
                    <div className="weui-17 weui-medium weui-t1">{order.total_price}</div>
                    <div className="weui-14 weui-t3" style={{ marginTop: 2 }}>{fmtTime(order.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
