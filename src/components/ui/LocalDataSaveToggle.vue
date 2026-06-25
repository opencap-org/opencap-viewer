<template>
  <div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <div
          class="local-data-save-toggle"
          :class="{
            'local-data-save-toggle--disabled': !hasSession || loadingPreference,
            'local-data-save-toggle--on': saveDataLocally
          }"
          role="switch"
          tabindex="0"
          :aria-checked="String(saveDataLocally)"
          v-bind="attrs"
          v-on="on"
          @click="requestToggle"
          @keydown.enter.prevent="requestToggle"
          @keydown.space.prevent="requestToggle">
          <v-icon small class="local-data-save-toggle__icon">mdi-content-save-outline</v-icon>
          <span class="local-data-save-toggle__label">Save on phone</span>
          <v-switch
            :input-value="saveDataLocally"
            class="local-data-save-toggle__switch"
            color="blue lighten-1"
            dense
            inset
            hide-details
            readonly
            :aria-label="ariaLabel"
            :disabled="!hasSession || loadingPreference || saving"
            @click.native.stop.prevent="requestToggle" />
        </div>
      </template>
      <span>{{ tooltipText }}</span>
    </v-tooltip>

    <v-dialog
      v-model="confirmDialog"
      content-class="app-dialog local-save-dialog"
      max-width="520"
      :retain-focus="false"
      @input="onConfirmDialogInput"
      @click:outside="cancelLocalSave">
      <v-card>
        <v-card-title class="local-save-dialog__title">
          Save data on phone only?
        </v-card-title>

        <v-card-text>
          <div class="local-save-speed" :class="speedStatusClass">
            <div class="local-save-speed__main">
              <v-icon small class="local-save-speed__icon">{{ speedIcon }}</v-icon>
              <span class="local-save-speed__label">Internet speed</span>
              <v-progress-circular
                v-if="internetSpeedChecking"
                indeterminate
                class="ml-2"
                color="grey lighten-1"
                size="14"
                width="2" />
            </div>
            <div class="local-save-speed__value">{{ internetSpeedDisplayText }}</div>
          </div>

          <p class="mb-2">
            The data will be saved only on the recording phone(s), not on this computer and not in the cloud during recording. This feature is recommended when internet speed is slow.
          </p>
          <p class="mb-2">
            A future upload step from the phone will be required before OpenCap can process the data and show results.
          </p>
          <p class="mb-0 local-save-dialog__recommendation">
            {{ speedRecommendationText }}
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text :disabled="saving" @click="cancelLocalSave">Cancel</v-btn>
          <v-btn
            color="blue darken-1"
            text
            :disabled="saving"
            @click="confirmLocalSave">
            <v-progress-circular
              v-if="saving"
              indeterminate
              class="mr-2"
              color="grey"
              size="14"
              width="2" />
            Save on phone
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { mapState } from 'vuex'
import { apiError } from '@/util/ErrorMessage.js'
import {
  formatInternetSpeed,
  getConnectionDownlinkMbps,
  internetSpeedStatus,
  measureDownloadSpeed
} from '@/util/internetSpeed.js'

