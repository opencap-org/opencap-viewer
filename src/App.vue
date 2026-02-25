<template>
  <v-app :style="appStyle">
    <!-- Landscape orientation blocker for mobile -->
    <div v-if="showLandscapeBlocker" class="landscape-blocker">
      <div class="landscape-blocker-content">
        <v-icon size="64" color="white">mdi-rotate-right</v-icon>
        <h2>Please rotate your device</h2>
        <p>This app is designed for portrait mode</p>
      </div>
    </div>

    <v-app-bar
      ref="appBar"
      app
      dark>

      <router-link
        :to="{ path: '/sessions' }"
        class="logo-link">
        <img height="54px" class="logo" src="/images/opencap-logo-dark.png"/>
      </router-link>
      
      <v-spacer class="navbar-spacer"></v-spacer>

      <div class="navbar-actions d-flex align-center">
        <QRCodeDialog class="navbar-qr"/>
        <profile-dropdown v-if="verified" class="navbar-profile"></profile-dropdown>
      </div>

    </v-app-bar>

    <v-main>      
      <router-view :key="$route.fullPath"/>
    </v-main>
  </v-app>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import QRCodeDialog from './components/ui/QRCodeDialog.vue'
import ProfileDropdown from './components/ui/ProfileDropDown.vue';

export default {
  name: 'App',
  components: {
    QRCodeDialog,
    'profile-dropdown': ProfileDropdown},
  data () {
    return {
      logoutTimer: null,
      showLandscapeBlocker: false
    }
  },
  created () {
    this.startTimer()
    this.checkOrientation()
  },
  mounted () {
    window.addEventListener('resize', this.checkOrientation)
    window.addEventListener('orientationchange', this.checkOrientation)
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  },
  beforeDestroy () {
    this.cancelTimer()
    window.removeEventListener('resize', this.checkOrientation)
    window.removeEventListener('orientationchange', this.checkOrientation)
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
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0

      const vMain = this.$el && this.$el.querySelector('.v-main')
      if (vMain) {
        vMain.scrollTop = 0
      }

      // Mobile Safari can apply scroll restoration after the route render.
      // Repeat reset on next frames so the new page always starts below navbar.
      this.$nextTick(() => {
        window.requestAnimationFrame(() => {
          window.scrollTo(0, 0)
          document.documentElement.scrollTop = 0
          document.body.scrollTop = 0
          const nextVMain = this.$el && this.$el.querySelector('.v-main')
          if (nextVMain) nextVMain.scrollTop = 0
        })
      })
    },
    checkOrientation () {
      // Only show landscape blocker on phones (not desktops/tablets)
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        this.showLandscapeBlocker = false
        return
      }

      const ua = navigator.userAgent || ''
      const isPhone = /Android.+Mobile|iPhone|iPod|Windows Phone|Mobi/i.test(ua)
      const isLandscape = window.innerWidth > window.innerHeight
      this.showLandscapeBlocker = isPhone && isLandscape
    }
  },
  computed: {
    ...mapState({
      verified: state => state.auth.verified,
      sessionTime: state => state.auth.sessionTime
    }),
    appStyle () {
      return {
        background: this.$vuetify.theme.themes.dark.background
      }
    }
  },
  watch: {
    $route () {
      this.cancelTimer()
      this.startTimer()
      this.resetMainScroll()
    }
  }
}
</script>

<style lang="scss" scoped>
.landscape-blocker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.98);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.landscape-blocker-content {
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 400px;

  h2 {
    font-size: 1.5rem;
    font-weight: 500;
    margin: 0;
  }

  p {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
  }

  .v-icon {
    animation: rotate-bounce 2s ease-in-out infinite;
  }
}

@keyframes rotate-bounce {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

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
  max-width: 100%;
  width: auto;
  
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
  z-index: 5;
  
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
