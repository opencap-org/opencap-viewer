<template>
  <div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <div
          class="lidar-toggle"
          :class="{
            'lidar-toggle--disabled': !hasSession || loadingPreference,
            'lidar-toggle--on': useLidar
          }"
          role="switch"
          tabindex="0"
          :aria-checked="String(useLidar)"
          v-bind="attrs"
          v-on="on"
          @click="requestToggle"
          @keydown.enter.prevent="requestToggle"
          @keydown.space.prevent="requestToggle">
          <v-icon small class="lidar-toggle__icon">mdi-cube-scan</v-icon>
          <span class="lidar-toggle__label">Use LiDAR</span>
          <v-switch
            :input-value="useLidar"
            class="lidar-toggle__switch"
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
      content-class="app-dialog lidar-dialog"
      max-width="520"
      :retain-focus="false"
      @input="onConfirmDialogInput"
      @click:outside="cancelLidar">
      <v-card>
        <v-card-title class="lidar-dialog__title">
          Use LiDAR during recording?
        </v-card-title>

        <v-card-text>
          <p class="mb-2">
            Only iPhones with a LiDAR sensor will capture depth data. Any other phones will record normal RGB video instead.
          </p>
          <p class="mb-0 lidar-dialog__recommendation">
            LiDAR is available on the iPhone 12 Pro / 12 Pro Max and all later Pro and Pro Max models.
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text :disabled="saving" @click="cancelLidar">Cancel</v-btn>
          <v-btn
            color="blue darken-1"
            text
            :disabled="saving"
            @click="confirmLidar">
            <v-progress-circular
              v-if="saving"
              indeterminate
              class="mr-2"
              color="grey"
              size="14"
              width="2" />
            Use LiDAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import axios from 'axios'
import { apiError } from '@/util/ErrorMessage.js'

// The mobile app needs time to switch its capture pipeline between
// AVFoundation (RGB) and ARKit (LiDAR). Block recording during that window.
const LIDAR_ENABLE_COOLDOWN_MS = 2000
const LIDAR_DISABLE_COOLDOWN_MS = 2000

