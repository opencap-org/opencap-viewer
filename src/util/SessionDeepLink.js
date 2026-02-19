/**
 * Builds the URL for "Open in app" so the native mobile app opens (custom URL scheme).
 * - If VUE_APP_MOBILE_APP_DEEP_LINK is set, use it (replace SESSION_ID with sessionId).
 * - Otherwise use default scheme opencap://session/SESSION_ID so the OS opens the app
 *   when installed. The mobile app must register this URL scheme and handle the session ID.
 * - If token is provided, appends it as a query param (?token=... or &token=...) so the
 *   app can use it for authenticated API requests.
 * - If subjectName is provided, appends it as &subject_name=<encoded> so the app can
 *   display the subject name.
 * - api_server (from VUE_APP_API_SERVER) is always appended so the app knows which backend
 *   to use (e.g. dev.opencap.ai vs opencap.ai).
 * @param {string} sessionId - Current session ID
 * @param {string|null} [token] - Optional auth token (e.g. from localStorage auth_token)
 * @param {string|null} [subjectName] - Optional subject name to pass to the app
 * @returns {string|null} URL or null if no sessionId
 */
const DEFAULT_APP_SCHEME = 'opencap://session/SESSION_ID'

function appendParam(url, key, value) {
  if (value == null || value === '') return url
  const separator = url.includes('?') ? '&' : '?'
  return url + `${separator}${key}=${encodeURIComponent(value)}`
}

export function getSessionDeepLink(sessionId, token = null, subjectName = null) {
  if (!sessionId) return null
  const pattern = process.env.VUE_APP_MOBILE_APP_DEEP_LINK || DEFAULT_APP_SCHEME
  let url = pattern.replace('SESSION_ID', String(sessionId))
  const apiServer = process.env.VUE_APP_API_SERVER || ''
  url = appendParam(url, 'api_server', apiServer.replace(/\/$/, ''))
  url = appendParam(url, 'token', token)
  url = appendParam(url, 'subject_name', subjectName)
  return url
}
