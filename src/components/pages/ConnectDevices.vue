<template>
  <MainLayout
    :class="{ 'monocular-navigation': isMonocularMode }"
    rightButton="Next"
    column
    :step="1"
    :rightDisabled="loading"
    @right="onNext">
    <template v-slot:left>
      <v-btn text @click="navigateBack">
        <v-icon left>mdi-arrow-left</v-icon>
        {{ backLabel }}
      </v-btn>
    </template>

    <v-card class="d-flex flex-column">
      <v-card-text class="d-flex flex-column align-center">

        <div class="d-flex step-1 align-center flex-wrap">
          <div class="qr-section d-flex flex-column align-center">
            <v-alert
              v-if="isMonocularMode"
              type="info"
              dense
              outlined
              class="mono-connect-message mb-2"
            >
              Connect only one phone for monocular recording
            </v-alert>
            <div class="image-container qr-container d-flex align-center justify-center my-1 qr-code-wrapper">
            <v-progress-circular
              v-if="loading"
              indeterminate 
              color="grey" 
              size="32" 
              width="5"/>

            <img
              v-else
              class="w-100 h-100"
              :src="session.qrcode">
            </div>
          </div>

          <div class="d-flex flex-column flex-grow-1 justify-space-between my-1 instructions-wrapper">
            <h1 class="my-4">1. Install or update to <a href="https://apps.apple.com/us/app/opencap/id1630513242" target="_blank" rel="noopener noreferrer" class="app-store-link">OpenCap app<span v-if="isMonocularMode"> version 2.0+</span></a> from the App Store</h1>
            <h1 class="my-4">2. Open the app and scan the QR code</h1>
            <div v-if="showOpenInAppButton" class="open-in-app-block my-2">
              <p class="mb-2">On this device? Open in App deeplink also requires app version 2.0+.</p>
              <v-btn color="grey darken-4" dark block @click="openInApp">Open app with this session (v2.0+)</v-btn>
            </div>
            <h1 class="my-4">3. Mount your phone vertically or horizontally (unlock portrait orientation) on a tripod</h1>
            <h1 class="my-4">4. Position the tripod and camera to capture the volume of interest</h1>
            <h1
              v-if="!isMonocularMode"
              class="my-4">
              5. Repeat 1-4 for all phones you want to connect
            </h1>
            <h1 class="my-4">
              6. Have the person practice the activity and verify that they are fully in view of
              <span v-if="isMonocularMode"> the camera</span>
              <span v-else> at least 2 cameras</span>
            </h1>
            <p
              v-if="isMonocularMode"
              class="my-2">
              <a
                href="https://www.opencap.ai/best-practices?variant=monocular"
                target="_blank"
                rel="noopener noreferrer"
                class="app-store-link">
                Read monocular best practices
              </a>
            </p>
          </div>
        </div>

        <!--div class="cameras d-flex align-center justify-center mt-5">
          <v-text-field
            v-model="cameras"
            label="Connected cameras"
            class="cameras"/>
        </div-->
      </v-card-text>
    </v-card>
  </MainLayout>
</template>

<script>
import { mapMutations, mapActions, mapState } from 'vuex'
import { apiInfo, clearToastMessages} from "@/util/ErrorMessage.js";
import { getSessionDeepLink } from '@/util/SessionDeepLink.js'
import MainLayout from '@/layout/MainLayout'

