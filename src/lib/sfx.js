// ============================================================
// 晨光厨房 · 音效中心（Web Audio 合成，零音频文件依赖）
// 原则：所有入口先过 enabled() 与 try/catch —— 浏览器不支持、用户关音效、
// 自动播放策略拦截，一律静默返回，绝不让音效问题影响主流程。
// ============================================================

const SFX_KEY = 'couple_order_sfx'
let ctx = null
let enabledCache = null   // 批3：一次同步读缓存（tick 连发不再每下打 localStorage）

export function sfxEnabled() {
  if (enabledCache == null) {
    try { enabledCache = localStorage.getItem(SFX_KEY) !== 'off' } catch { enabledCache = true }
  }
  return enabledCache
}
export function setSfxEnabled(on) {
  enabledCache = !!on
  try { localStorage.setItem(SFX_KEY, on ? 'on' : 'off') } catch { /* 无痕模式：本次会话内仍生效 */ }
}

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

/** 振动：触屏设备的物理反馈，不支持则静默（pattern 为 ms 数组或数字）。
 *  批3 修 P1：不再被"音效开关"拦——静音的用户照样该有触觉反馈（无障碍通道独立于音频通道）。 */
export function vibrate(pattern = 14) {
  try { navigator.vibrate?.(pattern) } catch { /* 静默 */ }
}

// ============================================================
// 抓娃娃机四声：电机 → 合爪 → 掉落 → 中奖，一条动作链各配一味音。
// 沿用 tone() 那套合成路子（零音频文件、全静默降级），音量都压得低，不抢 BGM。
// ============================================================

/** 小车电机嗡嗡：3~5 段 60~95Hz 的锯齿/三角接力推进，段间频率微抖模拟电机纹波。
 *  定位是背景音（gain 0.015），整段含 tone() 的 20ms 释放尾巴严格不越过 durationMs。 */
export function motor(durationMs = 400) {
  if (!sfxEnabled()) return
  try {
    // 入参兜底：过长截到 1.5s（防止 tick 卡住时一直嗡），过短按 90ms（三段接力至少要这点）
    const ms = Math.min(Math.max(Number(durationMs) || 400, 90), 1500)
    const total = ms / 1000
    const steps = total >= 0.42 ? 5 : total >= 0.3 ? 4 : 3
    const seg = (total - 0.02) / steps
    for (let i = 0; i < steps; i++) {
      const jitter = (((i * 7) % 5) - 2) * 3.5   // -7~+7Hz 失谐，听感是"颤"不是"平"
      tone({
        freq: 78 + jitter,                        // 71~85Hz，落在低频电机区
        dur: seg,
        type: i % 2 ? 'triangle' : 'sawtooth',    // 锯齿与三角交替，避免一路纯 buzz 太冲
        gain: 0.015,
        at: i * seg,
      })
    }
  } catch { /* 静默降级 */ }
}

/** 合爪"咔哒"：两记极短方波，先脆后闷、干脆不拖尾。
 *  300Hz 是爪叶咬合的那下脆响，隔 40ms 的 150Hz 是机构本体的闷响。 */
export function clank() {
  if (!sfxEnabled()) return
  try {
    tone({ freq: 300, dur: 0.03, type: 'square', gain: 0.05 })
    tone({ freq: 150, dur: 0.045, type: 'square', gain: 0.045, at: 0.04 })
  } catch { /* 静默降级 */ }
}

/** 盘子掉进出菜口"哐当"：三段式——坠落、砸盘、金属余音。
 *  400→100Hz 下滑是自由落体的失重感，0.13s 后 90Hz 方波砸在托盘上，
 *  再过 0.02s 的 700Hz 正弦是出菜口金属挡板被打了一下之后的余音。 */
export function chuteThud() {
  if (!sfxEnabled()) return
  try {
    tone({ freq: 400, slideTo: 100, dur: 0.12, type: 'triangle', gain: 0.035 })
    tone({ freq: 90, dur: 0.06, type: 'square', gain: 0.06, at: 0.13 })
    tone({ freq: 700, dur: 0.1, type: 'sine', gain: 0.03, at: 0.15 })
  } catch { /* 静默降级 */ }
}

/** 中奖小神曲：直接复用 settle() 的 C 大调琶音（=摇中那一声），
 *  尾巴上叠 2093Hz（C7）高八度长"叮"拉出庆祝感；最后一声 0.59s 收干净，不超 0.6s。 */
export function winJingle() {
  if (!sfxEnabled()) return
  try {
    settle()
    tone({ freq: 2093, dur: 0.21, type: 'sine', gain: 0.045, at: 0.36 })
  } catch { /* 静默降级 */ }
}
