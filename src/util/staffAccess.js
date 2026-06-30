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

// LiDAR uses the same set of selected users as local recording.
export function canShowLidarToggle ({ username }) {
  return LOCAL_SAVE_ALLOWLIST.has(username)
}
