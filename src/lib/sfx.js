// ============================================================
// 晨光厨房 · 音效中心（Web Audio 合成，零音频文件依赖）
// 原则：所有入口先过 enabled() 与 try/catch —— 浏览器不支持、用户关音效、
// 自动播放策略拦截，一律静默返回，绝不让音效问题影响主流程。
// ============================================================

const SFX_KEY = 'couple_order_sfx'
let ctx = null

function audio() {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    // iOS 的 AudioContext 常在用户手势外创建后处于 suspended，播前再推一把
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  } catch { return null }
}

export function sfxEnabled() {
  return localStorage.getItem(SFX_KEY) !== 'off'
}
export function setSfxEnabled(on) {
  localStorage.setItem(SFX_KEY, on ? 'on' : 'off')
}

function tone({ freq, dur = 0.08, type = 'sine', gain = 0.05, at = 0, slideTo }) {
  const ac = audio()
  if (!ac) return
  try {
    const t0 = ac.currentTime + at
    const osc = ac.createOscillator()
    const vol = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
    vol.gain.setValueAtTime(0.0001, t0)
    vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
    vol.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(vol).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  } catch { /* 静默降级 */ }
}

/** 滚动 tick：音高随档位爬升，形成"签筒里珠子滚动"的上行感 */
export function tick(step) {
  if (!sfxEnabled()) return
  tone({ freq: 420 + step * 26, dur: 0.045, type: 'triangle', gain: 0.035 })
}

/** 落定：C 大调三音琶号 + 收尾高八度"叮"，模拟摇出的清脆一声 */
export function settle() {
  if (!sfxEnabled()) return
  ;[523.25, 659.25, 783.99].forEach((f, i) =>
    tone({ freq: f, dur: 0.22, type: 'sine', gain: 0.06, at: i * 0.075 }))
  tone({ freq: 1567.98, dur: 0.16, type: 'sine', gain: 0.045, at: 0.3 })
}

/** 轻触反馈：极短的"哒"，加购/开关等微交互用 */
export function tap() {
  if (!sfxEnabled()) return
  tone({ freq: 660, dur: 0.05, type: 'triangle', gain: 0.03 })
}

/** 振动：触屏设备的物理反馈，不支持则静默（pattern 为 ms 数组或数字） */
export function vibrate(pattern = 14) {
  if (!sfxEnabled()) return
  try { navigator.vibrate?.(pattern) } catch { /* 静默 */ }
}
