/**
 * Global notification state - used by App.vue snackbar for app-wide visibility.
 * ErrorMessage.js updates this so notifications are always visible regardless of page layout.
 */
import Vue from 'vue'

export const notificationState = Vue.observable({
  show: false,
  text: '',
  type: 'info', // 'error' | 'success' | 'info' | 'warning'
  timeout: 10000,
  actionText: null, // optional custom button label (default: 'Close')
  actionOnClick: null  // optional callback when action is clicked
})

export function showNotification ({ text, type = 'info', timeout = 10000, actionText, actionOnClick } = {}) {
  Object.assign(notificationState, {
    show: true,
    text: String(text),
    type,
    timeout: type === 'error' ? 10000 : timeout,
    actionText: actionText || null,
    actionOnClick: actionOnClick || null
  })
}

export function hideNotification () {
  notificationState.show = false
}
