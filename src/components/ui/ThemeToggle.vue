<template>
  <div
    class="theme-toggle-control"
    :class="{ 'theme-toggle-control--menu': menu }"
    role="switch"
    tabindex="0"
    :aria-checked="String(isDarkTheme)"
    :aria-label="ariaLabel"
    @click="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle">
    <v-icon small class="theme-toggle-control__icon">
      {{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}
    </v-icon>
    <span class="theme-toggle-control__label">{{ label }}</span>
    <v-switch
      :input-value="isDarkTheme"
      class="theme-toggle-control__switch"
      color="blue lighten-1"
      dense
      inset
      hide-details
      readonly
      :aria-label="ariaLabel"
      @click.native.stop.prevent="toggle" />
  </div>
</template>

<script>
import { applyTheme, DARK_THEME, LIGHT_THEME } from '@/util/theme.js'

export default {
  name: 'ThemeToggle',
  props: {
    menu: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    isDarkTheme () {
      return this.$vuetify.theme.dark
    },
    label () {
      return this.isDarkTheme ? 'Dark mode' : 'Light mode'
    },
    ariaLabel () {
      return `Switch to ${this.isDarkTheme ? 'light' : 'dark'} mode`
    }
  },
  methods: {
    toggle () {
      applyTheme(this.$vuetify, this.isDarkTheme ? LIGHT_THEME : DARK_THEME)
      this.$emit('change', { dark: this.$vuetify.theme.dark })
    }
  }
}
</script>

<style lang="scss" scoped>
.theme-toggle-control {
  align-items: center;
  border-radius: 8px;
  color: var(--app-text-primary, rgba(255, 255, 255, 0.86));
  cursor: pointer;
  display: flex;
  gap: 6px;
  height: 44px;
  justify-content: flex-start;
  min-width: 0;
  padding: 0 8px;
  box-sizing: border-box;
  width: 100%;
  white-space: nowrap;
}

.theme-toggle-control__icon {
  color: currentColor;
  flex: 0 0 auto;
}

.theme-toggle-control__label {
  flex: 1 1 auto;
  font-size: 0.875rem;
  font-weight: 500;
}

.theme-toggle-control__switch {
  flex: 0 0 auto;
  margin: 0;
  margin-left: auto;
  padding: 0;
}

.theme-toggle-control__switch::v-deep .v-input__slot {
  margin: 0;
}

.theme-toggle-control__switch::v-deep .v-input--selection-controls__input {
  margin-right: 0;
}
</style>
