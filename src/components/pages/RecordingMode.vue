<template>
  <MainLayout
    :fixedHeight="false">

    <template v-slot:left><div class="d-none"></div></template>
    <template v-slot:right><div class="d-none"></div></template>

    <div class="recording-mode-wrapper d-flex flex-column align-center justify-center">
      <h1 class="mb-6 text-center">How will you record?</h1>
      

      <div class="options-container">
        <div class="card-wrapper">
          <v-card
            class="option-card pa-6 d-flex flex-column align-center"
            outlined
            hover
            @click="selectMonocular">
            <v-icon size="64" color="primary" class="mb-4">mdi-cellphone</v-icon>
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
            <p class="text-center monocular-warning mb-0">
              Monocular does not support jumping activities yet.
            </p>
            <v-btn color="grey darken-1" dark class="mt-4 select-button" large>Select</v-btn>
          </v-card>
          <a
            class="best-practices-link"
            href="https://www.opencap.ai/best-practices?variant=monocular"
            target="_blank"
            rel="noopener noreferrer">
            Read monocular best practices
          </a>
        </div>

        <div class="card-wrapper">
          <v-card
            class="option-card pa-6 d-flex flex-column align-center"
            outlined
            hover
            @click="selectMultiPhone">
            <div class="d-flex justify-center align-center mb-4 icon-container">
              <v-icon size="64" color="primary" class="mr-2">mdi-cellphone</v-icon>
              <v-icon size="64" color="primary">mdi-cellphone</v-icon>
            </div>
            <div class="title-row mb-2">
              <h2 class="option-title mb-0">2+ phones</h2>
            </div>
            <p class="text-center option-description">
              Record with multiple phones for higher accuracy. Requires calibration.
            </p>
            <v-btn color="grey darken-1" dark class="mt-4 select-button" large>Select</v-btn>
          </v-card>
          <a
            class="best-practices-link"
            href="https://www.opencap.ai/best-practices"
            target="_blank"
            rel="noopener noreferrer">
            Read 2+ phones best practices
          </a>
        </div>
      </div>

      <div class="mt-6">
        <v-btn text @click="$router.push({ name: 'SelectSession' })">
          <v-icon left>mdi-arrow-left</v-icon>
          Back to sessions
        </v-btn>
      </div>
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
  methods: {
    isIosDevice() {
      // Detect if the current device is an iPhone or iPad
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      
      // iPadOS 13+ identifies as Mac, so check for touch support
      const isIPadOS =
        !isIOS &&
        navigator.platform === 'MacIntel' &&
        typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 1;
      
      return isIOS || isIPadOS;
    },
    selectMonocular() {
      if (this.isIosDevice()) {
        // On iOS: go to DeviceCheck to ask if they're on the recording device
        this.$router.push({ name: 'DeviceCheck' })
      } else {
        // On desktop/computer: go directly to ConnectDevices to show QR code
        this.$router.push({ name: 'ConnectDevices', query: { isMono: 'true' } })
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

.monocular-warning {
  font-size: 0.9rem;
  color: #ffb74d;
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
  color: #ffffff; /* ensure text in cards is white */
  font-size: 1.25rem;
  text-align: center;
}

.option-title {
  word-break: break-word;
  max-width: 100%;
}

.beta-chip {
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.option-card .v-icon {
  color: #ffffff !important;
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
}

@media (max-width: 959px) {
  .recording-mode-wrapper {
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
