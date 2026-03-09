<template>
  <MainLayout
    :fixedHeight="false">

    <template v-slot:left><div class="d-none"></div></template>
    <template v-slot:right><div class="d-none"></div></template>

    <div class="device-check-wrapper d-flex flex-column align-center justify-center">
      <h1 class="device-check-title">Are you on the device you'll use to record?</h1>
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
        <div
          class="option-card pa-6 d-flex flex-column align-center"
          @click="onThisDevice">
          <v-icon size="64" class="mb-4 option-icon">mdi-check-circle-outline</v-icon>
          <h2 class="mb-2 option-title">Yes, this device</h2>
          <p class="text-center option-description">
            I'll record using this phone. Set up the session here and open in the app.
          </p>
          <v-btn
            color="grey darken-4"
            dark
            class="mt-4 select-button"
            large
            :loading="loading"
            :disabled="loading">
            Select
          </v-btn>
        </div>

        <div
          class="option-card pa-6 d-flex flex-column align-center"
          @click="onDifferentDevice">
          <v-icon size="64" class="mb-4 option-icon">mdi-qrcode-scan</v-icon>
          <h2 class="mb-2 option-title">No, different device</h2>
          <p class="text-center option-description">
            I'll use a different phone to record. Show me a QR code to connect it.
          </p>
          <v-btn
            color="grey darken-4"
            dark
            class="mt-4 select-button"
            large
            :loading="loading"
            :disabled="loading">
            Select
          </v-btn>
        </div>
      </div>

      <div
        v-else
        class="non-ios-message mt-6">
        <v-alert
          type="info"
          outlined
          dense
          class="mb-4 non-ios-alert">
          Monocular recording is supported on iPhone and iPad using the OpenCap app. You can open this page on a compatible iOS device, or set up the session here and scan the QR code with your phone to connect. Alternatively, use the multi-camera workflowi.
        </v-alert>
        <v-btn
          color="grey darken-4"
          dark
          class="mt-2"
          @click="onDifferentDevice">
          Set up session and show QR code
        </v-btn>
      </div>

      <router-link class="device-check-back-link" :to="{ name: 'RecordingMode' }">
        <v-icon size="18" class="back-arrow">mdi-arrow-left</v-icon>
        {{ backLabel }}
      </router-link>
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
      // Detect if the current device is an iPhone or iPad (not desktop with emulated/resized viewport)
      if (typeof navigator === 'undefined') return false

      const ua = navigator.userAgent || ''
      const isIOS = /iPhone|iPad|iPod/i.test(ua)

      // iPadOS 13+ identifies as Mac; check for touch support (excludes Mac with trackpad)
      const isIPadOS =
        !isIOS &&
        navigator.platform === 'MacIntel' &&
        typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 1

      const uaSaysIos = isIOS || isIPadOS
      if (!uaSaysIos) return false

      // Only treat as iOS if the primary input is touch (pointer: coarse).
      // Excludes desktop browsers with device emulation or resized to iPhone size.
      const hasTouchPrimary =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches

      return uaSaysIos && hasTouchPrimary
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

  a {
    text-decoration: none !important;
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      text-decoration: underline !important;
      color: rgba(255, 255, 255, 1);
    }
  }
}

.device-check-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  margin: 0 0 24px 0;
}

.requirement-alert {
  width: 100%;
  max-width: 920px;
}

.app-store-link {
  color: #ffcc80 !important;
  text-decoration: underline;
  text-underline-offset: 2px;
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

  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
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

.option-icon {
  color: rgba(255, 255, 255, 0.9) !important;
}

.select-button {
  min-width: 120px;
  text-transform: none;
  font-weight: 600;
}

.device-check-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 24px;
  font-size: 0.9375rem;

  .back-arrow {
    flex-shrink: 0;
  }
}

@media (max-width: 959px) {
  .device-check-wrapper {
    padding: 8px 12px 20px 12px;
  }

  .device-check-title {
    font-size: 1.25rem;
    margin-bottom: 20px;
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
