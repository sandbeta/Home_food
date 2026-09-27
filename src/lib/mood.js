/* ============================================================
 * 批 6d · 今日心情（原：只切情话文案，不改主题色 —— 避免破坏可读性/双人格恒定色板纪律）
 * 批 9 · 心情同时喂给娃娃机加权（见 clawPool.js 的 MOOD_WEIGHTS）：
 *   · 下面 key 即权重表的索引，改名要两处一起改；
 *   · 没有权重条目的 key（happy / hungry / emo）＝中性心情，抽取分布保持不变；
 *   · 主题色仍不动，理由同上（可读性纪律）。
 * ============================================================ */
const KEY = 'couple_order_mood_v1'

export const MOODS = [
  { key: 'happy',  label: '开心', emoji: '😊' },
  { key: 'hungry', label: '饿饿', emoji: '🤤' },
  { key: 'tired',  label: '想躺平', emoji: '😪' },
  { key: 'emo',    label: 'emo', emoji: '🥺' },
  { key: 'spicy',  label: '想吃辣', emoji: '🌶️' },
  { key: 'light',  label: '想清淡', emoji: '🥗' },
  { key: 'sweet',  label: '想来点甜', emoji: '🍮' },
]

/* 批3 修 P1：localStorage 全线包守卫——readMood 被两首页在 useState 初始化里同步调用，
   Safari 无痕/禁站点数据时 getItem 也 throw，原裸调用=首页挂载即崩到 ErrorBoundary。 */
export function readMood() {
  try {
    const v = localStorage.getItem(KEY)
    return MOODS.some(m => m.key === v) ? v : null
  } catch { return null }
}
export function writeMood(k) {
  try {
    if (!k) localStorage.removeItem(KEY)
    else if (MOODS.some(m => m.key === k)) localStorage.setItem(KEY, k)   // 写侧也校验枚举，杜绝写脏
  } catch { console.warn('[mood] 存储不可用，心情仅本次会话生效') }
}
