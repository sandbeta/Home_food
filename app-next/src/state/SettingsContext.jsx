import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  applyDocumentSettings,
  readSettings,
  resolveTheme,
  writeSetting,
} from '../lib/settings.js'

const SettingsContext = createContext(null)

export function useSettings() {
  return useContext(SettingsContext)
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readSettings)
  const [night, setNight] = useState(() => resolveTheme(readSettings().theme) === 'night')

  useEffect(() => {
    setNight(applyDocumentSettings(settings) === 'night')
  }, [settings])

  /* auto 模式跨过 21:00 / 05:00 时自动换装；一分钟查一次，开销可以忽略 */
  useEffect(() => {
    if (settings.theme !== 'auto') return
    const tick = () => setNight(resolveTheme('auto') === 'night')
    const timer = setInterval(tick, 60000)
    const onVisible = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [settings.theme])

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      for (const k of Object.keys(patch)) writeSetting(k, patch[k])
      return next
    })
  }, [])

  const value = useMemo(() => ({
    settings,
    update,
    night,
    setTheme: (theme) => update({ theme }),
    setText: (text) => update({ text }),
    setMotion: (motion) => update({ motion }),
    setNickname: (nickname) => update({ nickname: String(nickname || '').trim().slice(0, 12) || '我们' }),
  }), [settings, night, update])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
