<template>
  <div class="register-main">
    <div class="register-container">
      <div class="register-card">
        <h1 class="register-title">Register</h1>

        <ValidationObserver
          tag="div"
          class="register-form d-flex flex-column"
          ref="observer"
          v-slot="{ invalid }">

              <div class="row">

                <div class="col-md-12">
                  <div class="form-outline">
                      <ValidationProvider rules="required" v-slot="{ errors }" name="Login">
                        <v-text-field
                          label="Username"
                          v-model="username"
                          dark
                          outlined
                          dense
                          :error="errors.length > 0"
                          :error-messages="errors[0]"
                        />
                      </ValidationProvider>
                  </div>
                </div>

              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="form-outline">
                    <ValidationProvider
                      rules="required"
                      v-slot="{ errors }"
                      name="First name">
                      <v-text-field
                        label="First name"
                        v-model="first_name"
                        dark
                        outlined
                        dense
                        :error="errors.length > 0"
                        :error-messages="errors[0]"/>
                    </ValidationProvider>
                  </div>
                </div>

                <div class="col-md-6">

                  <div class="form-outline">
                    <ValidationProvider
                      rules="required"
                      v-slot="{ errors }"
                      name="Last name">
                      <v-text-field
                        label="Last name"
                        v-model="last_name"
                        dark
                        outlined
                        dense
                        :error="errors.length > 0"
                        :error-messages="errors[0]"/>
                    </ValidationProvider>

                  </div>

                </div>
              </div>

              <div class="row">
                <div class="col-md-6 d-flex align-items-center">
                  <div class="form-outline datepicker w-100">
                    <ValidationProvider
                      rules="required|email"
                      v-slot="{ errors }"
                      name="Email">
                      <v-text-field
                        label="Email (will be used for two-factor authentication)"
                        v-model="email"
                        dark
                        outlined
                        dense
                        :error="errors.length > 0"
                        :error-messages="errors[0]"/>
                    </ValidationProvider>
                  </div>

                </div>
                <div class="col-md-6">
                 <vue-country-dropdown
                    ref="vcd"
                    @onSelect="onSelectCountry"
                    :preferredCountries="['US']"
                    :defaultCountry="'US'"
                    :immediateCallSelectEvent="true"
                    :enabledFlags="true"
                    :enabledCountryCode="false"
                    :showNameInput="true">
                  </vue-country-dropdown>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="form-outline">
                    <ValidationProvider
                      rules="required"
                      v-slot="{ errors }"
                      name="Institution">
                      <v-text-field
                        label="Institution"
                        v-model="institution"
                        dark
                        outlined
                        dense
                        :error="errors.length > 0"
                        :error-messages="errors[0]"/>
                    </ValidationProvider>
                  </div>

                </div>
                <div class="col-md-6">
                  <div class="form-outline">
                    <ValidationProvider
                      rules="required"
                      v-slot="{ errors }"
                      name="Profession">
                      <v-text-field
                        label="Profession"
                        v-model="profession"
                        dark
                        outlined
                        dense
                        :error="errors.length > 0"
                        :error-messages="errors[0]"/>
                    </ValidationProvider>
                  </div>

                </div>
              </div>

              <div class="row">
                <div class="col-12">
                  <ValidationProvider rules="required" v-slot="{ errors }" name="Reason">
                  <v-text-field
                    label="Reason for use"
                    v-model="reason"
                    dark
                    outlined
                    dense
                    :error="errors.length > 0"
                    :error-messages="errors[0]"/>
                </ValidationProvider>
                </div>
              </div>

              <div class="row">
                <div class="col-12">
                  <ValidationProvider v-slot="{ errors }" name="Website">
                  <v-text-field
                    label="Website"
                    v-model="website"
                    dark
                    outlined
                    dense
                    :error="errors.length > 0"
                    :error-messages="errors[0]"/>
                </ValidationProvider>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="form-outline">
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
                        outlined
                        dense
                        :error="errors.length > 0"
                        :error-messages="errors[0]"
                        :append-icon="show_password ? 'mdi-eye' : 'mdi-eye-off'"
                        :type="show_password ? 'text' : 'password'"
                        @click:append="show_password = !show_password">
                        <!-- Add tabindex="-1" to the show password icon -->
                        <template v-slot:append>
                          <v-icon
                            class="show-pass-icon"
                            :tabindex="-1"
                            @click="show_password = !show_password"
                          >
                            {{ show_password ? 'mdi-eye' : 'mdi-eye-off' }}
                          </v-icon>
                        </template>
                       </v-text-field>
                    </ValidationProvider>
                  </div>

                </div>
                <div class="col-md-6">
                  <div class="form-outline">
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
                        @click:append="show_confirm_password = !show_confirm_password">

                        <!-- Add tabindex="-1" to the show password icon -->
                        <template v-slot:append>
                          <v-icon
                            class="show-pass-icon"
                            :tabindex="-1"
                            @click="show_confirm_password = !show_confirm_password"
                          >
                            {{ show_confirm_password ? 'mdi-eye' : 'mdi-eye-off' }}
                          </v-icon>
                        </template>
                       </v-text-field>
                    </ValidationProvider>
                  </div>

                </div>
              </div>

              <div class="row register-checkbox-row">
                <div class="col-12">
                  <v-checkbox
                    v-model="newsletter"
                    label="Sign up to receive our newsletter"
                    dark
                    hide-details
                    class="register-checkbox"
                  ></v-checkbox>
                </div>
                <div class="col-12">
                  <ValidationProvider :rules="{ required: {allowFalse: false}}" v-slot="{ errors }" name="Terms and Conditions agreement selection">
                    <v-checkbox v-model="terms"
                                dark
                                class="register-checkbox"
                                :error="errors.length > 0"
                                :error-messages="errors[0]">
                      <template v-slot:label>
                        <div>I confirm that I have read and agree to the
                          <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                              <a href="https://www.opencap.ai/terms-conditions"
                                 target="_blank"
                                 v-bind="props"
                                 @click.stop>Terms and Conditions</a>
                            </template>
                            Opens in new window
                          </v-tooltip>
                          of OpenCap.
                        </div>
                      </template>
                    </v-checkbox>
                  </ValidationProvider>
                </div>
                <div class="col-12">
                  <ValidationProvider :rules="{ required: {allowFalse: false}}" v-slot="{ errors }" name="Privacy Policy agreement selection">
                    <v-checkbox v-model="privacy"
                                dark
                                class="register-checkbox"
                                :error="errors.length > 0"
                                :error-messages="errors[0]">
                      <template v-slot:label>
                        <div>I confirm that I have read and agree to the
                          <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                              <a href="https://docs.google.com/document/d/1HGp_BoW9H5mFfcE8NkP7QykcgxF7t-RGb4FtOJzNA4M"
                                 target="_blank"
                                 v-bind="props"
                                 @click.stop>Privacy Policy</a>
                            </template>
                            Opens in new window
                          </v-tooltip>
                          of OpenCap.
                        </div>
                      </template>
                    </v-checkbox>
                  </ValidationProvider>
                </div>
                <div class="col-12">
                  <ValidationProvider :rules="{ required: {allowFalse: false}}" v-slot="{ errors }" name="Non-profit use agreement selection">
                    <v-checkbox v-model="nonprofit"
                                dark
                                class="register-checkbox"
                                :error="errors.length > 0"
                                :error-messages="errors[0]">
                      <template v-slot:label>
                        <div>I confirm that I am using OpenCap for academic or non-profit organization non-commercial research or educational use only and that my use of OpenCap is in compliance with the relevant privacy, security, and human subjects research regulations in my location.</div>
                      </template>
                    </v-checkbox>
                  </ValidationProvider>
                </div>
              </div>

              <v-btn
                type="submit"
                class="register-btn"
                :loading="loading"
                :disabled="(submitted && invalid) || loading"
                @click="onRegister()">Register</v-btn>
            </ValidationObserver>

            <router-link class="register-back-link" :to="{ name: 'Login' }">
              <v-icon size="18" class="back-arrow">mdi-arrow-left</v-icon>
              Back to Login
            </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import { apiSuccess, apiError } from "@/util/ErrorMessage.js";
