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
import { HERO_IMAGES } from '../theme/images'
import { orderStatusOf } from '../theme/persona'

const STATUS_FILTERS = [
  { value: '', label: '全部', emoji: '✨' },
  { value: 'pending', label: '等着呢', emoji: '⏳' },
  { value: 'preparing', label: '在做了', emoji: '👨‍🍳' },
  { value: 'completed', label: '做好啦', emoji: '🎉' },
]

/**
 * 订单列表 —— 复用 ui/OrderCard（与 AdminOrders 同源），带状态筛选。
 * （此前的手写订单卡副本已删除：改一次样式要同步两处的日子结束了）
 */
export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetch('/api/orders').then(r => r.json()).then(d => { setOrders(d); setLoading(false) }) }, [])

  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.orders} variant="immersive" alt="我们的订单" />

      <PageHeader title="我们的订单" subtitle={orders.length > 0 ? `一共 ${orders.length} 笔` : ''} />

      <PageContainer>
        {/* 状态筛选 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
              <span className="mr-1">{f.emoji}</span>
              {f.label}
            </Chip>
          ))}
        </div>

        {loading ? (
          <LoadingState emoji="📋" />
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="📋"
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
