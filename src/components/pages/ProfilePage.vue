<template>
  <div class="d-flex flex-column profile-page-wrapper">
    <div class="profile-page-inner pa-4 pa-md-6">
      <div class="container profile-container">

        <div v-if="userExist">

        <div v-if="!editing_profile && !editing_settings" class="profile-view">
          <div class="row">
            <div class="col-lg-4 col-12 mb-4 mb-lg-0">
              <v-card class="profile-card profile-sidebar elevation-0">
                <div class="profile-avatar-section">
                  <div class="profile-avatar-wrapper">
                    <v-img
                      :src="current_user_page_profile_url"
                      alt="Profile Picture"
                      class="profile-avatar">
                    </v-img>
                    <v-btn
                      v-if="editable"
                      class="profile-avatar-edit"
                      icon
                      small
                      @click="handleChangeImage">
                      <v-icon small>mdi-camera</v-icon>
                    </v-btn>
                  </div>
                  <h2 class="profile-username" @click="handleShareProfileClick">
                    {{ username_param }}
                    <v-icon small class="profile-share-icon">mdi-share-variant</v-icon>
                  </h2>
                  <p v-if="institution" class="profile-institution">{{ institution }}</p>
                  <a
                    v-if="email"
                    :href="'mailto:' + email"
                    target="_blank"
                    class="profile-contact-link"
                    rel="noreferrer">
                    <v-icon small>mdi-email-outline</v-icon>
                    Contact
                  </a>
                </div>
                <div v-if="editable" class="profile-actions">
                  <v-btn
                    block
                    outlined
                    class="profile-action-btn mb-2"
                    @click="handleEditProfile">
                    Edit Profile
                  </v-btn>
                  <v-btn
                    block
                    outlined
                    class="profile-action-btn mb-0"
                    @click="handleEditSettings">
                    Settings
                  </v-btn>
                </div>
              </v-card>
            </div>

            <div class="col-lg-8 col-12">
              <v-card class="profile-card profile-details elevation-0">
                <v-card-title class="profile-details-title">Profile Information</v-card-title>
                <v-card-text class="profile-details-content">
                  <div class="profile-info-row">
                    <span class="profile-info-label">
                      <v-icon x-small class="profile-info-icon">mdi-account</v-icon>
                      Full Name
                    </span>
                    <span class="profile-info-value">{{ first_name }} {{ last_name }}</span>
                  </div>
                  <div v-if="profession" class="profile-info-row">
                    <span class="profile-info-label">
                      <v-icon x-small class="profile-info-icon">mdi-briefcase-outline</v-icon>
                      Profession
                    </span>
                    <span class="profile-info-value">{{ profession }}</span>
                  </div>
                  <div v-if="website" class="profile-info-row">
                    <span class="profile-info-label">
                      <v-icon x-small class="profile-info-icon">mdi-web</v-icon>
                      Website
                    </span>
                    <a :href="websiteHref" target="_blank" class="profile-info-link">{{ website }}</a>
                  </div>
                  <div v-if="reason_of_use" class="profile-info-row">
                    <span class="profile-info-label">
                      <v-icon x-small class="profile-info-icon">mdi-information-outline</v-icon>
                      Reason of use
                    </span>
                    <span class="profile-info-value">{{ reason_of_use }}</span>
                  </div>
                  <div v-if="country" class="profile-info-row">
                    <span class="profile-info-label">
                      <v-icon x-small class="profile-info-icon">mdi-map-marker-outline</v-icon>
                      Country
                    </span>
                    <span class="profile-info-value">{{ country }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </div>

        <div v-else-if="editing_profile" class="profile-edit-view">
          <v-card class="profile-card profile-edit-card elevation-0">
            <v-card-title class="profile-edit-title">
              <v-icon left>mdi-pencil</v-icon>
              Edit Profile
            </v-card-title>
            <v-card-text>
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
                    <div class="col-12">
                      <div class="form-outline">
                        <ValidationProvider
                          rules="required|email"
                          v-slot="{ errors }"
                          vid="emailField"
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
                  </div>

                  <div class="row" v-if="email !== original_email">
                    <div class="col-12">
                      <div class="form-outline">
                        <ValidationProvider
                          rules="required|confirmed:emailField"
                          v-slot="{ errors }"
                          name="Confirm Email">
                          <v-text-field
                            label="Confirm new email"
                            v-model="confirm_email"
                            class="ma-0"
                            dark
                            @paste.prevent
                            :error="errors.length > 0"
                            :error-messages="errors[0]"/>
                        </ValidationProvider>
                      </div>
                    </div>
                  </div>

                  <div class="row">
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

                  <div class="profile-edit-actions">
                    <v-btn
                      type="submit"
                      outlined
                      :disabled="(submitted && invalid) || loading"
                      :loading="loading"
                      @click="onChangeProfile()">
                      Save Changes
                    </v-btn>
                    <router-link
                      class="profile-edit-discard"
                      @click.native="handleDiscard"
                      :to="{ name: 'ProfilePage', params: { username: username_param } }">
                      Discard
                    </router-link>
                  </div>
                </ValidationObserver>
            </v-card-text>
          </v-card>
        </div>

        <div v-else-if="editing_settings" class="profile-settings-view">
          <v-card class="profile-card profile-settings-card elevation-0">
            <v-card-title class="profile-settings-title">
              <v-icon left>mdi-cog</v-icon>
              Settings
            </v-card-title>
            <v-card-text>
              <div class="profile-settings-section">
                <v-switch
                  v-model="isAuditoryFeedbackEnabled"
                  @change="updateLocalStorage"
                  label="Enable Voice Auditory Feedback"
                  hint="Audio updates for start and completion events"
                  persistent-hint
                  color="primary"
                  class="profile-settings-switch"
                />
              </div>
              <v-divider class="my-4" />
              <div class="profile-settings-section profile-settings-danger">
                <p class="profile-settings-warning">
                  Remove your account and all associated data. This includes every session, trial, subject, and result that you have ever created. This process is irreversible.
                </p>
                <v-btn
                  v-if="editable"
                  outlined
                  color="error"
                  class="mt-2"
                  @click="handleOpenDeleteAccount">
                  <v-icon left small>mdi-delete-outline</v-icon>
                  Delete Account
                </v-btn>
              </div>
              <router-link
                class="profile-settings-back"
                @click.native="handleFinished"
                :to="{ name: 'ProfilePage', params: { username: username_param } }">
                <v-icon small left>mdi-arrow-left</v-icon>
                Back to Profile
              </router-link>
            </v-card-text>
          </v-card>
        </div>

          <div v-if="deletingAccount" class="profile-popup" @click="handleDiscardDeleteAccount">
            <div class="profile-popup-content profile-popup-danger" @click.stop>
              <div class="profile-popup-header">
                <v-icon color="error" large>mdi-alert-circle-outline</v-icon>
                <h2 class="profile-popup-title">Delete Account</h2>
              </div>
              <p class="profile-popup-text">
                <strong class="error--text">WARNING:</strong> This action will permanently remove your account and all associated data, including every session, trial, subject, and result you have ever created. This process is irreversible.
              </p>
              <p class="profile-popup-text">Type your username below to confirm:</p>
              <ValidationProvider
                rules="required"
                v-slot="{ errors }"
                name="delete-user-confirm">
                <v-text-field
                  label="Username"
                  v-model="confirm_username"
                  outlined
                  dense
                  :error="errors.length > 0"
                  :error-messages="errors[0]"
                  class="mb-3"
                />
              </ValidationProvider>
              <div class="profile-popup-actions">
                <v-btn color="error" @click="handleDeleteAccount" :disabled="confirm_username !== username_param">
                  Delete Account
                </v-btn>
                <span class="profile-popup-cancel" @click="handleDiscardDeleteAccount">Cancel</span>
              </div>
            </div>
          </div>

          <div v-if="changingImage" class="profile-popup" @click="handleDiscard">
            <div class="profile-popup-content" @click.stop>
              <h2 class="profile-popup-title">Change Profile Photo</h2>
              <div class="profile-image-upload-area">
                <v-img
                  v-if="selectedImage"
                  :src="selectedImage"
                  class="profile-image-preview"
                  alt="Preview"
                />
                <div v-else class="profile-image-placeholder">
                  <v-icon size="64">mdi-account-circle</v-icon>
                  <span>No image selected</span>
                </div>
              </div>
              <input
                ref="fileInput"
                class="profile-file-input"
                type="file"
                @change="handleImageUploaded"
                accept="image/*"
              />
              <v-btn outlined class="mb-2" @click="triggerFileInput">
                <v-icon left small>mdi-upload</v-icon>
                Choose Image
              </v-btn>
              <div class="profile-popup-actions">
                <v-btn outlined :loading="loading" :disabled="!selectedImage" @click="handleSaveImage">
                  Save
                </v-btn>
                <span class="profile-popup-cancel" @click="handleDiscard">Cancel</span>
              </div>
            </div>
          </div>

        </div>

        <div v-else class="profile-not-found">
          <v-card class="profile-card elevation-0">
            <v-card-text class="text-center py-8">
              <v-icon size="64" color="grey" class="mb-4">mdi-account-off-outline</v-icon>
              <p class="text-h6 mb-0">User "{{ username_param }}" not found</p>
            </v-card-text>
          </v-card>
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
    websiteHref() {
      if (!this.website) return '';
      return /^https?:\/\//i.test(this.website) ? this.website : `https://${this.website}`;
    },
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
      confirm_email: '',
      original_email: '',
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
      this.email = this.original_email;
      this.confirm_email = '';
      document.body.removeEventListener('click', this.closePopupOnClickOutside);
    },
    handleDiscardDeleteAccount() {
      this.deletingAccount = false;
      document.body.removeEventListener('click', this.closePopupOnClickOutside);
    },
    handleChangeImage() {
      this.changingImage = true;
      if (this.changingImage) {
        document.body.addEventListener('click', this.closePopupOnClickOutside);
      } else {
        document.body.removeEventListener('click', this.closePopupOnClickOutside);
      }
    },
    triggerFileInput() {
      this.$refs.fileInput && this.$refs.fileInput.click();
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
        this.original_email = res.data.email;
        this.confirm_email = '';
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

          this.original_email = this.email;
          this.confirm_email = '';
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

<style scoped>
.profile-page-wrapper {
  width: 100%;
  min-height: calc(100vh - var(--app-bar-height, 64px));
  min-height: calc(100dvh - var(--app-bar-height, 64px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.profile-page-inner {
  max-width: 960px;
  margin: 0 auto;
}

.profile-container {
  max-width: 100%;
}

/* Profile cards */
.profile-card {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.profile-sidebar {
  padding: 24px;
  height: 100%;
}

.profile-avatar-section {
  text-align: center;
  padding-bottom: 16px;
}

.profile-avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 120px !important;
  height: 120px !important;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.12);
}

.profile-avatar-edit {
  position: absolute !important;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6) !important;
}

.profile-username {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.profile-username:hover {
  opacity: 0.9;
}

.profile-share-icon {
  opacity: 0.7;
}

.profile-institution {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0 0 12px 0;
}

.profile-contact-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 0.9rem;
}

.profile-contact-link:hover {
  text-decoration: underline;
}

.profile-actions {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.profile-action-btn {
  width: 100% !important;
  min-width: 0 !important;
  flex: 0 0 auto;
}

/* Profile details */
.profile-details {
  padding: 24px;
}

.profile-details-title {
  font-size: 1rem;
  font-weight: 600;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.profile-details-content {
  padding-top: 20px !important;
}

.profile-info-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  gap: 12px;
}

.profile-info-row:last-child {
  border-bottom: none;
}

.profile-info-label {
  flex: 0 0 140px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.profile-info-icon {
  opacity: 0.8;
}

.profile-info-value {
  flex: 1;
  min-width: 0;
  color: rgba(255, 255, 255, 0.95);
}

.profile-info-link {
  flex: 1;
  color: rgb(144, 202, 249);
  text-decoration: none;
}

.profile-info-link:hover {
  text-decoration: underline;
}

/* Edit profile */
.profile-edit-view,
.profile-settings-view {
  max-width: 600px;
  margin: 0 auto;
}

.profile-edit-card,
.profile-settings-card {
  padding: 24px;
}

.profile-edit-title,
.profile-settings-title {
  font-size: 1.25rem;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.profile-edit-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
}

.profile-edit-discard {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 0.9rem;
}

.profile-edit-discard:hover {
  color: rgba(255, 255, 255, 0.9);
}

/* Settings */
.profile-settings-section {
  margin-bottom: 8px;
}

.profile-settings-switch {
  margin: 0;
}

.profile-settings-danger {
  margin-top: 16px;
}

.profile-settings-warning {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.profile-settings-back {
  display: inline-flex;
  align-items: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
}

.profile-settings-back:hover {
  color: rgba(255, 255, 255, 0.95);
}

/* Popups */
.profile-popup {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 16px;
}

.profile-popup-content {
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.profile-popup-danger {
  border-color: rgba(244, 67, 54, 0.3);
}

.profile-popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.profile-popup-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.profile-popup-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.profile-popup-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.profile-popup-cancel {
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 0.9rem;
}

.profile-popup-cancel:hover {
  color: rgba(255, 255, 255, 0.9);
}

.profile-image-upload-area {
  width: 160px;
  height: 160px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.profile-image-preview {
  width: 100% !important;
  height: 100% !important;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3) !important;
}

.profile-image-upload-area ::v-deep .v-image {
  background: rgba(0, 0, 0, 0.3) !important;
}

.profile-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.profile-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.profile-not-found {
  max-width: 480px;
  margin: 0 auto;
}
</style>

<style>
.v-main:has(.profile-page-wrapper) {
  overflow: visible;
}

/* vue-country-dropdown dark theme for Edit Profile */
.profile-page-wrapper .vue-country-select .country-name {
  color: hsla(0, 0%, 100%, 0.7) !important;
}
.profile-page-wrapper div.dropdown.open {
  background-color: black !important;
}
.profile-page-wrapper .vue-country-select .country-name:hover {
  color: hsla(0, 0%, 100%, 0.7) !important;
}
.profile-page-wrapper .dropdown:hover {
  background-color: black !important;
}
.profile-page-wrapper li.dropdown-item {
  background-color: black !important;
}
.profile-page-wrapper li.dropdown-item:hover {
  background-color: rgb(46, 46, 46) !important;
}
.profile-page-wrapper li.dropdown-item > strong {
  font-weight: normal !important;
  color: hsla(0, 0%, 100%, 0.7);
}
.profile-page-wrapper .vue-country-select {
  width: 100%;
  border-color: hsla(0, 0%, 100%, 0.7) !important;
}
.profile-page-wrapper .vue-country-select:hover {
  border-color: white !important;
}
.profile-page-wrapper .vue-country-select:focus,
.profile-page-wrapper .vue-country-select:active {
  border-color: white !important;
}
.profile-page-wrapper li.dropdown-item > span {
  display: none;
}
</style>
