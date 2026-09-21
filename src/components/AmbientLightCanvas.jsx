import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../theme/motion'

// ============================================================
// 晨光画布（overdrive · WebGL）—— App 壳层两团定眼 ambient 光斑的 shader 化：
// 暖光在"纸面"下缓慢流动，随指针微移（手机无指针则仅缓慢呼吸）。
// 纪律：
//  - 渐进增强：无 WebGL / 编译失败 / 上下文丢失 → 组件静默退场，DOM 里
//    原有的两个静态 radial 光斑（CSS）仍在，观感回到现状，不留空洞
//  - prefers-reduced-motion → 根本不启动
//  - 页面隐藏（切标签/锁屏）→ 暂停 rAF，不耗电
//  - 160×240 低分辨率离屏 + 外层 blur 叠加，手机 fillRate 压力极小
// ============================================================

const VS = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FS = `
precision mediump float;
uniform float uTime;
uniform vec2 uPointer; // -1..1，已平滑
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(160.0, 240.0); // 固定低分辨率基准
  // 两团光斑：clay 主光左上、sage 辅光右中；时间做缓慢漂移（周期不同步，避免整点感）
  vec2 c1 = vec2(0.16 + 0.04 * sin(uTime * 0.13), 0.88 + 0.05 * cos(uTime * 0.11));
  vec2 c2 = vec2(0.86 + 0.04 * cos(uTime * 0.09), 0.58 + 0.06 * sin(uTime * 0.07));
  c1 += uPointer * 0.03;   // 指针 ±3% 视差（桌面端）
  c2 -= uPointer * 0.024;
  float d1 = length((uv - c1) * vec2(1.25, 1.0));
  float d2 = length((uv - c2) * vec2(1.1, 1.0));
  float g1 = exp(-d1 * d1 * 7.0);
  float g2 = exp(-d2 * d2 * 8.0);
  vec3 clay = vec3(0.847, 0.455, 0.541); // clay-50 #D8748A 归一
  vec3 sage = vec3(0.643, 0.765, 0.620); // sage-40 #A4C39E 归一
  // 极淡：与静态 radial 光斑同量级，是"氛围"不是"特效"
  float a = clamp(g1 * 0.05 + g2 * 0.035, 0.0, 0.09);
  gl_FragColor = vec4(clay * g1 + sage * g2, a);
}
`

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh)
    throw new Error('shader compile failed')
  }
  return sh
}

export default function AmbientLightCanvas() {
  const ref = useRef(null)
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    if (reduce) return undefined
    const canvas = ref.current
    if (!canvas) return undefined

    let gl = null
    try { gl = canvas.getContext('webgl', { alpha: true, antialias: false }) } catch { /* 无 WebGL */ }
    if (!gl) return undefined

    let raf = 0
    let dead = false
    let onPointerMove = null
    let onVis = null

    try {
      const prog = gl.createProgram()
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link failed')
      gl.useProgram(prog)

      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      // 一个盖满裁剪空间的大三角
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'aPos')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

      const uTime = gl.getUniformLocation(prog, 'uTime')
      const uPointer = gl.getUniformLocation(prog, 'uPointer')

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)

      const t0 = performance.now()
      const ptr = { x: 0, y: 0 }
      const dst = { x: 0, y: 0 }
      onPointerMove = (e) => {
        dst.x = (e.clientX / window.innerWidth) * 2 - 1
        dst.y = 1 - (e.clientY / window.innerHeight) * 2
      }
      window.addEventListener('pointermove', onPointerMove, { passive: true })

      const start = () => { if (!raf && !dead) raf = requestAnimationFrame(tick) }
      const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
      function tick() {
        if (dead) return
        ptr.x += (dst.x - ptr.x) * 0.04
        ptr.y += (dst.y - ptr.y) * 0.04
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform1f(uTime, (performance.now() - t0) / 1000)
        gl.uniform2f(uPointer, ptr.x, ptr.y)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        raf = requestAnimationFrame(tick)
      }
      onVis = () => (document.hidden ? stop() : start())
      document.addEventListener('visibilitychange', onVis)
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault()
        dead = true
        stop()
        canvas.style.display = 'none' // 掉上下文即退场，CSS 光斑本就在底层
      })
      start()
    } catch {
      dead = true
      canvas.style.display = 'none'
    }

    return () => {
      dead = true
      if (raf) cancelAnimationFrame(raf)
      if (onPointerMove) window.removeEventListener('pointermove', onPointerMove)
      if (onVis) document.removeEventListener('visibilitychange', onVis)
    }
  }, [reduce])

  if (reduce) return null
  return <canvas ref={ref} width={160} height={240} aria-hidden="true" className="ambient-gl" />
}
