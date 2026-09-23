import { motion } from 'framer-motion'
import KissIcon from '../KissIcon'
import Icon from './Icons'
import { getCategoryEmoji, getDishImage } from '../../lib/categoryIcons'

/**
 * 菜品行 —— 已接入：Menu / AdminDishes（Home 重排后用网格卡、Favorites 页已删除，
 * 不再需要菜品行副本）。
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
  onAccent = 'var(--color-on-dark)',
  showFav = false,
  className = '',
  vtName,
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
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onToggleFav(dish) }}
          aria-label={favorited ? '取消收藏' : '收藏'}
          aria-pressed={favorited}
          className="absolute top-2 right-[calc(var(--space-card-p)_+_4px)] z-20 w-11 h-11 rounded-full flex items-center justify-center glass"
        >
          <motion.span
            animate={favorited ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className={favorited ? 'text-[var(--color-love)]' : 'text-[var(--color-mist)]'}
          >
            <Icon name="heart" size={22} filled={favorited} strokeWidth={2} />
          </motion.span>
        </motion.button>
      )}

      <div
        className="d3-card-face p-3.5 flex items-center gap-3"
        style={{ padding: 'var(--space-card-p)' }}
      >
        {/* 缩略图：emoji 垫底，图片盖在上面；远程图挂了就露出 emoji（灌库菜多为外链图）。
            V3 设计稿：缩略图是"图鉴圆牌"——clay-soft 描边把菜从纸面上摘出来。 */}
        <div
          className="vt-dish-frame relative w-[70px] h-[70px] shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            viewTransitionName: vtName,
            borderRadius: 'var(--radius-tile)',
            border: '2px solid var(--color-clay-soft)',
            background: 'var(--plate-bg)',
          }}
        >
          <span className="text-3xl drop-shadow-sm">{emoji}</span>
          {image && (
            <img
              src={image}
              alt={dish.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-sans font-bold text-base text-[var(--color-bone)] truncate">
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
              <span className="font-serif text-lg font-bold text-[var(--color-caramel)] leading-tight tabular-nums">
                <span className="text-[0.7em] mr-px">¥</span>{dish.price}
              </span>
            </div>

            {variant === 'default' && onAdd && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { e.stopPropagation(); onAdd(dish, e) }}
                aria-label={addLabel || `添加${dish.name}`}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: accent,
                  border: '2px solid var(--clay-deep)',
                  boxShadow: '0 4px 12px rgba(43,36,41,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={onAccent} strokeWidth="2.8" strokeLinecap="round">
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
