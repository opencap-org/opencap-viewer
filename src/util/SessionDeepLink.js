/**
 * Builds the URL for "Open in app" so the native mobile app opens (custom URL scheme).
 * - If VUE_APP_MOBILE_APP_DEEP_LINK is set, use it (replace SESSION_ID with sessionId).
 * - Otherwise use default scheme opencap://session/SESSION_ID so the OS opens the app
 *   when installed. The mobile app must register this URL scheme and handle the session ID.
 * - If token is provided, appends it as a query param (?token=... or &token=...) so the
 *   app can use it for authenticated API requests.
 * - If subjectName is provided, appends it as &subject_name=<encoded> so the app can
 *   display the subject name.
 * @param {string} sessionId - Current session ID
 * @param {string|null} [token] - Optional auth token (e.g. from localStorage auth_token)
 * @param {string|null} [subjectName] - Optional subject name to pass to the app
 * @returns {string|null} URL or null if no sessionId
 */
const DEFAULT_APP_SCHEME = 'opencap://session/SESSION_ID'

export function getSessionDeepLink(sessionId, token = null, subjectName = null) {
  if (!sessionId) return null
  const pattern = process.env.VUE_APP_MOBILE_APP_DEEP_LINK || DEFAULT_APP_SCHEME
  let url = pattern.replace('SESSION_ID', String(sessionId))
  if (token) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}token=${encodeURIComponent(token)}`
  }
  if (subjectName) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}subject_name=${encodeURIComponent(subjectName)}`
  }
  return url
}