import VueCountryDropdown from 'vue-country-dropdown'

export default {
  name: "Register",
  components: {
    VueCountryDropdown
  },
  data() {
    return {
      loading: false,
      submitted: false,
      username: "",
      first_name: "",
      last_name: "",
      country: "",
      email: "",
      institution: "",
      profession: "",
      reason: "",
      website: "",
      password: "",
      confirmPassword: "",
      newsletter: true,
      terms: false,
      privacy: false,
      nonprofit: false,
      show_password: false,
      show_confirm_password: false,
    };
  },
  computed: {
    ...mapState({
      sessions: (state) => state.data.sessions,
    }),
  },
  methods: {
    ...mapActions("auth", ["register"]),
    async onRegister() {
      this.loading = true;

      try {
        this.submitted = true;

        if (await this.$refs.observer.validate()) {
          await this.register({
            username: this.username,
            email: this.email,
            password: this.password,
            institution: this.institution,
            reason: this.reason,
            website: this.website,
            first_name: this.first_name,
            last_name: this.last_name,
            newsletter: this.newsletter,
            country: this.country,
            profession: this.profession
          });

          apiSuccess("New user successfully created");

          this.$router.push({ name: "Login" });
        }
      } catch (error) {
        apiError(error, "registering new user");
      }

      this.loading = false;
    },
    onSelectCountry({name, iso2, dialCode}) {
        this.country = name;
    },
  },
};
</script>

