<template>
  <div class="d-flex flex-column profile-page-wrapper">
    <div class="pa-2 d-flex">
      <div class="container">

        <div v-if="userExist">

        <div v-if="!editing_profile && !editing_settings" class="row">
          <div class="col-lg-4">
            <v-card class="d-flex align-center justify-center pb-4">
              <v-row align="center" justify="center">
                <v-col align="center" justify="center">
                  <v-img
                    max-width="50%"
                    :src="current_user_page_profile_url"
                    alt="Profile Picture"
                    class="rounded-circle img-fluid mt-4 mb-8">
                  </v-img>
                  <v-btn v-if="editable" @click="handleChangeImage">Change image</v-btn>
                  <br v-if="editable"/>
                  <button @click="handleShareProfileClick">
                    <v-card-title align="center" justify="center" class="justify-center pb-0">
                      {{ username_param }} <i class="mdi mdi-share ml-1 me-1 vertical-middle"></i>
                    </v-card-title>
                  </button>
                  <v-card-text class="pa-1">
                    {{institution}}
                  </v-card-text>
                  <v-card-text class="pa-1">
                    <a :href="'mailto:' + email" target="_blank" class="link-primary mb-1" rel="noreferrer">
                      <p class="mb-1">
                        <i class="mdi mdi-email-box me-1 vertical-middle"></i>
                          Contact
                      </p>
                    </a>
                  </v-card-text>
                  <v-row align="center" justify="center">
                    <v-btn v-if="editable" class="my-4" @click="handleEditProfile">
                      Edit Profile
                    </v-btn>
                  </v-row>
                  <v-row align="center" justify="center">
                    <v-btn v-if="editable" class="mb-2" @click="handleEditSettings">
                      Settings
                    </v-btn>
                  </v-row>
                </v-col>
              </v-row>
            </v-card>
          </div>

          <div class="col-lg-8">
            <v-card class="d-flex align-center justify-center">
              <v-card-text>

                <v-row>
                  <v-col class="col-lg-4">
                    <strong>
                      <i class="mdi mdi-account me-1 vertical-middle"></i>
                      Full Name
                    </strong>
                  </v-col>
                  <v-col class="col-lg-8">{{ first_name }} {{ last_name }} </v-col>
                </v-row>

                <v-row v-if="profession">
                  <v-col class="col-lg-4">
                    <strong>
                      <i class="mdi mdi-briefcase me-1 vertical-middle"></i>
                      Profession
                    </strong>
                  </v-col>
                  <v-col class="col-lg-8">{{ profession }} </v-col>
                </v-row>

                <v-row v-if="website">
                  <v-col class="col-lg-4">
                    <strong>
                      <i class="mdi mdi-web me-1 vertical-middle"></i>
                      Personal Website
                    </strong>
                  </v-col>
                  <v-col class="col-lg-8">
                    <a :href="website" target="_blank">
                      {{ website }}
                    </a>
                  </v-col>
                </v-row>

                <v-row v-if="reason_of_use">
                  <v-col class="col-lg-4">
                    <strong>
                      <i class="mdi mdi-information me-1 vertical-middle"></i>
                      Reason of use
                    </strong>
                  </v-col>
                  <v-col class="col-lg-8">{{ reason_of_use }} </v-col>
                </v-row>

                <v-row v-if="country">
                  <v-col class="col-lg-4">
                    <strong>
                      <i class="mdi mdi-flag me-1 vertical-middle"></i>
                      Country
                    </strong>
                  </v-col>
                  <v-col class="col-lg-8">{{ country }} </v-col>
                </v-row>

              </v-card-text>
            </v-card>
          </div>
        </div>

        <div v-else-if="editing_profile" class="row">
          <div class="col-lg-12">
            <h1 class="white--text text-center col-md-12">Editing Profile</h1>

              <ValidationObserver
                tag="div"
                class="d-flex flex-column"
                ref="observer"
                v-slot="{ invalid }">

                  <div class="row">
                    <div class="col-md-12">
                      <div class="form-outline">
                        <ValidationProvider rules="required" v-slot="{ errors }" name="Edit">
                          <v-text-field
                            label="Username"
                            v-model="username"
                            class="ma-0"
                            dark
                            v-bind:readonly="true"
                            v-bind:disabled="true"
                            :error="errors.length > 0"
                            :error-messages="errors[0]"/>
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
                            v-bind:readonly="false"
                            v-bind:disabled="false"
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
                        v-bind:defaultCountry="countryCode"
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
                          v-model="reason_of_use"
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
                    <div class="col-12">
                      <v-checkbox
                        v-model="newsletter"
                        label="Sign up to receive our newsletter">
                      </v-checkbox>
                    </div>
                  </div>

                  <div class="pt-2">
                    <v-btn
                      type="submit"
                      class="white--text mx-0 align-self-center mb-6"
                      :disabled="(submitted && invalid) || loading"
                      @click="onChangeProfile()">
                        Save Changes
                    </v-btn>
                  </div>
                </ValidationObserver>

                <router-link class="text-center mt-6" @click.native="handleDiscard" :to="{ name: 'ProfilePage' }">
                  Discard Changes
                </router-link>

          </div>
        </div>

        <div v-else-if="editing_settings" class="row">
          <v-col align="center" justify="center" class="mt-8">

            <v-row align="center" justify="center">
              <p>
                  <label>
                    <input
                      type="checkbox"
                      v-model="isAuditoryFeedbackEnabled"
                      @change="updateLocalStorage"
                    />
                    Enable Voice Auditory Feedback (audio updates for start and completion events).
                  </label>

              </p>
            </v-row>

            <v-row align="center" justify="center">
              <p>
                Remove your account and all associated data. This includes every session, trial, subject, and result that you have ever created. This process is irreversible.
              </p>
            </v-row>
            <v-row align="center" justify="center">
              <v-btn v-if="editable" class="mb-2 red--text" @click="handleOpenDeleteAccount">
                Delete Account
              </v-btn>
            </v-row>
            <v-row align="center" justify="center">
              <router-link class="text-center mt-6" @click.native="handleFinished" :to="{ name: 'ProfilePage' }">
                Go Back
              </router-link>
            </v-row>
          </v-col>
        </div>

          <div v-if="deletingAccount" class="popup" @click="function(){deletingAccount = false;}">
              <div class="popup-content" @click.stop>
                <h2 style="color: #f44336!important;">Delete Account</h2>
                <br/>
                <span style="color: #f44336!important;">WARNING!</span> This action will permanently remove your account and all associated data. 
                <br/>
                This includes every session, trial, subject, and result you have ever created.
                <br/>
                This process is irreversible.
                <br/>
                <br/>
                If you wish to proceed, please type in your username and click on "Delete Account".
                <br/>

                <div class="col-md-12">
                  <div class="form-outline">
                    <ValidationProvider
                      rules="required"
                      v-slot="{ errors }"
                      name="delete-user-confirm">
                      <v-text-field
                        label="Type in your username to confirm the deletion of your account"
                        v-model="confirm_username"
                        class="ma-0"
                        dark
                        :error="errors.length > 0"
                        :error-messages="errors[0]"/>
                    </ValidationProvider>

                    <br/>
                    <v-btn v-if="editable" class="mb-2 red--text" @click="handleDeleteAccount">
                      Delete Account
                    </v-btn>
                  </div>
                </div>

                <br/>
                <router-link class="text-center mt-6" @click.native="handleDiscardDeleteAccount" :to="{ name: 'ProfilePage', params: { username: this.username } }">
                  Do not remove my account
                </router-link>
              </div>
          </div>

          <div v-if="changingImage" class="popup" @click="function(){changingImage = false;}">
              <div class="popup-content" @click.stop>
                <h2>Upload Image</h2>
                <img class="profile-image-preview rounded-circle img-fluid mt-4" v-if="selectedImage" :src="selectedImage" alt="Uploaded Image">
                <br/>
                <input class="profile-file-input" type="file" @change="handleImageUploaded" accept="image/*">
                <br/>
                <v-btn class="my-4" @click="handleSaveImage()">Save Image</v-btn>
                <br/>
                <router-link class="text-center mt-6" @click.native="handleDiscard" :to="{ name: 'ProfilePage', params: { username: this.username } }">
                  Discard Changes
                </router-link>
              </div>
          </div>

        </div>

        <div v-else>
          The user "{{username_param}}" does not exist.
        </div>



      </div>
    </div>
  </div>
