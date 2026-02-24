<template>
  <v-layout class="login-main" ma-0 pa-3 row justify-center align-center fill-height>
    <v-flex
      xs12 sm6 md4 lg3 xl2 pa-3
      class="wrapper-box d-flex flex-column align-stretch scroll-y">

      <h1 class="white--text text-center">Retrieve username and/or change password</h1>

      <span 
        class="text-center mt-2">If your email exists in our database, we will send you an email with your username and a link to change your password.</span>
      
      <ValidationObserver
        tag="div"
        class="d-flex flex-column"
        ref="observer"
        v-slot="{ invalid }">
        
        <ValidationProvider
          rules="required|email"
          v-slot="{ errors }"
          name="Email"
        >
          <v-text-field
            label="Email"
            v-model="email"
            dark
            :error="errors.length > 0"
            :error-messages="errors[0]"
          />
        </ValidationProvider>

        <v-btn
          type="submit" 
          class="white--text mx-0 align-self-center"
          :disabled="(submitted && invalid) || loading"
          @click="onReset()">Send Email</v-btn>            
      </ValidationObserver>
      
      <router-link class="mt-4 text-center"
          :to="{ name: 'Login' }"
      >
      <span v-on:click="clearToasted">Back to Login</span>
      </router-link>
      
    </v-flex>
  </v-layout>
</template>

<script>
import { mapActions, mapState } from "vuex";
import { apiSuccess, apiError } from "@/util/ErrorMessage.js";

export default {
  name: "Reset",
  data() {
    return {
      loading: false,
      submitted: false,
      email: ""
    };
  },
  methods: {
    ...mapActions('auth', ['reset']),
    async onReset () {
      this.loading = true

      try {
        this.submitted = true

        if (await this.$refs.observer.validate()) {
          await this.reset({
            email: this.email
          })

          apiSuccess("Password recovery email sent.");
        }

      } catch (error) {
        console.log(error)
        apiError(error, 'sending the password recovery email.')
      }

      this.loading = false
    },
    clearToasted() {
      this.$toasted.clear()
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
    max-height: calc(100vh - var(--app-bar-top-offset, 64px) - 24px);
    max-height: calc(100dvh - var(--app-bar-top-offset, 64px) - 24px);
    overflow-y: scroll;
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
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
