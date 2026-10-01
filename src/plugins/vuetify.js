import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';
import { DARK_THEME, getStoredTheme } from '@/util/theme.js'

Vue.use(Vuetify);

// App chrome (v-app-bar) uses z-index ~1100. Raise dialog stacking in JS so
// dialogs appear above it without CSS !important z-index overrides that break
// Vuetify's click-outside / Escape dismiss logic (closeConditional).
const DIALOG_STACK_MIN_Z_INDEX = 2100
Vue.mixin({
  created() {
    if (this.$options.name === 'v-dialog') {
      this.stackMinZIndex = Math.max(this.stackMinZIndex || 0, DIALOG_STACK_MIN_Z_INDEX)
    }
  }
})

const initialTheme = getStoredTheme()

if (typeof document !== 'undefined') {
  document.documentElement.dataset.appTheme = initialTheme
}

export default new Vuetify({
  theme: {
    dark: initialTheme === DARK_THEME,
    themes: {
      dark: {
        primary: '#FFFFFF',
        background: '#000000'
      },
      light: {
        primary: '#315f91',
        secondary: '#587ca5',
        background: '#f4f6f8'
      }
    },
  },
});
