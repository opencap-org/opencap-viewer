<template>
  <v-layout class="verify-main" ma-0 pa-3 row justify-center align-start fill-height>
    <v-flex
      xs12 sm6 md4 lg4 xl3 pa-3
      class="verify-wrapper d-flex flex-column align-stretch">

      <div class="verify-card">
        <h1 class="verify-title">E-mail verification code</h1>
        <p class="verify-instructions">
          We've sent you a 6-digit verification code by email. Enter it below to continue. If you don't see the email, check your spam folder.
        </p>

        <form
          class="verify-form d-flex flex-column"
          @submit.prevent="onLogin()">

          <div class="otp-field">
            <div
              class="otp-boxes"
              role="group"
              aria-label="6-digit verification code">
              <input
                v-for="(digit, index) in digits"
                :key="index"
                :ref="'otpInput' + index"
                class="otp-box"
                :class="{ 'otp-box--error': !!errorMessage }"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="one-time-code"
                maxlength="1"
                :aria-label="'Digit ' + (index + 1)"
                :aria-invalid="!!errorMessage"
                :value="digit"
                @input="onDigitInput(index, $event)"
                @keydown="onDigitKeydown(index, $event)"
                @paste.prevent="onPaste($event)"
                @focus="onDigitFocus($event)"
              />
            </div>
            <div v-if="errorMessage" class="otp-error">{{ errorMessage }}</div>
          </div>

          <v-btn
            type="submit"
            class="verify-btn"
            :loading="loading"
            :disabled="loading || otp_token.length !== 6"
            @click.prevent="onLogin()">Verify</v-btn>
        </form>

        <router-link
          class="verify-back-link"
          @click.native="handleGoBack"
          :to="{ name: 'Login' }">
          <v-icon size="18" class="back-arrow">mdi-arrow-left</v-icon>
          Back to Login
        </router-link>
      </div>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { apiError, processErrorMessage } from '@/util/ErrorMessage.js'
import axios from "axios";

const OTP_LENGTH = 6

export default {
  name: 'Verify',
  data () {
    return {
      loading: false,
      digits: Array(OTP_LENGTH).fill(''),
      errorMessage: ''
    }
  },
  computed: {
    ...mapState({
      sessions: state => state.data.sessions,
      remember_device_flag: state => state.auth.remember_device_flag,
      skip_forcing_otp: state => state.auth.skip_forcing_otp
    }),
    otp_token () {
      return this.digits.join('')
    }
  },
  mounted () {
    if (!this.skip_forcing_otp) {
      axios.post('/reset-otp-challenge/')
      this.set_skip_forcing_otp(false)
    }
    this.$nextTick(() => this.focusInput(0))
  },
  methods: {
    ...mapActions('auth', ['verify', 'set_skip_forcing_otp', 'logout']),
    ...mapActions('data', ['loadExistingSessions']),
    clearError () {
      this.errorMessage = ''
    },
    getInput (index) {
      const ref = this.$refs['otpInput' + index]
      return Array.isArray(ref) ? ref[0] : ref
    },
    focusInput (index) {
      const input = this.getInput(index)
      if (input) {
        input.focus()
        input.select()
      }
    },
    setDigitsFromString (value) {
      this.clearError()
      const cleaned = String(value || '').replace(/\D/g, '').slice(0, OTP_LENGTH)
      const next = []
      for (let i = 0; i < OTP_LENGTH; i++) {
        next.push(cleaned[i] || '')
      }
      this.digits = next
      return cleaned.length
    },
    onDigitInput (index, event) {
      this.clearError()
      // Prefer keydown for single digits; this catches mobile autofill / IME
      const digitsOnly = String(event.target.value || '').replace(/\D/g, '')
      if (digitsOnly.length > 1) {
        const filled = this.setDigitsFromString(digitsOnly)
        event.target.value = this.digits[index]
        this.$nextTick(() => this.focusInput(Math.min(filled, OTP_LENGTH - 1)))
        return
      }
      const digit = digitsOnly.slice(-1)
      this.$set(this.digits, index, digit)
      event.target.value = digit
      if (digit && index < OTP_LENGTH - 1) {
        this.$nextTick(() => this.focusInput(index + 1))
      }
    },
    onDigitKeydown (index, event) {
      const key = event.key

      if (/^[0-9]$/.test(key)) {
        event.preventDefault()
        this.clearError()
        this.$set(this.digits, index, key)
        if (index < OTP_LENGTH - 1) {
          this.$nextTick(() => this.focusInput(index + 1))
        }
        return
      }

      if (key === 'Backspace') {
        event.preventDefault()
        this.clearError()
        if (this.digits[index]) {
          this.$set(this.digits, index, '')
        } else if (index > 0) {
          this.$set(this.digits, index - 1, '')
          this.focusInput(index - 1)
        }
        return
      }

      if (key === 'Delete') {
        event.preventDefault()
        this.clearError()
        this.$set(this.digits, index, '')
        return
      }

      if (key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        this.focusInput(index - 1)
        return
      }

      if (key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        event.preventDefault()
        this.focusInput(index + 1)
        return
      }

      if (key === 'Enter') {
        if (this.otp_token.length === OTP_LENGTH) this.onLogin()
      }
    },
    onPaste (event) {
      const pasted = (event.clipboardData || window.clipboardData).getData('text')
      const filled = this.setDigitsFromString(pasted)
      this.$nextTick(() => this.focusInput(Math.min(Math.max(filled - 1, 0), OTP_LENGTH - 1)))
    },
    onDigitFocus (event) {
      event.target.select()
    },
    async onLogin () {
      if (this.loading) return

      this.clearError()

      if (this.otp_token.length !== OTP_LENGTH) {
        this.errorMessage = 'Must be exactly 6 digits.'
        return
      }

      this.loading = true

      try {
        console.log('onLogin:this.remember_device_flag', this.remember_device_flag)
        const remember_device_timestamp = localStorage.getItem('remember_device_timestamp')
        const valid_date = remember_device_timestamp != null ? parseInt(remember_device_timestamp) + 90*24*60*60*1000 >= Date.now() : false
        let data = {otp_token: this.otp_token.trim()}
        if (remember_device_timestamp && valid_date || this.remember_device_flag) {
          data.remember_device = true
        }
        console.log('onLogin:data', data, remember_device_timestamp, valid_date)
        await this.verify(data)

        try {
          await this.loadExistingSessions({reroute: true, quantity:20})
        } catch (error) {
          apiError(error)
          this.$router.push({ name: 'ConnectDevices' })
        }
      } catch (error) {
        const msg = processErrorMessage(error, 'logging in')
          .replace(/<br\/?>/g, ' ')
          .trim()
        this.errorMessage = msg || 'Invalid verification code.'
        apiError(error, 'logging in')
        this.$nextTick(() => this.focusInput(0))
      }

      this.loading = false
    },
    async handleGoBack() {
      this.logout();
    }
  }
}
</script>

