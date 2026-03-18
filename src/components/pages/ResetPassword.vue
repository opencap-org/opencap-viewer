<template>
  <v-layout class="reset-main" ma-0 pa-3 row justify-center align-start fill-height>
    <v-flex
      xs12 sm6 md4 lg4 xl3 pa-3
      class="reset-wrapper d-flex flex-column align-stretch scroll-y">

      <div class="reset-card">
        <h1 class="reset-title">Retrieve username and/or change password</h1>

        <p class="reset-description">
          If your email exists in our database, we will send you an email with your username and a link to change your password.
        </p>

        <ValidationObserver
          tag="div"
          class="reset-form d-flex flex-column"
          ref="observer"
          v-slot="{ invalid }">

          <ValidationProvider
            rules="required|email"
            v-slot="{ errors }"
            name="Email">
            <v-text-field
              label="Email"
              v-model="email"
              dark
              outlined
              dense
              :error="errors.length > 0"
              :error-messages="errors[0]"/>
          </ValidationProvider>

          <v-btn
            type="submit"
            class="reset-btn"
            :loading="loading"
            :disabled="(submitted && invalid) || loading"
            @click="onReset()">Send Email</v-btn>
        </ValidationObserver>

        <router-link class="reset-back-link" :to="{ name: 'Login' }" @click="clearToasted">
          <v-icon size="18" class="back-arrow">mdi-arrow-left</v-icon>
          Back to Login
        </router-link>
      </div>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapActions, mapState } from "vuex";
import { apiSuccess, apiError, clearToastMessages } from "@/util/ErrorMessage.js";

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
      clearToastMessages()
    }
  }
}

</script>

<style lang="scss" scoped>
.reset-main {
  a {
    text-decoration: none !important;
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      text-decoration: underline !important;
      color: rgba(255, 255, 255, 1);
    }
  }
}

.reset-wrapper {
  max-height: calc(100vh - var(--app-bar-top-offset, 64px) - 24px);
  max-height: calc(100dvh - var(--app-bar-top-offset, 64px) - 24px);
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.reset-card {
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 32px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.reset-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  margin: 0 0 16px 0;
}

.reset-description {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.reset-form {
  gap: 4px;

  .v-text-field {
    margin-bottom: 4px;
  }
}

.reset-btn {
  width: 100%;
  min-height: 44px;
  margin-top: 16px !important;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.reset-back-link {
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
  .reset-main {
    padding-top: 24px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  .reset-wrapper {
    max-height: calc(100dvh - var(--app-bar-height, 64px) - 24px);
    padding-left: 4px !important;
    padding-right: 4px !important;
  }

  .reset-card {
    padding: 24px 20px;
  }

  .reset-title {
    font-size: 1.25rem;
    margin-bottom: 12px;
  }

  .reset-description {
    font-size: 0.875rem;
    margin-bottom: 20px;
  }
}
</style>