export default {
  name: 'LocalDataSaveToggle',
  data () {
    return {
      saveDataLocally: false,
      lastSavedValue: false,
      loadingPreference: false,
      saving: false,
      confirmDialog: false,
      internetSpeedChecking: false,
      internetSpeedMbps: null,
      internetSpeedState: 'unavailable',
      speedCheckId: 0,
      preferenceRequestId: 0
    }
  },
  computed: {
    ...mapState({
      session: state => state.data.session
    }),
    ariaLabel () {
      return 'Save recording data on the phone'
    },
    hasSession () {
      return !!this.session?.id
    },
    saveLocalUrl () {
      return this.hasSession ? `/sessions/${this.session.id}/save_local/` : null
    },
    internetSpeedDisplayText () {
      const formattedSpeed = formatInternetSpeed(this.internetSpeedMbps)
      if (formattedSpeed) return formattedSpeed
      if (this.internetSpeedChecking) return 'Checking'

      return 'Unavailable'
    },
    speedIcon () {
      if (this.internetSpeedState === 'slow') return 'mdi-wifi-strength-1'
      if (this.internetSpeedState === 'ok') return 'mdi-wifi-strength-2'
      if (this.internetSpeedState === 'fast') return 'mdi-wifi-strength-4'

      return 'mdi-wifi-alert'
    },
    speedRecommendationText () {
      if (this.internetSpeedChecking && !this.internetSpeedMbps) {
        return 'Checking your current connection. Saving locally is recommended when internet speed is slow.'
      }
      if (this.internetSpeedState === 'slow') {
        return 'Slow connection detected. Saving locally is recommended.'
      }
      if (this.internetSpeedState === 'ok') {
        return 'Your connection is moderate. Saving locally can help avoid interrupted uploads.'
      }
      if (this.internetSpeedState === 'fast') {
        return 'Your connection looks strong, but saving locally is still available if you want to upload later.'
      }

      return 'Speed could not be measured. Saving locally is recommended if uploads are unreliable.'
    },
    speedStatusClass () {
      return `local-save-speed--${this.internetSpeedState}`
    },
    tooltipText () {
      if (!this.hasSession) return 'Session must load before changing local data storage.'
      if (this.loadingPreference) return 'Loading phone save setting.'
      return this.saveDataLocally
        ? 'Recording data will be saved only on the recording phone.'
        : 'Recording data will upload normally instead of being saved only on the phone.'
    }
  },
  watch: {
    'session.id' () {
      this.loadPreference()
    }
  },
  mounted () {
    this.loadPreference()
  },
  methods: {
    async loadPreference () {
      const sessionId = this.session?.id
      const currentRequestId = this.preferenceRequestId + 1
      this.preferenceRequestId = currentRequestId

      if (!sessionId) {
        this.saveDataLocally = false
        this.lastSavedValue = false
        return
      }

      this.loadingPreference = true

      try {
        const res = await axios.get(`/sessions/${sessionId}/save_local/`)
        if (this.preferenceRequestId !== currentRequestId) return

        const saveLocal = Boolean(res.data.save_local)
        this.saveDataLocally = saveLocal
        this.lastSavedValue = saveLocal
      } catch (error) {
        if (this.preferenceRequestId !== currentRequestId) return

        const sessionPreference = this.getSessionPreference()
        const fallbackValue = sessionPreference !== null ? sessionPreference : false
        this.saveDataLocally = fallbackValue
        this.lastSavedValue = fallbackValue
      } finally {
        if (this.preferenceRequestId === currentRequestId) {
          this.loadingPreference = false
        }
      }
    },
    getSessionPreference () {
      if (!this.session) return null
      if (typeof this.session.save_data_locally !== 'undefined') {
        return Boolean(this.session.save_data_locally)
      }
      if (typeof this.session.saveDataLocally !== 'undefined') {
        return Boolean(this.session.saveDataLocally)
      }

      return null
    },
    async requestToggle () {
      if (!this.hasSession || this.loadingPreference || this.saving) return

      if (!this.saveDataLocally) {
        this.confirmDialog = true
        this.checkInternetSpeed()
        return
      }

      await this.applyPreference(false)
    },
    async applyPreference (nextValue) {
      const previousValue = this.lastSavedValue
      this.saveDataLocally = nextValue
      this.saving = true
      try {
        const savedValue = await this.savePreference(nextValue)
        this.saveDataLocally = savedValue
        this.lastSavedValue = savedValue
        return true
      } catch (error) {
        this.saveDataLocally = previousValue
        apiError('Could not update local data storage setting. Please try again.')
        return false
      } finally {
        this.saving = false
      }
    },
    cancelLocalSave () {
      if (this.saving) return

      this.confirmDialog = false
      this.saveDataLocally = this.lastSavedValue
    },
    onConfirmDialogInput (isOpen) {
      if (!isOpen) this.cancelLocalSave()
    },
    async confirmLocalSave () {
      const saved = await this.applyPreference(true)
      if (saved) this.confirmDialog = false
    },
    setSpeedValue (speedMbps) {
      this.internetSpeedMbps = speedMbps
      this.internetSpeedState = internetSpeedStatus(speedMbps)
    },
    async checkInternetSpeed () {
      const currentCheckId = this.speedCheckId + 1
      this.speedCheckId = currentCheckId

      const downlink = getConnectionDownlinkMbps()
      if (downlink) this.setSpeedValue(downlink)

      this.internetSpeedChecking = true

      try {
        const result = await measureDownloadSpeed()
        if (this.speedCheckId !== currentCheckId) return

        this.setSpeedValue(result.mbps)
      } catch (error) {
        if (this.speedCheckId !== currentCheckId) return
        if (!downlink) {
          this.internetSpeedMbps = null
          this.internetSpeedState = 'unavailable'
        }
      } finally {
        if (this.speedCheckId === currentCheckId) {
          this.internetSpeedChecking = false
        }
      }
    },
    async savePreference (value) {
      const res = await axios.patch(this.saveLocalUrl, {
        save_local: Boolean(value)
      })

      this.$emit('change', {
        sessionId: this.session?.id,
        saveDataLocally: Boolean(res.data.save_local)
      })

      return Boolean(res.data.save_local)
    }
  }
}
</script>

<style lang="scss" scoped>
.local-data-save-toggle {
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.86);
  display: inline-flex;
  gap: 6px;
  height: 32px;
  min-width: 148px;
  padding: 0 8px;
  white-space: nowrap;
}

.local-data-save-toggle--on {
  color: rgba(255, 255, 255, 0.86);
}

.local-data-save-toggle--disabled {
  opacity: 0.62;
}

.local-data-save-toggle__icon {
  color: currentColor;
  flex: 0 0 auto;
}

.local-data-save-toggle__label {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1;
}

.local-data-save-toggle__switch {
  flex: 0 0 auto;
}

.local-data-save-toggle ::v-deep .v-input {
  margin-top: 0;
  padding-top: 0;
}

.local-data-save-toggle ::v-deep .v-input__slot {
  margin-bottom: 0;
}

.local-data-save-toggle ::v-deep .v-input--selection-controls__input {
  margin-right: 0;
}

.local-data-save-toggle ::v-deep .v-messages {
  display: none;
}

@media (max-width: 599px) {
  .local-data-save-toggle {
    gap: 4px;
    height: 30px;
    min-width: 138px;
    padding: 0 4px;
  }

  .local-data-save-toggle__label {
    font-size: 0.72rem;
  }
}

.local-save-dialog__title {
  word-break: normal;
}

.local-save-speed {
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 10px 12px;
}

.local-save-speed__main {
  align-items: center;
  display: flex;
  min-width: 0;
}

.local-save-speed__icon {
  color: currentColor;
  margin-right: 8px;
}

.local-save-speed__label {
  font-weight: 600;
}

.local-save-speed__value {
  font-weight: 700;
  white-space: nowrap;
}

.local-save-speed--fast {
  color: #9be7b2;
}

.local-save-speed--ok {
  color: #ffe082;
}

.local-save-speed--slow,
.local-save-speed--unavailable {
  color: #ffb74d;
}

.local-save-dialog__recommendation {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 600;
}
</style>
