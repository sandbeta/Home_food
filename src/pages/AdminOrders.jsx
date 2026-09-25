import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import AdminShell from '../components/ui/AdminShell'
import OrderCard from '../components/ui/OrderCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import Chip from '../components/ui/Chip'
import Icon from '../components/ui/Icons'
import PurchaseListSheet from '../components/PurchaseListSheet'
import { orderStatusOf, PERSONA } from '../theme/persona'
import { requestJson } from '../lib/request'

const STATUS_FILTERS = [
  /* 批 2c · 首位加"今日待做"档：他打开看板就是一屏看清今天要做的所有单 + 合并采购清单 */
  { value: '__today', label: '今日待做', icon: 'clock' },
  { value: '', label: '全部', icon: 'sparkles' },
  { value: 'pending', label: '等着呢', icon: 'clock' },
  /* 批 2a · 筛选扩到四档进行中：cutting / cooking / plating（preparing 归入 cooking 计数）*/
  { value: 'cutting', label: '切配中', icon: 'flame' },
  { value: 'cooking', label: '下锅了', icon: 'potBoil' },
  { value: 'plating', label: '装盘中', icon: 'check' },
  { value: 'completed', label: '做好啦', icon: 'check' },
]

const PAYER_LABEL = { aa: 'AA', me: '我请', partner: 'TA请' }

/* 批 2a · 推进链从两按钮扩到"当前 → 下一档"映射：
   pending → cutting → cooking → plating → completed
   preparing（旧别名）视为 cooking，走同一条路。
   管理端 quieter：去光晕与 hover 浮起，按钮以实底安静存在，反馈只留按压缩放；图标走统一细线集。
   正向纪律（B1 修，教训入 §4）：**任何压在人格渐变实底上的文字必须取 persona.on**
     · clay 实底 → var(--color-on-dark)（不反相暖白 #FFF9FC）
     · sage 实底 → var(--color-on-sage)（不反相深绿 #1A2417；bone 会反相 → 夜宵近白压浅绿仅 1.4:1）
   进行中三档（cutting/cooking/plating）都用 sage（TA 侧色），语义上都是"厨房正在动"；
   pending 用 clay（暖）表示"该我下厨了"，是唯一需要我主动做点什么的动作色。 */
