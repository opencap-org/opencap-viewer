<template>
  <div
    class="upload-status-banner"
    :class="bannerClass"
    role="status"
    aria-live="polite">
    <div class="upload-status-banner__main">
      <v-icon class="upload-status-banner__icon" :color="iconColor">
        {{ icon }}
      </v-icon>
      <div class="upload-status-banner__copy">
        <div class="upload-status-banner__label">{{ label }}</div>
        <div class="upload-status-banner__value">
          <template v-if="busy">
            <strong>{{ uploaded }}</strong>
            of
            <strong>{{ expectedCount }}</strong>
            videos uploaded
          </template>
          <template v-else>
            {{ idleValue }}
          </template>
        </div>
        <div v-if="hint" class="upload-status-banner__hint">
          {{ hint }}
        </div>
      </div>
      <div v-if="busy" class="upload-status-banner__count" aria-hidden="true">
        {{ uploaded }}/{{ expectedCount }}
      </div>
    </div>
    <v-progress-linear
      v-if="busy"
      class="upload-status-banner__progress"
      :value="progressPercent"
      :indeterminate="expectedCount === 0"
      height="8"
      rounded
      :color="iconColor"
      background-color="rgba(0, 0, 0, 0.08)"
    />
  </div>
</template>

<script>
export default {
  name: 'UploadStatusBanner',
  props: {
    busy: {
      type: Boolean,
      default: false
    },
    uploaded: {
      type: Number,
      default: 0
    },
    expected: {
      type: Number,
      default: 0
    },
    actionName: {
      type: String,
      default: 'Record'
    },
    idleValue: {
      type: String,
      default: 'Ready when phones have scanned the QR code'
    },
    idleHint: {
      type: String,
      default: ''
    },
    busyLabel: {
      type: String,
      default: 'Uploading videos'
    },
    completeHint: {
      type: String,
      default: 'Upload finished. Processing…'
    },
    waitingHint: {
      type: String,
      default: 'No phones have joined yet. Confirm each phone scanned the QR code, then wait a moment.'
    }
  },
  computed: {
    expectedCount () {
      return Math.max(this.expected, 0)
    },
    progressPercent () {
      if (this.expectedCount <= 0) return 0
      return Math.min(100, Math.round((this.uploaded / this.expectedCount) * 100))
    },
    complete () {
      return this.busy &&
        this.expectedCount > 0 &&
        this.uploaded > 0 &&
        this.uploaded >= this.expectedCount
    },
    waiting () {
      return this.busy && this.expectedCount === 0
    },
    label () {
      if (this.complete) return 'All videos uploaded'
      if (this.waiting) return 'Waiting for phones'
      if (this.busy) return this.busyLabel
      return 'Upload status'
    },
    hint () {
      if (this.waiting) return this.waitingHint
      if (this.busy && !this.complete) {
        return 'Keep this page open — do not refresh while videos upload.'
      }
      if (this.complete) return this.completeHint
      return this.idleHint ||
        `After you press ${this.actionName}, this banner shows how many phone videos have uploaded.`
    },
    icon () {
      if (this.complete) return 'mdi-check-circle'
      if (this.waiting) return 'mdi-cellphone-wireless'
      if (this.busy) return 'mdi-cloud-upload'
      return 'mdi-cloud-outline'
    },
    iconColor () {
      if (this.complete) return 'success'
      if (this.waiting) return 'warning'
      if (this.busy) return 'info'
      return 'grey'
    },
    bannerClass () {
      return {
        'upload-status-banner--busy': this.busy && !this.complete && !this.waiting,
        'upload-status-banner--complete': this.complete,
        'upload-status-banner--warning': this.waiting,
        'upload-status-banner--idle': !this.busy
      }
    }
  }
}
</script>

<style lang="scss">
.upload-status-banner {
  flex-shrink: 0;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  box-shadow: var(--app-shadow);

  &--busy {
    border-color: rgba(33, 150, 243, 0.35);
    background: rgba(33, 150, 243, 0.08);
  }

  &--complete {
    border-color: rgba(76, 175, 80, 0.35);
    background: rgba(76, 175, 80, 0.08);
  }

  &--warning {
    border-color: rgba(255, 152, 0, 0.4);
    background: rgba(255, 152, 0, 0.1);
  }

  &--idle {
    background: var(--app-surface);
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__copy {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--app-text-muted);
    margin-bottom: 2px;
  }

  &__value {
    font-size: 1.0625rem;
    line-height: 1.35;
    color: var(--app-text-primary);

    strong {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  &__hint {
    margin-top: 4px;
    font-size: 0.8125rem;
    line-height: 1.35;
    color: var(--app-text-muted);
  }

  &__count {
    flex-shrink: 0;
    min-width: 56px;
    padding: 6px 10px;
    border-radius: 8px;
    text-align: center;
    font-size: 0.9375rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--app-text-primary);
    background: var(--app-selected);
  }

  &__progress {
    margin-top: 12px;
  }

  @media (max-width: 599px) {
    padding: 12px;

    &__count {
      min-width: 48px;
      padding: 4px 8px;
      font-size: 0.875rem;
    }
  }
}
</style>
