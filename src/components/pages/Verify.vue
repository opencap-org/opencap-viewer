<template>
  <v-layout class="verify-main" ma-0 pa-3 row justify-center align-center fill-height>
    <v-flex
      xs12 sm6 md4 lg3 xl2 pa-3
      class="verify-wrapper d-flex flex-column align-stretch">

      <div class="verify-card">
        <h1 class="verify-title">E-mail verification code</h1>
        <p class="verify-instructions">
          We've sent you a 6-digit verification code by email. Enter it below to continue. If you don't see the email, check your spam folder.
        </p>

        <ValidationObserver
          tag="form"
          class="verify-form d-flex flex-column"
          ref="observer"
          @submit.native.prevent="onLogin()"
          v-slot="{ invalid }">
          
          <ValidationProvider
            rules="required"
            v-slot="{ errors }"
            name="Verification code"
            slim>
            <v-text-field
              label="Verification code" 
              v-model="otp_token"
              dark
              outlined
              dense
              placeholder="000000"
              :error="errors.length > 0"
              :error-messages="errors[0]"
              class="verify-code-input"
            />
          </ValidationProvider>

          <v-btn
            type="submit"
            class="verify-btn"
            :loading="loading"
            :disabled="(submitted && invalid) || loading"
            @click="onLogin()">Verify</v-btn>            
        </ValidationObserver>

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
import { apiError } from '@/util/ErrorMessage.js'
import axios from "axios";

export default {
  name: 'Verify',
  data () {
    return {
      loading: false,
      submitted: false,
      otp_token: ''
    }
  },
  computed: {
    ...mapState({
      sessions: state => state.data.sessions,
      remember_device_flag: state => state.auth.remember_device_flag,
      skip_forcing_otp: state => state.auth.skip_forcing_otp
    })
  },
    mounted() {
      if (!this.skip_forcing_otp) {
        let res = axios.post('/reset-otp-challenge/')
        this.set_skip_forcing_otp(false)
      }
    },
    methods: {
    ...mapActions('auth', ['verify', 'set_skip_forcing_otp', 'logout']),
    ...mapActions('data', ['loadExistingSessions']),
    async onLogin () {
      this.loading = true

      try {
        this.submitted = true

        if (await this.$refs.observer.validate()) {
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
        } else {
          this.$refs.observer.reset()
        }
      } catch (error) {
        apiError(error, 'logging in')
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
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      text-decoration: underline !important;
      color: rgba(255, 255, 255, 1);
    }
  }
}

.verify-wrapper {
  max-width: 420px;
}

.verify-card {
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 32px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.verify-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  margin: 0 0 16px 0;
}

.verify-instructions {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  text-align: center;
}

.verify-form {
  gap: 4px;
}

.verify-code-input {
  ::v-deep input {
    font-size: 1.25rem;
    letter-spacing: 0.3em;
    text-align: center;
  }
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
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.9375rem;

  .back-arrow {
    flex-shrink: 0;
  }
}

@media (max-width: 599px) {
  .verify-main {
    padding-left: 8px !important;
    padding-right: 8px !important;
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
}
</style>
