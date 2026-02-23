<template>
  <v-layout class="login-main" ma-0 pa-3 row justify-center align-center fill-height>
    <v-flex
      xs12 sm6 md4 lg3 xl2 pa-3
      class="wrapper-box d-flex flex-column align-stretch scroll-y">

      <h1 class="white--text text-center">Login</h1>

      <ValidationObserver
        tag="div"
        class="d-flex flex-column"
        ref="observer"
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
        ></v-checkbox>

        <v-btn
          type="submit" 
          class="white--text mx-0 align-self-center"
          :disabled="(submitted && invalid) || loading"
          @click="onLogin()">Login</v-btn>            
      </ValidationObserver>

      <router-link
        class="mt-4 text-center"
        :to="{ name: 'ResetPassword' }">Forgot your username or password?</router-link>
        
      <span class="text-center mt-2"> -- </span>

      <router-link
        class="mt-4 text-center"
        :to="{ name: 'Register' }">Don't have an account yet? Sign Up</router-link>
        
      <span class="text-center mt-2"> -- </span>
      
      <span 
        class="text-center mt-2"><a href="https://www.opencap.ai/get-started">Gather the materials described on our Get Started page before collecting data.</a></span>
      
      <span class="text-center mt-2"> -- </span>
      
      <span 
        class="text-center mt-2"><a href="https://www.opencap.ai/best-practices">Watch the quick tutorial videos on our Best Practices page before collecting data.</a></span>

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

<style lang="scss">
.login-main {
  button {
    width: 100%;
    max-width: 260px;
  }

  .wrapper-box {
    max-height: calc(100vh - 90px);
    overflow-y: scroll;
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  a {
    text-decoration: none !important;

    &:hover {
      text-decoration: underline !important;
    }
  }

  @media (max-width: 599px) {
    padding-left: 8px !important;
    padding-right: 8px !important;

    .wrapper-box {
      max-height: calc(100dvh - var(--app-bar-height, 64px) - 24px);
      padding-left: 12px !important;
      padding-right: 12px !important;
    }

    button {
      max-width: none;
    }
  }
}
</style>
