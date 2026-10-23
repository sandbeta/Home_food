import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const showToast = useCallback((message, tone = 'default') => {
    if (!message) return
    if (timer.current) clearTimeout(timer.current)
    setToast({ message, tone, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {toast ? toast.message : ''}
      </div>
      {toast ? <div className="toast" aria-hidden="true">{toast.message}</div> : null}
    </ToastContext.Provider>
  )
}
