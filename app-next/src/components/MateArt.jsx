/* 配角「小不点」：光滑蛋形 + 两根触角，无花边无角。
   与主角素材分开：这是矢量件，颜色走令牌，深色模式不留下奶油底方块。 */
export default function MateArt({ size = 120, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={(size * 110) / 80}
      viewBox="-40 -70 80 110"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M-14 -32q-8-14 1-20" />
      <path d="M14 -32q8-14-1-20" />
      <circle cx="-13" cy="-54" r="3.2" fill="var(--honey)" />
      <circle cx="13" cy="-54" r="3.2" fill="var(--honey)" />
      <ellipse rx="27" ry="33" fill="var(--card)" />
      <circle cx="-9" cy="-6" r="2.8" fill="currentColor" stroke="none" />
      <circle cx="9" cy="-6" r="2.8" fill="currentColor" stroke="none" />
      <ellipse cx="-17" cy="3" rx="5.5" ry="3.6" fill="var(--blush)" stroke="none" />
      <ellipse cx="17" cy="3" rx="5.5" ry="3.6" fill="var(--blush)" stroke="none" />
      <circle cx="0" cy="7" r="2.4" fill="var(--coral)" stroke="none" />
    </svg>
  )
}
