import {
  formatInternetSpeed,
  getConnectionDownlinkMbps,
  internetSpeedStatus,
  measureDownloadSpeed
} from '../src/util/internetSpeed.js'

describe('internet speed utilities', () => {
  it('formats measured speeds compactly', () => {
    expect(formatInternetSpeed(0.74)).toBe('0.7 Mbps')
    expect(formatInternetSpeed(5.28)).toBe('5.3 Mbps')
    expect(formatInternetSpeed(42.2)).toBe('42 Mbps')
    expect(formatInternetSpeed(null)).toBeNull()
  })

  it('classifies measured speeds', () => {
    expect(internetSpeedStatus(0)).toBe('unavailable')
    expect(internetSpeedStatus(2.9)).toBe('slow')
    expect(internetSpeedStatus(3)).toBe('ok')
    expect(internetSpeedStatus(10)).toBe('fast')
  })

  it('reads browser downlink when available', () => {
    expect(getConnectionDownlinkMbps({ downlink: 12.5 })).toBe(12.5)
    expect(getConnectionDownlinkMbps({ downlink: 0 })).toBeNull()
    expect(getConnectionDownlinkMbps({})).toBeNull()
  })

  it('measures download speed from fetched bytes and elapsed time', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 206,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(500000))
    })
    const now = jest.fn()
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000)

    const result = await measureDownloadSpeed({
      url: '/speed.png',
      range: null,
      timeoutMs: null,
      fetchImpl,
      now,
      cacheBust: 'test'
    })

    expect(result).toEqual({
      bytes: 500000,
      durationMs: 1000,
      mbps: 4
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      '/speed.png?speed_test=test',
      expect.objectContaining({
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {},
        signal: undefined
      })
    )
  })
})
