/**
 * Global notification state - used by App.vue snackbar for app-wide visibility.
 * ErrorMessage.js updates this so notifications are always visible regardless of page layout.
 */
import Vue from 'vue'

const notificationQueue = []

export const notificationState = Vue.observable({
  show: false,
  text: '',
  type: 'info', // 'error' | 'success' | 'info' | 'warning'
  timeout: 10000,
  actionText: null, // optional custom button label (default: 'Close')
  actionOnClick: null  // optional callback when action is clicked
})

function normalizeNotification ({ text, type = 'info', timeout = 10000, actionText, actionOnClick } = {}) {
  return {
    text: String(text),
    type,
    timeout: type === 'error' ? 10000 : timeout,
    actionText: actionText || null,
    actionOnClick: actionOnClick || null
  }
}

function applyNotification (notification) {
  Object.assign(notificationState, {
    show: true,
    ...notification
  })
}

function clearActiveNotification () {
  Object.assign(notificationState, {
    show: false,
    text: '',
    type: 'info',
    timeout: 10000,
    actionText: null,
    actionOnClick: null
  })
}

function showNextNotification () {
  if (notificationQueue.length === 0) {
    clearActiveNotification()
    return
  }

  Vue.nextTick(() => {
    applyNotification(notificationQueue.shift())
  })
}

export function showNotification (notification) {
  const nextNotification = normalizeNotification(notification)

  if (!notificationState.show && notificationQueue.length === 0) {
    applyNotification(nextNotification)
    return
  }

  notificationQueue.push(nextNotification)
}

export function hideNotification () {
  clearActiveNotification()
  showNextNotification()
}

export function clearNotifications () {
  notificationQueue.splice(0, notificationQueue.length)
  clearActiveNotification()
}
