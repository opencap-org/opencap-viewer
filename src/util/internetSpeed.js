export const DEFAULT_SPEED_TEST_URL = '/images/camera-calibration.png'
export const DEFAULT_SPEED_TEST_RANGE = 'bytes=0-524287'
export const DEFAULT_SPEED_TEST_TIMEOUT_MS = 8000

function getNow () {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  }

  return Date.now()
}

function appendCacheBust (url, cacheBust) {
  const separator = url.indexOf('?') === -1 ? '?' : '&'
  return `${url}${separator}speed_test=${encodeURIComponent(cacheBust)}`
}

export function formatInternetSpeed (mbps) {
  if (!Number.isFinite(mbps) || mbps <= 0) return null
  if (mbps < 1) return `${mbps.toFixed(1)} Mbps`
  if (mbps < 10) return `${mbps.toFixed(1)} Mbps`

  return `${Math.round(mbps)} Mbps`
}

export function internetSpeedStatus (mbps) {
  if (!Number.isFinite(mbps) || mbps <= 0) return 'unavailable'
  if (mbps < 3) return 'slow'
  if (mbps < 10) return 'ok'

  return 'fast'
}

export function getConnectionDownlinkMbps (connection = null) {
  const browserConnection = connection || (
    typeof navigator !== 'undefined' ? navigator.connection : null
  )
  const downlink = Number(browserConnection && browserConnection.downlink)

  return Number.isFinite(downlink) && downlink > 0 ? downlink : null
}

export async function measureDownloadSpeed ({
  url = DEFAULT_SPEED_TEST_URL,
  range = DEFAULT_SPEED_TEST_RANGE,
  timeoutMs = DEFAULT_SPEED_TEST_TIMEOUT_MS,
  fetchImpl = null,
  now = getNow,
  cacheBust = Date.now()
} = {}) {
  const fetchFn = fetchImpl || (
    typeof window !== 'undefined' && window.fetch
      ? window.fetch.bind(window)
      : (typeof fetch !== 'undefined' ? fetch : null)
  )

  if (!fetchFn) {
    throw new Error('Fetch is not available for internet speed measurement.')
  }

  const abortController = typeof AbortController !== 'undefined' && timeoutMs > 0
    ? new AbortController()
    : null
  const timeoutId = abortController
    ? setTimeout(() => abortController.abort(), timeoutMs)
    : null

  const headers = {}
  if (range) headers.Range = range

  const start = now()

  try {
    const response = await fetchFn(appendCacheBust(url, cacheBust), {
      cache: 'no-store',
      credentials: 'same-origin',
      headers,
      signal: abortController ? abortController.signal : undefined
    })

    if (!response || !response.ok) {
      const status = response && response.status ? response.status : 'unknown'
      throw new Error(`Speed test request failed with status ${status}.`)
    }

    const buffer = await response.arrayBuffer()
    const bytes = buffer.byteLength
    const durationMs = Math.max(now() - start, 1)

    return {
      bytes,
      durationMs,
      mbps: (bytes * 8) / (durationMs * 1000)
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
