/**
 * 全站统一细线图标集（24 viewBox / stroke currentColor / 圆角端点），
 * 与既有 SVG 箭头、KissIcon 同一风格谱系，取代导航与快捷入口的 emoji。
 * 用法：<Icon name="home" size={22} />，颜色继承父级 currentColor。
 */
const PATHS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  // 碗 + 筷（点菜）
  menu: (
    <>
      <path d="M4 12a8 8 0 0 0 16 0H4z" />
      <path d="m9.5 8 8-5" />
      <path d="m13 7.5 8-2" />
    </>
  ),
  // 小票（订单）
  orders: (
    <>
      <path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.8-3.8 3.9-5.5 7.5-5.5s6.7 1.7 7.5 5.5" />
    </>
  ),
  // 火焰（热门）
  flame: (
    <>
      <path d="M12 3c1 3.5-2.5 4.8-2.5 8a2.5 2.5 0 0 0 5 0c0-1-.5-1.8-1-2.5 2.8 1 5 3.6 5 6.5a6.5 6.5 0 0 1-13 0C5.5 10 10 8 12 3z" />
    </>
  ),
  star: (
    <path d="m12 3 2.7 5.8 6.3.8-4.6 4.4 1.2 6.2L12 17.2 6.4 20.2l1.2-6.2L3 9.6l6.3-.8z" />
  ),
  // 心形（收藏）：outline 用 stroke，filled 用 fill（见 Icon 的 filled 参数）
  heart: (
    <path d="M12 20.7l-1.2-1.1C5.4 14.4 2 11.3 2 7.5 2 4.4 4.4 2 7.5 2c1.7 0 3.4.8 4.5 2.1C13.1 2.8 14.8 2 16.5 2 19.6 2 22 4.4 22 7.5c0 3.8-3.4 6.9-8.8 12.1L12 20.7z" />
  ),
  // 主题切换：夜宵月亮 / 白天太阳
  moon: (
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  // 声音开关：铃（响）/ 铃划掉（静音）
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  bellOff: (
    <>
      <path d="M6 9a6 6 0 0 1 9.5-4.9M18 11c0 3 2 4 2 4H6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
      <path d="M3 3l18 18" />
    </>
  ),
  // 自动轮换播放/暂停
  play: (
    <path d="M8 5.5v13l11-6.5z" />
  ),
  pause: (
    <>
      <path d="M9 5v14M15 5v14" />
    </>
  ),
  // 齿轮（设置/后台入口）
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  // —— 空态/加载态插画（EmptyState/LoadingState 专用，同一线规） ——
  // 空盘（购物车空态）
  emptyPlate: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" opacity="0.45" />
    </>
  ),
  // 懒羊羊 · TA 的吉祥物（圆脸 + 羊毛刘海 + 眯眼，细线同规）
  sheep: (
    <>
      <circle cx="12" cy="13.6" r="5.4" />
      <path d="M6.9 11.6a2.3 2.3 0 0 1 1.4-3.5 2.9 2.9 0 0 1 3.3-2.1 2.9 2.9 0 0 1 3.6 1.5 2.5 2.5 0 0 1 2.9 4.1" />
      <path d="M9.5 13.9q.8-1 1.6 0" />
      <path d="M12.9 13.9q.8-1 1.6 0" />
    </>
  ),
  // 熄火的灶与锅（订单空态：火已收，等下一单）
  stoveOff: (
    <>
      <rect x="6" y="9" width="12" height="7" rx="2" />
      <path d="M4 11.5h2M18 11.5h2" />
      <path d="M10.5 6.5 12 5l1.5 1.5" />
      <path d="M5 20h14" opacity="0.45" />
    </>
  ),
  // 水开的锅（加载态：锅沿冒泡）
  potBoil: (
    <>
      <rect x="6" y="12" width="12" height="6" rx="2" />
      <path d="M4 14h2M18 14h2" />
      <circle cx="10" cy="8.5" r="0.9" />
      <circle cx="13.5" cy="6.5" r="1.2" />
      <circle cx="16" cy="9" r="0.7" />
    </>
  ),
  // 星光（筛选「全部」）
  sparkles: (
    <>
      <path d="M11 3.5 12.6 7.4 16.5 9 12.6 10.6 11 14.5 9.4 10.6 5.5 9 9.4 7.4z" />
      <path d="M18 14.5 18.9 17 21.5 17.9 18.9 18.8 18 21.3 17.1 18.8 14.5 17.9 17.1 17z" opacity="0.85" />
    </>
  ),
  // 时钟（订单等待中）
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  // 对勾（完成 / 做好了）
  check: (
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  ),
}

export default function Icon({ name, size = 22, strokeWidth = 2, className = '', style, filled = false }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] || null}
    </svg>
  )
}
