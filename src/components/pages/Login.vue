<template>
  <v-layout class="login-main" ma-0 pa-3 row justify-center align-start fill-height>
    <v-flex
      xs12 sm6 md4 lg4 xl3 pa-3
      class="login-wrapper d-flex flex-column align-stretch scroll-y">

      <a
        href="https://www.opencap.ai"
        target="_blank"
        rel="noopener"
        class="login-banner">
        <span class="login-banner-highlight">OpenCap 2.0 is here</span>
        <span class="login-banner-details">New UI/UX · New mobile app · Monocular support</span>
        <span class="login-banner-cta">Learn more at <strong>opencap.ai</strong> →</span>
      </a>

      <div class="login-card">
        <h1 class="login-title">Login</h1>

        <ValidationObserver
          tag="form"
          class="login-form d-flex flex-column"
          ref="observer"
          @submit.native.prevent="onLogin()"
          v-slot="{ invalid }">
          
          <ValidationProvider
            rules="required"
            v-slot="{ errors }"
            name="Username"
            slim>
            <v-text-field
              label="Username" 
              v-model="username"
              dark
              outlined
              dense
              :error="errors.length > 0"
              :error-messages="errors[0]"/>
          </ValidationProvider>

          <ValidationProvider
            rules="required"
            v-slot="{ errors }"
            name="Password"
            slim>
            <v-text-field
              label="Password" 
              v-model="password"
              dark
              outlined
              dense
              :error="errors.length > 0"
              :error-messages="errors[0]"
              :append-icon="show_password ? 'mdi-eye' : 'mdi-eye-off'"
              :type="show_password ? 'text' : 'password'"
              @click:append="show_password = !show_password"/>
          </ValidationProvider>

          <v-checkbox
            label="Remember this device for 90 days"
            v-if="show_remember_checkbox"
            v-model="remember_device"
            dark
            hide-details
            class="login-remember"
          ></v-checkbox>

          <v-btn
            type="submit" 
            class="login-btn"
            :loading="loading"
            :disabled="(submitted && invalid) || loading"
            @click="onLogin()">Login</v-btn>            
        </ValidationObserver>

        <div class="login-links">
          <router-link :to="{ name: 'ResetPassword' }">Forgot your username or password?</router-link>
          <router-link :to="{ name: 'Register' }">Don't have an account? Sign Up</router-link>
        </div>
      </div>

      <div class="login-help">
        <a href="https://www.opencap.ai/get-started" target="_blank" rel="noopener">Get Started</a>
        <span class="login-help-sep">·</span>
        <a href="https://www.opencap.ai/best-practices" target="_blank" rel="noopener">Best Practices</a>
      </div>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { apiError } from '@/util/ErrorMessage.js'
import axios from "axios";

export default {
  name: 'Login',
  data () {
    return {
      loading: false,
      submitted: false,
      username: '',
      password: '',
      show_remember_checkbox: true,
      remember_device: false,
      show_password: false,
    }
  },
  computed: {
    ...mapState({
      sessions: state => state.data.sessions,
      skip_forcing_otp: state => state.auth.skip_forcing_otp
    })
  },
  mounted() {
      const remember_device_timestamp = localStorage.getItem('remember_device_timestamp')
      const valid_date = remember_device_timestamp != null ? parseInt(remember_device_timestamp) + 90*24*60*60*1000 >= Date.now() : false
      if (remember_device_timestamp && valid_date) {
          this.show_remember_checkbox = false
      }
      if (remember_device_timestamp && !valid_date) {
          localStorage.removeItem('remember_device_timestamp')
      }
  },
  methods: {
    ...mapActions('auth', ['login', 'set_verify', 'setRememberDeviceFlag', 'set_skip_forcing_otp']),
    ...mapActions('data', ['loadExistingSessions']),
    async onLogin () {
      this.loading = true

      try {
        this.submitted = true

        if (await this.$refs.observer.validate()) {
          await this.login({
            username: this.username, 
            password: this.password
          })

          const remember_device_timestamp = localStorage.getItem('remember_device_timestamp')
          const valid_date = remember_device_timestamp != null ? parseInt(remember_device_timestamp) + 90*24*60*60*1000 >= Date.now() : false
          let go_to_validate = true

              if (remember_device_timestamp && valid_date) {
              // Skip the 2FA step if the user has logged in within the last 90 days
              let res = await axios.get('/check-otp-verified/')
              console.log(res.data)
              if (res.data.otp_verified) {
                await this.set_verify()
                try {
                  await this.loadExistingSessions({reroute: true, quantity:20})
                } catch (error) {
                  apiError(error)
                  this.$router.push({ name: 'ConnectDevices' })
                }
                go_to_validate = false
              } else {
                await this.set_skip_forcing_otp(true)
                go_to_validate = true
              }
          }

          if (this.remember_device) {
            await this.setRememberDeviceFlag(true)
              // localStorage.setItem('remember_device_timestamp', Date.now())
          }
          if(go_to_validate) {
            this.$router.push({ name: 'Verify' })
          }
        } else {
          if (this.password) {
            this.password = ''
            this.$refs.observer.reset()
          }
        }
      } catch (error) {
        apiError(error, 'logging in')
      }

      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
.login-main {
  a {
    text-decoration: none !important;
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      text-decoration: underline !important;
      color: rgba(255, 255, 255, 1);
    }
  }
}

.login-wrapper {
  max-height: calc(100vh - var(--app-bar-top-offset, 64px) - 24px);
  max-height: calc(100dvh - var(--app-bar-top-offset, 64px) - 24px);
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.login-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.18) 0%, rgba(56, 142, 60, 0.12) 100%);
  border: 1px solid rgba(76, 175, 80, 0.35);
  border-radius: 10px;
  text-align: center;
  text-decoration: none !important;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.24) 0%, rgba(56, 142, 60, 0.18) 100%);
    border-color: rgba(76, 175, 80, 0.5);
  }

  .login-banner-highlight {
    font-size: 1.05rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    letter-spacing: 0.01em;
  }

  .login-banner-details {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 0.01em;
  }

  .login-banner-cta {
    font-size: 0.875rem;
    color: rgba(160, 220, 160, 0.95);
    margin-top: 2px;
  }
}

.login-card {
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 32px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.login-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  margin: 0 0 24px 0;
}

.login-form {
  gap: 4px;

  .v-text-field {
    margin-bottom: 4px;
  }
}

.login-remember {
  margin-top: 4px;
  margin-bottom: 8px;
}

.login-btn {
  width: 100%;
  min-height: 44px;
  margin-top: 16px !important;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.login-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  font-size: 0.9375rem;
}

.login-help {
  margin-top: 24px;
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);

  a {
    color: rgba(255, 255, 255, 0.7);
  }

  .login-help-sep {
    margin: 0 8px;
    opacity: 0.5;
  }
}

@media (max-width: 599px) {
  .login-main {
    padding-top: 24px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  .login-wrapper {
    max-height: calc(100dvh - var(--app-bar-height, 64px) - 24px);
    padding-left: 4px !important;
    padding-right: 4px !important;
  }

  .login-banner {
    padding: 12px 14px;
    margin-bottom: 12px;
    .login-banner-highlight { font-size: 0.95rem; }
    .login-banner-details { font-size: 0.8rem; }
    .login-banner-cta { font-size: 0.8rem; }
  }

  .login-card {
    padding: 24px 20px;
  }

  .login-title {
    font-size: 1.25rem;
    margin-bottom: 20px;
  }
}
</style>
