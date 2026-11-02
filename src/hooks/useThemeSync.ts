import { useEffect } from 'react'
import { resolveTheme, usePrefsStore } from '@/stores/prefs'

/**
 * Mirrors the theme preference onto <html data-theme>. CSS variables do the rest.
 * In "system" mode it also follows the OS setting live.
 */
export function useThemeSync() {
  const theme = usePrefsStore((s) => s.theme)

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme)
      document.documentElement.setAttribute('data-theme', resolved)
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'light' ? '#f5f7f6' : '#0c1110')
    }
    apply()
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}
