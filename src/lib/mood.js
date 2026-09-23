/* ============================================================
 * 批 6d · 今日心情（简化版：只切情话池，不改主题色 —— 避免破坏可读性/双人格恒定色板纪律）
 * ============================================================ */
const KEY = 'couple_order_mood_v1'

export const MOODS = [
  { key: 'happy',  label: '开心', emoji: '😊' },
  { key: 'hungry', label: '饿饿', emoji: '🤤' },
  { key: 'tired',  label: '疲惫', emoji: '😪' },
  { key: 'emo',    label: 'emo', emoji: '🥺' },
]

export function readMood() {
  const v = localStorage.getItem(KEY)
  return MOODS.some(m => m.key === v) ? v : null
}
export function writeMood(k) {
  if (!k) localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, k)
}
