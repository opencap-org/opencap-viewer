<template>
  
      <div id="container" class="container d-flex justify-content-center text-center">
        <div class="register-card p-3 mx-auto">
          <h1 class="white--text text-center col-md-12">Register</h1>

            <ValidationObserver
              tag="div"
              class="d-flex flex-column"
              ref="observer"
              v-slot="{ invalid }">

              <div class="row">

                <div class="col-md-12">
                  <div class="form-outline">
                      <ValidationProvider rules="required" v-slot="{ errors }" name="Login">
                        <v-text-field
                          label="Username"
                          v-model="username"
                          class="ma-0"
                          dark
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
                        class="ma-0"
                        dark
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
                        class="ma-0"
                        dark
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
                        class="ma-0"
                        dark
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
                <div class="col-md-6 pb-2">

                  <div class="form-outline">
                    <ValidationProvider
                      rules="required"
                      v-slot="{ errors }"
                      name="Institution">
                      <v-text-field
                        label="Institution"
                        v-model="institution"
                        class="ma-0"
                        dark
                        :error="errors.length > 0"
                        :error-messages="errors[0]"/>
                    </ValidationProvider>
                  </div>

                </div>
                <div class="col-md-6 pb-2">

                  <div class="form-outline">
                    <ValidationProvider
                      rules="required"
                      v-slot="{ errors }"
                      name="Profession">
                      <v-text-field
                        label="Profession"
                        v-model="profession"
                        class="ma-0"
                        dark
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
                    class="ma-0"
                    dark
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
                    class="ma-0"
                    dark
                    :error="errors.length > 0"
                    :error-messages="errors[0]"/>
                </ValidationProvider>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 pb-2">

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
                        class="ma-0"
                        dark
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
                <div class="col-md-6 pb-2">

                  <div class="form-outline">
                    <ValidationProvider
                      rules="required|confirmed:password"
                      v-slot="{ errors }"
                      name="Confirm password">
                      <v-text-field
                        v-model="confirmPassword"
                        label="Confirm password"
                        class="ma-0"
                        dark
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

              <div class="row">
                <div class="col-12">
                  <v-checkbox
                    v-model="newsletter"
                    label="Sign up to receive our newsletter"
                  ></v-checkbox>
                </div>
                <div class="col-12 pb-0">
                  <ValidationProvider :rules="{ required: {allowFalse: false}}" v-slot="{ errors }" name="Terms and Conditions agreement selection">
                    <v-checkbox v-model="terms" class="mt-0 mb-0"
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
                <div class="col-12 pt-0 pb-0">
                  <ValidationProvider :rules="{ required: {allowFalse: false}}" v-slot="{ errors }" name="Privacy Policy agreement selection">
                    <v-checkbox v-model="privacy" class="mt-0 mb-0"
                                :error="errors.length > 0"
                                :error-messages="errors[0]">
                      <template v-slot:label>
                        <div>I confirm that I have read and agree to the the
                          <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                              <a href="https://docs.google.com/document/d/1DBw9LVAuUwgz713037VQjsaD8sj2-AN_hzga_7kXtXI"
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
                <div class="col-12 pt-0">
                  <ValidationProvider :rules="{ required: {allowFalse: false}}" v-slot="{ errors }" name="Non-profit use agreement selection">
                    <v-checkbox v-model="nonprofit" class="mt-0 mb-0"
                                :error="errors.length > 0"
                                :error-messages="errors[0]">
                      <template v-slot:label>
                        <div>I confirm that I am using OpenCap for academic or non-profit organization non-commercial research or educational use only and that my use of OpenCap is in compliance with the relevant privacy, security, and human subjects research regulations in my location.</div>
                      </template>
                    </v-checkbox>
                  </ValidationProvider>
                </div>
              </div>

              <div class="pt-2">
                <v-btn
                  type="submit"
                  class="white--text mx-0 align-self-center mb-6"
                  :disabled="(submitted && invalid) || loading"
                  @click="onRegister()"
                  >Register</v-btn
                >
              </div>
            </ValidationObserver>

            <router-link class="text-center mt-6" :to="{ name: 'Login' }"
              >Back to Login</router-link
            >
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

<style lang="scss">
#container {
  overflow-y: scroll;
  max-height: calc(100vh - var(--app-bar-top-offset, 64px) - 24px);
  max-height: calc(100dvh - var(--app-bar-top-offset, 64px) - 24px);
  -ms-overflow-style: none;
  scrollbar-width: none;
}
#container::-webkit-scrollbar{
  display: none; // Hide in chrome, safari and edge.
}
#container button {
  width: 100%;
  max-width: 260px;
}

.register-card {
  width: 100%;
  max-width: 960px;
}

.vue-country-select .country-name {
  color: hsla(0,0%,100%,.7) !important;
}
div.dropdown.open {
  background-color: black !important;
}
.vue-country-select .country-name:hover {
  color: hsla(0,0%,100%,.7) !important;
}
.dropdown:hover {
  background-color: black !important;
}
li.dropdown-item {
  background-color: black !important;
}
li.dropdown-item:hover {
  background-color: rgb(46, 46, 46) !important;
}
li.dropdown-item > strong {
  font-weight: normal !important;
  color: hsla(0,0%,100%,.7);
}
.vue-country-select {
  width: 100%;
  border-color: hsla(0,0%,100%,.7) !important;
}
.vue-country-select:hover {
  width: 100%;
  border-color: white !important;
}
.vue-country-select:focus {
  width: 100%;
  border-color: white !important;
}
.vue-country-select:active {
  width: 100%;
  border-color: white !important;
}
li.dropdown-item > span {
  display: none;
}
.show-pass-icon {
  width: auto;
}

@media (max-width: 959px) {
  #container {
    max-height: calc(100dvh - var(--app-bar-height, 64px) - 24px);
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  .register-card {
    max-width: 100%;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
}

@media (max-width: 599px) {
  #container button {
    max-width: none;
  }

  #container .row {
    margin-left: 0;
    margin-right: 0;
  }

  #container [class*='col-'] {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
