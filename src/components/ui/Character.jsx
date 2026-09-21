import { CHARACTER } from '../../theme/characters'

/**
 * 角色徽记 —— 官方素材（public/lazy-assets/）的统一样式壳。
 *
 * 与自绘 `LazySheep` 的分工（V3 设计稿落地定的规矩，勿混用）：
 *  - 官方素材：大尺寸 / 静态肖像位（页头徽记、空态主图、下单庆祝、页尾探头）。
 *    素材自带配色（不继承 currentColor），故必须给"托底容器"（圆底或卡片）；
 *    深色底上抠图边缘可能带极淡奶白边，容器托住即可。
 *  - 自绘 LazySheep：小尺寸 + 需要表情状态的地方（购物车球 4 表情、加载陪等、
 *    灶边陪等、身份徽章 happy、App 骨架环 22px）——官方素材没有多表情，
 *    缩到 20–30px 也读不出是谁。
 *
 * @param who   CHARACTER 的 key
 * @param size  渲染边长 px（正方形盒 + object-contain；素材纵横比不一，靠盒统一 footprint）
 */
export default function Character({ who = 'badgeDay', size = 40, className = '', alt, style }) {
  const c = CHARACTER[who]
  if (!c) return null
  return (
    <img
      src={c.src}
      alt={alt || ''}
      aria-hidden={alt ? undefined : 'true'}
      draggable={false}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
    />
  )
}