<style lang="scss" scoped>
.verify-main {
  a {
    text-decoration: none !important;
    color: var(--app-text-muted);

    &:hover {
      text-decoration: underline !important;
      color: var(--app-text-primary);
    }
  }
}

.verify-wrapper {
  // Same as login: no nested scrollport — iOS keyboard scroll sticks otherwise.
  max-height: none;
  overflow: visible;
}

.verify-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 32px 28px;
  box-shadow: var(--app-shadow);
}

.verify-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--app-text-primary);
  text-align: center;
  margin: 0 0 16px 0;
}

.verify-instructions {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--app-text-muted);
  margin: 0 0 24px 0;
  text-align: center;
}

.verify-form {
  gap: 4px;
}

.otp-field {
  width: 100%;
}

.otp-boxes {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.otp-box {
  flex: 1 1 0;
  min-width: 0;
  max-width: 52px;
  aspect-ratio: 1;
  height: 52px;
  text-align: center;
  font-size: 1.375rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--app-text-primary);
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border-strong);
  border-radius: 10px;
  outline: none;
  caret-color: var(--app-text-primary);
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: var(--app-text-subtle);
  }

  &:focus {
    border-color: var(--app-text-muted);
    background: var(--app-hover);
    box-shadow: 0 0 0 2px var(--app-selected);
  }

  &.otp-box--error {
    border-color: #ff5252;
  }

  &.otp-box--error:focus {
    box-shadow: 0 0 0 2px rgba(255, 82, 82, 0.25);
  }
}

.otp-error {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #ff5252;
  text-align: center;
}

.verify-btn {
  width: 100%;
  min-height: 44px;
  margin-top: 16px !important;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.verify-back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--app-border);
  font-size: 0.9375rem;

  .back-arrow {
    flex-shrink: 0;
  }
}

@media (max-width: 599px) {
  .verify-main {
    padding-top: 24px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  .verify-wrapper {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }

  .verify-card {
    padding: 24px 20px;
  }

  .verify-title {
    font-size: 1.25rem;
    margin-bottom: 12px;
  }

  .verify-instructions {
    font-size: 0.875rem;
    margin-bottom: 20px;
  }

  .otp-boxes {
    gap: 6px;
  }

  .otp-box {
    height: 44px;
    max-width: 44px;
    font-size: 1.25rem;
    border-radius: 8px;
  }
}
</style>
