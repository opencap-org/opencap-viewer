import {
  applyTheme,
  DARK_THEME,
  getStoredTheme,
  LIGHT_THEME,
  normalizeTheme,
  THEME_STORAGE_KEY
} from '../src/util/theme.js'

describe('theme preference utilities', () => {
  it('defaults missing and invalid preferences to dark mode', () => {
    expect(normalizeTheme()).toBe(DARK_THEME)
    expect(normalizeTheme('unknown')).toBe(DARK_THEME)
    expect(getStoredTheme({ getItem: () => null })).toBe(DARK_THEME)
  })

  it('restores a saved light preference', () => {
    const storage = { getItem: jest.fn(() => LIGHT_THEME) }

    expect(getStoredTheme(storage)).toBe(LIGHT_THEME)
    expect(storage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY)
  })

  it('updates Vuetify, the document theme, and local storage together', () => {
    const vuetify = { theme: { dark: true } }
    const root = { dataset: {} }
    const storage = { setItem: jest.fn() }

    expect(applyTheme(vuetify, LIGHT_THEME, { root, storage })).toBe(LIGHT_THEME)
    expect(vuetify.theme.dark).toBe(false)
    expect(root.dataset.appTheme).toBe(LIGHT_THEME)
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, LIGHT_THEME)
  })

  it('still applies the theme when browser storage is blocked', () => {
    const vuetify = { theme: { dark: false } }
    const root = { dataset: {} }
    const storage = { setItem: () => { throw new Error('blocked') } }

    expect(() => applyTheme(vuetify, DARK_THEME, { root, storage })).not.toThrow()
    expect(vuetify.theme.dark).toBe(true)
    expect(root.dataset.appTheme).toBe(DARK_THEME)
  })
})
