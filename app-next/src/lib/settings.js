const KEYS = {
  theme: 'lamb_theme',
  text: 'lamb_text',
  motion: 'lamb_motion',
  nickname: 'lamb_nickname',
  mood: 'lamb_mood',
}

function safeGet(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : v
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 隐私模式/配额满：只影响持久化，不影响本次会话 */
  }
}

export function readSettings() {
  const theme = safeGet(KEYS.theme, 'auto')
  const text = safeGet(KEYS.text, 'md')
  const motion = safeGet(KEYS.motion, 'auto')
  return {
    theme: ['auto', 'day', 'night'].includes(theme) ? theme : 'auto',
    text: text === 'lg' ? 'lg' : 'md',
    motion: motion === 'reduce' ? 'reduce' : 'auto',
    nickname: safeGet(KEYS.nickname, '我们') || '我们',
    mood: safeGet(KEYS.mood, '') || '',
  }
}

export function writeSetting(key, value) {
  const k = KEYS[key]
  if (!k) return
  safeSet(k, value)
}

export function isNightByClock(now = new Date()) {
  const h = now.getHours()
  return h >= 21 || h < 5
}

export function resolveTheme(theme, now = new Date()) {
  if (theme === 'day') return 'day'
  if (theme === 'night') return 'night'
  return isNightByClock(now) ? 'night' : 'day'
}

export function applyDocumentSettings(settings, now = new Date()) {
  const root = document.documentElement
  const theme = resolveTheme(settings.theme, now)
  root.dataset.theme = theme
  root.dataset.text = settings.text === 'lg' ? 'lg' : 'md'
  root.dataset.motion = settings.motion === 'reduce' ? 'reduce' : 'auto'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'night' ? '#2A1520' : '#FFF2E1')
  return theme
}

/** 今日心情：按天存，第二天自动回到未选 */
export function readTodayMood(dateKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.mood) || '{}')
    return raw && raw.date === dateKey && typeof raw.mood === 'string' ? raw.mood : ''
  } catch {
    return ''
  }
}

export function writeTodayMood(dateKey, mood) {
  safeSet(KEYS.mood, JSON.stringify({ date: dateKey, mood }))
}
