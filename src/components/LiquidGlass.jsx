import { useEffect, useRef, useState } from 'react'
import { getBackdropTexture, subscribe as subscribeBackdrop } from '../lib/backdropTexture'
import { parseCssColor } from '../lib/cssColor'
import { VERT_SRC, FRAG_SRC, UNIFORM_NAMES } from '../lib/liquidGlassShader'

/* ============================================================
 * LiquidGlass —— 用 WebGL2 把「身后的场景纹理」渲染成带折射的玻璃
 *
 * 与 CSS .glass-op 的分工：CSS 层是首帧与降级态（WebGL2 不可用、上下文丢失、
 * 用户开了「降低透明度」时，本组件直接返回 null，下面的 CSS 玻璃接管）。
 * 两者叠在同一块表面上，观感必须尽量一致，否则切换瞬间会跳。
 *
 * 坐标约定（重要，改 shader 前先读这段）：
 *   本组件的 canvas 只覆盖「玻璃矩形 + 阴影余量」，不是全屏 —— 因为每块玻璃
 *   各开一个 WebGL 上下文，全屏画布在低端机上吃不住。
 *   于是 shader 里所有几何都在「视口 CSS px」空间计算：
 *     vp = uOrigin + vUv * uRes
 *   uRes 是画布的 **CSS 尺寸**（不是设备像素），dpr 只影响 drawing buffer。
 *   纹理上传不做 Y 翻转：canvas 第 0 行是视口顶部，WebGL 的 v=0 也落在第 0 行，
 *   所以 uv = vp / uViewport 天然对齐；加翻转反而会把纹理倒过来。
 * ============================================================ */

// 导出给消费方：外部贴玻璃层时要按同一个余量外扩（见 hooks/useGlassRect 的 glassLayerStyle），
// 好让画布盒 = 玻璃矩形 + 余量，与 shader 里 uOrigin = rect.xy - PAD 的假设严格对齐。
export const PAD = 18            // 阴影余量（CSS px）
const DPR_MAX = 2

/* 颜色一律走 cssColor：探针把 var()/color-mix() 交给样式引擎，canvas 把样式引擎
 * 吐出的任何写法落成 0–255。
 * ⚠ 这里曾经自己抓正则：`color-mix(in srgb, #FFF9FC 22%, transparent)` 被 Chrome
 * 序列化成 `color(srgb 1 0.976471 0.988235 / 0.22)`（0–1 浮点），按 rgba 的 0–255
 * 形状抓出来就是「白纱 = 黑纱」，白天整块玻璃被凭空压暗 22%、上缘高光变黑边。
 * 实测：药丸中心纹理 0.817 → 画布 0.459，而 CSS 降级层 0.618。 */
function readGlassParams(variant) {
  const cs = getComputedStyle(document.documentElement)
  const g = n => cs.getPropertyValue(n).trim()
  const num = (n, fb) => { const v = parseFloat(g(n)); return Number.isFinite(v) ? v : fb }
  const color = (n, fb) => parseCssColor(`var(${n})`) || fb
  const ctl = variant === 'ctl'
  const tintVar = variant === 'scrim' ? '--glass-tint-scrim' : ctl ? '--glass-tint-ctl' : '--glass-tint-panel'
  return {
    tint: color(tintVar, [255, 249, 252, 0.22]),
    rim: color('--glass-rim-color', [255, 249, 252, 0.95]),
    blurPx: num(ctl ? '--glass-blur-ctl' : '--glass-blur-panel', 9),
    sat: num('--glass-sat', 140) / 100,
    bright: num('--glass-bright', 1),
    radius: num('--radius-card', 24),
    frost: num(ctl ? '--glass-frost-ctl' : '--glass-frost-panel', ctl ? 0.10 : 0.16),
    spec: num('--glass-spec', 1),
    lens: num(ctl ? '--glass-lens-ctl' : '--glass-lens-panel', ctl ? 6 : 12),
    ca: num(ctl ? '--glass-ca-ctl' : '--glass-ca-panel', ctl ? 0.010 : 0.016),
    rimW: num('--glass-rim-w', 1.5),
  }
}

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[LiquidGlass] shader 编译失败', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

