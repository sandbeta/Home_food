import { useGlassRect, glassLayerStyle } from './useGlassRect'
import LiquidGlass from '../components/LiquidGlass'

/* ============================================================
 * useGlassSurface —— 一次拿到「宿主 ref + 玻璃层」，接一块玻璃只用两行
 *
 * 为什么单独成文件并且是 .jsx：本项目 .js 不走 JSX 解析（Vite 只对 .jsx 开），
 * 这个钩子要返回 <LiquidGlass/> 元素，放 .js 里构建直接失败。
 *
 * 为什么要有它：药丸、页头、4 个遮罩、主题开关的接线代码一模一样
 * （三行 import + 一个 ref + 一个负 z 子层），复制 7 遍迟早有一份改漏。
 *
 * 用法：
 *   const { ref, glass } = useGlassSurface({ variant: 'scrim', radius: 0 })
 *   <motion.div ref={ref} className="... glass-op--scrim">{glass}</motion.div>
 *
 * 两条纪律：
 * 1. {glass} 必须是宿主的**第一个子节点**。宿主是层叠上下文，负 z 的画布画在
 *    「宿主自己的背景（= CSS 那层玻璃）」之上、所有文字图标之下。
 * 2. 矩形没量到之前**不渲染画布**。早一帧渲染会让玻璃先出现在别处再跳到位，
 *    那就是验收要看的「白闪」。
 *
 * radius 传 'full' = 圆到底（药丸/圆钮）：按实测高度一半算，宿主被 framer 补间
 * 或因根字号 15px 而尺寸变化时（w-11 实际 41.25px）圆角都跟着走，不会露方角。
 * ========================================================== */
export function useGlassSurface({ radius, ...glassProps } = {}) {
  const { targetRef, rect } = useGlassRect()
  const has = !!(rect && rect.w > 0 && rect.h > 0)
  // rect 首帧是 null（useGlassRect 要等一次 rAF 才量到几何），'full' 必须先等高度出现，
  // 否则这里读 rect.h 直接把整页送进 ErrorBoundary（实测 /menu 整页崩）。
  const r = radius === 'full' ? (has ? Math.round(rect.h / 2) : 0) : radius
  return {
    ref: targetRef,
    rect,
    glass: has
      ? <LiquidGlass rect={rect} style={glassLayerStyle} {...glassProps} {...(r != null ? { radius: r } : {})} />
      : null,
  }
}
