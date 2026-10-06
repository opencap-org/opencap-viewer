import {
  installMobileKeyboardScrollFix,
  resetPageScroll,
  resetPageScrollAfterKeyboard,
  resetPageScrollDeferred
} from '../src/util/scrollUtils.js'

describe('page scroll utilities', () => {
  let animationFrames
  let timers
  let vMain
  let loginWrapper
  let visualViewport

  beforeEach(() => {
    animationFrames = []
    timers = []
    vMain = { scrollTop: 120, scrollLeft: 0 }
    loginWrapper = { scrollTop: 40, scrollLeft: 0 }
    visualViewport = {
      height: 700,
      offsetTop: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }

    global.window = {
      scrollTo: jest.fn(),
      innerHeight: 800,
      visualViewport,
      requestAnimationFrame: jest.fn(callback => {
        animationFrames.push(callback)
      }),
      setTimeout: jest.fn((callback, ms) => {
        timers.push({ callback, ms })
        return timers.length
      }),
      clearTimeout: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }
    global.document = {
      documentElement: { scrollTop: 80 },
      body: { scrollTop: 40 },
      activeElement: { tagName: 'BODY' },
      querySelectorAll: jest.fn(selector => {
        if (selector === '.v-main') return [vMain]
        if (selector === '.login-wrapper') return [loginWrapper]
        return []
      }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }
  })

  afterEach(() => {
    delete global.window
    delete global.document
  })

  it('resets the window, document, body, and known scroll containers', () => {
    resetPageScroll()

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
    expect(vMain.scrollTop).toBe(0)
    expect(loginWrapper.scrollTop).toBe(0)
  })

  it('clears a stuck visualViewport offsetTop', () => {
    visualViewport.offsetTop = 64

    resetPageScroll()

    expect(window.scrollTo.mock.calls).toEqual([
      [0, 0],
      [0, 64],
      [0, 0]
    ])
  })

  it('repeats the reset after the next tick and two animation frames', () => {
    const vm = { $nextTick: jest.fn(callback => callback()) }

    resetPageScrollDeferred(vm)
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(animationFrames).toHaveLength(1)

    document.documentElement.scrollTop = 80
    document.body.scrollTop = 40
    vMain.scrollTop = 120
    animationFrames.shift()()

    expect(window.scrollTo).toHaveBeenCalledTimes(2)
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
    expect(vMain.scrollTop).toBe(0)
    expect(animationFrames).toHaveLength(1)

    vMain.scrollTop = 120
    animationFrames.shift()()

    expect(window.scrollTo).toHaveBeenCalledTimes(3)
    expect(vMain.scrollTop).toBe(0)
    expect(animationFrames).toHaveLength(0)
  })

  it('schedules delayed resets after keyboard dismiss', () => {
    resetPageScrollAfterKeyboard()

    expect(timers.map(timer => timer.ms)).toEqual([50, 150, 350, 500])
    vMain.scrollTop = 90
    timers[0].callback()
    expect(vMain.scrollTop).toBe(0)
  })

  it('installs and uninstalls mobile keyboard scroll listeners', () => {
    const uninstall = installMobileKeyboardScrollFix()

    expect(visualViewport.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(visualViewport.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(document.addEventListener).toHaveBeenCalledWith('focusout', expect.any(Function))
    expect(window.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function))

    uninstall()

    expect(visualViewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(visualViewport.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(document.removeEventListener).toHaveBeenCalledWith('focusout', expect.any(Function))
    expect(window.removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function))
  })
})
