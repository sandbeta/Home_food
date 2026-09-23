/* ============================================================
 * 全站统一 fetch 封装 · 带超时/AbortController
 * ------------------------------------------------------------
 * 修 M-s5：以前全站 fetch 无超时/取消 —— 家庭服务端进程活着但卡死（磁盘忙/端口占用未抛错）
 * 时请求永久 pending，Home/Menu 一直 LoadingState、Cart 一直「提交中…」且按钮 disabled 无法
 * 重试也无法取消，用户被彻底锁死。手机飞行模式反而能快速 reject，问题只在「慢/hang」这一档。
 *
 * 默认超时 12s —— 4G 慢网冷启动 5s、公网 frp 抖动 8s 都能兜住；服务端真挂了 12s 内给到 error 态。
 * 消费方式：`requestJson(url).then(r => ...).catch(err => { if (err.name==='AbortError') ... })`
 * 语义与 fetch 一致（同样吐 res.ok/r.json()），只是多了超时保护。
 * ============================================================ */
export const DEFAULT_TIMEOUT_MS = 12000

export async function requestJson(url, opts = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, signal: outerSignal, ...rest } = opts
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(new DOMException('timeout', 'AbortError')), timeout)
  // 外部 signal 联动 abort 内部（如 useEffect cleanup）
  if (outerSignal) {
    if (outerSignal.aborted) { clearTimeout(timer); ac.abort(outerSignal.reason); throw new DOMException('aborted', 'AbortError') }
    outerSignal.addEventListener('abort', () => ac.abort(outerSignal.reason), { once: true })
  }
  try {
    const res = await fetch(url, { ...rest, signal: ac.signal })
    if (!res.ok) {
      // 抛错带上 status，供 caller 归到 error 态；保留可读 message 便于「找不到这道菜」和「断网」分流
      const err = new Error('HTTP ' + res.status)
      err.status = res.status
      err.response = res
      throw err
    }
    return res
  } finally {
    clearTimeout(timer)
  }
}

/* GET JSON 便捷版（多数只读接口直接吃 JSON 数组/对象） */
export async function getJson(url, opts) {
  const res = await requestJson(url, opts)
  return res.json()
}

/* 判断 AbortError（fetch 挂起时 ac.abort 或用户主动中断，都会以 AbortError 冒出） */
export function isAbort(err) {
  return err && (err.name === 'AbortError' || err.code === 20)
}
