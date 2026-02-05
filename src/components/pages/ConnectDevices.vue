<template>
  <MainLayout
    rightButton="Next"
    column
    :step="1"
    :rightDisabled="loading"
    @right="onNext">

    <v-card class="d-flex flex-column">
      <v-card-text class="d-flex flex-column align-center">

        <div class="d-flex step-1 align-center flex-wrap">
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

          <div class="d-flex flex-column flex-grow-1 justify-space-between my-1 instructions-wrapper">
            <h1 class="my-4">1. Open the OpenCap app on your phone</h1>
            <h1 class="my-4">2. Scan the QR code</h1>
            <div v-if="showOpenInAppButton" class="open-in-app-block my-2">
              <p class="mb-2">On this device?</p>
              <v-btn block @click="openInApp">Open app with this session</v-btn>
            </div>
            <h1 class="my-4">3. Mount your phone vertically or horizontally (unlock portrait orientation) on a tripod</h1>
            <h1 class="my-4">4. Position the tripod and camera to capture the volume of interest</h1>
            <h1 class="my-4">5. Repeat 1-4 for all phones you want to connect</h1>
            <h1 class="my-4">6. Have the person practice the activity and verify that they are fully in view of at least 2 cameras</h1>
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
      apiInfo("The iOS app is now available on the App Store.", 20000, {text : "Go to App Store", onClick : () => {window.open("https://apps.apple.com/us/app/opencap/id1630513242", "_blank");}, position: 'top-center'});
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
      return getSessionDeepLink(this.session.id, token)
    },
    isMonocularMode() {
      return this.$route.query.isMono === 'true'
    },
    showOpenInAppButton() {
      return this.isMobileOrTablet && this.isMonocularMode && this.session?.id && this.sessionDeepLinkUrl
    }
  },
  methods: {
    ...mapMutations('data', ['clearAll', 'setConnectDevices']),
    ...mapActions('data', ['initSession']),
    onNext () {

      clearToastMessages();
      this.setConnectDevices({
        cameras: this.cameras
      })
      
      let path = `/${this.session.id}/calibration`
      if (this.isMonocularMode) {
        path += '?isMono=true'
      }
      this.$router.push(path)
    },
    openInApp() {
      if (!this.session?.id) return
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
      const url = getSessionDeepLink(this.session.id, token)
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

  .qr-code-wrapper {
    width: 200px;
    height: 200px;
    flex-shrink: 0;
    order: 2;
    
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
}

.cameras {
  width: 120px;
}
</style>
