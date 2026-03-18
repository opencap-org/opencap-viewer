/**
 * Reset page scroll so content starts below the navbar.
 * Scrolls window, document, body, and v-main (the main content area).
 * Use after route changes or when async content causes layout shifts.
 */
export function resetPageScroll () {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  const vMain = document.querySelector('.v-main')
  if (vMain) vMain.scrollTop = 0
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
