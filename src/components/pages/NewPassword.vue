<template>
  <v-layout class="newpassword-main" ma-0 pa-3 row justify-center align-start fill-height>
    <v-flex
      xs12 sm6 md4 lg4 xl3 pa-3
      class="newpassword-wrapper d-flex flex-column align-stretch scroll-y">

      <div class="newpassword-card">
        <h1 class="newpassword-title">New Password</h1>

        <p class="newpassword-description">Please insert a new password.</p>

        <ValidationObserver
          tag="div"
          class="newpassword-form d-flex flex-column"
          ref="observer"
          v-slot="{ invalid }">

          <ValidationProvider
            rules="required|min:20"
            v-slot="{ errors }"
            name="Password"
            vid="password">
            <v-text-field
              v-model="password"
              label="Password (20+ characters)"
              dark
              outlined
              dense
              :error="errors.length > 0"
              :error-messages="errors[0]"
              :append-icon="show_password ? 'mdi-eye' : 'mdi-eye-off'"
              :type="show_password ? 'text' : 'password'"
              @click:append="show_password = !show_password"/>
          </ValidationProvider>

          <ValidationProvider
            rules="required|confirmed:password"
            v-slot="{ errors }"
            name="Confirm password">
            <v-text-field
              v-model="confirmPassword"
              label="Confirm password"
              dark
              outlined
              dense
              :error="errors.length > 0"
              :error-messages="errors[0]"
              :append-icon="show_confirm_password ? 'mdi-eye' : 'mdi-eye-off'"
              :type="show_confirm_password ? 'text' : 'password'"
              @click:append="show_confirm_password = !show_confirm_password"/>
          </ValidationProvider>

          <v-btn
            type="submit"
            class="newpassword-btn"
            :loading="loading"
            :disabled="(submitted && invalid) || loading"
            @click="onNewPassword()">Submit</v-btn>
        </ValidationObserver>

        <router-link class="newpassword-back-link" :to="{ name: 'Login' }">
          <v-icon size="18" class="back-arrow">mdi-arrow-left</v-icon>
          Back to Login
        </router-link>
      </div>
    </v-flex>
  </v-layout>
</template>


<script>
import { mapActions } from "vuex";
import { apiSuccess, apiError } from "@/util/ErrorMessage.js";

export default {
  name: "NewPassword",
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
          if (window.location.pathname.endsWith("/")) {
            parts.pop()
            token = parts.pop()
          } else {
            token = parts.pop()
          }

          await this.new_password({
            token: token,
            password: this.password
          });

          apiSuccess("Password changed successfully.");
          this.$router.push({ name: 'Login' })
        }
      } catch (error) {
        console.log(error)
        apiError(error, 'changing the password.')
      }

      this.loading = false;
    },
  },
}
</script>

<style lang="scss" scoped>
.newpassword-main {
  a {
    text-decoration: none !important;
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      text-decoration: underline !important;
      color: rgba(255, 255, 255, 1);
    }
  }
}

.newpassword-wrapper {
  max-height: calc(100vh - var(--app-bar-top-offset, 64px) - 24px);
  max-height: calc(100dvh - var(--app-bar-top-offset, 64px) - 24px);
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.newpassword-card {
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 32px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.newpassword-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  margin: 0 0 16px 0;
}

.newpassword-description {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.newpassword-form {
  gap: 4px;

  .v-text-field {
    margin-bottom: 4px;
  }
}

.newpassword-btn {
  width: 100%;
  min-height: 44px;
  margin-top: 16px !important;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.newpassword-back-link {
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
  .newpassword-main {
    padding-top: 24px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  .newpassword-wrapper {
    max-height: calc(100dvh - var(--app-bar-height, 64px) - 24px);
    padding-left: 4px !important;
    padding-right: 4px !important;
  }

  .newpassword-card {
    padding: 24px 20px;
  }

  .newpassword-title {
    font-size: 1.25rem;
    margin-bottom: 12px;
  }

  .newpassword-description {
    font-size: 0.875rem;
    margin-bottom: 20px;
  }
}
</style>
