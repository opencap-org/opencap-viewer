import { resetPageScroll, resetPageScrollDeferred } from '../src/util/scrollUtils.js'

describe('page scroll utilities', () => {
  let animationFrames
  let vMain

  beforeEach(() => {
    animationFrames = []
    vMain = { scrollTop: 120 }

    global.window = {
      scrollTo: jest.fn(),
      requestAnimationFrame: jest.fn(callback => {
        animationFrames.push(callback)
      })
    }
    global.document = {
      documentElement: { scrollTop: 80 },
      body: { scrollTop: 40 },
      querySelector: jest.fn(() => vMain)
    }
  })

  afterEach(() => {
    delete global.window
    delete global.document
  })

  it('resets the window, document, body, and main scroll container', () => {
    resetPageScroll()

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
    expect(vMain.scrollTop).toBe(0)
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
})
