import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useDialogA11y from '../lib/useDialogA11y'
import { sheetUp, usePrefersReducedMotion, tapScale } from '../theme/motion'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import Icon from './ui/Icons'
import { NICKNAME } from '../lib/sweetCopy'

/* ============================================================
 * 批 3c · 今日菜卡分享
 * ------------------------------------------------------------
 * 语义：把娃娃机当前主推 + 编号 + 日期 + slogan 手绘成一张 800×1000 的分享海报，
 *   发到家庭群 / 存进相册 —— 让"这本别册"翻得出门。
 * 实现：纯 canvas 2D（无外部依赖），图 URL 走 crossorigin=anonymous 加载；
 *   跨域失败（tainted canvas）→ 回退到大 emoji 版本，仍可分享。
 * 批5 移动端修（分享三件套，此前 iPhone 上两条保存路全断）：
 *   ① dataURL → Blob + objectURL：`<a download>` 在 iOS 对 data: URL 普遍无视，blob 才走 QuickLook 能存；
 *   ② 「分享到家庭群」走系统 Web Share（canShare({files}) 能力检测，不支持图片时退文本分享）；
 *   ③ 卡面图片单独解禁长按保存（全局 -webkit-touch-callout:none 会连"存储图像"一起杀掉，
 *      .share-img-callout 见 index.css）。
 * ============================================================ */
const W = 800, H = 1000

function pad2(n) { return String(n).padStart(2, '0') }

/** dataURL → Blob（浏览器不支援或 tainted 返回 null，调用方回退 dataURL 预览） */
function dataUrlToBlob(dataUrl) {
  try {
    const [head, body] = dataUrl.split(',')
    const mime = /^data:([^;]+)/.exec(head)?.[1] || 'image/png'
    const bin = atob(body)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return new Blob([arr], { type: mime })
  } catch { return null }
}