</template>

<script>
import VueCountryDropdown from 'vue-country-dropdown'
import allCountries from "@/util/allCountries.js"
import { mapState, mapActions } from 'vuex'
import axios from 'axios'
import { apiSuccess, apiError } from "@/util/ErrorMessage.js";
import { copyProfileUrlToClipboard } from "@/util/CopyUrlToClipboard.js";

export default {
  components: {
    VueCountryDropdown
  },
  computed: {
    ...mapState({
      username: state => state.auth.username,
      profile_picture_url: state => state.auth.profile_picture_url
    }),
  },
  data() {
    return {
      institution: '',
      profession: '',
      fullName: '',
      personalWebsite: '',
      first_name: '',
      last_name: '',
      email: '',
      country: '',
      reason_of_use: '',
      website: '',
      newsletter: '',
      editing_profile: false,
      editing_settings: false,
      loading: false,
      countryCode: '',
      editable: false,
      userExist: true,
      username_param: '',
      changingImage: false,
      deletingAccount: false,
      selectedImage: null,
      profile_picture: null,
      selectedImageFile: null,
      current_user_page_profile_url: '',
      confirm_username: '',
      isAuditoryFeedbackEnabled: false,
    };
  },
  created() {
    // Load the initial value from localStorage
    const storedValue = localStorage.getItem("auditory_feedback");
    this.isAuditoryFeedbackEnabled = storedValue === "true";
  },
  methods: {
    ...mapActions("auth", ["updateProfile", "updateProfilePicture", "set_profile_picture_url", "logout"]),
    handleShareProfileClick() {
      copyProfileUrlToClipboard(this.username_param);
    },
    handleEditProfile() {
      this.editing_profile = true;
    },
    updateLocalStorage() {
      // Update localStorage when the checkbox changes
      localStorage.setItem("auditory_feedback", this.isAuditoryFeedbackEnabled);
    },
    handleEditSettings() {
      this.editing_settings = true;
    },
    handleFinished() {
      this.editing_settings = false;
    },
    handleDiscard() {
      this.editing_profile = false;
      this.editing_settings = false;
      this.changingImage = false;
    },
    handleDiscardDeleteAccount() {
      this.deletingAccount = false;
    },
    handleChangeImage() {
      this.changingImage = true;
      if (this.changingImage) {
        document.body.addEventListener('click', this.closePopupOnClickOutside);
      } else {
        document.body.removeEventListener('click', this.closePopupOnClickOutside);
      }
    },
    async handleOpenDeleteAccount() {
      this.deletingAccount = true;
      if(this.deletingAccount) {
        document.body.addEventListener('click', this.closePopupOnClickOutside);
      } else {
        document.body.removeEventListener('click', this.closePopupOnClickOutside);
      }
    },
    async handleDeleteAccount() {
      console.log(this.confirm_username)
      const formData = new FormData();
      formData.append('username', this.confirm_username);
      try {
        const res = await axios.post('/delete-account/', {"confirm":this.confirm_username})
        apiSuccess(res.data)
        this.logout()
      } catch (error) {
        apiError(error.request.response)
      }
    },
    closePopupOnClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.changingImage = false;
        this.deletingAccount = false;
      }
    },
    handleImageUploaded(event) {
      this.selectedImageFile = event.target.files[0];
      if (this.selectedImageFile) {
        const reader = new FileReader();
        reader.onload = () => {
          this.selectedImage = reader.result;
        };
        reader.readAsDataURL(this.selectedImageFile);
      }
    },
    async handleSaveImage() {
      this.loading = true;

      try {
          const formData = new FormData();
          formData.append('username', this.username);
          formData.append('profile_picture', this.selectedImageFile);

          await this.updateProfilePicture(formData);

          // Fetch data again to update profile picture.
          this.fetchData(this.username);

          apiSuccess("Profile picture updated.");

          this.changingImage = false;
          this.loading = false;
      } catch (error) {
        apiError(error, "updating profile picture.");
      }

      this.loading = false;
    },
    async fetchData (username) {
      // Get username from url
      this.username_param = username

      // If username from url is authenticated user, editable, if not, not editable.
      if (this.username_param !== this.username) {
        this.editable = false;
        this.editing_profile = false;
      } else {
        this.editable = true
      }

      try {
        let res = await axios.post('/get_user_info/', {
          username: this.username_param
        })
        this.institution = res.data.institution;
        this.profession = res.data.profession;
        this.personalWebsite = res.data.personalWebsite;
        this.first_name = res.data.first_name;
        this.last_name = res.data.last_name;
        this.email = res.data.email;
        this.country = res.data.country;
        this.reason_of_use = res.data.reason;
        this.website = res.data.website;
        this.newsletter = res.data.newsletter;
        let countryFound = allCountries.find(country => country.name === this.country)

        if(countryFound)
          this.countryCode = countryFound['iso2'];

        let profile_picture_url_from_server = res.data.profile_picture;

        // If profile picture image is null or undefined, show default image.
        if (profile_picture_url_from_server === undefined || profile_picture_url_from_server === null) {
          // If current user, update profile picture state. If not, not update (so only picture in profile, and not in
          // dropdown, is changed. In this case, we assign and show default image.
          if (this.username_param === this.username) {
            this.set_profile_picture_url({profile_picture_url: '/images/Default_pfp.svg'})
            this.current_user_page_profile_url = '/images/Default_pfp.svg'
          } else {
            this.current_user_page_profile_url = '/images/Default_pfp.svg'
          }
        // If current user, update profile picture state. If not, not update (so only picture in profile, and not in
        // dropdown, is changed. In this case we assign and show user's uploaded profile image.
        } else if (this.username_param === this.username) {
          this.set_profile_picture_url({profile_picture_url: profile_picture_url_from_server})
          this.current_user_page_profile_url = profile_picture_url_from_server
        } else {
          this.current_user_page_profile_url = profile_picture_url_from_server
        }

      } catch (error) {
        if (error.response.status === 404) {
        console.log(error)
          this.userExist = false;
          apiError("The user \"" + this.username_param + "\" does not exist.")
        }
      }
    },
    async onChangeProfile() {
      this.loading = true;

      try {
        if (await this.$refs.observer.validate()) {
          await this.updateProfile({
            username: this.username,
            first_name: this.first_name,
            email: this.email,
            last_name: this.last_name,
            country: this.country,
            institution: this.institution,
            profession: this.profession,
            reason: this.reason_of_use,
            website: this.website,
            newsletter: this.newsletter,
          });

          apiSuccess("Profile updated.");

          this.editing_profile = false;
          this.loading = false;
        }
      } catch (error) {
        apiError(error, "updating profile.");
      }

      this.loading = false;
    },
    onSelectCountry({name, iso2, dialCode}) {
        this.country = name;
        this.countryCode = allCountries.find(country => country.name === this.country)['iso2'];
    },
  },
  watch: {
    '$route.params': {
        handler(newValue) {
            const { username } = newValue

            this.fetchData(username)
        },
        immediate: true,
    }
}
};
</script>

<style>
/* Style your popup as needed */
.popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-content {
  background: #222;
  padding: 20px;
  border-radius: 8px;
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
}

.profile-image-preview {
  width: 20em;
  height: 20em;
  border-radius: 50%;
}

.profile-page-wrapper {
  width: 100%;
  min-height: calc(100vh - var(--app-bar-height, 64px));
  min-height: calc(100dvh - var(--app-bar-height, 64px));
  max-height: calc(100vh - var(--app-bar-height, 64px));
  max-height: calc(100dvh - var(--app-bar-height, 64px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.v-main:has(.profile-page-wrapper) {
  overflow: visible;
}

.profile-file-input::file-selector-button {
  color: #000;
}

.profile-file-input::-webkit-file-upload-button {
  color: #000;
}
</style>
