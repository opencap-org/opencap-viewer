<template>
  <MainLayout
    :fixedHeight="false">

    <template v-slot:left><div class="d-none"></div></template>
    <template v-slot:right><div class="d-none"></div></template>

    <div class="device-check-wrapper d-flex flex-column align-center justify-center">
      <h1 class="mb-6 text-center">Are you on the device you'll use to record?</h1>
      

      <div class="options-container d-flex flex-wrap justify-center">
        <v-card
          class="option-card pa-4 d-flex flex-column align-center"
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
          class="option-card pa-4 d-flex flex-column align-center"
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

      <div class="mt-8">
        <v-btn text @click="$router.push({ name: 'RecordingMode' })">
          <v-icon left>mdi-arrow-left</v-icon>
          Back to recording mode
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
    })
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
        query: { isMono: 'true' }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.device-check-wrapper {
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
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: center;
  align-items: stretch;
}

.option-card {
  /* force two cards side-by-side even on small screens */
  flex: 0 0 calc(50% - 8px);
  width: calc(50% - 8px);
  box-sizing: border-box;
  padding: 16px;
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
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  max-width: none;
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
  width: fit-content;
}
</style>
