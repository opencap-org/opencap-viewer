const LOCAL_SAVE_ALLOWLIST = new Set([
  'suhlrich',
  'DannyM',
  'selimgilon',
  'carmichaelong',
  'AlbertoCasas'
])

export function canShowLocalDataSaveToggle ({ username }) {
  return LOCAL_SAVE_ALLOWLIST.has(username)
}
