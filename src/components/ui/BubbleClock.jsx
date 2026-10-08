import { useState, useEffect } from 'react'
import { pad2, ymd } from '../../lib/dateKey'

/* ============================================================
 * BubbleClock · 实时时间糖牌（全站唯一的那块「现在几点」）
 * ------------------------------------------------------------
 * 此前它在 ClawMachine.jsx 与 PotReveal.jsx 里各写了一份，逐字节相同：
 * 同一个 30s setInterval、同一个 dateTime ISO、同一个「周几」取字法。
 * 娃娃机（夜宵轨）与蒸笼（白天轨）改一处忘另一处，表现就是两条轨的
 * 时钟走时精度/无障碍标签悄悄分叉。现在两边都吃这一份。
 *
 * 纪律：
 *  · visible=false（宵夜档不显示时钟）→ 定时器都不起，不是起了再隐藏。
 *  · 首帧用 lazy initializer 取时间，避免每次 render new Date()。
 *  · .claw-clock 的样式在 src/index.css，类名与 DOM 结构别动。
 * ============================================================ */
export default function BubbleClock({ visible = true }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!visible) return undefined
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [visible])
  if (!visible) return null
  const hh = pad2(now.getHours())
  const mm = pad2(now.getMinutes())
  return (
    <time className="claw-clock shrink-0" dateTime={`${ymd(now)}T${hh}:${mm}`} aria-label={`${now.getMonth() + 1}月${now.getDate()}日 ${hh}:${mm}`}>
      <span className="time">{hh}:{mm}</span>
      <span className="date">{now.getMonth() + 1}-{pad2(now.getDate())}<br />周{'日一二三四五六'[now.getDay()]}</span>
    </time>
  )
}
