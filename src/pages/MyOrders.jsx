import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import FullBleedHero from '../components/FullBleedHero'
import PageContainer from '../components/ui/PageContainer'
import OrderCard from '../components/ui/OrderCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import Chip from '../components/ui/Chip'
import Icon from '../components/ui/Icons'
import { HERO_IMAGES } from '../theme/images'
import { orderStatusOf } from '../theme/persona'
import { pickOne, ORDERS_TITLES, ORDERS_NOTES, RETRY_NOTES } from '../lib/sweetCopy'
import { requestJson } from '../lib/request'

// 修 P1-3：后台早已只产 cutting/cooking/plating，旧值 preparing 仅作历史别名——
// 用户侧「在做了」必须按集合匹配，否则新单在该档永远空列表（与 AdminOrders 词表同源四档）。
const DOING = ['preparing', 'cutting', 'cooking', 'plating']
const STATUS_FILTERS = [
  { value: '', label: '全部', icon: 'sparkles', match: null },
  { value: 'pending', label: '等着呢', icon: 'clock', match: ['pending'] },
  { value: 'doing', label: '在做了', icon: 'potBoil', match: DOING },
  { value: 'completed', label: '做好啦', icon: 'check', match: ['completed'] },
]

/**
 * 订单列表 —— 复用 ui/OrderCard（与 AdminOrders 同源），带状态筛选。
 * （此前的手写订单卡副本已删除：改一次样式要同步两处的日子结束了）
 * M-s3 修：以前 fetch 无 catch 无 r.ok，服务端挂/断网 → 无限转圈。
 *   走 requestJson（自带超时），catch 落 error 态 + 再试一次（对齐 AdminOrders 模式）。
 */
export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('')
  const [reload, setReload] = useState(0)
  const [pageTitle] = useState(() => pickOne(ORDERS_TITLES))
  const [pageNote] = useState(() => pickOne(ORDERS_NOTES))
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true); setErr('')
    requestJson('/api/orders').then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setLoading(false); setErr('订单没加载出来，看看服务端开好了没') })
  }, [reload])

  const activeFilter = STATUS_FILTERS.find((f) => f.value === filter)
  const filtered = activeFilter?.match ? orders.filter(o => activeFilter.match.includes(o.status)) : orders

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.orders} variant="immersive" alt="我们的订单" />

      <PageHeader title={pageTitle} subtitle={orders.length > 0 ? pageNote(orders.length) : ''} />

      <PageContainer>
        {/* 状态筛选 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
              <Icon name={f.icon} size={16} strokeWidth={2.2} />
              {f.label}
            </Chip>
          ))}
        </div>

        {loading ? (
          <LoadingState />
        ) : err ? (
          <EmptyState
            emoji="📡" tone="error"
            title="订单没加载出来"
            desc={pickOne(RETRY_NOTES)}
            action={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setReload(r => r + 1)}
                className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
              >再试一次</motion.button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            who="grass"
            title={filter ? '这个状态还没有订单' : '还没有下过单'}
            desc={filter ? '换个筛选看看吧~' : '快去一起选点好吃的吧~'}
            action={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => (filter ? setFilter('') : navigate('/menu'))}
                className="d3-btn d3-btn-primary px-8 py-3 text-sm font-bold"
              >
                {filter ? '看全部' : '去选菜'}
              </motion.button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-card-p)' }}>
            {filtered.map((order) => {
              const status = orderStatusOf(order.status)
              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  status={{ ...status, bar: status.ring[1] }}
                  variant="user"
                />
              )
            })}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
