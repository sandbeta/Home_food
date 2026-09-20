// ============================================================
// 深夜食堂首页 —— 夜宵模式下的专属界面（App.jsx 按 isNight 分发挂载）。
// 与白天 Home 是两套版面：主推大卡「换一道」+ 宵夜网格一键加购 + 全店夜宵入口。
// 内容全部来自 nightPick 夜宵池；双人格/购物车/谁买单/收藏四大语义不动。
// 动效遵守 Vercel 规范：入场 opacity+≥0.9 scale 淡入、UI<300ms、按压 0.92。
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import SectionHeader from '../components/ui/SectionHeader'
import ThemeToggle from '../components/ui/ThemeToggle'
import { useCart } from '../components/CartContext'
import { nightPick } from '../lib/nightRules'
import { getCategoryEmoji, getDishImage } from '../lib/categoryIcons'
import { HERO_IMAGES } from '../theme/images'
import { contentEnter, cardEntrance, tapScale, usePrefersReducedMotion, EASE } from '../theme/motion'
import { pickOne, NIGHT_HOME_TITLES, NIGHT_HOME_NOTES } from '../lib/sweetCopy'
import { vibrate } from '../lib/sfx'

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function NightHome() {
  const [pool, setPool] = useState([])
  const [rotIdx, setRotIdx] = useState(0)
  const navigate = useNavigate()
  const { addItem } = useCart()
  const reduced = usePrefersReducedMotion()
  const [title] = useState(() => pickOne(NIGHT_HOME_TITLES))
  const [note] = useState(() => pickOne(NIGHT_HOME_NOTES))

  // 网格错峰：8 格作为「一排端上桌」整体逐格亮相（cardEntrance + 0.06 步进，
  // 基准 0.1 让区块标题先到、格子随后）；reduced 下去掉位移只留短淡入，反馈仍可读
  const cellEnter = (idx) => reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay: 0.1 + idx * 0.06 } }
    : cardEntrance(0.1 + idx * 0.06)

  useEffect(() => {
    fetch('/api/dishes?category=全部').then(r => r.json()).then(d => {
      setPool(shuffle(nightPick(d)))
    }).catch(() => {})
  }, [])

  const featured = pool.length ? pool[rotIdx % pool.length] : null
  const grid = useMemo(() => pool.filter(d => d.id !== featured?.id).slice(0, 8), [pool, featured])

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.home} variant="immersive" alt="深夜食堂" />
      <PageHeader title={title} subtitle={note} right={<ThemeToggle />} />

      <PageContainer>
        {/* 深夜主推 —— 深色锚点大卡，可手动换一道（夜宵界面不做自动轮换，安静陪吃） */}
        {featured && (
          <motion.div {...contentEnter(0.05)}>
            <SectionHeader
              title="深夜主推"
              action={
                <motion.button whileTap={tapScale} onClick={() => setRotIdx(i => i + 1)} className="text-xs text-[var(--color-clay)] font-bold">
                  换一道 →
                </motion.button>
              }
            />
            <div className="relative mt-3">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={featured.id}
                  initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.26, ease: EASE }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => navigate(`/dish/${featured.id}`)}
                  className="relative overflow-hidden cursor-pointer"
                  style={{ borderRadius: 'var(--radius-card)', background: 'var(--color-clay-gradient)', boxShadow: 'var(--shadow-4)' }}
                >
                  <div className="relative h-40 overflow-hidden flex items-center justify-center" style={{ background: 'rgba(255,253,249,0.16)' }}>
                    <div className="absolute w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,253,249,0.22), transparent 70%)' }} />
                    <span className="text-7xl relative">{getCategoryEmoji(featured.category)}</span>
                    {getDishImage(featured) && (
                      <img src={getDishImage(featured)} alt={featured.name} className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-3 px-5 pb-4 pt-3.5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase truncate" style={{ letterSpacing: '0.18em', color: 'rgba(255,253,249,0.78)' }}>
                        🌙 深夜 · {featured.category}
                      </p>
                      <p className="font-serif text-2xl font-bold text-[#FFFDF9] truncate mt-1">{featured.name}</p>
                      {featured.description && (
                        <p className="text-xs text-[rgba(255,253,249,0.82)] truncate mt-1">{featured.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <KissIcon className="w-4 h-4 text-[#FFFDF9]" />
                      <span className="font-serif text-2xl font-bold text-[#FFFDF9] tabular-nums"><span className="text-[0.7em] mr-0.5">¥</span>{featured.price}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* 宵夜网格：每格一键加购，不用进详情 */}
        {grid.length > 0 && (
          <motion.div {...contentEnter(0.1)}>
            <SectionHeader
              title="这些点得多"
              action={<button onClick={() => navigate('/menu?cat=夜宵')} className="text-xs text-[var(--color-clay)] font-bold">全店夜宵 →</button>}
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              {grid.map((dish, idx) => (
                <motion.div
                  key={dish.id}
                  {...cellEnter(idx)}
                  className="d3-card-face relative flex flex-col cursor-pointer"
                  style={{ padding: 'var(--space-card-p)' }}
                  onClick={() => navigate(`/dish/${dish.id}`)}
                >
                  <div className="relative h-16 rounded-xl overflow-hidden flex items-center justify-center mb-2.5"
                    style={{ background: 'linear-gradient(145deg, var(--color-ink-900), var(--color-ink-850))' }}>
                    <span className="text-3xl">{getCategoryEmoji(dish.category)}</span>
                    {getDishImage(dish) && (
                      <img src={getDishImage(dish)} alt={dish.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </div>
                  <p className="text-sm font-bold text-[var(--color-bone)] truncate">{dish.name}</p>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <div className="flex items-center gap-1 shrink-0">
                      <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
                      <span className="font-serif text-base font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.7em]">¥</span>{dish.price}</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={(e) => { e.stopPropagation(); addItem(dish); vibrate(12) }}
                      aria-label={`加购${dish.name}`}
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-lg font-bold text-[#FFFDF9]"
                      style={{ background: 'var(--color-clay)' }}
                    >
                      +
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </PageContainer>
    </div>
  )
}
