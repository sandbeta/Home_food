import { useEffect, useRef, useState } from 'react'
import { attach, rectOf } from '../lib/backdropTexture'
import { PAD } from '../components/LiquidGlass'

// ============================================================
// useGlassRect —— 把「宿主表面每帧的矩形」喂给 LiquidGlass
//
// 为什么要有这个钩子：玻璃 shader 要知道自己在视口里的位置和尺寸才能算折射，
// 而这个尺寸绝不能写死 —— 药丸宽度会随购物车球出现而变（framer layout 补间）、
// 吸顶栏 y 会随滚动从页面中部爬到 0。所以每帧用 rectOf() 读真实几何。
//
// 两条纪律：
// 1. **只在矩形真的变了（>0.5px）时 setState**。滚动时吸顶栏贴住顶之后就静止，
//    药丸平时也一动不动 → 零重渲染，不会每帧 reconcile 整个导航子树。
//    （折射带本身由 LiquidGlass 内部的 rAF 循环重画，不依赖 React 重渲染。）
// 2. 顺带调 attach()（幂等）：纹理层要监听 scroll/resize/主题/图片才会置脏，
//    第一块玻璃挂上时把它绑好，别让调用方各自记得绑。
// ============================================================

const EPS = 0.5

/** 玻璃层贴合宿主自身的外扩样式。
 *
 *  为什么不用 LiquidGlass 默认的「position:fixed + 视口坐标」：宿主（药丸带
 *  backdrop-filter、吸顶栏带 sticky、外层还有 -translate-x-1/2）本身就是包含块，
 *  fixed 会被改写成本地坐标而对不上位。改成 absolute 负外扩，画布跟着宿主的
 *  布局框走，任何祖先 transform 下都不会错位。宽高仍由 LiquidGlass 按 rect 给。
 *
 *  zIndex:-1 是关键：宿主是层叠上下文，负值子层画在「宿主自己的背景（= CSS 玻璃
 *  那层 backdrop-filter + tint）」之上，但在**所有**后代内容（文字、图标、
 *  激活态药丸）之下 —— 玻璃压在旧玻璃上、又不盖字。 */
export const glassLayerStyle = {
  position: 'absolute',
  left: -PAD,
  top: -PAD,
  zIndex: -1,
}

/** @returns {{targetRef: object, rect: {x:number,y:number,w:number,h:number}|null}}
 *  targetRef 挂到玻璃所在的那个表面上，rect 直接喂给 <LiquidGlass rect={...} /> */
export function useGlassRect() {
  const targetRef = useRef(null)
  const [rect, setRect] = useState(null)

  useEffect(() => {
    attach()
    let raf = 0
    let prev = null
    let disposed = false
    const moved = (r) =>
      !prev ||
      Math.abs(r.x - prev.x) > EPS || Math.abs(r.y - prev.y) > EPS ||
      Math.abs(r.w - prev.w) > EPS || Math.abs(r.h - prev.h) > EPS

    const measure = () => {
      if (disposed) return
      raf = 0
      const r = rectOf(targetRef.current)
      if (r && r.w > 0 && r.h > 0 && moved(r)) {
        prev = r
        setRect(r)
      }
      start()
    }
    const start = () => { if (!raf && !disposed && !document.hidden) raf = requestAnimationFrame(measure) }
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    // 页面隐藏即停帧（与 AmbientLightCanvas/LiquidGlass 同纪律）：量几何的 rAF 切后台不应空转；
    // 回前台时立即量一次，矩形在隐藏期间若变过能立刻跟上
    const onVis = () => { if (document.hidden) stop(); else { prev = null; start() } }
    document.addEventListener('visibilitychange', onVis)
    start()
    return () => { disposed = true; stop(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  return { targetRef, rect }
}

/* 「一块玻璃的完整接线」在 useGlassSurface.jsx —— 本文件是 .js，
   Vite 的 jsx 解析只认 .jsx，在这里写 JSX 会直接构建失败。 */
