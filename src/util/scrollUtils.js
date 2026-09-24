/**
 * Scroll containers that Mobile Safari may move when the soft keyboard opens.
 * Nested overflow areas (auth wrappers inside v-main) are especially prone to
 * staying scrolled after the keyboard closes, which tucks content under the
 * fixed app bar and leaves a blank gap at the bottom of the screen.
 */
const SCROLLABLE_SELECTORS = [
  '.v-main',
  '.login-wrapper',
  '.verify-wrapper',
  '.reset-wrapper',
  '.newpassword-wrapper',
  '.register-container'
]

function isEditableElement (el) {
  if (!el || el === document.body || el === document.documentElement) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return !!el.isContentEditable
}

/**
 * Reset page scroll so content starts below the navbar.
 * Scrolls window, document, body, v-main, and known auth page wrappers.
 * Use after route changes or when async content causes layout shifts.
 */
export function resetPageScroll () {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  // iOS Safari can leave visualViewport.offsetTop non-zero after the keyboard
  // dismisses. Nudging by that offset then back to 0 clears the stuck shift.
  const vv = window.visualViewport
  if (vv && vv.offsetTop) {
    window.scrollTo(0, vv.offsetTop)
    window.scrollTo(0, 0)
  }

  SCROLLABLE_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.scrollTop = 0
      el.scrollLeft = 0
    })
  })
}

/**
 * Reset scroll on next frame(s). Use when layout may change asynchronously
 * (e.g. after async data loads). Mobile Safari can apply scroll restoration
 * after the route render, so we repeat on multiple frames.
 */
export function resetPageScrollDeferred (vm) {
  resetPageScroll()
  if (vm) {
    vm.$nextTick(() => {
      window.requestAnimationFrame(() => {
        resetPageScroll()
        window.requestAnimationFrame(resetPageScroll)
      })
    })
  } else {
    window.requestAnimationFrame(() => {
      resetPageScroll()
      window.requestAnimationFrame(resetPageScroll)
    })
  }
}

/**
 * Mobile Safari often finishes its keyboard animation after the first paint/
 * focusout. Repeat the reset over a short window so the layout does not stay
 * shifted under the fixed app bar.
 */
export function resetPageScrollAfterKeyboard (vm) {
  resetPageScrollDeferred(vm)
  ;[50, 150, 350, 500].forEach((ms) => {
    window.setTimeout(resetPageScroll, ms)
  })
}

/**
 * Install listeners that undo iOS/Android soft-keyboard scroll side effects.
 * Call once from the app root; returns an uninstall function.
 */
export function installMobileKeyboardScrollFix () {
  if (typeof window === 'undefined') return () => {}

  let lastHeight = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight
  let blurTimer = null

  const onViewportResize = () => {
    const vv = window.visualViewport
    if (!vv) return
    const height = vv.height
    // Keyboard dismissed: visual viewport grew again.
    if (height - lastHeight > 80 && !isEditableElement(document.activeElement)) {
      resetPageScrollAfterKeyboard()
    }
    lastHeight = height
  }

  const onViewportScroll = () => {
    const vv = window.visualViewport
    if (!vv || isEditableElement(document.activeElement)) return
    // Stuck offset with keyboard closed — pull content back under the app bar.
    if (vv.offsetTop > 0 && vv.height >= window.innerHeight - 10) {
      resetPageScroll()
    }
  }

  const onFocusOut = (event) => {
    if (!isEditableElement(event.target)) return
    window.clearTimeout(blurTimer)
    blurTimer = window.setTimeout(() => {
      if (isEditableElement(document.activeElement)) return
      resetPageScrollAfterKeyboard()
    }, 50)
  }

  const onOrientationChange = () => {
    resetPageScrollAfterKeyboard()
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onViewportResize)
    window.visualViewport.addEventListener('scroll', onViewportScroll)
  }
  document.addEventListener('focusout', onFocusOut)
  window.addEventListener('orientationchange', onOrientationChange)

  return () => {
    window.clearTimeout(blurTimer)
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', onViewportResize)
      window.visualViewport.removeEventListener('scroll', onViewportScroll)
    }
    document.removeEventListener('focusout', onFocusOut)
    window.removeEventListener('orientationchange', onOrientationChange)
  }
}
