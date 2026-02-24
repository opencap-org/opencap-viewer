<template>
    <v-layout class="login-main" ma-0 pa-3 row justify-center align-center fill-height>
      <v-flex
        xs12 sm6 md4 lg3 xl2 pa-3
        class="wrapper-box d-flex flex-column align-stretch scroll-y">
  
        <h1 class="white--text text-center">New Password</h1>
     
        <span 
        class="text-center mt-2">Please, insert a new password.</span>
      
        <ValidationObserver
        tag="div"
        class="d-flex flex-column"
        ref="observer"
        v-slot="{ invalid }">
        
        <ValidationProvider
          rules="required|min:20"
          v-slot="{ errors }"
          name="Password"
          vid="password"
        >
          <v-text-field
            v-model="password"
            label="Password (20+ characters)"
            dark
            :error="errors.length > 0"
            :error-messages="errors[0]"
            :append-icon="show_password ? 'mdi-eye' : 'mdi-eye-off'"
            :type="show_password ? 'text' : 'password'"
            @click:append="show_password = !show_password"
          />
        </ValidationProvider>

        <ValidationProvider
          rules="required|confirmed:password"
          v-slot="{ errors }"
          name="Confirm password"
        >
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            dark
            :error="errors.length > 0"
            :error-messages="errors[0]"
            :append-icon="show_confirm_password ? 'mdi-eye' : 'mdi-eye-off'"
            :type="show_confirm_password ? 'text' : 'password'"
            @click:append="show_confirm_password = !show_confirm_password"
          />
        </ValidationProvider>
        <v-btn
          type="submit" 
          class="white--text mx-0 align-self-center"
          :disabled="(submitted && invalid) || loading"
          @click="onNewPassword()">Submit</v-btn>            
      </ValidationObserver>

        <router-link class="mt-4 text-center" :to="{ name: 'Login' }"
          >Back to Login</router-link
        >
        
      </v-flex>
    </v-layout>
  </template>


<script>
import { mapActions, mapState } from "vuex";
import { apiSuccess, apiError } from "@/util/ErrorMessage.js";

export default {
  name: "Register",
  data() {
    return {
      loading: false,
      submitted: false,
      password: "",
      confirmPassword: "",
      show_password: false,
      show_confirm_password: false,
    };
  },
  methods: {
    ...mapActions("auth", ["new_password"]),
    async onNewPassword() {
      this.loading = true;

      try {
          this.submitted = true;

          if (await this.$refs.observer.validate()) {

            var parts = window.location.pathname.split('/');
            var token = ""
            if(window.location.pathname.endsWith("/")){
              parts.pop()
              token = parts.pop()
            } else {
              token = parts.pop()
            }

            var response = await this.new_password({
              token: token,
              password: this.password
            });

            apiSuccess("Password changed successfully.");
            this.$router.push({ name: 'Login'})
          }

      } catch (error) {
        console.log(error)
        apiError(error, 'sending the password recovery email.')
      }

      this.loading = false;
    },
  },
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