const NEXT_STEP = {
  pending: { next: 'cutting', text: '开始做', icon: 'flame', gradient: PERSONA.me.gradient, color: 'var(--color-on-dark)' },
  cutting: { next: 'cooking', text: '下锅', icon: 'potBoil', gradient: 'linear-gradient(135deg, var(--color-sage-soft), var(--color-sage))', color: 'var(--color-on-sage)' },
  cooking: { next: 'plating', text: '装盘', icon: 'check', gradient: 'linear-gradient(135deg, var(--color-sage-soft), var(--color-sage))', color: 'var(--color-on-sage)' },
  plating: { next: 'completed', text: '做好了', icon: 'check', gradient: 'linear-gradient(135deg, var(--color-sage-soft), var(--color-sage))', color: 'var(--color-on-sage)' },
  /* 历史订单 status='preparing' 视为 cooking，走同一条推进链 */
  preparing: { next: 'plating', text: '装盘', icon: 'check', gradient: 'linear-gradient(135deg, var(--color-sage-soft), var(--color-sage))', color: 'var(--color-on-sage)' },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  /* 批 2c · 默认打开就是"今日待做"看板视图，最贴合"厨房打开后台想干嘛"的直觉 */
  const [filter, setFilter] = useState('__today')
  const [err, setErr] = useState('')
  const [purchaseOpen, setPurchaseOpen] = useState(false)

  const loadOrders = useCallback(() => {
    /* 批 2c · __today 特殊档：拉全表本地过滤（当天 created_at + status !== 'completed'），
       避免给两端加 ?status_in/未完结参数；家庭订单量 <百级，成本可忽略 */
    const url = filter && filter !== '__today' ? `/api/orders?status=${filter}` : '/api/orders'
    requestJson(url).then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) { setOrders([]); setLoading(false); return }
        if (filter === '__today') {
          const t = new Date().toDateString()
          setOrders(d.filter(o => o.status !== 'completed' && new Date(o.created_at).toDateString() === t))
        } else {
          setOrders(d)
        }
        setLoading(false); setErr('')
      })
      .catch(() => { setLoading(false); setErr('订单没加载出来，看看服务端开好了没') })
  }, [filter])

  useEffect(() => { loadOrders() }, [loadOrders])

  /* 批 2c · 今日采购清单扁平合并所有单的所有 items（同菜不同单也合并） */
  const todayPurchaseItems = useMemo(() => {
    if (filter !== '__today') return []
    const flat = []
    orders.forEach(o => (o.items || []).forEach(it => flat.push({ dish_id: it.dish_id, quantity: it.quantity, name: it.dish_name })))
    return flat
  }, [filter, orders])
  const todayDishCount = useMemo(() => new Set(todayPurchaseItems.map(i => i.dish_id)).size, [todayPurchaseItems])

  const handleStatusChange = async (id, s) => {
    try {
      await requestJson(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s }),
      })
      loadOrders()
    } catch (e) {
      // adminGate 正常工作时 401 已被门消化（重放成功走不到这里）；此分支只是兜底
      setErr(e && e.status === 401 ? '未通过管理验证' : '状态没推进成功，网络可能不稳，再点一次')
    }
  }

  return (
    <AdminShell title="厨房看板" subtitle={orders.length > 0 ? `${orders.length} 笔订单` : ''}>
      {/* 状态筛选 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            <Icon name={f.icon} size={16} strokeWidth={2.2} />
            {f.label}
          </Chip>
        ))}
      </div>

      {err && (
        <div role="alert"
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 mb-3"
          style={{
            borderRadius: 'var(--radius-ctl)',
            background: 'color-mix(in srgb, var(--color-danger) 10%, var(--surface))',
            border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)',
          }}>
          <span className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {err}</span>
          <button onClick={() => setErr('')} aria-label="关闭提示" className="text-xs font-bold shrink-0" style={{ color: 'var(--color-ash)' }}>知道了</button>
        </div>
      )}

      {/* 批 2c · 今日待做视图顶部：合并采购清单卡（点开弹 sheet + 一键复制到超市） */}
      {filter === '__today' && orders.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setPurchaseOpen(true)}
          className="w-full text-left flex items-center gap-3 mb-3 px-4 py-3"
          style={{
            background: 'var(--anchor-ink)',
            borderRadius: 'var(--radius-card)',
            border: '2px solid var(--clay-deep)',
            color: 'var(--color-on-dark)',
            boxShadow: 'var(--shadow-3)',
            minHeight: 44,
          }}
          aria-label={`打开今日采购清单，共 ${todayDishCount} 道菜`}
        >
          <span aria-hidden className="text-2xl shrink-0">🛒</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">今日采购清单</p>
            <p className="text-[11px] mt-0.5 opacity-90">
              {orders.length} 单 · 共 {todayDishCount} 道菜要备 · 点复制去超市
            </p>
          </div>
          <span aria-hidden className="text-lg shrink-0">›</span>
        </motion.button>
      )}

      {loading ? (
        <LoadingState emoji="👨‍🍳" />
      ) : orders.length === 0 ? (
        <EmptyState emoji={filter === '__today' ? '🍵' : '📋'}
          title={filter === '__today' ? '今天没单要忙' : '暂时没有订单'}
          desc={filter === '__today' ? '茶先泡上，等她点单再来' : '有新单会在这里出现'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-card-p)' }}>
          {orders.map((order) => {
            const status = orderStatusOf(order.status)
            const action = NEXT_STEP[order.status]
            return (
              <OrderCard
                key={order.id}
                order={order}
                status={{ ...status, bar: status.ring[1] }}
                variant="admin"
                showNote
                payerLabel={PAYER_LABEL[order.payer]}
                action={
                  action && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleStatusChange(order.id, action.next)}
                      className="px-3.5 min-h-[44px] text-xs font-bold flex items-center gap-1 shrink-0"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        background: action.gradient,
                        color: action.color,
                      }}
                    >
                      <Icon name={action.icon} size={15} strokeWidth={2.4} /> {action.text}
                    </motion.button>
                  )
                }
              />
            )
          })}
        </div>
      )}

      {/* 批 2c · 今日采购清单 sheet */}
      <PurchaseListSheet open={purchaseOpen} onClose={() => setPurchaseOpen(false)} items={todayPurchaseItems} />
    </AdminShell>
  )
}
