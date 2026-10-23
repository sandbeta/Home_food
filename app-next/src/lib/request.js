export const DEFAULT_TIMEOUT_MS = 12000

/**
 * 统一 fetch：12s 超时 + 外部 signal 联动。
 * 抛出的错误带 status，调用方可以据此区分「没这道菜」和「断网」。
 */
export async function requestJson(url, opts = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, signal: outerSignal, ...rest } = opts
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(new DOMException('timeout', 'AbortError')), timeout)
  if (outerSignal) {
    if (outerSignal.aborted) {
      clearTimeout(timer)
      throw new DOMException('aborted', 'AbortError')
    }
    outerSignal.addEventListener('abort', () => ac.abort(outerSignal.reason), { once: true })
  }
  try {
    const res = await fetch(url, { ...rest, signal: ac.signal })
    if (!res.ok) {
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

export async function getJson(url, opts) {
  const res = await requestJson(url, opts)
  return res.json()
}
