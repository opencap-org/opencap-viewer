<template>
  <MainLayout
    :fixedHeight="false">

    <template v-slot:left><div class="d-none"></div></template>
    <template v-slot:right><div class="d-none"></div></template>

    <div class="recording-mode-wrapper d-flex flex-column align-center justify-center">
      <h1 class="mb-6 text-center">How will you record?</h1>
      <p class="mb-8 text-center subtitle-text">
        Choose how many phones you will use for this session.
      </p>

      <div class="options-container d-flex justify-center">
        <v-card
          class="option-card ma-4 pa-6 d-flex flex-column align-center"
          outlined
          hover
          @click="selectMonocular">
          <v-icon size="64" color="primary" class="mb-4">mdi-cellphone</v-icon>
          <h2 class="mb-2 option-title">Monocular</h2>
          <p class="text-center option-description">
            Record with a single phone. Simplified setup, no calibration needed.
          </p>
          <v-btn color="grey darken-1" dark class="mt-4 select-button" large>Select</v-btn>
        </v-card>

        <v-card
          class="option-card ma-4 pa-6 d-flex flex-column align-center"
          outlined
          hover
          @click="selectMultiPhone">
          <div class="d-flex justify-center align-center mb-4">
            <v-icon size="64" color="primary" class="mr-2">mdi-cellphone</v-icon>
            <v-icon size="64" color="primary">mdi-cellphone</v-icon>
          </div>
          <h2 class="mb-2 option-title">2+ phones</h2>
          <p class="text-center option-description">
            Record with multiple phones for higher accuracy. Requires calibration.
          </p>
          <v-btn color="grey darken-1" dark class="mt-4 select-button" large>Select</v-btn>
        </v-card>
      </div>

      <div class="mt-4">
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
    isMobileOrTablet() {
      // Use user agent to detect iPhone, iPad, Android, or touch device
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      // iPadOS 13+ identifies as Mac, so check for touch support
      const isIpad = (/iPad/.test(ua)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isIphone = /iPhone/.test(ua);
      const isAndroid = /Android/.test(ua);
      return isIpad || isIphone || isAndroid;
    },
    selectMonocular() {
      if (this.isMobileOrTablet()) {
        this.$router.push({ name: 'DeviceCheck' })
      } else {
        this.$router.push({ name: 'ConnectDevices', query: { isMono: 'true' } })
      }
    },
    selectMultiPhone() {
      if (this.isMobileOrTablet()) {
        this.$router.push({ name: 'DeviceCheck', query: { isMono: 'false' } })
      } else {
        this.$router.push({ name: 'ConnectDevices', query: { isMono: 'false' } })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.recording-mode-wrapper {
  width: 100%;
  min-height: 60vh;
  padding: 12px 24px 24px 24px;
}

.subtitle-text {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 500px;
}

.options-container {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap; /* keep options side-by-side */
  gap: 8px;
  justify-content: center;
}

.option-card {
  /* allow cards to shrink on small screens but keep two side-by-side */
  flex: 1 1 160px;
  width: auto;
  min-width: 160px;
  max-width: 420px;
  min-height: 240px;
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
  max-width: 260px;
}

.option-card,
.option-card .option-title {
  color: #ffffff; /* ensure text in cards is white */
  font-size: 1.25rem;
  text-align: center;
}

.option-card .v-icon {
  color: #ffffff !important;
}

.select-button {
  width: fit-content;
}
</style>
