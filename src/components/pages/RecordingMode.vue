<template>
  <MainLayout
    :fixedHeight="false">

    <template v-slot:left><div class="d-none"></div></template>
    <template v-slot:right><div class="d-none"></div></template>

    <div class="recording-mode-wrapper d-flex flex-column align-center justify-center">
      <h1 class="recording-mode-title">How will you record?</h1>

      <div class="options-container">
        <div class="card-wrapper">
          <div
            class="option-card pa-6 d-flex flex-column align-center"
            @click="selectMonocular">
            <v-icon size="64" class="mb-4 option-icon">mdi-cellphone</v-icon>
            <div class="title-row mb-2">
              <h2 class="option-title mb-0">Monocular</h2>
              <v-chip
                x-small
                color="warning"
                text-color="black"
                class="beta-chip ml-2">
                Beta
              </v-chip>
            </div>
            <p class="text-center option-description">
              Record with a single phone. Simplified setup, no calibration needed. <strong>Requires OpenCap app 2.0+ from the App Store.</strong>
            </p>
            <v-btn color="grey darken-4" dark class="mt-4 select-button" large>Select</v-btn>
          </div>
          <a
            class="best-practices-link"
            href="https://www.opencap.ai/best-practices?variant=monocular"
            target="_blank"
            rel="noopener noreferrer">
            Read monocular best practices
          </a>
        </div>

        <div class="card-wrapper">
          <div
            class="option-card pa-6 d-flex flex-column align-center"
            @click="selectMultiPhone">
            <div class="d-flex justify-center align-center mb-4 icon-container">
              <v-icon size="64" class="mr-2 option-icon">mdi-cellphone</v-icon>
              <v-icon size="64" class="option-icon">mdi-cellphone</v-icon>
            </div>
            <div class="title-row mb-2">
              <h2 class="option-title mb-0">2+ phones</h2>
            </div>
            <p class="text-center option-description">
              Record with multiple phones for higher accuracy. Requires calibration.
            </p>
            <v-btn color="grey darken-4" dark class="mt-4 select-button" large>Select</v-btn>
          </div>
          <a
            class="best-practices-link"
            href="https://www.opencap.ai/best-practices"
            target="_blank"
            rel="noopener noreferrer">
            Read 2+ phones best practices
          </a>
        </div>
      </div>

      <v-btn text class="mt-6" @click="$router.push({ name: 'SelectSession' })">
        <v-icon left>mdi-arrow-left</v-icon>
        {{ backLabel }}
      </v-btn>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/layout/MainLayout'

export default {
  name: 'RecordingMode',
  components: {
    MainLayout
  },
  computed: {
    backLabel() {
      return this.$vuetify.breakpoint.smAndDown ? 'Back' : 'Back to sessions'
    }
  },
  methods: {
    isIosDevice() {
      // Detect if the current device is an iPhone or iPad (not desktop with emulated/resized viewport)
      if (typeof navigator === 'undefined') return false;

      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPhone|iPad|iPod/i.test(ua);

      // iPadOS 13+ identifies as Mac; check for touch support (excludes Mac with trackpad)
      const isIPadOS =
        !isIOS &&
        navigator.platform === 'MacIntel' &&
        typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 1;

      const uaSaysIos = isIOS || isIPadOS;
      if (!uaSaysIos) return false;

      // Only treat as iOS if the primary input is touch (pointer: coarse).
      // Excludes desktop browsers with device emulation or resized to iPhone size.
      const hasTouchPrimary =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches;

      return uaSaysIos && hasTouchPrimary;
    },
    selectMonocular() {
      const query = { isMono: 'true' }
      if (this.isIosDevice()) {
        // On iOS: go to DeviceCheck to ask if they're on the recording device
        this.$router.push({ name: 'DeviceCheck', query })
      } else {
        // On desktop/computer: go directly to ConnectDevices to show QR code
        this.$router.push({ name: 'ConnectDevices', query })
      }
    },
    selectMultiPhone() {
      // For multi-phone recordings always go straight to ConnectDevices (QR flow).
      this.$router.push({ name: 'ConnectDevices', query: { isMono: 'false' } })
    }
  }
}
</script>

<style lang="scss" scoped>
.recording-mode-wrapper {
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

.recording-mode-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  margin: 0 0 32px 0;
}

.options-container {
  width: 100%;
  max-width: 920px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-wrapper > .best-practices-link {
  text-align: center;
  margin-top: 8px;
}

.option-card {
  width: 100%;
  min-height: 280px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  flex: 1;

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

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 100%;
}

.icon-container {
  height: 64px;
}

.option-card,
.option-card .option-title {
  color: #ffffff;
  font-size: 1.25rem;
  text-align: center;
}

.option-title {
  word-break: break-word;
  max-width: 100%;
}

.option-icon {
  color: rgba(255, 255, 255, 0.9) !important;
}

.beta-chip {
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.best-practices-link {
  color: #ffcc80;
  font-size: 0.9rem;
  text-decoration: underline;
  text-underline-offset: 2px;
  display: block;
}

.select-button {
  min-width: 120px;
  text-transform: none;
  font-weight: 600;
}

@media (max-width: 959px) {
  .recording-mode-wrapper {
    padding: 8px 12px 20px 12px;
  }

  .recording-mode-title {
    font-size: 1.25rem;
    margin-bottom: 24px;
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

  .title-row {
    gap: 6px;
  }

  .beta-chip {
    font-size: 0.65rem;
  }

  .option-description {
    font-size: 0.85rem;
  }
}
</style>
