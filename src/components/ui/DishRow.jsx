import { motion } from 'framer-motion'
import KissIcon from '../KissIcon'
import { getCategoryEmoji, getDishImage } from '../../lib/categoryIcons'

/**
 * 菜品行 —— 目标是取代各页的手写菜品副本。当前已接入：Menu / AdminDishes；
 * Home 待 P4 重排时接入（Favorites 页已删除，其功能并入 Menu）。
 *
 * variant:
 *  - 'default' 点菜场景：缩略图 + 名称/分类/描述 + 价格 + 加购按钮（可选收藏）
 *  - 'manage'  后台管理：缩略图 + 名称/分类 + 价格 + 操作区（actions）
 *
 * onAdd(dish, event) 会把原生事件透出，便于调用方做「+1 飘升粒子」之类的定位动效。
 */
export default function DishRow({
  dish,
  variant = 'default',
  favorited = false,
  onToggleFav,
  onAdd,
  addLabel,
  actions,
  onClick,
  accent = 'var(--color-clay-gradient)',
  showFav = false,
  className = '',
}) {
  const image = getDishImage(dish)
  const emoji = getCategoryEmoji(dish.category)

  return (
    <div
      className={`d3-card overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {showFav && onToggleFav && (
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); onToggleFav(dish) }}
          aria-label={favorited ? '取消收藏' : '收藏'}
          className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center text-base glass"
        >
          <motion.span
            animate={favorited ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {favorited ? '⭐' : '🤍'}
          </motion.span>
        </motion.button>
      )}

      <div
        className="d3-card-face p-3.5 flex items-center gap-3"
        style={{ padding: 'var(--space-card-p)' }}
      >
        {/* 缩略图：有图用图，无图用品类 emoji 占位 */}
        <div
          className="w-[70px] h-[70px] shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            borderRadius: 'var(--radius-lg)',
            background:
              'linear-gradient(145deg, var(--color-cream) 0%, var(--color-cream-dark) 50%, rgba(200,104,63,0.06) 100%)',
          }}
        >
          {image ? (
            <img src={image} alt={dish.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl drop-shadow-sm">{emoji}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-extrabold text-base text-[var(--color-bone)] truncate">
              {dish.name}
            </h3>
            <span className="badge-soft text-xs px-1.5 py-0.5 rounded-full font-bold text-[var(--color-ash)]">
              {dish.category}
            </span>
          </div>

          {variant === 'default' && dish.description && (
            <p className="text-sm text-[var(--color-ash)] mt-1 line-clamp-1 leading-relaxed">
              {dish.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-2.5 gap-2">
            <div className="flex items-center gap-1 shrink-0">
              <KissIcon className="w-3.5 h-3.5 text-[var(--color-love)]" />
              <span className="text-lg font-extrabold text-[var(--color-clay)] leading-tight tabular-nums">
                {dish.price}
              </span>
            </div>

            {variant === 'default' && onAdd && (
              <motion.button
                whileTap={{ scale: 0.82 }}
                whileHover={{ scale: 1.08 }}
                onClick={(e) => { e.stopPropagation(); onAdd(dish, e) }}
                aria-label={addLabel || `添加${dish.name}`}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: accent,
                  boxShadow: '0 4px 12px rgba(43,38,32,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </motion.button>
            )}

            {variant === 'manage' && actions && (
              <div className="flex gap-2 shrink-0">{actions}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
