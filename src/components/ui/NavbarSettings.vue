<template>
  <div class="navbar-settings">
    <v-btn
      text
      class="navbar-settings__btn"
      aria-label="Recording settings"
      aria-haspopup="true"
      :aria-expanded="String(isOpen)"
      @click.stop="toggle">
      <svg
        class="navbar-settings__icon"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden="true"
        focusable="false">
        <path
          fill="#ffffff"
          d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.03 7.03 0 00-1.63-.94l-.36-2.54A.49.49 0 0013.9 2h-3.8a.49.49 0 00-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.71 8.48a.5.5 0 00.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.16a.5.5 0 00-.12.64l1.92 3.32c.14.24.43.34.69.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.26.12.55.02.69-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/>
      </svg>
    </v-btn>

    <transition name="fade">
      <div
        v-show="isOpen"
        class="navbar-settings__menu"
        role="menu"
        @click.stop>
        <div class="navbar-settings__header">Settings</div>
        <LocalDataSaveToggle
          v-if="showLocalSave"
          menu
          @change="$emit('local-save-change', $event)" />
        <LidarToggle
          v-if="showLidar"
          menu
          @change="$emit('lidar-change', $event)" />
      </div>
    </transition>
  </div>
</template>

<script>
import LocalDataSaveToggle from './LocalDataSaveToggle.vue'
import LidarToggle from './LidarToggle.vue'

export default {
  name: 'NavbarSettings',
  components: {
    LocalDataSaveToggle,
    LidarToggle
  },
  props: {
    showLocalSave: {
      type: Boolean,
      default: false
    },
    showLidar: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isOpen: false
    }
  },
  methods: {
    toggle () {
      this.isOpen = !this.isOpen
      this.setOutsideClickListener(this.isOpen)
    },
    close () {
      if (!this.isOpen) return
      this.isOpen = false
      this.setOutsideClickListener(false)
    },
    onClickOutside (event) {
      if (this.$el.contains(event.target)) return
      if (event.target.closest && event.target.closest('.v-dialog__content, .v-overlay')) return
      this.close()
    },
    onKeydown (event) {
      if (event.key === 'Escape') this.close()
    },
    setOutsideClickListener (active) {
      if (active) {
        document.addEventListener('click', this.onClickOutside, true)
        document.addEventListener('keydown', this.onKeydown)
      } else {
        document.removeEventListener('click', this.onClickOutside, true)
        document.removeEventListener('keydown', this.onKeydown)
      }
    }
  },
  beforeDestroy () {
    this.setOutsideClickListener(false)
  }
}
</script>

<style lang="scss" scoped>
.navbar-settings {
  position: relative;
  z-index: 1001;
  flex-shrink: 0;
}

.navbar-settings__btn {
  min-width: 36px !important;
  width: 36px;
  height: 36px;
  padding: 0 !important;
  color: #ffffff !important;
}

.navbar-settings__icon {
  display: block;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.navbar-settings__btn[aria-expanded='true'] {
  background-color: rgba(255, 255, 255, 0.12) !important;
}

.navbar-settings__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 9998;
  width: 280px;
  max-width: calc(100vw - 16px);
  padding: 8px;
  background: rgb(30, 30, 30);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

  @media (max-width: 959px) {
    position: fixed;
    top: var(--app-bar-top-offset, 56px);
    right: 8px;
    width: min(280px, calc(100vw - 16px));
  }
}

.navbar-settings__header {
  padding: 6px 12px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