export default function LiquidGlass({
  rect,                 // {x,y,w,h} 视口 CSS px
  variant = 'panel',    // panel | ctl | scrim
  radius,               // 覆盖令牌圆角（CSS px）
  className = '',
  style,
}) {
  const canvasRef = useRef(null)
  const [ok, setOk] = useState(true)
  // rect 每帧都变（滚动、layout 动画、framer-motion 补间），而 GL effect 只跑一次，
  // 所以几何必须走 ref：渲染期同步，draw 里读当前值。写成闭包捕获 rect 会让玻璃卡在初始位置。
  const rectRef = useRef(rect)
  rectRef.current = rect
  // 只把「有没有矩形」放进依赖：矩形本身走 ref，避免每帧重建 GL 上下文
  const hasRect = !!(rect && rect.w > 0 && rect.h > 0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
      setOk(false)                       // 系统要求降低透明：交回 CSS 实底
      return
    }
  }, [])

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs || !ok || !hasRect) return

    // preserveDrawingBuffer: true 是有意的取舍 —— 它让 readPixels / drawImage 在任何时刻
    // 都能回读 GPU 真实输出，从而可以自证「折射真的画出来了」而不是只看样式值。
    // 本项目已经多次因为「看不见」而交付了错的东西，这个验证能力比它多花的那点带宽更值。
    // 画布只覆盖玻璃矩形（不是全屏），所以代价有限；US-005 会把帧时基线实测记录下来。
    const gl = cvs.getContext('webgl2', {
      alpha: true, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true,
    })
    if (!gl) { setOk(false); return }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
    if (!vs || !fs) { setOk(false); return }
    const prog = gl.createProgram()
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[LiquidGlass] 链接失败', gl.getProgramInfoLog(prog))
      setOk(false); return
    }
    gl.useProgram(prog)
    const U = {}
    UNIFORM_NAMES.forEach(n => { U[n] = gl.getUniformLocation(prog, n) })

    const texA = gl.createTexture(), texB = gl.createTexture()
    const bindTex = (t, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }
    bindTex(texA, 0); bindTex(texB, 1)
    gl.uniform1i(U.uTex, 0)
    gl.uniform1i(U.uTexBlur, 1)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // 模糊纹理：ctx.filter 支持就走真高斯，否则退「降采样再放大」
    const blurCvs = document.createElement('canvas')
    const blurCtx = blurCvs.getContext('2d')
    const canFilter = (() => { try { return typeof blurCtx.filter === 'string' } catch { return false } })()

    let disposed = false
    let lastSig = ''
    // 纹理「内容」变了才重传。sig 只能表达尺寸/模糊档/主题，表达不了内容，
    // 所以内容变更由 subscribeBackdrop 的回调置这个标记（滚动每一帧都会来一次）。
    let needsUpload = true

    function draw() {
      if (disposed) return
      const src = getBackdropTexture()
      if (!src || !src.width) return
      const p = readGlassParams(variant)
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)
      const vw = window.innerWidth, vh = window.innerHeight
      const cssW = cvs.clientWidth, cssH = cvs.clientHeight
      const bw = Math.max(1, Math.round(cssW * dpr)), bh = Math.max(1, Math.round(cssH * dpr))
      if (cvs.width !== bw || cvs.height !== bh) { cvs.width = bw; cvs.height = bh; gl.viewport(0, 0, bw, bh) }

      // sig 只管「参数变了」；「内容变了」由 needsUpload 报（滚动就靠它，否则药丸这种
      // 位置不动的表面会一直采第一帧的旧纹理 —— 实测过：14 个滚动位中心亮度全等于 0.6926）
      const sig = `${src.width}x${src.height}|${p.blurPx}|${variant}|${document.documentElement.dataset.theme || 'light'}`
      if (needsUpload || sig !== lastSig) {
        needsUpload = false
        lastSig = sig
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)

        blurCvs.width = src.width; blurCvs.height = src.height
        if (canFilter) {
          blurCtx.filter = `blur(${(p.blurPx * 0.5).toFixed(2)}px) brightness(${p.bright})`
          blurCtx.drawImage(src, 0, 0)
          blurCtx.filter = 'none'
        } else {
          const s = Math.max(2, Math.round(p.blurPx / 2))
          const tmp = document.createElement('canvas')
          tmp.width = Math.max(2, Math.round(src.width / s)); tmp.height = Math.max(2, Math.round(src.height / s))
          const tc = tmp.getContext('2d'); tc.drawImage(src, 0, 0, tmp.width, tmp.height)
          blurCtx.imageSmoothingEnabled = true
          blurCtx.clearRect(0, 0, blurCvs.width, blurCvs.height)
          blurCtx.drawImage(tmp, 0, 0, blurCvs.width, blurCvs.height)
        }
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, blurCvs)
      }

      const rc = rectRef.current
      if (!rc || rc.w <= 0 || rc.h <= 0) return
      gl.uniform2f(U.uRes, cssW, cssH)
      gl.uniform2f(U.uOrigin, rc.x - PAD, rc.y - PAD)
      gl.uniform2f(U.uViewport, vw, vh)
      gl.uniform4f(U.uRect, rc.x, rc.y, rc.w, rc.h)
      gl.uniform1f(U.uRadius, radius != null ? radius : p.radius)
      gl.uniform1f(U.uLens, p.lens)
      gl.uniform1f(U.uCA, p.ca)
      gl.uniform1f(U.uSat, p.sat)
      gl.uniform4f(U.uTint, p.tint[0] / 255, p.tint[1] / 255, p.tint[2] / 255, p.tint[3])
      // alpha 用令牌自己的，不再写死 0.9：白天 rim 是 95%、夜宵是 55%，写死会让夜宵的
      // 高光线比 CSS 那层亮一档（两态必须各自对齐各自的降级层）
      gl.uniform4f(U.uRimHi, p.rim[0] / 255, p.rim[1] / 255, p.rim[2] / 255, p.rim[3])
      gl.uniform1f(U.uRimW, p.rimW)
      gl.uniform1f(U.uFrost, p.frost)
      gl.uniform1f(U.uSpec, p.spec)
      gl.uniform1f(U.uFlat, variant === 'scrim' ? 1 : 0)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    // 纹理层每次真重画都会回调到这里 → 这就是「内容变了」的唯一可靠信号，据此重传 GPU 纹理
    const unsub = subscribeBackdrop(() => { needsUpload = true; draw() })
    let raf = 0
    const start = () => { if (!raf && !disposed) raf = requestAnimationFrame(loop) }
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    const loop = () => { if (disposed) return; raf = 0; draw(); start() }
    start()

    // 页面隐藏即停帧（与 AmbientLightCanvas 同纪律）：切后台/锁屏时两处常驻 rAF 不应空转耗电
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVis)

    const onLost = e => { e.preventDefault(); setOk(false) }
    cvs.addEventListener('webglcontextlost', onLost)

    return () => {
      disposed = true
      stop()
      unsub()
      document.removeEventListener('visibilitychange', onVis)
      cvs.removeEventListener('webglcontextlost', onLost)
      gl.deleteTexture(texA); gl.deleteTexture(texB); gl.deleteProgram(prog)
    }
  }, [ok, variant, radius, hasRect])

  if (!ok || !hasRect) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'fixed',
        left: rect.x - PAD,
        top: rect.y - PAD,
        width: rect.w + PAD * 2,
        height: rect.h + PAD * 2,
        pointerEvents: 'none',
        zIndex: 1,
        ...style,
      }}
    />
  )
}