<style lang="scss" scoped>
.register-main {
  min-height: 100%;
  padding: 24px 16px;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  a {
    text-decoration: none !important;
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      text-decoration: underline !important;
      color: rgba(255, 255, 255, 1);
    }
  }
}

.register-container {
  width: 100%;
  max-width: 960px;
  max-height: calc(100vh - var(--app-bar-top-offset, 64px) - 24px);
  max-height: calc(100dvh - var(--app-bar-top-offset, 64px) - 24px);
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.register-card {
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.register-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  margin: 0 0 16px 0;
}

.register-form {
  .row {
    margin-bottom: 0;
  }

  .row + .row {
    margin-top: 6px;
  }

  [class*='col-'] {
    padding-top: 0;
    padding-bottom: 0;
  }

  .form-outline {
    margin-bottom: 0;
  }

  .v-text-field {
    margin-bottom: 0;
  }

  .v-input {
    padding-top: 0;
    margin-bottom: 0;
  }

  .row .col-md-6 + .col-md-6 .v-text-field,
  .row .col-md-6 + .col-md-6 .vue-country-select,
  .row .col-12 .v-text-field {
    margin-top: 0;
  }

  .register-checkbox-row .col-12 + .col-12 {
    margin-top: 10px;
  }

  .register-checkbox-row .col-12 {
    padding-top: 0;
    padding-bottom: 0;
  }

  .v-input--checkbox {
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .v-input--checkbox a {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: underline;
  }

  // Align checkbox to top instead of center (for multi-line labels)
  .register-checkbox :deep(.v-input__control) {
    align-items: flex-start;
  }
}

.register-btn {
  width: 100%;
  min-height: 44px;
  margin-top: 12px !important;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.register-back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.9375rem;

  .back-arrow {
    flex-shrink: 0;
  }
}

// Vue country dropdown - needs :deep for child components
:deep(.vue-country-select) .country-name {
  color: hsla(0,0%,100%,.7) !important;
}
:deep(div.dropdown.open) {
  background-color: black !important;
}
:deep(.vue-country-select .country-name:hover) {
  color: hsla(0,0%,100%,.7) !important;
}
:deep(.dropdown:hover) {
  background-color: black !important;
}
:deep(li.dropdown-item) {
  background-color: black !important;
}
:deep(li.dropdown-item:hover) {
  background-color: rgb(46, 46, 46) !important;
}
:deep(li.dropdown-item > strong) {
  font-weight: normal !important;
  color: hsla(0,0%,100%,.7);
}
:deep(.vue-country-select) {
  width: 100%;
  border-color: hsla(0,0%,100%,.7) !important;
}
:deep(.vue-country-select:hover) {
  border-color: white !important;
}
:deep(.vue-country-select:focus) {
  border-color: white !important;
}
:deep(.vue-country-select:active) {
  border-color: white !important;
}
:deep(li.dropdown-item > span) {
  display: none;
}
.show-pass-icon {
  width: auto;
}

@media (max-width: 959px) {
  .register-container {
    max-height: calc(100dvh - var(--app-bar-height, 64px) - 24px);
  }
}

@media (max-width: 599px) {
  .register-main {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  .register-card {
    padding: 16px 18px;
  }

  .register-title {
    font-size: 1.25rem;
    margin-bottom: 12px;
  }

  .register-form .row {
    margin-left: 0;
    margin-right: 0;
  }

  .register-form [class*='col-'] {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