export default {
  name: 'LidarToggle',
  data () {
    return {
      useLidar: false,
      lastValue: false,
      loadingPreference: false,
      saving: false,
      preferenceRequestId: 0,
      confirmDialog: false
    }
  },
  computed: {
    ...mapState({
      session: state => state.data.session
    }),
    ariaLabel () {
      return 'Use LiDAR depth data during recording'
    },
    hasSession () {
      return !!this.session?.id
    },
    useLidarUrl () {
      return this.hasSession ? `/sessions/${this.session.id}/useLidar/` : null
    },
    tooltipText () {
      if (!this.hasSession) return 'Session must load before changing LiDAR.'
      if (this.loadingPreference) return 'Loading LiDAR setting.'
      return this.useLidar
        ? 'LiDAR depth data will be captured during recording.'
        : 'LiDAR depth data will not be captured during recording.'
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
    ...mapMutations('data', ['setLidarSwitchCooldownUntil']),
    getLidarSwitchCooldownMs (useLidar) {
      return useLidar ? LIDAR_ENABLE_COOLDOWN_MS : LIDAR_DISABLE_COOLDOWN_MS
    },
    parseUseLidar (value) {
      if (value === true || value === '') return true
      if (value === false || value == null) return false
      return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase())
    },
    getUseLidarFromResponse (data) {
      if (!data) return undefined
      if (typeof data.useLidar !== 'undefined') return data.useLidar
      if (typeof data.use_lidar !== 'undefined') return data.use_lidar
      if (typeof data.use_lidar_data !== 'undefined') return data.use_lidar_data
      if (typeof data.useLidarData !== 'undefined') return data.useLidarData
      return undefined
    },
    getSessionPreference () {
      if (!this.session) return null
      if (typeof this.session.useLidar !== 'undefined') {
        return this.parseUseLidar(this.session.useLidar)
      }
      if (typeof this.session.use_lidar !== 'undefined') {
        return this.parseUseLidar(this.session.use_lidar)
      }

      return null
    },
    async loadPreference () {
      const sessionId = this.session?.id
      const currentRequestId = this.preferenceRequestId + 1
      this.preferenceRequestId = currentRequestId

      if (!sessionId) {
        this.useLidar = false
        this.lastValue = false
        return
      }

      this.loadingPreference = true

      try {
        const res = await axios.get(`/sessions/${sessionId}/useLidar/`)
        if (this.preferenceRequestId !== currentRequestId) return

        const rawUseLidar = this.getUseLidarFromResponse(res.data)
        const value = this.parseUseLidar(rawUseLidar)
        this.useLidar = value
        this.lastValue = value
        this.$emit('change', {
          sessionId,
          useLidar: value
        })
      } catch (error) {
        if (this.preferenceRequestId !== currentRequestId) return

        const sessionPreference = this.getSessionPreference()
        const fallbackValue = sessionPreference !== null ? sessionPreference : false
        this.useLidar = fallbackValue
        this.lastValue = fallbackValue
      } finally {
        if (this.preferenceRequestId === currentRequestId) {
          this.loadingPreference = false
        }
      }
    },
    requestToggle () {
      if (!this.hasSession || this.loadingPreference || this.saving) return

      if (!this.useLidar) {
        this.confirmDialog = true
        return
      }

      this.applyValue(false)
    },
    async applyValue (nextValue) {
      const previousValue = this.lastValue
      this.useLidar = nextValue
      this.saving = true

      try {
        const savedValue = await this.savePreference(nextValue)
        this.useLidar = savedValue
        this.lastValue = savedValue
        // Give the mobile app time to switch between AVFoundation and ARKit
        // before the user is allowed to start a recording.
        this.setLidarSwitchCooldownUntil(Date.now() + this.getLidarSwitchCooldownMs(savedValue))
        return true
      } catch (error) {
        this.useLidar = previousValue
        apiError('Could not update LiDAR setting. Please try again.')
        return false
      } finally {
        this.saving = false
      }
    },
    cancelLidar () {
      if (this.saving) return

      this.confirmDialog = false
      this.useLidar = this.lastValue
    },
    onConfirmDialogInput (isOpen) {
      if (!isOpen) this.cancelLidar()
    },
    async confirmLidar () {
      const saved = await this.applyValue(true)
      if (saved) this.confirmDialog = false
    },
    async savePreference (value) {
      const res = await axios.patch(this.useLidarUrl, {
        useLidar: Boolean(value)
      })

      const rawUseLidar = this.getUseLidarFromResponse(res.data)
      const useLidar = this.parseUseLidar(
        typeof rawUseLidar === 'undefined' ? value : rawUseLidar
      )

      this.$emit('change', {
        sessionId: this.session?.id,
        useLidar
      })

      return useLidar
    }
  }
}
</script>

<style lang="scss" scoped>
.lidar-toggle {
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.86);
  display: inline-flex;
  gap: 6px;
  height: 32px;
  min-width: 128px;
  padding: 0 8px;
  white-space: nowrap;
}

.lidar-toggle--on {
  color: rgba(255, 255, 255, 0.86);
}

.lidar-toggle--on::v-deep .v-input--switch__track {
  background-color: green !important;
  border-color: green !important;
  color: green !important;
  opacity: 0.28;
}

.lidar-toggle--on::v-deep .v-input--switch__thumb {
  background-color: green !important;
  border-color: green !important;
  color: green !important;
}

.lidar-toggle--disabled {
  opacity: 0.62;
}

.lidar-toggle__icon {
  color: currentColor;
  flex: 0 0 auto;
}

.lidar-toggle__label {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1;
}

.lidar-toggle__switch {
  flex: 0 0 auto;
}

.lidar-toggle ::v-deep .v-input {
  margin-top: 0;
  padding-top: 0;
}

.lidar-toggle ::v-deep .v-input__slot {
  margin-bottom: 0;
}

.lidar-toggle ::v-deep .v-input--selection-controls__input {
  margin-right: 0;
}

.lidar-toggle ::v-deep .v-messages {
  display: none;
}

@media (max-width: 599px) {
  .lidar-toggle {
    gap: 4px;
    height: 30px;
    min-width: 118px;
    padding: 0 4px;
  }

  .lidar-toggle__label {
    font-size: 0.72rem;
  }
}

.lidar-dialog__title {
  word-break: normal;
}

.lidar-dialog__recommendation {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 600;
}
</style>
