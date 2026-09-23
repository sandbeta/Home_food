/* m-12：全局播报桥（sr-only live region 常驻在 App 壳，各处通过 window.__cgAnnounce 写入 textContent）
 * 标准做法是「live region 预先在 DOM，只改文本」，比 toast 挂载即带内容更可靠（VoiceOver/NVDA）。
 * 单独成 lib 是为了避开 App.jsx 导出非组件符号触发 react-refresh/only-export-components 警告。
 */
export function announce(msg) {
  try {
    const el = document.getElementById('cg-live-region')
    if (el) { el.textContent = ''; setTimeout(() => { el.textContent = String(msg || '') }, 30) }
  } catch { /* noop */ }
}

if (typeof window !== 'undefined') window.__cgAnnounce = announce
