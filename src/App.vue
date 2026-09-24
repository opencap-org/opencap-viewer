<template>
  <v-app :style="appStyle">
    <!-- Global notification snackbar - ensures errors/success/info visible across entire app -->
    <v-snackbar
      v-model="globalNotificationShow"
      :color="notificationState.type === 'error' ? 'error' : notificationState.type === 'success' ? 'success' : notificationState.type === 'warning' ? 'warning' : 'info'"
      :timeout="notificationState.timeout"
      app
      top
      centered
      content-class="global-notification-snackbar">
      {{ notificationState.text }}
      <template v-slot:action="{ attrs }">
        <v-btn v-bind="attrs" text @click="onNotificationAction">
          {{ notificationState.actionText || 'Close' }}
        </v-btn>
      </template>
    </v-snackbar>

    <v-app-bar
      ref="appBar"
      app>

      <router-link
        :to="{ path: '/sessions' }"
        class="logo-link">
        <img
          class="logo"
          :src="isDarkTheme ? '/images/opencap-logo-dark.png' : '/images/opencap-logo.png'"
          alt="OpenCap"/>
      </router-link>
      
      <v-spacer class="navbar-spacer"></v-spacer>

      <div class="navbar-actions d-flex align-center">
        <!-- md+ (~960px, iPad landscape and up): inline toggles. Narrower: gear menu. -->
        <div
          v-if="showNavbarSettings"
          class="navbar-inline-toggles d-none d-md-flex align-center">
          <LocalDataSaveToggle
            v-if="showSessionNavbarControls"
            class="navbar-local-save"
            @change="onLocalDataSaveChange" />
          <LidarToggle
            v-if="showLidarNavbarControls"
            class="navbar-lidar"
            @change="onLidarChange" />
        </div>
        <NavbarSettings
          class="navbar-settings d-flex d-md-none"
          :show-local-save="showSessionNavbarControls"
          :show-lidar="showLidarNavbarControls"
          @local-save-change="onLocalDataSaveChange"
          @lidar-change="onLidarChange" />
        <v-btn
          icon
          class="theme-toggle d-none d-md-inline-flex"
          :aria-label="themeToggleLabel"
          :title="themeToggleLabel"
          @click="toggleTheme">
          <v-icon>{{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
        <QRCodeDialog class="navbar-qr"/>
        <profile-dropdown v-if="showProfileInNavbar" class="navbar-profile"></profile-dropdown>
      </div>

    </v-app-bar>

    <v-main :key="$route.fullPath">
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import { mapActions, mapMutations, mapState } from 'vuex'
import { notificationState, hideNotification, clearNotifications } from '@/util/notificationStore.js'
import {
  installMobileKeyboardScrollFix,
  resetPageScrollAfterKeyboard
} from '@/util/scrollUtils.js'
import { canShowLidarToggle, canShowLocalDataSaveToggle, loadUserGroups } from '@/util/staffAccess.js'
import { applyTheme, DARK_THEME, LIGHT_THEME } from '@/util/theme.js'
import QRCodeDialog from './components/ui/QRCodeDialog.vue'
import NavbarSettings from './components/ui/NavbarSettings.vue'
import LocalDataSaveToggle from './components/ui/LocalDataSaveToggle.vue'
import LidarToggle from './components/ui/LidarToggle.vue'
import ProfileDropdown from './components/ui/ProfileDropDown.vue';

export default {
  name: 'App',
  components: {
    NavbarSettings,
    LocalDataSaveToggle,
    LidarToggle,
    QRCodeDialog,
    'profile-dropdown': ProfileDropdown},
  data () {
    return {
      logoutTimer: null,
      userGroups: [],
      uninstallKeyboardScrollFix: null
    }
  },
  created () {
    this.startTimer()
  },
  mounted () {
    window.addEventListener('pageshow', this.onPageShow)
    this.uninstallKeyboardScrollFix = installMobileKeyboardScrollFix()
    this.resetMainScroll()
    this.loadBetaAccessGroups()
  },
  beforeDestroy () {
    this.cancelTimer()
    window.removeEventListener('pageshow', this.onPageShow)
    if (this.uninstallKeyboardScrollFix) {
      this.uninstallKeyboardScrollFix()
      this.uninstallKeyboardScrollFix = null
    }
  },
  methods: {
    ...mapActions('auth', ['logout']),
    ...mapMutations('data', ['setSessionSaveLocal', 'setSessionUseLidar']),
    onLocalDataSaveChange ({ saveLocal, saveDataLocally }) {
      this.setSessionSaveLocal(saveLocal ?? saveDataLocally)
    },
    onLidarChange ({ useLidar }) {
      this.setSessionUseLidar(useLidar)
    },
    toggleTheme () {
      applyTheme(this.$vuetify, this.isDarkTheme ? LIGHT_THEME : DARK_THEME)
    },
    async loadBetaAccessGroups () {
      if (!this.verified) {
        this.userGroups = []
        return
      }

      try {
        this.userGroups = await loadUserGroups({ force: true })
      } catch {
        this.userGroups = []
      }
    },
    startTimer () {
      this.logoutTimer = window.setTimeout(this.logoutTimerHandler, this.sessionTime)
    },
    cancelTimer () {
      if (this.logoutTimer) {
        window.clearTimeout(this.logoutTimer)
      }
    },
    logoutTimerHandler () {
      // redirect to login and remove all info
      this.logout()
    },
    resetMainScroll () {
      // Mobile Safari can apply scroll restoration after the route render, and
      // may still be finishing a keyboard dismiss animation during navigation.
      resetPageScrollAfterKeyboard(this)
    },
    onPageShow () {
      this.resetMainScroll()
    },
    onNotificationAction () {
      if (notificationState.actionOnClick) {
        notificationState.actionOnClick()
      }
      hideNotification()
    }
  },
  computed: {
    ...mapState({
      verified: state => state.auth.verified,
      sessionTime: state => state.auth.sessionTime
    }),
    showProfileInNavbar () {
      const authRouteNames = ['Login', 'Register', 'Verify', 'ResetPassword', 'NewPassword']
      return this.verified && !authRouteNames.includes(this.$route.name)
    },
    showSessionNavbarControls () {
      return this.$route.name === 'Session' &&
        canShowLocalDataSaveToggle({ groups: this.userGroups })
    },
    showLidarNavbarControls () {
      return this.$route.name === 'Session' &&
        canShowLidarToggle({ groups: this.userGroups })
    },
    showNavbarSettings () {
      return this.showSessionNavbarControls || this.showLidarNavbarControls
    },
    isDarkTheme () {
      return this.$vuetify.theme.dark
    },
    themeToggleLabel () {
      return `Switch to ${this.isDarkTheme ? 'light' : 'dark'} mode`
    },
    appStyle () {
      const theme = this.isDarkTheme
        ? this.$vuetify.theme.themes.dark
        : this.$vuetify.theme.themes.light

      return {
        background: theme.background
      }
    },
    notificationState () {
      return notificationState
    },
    globalNotificationShow: {
      get () {
        return notificationState.show
      },
      set (val) {
        if (!val) hideNotification()
      }
    }
  },
  watch: {
    $route () {
      clearNotifications()
      this.cancelTimer()
      this.startTimer()
      this.resetMainScroll()
      this.loadBetaAccessGroups()
    },
    verified () {
      this.loadBetaAccessGroups()
    }
  }
}
</script>

<style lang="scss" scoped>
.logo-link {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  max-width: min(220px, 42%);

  @media (max-width: 599px) {
    max-width: 36%;
  }

  @media (min-width: 600px) and (max-width: 959px) {
    max-width: 160px;
  }
}

.logo {
  user-select: none;
  margin-top: 10px;
  margin-bottom: 10px;
  height: 54px;
  width: auto;
  max-width: 100%;
  aspect-ratio: 5; /* logo intrinsic ratio (width/height) */
  object-fit: contain;
  object-position: left center;

  @media (max-width: 599px) {
    height: 33px;
    margin-top: 5px;
    margin-bottom: 5px;
  }

  @media (min-width: 600px) and (max-width: 959px) {
    height: 42px;
    margin-top: 7px;
    margin-bottom: 7px;
    max-width: 160px;
  }
}

.navbar-spacer {
  flex: 1 1 auto;
  min-width: 8px;
}

.navbar-actions {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  flex-wrap: nowrap;
  gap: 4px;
  position: relative;
  z-index: 1001;
  min-width: 0;
  justify-content: flex-end;

  @media (min-width: 960px) {
    gap: 8px;
  }
}

.navbar-inline-toggles {
  gap: 4px;
  flex-shrink: 0;

  @media (min-width: 960px) {
    gap: 8px;
  }
}

.navbar-settings,
.navbar-local-save,
.navbar-lidar,
.theme-toggle,
.navbar-qr,
.navbar-profile {
  flex-shrink: 0;
}

.navbar-qr {
  @media (max-width: 599px) {
    min-width: auto;
  }
}

.theme-toggle {
  flex-shrink: 0;
  width: 40px;
  height: 40px;

  @media (max-width: 599px) {
    width: 36px;
    height: 36px;
  }
}

.navbar-profile {
  margin-left: 0;

  @media (min-width: 1264px) {
    margin-left: 16px;
  }
}

::v-deep .v-app-bar {
  z-index: 1100;
  --app-bar-text: #ffffff;
  --app-bar-border: rgba(255, 255, 255, 0.08);
  background: rgba(30, 30, 30, 0.98) !important;
  border-bottom: 1px solid var(--app-bar-border);

  .v-toolbar__content {
    flex-wrap: nowrap;
    overflow: visible;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 959px) {
      padding-left: 8px;
      padding-right: 8px;
    }

    @media (max-width: 599px) {
      padding: 4px 8px;
    }
  }
}

// Ensure QR and settings buttons are visible on mobile
::v-deep .navbar-qr,
::v-deep .navbar-settings {
  .v-btn {
    min-width: auto !important;
    padding: 0 8px !important;
    color: var(--app-bar-text) !important;

    @media (max-width: 599px) {
      padding: 0 4px !important;
      min-width: 36px !important;
      width: auto !important;
    }
  }

  .v-icon,
  svg {
    color: var(--app-bar-text) !important;
    fill: var(--app-bar-text);
  }
}
</style>

<style lang="scss">
/* Drive the app-bar palette from Vuetify's global theme class. This avoids
   stale toolbar theme classes when switching modes at runtime. */
.v-application.theme--light .v-app-bar {
  --app-bar-text: #17212b;
  --app-bar-border: rgba(23, 33, 43, 0.14);
  background: rgba(255, 255, 255, 0.98) !important;
  box-shadow: 0 2px 12px rgba(31, 45, 58, 0.1) !important;
}

/* Round top corners of mobile bottom-sheet menus (content-class="bottom-sheet-rounded") */
.bottom-sheet-rounded.v-dialog__content {
  border-radius: 16px 16px 0 0 !important;
  overflow: hidden;
}

/* Bottom sheet menu content – match card theme */
.session-menu-sheet,
.subject-menu-sheet,
.recycle-menu-sheet {
  background: var(--app-surface-opaque) !important;
  border: 1px solid var(--app-border);
  border-bottom: none;
}

.session-menu-sheet .v-list,
.subject-menu-sheet .v-list,
.recycle-menu-sheet .v-list {
  background: transparent !important;
}

.session-menu-sheet .v-list-item,
.subject-menu-sheet .v-list-item,
.recycle-menu-sheet .v-list-item {
  color: var(--app-text-primary) !important;
}

.session-menu-sheet .v-divider,
.subject-menu-sheet .v-divider,
.recycle-menu-sheet .v-divider {
  border-color: var(--app-border) !important;
}

/* Dialog cards use unified app card style (see main.scss) */

/* Slightly stronger scrim so overlay is clearly visible */
.v-overlay__scrim {
  background-color: rgba(0, 0, 0, 0.65) !important;
}
</style>
