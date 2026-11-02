import { useEffect } from 'react'
import { resolveTheme, usePrefsStore } from '@/stores/prefs'

/**
 * Mirrors the theme and CRT preferences onto <html data-theme data-crt>. CSS variables do the rest.
 * In "system" mode it also follows the OS setting live.
 */
export function useThemeSync() {
  const theme = usePrefsStore((s) => s.theme)
  const crt = usePrefsStore((s) => s.crt)

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme)
      document.documentElement.setAttribute('data-theme', resolved)
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'light' ? '#e9ebee' : '#0a0a0c')
    }
    apply()
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    if (crt) document.documentElement.setAttribute('data-crt', 'on')
    else document.documentElement.removeAttribute('data-crt')
  }, [crt])
}
