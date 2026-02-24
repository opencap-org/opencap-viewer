<template>
  <v-layout class="login-main" ma-0 pa-3 row justify-center align-center fill-height>
    <v-flex
      xs12 sm6 md4 lg3 xl2 pa-3
      class="d-flex flex-column align-stretch">

      <h1 class="white--text text-center">E-mail verification code</h1>
      <p>
        We've just sent you a 6-digit verification code by e-mail. Please copy paste the code below to access the website. If you don't see the e-mail in your mailbox, please check the spam folder.
      </p>

      <ValidationObserver
        tag="div"
        class="d-flex flex-column"
        ref="observer"
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
            :error="errors.length > 0"
            :error-messages="errors[0]"/>
        </ValidationProvider>

        <v-btn
          type="submit"
          class="white--text mx-0 align-self-center"
          :disabled="(submitted && invalid) || loading"
          @click="onLogin()">Verify</v-btn>            
      </ValidationObserver>

      <router-link class="text-center mt-6" @click.native="handleGoBack" :to="{ name: 'Login' }">
        Back to Login
      </router-link>

      <!--router-link
        class="mt-4 text-center"
        :to="{ name: 'Register' }">Don't have an account yet? Sign Up</router-link-->
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
          if (this.password) {
            this.password = ''
            this.$refs.observer.reset()
          }
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

<style lang="scss">
.login-main {
  button {
    width: 100%;
    max-width: 260px;
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

    button {
      max-width: none;
    }
  }
}
</style>
