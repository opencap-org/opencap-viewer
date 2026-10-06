export const THEME_STORAGE_KEY = 'opencap_theme'
export const DARK_THEME = 'dark'
export const LIGHT_THEME = 'light'

function getBrowserStorage () {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function normalizeTheme (theme) {
  return theme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME
}

export function getStoredTheme (storage) {
  const resolvedStorage = storage === undefined ? getBrowserStorage() : storage
  if (!resolvedStorage) return DARK_THEME

  try {
    return normalizeTheme(resolvedStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return DARK_THEME
  }
}

export function applyTheme (vuetify, theme, options = {}) {
  const normalizedTheme = normalizeTheme(theme)
  const storage = options.storage === undefined
    ? getBrowserStorage()
    : options.storage
  const root = options.root === undefined
    ? (typeof document !== 'undefined' ? document.documentElement : null)
    : options.root

  vuetify.theme.dark = normalizedTheme === DARK_THEME

  if (root) root.dataset.appTheme = normalizedTheme

  if (storage) {
    try {
      storage.setItem(THEME_STORAGE_KEY, normalizedTheme)
    } catch {
      // The active theme still works when storage is unavailable or blocked.
    }
  }

  return normalizedTheme
}