/** 主绘：返回 dataURL（Promise），无图或跨域失败降级到 emoji */
async function drawPoster({ dish, indexNo, date }) {
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // 底：浅樱粉纸 + 顶部柔光
  ctx.fillStyle = '#FCE7F0'
  ctx.fillRect(0, 0, W, H)
  const grad = ctx.createLinearGradient(0, 0, 0, H * 0.4)
  grad.addColorStop(0, 'rgba(255,235,243,0.85)')
  grad.addColorStop(1, 'rgba(252,231,240,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H * 0.4)

  // 顶部羊毛云朵檐：三个连排半圆
  ctx.fillStyle = '#FFF9FC'
  const bumps = [[80, 68, 30], [180, 68, 42], [300, 68, 30], [400, 68, 42], [520, 68, 30], [620, 68, 42], [740, 68, 30]]
  for (const [x, y, r] of bumps) { ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.fill() }
  ctx.fillRect(0, 40, W, 30)

  // 顶部小字：品牌 + No.
  ctx.fillStyle = '#973148'
  ctx.font = '700 22px system-ui, "PingFang SC", sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText('晨光厨房 · Sunlit Kitchen', 40, 100)
  ctx.textAlign = 'right'
  ctx.fillText(`No.${pad2(indexNo)}`, W - 40, 100)
  ctx.textAlign = 'left'

  // 分隔线
  ctx.strokeStyle = 'rgba(43,36,41,0.14)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(40, 140); ctx.lineTo(W - 40, 140); ctx.stroke()

  // 大标题
  ctx.fillStyle = '#2B2429'
  ctx.font = '700 68px "Playfair Display", "Songti SC", "SimSun", serif'
  const title = `${NICKNAME}，今天想吃`
  ctx.fillText(title, 40, 200)
  // 菜名（大字，可能长，做换行）
  ctx.font = '700 88px "Playfair Display", "Songti SC", "SimSun", serif'
  const name = dish.name || '好吃的'
  const nameLines = wrapText(ctx, name, W - 80)
  let ty = 290
  for (const ln of nameLines.slice(0, 2)) { ctx.fillText(ln, 40, ty); ty += 100 }
  ty += 20

  // 菜品图像区（若图为 emoji 走大字；有图尝试加载）
  const img = getDishImage(dish, 'w800')   // 海报 800×1000 中央 420px 圆盘，必须大图档（批5：默认档已变 160w 列表缩略）
  const centerY = ty + 200
  let imgDrawn = false
  if (img) {
    try {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      /* 批4 修 P1：①加 4s 超时——原 onload/onerror 悬 pending 时 Promise 永不 settle，
         "手绘中…"无限转圈（与 M-s5 同类的 hang 死锁）；
         ②子路径部署取图修正——原 location.origin + '/' 会把 /Home_food/ 段丢掉，
         GitHub Pages 上分享卡永远只画 emoji 画不出真实菜品照片。 */
      await new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(new Error('img timeout')), 4000)
        el.onload = () => { clearTimeout(to); resolve() }
        el.onerror = () => { clearTimeout(to); reject(new Error('img error')) }
        el.src = img.startsWith('http') ? img : new URL((img.startsWith('/') ? '.' : '') + img, location.href).href
      })
      // 圆形图鉴盘：clip + cover
      ctx.save()
      ctx.beginPath(); ctx.arc(W / 2, centerY, 210, 0, Math.PI * 2); ctx.closePath()
      ctx.clip()
      const ratio = Math.max((210 * 2) / el.width, (210 * 2) / el.height)
      const dw = el.width * ratio, dh = el.height * ratio
      ctx.drawImage(el, W / 2 - dw / 2, centerY - dh / 2, dw, dh)
      ctx.restore()
      imgDrawn = true
    } catch { /* tainted 或加载失败 → 走 emoji */ }
  }
  if (!imgDrawn) {
    // emoji 大字兜底
    ctx.fillStyle = '#BE4E67'
    ctx.font = '700 240px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(getCategoryEmoji(dish.category), W / 2, centerY)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
  }

  // 图边缘一圈 clay-deep 描边
  ctx.strokeStyle = '#7F2A3D'
  ctx.lineWidth = 6
  ctx.beginPath(); ctx.arc(W / 2, centerY, 210, 0, Math.PI * 2); ctx.stroke()

  // 价格（caramel 衬线）
  ctx.fillStyle = '#9A575F'
  ctx.font = '700 96px "Playfair Display", "Songti SC", "SimSun", serif'
  ctx.textAlign = 'center'
  ctx.fillText(`¥${dish.price || '—'}`, W / 2, centerY + 260)
  ctx.textAlign = 'left'

  // 底部 slogan + 日期
  ctx.fillStyle = '#5F5259'
  ctx.font = '600 26px system-ui, "PingFang SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('抓一个算一个 · 今天这一份归你', W / 2, H - 100)
  ctx.font = '500 20px "Playfair Display", "Songti SC", serif'
  ctx.fillStyle = '#973148'
  ctx.fillText(date, W / 2, H - 60)
  ctx.textAlign = 'left'

  try {
    return canvas.toDataURL('image/png')
  } catch {
    // tainted canvas 兜底（虽然我们已经 catch 了跨域图，保险再来一次）
    return null
  }
}

function wrapText(ctx, text, maxW) {
  const out = []; let cur = ''
  for (const ch of text) {
    const test = cur + ch
    if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = ch }
    else cur = test
  }
  if (cur) out.push(cur)
  return out
}

