/**
 * Global notification state - used by App.vue snackbar for app-wide visibility.
 * ErrorMessage.js updates this so notifications are always visible regardless of page layout.
 */
import Vue from 'vue'

export const notificationState = Vue.observable({
  show: false,
  text: '',
  type: 'info', // 'error' | 'success' | 'info' | 'warning'
  timeout: 10000
})

export function showNotification ({ text, type = 'info', timeout = 10000 }) {
  Object.assign(notificationState, {
    show: true,
    text: String(text),
    type,
    timeout: type === 'error' ? 10000 : timeout
  })
}

export function hideNotification () {
  notificationState.show = false
}
