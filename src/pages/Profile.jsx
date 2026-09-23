import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import ThemeToggle from '../components/ui/ThemeToggle'
import FullBleedHero from '../components/FullBleedHero'
import PageContainer from '../components/ui/PageContainer'
import StatCard from '../components/ui/StatCard'
import { HERO_IMAGES } from '../theme/images'
import { PERSONA } from '../theme/persona'
import { useCart } from '../components/CartContext'
import { useTheme } from '../theme/useTheme'
import { pickOne, PROFILE_TITLES, partnerBadge } from '../lib/sweetCopy'
import Icon from '../components/ui/Icons'
import LazySheep from '../components/ui/LazySheep'
import { requestJson } from '../lib/request'
import { nextAnniversary, anniversariesToday, formatAnniDate } from '../lib/anniversary'
import { PRESET_AVOIDS, readAvoids, writeAvoids } from '../lib/avoid'
import { readFridge } from '../lib/fridge'
import { computeAchievements, ACHIEVEMENTS } from '../lib/achievements'
import Chip from '../components/ui/Chip'

export default function Profile() {
  const [stats, setStats] = useState({ orders: 0, total: 0 })
  const [statsErr, setStatsErr] = useState('')
  const [reload, setReload] = useState(0)
  const [pageTitle] = useState(() => pickOne(PROFILE_TITLES))
  const { whoAmI, setWhoAmI } = useCart()
  const { isNight, toggle: toggleThemeMode } = useTheme()
  const persona = PERSONA[whoAmI]

  /* M-s3 修：以前 fetch('/api/orders') 无 catch/无 r.ok，服务端挂时停在 0 单/¥0 累计——
     看起来像"真的没数据"而不是加载失败。补 catch → 统计条下方一条错误提示。 */
  useEffect(() => {
    setStatsErr('')
    requestJson('/api/orders').then(r => r.json()).then(d => {
      if (!Array.isArray(d)) { setStatsErr('订单数据格式不对，再试一次'); return }
      setAllOrders(d)
      setStats({ orders: d.length, total: d.reduce((s, o) => s + (Number(o.total_price) || 0), 0) })
    }).catch(() => setStatsErr('订单没加载出来，看看服务端开好了没'))
  }, [reload])

  /* 批 1 新增 · 纪念日预览：拉列表 → 今日命中优先显示，否则显示下一个倒计时；无数据时引导去 Admin 添加 */
  const [anniversaries, setAnniversaries] = useState([])
  useEffect(() => {
    requestJson('/api/anniversaries').then(r => r.json()).then(d => setAnniversaries(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])
  const todayHit = anniversariesToday(anniversaries)[0] || null
  const nextHit = nextAnniversary(anniversaries)

  /* 批 4b 新增 · 忌口清单：设备级存 localStorage（家庭自用），Cart 提交前会扫一次 recipe.ingredients */
  const [avoids, setAvoids] = useState(() => readAvoids())
  const [avoidsOpen, setAvoidsOpen] = useState(false)
  const [customAvoid, setCustomAvoid] = useState('')
  const saveAvoids = (next) => { setAvoids(next); writeAvoids(next) }
  const toggleAvoid = (k) => {
    const next = avoids.includes(k) ? avoids.filter(x => x !== k) : [...avoids, k]
    saveAvoids(next)
    try { window.__cgAnnounce?.(`${avoids.includes(k) ? '取消' : '添加'}忌口：${k}`) } catch {}
  }
  const addCustom = () => {
    const v = customAvoid.trim()
    if (!v || avoids.includes(v)) { setCustomAvoid(''); return }
    saveAvoids([...avoids, v]); setCustomAvoid('')
  }

  /* 批 6b · 成就：拉一次全表算徽章（与 stats 共用一份数据） */
  const [allOrders, setAllOrders] = useState([])
  const achievements = useMemo(() => computeAchievements(allOrders), [allOrders])
  const unlockedCount = ACHIEVEMENTS.filter(a => achievements[a.key]?.unlocked).length

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.profile} variant="immersive" alt="我的" />

      <PageHeader title={pageTitle} right={<ThemeToggle />} />

      <PageContainer>
        {/* 身份卡 - 点头像切换 🐱/🐑 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="d3-card-face text-center relative overflow-hidden"
          style={{ padding: 'calc(var(--space-card-p) * 1.5) var(--space-card-p)' }}
        >
          {/* 人格色光晕：随身份切换，呼应双人格温度对比 */}
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(closest-side, ${persona.chipBg}, transparent 72%)` }}
          />
          {/* B4 修：头像从 <motion.div onClick> 改成 <motion.button role=switch>，键盘可达；
              aria-checked 让读屏播报「美食家 开 / 另一半 关」等价语义；emoji 装饰 aria-hidden。 */}
          <motion.button
            type="button"
            className={`relative w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl cursor-pointer ${whoAmI === 'me' ? 'avatar-me is-active' : 'avatar-partner is-active'}`}
            style={{ boxShadow: persona.glow }}
            onClick={() => { const next = whoAmI === 'me' ? 'partner' : 'me'; setWhoAmI(next); try { window.__cgAnnounce?.(`已切换到${next === 'me' ? '美食家我' : '另一半TA'}身份`) } catch {} }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            role="switch"
            aria-checked={whoAmI === 'partner'}
            aria-label={`切换点菜身份，当前：${whoAmI === 'me' ? '我' : 'TA'}`}
          >
            <span aria-hidden="true">{persona.emoji}</span>
          </motion.button>
          <h2
            className="text-3xl font-bold font-serif leading-tight text-[var(--color-bone)]"
          >
            {whoAmI === 'me' ? '美食家（我）' : '另一半（TA）'}
          </h2>
          {whoAmI === 'partner' && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full"
              style={{
                background: PERSONA.partner.chipBg,
                border: '1px solid color-mix(in srgb, var(--sage-40) 45%, transparent)',
                color: PERSONA.partner.chipColor,
              }}
            >
              <LazySheep size={24} mood="happy" />
              <span className="text-xs font-bold">{partnerBadge(stats.orders)}</span>
            </motion.div>
          )}
          <p className="text-xs text-[var(--color-ash)] mt-1">点头像切换 🐱/🐑 身份</p>
        </motion.div>

        {/* 统计 */}
        <div className="flex gap-3">
          <StatCard value={stats.orders} label="订单总数" accent="var(--color-clay)" delay={0.1} />
          <StatCard value={stats.total} label="累计消费" accent="var(--color-caramel)" delay={0.16} prefix="¥" />
        </div>
        {statsErr && (
          <div role="alert"
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 mt-2"
            style={{
              borderRadius: 'var(--radius-ctl)',
              background: 'color-mix(in srgb, var(--color-danger) 10%, var(--surface))',
              border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)',
            }}>
            <span className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {statsErr}</span>
            <button onClick={() => setReload(r => r + 1)} aria-label="重新加载统计" className="text-xs font-bold shrink-0 min-h-[44px] px-3 rounded-full" style={{ color: 'var(--color-ash)' }}>再试一次</button>
          </div>
        )}

        {/* 批 1 新增 · 我们的日子（纪念日预览卡，管理入口走 Admin） */}
        <Link to="/admin/anniversaries"
          className="d3-card-face flex items-center gap-3 no-underline mt-3"
          style={{ padding: 'var(--space-card-p)', color: 'inherit' }}>
          <span aria-hidden
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{
              background: todayHit
                ? 'var(--anchor-ink)'
                : 'color-mix(in srgb, var(--clay-50) 12%, var(--surface))',
              color: todayHit ? 'var(--color-on-dark)' : 'var(--color-clay-text)',
              border: '2px solid var(--color-line)',
            }}>🎂</span>
          <div className="flex-1 min-w-0">
            {todayHit ? (
              <>
                <p className="text-sm font-bold text-[var(--color-bone)] truncate">今天是 · {todayHit.name}</p>
                <p className="text-xs text-[var(--color-ash)] mt-0.5">第 {todayHit.years + 1} 年 · {formatAnniDate(todayHit.date)}</p>
              </>
            ) : nextHit ? (
              <>
                <p className="text-sm font-bold text-[var(--color-bone)] truncate">下一个 · {nextHit.anniversary.name}</p>
                <p className="text-xs text-[var(--color-ash)] mt-0.5">还有 {nextHit.days} 天 · {formatAnniDate(nextHit.anniversary.date)}</p>
              </>
            ) : anniversaries.length === 0 ? (
              <>
                <p className="text-sm font-bold text-[var(--color-bone)]">还没记下我们的日子</p>
                <p className="text-xs text-[var(--color-ash)] mt-0.5">点这里，从今天开始数</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-[var(--color-bone)]">我们的日子</p>
                <p className="text-xs text-[var(--color-ash)] mt-0.5">点管理</p>
              </>
            )}
          </div>
          <span aria-hidden className="text-lg text-[var(--color-ash)]">›</span>
        </Link>

        {/* 批 3a 新增 · 厨房日历入口（月历视图回看每天吃了啥） */}
        <Link to="/calendar"
          className="d3-card-face flex items-center gap-3 no-underline mt-3"
          style={{ padding: 'var(--space-card-p)', color: 'inherit' }}>
          <span aria-hidden
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--sage-40) 14%, var(--surface))',
              color: 'var(--color-sage)',
              border: '2px solid var(--color-line)',
            }}>📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-bone)]">我们的日历</p>
            <p className="text-xs text-[var(--color-ash)] mt-0.5">翻这本别册 · {stats.orders} 单记录</p>
          </div>
          <span aria-hidden className="text-lg text-[var(--color-ash)]">›</span>
        </Link>

        {/* 批 3b 新增 · 口味画像入口（五维雷达 + TOP5 最爱） */}
        <Link to="/taste"
          className="d3-card-face flex items-center gap-3 no-underline mt-3"
          style={{ padding: 'var(--space-card-p)', color: 'inherit' }}>
          <span aria-hidden
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--color-love) 14%, var(--surface))',
              color: 'var(--color-love)',
              border: '2px solid var(--color-line)',
            }}>🍲</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-bone)]">口味画像</p>
            <p className="text-xs text-[var(--color-ash)] mt-0.5">你最近爱吃什么 · 五维雷达</p>
          </div>
          <span aria-hidden className="text-lg text-[var(--color-ash)]">›</span>
        </Link>

        {/* 批 4c 新增 · 年度别册入口（可打印的年终总结） */}
        <Link to="/report"
          className="d3-card-face flex items-center gap-3 no-underline mt-3"
          style={{ padding: 'var(--space-card-p)', color: 'inherit' }}>
          <span aria-hidden
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{
              background: 'var(--anchor-ink)',
              color: 'var(--color-on-dark)',
              border: '2px solid var(--clay-deep)',
            }}>📖</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-bone)]">年度别册</p>
            <p className="text-xs text-[var(--color-ash)] mt-0.5">{new Date().getFullYear()} 年终总结 · 一键存 PDF</p>
          </div>
          <span aria-hidden className="text-lg text-[var(--color-ash)]">›</span>
        </Link>

        {/* 批 6a 新增 · 厨房冰箱入口（家庭"我们家有啥菜"） */}
        <Link to="/fridge"
          className="d3-card-face flex items-center gap-3 no-underline mt-3"
          style={{ padding: 'var(--space-card-p)', color: 'inherit' }}>
          <span aria-hidden
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--color-sage) 16%, var(--surface))',
              color: 'var(--color-sage)',
              border: '2px solid var(--color-line)',
            }}>🧊</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-bone)]">厨房冰箱</p>
            <p className="text-xs text-[var(--color-ash)] mt-0.5">采购清单自动划掉家里有的</p>
          </div>
          <span aria-hidden className="text-lg text-[var(--color-ash)]">›</span>
        </Link>

        {/* 批 4b 新增 · 忌口清单：预设 chips 多选 + 自定义输入；命中时 Cart 提交前温柔提示（不阻断） */}
        <div className="d3-card-face mt-3" style={{ padding: 'var(--space-card-p)' }}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setAvoidsOpen(v => !v)}
            className="w-full flex items-center gap-3 min-h-[44px] text-left"
            aria-expanded={avoidsOpen}
            aria-controls="avoid-panel"
          >
            <span aria-hidden
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--color-ember) 18%, var(--surface))',
                color: 'var(--color-ash)',
                border: '2px solid var(--color-line)',
              }}>🌿</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--color-bone)]">忌口清单</p>
              <p className="text-xs text-[var(--color-ash)] mt-0.5 truncate">
                {avoids.length === 0 ? '没设置 · 点这里勾选不吃的' : `${avoids.length} 项忌口：${avoids.slice(0, 4).join('、')}${avoids.length > 4 ? '…' : ''}`}
              </p>
            </div>
            <motion.span aria-hidden animate={{ rotate: avoidsOpen ? 90 : 0 }} transition={{ duration: 0.2 }}
              className="text-lg text-[var(--color-ash)]">›</motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {avoidsOpen && (
              <motion.div key="avoid-panel" id="avoid-panel"
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="overflow-hidden">
                <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                  <p className="text-xs text-[var(--color-ash)] mb-2">点选不吃什么 · Cart 提交前会温柔提示（不阻断）</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVOIDS.map(p => (
                      <Chip key={p.key} active={avoids.includes(p.key)} onClick={() => toggleAvoid(p.key)}>
                        {p.label}
                      </Chip>
                    ))}
                  </div>
                  {avoids.filter(k => !PRESET_AVOIDS.some(p => p.key === k)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {avoids.filter(k => !PRESET_AVOIDS.some(p => p.key === k)).map(k => (
                        <Chip key={k} active onClick={() => toggleAvoid(k)}>
                          {k} ×
                        </Chip>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <label htmlFor="avoid-custom" className="sr-only">自定义忌口</label>
                    <input id="avoid-custom" value={customAvoid} onChange={e => setCustomAvoid(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
                      placeholder="加一个自定义…" maxLength={8}
                      className="d3-input flex-1 px-3 py-2 text-sm min-h-[44px]"
                      style={{ borderRadius: 'var(--radius-btn)' }} />
                    <button onClick={addCustom} aria-label="添加自定义忌口"
                      className="d3-btn-sm px-3 py-2 text-xs font-bold min-h-[44px]">加</button>
                  </div>
                  {avoids.length > 0 && (
                    <button onClick={() => { saveAvoids([]); try { window.__cgAnnounce?.('忌口清单已清空') } catch {} }}
                      className="mt-3 text-xs font-bold text-[var(--color-ash)] min-h-[44px] px-2 -mx-2">清空全部</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 批 6b 新增 · 我的成就（12 枚徽章墙，从 orders 前端算） */}
        <div className="d3-card-face mt-3" style={{ padding: 'var(--space-card-p)' }}>
          <div className="flex items-baseline justify-between mb-2.5">
            <p className="text-sm font-bold text-[var(--color-bone)]">🏆 我的成就</p>
            <span className="font-serif font-bold tabular-nums" style={{ color: 'var(--color-clay-text)' }}>
              {unlockedCount}<span className="text-[var(--color-ash)] text-xs">/{ACHIEVEMENTS.length}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map(a => {
              const st = achievements[a.key]
              const unlocked = !!st?.unlocked
              return (
                <div key={a.key} title={unlocked ? `达成于 ${new Date(st.at).toLocaleDateString('zh-CN')}` : a.desc}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                  style={{
                    background: unlocked ? 'color-mix(in srgb, var(--color-sage) 14%, var(--surface))' : 'color-mix(in srgb, var(--color-ash) 6%, transparent)',
                    border: `2px solid ${unlocked ? 'color-mix(in srgb, var(--color-sage) 50%, transparent)' : 'var(--color-line)'}`,
                    opacity: unlocked ? 1 : 0.55,
                  }}
                >
                  <span aria-hidden className="text-2xl shrink-0" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: unlocked ? 'var(--color-bone)' : 'var(--color-ash)' }}>{a.title}</p>
                    <p className="text-[10px] truncate opacity-75" style={{ color: 'var(--color-ash)' }}>{a.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 入口列表 —— 收藏已并入点菜页，空壳项已删 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="d3-card-face overflow-hidden"
        >
          {/* 夜宵模式：深夜刷手机护眼，全站令牌反相 */}
          <div className="flex items-center gap-3" style={{ padding: 'var(--space-card-p)' }}>
            <span className="text-base w-5 text-center" aria-hidden>{isNight ? '🌙' : '☀️'}</span>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-[var(--color-bone)]">夜宵模式</span>
              <span className="block text-xs text-[var(--color-ash)] mt-0.5">深夜 21 点后自动开，也可手动切</span>
            </div>
            {/* M-t5 修：switch 视觉 w-12 h-7=48×28，触摸热区不达 44。
                保留视觉尺寸不变，用 py + 负 margin 撑热区到 ≥44（48×44）。 */}
            <motion.button
              onClick={toggleThemeMode}
              whileTap={{ scale: 0.92 }}
              role="switch"
              aria-checked={isNight}
              aria-label="切换夜宵模式"
              className="relative w-12 h-7 rounded-full shrink-0 transition-colors duration-300 my-[8px] -my-[8px] py-[8px]"
              style={{
                background: isNight ? 'var(--color-clay)' : 'color-mix(in srgb, var(--color-bone) 16%, transparent)',
                /* M-v6 修：原 rgba(0,0,0,0.12) 违反 The Warm Shadow Rule（暖墨阴影）；
                   改吃 --inset-warm-1 令牌，白天 rgba(43,36,41,0.12)、夜宵自动升到 0.42 保持可见。 */
                boxShadow: 'var(--inset-warm-1)',
              }}
            >
              <motion.span
                className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
                style={{ background: 'var(--color-on-dark)', boxShadow: 'var(--shadow-2)' }}
                animate={{ x: isNight ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <span aria-hidden="true">{isNight ? '🌙' : '☀️'}</span>
              </motion.span>
            </motion.button>
          </div>

          <div className="h-px mx-4" style={{ background: 'var(--color-glass-border)' }} />

          {/* B4 修：管理后台入口从 <motion.div onClick> 改成 <Link>，键盘可达；
              视觉与 tap 反馈保持（motion.button 内嵌 <a> 不合语义，直接 <Link>+ hover/tap 由 CSS 承担）。 */}
          <Link
            to="/admin"
            className="flex items-center gap-3 cursor-pointer no-underline focus-visible:outline focus-visible:outline-2"
            style={{ padding: 'var(--space-card-p)', color: 'inherit' }}
          >
            <Icon name="gear" size={20} style={{ color: 'var(--color-ash)' }} />
            <span className="flex-1 text-sm font-bold text-[var(--color-bone)]">管理后台</span>
            <span className="text-[var(--color-ash)] text-lg">›</span>
          </Link>
        </motion.div>
      </PageContainer>
    </div>
  )
}
