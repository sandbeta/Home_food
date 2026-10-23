/* 菜品插画：按分类选器型，按 id 选变体。
   只是装饰，不承载信息；无图菜与有图菜共用同一块视觉面积。 */

const KINDS = {
  家常菜: ['plate', 'bowl', 'skewer'],
  主食: ['bun', 'plate', 'bowl'],
  小吃: ['bun', 'cake', 'skewer'],
  汤类: ['bowl', 'cup'],
  饮品: ['cup'],
  硬菜: ['skewer', 'plate'],
  川菜: ['plate', 'skewer', 'bowl'],
  素菜: ['bowl', 'plate'],
  水果: ['cake', 'cup'],
  其他: ['plate', 'bowl'],
}

const FILL = {
  家常菜: 'var(--dish-warm)',
  主食: 'var(--dish-grain)',
  小吃: 'var(--dish-honey)',
  汤类: 'var(--dish-green)',
  饮品: 'var(--dish-blue)',
  硬菜: 'var(--dish-rose)',
  川菜: 'var(--dish-coral)',
  素菜: 'var(--dish-sage)',
  水果: 'var(--dish-pink)',
  其他: 'var(--dish-grain)',
}

function steam() {
  return (
    <g>
      <path d="M30 26q5-8 0-15" />
      <path d="M42 24q5-9 0-17" />
      <path d="M54 26q5-8 0-15" />
    </g>
  )
}

function Shape({ kind, f, v }) {
  if (kind === 'bowl') {
    return (
      <>
        <path d="M12 40h60q-4 30-30 30T12 40z" fill="var(--art-hi)" />
        <ellipse cx="42" cy="40" rx="30" ry="8" fill={f} />
        {v % 2 ? (
          <>
            <circle cx="34" cy="39" r="3.4" fill="var(--art-hi)" strokeWidth="2" />
            <circle cx="48" cy="41" r="3.4" fill="var(--dish-pink)" strokeWidth="2" />
          </>
        ) : null}
        <g className="dish-steam">{steam()}</g>
      </>
    )
  }
  if (kind === 'cup') {
    return (
      <>
        <path d="M24 22h36l-5 48q-1 7-13 7t-13-7z" fill={f} />
        <ellipse cx="42" cy="22" rx="18" ry="6" fill="var(--art-hi)" />
        <path d="M50 16l10-12" />
        {v % 2 ? (
          <>
            <circle cx="35" cy="56" r="4" fill="currentColor" stroke="none" />
            <circle cx="47" cy="60" r="4" fill="currentColor" stroke="none" />
            <circle cx="41" cy="48" r="4" fill="currentColor" stroke="none" />
          </>
        ) : (
          <path d="M28 40q14 8 28 0" />
        )}
      </>
    )
  }
  if (kind === 'skewer') {
    return (
      <>
        <path d="M14 66L70 22" />
        <circle cx="28" cy="55" r="10" fill={f} strokeWidth="2.4" />
        <circle cx="43" cy="44" r="10" fill="var(--dish-pink)" strokeWidth="2.4" />
        <circle cx="58" cy="33" r="10" fill={f} strokeWidth="2.4" />
        {v % 2 ? <path d="M25 52l6 6M40 41l6 6" strokeWidth="2" /> : null}
      </>
    )
  }
  if (kind === 'bun') {
    return (
      <>
        <path d="M14 60q0-32 28-32t28 32z" fill={f} />
        <path d="M14 60h56" />
        <path d="M28 44q14-10 28 0" />
        <path d="M34 34q8-6 16 0" strokeWidth="2.2" />
        {v % 2 ? <circle cx="42" cy="24" r="4" fill="var(--dish-coral)" strokeWidth="2.2" /> : null}
      </>
    )
  }
  if (kind === 'cake') {
    return (
      <>
        <path d="M16 68h52V42q-26-12-52 0z" fill={f} />
        <path d="M16 42q26-14 52 0" />
        <path d="M16 52q26 8 52 0" strokeWidth="2.2" />
        <circle cx="42" cy="30" r="6" fill="var(--dish-coral)" strokeWidth="2.4" />
        {v % 2 ? <path d="M42 24v-8" strokeWidth="2.4" /> : null}
      </>
    )
  }
  return (
    <>
      <ellipse cx="42" cy="52" rx="34" ry="15" fill="var(--art-hi)" />
      <ellipse cx="42" cy="49" rx="24" ry="10" fill={f} strokeWidth="2.4" />
      {v % 2 ? (
        <path d="M30 45q6-9 13-4 7-7 13 3" />
      ) : (
        <>
          <circle cx="34" cy="47" r="4" fill="var(--art-hi)" strokeWidth="2" />
          <circle cx="50" cy="49" r="4" fill="var(--dish-pink)" strokeWidth="2" />
        </>
      )}
      <path d="M62 30q6-8 2-14" strokeWidth="2.2" />
    </>
  )
}

export default function DishArt({ dish, size = 84, className = '' }) {
  const cat = dish?.category || '其他'
  const list = KINDS[cat] || KINDS.其他
  const kind = list[(Number(dish?.id) || 0) % list.length]
  const f = FILL[cat] || FILL.其他
  return (
    <svg
      className={`dish-art ${className}`}
      width={size}
      height={size}
      viewBox="0 0 84 84"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <Shape kind={kind} f={f} v={Number(dish?.id) || 0} />
    </svg>
  )
}
