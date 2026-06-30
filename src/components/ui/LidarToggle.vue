<template>
  <div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <div
          class="lidar-toggle"
          :class="{
            'lidar-toggle--disabled': !hasSession,
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
            :disabled="!hasSession"
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
          <v-btn text @click="cancelLidar">Cancel</v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="confirmLidar">
            Use LiDAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'LidarToggle',
  data () {
    return {
      useLidar: false,
      lastValue: false,
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
    tooltipText () {
      if (!this.hasSession) return 'Session must load before changing LiDAR.'
      return this.useLidar
        ? 'LiDAR depth data will be captured during recording.'
        : 'LiDAR depth data will not be captured during recording.'
    }
  },
  watch: {
    'session.id' () {
      this.syncFromSession()
    }
  },
  mounted () {
    this.syncFromSession()
  },
  methods: {
    parseUseLidar (value) {
      if (value === true || value === '') return true
      if (value === false || value == null) return false
      return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase())
    },
    syncFromSession () {
      const value = this.parseUseLidar(this.session?.useLidar)
      this.useLidar = value
      this.lastValue = value
    },
    requestToggle () {
      if (!this.hasSession) return

      if (!this.useLidar) {
        this.confirmDialog = true
        return
      }

      this.applyValue(false)
    },
    applyValue (nextValue) {
      this.useLidar = nextValue
      this.lastValue = nextValue
      // NOTE: persistence to the DB (useLidar on the session) is intentionally
      // not wired up yet. We only emit the new value for now.
      this.$emit('change', {
        sessionId: this.session?.id,
        useLidar: nextValue
      })
    },
    cancelLidar () {
      this.confirmDialog = false
      this.useLidar = this.lastValue
    },
    onConfirmDialogInput (isOpen) {
      if (!isOpen) this.cancelLidar()
    },
    confirmLidar () {
      this.applyValue(true)
      this.confirmDialog = false
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
