<template>
  <MainLayout
    :fixedHeight="false">

    <template v-slot:left><div class="d-none"></div></template>
    <template v-slot:right><div class="d-none"></div></template>

    <div class="device-check-wrapper d-flex flex-column align-center justify-center">
      <h1 class="mb-6 text-center">Are you on the device you'll use to record?</h1>
      <v-alert
        type="warning"
        outlined
        dense
        class="mb-6 requirement-alert">
        Monocular recording using a single device requires the OpenCap App Store app version 2.0 or newer. <a class="app-store-link" href="https://apps.apple.com/us/app/opencap/id1630513242" target="_blank" rel="noopener noreferrer">Get it on the App Store</a>.
      </v-alert>
      

      <div
        v-if="isIosDevice"
        class="options-container">
        <v-card
          class="option-card pa-6 d-flex flex-column align-center"
          outlined
          hover
          @click="onThisDevice">
          <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
          <h2 class="mb-2 option-title">Yes, this device</h2>
          <p class="text-center option-description">
            I'll record using this phone. Set up the session here and open in the app.
          </p>
          <v-btn
            color="grey darken-1"
            dark
            class="mt-4 select-button"
            large
            :loading="loading"
            :disabled="loading">
            Select
          </v-btn>
        </v-card>

        <v-card
          class="option-card pa-6 d-flex flex-column align-center"
          outlined
          hover
          @click="onDifferentDevice">
          <v-icon size="64" color="primary" class="mb-4">mdi-qrcode-scan</v-icon>
          <h2 class="mb-2 option-title">No, different device</h2>
          <p class="text-center option-description">
            I'll use a different phone to record. Show me a QR code to connect it.
          </p>
          <v-btn color="grey darken-1" dark class="mt-4 select-button" large>Select</v-btn>
        </v-card>
      </div>

      <div
        v-else
        class="non-ios-message mt-6">
        <v-alert
          type="info"
          outlined
          dense
          class="mb-4 non-ios-alert">
          Monocular recording is currently supported on iPhone and iPad using the OpenCap app. Please open this page on a compatible iOS device to continue, or use the multi-camera workflow on desktop.
        </v-alert>
      </div>

      <div class="mt-6">
        <v-btn text @click="$router.push({ name: 'RecordingMode' })">
          <v-icon left>mdi-arrow-left</v-icon>
          {{ backLabel }}
        </v-btn>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import { mapMutations, mapActions, mapState } from 'vuex'
import { apiError } from '@/util/ErrorMessage.js'
import MainLayout from '@/layout/MainLayout'

export default {
  name: 'DeviceCheck',
  components: {
    MainLayout
  },
  data() {
    return {
      loading: false
    }
  },
  computed: {
    ...mapState({
      session: state => state.data.session
    }),
    backLabel() {
      return this.$vuetify.breakpoint.smAndDown ? 'Back' : 'Back to recording mode'
    },
    isIosDevice() {
      if (typeof navigator === 'undefined') {
        return false
      }

      const ua = navigator.userAgent || ''
      const isIOS = /iPhone|iPad|iPod/i.test(ua)

      // iPadOS 13+ reports itself as Mac; detect via touch support
      const isIPadOS =
        !isIOS &&
        navigator.platform === 'MacIntel' &&
        typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 1

      return isIOS || isIPadOS
    }
  },
  methods: {
    ...mapMutations('data', ['clearAll']),
    ...mapActions('data', ['initSession']),
    async onThisDevice() {
      // Create a new session, then go to Neutral in monocular mode
      this.loading = true
      try {
        this.clearAll()
        await this.initSession()
        this.$router.push({
          name: 'Neutral',
          params: { id: this.session.id },
          query: { isMono: 'true', fromDevice: 'true' }
        })
      } catch (error) {
        apiError(error)
      } finally {
        this.loading = false
      }
    },
    onDifferentDevice() {
      // Go to ConnectDevices with isMono flag — user will scan QR from phone
      this.$router.push({
        name: 'ConnectDevices',
        query: { isMono: 'true', fromDeviceCheck: 'true' }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.device-check-wrapper {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  min-height: 60vh;
  padding: 12px 16px 24px 16px;
}

.requirement-alert {
  width: 100%;
  max-width: 920px;
}

.app-store-link {
  color: #ffcc80;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.subtitle-text {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 500px;
}

.options-container {
  width: 100%;
  max-width: 920px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.option-card {
  width: 100%;
  min-height: 280px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: translateY(-4px);
  }
}

.option-description {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  max-width: 320px;
  width: 100%;
}

.option-card,
.option-card .option-title {
  color: #ffffff;
  font-size: 1.25rem;
  text-align: center;
}

.option-card .v-icon {
  color: #ffffff !important;
}

.select-button {
  min-width: 120px;
}

@media (max-width: 959px) {
  .device-check-wrapper {
    padding: 8px 12px 20px 12px;
  }

  .options-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 100%;
    gap: 10px;
  }

  .option-card {
    min-height: 220px;
    min-width: 0;
    padding: 14px !important;
  }

  .option-card .option-title {
    font-size: 1.05rem;
  }

  .option-description {
    font-size: 0.85rem;
  }
}
</style>
