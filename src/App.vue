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
      app
      dark>

      <router-link
        :to="{ path: '/sessions' }"
        class="logo-link">
        <img class="logo" src="/images/opencap-logo-dark.png" alt="OpenCap"/>
      </router-link>
      
      <v-spacer class="navbar-spacer"></v-spacer>

      <div class="navbar-actions d-flex align-center">
        <QRCodeDialog class="navbar-qr"/>
        <profile-dropdown v-if="showProfileInNavbar" class="navbar-profile"></profile-dropdown>
      </div>

    </v-app-bar>

    <v-main>      
      <router-view :key="$route.fullPath"/>
    </v-main>
  </v-app>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { notificationState, hideNotification } from '@/util/notificationStore.js'
import { resetPageScroll, resetPageScrollDeferred } from '@/util/scrollUtils.js'
import QRCodeDialog from './components/ui/QRCodeDialog.vue'
import ProfileDropdown from './components/ui/ProfileDropDown.vue';

export default {
  name: 'App',
  components: {
    QRCodeDialog,
    'profile-dropdown': ProfileDropdown},
  data () {
    return {
      logoutTimer: null
    }
  },
  created () {
    this.startTimer()
  },
  mounted () {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  },
  beforeDestroy () {
    this.cancelTimer()
  },
  methods: {
    ...mapActions('auth', ['logout']),
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
      resetPageScroll()
      // Mobile Safari can apply scroll restoration after the route render.
      // Repeat reset on next frames so the new page always starts below navbar.
      resetPageScrollDeferred(this)
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
    appStyle () {
      return {
        background: this.$vuetify.theme.themes.dark.background
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
      hideNotification()
      this.cancelTimer()
      this.startTimer()
      this.resetMainScroll()
    }
  }
}
</script>

<style lang="scss" scoped>
.logo-link {
  display: flex;
  align-items: center;
  flex-shrink: 1;
  min-width: 0;
  max-width: 50%;
  
  @media (max-width: 599px) {
    max-width: 40%;
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
    max-width: 200px;
  }
}

.navbar-spacer {
  flex: 1 1 auto;
  min-width: 16px;
}

.navbar-actions {
  flex-shrink: 0;
  gap: 8px;
  position: relative;
  z-index: 1001;
  min-width: 0;
  
  @media (max-width: 599px) {
    gap: 4px;
  }
}

.navbar-qr {
  flex-shrink: 0;
  
  @media (max-width: 599px) {
    min-width: auto;
  }
}

.navbar-profile {
  margin-left: 0;
  
  @media (min-width: 600px) {
    margin-left: 16px;
  }
}

::v-deep .v-app-bar {
  z-index: 1100;
  background: rgba(30, 30, 30, 0.98) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  
  .v-toolbar__content {
    flex-wrap: nowrap;
    overflow: visible;
    min-width: 0;
    
    @media (max-width: 599px) {
      padding: 4px 8px;
    }
  }
}

// Ensure QR button is visible on mobile
::v-deep .navbar-qr {
  .v-btn {
    min-width: auto !important;
    padding: 0 8px !important;
    
    @media (max-width: 599px) {
      padding: 0 4px !important;
      min-width: 36px !important;
      width: auto !important;
    }
  }
}
</style>

<style lang="scss">
/* Round top corners of mobile bottom-sheet menus (content-class="bottom-sheet-rounded") */
.bottom-sheet-rounded.v-dialog__content {
  border-radius: 16px 16px 0 0 !important;
  overflow: hidden;
}

/* Bottom sheet menu content – match card theme */
.session-menu-sheet,
.subject-menu-sheet,
.recycle-menu-sheet {
  background: rgba(30, 30, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  color: rgba(255, 255, 255, 0.9) !important;
}

.session-menu-sheet .v-divider,
.subject-menu-sheet .v-divider,
.recycle-menu-sheet .v-divider {
  border-color: rgba(255, 255, 255, 0.08) !important;
}

/* Dialog cards use unified app card style (see main.scss) */

/* Slightly stronger scrim so overlay is clearly visible */
.v-overlay__scrim {
  background-color: rgba(0, 0, 0, 0.65) !important;
}
</style>
