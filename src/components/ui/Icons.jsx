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
  // 齿轮（设置/后台入口）
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
}

export default function Icon({ name, size = 22, strokeWidth = 2, className = '', style }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] || null}
    </svg>
  )
}