export default {
  name: 'ConnectDevices',
  components: {
    MainLayout
  },
  data () {
    return {
      loading: true,
      cameras: 2
    }
  },
  async mounted () {
    if (!localStorage.getItem('iosAppNotificationShown')) {
      apiInfo("The new iOS app (2.0) is available on the App Store.", 20000, {text : "Go to App Store", onClick : () => {window.open("https://apps.apple.com/us/app/opencap/id1630513242", "_blank");}, position: 'top-center'});
      localStorage.setItem('iosAppNotificationShown', 'true');
    }
    if (this.$router.params != undefined) {
        await this.loadSession(this.$route.params.id)
    } else {
      try {
        this.clearAll()
        await this.initSession()
      } finally {
        this.loading = false
      }
    }
  },
  computed: {
    ...mapState({ 
      session: state => state.data.session
    }),
    isMobileOrTablet() {
      return this.$vuetify.breakpoint.smAndDown
    },
    sessionDeepLinkUrl() {
      if (!this.session?.id) return null
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
      const subjectName = this.session?.subject_name || null
      return getSessionDeepLink(this.session.id, token, subjectName)
    },
    isMonocularMode() {
      return this.$route.query.isMono === 'true'
    },
    cameFromDeviceCheck() {
      return this.$route.query.fromDeviceCheck === 'true'
    },
    backLabel() {
      if (this.cameFromDeviceCheck || this.$vuetify.breakpoint.smAndDown) {
        return 'Back'
      }
      return 'Back to recording mode'
    },
    showOpenInAppButton() {
      return this.isMobileOrTablet && this.isMonocularMode && this.$route.query.fromDevice === 'true' && this.session?.id && this.sessionDeepLinkUrl
    }
  },
  methods: {
    ...mapMutations('data', ['clearAll', 'setConnectDevices']),
    ...mapActions('data', ['initSession']),
    navigateBack() {
      if (this.cameFromDeviceCheck) {
        this.$router.push({ name: 'DeviceCheck' })
        return
      }
      this.$router.push({ name: 'RecordingMode' })
    },
    onNext () {

      clearToastMessages();
      this.setConnectDevices({
        cameras: this.cameras
      })
      
      let path = `/${this.session.id}/calibration`
      if (this.isMonocularMode) {
        path = `/${this.session.id}/neutral?isMono=true`
      }
      this.$router.push(path)
    },
    openInApp() {
      if (!this.session?.id) return
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
      const subjectName = this.session?.subject_name || null
      const url = getSessionDeepLink(this.session.id, token, subjectName)
      if (url) window.location.href = url
    }
  }
}
</script>

<style lang="scss" scoped>
.step-1 {
  width:100%;
  justify-content: flex-start;
  
  @media (min-width: 960px) {
    justify-content: space-between;
  }
  
  @media (max-width: 959px) {
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .qr-section {
    flex-shrink: 0;
    order: 2;
  }
  
  .qr-code-wrapper {
    width: 200px;
    height: 200px;
    
    @media (min-width: 960px) {
      order: 2;
      margin-left: 24px;
    }
    
    @media (max-width: 959px) {
      order: 1;
      width: 180px;
      height: 180px;
      margin-bottom: 24px;
      margin-left: 0;
    }
    
    @media (max-width: 599px) {
      width: 150px;
      height: 150px;
      margin-bottom: 16px;
    }
    
    .qr-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 8px;
      
      img {
        border-radius: 8px;
      }
    }
  }
  
  .instructions-wrapper {
    order: 1;
    max-width: 100%;
    flex: 1 1 auto;
    text-align: left;
    
    @media (min-width: 960px) {
      order: 1;
      max-width: calc(100% - 224px);
    }
    
    @media (max-width: 959px) {
      order: 2;
      width: 100%;
    }
  }
  
  h1 {
    font-size: 1.5rem;
    text-align: left;
    
    @media (max-width: 959px) {
      font-size: 1.25rem;
      margin-top: 8px !important;
      margin-bottom: 8px !important;
    }
    
    @media (max-width: 599px) {
      font-size: 1rem;
      line-height: 1.4;
      margin-top: 6px !important;
      margin-bottom: 6px !important;
    }
  }
  
  .app-store-link {
    color: #64b5f6;
    text-decoration: underline;
    text-underline-offset: 2px;
    
    &:hover {
      color: #90caf9;
    }
  }
}

.cameras {
  width: 120px;
}

.monocular-navigation ::v-deep .navigation {
  flex-wrap: nowrap;
}

.monocular-navigation ::v-deep .navigation .slot {
  flex: 0 1 auto;
}

.monocular-navigation ::v-deep .navigation .slot button {
  width: auto;
  white-space: nowrap;
}

.monocular-navigation ::v-deep .navigation .slot:last-child button {
  width: 140px;
  min-width: 140px;
  height: 48px !important;
  min-height: 48px !important;
  max-height: 48px !important;
}

.mono-connect-message {
  max-width: 220px;
  text-align: center;
  font-size: 0.9rem;
}
</style>
