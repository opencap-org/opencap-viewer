<template>
  <v-app :style="{background: $vuetify.theme.themes.dark.background}">
    <v-app-bar
      app      
      dark>

      <router-link
        v-if="showLink"
        :to="{ name: 'SelectSession' }"
        class="logo-link">
          <img height="59px" class="logo" src="/images/opencap-logo-dark.png"/>
        </router-link>

      <div
      v-else
      class="logo-link">
        <img height="59px" class="logo" src="/images/opencap-logo-dark.png"/>
      </div>
      
      <v-spacer class="navbar-spacer"></v-spacer>

      <div class="navbar-actions d-flex align-center">
        <QRCodeDialog class="navbar-qr"/>
        <profile-dropdown v-if="verified" class="navbar-profile"></profile-dropdown>
      </div>

    </v-app-bar>

    <v-main>      
      <router-view/>
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
  computed: {
    ...mapState({
      loggedIn: state => state.auth.loggedIn,
      verified: state => state.auth.verified,
      sessionTime: state => state.auth.sessionTime
    }),
    showLink () {
      return this.loggedIn && this.verified && this.$route.name !== 'SelectSession'
    }
  },
  watch: {
    $route () {
      this.cancelTimer()
      this.startTimer()
    }
  },
  data () {
    return {
      logoutTimer: null
    }
  },
  created () {
    this.startTimer()
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
  height: 59px;
  max-width: 100%;
  width: auto;
  
  @media (max-width: 599px) {
    height: 35px;
    margin-top: 5px;
    margin-bottom: 5px;
  }
  
  @media (min-width: 600px) and (max-width: 959px) {
    height: 45px;
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