export default function DishShareCard({ open, onClose, dish, indexNo = 1 }) {
  const reduce = usePrefersReducedMotion()
  const panelRef = useDialogA11y(open, onClose)
  const [url, setUrl] = useState(null)
  const [drawing, setDrawing] = useState(false)
  const [err, setErr] = useState('')
  const reqIdRef = useRef(0)
  const blobRef = useRef(null)     // 分享/下载共用的原始 Blob
  const urlRef = useRef(null)      // 当前 objectURL，重绘/关窗时 revoke

  useEffect(() => {
    if (!open || !dish) return undefined
    const my = ++reqIdRef.current
    setDrawing(true); setErr(''); setUrl(null); blobRef.current = null
    const d = new Date()
    const dateStr = `${d.getFullYear()} · ${pad2(d.getMonth() + 1)} 月 ${pad2(d.getDate())} 日 · 周${'日一二三四五六'[d.getDay()]}`
    drawPoster({ dish, indexNo, date: dateStr })
      .then(res => {
        if (reqIdRef.current !== my) return
        let out = res
        const blob = res ? dataUrlToBlob(res) : null
        if (blob) {
          blobRef.current = blob
          try { out = URL.createObjectURL(blob); urlRef.current = out } catch { /* 极端环境无 URL API：留 dataURL */ }
        }
        setUrl(out); setDrawing(false)
      })
      .catch(e => { if (reqIdRef.current !== my) return; setErr('画不出来：' + ((e && e.message) || '未知')); setDrawing(false) })
    return () => {
      if (urlRef.current && urlRef.current.startsWith('blob:')) URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [open, dish, indexNo])

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const onShare = async () => {
    try {
      const blob = blobRef.current
      const file = blob && blob.type.startsWith('image/')
        ? new File([blob], `晨光厨房-${dish.name || '今日菜卡'}.png`, { type: 'image/png' })
        : null
      if (file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: '晨光厨房 · 今日菜卡', text: `今天想吃「${dish.name || '这道菜'}」— ${NICKNAME}的抓娃娃点餐机` })
        try { window.__cgAnnounce?.('已呼起系统分享面板') } catch {}
      } else {
        await navigator.share({ title: '晨光厨房 · 今日菜卡', text: `今天想吃「${dish.name || '这道菜'}」！来一起点菜 ${location.href}` })
      }
    } catch { /* 用户在系统面板点了「取消」：不是错误，静默 */ }
  }

  if (!open || !dish) return null

  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(43,36,41,0.55)' }} />
      <motion.div ref={panelRef}
        role="dialog" aria-modal="true" aria-label="今日菜卡分享" tabIndex={-1}
        {...(reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : sheetUp)}
        className="fixed bottom-0 left-0 right-0 mx-auto z-50 focus:outline-none"
        style={{ maxWidth: 'var(--shell-w)' }}>
        <div className="d3-card-face overflow-hidden flex flex-col" style={{ borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0', maxHeight: '92vh' }}>
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-12 h-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-ash) 30%, transparent)' }} />
          </div>
          <div className="px-5 pb-2 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold font-serif text-[var(--color-bone)] leading-tight">今日菜卡</h2>
              <p className="text-[11px] text-[var(--color-ash)]">发到家庭群，或长按图片存进相册</p>
            </div>
            <button onClick={onClose} aria-label="关闭"
              className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)] border-2 border-[var(--color-line)] bg-[var(--color-glass)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className="px-5 flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 12px)' }}>
            {drawing ? (
              <div className="flex items-center justify-center py-16">
                <motion.span animate={reduce ? {} : { rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="inline-flex"><Icon name="sparkles" size={28} /></motion.span>
                <span className="ml-2 text-sm text-[var(--color-ash)]">手绘中…</span>
              </div>
            ) : err ? (
              <p className="text-sm text-center py-8" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {err}</p>
            ) : url ? (
              <img src={url} alt={`今日菜卡：${dish.name}`}
                className="share-img-callout w-full rounded-xl"
                style={{ boxShadow: 'var(--shadow-3)', display: 'block' }} />
            ) : null}
          </div>
          {url && (
            <div className="px-5 pt-2 pb-1 shrink-0 flex gap-2">
              {hasNativeShare && (
                <motion.button type="button" whileTap={tapScale} onClick={onShare}
                  className="d3-btn d3-btn-primary flex-1 py-3 text-sm font-bold min-h-[44px] flex items-center justify-center gap-1.5"
                  style={{ color: 'var(--color-on-dark)' }}>
                  <Icon name="heart" size={14} /> 分享到家庭群
                </motion.button>
              )}
              <motion.a whileTap={tapScale} href={url}
                download={`晨光厨房-${dish.name || '今日菜卡'}.png`}
                className={`d3-btn flex-1 py-3 text-sm font-bold min-h-[44px] flex items-center justify-center gap-1.5 no-underline ${hasNativeShare ? '' : 'd3-btn-primary'}`}
                style={hasNativeShare
                  ? { color: 'var(--color-clay-text)', background: 'var(--surface)', border: '2px solid var(--color-line)', borderRadius: 'var(--radius-btn)' }
                  : undefined}>
                存为图片
              </motion.a>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
