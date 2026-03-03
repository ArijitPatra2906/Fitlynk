export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'fitlynk-theme'

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'dark' || value === 'light'

export const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return isThemeMode(raw) ? raw : null
}

export const getPreferredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export const getResolvedTheme = (): ThemeMode =>
  getStoredTheme() || getPreferredTheme()

export const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.dataset.theme = mode
  html.classList.toggle('dark', mode === 'dark')
}

export const setTheme = (mode: ThemeMode) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }
  applyTheme(mode)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { mode } }))
  }
}

